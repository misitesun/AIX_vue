<template>
    <main ref="videoPage" class="checkin-video-page">
        <!-- 模块一：接口动态视频，不展示接口返回的封面或简介信息。 -->
        <video
            v-if="hasVideo && !useNativeVideo"
            v-show="!hasVideoError"
            ref="videoPlayer"
            class="checkin-video-player"
            :src="videoInfo.video_url"
            loop
            playsinline
            webkit-playsinline
            preload="auto"
            disablepictureinpicture
            controlslist="nodownload noplaybackrate noremoteplayback"
            @canplay="handleCanPlay"
            @playing="startCountdown"
            @pause="pauseCountdown"
            @waiting="pauseCountdown"
            @seeking="pauseCountdown"
            @error="handleVideoError"
            @webkitbeginfullscreen="syncFullscreenState"
            @webkitendfullscreen="syncFullscreenState"
        ></video>

        <section v-if="useNativeVideo || isLoading || !hasVideo || hasVideoError" class="checkin-video-fallback">
            <p v-if="isLoading || (useNativeVideo && !hasVideoError)">{{ $t('加载中 ...') }}</p>
            <template v-else-if="hasVideoError">
                <p>{{ $t('视频播放失败，请稍后重试') }}</p>
                <button type="button" class="checkin-video-retry" @click="retryVideo">
                    {{ $t('重新播放') }}
                </button>
            </template>
            <p v-else>{{ $t('签到视频暂未配置') }}</p>
        </section>

        <!-- 模块二：视频叠层，保证关闭控件在浅色视频上仍清晰可读。 -->
        <div class="checkin-video-vignette" aria-hidden="true"></div>

        <!-- 模块三：到达接口 watch_seconds 后才可关闭；关闭动作触发签到提交。 -->
        <button
            type="button"
            class="checkin-video-close"
            :class="{ 'is-ready': canClose }"
            :aria-label="$t('关闭视频')"
            @click="handleClose"
        >
            <span class="checkin-video-countdown">{{ formattedRemainingSeconds }}</span>
            <span>{{ $t('关闭视频') }}</span>
        </button>

        <!-- 手动切换全屏；容器全屏可保留签到倒计时与关闭入口。 -->
        <button
            v-if="hasVideo && !hasVideoError && fullscreenSupported"
            type="button"
            class="checkin-video-fullscreen"
            :class="{ 'is-active': isFullscreen }"
            :aria-label="isFullscreen ? $t('退出全屏') : $t('全屏播放')"
            :aria-pressed="String(isFullscreen)"
            :title="isFullscreen ? $t('退出全屏') : $t('全屏播放')"
            @click="toggleFullscreen"
        >
            <span class="checkin-video-fullscreen-icon" aria-hidden="true"></span>
        </button>

        <!-- 自动播放被浏览器拦截时，提供无原生控件的继续播放入口。 -->
        <button
            v-if="!useNativeVideo && hasVideo && !hasVideoError && !isPlaying && !canClose"
            type="button"
            class="checkin-video-play"
            :aria-label="$t('观看视频进行打卡')"
            @click="playVideo(true)"
        >
            <img src="@img/home-checkin-play.png" alt="" />
        </button>
    </main>
</template>

<script>
import {
    NATIVE_CHECKIN_VIDEO_EVENT,
    supportsNativeCheckinVideo,
    sendNativeCheckinVideo,
    createNativeCheckinRequestId,
} from '@/utils/nativeCheckinVideo'

const CHECKIN_VIDEO_INFO_KEY = 'aix-checkin-video-info'
const CHECKIN_SUCCESS_PENDING_KEY = 'aix-checkin-success-pending'
const CHECKIN_SUCCESS_EVENT = 'aix-checkin-success'

export default {
    name: 'CheckinVideo',
    data() {
        return {
            videoInfo: {
                video_url: '',
                watch_seconds: 0,
            },
            remainingSeconds: 0,
            isPlaying: false,
            isLoading: true,
            isSubmitting: false,
            hasVideoError: false,
            isPlayPending: false,
            needsUserPlay: false,
            countdownTimer: null,
            fullscreenSupported: false,
            isFullscreen: false,
            useNativeVideo: false,
            nativeRequestId: '',
            nativeVideoPending: false,
            nativeVideoPresented: false,
            nativeOpenTimer: null,
        }
    },
    computed: {
        hasVideo() {
            return Boolean(this.videoInfo.video_url)
        },
        // 配置加载完成后，只有倒计时结束（或视频不可用）才允许离开。
        canClose() {
            if (this.useNativeVideo && (this.nativeVideoPending || this.nativeVideoPresented)) return false
            return !this.isLoading && (!this.hasVideo || this.hasVideoError || this.remainingSeconds <= 0)
        },
        formattedRemainingSeconds() {
            return String(Math.max(0, this.remainingSeconds)).padStart(2, '0')
        },
    },
    mounted() {
        window.addEventListener(NATIVE_CHECKIN_VIDEO_EVENT, this.handleNativeVideoResult)
        this.addFullscreenListeners()
        this.loadVideoInfo()
    },
    beforeDestroy() {
        this._videoDisposed = true
        window.removeEventListener(NATIVE_CHECKIN_VIDEO_EVENT, this.handleNativeVideoResult)
        this.clearNativeOpenTimer()
        if (this.nativeRequestId && supportsNativeCheckinVideo()) {
            try {
                sendNativeCheckinVideo({ type: 'cancelCheckinVideo', requestId: this.nativeRequestId })
            } catch (error) {
                console.log('[CheckinVideo] 取消原生播放器失败', error)
            }
        }
        this.stopCountdown()
        this.pauseVideo()
        this.exitFullscreen()
        this.removeFullscreenListeners()
    },
    methods: {
        async loadVideoInfo() {
            const cachedInfo = this.getCachedVideoInfo()
            if (cachedInfo && cachedInfo.video_url) {
                this.applyVideoInfo(cachedInfo)
                return
            }

            try {
                const res = await this.$http.get('/api/sign_logs/info')
                if (res.code == 200 && res.data) {
                    this.applyVideoInfo(res.data)
                    return
                }
            } catch (error) {
                console.log('获取签到视频失败', error)
            }

            this.applyVideoInfo({})
        },
        getCachedVideoInfo() {
            try {
                const raw = sessionStorage.getItem(CHECKIN_VIDEO_INFO_KEY)
                const data = raw ? JSON.parse(raw) : null
                return data && typeof data === 'object' ? data : null
            } catch (error) {
                console.log('读取签到视频配置失败', error)
                return null
            }
        },
        applyVideoInfo(info) {
            this.useNativeVideo = supportsNativeCheckinVideo()
            this.videoInfo = {
                video_url: String(info.video_url || ''),
                watch_seconds: Math.max(0, Math.ceil(Number(info.watch_seconds) || 0)),
            }
            this.remainingSeconds = this.videoInfo.watch_seconds
            this.hasVideoError = false
            this.isLoading = false

            if (this.useNativeVideo && this.hasVideo) {
                this.openNativeVideo()
                return
            }

            this.$nextTick(() => {
                this.fullscreenSupported = this.hasFullscreenSupport()
                if (this.hasVideo) this.playVideo()
            })
        },
        openNativeVideo() {
            if (this.nativeVideoPending || this.nativeVideoPresented || !this.hasVideo) return
            this.nativeRequestId = createNativeCheckinRequestId()
            this.nativeVideoPending = true
            this.hasVideoError = false
            // opened 回执用于确认 App 已接收；旧 App 不声明能力，不会进入此流程。
            this.nativeOpenTimer = window.setTimeout(() => {
                if (!this.nativeVideoPending || this._videoDisposed) return
                try {
                    sendNativeCheckinVideo({ type: 'cancelCheckinVideo', requestId: this.nativeRequestId })
                } catch (error) {
                    console.log('[CheckinVideo] 原生播放器应答超时', error)
                }
                this.failNativeVideo()
            }, 10000)
            try {
                sendNativeCheckinVideo({
                    type: 'openCheckinVideo',
                    requestId: this.nativeRequestId,
                    videoUrl: new URL(this.videoInfo.video_url, window.location.href).href,
                    watchSeconds: this.videoInfo.watch_seconds,
                    labels: {
                        close: this.$t('关闭视频'),
                        play: this.$t('观看视频进行打卡'),
                        loading: this.$t('加载中 ...'),
                        error: this.$t('视频播放失败，请稍后重试'),
                        retry: this.$t('重新播放'),
                        watchRequired: this.$t('请完整观看签到视频'),
                    },
                })
            } catch (error) {
                console.log('[CheckinVideo] 打开原生播放器失败', error)
                this.failNativeVideo()
            }
        },
        clearNativeOpenTimer() {
            if (this.nativeOpenTimer) window.clearTimeout(this.nativeOpenTimer)
            this.nativeOpenTimer = null
        },
        failNativeVideo() {
            this.clearNativeOpenTimer()
            this.nativeRequestId = ''
            this.nativeVideoPending = false
            this.nativeVideoPresented = false
            this.hasVideoError = true
            this.$toast(this.$t('视频播放失败，请稍后重试'))
        },
        handleNativeVideoResult(event) {
            const result = event && event.detail
            if (this._videoDisposed || !result || !this.nativeRequestId
                || result.requestId !== this.nativeRequestId) return
            if (result.status === 'opened') {
                this.clearNativeOpenTimer()
                this.nativeVideoPending = false
                this.nativeVideoPresented = true
                return
            }
            if (result.status === 'completed') {
                const watched = Number(result.watchedMilliseconds)
                if (!Number.isFinite(watched) || watched < this.videoInfo.watch_seconds * 1000) {
                    this.failNativeVideo()
                    return
                }
                this.clearNativeOpenTimer()
                // 清除本次请求后再关闭，重复回调或上一轮请求不能再次提交签到。
                this.nativeRequestId = ''
                this.nativeVideoPending = false
                this.nativeVideoPresented = false
                this.remainingSeconds = 0
                this.handleClose()
                return
            }
            if (result.status === 'cancelled') {
                this.clearNativeOpenTimer()
                this.nativeRequestId = ''
                this.nativeVideoPending = false
                this.nativeVideoPresented = false
                this.hasVideoError = true
                this.handleClose()
                return
            }
            if (result.status === 'error') this.failNativeVideo()
        },
        handleCanPlay() {
            if (!this.needsUserPlay) this.playVideo()
        },
        playVideo(fromUser = false) {
            const video = this.$refs.videoPlayer
            if (!video || this.hasVideoError || this.isSubmitting || this.isPlayPending) return
            if (!fromUser && this.needsUserPlay) return
            if (!video.paused && !video.ended) return

            // 默认使用有声播放；若浏览器拦截有声自动播放，会展示播放入口供用户手动开启。
            video.muted = false
            video.defaultMuted = false
            video.volume = 1

            this.needsUserPlay = false
            this.isPlayPending = true
            const attempt = (this._videoPlayAttempt || 0) + 1
            this._videoPlayAttempt = attempt
            try {
                const playPromise = video.play()
                Promise.resolve(playPromise).then(() => {
                    if (!this._videoDisposed && this._videoPlayAttempt === attempt) this.isPlayPending = false
                }, (error) => {
                    if (this._videoDisposed || this._videoPlayAttempt !== attempt) return
                    this.isPlayPending = false
                    this.handlePlayFailure(error)
                })
            } catch (error) {
                this.isPlayPending = false
                this.handlePlayFailure(error)
            }
        },
        handlePlayFailure(error) {
            this.pauseCountdown()
            this.needsUserPlay = true
            // 用户手势限制和 load()/pause() 中断不代表地址失效，保留手动播放入口。
            if (error && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
                console.log('[CheckinVideo] 播放需要用户操作或已被中断', error.name)
                return
            }
            this.handleVideoError(error)
        },
        retryVideo() {
            if (this.useNativeVideo) {
                this.openNativeVideo()
                return
            }
            const video = this.$refs.videoPlayer
            if (!video || this.isPlayPending) return
            this.hasVideoError = false
            this.needsUserPlay = false
            this.pauseCountdown()
            // 在同一次点击中重新加载并播放，保留 WebView 要求的用户手势。
            video.load()
            this.playVideo(true)
        },
        hasFullscreenSupport() {
            const page = this.$refs.videoPage
            const video = this.$refs.videoPlayer
            if (!page || !video) return false

            return Boolean(
                page.requestFullscreen ||
                page.webkitRequestFullscreen ||
                page.mozRequestFullScreen ||
                page.msRequestFullscreen ||
                video.webkitEnterFullscreen
            )
        },
        addFullscreenListeners() {
            if (typeof document === 'undefined') return
            document.addEventListener('fullscreenchange', this.syncFullscreenState)
            document.addEventListener('webkitfullscreenchange', this.syncFullscreenState)
            document.addEventListener('mozfullscreenchange', this.syncFullscreenState)
            document.addEventListener('MSFullscreenChange', this.syncFullscreenState)
        },
        removeFullscreenListeners() {
            if (typeof document === 'undefined') return
            document.removeEventListener('fullscreenchange', this.syncFullscreenState)
            document.removeEventListener('webkitfullscreenchange', this.syncFullscreenState)
            document.removeEventListener('mozfullscreenchange', this.syncFullscreenState)
            document.removeEventListener('MSFullscreenChange', this.syncFullscreenState)
        },
        getFullscreenElement() {
            if (typeof document === 'undefined') return null
            return document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement ||
                null
        },
        syncFullscreenState() {
            const video = this.$refs.videoPlayer
            this.isFullscreen = Boolean(
                this.getFullscreenElement() ||
                (video && video.webkitDisplayingFullscreen)
            )
        },
        openNativeVideoFullscreen(video) {
            if (!video || !video.webkitEnterFullscreen) return false

            try {
                video.webkitEnterFullscreen()
                this.isFullscreen = true
                return true
            } catch (error) {
                console.log('打开原生视频全屏失败', error)
                return false
            }
        },
        async toggleFullscreen() {
            const page = this.$refs.videoPage
            const video = this.$refs.videoPlayer
            if (!page || !video) return

            if (this.isFullscreen || this.getFullscreenElement()) {
                await this.exitFullscreen()
                return
            }

            try {
                let request
                if (page.requestFullscreen) {
                    request = page.requestFullscreen()
                } else if (video.webkitEnterFullscreen) {
                    this.openNativeVideoFullscreen(video)
                    return
                } else if (page.webkitRequestFullscreen) {
                    request = page.webkitRequestFullscreen()
                } else if (page.mozRequestFullScreen) {
                    request = page.mozRequestFullScreen()
                } else if (page.msRequestFullscreen) {
                    request = page.msRequestFullscreen()
                }

                if (request && typeof request.then === 'function') await request
            } catch (error) {
                if (this.openNativeVideoFullscreen(video)) return
                console.log('切换全屏失败', error)
            }
        },
        async exitFullscreen() {
            if (typeof document === 'undefined') return

            const video = this.$refs.videoPlayer
            if (!this.isFullscreen && !this.getFullscreenElement() && !(video && video.webkitDisplayingFullscreen)) return

            try {
                let request
                if (document.exitFullscreen) {
                    request = document.exitFullscreen()
                } else if (video && video.webkitExitFullscreen) {
                    video.webkitExitFullscreen()
                    this.isFullscreen = false
                    return
                } else if (document.webkitExitFullscreen) {
                    request = document.webkitExitFullscreen()
                } else if (document.mozCancelFullScreen) {
                    request = document.mozCancelFullScreen()
                } else if (document.msExitFullscreen) {
                    request = document.msExitFullscreen()
                }

                if (request && typeof request.then === 'function') await request
            } catch (error) {
                try {
                    if (video && video.webkitExitFullscreen) {
                        video.webkitExitFullscreen()
                        this.isFullscreen = false
                        return
                    }
                } catch (fallbackError) {
                    console.log('退出原生视频全屏失败', fallbackError)
                }
                console.log('退出全屏失败', error)
            }
        },
        // 仅在视频实际播放时递减，暂停或被系统中断时会同步停止计时。
        startCountdown() {
            const video = this.$refs.videoPlayer
            if (!video || video.paused || video.seeking || this.hasVideoError) return
            this.isPlaying = true
            if (this.isSubmitting || this.remainingSeconds <= 0) return
            if (this.countdownTimer) return

            this.countdownTimer = window.setInterval(() => {
                const player = this.$refs.videoPlayer
                if (!this.isPlaying || this.isSubmitting || !player || player.paused
                    || player.seeking || player.readyState < 3 || document.hidden) return

                this.remainingSeconds = Math.max(0, this.remainingSeconds - 1)
                if (this.remainingSeconds === 0) this.stopCountdown()
            }, 1000)
        },
        pauseCountdown() {
            this.isPlaying = false
            this.stopCountdown()
        },
        stopCountdown() {
            if (!this.countdownTimer) return
            window.clearInterval(this.countdownTimer)
            this.countdownTimer = null
        },
        // 仅在用户结束观看并关闭页面时提交签到；请求不会阻塞页面返回。
        async submitCheckinOnClose() {
            if (this.isSubmitting || !this.hasVideo || this.hasVideoError) return

            this.isSubmitting = true
            try {
                const res = await this.$http.post('/api/sign_logs')
                if (res.code != 200) return

                this.$store.commit('setCheckedIn', {
                    date: this.getTodayKey(),
                    address: this.$store.state.address || '',
                })
                try {
                    sessionStorage.setItem(CHECKIN_SUCCESS_PENDING_KEY, '1')
                } catch (error) {
                    console.log('缓存签到成功状态失败', error)
                }
                // 返回页已加载或即将加载时，都能通过事件恢复签到成功弹窗。
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new Event(CHECKIN_SUCCESS_EVENT))
                }
            } catch (error) {
                console.log('提交签到失败', error)
            } finally {
                this.isSubmitting = false
            }
        },
        handleVideoError(error) {
            const video = this.$refs.videoPlayer
            const mediaError = video && video.error
            console.log('[CheckinVideo] 签到视频加载失败 ' + JSON.stringify({
                code: mediaError ? mediaError.code : null,
                message: mediaError ? mediaError.message : String(error && error.message || ''),
                currentSrc: video && video.currentSrc,
                currentTime: video && video.currentTime,
                readyState: video && video.readyState,
                networkState: video && video.networkState,
            }))
            this.isPlayPending = false
            this.hasVideoError = true
            this.pauseCountdown()
            this.$toast(this.$t('视频播放失败，请稍后重试'))
        },
        handleClose() {
            if (!this.canClose) {
                this.$toast(this.$t('请完整观看签到视频'))
                return
            }

            this.stopCountdown()
            this.pauseVideo()
            this.exitFullscreen()
            try {
                sessionStorage.removeItem(CHECKIN_VIDEO_INFO_KEY)
            } catch (error) {
                console.log('清理签到视频配置失败', error)
            }

            // 不等待接口结果，始终正常退出视频页；成功时由事件恢复成功弹窗。
            this.submitCheckinOnClose()
            this.returnToPreviousPage()
        },
        returnToPreviousPage() {
            const returnTo = String(this.$route.query.returnTo || '')
            if (returnTo.indexOf('/') === 0 && returnTo.indexOf('//') !== 0) {
                this.$router.replace(returnTo)
                return
            }
            this.$router.replace({ name: 'index' })
        },
        pauseVideo() {
            const video = this.$refs.videoPlayer
            if (video && !video.paused) video.pause()
        },
        getTodayKey() {
            const date = new Date()
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return year + '-' + month + '-' + day
        },
    },
}
</script>

<style scoped lang="less">
// 独立签到视频页：不显示系统状态栏与通用导航，只保留设计稿中的视频和关闭胶囊。
.checkin-video-page {
    position: relative;
    width: 750px;
    height: 1624px;
    min-height: 100vh;
    margin: 0 auto;
    overflow: hidden;
    background: #01050C;

    &:fullscreen,
    &:-webkit-full-screen,
    &:-moz-full-screen,
    &:-ms-fullscreen {
        width: 100%;
        height: 100%;
        min-height: 100%;
        margin: 0;

        .checkin-video-player,
        .checkin-video-fallback {
            width: 100%;
            height: 100%;
            min-height: 100%;
        }
    }

    .checkin-video-player,
    .checkin-video-fallback {
        position: absolute;
        inset: 0;
        display: block;
        width: 750px;
        height: 1624px;
        min-height: 100vh;
        background: #01050C;
    }

    .checkin-video-player {
        object-fit: cover;
        object-position: center;
    }

    .checkin-video-fallback {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 24px;
        color: rgba(255, 255, 255, 0.72);
        font-size: 28px;

        p {
            position: relative;
            z-index: 1;
            margin: 0;
        }

        .checkin-video-retry {
            position: relative;
            z-index: 2;
            padding: 14px 30px;
            border: 1px solid rgba(255, 255, 255, 0.28);
            border-radius: 999px;
            color: #FFFFFF;
            font: inherit;
            background: rgba(255, 255, 255, 0.1);
        }
    }

    .checkin-video-vignette {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background: linear-gradient(180deg, rgba(1, 5, 12, 0.46) 0%, rgba(1, 5, 12, 0) 20%, rgba(1, 5, 12, 0) 72%, rgba(1, 5, 12, 0.28) 100%);
    }

    .checkin-video-fullscreen {
        position: absolute;
        top: 30px;
        right: 218px;
        z-index: 3;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        margin: 0;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 50%;
        outline: 0;
        background: rgba(0, 0, 0, 0.22);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        transition: transform 0.16s ease, background 0.16s ease;

        &:active {
            transform: scale(0.92);
        }

        &.is-active {
            background: rgba(41, 117, 255, 0.42);
        }

        .checkin-video-fullscreen-icon {
            width: 24px;
            height: 24px;
            background:
                linear-gradient(#FFFFFF, #FFFFFF) left top / 10px 3px no-repeat,
                linear-gradient(#FFFFFF, #FFFFFF) left top / 3px 10px no-repeat,
                linear-gradient(#FFFFFF, #FFFFFF) right top / 10px 3px no-repeat,
                linear-gradient(#FFFFFF, #FFFFFF) right top / 3px 10px no-repeat,
                linear-gradient(#FFFFFF, #FFFFFF) left bottom / 10px 3px no-repeat,
                linear-gradient(#FFFFFF, #FFFFFF) left bottom / 3px 10px no-repeat,
                linear-gradient(#FFFFFF, #FFFFFF) right bottom / 10px 3px no-repeat,
                linear-gradient(#FFFFFF, #FFFFFF) right bottom / 3px 10px no-repeat;
        }
    }

    .checkin-video-close {
        position: absolute;
        top: 30px;
        right: 30px;
        z-index: 3;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-width: 170px;
        height: 56px;
        margin: 0;
        padding: 0 22px;
        border: 1px solid rgba(255, 255, 255, 0.22);
        border-radius: 999px;
        outline: 0;
        color: #FFFFFF;
        font-size: 24px;
        font-weight: 400;
        line-height: 1;
        white-space: nowrap;
        background: rgba(0, 0, 0, 0.22);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);

        &.is-ready {
            border-color: rgba(255, 255, 255, 0.28);
            background: rgba(0, 0, 0, 0.34);
        }

        .checkin-video-countdown {
            min-width: 30px;
            font-variant-numeric: tabular-nums;
        }
    }

    .checkin-video-play {
        position: absolute;
        top: 50%;
        left: 50%;
        z-index: 2;
        width: 120px;
        height: 120px;
        margin: -60px 0 0 -60px;
        padding: 0;
        border: 0;
        outline: 0;
        background: transparent;

        img {
            display: block;
            width: 120px;
            height: 120px;
            object-fit: cover;
        }
    }
}
</style>

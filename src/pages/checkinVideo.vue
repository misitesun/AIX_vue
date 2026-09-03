<template>
    <main class="checkin-video-page">
        <!-- 模块一：接口动态视频，不展示接口返回的封面或简介信息。 -->
        <video
            v-if="hasVideo && !hasVideoError"
            ref="videoPlayer"
            class="checkin-video-player"
            :src="videoInfo.video_url"
            autoplay
            muted
            loop
            playsinline
            webkit-playsinline
            preload="auto"
            disablepictureinpicture
            controlslist="nodownload noplaybackrate noremoteplayback"
            @canplay="playVideo"
            @play="startCountdown"
            @pause="pauseCountdown"
            @error="handleVideoError"
        ></video>

        <section v-else class="checkin-video-fallback">
            <p>{{ $t('签到视频暂未配置') }}</p>
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

        <!-- 自动播放被浏览器拦截时，提供无原生控件的继续播放入口。 -->
        <button
            v-if="hasVideo && !hasVideoError && !isPlaying && !canClose"
            type="button"
            class="checkin-video-play"
            :aria-label="$t('观看视频进行签到')"
            @click="playVideo"
        >
            <img src="@img/home-checkin-play.png" alt="" />
        </button>
    </main>
</template>

<script>
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
            countdownTimer: null,
        }
    },
    computed: {
        hasVideo() {
            return Boolean(this.videoInfo.video_url)
        },
        // 配置加载完成后，只有倒计时结束（或视频不可用）才允许离开。
        canClose() {
            return !this.isLoading && (!this.hasVideo || this.hasVideoError || this.remainingSeconds <= 0)
        },
        formattedRemainingSeconds() {
            return String(Math.max(0, this.remainingSeconds)).padStart(2, '0')
        },
    },
    mounted() {
        this.loadVideoInfo()
    },
    beforeDestroy() {
        this.stopCountdown()
        this.pauseVideo()
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
            this.videoInfo = {
                video_url: String(info.video_url || ''),
                watch_seconds: Math.max(0, Math.ceil(Number(info.watch_seconds) || 0)),
            }
            this.remainingSeconds = this.videoInfo.watch_seconds
            this.hasVideoError = false
            this.isLoading = false

            this.$nextTick(() => {
                if (this.hasVideo) this.playVideo()
            })
        },
        playVideo() {
            const video = this.$refs.videoPlayer
            if (!video || this.canClose || this.isSubmitting) return

            const playPromise = video.play()
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch((error) => {
                    console.log('签到视频播放失败', error)
                    this.isPlaying = false
                })
            }
        },
        // 仅在视频实际播放时递减，暂停或被系统中断时会同步停止计时。
        startCountdown() {
            this.isPlaying = true
            if (this.isSubmitting || this.remainingSeconds <= 0) return
            if (this.countdownTimer) return

            this.countdownTimer = window.setInterval(() => {
                if (!this.isPlaying || this.isSubmitting) return

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
            console.log('签到视频加载失败', error)
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
    }

    .checkin-video-vignette {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background: linear-gradient(180deg, rgba(1, 5, 12, 0.46) 0%, rgba(1, 5, 12, 0) 20%, rgba(1, 5, 12, 0) 72%, rgba(1, 5, 12, 0.28) 100%);
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

<template>
    <div
        class="checkin-popup-overlay"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
    >
        <section
            class="checkin-popup-panel"
            :class="{ 'checkin-popup-panel-success': showSuccess }"
        >
            <button
                type="button"
                class="checkin-popup-close"
                :aria-label="$t('关闭')"
                @click="closePopup"
            >
                <img src="@img/home-checkin-close.svg" alt="" />
            </button>

            <h2 :id="titleId" class="checkin-popup-title">{{ $t('今日签到') }}</h2>

            <!-- 公共蓝色光效分隔线，与公告弹窗保持同一视觉资源。 -->
            <div class="checkin-popup-divider">
                <img src="@img/home-announcement-divider.png" alt="" />
            </div>

            <!-- 未签到：点击播放真实视频，仅在原生 ended 事件后进入成功态。 -->
            <div v-if="!showSuccess" class="checkin-video-stage">
                <video
                    ref="checkinVideo"
                    class="checkin-video"
                    :src="videoSrc || undefined"
                    :poster="posterSrc || defaultPoster"
                    preload="metadata"
                    playsinline
                    webkit-playsinline
                    disablepictureinpicture
                    controlslist="nodownload noplaybackrate noremoteplayback"
                    @play="isPlaying = true"
                    @timeupdate="handleTimeUpdate"
                    @ended="handleVideoEnded"
                    @error="handleVideoError"
                ></video>

                <button
                    v-if="!isPlaying && !awaitingSign"
                    type="button"
                    class="checkin-video-trigger"
                    :aria-label="$t('观看视频进行签到')"
                    @click="playVideo"
                >
                    <span class="checkin-video-play">
                        <img src="@img/home-checkin-play.png" alt="" />
                    </span>
                    <span class="checkin-video-copy">{{ intro || $t('观看视频进行签到') }}</span>
                </button>
            </div>

            <!-- 已签到：视频结束后自动切换到 Figma 成功状态。 -->
            <div v-else class="checkin-success">
                <img src="@img/home-checkin-success.png" alt="" class="checkin-success-visual" />
                <p class="checkin-success-copy">{{ $t('恭喜签到成功') }}</p>
                <button type="button" class="checkin-success-button" @click="closePopup">
                    {{ $t('明日再来') }}
                </button>
            </div>
        </section>
    </div>
</template>

<script>
import defaultPoster from '@img/home-checkin-video-frame.png'

export default {
    name: 'CheckinPopup',
    props: {
        videoSrc: {
            type: String,
            default: '',
        },
        checkedIn: {
            type: Boolean,
            default: false,
        },
        posterSrc: {
            type: String,
            default: '',
        },
        intro: {
            type: String,
            default: '',
        },
        watchSeconds: {
            type: Number,
            default: 0,
        },
        signing: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            defaultPoster,
            titleId: `checkin-popup-title-${this._uid}`,
            showSuccess: this.checkedIn,
            isPlaying: false,
            watchedSeconds: 0,
            awaitingSign: false,
            previousBodyOverflow: '',
        }
    },
    watch: {
        checkedIn(value) {
            if (value) {
                this.showSuccess = true
            }
        },
        signing(value) {
            if (!value && !this.checkedIn) this.awaitingSign = false
        },
    },
    mounted() {
        this.previousBodyOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', this.handleKeydown)
    },
    beforeDestroy() {
        this.pauseVideo()
        document.body.style.overflow = this.previousBodyOverflow
        window.removeEventListener('keydown', this.handleKeydown)
    },
    methods: {
        playVideo() {
            if (!this.videoSrc) {
                this.$toast(this.$t('签到视频暂未配置'))
                this.$emit('video-missing')
                return
            }

            const video = this.$refs.checkinVideo
            if (!video) return

            const playPromise = video.play()
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch((error) => {
                    console.log('签到视频播放失败', error)
                    this.isPlaying = false
                    this.$toast(this.$t('视频播放失败，请稍后重试'))
                })
            }
        },
        handleVideoEnded() {
            this.isPlaying = false
            const videoDuration = Number(this.$refs.checkinVideo && this.$refs.checkinVideo.duration) || 0
            const requiredSeconds = videoDuration > 0
                ? Math.min(this.watchSeconds, videoDuration)
                : this.watchSeconds
            if (requiredSeconds > 0 && this.watchedSeconds < requiredSeconds) {
                this.$toast(this.$t('请完整观看签到视频'))
                this.watchedSeconds = 0
                return
            }
            this.awaitingSign = true
            this.$emit('success')
        },
        handleTimeUpdate(event) {
            const currentTime = Number(event.target.currentTime) || 0
            this.watchedSeconds = Math.max(this.watchedSeconds, currentTime)
        },
        handleVideoError(event) {
            if (!this.videoSrc) return
            console.log('签到视频加载失败', event)
            this.isPlaying = false
            this.$toast(this.$t('视频播放失败，请稍后重试'))
        },
        pauseVideo() {
            const video = this.$refs.checkinVideo
            if (video && !video.paused) {
                video.pause()
            }
        },
        closePopup() {
            this.pauseVideo()
            this.$emit('close')
        },
        handleKeydown(event) {
            if (event.key === 'Escape') {
                this.closePopup()
            }
        },
    },
}
</script>

<style scoped lang="less">
// 公共导航签到弹窗：未观看视频和签到成功两种 Figma 状态。
.checkin-popup-overlay {
    position: fixed;
    top: 0;
    left: 50%;
    z-index: 340;
    width: 750px;
    height: 100vh;
    transform: translateX(-50%);
    overflow: hidden;
    background: rgba(0, 0, 0, 0.50);

    .checkin-popup-panel {
        position: absolute;
        top: 427px;
        left: 60px;
        width: 630px;
        height: 544px;
        border: 4px solid var(--app-primary-strong);
        border-radius: 40px;
        background: #000A25;

        &.checkin-popup-panel-success {
            height: 607px;
        }

        .checkin-popup-close {
            position: absolute;
            top: 16px;
            left: 554px;
            z-index: 3;
            width: 52px;
            height: 52px;
            margin: 0;
            padding: 0;
            border: 0;
            outline: 0;
            appearance: none;
            -webkit-appearance: none;
            background: transparent;

            img {
                display: block;
                width: 52px;
                height: 52px;
            }
        }

        .checkin-popup-title {
            position: absolute;
            top: 26px;
            left: 0;
            width: 622px;
            height: 50px;
            margin: 0;
            color: var(--app-text);
            font-size: 36px;
            font-weight: 500;
            line-height: 50px;
            text-align: center;
            white-space: nowrap;
        }

        .checkin-popup-divider {
            position: absolute;
            top: 88px;
            left: 0;
            width: 622px;
            height: 20px;
            overflow: hidden;
            pointer-events: none;

            img {
                position: absolute;
                top: -301px;
                left: 301px;
                width: 20px;
                height: 622px;
                max-width: none;
                transform: rotate(90deg);
            }
        }

        .checkin-video-stage {
            position: absolute;
            top: 108px;
            left: -4px;
            width: 630px;
            height: 412px;
            overflow: hidden;

            .checkin-video {
                display: block;
                width: 630px;
                height: 412px;
                border: 0;
                outline: 0;
                background: transparent;
                object-fit: cover;
                object-position: center top;
            }

            .checkin-video-trigger {
                position: absolute;
                inset: 0;
                width: 630px;
                height: 412px;
                margin: 0;
                padding: 0;
                border: 0;
                outline: 0;
                appearance: none;
                -webkit-appearance: none;
                background: transparent;

                .checkin-video-play {
                    position: absolute;
                    top: 130px;
                    left: 265px;
                    width: 100px;
                    height: 100px;
                    overflow: hidden;

                    img {
                        position: absolute;
                        top: -42px;
                        left: -42px;
                        width: 185px;
                        height: 185px;
                        max-width: none;
                    }
                }

                .checkin-video-copy {
                    position: absolute;
                    top: 250px;
                    left: 0;
                    width: 630px;
                    height: 36px;
                    color: var(--app-text);
                    font-size: 26px;
                    font-weight: 500;
                    line-height: 36px;
                    text-align: center;
                    white-space: nowrap;
                }
            }
        }

        .checkin-success {
            .checkin-success-visual {
                position: absolute;
                top: 138px;
                left: 181px;
                width: 260px;
                height: 260px;
                object-fit: cover;
            }

            .checkin-success-copy {
                position: absolute;
                top: 398px;
                left: 0;
                width: 622px;
                height: 45px;
                margin: 0;
                color: var(--app-text);
                font-size: 32px;
                font-weight: 500;
                line-height: 45px;
                text-align: center;
                white-space: nowrap;
            }

            .checkin-success-button {
                position: absolute;
                top: 483px;
                left: 36px;
                width: 550px;
                height: 80px;
                margin: 0;
                padding: 0;
                border: 0;
                border-radius: 999px;
                outline: 0;
                appearance: none;
                -webkit-appearance: none;
                background: var(--app-primary);
                color: var(--app-text);
                font-size: 28px;
                font-weight: 600;
                line-height: 80px;
                text-align: center;

                &:active {
                    transform: scale(0.98);
                }
            }
        }
    }
}
</style>

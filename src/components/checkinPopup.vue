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

            <!-- 未签到：弹窗仅承担入口，实际视频在独立播放页中完成。 -->
            <div v-if="!showSuccess" class="checkin-video-stage">
                <img
                    class="checkin-video"
                    src="@img/home-checkin-video-frame.png"
                    alt=""
                />

                <button
                    type="button"
                    class="checkin-video-trigger"
                    :aria-label="$t('观看视频进行签到')"
                    @click="openVideo"
                >
                    <span class="checkin-video-play">
                        <img src="@img/home-checkin-play.png" alt="" />
                    </span>
                    <span class="checkin-video-copy">{{ $t('观看视频进行签到') }}</span>
                </button>
            </div>

            <!-- 已签到：独立视频页完成签到并返回后切换为 Figma 成功状态。 -->
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
    },
    data() {
        return {
            titleId: `checkin-popup-title-${this._uid}`,
            showSuccess: this.checkedIn,
            previousBodyOverflow: '',
        }
    },
    watch: {
        checkedIn(value) {
            if (value) {
                this.showSuccess = true
            }
        },
    },
    mounted() {
        this.previousBodyOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', this.handleKeydown)
    },
    beforeDestroy() {
        document.body.style.overflow = this.previousBodyOverflow
        window.removeEventListener('keydown', this.handleKeydown)
    },
    methods: {
        openVideo() {
            if (!this.videoSrc) {
                this.$toast(this.$t('签到视频暂未配置'))
                this.$emit('video-missing')
                return
            }
            this.$emit('watch')
        },
        closePopup() {
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
                position: absolute;
                top: 0;
                left: 0;
                display: block;
                width: 630px;
                height: 436px;
                max-width: none;
                border: 0;
                outline: 0;
                background: transparent;
                pointer-events: none;
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

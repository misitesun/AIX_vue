<template>
    <div
        class="system-announcement-overlay"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
    >
        <section class="system-announcement-panel">
            <!-- 公告铃铛：使用 Figma 原始图片，并按节点裁切比例展示。 -->
            <div class="system-announcement-icon">
                <img src="@img/home-announcement-icon.png" alt="" />
            </div>

            <h2 :id="titleId" class="system-announcement-title">
                {{ title || $t('系统公告') }}
            </h2>

            <!-- Figma 蓝色光效分隔线。 -->
            <div class="system-announcement-divider">
                <img src="@img/home-announcement-divider.png" alt="" />
            </div>

            <div class="system-announcement-content">
                <p class="system-announcement-greeting">{{ $t('尊敬的用户') }}:</p>
                <div class="system-announcement-message" v-html="message"></div>
            </div>

            <!-- 前 3 秒禁用操作，倒计时结束后切换为确认按钮。 -->
            <button
                type="button"
                class="system-announcement-action"
                :class="{ 'system-announcement-action-ready': canConfirm }"
                :disabled="!canConfirm"
                @click="confirmAnnouncement"
            >
                <span v-if="!canConfirm" aria-live="polite">
                    {{ $t('倒计时') }} {{ formattedCountdown }}
                </span>
                <span v-else>{{ $t('知道了') }}</span>
            </button>
        </section>
    </div>
</template>

<script>
export default {
    name: 'SystemAnnouncementPopup',
    props: {
        title: {
            type: String,
            default: '',
        },
        message: {
            type: String,
            default: '',
        },
        countdownSeconds: {
            type: Number,
            default: 3,
            validator(value) {
                return value >= 0
            },
        },
    },
    data() {
        return {
            titleId: `system-announcement-title-${this._uid}`,
            remainingSeconds: this.countdownSeconds,
            countdownTimer: null,
            previousBodyOverflow: '',
        }
    },
    computed: {
        canConfirm() {
            return this.remainingSeconds <= 0
        },
        formattedCountdown() {
            return String(this.remainingSeconds).padStart(2, '0')
        },
    },
    mounted() {
        this.previousBodyOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', this.handleKeydown)
        this.startCountdown()
    },
    beforeDestroy() {
        this.clearCountdown()
        document.body.style.overflow = this.previousBodyOverflow
        window.removeEventListener('keydown', this.handleKeydown)
    },
    methods: {
        startCountdown() {
            if (this.canConfirm) return

            this.countdownTimer = window.setInterval(() => {
                this.remainingSeconds -= 1
                if (this.canConfirm) {
                    this.clearCountdown()
                }
            }, 1000)
        },
        clearCountdown() {
            if (this.countdownTimer) {
                window.clearInterval(this.countdownTimer)
                this.countdownTimer = null
            }
        },
        confirmAnnouncement() {
            if (this.canConfirm) {
                this.$emit('close')
            }
        },
        handleKeydown(event) {
            if (event.key === 'Escape') {
                this.confirmAnnouncement()
            }
        },
    },
}
</script>

<style scoped lang="less">
// 首页系统公告：按 750px Figma 节点坐标还原弹窗和两种按钮状态。
.system-announcement-overlay {
    position: fixed;
    top: 0;
    left: 50%;
    z-index: 320;
    width: 750px;
    height: 100vh;
    transform: translateX(-50%);
    overflow: hidden;
    background: rgba(0, 0, 0, 0.50);

    .system-announcement-panel {
        position: absolute;
        top: 427px;
        left: 60px;
        width: 630px;
        min-height: 507px;
        padding: 204px 36px 36px;
        border: 4px solid var(--app-primary-strong);
        border-radius: 40px;
        background: #000A25;

        .system-announcement-icon {
            position: absolute;
            top: -64px;
            left: 243px;
            width: 136px;
            height: 136px;
            overflow: hidden;

            img {
                position: absolute;
                top: -9px;
                left: -9px;
                width: 154px;
                height: 154px;
                max-width: none;
                pointer-events: none;
            }
        }

        .system-announcement-title {
            position: absolute;
            top: 92px;
            left: 239px;
            width: 144px;
            height: 50px;
            margin: 0;
            color: var(--app-text);
            font-size: 36px;
            font-weight: 500;
            line-height: 50px;
            text-align: center;
            white-space: nowrap;
        }

        .system-announcement-divider {
            position: absolute;
            top: 154px;
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

        .system-announcement-content {
            width: 550px;

            .system-announcement-greeting {
                height: 39px;
                margin: 0;
                color: var(--app-text);
                font-size: 28px;
                font-weight: 400;
                line-height: 39px;
            }

            .system-announcement-message {
                min-height: 80px;
                max-height: 200px;
                margin: 20px 0 0;
                padding-right: 8px;
                overflow-x: hidden;
                overflow-y: auto;
                color: var(--app-text-muted);
                font-size: 26px;
                font-weight: 400;
                line-height: 40px;
                overflow-wrap: break-word;
                white-space: pre-wrap;
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;

                // H5 保留触摸滚动，同时隐藏浏览器默认滚动条。
                scrollbar-width: none;

                &::-webkit-scrollbar {
                    display: none;
                }
            }
        }

        .system-announcement-action {
            display: block;
            width: 550px;
            height: 80px;
            margin: 40px 0 0;
            padding: 0;
            border: 0;
            border-radius: 999px;
            outline: 0;
            appearance: none;
            -webkit-appearance: none;
            background: rgba(255, 45, 45, 0.20);
            color: #FF2D2D;
            font-size: 28px;
            font-weight: 600;
            line-height: 80px;
            text-align: center;

            &.system-announcement-action-ready {
                background: var(--app-primary);
                color: var(--app-text);

                &:active {
                    transform: scale(0.98);
                }
            }
        }
    }
}
</style>

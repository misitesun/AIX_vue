<template>
    <div
        class="revenue-warning-overlay"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="closePopup"
    >
        <section class="revenue-warning-panel" @click.stop>
            <img src="@img/home-warning-panel.png" alt="" class="revenue-warning-panel-background" />
            <img src="@img/home-warning-icon.png" alt="" class="revenue-warning-icon" />

            <h2 :id="titleId" class="revenue-warning-title">
                【{{ $t('重要收益预警') }}】
            </h2>

            <div class="revenue-warning-copy">
                <p class="revenue-warning-line">
                    <span>{{ $t('你的成员') }}</span>
                    <span class="revenue-warning-highlight">“{{ memberName }}”</span>
                    <span>{{ $t('已提前离场') }}！</span>
                </p>
                <p class="revenue-warning-line">
                    <span>{{ $t('本次离场导致您每日收益减少') }}:</span>
                    <span class="revenue-warning-highlight">{{ reducedAmount }}</span>
                </p>
                <p class="revenue-warning-line">{{ $t('请及时跟进维护') }}!</p>
            </div>
        </section>
    </div>
</template>

<script>
export default {
    name: 'RevenueWarningPopup',
    props: {
        memberName: {
            type: String,
            default: '',
        },
        reducedAmount: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            titleId: `revenue-warning-title-${this._uid}`,
            previousBodyOverflow: '',
        }
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
// 首页重要收益预警：遮罩覆盖完整视口，点击弹窗外部或按 Esc 可关闭。
.revenue-warning-overlay {
    position: fixed;
    top: 0;
    left: 50%;
    z-index: 300;
    width: 750px;
    height: 100vh;
    transform: translateX(-50%);
    overflow: hidden;
    background: rgba(0, 0, 0, 0.50);

    .revenue-warning-panel {
        position: absolute;
        top: 400px;
        left: 60px;
        width: 630px;
        height: 748px;

        .revenue-warning-panel-background {
            position: absolute;
            inset: 0;
            width: 630px;
            height: 748px;
            pointer-events: none;
        }

        .revenue-warning-icon {
            position: absolute;
            top: 80px;
            left: 165px;
            width: 300px;
            height: 300px;
            object-fit: contain;
            pointer-events: none;
        }

        .revenue-warning-title {
            position: absolute;
            top: 335px;
            left: 91px;
            width: 448px;
            height: 45px;
            margin: 0;
            color: #FF2D2D;
            font-size: 32px;
            font-weight: 500;
            line-height: 45px;
            text-align: center;
            white-space: nowrap;
        }

        .revenue-warning-copy {
            position: absolute;
            top: 420px;
            left: 91px;
            width: 448px;
            height: 168px;
            color: #FFFFFF;
            font-size: 28px;
            font-weight: 500;
            line-height: 56px;
            text-align: center;
            white-space: nowrap;

            .revenue-warning-line {
                display: flex;
                height: 56px;
                margin: 0;
                align-items: center;
                justify-content: center;

                .revenue-warning-highlight {
                    color: #FF2D2D;
                }
            }
        }
    }
}
</style>

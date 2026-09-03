<template>
    <div class="asset-recharge-page">
        <!-- 公共模块：固定顶部导航，H5 页面不渲染系统状态栏 -->
        <van-nav-bar
            :title="$t('充值')"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
            @click-right="openAssetRecords"
        >
            <template #left>
                <span class="asset-recharge-back df-aic-jucen">
                    <van-icon name="arrow-left" size="14" color="#fff" />
                </span>
            </template>
            <template #right>
                <button
                    type="button"
                    class="asset-recharge-record df-aic-jucen"
                    :aria-label="$t('资产流水')"
                >
                    <img src="@img/record.png" class="img-38" alt="" />
                </button>
            </template>
        </van-nav-bar>

        <main class="asset-recharge-content">
            <!-- 模块一：充值币种、网络和地址信息 -->
            <section class="recharge-information">
                <button
                    type="button"
                    class="recharge-information-row recharge-information-row-coin"
                    @click="showCoinSelector = true"
                >
                    <span class="recharge-information-label">{{ $t('充值币种') }}</span>
                    <span class="recharge-information-value">{{ rechargeInfo.symbol }}</span>
                    <img src="@img/asset-recharge-chevron.svg" alt="" class="recharge-information-arrow" />
                </button>

                <button
                    type="button"
                    class="recharge-information-row recharge-information-row-chain"
                    @click="showChainSelector = true"
                >
                    <span class="recharge-information-label">{{ $t('充值链') }}</span>
                    <span
                        class="recharge-information-value"
                        :class="{ 'is-placeholder': !rechargeInfo.chain }"
                    >
                        {{ rechargeInfo.chain || $t('请选择充值链') }}
                    </span>
                    <img src="@img/asset-recharge-chevron.svg" alt="" class="recharge-information-arrow" />
                </button>

                <div class="recharge-information-row recharge-information-row-address">
                    <span class="recharge-information-label">{{ $t('充值地址') }}</span>
                    <span class="recharge-information-address">{{ rechargeInfo.address }}</span>
                    <button
                        type="button"
                        class="recharge-information-copy df-aic-jucen"
                        :aria-label="$t('复制成功')"
                        @click="copyRechargeAddress"
                    >
                        <img src="@img/asset-recharge-copy.svg" alt="" />
                    </button>
                </div>
            </section>

            <!-- 模块二：用户主动选择充值链后，再按充值地址生成二维码 -->
            <section v-if="rechargeInfo.chain" class="recharge-qr" :aria-label="$t('充值地址')">
                <img
                    src="@img/asset-recharge-corner-left.svg"
                    alt=""
                    class="recharge-qr-corner recharge-qr-corner-top-left"
                />
                <img
                    src="@img/asset-recharge-corner-right.svg"
                    alt=""
                    class="recharge-qr-corner recharge-qr-corner-top-right"
                />
                <img
                    src="@img/asset-recharge-corner-left.svg"
                    alt=""
                    class="recharge-qr-corner recharge-qr-corner-bottom-left"
                />
                <img
                    src="@img/asset-recharge-corner-right.svg"
                    alt=""
                    class="recharge-qr-corner recharge-qr-corner-bottom-right"
                />
                <div ref="qrCode" class="recharge-qr-code"></div>
            </section>

            <!-- 当前充值流程无需填写金额或手动确认，仅保留风险提示 -->
            <section class="recharge-warning">
                <p>
                    1、{{ $t('请勿向上述地址充值任何非{symbol}资产，否则资产不可找回。', { symbol: rechargeInfo.symbol }) }}
                </p>
                <p>
                    2、{{ $t('最小充值金额为：{amount}{symbol}，小于最小金额的充值将不会上账且无法退回。', {
                        amount: rechargeInfo.minAmount,
                        symbol: rechargeInfo.symbol,
                    }) }}
                </p>
            </section>
        </main>

        <!-- 充值链固定为 BEP20，但初始不默认选中，需由用户主动选择 -->
        <van-action-sheet
            v-model="showCoinSelector"
            class="recharge-selector"
            :actions="coinSelectorActions"
            :title='$t("选择充值币种")'
            close-on-click-action
            close-on-click-overlay
            @select="selectCoin"
        />
        <van-action-sheet
            v-model="showChainSelector"
            class="recharge-selector"
            :actions="chainSelectorActions"
            :title='$t("选择充值链")'
            close-on-click-action
            close-on-click-overlay
            @select="selectChain"
        />
    </div>
</template>

<script>
import QRCode from 'qrcodejs2'

const RECHARGE_COINS = [
    {
        name: 'USDT',
        value: 'USDT',
        symbol: 'USDT',
    },
    {
        name: 'AXE',
        value: 'AXE',
        symbol: 'AXE',
    },
]

export default {
    name: 'AssetRecharge',
    data() {
        const routeSymbol = String(this.$route.params.assetId || 'usdt').toUpperCase()
        const routeCoin = RECHARGE_COINS.find(item => item.symbol === routeSymbol) || RECHARGE_COINS[0]

        return {
            showCoinSelector: false,
            showChainSelector: false,
            rechargeInfo: {
                symbol: routeCoin.symbol,
                chain: '',
                address: this.$t('无数据'),
                minAmount: this.$t('无数据'),
            },
            coinActions: RECHARGE_COINS.map(item => ({ ...item })),
            chainActions: [
                {
                    name: 'BEP20',
                    value: 'BEP20',
                },
            ],
        }
    },
    computed: {
        coinSelectorActions() {
            return this.withSelectedAction(this.coinActions, this.rechargeInfo.symbol)
        },
        chainSelectorActions() {
            return this.withSelectedAction(this.chainActions, this.rechargeInfo.chain)
        },
    },

    mounted() {
        this.loadRechargeAddress()
        window.addEventListener('resize', this.renderQrCode)
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.renderQrCode)
    },
    methods: {
        async loadRechargeAddress() {
            try {
                const res = await this.$http.get('/api/users/my/recharge_address')
                if (res.code == 200 && res.data && res.data.recharge_address) {
                    this.rechargeInfo.address = res.data.recharge_address
                    this.renderQrCode()
                }
            } catch (error) {
                console.log('充值地址加载失败', error)
            }
        },
        openAssetRecords() {
            this.$router.push({
                name: 'assetRecords',
                query: { type: 'asset' },
            })
        },
        withSelectedAction(actions, selectedValue) {
            return actions.map(action => ({
                ...action,
                className: String(action.value) === String(selectedValue) ? "is-selected" : "",
            }))
        },

        selectCoin(action) {
            this.rechargeInfo.symbol = action.symbol
        },
        selectChain(action) {
            this.rechargeInfo.chain = action.value
            this.renderQrCode()
        },
        copyRechargeAddress() {
            if (!this.rechargeInfo.address || this.rechargeInfo.address === this.$t('无数据')) {
                this.$toast(this.$t('暂无充值地址'))
                return
            }
            this.$copyText(this.rechargeInfo.address).then(() => {
                this.$messageTip.success(this.$t('复制成功'))
            }).catch(() => {
                this.$messageTip.error(this.$t('复制失败'))
            })
        },
        renderQrCode() {
            if (!this.rechargeInfo.chain) return

            this.$nextTick(() => {
                if (!this.$refs.qrCode) return
                if (!this.rechargeInfo.address || this.rechargeInfo.address === this.$t('无数据')) return

                this.$refs.qrCode.innerHTML = ''
                const pageWidth = this.$el ? this.$el.getBoundingClientRect().width : window.innerWidth
                const qrSize = Math.round(Math.min(pageWidth, 750) * 300 / 750)

                new QRCode(this.$refs.qrCode, {
                    text: this.rechargeInfo.address,
                    width: qrSize,
                    height: qrSize,
                    colorDark: '#000000',
                    colorLight: '#FFFFFF',
                    correctLevel: QRCode.CorrectLevel.H,
                })
            })
        },
    },
}
</script>

<style scoped lang="less">
.asset-recharge-page {
    position: relative;
    width: 750px;
    min-height: 100vh;
    margin: 0 auto;
    overflow-x: hidden;
    background: #000308;
    color: #FFFFFF;

    button,
    input {
        margin: 0;
        padding: 0;
        border: 0;
        outline: 0;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
        color: inherit;
        font: inherit;
    }

    // 固定导航：设计稿系统状态栏已去除，内容高度保持 88px。
    /deep/ .van-nav-bar__placeholder,
    /deep/ .van-nav-bar,
    /deep/ .van-nav-bar__content {
        height: 88px;
    }

    /deep/ .van-nav-bar {
        background: rgba(0, 0, 0, 0.30) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;

        .van-nav-bar__title {
            color: #FFFFFF;
            font-size: 32px;
            font-weight: 400;
            line-height: 45px;
        }

        .van-nav-bar__left {
            left: 30px;
            padding: 0;
        }

        .van-nav-bar__right {
            right: 30px;
            padding: 0;
        }
    }

    .asset-recharge-back {
        width: 52px;
        height: 52px;
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.10);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    .asset-recharge-record {
        width: 48px;
        height: 48px;
    }

    .asset-recharge-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        min-height: calc(100vh - 88px);
        padding: 30px 30px 60px;
        box-sizing: border-box;

        // 模块一：充值信息卡
        .recharge-information {
            display: flex;
            flex: 0 0 auto;
            flex-direction: column;
            width: 100%;
            min-height: 291px;
            padding: 39px 30px 28px;
            box-sizing: border-box;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.10);

            .recharge-information-row {
                display: flex;
                align-items: flex-start;
                width: 100%;
                min-height: 69px;
                column-gap: 16px;
                box-sizing: border-box;
                text-align: left;

                &.recharge-information-row-address {
                    min-height: 86px;
                }

                .recharge-information-label {
                    flex: 0 1 auto;
                    max-width: 42%;
                    min-width: 0;
                    color: rgba(255, 255, 255, 0.50);
                    font-size: 24px;
                    line-height: 34px;
                    overflow-wrap: anywhere;
                }

                .recharge-information-value {
                    flex: 1 1 0;
                    min-width: 0;
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 24px;
                    line-height: 36px;
                    overflow-wrap: anywhere;
                    text-align: right;

                    &.is-placeholder {
                        color: rgba(255, 255, 255, 0.50);
                    }
                }

                .recharge-information-arrow {
                    display: block;
                    flex: 0 0 14px;
                    width: 14px;
                    height: 14px;
                    margin-top: 10px;
                }

                .recharge-information-address {
                    flex: 1 1 0;
                    min-width: 0;
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 24px;
                    line-height: 34px;
                    overflow-wrap: anywhere;
                    text-align: right;
                }

                .recharge-information-copy {
                    flex: 0 0 32px;
                    width: 32px;
                    height: 32px;
                    margin-top: 17px;

                    img {
                        display: block;
                        width: 24px;
                        height: 24px;
                    }
                }
            }
        }

        // 模块二：二维码及蓝色扫描框
        .recharge-qr {
            position: relative;
            display: flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            width: 480px;
            height: 480px;
            margin: 101px auto 0;

            .recharge-qr-corner {
                position: absolute;
                z-index: 2;
                display: block;
                width: 90px;
                height: 90px;

                &.recharge-qr-corner-top-left {
                    top: 0;
                    left: 0;
                    transform: rotate(90deg);
                }

                &.recharge-qr-corner-top-right {
                    top: 0;
                    right: 0;
                    transform: rotate(180deg);
                }

                &.recharge-qr-corner-bottom-left {
                    bottom: 0;
                    left: 0;
                }

                &.recharge-qr-corner-bottom-right {
                    right: 0;
                    bottom: 0;
                    transform: rotate(-90deg);
                }
            }

            .recharge-qr-code {
                position: relative;
                z-index: 2;
                width: 300px;
                height: 300px;
                padding: 30px;
                box-sizing: content-box;
                overflow: hidden;
                border-radius: 40px;
                background: #FFFFFF;
                font-size: 0;
                line-height: 0;

                /deep/ img,
                /deep/ canvas {
                    width: 300px !important;
                    height: 300px !important;
                }

                // qrcodejs2 会同时创建 canvas 和 img，并通过内联 display 切换最终展示节点。
                // 不要强制两者同时 display:block，否则第二个二维码会纵向叠加并被容器裁切。
                /deep/ img {
                    display: block;
                }
            }
        }

        // 模块三：充值安全说明；二维码隐藏时紧随信息卡展示。
        .recharge-warning {
            flex: 0 0 auto;
            width: 100%;
            margin-top: 60px;
            color: #FF2A35;
            font-size: 24px;
            line-height: 40px;

            p {
                margin: 0;
            }
        }
    }

    // 简洁选择面板：标题、卡片选项与明确的选中态。
    /deep/ .recharge-selector {
        max-height: 54%;
        padding: 0 24px calc(24px + env(safe-area-inset-bottom));
        box-sizing: border-box;
        border-radius: 32px 32px 0 0;
        background: linear-gradient(180deg, #192233 0%, #101621 100%);
        color: #FFFFFF;
        box-shadow: 0 -18px 48px rgba(0, 0, 0, 0.34);

        .van-action-sheet__header {
            height: 90px;
            color: #FFFFFF;
            font-size: 28px;
            font-weight: 600;
            line-height: 90px;
        }

        .van-action-sheet__close {
            top: 0;
            right: 8px;
            color: #9FAEC5;
            font-size: 34px;
            line-height: 90px;
        }

        .van-action-sheet__content {
            padding-bottom: 4px;
        }

        .van-action-sheet__item {
            position: relative;
            min-height: 88px;
            margin: 12px 0;
            padding: 0 28px;
            box-sizing: border-box;
            border: 1px solid rgba(255, 255, 255, 0.10);
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.06);
            color: #FFFFFF;
            font-size: 28px;
            line-height: 86px;
            text-align: left;

            &:active {
                background: rgba(76, 145, 255, 0.18);
            }

            &.is-selected {
                border-color: rgba(54, 118, 255, 0.88);
                background: rgba(29, 100, 255, 0.18);

                &::after {
                    position: absolute;
                    top: 0;
                    right: 28px;
                    color: #4C91FF;
                    content: "✓";
                    font-size: 30px;
                    font-weight: 600;
                }
            }
        }

        .van-action-sheet__gap,
        .van-action-sheet__cancel {
            display: none;
        }
    }
}
</style>

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
                    <van-icon name="orders-o" size="24" color="#fff" />
                </button>
            </template>
        </van-nav-bar>

        <main class="asset-recharge-content">
            <!-- 模块一：充值币种、网络和地址信息 -->
            <section class="recharge-information">
                <img src="@img/asset-recharge-card.svg" alt="" class="recharge-information-background" />

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
                    <span class="recharge-information-value">{{ rechargeInfo.chain }}</span>
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

            <!-- 模块二：按充值地址动态生成二维码，四角装饰使用设计稿资源 -->
            <section class="recharge-qr" :aria-label="$t('充值地址')">
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
                <img src="@img/asset-recharge-qr-frame.svg" alt="" class="recharge-qr-background" />
                <div ref="qrCode" class="recharge-qr-code"></div>
            </section>

            <!-- 模块三：充值金额输入与确认操作 -->
            <section class="recharge-amount common-input-focus">
                <img src="@img/asset-recharge-input.svg" alt="" class="recharge-amount-background" />
                <input
                    v-model="amount"
                    type="text"
                    inputmode="decimal"
                    class="recharge-amount-input"
                    :placeholder="$t('请输入充值金额')"
                    @input="normalizeAmount"
                />
                <span class="recharge-amount-symbol">{{ rechargeInfo.symbol }}</span>
            </section>

            <button type="button" class="recharge-confirm" @click="confirmRecharge">
                {{ $t('确认充值') }}
            </button>

            <!-- 模块四：充值风险提示 -->
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

        <!-- 选择器数据保持最小集合，后续可直接替换成后端币种和链配置 -->
        <van-action-sheet
            v-model="showCoinSelector"
            class="recharge-selector"
            :actions="coinActions"
            :cancel-text="$t('取消')"
            close-on-click-action
            @select="selectCoin"
        />
        <van-action-sheet
            v-model="showChainSelector"
            class="recharge-selector"
            :actions="chainActions"
            :cancel-text="$t('取消')"
            close-on-click-action
            @select="selectChain"
        />
    </div>
</template>

<script>
import QRCode from 'qrcodejs2'

export default {
    name: 'AssetRecharge',
    data() {
        const routeSymbol = String(this.$route.params.assetId || 'usdt').toUpperCase()

        return {
            amount: '',
            showCoinSelector: false,
            showChainSelector: false,
            rechargeInfo: {
                symbol: routeSymbol,
                chain: this.$t('无数据'),
                address: this.$t('无数据'),
                minAmount: this.$t('无数据'),
            },
            coinActions: [
                {
                    name: routeSymbol,
                    value: routeSymbol,
                },
            ],
            chainActions: [
                {
                    name: this.$t('无数据'),
                    value: this.$t('无数据'),
                },
            ],
        }
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
        selectCoin(action) {
            this.rechargeInfo.symbol = action.value
        },
        selectChain(action) {
            this.rechargeInfo.chain = action.value
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
        // 金额字段仅保留数字和一个小数点，展示值不做额外精度格式化。
        normalizeAmount(event) {
            let value = String(event.target.value || '').replace(/[^\d.]/g, '')
            const decimalIndex = value.indexOf('.')

            if (decimalIndex !== -1) {
                value = value.slice(0, decimalIndex + 1) + value.slice(decimalIndex + 1).replace(/\./g, '')
            }

            this.amount = value
        },
        confirmRecharge() {
            // 当前接口仅返回充值地址，没有充值金额确认接口；保留设计稿按钮但不伪造提交结果。
            this.$toast(this.$t('暂无充值确认接口'))
        },
        renderQrCode() {
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
    height: 1624px;
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
        position: absolute;
        top: 0;
        left: 0;
        width: 750px;
        height: 1624px;

        // 模块一：充值信息卡
        .recharge-information {
            position: absolute;
            top: 118px;
            left: 30px;
            width: 690px;
            height: 291px;

            .recharge-information-background {
                position: absolute;
                inset: 0;
                display: block;
                width: 690px;
                height: 291px;
                pointer-events: none;
            }

            .recharge-information-row {
                position: absolute;
                left: 0;
                display: block;
                width: 690px;
                height: 69px;
                text-align: left;

                &.recharge-information-row-coin {
                    top: 39px;
                }

                &.recharge-information-row-chain {
                    top: 108px;
                }

                &.recharge-information-row-address {
                    top: 177px;
                    height: 86px;
                }

                .recharge-information-label {
                    position: absolute;
                    top: 0;
                    left: 30px;
                    color: rgba(255, 255, 255, 0.50);
                    font-size: 24px;
                    line-height: 34px;
                }

                .recharge-information-value {
                    position: absolute;
                    top: 0;
                    right: 60px;
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 24px;
                    line-height: 36px;
                    text-align: right;
                }

                .recharge-information-arrow {
                    position: absolute;
                    top: 10px;
                    right: 30px;
                    display: block;
                    width: 14px;
                    height: 14px;
                }

                .recharge-information-address {
                    position: absolute;
                    top: -1px;
                    right: 75px;
                    width: 402px;
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 24px;
                    line-height: 34px;
                    overflow-wrap: anywhere;
                    text-align: right;
                }

                .recharge-information-copy {
                    position: absolute;
                    top: 21px;
                    right: 30px;
                    width: 32px;
                    height: 32px;

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
            position: absolute;
            top: 510px;
            left: 135px;
            width: 480px;
            height: 480px;

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

            .recharge-qr-background {
                position: absolute;
                z-index: 1;
                top: 60px;
                left: 60px;
                display: block;
                width: 360px;
                height: 360px;
            }

            .recharge-qr-code {
                position: absolute;
                z-index: 2;
                top: 90px;
                left: 90px;
                width: 300px;
                height: 300px;
                overflow: hidden;

                /deep/ img,
                /deep/ canvas {
                    display: block !important;
                    width: 300px !important;
                    height: 300px !important;
                }
            }
        }

        // 模块三：金额输入与主操作按钮
        .recharge-amount {
            position: absolute;
            top: 1090px;
            left: 30px;
            width: 690px;
            height: 103px;

            .recharge-amount-background {
                position: absolute;
                inset: 0;
                display: block;
                width: 690px;
                height: 103px;
                pointer-events: none;
            }

            .recharge-amount-input {
                position: absolute;
                z-index: 1;
                top: 0;
                left: 30px;
                width: 510px;
                height: 103px;
                caret-color: #4C91FF;
                font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                font-size: 24px;
                line-height: 103px;

                &::placeholder {
                    color: rgba(255, 255, 255, 0.50);
                }
            }

            .recharge-amount-symbol {
                position: absolute;
                z-index: 1;
                top: 0;
                right: 30px;
                height: 103px;
                font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                font-size: 24px;
                line-height: 103px;
            }
        }

        .recharge-confirm {
            position: absolute;
            top: 1233px;
            left: 30px;
            width: 690px;
            height: 88px;
            border-radius: 999px;
            background: #1764F5;
            font-size: 32px;
            font-weight: 500;
            line-height: 45px;
            text-align: center;
            transition: transform 0.2s;

            &:active {
                transform: scale(0.97);
            }
        }

        // 模块四：充值安全说明
        .recharge-warning {
            position: absolute;
            top: 1381px;
            left: 30px;
            width: 690px;
            color: #FF2A35;
            font-size: 24px;
            line-height: 40px;

            p {
                margin: 0;
            }
        }
    }

    // 弹出的币种/链选择器沿用项目深色毛玻璃视觉。
    /deep/ .recharge-selector {
        background: #15191F;
        color: #FFFFFF;

        .van-action-sheet__item,
        .van-action-sheet__cancel {
            background: #15191F;
            color: #FFFFFF;
        }

        .van-action-sheet__gap {
            background: #080B10;
        }
    }
}
</style>

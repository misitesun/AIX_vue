<template>
    <div class="transaction-detail-page">
        <!-- 公共模块：固定顶部返回导航，H5 页面不重复实现系统状态栏 -->
        <van-nav-bar
            :title="$t('交易详情')"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
        >
            <template #left>
                <span class="transaction-detail-back df-aic-jucen">
                    <van-icon name="arrow-left" size="14" color="#fff" />
                </span>
            </template>
        </van-nav-bar>

        <!-- 页面主体：交易概览、执行/资讯信息和交易记录 -->
        <mescroll-vue
            ref="mescroll"
            class="transaction-detail-scroll"
            :up="mescrollUp"
            @init="mescrollInit"
        >
            <main class="transaction-detail-content">
                <!-- 模块一：净利润、ROI 与费用占比 -->
                <section class="transaction-summary-card">
                    <div class="transaction-summary-profit">{{ detail.netProfit }}</div>
                    <div class="transaction-summary-roi df-aic">
                        <span>{{ detail.roi }}</span>
                        <img src="@img/trade-detail-arrow-up.svg" alt="" />
                    </div>
                    <div class="transaction-summary-profit-label">
                        {{ $t('净利润') }} {{ detail.profitToken }}
                    </div>
                    <div class="transaction-summary-roi-label">ROI</div>

                    <div class="transaction-summary-divider"></div>
                    <div class="transaction-summary-gross-label">{{ $t('毛利 — 净利') }}</div>
                    <div class="transaction-summary-fee-label">
                        {{ $t('手续费') }} {{ detail.totalFeeAmount }}
                    </div>

                    <div class="transaction-summary-progress">
                        <span class="transaction-summary-progress-fee"></span>
                        <span class="transaction-summary-progress-profit"></span>
                    </div>
                    <div class="transaction-summary-gross-value">
                        {{ $t('利润') }} {{ detail.grossProfit }}
                    </div>
                    <div class="transaction-summary-fee-value">
                        {{ $t('手续费') }} {{ detail.totalFeeAmount }}
                    </div>
                </section>

                <!-- 模块二：买入与卖出执行路径 -->
                <section class="transaction-direction">
                    <div class="transaction-direction-card transaction-direction-buy">
                        <div class="transaction-direction-title">{{ $t('买入') }}</div>
                        <div class="transaction-direction-platform">{{ detail.buyPlatform }}</div>
                    </div>
                    <img src="@img/trade-detail-swap-arrow.svg" alt="" class="transaction-direction-arrow" />
                    <div class="transaction-direction-card transaction-direction-sell">
                        <div class="transaction-direction-title">{{ $t('卖出') }}</div>
                        <div class="transaction-direction-platform">{{ detail.sellPlatform }}</div>
                    </div>
                </section>

                <!-- 模块三：执行与资讯两个独立 Tab 状态 -->
                <section class="transaction-info-section">
                    <div class="transaction-info-tabs" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            class="transaction-info-tab"
                            :class="{ active: activeTab === 'execution' }"
                            :aria-selected="activeTab === 'execution'"
                            @click="activeTab = 'execution'"
                        >
                            {{ $t('执行') }}
                        </button>
                        <button
                            type="button"
                            role="tab"
                            class="transaction-info-tab"
                            :class="{ active: activeTab === 'information' }"
                            :aria-selected="activeTab === 'information'"
                            @click="activeTab = 'information'"
                        >
                            {{ $t('资讯') }}
                        </button>
                    </div>

                    <div class="transaction-info-card">
                        <!-- 执行：展示本次策略执行的金额、价格、价差和费用 -->
                        <template v-if="activeTab === 'execution'">
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('买入价') }}</span>
                                <span class="transaction-info-value is-positive">{{ detail.buyPrice }}</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('卖出价') }}</span>
                                <span class="transaction-info-value">{{ detail.sellPrice }}</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('价差') }}</span>
                                <span class="transaction-info-value is-positive">{{ detail.spread }}</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('买入金额') }}</span>
                                <span class="transaction-info-value">{{ detail.buyAmountUsd }} USD</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('代币数量') }}</span>
                                <span class="transaction-info-value">{{ detail.tokenAmount }} {{ detail.profitToken }}</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('卖出金额') }}</span>
                                <span class="transaction-info-value">{{ detail.sellStableAmount }} USD</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('毛利润') }}</span>
                                <span class="transaction-info-value is-positive">{{ detail.grossProfit }}</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('手续费') }}</span>
                                <span class="transaction-info-value is-negative">
                                    {{ detail.totalFeeAmount }}
                                </span>
                            </div>
                        </template>

                        <!-- 资讯：展示交易标识、链上地址和开平仓时间 -->
                        <template v-else>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('记录ID') }}</span>
                                <span class="transaction-info-value">{{ detail.recordId }}</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('操作ID') }}</span>
                                <span class="transaction-info-value">{{ detail.operationId }}</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('链') }}</span>
                                <span class="transaction-info-value">{{ detail.chain }}</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('交易哈希') }}</span>
                                <span class="transaction-info-value is-muted" :title="detail.txHash">{{ detail.txHash }}</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('地址') }}</span>
                                <span class="transaction-info-value is-muted" :title="detail.address">{{ detail.address }}</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('代币') }}</span>
                                <span class="transaction-info-value">{{ detail.profitToken }}</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('开仓时间') }}</span>
                                <span class="transaction-info-value">{{ detail.openedAt }}</span>
                            </div>
                            <div class="transaction-info-divider"></div>
                            <div class="transaction-info-row">
                                <span class="transaction-info-label">{{ $t('平仓时间') }}</span>
                                <span class="transaction-info-value">{{ detail.closedAt }}</span>
                            </div>
                        </template>
                    </div>
                </section>

                <!-- 模块四：该策略对应的链上交易记录 -->
                <section class="transaction-records-section">
                    <h1 class="transaction-records-title">{{ $t('交易记录') }}</h1>
                    <div v-if="records.length" class="transaction-records-list">
                        <button
                            v-for="record in records"
                            :key="record.id"
                            type="button"
                            class="transaction-record-item df-aic-jusb"
                            @click="openTransactionRecord(record.url)"
                        >
                            <span class="transaction-record-copy">
                                <span>{{ record.chain }}-{{ $t(record.side === 'buy' ? '买入交易' : '卖出交易') }}</span>
                                <span class="transaction-record-hash" :title="record.hash">{{ record.hash }}</span>
                            </span>
                            <img src="@img/trade-detail-chevron.svg" alt="" />
                        </button>
                    </div>
                    <no-data v-else></no-data>
                </section>
            </main>
        </mescroll-vue>
    </div>
</template>

<script>
export default {
    name: 'TransactionDetail',
    data() {
        return {
            mescroll: null,
            activeTab: 'execution',
            mescrollUp: {
                callback: this.upCallback,
                page: {
                    num: 0,
                    size: 10,
                },
                noMoreSize: 5,
                htmlNodata: '',
                empty: {
                    use: false,
                },
            },
            // 详情字段保持接口结构，展示文本与单位均由模板控制。
            detail: Object.fromEntries([
                'netProfit', 'profitToken', 'roi', 'grossProfit', 'totalFeeAmount', 'feeSymbol',
                'buyPlatform', 'sellPlatform', 'buyPrice', 'sellPrice', 'spread', 'buyAmountUsd',
                'tokenAmount', 'sellStableAmount', 'recordId', 'operationId', 'chain', 'txHash', 'address',
                'walletAddress', 'openedAt', 'closedAt',
            ].map(key => [key, this.$t('无数据')])),
            records: [],
        }
    },
    methods: {
        mescrollInit(mescroll) {
            this.mescroll = mescroll
        },
        // 详情接口同时返回 buy_tx / sell_tx，不再生成额外 mock 交易记录。
        async upCallback(page, mescroll) {
            if (page.num > 1) {
                mescroll.endSuccess(0)
                return
            }
            try {
                const id = this.$route.params.transactionId
                const res = await this.$http.get(`/api/block_logs/${id}`)
                const info = res.code == 200 && res.data ? res.data : {}
                const noData = this.$t('无数据')
                const valueOrNoData = value => value === undefined || value === null || value === '' ? noData : value
                this.detail = {
                    netProfit: valueOrNoData(info.profit),
                    profitToken: valueOrNoData(info.token),
                    roi: valueOrNoData(info.roi),
                    grossProfit: valueOrNoData(info.profit),
                    totalFeeAmount: valueOrNoData(info.total_fee_amount),
                    feeSymbol: valueOrNoData(info.fee_symbol),
                    buyPlatform: valueOrNoData(info.buy_platform),
                    sellPlatform: valueOrNoData(info.sell_platform),
                    buyPrice: valueOrNoData(info.buy_price),
                    sellPrice: valueOrNoData(info.sell_price),
                    spread: valueOrNoData(info.spread_rate),
                    buyAmountUsd: valueOrNoData(info.amount_usd),
                    tokenAmount: valueOrNoData(info.token_amount),
                    sellStableAmount: valueOrNoData(info.sell_stable_amount),
                    recordId: valueOrNoData(info.id),
                    operationId: valueOrNoData(info.operation_id),
                    chain: valueOrNoData(info.chain),
                    txHash: valueOrNoData(info.tx_hash),
                    address: valueOrNoData(info.address),
                    walletAddress: valueOrNoData(info.wallet_address),
                    openedAt: valueOrNoData(info.opened_at),
                    closedAt: valueOrNoData(info.closed_at),
                }
                this.records = []
                if (info.buy_tx && typeof info.buy_tx === 'object' && !Array.isArray(info.buy_tx)) {
                    this.records.push({
                        id: `${info.id}-buy`,
                        chain: valueOrNoData(info.chain),
                        side: 'buy',
                        hash: valueOrNoData(info.buy_tx.hash || info.buy_tx.tx_hash),
                        url: typeof info.buy_tx.url === 'string' ? info.buy_tx.url.trim() : '',
                    })
                }
                if (info.sell_tx && typeof info.sell_tx === 'object' && !Array.isArray(info.sell_tx)) {
                    this.records.push({
                        id: `${info.id}-sell`,
                        chain: valueOrNoData(info.chain),
                        side: 'sell',
                        hash: valueOrNoData(info.sell_tx.hash || info.sell_tx.tx_hash),
                        url: typeof info.sell_tx.url === 'string' ? info.sell_tx.url.trim() : '',
                    })
                }
                this.$nextTick(() => mescroll.endSuccess(this.records.length))
            } catch (error) {
                console.log('交易详情加载失败', error)
                mescroll.endErr()
            }
        },
        // Flutter 由原生打开系统浏览器；普通 H5 保持在新窗口打开区块浏览器。
        openTransactionRecord(url) {
            const targetUrl = typeof url === 'string' ? url.trim() : ''
            if (!/^https?:\/\//i.test(targetUrl)) return

            if (window.__FROM_FLUTTER__) {
                if (typeof window.sendMessageToFlutter === 'function') {
                    window.sendMessageToFlutter(JSON.stringify({
                        type: 'openTransactionRecord',
                        url: targetUrl,
                    }))
                }
                return
            }

            const transactionWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer')
            if (transactionWindow) transactionWindow.opener = null
        },
    },
}
</script>

<style scoped lang="less">
.transaction-detail-page {
    width: 750px;
    min-height: 100vh;
    margin: 0 auto;
    background: #000308;
    color: #FFFFFF;

    button {
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

    // 顶部导航：统一使用设计稿 88px 高度的 Vant NavBar。
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
            max-width: 360px;
            font-size: 32px;
            font-weight: 400;
            line-height: 45px;
        }

        .van-nav-bar__left {
            left: 30px;
            padding: 0;
        }
    }

    .transaction-detail-back {
        width: 52px;
        height: 52px;
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.10);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    .transaction-detail-scroll {
        position: fixed;
        z-index: 1;
        top: 88px;
        bottom: 0;
        left: 50%;
        width: 750px;
        height: auto;
        overflow-x: hidden;
        transform: translateX(-50%);
        background: #000308;
        scrollbar-width: none;

        &::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
        }

        .transaction-detail-content {
            width: 750px;
            min-height: 100%;
            padding: 30px 30px 40px;
        }

        // 模块一：收益与费用概览卡
        .transaction-summary-card {
            position: relative;
            width: 690px;
            height: 342px;
            border: 1px solid rgba(255, 255, 255, 0.10);
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.10);
            box-shadow: inset 0 4px 10px rgba(0, 0, 0, 0.25);
            font-family: "Poppins", "PingFang SC", sans-serif;

            .transaction-summary-profit {
                position: absolute;
                top: 30px;
                left: 30px;
                font-size: 40px;
                line-height: 60px;
                white-space: nowrap;
            }

            .transaction-summary-roi {
                position: absolute;
                top: 41px;
                right: 30px;
                gap: 8px;
                color: #46FF2D;
                font-size: 26px;
                line-height: 39px;

                img {
                    width: 18px;
                    height: 18px;
                }
            }

            .transaction-summary-profit-label,
            .transaction-summary-roi-label,
            .transaction-summary-gross-label,
            .transaction-summary-fee-label {
                position: absolute;
                color: rgba(184, 195, 212, 0.60);
                font-size: 24px;
                line-height: 36px;
                white-space: nowrap;
            }

            .transaction-summary-profit-label {
                top: 94px;
                left: 30px;
            }

            .transaction-summary-roi-label {
                top: 94px;
                right: 30px;
            }

            .transaction-summary-divider {
                position: absolute;
                top: 160px;
                left: 30px;
                width: 630px;
                height: 1px;
                background: rgba(255, 255, 255, 0.12);
            }

            .transaction-summary-gross-label {
                top: 191px;
                left: 30px;
            }

            .transaction-summary-fee-label {
                top: 191px;
                right: 30px;
            }

            .transaction-summary-progress {
                position: absolute;
                top: 246px;
                left: 30px;
                width: 630px;
                height: 10px;
                overflow: hidden;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.12);

                .transaction-summary-progress-fee,
                .transaction-summary-progress-profit {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 10px;
                    border-radius: 999px;
                }

                .transaction-summary-progress-fee {
                    width: 50%;
                    background: #FF2D2D;
                }

                .transaction-summary-progress-profit {
                    width: 12.857%;
                    background: #46FF2D;
                }
            }

            .transaction-summary-gross-value,
            .transaction-summary-fee-value {
                position: absolute;
                top: 276px;
                font-size: 24px;
                line-height: 36px;
                white-space: nowrap;
            }

            .transaction-summary-gross-value {
                left: 30px;
                color: #46FF2D;
            }

            .transaction-summary-fee-value {
                right: 30px;
                color: #FF2D2D;
            }
        }

        // 模块二：买卖路径卡片
        .transaction-direction {
            display: grid;
            width: 690px;
            height: 138px;
            margin-top: 30px;
            grid-template-columns: 312px 42px 312px;
            column-gap: 12px;
            align-items: center;

            .transaction-direction-card {
                display: flex;
                height: 138px;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 3px;
                border: 2px solid rgba(255, 255, 255, 0.10);
                border-radius: 32px;

                &.transaction-direction-buy {
                    background: rgba(70, 255, 45, 0.10);

                    .transaction-direction-platform {
                        color: #46FF2D;
                    }
                }

                &.transaction-direction-sell {
                    background: rgba(255, 45, 45, 0.10);

                    .transaction-direction-platform {
                        color: #FF2D2D;
                    }
                }

                .transaction-direction-title {
                    font-size: 32px;
                    line-height: 45px;
                }

                .transaction-direction-platform {
                    font-size: 28px;
                    line-height: 39px;
                }
            }

            .transaction-direction-arrow {
                width: 42px;
                height: 42px;
                transform: rotate(90deg);
            }
        }

        // 模块三：执行 / 资讯 Tab 与信息卡
        .transaction-info-section {
            width: 690px;
            margin-top: 40px;

            .transaction-info-tabs {
                display: flex;
                height: 59px;
                align-items: center;
                gap: 12px;

                .transaction-info-tab {
                    height: 59px;
                    padding: 10px 30px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.20);
                    font-size: 28px;
                    line-height: 39px;
                    white-space: nowrap;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);

                    &.active {
                        background: #1261F3;
                        font-weight: 500;
                        backdrop-filter: none;
                        -webkit-backdrop-filter: none;
                    }
                }
            }

            .transaction-info-card {
                display: flex;
                width: 690px;
                min-height: 539px;
                margin-top: 24px;
                padding: 30px;
                flex-direction: column;
                gap: 24px;
                border-radius: 32px;
                background: rgba(255, 255, 255, 0.10);

                .transaction-info-row {
                    display: flex;
                    width: 630px;
                    height: 39px;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    font-size: 26px;
                    line-height: 39px;

                    .transaction-info-label {
                        flex: none;
                        color: #B8C3D4;
                    }

                    .transaction-info-value {
                        min-width: 0;
                        overflow: hidden;
                        font-family: "Poppins", "PingFang SC", sans-serif;
                        text-align: right;
                        text-overflow: ellipsis;
                        white-space: nowrap;

                        &.is-positive {
                            color: #46FF2D;
                        }

                        &.is-negative {
                            color: #FF2D2D;
                        }

                        &.is-muted {
                            color: #B8C3D4;
                        }
                    }
                }

                .transaction-info-divider {
                    width: 630px;
                    height: 1px;
                    flex: none;
                    background: rgba(255, 255, 255, 0.12);
                }
            }
        }

        // 模块四：交易记录列表
        .transaction-records-section {
            width: 690px;
            margin-top: 30px;

            .transaction-records-title {
                height: 45px;
                margin: 0;
                font-size: 32px;
                font-weight: 400;
                line-height: 45px;
            }

            .transaction-records-list {
                display: flex;
                flex-direction: column;
                margin-top: 20px;
                gap: 20px;

                .transaction-record-item {
                    width: 690px;
                    min-height: 112px;
                    padding: 0 30px;
                    border-radius: 32px;
                    background: rgba(255, 255, 255, 0.10);
                    font-size: 28px;
                    line-height: 39px;
                    text-align: left;

                    .transaction-record-copy {
                        display: flex;
                        min-width: 0;
                        flex-direction: column;
                        gap: 6px;

                        .transaction-record-hash {
                            display: block;
                            max-width: 570px;
                            overflow: hidden;
                            color: rgba(184, 195, 212, 0.60);
                            font-family: "Poppins", "PingFang SC", sans-serif;
                            font-size: 20px;
                            line-height: 30px;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }
                    }

                    img {
                        width: 24px;
                        height: 24px;
                    }
                }
            }
        }
    }
}
</style>

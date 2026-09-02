<template>
    <div class="global-transactions-page">
        <!-- 公共模块：固定顶部返回导航，H5 页面不重复实现系统状态栏 -->
        <van-nav-bar
            :title="$t('全网实时交易')"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
        >
            <template #left>
                <span class="global-transactions-back df-aic-jucen">
                    <van-icon name="arrow-left" size="14" color="#fff" />
                </span>
            </template>
        </van-nav-bar>

        <!-- 页面主体：链筛选与全网交易分页列表 -->
        <mescroll-vue
            ref="mescroll"
            class="global-transactions-scroll"
            :up="mescrollUp"
            @init="mescrollInit"
        >
            <main class="global-transactions-content">
                <!-- 模块一：公链筛选 -->
                <div class="global-transaction-chains" role="tablist">
                    <button
                        v-for="chain in chains"
                        :key="chain"
                        type="button"
                        role="tab"
                        class="global-transaction-chain"
                        :class="{ active: activeChain === chain }"
                        :aria-selected="activeChain === chain"
                        @click="changeChain(chain)"
                    >
                        {{ chain }}
                    </button>
                </div>

                <!-- 模块二：交易记录，标题与单位保留在模板中 -->
                <section class="global-transaction-list-section">
                    <div v-if="transactions.length" class="global-transaction-list">
                        <button
                            v-for="transaction in transactions"
                            :key="transaction.id"
                            type="button"
                            class="global-transaction-card"
                            :aria-label="$t('交易详情')"
                            @click="openTransaction(transaction)"
                        >
                            <div class="global-transaction-column global-transaction-hash">
                                <div class="global-transaction-label">{{ $t('哈希') }}</div>
                                <div class="global-transaction-value">{{ transaction.hash }}</div>
                                <div class="global-transaction-subvalue">{{ transaction.token }}</div>
                            </div>
                            <div class="global-transaction-column global-transaction-amount">
                                <div class="global-transaction-label">{{ $t('金额') }}</div>
                                <div class="global-transaction-value">{{ transaction.amount }}</div>
                                <div class="global-transaction-subvalue text-line-1">{{ transaction.route }}</div>
                            </div>
                            <div class="global-transaction-column global-transaction-profit">
                                <div class="global-transaction-label">{{ $t('收益/回报率') }}</div>
                                <div class="global-transaction-value">{{ transaction.profit }}</div>
                                <div class="global-transaction-rate">{{ transaction.rate }}</div>
                            </div>
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
    name: 'GlobalTransactions',
    data() {
        return {
            mescroll: null,
            activeChain: 'SOL',
            chains: ['SOL', 'BSC', 'ETH', 'TRX', 'POLYGON'],
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
            transactions: [],
        }
    },
    methods: {
        mescrollInit(mescroll) {
            this.mescroll = mescroll
        },
        changeChain(chain) {
            if (chain === this.activeChain) return
            this.activeChain = chain
            this.mescroll && this.mescroll.resetUpScroll()
        },
        openTransaction(transaction) {
            this.$router.push({
                name: 'transactionDetail',
                params: { transactionId: transaction.id },
            })
        },
        // 链筛选由服务端分页处理，确保每页数量和无数据状态准确。
        async upCallback(page, mescroll) {
            try {
                const res = await this.$http.get('/api/block_logs', {
                    page_no: page.num,
                    page_size: Math.min(page.size || 10, 20),
                    chain: this.activeChain,
                })
                const source = res.code == 200 && res.data && Array.isArray(res.data.block_logs)
                    ? res.data.block_logs
                    : []
                const currentPageTransactions = source.map(item => ({
                    id: item.id,
                    chain: item.chain,
                    hash: item.tx_hash || this.$t('无数据'),
                    token: item.token || this.$t('无数据'),
                    amount: item.amount_usd || this.$t('无数据'),
                    route: this.platformRoute(item),
                    profit: item.profit || this.$t('无数据'),
                    rate: item.roi || this.$t('无数据'),
                }))

                if (page.num === 1) this.transactions = []
                this.transactions = this.transactions.concat(currentPageTransactions)
                this.$nextTick(() => mescroll.endSuccess(source.length))
            } catch (error) {
                console.log('全网交易列表加载失败', error)
                mescroll.endErr()
            }
        },
        // 金额下方展示买入与卖出平台路径，例如 quickswap>uniswap。
        platformRoute(item) {
            const buyPlatform = String(item.buy_platform || '').trim()
            const sellPlatform = String(item.sell_platform || '').trim()
            if (buyPlatform && sellPlatform) return `${buyPlatform}>${sellPlatform}`
            return buyPlatform || sellPlatform || this.$t('无数据')
        },
    },
}
</script>

<style scoped lang="less">
.global-transactions-page {
    width: 750px;
    min-height: 100vh;
    margin: 0 auto;
    background: #01050C;
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

    .global-transactions-back {
        width: 52px;
        height: 52px;
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.10);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    // 页面滚动区固定在顶部导航下方。
    .global-transactions-scroll {
        position: fixed;
        z-index: 1;
        top: 88px;
        bottom: 0;
        left: 50%;
        width: 750px;
        height: auto;
        transform: translateX(-50%);
        background: #01050C;

        .global-transactions-content {
            width: 750px;
            min-height: 100%;
            padding: 30px 30px 40px;
        }

        // 模块一：公链筛选胶囊按钮
        .global-transaction-chains {
            display: flex;
            width: 690px;
            height: 59px;
            align-items: center;
            gap: 12px;

            .global-transaction-chain {
                flex: none;
                min-width: 0;
                height: 59px;
                padding: 10px 20px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.20);
                font-size: 28px;
                font-weight: 400;
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

        // 模块二：全网交易卡片列表
        .global-transaction-list-section {
            width: 690px;

            .global-transaction-list {
                display: flex;
                flex-direction: column;
                margin-top: 30px;
                gap: 20px;

                .global-transaction-card {
                    display: grid;
                    width: 690px;
                    height: 168px;
                    padding: 30px;
                    grid-template-columns: 180px 176px 176px;
                    column-gap: 49px;
                    border-radius: 32px;
                    background: rgba(255, 255, 255, 0.10);
                    text-align: left;

                    .global-transaction-column {
                        display: flex;
                        min-width: 0;
                        flex-direction: column;
                        gap: 12px;
                        line-height: normal;

                        &.global-transaction-profit {
                            align-items: flex-end;
                            text-align: right;
                        }

                        .global-transaction-label {
                            width: 100%;
                            overflow: hidden;
                            color: rgba(255, 255, 255, 0.50);
                            font-size: 20px;
                            line-height: 28px;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }

                        .global-transaction-value {
                            width: 100%;
                            overflow: hidden;
                            font-size: 24px;
                            font-weight: 500;
                            line-height: 34px;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }

                        .global-transaction-subvalue,
                        .global-transaction-rate {
                            width: 100%;
                            overflow: hidden;
                            color: rgba(255, 255, 255, 0.50);
                            font-size: 22px;
                            line-height: 31px;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }

                        .global-transaction-rate {
                            color: #4C91FF;
                        }
                    }
                }
            }
        }
    }
}
</style>

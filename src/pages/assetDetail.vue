<template>
    <div class="asset-detail-page">
        <!-- 公共模块：固定顶部返回导航，状态栏按 H5 规范不实现 -->
        <van-nav-bar
            :title="assetInfo.symbol"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
        >
            <template #left>
                <span class="asset-detail-back df-aic-jucen">
                    <van-icon name="arrow-left" size="14" color="#fff" />
                </span>
            </template>
        </van-nav-bar>

        <!-- 模块一：币种概览与资产明细分页列表 -->
        <mescroll-vue
            ref="mescroll"
            class="asset-detail-scroll"
            :up="mescrollUp"
            @init="mescrollInit"
        >
            <main class="asset-detail-content">
                <!-- 币种资产汇总卡 -->
                <section class="token-summary">
                    <img :src="assetInfo.icon" :alt="assetInfo.symbol" class="token-summary-icon" />
                    <div class="token-summary-info">
                        <div class="token-summary-symbol">{{ assetInfo.symbol }}</div>
                        <div class="token-summary-price">{{ assetInfo.price }}</div>
                    </div>
                    <div class="token-summary-balance">
                        <div class="token-summary-amount">{{ assetInfo.balance }}</div>
                        <div class="token-summary-fiat">{{ assetInfo.fiatValue }}</div>
                    </div>
                </section>

                <!-- 资产流水列表：标题与单位留在模板，数据仅保留业务字段 -->
                <section class="asset-records">
                    <h1 class="asset-records-title">{{ $t('资产明细') }}</h1>
                    <div v-if="records.length" class="asset-records-list">
                        <article
                            v-for="record in records"
                            :key="record.id"
                            class="asset-record-card"
                        >
                            <div class="asset-record-copy">
                                {{ record.content || $t('无数据') }}
                            </div>
                            <time class="asset-record-time">{{ record.time }}</time>
                            <div
                                class="asset-record-amount"
                                :class="record.type === 'income' ? 'is-income' : 'is-expense'"
                            >
                                {{ record.amount }}
                            </div>
                        </article>
                    </div>
                    <no-data v-else></no-data>
                </section>
            </main>
        </mescroll-vue>

        <!-- 模块二：固定页面底部的充值与提现入口 -->
        <footer class="asset-detail-actions">
            <button
                type="button"
                class="asset-detail-action asset-detail-action-recharge"
                @click="openRecharge"
            >
                {{ $t('充值') }}
            </button>
            <button
                type="button"
                class="asset-detail-action asset-detail-action-withdraw"
                @click="openWithdraw"
            >
                {{ $t('提现') }}
            </button>
        </footer>
    </div>
</template>

<script>
import assetTokenAxe from '@img/axe.png'
import assetTokenAix from '@img/aix.png'
import assetTokenUsdt from '@img/usdt.png'

const ASSET_MAP = {
    axe: {
        id: 'axe',
        symbol: 'AXE',
        balanceField: 'balance_axe',
        ccy: 'balance_axe',
        price: '',
        fiatValue: '',
        icon: assetTokenAxe,
    },
    aix: {
        id: 'aix',
        symbol: 'AIX',
        balanceField: 'balance_aix',
        ccy: 'balance_aix',
        price: '',
        fiatValue: '',
        icon: assetTokenAix,
    },
    usdt: {
        id: 'usdt',
        symbol: 'USDT',
        balanceField: 'balance_usdt',
        ccy: 'balance_usdt',
        price: '',
        fiatValue: '',
        icon: assetTokenUsdt,
    },
}

export default {
    name: 'AssetDetail',
    data() {
        return {
            mescroll: null,
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
            records: [],
            balances: {},
        }
    },
    computed: {
        assetInfo() {
            const assetId = String(this.$route.params.assetId || 'usdt').toLowerCase()
            const asset = ASSET_MAP[assetId] || ASSET_MAP.usdt
            return {
                ...asset,
                price: this.$t('无数据'),
                fiatValue: this.$t('无数据'),
                balance: this.balances[asset.balanceField] || this.$t('无数据'),
            }
        },
    },
    mounted() {
        this.loadBalance()
    },
    methods: {
        async loadBalance() {
            try {
                const res = await this.$http.get('/api/users/my/balance')
                if (res.code == 200 && res.data) this.balances = res.data
            } catch (error) {
                console.log('代币余额加载失败', error)
            }
        },
        openRecharge() {
            this.$router.push({
                name: 'assetRecharge',
                params: {
                    assetId: this.assetInfo.id,
                },
            })
        },
        openWithdraw() {
            if (!['usdt', 'axe'].includes(this.assetInfo.id)) {
                this.$toast(this.$t('当前币种暂不支持提现'))
                return
            }
            this.$router.push({
                name: 'assetWithdraw',
                params: {
                    assetId: this.assetInfo.id,
                },
            })
        },
        mescrollInit(mescroll) {
            this.mescroll = mescroll
        },
        // ccy 参数目前无法传真实币种，先读取服务端分页并按返回的 ccy 精确筛选。
        async upCallback(page, mescroll) {
            try {
                const res = await this.$http.get('/api/asset_logs', {
                    page_no: page.num,
                    page_size: Math.min(page.size || 10, 20),
                })
                const source = res.code == 200 && res.data && Array.isArray(res.data.asset_logs)
                    ? res.data.asset_logs
                    : []
                const currentPageRecords = source
                    .filter(item => item.ccy === this.assetInfo.ccy)
                    .map(item => ({
                        id: item.id,
                        type: Number(item.is_inc) === 1 ? 'income' : 'expense',
                        content: item.content,
                        time: item.created_at,
                        amount: item.amount,
                    }))
                if (page.num === 1) this.records = []
                this.records = this.records.concat(currentPageRecords)
                this.$nextTick(() => mescroll.endSuccess(source.length))
            } catch (error) {
                console.log('资产流水加载失败', error)
                mescroll.endErr()
            }
        },
    },
}
</script>

<style scoped lang="less">
.asset-detail-page {
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
        color: inherit;
        font: inherit;
    }

    // 顶部导航：覆盖 Vant 默认 46px 高度，严格对应设计稿 88px。
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

    .asset-detail-back {
        width: 52px;
        height: 52px;
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.10);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    // 滚动区固定在顶部导航下方，底部空间为固定操作按钮预留。
    .asset-detail-scroll {
        position: fixed;
        z-index: 1;
        top: 88px;
        bottom: 0;
        left: 50%;
        width: 750px;
        height: auto;
        transform: translateX(-50%);
        background: #01050C;

        .asset-detail-content {
            width: 750px;
            min-height: 100%;
            padding: 30px 30px 150px;
        }

        // 模块一：币种资产汇总卡
        .token-summary {
            position: relative;
            width: 690px;
            height: 150px;
            border: 2px solid rgba(255, 255, 255, 0.10);
            border-radius: 32px;
            background: rgba(255, 255, 255, 0.10);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);

            .token-summary-icon {
                position: absolute;
                top: 35px;
                left: 28px;
                width: 76px;
                height: 76px;
                object-fit: contain;
            }

            .token-summary-info {
                position: absolute;
                top: 28px;
                left: 124px;
                display: flex;
                width: 220px;
                flex-direction: column;

                .token-summary-symbol {
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 30px;
                    font-weight: 600;
                    line-height: 45px;
                }

                .token-summary-price {
                    margin-top: 4px;
                    color: rgba(255, 255, 255, 0.50);
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 24px;
                    line-height: 36px;
                }
            }

            .token-summary-balance {
                position: absolute;
                top: 28px;
                right: 28px;
                display: flex;
                width: 220px;
                flex-direction: column;
                align-items: flex-end;
                font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                text-align: right;

                .token-summary-amount {
                    font-size: 28px;
                    line-height: 42px;
                    white-space: nowrap;
                }

                .token-summary-fiat {
                    margin-top: 8px;
                    color: rgba(255, 255, 255, 0.50);
                    font-size: 24px;
                    line-height: 36px;
                    white-space: nowrap;
                }
            }
        }

        // 模块二：资产流水明细
        .asset-records {
            width: 690px;
            margin-top: 30px;

            .asset-records-title {
                height: 45px;
                margin: 0;
                font-size: 32px;
                font-weight: 400;
                line-height: 45px;
            }

            .asset-records-list {
                display: flex;
                flex-direction: column;
                margin-top: 24px;
                gap: 16px;

                .asset-record-card {
                    position: relative;
                    width: 690px;
                    height: 135px;
                    border-radius: 32px;
                    background: rgba(255, 255, 255, 0.10);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);

                    .asset-record-copy {
                        position: absolute;
                        top: 22px;
                        left: 30px;
                        max-width: 390px;
                        overflow: hidden;
                        font-size: 28px;
                        line-height: 40px;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .asset-record-time {
                        position: absolute;
                        top: 70px;
                        left: 30px;
                        color: rgba(255, 255, 255, 0.50);
                        font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                        font-size: 24px;
                        font-style: normal;
                        line-height: 36px;
                        white-space: nowrap;
                    }

                    .asset-record-amount {
                        position: absolute;
                        top: 43px;
                        right: 30px;
                        max-width: 210px;
                        overflow: hidden;
                        font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                        font-size: 28px;
                        line-height: 42px;
                        text-align: right;
                        text-overflow: ellipsis;
                        white-space: nowrap;

                        &.is-income {
                            color: #B7FF2D;
                        }

                        &.is-expense {
                            color: #FF2D2D;
                        }
                    }
                }
            }
        }
    }

    // 模块三：固定悬浮底部操作区
    .asset-detail-actions {
        position: fixed;
        z-index: 100;
        bottom: calc(20px + env(safe-area-inset-bottom));
        left: 50%;
        display: flex;
        width: 690px;
        height: 88px;
        gap: 20px;
        transform: translateX(-50%);

        .asset-detail-action {
            width: 335px;
            height: 88px;
            border-radius: 999px;
            font-size: 32px;
            line-height: 45px;
            text-align: center;
            transition: transform 0.2s;

            &:active {
                transform: scale(0.96);
            }

            &.asset-detail-action-recharge {
                border: 2px solid rgba(255, 255, 255, 0.10);
                background: rgba(255, 255, 255, 0.10);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
            }

            &.asset-detail-action-withdraw {
                background: #1261F3;
            }
        }
    }
}
</style>

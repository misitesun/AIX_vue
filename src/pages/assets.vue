<template>
    <div class="page-assets">
        <img src="@img/asset-page-bg.png" alt="" class="page-assets-background" />

        <!-- 公共模块：固定品牌导航，与首页同步展示账户、消息和语言入口 -->
        <home-nav-bar
            theme="assets"
            @click-notice="$go(2, '/noticeList')"
        />

        <!-- 模块一：总资产概览 -->
        <section class="asset-overview">
            <div class="asset-overview-label">{{ $t('总资产折合价值') }}</div>
            <div class="asset-overview-value df-aic">
                <img src="@img/home-asset-token.png" alt="USDT" class="asset-overview-token" />
                <div v-if="showBalance" class="asset-overview-number">
                    <span>{{ splitDecimal(totalAssetValue).integer }}</span>
                    <span class="asset-overview-decimal">{{ splitDecimal(totalAssetValue).decimal }}</span>
                </div>
                <div v-else class="asset-overview-number">****</div>
            </div>
            <button
                type="button"
                class="asset-overview-eye df-aic-jucen"
                :aria-label="$t('总资产折合价值')"
                @click="showBalance = !showBalance"
            >
                <img src="@img/home-eye.png" alt="" />
            </button>
        </section>

        <!-- 模块二：资产操作入口 -->
        <section class="asset-actions">
            <button type="button" class="asset-action-card" @click="openRecharge">
                <span class="asset-action-icon asset-action-icon-recharge df-aic-jucen">
                    <img src="@img/asset-action-recharge.svg" alt="" />
                </span>
                <span class="asset-action-label">{{ $t('充值') }}</span>
            </button>
            <button type="button" class="asset-action-card" @click="openWithdraw">
                <span class="asset-action-icon asset-action-icon-withdraw df-aic-jucen">
                    <img src="@img/asset-action-withdraw.svg" alt="" />
                </span>
                <span class="asset-action-label">{{ $t('提现') }}</span>
            </button>
            <button type="button" class="asset-action-card" @click="openTransfer">
                <span class="asset-action-icon asset-action-icon-transfer df-aic-jucen">
                    <img src="@img/asset-action-transfer.svg" alt="" />
                </span>
                <span class="asset-action-label">{{ $t('划转') }}</span>
            </button>
        </section>

        <!-- 模块三：资产管理列表 -->
        <section class="asset-management">
            <h1 class="asset-management-title">{{ $t('资产管理') }}</h1>
            <div class="asset-management-list">
                <button
                    v-for="item in assets"
                    :key="item.id"
                    type="button"
                    class="asset-management-card"
                    @click="openAssetDetail(item)"
                >
                    <img :src="item.icon" :alt="item.symbol" class="asset-management-token" />
                    <span class="asset-management-info">
                        <span class="asset-management-symbol">{{ item.symbol }}</span>
                        <span v-if="item.showValuation" class="asset-management-price">{{ item.price }}</span>
                    </span>
                    <span class="asset-management-balance">
                        <span v-if="showBalance" class="asset-management-amount">{{ item.balance }}</span>
                        <span v-else class="asset-management-amount">****</span>
                        <span v-if="item.showValuation && showBalance" class="asset-management-fiat">{{ item.fiatValue }}</span>
                        <span v-else-if="item.showValuation" class="asset-management-fiat">****</span>
                    </span>
                    <img src="@img/home-more-arrow.png" alt="" class="asset-management-arrow" />
                </button>
            </div>
        </section>

        <!-- 公共模块：固定悬浮底部 TabBar -->
        <home-tab-bar active="assets" @change="handleTabChange" />
    </div>
</template>

<script>
import HomeNavBar from '@/components/homeNavBar'
import HomeTabBar from '@/components/homeTabBar'
import assetTokenAxe from '@img/axe.png'
import assetTokenAix from '@img/aix.png'
import assetTokenUsdt from '@img/usdt.png'
import BigNumber from 'bignumber.js'

export default {
    name: 'Assets',
    components: {
        HomeNavBar,
        HomeTabBar,
    },
    data() {
        return {
            showBalance: true,
            totalAssetValue: this.$t('无数据'),
            // AXE、AIX 的单价来自余额接口；右下金额按“余额 × 单价”计算。
            assets: [
                {
                    id: 'axe',
                    symbol: 'AXE',
                    balanceField: 'balance_axe',
                    priceField: 'axe_price',
                    showValuation: true,
                    price: this.$t('无数据'),
                    balance: this.$t('无数据'),
                    fiatValue: this.$t('无数据'),
                    icon: assetTokenAxe,
                },
                {
                    id: 'aix',
                    symbol: 'AIX',
                    balanceField: 'balance_aix',
                    priceField: 'aix_price',
                    showValuation: true,
                    price: this.$t('无数据'),
                    balance: this.$t('无数据'),
                    fiatValue: this.$t('无数据'),
                    icon: assetTokenAix,
                },
                {
                    id: 'usdt',
                    symbol: 'USDT',
                    balanceField: 'balance_usdt',
                    // USDT 不展示单价和折合金额，避免出现无意义的“无数据”。
                    showValuation: false,
                    price: '',
                    balance: this.$t('无数据'),
                    fiatValue: '',
                    icon: assetTokenUsdt,
                },
            ],
        }
    },
    mounted() {
        this.loadBalances()
    },
    methods: {
        async loadBalances() {
            try {
                const res = await this.$http.get('/api/users/my/balance')
                if (res.code == 200 && res.data) {
                    this.totalAssetValue = this.getDisplayValue(res.data.total_balance)
                    this.assets = this.assets.map(item => {
                        const balance = res.data[item.balanceField]
                        const price = item.priceField ? res.data[item.priceField] : ''
                        return {
                            ...item,
                            balance: this.getDisplayValue(balance),
                            price: item.showValuation ? this.getDisplayValue(price) : '',
                            fiatValue: item.showValuation
                                ? this.calculateAssetValue(balance, price)
                                : '',
                        }
                    })
                }
            } catch (error) {
                console.log('资产余额加载失败', error)
            }
        },
        openRecharge() {
            this.$router.push({
                name: 'assetRecharge',
                params: {
                    assetId: 'usdt',
                },
            })
        },
        openWithdraw() {
            this.$router.push({
                name: 'assetWithdraw',
                params: {
                    assetId: 'usdt',
                },
            })
        },
        openTransfer() {
            this.$router.push({
                name: 'assetTransfer',
                params: {
                    assetId: 'aix',
                },
            })
        },
        openAssetDetail(item) {
            this.$router.push(`/assets/${item.id}`)
        },
        handleTabChange(tab) {
            if (tab === 'index') {
                this.$go(2, '/index')
            } else if (tab === 'node') {
                this.$go(2, '/node')
            } else if (tab === 'mine') {
                this.$go(2, '/mine')
            }
        },
        getDisplayValue(value) {
            return value === undefined || value === null || value === ''
                ? this.$t('无数据')
                : value
        },
        // 仅将接口原始数值用于“余额 × 单价”计算，避免浮点精度影响展示结果。
        calculateAssetValue(balance, price) {
            if (balance === undefined || balance === null || balance === '' || price === undefined || price === null || price === '') {
                return this.$t('无数据')
            }
            const balanceValue = new BigNumber(balance)
            const priceValue = new BigNumber(price)
            if (!balanceValue.isFinite() || !priceValue.isFinite()) return this.$t('无数据')
            return balanceValue.times(priceValue).toFixed()
        },
        // 仅拆分整数与小数以匹配设计稿字号，不改变接口原始值。
        splitDecimal(value) {
            const parts = String(value || '').split('.')
            return {
                integer: parts[0],
                decimal: parts.length > 1 ? `.${parts.slice(1).join('.')}` : '',
            }
        },
    },
}
</script>

<style scoped lang="less">
.page-assets {
    position: relative;
    width: 750px;
    height: 1624px;
    min-height: 100vh;
    margin: 0 auto;
    overflow: hidden;
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

    .page-assets-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 750px;
        height: 860px;
        object-fit: cover;
        pointer-events: none;
    }

    // 模块一：总资产概览
    .asset-overview {
        position: absolute;
        top: 204px;
        left: 30px;
        width: 690px;
        height: 130px;

        .asset-overview-label {
            width: 598px;
            font-size: 24px;
            line-height: 34px;
        }

        .asset-overview-value {
            position: absolute;
            top: 74px;
            left: 0;
            height: 56px;
            gap: 16px;

            .asset-overview-token {
                width: 52px;
                height: 52px;
            }

            .asset-overview-number {
                font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                font-size: 56px;
                font-weight: 500;
                line-height: 56px;
                letter-spacing: -1px;

                .asset-overview-decimal {
                    color: rgba(255, 255, 255, 0.60);
                    font-size: 28px;
                    letter-spacing: 0;
                }
            }
        }

        .asset-overview-eye {
            position: absolute;
            top: 0;
            right: 0;
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.20);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);

            img {
                width: 40px;
                height: 40px;
            }
        }
    }

    // 模块二：充值、提现、划转入口
    .asset-actions {
        position: absolute;
        top: 394px;
        left: 30px;
        display: flex;
        width: 690px;
        height: 180px;
        gap: 15px;

        .asset-action-card {
            position: relative;
            flex: none;
            width: 220px;
            height: 180px;
            border: 1px solid rgba(255, 255, 255, 0.20);
            border-radius: 32px;
            background: rgba(255, 255, 255, 0.10);
            text-align: left;
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);

            .asset-action-icon {
                position: absolute;
                top: 21px;
                left: 27px;
                width: 52px;
                height: 52px;
                border-radius: 50%;

                img {
                    display: block;
                    width: 34px;
                    height: 34px;
                }

                &.asset-action-icon-recharge {
                    top: 22px;
                    left: 26px;
                    background: linear-gradient(135deg, #005FFF 0%, #277AFF 100%);
                    box-shadow: 0 4px 20px rgba(0, 132, 255, 0.40);

                    img {
                        width: 32px;
                        height: 32px;
                    }
                }

                &.asset-action-icon-withdraw {
                    background: linear-gradient(135deg, #23CB43 0%, #22CC41 100%);
                    box-shadow: 0 4px 20px rgba(35, 204, 66, 0.40);

                    img {
                        width: 32px;
                        height: 32px;
                    }
                }

                &.asset-action-icon-transfer {
                    background: linear-gradient(135deg, #FF5100 0%, #FF8000 100%);
                    box-shadow: 0 4px 20px rgba(255, 81, 0, 0.40);
                }
            }

            .asset-action-label {
                position: absolute;
                top: 117px;
                left: 30px;
                font-size: 28px;
                font-weight: 400;
                line-height: 39px;
            }
        }
    }

    // 模块三：资产管理列表
    .asset-management {
        position: absolute;
        top: 634px;
        left: 30px;
        width: 690px;

        .asset-management-title {
            height: 45px;
            margin: 0;
            font-size: 32px;
            font-weight: 500;
            line-height: 45px;
        }

        .asset-management-list {
            display: flex;
            flex-direction: column;
            margin-top: 30px;
            gap: 24px;

            .asset-management-card {
                position: relative;
                width: 690px;
                height: 136px;
                border-radius: 32px;
                background: rgba(255, 255, 255, 0.10);
                text-align: left;
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);

                .asset-management-token {
                    position: absolute;
                    top: 30px;
                    left: 30px;
                    width: 76px;
                    height: 76px;
                    object-fit: contain;
                }

                .asset-management-info {
                    position: absolute;
                    top: 26px;
                    left: 126px;
                    display: flex;
                    flex-direction: column;

                    .asset-management-symbol {
                        font-size: 30px;
                        font-weight: 600;
                        line-height: 45px;
                    }

                    .asset-management-price {
                        margin-top: 4px;
                        color: rgba(255, 255, 255, 0.50);
                        font-size: 24px;
                        font-weight: 400;
                        line-height: 36px;
                    }
                }

                .asset-management-balance {
                    position: absolute;
                    top: 27px;
                    left: 468px;
                    display: flex;
                    width: 168px;
                    flex-direction: column;
                    align-items: flex-end;
                    text-align: right;

                    .asset-management-amount {
                        font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                        font-size: 28px;
                        font-weight: 500;
                        line-height: 42px;
                        white-space: nowrap;
                    }

                    .asset-management-fiat {
                        margin-top: 4px;
                        color: rgba(255, 255, 255, 0.50);
                        font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                        font-size: 24px;
                        font-weight: 400;
                        line-height: 36px;
                        white-space: nowrap;
                    }
                }

                .asset-management-arrow {
                    position: absolute;
                    top: 56px;
                    left: 646px;
                    width: 24px;
                    height: 24px;
                }
            }
        }
    }
}
</style>

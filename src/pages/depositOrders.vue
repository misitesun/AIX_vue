<template>
    <div class="deposit-orders-page">
        <!-- 公共模块：固定顶部返回导航，H5 页面不重复实现系统状态栏 -->
        <van-nav-bar
            :title="$t('入金订单')"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
        >
            <template #left>
                <span class="deposit-orders-back df-aic-jucen">
                    <van-icon name="arrow-left" size="14" color="#fff" />
                </span>
            </template>
        </van-nav-bar>

        <!-- 页面主体：状态筛选与入金订单分页列表 -->
        <mescroll-vue
            ref="mescroll"
            class="deposit-orders-scroll"
            :up="mescrollUp"
            @init="mescrollInit"
        >
            <main class="deposit-orders-content">
                <!-- 模块一：订单状态筛选 -->
                <header class="deposit-order-list-heading df-aic-jusb">
                    <h1 class="deposit-order-list-title">{{ $t('订单列表') }}</h1>
                    <div class="deposit-order-tabs" role="tablist">
                        <button
                            v-for="tab in statusTabs"
                            :key="tab.value"
                            type="button"
                            role="tab"
                            class="deposit-order-tab"
                            :class="{ active: activeStatus === tab.value }"
                            :aria-selected="activeStatus === tab.value"
                            @click="changeStatus(tab.value)"
                        >
                            <img
                                v-if="activeStatus === tab.value"
                                src="@img/node-order-active-dot.svg"
                                alt=""
                                class="deposit-order-tab-dot"
                            />
                            <span>{{ $t(tab.label) }}</span>
                        </button>
                    </div>
                </header>

                <!-- 模块二：入金订单列表，字段结构可直接替换为接口返回 -->
                <section class="deposit-order-list-section">
                    <div v-if="orders.length" class="deposit-order-list">
                        <article v-for="order in orders" :key="order.id" class="deposit-order-card">
                            <div class="deposit-order-plan">
                                <img src="@img/home-plan-badge.png" alt="" class="deposit-order-plan-icon" />
                                <span>{{ order.productName }}</span>
                            </div>
                            <time class="deposit-order-time">{{ order.createdAt }}</time>

                            <div class="deposit-order-income-label">{{ $t('总收益(USDT)') }}</div>
                            <div class="deposit-order-income-value">{{ order.totalIncome }}</div>

                            <div class="deposit-order-metrics">
                                <div class="deposit-order-metric">
                                    <div class="deposit-order-metric-value">{{ order.principal }}</div>
                                    <div class="deposit-order-metric-label">{{ $t('本金(USDT)') }}</div>
                                </div>
                                <div class="deposit-order-metric">
                                    <div class="deposit-order-metric-value deposit-order-metric-value-today">
                                        {{ order.todayIncome }}
                                    </div>
                                    <div class="deposit-order-metric-label">{{ $t('今日收益(USDT)') }}</div>
                                </div>
                                <div class="deposit-order-metric">
                                    <div class="deposit-order-metric-value">
                                        {{ order.elapsedDays }}/{{ order.cycleDays }}{{ $t('天') }}
                                    </div>
                                    <div class="deposit-order-metric-label">{{ $t('周期') }}</div>
                                </div>
                            </div>
                        </article>
                    </div>
                    <no-data v-else></no-data>
                </section>
            </main>
        </mescroll-vue>
    </div>
</template>

<script>
export default {
    name: 'DepositOrders',
    data() {
        return {
            mescroll: null,
            activeStatus: 'ongoing',
            statusTabs: [
                { value: 'ongoing', label: '进行中' },
                { value: 'completed', label: '已完成' },
            ],
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
            orders: [],
        }
    },
    methods: {
        mescrollInit(mescroll) {
            this.mescroll = mescroll
        },
        changeStatus(status) {
            if (status === this.activeStatus) return
            this.activeStatus = status
            this.mescroll && this.mescroll.resetUpScroll()
        },
        async upCallback(page, mescroll) {
            try {
                const res = await this.$http.get('/api/orders', {
                    status: this.activeStatus === 'ongoing' ? 1 : 0,
                    page_no: page.num,
                    page_size: Math.min(page.size || 10, 20),
                })
                const source = res.code == 200 && res.data && Array.isArray(res.data.orders) ? res.data.orders : []
                const currentPageOrders = source.map(order => ({
                    id: order.id,
                    status: Number(order.status) === 1 ? 'ongoing' : 'completed',
                    productName: order.product && order.product.name ? order.product.name : this.$t('无数据'),
                    createdAt: order.created_at,
                    totalIncome: order.release_amount,
                    principal: order.amount,
                    todayIncome: order.today_amount,
                    elapsedDays: order.release_count,
                    cycleDays: order.output_count,
                }))
                if (page.num === 1) this.orders = []
                this.orders = this.orders.concat(currentPageOrders)
                this.$nextTick(() => mescroll.endSuccess(source.length))
            } catch (error) {
                console.log('理财订单加载失败', error)
                mescroll.endErr()
            }
        },
    },
}
</script>

<style scoped lang="less">
.deposit-orders-page {
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

    .deposit-orders-back {
        width: 52px;
        height: 52px;
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.10);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    // 页面滚动区固定在顶部导航下方。
    .deposit-orders-scroll {
        position: fixed;
        z-index: 1;
        top: 88px;
        bottom: 0;
        left: 50%;
        width: 750px;
        height: auto;
        transform: translateX(-50%);
        background: #01050C;

        .deposit-orders-content {
            width: 750px;
            min-height: 100%;
            padding: 30px 30px 40px;
        }

        // 模块一：订单标题与状态筛选
        .deposit-order-list-heading {
            width: 690px;
            height: 45px;

            .deposit-order-list-title {
                margin: 0;
                font-size: 32px;
                font-weight: 400;
                line-height: 45px;
            }

            .deposit-order-tabs {
                display: flex;
                height: 45px;
                align-items: center;
                gap: 30px;

                .deposit-order-tab {
                    display: flex;
                    height: 45px;
                    align-items: center;
                    gap: 8px;
                    color: rgba(255, 255, 255, 0.80);
                    font-size: 28px;
                    line-height: 39px;
                    white-space: nowrap;

                    &.active {
                        color: #B7FF2D;
                        font-weight: 500;
                    }

                    .deposit-order-tab-dot {
                        width: 8px;
                        height: 8px;
                    }
                }
            }
        }

        // 模块二：入金订单卡片列表
        .deposit-order-list-section {
            width: 690px;

            .deposit-order-list {
                display: flex;
                flex-direction: column;
                margin-top: 26px;
                gap: 20px;

                .deposit-order-card {
                    position: relative;
                    width: 690px;
                    height: 364px;
                    border: 2px solid rgba(255, 255, 255, 0.10);
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.10);

                    .deposit-order-plan {
                        position: absolute;
                        top: 22px;
                        left: 28px;
                        display: flex;
                        height: 56px;
                        padding: 10px 20px;
                        align-items: center;
                        gap: 10px;
                        border: 1px solid #1261F3;
                        border-radius: 999px;
                        color: #4C91FF;
                        font-size: 26px;
                        line-height: 36px;
                        white-space: nowrap;

                        .deposit-order-plan-icon {
                            width: 32px;
                            height: 32px;
                            object-fit: contain;
                        }
                    }

                    .deposit-order-time {
                        position: absolute;
                        top: 25px;
                        right: 28px;
                        color: rgba(255, 255, 255, 0.50);
                        font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                        font-size: 24px;
                        font-style: normal;
                        line-height: 36px;
                        white-space: nowrap;
                    }

                    .deposit-order-income-label {
                        position: absolute;
                        top: 108px;
                        left: 28px;
                        color: rgba(255, 255, 255, 0.50);
                        font-size: 24px;
                        line-height: 36px;
                    }

                    .deposit-order-income-value {
                        position: absolute;
                        top: 150px;
                        left: 28px;
                        max-width: 630px;
                        overflow: hidden;
                        font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                        font-size: 48px;
                        font-weight: 500;
                        line-height: 72px;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .deposit-order-metrics {
                        position: absolute;
                        top: 255px;
                        left: 28px;
                        display: grid;
                        width: 630px;
                        grid-template-columns: 219px 219px 192px;

                        .deposit-order-metric {
                            min-width: 0;

                            .deposit-order-metric-value {
                                overflow: hidden;
                                font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                                font-size: 24px;
                                line-height: 36px;
                                text-overflow: ellipsis;
                                white-space: nowrap;

                                &.deposit-order-metric-value-today {
                                    color: #B7FF2D;
                                }
                            }

                            .deposit-order-metric-label {
                                margin-top: 9px;
                                overflow: hidden;
                                color: rgba(255, 255, 255, 0.50);
                                font-size: 20px;
                                line-height: 28px;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>

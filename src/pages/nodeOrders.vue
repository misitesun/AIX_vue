<template>
    <div class="node-orders-page">
        <!-- 公共模块：固定顶部返回导航，H5 页面不重复实现系统状态栏 -->
        <van-nav-bar
            :title="$t('认购订单')"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
        >
            <template #left>
                <span class="node-orders-back df-aic-jucen">
                    <van-icon name="arrow-left" size="14" color="#fff" />
                </span>
            </template>
        </van-nav-bar>

        <!-- 页面主体：收益概览、订单筛选与分页列表统一放入 mescroll -->
        <mescroll-vue
            ref="mescroll"
            class="node-orders-scroll"
            :up="mescrollUp"
            @init="mescrollInit"
        >
            <main class="node-orders-content">
                <!-- 模块一：累计与今日分红概览 -->
                <section class="node-order-overview">
                    <div class="node-order-overview-card node-order-overview-total">
                        <div class="node-order-overview-label">{{ $t('累计分红收益') }}</div>
                        <div class="node-order-overview-value">{{ overview.totalDividend }}</div>
                        <img src="@img/asset-token-usdt.svg" alt="USDT" class="node-order-overview-token" />
                    </div>
                    <div class="node-order-overview-card node-order-overview-today">
                        <div class="node-order-overview-label">{{ $t('今日分红收益') }}</div>
                        <div class="node-order-overview-value">{{ overview.todayDividend }}</div>
                    </div>
                </section>

                <!-- 模块二：订单状态筛选 -->
                <section class="node-order-list-section">
                    <header class="node-order-list-heading df-aic-jusb">
                        <h1 class="node-order-list-title">{{ $t('订单列表') }}</h1>
                        <div class="node-order-tabs" role="tablist">
                            <button
                                v-for="tab in statusTabs"
                                :key="tab.value"
                                type="button"
                                role="tab"
                                class="node-order-tab"
                                :class="{ active: activeStatus === tab.value }"
                                :aria-selected="activeStatus === tab.value"
                                @click="changeStatus(tab.value)"
                            >
                                <img
                                    v-if="activeStatus === tab.value"
                                    src="@img/node-order-active-dot.svg"
                                    alt=""
                                    class="node-order-tab-dot"
                                />
                                <span>{{ $t(tab.label) }}</span>
                            </button>
                        </div>
                    </header>

                    <!-- 订单字段保持接口结构，所有字段标题与单位均由模板控制 -->
                    <div v-if="orders.length" class="node-order-list">
                        <article v-for="order in orders" :key="order.id" class="node-order-card">
                            <h2 class="node-order-card-title">{{ order.nodeName }}</h2>
                            <time class="node-order-card-time">{{ order.createdAt }}</time>

                            <button
                                v-if="order.status === 1 && order.canRedeem"
                                type="button"
                                class="node-order-redeem"
                                :disabled="redeemingOrderId === order.id"
                                @click="confirmRedeem(order)"
                            >
                                {{ redeemingOrderId === order.id ? $t('提交中') : $t('赎回') }}
                            </button>

                            <div class="node-order-metrics">
                                <div class="node-order-metric">
                                    <div class="node-order-metric-value">{{ order.totalDividend }}</div>
                                    <div class="node-order-metric-label">{{ $t('累计分红(USDT)') }}</div>
                                </div>
                                <div class="node-order-metric">
                                    <div class="node-order-metric-value node-order-metric-value-today">
                                        {{ order.todayDividend }}
                                    </div>
                                    <div class="node-order-metric-label">{{ $t('今日分红(USDT)') }}</div>
                                </div>
                                <div class="node-order-metric node-order-metric-cycle">
                                    <div class="node-order-metric-value">
                                        <template v-if="order.stakeDays > 0">
                                            {{ order.elapsedDays }}/{{ order.stakeDays }}{{ $t('天') }}
                                        </template>
                                        <template v-else>{{ $t('永久') }}</template>
                                    </div>
                                    <div class="node-order-metric-label">{{ $t('质押周期') }}</div>
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
import { Toast } from 'vant'

export default {
    name: 'NodeOrders',
    data() {
        return {
            mescroll: null,
            activeStatus: 1,
            statusTabs: [
                { value: 1, label: '进行中' },
                { value: 2, label: '已完成' },
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
            overview: {
                totalDividend: this.$t('无数据'),
                todayDividend: this.$t('无数据'),
            },
            orders: [],
            redeemingOrderId: null,
        }
    },
    mounted() {
        this.loadStatistics()
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
        async loadStatistics() {
            try {
                const res = await this.$http.get('/api/node_orders/statistics')
                if (res.code == 200 && res.data) {
                    this.overview = {
                        totalDividend: this.getDisplayValue(res.data.total_dividend),
                        todayDividend: this.getDisplayValue(res.data.today_dividend),
                    }
                }
            } catch (error) {
                console.log('节点分红统计加载失败', error)
            }
        },
        async upCallback(page, mescroll) {
            try {
                const res = await this.$http.get('/api/node_orders/orders', {
                    page_no: page.num,
                    page_size: Math.min(page.size || 10, 100),
                    status: this.activeStatus,
                })
                const source = res.code == 200 && res.data && Array.isArray(res.data.orders)
                    ? res.data.orders
                    : []
                const currentPageOrders = source.map(order => this.mapOrder(order))

                if (page.num === 1) this.orders = []
                this.orders = this.orders.concat(currentPageOrders)
                this.$nextTick(() => mescroll.endSuccess(source.length))
            } catch (error) {
                console.log('节点订单列表加载失败', error)
                mescroll.endErr()
            }
        },
        mapOrder(order) {
            const stakeDays = Number(order.stake_days) || 0
            return {
                id: order.id,
                nodeName: order.node_product && order.node_product.name
                    ? order.node_product.name
                    : this.$t('无数据'),
                createdAt: this.getDisplayValue(order.created_at),
                totalDividend: this.getDisplayValue(order.total_dividend),
                todayDividend: this.getDisplayValue(order.today_dividend),
                stakeDays,
                elapsedDays: this.calculateElapsedDays(order.created_at, order.redeemed_at, stakeDays),
                status: Number(order.status),
                canRedeem: Boolean(order.can_redeem),
            }
        },
        // 接口未单独返回已进行天数，按创建时间计算并限制在质押周期内，仅用于 UI 周期展示。
        calculateElapsedDays(createdAt, redeemedAt, stakeDays) {
            if (!createdAt || stakeDays <= 0) return 0
            const startTime = new Date(String(createdAt).replace(/-/g, '/')).getTime()
            const endTime = redeemedAt
                ? new Date(String(redeemedAt).replace(/-/g, '/')).getTime()
                : Date.now()
            if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return 0
            return Math.min(Math.floor((endTime - startTime) / 86400000), stakeDays)
        },
        getDisplayValue(value) {
            return value === undefined || value === null || value === '' ? this.$t('无数据') : value
        },
        confirmRedeem(order) {
            if (this.redeemingOrderId !== null) return
            this.$dialog.confirm({
                title: this.$t('确认赎回'),
                message: this.$t('确定要赎回该节点吗？'),
                confirmButtonText: this.$t('确认'),
                cancelButtonText: this.$t('取消'),
                showCancelButton: true,
            }).then(() => {
                this.redeemOrder(order)
            }).catch(() => {})
        },
        async redeemOrder(order) {
            if (this.redeemingOrderId !== null) return
            this.redeemingOrderId = order.id
            Toast.loading({
                message: this.$t('加载中'),
                forbidClick: true,
                loadingType: 'spinner',
                duration: 0,
            })
            try {
                const res = await this.$http.post('/api/node_orders/redeem', {
                    order_id: order.id,
                })
                if (res.code == 200) {
                    this.$messageTip.success(this.$t('赎回成功'))
                    this.loadStatistics()
                    this.mescroll && this.mescroll.resetUpScroll()
                }
            } catch (error) {
                console.log('节点赎回失败', error)
            } finally {
                this.redeemingOrderId = null
                Toast.clear()
            }
        },
    },
}
</script>

<style scoped lang="less">
.node-orders-page {
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

    .node-orders-back {
        width: 52px;
        height: 52px;
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.10);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    // 页面滚动区固定在顶部导航下方。
    .node-orders-scroll {
        position: fixed;
        z-index: 1;
        top: 88px;
        bottom: 0;
        left: 50%;
        width: 750px;
        height: auto;
        transform: translateX(-50%);
        background: #01050C;

        .node-orders-content {
            width: 750px;
            min-height: 100%;
            padding: 30px 30px 40px;
        }

        // 模块一：分红收益概览
        .node-order-overview {
            display: flex;
            width: 690px;
            height: 160px;
            gap: 16px;

            .node-order-overview-card {
                position: relative;
                height: 160px;
                overflow: hidden;
                border-radius: 32px;
                font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;

                .node-order-overview-label {
                    position: absolute;
                    top: 26px;
                    left: 30px;
                    max-width: calc(100% - 60px);
                    overflow: hidden;
                    font-size: 24px;
                    font-weight: 400;
                    line-height: 36px;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .node-order-overview-value {
                    position: absolute;
                    top: 72px;
                    left: 30px;
                    max-width: calc(100% - 60px);
                    overflow: hidden;
                    font-size: 36px;
                    font-weight: 500;
                    line-height: 54px;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            .node-order-overview-total {
                width: 385px;
                background: #1261F3;

                .node-order-overview-label {
                    color: rgba(255, 255, 255, 0.50);
                }

                .node-order-overview-token {
                    position: absolute;
                    top: 30px;
                    right: 30px;
                    width: 48px;
                    height: 48px;
                }
            }

            .node-order-overview-today {
                width: 289px;
                background: #04173A;

                .node-order-overview-label {
                    color: #2979FF;
                }

                .node-order-overview-value {
                    color: #4C91FF;
                }
            }
        }

        // 模块二：筛选标题与订单列表
        .node-order-list-section {
            width: 690px;
            margin-top: 40px;

            .node-order-list-heading {
                width: 690px;
                height: 45px;

                .node-order-list-title {
                    margin: 0;
                    font-size: 32px;
                    font-weight: 400;
                    line-height: 45px;
                }

                .node-order-tabs {
                    display: flex;
                    height: 45px;
                    align-items: center;
                    gap: 30px;

                    .node-order-tab {
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

                        .node-order-tab-dot {
                            width: 8px;
                            height: 8px;
                        }
                    }
                }
            }

            .node-order-list {
                display: flex;
                flex-direction: column;
                margin-top: 26px;
                gap: 20px;

                .node-order-card {
                    position: relative;
                    width: 690px;
                    height: 259px;
                    border: 2px solid rgba(255, 255, 255, 0.10);
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.10);

                    .node-order-card-title {
                        position: absolute;
                        top: 25px;
                        left: 29px;
                        max-width: 430px;
                        margin: 0;
                        overflow: hidden;
                        font-size: 28px;
                        font-weight: 600;
                        line-height: 40px;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .node-order-card-time {
                        position: absolute;
                        top: 75px;
                        left: 28px;
                        color: rgba(255, 255, 255, 0.50);
                        font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                        font-size: 24px;
                        font-style: normal;
                        line-height: 36px;
                        white-space: nowrap;
                    }

                    .node-order-redeem {
                        position: absolute;
                        top: 28px;
                        right: 28px;
                        width: 112px;
                        height: 60px;
                        border-radius: 999px;
                        background: #1261F3;
                        font-size: 26px;
                        font-weight: 600;
                        line-height: 36px;
                        text-align: center;
                    }

                    .node-order-metrics {
                        position: absolute;
                        top: 150px;
                        left: 28px;
                        display: grid;
                        width: 630px;
                        grid-template-columns: 220px 230px 180px;

                        .node-order-metric {
                            min-width: 0;

                            .node-order-metric-value {
                                overflow: hidden;
                                font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                                font-size: 24px;
                                line-height: 36px;
                                text-overflow: ellipsis;
                                white-space: nowrap;

                                &.node-order-metric-value-today {
                                    color: #B7FF2D;
                                }
                            }

                            .node-order-metric-label {
                                margin-top: 9px;
                                overflow: hidden;
                                color: rgba(255, 255, 255, 0.50);
                                font-size: 20px;
                                line-height: 28px;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                            }
                        }

                        .node-order-metric-cycle {
                            text-align: left;
                        }
                    }
                }
            }
        }
    }
}
</style>

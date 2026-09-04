<template>
    <div class="asset-records-page">
        <!-- 公共模块：固定顶部返回导航 -->
        <van-nav-bar
            :title="$t('资产记录')"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
        >
            <template #left>
                <span class="asset-records-back df-aic-jucen">
                    <van-icon name="arrow-left" size="14" color="#fff" />
                </span>
            </template>
        </van-nav-bar>

        <!-- 页面主体：三类记录共用一个 Mescroll 分页容器 -->
        <mescroll-vue
            ref="mescroll"
            class="asset-records-scroll"
            :up="mescrollUp"
            @init="mescrollInit"
        >
            <main class="asset-records-content">
                <!-- 模块一：资产流水、提现、划转类型切换 -->
                <nav class="asset-record-tabs" role="tablist">
                    <button
                        v-for="tab in recordTabs"
                        :key="tab.value"
                        type="button"
                        role="tab"
                        class="asset-record-tab"
                        :class="{ active: activeType === tab.value }"
                        :aria-selected="activeType === tab.value"
                        @click="changeType(tab.value)"
                    >
                        {{ $t(tab.label) }}
                    </button>
                </nav>

                <!-- 模块二：提现接口要求审核状态必传，因此提供独立状态筛选。 -->
                <div v-if="activeType === 'withdraw'" class="withdraw-status-tabs" role="tablist">
                    <button
                        v-for="status in withdrawStatuses"
                        :key="status.value"
                        type="button"
                        role="tab"
                        class="withdraw-status-tab"
                        :class="{ active: withdrawStatus === status.value }"
                        :aria-selected="withdrawStatus === status.value"
                        @click="changeWithdrawStatus(status.value)"
                    >
                        {{ $t(status.label) }}
                    </button>
                </div>

                <!-- 模块三：记录卡片。字段标题保留在模板，接口数据仅存原始业务字段。 -->
                <section class="asset-record-list-section">
                    <div v-if="records.length" class="asset-record-list">
                        <article v-for="record in records" :key="`${activeType}-${record.id}`" class="asset-record-card">
                            <!-- 资产流水卡片 -->
                            <template v-if="activeType === 'asset'">
                                <header class="asset-record-heading df-aic-jusb">
                                    <div class="asset-record-title df-aic">
                                        <div>
                                            <h2>{{ record.content }}</h2>
                                            <time>{{ record.createdAt }}</time>
                                        </div>
                                    </div>
                                    <div
                                        class="asset-record-amount"
                                        :class="record.isIncrease ? 'is-income' : 'is-expense'"
                                    >
                                        {{ record.isIncrease ? '+' : '−' }}{{ record.amount }} {{ record.symbol }}
                                    </div>
                                </header>
                            </template>

                            <!-- 提现记录卡片 -->
                            <template v-else-if="activeType === 'withdraw'">
                                <header class="asset-record-heading df-aic-jusb">
                                    <div class="asset-record-title">
                                        <h2>{{ $t('提现记录') }}</h2>
                                        <time>{{ record.createdAt }}</time>
                                    </div>
                                    <span class="asset-record-status" :class="statusClass(record.status)">
                                        {{ $t(withdrawStatusLabel(record.status)) }}
                                    </span>
                                </header>
                                <div class="asset-record-primary-value">−{{ record.amount }} {{ record.symbol }}</div>
                                <div class="asset-record-details">
                                    <div class="asset-record-detail df-aic-jusb">
                                        <span>{{ $t('手续费') }}</span>
                                        <span>{{ record.fee }} {{ record.symbol }}</span>
                                    </div>
                                    <div class="asset-record-detail df-aic-jusb">
                                        <span>{{ $t('到账地址') }}</span>
                                        <span class="asset-record-long-value">{{ record.address }}</span>
                                    </div>
                                </div>
                            </template>

                            <!-- 划转记录卡片 -->
                            <template v-else>
                                <header class="asset-record-heading df-aic-jusb">
                                    <div class="asset-record-title">
                                        <h2>{{ $t('划转记录') }}</h2>
                                        <time>{{ record.createdAt }}</time>
                                    </div>
                                    <span class="asset-record-status" :class="statusClass(record.status)">
                                        {{ $t(transferStatusLabel(record.status)) }}
                                    </span>
                                </header>
                                <div class="asset-record-primary-value">−{{ record.amount }} {{ record.symbol }}</div>
                                <div class="asset-record-details">
                                    <div class="asset-record-detail df-aic-jusb">
                                        <span>{{ $t('手续费') }}</span>
                                        <span>{{ record.fee }} {{ record.symbol }}</span>
                                    </div>
                                    <div class="asset-record-detail df-aic-jusb">
                                        <span>{{ $t('接收账号') }}</span>
                                        <span class="asset-record-long-value">{{ record.toAccount }}</span>
                                    </div>
                                    <div class="asset-record-detail df-aic-jusb">
                                        <span>{{ $t('转账单号') }}</span>
                                        <span class="asset-record-long-value">{{ record.transferNo }}</span>
                                    </div>
                                    <div v-if="record.failReason" class="asset-record-detail asset-record-failure df-aic-jusb">
                                        <span>{{ $t('失败原因') }}</span>
                                        <span class="asset-record-long-value">{{ record.failReason }}</span>
                                    </div>
                                </div>
                            </template>
                        </article>
                    </div>
                    <no-data v-else></no-data>
                </section>
            </main>
        </mescroll-vue>
    </div>
</template>

<script>
const RECORD_TYPES = ['asset', 'withdraw', 'transfer']

export default {
    name: 'AssetRecords',
    data() {
        const queryType = String(this.$route.query.type || '')
        return {
            mescroll: null,
            activeType: RECORD_TYPES.includes(queryType) ? queryType : 'asset',
            withdrawStatus: 1,
            recordTabs: [
                { value: 'asset', label: '资产流水' },
                { value: 'withdraw', label: '提现记录' },
                { value: 'transfer', label: '划转记录' },
            ],
            withdrawStatuses: [
                { value: 1, label: '待审核' },
                { value: 2, label: '已通过' },
                { value: 3, label: '已拒绝' },
            ],
            mescrollUp: {
                callback: this.upCallback,
                page: {
                    num: 0,
                    size: 20,
                },
                noMoreSize: 5,
                htmlNodata: '',
                empty: {
                    use: false,
                },
            },
            records: [],
        }
    },
    watch: {
        '$route.query.type'(value) {
            const nextType = RECORD_TYPES.includes(String(value)) ? String(value) : 'asset'
            if (nextType === this.activeType) return
            this.activeType = nextType
            this.resetRecords()
        },
    },
    methods: {
        mescrollInit(mescroll) {
            this.mescroll = mescroll
        },
        changeType(type) {
            if (type === this.activeType) return
            this.activeType = type
            this.$router.replace({
                query: {
                    ...this.$route.query,
                    type,
                },
            }).catch(() => {})
            this.resetRecords()
        },
        changeWithdrawStatus(status) {
            if (status === this.withdrawStatus) return
            this.withdrawStatus = status
            this.resetRecords()
        },
        resetRecords() {
            this.records = []
            this.mescroll && this.mescroll.resetUpScroll()
        },
        async upCallback(page, mescroll) {
            try {
                const pageParams = {
                    page_no: page.num,
                    page_size: Math.min(page.size || 20, 20),
                }
                let source = []

                if (this.activeType === 'withdraw') {
                    const res = await this.$http.get('/api/withdraws', {
                        ...pageParams,
                        apply_status: this.withdrawStatus,
                    })
                    source = res.code == 200 && res.data && Array.isArray(res.data.withdraws)
                        ? res.data.withdraws
                        : []
                } else if (this.activeType === 'transfer') {
                    const res = await this.$http.get('/api/cross_transfers', pageParams)
                    source = res.code == 200 && res.data && Array.isArray(res.data.cross_transfers)
                        ? res.data.cross_transfers
                        : []
                } else {
                    // 充值暂无独立记录接口，资产流水不传 ccy，规避文档注明的历史校验限制。
                    const res = await this.$http.get('/api/asset_logs', pageParams)
                    source = res.code == 200 && res.data && Array.isArray(res.data.asset_logs)
                        ? res.data.asset_logs
                        : []
                }

                const currentPageRecords = source.map(item => this.mapRecord(item))
                if (page.num === 1) this.records = []
                this.records = this.records.concat(currentPageRecords)
                this.$nextTick(() => mescroll.endSuccess(source.length))
            } catch (error) {
                console.log('资产记录加载失败', error)
                mescroll.endErr()
            }
        },
        mapRecord(item) {
            if (this.activeType === 'withdraw') {
                return {
                    id: item.id,
                    amount: item.amount,
                    fee: item.fee,
                    status: Number(item.apply_status),
                    createdAt: item.created_at,
                    symbol: this.currencySymbol(item.ccy),
                    address: item.address || this.$t('无数据'),
                }
            }
            if (this.activeType === 'transfer') {
                return {
                    id: item.id,
                    amount: item.amount,
                    fee: item.fee,
                    status: Number(item.status),
                    createdAt: item.created_at,
                    symbol: this.currencySymbol(item.ccy),
                    toAccount: item.to_account || this.$t('无数据'),
                    transferNo: item.transfer_no || this.$t('无数据'),
                    failReason: item.fail_reason || '',
                }
            }
            return {
                id: item.id,
                isIncrease: Number(item.is_inc) === 1,
                amount: item.amount,
                symbol: this.currencySymbol(item.ccy),
                content: item.content || this.$t('无数据'),
                createdAt: item.created_at,
            }
        },
        currencySymbol(ccy) {
            const symbolMap = {
                balance_usdt: 'USDT',
                balance_aix: 'AIX',
                balance_axe: 'AXE',
                balance_year_usdt: this.$t('年终奖USDT'),
                balance_year_aix: this.$t('年终奖AIX'),
            }
            return symbolMap[ccy] || ccy || this.$t('无数据')
        },
        withdrawStatusLabel(status) {
            return {
                1: '待审核',
                2: '已通过',
                3: '已拒绝',
            }[status] || '无数据'
        },
        transferStatusLabel(status) {
            return {
                1: '处理中',
                2: '成功',
                3: '失败',
            }[status] || '无数据'
        },
        statusClass(status) {
            return {
                1: 'is-pending',
                2: 'is-success',
                3: 'is-failed',
            }[status] || ''
        },
    },
}
</script>

<style scoped lang="less">
.asset-records-page {
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

    .asset-records-back {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.10);
    }

    .asset-records-scroll {
        position: fixed;
        z-index: 1;
        top: 88px;
        bottom: 0;
        left: 50%;
        width: 750px;
        height: auto;
        transform: translateX(-50%);
        background: #01050C;

        .asset-records-content {
            width: 750px;
            min-height: 100%;
            padding: 24px 30px 50px;
        }

        // 模块一：顶部类型切换，沿用项目蓝色选中胶囊样式。
        .asset-record-tabs {
            position: sticky;
            top: 0;
            z-index: 5;
            display: grid;
            width: 690px;
            height: 76px;
            padding: 6px;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.10);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);

            .asset-record-tab {
                border-radius: 999px;
                color: rgba(255, 255, 255, 0.60);
                font-size: 24px;
                font-weight: 500;
                white-space: nowrap;

                &.active {
                    background: #1261F3;
                    color: #FFFFFF;
                    font-weight: 600;
                    box-shadow: 0 8px 24px rgba(18, 97, 243, 0.28);
                }
            }
        }

        // 模块二：提现审核状态筛选。
        .withdraw-status-tabs {
            display: flex;
            width: 690px;
            margin-top: 24px;
            gap: 16px;
            overflow-x: auto;
            scrollbar-width: none;

            &::-webkit-scrollbar {
                display: none;
            }

            .withdraw-status-tab {
                min-width: 126px;
                height: 58px;
                padding: 0 24px;
                flex: none;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.10);
                color: rgba(255, 255, 255, 0.55);
                font-size: 22px;
                white-space: nowrap;

                &.active {
                    border: 1px solid rgba(76, 145, 255, 0.65);
                    background: rgba(18, 97, 243, 0.20);
                    color: #4C91FF;
                }
            }
        }

        // 模块三：三类记录共用的深色毛玻璃卡片。
        .asset-record-list-section {
            width: 690px;
            margin-top: 28px;

            .asset-record-list {
                display: flex;
                flex-direction: column;
                gap: 20px;

                .asset-record-card {
                    width: 690px;
                    padding: 30px;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 30px;
                    background: linear-gradient(145deg, rgba(34, 39, 48, 0.96), rgba(25, 29, 36, 0.96));
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

                    .asset-record-heading {
                        width: 630px;
                        gap: 18px;

                        .asset-record-title {
                            min-width: 0;
                            gap: 16px;

                            h2 {
                                max-width: 350px;
                                margin: 0;
                                overflow: hidden;
                                font-size: 28px;
                                font-weight: 500;
                                line-height: 40px;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                            }

                            time {
                                display: block;
                                margin-top: 6px;
                                color: rgba(255, 255, 255, 0.42);
                                font-size: 21px;
                                line-height: 30px;
                            }
                        }

                        .asset-record-amount {
                            flex: none;
                            font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                            font-size: 25px;
                            font-weight: 600;
                            white-space: nowrap;

                            &.is-income {
                                color: #30E05B;
                            }

                            &.is-expense {
                                color: #FF4146;
                            }
                        }

                        .asset-record-status {
                            min-width: 108px;
                            height: 48px;
                            padding: 7px 20px;
                            flex: none;
                            border-radius: 999px;
                            font-size: 22px;
                            line-height: 34px;
                            text-align: center;
                            white-space: nowrap;

                            &.is-pending {
                                background: rgba(255, 166, 0, 0.14);
                                color: #FFA600;
                            }

                            &.is-success {
                                background: rgba(48, 224, 91, 0.14);
                                color: #30E05B;
                            }

                            &.is-failed {
                                background: rgba(255, 65, 70, 0.14);
                                color: #FF4146;
                            }
                        }
                    }

                    .asset-record-primary-value {
                        margin-top: 30px;
                        font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                        font-size: 38px;
                        font-weight: 500;
                        line-height: 56px;
                    }

                    .asset-record-details {
                        margin-top: 24px;
                        padding-top: 22px;
                        border-top: 1px solid rgba(255, 255, 255, 0.10);

                        .asset-record-detail {
                            min-height: 42px;
                            color: rgba(255, 255, 255, 0.90);
                            font-size: 23px;
                            line-height: 34px;

                            & + .asset-record-detail {
                                margin-top: 14px;
                            }

                            > span:first-child {
                                flex: none;
                                color: rgba(255, 255, 255, 0.45);
                            }

                            .asset-record-long-value {
                                max-width: 450px;
                                margin-left: 24px;
                                overflow: hidden;
                                text-align: right;
                                text-overflow: ellipsis;
                                white-space: nowrap;
                            }

                            &.asset-record-failure {
                                color: #FF676B;
                            }
                        }
                    }

                }
            }
        }
    }
}
</style>

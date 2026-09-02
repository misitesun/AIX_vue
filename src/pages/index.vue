<template>
    <div class="page-index">
        <!-- 模块一：首屏背景与固定品牌导航 -->
        <section class="hero-section">
            <img src="@img/home-hero-bg.png" alt="" class="hero-section-bg" />
            <home-nav-bar
                @click-notice="$go(2, '/noticeList')"
            />

            <div class="hero-section-slogan">
                <div class="hero-section-title">
                    <div>{{ $t('掌握资产') }}</div>
                    <div>
                        <span>{{ $t('让收益') }}</span>
                        <span class="hero-section-highlight">{{ $t('持续增长') }}</span>
                    </div>
                </div>
                <div class="hero-section-subtitle">
                    {{ $t('金融时代的智慧作业系统｜即刻开启AI资产管理之旅') }}
                </div>
            </div>

            <div class="hero-section-line"></div>

            <!-- 资产总览 -->
            <div class="asset-overview">
                <div class="asset-overview-label">{{ $t('总资产折合价值') }}</div>
                <div class="asset-overview-value df-aic">
                    <img src="@img/home-asset-token.png" alt="USDT" class="asset-overview-token" />
                    <div class="asset-overview-number" v-if="showBalance">
                        <span>{{ splitDecimal(dashboard.totalAssetValue).integer }}</span>
                        <span class="asset-overview-decimal">{{ splitDecimal(dashboard.totalAssetValue).decimal }}</span>
                    </div>
                    <div class="asset-overview-number" v-else>****</div>
                </div>
                <button type="button" class="asset-overview-eye df-aic-jucen" @click="showBalance = !showBalance">
                    <img src="@img/home-eye.png" alt="" />
                </button>
            </div>

            <!-- 分红数据卡 -->
            <div class="asset-statistics df-aic-jusb">
                <div class="asset-statistics-item">
                    <div class="asset-statistics-label">{{ $t('打卡分红池') }}</div>
                    <div class="asset-statistics-value" v-if="showBalance">
                        <span>{{ splitDecimal(dashboard.dividendPool).integer }}</span>
                        <span class="asset-statistics-decimal">{{ splitDecimal(dashboard.dividendPool).decimal }}</span>
                    </div>
                    <div class="asset-statistics-value" v-else>****</div>
                </div>
                <div class="asset-statistics-item">
                    <div class="asset-statistics-label">{{ $t('打卡人数') }}</div>
                    <div class="asset-statistics-value">
                        <span>{{ splitDecimal(dashboard.checkinUsers).integer }}</span>
                        <span class="asset-statistics-decimal">{{ splitDecimal(dashboard.checkinUsers).decimal }}</span>
                    </div>
                </div>
                <div class="asset-statistics-item">
                    <div class="asset-statistics-label">{{ $t('T7-T9分红') }}</div>
                    <div class="asset-statistics-value" v-if="showBalance">
                        <span>{{ splitDecimal(dashboard.t7T9Dividend).integer }}</span>
                        <span class="asset-statistics-decimal">{{ splitDecimal(dashboard.t7T9Dividend).decimal }}</span>
                    </div>
                    <div class="asset-statistics-value" v-else>****</div>
                </div>
            </div>
        </section>

        <!-- 模块二：热门资管计划标题与分类 -->
        <section class="plan-heading">
            <div class="plan-heading-title df-aic">
                <img src="@img/home-plan-title.png" alt="" />
                <span>{{ $t('热门资管计划') }}</span>
            </div>
            <div class="plan-heading-tabs">
                <button
                    v-for="product in products"
                    :key="product.id"
                    type="button"
                    class="plan-heading-tab"
                    :class="{ active: activeProductId === product.id }"
                    @click="activeProductId = product.id"
                >
                    {{ product.name }}
                </button>
                <button v-if="!products.length" type="button" class="plan-heading-tab active" disabled>
                    {{ $t('无数据') }}
                </button>
            </div>
        </section>

        <!-- 模块三：资管计划参与卡片 -->
        <section class="plan-card">
            <img :src="plan.image || planFallbackImage" alt="" class="plan-card-cover" />

            <div class="plan-card-limit df-aic">
                <span class="plan-card-limit-count df-aic-jucen">{{ plan.participated }}/{{ plan.participationLimit }}</span>
                <span class="plan-card-limit-text">{{ $t('限购次数') }}：{{ plan.participationLimit }}</span>
            </div>

            <div class="plan-card-info df-aic-jusb">
                <div class="plan-card-name df-aic">
                    <img src="@img/home-plan-badge.png" alt="" />
                    <span>{{ plan.name }}</span>
                </div>
                <div class="plan-card-cycle">{{ $t('周期') }}·{{ plan.cycleDays }}{{ $t('天') }}</div>
            </div>

            <div class="plan-card-amount-label">{{ $t('参与金额') }}</div>
            <div class="plan-card-input df-aic-jusb">
                <input
                    v-model="amount"
                    type="text"
                    inputmode="decimal"
                    :placeholder="$t('请输入参与的金额')"
                    @input="normalizeAmount"
                />
                <img src="@img/usdt.png" alt="USDT" />
            </div>

            <div class="plan-card-range df-aic">
                <span class="plan-card-range-dot"></span>
                <span>{{ $t('限额') }}：</span>
                <span class="plan-card-range-highlight">{{ plan.minAmount }}</span>
                <span>USDT—</span>
                <span class="plan-card-range-highlight">{{ plan.maxAmount }}</span>
                <span>USDT</span>
            </div>

            <div class="plan-card-divider"></div>

            <div class="plan-card-yield">
                <div class="plan-card-yield-label">{{ $t('日收益') }}</div>
                <div class="plan-card-yield-value">{{ plan.dailyYield }}</div>
            </div>
            <button type="button" class="plan-card-submit common-btn" @click="prepareOrder">
                {{ $t('立即参与') }}
            </button>
        </section>

        <!-- 模块四：跨系统入口横幅 -->
        <section class="system-banner">
            <img src="@img/home-system-banner.png" alt="X-SmanrtPay" class="system-banner-bg" />
            <div class="system-banner-tag">{{ $t('双系统互联') }}</div>
            <div class="system-banner-title">X-SmanrtPay</div>
            <div class="system-banner-subtitle">{{ $t('链上价值·全球支付') }}</div>
            <button type="button" class="system-banner-button">{{ $t('进入系统') }}</button>
        </section>

        <!-- 模块五：全网实时交易 -->
        <section class="transaction-section">
            <div class="transaction-section-header df-aic-jusb">
                <div class="transaction-section-title df-aic">
                    <img src="@img/home-trade-title.png" alt="" />
                    <span>{{ $t('全网实时交易') }}</span>
                </div>
                <button
                    type="button"
                    class="transaction-section-more df-aic"
                    @click="$router.push('/transactions')"
                >
                    <span>{{ $t('查看全部') }}</span>
                    <img src="@img/home-more-arrow.png" alt="" />
                </button>
            </div>

            <div class="transaction-list">
                <button
                    type="button"
                    class="transaction-item"
                    v-for="item in transactions"
                    :key="item.id"
                    :aria-label="$t('交易详情')"
                    @click="$router.push('/transactions/' + item.id)"
                >
                    <div class="transaction-item-column transaction-item-hash">
                        <div class="transaction-item-label">{{ $t('哈希') }}</div>
                        <div class="transaction-item-main" :title="item.hash">
                            {{ item.hash }}
                        </div>
                        <div class="transaction-item-sub">{{ item.token }}</div>
                    </div>
                    <div class="transaction-item-column transaction-item-amount">
                        <div class="transaction-item-label">{{ $t('金额') }}</div>
                        <div class="transaction-item-main">{{ item.amount }}</div>
                        <div class="transaction-item-sub text-line-1">{{ item.route }}</div>
                    </div>
                    <div class="transaction-item-column transaction-item-profit">
                        <div class="transaction-item-label">{{ $t('收益/回报率') }}</div>
                        <div class="transaction-item-main">{{ item.profit }}</div>
                        <div class="transaction-item-rate">{{ item.rate }}</div>
                    </div>
                </button>
                <no-data v-if="!transactions.length"></no-data>
            </div>
        </section>

        <!-- 模块六：底部悬浮 TabBar -->
        <home-tab-bar active="index" @change="handleTabChange" />

        <!-- 模块七：首页弹窗。公告优先展示，避免与收益预警同时叠加。 -->
        <system-announcement-popup
            v-if="!showGoogleBindingRequired && showSystemAnnouncement"
            :title="announcement.title"
            :message="announcement.content"
            @close="closeSystemAnnouncement"
        />
        <revenue-warning-popup
            v-else-if="!showGoogleBindingRequired && showRevenueWarning"
            :member-name="warningInfo.memberName"
            :reduced-amount="warningInfo.reducedAmount"
            @close="showRevenueWarning = false"
        />

        <!-- 模块八：未绑定谷歌验证器时强制拦截首页，不提供任何关闭入口。 -->
        <div
            v-if="showGoogleBindingRequired"
            class="google-binding-required-overlay"
            role="dialog"
            aria-modal="true"
            @touchmove.prevent
        >
            <section class="google-binding-required-panel">
                <span class="google-binding-required-icon df-aic-jucen">
                    <van-icon name="shield-o" size="48" color="#4C91FF" />
                </span>
                <h2>{{ $t('谷歌验证器未绑定') }}</h2>
                <p>{{ $t('为了保障您的账户安全，请先绑定谷歌验证器后继续使用') }}</p>
                <button type="button" @click="goBindGoogleAuthenticator">
                    {{ $t('立即绑定') }}
                </button>
            </section>
        </div>

        <transaction-auth-popup
            v-if="!showGoogleBindingRequired && showOrderAuth"
            :title="$t('确认参与')"
            :google-required="googleOrderRequired"
            :loading="isSubmitting"
            @close="showOrderAuth = false"
            @confirm="submitOrder"
        />
    </div>
</template>

<script>
import HomeNavBar from '@/components/homeNavBar'
import HomeTabBar from '@/components/homeTabBar'
import RevenueWarningPopup from '@/components/revenueWarningPopup'
import SystemAnnouncementPopup from '@/components/systemAnnouncementPopup'
import TransactionAuthPopup from '@/components/transactionAuthPopup'
import planFallbackImage from '@img/home-plan-cover.png'

export default {
    name: 'Index',
    components: {
        HomeNavBar,
        HomeTabBar,
        RevenueWarningPopup,
        SystemAnnouncementPopup,
        TransactionAuthPopup,
    },
    data() {
        return {
            showBalance: true,
            showSystemAnnouncement: false,
            showRevenueWarning: false,
            showGoogleBindingRequired: false,
            previousBodyOverflow: '',
            showOrderAuth: false,
            isSubmitting: false,
            amount: '',
            planFallbackImage,
            products: [],
            activeProductId: null,
            orderConfig: {
                is_order: 0,
                google_2fa_order_switch: 0,
            },
            orderConfigLoaded: false,
            announcement: {
                id: null,
                title: '',
                content: '',
            },
            // 暂无收益预警接口，保留设计稿 UI 并明确显示无数据。
            warningInfo: {
                memberName: this.$t('无数据'),
                reducedAmount: this.$t('无数据'),
            },
            // 仅总资产有接口，其余字段保留原 UI 并显示无数据。
            dashboard: {
                totalAssetValue: this.$t('无数据'),
                dividendPool: this.$t('无数据'),
                checkinUsers: this.$t('无数据'),
                t7T9Dividend: this.$t('无数据'),
            },
            transactions: [],
        }
    },
    computed: {
        selectedProduct() {
            return this.products.find(item => item.id === this.activeProductId) || null
        },
        googleOrderRequired() {
            return Number(this.orderConfig.google_2fa_order_switch) === 1
        },
        plan() {
            const product = this.selectedProduct
            if (!product) {
                return {
                    id: null,
                    name: this.$t('无数据'),
                    image: '',
                    cycleDays: this.$t('无数据'),
                    participated: this.$t('无数据'),
                    participationLimit: this.$t('无数据'),
                    minAmount: this.$t('无数据'),
                    maxAmount: this.$t('无数据'),
                    dailyYield: this.$t('无数据'),
                }
            }
            const rate = product.min_rate || product.max_rate
                ? `${product.min_rate || this.$t('无数据')}-${product.max_rate || this.$t('无数据')}`
                : (product.income_rate || this.$t('无数据'))
            const purchaseCount = product.purchase_count === undefined || product.purchase_count === null
                ? this.$t('无数据')
                : product.purchase_count
            const purchaseLimit = product.purchase_limit === undefined || product.purchase_limit === null
                ? this.$t('无数据')
                : (Number(product.purchase_limit) === 0 ? this.$t('不限') : product.purchase_limit)
            return {
                ...product,
                cycleDays: this.$t('无数据'),
                participated: purchaseCount,
                participationLimit: purchaseLimit,
                minAmount: product.min_amount,
                maxAmount: Number(product.max_amount) === 0 ? this.$t('不限') : product.max_amount,
                dailyYield: rate,
            }
        },
    },
    watch: {
        showGoogleBindingRequired(value) {
            if (value) {
                this.previousBodyOverflow = document.body.style.overflow
                document.body.style.overflow = 'hidden'
                return
            }
            document.body.style.overflow = this.previousBodyOverflow
        },
    },
    mounted() {
        this.loadHomeData()
    },
    beforeDestroy() {
        document.body.style.overflow = this.previousBodyOverflow
    },
    methods: {
        normalizeAmount(event) {
            let value = String(event.target.value || '').replace(/[^\d.]/g, '')
            const decimalIndex = value.indexOf('.')
            if (decimalIndex !== -1) {
                value = value.slice(0, decimalIndex + 1) + value.slice(decimalIndex + 1).replace(/\./g, '')
            }
            this.amount = value
        },
        loadHomeData() {
            this.loadGoogleBindingStatus()
            this.loadBalance()
            this.loadProducts()
            this.loadOrderConfig()
            this.loadTransactions()
            this.loadPopNotice()
        },
        async loadGoogleBindingStatus() {
            try {
                const res = await this.$http.get('/api/users/my')
                if (res.code == 200 && res.data) {
                    const enabled = res.data.google_2fa_enabled
                    this.showGoogleBindingRequired = enabled === false
                        || enabled === 0
                        || enabled === '0'
                        || enabled === 'false'
                }
            } catch (error) {
                console.log('谷歌验证器绑定状态加载失败', error)
            }
        },
        goBindGoogleAuthenticator() {
            this.$router.push({
                name: 'googleAuthenticator',
                query: { forced: '1' },
            })
        },
        async loadBalance() {
            try {
                const res = await this.$http.get('/api/users/my/balance')
                if (res.code == 200 && res.data) {
                    this.dashboard.totalAssetValue = res.data.total_balance || this.$t('无数据')
                }
            } catch (error) {
                console.log('首页余额加载失败', error)
            }
        },
        async loadProducts() {
            try {
                const res = await this.$http.get('/api/products')
                if (res.code == 200) {
                    this.products = res.data && Array.isArray(res.data.products) ? res.data.products : []
                    this.activeProductId = this.products.length ? this.products[0].id : null
                }
            } catch (error) {
                console.log('首页产品加载失败', error)
            }
        },
        async loadOrderConfig() {
            try {
                const res = await this.$http.get('/api/orders/config')
                if (res.code == 200 && res.data) this.orderConfig = res.data
            } catch (error) {
                console.log('理财下单配置加载失败', error)
            } finally {
                this.orderConfigLoaded = true
            }
        },
        async loadTransactions() {
            try {
                const res = await this.$http.get('/api/block_logs', { page_no: 1, page_size: 4 })
                if (res.code == 200) {
                    const list = res.data && Array.isArray(res.data.block_logs) ? res.data.block_logs : []
                    this.transactions = list.map(this.mapTransaction)
                }
            } catch (error) {
                console.log('首页交易记录加载失败', error)
            }
        },
        mapTransaction(item) {
            return {
                id: item.id,
                hash: item.tx_hash || this.$t('无数据'),
                token: item.token || this.$t('无数据'),
                amount: item.amount_usd || this.$t('无数据'),
                route: this.platformRoute(item),
                profit: item.profit || this.$t('无数据'),
                rate: item.roi || this.$t('无数据'),
            }
        },
        // 首页与全网实时交易页保持一致，展示买入平台到卖出平台的路径。
        platformRoute(item) {
            const buyPlatform = String(item.buy_platform || '').trim()
            const sellPlatform = String(item.sell_platform || '').trim()
            if (buyPlatform && sellPlatform) return `${buyPlatform}>${sellPlatform}`
            return buyPlatform || sellPlatform || this.$t('无数据')
        },
        async loadPopNotice() {
            try {
                const res = await this.$http.get('/api/notices/pop')
                const notice = res.data && res.data.notice
                if (res.code == 200 && res.data.is_show && notice && !Array.isArray(notice)) {
                    this.announcement = notice
                    this.showSystemAnnouncement = true
                }
            } catch (error) {
                console.log('弹窗公告加载失败', error)
            }
        },
        async closeSystemAnnouncement() {
            const noticeId = this.announcement.id
            this.showSystemAnnouncement = false
            if (!noticeId) return
            try {
                await this.$http.get(`/api/notices/${noticeId}/read`)
            } catch (error) {
                console.log('公告标记已读失败', error)
            }
        },
        prepareOrder() {
            if (!this.orderConfigLoaded) {
                this.$toast(this.$t('配置加载中，请稍后'))
                return
            }
            if (!this.selectedProduct) {
                this.$toast(this.$t('暂无可参与产品'))
                return
            }
            if (Number(this.orderConfig.is_order) !== 1) {
                this.$toast(this.$t('暂未开放购买'))
                return
            }
            const amount = Number(this.amount)
            const minAmount = Number(this.selectedProduct.min_amount)
            const maxAmount = Number(this.selectedProduct.max_amount)
            if (!this.amount || !Number.isFinite(amount) || amount <= 0) {
                this.$toast(this.$t('请输入有效参与金额'))
                return
            }
            if (amount < minAmount || (maxAmount > 0 && amount > maxAmount)) {
                this.$toast(this.$t('参与金额不在限额范围内'))
                return
            }
            this.showOrderAuth = true
        },
        async submitOrder(auth) {
            if (this.isSubmitting) return
            this.isSubmitting = true
            try {
                const res = await this.$http.post('/api/orders', {
                    product_id: this.selectedProduct.id,
                    amount: this.amount,
                    ccy: 'balance_usdt',
                    pay_password: auth.pay_password,
                    google_code: auth.google_code,
                })
                if (res.code == 200) {
                    this.showOrderAuth = false
                    this.amount = ''
                    this.$messageTip.success(this.$t('参与成功'))
                    this.loadBalance()
                }
            } catch (error) {
                console.log('购买理财产品失败', error)
            } finally {
                this.isSubmitting = false
            }
        },
        handleTabChange(tab) {
            if (tab === 'node') {
                this.$go(2, '/node')
            } else if (tab === 'assets') {
                this.$go(2, '/assets')
            } else if (tab === 'mine') {
                this.$go(2, '/mine')
            }
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
.page-index {
    position: relative;
    width: 750px;
    height: 3369px;
    min-height: 100vh;
    margin: 0 auto;
    overflow: hidden;
    background: #05070C;
    color: #FFFFFF;

    button {
        margin: 0;
        padding: 0;
        border: 0;
        outline: 0;
        font: inherit;
        color: inherit;
    }

    // 模块一：首屏背景与资产概览
    .hero-section {
        position: absolute;
        top: 0;
        left: 0;
        width: 750px;
        height: 1000px;

        .hero-section-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 750px;
            height: 1000px;
            object-fit: cover;
        }

        .hero-section-slogan {
            position: absolute;
            top: 204px;
            left: 30px;
            width: 550px;

            .hero-section-title {
                font-size: 56px;
                line-height: 1.4;
                font-weight: 400;
                white-space: nowrap;

                .hero-section-highlight {
                    color: #4C91FF;
                }
            }

            .hero-section-subtitle {
                margin-top: 20px;
                color: #B8C3D4;
                font-size: 24px;
                line-height: 34px;
                white-space: nowrap;
            }
        }

        .hero-section-line {
            position: absolute;
            top: 474px;
            left: 30px;
            width: 690px;
            height: 2px;
            border-radius: 999px;
            background: linear-gradient(90deg, #3DA2FF 0%, rgba(61, 162, 255, 0) 69.71%);
        }

        .asset-overview {
            position: absolute;
            top: 536px;
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

        .asset-statistics {
            position: absolute;
            top: 714px;
            left: 18px;
            width: 714px;
            height: 140px;
            padding: 25px 30px;
            border: 2px solid rgba(255, 255, 255, 0.20);
            border-radius: 32px;
            background: rgba(255, 255, 255, 0.10);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);

            .asset-statistics-item {
                width: 214px;
                text-align: center;

                .asset-statistics-label {
                    color: rgba(255, 255, 255, 0.50);
                    font-size: 24px;
                    line-height: 34px;
                }

                .asset-statistics-value {
                    margin-top: 10px;
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 30px;
                    font-weight: 500;
                    line-height: 45px;

                    .asset-statistics-decimal {
                        font-size: 24px;
                    }
                }
            }
        }
    }

    // 模块二：热门资管计划标题与分类
    .plan-heading {
        position: absolute;
        top: 914px;
        left: 0;
        width: 750px;
        height: 145px;

        .plan-heading-title {
            position: absolute;
            top: 0;
            left: 30px;
            height: 56px;
            gap: 10px;
            font-size: 40px;
            font-weight: 500;
            line-height: 56px;

            img {
                width: 56px;
                height: 56px;
            }
        }

        .plan-heading-tabs {
            position: absolute;
            top: 86px;
            left: 30px;
            display: flex;
            width: 720px;
            gap: 12px;
            overflow-x: auto;
            overflow-y: hidden;
            overscroll-behavior-x: contain;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            touch-action: pan-x;
            white-space: nowrap;

            &::-webkit-scrollbar {
                display: none;
            }

            .plan-heading-tab {
                flex: none;
                height: 59px;
                padding: 10px 20px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.20);
                color: #FFFFFF;
                font-size: 28px;
                line-height: 39px;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);

                &.active {
                    background: #1261F3;
                    font-weight: 500;
                }
            }
        }
    }

    // 模块三：计划参与卡片
    .plan-card {
        position: absolute;
        top: 1089px;
        left: 30px;
        width: 690px;
        height: 934px;
        border-radius: 40px;
        background: rgba(255, 255, 255, 0.10);

        .plan-card-cover {
            position: absolute;
            top: 10px;
            left: 10px;
            width: 670px;
            height: 420px;
            border-radius: 40px;
            object-fit: cover;
        }

        .plan-card-limit {
            position: absolute;
            top: 30px;
            right: 30px;
            min-width: 218px;
            height: 64px;
            padding-right: 16px;
            border-radius: 999px;
            background: rgba(255, 81, 0, 0.20);
            color: #FF5100;
            font-size: 24px;
            font-weight: 600;
            line-height: 28px;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);

            .plan-card-limit-count {
                min-width: 56px;
                height: 56px;
                margin-left: 4px;
                padding: 0 10px;
                flex: none;
                border-radius: 999px;
                background: #FF5100;
                color: #FFFFFF;
                white-space: nowrap;
            }

            .plan-card-limit-text {
                margin-left: 8px;
                white-space: nowrap;
            }
        }

        .plan-card-info {
            position: absolute;
            top: 460px;
            left: 30px;
            width: 630px;
            height: 56px;

            .plan-card-name {
                gap: 8px;
                font-size: 32px;
                font-weight: 600;
                line-height: 48px;

                img {
                    width: 48px;
                    height: 48px;
                }
            }

            .plan-card-cycle {
                min-width: 148px;
                height: 56px;
                padding: 10px 24px;
                border: 1px solid rgba(255, 255, 255, 0.40);
                border-radius: 999px;
                font-size: 24px;
                line-height: 34px;
                text-align: center;
                white-space: nowrap;
            }
        }

        .plan-card-amount-label {
            position: absolute;
            top: 546px;
            left: 30px;
            font-size: 26px;
            line-height: 36px;
        }

        .plan-card-input {
            position: absolute;
            top: 602px;
            left: 30px;
            width: 630px;
            height: 90px;
            padding: 0 20px 0 30px;
            border: 1px solid rgba(255, 255, 255, 0.20);
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.04);

            input {
                min-width: 0;
                font-size: 28px;
                line-height: 39px;
            }

            img {
                flex: none;
                width: 50px;
                height: 50px;
            }
        }

        .plan-card-range {
            position: absolute;
            top: 716px;
            left: 30px;
            height: 28px;
            font-family: "Roboto", "Helvetica Neue", sans-serif;
            font-size: 24px;
            line-height: 28px;
            white-space: nowrap;

            .plan-card-range-dot {
                width: 8px;
                height: 8px;
                margin-right: 10px;
                border-radius: 50%;
                background: #2979FF;
            }

            .plan-card-range-highlight {
                color: #2979FF;
            }
        }

        .plan-card-divider {
            position: absolute;
            top: 784px;
            left: 30px;
            width: 630px;
            height: 1px;
            background: rgba(255, 255, 255, 0.10);
        }

        .plan-card-yield {
            position: absolute;
            top: 815px;
            left: 30px;
            width: 208px;

            .plan-card-yield-label {
                color: rgba(255, 255, 255, 0.50);
                font-size: 24px;
                line-height: 34px;
            }

            .plan-card-yield-value {
                margin-top: 10px;
                color: #2979FF;
                font-size: 32px;
                line-height: 45px;
                white-space: nowrap;
            }
        }

        .plan-card-submit {
            position: absolute;
            top: 817px;
            right: 30px;
            width: 208px;
            height: 85px;
            box-shadow: none;
            font-size: 32px;
            font-weight: 600;
            line-height: 45px;
        }
    }

    // 模块四：跨系统入口横幅
    .system-banner {
        position: absolute;
        top: 2063px;
        left: 30px;
        width: 690px;
        height: 280px;

        .system-banner-bg {
            position: absolute;
            inset: 0;
            width: 690px;
            height: 280px;
            border-radius: 32px;
        }

        .system-banner-tag {
            position: absolute;
            top: 30px;
            left: 21px;
            height: 38px;
            padding: 4px 20px;
            border: 1px solid #4C91FF;
            border-radius: 999px;
            color: #4C91FF;
            font-size: 20px;
            line-height: 28px;
        }

        .system-banner-title {
            position: absolute;
            top: 80px;
            left: 21px;
            width: 258px;
            background: linear-gradient(90deg, #CAE3FF 0%, #4C91FF 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
            font-size: 40px;
            font-weight: 600;
            line-height: 56px;
            white-space: nowrap;
        }

        .system-banner-subtitle {
            position: absolute;
            top: 136px;
            left: 21px;
            width: 258px;
            color: #B8C3D4;
            font-size: 24px;
            line-height: 34px;
            white-space: nowrap;
        }

        .system-banner-button {
            position: absolute;
            top: 198px;
            left: 21px;
            width: 149px;
            height: 50px;
            border-radius: 999px;
            background: #1261F3;
            font-size: 24px;
            font-weight: 600;
            line-height: 34px;
        }
    }

    // 模块五：实时交易标题与卡片列表
    .transaction-section {
        position: absolute;
        top: 2383px;
        left: 30px;
        width: 690px;
        height: 818px;

        .transaction-section-header {
            width: 690px;
            height: 56px;

            .transaction-section-title {
                gap: 10px;
                font-size: 32px;
                font-weight: 500;
                line-height: 45px;

                img {
                    width: 56px;
                    height: 56px;
                }
            }

            .transaction-section-more {
                gap: 8px;
                background: transparent;
                color: rgba(255, 255, 255, 0.50);
                font-size: 24px;
                line-height: 34px;

                img {
                    width: 24px;
                    height: 24px;
                }
            }
        }

        .transaction-list {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-top: 30px;

                .transaction-item {
                display: flex;
                width: 690px;
                height: 168px;
                padding: 30px 30px 0 30px;
                gap: 49px;
                    border-radius: 32px;
                    background: rgba(255, 255, 255, 0.10);
                    text-align: left;

                .transaction-item-column {
                    display: flex;
                    min-width: 0;
                    flex-direction: column;
                    gap: 12px;
                    line-height: normal;

                    &.transaction-item-hash {
                        width: 180px;
                    }

                    &.transaction-item-amount,
                    &.transaction-item-profit {
                        width: 176px;
                    }

                    &.transaction-item-profit {
                        align-items: flex-end;
                        text-align: right;
                    }

                    .transaction-item-label {
                        width: 100%;
                        color: rgba(255, 255, 255, 0.50);
                        font-size: 20px;
                        line-height: 28px;
                    }

                    .transaction-item-main {
                        width: 100%;
                        overflow: hidden;
                        font-size: 24px;
                        font-weight: 500;
                        line-height: 34px;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .transaction-item-sub,
                    .transaction-item-rate {
                        width: 100%;
                        color: rgba(255, 255, 255, 0.50);
                        font-size: 22px;
                        line-height: 31px;
                    }

                    .transaction-item-rate {
                        color: #4C91FF;
                    }
                }
            }
        }
    }

    // 模块八：谷歌验证器强制绑定弹窗。仅保留绑定入口，不响应遮罩或返回关闭。
    .google-binding-required-overlay {
        position: fixed;
        top: 0;
        left: 50%;
        z-index: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 750px;
        height: 100vh;
        padding: 30px;
        transform: translateX(-50%);
        background: rgba(0, 3, 12, 0.82);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);

        .google-binding-required-panel {
            width: 630px;
            padding: 64px 50px 50px;
            border: 2px solid #1B6CFF;
            border-radius: 36px;
            background: linear-gradient(180deg, rgba(7, 27, 67, 0.98) 0%, rgba(1, 10, 31, 0.98) 100%);
            box-shadow: 0 22px 70px rgba(0, 74, 255, 0.28);
            text-align: center;

            .google-binding-required-icon {
                width: 112px;
                height: 112px;
                margin: 0 auto 34px;
                border: 2px solid rgba(76, 145, 255, 0.72);
                border-radius: 50%;
                background: radial-gradient(circle, rgba(36, 116, 255, 0.28) 0%, rgba(3, 18, 49, 0.92) 72%);
                box-shadow: 0 0 32px rgba(46, 132, 255, 0.42);
            }

            h2 {
                margin: 0;
                color: #FFFFFF;
                font-size: 38px;
                font-weight: 600;
                line-height: 54px;
            }

            p {
                margin: 28px 0 46px;
                color: #AAB7CD;
                font-size: 26px;
                line-height: 42px;
            }

            button {
                width: 530px;
                height: 88px;
                border-radius: 999px;
                background: linear-gradient(90deg, #1261F3 0%, #287BFF 100%);
                box-shadow: 0 12px 28px rgba(18, 97, 243, 0.28);
                color: #FFFFFF;
                font-size: 30px;
                font-weight: 600;
                line-height: 42px;

                &:active {
                    transform: scale(0.98);
                }
            }
        }
    }

}
</style>

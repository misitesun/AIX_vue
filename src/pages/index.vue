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
                        <span
                            class="hero-section-highlight"
                            :class="{ 'hero-section-highlight-spaced': ['en', 'ko'].includes($i18n.locale) }"
                        >{{ $t('持续增长') }}</span>
                    </div>
                </div>
                <div class="hero-section-subtitle">
                    {{ $t('金融时代的智慧作业系统｜即刻开启AI资产管理之旅') }}
                </div>
            </div>

            <div class="hero-section-line"></div>

            <!-- 资产总览 -->
            <div class="asset-overview">
                <div class="asset-overview-heading df-aic-jusb">
                    <div class="asset-overview-label">{{ $t('总资产折合价值') }}</div>
                    <button
                        type="button"
                        class="asset-overview-eye df-aic-jucen"
                        :aria-label="$t('显示或隐藏资产')"
                        :aria-pressed="String(showBalance)"
                        @click="toggleAssetVisibility"
                    >
                        <img :src="showBalance ? assetVisibilityEyeVisible : assetVisibilityEyeHidden" alt="" />
                    </button>
                </div>
                <div class="asset-overview-value df-aic">
                    <img src="@img/home-asset-token.png" alt="USDT" class="asset-overview-token" />
                    <div class="asset-overview-number" v-if="showBalance">
                        <span>{{ splitDecimal(dashboard.totalAssetValue).integer }}</span>
                        <span class="asset-overview-decimal">{{ splitDecimal(dashboard.totalAssetValue).decimal }}</span>
                    </div>
                    <div class="asset-overview-number" v-else>****</div>
                </div>
            </div>

            <!-- 分红数据卡 -->
            <div class="asset-statistics df-aic-jusb">
                <div class="asset-statistics-item">
                    <div class="asset-statistics-label">{{ $t('打卡分红池') }}</div>
                    <div class="asset-statistics-value">
                        <span>{{ splitDecimal(dashboard.dividendPool).integer }}</span>
                        <span class="asset-statistics-decimal">{{ splitDecimal(dashboard.dividendPool).decimal }}</span>
                    </div>
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
                    <div class="asset-statistics-value">
                        <span>{{ splitDecimal(dashboard.t7T9Dividend).integer }}</span>
                        <span class="asset-statistics-decimal">{{ splitDecimal(dashboard.t7T9Dividend).decimal }}</span>
                    </div>
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
            <div class="plan-card-media">
                <img
                    :src="plan.image || planFallbackImage"
                    alt=""
                    class="plan-card-cover"
                    @error="usePlanFallbackImage"
                />

                <div class="plan-card-limit df-aic">
                    <span class="plan-card-limit-count df-aic-jucen">{{ plan.participated }}/{{ plan.participationLimit }}</span>
                    <span class="plan-card-limit-text">{{ $t('限购次数') }}：{{ plan.participationLimit }}</span>
                </div>
            </div>

            <div class="plan-card-body">
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

                <div class="plan-card-footer df-aic-jusb">
                    <div class="plan-card-yield">
                        <div class="plan-card-yield-label">{{ $t('日收益') }}</div>
                        <div class="plan-card-yield-value">{{ plan.dailyYield }}</div>
                    </div>
                    <button type="button" class="plan-card-submit common-btn" @click="prepareOrder">
                        {{ $t('立即参与') }}
                    </button>
                </div>
            </div>
        </section>

        <!-- 模块四：跨系统入口横幅 -->
        <section class="system-banner" @click="goToXSmartPay">
            <img src="@img/home-system-banner.png" alt="X-SmanrtPay" class="system-banner-bg" />
            <div class="system-banner-content">
                <div class="system-banner-tag">{{ $t('双系统互联') }}</div>
                <div class="system-banner-title">X-SmanrtPay</div>
                <div class="system-banner-subtitle">{{ $t('链上价值·全球支付') }}</div>
                <button type="button" class="system-banner-button">{{ $t('进入系统') }}</button>
            </div>
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

            <div class="transaction-list" :style="transactionCarouselViewportStyle">
                <div
                    ref="transactionCarouselTrack"
                    class="transaction-list-track"
                    :class="{ 'is-animated': hasTransactionCarousel && transactionCarouselTransitionEnabled }"
                    :style="transactionCarouselTrackStyle"
                    @transitionend="handleTransactionCarouselTransitionEnd"
                >
                    <button
                        v-for="(item, index) in carouselTransactions"
                        :key="`${item.id}-${index}`"
                        ref="transactionCarouselItems"
                        ref-in-for
                        type="button"
                        class="transaction-item"
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
                </div>
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
            @close="closeRevenueWarning"
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
import assetVisibilityEyeVisible from '@img/register-eye-visible.svg'
import assetVisibilityEyeHidden from '@img/register-eye-hidden.svg'
import { getAssetVisibility, setAssetVisibility } from '@/utils/assetVisibility'

const TRANSACTION_PAGE_SIZE = 100
const TRANSACTION_VISIBLE_COUNT = 4
const TRANSACTION_CAROUSEL_INTERVAL = 3000
const TRANSACTION_REFRESH_INTERVAL = 20 * 1000

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
            showBalance: getAssetVisibility(),
            assetVisibilityEyeVisible,
            assetVisibilityEyeHidden,
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
            // 个人收益预警由 /api/alerts/pop 返回，关闭后标记当前预警已读。
            warningInfo: {
                id: null,
                memberName: this.$t('无数据'),
                reducedAmount: this.$t('无数据'),
            },
            isRevenueWarningReading: false,
            // 首页总资产与公开统计分别由余额、公开统计接口提供。
            dashboard: {
                totalAssetValue: this.$t('无数据'),
                dividendPool: this.$t('无数据'),
                checkinUsers: this.$t('无数据'),
                t7T9Dividend: this.$t('无数据'),
            },
            transactions: [],
            isLoadingTransactions: false,
            transactionCarouselIndex: 0,
            transactionCarouselStep: 0,
            transactionCarouselViewportHeight: 0,
            transactionCarouselTransitionEnabled: true,
            transactionCarouselTimer: null,
            transactionRefreshTimer: null,
            transactionCarouselFrame: null,
        }
    },
    computed: {
        selectedProduct() {
            return this.products.find(item => item.id === this.activeProductId) || null
        },
        googleOrderRequired() {
            return Number(this.orderConfig.google_2fa_order_switch) === 1
        },
        // 末尾补足首屏数据，滚动到补位项后无感回到第一条，实现连续向上轮播。
        carouselTransactions() {
            if (this.transactions.length <= TRANSACTION_VISIBLE_COUNT) return this.transactions
            return this.transactions.concat(this.transactions.slice(0, TRANSACTION_VISIBLE_COUNT))
        },
        hasTransactionCarousel() {
            return this.transactions.length > TRANSACTION_VISIBLE_COUNT && this.transactionCarouselStep > 0
        },
        transactionCarouselTrackStyle() {
            return {
                transform: `translate3d(0, -${this.transactionCarouselIndex * this.transactionCarouselStep}px, 0)`,
            }
        },
        transactionCarouselViewportStyle() {
            if (!this.transactionCarouselViewportHeight) return {}
            return { height: `${this.transactionCarouselViewportHeight}px` }
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
            const outputCount = product.output_count === undefined || product.output_count === null || product.output_count === ''
                ? this.$t('无数据')
                : product.output_count
            const purchaseLimit = product.purchase_limit === undefined || product.purchase_limit === null
                ? this.$t('无数据')
                : (Number(product.purchase_limit) === 0 ? this.$t('不限') : product.purchase_limit)
            return {
                ...product,
                cycleDays: outputCount,
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
        this.startTransactionTimers()
        window.addEventListener('resize', this.syncTransactionCarouselLayout)
    },
    beforeDestroy() {
        document.body.style.overflow = this.previousBodyOverflow
        this.stopTransactionTimers()
        window.removeEventListener('resize', this.syncTransactionCarouselLayout)
    },
    methods: {
        goToXSmartPay() {
            if (window.__FROM_FLUTTER__) {
                if (typeof window.sendMessageToFlutter === 'function') {
                    window.sendMessageToFlutter(JSON.stringify({
                        type: 'openXSmartPay',
                    }))
                }
                return
            }

            window.open(process.env.VUE_APP_XSmartPay_url, '_blank')
        },

        normalizeAmount(event) {
            let value = String(event.target.value || '').replace(/[^\d.]/g, '')
            const decimalIndex = value.indexOf('.')
            if (decimalIndex !== -1) {
                value = value.slice(0, decimalIndex + 1) + value.slice(decimalIndex + 1).replace(/\./g, '')
            }
            this.amount = value
        },
        toggleAssetVisibility() {
            this.showBalance = setAssetVisibility(!this.showBalance)
        },
        usePlanFallbackImage(event) {
            const image = event.currentTarget
            if (!image || image.dataset.fallbackApplied === '1') return
            image.dataset.fallbackApplied = '1'
            image.src = this.planFallbackImage
        },
        loadHomeData() {
            this.loadGoogleBindingStatus()
            this.loadBalance()
            this.loadHomeStatistics()
            this.loadProducts()
            this.loadOrderConfig()
            this.loadTransactions()
            this.loadPopNotice()
            this.loadRevenueWarning()
        },
        async loadGoogleBindingStatus() {
            try {
                const res = await this.$http.get('/api/users/my')
                if (res.code == 200 && res.data) {
                    const hasEmail = Boolean(String(res.data.email || '').trim())
                    const enabled = res.data.google_2fa_enabled
                    const isGoogleBound = enabled === true
                        || enabled === 1
                        || enabled === '1'
                        || enabled === 'true'
                    this.showGoogleBindingRequired = hasEmail && !isGoogleBound
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
        // 公开统计无需登录，统计打卡分红池、今日打卡人数及 T7-T9 分红。
        async loadHomeStatistics() {
            try {
                const res = await this.$http.get('/api/config/statistics')
                if (res.code == 200 && res.data) {
                    this.dashboard.dividendPool = this.getDisplayValue(res.data.checkin_pool)
                    this.dashboard.checkinUsers = this.getDisplayValue(res.data.checkin_count)
                    this.dashboard.t7T9Dividend = this.getDisplayValue(res.data.t7_t9_dividend)
                }
            } catch (error) {
                console.log('首页公开统计加载失败', error)
            }
        },
        getDisplayValue(value) {
            return value === undefined || value === null || value === ''
                ? this.$t('无数据')
                : value
        },
        formatWarningAmount(value) {
            return value === undefined || value === null || value === ''
                ? this.$t('无数据')
                : `${value}U`
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
        startTransactionTimers() {
            this.stopTransactionTimers()
            this.transactionCarouselTimer = window.setInterval(() => {
                this.advanceTransactionCarousel()
            }, TRANSACTION_CAROUSEL_INTERVAL)
            this.transactionRefreshTimer = window.setInterval(() => {
                this.loadTransactions()
            }, TRANSACTION_REFRESH_INTERVAL)
        },
        stopTransactionTimers() {
            if (this.transactionCarouselTimer !== null) {
                window.clearInterval(this.transactionCarouselTimer)
                this.transactionCarouselTimer = null
            }
            if (this.transactionRefreshTimer !== null) {
                window.clearInterval(this.transactionRefreshTimer)
                this.transactionRefreshTimer = null
            }
            if (this.transactionCarouselFrame !== null) {
                window.cancelAnimationFrame(this.transactionCarouselFrame)
                this.transactionCarouselFrame = null
            }
        },
        async loadTransactions() {
            if (this.isLoadingTransactions) return
            this.isLoadingTransactions = true
            try {
                const res = await this.$http.get('/api/block_logs', {
                    page_no: 1,
                    page_size: TRANSACTION_PAGE_SIZE,
                })
                if (res.code == 200) {
                    const list = res.data && Array.isArray(res.data.block_logs) ? res.data.block_logs : []
                    this.transactions = list.map(this.mapTransaction)
                    this.resetTransactionCarousel()
                }
            } catch (error) {
                console.log('首页交易记录加载失败', error)
            } finally {
                this.isLoadingTransactions = false
            }
        },
        resetTransactionCarousel() {
            this.transactionCarouselTransitionEnabled = false
            this.transactionCarouselIndex = 0
            this.transactionCarouselStep = 0
            this.transactionCarouselViewportHeight = 0
            this.$nextTick(() => {
                this.syncTransactionCarouselLayout()
                this.enableTransactionCarouselTransition()
            })
        },
        syncTransactionCarouselLayout() {
            const items = this.$refs.transactionCarouselItems
            const firstItem = Array.isArray(items) ? items[0] : items
            const track = this.$refs.transactionCarouselTrack
            if (!firstItem || !track) {
                this.transactionCarouselStep = 0
                this.transactionCarouselViewportHeight = 0
                return
            }

            const itemHeight = firstItem.getBoundingClientRect().height
            const trackStyle = window.getComputedStyle(track)
            const rowGap = Number.parseFloat(trackStyle.rowGap) || Number.parseFloat(trackStyle.gap) || 0
            const visibleCount = Math.min(this.transactions.length, TRANSACTION_VISIBLE_COUNT)
            this.transactionCarouselStep = itemHeight + rowGap
            this.transactionCarouselViewportHeight = visibleCount
                ? itemHeight * visibleCount + rowGap * (visibleCount - 1)
                : 0
        },
        enableTransactionCarouselTransition() {
            if (this.transactionCarouselFrame !== null) {
                window.cancelAnimationFrame(this.transactionCarouselFrame)
            }
            this.transactionCarouselFrame = window.requestAnimationFrame(() => {
                this.transactionCarouselFrame = null
                this.transactionCarouselTransitionEnabled = true
            })
        },
        advanceTransactionCarousel() {
            if (!this.hasTransactionCarousel) return
            this.transactionCarouselTransitionEnabled = true
            this.transactionCarouselIndex += 1
        },
        handleTransactionCarouselTransitionEnd(event) {
            if (event.target !== this.$refs.transactionCarouselTrack || event.propertyName !== 'transform') return
            if (this.transactionCarouselIndex !== this.transactions.length) return

            this.transactionCarouselTransitionEnabled = false
            this.transactionCarouselIndex = 0
            this.$nextTick(() => this.enableTransactionCarouselTransition())
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
        // 预警接口只返回最早的一条未读记录；公告关闭后，模板会按优先级自动展示预警。
        async loadRevenueWarning() {
            try {
                const res = await this.$http.get('/api/alerts/pop')
                const payload = res && res.data ? res.data : {}
                const alert = payload.alert
                if (res.code != 200 || !payload.is_show || !alert || Array.isArray(alert)) {
                    this.showRevenueWarning = false
                    return
                }

                const fromUser = alert.from_user || {}
                this.warningInfo = {
                    id: alert.id || null,
                    memberName: this.getDisplayValue(
                        fromUser.display_name || fromUser.remark || fromUser.maddress,
                    ),
                    reducedAmount: this.formatWarningAmount(alert.daily_loss),
                }
                this.showRevenueWarning = Boolean(this.warningInfo.id)
            } catch (error) {
                this.showRevenueWarning = false
                console.log('首页收益预警加载失败', error)
            }
        },
        async closeRevenueWarning() {
            const alertId = this.warningInfo.id
            this.showRevenueWarning = false
            if (!alertId || this.isRevenueWarningReading) return

            this.isRevenueWarningReading = true
            try {
                await this.$http.get(`/api/alerts/${alertId}/read`)
            } catch (error) {
                console.log('首页收益预警标记已读失败', error)
            } finally {
                this.isRevenueWarningReading = false
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
            const parts = String(value === undefined || value === null ? '' : value).split('.')
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
    display: flex;
    flex-direction: column;
    width: 750px;
    min-height: 100vh;
    margin: 0 auto;
    padding-bottom: 168px;
    overflow-x: hidden;
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
        position: relative;
        display: flex;
        flex: 0 0 auto;
        flex-direction: column;
        width: 100%;
        padding-top: 204px;

        .hero-section-bg {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 0;
            width: 100%;
            height: 1000px;
            object-fit: cover;
            pointer-events: none;
        }

        .hero-section-slogan {
            position: relative;
            z-index: 1;
            width: 550px;
            margin-left: 30px;

            .hero-section-title {
                font-size: 56px;
                line-height: 1.4;
                font-weight: 400;

                .hero-section-highlight {
                    display: inline-block;
                    color: #4C91FF;

                    &.hero-section-highlight-spaced {
                        margin-left: 0.18em;
                    }
                }
            }

            .hero-section-subtitle {
                margin-top: 20px;
                color: #B8C3D4;
                font-size: 24px;
                line-height: 34px;
                overflow-wrap: anywhere;
            }
        }

        .hero-section-line {
            position: relative;
            z-index: 1;
            width: 690px;
            height: 2px;
            margin: 59px 0 0 30px;
            border-radius: 999px;
            background: linear-gradient(90deg, #3DA2FF 0%, rgba(61, 162, 255, 0) 69.71%);
        }

        .asset-overview {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            width: 690px;
            margin: 60px 0 0 30px;

            .asset-overview-heading {
                width: 100%;
                min-height: 72px;

                .asset-overview-label {
                    flex: 1 1 auto;
                    min-width: 0;
                    font-size: 24px;
                    line-height: 34px;
                }

                .asset-overview-eye {
                    flex: 0 0 72px;
                    width: 72px;
                    height: 72px;
                    border: 1px solid rgba(255, 255, 255, 0.20);
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.20);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);

                    img {
                        width: 32px;
                        height: 32px;
                    }
                }
            }

            .asset-overview-value {
                width: 100%;
                height: 56px;
                margin-top: 2px;
                gap: 16px;

                .asset-overview-token {
                    flex: 0 0 52px;
                    width: 52px;
                    height: 52px;
                }

                .asset-overview-number {
                    min-width: 0;
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
        }

        .asset-statistics {
            position: relative;
            z-index: 1;
            flex: 0 0 auto;
            width: 714px;
            min-height: 140px;
            margin: 48px auto 30px;
            padding: 25px 30px;
            border: 2px solid rgba(255, 255, 255, 0.20);
            border-radius: 32px;
            background: rgba(255, 255, 255, 0.10);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);

            .asset-statistics-item {
                flex: 1 1 0;
                min-width: 0;
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
        position: relative;
        z-index: 1;
        display: flex;
        flex: 0 0 auto;
        flex-direction: column;
        width: 100%;
        min-height: 145px;
        margin-top: 30px;
        padding-left: 30px;

        .plan-heading-title {
            flex: 0 0 auto;
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
            display: flex;
            flex: 0 0 auto;
            width: 720px;
            min-height: 59px;
            margin-top: 30px;
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
        display: flex;
        flex: 0 0 auto;
        flex-direction: column;
        width: 690px;
        margin: 30px auto 0;
        padding: 10px 10px 32px;
        border-radius: 40px;
        background: rgba(255, 255, 255, 0.10);

        .plan-card-media {
            position: relative;
            flex: 0 0 auto;
            width: 670px;
            height: 420px;

            .plan-card-cover {
                display: block;
                width: 100%;
                height: 100%;
                border-radius: 40px;
                object-fit: cover;
            }

            // 限购标记与封面属于叠层关系，因此仅在该局部保留定位。
            .plan-card-limit {
                position: absolute;
                top: 20px;
                right: 20px;
                min-width: 218px;
                min-height: 64px;
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
                    flex: none;
                    min-width: 56px;
                    height: 56px;
                    margin-left: 4px;
                    padding: 0 10px;
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
        }

        .plan-card-body {
            display: flex;
            flex: 0 0 auto;
            flex-direction: column;
            width: 630px;
            margin: 30px auto 0;

            .plan-card-info {
                flex: 0 0 auto;
                width: 100%;
                min-height: 56px;

                .plan-card-name {
                    min-width: 0;
                    gap: 8px;
                    font-size: 32px;
                    font-weight: 600;
                    line-height: 48px;

                    img {
                        flex: 0 0 48px;
                        width: 48px;
                        height: 48px;
                    }

                    span {
                        min-width: 0;
                        overflow-wrap: anywhere;
                    }
                }

                .plan-card-cycle {
                    flex: 0 0 auto;
                    min-width: 148px;
                    min-height: 56px;
                    margin-left: 20px;
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
                margin-top: 30px;
                font-size: 26px;
                line-height: 36px;
            }

            .plan-card-input {
                flex: 0 0 auto;
                width: 100%;
                min-height: 90px;
                margin-top: 20px;
                padding: 0 20px 0 30px;
                border: 1px solid rgba(255, 255, 255, 0.20);
                border-radius: 20px;
                background: rgba(255, 255, 255, 0.04);

                input {
                    flex: 1 1 auto;
                    min-width: 0;
                    border: 0;
                    outline: 0;
                    background: transparent;
                    color: #FFFFFF;
                    font: inherit;
                    font-size: 28px;
                    line-height: 39px;
                }

                img {
                    flex: 0 0 50px;
                    width: 50px;
                    height: 50px;
                }
            }

            .plan-card-range {
                flex: 0 0 auto;
                flex-wrap: wrap;
                width: 100%;
                min-height: 28px;
                margin-top: 24px;
                font-family: "Roboto", "Helvetica Neue", sans-serif;
                font-size: 24px;
                line-height: 28px;

                .plan-card-range-dot {
                    flex: 0 0 8px;
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
                flex: 0 0 1px;
                width: 100%;
                height: 1px;
                margin-top: 40px;
                background: rgba(255, 255, 255, 0.10);
            }

            .plan-card-footer {
                flex: 0 0 auto;
                width: 100%;
                min-height: 87px;
                margin-top: 30px;

                .plan-card-yield {
                    flex: 0 1 208px;
                    min-width: 0;

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
                        overflow-wrap: anywhere;
                    }
                }

                .plan-card-submit {
                    flex: 0 0 208px;
                    width: 208px;
                    min-height: 85px;
                    margin-left: 20px;
                    box-shadow: none;
                    font-size: 32px;
                    font-weight: 600;
                    line-height: 45px;
                }
            }
        }
    }

    // 模块四：跨系统入口横幅
    .system-banner {
        position: relative;
        display: flex;
        flex: 0 0 auto;
        width: 690px;
        height: 280px;
        margin: 40px auto 0;
        overflow: hidden;
        border: 1px solid #1261F3;
        border-radius: 32px;

        .system-banner-bg {
            position: absolute;
            inset: 0;
            z-index: 0;
            width: 100%;
            height: 100%;
            border-radius: 32px;
            object-fit: cover;
            pointer-events: none;
        }

        .system-banner-content {
            position: relative;
            z-index: 1;
            display: flex;
            flex: 1 1 auto;
            align-items: flex-start;
            flex-direction: column;
            min-width: 0;
            padding: 29px 20px;

            .system-banner-tag {
                flex: 0 0 auto;
                min-height: 38px;
                padding: 4px 20px;
                border: 1px solid #4C91FF;
                border-radius: 999px;
                color: #4C91FF;
                font-size: 20px;
                line-height: 28px;
            }

            .system-banner-title {
                flex: 0 0 auto;
                max-width: 300px;
                margin-top: 12px;
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
                flex: 0 0 auto;
                max-width: 300px;
                color: #B8C3D4;
                font-size: 24px;
                line-height: 34px;
            }

            .system-banner-button {
                flex: 0 0 auto;
                min-width: 149px;
                min-height: 50px;
                margin-top: 28px;
                padding: 8px 20px;
                border-radius: 999px;
                background: #1261F3;
                font-size: 24px;
                font-weight: 600;
                line-height: 34px;
            }
        }
    }

    // 模块五：实时交易标题与卡片列表
    .transaction-section {
        display: flex;
        flex: 0 0 auto;
        flex-direction: column;
        width: 690px;
        margin: 40px auto 0;

        .transaction-section-header {
            flex: 0 0 auto;
            width: 100%;
            min-height: 56px;

            .transaction-section-title {
                min-width: 0;
                gap: 10px;
                font-size: 32px;
                font-weight: 500;
                line-height: 45px;

                img {
                    flex: 0 0 56px;
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
            flex: 0 0 auto;
            flex-direction: column;
            width: 100%;
            margin-top: 30px;
            overflow: hidden;

            .transaction-list-track {
                display: flex;
                width: 100%;
                flex-direction: column;
                gap: 20px;
                will-change: transform;

                &.is-animated {
                    transition: transform 420ms ease;
                }

                .transaction-item {
                    display: flex;
                    flex: 0 0 auto;
                    width: 100%;
                    min-height: 168px;
                    padding: 30px;
                    gap: 49px;
                    border-radius: 32px;
                    background: rgba(255, 255, 255, 0.10);
                    text-align: left;

                    .transaction-item-column {
                        display: flex;
                        flex: 1 1 0;
                        flex-direction: column;
                        min-width: 0;
                        gap: 12px;
                        line-height: normal;

                        &.transaction-item-hash {
                            flex-basis: 180px;
                        }

                        &.transaction-item-amount,
                        &.transaction-item-profit {
                            flex-basis: 176px;
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

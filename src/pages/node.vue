<template>
    <div class="page-node">
        <!-- 公共模块：固定品牌导航，包含账户状态、消息和语言入口 -->
        <home-nav-bar
            theme="assets"
            @click-notice="$go(2, '/noticeList')"
        />

        <main class="node-main">
            <!-- 模块一、二：节点商品 3D 轮播。右侧露出下一张卡片，提示用户可继续切换。 -->
            <section v-if="nodeProducts.length" class="node-carousel" :aria-label="$t('节点')">
                <swiper
                    ref="nodeSwiper"
                    class="node-swiper"
                    :options="nodeSwiperOptions"
                    @slide-change="handleNodeSlideChange"
                >
                    <swiper-slide
                        v-for="(node, index) in nodeProducts"
                        :key="node.id"
                        class="node-carousel-slide"
                        @click.native="selectNode(node, index)"
                    >
                        <div class="node-hero-visual">
                            <img
                                :src="node.image || nodeHeroFallback"
                                :alt="node.name || $t('节点')"
                                @error="useNodeImageFallback"
                            />
                        </div>

                        <section class="node-subscription-card">
                            <header class="node-subscription-header">
                                <h1 class="node-subscription-title">{{ node.name || $t('无数据') }}</h1>

                                <div class="node-subscription-stock">
                                    <img src="@img/node-stock.svg" alt="" />
                                    <span class="node-subscription-stock-text">
                                        <span>{{ $t('剩余库存') }}</span>
                                        <span class="node-subscription-stock-value">{{ displayNodeValue(node.remain) }}</span>
                                        <span>{{ $t('个') }}</span>
                                    </span>
                                </div>
                            </header>

                            <div class="node-subscription-price">
                                <div class="node-subscription-label">{{ $t('认购价格') }}</div>
                                <div class="node-subscription-price-value">
                                    <span>{{ displayNodeValue(getNodePrice(node)) }}</span>
                                    <span class="node-subscription-currency">{{ selectedCurrency }}</span>
                                </div>
                            </div>

                            <button type="button" class="node-subscription-method" @click.stop="toggleCurrency">
                                <span class="node-subscription-method-label">{{ $t('认购方式') }}</span>
                                <span class="node-subscription-method-value">
                                    <span>{{ selectedCurrency }}</span>
                                    <img src="@img/node-subscribe-arrow.svg" alt="" />
                                </span>
                            </button>
                        </section>
                    </swiper-slide>
                </swiper>
            </section>

            <!-- 接口尚未返回节点时，保留原有占位结构。 -->
            <template v-else>
                <div class="node-hero-visual">
                    <img :src="nodeHeroFallback" alt="" />
                </div>

                <section class="node-subscription-card">
                    <header class="node-subscription-header">
                        <h1 class="node-subscription-title">{{ nodeInfo.name }}</h1>

                        <div class="node-subscription-stock">
                            <img src="@img/node-stock.svg" alt="" />
                            <span class="node-subscription-stock-text">
                                <span>{{ $t('剩余库存') }}</span>
                                <span class="node-subscription-stock-value">{{ nodeInfo.remainingStock }}</span>
                                <span>{{ $t('个') }}</span>
                            </span>
                        </div>
                    </header>

                    <div class="node-subscription-price">
                        <div class="node-subscription-label">{{ $t('认购价格') }}</div>
                        <div class="node-subscription-price-value">
                            <span>{{ nodeInfo.price }}</span>
                            <span class="node-subscription-currency">{{ nodeInfo.currency }}</span>
                        </div>
                    </div>

                    <button type="button" class="node-subscription-method" disabled>
                        <span class="node-subscription-method-label">{{ $t('认购方式') }}</span>
                        <span class="node-subscription-method-value">
                            <span>{{ nodeInfo.currency }}</span>
                            <img src="@img/node-subscribe-arrow.svg" alt="" />
                        </span>
                    </button>
                </section>
            </template>

            <!-- 模块三：节点认购操作 -->
            <section class="node-actions">
                <button type="button" class="node-action-button node-action-primary" @click="prepareNodeOrder">
                    {{ $t('确认认购') }}
                </button>
                <button
                    type="button"
                    class="node-action-button node-action-orders"
                    @click="$router.push('/node/orders')"
                >
                    {{ $t('认购订单') }}
                </button>
            </section>
        </main>

        <!-- 公共模块：固定悬浮底部 TabBar -->
        <home-tab-bar active="node" @change="handleTabChange" />
        <transaction-auth-popup
            v-if="showNodeAuth"
            :title="$t('确认认购')"
            :google-required="googleNodeRequired"
            :pay-required="!googleNodeRequired"
            :loading="isSubmitting"
            @close="showNodeAuth = false"
            @confirm="submitNodeOrder"
        />
    </div>
</template>

<script>
import HomeNavBar from '@/components/homeNavBar'
import HomeTabBar from '@/components/homeTabBar'
import TransactionAuthPopup from '@/components/transactionAuthPopup'
import nodeHeroFallback from '@img/node-hero-card.png'

export default {
    name: 'Node',
    components: {
        HomeNavBar,
        HomeTabBar,
        TransactionAuthPopup,
    },
    data() {
        return {
            nodeHeroFallback,
            nodeProducts: [],
            activeNodeId: null,
            selectedCcy: 'balance_usdt',
            showNodeAuth: false,
            isSubmitting: false,
            nodeConfig: {
                google_2fa_node_switch: 0,
            },
            nodeConfigLoaded: false,
            hasBoundEmail: false,
            userProfileLoaded: false,
            nodeSwiperOptions: {
                slidesPerView: 1.1,
                spaceBetween: 10,
                freeMode: false,
                grabCursor: true,
                centeredSlides: true,
            },
        }
    },
    computed: {
        activeNode() {
            return this.nodeProducts.find(item => item.id === this.activeNodeId) || null
        },
        activeNodeIndex() {
            return this.nodeProducts.findIndex(item => item.id === this.activeNodeId)
        },
        googleNodeRequired() {
            return Number(this.nodeConfig.google_2fa_node_switch) === 1
        },
        selectedCurrency() {
            return this.selectedCcy === 'balance_usdt' ? 'USDT' : 'AIX'
        },
        nodeInfo() {
            const node = this.activeNode
            if (!node) {
                return {
                    name: this.$t('无数据'),
                    image: '',
                    price: this.$t('无数据'),
                    currency: this.$t('无数据'),
                    remainingStock: this.$t('无数据'),
                }
            }
            const isUsdt = this.selectedCcy === 'balance_usdt'
            return {
                ...node,
                price: isUsdt ? node.usdt_amount : node.aix_stake_amount,
                currency: isUsdt ? 'USDT' : 'AIX',
                remainingStock: node.remain,
            }
        },
    },
    mounted() {
        this.loadNodes()
        this.loadNodeConfig()
        this.loadUserProfile()
    },
    methods: {
        async loadUserProfile() {
            try {
                const res = await this.$http.get("/api/users/my")
                if (res.code == 200 && res.data) {
                    this.hasBoundEmail = Boolean(String(res.data.email || "").trim())
                    this.userProfileLoaded = true
                }
            } catch (error) {
                console.log("节点页账户信息加载失败", error)
            }
        },

        async loadNodes() {
            try {
                const res = await this.$http.get('/api/node_orders')
                if (res.code == 200) {
                    this.nodeProducts = res.data && Array.isArray(res.data.nodes) ? res.data.nodes : []
                    const hasActiveNode = this.nodeProducts.some(item => item.id === this.activeNodeId)
                    this.activeNodeId = hasActiveNode
                        ? this.activeNodeId
                        : (this.nodeProducts.length ? this.nodeProducts[0].id : null)
                    this.$nextTick(() => this.updateNodeSwiper())
                }
            } catch (error) {
                console.log('节点商品加载失败', error)
            }
        },
        async loadNodeConfig() {
            try {
                const res = await this.$http.get('/api/node_orders/config')
                if (res.code == 200 && res.data) this.nodeConfig = res.data
            } catch (error) {
                console.log('节点购买配置加载失败', error)
            } finally {
                this.nodeConfigLoaded = true
            }
        },
        toggleCurrency() {
            if (!this.activeNode) return
            this.selectedCcy = this.selectedCcy === 'balance_usdt' ? 'balance_aix' : 'balance_usdt'
        },
        displayNodeValue(value) {
            return value === undefined || value === null || value === '' ? this.$t('无数据') : value
        },
        getNodePrice(node) {
            return this.selectedCcy === 'balance_usdt' ? node.usdt_amount : node.aix_stake_amount
        },
        useNodeImageFallback(event) {
            const image = event.currentTarget
            if (!image || image.dataset.fallbackApplied === '1') return
            image.dataset.fallbackApplied = '1'
            image.src = this.nodeHeroFallback
        },
        selectNode(node, index) {
            if (!node || node.id === undefined || node.id === null) return
            this.activeNodeId = node.id
            const swiper = this.getNodeSwiper()
            if (swiper && swiper.activeIndex !== index) swiper.slideTo(index)
        },
        getNodeSwiper() {
            return this.$refs.nodeSwiper && this.$refs.nodeSwiper.$swiper
        },
        updateNodeSwiper() {
            const swiper = this.getNodeSwiper()
            if (!swiper) return
            swiper.update()
            if (this.activeNodeIndex >= 0) swiper.slideTo(this.activeNodeIndex, 0)
        },
        handleNodeSlideChange() {
            const swiper = this.getNodeSwiper()
            if (!swiper) return
            const index = Number.isFinite(swiper.realIndex) ? swiper.realIndex : swiper.activeIndex
            const node = this.nodeProducts[index]
            if (node) this.activeNodeId = node.id
        },
        prepareNodeOrder() {
            if (!this.nodeConfigLoaded) {
                this.$toast(this.$t('配置加载中，请稍后'))
                return
            }
            if (!this.userProfileLoaded) {
                this.$toast(this.$t("账户信息加载中，请稍后"))
                return
            }
            if (!this.hasBoundEmail) {
                this.promptBindEmail()
                return
            }

            if (!this.activeNode) {
                this.$toast(this.$t('暂无可认购节点'))
                return
            }
            if (Number(this.activeNode.remain) <= 0) {
                this.$toast(this.$t('节点库存不足'))
                return
            }
            this.showNodeAuth = true
        },
        async submitNodeOrder(auth) {
            if (this.isSubmitting) return
            this.isSubmitting = true
            try {
                const res = await this.$http.post('/api/node_orders', {
                    node_product_id: this.activeNode.id,
                    ccy: this.selectedCcy,
                    ...auth,
                })
                if (res.code == 200) {
                    this.showNodeAuth = false
                    this.$messageTip.success(this.$t('认购成功'))
                    this.loadNodes()
                }
            } catch (error) {
                console.log('节点认购失败', error)
            } finally {
                this.isSubmitting = false
            }
        },
        promptBindEmail() {
            this.$dialog.confirm({
                title: this.$t('绑定邮箱'),
                message: this.$t('请先绑定邮箱'),
                confirmButtonText: this.$t('立即绑定'),
                cancelButtonText: this.$t('取消'),
                showCancelButton: true,
            }).then(() => {
                this.$router.push({ name: 'bindEmail' })
            }).catch(() => {})
        },
        handleTabChange(tab) {
            if (tab === 'index') {
                this.$go(2, '/index')
            } else if (tab === 'assets') {
                this.$go(2, '/assets')
            } else if (tab === 'mine') {
                this.$go(2, '/mine')
            }
        },
    },
}
</script>

<style scoped lang="less">
.page-node {
    width: 750px;
    min-height: 100vh;
    margin: 0 auto;
    overflow-x: hidden;
    background: #01050C url('~@img/node-page-bg.png') top center / 750px 1120px no-repeat;
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

    .node-main {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        min-height: 1624px;
        padding: 247px 30px 290px;

        // 模块一、二：由 VueAwesomeSwiper 驱动的多卡片自由滑动节点轮播。
        .node-carousel {
            flex: 0 0 auto;
            width: 690px;
            max-width: 100%;

            .node-swiper {
                width: 100%;
                padding-bottom: 8px;

                /deep/ .swiper-wrapper {
                    align-items: flex-start;
                }

                /deep/ .swiper-slide {
                    height: auto;
                }

                .node-carousel-slide {
                    height: auto;

                    .node-hero-visual {
                        width: 100%;
                        height: 454px;

                        img {
                            width: 100%;
                            height: 100%;
                            max-width: 100%;
                            transform: none;
                        }
                    }
                }
            }
        }

        // 节点为空时沿用默认银行卡主视觉。
        .node-hero-visual {
            flex: 0 0 auto;
            width: 550px;
            height: 454px;
            overflow: hidden;
            pointer-events: none;

            img {
                display: block;
                width: 124.60%;
                height: 126.19%;
                max-width: none;
                transform: translate(-9.87%, -12.09%);
            }
        }

        // 模块二：节点认购信息卡
        .node-subscription-card {
            display: flex;
            flex: 0 0 auto;
            flex-direction: column;
            width: 100%;
            min-height: 379px;
            padding: 32px 28px 29px;
            border: 2px solid rgba(255, 255, 255, 0.10);
            border-radius: 40px;
            background: rgba(255, 255, 255, 0.10);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);

            .node-subscription-header {
                display: flex;
                flex: 0 0 auto;
                align-items: center;
                justify-content: space-between;
                min-height: 54px;
                gap: 20px;

                .node-subscription-title {
                    min-width: 0;
                    margin: 0;
                    color: #4C91FF;
                    font-size: 32px;
                    font-weight: 600;
                    line-height: 45px;
                }

                .node-subscription-stock {
                    display: flex;
                    flex: 0 0 auto;
                    align-items: center;
                    height: 54px;
                    padding: 10px 20px;
                    gap: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.10);
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.10);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);

                    img {
                        flex: 0 0 auto;
                        width: 32px;
                        height: 32px;
                    }

                    .node-subscription-stock-text {
                        color: #B8C3D4;
                        font-size: 24px;
                        font-weight: 400;
                        line-height: 34px;
                        white-space: nowrap;

                        .node-subscription-stock-value {
                            margin: 0 6px;
                            color: #4C91FF;
                        }
                    }
                }
            }

            .node-subscription-price {
                display: flex;
                flex: 0 0 auto;
                flex-direction: column;
                align-items: flex-start;
                margin-top: 30px;

                .node-subscription-label {
                    color: #B8C3D4;
                    font-size: 24px;
                    font-weight: 400;
                    line-height: 34px;
                }

                .node-subscription-price-value {
                    display: flex;
                    align-items: center;
                    min-height: 78px;
                    margin-top: 12px;
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 56px;
                    font-weight: 500;
                    line-height: 78px;

                    .node-subscription-currency {
                        margin-left: 8px;
                        color: #B8C3D4;
                        font-size: 32px;
                        line-height: 45px;
                    }
                }
            }

            .node-subscription-method {
                display: flex;
                flex: 0 0 auto;
                align-items: flex-end;
                justify-content: space-between;
                width: 100%;
                min-height: 70px;
                margin-top: 36px;
                padding-top: 30px;
                border-top: 1px solid rgba(255, 255, 255, 0.12);

                .node-subscription-method-label {
                    color: #B8C3D4;
                    font-size: 28px;
                    font-weight: 400;
                    line-height: 39px;
                }

                .node-subscription-method-value {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 28px;
                    font-weight: 400;
                    line-height: 39px;

                    img {
                        flex: 0 0 auto;
                        width: 24px;
                        height: 24px;
                    }
                }
            }
        }

        // 模块三：认购操作按钮
        .node-actions {
            display: flex;
            flex: 0 0 auto;
            flex-direction: column;
            width: 100%;
            margin-top: 40px;
            gap: 30px;

            .node-action-button {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 92px;
                border-radius: 999px;
                font-size: 32px;
                font-weight: 600;
                line-height: 45px;

                &.node-action-primary {
                    background: #1261F3;
                    color: #FFFFFF;
                }

                &.node-action-orders {
                    background: rgba(18, 97, 243, 0.20);
                    color: #4C91FF;
                }
            }
        }
    }
}
</style>

<template>
    <div class="settings-page">
        <!-- 公共模块：设计稿系统状态栏不渲染，使用项目统一的固定 Vant NavBar。 -->
        <van-nav-bar
            :title="$t('设置')"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
        >
            <template #left>
                <img src="@img/settings-back.svg" alt="" class="settings-back" />
            </template>
        </van-nav-bar>

        <main class="settings-content">
            <!-- 模块一：安全设置 -->
            <section class="settings-section settings-security">
                <h2>{{ $t('安全设置') }}</h2>
                <div class="settings-list">
                    <button
                        v-for="item in securityItems"
                        :key="item.action"
                        type="button"
                        class="settings-item df-aic-jusb"
                        @click="handleItem(item.action)"
                    >
                        <span>{{ $t(item.label) }}</span>
                        <img src="@img/home-more-arrow.png" alt="" />
                    </button>
                    <button
                        type="button"
                        class="settings-item settings-google-item df-aic-jusb"
                        @click="handleGoogleAuthenticator"
                    >
                        <span>{{ $t('谷歌验证器') }}</span>
                        <span class="settings-item-action df-aic">
                            <span
                                class="settings-google-status"
                                :class="`is-${googleBindingStatus}`"
                            >
                                {{ googleBindingStatusText }}
                            </span>
                            <img src="@img/home-more-arrow.png" alt="" />
                        </span>
                    </button>
                </div>
            </section>
        </main>

        <!-- 模块三：版本信息与退出登录 -->
        <p class="settings-version">{{ $t('版本号') }}：{{ version }}</p>
        <button type="button" class="settings-logout df-aic-jucen" @click="confirmLogout">
            <img src="@img/settings-logout.svg" alt="" />
            <span>{{ $t('退出登录') }}</span>
        </button>
    </div>
</template>

<script>
export default {
    name: 'Settings',
    data() {
        return {
            version: process.env.VUE_APP_VERSION || '1.1.0',
            googleBindingStatus: 'loading',
            securityItems: [
                { label: '登录密码', action: 'loginPassword' },
                { label: '支付密码', action: 'payPassword' },
            ],
        }
    },
    computed: {
        googleBindingStatusText() {
            if (this.googleBindingStatus === 'bound') return `${this.$t('已绑定')}·${this.$t('可解绑')}`
            if (this.googleBindingStatus === 'unbound') return this.$t('未绑定')
            if (this.googleBindingStatus === 'loading') return this.$t('加载中')
            return this.$t('无数据')
        },
    },
    mounted() {
        this.loadGoogleBindingStatus()
    },
    methods: {
        handleItem(action) {
            if (action === 'loginPassword') {
                this.$router.push({ name: 'changeLoginPassword' })
                return
            }
            // 当前接口文档未提供支付密码功能，保留入口但不给出伪造结果。
            this.$toast(this.$t('该功能暂未开放'))
        },
        async loadGoogleBindingStatus() {
            try {
                const res = await this.$http.get('/api/users/my')
                if (res.code == 200 && res.data) {
                    const enabled = res.data.google_2fa_enabled
                    this.googleBindingStatus = enabled === true || enabled === 1 || enabled === '1' || enabled === 'true'
                        ? 'bound'
                        : 'unbound'
                    return
                }
                this.googleBindingStatus = 'unknown'
            } catch (error) {
                console.log('谷歌验证器绑定状态加载失败', error)
                this.googleBindingStatus = 'unknown'
            }
        },
        handleGoogleAuthenticator() {
            if (this.googleBindingStatus === 'loading') {
                this.$toast(this.$t('加载中'))
                return
            }
            if (this.googleBindingStatus === 'bound') {
                this.$dialog.confirm({
                    title: this.$t('解除绑定谷歌验证器'),
                    message: this.$t('是否确认解绑谷歌验证器？'),
                    confirmButtonText: this.$t('确认解绑'),
                    cancelButtonText: this.$t('取消'),
                    showCancelButton: true,
                }).then(() => {
                    this.$router.push({
                        name: 'googleAuthenticator',
                        query: { action: 'disable' },
                    })
                }).catch(() => {})
                return
            }
            if (this.googleBindingStatus === 'unbound') {
                this.$router.push({ name: 'googleAuthenticator' })
            }
        },
        confirmLogout() {
            this.$dialog.confirm({
                title: this.$t('退出登录'),
                message: this.$t('是否确认退出登录？'),
                confirmButtonText: this.$t('确认'),
                cancelButtonText: this.$t('取消'),
                showCancelButton: true,
            }).then(() => {
                this.logout()
            }).catch(() => {})
        },
        logout() {
            this.$store.commit('setAddress', '')
            localStorage.removeItem('token')
            localStorage.removeItem('address')
            this.$router.replace({ name: 'login' })
        },
    },
}
</script>

<style scoped lang="less">
.settings-page {
    position: relative;
    width: 750px;
    height: 1584px;
    min-height: 100vh;
    margin: 0 auto;
    overflow: hidden;
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

    // 固定导航：设计稿顶部 40px 系统状态栏已移除。
    /deep/ .van-nav-bar__placeholder,
    /deep/ .van-nav-bar,
    /deep/ .van-nav-bar__content {
        height: 88px;
    }

    /deep/ .van-nav-bar {
        background: rgba(0, 0, 0, 0.60) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;

        .van-nav-bar__title {
            max-width: 360px;
            color: #FFFFFF;
            font-size: 32px;
            font-weight: 600;
            line-height: 45px;
        }

        .van-nav-bar__left {
            left: 30px;
            padding: 0;
        }
    }

    .settings-back {
        display: block;
        width: 24px;
        height: 24px;
    }

    .settings-content {
        position: relative;
        width: 750px;
        height: 100%;

        .settings-section {
            position: absolute;
            left: 30px;
            width: 690px;

            h2 {
                height: 34px;
                margin: 0;
                color: rgba(184, 195, 212, 0.50);
                font-size: 24px;
                font-weight: 500;
                line-height: 34px;
            }

            .settings-list {
                display: flex;
                margin-top: 24px;
                flex-direction: column;
                gap: 16px;

                .settings-item {
                    width: 690px;
                    height: 99px;
                    padding: 0 30px;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.10);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
                    font-size: 28px;
                    font-weight: 500;
                    line-height: 39px;
                    text-align: left;

                    img {
                        width: 16px;
                        height: 16px;
                        flex: 0 0 16px;
                    }

                    &:active {
                        background: rgba(255, 255, 255, 0.15);
                    }
                }
            }
        }

        .settings-security {
            top: 30px;
        }

        .settings-google-item {
            .settings-item-action {
                gap: 18px;

                .settings-google-status {
                    font-size: 22px;
                    font-weight: 400;
                    line-height: 32px;
                    white-space: nowrap;

                    &.is-bound {
                        color: #4C91FF;
                    }

                    &.is-unbound {
                        color: #FF9500;
                    }

                    &.is-loading,
                    &.is-unknown {
                        color: rgba(184, 195, 212, 0.50);
                    }
                }
            }
        }
    }

    .settings-version {
        position: fixed;
        bottom: 162px;
        left: 50%;
        z-index: 2;
        margin: 0;
        transform: translateX(-50%);
        color: #999999;
        font-size: 24px;
        line-height: 34px;
        white-space: nowrap;
    }

    .settings-logout {
        position: fixed;
        bottom: 40px;
        left: 50%;
        z-index: 2;
        width: 690px;
        height: 88px;
        gap: 10px;
        transform: translateX(-50%);
        border-radius: 999px;
        background: #1261F3;
        font-size: 28px;
        font-weight: 500;
        line-height: 39px;

        img {
            width: 32px;
            height: 32px;
        }

        &:active {
            transform: translateX(-50%) scale(0.98);
        }
    }
}
</style>

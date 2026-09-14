<template>
    <div class="settings-page">
        <!-- 公共模块：设计稿系统状态栏不渲染，导航随页面正常文档流排列。 -->
        <van-nav-bar
            :title="$t('设置')"
            :border="false"
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
                        v-for="item in visibleSecurityItems"
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

            <!-- 模块二：账号信息。缺少邮箱或钱包地址时提供对应的绑定入口。 -->
            <section class="settings-section settings-account">
                <h2>{{ $t('账号信息') }}</h2>
                <div class="settings-list">
                    <button
                        type="button"
                        class="settings-item settings-account-item df-aic-jusb"
                        @click="handleAccountBinding('email')"
                    >
                        <span>{{ account.email ? $t('邮箱') : $t('绑定邮箱') }}</span>
                        <span class="settings-item-action df-aic">
                            <span
                                class="settings-account-status"
                                :class="{
                                    'is-bound': Boolean(account.email),
                                    'is-unbound': accountInfoLoaded && !account.email,
                                    'is-loading': !accountInfoLoaded,
                                }"
                            >
                                {{ account.email || (accountInfoLoaded ? $t('未绑定') : $t('加载中')) }}
                            </span>
                            <img src="@img/home-more-arrow.png" alt="" />
                        </span>
                    </button>
                    <button
                        type="button"
                        class="settings-item settings-account-item df-aic-jusb"
                        @click="handleAccountBinding('address')"
                    >
                        <span>{{ account.address ? $t('钱包地址') : $t('绑定钱包地址') }}</span>
                        <span class="settings-item-action df-aic">
                            <span
                                class="settings-account-status"
                                :class="{
                                    'is-bound': Boolean(account.address),
                                    'is-unbound': accountInfoLoaded && !account.address,
                                    'is-loading': !accountInfoLoaded,
                                }"
                            >
                                <template v-if="account.address">{{ account.address | addrHide }}</template>
                                <template v-else>{{ accountInfoLoaded ? $t('未绑定') : $t('加载中') }}</template>
                            </span>
                            <img src="@img/home-more-arrow.png" alt="" />
                        </span>
                    </button>
                    <button
                        v-if="account.email"
                        type="button"
                        class="settings-item settings-account-item df-aic-jusb"
                        @click="handleItem('switchAccount')"
                    >
                        <span>{{ $t('切换账号') }}</span>
                        <img src="@img/home-more-arrow.png" alt="" />
                    </button>
                </div>
            </section>
        </main>

        <!-- 模块三：版本信息与退出登录 -->
        <!-- <p class="settings-version">{{ $t('版本号') }}：{{ version }}</p> -->
        <footer class="settings-footer">
            <button type="button" class="settings-logout df-aic-jucen" @click="confirmLogout">
                <img src="@img/settings-logout.svg" alt="" />
                <span>{{ $t('退出登录') }}</span>
            </button>
        </footer>

    </div>
</template>

<script>
export default {
    name: 'Settings',
    data() {
        return {
            version: process.env.VUE_APP_VERSION || '1.1.0',
            googleBindingStatus: 'loading',
            accountInfoLoaded: false,
            account: {
                email: '',
                address: '',
            },
            securityItems: [
                { label: '登录密码', action: 'loginPassword' },
                { label: '支付密码', action: 'payPassword' },
            ],
        }
    },
    computed: {
        visibleSecurityItems() {
            return this.accountInfoLoaded && this.account.email ? this.securityItems : []
        },
        googleBindingStatusText() {
            if (this.googleBindingStatus === 'bound') return this.$t('已绑定')
            if (this.googleBindingStatus === 'unbound') return this.$t('未绑定')
            if (this.googleBindingStatus === 'loading') return this.$t('加载中')
            return this.$t('无数据')
        },
    },
    mounted() {
        this.loadAccountInfo()
    },
    methods: {
        handleItem(action) {
            if (['loginPassword', 'payPassword', 'switchAccount'].includes(action)) {
                if (!this.accountInfoLoaded) {
                    this.$toast(this.$t('账户信息加载中，请稍后'))
                    return
                }
                if (!this.account.email) {
                    this.promptBindEmail()
                    return
                }
            }
            if (action === 'loginPassword') {
                this.$router.push({ name: 'changeLoginPassword' })
                return
            }
            if (action === 'payPassword') {
                this.$router.push({ name: 'changePayPassword' })
                return
            }
            if (action === 'switchAccount') {
                this.$router.push({ name: 'switchAccount' })
            }
        },
        async loadAccountInfo() {
            try {
                const res = await this.$http.get('/api/users/my')
                if (res.code == 200 && res.data) {
                    const enabled = res.data.google_2fa_enabled
                    const isGoogleBound = enabled === true || enabled === 1 || enabled === '1' || enabled === 'true'
                    this.googleBindingStatus = isGoogleBound ? 'bound' : 'unbound'
                    this.account = {
                        email: String(res.data.email || '').trim(),
                        address: String(res.data.address || '').trim(),
                    }
                    return
                }
                this.googleBindingStatus = 'unknown'
            } catch (error) {
                console.log('账号信息加载失败', error)
                this.googleBindingStatus = 'unknown'
            } finally {
                this.accountInfoLoaded = true
            }
        },
        handleAccountBinding(type) {
            if (!this.accountInfoLoaded) {
                this.$toast(this.$t('账户信息加载中，请稍后'))
                return
            }
            if (type === 'email') {
                if (this.account.email) {
                    this.$toast(this.$t('邮箱已绑定'))
                    return
                }
                this.$router.push({ name: 'bindEmail' })
                return
            }
            if (!this.account.email) {
                this.$toast(this.$t('请先绑定邮箱'))
                return
            }
            if (this.account.address) {
                this.$toast(this.$t('钱包地址已绑定'))
                return
            }
            this.$router.push({ name: 'bindWalletAddress' })
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
        handleGoogleAuthenticator() {
            if (this.googleBindingStatus === 'loading') {
                this.$toast(this.$t('加载中'))
                return
            }
            if (this.googleBindingStatus === 'bound') {
                // 后端不再提供用户端解绑能力；已绑定账号仅展示状态，不能进入解绑流程。
                this.$toast(this.$t('谷歌验证器已绑定'))
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
    display: flex;
    width: 750px;
    min-height: 100vh;
    margin: 0 auto;
    overflow-x: hidden;
    flex-direction: column;
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

    // 普通流导航：设计稿顶部 40px 系统状态栏已移除。
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
            padding: 0 0 0 30px;
        }
    }

    .settings-back {
        display: block;
        width: 24px;
        height: 24px;
    }

    .settings-content {
        display: flex;
        width: 690px;
        margin: 0 auto;
        padding-top: 30px;
        flex: 1 0 auto;
        flex-direction: column;

        .settings-section {
            width: 100%;

            & + .settings-section {
                margin-top: 60px;
            }

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

        .settings-google-item,
        .settings-account-item {
            .settings-item-action {
                min-width: 0;
                gap: 18px;

                .settings-google-status,
                .settings-account-status {
                    display: block;
                    max-width: 290px;
                    overflow: hidden;
                    font-size: 22px;
                    font-weight: 400;
                    line-height: 32px;
                    text-overflow: ellipsis;
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

    .settings-footer {
        display: flex;
        width: 690px;
        height: 88px;
        margin: 60px auto 40px;
        flex: 0 0 88px;
    }

    .settings-logout {
        width: 100%;
        height: 88px;
        gap: 10px;
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
            transform: scale(0.98);
        }
    }
}
</style>

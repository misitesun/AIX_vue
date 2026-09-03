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
                </div>
            </section>
        </main>

        <!-- 模块三：版本信息与退出登录 -->
        <!-- <p class="settings-version">{{ $t('版本号') }}：{{ version }}</p> -->
        <button type="button" class="settings-logout df-aic-jucen" @click="confirmLogout">
            <img src="@img/settings-logout.svg" alt="" />
            <span>{{ $t('退出登录') }}</span>
        </button>

        <!-- 已绑定邮箱但未绑定谷歌验证器时，设置页同样强制完成绑定。 -->
        <div
            v-if="showGoogleBindingRequired"
            class="settings-google-binding-required-overlay"
            role="dialog"
            aria-modal="true"
            @touchmove.prevent
        >
            <section class="settings-google-binding-required-panel">
                <span class="settings-google-binding-required-icon df-aic-jucen">
                    <van-icon name="shield-o" size="48" color="#4C91FF" />
                </span>
                <h2>{{ $t('谷歌验证器未绑定') }}</h2>
                <p>{{ $t('为了保障您的账户安全，请先绑定谷歌验证器后继续使用') }}</p>
                <button type="button" @click="goBindGoogleAuthenticator">
                    {{ $t('立即绑定') }}
                </button>
            </section>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Settings',
    data() {
        return {
            version: process.env.VUE_APP_VERSION || '1.1.0',
            googleBindingStatus: 'loading',
            showGoogleBindingRequired: false,
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
            if (action === 'loginPassword') {
                this.$router.push({ name: 'changeLoginPassword' })
                return
            }
            if (action === 'payPassword') {
                this.$router.push({ name: 'changePayPassword' })
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
                    this.showGoogleBindingRequired = Boolean(this.account.email) && !isGoogleBound
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
        goBindGoogleAuthenticator() {
            this.$router.push({
                name: 'googleAuthenticator',
                query: { forced: '1' },
            })
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

        .settings-account {
            top: 454px;
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

    // 强制绑定弹窗：无关闭控件，阻止触摸穿透。
    .settings-google-binding-required-overlay {
        position: fixed;
        top: 0;
        left: 50%;
        z-index: 700;
        display: flex;
        width: 750px;
        height: 100vh;
        align-items: center;
        justify-content: center;
        padding: 30px;
        transform: translateX(-50%);
        background: rgba(0, 3, 12, 0.82);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);

        .settings-google-binding-required-panel {
            width: 630px;
            padding: 64px 50px 50px;
            border: 2px solid #1B6CFF;
            border-radius: 36px;
            background: linear-gradient(180deg, rgba(7, 27, 67, 0.98) 0%, rgba(1, 10, 31, 0.98) 100%);
            box-shadow: 0 22px 70px rgba(0, 74, 255, 0.28);
            text-align: center;

            .settings-google-binding-required-icon {
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

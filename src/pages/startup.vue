<template>
    <div class="startup-page" aria-live="polite">
        <div class="startup-stage">
        <!-- 模块一：Figma 启动图背景。 -->
        <img src="@img/email-login-bg.png" alt="" class="startup-background" />

        <!-- 模块二：品牌 Logo。首帧居中，认证分流完成后向上收拢。 -->
        <div class="startup-brand" :class="{ 'is-raised': isBrandRaised }" aria-label="AIX-Quant">
            <span class="startup-brand-symbol"></span>
            <span class="startup-brand-wordmark"></span>
        </div>

        <!-- 模块三：非钱包环境展示邮箱登录，表单由页面底部上移进入。 -->
        <email-login
            v-if="showEmailEntry"
            class="startup-email-entry"
            embedded
            :form-visible="isEmailFormVisible"
            @wallet-login="activateWalletLogin"
        />

        <!-- 模块四：钱包环境中，Logo 到位后自动唤起钱包签名。 -->
        <section
            v-if="showWalletEntry"
            class="startup-wallet-entry"
            aria-live="polite"
        >
            <span v-if="!walletError" class="startup-wallet-spinner" aria-hidden="true"></span>
            <p v-if="walletError">{{ $t('钱包连接失败') }}</p>
            <button
                v-if="walletError"
                type="button"
                @click="initializeWalletLogin"
            >
                {{ $t('重新连接钱包') }}
            </button>
        </section>
        </div>
    </div>
</template>

<script>
import { ethers } from 'ethers'
import EmailLogin from './emailLogin.vue'

const SPLASH_DURATION = 2000
const BRAND_TRANSITION_DURATION = 620

export default {
    name: 'Startup',
    components: {
        EmailLogin,
    },
    data() {
        return {
            isBrandRaised: false,
            showEmailEntry: false,
            isEmailFormVisible: false,
            showWalletEntry: false,
            isWalletLoggingIn: false,
            walletError: false,
            splashTimer: null,
            walletTimer: null,
            emailFormTimer: null,
        }
    },
    mounted() {
        this.saveReferrer()
        // 始终保留约两秒启动首帧，避免环境检测速度差异导致闪屏。
        this.splashTimer = window.setTimeout(this.resolveEntry, SPLASH_DURATION)
    },
    beforeDestroy() {
        window.clearTimeout(this.splashTimer)
        window.clearTimeout(this.walletTimer)
        window.clearTimeout(this.emailFormTimer)
    },
    methods: {
        isWalletEnvironment() {
            return typeof window !== 'undefined' && Boolean(window.ethereum)
        },
        hasLoginToken() {
            return Boolean(localStorage.getItem('token'))
        },
        getRouteReferrer() {
            const ref = this.$route.query.ref
            return typeof ref === 'string' ? ref.trim() : ''
        },
        saveReferrer() {
            const ref = this.getRouteReferrer()
            if (ref) localStorage.setItem('ref', ref)
        },
        clearGuestAddress() {
            localStorage.removeItem('address')
            this.$store.commit('setAddress', '')
        },
        getSafeRedirect() {
            const redirect = String(this.$route.query.redirect || '')
            if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return ''
            return redirect
        },
        resolveEntry() {
            // 已登录时不挂载认证表单，保持启动图后直接进入原始目标页面。
            if (this.hasLoginToken()) {
                this.$router.replace(this.getSafeRedirect() || { name: 'index' })
                return
            }

            const ref = this.getRouteReferrer()
            this.clearGuestAddress()
            this.isBrandRaised = true

            // 根路径携带邀请码且未检测到钱包时，直接进入注册并保留邀请码。
            if (ref && !this.isWalletEnvironment()) {
                this.$router.replace({
                    name: 'register',
                    query: { ref },
                })
                return
            }

            if (this.isWalletEnvironment()) {
                this.activateWalletLogin()
                return
            }

            this.showEmailEntry = true
            this.$nextTick(() => {
                // 先挂载在屏幕下方，再在下一帧触发表单上移动画。
                this.emailFormTimer = window.setTimeout(() => {
                    this.isEmailFormVisible = true
                }, 24)
            })
        },
        activateWalletLogin() {
            if (this.isWalletLoggingIn) return

            this.showEmailEntry = false
            this.isEmailFormVisible = false
            this.showWalletEntry = true
            this.walletError = false
            this.isBrandRaised = true

            window.clearTimeout(this.walletTimer)
            // 品牌位置稳定后才触发 MetaMask，避免系统弹窗遮住过渡动画。
            this.walletTimer = window.setTimeout(() => {
                this.initializeWalletLogin()
            }, BRAND_TRANSITION_DURATION)
        },
        getWalletErrorMessage(error) {
            const payload = error && error.data
                ? error.data
                : (error && error.response ? error.response.data : null)
            if (payload && typeof payload === 'object') {
                return String(payload.message || payload.msg || payload.error || '')
            }
            return error && error.message ? String(error.message) : ''
        },
        async initializeWalletLogin() {
            if (this.isWalletLoggingIn) return
            if (!this.isWalletEnvironment()) {
                this.walletError = true
                this.$toast(this.$t('未检测到Web3钱包，请先安装MetaMask'))
                return
            }

            this.isWalletLoggingIn = true
            this.walletError = false
            try {
                const web3 = new ethers.providers.Web3Provider(window.ethereum)
                await window.ethereum.request({ method: 'eth_requestAccounts' })
                const signer = web3.getSigner()
                const address = await signer.getAddress()
                const timestamp = Math.floor(Date.now() / 1000)
                const signature = await signer.signMessage('Login-' + timestamp)

                const res = await this.$http.post('/api/auth/login', {
                    address,
                    signature,
                    timestamp,
                    ref: localStorage.getItem('ref') || '',
                })

                if (res.code == 200 && res.data && res.data.token) {
                    localStorage.setItem('token', res.data.token)
                    localStorage.setItem('address', address)
                    this.$store.commit('setAddress', address)
                    this.$router.replace(this.getSafeRedirect() || { name: 'index' })
                    return
                }

                throw new Error(this.getWalletErrorMessage(res && res.data) || this.$t('登录失败'))
            } catch (error) {
                console.log('启动页钱包登录失败', error)
                this.clearGuestAddress()
                this.walletError = true
            } finally {
                this.isWalletLoggingIn = false
            }
        },
    },
}
</script>

<style scoped lang="less">
.startup-page {
    position: relative;
    width: 750px;
    height: 100vh;
    height: 100dvh;
    min-height: 0;
    margin: 0 auto;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    background: #000308;
    color: #FFFFFF;

    .startup-stage {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 1624px;
    }

    .startup-background {
        position: absolute;
        inset: 0;
        z-index: -1;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: bottom;
        pointer-events: none;
    }

    .startup-brand {
        position: absolute;
        top: 500px;
        left: 50%;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 30px;
        pointer-events: none;
        transform: translateX(-50%);
        transition: top 620ms cubic-bezier(0.22, 1, 0.36, 1), gap 620ms cubic-bezier(0.22, 1, 0.36, 1);

        .startup-brand-symbol {
            display: block;
            width: 142px;
            height: 142px;
            flex: none;
            background: #FFFFFF;
            -webkit-mask: url('~@img/startup-logo-symbol.png') center / contain no-repeat;
            mask: url('~@img/startup-logo-symbol.png') center / contain no-repeat;
            transition: width 620ms cubic-bezier(0.22, 1, 0.36, 1), height 620ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .startup-brand-wordmark {
            display: block;
            width: 240px;
            height: 63px;
            flex: none;
            background: #FFFFFF;
            -webkit-mask: url('~@img/startup-logo-wordmark.png') center / contain no-repeat;
            mask: url('~@img/startup-logo-wordmark.png') center / contain no-repeat;
            transition: width 620ms cubic-bezier(0.22, 1, 0.36, 1), height 620ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        &.is-raised {
            top: 200px;
            gap: 24px;

            .startup-brand-symbol {
                width: 118px;
                height: 118px;
            }

            .startup-brand-wordmark {
                width: 160px;
                height: 42px;
            }
        }
    }

    .startup-email-entry {
        position: absolute;
        inset: 0;
        z-index: 2;
    }

    .startup-wallet-entry {
        position: absolute;
        top: 476px;
        left: 0;
        z-index: 4;
        display: flex;
        width: 750px;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        color: rgba(184, 195, 212, 0.86);
        font-size: 24px;
        line-height: 34px;
        text-align: center;

        p {
            margin: 0;
        }

        button {
            min-width: 240px;
            height: 76px;
            padding: 0 38px;
            border: 0;
            border-radius: 999px;
            outline: 0;
            background: #1261F3;
            color: #FFFFFF;
            font: inherit;
            line-height: 76px;
        }
    }

    .startup-wallet-spinner {
        width: 42px;
        height: 42px;
        border: 4px solid rgba(76, 145, 255, 0.24);
        border-top-color: #4C91FF;
        border-radius: 50%;
        animation: startup-wallet-spin 800ms linear infinite;
    }
}

@keyframes startup-wallet-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>

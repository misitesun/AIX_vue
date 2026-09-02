<template>
    <div class="email-login-page">
        <!-- 模块一：Figma 原始深蓝背景。系统状态栏由宿主环境提供，页面内不重复绘制。 -->
        <img src="@img/email-login-bg.png" alt="" class="email-login-background" />

        <!-- 模块二：品牌标识，沿用设计导出的 Alpha 蒙版资源。 -->
        <div class="email-login-brand" aria-label="AIX-Quant">
            <span class="email-login-brand-symbol"></span>
            <span class="email-login-brand-wordmark"></span>
        </div>

        <!-- 模块三：邮箱和密码登录表单。 -->
        <form class="email-login-form" @submit.prevent="submitEmailLogin">
            <label
                class="email-login-field"
                :class="{ active: activeField === 'email' }"
            >
                <img src="@img/email-login-mail.svg" alt="" class="email-login-field-icon" />
                <input
                    v-model.trim="email"
                    type="email"
                    name="email"
                    autocomplete="email"
                    :placeholder="$t('邮箱')"
                    :aria-label="$t('邮箱')"
                    @focus="activeField = 'email'"
                    @blur="activeField = ''"
                />
            </label>

            <label
                class="email-login-field"
                :class="{ active: activeField === 'password' }"
            >
                <img src="@img/email-login-lock.svg" alt="" class="email-login-field-icon" />
                <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    name="password"
                    autocomplete="current-password"
                    :placeholder="$t('密码')"
                    :aria-label="$t('密码')"
                    @focus="activeField = 'password'"
                    @blur="activeField = ''"
                />
                <button
                    type="button"
                    class="email-login-password-toggle df-aic-jucen"
                    :aria-label="$t('显示或隐藏密码')"
                    :aria-pressed="showPassword"
                    @click="showPassword = !showPassword"
                >
                    <img src="@img/email-login-eye.svg" alt="" />
                </button>
            </label>

            <button type="button" class="email-login-forgot df-aic" @click="goForgotPassword">
                <span>{{ $t('忘记密码') }}</span>
                <img src="@img/email-login-arrow.svg" alt="" />
            </button>

            <button type="submit" class="email-login-submit" :disabled="isSubmitting">
                {{ $t('登录') }}
            </button>
        </form>

        <!-- 模块四：注册入口。 -->
        <div class="email-login-register">
            <span>{{ $t('没有账号？') }}</span>
            <button type="button" @click="goRegister">{{ $t('前往注册') }}</button>
        </div>

        <!-- 模块五：其他登录方式，进入项目已有的钱包地址签名登录。 -->
        <div class="email-login-other-title df-aic-jucen">
            <span class="email-login-other-line email-login-other-line-left"></span>
            <span>{{ $t('其他登录方式') }}</span>
            <span class="email-login-other-line email-login-other-line-right"></span>
        </div>

        <button type="button" class="email-login-wallet" @click="goWalletLogin">
            <img src="@img/email-login-wallet.svg" alt="" />
            <span>{{ $t('地址') }}</span>
        </button>
    </div>
</template>

<script>
export default {
    name: 'EmailLogin',
    data() {
        return {
            email: '',
            password: '',
            activeField: 'email',
            showPassword: false,
            isSubmitting: false,
        }
    },
    mounted() {
        localStorage.removeItem('token')
        localStorage.removeItem('address')
        this.$store.commit('setAddress', '')
        this.saveReferrer()
    },
    methods: {
        saveReferrer() {
            const ref = this.$route.query.ref
            if (ref) localStorage.setItem('ref', ref)
        },
        validateForm() {
            if (!this.email) {
                this.$toast(this.$t('请输入邮箱'))
                return false
            }
            if (!/^\S+@\S+\.\S+$/.test(this.email)) {
                this.$toast(this.$t('请输入有效邮箱'))
                return false
            }
            if (!this.password) {
                this.$toast(this.$t('请输入密码'))
                return false
            }
            return true
        },
        async submitEmailLogin() {
            if (this.isSubmitting || !this.validateForm()) return
            this.isSubmitting = true
            try {
                const res = await this.$http.post('/api/auth/email_login', {
                    email: this.email,
                    password: this.password,
                })
                if (res.code == 200 && res.data && res.data.token) {
                    localStorage.setItem('token', res.data.token)
                    const redirect = this.$route.query.redirect
                    this.$router.replace(redirect && redirect !== '/' ? redirect : '/index')
                    return
                }
                this.$toast(this.$t('登录失败'))
            } catch (err) {
                console.log('邮箱登录失败', err)
                this.$toast(this.$t('登录失败'))
            } finally {
                this.isSubmitting = false
            }
        },
        goForgotPassword() {
            this.$router.push({ name: 'forgotPassword' })
        },
        goRegister() {
            this.$router.push({
                name: 'register',
                query: this.$route.query.ref ? { ref: this.$route.query.ref } : {},
            })
        },
        goWalletLogin() {
            this.$router.push({
                name: 'walletLogin',
                query: this.$route.query.ref ? { ref: this.$route.query.ref } : {},
            })
        },
    },
}
</script>

<style scoped lang="less">
.email-login-page {
    position: relative;
    width: 750px;
    height: 1624px;
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

    .email-login-background {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: bottom;
        pointer-events: none;
    }

    .email-login-brand {
        position: absolute;
        top: 200px;
        left: 295px;
        display: flex;
        width: 160px;
        height: 184px;
        flex-direction: column;
        align-items: center;
        gap: 24px;

        .email-login-brand-symbol {
            display: block;
            width: 118px;
            height: 118px;
            flex: none;
            background: #FFFFFF;
            -webkit-mask: url('~@img/email-login-logo-symbol.png') center / contain no-repeat;
            mask: url('~@img/email-login-logo-symbol.png') center / contain no-repeat;
        }

        .email-login-brand-wordmark {
            display: block;
            width: 160px;
            height: 42px;
            flex: none;
            background: #FFFFFF;
            -webkit-mask: url('~@img/email-login-logo-wordmark.png') center / contain no-repeat;
            mask: url('~@img/email-login-logo-wordmark.png') center / contain no-repeat;
        }
    }

    .email-login-form {
        position: absolute;
        inset: 0;

        .email-login-field {
            position: absolute;
            left: 60px;
            display: flex;
            width: 630px;
            height: 92px;
            align-items: center;
            padding: 0 24px;
            overflow: hidden;
            border: 2px solid transparent;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);

            &:first-of-type {
                top: 464px;
            }

            &:nth-of-type(2) {
                top: 580px;
            }

            &.active {
                border-color: #1261F3;
                box-shadow: 0 4px 20px rgba(0, 140, 255, 0.20);
            }

            .email-login-field-icon {
                width: 44px;
                height: 44px;
                flex: none;
            }

            input {
                min-width: 0;
                height: 88px;
                margin-left: 20px;
                padding: 0;
                border: 0;
                background: transparent;
                color: #FFFFFF;
                font-size: 28px;
                font-weight: 400;
                line-height: normal;
                caret-color: #4C91FF;

                &::placeholder {
                    color: rgba(184, 195, 212, 0.50);
                    opacity: 1;
                }
            }

            .email-login-password-toggle {
                width: 40px;
                height: 92px;
                margin-left: 8px;
                flex: none;

                img {
                    width: 32px;
                    height: 32px;
                }
            }
        }

        .email-login-forgot {
            position: absolute;
            top: 688px;
            right: 60px;
            height: 34px;
            gap: 8px;
            color: #4C91FF;
            font-size: 24px;
            line-height: 34px;

            img {
                width: 24px;
                height: 24px;
            }
        }

        .email-login-submit {
            position: absolute;
            top: 782px;
            left: 60px;
            width: 630px;
            height: 88px;
            border-radius: 999px;
            background: #1261F3;
            color: #FFFFFF;
            font-size: 32px;
            font-weight: 500;
            line-height: 88px;
            text-align: center;

            &:active {
                transform: scale(0.98);
            }

            &:disabled {
                opacity: 0.65;
            }
        }
    }

    .email-login-register {
        position: absolute;
        top: 900px;
        left: 0;
        width: 750px;
        color: rgba(184, 195, 212, 0.50);
        font-size: 24px;
        line-height: 34px;
        text-align: center;

        button {
            color: #FF2D2D;
        }
    }

    .email-login-other-title {
        position: absolute;
        top: 1009px;
        left: 167px;
        gap: 16px;
        color: rgba(184, 195, 212, 0.50);
        font-size: 24px;
        line-height: 34px;
        white-space: nowrap;

        .email-login-other-line {
            width: 120px;
            height: 1px;
            flex: none;

            &.email-login-other-line-left {
                background: linear-gradient(90deg, rgba(95, 101, 116, 0) 0%, #5F6574 100%);
            }

            &.email-login-other-line-right {
                background: linear-gradient(90deg, #5F6574 0%, rgba(95, 101, 116, 0) 100%);
            }
        }
    }

    .email-login-wallet {
        position: absolute;
        top: 1078px;
        left: 311px;
        display: flex;
        width: 128px;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        color: #B8C3D4;
        font-size: 28px;
        line-height: 40px;

        img {
            width: 88px;
            height: 88px;
        }
    }
}
</style>

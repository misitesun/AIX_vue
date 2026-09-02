<template>
    <div class="register-page">
        <!-- 模块一：复用邮箱登录页同源的 Figma 高清背景与品牌蒙版。 -->
        <img src="@img/email-login-bg.png" alt="" class="register-background" />
        <div class="register-brand" aria-label="AIX-Quant">
            <span class="register-brand-symbol"></span>
            <span class="register-brand-wordmark"></span>
        </div>

        <!-- 模块二：注册表单。系统状态栏由宿主环境提供，表单坐标已按设计稿上移 40px。 -->
        <form class="register-form" @submit.prevent="submitRegister">
            <label class="register-field register-field-email" :class="{ active: activeField === 'email' }">
                <img src="@img/email-login-mail.svg" alt="" class="register-field-icon" />
                <input
                    v-model.trim="form.email"
                    type="email"
                    name="email"
                    autocomplete="email"
                    :placeholder="$t('邮箱')"
                    :aria-label="$t('邮箱')"
                    @focus="activeField = 'email'"
                    @blur="activeField = ''"
                />
            </label>

            <label class="register-field register-field-code" :class="{ active: activeField === 'code' }">
                <img src="@img/register-code.svg" alt="" class="register-field-icon" />
                <input
                    v-model.trim="form.code"
                    type="text"
                    name="code"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    :placeholder="$t('验证码')"
                    :aria-label="$t('验证码')"
                    @focus="activeField = 'code'"
                    @blur="activeField = ''"
                />
                <button
                    type="button"
                    class="register-send-code"
                    :disabled="isSendingCode || codeCountdown > 0"
                    @click="sendVerificationCode"
                >
                    {{ sendCodeText }}
                </button>
            </label>

            <label
                class="register-field register-field-login-password"
                :class="{ active: activeField === 'loginPassword' }"
            >
                <img src="@img/email-login-lock.svg" alt="" class="register-field-icon" />
                <input
                    v-model="form.loginPassword"
                    :type="showLoginPassword ? 'text' : 'password'"
                    name="password"
                    autocomplete="new-password"
                    :placeholder="$t('登录密码')"
                    :aria-label="$t('登录密码')"
                    @focus="activeField = 'loginPassword'"
                    @blur="activeField = ''"
                />
                <button
                    type="button"
                    class="register-password-toggle df-aic-jucen"
                    :aria-label="$t('显示或隐藏登录密码')"
                    :aria-pressed="showLoginPassword"
                    @click="showLoginPassword = !showLoginPassword"
                >
                    <img
                        :src="showLoginPassword ? eyeHidden : eyeVisible"
                        alt=""
                    />
                </button>
            </label>

            <label
                class="register-field register-field-pay-password"
                :class="{ active: activeField === 'payPassword' }"
            >
                <img src="@img/email-login-lock.svg" alt="" class="register-field-icon" />
                <input
                    v-model="form.payPassword"
                    :type="showPayPassword ? 'text' : 'password'"
                    name="pay_password"
                    inputmode="numeric"
                    autocomplete="new-password"
                    :placeholder="$t('支付密码')"
                    :aria-label="$t('支付密码')"
                    @focus="activeField = 'payPassword'"
                    @blur="activeField = ''"
                />
                <button
                    type="button"
                    class="register-password-toggle df-aic-jucen"
                    :aria-label="$t('显示或隐藏支付密码')"
                    :aria-pressed="showPayPassword"
                    @click="showPayPassword = !showPayPassword"
                >
                    <img
                        :src="showPayPassword ? eyeVisible : eyeHidden"
                        alt=""
                    />
                </button>
            </label>

            <label class="register-field register-field-invite" :class="{ active: activeField === 'inviteCode' }">
                <img src="@img/register-invite.svg" alt="" class="register-field-icon" />
                <input
                    v-model.trim="form.inviteCode"
                    type="text"
                    name="invite_code"
                    autocomplete="off"
                    :placeholder="$t('邀请码')"
                    :aria-label="$t('邀请码')"
                    @focus="activeField = 'inviteCode'"
                    @blur="activeField = ''"
                />
            </label>

            <button type="submit" class="register-submit" :disabled="isSubmitting">
                {{ $t('注册') }}
            </button>
        </form>

        <!-- 模块三：返回邮箱登录。 -->
        <div class="register-login-link">
            <span>{{ $t('已有账号？') }}</span>
            <button type="button" @click="goEmailLogin">{{ $t('前往登录') }}</button>
        </div>
    </div>
</template>

<script>
import eyeVisible from '@img/register-eye-visible.svg'
import eyeHidden from '@img/register-eye-hidden.svg'

export default {
    name: 'Register',
    data() {
        return {
            form: {
                email: '',
                code: '',
                loginPassword: '',
                payPassword: '',
                inviteCode: '',
            },
            activeField: 'email',
            showLoginPassword: false,
            showPayPassword: false,
            isSendingCode: false,
            isSubmitting: false,
            codeCountdown: 0,
            codeTimer: null,
            eyeVisible,
            eyeHidden,
        }
    },
    computed: {
        sendCodeText() {
            if (this.isSendingCode) return this.$t('发送中')
            if (this.codeCountdown > 0) return `${this.codeCountdown}s`
            return this.$t('发送验证码')
        },
    },
    mounted() {
        this.form.inviteCode = this.$route.query.ref || localStorage.getItem('ref') || ''
    },
    beforeDestroy() {
        if (this.codeTimer) clearInterval(this.codeTimer)
    },
    methods: {
        isValidEmail() {
            return /^\S+@\S+\.\S+$/.test(this.form.email)
        },
        async sendVerificationCode() {
            if (this.isSendingCode || this.codeCountdown > 0) return
            if (!this.form.email) {
                this.$toast(this.$t('请输入邮箱'))
                return
            }
            if (!this.isValidEmail()) {
                this.$toast(this.$t('请输入有效邮箱'))
                return
            }

            this.isSendingCode = true
            try {
                const res = await this.$http.post('/api/email_code', {
                    email: this.form.email,
                    type: 1,
                })
                if (res.code == 200) {
                    this.$messageTip.success(this.$t('验证码已发送'))
                    this.startCodeCountdown()
                    return
                }
                this.$toast(this.$t('发送验证码失败'))
            } catch (err) {
                console.log('发送注册验证码失败', err)
                this.$toast(this.$t('发送验证码失败'))
            } finally {
                this.isSendingCode = false
            }
        },
        startCodeCountdown() {
            this.codeCountdown = 60
            if (this.codeTimer) clearInterval(this.codeTimer)
            this.codeTimer = setInterval(() => {
                this.codeCountdown -= 1
                if (this.codeCountdown <= 0) {
                    clearInterval(this.codeTimer)
                    this.codeTimer = null
                }
            }, 1000)
        },
        validateForm() {
            if (!this.form.email) return this.showValidation('请输入邮箱')
            if (!this.isValidEmail()) return this.showValidation('请输入有效邮箱')
            if (!/^\d{6}$/.test(this.form.code)) return this.showValidation('请输入6位验证码')
            if (this.form.loginPassword.length < 6 || this.form.loginPassword.length > 32) {
                return this.showValidation('登录密码长度为6至32位')
            }
            if (!/^\d{6}$/.test(this.form.payPassword)) return this.showValidation('支付密码必须为6位数字')
            return true
        },
        showValidation(message) {
            this.$toast(this.$t(message))
            return false
        },
        async submitRegister() {
            if (this.isSubmitting || !this.validateForm()) return
            this.isSubmitting = true
            try {
                const res = await this.$http.post('/api/auth/register', {
                    email: this.form.email,
                    email_code: this.form.code,
                    password: this.form.loginPassword,
                    pay_password: this.form.payPassword,
                    ref: this.form.inviteCode || null,
                })
                if (res.code == 200) {
                    this.$messageTip.success(this.$t('注册成功'))
                    if (res.data && res.data.token) {
                        localStorage.setItem('token', res.data.token)
                        this.$router.replace('/index')
                    } else {
                        this.goEmailLogin()
                    }
                    return
                }
                this.$toast(this.$t('注册失败'))
            } catch (err) {
                console.log('邮箱注册失败', err)
                this.$toast(this.$t('注册失败'))
            } finally {
                this.isSubmitting = false
            }
        },
        goEmailLogin() {
            this.$router.replace({
                path: '/',
                query: this.form.inviteCode ? { ref: this.form.inviteCode } : {},
            })
        },
    },
}
</script>

<style scoped lang="less">
.register-page {
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

    .register-background {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: bottom;
        pointer-events: none;
    }

    .register-brand {
        position: absolute;
        top: 200px;
        left: 295px;
        display: flex;
        width: 160px;
        height: 184px;
        flex-direction: column;
        align-items: center;
        gap: 24px;

        .register-brand-symbol {
            display: block;
            width: 118px;
            height: 118px;
            flex: none;
            background: #FFFFFF;
            -webkit-mask: url('~@img/email-login-logo-symbol.png') center / contain no-repeat;
            mask: url('~@img/email-login-logo-symbol.png') center / contain no-repeat;
        }

        .register-brand-wordmark {
            display: block;
            width: 160px;
            height: 42px;
            flex: none;
            background: #FFFFFF;
            -webkit-mask: url('~@img/email-login-logo-wordmark.png') center / contain no-repeat;
            mask: url('~@img/email-login-logo-wordmark.png') center / contain no-repeat;
        }
    }

    .register-form {
        position: absolute;
        inset: 0;

        .register-field {
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

            &.register-field-email { top: 464px; }
            &.register-field-code { top: 580px; }
            &.register-field-login-password { top: 696px; }
            &.register-field-pay-password { top: 812px; }
            &.register-field-invite { top: 928px; }

            &.active {
                border-color: #1261F3;
                box-shadow: 0 4px 20px rgba(0, 140, 255, 0.20);
            }

            .register-field-icon {
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

            .register-send-code {
                height: 88px;
                margin-left: 12px;
                flex: none;
                color: #FFFFFF;
                font-size: 24px;
                line-height: 88px;
                white-space: nowrap;

                &:disabled {
                    opacity: 0.60;
                }
            }

            .register-password-toggle {
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

        .register-submit {
            position: absolute;
            top: 1080px;
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

    .register-login-link {
        position: absolute;
        top: 1198px;
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
}
</style>

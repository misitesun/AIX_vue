<template>
    <div class="forgot-password-page">
        <div class="forgot-password-stage">
        <!-- 模块一：复用注册页的 Figma 高清背景与品牌蒙版。 -->
        <img src="@img/email-login-bg.png" alt="" class="forgot-password-background" />
        <div class="forgot-password-brand" aria-label="AIX-Quant">
            <span class="forgot-password-brand-symbol"></span>
            <span class="forgot-password-brand-wordmark"></span>
        </div>

        <!-- 模块二：通过邮箱验证码重置登录密码。 -->
        <form class="forgot-password-form" @submit.prevent="submitResetPassword">
            <label
                class="forgot-password-field forgot-password-field-email"
                :class="{ active: activeField === 'email' }"
            >
                <img src="@img/email-login-mail.svg" alt="" class="forgot-password-field-icon" />
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

            <label
                class="forgot-password-field forgot-password-field-code"
                :class="{ active: activeField === 'code' }"
            >
                <img src="@img/register-code.svg" alt="" class="forgot-password-field-icon" />
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
                    class="forgot-password-send-code"
                    :disabled="isSendingCode || codeCountdown > 0"
                    @click="sendVerificationCode"
                >
                    {{ sendCodeText }}
                </button>
            </label>

            <label
                class="forgot-password-field forgot-password-field-new"
                :class="{ active: activeField === 'newPassword' }"
            >
                <img src="@img/email-login-lock.svg" alt="" class="forgot-password-field-icon" />
                <input
                    v-model="form.newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    name="new_password"
                    autocomplete="new-password"
                    :placeholder="$t('新登录密码')"
                    :aria-label="$t('新登录密码')"
                    @focus="activeField = 'newPassword'"
                    @blur="activeField = ''"
                />
                <button
                    type="button"
                    class="forgot-password-toggle df-aic-jucen"
                    :aria-label="$t('显示或隐藏新登录密码')"
                    :aria-pressed="showNewPassword"
                    @click="showNewPassword = !showNewPassword"
                >
                    <img :src="showNewPassword ? eyeHidden : eyeVisible" alt="" />
                </button>
            </label>

            <label
                class="forgot-password-field forgot-password-field-confirm"
                :class="{ active: activeField === 'confirmPassword' }"
            >
                <img src="@img/email-login-lock.svg" alt="" class="forgot-password-field-icon" />
                <input
                    v-model="form.confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    name="confirm_password"
                    autocomplete="new-password"
                    :placeholder="$t('确认登录密码')"
                    :aria-label="$t('确认登录密码')"
                    @focus="activeField = 'confirmPassword'"
                    @blur="activeField = ''"
                />
                <button
                    type="button"
                    class="forgot-password-toggle df-aic-jucen"
                    :aria-label="$t('显示或隐藏确认密码')"
                    :aria-pressed="showConfirmPassword"
                    @click="showConfirmPassword = !showConfirmPassword"
                >
                    <img :src="showConfirmPassword ? eyeHidden : eyeVisible" alt="" />
                </button>
            </label>

            <button type="submit" class="forgot-password-submit" :disabled="isSubmitting">
                {{ $t('重置密码') }}
            </button>
        </form>

        <!-- 模块三：返回邮箱登录。 -->
        <div class="forgot-password-login-link">
            <span>{{ $t('想起密码？') }}</span>
            <button type="button" @click="goEmailLogin">{{ $t('前往登录') }}</button>
        </div>
        </div>
    </div>
</template>

<script>
import eyeVisible from '@img/register-eye-visible.svg'
import eyeHidden from '@img/register-eye-hidden.svg'

export default {
    name: 'ForgotPassword',
    data() {
        return {
            form: {
                email: '',
                code: '',
                newPassword: '',
                confirmPassword: '',
            },
            activeField: 'email',
            showNewPassword: false,
            showConfirmPassword: false,
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
    beforeDestroy() {
        if (this.codeTimer) clearInterval(this.codeTimer)
    },
    methods: {
        isValidEmail() {
            return /^\S+@\S+\.\S+$/.test(this.form.email)
        },
        async sendVerificationCode() {
            if (this.isSendingCode || this.codeCountdown > 0) return
            if (!this.form.email) return this.showValidation('请输入邮箱')
            if (!this.isValidEmail()) return this.showValidation('请输入有效邮箱')

            this.isSendingCode = true
            try {
                const res = await this.$http.post('/api/email_code', {
                    email: this.form.email,
                    type: 3,
                })
                if (res.code == 200) {
                    this.$messageTip.success(this.$t('验证码已发送'))
                    this.startCodeCountdown()
                    return
                }
            } catch (err) {
                console.log('发送重置密码验证码失败', err)
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
            if (!this.form.newPassword) return this.showValidation('请输入新登录密码')
            if (this.form.newPassword.length < 6 || this.form.newPassword.length > 32) {
                return this.showValidation('登录密码长度为6至32位')
            }
            if (!this.form.confirmPassword) return this.showValidation('请确认登录密码')
            if (this.form.newPassword !== this.form.confirmPassword) {
                return this.showValidation('两次输入的密码不一致')
            }
            return true
        },
        showValidation(message) {
            this.$toast(this.$t(message))
            return false
        },
        async submitResetPassword() {
            if (this.isSubmitting || !this.validateForm()) return
            this.isSubmitting = true
            try {
                const res = await this.$http.post('/api/auth/forget_password', {
                    email: this.form.email,
                    password: this.form.newPassword,
                    email_code: this.form.code,
                })
                if (res.code == 200) {
                    this.$messageTip.success(this.$t('密码重置成功'))
                    this.goEmailLogin()
                    return
                }
            } catch (err) {
                console.log('重置登录密码失败', err)
            } finally {
                this.isSubmitting = false
            }
        },
        goEmailLogin() {
            const query = {}
            if (this.$route.query.ref) query.ref = this.$route.query.ref
            const redirect = String(this.$route.query.redirect || '')
            if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
                query.redirect = redirect
            }
            this.$router.replace({ name: 'login', query })
        },
    },
}
</script>

<style scoped lang="less">
.forgot-password-page {
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

    .forgot-password-stage {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 1624px;
    }

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

    .forgot-password-background {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: bottom;
        pointer-events: none;
    }

    .forgot-password-brand {
        position: absolute;
        top: 200px;
        left: 295px;
        display: flex;
        width: 160px;
        height: 184px;
        flex-direction: column;
        align-items: center;
        gap: 24px;

        .forgot-password-brand-symbol {
            display: block;
            width: 118px;
            height: 118px;
            flex: none;
            background: #FFFFFF;
            -webkit-mask: url('~@img/email-login-logo-symbol.png') center / contain no-repeat;
            mask: url('~@img/email-login-logo-symbol.png') center / contain no-repeat;
        }

        .forgot-password-brand-wordmark {
            display: block;
            width: 160px;
            height: 42px;
            flex: none;
            background: #FFFFFF;
            -webkit-mask: url('~@img/email-login-logo-wordmark.png') center / contain no-repeat;
            mask: url('~@img/email-login-logo-wordmark.png') center / contain no-repeat;
        }
    }

    .forgot-password-form {
        position: absolute;
        inset: 0;

        .forgot-password-field {
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

            &.forgot-password-field-email { top: 464px; }
            &.forgot-password-field-code { top: 580px; }
            &.forgot-password-field-new { top: 696px; }
            &.forgot-password-field-confirm { top: 812px; }

            &.active {
                border-color: #1261F3;
                box-shadow: 0 4px 20px rgba(0, 140, 255, 0.20);
            }

            .forgot-password-field-icon {
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

            .forgot-password-send-code {
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

            .forgot-password-toggle {
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

        .forgot-password-submit {
            position: absolute;
            top: 964px;
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

    .forgot-password-login-link {
        position: absolute;
        top: 1082px;
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

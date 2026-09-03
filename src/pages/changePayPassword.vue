<template>
    <div class="change-pay-password-page">
        <!-- 公共模块：设置子页统一使用固定顶部导航。 -->
        <van-nav-bar
            :title="$t('修改支付密码')"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
        >
            <template #left>
                <span class="change-pay-password-back df-aic-jucen">
                    <van-icon name="arrow-left" size="20" color="#fff" />
                </span>
            </template>
        </van-nav-bar>

        <main class="change-pay-password-content">
            <!-- 模块一：通过账号绑定邮箱验证后修改六位支付密码。 -->
            <section class="change-pay-password-card">
                <h1>{{ $t('支付密码') }}</h1>

                <form class="change-pay-password-form" @submit.prevent="submitChangePassword">
                    <label class="change-pay-password-field common-input-focus">
                        <img src="@img/email-login-mail.svg" alt="" />
                        <input
                            v-model.trim="form.email"
                            type="email"
                            autocomplete="email"
                            :placeholder="$t('邮箱')"
                            :aria-label="$t('邮箱')"
                        />
                    </label>

                    <div class="change-pay-password-field change-pay-password-code common-input-focus">
                        <img src="@img/register-code.svg" alt="" />
                        <input
                            v-model="form.code"
                            type="text"
                            inputmode="numeric"
                            autocomplete="one-time-code"
                            maxlength="6"
                            :placeholder="$t('验证码')"
                            :aria-label="$t('验证码')"
                            @input="normalizeCode"
                        />
                        <button
                            type="button"
                            :disabled="isSendingCode || codeCountdown > 0"
                            @click="sendVerificationCode"
                        >
                            {{ sendCodeText }}
                        </button>
                    </div>

                    <div class="change-pay-password-field common-input-focus">
                        <img src="@img/email-login-lock.svg" alt="" />
                        <input
                            v-model="form.newPassword"
                            :type="showNewPassword ? 'text' : 'password'"
                            inputmode="numeric"
                            autocomplete="new-password"
                            maxlength="6"
                            :placeholder="$t('新支付密码')"
                            :aria-label="$t('新支付密码')"
                            @input="normalizeNewPassword"
                        />
                        <button
                            type="button"
                            class="change-pay-password-eye df-aic-jucen"
                            :aria-label="$t('显示或隐藏新支付密码')"
                            :aria-pressed="showNewPassword"
                            @click="showNewPassword = !showNewPassword"
                        >
                            <img :src="showNewPassword ? eyeHidden : eyeVisible" alt="" />
                        </button>
                    </div>

                    <div class="change-pay-password-field common-input-focus">
                        <img src="@img/email-login-lock.svg" alt="" />
                        <input
                            v-model="form.confirmPassword"
                            :type="showConfirmPassword ? 'text' : 'password'"
                            inputmode="numeric"
                            autocomplete="new-password"
                            maxlength="6"
                            :placeholder="$t('确认支付密码')"
                            :aria-label="$t('确认支付密码')"
                            @input="normalizeConfirmPassword"
                        />
                        <button
                            type="button"
                            class="change-pay-password-eye df-aic-jucen"
                            :aria-label="$t('显示或隐藏确认密码')"
                            :aria-pressed="showConfirmPassword"
                            @click="showConfirmPassword = !showConfirmPassword"
                        >
                            <img :src="showConfirmPassword ? eyeHidden : eyeVisible" alt="" />
                        </button>
                    </div>

                    <button type="submit" class="change-pay-password-submit" :disabled="isSubmitting">
                        {{ $t('修改支付密码') }}
                    </button>
                </form>
            </section>
        </main>
    </div>
</template>

<script>
import eyeVisible from '@img/register-eye-visible.svg'
import eyeHidden from '@img/register-eye-hidden.svg'

export default {
    name: 'ChangePayPassword',
    data() {
        return {
            form: {
                email: '',
                code: '',
                newPassword: '',
                confirmPassword: '',
            },
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
    mounted() {
        this.loadAccountEmail()
    },
    beforeDestroy() {
        if (this.codeTimer) clearInterval(this.codeTimer)
    },
    methods: {
        async loadAccountEmail() {
            try {
                const res = await this.$http.get('/api/users/my')
                if (res.code == 200 && res.data) {
                    this.form.email = res.data.email || res.data.memail || ''
                }
            } catch (error) {
                console.log('获取当前账户邮箱失败', error)
            }
        },
        isValidEmail() {
            return /^\S+@\S+\.\S+$/.test(this.form.email)
        },
        normalizeCode(event) {
            this.form.code = this.normalizeSixDigitValue(event.target.value)
        },
        normalizeNewPassword(event) {
            this.form.newPassword = this.normalizeSixDigitValue(event.target.value)
        },
        normalizeConfirmPassword(event) {
            this.form.confirmPassword = this.normalizeSixDigitValue(event.target.value)
        },
        normalizeSixDigitValue(value) {
            return String(value || '').replace(/\D/g, '').slice(0, 6)
        },
        async sendVerificationCode() {
            if (this.isSendingCode || this.codeCountdown > 0) return
            if (!this.form.email) return this.showValidation('请输入邮箱')
            if (!this.isValidEmail()) return this.showValidation('请输入有效邮箱')

            this.isSendingCode = true
            try {
                const res = await this.$http.post('/api/email_code', {
                    email: this.form.email,
                    type: 4,
                })
                if (res.code == 200) {
                    this.$messageTip.success(this.$t('验证码已发送'))
                    this.startCodeCountdown()
                    return
                }
            } catch (error) {
                console.log('发送修改支付密码验证码失败', error)
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
            if (!/^\d{6}$/.test(this.form.newPassword)) {
                return this.showValidation('支付密码必须为6位数字')
            }
            if (!this.form.confirmPassword) return this.showValidation('请确认支付密码')
            if (this.form.newPassword !== this.form.confirmPassword) {
                return this.showValidation('两次输入的密码不一致')
            }
            return true
        },
        showValidation(message) {
            this.$toast(this.$t(message))
            return false
        },
        async submitChangePassword() {
            if (this.isSubmitting || !this.validateForm()) return

            this.isSubmitting = true
            try {
                const res = await this.$http.post('/api/users/my/pay_password', {
                    email_code: this.form.code,
                    pay_password: this.form.newPassword,
                })
                if (res.code == 200) {
                    this.$messageTip.success(this.$t('支付密码修改成功'))
                    this.form.code = ''
                    this.form.newPassword = ''
                    this.form.confirmPassword = ''
                    this.$router.replace({ name: 'settings' })
                    return
                }
            } catch (error) {
                console.log('修改支付密码失败', error)
            } finally {
                this.isSubmitting = false
            }
        },
    },
}
</script>

<style scoped lang="less">
.change-pay-password-page {
    position: relative;
    width: 750px;
    min-height: 100vh;
    margin: 0 auto;
    overflow-x: hidden;
    background: #000308;
    color: #FFFFFF;

    button,
    input {
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

    /deep/ .van-nav-bar__placeholder,
    /deep/ .van-nav-bar,
    /deep/ .van-nav-bar__content {
        height: 88px;
    }

    /deep/ .van-nav-bar {
        background: rgba(0, 0, 0, 0.60) !important;

        .van-nav-bar__title {
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

    .change-pay-password-back {
        width: 48px;
        height: 48px;
    }

    .change-pay-password-content {
        width: 750px;
        padding: 60px 30px 120px;

        .change-pay-password-card {
            width: 690px;
            padding: 36px 30px 40px;
            border: 1px solid rgba(141, 194, 255, 0.26);
            border-radius: 28px;
            background: rgba(255, 255, 255, 0.10);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);

            h1 {
                margin: 0 0 34px;
                color: #FFFFFF;
                font-size: 32px;
                font-weight: 600;
                line-height: 45px;
            }

            .change-pay-password-form {
                display: flex;
                flex-direction: column;
                gap: 24px;

                .change-pay-password-field {
                    display: flex;
                    width: 630px;
                    height: 96px;
                    align-items: center;
                    padding: 0 24px;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.08);

                    > img {
                        display: block;
                        width: 40px;
                        height: 40px;
                        flex: none;
                    }

                    input {
                        min-width: 0;
                        height: 92px;
                        margin-left: 20px;
                        flex: 1;
                        color: #FFFFFF;
                        font-size: 28px;

                        &::placeholder {
                            color: rgba(184, 195, 212, 0.50);
                            opacity: 1;
                        }
                    }

                    &.change-pay-password-code {
                        button {
                            height: 92px;
                            margin-left: 12px;
                            flex: none;
                            color: #4C91FF;
                            font-size: 24px;
                            line-height: 92px;
                            white-space: nowrap;

                            &:disabled {
                                opacity: 0.60;
                            }
                        }
                    }

                    .change-pay-password-eye {
                        width: 40px;
                        height: 92px;
                        margin-left: 8px;
                        flex: none;

                        img {
                            display: block;
                            width: 32px;
                            height: 32px;
                        }
                    }
                }

                .change-pay-password-submit {
                    width: 630px;
                    height: 88px;
                    margin-top: 16px;
                    border-radius: 999px;
                    background: #1261F3;
                    box-shadow: 0 10px 24px rgba(18, 97, 243, 0.28);
                    color: #FFFFFF;
                    font-size: 30px;
                    font-weight: 500;
                    line-height: 88px;

                    &:active {
                        transform: scale(0.98);
                    }

                    &:disabled {
                        opacity: 0.65;
                    }
                }
            }
        }
    }
}
</style>

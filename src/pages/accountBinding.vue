<template>
    <div class="account-binding-page">
        <!-- 公共模块：账号绑定子页沿用设置中心的固定导航。 -->
        <van-nav-bar
            :title="pageTitle"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
        >
            <template #left>
                <span class="account-binding-back df-aic-jucen">
                    <van-icon name="arrow-left" size="20" color="#fff" />
                </span>
            </template>
        </van-nav-bar>

        <main class="account-binding-content">
            <!-- 模块一：邮件或钱包地址绑定表单，沿用修改登录密码页的输入与按钮效果。 -->
            <section class="account-binding-card">
                <h1>{{ pageTitle }}</h1>

                <form class="account-binding-form" @submit.prevent="submitBinding">
                    <!-- 钱包账户绑定邮箱：输入目标邮箱、验证码和当前登录密码。 -->
                    <label
                        v-if="isEmailBinding"
                        class="account-binding-field common-input-focus"
                    >
                        <img src="@img/email-login-mail.svg" alt="" />
                        <input
                            v-model.trim="form.email"
                            type="email"
                            autocomplete="email"
                            :placeholder="$t('邮箱')"
                            :aria-label="$t('邮箱')"
                        />
                    </label>

                    <!-- 邮箱账户绑定钱包：验证码发送至当前已绑定邮箱。 -->
                    <label
                        v-else
                        class="account-binding-field account-binding-readonly"
                    >
                        <img src="@img/email-login-mail.svg" alt="" />
                        <input
                            :value="form.email"
                            type="email"
                            readonly
                            aria-readonly="true"
                            :placeholder="$t('邮箱')"
                            :aria-label="$t('邮箱')"
                        />
                    </label>

                    <label
                        v-if="!isEmailBinding"
                        class="account-binding-field common-input-focus"
                    >
                        <img src="@img/email-login-wallet.svg" alt="" />
                        <input
                            v-model.trim="form.address"
                            type="text"
                            inputmode="text"
                            autocomplete="off"
                            autocapitalize="none"
                            spellcheck="false"
                            :placeholder="$t('钱包地址')"
                            :aria-label="$t('钱包地址')"
                        />
                    </label>

                    <div class="account-binding-field account-binding-code common-input-focus">
                        <img src="@img/register-code.svg" alt="" />
                        <input
                            v-model.trim="form.emailCode"
                            type="text"
                            inputmode="numeric"
                            autocomplete="one-time-code"
                            maxlength="6"
                            :placeholder="$t('验证码')"
                            :aria-label="$t('验证码')"
                            @input="normalizeNumber('emailCode', $event)"
                        />
                        <button
                            type="button"
                            :disabled="isSendingCode || codeCountdown > 0"
                            @click="sendVerificationCode"
                        >
                            {{ sendCodeText }}
                        </button>
                    </div>

                    <div
                        v-if="isEmailBinding"
                        class="account-binding-field common-input-focus"
                    >
                        <img src="@img/email-login-lock.svg" alt="" />
                        <input
                            v-model="form.password"
                            :type="showPassword ? 'text' : 'password'"
                            autocomplete="current-password"
                            :placeholder="$t('登录密码')"
                            :aria-label="$t('登录密码')"
                        />
                        <button
                            type="button"
                            class="account-binding-eye df-aic-jucen"
                            :aria-label="$t('显示或隐藏密码')"
                            :aria-pressed="showPassword"
                            @click="showPassword = !showPassword"
                        >
                            <img :src="showPassword ? eyeHidden : eyeVisible" alt="" />
                        </button>
                    </div>

                    <label
                        v-else
                        class="account-binding-field common-input-focus"
                    >
                        <img src="@img/register-code.svg" alt="" />
                        <input
                            v-model.trim="form.googleCode"
                            type="text"
                            inputmode="numeric"
                            autocomplete="one-time-code"
                            maxlength="6"
                            :placeholder="$t('谷歌验证码')"
                            :aria-label="$t('谷歌验证码')"
                            @input="normalizeNumber('googleCode', $event)"
                        />
                    </label>

                    <button type="submit" class="account-binding-submit" :disabled="isSubmitting">
                        {{ pageTitle }}
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
    name: 'AccountBinding',
    props: {
        bindingType: {
            type: String,
            default: 'email',
        },
    },
    data() {
        return {
            form: {
                email: '',
                address: '',
                emailCode: '',
                googleCode: '',
                password: '',
            },
            showPassword: false,
            isSendingCode: false,
            isSubmitting: false,
            codeCountdown: 0,
            codeTimer: null,
            eyeVisible,
            eyeHidden,
        }
    },
    computed: {
        isEmailBinding() {
            return this.bindingType === 'email'
        },
        pageTitle() {
            return this.$t(this.isEmailBinding ? '绑定邮箱' : '绑定钱包地址')
        },
        sendCodeText() {
            if (this.isSendingCode) return this.$t('发送中')
            if (this.codeCountdown > 0) return String(this.codeCountdown) + 's'
            return this.$t('发送验证码')
        },
    },
    mounted() {
        this.loadAccountInfo()
    },
    beforeDestroy() {
        if (this.codeTimer) clearInterval(this.codeTimer)
    },
    methods: {
        async loadAccountInfo() {
            try {
                const res = await this.$http.get('/api/users/my')
                if (res.code != 200 || !res.data) {
                    return
                }

                const email = String(res.data.email || '').trim()
                const address = String(res.data.address || '').trim()
                this.form.email = email

                if (this.isEmailBinding && email) {
                    this.$toast(this.$t('邮箱已绑定'))
                    this.$router.replace({ name: 'settings' })
                    return
                }
                if (!this.isEmailBinding && address) {
                    this.$toast(this.$t('钱包地址已绑定'))
                    this.$router.replace({ name: 'settings' })
                    return
                }
                if (!this.isEmailBinding && !email) {
                    this.$toast(this.$t('请先绑定邮箱'))
                    this.$router.replace({ name: 'settings' })
                }
            } catch (error) {
                console.log('加载账号绑定信息失败', error)
            }
        },
        isValidEmail(value) {
            return /^\S+@\S+\.\S+$/.test(value)
        },
        isValidWalletAddress(value) {
            return /^0x[a-fA-F0-9]{40}$/.test(value)
        },
        normalizeNumber(field, event) {
            this.form[field] = String(event.target.value || '').replace(/\D/g, '').slice(0, 6)
        },
        async sendVerificationCode() {
            if (this.isSendingCode || this.codeCountdown > 0) return
            if (!this.form.email) return this.showValidation('请输入邮箱')
            if (!this.isValidEmail(this.form.email)) return this.showValidation('请输入有效邮箱')

            this.isSendingCode = true
            try {
                const res = await this.$http.post('/api/email_code', {
                    email: this.form.email,
                    type: this.isEmailBinding ? 6 : 7,
                })
                if (res.code == 200) {
                    this.$messageTip.success(this.$t('验证码已发送'))
                    this.startCodeCountdown()
                    return
                }
            } catch (error) {
                console.log('发送账号绑定验证码失败', error)
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
            if (this.isEmailBinding) {
                if (!this.form.email) return this.showValidation('请输入邮箱')
                if (!this.isValidEmail(this.form.email)) return this.showValidation('请输入有效邮箱')
                if (!/^\d{6}$/.test(this.form.emailCode)) return this.showValidation('请输入6位验证码')
                if (!this.form.password) return this.showValidation('请输入登录密码')
                return true
            }

            if (!this.form.email) return this.showValidation('请先绑定邮箱')
            if (!this.form.address) return this.showValidation('请输入钱包地址')
            if (!this.isValidWalletAddress(this.form.address)) return this.showValidation('请输入有效钱包地址')
            if (!/^\d{6}$/.test(this.form.emailCode)) return this.showValidation('请输入6位验证码')
            if (!/^\d{6}$/.test(this.form.googleCode)) return this.showValidation('请输入6位谷歌验证码')
            return true
        },
        showValidation(message) {
            this.$toast(this.$t(message))
            return false
        },
        async submitBinding() {
            if (this.isSubmitting || !this.validateForm()) return

            this.isSubmitting = true
            try {
                const endpoint = this.isEmailBinding
                    ? '/api/users/my/email'
                    : '/api/users/my/address'
                const payload = this.isEmailBinding
                    ? {
                        email: this.form.email,
                        email_code: this.form.emailCode,
                        password: this.form.password,
                    }
                    : {
                        address: this.form.address,
                        email_code: this.form.emailCode,
                        google_code: this.form.googleCode,
                    }
                const res = await this.$http.post(endpoint, payload)
                if (res.code == 200) {
                    this.$messageTip.success(this.$t(
                        this.isEmailBinding ? '邮箱绑定成功' : '钱包地址绑定成功',
                    ))
                    this.$router.replace({ name: 'settings' })
                    return
                }
            } catch (error) {
                console.log('账号绑定提交失败', error)
            } finally {
                this.isSubmitting = false
            }
        },
    },
}
</script>

<style scoped lang="less">
.account-binding-page {
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

    .account-binding-back {
        width: 48px;
        height: 48px;
    }

    .account-binding-content {
        width: 750px;
        padding: 60px 30px 120px;

        .account-binding-card {
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

            .account-binding-form {
                display: flex;
                flex-direction: column;
                gap: 24px;

                .account-binding-field {
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

                    &.account-binding-readonly {
                        background: rgba(255, 255, 255, 0.05);

                        input {
                            color: rgba(184, 195, 212, 0.76);
                        }
                    }

                    &.account-binding-code {
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

                    .account-binding-eye {
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

                .account-binding-submit {
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

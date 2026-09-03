<template>
    <div
        class="email-login-page"
        :class="{
            'email-login-page-embedded': embedded,
        }"
    >
        <div class="email-login-stage">
        <!-- 模块一：Figma 原始深蓝背景。系统状态栏由宿主环境提供，页面内不重复绘制。 -->
        <img
            v-if="!embedded"
            src="@img/email-login-bg.png"
            alt=""
            class="email-login-background"
        />

        <!-- 模块二：品牌标识，沿用设计导出的 Alpha 蒙版资源。 -->
        <div v-if="!embedded" class="email-login-brand" aria-label="AIX-Quant">
            <span class="email-login-brand-symbol"></span>
            <span class="email-login-brand-wordmark"></span>
        </div>

        <!-- 模块三：邮箱和密码登录表单。 -->
        <div
            class="email-login-entry-content"
            :class="{ 'is-visible': !embedded || formVisible }"
        >
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
                    ref="passwordInput"
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
                    <img :src="showPassword ? eyeHidden : eyeVisible" alt="" />
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
        <!-- <div class="email-login-other-title df-aic-jucen">
            <span class="email-login-other-line email-login-other-line-left"></span>
            <span>{{ $t('其他登录方式') }}</span>
            <span class="email-login-other-line email-login-other-line-right"></span>
        </div>

        <button type="button" class="email-login-wallet" @click="goWalletLogin">
            <img src="@img/email-login-wallet.svg" alt="" />
            <span>{{ $t('地址') }}</span>
        </button> -->
        </div>
        </div>

        <!-- 先收集谷歌动态码，再将邮箱、密码和动态码一次性提交登录。 -->
        <div
            v-if="showGoogleVerification"
            class="email-login-google-overlay"
            role="dialog"
            aria-modal="true"
            @touchmove.prevent
        >
            <section class="email-login-google-panel">
                <button
                    type="button"
                    class="email-login-google-close df-aic-jucen"
                    :aria-label="$t('关闭')"
                    :disabled="isSubmitting"
                    @click="closeGoogleVerification"
                >
                    <van-icon name="cross" size="24" color="#B8C3D4" />
                </button>
                <span class="email-login-google-icon df-aic-jucen">
                    <van-icon name="shield-o" size="42" color="#4C91FF" />
                </span>
                <h2>{{ $t('谷歌验证码验证') }}</h2>
                <p>{{ $t('请输入谷歌验证器中的6位动态码后继续登录') }}</p>
                <form @submit.prevent="submitGoogleVerification">
                    <label class="email-login-google-code common-input-focus">
                        <input
                            ref="googleCodeInput"
                            v-model="googleCode"
                            type="text"
                            inputmode="numeric"
                            autocomplete="one-time-code"
                            maxlength="6"
                            :placeholder="$t('请输入6位谷歌验证码')"
                            :aria-label="$t('请输入6位谷歌验证码')"
                            @input="normalizeGoogleCode"
                        />
                    </label>
                    <button type="submit" class="email-login-google-submit" :disabled="isSubmitting">
                        {{ $t('验证并登录') }}
                    </button>
                </form>
            </section>
        </div>
    </div>
</template>

<script>
import eyeVisible from '@img/register-eye-visible.svg'
import eyeHidden from '@img/register-eye-hidden.svg'

export default {
    name: 'EmailLogin',
    props: {
        // 启动页复用邮箱认证表单时，不重复渲染背景与品牌，并由父级控制入场动画。
        embedded: {
            type: Boolean,
            default: false,
        },
        formVisible: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            email: '',
            password: '',
            googleCode: '',
            activeField: 'email',
            showPassword: false,
            showGoogleVerification: false,
            isSubmitting: false,
            eyeVisible,
            eyeHidden,
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
        submitEmailLogin() {
            if (this.isSubmitting || !this.validateForm()) return
            // 账号密码与谷歌验证码统一在“验证并登录”时提交，避免提前发起登录请求。
            this.openGoogleVerification()
        },
        createEmailLoginPayload(googleCode = '') {
            const payload = {
                email: this.email,
                password: this.password,
            }
            if (googleCode) payload.google_code = googleCode
            return payload
        },
        completeEmailLogin(res) {
            if (!(res.code == 200 && res.data && res.data.token)) return false
            localStorage.setItem('token', res.data.token)
            this.$router.replace(this.getSafeRedirect() || '/index')
            return true
        },
        getLoginErrorPayload(error) {
            const response = error && error.response ? error.response : error
            return response && response.data !== undefined ? response.data : response
        },
        getLoginErrorMessage(error) {
            const payload = this.getLoginErrorPayload(error)
            if (typeof payload === 'string') return payload
            if (payload && typeof payload === 'object') {
                if (payload.message || payload.msg || payload.error) {
                    return String(payload.message || payload.msg || payload.error)
                }
                if (payload.errors && typeof payload.errors === 'object') {
                    return Object.keys(payload.errors).map(key => {
                        const value = payload.errors[key]
                        return Array.isArray(value) ? value.join(' ') : String(value)
                    }).join(' ')
                }
            }
            return error && error.message ? String(error.message) : ''
        },
        isCredentialError(payload) {
            const message = this.getLoginErrorMessage(payload)
            return /(email|account|password|credential|邮箱|账号|密码)/i.test(message)
                && /(invalid|incorrect|wrong|error|failed|错误|不正确|失败|不存在)/i.test(message)
        },
        openGoogleVerification() {
            this.showGoogleVerification = true
            this.googleCode = ''
            this.$nextTick(() => {
                if (this.$refs.googleCodeInput) this.$refs.googleCodeInput.focus()
            })
        },
        closeGoogleVerification() {
            this.showGoogleVerification = false
            this.googleCode = ''
            this.$nextTick(() => {
                if (this.$refs.passwordInput) this.$refs.passwordInput.focus()
            })
        },
        normalizeGoogleCode(event) {
            this.googleCode = String(event.target.value || '').replace(/\D/g, '').slice(0, 6)
        },
        async submitGoogleVerification() {
            if (this.isSubmitting) return
            if (!/^\d{6}$/.test(this.googleCode)) {
                this.$toast(this.$t('请输入6位谷歌验证码'))
                return
            }

            this.isSubmitting = true
            try {
                const res = await this.$http.post(
                    '/api/auth/email_login',
                    this.createEmailLoginPayload(this.googleCode),
                )
                if (this.completeEmailLogin(res)) return
                if (this.isCredentialError(res.data)) {
                    this.closeGoogleVerification()
                }
            } catch (error) {
                console.log('谷歌验证码登录验证失败', error)
                const payload = this.getLoginErrorPayload(error)
                if (this.isCredentialError(payload)) {
                    this.closeGoogleVerification()
                }
            } finally {
                this.isSubmitting = false
            }
        },
        getSafeRedirect() {
            const redirect = String(this.$route.query.redirect || '')
            if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return ''
            return redirect
        },
        getAuthQuery() {
            const query = {}
            if (this.$route.query.ref) query.ref = this.$route.query.ref
            const redirect = this.getSafeRedirect()
            if (redirect) query.redirect = redirect
            return query
        },
        goForgotPassword() {
            this.$router.push({ name: 'forgotPassword', query: this.getAuthQuery() })
        },
        goRegister() {
            this.$router.push({
                name: 'register',
                query: this.getAuthQuery(),
            })
        },
        goWalletLogin() {
            if (this.embedded) {
                this.$emit('wallet-login')
                return
            }
            this.$router.push({
                name: 'walletLogin',
                query: this.getAuthQuery(),
            })
        },
    },
}
</script>

<style scoped lang="less">
.email-login-page {
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

    .email-login-stage {
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

    .email-login-entry-content {
        position: absolute;
        inset: 0;
        z-index: 2;
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
    &.email-login-page-embedded {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        min-height: 100%;
        margin: 0;
        overflow: hidden;
        background: transparent;

        .email-login-stage {
            height: 100%;
            min-height: 100%;
        }

        .email-login-entry-content {
            pointer-events: none;
            opacity: 0;
            transform: translate3d(0, 740px, 0);
            transition: transform 620ms cubic-bezier(0.22, 1, 0.36, 1), opacity 380ms ease;

            &.is-visible {
                pointer-events: auto;
                opacity: 1;
                transform: translate3d(0, 0, 0);
            }
        }
    }

    // 登录二次验证：仅在账号密码校验通过且后端要求时展示。
    .email-login-google-overlay {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 50%;
        z-index: 1000;
        display: flex;
        width: 750px;
        max-width: 100vw;
        align-items: center;
        justify-content: center;
        padding: 30px;
        box-sizing: border-box;
        transform: translateX(-50%);
        background: rgba(0, 3, 12, 0.84);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
    }
    .email-login-google-panel {
        position: relative;
        width: 630px;
        max-width: 100%;
        padding: 56px 48px 48px;
        box-sizing: border-box;
        border: 2px solid #1B6CFF;
        border-radius: 32px;
        background: linear-gradient(180deg, rgba(7, 27, 67, 0.98), rgba(1, 10, 31, 0.98));
        box-shadow: 0 22px 70px rgba(0, 74, 255, 0.28);
        text-align: center;
        z-index: 9999;

        .email-login-google-close {
            position: absolute;
            top: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.08);

            &:disabled {
                opacity: 0.45;
            }
        }

        .email-login-google-icon {
            width: 96px;
            height: 96px;
            margin: 0 auto 28px;
            border: 2px solid rgba(76, 145, 255, 0.72);
            border-radius: 50%;
            background: rgba(76, 145, 255, 0.12);
        }

        h2 {
            margin: 0;
            font-size: 34px;
            line-height: 48px;
        }

        p {
            margin: 20px 0 0;
            color: rgba(184, 195, 212, 0.78);
            font-size: 24px;
            line-height: 36px;
        }

        form {
            margin-top: 42px;

            .email-login-google-code {
                display: block;
                width: 100%;
                height: 88px;
                box-sizing: border-box;
                border: 2px solid rgba(76, 145, 255, 0.72);
                border-radius: 20px;
                background: rgba(255, 255, 255, 0.10);

                input {
                    display: block;
                    width: 100%;
                    height: 100%;
                    padding: 0 28px;
                    box-sizing: border-box;
                    color: #FFFFFF;
                    font-size: 28px;
                    caret-color: #4C91FF;

                    &::placeholder {
                        color: rgba(184, 195, 212, 0.50);
                    }
                }
            }

            .email-login-google-submit {
                width: 100%;
                height: 88px;
                margin-top: 24px;
                border: 0;
                border-radius: 999px;
                background: #1261F3;
                color: #FFFFFF;
                font-size: 30px;
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
</style>

<template>
    <div class="transaction-auth-overlay" role="dialog" aria-modal="true" @click.self="closePopup">
        <section class="transaction-auth-panel">
            <h2>{{ title }}</h2>

            <!-- 支付密码为所有资金类接口的必填字段。 -->
            <label class="transaction-auth-field common-input-focus">
                <input
                    v-model="payPassword"
                    :type="showPayPassword ? 'text' : 'password'"
                    inputmode="numeric"
                    maxlength="6"
                    autocomplete="off"
                    :placeholder="$t('请输入支付密码')"
                    @input="payPassword = normalizeCode(payPassword)"
                />
                <button
                    type="button"
                    class="transaction-auth-password-toggle df-aic-jucen"
                    :aria-label="$t('显示或隐藏支付密码')"
                    :aria-pressed="showPayPassword"
                    @click="showPayPassword = !showPayPassword"
                >
                    <img :src="showPayPassword ? eyeHidden : eyeVisible" alt="" />
                </button>
            </label>

            <!-- 仅当接口配置开关开启时展示谷歌验证码。 -->
            <label v-if="googleRequired" class="transaction-auth-field common-input-focus">
                <input
                    v-model="googleCode"
                    type="text"
                    inputmode="numeric"
                    maxlength="6"
                    autocomplete="one-time-code"
                    :placeholder="$t('请输入谷歌验证码')"
                    @input="googleCode = normalizeCode(googleCode)"
                />
            </label>

            <div class="transaction-auth-actions df-aic">
                <button type="button" class="transaction-auth-cancel" :disabled="loading" @click="closePopup">
                    {{ $t('取消') }}
                </button>
                <button type="button" class="transaction-auth-confirm" :disabled="loading" @click="submit">
                    {{ loading ? $t('提交中') : $t('确认') }}
                </button>
            </div>
        </section>
    </div>
</template>

<script>
import eyeVisible from '@img/register-eye-visible.svg'
import eyeHidden from '@img/register-eye-hidden.svg'

export default {
    name: 'TransactionAuthPopup',
    props: {
        title: {
            type: String,
            default: '',
        },
        googleRequired: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            payPassword: '',
            googleCode: '',
            showPayPassword: false,
            previousBodyOverflow: '',
            eyeVisible,
            eyeHidden,
        }
    },
    mounted() {
        this.previousBodyOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
    },
    beforeDestroy() {
        document.body.style.overflow = this.previousBodyOverflow
    },
    methods: {
        normalizeCode(value) {
            return String(value || '').replace(/\D/g, '').slice(0, 6)
        },
        closePopup() {
            if (!this.loading) this.$emit('close')
        },
        submit() {
            if (!/^\d{6}$/.test(this.payPassword)) {
                this.$toast(this.$t('支付密码必须为6位数字'))
                return
            }
            if (this.googleRequired && !/^\d{6}$/.test(this.googleCode)) {
                this.$toast(this.$t('请输入6位谷歌验证码'))
                return
            }
            this.$emit('confirm', {
                pay_password: this.payPassword,
                google_code: this.googleRequired ? this.googleCode : null,
            })
        },
    },
}
</script>

<style scoped lang="less">
.transaction-auth-overlay {
    position: fixed;
    top: 0;
    left: 50%;
    z-index: 500;
    display: flex;
    width: 750px;
    height: 100vh;
    align-items: center;
    justify-content: center;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.65);

    .transaction-auth-panel {
        width: 630px;
        padding: 40px;
        border: 2px solid rgba(76, 145, 255, 0.55);
        border-radius: 32px;
        background: #071126;
        box-shadow: 0 12px 50px rgba(0, 97, 255, 0.25);

        h2 {
            margin: 0 0 32px;
            font-size: 32px;
            line-height: 45px;
            text-align: center;
        }

        .transaction-auth-field {
            display: flex;
            width: 550px;
            height: 88px;
            margin-top: 20px;
            padding: 0 24px;
            align-items: center;
            border: 2px solid transparent;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.10);

            input {
                min-width: 0;
                flex: 1 1 auto;
                border: 0;
                outline: 0;
                background: transparent;
                color: #FFFFFF;
                font-size: 28px;

                &::placeholder {
                    color: rgba(184, 195, 212, 0.50);
                }
            }

            .transaction-auth-password-toggle {
                width: 48px;
                height: 84px;
                margin-left: 8px;
                padding: 0;
                flex: 0 0 48px;
                border: 0;
                outline: 0;
                background: transparent;

                img {
                    width: 32px;
                    height: 32px;
                }
            }
        }

        .transaction-auth-actions {
            margin-top: 36px;
            gap: 20px;

            button {
                width: 265px;
                height: 80px;
                border: 0;
                border-radius: 999px;
                color: #FFFFFF;
                font-size: 28px;
            }

            .transaction-auth-cancel {
                background: rgba(255, 255, 255, 0.12);
            }

            .transaction-auth-confirm {
                background: #1261F3;
            }
        }
    }
}
</style>

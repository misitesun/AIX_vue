<template>
    <div class="switch-account-page">
        <van-nav-bar
            :title="$t('切换账号')"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
        >
            <template #left>
                <span class="switch-account-back df-aic-jucen">
                    <van-icon name="arrow-left" size="20" color="#fff" />
                </span>
            </template>
        </van-nav-bar>

        <main class="switch-account-content">
            <section class="switch-account-card">
                <h1>{{ $t('账号') }}</h1>

                <div v-if="accounts.length" class="switch-account-list">
                    <article
                        v-for="account in accounts"
                        :key="account.id"
                        class="switch-account-item df-aic"
                    >
                        <span class="switch-account-avatar df-aic-jucen">
                            <van-icon
                                :name="account.type === 'address' ? 'cash-back-record' : 'contact'"
                                size="24"
                                color="#6FA8FF"
                            />
                        </span>

                        <div class="switch-account-info">
                            <strong v-if="account.type === 'address'">{{ account.label | addrHide }}</strong>
                            <strong v-else>{{ account.label }}</strong>
                            <span v-if="account.isCurrent" class="switch-account-current df-aic">
                                <i></i>
                                {{ $t('当前已登录') }}
                            </span>
                        </div>

                        <span v-if="account.isCurrent" class="switch-account-checked df-aic-jucen">
                            <van-icon name="success" size="18" color="#FFFFFF" />
                        </span>
                        <button
                            v-else
                            type="button"
                            class="switch-account-action"
                            :disabled="isSubmitting || !account.hasCredential"
                            @click="openGoogleVerification(account)"
                        >
                            {{ $t('切换') }}
                        </button>
                    </article>
                </div>

                <div v-else class="switch-account-empty">
                    <van-icon name="friends-o" size="52" color="rgba(184, 195, 212, 0.42)" />
                    <p>{{ $t('暂无已保存账号') }}</p>
                </div>
            </section>
        </main>

        <button type="button" class="switch-account-add df-aic-jucen" @click="goAddAccount">
            <van-icon name="plus" size="22" color="#FFFFFF" />
            <span>{{ $t('添加账号') }}</span>
        </button>

        <div
            v-if="showGoogleVerification"
            class="switch-account-overlay"
            role="dialog"
            aria-modal="true"
            @touchmove.prevent
        >
            <section class="switch-account-dialog">
                <button
                    type="button"
                    class="switch-account-close df-aic-jucen"
                    :aria-label="$t('关闭')"
                    :disabled="isSubmitting"
                    @click="closeGoogleVerification"
                >
                    <van-icon name="cross" size="24" color="#B8C3D4" />
                </button>

                <span class="switch-account-shield df-aic-jucen">
                    <van-icon name="shield-o" size="42" color="#4C91FF" />
                </span>
                <h2>{{ $t('谷歌验证码验证') }}</h2>
                <p>{{ $t('请输入谷歌验证器中的6位动态码后继续登录') }}</p>
                <strong class="switch-account-target">{{ targetAccount ? targetAccount.email : '' }}</strong>

                <form @submit.prevent="submitSwitchAccount">
                    <label class="switch-account-code common-input-focus">
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
                    <button type="submit" class="switch-account-submit" :disabled="isSubmitting">
                        {{ isSubmitting ? $t('加载中') : $t('验证并登录') }}
                    </button>
                </form>
            </section>
        </div>
    </div>
</template>

<script>
import {
    decryptEmailAccountPassword,
    getCurrentEmailAccountId,
    getEmailAccountId,
    getSavedEmailAccounts,
    markCurrentEmailAccount,
} from '@/utils/accountCredentials'

export default {
    name: 'SwitchAccount',
    data() {
        return {
            accounts: [],
            currentAccountId: '',
            targetAccount: null,
            googleCode: '',
            showGoogleVerification: false,
            isSubmitting: false,
        }
    },
    mounted() {
        this.loadAccounts()
    },
    methods: {
        goAddAccount() {
            this.$router.push({
                name: 'login',
                query: {
                    addAccount: '1',
                    redirect: '/settings/accounts',
                },
            })
        },
        async loadAccounts() {
            const savedAccounts = getSavedEmailAccounts().map(account => ({
                ...account,
                type: 'email',
                label: account.email,
                hasCredential: true,
            }))
            let currentAccountId = getCurrentEmailAccountId()

            try {
                const res = await this.$http.get('/api/users/my')
                if (res.code == 200 && res.data) {
                    const currentEmail = String(res.data.email || '').trim().toLowerCase()
                    if (!currentEmail) {
                        this.$toast(this.$t('请先绑定邮箱'))
                        this.$router.replace({ name: 'settings' })
                        return
                    }

                    currentAccountId = getEmailAccountId(currentEmail)
                    markCurrentEmailAccount(currentEmail)
                    if (!savedAccounts.some(account => account.id === currentAccountId)) {
                        savedAccounts.unshift({
                            id: currentAccountId,
                            email: currentEmail,
                            type: 'email',
                            label: currentEmail,
                            hasCredential: false,
                        })
                    }
                }
            } catch (error) {
                console.log('获取当前登录账号失败', error)
            }

            this.currentAccountId = currentAccountId
            this.accounts = savedAccounts.map(account => ({
                ...account,
                isCurrent: account.id === currentAccountId,
            }))
        },
        openGoogleVerification(account) {
            if (!account || !account.hasCredential || this.isSubmitting) return
            this.targetAccount = account
            this.googleCode = ''
            this.showGoogleVerification = true
            this.$nextTick(() => {
                if (this.$refs.googleCodeInput) this.$refs.googleCodeInput.focus()
            })
        },
        closeGoogleVerification() {
            if (this.isSubmitting) return
            this.showGoogleVerification = false
            this.googleCode = ''
            this.targetAccount = null
        },
        normalizeGoogleCode(event) {
            this.googleCode = String(event.target.value || '').replace(/\D/g, '').slice(0, 6)
        },
        async submitSwitchAccount() {
            if (this.isSubmitting || !this.targetAccount) return
            if (!/^\d{6}$/.test(this.googleCode)) {
                this.$toast(this.$t('请输入6位谷歌验证码'))
                return
            }

            this.isSubmitting = true
            let credentialsDecrypted = false
            try {
                const password = await decryptEmailAccountPassword(this.targetAccount)
                credentialsDecrypted = true
                const res = await this.$http.post('/api/auth/email_login', {
                    email: this.targetAccount.email,
                    password,
                    google_code: this.googleCode,
                }, {
                    skipAuth: true,
                    skipUnauthorizedRedirect: true,
                })

                if (res.code == 200 && res.data && res.data.token) {
                    localStorage.setItem('token', res.data.token)
                    localStorage.removeItem('address')
                    this.$store.commit('setAddress', '')
                    markCurrentEmailAccount(this.targetAccount.email)
                    this.$messageTip.success(this.$t('账号切换成功'))
                    this.showGoogleVerification = false
                    this.$router.replace({ name: 'index' })
                    return
                }
                this.$toast(this.$t('登录失败'))
            } catch (error) {
                console.log('切换账号失败', error)
                if (!credentialsDecrypted) {
                    this.$toast(this.$t('账号凭据已失效，请重新登录'))
                }
            } finally {
                this.isSubmitting = false
            }
        },
    },
}
</script>

<style scoped lang="less">
.switch-account-page {
    width: 750px;
    min-height: 100vh;
    min-height: 100dvh;
    margin: 0 auto;
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
        }

        .van-nav-bar__left {
            left: 30px;
            padding: 0;
        }
    }

    .switch-account-back {
        width: 44px;
        height: 44px;
    }

    .switch-account-content {
        padding: 40px 30px 170px;
    }

    .switch-account-add {
        position: fixed;
        bottom: 30px;
        bottom: calc(30px + env(safe-area-inset-bottom));
        left: 50%;
        z-index: 100;
        width: 690px;
        max-width: calc(100vw - 60px);
        height: 88px;
        gap: 12px;
        border-radius: 999px;
        background: linear-gradient(90deg, #1261F3 0%, #287BFF 100%);
        box-shadow: 0 14px 34px rgba(18, 97, 243, 0.30);
        color: #FFFFFF;
        font-size: 28px;
        font-weight: 600;
        transform: translateX(-50%);

        &:active {
            transform: translateX(-50%) scale(0.98);
        }
    }

    .switch-account-card {
        width: 690px;
        padding: 36px 30px 40px;
        border: 1px solid rgba(76, 145, 255, 0.30);
        border-radius: 28px;
        background: rgba(24, 29, 37, 0.94);
        box-shadow: 0 18px 44px rgba(0, 52, 156, 0.14);

        h1 {
            margin: 0 0 28px;
            font-size: 30px;
            font-weight: 600;
            line-height: 42px;
        }
    }

    .switch-account-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .switch-account-item {
        min-height: 112px;
        padding: 20px 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.055);
    }

    .switch-account-avatar {
        width: 64px;
        height: 64px;
        flex: 0 0 64px;
        border-radius: 50%;
        background: rgba(27, 108, 255, 0.16);
    }

    .switch-account-info {
        min-width: 0;
        margin-left: 20px;
        flex: 1;

        strong {
            display: block;
            overflow: hidden;
            font-size: 26px;
            font-weight: 500;
            line-height: 37px;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .switch-account-current {
        margin-top: 6px;
        gap: 8px;
        color: #7FAEFF;
        font-size: 21px;
        line-height: 30px;

        i {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #2DDF85;
            box-shadow: 0 0 12px rgba(45, 223, 133, 0.52);
        }
    }

    .switch-account-checked {
        width: 48px;
        height: 48px;
        margin-left: 16px;
        flex: 0 0 48px;
        border-radius: 50%;
        background: #1261F3;
    }

    .switch-account-action {
        min-width: 116px;
        height: 56px;
        margin-left: 16px;
        padding: 0 24px;
        border: 1px solid #287BFF;
        border-radius: 999px;
        color: #68A3FF;
        font-size: 24px;
        font-weight: 500;

        &:active {
            background: rgba(40, 123, 255, 0.14);
        }

        &:disabled {
            border-color: rgba(184, 195, 212, 0.20);
            color: rgba(184, 195, 212, 0.38);
        }
    }

    .switch-account-empty {
        padding: 70px 0 56px;
        text-align: center;

        p {
            margin: 20px 0 0;
            color: rgba(184, 195, 212, 0.56);
            font-size: 24px;
            line-height: 34px;
        }
    }

    .switch-account-overlay {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 50%;
        width: 750px;
        max-width: 100vw;
        box-sizing: border-box;
        transform: translateX(-50%);
        z-index: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 30px;
        background: rgba(0, 3, 12, 0.84);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
    }

    .switch-account-dialog {
        position: relative;
        width: 630px;
        max-width: 100%;
        padding: 58px 50px 50px;
        border: 2px solid #1B6CFF;
        border-radius: 36px;
        background: linear-gradient(180deg, rgba(7, 27, 67, 0.98) 0%, rgba(1, 10, 31, 0.98) 100%);
        box-shadow: 0 22px 70px rgba(0, 74, 255, 0.28);
        text-align: center;
    }

    .switch-account-close {
        position: absolute;
        top: 24px;
        right: 24px;
        width: 48px;
        height: 48px;
        border: 1px solid rgba(184, 195, 212, 0.24);
        border-radius: 50%;
    }

    .switch-account-shield {
        width: 100px;
        height: 100px;
        margin: 0 auto 26px;
        border: 2px solid rgba(76, 145, 255, 0.72);
        border-radius: 50%;
        background: radial-gradient(circle, rgba(36, 116, 255, 0.28) 0%, rgba(3, 18, 49, 0.92) 72%);
    }

    .switch-account-dialog h2 {
        margin: 0;
        font-size: 34px;
        font-weight: 600;
        line-height: 48px;
    }

    .switch-account-dialog p {
        margin: 18px 0 8px;
        color: #AAB7CD;
        font-size: 23px;
        line-height: 36px;
    }

    .switch-account-target {
        display: block;
        overflow: hidden;
        color: #6FA8FF;
        font-size: 23px;
        font-weight: 500;
        line-height: 34px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .switch-account-code {
        display: flex;
        width: 530px;
        height: 88px;
        margin-top: 30px;
        align-items: center;
        padding: 0 26px;
        border: 2px solid transparent;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.10);

        input {
            width: 100%;
            border: 0;
            outline: 0;
            background: transparent;
            color: #FFFFFF;
            font-size: 26px;
            line-height: 37px;

            &::placeholder {
                color: rgba(184, 195, 212, 0.52);
            }
        }
    }

    .switch-account-submit {
        width: 530px;
        height: 88px;
        margin-top: 24px;
        border-radius: 999px;
        background: linear-gradient(90deg, #1261F3 0%, #287BFF 100%);
        font-size: 28px;
        font-weight: 600;

        &:disabled {
            opacity: 0.58;
        }
    }
}
</style>

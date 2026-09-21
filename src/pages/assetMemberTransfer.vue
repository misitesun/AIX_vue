<template>
    <div class="asset-member-transfer-page">
        <van-nav-bar
            :title="$t('互转')"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
            @click-right="openMemberTransferRecords"
        >
            <template #left>
                <span class="asset-member-transfer-back df-aic-jucen">
                    <img src="@img/asset-transfer-back.svg" alt="" />
                </span>
            </template>
            <template #right>
                <button
                    type="button"
                    class="asset-member-transfer-record df-aic-jucen"
                    :aria-label="$t('互转记录')"
                >
                    <img src="@img/record.png" class="img-38" alt="" />
                </button>
            </template>
        </van-nav-bar>

        <main class="asset-member-transfer-content">
            <section class="transfer-information">
                <img src="@img/asset-transfer-card.svg" alt="" class="transfer-information-background" />

                <button
                    type="button"
                    class="transfer-information-row transfer-information-row-asset"
                    @click="showAssetSelector = true"
                >
                    <span class="transfer-information-label">{{ $t('互转资产') }}</span>
                    <span class="transfer-information-value">{{ selectedAsset.symbol }}</span>
                    <img src="@img/asset-transfer-chevron.svg" alt="" class="transfer-information-arrow" />
                </button>

                <div class="transfer-information-row transfer-information-row-balance">
                    <span class="transfer-information-label">{{ $t('可用余额') }}</span>
                    <span class="transfer-information-value transfer-information-balance">
                        {{ selectedAsset.balance }}
                    </span>
                </div>
            </section>

            <section class="transfer-field-module transfer-address-module">
                <label for="member-transfer-account" class="transfer-field-label">{{ $t('接收账号') }}</label>
                <div class="transfer-field common-input-focus">
                    <img src="@img/asset-transfer-input.svg" alt="" class="transfer-field-background" />
                    <input
                        id="member-transfer-account"
                        v-model.trim="toAccount"
                        type="text"
                        class="transfer-field-input transfer-address-input"
                        :placeholder="$t('请输入账号')"
                        autocomplete="off"
                    />
                </div>
            </section>

            <section class="transfer-field-module transfer-amount-module">
                <label for="member-transfer-amount" class="transfer-field-label">{{ $t('互转数量') }}</label>
                <div class="transfer-field common-input-focus">
                    <img src="@img/asset-transfer-input.svg" alt="" class="transfer-field-background" />
                    <input
                        id="member-transfer-amount"
                        v-model="amount"
                        type="text"
                        inputmode="decimal"
                        class="transfer-field-input transfer-amount-input"
                        :placeholder="$t('请输入转出金额')"
                        @input="normalizeAmount"
                    />
                    <button type="button" class="transfer-field-all" @click="fillAllAmount">
                        {{ $t('全部') }}
                    </button>
                </div>
            </section>

            <section class="transfer-field-module transfer-pay-password-module">
                <label for="member-transfer-pay-password" class="transfer-field-label">{{ $t('支付密码') }}</label>
                <div class="transfer-field common-input-focus">
                    <img src="@img/asset-transfer-input.svg" alt="" class="transfer-field-background" />
                    <input
                        id="member-transfer-pay-password"
                        v-model="payPassword"
                        :type="showPayPassword ? 'text' : 'password'"
                        inputmode="numeric"
                        maxlength="6"
                        autocomplete="off"
                        class="transfer-field-input transfer-pay-password-input"
                        :placeholder="$t('请输入支付密码')"
                        :aria-label="$t('支付密码')"
                        aria-required="true"
                        @input="normalizePayPassword"
                    />
                    <button
                        type="button"
                        class="transfer-password-toggle df-aic-jucen"
                        :aria-label="$t('显示或隐藏支付密码')"
                        :aria-pressed="showPayPassword"
                        @click="showPayPassword = !showPayPassword"
                    >
                        <img :src="showPayPassword ? eyeHidden : eyeVisible" alt="" />
                    </button>
                </div>
            </section>

            <button type="button" class="transfer-confirm" @click="prepareMemberTransfer">
                {{ $t('确认') }}
            </button>

            <p class="transfer-notice">
                <span>{{ $t('互转即时到账，手续费由转出方承担。') }}</span>
                <span class="transfer-notice-metrics">
                    {{ $t('最低互转金额') }}：{{ memberTransferMinimum }} {{ selectedAsset.symbol }}
                    · {{ $t('手续费') }}：{{ memberTransferFee }}%
                </span>
            </p>
        </main>

        <van-action-sheet
            v-model="showAssetSelector"
            class="member-transfer-selector"
            :actions="assetSelectorActions"
            :title='$t("选择互转资产")'
            close-on-click-action
            close-on-click-overlay
            @select="selectAsset"
        />
        <transaction-auth-popup
            v-if="showMemberTransferGoogleVerification"
            :title="$t('谷歌验证码验证')"
            :google-required="true"
            :pay-required="false"
            :loading="isSubmitting"
            @close="showMemberTransferGoogleVerification = false"
            @confirm="submitMemberTransfer"
        />
    </div>
</template>

<script>
import BigNumber from 'bignumber.js'
import TransactionAuthPopup from '@/components/transactionAuthPopup'
import eyeVisible from '@img/register-eye-visible.svg'
import eyeHidden from '@img/register-eye-hidden.svg'

const MEMBER_TRANSFER_ASSETS = [
    {
        name: 'USDT',
        value: 'USDT',
        symbol: 'USDT',
        ccy: 'balance_usdt',
        balanceField: 'balance_usdt',
        balance: '',
    },
    {
        name: 'AIX',
        value: 'AIX',
        symbol: 'AIX',
        ccy: 'balance_aix',
        balanceField: 'balance_aix',
        balance: '',
    },
    {
        name: 'AXE',
        value: 'AXE',
        symbol: 'AXE',
        ccy: 'balance_axe',
        balanceField: 'balance_axe',
        balance: '',
    },
]

export default {
    name: 'AssetMemberTransfer',
    components: {
        TransactionAuthPopup,
    },
    data() {
        const routeSymbol = String(this.$route.params.assetId || 'usdt').toUpperCase()
        const routeAsset = MEMBER_TRANSFER_ASSETS.find(item => item.symbol === routeSymbol) || MEMBER_TRANSFER_ASSETS[0]

        return {
            toAccount: '',
            amount: '',
            payPassword: '',
            showPayPassword: false,
            showMemberTransferGoogleVerification: false,
            isSubmitting: false,
            showAssetSelector: false,
            isConfigLoaded: false,
            memberTransferConfig: {},
            selectedAsset: {
                ...routeAsset,
                balance: this.$t('无数据'),
            },
            assetActions: MEMBER_TRANSFER_ASSETS.map(item => ({
                ...item,
                balance: this.$t('无数据'),
            })),
            eyeVisible,
            eyeHidden,
        }
    },
    computed: {
        googleRequired() {
            return Number(this.memberTransferConfig.google_2fa_member_transfer_switch) === 1
        },
        memberTransferEnabled() {
            return Number(this.memberTransferConfig.member_transfer_switch) === 1
        },
        assetSelectorActions() {
            return this.withSelectedAction(this.assetActions, this.selectedAsset.value)
        },
        selectedAssetConfig() {
            const symbol = this.selectedAsset.symbol.toLowerCase()
            return {
                min: this.memberTransferConfig[`member_transfer_${symbol}_min`],
                fee: this.memberTransferConfig[`member_transfer_${symbol}_fee`],
            }
        },
        memberTransferMinimum() {
            return this.getConfigValue(this.selectedAssetConfig.min)
        },
        memberTransferFee() {
            return this.getConfigValue(this.selectedAssetConfig.fee)
        },
    },
    mounted() {
        this.loadMemberTransferData()
    },
    methods: {
        loadMemberTransferData() {
            this.loadBalance()
            this.loadMemberTransferConfig()
        },
        async loadBalance() {
            try {
                const res = await this.$http.get('/api/users/my/balance')
                if (res.code == 200 && res.data) {
                    this.assetActions = this.assetActions.map(item => ({
                        ...item,
                        balance: this.getDisplayValue(res.data[item.balanceField]),
                    }))
                    const currentAsset = this.assetActions.find(item => item.value === this.selectedAsset.value)
                    this.selectedAsset = { ...(currentAsset || this.assetActions[0]) }
                }
            } catch (error) {
                console.log('互转余额加载失败', error)
            }
        },
        async loadMemberTransferConfig() {
            try {
                const res = await this.$http.get('/api/transfers/config')
                if (res.code == 200 && res.data && !Array.isArray(res.data)) {
                    this.memberTransferConfig = res.data
                    this.isConfigLoaded = true
                }
            } catch (error) {
                console.log('互转配置加载失败', error)
            }
        },
        openMemberTransferRecords() {
            this.$router.push({
                name: 'assetRecords',
                query: { type: 'memberTransfer' },
            })
        },
        withSelectedAction(actions, selectedValue) {
            return actions.map(action => ({
                ...action,
                className: String(action.value) === String(selectedValue) ? 'is-selected' : '',
            }))
        },
        selectAsset(action) {
            this.selectedAsset = { ...action }
            this.amount = ''
        },
        normalizeAmount(event) {
            this.amount = this.toAllowedAmount(event.target.value)
        },
        toAllowedAmount(value) {
            const source = String(value || '').replace(/[^\d.]/g, '')
            const parts = source.split('.')
            const integerPart = (parts.shift() || '').replace(/^0+(?=\d)/, '')
            const decimalPart = parts.join('').slice(0, 6)

            return source.includes('.')
                ? `${integerPart || '0'}.${decimalPart}`
                : integerPart
        },
        normalizePayPassword(event) {
            this.payPassword = String(event.target.value || '').replace(/\D/g, '').slice(0, 6)
        },
        fillAllAmount() {
            this.amount = this.toAllowedAmount(this.selectedAsset.balance)
        },
        getConfigValue(value) {
            return value === undefined || value === null || value === '' ? '--' : value
        },
        getDisplayValue(value) {
            return value === undefined || value === null || value === '' ? this.$t('无数据') : value
        },
        prepareMemberTransfer() {
            if (!this.isConfigLoaded) {
                this.$toast(this.$t('配置加载中，请稍后'))
                return
            }
            if (!this.memberTransferEnabled) {
                this.$toast(this.$t('暂未开放互转'))
                return
            }
            if (!this.toAccount) {
                this.$toast(this.$t('请输入账号'))
                return
            }

            const amountValue = new BigNumber(this.amount)
            const balanceValue = new BigNumber(this.selectedAsset.balance)
            if (!this.amount || !amountValue.isFinite() || !amountValue.gt(0)) {
                this.$toast(this.$t('请输入有效互转数量'))
                return
            }
            if (!balanceValue.isFinite()) {
                this.$toast(this.$t('账户信息加载中，请稍后'))
                return
            }
            if (amountValue.gt(balanceValue)) {
                this.$toast(this.$t('互转数量不能超过可用余额'))
                return
            }

            const minAmount = new BigNumber(this.selectedAssetConfig.min)
            if (minAmount.isFinite() && amountValue.lt(minAmount)) {
                this.$toast(this.$t('互转数量低于最低限额'))
                return
            }
            if (!/^\d{6}$/.test(this.payPassword)) {
                this.$toast(this.$t('支付密码必须为6位数字'))
                return
            }
            if (this.googleRequired) {
                this.showMemberTransferGoogleVerification = true
                return
            }
            this.submitMemberTransfer()
        },
        async submitMemberTransfer(auth = {}) {
            if (this.isSubmitting) return
            this.isSubmitting = true
            try {
                const res = await this.$http.post('/api/transfers', {
                    ccy: this.selectedAsset.ccy,
                    to_account: this.toAccount,
                    amount: this.amount,
                    pay_password: this.payPassword,
                    ...(auth.google_code ? { google_code: auth.google_code } : {}),
                })
                if (res.code == 200) {
                    this.showMemberTransferGoogleVerification = false
                    this.toAccount = ''
                    this.amount = ''
                    this.payPassword = ''
                    this.showPayPassword = false
                    this.$messageTip.success(this.$t('互转已完成'))
                    this.loadBalance()
                }
            } catch (error) {
                console.log('提交互转失败', error)
            } finally {
                this.isSubmitting = false
            }
        },
    },
}
</script>

<style scoped lang="less">
.asset-member-transfer-page {
    width: 750px;
    min-height: 1624px;
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

        .van-nav-bar__right {
            right: 30px;
            padding: 0;
        }
    }

    .asset-member-transfer-back {
        width: 48px;
        height: 48px;

        img {
            display: block;
            width: 24px;
            height: 24px;
        }
    }

    .asset-member-transfer-record {
        width: 48px;
        height: 48px;
    }

    .asset-member-transfer-content {
        display: flex;
        width: 690px;
        min-height: 1536px;
        margin: 0 auto;
        padding: 30px 0 80px;
        flex-direction: column;

        .transfer-information {
            position: relative;
            display: flex;
            width: 690px;
            height: 188px;
            padding: 39px 30px 11px;
            flex: 0 0 188px;
            flex-direction: column;

            .transfer-information-background {
                position: absolute;
                inset: 0;
                display: block;
                width: 690px;
                height: 188px;
                pointer-events: none;
            }

            .transfer-information-row {
                position: relative;
                z-index: 1;
                display: flex;
                width: 100%;
                height: 69px;
                flex: 0 0 69px;
                align-items: flex-start;
                text-align: left;

                .transfer-information-label {
                    font-size: 28px;
                    line-height: 39px;
                }

                .transfer-information-value {
                    margin-left: auto;
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 28px;
                    line-height: 42px;
                    text-align: right;
                }

                .transfer-information-arrow {
                    display: block;
                    width: 14px;
                    height: 14px;
                    margin: 12px 0 0 16px;
                }
            }
        }

        .transfer-field-module {
            width: 690px;
            height: 172px;
            margin-top: 40px;
            flex: 0 0 172px;

            .transfer-field-label {
                display: block;
                height: 39px;
                font-size: 28px;
                line-height: 39px;
            }

            .transfer-field {
                position: relative;
                display: flex;
                width: 690px;
                height: 103px;
                margin-top: 30px;
                padding: 0 30px;
                align-items: center;

                .transfer-field-background {
                    position: absolute;
                    inset: 0;
                    display: block;
                    width: 690px;
                    height: 103px;
                    pointer-events: none;
                }

                .transfer-field-input {
                    position: relative;
                    z-index: 1;
                    min-width: 0;
                    height: 103px;
                    flex: 1 1 auto;
                    color: #FFFFFF;
                    caret-color: #4C91FF;
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 28px;
                    line-height: 103px;

                    &.transfer-address-input {
                        width: 100%;
                    }

                    &.transfer-amount-input {
                        width: auto;
                    }

                    &::placeholder {
                        color: rgba(184, 195, 212, 0.50);
                    }
                }

                .transfer-field-all {
                    position: relative;
                    z-index: 2;
                    height: 103px;
                    flex: 0 0 64px;
                    color: #0084FF;
                    font-size: 24px;
                    font-weight: 600;
                    line-height: 103px;
                    text-align: right;
                }

                .transfer-password-toggle {
                    position: relative;
                    z-index: 2;
                    width: 40px;
                    height: 103px;
                    margin-left: 8px;
                    flex: 0 0 40px;

                    img {
                        width: 32px;
                        height: 32px;
                    }
                }
            }
        }

        .transfer-confirm {
            width: 690px;
            height: 88px;
            margin-top: 60px;
            flex: 0 0 88px;
            border-radius: 999px;
            background: #1261F3;
            font-size: 28px;
            font-weight: 600;
            line-height: 39px;
            text-align: center;
            transition: transform 0.2s;

            &:active {
                transform: scale(0.97);
            }
        }

        .transfer-notice {
            width: 690px;
            margin: 30px 0 0;
            padding: 20px 24px;
            border: 1px solid rgba(76, 145, 255, 0.28);
            border-radius: 16px;
            background: rgba(18, 97, 243, 0.10);
            color: rgba(184, 195, 212, 0.90);
            font-size: 22px;
            line-height: 34px;
            word-break: break-word;

            .transfer-notice-metrics {
                display: block;
                margin-top: 8px;
                color: rgba(255, 255, 255, 0.72);
            }
        }
    }

    /deep/ .member-transfer-selector {
        max-height: 54%;
        padding: 0 24px calc(24px + env(safe-area-inset-bottom));
        box-sizing: border-box;
        border-radius: 32px 32px 0 0;
        background: linear-gradient(180deg, #192233 0%, #101621 100%);
        color: #FFFFFF;
        box-shadow: 0 -18px 48px rgba(0, 0, 0, 0.34);

        .van-action-sheet__header {
            height: 90px;
            color: #FFFFFF;
            font-size: 28px;
            font-weight: 600;
            line-height: 90px;
        }

        .van-action-sheet__close {
            top: 0;
            right: 8px;
            color: #9FAEC5;
            font-size: 34px;
            line-height: 90px;
        }

        .van-action-sheet__content {
            padding-bottom: 4px;
        }

        .van-action-sheet__item {
            position: relative;
            min-height: 88px;
            margin: 12px 0;
            padding: 0 28px;
            box-sizing: border-box;
            border: 1px solid rgba(255, 255, 255, 0.10);
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.06);
            color: #FFFFFF;
            font-size: 28px;
            line-height: 86px;
            text-align: left;

            &:active {
                background: rgba(76, 145, 255, 0.18);
            }

            &.is-selected {
                border-color: rgba(54, 118, 255, 0.88);
                background: rgba(29, 100, 255, 0.18);

                &::after {
                    position: absolute;
                    top: 0;
                    right: 28px;
                    color: #4C91FF;
                    content: "✓";
                    font-size: 30px;
                    font-weight: 600;
                }
            }
        }

        .van-action-sheet__gap,
        .van-action-sheet__cancel {
            display: none;
        }
    }
}
</style>

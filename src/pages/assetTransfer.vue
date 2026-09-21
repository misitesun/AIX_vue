<template>
    <div class="asset-transfer-page">
        <!-- 公共模块：固定顶部导航，H5 页面不渲染系统状态栏 -->
        <van-nav-bar
            :title="$t('划转')"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
            @click-right="openTransferRecords"
        >
            <template #left>
                <span class="asset-transfer-back df-aic-jucen">
                    <img src="@img/asset-transfer-back.svg" alt="" />
                </span>
            </template>
            <template #right>
                <button
                    type="button"
                    class="asset-transfer-record df-aic-jucen"
                    :aria-label="$t('划转记录')"
                >
                    <img src="@img/record.png" class="img-38" alt="" />
                </button>
            </template>
        </van-nav-bar>

        <main class="asset-transfer-content">
            <!-- 模块一：划转资产选择与当前可用余额 -->
            <section class="transfer-information">
                <img src="@img/asset-transfer-card.svg" alt="" class="transfer-information-background" />

                <button
                    type="button"
                    class="transfer-information-row transfer-information-row-asset"
                    @click="showAssetSelector = true"
                >
                    <span class="transfer-information-label">{{ $t('划转资产') }}</span>
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

            <!-- 模块二：收账方钱包地址 -->
            <section class="transfer-field-module transfer-address-module">
                <label for="transfer-address" class="transfer-field-label">{{ $t('接收账号') }}</label>
                <div class="transfer-field common-input-focus">
                    <img src="@img/asset-transfer-input.svg" alt="" class="transfer-field-background" />
                    <input
                        id="transfer-address"
                        v-model.trim="address"
                        type="text"
                        class="transfer-field-input transfer-address-input"
                        :placeholder="$t('请输入账号')"
                        autocomplete="off"
                    />
                </div>
            </section>

            <!-- 模块三：划转数量与全部回填 -->
            <section class="transfer-field-module transfer-amount-module">
                <label for="transfer-amount" class="transfer-field-label">{{ $t('划转数量') }}</label>
                <div class="transfer-field common-input-focus">
                    <img src="@img/asset-transfer-input.svg" alt="" class="transfer-field-background" />
                    <input
                        id="transfer-amount"
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

            <!-- 模块四：支付密码始终由页面收集，谷歌验证仅按后台状态额外弹出。 -->
            <section class="transfer-field-module transfer-pay-password-module">
                <label for="transfer-pay-password" class="transfer-field-label">{{ $t('支付密码') }}</label>
                <div class="transfer-field common-input-focus">
                    <img src="@img/asset-transfer-input.svg" alt="" class="transfer-field-background" />
                    <input
                        id="transfer-pay-password"
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

            <!-- 模块五：确认划转 -->
            <button type="button" class="transfer-confirm" @click="prepareTransfer">
                {{ $t('确认') }}
            </button>

            <p class="transfer-notice">
                {{ $t('划转功能仅支持 AIX-Quant 向 XSmartPay 划转资产，不支持AIX-Quant 内部互转。') }}
            </p>
        </main>

        <!-- 资产选择器：最小默认集合，后续可直接替换成接口币种配置 -->
        <van-action-sheet
            v-model="showAssetSelector"
            class="transfer-selector"
            :actions="assetSelectorActions"
            :title='$t("选择划转资产")'
            close-on-click-action
            close-on-click-overlay
            @select="selectAsset"
        />
        <transaction-auth-popup
            v-if="showTransferGoogleVerification"
            :title="$t('谷歌验证码验证')"
            :google-required="true"
            :pay-required="false"
            :loading="isSubmitting"
            @close="showTransferGoogleVerification = false"
            @confirm="submitTransfer"
        />
    </div>
</template>

<script>
import TransactionAuthPopup from '@/components/transactionAuthPopup'
import eyeVisible from '@img/register-eye-visible.svg'
import eyeHidden from '@img/register-eye-hidden.svg'

const TRANSFER_ASSETS = [
    {
        name: 'AIX',
        value: 'AIX',
        symbol: 'AIX',
        ccy: 'balance_aix',
        balanceField: 'balance_aix',
        balance: '',
    },
    {
        name: 'USDT',
        value: 'USDT',
        symbol: 'USDT',
        ccy: 'balance_usdt',
        balanceField: 'balance_usdt',
        balance: '',
    },
]

export default {
    name: 'AssetTransfer',
    components: {
        TransactionAuthPopup,
    },
    data() {
        const routeSymbol = String(this.$route.params.assetId || 'aix').toUpperCase()
        const routeAsset = TRANSFER_ASSETS.find(item => item.symbol === routeSymbol) || TRANSFER_ASSETS[0]

        return {
            address: '',
            amount: '',
            payPassword: '',
            showPayPassword: false,
            showTransferGoogleVerification: false,
            isSubmitting: false,
            showAssetSelector: false,
            transferConfig: {},
            hasBoundEmail: false,
            userProfileLoaded: false,
            selectedAsset: {
                ...routeAsset,
                balance: this.$t('无数据'),
            },
            assetActions: TRANSFER_ASSETS.map(item => ({
                ...item,
                balance: this.$t('无数据'),
            })),
            eyeVisible,
            eyeHidden,
        }
    },
    computed: {
        googleRequired() {
            return Number(this.transferConfig.google_2fa_transfer_switch) === 1
        },
        assetSelectorActions() {
            return this.withSelectedAction(this.assetActions, this.selectedAsset.value)
        },
    },
    mounted() {
        this.loadTransferData()
    },
    methods: {
        loadTransferData() {
            this.loadBalance()
            this.loadTransferConfig()
            this.loadUserProfile()
        },
        async loadUserProfile() {
            try {
                const res = await this.$http.get('/api/users/my')
                if (res.code == 200 && res.data) {
                    this.hasBoundEmail = Boolean(String(res.data.email || '').trim())
                    this.userProfileLoaded = true
                }
            } catch (error) {
                console.log('划转页账户信息加载失败', error)
            }
        },
        async loadBalance() {
            try {
                const res = await this.$http.get('/api/users/my/balance')
                if (res.code == 200 && res.data) {
                    this.assetActions = this.assetActions.map(item => ({
                        ...item,
                        balance: res.data[item.balanceField] || this.$t('无数据'),
                    }))
                    const currentAsset = this.assetActions.find(item => item.value === this.selectedAsset.value)
                    this.selectedAsset = { ...(currentAsset || this.assetActions[0]) }
                }
            } catch (error) {
                console.log('划转余额加载失败', error)
            }
        },
        async loadTransferConfig() {
            try {
                const res = await this.$http.get('/api/cross_transfers/config')
                if (res.code == 200 && res.data) this.transferConfig = res.data
            } catch (error) {
                console.log('划转配置加载失败', error)
            }
        },
        openTransferRecords() {
            this.$router.push({
                name: 'assetRecords',
                query: { type: 'transfer' },
            })
        },
        withSelectedAction(actions, selectedValue) {
            return actions.map(action => ({
                ...action,
                className: String(action.value) === String(selectedValue) ? "is-selected" : "",
            }))
        },

        selectAsset(action) {
            this.selectedAsset = {
                ...action,
            }
            this.amount = ''
        },
        // 数量字段仅保留数字和一个小数点，余额原始值不做额外格式化。
        normalizeAmount(event) {
            let value = String(event.target.value || '').replace(/[^\d.]/g, '')
            const decimalIndex = value.indexOf('.')

            if (decimalIndex !== -1) {
                value = value.slice(0, decimalIndex + 1) + value.slice(decimalIndex + 1).replace(/\./g, '')
            }

            this.amount = value
        },
        normalizePayPassword(event) {
            this.payPassword = String(event.target.value || '').replace(/\D/g, '').slice(0, 6)
        },
        fillAllAmount() {
            this.amount = this.selectedAsset.balance
        },
        prepareTransfer() {
            const amountNumber = Number(this.amount)
            const balanceNumber = Number(this.selectedAsset.balance)
            if (!this.userProfileLoaded) {
                this.$toast(this.$t('账户信息加载中，请稍后'))
                return
            }
            if (!this.hasBoundEmail) {
                this.promptBindEmail()
                return
            }

            if (Number(this.transferConfig.transfer_switch) !== 1) {
                this.$toast(this.$t('暂未开放划转'))
                return
            }
            if (!this.address) {
                this.$toast(this.$t('请输入账号'))
                return
            }

            if (!this.amount || !Number.isFinite(amountNumber) || amountNumber <= 0) {
                this.$toast(this.$t('请输入有效划转数量'))
                return
            }

            if (amountNumber > balanceNumber) {
                this.$toast(this.$t('划转数量不能超过可用余额'))
                return
            }
            const minAmount = Number(this.transferConfig[`transfer_${this.selectedAsset.symbol.toLowerCase()}_min`])
            if (Number.isFinite(minAmount) && amountNumber < minAmount) {
                this.$toast(this.$t('划转数量低于最低限额'))
                return
            }
            if (!/^\d{6}$/.test(this.payPassword)) {
                this.$toast(this.$t('支付密码必须为6位数字'))
                return
            }
            if (this.googleRequired) {
                this.showTransferGoogleVerification = true
                return
            }
            this.submitTransfer()
        },
        async submitTransfer(auth = {}) {
            if (this.isSubmitting) return
            this.isSubmitting = true
            try {
                const res = await this.$http.post('/api/cross_transfers', {
                    ccy: this.selectedAsset.ccy,
                    to_account: this.address,
                    amount: this.amount,
                    pay_password: this.payPassword,
                    ...(auth.google_code ? { google_code: auth.google_code } : {}),
                })
                if (res.code == 200) {
                    this.showTransferGoogleVerification = false
                    this.address = ''
                    this.amount = ''
                    this.payPassword = ''
                    this.showPayPassword = false
                    this.$messageTip.success(this.$t('划转申请已提交'))
                    this.loadBalance()
                }
            } catch (error) {
                console.log('提交划转失败', error)
            } finally {
                this.isSubmitting = false
            }
        },
        promptBindEmail() {
            this.$dialog.confirm({
                title: this.$t('绑定邮箱'),
                message: this.$t('请先绑定邮箱'),
                confirmButtonText: this.$t('立即绑定'),
                cancelButtonText: this.$t('取消'),
                showCancelButton: true,
            }).then(() => {
                this.$router.push({ name: 'bindEmail' })
            }).catch(() => {})
        },
    },
}
</script>

<style scoped lang="less">
.asset-transfer-page {
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

    // 固定导航：去除系统状态栏后保留 88px 页面导航。
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

    .asset-transfer-back {
        width: 48px;
        height: 48px;

        img {
            display: block;
            width: 24px;
            height: 24px;
        }
    }

    .asset-transfer-record {
        width: 48px;
        height: 48px;
    }

    .asset-transfer-content {
        display: flex;
        width: 690px;
        min-height: 1536px;
        flex-direction: column;
        margin: 0 auto;
        padding: 30px 0 80px;

        // 模块一：资产与可用余额卡片
        .transfer-information {
            position: relative;
            display: flex;
            width: 690px;
            height: 188px;
            flex: 0 0 188px;
            flex-direction: column;
            padding: 39px 30px 11px;

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

                    &.transfer-information-balance {
                        margin-left: auto;
                    }
                }

                .transfer-information-arrow {
                    display: block;
                    margin: 12px 0 0 16px;
                    width: 14px;
                    height: 14px;
                }
            }
        }

        // 模块二、三：地址与数量输入模块
        .transfer-field-module {
            width: 690px;
            height: 172px;
            flex: 0 0 172px;
            margin-top: 40px;

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
                align-items: center;
                margin-top: 30px;
                padding: 0 30px;

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
                    flex: 1 1 auto;
                    height: 103px;
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
                    flex: 0 0 64px;
                    height: 103px;
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

        // 模块五：确认划转按钮
        .transfer-confirm {
            width: 690px;
            height: 88px;
            flex: 0 0 88px;
            margin-top: 60px;
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
        }
    }

    // 简洁选择面板：标题、卡片选项与明确的选中态。
    /deep/ .transfer-selector {
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

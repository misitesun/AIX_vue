<template>
    <div class="asset-withdraw-page">
        <!-- 公共模块：固定顶部导航，状态栏按 H5 规范不实现 -->
        <van-nav-bar
            :title="$t('提现')"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
            @click-right="openWithdrawRecords"
        >
            <template #left>
                <span class="asset-withdraw-back df-aic-jucen">
                    <img src="@img/asset-withdraw-back.svg" alt="" />
                </span>
            </template>
            <template #right>
                <button
                    type="button"
                    class="asset-withdraw-record df-aic-jucen"
                    :aria-label="$t('提现记录')"
                >
                    <img src="@img/record.png" class="img-38" alt="" />
                </button>
            </template>
        </van-nav-bar>

        <main class="asset-withdraw-content">
            <!-- 模块一：提现币种和网络选择 -->
            <section class="withdraw-information">
                <img src="@img/asset-withdraw-card.svg" alt="" class="withdraw-information-background" />

                <button
                    type="button"
                    class="withdraw-information-row withdraw-information-row-coin"
                    @click="showCoinSelector = true"
                >
                    <span class="withdraw-information-label">{{ $t('提现币种') }}</span>
                    <span class="withdraw-information-value">{{ selectedCoin.symbol }}</span>
                    <img
                        src="@img/asset-withdraw-chevron-coin.svg"
                        alt=""
                        class="withdraw-information-arrow"
                    />
                </button>

                <button
                    type="button"
                    class="withdraw-information-row withdraw-information-row-chain"
                    @click="showChainSelector = true"
                >
                    <span class="withdraw-information-label">{{ $t('提现链') }}</span>
                    <span
                        class="withdraw-information-value"
                        :class="{ 'is-placeholder': !selectedChain }"
                    >
                        {{ selectedChain || $t('请选择提现链') }}
                    </span>
                    <img
                        src="@img/asset-withdraw-chevron-chain.svg"
                        alt=""
                        class="withdraw-information-arrow"
                    />
                </button>
            </section>

            <!-- 模块二：提现数量与可用余额 -->
            <section class="withdraw-amount-module">
                <header class="withdraw-amount-heading df-aic-jusb">
                    <span class="withdraw-amount-label">{{ $t('提现数量') }}</span>
                    <span class="withdraw-amount-balance">
                        {{ $t('可用：{amount} {symbol}', {
                            amount: selectedCoin.balance,
                            symbol: selectedCoin.symbol,
                        }) }}
                    </span>
                </header>

                <div class="withdraw-amount-field common-input-focus">
                    <input
                        v-model="amount"
                        type="text"
                        inputmode="decimal"
                        class="withdraw-amount-input"
                        :aria-label="$t('提现数量')"
                        @input="normalizeAmount"
                    />
                    <button type="button" class="withdraw-amount-all" @click="fillAllAmount">
                        {{ $t('全部') }}
                    </button>
                </div>
            </section>

            <!-- 模块三：接口必填的提现到账地址。 -->
            <section class="withdraw-address-module">
                <label for="withdraw-address" class="withdraw-amount-label">{{ $t('提现地址') }}</label>
                <div class="withdraw-address-field common-input-focus">
                    <input
                        id="withdraw-address"
                        v-model.trim="address"
                        type="text"
                        :placeholder="$t('请输入提现地址')"
                        autocomplete="off"
                    />
                </div>
            </section>

            <!-- 模块四：支付密码始终由页面收集，谷歌验证仅按后台状态额外弹出。 -->
            <section class="withdraw-address-module withdraw-pay-password-module">
                <label for="withdraw-pay-password" class="withdraw-amount-label">{{ $t('支付密码') }}</label>
                <div class="withdraw-address-field common-input-focus">
                    <input
                        id="withdraw-pay-password"
                        v-model="payPassword"
                        :type="showPayPassword ? 'text' : 'password'"
                        inputmode="numeric"
                        maxlength="6"
                        autocomplete="off"
                        :placeholder="$t('请输入支付密码')"
                        :aria-label="$t('支付密码')"
                        aria-required="true"
                        @input="normalizePayPassword"
                    />
                    <button
                        type="button"
                        class="withdraw-password-toggle df-aic-jucen"
                        :aria-label="$t('显示或隐藏支付密码')"
                        :aria-pressed="showPayPassword"
                        @click="showPayPassword = !showPayPassword"
                    >
                        <img :src="showPayPassword ? eyeHidden : eyeVisible" alt="" />
                    </button>
                </div>
            </section>

            <!-- 模块五：提现主操作 -->
            <button type="button" class="withdraw-confirm" @click="prepareWithdraw">
                {{ $t('提现') }}
            </button>
        </main>

        <!-- 提现链固定为 BEP20，但初始不默认选中，需由用户主动选择 -->
        <van-action-sheet
            v-model="showCoinSelector"
            class="withdraw-selector"
            :actions="coinSelectorActions"
            :title='$t("选择提现币种")'
            close-on-click-action
            close-on-click-overlay
            @select="selectCoin"
        />
        <van-action-sheet
            v-model="showChainSelector"
            class="withdraw-selector"
            :actions="chainSelectorActions"
            :title='$t("选择提现链")'
            close-on-click-action
            close-on-click-overlay
            @select="selectChain"
        />
        <transaction-auth-popup
            v-if="showWithdrawGoogleVerification"
            :title="$t('谷歌验证码验证')"
            :google-required="true"
            :pay-required="false"
            :loading="isSubmitting"
            @close="showWithdrawGoogleVerification = false"
            @confirm="submitWithdraw"
        />
    </div>
</template>

<script>
import TransactionAuthPopup from '@/components/transactionAuthPopup'
import { ethers } from 'ethers'
import eyeVisible from '@img/register-eye-visible.svg'
import eyeHidden from '@img/register-eye-hidden.svg'

const WITHDRAW_COINS = [
    {
        name: 'USDT',
        value: 'USDT',
        symbol: 'USDT',
        ccy: 'balance_usdt',
        balanceField: 'balance_usdt',
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

const WITHDRAW_CHAINS = [
    {
        name: 'BEP20',
        value: 'BEP20',
    },
]

export default {
    name: 'AssetWithdraw',
    components: {
        TransactionAuthPopup,
    },
    data() {
        const routeSymbol = String(this.$route.params.assetId || 'usdt').toUpperCase()
        const routeCoin = WITHDRAW_COINS.find(item => item.symbol === routeSymbol) || WITHDRAW_COINS[0]

        return {
            address: '',
            amount: '',
            payPassword: '',
            showPayPassword: false,
            showWithdrawGoogleVerification: false,
            isSubmitting: false,
            showCoinSelector: false,
            showChainSelector: false,
            selectedCoin: {
                ...routeCoin,
                balance: this.$t('无数据'),
            },
            selectedChain: '',
            withdrawConfig: {},
            hasBoundEmail: false,
            userProfileLoaded: false,
            coinActions: WITHDRAW_COINS.map(item => ({ ...item, balance: this.$t('无数据') })),
            chainActions: WITHDRAW_CHAINS.map(item => ({ ...item })),
            eyeVisible,
            eyeHidden,
        }
    },
    computed: {
        googleRequired() {
            return Number(this.withdrawConfig.google_2fa_withdraw_switch) === 1
        },
        coinSelectorActions() {
            return this.withSelectedAction(this.coinActions, this.selectedCoin.symbol)
        },
        chainSelectorActions() {
            return this.withSelectedAction(this.chainActions, this.selectedChain)
        },

        selectedCoinConfig() {
            const prefix = this.selectedCoin.symbol.toLowerCase()
            return {
                enabled: Number(this.withdrawConfig[`withdraw_${prefix}_switch`]) === 1,
                min: this.withdrawConfig[`withdraw_${prefix}_min`],
                fee: this.withdrawConfig[`withdraw_${prefix}_fee`],
            }
        },
    },
    mounted() {
        this.loadWithdrawData()
    },
    methods: {
        loadWithdrawData() {
            this.loadBalances()
            this.loadWithdrawConfig()
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
                console.log('提现页账户信息加载失败', error)
            }
        },
        async loadBalances() {
            try {
                const res = await this.$http.get('/api/users/my/balance')
                if (res.code == 200 && res.data) {
                    this.coinActions = this.coinActions.map(item => ({
                        ...item,
                        balance: res.data[item.balanceField] || this.$t('无数据'),
                    }))
                    const current = this.coinActions.find(item => item.symbol === this.selectedCoin.symbol)
                    if (current) this.selectedCoin = { ...current }
                }
            } catch (error) {
                console.log('提现余额加载失败', error)
            }
        },
        async loadWithdrawConfig() {
            try {
                const res = await this.$http.get('/api/withdraws/config')
                if (res.code == 200 && res.data) this.withdrawConfig = res.data
            } catch (error) {
                console.log('提现配置加载失败', error)
            }
        },
        openWithdrawRecords() {
            this.$router.push({
                name: 'assetRecords',
                query: { type: 'withdraw' },
            })
        },
        withSelectedAction(actions, selectedValue) {
            return actions.map(action => ({
                ...action,
                className: String(action.value) === String(selectedValue) ? "is-selected" : "",
            }))
        },

        selectCoin(action) {
            this.selectedCoin = {
                ...action,
            }
            this.amount = ''
        },
        selectChain(action) {
            this.selectedChain = action.value
        },
        // 金额字段仅保留数字和一个小数点，接口原始余额不做额外格式化。
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
            this.amount = this.selectedCoin.balance
        },
        prepareWithdraw() {
            const amountNumber = Number(this.amount)
            const balanceNumber = Number(this.selectedCoin.balance)
            if (!this.userProfileLoaded) {
                this.$toast(this.$t('账户信息加载中，请稍后'))
                return
            }
            if (!this.hasBoundEmail) {
                this.promptBindEmail()
                return
            }

            if (!this.selectedCoinConfig.enabled) {
                this.$toast(this.$t('当前币种暂未开放提现'))
                return
            }

            if (!this.selectedChain) {
                this.$toast(this.$t('请选择提现链'))
                return
            }

            if (!this.address) {
                this.$toast(this.$t('请输入提现地址'))
                return
            }
            if (!ethers.utils.isAddress(this.address)) {
                this.$toast(this.$t('请输入有效提现地址'))
                return
            }

            if (!this.amount || !Number.isFinite(amountNumber) || amountNumber <= 0) {
                this.$toast(this.$t('请输入有效提现数量'))
                return
            }

            if (amountNumber > balanceNumber) {
                this.$toast(this.$t('提现数量不能超过可用余额'))
                return
            }
            const minAmount = Number(this.selectedCoinConfig.min)
            if (Number.isFinite(minAmount) && amountNumber < minAmount) {
                this.$toast(this.$t('提现数量低于最低限额'))
                return
            }
            if (!/^\d{6}$/.test(this.payPassword)) {
                this.$toast(this.$t('支付密码必须为6位数字'))
                return
            }
            if (this.googleRequired) {
                this.showWithdrawGoogleVerification = true
                return
            }
            this.submitWithdraw()
        },
        async submitWithdraw(auth = {}) {
            if (this.isSubmitting) return
            this.isSubmitting = true
            try {
                const res = await this.$http.post('/api/withdraws', {
                    ccy: this.selectedCoin.ccy,
                    address: this.address,
                    amount: this.amount,
                    pay_password: this.payPassword,
                    ...(auth.google_code ? { google_code: auth.google_code } : {}),
                })
                if (res.code == 200) {
                    this.showWithdrawGoogleVerification = false
                    this.amount = ''
                    this.address = ''
                    this.payPassword = ''
                    this.showPayPassword = false
                    this.$messageTip.success(this.$t('提现申请已提交'))
                    this.loadBalances()
                }
            } catch (error) {
                console.log('提交提现失败', error)
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
.asset-withdraw-page {
    position: relative;
    width: 750px;
    height: 1624px;
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

    // 固定导航：去除设计稿系统状态栏后保留 88px 页面导航。
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

    .asset-withdraw-back {
        width: 48px;
        height: 48px;

        img {
            display: block;
            width: 24px;
            height: 24px;
        }
    }

    .asset-withdraw-record {
        width: 48px;
        height: 48px;
    }

    .asset-withdraw-content {
        position: absolute;
        top: 0;
        left: 0;
        width: 750px;
        height: 1624px;

        // 模块一：提现币种与链选择卡片
        .withdraw-information {
            position: absolute;
            top: 118px;
            left: 30px;
            width: 690px;
            height: 188px;

            .withdraw-information-background {
                position: absolute;
                inset: 0;
                display: block;
                width: 690px;
                height: 188px;
                pointer-events: none;
            }

            .withdraw-information-row {
                position: absolute;
                left: 0;
                display: block;
                width: 690px;
                height: 69px;
                text-align: left;

                &.withdraw-information-row-coin {
                    top: 39px;
                }

                &.withdraw-information-row-chain {
                    top: 108px;
                }

                .withdraw-information-label {
                    position: absolute;
                    top: 0;
                    left: 30px;
                    font-size: 28px;
                    line-height: 39px;
                }

                .withdraw-information-value {
                    position: absolute;
                    top: 0;
                    right: 60px;
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 28px;
                    line-height: 42px;
                    text-align: right;

                    &.is-placeholder {
                        color: rgba(255, 255, 255, 0.50);
                    }
                }

                .withdraw-information-arrow {
                    position: absolute;
                    top: 12px;
                    right: 30px;
                    display: block;
                    width: 14px;
                    height: 14px;
                }
            }
        }

        // 模块二：数量标题、余额与输入框
        .withdraw-amount-module {
            position: absolute;
            top: 346px;
            left: 0;
            width: 750px;
            height: 212px;

            .withdraw-amount-heading {
                width: 750px;
                height: 42px;
                padding: 0 30px;

                .withdraw-amount-label {
                    font-size: 28px;
                    line-height: 39px;
                }

                .withdraw-amount-balance {
                    color: #B8C3D4;
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 24px;
                    line-height: 36px;
                    white-space: nowrap;
                }
            }

            .withdraw-amount-field {
                position: absolute;
                top: 85px;
                left: 30px;
                width: 690px;
                height: 103px;

                // 默认态使用统一的深色半透明输入框，聚焦蓝框由公共样式绘制
                &::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border-radius: 20px;
                    background: rgba(255, 255, 255, 0.10);
                    pointer-events: none;
                }

                .withdraw-amount-input {
                    position: absolute;
                    z-index: 1;
                    top: 0;
                    left: 30px;
                    width: 510px;
                    height: 103px;
                    caret-color: #4C91FF;
                    font-family: "Poppins", "Avenir Next", "Helvetica Neue", sans-serif;
                    font-size: 28px;
                    line-height: 103px;
                }

                .withdraw-amount-all {
                    position: absolute;
                    z-index: 2;
                    top: 0;
                    right: 30px;
                    width: 64px;
                    height: 103px;
                    color: #0084FF;
                    font-size: 24px;
                    font-weight: 600;
                    line-height: 103px;
                    text-align: right;
                }
            }
        }

        // 模块三：接口要求的到账地址输入框
        .withdraw-address-module {
            position: absolute;
            top: 578px;
            left: 30px;
            width: 690px;

            &.withdraw-pay-password-module {
                top: 780px;
            }

            .withdraw-amount-label {
                display: block;
                margin-bottom: 20px;
                font-size: 28px;
                line-height: 39px;
            }

            .withdraw-address-field {
                display: flex;
                width: 690px;
                height: 103px;
                padding: 0 30px;
                align-items: center;
                border: 2px solid transparent;
                border-radius: 20px;
                background: rgba(255, 255, 255, 0.10);

                input {
                    min-width: 0;
                    width: auto;
                    flex: 1 1 auto;
                    caret-color: #4C91FF;
                    font-size: 28px;

                    &::placeholder {
                        color: rgba(184, 195, 212, 0.50);
                    }
                }

                .withdraw-password-toggle {
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

        // 模块五：提现主按钮
        .withdraw-confirm {
            position: absolute;
            top: 982px;
            left: 30px;
            width: 690px;
            height: 88px;
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
    }

    // 简洁选择面板：标题、卡片选项与明确的选中态。
    /deep/ .withdraw-selector {
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

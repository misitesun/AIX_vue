<template>
    <div class="demo-page">
        <van-nav-bar
            title="DApp Demo"
            @click-left="$go(1, 1)"
            :fixed="true"
            :placeholder="true"
            z-index="99"
            :border="false"
        >
            <template #left>
                <van-icon name="arrow-left" size="20" color="#fff" />
            </template>
        </van-nav-bar>

        <div class="common-card mt-30">
            <div class="fsz-36 fw-b color-main-transparent">DApp 对接示例</div>
            <div class="fsz-24 color-ff5 mt-20 line-h-1">
                本页面集中演示钱包初始化、余额查询、授权额度查询、发起授权、授权后调用业务合约、闪兑报价、提现、登录签名和切链逻辑。
                后续对接新功能时，优先复制 script 内对应方法，再替换接口地址、币种、金额和业务合约方法。
            </div>
        </div>

        <div class="common-card mt-30">
            <div class="fsz-28 fw-b mb-30">当前钱包与余额</div>
            <div class="demo-row">
                <span class="fsz-24 color-ff5">钱包地址</span>
                <span class="fsz-24 text-line-1">{{ address || '-' }}</span>
            </div>
            <div class="demo-row">
                <span class="fsz-24 color-ff5">USDT 余额</span>
                <span class="fsz-24">{{ usdtBalance }}</span>
            </div>
            <div class="demo-row">
                <span class="fsz-24 color-ff5">GV 余额</span>
                <span class="fsz-24">{{ gvBalance }}</span>
            </div>
            <div class="demo-row">
                <span class="fsz-24 color-ff5">USDT 授权额度</span>
                <span class="fsz-24">{{ usdtAllowance }}</span>
            </div>
            <div class="demo-row">
                <span class="fsz-24 color-ff5">GV 授权额度</span>
                <span class="fsz-24">{{ gvAllowance }}</span>
            </div>
        </div>

        <div class="common-card mt-30 mb-60">
            <div class="fsz-28 fw-b mb-30">可点击测试入口</div>
            <div class="demo-actions">
                <div class="common-btn demo-btn df-aic-jucen fsz-24 fw-b" @click="handleLoadBalances">获取余额</div>
                <div class="common-btn demo-btn df-aic-jucen fsz-24 fw-b" @click="handleCheckAllowance">查询授权</div>
                <div class="common-btn demo-btn df-aic-jucen fsz-24 fw-b" @click="handleApproveUsdt">授权 USDT</div>
                <div class="common-btn demo-btn df-aic-jucen fsz-24 fw-b" @click="handleBuyNode">购买节点</div>
                <div class="common-btn demo-btn df-aic-jucen fsz-24 fw-b" @click="handleBuyMiner">购买矿机</div>
                <div class="common-btn demo-btn df-aic-jucen fsz-24 fw-b" @click="handleSwap">GV 换 USDT</div>
                <div class="common-btn demo-btn df-aic-jucen fsz-24 fw-b" @click="handleWithdraw">提现 GV</div>
                <div class="common-btn demo-btn df-aic-jucen fsz-24 fw-b" @click="handleLoginSign">登录签名</div>
            </div>
        </div>
    </div>
</template>

<script>
import { Toast } from 'vant';
import { ethers } from 'ethers';

// 默认给项目业务合约授权。当前项目所有扣款型业务都让 Project 合约作为 spender。
const PROJECT_ADDRESS = process.env.VUE_APP_PROJECT_ADDRESS;

// 闪兑页面里的大额授权示例。该值会进入 erc20.approve，approve 内部会按 18 位转 wei。
const MAX_APPROVE_AMOUNT = '21000000000000000000000000';

// 闪兑最小接收比例。示例：报价后再乘 95%，用于给链上方法传 outMin，减少滑点失败。
const MIN_RECEIVE_RATE = 0.95;

export default {
    name: 'DappDemo',
    data() {
        return {
            address: '',
            usdtBalance: '0',
            gvBalance: '0',
            usdtAllowance: '0',
            gvAllowance: '0',
            quoteAmount: '0',
            isSubmitting: false,
            accountChangedHandler: null,

            // 示例输入。实际业务中应来自 input、接口配置或订单详情。
            demoNodeType: 1,
            demoMinerAmount: '100',
            demoSwapAmount: '1',
        }
    },
    beforeDestroy() {
        // 如果页面里注册了钱包监听，销毁页面时要移除，避免重复监听。
        if (window.ethereum && this.accountChangedHandler) {
            window.ethereum.removeListener('accountsChanged', this.accountChangedHandler);
        }
    },
    methods: {
        /**
         * 所有链上写操作都建议套这一层：
         * 1. 防止重复点击。
         * 2. 打开 Toast.loading，锁定用户操作。
         * 3. catch 里记录错误并提示用户。
         * 4. finally 里一定关闭 loading 并恢复提交状态。
         */
        async withDappLoading(task, successText) {
            if (this.isSubmitting) {
                return;
            }
            this.isSubmitting = true;
            try {
                Toast.loading({
                    message: this.$t('加载中'),
                    forbidClick: true,
                    loadingType: 'spinner',
                    duration: 0
                });
                const result = await task();
                if (successText) {
                    this.$messageTip.success(successText);
                }
                return result;
            } catch (error) {
                console.log('DApp Demo 执行失败：', error);
                const message = error && error.message ? error.message : this.$t('操作失败');
                this.$toast(message, 'fail');
            } finally {
                this.isSubmitting = false;
                Toast.clear();
            }
        },

        handleLoadBalances() {
            return this.withDappLoading(() => this.loadBalances(), '余额获取成功');
        },
        handleCheckAllowance() {
            return this.withDappLoading(() => this.loadAllowances(), '授权额度获取成功');
        },
        handleApproveUsdt() {
            return this.withDappLoading(() => this.approveToken('USDT', MAX_APPROVE_AMOUNT), 'USDT 授权成功');
        },
        handleBuyNode() {
            return this.withDappLoading(() => this.buyNodeDemo(this.demoNodeType), '节点购买成功');
        },
        handleBuyMiner() {
            return this.withDappLoading(() => this.buyMinerDemo(this.demoMinerAmount), '矿机购买成功');
        },
        handleSwap() {
            return this.withDappLoading(() => this.swapDemo('GV', this.demoSwapAmount), '兑换成功');
        },
        handleWithdraw() {
            return this.withDappLoading(() => this.withdrawDemo('balance_token'), '提现成功');
        },
        handleLoginSign() {
            return this.withDappLoading(() => this.loginSignDemo(), '登录签名完成');
        },

        /**
         * 初始化钱包和合约。
         *
         * this.$dapp.erc20.init('USDT') 内部会：
         * 1. 读取 configuration.js 里的 USDT 合约地址和 ERC20 ABI。
         * 2. 使用 window.ethereum 创建 ethers.providers.Web3Provider。
         * 3. 调用 eth_requestAccounts 唤起钱包授权。
         * 4. 获取 signer、account。
         * 5. 创建并 connect ERC20 合约实例。
         *
         * 任何需要当前钱包地址的地方，都可以通过 init 后返回对象上的 account 获取。
         */
        async initAccountByErc20(coin = 'USDT') {
            if (typeof window.ethereum === 'undefined') {
                throw new Error(this.$t('请先安装 MetaMask'));
            }
            const erc20Init = await this.$dapp.erc20.init(coin);
            this.address = erc20Init.account;
            this.$store.commit('setAddress', erc20Init.account);
            localStorage.setItem('address', erc20Init.account);
            return erc20Init;
        },

        /**
         * 获取代币余额。
         *
         * erc20.balanceOf() 默认查询当前钱包 account。
         * 当前封装内部使用 ethers.utils.formatEther，并返回页面可展示的字符串。
         */
        async getTokenBalance(coin) {
            const erc20Init = await this.initAccountByErc20(coin);
            return erc20Init.balanceOf();
        },

        /**
         * 同时获取 USDT 和 GV 余额。
         * 新业务页面通常在 mounted 或用户点击刷新时调用。
         */
        async loadBalances() {
            this.usdtBalance = await this.getTokenBalance('USDT');
            this.gvBalance = await this.getTokenBalance('GV');
            console.log('USDT 余额：', this.usdtBalance);
            console.log('GV 余额：', this.gvBalance);
        },

        /**
         * 查询授权额度。
         *
         * allowance(owner, spender) 的 owner 固定是当前钱包 account。
         * spender 默认是 Project 业务合约地址，因为购买、兑换、提现前的扣款都由业务合约执行。
         */
        async checkAllowance(coin, spender = PROJECT_ADDRESS) {
            const erc20Init = await this.initAccountByErc20(coin);
            const allowance = await erc20Init.allowance(spender);
            console.log(`${coin} 对 ${spender} 的授权额度：`, allowance);
            return allowance;
        },

        async loadAllowances() {
            this.usdtAllowance = await this.checkAllowance('USDT');
            this.gvAllowance = await this.checkAllowance('GV');
        },

        /**
         * 发起 ERC20 授权。
         *
         * 关键点：
         * 1. approve 的第一个参数是 spender，即业务合约地址。
         * 2. amount 是页面金额，erc20.approve 内部会 parseUnits(amount, 18)。
         * 3. 必须 await tx.wait()，等授权交易上链确认后，再调用业务合约。
         */
        async approveToken(coin, amount, spender = PROJECT_ADDRESS) {
            const erc20Init = await this.initAccountByErc20(coin);
            const tx = await erc20Init.approve(spender, amount);
            console.log(`${coin} 授权交易已发出：`, tx);
            await tx.wait();
            console.log(`${coin} 授权交易已确认`);
            await this.loadAllowances();
            return tx;
        },

        /**
         * 业务操作前的通用授权守卫。
         *
         * 调用业务合约前先查 allowance：
         * - 如果授权额度 >= 本次需要扣款金额，直接继续。
         * - 如果授权额度不足，先 approve，并等待 approveTx.wait()。
         *
         * 当前项目 allowance 返回的是格式化后的字符串，本示例沿用 Number 比较。
         * 如果后续涉及超大金额或非 18 位代币，建议改成 ethers.BigNumber + parseUnits 比较。
         */
        async ensureAllowance(coin, needAmount, spender = PROJECT_ADDRESS) {
            const allowance = await this.checkAllowance(coin, spender);
            if (Number(allowance) < Number(needAmount)) {
                await this.approveToken(coin, needAmount, spender);
            }
        },

        /**
         * 购买节点完整示例。
         *
         * 推荐调用顺序：
         * 1. 从后端配置接口拿节点价格。
         * 2. 校验链上 USDT 余额。
         * 3. 查询 USDT 授权，不足则先授权 Project 合约。
         * 4. 调后端 /api/node-orders 创建订单，拿合约所需签名参数。
         * 5. 初始化 Project 合约。
         * 6. 调 buyNode，并 await tx.wait()。
         * 7. 交易成功后刷新余额、订单、用户信息。
         */
        async buyNodeDemo(type = 1) {
            await this.loadBalances();

            const configRes = await this.$http.get('/api/config/config');
            const config = this.getApiData(configRes, '获取配置');
            const amount = type == 1 ? config.node_big_price : config.node_small_price;

            if (Number(this.usdtBalance) < Number(amount)) {
                throw new Error(this.$t('链上 USDT 余额不足'));
            }

            await this.ensureAllowance('USDT', amount);

            const orderRes = await this.$http.post('/api/node-orders', {
                type,
            });
            const info = this.getApiData(orderRes, '创建节点订单');

            const projectInit = await this.$dapp.project.init();
            const tx = await projectInit.buyNode(
                info.id,
                info.amount,
                info.principalAmount,
                info.gvqAmount,
                info.gvgasAmount,
                info.allocations,
                info.deadline,
                info.sign
            );
            console.log('buyNode 交易已发出：', tx);
            await tx.wait();
            console.log('buyNode 交易已确认');
            await this.loadBalances();
            return tx;
        },

        /**
         * 购买矿机/黄金券完整示例。
         *
         * 与 buyNode 的区别：
         * - 金额来自用户输入。
         * - 需要先按配置校验购买范围。
         * - 后端接口是 /api/miner-orders。
         * - 链上方法是 buyMiner。
         */
        async buyMinerDemo(amount = this.demoMinerAmount) {
            if (!amount || Number(amount) <= 0) {
                throw new Error(this.$t('请输入购买数量'));
            }

            await this.loadBalances();

            const configRes = await this.$http.get('/api/config/config');
            const config = this.getApiData(configRes, '获取配置');
            if (Number(amount) < Number(config.miner_order_min_amount) || Number(amount) > Number(config.miner_order_max_amount)) {
                throw new Error(`购买范围：${config.miner_order_min_amount}-${config.miner_order_max_amount} USDT`);
            }
            if (Number(this.usdtBalance) < Number(amount)) {
                throw new Error(this.$t('链上 USDT 余额不足'));
            }

            await this.ensureAllowance('USDT', amount);

            const orderRes = await this.$http.post('/api/miner-orders', {
                amount,
            });
            const info = this.getApiData(orderRes, '创建矿机订单');

            const projectInit = await this.$dapp.project.init();
            const tx = await projectInit.buyMiner(
                info.id,
                info.amount,
                info.principalAmount,
                info.gvqAmount,
                info.gvgasAmount,
                info.allocations,
                info.deadline,
                info.sign
            );
            console.log('buyMiner 交易已发出：', tx);
            await tx.wait();
            console.log('buyMiner 交易已确认');
            await this.loadBalances();
            return tx;
        },

        /**
         * 获取 Router 报价。
         *
         * sendCoin = 'GV'：GV -> USDT，路径 [GV, USDT]
         * sendCoin = 'USDT'：USDT -> GV，路径 [USDT, GV]
         *
         * router.getAmountsOut 内部会把输入金额 parseUnits(amount, 18)，并返回 formatEther(res[1])。
         */
        async getSwapQuote(sendCoin, amount) {
            if (!amount || Number(amount) <= 0) {
                throw new Error(this.$t('请输入兑换数量'));
            }
            const routerInit = await this.$dapp.router.init();
            const addressList = sendCoin === 'USDT'
                ? [process.env.VUE_APP_USDT_ADDRESS, process.env.VUE_APP_GV_TOKEN_ADDRESS]
                : [process.env.VUE_APP_GV_TOKEN_ADDRESS, process.env.VUE_APP_USDT_ADDRESS];
            const amountOut = await routerInit.getAmountsOut(amount, addressList);
            this.quoteAmount = this.formatChainAmount(amountOut);
            console.log(`${sendCoin} 兑换报价：`, this.quoteAmount);
            return this.quoteAmount;
        },

        /**
         * GV/USDT 闪兑完整示例。
         *
         * 推荐调用顺序：
         * 1. 校验输入金额。
         * 2. 获取当前币种余额。
         * 3. 查询 Router 报价。
         * 4. 授权 Project 合约扣当前发送币种。
         * 5. 把输入金额和最小接收金额转成 wei 字符串。
         * 6. USDT -> GV 调 buyGV；GV -> USDT 调 sellGV。
         * 7. await tx.wait() 后刷新余额。
         */
        async swapDemo(sendCoin = 'GV', amount = this.demoSwapAmount) {
            await this.loadBalances();
            const currentBalance = sendCoin === 'USDT' ? this.usdtBalance : this.gvBalance;
            if (Number(currentBalance) < Number(amount)) {
                throw new Error(`${sendCoin} 余额不足`);
            }

            const amountOut = await this.getSwapQuote(sendCoin, amount);
            await this.ensureAllowance(sendCoin, amount);

            const amountWei = ethers.utils.parseUnits(amount + '', 18).toString();
            const minReceiveAmount = this.formatChainAmount(Number(amountOut) * MIN_RECEIVE_RATE);
            const minReceiveWei = ethers.utils.parseUnits(minReceiveAmount + '', 18).toString();

            const projectInit = await this.$dapp.project.init();
            let tx = null;
            if (sendCoin === 'USDT') {
                tx = await projectInit.buyGV(amountWei, minReceiveWei);
            } else {
                tx = await projectInit.sellGV(amountWei, minReceiveWei);
            }
            console.log('swap 交易已发出：', tx);
            await tx.wait();
            console.log('swap 交易已确认');
            await this.loadBalances();
            return tx;
        },

        /**
         * 提现完整示例。
         *
         * ccy 取值来自后端约定：
         * - balance_usdt：提现 USDT。
         * - balance_token：提现 GV。
         *
         * 提 GV 收益时，可先调用 /api/miner-orders/claim，把待领取收益归集到可提现余额。
         */
        async withdrawDemo(ccy = 'balance_token') {
            if (ccy === 'balance_token') {
                try {
                    await this.$http.post('/api/miner-orders/claim');
                } catch (error) {
                    console.log('领取收益失败，继续执行提现：', error);
                }
            }

            const withdrawRes = await this.$http.post('/api/withdraws', {
                ccy,
            });
            const info = this.getApiData(withdrawRes, '创建提现订单');

            const projectInit = await this.$dapp.project.init();
            const tx = await projectInit.withdrawToken(
                info.id,
                info.token,
                info.amount,
                info.deadline,
                info.sign
            );
            console.log('withdrawToken 交易已发出：', tx);
            await tx.wait();
            console.log('withdrawToken 交易已确认');
            return tx;
        },

        /**
         * 钱包登录签名示例。
         *
         * 登录不是合约交易，不需要 gas。
         * 核心是让钱包对 Login-时间戳 做签名，后端校验签名归属地址后返回 token。
         */
        async loginSignDemo() {
            if (typeof window.ethereum === 'undefined') {
                throw new Error(this.$t('请先安装 MetaMask'));
            }
            const web3 = new ethers.providers.Web3Provider(window.ethereum);
            await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            const signer = web3.getSigner();
            const address = await signer.getAddress();
            const timestamp = Math.floor(Date.now() / 1000);
            const signature = await signer.signMessage('Login-' + timestamp);

            const loginRes = await this.$http.post('/api/auth/login', {
                address,
                signature,
                timestamp,
                ref: this.$route.query.ref || localStorage.getItem('ref') || ''
            });
            const info = this.getApiData(loginRes, '登录');

            localStorage.setItem('token', info.token);
            localStorage.setItem('address', address);
            this.$store.commit('setAddress', address);
            this.address = address;
            return info;
        },

        /**
         * 切换到环境变量配置的链。
         *
         * 当前生产环境 VUE_APP_CHAIN_ID = 56，也就是 BSC。
         * 如果用户钱包没有 BSC，MetaMask 会返回 4902，此时再 wallet_addEthereumChain。
         */
        async switchToConfiguredChain() {
            if (!window.ethereum) {
                throw new Error(this.$t('请先安装 MetaMask'));
            }
            const chainId = Number(process.env.VUE_APP_CHAIN_ID);
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{
                        chainId: ethers.utils.hexValue(chainId)
                    }]
                });
            } catch (error) {
                if (error.code == 4902 && chainId == 56) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x38',
                            chainName: 'BSC',
                            nativeCurrency: {
                                name: 'BNB',
                                symbol: 'BNB',
                                decimals: 18,
                            },
                            rpcUrls: ['https://bsc-dataseed.binance.org/'],
                            blockExplorerUrls: ['https://bscscan.com/'],
                        }],
                    });
                    return;
                }
                throw error;
            }
        },

        /**
         * 监听钱包地址切换示例。
         *
         * 钱包地址变更后，当前 token 通常已经不属于新地址，需要清 token 并重新登录。
         * 真实页面中可放在 navBar 或 App 级别，只注册一次即可。
         */
        installAccountsChangedListener() {
            if (!window.ethereum) {
                return;
            }
            if (this.accountChangedHandler) {
                window.ethereum.removeListener('accountsChanged', this.accountChangedHandler);
            }
            this.accountChangedHandler = (accounts) => {
                const newAddress = accounts[0];
                const oldAddress = this.$store.state.address || localStorage.getItem('address');
                if (!newAddress) {
                    return;
                }
                if (oldAddress && newAddress.toLowerCase() === oldAddress.toLowerCase()) {
                    return;
                }
                localStorage.removeItem('token');
                localStorage.removeItem('address');
                this.$store.commit('setAddress', '');
                this.$go(3, '/login');
            };
            window.ethereum.on('accountsChanged', this.accountChangedHandler);
        },

        /**
         * 从 this.$http 返回值里取 data。
         * 当前 axios 封装成功时返回 { code: 200, data }，页面层统一判断 code。
         */
        getApiData(res, label) {
            if (!res || res.code != 200) {
                throw new Error(`${label}失败`);
            }
            return res.data;
        },

        /**
         * 页面展示用格式化。
         * 注意：真正传合约前仍要用 ethers.utils.parseUnits 转成 wei。
         */
        formatChainAmount(value) {
            const amount = Number(value || 0);
            if (!amount) {
                return '0';
            }
            return String(amount.toFixed(6))
                .replace(/(\.\d*?[1-9])0+$/g, '$1')
                .replace(/\.0+$/g, '');
        },
    }
}
</script>

<style scoped lang="less">
.demo-page {
    min-height: 100vh;
    padding: 30px 0 80px;

    .demo-row {
        min-height: 58px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);

        span:last-child {
            max-width: 390px;
            text-align: right;
            word-break: break-all;
        }
    }

    .demo-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
    }

    .demo-btn {
        width: 300px;
        height: 72px;
        margin-bottom: 20px;
    }
}
</style>

<template>
	<div class="index">
        <navBar :url="'login'" />
		<div class="mask"></div>
		<img src="@common/logo1.png" alt="" class="animate__animated animate__swing logo1">
        <img src="@common/logo2.png" alt="" class="animate__animated animate__swing logo2">


	</div>
</template>

<script>
    import Toast from 'vant/lib/toast';
	import {
		ethers
	} from "ethers";
	import ParticlesBackground from '@/components/ParticlesBackground.vue'
	export default {
		components: {
			ParticlesBackground
		},
		data() {
			return {
				address:'',
				ref: '',
				signer: null,
				toast:null,
                isInitializing: false,
                isLoggingIn: false,
			}
		},
		async mounted() {
            localStorage.removeItem('token')
            localStorage.removeItem('address')
            this.$store.commit("setAddress", '');
			this.initReferrer();
			if (typeof window.ethereum === "undefined") {
				this.$toast('请先安装MetaMask')
				return;
			}
			await this.initializeLogin();
		},
		methods: {
            initReferrer() {
                this.ref = this.$route.query.ref ? this.$route.query.ref : '';
                console.log('ref：', this.ref);
                if (this.ref) {
                    localStorage.setItem('ref', this.ref)
                    this.ref = this.ref
                    return;
                }
                const localRef = localStorage.getItem('ref');
                if (localRef) {
                    this.ref = localRef
                }
            },
            async initializeLogin() {
                if (this.isInitializing) {
                    return;
                }
                this.isInitializing = true;
                try {
                    const web3 = new ethers.providers.Web3Provider(window.ethereum)
                    await window.ethereum.request({
                        method: 'eth_requestAccounts'
                    });
                    this.signer = web3.getSigner()
                    this.address = await this.signer.getAddress();
                    this.$store.commit("setAddress", this.address);
                    localStorage.setItem('address', this.address)
                    await this.getLogin();
                } catch (err) {
                    console.log('初始化登录失败', err)
                    this.handleLoginError(err, '钱包连接失败')
                } finally {
                    this.isInitializing = false;
                }
            },
            async connectWallet() {
                await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
            },
            async ensureCorrectChain() {
                if (!window.ethereum || process.env.VUE_APP_CHAIN_ID != 56) {
                    return;
                }
                const chainId = ethers.utils.hexValue(Number(process.env.VUE_APP_CHAIN_ID));
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{
                            chainId
                        }]
                    })
                } catch (err) {
                    if (err.code == 4902) {
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
                        })
                        return;
                    }
                    throw err;
                }
            },

			async getLogin() {
                if (this.isLoggingIn) {
                    return;
                }
                this.isLoggingIn = true;
                try {
                    const timestamp = Math.floor(Date.now() / 1000);
                    console.log('timestamp：', timestamp);
                    const signer = await this.signer.signMessage('Login-' + timestamp);
                    console.log('当前登录钱包地址：', this.address);
                    console.log('签名数据：', signer);
                    const res = await this.$http.post('/api/auth/login', {
                        address: this.address || localStorage.getItem('address'),
                        signature: signer,
                        timestamp: timestamp,
                        ref: this.ref ? this.ref : localStorage.getItem('ref')
                    })
                    if (res.code == 200 && res.data && res.data.token) {
                        localStorage.setItem('token', res.data.token)
                        this.$store.commit("setAddress", this.address);
                        this.$go(2, '/index?ref=' + this.ref);
                        return;
                    }
                    this.$toast(this.$t('登录失败'))
                } catch (err) {
                    console.log('钱包登录失败', err)
                } finally {
                    this.isLoggingIn = false;
                }
			},
		}
	}
</script>

<style scoped lang="less">
	.index {
		min-height: 100vh;
		// background: url('../assets/images/common-bg.png') no-repeat left top;
		background-size: 100% 100%;
		position: relative;
		z-index: 2;
        padding-top: 200px;
	}
    .logo1{
        display: block;
        margin: 32px auto;
        width: 200px;
    }
    .logo2{
        display: block;
        margin: auto;
        width: 252px;
    }
	.mask {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: -1;
		background: rgba(5, 7, 12, 0.52);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px); // 兼容部分移动端
	}
    .transfer-popup{
        width: 590px;
        border-radius: 37px;
		background: var(--app-surface-strong);
		border: 1px solid var(--app-border);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px); // 兼容部分移动端  
		color: var(--app-text);
        padding: 30px;
        .value{
            padding-top: 14px;
			background: var(--app-surface-input);
			border: 1px solid var(--app-border);
            border-radius: 20px;
            height: 110px;
            textarea{
                width: 100%;
                height: 100%;
                border: none;
                outline: none;
                background: transparent;
				color: var(--app-text);
                line-height: 1.5;
                font-size: 24px;
            }
        }
        .btn1{
            width: 255px;
            height: 76px;
			border: 1px solid var(--app-border-strong);
            border-radius: 38px;
        }
        .btn2{
            width: 255px;
            height: 76px;
			background: var(--app-primary);
            border-radius: 38px;
			color: var(--app-text);
        }

    }
</style>

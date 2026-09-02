import DApp from '../config/configuration.js';
import { ethers } from "ethers";
const API = {
    // 绑定推荐人
    async bindReferrer(referrer) {
        let {
            bindReferrer
        } = this.meta;
        let {
            account
        } = this;
        const nonce = await this.web3.getTransactionCount(account);
        return new Promise(async (resolve, reject) => {
            bindReferrer(referrer, {
                nonce,
                gasPrice: ethers.utils.parseUnits('0.05', 'gwei'),
            }).then(res => {
                resolve(res)
            }).catch(err => {
                reject(err)
            })
        });
    },

    // 下单
    async donate(amount) {
        const amountWei = ethers.utils.parseUnits(amount + '', 18)
        let {
            donate
        } = this.meta;
        let {
            account
        } = this;
        const nonce = await this.web3.getTransactionCount(account);
        return new Promise(async (resolve, reject) => {
            donate(amountWei, {
                nonce,
                gasPrice: ethers.utils.parseUnits('0.05', 'gwei'),
            }).then(res => {
                resolve(res)
            }).catch(err => {
                reject(err)
            })
        });
    },
    
    // 购买节点
    async buyNode(id, amount, principalAmount, gvqAmount, gvgasAmount, allocations, deadline, signature) {
        console.log('buyNode参数：', id, amount, principalAmount, gvqAmount, gvgasAmount, allocations, deadline, signature)
        let {
            buyNode
        } = this.meta;
        let {
            account
        } = this;
        const nonce = await this.web3.getTransactionCount(account);
        return new Promise(async (resolve, reject) => {
            buyNode(id, amount, principalAmount, gvqAmount, gvgasAmount, allocations, deadline, signature, {
                nonce,
                gasPrice: ethers.utils.parseUnits('0.05', 'gwei'),
            }).then(res => {
                resolve(res)
            }).catch(err => {
                reject(err)
            })
        });
    },
    // 购买矿机
    async buyMiner(id, amount, principalAmount, gvqAmount, gvgasAmount, allocations, deadline, signature) {
        console.log('buyMiner参数：', id, amount, principalAmount, gvqAmount, gvgasAmount, allocations, deadline, signature)
        let {
            buyMiner
        } = this.meta;
        let {
            account
        } = this;
        const nonce = await this.web3.getTransactionCount(account);
        return new Promise(async (resolve, reject) => {
            buyMiner(id, amount, principalAmount, gvqAmount, gvgasAmount, allocations, deadline, signature, {
                nonce,
                gasPrice: ethers.utils.parseUnits('0.05', 'gwei'),
            }).then(res => {
                resolve(res)
            }).catch(err => {
                reject(err)
            })
        });
    },
    // 购买GV
    async buyGV(usdtAmount, outGVMin) {
        let {
            buyGV
        } = this.meta;
        let {
            account
        } = this;
        const nonce = await this.web3.getTransactionCount(account);
        return new Promise(async (resolve, reject) => {
            buyGV(usdtAmount, outGVMin, {
                nonce,
                gasPrice: ethers.utils.parseUnits('0.05', 'gwei'),
            }).then(res => {
                resolve(res)
            }).catch(err => {
                reject(err)
            })
        });
    },
    // 出售GV
    async sellGV(gvAmount, outUSDTMin) {
        let {
            sellGV
        } = this.meta;
        let {
            account
        } = this;
        const nonce = await this.web3.getTransactionCount(account);
        return new Promise(async (resolve, reject) => {
            sellGV(gvAmount, outUSDTMin, {
                nonce,
                gasPrice: ethers.utils.parseUnits('0.05', 'gwei'),
            }).then(res => {
                resolve(res)
            }).catch(err => {
                reject(err)
            })
        });
    },
    // 提现代币
    async withdrawToken(id, token, amount, deadline, signature) {
        let {
            withdrawToken
        } = this.meta;
        let {
            account
        } = this;
        const nonce = await this.web3.getTransactionCount(account);
        return new Promise(async (resolve, reject) => {
            withdrawToken(id, token, amount, deadline, signature, {
                nonce,
                gasPrice: ethers.utils.parseUnits('0.05', 'gwei'),
            }).then(res => {
                resolve(res)
            }).catch(err => {
                reject(err)
            })
        });
    },

    // 是否已捐赠
    async hasDonated(address) {
        let {
            hasDonated
        } = this.meta;
        return new Promise((resolve, reject) => {
            hasDonated(address).then(res => {
                resolve(res)
            }).catch(err => {
                reject(err)
            })
        });
    },

    // 是否绑定关系
    async isBound(address) {
        let {
            isBound
        } = this.meta;
        return new Promise((resolve, reject) => {
            isBound(address).then(res => {
                resolve(res)
            }).catch(err => {
                reject(err)
            })
        });
    },

    // 300u的价格
    async DONATE_AMOUNT_330() {
        let {
            DONATE_AMOUNT_330
        } = this.meta;
        return new Promise((resolve, reject) => {
            DONATE_AMOUNT_330().then(res => {
                const result = ethers.utils.formatEther(res)
                resolve(result)
            }).catch(err => {
                reject(err)
            })
        });
    },

    // 2000u的价格
    async DONATE_AMOUNT_2000() {
        let {
            DONATE_AMOUNT_2000
        } = this.meta;
        return new Promise((resolve, reject) => {
            DONATE_AMOUNT_2000().then(res => {
                const result = ethers.utils.formatEther(res)
                resolve(result)
            }).catch(err => {
                reject(err)
            })
        });
    },

}

export default {
	meta: null,
	account: null,
	web3: null,
	signer: null,
	async init() {
		let obj = await DApp.projectInit();
		let {
			meta,
			account,
			web3,
			signer
		} = obj;
		this.meta = meta;
		this.account = account;
		this.web3 = web3;
		this.signer = signer;
		return this;
	},
	...API
}
import DApp from '../config/configuration.js';
import BigNumber from "bignumber.js";
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";
const API = {
	async signer(message) { // 签名
		let {
			signer
		} = this.meta;
		let {
			account
		} = this;
		let res = await signer.signMessage(message)
		return res;
	},
	async balanceOf() { //查询余额
		let {
			balanceOf
		} = this.meta;
		let {
			account
		} = this;
		let res = await balanceOf(account)
		// return res
		const result = ethers.utils.formatEther(res)
		const resultWithDecimals = (Math.floor(result * 10000) / 10000).toFixed(6); // 保留6位小数，不进行四舍五入
		return resultWithDecimals
	},
	async transfer(to_address, amount) { //转账(对方地址，数量)
		const amountWei = ethers.utils.parseUnits(amount + '', 18)
		console.log('transfer', to_address, amountWei);
		let {
			transfer
		} = this.meta;
		let {
			account
		} = this;
		return new Promise(async (resolve, reject) => {
			transfer(to_address, amountWei, {
				nonce: this.web3.getTransactionCount(account),
				gasPrice: ethers.utils.parseUnits('3', 'gwei'),
				gasLimit: await this.meta.estimateGas.transfer(to_address, amountWei)
			}).then(res => {
				resolve(res)
			}).catch(err => {
				reject(err)
			})
		});
	},
	async approve(contract_address, amount) { //授权（合约地址，数量）
		const amountWei = ethers.utils.parseUnits(amount + '', 18)
		let {
			approve
		} = this.meta;
		let {
			account
		} = this;
		return new Promise((resolve, reject) => {
			approve(contract_address, amountWei).then(res => {
				console.log('授权成功打印1：', res)
				resolve(res)
			}).catch(err => {
				console.log('授权失败打印2：', err)
				reject(err)
			})
		});
	},
	async allowance(contract_address) { //是否已授权(合约地址)
		let {
			allowance
		} = this.meta;
		let {
			account
		} = this;
		return new Promise((resolve, reject) => {
			allowance(account, contract_address).then(res => {
				const result = ethers.utils.formatEther(res)
				resolve(result)
			}).catch(err => {
				console.log('授权额度4', err)
				reject(err)
			})
		});
	},
	async decimals() { //是否已授权(我的地址，合约地址)
		let {
			decimals
		} = this.meta;
		let {
			account
		} = this;
		return new Promise((resolve, reject) => {
			decimals().then(res => {
				// const result = ethers.utils.formatEther(res)
				// const resultWithDecimals = (Math.floor(result * 10000) / 10000).toFixed(6); // 保留6位小数，不进行四舍五入
				resolve(res.toString())
			}).catch(err => {
				reject(err)
			})
		});
	},

}

export default {
	async init(name) {
		let obj = await DApp.erc20Init(name);
		let {
			meta,
			account,
			web3
		} = obj;
		return {
			meta,
			account,
			web3,
			...API,
		};
	},
}

import {
	ethers
} from "ethers";

export default class Web3Init {
	constructor({
		artifact = null,
		address = null,
		abi = null
	}) {
		this.meta = this.account = this.signer = this.web3 = null;
		this.artifact = artifact;
		//以下2种情况对应，后端开发人员直接给出合约地址与合约abi的情况（比如只给了json文件的abi部分）
		this.address = address;
		this.abi = abi;
		// 链接的url地址，有啥用暂时不清楚,在main.js中设置
		this.url = this.constructor.prototype.constructor.url;
	}
	async init() {
		if (window.ethereum) {
			this.web3 = new ethers.providers.Web3Provider(window.ethereum)
			await window.ethereum.request({
				method: 'eth_requestAccounts'
			});
			await this.start();
			return this;
		}
		console.warn(
			"No web3 detected. Falling back to" + this.url +
			" . You should remove this fallback when you deploy live"
		);
		this.web3 = new ethers.providers.JsonRpcProvider(this.url);
		throw new Error("No web3 detected. Falling back to" + this.url +
			" . You should remove this fallback when you deploy live");
	}
	async start() {
		const {
			web3
		} = this;
		if (!web3) {
			throw new Error('钱包初始化失败');
		}
		if (this.address === null && this.artifact) {
			const networkId = (await web3.getNetwork()).chainId;
			const deployedNetwork = this.artifact.networks[networkId];
			if (!deployedNetwork) {
				throw new Error('未找到当前网络对应的合约地址');
			}
			this.address = deployedNetwork.address;
		}
		if (this.abi === null) {
			this.abi = this.artifact.abi;
		}
		this.signer = web3.getSigner()
		this.account = await this.signer.getAddress();
		this.meta = new ethers.Contract(
			this.address,
			this.abi,
			web3
		).connect(this.signer);
	}



}
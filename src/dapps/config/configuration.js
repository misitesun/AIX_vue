/*
    这里是配置文件，可以配置不同的币种，
    根据前台初始化：this.$dapp.erc20.init('USDT')，传入不同的币种名称，分别进行初始化操作
    abi和api文件，是对应关系，
*/
import Web3Init from "../web3-init.js";
export default {
    async erc20Init(name) {
        let instance = null;
        let address = ''
        if (name == 'USDT' || name == '') {
            address = process.env.VUE_APP_USDT_ADDRESS
        }else if(name == 'LIMI') {
            address = process.env.VUE_APP_LIMI_ADDRESS
        }else if(name == 'GV') {
            address = process.env.VUE_APP_GV_TOKEN_ADDRESS
        }
        instance = new Web3Init({
            artifact: null,
            address: address,
            abi: require('../abi/ERC20.json')
        });
        let obj = await instance.init();
        return obj;
    },
    async projectInit() {
        let instance = null;
        instance = new Web3Init({
            artifact: null,
            address: process.env.VUE_APP_PROJECT_ADDRESS,
            abi: require('../abi/Project.json')
        });
        let obj = await instance.init();
        return obj;
    },
    async routerInit() {
        let instance = null;
        instance = new Web3Init({
            artifact: null,
            address: process.env.VUE_APP_PANCAKE_ROUTER_ADDRESS,
            abi: require('../abi/UniswapV2Router.json')
        });
        let obj = await instance.init();
        return obj;
    },
}
/*
    这里是配置文件，可以配置不同的币种，
    根据前台初始化：this.$dapp.erc20.init('USDT')，传入不同的币种名称，分别进行初始化操作
    abi和api文件，是对应关系，
*/
import Web3Init from "../web3-init.js";
import { translate } from '@/i18n/translate.js';

// 31337 使用本地测试部署 ABI，其他链继续使用原有 ABI。
const testDeployment = require('../abi/localhost.json');
const isTestDeployment = String(process.env.VUE_APP_CHAIN_ID) === testDeployment.chainId;

function getContractAbi(name, defaultAbi) {
    if (!isTestDeployment) return defaultAbi;
    const contract = testDeployment.contracts.find(item => item.name === name);
    if (!contract) {
        throw new Error(translate('未找到当前网络对应的合约地址'));
    }
    return contract.abi;
}

export default {
    async erc20Init(name) {
        let instance = null;
        let address = ''
        let contractName = ''
        if (name == 'USDT' || name == '') {
            address = process.env.VUE_APP_USDT_ADDRESS
            contractName = 'USDTToken'
        }else if(name == 'AIX') {
            address = process.env.VUE_APP_AIX_TOKEN_ADDRESS
            contractName = 'AIXToken'
        }else if(name == 'AXE') {
            address = process.env.VUE_APP_AXE_TOKEN_ADDRESS
            contractName = 'AXEToken'
        }else if(name == 'LIMI') {
            address = process.env.VUE_APP_LIMI_ADDRESS
        }else if(name == 'GV') {
            address = process.env.VUE_APP_GV_TOKEN_ADDRESS
        }
        instance = new Web3Init({
            artifact: null,
            address: address,
            abi: getContractAbi(contractName, require('../abi/ERC20.json'))
        });
        let obj = await instance.init();
        return obj;
    },
    async projectInit() {
        let instance = null;
        instance = new Web3Init({
            artifact: null,
            address: process.env.VUE_APP_PROJECT_ADDRESS,
            abi: getContractAbi('AIXQuantProjectV1', require('../abi/Project.json'))
        });
        let obj = await instance.init();
        return obj;
    },
    async routerInit() {
        let instance = null;
        instance = new Web3Init({
            artifact: null,
            address: process.env.VUE_APP_PANCAKE_ROUTER_ADDRESS,
            abi: getContractAbi('PancakeV2Router', require('../abi/UniswapV2Router.json'))
        });
        let obj = await instance.init();
        return obj;
    },
}

# hello-world

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### 本地测试合约

`src/dapps/abi/localhost.json` 保存 `localhost (3).json` 的完整部署信息，包含 AIX、USDT、AXE、PancakeV2Router、SmartWalletFactory 和 AIXQuantProjectV1。链 ID 为 `31337` 时，DApp 初始化使用该文件对应的 ABI；其他链保留原有 ABI。

在本地 `.env.development` 中配置以下地址，然后重启开发服务：

```dotenv
VUE_APP_CHAIN_ID = 31337
VUE_APP_USDT_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
VUE_APP_AIX_TOKEN_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
VUE_APP_AXE_TOKEN_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F'
VUE_APP_PROJECT_ADDRESS = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318'
VUE_APP_PANCAKE_ROUTER_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'
VUE_APP_SMART_WALLET_FACTORY_ADDRESS = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9'
```

代币可通过 `this.$dapp.erc20.init('USDT' | 'AIX' | 'AXE')` 初始化。SmartWalletFactory 当前无前台调用，ABI 已随部署文件保留。充值地址仍由后端接口返回。

此测试部署不包含 GV，新业务合约不提供旧 `buyNode`、`buyMiner`、`buyGV`、`sellGV`、`withdrawToken` 接口，因此旧 `demo.vue` 的 GV 示例不适用于该部署。实际购买、提现页面继续使用现有后端接口。钱包需手动切换到 `31337` 测试链；部署文件没有提供 RPC URL。

# VUE2 Dapp 项目开发规范

本文件是当前项目的 Codex 持久规则。后续开发、修改、评审都优先遵循本文；如果本文规则与现有代码风格冲突，先参考当前模块已有实现，并在动手前说明取舍。

## 1. 项目概况

- 项目基于 `Vue 2.6.x`、`Vue Router 3.x`、`Vuex 3.x`、`Vant 2.x`、`ethers 5.x`。
- H5 适配使用 `lib-flexible` + `postcss-pxtorem`，设计稿宽度按 `750px` 理解：页面视觉上的 `width: 100%` 对应设计稿 `750px`。
- `postcss.config.js` 中业务代码 `rootValue = 75`，Vant 文件 `rootValue = 37.5`，写样式时继续使用设计稿 px 值。
- 根路由部署基础路径为 `/h5/`，`vue.config.js` 中 `publicPath` 与 `router` 的 `base` 都是 `/h5/`。
- 应用主色调为黑底、金色/橙色渐变、半透明毛玻璃卡片。全局背景由 `App.vue` 引入 `FlameBackground`。
- 入口在 `src/main.js`，已挂载常用实例方法：`this.$http`、`this.$dapp`、`this.$go`、`this.$toast`、`this.$toFixed`、`this.$messageTip`。

## 2. 目录结构与职责

```text
src/
├── App.vue                 # 根组件、全局公共样式类、全局背景
├── main.js                 # Vue 插件注册、全局组件、全局方法、i18n、错误处理
├── router/index.js         # 路由配置与登录拦截
├── store/index.js          # Vuex，当前主要持久化钱包 address
├── pages/                  # 页面组件
├── components/             # 公共组件：navBar、navFoot、noData、MessageTip 等
├── dapps/
│   ├── web3-init.js        # ethers provider/signer/contract 初始化基类
│   ├── index.js            # 导出 erc20/project/router 三类 DApp API
│   ├── config/             # 合约地址与 ABI 初始化配置
│   ├── api/                # ERC20、业务合约、Router 合约封装
│   └── abi/                # 合约 ABI
├── utils/                  # axios、filters、toast、错误处理等工具
├── i18n/                   # 多语言配置
└── assets/                 # 图片与样式资源
```

### 重要文件

- `src/App.vue`：公共 class 的主要来源，优先复用其中的排版、颜色、间距、按钮、卡片、弹窗样式。
- `src/dapps/config/configuration.js`：按币种/合约类型初始化合约，合约地址来自 `.env.development` 和 `.env.production`。
- `src/dapps/api/erc20.js`：余额、授权额度、发起授权、转账、签名等 ERC20 操作。
- `src/dapps/api/project.js`：业务合约操作，例如 `buyNode`、`buyMiner`、`buyGV`、`sellGV`、`withdrawToken`。
- `src/dapps/api/router.js`：Router 报价查询，例如 `getAmountsOut`。
- `src/pages/demo.vue`：DApp 对接集中示例。后续对接合约功能时优先读取此文件，里面包含钱包初始化、余额查询、授权查询、发起授权、授权后调用业务合约、节点购买、矿机购买、GV/USDT 闪兑、提现、登录签名、切链与监听钱包地址变更等完整示例和注释。
- `src/components/navBar.vue`：项目顶部导航、多语言切换、钱包地址展示。钱包切链和账户切换的示例逻辑已同步整理到 `src/pages/demo.vue`。

## 3. UI 编写规范

### 基础原则

- 使用 Vue 2 Options API：`data()`、`mounted()`、`beforeDestroy()`、`computed`、`methods`。
- 页面组件默认使用 `<style scoped lang="less">`，公共样式放在 `App.vue` 或 `src/assets/css/vantInit.less`。
- 图片优先使用别名：`@img/xxx.png`、`@common/xxx.png`，工具类使用 `@utils`，根路径使用 `@`。
- 新页面优先套用现有结构：顶部 `navBar` 或 `van-nav-bar`，中间内容，底部 tab 页面使用 `navFoot`。
- 文案需要多语言时使用 `this.$t('文案')` 或模板内 `{{ $t('文案') }}`；不要把多语言页面文案硬编码成单一语言。
- 页面 mock 数据要按真实接口返回结构来写，不能为了渲染方便把 UI 文案塞进数据字段里。比如订单列表数据应写成 `{ price, amount, total, status }`，不要写成 `metrics: [{ label: '交易单价', value: price }]`；矿机数据应写成 `{ totalOutput, cycleDays, currentHolding }`，不要写成 `{ label: '总产出', unit: 'BREN', value: totalOutput }`。`交易单价`、`交易数量`、`总产出` 这类字段标题直接写在 `template` 中并用 `$t()` 包裹，`USDT`、`BREN`、`天` 等单位也在模板中独立展示，方便后续替换和接口对接。
- 页面 scoped Less 按模块父级嵌套组织，避免把所有选择器平铺成一列。属于同一模块或同一父容器的子元素样式，写进父级大括号内部，方便统一管理和移动。例如：

```less
.node {
    .box1 {
        .box1-demo1 {
            .box1-demo1-text {}
        }
        .box2-demo2 {
            .box2-demo2-text {}
        }
    }
}
```
### 750 设计稿与尺寸

- 样式继续写设计稿 px 值，交给 `postcss-pxtorem` 转换。
- 常见内容宽度为 `690px`，左右边距通常为 `30px`。
- 顶部导航高度通常为 `88px` 或 `90px`；底部导航高度为 `98px`。
- 列表页使用 `mescroll` 时，常见写法：

```less
.mescroll {
    position: fixed;
    top: 88px;
    bottom: 0;
    height: auto;
    padding-bottom: 120px; // 有底部 navFoot 的页面加
}
```

### 公共布局类

优先复用 `App.vue` 已有类，减少重复 CSS：

- `df`：`display: flex`
- `df-aic`：flex + 垂直居中
- `df-aic-jusb`：flex + 垂直居中 + 两端对齐
- `df-aic-jucen`：flex + 垂直居中 + 水平居中
- `text-center`、`text-left`、`text-right`
- `fw-b`：加粗
- `line-h-1`：常用正文行高
- `text-line-1` 到 `text-line-5`：单行或多行省略

### 字体、图片、间距工具类

`App.vue` 通过 Less mixin 生成 `10px` 到 `200px`、步长为 `2px` 的工具类：

- 字体：`fsz-24`、`fsz-28`、`fsz-32`、`fsz-48`、`fsz-80`
- 正方形图片：`img-24`、`img-40`、`img-60`、`img-120`
- 外边距：`ml-*`、`mr-*`、`mt-*`、`mb-*`
- 内边距：`pl-*`、`pr-*`、`pt-*`、`pb-*`

示例：

```vue
<div class="df-aic-jusb mt-30">
    <div class="fsz-24 color-ff5">{{ $t('钱包余额') }}</div>
    <div class="fsz-28 fw-b color-main-transparent">{{ usdtBalance }} USDT</div>
</div>
```

### 颜色与视觉风格

常用颜色类：

- `color-fff`、`color-999`、`color-666`
- `color-main`：`#F9E0B7`
- `color-main-transparent`：金色渐变文字
- `color-yellow`、`color-orange`
- `color-red`、`color-lv`、`color-blue`
- `color-ff5`：`rgba(255, 255, 255, 0.5)`

视觉风格约定：

- 背景以黑色为主，卡片常用 `rgba(255,255,255,0.1)`、深色渐变、金色边框、`backdrop-filter`。
- 重要按钮使用 `common-btn`，默认金色渐变、黑字、圆角胶囊，并带按压缩放效果。
- 通用卡片可使用 `common-card`，宽度 `690px`、内边距 `30px`、毛玻璃、金褐色半透明背景。
- 弹窗优先复用 `transfer-popup`，配合 Vant `van-popup` 使用。
- 页面入场动效沿用 `animate__animated animate__backInUp` 等 `animate.css` 类。

### Vant 组件风格

- Vant 全局覆盖在 `src/assets/css/vantInit.less`，包括 `van-nav-bar`、`van-overlay`、`van-popup`、`van-dialog`。
- 子页面返回导航常用：

```vue
<van-nav-bar
    :title="$t('页面标题')"
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
```

### 列表与空状态

分页列表使用全局注册的 `mescroll-vue`：

```js
data() {
    return {
        mescroll: null,
        mescrollUp: {
            callback: this.upCallback,
        },
        list: [],
    }
},
methods: {
    mescrollInit(mescroll) {
        this.mescroll = mescroll
    },
    upCallback(page, mescroll) {
        this.$http.get('/api/path', {
            page_no: page.num,
            page_size: 10
        }).then((res) => {
            if (res.code == 200) {
                const arr = res.data.list
                if (page.num === 1) this.list = []
                this.list = this.list.concat(arr)
                this.$nextTick(() => {
                    mescroll.endSuccess(arr.length)
                })
            }
        }).catch(() => {
            mescroll.endErr()
        })
    }
}
```

空列表使用 `noData` 或 `no-data`：

```vue
<noData v-if="list.length == 0"></noData>
```

## 4. HTTP 与状态规范

- 所有接口请求优先使用 `this.$http.get`、`this.$http.post`。
- `src/utils/axios.js` 统一设置 `baseURL`、`lang`、`Authorization`、`address` 请求头。
- 接口封装返回格式通常为 `{ code: 200, data: res.data }`，页面判断 `res.code == 200`。
- 接口返回值默认按后端返回的原值使用和展示，不要仅凭猜测做额外的数据转换、格式化、截断小数、补小数位、加千分位或单位换算。只有需求明确要求展示格式处理，或明确存在加减乘除、比例、进度条、排序比较、余额校验等计算场景时，才可以按场景转换为 `Number`、`BigNumber` 或其他类型；转换后的值仅用于计算，不要反向覆盖原始展示值。
- 登录 token 存在 `localStorage.token`；钱包地址存在 `Vuex state.address` 与 `localStorage.address`。
- 路由守卫逻辑：没有 token 只能访问 `/`，其他页面会跳回登录页。
- 复制使用 `this.$copyText`，成功/失败提示使用 `this.$messageTip.success/error`。
- 普通提示使用 `this.$toast(text)`，成功/失败可用 `this.$messageTip.success/error`。
- 长交易或接口组合操作使用 Vant：

```js
Toast.loading({
    message: 'Loading...',
    forbidClick: true,
    loadingType: 'spinner',
    duration: 0
})
```

并在 `catch` 或 `finally` 中确保 `Toast.clear()`。

## 5. DApp 模块规范

### 初始化入口

页面不要直接 new 合约，优先使用 `this.$dapp`：

```js
const usdt = await this.$dapp.erc20.init('USDT')
const gv = await this.$dapp.erc20.init('GV')
const project = await this.$dapp.project.init()
const router = await this.$dapp.router.init()
```

初始化流程：

1. `configuration.js` 根据币种或合约类型选择地址与 ABI。
2. `Web3Init.init()` 检查 `window.ethereum`。
3. 使用 `ethers.providers.Web3Provider(window.ethereum)`。
4. 调用 `eth_requestAccounts`。
5. 获取 `signer`、`account`。
6. 创建并连接 `ethers.Contract`。

### 环境变量

合约地址与链配置以 `.env.*` 为准，不要在页面里硬编码：

- `VUE_APP_BASE_API`
- `VUE_APP_CHAIN_ID`
- `VUE_APP_USDT_ADDRESS`
- `VUE_APP_GV_TOKEN_ADDRESS`
- `VUE_APP_LIMI_ADDRESS`
- `VUE_APP_PROJECT_ADDRESS`
- `VUE_APP_PANCAKE_ROUTER_ADDRESS`

### 钱包登录规范

登录签名流程参考 `src/pages/demo.vue` 的 `loginSignDemo()`：

1. 清理旧 token/address。
2. 读取 URL 上的 `ref`，没有则取本地 `localStorage.ref`。
3. 检查 `window.ethereum`，没有钱包则提示安装 MetaMask。
4. `eth_requestAccounts` 获取钱包授权。
5. `ethers.providers.Web3Provider(window.ethereum)` 获取 `signer` 和 `address`。
6. 用 `signer.signMessage('Login-' + timestamp)` 生成签名。
7. 调用 `/api/auth/login`，传 `address`、`signature`、`timestamp`、`ref`。
8. 登录成功后保存 `token` 和 `address`；真实页面再按业务需要跳转。

### 切链与账户变更

切链与钱包地址变更示例参考 `src/pages/demo.vue` 的 `switchToConfiguredChain()` 与 `installAccountsChangedListener()`：

- 生产链 `VUE_APP_CHAIN_ID == 56` 时，调用 `wallet_switchEthereumChain` 切到 BSC。
- 如果钱包没有 BSC，错误码 `4902` 时调用 `wallet_addEthereumChain` 添加链。
- 监听 `accountsChanged`，如果新旧地址不同，清理 token/address 并跳回登录页。
- 页面内部需要依赖地址时，优先从 Vuex `address` 获取；必要时同步 `localStorage.address`。

## 6. ERC20 操作规范

### 获取余额

`erc20.balanceOf()` 默认查询当前钱包地址余额，内部使用 `ethers.utils.formatEther`，返回截断/格式化后的字符串。
完整示例参考 `src/pages/demo.vue` 的 `initAccountByErc20()`、`getTokenBalance()`、`loadBalances()`。

### 获取授权额度

授权额度用当前账户对业务合约地址的 allowance：
完整示例参考 `src/pages/demo.vue` 的 `checkAllowance()`、`loadAllowances()`。

### 发起授权

发起授权后必须等待上链确认，再继续调用业务合约：
完整示例参考 `src/pages/demo.vue` 的 `approveToken()`、`ensureAllowance()`。

授权金额策略：

- 节点/矿机购买可按本次金额授权，参考 `src/pages/demo.vue` 的 `buyNodeDemo()`、`buyMinerDemo()`。
- 兑换场景可使用一个较大的授权常量，参考 `src/pages/demo.vue` 中的 `MAX_APPROVE_AMOUNT`。
- 判断授权时注意单位：当前 `allowance()` 返回格式化后的 ether 字符串，页面里用 `Number()` 做展示级比较。涉及大额或高精度的新逻辑，优先用 `ethers.BigNumber`、`parseUnits` 后比较，避免精度损失。

## 7. 业务合约操作规范

### 标准交易流程

涉及代币扣款或业务合约写入时，按以下顺序组织：

1. UI 入参校验：空值、范围、余额、重复提交状态。
2. `Toast.loading` 锁定操作。
3. 查询链上余额和授权额度。
4. 授权不足时先 `approve`，并 `await approveTx.wait()`。
5. 调后端接口创建订单或获取签名参数。
6. `await this.$dapp.project.init()` 初始化业务合约。
7. 调用对应合约方法。
8. `await tx.wait()` 等待交易确认。
9. 成功后提示、重置输入、刷新余额/列表/用户信息。
10. `catch` 里记录错误并提示用户，`finally` 中清理 loading 与提交状态。

### 购买节点示例

参考 `src/pages/demo.vue` 的 `buyNodeDemo()`。该方法已经把“获取配置价格 -> 校验 USDT 余额 -> 查询/发起授权 -> 调后端创建节点订单 -> 初始化 Project 合约 -> 调 buyNode -> wait 确认 -> 刷新余额”串成完整示例。

### 购买矿机/黄金券

参考 `src/pages/demo.vue` 的 `buyMinerDemo()`：

- 校验输入不能为空。
- 校验金额在后端配置的 `miner_order_min_amount` 与 `miner_order_max_amount` 之间。
- 校验 USDT 链上余额。
- 授权不足时授权。
- 调 `/api/miner-orders` 获取 `id/amount/principalAmount/gvqAmount/gvgasAmount/allocations/deadline/sign`。
- 调 `projectInit.buyMiner(...)`，并 `await tx.wait()`。

### GV/USDT 闪兑

参考 `src/pages/demo.vue` 的 `getSwapQuote()` 与 `swapDemo()`：

- `loadBalances()` 分别初始化 USDT 与 GV，读取余额。
- `getSwapQuote()` 初始化 Router 合约，使用 `getAmountsOut(amount, [tokenIn, tokenOut])` 获取报价。
- 真实业务页面的输入框要做格式归一：只允许数字和一个小数点，小数按业务需要限制位数。
- 如果页面需要实时报价，在页面层做防抖和定时刷新，并在 `beforeDestroy` 清理定时器；`demo.vue` 只保留核心合约调用。
- 提交前防重复：`isSubmitting`。
- 合约入参金额用 `ethers.utils.parseUnits(amount + '', 18).toString()`。
- `sendToken.symbol === 'USDT'` 调 `projectInit.buyGV(amountWei, minReceiveWei)`。
- 否则调 `projectInit.sellGV(amountWei, minReceiveWei)`。

### 提现

参考 `src/pages/demo.vue` 的 `withdrawDemo()`：

- 真实业务提现前建议先弹 `this.$dialog.confirm`。
- 提 GV 收益时，先尝试调用 `/api/miner-orders/claim`，失败也继续执行提现逻辑。
- 调 `/api/withdraws` 获取后端签名参数。
- 调 `projectInit.withdrawToken(info.id, info.token, info.amount, info.deadline, info.sign)`。
- `await tx.wait()` 后再提示成功并刷新用户信息或收益数据。

## 8. 合约 API 封装约定

新增合约 API 时，优先沿用 `src/dapps/api/*.js` 的模式：

```js
import DApp from '../config/configuration.js'
import { ethers } from 'ethers'

const API = {
    async methodName(arg1, arg2) {
        const { methodName } = this.meta
        const { account } = this
        const nonce = await this.web3.getTransactionCount(account)
        return new Promise(async (resolve, reject) => {
            methodName(arg1, arg2, {
                nonce,
                gasPrice: ethers.utils.parseUnits('0.05', 'gwei'),
            }).then(res => {
                resolve(res)
            }).catch(err => {
                reject(err)
            })
        })
    },
}

export default {
    meta: null,
    account: null,
    web3: null,
    signer: null,
    async init() {
        const obj = await DApp.projectInit()
        this.meta = obj.meta
        this.account = obj.account
        this.web3 = obj.web3
        this.signer = obj.signer
        return this
    },
    ...API
}
```

注意：

- 读方法可直接调用合约并格式化返回值。
- 写方法返回交易对象，由页面层 `await tx.wait()` 后决定 UI 成功状态。
- 不要在 API 封装层直接改页面状态。
- 需要金额转换时优先使用 `ethers.utils.parseUnits(amount + '', 18)` 和 `ethers.utils.formatEther(value)`。
- gas 设置沿用当前项目习惯：业务合约多为 `0.05 gwei`，ERC20 `transfer` 中有 `estimateGas` 示例。新增方法前先参考同合约已有方法。

## 9. 交互与异常处理

- 交易类按钮必须防重复点击，可用 `isSubmitting` 或 loading 状态。
- 开启 `Toast.loading({ duration: 0 })` 后，所有退出路径必须清理 `Toast.clear()`。
- 钱包、合约、接口错误都要 `console.log` 具体上下文，用户层给出简洁提示。
- 成功提示优先使用 `this.$messageTip.success`；普通校验失败优先用 `this.$toast`。
- 组件内创建的 `setInterval`、`setTimeout` 必须在 `beforeDestroy` 清理。
- 监听钱包事件时要避免重复处理相同地址，地址比较使用小写。

## 10. 当前项目注意点

- 当前真实合约封装为 `erc20.js`、`project.js`、`router.js`；不要沿用旧规则里提到但项目不存在的 `biz.js`、`pancakeswapPair.js`。
- `navBar.vue` 的侧边菜单里存在 `/nft`、`/record`、`/assersRecord` 等未在当前路由中注册的路径；新增页面时要同步补齐路由，复用时不要盲目复制这些路径。
- `login.vue` 中存在未实际使用的 `ensureCorrectChain()`，切链主流程目前在 `navBar.vue`；调整登录链路时要统一两处职责。
- 业务金额当前大多假设 18 位精度。新增非 18 位代币时，先调用 `decimals()` 并按实际精度转换。
- `.env.production`、`.env.development` 是合约地址和链 ID 的来源；改地址时只改环境配置和必要文档，不要散落在页面代码里。

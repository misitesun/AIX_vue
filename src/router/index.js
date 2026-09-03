import Vue from 'vue'
import Router from 'vue-router'
Vue.use(Router)
const router = new Router({
    mode: 'history',
    base: '/aix/',
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return {
                x: 0,
                y: 0
            }
        }
    },
    routes: [
        // 启动页：根据登录态和钱包环境分流至对应登录页。
        {
            path: '/',
            name: 'startup',
            component: () =>
                import("@/pages/startup"),
            meta: { public: true },
        },
        // 邮箱登录
        {
            path: '/email-login',
            name: 'login',
            component: () =>
                import("@/pages/emailLogin"),
            meta: { public: true, guestOnly: true },
        },
        // 钱包地址签名登录
        {
            path: '/wallet-login',
            name: 'walletLogin',
            component: () =>
                import("@/pages/login"),
            meta: { public: true, guestOnly: true },
        },
        // 邮箱注册
        {
            path: '/register',
            name: 'register',
            component: () =>
                import("@/pages/register"),
            meta: { public: true, guestOnly: true },
        },
        // 忘记登录密码
        {
            path: '/forgot-password',
            name: 'forgotPassword',
            component: () =>
                import("@/pages/forgotPassword"),
            meta: { public: true, guestOnly: true },
        },
        // 设置 - 修改登录密码
        {
            path: '/settings/login-password',
            name: 'changeLoginPassword',
            component: () =>
                import("@/pages/changeLoginPassword"),
        },
        // 设置 - 修改支付密码
        {
            path: '/settings/pay-password',
            name: 'changePayPassword',
            component: () =>
                import("@/pages/changePayPassword"),
        },
        // 设置 - 绑定邮箱
        {
            path: '/settings/bind-email',
            name: 'bindEmail',
            component: () =>
                import("@/pages/accountBinding"),
            props: { bindingType: 'email' },
        },
        // 设置 - 绑定钱包地址
        {
            path: '/settings/bind-wallet-address',
            name: 'bindWalletAddress',
            component: () =>
                import("@/pages/accountBinding"),
            props: { bindingType: 'address' },
        },
        // 首页
        {
            path: '/index',
            name: 'index',
            component: () =>
                import("@/pages/index"),
        },
        // 独立签到视频：完成接口要求的观看时长后才允许关闭。
        {
            path: '/checkin-video',
            name: 'checkinVideo',
            component: () =>
                import("@/pages/checkinVideo"),
        },
        // 首页全网实时交易记录
        {
            path: '/transactions',
            name: 'globalTransactions',
            component: () =>
                import("@/pages/globalTransactions"),
        },
        // 全网实时交易详情
        {
            path: '/transactions/:transactionId',
            name: 'transactionDetail',
            component: () =>
                import("@/pages/transactionDetail"),
        },
        // 节点
        {
            path: '/node',
            name: 'node',
            component: () =>
                import("@/pages/node"),
        },
        // 节点认购订单记录
        {
            path: '/node/orders',
            name: 'nodeOrders',
            component: () =>
                import("@/pages/nodeOrders"),
        },
        // 资产
        {
            path: '/assets',
            name: 'assets',
            component: () =>
                import("@/pages/assets"),
        },
        // 资产充值
        {
            path: '/assets/:assetId/recharge',
            name: 'assetRecharge',
            component: () =>
                import("@/pages/assetRecharge"),
        },
        // 资产提现
        {
            path: '/assets/:assetId/withdraw',
            name: 'assetWithdraw',
            component: () =>
                import("@/pages/assetWithdraw"),
        },
        // 资产划转
        {
            path: '/assets/:assetId/transfer',
            name: 'assetTransfer',
            component: () =>
                import("@/pages/assetTransfer"),
        },
        // 资产流水、提现记录与划转记录
        {
            path: '/assets/records',
            name: 'assetRecords',
            component: () =>
                import("@/pages/assetRecords"),
        },
        // 代币资产详情
        {
            path: '/assets/:assetId',
            name: 'assetDetail',
            component: () =>
                import("@/pages/assetDetail"),
        },
        // 我的
        {
            path: '/mine',
            name: 'mine',
            component: () =>
                import("@/pages/mine"),
        },
        // 我的入金订单记录
        {
            path: '/mine/deposit-orders',
            name: 'depositOrders',
            component: () =>
                import("@/pages/depositOrders"),
        },
        // 我的谷歌验证器设置
        {
            path: '/mine/google-authenticator',
            name: 'googleAuthenticator',
            component: () =>
                import("@/pages/googleAuthenticator"),
        },
        // 设置
        {
            path: '/settings',
            name: 'settings',
            component: () =>
                import("@/pages/settings"),
        },
        // 公告
        {
            path: '/noticeList',
            name: 'noticeList',
            component: () =>
                import("@/pages/noticeList"),
        },
        // 公告详情
        {
            path: '/noticeDetail',
            name: 'noticeDetail',
            component: () =>
                import("@/pages/noticeDetail"),
        },

    ]
})


// 登录拦截：未登录时统一先进入启动页，由启动页判断钱包环境并选择登录方式。
router.beforeEach((to, from, next) => {
    const hasToken = Boolean(localStorage.getItem('token'))
    const isPublicRoute = to.matched.some(record => record.meta && record.meta.public)
    const isGuestOnlyRoute = to.matched.some(record => record.meta && record.meta.guestOnly)

    if (hasToken) {
        // 已登录用户不再进入登录、注册和忘记密码页面。
        if (isGuestOnlyRoute) {
            next({ name: 'index' })
            return
        }
        next()
        return
    }

    if (isPublicRoute) {
        next()
        return
    }

    next({
        name: 'startup',
        query: { redirect: to.fullPath },
    })
});


// 解决跳转相同路由报错问题
const routerPush = Router.prototype.push
Router.prototype.push = function push(location) {
    return routerPush.call(this, location).catch(error => error)
}
export default router;

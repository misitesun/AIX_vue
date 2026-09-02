import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'lib-flexible';
import '@utils/filters'; //过滤器
import http from '@utils/axios'
import DApp from './dapps/index.js'
import { go, toast, toFixed, dataURLtoFile } from '@/utils/utils.js' //公共方法
import { initErrorHandling } from '@/utils/errorHandler.js' //错误处理
import messageTip from '@/utils/messageTip.js' //消息提示

//自定义方法引入
Object.assign(Vue.prototype, {
    '$http': http,
    '$dapp': DApp,
    '$go': go,
    '$toast': toast,
    '$toFixed': toFixed,
    '$dataURLtoFile': dataURLtoFile,
    '$messageTip': messageTip
})

// 粒子特效 - 导入 particles.js
import 'particles.js'

import Vant from 'vant';
import 'vant/lib/index.css';
Vue.use(Vant);

import VueClipboard from 'vue-clipboard2'
Vue.use(VueClipboard)

import VueAwesomeSwiper from 'vue-awesome-swiper'
import 'swiper/css/swiper.css'
Vue.use(VueAwesomeSwiper)

import MescrollVue from 'mescroll.js/mescroll.vue'
Vue.component('mescroll-vue', MescrollVue);

import navBar from '@/components/navBar'
Vue.component('navBar', navBar);

// import navFoot from '@/components/navFoot'
// Vue.component('navFoot', navFoot);

import noData from '@/components/noData'
Vue.component('noData', noData);

import messages from './i18n/index.js'
let i18nConfig = {
    locale: localStorage.getItem('lang') || 'zh-Hans',
    messages
}
import VueI18n from 'vue-i18n'
Vue.use(VueI18n)
const i18n = new VueI18n(i18nConfig)

Vue.config.productionTip = false

// 初始化错误处理
initErrorHandling(Vue, router);


// WOW.js
import 'animate.css';
import { WOW } from 'wowjs';
Vue.prototype.$wow = new WOW({
    boxClass: 'wow', // 类名，在用户滚动时显示隐藏的框。
    animateClass: 'animate__animated', // 触发CSS动画的类名称
    offset: 200, // 定义浏览器视口底部与隐藏框顶部之间的距离。当用户滚动并到达此距离时，隐藏的框会显示出来。
    mobile: true, // 在移动设备上打开/关闭WOW.js。
    live: true, // 在页面上同时检查新的WOW元素。
    // callback: function(box) {
    //   //每次启动动画时都会触发回调
    //   // //传入的参数是正在动画的DOM节点
    // },
    scrollContainer: null, // 可选滚动容器选择器，否则使用window，
    resetAnimation: true, // 结束时重置动画（默认为true）
});

// 确保所有插件都已正确安装
const app = new Vue({
    i18n,
    router,
    store,
    render: h => h(App)
}).$mount('#app')



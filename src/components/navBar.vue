<template>
    <div class="navbar">
        <div class="navbar-box df-aic-jusb pr-30">
            <div class="df-aic ml-30 animate__animated animate__fadeInLeft" @click="isShow = !isShow">
                <img src="@common/aixQuantLogo.png" alt="AIX-Quant" class="logo" />
            </div>

            <div class="df-aic animate__animated animate__fadeInRight">
                <!-- 语言 -->
                <img src="@common/lang.png" alt="" class="img-44 ml-20" @click="langShow = !langShow" />
                <div class="fsz-22 fw-b ml-10 address df-aic-jucen">{{ address | addrHide }}</div>
                <!-- <img src="@common/nav-list.png" alt="" class="img-48 ml-20" v-if="!isShow"> -->
                <!-- <img src="@common/close.png" alt="" class="img-48 ml-20" @click="isShow = !isShow" v-else> -->
            </div>
        </div>
        <div class="lang u-text-center" v-if="langShow">
            <div class="item fsz-24 fw-b" :class="{ 'ac': lang == item.code }" v-for="(item, index) in langList"
                :key="index" @click="changeLang(item)">{{ item.name }}</div>
        </div>

        <div class="slide-menu">
            <div class="menu-content" :class="{ 'menu-show': isShow }">
                <div class="pt-100">
                    <div class="fsz-28 fw-b pl-30">{{ $t('邀请链接') }}</div>
                    <div class="df-aic-jusb link" @click="copyCode">
                        <div class="fsz-24 text-line-1">{{ inviteUrl }}</div>
                        <img src="@common/copy.png" alt="" class="img-32">
                    </div>
                </div>
                <div class="fsz-28 fw-b pl-30">{{ $t('服务') }}</div>
                <div class="menu-list">
                    <div class="menu-item df-aic-jusb" @click="$go(2,'/index')">
                        <div class="df-aic">
                            <img src="@common/nav1-ac.png" alt="" class="img-40" v-if="url == 'index'">
                            <img src="@common/nav1.png" alt="" class="img-40" v-else>
                            <span class="fsz-28 fw-b ml-10" :class="{'color-yellow': url == 'index'}">{{ $t('首页「入单」') }}</span>
                        </div>
                        <img src="@common/nav-arrow.png" alt="" class="img-20 ml-20">
                    </div>
                    <div class="menu-item df-aic-jusb" @click="isShow = false, $go(2,'/team')">
                        <div class="df-aic">
                            <img src="@common/nav2-ac.png" alt="" class="img-40" v-if="url == 'team'">
                            <img src="@common/nav2.png" alt="" class="img-40" v-else>
                            <span class="fsz-28 fw-b ml-10" :class="{'color-yellow': url == 'team'}">{{ $t('社区') }}</span>
                        </div>
                        <img src="@common/nav-arrow.png" alt="" class="img-20 ml-20">
                    </div>
                    <div class="menu-item df-aic-jusb" @click="isShow = false, $go(2,'/nft')">
                        <div class="df-aic">
                            <img src="@common/nav3-ac.png" alt="" class="img-40" v-if="url == 'nft'">
                            <img src="@common/nav3.png" alt="" class="img-40" v-else>
                            <span class="fsz-28 fw-b ml-10" :class="{'color-yellow': url == 'nft'}">NFT</span>
                        </div>
                        <img src="@common/nav-arrow.png" alt="" class="img-20 ml-20">
                    </div>
                    <div class="menu-item df-aic-jusb" @click="isShow = false, $go(2,'/record')">
                        <div class="df-aic">
                            <img src="@common/nav4-ac.png" alt="" class="img-40" v-if="url == 'record'">
                            <img src="@common/nav4.png" alt="" class="img-40" v-else>
                            <span class="fsz-28 fw-b ml-10" :class="{'color-yellow': url == 'record'}">{{ $t('捐赠记录') }}</span>
                        </div>
                        <img src="@common/nav-arrow.png" alt="" class="img-20 ml-20">
                    </div>
                    <div class="menu-item df-aic-jusb" @click="isShow = false, $go(2,'/assersRecord')">
                        <div class="df-aic">
                            <img src="@common/nav4-ac.png" alt="" class="img-40" v-if="url == 'assersRecord'">
                            <img src="@common/nav4.png" alt="" class="img-40" v-else>
                            <span class="fsz-28 fw-b ml-10" :class="{'color-yellow': url == 'assersRecord'}">{{ $t('资产记录') }}</span>
                        </div>
                    </div>
                    
                </div>
            </div>
            <div v-if="isShow" class="menu-mask" @click="isShow = false"></div>
        </div>

    </div>
</template>

<script>
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from 'ethers'
import {
    mapState,
    mapMutations
} from 'vuex'
export default {
    computed: {
        ...mapState(['address']),
    },
    props: ['url'],
    data() {
        return {
            switchAdd: false,
            lang: '',
            langShow: false,
            langList: [{
                name: '简体中文',
                code: 'zh-Hans'
                }, 
                {
                    name: '繁體中文',
                    code: 'zh-Hant'
                },
                {
                    name: 'English',
                    code: 'en'
                },
                {
                    name: '日本語',
                    code: 'ja'
                },
                {
                    name: '한국어',
                    code: 'ko'
                },
                {
                    name: 'Tiếng Việt',
                    code: 'vi'
                },
                {
                    name: 'Bahasa Melayu',
                    code: 'ms'
                },
                {
                    name: 'မြန်မာ',
                    code: 'my'
                },
                {
                    name: 'Русский',
                    code: 'ru'
                },
            ],
            inviteUrl: '',
            isShow: false,
            node_type:0,// 0 没买，1大节点，2小节点
        }
    },
    async mounted() {
        this.lang = localStorage.getItem('lang') || this.$i18n.locale;
        if (typeof window.ethereum !== "undefined") {
            if (this.url !== 'login') {
                await this.getWeb3Init()
            }
            if (this.url !== 'login' && process.env.VUE_APP_CHAIN_ID == 56) {
                await this.switchEthereumChain()
            }
            var provider = await detectEthereumProvider();
            if (!provider) {
                return;
            }
            provider.on("accountsChanged", (accounts) => {
                console.log('========== accountsChanged 事件触发 ==========');
                console.log('新地址 (accounts[0]):', accounts[0]);
                console.log('旧地址 (store):', this.$store.state.address);
                console.log('旧地址 (localStorage):', localStorage.getItem('address'));
                
                const newAddress = accounts[0];
                const oldAddress = this.$store.state.address || localStorage.getItem('address');
                
                // 地址为空，忽略
                if (!newAddress) {
                    console.log('⚠️ 新地址为空，忽略此次事件');
                    return;
                }
                
                // 首次加载，旧地址为空
                if (!oldAddress) {
                    console.log('⚠️ 旧地址为空，可能是首次加载，更新地址');
                    this.$store.commit("setAddress", newAddress);
                    localStorage.setItem('address', newAddress);
                    return;
                }
                
                // 比较地址（忽略大小写）
                if (newAddress.toLowerCase() === oldAddress.toLowerCase()) {
                    console.log('✅ 地址未变更，忽略此次事件');
                    console.log('==========================================');
                    return;
                }
                
                // 地址真的变了
                console.log('❌ 检测到钱包地址变更！');
                console.log('旧地址:', oldAddress);
                console.log('新地址:', newAddress);
                console.log('清除 token 并重新登录...');
                console.log('==========================================');
                
                const hasToken = !!localStorage.getItem('token');
                localStorage.removeItem('token');
                localStorage.removeItem('address');
                this.$store.commit("setAddress", '');
                console.log('this.$route.path:', this.$route.path);
                if(this.$route.path == '/') {
                    this.$store.commit("setAddress", newAddress);
                    localStorage.setItem('address', newAddress);
                    if (hasToken) {
                        window.location.reload();
                    }
                    return;
                }
                this.$go(3,'/login')
            });
        }
        // if(localStorage.getItem('token')){
        //     this.$http.get('/api/users/my').then(res=>{
        //         if(res.code == 200) {
        //             this.node_type = res.data.node_type;
        //         }
        //     });
        // }
    },
    methods: {
        copyCode() {
            this.$copyText(this.inviteUrl).then(() => {
                this.$messageTip.success(this.$t('复制成功'))
            }).catch(() => {
                this.$messageTip.error(this.$t('复制失败'))
            })
        },
        showMenu() {
            this.isShow = true
        },
        closeMenu() {
            this.isShow = false
        },
        changeLang(item) {
            console.log(item);
            localStorage.setItem('lang', item.code);
            this.lang = item.code;
            this.$i18n.locale = item.code;
            this.langShow = false;
            this.$emit('changeLang', item.code);
        },
        // 初始化
        async getWeb3Init() {
            this.erc20 = await this.$dapp.erc20.init('USDT');
            this.$store.commit("setAddress", this.erc20.account)
            localStorage.setItem('address', this.erc20.account)

        },
        // 检查网络链接
        async switchEthereumChain() {
            try {
                let id = process.env.VUE_APP_CHAIN_ID
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{
                        chainId: ethers.utils.hexValue(Number(id))
                    }]
                })
            } catch (e) {
                console.log('没有切换成功，并且e.code == 4902，则添加56');
                if (e.code == 4902) { //添加链
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
                        },],
                    })
                } else {
                    // this.$toast(e.message)
                    throw e
                }
            }
        },

    }
}
</script>

<style scoped lang="less">
.navbar {
    height: 90px;
    .link{
        width: 524px;
        height: 72px;
        background: var(--app-surface);
        border: 2px solid var(--app-border);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 10px;
        margin: 30px auto 80px;
        padding: 0 20px;
        .text-line-1{
            width: 400px;
        }
    }

    .lang {
        width: 100%;
        background: var(--app-surface-strong);
        border-bottom: 1px solid var(--app-border);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 0 0 20px 20px;
        position: fixed;
        top: 88px;
        right: 0;
        z-index: 9;
        overflow: hidden;

        .item {
            height: 80px;
            line-height: 80px;
            text-align: center;
        }

        .ac {
            background: var(--app-primary);
            color: var(--app-text);
        }
    }

    .navbar-box {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 9999;
        width: 750px;
        height: 88px;
        background: linear-gradient(180deg, rgba(5, 7, 12, 0.70) 0%, rgba(5, 7, 12, 0) 100%);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
    }

    .address {
        width: 210px;
        height: 52px;
        color: var(--app-text);
        border-radius: 10px;
        border: 1px solid rgba(141, 194, 255, 0.42);
        background: var(--app-primary);
        margin-left: 20px;
    }

    .logo {
        width: 224px;
        height: 64px;
    }

    .slide-menu {
        position: fixed;
        top: 0;
        left: 0;
        width: 80vw;
        height: 100vh;
        z-index: 9999;
        pointer-events: none;
        .menu-content {
            position: fixed;
            top: 88px;
            right: 0;
            width: 80vw;
            height: 100vh;
            z-index: 10;
            transition: transform 0.3s cubic-bezier(.4,0,.2,1);
            transform: translateX(100%);
            display: flex;
            flex-direction: column;
            pointer-events: auto;
            background: linear-gradient(150deg, rgba(7, 17, 40, 0.98) 0%, rgba(9, 40, 96, 0.96) 100%);
            border-radius: 40px 0px 0px 40px;
            border: 1px solid var(--app-border-strong);
			box-shadow: -16px 0 48px rgba(0, 0, 0, 0.34);
            .menu-list{
                padding: 0 30px;
                .menu-item{
                    height: 150px;
                }
            }
        }
        .menu-show {
            transform: translateX(0);
        }
        .menu-mask {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(1, 4, 12, 0.54);
			backdrop-filter: blur(3px);
			-webkit-backdrop-filter: blur(3px);
            z-index: 9;
            pointer-events: auto;
        }
    }


}
</style>

<template>
    <div class="home-nav-bar-shell">
        <header class="home-nav-bar df-aic-jusb" :class="`home-nav-bar-${theme}`">
            <img src="@img/home-brand-logo.png" alt="AIX-Quant" class="home-nav-bar-logo" />

            <div class="home-nav-bar-actions df-aic">
                <!-- 公共签到入口：未签到为红色，视频签到完成后同步切换绿色状态。 -->
                <button
                    type="button"
                    class="home-nav-bar-action home-nav-bar-checkin"
                    :aria-label="$t('今日签到')"
                    @click="openCheckinPopup"
                >
                    <img :src="checkinStatusIcon" alt="" />
                </button>
                <button
                    type="button"
                    class="home-nav-bar-action home-nav-bar-frosted home-nav-bar-notice df-aic-jucen"
                    :aria-label="$t('公告')"
                    @click="$emit('click-notice')"
                >
                    <img src="@img/home-header-notice.svg" alt="" />
                </button>
                <div
                    v-if="showLanguage"
                    ref="languageDropdown"
                    class="home-nav-bar-language"
                    @click.stop
                >
                    <button
                        type="button"
                        class="home-nav-bar-action home-nav-bar-frosted df-aic-jucen"
                        :aria-label="$t('语言')"
                        aria-haspopup="menu"
                        :aria-expanded="String(showLanguageMenu)"
                        @click="toggleLanguageMenu"
                    >
                        <img src="@img/home-header-language.svg" alt="" />
                    </button>

                    <transition name="home-language-menu">
                        <div
                            v-if="showLanguageMenu"
                            class="home-nav-bar-language-menu"
                            role="menu"
                            :aria-label="$t('语言')"
                        >
                            <button
                                v-for="item in languageOptions"
                                :key="item.code"
                                type="button"
                                class="home-nav-bar-language-option"
                                :class="{ 'is-active': activeLanguage === item.code }"
                                role="menuitem"
                                @click="changeLanguage(item)"
                            >
                                <span>{{ item.name }}</span>
                                <van-icon
                                    v-if="activeLanguage === item.code"
                                    name="success"
                                    size="14"
                                    color="#4C91FF"
                                />
                            </button>
                        </div>
                    </transition>
                </div>
                <!-- 设置 -->
                <button
                    type="button"
                    class="home-nav-bar-action home-nav-bar-frosted home-nav-bar-settings df-aic-jucen"
                    :aria-label="$t('设置')"
                    @click="$router.push('/settings')"
                >
                    <img src="@img/home-header-setup.png" alt="" />
                </button>
            </div>
        </header>

        <checkin-popup
            v-if="showCheckinPopup"
            :video-src="signInfo.video_url || checkinVideoSrc"
            :checked-in="isCheckedIn"
            @watch="openCheckinVideo"
            @video-missing="$emit('checkin-video-missing')"
            @close="showCheckinPopup = false"
        />
    </div>
</template>

<script>
import CheckinPopup from '@/components/checkinPopup'
import checkinPendingIcon from '@img/home-header-profile.png'
import checkinDoneIcon from '@img/asset-header-status.png'

const CHECKIN_VIDEO_INFO_KEY = 'aix-checkin-video-info'
const CHECKIN_SUCCESS_PENDING_KEY = 'aix-checkin-success-pending'
const CHECKIN_SUCCESS_EVENT = 'aix-checkin-success'
// 语言名称使用各自语言的本地写法，切换前也能被用户识别。
const LANGUAGE_OPTIONS = [
    { name: '简体中文', code: 'zh-Hans' },
    { name: '繁體中文', code: 'zh-Hant' },
    { name: 'English', code: 'en' },
    { name: '日本語', code: 'ja' },
    { name: '한국어', code: 'ko' },
    { name: 'Tiếng Việt', code: 'vi' },
    { name: 'Bahasa Melayu', code: 'ms' },
    { name: 'မြန်မာ', code: 'my' },
    { name: 'Русский', code: 'ru' },
]

export default {
    name: 'HomeNavBar',
    components: {
        CheckinPopup,
    },
    props: {
        checkinVideoSrc: {
            type: String,
            default: process.env.VUE_APP_CHECKIN_VIDEO_URL || '',
        },
        showLanguage: {
            type: Boolean,
            default: true,
        },
        theme: {
            type: String,
            default: 'home',
            validator(value) {
                return ['home', 'assets'].includes(value)
            },
        },
    },
    data() {
        return {
            showCheckinPopup: false,
            showLanguageMenu: false,
            languageOptions: LANGUAGE_OPTIONS,
            remoteCheckedIn: null,
            hasJustCompletedCheckin: false,
            signInfo: {
                video_url: '',
                watch_seconds: 0,
            },
        }
    },
    computed: {
        isCheckedIn() {
            if (this.remoteCheckedIn !== null) return this.remoteCheckedIn
            const currentAddress = (this.$store.state.address || '').toLowerCase()
            const checkedInAddress = (this.$store.state.checkedInAddress || '').toLowerCase()
            return this.$store.state.checkedInDate === this.getTodayKey()
                && checkedInAddress === currentAddress
        },
        checkinStatusIcon() {
            return this.isCheckedIn ? checkinDoneIcon : checkinPendingIcon
        },
        activeLanguage() {
            return this.$i18n.locale
        },
    },
    created() {
        window.addEventListener(CHECKIN_SUCCESS_EVENT, this.handleCheckinSuccess)
    },
    async mounted() {
        document.addEventListener('click', this.closeLanguageMenu)
        await this.loadCheckinStatus()
        this.consumeCheckinSuccess()
    },
    beforeDestroy() {
        window.removeEventListener(CHECKIN_SUCCESS_EVENT, this.handleCheckinSuccess)
        document.removeEventListener('click', this.closeLanguageMenu)
    },
    methods: {
        toggleLanguageMenu() {
            this.showLanguageMenu = !this.showLanguageMenu
            this.$emit('click-language')
        },
        closeLanguageMenu() {
            this.showLanguageMenu = false
        },
        changeLanguage(item) {
            if (item.code === this.activeLanguage) {
                this.closeLanguageMenu()
                return
            }
            localStorage.setItem('lang', item.code)
            this.$i18n.locale = item.code
            this.showLanguageMenu = false
            this.$emit('change-language', item.code)
            // 部分接口兜底文案会在 data 初始化时生成；重载当前页可保证它们同步使用新语言。
            this.$nextTick(() => window.location.reload())
        },
        getTodayKey() {
            const date = new Date()
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        },
        async openCheckinPopup() {
            this.closeLanguageMenu()
            this.showCheckinPopup = true
            this.$emit('click-checkin')
            if (!this.isCheckedIn && !this.signInfo.video_url) {
                await this.loadCheckinInfo()
            }
        },
        // 点击签到弹窗中的播放入口后，携带本次接口返回的视频配置进入独立播放页。
        openCheckinVideo() {
            const videoUrl = this.signInfo.video_url || this.checkinVideoSrc
            if (!videoUrl) {
                this.$toast(this.$t('签到视频暂未配置'))
                return
            }

            try {
                sessionStorage.setItem(CHECKIN_VIDEO_INFO_KEY, JSON.stringify({
                    ...this.signInfo,
                    video_url: videoUrl,
                }))
            } catch (error) {
                console.log('缓存签到视频配置失败', error)
            }

            this.showCheckinPopup = false
            this.$router.push({
                name: 'checkinVideo',
                query: { returnTo: this.$route.fullPath },
            })
        },
        // 页面返回或异步签到请求成功后，自动恢复成功态签到弹窗。
        handleCheckinSuccess() {
            this.consumeCheckinSuccess(true)
        },
        consumeCheckinSuccess(force = false) {
            let hasPendingSuccess = false
            try {
                hasPendingSuccess = sessionStorage.getItem(CHECKIN_SUCCESS_PENDING_KEY) === '1'
                if (hasPendingSuccess) sessionStorage.removeItem(CHECKIN_SUCCESS_PENDING_KEY)
            } catch (error) {
                console.log('读取签到成功状态失败', error)
            }

            if (!force && !hasPendingSuccess) return
            this.hasJustCompletedCheckin = true
            this.remoteCheckedIn = true
            this.showCheckinPopup = true
        },
        async loadCheckinStatus() {
            try {
                const res = await this.$http.get('/api/sign_logs/status')
                if (res.code == 200 && !this.hasJustCompletedCheckin) {
                    this.remoteCheckedIn = Boolean(res.data && res.data.signed_today)
                }
            } catch (error) {
                console.log('获取签到状态失败', error)
            }
        },
        async loadCheckinInfo() {
            try {
                const res = await this.$http.get('/api/sign_logs/info')
                if (res.code == 200 && res.data) {
                    this.signInfo = {
                        video_url: res.data.video_url || '',
                        watch_seconds: Number(res.data.watch_seconds) || 0,
                    }
                }
            } catch (error) {
                console.log('获取签到视频失败', error)
            }
        },
    },
}
</script>

<style scoped lang="less">
// 公共固定顶部导航：封装签到状态、签到弹窗与多语言切换。
.home-nav-bar {
    position: fixed;
    top: 0;
    left: 50%;
    z-index: 100;
    width: 750px;
    height: 124px;
    padding: 30px;
    transform: translateX(-50%);
    background: linear-gradient(180deg, rgba(5, 7, 12, 0.94) 0%, rgba(5, 7, 12, 0) 100%);

    &.home-nav-bar-assets {
        background: linear-gradient(180deg, rgba(1, 5, 12, 0.94) 0%, rgba(1, 5, 12, 0) 100%);
    }

    .home-nav-bar-logo {
        width: 224px;
        height: 64px;
    }

    .home-nav-bar-actions {
        gap: 12px;

        .home-nav-bar-language {
            position: relative;
            display: flex;
            flex: 0 0 64px;
            width: 64px;
            height: 64px;

            .home-nav-bar-language-menu {
                position: absolute;
                top: 78px;
                left: 50%;
                z-index: 3;
                display: flex;
                flex-direction: column;
                width: 240px;
                padding: 12px;
                box-sizing: border-box;
                border: 1px solid rgba(255, 255, 255, 0.14);
                border-radius: 18px;
                transform: translateX(-50%);
                background: rgba(20, 27, 39, 0.96);
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.38);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);

                &::before {
                    position: absolute;
                    top: -8px;
                    left: 50%;
                    width: 14px;
                    height: 14px;
                    border-top: 1px solid rgba(255, 255, 255, 0.14);
                    border-left: 1px solid rgba(255, 255, 255, 0.14);
                    transform: translateX(-50%) rotate(45deg);
                    background: rgba(20, 27, 39, 0.96);
                    content: '';
                }

                .home-nav-bar-language-option {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    min-height: 52px;
                    padding: 8px 14px;
                    box-sizing: border-box;
                    border: 0;
                    border-radius: 10px;
                    outline: 0;
                    background: transparent;
                    color: rgba(255, 255, 255, 0.72);
                    font-size: 22px;
                    line-height: 30px;
                    text-align: left;

                    &.is-active {
                        background: rgba(54, 118, 255, 0.16);
                        color: #FFFFFF;
                    }

                    &:active {
                        background: rgba(255, 255, 255, 0.10);
                    }
                }
            }
        }

        .home-nav-bar-action {
            position: relative;
            width: 64px;
            height: 64px;
            margin: 0;
            padding: 0;
            border: 0;
            outline: 0;
            appearance: none;
            -webkit-appearance: none;
            background: transparent;

            &.home-nav-bar-checkin img {
                display: block;
                width: 64px;
                height: 64px;
                object-fit: contain;
            }

            // Figma 外圈：黑色半透明底、白色弱描边和背景磨砂均由 CSS 绘制。
            &.home-nav-bar-frosted {
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.10);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);

                &::before {
                    position: absolute;
                    inset: -1px;
                    border: 1px solid rgba(255, 255, 255, 0.20);
                    border-radius: 50%;
                    content: '';
                    pointer-events: none;
                }

                img {
                    display: block;
                    width: 44px;
                    height: 44px;
                }
            }

            // 未读红点为独立 CSS 元素，不包含在铃铛资源中。
            &.home-nav-bar-notice::after {
                position: absolute;
                top: 15px;
                left: 40px;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #FF0000;
                content: '';
                pointer-events: none;
            }

            &.home-nav-bar-settings img {
                width: 36px;
                height: 34px;
            }
        }
    }
}

.home-language-menu-enter-active,
.home-language-menu-leave-active {
    transform-origin: top center;
    transition: opacity 0.18s ease, transform 0.18s ease;
}

.home-language-menu-enter,
.home-language-menu-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-8px) scale(0.96) !important;
}
</style>

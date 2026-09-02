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
                <button
                    v-if="showLanguage"
                    type="button"
                    class="home-nav-bar-action home-nav-bar-frosted df-aic-jucen"
                    :aria-label="$t('语言')"
                    @click="$emit('click-language')"
                >
                    <img src="@img/home-header-language.svg" alt="" />
                </button>
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
            :poster-src="signInfo.cover_url"
            :intro="signInfo.intro"
            :watch-seconds="signInfo.watch_seconds"
            :checked-in="isCheckedIn"
            :signing="isSignSubmitting"
            @success="completeCheckin"
            @video-missing="$emit('checkin-video-missing')"
            @close="showCheckinPopup = false"
        />
    </div>
</template>

<script>
import CheckinPopup from '@/components/checkinPopup'
import checkinPendingIcon from '@img/home-header-profile.png'
import checkinDoneIcon from '@img/asset-header-status.png'

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
            remoteCheckedIn: null,
            isSignSubmitting: false,
            signInfo: {
                video_url: '',
                cover_url: '',
                intro: '',
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
    },
    mounted() {
        this.loadCheckinStatus()
    },
    methods: {
        getTodayKey() {
            const date = new Date()
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        },
        async openCheckinPopup() {
            this.showCheckinPopup = true
            this.$emit('click-checkin')
            if (!this.isCheckedIn && !this.signInfo.video_url) {
                await this.loadCheckinInfo()
            }
        },
        async loadCheckinStatus() {
            try {
                const res = await this.$http.get('/api/sign_logs/status')
                if (res.code == 200) {
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
                        cover_url: res.data.cover_url || '',
                        intro: res.data.intro || '',
                        watch_seconds: Number(res.data.watch_seconds) || 0,
                    }
                }
            } catch (error) {
                console.log('获取签到视频失败', error)
            }
        },
        async completeCheckin() {
            if (this.isSignSubmitting || this.isCheckedIn) return
            this.isSignSubmitting = true
            try {
                const res = await this.$http.post('/api/sign_logs')
                if (res.code == 200) {
                    this.remoteCheckedIn = true
                    this.$store.commit('setCheckedIn', {
                        date: this.getTodayKey(),
                        address: this.$store.state.address || '',
                    })
                    this.$emit('checkin-success', res.data)
                    return
                }
                this.$toast(this.$t('签到失败'))
            } catch (error) {
                console.log('提交签到失败', error)
                this.$toast(this.$t('签到失败'))
            } finally {
                this.isSignSubmitting = false
            }
        },
    },
}
</script>

<style scoped lang="less">
// 公共固定顶部导航：封装签到状态及签到弹窗，消息和语言行为由页面处理。
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
</style>

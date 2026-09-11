<template>
    <main class="app-download-page">
        <van-nav-bar
            :title="pageTitle"
            :fixed="true"
            :placeholder="true"
            :border="false"
            z-index="99"
            @click-left="$go(1, 1)"
        >
            <template #left>
                <span class="account-binding-back df-aic-jucen">
                    <van-icon name="arrow-left" size="20" color="#fff" />
                </span>
            </template>
        </van-nav-bar>
        <img :src="downloadBackground" alt="" class="app-download-background" />

        <div class="app-download-actions">
            <button
                type="button"
                class="app-download-action"
                :aria-label="$t('下载APP')"
                @click="startDownload('android')"
            >
                <img :src="androidDownloadButton" alt="" />
            </button>
            <button
                type="button"
                class="app-download-action"
                :aria-label="$t('下载APP')"
                @click="startDownload('ios')"
            >
                <img :src="iosDownloadButton" alt="" />
            </button>
        </div>
    </main>
</template>

<script>
import downloadBackground from '@img/qidong.jpg'
import androidDownloadButton from '@img/down2.png'
import iosDownloadButton from '@img/down3.png'

export default {
    name: 'AppDownload',
    data() {
        return {
            downloadBackground,
            androidDownloadButton,
            iosDownloadButton,
        }
    },
    methods: {
        getDownloadUrl(platform) {
            const value = platform === 'android'
                ? process.env.VUE_APP_ANDROID_DOWNLOAD_URL
                : process.env.VUE_APP_IOS_DOWNLOAD_URL
            return typeof value === 'string' ? value.trim() : ''
        },
        startDownload(platform) {
            const downloadUrl = this.getDownloadUrl(platform)
            if (!downloadUrl) {
                this.$toast(this.$t('下载地址暂未配置'))
                return
            }
            window.location.assign(downloadUrl)
        },
    },
}
</script>

<style scoped lang="less">
.app-download-page {
    position: relative;
    width: 750px;
    min-height: 100vh;
    min-height: 100dvh;
    margin: 0 auto;
    overflow: hidden;
    background: #02071A;

    .app-download-background {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center top;
        pointer-events: none;
        user-select: none;
    }

    .app-download-actions {
        position: fixed;
        bottom: calc(100px + env(safe-area-inset-bottom));
        left: 50%;
        z-index: 1;
        display: flex;
        width: 510px;
        flex-direction: column;
        gap: 24px;
        transform: translateX(-50%);
    }

    .app-download-action {
        display: block;
        width: 510px;
        height: 102px;
        margin: 0;
        padding: 0;
        overflow: hidden;
        border: 0;
        border-radius: 51px;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;

        img {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        &:active {
            transform: scale(0.98);
        }
    }
}
</style>

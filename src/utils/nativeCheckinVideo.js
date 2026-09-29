// 新版 App 声明能力后才转交原生播放器，旧版 App 与浏览器保持 HTML 视频播放。
export const NATIVE_CHECKIN_VIDEO_EVENT = 'aix-native-checkin-video'

export function supportsNativeCheckinVideo() {
    return typeof window !== 'undefined'
        && window.__AIX_NATIVE_CHECKIN_VIDEO__ === 1
        && typeof window.sendMessageToFlutter === 'function'
}

export function sendNativeCheckinVideo(message) {
    if (!supportsNativeCheckinVideo()) throw new Error('Native check-in video bridge is unavailable')
    window.sendMessageToFlutter(JSON.stringify(message))
}

export function createNativeCheckinRequestId() {
    return 'checkin-' + Date.now() + '-' + Math.random().toString(36).slice(2)
}

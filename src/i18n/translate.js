import messages from './index.js'

const DEFAULT_LOCALE = 'zh-Hans'

// Vue 组件外（axios、filter、DApp）使用的轻量翻译入口。
export function translate(key, params = {}) {
    const savedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : ''
    const locale = messages[savedLocale] ? savedLocale : DEFAULT_LOCALE
    const fallbackMessages = messages[DEFAULT_LOCALE] || {}
    let text = messages[locale][key] || fallbackMessages[key] || key

    Object.keys(params).forEach(name => {
        text = text.split(`{${name}}`).join(String(params[name]))
    })

    return text
}

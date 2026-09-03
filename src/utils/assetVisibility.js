const ASSET_VISIBILITY_STORAGE_KEY = 'aix-asset-visibility'

// 首页与资产页共用资产隐私开关；首次访问默认展示资产。
export function getAssetVisibility() {
    try {
        const value = localStorage.getItem(ASSET_VISIBILITY_STORAGE_KEY)
        return value === null ? true : value === 'true'
    } catch (error) {
        console.log('读取资产显示状态失败', error)
        return true
    }
}

export function setAssetVisibility(isVisible) {
    const value = Boolean(isVisible)
    try {
        localStorage.setItem(ASSET_VISIBILITY_STORAGE_KEY, String(value))
    } catch (error) {
        console.log('保存资产显示状态失败', error)
    }
    return value
}

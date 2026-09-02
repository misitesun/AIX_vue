import Vue from 'vue'
import MessageTip from '@/components/MessageTip.vue'
/**
 * 
 * 调用方式：
 * this.$messageTip.success('操作成功！')
 * this.$messageTip.error('操作失败，请重试')
 * this.$messageTip.warning('请注意相关风险')
 * this.$messageTip.info('这是一条普通信息')
 */

// 创建消息提示实例
let messageInstance = null

// 创建消息提示组件实例
function createMessageInstance() {
    if (messageInstance) {
        return messageInstance
    }

    const MessageTipConstructor = Vue.extend(MessageTip)
    messageInstance = new MessageTipConstructor({
        el: document.createElement('div')
    })

    // 将组件添加到body
    document.body.appendChild(messageInstance.$el)

    return messageInstance
}

// 消息提示方法
function messageTip(options) {
    const instance = createMessageInstance()

    // 如果传入的是字符串，则作为消息内容
    if (typeof options === 'string') {
        options = {
            message: options,
            type: 'info'
        }
    }

    // 默认配置
    const defaultOptions = {
        message: '',
        type: 'info',
        duration: 3000
    }

    // 合并配置
    const finalOptions = { ...defaultOptions, ...options }

    // 显示消息
    instance.show(finalOptions)

    return instance
}

// 快捷方法
messageTip.success = (message, duration = 3000) => {
    return messageTip({
        message,
        type: 'success',
        duration
    })
}

messageTip.error = (message, duration = 3000) => {
    return messageTip({
        message,
        type: 'error',
        duration
    })
}

messageTip.warning = (message, duration = 3000) => {
    return messageTip({
        message,
        type: 'warning',
        duration
    })
}

messageTip.info = (message, duration = 3000) => {
    return messageTip({
        message,
        type: 'info',
        duration
    })
}

// 手动关闭消息
messageTip.close = () => {
    if (messageInstance) {
        messageInstance.hide()
    }
}

export default messageTip

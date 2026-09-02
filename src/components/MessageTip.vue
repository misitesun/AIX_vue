<template>
  <transition name="slide-right">
    <div v-if="visible" class="message-tip" :class="[`message-tip--${type}`]">
      <div class="message-tip__icon">
        <i v-if="type === 'success'" class="icon-success">✓</i>
        <i v-else-if="type === 'error'" class="icon-error">✕</i>
        <i v-else-if="type === 'warning'" class="icon-warning">⚠</i>
      </div>
      <div class="message-tip__content">
        <div class="message-tip__text">{{ message }}</div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'MessageTip',
  data() {
    return {
      visible: false,
      message: '',
      type: 'info', // success, error, warning, info
      duration: 3000,
      timer: null
    }
  },
  methods: {
    show(options = {}) {
      this.message = options.message || ''
      this.type = options.type || 'info'
      this.duration = options.duration || 3000
      
      this.visible = true
      
      // 清除之前的定时器
      if (this.timer) {
        clearTimeout(this.timer)
      }
      
      // 设置自动隐藏
      this.timer = setTimeout(() => {
        this.hide()
      }, this.duration)
    },
    
    hide() {
      this.visible = false
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
    }
  },
  
  beforeDestroy() {
    if (this.timer) {
      clearTimeout(this.timer)
    }
  }
}
</script>

<style lang="less" scoped>
.message-tip {
  position: fixed;
  top: 150px;
  right: 30px;
  transform: translateY(-50%);
  z-index: 9999;
  min-width: 250px;
  max-width: 450px;
  padding: 24px 28px;
  border-radius: 16px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 20px;
  
  &--success {
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }
  
  &--error {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
  
  &--warning {
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #f59e0b;
  }
  
  &--info {
    background: rgba(59, 130, 246, 0.15);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }
  
  &__icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 28px;
    font-weight: bold;
    
    .icon-success {
      // background: rgba(34, 197, 94, 0.2);
    }
    
    .icon-error {
      // background: rgba(239, 68, 68, 0.2);
    }
    
    .icon-warning {
      // background: rgba(245, 158, 11, 0.2);
    }
  }
  
  &__content {
    flex: 1;
    min-width: 0;
  }
  
  &__text {
    font-size: 28px;
    line-height: 1.4;
    word-break: break-word;
  }
}

// 从右向左滑入动画
.slide-right-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}

.slide-right-enter {
  transform: translateY(-50%) translateX(100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateY(-50%) translateX(100%);
  opacity: 0;
}

.slide-right-enter-to,
.slide-right-leave {
  transform: translateY(-50%) translateX(0);
  opacity: 1;
}
</style>

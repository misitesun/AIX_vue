<template>
    <div ref="vantaRef" class="flame-background"></div>
  </template>
  
  <script>
  import * as THREE from 'three'
  // 使用蓝黑雾化层，作为所有页面的低干扰科技背景。
  import FOG from 'vanta/dist/vanta.fog.min'
  
  export default {
    name: "FlameBackground",
    data() {
      return {
        vantaEffect: null
      }
    },
    mounted() {
      this.initVanta()
    },
    beforeDestroy() {
      if (this.vantaEffect) {
        this.vantaEffect.destroy()
      }
    },
    methods: {
      initVanta() {
        try {
          this.vantaEffect = FOG({
            el: this.$refs.vantaRef,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200,
            minWidth: 200,
            highlightColor: 0x2979ff,
            midtoneColor: 0x0d347f,
            lowlightColor: 0x071534,
            baseColor: 0x05070c,
            blurFactor: 0.95,
            speed: 1.2,
            zoom: 0.8
          })
        } catch (error) {
          console.error("Vanta Init Error:", error)
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .flame-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    opacity: 0.62;
  }
  </style>

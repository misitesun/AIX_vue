<template>
  <div id="particles-js"></div>
</template>

<script>
export default {
  name: 'ParticlesBackground',
  mounted() {
    this.initParticles();
  },
  methods: {
    // 白色圆点配置
    initParticles() {
      if (window.particlesJS) {
        window.particlesJS('particles-js', {
          particles: {
            number: {
              value: 160,
              density: {
                enable: true,
                value_area: 800
              }
            },
            color: {
              value: '#ffffff'
            },
            shape: {
              type: 'circle',
            },
            opacity: {
              value: 0.8,              // 提高透明度：0.5 → 0.8 (更明显)
              random: true,
              anim: {
                enable: true,
                speed: 1,
                opacity_min: 0.3,      // 最小透明度：0.1 → 0.3 (不会太暗)
                sync: false
              }
            },
            size: {
              value: 3,                // 增大粒子：2 → 4 (更明显)
              random: true,
              anim: {
                enable: false,
                speed: 5,
                size_min: 1,           // 最小尺寸：1 → 2 (保证可见)
                sync: false
              }
            },
            line_linked: {
              enable: false,
              distance: 100,
              color: '#ffffff',
              opacity: 1,
              width: 1
            },
            move: {
              enable: true,
              speed: 0.5,
              direction: 'none',
              random: false,
              straight: false,
              out_mode: 'out',
              bounce: false,
              attract: {
                enable: false,
                rotateX: 600,
                rotateY: 1200
              }
            }
          },
          interactivity: {
            detect_on: 'canvas',
            events: {
              onhover: {
                enable: true,
                mode: 'bubble'
              },
              onclick: {
                enable: true,
                mode: 'repulse'
              },
              resize: true
            },
            modes: {
              grab: {
                distance: 400,
                line_linked: {
                  opacity: 1
                }
              },
              bubble: {
                distance: 250,
                size: 0,
                duration: 2,
                opacity: 0,
                speed: 3
              },
              repulse: {
                distance: 400,
                duration: 0.4
              },
              push: {
                particles_nb: 4
              },
              remove: {
                particles_nb: 2
              }
            }
          },
          retina_detect: true
        });
      }
    }
  }
};
</script>

<style scoped>
#particles-js {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
</style>


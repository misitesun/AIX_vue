<template>
	<div id="app" class="app">
		<keep-alive :include="keepAliveInclude">
			<transition name="fade" mode="out-in">
			<router-view class="router-view" />
			</transition>
		</keep-alive>
		<!-- 全局账号安全门禁：邮箱和钱包登录均必须先绑定谷歌验证器。 -->
		<div
			v-if="googleBindingRequired"
			class="app-google-binding-required-overlay"
			role="dialog"
			aria-modal="true"
			@touchmove.prevent
		>
			<section class="app-google-binding-required-panel">
				<span class="app-google-binding-required-icon df-aic-jucen">
					<van-icon name="shield-o" size="48" color="#4C91FF" />
				</span>
				<h2>{{ $t('谷歌验证器未绑定') }}</h2>
				<p>{{ $t('为了保障您的账户安全，请先绑定谷歌验证器后继续使用') }}</p>
				<button type="button" @click="goBindGoogleAuthenticator">
					{{ $t('立即绑定') }}
				</button>
			</section>
		</div>
        <!-- <FlameBackground /> -->
	</div>
</template>
<script>
    import FlameBackground from '@/components/FlameBackground.vue';
	export default {
		name: 'App',
		components: {
            FlameBackground
        },
		data() {
			return {
				keepAliveInclude: [],
				googleBindingRequired: false,
				googleBindingRequestId: 0,
				previousBodyOverflow: '',
			}
		},
		created() {
            if(!localStorage.getItem('lang')) {
                localStorage.setItem('lang', 'zh-Hans')
            }
		},
		watch: {
			'$route': {
				immediate: true,
				handler() {
					this.checkGoogleBindingRequirement()
				},
			},
			googleBindingRequired(value) {
				if (value) {
					this.previousBodyOverflow = document.body.style.overflow
					document.body.style.overflow = 'hidden'
					return
				}
				document.body.style.overflow = this.previousBodyOverflow
			},
		},
        // iOS Safari 的地址栏会动态改变可视区域；使用 visualViewport 同步真实高度，
        // 防止首页滚动到底部时露出应用根背景。
        mounted() {
            this.syncViewportHeight()
            window.addEventListener('resize', this.syncViewportHeight)
            window.addEventListener('orientationchange', this.syncViewportHeight)
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', this.syncViewportHeight)
            }
        },
        beforeDestroy() {
			this.googleBindingRequestId += 1
			document.body.style.overflow = this.previousBodyOverflow
            window.removeEventListener('resize', this.syncViewportHeight)
            window.removeEventListener('orientationchange', this.syncViewportHeight)
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', this.syncViewportHeight)
            }
        },
        methods: {
			async checkGoogleBindingRequirement() {
				const requestId = ++this.googleBindingRequestId
				const route = this.$route
				const hasToken = Boolean(localStorage.getItem('token'))
				const isPublicRoute = route.matched.some(record => record.meta && record.meta.public)
				const isGoogleSetupRoute = route.name === 'googleAuthenticator'

				if (!hasToken || isPublicRoute || isGoogleSetupRoute) {
					this.googleBindingRequired = false
					return
				}

				const tokenAtRequest = localStorage.getItem('token')
				try {
					const res = await this.$http.get('/api/users/my')
					if (requestId !== this.googleBindingRequestId) return
					if (tokenAtRequest !== localStorage.getItem('token')) return
					if (res.code == 200 && res.data) {
						const enabled = res.data.google_2fa_enabled
						const isGoogleBound = enabled === true
							|| enabled === 1
							|| enabled === '1'
							|| enabled === 'true'
						this.googleBindingRequired = !isGoogleBound
					}
				} catch (error) {
					if (requestId === this.googleBindingRequestId) {
						this.googleBindingRequired = false
					}
					console.log('全局谷歌验证器绑定状态加载失败', error)
				}
			},
			goBindGoogleAuthenticator() {
				this.$router.push({
					name: 'googleAuthenticator',
					query: { forced: '1' },
				})
			},
            syncViewportHeight() {
                const viewport = window.visualViewport
                const height = viewport && viewport.height ? viewport.height : window.innerHeight
                if (height) {
                    document.documentElement.style.setProperty('--app-viewport-height', `${Math.round(height)}px`)
                }
            },
        },
	}
</script>
<style lang="less">
	@import './assets/css/vantInit.less';

	:root {
		/* Figma 首页（28585:3146）对应的深蓝科技主题色板 */
		--app-bg: #05070C;
		--app-bg-elevated: #0A1224;
		--app-surface: rgba(255, 255, 255, 0.10);
		--app-surface-strong: rgba(13, 25, 52, 0.88);
		--app-surface-input: rgba(255, 255, 255, 0.06);
		--app-border: rgba(255, 255, 255, 0.20);
		--app-border-strong: rgba(76, 145, 255, 0.56);
		--app-primary: #1261F3;
		--app-primary-strong: #2979FF;
		--app-primary-light: #4C91FF;
		--app-primary-gradient: linear-gradient(90deg, #1261F3 0%, #2979FF 52%, #4C91FF 100%);
		--app-text: #FFFFFF;
		--app-text-secondary: #B8C3D4;
		--app-text-muted: rgba(255, 255, 255, 0.50);
		--app-text-disabled: rgba(255, 255, 255, 0.30);
		--app-danger: #FF5F57;
		--app-success: #27C840;
		--app-warning: #FF5100;
		/* JS 会在运行时同步为 visualViewport.height，初始值兼容旧浏览器。 */
		--app-viewport-height: 100vh;
	}

	*{box-sizing: border-box;}
	
	// 设置 html 和 body 的背景色，防止下拉刷新时显示白色
	html, body {
		background: var(--app-bg);
		color: var(--app-text);
		color-scheme: dark;
		margin: 0;
		padding: 0;
		height: 100%;
		// 防止过度滚动
		overscroll-behavior: none;
		-webkit-overflow-scrolling: touch;
	}
	
	#app {
		min-height: var(--app-viewport-height, 100vh);
		background:
			radial-gradient(circle at 88% 4%, rgba(18, 97, 243, 0.20) 0%, rgba(18, 97, 243, 0) 32%),
			var(--app-bg);
		margin: 0;
		padding: 0;
		color: var(--app-text);
		box-sizing: border-box;
		-webkit-tap-highlight-color: transparent;
		cursor: pointer;
		font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
		line-height: 1;
		font-size: 22px;
        position: relative;
        z-index: 2;

		.router-view {
			position: relative;
			z-index: 1;
			min-height: var(--app-viewport-height, 100vh);
		}

		.df {
			display: flex;
		}

		.df-aic {
			display: flex;
			align-items: center;
		}

		.df-aic-jusb {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.df-aic-jucen {
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.text-center{text-align: center;}
		.text-left{text-align: left;}
		.text-right{text-align: right;}
		.fw-b{font-weight: bold;}
		// 移除手动编写的字体大小类，改用上面的 mixin 生成
		// 保留原有 class 名，统一映射到新色板，避免各业务页面同时改动。
		.color-000{color: var(--app-bg);}
		.color-fff{color: var(--app-text);}
		.color-red{color: var(--app-danger);}
		.color-999{color: #8995A9;}
		.color-666{color: #657188;}
		.color-8c8c{color: #8F9CAF;}
		.color-9f9f{color: #A7B3C7;}
		.color-lv{color: var(--app-success);}
		.color-blue{color: var(--app-primary-strong);}
		.color-main{color: var(--app-primary-light);}
        .color-yellow{color: var(--app-primary);}
        .color-ff5{color: var(--app-text-muted);}
        .color-orange{color: var(--app-warning);}
		// 文字渐变
		.color-main-transparent{
			display: inline-block;
			background: var(--app-primary-gradient);
			-webkit-background-clip: text;
			background-clip: text;
			-webkit-text-fill-color: transparent;
			color: transparent;
            
		}
		// 毛玻璃
		.glass-bg{
			background: var(--app-surface);
            backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
		}
		.line-h-1{
			line-height: 1.6;
		}
		input{
			flex: 1;
			height: 100%;
			font-size: 26px;
			background: transparent;
			border: none;
			outline: none;
			color: var(--app-text);
		}
		input::placeholder,
		textarea::placeholder {
			color: var(--app-text-muted);
		}
		//文本隐藏
		.text-line-1 {
		    overflow: hidden;
		    white-space: nowrap;
		    text-overflow: ellipsis;
		}
		.text-line-2 {
		    -webkit-line-clamp: 2;
		    --webkit-line-clamp: 2;
		}
		.text-line-3 {
		    -webkit-line-clamp: 3;
		    --webkit-line-clamp: 3;
		}
		.text-line-4 {
		    -webkit-line-clamp: 4;
		    --webkit-line-clamp: 4;
		}
		.text-line-5 {
		    -webkit-line-clamp: 5;
		    --webkit-line-clamp: 5;
		}
		.text-line-2, .text-line-3, .text-line-4, .text-line-5 {
		    overflow: hidden;
			word-break: break-all;
		    text-overflow: ellipsis; 
		    display: -webkit-box;
		    -webkit-box-orient: vertical;
		    line-clamp: var(--webkit-line-clamp);
		    -webkit-box-orient: vertical;
		}
		
	}

	/* 定义过渡类 */
	.fade-enter-active, .fade-leave-active {
	  transition: opacity 0.3s;
	}
	.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
	  opacity: 0;
	}
	
	// 原有的字体大小类保持兼容（使用px单位）
	.generate-font-sizes(@start: 10, @end: 200, @step: 2) when (@start <= @end) {
	  .fsz-@{start} {
	    font-size: @start * 1px;
	  }
	  .img-@{start} {
	    width: @start * 1px;
	    height: @start * 1px;
	  }
	  .ml-@{start} {
		margin-left: @start * 1px;
	  }
	  .mr-@{start} {
		margin-right: @start * 1px;
	  }
	  .mt-@{start} {
		margin-top: @start * 1px;
	  }
	  .mb-@{start} {
		margin-bottom: @start * 1px;
	  }
	  .pl-@{start} {
		padding-left: @start * 1px;
	  }
	  .pr-@{start} {
		padding-right: @start * 1px;
	  }
	  .pt-@{start} {
		padding-top: @start * 1px;
	  }
	  .pb-@{start} {
		padding-bottom: @start * 1px;
	  }
	  .generate-font-sizes(@start + @step, @end, @step);
	}
	
	// 调用 mixin 生成所有类名 (20px, 22px, 24px ... 60px)
	.generate-font-sizes();
	
	// 通用按钮 点击效果
	.common-btn {
		transition: transform 0.2s;
		user-select: none;
        background: var(--app-primary);
        border: 1px solid rgba(141, 194, 255, 0.42);
        border-radius: 999px;
		box-shadow: 0 10px 24px rgba(18, 97, 243, 0.28);
        color: var(--app-text);
	}
	.common-btn:active {
		transform: scale(0.95);
	}

    .common-card{
        width: 690px;
        padding: 30px;
        background: var(--app-surface);
        border: 2px solid var(--app-border);
        backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
        border-radius: 40px;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
        margin: auto;
    }

	// 公共输入框聚焦态：充值、提现、划转与登录页保持一致
	.common-input-focus {
		position: relative;

		&::after {
			content: '';
			position: absolute;
			z-index: 3;
			top: var(--common-input-focus-top, 0);
			right: var(--common-input-focus-right, 0);
			bottom: var(--common-input-focus-bottom, 0);
			left: var(--common-input-focus-left, 0);
			border: 2px solid transparent;
			border-radius: 20px;
			box-shadow: 0 4px 20px rgba(0, 140, 255, 0);
			pointer-events: none;
			transition: border-color 0.2s ease, box-shadow 0.2s ease;
		}

		&:focus-within::after {
			border-color: var(--app-primary);
			box-shadow: 0 4px 20px rgba(0, 140, 255, 0.20);
		}
	}

    .transfer-popup{
        width: 590px;
        border-radius: 37px;
        background: var(--app-surface-strong);
		border: 1px solid var(--app-border);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px); // 兼容部分移动端  
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.42);
        color: var(--app-text);
        padding: 30px;
        .value{
            padding: 0 30px;
            height: 80px;
            background: var(--app-surface-input);
            border: 1px solid var(--app-border);
            border-radius: 20px;
        }
        .btn1{
            width: 255px;
            height: 76px;
            border: 1px solid var(--app-border-strong);
            border-radius: 38px;
        }
        .btn2{
            width: 255px;
            height: 76px;
			background: var(--app-primary);
			border-radius: 38px;
            color: var(--app-text);
        }

    }
	.app-google-binding-required-overlay {
		position: fixed;
		top: 0;
		left: 50%;
		z-index: 1000;
		display: flex;
		width: 750px;
		height: var(--app-viewport-height, 100dvh);
		align-items: center;
		justify-content: center;
		padding: 30px;
		transform: translateX(-50%);
		background: rgba(0, 3, 12, 0.82);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);

		.app-google-binding-required-panel {
			width: 630px;
			padding: 64px 50px 50px;
			border: 2px solid #1B6CFF;
			border-radius: 36px;
			background: linear-gradient(180deg, rgba(7, 27, 67, 0.98) 0%, rgba(1, 10, 31, 0.98) 100%);
			box-shadow: 0 22px 70px rgba(0, 74, 255, 0.28);
			text-align: center;

			.app-google-binding-required-icon {
				width: 112px;
				height: 112px;
				margin: 0 auto 34px;
				border: 2px solid rgba(76, 145, 255, 0.72);
				border-radius: 50%;
				background: radial-gradient(circle, rgba(36, 116, 255, 0.28) 0%, rgba(3, 18, 49, 0.92) 72%);
				box-shadow: 0 0 32px rgba(46, 132, 255, 0.42);
			}

			h2 {
				margin: 0;
				color: #FFFFFF;
				font-size: 38px;
				font-weight: 600;
				line-height: 54px;
			}

			p {
				margin: 28px 0 46px;
				color: #AAB7CD;
				font-size: 26px;
				line-height: 42px;
			}

			button {
				width: 530px;
				height: 88px;
				border: 0;
				border-radius: 999px;
				background: linear-gradient(90deg, #1261F3 0%, #287BFF 100%);
				box-shadow: 0 12px 28px rgba(18, 97, 243, 0.28);
				color: #FFFFFF;
				font-size: 30px;
				font-weight: 600;
				line-height: 42px;

				&:active {
					transform: scale(0.98);
				}
			}
		}
	}

	
</style>

<template>
	<div id="app" class="app">
		<keep-alive :include="keepAliveInclude">
			<transition name="fade" mode="out-in">
			<router-view class="router-view" />
			</transition>
		</keep-alive>
        <FlameBackground />
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
			}
		},
		created() {
            if(!localStorage.getItem('lang')) {
                localStorage.setItem('lang', 'zh-Hans')
            }
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
		min-height: 100vh;
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
			min-height: 100vh;
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
	
</style>

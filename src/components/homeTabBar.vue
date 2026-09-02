<template>
    <nav class="home-tab-bar df-aic-jusb" :aria-label="$t('首页')">
        <button
            type="button"
            class="home-tab-bar-item df-aic-jucen"
            :class="{ active: active === 'index' }"
            :aria-current="active === 'index' ? 'page' : null"
            @click="$emit('change', 'index')"
        >
            <img v-if="active === 'index'" src="@img/home-nav-home.png" alt="" />
            <span>{{ $t('首页') }}</span>
        </button>
        <button
            type="button"
            class="home-tab-bar-item df-aic-jucen"
            :class="{ active: active === 'node' }"
            :aria-current="active === 'node' ? 'page' : null"
            @click="$emit('change', 'node')"
        >
            <img v-if="active === 'node'" src="@img/node-tab-active.svg" alt="" />
            <span>{{ $t('节点') }}</span>
        </button>
        <button
            type="button"
            class="home-tab-bar-item df-aic-jucen"
            :class="{ active: active === 'assets' }"
            :aria-current="active === 'assets' ? 'page' : null"
            @click="$emit('change', 'assets')"
        >
            <img v-if="active === 'assets'" src="@img/asset-nav-active.svg" alt="" />
            <span>{{ $t('资产') }}</span>
        </button>
        <button
            type="button"
            class="home-tab-bar-item df-aic-jucen"
            :class="{ active: active === 'mine' }"
            :aria-current="active === 'mine' ? 'page' : null"
            @click="$emit('change', 'mine')"
        >
            <img v-if="active === 'mine'" src="@img/mine-tab-active.svg" alt="" />
            <span>{{ $t('我的') }}</span>
        </button>
    </nav>
</template>

<script>
export default {
    name: 'HomeTabBar',
    props: {
        active: {
            type: String,
            default: 'index',
            validator(value) {
                return ['index', 'node', 'assets', 'mine'].includes(value)
            },
        },
    },
}
</script>

<style scoped lang="less">
// 首页底部 TabBar：固定悬浮在视口底部，组件统一处理位置、视觉与选中态。
.home-tab-bar {
    position: fixed;
    left: 50%;
    bottom: 30px;
    z-index: 99;
    width: 690px;
    height: 98px;
    padding: 0 20px;
    transform: translateX(-50%);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.10);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    .home-tab-bar-item {
        width: 152px;
        height: 70px;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 999px;
        outline: 0;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.80);
        font-family: inherit;
        font-size: 28px;
        font-weight: 500;
        line-height: 39px;

        &.active {
            height: 78px;
            gap: 8px;
            background: #1261F3;
            color: #FFFFFF;
            font-size: 24px;
            line-height: 34px;

            img {
                width: 52px;
                height: 52px;
            }
        }
    }
}
</style>

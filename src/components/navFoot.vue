<template>
    <footer>
        <div class="box df-aic-jusb pl-60 pr-60">
            <div class="item text-center" :class="{active: active === 'index'}" @click="$go(2, 'index')">
                <img src="@common/navFootHomeActive.svg" alt="" class="img-40 home-active-icon" v-if="active === 'index'">
                <img src="@common/navFoot1.png" alt="" class="img-40" v-else>
                <div class="fsz-24 mt-10" :class="{active: active === 'index'}">{{ $t('首页') }}</div>
            </div>
            <div class="item text-center" :class="{active: active === 'swap'}" @click="$go(2, 'swap')">
                <img src="@common/navFoot4Ac.png" alt="" class="img-40" v-if="active === 'swap'">
                <img src="@common/navFoot4.png" alt="" class="img-40" v-else>
                <div class="fsz-24 mt-10" :class="{active: active === 'swap'}">{{ $t('闪兑') }}</div>
            </div>
            <div class="item text-center" :class="{active: active === 'team'}" @click="$go(2, 'team')">
                <img src="@common/navFoot2Ac.png" alt="" class="img-40" v-if="active === 'team'">
                <img src="@common/navFoot2.png" alt="" class="img-40" v-else>
                <div class="fsz-24 mt-10" :class="{active: active === 'team'}">{{ $t('团队') }}</div>
            </div>
            <div class="item text-center" :class="{active: active === 'mine'}" @click="$go(2, 'mine')">
                <img src="@common/navFoot3Ac.png" alt="" class="img-40" v-if="active === 'mine'">
                <img src="@common/navFoot3.png" alt="" class="img-40" v-else>
                <div class="fsz-24 mt-10" :class="{active: active === 'mine'}">{{ $t('我的') }}</div>
            </div>
            
        </div>

    </footer>
</template>
<script>
export default {
    name: 'navFoot',
    props: {
        active: {
            type: String,
            default: 'index'
        }
    },
}
</script>
<style scoped lang="less">
footer {
    height: 126px;
    padding-bottom: 28px;

    .box {
        width: 690px;
        height: 98px;
        position: fixed;
        background: var(--app-surface);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 49px;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.28);
        left: 50%;
        bottom: 28px;
        transform: translateX(-50%);
        z-index: 99;
        padding: 0 60px;

        .item {
            width: 152px;
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border-radius: 999px;
            transition: background 0.2s ease;

            .img-40 {
                width: 52px;
                height: 52px;
                margin: 0;
            }

            .fsz-24 {
                margin-top: 0;
                color: rgba(255, 255, 255, 0.80);
                font-size: 28px;
            }

            &.active {
                background: var(--app-primary);
                .fsz-24 {
                    color: var(--app-text);
                    font-size: 24px;
                }
                .img-40:not(.home-active-icon) {
                    filter: grayscale(1) brightness(0) invert(1);
                }
            }

            &:not(.active) {
                .img-40 {
                    display: none;
                }
            }

            .active{
                color: var(--app-text);
            }
        }
    }
}
</style>

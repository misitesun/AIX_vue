<template>
    <div class="index">
        <van-nav-bar
            :title="$t('公告')"
            @click-left="$go(1, 1)"
            :fixed="true"
            :placeholder="true"
            z-index="99"
            :border="false"
        >
            <template #left>
                <van-icon name="arrow-left" size="20" color="#fff" />
            </template>
        </van-nav-bar>
        
        <mescroll-vue ref="mescroll" :up="mescrollUp" @init="mescrollInit">
            <div class="list">
                <div class="item" v-for="(item,index) in list" :key="index" @click="$go(2, 'noticeDetail?id=' + item.id)">
                    <div class="df-aic-jusb mb-14">
                        <span class="fsz-28 text-line-1">{{item.title}}</span>
                    </div>
                    <div class="df-aic-jusb">
                        <span class="fsz-24 color-a2a6">{{item.updated_at}}</span>
                    </div>
                </div>
            </div>
            <noData v-if="list.length == 0"></noData>
        </mescroll-vue>
        
    </div>
</template>

<script>
	export default {
		data() {
			return {
				mescroll: null,
				mescrollUp: { // 上拉加载的配置.
					callback: this.upCallback, // 上拉回调,此处简写; 相当于 callback: function(page, mescroll) { }
				},
				list: [],
			}
		},
		mounted() {
			console.log(this.$route.query)
		},
		methods: {
			changeTab(index) {
				if (index != this.tab) {
					this.tab = index;
					this.mescroll.resetUpScroll();
				}
			},
			mescrollInit(mescroll) {
				this.mescroll = mescroll
			},
			upCallback(page, mescroll) {
				this.$http.get('/api/notices', {
					page_no: page.num,
					page_size: 10
				}).then((res) => {
					if (res.code == 200) {
						let arr = res.data && Array.isArray(res.data.notices) ? res.data.notices : [];
						if (page.num === 1) this.list = []
						this.list = this.list.concat(arr)
						this.$nextTick(() => {
							mescroll.endSuccess(arr.length)
						})
					}
				}).catch((e) => {
					mescroll.endErr()
				})
			}
		}
	}
</script>

<style scoped lang="less">
	.index {

		.mescroll {
			position: fixed;
			top: 88px;
			bottom: 0;
			height: auto;
		}

		.tab {
			padding: 0 30px;
			margin: 30px auto;

			.item {
                text-align: center;
				width: 336px;
				height: 88px;
				background: rgba(255, 255, 255, 0.06);
				border-radius: 20px;
			}

			.ac {
				color: #fff !important;
				background: #286AF4;
			}
		}

		.list {
			padding: 0 30px;

			.item {
				width: 690px;
				height: 125px;
				background: rgba(255, 255, 255, 0.06);
				border-radius: 20px;
				padding: 30px;
				margin: 20px auto;
			}
		}
	}
</style>

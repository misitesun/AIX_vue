<template>
    <div class="notice-detail">
        <van-nav-bar
            :title="$t('公告详情')"
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

        <div class="header text-center">
			<div class="fsz-30 mb-20">{{notice.title}}</div>
			<div class="fsz-24 color-9">{{$t('发布时间')}}：{{notice.updated_at}}</div>
		</div>
		<div class="detail" v-html="notice.content"></div>
    </div>
</template>
  
  <script>
export default {
    data() {
        return {
            notice: {},
        };
    },
    async mounted() {
        const noticeId = this.$route.query.id
        if (!noticeId) return
        try {
            const res = await this.$http.get("/api/notices/" + noticeId)
            if (res.code == 200) this.notice = res.data || {}
            await this.$http.get(`/api/notices/${noticeId}/read`)
        } catch (error) {
            console.log('公告详情加载失败', error)
        }
    },
};
</script>
  
  <style scoped lang="less">
  .notice-detail{
		padding-top: 30px;
		.header{
			width: 690px;
			border-radius: 20px;
			margin: 0 auto 20px;
			padding: 30px;
            background: rgba(255, 255, 255, 0.06);
		}
		.detail{
			width: 690px;
			padding: 30px;
			border-radius: 20px;
			background: rgba(255, 255, 255, 0.06);
			margin: auto;
			font-size: 28px;
			line-height: 1.6;
			letter-spacing: 1px;
			color: #fff;
			img {
				display: block;
				width: 100% !important;
			}
		}
	}
</style>

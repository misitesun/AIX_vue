<template>
	<div class="noData text-center  wow animate__slideInUp">
		<img src="@common/nodata.png" alt="" />
		<div class="text">{{$t('没有更多了')}}</div>
	</div>
</template>

<script>
	export default {
		data() {
			return {

			}
		},
		methods:{

		}
	}
</script>

<style scoped lang="less">
	.noData{
		padding: 100px 0;
		img{
			display: block;
			margin: 0 auto 30px;
			width: 200px;
            height: 200px;
		}
		.text{
			font-size: 28px;
			color: gray;
		}
	}
</style>
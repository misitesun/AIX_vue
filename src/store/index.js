import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
import createPersistedState from 'vuex-persistedstate'; // vuex持久化,
const store = new Vuex.Store({
	state:{
		address:'', // 默认钱包地址
		checkedInDate:'', // 最近一次完成视频签到的本地日期 YYYY-MM-DD
		checkedInAddress:'', // 签到状态所属钱包，避免切换账户后沿用旧状态
	},
	mutations:{
		setAddress(state,address){
			state.address = address
		},
		setCheckedIn(state,payload){
			state.checkedInDate = payload.date
			state.checkedInAddress = payload.address
		}
	},
	actions:{
		initAddress(data,address){
			console.log(address);
			this.commit('setAddress',address)
		}
	},
	plugins: [createPersistedState()], // 持久化：默认将vuex中的值保存到localStorage
})

export default store

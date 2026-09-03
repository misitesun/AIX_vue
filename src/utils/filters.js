import Vue from 'vue'
import { translate } from '@/i18n/translate.js'

// 地址显示前5*****后5
Vue.filter('addrHide', function(name) {
	return (name.substr(0, 5) + '****' + name.substr(-5))
});


// 时间戳转日期(1569736900 => 2019-09-29)
Vue.filter('timeFormat', function(timestamp = null, fmt = 'yyyy-mm-dd') {
    // 其他更多是格式化有如下:
    // yyyy:mm:dd|yyyy:mm|yyyy年mm月dd日|yyyy年mm月dd日 hh时MM分等,可自定义组合
    timestamp = parseInt(timestamp);
    // 如果为null,则格式化当前时间
    if (!timestamp) timestamp = Number(new Date());
    // 判断用户输入的时间戳是秒还是毫秒,一般前端js获取的时间戳是毫秒(13位),后端传过来的为秒(10位)
    if (timestamp.toString().length == 10) timestamp *= 1000;
    let date = new Date(timestamp);
    let ret;
    let opt = {
    	"y+": date.getFullYear().toString(), // 年
    	"m+": (date.getMonth() + 1).toString(), // 月
    	"d+": date.getDate().toString(), // 日
    	"h+": date.getHours().toString(), // 时
    	"M+": date.getMinutes().toString(), // 分
    	"s+": date.getSeconds().toString() // 秒
    	// 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
    	ret = new RegExp("(" + k + ")").exec(fmt);
    	if (ret) {
    		fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
    	};
    };
    return fmt;
})

// 获取多久之前
Vue.filter('timeFrom', function(timestamp = null, format = 'yyyy-mm-dd') {
    if (timestamp == null) timestamp = Number(new Date());
    timestamp = parseInt(timestamp);
    // 判断用户输入的时间戳是秒还是毫秒,一般前端js获取的时间戳是毫秒(13位),后端传过来的为秒(10位)
    if (timestamp.toString().length == 10) timestamp *= 1000;
    var timer = (new Date()).getTime() - timestamp;
    timer = parseInt(timer / 1000);
    // 如果小于5分钟,则返回"刚刚",其他以此类推
    let tips = '';
    switch (true) {
	case timer < 300:
			tips = translate('刚刚');
			break;
	case timer >= 300 && timer < 3600:
			tips = translate('{count}分钟前', { count: parseInt(timer / 60) });
			break;
	case timer >= 3600 && timer < 86400:
			tips = translate('{count}小时前', { count: parseInt(timer / 3600) });
			break;
	case timer >= 86400 && timer < 2592000:
			tips = translate('{count}天前', { count: parseInt(timer / 86400) });
			break;
    	default:
    		// 如果format为false，则无论什么时间戳，都显示xx之前
    		if(format === false) {
			if(timer >= 2592000 && timer < 365 * 86400) {
				tips = translate('{count}个月前', { count: parseInt(timer / (86400 * 30)) });
			} else {
				tips = translate('{count}年前', { count: parseInt(timer / (86400 * 365)) });
    			}
    		} else {
    			tips = timeFormat(timestamp, format);
    		}
    }
    return tips;
})


/*日期转换*/
Vue.filter('dateFilter', function(str) {
    return str.slice(0, 4) + '-' + str.slice(4, 6) + '-' + str.slice(6);
});


// 手机号隐藏('13912345678' => '139****5678'),此处str必须为字符串
Vue.filter('telHide', function(str) {
    return str.replace(/(\d{3})\d{4}(\d*)/, '$1****$2')
});


// 隐藏姓名(小明=>*明    李小明=>李*明)
Vue.filter('nameHide', function(name) {
    if (name.length === 2) {
        return new Array(name.length).join('*') + name.substr(-1)
    } else {
        return (name.substr(0, 1) + new Array(name.length - 1).join('*') + name.substr(-1))
    }
});


// 身份证号隐藏('331082199708094687' => '33108219********87')
Vue.filter('IDcardHide', function(name) {
    return name.replace(/(\d{8})\d{8}(\d*)/, '$1********$2')
});


// 人气数字转换
Vue.filter('digitalConversion', function(str) {
    let num = Math.abs(str);
    if (String(num).length < 5) {
        return num;
    } else {
        return (num / 10000).toFixed(1) + 'W';
    }
})

function timeFormat(timestamp = null, fmt = 'yyyy-mm-dd') {
	// 其他更多是格式化有如下:
	// yyyy:mm:dd|yyyy:mm|yyyy年mm月dd日|yyyy年mm月dd日 hh时MM分等,可自定义组合
	timestamp = parseInt(timestamp);
	// 如果为null,则格式化当前时间
	if (!timestamp) timestamp = Number(new Date());
	// 判断用户输入的时间戳是秒还是毫秒,一般前端js获取的时间戳是毫秒(13位),后端传过来的为秒(10位)
	if (timestamp.toString().length == 10) timestamp *= 1000;
	let date = new Date(timestamp);
	let ret;
	let opt = {
		"y+": date.getFullYear().toString(), // 年
		"m+": (date.getMonth() + 1).toString(), // 月
		"d+": date.getDate().toString(), // 日
		"h+": date.getHours().toString(), // 时
		"M+": date.getMinutes().toString(), // 分
		"s+": date.getSeconds().toString() // 秒
		// 有其他格式化字符需求可以继续添加，必须转化成字符串
	};
	for (let k in opt) {
		ret = new RegExp("(" + k + ")").exec(fmt);
		if (ret) {
			fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
		};
	};
	return fmt;
}

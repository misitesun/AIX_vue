import router from "@/router/index"; //引入路由对象
import {
    Toast
} from 'vant';

export function go(index, url, ) {
    if (index == 1) {
        router.back();
    } else if (index == 2) {
        router.push({
            path: url,
        });
    } else if (index == 3) {
        router.replace({
            path: url,
        });
    }
}

export function toast(text, type) {
    if (type == 'success') {
        Toast.success({
            message: text,
            overlay: false,
            forbidClick: true
        });
    } else if (type == 'fail') {
        Toast.fail({
            message: text,
            overlay: false,
            forbidClick: true
        });
    } else {
        Toast({
            message: text,
            className: 'toast-className'
        });
    }
}


export function dataURLtoFile(dataurl, filename) { //将base64转换为文件
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {
        type: mime
    });
}


/**
 * 将base64转换为Blob
 */
export function dataURLtoBlob(urlData, fileType) {
    let bytes = window.atob(urlData);
    let n = bytes.length;
    let u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bytes.charCodeAt(n);
    }
    return new Blob([u8arr], {
        type: fileType
    });
}


/**
 * 判断是否设置交易密码
 */
export function pay_remind(_this, callback) {
    var pay_status = _this.$store.state.userInfo.pay_status;
    if (pay_status == 0) {
        // 0:未设置交易密码
        _this.$dialog.confirm({
            title: '你还没有设置交易密码',
            message: '设置交易密码才可以进行下一步',
            confirmButtonText: '设置密码',
            showCancelButton: true,
            confirmButtonColor: '#139BFA',
        }).then(() => {
            _this.$router.push('setup_pay_pwd');
        }).catch(() => {});

    } else {
        // 实名认证已通过
        callback && callback();
    }
}


/**
 * trim(str, pos)
 * 该方法可以去除空格，分别可以去除所有空格，两端空格，左边空格，右边空格，默认为去除两端空格
 * str <String> 字符串
 * pos <String> 去除那些位置的空格，可选为：both-默认值，去除两端空格，left-去除左边空格，right-去除右边空格，all-去除包括中间和两端的所有空格
 */
export function trim(str, pos = 'both') {
    if (pos == 'both') {
        return str.replace(/^\s+|\s+$/g, "");
    } else if (pos == "left") {
        return str.replace(/^\s*/, '');
    } else if (pos == 'right') {
        return str.replace(/(\s*$)/g, "");
    } else if (pos == 'all') {
        return str.replace(/\s+/g, "");
    } else {
        return str;
    }
}


/**
 * 防抖原理：一定时间内，只有最后一次操作，再过wait毫秒后才执行函数
 * 
 * @param {Function} func 要执行的回调函数 
 * @param {Number} wait 延时的时间
 * @param {Boolean} immediate 是否立即执行 
 * @return null
 */
let timeout = null;
export function debounce(func, wait = 500, immediate = false) {
    // 清除定时器
    if (timeout !== null) clearTimeout(timeout);
    // 立即执行，此类情况一般用不到
    if (immediate) {
        var callNow = !timeout;
        timeout = setTimeout(function() {
            timeout = null;
        }, wait);
        if (callNow) typeof func === 'function' && func();
    } else {
        // 设置定时器，当最后一次操作后，timeout不会再被清除，所以在延时wait毫秒后执行func回调方法
        timeout = setTimeout(function() {
            typeof func === 'function' && func();
        }, wait);
    }
}



/**
 * 节流原理：在一定时间内，只能触发一次
 * 
 * @param {Function} func 要执行的回调函数 
 * @param {Number} wait 延时的时间
 * @param {Boolean} immediate 是否立即执行
 * @return null
 */
let timer, flag;
export function throttle(func, wait = 500, immediate = true) {
    if (immediate) {
        if (!flag) {
            flag = true;
            // 如果是立即执行，则在wait毫秒内开始时执行
            typeof func === 'function' && func();
            timer = setTimeout(() => {
                flag = false;
            }, wait);
        }
    } else {
        if (!flag) {
            flag = true
                // 如果是非立即执行，则在wait毫秒内的结束处执行
            timer = setTimeout(() => {
                flag = false
                typeof func === 'function' && func();
            }, wait);
        }

    }
};

/**
 * 舍去指定小数位（不进行四舍五入）
 */
export function toFixed(num, decimal) {
    num = num.toString();
    let index = num.indexOf('.');
    if (index !== -1) {
        num = num.substring(0, decimal + index + 1)
    } else {
        num = num.substring(0)
    }
    return parseFloat(num).toFixed(decimal)
}
//router
import router from "@/router/index"; //引入路由对象
import messageTip from '@/utils/messageTip.js';
import store from '@/store/index.js';
// axios
import axios from 'axios'
import qs from "qs";
axios.defaults.baseURL = process.env.VUE_APP_BASE_API;
axios.defaults.timeout = 10000; //超时毫秒 60s
// axios.defaults.headers['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers['accept'] = '*/*'
// 接口文档中的普通 POST 均为 JSON；上传 FormData 时由浏览器自动补 multipart boundary。
axios.defaults.headers['content-type'] = 'application/json'
// 当前接口使用 Bearer Token 鉴权；关闭 Cookie 凭证以兼容后端 Access-Control-Allow-Origin: *。
axios.defaults.withCredentials = false;

// axios请求拦截
axios.interceptors.request.use(config => {
    config.headers['lang'] = localStorage.getItem('lang') || 'zh-Hans';
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        delete config.headers['content-type']
        delete config.headers['Content-Type']
    }
    if (localStorage.getItem('token')) {
        config.headers['Authorization'] = 'Bearer ' + localStorage.getItem('token');
    }
    if (localStorage.getItem('address')) {
        config.headers['address'] = store.state.address ? store.state.address : localStorage.getItem('address');
    }
    return config;
}, error => {
    // 对请求错误做些什么
    return Promise.reject(error);
})

// axios响应拦截器
axios.interceptors.response.use(
    response => {
        // 如果返回的状态码为200，说明接口请求成功，可以正常拿到数据，否则的话抛出错误
        // messageTip.warning('提示内容');
        if (response.status === 200) {
            let data = {
                code: 200,
                data: response.data
            }
            return Promise.resolve(data);
        } else {
            return Promise.reject(response);
        }
    },
    error => {
        // console.log('其他错误1', error)
        // console.log('其他错误2', error.status)
        // console.log('其他错误3', error.response.data)
        const status = error && error.response ? error.response.status : null
        if (status) {
            switch (status) {
                // 404请求不存在
                case 401:
                    store.commit("setAddress", '');
                    localStorage.removeItem('token')
                    localStorage.removeItem('address')
                    messageTip.warning(error.response.data);
                    setTimeout(() => {
                        router.replace({
                            path: '/',
                            // query: {
                            // 	redirect: router.currentRoute.fullPath
                            // }
                        });
                    }, 500)
                    break;
                case 500:
                    messageTip.warning(error.response.data + ' ' + status);
                    break;
                // 其他错误，直接抛出错误提示
                default:
                    // console.log('其他错误4', error.response.data);
                    messageTip.warning(error.response.data);
            }
            return Promise.reject(error.response);
        }
        return Promise.reject(error)
    }
);




/**
 * get方法，对应get请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export function get(url, params = {}) {
    return new Promise((resolve, reject) => {
        axios.get(url, {
            params: params
        }).then(res => {
            if (res.code >= 200 && res.code < 300) {
                resolve({
                    code: 200,
                    data: res.data
                })
            } else if (res.code == 401) {
                store.commit("setAddress", '');
                localStorage.removeItem('token')
                localStorage.removeItem('address')
                messageTip.warning('登录过期，请重新登录');
                resolve({
                    code: 401,
                    data: res.data,
                })
                setTimeout(() => {
                    router.replace({
                        path: '/',
                        query: {
                            redirect: router.currentRoute.fullPath
                        }
                    });
                }, 500)
            } else {
                // 其他错误
                messageTip.warning({
                    message: '其他错误',
                    className: 'toast-className'
                });
                resolve({
                    code: 0,
                    data: res.data,
                })
            }
        }).catch(error => {
            reject(error);
        })
    });
}


/**
 * post方法，对应post请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数]
 */
export function post(url, params = {}, config = {}) {
    return new Promise((resolve, reject) => {
        axios.post(url, params, config).then(res => {
            if (res.code >= 200 && res.code < 300) {
                resolve({
                    code: 200,
                    data: res.data
                })
            } else if (res.code == 401) {
                messageTip.warning('登录过期，请重新登录');
                resolve({
                    code: 401,
                    data: res.data,
                })
                setTimeout(() => {
                    router.replace({
                        path: '/',
                        query: {
                            redirect: router.currentRoute.fullPath
                        }
                    });
                }, 500)
            } else {
                // 其他错误
                messageTip.warning({
                    message: '其他错误',
                    className: 'toast-className'
                });
                resolve({
                    code: 0,
                    data: res.data,
                })
            }
        }).catch(error => {
            reject(error);
        })
    });
}

var http = {
    get,
    post
};
export default http;

/**
 * 全局错误处理工具
 */

// 全局错误处理
export const setupGlobalErrorHandler = () => {
    // 捕获未处理的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled Promise Rejection:', event.reason);
        event.preventDefault();
    });

    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
        console.error('Global Error:', event.error);
        // 可以在这里添加错误上报逻辑
    });

    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
        if (event.target && event.target.tagName) {
            console.error('Resource Loading Error:', event.target.src || event.target.href);
        }
    }, true);
};

// Vue错误处理
export const setupVueErrorHandler = (Vue) => {
    Vue.config.errorHandler = (err, vm, info) => {
        console.error('Vue Error:', err);
        console.error('Component:', vm);
        console.error('Error Info:', info);

        // 在生产环境中可以发送错误到服务器
        if (process.env.NODE_ENV === 'production') {
            // 错误上报逻辑
            console.error('Production Error:', err.message);
        }
    };
};

// 路由错误处理
export const setupRouterErrorHandler = (router) => {
    router.onError((error) => {
        console.error('Router Error:', error);
    });
};

// 检查依赖是否正确加载
export const checkDependencies = () => {
    const requiredDeps = [
        'Vue',
        'VueRouter',
        'Vuex',
        'VueI18n',
        'Vant',
        'VueClipboard',
        'VueAwesomeSwiper'
    ];

    const missingDeps = [];

    requiredDeps.forEach(dep => {
        if (typeof window[dep] === 'undefined') {
            missingDeps.push(dep);
        }
    });

    if (missingDeps.length > 0) {
        console.warn('Missing dependencies:', missingDeps);
    }

    return missingDeps.length === 0;
};

// 初始化所有错误处理
export const initErrorHandling = (Vue, router) => {
    setupGlobalErrorHandler();
    setupVueErrorHandler(Vue);
    setupRouterErrorHandler(router);
    checkDependencies();
}; 
// const { defineConfig } = require('@vue/cli-service')
// module.exports = defineConfig({
//   transpileDependencies: true
// })
const path = require('path'); //引入path模块
module.exports = {
    publicPath: "/h5/", //部署应用包时的基本 URL
    outputDir: "dist",
    productionSourceMap: false, //加速生产环境构建
    chainWebpack: config => {
        //set第一个参数：设置的别名，第二个参数：设置的路径
        config.resolve.alias
            .set('@', path.join(__dirname, './src'))
            .set('@components', path.join(__dirname, './src/components'))
            .set('@assets', path.join(__dirname, './src/assets'))
            .set('@view', path.join(__dirname, './src/view'))
            .set('@img', path.join(__dirname, './src/assets/img'))
            .set('@utils', path.join(__dirname, './src/utils'))
            .set('@common', path.join(__dirname, './src/assets/common'))
        // 修复HMR
        config.resolve.symlinks(true);

        // 生产环境优化
        if (process.env.NODE_ENV === 'production') {
            // 确保所有依赖都正确加载
            config.optimization.splitChunks({
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        name: 'chunk-vendors',
                        test: /[\\/]node_modules[\\/]/,
                        priority: 10,
                        chunks: 'initial'
                    },
                    common: {
                        name: 'chunk-common',
                        minChunks: 2,
                        priority: 5,
                        chunks: 'initial',
                        reuseExistingChunk: true
                    }
                }
            });

            // 添加错误处理
            config.plugin('define').tap(args => {
                args[0]['process.env'].NODE_ENV = JSON.stringify(process.env.NODE_ENV);
                return args;
            });
        }
    },
    devServer: {
        client: {
            overlay: false
        },
        // 调试时允许内网穿透，让外网的人访问到本地调试的H5页面
        // disableHostCheck: true,
        proxy: {
            '/api': {
                target: 'http://192.168.31.197:9501/api/',
                changeOrigin: true,
            },
        }
    }
};
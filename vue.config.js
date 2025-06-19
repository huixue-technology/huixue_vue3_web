const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  lintOnSave: false,
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      alias: {
        '@': require('path').resolve(__dirname, 'src')
      }
    }
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://101.200.240.100:5000',  // ？为啥localhost和127.0.0.1不能都行
        changeOrigin: true,
        pathRewrite: {
          '^': '' // 修改为正确的路径重写规则，如果需要的话
        }
      }
    }
  }
})

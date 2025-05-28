
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  lintOnSave: false,
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',  // ？为啥localhost和127.0.0.1不能都行
        changeOrigin: true,
        pathRewrite: {
          '^': '' // 修改为正确的路径重写规则，如果需要的话
        }
      }
    }
  }
})

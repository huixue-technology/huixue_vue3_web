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
        target: 'http://111.228.38.111:5000',
         //target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        pathRewrite: {
          '^': '' // 去掉前缀 `/api`
        }
      },
    },
    client: {
      overlay: false
    },
  }
})
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
        target: 'http://101.200.240.100:5000',
<<<<<<< HEAD
        //target: 'http://127.0.0.1:5000',
=======
        // target: 'http://127.0.0.1:5000',
>>>>>>> 69b738637a4e3e984d6127f34716fb2df27af2dd
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
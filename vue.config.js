const { defineConfig } = require("@vue/cli-service");
const path = require("path");

const LOCAL_API_TARGET = "http://127.0.0.1:5000";
const REMOTE_API_TARGET = "http://111.228.38.111:5003";
const isLocalMachine = process.platform === "win32" || process.platform === "darwin";
console.log(`[vue.config] isLocalMachine: ${isLocalMachine}`);
const apiProxyTarget =
  process.env.VUE_APP_API_PROXY_TARGET ||
  (isLocalMachine ? LOCAL_API_TARGET : REMOTE_API_TARGET);

console.log(`[vue.config] /api proxy target: ${apiProxyTarget}`);

module.exports = defineConfig({
  lintOnSave: false,
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  },
  devServer: {
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
        pathRewrite: {
          "^": "",
        },
      },
    },
    client: {
      overlay: false,
    },
  },
});

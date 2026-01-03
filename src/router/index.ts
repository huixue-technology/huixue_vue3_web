import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import common from './common'
import modules from './modules'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    ...common,
    ...modules,
    {
      path: '/:catchAll(.*)',
      redirect: '/404'
    }
  ]
})

// 百度统计 - SPA 页面访问统计
router.afterEach((to) => {
  // 确保百度统计代码已加载
  if (typeof (window as any)._hmt !== 'undefined') {
    // 统计页面PV
    (window as any)._hmt.push(['_trackPageview', to.fullPath]);
  }
});

export default router

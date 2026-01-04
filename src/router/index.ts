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

// 白名单 - 不需要登录就可以访问的页面
const whiteList = ['/user/login', '/user/register', '/user/teacher-register', '/404']

// 路由守卫
router.beforeEach((to, from, next) => {
  // 如果是白名单页面，直接放行
  if (whiteList.includes(to.path)) {
    next()
    return
  }

  // 检查是否有用户信息
  const userStr = localStorage.getItem('user')
  if (!userStr) {
    // 没有用户信息，跳转到登录页
    next('/user/login')
    return
  }

  try {
    const user = JSON.parse(userStr)
    
    // 校验教师访问权限
    if (to.path.startsWith('/class_') || to.path === '/teacher_info' || to.path === '/student_analysis' || to.path === '/student_compare') {
      if (user.teacher === undefined) {
        // 学生不能访问教师页面
        next('/grade')
        return
      }
    }
    
    next()
  } catch (error) {
    // 用户信息解析失败，跳转到登录页
    next('/user/login')
  }
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

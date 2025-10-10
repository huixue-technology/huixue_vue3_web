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

export default router

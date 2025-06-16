import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import common from './common'
import modules from './modules'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    ...common,
    ...modules,
    {
      path: '/gradeanalysis/mistakes',
      name: 'Mistakes',
      component: () => import('@/views/gradeanalysis/Mistakes.vue'),
      meta: {
        title: '错题合集',
      },
    },
    {
      path: '/:catchAll(.*)',
      redirect: '/404'
    }
  ]
})

export default router

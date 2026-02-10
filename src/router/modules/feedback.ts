import { RouteRecordRaw } from 'vue-router'

const feedbackRoutes: Array<RouteRecordRaw> = [
  {
    path: '/feedback',
    name: 'Feedback',
    component: () => import('@/views/feedback/Feedback.vue'),
    meta: {
      title: '意见反馈'
    }
  }
]

export default feedbackRoutes

import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    // {
    //     path: '/user',
    //     name: 'user',
    //     component: () => import('@/views/user.vue')
    // },
     {
        path: '/user',
        redirect: '/user/my-info'
    },
    {
        path: '/user/login',
        name: 'login',
        component: () => import('@/views/user/Login.vue')
         },
    {
        path: '/user/my-info',
        name: 'myInfo',
        component: () => import('@/views/user/MyInfo.vue')
    }
]

export default routes
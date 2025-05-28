export default [
    // {
    //     path: '/user',
    //     name: 'user',
    //     component: () => import('@/views/user.vue')
    // },
    {
        path: '/user/login',
        name: 'login',
        component: () => import('@/views/user/Login.vue')
    }
]
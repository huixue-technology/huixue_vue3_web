export default [
    // 默认页面
    {
        path: '/',
        redirect: '/grade',
    },
    // 首页
    {
        path: '/grade',
        name: 'grade',
        component: () => import('@/views/grade/Grade.vue')
    },
    // 404页面
    {
        path: '/404',
        component: () => import('@/views/404.vue'),
    },
]
export default [
    {
        path: '/grade',
        name: 'grade',
        component: () => import('@/views/grade/Grade.vue')
     },
    {
        path: '/compare',
        name: 'compare',
        component: () => import('@/views/compare/Compare.vue')
    }
]
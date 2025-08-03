export default [
    {
        path: '/teacher_info',
        name:'teacher_info',
        component: () => import('@/views/teacher/TeacherInfo.vue'),
    },
    {
        path: '/class_compare',
        name:'class_compare',
        component: () => import('@/views/teacher/ClassCompare.vue'),
    },
    {
        path: '/class_grade',
        name: 'class_grade',
        component: () => import('@/views/teacher/ClassGrade.vue'),
    },
    {
        name:'/class_analysis',
        path: '/class_analysis',
        component: () => import('@/views/teacher/ClassAnalysis.vue'),
    }
]
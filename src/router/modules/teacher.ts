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
    },
    {
        name: '/student_analysis',
        path: '/student_analysis',
        component: () => import('@/views/teacher/StudentAnalysis.vue'),
    },
    {
        name: '/student_compare',
        path: '/student_compare',
        component: () => import('@/views/teacher/StudentCompare.vue'),
    },
]
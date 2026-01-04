export default [
    // 默认页面 - 根据用户信息动态跳转
    {
        path: '/',
        redirect: () => {
            const userStr = localStorage.getItem('user')
            if (!userStr) {
                // 没有用户信息，跳转到登录页
                return '/user/login'
            }
            try {
                const user = JSON.parse(userStr)
                // 如果有teacher字段，说明是老师，跳转到教师端首页
                if (user.teacher !== undefined) {
                    return '/class_grade'
                }
                // 否则是学生，跳转到学生端首页
                return '/grade'
            } catch (error) {
                // 解析失败，跳转到登录页
                return '/user/login'
            }
        },
    },
    // 学生端首页
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
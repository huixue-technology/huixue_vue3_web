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
    },
    {
        path: '/analysis',
        name: 'analysis',
        component: () => import('@/views/AnalysisPage.vue')
    },
    {
        path: '/analysis/student',
        name: 'studentAnalysis',
        component: () => import('@/views/StudentAnalysisPage.vue')
    },
    {
        path: '/elevate-analytics',
        name: 'elevateAnalytics',
        component: () => import('@/views/ElevateAnalyticsPage.vue')
    },
    {
        path: '/student-challenge',
        name: 'studentChallenge',
        component: () => import('@/views/StudentChallengePage.vue')
    },
    {
        path: '/rank-details',
        name: 'rankDetails',
        component: () => import('@/views/RankDetailsPage.vue')
    }
]
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
        component: () => import('@/views/gradeanalysis/AnalysisPage.vue')
    },
    {
        path: '/analysis/student',
        name: 'studentAnalysis',
        component: () => import('@/views/gradeanalysis/StudentAnalysisPage.vue')
    },
    {
        path: '/elevate-analytics',
        name: 'elevateAnalytics',
        component: () => import('@/views/gradeanalysis/ElevateAnalyticsPage.vue')
    },
    {
        path: '/student-challenge',
        name: 'studentChallenge',
        component: () => import('@/views/gradeanalysis/StudentChallengePage.vue')
    },
    {
        path: '/rank-details',
        name: 'rankDetails',
        component: () => import('@/views/gradeanalysis/RankDetailsPage.vue')
    },
    {
        path: '/grade-simulation',
        name: 'gradeSimulation',
        component: () => import('@/views/gradeanalysis/GradeSimulationPage.vue')
    }
]
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
        path: '/student',
        name: 'student',
        component: () => import('@/views/student/StudentAnalysisPage.vue')
    },
    {
        path: '/paper_view',
        name: 'paper_view',
        component: () => import('@/views/paper/PaperView.vue')
    },
    {
        path: '/student_paper_view',
        name: 'student_paper_view',
        component: () => import('@/views/paper/StudentPaperView.vue')
    },
    {
        path: '/student_wrong_question',
        name: 'student_wrong_question',
        component: () => import('@/views/wrongquestion/StudentWrongQuestion.vue')
    },
    {
        path: '/elevate-analytics',
        name: 'elevateAnalytics',
        component: () => import('@/views/gradeanalysis/ElevateAnalyticsPage.vue')
    },
    {
        path: '/challenge',
        name: 'studentChallenge',
        component: () => import('@/views/challenge/StudentChallengePage.vue')
    },
    // {
    //   path: '/mistakes',
    //   name: 'Mistakes',
    //   component: () => import('@/views/mistake/Mistakes.vue'),
    // },
    {
        path: '/detail',
        name: 'rankDetails',
        component: () => import('@/views/detail/RankDetailsPage.vue')
    },
    {
        path: '/grade-simulation',
        name: 'gradeSimulation',
        component: () => import('@/views/gradeanalysis/GradeSimulationPage.vue')
    },
    {
        path: '/simulate',
        name: 'gradeSimulate',
        component: () => import('@/views/simulate/gradeSimulate.vue')
    }
]

export default [
  {
    path: '/user/admin-login',
    name: 'adminLogin',
    component: () => import('@/views/user/AdminLogin.vue'),
  },
  {
    path: '/admin/entry',
    name: 'adminEntry',
    component: () => import('@/views/admin/Entry.vue'),
  },
];

import router from '@/router';
import { apiErrorMessage } from './apiError';
import { message } from 'ant-design-vue';
import { extend } from 'umi-request';

const request = extend({
  // 默认请求前缀
  // prefix: 'https://monitor.xipinkj.cn/api',
  timeout: 300000,
  changeOrigin: true,
  pathRewrite: {
    '^': '' // 修改为正确的路径重写规则，如果需要的话
  }
});

// 请求拦截器
request.interceptors.request.use((url, options) => {
  const token = localStorage.getItem('token');
  if (token) {
    return {
      url: url,
      options: {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      },
    };
  }
  return { url, options };
});

// 响应拦截器 ： 只有当函数的await都执行完毕后才会执行
// 不需要登录即可访问的页面白名单（与 router/index.ts 保持一致）
const responseWhiteList = ['/user/login', '/user/register', '/user/teacher-register'];

request.interceptors.response.use(async (response) => {
  if (response.status >= 400 && response.status !== 401) {
    const data = await response.clone().json().catch(() => null);
    throw new Error(apiErrorMessage(data, `请求失败（${response.status}）`));
  }
  switch (response.status) {
    case 401:
      // 白名单页面不进行 401 跳转（如注册页面加载学校列表等公开接口）
      const currentPath = router.currentRoute.value.path;
      if (!responseWhiteList.includes(currentPath)) {
        message.error('认证失败，重新登录');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 管理员相关会话失效时回管理员登录页，不要落到学生/老师的扫码登录。
        const isAdminSession =
          currentPath.startsWith('/admin') || Boolean(localStorage.getItem('admin_token'));
        if (isAdminSession) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
        message.info('正在跳转到登录页面...');
        setTimeout(() => {
          router.push(isAdminSession ? '/user/admin-login' : '/user/login');
        }, 1000);
      }
      break;
    default:
      break;
  }
  if (response.status === 401) throw new Error('认证失败，请重新登录');
  return response;
});

export default request;

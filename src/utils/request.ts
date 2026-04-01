import router from '@/router';
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
  console.log("拦截器请求执行", token)
  if (token) {
    return {
      url: url,
      options: {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
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
  switch (response.status) {
    case 401:
      // 白名单页面不进行 401 跳转（如注册页面加载学校列表等公开接口）
      const currentPath = router.currentRoute.value.path;
      if (!responseWhiteList.includes(currentPath)) {
        message.error('认证失败，重新登录');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        message.info('正在跳转到登录页面...');
        setTimeout(() => {
          router.push('/user/login');
        }, 1000);
      }
      break;
    default:
      break;
  }
  return response;
});

export default request; 
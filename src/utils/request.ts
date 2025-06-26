import { extend } from 'umi-request';

const request = extend({
  // 默认请求前缀
  prefix: 'https://monitor.xipinkj.cn/api',
  timeout: 10000,
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
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      },
    };
  }
  return { url, options };
});

// 响应拦截器
request.interceptors.response.use(async (response) => {
  if (response.status === 401) {
    // 处理未授权，例如跳转到登录页
    console.error('Unauthorized: Token might be invalid or expired. Redirecting to login...');
    // window.location.href = '/login'; // 请根据您的实际登录路由修改
  }
  return response;
});

export default request; 
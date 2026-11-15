<template>
  <div class="container">
    <h2>管理员登录</h2>
    <p class="tip">
      管理员可用账号密码登录，进入前台后先选择要查看的学生或班级。学生与老师请返回微信扫码登录。
    </p>
    <a-form layout="vertical" :model="form" @finish="submit">
      <a-form-item
        label="管理员账号"
        name="username"
        :rules="[{ required: true, message: '请输入管理员账号' }]"
      >
        <a-input v-model:value="form.username" placeholder="管理员账号" autocomplete="username" />
      </a-form-item>
      <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码' }]">
        <a-input-password
          v-model:value="form.password"
          placeholder="密码"
          autocomplete="current-password"
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit" block :loading="loading">登录</a-button>
      </a-form-item>
    </a-form>
    <div class="links">
      <router-link to="/user/login">返回微信扫码登录</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import router from '@/router';
import { useUserStore } from '@/store';

const userStore = useUserStore();
const loading = ref(false);
const form = reactive({ username: '', password: '' });

// 登录接口走原生 fetch：401 是"账号或密码错误"而不是会话失效，
// 交给 umi-request 拦截器会被当成掉登录并清空本地身份。
const submit = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/auth/admin/login', {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username, password: form.password }),
      cache: 'no-store',
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.code !== 200 || !body?.data?.token) {
      message.error(body?.msg || `登录失败（${response.status}）`);
      return;
    }

    const user = { ...body.data, token: body.data.token };
    // admin_token 保留管理员身份，前台进入学生/老师端后靠它切回选择页。
    localStorage.setItem('admin_token', user.token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    localStorage.setItem('token', user.token);
    userStore.setUserInfo(user);
    await router.replace('/admin/entry');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '登录失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="less">
.container {
  width: 92vw;
  max-width: 420px;
  margin: 48px auto;
  padding: 24px;
}

.tip {
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 16px;
}

.links {
  margin-top: 16px;
  text-align: center;
}
</style>

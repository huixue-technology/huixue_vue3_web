<template>
<div class="container">
   <h2>慧学成绩查询</h2>
   <a-form
      :model="formparams"
      name="normal_login"
      class="login-form"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
   >
         <a-form-item
         label="用户名"
         name="email"
         :rules="[{ required: true, message: '请输入用户名!' }]"
      >
         <a-input v-model:value="formparams.email">
         <template #prefix>
            <UserOutlined class="site-form-item-icon" />
         </template>
         </a-input>
      </a-form-item>
      
      <a-form-item
         label="密码"
         name="password"
         :rules="[{ required: true, message: 'Please input your password!' }]"
      >
         <a-input-password v-model:value="formparams.password">
         <template #prefix>
            <LockOutlined class="site-form-item-icon" />
         </template>
         </a-input-password>
      </a-form-item>


      <a-form-item>
         <a-button :disabled="disabled" type="primary" html-type="submit" class="login-form-button">
         登录
         </a-button>
         或者
         <router-link to="/user/register">注册</router-link>
      </a-form-item>
   </a-form>
</div>

</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { postUserLogin } from '@/servers/api/user';
import router from '@/router';
import { useUserStore } from '@/store';
// 表单参数
interface FormParams {
  email: string
  password: string
}

const disabled = computed(() => {
  return !(formparams.email && formparams.password);
});

const formparams = reactive<FormParams>({
  email: '',
  password: ''
})

const userStore = useUserStore();

const onFinish = (values: any) => {
   postUserLogin(values).then((res) => {
    console.log(res);
    localStorage.setItem('user', JSON.stringify(res.data));
    // 使用Pinia存储用户信息
    userStore.setUserInfo({
      ...res.data,
      token: res.data.token
    });
    // 仍然保留token在localStorage中，方便API请求使用
    localStorage.setItem('token', res.data.token);
     const user = userStore.getUserInfo()
     console.log()
     if(user['teacher'] !== null) {
       router.push('/teacher_info')
     }else{
       router.push('/grade');
     }
  })
}

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo)
  router.push('/grade');
}

</script>

<style scoped lang="less">

#components-form-demo-normal-login .login-form {
  max-width: 300px;
}
#components-form-demo-normal-login .login-form-forgot {
  float: right;
}
#components-form-demo-normal-login .login-form-button {
  width: 100%;
}

.container {
   position: fixed;
   top: 20%;
   left: 50%;
transform: translate(-50%, -50%);
   width: auto;
   margin: 0;
   padding: 0;
}
</style>
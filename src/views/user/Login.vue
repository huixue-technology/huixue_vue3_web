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
         <a href="">注册</a>
      </a-form-item>
   </a-form>
</div>

</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { postLogin } from '@/servers/api/user';
import router from '@/router';
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

const onFinish = (values: any) => {
   postLogin(values).then((res) => {
    console.log(res);
    localStorage.setItem('user',res.data)
    localStorage.setItem('token',res.data.token)
    router.push('/index')
  })
}

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo)
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
   left: 40%;
   width: 20%;
}
</style>
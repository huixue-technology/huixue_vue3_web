<template>
<div class="container">
   <h2>账号注册</h2>
   <a-form
      :model="formparams"
      name="normal_register"
      class="register-form"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
   >
         <a-form-item
         label=" 邮 箱 "
         name="email"
         :rules="[{ required: true, message: '请输入用户邮箱!' }]"
      >
         <a-input v-model:value="formparams.email">
         <template #prefix>
            <SafetyOutlined class="site-form-item-icon" />
         </template>
         </a-input>
      </a-form-item>
      
      <a-form-item
         label=" 密 码 "
         name="password"
         :rules="[{ required: true, message: '请输出密码!' }]"
      >
         <a-input-password v-model:value="formparams.password">
         <template #prefix>
            <LockOutlined class="site-form-item-icon" />
         </template>
         </a-input-password>
      </a-form-item>

      <a-form-item
         label="用户姓名"
         name="name"
         :rules="[{ required: true, message: '请输入真实姓名!' }]"
      >
         <a-input v-model:value="formparams.name">
         <template #prefix>
            <UserOutlined class="site-form-item-icon" />
         </template>
         </a-input>
      </a-form-item>

      <a-form-item
         label="联系方式"
         name="phone"
         :rules="[{ required: true, message: '请输入用户联系方式!' }]"
      >
         <a-input v-model:value="formparams.phone">
         <template #prefix>
            <MobileOutlined class="site-form-item-icon" />
         </template>
         </a-input>
      </a-form-item>


      <a-form-item>
         <a-button :disabled="disabled" type="primary" html-type="submit" class="login-form-button">
         注册
         </a-button>
         或者
         <router-link to="/user/login">登录</router-link>
      </a-form-item>
   </a-form>
</div>

</template>
<script setup lang="ts">
import { reactive, computed } from 'vue'
import { UserOutlined, LockOutlined,SafetyOutlined,KeyOutlined,MobileOutlined } from '@ant-design/icons-vue';
import { postUserApi, postUserLogin } from '@/servers/api/user';
import router from '@/router';
import { useUserStore } from '@/store';
import { message } from 'ant-design-vue';
// 表单参数
interface FormParams {
  email: string
  password: string
  name: string
  phone: string
}

const disabled = computed(() => {
  return !(formparams.email && formparams.password && formparams.name && formparams.phone);
});

const formparams = reactive<FormParams>({
  email: '',
  password: '',
  name:'',
  phone:''
})

const userStore = useUserStore();

const onFinish = (values: any) => {
   postUserApi(formparams).then((res) => { 
      console.log(res)
      message.success('注册成功！');
      router.push('/user/login');
  })
}

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo)
  message.error('注册失败！');
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
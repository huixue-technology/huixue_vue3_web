<template>
<div class="container">
   <h2>教师账号申请</h2>
   <p class="tip">提交后需管理员在后台审核，通过后用微信扫码登录，无需设置密码。</p>
   <a-form
      :model="formparams"
      name="teacher_apply"
      class="register-form"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
   >
      <a-form-item
         label="教师姓名"
         name="name"
         :rules="[{ required: true, message: '请输入真实姓名!' }]"
      >
         <a-input v-model:value="formparams.name" placeholder="请输入教师姓名">
         <template #prefix>
            <UserOutlined class="site-form-item-icon" />
         </template>
         </a-input>
      </a-form-item>

      <a-form-item
         label="手机号"
         name="phone"
         :rules="[
            { required: true, message: '请输入手机号!' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
         ]"
      >
         <a-input v-model:value="formparams.phone" placeholder="审核通过后凭此手机号认领账号">
         <template #prefix>
            <MobileOutlined class="site-form-item-icon" />
         </template>
         </a-input>
      </a-form-item>

      <a-form-item
         label="所在学校"
         name="schoolId"
         :rules="[{ required: true, message: '请选择学校!' }]"
      >
         <a-select
           v-model:value="formparams.schoolId"
           style="width: 100%"
           placeholder="请选择学校"
           :loading="schoolList.length === 0"
         >
           <a-select-option v-for="school in schoolList" :key="school.school_id" :value="school.school_id">
             {{ school.name }}
           </a-select-option>
         </a-select>
      </a-form-item>

      <a-form-item
         label="任教学科"
         name="subject"
         :rules="[{ required: true, message: '请选择任教学科!' }]"
      >
         <a-select
           v-model:value="formparams.subject"
           style="width: 100%"
           placeholder="请选择任教学科"
         >
           <a-select-option value="语文">语文</a-select-option>
           <a-select-option value="数学">数学</a-select-option>
           <a-select-option value="英语">英语</a-select-option>
           <a-select-option value="物理">物理</a-select-option>
           <a-select-option value="化学">化学</a-select-option>
           <a-select-option value="生物">生物</a-select-option>
           <a-select-option value="政治">政治</a-select-option>
           <a-select-option value="历史">历史</a-select-option>
           <a-select-option value="地理">地理</a-select-option>
         </a-select>
      </a-form-item>

      <a-form-item>
         <a-button :disabled="disabled" type="primary" html-type="submit" class="login-form-button">
         提交申请
         </a-button>
         或者
         <router-link to="/user/login">登录</router-link>
      </a-form-item>
   </a-form>
</div>

</template>
<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { UserOutlined, MobileOutlined } from '@ant-design/icons-vue';
import { postTeacherApplyApi } from '@/servers/api/user';
import router from '@/router';
import { message } from 'ant-design-vue';
import { useSchoolSelection } from '@/composables/useSchoolSelection';

const { schoolList, loadSchoolData } = useSchoolSelection();

interface FormParams {
  name: string
  phone: string
  schoolId: string
  subject: string
}

const formparams = reactive<FormParams>({
  name: '',
  phone: '',
  schoolId: '',
  subject: ''
})

const disabled = computed(() => {
  return !(formparams.name && formparams.phone && formparams.schoolId && formparams.subject);
});

const onFinish = async () => {
  try {
    const res = await postTeacherApplyApi({
      name: formparams.name,
      phone: formparams.phone,
      school_id: formparams.schoolId,
      subject: formparams.subject,
    });
    if (res.code !== 200) {
      message.error(res.msg || '提交申请失败');
      return;
    }
    message.success('申请已提交，请等待管理员审核，通过后用微信扫码登录');
    setTimeout(() => router.push('/user/login'), 1500);
  } catch (error: any) {
    message.error(error?.message || '提交申请失败，请稍后重试');
  }
}

const onFinishFailed = () => {
  message.error('请完整填写申请信息');
}

onMounted(() => {
  loadSchoolData();
});

</script>

<style scoped lang="less">
.container {
  max-width: 520px;
  width: 92vw;
  margin: 32px auto;
  padding: 24px;
}

.tip {
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 16px;
}

.register-form {
  max-width: 300px;
}

.login-form-button {
  width: 100%;
}

.site-form-item-icon {
  color: rgba(0, 0, 0, 0.25);
}
</style>

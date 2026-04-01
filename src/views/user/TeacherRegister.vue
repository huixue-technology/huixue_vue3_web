<template>
<div class="container">
   <h2>教师账号注册</h2>
   <a-form
      :model="formparams"
      name="teacher_register"
      class="register-form"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
   >
      <a-form-item
         label="账号"
         name="uid"
         :rules="[
            { required: true, message: '请输入7位数账号!' },
            { pattern: /^\d{7}$/, message: '账号必须为7位数字' }
         ]"
      >
         <a-input v-model:value="formparams.uid" placeholder="请输入7位数账号">
         <template #prefix>
            <UserOutlined class="site-form-item-icon" />
         </template>
         </a-input>
      </a-form-item>
      
      <a-form-item
         label="密码"
         name="password"
         :rules="[{ required: true, message: '请输入密码!' }]"
      >
         <a-input-password v-model:value="formparams.password" placeholder="请输入密码">
         <template #prefix>
            <LockOutlined class="site-form-item-icon" />
         </template>
         </a-input-password>
      </a-form-item>

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
         label="联系方式"
         name="phone"
         :rules="[{ required: true, message: '请输入联系方式!' }]"
      >
         <a-input v-model:value="formparams.phone" placeholder="请输入联系方式">
         <template #prefix>
            <MobileOutlined class="site-form-item-icon" />
         </template>
         </a-input>
      </a-form-item>

      <a-form-item
         label="所在学校"
         name="schoolName"
         :rules="[{ required: true, message: '请选择学校!' }]"
      >
         <a-select
           v-model:value="formparams.schoolName"
           @change="handleSchoolChange"
           style="width: 100%"
           placeholder="请选择学校"
           :loading="schoolList.length === 0"
         >
           <a-select-option v-for="school in schoolList" :key="school.id" :value="school.name">
             {{ school.name }}
           </a-select-option>
         </a-select>
      </a-form-item>
       
      <a-form-item
         label="所在年级"
         name="grade"
         :rules="[{ required: true, message: '请选择年级!' }]"
      >
         <a-select
           v-model:value="formparams.grade"
           @change="handleGradeChange"
           style="width: 100%"
           placeholder="请选择年级"
           :loading="gradeList.length === 0 && formparams.schoolName"
           :disabled="!formparams.schoolName"
         >
           <a-select-option v-for="grade in gradeList" :key="grade" :value="grade">
             {{ grade }}
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

      <a-form-item
         label="绑定班级"
         name="classId"
         :rules="[{ required: true, message: '请选择班级!' }]"
      >
         <a-select
           v-model:value="formparams.classId"
           style="width: 100%"
           placeholder="请选择班级"
           :loading="classList.length === 0 && formparams.grade"
           :disabled="!formparams.grade"
         >
           <a-select-option v-for="cls in classList" :key="cls.id" :value="cls.id">
             {{ cls.name }}
           </a-select-option>
         </a-select>
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
import { reactive, computed, onMounted } from 'vue'
import { UserOutlined, LockOutlined, MobileOutlined } from '@ant-design/icons-vue';
import { postTeacherApi } from '@/servers/api/teacher';
import { postUserApi, postUserLogin } from '@/servers/api/user';
import { putClassesDetailApi } from '@/servers/api/classes';
import router from '@/router';
import { useUserStore } from '@/store';
import { message } from 'ant-design-vue';
import { useSchoolSelection } from '@/composables/useSchoolSelection';

// 使用共用的学校/年级/班级选择逻辑
const {
  schoolList,
  gradeList,
  classList,
  fetchGradesBySchool,
  fetchClassesByGrade,
  loadSchoolData,
} = useSchoolSelection();

// 表单参数
interface FormParams {
  uid: string
  password: string
  name: string
  phone: string
  schoolName: string
  grade: string
  subject: string
  classId: number | undefined
}

const disabled = computed(() => {
  return !(formparams.uid && formparams.password && formparams.name && formparams.phone && formparams.schoolName && formparams.grade && formparams.subject && formparams.classId);
});

const formparams = reactive<FormParams>({
  uid: '',
  password: '',
  name: '',
  phone: '',
  schoolName: '',
  grade: '',
  subject: '',
  classId: undefined
})

const userStore = useUserStore();

// 学校选择事件处理
const handleSchoolChange = async (value: string) => {
  formparams.schoolName = value;
  formparams.grade = '';
  formparams.classId = undefined;
  await fetchGradesBySchool(value);
};

// 年级选择事件处理
const handleGradeChange = async (value: string) => {
  formparams.grade = value;
  formparams.classId = undefined;
  await fetchClassesByGrade(formparams.schoolName, value);
};

// 提交表单
const onFinish = async (values: any) => {
  try {
    // 先查找选中学校的ID
    console.log('Selected school:', formparams.schoolName);
    const selectedSchool = schoolList.value.find(school => school.name === formparams.schoolName);
    const schoolId = selectedSchool ? selectedSchool.name : '';
    
    // 注册教师信息
    const teacherData = {
      uid: formparams.uid,
      name: formparams.name,
      subject: formparams.subject,
      school_id: schoolId
    };
    
    const teacherRes = await postTeacherApi(teacherData);
    console.log('Teacher registration response:', teacherRes);
    if (teacherRes.code !== 200) {
      message.error('教师信息注册失败！');
      return;
    }

    // 注册用户信息
    const userData = {
      email: formparams.uid, // 使用账号作为邮箱
      password: formparams.password,
      name: formparams.name,
      phone: formparams.phone,
      school_id: schoolId,
      role: formparams.uid, // 使用账号作为角色标识
      bind_state: true,
    };
    
    const registerRes = await postUserApi(userData);
    if (registerRes.code !== 200) {
      message.error('用户注册失败！');
      return;
    }
    
    message.success('注册成功！');
    
    // 自动登录
    const loginRes = await postUserLogin({
      email: formparams.uid,
      password: formparams.password
    });
    
    if (loginRes.code !== 200) {
      message.error('自动登录失败，请手动登录');
      router.push('/user/login');
      return;
    }
    
    // 存储用户信息和token
    localStorage.setItem('user', JSON.stringify(loginRes.data));
    localStorage.setItem('token', loginRes.data.token);
    userStore.setUserInfo({
      ...loginRes.data,
      token: loginRes.data.token
    });

    // 登录成功后，更新班级的班主任信息（此时有token）
    if (formparams.classId) {
      try {
        await putClassesDetailApi(
          { class_id: formparams.classId },
          { header: formparams.uid }
        );
        console.log('班级班主任绑定成功');
      } catch (error) {
        console.error('班级班主任绑定失败:', error);
        message.error('班级班主任绑定失败！');
        return;
      }
    }
    
    message.success('注册并登录成功！');
    router.push('/teacher_info');
  } catch (error) {
    console.error('注册过程出错:', error);
    message.error('注册失败，请重试');
  }
}

const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo)
  message.error('注册失败！');
}

// 组件挂载时加载学校数据
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

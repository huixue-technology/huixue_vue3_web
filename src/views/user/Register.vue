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
         label=" 手 机 号 "
         name="email"
         :rules="[
            { required: true, message: '请输入用户邮箱!' },
            {pattern: /^1[3456789]\d{9}$/,message: '请输入正确的手机号格式'}
            ]"
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
         label="昵称"
         name="name"
         :rules="[{ required: true, message: '请输入真实姓名!' }]"
      >
         <a-input v-model:value="formparams.name">
         <template #prefix>
            <UserOutlined class="site-form-item-icon" />
         </template>
         </a-input>
      </a-form-item>

      <!-- 学校选择器 -->
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
         label="所在班级"
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
       
      <a-form-item
         label="学生姓名"
         name="stuName"
         :rules="[{ required: true, message: '请输入学生姓名!' }]"
      >
         <a-input 
           v-model:value="formparams.stuName"
           placeholder="请输入学生姓名"
         >
           <template #prefix>
             <UserOutlined class="site-form-item-icon" />
           </template>
         </a-input>
      </a-form-item>


      <a-form-item>
         <a-button :disabled="disabled" type="primary" html-type="submit" class="login-form-button">
         注册
         </a-button>
         或者
         <router-link to="/user/login">登录</router-link>
         |
         <router-link to="/user/teacher-register">教师注册</router-link>
      </a-form-item>
   </a-form>
</div>

</template>
<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons-vue';
import { postUserApi, postUserLogin } from '@/servers/api/user';
import { getStudentApi } from '@/servers/api/student';
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
  email: string
  password: string
  name: string
  schoolName: string
  grade: string
  classId: number
  stuName: string
  role: string
}

// 扩展的绑定状态类型，包含uid
interface ExtendedBindStatus {
  id: string
  school: string
  class_id: string
  stuName: string
  uid: string
}

const disabled = computed(() => {
  return !(formparams.email && formparams.password && formparams.name && formparams.schoolName && formparams.grade && formparams.classId && formparams.stuName);
});

const formparams = reactive<FormParams>({
  email: '',
  password: '',
  name:'',
  schoolName: '',
  grade: '',
  classId: 0,
  stuName: '',
  role:''
})

const userStore = useUserStore();

// 学校选择事件处理
const handleSchoolChange = async (value: string) => {
  formparams.schoolName = value;
  formparams.grade = '';
  formparams.classId = 0;
  formparams.stuName = '';
  await fetchGradesBySchool(value);
};

// 年级选择事件处理
const handleGradeChange = async (value: string) => {
  formparams.grade = value;
  formparams.classId = 0;
  formparams.stuName = '';
  await fetchClassesByGrade(formparams.schoolName, value);
};

const onFinish = async (values: any) => {
  try {
    // 先验证学生是否存在
    const status_id = await getStudentApi({
      class_id: formparams.classId, 
      school: formparams.schoolName,
      name: formparams.stuName
    });
    
    if (!status_id.data || status_id.data.length === 0) {
      message.error('未找到该学生信息，请检查姓名是否正确！');
      return;
    }
    
    formparams.role = status_id.data[0].uid;
    console.log('status_id:', status_id);
    
    // 注册用户
    const registerRes = await postUserApi(formparams);
    if (registerRes.code !== 200) {
      message.error(registerRes.message || '注册失败！');
      return;
    }
    
    console.log('注册成功:', registerRes);
    message.success('注册成功！');
    
    // 注册成功后自动登录
    const loginRes = await postUserLogin({
      email: formparams.email,
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
    
    // 进行角色绑定
    const selectedStudent = status_id.data[0];
    
    console.log('选中的学生信息:', selectedStudent);
    
    const bindData: ExtendedBindStatus = {
      id: loginRes.data.id,
      school: formparams.schoolName,
      class_id: String(formparams.classId),
      stuName: formparams.stuName,
      uid: selectedStudent.uid
    };
    
    // 调用角色绑定接口
    const { putUserBindStatus } = await import('@/servers/api/user');
    
    // 使用原有的绑定接口（不包含uid）
    const basicBindData = {
      id: loginRes.data.id,
      school: formparams.schoolName,
      class_id: String(formparams.classId),
      stuName: formparams.stuName
    };
    
    const bindRes = await putUserBindStatus(basicBindData);
    console.log('绑定结果:', bindRes);
    console.log('学生UID:', selectedStudent.uid);
    
    if (bindRes.success || bindRes.code === 200) {
      message.success('注册并绑定成功！');
      
      // 根据用户类型跳转
      const user = userStore.getUserInfo();
      if (user['teacher'] !== undefined) {
        router.push('/teacher_info');
      } else {
        router.push('/grade');
      }
    } else {
      message.error('角色绑定失败，请在个人中心重新绑定');
      router.push('/grade');
    }
  } catch (error) {
    console.error('注册或绑定过程出错:', error);
    message.error('注册失败，请检查输入的信息是否正确');
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
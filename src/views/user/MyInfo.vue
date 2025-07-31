<template>
  <div class="my-info-container">
    <div>
    <a-radio-group v-model:value="size" @change="onChange">
      <a-radio value="default">默认大小</a-radio>
      <a-radio value="middle">中等</a-radio>
      <a-radio value="small">较小</a-radio>
    </a-radio-group>
    <br />
    <br />
    <a-descriptions bordered title="个人信息展示" :size="size" class = "my-info-container">
      <template #extra>
        <div>
          <a-button type="dashed" @click="showBindModal">绑定学生信息</a-button>
        </div>
        <div class = "my-info-button">
          <a-button type="primary" @click="showModifyModal">修改信息</a-button>
        </div>
      </template>
      
      <a-descriptions-item label="用户姓名">{{ userData.name }}</a-descriptions-item>
      <a-descriptions-item label="学生姓名">{{ userData?.student?.name }}</a-descriptions-item>
      <a-descriptions-item label="考号">{{ userData?.student?.uid }}</a-descriptions-item>
      <a-descriptions-item label="学校">{{ userData?.student?.school }}</a-descriptions-item>
      <a-descriptions-item label="班级编号">{{ userData?.student?.class_id }}</a-descriptions-item>
      <a-descriptions-item label="年级">{{ userData?.student?.grade }}</a-descriptions-item>
      <a-descriptions-item label="选科情况">{{ userData?.student?.subject_selection }}</a-descriptions-item>
      <a-descriptions-item label="是否在读">{{userData?.student?.state==1?'在读':'不在读'}}</a-descriptions-item>
      <a-descriptions-item label="个人邮箱">{{ userData.email }}</a-descriptions-item>
      <a-descriptions-item label="联系方式">{{ userData.phone }}</a-descriptions-item>
      <a-descriptions-item label="个人简介">
        Data disk type: MongoDB
        
       
      </a-descriptions-item>
    </a-descriptions>
    
 
  </div>
  <div>
    <a-modal v-model:open="open" title="修改信息" @ok="handleOk1">
      <a-form >
        <a-form-item label="个人邮箱">
          <a-input v-model:value="email" placeholder="请输入个人邮箱" />
        </a-form-item>
        <a-form-item  label="联系方式">
          <a-input v-model:value="phone" placeholder="请输入联系方式" />
        </a-form-item>
      </a-form>

    </a-modal>
  </div>

  <div>
    <a-modal v-model:open="bindOpen" title="绑定学生信息" @ok="handleOk2" >
      <a-form >
        <a-form-item label="姓名">
          <a-input v-model:value="name" placeholder="" disabled />
        </a-form-item>
        <a-form-item  label="邮箱">
          <a-input v-model:value="email" placeholder="" disabled />
        </a-form-item>
        <a-form-item label="所在学校">
          <a-select
            v-model:value="schoolName"
            @change="onSchoolChange"
            style="width: 100%"
            placeholder="请选择学校"
          >
            <a-select-option v-for="school in schoolList" :key="school.name" :value="school.id">
              {{ school.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="所在班级">
          <a-select
            v-model:value="classId"
            @change="onClassChange"
            style="width: 100%"
            placeholder="请选择班级"
          >
            <a-select-option v-for="cls in classList" :key="cls.id">
              {{ cls.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="姓名">
          <a-select
            v-model:value="stuName"
            style="width: 100%"
            @change="onStudentChange"
            placeholder="请选择学生"
          >
            <a-select-option v-for="student in studentList" :key="student.id" :value="student.name">
              {{ student.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>

    </a-modal>
  </div>
  </div>
</template>



<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { message, type DescriptionsProps,type Form, type FormItem, type Input,Modal } from 'ant-design-vue';
import { useUserStore } from '@/store';
// 导入putUserDetailApi
import { putUserBindStatus, putUserDetailApi } from '@/servers/api/user';
import { getSchoolApi } from '@/servers/api/school'; // 新增
import { getClassesApi } from '@/servers/api/classes'; // 新增
import { getStudentApi } from '@/servers/api/student'; // 新增
import { useLogout } from '@/composables/useLogout';
const size = ref<DescriptionsProps['size']>('default');
const schoolList = ref<any[]>([]); // 新增 学校列表
const classList = ref<any[]>([]); // 新增 班级列表
const studentList = ref<any[]>([]); // 新增 学生列表
const schoolId = ref(); // 新增 当前选中学校
const schoolName = ref();
const classId = ref(0); // 新增 当前选中班级

const onChange = (e: any) => {
  console.log('size checked', e.target.value);
  size.value = e.target.value;
};

const open = ref<boolean>(false);//控制修改页面弹出
const bindOpen = ref<boolean>(false);//控制绑定页面弹出
const email = ref('');
const phone = ref('');
const name = ref('');
const role = ref('');
const class_id = ref('');
const stuName = ref('');
const school = ref('');

const userStore = useUserStore();
const userData = userStore.userInfo;
const showModifyModal = () => {
  open.value = true;
  email.value = userData.email??'';
  phone.value = userData.phone??'';
};
const showBindModal = () => {
  bindOpen.value = true;
  name.value = userData.name??'';
  email.value = userData.email??'';
};
const handleOk1 = () =>{
  // 构造包含user_id的params对象和用户信息对象
  const params = { user_id: String(userData.id) };
  const userInfo = {
    phone: phone.value,
    email: email.value,
    name: userData.name,
    password: userData.password
  };
  
  const { logout } = useLogout();
  
  // 调用putUserDetailApi并传递正确的参数
  putUserDetailApi(params, userInfo).then((res: any)=>{
    console.log(res);
    // 刷新用户信息
    message.success('修改成功,请重新登录');
    logout();
    return;
    
  });
  
  open.value = false;
};
const handleOk2 = () =>{
  // 构造包含user_id的params对象和用户信息对象
  const params = { id: String(userData.id),school: String(schoolName.value),class_id: String(classId.value),stuName: String(stuName.value)};
  
  const { logout } = useLogout();
  putUserBindStatus(params).then((res: any)=>{
    if(res.code === 200){
      message.success('绑定成功');
      logout();
    }else{
      message.error('绑定失败');
    }
});
}

onMounted(() => {
  getSchoolApi({}).then((res: any) => {
    schoolList.value = res.data;
    schoolId.value = schoolList.value[0].school_id;
    schoolName.value = schoolList.value[0].name;
    getClassesApi({ school_id: schoolId.value }).then((res: any) => {
      classList.value = res.data;
      classId.value = classList.value[0].id;
      getStudentApi({ class_id: classId.value,school:schoolName.value,size:100 }).then((res: any) => {
        studentList.value = res.data;
        stuName.value = studentList.value[0].name;
      });
    });
  });
});



// 新增学校选择事件处理
const onSchoolChange = async (value: number) => {
  schoolId.value = value;
  schoolName.value = schoolList.value.find((item: any) => item.id === value).name;
  const res = await getClassesApi({ school_id: value });
  if (res.code === 200){
    classList.value = res.data;
    classId.value = classList.value ? classList.value[0].id : null;
    if(!classId.value){
      studentList.value = [];
      stuName.value = '';
    }
  }else{
    message.error(res.message);
  }
};

// 新增班级选择事件处理
const onClassChange = async (value: number) => {
  console.log(`selected ${schoolName.value}`);
  classId.value = value;
  const res = await getStudentApi({ class_id: value,school: schoolName.value,size:100 });
  if (res.code === 200){
    studentList.value = res.data;
    stuName.value = studentList.value[0]?.name;
  }else{
    message.error(res.message);
  }
};

const onStudentChange = (value:string) =>{
  stuName.value = value;
}
</script>

<style scoped>
::v-deep(.ant-descriptions-item-label),
::v-deep(.ant-descriptions-item-content) {
  text-align: center;
}
::v-deep(.ant-descriptions-item-label) {
  font-weight: bold;
}
.my-info-button{
  margin-top: 16px;
}

</style>
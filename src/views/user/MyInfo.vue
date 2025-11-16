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
        <a-form-item label="昵称">
          <a-input v-model:value="name" placeholder="" disabled />
        </a-form-item>
        <a-form-item  label="邮箱">
          <a-input v-model:value="email" placeholder="" disabled />
        </a-form-item>
        <!-- 输入学生姓名 -->
        <a-form-item label="学生姓名">
          <a-input-search
            v-model:value="inputStuName"
            placeholder="请输入学生姓名"
            enter-button="搜索"
            @search="onSearchStudent"
          />
        </a-form-item>
        
        <!-- 显示学生所在班级列表 -->
        <a-form-item label="所在班级" v-if="classList.length > 0">
          <a-select
            v-model:value="classId"
            style="width: 100%"
            placeholder="请选择班级"
            :options="classList.map(cls => ({ label: `${cls.name} (${cls.school_name})`, value: cls.id }))"
          >
          </a-select>
        </a-form-item>
        
        <!-- 学生信息确认 -->
        <a-form-item label="确认学生" v-if="selectedStudent">
          <a-descriptions size="small" :column="1">
            <a-descriptions-item label="学生姓名">{{ selectedStudent.name }}</a-descriptions-item>
            <a-descriptions-item label="考号">{{ selectedStudent.uid }}</a-descriptions-item>
            <a-descriptions-item label="学校">{{ selectedStudent.school_name || selectedStudent.school }}</a-descriptions-item>
            <a-descriptions-item label="年级">{{ selectedStudent.grade }}</a-descriptions-item>
          </a-descriptions>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { message, type DescriptionsProps } from 'ant-design-vue';
import { useUserStore } from '@/store';
import { putUserBindStatus, putUserDetailApi } from '@/servers/api/user';
import { getSchoolApi } from '@/servers/api/school';
import { getClassesApi, getClassesDetailApi } from '@/servers/api/classes';
import { getStudentApi } from '@/servers/api/student';
import { useLogout } from '@/composables/useLogout';

// 定义响应式变量
const size = ref<DescriptionsProps['size']>('default');
const schoolList = ref<any[]>([]);
const classList = ref<any[]>([]);
const studentList = ref<any[]>([]);
const open = ref<boolean>(false);
const bindOpen = ref<boolean>(false);
const email = ref('');
const phone = ref('');
const name = ref('');
const inputStuName = ref('');
const classId = ref<number | undefined>(undefined);
const selectedStudent = ref<any>(null);

// 获取用户信息
const userStore = useUserStore();
const userData = userStore.userInfo;

// 定义函数
const onChange = (e: any) => {
  console.log('size checked', e.target.value);
  size.value = e.target.value;
};

const showModifyModal = () => {
  open.value = true;
  email.value = userData.email ?? '';
  phone.value = userData.phone ?? '';
};

const showBindModal = () => {
  bindOpen.value = true;
  name.value = userData.name ?? '';
  email.value = userData.email ?? '';
  resetBindForm();
};

const resetBindForm = () => {
  inputStuName.value = '';
  classList.value = [];
  classId.value = undefined;
  selectedStudent.value = null;
};

const handleOk1 = () => {
  const params = { user_id: String(userData.id) };
  const userInfo = {
    phone: phone.value,
    email: email.value,
    name: userData.name,
    password: userData.password
  };

  const { logout } = useLogout();

  putUserDetailApi(params, userInfo).then((res: any) => {
    console.log(res);
    message.success('修改成功,请重新登录');
    logout();
    return;
  });

  open.value = false;
};

const handleOk2 = () => {
  if (!classId.value) {
    message.warning('请选择班级');
    return;
  }

  if (!selectedStudent.value) {
    message.warning('未找到学生信息');
    return;
  }

  const params = {
    id: String(userData.id),
    school: String(selectedStudent.value.school_name || selectedStudent.value.school),
    class_id: String(classId.value),
    stuName: String(selectedStudent.value.name)
  };

  const { logout } = useLogout();
  putUserBindStatus(params).then((res: any) => {
    if (res.code === 200) {
      message.success('绑定成功');
      logout();
    } else {
      message.error('绑定失败');
    }
  });
};

const onSearchStudent = async (value: string) => {
  if (!value.trim()) {
    message.warning('请输入学生姓名');
    return;
  }

  try {
    const res = await getStudentApi({ name: value, size: 100 });
    if (res.code === 200) {
      if (res.data && res.data.length > 0) {
        studentList.value = res.data;
        await getClassListByStudents(res.data);
        
      } else {
        message.info('未找到该学生');
        classList.value = [];
        classId.value = undefined;
        selectedStudent.value = null;
      }
    } else {
      message.error(res.message || '查询学生信息失败');
    }
  } catch (error) {
    message.error('查询学生信息异常');
    console.error(error);
  }
};

const getClassListByStudents = async (students: any[]) => {
  try {
    classList.value = [];
    classId.value = undefined;
    selectedStudent.value = null;
    console.log('Getting class list for students:', students);
    // 获取所有涉及到的班级ID
    const classIds = Array.from(new Set(students.map(s => s.class_id)));

    // 获取每个班级的信息
    const classInfoMap: Record<number, any> = {};
    
    // 并行获取所有班级详情
    const classPromises = classIds.map(classId => 
      getClassesDetailApi({ class_id: classId }).catch(() => null)
    );
    
    const classResults = await Promise.all(classPromises);
    
    console.log('classResults:', classResults);
    classResults.forEach(result => {
      if (result && result.code === 200 && result.data) {
        classInfoMap[result.data[0].id] = result.data[0];
      }
    });
    console.log('classInfoMap:', classInfoMap);
    // 构建最终的班级列表
    const finalClassList: any[] = [];
    students.forEach(student => {
      const classInfo = classInfoMap[student.class_id];
      if (classInfo) {
        finalClassList.push({
          id: student.class_id,
          name: classInfo.name,
          school_name: student.school_name || student.school
        });
      }
    });

    classList.value = finalClassList;

    // 如果有班级列表，自动选中第一个
    if (finalClassList.length > 0) {
      classId.value = finalClassList[0].id;
      // 手动触发班级选择变化，设置选中的学生
      onClassChange(finalClassList[0].id);
    }
  } catch (error) {
    message.error('获取班级信息异常');
    console.error(error);
  }
};

// 当班级选择变化时的处理函数
const onClassChange = (value: number) => {
  classId.value = value;
  // 查找选中的学生
  const matchedStudent = studentList.value.find(s => s.class_id === value);
  if (matchedStudent) {
    selectedStudent.value = matchedStudent;
  }
};

// 监听班级选择变化
watch(classId, (newVal) => {
  if (newVal) {
    onClassChange(newVal);
  }
});
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
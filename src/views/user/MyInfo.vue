<template>
  <div class="my-info-container">
    <div class="profile-header">
      <h2 class="user-name">{{ userData.name }} 的个人中心</h2>
      <div class="user-role">{{ userData?.student ? '学生用户' : '教师用户' }}</div>
    </div>

    <div class="cards-container">
      <div class="profile-card card">
        <div class="card-header">
          <span class="card-title">基本信息</span>
        </div>
        <div class="card-body">
          <div class="actions">
            <a-button type="primary" @click="showModifyModal">
              <EditOutlined /> 编辑信息
            </a-button>
          </div>
          
          <a-row :gutter="[24, 24]">
            <a-col :span="24">
              <div class="info-item">
                <span class="info-label">用户姓名：</span>
                <span class="info-value">{{ userData.name }}</span>
              </div>
            </a-col>
            
            <a-col :span="24">
              <div class="info-item">
                <span class="info-label">登录手机号：</span>
                <span class="info-value">{{ userData.email }}</span>
              </div>
            </a-col>
            
            <a-col :span="24" v-if="userData.phone">
              <div class="info-item">
                <span class="info-label">联系方式：</span>
                <span class="info-value">{{ userData.phone }}</span>
              </div>
            </a-col>
          </a-row>
        </div>
      </div>

      <div class="profile-card card" v-if="userData?.student">
        <div class="card-header">
          <span class="card-title">学生信息</span>
        </div>
        <div class="card-body">
          <div class="actions">
            <a-button type="dashed" @click="showBindModal">
              <SwapOutlined /> 更换绑定
            </a-button>
          </div>
          
          <a-row :gutter="[24, 24]">
            <a-col :span="12">
              <div class="info-item">
                <span class="info-label">学生姓名：</span>
                <span class="info-value">{{ userData?.student?.name }}</span>
              </div>
            </a-col>
            
            <!-- <a-col :span="12">
              <div class="info-item">
                <span class="info-label">考号：</span>
                <span class="info-value">{{ userData?.student?.uid }}</span>
              </div>
            </a-col> -->
            
            <a-col :span="12">
              <div class="info-item">
                <span class="info-label">学校：</span>
                <span class="info-value">{{ userData?.student?.school }}</span>
              </div>
            </a-col>
            
            <a-col :span="12">
              <div class="info-item">
                <span class="info-label">班级编号：</span>
                <span class="info-value">{{ userData?.student?.class_id }}</span>
              </div>
            </a-col>
            
            <a-col :span="12">
              <div class="info-item">
                <span class="info-label">年级：</span>
                <span class="info-value">{{ userData?.student?.grade }}</span>
              </div>
            </a-col>
            
            <a-col :span="12">
              <div class="info-item">
                <span class="info-label">选科情况：</span>
                <span class="info-value">{{ userData?.student?.subject_selection }}</span>
              </div>
            </a-col>
            
            <a-col :span="12">
              <div class="info-item">
                <span class="info-label">是否在读：</span>
                <span class="info-value" :class="{'status-active': userData?.student?.state == 1}">
                  {{ userData?.student?.state == 1 ? '在读' : '不在读' }}
                </span>
              </div>
            </a-col>
          </a-row>
        </div>
      </div>

      <div class="profile-card card" v-else>
        <div class="card-header">
          <span class="card-title">绑定学生信息</span>
        </div>
        <div class="card-body">
          <div class="actions">
            <a-button type="primary" @click="showBindModal">
              <UserAddOutlined /> 绑定学生
            </a-button>
          </div>
          
          <a-empty description="暂未绑定学生信息" />
        </div>
      </div>
    </div>
    
    <div>
      <a-modal v-model:open="open" title="修改信息" @ok="handleOk1" :confirm-loading="confirmLoading">
        <a-form>
          <a-form-item label="个人邮箱">
            <a-input v-model:value="email" placeholder="请输入个人邮箱" />
          </a-form-item>
          <a-form-item label="联系方式">
            <a-input v-model:value="phone" placeholder="请输入联系方式" />
          </a-form-item>
        </a-form>
      </a-modal>
    </div>

    <div>
      <a-modal v-model:open="bindOpen" title="绑定学生信息" @ok="handleOk2" :confirm-loading="bindConfirmLoading">
        <a-form>
          <a-form-item label="昵称">
            <a-input v-model:value="name" placeholder="" disabled />
          </a-form-item>
          <a-form-item label="邮箱">
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
              <!-- <a-descriptions-item label="考号">{{ selectedStudent.uid }}</a-descriptions-item> -->
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
import { message } from 'ant-design-vue';
import { EditOutlined, SwapOutlined, UserAddOutlined } from '@ant-design/icons-vue';
import { useUserStore } from '@/store';
import { putUserBindStatus, putUserDetailApi } from '@/servers/api/user';
import { getSchoolApi } from '@/servers/api/school';
import { getClassesApi, getClassesDetailApi } from '@/servers/api/classes';
import { getStudentApi } from '@/servers/api/student';
import { useLogout } from '@/composables/useLogout';

// 定义响应式变量
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
const confirmLoading = ref<boolean>(false);
const bindConfirmLoading = ref<boolean>(false);

// 获取用户信息
const userStore = useUserStore();
const userData = userStore.userInfo;

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
  confirmLoading.value = true;
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
    setTimeout(() => {
      logout();
    }, 1500);
  }).finally(() => {
    confirmLoading.value = false;
    open.value = false;
  });
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

  bindConfirmLoading.value = true;
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
      setTimeout(() => {
        logout();
      }, 1500);
    } else {
      message.error('绑定失败');
    }
  }).finally(() => {
    bindConfirmLoading.value = false;
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

<style scoped lang="less">
.my-info-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  
  .profile-header {
    text-align: center;
    padding: 30px 0;
    background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    .user-name {
      color: #fff;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .user-role {
      color: rgba(255, 255, 255, 0.85);
      font-size: 14px;
    }
  }
  
  .cards-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    
    .card-header {
      background: linear-gradient(120deg, #f0f2f5, #e4e7ec);
      border-bottom: 1px solid #e8e8e8;
      padding: 16px 20px;
      
      .card-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
    }
    
    .card-body {
      padding: 24px;
      
      .actions {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 20px;
      }
      
      .info-item {
        display: flex;
        padding: 12px 0;
        border-bottom: 1px dashed #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .info-label {
          flex: 0 0 100px;
          font-weight: 500;
          color: #666;
        }
        
        .info-value {
          flex: 1;
          color: #333;
          
          &.status-active {
            color: #52c41a;
            font-weight: 500;
          }
        }
      }
    }
  }
  
  :deep(.ant-card-body) {
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .my-info-container {
    padding: 12px;
    
    .card {
      .card-body {
        padding: 16px;
        
        .info-item {
          .info-label {
            flex: 0 0 80px;
            font-size: 14px;
          }
          
          .info-value {
            font-size: 14px;
          }
        }
      }
    }
  }
}
</style>
<template>
  <div class="container">
    <div class="header">
      <h2>班级综合分析</h2>
      <a-space>
        <a-select
          v-model:value="selectedClass"
          placeholder="请选择班级"
          style="width: 200px;"
        >
          <a-select-option v-for="item in classList" :key="item.id" :value="item.id">
            {{ item.name }}
          </a-select-option>
        </a-select>
        <a-button type="primary" @click="batchComputeData">查询数据</a-button>
      </a-space>
    </div>
    <a-spin :spinning="loading">
      <!-- 学生过线率统计 -->
      <ClassAnalysis 
        ref="classAnalysisRef"
        :class-id="selectedClass"
      />
  <!-- 分数线过线率 -->
          <PassLineRate 
            :pass-line-rate-data="passLineRateData" 
            :class-info="currentClassInfo"
          />
      
      
      
      <!-- 优秀与待关注学生 + 学生分类概览
      <StudentCategory 
        :student-grades-data="studentGradesData" 
        :classInfo="currentClassInfo"
      /> -->
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue';
import { 
  postClassAnalysis,
  postClassPassLineRate,
  postClassComprehensiveStudentGrades 
} from '@/servers/api/average';
import { useUserStore } from '@/store';
import { message } from 'ant-design-vue';
import { getClassesApi } from '@/servers/api/classes';
// 导入子组件
import ClassAnalysis from './ClassAnalysis.vue';
import PassLineRate from './components/PassLineRate.vue';

interface ClassInfo {
  id: number;
  name: string;
  header: string | null;
  school_id: string | null;
  subject_selection: string; // 新增：科目选择
}

interface TeacherInfo {
  uid: string;
  name: string;
  email: string;
  phone: string;
  school_id: string;
}

const userStore = useUserStore();
const loading = ref(false);
const selectedClass = ref<number>(0);
const classList = ref<ClassInfo[]>([]);
const teacherInfo = ref<TeacherInfo>();
const classAnalysisData = ref<any>({});
const passLineRateData = ref<any>({});
const studentGradesData = ref<any[]>([]);
const classAnalysisRef = ref<any>(null); // 子组件引用

// 计算当前班级信息
const currentClassInfo = computed((): ClassInfo | undefined => {
  return classList.value.find(item => item.id === selectedClass.value);
});

onMounted(async()=>{
  // 获取班级列表，并设置默认班级
  const userInfo = userStore.getUserInfo();
  teacherInfo.value = userInfo?.teacher
  if (!teacherInfo.value) {
    message.error('未获取到教师信息');
    return;
  }
  await getClassList(userInfo);
  if (selectedClass.value > 0) {
    loading.value = true;
    await batchComputeData();
    loading.value = false;
  }
})

watch(selectedClass, async () => {
  if (selectedClass.value > 0) {
    await batchComputeData();
  }
});

const batchComputeData = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  loading.value = true;
  
  try {
    // 并行请求所有数据
    await Promise.all([
      getClassAnalysisfunc(),
      getClassPassLineRatefunc(),
      getClassComprehensiveStudentGradesfunc()
    ]);
    
    // 刷新子组件（学生过线率统计）
    if (classAnalysisRef.value && classAnalysisRef.value.refresh) {
      await classAnalysisRef.value.refresh();
    }
  } catch (err) {
    console.error('获取数据失败:', err);
  } finally {
    loading.value = false;
  }
};

const getClassList = async (userInfo: any) => {
  const teacherHeader = String(userInfo?.role || userInfo?.teacher?.uid || '').trim();

  let classes: ClassInfo[] = [];

  if (teacherHeader) {
    const classRes = await getClassesApi({ header: teacherHeader });
    if (classRes.code === 200 && classRes.data.length > 0) {
      classes = classRes.data;
    }
  }

  // 兼容未绑定班主任的老师账号：回退全班级（可按学校过滤）
  if (classes.length === 0) {
    const allClassRes = await getClassesApi({});
    if (allClassRes.code === 200 && Array.isArray(allClassRes.data)) {
      classes = allClassRes.data;
    }
  }

  if (classes.length > 0) {
    selectedClass.value = classes[0].id;
    classList.value = classes;
  } else {
    message.error('获取班级列表失败');
    selectedClass.value = 0;
    classList.value = [];
  }
}

const getClassAnalysisfunc = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  // 班级综合分析
  const res = await postClassAnalysis({ class_ids: [selectedClass.value] });
  
  if (res.code === 200) {
    classAnalysisData.value = res.data || {};
  } else {
    console.error('获取班级综合分析失败', res);
  }
};

const getClassPassLineRatefunc = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  // 四条分数线过线率
  const res = await postClassPassLineRate({ class_ids: [selectedClass.value] });
  
  if (res.code === 200) {
    passLineRateData.value = res.data || {};
  } else {
    console.error('获取四条分数线过线率失败', res);
  }
};

const getClassComprehensiveStudentGradesfunc = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  // 根据考试分数线判断优等生、边缘生、差生
  const res = await postClassComprehensiveStudentGrades({ class_ids: [selectedClass.value] });
  
  if (res.code === 200) {
    studentGradesData.value = res.data || [];
  } else {
    console.error('根据考试分数线判断优等生、边缘生、差生失败', res);
  }
};


</script>

<style scoped lang="less">
.container {
  padding: 20px;
  position: relative;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);

  .header {
    background: linear-gradient(120deg, #4b6cb7, #1890ff);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    color: white;
    
    h2 {
      margin: 0 0 10px 0;
      font-size: 24px;
      font-weight: 600;
    }
    
    p {
      margin: 0;
      font-size: 16px;
      opacity: 0.9;
    }
  }
}
</style>

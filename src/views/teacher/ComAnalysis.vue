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
        <a-button  @click="batchComputeData">查询数据</a-button>
        <a-button 
          type="primary" 
          danger  
          @click="computeClassGradesfunc"
          :disabled="isComputing"
          :loading="isComputing"
        >
          {{ isComputing ? '计算中...' : '更新计算' }}
        </a-button>
      </a-space>
    </div>
    <a-spin :spinning="loading">
      <!-- 学生过线率统计 -->
      <ClassAnalysis 
        ref="classAnalysisRef"
        :class-id="selectedClass" 
        :task-id="taskId" 
        @computing-complete="handleComputingComplete"
      />
        <!-- 考试指标折线图 -->
        <a-col>
          <ExamMetricsChart 
            :student-grades-data="classAnalysisData" 
            :metric-label-map="metricLabelMap" 
            :class-info="currentClassInfo"
          />
        </a-col>
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
  postClassCompute,
  postClassAnalysis,
  postClassPassLineRate,
  postClassComprehensiveStudentGrades 
} from '@/servers/api/average';
import { useUserStore } from '@/store';
import { message } from 'ant-design-vue';
import { getClassesApi } from '@/servers/api/classes';
// 导入子组件
import ClassAnalysis from './ClassAnalysis.vue';
import ExamMetricsChart from './components/ExamMetricsChart.vue';
import PassLineRate from './components/PassLineRate.vue';
import StudentCategory from './components/StudentCategory.vue';

interface ClassInfo {
  id: number;
  name: string;
  header: number;
  school_id: number;
  subject_selection: string; // 新增：科目选择
}

interface TeacherInfo {
  uid: number;
  name: string;
  email: string;
  phone: string;
  school_id: number;
}

const userStore = useUserStore();
const loading = ref(false);
const classInfo = ref({name: '', class_id: 0});
const selectedClass = ref<number>(0);
const classList = ref<ClassInfo[]>([]);
const teacherInfo = ref<TeacherInfo>();
const classAnalysisData = ref<any>({});
const passLineRateData = ref<any>({});
const studentGradesData = ref<any[]>([]);
const taskId = ref<string | null>(null); // 存储计算任务的 task_id
const isComputing = ref(false); // 是否正在计算中
const classAnalysisRef = ref<any>(null); // 子组件引用

const subjectMap: Record<string, string> = {
  yuwen: '语文',
  shuxue: '数学',
  yingyu: '英语',
  wuli: '物理',
  huaxue: '化学',
  shengwu: '生物',
  lishi: '历史',
  zhengzhi: '政治',
  dili: '地理',
  sum_: '总分'
};

const metricLabelMap: Record<string, string> = {
  average: '平均分',
  averageD: '平均分排名',
  zScore: 'Z分数',
  tScore: 'T分数',
  classStd: '班级标准差',
  classCV: '班级变异系数'
};

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
  await getClassList(teacherInfo.value.uid);
  loading.value = true;
  await batchComputeData();
  loading.value = false;
})

watch(selectedClass, async () => {
  // 切换班级时清除 task_id 和计算状态
  taskId.value = null;
  isComputing.value = false;
  await batchComputeData();
});

const batchComputeData = async () => {
  loading.value = true;
  let hasShownComputingMessage = false; // 标记是否已显示计算中提示
  
  // 获取班级成绩综合分析
  const analysisResult = await getClassAnalysisfunc();
  if (analysisResult === 'computing' && !hasShownComputingMessage) {
    hasShownComputingMessage = true;
    message.info('数据正在计算中，请稍后再试');
  }

  // 获取四条分数线过线率
  const passLineResult = await getClassPassLineRatefunc();
  if (passLineResult === 'computing' && !hasShownComputingMessage) {
    hasShownComputingMessage = true;
    message.info('数据正在计算中，请稍后再试');
  }

  // 根据考试分数线判断优等生、边缘生、差生
  const studentGradesResult = await getClassComprehensiveStudentGradesfunc();
  if (studentGradesResult === 'computing' && !hasShownComputingMessage) {
    hasShownComputingMessage = true;
    message.info('数据正在计算中，请稍后再试');
  }
  
  // 刷新子组件（学生过线率统计）
  if (classAnalysisRef.value && classAnalysisRef.value.refresh) {
    await classAnalysisRef.value.refresh();
  }
  
  loading.value = false;
};

const getClassList = async (teacherId: number) => {
  const classRes = await getClassesApi({ header: teacherId });
  if (classRes.code === 200 && classRes.data.length > 0) {
    selectedClass.value = classRes.data[0].id;
    classList.value = classRes.data;
  }else {
    message.error(classRes.msg || '获取班级列表失败');
    classList.value = [];
  }
}

const getClassAnalysisfunc = async () => {
  // 班级综合分析
  const res = await postClassAnalysis({ class_ids: [selectedClass.value] });
  
  // 检查是否正在计算中
  if (res.status === 'computing' || res.data?.status === 'computing') {
    isComputing.value = true;
    return 'computing'; // 返回状态，不显示提示
  }
  
  if (res.code !== 200) {
    console.error('获取班级综合分析失败', res);
    return 'error';
  }
  
  isComputing.value = false;
  classAnalysisData.value = res.data || {};
  return 'success';
};

const getClassPassLineRatefunc = async () => {
  // 四条分数线过线率
  const res = await postClassPassLineRate({ class_ids: [selectedClass.value] });
  
  // 检查是否正在计算中
  if (res.status === 'computing' || res.data?.status === 'computing') {
    isComputing.value = true;
    return 'computing'; // 返回状态，不显示提示
  }
  
  if (res.code !== 200) {
    console.error('获取四条分数线过线率失败', res);
    return 'error';
  }
  
  isComputing.value = false;
  passLineRateData.value = res.data || {};
  return 'success';
};

const getClassComprehensiveStudentGradesfunc = async () => {
  // 根据考试分数线判断优等生、边缘生、差生
  const res = await postClassComprehensiveStudentGrades({ class_ids: [selectedClass.value] });
  
  // 检查是否正在计算中
  if (res.status === 'computing' || res.data?.status === 'computing') {
    isComputing.value = true;
    return 'computing'; // 返回状态，不显示提示
  }
  
  if (res.code !== 200) {
    console.error('根据考试分数线判断优等生、边缘生、差生失败', res);
    return 'error';
  }
  
  isComputing.value = false;
  studentGradesData.value = res.data || [];
  return 'success';
};

const computeClassGradesfunc = async () => {
  // 如果正在计算中，阻止重复点击
  if (isComputing.value) {
    message.warning('数据正在计算中，请稍后再试');
    return;
  }
  
  loading.value = true;
  try {
    // 计算班级成绩综合分析
    const res = await postClassCompute({ class_id: String(selectedClass.value) });
    
    // 检查是否已经有任务在计算中
    if (res.status === 'computing' || res.data?.status === 'computing') {
      isComputing.value = true;
      const runningTasks = res.running_tasks || res.data?.running_tasks || 0;
      message.warning(
        res.message || res.data?.message || 
        `数据正在计算中，当前有 ${runningTasks} 个任务运行中，请稍后再试`
      );
      return;
    }
    
    if (res.code === 200) {
      // 保存 task_id
      if (res.data?.task_id) {
        taskId.value = res.data.task_id;
        isComputing.value = true; // 标记为计算中
        message.success('计算任务已提交，正在后台处理...');
      } else {
        message.success(res.data?.message || '计算任务已提交');
      }
    } else if (res.code === 202) {
      // 任务已接受，正在处理
      if (res.data?.task_id) {
        taskId.value = res.data.task_id;
        isComputing.value = true; // 标记为计算中
      }
      message.info('计算任务已提交，正在后台处理...');
    } else {
      message.error(res.message || '计算任务提交失败');
    }
  } catch (err: any) {
    console.error('计算任务提交失败:', err);
    // 检查错误响应中是否包含 computing 状态
    if (err?.data?.status === 'computing' || err?.response?.data?.status === 'computing') {
      isComputing.value = true;
      message.warning(err?.data?.message || err?.response?.data?.message || '数据正在计算中，请稍后再试');
    } else {
      message.error('计算任务提交失败');
    }
  } finally {
    loading.value = false;
  }
};

// 处理计算完成事件
const handleComputingComplete = async () => {
  // 计算完成，解除计算中状态
  isComputing.value = false;
  
  // 刷新其他数据
  loading.value = true;
  
  try {
    // 并行请求所有数据
    await Promise.all([
      getClassAnalysisfunc(),
      getClassPassLineRatefunc(),
      getClassComprehensiveStudentGradesfunc()
    ]);
    
    message.success('数据已更新');
  } catch (err) {
    console.error('刷新数据失败:', err);
  } finally {
    loading.value = false;
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

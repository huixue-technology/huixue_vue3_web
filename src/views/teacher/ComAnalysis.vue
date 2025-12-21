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
        <a-button type="primary" danger  @click="computeClassGradesfunc">更新计算</a-button>
      </a-space>
    </div>
    <a-spin :spinning="loading">
      <!-- 学生过线率统计 -->
      <ClassAnalysis :class-id="selectedClass" />
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
      
      
      
      <!-- 优秀与待关注学生 + 学生分类概览 -->
      <StudentCategory 
        :student-grades-data="studentGradesData" 
        :classInfo="currentClassInfo"
      />
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
  console.log("初始化加载...")
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
  await batchComputeData();
});

const batchComputeData = async () => {
  loading.value = true;
  // 获取班级成绩综合分析
  console.log("获取班级成绩综合分析...")
  await getClassAnalysisfunc();

  // 获取四条分数线过线率
  console.log("获取四条分数线过线率...")
  await getClassPassLineRatefunc();

  // 根据考试分数线判断优等生、边缘生、差生
  console.log("根据考试分数线判断优等生、边缘生、差生...")
  await getClassComprehensiveStudentGradesfunc();
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
  if (res.code !== 200) {
    console.error('获取班级综合分析失败', res);
    return;
  }
  classAnalysisData.value = res.data || {};
};

const getClassPassLineRatefunc = async () => {
  // 四条分数线过线率
  const res = await postClassPassLineRate({ class_ids: [selectedClass.value] });
  if (res.code !== 200) {
    console.error('获取四条分数线过线率失败', res);
    return;
  }
  passLineRateData.value = res.data || {};
};

const getClassComprehensiveStudentGradesfunc = async () => {
  // 根据考试分数线判断优等生、边缘生、差生
  const res = await postClassComprehensiveStudentGrades({ class_ids: [selectedClass.value] });
  if (res.code !== 200) {
    console.error('根据考试分数线判断优等生、边缘生、差生失败', res);
    return;
  }
  studentGradesData.value = res.data || [];
};

const computeClassGradesfunc = async () => {
  // 计算班级成绩综合分析
  const res = await postClassCompute({ class_id: String(selectedClass.value) });
  if (res.code !== 200) {
    console.error('获取班级成绩综合分析失败', res);
    return;
  }
  message.success(res.data);
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

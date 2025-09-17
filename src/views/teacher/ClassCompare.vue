<template>
  <div class="class-compare-container">
    <!-- 头部区域 -->
    <div class="header">
      <h2>班级对比</h2>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <!-- 考试选择 -->
      <div class="filter-item">
        <span class="label">考试：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        <a-select
          v-model:value="selectedExamId"
          placeholder="选择考试"
          style="width: 200px"
          @change="handleExamChange"
          :disabled="loading"
        >
          <a-select-option
            v-for="exam in examList"
            :key="exam.id"
            :value="exam.id"
          >
            {{ exam.name }}
          </a-select-option>
        </a-select>
      </div>

      <!-- 班级选择与对比按钮 -->
      <div class="class-selector">
        <div class="filter-item">
          <span class="label">我的班级：</span>
          <a-select
            v-model:value="selectedClass1"
            placeholder="我的班级"
            style="width: 200px"
            disabled  
          >
            <a-select-option
              :key="currentClass.id"
              :value="currentClass.id"
            >
              {{ currentClass.name }}
            </a-select-option>
          </a-select>
        </div>

        <div class="versus">VS</div>

        <div class="filter-item">
          <span class="label">挑战班级：</span>
          <a-select
            v-model:value="selectedClass2"
            placeholder="选择班级"
            style="width: 200px"
            :disabled="loading"
          >
            <a-select-option
              v-for="cls in classList"
              :key="cls.id"
              :value="cls.id"
            >
              {{ cls.name }}
            </a-select-option>
          </a-select>
        </div>

        <a-button 
          type="primary" 
          @click="fetchComparisonData"
          :disabled="isCompareBtnDisabled" 
          style="margin-left: 20px"
        >
          开始对比
        </a-button>
      </div>

      <!-- 显示方式选择 -->
      <div class="display-option">
        <span class="label">显示方式</span>
        <a-radio-group v-model:value="displayMode">
          <a-radio value="table">表格</a-radio>
          <a-radio value="chart">图表</a-radio>
        </a-radio-group>
      </div>
    </div>

    <!-- 加载状态 -->
    <a-spin v-if="loading" tip="加载中..." class="loading-spin" />

    <!-- 对比结果区域 -->
    <div v-if="!loading && comparisonData" class="comparison-results">
      <!-- 总体情况卡片 -->
      <div class="summary-cards">
        <div class="summary-card">
          <h3>总分平均分</h3>
          <div class="summary-item">
            <span class="class-name">{{ getClassName(selectedClass1) }}</span>
            <span class="score">{{ formatScore(comparisonData.subject_average_score.current.sum_) }}</span>
          </div>
          <div class="summary-item">
            <span class="class-name">{{ getClassName(selectedClass2) }}</span>
            <span class="score">{{ formatScore(comparisonData.subject_average_score.compare.sum_) }}</span>
          </div>
          <div class="difference" :class="getDifferenceClass(totalScoreDiff)">
            差值: {{ formatScore(totalScoreDiff) }}
          </div>
        </div>

        <div class="summary-card">
          <h3>一本线通过率</h3>
          <div class="summary-item">
            <span class="class-name">{{ getClassName(selectedClass1) }}</span>
            <span class="rate">{{ formatRate(comparisonData.pass_rate.current) }}</span>
          </div>
          <div class="summary-item">
            <span class="class-name">{{ getClassName(selectedClass2) }}</span>
            <span class="rate">{{ formatRate(comparisonData.pass_rate.compare) }}</span>
          </div>
          <div class="difference" :class="getDifferenceClass(passRateDiff)">
            差值: {{ formatRateDiff(passRateDiff) }}
          </div>
        </div>

        <div class="summary-card">
          <h3>一本线通过人数</h3>
          <div class="summary-item">
            <span class="class-name">{{ getClassName(selectedClass1) }}</span>
            <span class="count">{{ comparisonData.pass_count.current }}</span>
          </div>
          <div class="summary-item">
            <span class="class-name">{{ getClassName(selectedClass2) }}</span>
            <span class="count">{{ comparisonData.pass_count.compare }}</span>
          </div>
          <div class="difference" :class="getDifferenceClass(passCountDiff)">
            差值: {{ passCountDiff }}
          </div>
        </div>
      </div>

      <!-- 科目平均分对比 -->
      <div class="analysis-card">
        <h3>科目平均分对比</h3>
        <div v-if="displayMode === 'table'" class="table-container">
          <a-table
            :data-source="subjectAverageData"
            bordered
            :columns="subjectColumns"
            :pagination="false"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'diff'">
                <span :class="getDifferenceClass(record.diff)">{{ formatScore(record.diff) }}</span>
              </template>
            </template>
          </a-table>
        </div>

        <div v-if="displayMode === 'chart'" class="chart-container">
          <v-chart :option="subjectChartOption" autoresize style="height: 400px" />
        </div>
      </div>

      <!-- 科目最高分对比 -->
      <div class="analysis-card">
        <h3>科目最高分对比</h3>
        <div v-if="displayMode === 'table'" class="table-container">
          <a-table
            :data-source="subjectTopData"
            bordered
            :columns="subjectTopColumns"
            :pagination="false"
          />
        </div>

        <div v-if="displayMode === 'chart'" class="chart-container">
          <v-chart :option="subjectTopChartOption" autoresize style="height: 400px" />
        </div>
      </div>

      <!-- 前三名学生对比 -->
      <div class="analysis-card">
        <h3>班级前三名学生对比</h3>
        <div class="top-students-container">
          <div class="class-top-students">
            <h4>{{ getClassName(selectedClass1) }} 前三名</h4>
            <a-table
              :data-source="comparisonData.top_3.current"
              bordered
              :columns="topStudentColumns"
              :pagination="false"
            />
          </div>
          <div class="class-top-students">
            <h4>{{ getClassName(selectedClass2) }} 前三名</h4>
            <a-table
              :data-source="comparisonData.top_3.compare"
              bordered
              :columns="topStudentColumns"
              :pagination="false"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-if="!loading && !comparisonData && hasSearched" class="no-data">
      <p>未找到对比数据，请选择其他班级或考试</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import VChart from 'vue-echarts';
import { getClassesApi } from '@/servers/api/classes';
import { getClassExam } from '@/servers/api/grade';
import { getClassCompare } from '@/servers/api/grade';
import { useUserStore } from '@/store';

// 类型定义 
interface ClassInfo {
  id: number;
  name: string;
  header: number;
  school_id: number;
  subject_selection: string; // 新增：科目选择
}

interface ExamInfo {
  id: number;
  name: string;
}

interface StudentInfo {
  id: number;
  student_id: number;
  student_name: string;
  sum_: number; // 总分
  sumB: number; // 班级排名
  [key: string]: any;
}

interface SubjectScores {
  sum_: number;
  Yuwen: number;
  Shuxue: number;
  Yingyu: number;
  Wuli: number;
  Huaxue: number;
  Lishi: number;
  Zhengzhi: number;
  Shengwu: number;
  Dili: number;
}

interface ComparisonResult {
  top_3: {
    current: StudentInfo[];
    compare: StudentInfo[];
  };
  pass_rate: {
    current: number;
    compare: number;
  };
  pass_count: {
    current: number;
    compare: number;
  };
  subject_top_score: {
    current: SubjectScores;
    compare: SubjectScores;
  };
  subject_average_score: {
    current: SubjectScores;
    compare: SubjectScores;
  };
}

// 状态管理
const userStore = useUserStore();
const loading = ref(false);
const hasSearched = ref(false);
const allClassList = ref<ClassInfo[]>([]); 
const classList = ref<ClassInfo[]>([]);    
const examList = ref<ExamInfo[]>([]);
const selectedClass1 = ref<number>();      
const selectedClass2 = ref<number>();      
const selectedExamId = ref<number>(0);
const displayMode = ref<'table' | 'chart'>('table');
const comparisonData = ref<ComparisonResult | null>(null);
const currentClass = ref<ClassInfo>({ id: 0, name: '', header: 0, school_id: 0 }); 
// 科目名称映射
const subjectMap = {
  'Yuwen': '语文',
  'Shuxue': '数学',
  'Yingyu': '英语',
  'Wuli': '物理',
  'Huaxue': '化学',
  'Shengwu': '生物',
  'Lishi': '历史',
  'Zhengzhi': '政治',
  'Dili': '地理'
};

// 计算差值
const totalScoreDiff = computed(() => {
  if (!comparisonData.value) return 0;
  return comparisonData.value.subject_average_score.current.sum_ - 
         comparisonData.value.subject_average_score.compare.sum_;
});

const passRateDiff = computed(() => {
  if (!comparisonData.value) return 0;
  return (comparisonData.value.pass_rate.current - comparisonData.value.pass_rate.compare) * 100;
});

const passCountDiff = computed(() => {
  if (!comparisonData.value) return 0;
  return comparisonData.value.pass_count.current - comparisonData.value.pass_count.compare;
});

// 格式化科目平均分数据
const subjectAverageData = computed(() => {
  if (!comparisonData.value) return [];
  
  return Object.entries(subjectMap).map(([en, cn]) => ({
    subject: cn,
    class1Score: comparisonData.value.subject_average_score.current[en] || 0,
    class2Score: comparisonData.value.subject_average_score.compare[en] || 0,
    diff: (comparisonData.value.subject_average_score.current[en] || 0) - 
          (comparisonData.value.subject_average_score.compare[en] || 0)
  })).filter(item => item.class1Score > 0 || item.class2Score > 0); // 过滤无效科目
});

// 格式化科目最高分数据
const subjectTopData = computed(() => {
  if (!comparisonData.value) return [];
  
  return Object.entries(subjectMap).map(([en, cn]) => ({
    subject: cn,
    class1Top: comparisonData.value.subject_top_score.current[en] || 0,
    class2Top: comparisonData.value.subject_top_score.compare[en] || 0
  })).filter(item => item.class1Top > 0 || item.class2Top > 0); // 过滤无效科目
});

// 科目平均分表格列定义
const subjectColumns = computed(() => [
  { title: '科目', dataIndex: 'subject', key: 'subject' },
  { 
    title: `${getClassName(selectedClass1.value)}平均分`, 
    dataIndex: 'class1Score', 
    key: 'class1Score',
    customRender: ({ value }) => formatScore(Number(value))
  },
  { 
    title: `${getClassName(selectedClass2.value)}平均分`, 
    dataIndex: 'class2Score', 
    key: 'class2Score',
    customRender: ({ value }) => formatScore(Number(value))
  },
  { title: '差值(班1-班2)', dataIndex: 'diff', key: 'diff' }
]);
const subjectTopColumns = computed(() => [
  { title: '科目', dataIndex: 'subject', key: 'subject' },
  { title: `${getClassName(selectedClass1.value)}最高分`, dataIndex: 'class1Top', key: 'class1Top', render: (val: number) => formatScore(val) },
  { title: `${getClassName(selectedClass2.value)}最高分`, dataIndex: 'class2Top', key: 'class2Top', render: (val: number) => formatScore(val) }
]);

const topStudentColumns = [
  { title: '班级排名', dataIndex: 'sumB', key: 'sumB' },
  { title: '姓名', dataIndex: 'student_name', key: 'student_name' },
  { title: '总分', dataIndex: 'sum_', key: 'sum_', render: (val: number) => formatScore(val) }
];

// 图表配置
const subjectChartOption = computed(() => {
  if (!comparisonData.value) return {};
  
  const validSubjects = subjectAverageData.value;
  const subjects = validSubjects.map(item => item.subject);
  const class1Scores = validSubjects.map(item => item.class1Score);
  const class2Scores = validSubjects.map(item => item.class2Score);
  
  return {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        return `${params[0].name}: ${formatScore(params[0].value)}<br/>${params[1].name}: ${formatScore(params[1].value)}`;
      }
    },
    legend: { data: [getClassName(selectedClass1.value), getClassName(selectedClass2.value)] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: subjects },
    yAxis: { type: 'value', name: '分数' },
    series: [
      {
        name: getClassName(selectedClass1.value),
        type: 'bar',
        data: class1Scores,
        itemStyle: { color: '#5470C6' }
      },
      {
        name: getClassName(selectedClass2.value),
        type: 'bar',
        data: class2Scores,
        itemStyle: { color: '#91CC75' }
      }
    ]
  };
});

const subjectTopChartOption = computed(() => {
  if (!comparisonData.value) return {};
  
  const validSubjects = subjectTopData.value;
  const subjects = validSubjects.map(item => item.subject);
  const class1Tops = validSubjects.map(item => item.class1Top);
  const class2Tops = validSubjects.map(item => item.class2Top);
  
  return {
   tooltip: { 
     trigger: 'axis', 
     axisPointer: { type: 'shadow' },
     formatter: (params: any) => {
       return `${params[0].name}: ${formatScore(params[0].value)}<br/>${params[1].name}: ${formatScore(params[1].value)}`;
     }
   },
    legend: { data: [getClassName(selectedClass1.value), getClassName(selectedClass2.value)] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: subjects },
    yAxis: { type: 'value', name: '分数' },
    series: [
      {
        name: getClassName(selectedClass1.value),
        type: 'bar',
        data: class1Tops,
        itemStyle: { color: '#5470C6' }
      },
      {
        name: getClassName(selectedClass2.value),
        type: 'bar',
        data: class2Tops,
        itemStyle: { color: '#91CC75' }
      }
    ]
  };
});

// 工具函数 
const getClassName = (classId: number | undefined) => {
  if (!classId) return ''; // 增加空值判断，避免报错
  const cls = allClassList.value.find(c => c.id === classId);
  return cls ? cls.name : '未知班级';
};
const getDifferenceClass = (diff: number) => {
  if (diff > 0) return 'negative';
  if (diff < 0) return 'positive';
  return 'zero';
};

// 格式化分数（保留2位小数）
const formatScore = (score: number) => {
	console.log(score)
  return score.toFixed(2);
};

// 格式化通过率（保留两位小数百分比）
const formatRate = (rate: number) => {
  return (rate * 100).toFixed(2) + '%';
};

// 格式化通过率差值
const formatRateDiff = (diff: number) => {
  return diff.toFixed(2) + '%';
};


const handleExamChange = (examId: number) => {
  selectedExamId.value = examId;
};

const fetchComparisonData = async () => {
  // 后续添加其他班级数据计得修改！！！！！
  if (selectedClass1.value === selectedClass2.value) {
    message.warning('请选择不同的班级进行对比');
    return;
  }
  
  try {
    loading.value = true;
    hasSearched.value = true;
    
    const res = await getClassCompare({
      class_id: selectedClass1.value,
      compare_class_id: selectedClass2.value,
      exam_id: selectedExamId.value
    });
    
    if (res) {
      comparisonData.value = res;
    } else {
      message.error(res?.msg || '获取对比数据失败');
      comparisonData.value = null;
    }
  } catch (err) {
    message.error('获取对比数据失败');
    console.error(err);
    comparisonData.value = null;
  } finally {
    loading.value = false;
  }
};
// 计算“开始对比”按钮的禁用状态
const isCompareBtnDisabled = computed(() => {
  return (
    loading.value || // 加载中禁用
    !selectedClass1.value || // 未选择“我的班级”（理论上不会出现，因自动绑定）
    !selectedClass2.value || // 未选择“挑战班级”（筛选后无符合条件班级时触发）
    !selectedExamId.value || // 未选择考试
    selectedClass1.value === selectedClass2.value // 选择了相同班级（双重保险）
  );
});
// 初始化数据 - 核心筛选逻辑修改
const init = async () => {
  try {
    const userInfo = userStore.getUserInfo();
    const teacherId = userInfo?.teacher?.uid;
    
    if (!teacherId) {
      message.error('未获取到教师信息');
      return;
    }
    
    loading.value = true;
    const classRes = await getClassesApi({ 
    });
    
    if (classRes.code === 200 && classRes.data.length > 0) {
      allClassList.value = classRes.data; 
      const myClass = allClassList.value.find(cls => cls.header === teacherId);
      if (!myClass) {
        message.warning('未找到您作为班主任的班级');
        loading.value = false;
        return;
      }
      currentClass.value = myClass;
      selectedClass1.value = myClass.id;
      const myClassIdPrefix = myClass.id.toString().slice(0, 2); 
      const myClassSubject = myClass.subject_selection || ''; 
      classList.value = allClassList.value.filter(cls => {
        const isNotMyClass = cls.id !== myClass.id;
        const isSameIdPrefix = cls.id.toString().slice(0, 2) === myClassIdPrefix;
        const isSameSubject = (cls.subject_selection || '') === myClassSubject;
        return isNotMyClass && isSameIdPrefix && isSameSubject;
      });
      if (classList.value.length > 0) {
        selectedClass2.value = classList.value[0].id;
      } else {
        selectedClass2.value = undefined;
        message.warning(`暂无符合条件的挑战班级（需满足：ID前两位为"${myClassIdPrefix}"且科目选择为"${myClassSubject}"）`);
      }
    } else {
      message.error(classRes.msg || '获取班级列表失败');
    }
    if (currentClass.value.id) {
      const examRes = await getClassExam({ class_id: currentClass.value.id });
      if (examRes.code === 200 && examRes.data.length > 0) {
        examList.value = examRes.data.map((exam: { id: number; name: string }) => ({
          id: exam,
          name:`考试${exam}`
        }));
        if (examList.value.length > 0) {
          selectedExamId.value = examList.value[0].id;
        }
      } else {
        message.warning(examRes.msg || '获取考试列表失败');
      }
    }
  } catch (err) {
    message.error('初始化失败');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

onMounted(init);
</script>

<style scoped lang="less">
.class-compare-container {
  padding: 20px;
  position: relative;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  font-family: sans-serif;

  .back-button {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 5px 10px;
    background-color: #ccc;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    z-index: 10;
    &:hover {
      background-color: #bbb;
    }
  }

  .header {
    text-align: center;
    margin-bottom: 30px;
    padding-top: 10px;
  }

  .filter-section {
    background: #f5f5f5;
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 20px;

    .exam-item {
      display: block;
      margin-bottom: 15px;
    }

    .class-selector-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
    }

    .class-item {
      display: flex;
      align-items: center;
      margin-right: 20px;

      .label {
        display: inline-block;
        width: 80px;
        text-align: right;
        margin-right: 10px;
        color: #555;
      }
    }

    .versus {
      margin: 0 15px;
      font-weight: bold;
      color: #666;
    }

    .display-option {
      margin-top: 15px;
      display: flex;
      align-items: center;

      .label {
        margin-right: 15px;
        color: #555;
      }
    }
  }

  .loading-spin {
    display: block;
    margin: 50px auto;
  }

  .summary-cards {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    flex-wrap: wrap;

    .summary-card {
      flex: 1;
      min-width: 250px;
      background: #fff;
      border-radius: 6px;
      padding: 15px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #333;
        font-size: 16px;
        border-bottom: 1px solid #eee;
        padding-bottom: 8px;
      }

      .summary-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;

        .class-name {
          color: #666;
        }

        .score, .rate, .count {
          font-weight: bold;
        }
      }

      .difference {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #eee;
        text-align: right;
        font-weight: bold;
      }
    }
  }

  .analysis-card {
    background: #fff;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    h3 {
      margin-top: 0;
      margin-bottom: 15px;
      color: #333;
      font-size: 16px;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
    }

    .table-container {
      overflow-x: auto;
    }

    .chart-container {
      width: 100%;
      height: 400px;
    }
  }

  .top-students-container {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;

    .class-top-students {
      flex: 1;
      min-width: 300px;

      h4 {
        margin-bottom: 10px;
        color: #555;
      }
    }
  }

  .no-data {
    text-align: center;
    padding: 50px 0;
    color: #999;
  }

  .positive {
    color: #f5222d; // 红色表示班1优于班2
  }

  .negative {
    color: #52c41a; // 绿色表示班2优于班1
  }

  .zero {
    color: #666;
  }
}
</style>
<template>
  <div class="class-compare-container">
    <!-- 头部区域 -->
    <div class="header">
      <h2>班级对比</h2>
      <p>选择考试和班级进行对比分析</p>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <a-row :gutter="[16, 16]">
        <a-col :span="24" :md="8">
          <div class="filter-item">
            <span class="filter-label">考试：</span>
            <a-select
              v-model:value="selectedExamId"
              placeholder="选择考试"
              style="width: 100%"
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
        </a-col>
        <a-col :span="24" :md="16">
          <div class="filter-actions">
            <a-button type="primary" @click="resetFilters">重置筛选</a-button>
          </div>
        </a-col>
      </a-row>
      
      <a-row :gutter="[16, 16]" style="margin-top: 20px;">
        <!-- 班级选择区域 -->
        <a-col :span="24">
          <div class="class-selector-container">
            <!-- 我的班级 -->
            <div class="class-selector-item">
              <span class="label">我的班级：</span>
              <a-select
                v-model:value="selectedClass1"
                placeholder="选择班级"
                style="flex: 1;"
                :disabled="loading"
              >
                <a-select-option
                  v-for="cls in allClassList"
                  :key="cls.id"
                  :value="cls.id"
                >
                  {{ cls.name }}
                </a-select-option>
              </a-select>
            </div>

            <!-- VS 标识 -->
            <div class="versus">VS</div>

            <!-- 挑战班级 -->
            <div class="class-selector-item">
              <span class="label">挑战班级：</span>
              <a-select
                v-model:value="selectedClass2"
                placeholder="选择班级"
                style="flex: 1;"
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
            
            <!-- 开始对比按钮 -->
            <div class="compare-button-container">
              <a-button 
                type="primary" 
                @click="fetchComparisonData"
                :disabled="isCompareBtnDisabled" 
                class="compare-button"
              >
                开始对比
              </a-button>
            </div>
          </div>
        </a-col>
      </a-row>
      
      <!-- 显示方式选择 -->
      <div class="display-option">
        <span class="label">显示方式：</span>
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
        <a-row :gutter="16">
          <a-col :span="24" :md="8">
            <div class="summary-card total-score-card">
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
                差值: {{ formatScore(Math.abs(totalScoreDiff)) }}
              </div>
            </div>
          </a-col>
          <a-col :span="24" :md="8">
            <div class="summary-card pass-rate-card">
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
                差值: {{ formatRateDiff(Math.abs(passRateDiff)) }}
              </div>
            </div>
          </a-col>
          <a-col :span="24" :md="8">
            <div class="summary-card pass-count-card">
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
                差值: {{ Math.abs(passCountDiff) }}
              </div>
            </div>
          </a-col>
        </a-row>
      </div>

      <!-- 科目平均分 + 最高分 表格 -->
      <div class="analysis-card">
        <a-card title="科目平均分 & 最高分对比" class="chart-card">
          <div v-if="displayMode === 'table'" class="table-container">
            <a-table
              :data-source="mergedSubjectTableData"
              bordered
              :columns="mergedSubjectTableColumns"
              :pagination="false"
              rowKey="subject"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'avgDiff' || column.dataIndex === 'topDiff'">
                  <span :class="getDifferenceClass(record[column.dataIndex])">
                    {{ formatScore(Math.abs(record[column.dataIndex])) }}
                  </span>
                </template>
                <template v-else-if="column.dataIndex.includes('Score') || column.dataIndex.includes('Top')">
                  {{ formatScore(Number(record[column.dataIndex])) }}
                </template>
                <template v-else>
                  {{ record[column.dataIndex] }}
                </template>
              </template>
            </a-table>
          </div>
        </a-card>
      </div>

      <!-- 科目平均分对比（图表） -->
      <div class="analysis-card" v-if="displayMode === 'chart'">
        <a-card title="科目平均分对比" class="chart-card">
          <div class="chart-container">
            <v-chart :option="subjectChartOption" autoresize style="height: 400px" />
          </div>
        </a-card>
      </div>

      <!-- 科目最高分对比（图表） -->
      <div class="analysis-card" v-if="displayMode === 'chart'">
        <a-card title="科目最高分对比" class="chart-card">
          <div class="chart-container">
            <v-chart :option="subjectTopChartOption" autoresize style="height: 400px" />
          </div>
        </a-card>
      </div>

      <!-- 前三名学生对比 -->
      <div class="analysis-card">
        <a-card title="班级前三名学生对比" class="student-card">
          <div class="top-students-container">
            <a-row :gutter="16">
              <a-col :span="24" :md="12">
                <div class="class-top-students">
                  <h4>{{ getClassName(selectedClass1) }} 前三名</h4>
                  <a-table
                    :data-source="comparisonData.top_3.current"
                    bordered
                    :columns="topStudentColumns"
                    :pagination="false"
                    rowKey="id"
                  />
                </div>
              </a-col>
              <a-col :span="24" :md="12">
                <div class="class-top-students">
                  <h4>{{ getClassName(selectedClass2) }} 前三名</h4>
                  <a-table
                    :data-source="comparisonData.top_3.compare"
                    bordered
                    :columns="topStudentColumns"
                    :pagination="false"
                    rowKey="id"
                  />
                </div>
              </a-col>
            </a-row>
          </div>
        </a-card>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-if="!loading && !comparisonData && hasSearched" class="no-data">
      <a-empty description="未找到对比数据，请选择其他班级或考试" />
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
import { Row, Col, Card, Button, Empty, Alert, Select, Spin, Radio, Table } from "ant-design-vue";

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
  sumb: number; // 班级排名
  [key: string]: any;
}

interface SubjectScores {
  sum_: number;
  yuwen: number;
  shuxue: number;
  yingyu: number;
  wuli: number;
  huaxue: number;
  lishi: number;
  zhengzhi: number;
  shengwu: number;
  dili: number;
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
const currentClass = ref<ClassInfo>({ id: 0, name: '', header: 0, school_id: 0, subject_selection: '' });
// 科目名称映射
const subjectMap = {
  'yuwen': '语文',
  'shuxue': '数学',
  'yingyu': '英语',
  'wuli': '物理',
  'huaxue': '化学',
  'shengwu': '生物',
  'lishi': '历史',
  'zhengzhi': '政治',
  'dili': '地理'
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

// 格式化科目平均分数据（用于图表）
const subjectAverageData = computed(() => {
  if (!comparisonData.value) return [];
  
  return Object.entries(subjectMap).map(([en, cn]) => ({
    subject: cn,
    class1Score: comparisonData.value!.subject_average_score.current[en as keyof SubjectScores] || 0,
    class2Score: comparisonData.value!.subject_average_score.compare[en as keyof SubjectScores] || 0,
    diff: (comparisonData.value!.subject_average_score.current[en as keyof SubjectScores] || 0) - 
          (comparisonData.value!.subject_average_score.compare[en as keyof SubjectScores] || 0)
  })).filter(item => item.class1Score > 0 || item.class2Score > 0); // 过滤无效科目
});

// 格式化科目最高分数据（用于图表）
const subjectTopData = computed(() => {
  if (!comparisonData.value) return [];
  
  return Object.entries(subjectMap).map(([en, cn]) => {
    const class1Top = comparisonData.value!.subject_top_score.current[en as keyof SubjectScores] || 0;
    const class2Top = comparisonData.value!.subject_top_score.compare[en as keyof SubjectScores] || 0;
    return {
      subject: cn,
      class1Top,
      class2Top,
      diff: class1Top - class2Top
    };
  }).filter(item => item.class1Top > 0 || item.class2Top > 0); // 过滤无效科目
});

// 合并表格数据源
const mergedSubjectTableData = computed(() => {
  if (!comparisonData.value) return [];
  
  return Object.entries(subjectMap).map(([en, cn]) => {
    // 平均分数据
    const class1AvgScore = comparisonData.value!.subject_average_score.current[en as keyof SubjectScores] || 0;
    const class2AvgScore = comparisonData.value!.subject_average_score.compare[en as keyof SubjectScores] || 0;
    const avgDiff = class1AvgScore - class2AvgScore;
    
    // 最高分数据
    const class1TopScore = comparisonData.value!.subject_top_score.current[en as keyof SubjectScores] || 0;
    const class2TopScore = comparisonData.value!.subject_top_score.compare[en as keyof SubjectScores] || 0;
    const topDiff = class1TopScore - class2TopScore;
    
    return {
      subject: cn,
      // 平均分相关
      class1AvgScore,
      class2AvgScore,
      avgDiff,
      // 最高分相关
      class1TopScore,
      class2TopScore,
      topDiff
    };
  }).filter(item => item.class1AvgScore > 0 || item.class2AvgScore > 0 || item.class1TopScore > 0 || item.class2TopScore > 0);
});

// 合并表格列定义
const mergedSubjectTableColumns = computed(() => [
  { title: '科目', dataIndex: 'subject', key: 'subject', align: 'center' },
  // 平均分分组
  { 
    title: `${getClassName(selectedClass1.value)} 平均分`, 
    dataIndex: 'class1AvgScore', 
    key: 'class1AvgScore', 
    align: 'center'
  },
  { 
    title: `${getClassName(selectedClass2.value)} 平均分`, 
    dataIndex: 'class2AvgScore', 
    key: 'class2AvgScore', 
    align: 'center'
  },
  { 
    title: '平均分差值(我的班级-挑战班级)', 
    dataIndex: 'avgDiff', 
    key: 'avgDiff', 
    align: 'center'
  },
  // 最高分分组
  { 
    title: `${getClassName(selectedClass1.value)} 最高分`, 
    dataIndex: 'class1TopScore', 
    key: 'class1TopScore', 
    align: 'center'
  },
  { 
    title: `${getClassName(selectedClass2.value)} 最高分`, 
    dataIndex: 'class2TopScore', 
    key: 'class2TopScore', 
    align: 'center'
  },
  { 
    title: '最高分差值(我的班级-挑战班级)', 
    dataIndex: 'topDiff', 
    key: 'topDiff', 
    align: 'center'
  }
]);

const topStudentColumns = [
  { title: '班级排名', dataIndex: 'sumb', key: 'sumb' },
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
        itemStyle: { color: '#5470C6' },
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => formatScore(params.value),
          fontSize: 12,
          color: '#333'
        }
      },
      {
        name: getClassName(selectedClass2.value),
        type: 'bar',
        data: class2Scores,
        itemStyle: { color: '#91CC75' },
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => formatScore(params.value),
          fontSize: 12,
          color: '#333'
        }
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
        itemStyle: { color: '#5470C6' },
         label: {
          show: true,
          position: 'top',
          formatter: (params: any) => formatScore(params.value),
          fontSize: 12,
          color: '#333'
        }
      },
      {
        name: getClassName(selectedClass2.value),
        type: 'bar',
        data: class2Tops,
        itemStyle: { color: '#91CC75' },
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => formatScore(params.value),
          fontSize: 12,
          color: '#333'
        }
      }
    ]
  };
});

// 工具函数 
const getClassName = (classId: number | undefined) => {
  if (!classId) return '';
  const cls = allClassList.value.find(c => c.id === classId);
  return cls ? cls.name : '未知班级';
};

const getDifferenceClass = (diff: number) => {
  if (diff > 0) return 'positive'; // 我方更高 → 绿色
  if (diff < 0) return 'negative'; // 我方更低 → 红色
  return 'zero';                   // 相等 → 灰色
};

// 格式化分数
const formatScore = (score: number) => {
  return score.toFixed(2);
};

// 格式化通过率
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
  if (selectedClass1.value === selectedClass2.value) {
    message.warning('请选择不同的班级进行对比');
    return;
  }
  
  if (!selectedClass1.value || !selectedClass2.value || !selectedExamId.value) {
    message.warning('请选择完整的对比条件');
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
  } catch (err: any) {
    const errorMsg = err?.data?.data || '获取对比数据失败，注意只能对比同一年级的班级';
    message.error(errorMsg);
    comparisonData.value = null;
  } finally {
    loading.value = false;
  }
};

// 重置筛选
const resetFilters = () => {
  if (examList.value.length > 0) {
    selectedExamId.value = examList.value[examList.value.length - 1].id;
  }
  if (classList.value.length > 0) {
    selectedClass2.value = classList.value[0].id;
  }
  comparisonData.value = null;
  hasSearched.value = false;
};

// 计算"开始对比"按钮的禁用状态
const isCompareBtnDisabled = computed(() => {
  return (
    loading.value || 
    !selectedClass1.value || 
    !selectedClass2.value || 
    !selectedExamId.value || 
    selectedClass1.value === selectedClass2.value
  );
});

// 初始化数据
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
        examList.value = examRes.data.map((exam: any) => ({
          id: exam.id,
          name: exam.name
        }));
        if (examList.value.length > 0) {
          selectedExamId.value = examList.value[examList.value.length - 1].id;
        }
      } else {
        message.warning(examRes.msg || '获取考试列表失败');
      }
    }
    fetchComparisonData();
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

  .filter-section {
    background: #ffffff;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    margin-bottom: 24px;
    
    .filter-item {
      display: flex;
      align-items: center;
      
      .filter-label {
        width: 80px;
        font-weight: 600;
        color: #333;
      }
    }
    
    .filter-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      height: 100%;
    }

    .class-selector-container {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      gap: 16px;
      justify-content: center;
      
      .class-selector-item {
        flex: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        min-width: 200px;
        
        .label {
          font-weight: 500;
          color: #535353;
          margin-right: 8px;
          font-size: 14px;
          white-space: nowrap;
        }
        
        :deep(.ant-select) {
          flex: 1;
        }
      }
      
      .versus {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 20px;
        color: #1890ff;
        min-width: 40px;
        padding: 0 10px;
      }
      
      .compare-button-container {
        .compare-button {
          height: 38px;
        }
      }
    }

    .display-option {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      
      .label {
        font-weight: 500;
        color: #535353;
        margin-right: 12px;
        font-size: 14px;
      }
      
      :deep(.ant-radio-wrapper) {
        margin-right: 20px;
      }
    }
  }

  .loading-spin {
    display: block;
    margin: 50px auto;
  }

  .summary-cards {
    margin-bottom: 24px;

    .summary-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      height: 100%;

      &:hover {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      h3 {
        margin-top: 0;
        margin-bottom: 20px;
        color: #1f1f1f;
        font-size: 18px;
        font-weight: 600;
        border-bottom: 1px solid #f0f0f0;
        padding-bottom: 12px;
        text-align: center;
      }

      .summary-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        padding: 8px 0;

        .class-name {
          color: #535353;
          font-weight: 500;
        }

        .score, .rate, .count {
          font-weight: 700;
          font-size: 16px;
        }
      }

      .difference {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #f0f0f0;
        text-align: right;
        font-weight: 700;
        font-size: 16px;
      }
    }
    
    .total-score-card {
      border-top: 4px solid #1890ff;
    }
    
    .pass-rate-card {
      border-top: 4px solid #52c41a;
    }
    
    .pass-count-card {
      border-top: 4px solid #fa8c16;
    }
  }

  .analysis-card {
    margin-bottom: 24px;
    
    .chart-card, .student-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      
      :deep(.ant-card-head) {
        background: linear-gradient(120deg, #f0f2f5, #e4e7ec);
        border-bottom: 1px solid #e8e8e8;
        padding: 0 16px;
        
        .ant-card-head-title {
          font-weight: 600;
          color: #333;
        }
      }
    }
  }

  .table-container {
    overflow-x: auto;
    padding: 10px 0;
    max-width: 100%;
    -webkit-overflow-scrolling: touch;
  }

  .chart-container {
    width: 100%;
    height: 400px;
  }

  .top-students-container {
    .class-top-students {
      h4 {
        margin-bottom: 16px;
        color: #1f1f1f;
        font-size: 18px;
        font-weight: 500;
        text-align: center;
      }
    }
  }

  .no-data {
    background: white;
    border-radius: 12px;
    padding: 60px 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    text-align: center;
    margin-bottom: 20px;
  }

  // 差值颜色样式
  .positive {
    color: #52c41a; // 我方更高 → 绿色
  }

  .negative {
    color: #f5222d; // 我方更低 → 红色
  }

  .zero {
    color: #535353; // 相等 → 灰色
  }
  
  // 响应式设计
  @media (max-width: 768px) {
    padding: 12px;
    
    .filter-section {
      padding: 16px;
    }
    
    .class-selector-container {
      flex-direction: column;
      align-items: stretch;
      
      .versus {
        align-self: center;
        padding: 12px 0;
      }
      
      .compare-button-container {
        align-self: stretch;
        margin-top: 12px;
        
        .compare-button {
          width: 100%;
        }
      }
    }
    
    .summary-cards {
      .summary-card {
        padding: 16px;
        
        h3 {
          font-size: 16px;
        }
        
        .summary-item {
          .score, .rate, .count {
            font-size: 14px;
          }
        }
        
        .difference {
          font-size: 14px;
        }
      }
    }
    
    .top-students-container {
      .class-top-students {
        h4 {
          font-size: 16px;
        }
      }
    }
    
    .table-container {
      overflow-x: scroll;
    }
  }
}
</style>
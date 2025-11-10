<template>
  <div class="student-compare-container">
    <!-- 头部区域 -->
    <div class="header">
      <h2>学生对比</h2>
      <p>选择考试和学生进行对比分析</p>
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
        <a-col :span="24">
          <div class="class-selector-container">
            <div class="class-selector-item">
              <span class="label">所属班级：</span>
              <a-select
                v-model:value="selectedClassId"
                placeholder="选择班级"
                style="flex: 1;"
                :disabled="loading"
                @change="fetchStudentListAndExams"
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
          </div>
        </a-col>
      </a-row>
      
      <a-row :gutter="[16, 16]" style="margin-top: 20px;">
        <a-col :span="24">
          <div class="student-selector-container">
            <!-- 学生1 -->
            <div class="student-selector-item">
              <span class="label">学生1：</span>
              <a-select
                v-model:value="selectedStudent1"
                placeholder="请输入学生姓名或学号搜索"
                style="flex: 1;"
                :disabled="loading || !selectedClassId"
                show-search
                :filter-option="false"
                @search="handleStudent1Search"
                @change="handleStudent1Change"
              >
                <a-select-option
                  v-for="student in filteredStudentList1"
                  :key="student.id"
                  :value="student.id"
                >
                  {{ student.name }} ({{ student.uid }})
                </a-select-option>
              </a-select>
            </div>

            <!-- VS 标识 -->
            <div class="versus">VS</div>

            <!-- 学生2 -->
            <div class="student-selector-item">
              <span class="label">学生2：</span>
              <a-select
                v-model:value="selectedStudent2"
                placeholder="请输入学生姓名或学号搜索"
                style="flex: 1;"
                :disabled="loading || !selectedClassId"
                show-search
                :filter-option="false"
                @search="handleStudent2Search"
                @change="handleStudent2Change"
              >
                <a-select-option
                  v-for="student in filteredStudentList2"
                  :key="student.id"
                  :value="student.id"
                >
                  {{ student.name }} ({{ student.uid }})
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
    <div v-if="!loading && hasSearched" class="comparison-results">
      <!-- 总体情况卡片 -->
      <div class="summary-cards">
        <a-row :gutter="16">
          <a-col :span="24" :md="8">
            <div class="summary-card total-score-card">
              <h3>总分</h3>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent1) }}</span>
                <span class="score">{{ formatScore(comparisonData.total_score?.current || 0) }}</span>
              </div>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent2) }}</span>
                <span class="score">{{ formatScore(comparisonData.total_score?.compare || 0) }}</span>
              </div>
              <div class="difference" :class="getDifferenceClass(totalScoreDiff)">
                差值: {{ formatScore(totalScoreDiff) }}
              </div>
            </div>
          </a-col>
          <a-col :span="24" :md="8">
            <div class="summary-card class-rank-card">
              <h3>班级排名</h3>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent1) }}</span>
                <span class="rank">
                  {{ comparisonData.class_rank?.current || 0 }} 
                  <template v-if="comparisonData.class_total">
                    / {{ comparisonData.class_total > 0 ? `全班${comparisonData.class_total}人` : '全班人数未知' }}
                  </template>
                </span>
              </div>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent2) }}</span>
                <span class="rank">
                  {{ comparisonData.class_rank?.compare || 0 }} 
                  <template v-if="comparisonData.class_total">
                    / {{ comparisonData.class_total > 0 ? `全班${comparisonData.class_total}人` : '全班人数未知' }}
                  </template>
                </span>
              </div>
              <div class="difference" :class="getRankDifferenceClass(rankDiff)">
                差值: {{ rankDiff }}
              </div>
            </div>
          </a-col>
          <a-col :span="24" :md="8">
            <div class="summary-card grade-rank-card">
              <h3>年级排名</h3>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent1) }}</span>
                <span class="rank">
                  {{ comparisonData.grade_rank?.current || 0 }} 
                  <template v-if="comparisonData.grade_total">
                    / {{ comparisonData.grade_total > 0 ? `全校${comparisonData.grade_total}人` : '全校人数未知' }}
                  </template>
                </span>
              </div>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent2) }}</span>
                <span class="rank">
                  {{ comparisonData.grade_rank?.compare || 0 }} 
                  <template v-if="comparisonData.grade_total">
                    / {{ comparisonData.grade_total > 0 ? `全校${comparisonData.grade_total}人` : '全校人数未知' }}
                  </template>
                </span>
              </div>
              <div class="difference" :class="getRankDifferenceClass(gradeRankDiff)">
                差值: {{ gradeRankDiff }}
              </div>
            </div>
          </a-col>
        </a-row>
      </div>

      <!-- 科目分数对比 -->
      <div class="analysis-card">
        <a-card title="科目分数对比" class="chart-card">
          <div v-if="displayMode === 'table'" class="table-container">
            <a-table
              :data-source="subjectScoreData"
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
        </a-card>
      </div>

      <!-- 科目排名对比 -->
      <div class="analysis-card">
        <a-card title="科目排名对比" class="chart-card">
          <div v-if="displayMode === 'table'" class="table-container">
            <a-table
              :data-source="subjectRankData"
              bordered
              :columns="subjectRankColumns"
              :pagination="false"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'classRankDiff' || column.dataIndex === 'gradeRankDiff'">
                  <span :class="getRankDifferenceClass(Number(record[column.dataIndex]))">
                    {{ record[column.dataIndex] }}
                  </span>
                </template>
              </template>
            </a-table>
          </div>

          <div v-if="displayMode === 'chart'" class="chart-container">
            <v-chart :option="subjectRankChartOption" autoresize style="height: 400px" />
          </div>
        </a-card>
      </div>

      <!-- 成绩详情对比 -->
      <div class="analysis-card">
        <a-card title="成绩详情对比" class="student-card">
          <div class="detail-container">
            <a-row :gutter="16">
              <a-col :span="24" :md="12">
                <div class="student-detail">
                  <h4>{{ getStudentName(selectedStudent1) }} 成绩详情</h4>
                  <a-table
                    :data-source="getStudentDetailData(selectedStudent1)"
                    bordered
                    :columns="detailColumns"
                    :pagination="false"
                  />
                </div>
              </a-col>
              <a-col :span="24" :md="12">
                <div class="student-detail">
                  <h4>{{ getStudentName(selectedStudent2) }} 成绩详情</h4>
                  <a-table
                    :data-source="getStudentDetailData(selectedStudent2)"
                    bordered
                    :columns="detailColumns"
                    :pagination="false"
                  />
                </div>
              </a-col>
            </a-row>
          </div>
        </a-card>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-if="!loading && hasSearched && !comparisonData.valid" class="no-data">
      <a-empty description="未找到对比数据，请选择其他学生或考试" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import VChart from 'vue-echarts';
import { getClassesApi } from '@/servers/api/classes';
import { getClassExam } from '@/servers/api/grade';
import { getCompareWithStudent } from '@/servers/api/analysis';
import { getStudentApi } from '@/servers/api/student';
import { useUserStore } from '@/store';

// 类型定义 
interface ClassInfo {
  id: number;
  name: string;
  header: number;
  school_id: number;
  subject_selection: string;
}

interface ExamInfo {
  id: number;
  name: string;
}

interface StudentInfo {
  id: string;       // 学号（uid），类型为 string
  name: string;
  class_id: number;
  uid: string;      // 与 id 一致，避免命名混淆
}

interface SubjectScores {
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

interface SubjectRanks {
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

interface StudentResult {
  id: number;
  student_id: string;
  school_id: string;
  exam_id: number;
  class_id: string;
  sum_: number;
  sumB: number; // 班级总分排名
  sumD: number; // 年级总分排名
  Yuwen?: number;
  YuwenB?: number; // 语文班级排名
  YuwenD?: number; // 语文年级排名
  Shuxue?: number;
  ShuxueB?: number;
  ShuxueD?: number;
  Yingyu?: number;
  YingyuB?: number;
  YingyuD?: number;
  Wuli?: number;
  WuliB?: number;
  WuliD?: number;
  Huaxue?: number;
  HuaxueB?: number;
  HuaxueD?: number;
  Lishi?: number;
  LishiB?: number;
  LishiD?: number;
  Zhengzhi?: number;
  ZhengzhiB?: number;
  ZhengzhiD?: number;
  Shengwu?: number;
  ShengwuB?: number;
  ShengwuD?: number;
  Dili?: number;
  DiliB?: number;
  DiliD?: number;
}

interface ComparisonResult {
  valid: boolean;
  current_student?: StudentResult;
  compare_student?: StudentResult;
  total_score?: {
    current: number;
    compare: number;
  };
  class_rank?: {
    current: number;
    compare: number;
  };
  grade_rank?: {
    current: number;
    compare: number;
  };
  class_total?: number; // 班级总人数
  grade_total?: number; // 年级总人数
  subject_score?: {
    current: SubjectScores;
    compare: SubjectScores;
  };
  subject_class_rank?: {
    current: SubjectRanks;
    compare: SubjectRanks;
  };
  detail?: {
    current: Array<{ key: string; value: string }>;
    compare: Array<{ key: string; value: string }>;
  };
}

// 状态管理
const userStore = useUserStore();
const loading = ref(false);
const hasSearched = ref(false);
const classList = ref<ClassInfo[]>([]);
const examList = ref<ExamInfo[]>([]);
const studentList = ref<StudentInfo[]>([]); // 原始学生列表（含string类型的id）
const filteredStudentList1 = ref<StudentInfo[]>([]); // 学生1筛选后的列表
const filteredStudentList2 = ref<StudentInfo[]>([]); // 学生2筛选后的列表
const selectedClassId = ref<number>();
const selectedStudent1 = ref<string>(); // 存储学生1的string类型id（学号）
const selectedStudent2 = ref<string>(); // 存储学生2的string类型id（学号）
const selectedExamId = ref<number>(0);
const displayMode = ref<'table' | 'chart'>('table');
const comparisonData = ref<ComparisonResult>({ valid: false });
const searchKeyword1 = ref(''); // 学生1搜索关键词
const searchKeyword2 = ref(''); // 学生2搜索关键词

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
  const total = comparisonData.value.total_score;
  return (total?.current || 0) - (total?.compare || 0);
});

const rankDiff = computed(() => {
  const rank = comparisonData.value.class_rank;
  return (rank?.current || 0) - (rank?.compare || 0);
});

const gradeRankDiff = computed(() => {
  const rank = comparisonData.value.grade_rank;
  return (rank?.current || 0) - (rank?.compare || 0);
});

// 格式化科目分数数据
const subjectScoreData = computed(() => {
  const subjectScore = comparisonData.value.subject_score;
  if (!subjectScore) return [];
  
  return Object.entries(subjectMap).map(([en, cn]) => ({
    subject: cn,
    student1Score: subjectScore.current[en as keyof SubjectScores] || 0,
    student2Score: subjectScore.compare[en as keyof SubjectScores] || 0,
    diff: (subjectScore.current[en as keyof SubjectScores] || 0) - 
          (subjectScore.compare[en as keyof SubjectScores] || 0)
  })).filter(item => item.student1Score > 0 || item.student2Score > 0);
});

// 格式化科目排名数据
const subjectRankData = computed(() => {
  const currentStudent = comparisonData.value.current_student || {};
  const compareStudent = comparisonData.value.compare_student || {};
  
  return Object.entries(subjectMap).map(([en, cn]) => {
    // 定义分数、班级排名、年级排名的字段名
    const scoreKey = en as keyof typeof currentStudent;
    const classRankKey = `${en}B` as keyof typeof currentStudent;
    const gradeRankKey = `${en}D` as keyof typeof currentStudent;
    
    // 获取当前科目分数（判断是否有效）
    const student1Score = currentStudent[scoreKey] || 0;
    const student2Score = compareStudent[scoreKey] || 0;
    
    // 仅当任一学生分数不为0时，才计算排名（避免无效数据）
    const student1ClassRank = (student1Score !== 0 && currentStudent[classRankKey]) || '-';
    const student1GradeRank = (student1Score !== 0 && currentStudent[gradeRankKey]) || '-';
    const student2ClassRank = (student2Score !== 0 && compareStudent[classRankKey]) || '-';
    const student2GradeRank = (student2Score !== 0 && compareStudent[gradeRankKey]) || '-';

    // 计算排名差值（添加类型断言，确保是有效数字后再转换）
    const classRankDiff = student1ClassRank !== '-' && student2ClassRank !== '-'
      ? (Number(student1ClassRank) as number) - (Number(student2ClassRank) as number)
      : '-';
    const gradeRankDiff = student1GradeRank !== '-' && student2GradeRank !== '-'
      ? (Number(student1GradeRank) as number) - (Number(student2GradeRank) as number)
      : '-';

    return {
      subject: cn,
      student1Score, // 存储分数用于过滤
      student2Score, // 存储分数用于过滤
      student1ClassRank,
      student1GradeRank,
      student2ClassRank,
      student2GradeRank,
      classRankDiff,
      gradeRankDiff,
    };
  }).filter(item => 
    // 过滤条件：任一学生分数不为0，且至少有一个排名有效
    (item.student1Score !== 0 || item.student2Score !== 0) &&
    (item.student1ClassRank !== '-' || item.student2ClassRank !== '-' || 
     item.student1GradeRank !== '-' || item.student2GradeRank !== '-')
  );
});

// 表格列定义
const subjectColumns = computed(() => [
  { title: '科目', dataIndex: 'subject', key: 'subject' },
  { 
    title: `${getStudentName(selectedStudent1.value)}分数`, 
    dataIndex: 'student1Score', 
    key: 'student1Score',
    customRender: ({ value }: { value: any }) => formatScore(Number(value))
  },
  { 
    title: `${getStudentName(selectedStudent2.value)}分数`, 
    dataIndex: 'student2Score', 
    key: 'student2Score',
    customRender: ({ value }: { value: any }) => formatScore(Number(value))
  },
  { title: '差值', dataIndex: 'diff', key: 'diff' }
]);

const subjectRankColumns = computed(() => [
  { title: '科目', dataIndex: 'subject', key: 'subject' },
  // 学生1的班级和年级排名
  { title: `${getStudentName(selectedStudent1.value)}班级排名`, dataIndex: 'student1ClassRank', key: 'student1ClassRank' },
  { title: `${getStudentName(selectedStudent1.value)}年级排名`, dataIndex: 'student1GradeRank', key: 'student1GradeRank' },
  // 学生2的班级和年级排名
  { title: `${getStudentName(selectedStudent2.value)}班级排名`, dataIndex: 'student2ClassRank', key: 'student2ClassRank' },
  { title: `${getStudentName(selectedStudent2.value)}年级排名`, dataIndex: 'student2GradeRank', key: 'student2GradeRank' },
  // 排名差值
  { title: '班级排名差值', dataIndex: 'classRankDiff', key: 'classRankDiff' },
  { title: '年级排名差值', dataIndex: 'gradeRankDiff', key: 'gradeRankDiff' },
]);

const detailColumns = [
  { title: '项目', dataIndex: 'key', key: 'key' },
  { title: '数值', dataIndex: 'value', key: 'value' }
];

// 图表配置
const subjectChartOption = computed(() => {
  const validSubjects = subjectScoreData.value;
  const subjects = validSubjects.map(item => item.subject);
  const student1Scores = validSubjects.map(item => item.student1Score);
  const student2Scores = validSubjects.map(item => item.student2Score);
  
  return {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        return `${params[0].name}: ${formatScore(params[0].value)}<br/>${params[1].name}: ${formatScore(params[1].value)}`;
      }
    },
    legend: { data: [getStudentName(selectedStudent1.value), getStudentName(selectedStudent2.value)] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: subjects },
    yAxis: { type: 'value', name: '分数' },
    series: [
      {
        name: getStudentName(selectedStudent1.value),
        type: 'bar',
        data: student1Scores,
        itemStyle: { color: '#5470C6' }
      },
      {
        name: getStudentName(selectedStudent2.value),
        type: 'bar',
        data: student2Scores,
        itemStyle: { color: '#91CC75' }
      }
    ]
  };
});

// 图表配置
const subjectRankChartOption = computed(() => {
  // 筛选出：分数不为0 + 班级排名都有效的科目
  const validSubjects = subjectRankData.value.filter(item => 
    (item.student1Score !== 0 || item.student2Score !== 0) &&
    item.student1ClassRank !== '-' && item.student2ClassRank !== '-'
  );
  
  const subjects = validSubjects.map(item => item.subject);
  const student1Ranks = validSubjects.map(item => Number(item.student1ClassRank) as number);
  const student2Ranks = validSubjects.map(item => Number(item.student2ClassRank) as number);
  return {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        return `${params[0].name}: ${params[0].value}名<br/>${params[1].name}: ${params[1].value}名`;
      }
    },
    legend: { data: [getStudentName(selectedStudent1.value), getStudentName(selectedStudent2.value)] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: subjects },
    yAxis: { 
      type: 'value', 
      name: '班级排名',
      axisLabel: { formatter: '{value} 名' }
    },
    series: [
      { name: getStudentName(selectedStudent1.value), type: 'bar', data: student1Ranks, itemStyle: { color: '#5470C6' } },
      { name: getStudentName(selectedStudent2.value), type: 'bar', data: student2Ranks, itemStyle: { color: '#91CC75' } }
    ]
  };
});

// 工具函数 
const getStudentName = (studentId: string | undefined) => {
  if (!studentId) return '';
  const student = studentList.value.find(s => s.id === studentId); // 通过string类型的id匹配
  return student ? student.name : '未知学生';
};

const getDifferenceClass = (diff: number) => {
  if (diff > 0) return 'negative';
  if (diff < 0) return 'positive';
  return 'zero';
};

const getRankDifferenceClass = (diff: number) => {
  if (diff > 0) return 'negative';
  if (diff < 0) return 'positive';
  return 'zero';
};

// 格式化分数（保留2位小数）
const formatScore = (score: number) => {
  return score.toFixed(2);
};

// 处理考试变化
const handleExamChange = (examId: number) => {
  selectedExamId.value = examId;
};
// 同时获取学生列表和考试列表
const fetchStudentListAndExams = async () => {
  if (!selectedClassId.value) return;
  
  try {
    loading.value = true;
    // 并行请求学生列表和考试列表
    const [studentRes, examRes] = await Promise.all([
      getStudentApi({ class_id: selectedClassId.value }),
      getClassExam({ class_id: selectedClassId.value })
    ]);
    
    // 处理学生列表
    if (studentRes.code === 200 && studentRes.data) {
      studentList.value = studentRes.data.map((item: any) => ({
        id: item.uid,        
        name: item.name,
        class_id: item.class_id,
        uid: item.uid        
      }));
      filteredStudentList1.value = [...studentList.value];
      filteredStudentList2.value = [...studentList.value];
      selectedStudent1.value = undefined;
      selectedStudent2.value = undefined;
      searchKeyword1.value = '';
      searchKeyword2.value = '';
    } else {
      message.warning(studentRes.msg || '获取学生列表失败');
      studentList.value = [];
      filteredStudentList1.value = [];
      filteredStudentList2.value = [];
    }
    
    // 处理考试列表
    if (examRes.code === 200 && examRes.data.length > 0) {
    examList.value = examRes.data.map((examId: number) => ({
    id: examId,
    name: `考试${examId}`
  }));
    if (examList.value.length > 0) {
      selectedExamId.value = examList.value[0].id;
    }
  } else {
  message.warning(examRes.msg || '获取考试列表失败');
  examList.value = [];
  selectedExamId.value = 0;
}
  } catch (err) {
    message.error('获取学生或考试列表失败');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 处理学生1搜索
const handleStudent1Search = (value: string) => {
  searchKeyword1.value = value;
  if (!value) {
    filteredStudentList1.value = [...studentList.value];
    return;
  }
  
  const filtered = studentList.value.filter(student => 
    student.name.toLowerCase().includes(value.toLowerCase()) ||
    student.uid.toString().includes(value.toLowerCase())
  );
  filteredStudentList1.value = filtered;
};

// 处理学生2搜索
const handleStudent2Search = (value: string) => {
  searchKeyword2.value = value;
  if (!value) {
    filteredStudentList2.value = [...studentList.value];
    return;
  }
  
  const filtered = studentList.value.filter(student => 
    student.name.toLowerCase().includes(value.toLowerCase()) ||
    student.uid.toString().includes(value.toLowerCase())
  );
  filteredStudentList2.value = filtered;
};

// 处理学生1选择变化
const handleStudent1Change = (studentId: string) => {
  selectedStudent1.value = studentId;
};

// 处理学生2选择变化
const handleStudent2Change = (studentId: string) => {
  selectedStudent2.value = studentId;
};

// 获取对比数据
const fetchComparisonData = async () => {
  if (selectedStudent1.value === selectedStudent2.value) {
    message.warning('请选择不同的学生进行对比');
    return;
  }
  
  if (!selectedStudent1.value || !selectedStudent2.value || !selectedExamId.value) {
    message.warning('请选择完整的对比条件');
    return;
  }
  
  try {
    loading.value = true;
    hasSearched.value = true;
    
    const res = await getCompareWithStudent({
      student_id: selectedStudent1.value,  
      compare_student_id: selectedStudent2.value,  
      selected_exam_id: selectedExamId.value.toString() as unknown as string
    });
    
    if (res.code === 200 && res.data) {
      const { current_student, compare_student } = res.data;
      comparisonData.value = {
        valid: true,
        current_student: res.data.current_student,
        compare_student: res.data.compare_student,
        total_score: {
          current: current_student.sum_ || 0,
          compare: compare_student.sum_ || 0
        },
        class_rank: {
          current: current_student.sumB || 0,
          compare: compare_student.sumB || 0
        },
        grade_rank: {
          current: current_student.sumD || 0,
          compare: compare_student.sumD || 0
        },
        class_total: 0,
        grade_total: 0,
        subject_score: {
          current: {
            Yuwen: current_student.Yuwen || 0,
            Shuxue: current_student.Shuxue || 0,
            Yingyu: current_student.Yingyu || 0,
            Wuli: current_student.Wuli || 0,
            Huaxue: current_student.Huaxue || 0,
            Shengwu: current_student.Shengwu || 0,
            Lishi: current_student.Lishi || 0,
            Zhengzhi: current_student.Zhengzhi || 0,
            Dili: current_student.Dili || 0,
          },
          compare: {
            Yuwen: compare_student.Yuwen || 0,
            Shuxue: compare_student.Shuxue || 0,
            Yingyu: compare_student.Yingyu || 0,
            Wuli: compare_student.Wuli || 0,
            Huaxue: compare_student.Huaxue || 0,
            Shengwu: compare_student.Shengwu || 0,
            Lishi: compare_student.Lishi || 0,
            Zhengzhi: compare_student.Zhengzhi || 0,
            Dili: compare_student.Dili || 0,
          }
        },
        subject_class_rank: {
          current: {
            Yuwen: current_student.YuwenB || 0,
            Shuxue: current_student.ShuxueB || 0,
            Yingyu: current_student.YingyuB || 0,
            Wuli: current_student.WuliB || 0,
            Huaxue: current_student.HuaxueB || 0,
            Shengwu: current_student.ShengwuB || 0,
            Lishi: current_student.LishiB || 0,
            Zhengzhi: current_student.ZhengzhiB || 0,
            Dili: current_student.DiliB || 0,
          },
          compare: {
            Yuwen: compare_student.YuwenB || 0,
            Shuxue: compare_student.ShuxueB || 0,
            Yingyu: compare_student.YingyuB || 0,
            Wuli: compare_student.WuliB || 0,
            Huaxue: compare_student.HuaxueB || 0,
            Shengwu: compare_student.ShengwuB || 0,
            Lishi: compare_student.LishiB || 0,
            Zhengzhi: compare_student.ZhengzhiB || 0,
            Dili: compare_student.DiliB || 0,
          }
        },
        detail: {
          current: [
            { key: '总分', value: (current_student.sum_ || 0).toFixed(2) },
            { key: '班级排名', value: `${current_student.sumB || 0} / -` },
            { key: '年级排名', value: `${current_student.sumD || 0} / -` },
          ],
          compare: [
            { key: '总分', value: (compare_student.sum_ || 0).toFixed(2) },
            { key: '班级排名', value: `${compare_student.sumB || 0} / -` },
            { key: '年级排名', value: `${compare_student.sumD || 0} / -` },
          ]
        }
      };
    } else {
      message.error(res?.msg || '获取对比数据失败');
      comparisonData.value = { valid: false };
    }
  } catch (err) {
    message.error('获取对比数据失败');
    console.error(err);
    comparisonData.value = { valid: false };
  } finally {
    loading.value = false;
  }
};

// 重置筛选
const resetFilters = () => {
  if (examList.value.length > 0) {
    selectedExamId.value = examList.value[0].id;
  }
  if (classList.value.length > 0) {
    selectedClassId.value = classList.value[0].id;
    // 重置班级时重新加载学生列表
    fetchStudentListAndExams();
  }
  selectedStudent1.value = undefined;
  selectedStudent2.value = undefined;
  searchKeyword1.value = '';
  searchKeyword2.value = '';
  comparisonData.value = { valid: false };
  hasSearched.value = false;
};

// 计算"开始对比"按钮的禁用状态
const isCompareBtnDisabled = computed(() => {
  return (
    loading.value || 
    !selectedClassId.value || 
    !selectedStudent1.value || 
    !selectedStudent2.value || 
    !selectedExamId.value || 
    selectedStudent1.value === selectedStudent2.value
  );
});

// 获取学生详情数据
const getStudentDetailData = (studentId: string | undefined) => {
  if (!studentId || !comparisonData.value.valid) return [];
  
  const isCurrentStudent = studentId === selectedStudent1.value;
  const rawDetail = comparisonData.value.detail?.[isCurrentStudent ? 'current' : 'compare'] || [];
  
  // 过滤重复的项
  const filteredDetail = rawDetail.filter(item => 
    !['总分', '班级排名', '年级排名'].includes(item.key)
  );
  
  // 格式化班级排名和年级排名的文本
  const classRank = `${isCurrentStudent 
    ? comparisonData.value.class_rank?.current || 0 
    : comparisonData.value.class_rank?.compare || 0}`;
  const gradeRank = `${isCurrentStudent 
    ? comparisonData.value.grade_rank?.current || 0 
    : comparisonData.value.grade_rank?.compare || 0}`;
  
  // 组装最终数据
  return [
    { key: '总分', value: formatScore(isCurrentStudent 
      ? comparisonData.value.total_score?.current || 0 
      : comparisonData.value.total_score?.compare || 0) },
    { key: '班级排名', value: classRank },
    { key: '年级排名', value: gradeRank },
    ...filteredDetail
  ];
};

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
    
    // 1. 获取班级列表
    const classRes = await getClassesApi({ header: teacherId });
    if (classRes.code === 200 && classRes.data.length > 0) {
      classList.value = classRes.data;
      selectedClassId.value = classList.value[0].id;
      // 2. 加载考试和学生列表
      await fetchStudentListAndExams();
    } else {
      message.warning(classRes.msg || '未找到您管理的班级');
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
.student-compare-container {
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

    .class-selector-container,
    .student-selector-container {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      gap: 16px;
      justify-content: center;
      
      .class-selector-item,
      .student-selector-item {
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

        .student-name {
          color: #535353;
          font-weight: 500;
        }

        .score, .rank, .count {
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
    
    .class-rank-card {
      border-top: 4px solid #52c41a;
    }
    
    .grade-rank-card {
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

  .positive {
    color: #f5222d; // 红色表示学生1优于学生2
  }

  .negative {
    color: #52c41a; // 绿色表示学生2优于学生1
  }

  .zero {
    color: #535353;
  }
  
  // 响应式设计
  @media (max-width: 768px) {
    padding: 12px;
    
    .filter-section {
      padding: 16px;
    }
    
    .class-selector-container,
    .student-selector-container {
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
          .score, .rank, .count {
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
  }
}
</style>
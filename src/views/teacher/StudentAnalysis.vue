<template>
  <div class="student-analysis-container">
    <div class="header">
      <h2>学生成绩分析</h2>
      <p>选择学生和考试查看详细成绩分析</p>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <a-row :gutter="16">
        <a-col :xs="24" :sm="12" :md="8">
          <div class="filter-item">
            <span class="filter-label">选择学生：</span>
            <a-select
              v-model:value="selectedStudentId"
              placeholder="请输入学生姓名或学号搜索"
              style="width: 100%"
              @change="handleStudentChange"
              :options="filteredStudentOptions"
              show-search
              :filter-option="false"
              @search="handleStudentSearch"
            >
              <template #suffixIcon>
                <SearchOutlined />
              </template>
            </a-select>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="filter-item">
            <span class="filter-label">选择考试：</span>
            <a-select
              v-model:value="selectedExamId"
              placeholder="请选择考试"
              style="width: 100%"
              @change="handleExamChange"
              :options="examOptions"
              :disabled="!selectedStudentId"
            />
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="6">
          <div class="filter-item">
            <span class="filter-label">对比考试：</span>
            <a-select
              v-model:value="selectedComparedExamId"
              placeholder="请选择对比考试"
              style="width: 100%"
              @change="handleComparedExamChange"
              :options="comparedExamOptions"
              :disabled="!selectedStudentId || !selectedExamId"
              allowClear
            />
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="4">
          <div class="filter-actions">
            <a-space>
              <a-button 
                v-if="selectedComparedExamId" 
                @click="clearCompare"
              >
                取消对比
              </a-button>
              <a-button type="primary" @click="resetFilters">重置筛选</a-button>
            </a-space>
          </div>
        </a-col>
      </a-row>
    </div>

    <!-- 成绩详情区域 -->
    <div class="analysis-content" v-if="selectedStudentId && selectedExamId">
      <!-- 学生基本信息和总览 -->
      <a-row :gutter="16" class="overview-section">
        <a-col :span="24" :md="8">
          <div class="student-info-card">
            <div class="student-avatar">
              <UserOutlined />
            </div>
            <div class="student-details">
              <h3>{{ currentStudentInfo.student_name }}</h3>
              <p>学号: {{ maskStudentId(currentStudentInfo.student_id) }}</p>
              <p>考试: {{ examMap[selectedExamId] || currentExamInfo.name }}</p>
            </div>
          </div>
        </a-col>
        <a-col :span="24" :md="16">
          <div class="summary-cards">
            <a-row :gutter="16">
              <a-col :span="12" :lg="8">
                <div class="summary-card total-score-card">
                  <div class="card-title">总分</div>
                  <div class="card-value">{{ totalScore }}</div>
                  <div class="card-footer">
                    <span>班级排名: {{ totalClassRank }}</span>
                    <span>年级排名: {{ totalGradeRank }}</span>
                  </div>
                </div>
              </a-col>

              <a-col :span="12" :lg="8">
                <div class="summary-card rank-card">
                  <div class="card-title">班级排名</div>
                  <div class="card-value" :class="getRankClass(totalClassRank)">
                    {{ totalClassRank }}
                  </div>
                  <div class="card-footer">
                    <span>年级排名: {{ totalGradeRank }}</span>
                  </div>
                </div>
              </a-col>
              <a-col :span="12" :lg="8">
                <div class="summary-card pass-rate-card">
                  <div class="card-title">及格率</div>
                  <div class="card-value">{{ passRate }}%</div>
                  <div class="card-footer">
                    <span>及格科目: {{ passSubjectCount }}/{{ subjectCount }}</span>
                  </div>
                </div>
              </a-col>
            </a-row>
          </div>
        </a-col>
      </a-row>

      <!-- 成绩详情和分数线对比 -->
      <a-row :gutter="16" style="margin-top: 20px;">
        <a-col :span="24" :md="12">
          <a-card title="成绩详情" class="score-card">
            <a-table
              :columns="scoreColumns"
              :data-source="scoreData"
              :pagination="false"
              bordered
              size="middle"
              :scroll="{ y: 300 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'score'">
                  <span :class="getScoreClass(record.score, record.subject)">
                    {{ record.score }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'classRank'">
                  <span :class="getRankClass(record.classRank)">
                    {{ record.classRank }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'gradeRank'">
                  <span :class="getRankClass(record.gradeRank)">
                    {{ record.gradeRank }}
                  </span>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
        <a-col :span="24" :md="12">
          <a-card title="分数线对比" class="passline-card">
            <a-table
              :columns="passLineColumns"
              :data-source="passLineData"
              :pagination="false"
              bordered
              size="middle"
              :scroll="{ y: 300 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'studentScore'">
                  <span :class="getScoreClass(record.studentScore, record.subject)">
                    {{ record.studentScore }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'passLine'">
                  <span class="pass-line">{{ record.passLine }}</span>
                </template>
                <template v-if="column.dataIndex === 'difference'">
                    <span :class="getDifferenceClass(record.difference)">
                    {{ record.difference > 0 ? '⬆' : record.difference < 0 ? '⬇' : '' }}{{ Math.abs(record.difference) }}
                  </span>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>

      <!-- 考试对比结果 -->
      <a-row :gutter="16" style="margin-top: 20px;" v-if="compareData && selectedComparedExamId">
        <a-col :span="24">
          <a-card title="考试对比分析" class="compare-card">
            <div class="compare-header">
              <div class="compare-exam-info">
                <span class="exam-label">当前考试：</span>
                <span class="exam-name">{{ compareData.exam_name?.current || examMap[selectedExamId] }}</span>
              </div>
              <div class="compare-exam-info">
                <span class="exam-label">对比考试：</span>
                <span class="exam-name">{{ compareData.exam_name?.compare || examMap[selectedComparedExamId] }}</span>
              </div>
            </div>
            <a-table
              :columns="compareColumns"
              :data-source="compareTableData"
              :pagination="false"
              bordered
              size="middle"
              :scroll="{ y: 300 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'currentScore'">
                  <span :class="getScoreClass(record.currentScore, record.subject)">
                    {{ record.currentScore }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'compareScore'">
                  <span :class="getScoreClass(record.compareScore, record.subject)">
                    {{ record.compareScore }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'scoreDiff'">
                  <span :class="getDifferenceClass(record.scoreDiff)">
                    {{ record.scoreDiff > 0 ? '⬆' : record.scoreDiff < 0 ? '⬇' : '' }}{{ formatScore(Math.abs(record.scoreDiff)) }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'currentClassRank'">
                  <span :class="getRankClass(record.currentClassRank)">
                    {{ record.currentClassRank }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'compareClassRank'">
                  <span :class="getRankClass(record.compareClassRank)">
                    {{ record.compareClassRank }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'classRankDiff'">
                  <span :class="getRankDifferenceClass(record.classRankDiff)">
                    {{ record.classRankDiff > 0 ? '⬇' : record.classRankDiff < 0 ? '⬆' : '' }}{{ Math.abs(record.classRankDiff) }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'currentGradeRank'">
                  <span :class="getRankClass(record.currentGradeRank)">
                    {{ record.currentGradeRank }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'compareGradeRank'">
                  <span :class="getRankClass(record.compareGradeRank)">
                    {{ record.compareGradeRank }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'gradeRankDiff'">
                  <span :class="getRankDifferenceClass(record.gradeRankDiff)">
                    {{ record.gradeRankDiff > 0 ? '⬇' : record.gradeRankDiff < 0 ? '⬆' : '' }}{{ Math.abs(record.gradeRankDiff) }}
                  </span>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>

      <!-- 图表展示 -->
      <div class="charts-section">
        <a-row :gutter="16" style="margin-top: 20px;">
          <a-col :span="24" :md="12">
            <a-card title="成绩分布图" class="chart-card">
              <div class="chart-container">
                <e-charts :option="scoreChartOption" style="height: 300px" />
              </div>
            </a-card>
          </a-col>
          <a-col :span="24" :md="12">
            <a-card title="排名趋势图" class="chart-card">
              <div class="chart-container">
                <e-charts :option="rankChartOption" style="height: 300px" />
              </div>
            </a-card>
          </a-col>
        </a-row>
      </div>
    </div>

    <!-- 选择提示 -->
    <div class="select-prompt" v-else>
      <a-empty description="请选择学生和考试查看成绩分析" />
    </div>

    <!-- 加载状态 -->
    <a-spin v-if="loading" tip="加载中..." class="loading-spin" />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/store';
import { message } from 'ant-design-vue';
import { SearchOutlined, UserOutlined } from '@ant-design/icons-vue';
import { getClassesApi } from '@/servers/api/classes';
import { getStudentApi } from '@/servers/api/student';
import { getClassExam } from '@/servers/api/grade';
import { getGradeApi } from '@/servers/api/grade';
import { getPassLine, getStudentSelfCompareApi } from '@/servers/api/analysis';
import { getExamDetailApi } from '@/servers/api/exam';
import type { ColumnType } from 'ant-design-vue/es/table';
import * as echarts from 'echarts';
import StudentAnalysisPage from '../student/StudentAnalysisPage.vue';

// 类型定义
interface Student {
  student_id: string;
  student_name: string;
}

interface Exam {
  id: number;
  name: string;
}

interface ScoreDetail {
  subject: string;
  subjectName: string;
  score: number;
  classRank: number;
  gradeRank: number;
}

interface PassLineDetail {
  subject: string;
  subjectName: string;
  studentScore: number;
  passLine: number;
  difference: number;
}

// 状态管理
const userStore = useUserStore();
const classId = ref<number>(0);
const teacherId = ref<number>(0);
const loading = ref(false);
const searchKeyword = ref('');

// 数据列表
const studentList = ref<Student[]>([]);
const filteredStudentList = ref<Student[]>([]);
const examList = ref<Exam[]>([]);
const examMap = ref<Record<number, string>>({}); // 用于存储考试ID到考试名称的映射
const scoreDetails = ref<any>({});
const passLineDetails = ref<any>({});
const compareData = ref<any>(null); // 存储对比数据

// 选择状态
const selectedStudentId = ref<string>('');
const selectedExamId = ref<number>(0);
const selectedComparedExamId = ref<number | undefined>(undefined);

// 科目映射
const subjectMap: Record<string, string> = {
  'yuwen': '语文',
  'shuxue': '数学',
  'yingyu': '英语',
  'wuli': '物理',
  'huaxue': '化学',
  'shengwu': '生物',
  'lishi': '历史',
  'zhengzhi': '政治',
  'dili': '地理',
  'sum_': '总分'
};

// 学生选项（用于下拉框）
const filteredStudentOptions = computed(() => {
  return filteredStudentList.value.map(student => ({
    label: `${student.student_name} (${maskStudentId(student.student_id)})`,
    value: student.student_id
  }));
});

// 考试选项
const examOptions = computed(() => {
  return examList.value.map(exam => ({
    label: examMap.value[exam.id] || exam.name,
    value: exam.id
  }));
});

// 对比考试选项（排除当前选中的考试）
const comparedExamOptions = computed(() => {
  return examList.value
    .filter(exam => exam.id !== selectedExamId.value)
    .map(exam => ({
      label: examMap.value[exam.id] || exam.name,
      value: exam.id
    }));
});

// 当前学生信息
const currentStudentInfo = computed(() => {
  const student = studentList.value.find(s => s.student_id === selectedStudentId.value);
  return student || { student_id: '', student_name: '' };
});

// 当前考试信息
const currentExamInfo = computed(() => {
  const exam = examList.value.find(e => e.id === selectedExamId.value);
  return exam || { id: 0, name: '' };
});

// 总分相关计算
const totalScore = computed(() => {
  const detail = scoreDetails.value[selectedExamId.value];
  return detail ? detail.sum_ || 0 : 0;
});

const totalClassRank = computed(() => {
  const detail = scoreDetails.value[selectedExamId.value];
  return detail ? detail.sumb || 0 : 0;
});

const totalGradeRank = computed(() => {
  const detail = scoreDetails.value[selectedExamId.value];
  return detail ? detail.sumd || 0 : 0;
});


const maxScore = computed(() => {
  const data = scoreData.value.filter(item => item.subject !== 'sum_');
  if (data.length === 0) return 0;
  return Math.max(...data.map(item => item.score));
});

// 及格率相关计算
const passSubjectCount = computed(() => {
  return scoreData.value.filter(item => item.subject !== 'sum_' && item.score >= 60).length;
});

const subjectCount = computed(() => {
  return scoreData.value.filter(item => item.subject !== 'sum_').length;
});

const passRate = computed(() => {
  if (subjectCount.value === 0) return 0;
  return ((passSubjectCount.value / subjectCount.value) * 100).toFixed(0);
});

// 成绩表格列
const scoreColumns: ColumnType[] = [
  {
    title: '科目',
    dataIndex: 'subjectName',
    key: 'subjectName',
    align: 'center'
  },
  {
    title: '成绩',
    dataIndex: 'score',
    key: 'score',
    align: 'center'
  },
  {
    title: '班级排名',
    dataIndex: 'classRank',
    key: 'classRank',
    align: 'center'
  },
  {
    title: '年级排名',
    dataIndex: 'gradeRank',
    key: 'gradeRank',
    align: 'center'
  }
];

// 分数线表格列
const passLineColumns: ColumnType[] = [
  {
    title: '科目',
    dataIndex: 'subjectName',
    key: 'subjectName',
    align: 'center'
  },
  {
    title: '学生成绩',
    dataIndex: 'studentScore',
    key: 'studentScore',
    align: 'center'
  },
  {
    title: '一本线',
    dataIndex: 'passLine',
    key: 'passLine',
    align: 'center'
  },
  {
    title: '差值',
    dataIndex: 'difference',
    key: 'difference',
    align: 'center'
  }
];

// 考试对比表格列
const compareColumns: ColumnType[] = [
  {
    title: '科目',
    dataIndex: 'subjectName',
    key: 'subjectName',
    align: 'center',
    width: 100,
    fixed: 'left'
  },
  {
    title: '当前成绩',
    dataIndex: 'currentScore',
    key: 'currentScore',
    align: 'center',
    width: 90
  },
  {
    title: '对比成绩',
    dataIndex: 'compareScore',
    key: 'compareScore',
    align: 'center',
    width: 90
  },
  {
    title: '成绩差',
    dataIndex: 'scoreDiff',
    key: 'scoreDiff',
    align: 'center',
    width: 90
  },
  {
    title: '当前班排',
    dataIndex: 'currentClassRank',
    key: 'currentClassRank',
    align: 'center',
    width: 90
  },
  {
    title: '对比班排',
    dataIndex: 'compareClassRank',
    key: 'compareClassRank',
    align: 'center',
    width: 90
  },
  {
    title: '班排差',
    dataIndex: 'classRankDiff',
    key: 'classRankDiff',
    align: 'center',
    width: 80
  },
  {
    title: '当前年排',
    dataIndex: 'currentGradeRank',
    key: 'currentGradeRank',
    align: 'center',
    width: 90
  },
  {
    title: '对比年排',
    dataIndex: 'compareGradeRank',
    key: 'compareGradeRank',
    align: 'center',
    width: 90
  },
  {
    title: '年排差',
    dataIndex: 'gradeRankDiff',
    key: 'gradeRankDiff',
    align: 'center',
    width: 80
  }
];

// 成绩数据
const scoreData = computed<ScoreDetail[]>(() => {
  if (!selectedStudentId.value || !selectedExamId.value) return [];
  
  const data: ScoreDetail[] = [];
  const scoreDetail = scoreDetails.value[selectedExamId.value];
  
  if (!scoreDetail) return [];
  
  // 添加总分
  data.push({
    subject: 'sum_',
    subjectName: '总分',
    score: scoreDetail.sum_ || 0,
    classRank: scoreDetail.sumb || 0,
    gradeRank: scoreDetail.sumd || 0
  });
  
  // 添加各科成绩
  Object.keys(subjectMap).forEach(subject => {
    if (subject === 'sum_') return; // 总分已处理
    
    const score = scoreDetail[subject] || 0;
    const classRank = scoreDetail[`${subject}b`] || 0;
    const gradeRank = scoreDetail[`${subject}d`] || 0;
    
    // 只添加有成绩的科目
    if (score > 0 || classRank > 0 || gradeRank > 0) {
      data.push({
        subject,
        subjectName: subjectMap[subject],
        score,
        classRank,
        gradeRank
      });
    }
  });
  
  return data;
});

// 分数线数据
const passLineData = computed<PassLineDetail[]>(() => {
  if (!selectedStudentId.value || !selectedExamId.value) return [];
  
  const data: PassLineDetail[] = [];
  const scoreDetail = scoreDetails.value[selectedExamId.value];
  const passLineDetail = passLineDetails.value[selectedExamId.value];
  
  if (!scoreDetail || !passLineDetail) return [];
  
  // 添加总分
  const totalScore = scoreDetail.sum_ || 0;
  const totalPassLine = passLineDetail.sum_ || 0;
  data.push({
    subject: 'sum_',
    subjectName: '总分',
    studentScore: totalScore,
    passLine: totalPassLine,
    difference: totalScore - totalPassLine
  });
  
  // 添加各科成绩
  Object.keys(subjectMap).forEach(subject => {
    if (subject === 'sum_') return; // 总分已处理
    
    const score = scoreDetail[subject] || 0;
    const passLine = passLineDetail[subject] || 0;
    
    // 只添加有成绩的科目
    if (score > 0 || passLine > 0) {
      data.push({
        subject,
        subjectName: subjectMap[subject],
        studentScore: score,
        passLine,
        difference: score - passLine
      });
    }
  });
  
  return data;
});

// 对比表格数据
const compareTableData = computed(() => {
  if (!compareData.value) return [];
  
  const data: any[] = [];
  const compareDataValue = compareData.value;
  
  // 添加总分
  if (compareDataValue.sum_) {
    data.push({
      subject: 'sum_',
      subjectName: '总分',
      currentScore: compareDataValue.sum_.current || 0,
      compareScore: compareDataValue.sum_.compare || 0,
      scoreDiff: Number(compareDataValue.sum_.difference || 0),
      currentClassRank: compareDataValue.sumb?.current || 0,
      compareClassRank: compareDataValue.sumb?.compare || 0,
      classRankDiff: compareDataValue.sumb?.difference || 0,
      currentGradeRank: compareDataValue.sumd?.current || 0,
      compareGradeRank: compareDataValue.sumd?.compare || 0,
      gradeRankDiff: compareDataValue.sumd?.difference || 0
    });
  }
  
  // 添加各科成绩
  Object.keys(subjectMap).forEach(subject => {
    if (subject === 'sum_') return; // 总分已处理
    
    const subjectData = compareDataValue[subject];
    if (subjectData) {
      const classRankKey = `${subject}b`;
      const gradeRankKey = `${subject}d`;
      
      data.push({
        subject,
        subjectName: subjectMap[subject],
        currentScore: subjectData.current || 0,
        compareScore: subjectData.compare || 0,
        scoreDiff: Number(subjectData.difference || 0),
        currentClassRank: compareDataValue[classRankKey]?.current || 0,
        compareClassRank: compareDataValue[classRankKey]?.compare || 0,
        classRankDiff: compareDataValue[classRankKey]?.difference || 0,
        currentGradeRank: compareDataValue[gradeRankKey]?.current || 0,
        compareGradeRank: compareDataValue[gradeRankKey]?.compare || 0,
        gradeRankDiff: compareDataValue[gradeRankKey]?.difference || 0
      });
    }
  });
  
  return data;
});

// 成绩图表选项
const scoreChartOption = computed(() => {
  const subjects = scoreData.value.filter(item => item.subject !== 'sum_').map(item => item.subjectName);
  const scores = scoreData.value.filter(item => item.subject !== 'sum_').map(item => item.score);
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: subjects
    },
    yAxis: {
      type: 'value',
      name: '分数'
    },
    series: [{
      type: 'bar',
      data: scores,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#1890ff' }
        ])
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}'
      }
    }]
  };
});

// 排名图表选项
const rankChartOption = computed(() => {
  const subjects = scoreData.value.filter(item => item.subject !== 'sum_').map(item => item.subjectName);
  const classRanks = scoreData.value.filter(item => item.subject !== 'sum_').map(item => item.classRank);
  const gradeRanks = scoreData.value.filter(item => item.subject !== 'sum_').map(item => item.gradeRank);
  
  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['班级排名', '年级排名']
    },
    xAxis: {
      type: 'category',
      data: subjects
    },
    yAxis: {
      type: 'value',
      name: '排名',
      inverse: true
    },
    series: [
      {
        name: '班级排名',
        type: 'line',
        data: classRanks,
        itemStyle: {
          color: '#FF6B6B'
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}'
        },
        smooth: true
      },
      {
        name: '年级排名',
        type: 'line',
        data: gradeRanks,
        itemStyle: {
          color: '#4ECDC4'
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}'
        },
        smooth: true
      }
    ]
  };
});

// 处理学生搜索
const handleStudentSearch = (value: string) => {
  searchKeyword.value = value;
  if (!value) {
    // 如果搜索关键词为空，显示所有学生
    filteredStudentList.value = [...studentList.value];
    return;
  }
  
  // 根据关键词过滤学生列表
  const filtered = studentList.value.filter(student => 
    student.student_name.toLowerCase().includes(value.toLowerCase()) ||
    student.student_id.toLowerCase().includes(value.toLowerCase())
  );
  filteredStudentList.value = filtered;
};

// 获取成绩等级类名
const getScoreClass = (score: number, subject: string) => {
  if (subject === 'sum_') {
    return score >= 600 ? 'excellent-score' : score >= 500 ? 'good-score' : 'normal-score';
  }
  return score >= 90 ? 'excellent-score' : score >= 80 ? 'good-score' : 'normal-score';
};

// 获取排名类名
const getRankClass = (rank: number) => {
  return rank <= 3 ? 'top-rank' : rank <= 10 ? 'good-rank' : 'normal-rank';
};

// 获取差值类名
const getDifferenceClass = (difference: number) => {
  return difference >= 0 ? 'positive-difference' : 'negative-difference';
};

// 获取排名差值类名（排名越小越好，所以正数表示下降，负数表示上升）
const getRankDifferenceClass = (difference: number) => {
  return difference > 0 ? 'rank-down' : difference < 0 ? 'rank-up' : 'rank-same';
};

// 格式化分数，保留一位小数
const formatScore = (score: number) => {
  return Number.isInteger(score) ? score : score.toFixed(1);
};

// 显示所有学生
const showAllStudents = () => {
  searchKeyword.value = '';
  filteredStudentList.value = [...studentList.value];
};

// 初始化
onMounted(async () => {
  try {
    loading.value = true;
    const userInfo = userStore.getUserInfo();
    const header = userInfo?.teacher?.uid;
    
    if (!header) {
      message.error('未获取到教师信息');
      return;
    }

    const classRes = await getClassesApi({ header: header });
    if (classRes.code !== 200 || !classRes.data.length) {
      message.error('未查询到教师关联的班级信息');
      return;
    }

    teacherId.value = classRes.data[0].header;
    classId.value = classRes.data[0].id;
    await fetchExamList()
    await fetchStudentList();
    await handleExamChange(selectedExamId.value);
  } catch (err) {
    message.error('初始化失败');
    console.error(err);
  } finally {
    loading.value = false;
  }
});

// 获取学生列表
const fetchStudentList = async () => {
  try {
    loading.value = true;
    const res = await getStudentApi({ class_id: classId.value,page:1,size:9999 });
    
    if (res.code === 200) {
      // 处理学生数据，添加考试次数和平均分占位符
      studentList.value = res.data.map((student: any) => ({
        student_id: student.uid,
        student_name: student.name,
      }));
      
      // 初始化过滤后的学生列表为所有学生
      filteredStudentList.value = [...studentList.value];
      
      // 默认选择第一个学生
      if (studentList.value.length > 0 && !selectedStudentId.value) {
        selectedStudentId.value = studentList.value[0].student_id;
        // 获取第一个学生的考试成绩
        if (selectedExamId.value) {
          await fetchStudentGrades(selectedStudentId.value, selectedExamId.value);
        }
      }
    } else {
      message.error('获取学生列表失败');
    }
  } catch (err) {
    message.error('请求学生列表接口出错');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 获取考试列表
const fetchExamList = async () => {
  try {
    loading.value = true;
    // @ts-ignore
    const res = await getClassExam({ class_id: classId.value });
    if (res.code === 200) {
      // 获取考试ID列表
      const examIds = res.data;
      
      // 获取每个考试的详细信息
      const examDetails = await Promise.all(
        examIds.map(async (id: number) => {
          try {
            const examRes = await getExamDetailApi({ exam_id: id });
            if (examRes.code === 200) {
              examMap.value[id] = examRes.data[0].name;
              return {
                id,
                name: examRes.data[0].name
              };
            } else {
              return {
                id,
                name: `考试 ${id}`
              };
            }
          } catch (err) {
            console.error(`获取考试 ${id} 详情失败:`, err);
            return {
              id,
              name: `考试 ${id}`
            };
          }
        })
      );
      
      examList.value = examDetails;
      if (examDetails.length > 0) {
        // 默认选择最新的考试（最后一个）
        selectedExamId.value = examDetails[examDetails.length - 1].id;
        if (examDetails.length >= 2) {
          selectedComparedExamId.value = examDetails[examDetails.length - 2].id;
        }
          
        // 如果已经有选中的学生，获取该学生的考试成绩
        if (selectedStudentId.value) {
          await Promise.all([
            fetchStudentGrades(selectedStudentId.value, selectedExamId.value),
            fetchPassLine(selectedExamId.value)
          ]);
          
          // 如果有默认对比考试，也加载对比数据
          if (selectedComparedExamId.value) {
            await fetchCompareData(selectedStudentId.value, selectedExamId.value, selectedComparedExamId.value);
          }
        }
      }
    } else {
      message.error('获取考试列表失败');
    }
  } catch (err) {
    message.error('请求考试列表接口出错');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 获取学生成绩详情
const fetchStudentGrades = async (studentId: string, examId: number) => {
  try {
    loading.value = true;
    const res = await getGradeApi({ student_id: parseInt(studentId), exam_id: examId });
    
    if (res.code === 200 && res.data.length > 0) {
      scoreDetails.value[examId] = res.data[0];
    } else {
      message.warning('未获取到该考试的成绩数据');
      scoreDetails.value[examId] = {};
    }
  } catch (err) {
    message.error('请求成绩详情接口出错');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 获取分数线
const fetchPassLine = async (examId: number) => {
  try {
    const res = await getPassLine({ exam_id: examId });
    
    if (res.code === 200 && res.data.length > 0) {
      // 假设取第一条分数线数据
      passLineDetails.value[examId] = res.data[0];
    } else {
      message.warning('未获取到该考试的分数线数据');
      passLineDetails.value[examId] = {};
    }
  } catch (err) {
    message.error('请求分数线接口出错');
    console.error(err);
  }
};

// 处理学生选择
const handleStudentChange = async (studentId: string) => {
  selectedStudentId.value = studentId;
  // 清空之前的数据
  scoreDetails.value = {};
  passLineDetails.value = {};
  compareData.value = null;
 
  // 获取该学生的考试成绩和分数线
  if (selectedExamId.value) {
    await Promise.all([
      fetchStudentGrades(studentId, selectedExamId.value),
      fetchPassLine(selectedExamId.value)
    ]);
    
    // 如果有选中对比考试，也获取对比数据
    if (selectedComparedExamId.value) {
      await fetchCompareData(studentId, selectedExamId.value, selectedComparedExamId.value);
    }
  }
};

// 处理考试选择
const handleExamChange = async (examId: number) => {
  const prevExamId = selectedExamId.value;
  selectedExamId.value = examId;
  // 仅在考试实际变更时清空对比数据
  if (prevExamId !== examId) {
    compareData.value = null;
    selectedComparedExamId.value = undefined;
  }

  // 获取成绩详情和分数线
  if (selectedStudentId.value) {
    await Promise.all([
      fetchStudentGrades(selectedStudentId.value, examId),
      fetchPassLine(examId)
    ]);

    // 如果已有对比考试但对比数据尚未加载，尝试加载对比数据
    if (selectedComparedExamId.value && !compareData.value) {
      await fetchCompareData(selectedStudentId.value, examId, selectedComparedExamId.value);
    }
  }
};

// 重置筛选
const resetFilters = () => {
  selectedStudentId.value = '';
  selectedExamId.value = examList.value.length > 0 ? examList.value[examList.value.length - 1].id : 0;
  selectedComparedExamId.value = undefined;
  scoreDetails.value = {};
  passLineDetails.value = {};
  compareData.value = null;
  searchKeyword.value = '';
  // 重置过滤后的学生列表为所有学生
  filteredStudentList.value = [...studentList.value];
};

// 获取考试对比数据
const fetchCompareData = async (studentId: string, examId: number, comparedExamId: number) => {
  try {
    loading.value = true;
    const res = await getStudentSelfCompareApi({
      student_id: parseInt(studentId),
      exam_id: examId,
      compared_exam_id: comparedExamId
    });
    
    if (res.code === 200 && res.data) {
      compareData.value = res.data;
    } else {
      message.warning('未获取到对比数据');
      compareData.value = null;
    }
  } catch (err) {
    message.error('请求对比数据接口出错');
    console.error(err);
    compareData.value = null;
  } finally {
    loading.value = false;
  }
};

// 处理对比考试选择
const handleComparedExamChange = async (comparedExamId: number | undefined) => {
  if (!comparedExamId) {
    compareData.value = null;
    return;
  }
  
  if (selectedStudentId.value && selectedExamId.value) {
    await fetchCompareData(selectedStudentId.value, selectedExamId.value, comparedExamId);
  }
};

// 取消对比
const clearCompare = () => {
  selectedComparedExamId.value = undefined;
  compareData.value = null;
};

// 学号脱敏处理，只显示后四位
const maskStudentId = (studentId: string) => {
  if (!studentId) return '';
  const idStr = String(studentId);
  if (idStr.length <= 4) return idStr;
  return '**' + idStr.slice(-4);
};
</script>

<style scoped lang="less">
.student-analysis-container {
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  overflow-y: auto;
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
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
    
    .filter-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      
      .filter-label {
        min-width: 80px;
        font-weight: 600;
        color: #333;
        white-space: nowrap;
      }
    }
    
    .filter-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      height: 100%;
      
      @media (max-width: 768px) {
        margin-top: 8px;
      }
    }
  }
  
  .overview-section {
    margin-bottom: 20px;
    
    .student-info-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      height: 100%;
      
      .student-avatar {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4b6cb7, #1890ff);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 30px;
        margin-right: 20px;
      }
      
      .student-details {
        h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          color: #333;
        }
        
        p {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #666;
        }
      }
    }
    
    .summary-cards {
      height: 100%;
      
      .summary-card {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        height: 100%;
        display: flex;
        flex-direction: column;
        transition: transform 0.3s ease;
        
        &:hover {
          transform: translateY(-5px);
        }
        
        .card-title {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .card-value {
          font-size: 24px;
          font-weight: 700;
          margin-left: 40%;
          margin-bottom: 8px;
          flex: 1;
          display: flex;
          align-items: center;
        }
        
        .card-footer {
          font-size: 12px;
          color: #999;
          display: flex;
          flex-direction: column;
          
          span {
            margin-bottom: 2px;
            
            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
      
      .total-score-card {
        border-top: 4px solid #1890ff;
        
        .card-value {
          color: #1890ff;
        }
      }
      
      .average-score-card {
        border-top: 4px solid #52c41a;
        
        .card-value {
          color: #52c41a;
        }
      }
      
      .rank-card {
        border-top: 4px solid #fa8c16;
        
        .card-value {
          color: #fa8c16;
        }
      }
      
      .pass-rate-card {
        border-top: 4px solid #722ed1;
        
        .card-value {
          color: #722ed1;
        }
      }
    }
  }
  
  .score-card, .passline-card, .chart-card {
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
  
  .chart-container {
    padding: 10px 0;
  }
  
  .select-prompt {
    background: white;
    border-radius: 12px;
    padding: 60px 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    text-align: center;
    margin-bottom: 20px;
  }
  
  .loading-spin {
    display: flex;
    justify-content: center;
    margin: 50px 0;
  }
  
  .excellent-score {
    color: #52c41a;
    font-weight: bold;
  }
  
  .good-score {
    color: #1890ff;
    font-weight: 600;
  }
  
  .normal-score {
    color: #333;
  }
  
  .top-rank {
    color: #f5222d;
    font-weight: bold;
  }
  
  .good-rank {
    color: #fa8c16;
    font-weight: 600;
  }
  
  .normal-rank {
    color: #333;
  }
  
  .pass-line {
    color: #1890ff;
    font-weight: bold;
  }
  
  .positive-difference {
    color: #52c41a;
    font-weight: 600;
  }
  
  .negative-difference {
    color: #f5222d;
    font-weight: 600;
  }
  
  .rank-up {
    color: #52c41a;
    font-weight: 600;
  }
  
  .rank-down {
    color: #f5222d;
    font-weight: 600;
  }
  
  .rank-same {
    color: #666;
  }
  
  .compare-card {
    .compare-header {
      display: flex;
      justify-content: space-around;
      padding: 16px;
      background: linear-gradient(120deg, #f0f2f5, #e4e7ec);
      border-radius: 8px;
      margin-bottom: 16px;
      
      .compare-exam-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .exam-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .exam-name {
          font-size: 16px;
          font-weight: 600;
          color: #1890ff;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .student-analysis-container {
    padding: 10px;
    
    .filter-section {
      .filter-item {
        margin-bottom: 10px;
        
        .filter-label {
          width: 60px;
        }
      }
    }
    
    .overview-section {
      .student-info-card {
        padding: 15px;
        
        .student-avatar {
          width: 50px;
          height: 50px;
          font-size: 20px;
          margin-right: 15px;
        }
        
        .student-details {
          h3 {
            font-size: 18px;
          }
        }
      }
      
      .summary-card {
        padding: 12px;
        
        .card-title {
          font-size: 12px;
        }
        
        .card-value {
          font-size: 20px;
        }
        
        .card-footer {
          font-size: 10px;
        }
      }
    }
  }
}
</style>
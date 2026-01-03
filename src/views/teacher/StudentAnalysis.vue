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
              <a-button v-if="selectedComparedExamId" @click="clearCompare">
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

      <!-- 成绩颜色说明 -->
      <div class="color-legend" style="margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
        <div class="legend-title" style="font-weight: 600; margin-bottom: 8px; color: #333;">成绩颜色说明：</div>
        <a-row :gutter="16">
          <a-col :xs="8" :sm="6" :md="4">
            <div class="legend-item">
              <span class="color-block" style="background-color: #52c41a;"></span>
              <span class="color-text">优秀成绩</span>
              <span class="color-desc">总分≥600/单科≥90</span>
            </div>
          </a-col>
          <a-col :xs="8" :sm="6" :md="4">
            <div class="legend-item">
              <span class="color-block" style="background-color: #1890ff;"></span>
              <span class="color-text">良好成绩</span>
              <span class="color-desc">总分≥500/单科≥80</span>
            </div>
          </a-col>
          <a-col :xs="8" :sm="6" :md="4">
            <div class="legend-item">
              <span class="color-block" style="background-color: #333;"></span>
              <span class="color-text">普通成绩</span>
              <span class="color-desc">总分<500/单科<80</span>
            </div>
          </a-col>
          <a-col :xs="8" :sm="6" :md="4">
            <div class="legend-item">
              <span class="color-block" style="background-color: #f5222d;"></span>
              <span class="color-text">顶尖排名</span>
              <span class="color-desc">前3名</span>
            </div>
          </a-col>
          <a-col :xs="8" :sm="6" :md="4">
            <div class="legend-item">
              <span class="color-block" style="background-color: #fa8c16;"></span>
              <span class="color-text">良好排名</span>
              <span class="color-desc">4-10名</span>
            </div>
          </a-col>
          <a-col :xs="8" :sm="6" :md="4">
            <div class="legend-item">
              <span class="color-block" style="background-color: #52c41a;"></span>
              <span class="color-text">正向差值 ⬆</span>
              <span class="color-desc">分数高/排名升</span>
            </div>
          </a-col>
          <a-col :xs="8" :sm="6" :md="4" v-if="!$isMobile">
            <div class="legend-item">
              <span class="color-block" style="background-color: #f5222d;"></span>
              <span class="color-text">负向差值 ⬇</span>
              <span class="color-desc">分数低/排名降</span>
            </div>
          </a-col>
        </a-row>
      </div>

      <!-- 核心：动态科目成绩汇总表格 -->
      <a-row :gutter="16" style="margin-top: 20px;">
        <a-col :span="24">
          <a-card title="成绩汇总分析" class="summary-table-card">
            <div class="table-container">
              <table class="score-summary-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>总分</th>
                    <!-- 动态渲染科目表头 -->
                    <th v-for="subject in displaySubjects" :key="subject.code">
                      {{ subject.name }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <!-- 成绩行 -->
                  <tr>
                    <td class="row-label">成绩</td>
                    <td :class="getScoreClass(totalScore, 'sum_')">{{ totalScore }}</td>
                    <!-- 动态渲染科目成绩 -->
                    <td v-for="subject in displaySubjects" :key="`score-${subject.code}`" 
                        :class="getScoreClass(getSubjectScore(subject.code), subject.code)">
                      {{ getSubjectScore(subject.code) }}
                    </td>
                  </tr>
                  <!-- 一本线行 -->
                  <tr>
                    <td class="row-label">一本线</td>
                    <td class="pass-line">{{ getSubjectPassLine('sum_') }}</td>
                    <!-- 动态渲染科目一本线 -->
                    <td v-for="subject in displaySubjects" :key="`pass-${subject.code}`" class="pass-line">
                      {{ getSubjectPassLine(subject.code) }}
                    </td>
                  </tr>
                  <!-- 线差行 -->
                  <tr>
                    <td class="row-label">线差</td>
                    <td :class="getDifferenceClass(totalScore - getSubjectPassLine('sum_'))">
                      {{ Math.abs(totalScore - getSubjectPassLine('sum_')).toFixed(1) }}
                      <span v-if="totalScore - getSubjectPassLine('sum_') > 0">⬆</span>
                      <span v-if="totalScore - getSubjectPassLine('sum_') < 0">⬇</span>
                    </td>
                    <!-- 动态渲染科目线差 -->
                    <td v-for="subject in displaySubjects" :key="`diff-${subject.code}`"
                        :class="getDifferenceClass(getSubjectScore(subject.code) - getSubjectPassLine(subject.code))">
                      {{ Math.abs(getSubjectScore(subject.code) - getSubjectPassLine(subject.code)).toFixed(1) }}
                      <span v-if="getSubjectScore(subject.code) - getSubjectPassLine(subject.code) > 0">⬆</span>
                      <span v-if="getSubjectScore(subject.code) - getSubjectPassLine(subject.code) < 0">⬇</span>
                    </td>
                  </tr>
                  <!-- 班次（班级排名）行 -->
                  <tr>
                    <td class="row-label">班次</td>
                    <td :class="getRankClass(totalClassRank)">{{ totalClassRank }}</td>
                    <!-- 动态渲染科目班级排名 -->
                    <td v-for="subject in displaySubjects" :key="`classRank-${subject.code}`"
                        :class="getRankClass(getSubjectClassRank(subject.code))">
                      {{ getSubjectClassRank(subject.code) }}
                    </td>
                  </tr>
                  <!-- 段次（年级排名）行 -->
                  <tr>
                    <td class="row-label">段次</td>
                    <td :class="getRankClass(totalGradeRank)">{{ totalGradeRank }}</td>
                    <!-- 动态渲染科目年级排名 -->
                    <td v-for="subject in displaySubjects" :key="`gradeRank-${subject.code}`"
                        :class="getRankClass(getSubjectGradeRank(subject.code))">
                      {{ getSubjectGradeRank(subject.code) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
                    {{ formatScore(Math.abs(record.scoreDiff)) }}
                    <span v-if="record.scoreDiff > 0">⬆</span>
                    <span v-if="record.scoreDiff < 0">⬇</span>
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
                    {{ Math.abs(record.classRankDiff) }}
                    <span v-if="record.classRankDiff < 0">⬆</span>
                    <span v-if="record.classRankDiff > 0">⬇</span>
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
                    {{ Math.abs(record.gradeRankDiff) }}
                    <span v-if="record.gradeRankDiff < 0">⬆</span>
                    <span v-if="record.gradeRankDiff > 0">⬇</span>
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
            <a-card title="排名分布图" class="chart-card">
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
import { ref, onMounted, computed, watch } from 'vue';
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

// 扩展科目类型定义
interface SubjectItem {
  code: string; // 科目编码（如yuwen、shuxue）
  name: string; // 科目名称（如语文、数学）
}

// 完整科目映射
const allSubjectMap: Record<string, string> = {
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
const examMap = ref<Record<number, string>>({}); 
const scoreDetails = ref<any>({});
const passLineDetails = ref<any>({});
const compareData = ref<any>(null); // 存储对比数据

// 选择状态
const selectedStudentId = ref<string>('');
const selectedExamId = ref<number>(0);
const selectedComparedExamId = ref<number | undefined>(undefined);

// 学号脱敏处理：只显示后四位，前面用*表示
const maskStudentId = (id: string) => {
  if (!id) return '';
  if (id.length <= 4) return id; // 如果学号长度小于等于4位，不脱敏
  return '*'.repeat(id.length - 4) + id.slice(-4);
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

const getPreviousExamId = computed(() => {
  if (examList.value.length >= 2) {
    return examList.value[examList.value.length - 2].id;
  }
  return undefined;
});

// 当前考试信息
const currentExamInfo = computed(() => {
  const exam = examList.value.find(e => e.id === selectedExamId.value);
  return exam || { id: 0, name: '' };
});

const displaySubjects = computed<SubjectItem[]>(() => {
  if (!selectedStudentId.value || !selectedExamId.value) return [];
  
  const scoreDetail = scoreDetails.value[selectedExamId.value];
  if (!scoreDetail) return [];
  
  // 筛选出有成绩、班级排名和年级排名的科目
  const validSubjects = Object.keys(allSubjectMap)
    .filter(code => {
      // 排除总分，只保留单科
      if (code === 'sum_') return false;
      
      // 获取成绩和排名数据
      const score = scoreDetail[code];
      const classRank = scoreDetail[`${code}b`];
      const gradeRank = scoreDetail[`${code}d`];
      
      // 只保留成绩、班级排名和年级排名都存在且不为null的科目
      return score !== null && score !== undefined && 
             classRank !== null && classRank !== undefined && 
             gradeRank !== null && gradeRank !== undefined;
    })
    .map(code => ({
      code,
      name: allSubjectMap[code] || code
    }));
  
  return validSubjects;
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

// 及格率相关计算
const passSubjectCount = computed(() => {
  return filteredScoreData.value.filter(item => item.score >= 60).length;
});

const subjectCount = computed(() => {
  return filteredScoreData.value.length;
});

const passRate = computed(() => {
  if (subjectCount.value === 0) return 0;
  return ((passSubjectCount.value / subjectCount.value) * 100).toFixed(0);
});

// 获取单科成绩
const getSubjectScore = (subject: string) => {
  const detail = scoreDetails.value[selectedExamId.value];
  return detail ? detail[subject] || 0 : 0;
};

// 获取单科一本线
const getSubjectPassLine = (subject: string) => {
  const detail = passLineDetails.value[selectedExamId.value];
  return detail ? detail[subject] || 0 : 0;
};

// 获取单科班级排名
const getSubjectClassRank = (subject: string) => {
  const detail = scoreDetails.value[selectedExamId.value];
  return detail ? detail[`${subject}b`] || 0 : 0;
};

// 获取单科年级排名
const getSubjectGradeRank = (subject: string) => {
  const detail = scoreDetails.value[selectedExamId.value];
  return detail ? detail[`${subject}d`] || 0 : 0;
};

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

// 原始成绩数据
const rawScoreData = computed<ScoreDetail[]>(() => {
  if (!selectedStudentId.value || !selectedExamId.value) return [];
  
  const data: ScoreDetail[] = [];
  const scoreDetail = scoreDetails.value[selectedExamId.value];
  
  if (!scoreDetail) return [];
  
  // 遍历所有可能的科目
  Object.keys(allSubjectMap).forEach(subject => {
    if (subject === 'sum_') return;
    
    const score = scoreDetail[subject];
    const classRank = scoreDetail[`${subject}b`];
    const gradeRank = scoreDetail[`${subject}d`];
    
    // 只添加成绩、班级排名和年级排名都存在的科目
    if (score !== null && score !== undefined && 
        classRank !== null && classRank !== undefined && 
        gradeRank !== null && gradeRank !== undefined) {
      data.push({
        subject,
        subjectName: allSubjectMap[subject],
        score: score || 0,
        classRank: classRank || 0,
        gradeRank: gradeRank || 0
      });
    }
  });
  
  return data;
});

// 获取差值类名（线差专用）
const getDifferenceClass = (difference: number) => {
  if (difference > 0) {
    return 'positive-difference'; // 正数绿色
  } else if (difference < 0) {
    return 'negative-difference'; // 负数红色
  }
  return ''; 
};

const filteredScoreData = computed<ScoreDetail[]>(() => {
  return rawScoreData.value;
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
  
  // 添加有完整数据的科目成绩
  Object.keys(allSubjectMap).forEach(subject => {
    if (subject === 'sum_') return; // 排除总分
    
    const subjectData = compareDataValue[subject];
    if (!subjectData) return;
    
    const classRankKey = `${subject}b`;
    const gradeRankKey = `${subject}d`;
    
    // 检查是否有完整的对比数据
    if (compareDataValue[classRankKey] && compareDataValue[gradeRankKey]) {
      data.push({
        subject,
        subjectName: allSubjectMap[subject],
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

// 成绩图表选项（只展示有完整数据的科目）
const scoreChartOption = computed(() => {
  const subjects = filteredScoreData.value.map(item => item.subjectName);
  const scores = filteredScoreData.value.map(item => item.score);
  
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

// 排名图表选项（只展示有完整数据的科目）
const rankChartOption = computed(() => {
  const subjects = filteredScoreData.value.map(item => item.subjectName);
  const classRanks = filteredScoreData.value.map(item => item.classRank);
  const gradeRanks = filteredScoreData.value.map(item => item.gradeRank);
  
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
    filteredStudentList.value = [...studentList.value];
    return;
  }
  
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


// 获取排名差值类名（排名越小越好，所以正数表示下降，负数表示上升）
const getRankDifferenceClass = (difference: number) => {
  return difference > 0 ? 'rank-down' : difference < 0 ? 'rank-up' : 'rank-same';
};

// 格式化分数，保留一位小数
const formatScore = (score: number) => {
  return Number.isInteger(score) ? score : score.toFixed(1);
};

// 自动设置对比考试为上一次考试
const autoSetComparedExam = async () => {
  if (!selectedStudentId.value || !selectedExamId.value) return;
  
  const previousExamId = getPreviousExamId.value;
  if (previousExamId && previousExamId !== selectedComparedExamId.value) {
    selectedComparedExamId.value = previousExamId;
    await fetchCompareData(selectedStudentId.value, selectedExamId.value, previousExamId);
  }
};

// 监听考试选择变化，自动设置对比考试
watch([selectedExamId, selectedStudentId], async () => {
  if (selectedStudentId.value && selectedExamId.value) {
    await autoSetComparedExam();
  }
}, { immediate: true });

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
      studentList.value = res.data.map((student: any) => ({
        student_id: student.uid,
        student_name: student.name
      }));
      
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
        // 默认选中最后一个考试
        selectedExamId.value = examDetails[examDetails.length - 1].id;
        
        // 如果已经有选中的学生，获取该学生的考试成绩
        if (selectedStudentId.value) {
          await fetchStudentGrades(selectedStudentId.value, selectedExamId.value);
          await fetchPassLine(selectedExamId.value);
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
  selectedComparedExamId.value = undefined; // 重置对比考试选择
 
  // 获取该学生的考试成绩和分数线
  if (selectedExamId.value) {
    await Promise.all([
      fetchStudentGrades(studentId, selectedExamId.value),
      fetchPassLine(selectedExamId.value)
    ]);
    
    // 自动设置对比考试
    await autoSetComparedExam();
  }
};

// 处理考试选择
const handleExamChange = async (examId: number) => {
  selectedExamId.value = examId;
  // 清空对比数据
  compareData.value = null;
  selectedComparedExamId.value = undefined;
  
  // 获取成绩详情和分数线
  if (selectedStudentId.value) {
    await Promise.all([
      fetchStudentGrades(selectedStudentId.value, examId),
      fetchPassLine(examId)
    ]);
    
    // 自动设置对比考试
    await autoSetComparedExam();
  }
};

// 重置筛选
const resetFilters = () => {
  selectedStudentId.value = '';
  selectedExamId.value = examList.value.length > 0 ? examList.value[0].id : 0;
  selectedComparedExamId.value = undefined;
  scoreDetails.value = {};
  passLineDetails.value = {};
  compareData.value = null;
  searchKeyword.value = '';
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

const clearCompare = () => {
  selectedComparedExamId.value = undefined;
  compareData.value = null;
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
  
  .summary-table-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    
    :deep(.ant-card-head) {
      background: linear-gradient(180deg, #f0f5ff 0%, #e6f0ff 100%);
      border-bottom: 1px solid #e8e8e8;
      padding: 0 16px;
      
      .ant-card-head-title {
        font-weight: 600;
        color: #333;
      }
    }
  }
  
  .score-summary-table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    background: #fff;

    th, td {
      padding: 12px 15px;
      text-align: center;
      border: 1px solid #e8e8e8;
      transition: all 0.2s ease;
    }

    th {
      background: linear-gradient(180deg, #f0f5ff 0%, #e6f0ff 100%);
      font-weight: 600;
      color: #333;
      position: relative;
      white-space: nowrap;
    }

    th:first-child {
      width: 120px;
    }

    tr:nth-child(even) {
      background-color: #fafafa;
    }

    tr:hover td {
      background-color: #f5f7fa;
    }

    .row-label {
      font-weight: 600;
      color: #333;
      background-color: #ffffff;
      white-space: nowrap;
    }

    td {
      font-size: 14px;
    }

    td:first-child {
      font-weight: 500;
    }
  }
  
  .score-card, .passline-card, .chart-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    
    :deep(.ant-card-head) {
      background: linear-gradient(180deg, #f0f5ff 0%, #e6f0ff 100%);
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
  
  // 颜色说明样式
  .color-legend {
    .legend-title {
      font-size: 14px;
      text-align: left;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
      font-size: 12px;
      
      .color-block {
        width: 16px;
        height: 16px;
        border-radius: 4px;
        margin-right: 8px;
        display: inline-block;
      }
      
      .color-text {
        margin-right: 6px;
        font-weight: 500;
        min-width: 60px;
      }
      
      .color-desc {
        color: #999;
      }
    }
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
      background: linear-gradient(180deg, #f0f5ff 0%, #e6f0ff 100%);
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
    
    :deep(.ant-table) {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      
      .ant-table-thead > tr > th {
        background: linear-gradient(180deg, #f0f5ff 0%, #e6f0ff 100%);
        font-weight: 600;
        color: #333;
        border-bottom: 1px solid #e8e8e8;
      }
      
      .ant-table-tbody > tr:hover > td {
        background-color: #f5f7fa;
      }
      
      .ant-table-tbody > tr:nth-child(even) {
        background-color: #fafafa;
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
      
      .color-legend {
        .legend-item {
          flex-wrap: wrap;
          
          .color-text {
            min-width: 40px;
          }
          
          .color-desc {
            display: none;
          }
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
    .score-summary-table {
      th, td {
        padding: 8px 5px;
        font-size: 12px;
      }
      
      th:first-child {
        width: 80px;
      }
    }
  }
}
</style>
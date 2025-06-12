<template>
  <div class="student-analysis-page">
    <a-button class="back-button" @click="goBack">返回</a-button>
    <h2>学生分析</h2>
    <div class="tables-container" v-if="!isLoading">
      <!-- 考试统计表格区域 -->
      <div class="table-section">
        <h2>考试统计 <span class="total-exams">共统计{{ examStats.totalExams }}场考试</span></h2>
        <p class="description">说明：一本率低于60%为<span style="color: red;">红色</span>，在60%到80%之间为<span style="color: orange;">橙色</span>。</p>
        <a-table
          :columns="examStatsColumns"
          :data-source="examStatsData"
          :pagination="false"
          size="middle"
          bordered
        />
      </div>

      <!-- 本次考试表格区域 -->
      <div class="table-section">
        <h2>本次考试 <span class="exam-date">{{ currentExamData.examDate }}</span></h2>
        <p class="description">说明：<span style="color: red;">红色</span>表明较上次考试退步的名次，<span style="color: green;">绿色</span>表明较上次考试进步的名次。</p>
        <a-table
          :columns="currentExamColumns"
          :data-source="currentExamTableData"
          :pagination="false"
          size="middle"
          bordered
        />
      </div>
    </div>

    <!-- 能力六边形图表区域 -->
    <div class="chart-container" v-if="!isLoading">
      <h2>一本能力值</h2>
      <a-card>
        <v-chart class="radar-chart" :option="chartOption" autoresize />
      </a-card>
      <div class="description">综合分析：本次考试总分较上次考试退步，语文、数学、外语、{{ dynamicSubjectNames.historyPhysics }}、{{ dynamicSubjectNames.politicsChemistry }}、{{ dynamicSubjectNames.geographyBiology }}均较上次考试退步。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import { Button as AButton, Table as ATable, Card as ACard } from 'ant-design-vue';
import type { ColumnType } from 'ant-design-vue/es/table';
import VChart from 'vue-echarts';
import { useUserStore } from '@/store';
import api from '@/servers/api';

const router = useRouter();
const userStore = useUserStore();

console.log('User store info at component setup:', userStore.userInfo);

// 加载状态
const isLoading = ref(true);

// 学生信息状态
const studentInfo = ref({
  name: '',
  uid: '',
  school_id: '',
  class_id: '',
  subject_selection_id: null as number | null
});

// 成绩统计状态
const examStats = ref({
  totalExams: 0,
  subjects: {
    total: { passCount: 0, passRate: 0 },
    chinese: { passCount: 0, passRate: 0 },
    math: { passCount: 0, passRate: 0 },
    english: { passCount: 0, passRate: 0 },
    physics: { passCount: 0, passRate: 0 },
    chemistry: { passCount: 0, passRate: 0 },
    biology: { passCount: 0, passRate: 0 }
  }
});

// 本次考试数据状态
const currentExamData = ref({
  examDate: '',
  totalRankChangeClass: null as number | null,
  totalRankChangeSegment: null as number | null,
  totalPassLine: false,
  subjects: {
    chinese: { rankChangeClass: null as number | null, rankChangeSegment: null as number | null, passLine: false },
    math: { rankChangeClass: null as number | null, rankChangeSegment: null as number | null, passLine: false },
    english: { rankChangeClass: null as number | null, rankChangeSegment: null as number | null, passLine: false },
    physics: { rankChangeClass: null as number | null, rankChangeSegment: null as number | null, passLine: false },
    chemistry: { rankChangeClass: null as number | null, rankChangeSegment: null as number | null, passLine: false },
    biology: { rankChangeClass: null as number | null, rankChangeSegment: null as number | null, passLine: false },
    // 对应页面中的历史/物理，政治/化学，地理/生物
    historyPhysics: { rankChangeClass: null as number | null, rankChangeSegment: null as number | null, passLine: false },
    politicsChemistry: { rankChangeClass: null as number | null, rankChangeSegment: null as number | null, passLine: false },
    geographyBiology: { rankChangeClass: null as number | null, rankChangeSegment: null as number | null, passLine: false },
  }
});

// 根据选科动态确定科目名称
const dynamicSubjectNames = computed(() => {
  const subjectSelection = studentInfo.value.subject_selection_id; // assuming 0 for liberal arts, 1 for science
  console.log('dynamicSubjectNames - typeof subjectSelection:', typeof subjectSelection, 'value:', subjectSelection);
  if (subjectSelection === 0) { // 文科
    return {
      historyPhysics: '历史',
      politicsChemistry: '政治',
      geographyBiology: '地理'
    };
  } else if (subjectSelection === 1) { // 理科
    return {
      historyPhysics: '物理',
      politicsChemistry: '化学',
      geographyBiology: '生物'
    };
  } else {
    // Default or handle unexpected values
    return {
      historyPhysics: '历史/物理',
      politicsChemistry: '政治/化学',
      geographyBiology: '地理/生物'
    };
  }
});

// Initial default max values for radar indicators
const radarMaxValues = ref([1, 1, 1, 1, 1, 1]); // Corresponding to Chinese, Math, English, Hist/Phy, Pol/Chem, Geo/Bio

// ECharts 雷达图配置 (Computed property)
const chartOption = computed(() => {
  return {
    radar: {
      indicator: [
        { name: '语文', max: radarMaxValues.value[0] },
        { name: '数学', max: radarMaxValues.value[1] },
        { name: '外语', max: radarMaxValues.value[2] },
        { name: dynamicSubjectNames.value.historyPhysics, max: radarMaxValues.value[3] },
        { name: dynamicSubjectNames.value.politicsChemistry, max: radarMaxValues.value[4] },
        { name: dynamicSubjectNames.value.geographyBiology, max: radarMaxValues.value[5] }
      ]
    },
    series: [
      {
        name: '能力值',
        type: 'radar',
        data: [
          { value: [0, 0, 0, 0, 0, 0], name: '学生成绩' } // Initial data, will be updated by fetchCurrentExamData
        ]
      }
    ]
  };
});

// 考试统计表格列定义
const examStatsColumns: ColumnType[] = [
  {
    title: '科目',
    dataIndex: 'subject',
    key: 'subject',
  },
  {
    title: '一本进线次数',
    dataIndex: 'passCount',
    key: 'passCount',
  },
  {
    title: '一本进线率',
    dataIndex: 'passRate',
    key: 'passRate',
    customRender: ({ text }: { text: number }) => {
      return formatPassRate(text);
    },
    customCell: ({ text }: { text: number }) => {
      const rate = Number(text) * 100; // 转换为百分比，并确保是数字
      let color = 'rgba(0, 0, 0, 0.85)'; // Default color
      if (isNaN(rate)) {
        color = 'rgba(0, 0, 0, 0.85)'; // Fallback to black for invalid data
      } else if (rate < 60) {
        color = '#f5222d'; // Red
      } else if (rate >= 60 && rate < 80) {
        color = 'orange'; // Orange
      } else {
        color = '#52c41a'; // Green
      }
      return { style: { color } };
    }
  }
];

// 本次考试表格列定义
const currentExamColumns: ColumnType[] = [
  {
    title: '科目',
    dataIndex: 'subject',
    key: 'subject',
  },
  {
    title: '进退班次',
    dataIndex: 'rankChangeClass',
    key: 'rankChangeClass',
    customRender: ({ text }: { text: number | null }) => {
      if (text === null || text === undefined) {
        return '无数据';
      }
      return text > 0 ? `+${text}` : String(text);
    },
    customCell: ({ text }: { text: number | null }) => {
      const numericText = Number(text); // 显式转换为数字
      if (text === null || text === undefined || isNaN(numericText)) {
        return { style: { color: 'rgba(0, 0, 0, 0.85)' } }; // Fallback to black for invalid data
      }
      const color = numericText > 0 ? '#52c41a' : numericText < 0 ? '#f5222d' : 'rgba(0, 0, 0, 0.85)';
      return { style: { color } };
    }
  },
  {
    title: '进退段次',
    dataIndex: 'rankChangeSegment',
    key: 'rankChangeSegment',
    customRender: ({ text }: { text: number | null }) => {
      if (text === null || text === undefined) {
        return '无数据';
      }
      return text > 0 ? `+${text}` : String(text);
    },
    customCell: ({ text }: { text: number | null }) => {
      const numericText = Number(text); // 显式转换为数字
      if (text === null || text === undefined || isNaN(numericText)) {
        return { style: { color: 'rgba(0, 0, 0, 0.85)' } }; // Fallback to black for invalid data
      }
      const color = numericText > 0 ? '#52c41a' : numericText < 0 ? '#f5222d' : 'rgba(0, 0, 0, 0.85)';
      return { style: { color } };
    }
  },
  {
    title: '是否过线',
    dataIndex: 'passLine',
    key: 'passLine',
    customRender: ({ text }: { text: boolean }) => {
      return formatPassLine(text);
    },
    customCell: ({ text }: { text: boolean }) => {
      const color = text ? '#52c41a' : '#f5222d'; // Green for true, Red for false
      return { style: { color } };
    }
  }
];

// 计算考试统计数据
const examStatsData = computed(() => {
  return [
    {
      key: 'total',
      subject: '总分',
      passCount: examStats.value.subjects.total.passCount,
      passRate: examStats.value.subjects.total.passRate
    },
    {
      key: 'chinese',
      subject: '语文',
      passCount: examStats.value.subjects.chinese.passCount,
      passRate: examStats.value.subjects.chinese.passRate
    },
    {
      key: 'math',
      subject: '数学',
      passCount: examStats.value.subjects.math.passCount,
      passRate: examStats.value.subjects.math.passRate
    },
    {
      key: 'english',
      subject: '外语',
      passCount: examStats.value.subjects.english.passCount,
      passRate: examStats.value.subjects.english.passRate
    },
    {
      key: 'physics',
      subject: dynamicSubjectNames.value.historyPhysics,
      passCount: examStats.value.subjects.physics.passCount,
      passRate: examStats.value.subjects.physics.passRate
    },
    {
      key: 'chemistry',
      subject: dynamicSubjectNames.value.politicsChemistry,
      passCount: examStats.value.subjects.chemistry.passCount,
      passRate: examStats.value.subjects.chemistry.passRate
    },
    {
      key: 'biology',
      subject: dynamicSubjectNames.value.geographyBiology,
      passCount: examStats.value.subjects.biology.passCount,
      passRate: examStats.value.subjects.biology.passRate
    }
  ];
});

// 计算本次考试数据
const currentExamTableData = computed(() => {
  return [
    {
      key: 'total',
      subject: '总分',
      rankChangeClass: currentExamData.value.totalRankChangeClass,
      rankChangeSegment: currentExamData.value.totalRankChangeSegment,
      passLine: currentExamData.value.totalPassLine
    },
    {
      key: 'chinese',
      subject: '语文',
      rankChangeClass: currentExamData.value.subjects.chinese.rankChangeClass,
      rankChangeSegment: currentExamData.value.subjects.chinese.rankChangeSegment,
      passLine: currentExamData.value.subjects.chinese.passLine
    },
    {
      key: 'math',
      subject: '数学',
      rankChangeClass: currentExamData.value.subjects.math.rankChangeClass,
      rankChangeSegment: currentExamData.value.subjects.math.rankChangeSegment,
      passLine: currentExamData.value.subjects.math.passLine
    },
    {
      key: 'english',
      subject: '外语',
      rankChangeClass: currentExamData.value.subjects.english.rankChangeClass,
      rankChangeSegment: currentExamData.value.subjects.english.rankChangeSegment,
      passLine: currentExamData.value.subjects.english.passLine
    },
    {
      key: 'historyPhysics',
      subject: dynamicSubjectNames.value.historyPhysics,
      rankChangeClass: currentExamData.value.subjects.historyPhysics.rankChangeClass,
      rankChangeSegment: currentExamData.value.subjects.historyPhysics.rankChangeSegment,
      passLine: currentExamData.value.subjects.historyPhysics.passLine
    },
    {
      key: 'politicsChemistry',
      subject: dynamicSubjectNames.value.politicsChemistry,
      rankChangeClass: currentExamData.value.subjects.politicsChemistry.rankChangeClass,
      rankChangeSegment: currentExamData.value.subjects.politicsChemistry.rankChangeSegment,
      passLine: currentExamData.value.subjects.politicsChemistry.passLine
    },
    {
      key: 'geographyBiology',
      subject: dynamicSubjectNames.value.geographyBiology,
      rankChangeClass: currentExamData.value.subjects.geographyBiology.rankChangeClass,
      rankChangeSegment: currentExamData.value.subjects.geographyBiology.rankChangeSegment,
      passLine: currentExamData.value.subjects.geographyBiology.passLine
    }
  ];
});

// 获取学生信息
const fetchStudentInfo = async () => {
  console.log('开始获取学生信息...');
  try {
    // 使用 Pinia store 中的用户信息
    const userInfo = userStore.userInfo;
    console.log('从 Pinia store 获取到的用户信息:', userInfo);

    // 假设 student_uid 对应的是 userInfo.role
    let studentId = userInfo.role;

    if (!studentId) {
      console.warn('Pinia store 中没有找到有效的用户角色ID，无法获取学生信息。', userInfo);
      isLoading.value = false;
      return;
    }

    // 确保 studentId 是字符串，因为数据库中的uid是VARCHAR
    if (typeof studentId !== 'string') {
        studentId = String(studentId);
    }

    console.log('将使用学生UID (来自role字段):', studentId);

    const studentDetail = await api.student.getStudentDetailApi({
      student_uid: studentId as string // 断言为 string
    });
    console.log('获取到学生详情:', studentDetail);

    // 确保 studentDetail 存在且 data 数组不为空
    if (!studentDetail || !studentDetail.data || studentDetail.data.length === 0) {
      console.warn('getStudentDetailApi did not return valid student detail data.');
      isLoading.value = false; // Ensure loading state is false if no detail
      return;
    }

    const actualStudentData = studentDetail.data[0]; // 获取 data 数组中的第一个学生对象
    console.log('实际学生数据:', actualStudentData);

    studentInfo.value = {
      name: actualStudentData.name || '',
      uid: actualStudentData.uid || '',
      school_id: actualStudentData.school_id || '',
      class_id: actualStudentData.class_id || '',
      subject_selection_id: Number(actualStudentData.subject_selection_id) // 确保转换为数字
    };
    console.log('学生信息已更新:', studentInfo.value);
    console.log('学生选科ID (subject_selection_id): ', studentInfo.value.subject_selection_id);
    console.log('typeof studentInfo.value.subject_selection_id:', typeof studentInfo.value.subject_selection_id);
    
    // 只有当 studentInfo.value.uid 有效时才继续获取考试统计和本次考试数据
    if (studentInfo.value.uid) {
      await Promise.all([
        fetchExamStats(),
        fetchCurrentExamData()
      ]);
    } else {
      console.warn('学生详情中的UID无效，无法获取考试统计和本次考试数据。');
      isLoading.value = false;
    }

  } catch (error) {
    console.error('获取学生信息失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
  } finally {
    isLoading.value = false;
    console.log('加载状态设置为:', isLoading.value);
  }
};

// 获取成绩统计数据
const fetchExamStats = async () => {
  console.log('开始获取成绩统计数据...');
  try {
    if (!studentInfo.value.uid) {
      console.warn('学生UID未定义，无法获取成绩统计数据。');
      return;
    }
    
    console.log('学生UID:', studentInfo.value.uid); // Add this log

    // 1. 获取学生的所有考试记录 (用于确定 nums 参数，如果后端需要)
    console.log('正在调用 getStudentExamApi，参数:', { student_uid: studentInfo.value.uid });
    const studentExamsResponse = await api.student.getStudentExamApi({
      student_uid: studentInfo.value.uid
    });
    console.log('getStudentExamApi 响应数据 (完整):', studentExamsResponse); // NEW LOG: Full response
    console.log('getStudentExamApi 响应数据.data (具体):', studentExamsResponse.data); // NEW LOG: Just data

    const studentExams = studentExamsResponse.data; 
    console.log('studentExams (after .data access):', studentExams); // Add this log
    console.log('Array.isArray(studentExams) before if:', Array.isArray(studentExams)); // NEW LOG
    console.log('studentExams.length before if:', studentExams?.length); // NEW LOG

    if (!studentExams || studentExams.length === 0) {
      console.warn('没有找到考试记录');
      // 如果没有考试记录，将统计数据重置为0
      examStats.value = {
        totalExams: 0,
        subjects: {
          total: { passCount: 0, passRate: 0 },
          chinese: { passCount: 0, passRate: 0 },
          math: { passCount: 0, passRate: 0 },
          english: { passCount: 0, passRate: 0 },
          physics: { passCount: 0, passRate: 0 },
          chemistry: { passCount: 0, passRate: 0 },
          biology: { passCount: 0, passRate: 0 }
        }
      };
      return;
    }

    // 调用 getPassLineAnalysis 获取所有考试的一本线分析数据
    // 使用 studentExams.length 作为 nums 参数，以获取所有已获取的考试的分析数据
    console.log('正在调用 getPassLineAnalysis，参数:', {
      student_id: Number(studentInfo.value.uid),
      nums: studentExams.length
    });
    const passLineAnalysisResponse = await api.analysis.getPassLineAnalysis({
      student_id: Number(studentInfo.value.uid),
      nums: studentExams.length
    });
    console.log('getPassLineAnalysis 响应数据:', passLineAnalysisResponse);
    console.log('getPassLineAnalysis.data:', passLineAnalysisResponse.data);

    // 初始化统计数据
    const stats = {
      totalExams: 0,
      subjects: {
        total: { passCount: 0, passRate: 0 },
        chinese: { passCount: 0, passRate: 0 },
        math: { passCount: 0, passRate: 0 },
        english: { passCount: 0, passRate: 0 },
        physics: { passCount: 0, passRate: 0 },
        chemistry: { passCount: 0, passRate: 0 },
        biology: { passCount: 0, passRate: 0 }
      }
    };

    // 处理 getPassLineAnalysis 的响应数据
    if (passLineAnalysisResponse && typeof passLineAnalysisResponse.data === 'object' && passLineAnalysisResponse.data !== null) {
      const analysisData = JSON.parse(JSON.stringify(passLineAnalysisResponse.data)); // 深度克隆以确保数据稳定

      console.log('analysisData (after getPassLineAnalysis response and JSON parse):', analysisData);
      console.log('Direct access to analysisData.sum:', analysisData.sum);
      console.log('Direct access to analysisData.sum.total_count:', analysisData.sum?.total_count);
      console.log('studentExams (just before totalExams assignment):', studentExams); // NEW LOG: Re-check studentExams here
      // 更新总考试次数
      stats.totalExams = studentExams.length; // 使用 studentExams.length 来设置总考试次数
      console.log('stats.totalExams after assignment:', stats.totalExams);

      // 更新总分统计
      stats.subjects.total.passCount = analysisData.sum?.pass_count || 0;
      stats.subjects.total.passRate = parseFloat(analysisData.sum?.pass_rate || '0') / 100;

      // 更新各科统计
      stats.subjects.chinese.passCount = analysisData.Yuwen?.pass_count || 0;
      stats.subjects.chinese.passRate = parseFloat(analysisData.Yuwen?.pass_rate || '0') / 100;

      stats.subjects.math.passCount = analysisData.Shuxue?.pass_count || 0;
      stats.subjects.math.passRate = parseFloat(analysisData.Shuxue?.pass_rate || '0') / 100;

      stats.subjects.english.passCount = analysisData.Yingyu?.pass_count || 0;
      stats.subjects.english.passRate = parseFloat(analysisData.Yingyu?.pass_rate || '0') / 100;

      // 处理组合科目：历史/物理
      stats.subjects.physics.passCount = (analysisData.Wuli?.pass_count || 0) + (analysisData.Lishi?.pass_count || 0);
      stats.subjects.physics.passRate = stats.totalExams > 0 ? (stats.subjects.physics.passCount / stats.totalExams) : 0;
      console.log('Physics passCount:', stats.subjects.physics.passCount, 'passRate:', stats.subjects.physics.passRate);
      console.log('Physics passRate calculated:', stats.subjects.physics.passRate); // NEW LOG

      // 处理组合科目：政治/化学
      stats.subjects.chemistry.passCount = (analysisData.Huaxue?.pass_count || 0) + (analysisData.Zhengzhi?.pass_count || 0);
      stats.subjects.chemistry.passRate = stats.totalExams > 0 ? (stats.subjects.chemistry.passCount / stats.totalExams) : 0;
      console.log('Chemistry passCount:', stats.subjects.chemistry.passCount, 'passRate:', stats.subjects.chemistry.passRate);
      console.log('Chemistry passRate calculated:', stats.subjects.chemistry.passRate); // NEW LOG

      // 处理组合科目：地理/生物
      stats.subjects.biology.passCount = (analysisData.Shengwu?.pass_count || 0) + (analysisData.Dili?.pass_count || 0);
      stats.subjects.biology.passRate = stats.totalExams > 0 ? (stats.subjects.biology.passCount / stats.totalExams) : 0;
      console.log('Biology passCount:', stats.subjects.biology.passCount, 'passRate:', stats.subjects.biology.passRate);
      console.log('Biology passRate calculated:', stats.subjects.biology.passRate); // NEW LOG

    } else {
      console.warn('getPassLineAnalysis did not return valid data or returned null/undefined:', passLineAnalysisResponse);
    }

    // 更新状态
    console.log('stats object before examStats.value assignment:', stats); // NEW LOG
    examStats.value = stats;
    console.log('最终统计数据:', examStats.value);
    console.log('examStats.value.totalExams (final):', examStats.value.totalExams);
    console.log('examStats.value.subjects (final):', examStats.value.subjects);
    console.log('examStats.value.subjects (final state after fetchExamStats):', examStats.value.subjects); // NEW LOG

  } catch (error) {
    console.error('获取成绩统计数据失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
  }
};

// 获取本次考试数据
const fetchCurrentExamData = async () => {
  console.log('开始获取本次考试数据...');
  try {
    if (!studentInfo.value.uid) {
      console.warn('学生UID未定义，无法获取本次考试数据。');
      return;
    }

    // 1. 获取学生的考试记录，找出最新一次考试
    const studentExamsResponse = await api.student.getStudentExamApi({
      student_uid: studentInfo.value.uid
    });
    console.log('获取到学生考试记录原始数据:', studentExamsResponse);

    const studentExams = studentExamsResponse.data; // 直接获取 data 数组

    if (!studentExams || studentExams.length === 0) {
      console.warn('getStudentExamApi did not return any student exams or returned null/undefined.');
      // It's crucial to ensure currentExamData is initialized to prevent errors if no exams are found
      currentExamData.value = {
        examDate: '无考试数据',
        totalRankChangeClass: null,
        totalRankChangeSegment: null,
        totalPassLine: false,
        subjects: {
          chinese: { rankChangeClass: null, rankChangeSegment: null, passLine: false },
          math: { rankChangeClass: null, rankChangeSegment: null, passLine: false },
          english: { rankChangeClass: null, rankChangeSegment: null, passLine: false },
          physics: { rankChangeClass: null, rankChangeSegment: null, passLine: false },
          chemistry: { rankChangeClass: null, rankChangeSegment: null, passLine: false },
          biology: { rankChangeClass: null, rankChangeSegment: null, passLine: false },
          historyPhysics: { rankChangeClass: null, rankChangeSegment: null, passLine: false },
          politicsChemistry: { rankChangeClass: null, rankChangeSegment: null, passLine: false },
          geographyBiology: { rankChangeClass: null, rankChangeSegment: null, passLine: false },
        }
      };
      // Also clear radar chart data if no exams
      chartOption.value.series[0].data[0].value = [0, 0, 0, 0, 0, 0];
      return;
    }

    // 获取最新考试数据：注意 studentExams 是一个数组的数组，所以需要访问 studentExams[0][0]
    const latestExamObj = studentExams[0]?.[0]; 
    
    console.log('dynamicSubjectNames.value at start of fetchCurrentExamData:', dynamicSubjectNames.value);
    if (!latestExamObj) {
        console.warn('没有找到最新考试信息对象。');
        return;
    }

    // *** START FIX FOR NaN exam_id ***
    const examId = Number(latestExamObj.id);
    console.log('Parsed examId:', examId, 'from latestExamObj.id:', latestExamObj.id);

    if (isNaN(examId)) {
        console.warn('最新考试的ID无效 (NaN)，无法获取一本线和成绩数据。', latestExamObj);
        // Set currentExamData to '无数据' if examId is invalid
        currentExamData.value.examDate = latestExamObj.name || '未知考试';
        currentExamData.value.totalRankChangeClass = null;
        currentExamData.value.totalRankChangeSegment = null;
        currentExamData.value.totalPassLine = false;
        Object.values(currentExamData.value.subjects).forEach(subject => {
            subject.rankChangeClass = null;
            subject.rankChangeSegment = null;
            subject.passLine = false;
        });
        // Update radar chart indicator names for no exam data
        chartOption.value.radar.indicator[0].name = '语文';
        chartOption.value.radar.indicator[1].name = '数学';
        chartOption.value.radar.indicator[2].name = '外语';
        chartOption.value.radar.indicator[3].name = dynamicSubjectNames.value.historyPhysics;
        chartOption.value.radar.indicator[4].name = dynamicSubjectNames.value.politicsChemistry;
        chartOption.value.radar.indicator[5].name = dynamicSubjectNames.value.geographyBiology;

        chartOption.value.series[0].data[0].value = [0, 0, 0, 0, 0, 0];
        return; // Exit early as dependent API calls will fail
    }
    // *** END FIX FOR NaN exam_id ***

    currentExamData.value.examDate = latestExamObj.name || '未知考试'; // 访问 latestExamObj.name
    console.log('最新考试信息:', latestExamObj);

    // 2. 获取成绩进退步分析 (需要提供学生id和最近几次考试的对比，这里取2次)
    const upDownDetailResponse = await api.analysis.getUpDownDetailAnalysis({
      student_id: Number(studentInfo.value.uid),
      nums: 2 // 我们只需要最近两次考试进行比较
    });
    console.log('获取到进退步分析原始数据:', upDownDetailResponse);

    const upDownDetail = upDownDetailResponse.data; // 获取数据数组
    console.log('upDownDetail data structure:', upDownDetail);

    if (!upDownDetail || upDownDetail.length < 2) {
      console.warn('getUpDownDetailAnalysis 没有返回足够的考试数据进行进退步分析（至少需要两次）。');
      // Fallback for up/down detail if not enough data
      Object.values(currentExamData.value.subjects).forEach(subject => {
        subject.rankChangeClass = null;
        subject.rankChangeSegment = null;
      });
      currentExamData.value.totalRankChangeClass = null;
      currentExamData.value.totalRankChangeSegment = null;
    } else {
      // 深度克隆数据，以防原始数据是 Proxy 对象，确保后续操作的是纯粹的数据对象
      const latestExamRanks = JSON.parse(JSON.stringify(upDownDetail[0])); 
      const previousExamRanks = JSON.parse(JSON.stringify(upDownDetail[1]));
      console.log('最新考试排名数据 (克隆后):', latestExamRanks);
      console.log('上一次考试排名数据 (克隆后):', previousExamRanks);

      // 辅助函数：计算排名变化并格式化
      const calculateRankChange = (latestRank: number | null | undefined, previousRank: number | null | undefined) => {
        console.log(`计算排名变化 - latestRank: ${latestRank}, previousRank: ${previousRank}`);
        if (latestRank === undefined || latestRank === null || previousRank === undefined || previousRank === null || isNaN(latestRank as number) || isNaN(previousRank as number)) {
          console.log('返回 null: 某个排名为无效值');
          return null;
        }
        const change = previousRank - latestRank; // 排名越小越好，所以 (旧 - 新) > 0 表示进步
        console.log(`排名变化计算结果: ${change}`);
        return change;
      };

      // 总分进退步分析
      currentExamData.value.totalRankChangeClass = calculateRankChange(latestExamRanks.sumB, previousExamRanks.sumB);
      console.log('总分班级排名原始值：', latestExamRanks.sumB, previousExamRanks.sumB, '->', currentExamData.value.totalRankChangeClass);

      currentExamData.value.totalRankChangeSegment = calculateRankChange(latestExamRanks.sumD, previousExamRanks.sumD);
      console.log('总分阶段排名原始值：', latestExamRanks.sumD, previousExamRanks.sumD, '->', currentExamData.value.totalRankChangeSegment);

      // 各科进退步分析
      currentExamData.value.subjects.chinese.rankChangeClass = calculateRankChange(latestExamRanks.YuwenB, previousExamRanks.YuwenB);
      console.log('语文班级排名原始值：', latestExamRanks.YuwenB, previousExamRanks.YuwenB, '->', currentExamData.value.subjects.chinese.rankChangeClass);

      currentExamData.value.subjects.chinese.rankChangeSegment = calculateRankChange(latestExamRanks.YuwenD, previousExamRanks.YuwenD);
      console.log('语文阶段排名原始值：', latestExamRanks.YuwenD, previousExamRanks.YuwenD, '->', currentExamData.value.subjects.chinese.rankChangeSegment);

      currentExamData.value.subjects.math.rankChangeClass = calculateRankChange(latestExamRanks.ShuxueB, previousExamRanks.ShuxueB);
      console.log('数学班级排名原始值：', latestExamRanks.ShuxueB, previousExamRanks.ShuxueB, '->', currentExamData.value.subjects.math.rankChangeClass);

      currentExamData.value.subjects.math.rankChangeSegment = calculateRankChange(latestExamRanks.ShuxueD, previousExamRanks.ShuxueD);
      console.log('数学阶段排名原始值：', latestExamRanks.ShuxueD, previousExamRanks.ShuxueD, '->', currentExamData.value.subjects.math.rankChangeSegment);

      currentExamData.value.subjects.english.rankChangeClass = calculateRankChange(latestExamRanks.YingyuB, previousExamRanks.YingyuB);
      console.log('外语班级排名原始值：', latestExamRanks.YingyuB, previousExamRanks.YingyuB, '->', currentExamData.value.subjects.english.rankChangeClass);

      currentExamData.value.subjects.english.rankChangeSegment = calculateRankChange(latestExamRanks.YingyuD, previousExamRanks.YingyuD);
      console.log('外语阶段排名原始值：', latestExamRanks.YingyuD, previousExamRanks.YingyuD, '->', currentExamData.value.subjects.english.rankChangeSegment);

      // 历史/物理
      currentExamData.value.subjects.historyPhysics.rankChangeClass = calculateRankChange(
        latestExamRanks.WuliB !== null ? latestExamRanks.WuliB : latestExamRanks.LishiB,
        previousExamRanks.WuliB !== null ? previousExamRanks.WuliB : previousExamRanks.LishiB
      );
      console.log('历史/物理班级排名原始值：', 
        latestExamRanks.WuliB !== null ? latestExamRanks.WuliB : latestExamRanks.LishiB,
        previousExamRanks.WuliB !== null ? previousExamRanks.WuliB : previousExamRanks.LishiB,
        '->', currentExamData.value.subjects.historyPhysics.rankChangeClass
      );
      currentExamData.value.subjects.historyPhysics.rankChangeSegment = calculateRankChange(
        latestExamRanks.WuliD !== null ? latestExamRanks.WuliD : latestExamRanks.LishiD,
        previousExamRanks.WuliD !== null ? previousExamRanks.WuliD : previousExamRanks.LishiD
      );
      console.log('历史/物理阶段排名原始值：', 
        latestExamRanks.WuliD !== null ? latestExamRanks.WuliD : latestExamRanks.LishiD,
        previousExamRanks.WuliD !== null ? previousExamRanks.WuliD : previousExamRanks.LishiD,
        '->', currentExamData.value.subjects.historyPhysics.rankChangeSegment
      );

      // 政治/化学
      currentExamData.value.subjects.politicsChemistry.rankChangeClass = calculateRankChange(
        latestExamRanks.HuaxueB !== null ? latestExamRanks.HuaxueB : latestExamRanks.ZhengzhiB,
        previousExamRanks.HuaxueB !== null ? previousExamRanks.HuaxueB : previousExamRanks.ZhengzhiB
      );
      console.log('政治/化学班级排名原始值：', 
        latestExamRanks.HuaxueB !== null ? latestExamRanks.HuaxueB : latestExamRanks.ZhengzhiB,
        previousExamRanks.HuaxueB !== null ? previousExamRanks.HuaxueB : previousExamRanks.ZhengzhiB,
        '->', currentExamData.value.subjects.politicsChemistry.rankChangeClass
      );
      currentExamData.value.subjects.politicsChemistry.rankChangeSegment = calculateRankChange(
        latestExamRanks.HuaxueD !== null ? latestExamRanks.HuaxueD : latestExamRanks.ZhengzhiD,
        previousExamRanks.HuaxueD !== null ? previousExamRanks.HuaxueD : previousExamRanks.ZhengzhiD
      );
      console.log('政治/化学阶段排名原始值：', 
        latestExamRanks.HuaxueD !== null ? latestExamRanks.HuaxueD : latestExamRanks.ZhengzhiD,
        previousExamRanks.HuaxueD !== null ? previousExamRanks.HuaxueD : previousExamRanks.ZhengzhiD,
        '->', currentExamData.value.subjects.politicsChemistry.rankChangeSegment
      );

      // 地理/生物
      currentExamData.value.subjects.geographyBiology.rankChangeClass = calculateRankChange(
        latestExamRanks.ShengwuB !== null ? latestExamRanks.ShengwuB : latestExamRanks.DiliB,
        previousExamRanks.ShengwuB !== null ? previousExamRanks.ShengwuB : previousExamRanks.DiliB
      );
      console.log('地理/生物班级排名原始值：', 
        latestExamRanks.ShengwuB !== null ? latestExamRanks.ShengwuB : latestExamRanks.DiliB,
        previousExamRanks.ShengwuB !== null ? previousExamRanks.ShengwuB : previousExamRanks.DiliB,
        '->', currentExamData.value.subjects.geographyBiology.rankChangeClass
      );
      currentExamData.value.subjects.geographyBiology.rankChangeSegment = calculateRankChange(
        latestExamRanks.ShengwuD !== null ? latestExamRanks.ShengwuD : latestExamRanks.DiliD,
        previousExamRanks.ShengwuD !== null ? previousExamRanks.ShengwuD : previousExamRanks.DiliD
      );
      console.log('地理/生物阶段排名原始值：', 
        latestExamRanks.ShengwuD !== null ? latestExamRanks.ShengwuD : latestExamRanks.DiliD,
        previousExamRanks.ShengwuD !== null ? previousExamRanks.ShengwuD : previousExamRanks.DiliD,
        '->', currentExamData.value.subjects.geographyBiology.rankChangeSegment
      );
    }

      // 3. 获取一本线 (需要提供考试id)
      const passLine = await api.analysis.getPassLine({
        exam_id: examId // Use the validated examId here
      });
      console.log('获取到一本线原始数据:', passLine);
      console.log('Pass line raw data:', passLine);
      
      if (!passLine) {
        console.warn('getPassLine did not return any pass line data or returned null/undefined.');
        // Fallback for pass line if no data
        Object.values(currentExamData.value.subjects).forEach(subject => {
          subject.passLine = false;
        });
        currentExamData.value.totalPassLine = false;
        // Update radar chart indicator names for no pass line data
        chartOption.value.radar.indicator[3].name = dynamicSubjectNames.value.historyPhysics;
        chartOption.value.radar.indicator[4].name = dynamicSubjectNames.value.politicsChemistry;
        chartOption.value.radar.indicator[5].name = dynamicSubjectNames.value.geographyBiology;
      }

      if (passLine) {
        currentExamData.value.totalPassLine = passLine.total_pass || false; 
        currentExamData.value.subjects.chinese.passLine = passLine.Yuwen_pass || false;
        currentExamData.value.subjects.math.passLine = passLine.Shuxue_pass || false;
        currentExamData.value.subjects.english.passLine = passLine.Yingyu_pass || false;
        // Update combined subjects passLine based on subject selection
        if (studentInfo.value.subject_selection_id === 0) { // 文科
          currentExamData.value.subjects.historyPhysics.passLine = passLine.Lishi_pass || false;
          currentExamData.value.subjects.politicsChemistry.passLine = passLine.Zhengzhi_pass || false;
          currentExamData.value.subjects.geographyBiology.passLine = passLine.Dili_pass || false;
        } else if (studentInfo.value.subject_selection_id === 1) { // 理科
          currentExamData.value.subjects.historyPhysics.passLine = passLine.Wuli_pass || false;
          currentExamData.value.subjects.politicsChemistry.passLine = passLine.Huaxue_pass || false;
          currentExamData.value.subjects.geographyBiology.passLine = passLine.Shengwu_pass || false;
        }

        console.log('雷达图指标最大值和名称已更新:', chartOption.value.radar.indicator);
      }

    // 4. 获取本次考试的成绩
    const grades = await api.grade.getGradeApi({
      student_id: Number(studentInfo.value.uid),
      exam_id: examId, // Use the validated examId here
      school_id: Number(studentInfo.value.school_id),
      class_id: Number(studentInfo.value.class_id),
    });
    console.log('获取到本次考试成绩原始数据:', grades);

    if (!grades || grades.length === 0) {
      console.warn('getGradeApi did not return any grades or returned null/undefined.');
      // Also clear radar chart data if no exams
      chartOption.value.radar.indicator[0].name = '语文';
      chartOption.value.radar.indicator[1].name = '数学';
      chartOption.value.radar.indicator[2].name = '外语';
      chartOption.value.radar.indicator[3].name = dynamicSubjectNames.value.historyPhysics;
      chartOption.value.radar.indicator[4].name = dynamicSubjectNames.value.politicsChemistry;
      chartOption.value.radar.indicator[5].name = dynamicSubjectNames.value.geographyBiology;
      chartOption.value.series[0].data[0].value = [0, 0, 0, 0, 0, 0]; // Reset radar chart data
      return; // Exit if no grades to prevent further errors
    }
    
    if (grades && grades.length > 0) {
      const radarData = [
        examStats.value.subjects.chinese.passRate, // 语文进线率
        examStats.value.subjects.math.passRate,    // 数学进线率
        examStats.value.subjects.english.passRate, // 外语进线率
        examStats.value.subjects.physics.passRate, // 历史/物理进线率
        examStats.value.subjects.chemistry.passRate, // 政治/化学进线率
        examStats.value.subjects.biology.passRate  // 地理/生物进线率
      ];
      chartOption.value.series[0].data[0].value = radarData;
      console.log('雷达图数据已更新:', chartOption.value.series[0].data[0].value);
    }

    console.log('本次考试数据已更新:', currentExamData.value);
    console.log('Current chart option after pass line processing:', chartOption.value);
    console.log('雷达图最终配置:', chartOption.value.radar.indicator);
  } catch (error) {
    console.error('获取本次考试数据失败:', error);
  }
};

const goBack = () => {
  router.push('/analysis');
};

// 在组件挂载时获取学生信息
onMounted(() => {
  fetchStudentInfo();
});

// 格式化通过率显示
const formatPassRate = (rate: number) => {
  return rate ? `${(rate * 100).toFixed(1)}%` : '0%';
};

// 格式化是否过线显示
const formatPassLine = (isPassed: boolean) => {
  return isPassed ? '是' : '否';
};

</script>

<style scoped>
.student-analysis-page {
  padding: 20px;
  position: relative; /* Needed for absolute positioning of the button */
  height: 100%; /* Make the container fill the height */
  overflow-y: auto; /* Add vertical scrolling */
  box-sizing: border-box; /* Include padding in height calculation */
}

.back-button {
  position: absolute;
  top: 10px; /* Adjust as needed */
  left: 10px; /* Adjust as needed */
  padding: 5px 10px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10; /* Ensure button is above other content */
}

.tables-container {
  display: flex; /* 使用 flexbox 实现并列布局 */
  gap: 20px; /* 表格之间的间隔 */
  margin-top: 40px; /* Add margin to prevent overlap with button */
}

.table-section {
  flex: 1; /* 让两个表格区域平分空间 */
}

.analysis-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.analysis-table th,
.analysis-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}

.analysis-table th {
  background-color: #f2f2f2;
}

.total-exams, .exam-date {
  font-size: 0.9em;
  color: #666;
  margin-left: 10px;
}

.description {
  margin-top: 10px;
  font-size: 0.9em;
}

.chart-container {
    margin-top: 40px; /* Add space above the chart */
    display: flex;
    flex-direction: column;
    align-items: center; /* Center the chart horizontally */
}

.radar-chart {
  width: 600px; /* Adjust width and height as needed */
  height: 400px;
}

.analysis-text {
  margin-top: 20px;
  font-size: 1.2em;
  font-weight: bold;
}
</style> 
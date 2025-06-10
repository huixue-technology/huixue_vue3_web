<template>
  <div class="student-analysis-page">
    <button class="back-button" @click="goBack">返回</button>
    <h2>学生分析</h2>
    <div class="tables-container" v-if="!isLoading">
      <!-- 考试统计表格区域 -->
      <div class="table-section">
        <h2>考试统计 <span class="total-exams">共统计{{ examStats.totalExams }}场考试</span></h2>
        <p class="description">说明：一本率低于60%为<span style="color: red;">红色</span>，在60%到80%之间为<span style="color: orange;">橙色</span>。</p>
        <table class="analysis-table">
          <thead>
            <tr>
              <th>科目</th>
              <th>一本进线次数</th>
              <th>一本进线率</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>总分</td>
              <td>{{ examStats.subjects.total.passCount }}</td>
              <td :class="getPassRateClass(examStats.subjects.total.passRate)">
                {{ formatPassRate(examStats.subjects.total.passRate) }}
              </td>
            </tr>
            <tr>
              <td>语文</td>
              <td>{{ examStats.subjects.chinese.passCount }}</td>
              <td :class="getPassRateClass(examStats.subjects.chinese.passRate)">
                {{ formatPassRate(examStats.subjects.chinese.passRate) }}
              </td>
            </tr>
            <tr>
              <td>数学</td>
              <td>{{ examStats.subjects.math.passCount }}</td>
              <td :class="getPassRateClass(examStats.subjects.math.passRate)">
                {{ formatPassRate(examStats.subjects.math.passRate) }}
              </td>
            </tr>
            <tr>
              <td>外语</td>
              <td>{{ examStats.subjects.english.passCount }}</td>
              <td :class="getPassRateClass(examStats.subjects.english.passRate)">
                {{ formatPassRate(examStats.subjects.english.passRate) }}
              </td>
            </tr>
            <tr>
              <td>历史/物理</td>
              <td>{{ examStats.subjects.physics.passCount }}</td>
              <td :class="getPassRateClass(examStats.subjects.physics.passRate)">
                {{ formatPassRate(examStats.subjects.physics.passRate) }}
              </td>
            </tr>
            <tr>
              <td>政治/化学</td>
              <td>{{ examStats.subjects.chemistry.passCount }}</td>
              <td :class="getPassRateClass(examStats.subjects.chemistry.passRate)">
                {{ formatPassRate(examStats.subjects.chemistry.passRate) }}
              </td>
            </tr>
            <tr>
              <td>地理/生物</td>
              <td>{{ examStats.subjects.biology.passCount }}</td>
              <td :class="getPassRateClass(examStats.subjects.biology.passRate)">
                {{ formatPassRate(examStats.subjects.biology.passRate) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 本次考试表格区域 -->
      <div class="table-section">
        <h2>本次考试 <span class="exam-date">{{ currentExamData.examDate }}</span></h2>
        <p class="description">说明：<span style="color: red;">红色</span>表明较上次考试退步的名次，<span style="color: green;">绿色</span>表明较上次考试进步的名次。</p>
        <table class="analysis-table">
          <thead>
            <tr>
              <th>科目</th>
              <th>进退班次</th>
              <th>进退段次</th>
              <th>是否过线</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>总分</td>
              <td :class="getRankChangeClass(currentExamData.totalRankChangeClass)">{{ currentExamData.totalRankChangeClass }}</td>
              <td :class="getRankChangeClass(currentExamData.totalRankChangeSegment)">{{ currentExamData.totalRankChangeSegment }}</td>
              <td :class="getPassLineStatusClass(currentExamData.totalPassLine)">{{ formatPassLine(currentExamData.totalPassLine) }}</td>
            </tr>
            <tr>
              <td>语文</td>
              <td :class="getRankChangeClass(currentExamData.subjects.chinese.rankChangeClass)">{{ currentExamData.subjects.chinese.rankChangeClass }}</td>
              <td :class="getRankChangeClass(currentExamData.subjects.chinese.rankChangeSegment)">{{ currentExamData.subjects.chinese.rankChangeSegment }}</td>
              <td :class="getPassLineStatusClass(currentExamData.subjects.chinese.passLine)">{{ formatPassLine(currentExamData.subjects.chinese.passLine) }}</td>
            </tr>
            <tr>
              <td>数学</td>
              <td :class="getRankChangeClass(currentExamData.subjects.math.rankChangeClass)">{{ currentExamData.subjects.math.rankChangeClass }}</td>
              <td :class="getRankChangeClass(currentExamData.subjects.math.rankChangeSegment)">{{ currentExamData.subjects.math.rankChangeSegment }}</td>
              <td :class="getPassLineStatusClass(currentExamData.subjects.math.passLine)">{{ formatPassLine(currentExamData.subjects.math.passLine) }}</td>
            </tr>
            <tr>
              <td>外语</td>
              <td :class="getRankChangeClass(currentExamData.subjects.english.rankChangeClass)">{{ currentExamData.subjects.english.rankChangeClass }}</td>
              <td :class="getRankChangeClass(currentExamData.subjects.english.rankChangeSegment)">{{ currentExamData.subjects.english.rankChangeSegment }}</td>
              <td :class="getPassLineStatusClass(currentExamData.subjects.english.passLine)">{{ formatPassLine(currentExamData.subjects.english.passLine) }}</td>
            </tr>
            <tr>
              <td>历史/物理</td>
              <td :class="getRankChangeClass(currentExamData.subjects.historyPhysics.rankChangeClass)">{{ currentExamData.subjects.historyPhysics.rankChangeClass }}</td>
              <td :class="getRankChangeClass(currentExamData.subjects.historyPhysics.rankChangeSegment)">{{ currentExamData.subjects.historyPhysics.rankChangeSegment }}</td>
              <td :class="getPassLineStatusClass(currentExamData.subjects.historyPhysics.passLine)">{{ formatPassLine(currentExamData.subjects.historyPhysics.passLine) }}</td>
            </tr>
            <tr>
              <td>政治/化学</td>
              <td :class="getRankChangeClass(currentExamData.subjects.politicsChemistry.rankChangeClass)">{{ currentExamData.subjects.politicsChemistry.rankChangeClass }}</td>
              <td :class="getRankChangeClass(currentExamData.subjects.politicsChemistry.rankChangeSegment)">{{ currentExamData.subjects.politicsChemistry.rankChangeSegment }}</td>
              <td :class="getPassLineStatusClass(currentExamData.subjects.politicsChemistry.passLine)">{{ formatPassLine(currentExamData.subjects.politicsChemistry.passLine) }}</td>
            </tr>
            <tr>
              <td>地理/生物</td>
              <td :class="getRankChangeClass(currentExamData.subjects.geographyBiology.rankChangeClass)">{{ currentExamData.subjects.geographyBiology.rankChangeClass }}</td>
              <td :class="getRankChangeClass(currentExamData.subjects.geographyBiology.rankChangeSegment)">{{ currentExamData.subjects.geographyBiology.rankChangeSegment }}</td>
              <td :class="getPassLineStatusClass(currentExamData.subjects.geographyBiology.passLine)">{{ formatPassLine(currentExamData.subjects.geographyBiology.passLine) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 能力六边形图表区域 -->
    <div class="chart-container" v-if="!isLoading">
      <h2>一本能力值</h2>
      <e-charts class="radar-chart" :option="chartOption"></e-charts>
      <div class="description">综合分析：本次考试总分较上次考试退步，语文、数学、外语、历史/物理、政治/化学、地理/生物均较上次考试退步。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { getCurrentUser } from '@/servers/api/user';
import { getStudentDetailApi, getStudentExamApi } from '@/servers/api/student';
import { getPassLineAnalysis, getUpDownDetailAnalysis, getPassLine } from '@/servers/api/analysis';
import { getGradeApi } from '@/servers/api/grade';

const router = useRouter();

// 加载状态
const isLoading = ref(true);

// 学生信息状态
const studentInfo = ref({
  name: '',
  uid: '',
  school_id: '',
  class_id: '',
  subject_selection_id: ''
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
  totalRankChangeClass: '',
  totalRankChangeSegment: '',
  totalPassLine: false,
  subjects: {
    chinese: { rankChangeClass: '', rankChangeSegment: '', passLine: false },
    math: { rankChangeClass: '', rankChangeSegment: '', passLine: false },
    english: { rankChangeClass: '', rankChangeSegment: '', passLine: false },
    physics: { rankChangeClass: '', rankChangeSegment: '', passLine: false },
    chemistry: { rankChangeClass: '', rankChangeSegment: '', passLine: false },
    biology: { rankChangeClass: '', rankChangeSegment: '', passLine: false },
    // 对应页面中的历史/物理，政治/化学，地理/生物
    historyPhysics: { rankChangeClass: '', rankChangeSegment: '', passLine: false },
    politicsChemistry: { rankChangeClass: '', rankChangeSegment: '', passLine: false },
    geographyBiology: { rankChangeClass: '', rankChangeSegment: '', passLine: false },
  }
});

// ECharts 雷达图配置
const chartOption = ref({
  radar: {
    // shape: 'circle', // 可以设置为 'circle'
    indicator: [
      { name: '语文', max: 100 }, // 示例最大值，请根据实际数据调整
      { name: '数学', max: 100 },
      { name: '外语', max: 100 },
      { name: '历史/物理', max: 100 },
      { name: '政治/化学', max: 100 },
      { name: '地理/生物', max: 100 }
    ]
  },
  series: [
    {
      name: '能力值', // 系列名称
      type: 'radar',
      data: [
        { value: [80, 75, 90, 60, 70, 85], name: '学生成绩' } // 示例数据，请替换为实际六科成绩
      ]
    }
  ]
});

// 获取学生信息
const fetchStudentInfo = async () => {
  console.log('开始获取学生信息...');
  try {
    const currentUser = await getCurrentUser();
    console.log('获取到当前用户:', currentUser);
    if (!currentUser || !currentUser.id) {
      console.warn('当前用户或用户ID未定义，无法获取学生信息。');
      isLoading.value = false; // Ensure loading state is false if no user
      return;
    }
    
    const studentDetail = await getStudentDetailApi({
      student_uid: currentUser.id
    });
    console.log('获取到学生详情:', studentDetail);
    
    if (!studentDetail) {
      console.warn('getStudentDetailApi did not return student detail data or returned null/undefined.');
      isLoading.value = false; // Ensure loading state is false if no detail
      return;
    }

    studentInfo.value = {
      name: studentDetail.name || '',
      uid: studentDetail.uid || '',
      school_id: studentDetail.school_id || '',
      class_id: studentDetail.class_id || '',
      subject_selection_id: studentDetail.subject_selection_id || ''
    };
    console.log('学生信息已更新:', studentInfo.value);
    await Promise.all([
      fetchExamStats(),
      fetchCurrentExamData()
    ]);
  } catch (error) {
    console.error('获取学生信息失败:', error);
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
    
    const stats = await getPassLineAnalysis({
      student_id: parseInt(studentInfo.value.uid),
      nums: 70
    });
    console.log('获取到成绩统计原始数据:', stats);

    if (!stats) {
      console.warn('getPassLineAnalysis did not return data for exam stats or returned null/undefined.');
      return;
    }

    examStats.value = {
      totalExams: stats.total_exams || 0,
      subjects: {
        total: {
          passCount: stats.total_pass_count || 0,
          passRate: stats.total_pass_rate || 0
        },
        chinese: {
          passCount: stats.chinese_pass_count || 0,
          passRate: stats.chinese_pass_rate || 0
        },
        math: {
          passCount: stats.math_pass_count || 0,
          passRate: stats.math_pass_rate || 0
        },
        english: {
          passCount: stats.english_pass_count || 0,
          passRate: stats.english_pass_rate || 0
        },
        physics: {
          passCount: stats.physics_pass_count || 0,
          passRate: stats.physics_pass_rate || 0
        },
        chemistry: {
          passCount: stats.chemistry_pass_count || 0,
          passRate: stats.chemistry_pass_rate || 0
        },
        biology: {
          passCount: stats.biology_pass_count || 0,
          passRate: stats.biology_pass_rate || 0
        }
      }
    };
    console.log('成绩统计数据已更新:', examStats.value);
  } catch (error) {
    console.error('获取成绩统计数据失败:', error);
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
    const studentExams = await getStudentExamApi({
      student_uid: studentInfo.value.uid
    });
    console.log('获取到学生考试记录原始数据:', studentExams);

    if (!studentExams || studentExams.length === 0) {
      console.warn('getStudentExamApi did not return any student exams or returned null/undefined.');
      // It's crucial to ensure currentExamData is initialized to prevent errors if no exams are found
      currentExamData.value = {
        examDate: '无考试数据',
        totalRankChangeClass: '无数据',
        totalRankChangeSegment: '无数据',
        totalPassLine: false,
        subjects: {
          chinese: { rankChangeClass: '无数据', rankChangeSegment: '无数据', passLine: false },
          math: { rankChangeClass: '无数据', rankChangeSegment: '无数据', passLine: false },
          english: { rankChangeClass: '无数据', rankChangeSegment: '无数据', passLine: false },
          physics: { rankChangeClass: '无数据', rankChangeSegment: '无数据', passLine: false },
          chemistry: { rankChangeClass: '无数据', rankChangeSegment: '无数据', passLine: false },
          biology: { rankChangeClass: '无数据', rankChangeSegment: '无数据', passLine: false },
          historyPhysics: { rankChangeClass: '无数据', rankChangeSegment: '无数据', passLine: false },
          politicsChemistry: { rankChangeClass: '无数据', rankChangeSegment: '无数据', passLine: false },
          geographyBiology: { rankChangeClass: '无数据', rankChangeSegment: '无数据', passLine: false },
        }
      };
      // Also clear radar chart data if no exams
      chartOption.value.series[0].data[0].value = [0, 0, 0, 0, 0, 0];
      return;
    }

    const latestExam = studentExams[0]; 
    currentExamData.value.examDate = latestExam.name || '未知考试';
    console.log('最新考试信息:', latestExam);

    // 2. 获取成绩进退步分析 (需要提供学生id和最近几次考试的对比，这里取2次)
    const upDownDetail = await getUpDownDetailAnalysis({
      student_id: parseInt(studentInfo.value.uid),
      nums: 2
    });
    console.log('获取到进退步分析原始数据:', upDownDetail);

    if (!upDownDetail || upDownDetail.length === 0) {
      console.warn('getUpDownDetailAnalysis did not return any up/down detail or returned null/undefined.');
      // Fallback for up/down detail if no data
      Object.values(currentExamData.value.subjects).forEach(subject => {
        subject.rankChangeClass = '无数据';
        subject.rankChangeSegment = '无数据';
      });
    }
    
    if (upDownDetail && upDownDetail.length > 0) {
      const latestUpDown = upDownDetail[0];
      currentExamData.value.totalRankChangeClass = latestUpDown.sumB_change !== undefined ? (latestUpDown.sumB_change > 0 ? `退步${latestUpDown.sumB_change}` : (latestUpDown.sumB_change < 0 ? `进步${Math.abs(latestUpDown.sumB_change)}` : '无变化')) : '无数据';
      currentExamData.value.totalRankChangeSegment = latestUpDown.sumD_change !== undefined ? (latestUpDown.sumD_change > 0 ? `退步${latestUpDown.sumD_change}` : (latestUpDown.sumD_change < 0 ? `进步${Math.abs(latestUpDown.sumD_change)}` : '无变化')) : '无数据';

      // 各科进退步分析
      currentExamData.value.subjects.chinese.rankChangeClass = latestUpDown.YuwenB_change !== undefined ? (latestUpDown.YuwenB_change > 0 ? `退步${latestUpDown.YuwenB_change}` : (latestUpDown.YuwenB_change < 0 ? `进步${Math.abs(latestUpDown.YuwenB_change)}` : '无变化')) : '无数据';
      currentExamData.value.subjects.chinese.rankChangeSegment = latestUpDown.YuwenD_change !== undefined ? (latestUpDown.YuwenD_change > 0 ? `退步${latestUpDown.YuwenD_change}` : (latestUpDown.YuwenD_change < 0 ? `进步${Math.abs(latestUpDown.YuwenD_change)}` : '无变化')) : '无数据';

      currentExamData.value.subjects.math.rankChangeClass = latestUpDown.ShuxueB_change !== undefined ? (latestUpDown.ShuxueB_change > 0 ? `退步${latestUpDown.ShuxueB_change}` : (latestUpDown.ShuxueB_change < 0 ? `进步${Math.abs(latestUpDown.ShuxueB_change)}` : '无变化')) : '无数据';
      currentExamData.value.subjects.math.rankChangeSegment = latestUpDown.ShuxueD_change !== undefined ? (latestUpDown.ShuxueD_change > 0 ? `退步${latestUpDown.ShuxueD_change}` : (latestUpDown.ShuxueD_change < 0 ? `进步${Math.abs(latestUpDown.ShuxueD_change)}` : '无变化')) : '无数据';

      currentExamData.value.subjects.english.rankChangeClass = latestUpDown.YingyuB_change !== undefined ? (latestUpDown.YingyuB_change > 0 ? `退步${latestUpDown.YingyuB_change}` : (latestUpDown.YingyuB_change < 0 ? `进步${Math.abs(latestUpDown.YingyuB_change)}` : '无变化')) : '无数据';
      currentExamData.value.subjects.english.rankChangeSegment = latestUpDown.YingyuD_change !== undefined ? (latestUpDown.YingyuD_change > 0 ? `退步${latestUpDown.YingyuD_change}` : (latestUpDown.YingyuD_change < 0 ? `进步${Math.abs(latestUpDown.YingyuD_change)}` : '无变化')) : '无数据';

      currentExamData.value.subjects.historyPhysics.rankChangeClass = latestUpDown.WuliB_change !== undefined ? (latestUpDown.WuliB_change > 0 ? `退步${latestUpDown.WuliB_change}` : (latestUpDown.WuliB_change < 0 ? `进步${Math.abs(latestUpDown.WuliB_change)}` : '无变化')) : '无数据';
      currentExamData.value.subjects.historyPhysics.rankChangeSegment = latestUpDown.WuliD_change !== undefined ? (latestUpDown.WuliD_change > 0 ? `退步${latestUpDown.WuliD_change}` : (latestUpDown.WuliD_change < 0 ? `进步${Math.abs(latestUpDown.WuliD_change)}` : '无变化')) : '无数据';

      currentExamData.value.subjects.politicsChemistry.rankChangeClass = latestUpDown.HuaxueB_change !== undefined ? (latestUpDown.HuaxueB_change > 0 ? `退步${latestUpDown.HuaxueB_change}` : (latestUpDown.HuaxueB_change < 0 ? `进步${Math.abs(latestUpDown.HuaxueB_change)}` : '无变化')) : '无数据';
      currentExamData.value.subjects.politicsChemistry.rankChangeSegment = latestUpDown.HuaxueD_change !== undefined ? (latestUpDown.HuaxueD_change > 0 ? `退步${latestUpDown.HuaxueD_change}` : (latestUpDown.HuaxueD_change < 0 ? `进步${Math.abs(latestUpDown.HuaxueD_change)}` : '无变化')) : '无数据';

      currentExamData.value.subjects.geographyBiology.rankChangeClass = latestUpDown.ShengwuB_change !== undefined ? (latestUpDown.ShengwuB_change > 0 ? `退步${latestUpDown.ShengwuB_change}` : (latestUpDown.ShengwuB_change < 0 ? `进步${Math.abs(latestUpDown.ShengwuB_change)}` : '无变化')) : '无数据';
      currentExamData.value.subjects.geographyBiology.rankChangeSegment = latestUpDown.ShengwuD_change !== undefined ? (latestUpDown.ShengwuD_change > 0 ? `退步${latestUpDown.ShengwuD_change}` : (latestUpDown.ShengwuD_change < 0 ? `进步${Math.abs(latestUpDown.ShengwuD_change)}` : '无变化')) : '无数据';
    }

      // 3. 获取一本线 (需要提供考试id)
      const passLine = await getPassLine({
        exam_id: latestExam.id
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
      }

      if (passLine) {
        currentExamData.value.totalPassLine = passLine.total_pass || false; 
        currentExamData.value.subjects.chinese.passLine = passLine.Yuwen_pass || false;
        currentExamData.value.subjects.math.passLine = passLine.Shuxue_pass || false;
        currentExamData.value.subjects.english.passLine = passLine.Yingyu_pass || false;
        currentExamData.value.subjects.historyPhysics.passLine = passLine.Wuli_pass || false;
        currentExamData.value.subjects.politicsChemistry.passLine = passLine.Huaxue_pass || false;
        currentExamData.value.subjects.geographyBiology.passLine = passLine.Shengwu_pass || false;

        // Update radar chart max values with actual pass line scores
        chartOption.value.radar.indicator[0].max = passLine.Yuwen || 150; 
        chartOption.value.radar.indicator[1].max = passLine.Shuxue || 150;
        chartOption.value.radar.indicator[2].max = passLine.Yingyu || 150;
        // For combined subjects, prioritize one or fallback to a default max
        chartOption.value.radar.indicator[3].max = passLine.Wuli || passLine.Lishi || 150; // History/Physics
        chartOption.value.radar.indicator[4].max = passLine.Huaxue || passLine.Zhengzhi || 150; // Politics/Chemistry
        chartOption.value.radar.indicator[5].max = passLine.Shengwu || passLine.Dili || 150; // Geography/Biology
        console.log('雷达图指标最大值已更新:', chartOption.value.radar.indicator);
      }

    // 4. 获取本次考试的成绩
    const grades = await getGradeApi({
      student_id: parseInt(studentInfo.value.uid),
      exam_id: latestExam.id,
      school_id: parseInt(studentInfo.value.school_id),
      class_id: parseInt(studentInfo.value.class_id),
    });
    console.log('获取到本次考试成绩原始数据:', grades);

    if (!grades || grades.length === 0) {
      console.warn('getGradeApi did not return any grades or returned null/undefined.');
      chartOption.value.series[0].data[0].value = [0, 0, 0, 0, 0, 0]; // Reset radar chart data
      return; // Exit if no grades to prevent further errors
    }
    
    if (grades && grades.length > 0) {
      const latestGrade = grades[0];
      const radarData = [
        latestGrade.Yuwen || 0,
        latestGrade.Shuxue || 0,
        latestGrade.Yingyu || 0,
        latestGrade.Wuli || latestGrade.Lishi || 0,
        latestGrade.Huaxue || latestGrade.Zhengzhi || 0,
        latestGrade.Shengwu || latestGrade.Dili || 0,
      ];
      chartOption.value.series[0].data[0].value = radarData;
      console.log('雷达图数据已更新:', chartOption.value.series[0].data[0].value);
    }

    console.log('本次考试数据已更新:', currentExamData.value);
    console.log('Current chart option after pass line processing:', chartOption.value);
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

// 根据通过率返回对应的样式类
const getPassRateClass = (rate: number) => {
  if (rate < 0.6) return 'low-rate';
  if (rate < 0.8) return 'medium-rate';
  return 'high-rate';
};

// 根据进退步文本返回对应的样式类
const getRankChangeClass = (text: string) => {
  if (text.includes('退步')) return 'regress-rank';
  if (text.includes('进步')) return 'progress-rank';
  return '';
};

// 格式化是否过线显示
const formatPassLine = (isPassed: boolean) => {
  return isPassed ? '是' : '否';
};

// 根据是否过线返回对应的样式类
const getPassLineStatusClass = (isPassed: boolean) => {
  return isPassed ? 'pass-line-true' : 'pass-line-false';
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

.low-rate {
  color: red;
}

.medium-rate {
  color: orange;
}

.high-rate {
  color: green;
}

.progress-rank {
  color: green;
}

.regress-rank {
  color: red;
}

.pass-line-true {
  color: green;
}

.pass-line-false {
  color: red;
}

</style>
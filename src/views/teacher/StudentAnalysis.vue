<template>
  <div class="student-analysis-container">
    <div class="header">
      <h2>学生成绩查看</h2>
      <p>查看本班所有学生的考试成绩</p>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <a-row :gutter="16">
        <a-col :span="8">
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
        <a-col :span="8">
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
        <a-col :span="8">
          <div class="filter-actions">
            <a-button type="primary" @click="resetFilters">重置筛选</a-button>
          </div>
        </a-col>
      </a-row>
    </div>

    <!-- 学生列表卡片 -->
    <div class="students-section" v-if="!selectedStudentId && filteredStudentList.length > 0">
      <h3>班级学生列表</h3>
      <a-row :gutter="16">
        <a-col 
          v-for="student in filteredStudentList" 
          :key="student.student_id" 
          :span="24"
          :md="12"
          :lg="8"
          :xl="6"
        >
          <div class="student-card" @click="selectStudent(student.student_id)">
            <div class="student-info">
              <div class="student-avatar">
                <UserOutlined />
              </div>
              <div class="student-details">
                <h4>{{ student.student_name }}</h4>
                <p>学号: {{ student.student_id }}</p>
              </div>
            </div>
          </div>
        </a-col>
      </a-row>
    </div>

    <!-- 搜索结果为空提示 -->
    <div class="empty-section" v-if="!selectedStudentId && filteredStudentList.length === 0 && searchKeyword">
      <a-empty description="未找到匹配的学生" />
    </div>

    <!-- 成绩详情区域 -->
    <div class="analysis-content" v-if="selectedStudentId">
      <!-- 学生基本信息 -->
      <div class="student-basic-info">
        <a-card title="学生信息" size="small">
          <div class="info-row">
            <span class="info-label">姓名：</span>
            <span class="info-value">{{ currentStudentInfo.student_name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">学号：</span>
            <span class="info-value">{{ currentStudentInfo.student_id }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">考试：</span>
            <span class="info-value">{{ examMap[selectedExamId] || currentExamInfo.name }}</span>
          </div>
        </a-card>
      </div>

      <!-- 成绩详情 -->
      <div class="score-details" v-if="selectedExamId">
        <a-row :gutter="16">
          <a-col :span="24">
            <a-card title="成绩详情" size="small">
              <a-table
                :columns="scoreColumns"
                :data-source="scoreData"
                :pagination="false"
                bordered
                size="middle"
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
        </a-row>

        <!-- 分数线对比 -->
        <a-row :gutter="16" style="margin-top: 20px;">
          <a-col :span="24">
            <a-card title="分数线对比" size="small">
              <a-table
                :columns="passLineColumns"
                :data-source="passLineData"
                :pagination="false"
                bordered
                size="middle"
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
                      {{ record.difference > 0 ? '+' : '' }}{{ record.difference }}
                    </span>
                  </template>
                </template>
              </a-table>
            </a-card>
          </a-col>
        </a-row>
      </div>

      <!-- 图表展示 -->
      <div class="charts-section" v-if="selectedExamId">
        <a-row :gutter="16" style="margin-top: 20px;">
          <a-col :span="24" :md="12">
            <a-card title="成绩分布图" size="small">
              <div class="chart-container">
                <e-charts :option="scoreChartOption" style="height: 300px" />
              </div>
            </a-card>
          </a-col>
          <a-col :span="24" :md="12">
            <a-card title="排名趋势图" size="small">
              <div class="chart-container">
                <e-charts :option="rankChartOption" style="height: 300px" />
              </div>
            </a-card>
          </a-col>
        </a-row>
      </div>
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
import { getPassLine } from '@/servers/api/analysis';
import { getExamDetailApi } from '@/servers/api/exam';
import type { ColumnType } from 'ant-design-vue/es/table';

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

// 选择状态
const selectedStudentId = ref<string>('');
const selectedExamId = ref<number>(0);

// 科目映射
const subjectMap: Record<string, string> = {
  'Yuwen': '语文',
  'Shuxue': '数学',
  'Yingyu': '英语',
  'Wuli': '物理',
  'Huaxue': '化学',
  'Shengwu': '生物',
  'Lishi': '历史',
  'Zhengzhi': '政治',
  'Dili': '地理',
  'sum_': '总分'
};

// 学生选项（用于下拉框）
const filteredStudentOptions = computed(() => {
  return filteredStudentList.value.map(student => ({
    label: `${student.student_name} (${student.student_id})`,
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
    classRank: scoreDetail.sumB || 0,
    gradeRank: scoreDetail.sumD || 0
  });
  
  // 添加各科成绩
  Object.keys(subjectMap).forEach(subject => {
    if (subject === 'sum_') return; // 总分已处理
    
    const score = scoreDetail[subject] || 0;
    const classRank = scoreDetail[`${subject}B`] || 0;
    const gradeRank = scoreDetail[`${subject}D`] || 0;
    
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

// 成绩图表选项
const scoreChartOption = computed(() => {
  const subjects = scoreData.value.map(item => item.subjectName);
  const scores = scoreData.value.map(item => item.score);
  
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
      type: 'value'
    },
    series: [{
      type: 'bar',
      data: scores,
      itemStyle: {
        color: '#5470C6'
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
  const subjects = scoreData.value.map(item => item.subjectName);
  const classRanks = scoreData.value.map(item => item.classRank);
  const gradeRanks = scoreData.value.map(item => item.gradeRank);
  
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
        }
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
        }
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
      selectedExamId.value = examDetails[0].id;
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
 
  // 获取该学生的考试成绩
  const res = fetchStudentGrades(studentId, selectedExamId.value);
};

// 选择学生卡片
const selectStudent = (studentId: string) => {
  selectedStudentId.value = studentId;
  handleStudentChange(studentId);
};

// 处理考试选择
const handleExamChange = async (examId: number) => {
  selectedExamId.value = examId;
  
  // 获取成绩详情和分数线
  await Promise.all([
    fetchStudentGrades(selectedStudentId.value, examId),
    fetchPassLine(examId)
  ]);
};

// 重置筛选
const resetFilters = () => {
  selectedStudentId.value = '';
  scoreDetails.value = {};
  passLineDetails.value = {};
  searchKeyword.value = '';
  // 重置过滤后的学生列表为所有学生
  filteredStudentList.value = [...studentList.value];
};
</script>

<style scoped lang="less">
.student-analysis-container {
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  overflow-y: auto;
  background-color: #f5f5f5;
  
  .header {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    
    h2 {
      margin: 0 0 10px 0;
      color: #333;
    }
    
    p {
      margin: 0;
      color: #666;
    }
  }
  
  .filter-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    
    .filter-item {
      display: flex;
      align-items: center;
      
      .filter-label {
        width: 80px;
        font-weight: bold;
      }
    }
    
    .filter-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      height: 100%;
    }
  }
  
  .students-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    
    h3 {
      margin-top: 0;
      color: #333;
    }
    
    .student-card {
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }
      
      .student-info {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        
        .student-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #1890ff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          margin-right: 12px;
        }
        
        .student-details {
          h4 {
            margin: 0 0 4px 0;
            font-size: 16px;
            color: #333;
          }
          
          p {
            margin: 0;
            font-size: 14px;
            color: #666;
          }
        }
      }
      
    }
  }
  
  .empty-section {
    background: white;
    padding: 40px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    text-align: center;
  }
  
  .student-basic-info {
    margin-bottom: 20px;
    
    :deep(.ant-card) {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .info-row {
      display: flex;
      margin-bottom: 8px;
      
      .info-label {
        font-weight: bold;
        width: 60px;
      }
      
      .info-value {
        flex: 1;
      }
    }
  }
  
  .score-details, .charts-section {
    :deep(.ant-card) {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
  
  .chart-container {
    padding: 10px 0;
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
  }
  
  .negative-difference {
    color: #f5222d;
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
    
    .students-section {
      .student-card {
        padding: 12px;
        
        .student-info {
          .student-avatar {
            width: 40px;
            height: 40px;
            font-size: 16px;
            margin-right: 10px;
          }
          
          .student-details {
            h4 {
              font-size: 14px;
            }
            
            p {
              font-size: 12px;
            }
          }
        }
        
        .student-stats {
          .stat-item {
            .stat-label {
              font-size: 10px;
            }
            
            .stat-value {
              font-size: 14px;
            }
          }
        }
      }
    }
  }
}
</style>
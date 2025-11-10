<template>
  <div class="class-grade-container">
    <div class="header">
      <h2>{{classInfo?.name}}班级成绩分析</h2>
      <p>选择考试查看班级成绩详情</p>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <a-row :gutter="16">
        <a-col :span="24" :md="8">
          <div class="filter-item">
            <span class="filter-label">选择考试：</span>
            <a-select 
              v-model:value="selectedExamId" 
              placeholder="选择考试" 
              style="width: 100%"
              @change="handleExamChange"
            >
              <a-select-option 
                v-for="examId in classExamList" 
                :key="examId" 
                :value="examId"
              >
                考试 {{ examId }}
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
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-section">
      <a-row :gutter="16">
        <a-col :span="12" :lg="4">
          <div class="summary-card avg-score-card">
            <div class="card-title">班级平均分</div>
            <div class="card-value">{{ classAvg.totalScore.toFixed(1) }}</div>
          </div>
        </a-col>
        <a-col :span="12" :lg="4">
          <div class="summary-card max-score-card">
            <div class="card-title">最高分</div>
            <div class="card-value">{{ classMax.totalScore }}</div>
          </div>
        </a-col>
        <a-col :span="12" :lg="4">
          <div class="summary-card min-score-card">
            <div class="card-title">最低分</div>
            <div class="card-value">{{ classMin.totalScore }}</div>
          </div>
        </a-col>
        <a-col :span="12" :lg="4">
          <div class="summary-card pass-line-card">
            <div class="card-title">一本线</div>
            <div class="card-value">{{ passLine }}</div>
          </div>
        </a-col>
        <a-col :span="12" :lg="4">
          <div class="summary-card pass-rate-card">
            <div class="card-title">一本率</div>
            <div class="card-value">{{ passRate }}%</div>
          </div>
        </a-col>
        <a-col :span="12" :lg="4">
          <div class="summary-card student-count-card">
            <div class="card-title">学生人数</div>
            <div class="card-value">{{ scoreList.length }}</div>
          </div>
        </a-col>
      </a-row>
    </div>

    <!-- 成绩表格区域 -->
    <div class="table-section">
      <a-card title="班级成绩详情" class="score-card">
        <div class="table-container">
          <a-table
              :columns="columns"
              :data-source="scoreList"
              bordered
              row-key="studentId"
              :pagination="{ pageSize: 10 }"
              :scroll="{ x: true }"
          >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'totalScore'">
              <span :class="getScoreClass(record.totalScore)">
                {{ record.totalScore }}
              </span>
            </template>
            <template v-if="column.dataIndex === 'classRank'">
              <span :class="getRankClass(record.classRank)">
                {{ record.classRank }}
              </span>
            </template>
          </template>
        </a-table>
      </div>
      </a-card>
    </div>

    <a-spin v-if="loading" tip="加载中..." class="loading-spin" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { getClassesApi } from "@/servers/api/classes";
import { useUserStore } from "@/store";
import { class_info } from "@/views/teacher/types";
import { message } from "ant-design-vue";
import { getClassExam, getClassScore } from "@/servers/api/grade";
import { useRouter } from "vue-router";
import { getPassLine } from "@/servers/api/analysis";
import { Row, Col, Card, Button } from "ant-design-vue";

interface ScoreItem {
  studentId: string;
  studentName: string;
  totalScore: number; 
  classRank: number;
  sumD: number; 
  [key: string]: any; 
}

interface ClassStats {
  totalScore: number;
  [key: string]: number; 
}

// 状态管理
const user = useUserStore();
const router = useRouter();
const classInfo = ref<class_info>();
const classExamList = ref<number[]>([]);
const selectedExamId = ref<number>(0);
const teacherId = ref<number>(0);
const scoreList = ref<ScoreItem[]>([]);
const loading = ref(false);
const passLine = ref(0);
const subjects = ref<string[]>([]);

// 班级统计数据
const classAvg = ref<ClassStats>({ totalScore: 0 });
const classMax = ref<ClassStats>({ totalScore: 0 });
const classMin = ref<ClassStats>({ totalScore: 0 });
const passRate = ref(0);

const subjectMap: Record<string, string> = {
  // 分数字段
  Yuwen: '语文',
  Shuxue: '数学',
  Yingyu: '英语',
  Wuli: '物理',
  Lishi: '历史',
  Huaxue: '化学',
  Shengwu: '生物',
  Zhengzhi: '政治',
  Dili: '地理',
  YuwenB: '语文班级排名',
  ShuxueB: '数学班级排名',
  YingyuB: '英语班级排名',
  WuliB: '物理班级排名',
  LishiB: '历史班级排名',
  HuaxueB: '化学班级排名',
  ShengwuB: '生物班级排名',
  ZhengzhiB: '政治班级排名',
  DiliB: '地理班级排名',
  YuwenD: '语文年级排名',
  ShuxueD: '数学年级排名',
  YingyuD: '英语年级排名',
  WuliD: '物理年级排名',
  LishiD: '历史年级排名',
  HuaxueD: '化学校级排名',
  ShengwuD: '生物年级排名',
  ZhengzhiD: '政治年级排名',
  DiliD: '地理年级排名',
};

const chineseSubjectOrder = [
  'Yuwen', 'Shuxue', 'Yingyu',
  'Lishi', 'Zhengzhi', 'Dili',
  'Wuli', 'Huaxue', 'Shengwu'
];

const sortFieldsByChinese = (fields: string[]) => {
  const scoreFields = fields.filter(field => !/[BD]$/.test(field));
  const rankFields = fields.filter(field => /[BD]$/.test(field));
  const sortedScoreFields = [...scoreFields].sort((a, b) => {
    const indexA = chineseSubjectOrder.indexOf(a);
    const indexB = chineseSubjectOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
  const sortedFields: string[] = [];
  sortedScoreFields.forEach(scoreField => {
    sortedFields.push(scoreField);
    if (rankFields.includes(`${scoreField}B`)) {
      sortedFields.push(`${scoreField}B`);  // 班级排名
    }
    if (rankFields.includes(`${scoreField}D`)) {
      sortedFields.push(`${scoreField}D`);  // 年级排名
    }
  });

  return sortedFields;
};

const columns = computed(() => {
  const baseColumns = [
    { title: '学号', dataIndex: 'studentId', key: 'studentId', width: 100 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 100 },
  ];
  const sortedSubjectFields = sortFieldsByChinese(subjects.value);
  const subjectColumns = sortedSubjectFields.map(field => ({
    title: subjectMap[field] || field,
    dataIndex: field,
    key: field,
    width: 120 
  }));
  const endColumns = [
    { title: '总分', dataIndex: 'totalScore', key: 'totalScore', width: 100 },
    { title: '班级排名', dataIndex: 'classRank', key: 'classRank', width: 100 },
    { title: '年级排名', dataIndex: 'sumD', key: 'sumD', width: 100 }
  ];

  return [...baseColumns, ...subjectColumns, ...endColumns];
});

// 获取成绩等级类名
const getScoreClass = (score: number) => {
  return score >= 90 ? 'excellent-score' : score >= 80 ? 'good-score' : 'normal-score';
};

const getRankClass = (rank: number) => {
  if (rank <= 3) return 'top-rank';
  if (rank <= 10) return 'good-rank';
  return '';
};

const calculateStats = (scores: ScoreItem[]) => {
  if (!scores.length) return;
  const stats: Record<string, number[]> = {
    totalScore: []
  };
  subjects.value.forEach(subject => {
    stats[subject] = [];
  });
  scores.forEach(item => {
    stats.totalScore.push(item.totalScore);
    subjects.value.forEach(subject => {
      stats[subject].push(item[subject] || 0);
    });
  });
  const avg: ClassStats = {
    totalScore: stats.totalScore.reduce((a, b) => a + b, 0) / stats.totalScore.length
  };
  subjects.value.forEach(subject => {
    avg[subject] = stats[subject].reduce((a, b) => a + b, 0) / stats[subject].length;
  });
  classAvg.value = avg;
  const max: ClassStats = {
    totalScore: Math.max(...stats.totalScore)
  };
  subjects.value.forEach(subject => {
    max[subject] = Math.max(...stats[subject]);
  });
  classMax.value = max;
  const min: ClassStats = {
    totalScore: Math.min(...stats.totalScore)
  };
  subjects.value.forEach(subject => {
    min[subject] = Math.min(...stats[subject]);
  });
  classMin.value = min;
  const passCount = stats.totalScore.filter(score => score >= passLine.value).length;
  passRate.value = Math.round((passCount / stats.totalScore.length) * 100);
};

// 获取对应考试的一本线
const fetchPassLine = async (examId: number) => {
  try {
    const res = await getPassLine({ exam_id: examId });
    if (res.data && res.data.length > 0) {
      // 根据科目判断文理科（示例：含物理则为理科，含历史则为文科）
      const isScience = subjects.value.includes('Wuli');
      const targetLine = res.data.find((line: any) => 
        isScience ? line.line_name.includes('物') : line.line_name.includes('史')
      );
      passLine.value = targetLine ? targetLine.sum_ : 0;
    }
  } catch (err) {
    console.error('获取一本线失败:', err);
    passLine.value = 0;
  }
};

const extractAllFields = (rawItem: any) => {
  const excludeFields = ['student_id', 'student_name', 'sum_', 'sumB', 'sumD', 'class_id', 'exam_id', 'id', 'school_id', 'show'];
  const allFields = Object.keys(rawItem);
  return allFields.filter(field => !excludeFields.includes(field));
};

const filterInvalidSubjects = (allFields: string[], rawData: any[]) => {
  const mainSubjects = allFields.filter(field => !/[BD]$/.test(field));
  const excludedFields: string[] = [];
  
  mainSubjects.forEach(subject => {
    const hasInvalid = rawData.some(item => {
      const score = item[subject] || 0;
      const classRank = item[`${subject}B`] || 0;
      return score === 0 && classRank === 1;
    });
    
    if (hasInvalid) {
      excludedFields.push(subject);
      excludedFields.push(`${subject}B`);
      excludedFields.push(`${subject}D`);
    }
  });
  
  return allFields.filter(field => !excludedFields.includes(field));
};

const handleExamChange = async (examId: number) => {
  if (!examId || !classInfo.value?.class_id) return;
  
  loading.value = true;
  try {
    const res = await getClassScore({
      class_id: classInfo.value.class_id,
      exam_id: examId
    });
    
    if (res.code === 200 && res.data.length > 0) {
      const rawData = res.data;
      const allFields = extractAllFields(rawData[0]);
      const validFields = filterInvalidSubjects(allFields, rawData);
      subjects.value = validFields; 
      const rawScores = rawData.map((item: any) => {
        const scoreItem: ScoreItem = {
          studentId: item.student_id,
          studentName: item.student_name,
          totalScore: item.sum_ || 0,
          classRank: 0,
          sumD: item.sumD || 0,
        };
        validFields.forEach(field => {
          scoreItem[field] = item[field] || 0;
        });
        return scoreItem;
      });
      const sortedScores = rawScores.sort((a: { totalScore: number; }, b: { totalScore: number; }) => b.totalScore - a.totalScore);
      sortedScores.forEach((item: { classRank: any; }, index: number) => {
        item.classRank = index + 1;
      });
      scoreList.value = sortedScores;
      await fetchPassLine(examId);
      calculateStats(scoreList.value);
    } else {
      message.error(res.data || '未获取到成绩数据');
      scoreList.value = [];
      subjects.value = [];
    }
  } catch (err) {
    message.error('获取成绩失败');
  } finally {
    loading.value = false;
  }
};

// 重置筛选
const resetFilters = () => {
  selectedExamId.value = classExamList.value.length > 0 ? classExamList.value[0] : 0;
  scoreList.value = [];
  subjects.value = [];
  classAvg.value = { totalScore: 0 };
  classMax.value = { totalScore: 0 };
  classMin.value = { totalScore: 0 };
  passRate.value = 0;
  passLine.value = 0;
  
  if (selectedExamId.value) {
    handleExamChange(selectedExamId.value);
  }
};

onMounted(async () => {
  teacherId.value = user.getUserInfo().role;
  if (!teacherId.value) {
    message.error('未获取到教师信息');
    return;
  }

  try {
    // 获取班级信息
    const classRes = await getClassesApi({ header: teacherId.value });
    if (classRes.code === 200 && classRes.data.length > 0) {
      classInfo.value = {
        header: classRes.data[0].header,
        class_id: classRes.data[0].id,
        name: classRes.data[0].name,
        school_id: classRes.data[0].school_id
      };

      // 获取班级考试列表
      const examRes = await getClassExam({ class_id: classInfo.value.class_id });
      if (examRes.code === 200 && examRes.data.length > 0) {
        classExamList.value = examRes.data;

        // 默认选择第一个考试
        if (classExamList.value.length > 0) {
          selectedExamId.value = classExamList.value[0];
          await handleExamChange(selectedExamId.value);
        }
      } else {
        message.error(examRes.msg || '获取考试列表失败');
      }
    } else {
      message.error(classRes.msg || '未查询到班级信息');
    }
  } catch (err) {
    message.error('初始化失败');
  }
});
</script>

<style scoped lang="less">
.class-grade-container {
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
  }
  
  .stats-section {
    margin-bottom: 20px;
    
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
        margin-bottom: 8px;
        flex: 1;
        display: flex;
        align-items: center;
      }
    }
    
    .avg-score-card {
      border-top: 4px solid #1890ff;
      
      .card-value {
        color: #1890ff;
      }
    }
    
    .max-score-card {
      border-top: 4px solid #52c41a;
      
      .card-value {
        color: #52c41a;
      }
    }
    
    .min-score-card {
      border-top: 4px solid #fa8c16;
      
      .card-value {
        color: #fa8c16;
      }
    }
    
    .pass-line-card {
      border-top: 4px solid #722ed1;
      
      .card-value {
        color: #722ed1;
      }
    }
    
    .pass-rate-card {
      border-top: 4px solid #eb2f96;
      
      .card-value {
        color: #eb2f96;
      }
    }
    
    .student-count-card {
      border-top: 4px solid #13c2c2;
      
      .card-value {
        color: #13c2c2;
      }
    }
  }
  
  .table-section {
    .score-card {
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
  
  .pass {
    color: #52c41a;
    font-weight: bold;
  }
  
  .fail {
    color: #f5222d;
    font-weight: bold;
  }
}

@media (max-width: 768px) {
  .class-grade-container {
    padding: 10px;
    
    .filter-section {
      .filter-item {
        margin-bottom: 10px;
        
        .filter-label {
          width: 60px;
        }
      }
    }
    
    .stats-section {
      .summary-card {
        padding: 12px;
        
        .card-title {
          font-size: 12px;
        }
        
        .card-value {
          font-size: 20px;
        }
      }
    }
  }
}
</style>
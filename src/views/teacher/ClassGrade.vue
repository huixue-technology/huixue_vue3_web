<template>
  <div class="class-grade-container">
    <div class="header">
      <h2>{{classInfo?.name}}班级成绩分析</h2>
    </div>

    <div class="filter-section">
      <a-select 
        v-model:value="selectedExamId" 
        placeholder="选择考试" 
        style="width: 200px"
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

    <div class="stats-card">
      <div class="stat-item">
        <p>班级平均分</p>
        <p class="stat-value">{{ classAvg.totalScore.toFixed(1) }}</p>
      </div>
      <div class="stat-item">
        <p>最高分</p>
        <p class="stat-value">{{ classMax.totalScore }}</p>
      </div>
      <div class="stat-item">
        <p>最低分</p>
        <p class="stat-value">{{ classMin.totalScore }}</p>
      </div>
      <div class="stat-item">
        <p>一本线</p>
        <p class="stat-value">{{ passLine }}</p>
      </div>
      <div class="stat-item">
        <p>一本率</p>
        <p class="stat-value">{{ passRate }}%</p>
      </div>
    </div>

    <div class="table-scroll-container">
      <div class="table-container">
        <a-table
            :columns="columns"
            :data-source="scoreList"
            bordered
            row-key="studentId"
            :pagination="{ pageSize: 6 }"
        >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'totalScore'">
            <span :class="record.totalScore >= passLine ? 'pass' : 'fail'">
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
    </div>

    <a-spin v-if="loading" class="loading" size="large" />
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
  position:relative;
  height: 100vh;
  overflow:scroll;
  padding: 20px;
  padding-bottom: 0px;
  
  .table-scroll-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-bottom: 20px;
    max-height: calc(100vh - 300px);
    scrollbar-width: thin;
    max-width: calc(100vw - 40px);
  }

  .table-container {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    min-width: 768px;
  }

  .header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      color: #333;
    }
  }

  .filter-section {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
  }

  .stats-card {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 20px;

    .stat-item {
      flex: 1;
      min-width: 120px;
      background: #fff;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      p {
        margin: 0 0 8px 0;
        color: #666;
        font-size: 14px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #1890ff;
      }
    }
  }

  .loading {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .pass {
    color: green;
  }

  .fail {
    color: red;
  }

  .top-rank {
    color: #f50;
    font-weight: bold;
  }

  .good-rank {
    color: #1890ff;
  }
}

@media (max-width: 768px) {
  .class-grade-container {
      padding: 10px;
      overflow-x: hidden;
    }
  
    .table-scroll-container {
      max-width: calc(100vw - 20px);
    }

  .filter-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    a-select {
      width: 100% !important;
      margin-left: 0 !important;
    }
  }

  .stats-card {
    gap: 10px;

    .stat-item {
      flex: 1 0 calc(50% - 10px);
      min-width: auto;
      padding: 10px 5px;

      p {
        font-size: 12px;
      }

      .stat-value {
        font-size: 18px;
      }
    }
  }

  .table-container {
    min-width: 320px;
    padding: 8px;
  }

  :deep(.ant-table th) {
    padding: 8px 4px !important;
    font-size: 12px !important;
  }

  :deep(.ant-table td) {
    padding: 8px 4px !important;
    font-size: 12px !important;
  }

  .columns {
    &[data-index="studentId"],
    &[data-index="studentName"] {
      width: 80px !important;
    }
    &[data-index="totalScore"],
    &[data-index="classRank"] {
      width: 70px !important;
    }
  }
}
</style>
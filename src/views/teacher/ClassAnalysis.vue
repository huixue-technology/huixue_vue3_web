<template>
  <div class="class-analysis-container">
    <div class="header">
      <h2>班级分析</h2>
      <p>选择考试查看班级分析详情</p>
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
              :disabled="loading"
            >
              <a-select-option
                v-for="exam in examList"
                :key="exam"
                :value="exam"
              >
                考试{{ exam }}
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

    <!-- 分析数据展示 -->
    <div v-if="!loading" class="analysis-content">
      <div class="analysis-card full-width">
        <a-card title="优秀学生及成绩详情" class="student-card">
          <a-table
            :data-source="formattedExcellentStudents"
            bordered
            :columns="excellentStudentColumns"
            pagination="false"
            :expandable="{
              expandedRowKeys: excellentExpandedRowKeys,
              onExpand: (expanded: boolean, record: any) => handleExcellentExpand(expanded, record)
            }"
          >
            <!-- 优秀学生展开行内容：科目详情 -->
            <template #expandedRowRender="{ record }">
              <div class="expanded-detail">
                <a-table
                  :data-source="getSubjectDetails(record)"
                  bordered
                  :columns="subjectDetailColumns"
                  pagination="false"
                  :show-header="true"
                />
              </div>
            </template>
          </a-table>
        </a-card>
      </div>

      <!-- 待关注学生 -->
      <div class="analysis-card full-width">
        <a-card title="待关注学生及成绩详情" class="student-card">
          <a-table
            :data-source="formattedDangerStudents"
            bordered
            :columns="dangerStudentColumns"
            pagination="false"
            :expandable="{
              expandedRowKeys: dangerExpandedRowKeys,
              onExpand: (expanded: boolean, record: any) => handleDangerExpand(expanded, record)
            }"
          >
            <!-- 待关注学生展开行内容：科目详情 -->
            <template #expandedRowRender="{ record }">
              <div class="expanded-detail">
                <a-table
                  :data-source="getSubjectDetails(record)"
                  bordered
                  :columns="subjectDetailColumns"
                  pagination="false"
                  :show-header="true"
                />
              </div>
            </template>
          </a-table>
        </a-card>
      </div>

      <!-- 分段统计卡片容器 -->
      <div class="segment-analysis-container">
        <!-- 主科分段统计 -->
        <div class="analysis-card segment-card">
          <a-card title="主科成绩分段统计（满分150分）" class="chart-card">
            <div class="table-container">
              <a-table
                :data-source="mainScoreSectionsData"
                :columns="mainScoreSectionsColumns"
                bordered
                pagination="false"
                :scroll="{ x: 'max-content' }"
              />
            </div>
          </a-card>
        </div>

        <!-- 副科分段统计 -->
        <div class="analysis-card segment-card">
          <a-card title="副科成绩分段统计（满分100分）" class="chart-card">
            <div class="table-container">
              <a-table
                :data-source="selectScoreSectionsData"
                :columns="selectScoreSectionsColumns"
                bordered
                pagination="false"
                :scroll="{ x: 'max-content' }"
              />
            </div>
          </a-card>
        </div>

        <!-- 总分分段统计 -->
        <div class="analysis-card segment-card">
          <a-card title="总分分段统计（满分750分）" class="chart-card">
            <div class="table-container">
              <a-table
                :data-source="formattedScoreSections"
                bordered
                :columns="sectionColumns"
                pagination="false"
                :scroll="{ x: 'max-content' }"
              />
            </div>
          </a-card>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <a-spin v-if="loading" tip="加载中..." class="loading-spin" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getClassExam } from '@/servers/api/grade';
import { getClassAnalysis } from '@/servers/api/analysis';
import { getClassesApi } from '@/servers/api/classes';
import { message } from 'ant-design-vue';
import { useUserStore } from '@/store';
import { Row, Col, Card, Button } from "ant-design-vue";

// 状态定义
const userStore = useUserStore();
const classId = ref<number>(0);
const teacherId = ref<number>(0);
const examList = ref<any[]>([]);
const selectedExamId = ref<number>(0);
const loading = ref(false);

// 展开行状态管理（分别管理优秀学生和待关注学生的展开状态）
const excellentExpandedRowKeys = ref<string[]>([]);
const dangerExpandedRowKeys = ref<string[]>([]);

// 科目名称映射表
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

// 班级分析数据
const classAnalysisData = ref({
  danger_student: [] as any[],
  excellent_student: [] as any[],
  main_score_section: [] as any[],
  select_score_section: [] as any[],
  sum_score_section: [] as any[],
});

// 格式化优秀学生数据
const formattedExcellentStudents = computed(() => {
  return classAnalysisData.value.excellent_student.map(student => ({
    ...student,
    student_name: student.student_name || '未知',
    sum_: student.sum_ ?? 0,
    sumB: student.sumB ?? 0,
    sumD: student.sumD ?? 0,
    key: student.student_id || student.id 
  }));
});

const formattedDangerStudents = computed(() => {
  return classAnalysisData.value.danger_student.map(student => ({
    ...student,
    student_name: student.student_name || student.name || '未知',
    sum_: student.sum_ ?? student.totalScore ?? 0,
    sumB: student.sumB ?? 0,
    sumD: student.sumD ?? 0,
    key: student.student_id || student.id 
  }));
});

const getSubjectDetails = (student: any) => {
  if (!student) return [];
  
  const details: any[] = [];
  
  // 遍历所有科目
  Object.entries(subjectMap).forEach(([enSubject, cnSubject]) => {
    const score = student[enSubject] ?? 0;
    const classRank = student[`${enSubject}B`] ?? 0;
    const gradeRank = student[`${enSubject}D`] ?? 0;
    
    // 只添加有成绩的科目（排除0分但排名为1的情况，可能是未选考科目）
    if (!(score === 0 && classRank === 1)) {
      details.push({
        key: `${student.student_id}-${enSubject}`,
        subject: cnSubject,
        score,
        classRank,
        gradeRank
      });
    }
  });
  
  return details;
};

// 主科分数段数据处理
const mainScoreSectionsData = computed(() => {
  const result: any[] = [];
  
  // 获取所有分数段范围（去重并排序）
  const allRanges = new Set<string>();
  
  // 收集主科数据
  classAnalysisData.value.main_score_section.forEach((subjectObj: any) => {
    Object.entries(subjectObj).forEach(([enSubject, sections]) => {
      (sections as any[]).forEach((section: any) => {
        const range = Object.keys(section)[0];
        allRanges.add(range);
      });
    });
  });
  
  // 将分数段按从高到低排序
  const sortedRanges = Array.from(allRanges).sort((a, b) => {
    const aMin = parseInt(a.split('-')[0]);
    const bMin = parseInt(b.split('-')[0]);
    return bMin - aMin;
  });
  
  // 为每个分数段创建一行数据
  sortedRanges.forEach(range => {
    const row: any = { range };
    
    // 添加主科数据
    classAnalysisData.value.main_score_section.forEach((subjectObj: any) => {
      Object.entries(subjectObj).forEach(([enSubject, sections]) => {
        const cnSubject = subjectMap[enSubject as keyof typeof subjectMap] || enSubject;
        const section = (sections as any[]).find((s: any) => Object.keys(s)[0] === range);
        row[enSubject] = section ? section[range] : 0;
      });
    });
    
    result.push(row);
  });
  
  return result;
});

// 副科分数段数据处理
const selectScoreSectionsData = computed(() => {
  const result: any[] = [];
  
  // 获取所有分数段范围（去重并排序）
  const allRanges = new Set<string>();
  
  // 收集选考科目数据
  classAnalysisData.value.select_score_section.forEach((subjectObj: any) => {
    Object.entries(subjectObj).forEach(([enSubject, sections]) => {
      (sections as any[]).forEach((section: any) => {
        const range = Object.keys(section)[0];
        allRanges.add(range);
      });
    });
  });
  
  // 将分数段按从高到低排序
  const sortedRanges = Array.from(allRanges).sort((a, b) => {
    const aMin = parseInt(a.split('-')[0]);
    const bMin = parseInt(b.split('-')[0]);
    return bMin - aMin;
  });
  
  // 为每个分数段创建一行数据
  sortedRanges.forEach(range => {
    const row: any = { range };
    
    // 添加选考科目数据
    classAnalysisData.value.select_score_section.forEach((subjectObj: any) => {
      Object.entries(subjectObj).forEach(([enSubject, sections]) => {
        const cnSubject = subjectMap[enSubject as keyof typeof subjectMap] || enSubject;
        const section = (sections as any[]).find((s: any) => Object.keys(s)[0] === range);
        row[enSubject] = section ? section[range] : 0;
      });
    });
    
    result.push(row);
  });
  
  return result;
});

// 主科表格列定义
const mainScoreSectionsColumns = computed(() => [
  { 
    title: '分数段', 
    dataIndex: 'range', 
    fixed: 'left',
    width: 120
  },
  ...classAnalysisData.value.main_score_section.flatMap((subjectObj: any) => 
    Object.keys(subjectObj).map(enSubject => {
      const cnSubject = subjectMap[enSubject as keyof typeof subjectMap] || enSubject;
      return {
        title: cnSubject,
        dataIndex: enSubject,
        align: 'center',
        width: 100
      };
    })
  )
]);

// 副科表格列定义
const selectScoreSectionsColumns = computed(() => [
  { 
    title: '分数段', 
    dataIndex: 'range', 
    fixed: 'left',
    width: 120
  },
  ...classAnalysisData.value.select_score_section.flatMap((subjectObj: any) => 
    Object.keys(subjectObj).map(enSubject => {
      const cnSubject = subjectMap[enSubject as keyof typeof subjectMap] || enSubject;
      return {
        title: cnSubject,
        dataIndex: enSubject,
        align: 'center',
        width: 100
      };
    })
  )
]);

// 格式化分数段数据
const formattedScoreSections = computed(() => {
  // 对总分分数段进行倒序处理
  const reversedSections = [...classAnalysisData.value.sum_score_section].reverse();
  return reversedSections.map((record: any, index: number) => {
    const key = Object.keys(record)[0] || '';
    const value = Object.values(record)[0] ?? 0;
    return { key: index, range: key, count: value };
  });
});

// 表格列定义
const excellentStudentColumns = [
  { title: '姓名', dataIndex: 'student_name' },
  { title: '总分', dataIndex: 'sum_' },
  { title: '班级排名', dataIndex: 'sumB' },
  { title: '年级排名', dataIndex: 'sumD' }
];

const dangerStudentColumns = [
  { title: '姓名', dataIndex: 'student_name' },
  { title: '总分', dataIndex: 'sum_' },
  { title: '班级排名', dataIndex: 'sumB' },
  { title: '年级排名', dataIndex: 'sumD' }
];

// 分数段表格列（主科/副科/总分通用）
const sectionColumns = [
  { title: '分数段', dataIndex: 'range' },
  { title: '人数', dataIndex: 'count' }
];

// 学生科目详情表格列
const subjectDetailColumns = [
  { title: '科目', dataIndex: 'subject', width: 100 },
  { title: '成绩', dataIndex: 'score', width: 100 },
  { title: '班级排名', dataIndex: 'classRank', width: 120 },
  { title: '年级排名', dataIndex: 'gradeRank', width: 120 }
];

// 处理优秀学生展开/折叠事件
const handleExcellentExpand = (expanded: boolean, record: any) => {
  if (expanded) {
    excellentExpandedRowKeys.value = [record.key];
  } else {
    excellentExpandedRowKeys.value = [];
  }
};

// 处理待关注学生展开/折叠事件
const handleDangerExpand = (expanded: boolean, record: any) => {
  if (expanded) {
    dangerExpandedRowKeys.value = [record.key];
  } else {
    dangerExpandedRowKeys.value = [];
  }
};

// 重置筛选
const resetFilters = () => {
  if (examList.value.length > 0) {
    selectedExamId.value = examList.value[0];
    fetchClassAnalysis();
  }
};

// 初始化流程
onMounted(async () => {
  try {
    const userInfo = userStore.getUserInfo();
    const header = userInfo?.teacher?.uid;
    if (!header) {
      message.error('未获取到教师信息');
      return;
    }

    loading.value = true;
    const classRes = await getClassesApi({ header: header });
    if (classRes.code !== 200 || !classRes.data.length) {
      message.error('未查询到教师关联的班级信息');
      return;
    }

    teacherId.value = classRes.data[0].header;
    classId.value = classRes.data[0].id;
    await fetchExamList();
  } catch (err) {
    message.error('初始化失败');
    console.error(err);
  } finally {
    loading.value = false;
  }
});

// 获取考试列表
const fetchExamList = async () => {
  try {
    loading.value = true;
    const res = await getClassExam({ class_id: classId.value });
    if (res.code === 200 && res.data.length > 0) {
      examList.value = res.data;
      selectedExamId.value = res.data[0];
      await fetchClassAnalysis();
    } else {
      message.warning('该班级暂无考试数据');
    }
  } catch (err) {
    message.error('获取考试列表失败');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 获取班级分析数据
const fetchClassAnalysis = async () => {
  if (!selectedExamId.value || !classId.value) return;

  try {
    loading.value = true;
    const res = await getClassAnalysis({
      class_id: classId.value,
      exam_id: selectedExamId.value,
    });
    if (res.code === 200) {
      classAnalysisData.value = {
        danger_student: res.data.danger_student || [],
        excellent_student: res.data.excellent_student || [],
        main_score_section: res.data.main_score_section || [],
        select_score_section: res.data.select_score_section || [],
        sum_score_section: res.data.sum_score_section || [],
      };
    } else {
      message.error('获取班级分析数据失败');
    }
  } catch (err) {
    message.error('请求班级分析接口出错');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 处理考试选择变化
const handleExamChange = async (examId: number) => {
  selectedExamId.value = examId;
  await fetchClassAnalysis();
};
</script>

<style scoped>
.class-analysis-container {
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  overflow-y: auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  font-size: 16px; /* 设置基础字体大小 */
}

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

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.analysis-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.analysis-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.full-width {
  width: 100%;
}

.segment-analysis-container {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.segment-card {
  flex: 1;
  min-width: 300px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%);
}

.student-card, .chart-card {
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

.loading-spin {
  display: flex;
  justify-content: center;
  margin: 50px 0;
}

.expanded-detail {
  margin: 16px 0 0 48px;
}

/* 表格容器样式，确保可以横向滚动 */
.table-container {
  overflow-x: auto;
  width: 100%;
  padding: 10px 0;
}

/* 表格样式优化 */
:deep(.ant-table-thead > tr > th) {
  background: linear-gradient(180deg, #f0f5ff 0%, #e6f0ff 100%);
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #d6e4ff;
  text-align: center;
  font-size: 16px; /* 设置表头字体大小 */
}

:deep(.ant-table-tbody > tr > td) {
  text-align: center;
  font-size: 16px; /* 设置表格内容字体大小 */
  padding: 12px 8px; /* 增加单元格内边距 */
}

:deep(.ant-table-tbody > tr:hover) {
  background-color: #f0f8ff;
}

:deep(.ant-table) {
  min-width: 100%;
}

:deep(.ant-table-bordered .ant-table-thead > tr > th) {
  border-right: 1px solid #d6e4ff;
}

:deep(.ant-table-bordered .ant-table-tbody > tr > td) {
  border-right: 1px solid #f0f0f0;
}

/* 优秀学生和待关注学生标题颜色 */
.student-card:first-child :deep(.ant-card-head) {
  background: linear-gradient(120deg, #e6f7ff, #d1e9ff);
}

.student-card:nth-child(2) :deep(.ant-card-head) {
  background: linear-gradient(120deg, #fff7e6, #ffe7ba);
}

/* 分段统计卡片标题颜色 */
.segment-card:nth-child(1) :deep(.ant-card-head) {
  background: linear-gradient(120deg, #e6f7ff, #d1e9ff);
}

.segment-card:nth-child(2) :deep(.ant-card-head) {
  background: linear-gradient(120deg, #f6ffed, #d9f7be);
}

.segment-card:nth-child(3) :deep(.ant-card-head) {
  background: linear-gradient(120deg, #f9f0ff, #efdbff);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .segment-analysis-container {
    flex-direction: column;
  }
  
  .segment-card {
    min-width: 100%;
  }
}

@media (max-width: 768px) {
  .class-analysis-container {
    padding: 12px;
    font-size: 14px; /* 小屏幕下适当减小字体 */
  }
  
  .analysis-card {
    padding: 16px;
  }
  
  :deep(.ant-card-head-title) {
    font-size: 16px;
  }
  
  :deep(.ant-table-thead > tr > th),
  :deep(.ant-table-tbody > tr > td) {
    font-size: 14px; /* 小屏幕下调整表格字体 */
    padding: 8px 4px;
  }
}
</style>
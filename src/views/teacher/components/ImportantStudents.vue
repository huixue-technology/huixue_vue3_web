<template>
  <div class="section">
    <a-row>
      <div class="section-title">重点关注学生</div>
      <!-- 添加选择器 -->
      <div class="selector-container">
        <a-select 
          v-model:value="selectedChart" 
          style="width: 100%" 
          :options="chartOptions"
        >
        </a-select>
      </div>
    </a-row>
    
    <!-- 显示选中的图表 -->
    <a-row :gutter="16">
      <a-col :span="24">
        <a-card class="chart-card" :title="currentChartTitle">
          <div class="chart-wrapper">
            <a-table
              :columns="tableColumns"
              :data-source="tableData"
              :pagination="false"
              :scroll="{ y: 300 }"
            >
            </a-table>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getStudentApi } from '@/servers/api/student';

// 定义科目映射
const subjectMap = {
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

const props = defineProps<{
  classAnalysisData: any;
  subjectMap: Record<string, string>;
}>();

const selectedChart = ref('top');
const chartOptions = [
  { label: '经常排名靠前的学生', value: 'top' },
  { label: '经常吊车尾的学生', value: 'bottom' }
];

const currentChartTitle = computed(() => {
  const option = chartOptions.find(opt => opt.value === selectedChart.value);
  return option ? option.label : '学生统计';
});

// 表格列定义
const tableColumns = computed(() => {
  return [
    { title: '总分', dataIndex: 'sum_', key: 'sum_', width: 60 },
    { title: '语文', dataIndex: 'yuwen', key: 'yuwen', width: 60 },
    { title: '数学', dataIndex: 'shuxue', key: 'shuxue', width: 60 },
    { title: '英语', dataIndex: 'yingyu', key: 'yingyu', width: 60 },
    { title: '物理', dataIndex: 'wuli', key: 'wuli', width: 60 },
    { title: '化学', dataIndex: 'huaxue', key: 'huaxue', width: 60 },
    { title: '生物', dataIndex: 'shengwu', key: 'shengwu', width: 60 },
    { title: '历史', dataIndex: 'lishi', key: 'lishi', width: 60 },
    { title: '政治', dataIndex: 'zhengzhi', key: 'zhengzhi', width: 60 },
    { title: '地理', dataIndex: 'dili', key: 'dili', width: 60 }
  ];
});

// 表格数据
const tableData = ref<any[]>([]);

// 存储班级学生信息
const classStudents = ref<Record<string, string>>({});

// 获取班级学生列表
const fetchClassStudents = async (classId: number) => {
  try {
    const res = await getStudentApi({ class_id: classId });
    if (res.code === 200 && res.data) {
      // 创建学号到姓名的映射
      const studentMap: Record<string, string> = {};
      res.data.forEach((student: any) => {
        studentMap[student.uid] = student.name;
      });
      classStudents.value = studentMap;
    }
  } catch (err) {
    console.error('获取班级学生列表失败:', err);
  }
};

// 处理数据并生成表格内容
const processData = () => {
  tableData.value = [];
  
  if (!props.classAnalysisData || !props.classAnalysisData.top_student || !props.classAnalysisData.bottom_student) {
    return;
  }

  const studentData = selectedChart.value === 'top' 
    ? props.classAnalysisData.top_student 
    : props.classAnalysisData.bottom_student;

  // 遍历每个科目
  Object.entries(subjectMap).forEach(([enSubject, cnSubject]) => {
    // 获取该科目的学生学号列表
    const studentIds = studentData[enSubject] || [];
    console.log(`Subject: ${cnSubject}, Student IDs: ${studentIds}`);
    // 为每个学生创建一行数据
    studentIds.forEach((studentId: string) => {
      tableData.value.push({
        key: `${enSubject}-${studentId}`,
        subject: cnSubject,
        studentId: studentId,
        studentName: classStudents.value[studentId] || '未知'
      });
    });
  });
};

// 监听选中图表的变化
watch(selectedChart, () => {
  processData();
});

// 监听数据变化
watch(() => props.classAnalysisData, async (newData) => {
  if (newData && newData.class_id) {
    // 获取班级学生信息
    await fetchClassStudents(newData.class_id);
    // 处理数据
    processData();
  }
}, { immediate: true });

</script>

<style scoped lang="less">
.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 4px solid #1890ff;
}

.selector-container {
  margin-bottom: 16px;
  padding: 0 8px;
}

.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  :deep(.ant-card-body) {
    height: 400px;
  }
  :deep(.ant-card-head) {
    border-bottom: 1px solid #f0f0f0;
  }
  :deep(.ant-card-head-title) {
    font-size: 16px;
    font-weight: 500;
  }
}

.chart-wrapper {
  height: 360px;
  width: 100%;
}
</style>
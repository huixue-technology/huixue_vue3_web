<template>
  <div class="container">
    <div class="header">
      <h2>班级综合分析</h2>
      <a-space>
        <a-select
          v-model:value="selectedClass"
          placeholder="请选择班级"
          style="width: 200px;"
        >
          <a-select-option v-for="item in classList" :key="item.id" :value="item.id">
            {{ item.name }}
          </a-select-option>
        </a-select>
        <a-button type="primary" @click="batchComputeData">查询数据</a-button>
      </a-space>
    </div>
    <a-spin :spinning="loading">
      <!-- 学生过线率统计 -->
      <ClassAnalysis 
        ref="classAnalysisRef"
        :class-id="selectedClass"
      />
      
      <!-- 分数线过线率 -->
      <PassLineRate 
        :pass-line-rate-data="passLineRateData" 
        :class-info="currentClassInfo"
      />
      
      <!-- 分数线对比表格 -->
      <a-card class="compare-card" title="分数线对比表">
        <a-table
          :columns="compareColumns"
          :data-source="compareTableData"
          :pagination="false"
          bordered
          size="middle"
          row-key="key"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'score'">
              <span v-if="record.score !== null && record.score !== undefined">{{ record.score }}</span>
              <span v-else class="empty-value">-</span>
            </template>
            <template v-else-if="column.dataIndex === 'count'">
              <span>{{ record.count ?? 0 }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'rate'">
              <span>{{ record.rate ?? 0 }}%</span>
            </template>
            <template v-else-if="column.dataIndex === 'average'">
              <span v-if="record.average !== null && record.average !== undefined">{{ record.average }}</span>
              <span v-else class="empty-value">-</span>
            </template>
            <template v-else-if="column.dataIndex === 'max'">
              <span v-if="record.max !== null && record.max !== undefined">{{ record.max }}</span>
              <span v-else class="empty-value">-</span>
            </template>
          </template>
        </a-table>
        <a-alert
          v-if="showEmptyTip"
          message="提示"
          description="部分分数线数据（如211、985、清北）需要后台先配置分数线。当前考试可能只配置了特控线。"
          type="info"
          show-icon
          closable
          style="margin-top: 12px;"
        />
      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue';
import { 
  postClassAnalysis,
  postClassPassLineRate,
  postClassComprehensiveStudentGrades 
} from '@/servers/api/average';
import { getPassLine } from '@/servers/api/analysis';
import { useUserStore } from '@/store';
import { message } from 'ant-design-vue';
import { getClassesApi } from '@/servers/api/classes';
// 导入子组件
import ClassAnalysis from './ClassAnalysis.vue';
import PassLineRate from './components/PassLineRate.vue';

interface ClassInfo {
  id: number;
  name: string;
  header: string | null;
  school_id: string | null;
  subject_selection: string; // 新增：科目选择
}

interface TeacherInfo {
  uid: string;
  name: string;
  email: string;
  phone: string;
  school_id: string;
}

const userStore = useUserStore();
const loading = ref(false);
const selectedClass = ref<number>(0);
const classList = ref<ClassInfo[]>([]);
const teacherInfo = ref<TeacherInfo>();
const classAnalysisData = ref<any>({});
const passLineRateData = ref<any>({});
const studentGradesData = ref<any[]>([]);
const classAnalysisRef = ref<any>(null); // 子组件引用
const passLineConfigData = ref<any[]>([]); // 分数线配置数据
const showEmptyTip = ref(false); // 显示空数据提示

// 计算当前班级信息
const currentClassInfo = computed((): ClassInfo | undefined => {
  return classList.value.find(item => item.id === selectedClass.value);
});

onMounted(async()=>{
  // 获取班级列表，并设置默认班级
  const userInfo = userStore.getUserInfo();
  teacherInfo.value = userInfo?.teacher
  if (!teacherInfo.value) {
    message.error('未获取到教师信息');
    return;
  }
  await getClassList(userInfo);
  if (selectedClass.value > 0) {
    loading.value = true;
    await batchComputeData();
    loading.value = false;
  }
})

watch(selectedClass, async () => {
  if (selectedClass.value > 0) {
    await batchComputeData();
  }
});

const batchComputeData = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  loading.value = true;
  
  try {
    // 并行请求所有数据
    await Promise.all([
      getClassAnalysisfunc(),
      getClassPassLineRatefunc(),
      getClassComprehensiveStudentGradesfunc(),
      fetchPassLineConfig()
    ]);
    
    // 刷新子组件（学生过线率统计）
    if (classAnalysisRef.value && classAnalysisRef.value.refresh) {
      await classAnalysisRef.value.refresh();
    }
  } catch (err) {
    console.error('获取数据失败:', err);
  } finally {
    loading.value = false;
  }
};

const getClassList = async (userInfo: any) => {
  const teacherHeader = String(userInfo?.role || userInfo?.teacher?.uid || '').trim();

  let classes: ClassInfo[] = [];

  if (teacherHeader) {
    const classRes = await getClassesApi({ header: teacherHeader });
    if (classRes.code === 200 && classRes.data.length > 0) {
      classes = classRes.data;
    }
  }

  // 兼容未绑定班主任的老师账号：回退全班级（可按学校过滤）
  if (classes.length === 0) {
    const allClassRes = await getClassesApi({});
    if (allClassRes.code === 200 && Array.isArray(allClassRes.data)) {
      classes = allClassRes.data;
    }
  }

  if (classes.length > 0) {
    selectedClass.value = classes[0].id;
    classList.value = classes;
  } else {
    message.error('获取班级列表失败');
    selectedClass.value = 0;
    classList.value = [];
  }
}

const getClassAnalysisfunc = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  // 班级综合分析
  const res = await postClassAnalysis({ class_ids: [selectedClass.value] });
  
  if (res.code === 200) {
    classAnalysisData.value = res.data || {};
  } else {
    console.error('获取班级综合分析失败', res);
  }
};

const getClassPassLineRatefunc = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  // 四条分数线过线率
  const res = await postClassPassLineRate({ class_ids: [selectedClass.value] });
  
  if (res.code === 200) {
    passLineRateData.value = res.data || {};
  } else {
    console.error('获取四条分数线过线率失败', res);
  }
};

const getClassComprehensiveStudentGradesfunc = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  // 根据考试分数线判断优等生、边缘生、差生
  const res = await postClassComprehensiveStudentGrades({ class_ids: [selectedClass.value] });
  
  if (res.code === 200) {
    studentGradesData.value = res.data || [];
  } else {
    console.error('根据考试分数线判断优等生、边缘生、差生失败', res);
  }
};

// 获取分数线配置
const fetchPassLineConfig = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  
  // 获取班级的考试信息来拿到 exam_id
  const currentClass = classList.value.find(c => c.id === selectedClass.value);
  if (!currentClass) return;
  
  // 尝试获取分数线配置（需要 exam_id，这里先获取班级关联的考试）
  // 由于 getPassLine 需要 exam_id，我们从 classAnalysisData 中获取
  if (classAnalysisData.value && classAnalysisData.value.exam_id) {
    try {
      const res = await getPassLine({ exam_id: classAnalysisData.value.exam_id });
      if (res.code === 200 && res.data) {
        // 处理返回的分页数据
        passLineConfigData.value = res.data.records || res.data.list || res.data || [];
      }
    } catch (err) {
      console.error('获取分数线配置失败:', err);
      passLineConfigData.value = [];
    }
  }
};

// 定义表格列
const compareColumns = [
  { title: '层次', dataIndex: 'level', width: 100, align: 'center' },
  { title: '分数线', dataIndex: 'score', width: 100, align: 'center' },
  { title: '进线人数', dataIndex: 'count', width: 100, align: 'center' },
  { title: '进线率', dataIndex: 'rate', width: 100, align: 'center' },
  { title: '平均分', dataIndex: 'average', width: 100, align: 'center' },
  { title: '最高分', dataIndex: 'max', width: 100, align: 'center' },
];

// 分数线配置映射关系
const lineConfig = [
  { key: 'pass_rate', level: '特控线', lineName: '特控线' },
  { key: 'top2_rate', level: '211', lineName: '211线' },
  { key: 'top9_rate', level: '985', lineName: '985线' },
  { key: 'top_rate', level: '清北', lineName: '清北线' },
];

// 从 passLineConfigData 中查找对应层次的分数线
const findPassLineScore = (lineName: string): number | null => {
  if (!passLineConfigData.value || passLineConfigData.value.length === 0) {
    return null;
  }
  
  // 匹配分数线名称（模糊匹配）
  const matched = passLineConfigData.value.find((item: any) => {
    const name = item.line_name || item.lineName || '';
    return name.includes(lineName) || name.includes(lineName.replace('线', ''));
  });
  
  return matched ? (matched.score ?? null) : null;
};

// 构建表格数据
const compareTableData = computed(() => {
  const result: any[] = [];
  let hasEmptyData = false;
  
  lineConfig.forEach(config => {
    const rateData = passLineRateData.value?.[config.key] || {};
    const sumData = rateData['总分'] || {};
    
    const count = sumData.sum_ ?? 0;
    const rate = sumData.rate_ ?? 0;
    const average = sumData.average ?? null;
    const maxScore = sumData.max ?? null;
    const score = findPassLineScore(config.lineName);
    
    // 检查是否有数据
    if (score === null && count === 0 && rate === 0 && average === null) {
      hasEmptyData = true;
    }
    
    result.push({
      key: config.key,
      level: config.level,
      score: score,
      count: count,
      rate: rate,
      average: average,
      max: maxScore,
    });
  });
  
  showEmptyTip.value = hasEmptyData;
  
  return result;
});

</script>

<style scoped lang="less">
.container {
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

  .compare-card {
    margin-top: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    :deep(.ant-card-body) {
      padding: 16px;
    }
    
    :deep(.ant-table-thead > tr > th) {
      background: linear-gradient(180deg, #f0f5ff 0%, #e6f0ff 100%);
      font-weight: 600;
      color: #2c3e50;
      text-align: center;
    }
    
    :deep(.ant-table-tbody > tr > td) {
      text-align: center;
      font-size: 15px;
    }
  }

  .empty-value {
    color: #bfbfbf;
  }
}
</style>

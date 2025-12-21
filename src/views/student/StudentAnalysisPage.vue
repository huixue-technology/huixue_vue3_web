<template>
  <div class="student-analysis-page">
    
    <a-space class="selector">
      <div class="select-item">
        <span>学期选择：</span>
        <a-select :options="termList" v-model:value="termSelected"></a-select>
      </div>
      <a-button type="primary" @click="submit">确定</a-button>  
    </a-space>

    <!-- 加载中提示 -->
    <a-spin v-if="isLoading" tip="数据加载中..." style="margin-top: 40px; display: block; text-align: center;" />

    <!-- 无数据提示 -->
    <div v-else-if="!mergedAnalysisList.length" class="no-data">
      <a-empty description="未查询到数据，请检查学期选择或网络状态" />
    </div>

    <!-- 表格区域（优化底部间距） -->
    <div class="tables-container" v-else>
      <div class="table-section">
        <h2>考试统计 <span class="total-exams">共统计{{ examListSelected.length }}场考试</span></h2>
        <p class="description">
          说明：一本率低于60%为<span style="color: red;">红色</span>，在60%到80%之间为<span style="color: orange;">橙色</span>；变异系数≥0.2的科目标<span style="color: red;">红色</span>（成绩不稳定）。
        </p>
        <!-- 横向滚动：表格列过多时横向滚动 -->
        <div class="table-horizontal-scroll">
          <!-- 纵向滚动：表格行数过多时纵向滚动（限制高度） -->
          <div class="table-vertical-scroll">
            <a-table
              :columns="mergedStatsColumns"
              :data-source="mergedAnalysisList"
              :pagination="false"
              size="middle"
              bordered
              :key="tableKey"
              :scroll="{ x: 'max-content' }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部预留空白占位符 -->
    <div class="bottom-space"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { message, Spin, Empty } from 'ant-design-vue';
import type { ColumnType } from 'ant-design-vue/es/table';
import { useUserStore } from '@/store';
import { getStudentExamApi } from '@/servers/api/student';
import { postPassLineAnalysis } from '@/servers/api/analysis';
import { postStudentAverageAnalysis } from '@/servers/api/average';

// 合并后的表格数据类型
type MergedAnalysisItem = {
  key: string;
  subject: string;
  passCount: number;
  passRate: string | number;
  averageScore: number;
  maxScore: number;
  minScore: number;
  median: number;
  stdDev: number;
  zScore: number;
  tScore: number;
  averageRank: number;
  cv: number;
};

// 状态定义
const userInfo = ref<any>(null);
const examListSelected = ref<any[]>([]);
const examList = ref<any[]>([]);
const isLoading = ref(true);
const tableKey = ref(Date.now());
const examAnalysisRaw = ref<any[]>([]);
const comprehensiveAnalysisRaw = ref<any[]>([]);

// 科目映射
const subjects_map = ref<{[key: string]: string}>({
  'dili':'地理','huaxue':'化学','lishi':'历史','shengwu':'生物','shuxue':'数学',
  'wuli':'物理','yingyu':'英语','yuwen':'语文','zhengzhi':'政治','sum_':'总分'
});

// 学期选择
const default_term = [{label:'所有成绩',value:'all'}];
const termList = ref<{label:string,value:string}[]>(default_term);
const termSelected = ref<string>(default_term[0].value);

// 合并后的表格数据
const mergedAnalysisList = computed<MergedAnalysisItem[]>(() => {
  if (!examAnalysisRaw.value.length || !comprehensiveAnalysisRaw.value.length) return [];
  
  return examAnalysisRaw.value.map(examItem => {
    const compItem = comprehensiveAnalysisRaw.value.find((item: any) => item.subject === examItem.subject);
    return {
      ...examItem,
      passRate: examItem.passRate || '0',
      averageScore: compItem?.averageScore || 0,
      maxScore: compItem?.maxScore || 0,
      minScore: compItem?.minScore || 0,
      median: compItem?.median || 0,
      stdDev: compItem?.stdDev || 0,
      zScore: compItem?.zScore || 0,
      tScore: compItem?.tScore || 0,
      averageRank: compItem?.averageRank || 0,
      cv: compItem?.cv || 0,
    };
  });
});

// 修复颜色判断函数
const getPassRateColor = (text: string) => {
  // 处理百分比格式（如 "100.00%"）
  let rateValue: number;
  
  if (typeof text === 'string' && text.includes('%')) {
    // 去掉百分号并转换为数字
    rateValue = parseFloat(text.replace('%', ''));
  } else {
    // 如果是小数格式，转换为百分比
    rateValue = parseFloat(text) * 100;
  }
  
  // 处理转换失败的情况
  if (isNaN(rateValue)) {
    console.warn('无效的一本进线率数据:', text);
    return 'rgba(0, 0, 0, 0.85)';
  }
  
  if (rateValue < 60) {
    return '#f5222d'; // 红色：低于60%
  } else if (rateValue < 80) {
    return 'orange'; // 橙色：60%到80%之间
  } else {
    return '#52c41a'; // 绿色：高于80%
  }
};

// 表格列定义（修复颜色逻辑）
const mergedStatsColumns: ColumnType[] = [
  {
    title: '科目',
    dataIndex: 'subject',
    key: 'subject',
    align: 'center',
    width: 100,
    fixed: 'left',
    customCell: () => ({ style: { backgroundColor: '#f7f9fc', fontWeight: '600' } }),
  },
  {
    title: '一本进线次数',
    dataIndex: 'passCount',
    key: 'passCount',
    align: 'center',
    width: 120,
    customRender: ({ value }: { value: number }) => value || 0,
  },
  {
    title: '一本进线率',
    dataIndex: 'passRate',
    key: 'passRate',
    align: 'center',
    width: 120,
    customRender: ({ text }: { text: string }) => {
      return text;
    },
    // 修复颜色逻辑
    customCell: (record: any) => {
      const text = record.passRate || '0';
      const color = getPassRateColor(text);
      return { style: { color, fontWeight: '500' } };
    },
  },
  {
    title: '平均分',
    dataIndex: 'averageScore',
    key: 'averageScore',
    align: 'center',
    width: 110,
    customRender: ({ value }: { value: number }) => value.toFixed(2),
  },
  {
    title: '最高分',
    dataIndex: 'maxScore',
    key: 'maxScore',
    align: 'center',
    width: 110,
  },
  {
    title: '最低分',
    dataIndex: 'minScore',
    key: 'minScore',
    align: 'center',
    width: 110,
  },
  {
    title: '标准分',
    dataIndex: 'zScore',
    key: 'zScore',
    align: 'center',
    width: 110,
    customRender: ({ value }: { value: number }) => value.toFixed(4),
  },
  {
    title: 'T分',
    dataIndex: 'tScore',
    key: 'tScore',
    align: 'center',
    width: 100,
    customRender: ({ value }: { value: number }) => value.toFixed(2),
  },
  {
    title: '平均名次',
    dataIndex: 'averageRank',
    key: 'averageRank',
    align: 'center',
    width: 110,
    customRender: ({ value }: { value: number }) => Math.round(value),
  },
  {
    title: '变异系数',
    dataIndex: 'cv',
    key: 'cv',
    align: 'center',
    width: 110,
    customRender: ({ value }: { value: number }) => {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      return isNaN(numValue) ? '0.0000' : numValue.toFixed(4);
    },
    customCell: (record: any) => {
      const value = record.cv || 0;
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      const shouldHighlight = !isNaN(numValue) && numValue >= 0.2;
      
      return {
        style: {
          color: shouldHighlight ? '#f5222d' : 'rgba(0, 0, 0, 0.85)',
          fontWeight: shouldHighlight ? '600' : 'normal',
        }
      };
    },
  },
];

// 根据学生选科过滤科目映射
const bindStudentSubject = () => {
  const selected_subjects = userInfo.value?.student?.subject_selection;
  if (!selected_subjects) {
    message.warn('学生还未选科，默认显示所有科目');
    return;
  }
  if (selected_subjects.indexOf('物') === -1) delete subjects_map.value.wuli;
  if (selected_subjects.indexOf('化') === -1) delete subjects_map.value.huaxue;
  if (selected_subjects.indexOf('政') === -1) delete subjects_map.value.zhengzhi;
  if (selected_subjects.indexOf('生') === -1) delete subjects_map.value.shengwu;
  if (selected_subjects.indexOf('史') === -1) delete subjects_map.value.lishi;
  if (selected_subjects.indexOf('地') === -1) delete subjects_map.value.dili;
};

// 获取学生信息
const fetchStudentInfo = async () => {
  try {
    const userStore = useUserStore();
    userInfo.value = userStore.userInfo;
    if (!userInfo.value?.role) {
      message.error('未找到学生信息，请重新登录');
      isLoading.value = false;
      return;
    }
    bindStudentSubject();
  } catch (err) {
    message.error('获取学生信息失败');
    isLoading.value = false;
  }
};

// 获取考试列表
const fetchExamList = async () => {
  try {
    const studentId = userInfo.value?.role;
    if (!studentId) return;
    const res = await getStudentExamApi({ student_uid: studentId });
    if (res.code === 200 && res.data.length) {
      examList.value = res.data.map((item: any) => ({
        value: item[0].id, label: item[0].name, year: item[0].year
      }));
      const years = Array.from(new Set(res.data.map((item: any) => String(item[0].year)))) as string[];
      termList.value = [...default_term, ...years.map((year): { label: string; value: string } => ({ label: year, value: year }))];
      termSelected.value = termList.value[0].value;
      examListSelected.value = examList.value.map(item => item.value);
    } else {
      message.warning('未查询到考试数据');
    }
  } catch (err) {
    message.error('获取考试列表失败');
  }
};

// 获取考试统计数据
const fetchExamStats = async () => {
  try {
    const studentId = userInfo.value?.role;
    if (!studentId || !examListSelected.value.length) return;
    
    // 1. 明确接口返回的单个统计项类型（关键）
    interface PassLineItem {
      pass_count: number;
      pass_rate: string | number;
    }
    // 2. 明确整个响应数据类型（key 是科目标识，value 是统计项）
    interface PassLineResponse {
      [key: string]: PassLineItem;
    }
    // 3. 给接口请求添加完整类型断言
    const res = await postPassLineAnalysis({ 
      student_id: studentId, 
      exam_ids: examListSelected.value 
    }) as { code: number; data?: PassLineResponse };
    
    if (res.code === 200 && res.data) {
      examAnalysisRaw.value = Object.entries(res.data)
        .filter(([key]) => key in subjects_map.value)
        // 4. 给遍历的 data 加类型断言（关键修复）
        .map(([key, data]: [string, PassLineItem]) => ({
          key,
          subject: subjects_map.value[key],
          passCount: data.pass_count || 0, // 现在 data 类型明确，可安全访问
          passRate: data.pass_rate || '0', // 同上
        }));
    } else {
      examAnalysisRaw.value = [];
    }
  } catch (err) {
    message.error('获取考试统计数据失败,缺少考试分数线');
    examAnalysisRaw.value = [];
  }
};

// 获取综合分析数据
const fetchComprehensiveAnalysis = async () => {
  try {
    const studentId = userInfo.value?.student?.uid;
    if (!studentId || !examListSelected.value.length) return;
    const res = await postStudentAverageAnalysis({ student_id: studentId, exam_ids: examListSelected.value }as any);
    if (res.code === 200 && res.data?.comprehensive) {
      const compData = res.data.comprehensive;
      comprehensiveAnalysisRaw.value = Object.entries(subjects_map.value)
        .filter(([key]) => compData.average_score[key])
        .map(([key, subject]) => ({
          key,
          subject,
          averageScore: compData.average_score[key],
          maxScore: compData.max_score[key],
          minScore: compData.min_score[key],
          zScore: compData.z_score[key],
          tScore: compData.T[key],
          averageRank: compData.average_rank[key],
          cv: compData.cv[key],
          median: compData.median[key],
          stdDev: compData.std_dev[key],
        }));
    } else {
      comprehensiveAnalysisRaw.value = [];
    }
  } catch (err) {
    message.error('获取综合分析数据失败');
    comprehensiveAnalysisRaw.value = [];
  }
};

// 提交按钮
const submit = async () => {
  isLoading.value = true;
  examListSelected.value = termSelected.value === 'all'
    ? examList.value.map(item => item.value)
    : examList.value.filter(item => item.year === termSelected.value).map(item => item.value);
  
  await Promise.all([fetchExamStats(), fetchComprehensiveAnalysis()]);
  tableKey.value = Date.now();
  isLoading.value = false;
};

// 页面加载
onMounted(async () => {
  await fetchStudentInfo();
  await fetchExamList();
  await submit();
});

// 监听学期变化
watch(termSelected, () => {
  if (termList.value.length > 1) submit();
});
</script>

<style scoped>
.student-analysis-page {
  padding: 20px;
  padding-bottom: 80px;
  background-color: #f5f5f5;
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  box-sizing: border-box;
}

.selector {
  margin-top: 30px;
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  width: 100%;
  min-width: 300px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tables-container {
  margin-top: 40px;
  margin-bottom: 40px;
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.table-section {
  width: 100%;
}

.table-horizontal-scroll {
  width: 100%;
  overflow-x: auto;
  margin-top: 10px;
  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background-color: #f5f5f5;
  }
}

.table-vertical-scroll {
  max-height: 450px;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background-color: #f5f5f5;
  }
}

:deep(.ant-table-header) {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: white;
}

:deep(.ant-table-fixed-left) {
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
}

.total-exams {
  font-size: 0.9em;
  color: #666;
  margin-left: 10px;
}

.description {
  margin-top: 10px;
  font-size: 0.9em;
  color: #666;
  line-height: 1.5;
}

.no-data {
  background: white;
  border-radius: 12px;
  padding: 80px 20px;
  margin: 40px 0 60px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.bottom-space {
  height: 60px;
}

@-moz-document url-prefix() {
  .table-horizontal-scroll,
  .table-vertical-scroll {
    scrollbar-width: thin;
    scrollbar-color: #ccc #f5f5f5;
  }
}
</style>
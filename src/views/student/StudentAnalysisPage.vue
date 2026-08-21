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

    <!-- 考试统计表格区域 -->
    <div class="tables-container" v-else>
      <div class="table-section">
        <h2>考试统计 <span class="total-exams">共统计{{ examListSelected.length }}场考试</span></h2>
        <p class="description">
          说明：特控进线率低于60%为<span style="color: red;">红色</span>，在60%到80%之间为<span style="color: orange;">橙色</span>，高于80%为<span style="color: green;">绿色</span>。
        </p>
        <div class="table-horizontal-scroll">
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

    <div class="tables-container" style="margin-top:24px;">
      <div class="table-section">
        <h2>知识点掌握情况</h2>
        <a-space class="kp-selector" style="margin:16px 0;">
          <a-select
            v-model:value="kpSubject"
            placeholder="选择科目"
            :options="kpSubjectOptions"
            style="width:140px"
          />
          <a-input
            v-model:value="kpKnowledgePoint"
            placeholder="输入知识点名称"
            style="width:260px"
          />
          <a-input-number
            v-model:value="kpN"
            :min="1"
            :max="100"
            placeholder="最近N场"
            style="width:120px"
          />
          <a-button type="primary" @click="queryKnowledgePoint" :loading="kpLoading">查询</a-button>
        </a-space>

        <!-- 知识点无查询条件提示 -->
        <div v-if="!kpSubject || !kpKnowledgePoint" class="no-data" style="padding:32px;">
          <a-empty description="请选择科目、填写知识点后点击查询" />
        </div>

        <!-- 查询中 -->
        <a-spin v-else-if="kpLoading" tip="知识点数据加载中..." style="display:block;margin:30px 0;text-align:center;" />

        <!-- 查询返回无有效数据 -->
        <div v-else-if="kpResult && kpResult.actual_exam_count === 0" class="no-data" style="padding:32px;">
          <a-empty description="未匹配到该知识点的考试答题数据" />
        </div>

        <!-- 知识点结果展示 -->
        <div v-else-if="kpResult" class="kp-result-wrap">
          <!-- 汇总卡片 -->
          <a-row :gutter="[16,16]" class="kp-summary-row">
            <a-col :span="6">
              <a-statistic title="请求统计考试数" :value="kpResult.requested_exam_count" />
            </a-col>
            <a-col :span="6">
              <a-statistic title="实际有效考试场数" :value="kpResult.actual_exam_count" />
            </a-col>
            <a-col :span="6">
              <a-statistic title="总答题数" :value="kpResult.total_question_count" />
            </a-col>
            <a-col :span="6">
              <a-statistic title="正确题数" :value="kpResult.correct_question_count" />
            </a-col>
            <a-col :span="6">
            <div class="stat-item">
              <div class="stat-title">整体掌握度</div>
              <div 
                class="stat-value"
                :style="{ color:getMasteryRateColor(safeMasteryRate(kpResult?.mastery_rate)),fontWeight:500 }"
              >
                <template v-if="safeMasteryRate(kpResult?.mastery_rate) !== null">
                  {{ (safeMasteryRate(kpResult?.mastery_rate)! * 100).toFixed(2) }}%
                </template>
                <template v-else>--</template>
              </div>
            </div>
          </a-col>
          </a-row>

          <div style="margin-top:20px;">
            <h4>逐场考试明细</h4>
            <div class="table-horizontal-scroll">
              <a-table
                :columns="kpTableColumns"
                :data-source="kpResult.exams"
                :pagination="false"
                bordered
                size="middle"
                row-key="exam_id"
                :scroll="{ x:'max-content' }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部预留空白占位符 -->
    <div class="bottom-space"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, h } from 'vue';
import { message, Spin, Empty } from 'ant-design-vue';
import type { ColumnType } from 'ant-design-vue/es/table';
import { useUserStore } from '@/store';
import { getStudentExamApi } from '@/servers/api/student';
import { postPassLineAnalysis, getKnowledgePointMasteryApi } from '@/servers/api/analysis';
import { postStudentAverageAnalysis } from '@/servers/api/average';

// 合并后的表格数据类型
type MergedAnalysisItem = {
  key: string;
  subject: string;
  passCount: number;
  passRate: string | number;
  averageScore: number;
  averageRank: number;
  bestRank: number;
  oneLineCount: number;
  averagePassRate: number;
  averageTopRate: number;
  top985Rate: number;
  top211Rate: number;
};

// ========== 知识点掌握度类型定义
type KpExamItem = {
  exam_id: number;
  exam_name: string | null;
  exam_year: string | null;
  exam_date: string | null;
  correct_question_count: number;
  total_question_count: number;
  mastery_rate: number | null;
};

type KnowledgePointMasteryRespData = {
  student_id: string;
  subject: string;
  knowledge_point: string;
  requested_exam_count: number;
  actual_exam_count: number;
  correct_question_count: number;
  total_question_count: number;
  mastery_rate: number | null;
  exams: KpExamItem[];
};

// 状态定义
const userInfo = ref<any>(null);
const examListSelected = ref<any[]>([]);
const examList = ref<any[]>([]);
const isLoading = ref(true);
const tableKey = ref(Date.now());
const examAnalysisRaw = ref<any[]>([]);
const comprehensiveAnalysisRaw = ref<any[]>([]);

// 科目映射（中文科目名）
const subjects_map = ref<{[key: string]: string}>({
  '地理':'地理','化学':'化学','历史':'历史','生物':'生物','数学':'数学',
  '物理':'物理','英语':'英语','语文':'语文','政治':'政治','总分':'总分'
});

// 学期选择
const default_term = [{label:'所有成绩',value:'all'}];
const termList = ref<{label:string,value:string}[]>(default_term);
const termSelected = ref<string>(default_term[0].value);

// ========== 知识点模块状态 ==========
const kpSubject = ref('');
const kpKnowledgePoint = ref('');
const kpN = ref<number>(10);
const kpLoading = ref(false);
const kpResult = ref<KnowledgePointMasteryRespData|null>(null);

// 知识点科目下拉选项（从subjects_map生成）
const kpSubjectOptions = computed(()=>{
  return Object.values(subjects_map.value).map(label=>({label,value:label}));
});

/**
 * 获取掌握度文字颜色
 * @param rate 0‑1小数，null代表无数据
 */
const getMasteryRateColor = (rate: number | null) => {
  if (rate === null || Number.isNaN(rate)) return '';
  const pct = rate * 100;
  if (pct < 60) return '#f5222d';
  else if (pct <= 80) return '#fa8c16';
  else return '#52c41a'; //绿色
};

// 知识点表格列
const kpTableColumns: ColumnType<KpExamItem>[] = [
  { title:'考试ID', dataIndex:'exam_id', align:'center', width:90 },
  { title:'考试名称', dataIndex:'exam_name', align:'center', width:220, customRender:({value})=> value ?? '-' },
  { title:'考试年份', dataIndex:'exam_year', align:'center', width:100, customRender:({value})=> value ?? '-' },
  { title:'考试日期', dataIndex:'exam_date', align:'center', width:120, customRender:({value})=> value ?? '-' },
  { title:'正确题数', dataIndex:'correct_question_count', align:'center', width:110 },
  { title:'总题数', dataIndex:'total_question_count', align:'center', width:110 },
  {
    title:'本场掌握度',
    dataIndex:'mastery_rate',
    align:'center',
    width:130,
    customRender:({value})=>{
      if(value === null) return '-';
      const color = getMasteryRateColor(value);
      return h('span', { style:{color, fontWeight:500} }, `${(value * 100).toFixed(2)}%`);
    }
  }
];

// 合并后的表格数据
const mergedAnalysisList = computed<MergedAnalysisItem[]>(() => {
  if (!examAnalysisRaw.value.length || !comprehensiveAnalysisRaw.value.length) return [];

  return examAnalysisRaw.value.map(examItem => {
    const compItem = comprehensiveAnalysisRaw.value.find((item: any) => item.subject === examItem.subject);
    return {
      ...examItem,
      passRate: examItem.passRate || '0',
      averageScore: compItem?.averageScore || 0,
      averageRank: compItem?.averageRank || 0,
      bestRank: compItem?.bestRank || 0,
      oneLineCount: compItem?.oneLineCount || 0,
      averagePassRate: compItem?.averagePassRate || 0,
      averageTopRate: compItem?.averageTopRate || 0,
      top985Rate: compItem?.top985Rate || 0,
      top211Rate: compItem?.top211Rate || 0,
    };
  });
});

const getPassRateColor = (text: string) => {
  // 处理百分比格式
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
    console.warn('无效的特控进线率数据:', text);
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

// 表格列定义
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
    title: '特控进线次数',
    dataIndex: 'passCount',
    key: 'passCount',
    align: 'center',
    width: 130,
    customRender: ({ value }: { value: number }) => value || 0,
  },
  {
    title: '特控进线率',
    dataIndex: 'passRate',
    key: 'passRate',
    align: 'center',
    width: 120,
    customRender: ({ text }: { text: string }) => text,
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
    width: 100,
    customRender: ({ value }: { value: number }) => value.toFixed(2),
  },
  {
    title: '平均排名',
    dataIndex: 'averageRank',
    key: 'averageRank',
    align: 'center',
    width: 110,
    customRender: ({ value }: { value: number }) => Math.round(value),
  },
  {
    title: '最佳排名',
    dataIndex: 'bestRank',
    key: 'bestRank',
    align: 'center',
    width: 110,
    customRender: ({ value }: { value: number }) => value || 0,
  },
  {
    title: '特控达线次数',
    dataIndex: 'oneLineCount',
    key: 'oneLineCount',
    align: 'center',
    width: 130,
    customRender: ({ value }: { value: number }) => value || 0,
  },
  {
    title: '平均及格率',
    dataIndex: 'averagePassRate',
    key: 'averagePassRate',
    align: 'center',
    width: 120,
    customRender: ({ value }: { value: number }) => (value * 100).toFixed(2) + '%',
  },
  {
    title: '清北率',
    dataIndex: 'averageTopRate',
    key: 'averageTopRate',
    align: 'center',
    width: 120,
    customRender: ({ value }: { value: number }) => (value * 100).toFixed(2) + '%',
  },
  {
    title: '985达线率',
    dataIndex: 'top985Rate',
    key: 'top985Rate',
    align: 'center',
    width: 120,
    customRender: ({ value }: { value: number }) => (value * 100).toFixed(2) + '%',
  },
  {
    title: '211达线率',
    dataIndex: 'top211Rate',
    key: 'top211Rate',
    align: 'center',
    width: 120,
    customRender: ({ value }: { value: number }) => (value * 100).toFixed(2) + '%',
  },
];

// 根据学生选科过滤科目映射
const bindStudentSubject = () => {
  const selected_subjects = userInfo.value?.student?.subject_selection;
  if (!selected_subjects) {
    message.warn('学生还未选科，默认显示所有科目');
    return;
  }
  if (selected_subjects.indexOf('物') === -1) delete subjects_map.value['物理'];
  if (selected_subjects.indexOf('化') === -1) delete subjects_map.value['化学'];
  if (selected_subjects.indexOf('政') === -1) delete subjects_map.value['政治'];
  if (selected_subjects.indexOf('生') === -1) delete subjects_map.value['生物'];
  if (selected_subjects.indexOf('史') === -1) delete subjects_map.value['历史'];
  if (selected_subjects.indexOf('地') === -1) delete subjects_map.value['地理'];
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
    
    interface PassLineItem {
      pass_count: number;
      pass_rate: string | number;
    }
    interface PassLineResponse {
      [key: string]: PassLineItem;
    }
    const res = await postPassLineAnalysis({ 
      student_id: studentId, 
      exam_ids: examListSelected.value 
    } as any) as { code: number; data?: PassLineResponse };
    
    if (res.code === 200 && res.data) {
      examAnalysisRaw.value = Object.entries(res.data)
        .filter(([key]) => key in subjects_map.value)
        .map(([key, data]: [string, PassLineItem]) => ({
          key,
          subject: subjects_map.value[key] || key,
          passCount: data.pass_count || 0,
          passRate: data.pass_rate || '0',
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

    interface StudentAverageAnalysisResponse {
      code: number;
      msg: string;
      data: Array<{
        id: number;
        class_id: number;
        student_id: string;
        average_rank: { [key: string]: number };
        average_pass_rate: { [key: string]: number };
        average_top_rate: { [key: string]: number };
        one_line_count: { [key: string]: number };
        top_985_rate: { [key: string]: number };
        top_211_rate: { [key: string]: number };
        best_rank: { [key: string]: number };
        average_score: { [key: string]: number };
      }>;
    }

    const res = await postStudentAverageAnalysis({
      student_id: studentId,
      exam_ids: examListSelected.value
    } as any) as StudentAverageAnalysisResponse;

    if (res.code === 200 && res.data && res.data.length > 0) {
      const compData = res.data[0];

      comprehensiveAnalysisRaw.value = Object.entries(subjects_map.value)
        .filter(([key]) => compData.average_score[key] !== undefined)
        .map(([key, subject]) => ({
          key,
          subject,
          averageScore: compData.average_score[key] || 0,
          averageRank: compData.average_rank[key] || 0,
          bestRank: compData.best_rank[key] || 0,
          oneLineCount: compData.one_line_count[key] || 0,
          averagePassRate: compData.average_pass_rate[key] || 0,
          averageTopRate: compData.average_top_rate[key] || 0,
          top985Rate: compData.top_985_rate[key] || 0,
          top211Rate: compData.top_211_rate[key] || 0,
        }));
    } else {
      comprehensiveAnalysisRaw.value = [];
    }
  } catch (err) {
    message.error('获取综合分析数据失败');
    comprehensiveAnalysisRaw.value = [];
  }
};

function safeMasteryRate(raw: number | null | undefined): number | null {
  if(raw === null || raw === undefined || Number.isNaN(raw)){
    return null
  }
  return raw
}

// ========== 查询知识点掌握度 ==========
const queryKnowledgePoint = async () => {
  if(!kpSubject.value || !kpKnowledgePoint.value) {
    message.warn('请选择科目并填写知识点');
    return;
  }
  const studentId = userInfo.value?.role;
  if(!studentId) {
    message.error('学生ID不存在');
    return;
  }
  kpLoading.value = true;
  kpResult.value = null;
  try {
    const res = await getKnowledgePointMasteryApi({
      student_id: studentId,
      subject: kpSubject.value,
      knowledge_point: kpKnowledgePoint.value,
      n: kpN.value
    });
    if(res.code === 200) {
      kpResult.value = res.data as KnowledgePointMasteryRespData;
    } else {
      message.error(res.msg || '查询知识点掌握度失败');
    }
  }catch(err) {
    message.error('接口请求异常');
  }finally {
    kpLoading.value = false;
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
.stat-item {
  text-align:center;
  padding:8px 0;
}
.stat-title {
  font-size:14px;
  color:#666;
  margin-bottom:6px;
}
.stat-value {
  font-size:24px;
}
.student-analysis-page {
  padding: 20px;
  padding-bottom: 80px;
  background-color: #f5f5f5;
  min-height: 100vh;
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

.kp-summary-row {
  padding: 12px;
  background-color: #fafafa;
  border-radius: 8px;
}

@-moz-document url-prefix() {
  .table-horizontal-scroll,
  .table-vertical-scroll {
    scrollbar-width: thin;
    scrollbar-color: #ccc #f5f5f5;
  }
}
</style>
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
        :pass-line-rate-data="flatPassLineRateData" 
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
              <span v-else class="empty-value">未配置</span>
            </template>
            <template v-else-if="column.dataIndex === 'count'">
              <span v-if="record.score !== null && record.score !== undefined">{{ record.count ?? 0 }}</span>
              <span v-else class="empty-value">未配置</span>
            </template>
            <template v-else-if="column.dataIndex === 'rate'">
              <span v-if="record.score !== null && record.score !== undefined">{{ record.rate ?? 0 }}%</span>
              <span v-else class="empty-value">未配置</span>
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

      <!-- 进退步学生 -->
      <a-card class="updown-card">
        <template #title>
          <div class="section-title">进退步学生</div>
        </template>
        <div class="updown-filter">
          <a-space wrap>
            <span>对比次数：</span>
            <a-input-number
              v-model:value="updownNums"
              :min="1"
              :max="20"
              placeholder="最近几次"
              style="width: 120px;"
            />
            <span>排序方式：</span>
            <a-select
              v-model:value="updownSortBy"
              placeholder="排序方式"
              style="width: 140px;"
              allow-clear
            >
              <a-select-option value="class_rank">班次排名</a-select-option>
              <a-select-option value="grade_rank">段次排名</a-select-option>
              <a-select-option value="class_score">班次分数</a-select-option>
              <a-select-option value="grade_score">段次分数</a-select-option>
            </a-select>
            <span>进退步：</span>
            <a-select
              v-model:value="updownFilterTrend"
              placeholder="全部"
              style="width: 120px;"
              allow-clear
            >
              <a-select-option value="up">进步</a-select-option>
              <a-select-option value="down">退步</a-select-option>
              <a-select-option value="flat">持平</a-select-option>
            </a-select>
            <a-input
              v-model:value="updownSearchName"
              placeholder="按学生姓名搜索"
              allow-clear
              style="width: 160px;"
            />
            <a-button type="primary" size="small" :loading="updownLoading" @click="fetchUpDownData">查询全部学生</a-button>
          </a-space>
          <a-alert
            v-if="selectedClass > 0 && updownTableData.length === 0 && !updownLoading"
            message="点击查询全部学生按钮，将批量查询班级所有学生的进退步情况"
            type="info"
            show-icon
            style="margin-top: 12px;"
          />
        </div>
        <a-table
          :columns="updownColumns"
          :data-source="updownTableData"
          :pagination="false"
          bordered
          size="middle"
          row-key="key"
          :scroll="{ x: 'max-content' }"
          :loading="updownLoading"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'name'">
              <span class="student-name">{{ record.name }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'latest_total_score'">
              <span>{{ record.latest_total_score ?? '-' }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'score_change'">
              <span :class="getScoreChangeClass(record.score_change)">
                {{ formatScoreChange(record.score_change) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'latest_class_rank'">
              <span>{{ record.latest_class_rank ?? '-' }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'class_change'">
              <span :class="getChangeClass(record.class_change)">
                {{ formatChange(record.class_change) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'latest_grade_rank'">
              <span>{{ record.latest_grade_rank ?? '-' }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'grade_change'">
              <span :class="getChangeClass(record.grade_change)">
                {{ formatChange(record.grade_change) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'class_trend'">
              <span class="trend-text">{{ record.class_trend || '-' }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'grade_trend'">
              <span class="trend-text">{{ record.grade_trend || '-' }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'score_trend'">
              <span class="trend-text">{{ record.score_trend || '-' }}</span>
            </template>
          </template>
        </a-table>
        <a-alert
          v-if="updownTableData.length === 0 && !updownLoading"
          message="暂无进退步数据"
          description="请先选择班级并查询数据，对比考试为可选参数。"
          type="info"
          show-icon
          closable
          style="margin-top: 12px;"
        />
      </a-card>

      <!-- 考题得分率 -->
      <a-card class="question-stat-card">
        <template #title>
          <div class="section-title">考题得分率</div>
        </template>
        <div class="updown-filter">
          <a-space wrap>
            <span>选择考试：</span>
            <a-select
              v-model:value="questionStatExamId"
              placeholder="请选择考试"
              style="width: 200px;"
              allow-clear
              @change="fetchQuestionStat"
            >
              <a-select-option
                v-for="exam in examList"
                :key="exam.id"
                :value="exam.id"
              >
                {{ exam.name || `考试${exam.id}` }}
              </a-select-option>
            </a-select>
            <span>选择试卷：</span>
            <a-select
              v-model:value="questionStatPaperId"
              placeholder="请选择试卷"
              style="width: 200px;"
              allow-clear
              @change="fetchQuestionStat"
            >
              <a-select-option
                v-for="p in paperOptions"
                :key="p.id"
                :value="p.id"
              >
                {{ p.name || `试卷${p.id}` }}
              </a-select-option>
            </a-select>
            <a-button
              type="primary"
              size="small"
              :loading="questionStatLoading"
              @click="fetchQuestionStat"
              style="margin-left: 12px;"
            >查询小题统计</a-button>
          </a-space>
        </div>
        <a-table
          :columns="questionStatColumns"
          :data-source="questionStatTableData"
          :pagination="{ pageSize: 10 }"
          bordered
          size="middle"
          row-key="key"
          :scroll="{ x: 'max-content' }"
          :loading="questionStatLoading"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'question_key'">
              <span>{{ record.question_key }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'question_type'">
              <span>{{ record.question_type || '-' }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'wrong_rate'">
              <span :class="getWrongRateClass(record.wrong_rate)">{{ record.wrong_rate }}%</span>
            </template>
            <template v-else-if="column.dataIndex === 'wrong_count'">
              <span>{{ record.wrong_count ?? 0 }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'participant_count'">
              <span>{{ record.participant_count ?? 0 }}</span>
            </template>
          </template>
        </a-table>
        <a-alert
          v-if="questionStatTableData.length === 0 && !questionStatLoading"
          message="暂无小题得分率数据"
          description="请先选择考试和试卷，再点击查询按钮。"
          type="info"
          show-icon
          style="margin-top: 12px;"
        />
      </a-card>

      <!-- 历次考试一本进线人数柱状图和进线率折线图 -->
      <a-card class="history-card">
        <template #title>
          <div class="section-title">历次考试一本进线人数柱状图和进线率折线图</div>
        </template>
        <a-row :gutter="16">
          <a-col :xs="24" :md="24">
            <div class="chart-wrapper">
              <e-charts :option="historyPassLineChartOption" style="height: 380px; width: 100%;" />
            </div>
          </a-col>
        </a-row>
        <a-alert
          v-if="historyPassLineData.length === 0 && !historyChartLoading"
          message="暂无历史考试进线数据"
          description="请先选择班级并点击查询数据。历史数据来自各场考试的过线率统计。"
          type="info"
          show-icon
          style="margin-top: 12px;"
        />
      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue';
import { message } from 'ant-design-vue';
import { 
  postClassAnalysis,
  postClassPassLineRate,
  postClassComprehensiveStudentGrades 
} from '@/servers/api/average';
import { getPassLine, getUpDownDetailAnalysis, getClassAnalysis } from '@/servers/api/analysis';
import { getClassExam } from '@/servers/api/grade';
import { getStudentApi } from '@/servers/api/student';
import { useUserStore } from '@/store';
import { getClassesApi } from '@/servers/api/classes';
import { getClassQuestionStat } from '@/servers/api/wrongQuestion';
import { getTestPaper } from '@/servers/api/tp';
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
const classSummaryData = ref<any>({}); // GET /api/analysis/class_analysis 返回的 class_summary（含最高分和班级人数）
const passLineRateData = ref<any>({});
const studentGradesData = ref<any[]>([]);
const classAnalysisRef = ref<any>(null); // 子组件引用
const passLineConfigData = ref<any[]>([]); // 分数线配置数据
const showEmptyTip = ref(false); // 显示空数据提示
const flatPassLineRateData = ref<any[]>([]); // 展平后的过线率数据（供子组件折线图使用）

// 进退步学生相关
const updownLoading = ref(false);
const updownSortBy = ref<string>('');
const updownCompareExamId = ref<number | null>(null);
const updownNums = ref<number>(5); // 进退步对比的最近考试次数
const updownData = ref<any[]>([]);
const updownSearchName = ref<string>('');
const updownFilterTrend = ref<string>(''); // up/down/flat
const examList = ref<any[]>([]); // 考试列表
const classStudentList = ref<any[]>([]); // 班级所有学生列表

// 小题得分率统计（功能4）
const questionStatLoading = ref(false);
const questionStatExamId = ref<number | null>(null);
const questionStatPaperId = ref<number | null>(null);
const questionStatData = ref<any[]>([]);
const paperOptions = ref<any[]>([]);

// 历史考试进线数据（功能4）
const historyChartLoading = ref(false);
const historyPassLineData = ref<any[]>([]);

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

// 考试变化时刷新试卷列表
watch(questionStatExamId, async (val) => {
  if (val != null) {
    questionStatPaperId.value = null;
    await fetchPaperOptions();
  }
});

const batchComputeData = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  loading.value = true;
  
  try {
    // 先获取考试列表（分数线配置依赖考试ID）
    await fetchExamList();
    // 并行请求其他数据
    await Promise.all([
      getClassAnalysisfunc(),
      getClassAnalysisDetailfunc(),
      getClassPassLineRatefunc(),
      getClassComprehensiveStudentGradesfunc(),
      fetchPassLineConfig(),
      fetchHistoryPassLineData(),
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

// 调用 GET /api/analysis/class_analysis 获取班级单场分析（含最高分、班级人数）
const getClassAnalysisDetailfunc = async () => {
  if (selectedClass.value <= 0) return;
  const targetExamId = updownCompareExamId.value || examList.value[0]?.id;
  if (!targetExamId) {
    classSummaryData.value = {};
    return;
  }
  try {
    const res = await getClassAnalysis({
      class_id: selectedClass.value,
      exam_id: targetExamId
    });
    if (res.code === 200 && res.data) {
      const data: any = res.data;
      classSummaryData.value = data.class_summary || data.classSummary || {};
    } else {
      classSummaryData.value = {};
    }
  } catch (err) {
    console.error('调用 getClassAnalysis 失败:', err);
    classSummaryData.value = {};
  }
};

const getClassPassLineRatefunc = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  // 四条分数线过线率
  const res = await postClassPassLineRate({ class_ids: [selectedClass.value] });
  
  if (res.code === 200) {
    // 确保是数组格式，保留原始结构供表格使用
    passLineRateData.value = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
    
    // 同时生成展平后的数据传给 PassLineRate 子组件（折线图用）
    flatPassLineRateData.value = passLineRateData.value.map((item: any) => ({
      class_id: item.class_id,
      pass_rate: flattenPassRateData(item.pass_rate),
      top_rate: flattenPassRateData(item.top_rate),
      top9_rate: flattenPassRateData(item.top9_rate),
      top2_rate: flattenPassRateData(item.top2_rate),
    }));
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

// 展平嵌套的过线率数据（后端返回 特控线/二本线→科目，合并为科目→率，取较大值）
const flattenPassRateData = (data: any): Record<string, number> => {
  if (!data || typeof data !== 'object') return {};
  const result: Record<string, number> = {};
  Object.keys(data).forEach(lineKey => {
    const lineData = data[lineKey];
    if (lineData && typeof lineData === 'object') {
      Object.keys(lineData).forEach(subject => {
        const val = lineData[subject];
        if (val !== undefined && val !== null && (result[subject] === undefined || val > result[subject])) {
          result[subject] = val;
        }
      });
    } else if (typeof lineData === 'number') {
      result[lineKey] = lineData;
    }
  });
  return result;
};

// 获取分数线配置
const fetchPassLineConfig = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  
  try {
    // 优先使用已选中的考试ID，否则取考试列表的第一个
    const targetExamId = updownCompareExamId.value || (examList.value[0]?.id);
    if (!targetExamId) {
      passLineConfigData.value = [];
      return;
    }
    const res = await getPassLine({ exam_id: targetExamId });
    if (res.code === 200 && res.data) {
        passLineConfigData.value = res.data.records || res.data.list || res.data || [];
      } else {
      passLineConfigData.value = [];
    }
  } catch (err) {
    console.error('获取分数线配置失败:', err);
    passLineConfigData.value = [];
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

// 进退步学生表格列
const updownColumns = [
  { title: '学生姓名', dataIndex: 'name', width: 100, align: 'center', fixed: 'left' },
  { title: '最新总分', dataIndex: 'latest_total_score', width: 80, align: 'center', sorter: (a: any, b: any) => (a.latest_total_score ?? 0) - (b.latest_total_score ?? 0), defaultSortOrder: 'descend' },
  { title: '总分变化', dataIndex: 'score_change', width: 80, align: 'center', sorter: (a: any, b: any) => (a.score_change ?? 0) - (b.score_change ?? 0) },
  { title: '班次', dataIndex: 'latest_class_rank', width: 60, align: 'center', sorter: (a: any, b: any) => (a.latest_class_rank ?? 9999) - (b.latest_class_rank ?? 9999) },
  { title: '班次进退', dataIndex: 'class_change', width: 80, align: 'center', sorter: (a: any, b: any) => (a.class_change ?? 0) - (b.class_change ?? 0) },
  { title: '段次', dataIndex: 'latest_grade_rank', width: 60, align: 'center', sorter: (a: any, b: any) => (a.latest_grade_rank ?? 9999) - (b.latest_grade_rank ?? 9999) },
  { title: '段次进退', dataIndex: 'grade_change', width: 80, align: 'center', sorter: (a: any, b: any) => (a.grade_change ?? 0) - (b.grade_change ?? 0) },
  { title: '班次排名变化', dataIndex: 'class_trend', width: 180, align: 'center' },
  { title: '段次排名变化', dataIndex: 'grade_trend', width: 180, align: 'center' },
  { title: '总分变化趋势', dataIndex: 'score_trend', width: 180, align: 'center' },
];

// 格式化进退步显示（名次变化：正数=进步，负数=退步）
const formatChange = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return '-';
  if (val === 0) return '持平';
  if (val > 0) return `↑${val}`;
  return `↓${Math.abs(val)}`;
};

// 获取进退步样式类
const getChangeClass = (val: number | null | undefined): string => {
  if (val === null || val === undefined || val === 0) return '';
  return val > 0 ? 'change-up' : 'change-down';
};

// 格式化总分变化（分数变化：正数=分数增加，负数=分数减少）
const formatScoreChange = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return '-';
  if (val === 0) return '持平';
  if (val > 0) return `+${val}`;
  return `${val}`;
};

// 获取总分变化样式类
const getScoreChangeClass = (val: number | null | undefined): string => {
  if (val === null || val === undefined || val === 0) return '';
  return val > 0 ? 'change-up' : 'change-down';
};

// 表格排序变更处理（Ant Design Vue 支持前端排序，此处无需额外处理）
const handleTableChange = () => {};

// 分数线配置映射关系
// key: passLineRateData 里的过线率字段名
// subKey: 嵌套结构的子键（如 pass_rate.特控线.总分）
// lineName: 用于匹配 getPassLine 返回的 line_name
// statsKey: 用于匹配 pass_line_stats 里的线名（清北/985/211/一本）
const lineConfig = [
  { key: 'pass_rate', subKey: '特控线', level: '特控线', lineName: '特控线', statsKey: '一本' },
  { key: 'pass_rate', subKey: '二本线', level: '二本线', lineName: '二本线', statsKey: '二本' },
  { key: 'top2_rate', subKey: '', level: '211', lineName: '211', statsKey: '211' },
  { key: 'top9_rate', subKey: '', level: '985', lineName: '985', statsKey: '985' },
  { key: 'top_rate', subKey: '', level: '清北', lineName: '清北', statsKey: '清北' },
];

// 从 passLineConfigData 中查找对应层次的总分分数线
const findPassLineScore = (lineName: string): number | null => {
  if (!passLineConfigData.value || passLineConfigData.value.length === 0) {
    return null;
  }
  
  // 策略1：找 line_name 包含 lineName 且 subject 为「总分」的记录
  let matched = passLineConfigData.value.find((item: any) => {
    const name = item.line_name || '';
    const subject = item.subject || '';
    const cleanName = name.replace(/^(历史方向|物理方向)/, '');
    return (cleanName === lineName || name.includes(lineName)) && subject === '总分';
  });
  
  if (matched) {
    return matched.score ?? null;
  }
  
  // 策略2：找 line_name 完全等于 lineName 的记录（无前缀）
  matched = passLineConfigData.value.find((item: any) => {
    const name = item.line_name || '';
    const subject = item.subject || '';
    return name === lineName && subject === '总分';
  });
  
  if (matched) {
    return matched.score ?? null;
  }
  
  // 策略3：找 line_name 包含 lineName 的所有记录，取第一条（可能没有总分科目）
  matched = passLineConfigData.value.find((item: any) => {
    const name = item.line_name || '';
    const cleanName = name.replace(/^(历史方向|物理方向)/, '');
    return cleanName === lineName || name.includes(lineName);
  });
  
  return matched?.score ?? null;
};

// 获取班级考试列表
const fetchExamList = async () => {
  if (selectedClass.value <= 0) return;
  try {
    const res = await getClassExam({ class_id: selectedClass.value });
    if (res.code === 200 && res.data) {
      examList.value = Array.isArray(res.data) ? res.data : (res.data.records || res.data.list || []);
    }
  } catch (err) {
    console.error('获取考试列表失败:', err);
    examList.value = [];
  }
};

// 获取班级所有学生列表
const fetchClassStudents = async () => {
  if (selectedClass.value <= 0) return;
  try {
    const res = await getStudentApi({
      class_id: selectedClass.value,
      page: 1,
      size: 999,
    });
    if (res.code === 200 && res.data) {
      classStudentList.value = Array.isArray(res.data) ? res.data : (res.data.records || res.data.list || []);
    } else {
      classStudentList.value = [];
    }
  } catch (err) {
    console.error('获取班级学生列表失败:', err);
    classStudentList.value = [];
  }
};

// 批量获取所有学生的进退步数据
const fetchUpDownData = async () => {
  if (selectedClass.value <= 0) {
    message.warning('请先选择班级');
    return;
  }
  
  updownLoading.value = true;
  
  try {
    // 1. 先获取班级所有学生
    await fetchClassStudents();
    
    if (classStudentList.value.length === 0) {
      message.info('该班级没有学生');
      updownData.value = [];
      updownLoading.value = false;
      return;
    }
    
    // 2. 并行查询每个学生的进退步（限制并发数避免压垮服务器）
    const batchSize = 5; // 每批5个并发
    const allResults: any[] = [];
    
    for (let i = 0; i < classStudentList.value.length; i += batchSize) {
      const batch = classStudentList.value.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (student: any) => {
          const studentId = student.uid || student.student_uid || student.id;
          const studentName = student.name || student.student_name || '-';
          if (!studentId) return null;
          
          const params: any = {
            student_id: String(studentId),
            nums: updownNums.value || 5,
          };
          if (updownCompareExamId.value) params.exam_id = updownCompareExamId.value;
          if (updownSortBy.value) params.sort_by = updownSortBy.value;
          
          try {
            const res = await getUpDownDetailAnalysis(params);
            if (res.code === 200 && res.data) {
              const examList = Array.isArray(res.data) ? res.data : [res.data];
              
              // 按考试时间排序（用exam_id排序，id越大越新）
              const sorted = [...examList].sort((a, b) => (a.exam_id || 0) - (b.exam_id || 0));
              
              // 尝试多种方式获取值
              const getValue = (item: any, keys: string[]): number | null => {
                for (const key of keys) {
                  if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
                    const num = Number(item[key]);
                    if (!isNaN(num)) return num;
                  }
                }
                return null;
              };
              
              // 可能的字段名组合
              const classRankKeys = ['总分班次', '班次', 'class_rank', 'classRank', '班级排名'];
              const gradeRankKeys = ['总分段次', '段次', 'grade_rank', 'gradeRank', '年级排名'];
              const scoreKeys = ['总分', 'total_score', 'score', 'totalScore'];
              const examNameKeys = ['exam_name', 'examName', '考试名称', 'name'];
              
              const latestItem = sorted[sorted.length - 1];
              const prevItem = sorted.length >= 2 ? sorted[sorted.length - 2] : null;
              
              const latestClassRank = getValue(latestItem, classRankKeys);
              const latestGradeRank = getValue(latestItem, gradeRankKeys);
              const latestTotalScore = getValue(latestItem, scoreKeys);
              
              // 计算进退步
              let classChange: number | null = null;
              let gradeChange: number | null = null;
              let scoreChange: number | null = null;
              
              if (prevItem) {
                const prevClassRank = getValue(prevItem, classRankKeys);
                const prevGradeRank = getValue(prevItem, gradeRankKeys);
                const prevTotalScore = getValue(prevItem, scoreKeys);
                
                if (latestClassRank !== null && prevClassRank !== null) {
                  classChange = prevClassRank - latestClassRank; // 正数=进步
                }
                if (latestGradeRank !== null && prevGradeRank !== null) {
                  gradeChange = prevGradeRank - latestGradeRank; // 正数=进步
                }
                if (latestTotalScore !== null && prevTotalScore !== null) {
                  scoreChange = latestTotalScore - prevTotalScore; // 正数=分数增加
                }
              }
              
              // 生成趋势（用考试ID作为简短标识）
              const trend = sorted.map((exam: any) => {
                const classRank = getValue(exam, classRankKeys);
                const gradeRank = getValue(exam, gradeRankKeys);
                const score = getValue(exam, scoreKeys);
                return {
                  exam_id: exam.exam_id,
                  exam_name: getValue(exam, examNameKeys) || `考试${exam.exam_id}`,
                  classRank,
                  gradeRank,
                  score,
                };
              });
              
              return {
                student_id: String(studentId),
                name: studentName,
                class_change: classChange,
                grade_change: gradeChange,
                score_change: scoreChange,
                latest_class_rank: latestClassRank,
                latest_grade_rank: latestGradeRank,
                latest_total_score: latestTotalScore,
                trend: trend,
              };
            }
            return null;
          } catch (e) {
            console.error(`学生${studentId}查询失败:`, e);
            return null;
          }
        })
      );
      allResults.push(...batchResults.filter(Boolean));
    }
    
    updownData.value = allResults;
    if (allResults.length === 0) {
      message.info('未查询到进退步数据');
    }
  } catch (err) {
    console.error('获取进退步数据失败:', err);
    updownData.value = [];
  } finally {
    updownLoading.value = false;
  }
};

// 筛选后的进退步表格数据（功能3：支持姓名搜索和进退步筛选）
const updownTableData = computed(() => {
  let result = updownData.value.map((item: any, index: number) => {
    const trend = item.trend || [];
    const classTrend = trend.map((t: any) => t.classRank != null ? String(t.classRank) : '-').join(' → ');
    const gradeTrend = trend.map((t: any) => t.gradeRank != null ? String(t.gradeRank) : '-').join(' → ');
    const scoreTrend = trend.map((t: any) => t.score != null ? String(t.score) : '-').join(' → ');
    return {
      key: `${item.student_id || index}`,
      name: item.name || '-',
      latest_total_score: item.latest_total_score ?? null,
      score_change: item.score_change ?? null,
      class_change: item.class_change ?? null,
      grade_change: item.grade_change ?? null,
      latest_class_rank: item.latest_class_rank ?? null,
      latest_grade_rank: item.latest_grade_rank ?? null,
      class_trend: classTrend,
      grade_trend: gradeTrend,
      score_trend: scoreTrend,
    };
  });

  // 姓名搜索
  if (updownSearchName.value) {
    const kw = updownSearchName.value.toLowerCase();
    result = result.filter((r: any) => String(r.name || '').toLowerCase().includes(kw));
  }

  // 进退步筛选（按总分变化）
  if (updownFilterTrend.value) {
    result = result.filter((r: any) => {
      const v = r.score_change;
      if (v === null || v === undefined) return false;
      if (updownFilterTrend.value === 'up') return v > 0;
      if (updownFilterTrend.value === 'down') return v < 0;
      if (updownFilterTrend.value === 'flat') return v === 0;
      return true;
    });
  }

  return result;
});

// 构建表格数据
const compareTableData = computed(() => {
  const result: any[] = [];
  let hasEmptyData = false;
  
  // 从数组中取第一个班级的数据
  const firstClassData = Array.isArray(passLineRateData.value) 
    ? (passLineRateData.value[0] || {}) 
    : (passLineRateData.value || {});
  
  // 从班级综合分析数据中取最新考试（exam_analysis的最后一个key）的总分数据
  const examAnalysis = firstClassDataOfClassAnalysis.value?.exam_analysis || {};
  const examKeys = Object.keys(examAnalysis);
  const latestExamKey = examKeys[examKeys.length - 1];
  const sumAnalysis = (latestExamKey && examAnalysis[latestExamKey]?.['总分']) || {};
  
  lineConfig.forEach(config => {
    // pass_rate 是嵌套结构 {特控线: {总分: 17.81,...}, 二本线: {...}}
    // top2_rate/top9_rate/top_rate 是直接科目→率
    let totalRate: number | undefined;
    const rateField = firstClassData?.[config.key];
    if (config.subKey && rateField && typeof rateField === 'object') {
      // 嵌套结构：pass_rate[特控线][总分]
      totalRate = rateField[config.subKey]?.['总分'];
    } else if (rateField && typeof rateField === 'object') {
      // 扁平结构：top2_rate[总分]
      totalRate = rateField['总分'];
    }
    
    const score = findPassLineScore(config.lineName);
    // 后端返回已是百分比数值（如85.5表示85.5%），不再乘以100
    const rate = (typeof totalRate === 'number') ? Math.round(totalRate * 10000) / 100 : null;
    const average = sumAnalysis.average ?? null;
    // 最高分来自 GET /api/analysis/class_analysis 的 class_summary.highest_total_score
    const maxScore = classSummaryData.value?.highest_total_score ?? null;
    // 进线人数来自 POST /api/average/class_pass_line_rate 的 pass_line_stats[statsKey].总分.pass_count
    let count: number | null = null;
    const statsKey = config.statsKey;
    const passLineStats = firstClassData?.pass_line_stats;
    if (statsKey && passLineStats && passLineStats[statsKey] && passLineStats[statsKey]['总分']) {
      const passCount = passLineStats[statsKey]['总分'].pass_count;
      count = (typeof passCount === 'number') ? passCount : null;
    }
    
    if (score === null && rate === null && average === null) {
      hasEmptyData = true;
    }
    
    result.push({
      key: `${config.key}_${config.subKey || 'flat'}`,
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

// 小题得分率表列
const questionStatColumns = [
  { title: '题号', dataIndex: 'question_key', width: 100, align: 'center' },
  { title: '题型', dataIndex: 'question_type', width: 100, align: 'center' },
  { title: '错误率', dataIndex: 'wrong_rate', width: 120, align: 'center' },
  { title: '错题人数', dataIndex: 'wrong_count', width: 100, align: 'center' },
  { title: '参考人数', dataIndex: 'participant_count', width: 100, align: 'center' },
];

// 小题统计表格数据
const questionStatTableData = computed(() => {
  return questionStatData.value.map((item: any, index: number) => {
    const wrongRate = typeof item.wrong_rate === 'number'
      ? Math.round(item.wrong_rate * 10000) / 100
      : (item.wrong_rate ?? 0);
    return {
      key: item.id || `${item.question_key || 'q'}_${index}`,
      question_key: item.question_key ?? item.string_number ?? '-',
      question_type: item.question_type ?? item.type ?? '-',
      wrong_rate: wrongRate,
      wrong_count: item.wrong_count ?? 0,
      participant_count: item.participant_count ?? 0,
    };
  });
});

const getWrongRateClass = (rate: number | null | undefined): string => {
  if (rate === null || rate === undefined) return '';
  if (rate >= 70) return 'change-down';
  if (rate >= 40) return 'rate-mid';
  return 'change-up';
};

// 获取班级综合分析数据的第一个班级（供模板使用）
const firstClassDataOfClassAnalysis = computed(() => {
  return Array.isArray(classAnalysisData.value) 
    ? (classAnalysisData.value[0] || {}) 
    : classAnalysisData.value;
});

// 加载可选试卷列表
const fetchPaperOptions = async () => {
  if (questionStatExamId.value == null) {
    paperOptions.value = [];
    return;
  }
  try {
    const res = await getTestPaper({ exam_id: questionStatExamId.value });
    if (res.code === 200 && res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.records || res.data.list || []);
      paperOptions.value = list.map((p: any) => ({
        id: p.id || p.test_paper_id,
        name: p.name || p.paper_name || `试卷${p.id || p.test_paper_id}`,
      }));
      if (!questionStatPaperId.value && paperOptions.value.length > 0) {
        questionStatPaperId.value = paperOptions.value[0].id;
      }
    } else {
      paperOptions.value = [];
    }
  } catch (err) {
    console.error('获取试卷列表失败:', err);
    paperOptions.value = [];
  }
};

// 小题得分率数据
const fetchQuestionStat = async () => {
  if (questionStatExamId.value == null) {
    message.warning('请先选择考试');
    return;
  }
  if (!questionStatPaperId.value) {
    await fetchPaperOptions();
  }
  if (!questionStatPaperId.value) {
    message.warning('该考试下没有试卷，请先上传试卷');
    questionStatData.value = [];
    return;
  }
  questionStatLoading.value = true;
  try {
    const res = await getClassQuestionStat({
      exam_id: questionStatExamId.value,
      test_paper_id: questionStatPaperId.value,
      class_id: String(selectedClass.value),
      refresh: '1',
    });
    if (res.code === 200) {
      questionStatData.value = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
    } else {
      console.error('获取小题统计失败', res);
      questionStatData.value = [];
    }
  } catch (err) {
    console.error('获取小题统计失败:', err);
    questionStatData.value = [];
  } finally {
    questionStatLoading.value = false;
  }
};

// 历史考试进线数据 ECharts 配置（柱：进线人数；折：进线率）
const historyPassLineChartOption = computed(() => {
  const data = historyPassLineData.value || [];
  const xAxisData = data.map(d => d.exam_name || `考试${d.exam_id}`);
  const passCountData = data.map(d => d.pass_count ?? 0);
  const passRateData = data.map(d => d.pass_rate ?? 0);

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['进线人数', '进线率(%)'], top: 0 },
    grid: { left: 50, right: 50, top: 40, bottom: 60 },
    xAxis: { type: 'category', data: xAxisData, axisLabel: { rotate: 30, interval: 0 } },
    yAxis: [
      { type: 'value', name: '进线人数', position: 'left' },
      { type: 'value', name: '进线率(%)', position: 'right', min: 0, max: 100 },
    ],
    series: [
      {
        name: '进线人数',
        type: 'bar',
        data: passCountData,
        itemStyle: { color: '#4b6cb7' },
        barMaxWidth: 40,
      },
      {
        name: '进线率(%)',
        type: 'line',
        yAxisIndex: 1,
        data: passRateData,
        smooth: true,
        itemStyle: { color: '#ff7a45' },
        lineStyle: { width: 2 },
      },
    ],
  };
});

// 加载历史考试进线数据
const fetchHistoryPassLineData = async () => {
  historyChartLoading.value = true;
  try {
    const firstClassData = Array.isArray(passLineRateData.value)
      ? (passLineRateData.value[0] || {})
      : (passLineRateData.value || {});
    const passLineStats = firstClassData?.pass_line_stats || {};
    const rateField = firstClassData?.pass_rate || {};
    const subjectKey = '总分';

    const result = (examList.value || []).map((exam: any) => {
      const examId = exam.id;
      const countInfo = passLineStats['一本']?.[subjectKey] || {};
      const examRate = rateField?.['特控线']?.[subjectKey];
      const examAnalysis = firstClassData?.exam_analysis?.[examId] || {};
      const examStat = examAnalysis?.[subjectKey] || {};
      const examPassCount = examStat?.pass_count ?? countInfo.pass_count ?? 0;
      const examRateVal = typeof examRate === 'number' ? examRate : (countInfo.pass_rate ?? 0);
      return {
        exam_id: examId,
        exam_name: exam.name || `考试${examId}`,
        pass_count: examPassCount,
        pass_rate: typeof examRateVal === 'number' ? Math.round(examRateVal * 100) / 100 : 0,
      };
    });

    historyPassLineData.value = result.length > 0 ? result : [{
      exam_id: 0,
      exam_name: '暂无历史考试',
      pass_count: 0,
      pass_rate: 0,
    }];
  } catch (err) {
    console.error('构建历史考试数据失败:', err);
    historyPassLineData.value = [];
  } finally {
    historyChartLoading.value = false;
  }
};

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

  .section-title {
    font-size: 20px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 12px;
    padding-left: 8px;
    border-left: 4px solid #1890ff;
    text-align: left;
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

  .trend-text {
    color: #2c3e50;
    font-size: 13px;
    font-weight: 500;
  }

  :deep(.change-up) {
    color: #52c41a;
    font-weight: 600;
  }

  :deep(.change-down) {
    color: #ff4d4f;
    font-weight: 600;
  }

  .updown-card {
    margin-top: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    :deep(.ant-card-head) {
      border-bottom: none;
      padding: 16px 16px 0 16px;
      min-height: auto;
      background: transparent;
    }

    :deep(.ant-card-head-title) {
      padding: 0;
    }

    :deep(.ant-card-body) {
      padding: 0 16px 16px 16px;
    }

    .updown-filter {
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #f5f7fa;
      border-radius: 6px;
    }
    
    .student-name {
      font-weight: 500;
      color: #2c3e50;
    }
    
    .change-up {
      color: #52c41a;
      font-weight: 600;
    }
    
    .change-down {
      color: #ff4d4f;
      font-weight: 600;
    }

    .rate-mid {
      color: #fa8c16;
      font-weight: 600;
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

  .question-stat-card,
  .history-card {
    margin-top: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    :deep(.ant-card-head) {
      border-bottom: none;
      padding: 16px 16px 0 16px;
      min-height: auto;
      background: transparent;
    }

    :deep(.ant-card-head-title) {
      padding: 0;
    }

    :deep(.ant-card-body) {
      padding: 0 16px 16px 16px;
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

    .updown-filter {
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #f5f7fa;
      border-radius: 6px;
    }

    .chart-wrapper {
      width: 100%;
    }
  }
}
</style>

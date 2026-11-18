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
      
      <!-- 分数线对比表格（两次考试对比） -->
      <a-card class="compare-card">
        <template #title>
          <div class="section-title">分数线对比</div>
        </template>
        <!-- 筛选区 -->
        <div class="compare-filter">
          <a-space wrap :size="12" align="center">
            <span>基准考试：</span>
            <a-select
              v-model:value="baseExamId"
              placeholder="选择基准考试"
              style="width: 200px"
              allow-clear
            >
              <a-select-option v-for="exam in examList" :key="exam.id" :value="exam.id">
                {{ exam.name }}
              </a-select-option>
            </a-select>
            <span>对比考试：</span>
            <a-select
              v-model:value="compareExamId"
              placeholder="选择对比考试"
              style="width: 200px"
              allow-clear
            >
              <a-select-option v-for="exam in examList" :key="exam.id" :value="exam.id">
                {{ exam.name }}
              </a-select-option>
            </a-select>
            <span>科目：</span>
            <a-select
              v-model:value="compareSubject"
              style="width: 130px"
            >
              <a-select-option v-for="opt in subjectOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </a-select-option>
            </a-select>
            <span>分数线类别：</span>
            <a-select
              v-model:value="compareLineType"
              style="width: 130px"
            >
              <a-select-option v-for="opt in lineTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </a-select-option>
            </a-select>
          </a-space>
        </div>
        <a-table
          :columns="compareColumns"
          :data-source="compareTableData"
          :pagination="false"
          bordered
          size="middle"
          row-key="key"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'baseScore'">
              <span v-if="record.baseScore !== null && record.baseScore !== undefined">{{ record.baseScore }}</span>
              <span v-else class="empty-value">未配置</span>
            </template>
            <template v-else-if="column.dataIndex === 'compareScore'">
              <span v-if="record.compareScore !== null && record.compareScore !== undefined">{{ record.compareScore }}</span>
              <span v-else class="empty-value">未配置</span>
            </template>
            <template v-else-if="column.dataIndex === 'change'">
              <span v-if="record.change !== null && record.change !== undefined" :class="record.change > 0 ? 'change-up' : (record.change < 0 ? 'change-down' : 'change-flat')">
                {{ record.change > 0 ? '↑' + record.change : (record.change < 0 ? '↓' + Math.abs(record.change) : '持平') }}
              </span>
              <span v-else class="empty-value">-</span>
            </template>
          </template>
        </a-table>
        <a-alert
          v-if="showEmptyTip"
          message="提示"
          description="部分分数线数据需要后台先配置（如211、985、清北线）。显示「未配置」表示该场考试未设置对应分数线。"
          type="info"
          show-icon
          closable
          style="margin-top: 12px;"
        />
      </a-card>

      <!-- 进退步学生（两次考试对比） -->
      <a-card class="updown-card">
        <template #title>
          <div class="section-title">进退步学生</div>
        </template>
        <div class="updown-filter">
          <a-space wrap :size="12" align="center">
            <span>基准考试：</span>
            <a-select
              v-model:value="updownBaseExamId"
              placeholder="选择基准考试"
              style="width: 200px"
              allow-clear
            >
              <a-select-option v-for="exam in examList" :key="exam.id" :value="exam.id">
                {{ exam.name }}
              </a-select-option>
            </a-select>
            <span>对比考试：</span>
            <a-select
              v-model:value="updownCompareExamId"
              placeholder="选择对比考试"
              style="width: 200px"
              allow-clear
            >
              <a-select-option v-for="exam in examList" :key="exam.id" :value="exam.id">
                {{ exam.name }}
              </a-select-option>
            </a-select>
            <span>科目：</span>
            <a-select
              v-model:value="updownSubject"
              style="width: 130px"
            >
              <a-select-option v-for="opt in updownSubjectOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </a-select-option>
            </a-select>
            <a-button type="primary" size="small" :loading="updownLoading" @click="fetchUpDownData()">查询</a-button>
          </a-space>
        </div>
        <a-table
          :columns="updownColumns"
          :data-source="updownData"
          :pagination="false"
          bordered
          size="middle"
          row-key="key"
          :scroll="{ x: 'max-content',y: '500px' }"
          :loading="updownLoading"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'name'">
              <span class="student-name">{{ record.name }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'classChange' || column.dataIndex === 'gradeChange'">
              <span :class="getChangeClass(record[column.dataIndex])">
                {{ formatChange(record[column.dataIndex]) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'scoreChange'">
              <span :class="getScoreChangeClass(record.scoreChange)">
                {{ formatScoreChange(record.scoreChange) }}
              </span>
            </template>
            <template v-else>
              <span>{{ record[column.dataIndex] ?? '-' }}</span>
            </template>
          </template>
        </a-table>
        <a-alert
          v-if="updownData.length === 0 && !updownLoading"
          message="暂无进退步数据"
          description="请选择基准考试、对比考试和科目，点击查询按钮对比班级学生的进退步情况。"
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
              @change="fetchQuestionStat()"
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
              @change="fetchQuestionStat()"
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
              @click="fetchQuestionStat()"
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
            <template v-if="column.dataIndex === 'question_number'">
              <span>{{ record.question_number }}</span>
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
              <e-charts :option="historyPassLineChartOption" autoresize style="height: 380px; width: 100%;" />
            </div>
          </a-col>
        </a-row>
        <a-alert
          v-if="historyPassLineData.length === 0 && !historyChartLoading"
          message="暂无历史考试进线数据"
          description="后端暂未返回按场次统计的班级进线数据，接口就绪后此处会自动展示。"
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
import { loadTeacherClasses, preferredTeacherClass, rememberTeacherClass } from '@/utils/teacherClasses';
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
const passLineConfigData = ref<any[]>([]); // 分数线配置数据（兼容旧逻辑，保留）
const showEmptyTip = ref(false); // 显示空数据提示
const flatPassLineRateData = ref<any[]>([]); // 展平后的过线率数据（供子组件折线图使用）

// ========== 分数线对比（两次考试对比） ==========
const baseExamId = ref<number | null>(null); // 基准考试（左，默认倒数第二次）
const compareExamId = ref<number | null>(null); // 对比考试（右，默认最新）
const compareSubject = ref<string>('全部'); // 选择的科目
const compareLineType = ref<string>('特控线'); // 选择的分数线类别
const passLineConfigBase = ref<any[]>([]); // 基准考试分数线配置
const passLineConfigCompare = ref<any[]>([]); // 对比考试分数线配置

// 分数线类别选项（与后端 line_name 后缀对应）
const lineTypeOptions = [
  { label: '全部类别', value: '全部' },
  { label: '特控线', value: '特控线' },
  { label: '二本线', value: '二本线' },
  { label: '211线', value: '211线' },
  { label: '985线', value: '985线' },
  { label: '清北线', value: '清北线' },
];
// 科目选项
const subjectOptions = [
  { label: '全部科目', value: '全部' },
  { label: '总分', value: '总分' },
  { label: '语文', value: '语文' },
  { label: '数学', value: '数学' },
  { label: '英语', value: '英语' },
  { label: '物理', value: '物理' },
  { label: '化学', value: '化学' },
  { label: '生物', value: '生物' },
  { label: '政治', value: '政治' },
  { label: '历史', value: '历史' },
  { label: '地理', value: '地理' },
];
// 进退步科目选项（每次对比一个具体科目，不含"全部"）
const updownSubjectOptions = subjectOptions.filter(o => o.value !== '全部');

// 根据班级选科判断方向（历史方向/物理方向/未选科）
const getDirection = (): string => {
  const sel = currentClassInfo.value?.subject_selection || '';
  if (sel.includes('物')) return '物理方向';
  if (sel.includes('史')) return '历史方向';
  return '未选科';
};

// 进退步学生相关（两次考试对比：基准=上一次，对比=最新）
const updownLoading = ref(false);
const updownBaseExamId = ref<number | null>(null); // 基准考试（左，默认上一次）
const updownCompareExamId = ref<number | null>(null); // 对比考试（右，默认最新）
const updownSubject = ref<string>('总分'); // 对比科目
const updownData = ref<any[]>([]);
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
  rememberTeacherClass(userStore.getUserInfo(), selectedClass.value);
  if (selectedClass.value > 0) {
    // 切换班级时重置考试选择，让 fetchPassLineConfig / fetchExamList 重新设置默认值
    baseExamId.value = null;
    compareExamId.value = null;
    updownBaseExamId.value = null;
    updownCompareExamId.value = null;
    updownData.value = [];
    questionStatExamId.value = null;
    questionStatPaperId.value = null;
    questionStatData.value = [];
    await batchComputeData();
  }
});

// 考试变化时刷新试卷列表
watch(questionStatExamId, async (val) => {
  if (val != null) {
    questionStatPaperId.value = null;
    await fetchPaperOptions();
    // 试卷默认选中后自动加载小题统计，无需手动点击查询
    if (questionStatPaperId.value) {
      await fetchQuestionStat(true);
    }
  }
});

// 分数线对比：基准考试变化时重新获取
watch(baseExamId, () => {
  if (baseExamId.value) refetchComparePassLine('base');
});
// 分数线对比：对比考试变化时重新获取
watch(compareExamId, () => {
  if (compareExamId.value) refetchComparePassLine('compare');
});

const batchComputeData = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  loading.value = true;
  
  try {
    // 先获取考试列表（分数线配置依赖考试ID）
    await fetchExamList();
    // 默认考试就绪后自动加载进退步学生数据（不阻塞其他模块）
    if (updownBaseExamId.value && updownCompareExamId.value) {
      fetchUpDownData(true);
    }
    // 并行请求其他数据
    await Promise.all([
      getClassAnalysisfunc(),
      getClassAnalysisDetailfunc(),
      getClassPassLineRatefunc(),
      getClassComprehensiveStudentGradesfunc(),
      fetchPassLineConfig(),
    ]);
    // 历史进线图依赖过线率数据，必须在 getClassPassLineRatefunc 完成后执行
    await fetchHistoryPassLineData();
    
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
  const classes = await loadTeacherClasses<ClassInfo>();

  if (classes.length > 0) {
    selectedClass.value = preferredTeacherClass(userInfo, classes).id;
    classList.value = classes;
  } else {
    message.warning('暂无已绑定的班级，请联系管理员');
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

// 获取分数线配置（两次考试：基准 + 对比）
const fetchPassLineConfig = async () => {
  if (selectedClass.value <= 0) {
    return;
  }
  
  try {
    // examList 按时间倒序（最新在前）
    const latestExam = examList.value[0];
    const prevExam = examList.value[1];
    
    // 基准考试：最新考试；对比考试：上一场考试
    if (baseExamId.value === null) {
      baseExamId.value = latestExam ? latestExam.id : null;
    }
    if (compareExamId.value === null) {
      compareExamId.value = prevExam ? prevExam.id : (latestExam ? latestExam.id : null);
    }
    
    // 并行获取两次考试的分数线配置
    const tasks: Promise<any>[] = [];
    if (baseExamId.value) {
      tasks.push(getPassLine({ exam_id: baseExamId.value, size: 200 }).then(res => {
        passLineConfigBase.value = (res.code === 200 && res.data) ? (res.data.records || res.data.list || res.data || []) : [];
      }));
    } else {
      passLineConfigBase.value = [];
    }
    if (compareExamId.value) {
      tasks.push(getPassLine({ exam_id: compareExamId.value, size: 200 }).then(res => {
        passLineConfigCompare.value = (res.code === 200 && res.data) ? (res.data.records || res.data.list || res.data || []) : [];
        passLineConfigData.value = passLineConfigCompare.value;
      }));
    } else {
      passLineConfigCompare.value = [];
      passLineConfigData.value = [];
    }
    
    await Promise.all(tasks);
  } catch (err) {
    console.error('获取分数线配置失败:', err);
    passLineConfigBase.value = [];
    passLineConfigCompare.value = [];
    passLineConfigData.value = [];
  }
};

// 考试选择变化时，重新获取对应考试的分数线数据
const refetchComparePassLine = async (which: 'base' | 'compare' | 'both' = 'both') => {
  try {
    const tasks: Promise<any>[] = [];
    if ((which === 'base' || which === 'both') && baseExamId.value) {
      tasks.push(getPassLine({ exam_id: baseExamId.value, size: 200 }).then(res => {
        passLineConfigBase.value = (res.code === 200 && res.data) ? (res.data.records || res.data.list || res.data || []) : [];
      }));
    }
    if ((which === 'compare' || which === 'both') && compareExamId.value) {
      tasks.push(getPassLine({ exam_id: compareExamId.value, size: 200 }).then(res => {
        passLineConfigCompare.value = (res.code === 200 && res.data) ? (res.data.records || res.data.list || res.data || []) : [];
        passLineConfigData.value = passLineConfigCompare.value;
      }));
    }
    await Promise.all(tasks);
  } catch (err) {
    console.error('重新获取分数线配置失败:', err);
  }
};

// 分数线对比表格列（根据选择动态变化）
const compareColumns = computed(() => {
  const isLineMode = compareLineType.value === '全部'; // 行=分数线类别
  const firstColTitle = isLineMode ? '分数线类别' : '科目';
  return [
    { title: firstColTitle, dataIndex: 'name', width: 120, align: 'center' },
    { title: '基准分', dataIndex: 'baseScore', width: 100, align: 'center' },
    { title: '对比分', dataIndex: 'compareScore', width: 100, align: 'center' },
    { title: '涨跌', dataIndex: 'change', width: 100, align: 'center' },
  ];
});

// 从分数线配置中查找指定类别+科目的分数
const findLineScore = (data: any[], lineType: string, subject: string): number | null => {
  if (!data || data.length === 0) return null;
  const direction = getDirection();
  const targetName = `${direction}${lineType}`;
  const matched = data.find((item: any) => {
    return item.line_name === targetName && item.subject === subject;
  });
  if (matched) return matched.score ?? null;
  // 回退：不区分方向，按后缀匹配
  const fallback = data.find((item: any) => {
    const name = item.line_name || '';
    return name.endsWith(lineType) && item.subject === subject;
  });
  return fallback?.score ?? null;
};

// 进退步学生表格列（基准 vs 对比 两次考试：班次/段次/分数 + 涨跌）
const updownColumns = [
  { title: '学生姓名', dataIndex: 'name', width: 100, align: 'center', fixed: 'left' },
  { title: '基准班次', dataIndex: 'baseClassRank', width: 90, align: 'center' },
  { title: '基准段次', dataIndex: 'baseGradeRank', width: 90, align: 'center' },
  { title: '基准分数', dataIndex: 'baseScore', width: 90, align: 'center' },
  { title: '对比班次', dataIndex: 'compareClassRank', width: 90, align: 'center' },
  { title: '对比段次', dataIndex: 'compareGradeRank', width: 90, align: 'center' },
  { title: '对比分数', dataIndex: 'compareScore', width: 90, align: 'center' },
  { title: '班次涨跌', dataIndex: 'classChange', width: 90, align: 'center' },
  { title: '段次涨跌', dataIndex: 'gradeChange', width: 90, align: 'center' },
  { title: '分数涨跌', dataIndex: 'scoreChange', width: 90, align: 'center' },
];

// 格式化进退步显示（名次变化：正数=进步，负数=退步）
const formatChange = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return '-';
  if (val === 0) return '持平';
  if (val > 0) return `↓${val}`;
  return `↑${Math.abs(val)}`;
};

// 获取进退步样式类
const getChangeClass = (val: number | null | undefined): string => {
  if (val === null || val === undefined || val === 0) return '';
  return val < 0 ? 'change-up' : 'change-down';
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

// 获取班级考试列表
const fetchExamList = async () => {
  if (selectedClass.value <= 0) return;
  try {
    const res = await getClassExam({ class_id: selectedClass.value });
    if (res.code === 200 && res.data) {
      examList.value = Array.isArray(res.data) ? res.data : (res.data.records || res.data.list || []);
      // examList 是按时间倒序，0：最新，1：上一次
      const latest = examList.value[0];
      const prev = examList.value[1];

      // ========== 进退步：基准=最新，对比=上一场（和分数线对比逻辑保持一致） ==========
      if (updownBaseExamId.value === null) {
        updownBaseExamId.value = latest ? latest.id : null;
      }
      if (updownCompareExamId.value === null) {
        updownCompareExamId.value = prev ? prev.id : (latest ? latest.id : null);
      }

      // ========== 考题得分率：默认最新 ==========
      if (questionStatExamId.value == null && latest) {
        questionStatExamId.value = latest.id;
      }
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

// 从进退步记录中提取考试ID（兼容 exam_id 与 exam[0].id 两种结构）
const getExamId = (item: any): number | null => {
  if (!item) return null;
  if (item.exam_id !== undefined && item.exam_id !== null) return Number(item.exam_id);
  if (Array.isArray(item.exam) && item.exam[0]?.id !== undefined && item.exam[0]?.id !== null) {
    return Number(item.exam[0].id);
  }
  return null;
};

// 批量获取所有学生的两次考试进退步对比数据（基准 vs 对比）
const fetchUpDownData = async (silent = false) => {
  if (updownLoading.value) return;
  if (selectedClass.value <= 0) {
    if (!silent) message.warning('请先选择班级');
    return;
  }
  if (!updownBaseExamId.value || !updownCompareExamId.value) {
    if (!silent) message.warning('请选择基准考试和对比考试');
    return;
  }

  updownLoading.value = true;

  try {
    // 1. 先获取班级所有学生
    await fetchClassStudents();

    if (classStudentList.value.length === 0) {
      if (!silent) message.info('该班级没有学生');
      updownData.value = [];
      return;
    }

    const subject = updownSubject.value || '总分';
    // 字段名：总分→总分/总分班次/总分段次；单科→`${科目}`/`${科目}班次`/`${科目}段次`
    const scoreKey = subject === '总分' ? '总分' : subject;
    const classRankKey = subject === '总分' ? '总分班次' : `${subject}班次`;
    const gradeRankKey = subject === '总分' ? '总分段次' : `${subject}段次`;
    const baseExamId = updownBaseExamId.value;
    const compareExamId = updownCompareExamId.value;

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

          try {
            const res = await getUpDownDetailAnalysis({
              student_id: String(studentId),
              nums: 9999,
            });
            if (res.code !== 200 || !res.data) return null;

            const records = Array.isArray(res.data) ? res.data : [res.data];
            // 按考试ID建立映射，便于直接取基准/对比两场
            const byExam = new Map<number, any>();
            records.forEach((r: any) => {
              const eid = getExamId(r);
              if (eid != null) byExam.set(eid, r);
            });

            const read = (record: any, key: string): number | null => {
              if (!record) return null;
              const v = record[key];
              if (v === undefined || v === null || v === '') return null;
              const num = Number(v);
              return isNaN(num) ? null : num;
            };

            const baseRecord = byExam.get(baseExamId);
            const compareRecord = byExam.get(compareExamId);

            const baseClassRank = read(baseRecord, classRankKey);
            const baseGradeRank = read(baseRecord, gradeRankKey);
            const baseScore = read(baseRecord, scoreKey);
            const compareClassRank = read(compareRecord, classRankKey);
            const compareGradeRank = read(compareRecord, gradeRankKey);
            const compareScore = read(compareRecord, scoreKey);

            // 涨跌：名次=基准-对比（正数=进步），分数=对比-基准（正数=进步）
            const classChange = (baseClassRank != null && compareClassRank != null)
              ? baseClassRank - compareClassRank : null;
            const gradeChange = (baseGradeRank != null && compareGradeRank != null)
              ? baseGradeRank - compareGradeRank : null;
            const scoreChange = (baseScore != null && compareScore != null)
              ? compareScore - baseScore : null;

            return {
              key: String(studentId),
              name: studentName,
              baseClassRank,
              baseGradeRank,
              baseScore,
              compareClassRank,
              compareGradeRank,
              compareScore,
              classChange,
              gradeChange,
              scoreChange,
            };
          } catch (e) {
            console.error(`学生${studentId}查询失败:`, e);
            return null;
          }
        })
      );
      allResults.push(...batchResults.filter(Boolean));
    }

    updownData.value = allResults;
    if (allResults.length === 0 && !silent) {
      message.info('未查询到进退步数据');
    }
  } catch (err) {
    console.error('获取进退步数据失败:', err);
    updownData.value = [];
  } finally {
    updownLoading.value = false;
  }
};

// 构建表格数据
// 分数线对比表格数据：两次考试的分数线对比
const compareTableData = computed(() => {
  const result: any[] = [];
  const lineMode = compareLineType.value === '全部'; // 行=分数线类别

  if (lineMode) {
    // 行=各分数线类别，分数取所选科目（或总分）
    const subject = compareSubject.value === '全部' ? '总分' : compareSubject.value;
    lineTypeOptions.filter(o => o.value !== '全部').forEach(opt => {
      const baseScore = findLineScore(passLineConfigBase.value, opt.value, subject);
      const compareScore = findLineScore(passLineConfigCompare.value, opt.value, subject);
      const change = (baseScore != null && compareScore != null) ? (baseScore - compareScore) : null;
      result.push({
        key: opt.value,
        name: opt.label,
        baseScore,
        compareScore,
        change,
      });
    });
  } else {
    // 行=各科目，分数取所选分数线类别
    const lineType = compareLineType.value;
    const subjects = compareSubject.value === '全部'
      ? subjectOptions.filter(o => o.value !== '全部').map(o => o.value)
      : [compareSubject.value];
    subjects.forEach(subject => {
      const baseScore = findLineScore(passLineConfigBase.value, lineType, subject);
      const compareScore = findLineScore(passLineConfigCompare.value, lineType, subject);
      const change = (baseScore != null && compareScore != null) ? (baseScore - compareScore) : null;
      result.push({
        key: subject,
        name: subject,
        baseScore,
        compareScore,
        change,
      });
    });
  }

  // 是否有未配置数据
  const hasEmpty = result.some(r => r.baseScore == null || r.compareScore == null);
  showEmptyTip.value = hasEmpty;
  return result;
});

// 小题得分率表列
const questionStatColumns = [
  { title: '题号', dataIndex: 'question_number', width: 100, align: 'center' },
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
      key: item.id || `${item.question_number || 'q'}_${index}`,
      question_number: item.question_number ?? item.string_number ?? '-',
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
const fetchQuestionStat = async (silent = false) => {
  if (questionStatExamId.value == null) {
    if (!silent) message.warning('请先选择考试');
    return;
  }
  if (!questionStatPaperId.value) {
    await fetchPaperOptions();
  }
  if (!questionStatPaperId.value) {
    if (!silent) message.warning('该考试下没有试卷，请先上传试卷');
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
    const subjectKey = '总分';

    const result = (examList.value || []).map((exam: any) => {
      const examId = exam.id;
      // 只取后端返回的该场考试明细；exam_analysis 缺失时留 null，
      // 不用累计口径的 pass_line_stats 冒充单场数据
      const examStat = firstClassData?.exam_analysis?.[examId]?.[subjectKey] || {};
      return {
        exam_id: examId,
        exam_name: exam.name || `考试${examId}`,
        pass_count: typeof examStat.pass_count === 'number' ? examStat.pass_count : null,
        pass_rate: typeof examStat.pass_rate === 'number' ? Math.round(examStat.pass_rate * 100) / 100 : null,
      };
    });

    // 后端暂未提供按场次数据时保持为空，由下方 alert 提示，不伪造占位数据
    historyPassLineData.value = result.filter(
      (item: any) => item.pass_count !== null || item.pass_rate !== null
    );
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
    
    .compare-filter {
      margin-bottom: 16px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 6px;
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

<template>
  <div class="student-challenge-page">
    <!-- 头部区域 -->
    <a-card :bordered="false" class="header-card">
      <div class="header-content">
        <h2>学生挑战</h2>
        <p>选择考试和对手，进行学科维度对比分析</p>
      </div>
    </a-card>

    <!-- 筛选区域 -->
    <a-card :bordered="false" class="filter-card">
      <template #title>
        <span class="card-title">筛选条件</span>
      </template>
      
      <a-row :gutter="[24, 24]">
        <!-- 班级选择（不可改） -->
        <a-col :span="24" :md="12">
          <div class="filter-item">
            <span class="label">所属班级：</span>
            <a-select
              v-model:value="selectedClassId"
              placeholder="选择班级"
              style="width: 100%"
              disabled
            >
              <a-select-option
                v-for="cls in classList"
                :key="cls.id"
                :value="cls.id"
              >
                {{ cls.name }}
              </a-select-option>
            </a-select>
          </div>
        </a-col>

        <!-- 考试选择 -->
        <a-col :span="24" :md="12">
          <div class="filter-item">
            <span class="label">选择考试：</span>
            <a-select
              v-model:value="selectedExamId"
              placeholder="选择考试"
              style="width: 100%"
              :disabled="loading"
            >
              <a-select-option
                v-for="exam in examList"
                :key="exam.id"
                :value="exam.id"
              >
                {{ exam.name }}
              </a-select-option>
            </a-select>
          </div>
        </a-col>
      </a-row>

      <a-divider dashed />
      
      <div class="filter-subtitle">选择对手</div>

      <a-row :gutter="[24, 24]">
        <!-- 对手班级 -->
        <a-col :span="24" :md="12">
          <div class="filter-item">
            <span class="label">对手班级：</span>
            <a-select
              v-model:value="opponentClassId"
              placeholder="选择对手班级"
              style="width: 100%"
              :disabled="loading"
              @change="fetchOpponentStudents"
            >
              <a-select-option
                v-for="cls in opponentClassList"
                :key="cls.id"
                :value="cls.id"
              >
                {{ cls.name }}
              </a-select-option>
            </a-select>
          </div>
        </a-col>

        <!-- 对手姓名 -->
        <a-col :span="24" :md="12">
          <div class="filter-item">
            <span class="label">对手姓名：</span>
            <a-input
              v-model:value="opponentNameInput"
              placeholder="请输入对手姓名"
              style="width: 100%"
              :disabled="loading"
              allow-clear
              @change="handleOpponentNameChange"
            />
          </div>
        </a-col>
      </a-row>

      <!-- 开始对比按钮 -->
      <div class="action-area">
        <a-button 
          type="primary" 
          @click="runComparison"
          :disabled="isCompareBtnDisabled" 
          :loading="loading"
          class="compare-button"
        >
          开始挑战
        </a-button>
      </div>
      
      <div class="tip-section">
        说明：默认选择最近一次考试，输入对手姓名后点击"开始挑战"进行学科维度比较。
      </div>
    </a-card>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large" tip="加载中..." />
    </div>

    <!-- 挑战结果提示 -->
    <div v-if="!loading && showComparisonTables" class="result-section">
      <a-card :bordered="false" class="result-card">
        <div class="challenge-result-header" :class="totalScoreDiff >= 0 ? 'success' : 'error'">
          <div class="result-badge">
             <span v-if="totalScoreDiff >= 0">✔</span>
             <span v-else>✖</span>
          </div>
          <div class="result-content">
            <h3 class="result-title">{{ userInfo?.student?.name || '本人' }} 挑战{{ totalScoreDiff >= 0 ? '成功' : '失败' }}</h3>
            <div class="score-diff">
              <span class="diff-label">总分差距：</span>
              <span class="diff-value" :class="totalScoreDiff >= 0 ? 'positive' : 'negative'">
                {{ totalScoreDiff >= 0 ? '+' : '' }}{{ totalScoreDiff.toFixed(1) }}
              </span>
            </div>
          </div>
        </div>
        
        <a-row :gutter="24" class="analysis-row">
          <a-col :span="24" :md="12">
            <div class="analysis-item advantage">
              <span class="analysis-label">优势科目：</span>
              <div class="subject-tags">
                <a-tag v-for="(sub, idx) in getAdvantageSubjects()" :key="idx" color="success">{{ sub }}</a-tag>
                <span v-if="getAdvantageSubjects().length === 0" class="no-subject">暂无</span>
              </div>
            </div>
          </a-col>
          <a-col :span="24" :md="12">
            <div class="analysis-item disadvantage">
              <span class="analysis-label">劣势科目：</span>
              <div class="subject-tags">
                <a-tag v-for="(sub, idx) in getDisadvantageSubjects()" :key="idx" color="error">{{ sub }}</a-tag>
                <span v-if="getDisadvantageSubjects().length === 0" class="no-subject">暂无</span>
              </div>
            </div>
          </a-col>
        </a-row>
      </a-card>
    </div>

    <!-- 对比结果区域（分数+段次双表格） -->
    <div v-if="!loading && showComparisonTables" class="comparison-results">
      <!-- 分数对比表格 -->
      <a-card :bordered="false" class="table-card" title="分数对比">
        <a-table
          :data-source="scoreComparisonData"
          bordered
          :columns="scoreColumns"
          :pagination="false"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'diff'">
              <span class="diff-text" :class="getScoreDiffClass(record.diff)">
                {{ Number(record.diff) > 0 ? '+' : '' }}{{ record.diff }}
              </span>
            </template>
          </template>
        </a-table>
      </a-card>

      <!-- 段次对比表格 -->
      <a-card :bordered="false" class="table-card" title="段次对比">
        <a-table
          :data-source="rankComparisonData"
          bordered
          :columns="rankColumns"
          :pagination="false"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'classDiff'">
              <span class="diff-text" :class="getRankDiffClass(record.classDiffRaw)">
                {{ record.classDiffRaw < 0 ? '-' : record.classDiffRaw > 0 ? '+' : '' }}{{ record.classDiff }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'gradeDiff'">
              <span class="diff-text" :class="getRankDiffClass(record.gradeDiffRaw)">
                {{ record.gradeDiffRaw < 0 ? '-' : record.gradeDiffRaw > 0 ? '+' : '' }}{{ record.gradeDiff }}
              </span>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 无数据状态 -->
    <div v-if="!loading && !showComparisonTables && hasSearched" class="empty-state">
      <a-empty description="未找到对比数据，请检查选择条件或对手信息是否正确" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { useUserStore } from '@/store';
import { getClassesApi } from '@/servers/api/classes';
import { getClassExam } from '@/servers/api/grade';
import { getStudentApi } from '@/servers/api/student';
import { getCompareWithStudent } from '@/servers/api/analysis';

// 状态管理
const userStore = useUserStore();
const userInfo = userStore.userInfo;

// 核心状态
const loading = ref(false);
const showComparisonTables = ref(false);
const hasSearched = ref(false); // 标记是否执行过对比

// 班级相关（不可改）
const classList = ref<any[]>([]);
const selectedClassId = ref<number | undefined>(userInfo?.student?.class_id);

// 考试相关
const examList = ref<any[]>([]);
const selectedExamId = ref<number>(0);

// 对手相关
const opponentClassList = ref<any[]>([]);
const opponentClassId = ref<number | undefined>();
const opponentStudents = ref<any[]>([]); // 对手班级学生列表
const filteredOpponentStudents = ref<any[]>([]); // 搜索过滤后的学生列表
const finalOpponentId = ref<string | undefined>(); // 最终使用的对手ID（选择/输入一体化）
const finalOpponentName = ref<string>('未知对手'); // 最终显示的对手姓名
const opponentNameInput = ref<string>(''); // 对手姓名输入框

// 对比数据
const currentStudentData = ref<any>({});
const compareStudentData = ref<any>({});
const scoreComparisonData = ref<any[]>([]); // 分数对比数据
const rankComparisonData = ref<any[]>([]); // 段次对比数据

// 学科名称映射（所有科目）
const allSubjectMap: Record<string, string> = {
  'yuwen': '语文',
  'shuxue': '数学',
  'yingyu': '英语',
  'wuli': '物理',
  'huaxue': '化学',
  'shengwu': '生物',
  'lishi': '历史',
  'zhengzhi': '政治',
  'dili': '地理',
  'sum': '总分'
};

// 根据学生选科过滤的科目映射
const subjectMap = computed(() => {
  const filteredMap: Record<string, string> = {
    'yuwen': '语文',
    'shuxue': '数学',
    'yingyu': '英语',
    'sum': '总分'
  };

  const selectedSubjects = userInfo?.student?.subject_selection;
  if (!selectedSubjects) {
    // 如果没有选科信息，显示所有科目
    return allSubjectMap;
  }

  // 根据选科信息过滤科目
  if (selectedSubjects.indexOf('物') !== -1) filteredMap.wuli = '物理';
  if (selectedSubjects.indexOf('化') !== -1) filteredMap.huaxue = '化学';
  if (selectedSubjects.indexOf('生') !== -1) filteredMap.shengwu = '生物';
  if (selectedSubjects.indexOf('史') !== -1) filteredMap.lishi = '历史';
  if (selectedSubjects.indexOf('政') !== -1) filteredMap.zhengzhi = '政治';
  if (selectedSubjects.indexOf('地') !== -1) filteredMap.dili = '地理';

  return filteredMap;
});

// 解析年级
const getCurrentGrade = () => {
  if (selectedClassId.value) {
    const classIdStr = selectedClassId.value.toString();
    return classIdStr.slice(0, 2);
  }
  return '';
};

// 初始化：获取班级、考试列表
const init = async () => {
  try {
    loading.value = true;
    // 1. 获取当前学生班级列表（默认选中当前班级，不可改）
    const classRes = await getClassesApi({ header: userInfo?.teacher?.uid });
    if (classRes.code === 200 && classRes.data.length > 0) {
      classList.value = classRes.data;
      // 若未自动选中，默认选第一个
      if (!selectedClassId.value && classList.value.length > 0) {
        selectedClassId.value = classList.value[0].id;
      }
    }

    // 2. 获取考试列表（默认选中最新考试）
    const examRes = await getClassExam({ class_id: selectedClassId.value });
    if (examRes.code === 200 && examRes.data.length > 0) {
      // 直接使用返回的考试对象数组（包含id和name）
      examList.value = examRes.data.map((exam: any) => ({
        id: exam.id,
        name: exam.name
      }));
      
      if (examList.value.length > 0) {
        selectedExamId.value = examList.value[0].id;
      }
    }

    // 3. 获取对手班级列表（排除当前班级）
    const allClassesRes = await getClassesApi({ school_id: userInfo?.student?.school_id });
    if (allClassesRes.code === 200) {
      const currentGrade = getCurrentGrade();
      opponentClassList.value = allClassesRes.data
        .filter((cls: any) => cls.id !== selectedClassId.value)
        .filter((cls: any) => {
          const classIdStr = cls.id.toString();
          const classGrade = classIdStr.slice(0, 2);
          return classGrade === currentGrade;
        });
    }
  } catch (err) {
    message.error('初始化数据失败');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 获取对手班级的学生列表
const fetchOpponentStudents = async () => {
  if (!opponentClassId.value) {
    opponentStudents.value = [];
    filteredOpponentStudents.value = [];
    finalOpponentName.value = '未知对手';
    return;
  }
  try {
    loading.value = true;
    const studentRes = await getStudentApi({ class_id: opponentClassId.value });
    if (studentRes.code === 200 && studentRes.data) {
      opponentStudents.value = studentRes.data.map((item: any) => ({
        id: item.uid,
        name: item.name,
        uid: item.uid,
        class_id: item.class_id
      }));
      filteredOpponentStudents.value = [...opponentStudents.value]; // 初始化过滤列表
    } else {
      message.warning(studentRes.msg || '获取对手学生列表失败');
      opponentStudents.value = [];
      filteredOpponentStudents.value = [];
      finalOpponentName.value = '未知对手';
    }
  } catch (err) {
    message.error('获取对手学生列表失败');
    console.error(err);
    finalOpponentName.value = '未知对手';
  } finally {
    loading.value = false;
  }
};

// 对手姓名搜索过滤
const handleOpponentSearch = (value: string) => {
  if (!value) {
    filteredOpponentStudents.value = [...opponentStudents.value];
    return;
  }
  const lowerValue = value.toLowerCase();
  filteredOpponentStudents.value = opponentStudents.value.filter((student: any) => 
    student.name.toLowerCase().includes(lowerValue) || 
    student.uid.toLowerCase().includes(lowerValue)
  );
};

const handleOpponentSelect = (studentId: string | undefined) => {
  if (studentId) {
    const selectedStudent = opponentStudents.value.find((s: any) => s.id === studentId);
    if (selectedStudent) {
      finalOpponentId.value = studentId;
      finalOpponentName.value = selectedStudent.name;
    }
  } else {
    finalOpponentId.value = undefined;
    finalOpponentName.value = '未知对手';
  }
};

// 手动输入对手姓名
const handleManualInput = (value: string) => {
  if (value) {
    finalOpponentName.value = value;
    const matchedStudent = opponentStudents.value.find(
      (s: any) => s.name.toLowerCase() === value.toLowerCase()
    );
    finalOpponentId.value = matchedStudent?.id || value;
  } else {
    finalOpponentId.value = undefined;
    finalOpponentName.value = '未知对手';
  }
};

// 处理对手姓名输入变化
const handleOpponentNameChange = () => {
  const value = opponentNameInput.value?.trim();
  if (value) {
    finalOpponentName.value = value;
    // 先尝试从已加载的学生列表中匹配
    const matchedStudent = opponentStudents.value.find(
      (s: any) => s.name === value
    );
    finalOpponentId.value = matchedStudent?.id || value;
  } else {
    finalOpponentId.value = undefined;
    finalOpponentName.value = '未知对手';
  }
};

// 计算总分差值
const totalScoreDiff = computed(() => {
  const currentTotal = getScoreValue(currentStudentData.value, 'sum');
  const opponentTotal = getScoreValue(compareStudentData.value, 'sum');
  return currentTotal - opponentTotal;
});

// 获取优势科目（本人分数 > 对手）
const getAdvantageSubjects = () => {
  return scoreComparisonData.value
    .filter(item => item.subject !== '总分' && Number(item.diff) > 0)
    .map(item => item.subject);
};

// 获取劣势科目
const getDisadvantageSubjects = () => {
  return scoreComparisonData.value
    .filter(item => item.subject !== '总分' && Number(item.diff) < 0)
    .map(item => item.subject);
};

// 执行对比（同时获取分数和段次数据）
const runComparison = async () => {
  if (!selectedExamId.value || !finalOpponentId.value || !userInfo?.student?.uid) {
    message.warning('请选择完整的对比条件（考试+对手班级+对手）');
    return;
  }

  try {
    loading.value = true;
    hasSearched.value = true;
    showComparisonTables.value = false;

    const res = await getCompareWithStudent({
      student_id: userInfo.student.uid,
      compare_student_id: finalOpponentId.value,
      selected_exam_id: selectedExamId.value.toString()
    });

    if (res.code === 200 && res.data) {
      currentStudentData.value = res.data.current_student;
      compareStudentData.value = res.data.compare_student;
      
      // 格式化分数对比数据（只显示选科的科目）
      scoreComparisonData.value = Object.entries(subjectMap.value).map(([en, cn]) => {
        const currentVal = getScoreValue(currentStudentData.value, en);
        const compareVal = getScoreValue(compareStudentData.value, en);
        return {
          subject: cn,
          current: currentVal,
          opponent: compareVal,
          diff: (currentVal - compareVal).toFixed(2)
        };
      });

      // 格式化段次对比数据（只显示选科的科目）
      rankComparisonData.value = Object.entries(subjectMap.value).map(([en, cn]) => {
      const currentClassRank = getClassRankValue(currentStudentData.value, en);
      const compareClassRank = getClassRankValue(compareStudentData.value, en);
      const currentGradeRank = getGradeRankValue(currentStudentData.value, en);
      const compareGradeRank = getGradeRankValue(compareStudentData.value, en);

      const classDiffRaw = currentClassRank - compareClassRank; 
      const gradeDiffRaw = currentGradeRank - compareGradeRank;

      return {
        subject: cn,
        currentClass: currentClassRank,
        opponentClass: compareClassRank,
        currentGrade: currentGradeRank,
        opponentGrade: compareGradeRank,
        classDiff: Math.abs(classDiffRaw), 
        gradeDiff: Math.abs(gradeDiffRaw),
        classDiffRaw,
        gradeDiffRaw,
      };
    });

      showComparisonTables.value = true;
    } else {
      message.error(res?.msg || '获取对比数据失败');
    }
  } catch (err) {
    message.error('获取对比数据失败');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 获取分数值
const getScoreValue = (data: any, subject: string) => {
  return subject === 'sum' ? (data.sum_ || 0) : (data[subject] || 0);
};

// 获取班级段次值
const getClassRankValue = (data: any, subject: string) => {
  return subject === 'sum' ? (data.sumb || 0) : (data[`${subject}b`] || 0);
};

// 获取年级段次值
const getGradeRankValue = (data: any, subject: string) => {
  return subject === 'sum' ? (data.sumd || 0) : (data[`${subject}d`] || 0);
};

// 分数差值样式（正数优于对手，绿色；负数红色）
const getScoreDiffClass = (diff: string) => {
  const diffNum = Number(diff);
  return diffNum > 0 ? 'positive' : diffNum < 0 ? 'negative' : 'zero';
};

// 段次差值样式
const getRankDiffClass = (diffRaw: number) => {
  if (diffRaw < 0) {
    // 本人名次 - 对手名次 < 0 → 绿色
    return 'positive';
  } else if (diffRaw > 0) {
    // 本人名次 - 对手名次 > 0 → 红色
    return 'negative';
  } else {
    // 并列 → 黑色
    return 'zero';
  }
};
// 对比按钮禁用状态
const isCompareBtnDisabled = computed(() => {
  return (
    loading.value || 
    !selectedClassId.value || 
    !selectedExamId.value || 
    !opponentClassId.value || 
    !finalOpponentId.value
  );
});

// 分数表格列定义
const scoreColumns = computed(() => [
  { title: '学科', dataIndex: 'subject', key: 'subject', width: 100 },
  { 
    title: `${userInfo?.student?.name || '本人'}`, 
    dataIndex: 'current', 
    key: 'current',
    width: 120,
    customRender: ({ value }: { value: any }) => value.toFixed(2)
  },
  { 
    title: `${finalOpponentName.value}`, 
    dataIndex: 'opponent', 
    key: 'opponent',
    width: 120,
    customRender: ({ value }: { value: any }) => value.toFixed(2)
  },
  { title: '分差（本人-对手）', dataIndex: 'diff', key: 'diff', width: 140 }
]);

// 段次表格列定义
const rankColumns = computed(() => [
  { title: '学科', dataIndex: 'subject', key: 'subject', width: 100 },
  // 班级段次
  { 
    title: `${userInfo?.student?.name || '本人'}（班级名次）`, 
    dataIndex: 'currentClass', 
    key: 'currentClass',
    width: 120,
    customRender: ({ value }: { value: any }) => value || '0'
  },
  { 
    title: `${finalOpponentName.value}（班级名次）`, 
    dataIndex: 'opponentClass', 
    key: 'opponentClass',
    width: 120,
    customRender: ({ value }: { value: any }) => value || '0'
  },
  { 
    title: '班级名次差', 
    dataIndex: 'classDiff', 
    key: 'classDiff', 
    width: 140,
  },
  // 年级段次
  { 
    title: `${userInfo?.student?.name || '本人'}（年级名次）`, 
    dataIndex: 'currentGrade', 
    key: 'currentGrade',
    width: 120,
    customRender: ({ value }: { value: any }) => value || '0'
  },
  { 
    title: `${finalOpponentName.value}（年级名次）`, 
    dataIndex: 'opponentGrade', 
    key: 'opponentGrade',
    width: 120,
    customRender: ({ value }: { value: any }) => value || '0'
  },
  { 
    title: '年级名次差', 
    dataIndex: 'gradeDiff', 
    key: 'gradeDiff', 
    width: 140,
  }
]);

// 页面加载时初始化数据
onMounted(init);
</script>

<style scoped lang="less">
.student-challenge-page {
  padding: 24px;
  min-height: 100%;
  background-color: #f0f2f5;

  .header-card {
    margin-bottom: 24px;
    border-radius: 8px;
    
    .header-content {
      h2 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.85);
      }
      p {
        margin: 0;
        color: rgba(0, 0, 0, 0.45);
      }
    }
  }

  .filter-card {
    margin-bottom: 24px;
    border-radius: 8px;

    .card-title {
      font-weight: 600;
      font-size: 16px;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      
      .label {
        font-weight: 500;
        color: rgba(0, 0, 0, 0.85);
      }
    }

    .filter-subtitle {
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
      margin: 16px 0;
      font-size: 15px;
      border-left: 3px solid #1890ff;
      padding-left: 10px;
    }

    .action-area {
      margin-top: 32px;
      display: flex;
      justify-content: center;

      .compare-button {
        width: 160px;
        height: 40px;
        font-size: 16px;
        border-radius: 4px;
      }
    }

    .tip-section {
      margin-top: 24px;
      padding: 12px 16px;
      background-color: #e6f7ff;
      border: 1px solid #91d5ff;
      border-radius: 4px;
      color: rgba(0, 0, 0, 0.65);
      font-size: 14px;
    }
  }

  .loading-container {
    padding: 60px;
    text-align: center;
  }

  .result-section {
    margin-bottom: 24px;

    .result-card {
      border-radius: 8px;
    }

    .challenge-result-header {
      display: flex;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      
      &.success {
        background-color: #f6ffed;
        border: 1px solid #b7eb8f;
        .result-badge { color: #52c41a; background: #fff; }
        .result-title { color: #1f1f1f; }
      }

      &.error {
        background-color: #fff1f0;
        border: 1px solid #ffa39e;
        .result-badge { color: #f5222d; background: #fff; }
        .result-title { color: #1f1f1f; }
      }

      .result-badge {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        margin-right: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }

      .result-content {
        flex: 1;
        
        .result-title {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .score-diff {
          font-size: 14px;
          color: rgba(0,0,0,0.65);
          
          .diff-value {
            font-weight: 600;
            margin-left: 4px;
            &.positive { color: #52c41a; }
            &.negative { color: #f5222d; }
          }
        }
      }
    }

    .analysis-row {
      .analysis-item {
        padding: 16px;
        background: #fafafa;
        border-radius: 4px;
        height: 100%;

        .analysis-label {
          display: block;
          margin-bottom: 12px;
          font-weight: 600;
          color: rgba(0,0,0,0.85);
        }

        .subject-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          
          .no-subject {
            color: rgba(0,0,0,0.45);
            font-style: italic;
          }
        }
      }
    }
  }

  .comparison-results {
    .table-card {
      margin-bottom: 24px;
      border-radius: 8px;
      
      :deep(.ant-card-head) {
        border-bottom: 1px solid #f0f0f0;
      }
    }

    .diff-text {
      font-weight: 600;
      
      &.positive { color: #52c41a; } // 绿色
      &.negative { color: #f5222d; } // 红色
      &.zero { color: rgba(0,0,0,0.45); }
    }
  }

  .empty-state {
    padding: 60px 0;
    text-align: center;
    background: #fff;
    border-radius: 8px;
  }

  @media (max-width: 768px) {
    padding: 16px;
    
    .filter-item {
      margin-bottom: 16px;
    }
    
    .challenge-result-header {
      flex-direction: column;
      text-align: center;
      
      .result-badge {
        margin-right: 0;
        margin-bottom: 12px;
      }
    }
    
    .analysis-row .analysis-item {
      margin-bottom: 16px;
    }
  }
}
</style>
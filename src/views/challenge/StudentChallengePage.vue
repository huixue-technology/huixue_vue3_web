<template>
  <div class="student-challenge-page">
    <!-- 头部区域 -->
    <div class="header">
      <h2>学生挑战</h2>
      <p>选择考试和对手，进行对比</p>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <a-row :gutter="[16, 16]">
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

      <!-- 对手 -->
      <a-row :gutter="[16, 16]" style="margin-top: 20px;">
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
            <a-select
              v-model:value="finalOpponentId"
              placeholder="选择或输入学生姓名/学号"
              style="width: 100%"
              :disabled="loading || !opponentStudents.length"
              show-search
              :filter-option="false"
              @search="handleOpponentSearch"
              @input="handleManualInput"
              @change="handleOpponentSelect"
            >
              <a-select-option
                v-for="student in filteredOpponentStudents"
                :key="student.id"
                :value="student.id"
              >
                {{ student.name }}
              </a-select-option>
            </a-select>
          </div>
        </a-col>
      </a-row>

      <!-- 开始对比按钮 -->
      <a-row justify="center" style="margin-top: 20px;">
        <a-col>
          <a-button 
            type="primary" 
            @click="runComparison"
            :disabled="isCompareBtnDisabled" 
            class="compare-button"
          >
            开始挑战
          </a-button>
        </a-col>
      </a-row>
    </div>

    <!-- 说明文本 -->
    <p class="description">
      说明：默认考试选择最近一次考试，您也可以选择其他考试，与对手进行学科维度比较。手动输入对手姓名时，请确保姓名准确。
    </p>

    <!-- 加载状态 -->
    <a-spin v-if="loading" tip="加载中..." class="loading-spin" />

    <!-- 挑战结果提示 -->
     <div class="analysis-card" style="margin-bottom: 24px;">
      <a-card 
        :title="showComparisonTables ? '挑战结果' : ''" 
        class="chart-card"
        :loading="loading"
      >
      <div v-if="!loading && showComparisonTables" class="challenge-result-card">
        <div class="result-header" :class="totalScoreDiff >= 0 ? 'success' : 'error'" style="justify-content: center;">
          <span class="result-icon" :class="totalScoreDiff >= 0 ? 'success-icon' : 'error-icon'">
            {{ totalScoreDiff >= 0 ? '✔' : '✖' }}
          </span>
          <span class="result-text">{{ userInfo?.student?.name || '本人' }} 挑战{{ totalScoreDiff >= 0 ? '成功' : '失败' }}</span>
        </div>
        <div class="subject-analysis" style="text-align: center;">
          <p>
            <span class="advantage-label">优势科目：</span>
            <span v-for="(sub, idx) in getAdvantageSubjects()" :key="idx" class="advantage-subject">{{ sub }}</span>
          </p>
          <p>
            <span class="disadvantage-label">劣势科目：</span>
            <span v-for="(sub, idx) in getDisadvantageSubjects()" :key="idx" class="disadvantage-subject">{{ sub }}</span>
          </p>
        </div>
      </div>
        </a-card>
     </div>

    <!-- 对比结果区域（分数+段次双表格） -->
    <div v-if="!loading && showComparisonTables" class="comparison-results">
      <!-- 分数对比表格 -->
      <div class="analysis-card" style="margin-bottom: 24px;">
        <a-card :title="`分数对比结果`" class="chart-card">
          <div class="table-container">
            <a-table
              :data-source="scoreComparisonData"
              bordered
              :columns="scoreColumns"
              :pagination="false"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'diff'">
                  <span :class="getScoreDiffClass(record.diff)">{{ Math.abs(record.diff) }}</span>
                </template>
              </template>
            </a-table>
          </div>
        </a-card>
      </div>

      <!-- 段次对比表格 -->
      <div class="analysis-card">
        <a-card :title="`段次对比结果`" class="chart-card">
          <div class="table-container">
            <a-table
              :data-source="rankComparisonData"
              bordered
              :columns="rankColumns"
              :pagination="false"
            >
            <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'classDiff'">
              <span :class="getRankDiffClass(record.classDiffRaw)">{{ record.classDiff }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'gradeDiff'">
              <span :class="getRankDiffClass(record.gradeDiffRaw)">{{ record.gradeDiff }}</span>
            </template>
          </template>
            </a-table>
          </div>
        </a-card>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-if="!loading && !showComparisonTables && hasSearched" class="no-data">
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
    console.log(examRes);
    if (examRes.code === 200 && examRes.data.length > 0) {
      console.log(examRes.data)
      examList.value = examRes.data.map((examId: number) => ({
        id: examId,
        name: `考试${examId}` // 或根据实际接口返回的名称赋值
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

  .filter-section {
    background: #ffffff;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    margin-bottom: 24px;
    margin-top: 2%;
    
    .filter-item {
      display: flex;
      align-items: center;
      width: 100%;
      
      .label {
        width: 80px;
        font-weight: 600;
        color: #333;
        text-align: right;
        margin-right: 10px;
        white-space: nowrap;
      }
      
      :deep(.ant-select),
      :deep(.ant-input) {
        flex: 1;
      }
    }

    .compare-button {
      height: 38px;
      padding: 0 32px;
    }
  }

  .description {
    margin: 0 0 20px 0;
    font-size: 0.9em;
    color: red;
    line-height: 1.5;
  }

  .loading-spin {
    display: block;
    margin: 80px auto;
  }

  .challenge-result-card {
  background: #f9f9f9;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .result-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    color: #333;
    font-size: 1.5rem;

    .result-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      margin-right: 8px;
      font-weight: bold;
    }

    .success {
      color: #52c41a;
      font-size: 1rem;
    }
    .success-icon {
      background: #52c41a;
      color: white;
    }

    .error {
      color: #f5222d; /* 失败文字红色 */
    }
    .error-icon {
      background: #f5222d;
      color: white;
    }
  }

  .subject-analysis {
    line-height: 1.8;

    .advantage-label {
      font-weight: 600;
      color: #52c41a;
    }
    .advantage-subject {
      color: #52c41a;
      margin-right: 8px;
    }

    .disadvantage-label {
      font-weight: 600;
      color: #f5222d;
    }
    .disadvantage-subject {
      color: #f5222d;
      margin-right: 8px;
    }
  }
}

  .comparison-results {
    width: 100%;
  }

  .analysis-card {
    margin-bottom: 24px;
    
    .chart-card {
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      font-size: 1.3rem;
      
      :deep(.ant-card-head) {
        background: linear-gradient(120deg, #f0f2f5, #e4e7ec);
        border-bottom: 1px solid #e8e8e8;
        padding: 0 16px;
        
        .ant-card-head-title {
          font-weight: 600;
          color: #333;
          font-size: 16px;
        }
      }
      
      :deep(.ant-card-body) {
        padding: 20px;
      }
    }
  }

  .table-container {
    overflow-x: auto;

  }

  :deep(.ant-table) {
    width: 100%;
    font-size: 16px; // 表格整体字体大小
    
    .ant-table-thead > tr > th {
      background-color: #f7f9fc;
      font-weight: 600;
      text-align: center;
      font-size: 16px; // 表头字体大小
    }
    
    .ant-table-tbody > tr > td {
      text-align: center;
      vertical-align: middle;
      font-size: 20px; // 表格内容字体大小
    }
  }

  .no-data {
    background: white;
    border-radius: 12px;
    padding: 80px 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    text-align: center;
    margin-bottom: 20px;
  }

  :deep(.ant-table-tbody .positive) {
  color: #52c41a !important; // 绿色：优于对手
  }

  :deep(.ant-table-tbody .negative) {
    color: #f5222d !important; // 红色：弱于对手
  }

  :deep(.ant-table-tbody .zero) {
    color: #535353 !important; // 黑色：持平
  }

  .positive {
    color: #52c41a; // 绿色表示优于对手
  }

  .negative {
    color: #f5222d; // 红色表示弱于对手
  }

  .zero {
    color: #535353; // 黑色表示持平
  }
  
  // 响应式设计
  @media (max-width: 768px) {
    padding: 12px;

    .filter-section {
      padding: 16px;
    }

    .filter-item {
      flex-direction: column;
      align-items: stretch;

      .label {
        width: 100%;
        text-align: left;
        margin-bottom: 8px;
      }
    }

    .compare-button {
      width: 100%;
      padding: 0;
    }

    .analysis-card :deep(.ant-card-body) {
      padding: 12px;
    }

    :deep(.ant-table) {
      font-size: 14px;
    }
  }
}
</style>
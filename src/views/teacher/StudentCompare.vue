<template>
  <div class="student-compare-container">
    <!-- 头部区域 -->
    <div class="header">
      <h2>学生对比</h2>
      <p>选择考试和学生进行对比分析</p>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <a-row :gutter="[16, 16]">
        <a-col :span="24" :md="8">
          <div class="filter-item">
            <span class="filter-label">考试：</span>
            <a-select
              v-model:value="selectedExamId"
              placeholder="选择考试"
              style="width: 100%"
              @change="handleExamChange"
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
        <a-col :span="24" :md="16">
          <div class="filter-actions">
            <a-button type="primary" @click="resetFilters">重置筛选</a-button>
          </div>
        </a-col>
      </a-row>
      
      <a-row :gutter="[16, 16]" style="margin-top: 20px;">
        <a-col :span="24">
          <div class="class-selector-container">
            <div class="class-selector-item">
              <span class="label">所属班级：</span>
              <a-select
                v-model:value="selectedClassId"
                placeholder="选择班级"
                style="flex: 1;"
                :disabled="loading"
                @change="fetchStudentListAndExams"
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
          </div>
        </a-col>
      </a-row>
      
      <a-row :gutter="[16, 16]" style="margin-top: 20px;">
        <a-col :span="24">
          <div class="student-selector-container">
            <!-- 学生1 -->
            <div class="student-selector-item">
              <span class="label">学生1：</span>
              <a-select
                v-model:value="selectedStudent1"
                placeholder="请输入学生姓名或学号搜索"
                style="flex: 1;"
                :disabled="loading || !selectedClassId"
                show-search
                :filter-option="false"
                @search="handleStudent1Search"
                @change="handleStudent1Change"
              >
                <a-select-option
                  v-for="student in filteredStudentList1"
                  :key="student.id"
                  :value="student.id"
                >
                  {{ student.name }} ({{ maskStudentId(student.uid) }})
                </a-select-option>
              </a-select>
            </div>

            <!-- VS 标识 -->
            <div class="versus">VS</div>

            <!-- 学生2 -->
            <div class="student-selector-item">
              <span class="label">学生2：</span>
              <a-select
                v-model:value="selectedStudent2"
                placeholder="请输入学生姓名或学号搜索"
                style="flex: 1;"
                :disabled="loading || !selectedClassId"
                show-search
                :filter-option="false"
                @search="handleStudent2Search"
                @change="handleStudent2Change"
              >
                <a-select-option
                  v-for="student in filteredStudentList2"
                  :key="student.id"
                  :value="student.id"
                >
                  {{ student.name }} ({{ maskStudentId(student.uid) }})
                </a-select-option>
              </a-select>
            </div>
            
            <!-- 开始对比按钮 -->
            <div class="compare-button-container">
              <a-button 
                type="primary" 
                @click="fetchComparisonData"
                :disabled="isCompareBtnDisabled" 
                class="compare-button"
              >
                开始对比
              </a-button>
            </div>
          </div>
        </a-col>
      </a-row>
      
      <!-- 显示方式选择 -->
      <div class="display-option">
        <span class="label">显示方式：</span>
        <a-radio-group v-model:value="displayMode">
          <a-radio value="table">表格</a-radio>
        </a-radio-group>
      </div>
    </div>

    <!-- 加载状态 -->
    <a-spin v-if="loading" tip="加载中..." class="loading-spin" />

    <!-- 对比结果区域 -->
    <div v-if="!loading && hasSearched" class="comparison-results">
      <!-- 总体情况卡片（总分+班级排名+年级排名） -->
      <div class="summary-cards">
        <a-row :gutter="16">
          <!-- 总分卡片 -->
          <a-col :span="24" :md="8">
            <div class="summary-card col-1-card">
              <h3>总分</h3>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent1) }}</span>
                <span class="score">{{ formatScore(comparisonData.total_score?.current || 0) }}</span>
              </div>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent2) }}</span>
                <span class="score">{{ formatScore(comparisonData.total_score?.compare || 0) }}</span>
              </div>
              <div class="difference" :class="getScoreDiffClass(totalScoreDiff)">
                差值: {{ formatScore(Math.abs(totalScoreDiff)) }}
              </div>
            </div>
          </a-col>
          <!-- 班级排名卡片 -->
          <a-col :span="24" :md="8">
            <div class="summary-card col-2-card">
              <h3>班级排名</h3>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent1) }}</span>
                <span class="rank">{{ comparisonData.class_rank?.current || 0 }}</span>
              </div>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent2) }}</span>
                <span class="rank">{{ comparisonData.class_rank?.compare || 0 }}</span>
              </div>
              <div class="difference" :class="getRankDiffClass(rankDiff)">
                差值: {{ Math.abs(rankDiff) }}
              </div>
            </div>
          </a-col>
          <!-- 年级排名卡片 -->
          <a-col :span="24" :md="8">
            <div class="summary-card col-3-card">
              <h3>年级排名</h3>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent1) }}</span>
                <span class="rank">{{ comparisonData.grade_rank?.current || 0 }}</span>
              </div>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent2) }}</span>
                <span class="rank">{{ comparisonData.grade_rank?.compare || 0 }}</span>
              </div>
              <div class="difference" :class="getRankDiffClass(gradeRankDiff)">
                差值: {{ Math.abs(gradeRankDiff) }}
              </div>
            </div>
          </a-col>
        </a-row>
      </div>

      <!-- 单科模块-->
      <div class="subject-modules" v-for="subject in subjectList" :key="subject.enKey">
        <a-row :gutter="16" style="margin-top: 16px;">
          <!-- 科目分数卡片-->
          <a-col :span="24" :md="8">
            <div class="summary-card col-1-card">
              <h3>{{ subject.name }}</h3>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent1) }}</span>
                <span class="score">{{ formatScore(subject.s1Score) }}</span>
              </div>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent2) }}</span>
                <span class="score">{{ formatScore(subject.s2Score) }}</span>
              </div>
              <div class="difference" :class="getScoreDiffClass(subject.scoreDiff)">
                分数差值: {{ formatScore(Math.abs(subject.scoreDiff)) }}
              </div>
            </div>
          </a-col>
          <!-- 科目班级排名卡片 -->
          <a-col :span="24" :md="8">
            <div class="summary-card col-2-card">
              <h3>{{ subject.name }}班级排名</h3>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent1) }}</span>
                <span class="rank">{{ subject.s1ClassRank }}</span>
              </div>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent2) }}</span>
                <span class="rank">{{ subject.s2ClassRank }}</span>
              </div>
              <div class="difference" :class="getRankDiffClass(subject.classRankDiff)">
                班排差值: {{ typeof subject.classRankDiff === 'number' ? Math.abs(subject.classRankDiff) : subject.classRankDiff }}
              </div>
            </div>
          </a-col>
          <!-- 科目年级排名卡片 -->
          <a-col :span="24" :md="8">
            <div class="summary-card col-3-card">
              <h3>{{ subject.name }}年级排名</h3>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent1) }}</span>
                <span class="rank">{{ subject.s1GradeRank }}</span>
              </div>
              <div class="summary-item">
                <span class="student-name">{{ getStudentName(selectedStudent2) }}</span>
                <span class="rank">{{ subject.s2GradeRank }}</span>
              </div>
              <div class="difference" :class="getRankDiffClass(subject.gradeRankDiff)">
                年排差值: {{ typeof subject.gradeRankDiff === 'number' ? Math.abs(subject.gradeRankDiff) : subject.gradeRankDiff }}
              </div>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-if="!loading && hasSearched && !comparisonData.valid" class="no-data">
      <a-empty description="未找到对比数据，请选择其他学生或考试" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { getClassesApi } from '@/servers/api/classes';
import { getClassExam } from '@/servers/api/grade';
import { getCompareWithStudent } from '@/servers/api/analysis';
import { getStudentApi } from '@/servers/api/student';
import { useUserStore } from '@/store';

// 类型定义 
interface ClassInfo {
  id: number;
  name: string;
  header: number;
  school_id: number;
  subject_selection: string;
}

interface ExamInfo {
  id: number;
  name: string;
}

interface StudentInfo {
  id: string;
  name: string;
  class_id: number;
  uid: string;
}

interface SubjectScores {
  yuwen: number;
  shuxue: number;
  yingyu: number;
  wuli: number;
  huaxue: number;
  lishi: number;
  zhengzhi: number;
  shengwu: number;
  dili: number;
}

interface StudentResult {
  id: number;
  student_id: string;
  school_id: string;
  exam_id: number;
  class_id: string;
  sum_: number;
  sumb: number; // 班级总分排名
  sumd: number; // 年级总分排名
  yuwen?: number;
  yuwenb?: number; // 语文班级排名
  yuwend?: number; // 语文年级排名
  shuxue?: number;
  shuxueb?: number;
  shuxued?: number;
  yingyu?: number;
  yingyub?: number;
  yingyud?: number;
  wuli?: number;
  wulib?: number;
  wulid?: number;
  huaxue?: number;
  huaxueb?: number;
  huaxued?: number;
  lishi?: number;
  lishib?: number;
  lishid?: number;
  zhengzhi?: number;
  zhengzhib?: number;
  zhengzhid?: number;
  shengwu?: number;
  shengwub?: number;
  shengwud?: number;
  dili?: number;
  dilib?: number;
  dilid?: number;
}

interface ComparisonResult {
  valid: boolean;
  current_student?: StudentResult;
  compare_student?: StudentResult;
  total_score?: {
    current: number;
    compare: number;
  };
  class_rank?: {
    current: number;
    compare: number;
  };
  grade_rank?: {
    current: number;
    compare: number;
  };
  subject_score?: {
    current: SubjectScores;
    compare: SubjectScores;
  };
}

// 科目信息类型（含分数、排名）
interface SubjectInfo {
  name: string;
  enKey: string;
  s1Score: number;
  s2Score: number;
  scoreDiff: number;
  s1ClassRank: string | number;
  s2ClassRank: string | number;
  classRankDiff: number | string;
  s1GradeRank: string | number;
  s2GradeRank: string | number;
  gradeRankDiff: number | string;
}

// 状态管理
const userStore = useUserStore();
const loading = ref(false);
const hasSearched = ref(false);
const classList = ref<ClassInfo[]>([]);
const examList = ref<ExamInfo[]>([]);
const studentList = ref<StudentInfo[]>([]); 
const filteredStudentList1 = ref<StudentInfo[]>([]); 
const filteredStudentList2 = ref<StudentInfo[]>([]); 
const selectedClassId = ref<number>();
const selectedStudent1 = ref<string>(); 
const selectedStudent2 = ref<string>(); 
const selectedExamId = ref<number>(0);
const displayMode = ref<'table' | 'chart'>('table');
const comparisonData = ref<ComparisonResult>({ valid: false });
const searchKeyword1 = ref(''); 
const searchKeyword2 = ref(''); 

// 科目名称映射
const subjectMap = {
  'yuwen': '语文',
  'shuxue': '数学',
  'yingyu': '英语',
  'wuli': '物理',
  'huaxue': '化学',
  'shengwu': '生物',
  'lishi': '历史',
  'zhengzhi': '政治',
  'dili': '地理'
};

// 计算总分/总排名差值
const totalScoreDiff = computed(() => {
  const total = comparisonData.value.total_score;
  return (total?.current || 0) - (total?.compare || 0);
});
const rankDiff = computed(() => {
  const rank = comparisonData.value.class_rank;
  return (rank?.current || 0) - (rank?.compare || 0);
});
const gradeRankDiff = computed(() => {
  const rank = comparisonData.value.grade_rank;
  return (rank?.current || 0) - (rank?.compare || 0);
});

// 格式化单科数据（拆分为“分数+班级排名+年级排名”）
const subjectList = computed<SubjectInfo[]>(() => {
  const subjectScore = comparisonData.value.subject_score;
  if (!subjectScore || !comparisonData.value.current_student || !comparisonData.value.compare_student) {
    return [];
  }
  const current = comparisonData.value.current_student;
  const compare = comparisonData.value.compare_student;

  return Object.entries(subjectMap).map(([enKey, name]) => {
    // 分数数据
    const s1Score = subjectScore.current[enKey as keyof SubjectScores] || 0;
    const s2Score = subjectScore.compare[enKey as keyof SubjectScores] || 0;
    const scoreDiff = s1Score - s2Score;

    // 班级排名数据
    const s1ClassRankKey = `${enKey}b` as keyof StudentResult;
    const s2ClassRankKey = `${enKey}b` as keyof StudentResult;
    const s1ClassRank = current[s1ClassRankKey] || '-';
    const s2ClassRank = compare[s2ClassRankKey] || '-';
    const classRankDiff = (typeof s1ClassRank === 'number' && typeof s2ClassRank === 'number') 
      ? s1ClassRank - s2ClassRank 
      : '-';

    // 年级排名数据
    const s1GradeRankKey = `${enKey}d` as keyof StudentResult;
    const s2GradeRankKey = `${enKey}d` as keyof StudentResult;
    const s1GradeRank = current[s1GradeRankKey] || '-';
    const s2GradeRank = compare[s2GradeRankKey] || '-';
    const gradeRankDiff = (typeof s1GradeRank === 'number' && typeof s2GradeRank === 'number') 
      ? s1GradeRank - s2GradeRank 
      : '-';

    return {
      name,
      enKey,
      s1Score,
      s2Score,
      scoreDiff,
      s1ClassRank,
      s2ClassRank,
      classRankDiff,
      s1GradeRank,
      s2GradeRank,
      gradeRankDiff
    };
  }).filter(item => item.s1Score > 0 || item.s2Score > 0);
});

// 工具函数 
const getStudentName = (studentId: string | undefined) => {
  if (!studentId) return '';
  const student = studentList.value.find(s => s.id === studentId);
  return student ? student.name : '未知学生';
};

// 分数差值样式（正数：学生1更高/绿色；负数：学生2更高/红色；零：默认）
const getScoreDiffClass = (diff: number) => {
  if (diff > 0) return 'positive'; // 学生1更高→ 绿色
  if (diff < 0) return 'negative'; // 学生1更低→ 红色
  return 'zero';
};

// 排名差值样式（排名越小越优：负数→学生1更优/绿色；正数→学生2更优/红色；零→默认）
const getRankDiffClass = (diff: number | string) => {
  if (typeof diff === 'string') return 'zero';
  if (diff > 0) return 'negative'; // 学生1排名更差 → 红色
  if (diff < 0) return 'positive'; // 学生1排名更优 → 绿色
  return 'zero';
};

// 格式化分数
const formatScore = (score: number) => {
  return score.toFixed(2);
};

// 接口请求
const handleExamChange = (examId: number) => {
  selectedExamId.value = examId;
};

const fetchStudentListAndExams = async () => {
  if (!selectedClassId.value) return;
  try {
    loading.value = true;
    const [studentRes, examRes] = await Promise.all([
      getStudentApi({ class_id: selectedClassId.value }),
      getClassExam({ class_id: selectedClassId.value })
    ]);
    if (studentRes.code === 200 && studentRes.data) {
      studentList.value = studentRes.data.map((item: any) => ({
        id: item.uid,        
        name: item.name,
        class_id: item.class_id,
        uid: item.uid        
      }));
      filteredStudentList1.value = [...studentList.value];
      filteredStudentList2.value = [...studentList.value];
      selectedStudent1.value = undefined;
      selectedStudent2.value = undefined;
    } else {
      message.warning(studentRes.msg || '获取学生列表失败');
    }
    if (examRes.code === 200 && examRes.data.length > 0) {
      examList.value = examRes.data.map((examId: number) => ({
        id: examId,
        name: `考试${examId}`
      }));
      // 默认选择最新的考试（最后一个）
      selectedExamId.value = examList.value[examList.value.length - 1].id;
    } else {
      message.warning(examRes.msg || '获取考试列表失败');
    }
  } catch (err) {
    message.error('获取学生或考试列表失败');
  } finally {
    loading.value = false;
  }
};

const handleStudent1Search = (value: string) => {
  searchKeyword1.value = value;
  filteredStudentList1.value = !value 
    ? [...studentList.value]
    : studentList.value.filter(student => 
        student.name.toLowerCase().includes(value.toLowerCase()) ||
        student.uid.includes(value)
      );
};

const handleStudent2Search = (value: string) => {
  searchKeyword2.value = value;
  filteredStudentList2.value = !value 
    ? [...studentList.value]
    : studentList.value.filter(student => 
        student.name.toLowerCase().includes(value.toLowerCase()) ||
        student.uid.includes(value)
      );
};

const handleStudent1Change = (studentId: string) => {
  selectedStudent1.value = studentId;
};

const handleStudent2Change = (studentId: string) => {
  selectedStudent2.value = studentId;
};

const fetchComparisonData = async () => {
  if (selectedStudent1.value === selectedStudent2.value) {
    message.warning('请选择不同的学生进行对比');
    return;
  }
  if (!selectedStudent1.value || !selectedStudent2.value || !selectedExamId.value) {
    message.warning('请选择完整的对比条件');
    return;
  }
  try {
    loading.value = true;
    hasSearched.value = true;
    const res = await getCompareWithStudent({
      student_id: selectedStudent1.value,  
      compare_student_id: selectedStudent2.value,  
      selected_exam_id: selectedExamId.value.toString()
    });
    if (res.code === 200 && res.data) {
      const { current_student, compare_student } = res.data;
      comparisonData.value = {
        valid: true,
        current_student,
        compare_student,
        total_score: {
          current: current_student.sum_ || 0,
          compare: compare_student.sum_ || 0
        },
        class_rank: {
          current: current_student.sumb || 0,
          compare: compare_student.sumb || 0
        },
        grade_rank: {
          current: current_student.sumd || 0,
          compare: compare_student.sumd || 0
        },
        subject_score: {
          current: {
            yuwen: current_student.yuwen || 0,
            shuxue: current_student.shuxue || 0,
            yingyu: current_student.yingyu || 0,
            wuli: current_student.wuli || 0,
            huaxue: current_student.huaxue || 0,
            shengwu: current_student.shengwu || 0,
            lishi: current_student.lishi || 0,
            zhengzhi: current_student.zhengzhi || 0,
            dili: current_student.dili || 0,
          },
          compare: {
            yuwen: compare_student.yuwen || 0,
            shuxue: compare_student.shuxue || 0,
            yingyu: compare_student.yingyu || 0,
            wuli: compare_student.wuli || 0,
            huaxue: compare_student.huaxue || 0,
            shengwu: compare_student.shengwu || 0,
            lishi: compare_student.lishi || 0,
            zhengzhi: compare_student.zhengzhi || 0,
            dili: compare_student.dili || 0,
          }
        }
      };
    } else {
      message.error(res?.msg || '获取对比数据失败');
      comparisonData.value = { valid: false };
    }
  } catch (err) {
    message.error('获取对比数据失败');
    comparisonData.value = { valid: false };
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  if (examList.value.length > 0) {
    selectedExamId.value = examList.value[examList.value.length - 1].id;
  }
  if (classList.value.length > 0) {
    selectedClassId.value = classList.value[0].id;
    fetchStudentListAndExams();
  }
  selectedStudent1.value = undefined;
  selectedStudent2.value = undefined;
  comparisonData.value = { valid: false };
  hasSearched.value = false;
};

const isCompareBtnDisabled = computed(() => {
  return (
    loading.value || 
    !selectedClassId.value || 
    !selectedStudent1.value || 
    !selectedStudent2.value || 
    !selectedExamId.value || 
    selectedStudent1.value === selectedStudent2.value
  );
});

const init = async () => {
  try {
    const userInfo = userStore.getUserInfo();
    const teacherId = userInfo?.teacher?.uid;
    if (!teacherId) {
      message.error('未获取到教师信息');
      return;
    }
    loading.value = true;
    const classRes = await getClassesApi({ header: teacherId });
    if (classRes.code === 200 && classRes.data.length > 0) {
      classList.value = classRes.data;
      selectedClassId.value = classList.value[0].id;
      await fetchStudentListAndExams();
    } else {
      message.warning(classRes.msg || '未找到您管理的班级');
    }
  } catch (err) {
    message.error('初始化失败');
  } finally {
    loading.value = false;
  }
};

onMounted(init);

// 学号脱敏处理，只显示后四位
const maskStudentId = (uid: string) => {
  if (!uid) return '';
  const idStr = String(uid);
  if (idStr.length <= 4) return idStr;
  return '**' + idStr.slice(-4);
};
</script>

<style scoped lang="less">
/* 根容器样式 */
.student-compare-container {
  padding: 20px;
  position: relative;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);

  /* 头部样式 */
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

  /* 筛选区域样式 */
  .filter-section {
    background: #ffffff;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    margin-bottom: 24px;
    
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

    .class-selector-container,
    .student-selector-container {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      gap: 16px;
      justify-content: center;
      
      .class-selector-item,
      .student-selector-item {
        flex: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        min-width: 200px;
        
        .label {
          font-weight: 500;
          color: #535353;
          margin-right: 8px;
          font-size: 14px;
          white-space: nowrap;
        }
        
        :deep(.ant-select) {
          flex: 1;
        }
      }
      
      .versus {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 20px;
        color: #1890ff;
        min-width: 40px;
        padding: 0 10px;
      }
      
      .compare-button-container {
        .compare-button {
          height: 38px;
        }
      }
    }

    .display-option {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      
      .label {
        font-weight: 500;
        color: #535353;
        margin-right: 12px;
        font-size: 14px;
      }
    }
  }

  /* 加载状态 */
  .loading-spin {
    display: block;
    margin: 50px auto;
  }

  /* 卡片通用样式 */
  .summary-cards,
  .subject-modules {
    .summary-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      height: 100%;

      &:hover {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      h3 {
        margin-top: 0;
        margin-bottom: 20px;
        color: #1f1f1f;
        font-size: 18px;
        font-weight: 600;
        border-bottom: 1px solid #f0f0f0;
        padding-bottom: 12px;
        text-align: center;
      }

      .summary-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        padding: 8px 0;

        .student-name {
          color: #535353;
          font-weight: 500;
        }

        .score, .rank, .count {
          font-weight: 700;
          font-size: 16px;
        }
      }

      .difference {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #f0f0f0;
        text-align: right;
        font-weight: 700;
        font-size: 16px;
      }
    }
    
    /* 列级统一颜色 */
    .col-1-card {
      border-top: 4px solid #1890ff;
    }
    .col-2-card {
      border-top: 4px solid #52c41a;
    }
    .col-3-card {
      border-top: 4px solid #fa8c16;
    }
  }

  /* 无数据状态 */
  .no-data {
    background: white;
    border-radius: 12px;
    padding: 60px 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    text-align: center;
    margin-bottom: 20px;
  }

  /* 差值颜色 */
  .positive {
    color: #52c41a; // 更好（绿色）
  }

  .negative {
    color: #f5222d; // 更差（红色）
  }

  .zero {
    color: #535353;
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .student-compare-container {
    padding: 12px;
    
    .filter-section {
      padding: 16px;
    }
    
    .class-selector-container,
    .student-selector-container {
      flex-direction: column;
      align-items: stretch;
      
      .versus {
        align-self: center;
        padding: 12px 0;
      }
      
      .compare-button-container {
        align-self: stretch;
        margin-top: 12px;
        
        .compare-button {
          width: 100%;
        }
      }
    }
    
    .summary-cards,
    .subject-modules {
      .summary-card {
        padding: 16px;
        
        h3 {
          font-size: 16px;
        }
        
        .summary-item {
          .score, .rank, .count {
            font-size: 14px;
          }
        }
        
        .difference {
          font-size: 14px;
        }
      }
    }
  }
}
</style>
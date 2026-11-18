<template>
  <div class="grade-simulate-container">
    <div class="header">
      <h2>成绩模拟查询</h2>
      <p>根据学号查询成绩，模拟修改后查看班级和年级排名</p>
    </div>

    <!-- 查询区域 -->
    <div class="search-section">
      <a-card title="查询成绩" class="search-card">
        <a-row :gutter="16">
          <!-- 老师端：班级选择 -->
          <a-col :xs="24" :sm="12" :md="6" v-if="isTeacher">
            <div class="search-item">
              <span class="search-label">班级：</span>
              <a-select
                v-model:value="selectedClassId"
                placeholder="请选择班级"
                style="width: 100%"
                :options="classOptions"
                show-search
                :filter-option="filterOption"
                @change="handleClassChange"
                :loading="loadingClasses"
              />
            </div>
          </a-col>
          <!-- 老师端：学生选择 -->
          <a-col :xs="24" :sm="12" :md="6" v-if="isTeacher">
            <div class="search-item">
              <span class="search-label">学生：</span>
              <a-select
                v-model:value="studentId"
                placeholder="请选择学生"
                style="width: 100%"
                :options="studentOptions"
                show-search
                :filter-option="filterOption"
                @change="handleStudentChange"
                :loading="loadingStudents"
                :disabled="!selectedClassId"
              />
            </div>
          </a-col>
          <!-- 学生端：学号输入 -->
          <!-- <a-col :xs="24" :sm="12" :md="6" v-else>
            <div class="search-item">
              <span class="search-label">学号：</span>
              <a-input
                v-model:value="studentId"
                placeholder="请输入学生学号"
                style="width: 100%"
                @pressEnter="handleSearch"
                disabled
              />
            </div>
          </a-col> -->
          <!-- 考试选择 -->
          <a-col :xs="24" :sm="12" :md="6">
            <div class="search-item">
              <span class="search-label">考试：</span>
              <a-select
                v-model:value="selectedExamId"
                placeholder="请选择考试"
                style="width: 100%"
                :options="examOptions"
                :disabled="!studentId"
              />
            </div>
          </a-col>
          <!-- 操作按钮 -->
          <a-col :xs="24" :sm="12" :md="6">
            <div class="search-actions">
              <a-space>
                <a-button type="primary" @click="handleSearch" :loading="loading">
                  查询成绩
                </a-button>
                <a-button @click="handleReset">重置</a-button>
              </a-space>
            </div>
          </a-col>
        </a-row>
      </a-card>
    </div>

    <!-- 成绩展示和编辑区域 -->
    <div class="content-section" v-if="showResults">
      <a-row :gutter="16">
        <!-- 原始成绩表格 -->
        <a-col :span="24" :lg="12">
          <a-card title="原始成绩" class="score-card original-card">
            <template #extra>
              <a-tag color="blue">当前成绩</a-tag>
            </template>
            <a-table
              :columns="scoreColumns"
              :data-source="originalScores"
              :pagination="false"
              bordered
              size="middle"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'score'">
                  <span :class="getScoreClass(record.score, record.subject)">
                    {{ record.score }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'classRank'">
                  <span :class="getRankClass(record.classRank)">
                    {{ record.classRank }}
                  </span>
                </template>
                <template v-if="column.dataIndex === 'gradeRank'">
                  <span :class="getRankClass(record.gradeRank)">
                    {{ record.gradeRank }}
                  </span>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>

        <!-- 模拟成绩表格 -->
        <a-col :span="24" :lg="12">
          <a-card title="模拟成绩" class="score-card simulate-card">
            <template #extra>
              <a-space>
                <a-tag color="orange">可编辑</a-tag>
                <a-button type="primary" size="small" @click="handleSimulate" :loading="simulating">
                  模拟查询
                </a-button>
                <a-button size="small" @click="handleResetScores" danger>
                  复位
                </a-button>
              </a-space>
            </template>
            <div class="edit-hint">
              <InfoCircleOutlined />
              <span>点击成绩单元格可进行编辑，修改后点击"模拟查询"查看新排名</span>
            </div>
            <a-table
              :columns="editScoreColumns"
              :data-source="simulatedScores"
              :pagination="false"
              bordered
              size="middle"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.dataIndex === 'score'">
                  <div class="editable-cell">
                      <a-input-number
                        v-if="record.subject !== '总分'"
                        v-model:value="record.score"
                        :min="0"
                        :max="getMaxScore(record.subject)"
                        :precision="1"
                        @change="handleScoreChange(record)"
                      />
                      <span v-else :class="getScoreClass(record.score, record.subject)">
                        {{ record.score }}
                        <span v-if="record.scoreDiff !== undefined && record.scoreDiff !== 0" :class="getScoreDiffClass(record.scoreDiff)" class="score-change-icon">
                          <ArrowUpOutlined v-if="record.scoreDiff > 0" />
                          <ArrowDownOutlined v-else />
                          {{ Math.abs(record.scoreDiff) }}
                        </span>
                      </span>
                      <span
                        v-if="record.subject !== '总分' && record.scoreDiff !== undefined && record.scoreDiff !== 0"
                        :class="getScoreDiffClass(record.scoreDiff)"
                        class="score-change-icon"
                      >
                        <ArrowUpOutlined v-if="record.scoreDiff > 0" />
                        <ArrowDownOutlined v-else />
                        {{ Math.abs(record.scoreDiff) }}
                      </span>
                  </div>
                </template>
                <template v-if="column.dataIndex === 'classRank'">
                  <span :class="getRankClass(record.classRank)">
                    {{ record.classRank }}
                    <span v-if="record.classRankDiff !== undefined && record.classRankDiff !== 0" :class="getRankDiffClass(record.classRankDiff)" class="rank-change-icon">
                      <ArrowUpOutlined v-if="record.classRankDiff < 0" />
                      <ArrowDownOutlined v-else />
                      {{ Math.abs(record.classRankDiff) }}
                    </span>
                  </span>
                </template>
                <template v-if="column.dataIndex === 'gradeRank'">
                  <span :class="getRankClass(record.gradeRank)">
                    {{ record.gradeRank }}
                    <span v-if="record.gradeRankDiff !== undefined && record.gradeRankDiff !== 0" :class="getRankDiffClass(record.gradeRankDiff)" class="rank-change-icon">
                      <ArrowUpOutlined v-if="record.gradeRankDiff < 0" />
                      <ArrowDownOutlined v-else />
                      {{ Math.abs(record.gradeRankDiff) }}
                    </span>
                  </span>
                </template>
              </template>
            </a-table>
          </a-card>
        </a-col>
      </a-row>

      <!-- 排名对比分析 -->
      <a-row :gutter="16" style="margin-top: 20px;" v-if="hasSimulated">
        <a-col :span="24">
          <a-card title="排名变化分析" class="analysis-card">
            <div class="analysis-content">
              <a-row :gutter="16">
                <a-col :span="24" :md="8">
                  <div class="rank-change-card class-rank">
                    <div class="rank-title">
                      <TeamOutlined style="font-size: 20px; margin-right: 8px;" />
                      班级排名变化
                    </div>
                    <div class="rank-value">
                      <span class="original">{{ originalTotalRank.classRank }}</span>
                      <ArrowRightOutlined style="margin: 0 16px;" />
                      <span class="simulated" :class="getRankChangeClass(simulatedTotalRank.classRank - originalTotalRank.classRank)">
                        {{ simulatedTotalRank.classRank }}
                      </span>
                    </div>
                    <div class="rank-diff">
                      <span :class="getRankDiffClass(simulatedTotalRank.classRank - originalTotalRank.classRank)">
                        {{ getRankDiffText(simulatedTotalRank.classRank - originalTotalRank.classRank) }}
                      </span>
                    </div>
                  </div>
                </a-col>
                <a-col :span="24" :md="8">
                  <div class="rank-change-card grade-rank">
                    <div class="rank-title">
                      <GlobalOutlined style="font-size: 20px; margin-right: 8px;" />
                      年级排名变化
                    </div>
                    <div class="rank-value">
                      <span class="original">{{ originalTotalRank.gradeRank }}</span>
                      <ArrowRightOutlined style="margin: 0 16px;" />
                      <span class="simulated" :class="getRankChangeClass(simulatedTotalRank.gradeRank - originalTotalRank.gradeRank)">
                        {{ simulatedTotalRank.gradeRank }}
                      </span>
                    </div>
                    <div class="rank-diff">
                      <span :class="getRankDiffClass(simulatedTotalRank.gradeRank - originalTotalRank.gradeRank)">
                        {{ getRankDiffText(simulatedTotalRank.gradeRank - originalTotalRank.gradeRank) }}
                      </span>
                    </div>
                  </div>
                </a-col>
                <a-col :span="24" :md="8">
                  <div class="rank-change-card total-score">
                    <div class="rank-title">
                      <TrophyOutlined style="font-size: 20px; margin-right: 8px;" />
                      总分变化
                    </div>
                    <div class="rank-value">
                      <span class="original">{{ originalTotalScore }}</span>
                      <ArrowRightOutlined style="margin: 0 16px;" />
                      <span class="simulated" :class="getScoreDiffClass(simulatedTotalScore - originalTotalScore)">
                        {{ simulatedTotalScore }}
                      </span>
                    </div>
                    <div class="rank-diff">
                      <span :class="getScoreDiffClass(simulatedTotalScore - originalTotalScore)">
                        {{ getScoreDiffText(simulatedTotalScore - originalTotalScore) }}
                      </span>
                    </div>
                  </div>
                </a-col>
              </a-row>
            </div>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 空状态提示 -->
    <div class="empty-state" v-else>
      <a-empty description="请输入学号并选择考试查询成绩">
        <template #image>
          <SearchOutlined style="font-size: 48px; color: #1890ff;" />
        </template>
      </a-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { 
  SearchOutlined, 
  InfoCircleOutlined,
  TeamOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons-vue';
import { TrophyOutlined } from '@ant-design/icons-vue';
import { postSimulateGrade } from '@/servers/api/analysis';
import { getGradeApi } from '@/servers/api/grade';
import { getStudentExamApi, getStudentApi } from '@/servers/api/student';
import { getClassesApi } from '@/servers/api/classes';
import { loadTeacherClasses, preferredTeacherClass, rememberTeacherClass } from '@/utils/teacherClasses';
import { getTotalScore, getTotalClassRank, getTotalSchoolRank, getSubjectScore, getSubjectClassRank, getSubjectSchoolRank } from '@/utils/subjects';
import { useUserStore } from '@/store/modules/user';
import type { ColumnType } from 'ant-design-vue/es/table';

// 类型定义
interface ScoreRecord {
  key: string;
  subject: string;
  subjectKey: string;
  score: number;
  classRank: number;
  gradeRank: number;
  classRankDiff?: number;
  gradeRankDiff?: number;
  scoreDiff?: number;
}

interface ExamOption {
  label: string;
  value: number;
}

interface ClassOption {
  label: string;
  value: number;
}

interface StudentOption {
  label: string;
  value: string;
}

// 状态管理
const userStore = useUserStore();
const loading = ref(false);
const simulating = ref(false);
const showResults = ref(false);
const hasSimulated = ref(false);
const currentClassId = ref('');
const loadingClasses = ref(false);
const loadingStudents = ref(false);

// 角色判断
const isTeacher = ref(false);

// 表单数据
const studentId = ref<string>('');
const selectedExamId = ref<number>();
const selectedClassId = ref<number>();
const examOptions = ref<ExamOption[]>([]);
const classOptions = ref<ClassOption[]>([]);
const studentOptions = ref<StudentOption[]>([]);

// 成绩数据
const originalScores = ref<ScoreRecord[]>([]);
const simulatedScores = ref<ScoreRecord[]>([]);

// 学生信息
const studentInfo = ref<any>(null);
const schoolId = ref<string>('');
const subjectSelection = ref<string>(''); // 学生或班级的选科信息

// 科目映射（中文科目名）
const subjectMap: Record<string, { name: string; max: number }> = {
  '语文': { name: '语文', max: 150 },
  '数学': { name: '数学', max: 150 },
  '英语': { name: '英语', max: 150 },
  '日语': { name: '日语', max: 150 },
  '物理': { name: '物理', max: 100 },
  '化学': { name: '化学', max: 100 },
  '生物': { name: '生物', max: 100 },
  '历史': { name: '历史', max: 100 },
  '政治': { name: '政治', max: 100 },
  '地理': { name: '地理', max: 100 },
  '总分': { name: '总分', max: 750 }
};

// 表格列定义
const scoreColumns: ColumnType[] = [
  {
    title: '科目',
    dataIndex: 'subject',
    key: 'subject',
    align: 'center',
    width: 100
  },
  {
    title: '成绩',
    dataIndex: 'score',
    key: 'score',
    align: 'center',
    width: 80
  },
  {
    title: '班级排名',
    dataIndex: 'classRank',
    key: 'classRank',
    align: 'center',
    width: 100
  },
  {
    title: '年级排名',
    dataIndex: 'gradeRank',
    key: 'gradeRank',
    align: 'center',
    width: 100
  }
];

const editScoreColumns: ColumnType[] = [
  {
    title: '科目',
    dataIndex: 'subject',
    key: 'subject',
    align: 'center',
    width: 100
  },
  {
    title: '成绩（可编辑）',
    dataIndex: 'score',
    key: 'score',
    align: 'center',
    width: 120
  },
  {
    title: '班级排名',
    dataIndex: 'classRank',
    key: 'classRank',
    align: 'center',
    width: 120
  },
  {
    title: '年级排名',
    dataIndex: 'gradeRank',
    key: 'gradeRank',
    align: 'center',
    width: 120
  }
];

// 计算总分排名
const originalTotalRank = computed(() => {
  const totalRecord = originalScores.value.find(r => r.subject === '总分');
  return totalRecord ? {
    classRank: totalRecord.classRank,
    gradeRank: totalRecord.gradeRank
  } : { classRank: 0, gradeRank: 0 };
});

const simulatedTotalRank = computed(() => {
  const totalRecord = simulatedScores.value.find(r => r.subject === '总分');
  return totalRecord ? {
    classRank: totalRecord.classRank,
    gradeRank: totalRecord.gradeRank
  } : { classRank: 0, gradeRank: 0 };
});

const originalTotalScore = computed(() => {
  const totalRecord = originalScores.value.find(r => r.subject === '总分');
  return totalRecord ? totalRecord.score : 0;
});

const simulatedTotalScore = computed(() => {
  const totalRecord = simulatedScores.value.find(r => r.subject === '总分');
  return totalRecord ? totalRecord.score : 0;
});

// 初始化
onMounted(async () => {
  const userInfo = userStore.getUserInfo();
  console.log('用户信息:', userInfo);
  
  // 判断是否是老师
  isTeacher.value = !!userInfo?.teacher;
  
  if (isTeacher.value && userInfo?.teacher) {
    // 老师端：获取学校信息和班级列表
    schoolId.value = userInfo.teacher.school_id || userInfo.teacher.school || '';
    console.log('老师学校ID:', schoolId.value);
    console.log('老师工号(role):', userInfo.role);
    await fetchClassList();
  } else if (userInfo?.student) {
    // 学生端：自动填充学生信息
    studentId.value = userInfo.student.uid;
    schoolId.value = userInfo.student.school;
    studentInfo.value = userInfo.student;
    // 获取学生的选科信息
    subjectSelection.value = userInfo.student.subject_selection || '';
    console.log('学生选科信息:', subjectSelection.value);
    // 获取该学生参加过的考试列表
    await fetchExamList();
  }
  handleSearch();
});

// 获取班级列表(老师端)
const fetchClassList = async () => {
  console.log('开始获取班级列表, schoolId:', schoolId.value);
  
  if (!schoolId.value) {
    console.error('学校ID为空，无法获取班级列表');
    message.error('学校ID为空，无法获取班级列表');
    return;
  }
  
  loadingClasses.value = true;
  try {
    const userInfo = userStore.getUserInfo();
    const classes = await loadTeacherClasses<{ id: number; name: string }>(userInfo);
    classOptions.value = classes.map(({ id, name }) => ({ label: name || `班级${id}`, value: id }));
    const selected = preferredTeacherClass(userInfo, classes);
    if (selected) {
      selectedClassId.value = selected.id;
      await handleClassChange(selected.id);
    } else {
      message.warning('暂无已绑定的班级，请联系管理员');
    }
  } catch (err) {
    message.error('获取班级列表失败');
    console.error('获取班级列表异常:', err);
  } finally {
    loadingClasses.value = false;
  }
};

// 获取学生列表（老师端，根据班级）
const fetchStudentList = async (classId: number) => {
  if (!classId) {
    return;
  }
  
  loadingStudents.value = true;
  try {
    const res = await getStudentApi({ 
      class_id: classId,
      size: 1000 // 获取该班级所有学生
    });
    
    if (res.code === 200 && res.data) {
      studentOptions.value = res.data.map((item: any) => {
        const uidStr = String(item.uid || '');
        const shortUid = uidStr.length > 4 ? "**"+uidStr.slice(-4) : uidStr;
        return {
          label: `${item.name} (${shortUid})`,
          value: item.uid
        };
      });
    }
  } catch (err) {
    message.error('获取学生列表失败');
    console.error(err);
  } finally {
    loadingStudents.value = false;
  }
};

// 获取学生参加过的考试列表
const fetchExamList = async () => {
  if (!studentId.value) {
    return;
  }
  
  try {
    const res = await getStudentExamApi({ student_uid: studentId.value });
    if (res.code === 200 && res.data) {
      examOptions.value = [];
      // API返回的数据格式是嵌套数组，每个考试是 [{ id, name }] 格式
      res.data.forEach((item: any) => {
        if (Array.isArray(item) && item[0] && item[0].id && item[0].name) {
          examOptions.value.push({
            label: item[0].name,
            value: item[0].id
          });
        } else if (item.id && item.name) {
          // 兼容直接返回对象的情况
          examOptions.value.push({
            label: item.name,
            value: item.id
          });
        }
      });
      
      if (examOptions.value.length > 0) {
        selectedExamId.value = examOptions.value[0].value;
      } else {
        message.warning('该学生暂无考试记录');
      }
    }
  } catch (err) {
    message.error('获取考试列表失败');
    console.error(err);
  }
};

// 处理班级选择变化
const handleClassChange = async (classId: number) => {
  rememberTeacherClass(userStore.getUserInfo(), classId);
  currentClassId.value = String(classId);
  subjectSelection.value = '';
  studentId.value = '';
  selectedExamId.value = undefined;
  examOptions.value = [];
  studentOptions.value = [];
  showResults.value = false;

  hasSimulated.value = false;
  
  if (classId) {
    // 获取班级的选科信息
    try {
      const classRes = await getClassesApi({ school_id: schoolId.value });
      if (classRes.code === 200 && classRes.data) {
        const classData = classRes.data.find((c: any) => c.id === classId);
        if (classData && classData.subject_selection) {
          subjectSelection.value = classData.subject_selection;
          console.log('班级选科信息:', subjectSelection.value);
        }
      }
    } catch (err) {
      console.error('获取班级选科信息失败:', err);
    }
    await fetchStudentList(classId);
  }
};

// 处理学生选择变化
const handleStudentChange = async (uid: string) => {
  selectedExamId.value = undefined;
  examOptions.value = [];
  showResults.value = false;
  hasSimulated.value = false;
  
  if (uid) {
    await fetchExamList();
  }
};

// 下拉框搜索过滤
const filterOption = (input: string, option: any) => {
  return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

// 查询成绩
const handleSearch = async () => {
  if (!studentId.value) {
    // message.warning(isTeacher.value ? '请选择学生' : '请输入学生学号');
    return;
  }
  
  if (!selectedExamId.value) {
    // message.warning('请选择考试');
    return;
  }

  loading.value = true;
  try {
    const res = await getGradeApi({
      student_id: studentId.value,
      exam_id: selectedExamId.value,
    });

    if (res.code === 200 && res.data && res.data.length > 0) {
      const gradeData = res.data[0];
      parseGradeData(gradeData);
      showResults.value = true;
      hasSimulated.value = false;
      currentClassId.value = res.data[0].class_id
      message.success('查询成功');
    } else {
      message.error('未查询到成绩数据');
      showResults.value = false;
    }
  } catch (err) {
    message.error('查询失败');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 根据选科信息判断科目是否应该显示
const shouldShowSubject = (subjectKey: string): boolean => {
  // 如果没有选科信息，则显示所有科目
  if (!subjectSelection.value || subjectSelection.value.trim() === '' || subjectSelection.value.trim() === '未选科') {
    return true;
  }

  // 根据科目key判断是否应该显示
  switch (subjectKey) {
    case '物理':
      return subjectSelection.value.includes('物') || subjectSelection.value.includes('理');
    case '化学':
      return subjectSelection.value.includes('化');
    case '生物':
      return subjectSelection.value.includes('生');
    case '历史':
      return subjectSelection.value.includes('史');
    case '政治':
      return subjectSelection.value.includes('政');
    case '地理':
      return subjectSelection.value.includes('地');
    default:
      // 语数英等主科以及总分 always 显示
      return true;
  }
};

// 解析成绩数据
const parseGradeData = (gradeData: any) => {
  const scores: ScoreRecord[] = [];
  const totalScore = getTotalScore(gradeData);

  // 添加总分
  scores.push({
    key: '总分',
    subject: '总分',
    subjectKey: '总分',
    score: totalScore,
    classRank: getTotalClassRank(gradeData),
    gradeRank: getTotalSchoolRank(gradeData)
  });

  // 添加各科成绩
  const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '政治', '地理'];
  let singleSum = 0; // 单科成绩之和（不含总分，用于判断是否缺日语）

  subjects.forEach(subjectKey => {
    const score = getSubjectScore(gradeData, subjectKey);
    const classRank = getSubjectClassRank(gradeData, subjectKey);
    const gradeRank = getSubjectSchoolRank(gradeData, subjectKey);

    singleSum += score;

    // 只显示有成绩且符合选科要求的科目
    if ((score > 0 || classRank > 0 || gradeRank > 0) && shouldShowSubject(subjectKey)) {
      scores.push({
        key: subjectKey,
        subject: subjectMap[subjectKey].name,
        subjectKey: subjectKey,
        score: score || 0,
        classRank: classRank || 0,
        gradeRank: gradeRank || 0
      });
    }
  });

  // 单科成绩之和与总分不等时，补上日语（日语成绩 = 总分 - 单科成绩之和）
  const japaneseScore = totalScore - singleSum;
  if (japaneseScore > 0.01) {
    scores.push({
      key: '日语',
      subject: subjectMap['日语'].name,
      subjectKey: '日语',
      score: japaneseScore,
      classRank: getSubjectClassRank(gradeData, '日语'),
      gradeRank: getSubjectSchoolRank(gradeData, '日语')
    });
  }

  originalScores.value = scores;
  simulatedScores.value = JSON.parse(JSON.stringify(scores));
};

// 处理成绩修改
const handleScoreChange = (record?: ScoreRecord) => {
  // 计算单科成绩差值（模拟 - 原始）
  if (record) {
    const originalRecord = originalScores.value.find(r => r.subjectKey === record.subjectKey);
    record.scoreDiff = originalRecord
      ? Number(((Number(record.score) || 0) - originalRecord.score).toFixed(1))
      : 0;
  }

  // 计算总分
  const total = simulatedScores.value
    .filter(s => s.subject !== '总分')
    .reduce((sum, s) => sum + (Number(s.score) || 0), 0);
  
  const totalRecord = simulatedScores.value.find(s => s.subject === '总分');
  if (totalRecord) {
    totalRecord.score = total;
    // 计算总分差值（模拟 - 原始）
    const origTotal = originalScores.value.find(s => s.subject === '总分')?.score || 0;
    totalRecord.scoreDiff = Number((totalRecord.score - origTotal).toFixed(1));
  }
};

// 模拟查询
const handleSimulate = async () => {
  if (!selectedExamId.value) {
    message.warning('请选择考试');
    return;
  }

  simulating.value = true;
  try {
    // 构建请求数据
    const requestData: any = {
      exam_id: selectedExamId.value,
      school_id: schoolId.value,
      class_id: currentClassId.value,
      student_id:studentId.value,
      '语文': 0,
      '数学': 0,
      '英语': 0,
      '物理': 0,
      '化学': 0,
      '生物': 0,
      '历史': 0,
      '政治': 0,
      '地理': 0,
      '日语': 0,
      '总分': 0
    };

    // 填充成绩数据
    simulatedScores.value.forEach(record => {
      if (record.subjectKey in requestData) {
        requestData[record.subjectKey] = record.score;
      }
    });

    console.log('模拟查询请求数据:', requestData);
    const res = await postSimulateGrade(requestData);
    console.log('模拟查询返回数据:', res);

    if (res.code === 200 && res.data) {
      // 更新模拟成绩的排名（包括总分）
      simulatedScores.value.forEach(record => {
        const subjectData = res.data[record.subjectKey];
        if (subjectData) {
          const originalRecord = originalScores.value.find(r => r.subjectKey === record.subjectKey);
          record.classRank = subjectData.class_rank || 0;
          record.gradeRank = subjectData.school_rank || 0;
          
          // 计算排名差值
          if (originalRecord) {
            record.classRankDiff = record.classRank - originalRecord.classRank;
            record.gradeRankDiff = record.gradeRank - originalRecord.gradeRank;
          }
        }
      });

      // 计算并设置总分变化（分数差值）
      const origTotal = originalScores.value.find(s => s.subject === '总分')?.score || 0;
      const simTotalRec = simulatedScores.value.find(s => s.subject === '总分');
      if (simTotalRec) {
        simTotalRec.scoreDiff = simTotalRec.score - origTotal;
      }

      hasSimulated.value = true;
      message.success('模拟成功');
    } else {
      message.error(res.msg || '模拟失败');
    }
  } catch (err) {
    message.error('模拟失败');
    console.error(err);
  } finally {
    simulating.value = false;
  }
};

// 重置成绩
const handleResetScores = () => {
  simulatedScores.value = JSON.parse(JSON.stringify(originalScores.value));
  hasSimulated.value = false;
  message.info('已复位到原始成绩');
};

// 重置表单
const handleReset = () => {
  const userInfo = userStore.getUserInfo();
  
  if (isTeacher.value) {
    // 老师端重置
    selectedClassId.value = undefined;
    studentId.value = '';
    studentOptions.value = [];
  } else if (userInfo?.student) {
    // 学生端重置为当前学生
    studentId.value = userInfo.student.uid;
  } else {
    studentId.value = '';
  }
  
  selectedExamId.value = undefined;
  examOptions.value = [];
  showResults.value = false;
  hasSimulated.value = false;
  originalScores.value = [];
  simulatedScores.value = [];
};

// 获取科目最大分数
const getMaxScore = (subject: string): number => {
  const subjectKey = Object.keys(subjectMap).find(key => subjectMap[key].name === subject);
  return subjectKey ? subjectMap[subjectKey].max : 150;
};

// 样式类名
const getScoreClass = (score: number, subject: string) => {
  if (subject === '总分') {
    return score >= 600 ? 'excellent-score' : score >= 500 ? 'good-score' : 'normal-score';
  }
  const max = getMaxScore(subject);
  const percentage = (score / max) * 100;
  return percentage >= 90 ? 'excellent-score' : percentage >= 80 ? 'good-score' : 'normal-score';
};

const getRankClass = (rank: number) => {
  return rank <= 3 ? 'top-rank' : rank <= 10 ? 'good-rank' : 'normal-rank';
};

const getRankDiffClass = (diff: number) => {
  return diff > 0 ? 'rank-down' : diff < 0 ? 'rank-up' : 'rank-same';
};

const getRankChangeClass = (diff: number) => {
  return diff > 0 ? 'rank-worse' : diff < 0 ? 'rank-better' : '';
};

const getRankDiffText = (diff: number) => {
  if (diff === 0) return '排名不变';
  if (diff > 0) return `下降 ${diff} 名`;
  return `上升 ${Math.abs(diff)} 名`;
};
  
  const getScoreDiffClass = (diff: number) => {
    return diff > 0 ? 'score-up' : diff < 0 ? 'score-down' : 'score-same';
  };
  
  const getScoreDiffText = (diff: number) => {
    if (diff === 0) return '分数不变';
    if (diff > 0) return `增加 ${diff} 分`;
    return `减少 ${Math.abs(diff)} 分`;
  };
</script>

<style scoped lang="less">
.grade-simulate-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  overflow-y: auto;
  
  
  .header {
    background: linear-gradient(120deg, #4b6cb7, #1890ff);
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 24px;
    color: white;
    
    h2 {
      margin: 0 0 8px 0;
      font-size: 26px;
      font-weight: 600;
    }
    
    p {
      margin: 0;
      font-size: 14px;
      opacity: 0.9;
    }
  }
  
  .search-section {
    margin-bottom: 24px;
    
    .search-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      
      :deep(.ant-card-head) {
        background: linear-gradient(120deg, #f0f2f5, #e4e7ec);
        border-bottom: 1px solid #e8e8e8;
        
        .ant-card-head-title {
          font-weight: 600;
          color: #333;
        }
      }
    }
    
    .search-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      
      .search-label {
        min-width: 60px;
        font-weight: 600;
        color: #333;
      }
    }
    
    .search-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      height: 100%;
      
      @media (max-width: 768px) {
        justify-content: flex-start;
      }
    }
  }
  
  .content-section {
    .score-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      margin-bottom: 16px;
      
      :deep(.ant-card-head) {
        border-bottom: 1px solid #e8e8e8;
        
        .ant-card-head-title {
          font-weight: 600;
          color: #333;
          font-size: 16px;
        }
      }
    }
    
    .original-card {
      :deep(.ant-card-head) {
        background: linear-gradient(120deg, #e6f7ff, #d9f0ff);
      }
    }
    
    .simulate-card {
      :deep(.ant-card-head) {
        background: linear-gradient(120deg, #fff7e6, #ffe7ba);
      }
      
      .edit-hint {
        background: #fff7e6;
        border: 1px solid #ffd591;
        border-radius: 6px;
        padding: 8px 12px;
        margin-bottom: 16px;
        font-size: 13px;
        color: #d46b08;
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
    
    .editable-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      :deep(.ant-input-number) {
        width: 50%;
      }

      // 上下调节按钮移到输入框左侧
      :deep(.ant-input-number-handler-wrap) {
        left: 0;
        right: auto;
        border-left: none;
        border-right: 1px solid #d9d9d9;
        border-radius: 6px 0 0 6px;
      }

      :deep(.ant-input-number-input) {
        padding-left: 26px;
      }

      > .score-change-icon {
        margin-left: 0;
        flex-shrink: 0;
        white-space: nowrap;
      }
    }
  }
  
  .analysis-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    
    :deep(.ant-card-head) {
      background: linear-gradient(120deg, #f0f5ff, #d6e4ff);
      border-bottom: 1px solid #e8e8e8;
      
      .ant-card-head-title {
        font-weight: 600;
        color: #333;
        font-size: 16px;
      }
    }
    
    .analysis-content {
      .rank-change-card {
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        border-left: 4px solid #1890ff;
        transition: transform 0.3s ease;
        
        &:hover {
          transform: translateY(-2px);
        }
        
        &.grade-rank {
          border-left-color: #52c41a;
        }
        
        .rank-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
        }
        
        .rank-value {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 12px;
          
          .original {
            color: #999;
          }
          
          .simulated {
            color: #1890ff;
            
            &.rank-better {
              color: #52c41a;
            }
            
            &.rank-worse {
              color: #f5222d;
            }
          }
        }
        
        .rank-diff {
          text-align: center;
          font-size: 16px;
          font-weight: 600;
        }
      }
    }
  }
  
  .empty-state {
    background: white;
    border-radius: 12px;
    padding: 60px 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    text-align: center;
  }
  
  // 分数样式
  .excellent-score {
    color: #52c41a;
    font-weight: 700;
  }
  
  .good-score {
    color: #1890ff;
    font-weight: 600;
  }
  
  .normal-score {
    color: #333;
  }
  
  // 排名样式
  .top-rank {
    color: #f5222d;
    font-weight: 700;
  }
  
  .good-rank {
    color: #fa8c16;
    font-weight: 600;
  }
  
  .normal-rank {
    color: #333;
  }
  
  // 排名变化样式
  .rank-up {
    color: #52c41a;
    font-weight: 600;
  }
  
  .rank-down {
    color: #f5222d;
    font-weight: 600;
  }
  
  .rank-same {
    color: #999;
  }
  
  .rank-change-icon {
    margin-left: 8px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
  }

  .score-up {
    color: #52c41a;
    font-weight: 600;
  }

  .score-down {
    color: #f5222d;
    font-weight: 600;
  }

  .score-same {
    color: #999;
  }

  .score-change-icon {
    margin-left: 8px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .grade-simulate-container {
    padding: 12px;
    
    .header {
      padding: 16px;
      
      h2 {
        font-size: 20px;
      }
      
      p {
        font-size: 12px;
      }
    }
    
    .content-section {
      .rank-change-card {
        margin-bottom: 16px;
        
        .rank-value {
          font-size: 24px;
        }
        
        .rank-diff {
          font-size: 14px;
        }
      }
    }
  }
}

// 表格样式优化
:deep(.ant-table) {
  .ant-table-thead > tr > th {
    background: linear-gradient(180deg, #f0f5ff 0%, #e6f0ff 100%);
    font-weight: 600;
    color: #2c3e50;
    border-bottom: 2px solid #d6e4ff;
    text-align: center;
  }
  
  .ant-table-tbody > tr > td {
    text-align: center;
  }
  
  .ant-table-tbody > tr:hover {
    background-color: #f0f8ff;
  }
}
</style>

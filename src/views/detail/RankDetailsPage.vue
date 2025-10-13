<template>
  <div class="rank-details-page">
    <h2 class="page-title">名次详情</h2>

    <!-- Filter/Info Area -->
    <div class="info-display-container">
      <div class="display-item">
        <span class="label">班级</span>
        <select v-model="selectedClassId" class="value-select" disabled>
          <option v-for="cls in classes" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
        </select>
      </div>
      <div class="display-item">
        <span class="label">考试</span>
        <select v-model="selectedExamId" class="value-select">
          <option value="">请选择考试</option>
          <option v-for="exam in exams" :key="exam.id" :value="exam.id">{{ exam.name }}</option>
        </select>
      </div>
      <div class="display-item">
        <span class="label">姓名</span>
        <input 
          type="text" 
          v-model="studentName" 
          class="value-input" 
          placeholder="请输入姓名" 
          readonly
        />
      </div>

      <p class="description red-text">
        说明：成绩展示为班级前三名和以本学生为基准前后各10位同学的成绩（含本人）。
      </p>

      <button class="query-button" @click="queryRankDetails">查询</button>

      <p class="info-hint">
        <span class="info-icon">i</span> 表格可向左滑动查看信息
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <!-- Rank Details Table -->
    <div class="table-container" v-if="showRankDetailsTable && !isLoading && !errorMessage">
      <table class="rank-details-table">
        <thead>
          <tr>
            <th>姓名</th>
            <th>总分</th>
            <th>班次</th>
            <th>段次</th>
            <th>语文</th>
            <th>语文班次</th>
            <th>语文段次</th>
            <th>数学</th>
            <th>数学班次</th>
            <th>数学段次</th>
            <th>外语</th>
            <th>外语班次</th>
            <th>外语段次</th>
            <template v-for="subject in dynamicSubjects" :key="subject.name">
              <th>{{ subject.name }}</th>
              <th>{{ subject.name }}班次</th>
              <th>{{ subject.name }}段次</th>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr 
            :class="{ 
              'highlight-row': student.studentId === currentStudentId, 
              'third-place-divider': index === 2 
            }" 
            v-for="(student, index) in displayedStudents" 
            :key="student.studentId"
          >
            <td>{{ student.name }}</td>
            <td>{{ student.totalScore }}</td>
            <td>{{ student.classRank }}</td>
            <td>{{ student.overallRank }}</td>
            <td>{{ student.chineseScore }}</td>
            <td>{{ student.chineseClassRank }}</td>
            <td>{{ student.chineseOverallRank }}</td>
            <td>{{ student.mathScore }}</td>
            <td>{{ student.mathClassRank }}</td>
            <td>{{ student.mathOverallRank }}</td>
            <td>{{ student.englishScore }}</td>
            <td>{{ student.englishClassRank }}</td>
            <td>{{ student.englishOverallRank }}</td>
            <template v-for="subject in dynamicSubjects" :key="subject.name">
              <td>{{ student[`${subject.key}Score`] }}</td>
              <td>{{ student[`${subject.key}ClassRank`] }}</td>
              <td>{{ student[`${subject.key}OverallRank`] }}</td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import api from '@/servers/api';
import { useUserStore } from '@/store';
import { message } from 'ant-design-vue';
import { getStudentExamApi } from '@/servers/api/student';

const router = useRouter();
const userStore = useUserStore();

// State
const showRankDetailsTable = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

// Form data
const selectedClassId = ref('');
const classes = ref<API.Classes[]>([]);

const selectedExamId = ref('');
const exams = ref<{id: string; name: string}[]>([]);

const studentName = ref('');
const currentStudentId = ref('');
const studentInfo = ref<any>(null);

// Data storage - 存储完整班级数据（用于精准定位目标学生）
const fullClassStudents = ref<any[]>([]);
const top3Students = ref<any[]>([]);

// 动态科目列表（基于学生选科）
const dynamicSubjects = computed(() => {
  const subjects: { name: string; key: string }[] = [];
  
  if (!studentInfo.value?.subject_selection) return subjects;
  
  const subjectMap = {
    '物': { name: '物理', key: 'physics' },
    '化': { name: '化学', key: 'chemistry' },
    '生': { name: '生物', key: 'biology' },
    '史': { name: '历史', key: 'history' },
    '地': { name: '地理', key: 'geography' },
    '政': { name: '政治', key: 'politics' }
  };
  
  for (const key in subjectMap) {
    if (studentInfo.value.subject_selection.includes(key)) {
      subjects.push(subjectMap[key as keyof typeof subjectMap]);
    }
  }
  
  return subjects;
});

// 初始化数据
onMounted(async () => {
  const userInfo = userStore.userInfo;
  
  if (!userInfo) {
    errorMessage.value = '用户信息获取失败，请重新登录';
    return;
  }

  if (userInfo.student) {
    await initStudentInfo(userInfo);
  } else {
    errorMessage.value = '请以学生身份登录查看';
  }
});

// 初始化学生信息
const initStudentInfo = async (userInfo: any) => {
  try {
    isLoading.value = true;
    const studentInfoData = userInfo.student;
    
    if (!studentInfoData) {
      message.warning('请先完善学生信息');
      return;
    }

    studentName.value = studentInfoData.name || '';
    currentStudentId.value = studentInfoData.uid || '';
    studentInfo.value = studentInfoData;
    
    const studentClassId = studentInfoData.class_id;
    if (studentClassId) {
      await fetchClassDetails(studentClassId);
      await fetchExamsByStudent(userInfo.role);
    } else {
      message.warning('未找到学生所在班级信息');
    }
    
    // 默认选中最新考试
    if (exams.value.length > 0) {
      const sortedExams = [...exams.value].sort((a, b) => Number(b.id) - Number(a.id));
      selectedExamId.value = sortedExams[0].id;
    }
  } catch (err) {
    message.error('获取当前学生信息失败，请重试');
  } finally {
    isLoading.value = false;
  }
};

// 获取学生考试列表
const fetchExamsByStudent = async (studentUid: string) => {
  try {
    isLoading.value = true;
    const response = await getStudentExamApi({ student_uid: studentUid });
    
    if (response.code === 200) {
      exams.value = response.data.map((item: any[]) => {
        if (Array.isArray(item) && item[0] && item[0].id && item[0].name) {
          return {
            id: item[0].id.toString(),
            name: item[0].name
          };
        }
        return null;
      }).filter(Boolean);
    } else {
      message.error(response.msg || '获取考试列表失败');
      exams.value = [];
    }
  } catch (err) {
    message.error('获取考试列表失败，请刷新页面重试');
  } finally {
    isLoading.value = false;
  }
};

// 获取班级详情
const fetchClassDetails = async (classId: string) => {
  try {
    const response = await api.classes.getClassesApi({ id: classId });
    if (response.data && response.data.length > 0) {
      classes.value = response.data;
      selectedClassId.value = classId;
    } else {
      classes.value = [{
        id: classId,
        name: `班级 ${classId}`
      }];
      selectedClassId.value = classId;
    }
  } catch (err) {
    classes.value = [{
      id: classId,
      name: `班级 ${classId}`
    }];
    selectedClassId.value = classId;
  }
};

// 修改查询名次详情方法
const queryRankDetails = async () => {
  // 基础校验保持不变
  if (!selectedClassId.value) {
    errorMessage.value = '请选择班级';
    return;
  }
  if (!selectedExamId.value) {
    errorMessage.value = '请选择考试';
    return;
  }
  if (!studentName.value.trim()) {
    errorMessage.value = '请输入姓名';
    return;
  }

  try {
    isLoading.value = true;
    errorMessage.value = '';
    showRankDetailsTable.value = false;

    // 1. 获取目标学生成绩
    const targetRes = await api.grade.getGradeApi({
      student_id: Number(currentStudentId.value),
      exam_id: Number(selectedExamId.value),
    });

    if (!targetRes.data || targetRes.data.length === 0) {
      errorMessage.value = '未找到该学生的成绩信息';
      return;
    }
    const targetStudentData = transformGradeToStudent(targetRes.data[0]);

    // 2. 获取前三名学生
    const top3Res = await api.grade.getGradeApi({
      class_id: Number(selectedClassId.value),
      exam_id: Number(selectedExamId.value),
      size: 3,
      sort: 'sumB,asc'
    });
    top3Students.value = (top3Res.data || []).map(transformGradeToStudent);

    // 3. 使用新接口获取前后10名学生
    const rankRes = await api.grade.getStudentGradeRank({
      student_id: Number(currentStudentId.value),
      selected_exam_id: Number(selectedExamId.value),
    });

    // 4. 处理接口返回的前后10名数据
    const aroundStudents = (rankRes.data?.around || []).map(transformGradeToStudent);
    
    // 5. 合并数据并去重
    fullClassStudents.value = aroundStudents;
    
    // 确保目标学生在列表中
    const isTargetInList = aroundStudents.some(
      s => s.studentId === currentStudentId.value
    );
    if (!isTargetInList) {
      fullClassStudents.value.push(targetStudentData);
    }

    showRankDetailsTable.value = true;
  } catch (err) {
    message.error('查询失败，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};

// 转换成绩数据为学生格式
const transformGradeToStudent = (grade: any) => {
  const baseData = {
    studentId: grade.student_id,
    name: grade.student_name || '',
    totalScore: grade.sum_,
    classRank: grade.sumB,
    overallRank: grade.sumD,
    chineseScore: grade.Yuwen,
    chineseClassRank: grade.YuwenB,
    chineseOverallRank: grade.YuwenD,
    mathScore: grade.Shuxue,
    mathClassRank: grade.ShuxueB,
    mathOverallRank: grade.ShuxueD,
    englishScore: grade.Yingyu,
    englishClassRank: grade.YingyuB,
    englishOverallRank: grade.YingyuD
  };

  // 动态添加选考科目数据
  dynamicSubjects.value.forEach(subject => {
    const subjectKeyMap: Record<string, string> = {
      'physics': 'Wuli',
      'chemistry': 'Huaxue',
      'biology': 'Shengwu',
      'history': 'Lishi',
      'geography': 'Dili',
      'politics': 'Zhengzhi'
    };
    
    const apiKey = subjectKeyMap[subject.key];
    if (apiKey) {
      baseData[`${subject.key}Score`] = grade[apiKey];
      baseData[`${subject.key}ClassRank`] = grade[`${apiKey}B`];
      baseData[`${subject.key}OverallRank`] = grade[`${apiKey}D`];
    }
  });

  return baseData;
};

// 修改displayedStudents计算属性（简化版本）
const displayedStudents = computed(() => {
  const finalList: any[] = [];
  const addedStudentIds = new Set<string>();

  // 添加前三名
  top3Students.value.forEach(student => {
    if (student.studentId && !addedStudentIds.has(student.studentId)) {
      finalList.push(student);
      addedStudentIds.add(student.studentId);
    }
  });

  // 添加前后10名学生
  fullClassStudents.value.forEach(student => {
    if (student.studentId && !addedStudentIds.has(student.studentId)) {
      finalList.push(student);
      addedStudentIds.add(student.studentId);
    }
  });

  // 按班级排名排序
  return finalList.sort((a, b) => a.classRank - b.classRank);
});
</script>

<style scoped>
.loading-container {
  text-align: center;
  padding: 50px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
  text-align: center;
}

.highlight-row {
  background-color: #fff3cd; /* 高亮本人行 */
}

.third-place-divider {
  border-bottom: 2px solid #333; /* 前三名下方分隔线 */
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.rank-details-page {
  padding: 20px;
  position: relative;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  font-family: sans-serif;
}

.back-button {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px 10px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10;
}

.page-title {
  text-align: center;
  margin-top: 10px;
  margin-bottom: 20px;
}

.info-display-container {
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
}

.display-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.display-item:last-child {
  border-bottom: none;
}

.label {
  width: 80px;
  flex-shrink: 0;
  color: #555;
  text-align: right;
  margin-right: 10px;
}

.value {
  flex-grow: 1;
  padding: 5px 10px;
  font-size: 1em;
  color: #333;
  display: flex;
}

.value-select,
.value-input {
  flex-grow: 1;
  padding: 8px 10px;
  font-size: 1em;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-left: 0;
}

.value-input:read-only {
  background-color: #f9f9f9;
  cursor: not-allowed;
}

.description {
  margin-bottom: 10px;
  font-size: 0.9em;
  color: #555;
}

.red-text {
  color: red;
}

.query-button {
  display: block;
  width: 80%;
  margin: 20px auto;
  padding: 10px 30px;
  background: linear-gradient(to bottom, #007bff, #0056b3);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1em;
}

.info-hint {
  font-size: 0.85em;
  color: #17a2b8;
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.info-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  line-height: 14px;
  text-align: center;
  border-radius: 50%;
  background-color: #17a2b8;
  color: white;
  font-size: 0.8em;
  margin-right: 5px;
  flex-shrink: 0;
}

.table-container {
  width: 100%;
  overflow-x: auto;
  margin-top: 20px;
}

.rank-details-table {
  width: 100%;
  border-collapse: collapse;
}

.rank-details-table th,
.rank-details-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
  white-space: nowrap;
}

.rank-details-table th {
  background-color: #f2f2f2;
}

.highlight-row {
  background-color: #e0f7fa;
}

.third-place-divider {
  border-bottom: 2px solid red;
}
</style>
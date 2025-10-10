<template>
  <div class="student-challenge-page">
    <h2>学生挑战</h2>

    <!-- Filter/Input Area -->
    <div class="filter-input-container">
      <div class="input-row">
        <span class="label">班级</span>
        <select class="input-select" v-model="selectedClass">
          <option :value="userInfo?.student?.class_id" selected>
            {{ userInfo?.student?.class_id }}
          </option>
        </select>
        <span class="arrow">></span>
      </div>
      <div class="input-row">
        <span class="label">考试</span>
        <select class="input-select" v-model="selectedExam">
          <option value="">请选择考试</option>
          <option v-for="exam in examList" :key="exam.id" :value="exam.id">
            {{ exam.name }}
          </option>
        </select>
        <span class="arrow">></span>
      </div>
      <div class="input-row">
        <span class="label">维度</span>
        <select class="input-select" v-model="selectedDimension">
          <option value="">请选择维度</option>
          <option value="score">分数</option>
          <option value="rank">段次</option>
        </select>
        <span class="arrow">></span>
      </div>
      <div class="input-row">
        <span class="label">姓名</span>
        <select class="input-select" v-model="selectedName">
          <option :value="userInfo?.student?.name" selected>
            {{ userInfo?.student?.name }}
          </option>
        </select>
        <span class="arrow">></span>
      </div>
      <div class="input-row">
        <span class="label">对手</span>
        <div class="opponent-inputs">
          <select 
            class="input-select opponent-class-select" 
            v-model="opponentClass" 
            @change="handleOpponentClassChange"
          >
            <option value="">请选择班级</option>
            <option v-for="cls in opponentClassList" :key="cls.id" :value="cls.id">
              {{ cls.id }}
            </option>
          </select>
          <input
            type="text"
            class="input-text opponent-name-text"
            v-model="opponentName"
            placeholder="请输入对手姓名"
          />
        </div>
        <span class="arrow">></span>
      </div>
    </div>

    <p class="description">
      说明：默认考试选择最近一次考试，您也可以选择其他考试，与对手进行比较。
    </p>

    <button class="compare-button" @click="runComparison">对比</button>

    <!-- Comparison Results Table -->
    <div class="comparison-table-container" v-if="showComparisonTable">
      <table class="results-table">
        <thead>
          <tr>
            <th>学科</th>
            <th>{{ userInfo?.student?.name }}</th>
            <th>{{ opponentName }}</th>
            <th>{{ selectedDimension === 'score' ? '分差' : '段次差' }}</th>
          </tr>
        </thead>
        <tbody>
          <!-- 总分/总段次行 -->
          <tr>
            <td>{{ selectedDimension === 'score' ? '总分' : '总段次' }}</td>
            <td>{{ getCurrentValue('sum') }}</td>
            <td>{{ getCompareValue('sum') }}</td>
            <td :class="getDiffClass('sum')">
              {{ getDiffValue('sum') }}
            </td>
          </tr>

          <!-- 语文行 -->
          <tr>
            <td>语文</td>
            <td>{{ getCurrentValue('Yuwen') }}</td>
            <td>{{ getCompareValue('Yuwen') }}</td>
            <td :class="getDiffClass('Yuwen')">
              {{ getDiffValue('Yuwen') }}
            </td>
          </tr>

          <!-- 数学行 -->
          <tr>
            <td>数学</td>
            <td>{{ getCurrentValue('Shuxue') }}</td>
            <td>{{ getCompareValue('Shuxue') }}</td>
            <td :class="getDiffClass('Shuxue')">
              {{ getDiffValue('Shuxue') }}
            </td>
          </tr>

          <!-- 外语行 -->
          <tr>
            <td>外语</td>
            <td>{{ getCurrentValue('Yingyu') }}</td>
            <td>{{ getCompareValue('Yingyu') }}</td>
            <td :class="getDiffClass('Yingyu')">
              {{ getDiffValue('Yingyu') }}
            </td>
          </tr>

          <!-- 历史/物理行 -->
          <tr>
            <td>历史/物理</td>
            <td>{{ getCurrentValue('Lishi,Wuli') }}</td>
            <td>{{ getCompareValue('Lishi,Wuli') }}</td>
            <td :class="getDiffClass('Lishi,Wuli')">
              {{ getDiffValue('Lishi,Wuli') }}
            </td>
          </tr>

          <!-- 政治/化学行 -->
          <tr>
            <td>政治/化学</td>
            <td>{{ getCurrentValue('Zhengzhi,Huaxue') }}</td>
            <td>{{ getCompareValue('Zhengzhi,Huaxue') }}</td>
            <td :class="getDiffClass('Zhengzhi,Huaxue')">
              {{ getDiffValue('Zhengzhi,Huaxue') }}
            </td>
          </tr>

          <!-- 地理/生物行 -->
          <tr>
            <td>地理/生物</td>
            <td>{{ getCurrentValue('Dili,Shengwu') }}</td>
            <td>{{ getCompareValue('Dili,Shengwu') }}</td>
            <td :class="getDiffClass('Dili,Shengwu')">
              {{ getDiffValue('Dili,Shengwu') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store';
import { message } from 'ant-design-vue';
import { getExamApi } from '@/servers/api/exam';
import { getClassesApi } from '@/servers/api/classes';
import { getStudentApi } from '@/servers/api/student';

const router = useRouter();
const userStore = useUserStore();
const userInfo = userStore.userInfo;

// 考试相关
const examList = ref<any[]>([]);
const showComparisonTable = ref(false);
const selectedClass = ref(userInfo?.student?.class_id || '');
const selectedExam = ref('');
const selectedDimension = ref(''); // 'score' 或 'rank'
const selectedName = ref(userInfo?.student?.name || '');

// 对手相关
const opponentClassList = ref<any[]>([]);
const opponentClass = ref('');
const opponentName = ref('');
const opponentStudents = ref<any[]>([]);

// 对比数据
const currentStudentData = ref<any>({});
const compareStudentData = ref<any>({});
const resultData = ref<any>({});

// 获取考试列表
// 获取考试列表
const fetchExamList = async () => {
  try {
    if (!userInfo?.student?.class_id) {
      message.warning('请先完善学生信息');
      return;
    }
    // @ts-ignore
    const response = await getExamApi({ class_id: userInfo.student.class_id });
    if (response.code === 200) {
      examList.value = response.data || [];
      console.log('获取到考试列表:', examList.value);
      
      if (examList.value.length > 0) {
        // 按考试id倒序排序，id大的视为最新考试
        const sortedExams = [...examList.value].sort((a, b) => b.id - a.id); 
        selectedExam.value = sortedExams[0].id;
        console.log('默认选中最新考试:', sortedExams[0].name, '考试id:', sortedExams[0].id);
      } else {
        selectedExam.value = '';
        message.warning('当前班级暂无考试数据');
      }
    } else {
      console.error('获取考试列表失败:', response.msg);
    }
  } catch (error) {
    console.error('获取考试列表出错', error);
  }
};

// 获取对手班级列表
const fetchOpponentClasses = async () => {
  try {
    const response = await getClassesApi({ 
      school_id: userInfo?.student?.school_id 
    });
    
    if (response.code === 200) {
      // 排除当前学生自己的班级
      opponentClassList.value = response.data.filter(
        (cls: any) => cls.id !== userInfo?.student?.class_id
      );
    } else {
    }
  } catch (error) {
    console.error('获取对手班级列表出错', error);
  }
};

// 处理对手班级变化
const handleOpponentClassChange = async (event: Event) => {
  const classId = (event.target as HTMLSelectElement).value;
  
  if (!classId) {
    opponentStudents.value = [];
    opponentName.value = '';
    return;
  }
  
  try {
    const classIdNumber = Number(classId);
    if (isNaN(classIdNumber)) {
      message.error('班级ID格式错误');
      return;
    }

    const response = await getStudentApi({ 
      class_id: classIdNumber,
      school: userInfo?.student?.school,
      size: 1000
    });
    
    if (response.code === 200) {
      opponentStudents.value = response.data;
    } else {
      message.error(`获取学生列表失败：${response.msg || '未知错误'}`);
    }
  } catch (error) {
    console.error('获取对手班级学生列表出错', error);
    message.error('获取学生列表失败，请重试');
  }
};

// 获取当前学生的维度值
const getCurrentValue = (subject: string) => {
  return getDimensionValue(currentStudentData.value, subject);
};

// 获取对手学生的维度值
const getCompareValue = (subject: string) => {
  return getDimensionValue(compareStudentData.value, subject);
};

// 获取组合学科中分数不为0的科目
const getValidSubject = (data: any, subjects: string[]) => {
  // 遍历组合学科，返回值不为0的科目
  for (const sub of subjects) {
    if (data[sub] !== undefined && data[sub] !== 0) {
      return sub;
    }
  }
  return subjects[0];
};

// 根据维度和学科获取对应值
const getDimensionValue = (data: any, subject: string) => {
  if (subject.includes(',')) {
    const subjects = subject.split(',');
    const validSub = getValidSubject(data, subjects);
    if (selectedDimension.value === 'score') { 
      return data[validSub] || 0;
    } else {
      return data[`${validSub}D`] || 0;
    }
  }
  if (selectedDimension.value === 'score') { 
    return subject === 'sum' ? data.sum_ : data[subject] || 0;
  } else {
    return subject === 'sum' ? data.sumD : data[`${subject}D`] || 0;
  }
};

// 计算差分值
const getDiffValue = (subject: string) => {
  if (selectedDimension.value === 'score') {
    // 分数维度
    if (subject.includes(',')) {
      const subjects = subject.split(',');
      // 组合学科
      const validSub = getValidSubject(currentStudentData.value, subjects);
      return resultData.value[validSub] || 0;
    }
    // 单学科
    const resultKey = subject === 'sum' ? 'sum_' : subject;
    return resultData.value[resultKey] || 0;
  } else {
    // 段次维度
    const currentVal = getCurrentValue(subject);
    const compareVal = getCompareValue(subject);
    return currentVal - compareVal;
  }
};

// 根据维度和差值判断样式
const getDiffClass = (subject: string) => {
  const diff = getDiffValue(subject);
  if (selectedDimension.value === 'score') {
    // 分数
    return diff > 0 ? 'green' : 'red';
  } else {
    // 段次
    return diff < 0 ? 'green' : 'red';
  }
};

const runComparison = async () => {
  const currentStudentId = userInfo?.student?.uid;
  const selectedExamId = selectedExam.value;

  // 验证必填项
  if (!currentStudentId) {
    message.warning('请先在个人信息中绑定学生账号');
    return;
  }
  if (!selectedExamId) {
    message.warning('请选择考试');
    return;
  }
  if (!opponentClass.value) {
    message.warning('请选择对手班级');
    return;
  }
  if (!opponentName.value) {
    message.warning('请输入对手姓名');
    return;
  }
  if (!selectedDimension) {
    message.warning('请选择对比维度（分数或段次）');
    return;
  }

  try {
    // 获取对手学生信息
    const normalizedInputName = opponentName.value.trim().replace(/\s/g, "").toLowerCase();
    const opponentStudent = opponentStudents.value.find((s: any) => {
      const normalizedStudentName = s.name.trim().replace(/\s/g, "").toLowerCase();
      return normalizedStudentName === normalizedInputName;
    });
    
    if (!opponentStudent) {
      message.warning('未找到该对手学生，请确认姓名是否正确');
      return;
    }

    const opponentStudentId = opponentStudent.uid;
  
    // 调用后端接口
    const response = await fetch(
      `/api/analysis/compare_with_student?student_id=${currentStudentId}&compare_student_id=${opponentStudentId}&selected_exam_id=${selectedExamId}`
    );
    const res = await response.json();
    if (res.code === 200) {
      currentStudentData.value = res.data.current_student;
      compareStudentData.value = res.data.compare_student;
      resultData.value = res.data.result;
      showComparisonTable.value = true;
    } else {
      message.error(res.msg || '对比失败');
    }
  } catch (error) {
    message.error('请求失败，请重试');
    console.error('请求失败', error);
  }
};

onMounted(() => {
  fetchExamList();
  fetchOpponentClasses();
});
</script>

<style scoped>
.student-challenge-page {
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
  background-color: #ccc;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10;
}

h2 {
  text-align: center;
  margin-top: 10px;
  margin-bottom: 20px;
}

.filter-input-container {
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
}

.input-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.input-row:last-child {
  border-bottom: none;
}

.label {
  width: 80px;
  flex-shrink: 0;
  color: #555;
}

.opponent-inputs {
  display: flex;
  gap: 20px;
  flex-grow: 1;
  align-items: center;
}

.input-select,
.input-text {
  padding: 5px 10px;
  border: none;
  font-size: 1em;
  outline: none;
  text-align: center;
}

.arrow {
  margin-left: 10px;
  color: #999;
  flex-shrink: 0;
}

.description {
  margin-bottom: 10px;
  font-size: 0.9em;
  color: #555;
}

.compare-button {
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

.comparison-table-container {
  margin-top: 30px;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th,
.results-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
  white-space: nowrap;
}

.results-table th {
  background-color: #f2f2f2;
}

.results-table .red {
  color: red;
}

.results-table .green {
  color: green;
}

:deep(.arrow) {
  display: none;
}
</style>

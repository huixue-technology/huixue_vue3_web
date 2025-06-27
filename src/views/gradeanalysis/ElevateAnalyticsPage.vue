<template>
  <div class="elevate-analytics-page">
    <button class="back-button" @click="goBack">返回</button>
    <h2>进退步对比</h2> <!-- Title based on the image -->

    <!-- Filter/Info Area -->
    <div class="info-filter-container">
      <div class="filter-row">
        <div class="filter-item">
          <span class="label">考试</span>
          <select class="filter-select" v-model="currentExamId">
            <option value="">请选择考试</option>
            <option v-for="exam in examList" :key="exam.id" :value="exam.id">
              {{ exam.name }}
            </option>
          </select>
        </div>
      </div>

      <p class="description">
        说明：需要有两场考试成绩才能进行对比，默认基准考试选择上一次考试，对比本学期所有考试成绩，您也可以选择其他基准考试，其他学期进行学生成绩对比。
      </p>

      <p class="description">说明：第一列为基准考试段次，后续列数红色表较基准考试退步的段次名次，绿色表明较基准进步的段次名次。</p>
    </div>

    <!-- Results Table Area -->
    <div class="table-container">
      <table class="results-table">
        <thead>
          <tr>
            <th>学科/考试</th>
            <th>{{ currentExamName }}</th>
            <th v-for="header in compareExamHeaders" :key="header">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="subject in currentSubjects" :key="subject">
            <td>{{ subject }}</td>
            <td>{{ baseExamScore[subject] }}</td>
            <td v-for="(diff, i) in compareExamDiffs" :key="i">
              <span :class="{ red: diff[subject] < 0, green: diff[subject] > 0 }">
                {{ diff[subject] > 0 ? '+' : '' }}{{ diff[subject] }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

import { getPassLine, getUpDownDetailAnalysis } from '@/servers/api/analysis'
import { getGradeApi } from '@/servers/api/grade';
import { getStudentExamApi } from '@/servers/api/student';
import { ref, onMounted, computed, watch } from 'vue';
import { Button as AButton, Table as ATable, Card as ACard } from 'ant-design-vue';
import type { ColumnType } from 'ant-design-vue/es/table';
import VChart from 'vue-echarts';
import { useUserStore } from '@/store';
import api from '@/servers/api';

const userStore = useUserStore();

console.log('User store info at component setup:', userStore.userInfo);
const messageReturn = ref<any[]>([])
// 5. 获取班级、学期、学生
onMounted(async () => {
  // 从localStorage中获取用户信息
  const userString = localStorage.getItem('user');
  if (!userString) {
    console.error('localStorage中没有找到用户信息。');
    messageReturn.value = [];
    return;
  }
  let userInfo: any;
  try {
    userInfo = JSON.parse(userString);
  } catch (e) {
    console.error('解析用户信息失败:', e);
    messageReturn.value = [];
    return;
  }

  if (!userInfo || !userInfo.role) {
    console.error('用户信息不完整或角色ID缺失。', userInfo);
    messageReturn.value = [];
    return;
  }

  const studentId = parseInt(userInfo.role);
  if (isNaN(studentId)) {
    console.error('学生ID无效:', userInfo.role);
    messageReturn.value = [];
    return;
  }

  // 查询学生近几次考试的成绩
  try {
    console.log('调用 getUpDownDetailAnalysis, student_id:', studentId);
    const recent_result = await getUpDownDetailAnalysis({'student_id':studentId,'nums':9999})
    console.log('getUpDownDetailAnalysis 响应:', recent_result);

    if (!recent_result || !recent_result.data) {
      console.warn('getUpDownDetailAnalysis did not return any data or returned null/undefined.');
      messageReturn.value = []; // Initialize to empty array if no data
      return;
    }
    messageReturn.value = recent_result.data;
    //generateTable(recent_result.data,fieldMappingScore);
  } catch (error) {
    console.error('获取学生近期考试成绩失败:', error);
    messageReturn.value = []; // Ensure messageReturn is empty on error
  }
})
interface Exam {
    id:string,
    name:string
}

const examList = ref<Exam[]>([])
const currentExamId = ref<string>()
onMounted(() => {


    if (!userStore.isLogin) {
        router.push('/user/login');
        return
    }

    const userInfo = userStore.getUserInfo();
    

    getStudentExamApi({student_uid:userInfo.role},[]).then(res => {
        examList.value = res.data.map((item: Exam[]) => ({
            id: item[0].id,
            name: item[0].name
        }));
        
        // 默认选择第一个考试
        currentExamId.value = examList.value[0].id;
        // 获取考试成绩
        getGradeApi({student_id:userInfo.role,exam_id:parseInt(currentExamId.value)}).then(res => {
            const gradeData = res.data[0];
            handleGradeDetail(gradeData)
        })
    })
})

const selectedExamScore = ref<Record<string, number>>({});
const allExamScores = ref<any[]>([]); // 保存所有考试成绩

const baseSubjects = ['总分', '语文', '数学', '外语'];
const scienceSubjects = ['物理', '化学', '生物'];
const artsSubjects = ['政治', '历史', '地理'];
const subjectFieldMap: Record<string, string> = {
  '总分': 'sum_',
  '语文': 'Yuwen',
  '数学': 'Shuxue',
  '外语': 'Yingyu',
  '物理': 'Wuli',
  '化学': 'Huaxue',
  '生物': 'Shengwu',
  '政治': 'Zhengzhi',
  '历史': 'Lishi',
  '地理': 'Dili'
};
const currentSubjects = ref<string[]>(baseSubjects);

function handleGradeDetail(gradeData: any) {
  // 判断文理科
  if (gradeData.Wuli != null || gradeData.Huaxue != null || gradeData.Shengwu != null) {
    currentSubjects.value = [...baseSubjects, ...scienceSubjects];
  } else if (gradeData.Zhengzhi != null || gradeData.Lishi != null || gradeData.Dili != null) {
    currentSubjects.value = [...baseSubjects, ...artsSubjects];
  } else {
    currentSubjects.value = baseSubjects;
  }
  selectedExamScore.value = {};
  currentSubjects.value.forEach(sub => {
    const field = subjectFieldMap[sub];
    selectedExamScore.value[sub] = gradeData[field] ?? 0;
  });
}

// 获取所有考试成绩
function fetchAllExamScores(studentId: number) {
  const promises = examList.value.map(exam =>
    getGradeApi({ student_id: studentId, exam_id: parseInt(exam.id) })
      .then(res => ({ examId: Number(exam.id), examName: exam.name, grade: res.data[0] }))
  );
  Promise.all(promises).then(results => {
    allExamScores.value = results;
  });
}

// 监听考试列表和登录状态，拉取所有考试成绩
watch([examList, userStore], ([newExamList, newUserStore]) => {
  if (examList.value.length && userStore.isLogin) {
    const userInfo = userStore.getUserInfo();
    fetchAllExamScores(Number(userInfo.role));
  }
}, { immediate: true });

const compareExamHeaders = computed(() => {
  return allExamScores.value.filter(e => e.examId !== Number(currentExamId.value)).map(e => e.examName);
});
const compareExamDiffs = computed(() => {
  const base = allExamScores.value.find(e => e.examId === Number(currentExamId.value))?.grade || {};
  return allExamScores.value.filter(e => e.examId !== Number(currentExamId.value)).map(e => {
    const diff: Record<string, number> = {};
    currentSubjects.value.forEach(sub => {
      const field = subjectFieldMap[sub];
      diff[sub] = (e.grade?.[field] ?? 0) - (base?.[field] ?? 0);
    });
    return diff;
  });
});
const baseExamScore = computed(() => {
  const base = allExamScores.value.find(e => e.examId === Number(currentExamId.value))?.grade || {};
  const result: Record<string, number> = {};
  currentSubjects.value.forEach(sub => {
    const field = subjectFieldMap[sub];
    result[sub] = base?.[field] ?? 0;
  });
  return result;
});

const goBack = () => {
  // Assuming the previous page is analysis page, adjust if needed
  router.push('/analysis');
};

const currentExamName = computed(() => {
  const exam = examList.value.find(e => e.id === currentExamId.value);
  return exam ? exam.name : '';
});

const allExamScoresMap = computed(() => {
  // 以 currentSubjects 为主，生成每场考试每科的分数
  return allExamScores.value.map(e => {
    const row: Record<string, number> = {};
    currentSubjects.value.forEach(sub => {
      const field = subjectFieldMap[sub];
      row[sub] = e.grade?.[field] ?? 0;
    });
    return {
      examId: e.examId,
      examName: e.examName,
      scores: row
    };
  });
});
</script>

<style scoped>
.elevate-analytics-page {
  padding: 20px;
  position: relative;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  font-family: sans-serif; /* Using a common sans-serif font */
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

h2 {
    text-align: center; /* Center the main title */
  margin-top: 10px; /* Adjust margin to not overlap with back button */
  margin-bottom: 20px;
}

.info-filter-container {
    margin-bottom: 20px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px; /* Space between filter items */
  margin-bottom: 15px;
  align-items: center;
  justify-content: center; /* 水平居中 */
}

.filter-item {
  display: flex;
  align-items: center;
}

.filter-item .label {
  margin-right: 5px;
  color: #555;
}

.filter-item .value {
  /* Removed styles for simulated div value */
}

.filter-select {
    padding: 5px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em; /* Match font size */
}

.filter-item .arrow {
  /* Removed as arrow is not needed for select tag */
}

.description {
  margin-bottom: 10px;
  font-size: 0.9em;
  color: #555;
}

.info-text {
  color: #17a2b8;
  display: flex;
  align-items: center;
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
  flex-shrink: 0; /* Prevent icon from shrinking */
}

.table-container {
  width: 100%;
  overflow-x: auto; /* Add horizontal scrolling for the table */
  margin-top: 20px;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th,
.results-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center; /* Center text in table cells */
  white-space: nowrap; /* Prevent text wrapping in table cells */
}

.results-table th {
  background-color: #f2f2f2;
  text-align: center; /* Center text in header cells */
}

.results-table .red {
  color: red;
}

.results-table .green {
  color: green;
}
</style> 
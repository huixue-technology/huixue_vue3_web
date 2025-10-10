<template>
  <div class="rank-details-page">
    <h2 class="page-title">名次详情</h2>

    <!-- Filter/Info Area -->
    <div class="info-display-container">
      <div class="display-item">
        <span class="label">班级</span>
        <select v-model="selectedClass" class="value-select">
          <option v-for="cls in classes" :key="cls" :value="cls">{{ cls }}</option>
        </select>
      </div>
      <div class="display-item">
        <span class="label">学期</span>
        <select v-model="selectedSemester" class="value-select">
          <option v-for="semester in semesters" :key="semester" :value="semester">{{ semester }}</option>
        </select>
      </div>
      <div class="display-item">
        <span class="label">考试</span>
        <select v-model="selectedExam" class="value-select">
          <option v-for="exam in exams" :key="exam" :value="exam">{{ exam }}</option>
        </select>
      </div>
      <div class="display-item">
        <span class="label">姓名</span>
        <input type="text" v-model="studentName" class="value-input" placeholder="请输入姓名" />
      </div>

      <p class="description red-text">
        说明：成绩展示为班级前三名和以本学生为基准前后各10位同学的成绩。
      </p>

      <button class="query-button" @click="queryRankDetails">查询</button>

      <p class="info-hint">
        <span class="info-icon">i</span> 表格可向左滑动查看信息
      </p>
    </div>

    <!-- Rank Details Table -->
    <div class="table-container" v-if="showRankDetailsTable">
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
            <th>历史</th>
            <th>历史班次</th>
            <th>历史段次</th>
            <th>政治</th>
            <th>政治班次</th>
            <th>政治段次</th>
            <th>地理</th>
            <th>地理班次</th>
            <th>地理段次</th>
          </tr>
        </thead>
        <tbody>
          <tr :class="{ 'highlight-row': student.name === '刘艺飞', 'third-place-divider': index === 2 }" v-for="(student, index) in displayedStudents" :key="student.name">
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
            <td>{{ student.historyScore }}</td>
            <td>{{ student.historyClassRank }}</td>
            <td>{{ student.historyOverallRank }}</td>
            <td>{{ student.politicsScore }}</td>
            <td>{{ student.politicsClassRank }}</td>
            <td>{{ student.politicsOverallRank }}</td>
            <td>{{ student.geographyScore }}</td>
            <td>{{ student.geographyClassRank }}</td>
            <td>{{ student.geographyOverallRank }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, computed } from 'vue';

const router = useRouter();

const showRankDetailsTable = ref(false);

// Form data
const selectedClass = ref('高三 2238');
const classes = ref(['高三 2238', '高三 2239', '高三 2240']);

const selectedSemester = ref('本学期');
const semesters = ref(['本学期', '上学期', '下学期']);

const selectedExam = ref('5.22周考');
const exams = ref(['5.22周考', '期中考试', '期末考试']);

const studentName = ref('刘艺飞');

// Sample data for top 3 students (replace with actual data)
const topStudents = ref([
  { name: '**飞', totalScore: 454, classRank: 68, overallRank: 392, chineseScore: 100, chineseClassRank: 10, chineseOverallRank: 200, mathScore: 100, mathClassRank: 10, mathOverallRank: 200, englishScore: 100, englishClassRank: 10, englishOverallRank: 200, historyScore: 100, historyClassRank: 10, historyOverallRank: 200, politicsScore: 100, politicsClassRank: 10, politicsOverallRank: 200, geographyScore: 100, geographyClassRank: 10, geographyOverallRank: 200 },
  { name: '**秀', totalScore: 450, classRank: 69, overallRank: 399, chineseScore: 100, chineseClassRank: 10, chineseOverallRank: 200, mathScore: 100, mathClassRank: 10, mathOverallRank: 200, englishScore: 100, englishClassRank: 10, englishOverallRank: 200, historyScore: 100, historyClassRank: 10, historyOverallRank: 200, politicsScore: 100, politicsClassRank: 10, politicsOverallRank: 200, geographyScore: 100, geographyClassRank: 10, geographyOverallRank: 200 },
  { name: '*睿', totalScore: 447, classRank: 70, overallRank: 405, chineseScore: 100, chineseClassRank: 10, chineseOverallRank: 200, mathScore: 100, mathClassRank: 10, mathOverallRank: 200, englishScore: 100, englishClassRank: 10, englishOverallRank: 200, historyScore: 100, historyClassRank: 10, historyOverallRank: 200, politicsScore: 100, politicsClassRank: 10, politicsOverallRank: 200, geographyScore: 100, geographyClassRank: 10, geographyOverallRank: 200 },
]);

// Sample data for surrounding students (replace with actual data)
const surroundingStudents = ref([
  { name: '**前10', totalScore: 435, classRank: 62, overallRank: 380, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**前9', totalScore: 433, classRank: 63, overallRank: 385, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**前8', totalScore: 431, classRank: 64, overallRank: 390, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**前7', totalScore: 429, classRank: 65, overallRank: 395, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**前6', totalScore: 427, classRank: 66, overallRank: 400, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**前5', totalScore: 425, classRank: 67, overallRank: 405, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**前4', totalScore: 423, classRank: 68, overallRank: 410, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**前3', totalScore: 421, classRank: 69, overallRank: 415, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**前2', totalScore: 419, classRank: 70, overallRank: 420, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**前1', totalScore: 417, classRank: 71, overallRank: 425, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '刘艺飞', totalScore: 429, classRank: 72, overallRank: 428, chineseScore: 111, chineseClassRank: 11, chineseOverallRank: 111, mathScore: 45, mathClassRank: 4, mathOverallRank: 45, englishScore: 98, englishClassRank: 9, englishOverallRank: 98, historyScore: 65, historyClassRank: 6, historyOverallRank: 65, politicsScore: 57, politicsClassRank: 5, politicsOverallRank: 57, geographyScore: 53, geographyClassRank: 5, geographyOverallRank: 53 },
  { name: '**后1', totalScore: 408, classRank: 73, overallRank: 430, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**后2', totalScore: 406, classRank: 74, overallRank: 435, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**后3', totalScore: 404, classRank: 75, overallRank: 440, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**后4', totalScore: 402, classRank: 76, overallRank: 445, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**后5', totalScore: 400, classRank: 77, overallRank: 450, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**后6', totalScore: 398, classRank: 78, overallRank: 455, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**后7', totalScore: 396, classRank: 79, overallRank: 460, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**后8', totalScore: 394, classRank: 80, overallRank: 465, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**后9', totalScore: 392, classRank: 81, overallRank: 470, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
  { name: '**后10', totalScore: 390, classRank: 82, overallRank: 475, chineseScore: 90, chineseClassRank: 9, chineseOverallRank: 190, mathScore: 90, mathClassRank: 9, mathOverallRank: 190, englishScore: 90, englishClassRank: 9, englishOverallRank: 190, historyScore: 90, historyClassRank: 9, historyOverallRank: 190, politicsScore: 90, politicsClassRank: 9, politicsOverallRank: 190, geographyScore: 90, geographyClassRank: 9, geographyOverallRank: 190 },
]);

const queryRankDetails = () => {
  // In a real application, you would fetch data based on selected filters here
  // For now, just show the table
  showRankDetailsTable.value = true;

  // In a real application, you'd filter/fetch topStudents and surroundingStudents
  // based on selectedClass, selectedSemester, selectedExam, and studentName.
  // For this example, we'll just demonstrate the `displayedStudents` logic.
};

const displayedStudents = computed(() => {
  const finalOrderedList = [];
  const addedStudents = new Set(); // To keep track of added student names for deduplication

  // 1. Add top 3 students (班次第1-3名)
  topStudents.value.forEach(student => {
    if (!addedStudents.has(student.name)) {
      finalOrderedList.push(student);
      addedStudents.add(student.name);
    }
  });

  let liuYiFeiIndex = -1;
  // Find the index of the student with the current 'studentName' from the input
  for (let i = 0; i < surroundingStudents.value.length; i++) {
    if (surroundingStudents.value[i].name === studentName.value) {
      liuYiFeiIndex = i;
      break;
    }
  }

  // 2. Add students before '刘艺飞' (前10-1名)
  if (liuYiFeiIndex !== -1) {
    for (let i = Math.max(0, liuYiFeiIndex - 10); i < liuYiFeiIndex; i++) {
      const student = surroundingStudents.value[i];
      if (!addedStudents.has(student.name)) {
        finalOrderedList.push(student);
        addedStudents.add(student.name);
      }
    }

    // 3. Add '刘艺飞' (该学生)
    const liuYiFeiStudent = surroundingStudents.value[liuYiFeiIndex];
    if (!addedStudents.has(liuYiFeiStudent.name)) {
      finalOrderedList.push(liuYiFeiStudent);
      addedStudents.add(liuYiFeiStudent.name);
    }

    // 4. Add students after '刘艺飞' (后1-10名)
    for (let i = liuYiFeiIndex + 1; i < Math.min(surroundingStudents.value.length, liuYiFeiIndex + 11); i++) {
      const student = surroundingStudents.value[i];
      if (!addedStudents.has(student.name)) {
        finalOrderedList.push(student);
        addedStudents.add(student.name);
      }
    }
  }

  return finalOrderedList;
});
</script>

<style scoped>
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
  overflow-x: auto; /* Enable horizontal scrolling for the table */
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
  text-align: center; /* Center text in table cells */
  white-space: nowrap; /* Prevent text wrapping in table cells */
}

.rank-details-table th {
  background-color: #f2f2f2;
}

.highlight-row {
  background-color: #e0f7fa; /* Light blue highlight for the current student */
}

.third-place-divider {
  border-bottom: 2px solid red; /* Red underline for the third place */
}
</style> 
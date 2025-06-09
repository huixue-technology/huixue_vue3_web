<template>
  <div class="grade-simulation-page">
    <div class="header">
        <button class="back-button" @click="goBack">返回</button>
      <h2>成绩模拟</h2>
    </div>

    <div class="filter-section">
      <div class="filter-item">
        <label>班级:</label>
        <select v-model="selectedClass" class="input-select">
          <option value="">请选择班级</option>
          <option value="高一">高一</option>
          <option value="高二">高二</option>
          <option value="高三">高三</option>
          <option value="2238班">2238班</option>
        </select>
      </div>
      <div class="filter-item">
        <label>学期:</label>
        <select v-model="selectedSemester" class="input-select">
          <option value="">请选择学期</option>
          <option value="本学期">本学期</option>
          <option value="上学期">上学期</option>
        </select>
      </div>
      <div class="filter-item">
        <label>考试:</label>
        <select v-model="selectedExam" class="input-select">
          <option value="">请选择考试</option>
          <option value="5.22周考">5.22周考</option>
          <option value="期中考试">期中考试</option>
          <option value="期末考试">期末考试</option>
        </select>
      </div>
      <div class="filter-item">
        <label>姓名:</label>
        <select v-model="selectedName" class="input-select">
          <option value="">请选择姓名</option>
          <option value="刘艺飞">刘艺飞</option>
        </select>
      </div>
      <p class="description red-text">
        说明：点击铅笔符号修改分数，点击复位按钮将所有科目改为原成绩
      </p>
      <button @click="queryData" class="query-button">查询</button>
    </div>

    <div v-if="showTable" class="score-table-section">
      <div class="table-title">5.22周考</div>
      <table class="score-table">
        <thead>
          <tr>
            <th>科目</th>
            <th>成绩</th>
            <th>班次</th>
            <th>段次</th>
            <th>班级最高分</th>
            <th>一本线</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in originalScores" :key="index">
            <td>{{ item.subject }}</td>
            <td>{{ item.score }}</td>
            <td>{{ item.classRank }}</td>
            <td>{{ item.gradeRank }}</td>
            <td>{{ item.classHighest }}</td>
            <td>{{ item.firstLine }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Second Table for Simulation -->
      <div class="table-title">5.22周考模拟</div>
      <table class="score-table">
        <thead>
          <tr>
            <th>科目</th>
            <th>成绩</th>
            <th>班次</th>
            <th>段次</th>
            <th>班级最高分</th>
            <th>一本线</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in simulatedScores" :key="index">
            <td>{{ item.subject }} <span v-if="item.subject !== '总分'" class="edit-icon" @click="startEdit(index)">✏️</span></td>
            <td>
              <template v-if="editingIndex === index">
                <input 
                  type="number" 
                  v-model.number="editingScore" 
                  @blur="finishEdit(index)"
                  @keyup.enter="finishEdit(index)"
                  class="score-input"
                />
              </template>
              <template v-else>
                {{ item.score }}
              </template>
            </td>
            <td>{{ item.classRank }}</td>
            <td>{{ item.gradeRank }}</td>
            <td>{{ item.classHighest }}</td>
            <td>{{ item.firstLine }}</td>
          </tr>
        </tbody>
      </table>
      <button @click="resetScores" class="reset-button">复位</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

interface ScoreItem {
  subject: string;
  score: number;
  classRank: number;
  gradeRank: number;
  classHighest: number;
  firstLine: number;
}

const router = useRouter();

const selectedClass = ref<string>('');
const selectedSemester = ref<string>('');
const selectedExam = ref<string>('');
const selectedName = ref<string>('');
const showTable = ref<boolean>(false);
const editingIndex = ref<number>(-1);
const editingScore = ref<number>(0);

// 原始成绩数据
const originalScores = ref<ScoreItem[]>([
  { subject: '总分', score: 429.0, classRank: 72, gradeRank: 428, classHighest: 593, firstLine: 500 },
  { subject: '语文', score: 111.0, classRank: 65, gradeRank: 358, classHighest: 128, firstLine: 116 },
  { subject: '数学', score: 45.0, classRank: 67, gradeRank: 419, classHighest: 101, firstLine: 62 },
  { subject: '外语', score: 98.0, classRank: 63, gradeRank: 385, classHighest: 139, firstLine: 113 },
  { subject: '历史', score: 65.0, classRank: 74, gradeRank: 375, classHighest: 83, firstLine: 71 },
  { subject: '政治', score: 57.0, classRank: 76, gradeRank: 469, classHighest: 88, firstLine: 76 },
  { subject: '地理', score: 53.0, classRank: 70, gradeRank: 332, classHighest: 82, firstLine: 65 }
]);

// 模拟成绩数据（深拷贝原始数据）
const simulatedScores = ref<ScoreItem[]>(JSON.parse(JSON.stringify(originalScores.value)));

// 开始编辑成绩
const startEdit = (index: number): void => {
  if (simulatedScores.value[index].subject === '总分') return;
  editingIndex.value = index;
  editingScore.value = simulatedScores.value[index].score;
};

// 完成编辑成绩
const finishEdit = (index: number): void => {
  if (editingIndex.value === -1) return;
  
  // 更新成绩
  simulatedScores.value[index].score = editingScore.value;
  
  // 计算新的班次和段次（这里使用简单的线性关系模拟）
  const score = editingScore.value;
  const classHighest = simulatedScores.value[index].classHighest;
  const firstLine = simulatedScores.value[index].firstLine;
  
  // 计算新的班次（假设是线性关系）
  simulatedScores.value[index].classRank = Math.round(
    (classHighest - score) / (classHighest - firstLine) * 100
  );
  
  // 计算新的段次（假设是线性关系）
  simulatedScores.value[index].gradeRank = Math.round(
    (classHighest - score) / (classHighest - firstLine) * 500
  );
  
  // 更新总分
  updateTotalScore();
  
  editingIndex.value = -1;
};

// 更新总分
const updateTotalScore = (): void => {
  const totalScore = simulatedScores.value
    .filter((item: ScoreItem) => item.subject !== '总分')
    .reduce((sum: number, item: ScoreItem) => sum + item.score, 0);
  
  simulatedScores.value[0].score = totalScore;
  
  // 更新总分的班次和段次
  const classHighest = simulatedScores.value[0].classHighest;
  const firstLine = simulatedScores.value[0].firstLine;
  
  simulatedScores.value[0].classRank = Math.round(
    (classHighest - totalScore) / (classHighest - firstLine) * 100
  );
  
  simulatedScores.value[0].gradeRank = Math.round(
    (classHighest - totalScore) / (classHighest - firstLine) * 500
  );
};

// 复位功能
const resetScores = (): void => {
  simulatedScores.value = JSON.parse(JSON.stringify(originalScores.value));
};

const queryData = (): void => {
  showTable.value = true;
};

const goBack = (): void => {
  router.push('/analysis');
};
</script>

<style scoped>
.grade-simulation-page {
  padding: 20px;
  background-color: #f5f5f5;
  height: 100vh;
  overflow-y: auto;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-button {
  background-color: #ccc;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  margin-right: 20px;
}

.back-button:hover {
  background-color: #ccc;
}

h2 {
  color: #333;
  margin: 0;
}

.filter-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-item label {
  font-weight: bold;
  color: #555;
  width: 60px; /* Adjust as needed */
  text-align: right;
}

.description {
  grid-column: 1 / -1; /* Span across all columns */
  font-size: 0.9em;
  margin-top: 10px;
  margin-bottom: 10px;
  text-align: center;
}

.red-text {
  color: red;
}

.input-select {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  text-align: center; /* 居中处理 */
}

.query-button {
  grid-column: 1 / -1; /* Span across all columns */
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

.query-button:hover {
  background-color: #0056b3;
}

.score-table-section {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  width: 100%;
}

.table-title {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.score-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.score-table th, .score-table td {
  border: 1px solid #eee;
  padding: 10px;
  text-align: left;
}

.score-table th {
  background-color: #f2f2f2;
  font-weight: bold;
  color: #333;
  text-align: center; /* 确保表头居中 */
}

.edit-icon {
  cursor: pointer;
  margin-left: 5px;
  font-size: 0.9em;
  color: #007bff;
  user-select: none;
}

.edit-icon:hover {
  color: #0056b3;
}

.score-input {
  width: 60px;
  padding: 4px;
  border: 1px solid #007bff;
  border-radius: 4px;
  text-align: center;
}

.reset-button {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.reset-button:hover {
  background-color: #c82333;
}
</style> 
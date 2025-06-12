<template>
  <div class="student-challenge-page">
    <button class="back-button" @click="goBack">返回</button>
    <h2>学生挑战</h2>

    <!-- Filter/Input Area -->
    <div class="filter-input-container">
      <div class="input-row">
        <span class="label">班级</span>
        <select class="input-select">
          <option value="">请选择班级</option>
          <option value="class1">高三 2238</option>
          <!-- Add more class options -->
        </select>
        <span class="arrow">></span>
      </div>
      <div class="input-row">
        <span class="label">考试</span>
        <select class="input-select">
          <option value="">请选择考试</option>
          <option value="exam1">5.22周考</option>
          <!-- Add more exam options -->
        </select>
        <span class="arrow">></span>
      </div>
      <div class="input-row">
        <span class="label">维度</span>
        <select class="input-select">
          <option value="">请选择维度</option>
          <option value="score">分数</option>
          <option value="rank">段次</option>
          <!-- Add more dimension options -->
        </select>
        <span class="arrow">></span>
      </div>
      <div class="input-row">
        <span class="label">姓名</span>
        <select class="input-select">
          <option value="">请选择姓名</option>
          <option value="student1">刘艺飞</option>
          <!-- Add more name options -->
        </select>
        <span class="arrow">></span>
      </div>
      <div class="input-row">
        <span class="label">对手</span>
        <div class="opponent-inputs">
          <select class="input-select opponent-year-select">
            <option value="">请选择年级</option>
            <option value="year1">高一</option>
            <option value="year2">高二</option>
            <option value="year3">高三</option>
            <!-- Add more year options -->
          </select>
          <select class="input-select opponent-class-select">
            <option value="">请选择班级</option>
            <option value="class1">2238</option>
            <option value="class2">2239</option>
            <!-- Add more opponent class options -->
          </select>
          <input type="text" class="input-text opponent-name-text" placeholder="请输入对手姓名">
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
            <th>刘艺飞 <!-- Replace with actual user name --></th>
            <th>张九允 <!-- Replace with actual opponent name --></th>
            <th>分差</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>总分</td><td>429</td><td>0</td><td class="green">429</td></tr>
          <tr><td>语文</td><td>111</td><td>0</td><td class="green">111</td></tr>
          <tr><td>数学</td><td>45</td><td>0</td><td class="green">45</td></tr>
          <tr><td>外语</td><td>98</td><td>0</td><td class="green">98</td></tr>
          <tr><td>历史/物理</td><td>65</td><td>0</td><td class="green">65</td></tr>
          <tr><td>政治/化学</td><td>57</td><td>0</td><td class="green">57</td></tr>
          <tr><td>地理/生物</td><td>53</td><td>0</td><td class="green">53</td></tr>
          <!-- Add rows for Physics, Chemistry, Biology if needed -->
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const router = useRouter();

const goBack = () => {
  router.push('/analysis');
};

const showComparisonTable = ref(false);

const runComparison = () => {
  // In a real application, you would fetch data based on selected filters here
  // and update the table content.
  showComparisonTable.value = true; // For now, just show the table
};

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
  border: 1px solid #ccc; /* Add border based on image */
  border-radius: 4px;
  padding: 10px;
}

.input-row {
  display: flex;
  align-items: center;
  padding: 10px 0; /* Add padding between rows */
  border-bottom: 1px solid #eee; /* Add separator line */
}

.input-row:last-child {
    border-bottom: none; /* Remove border for the last row */
}

.label {
  width: 80px; /* Fixed width for labels */
  flex-shrink: 0;
  color: #555;
}

.opponent-inputs {
  display: flex; /* Use flexbox to align inputs */
  gap: 20px; /* Space between the inputs */
  flex-grow: 1;
  align-items: center;
}

.input-select, .input-text {
  padding: 5px 10px;
  border: none; /* Remove default input/select border */
  font-size: 1em;
  outline: none; /* Remove outline on focus */
  text-align: center; /* Center text in select and input */
}

.opponent-year-select, .opponent-class-select {
    flex-shrink: 0; /* Prevent year/class selects from growing */
    width: 100px; /* Give year/class selects a fixed width, adjust as needed */
}

.opponent-name-text {
  flex-grow: 1; /* Allow name input to take available space */
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
  display: block; /* Make the button a block element */
  width: 80%; /* Set a width */
  margin: 20px auto; /* Center the button */
  padding: 10px 30px;
  background: linear-gradient(to bottom, #007bff, #0056b3);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1em;
}

.comparison-table-container {
  margin-top: 30px; /* Space above the table */
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
</style> 
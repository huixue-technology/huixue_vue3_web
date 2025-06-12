<template>
  <div class="elevate-analytics-page">
    <button class="back-button" @click="goBack">返回</button>
    <h2>一本能力值</h2> <!-- Title based on the image -->

    <!-- Filter/Info Area -->
    <div class="info-filter-container">
      <div class="filter-row">
        <div class="filter-item">
          <span class="label">班级</span>
          <select class="filter-select">
            <option value="">请选择班级</option>
            <option value="class1">高三 2238</option>
            <option value="class2">高三 2239</option>
            <!-- Add more class options as needed -->
          </select>
        </div>
        <div class="filter-item">
          <span class="label">学期</span>
          <select class="filter-select">
            <option value="">请选择学期</option>
            <option value="current">本学期</option>
            <option value="previous">上学期</option>
            <!-- Add more semester options as needed -->
          </select>
        </div>
        <div class="filter-item">
          <span class="label">考试</span>
          <select class="filter-select">
            <option value="">请选择考试</option>
            <option value="exam1">5.28周考</option>
            <option value="exam2">5.26湘豫联考</option>
            <option value="exam3">5.24周考</option>
            <!-- Add more exam options as needed -->
          </select>
        </div>
        <div class="filter-item">
          <span class="label">姓名</span>
          <select class="filter-select">
            <option value="">请选择姓名</option>
            <option value="student1">刘艺飞</option>
            <option value="student2">其他学生</option>
            <!-- Add more student options as needed -->
          </select>
        </div>
      </div>

      <p class="description">
        说明：需要有两场考试成绩才能进行对比，默认基准考试选择上一次考试，对比本学期所有考试成绩，您也可以选择其他基准考试，其他学期进行学生成绩对比。
      </p>

      <button class="compare-button">对比</button>

      <p class="description">说明：第一列为基准考试段次，后续列数红色表较基准考试退步的段次名次，绿色表明较基准进步的段次名次。</p>
    </div>

    <!-- Results Table Area -->
    <div class="table-container">
      <table class="results-table">
        <thead>
          <tr>
            <th>学科/考试</th>
            <th>5.28周考</th>
            <th>5.26湘豫联考</th>
            <th>5.24周考</th>
            <th>5.22周考</th>
            <!-- More exam columns as needed -->
          </tr>
        </thead>
        <tbody>
          <tr><td>总分</td><td>376</td><td class="red">-10</td><td class="red">-57</td><td class="red">-52</td></tr>
          <tr><td>语文</td><td>373</td><td class="green">153</td><td class="red">-15</td><td class="green">15</td></tr>
          <tr><td>数学</td><td>413</td><td class="green">10</td><td class="red">-9</td><td class="red">-6</td></tr>
          <tr><td>外语</td><td>188</td><td class="green">181</td><td class="red">-221</td><td class="red">-197</td></tr>
          <tr><td>历史</td><td>279</td><td class="red">-67</td><td class="green">102</td><td class="red">-96</td></tr>
          <tr><td>政治</td><td>419</td><td class="green">36</td><td class="red">-36</td><td class="red">-50</td></tr>
          <tr><td>地理</td><td>318</td><td class="green">78</td><td class="green">33</td><td class="red">-14</td></tr>
          <!-- Add rows for other subjects if needed -->
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  // Assuming the previous page is analysis page, adjust if needed
  router.push('/analysis');
};
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

.compare-button {
  padding: 10px 30px; /* Larger padding for a more prominent button */
  background: linear-gradient(to bottom, #007bff, #0056b3); /* Gradient background */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1em;
  margin-bottom: 20px; /* Space below the button */
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
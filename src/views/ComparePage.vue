<template>
  <div class="compare-page">
    <button class="back-button" @click="goBack">返回</button>
    <h2>进退对比</h2>

    <!-- 筛选条件区域 -->
    <div class="filter-container">
      <div class="filter-item">
        <span>班级:</span>
        <select><!-- Dropdown for Class --></select>
      </div>
      <div class="filter-item">
        <span>学期:</span>
        <select><!-- Dropdown for Semester --></select>
      </div>
      <div class="filter-item">
        <span>考试:</span>
        <select><!-- Dropdown for Exam --></select>
      </div>
      <div class="filter-item">
        <span>姓名:</span>
        <select><!-- Dropdown for Name --></select>
      </div>
      <button class="compare-button">对比</button>
    </div>

    <!-- 说明文字 -->
    <p class="description">
      说明：需要有两场考试成绩才能进行对比，默认基准考试选择上一次考试，对比本学期所有考试成绩，您也可以选择其他基准考试，其他学期进行学生成绩对比。
    </p>
    <p class="description info-text">
      <span class="info-icon">i</span> 说明：第一列为基准考试段次，后续列数红色表较基准考试退步的段次名次，绿色表明较基准进步的段次名次。
    </p>

    <!-- 成绩对比表格区域 -->
    <div class="table-container">
      <table class="compare-table">
        <thead>
          <tr>
            <th>学科/考试</th>
            <th>5.28周考</th>
            <th>5.26湘豫联考</th>
            <th>5.24周考</th>
            <th>5.22周考</th>
            <!-- Add more exam columns as needed -->
          </tr>
        </thead>
        <tbody>
          <tr><td>总分</td><td>376</td><td style="color: red;">-10</td><td style="color: red;">-57</td><td style="color: red;">-52</td></tr>
          <tr><td>语文</td><td>373</td><td style="color: green;">153</td><td style="color: red;">-15</td><td style="color: green;">15</td></tr>
          <tr><td>数学</td><td>413</td><td style="color: green;">10</td><td style="color: red;">-9</td><td style="color: red;">-6</td></tr>
          <tr><td>外语</td><td>188</td><td style="color: green;">181</td><td style="color: red;">-221</td><td style="color: red;">-197</td></tr>
          <tr><td>历史</td><td>279</td><td style="color: red;">-67</td><td style="color: green;">102</td><td style="color: red;">-96</td></tr>
          <tr><td>政治</td><td>419</td><td style="color: green;">36</td><td style="color: red;">-36</td><td style="color: red;">-50</td></tr>
          <tr><td>地理</td><td>318</td><td style="color: green;">78</td><td style="color: green;">33</td><td style="color: red;">-14</td></tr>
          <!-- Add rows for Physics, Chemistry, Biology if needed -->
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  router.push('/analysis');
};
</script>

<style scoped>
.compare-page {
  padding: 20px;
  position: relative;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
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
  margin-top: 0;
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap; /* Allow items to wrap on smaller screens */
}

.filter-item span {
  margin-right: 5px;
}

.compare-button {
  padding: 8px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.description {
  margin-bottom: 10px;
  font-size: 0.9em;
  color: #555;
}

.info-text {
  color: #17a2b8;
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
}

.table-container {
  width: 100%;
  overflow-x: auto; /* Add horizontal scrolling */
  margin-top: 20px;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
}

.compare-table th,
.compare-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
  white-space: nowrap; /* Prevent text wrapping in table cells */
}

.compare-table th {
  background-color: #f2f2f2;
}
</style> 
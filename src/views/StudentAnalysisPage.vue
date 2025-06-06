<template>
  <div class="student-analysis-page">
    <button class="back-button" @click="goBack">返回</button>
    <h2>学生分析</h2>
    <div class="tables-container">
      <!-- 考试统计表格区域 -->
      <div class="table-section">
        <h2>考试统计 <span class="total-exams">共统计70场考试</span></h2>
        <p class="description">说明：一本率低于60%为<span style="color: red;">红色</span>，在60%到80%之间为<span style="color: orange;">橙色</span>。</p>
        <table class="analysis-table">
          <thead>
            <tr>
              <th>科目</th>
              <th>一本进线次数</th>
              <th>一本进线率</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>总分</td><td></td><td></td></tr>
            <tr><td>语文</td><td></td><td></td></tr>
            <tr><td>数学</td><td></td><td></td></tr>
            <tr><td>外语</td><td></td><td></td></tr>
            <tr><td>历史/物理</td><td></td><td></td></tr>
            <tr><td>政治/化学</td><td></td><td></td></tr>
            <tr><td>地理/生物</td><td></td><td></td></tr>
          </tbody>
        </table>
      </div>

      <!-- 本次考试表格区域 -->
      <div class="table-section">
        <h2>本次考试 <span class="exam-date">5.28周考</span></h2>
        <p class="description">说明：<span style="color: red;">红色</span>表明较上次考试退步的名次，<span style="color: green;">绿色</span>表明较上次考试进步的名次。</p>
        <table class="analysis-table">
          <thead>
            <tr>
              <th>科目</th>
              <th>进退班次</th>
              <th>进退段次</th>
              <th>是否过线</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>总分</td><td></td><td></td><td></td></tr>
            <tr><td>语文</td><td></td><td></td><td></td></tr>
            <tr><td>数学</td><td></td><td></td><td></td></tr>
            <tr><td>外语</td><td></td><td></td><td></td></tr>
            <tr><td>历史/物理</td><td></td><td></td><td></td></tr>
            <tr><td>政治/化学</td><td></td><td></td><td></td></tr>
            <tr><td>地理/生物</td><td></td><td></td><td></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 能力六边形图表区域 -->
    <div class="chart-container">
      <h2>一本能力值</h2>
      <e-charts class="radar-chart" :option="chartOption"></e-charts>
      <div class="description">综合分析：本次考试总分较上次考试退步，语文、数学、外语、历史/物理、政治/化学、地理/生物均较上次考试退步。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const router = useRouter();

const goBack = () => {
  router.push('/analysis'); // Or router.back();
};

// ECharts 雷达图配置
const chartOption = ref({
  radar: {
    // shape: 'circle', // 可以设置为 'circle'
    indicator: [
      { name: '语文', max: 100 }, // 示例最大值，请根据实际数据调整
      { name: '数学', max: 100 },
      { name: '外语', max: 100 },
      { name: '历史/物理', max: 100 },
      { name: '政治/化学', max: 100 },
      { name: '地理/生物', max: 100 }
    ]
  },
  series: [
    {
      name: '能力值', // 系列名称
      type: 'radar',
      data: [
        { value: [80, 75, 90, 60, 70, 85], name: '学生成绩' } // 示例数据，请替换为实际六科成绩
      ]
    }
  ]
});

</script>

<style scoped>
.student-analysis-page {
  padding: 20px;
  position: relative; /* Needed for absolute positioning of the button */
  height: 100%; /* Make the container fill the height */
  overflow-y: auto; /* Add vertical scrolling */
  box-sizing: border-box; /* Include padding in height calculation */
}

.back-button {
  position: absolute;
  top: 10px; /* Adjust as needed */
  left: 10px; /* Adjust as needed */
  padding: 5px 10px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10; /* Ensure button is above other content */
}

.tables-container {
  display: flex; /* 使用 flexbox 实现并列布局 */
  gap: 20px; /* 表格之间的间隔 */
  margin-top: 40px; /* Add margin to prevent overlap with button */
}

.table-section {
  flex: 1; /* 让两个表格区域平分空间 */
}

.analysis-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.analysis-table th,
.analysis-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}

.analysis-table th {
  background-color: #f2f2f2;
}

.total-exams, .exam-date {
  font-size: 0.9em;
  color: #666;
  margin-left: 10px;
}

.description {
  margin-top: 10px;
  font-size: 0.9em;
}

.chart-container {
    margin-top: 40px; /* Add space above the chart */
    display: flex;
    flex-direction: column;
    align-items: center; /* Center the chart horizontally */
}

.radar-chart {
  width: 600px; /* Adjust width and height as needed */
  height: 400px;
}

.analysis-text {
  margin-top: 20px;
  font-size: 1.2em;
  font-weight: bold;
}
</style> 
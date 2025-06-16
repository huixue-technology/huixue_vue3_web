<template>
  <div class="analysis-page">
    <h1>成绩分析</h1>
    <div class="button-grid">
      <router-link to="/analysis/student" class="analysis-button">
        <span>学生分析</span>
      </router-link>
      <router-link to="/elevate-analytics" class="analysis-button">
        <span>进退对比</span>
      </router-link>
      <router-link to="/student-challenge" class="analysis-button">
        <span>学生挑战</span>
      </router-link>
      <router-link to="/rank-details" class="analysis-button">
        <span>名次详情</span>
      </router-link>
      <router-link to="/grade-simulation" class="analysis-button">
        <span>成绩模拟</span>
      </router-link>
      <router-link to="/gradeanalysis/mistakes" class="analysis-button">
        <span>错题合集</span>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// Script logic can go here later
</script>

<style scoped>
.analysis-page {
  padding: 20px;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.analysis-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #fff;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}
</style> 
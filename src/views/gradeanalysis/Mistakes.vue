<template>
  <div class="mistakes-page">
    <div class="header">
      <button class="back-button" @click="goBack">返回</button>
      <h2>错题合集</h2>
    </div>

    <div class="filter-section">
      <div class="filter-item">
        <label>班级:</label>
        <a-select v-model:value="formData.class" placeholder="请选择班级" class="input-select">
          <a-select-option value="class2244">高三 2244</a-select-option>
          <!-- Add more options as needed -->
        </a-select>
      </div>
      <div class="filter-item">
        <label>科目:</label>
        <a-select v-model:value="formData.subject" placeholder="请选择科目" class="input-select">
          <a-select-option value="math">数学</a-select-option>
          <!-- Add more options as needed -->
        </a-select>
      </div>
      <div class="filter-item">
        <label>维度:</label>
        <a-select v-model:value="formData.dimension" placeholder="请选择维度" class="input-select">
          <a-select-option value="knowledge_point">知识点</a-select-option>
          <!-- Add more options as needed -->
        </a-select>
      </div>
      <div class="filter-item">
        <label>知识点:</label>
        <a-select v-model:value="formData.knowledgePoint" placeholder="请选择知识点" class="input-select">
          <a-select-option value="compulsory1">必修一</a-select-option>
          <!-- Add more options as needed -->
        </a-select>
      </div>
      <div class="filter-item">
        <label>姓名:</label>
        <a-select v-model:value="formData.name" placeholder="请选择姓名" class="input-select">
          <a-select-option value="zhangjiuyun">张九允</a-select-option>
          <!-- Add more options as needed -->
        </a-select>
      </div>
      <p class="description red-text">
        说明：这里是错题合集的说明文本，可以根据需要修改。
      </p>
      <a-button type="primary" @click="generate" class="query-button">生成</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Select as ASelect, Button as AButton } from 'ant-design-vue';

const router = useRouter();

const formData = ref({
  class: '',
  subject: '',
  dimension: '',
  knowledgePoint: '',
  name: '',
});

const generate = () => {
  console.log('生成 button clicked', formData.value);
  // Logic to generate content based on selections
};

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.mistakes-page {
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
  flex-grow: 1;
  text-align: center;
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
  width: 60px;
  text-align: right;
}

.description {
  grid-column: 1 / -1;
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
}

/* Ant Design Select 样式调整 */
.input-select :deep(.ant-select-selector) {
  height: 38px;
  border: 1px solid #ddd !important;
  border-radius: 4px !important;
  box-shadow: none !important;
  display: flex;
  align-items: center;
}

.input-select :deep(.ant-select-selection-search-input),
.input-select :deep(.ant-select-selection-item),
.input-select :deep(.ant-select-selection-placeholder) {
  text-align: center;
  width: 100%;
}

.query-button {
  grid-column: 1 / -1;
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
</style>

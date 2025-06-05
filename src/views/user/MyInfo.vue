<template>
  <div class="my-info-container">
    <h2 class="page-title">我的信息</h2>
    <div class="info-table">
      <a-table :dataSource="infoRows" :columns="columns" :pagination="false" :showHeader="false" bordered></a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const columns = [
  {
    title: '属性',
    dataIndex: 'attribute',
    key: 'attribute',
    width: 150, // Adjust width as needed
  },
  {
    title: '值',
    dataIndex: 'value',
    key: 'value',
  },
]

const userInfo = ref({
  name: '胡桁彰',
  studentId: '243352540',
  class: '2240',
  subjects: '物理、化学、生物',
  graduationDate: '2024-06',
  school: 'XX中学',
  status: '在读'
})

const infoRows = ref([
  { key: 'name', attribute: '姓名', value: userInfo.value.name },
  { key: 'studentId', attribute: '学号', value: userInfo.value.studentId },
  { key: 'class', attribute: '班级', value: userInfo.value.class },
  { key: 'subjects', attribute: '选科', value: userInfo.value.subjects },
  { key: 'graduationDate', attribute: '毕业时间', value: userInfo.value.graduationDate },
  { key: 'school', attribute: '学校', value: userInfo.value.school },
  { key: 'status', attribute: '在读状态', value: userInfo.value.status },
])
</script>

<style scoped>
.my-info-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
}

.info-table {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

:deep(.ant-table) {
  margin-top: 20px;
}

:deep(.ant-table-thead > tr > th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: bold;
}

:deep(.ant-table-tbody > tr > td) {
  padding: 12px 16px;
}
</style> 
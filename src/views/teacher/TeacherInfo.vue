<template>
  <section class="teacher-info">
    <a-card title="教师信息" :loading="loading">
      <a-descriptions bordered :column="1">
        <a-descriptions-item label="教师姓名">{{ info.teacher?.name || info.name || '暂无' }}</a-descriptions-item>
        <a-descriptions-item label="学校">{{ schoolName || '—' }}</a-descriptions-item>
        <a-descriptions-item label="任教学科">{{ info.teacher?.subject || '暂无' }}</a-descriptions-item>
        <a-descriptions-item label="工号">{{ info.role || '暂无' }}</a-descriptions-item>
        <a-descriptions-item label="已绑定班级">
          <a-space v-if="classes.length" wrap>
            <a-tag v-for="row in classes" :key="row.id">{{ row.name }}（{{ row.id }}）</a-tag>
          </a-space>
          <span v-else>{{ loadFailed ? '班级加载失败' : '暂无已绑定的班级，请联系管理员' }}</span>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useUserStore } from '@/store';
import { loadTeacherClasses } from '@/utils/teacherClasses';
import { useBusinessSchoolName } from '@/composables/useBusinessSchoolName';

const user = useUserStore();
const info = user.getUserInfo();
const schoolName = useBusinessSchoolName(() => info.teacher?.school_id || info.school_id);
const classes = ref<{ id: number; name: string }[]>([]);
const loading = ref(true);
const loadFailed = ref(false);

onMounted(async () => {
  try {
    classes.value = await loadTeacherClasses(info);
  } catch {
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.teacher-info {
  max-width: 880px;
  margin: 24px auto;
  padding: 0 16px;
}
</style>

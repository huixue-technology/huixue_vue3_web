<template>
  <div class="section">
    <div class="section-title">优秀与待关注学生</div>
    <a-row :gutter="16">
      <a-col :xs="24" :md="12">
        <a-card title="优秀学生" class="list-card">
          <a-list :data-source="topStudents">
            <template #renderItem="{ item }">
              <a-list-item class="student-item">
                <span class="student-name">{{ item.name }}</span>
                <span class="student-score">{{ (item.score ?? 0) }}分</span>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="12">
        <a-card title="待关注学生" class="list-card">
          <a-list :data-source="bottomStudents">
            <template #renderItem="{ item }">
              <a-list-item class="student-item">
                <span class="student-name">{{ item.name }}</span>
                <span class="student-score">{{ (item.score ?? 0) }}分</span>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>

  <div class="section">
    <div class="section-title">学生分类概览</div>
    <div class="category-grid">
      <a-card class="category-card excellent">
        <div class="category-title">优等生</div>
        <div class="category-count">{{ categorySummary.excellent.count }} 人</div>
        <div class="category-sub">{{ categorySummary.excellent.percent }}%</div>
      </a-card>
      <a-card class="category-card warning">
        <div class="category-title">边缘生</div>
        <div class="category-count">{{ categorySummary.borderline.count }} 人</div>
        <div class="category-sub">{{ categorySummary.borderline.percent }}%</div>
      </a-card>
      <a-card class="category-card danger">
        <div class="category-title">差生</div>
        <div class="category-count">{{ categorySummary.poor.count }} 人</div>
        <div class="category-sub">{{ categorySummary.poor.percent }}%</div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  topBottomStudents: any[];
  studentGradesData: any[];
}>();

const topStudents = computed(() => props.topBottomStudents.filter(s => s.type === 'top'));

const bottomStudents = computed(() => props.topBottomStudents.filter(s => s.type === 'bottom'));

const categorySummary = computed(() => {
  const list = Array.isArray(props.studentGradesData) ? props.studentGradesData : [];
  const total = list.length;
  const count = (type: string) => list.filter(s => s.category === type).length;
  const pct = (c: number) => total ? Math.round((c / total) * 100) : 0;
  const excellent = count('excellent');
  const borderline = count('borderline');
  const poor = count('poor');
  
  return {
    total,
    excellent: { count: excellent, percent: pct(excellent) },
    borderline: { count: borderline, percent: pct(borderline) },
    poor: { count: poor, percent: pct(poor) }
  };
});
</script>

<style scoped lang="less">
.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 4px solid #1890ff;
}

.list-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.student-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.student-name { font-weight: 500; }
.student-score { color: #1890ff; }

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.category-card {
  text-align: center;
  border-radius: 8px;
  padding: 20px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.category-title { font-size: 16px; margin-bottom: 8px; color: #333; }
.category-count { font-size: 26px; font-weight: 700; }
.category-sub { margin-top: 4px; font-size: 14px; color: #666; }

.category-card.excellent { background: linear-gradient(120deg, #f6ffed, #d9f7be); border: 1px solid #b7eb8f; }
.category-card.warning { background: linear-gradient(120deg, #fffbe6, #fff1b8); border: 1px solid #ffe58f; }
.category-card.danger { background: linear-gradient(120deg, #fff2f0, #ffccc7); border: 1px solid #ffa39e; }
</style>
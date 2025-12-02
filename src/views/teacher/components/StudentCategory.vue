<template>
  <div class="section">
    <div class="section-title">学生分类概览</div>
    <!-- 学生列表展示 -->
    <div class="student-lists-container">
      <!-- 优等生列表 -->
      <a-card class="list-card" title="优等生名单">
        <div class="subject-grid">
          <div v-for="(students, subject) in excellentStudents" :key="subject" class="subject-section">
            <div class="subject-title">{{ getSubjectName(String(subject)) }}</div>
            <div v-if="students.length === 0" class="no-data">暂无数据</div>
            <div v-else class="student-list">
              <div 
                v-for="(studentId, index) in students" 
                :key="`${subject}-${studentId}`"
                class="student-item"
              >
                <!-- <span class="student-index">{{ index + 1 }}</span> -->
                <span class="student-name">{{ getStudentName(studentId) }}</span>
                <span class="student-id">({{ studentId }})</span>
              </div>
            </div>
          </div>
        </div>
      </a-card>
      
      <!-- 边缘生列表 -->
      <a-card class="list-card" title="边缘生名单">
        <div class="subject-grid">
          <div v-for="(students, subject) in borderlineStudents" :key="subject" class="subject-section">
            <div class="subject-title">{{ getSubjectName(String(subject)) }}</div>
            <div v-if="students.length === 0" class="no-data">暂无数据</div>
            <div v-else class="student-list">
              <div 
                v-for="(studentId, index) in students" 
                :key="`${subject}-${studentId}`"
                class="student-item"
              >
                <!-- <span class="student-index">{{ index + 1 }}</span> -->
                <span class="student-name">{{ getStudentName(studentId) }}</span>
                <span class="student-id">({{ studentId }})</span>
              </div>
            </div>
          </div>
        </div>
      </a-card>
      
      <!-- 差生列表 -->
      <a-card class="list-card" title="差生名单">
        <div class="subject-grid">
          <div v-for="(students, subject) in poorStudents" :key="subject" class="subject-section">
            <div class="subject-title">{{ getSubjectName(String(subject)) }}</div>
            <div v-if="students.length === 0" class="no-data">暂无数据</div>
            <div v-else class="student-list">
              <div 
                v-for="(studentId, index) in students" 
                :key="`${subject}-${studentId}`"
                class="student-item"
              >
                <!-- <span class="student-index">{{ index + 1 }}</span> -->
                <span class="student-name">{{ getStudentName(studentId) }}</span>
                <span class="student-id">({{ studentId }})</span>
              </div>
            </div>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getStudentApi } from '@/servers/api/student';

const props = defineProps<{
  studentGradesData: any[];
    classInfo?: {
    subject_selection: string;
  };
}>();

// 存储班级学生信息
const classStudents = ref<Record<string, string>>({});
const loading = ref(false);
const error = ref<string | null>(null);

// 基础科目映射
const baseSubjectMap: Record<string, string> = {
  yuwen: '语文',
  shuxue: '数学',
  yingyu: '英语',
  wuli: '物理',
  huaxue: '化学',
  shengwu: '生物',
  lishi: '历史',
  zhengzhi: '政治',
  dili: '地理',
  sum_: '总分'
};
// 根据班级选科信息过滤科目
const subjectMap = computed(() => {
  const map = { ...baseSubjectMap };
  
  // 如果没有班级信息或者没有选科信息，则显示所有科目
  if (!props.classInfo?.subject_selection) {
    return map;
  }
  
  const selection = props.classInfo.subject_selection;
  
  // 物理类科目
  if (!selection.includes('物') && !selection.includes('理')) {
    delete map.wuli;
  }
  
  // 化学类科目
  if (!selection.includes('化')) {
    delete map.huaxue;
  }
  
  // 生物类科目
  if (!selection.includes('生')) {
    delete map.shengwu;
  }
  
  // 历史类科目
  if (!selection.includes('史')) {
    delete map.lishi;
  }
  
  // 政治类科目
  if (!selection.includes('政')) {
    delete map.zhengzhi;
  }
  
  // 地理类科目
  if (!selection.includes('地')) {
    delete map.dili;
  }

  console.log('Filtered Subject Map:', map);
  
  return map;
});


// 获取科目名称
const getSubjectName = (subjectKey: string) => {
  return subjectMap.value[subjectKey];
};

// 获取学生姓名
const getStudentName = (studentId: string) => {
  return classStudents.value[studentId] || '未知';
};

// 获取班级ID用于获取学生列表
const classId = computed(() => {
  if (Array.isArray(props.studentGradesData) && props.studentGradesData.length > 0) {
    // 确保 class_id 是数字类型
    const id = props.studentGradesData[0].class_id;
    return typeof id === 'string' ? parseInt(id, 10) : id;
  }
  return null;
});

// 获取班级学生列表
const fetchClassStudents = async (classId: number) => {
  if (!classId) return;
  
  try {
    loading.value = true;
    error.value = null;
    const res = await getStudentApi({ class_id: classId, page: 1, size: 1000 });
    if (res.code === 200 && res.data) {
      // 创建学号到姓名的映射
      const studentMap: Record<string, string> = {};
      res.data.forEach((student: any) => {
        studentMap[student.uid] = student.name;
      });
      classStudents.value = studentMap;
    } else {
      error.value = '获取学生列表失败';
    }
  } catch (err: any) {
    console.error('获取班级学生列表失败:', err);
    error.value = '获取学生列表失败: ' + (err.message || '未知错误');
  } finally {
    loading.value = false;
  }
};

// 监听班级ID变化，获取学生列表
watch(classId, async (newClassId) => {
  if (newClassId) {
    await fetchClassStudents(newClassId);
  }
}, { immediate: true });

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

// 提取优等生数据
const excellentStudents = computed(() => {
  if (!Array.isArray(props.studentGradesData) || props.studentGradesData.length === 0) {
    return {};
  }
  const data = props.studentGradesData[0];
  const ret: Record<string, any[]> = {};
  for (const subject in subjectMap.value) {
    if (subject in subjectMap.value) {
      // 提取subjectMap有的科目
      ret[subject] = data.excelent_student[subject] || [];
    }
  }
  return ret || {};
});

// 提取边缘生数据
const borderlineStudents = computed(() => {
    if (!Array.isArray(props.studentGradesData) || props.studentGradesData.length === 0) {
        return {};
    }
    //  只提取subjectMap有的科目
    const data = props.studentGradesData[0];
    const ret: Record<string, any[]> = {};
    for (const subject in subjectMap.value) {
        if (subject in subjectMap.value) {
            // 提取subjectMap有的科目
            ret[subject] = data.warn_student[subject] || [];
        }
    }
  return ret || {};
});

// 提取差生数据
const poorStudents = computed(() => {
  if (!Array.isArray(props.studentGradesData) || props.studentGradesData.length === 0) {
    return {};
  }
  const data = props.studentGradesData[0];
  const ret: Record<string, any[]> = {};
  for (const subject in subjectMap.value) {
    if (subject in subjectMap.value) {
      // 提取subjectMap有的科目
      ret[subject] = data.bad_student[subject] || [];
    }
  }
  return ret || {};
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
  text-align: left;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 4px solid #1890ff;
}

.list-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.subject-section {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  padding: 12px;
}

.subject-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #1890ff;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 4px;
}

.no-data {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 8px 0;
}

.student-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.student-item:last-child {
  border-bottom: none;
}

.student-index {
  width: 20px;
  color: #999;
}

.student-name {
  flex: 1;
  margin: 0 8px;
  font-weight: 500;
}

.student-id {
  color: #999;
  font-size: 12px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
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

@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
  
  .subject-grid {
    grid-template-columns: 1fr;
  }
}
</style>
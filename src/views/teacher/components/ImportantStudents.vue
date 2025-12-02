<template>
  <div class="section">
    <a-row>
      <div class="section-title">重点关注学生</div>
    </a-row>
    
    <!-- 按学科展示学生 -->
    <div class="subject-students-container">
      <a-tabs v-model:activeKey="activeSubject" tab-position="left" class="subject-tabs">
        <a-tab-pane 
          v-for="(subjectKey, index) in subjectKeys" 
          :key="subjectKey" 
          :tab="getSubjectName(subjectKey)"
        >
          <div class="subject-content">
            <a-row :gutter="[24, 24]">
              <!-- 优秀学生 -->
              <a-col :span="24" :md="12">
                <a-card class="student-card top-students-card" title="经常为前10的学生（前10率为80%）">
                  <div class="student-list">
                    <div 
                      v-if="getTopStudents(subjectKey).length === 0" 
                      class="no-data"
                    >
                      暂无数据
                    </div>
                    <div 
                      v-else
                      v-for="(studentId, idx) in getTopStudents(subjectKey)" 
                      :key="`${subjectKey}-top-${studentId}`"
                      class="student-item top-student-item"
                    >
                      <span class="student-rank">{{ idx + 1 }}</span>
                      <span class="student-name">{{ getStudentName(studentId) }}</span>
                      <span class="student-id">({{ studentId }})</span>
                    </div>
                  </div>
                </a-card>
              </a-col>
              
              <!-- 待关注学生 -->
              <a-col :span="24" :md="12">
                <a-card class="student-card bottom-students-card" title="经常倒数的学生">
                  <div class="student-list">
                    <div 
                      v-if="getBottomStudents(subjectKey).length === 0" 
                      class="no-data"
                    >
                      暂无数据
                    </div>
                    <div 
                      v-else
                      v-for="(studentId, idx) in getBottomStudents(subjectKey)" 
                      :key="`${subjectKey}-bottom-${studentId}`"
                      class="student-item bottom-student-item"
                    >
                      <span class="student-rank">{{ idx + 1 }}</span>
                      <span class="student-name">{{ getStudentName(studentId) }}</span>
                      <span class="student-id">({{ studentId }})</span>
                    </div>
                  </div>
                </a-card>
              </a-col>
            </a-row>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { getStudentApi } from '@/servers/api/student';

// 定义科目映射
const subjectMap = {
  'yuwen': '语文',
  'shuxue': '数学',
  'yingyu': '英语',
  'wuli': '物理',
  'huaxue': '化学',
  'shengwu': '生物',
  'lishi': '历史',
  'zhengzhi': '政治',
  'dili': '地理',
  'sum_': '总分'
} as const;

type SubjectKey = keyof typeof subjectMap;

const props = defineProps<{
  classAnalysisData: any;
  subjectMap: Record<string, string>;
}>();

// 当前激活的学科tab
const activeSubject = ref<SubjectKey>('sum_');

// 获取学科键列表，优先显示总分
const subjectKeys = computed(() => {
  const keys = Object.keys(subjectMap) as SubjectKey[];
  // 将总分移到第一个
  const sumIndex = keys.indexOf('sum_');
  if (sumIndex > -1) {
    keys.splice(sumIndex, 1);
    keys.unshift('sum_');
  }
  return keys;
});

// 获取学科名称
const getSubjectName = (subjectKey: SubjectKey) => {
  return subjectMap[subjectKey] || subjectKey;
};

// 存储班级学生信息
const classStudents = ref<Record<string, string>>({});

// 获取班级学生列表
const fetchClassStudents = async (classId: number) => {
  try {
    const res = await getStudentApi({ class_id: classId, page: 1, size: 100 });
    if (res.code === 200 && res.data) {
      // 创建学号到姓名的映射
      const studentMap: Record<string, string> = {};
      res.data.forEach((student: any) => {
        studentMap[student.uid] = student.name;
      });
      classStudents.value = studentMap;
    }
  } catch (err) {
    console.error('获取班级学生列表失败:', err);
  }
};

// 获取优秀学生列表
const getTopStudents = (subject: SubjectKey) => {
  console.log('getTopStudents', props.classAnalysisData);
  if (!props.classAnalysisData || !props.classAnalysisData.top_student) {
    return [];
  }
  return props.classAnalysisData.top_student[subject] || [];
};

// 获取待关注学生列表
const getBottomStudents = (subject: SubjectKey) => {
  if (!props.classAnalysisData || !props.classAnalysisData.bottom_student) {
    return [];
  }
  return props.classAnalysisData.bottom_student[subject] || [];
};

// 获取学生姓名
const getStudentName = (studentId: string) => {
  return classStudents.value[studentId] || '未知';
};

// 监听数据变化
watch(() => props.classAnalysisData, async (newData) => {
  if (newData && newData.class_id) {
    // 获取班级学生信息
    await fetchClassStudents(newData.class_id);
  }
}, { immediate: true });

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

.subject-students-container {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.subject-tabs {
  :deep(.ant-tabs-tab) {
    justify-content: flex-start;
  }
  
  :deep(.ant-tabs-tab-active) {
    background: #e6f7ff;
    border-right: 2px solid #1890ff;
  }
  
  :deep(.ant-tabs-tabpane) {
    padding: 20px;
  }
}

.subject-content {
  min-height: 300px;
}

.student-card {
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  height: 100%;
  
  :deep(.ant-card-head) {
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    border-radius: 8px 8px 0 0;
    
    .ant-card-head-title {
      font-size: 16px;
      font-weight: 500;
    }
  }
  
  &.top-students-card :deep(.ant-card-head) {
    background: linear-gradient(90deg, #f0f7ff, #e6f4ff);
  }
  
  &.bottom-students-card :deep(.ant-card-head) {
    background: linear-gradient(90deg, #fff0f0, #ffe6e6);
  }
}

.student-list {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
}

.student-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  transition: all 0.3s;
  
  &:hover {
    background: #f5f5f5;
    transform: translateX(4px);
  }
  
  .student-rank {
    display: inline-block;
    width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    border-radius: 50%;
    background: #f0f0f0;
    font-weight: 500;
    margin-right: 12px;
    flex-shrink: 0;
  }
  
  .student-name {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
  }
  
  .student-id {
    color: #999;
    font-size: 12px;
    margin-left: 8px;
    flex-shrink: 0;
  }
}

.top-student-item {
  .student-rank {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
  }
  
  .student-name {
    color: #2c3e50;
  }
}

.bottom-student-item {
  .student-rank {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    color: white;
  }
  
  .student-name {
    color: #2c3e50;
  }
}

.no-data {
  text-align: center;
  color: #999;
  padding: 40px 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .subject-tabs {
    :deep(.ant-tabs-tab) {
      padding: 8px 12px;
      font-size: 14px;
    }
    
    :deep(.ant-tabs-tabpane) {
      padding: 12px;
    }
  }
  
  .student-item {
    padding: 8px 10px;
    
    .student-name {
      font-size: 13px;
    }
    
    .student-id {
      font-size: 11px;
    }
  }
}
</style>
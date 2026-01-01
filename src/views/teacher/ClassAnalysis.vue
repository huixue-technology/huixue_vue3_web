<template>
  <div class="class-analysis-container">
    <!-- 学生过线率列表 -->
    <div class="section">
      <a-row>
        <div class="section-title">学生各科目过线率统计</div>
      </a-row>
      <a-card class="rate-card">
        <!-- 搜索框 -->
        <div class="search-container">
          <a-space wrap :size="12">
            <a-auto-complete
              v-model:value="searchName"
              :options="studentNameOptions"
              placeholder="请输入或选择学生姓名"
              style="width: 250px"
              @search="handleSearch"
              @select="handleSelect"
              allowClear
            >
              <template #option="{ value, label }">
                  <div>{{ label }} ({{ maskStudentId(value) }})</div>
              </template>
            </a-auto-complete>
            
            <a-select
              v-model:value="selectedSubject"
              placeholder="请选择科目"
              style="width: 150px"
              allowClear
            >
              <a-select-option v-for="subject in availableSubjects" :key="subject.value" :value="subject.value">
                {{ subject.label }}
              </a-select-option>
            </a-select>
            
            <a-select
              v-model:value="rateRange"
              placeholder="过线率范围"
              style="width: 150px"
              allowClear
            >
              <a-select-option value="0-20">0% - 20%</a-select-option>
              <a-select-option value="20-40">20% - 40%</a-select-option>
              <a-select-option value="40-60">40% - 60%</a-select-option>
              <a-select-option value="60-80">60% - 80%</a-select-option>
              <a-select-option value="80-100">80% - 100%</a-select-option>
            </a-select>
            
            <a-button @click="clearSearch">清除筛选</a-button>
          </a-space>
        </div>
        
        <a-table
          :data-source="filteredStudentRateList"
          bordered
          :columns="studentRateColumns"
          :pagination="{ pageSize: 10, showTotal: (total) => `共 ${total} 名学生` }"
          :scroll="{ x: 'max-content' }"
          :loading="loading"
        />
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { postClassAlwaysTopBottomStudents } from '@/servers/api/average';
import { message } from 'ant-design-vue';

const props = defineProps<{
  classId: number;
}>();

const loading = ref(false);

// 科目名称映射表
const subjectMap = {
  'yuwen': '语文',
  'shuxue': '数学',
  'yingyu': '英语',
  'wuli': '物理',
  'huaxue': '化学',
  'shengwu': '生物',
  'lishi': '历史',
  'zhengzhi': '政治',
  'dili': '地理'
};

// 学生过线率列表数据
const studentRateList = ref<any[]>([]);

// 学生过线率表格列定义
const studentRateColumns = ref<any[]>([
  { title: '学生姓名', dataIndex: 'name', width: 120, fixed: 'left', align: 'center' },
  { title: '学号', dataIndex: 'uid', width: 120, fixed: 'left', align: 'center', customRender: ({ text }: any) => maskStudentId(text) },
]);

// 搜索相关
const searchName = ref<string>('');
const selectedSubject = ref<string | undefined>(undefined);
const rateRange = ref<string | undefined>(undefined);

// 学生姓名选项（用于自动完成）
const studentNameOptions = computed(() => {
  return studentRateList.value.map(student => ({
    value: student.uid,
    label: student.name
  }));
});

// 可用的科目列表
const availableSubjects = ref<{ value: string; label: string }[]>([]);

// 过滤后的学生列表
const filteredStudentRateList = computed(() => {
  let result = studentRateList.value;
  
  // 按姓名或学号筛选
  if (searchName.value) {
    result = result.filter(student => {
      const nameMatch = student.name.toLowerCase().includes(searchName.value.toLowerCase());
      const uidMatch = String(student.uid).includes(searchName.value);
      return nameMatch || uidMatch;
    });
  }
  
  // 按科目和过线率范围筛选（只有当科目和过线率范围都选择时才生效）
  if (selectedSubject.value && rateRange.value) {
    const [min, max] = rateRange.value.split('-').map(Number);
    result = result.filter(student => {
      const rate = student[selectedSubject.value!];
      if (rate === null || rate === undefined) return false;
      const ratePercent = rate * 100;
      return ratePercent >= min && ratePercent <= max;
    });
  } else if (selectedSubject.value && !rateRange.value) {
    // 只选择了科目，显示有该科目成绩的学生
    result = result.filter(student => {
      const rate = student[selectedSubject.value!];
      return rate !== null && rate !== undefined;
    });
  } else if (!selectedSubject.value && rateRange.value) {
    // 只选择了过线率范围，筛选任意科目过线率在范围内的学生
    const [min, max] = rateRange.value.split('-').map(Number);
    result = result.filter(student => {
      // 检查学生是否有任何科目的过线率在指定范围内
      return availableSubjects.value.some(subject => {
        const rate = student[subject.value];
        if (rate === null || rate === undefined) return false;
        const ratePercent = rate * 100;
        return ratePercent >= min && ratePercent <= max;
      });
    });
  }
  
  return result;
});

// 处理搜索
const handleSearch = (value: string) => {
  searchName.value = value;
};

// 处理选择
const handleSelect = (value: string) => {
  // 当选择时，使用学号查找对应的学生姓名
  const student = studentRateList.value.find(s => s.uid === value);
  if (student) {
    searchName.value = student.name;
  }
};

// 清除搜索
const clearSearch = () => {
  searchName.value = '';
  selectedSubject.value = undefined;
  rateRange.value = undefined;
};

// 学号脱敏处理，只显示后四位并在前面加两个星号
const maskStudentId = (studentId: string) => {
  if (!studentId) return '';
  const idStr = String(studentId);
  if (idStr.length <= 4) return idStr;
  return '**' + idStr.slice(-4);
};




// 初始化
onMounted(() => {
  fetchSubjectRateData();
});

// 监听 classId 变化
watch(() => props.classId, () => {
  if (props.classId) {
    fetchSubjectRateData();
  }
});

// 获取学生过线率数据
const fetchSubjectRateData = async () => {
  if (!props.classId) return;

  try {
    loading.value = true;
    const res = await postClassAlwaysTopBottomStudents({
      class_ids: [props.classId],
    });
    
    if (res.code === 200 && res.data && res.data.length > 0) {
      const classData = res.data[0];
      const studentOneLineRate = classData.student_one_line_rate || {};
      
      // 构建学生数据映射表
      const studentMap = new Map<string, any>();
      
      // 收集所有科目并构建动态列
      const subjectColumns: any[] = [];
      
      Object.entries(studentOneLineRate).forEach(([subject, students]: [string, any]) => {
        if (Array.isArray(students)) {
          // 添加科目列
          const subjectName = subjectMap[subject] || subject;
          subjectColumns.push({
            title: subjectName,
            dataIndex: subject,
            width: 100,
            align: 'center',
            customRender: ({ text }: any) => {
              if (text === null || text === undefined) return '-';
              return `${(text * 100)}%`;
            }
          });
          
          // 将每个学生的该科目过线率添加到学生数据中
          students.forEach((student: any) => {
            if (!studentMap.has(student.uid)) {
              studentMap.set(student.uid, {
                uid: student.uid,
                name: student.name,
                key: student.uid
              });
            }
            const studentData = studentMap.get(student.uid);
            if (studentData) {
              studentData[subject] = student.rate;
            }
          });
        }
      });
      
      // 更新表格列（基础列 + 科目列）
      studentRateColumns.value = [
        { title: '学生姓名', dataIndex: 'name', width: 120, fixed: 'left', align: 'center' },
        { title: '学号', dataIndex: 'uid', width: 120, fixed: 'left', align: 'center', customRender: ({ text }: any) => maskStudentId(text) },
        ...subjectColumns
      ];
      
      // 更新可用科目列表
      availableSubjects.value = subjectColumns.map(col => ({
        value: col.dataIndex,
        label: col.title
      }));
      
      // 转换为数组
      studentRateList.value = Array.from(studentMap.values());
    } else {
      message.error('获取科目过线率数据失败');
      studentRateList.value = [];
    }
  } catch (err) {
    message.error('请求科目过线率接口出错');
    console.error(err);
    studentRateList.value = [];
  } finally {
    loading.value = false;
  }
};

</script>

<style scoped lang="less">
.class-analysis-container {
  margin-bottom: 20px;
}

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

.rate-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background: #ffffff;

  :deep(.ant-card-body) {
    padding: 16px;
  }
}

.search-container {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  
  :deep(.ant-select-selector),
  :deep(.ant-input) {
    border-radius: 4px;
  }
  
  :deep(.ant-btn) {
    border-radius: 4px;
  }
}




/* 表格样式优化 */
:deep(.ant-table-thead > tr > th) {
  background: linear-gradient(180deg, #f0f5ff 0%, #e6f0ff 100%);
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #d6e4ff;
  text-align: center;
  font-size: 16px; /* 设置表头字体大小 */
}

:deep(.ant-table-tbody > tr > td) {
  text-align: center;
  font-size: 16px; /* 设置表格内容字体大小 */
  padding: 12px 8px; /* 增加单元格内边距 */
}

:deep(.ant-table-tbody > tr:hover) {
  background-color: #f0f8ff;
}

:deep(.ant-table) {
  min-width: 100%;
}

:deep(.ant-table-bordered .ant-table-thead > tr > th) {
  border-right: 1px solid #d6e4ff;
}

:deep(.ant-table-bordered .ant-table-tbody > tr > td) {
  border-right: 1px solid #f0f0f0;
}

/* 响应式设计 */</style>
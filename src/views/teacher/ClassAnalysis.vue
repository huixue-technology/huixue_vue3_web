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
            <!-- 学生姓名搜索 -->
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
            
            <!-- 科目筛选 -->
            <a-select
              v-model:value="selectedSubject"
              placeholder="请选择科目"
              style="width: 150px"
              allowClear
              @change="handleSubjectChange"
            >
              <a-select-option value="">全部科目</a-select-option>
              <a-select-option v-for="subject in availableSubjects" :key="subject.value" :value="subject.value">
                {{ subject.label }}
              </a-select-option>
            </a-select>
            
            <!-- 过线率范围 -->
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
            
            <!-- 排序方式 -->
            <a-select
              v-model:value="sortOrder"
              placeholder="排序方式"
              style="width: 150px"
            >
              <a-select-option value="desc">降序</a-select-option>
              <a-select-option value="asc">升序</a-select-option>
            </a-select>
            
            <!-- 确定筛选按钮 -->
            <a-button type="primary" @click="applyFilters">确定筛选</a-button>
            
            <!-- 清除筛选按钮 -->
            <a-button @click="clearSearch">清除筛选</a-button>
          </a-space>
        </div>

        <a-table
          :data-source="sortedStudentRateList"
          bordered
          :columns="studentRateColumns"
          :pagination="{ pageSize: 20 }"
          :scroll="{ x: 'max-content', y: 600 }"
          :loading="loading"
          rowKey="uid"
        >
          <template #bodyCell="{ column, record }">
            <!-- 过线率单元格颜色渲染 -->
            <template v-if="isSubjectColumn(column.dataIndex)">
              <span :class="getRateClass(record[column.dataIndex])">
                {{ record[column.dataIndex] === null || record[column.dataIndex] === undefined ? '-' : `${Math.round(record[column.dataIndex] * 100)}%` }}
              </span>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, onUnmounted } from 'vue';
import { postClassAlwaysTopBottomStudents } from '@/servers/api/average';
import { message } from 'ant-design-vue';
import { LoadingOutlined } from '@ant-design/icons-vue';

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
  'dili': '地理',
  'sum_': '总分'
};

// 学生过线率列表数据
const studentRateList = ref<any[]>([]);

// 表格列定义（增加排序功能）
const studentRateColumns = ref<any[]>([
  { title: '学生姓名', dataIndex: 'name', width: 120, fixed: 'left', align: 'center' },
  { title: '学号', dataIndex: 'uid', width: 120, fixed: 'left', align: 'center', customRender: ({ text }: any) => maskStudentId(text) },
]);

// 搜索相关
const searchName = ref<string>('');
const selectedSubject = ref<string>('');
const rateRange = ref<string | undefined>(undefined);
const sortOrder = ref<string>('desc'); // 排序方式，默认降序

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
  
  // 按科目筛选
  if (selectedSubject.value) {
    result = result.filter(student => {
      const rate = student[selectedSubject.value!];
      return rate !== null && rate !== undefined;
    });
  }
  
  // 按过线率范围筛选
  if (rateRange.value) {
    const [min, max] = rateRange.value.split('-').map(Number);
    result = result.filter(student => {
      // 如果选择了具体科目，按该科目筛选；否则按任意科目筛选
      if (selectedSubject.value) {
        const rate = student[selectedSubject.value];
        if (rate === null || rate === undefined) return false;
        const ratePercent = rate * 100;
        return ratePercent >= min && ratePercent <= max;
      } else {
        // 检查学生是否有任何科目的过线率在指定范围内
        return availableSubjects.value.some(subject => {
          const rate = student[subject.value];
          if (rate === null || rate === undefined) return false;
          const ratePercent = rate * 100;
          return ratePercent >= min && ratePercent <= max;
        });
      }
    });
  }
  
  return result;
});

// 排序后的学生列表
const sortedStudentRateList = computed(() => {
  const list = [...filteredStudentRateList.value];
  
  // 如果选择了科目，按该科目过线率排序
  if (selectedSubject.value) {
    return list.sort((a, b) => {
      const rateA = a[selectedSubject.value] || 0;
      const rateB = b[selectedSubject.value] || 0;
      return sortOrder.value === 'desc' ? rateB - rateA : rateA - rateB;
    });
  }
  
  // 未选择科目时，按总分过线率排序
  return list.sort((a, b) => {
    const rateA = a['sum_'] || 0;
    const rateB = b['sum_'] || 0;
    return sortOrder.value === 'desc' ? rateB - rateA : rateA - rateB;
  });
});

// 判断是否为科目列
const isSubjectColumn = (dataIndex: string) => {
  return availableSubjects.value.some(subject => subject.value === dataIndex);
};

// 获取过线率颜色样式类
const getRateClass = (rate: number | null | undefined) => {
  if (rate === null || rate === undefined) return 'normal-rate';

  const ratePercent = rate * 100;

  if (ratePercent >= 50 && ratePercent <= 70) {
    return 'low-rate'; // 50%-70%红色
  } else {
    return 'normal-rate'; // 其他范围默认颜色
  }
};

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

// 处理科目变更
const handleSubjectChange = () => {
  // 科目变更时可以重置排序或其他筛选条件
};

// 应用筛选
const applyFilters = () => {
  // 触发计算属性重新计算，无需额外逻辑
  message.success('筛选条件已应用');
};

// 清除搜索
const clearSearch = () => {
  searchName.value = '';
  selectedSubject.value = '';
  rateRange.value = undefined;
  sortOrder.value = 'desc';
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

// 处理数据并更新表格
const processStudentRateData = (classData: any) => {
  const studentOneLineRate = classData.student_one_line_rate || {};
  
  // 构建学生数据映射表
  const studentMap = new Map<string, any>();
  
  // 收集所有科目并构建动态列
  const subjectColumns: any[] = [];
  
  Object.entries(studentOneLineRate).forEach(([subject, students]: [string, any]) => {
    if (Array.isArray(students)) {
      // 添加科目列（支持排序）
      const subjectName = subjectMap[subject] || subject;
      subjectColumns.push({
        title: subjectName,
        dataIndex: subject,
        width: 100,
        align: 'center',
        // 移除自定义渲染，改用模板方式处理颜色
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
};

// 获取学生过线率数据
const fetchSubjectRateData = async () => {
  if (!props.classId) return;

  try {
    loading.value = true;
    
    const res = await postClassAlwaysTopBottomStudents({
      class_ids: [props.classId],
    }, {
      errorHandler: (error: any) => {
        return error;
      },
      getResponse: true,
    });
    
    const responseData = res.data || res;
    const httpStatus = res.response?.status || res.status;
    
    if (httpStatus === 200 && responseData.code === 200 && responseData.data) {
      // 判断 data 是数组还是对象
      if (Array.isArray(responseData.data) && responseData.data.length > 0) {
        const classData = responseData.data[0];
        processStudentRateData(classData);
        message.success('数据加载成功');
      } else if (typeof responseData.data === 'object' && responseData.data.student_one_line_rate) {
        // data 是对象而非数组，直接使用
        processStudentRateData(responseData.data);
        message.success('数据加载成功');
      } else {
        message.info('暂无数据');
        studentRateList.value = [];
      }
    } else {
      message.warning(responseData.message || '获取数据失败');
      studentRateList.value = [];
    }
  } catch (err: any) {
    console.error('请求异常:', err);
    message.error('请求数据失败');
    studentRateList.value = [];
  } finally {
    loading.value = false;
  }
};

// 暴露方法给父组件（必须在函数定义之后）
defineExpose({
  refresh: fetchSubjectRateData,
});
</script>

<style scoped lang="less">
.class-analysis-container {
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  min-height: 100vh;
  box-sizing: border-box;
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

/* 过线率颜色样式 */
.normal-rate {
  color: #333;
  font-weight: 500;
}

.mid-rate {
  color: #fa8c16; /* 橙色 */
  font-weight: bold;
}

.low-rate {
  color: #f5222d; /* 红色 */
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .class-analysis-container {
    padding: 10px;
  }
  
  .search-container {
    :deep(.ant-space) {
      display: flex;
      flex-wrap: wrap;
    }
    
    :deep(.ant-space-item) {
      margin-bottom: 8px;
      width: 100%;
    }
    
    :deep(.ant-select),
    :deep(.ant-auto-complete) {
      width: 100% !important;
    }
  }
}
</style>
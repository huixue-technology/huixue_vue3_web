<template>
  <div class="filter-item">
    <span class="filter-label">成绩区间筛选：</span>
    
    <!-- 左侧：类型选择（分数/段次/班级排名） -->
    <a-dropdown 
      :visible="typeVisible" 
      @visibleChange="handleTypeVisibleChange"
      placement="bottomLeft"
    >
      <a-button 
        class="filter-btn" 
        :class="{ 'active': typeVisible }"
      >
        {{ currentTypeText }}
        <a-icon type="caret-down" :rotate="typeVisible ? 180 : 0" />
      </a-button>
      <template #overlay>
        <a-menu @click="handleTypeSelect">
          <a-menu-item key="score">分数</a-menu-item>
		  <a-menu-item key="classRank">班次</a-menu-item>
          <a-menu-item key="gradeRank">段次</a-menu-item>
          
        </a-menu>
      </template>
    </a-dropdown>

    <!-- 右侧：区间选择 -->
    <a-dropdown 
      :visible="rangeVisible" 
      @visibleChange="handleRangeVisibleChange"
      placement="bottomLeft"
      :disabled="!selectedType"
    >
      <a-button 
        class="filter-btn" 
        :class="{ 'active': rangeVisible, 'disabled': !selectedType }"
      >
        {{ currentRangeText }}
        <a-icon type="caret-down" :rotate="rangeVisible ? 180 : 0" />
      </a-button>
      <template #overlay>
        <div class="range-panel">
          <!-- 自定义区间输入行 -->
          <div class="range-input-row">
            <a-input-number 
              v-model:value="rangeStart" 
              placeholder="开始" 
              class="range-input"
              :min="0"
              @change="handleRangeChange"
            />
            <span class="range-separator">-</span>
            <a-input-number 
              v-model:value="rangeEnd" 
              placeholder="结束" 
              class="range-input"
              :min="rangeStart || 0"
              @change="handleRangeChange"
            />
          </div>
          
          <!-- 重置按钮 -->
          <div class="reset-container">
            <a-button 
              class="reset-btn"
              @click="handleReset"
            >
              重置
            </a-button>
          </div>
        </div>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

// 定义组件props
const props = defineProps<{
  // 当前选中的类型：分数/段次/班级排名
  selectedType?: 'score' | 'gradeRank' | 'classRank' | null;
  // 当前选中的区间
  selectedRange?: {
    start: number;
    end: number;
  } | null;
  // 最大可能值（根据类型动态变化）
  maxValue?: {
    score?: number;
    gradeRank?: number;
    classRank?: number;
  };
  classId?: string;
  selectedExamId?: string;
  subject?: string;
  orderDirection?: string;
  passLineOffset?: number;
  passLineId?: number;
  studentId?: string;
}>();

// 定义组件事件
const emit = defineEmits<{
  (e: 'update:selectedType', value: 'score' | 'gradeRank' | 'classRank' | null): void;
  (e: 'update:selectedRange', value: { start: number; end: number } | null): void;
  (e: 'filterChange', data: { 
    type?: 'score' | 'gradeRank' | 'classRank' | null;
    range?: { start: number; end: number } | null;
    class_id?: string;
    selected_exam_id?: string;
    subject?: string;
    order_direction?: string;
    min_score?: number;     
    max_score?: number;   
    min_rank?: number;      
    max_rank?: number;     
    min_class_rank?: number; 
    max_class_rank?: number; 
    pass_line_offset?: number;
    pass_line_id?: number;
    student_id?: string;
  }): void;
}>();

// 状态管理
const typeVisible = ref(false);
const rangeVisible = ref(false);
const selectedType = ref<typeof props.selectedType>(props.selectedType || null);
const rangeStart = ref<number | undefined>(props.selectedRange?.start);
const rangeEnd = ref<number | undefined>(props.selectedRange?.end);

// 动态计算当前选中的类型文本
const currentTypeText = computed(() => {
  switch (selectedType.value) {
    case 'score':
      return '分数';
    case 'gradeRank':
      return '段次';
    case 'classRank':
      return '班次';
    default:
      return '选择类型';
  }
});

// 动态计算当前选中的区间文本
const currentRangeText = computed(() => {
  if (!rangeStart.value || !rangeEnd.value) {
    return '填写区间';
  }
  
  return `${rangeStart.value}-${rangeEnd.value}`;
});

// 监听props变化
watch(() => props.selectedType, (val) => {
  selectedType.value = val;
});

watch(() => props.selectedRange, (val) => {
  rangeStart.value = val?.start;
  rangeEnd.value = val?.end;
});

// 重置区间选择
const resetRangeValues = () => {
  rangeStart.value = undefined;
  rangeEnd.value = undefined;
};

// 处理重置按钮
const handleReset = () => {
  resetRangeValues();
  emit('update:selectedRange', null);
  emit('filterChange', { 
    type: selectedType.value, 
    range: null,
    class_id: props.classId,
    selected_exam_id: props.selectedExamId,
    subject: props.subject,
    order_direction: props.orderDirection,
    pass_line_offset: props.passLineOffset,
    pass_line_id: props.passLineId,
    student_id: props.studentId,
    // 重置时清除所有区间参数
    min_score: undefined,
    max_score: undefined,
    min_rank: undefined,
    max_rank: undefined,
    min_class_rank: undefined,
    max_class_rank: undefined
  });
  rangeVisible.value = false;
};

// 类型选择显示控制
const handleTypeVisibleChange = (visible: boolean) => {
  typeVisible.value = visible;
  if (visible) rangeVisible.value = false;
};

// 区间选择显示控制
const handleRangeVisibleChange = (visible: boolean) => {
  if (selectedType.value) {
    rangeVisible.value = visible;
    if (visible) typeVisible.value = false;
  }
};

// 类型选择处理
const handleTypeSelect = ({ key }: { key: string }) => {
  const type = key as 'score' | 'gradeRank' | 'classRank';
  
  selectedType.value = type;
  emit('update:selectedType', type);
  
  // 选择类型后不默认选择区间，保持为空
  resetRangeValues();
  emit('update:selectedRange', null);
  
  emit('filterChange', {
    type,
    range: null,
    class_id: props.classId,
    selected_exam_id: props.selectedExamId,
    subject: props.subject,
    order_direction: props.orderDirection,
    pass_line_offset: props.passLineOffset,
    pass_line_id: props.passLineId,
    student_id: props.studentId,
    min_score: undefined,
    max_score: undefined,
    min_rank: undefined,
    max_rank: undefined,
    min_class_rank: undefined,
    max_class_rank: undefined
  });
  
  typeVisible.value = false;
};

// 区间输入变化处理
const handleRangeChange = () => {
  if (rangeStart.value !== undefined && rangeEnd.value !== undefined && selectedType.value) {
    const range = {
      start: rangeStart.value,
      end: rangeEnd.value
    };
    
    const filterData: Parameters<typeof emit>[1][1] = {
      type: selectedType.value,
      range,
      class_id: props.classId,
      selected_exam_id: props.selectedExamId,
      subject: props.subject,
      order_direction: props.orderDirection,
      pass_line_offset: props.passLineOffset,
      pass_line_id: props.passLineId,
      student_id: props.studentId,
      // 清除所有区间相关参数，避免冲突
      min_score: undefined,
      max_score: undefined,
      min_rank: undefined,
      max_rank: undefined,
      min_class_rank: undefined,
      max_class_rank: undefined
    };
    
    // 根据类型设置对应的参数
    if (selectedType.value === 'score') {
      filterData.min_score = range.start;
      filterData.max_score = range.end;
    } else if (selectedType.value === 'gradeRank') {
      filterData.min_rank = range.start;
      filterData.max_rank = range.end;
    } else if (selectedType.value === 'classRank') {
      filterData.min_class_rank = range.start;
      filterData.max_class_rank = range.end;
    }
    
    emit('update:selectedRange', range);
    emit('filterChange', filterData);
  }
};
</script>

<style scoped>
.filter-label {
  width: 100px;
  font-weight: 600;
  color: #333;
  margin-right: 8px;
  white-space: nowrap;
}

.filter-btn {
  border: 1px solid #e5e6eb;
  background: #fff;
  color: #333;
  padding: 4px 12px;
  border-radius: 4px;
  transition: all 0.2s;
  margin-right: 8px;
}

.filter-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #e6f7ff;
}

.filter-btn.active {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.filter-btn.disabled {
  background: #f5f5f5;
  color: #ccc;
  cursor: not-allowed;
  border-color: #e5e6eb;
}

.filter-btn.disabled:hover {
  background: #f5f5f5;
  color: #ccc;
  border-color: #e5e6eb;
}

.range-panel {
  padding: 16px;
  width: 320px;
  background-color: #fff;
}

.range-input-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.range-input {
  flex: 1;
}

.range-separator {
  padding: 0 4px;
  color: #666;
}

.reset-container {
  display: flex;
  justify-content: flex-end;
}

.reset-btn {
  border: 1px solid #e5e6eb;
  color: #666;
}

::v-deep .ant-dropdown-menu {
  background-color: #fff !important;
}
</style>
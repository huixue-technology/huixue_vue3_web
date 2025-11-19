<template>
  <div class="filter-item">
    <span class="filter-label">分数线筛选：</span>
    <a-dropdown 
      :visible="scoreLineVisible" 
      @visibleChange="handleScoreLineVisibleChange"
      placement="bottomLeft"
    >
      <a-button 
        class="filter-btn" 
        :class="{ 'active': scoreLineVisible }"
      >
        {{ currentPassLineText }}
        <a-icon type="caret-down" :rotate="scoreLineVisible ? 180 : 0" />
      </a-button>
      <template #overlay>
        <a-menu @click="handleScoreLineSelect">
          <a-menu-item key="">不选择分数线</a-menu-item>
          <a-menu-item 
            v-for="line in passLineList" 
            :key="line.id"
            :value="line.id"
          >
            {{ line.line_name }}({{ line.sum_ }}分)
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
    <a-dropdown 
      :visible="offsetVisible" 
      @visibleChange="handleOffsetVisibleChange"
      placement="bottomLeft"
    >
      <a-button 
        class="filter-btn" 
        :class="{ 'active': offsetVisible }"
      >
        {{ currentOffsetText }}
        <a-icon type="caret-down" :rotate="offsetVisible ? 180 : 0" />
      </a-button>
      <template #overlay>
        <div class="offset-panel">
          <div class="input-row">
            <a-input-number 
              v-model:value="customOffset" 
              placeholder="输入上下范围" 
              class="custom-input"
              :min="0"
              @change="handleCustomInputChange"
            />
          </div>
          
          <div class="divider"></div>
          <div class="numbers-grid">
            <a-button 
              v-for="num in offsetNumbers" 
              :key="num"
              class="number-btn"
              :class="{ 'selected': selectedOffset === num }"
              @click="handleNumberSelect(num)"
            >
              {{ num }}分
            </a-button>
          </div>
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
  passLineOffset: number;
  selectedPassLineId: string | number | null;
  passLineList: Array<{ id: string | number; line_name: string; sum_: number }>;
}>();

// 定义组件事件
const emit = defineEmits<{
  (e: 'update:passLineOffset', value: number): void;
  (e: 'update:selectedPassLineId', value: string | number | null): void;
  (e: 'filterChange', data: { 
    id?: string | number | null;
    offset?: number 
  }): void;
}>();

// 状态管理
const scoreLineVisible = ref(false);
const offsetVisible = ref(false);
const customOffset = ref<number>();
const selectedOffset = ref<number | null>(null);
const offsetNumbers = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// 动态计算当前选中的偏移量文本
const currentOffsetText = computed(() => {
  return selectedOffset.value !== null && selectedOffset.value !== undefined 
    ? `${selectedOffset.value}分` 
    : '上下范围';  
});

// 动态计算当前选中的分数线文本
const currentPassLineText = computed(() => {
  if (props.selectedPassLineId === null || props.selectedPassLineId === '') {
    return '选择分数线';  
  }
  const selectedLine = props.passLineList.find(line => line.id === props.selectedPassLineId);
  return selectedLine ? selectedLine.line_name : '选择分数线'; 
});

// 监听props变化 
watch(() => props.selectedPassLineId, (val) => {
  if (val === null || val === '') {
    resetOffsetValues();
  } else {
    setDefaultOffset();
  }
});

// 重置偏移量选择
const resetOffsetValues = () => {
  customOffset.value = undefined;
  selectedOffset.value = null;
};

// 设置默认偏移量为10的方法
const setDefaultOffset = () => {
  selectedOffset.value = 10;
  customOffset.value = 10;
  emit('update:passLineOffset', 10);
  emit('filterChange', { offset: 10 });
};

// 处理重置按钮
const handleReset = () => {
  resetOffsetValues();
  emit('update:passLineOffset', 0);
  emit('filterChange', { offset: null });
  offsetVisible.value = false;
};

// 分数线筛选显示控制
const handleScoreLineVisibleChange = (visible: boolean) => {
  scoreLineVisible.value = visible;
  if (visible) offsetVisible.value = false;
};

// 偏移量筛选显示控制
const handleOffsetVisibleChange = (visible: boolean) => {
  offsetVisible.value = visible;
  if (visible) scoreLineVisible.value = false;
};

// 分数线选择处理
const handleScoreLineSelect = ({ key }: { key: string }) => {
  const selectedId = key === '' ? null : key;
  emit('update:selectedPassLineId', selectedId);
  
  // 选择具体分数线时设置默认偏移量
  if (selectedId) {
    setDefaultOffset();
    emit('filterChange', { id: selectedId, offset: 10 });
  } else {
    emit('filterChange', {});
  }
  
  scoreLineVisible.value = false;
};

// 自定义偏移量输入处理
const handleCustomInputChange = (value: number) => {
  if (value !== null && value !== undefined) {
    selectedOffset.value = value;
    emit('update:passLineOffset', value);
    emit('filterChange', { offset: value });
  }
};

// 数字选项选择处理
const handleNumberSelect = (num: number) => {
  selectedOffset.value = num;
  customOffset.value = num;
  emit('update:passLineOffset', num);
  emit('filterChange', { offset: num });
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

.offset-panel {
  padding: 16px;
  width: 300px;
}

.input-row {
  margin-bottom: 12px;
}

.custom-input {
  width: 100%;
}

::v-deep .ant-dropdown-menu {
  background-color: #fff !important;
}

.offset-panel {
  background-color: #fff;
}

.divider {
  height: 1px;
  background-color: #e5e6eb;
  margin: 12px 0;
}

.numbers-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.number-btn {
  border: 1px solid #e5e6eb;
  background: #fff;
  color: #333;
  padding: 4px 0;
}

.number-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #e6f7ff;
}

.number-btn.selected {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.reset-container {
  display: flex;
  justify-content: flex-end;
}

.reset-btn {
  border: 1px solid #e5e6eb;
  color: #666;
}
</style>
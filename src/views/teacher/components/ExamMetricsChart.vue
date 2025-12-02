<template>
  <div class="section">
    <a-row>
        <div class="section-title">考试指标折线图</div>
        <!-- 添加选择器 -->
        <div class="selector-container">
        <a-select 
            v-model:value="selectedMetric" 
            style="width: 100%" 
            placeholder="请选择要查看的指标"
            :options="metricSelectOptions"
        >
        </a-select>
        </div>
    </a-row>
    
    <!-- 显示选中的图表 -->
    <a-row :gutter="16">
      <a-col :span="24">
        <a-card class="chart-card" :title="selectedMetricItem.title">
          <div class="chart-wrapper">
            <e-charts :option="selectedMetricItem.option" />
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  studentGradesData: any[];
  metricLabelMap: Record<string, string>;
}>();

const selectedMetric = ref('average');

const metricOptionsList = computed(() => {
  const list = Array.isArray(props.studentGradesData) ? props.studentGradesData : [];
  const examSet = new Set<string>();
  list.forEach((item: any) => {
    const examAnalysis = item?.exam_analysis || {};
    Object.keys(examAnalysis).forEach((examKey) => examSet.add(examKey));
  });
  const examKeys = Array.from(examSet).sort((a, b) => Number(a) - Number(b));
  
  const findSumMetrics = (examKey: string) => {
    for (const item of list) {
      const subjects = item?.exam_analysis?.[examKey];
      if (subjects && subjects.sum_) return subjects.sum_;
    }
    return {} as any;
  };
  
  const buildOption = (metricKey: keyof typeof props.metricLabelMap) => {
    const xAxisData = examKeys;
    const seriesData = examKeys.map((examKey) => {
      const sumObj = findSumMetrics(examKey);
      return Number(sumObj?.[metricKey] ?? 0);
    });
    
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { data: [props.metricLabelMap[metricKey]] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: xAxisData },
      yAxis: { type: 'value' },
      series: [{ name: props.metricLabelMap[metricKey], type: 'line', data: seriesData, symbol: 'circle', symbolSize: 6 }]
    };
  };
  
  const result = [
    { key: 'average', title: '平均分趋势', option: buildOption('average') },
    { key: 'averageD', title: '平均分排名趋势', option: buildOption('averageD') },
    { key: 'zScore', title: 'Z分数趋势', option: buildOption('zScore') },
    { key: 'tScore', title: 'T分数趋势', option: buildOption('tScore') },
    { key: 'classStd', title: '班级标准差趋势', option: buildOption('classStd') },
    { key: 'classCV', title: '班级变异系数趋势', option: buildOption('classCV') }
  ];
  
  return result;
});

// 下拉选项
const metricSelectOptions = computed(() => {
  return metricOptionsList.value.map(item => ({
    label: item.title,
    value: item.key
  }));
});

// 当前选中的指标项
const selectedMetricItem = computed(() => {
  return metricOptionsList.value.find(item => item.key === selectedMetric.value) || metricOptionsList.value[0];
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

.selector-container {
  margin-bottom: 16px;
  padding: 0 8px;
}

.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  :deep(.ant-card-body) {
    height: 400px;
  }
  :deep(.ant-card-head) {
    border-bottom: 1px solid #f0f0f0;
  }
  :deep(.ant-card-head-title) {
    font-size: 16px;
    font-weight: 500;
  }
}

.chart-wrapper {
  height: 360px;
  width: 100%;
}
</style>
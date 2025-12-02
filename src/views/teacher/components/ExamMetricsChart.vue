<template>
  <div class="section">
    <a-row :gutter="16">
        <div class="section-title">考试指标折线图</div>
        <!-- 添加选择器 -->
        <a-select 
        v-model:value="selectedSubject" 
        style="margin-left: 10px;" 
        placeholder="请选择科目"
        :options="subjectSelectOptions"
        >
        </a-select>
        <a-select 
        v-model:value="selectedMetric" 
        style="width: 200px;margin-left: 10px;" 
        placeholder="请选择要查看的指标"
        :options="metricSelectOptions"
        >
        </a-select>
    </a-row>
    <a-row>
        <a-col :span="24" style="margin-bottom: 20px;margin-top: 10px;">
            <div class="horizontal-list">
                <div class="list-item">
                    <div class="item-title">平均分</div>
                    <div class="item-description">平均分是所有学生成绩的平均值，反映了班级整体的水平。</div>
                </div>
                <div class="list-item">
                    <div class="item-title">平均分排名</div>
                    <div class="item-description">平均分排名是根据平均分对班级进行排名，反映了班级在同年级的水平。</div>
                </div>
                <div class="list-item">
                    <div class="item-title">Z分数</div>
                    <div class="item-description">Z分数是将原始分数转换为标准正态分布中的分数，反映了分数在班级中的相对水平。</div>
                </div>
                <div class="list-item">
                    <div class="item-title">T分数</div>
                    <div class="item-description">T分数是将原始分数转换为标准正态分布中的分数，反映了分数在班级中的相对水平。</div>
                </div>
                <div class="list-item">
                    <div class="item-title">班级标准差</div>
                    <div class="item-description">班级标准差是衡量班级成绩离散程度的统计量，反映了班级成绩的波动范围。</div>
                </div>
                <div class="list-item">
                    <div class="item-title">班级变异系数</div>
                    <div class="item-description">班级变异系数是衡量班级成绩离散程度的统计量，反映了班级成绩的波动范围。</div>
                </div>
            </div>
        </a-col>
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
  classInfo?: {
    subject_selection: string;
  };
}>();

const selectedSubject = ref('sum_'); // 默认选择总分
const selectedMetric = ref('average');

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
  
  return map;
});

// 科目选择选项
const subjectSelectOptions = computed(() => {
  return Object.entries(subjectMap.value).map(([key, label]) => ({
    label,
    value: key
  }));
});

const metricOptionsList = computed(() => {
  const list = Array.isArray(props.studentGradesData) ? props.studentGradesData : [];
  const examSet = new Set<string>();
  list.forEach((item: any) => {
    const examAnalysis = item?.exam_analysis || {};
    Object.keys(examAnalysis).forEach((examKey) => examSet.add(examKey));
  });
  const examKeys = Array.from(examSet).sort((a, b) => Number(a) - Number(b));
  
  const findSubjectMetrics = (examKey: string, subject: string) => {
    for (const item of list) {
      const subjects = item?.exam_analysis?.[examKey];
      if (subjects && subjects[subject]) return subjects[subject];
    }
    return {} as any;
  };
  
  const buildOption = (metricKey: keyof typeof props.metricLabelMap) => {
    const xAxisData = examKeys;
    const seriesData = examKeys.map((examKey) => {
      const subjectObj = findSubjectMetrics(examKey, selectedSubject.value);
      return Number(subjectObj?.[metricKey] ?? 0);
    });
    
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { data: [`${subjectMap.value[selectedSubject.value]}${props.metricLabelMap[metricKey]}`] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: xAxisData },
      yAxis: { type: 'value' },
      series: [{ 
        name: `${subjectMap.value[selectedSubject.value]}${props.metricLabelMap[metricKey]}`, 
        type: 'line', 
        data: seriesData, 
        symbol: 'circle', 
        symbolSize: 6,
        smooth: true
      }],
      label: {
        show: true,
        position: 'top',
      }
    };
  };
  
  const result = [
    { key: 'average', title: `${subjectMap.value[selectedSubject.value]}平均分趋势`, option: buildOption('average') },
    { key: 'averageD', title: `${subjectMap.value[selectedSubject.value]}平均分排名趋势`, option: buildOption('averageD') },
    { key: 'zScore', title: `${subjectMap.value[selectedSubject.value]}Z分数趋势`, option: buildOption('zScore') },
    { key: 'tScore', title: `${subjectMap.value[selectedSubject.value]}T分数趋势`, option: buildOption('tScore') },
    { key: 'classStd', title: `${subjectMap.value[selectedSubject.value]}班级标准差趋势`, option: buildOption('classStd') },
    { key: 'classCV', title: `${subjectMap.value[selectedSubject.value]}班级变异系数趋势`, option: buildOption('classCV') }
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

.horizontal-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.list-item {
  flex: 1;
  min-width: 200px;
  padding: 10px;
  border: 1px solid #f0f0f0;
  text-align: left;
  border-radius: 4px;
  background-color: #fafafa;
}

.item-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.item-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}
</style>
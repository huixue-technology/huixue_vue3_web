<template>
  <div class="section">
    <div class="section-title">分数线过线率</div>
    <a-row :gutter="16">
      <a-col :xs="24" :md="12">
        <a-card class="chart-card" title="过线率雷达图">
          <div class="chart-wrapper">
            <e-charts :option="passLineRadarOption" />
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="12">
        <a-row :gutter="16">
          <a-col :xs="12" :md="12">
            <a-card class="stat-card">
              <a-statistic title="一本线" :value="(passLineRateData.first_line_rate || 0)" :precision="2" suffix="%" />
            </a-card>
          </a-col>
          <a-col :xs="12" :md="12">
            <a-card class="stat-card">
              <a-statistic title="二本线" :value="(passLineRateData.second_line_rate || 0)" :precision="2" suffix="%" />
            </a-card>
          </a-col>
          <a-col :xs="12" :md="12">
            <a-card class="stat-card">
              <a-statistic title="专科线" :value="(passLineRateData.junior_college_line_rate || 0)" :precision="2" suffix="%" />
            </a-card>
          </a-col>
          <a-col :xs="12" :md="12">
            <a-card class="stat-card">
              <a-statistic title="平均分线" :value="(passLineRateData.average_line_rate || 0)" :precision="2" suffix="%" />
            </a-card>
          </a-col>
        </a-row>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  passLineRateData: any;
}>();

const passLineRadarOption = computed(() => {
  const first = Number(props.passLineRateData?.first_line_rate || 0);
  const second = Number(props.passLineRateData?.second_line_rate || 0);
  const junior = Number(props.passLineRateData?.junior_college_line_rate || 0);
  const avg = Number(props.passLineRateData?.average_line_rate || 0);
  
  return {
    tooltip: {},
    radar: {
      indicator: [
        { name: '一本线', max: 100 },
        { name: '二本线', max: 100 },
        { name: '专科线', max: 100 },
        { name: '平均分线', max: 100 }
      ]
    },
    series: [{
      type: 'radar',
      data: [{ value: [first, second, junior, avg], name: '过线率' }]
    }]
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

.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  :deep(.ant-card-body) {
    height: 360px;
  }
}

.chart-wrapper {
  height: 320px;
  width: 100%;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  :deep(.ant-statistic-title) { color: #595959; }
}
</style>
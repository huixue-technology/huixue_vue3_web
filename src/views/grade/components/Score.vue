<template>
    <div>
        <e-charts class="scoreCharts" :option="scoreOption" />
    </div>

</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps({
  gradeData: {
    type: Array,
    default: () => []
  }
});

const scoreOption = computed(() => {
  const subjects = props.gradeData.map((item: any) => item.name);
  const scores = props.gradeData.map((item: any) => item.sum_);

  return {
    title: {
      text: '成绩统计图',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
        orient: 'vertical',
        left: 'right',
      data: ['成绩']
    },
    xAxis: {
      type: 'category',
      data: subjects
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '成绩',
        type: 'bar',
        data: scores,
        label: {
          show: true,
          position: 'top',
          formatter: '{c}'
        },
        itemStyle: {
          color: '#5470C6'
        }
      }
    ]
  };
});
</script>

<style scoped lang="less">
.scoreCharts {
    height: 400px;
    overflow-x: auto;
    padding: 20px;
}
</style>
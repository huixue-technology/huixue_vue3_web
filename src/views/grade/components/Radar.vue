<template>
  <div class="radar-wrapper">
    <v-chart class="radar-chart" :option="chartOption" autoresize />
    <div class="analysis-footer">
        <span class="icon">💡</span>
        <span class="text">综合分析：本次考试总分较上次考试退步，语文、数学、外语、综合科均较上次考试退步。</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';

const props = defineProps<{
  studentInfo: any,
  compareScoreData: number[],
  currentExamData: number[],
  subjects?: Array<{ name: string; max: number }>
}>();

const indicators = computed(() => {
  if (props.subjects && props.subjects.length) return props.subjects;
  const base = [
    { name: '语文', max: 150 },
    { name: '英语', max: 150 },
    { name: '数学', max: 150 }
  ];
  const result = [...base];
  const extra = [{ n: '物', v: '物理' }, { n: '化', v: '化学' }, { n: '生', v: '生物' }, { n: '史', v: '历史' }, { n: '地', v: '地理' }, { n: '政', v: '政治' }];
  for (const i of extra) {
    if (props.studentInfo?.subject_selection?.includes(i.n)) {
      result.push({ name: i.v, max: 100 });
    }
  }
  return result;
});

const chartOption = computed(() => {
  const inds = indicators.value;

  return {
    radar: {
      indicator: inds,
    },
    
    legend:{
      show:true,
      data: ['对比考试','当前考试'],
      top:'0%',
      left: '0%'
    },
    textStyle: {
          fontSize: 20,
          fontFamily: "Source Han Sans CN",
          fontWeight: "bold",
          color: "#333333",
        },
    series: [
      {
        name: '对比考试',
        type: 'radar',
        data: [{
          name:'对比考试',
          value: props.compareScoreData.map(item=>item)
        }],
        lineStyle: { color: '#1890ff' },
        itemStyle: { color: '#1890ff' },
        areaStyle: { color: 'rgba(24, 144, 255, 0.2)' },
        label: {
          normal: {
          show: true,
          formatter: function (params:any) {
            return params.value;
          }
          }
        }
      },{
        name: '当前考试',
        type: 'radar',
        data: [{
          name:'当前考试',
          value: props.currentExamData.map(item=>item),
        }],
        lineStyle: { color: 'red' },
        itemStyle: { color: 'red' },
        areaStyle: { color: 'rgba(255, 77, 79, 0.2)' },
        label: {
          normal: {
          show: true,
          formatter: function (params:any) {
            return params.value;
          }
          }
        }
      }
    ]
  };
});
</script>

<style scoped lang="less">
.radar-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 16px;
}

.radar-chart {
  width: 100%;
  min-height: 400px;
  flex: 1;
}

.analysis-footer {
  background-color: #EFF6FF; // Blue 50
  border: 1px solid #DBEAFE; // Blue 200
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 13px;
  color: #1E40AF; // Blue 800
  line-height: 1.5;

  .icon {
    font-size: 16px;
  }
}

@media (max-width: 768px) {
  .radar-chart {
    min-height: 350px;
  }
}
</style>

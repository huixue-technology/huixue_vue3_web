<template>
  <div class="chart-container">
    <v-chart class="radar-chart" :option="chartOption" autoresize />
    <div class="description">综合分析：本次考试总分较上次考试退步，语文、数学、外语、综合科均较上次考试退步。</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VChart from 'vue-echarts';
import subjects_inflection from '@/utils/inflection';

const props = defineProps<{
  studentInfo: any,
  compareScoreData: number[],
  currentExamData: number[],
}>();

// 根据选科动态确定科目名称
const dynamicSubjectNames = computed(() => {
  let subjects = [
    {name: '语文', max: 150},
    {name: '英语', max: 150},
    {name: '数学', max: 150}
  ]
  for (let i  of [{name:'物',value:'物理'},{name:'化',value:'化学'}, {name:'生',value:'生物'},{name:'史',value:'历史'},{name:'地',value:'地理'},{name:'政',value:'政治'}]) {
    if(props.studentInfo && props.studentInfo.subject_selection && props.studentInfo.subject_selection.includes(i.name)) {
      subjects.push({name: i.value, max: 100})
    }
  }
  return subjects
});

// ECharts 雷达图配置
const chartOption = computed(() => {
  // 创建 indicator 配置
  const indicators = dynamicSubjectNames.value;

  return {
    radar: {
      indicator: indicators,
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
        // 在这里配置显示数值
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
        // 在这里配置显示数值
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

<style scoped>
.chart-container {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.radar-chart {
  width: 100%;
  min-height: 500px;
  font-size: larger;
}

.description {
  margin-top: 10px;
  font-size: 0.9em;
}

@media (max-width: 768px) {
  .chart-container {
    padding: 15px;
  }
  
  .radar-chart {
    min-height: 400px;
  }
}
</style>
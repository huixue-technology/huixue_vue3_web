<template>
 <div>
    <e-charts class="rankCharts" :option="rankOption" />  
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

const rankOption = computed(() => {
  const subjects = props.gradeData.map((item: any) => item.name);
  const classRanks = props.gradeData.map((item: any) => item.sumB);
  const gradeRanks = props.gradeData.map((item: any) => item.sumD);
  console.log(classRanks)
  return{
    title: {
      text: '排名统计图',
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
        left: 'left',
        data: ['班级排名', '年级排名'] // 添加这一行
    },
    xAxis:{
      type:'category',
      data:subjects
    },
    yAxis:{
      type:'value',
      inverse: true, // 排名越小越好，所以Y轴反向
      min: 1, // 排名从1开始
    },
    series:[
      {
        value:'班级排名',
        name:'班级排名',
        type:'line',
        data:classRanks,
        label: {
          show: true,
          position: 'top',
          formatter: '{c}'
        },
        itemStyle: {
          color: 'red' // 班级排名颜色
        },
        lineStyle: {
          color: 'red' // 班级排名线条颜色
        }
      },
      {
        name:'年级排名',
        type:'line',
        data:gradeRanks,
        label: {
          show: true,
          position: 'top',
          formatter: '{c}'
        },
        itemStyle: {
          color: 'blue' // 年级排名颜色
        },
        lineStyle: {
          color: 'blue' // 年级排名线条颜色
        }
      }
    ]
  }
})
</script>

<style scoped lang="less">
.rankCharts {
    height: 400px;
    width: 100%;
    padding: 20px;
    overflow: auto;
    overflow-x: visible;
}

</style>
<template>
 <div class="container">
    <a-row>
         <a-col :span="12" :offset="6">
            <span style="font-size: 25px;">
                ⏳距离高考还有<span style="font-size: 40px;font-weight: 800;">100</span>天
            </span>
         </a-col>
    </a-row>
    <div class="select">
        <h4>选择查询考试：</h4>
       <a-select
            placeholder="请选择考试"
            style="width: 120px"
            @change="handleChange"
            v-model:value="currentExamId"
        >
            <a-select-option v-for="item in examList" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
        </a-select> 
    </div>
    <a-table
        :columns="tableColumns"
        :data-source="tableData"
        :pagination="false"
    >

    </a-table>

        
    <a-row>
        <a-col :span="12" class="rank_chart_bar">
            <h3 style="margin-left: 20px;margin-top: 20px;">排名统计图</h3>
            <e-charts class="rankCharts" :option="rankOption" />    
        </a-col>
        <a-col :span="12">成绩统计图</a-col>
    </a-row>
 </div>
</template>

<script setup lang="ts">
import { ref,computed } from 'vue';

interface Exam {
    id:string,
    name:string
} 

const examList = ref<Exam[]>([
    {
        id:'1',
        name:'5.22周考'
    },
])


const tableColumns = [
    {
        title:'科目',
        dataIndex:'name'
    },
    {
        title: '成绩',
        dataIndex:'sum_'
    },
    {
        title: '班级排名',
        dataIndex:'sumB',
    },{
        title: '年级排名',
        dataIndex: 'sumD',
    },{
        title : '班级最高分',
        dataIndex: 'maxB',
    },{
        title: '一本线',
        dataIndex: 'passLine',
    }
]

const tableData = ref([
    {
        name:'总分',
        sum_:'429.0',
        sumB: '65',
        sumD: '322',
        maxB: '593.0',
        passLine: '429.0',
    },
    {
        name:'语文',
        sum_:'101',
        sumB: '11',
        sumD: '16',
        maxB: '111',
        passLine: '90',
    },
    {
        name:'英语',
        sum_:'100',
        sumB: '10',
        sumD: '10',
        maxB: '110',
        passLine: '90',
    },
    {
        name:'数学',
        sum_:'100',
        sumB: '10',
        sumD: '10',
        maxB: '110',
        passLine: '90',
    },
    {
        name:'物理',
        sum_:'100',
        sumB: '10',
        sumD: '10',
        maxB: '110',
        passLine: '90',
    },
    {
        name:'化学',
        sum_:'100',
        sumB: '10',
        sumD: '10',
        maxB: '110',
        passLine: '90',
    },
    {
        name:'生物',
        sum_:'100',
        sumB: '10',
        sumD: '10',
        maxB: '110',
        passLine: '90',
    },
    
])

const currentExamId = ref<string>('1')


//模拟数据value的字段对应Y轴，name字段对应X轴
  const data=ref([
    {value:11,name:'A'},
    {value:31,name:'B'},
    {value:75,name:'C'},
    {value:25,name:'D'},
    {value:16,name:'E'},
  ])

const rankOption = computed(() => {
  return{
    xAxis:{
      type:'category',
      data:data.value.map(v=>v.name)
    },
    yAxis:{
      type:'value',
    },
    series:[
      {
        type:'line',
        data:data.value.map(v=>v.value)
      }
    ]
  }
})
const handleChange = (value:string) => {
    console.log(`selected ${value}`);
}

</script>

<style scoped lang="less">

.container{
    position:relative;
    height: 100vh;
    overflow:scroll;
    padding: 20px;
    padding-bottom: 0px;
    .calendar {
        padding: 10px;
        width: 400px;
        border-radius: 20px;
        background-color: #e6e0e0;
   
    }
    .select {
        display: flex;
        flex-direction: row;
        line-height: 30px;
        white-space: space-between;
   
    }
}
.rankCharts {
    height: 600px !important;

}
.rank_chart_bar {
    text-align: left;
    }
</style>
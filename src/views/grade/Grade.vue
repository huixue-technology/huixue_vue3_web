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
            style="width: auto"
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
            <rank :gradeData="tableData"/> 
        </a-col>
        <a-col :span="12" class="rank_chart_bar">
            <score :gradeData="tableData"/>
        </a-col>
    </a-row>
 </div>
</template>

<script setup lang="ts">
import { getGradeApi } from '@/servers/api/grade';
import { getStudentExamApi } from '@/servers/api/student';
import { ref,computed,onMounted } from 'vue';
import { useUserStore } from '@/store';
import rank from './components/Rank.vue'
import score from './components/Score.vue'
interface Exam {
    id:string,
    name:string
}
type TableData = {
    name: string;
    sum_: number;
    sumB: number;
    sumD: number;
    maxB: number;
    passLine: number;
}; 
const tableData = ref<TableData[]>([])
const examList = ref<Exam[]>([])
const currentExamId = ref<string>()
onMounted(() => {
    // 从store中获取用户信息
    const userInfo = useUserStore().userInfo;
    console.log(userInfo);
    // 获取考试列表
    getStudentExamApi({student_uid:userInfo.role},[]).then(res => {
        console.log(res.data);
        res.data[0].map((item:Exam) => {
            examList.value.push({
                id:item.id,
                name:item.name
            })
        })
        
        // 默认选择第一个考试
        currentExamId.value = examList.value[0].id;
        // 获取考试成绩
        getGradeApi({student_id:userInfo.role,exam_id:parseInt(currentExamId.value)}).then(res => {
            const gradeData = res.data[0];
            handleGradeDetail(gradeData)
        })
    })
})

const handleGradeDetail = (gradeData:API.Grade) => {
    tableData.value = []
    tableData.value = [
    {
        name: '总分',
        sum_: gradeData.sum_ || 0,
        sumB: gradeData.sumB || 0,
        sumD: gradeData.sumD || 0,
        maxB: gradeData.sum_ || 0, // Assuming maxB is total score for now
        passLine: 0,
    },
    {
        name: '语文',
        sum_: gradeData.Yuwen || 0,
        sumB: gradeData.YuwenB || 0,
        sumD: gradeData.YuwenD || 0,
        maxB: gradeData.Yuwen || 0,
        passLine: 0,
    },
    {
        name: '英语',
        sum_: gradeData.Yingyu || 0,
        sumB: gradeData.YingyuB || 0,
        sumD: gradeData.YingyuD || 0,
        maxB: gradeData.Yingyu || 0,
        passLine: 0,
    },
    {
        name: '数学',
        sum_: gradeData.Shuxue || 0,
        sumB: gradeData.ShuxueB || 0,
        sumD: gradeData.ShuxueD || 0,
        maxB: gradeData.Shuxue || 0,
        passLine: 0,
    }
];
if (gradeData.Wuli != null) {
    tableData.value.push({
        name: '物理',
        sum_: gradeData.Wuli || 0,
        sumB: gradeData.WuliB || 0,
        sumD: gradeData.WuliD || 0,
        maxB: gradeData.Wuli || 0,
        passLine: 0,
    });
}
if (gradeData.Huaxue != null) {
    tableData.value.push({
        name: '化学',
        sum_: gradeData.Huaxue || 0,
        sumB: gradeData.HuaxueB || 0,
        sumD: gradeData.HuaxueD || 0,
        maxB: gradeData.Huaxue || 0,
        passLine: 0,
    })
}
if (gradeData.Shengwu!= null) {
    tableData.value.push({
        name: '生物',
        sum_: gradeData.Shengwu || 0,
        sumB: gradeData.ShengwuB || 0,
        sumD: gradeData.ShengwuD || 0,
        maxB: gradeData.Shengwu || 0,
        passLine: 0,
    });
}
if (gradeData.Lishi != null) {
    tableData.value.push({
        name: '历史',
        sum_: gradeData.Lishi || 0,
        sumB: gradeData.LishiB || 0,
        sumD: gradeData.LishiD || 0,
        maxB: gradeData.Lishi || 0,
        passLine: 0,
    });
}
if (gradeData.Dili!= null) {
    tableData.value.push({
        name: '地理',
        sum_: gradeData.Dili || 0,
        sumB: gradeData.DiliB || 0,
        sumD: gradeData.DiliD || 0,
        maxB: gradeData.Dili || 0,
        passLine: 0,
    });
}
if (gradeData.Zhengzhi != null) {
        tableData.value.push({
        name: '政治',
        sum_: gradeData.Zhengzhi || 0,
        sumB: gradeData.ZhengzhiB || 0,
        sumD: gradeData.ZhengzhiD || 0,
        maxB: gradeData.Zhengzhi || 0,
        passLine: 0,
    });
}
}




const  tableColumns = [{
        title:'科目',
        dataIndex:'name'
    },{
        title: '成绩',
        dataIndex:'sum_'
    },{
        title: '班级排名',
        dataIndex:'sumB',
    },{
        title: '年级排名',
        dataIndex: 'sumD',
    }
    // ,{
    //     title : '班级最高分',
    //     dataIndex: 'maxB',
    // },
    // {
    //     title: '一本线',
    //     dataIndex: 'passLine',
    // }
]



const handleChange = (value:string) => {
    console.log(`selected ${value}`);
}

</script>

<style scoped lang="less">

.container{

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
.rank_chart_bar {
    text-align: left;
    width: 50%;
}
</style>
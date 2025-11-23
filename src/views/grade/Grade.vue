<template>
 <div class="grade-container">
    <div class="header-section">
        <div class="countdown-section">
            <div class="countdown-box">
                <span class="countdown-label">⏳距离高考还有</span>
                <span class="countdown-days">{{ daysUntilExam }}</span>
                <span class="countdown-unit">天</span>
            </div>
        </div>
        
        <div class="select-section">
            <h2>选择查询考试：</h2>
            <a-select
                placeholder="请选择考试"
                style="width: auto;min-width: 200px"
                @change="handleChange"
                v-model:value="currentExamId"
                class="exam-select"
            >
                <a-select-option v-for="item in examList" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
            </a-select> 
        </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="main-content">
        <!-- 左侧区域 -->
        <div class="left-column">
            <div class="table-section card">
                <div class="card-header">
                    <h3 class="card-title">考试成绩</h3>
                </div>
                <div class="card-body">
                    <a-table
                        size="large"
                        :columns="tableColumns"
                        :data-source="tableData"
                        :pagination="false"
                        class="grade-table"
                    >
                    </a-table>
                </div>
            </div>
            
            <!-- 对比表格组件 -->
            <div class="compare-table-section card" v-if="examList.length > 1">
                <div class="card-header">
                    <h3 class="card-title">考试对比分析</h3>
                </div>
                <div class="card-body">
                    <compare-table 
                        :student_id="parseInt(studentId)"
                        :selected_id="parseInt(currentExamId)"
                        :exam-list="examList.slice(1)"
                        :student-info="studentInfo"
                        @update:compareScoreData="updateCompareScoreData"
                    />
                </div>
            </div>
        </div>
        
        <!-- 右侧雷达图区域 -->
        <div class="right-column">
            <div class="radar-chart-section card">
<!--                <div class="card-header">-->
<!--                    <h3 class="card-title">成绩雷达图</h3>-->
<!--                </div>-->
                <div class="card-body chart-container">
                    <radar-chart 
                        :student-info="studentInfo"
                        :compare-score-data="compareScoreData"
                        :current-exam-data="currentExamDataArray"
                    />
                </div>
            </div>
        </div>
    </div>
 </div>
</template>

<script setup lang="ts">
import { getGradeApi } from '@/servers/api/grade';
import { getStudentExamApi } from '@/servers/api/student';
import { ref, onMounted, onUnmounted, onBeforeMount, computed } from 'vue';
import { useUserStore } from '@/store/modules/user';
import router from '@/router';
import { message } from 'ant-design-vue';
import CompareTable from './components/ExamAnalysis.vue';
import RadarChart from './components/Radar.vue';
import subjects_inflection from '@/utils/inflection';

// 计算距离高考的天数
const calculateDaysUntilExam = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // 创建今年的高考日期（6月7日）
    let examDate = new Date(currentYear, 5, 7); // 月份从0开始，所以5代表6月
    
    // 如果今年的高考已经过去，就计算到明年的高考
    if (today > examDate) {
        examDate = new Date(currentYear + 1, 5, 7);
    }
    
    // 计算天数差
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
};

const currentExamData = ref<API.Grade>();
const studentId = ref('');
const studentInfo = ref<any>(null);
const daysUntilExam = ref(calculateDaysUntilExam());
const userStore = useUserStore();

// 比较考试数据
const compareScoreData = ref<number[]>([]);
const updateCompareScoreData = (data: number[]) => {
    compareScoreData.value = data;
};

// 当前考试数据数组
const currentExamDataArray = computed(() => {
    let tmp = []
    if(currentExamData.value) {
        for(let i of dynamicSubjectNames.value){
            // @ts-ignore
            tmp.push(currentExamData.value[subjects_inflection[i.name]])
        }
    }
    return tmp
});

// 根据选科动态确定科目名称
const dynamicSubjectNames = computed(() => {
    let subjects = [
        {name: '语文', max: 150},
        {name: '英语', max: 150},
        {name: '数学', max: 150}
    ]
    if (studentInfo.value) {
        for (let i  of [{name:'物',value:'物理'},{name:'化',value:'化学'}, {name:'生',value:'生物'},{name:'史',value:'历史'},{name:'地',value:'地理'},{name:'政',value:'政治'}]) {
            if(studentInfo.value.subject_selection && studentInfo.value.subject_selection.includes(i.name)) {
                subjects.push({name: i.value, max: 100})
            }
        }
    }
    return subjects
});

// 每天更新倒计时
let timer: number;
onMounted(() => {
    // 立即计算一次
    daysUntilExam.value = calculateDaysUntilExam();
    
    // 设置每天凌晨更新倒计时
    const updateAtMidnight = () => {
        const now = new Date();
        const night = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1, // 第二天
            0, 0, 0 // 0点0分0秒
        );
        const msUntilMidnight = night.getTime() - now.getTime();
        
        // 设置定时器在凌晨触发
        timer = window.setTimeout(() => {
            daysUntilExam.value = calculateDaysUntilExam();
            updateAtMidnight(); // 重新设置下一天的定时器
        }, msUntilMidnight);
    };
    
    updateAtMidnight();
});

// 组件卸载时清除定时器
onUnmounted(() => {
    if (timer) {
        clearTimeout(timer);
    }
});

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

const examList = ref<Exam[]>([])
const currentExamId = ref<string>('')

onBeforeMount(() => {
    if (!userStore.isLogin) {
        router.push('/user/login');
        return
    }

    const userInfo = userStore.getUserInfo();
    studentId.value = userInfo.role
    studentInfo.value = userInfo.student
    getStudentExamApi({student_uid:userInfo.role},[]).then(res => {
        if (res.code === 200 ) {
            res.data.map((item:Exam[]) => {
                if (Array.isArray(item) && item[0] && item[0].id && item[0].name) {
                    examList.value.push({
                    id: item[0].id,
                    name: item[0].name
                    });
                }
            })
        }
        
        // 默认选择第一个考试
        if(examList.value.length > 0){
            currentExamId.value = examList.value[0].id;
            getGradeApi({student_id:userInfo.role,exam_id:parseInt(currentExamId.value)}).then(res => {
                const gradeData = res.data[0];
                handleGradeDetail(gradeData)
            })
        }else{
            message.error('似乎还没有参加一场考试？')
            return
        }
    })
})

const handleGradeDetail = (gradeData:API.Grade) => {
    tableData.value = []
    currentExamData.value = gradeData
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
if (gradeData.Wuli != null &&  gradeData.Wuli!=0) {
    tableData.value.push({
        name: '物理',
        sum_: gradeData.Wuli || 0,
        sumB: gradeData.WuliB || 0,
        sumD: gradeData.WuliD || 0,
        maxB: gradeData.Wuli || 0,
        passLine: 0,
    });
}
if (gradeData.Huaxue != null &&  gradeData.Huaxue!=0) {
    tableData.value.push({
        name: '化学',
        sum_: gradeData.Huaxue || 0,
        sumB: gradeData.HuaxueB || 0,
        sumD: gradeData.HuaxueD || 0,
        maxB: gradeData.Huaxue || 0,
        passLine: 0,
    })
}
if (gradeData.Shengwu!= null &&  gradeData.Shengwu!=0) {
    tableData.value.push({
        name: '生物',
        sum_: gradeData.Shengwu || 0,
        sumB: gradeData.ShengwuB || 0,
        sumD: gradeData.ShengwuD || 0,
        maxB: gradeData.Shengwu || 0,
        passLine: 0,
    });
}
if (gradeData.Lishi != null &&  gradeData.Lishi!=0) {
    tableData.value.push({
        name: '历史',
        sum_: gradeData.Lishi || 0,
        sumB: gradeData.LishiB || 0,
        sumD: gradeData.LishiD || 0,
        maxB: gradeData.Lishi || 0,
        passLine: 0,
    });
}
if (gradeData.Dili!= null &&  gradeData.Dili!=0) {
    tableData.value.push({
        name: '地理',
        sum_: gradeData.Dili || 0,
        sumB: gradeData.DiliB || 0,
        sumD: gradeData.DiliD || 0,
        maxB: gradeData.Dili || 0,
        passLine: 0,
    });
}
if (gradeData.Zhengzhi != null && gradeData.Zhengzhi!=0) {
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
        dataIndex:'name',
        align: 'center',
    },{
        title: '成绩',
        dataIndex:'sum_',
        align: 'center',
    },{
        title: '班级排名',
        dataIndex:'sumB',
        align: 'center',
    },{
        title: '年级排名',
        dataIndex: 'sumD',
        align: 'center',
    }
]

const tableData = ref<TableData[]>([])

const handleChange = (value:string) => {
    currentExamId.value = value;
    // 获取考试成绩
    getGradeApi({student_id:parseInt(studentId.value),exam_id:parseInt(currentExamId.value)}).then(res => {
        const gradeData = res.data[0];
        handleGradeDetail(gradeData)
    })
}
</script>

<style scoped lang="less">
.grade-container {
    position: relative;
    height: 100vh;
    overflow-y: auto;
    padding: 20px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
    display: flex;
    flex-direction: column;
    gap: 20px;
    
    .header-section {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        align-items: center;
        justify-content: space-between;
        
        .countdown-section {
            flex: 1;
            min-width: 300px;
            
            .countdown-box {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 15px;
                padding: 20px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                text-align: center;
                
                .countdown-label {
                    font-size: 20px;
                    color: white;
                    margin-right: 10px;
                }
                
                .countdown-days {
                    font-size: 40px;
                    font-weight: 800;
                    color: white;
                }
                
                .countdown-unit {
                    font-size: 20px;
                    color: white;
                    margin-left: 5px;
                }
            }
        }
        
        .select-section {
            flex: 1;
            min-width: 300px;
            display: flex;
            flex-direction: row;
            align-items: center;
            padding: 15px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            
            h2 {
                margin: 0;
                margin-right: 20px;
                font-size: 18px;
                color: #333;
            }
            
            .exam-select {
                min-width: 200px;
            }
        }
    }
    
    .main-content {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        flex: 1;
        
        .left-column {
            flex: 1;
            min-width: 300px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            
            .card {
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                
                .card-header {
                    background: linear-gradient(120deg, #f0f2f5, #e4e7ec);
                    border-bottom: 1px solid #e8e8e8;
                    padding: 16px 20px;
                    
                    .card-title {
                        margin: 0;
                        font-size: 18px;
                        font-weight: 600;
                        color: #333;
                    }
                }
                
                .card-body {
                    padding: 20px;
                    flex: 1;
                }
            }
            
            .table-section {
                .grade-table {
                    :deep(.ant-table-thead > tr > th) {
                        background-color: #fafafa;
                        font-weight: bold;
                        text-align: center;
                    }
                    
                    :deep(.ant-table-tbody > tr > td) {
                        text-align: center;
                    }
                }
            }
        }
        
        .right-column {
            flex: 1;
            min-width: 300px;
            display: flex;
            flex-direction: column;
            
            .radar-chart-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                
                .chart-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    
                    :deep(.chart-container) {
                        flex: 1;
                        padding: 0;
                    }
                }
            }
        }
    }
}

@media (max-width: 768px) {
    .grade-container {
        padding: 10px;
        
        .header-section {
            flex-direction: column;
            
            .countdown-section {
                .countdown-box {
                    padding: 15px;
                    
                    .countdown-label {
                        font-size: 16px;
                    }
                    
                    .countdown-days {
                        font-size: 30px;
                    }
                    
                    .countdown-unit {
                        font-size: 16px;
                    }
                }
            }
            
            .select-section {
                flex-direction: column;
                align-items: flex-start;
                
                h2 {
                    margin-bottom: 10px;
                }
            }
        }
        
        .main-content {
            flex-direction: column;
        }
    }
}
</style>
<template>
 <div class="grade-container">
    <!-- 顶部导航/状态栏 -->
    <div class="dashboard-header">
        <div class="header-left">
            <h1 class="page-title">成绩分析看板</h1>
            <div class="exam-selector">
                <span class="label">当前考试：</span>
                <a-select
                    placeholder="请选择考试"
                    style="width: 240px"
                    @change="handleChange"
                    v-model:value="currentExamId"
                    class="custom-select"
                    :bordered="false"
                >
                    <a-select-option v-for="item in examList" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
                </a-select> 
            </div>
        </div>
        
        <div class="header-right">
            <div class="countdown-card">
                <div class="icon-wrapper">
                    <span role="img" aria-label="hourglass">⏳</span>
                </div>
                <div class="countdown-info">
                    <span class="label">距离高考仅剩</span>
                    <div class="number-group">
                        <span class="number">{{ daysUntilExam }}</span>
                        <span class="unit">天</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="main-content">
        <!-- 左侧数据区域 -->
        <div class="left-column">
            <!-- 成绩列表 -->
            <div class="content-card table-card">
                <div class="card-header">
                    <div class="header-title">
                        <span class="indicator"></span>
                        <h3>成绩概览</h3>
                    </div>
                    <span class="subtitle">详细得分情况</span>
                </div>
                <div class="card-body">
                    <a-table
                        :columns="tableColumns"
                        :data-source="tableData"
                        :pagination="false"
                        class="custom-table"
                        size="middle"
                        rowKey="name"
                    >
                    </a-table>
                </div>
            </div>
            
            <!-- 对比分析 -->
            <div class="content-card compare-card" v-if="examList.length > 1">
                <div class="card-header">
                     <div class="header-title">
                        <span class="indicator green"></span>
                        <h3>进退步分析</h3>
                    </div>
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
        
        <!-- 右侧图表区域 -->
        <div class="right-column">
            <div class="content-card chart-card">
                <div class="card-header">
                    <div class="header-title">
                        <span class="indicator blue"></span>
                        <h3>学科能力雷达</h3>
                    </div>
                </div>
                <div class="card-body chart-wrapper">
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
    sumb: number;
    sumd: number;
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
        sumb: gradeData.sumb || 0,
        sumd: gradeData.sumd || 0,
        maxB: gradeData.sum_ || 0, // Assuming maxB is total score for now
        passLine: 0,
    },
    {
        name: '语文',
        sum_: gradeData.yuwen || 0,
        sumb: gradeData.yuwenb || 0,
        sumd: gradeData.yuwend || 0,
        maxB: gradeData.yuwen || 0,
        passLine: 0,
    },
    {
        name: '英语',
        sum_: gradeData.yingyu || 0,
        sumb: gradeData.yingyub || 0,
        sumd: gradeData.yingyud || 0,
        maxB: gradeData.yingyu || 0,
        passLine: 0,
    },
    {
        name: '数学',
        sum_: gradeData.shuxue || 0,
        sumb: gradeData.shuxueb || 0,
        sumd: gradeData.shuxued || 0,
        maxB: gradeData.shuxue || 0,
        passLine: 0,
    }
];
if (gradeData.wuli != null &&  gradeData.wuli!=0) {
    tableData.value.push({
        name: '物理',
        sum_: gradeData.wuli || 0,
        sumb: gradeData.wulib || 0,
        sumd: gradeData.wulid || 0,
        maxB: gradeData.wuli || 0,
        passLine: 0,
    });
}
if (gradeData.huaxue != null &&  gradeData.huaxue!=0) {
    tableData.value.push({
        name: '化学',
        sum_: gradeData.huaxue || 0,
        sumb: gradeData.huaxueb || 0,
        sumd: gradeData.huaxued || 0,
        maxB: gradeData.huaxue || 0,
        passLine: 0,
    })
}
if (gradeData.shengwu!= null &&  gradeData.shengwu!=0) {
    tableData.value.push({
        name: '生物',
        sum_: gradeData.shengwu || 0,
        sumb: gradeData.shengwub || 0,
        sumd: gradeData.shengwud || 0,
        maxB: gradeData.shengwu || 0,
        passLine: 0,
    });
}
if (gradeData.lishi != null &&  gradeData.lishi!=0) {
    tableData.value.push({
        name: '历史',
        sum_: gradeData.lishi || 0,
        sumb: gradeData.lishib || 0,
        sumd: gradeData.lishid || 0,
        maxB: gradeData.lishi || 0,
        passLine: 0,
    });
}
if (gradeData.dili!= null &&  gradeData.dili!=0) {
    tableData.value.push({
        name: '地理',
        sum_: gradeData.dili || 0,
        sumb: gradeData.dilib || 0,
        sumd: gradeData.dilid || 0,
        maxB: gradeData.dili || 0,
        passLine: 0,
    });
}
if (gradeData.zhengzhi != null && gradeData.zhengzhi!=0) {
        tableData.value.push({
        name: '政治',
        sum_: gradeData.zhengzhi || 0,
        sumb: gradeData.zhengzhib || 0,
        sumd: gradeData.zhengzhid || 0,
        maxB: gradeData.zhengzhi || 0,
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
        dataIndex:'sumb',
        align: 'center',
    },{
        title: '年级排名',
        dataIndex: 'sumd',
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
    min-height: 100vh;
    padding: 24px;
    background-color: #F8FAFC;
    display: flex;
    flex-direction: column;
    gap: 24px;
    
    // Header Styles
    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 20px;

        .header-left {
            display: flex;
            flex-direction: column;
            gap: 12px;
            
            .page-title {
                font-size: 28px;
                font-weight: 700;
                color: #1E293B;
                margin: 0;
                letter-spacing: -0.5px;
            }

            .exam-selector {
                display: flex;
                align-items: center;
                background: white;
                padding: 4px 16px 4px 12px;
                border-radius: 8px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                border: 1px solid #E2E8F0;

                .label {
                    color: #64748B;
                    font-size: 14px;
                    margin-right: 8px;
                }

                :deep(.ant-select-selector) {
                    font-size: 15px;
                    color: #0F172A;
                    font-weight: 500;
                }
            }
        }

        .header-right {
            .countdown-card {
                display: flex;
                align-items: center;
                gap: 16px;
                background: white;
                padding: 12px 24px;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                border: 1px solid rgba(59, 130, 246, 0.1);

                .icon-wrapper {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #EFF6FF;
                    border-radius: 50%;
                    font-size: 20px;
                }

                .countdown-info {
                    display: flex;
                    flex-direction: column;
                    
                    .label {
                        font-size: 12px;
                        color: #64748B;
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .number-group {
                        display: flex;
                        align-items: baseline;
                        gap: 4px;

                        .number {
                            font-size: 24px;
                            font-weight: 800;
                            color: #3B82F6;
                            line-height: 1.2;
                            font-family: 'Fira Sans', system-ui, sans-serif;
                        }

                        .unit {
                            font-size: 14px;
                            color: #64748B;
                            font-weight: 600;
                        }
                    }
                }
            }
        }
    }

    // Main Content
    .main-content {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;

        .content-card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            border: 1px solid #F1F5F9;

            .card-header {
                padding: 20px 24px;
                border-bottom: 1px solid #F8FAFC;
                display: flex;
                justify-content: space-between;
                align-items: center;

                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;

                    .indicator {
                        width: 4px;
                        height: 16px;
                        background: #3B82F6;
                        border-radius: 2px;
                        
                        &.green { background: #10B981; }
                        &.blue { background: #6366F1; }
                    }

                    h3 {
                        margin: 0;
                        font-size: 18px;
                        font-weight: 600;
                        color: #1E293B;
                    }
                }

                .subtitle {
                    font-size: 13px;
                    color: #94A3B8;
                }
            }

            .card-body {
                padding: 24px;
            }
        }

        .left-column {
            flex: 3;
            min-width: 300px;
            display: flex;
            flex-direction: column;
            gap: 24px;

            .table-card {
                .custom-table {
                    :deep(.ant-table-thead > tr > th) {
                        background: #F8FAFC;
                        color: #475569;
                        font-weight: 600;
                        font-size: 14px;
                    }
                    :deep(.ant-table-tbody > tr > td) {
                        color: #334155;
                        font-size: 15px;
                        padding: 16px;
                    }
                    :deep(.ant-table-tbody > tr:hover > td) {
                        background: #F0F9FF;
                    }
                }
            }
        }

        .right-column {
            flex: 2;
            min-width: 350px;

            .chart-card {
                .chart-wrapper {
                    display: flex;
                    flex-direction: column;
                }
            }
        }
    }
}

// Responsive Design
@media (max-width: 1024px) {
    .grade-container {
        padding: 16px;
        
        .main-content {
            flex-direction: column;
            
            .left-column, .right-column {
                width: 100%;
            }
        }
    }
}

@media (max-width: 640px) {
    .grade-container {
        .dashboard-header {
            flex-direction: column;
            align-items: stretch;
            
            .header-right .countdown-card {
                justify-content: center;
            }
        }
    }
}
</style>
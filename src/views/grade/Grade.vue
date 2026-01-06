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
    let examDate = new Date(currentYear, 5, 7);
    if (today > examDate) {
        examDate = new Date(currentYear + 1, 5, 7);
    }
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

const currentExamData = ref<API.Grade>();
const studentId = ref('');
const studentInfo = ref<any>(null);
const daysUntilExam = ref(calculateDaysUntilExam());
const userStore = useUserStore();

// 比较考试数据（初始化空数组，避免undefined）
const compareScoreData = ref<number[]>([]);
const updateCompareScoreData = (data: number[]) => {
    // 过滤异常大的数值（比如雷达图中的199、637）
    const validData = data.map(num => isFinite(num) && num <= 150 ? num : 0);
    compareScoreData.value = validData;
};

// 当前考试数据数组（过滤异常值）
const currentExamDataArray = computed(() => {
    let tmp: number[] = [];
    if(currentExamData.value) {
        for(let i of dynamicSubjectNames.value){
            // @ts-ignore 过滤异常值，科目满分不超过150
            const score = currentExamData.value[subjects_inflection[i.name]];
            tmp.push(isFinite(score) && score <= 150 ? score : 0);
        }
    }
    return tmp;
});

// 根据选科动态确定科目名称
const dynamicSubjectNames = computed(() => {
    let subjects = [
        {name: '语文', max: 150},
        {name: '英语', max: 150},
        {name: '数学', max: 150}
    ]
    if (studentInfo.value?.subject_selection) {
        for (let i  of [{name:'物',value:'物理'},{name:'化',value:'化学'}, {name:'生',value:'生物'},{name:'史',value:'历史'},{name:'地',value:'地理'},{name:'政',value:'政治'}]) {
            if(studentInfo.value.subject_selection.includes(i.name)) {
                subjects.push({name: i.value, max: 100})
            }
        }
    }
    return subjects
});

// 每天更新倒计时
let timer: number;
onMounted(() => {
    daysUntilExam.value = calculateDaysUntilExam();
    const updateAtMidnight = () => {
        const now = new Date();
        const night = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        const msUntilMidnight = night.getTime() - now.getTime();
        timer = window.setTimeout(() => {
            daysUntilExam.value = calculateDaysUntilExam();
            updateAtMidnight();
        }, msUntilMidnight);
    };
    updateAtMidnight();
});

onUnmounted(() => {
    if (timer) clearTimeout(timer);
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
const tableData = ref<TableData[]>([])

onBeforeMount(async () => {
    if (!userStore.isLogin) {
        router.push('/user/login');
        return
    }

    const userInfo = userStore.getUserInfo();
    studentId.value = userInfo.role
    studentInfo.value = userInfo.student
    try {
        const res = await getStudentExamApi({student_uid:userInfo.role},[]);
        if (res.code === 200 ) {
            // 1. 过滤有效考试数据
            const validExams: Exam[] = [];
            res.data.forEach((item: any) => {
                if (Array.isArray(item) && item[0]?.id && item[0]?.name) {
                    validExams.push({
                        id: item[0].id,
                        name: item[0].name
                    });
                }
            });
            // 2. 按ID从大到小排序（ID大=最后一次考试）
            examList.value = validExams.sort((a, b) => Number(b.id) - Number(a.id));
        }
        
        // 3. 默认选择第一个考试（最后一次）
        if(examList.value.length > 0){
            currentExamId.value = examList.value[0].id;
            const gradeRes = await getGradeApi({
                student_id: userInfo.role,
                exam_id: parseInt(currentExamId.value)
            });
            if (gradeRes.code === 200 && gradeRes.data?.[0]) {
                handleGradeDetail(gradeRes.data[0]);
            }
        }else{
            message.error('似乎还没有参加一场考试？')
        }
    } catch (err) {
        message.error('加载考试数据失败');
    }
})

const handleGradeDetail = (gradeData:API.Grade) => {
    tableData.value = []
    currentExamData.value = gradeData
    // 过滤异常成绩（比如超过满分的数值）
    const safeScore = (score: any, max: number) => isFinite(score) && score <= max ? score : 0;
    
    tableData.value = [
    {
        name: '总分',
        sum_: safeScore(gradeData.sum_, 750),
        sumb: gradeData.sumb || 0,
        sumd: gradeData.sumd || 0,
        maxB: safeScore(gradeData.sum_, 750),
        passLine: 0,
    },
    {
        name: '语文',
        sum_: safeScore(gradeData.yuwen, 150),
        sumb: gradeData.yuwenb || 0,
        sumd: gradeData.yuwend || 0,
        maxB: safeScore(gradeData.yuwen, 150),
        passLine: 0,
    },
    {
        name: '英语',
        sum_: safeScore(gradeData.yingyu, 150),
        sumb: gradeData.yingyub || 0,
        sumd: gradeData.yingyud || 0,
        maxB: safeScore(gradeData.yingyu, 150),
        passLine: 0,
    },
    {
        name: '数学',
        sum_: safeScore(gradeData.shuxue, 150),
        sumb: gradeData.shuxueb || 0,
        sumd: gradeData.shuxued || 0,
        maxB: safeScore(gradeData.shuxue, 150),
        passLine: 0,
    }
];
if (gradeData.wuli != null) {
    tableData.value.push({
        name: '物理',
        sum_: safeScore(gradeData.wuli, 100),
        sumb: gradeData.wulib || 0,
        sumd: gradeData.wulid || 0,
        maxB: safeScore(gradeData.wuli, 100),
        passLine: 0,
    });
}
if (gradeData.huaxue != null) {
    tableData.value.push({
        name: '化学',
        sum_: safeScore(gradeData.huaxue, 100),
        sumb: gradeData.huaxueb || 0,
        sumd: gradeData.huaxued || 0,
        maxB: safeScore(gradeData.huaxue, 100),
        passLine: 0,
    })
}
if (gradeData.shengwu != null) {
    tableData.value.push({
        name: '生物',
        sum_: safeScore(gradeData.shengwu, 100),
        sumb: gradeData.shengwub || 0,
        sumd: gradeData.shengwud || 0,
        maxB: safeScore(gradeData.shengwu, 100),
        passLine: 0,
    });
}
if (gradeData.lishi != null) {
    tableData.value.push({
        name: '历史',
        sum_: safeScore(gradeData.lishi, 100),
        sumb: gradeData.lishib || 0,
        sumd: gradeData.lishid || 0,
        maxB: safeScore(gradeData.lishi, 100),
        passLine: 0,
    });
}
if (gradeData.dili != null) {
    tableData.value.push({
        name: '地理',
        sum_: safeScore(gradeData.dili, 100),
        sumb: gradeData.dilib || 0,
        sumd: gradeData.dilid || 0,
        maxB: safeScore(gradeData.dili, 100),
        passLine: 0,
    });
}
if (gradeData.zhengzhi != null) {
        tableData.value.push({
        name: '政治',
        sum_: safeScore(gradeData.zhengzhi, 100),
        sumb: gradeData.zhengzhib || 0,
        sumd: gradeData.zhengzhid || 0,
        maxB: safeScore(gradeData.zhengzhi, 100),
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

const handleChange = async (value:string) => {
    currentExamId.value = value;
    try {
        const gradeRes = await getGradeApi({
            student_id: parseInt(studentId.value),
            exam_id: parseInt(value)
        });
        if (gradeRes.code === 200 && gradeRes.data?.[0]) {
            handleGradeDetail(gradeRes.data[0]);
        }
    } catch (err) {
        message.error('切换考试失败');
    }
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
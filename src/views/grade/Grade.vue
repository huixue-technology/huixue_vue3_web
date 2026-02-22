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
                        :subjects="dynamicSubjectNames"
                        @update:compareScoreData="updateCompareScoreData"
                    />
                </div>
            </div>
        </div>
        
        <!-- 右侧图表区域 -->
        <div class="right-column">
            <div class="radar-chart-section card">
                <div class="card-body chart-container">
                    <radar-chart 
                        :student-info="studentInfo"
                        :compare-score-data="compareScoreData"
                        :current-exam-data="currentExamDataArray"
                        :subjects="dynamicSubjectNames"
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
    const base = [
        { name: '语文', max: 150 },
        { name: '英语', max: 150 },
        { name: '数学', max: 150 }
    ];
    const extras = [
        { short: '物', label: '物理', key: 'wuli' },
        { short: '化', label: '化学', key: 'huaxue' },
        { short: '生', label: '生物', key: 'shengwu' },
        { short: '史', label: '历史', key: 'lishi' },
        { short: '地', label: '地理', key: 'dili' },
        { short: '政', label: '政治', key: 'zhengzhi' }
    ] as const;
    const result = [...base];
    for (const e of extras) {
        const bySelection = !!studentInfo.value?.subject_selection && studentInfo.value.subject_selection.includes(e.short);
        const byGradeData = currentExamData.value && (currentExamData.value as any)[e.key] != null;
        if (bySelection || byGradeData) {
            result.push({ name: e.label, max: 100 });
        }
    }
    return result;
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

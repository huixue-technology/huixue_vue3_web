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
import { getPassLine } from '@/servers/api/analysis';
import { ref, onMounted, onUnmounted, onBeforeMount, computed } from 'vue';
import { useUserStore } from '@/store/modules/user';
import router from '@/router';
import { message } from 'ant-design-vue';
import CompareTable from './components/ExamAnalysis.vue';
import RadarChart from './components/Radar.vue';
import { getSubjectScore, getTotalScore, getSubjectClassRank, getSubjectSchoolRank, groupPassLine } from '@/utils/subjects';
import type { GradeDetail } from '@/utils/gradeTypes';

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

const currentExamData = ref<GradeDetail>();
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
            const score = getSubjectScore(currentExamData.value, i.name);
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
        { short: '物', label: '物理' },
        { short: '化', label: '化学' },
        { short: '生', label: '生物' },
        { short: '史', label: '历史' },
        { short: '地', label: '地理' },
        { short: '政', label: '政治' }
    ] as const;
    const selection = studentInfo.value?.subject_selection;
    const hasSelection = typeof selection === 'string' && selection.length > 0;
    const result = [...base];
    for (const e of extras) {
        if (!hasSelection || selection.includes(e.short)) {
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
    field: string;
    name: string;
    score: number;
    classRank: number;
    schoolRank: number;
    maxB: number;
    passLine: number | string;
};

const examList = ref<Exam[]>([])
const currentExamId = ref<string>('')
const tableData = ref<TableData[]>([])
const passLineData = ref<Record<string, any>>({})

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
                await fetchPassLine(currentExamId.value);
                handleGradeDetail(gradeRes.data[0]);
            }
        }else{
            message.error('似乎还没有参加一场考试？')
        }
    } catch (err) {
        message.error('加载考试数据失败');
    }
})

const fetchPassLine = async (examId: string) => {
    passLineData.value = {};
    try {
        const res = await getPassLine({ exam_id: parseInt(examId), size: 100 });
        if (res.code !== 200 || !Array.isArray(res.data)) return;
        // 行式数据按 line_group_id 分组，匹配含「特控/一段」的分数线组
        const grouped = new Map<number, any[]>();
        res.data.forEach((row: any) => {
            const gid = row?.line_group_id;
            if (gid == null) return;
            if (!grouped.has(gid)) grouped.set(gid, []);
            grouped.get(gid)!.push(row);
        });
        let targetGroup: any[] | null = null;
        for (const rows of grouped.values()) {
            const lineName = String(rows[0]?.line_name || '');
            if (lineName.includes('特控') || lineName.includes('一段')) {
                targetGroup = rows;
                break;
            }
        }
        if (!targetGroup) targetGroup = grouped.values().next().value || null;
        passLineData.value = targetGroup ? groupPassLine(targetGroup) : {};
    } catch (err) {
        passLineData.value = {};
    }
}

const getPassLineValue = (field: string) => {
    const value = passLineData.value?.[field];
    return value ?? '-';
}

const handleGradeDetail = (gradeData:GradeDetail) => {
    tableData.value = []
    currentExamData.value = gradeData
    // 过滤异常成绩（比如超过满分的数值）
    const safeScore = (score: any, max: number) => isFinite(score) && score <= max ? score : 0;

    tableData.value = [
    {
        field: '总分',
        name: '总分',
        score: safeScore(getTotalScore(gradeData), 750),
        classRank: getSubjectClassRank(gradeData, '总分') || 0,
        schoolRank: getSubjectSchoolRank(gradeData, '总分') || 0,
        maxB: safeScore(getTotalScore(gradeData), 750),
        passLine: getPassLineValue('总分'),
    },
    {
        field: '语文',
        name: '语文',
        score: safeScore(getSubjectScore(gradeData, '语文'), 150),
        classRank: getSubjectClassRank(gradeData, '语文') || 0,
        schoolRank: getSubjectSchoolRank(gradeData, '语文') || 0,
        maxB: safeScore(getSubjectScore(gradeData, '语文'), 150),
        passLine: getPassLineValue('语文'),
    },
    {
        field: '英语',
        name: '英语',
        score: safeScore(getSubjectScore(gradeData, '英语'), 150),
        classRank: getSubjectClassRank(gradeData, '英语') || 0,
        schoolRank: getSubjectSchoolRank(gradeData, '英语') || 0,
        maxB: safeScore(getSubjectScore(gradeData, '英语'), 150),
        passLine: getPassLineValue('英语'),
    },
    {
        field: '数学',
        name: '数学',
        score: safeScore(getSubjectScore(gradeData, '数学'), 150),
        classRank: getSubjectClassRank(gradeData, '数学') || 0,
        schoolRank: getSubjectSchoolRank(gradeData, '数学') || 0,
        maxB: safeScore(getSubjectScore(gradeData, '数学'), 150),
        passLine: getPassLineValue('数学'),
    }
];
    const selection = studentInfo.value?.subject_selection;
    const hasSelection = typeof selection === 'string' && selection.length > 0;
    const extras = [
        { short: '物', label: '物理' },
        { short: '化', label: '化学' },
        { short: '生', label: '生物' },
        { short: '史', label: '历史' },
        { short: '地', label: '地理' },
        { short: '政', label: '政治' }
    ] as const;
    for (const e of extras) {
        if (!hasSelection || selection.includes(e.short)) {
            const score = getSubjectScore(gradeData, e.label);
            tableData.value.push({
                field: e.label,
                name: e.label,
                score: safeScore(score, 100),
                classRank: getSubjectClassRank(gradeData, e.label) || 0,
                schoolRank: getSubjectSchoolRank(gradeData, e.label) || 0,
                maxB: safeScore(score, 100),
                passLine: getPassLineValue(e.label),
            });
        }
    }
}

const  tableColumns = [{
        title:'科目',
        dataIndex:'name',
        align: 'center',
    },{
        title: '成绩',
        dataIndex:'score',
        align: 'center',
    },{
        title: '班级排名',
        dataIndex:'classRank',
        align: 'center',
    },{
        title: '年级排名',
        dataIndex: 'schoolRank',
        align: 'center',
    },{
        title: '特控线',
        dataIndex:'passLine',
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
            await fetchPassLine(value);
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

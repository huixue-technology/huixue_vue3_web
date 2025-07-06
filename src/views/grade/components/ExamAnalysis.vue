<template>
  <div class="student-analysis-page">
    <div class="tables-container" v-if="!isLoading">
      <div class="table-section">
        <div style="display: flex;">
            <h2 class="exam-title">进退步分析：</h2>
            <a-select
                placeholder="请选择考试"
                style="min-width: 100px;"
                @change="handleChange"
                v-model:key="compareExamId"
                :value="examList.filter(id=> id === compareExamId)[0]"
            >
                <a-select-option v-for="item in examList" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
            </a-select> 
        </div>
        <p class="description">说明：<span style="color: red;">红色</span>表明较上次考试退步的名次，<span style="color: green;">绿色</span>表明较上次考试进步的名次。</p>
        <a-table
          :columns="currentExamColumns"
          :data-source="tableData"
          :pagination="false"
          size="middle"
          bordered
        />
      </div>
    </div>

        <!-- 能力六边形图表区域 -->
    <div class="chart-container" v-if="!isLoading">
      <h2>一本能力值</h2>
      <a-card>
        <v-chart class="radar-chart" :option="chartOption" autoresize />
      </a-card>
      <div class="description">综合分析：本次考试总分较上次考试退步，语文、数学、外语、{{ dynamicSubjectNames.historyPhysics }}、{{ dynamicSubjectNames.politicsChemistry }}、{{ dynamicSubjectNames.geographyBiology }}均较上次考试退步。</div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Table as ATable, Card as ACard } from 'ant-design-vue';
import type { ColumnType } from 'ant-design-vue/es/table';
import VChart from 'vue-echarts';
import { useUserStore } from '@/store';
import api from '@/servers/api';
import { postCompareRankMultiExam } from '@/servers/api/analysis';

interface Exam {
    id:string,
    name:string
}
const userStore = useUserStore();


// 加载状态
const isLoading = ref(true);

// 学生信息状态
const studentInfo = ref({
  name: '',
  uid: '',
  school_id: '',
  class_id: '',
  subject_selection_id: null as number | null
});
const compareExamId = ref<Exam>({id:'',name:''})
const props = defineProps<{
    student_id:number,
    selected_id:number,
    examList:Array<Exam>,
}>();

onMounted(() => { 
    // compareExamId.value.id = props.examList[1].id.toString();
});
const handleChange = (value:string) => {
    compareExamId.value.id = value;
    postCompareRankMultiExam({
        selected_exam_id:props.selected_id,
        student_id:props.student_id,
        compare_exam_ids:"'"+compareExamId.value.id + "'"
    }).then(res => {
        console.log(res)
        handleUpandDown(res)
        console.log(tableData.value)
    })
}
const tableData = ref<{
        subject : any | string,
        rankChangeClass:any,
        rankChangeSegment:any,
    }[]>([])

const handleUpandDown = (res:any) => { 
    console.log(res.data[0])
    tableData.value = []
    // 辅助函数：用于检查字段是否存在并推入数据
    const addSubjectData = (
        subjectName: string,
        rankChangeClassField: any,
        rankChangeSegmentField: any
    ) => {
        // 检查 rankChangeClassField 或 rankChangeSegmentField 是否为空或 null
        if (
            rankChangeClassField !== undefined &&
            rankChangeSegmentField !== undefined
        ) {
            tableData.value.push({
                subject: subjectName,
                rankChangeClass: rankChangeClassField,
                rankChangeSegment: rankChangeSegmentField,
            });
        }
    };

    // 添加各学科数据
    addSubjectData('总分',res.data[0].compareB.sumB, res.data[0].compareD.sumD)
    addSubjectData('语文', res.data[0].compareB.YuwenB, res.data[0].compareD.YuwenD);
    addSubjectData('英语', res.data[0].compareB.YingyuB, res.data[0].compareD.YingyuD);
    addSubjectData('物理', res.data[0].compareB.WuliB, res.data[0].compareD.WuliD);
    addSubjectData('化学', res.data[0].compareB.HuaxueB, res.data[0].compareD.HuaxueD);
    addSubjectData('生物', res.data[0].compareB.ShengwuB, res.data[0].compareD.ShengwuD);
    addSubjectData('数学', res.data[0].compareB.ShuxueB, res.data[0].compareD.ShuxueD);
    addSubjectData('历史', res.data[0].compareB.LishiB, res.data[0].compareD.LishiD);
    addSubjectData('地理', res.data[0].compareB.DiliB, res.data[0].compareD.DiliD);
}
const render = ({ text }: { text: number | null }) => {
    if (text === null || text === undefined) {
        return '无数据';
    }
    return text > 0 ? `+${text}` : String(text);
}
const customCell = (text) => {
    text = text.rankChangeSegment
    console.log(text)
    const numericText = Number(text); // 显式转换为数字
    if (text === null || text === undefined || isNaN(numericText)) {
        return { style: { color: 'rgba(0, 0, 0, 0.85)' } }; // Fallback to black for invalid data
    }
    const color = numericText > 0 ? '#52c41a' : numericText < 0 ? '#f5222d' : 'rgba(0, 0, 0, 0.85)';
    return { style: { color } };
}

// 根据选科动态确定科目名称
const dynamicSubjectNames = computed(() => {
  const subjectSelection = studentInfo.value.subject_selection_id; // assuming 0 for liberal arts, 1 for science
  console.log('dynamicSubjectNames - typeof subjectSelection:', typeof subjectSelection, 'value:', subjectSelection);
  if (subjectSelection === 0) { // 文科
    return {
      historyPhysics: '历史',
      politicsChemistry: '政治',
      geographyBiology: '地理'
    };
  } else if (subjectSelection === 1) { // 理科
    return {
      historyPhysics: '物理',
      politicsChemistry: '化学',
      geographyBiology: '生物'
    };
  } else {
    // Default or handle unexpected values
    return {
      historyPhysics: '历史/物理',
      politicsChemistry: '政治/化学',
      geographyBiology: '地理/生物'
    };
  }
});

// Initial default max values for radar indicators
const radarMaxValues = ref([1, 1, 1, 1, 1, 1]); // Corresponding to Chinese, Math, English, Hist/Phy, Pol/Chem, Geo/Bio

// ECharts 雷达图配置 (Computed property)
const chartOption = computed(() => {
  return {
    radar: {
      indicator: [
        { name: '语文', max: radarMaxValues.value[0] },
        { name: '数学', max: radarMaxValues.value[1] },
        { name: '外语', max: radarMaxValues.value[2] },
        { name: dynamicSubjectNames.value.historyPhysics, max: radarMaxValues.value[3] },
        { name: dynamicSubjectNames.value.politicsChemistry, max: radarMaxValues.value[4] },
        { name: dynamicSubjectNames.value.geographyBiology, max: radarMaxValues.value[5] }
      ]
    },
    series: [
      {
        name: '能力值',
        type: 'radar',
        data: [
          { value: [0, 0, 0, 0, 0, 0], name: '学生成绩' } // Initial data, will be updated by fetchCurrentExamData
        ]
      }
    ]
  };
});


// 本次考试表格列定义
const currentExamColumns: ColumnType[] = [
  {
    title: '科目',
    dataIndex: 'subject',
    key: 'subject',
  },
  {
    title: '进退班次',
    dataIndex: 'rankChangeClass',
    key: 'rankChangeClass',
    customRender: render,
    customCell: customCell
  },
  {
    title: '进退段次',
    dataIndex: 'rankChangeSegment',
    key: 'rankChangeSegment',
    customRender: render,
    customCell: customCell
  },
];

// 获取学生信息
const fetchStudentInfo = async () => {
  console.log('开始获取学生信息...');
  try {
    // 使用 Pinia store 中的用户信息
    const userInfo = userStore.userInfo;
    console.log('从 Pinia store 获取到的用户信息:', userInfo);

    // 假设 student_uid 对应的是 userInfo.role
    let studentId = userInfo.role;

    if (!studentId) {
      console.warn('Pinia store 中没有找到有效的用户角色ID，无法获取学生信息。', userInfo);
      isLoading.value = false;
      return;
    }

    // 确保 studentId 是字符串，因为数据库中的uid是VARCHAR
    if (typeof studentId !== 'string') {
        studentId = String(studentId);
    }

    console.log('将使用学生UID (来自role字段):', studentId);

    const studentDetail = await api.student.getStudentDetailApi({
      student_uid: studentId as string // 断言为 string
    });
    console.log('获取到学生详情:', studentDetail);

    

  } catch (error) {
    console.error('获取学生信息失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
  } finally {
    isLoading.value = false;
    console.log('加载状态设置为:', isLoading.value);
  }
};



// 在组件挂载时获取学生信息
onMounted(() => {
  fetchStudentInfo();
});
// 格式化是否过线显示
const formatPassLine = (isPassed: boolean) => {
  return isPassed ? '是' : '否';
};

</script>

<style scoped>
.exam-title {
    text-align: left;
}
.student-analysis-page {
  padding: 20px;
  position: relative; /* Needed for absolute positioning of the button */
  overflow-y: auto; /* Add vertical scrolling */
  box-sizing: border-box; /* Include padding in height calculation */
}

.back-button {
  position: absolute;
  top: 10px; /* Adjust as needed */
  left: 10px; /* Adjust as needed */
  padding: 5px 10px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  z-index: 10; /* Ensure button is above other content */
}

.tables-container {
  display: flex; /* 使用 flexbox 实现并列布局 */
  gap: 20px; /* 表格之间的间隔 */
  margin-top: 40px; /* Add margin to prevent overlap with button */
}

.table-section {
  flex: 1; /* 让两个表格区域平分空间 */
}

.analysis-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.analysis-table th,
.analysis-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}

.analysis-table th {
  background-color: #f2f2f2;
}

.total-exams, .exam-date {
  font-size: 0.9em;
  color: #666;
  margin-left: 10px;
}

.description {
  margin-top: 10px;
  font-size: 0.9em;
}

.chart-container {
    margin-top: 50px;
    margin-bottom: 50px;
    display: flex;
    flex-direction: column;
    align-items: center; /* Center the chart horizontally */
}

.radar-chart {
  width: 600px; /* Adjust width and height as needed */
  height: 400px;
}

.analysis-text {
  margin-top: 20px;
  font-size: 1.2em;
  font-weight: bold;
}
</style> 
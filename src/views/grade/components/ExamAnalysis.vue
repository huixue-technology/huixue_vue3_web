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
                :value="examList.filter(i=> i.id === compareExamId.id)[0]?.name"
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
          style="font-size: larger;"
          bordered
        />
      </div>
    </div>

        <!-- 能力六边形图表区域 -->
    <div class="chart-container" v-if="!isLoading">
      <v-chart class="radar-chart" :option="chartOption" autoresize />
      <div class="description">综合分析：本次考试总分较上次考试退步，语文、数学、外语、综合科均较上次考试退步。</div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { Table as ATable, Card as ACard, message } from 'ant-design-vue';
import type { ColumnType } from 'ant-design-vue/es/table';
import VChart from 'vue-echarts';
import { useUserStore } from '@/store'
import { postCompareRankMultiExam } from '@/servers/api/analysis';
import { getGradeApi } from '@/servers/api/grade';
import type {  CompareScore} from '@/utils/types'
import subjects_inflection from '@/utils/inflection'
interface Exam {id:string,name:string}

const userStore = useUserStore();
// @ts-ignore
const compareScoreData = ref<number[]>([]);

// 加载状态
const isLoading = ref(true);

// 学生信息状态
const studentInfo = ref();
const compareExamId = ref<Exam>({id:'',name:''})
const props = defineProps<{
    student_id:number,
    selected_id:number,
    currentExam:API.Grade | undefined,
    examList:Array<Exam>,
}>();

const currentExamData = computed(() => { 
  let tmp = []
  if(props.currentExam) {
    for(let i of dynamicSubjectNames.value){
      // @ts-ignore
      tmp.push(props.currentExam[subjects_inflection[i.name]])
    }
  }
  return tmp
});

onMounted(() => { 
    // compareExamId.value.id = props.examList[1].id.toString();
    studentInfo.value = userStore.getUserInfo().student
    if(studentInfo.value){
      isLoading.value = false
    }
});
const examListReady = computed(() => props.examList && props.examList.length > 0);

watch(
  examListReady,
  (ready) => {
    if (ready) {
      compareExamId.value = props.examList[0];
      console.log(compareExamId.value)
      console.log(props.examList.filter(i=> i.id === compareExamId.value.id)[0])
      loadTableAndRadar(props.examList[0].id);
    }
  },
  { immediate: false }
);


const loadTableAndRadar = (value:string) => {
  postCompareRankMultiExam({
        selected_exam_id:props.selected_id,
        student_id:props.student_id,
        compare_exam_ids:"'"+compareExamId.value.id + "'"
    }).then(res => {
        handleUpandDown(res)
        console.log(tableData.value)
    })
    getGradeApi({
      student_id: props.student_id,
      exam_id: parseInt(value),
    }).then((res:{code:number,data:CompareScore[],msg:string})=> { 
      if(res.code === 200) {
         // @ts-ignore
        compareScoreData.value = []
        for(let i of dynamicSubjectNames.value){
          // @ts-ignore
          compareScoreData.value.push(res.data[0][subjects_inflection[i.name]])
        }
        
      }else {
        message.error(res.msg)
      }
    });
}
const handleChange = (value:string) => {
    compareExamId.value.id = value;
    loadTableAndRadar(value)
}
const tableData = ref<{
        subject : any | string,
        rankChangeClass:any,
        rankChangeSegment:any,
    }[]>([])

const handleUpandDown = (res:any) => { 
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
const customCell = (text:any) => {
    text = text.rankChangeSegment
    const numericText = Number(text); // 显式转换为数字
    if (text === null || text === undefined || isNaN(numericText)) {
        return { style: { color: 'rgba(0, 0, 0, 0.85)' } }; // Fallback to black for invalid data
    }
    const color = numericText > 0 ? '#52c41a' : numericText < 0 ? '#f5222d' : 'rgba(0, 0, 0, 0.85)';
    return { style: { color } };
}

// 根据选科动态确定科目名称
const dynamicSubjectNames = computed(() => {
  let subjects = [
    {name: '语文', max: 150},
    {name: '英语', max: 150},
    {name: '数学', max: 150}
  ]
  for (let i  of [{name:'物',value:'物理'},{name:'化',value:'化学'}, {name:'生',value:'生物'},{name:'史',value:'历史'},{name:'地',value:'地理'},{name:'政',value:'政治'}]) {
    if(studentInfo.value.subject_selection.includes(i.name)) {
      subjects.push({name: i.value, max: 100})
    }
  }
  return subjects
  
});





// ECharts 雷达图配置 (改为计算属性)
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
          value: compareScoreData.value.map(item=>item)
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
          value: currentExamData.value.map(item=>item),
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

// 本次考试表格列定义
const currentExamColumns: ColumnType[] = [
  {
    title: '科目',
    dataIndex: 'subject',
    key: 'subject',
    align: 'center',
  },
  {
    title: '进退班次',
    dataIndex: 'rankChangeClass',
    key: 'rankChangeClass',
    customRender: render,
    customCell: customCell,
    align: 'center',
  },
  {
    title: '进退段次',
    dataIndex: 'rankChangeSegment',
    key: 'rankChangeSegment',
    customRender: render,
    customCell: customCell,
    align: 'center',
  },
];



</script>

<style scoped>
.exam-title {
    text-align: left;
}
.student-analysis-page {
  font-size: larger;
  padding: 20px;
  position: relative; /* Needed for absolute positioning of the button */
  overflow-y: auto; /* Add vertical scrolling */
  box-sizing: border-box; /* Include padding in height calculation */
}
.tables-container {
  display: flex; /* 使用 flexbox 实现并列布局 */
  gap: 20px; /* 表格之间的间隔 */
  margin-top: 40px; /* Add margin to prevent overlap with button */
}

.table-section {
  flex: 1; /* 让两个表格区域平分空间 */
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
  width: 80%; /* Adjust width and height as needed */
  min-height: 800px;
  font-size: larger;
}

</style> 
<template>
  <div class="table-section">
    <div class="section-header">
        <h3 class="exam-title">考试对比分析</h3>
        <a-select
            placeholder="请选择考试"
            style="min-width: 150px; margin-left: 15px;"
            @change="handleChange"
            v-model:value="compareExamId"
        >
            <a-select-option v-for="item in examList" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
        </a-select> 
    </div>
    <p class="description">说明：<span style="color: red;">红色</span>表明较上次考试退步的名次，<span style="color: green;">绿色</span>表明较上次考试进步的名次。</p>
    <div class="table-wrapper">
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { ColumnType } from 'ant-design-vue/es/table';
import { postCompareRankMultiExam } from '@/servers/api/analysis';
import { getGradeApi } from '@/servers/api/grade';
import type { CompareScore } from '@/utils/types'
import subjects_inflection from '@/utils/inflection'
import { message } from 'ant-design-vue';


interface Exam {id:string,name:string}

const props = defineProps<{
    student_id:number,
    selected_id:number,
    examList:Array<Exam>,
    studentInfo: any,
}>();

const emit = defineEmits(['update:compareScoreData']);

const compareExamId = ref<string>('');

onMounted(()=> {
  // 核心：选择切片后列表的第1个（对应原始列表第2个=上一次考试）
  if(props.examList.length >= 1) {
    compareExamId.value = props.examList[0].id;
    handleChange(compareExamId.value);
  }
})
const tableData = ref<{
        subject : any | string,
        rankChangeClass:any,
        rankChangeSegment:any,
    }[]>([])

const render = ({ text }: { text: number | null }) => {
    if (text === null || text === undefined) {
        return '无数据';
    }
    if (text > 0) {
        return `${text}`;
    } else if (text < 0) {
        return `${Math.abs(text)}`;
    }
    return String(text);
}

const customCell = (record: any) => {
    const text = record?.rankChangeSegment;
    const numericText = Number(text);
    if (text === null || text === undefined || isNaN(numericText)) {
        return { style: { color: 'rgba(0, 0, 0, 0.85)' } };
    }
    const color = numericText > 0 ? '#52c41a' : numericText < 0 ? '#f5222d' : 'rgba(0, 0, 0, 0.85)';
    return { style: { color } };
}

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

const handleUpandDown = (res:any) => { 
    tableData.value = []
    if (!res?.data?.[0]) return;
    
    const addSubjectData = (
        subjectName: string,
        rankChangeClassField: any,
        rankChangeSegmentField: any
    ) => {
        if (rankChangeClassField !== undefined || rankChangeSegmentField !== undefined) {
            tableData.value.push({
                subject: subjectName,
                rankChangeClass: rankChangeClassField ?? '无数据',
                rankChangeSegment: rankChangeSegmentField ?? '无数据',
            });
        }
    };

    addSubjectData('总分',res.data[0].compareB.sumb, res.data[0].compareD.sumd)
    addSubjectData('语文', res.data[0].compareB.yuwenb, res.data[0].compareD.yuwend);
    addSubjectData('英语', res.data[0].compareB.yingyub, res.data[0].compareD.yingyud);
    addSubjectData('物理', res.data[0].compareB.wulib, res.data[0].compareD.wulid);
    addSubjectData('化学', res.data[0].compareB.huaxueb, res.data[0].compareD.huaxued);
    addSubjectData('生物', res.data[0].compareB.shengwub, res.data[0].compareD.shengwud);
    addSubjectData('数学', res.data[0].compareB.shuxueb, res.data[0].compareD.shuxued);
    addSubjectData('历史', res.data[0].compareB.lishib, res.data[0].compareD.lishid);
    addSubjectData('地理', res.data[0].compareB.dilib, res.data[0].compareD.dilid);
}
const debounce = (func: Function, wait: number) => {
  let timeout: number | null = null;
  return function (...args: any[]) {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      func.apply(null, args);
    }, wait);
  };
};

const loadTableAndRadar = (value:string) => {
  postCompareRankMultiExam({
        selected_exam_id:props.selected_id,
        student_id:props.student_id,
        compare_exam_ids:"'"+value + "'"
    }).then(res => {
        handleUpandDown(res)
    })
    getGradeApi({
      student_id: props.student_id,
      exam_id: parseInt(value),
    }).then((res:{code:number,data:CompareScore[],msg:string})=> { 
      if(res.code === 200 && res.data?.[0]) {
        const compareScoreData = []
        // 过滤异常成绩
        const safeScore = (score: any, max: number) => isFinite(score) && score <= max ? score : 0;
        for(let i of dynamicSubjectNames.value){
          // @ts-ignore
          const score = res.data[0][subjects_inflection[i.name]];
          compareScoreData.push(safeScore(score, i.max));
        }
        emit('update:compareScoreData', compareScoreData);
      }else {
        message.error(res.msg)
      }
    });
}

const debouncedLoadTableAndRadar = debounce(loadTableAndRadar, 300);

const handleChange = (value:string) => {
    compareExamId.value = value;
    debouncedLoadTableAndRadar(value)
}

// 根据选科动态确定科目名称
const dynamicSubjectNames = computed(() => {
  let subjects = [
    {name: '语文', max: 150},
    {name: '英语', max: 150},
    {name: '数学', max: 150}
  ]
  if (props.studentInfo?.subject_selection) {
    for (let i  of [{name:'物',value:'物理'},{name:'化',value:'化学'}, {name:'生',value:'生物'},{name:'史',value:'历史'},{name:'地',value:'地理'},{name:'政',value:'政治'}]) {
      if(props.studentInfo.subject_selection.includes(i.name)) {
        subjects.push({name: i.value, max: 100})
      }
    }
  }
  return subjects
});
</script>

<style scoped>
.section-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    flex-wrap: wrap;
    gap: 10px;
}

.exam-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
}

.table-wrapper {
  overflow-x: auto;
}

.table-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.description {
  margin-top: 10px;
  font-size: 0.9em;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ddd;
}
</style>
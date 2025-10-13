<template>
  <div class="table-section">
    <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <h2 class="exam-title">对比：</h2>
        <a-select
            placeholder="请选择考试"
            style="min-width: 150px; margin-left: 15px;"
            @change="handleChange"
            v-model:value="compareExamId"
            :value="examList.filter(i=> i.id === compareExamId)[0]?.name"
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
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { Table as ATable } from 'ant-design-vue';
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
const tableData = ref<{
        subject : any | string,
        rankChangeClass:any,
        rankChangeSegment:any,
    }[]>([])

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
      if(res.code === 200) {
        // @ts-ignore
        const compareScoreData = []
        for(let i of dynamicSubjectNames.value){
          // @ts-ignore
          compareScoreData.push(res.data[0][subjects_inflection[i.name]])
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
  if (props.studentInfo) {
    for (let i  of [{name:'物',value:'物理'},{name:'化',value:'化学'}, {name:'生',value:'生物'},{name:'史',value:'历史'},{name:'地',value:'地理'},{name:'政',value:'政治'}]) {
      if(props.studentInfo.subject_selection && props.studentInfo.subject_selection.includes(i.name)) {
        subjects.push({name: i.value, max: 100})
      }
    }
  }
  return subjects
});

watch(
  () => props.examList,
  (newExamList) => {
    if (newExamList && newExamList.length > 0 && compareExamId.value !== newExamList[0].id) {
      compareExamId.value = newExamList[0].id;
      debouncedLoadTableAndRadar(newExamList[0].id);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.exam-title {
    text-align: left;
    margin: 0;
}

.table-section {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.description {
  margin-top: 10px;
  font-size: 0.9em;
  margin-bottom: 15px;
}
</style>
<template>
  <div class="analysis-container">
    <div class="controls-row">
        <span class="label">对比考试：</span>
        <a-select
            placeholder="请选择考试"
            style="min-width: 150px;"
            @change="handleChange"
            v-model:value="compareExamId"
            size="middle"
        >
            <a-select-option v-for="item in examList" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
        </a-select> 
    </div>
    <div class="legend-bar">
        <span class="legend-item"><span class="dot red"></span> 退步</span>
        <span class="legend-item"><span class="dot green"></span> 进步</span>
    </div>
    <div class="table-wrapper">
      <a-table
        :columns="currentExamColumns"
        :data-source="tableData"
        :pagination="false"
        size="middle"
        bordered
        class="analysis-table"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
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
    subjects?: Array<{ name: string; max: number }>
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

    const selection = props.studentInfo?.subject_selection;
    const hasSelection = typeof selection === 'string' && selection.length > 0;
    const extras = [
        { short: '物', name: '物理', b: 'wulib', d: 'wulid' },
        { short: '化', name: '化学', b: 'huaxueb', d: 'huaxued' },
        { short: '生', name: '生物', b: 'shengwub', d: 'shengwud' },
        { short: '史', name: '历史', b: 'lishib', d: 'lishid' },
        { short: '地', name: '地理', b: 'dilib', d: 'dilid' },
        { short: '政', name: '政治', b: 'zhengzhib', d: 'zhengzhid' }
    ] as const;

    addSubjectData('总分', res.data[0].compareB.sumb, res.data[0].compareD.sumd);
    addSubjectData('语文', res.data[0].compareB.yuwenb, res.data[0].compareD.yuwend);
    addSubjectData('英语', res.data[0].compareB.yingyub, res.data[0].compareD.yingyud);
    addSubjectData('数学', res.data[0].compareB.shuxueb, res.data[0].compareD.shuxued);

    for (const e of extras) {
        if (!hasSelection || selection.includes(e.short)) {
            addSubjectData(
                e.name,
                (res.data[0].compareB as any)[e.b],
                (res.data[0].compareD as any)[e.d]
            );
        }
    }
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
        for(let i of subjectsList.value){
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

const subjectsList = computed(() => {
  if (props.subjects && props.subjects.length) return props.subjects;
  const base = [
    { name: '语文', max: 150 },
    { name: '英语', max: 150 },
    { name: '数学', max: 150 }
  ];
  const extra = [{ n:'物', v:'物理' },{ n:'化', v:'化学' },{ n:'生', v:'生物' },{ n:'史', v:'历史' },{ n:'地', v:'地理' },{ n:'政', v:'政治' }];
  const result = [...base];
  for (const i of extra) {
    if (props.studentInfo?.subject_selection?.includes(i.n)) {
      result.push({ name: i.v, max: 100 });
    }
  }
  return result;
});

watch(
  () => props.examList,
  (list) => {
    if (list?.length && !compareExamId.value) {
      compareExamId.value = list[0].id;
      handleChange(compareExamId.value);
    }
  },
  { deep: true }
);

watch(
  () => props.selected_id,
  () => {
    if (compareExamId.value) {
      debouncedLoadTableAndRadar(compareExamId.value);
    }
  }
);

watch(
  () => subjectsList.value,
  () => {
    if (compareExamId.value) {
      debouncedLoadTableAndRadar(compareExamId.value);
    }
  },
  { deep: true }
);


watch(
  () => props.examList,
  (list) => {
    if (list?.length && !compareExamId.value) {
      compareExamId.value = list[0].id;
      handleChange(compareExamId.value);
    }
  },
  { deep: true }
);

watch(
  () => props.selected_id,
  () => {
    if (compareExamId.value) {
      debouncedLoadTableAndRadar(compareExamId.value);
    }
  }
);

watch(
  () => subjectsList.value,
  () => {
    if (compareExamId.value) {
      debouncedLoadTableAndRadar(compareExamId.value);
    }
  },
  { deep: true }
);

</script>

<style scoped lang="less">
.analysis-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.controls-row {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    
    .label {
        font-size: 14px;
        color: #64748B;
        margin-right: 8px;
    }
}

.legend-bar {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: #64748B;
    justify-content: flex-end;
    margin-top: -8px; // Pull closer to controls
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        
        .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            
            &.red { background: #EF4444; } // Red 500
            &.green { background: #10B981; } // Green 500
        }
    }
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #F1F5F9;
}

:deep(.analysis-table) {
    .ant-table-thead > tr > th {
        background: #F8FAFC;
        font-weight: 600;
        color: #475569;
    }
}
</style>

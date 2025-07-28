<template>
  <div class="student-analysis-page">
    <a-button class="back-button" @click="goBack">返回</a-button>
    <a-space class="selector">
      <div class="select-item">
        <span style="">学期选择：</span>
        <a-select :options="termList" v-model:value="termSelected"></a-select>
      </div>
      <a-button type="primary" style="display: flex;" @click="submit">确定</a-button>  
    </a-space>
    <div class="tables-container" v-if="!isLoading">
      <!-- 考试统计表格区域 -->
      <div class="table-section">
        <h2>考试统计 <span class="total-exams">共统计{{ examListSelected.length }}场考试</span></h2>
        <p class="description">说明：一本率低于60%为<span style="color: red;">红色</span>，在60%到80%之间为<span style="color: orange;">橙色</span>。</p>
        <a-table
          :columns="examStatsColumns"
          :data-source="examAnalysisList"
          :pagination="false"
          size="middle"
          style="font-size: larger;"
          bordered
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { Button as AButton, Table as ATable, message } from 'ant-design-vue';
import type { ColumnType } from 'ant-design-vue/es/table';
import { useUserStore } from '@/store';
import { getStudentExamApi } from '@/servers/api/student';
import { postPassLineAnalysis} from '@/servers/api/analysis';

type ExamAnalysis = {
  key: string;
  subject: string;
  passCount : number;
  passRate: string;
}
const userInfo = ref()
const examAnalysisList = ref<ExamAnalysis[]>([])
const subjects_map = ref<{[key: string]: string}>({
    'Dili':'地理','Huaxue':'化学','Lishi':'历史','Shengwu':'生物','Shuxue':'数学',
    'Wuli':'物理','Yingyu':'英语','Yuwen':'语文','Zhengzhi':'政治','sum_':'总分'
  })
const router = useRouter();
const userStore = useUserStore();
const examListSelected = ref<any[]>([]);
const examList = ref<any[]>([]);

// 加载状态
const isLoading = ref(true);

// 考试统计表格列定义
const examStatsColumns: ColumnType[] = [
  {
    title: '科目',
    dataIndex: 'subject',
    key: 'subject',
    align: 'center',
  },
  {
    title: '一本进线次数',
    dataIndex: 'passCount',
    key: 'passCount',
    align: 'center',
  },
  {
    title: '一本进线率',
    dataIndex: 'passRate',
    key: 'passRate',
    align: 'center',
    customRender: ({ text }: { text: string }) => {
      return text;
    },
    customCell: ({ text }: { text: number }) => {
      const rate = Number(text) * 100; // 转换为百分比，并确保是数字
      let color = 'rgba(0, 0, 0, 0.85)'; // Default color
      if (isNaN(rate)) {
        color = 'rgba(0, 0, 0, 0.85)'; // Fallback to black for invalid data
      } else if (rate < 60) {
        color = '#f5222d'; // Red
      } else if (rate >= 60 && rate < 80) {
        color = 'orange'; // Orange
      } else {
        color = '#52c41a'; // Green
      }
      return { style: { color } };
    }
  }
];

const default_term = [{label:'所有成绩',value:'all'}]
const termList = ref<{label:string,value:string}[]>(default_term)
const termSelected = ref(default_term[0].label)


// 获取学生信息
const fetchStudentInfo = async () => {
  try {
    userInfo.value = userStore.userInfo;
    let studentId = userInfo.value.role;

    if (!studentId) {
      console.warn('Pinia store 中没有找到有效的用户角色ID，无法获取学生信息。', userInfo);
      isLoading.value = false;
      return;
    }
  } catch (error) {
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

const fetchExamList = async () => { 

  const studentId = userInfo.value.role;
  if(!studentId) {
    message.error('用户绑定的学生id不存在')
    return;
  }
  const res = await getStudentExamApi({student_uid: studentId})
  
  examList.value = []
  termList.value = default_term
  if (res.code === 200) {
    for(let item in res.data) {
      examList.value.push({
        value: res.data[item][0].id,
        label: res.data[item][0].name,
        year: res.data[item][0].year,
      })
      examListSelected.value.push(res.data[item][0].id)
    }
    // 统计学生有几个学期的成绩，放在termList.value中
    for(let item of res.data) {
      const year = item[0].year
      if(!termList.value.some(term => term.value === year)) {
        termList.value.push({
          value: year,
          label: year
        })
      }
      if(termList.value.length > 0) {
        termSelected.value = termList.value[0].value
      }
    }
  } else {
    message.error(res.message);
  }
};

const submit = () => {
  const studentId = userInfo.value.student.uid
  if(!studentId) {
    message.error('获取学生id失败！');
    return
  }
  examListSelected.value = []

  termSelected.value === 'all' ? examListSelected.value = examList.value.map(item => item.value):examListSelected.value = examList.value.filter(item => item.year === termSelected.value).map(item => item.value)
  
  postPassLineAnalysis({ student_id: userInfo.value.role, exam_ids: examListSelected.value}).then((res)=>{
    examAnalysisList.value = []
    for(let item in res.data) {
      if(item in subjects_map.value) {
        examAnalysisList.value.push({
          key: item,
          subject: subjects_map.value[item],
          passCount: res.data[item].pass_count,
          passRate: res.data[item].pass_rate,
        })
      }
    }
  })
}

const bindStudentSubject = ()=> {
  const  selected_subjects = userInfo.value.student.subject_selection
  if(!selected_subjects) {
    message.warn('学生还未选科,默认显示所有科目')
    return
  }
  if(selected_subjects.indexOf('物')==-1){
    delete subjects_map.value.Wuli
  }
  if(selected_subjects.indexOf('化')==-1) {
    delete subjects_map.value.Huaxue
  }
  if(selected_subjects.indexOf('政')==-1) {
    delete subjects_map.value.Zhengzhi
  }
  if(selected_subjects.indexOf('生')==-1) {
    delete subjects_map.value.Shengwu
  }
  if(selected_subjects.indexOf('史')==-1) {
    delete subjects_map.value.Lishi
  }
  if(selected_subjects.indexOf('地')==-1) {
    delete subjects_map.value.Dili
  }
}
const goBack = () => {
  router.push('/analysis');
};
onMounted(async() => {
  fetchStudentInfo();
  bindStudentSubject();
  await fetchExamList();
  submit();
});
</script>

<style scoped>
.student-analysis-page {
  padding: 20px;
  position: relative; /* Needed for absolute positioning of the button */
  height: 100%; /* Make the container fill the height */
  overflow-y: auto; /* Add vertical scrolling */
  box-sizing: border-box; /* Include padding in height calculation */
  background-color: #f5f5f5;
}

.back-button {
  display: flex;
  padding: 5px 10px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  z-index: 10; /* Ensure button is above other content */
}

.tables-container {
  display: flex; /* 使用 flexbox 实现并列布局 */
  gap: 20px; /* 表格之间的间隔 */
  margin-top: 40px; /* Add margin to prevent overlap with button */
  background-color: white;
  padding: 20px;
  min-width: 300px;
  border-radius: 10px;
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

.total-exams {
  font-size: 0.9em;
  color: #666;
  margin-left: 10px;
}

.description {
  margin-top: 10px;
  font-size: 0.9em;
}

.selector {
  margin-top: 30px;
  min-width: 300px;
  background-color: white;
  width: 100%;
  padding: 20px;
  border-radius: 10px;
}
.exam-list-container {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
}
.exam-list-group {
  width: 80%;
}

</style> 
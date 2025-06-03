<template>
  <div class="compare-container">
    <div class="filter-bar">
      <a-select
        v-model:value="selectedClass"
        placeholder="班级"
        style="width:120px"
        :options="classList.map(item => ({ label: item.name, value: item.id }))"
        @change="onClassChange"
      />
      <a-select
        v-model:value="selectedTerm"
        placeholder="学期"
        style="width:120px"
        :options="termList.map(item => ({ label: item.name, value: item.id }))"
        @change="onTermChange"
      />
      <a-select v-model:value="selectedStudent" placeholder="姓名" style="width:120px">
        <a-select-option v-for="item in studentList" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
      </a-select>
      <a-radio-group v-model:value="mode" style="margin:0 12px">
        <a-radio value="rank">按段/次数生成</a-radio>
        <a-radio value="score">按分数生成</a-radio>
      </a-radio-group>
      <a-button type="primary" @click="fetchData">查询</a-button>
    </div>
    <div class="charts-area scrollable-area">
      <div class="chart-block">
        <div class="chart-title">{{ studentName }}总分折线图</div>
        <v-chart :option="totalOption" autoresize style="height:300px;" />
      </div>
      <div v-for="subject in subjects" :key="subject" class="chart-block">
        <div class="chart-title">{{ studentName }}{{ subject }}折线图</div>
        <v-chart :option="getSubjectOption(subject)" autoresize style="height:300px;" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/store'
import VChart from 'vue-echarts'

// 1. 班级、学期、学生列表
const classList = ref<any[]>([])
const termList = ref<any[]>([])
const studentList = ref<any[]>([])
const selectedClass = ref()
const selectedTerm = ref()
const selectedStudent = ref()
const studentName = computed(() => {
  const stu = studentList.value.find(s => s.id === selectedStudent.value)
  return stu ? stu.name : ''
})

// 2. 查询方式
const mode = ref<'rank'|'score'>('rank')

// 3. 科目列表
const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']

// 4. 查询结果
const examNames = ref<string[]>([])
const totalData = ref<any[]>([])
const subjectData = ref<Record<string, any[]>>({})

// 5. 获取班级、学期、学生
onMounted(async () => {
  // 假设有接口获取班级、学期、学生列表
  // 这里用静态数据模拟
  classList.value = [{ id: 1, name: '班级' }]
  termList.value = [{ id: 1, name: '学期' }]
  // 获取学生列表
  const res = await getStudentApi({ class_id: classList.value[0].id })
  studentList.value = res.data || []
  selectedClass.value = classList.value[0].id
  selectedTerm.value = termList.value[0].id
  selectedStudent.value = studentList.value[0]?.id
})

// 6. 选择班级/学期时刷新学生
const onClassChange = async () => {
  const res = await getStudentApi({ class_id: selectedClass.value })
  studentList.value = res.data || []
  selectedStudent.value = studentList.value[0]?.id
}
const onTermChange = () => {
  // 如有学期相关逻辑可补充
}

// 7. 查询成绩
const fetchData = async () => {
  if (!selectedStudent.value) return
  // 假设 getGradeApi 支持按学生、班级、学期、模式查询
  const res = await getGradeApi({
    student_id: selectedStudent.value,
    class_id: selectedClass.value
  })
  // 假设返回格式如下
  // res.data = [{ exam: '2.11开学考', sum_: 600, sumD: 100, sumLine: 550, Yuwen: 120, YuwenLine: 110, ... }, ...]
  const exams = res.data || []
  examNames.value = exams.map((e: any) => e.exam)
  totalData.value = exams.map((e: any) => ({
    score: e.sum_,
    line: e.sumLine,
    rank: e.sumD
  }))
  // 各科
  subjectData.value = {}
  for (const subject of subjects) {
    subjectData.value[subject] = exams.map((e: any) => ({
      score: e[subject],
      line: e[subject + 'Line'],
      rank: e[subject + 'D']
    }))
  }
}

// 8. ECharts 配置
const totalOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['总分', '一本线'] },
  xAxis: { type: 'category', data: examNames.value },
  yAxis: { type: 'value' },
  series: [
    {
      name: '总分',
      type: 'line',
      data: totalData.value.map(d => d.score),
      itemStyle: { color: '#5470C6' }
    },
    {
      name: '一本线',
      type: 'line',
      data: totalData.value.map(d => d.line),
      itemStyle: { color: '#EE6666' }
    }
  ]
}))

const getSubjectOption = (subject: string) => ({
  tooltip: { trigger: 'axis' },
  legend: { data: [subject, '一本线'] },
  xAxis: { type: 'category', data: examNames.value },
  yAxis: { type: 'value' },
  series: [
    {
      name: subject,
      type: 'line',
      data: subjectData.value[subject]?.map(d => d.score) || [],
      itemStyle: { color: '#5470C6' }
    },
    {
      name: '一本线',
      type: 'line',
      data: subjectData.value[subject]?.map(d => d.line) || [],
      itemStyle: { color: '#EE6666' }
    }
  ]
})

const getGradeApi = async (params: any) => {
  const res = await axios.get('/api/grade/', { params })
  return res.data
}

const getStudentApi = async (params: any) => {
  const res = await axios.get('/api/student/', { params })
  return res.data
}

const getStudentExamApi = async (student_uid: string) => {
  const res = await axios.get(`/api/student/${student_uid}/exam`)
  return res.data
}

const fetchStudents = async (classId: any) => {
  const res = await getStudentApi({ class_id: classId })
  studentList.value = res.data || []
}

const examList = ref([])
const fetchExams = async (studentUid: any) => {
  const res = await getStudentExamApi(studentUid)
  examList.value = res.data || []
}

const fetchGrades = async (studentUid: any, examId: any) => {
  const res = await getGradeApi({ student_id: studentUid, exam_id: examId })
  // 处理成绩数据
}
</script>

<style scoped lang="less">
.compare-container {
  position: relative;
  height: 100vh;
  overflow: scroll;
  padding: 20px;
 
  margin: auto;
  padding-bottom: 0;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}
.charts-area {
  margin-top: 24px;
}
.scrollable-area {
  overflow-y: auto;
  /* 美化滚动条 */
  scrollbar-width: thin;
  scrollbar-color: #b3b3b3 #f5f5f5;
}
.scrollable-area::-webkit-scrollbar {
  width: 8px;
}
.scrollable-area::-webkit-scrollbar-thumb {
  background: #b3b3b3;
  border-radius: 4px;
}
.scrollable-area::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 4px;
}
.chart-block {
  margin-bottom: 32px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px #eee;
  padding: 16px;
}
.chart-title {
  font-weight: bold;
  margin-bottom: 8px;
}
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .compare-container {
    padding: 4px;
  }
}
</style>

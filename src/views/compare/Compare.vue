<template>
  <div class="compare-container">
    <div class="filter-bar">
      <a-radio-group v-model:value="mode" style="margin:0 12px">
        <a-radio value="rank">按段/次数生成</a-radio>
        <a-radio value="score">按分数生成</a-radio>
      </a-radio-group>
      <a-button type="primary" @click="fetchData">查询</a-button>
    </div>
    <div class="charts-area scrollable-area">
      <div v-for="(subject, index) in subjects" :key="subject" class="chart-block">
        <div class="chart-title">{{ studentName }}{{ subject }}折线图</div>
        <v-chart :option="options[index]" autoresize style="height:300px;" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import VChart from 'vue-echarts'
import { getPassLine, getUpDownDetailAnalysis } from '@/servers/api/analysis'

// 1. 班级、学期、学生列表
const studentList = ref<any[]>([])
const options = ref<any[]>([])
const selectedStudent = ref()
const messageReturn = ref<any[]>([])
const studentName = computed(() => {
  const stu = studentList.value.find(s => s.id === selectedStudent.value)
  return stu ? stu.name : ''
})

// 2. 查询方式
const mode = ref<'rank'|'score'>('rank')

type tableRuleProp = {
  score: number,
  line: number
}

// 3. 科目列表
const subjects = ['总分','语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
const fieldMappingRank = {
    '语文': 'YuwenD',
    '数学': 'ShuxueD',
    '英语': 'YingyuD',
    '物理': 'WuliD',
    '化学': 'HuaxueD',
    '生物': 'ShengwuD',
    '历史': 'LishiD',
    '地理': 'DiliD',
    '政治': 'ZhengzhiD'
  }
  // 字段映射
const fieldMappingScore = {
    '语文': 'Yuwen',
    '数学': 'Shuxue',
    '英语': 'Yingyu',
    '物理': 'Wuli',
    '化学': 'Huaxue',
    '生物': 'Shengwu',
    '历史': 'Lishi',
    '地理': 'Dili',
    '政治': 'Zhengzhi'
  }
// 定义类型接口
interface ScoreItem {
  score: number | null;
  line: number | null;
}

interface SubjectData {
  x_name: string[];
  y_score: ScoreItem[];
}

interface TempDataType {
  [key: string]: SubjectData;
}

// 4. 查询结果
const totalData = ref<TempDataType>({} as TempDataType)

// 5. 获取班级、学期、学生
onMounted(async () => {
  // 从localStorage中获取用户信息
  const userString = localStorage.getItem('user');
  if (!userString) {
    console.error('localStorage中没有找到用户信息。');
    messageReturn.value = [];
    return;
  }
  let userInfo: any;
  try {
    userInfo = JSON.parse(userString);
  } catch (e) {
    console.error('解析用户信息失败:', e);
    messageReturn.value = [];
    return;
  }

  if (!userInfo || !userInfo.role) {
    console.error('用户信息不完整或角色ID缺失。', userInfo);
    messageReturn.value = [];
    return;
  }

  const studentId = parseInt(userInfo.role);
  if (isNaN(studentId)) {
    console.error('学生ID无效:', userInfo.role);
    messageReturn.value = [];
    return;
  }

  // 查询学生近几次考试的成绩
  try {
    console.log('调用 getUpDownDetailAnalysis, student_id:', studentId);
    const recent_result = await getUpDownDetailAnalysis({'student_id':studentId,'nums':9999})
    console.log('getUpDownDetailAnalysis 响应:', recent_result);

    if (!recent_result || !recent_result.data) {
      console.warn('getUpDownDetailAnalysis did not return any data or returned null/undefined.');
      messageReturn.value = []; // Initialize to empty array if no data
      return;
    }
    messageReturn.value = recent_result.data;
    generateTable(recent_result.data,fieldMappingScore);
  } catch (error) {
    console.error('获取学生近期考试成绩失败:', error);
    messageReturn.value = []; // Ensure messageReturn is empty on error
  }
})

const generateTable = async (examData : any[], types: Object)=>{
  // 分开获取总分和各科成绩数组已经对应的考试名称

  const tempData: TempDataType = {
    '总分': {'x_name': [], 'y_score': []},
    '语文': {'x_name': [], 'y_score': []},
    '数学': {'x_name': [], 'y_score': []},
    '英语': {'x_name': [], 'y_score': []},
    '物理': {'x_name': [], 'y_score': []},
    '化学': {'x_name': [], 'y_score': []},
    '生物': {'x_name': [], 'y_score': []},
    '历史': {'x_name': [], 'y_score': []},
    '地理': {'x_name': [], 'y_score': []},
    '政治': {'x_name': [], 'y_score': []}
  }

  for(let item of examData) {
    const examName = item.exam[0].name;
    console.log(item)
    // 获取该考试的一本线分数
    let passLine = null;
    const examId = item.exam[0].id;
    if (typeof examId !== 'number' || isNaN(examId)) {
      console.warn('Invalid exam ID in item:', item);
      continue; // Skip this item if exam ID is invalid
    }

    try {
      console.log('调用 getPassLine, exam_id:', examId);
      passLine = await getPassLine({'exam_id':examId});
      console.log('getPassLine 响应:', passLine);
    } catch (error) {
      console.error('获取一本线数据失败，考试ID:', examId, error);
    }
    
    // 处理总分
    tempData['总分']['x_name'].push(examName);
    tempData['总分']['y_score'].push({
      score: item.sum_,
      line: passLine.data.sum_, // 如果有一本线数据，可以在这里添加
    });

    // 处理各科目成绩
    for(const [subject, field] of Object.entries(types)) {
      tempData[subject]['x_name'].push(examName);
      tempData[subject]['y_score'].push({
        score: item[field] || null,
        line: passLine.data[field], // 如果有一本线数据，可以在这里添加
      });
    }
  }
  totalData.value = tempData
  // 为每个科目生成图表配置
  options.value = subjects.map(subject => getSubjectOption(subject))
}

// 7. 查询成绩
const fetchData = async () => {
  console.log(options.value)
  if (mode.value === 'rank') {
    // 获取所有考试的一本线分数
    if (messageReturn.value) {
      generateTable(messageReturn.value,fieldMappingRank)
    }
  }
  else {
    // 获取所有考试的一本线分数
    if (messageReturn.value) {
      generateTable(messageReturn.value,fieldMappingScore)
    }
  }
}

const getSubjectOption = (subject: string) => {
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: [subject, '一本线'] },
    xAxis: { type: 'category', data: totalData.value[subject]['x_name'] },
    yAxis: { type: 'value' },
    series: [
      {
        name: subject,
        type: 'line',
        data: totalData.value[subject]['y_score']?.map(d => d.score) || [],
        itemStyle: { color: '#5470C6' }
      },
      {
        name: '一本线',
        type: 'line',
        data: totalData.value[subject]['y_score']?.map(d => d.line) || [],
        itemStyle: { color: '#EE6666' }
      }
    ]
  };
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
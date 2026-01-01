<template>
  <div class="compare-container">
    <a-card class="filter-card">
      <div class="filter-bar">
        <a-radio-group v-model:value="mode" style="margin:0 12px">
          <a-radio value="rank">按名次</a-radio>
          <a-radio value="score">按分数</a-radio>
        </a-radio-group>
        <a-button type="primary" @click="fetchData">查询</a-button>
      </div>
    </a-card>
    
    <div class="charts-area">
      <a-card 
        v-for="(subject, index) in subjects" 
        :key="subject" 
        class="chart-card"
        :bordered="false"
      >
        <template #title>
          <div class="chart-title">{{ studentName }}{{ subject }}{{ mode == 'rank' ? '历次排名':'成绩' }}</div>
        </template>
        <v-chart :option="options[index]" autoresize class="chart-wrapper" />
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import VChart from 'vue-echarts'
import { getPassLine, getUpDownDetailAnalysis } from '@/servers/api/analysis'
import { message } from 'ant-design-vue'
import { Card } from 'ant-design-vue'

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
const mode = ref<'rank'|'score'>('score')

type tableRuleProp = {
  score: number,
  line: number
}

// 3. 科目列表
const subjects = ['总分','语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
const fieldMappingRank = {
    '语文': 'yuwend',
    '数学': 'shuxued',
    '英语': 'yingyud',
    '物理': 'wulid',
    '化学': 'huaxued',
    '生物': 'shengwud',
    '历史': 'lishid',
    '地理': 'dilid',
    '政治': 'zhengzhid'
  }
  // 字段映射
const fieldMappingScore = {
    '语文': 'yuwen',
    '数学': 'shuxue',
    '英语': 'yingyu',
    '物理': 'wuli',
    '化学': 'huaxue',
    '生物': 'shengwu',
    '历史': 'lishi',
    '地理': 'dili',
    '政治': 'zhengzhi'
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
    console.log('实际的考试数据结构:', recent_result.data);
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
    if(item.exam === undefined) {
      message.error('似乎还没有参加一场考试');
      return
    }
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
    
    // 处理一本线数据，确保正确处理数组格式
    let selectedPassLine = null;
    if (passLine && passLine.data && Array.isArray(passLine.data) && passLine.data.length > 0) {
      // 如果返回的是数组，需要根据学生选科来选择正确的一本线
      // 简化处理：优先选择包含学生实际考试科目的一本线
      const passLineData = passLine.data;
      
      // 查找最适合的一本线（根据学生是否有该科目成绩来判断）
      for (const line of passLineData) {
        let matchCount = 0;
        // 检查理科科目
        if (item.wuli !== undefined || item.huaxue !== undefined || item.shengwu !== undefined) {
          if ((item.wuli !== undefined && line.wuli !== undefined) ||
              (item.huaxue !== undefined && line.huaxue !== undefined) ||
              (item.shengwu !== undefined && line.shengwu !== undefined)) {
            matchCount++;
          }
        }
        // 检查文科科目
        if (item.lishi !== undefined || item.zhengzhi !== undefined || item.dili !== undefined) {
          if ((item.lishi !== undefined && line.lishi !== undefined) ||
              (item.zhengzhi !== undefined && line.zhengzhi !== undefined) ||
              (item.dili !== undefined && line.dili !== undefined)) {
            matchCount++;
          }
        }
        
        if (matchCount > 0) {
          selectedPassLine = line;
          break;
        }
      }
      
      // 如果没有找到匹配的，就使用第一个
      if (!selectedPassLine) {
        selectedPassLine = passLineData[0];
      }
    } else if (passLine && passLine.data) {
      // 如果返回的是对象
      selectedPassLine = passLine.data;
    }
    
    // 处理总分 - 添加默认值处理
    tempData['总分']['x_name'].push(examName);
    tempData['总分']['y_score'].push({
      score: item.sum_ !== null ? item.sum_ : 0,
      line: selectedPassLine && selectedPassLine.sum_ !== undefined && selectedPassLine.sum_ !== null ? selectedPassLine.sum_ : 0,
    });

    // 处理各科目成绩 - 添加默认值处理
    for(const [subject, field] of Object.entries(types)) {
      tempData[subject]['x_name'].push(examName);
      tempData[subject]['y_score'].push({
        score: item[field] !== null ? item[field] : 0,
        line: selectedPassLine && selectedPassLine[field] !== undefined && selectedPassLine[field] !== null ? selectedPassLine[field] : 0,
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
  // 确保数据存在并处理null值
  const subjectData = totalData.value[subject] || { x_name: [], y_score: [] };
  const scores = subjectData.y_score?.map(d => d.score !== null ? d.score : 0) || [];
  const lines = subjectData.y_score?.map(d => d.line !== null ? d.line : 0) || [];

  // 为不同科目设置不同的颜色
  const colorMap: Record<string, string[]> = {
    '总分': ['#5470C6', '#EE6666'],
    '语文': ['#91CC75', '#EA7CCC'],
    '数学': ['#FAC858', '#73C0DE'],
    '英语': ['#EE6666', '#5470C6'],
    '物理': ['#73C0DE', '#FAC858'],
    '化学': ['#91CC75', '#EA7CCC'],
    '生物': ['#FAC858', '#73C0DE'],
    '历史': ['#EA7CCC', '#91CC75'],
    '地理': ['#5470C6', '#EE6666'],
    '政治': ['#73C0DE', '#FAC858']
  };
  
  const colors = colorMap[subject] || ['#5470C6', '#EE6666'];

  return {
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#ccc',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      }
    },
    legend: { 
      data: ['本人成绩', '一本线'],
      top: '10%',
      textStyle: {
        color: '#666'
      }
    },
    xAxis: { 
      type: 'category', 
      data: subjectData.x_name || [],
      axisLabel: { 
        textStyle: {
          fontSize: 12,
          fontFamily: 'SimHei',
          color: '#666'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
     },
    yAxis: { 
      type: 'value',
      axisLabel: {
        textStyle: {
          color: '#666'
        }
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#eee'
        }
      }
    },
    series: [
      {
        name: '本人成绩',
        type: 'line',
        data: scores,
        itemStyle: { 
          color: colors[0],
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowBlur: 3
        },
        lineStyle: {
          width: 3
        },
        smooth: true,
        symbolSize: 6
      },
      {
        name: '一本线',
        type: 'line',
        data: lines,
        itemStyle: { 
          color: colors[1],
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowBlur: 3
        },
        lineStyle: {
          width: 3,
          type: 'dashed'
        },
        smooth: true,
        symbolSize: 6
      }
    ],
    grid: {
      left: '5%',
      right: '5%',
      top: '20%',
      bottom: '15%',
      containLabel: true
    }
  };
}

</script>

<style scoped lang="less">
.compare-container {
  position: relative;
  height: 100vh;
  overflow: auto;
  padding: 20px;
  background-color: #f0f2f5;
}
.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  :deep(.ant-card-body) {
    padding: 20px;
  }
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.charts-area {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.chart-card {
  width: 100%;
  min-height: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  :deep(.ant-card-head) {
    border-bottom: none;
    padding: 0 16px;
  }
  :deep(.ant-card-body) {
    padding: 16px;
    height: calc(100% - 66px);
  }
}
.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: normal;
  word-break: break-all;
  line-height: 1.4;
  padding: 12px 0;
}
.chart-wrapper {
  height: 320px;
  width: 100%;
}
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .compare-container {
    padding: 12px;
  }
  .charts-area {
    gap: 12px;
  }
}
@media (max-width: 576px) {
  .chart-title {
    font-size: 14px;
  }
  .chart-wrapper {
    height: 280px;
  }
}
</style>
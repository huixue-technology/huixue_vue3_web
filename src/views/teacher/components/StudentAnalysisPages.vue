<template>
  <div class="student-analysis-pages-container">
    <div class="header">
      <h2>学生成绩趋势分析</h2>
      <p>查看学生各科目历次考试成绩或排名变化</p>
    </div>

    <div class="filter-section">
      <a-row :gutter="16">
        <a-col :xs="24" :sm="12" :md="8">
          <div class="filter-item">
            <span class="filter-label">数据类型：</span>
            <a-radio-group v-model:value="mode" style="width: 100%">
              <a-radio value="rank">按名次</a-radio>
              <a-radio value="score">按分数</a-radio>
            </a-radio-group>
          </div>
        </a-col>
        <a-col :xs="24" :sm="12" :md="4">
          <div class="filter-actions">
            <a-button type="primary" @click="fetchData">查询</a-button>
          </div>
        </a-col>
      </a-row>
    </div>
    
    <div class="charts-area" v-if="studentId">
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
    
    <div v-else class="empty-state">
      <a-empty description="请先选择学生" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { getPassLine, getUpDownDetailAnalysis } from '@/servers/api/analysis'
import { message, Empty } from 'ant-design-vue'

// 接收父组件传入的学生信息
const props = defineProps<{
  studentId?: string | number; // 学生ID
  studentName?: string; // 学生姓名
}>()

// 1. 响应式状态
const studentList = ref<any[]>([])
const options = ref<any[]>([])
const messageReturn = ref<any[]>([])
const mode = ref<'rank'|'score'>('score')
const totalData = ref<any>({})

// 2. 计算属性
const studentId = computed(() => props.studentId)
const studentName = computed(() => props.studentName || '选中学生')

// 3. 科目配置
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

// 4. 监听学生ID变化
watch(studentId, (newId) => {
  if (newId) {
    fetchStudentData(Number(newId))
  } else {
    messageReturn.value = []
    options.value = []
  }
}, { immediate: true })

// 5. 获取学生成绩数据
const fetchStudentData = async (stuId: number) => {
  try {
    const result = await getUpDownDetailAnalysis({ student_id: stuId, nums: 9999 })
    if (result?.data) {
      messageReturn.value = result.data
      generateTable(result.data, mode.value === 'rank' ? fieldMappingRank : fieldMappingScore)
    } else {
      message.warning('未查询到学生成绩数据')
      messageReturn.value = []
      options.value = []
    }
  } catch (error) {
    console.error('获取学生成绩失败:', error)
    message.error('获取成绩数据失败')
  }
}

// 6. 生成图表数据
const generateTable = async (examData: any[], types: Record<string, string>) => {
  const tempData: Record<string, any> = subjects.reduce((acc, subject) => {
    acc[subject] = { x_name: [], y_score: [] }
    return acc
  }, {})

  for (const item of examData) {
    if (!item.exam?.length) continue
    
    const examName = item.exam[0].name
    const examId = item.exam[0].id
    
    // 获取一本线数据
    let selectedPassLine = null
    try {
      if (examId) {
        const passLineRes = await getPassLine({ exam_id: examId })
        if (passLineRes?.data) {
          selectedPassLine = Array.isArray(passLineRes.data) 
            ? passLineRes.data[0] 
            : passLineRes.data
        }
      }
    } catch (error) {
      console.warn('获取一本线失败:', error)
    }

    // 处理总分
    tempData['总分'].x_name.push(examName)
    tempData['总分'].y_score.push({
      score: item.sum_ ?? 0,
      line: selectedPassLine?.sum_ ?? 0
    })

    // 处理各科目
    for (const [subject, field] of Object.entries(types)) {
      tempData[subject].x_name.push(examName)
      tempData[subject].y_score.push({
        score: item[field] ?? 0,
        line: selectedPassLine?.[field] ?? 0
      })
    }
  }

  totalData.value = tempData
  options.value = subjects.map(subject => getSubjectOption(subject))
}

// 7. 图表配置生成
const getSubjectOption = (subject: string) => {
  const subjectData = totalData.value[subject] || { x_name: [], y_score: [] }
  const scores = subjectData.y_score.map((d: any) => d.score || 0)
  const lines = subjectData.y_score.map((d: any) => d.line || 0)

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
  }
  const colors = colorMap[subject] || ['#5470C6', '#EE6666']

  return {
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#ccc',
      borderWidth: 1,
      textStyle: { color: '#333' }
    },
    legend: { 
      data: ['本人成绩', '一本线'],
      top: '10%',
      textStyle: { color: '#666' }
    },
    xAxis: { 
      type: 'category', 
      data: subjectData.x_name,
      axisLabel: { 
        textStyle: { fontSize: 12, fontFamily: 'SimHei', color: '#666' }
      },
      axisLine: { lineStyle: { color: '#ddd' } }
    },
    yAxis: { 
      type: 'value',
      axisLabel: { textStyle: { color: '#666' } },
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
    },
    series: [
      {
        name: '本人成绩',
        type: 'line',
        data: scores,
        itemStyle: { color: colors[0], shadowBlur: 3 },
        lineStyle: { width: 3 },
        smooth: true,
        symbolSize: 6
      },
      {
        name: '一本线',
        type: 'line',
        data: lines,
        itemStyle: { color: colors[1], shadowBlur: 3 },
        lineStyle: { width: 3, type: 'dashed' },
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
  }
}

// 8. 外部查询触发
const fetchData = () => {
  if (!studentId.value) {
    message.warning('请先选择学生')
    return
  }
  generateTable(
    messageReturn.value,
    mode.value === 'rank' ? fieldMappingRank : fieldMappingScore
  )
}
</script>

<style scoped lang="less">
.student-analysis-pages-container {
  padding: 24px;
  background-color: #fff;
  min-height: 100%;
}

.header {
  margin-bottom: 24px;
  
  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    color: #1f2329;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
}

.filter-section {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.filter-item {
  display: flex;
  align-items: center;
  width: 100%;
  
  .filter-label {
    flex: 0 0 auto;
    margin-right: 8px;
    color: #333;
    font-size: 14px;
    white-space: nowrap;
  }
}

.filter-actions {
  display: flex;
  align-items: center;
  height: 100%;
  justify-content: flex-start;
  padding-top: 24px;
  
  @media (max-width: 576px) {
    padding-top: 12px;
  }
}

.charts-area {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-card {
  width: 100%;
  min-height: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
  overflow: hidden;
  
  :deep(.ant-card-head) {
    background-color: #f8f9fa;
    border-bottom: 1px solid #e8e8e8;
    padding: 0 16px;
  }
  
  :deep(.ant-card-body) {
    padding: 24px;
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

.empty-state {
  padding: 60px 0;
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .student-analysis-pages-container {
    padding: 16px;
  }
  
  .filter-section {
    padding: 12px;
  }
  
  .charts-area {
    gap: 16px;
  }
}

@media (max-width: 576px) {
  .chart-title {
    font-size: 14px;
  }
  
  .chart-wrapper {
    height: 280px;
  }
  
  .filter-item {
    flex-direction: column;
    align-items: flex-start;
    
    .filter-label {
      margin-bottom: 8px;
    }
  }
}
</style>
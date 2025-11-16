<template>
    <div v-if="!loading">
      <!-- 分段统计卡片容器 -->
      <div class="segment-analysis-container">
        <!-- 主科和副科合并成绩分段统计 -->
        <div class="analysis-card segment-card">
          <a-card title="各科成绩分段统计" class="chart-card">
            <div class="chart-container">
              <e-charts class="score-chart" :option="subjectScoreOption" />
            </div>
          </a-card>
        </div>

        <!-- 总分分段统计 -->
        <div class="analysis-card segment-card">
          <a-card title="总分分段统计（满分750分）" class="chart-card">
            <div class="chart-container">
              <e-charts class="score-chart" :option="totalScoreOption" />
            </div>
          </a-card>
        </div>
      </div>
      <a-spin v-if="loading" tip="加载中..." class="loading-spin" />
    </div>
</template>

<script setup lang="ts">
import { getClassAnalysis } from '@/servers/api/analysis';
import { message } from 'ant-design-vue';
import { ref, defineProps, computed, onMounted, watch } from 'vue';
// 引入 echarts 组件
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts'; // 改为引入折线图
import { GridComponent, TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';

// 初始化 ECharts 核心模块
use([CanvasRenderer, LineChart, GridComponent, TitleComponent, TooltipComponent, LegendComponent]); // 改为使用折线图

const props = defineProps({
  exam_id: {
    type: Number,
    required: true
  },
  class_id: {
    type: Number,
    required: true
  }
});

const loading = ref(false);
const selectedExamId = ref(props.exam_id);
const classId = ref(props.class_id);

watch(() => props.exam_id, () => {
  selectedExamId.value = props.exam_id;
  classId.value = props.class_id;
  fetchClassAnalysis();
})
// 科目名称映射表
const subjectMap = {
  'Yuwen': '语文',
  'Shuxue': '数学',
  'Yingyu': '英语',
  'Wuli': '物理',
  'Huaxue': '化学',
  'Shengwu': '生物',
  'Lishi': '历史',
  'Zhengzhi': '政治',
  'Dili': '地理'
};

// 班级分析数据
const classAnalysisData = ref({
  danger_student: [] as any[],
  excellent_student: [] as any[],
  main_score_section: [] as any[],
  select_score_section: [] as any[],
  sum_score_section: [] as any[],
});

// 获取班级分析数据
const fetchClassAnalysis = async () => {
  loading.value = true;
  console.log("selectedExamId:", selectedExamId.value, "classId:", classId.value)
  if (!selectedExamId.value || !classId.value) {
    message.error('班级和所选考试id为空');
    loading.value = false;
    return
  }

  try {
    loading.value = true;
    const res = await getClassAnalysis({
      class_id: classId.value,
      exam_id: selectedExamId.value,
    });
    if (res.code === 200) {
      classAnalysisData.value = {
        danger_student: res.data.danger_student || [],
        excellent_student: res.data.excellent_student || [],
        main_score_section: res.data.main_score_section || [],
        select_score_section: res.data.select_score_section || [],
        sum_score_section: res.data.sum_score_section || [],
      };
    } else {
      message.error('获取班级分析数据失败');
    }
  } catch (err) {
    message.error('请求班级分析接口出错');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 格式化分数段数据
const formattedScoreSections = computed(() => {
  // 对总分分数段进行倒序处理
  const reversedSections = [...classAnalysisData.value.sum_score_section].reverse();
  return reversedSections.map((record: any, index: number) => {
    const key = Object.keys(record)[0] || '';
    const value = Object.values(record)[0] ?? 0;
    return { key: index, range: key, count: value };
  });
});

// 合并主科和副科数据用于图表展示
const combinedSubjectData = computed(() => {
  const result: any[] = [];
  
  // 获取所有分数段范围（去重并排序）
  const allRanges = new Set<string>();
  
  // 收集主科数据
  classAnalysisData.value.main_score_section.forEach((subjectObj: any) => {
    Object.entries(subjectObj).forEach(([enSubject, sections]) => {
      (sections as any[]).forEach((section: any) => {
        const range = Object.keys(section)[0];
        allRanges.add(range);
      });
    });
  });
  
  // 收集副科数据
  classAnalysisData.value.select_score_section.forEach((subjectObj: any) => {
    Object.entries(subjectObj).forEach(([enSubject, sections]) => {
      (sections as any[]).forEach((section: any) => {
        const range = Object.keys(section)[0];
        allRanges.add(range);
      });
    });
  });
  
  // 将分数段按从高到低排序
  const sortedRanges = Array.from(allRanges).sort((a, b) => {
    const aMin = parseInt(a.split('-')[0]);
    const bMin = parseInt(b.split('-')[0]);
    return bMin - aMin;
  });
  
  // 为每个分数段创建一行数据
  sortedRanges.forEach(range => {
    const row: any = { range };
    
    // 添加主科数据
    classAnalysisData.value.main_score_section.forEach((subjectObj: any) => {
      Object.entries(subjectObj).forEach(([enSubject, sections]) => {
        const cnSubject = subjectMap[enSubject as keyof typeof subjectMap] || enSubject;
        const section = (sections as any[]).find((s: any) => Object.keys(s)[0] === range);
        row[enSubject] = section ? section[range] : 0;
      });
    });
    
    // 添加副科数据
    classAnalysisData.value.select_score_section.forEach((subjectObj: any) => {
      Object.entries(subjectObj).forEach(([enSubject, sections]) => {
        const cnSubject = subjectMap[enSubject as keyof typeof subjectMap] || enSubject;
        const section = (sections as any[]).find((s: any) => Object.keys(s)[0] === range);
        row[enSubject] = section ? section[range] : 0;
      });
    });
    
    result.push(row);
  });
  
  return result;
});

// 各科成绩分段统计图表配置
const subjectScoreOption = computed(() => {
  // 获取所有分数段（X轴）
  const ranges = combinedSubjectData.value.map(item => item.range);
  
  // 获取所有科目名称
  const subjectKeys: string[] = [];
  const subjectNames: string[] = [];
  
  // 从主科和副科数据中提取科目
  classAnalysisData.value.main_score_section.forEach((subjectObj: any) => {
    Object.keys(subjectObj).forEach(enSubject => {
      if (!subjectKeys.includes(enSubject)) {
        subjectKeys.push(enSubject);
        subjectNames.push(subjectMap[enSubject as keyof typeof subjectMap] || enSubject);
      }
    });
  });
  
  classAnalysisData.value.select_score_section.forEach((subjectObj: any) => {
    Object.keys(subjectObj).forEach(enSubject => {
      if (!subjectKeys.includes(enSubject)) {
        subjectKeys.push(enSubject);
        subjectNames.push(subjectMap[enSubject as keyof typeof subjectMap] || enSubject);
      }
    });
  });
  
  // 为每个科目生成数据系列
  const series = subjectKeys.map((subjectKey, index) => {
    return {
      name: subjectNames[index],
      type: 'line', // 改为折线图
      // stack: '总量', // 折线图不需要堆叠
      // barGap: 0, // 折线图不需要此属性
      emphasis: {
        focus: 'series'
      },
      data: combinedSubjectData.value.map(item => item[subjectKey] || 0)
    };
  });
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross' // 折线图使用十字准线更合适
      }
    },
    legend: {
      data: subjectNames
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ranges
    },
    yAxis: {
      type: 'value'
    },
    series: series
  };
});

// 总分分段统计图表配置
const totalScoreOption = computed(() => {
  // 获取总分分数段数据
  const ranges = formattedScoreSections.value.map(item => item.range);
  const counts = formattedScoreSections.value.map(item => item.count);
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross' // 折线图使用十字准线更合适
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ranges
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '人数',
        type: 'line', // 改为折线图
        // barWidth: '60%', // 折线图不需要此属性
        data: counts,
        itemStyle: {
          color: '#5470C6'
        },
        // 添加标记点使折线图更清晰
        symbol: 'circle',
        symbolSize: 8
      }
    ]
  };
});

</script>

<style scoped>
.class-analysis-container {
  padding: 20px;
  height: 100vh;
  box-sizing: border-box;
  overflow-y: auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  font-size: 16px; /* 设置基础字体大小 */
}

.header {
  background: linear-gradient(120deg, #4b6cb7, #1890ff);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  color: white;
  
  h2 {
    margin: 0 0 10px 0;
    font-size: 24px;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    font-size: 16px;
    opacity: 0.9;
  }
}

.filter-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  
  .filter-item {
    display: flex;
    align-items: center;
    
    .filter-label {
      width: 80px;
      font-weight: 600;
      color: #333;
    }
  }
  
  .filter-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
  }
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.analysis-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.analysis-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.full-width {
  width: 100%;
}

.segment-analysis-container {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.segment-card {
  flex: 1;
  min-width: 300px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fc 100%);
}

.student-card, .chart-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  
  :deep(.ant-card-head) {
    background: linear-gradient(120deg, #f0f2f5, #e4e7ec);
    border-bottom: 1px solid #e8e8e8;
    padding: 0 16px;
    
    .ant-card-head-title {
      font-weight: 600;
      color: #333;
    }
  }
}

.loading-spin {
  display: flex;
  justify-content: center;
  margin: 50px 0;
}

.expanded-detail {
  margin: 16px 0 0 48px;
}

/* 图表容器样式 */
.chart-container {
  width: 100%;
  height: 400px;
  padding: 20px 0;
}

.score-chart {
  width: 100%;
  height: 100%;
}

/* 优秀学生和待关注学生标题颜色 */
.student-card:first-child :deep(.ant-card-head) {
  background: linear-gradient(120deg, #e6f7ff, #d1e9ff);
}

.student-card:nth-child(2) :deep(.ant-card-head) {
  background: linear-gradient(120deg, #fff7e6, #ffe7ba);
}

/* 分段统计卡片标题颜色 */
.segment-card:nth-child(1) :deep(.ant-card-head) {
  background: linear-gradient(120deg, #e6f7ff, #d1e9ff);
}

.segment-card:nth-child(2) :deep(.ant-card-head) {
  background: linear-gradient(120deg, #f6ffed, #d9f7be);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .segment-analysis-container {
    flex-direction: column;
  }
  
  .segment-card {
    min-width: 100%;
  }
}

@media (max-width: 768px) {
  .class-analysis-container {
    padding: 12px;
    font-size: 14px; /* 小屏幕下适当减小字体 */
  }
  
  .analysis-card {
    padding: 16px;
  }
  
  :deep(.ant-card-head-title) {
    font-size: 16px;
  }
  
  .chart-container {
    height: 300px;
    padding: 10px 0;
  }
}
</style>
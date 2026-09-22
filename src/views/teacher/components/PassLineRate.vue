<template>
  <div class="section">
    <div class="section-title">分数线过线率</div>
    <a-row :gutter="16">
      <a-col :xs="24" :md="16">
        <a-card class="chart-card" title="各科目过线率折线图">
          <div class="chart-wrapper">
            <e-charts :option="passLineChartOption" />
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card class="stat-card" title="各科目过线率详情">
          <a-tabs v-model:activeKey="activeTab">
            <a-tab-pane key="pass_rate" tab="特控率">
              <div class="rate-grid">
                <div v-for="item in passRateItems" :key="item.subject" class="rate-item">
                  <span class="subject-name">{{ item.subjectName }}</span>
                  <span class="rate-value">{{ item.rate }}%</span>
                </div>
              </div>
            </a-tab-pane>
            <a-tab-pane key="top_rate" tab="清北率">
              <div v-if="topRateItems.length > 0" class="rate-grid">
                <div v-for="item in topRateItems" :key="item.subject" class="rate-item">
                  <span class="subject-name">{{ item.subjectName }}</span>
                  <span class="rate-value">{{ item.rate }}%</span>
                </div>
              </div>
              <div v-else class="no-data-tip">未配置清北线</div>
            </a-tab-pane>
            <a-tab-pane key="top9_rate" tab="985率">
              <div v-if="top9RateItems.length > 0" class="rate-grid">
                <div v-for="item in top9RateItems" :key="item.subject" class="rate-item">
                  <span class="subject-name">{{ item.subjectName }}</span>
                  <span class="rate-value">{{ item.rate }}%</span>
                </div>
              </div>
              <div v-else class="no-data-tip">未配置985线</div>
            </a-tab-pane>
            <a-tab-pane key="top2_rate" tab="211率">
              <div v-if="top2RateItems.length > 0" class="rate-grid">
                <div v-for="item in top2RateItems" :key="item.subject" class="rate-item">
                  <span class="subject-name">{{ item.subjectName }}</span>
                  <span class="rate-value">{{ item.rate }}%</span>
                </div>
              </div>
              <div v-else class="no-data-tip">未配置211线</div>
            </a-tab-pane>
          </a-tabs>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

// 定义显示项的接口
interface RateItem {
  subject: string;
  subjectName: string;
  rate: number;
}

// 定义班级信息接口
interface ClassInfo {
  id: number;
  name: string;
  header: number;
  school_id: number;
  subject_selection: string;
}

const props = defineProps<{
  passLineRateData: any;
  classInfo?: ClassInfo;
}>();

// 激活的tab
const activeTab = ref('pass_rate');

// 科目名称映射（支持拼音键和中文键，统一转为中文显示）
const subjectMap: Record<string, string> = {
  // 拼音键 → 中文
  'yuwen': '语文',
  'shuxue': '数学',
  'yingyu': '英语',
  'wuli': '物理',
  'huaxue': '化学',
  'shengwu': '生物',
  'lishi': '历史',
  'zhengzhi': '政治',
  'dili': '地理',
  'sum_': '总分',
  // 中文键 → 中文（兼容已有数据）
  '语文': '语文',
  '数学': '数学',
  '英语': '英语',
  '化学': '化学',
  '物理': '物理',
  '政治': '政治',
  '地理': '地理',
  '生物': '生物',
  '历史': '历史',
  '总分': '总分'
};

// 获取科目名称
const getSubjectName = (subject: string) => {
  return subjectMap[subject] || subject;
};

// 根据选科信息判断科目是否应该显示
const shouldShowSubject = (subjectKey: string): boolean => {
  // 如果没有班级信息或没有选科信息，则显示所有科目
  if (!props.classInfo || !props.classInfo.subject_selection) {
    return true;
  }

  // 先将科目键转为中文名，再根据中文名判断
  const cnName = getSubjectName(subjectKey);
  switch (cnName) {
    case '物理':
      return props.classInfo.subject_selection.includes('物') || props.classInfo.subject_selection.includes('理');
    case '化学':
      return props.classInfo.subject_selection.includes('化');
    case '生物':
      return props.classInfo.subject_selection.includes('生');
    case '历史':
      return props.classInfo.subject_selection.includes('史');
    case '政治':
      return props.classInfo.subject_selection.includes('政');
    case '地理':
      return props.classInfo.subject_selection.includes('地');
    default:
      // 语数英等主科 always 显示
      return true;
  }
};

// 处理数据，确保我们获取的是正确的数据结构
const processedData = computed(() => {
  if (!props.passLineRateData || !Array.isArray(props.passLineRateData) || props.passLineRateData.length === 0) {
    return null;
  }
  
  // 假设我们只需要第一个班级的数据
  return props.passLineRateData[0];
});

// 各种过线率数据
const passRateData = computed(() => {
  return processedData.value?.pass_rate || {};
});

const topRateData = computed(() => {
  return processedData.value?.top_rate || {};
});

const top9RateData = computed(() => {
  return processedData.value?.top9_rate || {};
});

const top2RateData = computed(() => {
  return processedData.value?.top2_rate || {};
});

// 将数据转换为显示项数组,并根据选科信息过滤
const passRateItems = computed(() => {
  return Object.keys(passRateData.value)
    .filter(key => passRateData.value[key] !== undefined && shouldShowSubject(key))
    .map(key => ({
      subject: key,
      subjectName: getSubjectName(key),
      rate: passRateData.value[key]
    }));
});

const topRateItems = computed(() => {
  return Object.keys(topRateData.value)
    .filter(key => topRateData.value[key] !== undefined && shouldShowSubject(key))
    .map(key => ({
      subject: key,
      subjectName: getSubjectName(key),
      rate: topRateData.value[key]
    }));
});

const top9RateItems = computed(() => {
  return Object.keys(top9RateData.value)
    .filter(key => top9RateData.value[key] !== undefined && shouldShowSubject(key))
    .map(key => ({
      subject: key,
      subjectName: getSubjectName(key),
      rate: top9RateData.value[key]
    }));
});

const top2RateItems = computed(() => {
  return Object.keys(top2RateData.value)
    .filter(key => top2RateData.value[key] !== undefined && shouldShowSubject(key))
    .map(key => ({
      subject: key,
      subjectName: getSubjectName(key),
      rate: top2RateData.value[key]
    }));
});

// 折线图配置
const passLineChartOption = computed(() => {
  // 获取所有科目
  const subjects = passRateItems.value.map(item => item.subjectName);
  
  // 获取各线的数据
  const passRate = passRateItems.value.map(item => item.rate);
  const topRate = topRateItems.value.map(item => item.rate);
  const top9Rate = top9RateItems.value.map(item => item.rate);
  const top2Rate = top2RateItems.value.map(item => item.rate);

  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['特控率', '清北率', '985率', '211率']
    },
    xAxis: {
      type: 'category',
      data: subjects
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '特控率',
        type: 'line',
        data: passRate,
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%'
        }
      },
      {
        name: '清北率',
        type: 'line',
        data: topRate,
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%'
        }
      },
      {
        name: '985率',
        type: 'line',
        data: top9Rate,
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%'
        }
      },
      {
        name: '211率',
        type: 'line',
        data: top2Rate,
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%'
        }
      }
    ]
  };
});
</script>

<style scoped lang="less">
.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  text-align: left;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 4px solid #1890ff;
}

.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  :deep(.ant-card-body) {
    height: 400px;
  }
}

.chart-wrapper {
  height: 360px;
  width: 100%;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  :deep(.ant-card-body) {
    padding: 12px;
  }
  
  :deep(.ant-statistic-title) { 
    color: #595959; 
  }
}

.rate-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.rate-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.subject-name {
  font-weight: 500;
}

.rate-value {
  font-weight: 600;
  color: #1890ff;
}

.no-data-tip {
  text-align: center;
  padding: 24px 16px;
  color: #999;
  font-size: 14px;
  background-color: #fafafa;
  border-radius: 4px;
  margin-top: 8px;
}
</style>
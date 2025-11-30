<script setup lang="ts">
import { onMounted, ref, computed, onUnmounted } from "vue";
import { class_info } from "@/views/teacher/types";
import { getClassesApi } from "@/servers/api/classes";
import { 
  message, 
  Card, 
  Row, 
  Col, 
  Spin, 
  Empty, 
  Statistic, 
  Divider,
  Button,
  Alert
} from "ant-design-vue";
import { 
  LikeOutlined,
  DislikeOutlined,
  RiseOutlined,
  TeamOutlined,
  RedoOutlined
} from '@ant-design/icons-vue';
import { useUserStore } from "@/store";
import { 
  postClassAlwaysTopBottomStudents,
  postClassAnalysis,
  postClassComprehensiveStudentGrades,
  postClassCompute,
  postClassPassLineRate
} from "@/servers/api/average";

// 状态管理
const userStore = useUserStore();
const classInfo = ref<class_info>();
const loading = ref(false);
const computing = ref(false);
const pollTimer = ref<number | null>(null);
const errorMessage = ref("");

// 数据存储
const topBottomStudents = ref<any[]>([]);
const classAnalysisData = ref<any>({});
const studentGradesData = ref<any[]>([]);
const passLineRateData = ref<any>({});

// 计算属性
const hasData = computed(() => {
  return (
    topBottomStudents.value.length > 0 ||
    Object.keys(classAnalysisData.value).length > 0 ||
    studentGradesData.value.length > 0 ||
    Object.keys(passLineRateData.value).length > 0
  );
});

// 获取教师ID
const getTeacherId = () => {
  const userInfo = userStore.getUserInfo();
  return userInfo?.teacher?.uid;
};

// 初始化班级信息
const initClassInfo = async () => {
  try {
    const teacherId = getTeacherId();
    if (!teacherId) {
      message.error("未获取到教师信息");
      errorMessage.value = "未获取到教师信息";
      return;
    }

    const classRes = await getClassesApi({ header: teacherId });
    if (classRes.code === 200 && classRes.data.length > 0) {
      classInfo.value = {
        header: classRes.data[0].header,
        class_id: classRes.data[0].id,
        name: classRes.data[0].name,
        subject_selection: classRes.data[0].subject_selection,
        school_id: classRes.data[0].school_id
      };
      // 获取班级数据分析
      await fetchClassAnalysisData();
    } else {
      const errorMsg = classRes.msg || "未查询到班级信息";
      message.error(errorMsg);
      errorMessage.value = errorMsg;
    }
  } catch (err: any) {
    const errorMsg = "初始化失败: " + (err?.message || "未知错误");
    message.error(errorMsg);
    errorMessage.value = errorMsg;
    console.error(err);
  }
};

// 获取班级经常排名靠前或靠后的学生
const fetchTopBottomStudents = async (): Promise<boolean> => {
  if (!classInfo.value?.class_id) return false;
  
  try {
    const res = await postClassAlwaysTopBottomStudents({
      class_ids: [classInfo.value.class_id]
    });
    
    if (res.code === 200 && res.data) {
      topBottomStudents.value = res.data;
      return res.data.length > 0;
    }
    return false;
  } catch (err: any) {
    console.error("获取班级排名学生数据失败:", err);
    message.error("获取班级排名学生数据失败: " + (err?.message || "网络错误"));
    return false;
  }
};

// 获取班级成绩综合分析
const fetchClassAnalysis = async (): Promise<boolean> => {
  if (!classInfo.value?.class_id) return false;
  
  try {
    const res = await postClassAnalysis({
      class_ids: [classInfo.value.class_id]
    });
    
    if (res.code === 200 && res.data) {
      classAnalysisData.value = res.data;
      return Object.keys(res.data).length > 0;
    }
    return false;
  } catch (err: any) {
    console.error("获取班级成绩综合分析失败:", err);
    message.error("获取班级成绩综合分析失败: " + (err?.message || "网络错误"));
    return false;
  }
};

// 获取学生分类数据（优等生、边缘生、差生）
const fetchStudentGrades = async (): Promise<boolean> => {
  if (!classInfo.value?.class_id) return false;
  
  try {
    const res = await postClassComprehensiveStudentGrades({
      class_ids: [classInfo.value.class_id]
    });
    
    if (res.code === 200 && res.data) {
      studentGradesData.value = res.data;
      return res.data.length > 0;
    }
    return false;
  } catch (err: any) {
    console.error("获取学生分类数据失败:", err);
    message.error("获取学生分类数据失败: " + (err?.message || "网络错误"));
    return false;
  }
};

// 获取班级四条分数线过线率
const fetchPassLineRate = async (): Promise<boolean> => {
  if (!classInfo.value?.class_id) return false;
  
  try {
    const res = await postClassPassLineRate({
      class_ids: [classInfo.value.class_id]
    });
    
    if (res.code === 200 && res.data) {
      passLineRateData.value = res.data;
      return Object.keys(res.data).length > 0;
    }
    return false;
  } catch (err: any) {
    console.error("获取过线率数据失败:", err);
    message.error("获取过线率数据失败: " + (err?.message || "网络错误"));
    return false;
  }
};

// 触发后台计算
const triggerClassCompute = async () => {
  if (!classInfo.value?.class_id) return false;
  
  try {
    computing.value = true;
    const res = await postClassCompute({
      class_id: classInfo.value.class_id
    });
    
    if (res.code === 200) {
      message.info("正在生成中，请稍后查看");
      // 开始轮询检查计算完成状态
      startPolling();
      return true;
    } else {
      const errorMsg = res.msg || "触发计算失败";
      message.error(errorMsg);
      errorMessage.value = errorMsg;
      return false;
    }
  } catch (err: any) {
    const errorMsg = "触发计算异常: " + (err?.message || "网络错误");
    message.error(errorMsg);
    errorMessage.value = errorMsg;
    console.error(err);
    return false;
  } finally {
    computing.value = false;
  }
};

// 开始轮询检查计算完成状态
const startPolling = () => {
  // 先清除已有的定时器
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
  }
  
  message.info("开始检查数据生成状态...");
  
  pollTimer.value = window.setInterval(async () => {
    try {
      // 重新获取所有数据
      await fetchClassAnalysisDataWithoutPolling();
      
      // 检查是否有数据
      if (hasData.value) {
        if (pollTimer.value) {
          clearInterval(pollTimer.value);
          pollTimer.value = null;
          message.success("数据生成完成！");
        }
      }
    } catch (err) {
      console.error("轮询检查失败:", err);
    }
  }, 5000); // 每5秒检查一次
  
  // 设置超时时间，避免无限轮询
  setTimeout(() => {
    if (pollTimer.value) {
      clearInterval(pollTimer.value);
      pollTimer.value = null;
      if (!hasData.value) {
        message.warning("数据生成可能需要更长时间，请稍后手动刷新页面查看");
      }
    }
  }, 60000); // 1分钟后超时
};

// 获取所有班级分析数据（不启动轮询）
const fetchClassAnalysisDataWithoutPolling = async () => {
  if (!classInfo.value?.class_id) return false;
  
  try {
    // 依次尝试调用接口1、2、3和5
    const hasTopBottom = await fetchTopBottomStudents();
    const hasAnalysis = await fetchClassAnalysis();
    const hasGrades = await fetchStudentGrades();
    const hasPassRate = await fetchPassLineRate();
    
    return hasTopBottom || hasAnalysis || hasGrades || hasPassRate;
  } catch (err) {
    console.error("获取班级分析数据失败:", err);
    return false;
  }
};

// 获取所有班级分析数据
const fetchClassAnalysisData = async () => {
  if (!classInfo.value?.class_id) return;
  
  loading.value = true;
  errorMessage.value = "";
  
  try {
    // 依次尝试调用接口1、2、3和5
    const hasTopBottom = await fetchTopBottomStudents();
    const hasAnalysis = await fetchClassAnalysis();
    const hasGrades = await fetchStudentGrades();
    const hasPassRate = await fetchPassLineRate();
    
    // 如果任意一个接口返回的结果为空，则触发后台计算
    if (!hasTopBottom || !hasAnalysis || !hasGrades || !hasPassRate) {
      await triggerClassCompute();
    }
  } catch (err: any) {
    const errorMsg = "获取班级分析数据失败: " + (err?.message || "未知错误");
    message.error(errorMsg);
    errorMessage.value = errorMsg;
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const refreshData = async () => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
  await fetchClassAnalysisData();
};

// 组件挂载
onMounted(async () => {
  await initClassInfo();
});

// 组件卸载时清理定时器
onUnmounted(() => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
});
</script>

<template>
  <div class="container">
    <div class="header">
      <h2>{{ classInfo?.name }}班级成绩综合分析</h2>
      <div class="header-actions">
        <a-button type="primary" @click="refreshData" :loading="loading" :disabled="computing">
          <template #icon>
            <RedoOutlined />
          </template>
          刷新数据
        </a-button>
      </div>
    </div>
    
    <!-- 错误信息展示 -->
    <div v-if="errorMessage" class="error-container">
      <a-alert
        :message="errorMessage"
        type="error"
        show-icon
        closable
        @close="errorMessage = ''"
      />
    </div>
    
    <!-- 计算中提示 -->
    <div v-if="computing" class="computing-container">
      <a-alert
        message="正在生成数据..."
        description="后台正在计算班级成绩综合分析数据，请稍后查看。"
        type="info"
        show-icon
      />
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading && !computing" class="loading-container">
      <a-spin :tip="'加载中...'" size="large" />
    </div>
    
    <!-- 无数据状态 -->
    <div v-else-if="!hasData && !loading && !computing" class="empty-container">
      <a-empty description="暂无数据">
        <a-button type="primary" @click="refreshData">重新加载</a-button>
      </a-empty>
    </div>
    
    <!-- 数据展示区域 -->
    <div v-else-if="hasData" class="analysis-content">
      <!-- 顶部统计卡片 -->
      <a-row :gutter="[24, 24]" class="stats-row">
        <a-col :span="24">
          <div class="section-title">班级统计概览</div>
        </a-col>
        
        <!-- 优秀学生统计 -->
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-card class="stat-card excellent-card">
            <a-statistic 
              title="优秀学生数量" 
              :value="topBottomStudents.filter(s => s.type === 'top').length" 
              :value-style="{ color: '#3f8600' }"
            >
              <template #prefix>
                <LikeOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        
        <!-- 待关注学生统计 -->
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-card class="stat-card warning-card">
            <a-statistic 
              title="待关注学生数量" 
              :value="topBottomStudents.filter(s => s.type === 'bottom').length" 
              :value-style="{ color: '#cf1322' }"
            >
              <template #prefix>
                <DislikeOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        
        <!-- 过线率统计 -->
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-card class="stat-card info-card">
            <a-statistic 
              title="一本过线率" 
              :value="passLineRateData.first_line_rate || 0" 
              :precision="2"
              suffix="%"
              :value-style="{ color: '#1890ff' }"
            >
              <template #prefix>
                <RiseOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
        
        <!-- 学生总数统计 -->
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-card class="stat-card primary-card">
            <a-statistic 
              title="班级学生总数" 
              :value="studentGradesData.length" 
              :value-style="{ color: '#722ed1' }"
            >
              <template #prefix>
                <TeamOutlined />
              </template>
            </a-statistic>
          </a-card>
        </a-col>
      </a-row>
      
      <a-divider />
      
      <!-- 经常排名靠前/靠后的学生 -->
      <a-row :gutter="[24, 24]">
        <a-col :span="24">
          <div class="section-title">优秀学生与待关注学生</div>
        </a-col>
        
        <a-col :span="24">
          <a-card class="data-card">
            <a-row :gutter="16">
              <!-- 优秀学生 -->
              <a-col :xs="24" :md="12">
                <div class="student-group">
                  <h3 class="group-title">优秀学生</h3>
                  <div v-if="topBottomStudents.filter(s => s.type === 'top').length === 0" class="no-data">
                    暂无数据
                  </div>
                  <div v-else class="student-list">
                    <div 
                      v-for="student in topBottomStudents.filter(s => s.type === 'top')" 
                      :key="student.id"
                      class="student-item excellent-item"
                    >
                      <span class="student-name">{{ student.name }}</span>
                      <span class="student-score">{{ student.score }}分</span>
                    </div>
                  </div>
                </div>
              </a-col>
              
              <!-- 待关注学生 -->
              <a-col :xs="24" :md="12">
                <div class="student-group">
                  <h3 class="group-title">待关注学生</h3>
                  <div v-if="topBottomStudents.filter(s => s.type === 'bottom').length === 0" class="no-data">
                    暂无数据
                  </div>
                  <div v-else class="student-list">
                    <div 
                      v-for="student in topBottomStudents.filter(s => s.type === 'bottom')" 
                      :key="student.id"
                      class="student-item warning-item"
                    >
                      <span class="student-name">{{ student.name }}</span>
                      <span class="student-score">{{ student.score }}分</span>
                    </div>
                  </div>
                </div>
              </a-col>
            </a-row>
          </a-card>
        </a-col>
      </a-row>
      
      <a-divider />
      
      <!-- 学生分类情况 -->
      <a-row :gutter="[24, 24]">
        <a-col :span="24">
          <div class="section-title">学生分类情况</div>
        </a-col>
        
        <a-col :span="24">
          <a-card class="data-card">
            <a-row :gutter="16" justify="center">
              <a-col :xs="24" :sm="8">
                <div class="grade-category excellent-category">
                  <h3>优等生</h3>
                  <div class="count">{{ studentGradesData.filter(s => s.category === 'excellent').length }}人</div>
                  <div class="description">成绩优异，稳定前列</div>
                </div>
              </a-col>
              <a-col :xs="24" :sm="8">
                <div class="grade-category warning-category">
                  <h3>边缘生</h3>
                  <div class="count">{{ studentGradesData.filter(s => s.category === 'borderline').length }}人</div>
                  <div class="description">成绩波动，需要关注</div>
                </div>
              </a-col>
              <a-col :xs="24" :sm="8">
                <div class="grade-category danger-category">
                  <h3>差生</h3>
                  <div class="count">{{ studentGradesData.filter(s => s.category === 'poor').length }}人</div>
                  <div class="description">成绩落后，急需提升</div>
                </div>
              </a-col>
            </a-row>
          </a-card>
        </a-col>
      </a-row>
      
      <a-divider />
      
      <!-- 过线率统计 -->
      <a-row :gutter="[24, 24]">
        <a-col :span="24">
          <div class="section-title">分数线过线率统计</div>
        </a-col>
        
        <a-col :span="24">
          <a-card class="data-card">
            <a-row :gutter="16">
              <a-col :xs="24" :sm="12" :md="6">
                <div class="pass-rate-item">
                  <h4>一本线</h4>
                  <div class="rate">{{ (passLineRateData.first_line_rate || 0).toFixed(2) }}%</div>
                  <div class="description">重点大学录取线</div>
                </div>
              </a-col>
              <a-col :xs="24" :sm="12" :md="6">
                <div class="pass-rate-item">
                  <h4>二本线</h4>
                  <div class="rate">{{ (passLineRateData.second_line_rate || 0).toFixed(2) }}%</div>
                  <div class="description">本科录取线</div>
                </div>
              </a-col>
              <a-col :xs="24" :sm="12" :md="6">
                <div class="pass-rate-item">
                  <h4>专科线</h4>
                  <div class="rate">{{ (passLineRateData.junior_college_line_rate || 0).toFixed(2) }}%</div>
                  <div class="description">专科录取线</div>
                </div>
              </a-col>
              <a-col :xs="24" :sm="12" :md="6">
                <div class="pass-rate-item">
                  <h4>平均分线</h4>
                  <div class="rate">{{ (passLineRateData.average_line_rate || 0).toFixed(2) }}%</div>
                  <div class="description">班级平均分</div>
                </div>
              </a-col>
            </a-row>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<style scoped lang="less">
.container {
  padding: 20px;
  min-height: 100vh;
  box-sizing: border-box;
  overflow-y: auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  
  .header {
    background: linear-gradient(120deg, #4b6cb7, #1890ff);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    
    .header-actions {
      .ant-btn {
        color: white;
        border-color: rgba(255, 255, 255, 0.5);
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: white;
        }
      }
    }
  }
  
  .error-container, .computing-container {
    margin-bottom: 20px;
  }
  
  .loading-container, .empty-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
  
  .section-title {
    font-size: 20px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 16px;
    padding-left: 8px;
    border-left: 4px solid #1890ff;
  }
  
  .stats-row {
    margin-bottom: 24px;
  }
  
  .stat-card {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    :deep(.ant-card-body) {
      padding: 20px;
    }
  }
  
  .excellent-card {
    border-left: 4px solid #52c41a;
  }
  
  .warning-card {
    border-left: 4px solid #ff4d4f;
  }
  
  .info-card {
    border-left: 4px solid #1890ff;
  }
  
  .primary-card {
    border-left: 4px solid #722ed1;
  }
  
  .data-card {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    :deep(.ant-card-body) {
      padding: 24px;
    }
  }
  
  .student-group {
    .group-title {
      font-size: 18px;
      color: #2c3e50;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .no-data {
      text-align: center;
      color: #999;
      padding: 20px;
    }
    
    .student-list {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .student-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 8px;
      transition: all 0.3s;
      
      &:hover {
        background-color: #f5f5f5;
      }
      
      .student-name {
        font-weight: 500;
      }
      
      .student-score {
        font-weight: 600;
      }
    }
    
    .excellent-item {
      border-left: 3px solid #52c41a;
      background-color: #f6ffed;
    }
    
    .warning-item {
      border-left: 3px solid #ff4d4f;
      background-color: #fff2f0;
    }
  }
  
  .grade-category {
    text-align: center;
    padding: 24px 16px;
    border-radius: 8px;
    transition: all 0.3s;
    height: 100%;
    
    &:hover {
      transform: scale(1.02);
    }
    
    h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
    }
    
    .count {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .description {
      font-size: 14px;
      color: #888;
    }
  }
  
  .excellent-category {
    background: linear-gradient(120deg, #f6ffed, #d9f7be);
    border: 1px solid #b7eb8f;
    
    .count {
      color: #52c41a;
    }
  }
  
  .warning-category {
    background: linear-gradient(120deg, #fffbe6, #fff1b8);
    border: 1px solid #ffe58f;
    
    .count {
      color: #faad14;
    }
  }
  
  .danger-category {
    background: linear-gradient(120deg, #fff2f0, #ffccc7);
    border: 1px solid #ffa39e;
    
    .count {
      color: #ff4d4f;
    }
  }
  
  .pass-rate-item {
    text-align: center;
    padding: 16px;
    border-radius: 8px;
    background: #fafafa;
    transition: all 0.3s;
    height: 100%;
    
    &:hover {
      background: #f0f0f0;
      transform: translateY(-2px);
    }
    
    h4 {
      margin: 0 0 8px 0;
      color: #595959;
    }
    
    .rate {
      font-size: 20px;
      font-weight: 600;
      color: #1890ff;
      margin-bottom: 4px;
    }
    
    .description {
      font-size: 12px;
      color: #888;
    }
  }
}
</style>
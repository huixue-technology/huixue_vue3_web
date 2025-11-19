<template>
  <div class="class-grade-container">
    <div class="header">
      <h2>{{classInfo?.name}}班级成绩分析</h2>
      <p>选择考试查看班级成绩详情</p>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <a-row :gutter="16">
        <a-col :span="24" :md="6">
          <div class="filter-item">
            <span class="filter-label">选择考试：</span>
            <a-select 
              v-model:value="selectedExamId" 
              placeholder="选择考试" 
              style="width: 100%"
              @change="handleExamChange"
            >
              <a-select-option 
                v-for="examId in classExamList" 
                :key="examId" 
                :value="examId"
              >
                考试 {{ examId }}
              </a-select-option>
            </a-select>
          </div>
        </a-col>
        <a-col :span="24" :md="6">
              <div class="filter-item">
                <span class="filter-label">学生查询：</span>
                <a-select
                  v-model:value="selectedStudentId"
                  placeholder="输入学生姓名或ID搜索"
                  style="width: 100%"
                  show-search
                  :filter-option="false"
                  @search="handleStudentSearch"
                  @change="filter_change"
                >
                  <a-select-option
                    v-for="student in filteredStudents"
                    :key="student.id"
                    :value="student.id"
                  >
                    {{ student.name }} ({{ student.id }})
                  </a-select-option>
                </a-select>
              </div>
            </a-col>
        <a-col :span="24" :md="6">
          <div class="filter-item">
            <span class="filter-label">科目筛选：</span>
            <a-select 
              v-model:value="selectedSubject" 
              placeholder="选择科目" 
              style="width: 100%"
              allow-clear
              @change="filter_change"
            >
              <a-select-option value="">全部科目</a-select-option>
              <a-select-option 
                v-for="subject,idx in subject_list" 
                :key="subject" 
                :value="idx"
              >
                {{ subject }}
              </a-select-option>
            </a-select>
          </div>
        </a-col>
        <a-col :span="24" :md="6">

            <ScoreRangeFilter
              :passLineOffset="passLineOffset || 0"
              :selectedPassLineId="selectedPassLineId"
              :passLineList="passLineList"
              @update:passLineOffset="val => passLineOffset = val"
              @update:selectedPassLineId="val => selectedPassLineId = val"
              @filterChange="filter_change"
            />
			
        </a-col>
		
      </a-row>
      
      <a-row :gutter="16" style="margin-top: 16px;">
        <a-col :span="24" :md="6">
          <!-- 成绩区间筛选组件 -->
          <GradeRangeFilter 
            :selectedType="selectedRangeType"
            :selectedRange="selectedRange"
            :maxValue="{
              score: 100,
              gradeRank: gradeTotalCount || 500,
              classRank: scoreList.length  // 班级排名最大值设为班级学生总数
            }"
            :classId="classInfo?.class_id"
            :selectedExamId="selectedExamId"
            :subject="selectedSubject"
            :orderDirection="sortOrder"
            :passLineOffset="passLineOffset"
            :passLineId="selectedPassLineId"
            :studentId="currentStudentId"
            @update:selectedType="val => selectedRangeType = val"
            @update:selectedRange="val => selectedRange = val"
            @filterChange="handleRangeFilterChange"
          />
        </a-col>
        
    
        
        <a-col :span="24" :md="6">
          <div class="filter-item">
            <span class="filter-label">排序方式：</span>
            <a-select 
              v-model:value="sortOrder" 
              placeholder="排序方式" 
              style="width: 100%"
              @change="filter_change"
            >
              <a-select-option value="desc">降序</a-select-option>
              <a-select-option value="asc">升序</a-select-option>
            </a-select>
          </div>
        </a-col>

        <a-col :span="24" :md="6">
          <div class="filter-actions">
            <a-button type="primary" style="margin-right: 10px;" @click="filter_change">确定</a-button>
            <a-button type="primary" @click="resetFilters">重置筛选</a-button>
          </div>
        </a-col>
      </a-row>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-section">
      <a-row :gutter="16">
        <a-col :span="12" :lg="4">
          <div class="summary-card avg-score-card">
            <div class="card-title">班级平均分</div>
            <div class="card-value">{{ classAvg.totalScore.toFixed(1) }}</div>
          </div>
        </a-col>
        <a-col :span="12" :lg="4">
          <div class="summary-card max-score-card">
            <div class="card-title">最高分</div>
            <div class="card-value">{{ classMax.totalScore }}</div>
          </div>
        </a-col>
        <a-col :span="12" :lg="4">
          <div class="summary-card min-score-card">
            <div class="card-title">最低分</div>
            <div class="card-value">{{ classMin.totalScore }}</div>
          </div>
        </a-col>
        <a-col :span="12" :lg="4">
          <div class="summary-card pass-line-card">
            <div class="card-title">一本线</div>
            <div class="card-value">{{ passLine }}</div>
          </div>
        </a-col>
        <a-col :span="12" :lg="4">
          <div class="summary-card pass-rate-card">
            <div class="card-title">一本率</div>
            <div class="card-value">{{ passRate }}%</div>
          </div>
        </a-col>
        <a-col :span="12" :lg="4">
          <div class="summary-card student-count-card">
            <div class="card-title">学生人数</div>
            <div class="card-value">{{ scoreList.length }}</div>
          </div>
        </a-col>
      </a-row>
    </div>
	

    <!-- 成绩表格区域 -->
    <div class="table-section">
      <a-card title="班级成绩详情" class="score-card">
        <div class="table-container">
          <a-table
            :columns="columns"
            :data-source="scoreList"
            bordered
            row-key="studentId"
            :pagination="{ pageSize: 100}"
            :scroll="{ x: true, y: 600 }"  
          >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'totalScore'">
              <span :class="getScoreClass(record.totalScore)">
                {{ record.totalScore }}
              </span>
            </template>
            <template v-if="column.dataIndex === 'classRank'">
              <span :class="getRankClass(record.classRank)">
                {{ record.classRank }}
              </span>
            </template>
          </template>
        </a-table>
      </div>
      </a-card>
    </div>
    <ExamSummarize :exam_id="selectedExamId" :class_id="classInfo?.class_id" />
    <a-spin v-if="loading" tip="加载中..." class="loading-spin" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { getClassesApi } from "@/servers/api/classes";
import { useUserStore } from "@/store";
import { getStudentApi } from "@/servers/api/student";
import { class_info } from "@/views/teacher/types";
import { message } from "ant-design-vue";
import { getClassExam } from "@/servers/api/grade";
import { getExamApi } from "@/servers/api/exam";
import { getClassGrade } from "@/servers/api/grade";
import { getPassLine } from "@/servers/api/analysis";
import ScoreRangeFilter from '@/components/ScoreRangeFilter.vue';
import GradeRangeFilter from '@/components/GradeRangeFilter.vue'
import ExamSummarize from "@/views/teacher/ExamSummarize.vue";
interface ScoreItem {
  studentId: string;
  studentName: string;
  totalScore: number; 
  classRank: number;
  sumD: number; 
  [key: string]: any; 
}

interface ClassStats {
  totalScore: number;
  [key: string]: number; 
}

interface PassLineItem {
  id: number;
  exam_id: number;
  school_id: string;
  sum_: number;
  line_name: string;
  [key: string]: any;
}

// 状态管理
const user = useUserStore();
const classInfo = ref<class_info>();
const classExamList = ref<number[]>([]);
const selectedExamId = ref<number>(0);
const teacherId = ref<number>(0);
const scoreList = ref<ScoreItem[]>([]);
const loading = ref(false);
const passLine = ref(0);
const subjects = ref<string[]>([]);
const currentStudentId = ref('');

// 新增筛选状态
const selectedSubject = ref<string>(''); // 科目筛选
const sortOrder = ref<string>('desc'); // 排序方向
const minScore = ref<number | null>(null); // 最低分数
const maxScore = ref<number | null>(null); // 最高分数
const passLineOffset = ref<number | null>(null); // 分数线上下范围
const selectedPassLineId = ref<number | null>(null); // 选中的分数线ID
const gradeExamList = ref<any[]>([]); // 年级考试列表
const passLineList = ref<PassLineItem[]>([]); // 分数线列表

// 班级统计数据
const classAvg = ref<ClassStats>({ totalScore: 0 });
const classMax = ref<ClassStats>({ totalScore: 0 });
const classMin = ref<ClassStats>({ totalScore: 0 });
const passRate = ref(0);
// 新增学生相关响应式变量
const studentList = ref<any[]>([]); // 所有学生列表
const filteredStudents = ref<any[]>([]); // 筛选后的学生列表
const searchKeyword = ref(''); // 学生搜索关键词
const selectedStudentId = ref(''); // 选中的学生ID
const subject_list = {
  Yuwen: '语文',
  Shuxue: '数学',
  Yingyu: '英语',
  Wuli: '物理',
  Lishi: '历史',
  Huaxue: '化学',
  Shengwu: '生物',
  Zhengzhi: '政治',
  Dili: '地理',
}
const subjectMap: Record<string, string> = {
  // 分数字段
  Yuwen: '语文',
  Shuxue: '数学',
  Yingyu: '英语',
  Wuli: '物理',
  Lishi: '历史',
  Huaxue: '化学',
  Shengwu: '生物',
  Zhengzhi: '政治',
  Dili: '地理',
  YuwenB: '班名',
  ShuxueB: '班名',
  YingyuB: '班名',
  WuliB: '班名',
  LishiB: '班名',
  HuaxueB: '班名',
  ShengwuB: '班名',
  ZhengzhiB: '班名',
  DiliB: '班名',
  YuwenD: '校名',
  ShuxueD: '校名',
  YingyuD: '校名',
  WuliD: '校名',
  LishiD: '校名',
  HuaxueD: '校名',
  ShengwuD: '校名',
  ZhengzhiD: '校名',
  DiliD: '校名',
};

const selectedRangeType = ref<null | 'score' | 'gradeRank' | 'classRank'>(null);
const selectedRange = ref<null | { start: number; end: number }>(null);
const gradeTotalCount = ref(0); // 年级总人数，用于段次计算

const sortFieldsByChinese = (fields: string[]) => {
  const scoreFields = fields.filter(field => !/[BD]$/.test(field));
  const rankFields = fields.filter(field => /[BD]$/.test(field));
  const sortedFields: string[] = [];
  scoreFields.forEach(scoreField => {
    sortedFields.push(scoreField); // 分数
    if (rankFields.includes(`${scoreField}B`)) sortedFields.push(`${scoreField}B`); // 班名
    if (rankFields.includes(`${scoreField}D`)) sortedFields.push(`${scoreField}D`); // 校名
  });
  return sortedFields;
};

const columns = computed(() => {
  const baseColumns = [
    { title: '学号', dataIndex: 'studentId', key: 'studentId', width: 100 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 150 },
  ];
  const sortedSubjectFields = sortFieldsByChinese(subjects.value);
  const subjectColumns = sortedSubjectFields.map(field => ({
    title: subjectMap[field] || field,
    dataIndex: field,
    key: field,
    width: 120 
  }));
  const sumColumns = [
    { title: '总分', dataIndex: 'totalScore', key: 'totalScore', width: 100 },
    { title: '班名', dataIndex: 'classRank', key: 'classRank', width: 100 },
    { title: '校名', dataIndex: 'sumD', key: 'sumD', width: 100 }
  ];

  return [...baseColumns,...sumColumns, ...subjectColumns];
});

// 获取成绩等级类名
const getScoreClass = (score: number) => {
  // 先检查是否有一本线数据
  if (passLine.value > 0) {
    // 如果成绩小于一本线，返回红色字体样式
    if (score < passLine.value) {
      return 'below-pass-line';
    }
    // 如果成绩在一本线上下10分范围内，返回黄色背景样式
    if (Math.abs(score - passLine.value) <= 10) {
      return 'near-pass-line';
    }
  }
  // 原有的成绩等级样式
  return score >= 90 ? 'excellent-score' : score >= 80 ? 'good-score' : 'normal-score';
};

const getRankClass = (rank: number) => {
  if (rank <= 3) return 'top-rank';
  if (rank <= 10) return 'good-rank';
  return '';
};

const calculateStats = (scores: ScoreItem[]) => {
  if (!scores.length) return;
  const stats: Record<string, number[]> = {
    totalScore: []
  };
  subjects.value.forEach(subject => {
    stats[subject] = [];
  });
  scores.forEach(item => {
    stats.totalScore.push(item.totalScore);
    // subjects.value.forEach(subject => {
    //   stats[subject].push(item[subject] || 0);
    // });
  });
  const avg: ClassStats = {
    totalScore: stats.totalScore.reduce((a, b) => a + b, 0) / stats.totalScore.length
  };
  subjects.value.forEach(subject => {
    avg[subject] = stats[subject].reduce((a, b) => a + b, 0) / stats[subject].length;
  });
  classAvg.value = avg;
  const max: ClassStats = {
    totalScore: Math.max(...stats.totalScore)
  };
  subjects.value.forEach(subject => {
    max[subject] = Math.max(...stats[subject]);
  });
  classMax.value = max;
  const min: ClassStats = {
    totalScore: Math.min(...stats.totalScore)
  };
  subjects.value.forEach(subject => {
    min[subject] = Math.min(...stats[subject]);
  });
  classMin.value = min;
  const passCount = stats.totalScore.filter(score => score >= passLine.value).length;
  passRate.value = Math.round((passCount / stats.totalScore.length) * 100);
};

// 获取对应考试的一本线
const fetchPassLine = async (examId: number) => {
  try {
    const res = await getPassLine({ exam_id: examId });
    if (res.data && res.data.length > 0) {
      // 根据科目判断文理科（示例：含物理则为理科，含历史则为文科）
      const isScience = subjects.value.includes('Wuli');
      const targetLine = res.data.find((line: any) => 
        isScience ? line.line_name.includes('物') : line.line_name.includes('史')
      );
      passLine.value = targetLine ? targetLine.sum_ : 0;
    }
  } catch (err) {
    console.error('获取一本线失败:', err);
    passLine.value = 0;
  }
};

const extractAllFields = (rawItem: any) => {
  const excludeFields = ['student_id', 'student_name','name', 'sum_', 'sumB', 'sumD', 'class_id', 'exam_id', 'id', 'school_id', 'show'];
  const allFields = Object.keys(rawItem);
  
  // 查看该班级是物理方向、历史方向还是未选科
  if (! classInfo.value?.subject_selection.includes('物') && ! classInfo.value?.subject_selection.includes('理')) {
    excludeFields.push('Wuli')
  }
  if (! classInfo.value?.subject_selection.includes('史')) {
    excludeFields.push('Lishi')
  }
  if (! classInfo.value?.subject_selection.includes('地')) {
    excludeFields.push('Dili')
  }
  if (! classInfo.value?.subject_selection.includes('政')) {
    excludeFields.push('Zhengzhi')
  }
  if (! classInfo.value?.subject_selection.includes('化')) {
    excludeFields.push('Huaxue')
  }
  if (! classInfo.value?.subject_selection.includes('生')) {
    excludeFields.push('Shengwu')
  }
  return allFields.filter(field => !excludeFields.includes(field));
};

const filterInvalidSubjects = (allFields: string[], rawData: any[]) => {
  const mainSubjects = allFields.filter(field => !/[BD]$/.test(field));
  const excludedFields: string[] = [];
  
  mainSubjects.forEach(subject => {
    const hasInvalid = rawData.some(item => {
      const score = item[subject] || 0;
      const classRank = item[`${subject}B`] || 0;
      return score === 0 && classRank === 1;
    });
    
    if (hasInvalid) {
      excludedFields.push(subject);
      excludedFields.push(`${subject}B`);
      excludedFields.push(`${subject}D`);
    }
  });
  
  return allFields.filter(field => !excludedFields.includes(field));
};

// 获取年级考试列表
const fetchGradeExams = async (classId: number) => {
  try {
    // 通过班级ID前两位推断年级
    const classIdStr = classId.toString();
    const gradePrefix = classIdStr.substring(0, 2);
    
    // 获取年级所有考试
    const examRes = await getExamApi({});
    if (examRes.code === 200) {
      gradeExamList.value = examRes.data.filter((exam: any) => 
        exam.student_grade && exam.student_grade.startsWith(gradePrefix)
      );
    }
  } catch (err) {
    console.error('获取年级考试列表失败:', err);
  }
};

// 获取分数线列表
const fetchPassLineList = async (examId: number) => {
  try {
    const res = await getPassLine({ exam_id: examId });
    if (res.data && res.data.length > 0) {
      passLineList.value = res.data;
    } else {
      passLineList.value = [];
    }
  } catch (err) {
    console.error('获取分数线列表失败:', err);
    passLineList.value = [];
  }
};
// 新增获取班级学生列表方法
const fetchClassStudents = async () => {
  if (!classInfo.value?.class_id) return;
  try {
    const res = await getStudentApi({ 
      class_id: classInfo.value.class_id 
    });
    if (res.code === 200 && res.data) {
      studentList.value = res.data.map((item: any) => ({
        id: item.uid,
        name: item.name
      }));
      filteredStudents.value = [...studentList.value];
    }
  } catch (err) {
    console.error('获取班级学生列表失败:', err);
  }
};

// 新增学生搜索处理方法
const handleStudentSearch = (value: string) => {
  searchKeyword.value = value;
  if (!value) {
    filteredStudents.value = [...studentList.value];
    return;
  }
  
  const filtered = studentList.value.filter(student => 
    student.name.toLowerCase().includes(value.toLowerCase()) ||
    student.id.toString().includes(value.toLowerCase())
  );
  filteredStudents.value = filtered;
};

// 在现有状态中添加
const studentId = ref<string>(''); // 学生ID筛选
// 更新add_filter函数以处理段次筛选参数
const add_filter = (params: any) => {
  // 保留原有逻辑
  if (selectedSubject.value) {
    params.subject = selectedSubject.value;
  }
  
  if (sortOrder.value) {
    params.order_direction = sortOrder.value;
  }
  
  // 处理分数区间参数
  if (minScore.value !== null) {
    params.min_score = minScore.value;
  }
  
  if (maxScore.value !== null) {
    params.max_score = maxScore.value;
  }
  
  // 处理段次区间参数
  if (minRank.value !== null) {
    params.min_rank = minRank.value;
  }
  
  if (maxRank.value !== null) {
    params.max_rank = maxRank.value;
  }
  
  if (passLineOffset.value !== null) {
    params.pass_line_offset = passLineOffset.value;
  }
  
  if (selectedPassLineId.value !== null) {
    params.pass_line_id = selectedPassLineId.value;
  }
  
  if (studentId.value) {
    params.student_id = studentId.value;
  }
  // 新增班级排名参数处理
  if (minClassRank.value !== null) {
    params.min_class_rank = minClassRank.value;
  }
  
  if (maxClassRank.value !== null) {
    params.max_class_rank = maxClassRank.value;
  }
  if (selectedStudentId.value) {
      params.student_id = selectedStudentId.value;
    }
};


// 将参数改为可选
const filter_change = (subject?: string)=> {
  console.log('Subject changed:', subject);
  handleExamChange(selectedExamId.value)
}


const handleExamChange = async (examId: number) => {
  if (!examId || !classInfo.value?.class_id) return;
  loading.value = true;
  try {
    // 使用新的 getClassGrade API，支持更多筛选参数
    const params: any = {
      class_id: classInfo.value.class_id.toString(),
      selected_exam_id: examId.toString()
    };
    // 添加筛选参数
    add_filter(params);
    const res = await getClassGrade(params);
    console.log('API Response:', res); // 调试日志
    
    if (res.code === 200) {
      // 检查是否有数据
      const hasData = res.data && 
        ((Array.isArray(res.data) && res.data.length > 0) || 
         (res.data.gradeList && res.data.gradeList.length > 0));
      if (hasData) {
        // 处理不同格式的响应数据
        let rawData = [];
        if (Array.isArray(res.data)) {
          rawData = res.data;
        } else if (res.data.gradeList && Array.isArray(res.data.gradeList)) {
          rawData = res.data.gradeList;
        }
        if (rawData.length > 0) {
          // 提取所有字段
          const allFields = extractAllFields(rawData[0]);
          const validFields = filterInvalidSubjects(allFields, rawData);
          subjects.value = validFields;
          
          // 处理成绩数据
          const rawScores = rawData.map((item: any) => {
            const scoreItem: ScoreItem = {
              studentId: "*"+String(item.student_id || item.studentId || '').slice(-5,-1),
              studentName: item.student_name || item.studentName || '未知学生',
              totalScore: item.sum_ !== undefined ? item.sum_ : (item.totalScore || 0),
              classRank: item.sumB !== undefined ? item.sumB : (item.classRank || 0),
              sumD: item.sumD !== undefined ? item.sumD : (item.sumD || 0),
            };
            validFields.forEach(field => {
              scoreItem[field] = item[field] !== undefined ? item[field] : 0;
            });
            return scoreItem;
          });
          
          scoreList.value = rawScores;
          
          // 获取考试名称
          // examName.value = res.data.exam_name || `考试 ${examId}`;
          
          await fetchPassLine(examId);
          calculateStats(scoreList.value);
          
          // 获取分数线列表
          await fetchPassLineList(examId);
          
          // 成功获取数据的消息
          message.success('成绩数据获取成功');
          return;
        }
      }
    }
    
    // 如果到这里说明没有有效数据
    message.warning('暂无成绩数据');
    scoreList.value = [];
    subjects.value = [];
    // 重置统计信息
    classAvg.value = { totalScore: 0 };
    classMax.value = { totalScore: 0 };
    classMin.value = { totalScore: 0 };
    passRate.value = 0;
    passLine.value = 0;
  } catch (err) {
    console.error('获取成绩失败:', err);
    scoreList.value = [];
    subjects.value = [];
  } finally {
    loading.value = false;
  }
};

// 重置筛选
const resetFilters = () => {
  console.log('Resetting filters...');
  selectedExamId.value = classExamList.value.length > 0 ? classExamList.value[0] : 0;
  selectedSubject.value = '';
  sortOrder.value = 'desc';
  minScore.value = null;
  maxScore.value = null;
  passLineOffset.value = null;
  selectedPassLineId.value = null;
  scoreList.value = [];
  subjects.value = [];
  classAvg.value = { totalScore: 0 };
  classMax.value = { totalScore: 0 };
  classMin.value = { totalScore: 0 };
  passRate.value = 0;
  passLine.value = 0;
  passLineList.value = [];
  selectedRangeType.value = null;
  selectedRange.value = null;
  minScore.value = null;
  maxScore.value = null;
  minRank.value = null;
  maxRank.value = null;
  minClassRank.value = null;  // 新增
  maxClassRank.value = null;  // 新增
  selectedStudentId.value = '';
  searchKeyword.value = '';
  filteredStudents.value = [...studentList.value];
  
  if (selectedExamId.value) {
    handleExamChange(selectedExamId.value);
  }
};


// 新增班级排名筛选参数
const minClassRank = ref<number | null>(null);
const maxClassRank = ref<number | null>(null);
// 在现有状态中添加段次相关变量
const minRank = ref<number | null>(null);
const maxRank = ref<number | null>(null);

// 修改handleRangeFilterChange方法
const handleRangeFilterChange = (data: any) => {
  // 重置原有区间参数
  minScore.value = null;
  maxScore.value = null;
  minRank.value = null;
  maxRank.value = null;
  minClassRank.value = null;
  maxClassRank.value = null;

  // 根据筛选类型设置对应参数
  if (data.type === 'score') {
    minScore.value = data.min_score;
    maxScore.value = data.max_score;
  } else if (data.type === 'gradeRank') {
    minRank.value = data.min_rank;
    maxRank.value = data.max_rank;
  } else if (data.type === 'classRank') {
    minClassRank.value = data.min_class_rank;
    maxClassRank.value = data.max_class_rank;
  }

};
onMounted(async () => {
  teacherId.value = user.getUserInfo().role;
  if (!teacherId.value) {
    message.error('未获取到教师信息');
    return;
  }

  try {
    // 获取班级信息
    const classRes = await getClassesApi({ header: teacherId.value });
    if (classRes.code === 200 && classRes.data.length > 0) {
      classInfo.value = {
        header: classRes.data[0].header,
        class_id: classRes.data[0].id,
        name: classRes.data[0].name,
        subject_selection: classRes.data[0].subject_selection,
        school_id: classRes.data[0].school_id
      };

      // 获取班级考试列表
      const examRes = await getClassExam({ class_id: classInfo.value.class_id });
      if (examRes.code === 200 && examRes.data.length > 0) {
        classExamList.value = examRes.data;

        // 默认选择第一个考试
        if (classExamList.value.length > 0) {
          selectedExamId.value = classExamList.value[0];
          await handleExamChange(selectedExamId.value);
        }
      } else {
        message.error(examRes.msg || '获取考试列表失败');
      }
      
      // 获取年级考试列表
      await fetchGradeExams(classInfo.value.class_id);
    } else {
      message.error(classRes.msg || '未查询到班级信息');
    }
  } catch (err) {
    message.error('初始化失败');
  }
  await fetchClassStudents();
});

</script>

<style scoped lang="less">
.class-grade-container {
  padding: 20px;
  height: 100vh;
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
        width: 100px;
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
  
  .stats-section {
    margin-bottom: 20px;
    
    .summary-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s ease;
      
      &:hover {
        transform: translateY(-5px);
      }
      
      .card-title {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
      }
      
      .card-value {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
        flex: 1;
        display: flex;
        align-items: center;
      }
    }
    
    .avg-score-card {
      border-top: 4px solid #1890ff;
      
      .card-value {
        color: #1890ff;
      }
    }
    
    .max-score-card {
      border-top: 4px solid #52c41a;
      
      .card-value {
        color: #52c41a;
      }
    }
    
    .min-score-card {
      border-top: 4px solid #fa8c16;
      
      .card-value {
        color: #fa8c16;
      }
    }
    :deep(.filter-container) {
      margin-bottom: 20px;
    }
    
    :deep(.filter-section) {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .pass-line-card {
      border-top: 4px solid #722ed1;
      
      .card-value {
        color: #722ed1;
      }
    }
    
    .pass-rate-card {
      border-top: 4px solid #eb2f96;
      
      .card-value {
        color: #eb2f96;
      }
    }
    
    .student-count-card {
      border-top: 4px solid #13c2c2;
      
      .card-value {
        color: #13c2c2;
      }
    }
  }
  
  .table-section {
    .score-card {
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
  }
  
  .table-container {
    padding: 10px 0;
  }
  
  .loading-spin {
    display: flex;
    justify-content: center;
    margin: 50px 0;
  }
  
  .excellent-score {
    color: #52c41a;
    font-weight: bold;
  }
  
  .good-score {
    color: #1890ff;
    font-weight: 600;
  }
  
  .normal-score {
    color: #333;
  }
  .near-pass-line {
    background-color: #fffbe6;
    color: #fa8c16;
    font-weight: bold;
    padding: 2px 4px;
    border-radius: 4px;
  }

  .below-pass-line {
    color: #f5222d;
    font-weight: bold;
  }
  .top-rank {
    color: #f5222d;
    font-weight: bold;
  }
  
  .good-rank {
    color: #fa8c16;
    font-weight: 600;
  }
  
  .pass {
    color: #52c41a;
    font-weight: bold;
  }
  
  .fail {
    color: #f5222d;
    font-weight: bold;
  }
}

@media (max-width: 768px) {
  .class-grade-container {
    padding: 10px;
    
    .filter-section {
      .filter-item {
        margin-bottom: 10px;
        
        .filter-label {
          width: 60px;
        }
      }
    }
    
    .stats-section {
      .summary-card {
        padding: 12px;
        
        .card-title {
          font-size: 12px;
        }
        
        .card-value {
          font-size: 20px;
        }
      }
    }
  }
}
</style>
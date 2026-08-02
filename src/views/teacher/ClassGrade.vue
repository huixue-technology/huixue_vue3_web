<template>
  <div class="class-grade-container">
    <div class="header">
      <h2>{{classInfo?.name}}班级成绩分析</h2>
      <p>选择班级和考试查看成绩详情</p>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <a-row :gutter="16">
        <a-col :span="24" :md="6">
          <div class="filter-item">
            <span class="filter-label">选择班级：</span>
            <a-select
              v-model:value="selectedClassId"
              placeholder="输入班级名称或ID搜索"
              style="width: 100%"
              show-search
              :filter-option="false"
              @search="handleClassSearch"
              :disabled="isFiltering"
              @change="handleClassChange"
            >
              <a-select-option
                v-for="cls in filteredClassList"
                :key="cls.id"
                :value="cls.id"
              >
                {{ cls.name }} ({{ cls.id }})
              </a-select-option>
            </a-select>
          </div>
        </a-col>
        <a-col :span="24" :md="6">
          <div class="filter-item">
            <span class="filter-label">选择考试：</span>
            <a-select 
              v-model:value="selectedExamId" 
              placeholder="选择考试" 
              style="width: 100%"
              :disabled="isFiltering || !selectedClassId"
              @change="handleExamChange"
            >
              <a-select-option 
                v-for="exam in classExamList" 
                :key="exam.id" 
                :value="exam.id"
              >
                {{ exam.name }}
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
              :disabled="!classInfo?.subject_selection"
            >
              <a-select-option value="">全部科目</a-select-option>
              <a-select-option 
                v-for="(subjectName, subjectKey) in filteredSubjectList" 
                :key="subjectKey" 
                :value="subjectKey"
              >
                {{ subjectName }}
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
				  @change="handleStudentChange"
                  :disabled="isFiltering"
                >
                  <a-select-option key="all" value="">
                    全部学生
                  </a-select-option>
                  <a-select-option
                    v-for="student in filteredStudents"
                    :key="student.id"
                    :value="student.id"
                  >
                    {{ student.name }} ({{ student.id.toString().slice(-4) }})
                  </a-select-option>
                </a-select>
              </div>
            </a-col>
			
        
      </a-row>
      
      <a-row :gutter="16" style="margin-top: 16px;">
		  <a-col :span="24" :md="6">
		      <ScoreRangeFilter
		        :passLineOffset="passLineOffset || 0"
		        :selectedLineGroupId="selectedLineGroupId"
		        :passLineList="passLineList"
		        @update:passLineOffset="val => handlePassLineOffsetChange(val)"
		        @update:selectedLineGroupId="val => handlePassLineIdChange(val)"
		        :disabled="isFiltering"
		      />
		  </a-col>
        <a-col :span="24" :md="6">
          <GradeRangeFilter 
            :selectedType="selectedRangeType"
            :selectedRange="selectedRange"
            :maxValue="{
              score: 100,
              gradeRank: gradeTotalCount || 500,
              classRank: rawScoreList.length  
            }"
            :classId="selectedClassId"
            :selectedExamId="selectedExamId"
            :subject="selectedSubject"
            :orderDirection="sortOrder"
            :passLineOffset="passLineOffset"
            :lineGroupId="selectedLineGroupId"
            :studentId="currentStudentId"
            @update:selectedType="val => selectedRangeType = val"
            @update:selectedRange="val => selectedRange = val"
            @filterChange="handleRangeFilterChange"
            :disabled="isFiltering"
          />
        </a-col>
        <a-col :span="24" :md="6">
          <div class="filter-item">
            <span class="filter-label">排序方式：</span>
            <a-select 
              v-model:value="sortOrder" 
              placeholder="排序方式" 
              style="width: 100%"
              :disabled="isFiltering"
            >
              <a-select-option value="desc">降序</a-select-option>
              <a-select-option value="asc">升序</a-select-option>
            </a-select>
          </div>
        </a-col>
        <a-col :span="24" :md="6">
          <div class="filter-actions">
            <a-button 
              type="primary" 
              style="margin-right: 10px;" 
              @click="applyFilters"
              :loading="isFiltering"
            >
              确定筛选
            </a-button>
            <a-button 
              type="primary" 
              @click="resetFilters"
              :disabled="isFiltering"
            >
              重置筛选
            </a-button>
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
            <div class="card-title">特控线</div>
            <div class="card-value">{{ loadingPassLine ? '加载中' : passLine }}</div>
          </div>
        </a-col>
        <a-col :span="12" :lg="4">
          <div class="summary-card pass-rate-card">
            <div class="card-title">特控率</div>
            <div class="card-value">{{ loadingPassLine ? '加载中' : `${passRate}%` }}</div>
          </div>
        </a-col>
        <a-col :span="12" :lg="4">
          <div class="summary-card student-count-card">
            <div class="card-title">学生人数</div>
            <div class="card-value">{{ rawScoreList.length }}</div>
          </div>
        </a-col>
      </a-row>
    </div>
<div class="table-notes" style="margin-bottom: 10px; color: #666; font-size: 12px; text-align: right;">
		    注：特控线上下5分区间成绩标为橙色,低于特控线五分及以下的成绩标为红色，超出特控线5分以上成绩标为黑色
		  </div>
    <!-- 成绩表格区域 -->
    <div class="table-section">
      <a-card title="班级成绩详情" class="score-card">
		  
        <div class="table-container">
          <a-table
            :columns="columns"
            :data-source="scoreList"
            bordered
            :pagination="{ pageSize: 100}"
            :scroll="{ x: true, y: 600 }"  
            :loading="isFiltering"
          >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'totalScore'">
              <!-- 总分颜色逻辑 -->
              <span :class="loadingPassLine ? 'normal-score' : getTotalScoreClass(record.totalScore)">
                {{ loadingPassLine ? '加载中' : record.totalScore }}
              </span>
            </template>
            <template v-if="column.dataIndex === 'classRank'">
              <span :class="getRankClass(record.classRank, record.totalScore)">
                {{ record.classRank }}
              </span>
            </template>
            <!-- 单科成绩颜色逻辑 -->
            <template v-if="isSubjectScore(column.dataIndex)">
              <span :class="getSubjectScoreClass(column.dataIndex, record[column.dataIndex])">
                {{ record[column.dataIndex] }}
              </span>
            </template>
          </template>
        </a-table>
      </div>
      </a-card>
    </div>
    <!-- 只在选择了班级和考试后才显示分段统计 -->
    <ExamSummarize v-if="selectedExamId && selectedClassId" :exam_id="selectedExamId" :class_id="selectedClassId" />
    <a-spin v-if="loading || loadingPassLine" tip="加载中..." class="loading-spin" />
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
import { getGradeSubjects, getTotalScore, getTotalClassRank, getTotalSchoolRank, getSubjectScore, getSubjectClassRank, getSubjectSchoolRank, groupPassLine, getPassLineTotal, getPassLineValue } from "@/utils/subjects";
import ScoreRangeFilter from '@/components/ScoreRangeFilter.vue';
import GradeRangeFilter from '@/components/GradeRangeFilter.vue'
import ExamSummarize from "@/views/teacher/ExamSummarize.vue";

interface ScoreItem {
  studentId: string;
  studentName: string;
  totalScore: number;
  classRank: number;
  schoolRank: number;
  [key: string]: any;
}

interface ClassStats {
  totalScore: number;
  [key: string]: number;
}

interface PassLineItem {
  id: number;
  line_group_id: number;
  line_name: string;
  '总分'?: number;
  '语文'?: number;
  '数学'?: number;
  '英语'?: number;
  '物理'?: number;
  '历史'?: number;
  '化学'?: number;
  '生物'?: number;
  '政治'?: number;
  '地理'?: number;
  [key: string]: any;
}

interface ClassItem {
  id: number;
  name: string;
  header: number;
  school_id: number;
  subject_selection: string;
}

// 状态管理
const user = useUserStore();
const classInfo = ref<class_info>();
const allClassList = ref<ClassItem[]>([]); // 所有班级列表
const filteredClassList = ref<ClassItem[]>([]); // 筛选后的班级列表
const classExamList = ref<any[]>([]);
const selectedClassId = ref<number>(0); // 选中的班级ID
const selectedExamId = ref<number>(0);
const teacherId = ref<number>(0);
const scoreList = ref<ScoreItem[]>([]);
const rawScoreList = ref<ScoreItem[]>([]); // 保存原始成绩数据
const loading = ref(false);
const isFiltering = ref(false); // 筛选操作状态
const passLine = ref(0);
const subjects = ref<string[]>([]);
const currentStudentId = ref('');
const loadingPassLine = ref(true); // 标记分数线是否加载完成
const classSearchKeyword = ref(''); // 班级搜索关键词
// 科目映射配置（中文科目名）
const subject_list = {
  '语文': '语文',
  '数学': '数学',
  '英语': '英语',
  '物理': '物理',
  '历史': '历史',
  '化学': '化学',
  '生物': '生物',
  '政治': '政治',
  '地理': '地理',
};
const filteredSubjectList = computed(() => {
  // 定义所有可能的科目
  const allSubjects = { ...subject_list };
  // 没有分科信息时，返回所有科目
  if (!classInfo.value?.subject_selection || classInfo.value.subject_selection.trim() === '未选科') {
    return allSubjects;
  }

  const subjectSelection = classInfo.value.subject_selection;
  const filtered: Record<string, string> = {};

  // 语文、数学、英语为必选科目
  filtered['语文'] = subject_list['语文'];
  filtered['数学'] = subject_list['数学'];
  filtered['英语'] = subject_list['英语'];

  // 根据班级科目选择添加其他科目
  if (subjectSelection.includes('物')) {
    filtered['物理'] = subject_list['物理'];
  }
  if (subjectSelection.includes('史')) {
    filtered['历史'] = subject_list['历史'];
  }
  if (subjectSelection.includes('化')) {
    filtered['化学'] = subject_list['化学'];
  }
  if (subjectSelection.includes('生')) {
    filtered['生物'] = subject_list['生物'];
  }
  if (subjectSelection.includes('政')) {
    filtered['政治'] = subject_list['政治'];
  }
  if (subjectSelection.includes('地')) {
    filtered['地理'] = subject_list['地理'];
  }

  return filtered;
});

// 新增：存储各科特控线
const subjectPassLines = ref<Record<string, number>>({});

// 筛选状态
const selectedSubject = ref<string>(''); // 科目筛选
const sortOrder = ref<string>('desc'); // 排序方向（仅需此参数）
const minScore = ref<number | null>(null); // 最低分数
const maxScore = ref<number | null>(null); // 最高分数
const passLineOffset = ref<number | null>(null); // 分数线上下范围
const selectedLineGroupId = ref<number | null>(null); // 选中的分数线组ID
const gradeExamList = ref<any[]>([]); // 年级考试列表
const passLineList = ref<PassLineItem[]>([]); // 分数线列表

// 班级统计数据
const classAvg = ref<ClassStats>({ totalScore: 0 });
const classMax = ref<ClassStats>({ totalScore: 0 });
const classMin = ref<ClassStats>({ totalScore: 0 });
const passRate = ref(0);

// 学生相关响应式变量
const studentList = ref<any[]>([]); // 所有学生列表
const filteredStudents = ref<any[]>([]); // 筛选后的学生列表
const searchKeyword = ref(''); // 学生搜索关键词
const selectedStudentId = ref(''); // 选中的学生ID

// 区间筛选相关状态
const selectedRangeType = ref<null | 'score' | 'gradeRank' | 'classRank'>(null);
const selectedRange = ref<null | { start: number; end: number }>(null);
const gradeTotalCount = ref(0); // 年级总人数，用于段次计算

// 排名筛选相关状态
const minClassRank = ref<number | null>(null);
const maxClassRank = ref<number | null>(null);
const minRank = ref<number | null>(null);
const maxRank = ref<number | null>(null);

const columns = computed(() => {
  const baseColumns = [
    { title: '学号', dataIndex: 'studentId', key: 'studentId', width: 100 },
    { title: '姓名', dataIndex: 'studentName', key: 'studentName', width: 150 },
  ];
  // 每个科目生成 分数/班名/校名 三列
  const subjectColumns = subjects.value.flatMap(subject => [
    { title: subject, dataIndex: subject, key: subject, width: 120, sorter: false },
    { title: '班名', dataIndex: `${subject}b`, key: `${subject}b`, width: 100, sorter: false },
    { title: '校名', dataIndex: `${subject}d`, key: `${subject}d`, width: 100, sorter: false },
  ]);
  const sumColumns = [
    {
      title: '总分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      width: 100,
      sorter: false
    },
    {
      title: '班名',
      dataIndex: 'classRank',
      key: 'classRank',
      width: 100,
      sorter: false
    },
    {
      title: '校名',
      dataIndex: 'schoolRank',
      key: 'schoolRank',
      width: 100,
      sorter: false
    }
  ];

  return [...baseColumns, ...sumColumns, ...subjectColumns];
});

// 判断是否为单科成绩字段
const isSubjectScore = (dataIndex: string) => {
  const subjectFields = Object.keys(filteredSubjectList.value);
  return subjectFields.includes(dataIndex);
};

// 总分颜色判断
const getTotalScoreClass = (score: number) => {
  if (loadingPassLine.value) return 'normal-score';
  if (passLine.value <= 0) return 'normal-score';
  
  const diff = score - passLine.value;
  if (diff >= 5) return 'normal-score'; // 超线5分以上→黑色
  if (diff >= 0 && diff < 5) return 'below-pass-line-near'; // 超线0-5分→橙色
  if (diff >= -5 && diff < 0) return 'below-pass-line-near'; // 离线0-5分→橙色
  return 'below-pass-line-far'; // 离线5分以上→红色
};

// 单科成绩颜色判断
const getSubjectScoreClass = (subject: string, score: number) => {
  if (loadingPassLine.value) return 'normal-score';
  
  const subjectLine = subjectPassLines.value[subject];
  if (!subjectLine || subjectLine <= 0) return 'normal-score';
  
  const diff = score - subjectLine;
  if (diff >= -5 && diff <= 5) return 'below-pass-line-near'; // 上下5分→橙色
  if (diff < -5) return 'below-pass-line-far'; // 低于5分以上→红色
  
  return 'normal-score'; // 其他情况→黑色
};

const getRankClass = (rank: number, score: number) => {
  // 加入分数线判断，覆盖原有纯排名规则
  if (loadingPassLine.value || passLine.value <= 0) {
    // 分数线未加载时，不根据排名设置颜色
    return '';
  }
  const diff = score - passLine.value;
  // 按分数线规则控制排名列颜色
  if (diff >= 5) return ''; // 超线5分以上 → 无特殊颜色
  if (diff >= 0) return ''; // 超线0-5分 → 橙色
  if (diff >= -5 && diff < 0) return 'r';
  return ''; // 线下 → 红色
};

const calculateStats = () => {
  // 始终基于原始数据计算统计值
  const scores = rawScoreList.value;
  if (!scores.length) return;
  
  const stats: Record<string, number[]> = { totalScore: [] };
  subjects.value.forEach(subject => { stats[subject] = []; });

  scores.forEach(item => {
    stats.totalScore.push(item.totalScore);
    subjects.value.forEach(subject => {
      stats[subject].push(item[subject] || 0);
    });
  });

  // 计算平均分
  const avg: ClassStats = {
    totalScore: stats.totalScore.reduce((a, b) => a + b, 0) / stats.totalScore.length
  };
  subjects.value.forEach(subject => {
    avg[subject] = stats[subject].reduce((a, b) => a + b, 0) / stats[subject].length;
  });
  classAvg.value = avg;

  // 计算最高分
  const max: ClassStats = { totalScore: Math.max(...stats.totalScore) };
  subjects.value.forEach(subject => {
    max[subject] = Math.max(...stats[subject]);
  });
  classMax.value = max;

  // 计算最低分
  const min: ClassStats = { totalScore: Math.min(...stats.totalScore) };
  subjects.value.forEach(subject => {
    min[subject] = Math.min(...stats[subject]);
  });
  classMin.value = min;

  // 计算特控率（需等待分数线加载完成）
  if (!loadingPassLine.value && passLine.value > 0) {
    const passCount = stats.totalScore.filter(score => score >= passLine.value).length;
    passRate.value = Math.round((passCount / stats.totalScore.length) * 100);
  } else {
    passRate.value = 0;
  }
};

// 获取对应考试的总分和各科特控线
const fetchPassLine = async (examId: number) => {
  loadingPassLine.value = true; // 开始加载，标记为true
  try {
    const res = await getPassLine({ exam_id: examId, size: 20 });
    if (res.data && res.data.length > 0) {
      const rows: any[] = res.data;
      const subjectSel = classInfo.value?.subject_selection || '';
      const trimmedSel = subjectSel.trim(); // 去除首尾空格，兼容空字符串场景

      // 行式下按 line_group_id 分组，匹配选科对应的特控线组
      const grouped = new Map<number, any[]>();
      rows.forEach((row: any) => {
        const gid = row.line_group_id;
        if (gid == null) return;
        if (!grouped.has(gid)) grouped.set(gid, []);
        grouped.get(gid)!.push(row);
      });
      const groups = Array.from(grouped.values());

      // 找到匹配选科的特控线组（取该组任意一行的 line_name 判断）
      let targetGroup: any[] | null = null;
      const matchGroup = (pred: (line_name: string) => boolean): any[] | null => {
        return groups.find((g: any[]) => {
          const name = g[0]?.line_name || '';
          return pred(name);
        }) || null;
      };

      if (trimmedSel === '' || trimmedSel === '未选科') {
        targetGroup = matchGroup((n) => n.includes('未选科') && n.includes('特控'));
      } else if (subjectSel.includes('物')) {
        targetGroup = matchGroup((n) => (n.includes('物') || n.includes('理')) && n.includes('特控'));
      } else if (subjectSel.includes('史')) {
        targetGroup = matchGroup((n) => n.includes('史') && n.includes('特控'));
      } else {
        targetGroup = matchGroup((n) => n.includes('特控')) || groups[0] || null;
      }

      if (targetGroup && targetGroup.length > 0) {
        // 组装成 {科目: 分数}
        const lineDict = groupPassLine(targetGroup);
        // 设置总分特控线
        passLine.value = getPassLineTotal(lineDict);

        // 设置各科特控线（中文科目键）
        const subjectKeys = Object.keys(filteredSubjectList.value);
        subjectKeys.forEach(key => {
          subjectPassLines.value[key] = getPassLineValue(lineDict, key);
        });
      } else {
        passLine.value = 0;
        subjectPassLines.value = {};
      }
    } else {
      passLine.value = 0;
      subjectPassLines.value = {};
    }
  } catch (err) {
    console.error('获取分数线失败:', err);
    passLine.value = 0;
    subjectPassLines.value = {};
  } finally {
    loadingPassLine.value = false; // 加载完成，标记为false
    calculateStats(); // 重新计算特控率
  }
};

// 从 subjects 对象提取实际存在的科目（中文科目名）
const extractAllFields = (rawItem: any) => {
  return getGradeSubjects(rawItem);
};

// 过滤无效科目（所有行 score===0 且 classRank===1 视为无效）
const filterInvalidSubjects = (allFields: string[], rawData: any[]) => {
  const excludedFields: string[] = [];

  allFields.forEach(subject => {
    const hasInvalid = rawData.some(item => {
      const score = getSubjectScore(item, subject);
      const classRank = getSubjectClassRank(item, subject);
      return score === 0 && classRank === 1;
    });

    if (hasInvalid) {
      excludedFields.push(subject);
      excludedFields.push(`${subject}b`);
      excludedFields.push(`${subject}d`);
    }
  });

  return allFields.filter(field => !excludedFields.includes(field));
};

const fetchGradeExams = async (classId: number) => {
  try {
    const classIdStr = classId.toString();
    const gradePrefix = classIdStr.substring(0, 2); // 取班级ID前两位作为年级前缀
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

const fetchPassLineList = async (examId: number) => {
  try {
    const res = await getPassLine({ exam_id: examId, size: 20 });
    let passLines = res.data || [];

    // 根据班级选科筛选分数线（行式，每行一个科目）
    if (classInfo.value?.subject_selection) {
      const subjectSel = classInfo.value.subject_selection;
      const trimmedSel = subjectSel.trim();
      console.log('班级选科:', trimmedSel);

      if (trimmedSel === '' || trimmedSel === '未选科') {
        passLines = passLines.filter((line: any) =>
          line.line_name && line.line_name.includes('未选科')
        );
      } else if (subjectSel.includes('物')) {
        // 筛选物理类分数线（line_name包含"物"）
        passLines = passLines.filter((line: any) =>
          line.line_name && line.line_name.includes('物')
        );
      } else if (subjectSel.includes('史')) {
        // 筛选历史类分数线（line_name包含"史"）
        passLines = passLines.filter((line: any) =>
          line.line_name && line.line_name.includes('史')
        );
      }
    }

    // 行式按 line_group_id 分组组装成每条线一个对象：{id, line_group_id, line_name, 总分, 语文, ...}
    const grouped = new Map<number, PassLineItem>();
    passLines.forEach((row: any) => {
      const gid = row.line_group_id;
      if (gid == null) return;
      if (!grouped.has(gid)) {
        grouped.set(gid, {
          id: gid,
          line_group_id: gid,
          line_name: row.line_name || '',
        } as PassLineItem);
      }
      const item = grouped.get(gid)!;
      if (row.subject != null && row.score != null) {
        (item as any)[row.subject] = row.score;
      }
    });

    passLineList.value = Array.from(grouped.values());
  } catch (err) {
    console.error('获取分数线列表失败:', err);
    passLineList.value = [];
  }
};

const fetchClassStudents = async () => {
  if (!selectedClassId.value) return;
  try {
    const res = await getStudentApi({ class_id: selectedClassId.value });
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

// 班级搜索处理
const handleClassSearch = (value: string) => {
  classSearchKeyword.value = value;
  if (!value) {
    filteredClassList.value = [...allClassList.value];
    return;
  }
  filteredClassList.value = allClassList.value.filter(cls => 
    cls.name.toLowerCase().includes(value.toLowerCase()) ||
    cls.id.toString().includes(value.toLowerCase())
  );
};

// 重置所有筛选条件（除班级外）
const resetAllFiltersExceptClass = () => {
  // 重置考试选择
  selectedExamId.value = 0;
  classExamList.value = [];
  
  // 重置其他筛选条件
  selectedSubject.value = '';
  sortOrder.value = 'desc'; // 重置为默认降序
  minScore.value = null;
  maxScore.value = null;
  minRank.value = null;
  maxRank.value = null;
  minClassRank.value = null;
  maxClassRank.value = null;
  
  // 分数线筛选
  passLineOffset.value = null;
  selectedLineGroupId.value = null;
  passLineList.value = [];
  subjectPassLines.value = {}; // 重置各科分数线
  
  // 学生筛选
  selectedStudentId.value = '';
  searchKeyword.value = '';
  filteredStudents.value = [];
  
  // 区间筛选组件状态
  selectedRangeType.value = null;
  selectedRange.value = null;
  
  // 清空成绩数据
  scoreList.value = [];
  rawScoreList.value = [];
  subjects.value = [];
  
  // 重置统计数据
  classAvg.value = { totalScore: 0 };
  classMax.value = { totalScore: 0 };
  classMin.value = { totalScore: 0 };
  passRate.value = 0;
  passLine.value = 0;
};

// 班级选择变更处理
const handleClassChange = async (classId: number) => {
  if (!classId) return;
  
  // 重置所有筛选条件（除班级外）
  resetAllFiltersExceptClass();
  // 清空班级搜索关键词并重置筛选列表
  classSearchKeyword.value = '';
  filteredClassList.value = [...allClassList.value];
  
  // 新增：清空旧的分数线列表
  passLineList.value = [];
  subjectPassLines.value = {};
  
  // 更新班级信息
  const selectedClass = allClassList.value.find(cls => cls.id === classId);
  if (selectedClass) {
    classInfo.value = {
      header: selectedClass.header,
      class_id: selectedClass.id,
      name: selectedClass.name,
      subject_selection: selectedClass.subject_selection,
      school_id: selectedClass.school_id
    };
  }
  
  // 获取该班级的考试列表，但不自动加载数据
  try {
    const examRes = await getClassExam({ class_id: classId });
    if (examRes.code === 200 && examRes.data.length > 0) {
      // 考试列表按ID降序排序，最新考试（ID最大）排在前面
      classExamList.value = examRes.data.sort((a: any, b: any) => b.id - a.id);
      selectedExamId.value = classExamList.value[0].id;
    } else {
      message.warning(examRes.msg || '该班级暂无考试数据');
    }
    
    // 加载学生列表但不加载成绩数据
    await fetchClassStudents();
    // 加载年级考试列表
    await fetchGradeExams(classId);
	await fetchPassLine(selectedExamId.value)
	await fetchPassLineList(selectedExamId.value)
  } catch (err) {
    console.error('获取班级考试列表失败:', err);
    message.error('获取班级考试信息失败');
  }
};

const handleStudentSearch = (value: string) => {
  searchKeyword.value = value;
  if (!value) {
    // 搜索为空时显示全部学生
    filteredStudents.value = [...studentList.value];
    return;
  }
  filteredStudents.value = studentList.value.filter(student => 
    student.name.toLowerCase().includes(value.toLowerCase()) ||
    student.id.toString().includes(value.toLowerCase())
  );
};

// 当分数线偏移变化时，重置学生筛选
const handlePassLineOffsetChange = (value: number | null) => {
  passLineOffset.value = value;
  // 重置学生筛选为全体学生
  selectedStudentId.value = '';
  searchKeyword.value = '';
  filteredStudents.value = [...studentList.value];
};

// 当分数线组ID变化时，重置学生筛选
const handlePassLineIdChange = (value: number | null) => {
  selectedLineGroupId.value = value;
  // 重置学生筛选为全体学生
  selectedStudentId.value = '';
  searchKeyword.value = '';
  filteredStudents.value = [...studentList.value];
};

const add_filter = (params: any) => {
  if (selectedSubject.value) params.subject = selectedSubject.value;
  // 严格按照接口要求传递排序方向参数
  params.order_direction = sortOrder.value;

  // 其他筛选参数保持不变
  if (minScore.value !== null) params.min_score = minScore.value;
  if (maxScore.value !== null) params.max_score = maxScore.value;
  if (minRank.value !== null) params.min_rank = minRank.value;
  if (maxRank.value !== null) params.max_rank = maxRank.value;
  if (passLineOffset.value !== null) params.pass_line_offset = passLineOffset.value;
  if (selectedLineGroupId.value !== null) params.pass_line_id = selectedLineGroupId.value;
  if (selectedStudentId.value) params.student_id = selectedStudentId.value;
  if (minClassRank.value !== null) params.min_class_rank = minClassRank.value;
  if (maxClassRank.value !== null) params.max_class_rank = maxClassRank.value;
};

// 修改applyFilters函数,确保排序参数正确应用
const applyFilters = async () => {
  console.log('[applyFilters] 被调用, selectedExamId:', selectedExamId.value, 'selectedClassId:', selectedClassId.value);
  
  if (!selectedExamId.value || !selectedClassId.value) {
    message.warning('请选择班级和考试');
    return;
  }
  
  isFiltering.value = true;
  try {
    console.log('[applyFilters] 准备调用 handleExamChange, examId:', selectedExamId.value);
    // 直接调用handleExamChange,它会自动应用当前的排序参数
    await handleExamChange(selectedExamId.value);
    message.success('筛选完成');
  } catch (err) {
    message.error('筛选失败,请重试');
    console.error('筛选错误:', err);
  } finally {
    isFiltering.value = false;
  }
};

const handleExamChange = async (examId: number) => {
  console.log('[handleExamChange] 被调用, examId:', examId, 'selectedClassId:', selectedClassId.value);
  
  if (!examId || !selectedClassId.value) {
    console.error('[handleExamChange] 参数不完整:', { examId, selectedClassId: selectedClassId.value });
    message.error("没有examId或班级ID");
    return;
  }
  try {
    const params: Record<string, any> = {
      class_id: selectedClassId.value.toString(),
      selected_exam_id: examId.toString()
    };
    
    // 获取原始数据（不加筛选条件）
    const rawParams = { ...params };
    const rawRes = await getClassGrade(rawParams);
    
    if (rawRes.code === 200) {
      const rawData = Array.isArray(rawRes.data) ? rawRes.data : (rawRes.data?.gradeList || []);
      if (rawData.length > 0) {
        const allFields = extractAllFields(rawData[0]);
        const validFields = filterInvalidSubjects(allFields, rawData);
        subjects.value = validFields;
        
        // 保存原始数据
        rawScoreList.value = rawData.map((item: any) => {
          const scoreItem: ScoreItem = {
            studentId: "*" + String(item.student_id || item.studentId || '').slice(-5, -1),
            studentName: item.student_name || item.studentName || '未知学生',
            totalScore: getTotalScore(item),
            classRank: getTotalClassRank(item),
            schoolRank: getTotalSchoolRank(item),
          };
          validFields.forEach(field => {
            // 分数 + 班名 + 校名
            scoreItem[field] = getSubjectScore(item, field);
            scoreItem[`${field}b`] = getSubjectClassRank(item, field);
            scoreItem[`${field}d`] = getSubjectSchoolRank(item, field);
          });
          return scoreItem;
        });
      }
    }
    
    add_filter(params);
    const res = await getClassGrade(params);
    console.log('成绩数据响应:', res, '使用的排序参数:', { direction: sortOrder.value });

    if (res.code === 200) {
      const filteredData = Array.isArray(res.data) ? res.data : (res.data?.gradeList || []);
      if (filteredData.length > 0) {
        const allFields = extractAllFields(filteredData[0]);
        const validFields = filterInvalidSubjects(allFields, filteredData);
        subjects.value = validFields;
        scoreList.value = filteredData.map((item: any) => {
          const scoreItem: ScoreItem = {
            studentId: "*" + String(item.student_id || item.studentId || '').slice(-5, -1),
            studentName: item.student_name || item.studentName || '未知学生',
            totalScore: getTotalScore(item),
            classRank: getTotalClassRank(item),
            schoolRank: getTotalSchoolRank(item),
          };
          validFields.forEach(field => {
            // 分数 + 班名 + 校名
            scoreItem[field] = getSubjectScore(item, field);
            scoreItem[`${field}b`] = getSubjectClassRank(item, field);
            scoreItem[`${field}d`] = getSubjectSchoolRank(item, field);
          });
          return scoreItem;
        });
        
        await fetchPassLine(examId);
        await fetchPassLineList(examId);
        calculateStats(); 
        return;
      }
    }
    
    message.warning('当前筛选条件下暂无成绩数据');
    scoreList.value = [];
  } catch (err) {
    console.error('获取成绩失败:', err);
    throw err; 
  }
};


const resetFilters = () => {
  console.log('重置筛选条件');
  selectedExamId.value = classExamList.value.length > 0 ? classExamList.value[0].id : 0;
  selectedSubject.value = '';
  sortOrder.value = 'desc'; 
  minScore.value = null;
  maxScore.value = null;
  minRank.value = null;
  maxRank.value = null;
  minClassRank.value = null;
  maxClassRank.value = null;
  // 分数线筛选
  passLineOffset.value = null;
  selectedLineGroupId.value = null;
  // 学生筛选
  selectedStudentId.value = '';
  searchKeyword.value = '';
  filteredStudents.value = [...studentList.value];
  // 区间筛选组件状态
  selectedRangeType.value = null;
  selectedRange.value = null;
};

const handleRangeFilterChange = (data: any) => {
  // 重置所有区间参数
  minScore.value = null;
  maxScore.value = null;
  minRank.value = null;
  maxRank.value = null;
  minClassRank.value = null;
  maxClassRank.value = null;

  // 根据筛选类型设置参数
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
  
  // 重置学生筛选为全体学生
  selectedStudentId.value = '';
  searchKeyword.value = '';
  filteredStudents.value = [...studentList.value];
};

// 添加学生选择变更处理函数
const handleStudentChange = (studentId: string) => {
  selectedStudentId.value = studentId;
  
  // 如果选择了单个学生，清空分数线筛选和成绩区间筛选
  if (studentId) {
    // 清空分数线筛选
    passLineOffset.value = null;
    selectedLineGroupId.value = null;
    
    // 清空成绩区间筛选
    selectedRangeType.value = null;
    selectedRange.value = null;
    minScore.value = null;
    maxScore.value = null;
    minRank.value = null;
    maxRank.value = null;
    minClassRank.value = null;
    maxClassRank.value = null;
  }
  
  // 清空搜索关键词
  searchKeyword.value = '';
  // 重置筛选后的学生列表为所有学生
  filteredStudents.value = [...studentList.value];
};

// 获取所有班级列表（不传入header参数）
const fetchAllClasses = async () => {
  try {
    // 不传入header参数获取全部班级
    const res = await getClassesApi({});
    if (res.code === 200 && res.data.length > 0) {
      allClassList.value = res.data;
      filteredClassList.value = [...allClassList.value];
      return res.data;
    }
  } catch (err) {
    console.error('获取所有班级列表失败:', err);
    message.error('获取班级列表失败');
  }
  return [];
};

// 获取教师自己的班级
const fetchTeacherClasses = async (teacherId: number) => {
  try {
    const res = await getClassesApi({ header: teacherId });
    if (res.code === 200 && res.data.length > 0) {
      return res.data;
    }
  } catch (err) {
    console.error('获取教师班级列表失败:', err);
  }
  return [];
};

onMounted(async () => {
  teacherId.value = user.getUserInfo().role;
  
  try {
    // 先获取所有班级
    const allClasses = await fetchAllClasses();
    if (allClasses.length === 0) {
      message.error('未查询到任何班级信息');
      loadingPassLine.value = false;
      return;
    }

    // 获取教师自己的班级
    let teacherClasses = [];
    if (teacherId.value) {
      teacherClasses = await fetchTeacherClasses(teacherId.value);
    }

    // 默认选择教师的第一个班级，如果没有则选择所有班级中的第一个
    if (teacherClasses.length > 0) {
      selectedClassId.value = teacherClasses[0].id;
      classInfo.value = {
        header: teacherClasses[0].header,
        class_id: teacherClasses[0].id,
        name: teacherClasses[0].name,
        subject_selection: teacherClasses[0].subject_selection,
        school_id: teacherClasses[0].school_id
      };
    } else if (allClasses.length > 0) {
      selectedClassId.value = allClasses[0].id;
      classInfo.value = {
        header: allClasses[0].header,
        class_id: allClasses[0].id,
        name: allClasses[0].name,
        subject_selection: allClasses[0].subject_selection,
        school_id: allClasses[0].school_id
      };
    }

    // 加载班级考试列表
    if (selectedClassId.value) {
      console.log('[onMounted] 开始加载考试列表, classId:', selectedClassId.value);
      const examRes = await getClassExam({ class_id: selectedClassId.value });
      if (examRes.code === 200 && examRes.data.length > 0) {
        // 考试列表按ID降序排序,最新考试(ID最大)排在前面
        classExamList.value = examRes.data.sort((a: any, b: any) => b.id - a.id);
        console.log('[onMounted] 考试列表加载成功:', classExamList.value.map(e => ({ id: e.id, name: e.name })));
        
        // 默认选择第一个考试(最新的考试)
        selectedExamId.value = classExamList.value[0].id;
        console.log('[onMounted] 设置 selectedExamId =', selectedExamId.value);
        
        // 等待下一个tick确保selectedExamId已更新
        await new Promise(resolve => setTimeout(resolve, 0));
        console.log('[onMounted] tick后 selectedExamId =', selectedExamId.value);
        
        // 初始加载时自动加载数据
        console.log('[onMounted] 准备调用 applyFilters');
        await applyFilters();
        console.log('[onMounted] applyFilters 完成');
      } else {
        message.warning(examRes.msg || '获取考试列表失败');
        loadingPassLine.value = false;
      }


      // 加载年级考试列表
      await fetchGradeExams(selectedClassId.value);
    }

    // 加载班级学生列表
    await fetchClassStudents();
    
  } catch (err) {
    message.error('初始化失败，请重试');
    console.error('初始化错误:', err);
    loadingPassLine.value = false;
  }
});
</script>

<style scoped lang="less">
.class-grade-container {
  padding: 20px;
  min-height: 100vh;
  box-sizing: border-box;
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
      justify-content: center; /* 垂直居中 */
      align-items: center; /* 水平居中 */
      text-align: center; /* 文本居中 */
      transition: transform 0.3s ease;
      
      &:hover {
        transform: translateY(-5px);
      }
      
      .card-title {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
        width: 100%; /* 确保标题宽度100% */
      }
      
      .card-value {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    
    .avg-score-card {
      border-top: 4px solid #1890ff;
      .card-value { color: #1890ff; }
    }
    
    .max-score-card {
      border-top: 4px solid #52c41a;
      .card-value { color: #52c41a; }
    }
    
    .min-score-card {
      border-top: 4px solid #fa8c16;
      .card-value { color: #fa8c16; }
    }
    
    .pass-line-card {
      border-top: 4px solid #722ed1;
      .card-value { color: #722ed1; }
    }
    
    .pass-rate-card {
      border-top: 4px solid #eb2f96;
      .card-value { color: #eb2f96; }
    }
    
    .student-count-card {
      border-top: 4px solid #13c2c2;
      .card-value { color: #13c2c2; }
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
  
  .table-container { padding: 10px 0; }
  
  .loading-spin {
    display: flex;
    justify-content: center;
    margin: 50px 0;
  }
  
  .normal-score { 
    color: #333; /* 纯黑色 */
    font-weight: 500;
  }
  .above-pass-line-near { 
    color: #52c41a; /* 绿色 */
    font-weight: bold;
  }
  .below-pass-line-near { 
    color: #fa8c16; /* 橙色 */
    font-weight: bold;
  }
  .below-pass-line-far { 
    color: #f5222d; /* 红色 */
    font-weight: bold;
  }
  
  /* 响应式调整 */
  @media (max-width: 768px) {
    padding: 10px;
    
    .filter-section {
      .filter-item {
        margin-bottom: 10px;
        .filter-label { width: 60px; }
      }
    }
    
    .stats-section {
      .summary-card {
        padding: 12px;
        .card-title { font-size: 12px; }
        .card-value { font-size: 20px; }
      }
    }
  }
}
</style>

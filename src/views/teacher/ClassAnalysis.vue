<template>
  <div class="class-analysis-container">
    <!-- 学生过线率列表 -->
    <div class="section">
      <a-row>
        <div class="section-title">学生各科目过线率统计</div>
      </a-row>
      <a-card class="rate-card">
        <!-- 搜索框 -->
        <div class="search-container">
          <a-space wrap :size="12">
            <!-- 学生姓名搜索 -->
            <a-auto-complete
              v-model:value="searchName"
              :options="studentNameOptions"
              placeholder="请输入或选择学生姓名"
              style="width: 250px"
              @search="handleSearch"
              @select="handleSelect"
              allowClear
            >
              <template #option="{ value, label }">
                <div>{{ label }} ({{ maskStudentId(value) }})</div>
              </template>
            </a-auto-complete>
            <!-- 科目筛选 -->
            <a-select
              v-model:value="selectedSubject"
              placeholder="请选择科目"
              style="width: 150px"
              allowClear
              @change="handleSubjectChange"
            >
              <a-select-option value="">全部科目</a-select-option>
              <a-select-option v-for="subject in availableSubjects" :key="subject.value" :value="subject.value">
                {{ subject.label }}
              </a-select-option>
            </a-select>
            <!-- 过线率范围 -->
            <a-select
              v-model:value="rateRange"
              placeholder="过线率范围"
              style="width: 150px"
              allowClear
            >
              <a-select-option value="0-20">0% - 20%</a-select-option>
              <a-select-option value="20-40">20% - 40%</a-select-option>
              <a-select-option value="40-60">40% - 60%</a-select-option>
              <a-select-option value="60-80">60% - 80%</a-select-option>
              <a-select-option value="80-100">80% - 100%</a-select-option>
            </a-select>
            <!-- 排序方式 -->
            <a-select
              v-model:value="sortOrder"
              placeholder="排序方式"
              style="width: 150px"
            >
              <a-select-option value="desc">降序</a-select-option>
              <a-select-option value="asc">升序</a-select-option>
            </a-select>
            <!-- 确定筛选按钮 -->
            <a-button type="primary" @click="applyFilters">确定筛选</a-button>
            <!-- 清除筛选按钮 -->
            <a-button @click="clearSearch">清除筛选</a-button>
          </a-space>
        </div>
        <a-table
          :data-source="sortedStudentRateList"
          bordered
          :columns="studentRateColumns"
          :pagination="{ pageSize: 20 }"
          :scroll="{ x: 'max-content', y: 600 }"
          :loading="loading"
          rowKey="uid"
        >
          <template #bodyCell="{ column, record }">
            <!-- 过线率单元格颜色渲染 -->
            <template v-if="isSubjectColumn(column.dataIndex)">
              <span :class="getRateClass(record[column.dataIndex])">
                {{ record[column.dataIndex] === null || record[column.dataIndex] === undefined ? '-' : `${Math.round(record[column.dataIndex] * 100)}%` }}
              </span>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>
        <!-- ========== 知识点掌握情况模块 ========== -->
    <div class="section">
      <a-row>
        <div class="section-title">知识点掌握情况</div>
      </a-row>
      <a-card class="rate-card">
        <div class="search-container">
          <a-space wrap :size="12" align="center">
            <span>学科：</span>
            <a-select
              v-model:value="knowledgeSubject"
              placeholder="请选择科目"
              style="width: 180px"
              allowClear
              @change="handleKnowledgeSubjectChange"
            >
              <a-select-option v-for="item in subjectOptions" :key="item" :value="item">
                {{ item }}
              </a-select-option>
            </a-select>
            <a-auto-complete
              v-model:value="knowledgePoint"
              :options="knowledgePointOptions"
              placeholder="请输入知识点"
              style="width: 320px"
              allowClear
              @search="handleKnowledgeSearch"
              @select="handleKnowledgeSelect"
            >
              <template #option="{ label, value }">
                <div>
                  <div>{{ label }}</div>
                  <div style="font-size:12px;color:#888">题目:{{ value.question_count }} | 考试:{{ value.exam_count }}</div>
                </div>
              </template>
            </a-auto-complete>
            <span>考试次数：</span>
            <a-input-number
              v-model:value="queryExamN"
              placeholder="查询考试场数"
              :min="1"
              :max="100"
              style="width:140px"
            />
            <a-button type="primary" @click="fetchKnowledgeData" :loading="knowledgeLoading">查询</a-button>
            <a-button @click="clearKnowledgeFilter">重置</a-button>
          </a-space>
        </div>
              <!-- 查询出来的汇总信息 -->
        <div v-if="knowledgeSummary" class="summary-info">
          <div class="summary-wrap">
            <div class="summary-item">
              <div class="summary-label">知识点</div>
              <div class="summary-value">{{ knowledgePoint }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">班级人数</div>
              <div class="summary-value">{{ knowledgeSummary.active_student_count ?? 0 }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">有效考试场数</div>
              <div class="summary-value">{{ knowledgeSummary.actual_exam_count }} / {{ knowledgeSummary.requested_exam_count }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">总答对小题</div>
              <div class="summary-value">{{ knowledgeSummary.correct_question_count }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">总有效小题</div>
              <div class="summary-value">{{ knowledgeSummary.total_question_count }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">整体掌握率</div>
              <div class="summary-value">
                <b :class="getMasteryClass(knowledgeSummary?.mastery_rate)">
                  {{ knowledgeSummary?.mastery_rate != null
                    ? `${(knowledgeSummary.mastery_rate * 100).toFixed(0)}%`
                    : '暂无统计'
                    }}
                </b>
              </div>
            </div>
          </div>
        </div>
        <a-table
          :data-source="knowledgeExamList"
          bordered
          :columns="knowledgeColumns"
          :pagination="{ pageSize: 20 }"
          :scroll="{ x: 'max-content', y: 460 }"
          :loading="knowledgeLoading"
          rowKey="exam_id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'mastery_rate'">
              <span :class="getMasteryClass(record.mastery_rate)">
                {{ record.mastery_rate === null ? '-' : `${Math.round(record.mastery_rate * 100)}%` }}
              </span>
            </template>
          </template>
        </a-table>
        <div v-if="!knowledgeLoading && knowledgeExamList.length === 0 && knowledgeSummary" class="empty-tip">
          暂无可统计的有效考试数据
        </div>
      </a-card>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { postClassAlwaysTopBottomStudents } from '@/servers/api/average';
import { getStudentApi, postBatchGetStudentApi } from '@/servers/api/student';
import { message } from 'ant-design-vue';
import { getClassKnowledgePointMasteryApi, getClassKnowledgePointsApi } from '@/servers/api/analysis'
import { debounce } from 'lodash';

const props = defineProps<{
  classId: number;
}>();
const loading = ref(false);
// 科目名称映射表（支持拼音键和中文键，统一转为中文显示）
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
  '物理': '物理',
  '化学': '化学',
  '生物': '生物',
  '历史': '历史',
  '政治': '政治',
  '地理': '地理',
  '总分': '总分'
};
// 学生过线率列表数据
const studentRateList = ref<any[]>([]);
// 学生 uid → 姓名 映射表（从学生列表接口获取，补充过线率数据中缺失的姓名字段）
const studentNameMap = ref<Map<string, string>>(new Map());
// 表格列定义（增加排序功能）
const studentRateColumns = ref<any[]>([
  { title: '学生姓名', dataIndex: 'name', width: 120, fixed: 'left', align: 'center' },
  { title: '学号', dataIndex: 'uid', width: 120, fixed: 'left', align: 'center', customRender: ({ text }: any) => maskStudentId(text) },
]);

// 获取班级学生列表，建立 uid → 姓名 映射
const fetchStudentNames = async (classId: number) => {
  if (!classId) return;
  try {
    const res = await getStudentApi({
      class_id: classId,
      page: 1,
      size: 999,
    });
    if (res.code === 200 && res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.records || res.data.list || []);
      const map = new Map<string, string>();
      list.forEach((s: any) => {
        if (s.uid != null) {
          map.set(String(s.uid), s.name || '');
        }
      });
      studentNameMap.value = map;
    }
  } catch (err) {
    console.error('获取班级学生列表失败:', err);
  }
};
// 用批量接口补齐花名册中缺失的姓名（覆盖「历史考试有、当前花名册没有」的学生）
const fillMissingStudentNames = async (classData: any) => {
  const studentOneLineRate = classData?.student_one_line_rate || {};
  const missingUids = new Set<string>();
  Object.values(studentOneLineRate).forEach((students: any) => {
    if (!Array.isArray(students)) return;
    students.forEach((student: any) => {
      if (!student) return;
      const uid = student.uid == null ? '' : String(student.uid);
      if (!uid) return;
      // 过线率数据里没带姓名，且花名册映射里也查不到，才需要批量补
      if (!student.name && !studentNameMap.value.has(uid)) {
        missingUids.add(uid);
      }
    });
  });
  if (missingUids.size === 0) return;
  try {
    const res = await postBatchGetStudentApi({ student_ids: [...missingUids] });
    if (res?.code === 200 && res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.records || res.data.list || []);
      list.forEach((s: any) => {
        if (s.uid != null) {
          studentNameMap.value.set(String(s.uid), s.name || '');
        }
      });
    } else {
      console.warn('批量获取学生姓名失败:', res?.msg || res?.message || res);
    }
  } catch (err) {
    console.error('批量补齐学生姓名失败:', err);
  }
};
// 搜索相关
const searchName = ref<string>('');
const selectedSubject = ref<string>('');
const rateRange = ref<string | undefined>(undefined);
const sortOrder = ref<string>('desc'); // 排序方式，默认降序
// 学生姓名选项（用于自动完成）
const studentNameOptions = computed(() => {
  return studentRateList.value.map(student => ({
    value: student.uid,
    label: student.name
  }));
});
// 可用的科目列表
const availableSubjects = ref<{ value: string; label: string }[]>([]);
// 过滤后的学生列表
const filteredStudentRateList = computed(() => {
  let result = studentRateList.value;
  // 按姓名或学号筛选
  if (searchName.value) {
    result = result.filter(student => {
      const nameMatch = student.name.toLowerCase().includes(searchName.value.toLowerCase());
      const uidMatch = String(student.uid).includes(searchName.value);
      return nameMatch || uidMatch;
    });
  }
  // 按科目筛选
  if (selectedSubject.value) {
    result = result.filter(student => {
      const rate = student[selectedSubject.value!];
      return rate !== null && rate !== undefined;
    });
  }
  // 按过线率范围筛选
  if (rateRange.value) {
    const [min, max] = rateRange.value.split('-').map(Number);
    result = result.filter(student => {
      // 如果选择了具体科目，按该科目筛选；否则按任意科目筛选
      if (selectedSubject.value) {
        const rate = student[selectedSubject.value];
        if (rate === null || rate === undefined) return false;
        const ratePercent = rate * 100;
        return ratePercent >= min && ratePercent <= max;
      } else {
        // 检查学生是否有任何科目的过线率在指定范围内
        return availableSubjects.value.some(subject => {
          const rate = student[subject.value];
          if (rate === null || rate === undefined) return false;
          const ratePercent = rate * 100;
          return ratePercent >= min && ratePercent <= max;
        });
      }
    });
  }
  return result;
});
// 排序后的学生列表
const sortedStudentRateList = computed(() => {
  const list = [...filteredStudentRateList.value];
  // 如果选择了科目，按该科目过线率排序
  if (selectedSubject.value) {
    return list.sort((a, b) => {
      const rateA = a[selectedSubject.value] || 0;
      const rateB = b[selectedSubject.value] || 0;
      return sortOrder.value === 'desc' ? rateB - rateA : rateA - rateB;
    });
  }
  // 未选择科目时，按总分过线率排序
  return list.sort((a, b) => {
    const rateA = a['总分'] || 0;
    const rateB = b['总分'] || 0;
    return sortOrder.value === 'desc' ? rateB - rateA : rateA - rateB;
  });
});
// 判断是否为科目列
const isSubjectColumn = (dataIndex: string) => {
  return availableSubjects.value.some(subject => subject.value === dataIndex);
};
// 获取过线率颜色样式类
const getRateClass = (rate: number | null | undefined) => {
  if (rate === null || rate === undefined) return 'normal-rate';
  const ratePercent = rate * 100;
  if (ratePercent >= 50 && ratePercent <= 70) {
    return 'low-rate'; // 50%-70%红色
  } else {
    return 'normal-rate'; // 其他范围默认颜色
  }
};
// 处理搜索
const handleSearch = (value: string) => {
  searchName.value = value;
};
// 处理选择
const handleSelect = (value: string) => {
  // 当选择时，使用学号查找对应的学生姓名
  const student = studentRateList.value.find(s => s.uid === value);
  if (student) {
    searchName.value = student.name;
  }
};
// 处理科目变更
const handleSubjectChange = () => {
  // 科目变更时可以重置排序或其他筛选条件
};
// 应用筛选
const applyFilters = () => {
  // 触发计算属性重新计算，无需额外逻辑
  message.success('筛选条件已应用');
};
// 清除搜索
const clearSearch = () => {
  searchName.value = '';
  selectedSubject.value = '';
  rateRange.value = undefined;
  sortOrder.value = 'desc';
};
// 学号脱敏处理，只显示后四位并在前面加两个星号
const maskStudentId = (studentId: string) => {
  if (!studentId) return '';
  const idStr = String(studentId);
  if (idStr.length <= 4) return idStr;
  return '**' + idStr.slice(-4);
};
const knowledgeLoading = ref(false);
// 查询条件
const knowledgeSubject = ref<string>('');
const knowledgePoint = ref('');
const queryExamN = ref<number>(10);
// 知识点下拉候选选项
const knowledgePointOptions = ref<any[]>([]);
// 汇总返回data
const knowledgeSummary = ref<any>(null);
// 逐场考试列表，给table渲染
const knowledgeExamList = ref<any[]>([]);
// 科目下拉选项
const subjectOptions = ref<string[]>(['语文','数学','英语','物理','化学','生物','历史','政治','地理']);
// 表格列
const knowledgeColumns = ref<any[]>([
  { title: '考试ID', dataIndex: 'exam_id', width: 100, align: 'center' },
  { title: '考试名称', dataIndex: 'exam_name', width: 220, align: 'center' },
  { title: '考试日期', dataIndex: 'exam_date', width: 130, align: 'center' },
  { title: '参与人数', dataIndex: 'participant_count', width: 110, align: 'center' },
  { title: '答对小题数', dataIndex: 'correct_question_count', width: 120, align: 'center' },
  { title: '总小题数', dataIndex: 'total_question_count', width: 110, align: 'center' },
  { title: '本场掌握率', dataIndex: 'mastery_rate', width: 130, align: 'center' },
]);
// 掌握度颜色
const getMasteryClass = (rate: number|null|undefined) => {
  if(rate == null) return 'normal-rate';
  const p = rate * 100;
  if(p < 60) return 'low-rate';
  if(p < 80) return 'mid-rate';
  return 'normal-rate';
};
// 重置知识点筛选
const clearKnowledgeFilter = () => {
  knowledgeSubject.value = '';
  knowledgePoint.value = '';
  queryExamN.value = 10;
  knowledgePointOptions.value = [];
  knowledgeSummary.value = null;
  knowledgeExamList.value = [];
};
// 科目切换，清空候选
const handleKnowledgeSubjectChange = () => {
  knowledgePoint.value = '';
  knowledgePointOptions.value = [];
}
// 防抖：知识点输入模糊搜索候选接口（300ms）
const handleKnowledgeSearch = debounce(async (keyword: string) => {
  if (!props.classId || !knowledgeSubject.value) {
    knowledgePointOptions.value = [];
    return;
  }
  const trimKeyword = keyword?.trim() ?? '';
  try {
    const res = await getClassKnowledgePointsApi({
      class_id: props.classId,
      subject: knowledgeSubject.value,
      keyword: trimKeyword,
      limit: 100
    }) as any;
    if (res.code === 200 && Array.isArray(res.data)) {
      // 组装AutoComplete选项
      knowledgePointOptions.value = res.data.map(item => ({
        label: item.knowledge_point,
        value: item
      }))
      // total大于返回数量，提示用户
      if (res.total > res.data.length) {
        message.info('搜索结果较多，请输入更精确关键词');
      }
    } else {
      knowledgePointOptions.value = [];
    }
  } catch (err) {
    console.error('知识点候选搜索失败', err);
    knowledgePointOptions.value = [];
  }
}, 300);
// 用户选中下拉条目，回填完整知识点名称
const handleKnowledgeSelect = (item: any) => {
  knowledgePoint.value = item.knowledge_point;
}
// 查询掌握度数据
const fetchKnowledgeData = async () => {
  if (!props.classId) {
    message.warning('请先选择班级');
    return;
  }
  const trimPoint = knowledgePoint.value?.trim() ?? '';
  if (!knowledgeSubject.value || !trimPoint) {
    message.warning('请选择科目并从下拉选择知识点');
    return;
  }
  try {
    knowledgeLoading.value = true;
    const res = (await getClassKnowledgePointMasteryApi({
      class_id: props.classId,
      subject: knowledgeSubject.value,
      knowledge_point: trimPoint,
      n: String(queryExamN.value)
    })) as any;
    if (res?.code === 200 && res.data) {
      const bizData = res.data;
      knowledgeSummary.value = bizData;
      knowledgeExamList.value = bizData.exams ?? [];
      if (knowledgeExamList.value.length === 0) {
        message.info('该知识点暂无有效考试统计数据');
      } else {
        message.success('查询成功');
      }
    } else {
      message.warning(res?.msg || '未获取到知识点数据');
      knowledgeSummary.value = null;
      knowledgeExamList.value = [];
    }
  } catch (err: any) {
    console.error('知识点接口异常', err);
    message.error('请求知识点数据异常');
    knowledgeSummary.value = null;
    knowledgeExamList.value = [];
  } finally {
    knowledgeLoading.value = false;
  }
};
// classId变更清空知识点模块
watch(()=>props.classId, ()=>{
  clearKnowledgeFilter();
})
// 初始化
onMounted(() => {
  fetchSubjectRateData();
});
// 监听 classId 变化
watch(() => props.classId, () => {
  if (props.classId) {
    fetchSubjectRateData();
  }
});
// 处理数据并更新表格
const processStudentRateData = (classData: any) => {
  const studentOneLineRate = classData.student_one_line_rate || {};
  // 构建学生数据映射表
  const studentMap = new Map<string, any>();
  // 收集所有科目并构建动态列
  const subjectColumns: any[] = [];
  Object.entries(studentOneLineRate).forEach(([subject, students]: [string, any]) => {
    if (Array.isArray(students)) {
      // 添加科目列（支持排序）—— 标题统一转为中文
      const subjectName = subjectMap[subject] || subject;
      subjectColumns.push({
        title: subjectName,
        dataIndex: subject,
        width: 100,
        align: 'center',
      });
      // 将每个学生的该科目过线率添加到学生数据中
      students.forEach((student: any) => {
        if (!studentMap.has(student.uid)) {
          // 姓名优先用接口返回的 name，缺失时从学生列表映射表查找
          const name = student.name || studentNameMap.value.get(String(student.uid)) || '-';
          if (name === '-') {
            console.warn('[学生过线率] 未能解析学生姓名:', student.uid);
          }
          studentMap.set(student.uid, {
            uid: student.uid,
            name: name,
            key: student.uid
          });
        }
        const studentData = studentMap.get(student.uid);
        if (studentData) {
          studentData[subject] = student.rate;
        }
      });
    }
  });
  // 更新表格列（基础列 + 科目列）
  studentRateColumns.value = [
    { title: '学生姓名', dataIndex: 'name', width: 120, fixed: 'left', align: 'center' },
    { title: '学号', dataIndex: 'uid', width: 120, fixed: 'left', align: 'center', customRender: ({ text }: any) => maskStudentId(text) },
    ...subjectColumns
  ];
  // 更新可用科目列表
  availableSubjects.value = subjectColumns.map(col => ({
    value: col.dataIndex,
    label: col.title
  }));
  // 转换为数组
  studentRateList.value = Array.from(studentMap.values());
};
// 获取学生过线率数据
const fetchSubjectRateData = async (silent = false) => {
  if (!props.classId) return;
  try {
    loading.value = true;
    // 1. 先请求过线率数据，拿到学生 uid 列表
    const res = await postClassAlwaysTopBottomStudents({
      class_ids: [props.classId],
    }, {
      errorHandler: (error: any) => {
        return error;
      },
      getResponse: true,
    });
    const responseData = res.data || res;
    const httpStatus = res.response?.status || res.status;
    let classData: any = null;
    if (httpStatus === 200 && responseData.code === 200 && responseData.data) {
      // 判断 data 是数组还是对象
      if (Array.isArray(responseData.data) && responseData.data.length > 0) {
        classData = responseData.data[0];
      } else if (typeof responseData.data === 'object' && responseData.data.student_one_line_rate) {
        // data 是对象而非数组，直接使用
        classData = responseData.data;
      } else {
        message.info('暂无数据');
        studentRateList.value = [];
        return;
      }
    } else {
      message.warning(responseData.message || '获取数据失败');
      studentRateList.value = [];
      return;
    }
    // 2. 依次补齐姓名（先花名册，再用批量接口补漏），避免与过线率数据并行导致的竞态
    await fetchStudentNames(props.classId);
    await fillMissingStudentNames(classData);
    // 3. 姓名映射就绪后再渲染
    processStudentRateData(classData);
    if (!silent) message.success('数据加载成功');
  } catch (err: any) {
    console.error('请求异常:', err);
    message.error('请求数据失败');
    studentRateList.value = [];
  } finally {
    loading.value = false;
  }
};
// 暴露方法给父组件
defineExpose({
  refresh: () => {
    fetchSubjectRateData(true);
    clearKnowledgeFilter();
  },
});
</script>
<style scoped lang="less">
.class-analysis-container {
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  min-height: 100vh;
  box-sizing: border-box;
}
.section {
  margin-bottom: 20px;
}
.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 4px solid #1890ff;
}
.rate-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background: #ffffff;
  :deep(.ant-card-body) {
    padding: 16px;
  }
}
.search-container {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  :deep(.ant-select-selector),
  :deep(.ant-input) {
    border-radius: 4px;
  }
  :deep(.ant-btn) {
    border-radius: 4px;
  }
}
.summary-info {
  margin-bottom: 16px;
  padding: 20px 24px;
  background: #fafafa;
  border-radius: 8px;
  .summary-wrap {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    gap: 100px;
    flex-wrap: wrap;
  }
  .summary-item {
    text-align: left;
    min-width: 130px;
  }
  .summary-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
    line-height: 1;
  }
  .summary-value {
    font-size: 24px;
    font-weight: 500;
    line-height: 1;
  }
}
.empty-tip{
  text-align:center;
  padding:24px;
  color:#888;
}
/* 表格样式优化 */
:deep(.ant-table-thead > tr > th) {
  background: linear-gradient(180deg, #f0f5ff 0%, #e6f0ff 100%);
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #d6e4ff;
  text-align: center;
  font-size: 16px;
}
:deep(.ant-table-tbody > tr > td) {
  text-align: center;
  font-size: 16px;
  padding: 12px 8px;
}
:deep(.ant-table-tbody > tr:hover) {
  background-color: #f0f8ff;
}
:deep(.ant-table) {
  min-width: 100%;
}
:deep(.ant-table-bordered .ant-table-thead > tr > th) {
  border-right: 1px solid #d6e4ff;
}
:deep(.ant-table-bordered .ant-table-tbody > tr > td) {
  border-right: 1px solid #f0f0f0;
}
/* 过线率颜色样式 */
.normal-rate {
  color: #333;
  font-weight: 500;
}
.mid-rate {
  color: #fa8c16; /* 橙色 */
  font-weight: bold;
}
.low-rate {
  color: #f5222d; /* 红色 */
  font-weight: bold;
}
/* 响应式设计 */
@media (max-width: 768px) {
  .class-analysis-container {
    padding: 10px;
  }
  .search-container {
    :deep(.ant-space) {
      display: flex;
      flex-wrap: wrap;
    }
    :deep(.ant-space-item) {
      margin-bottom: 8px;
      width: 100%;
    }
    :deep(.ant-select),
    :deep(.ant-auto-complete) {
      width: 100% !important;
    }
  }
}
</style>

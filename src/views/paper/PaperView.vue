<template>
  <div class="paper-view-page">
    <section class="page-shell">
      <div class="page-header">
        <div>
          <h2>试卷查看</h2>
          <p>集中浏览试卷资料，支持按考试、科目和试卷名称快速筛选。</p>
        </div>
        <div class="header-stat">
          <span class="stat-value">{{ pagination.total }}</span>
          <span class="stat-label">份试卷</span>
        </div>
      </div>

      <a-card class="filter-card" :bordered="false">
        <a-space wrap class="filter-actions">
          <a-select
            v-model:value="filters.student_grade"
            :options="gradeOptions"
            placeholder="按年级筛选"
            allow-clear
            class="filter-control"
          />
          <a-select
            v-model:value="filters.subject"
            :options="availableSubjectOptions"
            placeholder="按科目筛选"
            allow-clear
            class="filter-control filter-control-sm"
          />
          <a-select
            v-model:value="filters.name"
            :options="paperNameOptions"
            placeholder="按试卷筛选"
            allow-clear
            show-search
            option-filter-prop="label"
            class="filter-input"
          />
          <a-button type="primary" @click="loadPapers(true)">查询</a-button>
          <a-button @click="resetFilters">重置</a-button>
        </a-space>
      </a-card>

      <a-card class="list-card" :bordered="false">
        <template #title>
          <div class="list-title">
            <span>试卷列表</span>
            <small>点击操作栏可预览 PDF</small>
          </div>
        </template>

        <a-table
          :columns="paperColumns"
          :data-source="paperList"
          :loading="loadingPapers"
          :pagination="false"
          row-key="id"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'status'">
              <a-tag :color="statusColor(record.status)">
                {{ record.status || 'unknown' }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button type="link" class="pdf-link" @click.stop="openPdfPreview(record)">
                查看 PDF
              </a-button>
            </template>
          </template>
        </a-table>

        <div class="pagination-wrap">
          <a-pagination
            :current="pagination.page"
            :page-size="pagination.size"
            :total="pagination.total"
            :show-size-changer="true"
            :show-total="(total: number) => `共 ${total} 条`"
            @change="handlePageChange"
            @showSizeChange="handleSizeChange"
          />
        </div>
      </a-card>
    </section>

    <a-modal
      v-model:open="pdfPreviewOpen"
      title="试卷PDF预览"
      :footer="null"
      width="92%"
      destroy-on-close
    >
      <iframe v-if="pdfPreviewUrl" :src="pdfPreviewUrl" class="pdf-frame"></iframe>
    </a-modal>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { message } from "ant-design-vue";
import router from "@/router";
import {
  getStudentTestPaper,
  getTestPaper as getTestPaperApi,
  getTestPaperQuestion,
  getTestPaperQuestionScore as getTestPaperQuestionScoreApi,
} from "@/servers/api/tp";
import {
  getClassQuestionStat as getTestPaperClassQuestionStatApi,
  getClassQuestionWrongStudents as getTestPaperClassQuestionWrongStudentsApi,
  getTeacherWrongQuestionRecommend as getTeacherWrongQuestionRecommendApi,
  getTeacherWrongQuestionSearch as searchTeacherWrongQuestionApi,
} from "@/servers/api/wrongQuestion";
import { useUserStore } from "@/store";

type PaperItem = {
  id: number;
  exam_id: number;
  exam_name?: string;
  exam_student_grade?: string;
  name: string;
  subject?: string;
  status?: string;
  file_path?: string;
  create_time?: string;
  [key: string]: any;
};

type QuestionItem = {
  id?: number;
  string_number?: string;
  correct_rate?: number;
  keywords?: string[] | string;
  answer?: string;
  images?: string[] | string;
  [key: string]: any;
};

type QuestionScoreRecord = {
  student_id?: string;
  student_name?: string;
  class_id?: string | number;
  score_detail?: any;
  [key: string]: any;
};

type ClassQuestionStatRecord = {
  id?: number;
  question_key?: string;
  wrong_rate?: number;
  wrong_count?: number;
  participant_count?: number;
  avg_score?: number;
  [key: string]: any;
};

type WrongStudentRecord = {
  id?: number;
  student_id?: string;
  student_name?: string;
  score?: number;
  full_score?: number;
  [key: string]: any;
};

type WrongQuestionSearchRecord = {
  class_id?: string;
  question_key?: string;
  question_id?: number;
  string_number?: string;
  question_type?: string;
  knowledge_points?: string[];
  wrong_rate?: number;
  wrong_count?: number;
  participant_count?: number;
  answer?: string;
  full_score?: number;
  [key: string]: any;
};

type ScoreMap = Record<string, number | string>;

const userStore = useUserStore();
const userInfo = ref<any>(null);
const loadingPapers = ref(false);
const loadingQuestions = ref(false);
const paperList = ref<PaperItem[]>([]);
const allPaperOptions = ref<PaperItem[]>([]);
const questionList = ref<QuestionItem[]>([]);
const selectedPaper = ref<PaperItem | null>(null);
const examOptions = ref<{ label: string; value: number }[]>([]);
const pdfPreviewOpen = ref(false);
const pdfPreviewUrl = ref("");
const loadingQuestionScores = ref(false);
const questionScoreRecords = ref<QuestionScoreRecord[]>([]);
const studentQuestionScoreMap = ref<ScoreMap>({});
const teacherScoreMode = ref<"class_avg" | "student">("class_avg");
const teacherSelectedClassId = ref<string>();
const teacherSelectedStudentId = ref<string>();
const loadingClassQuestionStats = ref(false);
const classQuestionStatRecords = ref<ClassQuestionStatRecord[]>([]);
const wrongStudentsModalOpen = ref(false);
const wrongStudentsModalTitle = ref("错题学生列表");
const loadingWrongStudents = ref(false);
const wrongStudentList = ref<WrongStudentRecord[]>([]);
const wrongStudentsQuery = reactive<{
  class_id?: string;
  question_key?: string;
}>({
  class_id: undefined,
  question_key: undefined,
});
const wrongStudentsPagination = reactive({
  page: 1,
  size: 20,
  total: 0,
});
const loadingWrongQuestionSearch = ref(false);
const wrongQuestionSearchList = ref<WrongQuestionSearchRecord[]>([]);
const wrongQuestionSearchPagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});
const wrongQuestionSearchFilters = reactive<{
  question_type?: string;
  knowledge_keyword?: string;
  class_id?: string;
  student_id?: string;
}>({
  question_type: undefined,
  knowledge_keyword: "",
  class_id: undefined,
  student_id: undefined,
});
const wrongQuestionTypeOptions = ref<{ label: string; value: string }[]>([]);
const wrongQuestionRecommendKnowledge = ref<{ name: string; count: number }[]>([]);

const filters = reactive<{
  student_grade?: string;
  subject?: string;
  name?: string;
}>({
  student_grade: undefined,
  subject: undefined,
  name: undefined,
});

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0,
});
const getTestPaperFileUrl = (path: string) => `/api/tp/file?path=${encodeURIComponent(path || "")}`;
const getStudentTestPaperApi = (student_uid: string, params: Record<string, any>) =>
  getStudentTestPaper({ student_uid, ...params });
const getTestPaperQuestionsApi = (test_paper_id: number) =>
  getTestPaperQuestion({ test_paper_id });

const isTeacher = computed(() => Boolean(userInfo.value?.teacher));
const examNameMap = computed(() => {
  const map = new Map<number, string>();
  for (const option of examOptions.value) {
    map.set(Number(option.value), option.label);
  }
  return map;
});

const subjectOptions = [
  { label: "语文", value: "语文" },
  { label: "数学", value: "数学" },
  { label: "英语", value: "英语" },
  { label: "物理", value: "物理" },
  { label: "化学", value: "化学" },
  { label: "生物", value: "生物" },
  { label: "政治", value: "政治" },
  { label: "历史", value: "历史" },
  { label: "地理", value: "地理" },
];

const getPaperGrade = (paper: PaperItem) =>
  String(paper.exam_student_grade || paper.student_grade || "").trim();

const sortLabelOptions = <T extends { label: string }>(options: T[]) =>
  options.sort((a, b) => b.label.localeCompare(a.label, "zh-Hans-CN", { numeric: true }));

const gradeOptions = computed(() => {
  const gradeMap = new Map<string, string>();
  for (const paper of allPaperOptions.value) {
    const grade = getPaperGrade(paper);
    if (grade) gradeMap.set(grade, grade);
  }
  return sortLabelOptions(Array.from(gradeMap.values()).map((grade) => ({ label: grade, value: grade })));
});

const availableSubjectOptions = computed(() => {
  const subjectMap = new Map<string, string>();
  for (const paper of allPaperOptions.value) {
    if (filters.student_grade && getPaperGrade(paper) !== filters.student_grade) continue;
    const subject = String(paper.subject || "").trim();
    if (subject) subjectMap.set(subject, subject);
  }
  const dynamicOptions = Array.from(subjectMap.values()).map((subject) => ({
    label: subject,
    value: subject,
  }));
  return dynamicOptions.length ? sortLabelOptions(dynamicOptions) : subjectOptions;
});

const paperNameOptions = computed(() => {
  const nameMap = new Map<string, string>();
  for (const paper of allPaperOptions.value) {
    if (filters.student_grade && getPaperGrade(paper) !== filters.student_grade) continue;
    if (filters.subject && paper.subject !== filters.subject) continue;
    const name = String(paper.name || "").trim();
    if (name) nameMap.set(name, name);
  }
  return sortLabelOptions(Array.from(nameMap.values()).map((name) => ({ label: name, value: name })));
});

const paperColumns = [
  { title: "试卷ID", dataIndex: "id", width: 92 },
  { title: "试卷名称", dataIndex: "name", ellipsis: true },
  { title: "考试", dataIndex: "exam_name", ellipsis: true },
  { title: "年级", dataIndex: "exam_student_grade", width: 110 },
  { title: "科目", dataIndex: "subject", width: 90 },
  { title: "状态", dataIndex: "status", width: 100 },
  { title: "创建时间", dataIndex: "create_time", width: 170 },
  { title: "操作", key: "action", width: 90 },
];

const wrongStudentColumns = [
  { title: "学号", dataIndex: "student_id", width: 150 },
  { title: "姓名", dataIndex: "student_name", width: 150 },
  { title: "得分", dataIndex: "score", width: 100 },
  { title: "题目满分", dataIndex: "full_score", width: 120 },
];

const wrongQuestionSearchColumns = [
  { title: "班级", dataIndex: "class_id", width: 120 },
  { title: "题号", dataIndex: "string_number", width: 100 },
  { title: "题型", dataIndex: "question_type", width: 140 },
  { title: "知识点", dataIndex: "knowledge_points", ellipsis: true },
  { title: "错误率", dataIndex: "wrong_rate", key: "wrong_rate", width: 120 },
  { title: "错题人数", dataIndex: "wrong_count", key: "wrong_count", width: 120 },
  { title: "满分", dataIndex: "full_score", width: 90 },
];

const studentUid = computed(() => String(userInfo.value?.role || ""));

const teacherClassOptions = computed(() => {
  const classMap = new Map<string, string>();
  for (const item of questionScoreRecords.value) {
    const classId = String(item.class_id ?? "").trim();
    if (!classId) continue;
    if (!classMap.has(classId)) {
      classMap.set(classId, `班级 ${classId}`);
    }
  }
  return Array.from(classMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => Number(a.value) - Number(b.value));
});

const teacherStudentOptions = computed(() => {
  const classId = String(teacherSelectedClassId.value ?? "").trim();
  if (!classId) return [];
  const students = questionScoreRecords.value.filter(
    (item) => String(item.class_id ?? "").trim() === classId
  );
  const studentMap = new Map<string, string>();
  for (const item of students) {
    const studentId = String(item.student_id ?? "").trim();
    if (!studentId) continue;
    const studentName = String(item.student_name ?? "").trim();
    const label = studentName ? `${studentName}(${studentId})` : studentId;
    studentMap.set(studentId, label);
  }
  return Array.from(studentMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.value.localeCompare(b.value));
});

const wrongSearchStudentOptions = computed(() => {
  const classId = String(wrongQuestionSearchFilters.class_id ?? "").trim();
  const students = classId
    ? questionScoreRecords.value.filter(
        (item) => String(item.class_id ?? "").trim() === classId
      )
    : questionScoreRecords.value;
  const studentMap = new Map<string, string>();
  for (const item of students) {
    const studentId = String(item.student_id ?? "").trim();
    if (!studentId) continue;
    const studentName = String(item.student_name ?? "").trim();
    const label = studentName ? `${studentName}(${studentId})` : studentId;
    studentMap.set(studentId, label);
  }
  return Array.from(studentMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.value.localeCompare(b.value));
});

const scoreLabel = computed(() => {
  if (!isTeacher.value) return "小题分";
  return teacherScoreMode.value === "student" ? "小题分(学生)" : "小题分(班均)";
});

const classQuestionStatMap = computed<Record<string, ClassQuestionStatRecord>>(() => {
  const map: Record<string, ClassQuestionStatRecord> = {};
  for (const item of classQuestionStatRecords.value) {
    const key = normalizeQuestionKey(item.question_key);
    if (!key) continue;
    map[key] = item;
  }
  return map;
});

const classAverageScoreMap = computed<ScoreMap>(() => {
  const scoreMap: ScoreMap = {};
  for (const [questionKey, item] of Object.entries(classQuestionStatMap.value)) {
    if (typeof item.avg_score === "number" && Number.isFinite(item.avg_score)) {
      scoreMap[questionKey] = Number(item.avg_score.toFixed(2));
    }
  }
  return scoreMap;
});

const normalizeStringArray = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch (error) {
      return [text];
    }
    return [text];
  }
  return [];
};

const normalizeQuestionKey = (value: any) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const match = text.match(/\d+/);
  if (match) return String(Number(match[0]));
  return text;
};

const parseScoreValue = (value: any): number | string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value).trim();
  if (!text || text.toLowerCase() === "nan") return null;
  const parsed = Number(text);
  if (!Number.isNaN(parsed)) return parsed;
  return text;
};

const normalizeScoreDetail = (scoreDetail: any): ScoreMap => {
  let detail = scoreDetail;
  if (typeof detail === "string") {
    const text = detail.trim();
    if (!text) return {};
    try {
      detail = JSON.parse(text);
    } catch (error) {
      return {};
    }
  }

  const scoreMap: ScoreMap = {};
  const mergeEntry = (obj: Record<string, any>) => {
    for (const [key, value] of Object.entries(obj || {})) {
      const questionKey = normalizeQuestionKey(key);
      if (!questionKey) continue;
      const parsedValue = parseScoreValue(value);
      if (parsedValue === null) continue;
      scoreMap[questionKey] = parsedValue;
    }
  };

  if (Array.isArray(detail)) {
    for (const item of detail) {
      if (item && typeof item === "object" && !Array.isArray(item)) {
        mergeEntry(item as Record<string, any>);
      }
    }
    return scoreMap;
  }

  if (detail && typeof detail === "object") {
    mergeEntry(detail as Record<string, any>);
  }
  return scoreMap;
};

const buildAverageScoreMap = (records: QuestionScoreRecord[]): ScoreMap => {
  const sumMap: Record<string, number> = {};
  const countMap: Record<string, number> = {};
  for (const record of records) {
    const detailMap = normalizeScoreDetail(record.score_detail);
    for (const [questionKey, score] of Object.entries(detailMap)) {
      if (typeof score !== "number" || !Number.isFinite(score)) continue;
      sumMap[questionKey] = (sumMap[questionKey] || 0) + score;
      countMap[questionKey] = (countMap[questionKey] || 0) + 1;
    }
  }

  const result: ScoreMap = {};
  for (const questionKey of Object.keys(sumMap)) {
    const count = countMap[questionKey] || 0;
    if (!count) continue;
    const average = sumMap[questionKey] / count;
    result[questionKey] = Number(average.toFixed(2));
  }
  return result;
};

const statusColor = (status?: string) => {
  switch (status) {
    case "success":
      return "green";
    case "processing":
      return "blue";
    case "fail":
      return "red";
    default:
      return "default";
  }
};

const displayedQuestionScoreMap = computed<ScoreMap>(() => {
  if (!selectedPaper.value) return {};

  if (!isTeacher.value) {
    return studentQuestionScoreMap.value;
  }

  const classId = String(teacherSelectedClassId.value ?? "").trim();
  if (!classId) return {};
  const classRecords = questionScoreRecords.value.filter(
    (item) => String(item.class_id ?? "").trim() === classId
  );
  if (!classRecords.length) return {};

  if (teacherScoreMode.value === "student") {
    const studentId = String(teacherSelectedStudentId.value ?? "").trim();
    if (!studentId) return {};
    const studentRecord = classRecords.find(
      (item) => String(item.student_id ?? "").trim() === studentId
    );
    return studentRecord ? normalizeScoreDetail(studentRecord.score_detail) : {};
  }

  if (Object.keys(classAverageScoreMap.value).length) {
    return classAverageScoreMap.value;
  }

  return buildAverageScoreMap(classRecords);
});

const getQuestionDisplayKey = (question: QuestionItem, index: number) => {
  return normalizeQuestionKey(question.string_number || index + 1);
};

const formatScore = (value: number | string | undefined) => {
  if (value === undefined) return "-";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return String(value);
    return String(Number(value.toFixed(2)));
  }
  return String(value);
};

const getQuestionScoreDisplay = (question: QuestionItem, index: number) => {
  const key = getQuestionDisplayKey(question, index);
  if (!key) return "-";
  return formatScore(displayedQuestionScoreMap.value[key]);
};

const getQuestionClassStat = (question: QuestionItem, index: number) => {
  const key = getQuestionDisplayKey(question, index);
  if (!key) return undefined;
  return classQuestionStatMap.value[key];
};

const getQuestionWrongRateDisplay = (question: QuestionItem, index: number) => {
  const stat = getQuestionClassStat(question, index);
  const wrongRate = Number(stat?.wrong_rate);
  if (Number.isFinite(wrongRate)) {
    return `${(wrongRate * 100).toFixed(1)}%`;
  }
  return "-";
};

const getQuestionWrongCountDisplay = (question: QuestionItem, index: number) => {
  const stat = getQuestionClassStat(question, index);
  const wrongCount = Number(stat?.wrong_count);
  const participantCount = Number(stat?.participant_count);
  if (Number.isFinite(wrongCount) && Number.isFinite(participantCount)) {
    return `${wrongCount}/${participantCount}`;
  }
  return "-";
};

const formatPercent = (value: any) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  return `${(numberValue * 100).toFixed(1)}%`;
};

const formatKnowledgePoints = (value: any) => {
  const list = normalizeStringArray(value);
  if (!list.length) return "-";
  return list.join("、");
};

const canOpenWrongStudents = (question: QuestionItem, index: number) => {
  if (!isTeacher.value) return false;
  if (!selectedPaper.value?.id || !selectedPaper.value?.exam_id) return false;
  const classId = String(teacherSelectedClassId.value ?? "").trim();
  if (!classId) return false;
  const key = getQuestionDisplayKey(question, index);
  if (!key) return false;
  const stat = getQuestionClassStat(question, index);
  return Number(stat?.wrong_count) > 0;
};

const loadClassQuestionStats = async (refresh = false) => {
  classQuestionStatRecords.value = [];
  if (!isTeacher.value) return;
  if (!selectedPaper.value?.id || !selectedPaper.value?.exam_id) return;
  const classId = String(teacherSelectedClassId.value ?? "").trim();
  if (!classId) return;

  loadingClassQuestionStats.value = true;
  try {
    const res = await getTestPaperClassQuestionStatApi({
      exam_id: Number(selectedPaper.value.exam_id),
      test_paper_id: Number(selectedPaper.value.id),
      class_id: classId,
      refresh: refresh ? "1" : undefined,
    });
    if (res.code !== 200) {
      message.error("班级题目统计加载失败");
      return;
    }
    classQuestionStatRecords.value = Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    message.error("班级题目统计加载失败");
  } finally {
    loadingClassQuestionStats.value = false;
  }
};

const loadWrongStudents = async () => {
  if (!selectedPaper.value?.id || !selectedPaper.value?.exam_id) return;
  const classId = String(
    wrongStudentsQuery.class_id ?? teacherSelectedClassId.value ?? ""
  ).trim();
  const questionKey = String(wrongStudentsQuery.question_key ?? "").trim();
  if (!classId || !questionKey) return;

  loadingWrongStudents.value = true;
  try {
    const res = await getTestPaperClassQuestionWrongStudentsApi({
      page: wrongStudentsPagination.page,
      size: wrongStudentsPagination.size,
      exam_id: Number(selectedPaper.value.exam_id),
      test_paper_id: Number(selectedPaper.value.id),
      class_id: classId,
      question_key: questionKey,
    });
    if (res.code !== 200) {
      message.error("错题学生列表加载失败");
      return;
    }
    wrongStudentList.value = Array.isArray(res.data) ? res.data : [];
    wrongStudentsPagination.total = Number(res.total || 0);
  } catch (error) {
    message.error("错题学生列表加载失败");
  } finally {
    loadingWrongStudents.value = false;
  }
};

const openWrongStudentsModalByKey = async (
  questionKey: string,
  classId: string,
  title: string
) => {
  const normalizedQuestionKey = normalizeQuestionKey(questionKey);
  const classIdText = String(classId || "").trim();
  if (!normalizedQuestionKey || !classIdText) return;
  wrongStudentsQuery.question_key = normalizedQuestionKey;
  wrongStudentsQuery.class_id = classIdText;
  wrongStudentsPagination.page = 1;
  wrongStudentsModalTitle.value = title;
  wrongStudentsModalOpen.value = true;
  await loadWrongStudents();
};

const openWrongStudentsModal = async (question: QuestionItem, index: number) => {
  if (!canOpenWrongStudents(question, index)) return;
  const questionKey = getQuestionDisplayKey(question, index);
  const classId = String(teacherSelectedClassId.value ?? "").trim();
  await openWrongStudentsModalByKey(
    questionKey,
    classId,
    `第${question.string_number || index + 1}题 错题学生`
  );
};

const handleWrongStudentsPageChange = async (page: number) => {
  wrongStudentsPagination.page = page;
  await loadWrongStudents();
};

const handleWrongStudentsSizeChange = async (_current: number, size: number) => {
  wrongStudentsPagination.size = size;
  wrongStudentsPagination.page = 1;
  await loadWrongStudents();
};

const loadWrongQuestionRecommend = async () => {
  wrongQuestionRecommendKnowledge.value = [];
  if (!selectedPaper.value?.id || !selectedPaper.value?.exam_id) return;

  const classId = String(
    wrongQuestionSearchFilters.class_id ?? teacherSelectedClassId.value ?? ""
  ).trim();
  const studentId = String(wrongQuestionSearchFilters.student_id ?? "").trim();
  if (!classId && !studentId) return;

  try {
    const res = await getTeacherWrongQuestionRecommendApi({
      exam_id: Number(selectedPaper.value.exam_id),
      test_paper_id: Number(selectedPaper.value.id),
      class_id: classId || undefined,
      student_id: studentId || undefined,
      question_type: String(wrongQuestionSearchFilters.question_type || "").trim() || undefined,
      knowledge_keyword:
        String(wrongQuestionSearchFilters.knowledge_keyword || "").trim() || undefined,
      limit: 12,
    });
    if (res.code !== 200) return;
    const data = res.data || {};
    const knowledgeList = Array.isArray(data.knowledge_points) ? data.knowledge_points : [];
    const questionTypeList = Array.isArray(data.question_types) ? data.question_types : [];
    wrongQuestionRecommendKnowledge.value = knowledgeList;
    wrongQuestionTypeOptions.value = questionTypeList
      .map((item: any) => {
        const name = String(item?.name || "").trim();
        if (!name) return null;
        return { label: name, value: name };
      })
      .filter(Boolean) as { label: string; value: string }[];
  } catch (error) {
    // do nothing, recommendation failure should not block search
  }
};

const loadWrongQuestionSearch = async (resetPage = false) => {
  if (resetPage) {
    wrongQuestionSearchPagination.page = 1;
  }
  wrongQuestionSearchList.value = [];
  if (!selectedPaper.value?.id || !selectedPaper.value?.exam_id) return;

  const classId = String(
    wrongQuestionSearchFilters.class_id ?? teacherSelectedClassId.value ?? ""
  ).trim();
  const studentId = String(wrongQuestionSearchFilters.student_id ?? "").trim();
  if (!classId && !studentId) return;

  loadingWrongQuestionSearch.value = true;
  try {
    const res = await searchTeacherWrongQuestionApi({
      page: wrongQuestionSearchPagination.page,
      size: wrongQuestionSearchPagination.size,
      exam_id: Number(selectedPaper.value.exam_id),
      test_paper_id: Number(selectedPaper.value.id),
      class_id: classId || undefined,
      student_id: studentId || undefined,
      question_type: String(wrongQuestionSearchFilters.question_type || "").trim() || undefined,
      knowledge_keyword:
        String(wrongQuestionSearchFilters.knowledge_keyword || "").trim() || undefined,
    });
    if (res.code !== 200) {
      message.error("错题搜索失败");
      return;
    }
    wrongQuestionSearchList.value = Array.isArray(res.data) ? res.data : [];
    wrongQuestionSearchPagination.total = Number(res.total || 0);

    const typeMap = new Map<string, string>();
    for (const item of wrongQuestionSearchList.value) {
      const questionType = String(item.question_type || "").trim();
      if (questionType) {
        typeMap.set(questionType, questionType);
      }
    }
    if (typeMap.size) {
      const fromResult = Array.from(typeMap.keys()).map((item) => ({
        label: item,
        value: item,
      }));
      const merged = new Map<string, { label: string; value: string }>();
      for (const option of [...wrongQuestionTypeOptions.value, ...fromResult]) {
        merged.set(option.value, option);
      }
      wrongQuestionTypeOptions.value = Array.from(merged.values());
    }
  } catch (error) {
    message.error("错题搜索失败");
  } finally {
    loadingWrongQuestionSearch.value = false;
  }
};

const handleWrongQuestionSearchPageChange = async (page: number) => {
  wrongQuestionSearchPagination.page = page;
  await loadWrongQuestionSearch(false);
};

const handleWrongQuestionSearchSizeChange = async (_current: number, size: number) => {
  wrongQuestionSearchPagination.size = size;
  wrongQuestionSearchPagination.page = 1;
  await loadWrongQuestionSearch(false);
};

const triggerWrongQuestionSearch = async () => {
  await loadWrongQuestionSearch(true);
  await loadWrongQuestionRecommend();
};

const useRecommendKnowledge = async (name: string) => {
  wrongQuestionSearchFilters.knowledge_keyword = name;
  await triggerWrongQuestionSearch();
};

const resetWrongQuestionSearchFilters = async () => {
  wrongQuestionSearchFilters.question_type = undefined;
  wrongQuestionSearchFilters.knowledge_keyword = "";
  wrongQuestionSearchFilters.student_id = undefined;
  wrongQuestionSearchPagination.page = 1;
  await triggerWrongQuestionSearch();
};

const openWrongStudentsFromSearch = async (record: WrongQuestionSearchRecord) => {
  const questionKey = normalizeQuestionKey(record.question_key || record.string_number);
  const classId = String(record.class_id || "").trim();
  if (!questionKey || !classId) return;
  await openWrongStudentsModalByKey(
    questionKey,
    classId,
    `第${record.string_number || questionKey}题 错题学生`
  );
};

const resetQuestionScoreState = () => {
  questionScoreRecords.value = [];
  studentQuestionScoreMap.value = {};
  classQuestionStatRecords.value = [];
  wrongQuestionSearchList.value = [];
  wrongQuestionTypeOptions.value = [];
  wrongQuestionRecommendKnowledge.value = [];
  teacherSelectedClassId.value = undefined;
  teacherSelectedStudentId.value = undefined;
  wrongQuestionSearchFilters.class_id = undefined;
  wrongQuestionSearchFilters.student_id = undefined;
  wrongQuestionSearchFilters.question_type = undefined;
  wrongQuestionSearchFilters.knowledge_keyword = "";
  wrongQuestionSearchPagination.page = 1;
  wrongQuestionSearchPagination.total = 0;
  wrongStudentsModalOpen.value = false;
  wrongStudentList.value = [];
  wrongStudentsQuery.class_id = undefined;
  wrongStudentsQuery.question_key = undefined;
  wrongStudentsPagination.page = 1;
  wrongStudentsPagination.total = 0;
};

const loadQuestionScores = async (paper: PaperItem) => {
  resetQuestionScoreState();
  if (!paper?.id || !paper?.exam_id) return;

  loadingQuestionScores.value = true;
  try {
    if (isTeacher.value) {
      const res = await getTestPaperQuestionScoreApi({
        exam_id: Number(paper.exam_id),
        test_paper_id: Number(paper.id),
      });
      if (res.code !== 200) {
        message.error("小题分加载失败");
        return;
      }
      questionScoreRecords.value = Array.isArray(res.data) ? res.data : [];
      return;
    }

    if (!studentUid.value) return;
    const res = await getTestPaperQuestionScoreApi({
      exam_id: Number(paper.exam_id),
      test_paper_id: Number(paper.id),
      student_id: studentUid.value,
    });
    if (res.code !== 200) {
      message.error("小题分加载失败");
      return;
    }
    const records = Array.isArray(res.data) ? res.data : [];
    if (records.length) {
      studentQuestionScoreMap.value = normalizeScoreDetail(records[0].score_detail);
    }
  } catch (error) {
    message.error("小题分加载失败");
  } finally {
    loadingQuestionScores.value = false;
  }
};

const loadPaperDetail = async (paper: PaperItem) => {
  await Promise.all([loadQuestions(Number(paper.id)), loadQuestionScores(paper)]);
};

watch(
  teacherClassOptions,
  (options) => {
    if (!isTeacher.value) return;
    if (!options.length) {
      teacherSelectedClassId.value = undefined;
      teacherSelectedStudentId.value = undefined;
      wrongQuestionSearchFilters.class_id = undefined;
      wrongQuestionSearchFilters.student_id = undefined;
      return;
    }

    const currentClass = String(teacherSelectedClassId.value ?? "");
    if (!options.some((item) => item.value === currentClass)) {
      teacherSelectedClassId.value = options[0].value;
    }
    const searchClass = String(wrongQuestionSearchFilters.class_id ?? "");
    if (!options.some((item) => item.value === searchClass)) {
      wrongQuestionSearchFilters.class_id = options[0].value;
      wrongQuestionSearchFilters.student_id = undefined;
    }
  },
  { immediate: true }
);

watch(
  teacherStudentOptions,
  (options) => {
    if (!isTeacher.value) return;
    if (teacherScoreMode.value !== "student") return;
    if (!options.length) {
      teacherSelectedStudentId.value = undefined;
      return;
    }

    const currentStudent = String(teacherSelectedStudentId.value ?? "");
    if (!options.some((item) => item.value === currentStudent)) {
      teacherSelectedStudentId.value = options[0].value;
    }
  },
  { immediate: true }
);

watch(
  wrongSearchStudentOptions,
  (options) => {
    if (!isTeacher.value) return;
    const currentStudent = String(wrongQuestionSearchFilters.student_id ?? "");
    if (!options.length) {
      wrongQuestionSearchFilters.student_id = undefined;
      return;
    }
    if (currentStudent && !options.some((item) => item.value === currentStudent)) {
      wrongQuestionSearchFilters.student_id = undefined;
    }
  },
  { immediate: true }
);

watch(teacherScoreMode, (mode) => {
  if (mode !== "student") return;
  if (!teacherStudentOptions.value.length) {
    teacherSelectedStudentId.value = undefined;
    return;
  }
  const currentStudent = String(teacherSelectedStudentId.value ?? "");
  if (!teacherStudentOptions.value.some((item) => item.value === currentStudent)) {
    teacherSelectedStudentId.value = teacherStudentOptions.value[0].value;
  }
});

watch(
  () => wrongQuestionSearchFilters.class_id,
  () => {
    wrongQuestionSearchFilters.student_id = undefined;
  }
);

watch(
  [
    () => selectedPaper.value?.id,
    () => selectedPaper.value?.exam_id,
    teacherSelectedClassId,
  ],
  async () => {
    if (!isTeacher.value) return;
    await loadClassQuestionStats(false);
    wrongQuestionSearchFilters.class_id = String(teacherSelectedClassId.value ?? "").trim() || undefined;
    if (!selectedPaper.value?.id || !selectedPaper.value?.exam_id) {
      wrongQuestionSearchList.value = [];
      wrongQuestionRecommendKnowledge.value = [];
      return;
    }
  }
);

const loadFilterOptions = async () => {
  if (!isTeacher.value && !studentUid.value) return;
  const response = isTeacher.value
    ? await getTestPaperApi({ page: 1, size: 1000 })
    : await getStudentTestPaperApi(studentUid.value, {
    page: 1,
    size: 1000,
  });
  if (response.code !== 200) return;

  allPaperOptions.value = (response.data || []).map((item: any) => ({
    ...item,
    exam_name: item.exam_name || `考试${item.exam_id}`,
  }));

  const examMap = new Map<number, string>();
  for (const paper of allPaperOptions.value) {
    const examId = Number(paper.exam_id);
    if (!Number.isFinite(examId)) continue;
    examMap.set(examId, paper.exam_name || String(examId));
  }
  examOptions.value = Array.from(examMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => b.value - a.value);
};

const buildQueryParams = () => {
  const params: Record<string, any> = {
    page: pagination.page,
    size: pagination.size,
  };
  if (filters.student_grade) params.student_grade = filters.student_grade;
  if (filters.subject) params.subject = filters.subject;
  if (filters.name) params.name = filters.name;
  return params;
};

const loadPapers = async (resetPage = false) => {
  if (resetPage) {
    pagination.page = 1;
  }

  loadingPapers.value = true;
  try {
    const params = buildQueryParams();
    const res = isTeacher.value
      ? await getTestPaperApi(params)
      : await getStudentTestPaperApi(studentUid.value, params);

    if (res.code !== 200) {
      message.error("试卷列表加载失败");
      return;
    }

    paperList.value = (res.data || []).map((item: any) => ({
      ...item,
      exam_name:
        item.exam_name || examNameMap.value.get(Number(item.exam_id)) || `考试${item.exam_id}`,
    }));
    pagination.total = Number(res.total || 0);

    if (!paperList.value.length) {
      selectedPaper.value = null;
      questionList.value = [];
      resetQuestionScoreState();
      return;
    }

    selectedPaper.value = null;
    questionList.value = [];
    resetQuestionScoreState();
  } catch (error) {
    message.error("试卷列表加载失败");
  } finally {
    loadingPapers.value = false;
  }
};

const loadQuestions = async (paperId: number) => {
  loadingQuestions.value = true;
  try {
    const res = await getTestPaperQuestionsApi(Number(paperId));
    if (res.code !== 200) {
      message.error("题目加载失败");
      questionList.value = [];
      return;
    }
    questionList.value = Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    message.error("题目加载失败");
    questionList.value = [];
  } finally {
    loadingQuestions.value = false;
  }
};

const selectPaper = async (paper: PaperItem) => {
  selectedPaper.value = paper;
  await loadPaperDetail(paper);
};

const onPaperRow = (record: PaperItem) => ({
  onClick: () => selectPaper(record),
});

const rowClassName = (record: PaperItem) => {
  if (!selectedPaper.value) return "";
  return Number(record.id) === Number(selectedPaper.value.id) ? "selected-row" : "";
};

const openPdfPreview = (paper: PaperItem) => {
  if (!paper.file_path) {
    message.warning("该试卷暂无PDF路径");
    return;
  }
  pdfPreviewUrl.value = getTestPaperFileUrl(paper.file_path);
  pdfPreviewOpen.value = true;
};

const handlePageChange = async (page: number) => {
  pagination.page = page;
  await loadPapers(false);
};

const handleSizeChange = async (_current: number, size: number) => {
  pagination.size = size;
  pagination.page = 1;
  await loadPapers(false);
};

const resetFilters = async () => {
  filters.student_grade = undefined;
  filters.subject = undefined;
  filters.name = undefined;
  pagination.page = 1;
  await loadPapers(false);
};

watch(
  () => filters.student_grade,
  () => {
    filters.subject = undefined;
    filters.name = undefined;
  }
);

watch(
  () => filters.subject,
  () => {
    filters.name = undefined;
  }
);

onMounted(async () => {
  userInfo.value = userStore.getUserInfo();
  if (!userInfo.value || !userInfo.value.role) {
    message.error("请先登录");
    return;
  }

  if (!userInfo.value.teacher) {
    router.replace("/student_paper_view");
    return;
  }

  await loadFilterOptions();
  await loadPapers(true);
});
</script>

<style scoped lang="less">
.paper-view-page {
  min-height: 100vh;
  padding: 24px;
  background: #f6f8fb;
}

.page-shell {
  max-width: 1280px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
  margin-bottom: 18px;

  h2 {
    margin: 0 0 8px;
    color: #172033;
    font-size: 28px;
    font-weight: 700;
  }

  p {
    margin: 0;
    color: #667085;
    font-size: 14px;
  }
}

.header-stat {
  min-width: 118px;
  padding: 12px 16px;
  border: 1px solid #d9e5f2;
  border-radius: 8px;
  background: #ffffff;
  text-align: right;
  box-shadow: 0 8px 24px rgba(24, 39, 75, 0.06);
}

.stat-value {
  display: block;
  color: #0f766e;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  display: block;
  margin-top: 6px;
  color: #667085;
  font-size: 13px;
}

.filter-card,
.list-card {
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(24, 39, 75, 0.07);
}

.filter-card {
  margin-bottom: 16px;
  border-top: 3px solid #f59e0b;
}

.filter-actions {
  width: 100%;
}

.filter-control {
  width: 240px;
}

.filter-control-sm {
  width: 180px;
}

.filter-input {
  width: 260px;
}

.list-card {
  min-height: 640px;
  border-top: 3px solid #2563eb;
}

.list-title {
  display: flex;
  align-items: baseline;
  gap: 10px;

  span {
    color: #172033;
    font-size: 17px;
    font-weight: 700;
  }

  small {
    color: #8a94a6;
    font-weight: 400;
  }
}

.pdf-link {
  padding: 0;
  font-weight: 600;
}

.pagination-wrap {
  margin-top: 16px;
  text-align: right;
}

.pdf-frame {
  width: 100%;
  height: 76vh;
  border: none;
}

:deep(.ant-table-thead > tr > th) {
  color: #475467;
  font-weight: 700;
  background: #f8fafc;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f2f8ff;
}

@media (max-width: 768px) {
  .paper-view-page {
    padding: 16px;
  }

  .page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .header-stat {
    text-align: left;
  }

  .filter-control,
  .filter-control-sm,
  .filter-input {
    width: 100%;
  }
}
</style>

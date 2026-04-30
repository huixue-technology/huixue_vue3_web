<template>
  <div class="student-paper-page">
    <section class="page-shell">
      <header class="hero-section">
        <div>
          <h2>我的试卷</h2>
          <p>按考试、科目或名称查找试卷，直接打开 PDF 预览。</p>
        </div>
        <div class="hero-stat">
          <span>{{ pagination.total }}</span>
          <small>份可查看试卷</small>
        </div>
      </header>

      <a-card class="filter-card" :bordered="false">
        <a-space wrap class="filter-actions">
          <a-select
            v-model:value="filters.student_grade"
            :options="gradeOptions"
            allow-clear
            placeholder="按年级筛选"
            class="filter-control"
          />
          <a-select
            v-model:value="filters.subject"
            :options="availableSubjectOptions"
            allow-clear
            placeholder="按科目筛选"
            class="filter-control filter-control-sm"
          />
          <a-select
            v-model:value="filters.name"
            :options="paperNameOptions"
            allow-clear
            show-search
            option-filter-prop="label"
            placeholder="按试卷筛选"
            class="filter-input"
          />
          <a-button type="primary" @click="loadPapers(true)">查询</a-button>
          <a-button @click="resetFilters">重置</a-button>
        </a-space>
      </a-card>

      <a-card class="paper-list-card" :bordered="false">
        <template #title>
          <div class="list-title">
            <span>试卷列表</span>
            <small>共 {{ pagination.total }} 份</small>
          </div>
        </template>

        <a-spin :spinning="loadingPapers">
          <div v-if="paperList.length" class="paper-grid">
            <article v-for="paper in paperList" :key="paper.id" class="paper-card">
              <div class="paper-card-head">
                <div>
                  <div class="paper-title">{{ paper.name || `试卷${paper.id}` }}</div>
                  <div class="paper-sub">{{ paper.exam_name || `考试${paper.exam_id}` }}</div>
                </div>
                <a-tag :color="statusColor(paper.status)">{{ paper.status || "unknown" }}</a-tag>
              </div>
              <div class="paper-meta-row">
                <a-tag color="blue">{{ paper.subject || "-" }}</a-tag>
                <a-tag color="green">{{ paper.exam_student_grade || "-" }}</a-tag>
                <span>试卷 ID：{{ paper.id }}</span>
              </div>
              <div class="paper-footer">
                <span>{{ paper.create_time || "-" }}</span>
                <a-button type="primary" size="small" @click="openPdfPreview(paper)">查看 PDF</a-button>
              </div>
            </article>
          </div>
          <a-empty v-else description="暂无可查看试卷" />
        </a-spin>

        <div class="pager-wrap">
          <a-pagination
            :current="pagination.page"
            :page-size="pagination.size"
            :total="pagination.total"
            :show-size-changer="false"
            :show-total="(total: number) => `共 ${total} 份`"
            @change="handlePageChange"
          />
        </div>
      </a-card>
    </section>

    <a-modal
      v-model:open="pdfPreviewOpen"
      title="试卷 PDF 预览"
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
import {
  getStudentTestPaper,
  getTestPaperQuestion,
  getTestPaperQuestionScore as getTestPaperQuestionScoreApi,
} from "@/servers/api/tp";
import {
  getStudentWrongQuestionRecommend as getStudentWrongQuestionRecommendApi,
  getStudentWrongQuestionSearch as searchStudentWrongQuestionApi,
} from "@/servers/api/wrongQuestion";
import { useUserStore } from "@/store";
import router from "@/router";

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
  score?: number | string;
  images?: string[] | string;
  [key: string]: any;
};

type QuestionScoreRecord = {
  student_id?: string;
  score_detail?: any;
  [key: string]: any;
};

type WrongQuestionSearchRecord = {
  class_id?: string;
  question_key?: string;
  question_id?: number;
  string_number?: string;
  question_type?: string;
  knowledge_points?: string[];
  student_score?: number;
  full_score?: number;
  wrong_rate?: number;
  wrong_count?: number;
  participant_count?: number;
  [key: string]: any;
};

type ScoreMap = Record<string, number | string>;

const userStore = useUserStore();
const userInfo = ref<any>(null);
const loadingPapers = ref(false);
const loadingQuestions = ref(false);
const loadingQuestionScores = ref(false);
const paperList = ref<PaperItem[]>([]);
const allPaperOptions = ref<PaperItem[]>([]);
const questionList = ref<QuestionItem[]>([]);
const selectedPaper = ref<PaperItem | null>(null);
const studentQuestionScoreMap = ref<ScoreMap>({});
const examOptions = ref<{ label: string; value: number }[]>([]);
const showOnlyWrong = ref(false);
const pdfPreviewOpen = ref(false);
const pdfPreviewUrl = ref("");
const loadingWrongQuestionSearch = ref(false);
const wrongQuestionSearchList = ref<WrongQuestionSearchRecord[]>([]);
const wrongQuestionSearchPagination = reactive({
  page: 1,
  size: 8,
  total: 0,
});
const wrongQuestionSearchFilters = reactive<{
  question_type?: string;
  knowledge_keyword?: string;
}>({
  question_type: undefined,
  knowledge_keyword: "",
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
  size: 9,
  total: 0,
});
const getTestPaperFileUrl = (path: string) => `/api/tp/file?path=${encodeURIComponent(path || "")}`;
const getStudentTestPaperApi = (student_uid: string, params: Record<string, any>) =>
  getStudentTestPaper({ student_uid, ...params });
const getTestPaperQuestionsApi = (test_paper_id: number) =>
  getTestPaperQuestion({ test_paper_id });

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

const wrongQuestionSearchColumns = [
  { title: "题号", dataIndex: "string_number", width: 90 },
  { title: "题型", dataIndex: "question_type", width: 130 },
  { title: "知识点", dataIndex: "knowledge_points", ellipsis: true },
  { title: "我的得分", dataIndex: "student_score", width: 100 },
  { title: "题目满分", dataIndex: "full_score", width: 100 },
  { title: "班级错误率", dataIndex: "wrong_rate", width: 120 },
  { title: "班级错题人数", dataIndex: "wrong_count", key: "wrong_count", width: 120 },
];

const studentUid = computed(() => {
  const uid = String(userInfo.value?.student?.uid || "").trim();
  if (uid) return uid;
  return String(userInfo.value?.role || "").trim();
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
    } catch (_error) {
      return [text];
    }
    return [text];
  }
  return [];
};

const getQuestionContent = (question: QuestionItem) => {
  const keys = ["question", "question_text", "content", "stem", "title", "text", "description"];
  for (const key of keys) {
    const value = question?.[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
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
    } catch (_error) {
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

const getQuestionDisplayKey = (question: QuestionItem, index: number) => {
  return normalizeQuestionKey(question.string_number || index + 1);
};

const parseNumberValue = (value: any): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").trim();
  if (!text) return null;
  const matched = text.match(/-?\d+(?:\.\d+)?/);
  if (!matched) return null;
  const parsed = Number(matched[0]);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const formatScore = (value: number | string | null | undefined) => {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return String(value);
    return String(Number(value.toFixed(2)));
  }
  return String(value);
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

const getQuestionOwnScore = (question: QuestionItem, index: number) => {
  const key = getQuestionDisplayKey(question, index);
  if (!key) return undefined;
  return studentQuestionScoreMap.value[key];
};

const getQuestionTotalScore = (question: QuestionItem) => {
  return parseScoreValue(question.score);
};

const isWrongQuestion = (question: QuestionItem, index: number) => {
  const ownScore = parseNumberValue(getQuestionOwnScore(question, index));
  const totalScore = parseNumberValue(getQuestionTotalScore(question));
  if (totalScore === null) return false;
  if (ownScore === null) return true;
  return ownScore < totalScore - 1e-6;
};

const wrongQuestionCount = computed(() => {
  return questionList.value.reduce((count, question, index) => {
    return isWrongQuestion(question, index) ? count + 1 : count;
  }, 0);
});

const displayQuestionList = computed(() => {
  if (!showOnlyWrong.value) return questionList.value;
  return questionList.value.filter((question, index) => isWrongQuestion(question, index));
});

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const renderMarkdown = (rawValue: string) => {
  const escaped = escapeHtml(String(rawValue || ""));
  return escaped
    .replace(/^######\s+(.+)$/gm, "<h6>$1</h6>")
    .replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>")
    .replace(/^####\s+(.+)$/gm, "<h4>$1</h4>")
    .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    )
    .replace(/\n/g, "<br/>");
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

const loadExamOptions = async () => {
  if (!studentUid.value) return;
  const response = await getStudentTestPaperApi(studentUid.value, { page: 1, size: 1000 });
  if (response.code !== 200) return;

  allPaperOptions.value = (response.data || []).map((item: any) => ({
    ...item,
    exam_name: item.exam_name || `考试${item.exam_id}`,
  }));

  const examMap = new Map<number, string>();
  for (const paper of allPaperOptions.value) {
    const examId = Number(paper.exam_id);
    if (!Number.isFinite(examId)) continue;
    examMap.set(examId, paper.exam_name || `考试${examId}`);
  }
  examOptions.value = Array.from(examMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => b.value - a.value);
};

const loadQuestionScores = async (paper: PaperItem) => {
  studentQuestionScoreMap.value = {};
  if (!paper?.id || !paper?.exam_id || !studentUid.value) return;

  loadingQuestionScores.value = true;
  try {
    const response = await getTestPaperQuestionScoreApi({
      exam_id: Number(paper.exam_id),
      test_paper_id: Number(paper.id),
      student_id: studentUid.value,
    });
    if (response.code !== 200) {
      message.error("小题得分加载失败");
      return;
    }
    const records = Array.isArray(response.data) ? (response.data as QuestionScoreRecord[]) : [];
    if (records.length) {
      studentQuestionScoreMap.value = normalizeScoreDetail(records[0].score_detail);
    }
  } catch (_error) {
    message.error("小题得分加载失败");
  } finally {
    loadingQuestionScores.value = false;
  }
};

const loadQuestions = async (paperId: number) => {
  loadingQuestions.value = true;
  try {
    const response = await getTestPaperQuestionsApi(paperId);
    if (response.code !== 200) {
      message.error("题目加载失败");
      questionList.value = [];
      return;
    }
    questionList.value = Array.isArray(response.data) ? response.data : [];
  } catch (_error) {
    message.error("题目加载失败");
    questionList.value = [];
  } finally {
    loadingQuestions.value = false;
  }
};

const loadWrongQuestionRecommend = async () => {
  wrongQuestionRecommendKnowledge.value = [];
  wrongQuestionTypeOptions.value = [];
  if (!studentUid.value || !selectedPaper.value?.id || !selectedPaper.value?.exam_id) return;

  try {
    const response = await getStudentWrongQuestionRecommendApi({
      student_uid: studentUid.value,
      exam_id: Number(selectedPaper.value.exam_id),
      test_paper_id: Number(selectedPaper.value.id),
      question_type: String(wrongQuestionSearchFilters.question_type || "").trim() || undefined,
      knowledge_keyword:
        String(wrongQuestionSearchFilters.knowledge_keyword || "").trim() || undefined,
      limit: 12,
    });
    if (response.code !== 200) return;
    const data = response.data || {};
    const knowledgeList = Array.isArray(data.knowledge_points) ? data.knowledge_points : [];
    const typeList = Array.isArray(data.question_types) ? data.question_types : [];
    wrongQuestionRecommendKnowledge.value = knowledgeList;
    wrongQuestionTypeOptions.value = typeList
      .map((item: any) => {
        const name = String(item?.name || "").trim();
        if (!name) return null;
        return { label: name, value: name };
      })
      .filter(Boolean) as { label: string; value: string }[];
  } catch (_error) {
    // ignore recommend failures
  }
};

const loadWrongQuestionSearch = async (resetPage = false) => {
  if (resetPage) {
    wrongQuestionSearchPagination.page = 1;
  }
  wrongQuestionSearchList.value = [];
  if (!studentUid.value || !selectedPaper.value?.id || !selectedPaper.value?.exam_id) return;

  loadingWrongQuestionSearch.value = true;
  try {
    const response = await searchStudentWrongQuestionApi({
      student_uid: studentUid.value,
      page: wrongQuestionSearchPagination.page,
      size: wrongQuestionSearchPagination.size,
      exam_id: Number(selectedPaper.value.exam_id),
      test_paper_id: Number(selectedPaper.value.id),
      question_type: String(wrongQuestionSearchFilters.question_type || "").trim() || undefined,
      knowledge_keyword:
        String(wrongQuestionSearchFilters.knowledge_keyword || "").trim() || undefined,
    });
    if (response.code !== 200) {
      message.error("错题搜索失败");
      return;
    }
    wrongQuestionSearchList.value = Array.isArray(response.data) ? response.data : [];
    wrongQuestionSearchPagination.total = Number(response.total || 0);

    const merged = new Map<string, { label: string; value: string }>();
    for (const option of wrongQuestionTypeOptions.value) {
      merged.set(option.value, option);
    }
    for (const item of wrongQuestionSearchList.value) {
      const typeValue = String(item.question_type || "").trim();
      if (typeValue && !merged.has(typeValue)) {
        merged.set(typeValue, { label: typeValue, value: typeValue });
      }
    }
    wrongQuestionTypeOptions.value = Array.from(merged.values());
  } catch (_error) {
    message.error("错题搜索失败");
  } finally {
    loadingWrongQuestionSearch.value = false;
  }
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
  wrongQuestionSearchPagination.page = 1;
  await triggerWrongQuestionSearch();
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

const loadPaperDetail = async (paper: PaperItem) => {
  await Promise.all([loadQuestions(Number(paper.id)), loadQuestionScores(paper)]);
};

const selectPaper = async (paper: PaperItem) => {
  selectedPaper.value = paper;
  showOnlyWrong.value = false;
  await loadPaperDetail(paper);
};

const loadPapers = async (resetPage = false) => {
  if (!studentUid.value) return;
  if (resetPage) pagination.page = 1;

  loadingPapers.value = true;
  try {
    const response = await getStudentTestPaperApi(studentUid.value, buildQueryParams());
    if (response.code !== 200) {
      message.error(response.msg || "试卷列表加载失败");
      return;
    }

    paperList.value = (response.data || []).map((item: any) => ({
      ...item,
      exam_name: item.exam_name || `考试${item.exam_id}`,
    }));
    pagination.total = Number(response.total || 0);

    if (!paperList.value.length) {
      selectedPaper.value = null;
      questionList.value = [];
      studentQuestionScoreMap.value = {};
      wrongQuestionSearchList.value = [];
      wrongQuestionRecommendKnowledge.value = [];
      wrongQuestionTypeOptions.value = [];
      wrongQuestionSearchPagination.total = 0;
      return;
    }

    selectedPaper.value = null;
    questionList.value = [];
    studentQuestionScoreMap.value = {};
    wrongQuestionSearchList.value = [];
    wrongQuestionRecommendKnowledge.value = [];
    wrongQuestionTypeOptions.value = [];
    wrongQuestionSearchPagination.total = 0;
  } catch (_error) {
    message.error("试卷列表加载失败");
  } finally {
    loadingPapers.value = false;
  }
};

const openPdfPreview = (paper: PaperItem) => {
  if (!paper.file_path) {
    message.warning("该试卷暂无 PDF 路径");
    return;
  }
  pdfPreviewUrl.value = getTestPaperFileUrl(paper.file_path);
  pdfPreviewOpen.value = true;
};

const handlePageChange = async (page: number) => {
  pagination.page = page;
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

  if (userInfo.value.teacher) {
    message.info("老师账号请使用老师试卷查看页面");
    router.replace("/paper_view");
    return;
  }

  if (!studentUid.value) {
    message.error("未识别到学生身份");
    return;
  }

  await loadExamOptions();
  await loadPapers(true);
});
</script>

<style scoped lang="less">
.student-paper-page {
  min-height: 100vh;
  padding: 24px;
  background: #f6f8fb;
}

.page-shell {
  max-width: 1180px;
  margin: 0 auto;
}

.hero-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
  margin-bottom: 18px;

  h2 {
    margin: 0 0 8px;
    color: #172033;
    font-size: 30px;
    font-weight: 700;
  }

  p {
    margin: 0;
    color: #667085;
    font-size: 14px;
  }
}

.hero-stat {
  min-width: 148px;
  padding: 12px 16px;
  border: 1px solid #d9e5f2;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(24, 39, 75, 0.06);
  text-align: right;

  span {
    display: block;
    color: #0f766e;
    font-size: 30px;
    font-weight: 700;
    line-height: 1;
  }

  small {
    display: block;
    margin-top: 6px;
    color: #667085;
  }
}

.filter-card,
.paper-list-card {
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
  width: 220px;
}

.filter-control-sm {
  width: 170px;
}

.filter-input {
  width: 260px;
}

.paper-list-card {
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

.paper-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.paper-card {
  display: flex;
  min-height: 174px;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid #d9e5f2;
  border-left: 4px solid #0f766e;
  border-radius: 8px;
  padding: 16px;
  background: #ffffff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.paper-card:hover {
  transform: translateY(-2px);
  border-color: #9cc7ff;
  box-shadow: 0 12px 26px rgba(24, 39, 75, 0.1);
}

.paper-card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.paper-title {
  display: -webkit-box;
  min-height: 44px;
  margin-bottom: 6px;
  overflow: hidden;
  color: #172033;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.paper-sub {
  color: #667085;
  font-size: 13px;
}

.paper-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 16px 0 12px;
  color: #667085;
  font-size: 13px;
}

.paper-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  color: #8a94a6;
  font-size: 12px;
}

.pager-wrap {
  margin-top: 18px;
  text-align: right;
}

.pdf-frame {
  width: 100%;
  height: 76vh;
  border: none;
}

@media (max-width: 768px) {
  .student-paper-page {
    padding: 16px;
  }

  .hero-section {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-stat {
    text-align: left;
  }

  .filter-control,
  .filter-control-sm,
  .filter-input {
    width: 100%;
  }

  .paper-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

<template>
  <div class="student-paper-page">
    <section class="hero-section">
      <h2>我的试卷查看</h2>
      <p>上方选择试卷，下方直接查看题目、得分和参考答案。</p>
    </section>

    <a-card class="paper-list-card" :bordered="false">
      <template #title>试卷列表</template>
      <template #extra>
        <a-space wrap>
          <a-select
            v-model:value="filters.exam_id"
            :options="examOptions"
            allow-clear
            placeholder="按考试筛选"
            style="width: 200px"
          />
          <a-select
            v-model:value="filters.subject"
            :options="subjectOptions"
            allow-clear
            placeholder="按科目筛选"
            style="width: 160px"
          />
          <a-input
            v-model:value="filters.name"
            allow-clear
            placeholder="按试卷名称筛选"
            style="width: 220px"
            @pressEnter="loadPapers(true)"
          />
          <a-button type="primary" @click="loadPapers(true)">查询</a-button>
          <a-button @click="resetFilters">重置</a-button>
        </a-space>
      </template>

      <a-spin :spinning="loadingPapers">
        <div v-if="paperList.length" class="paper-grid">
          <article
            v-for="paper in paperList"
            :key="paper.id"
            class="paper-card"
            :class="{ selected: Number(selectedPaper?.id) === Number(paper.id) }"
            @click="selectPaper(paper)"
          >
            <div class="paper-title">{{ paper.name || `试卷${paper.id}` }}</div>
            <div class="paper-sub">{{ paper.exam_name || `考试${paper.exam_id}` }}</div>
            <div class="paper-meta-row">
              <a-tag color="blue">{{ paper.subject || "-" }}</a-tag>
              <a-tag :color="statusColor(paper.status)">{{ paper.status || "unknown" }}</a-tag>
            </div>
            <div class="paper-time">{{ paper.create_time || "-" }}</div>
            <a-button type="link" size="small" @click.stop="openPdfPreview(paper)">查看 PDF</a-button>
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

    <a-card class="question-card" :bordered="false">
      <template #title>
        <span>
          题目查看
          <template v-if="selectedPaper"> · {{ selectedPaper.name }}</template>
        </span>
      </template>
      <template #extra>
        <a-space>
          <a-button :type="showOnlyWrong ? 'primary' : 'default'" @click="showOnlyWrong = !showOnlyWrong">
            {{ showOnlyWrong ? "查看全部题目" : "只看错题" }}
          </a-button>
          <a-button v-if="selectedPaper" @click="openPdfPreview(selectedPaper)">打开试卷 PDF</a-button>
        </a-space>
      </template>

      <div v-if="!selectedPaper" class="empty-wrap">
        <a-empty description="请先在上方选择一份试卷" />
      </div>

      <a-spin v-else :spinning="loadingQuestions || loadingQuestionScores" tip="题目加载中...">
        <div class="paper-brief">
          <span>考试：{{ selectedPaper.exam_name || selectedPaper.exam_id }}</span>
          <span>科目：{{ selectedPaper.subject || "-" }}</span>
          <span>错题数：{{ wrongQuestionCount }}</span>
        </div>

        <div v-if="!displayQuestionList.length" class="empty-wrap">
          <a-empty :description="showOnlyWrong ? '当前试卷暂无错题' : '当前试卷暂无题目'" />
        </div>

        <div v-else class="question-list">
          <article
            v-for="(question, index) in displayQuestionList"
            :key="question.id || `${question.string_number}-${index}`"
            class="question-item"
          >
            <header class="question-head">
              <div class="question-left">
                <div class="question-index">第 {{ question.string_number || index + 1 }} 题</div>
                <div class="question-meta">
                  <span class="meta-rate">正确率：{{ question.correct_rate ?? "-" }}</span>
                  <div v-if="normalizeStringArray(question.keywords).length" class="keyword-wrap">
                    <a-tag
                      v-for="keyword in normalizeStringArray(question.keywords)"
                      :key="keyword"
                      color="cyan"
                    >
                      {{ keyword }}
                    </a-tag>
                  </div>
                </div>
              </div>

              <div class="score-pill">
                <span class="score-label">得分</span>
                <span class="score-value">{{ formatScore(getQuestionOwnScore(question, index)) }}</span>
                <span class="score-divider">/</span>
                <span class="score-total">{{ formatScore(getQuestionTotalScore(question)) }}</span>
              </div>
            </header>

            <section
              v-if="getQuestionContent(question) || normalizeStringArray(question.images).length"
              class="question-panel"
            >
              <h4>题目</h4>
              <div
                v-if="getQuestionContent(question)"
                class="question-content"
                v-html="renderMarkdown(getQuestionContent(question))"
              ></div>
              <div v-if="normalizeStringArray(question.images).length" class="image-wrap">
                <a-image
                  v-for="(img, imgIndex) in normalizeStringArray(question.images)"
                  :key="`${question.id}-${imgIndex}`"
                  :src="getTestPaperFileUrl(img)"
                  :preview="true"
                  width="460px"
                  class="question-image"
                />
              </div>
            </section>

            <section v-if="question.answer" class="answer-panel">
              <h4>参考答案</h4>
              <div class="answer-markdown" v-html="renderMarkdown(question.answer)"></div>
            </section>
          </article>
        </div>

        <div v-if="false && selectedPaper" class="wrong-search-wrap">
          <a-divider />
          <div class="wrong-search-title">我的错题搜索</div>
          <a-space wrap class="wrong-search-filters">
            <a-select
              v-model:value="wrongQuestionSearchFilters.question_type"
              :options="wrongQuestionTypeOptions"
              placeholder="题型筛选"
              style="width: 180px"
              allow-clear
            />
            <a-input
              v-model:value="wrongQuestionSearchFilters.knowledge_keyword"
              placeholder="按知识点模糊搜索"
              style="width: 260px"
              allow-clear
              @pressEnter="triggerWrongQuestionSearch"
            />
            <a-button type="primary" @click="triggerWrongQuestionSearch">搜索</a-button>
            <a-button @click="resetWrongQuestionSearchFilters">重置</a-button>
          </a-space>

          <div v-if="wrongQuestionRecommendKnowledge.length" class="knowledge-recommend">
            <span class="knowledge-recommend-label">推荐知识点：</span>
            <a-tag
              v-for="item in wrongQuestionRecommendKnowledge"
              :key="item.name"
              class="recommend-tag"
              color="processing"
              @click="useRecommendKnowledge(item.name)"
            >
              {{ item.name }} ({{ item.count }})
            </a-tag>
          </div>

          <a-table
            :columns="wrongQuestionSearchColumns"
            :data-source="wrongQuestionSearchList"
            :loading="loadingWrongQuestionSearch"
            :pagination="false"
            :row-key="(row) => `${row.class_id}-${row.question_key}`"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'knowledge_points'">
                {{ formatKnowledgePoints(record.knowledge_points) }}
              </template>
              <template v-else-if="column.dataIndex === 'wrong_rate'">
                {{ formatPercent(record.wrong_rate) }}
              </template>
              <template v-else-if="column.key === 'wrong_count'">
                {{ Number(record.wrong_count || 0) }}/{{ Number(record.participant_count || 0) }}
              </template>
            </template>
          </a-table>
          <div class="pager-wrap">
            <a-pagination
              :current="wrongQuestionSearchPagination.page"
              :page-size="wrongQuestionSearchPagination.size"
              :total="wrongQuestionSearchPagination.total"
              :show-size-changer="true"
              :show-total="(total: number) => `共 ${total} 条`"
              @change="handleWrongQuestionSearchPageChange"
              @showSizeChange="handleWrongQuestionSearchSizeChange"
            />
          </div>
        </div>
      </a-spin>
    </a-card>

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
import { computed, onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import {
  getStudentWrongQuestionRecommendApi,
  getStudentTestPaperApi,
  getTestPaperFileUrl,
  getTestPaperQuestionScoreApi,
  getTestPaperQuestionsApi,
  searchStudentWrongQuestionApi,
} from "@/servers/api/testPaper";
import { useUserStore } from "@/store";
import router from "@/router";

type PaperItem = {
  id: number;
  exam_id: number;
  exam_name?: string;
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
  exam_id?: number;
  subject?: string;
  name?: string;
}>({
  exam_id: undefined,
  subject: undefined,
  name: "",
});

const pagination = reactive({
  page: 1,
  size: 9,
  total: 0,
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
  if (filters.exam_id !== undefined) params.exam_id = filters.exam_id;
  if (filters.subject) params.subject = filters.subject;
  if (filters.name && filters.name.trim()) params.name = filters.name.trim();
  return params;
};

const loadExamOptions = async () => {
  if (!studentUid.value) return;
  const response = await getStudentTestPaperApi(studentUid.value, { page: 1, size: 1000 });
  if (response.code !== 200) return;

  const examMap = new Map<number, string>();
  for (const paper of response.data || []) {
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
    const response = await getStudentWrongQuestionRecommendApi(studentUid.value, {
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
    const response = await searchStudentWrongQuestionApi(studentUid.value, {
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

    const selectedId = selectedPaper.value?.id;
    const stillExists = selectedId
      ? paperList.value.find((item) => Number(item.id) === Number(selectedId))
      : null;

    if (stillExists) {
      selectedPaper.value = stillExists;
      await loadPaperDetail(stillExists);
    } else {
      await selectPaper(paperList.value[0]);
    }
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
  filters.exam_id = undefined;
  filters.subject = undefined;
  filters.name = "";
  pagination.page = 1;
  await loadPapers(false);
};

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
  padding: 20px;
  background:
    radial-gradient(circle at top right, rgba(22, 119, 255, 0.12), transparent 36%),
    radial-gradient(circle at left 20%, rgba(64, 158, 255, 0.08), transparent 32%),
    #f4f7fd;
}

.hero-section {
  margin-bottom: 16px;

  h2 {
    margin: 0 0 6px;
    font-size: 30px;
    font-weight: 700;
    color: #183a6b;
  }

  p {
    margin: 0;
    color: #4f6484;
    font-size: 14px;
  }
}

.paper-list-card,
.question-card {
  border-radius: 14px;
  box-shadow: 0 10px 28px rgba(17, 58, 109, 0.08);
  margin-bottom: 16px;
}

.paper-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

.paper-card {
  border: 1px solid #d7e5f7;
  border-radius: 12px;
  padding: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  transition: all 0.2s ease;
  cursor: pointer;
}

.paper-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(22, 119, 255, 0.16);
}

.paper-card.selected {
  border-color: #1677ff;
  box-shadow: 0 10px 24px rgba(22, 119, 255, 0.2);
}

.paper-title {
  font-size: 16px;
  font-weight: 700;
  color: #102a4d;
  margin-bottom: 6px;
}

.paper-sub {
  color: #546b8d;
  margin-bottom: 8px;
}

.paper-meta-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.paper-time {
  color: #7c8ca8;
  font-size: 12px;
  margin-bottom: 4px;
}

.pager-wrap {
  margin-top: 14px;
  text-align: right;
}

.wrong-search-wrap {
  margin-top: 14px;
}

.wrong-search-title {
  font-size: 16px;
  font-weight: 700;
  color: #133862;
  margin-bottom: 10px;
}

.wrong-search-filters {
  margin-bottom: 10px;
}

.knowledge-recommend {
  margin-bottom: 10px;
  color: #4f6484;
}

.knowledge-recommend-label {
  margin-right: 8px;
}

.recommend-tag {
  cursor: pointer;
  user-select: none;
}

.paper-brief {
  margin-bottom: 14px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  color: #425a7e;
}

.question-list {
  display: grid;
  gap: 12px;
}

.question-item {
  border-radius: 14px;
  border: 1px solid #d8e6f9;
  background: #fff;
  padding: 18px;
  box-shadow: 0 6px 18px rgba(15, 69, 133, 0.08);
}

.question-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.question-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.question-index {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
  color: #0e2e56;
}

.question-meta {
  color: #4f6484;
  text-align: left;
}

.meta-rate {
  display: inline-block;
  margin-bottom: 6px;
  font-size: 14px;
}

.score-pill {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  border: 1px solid #bfd9ff;
  border-radius: 999px;
  padding: 6px 12px;
  background: #edf5ff;
}

.score-label {
  font-size: 12px;
  color: #4f6484;
}

.score-value,
.score-total {
  font-size: 20px;
  font-weight: 700;
  color: #0f4ea8;
}

.score-divider {
  color: #6e88ad;
  font-size: 18px;
}

.keyword-wrap {
  margin-bottom: 0;
}

.question-panel {
  border-radius: 12px;
  border: 1px solid #d7e8ff;
  background: #f6fbff;
  padding: 12px;
  margin-bottom: 12px;

  h4 {
    margin: 0 0 8px;
    color: #20446e;
    font-size: 15px;
  }
}

.question-content {
  color: #10385d;
  line-height: 1.9;
  font-size: 20px;
  word-break: break-word;
  margin-bottom: 10px;
}

.answer-panel {
  border-radius: 12px;
  border: 1px solid #d9e9ff;
  background: #f8fbff;
  padding: 12px;
  margin-bottom: 10px;

  h4 {
    margin: 0 0 8px;
    color: #20446e;
    font-size: 15px;
  }
}

.answer-markdown {
  color: #17365d;
  line-height: 1.8;
  font-size: 15px;
  word-break: break-word;
}

.answer-markdown :deep(code),
.question-content :deep(code) {
  background: #e8f0ff;
  border-radius: 4px;
  padding: 1px 4px;
}

.answer-markdown :deep(a),
.question-content :deep(a) {
  color: #1356b7;
  text-decoration: underline;
}

.image-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.question-image {
  max-width: 100%;
}

.empty-wrap {
  padding: 34px 0;
}

.pdf-frame {
  width: 100%;
  height: 76vh;
  border: none;
}

@media (max-width: 900px) {
  .question-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .question-index {
    font-size: 24px;
  }

  .question-content {
    font-size: 18px;
  }
}
</style>

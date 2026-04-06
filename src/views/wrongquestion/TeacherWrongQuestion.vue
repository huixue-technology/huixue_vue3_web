<template>
  <div class="wrong-question-page">
    <div class="page-decoration"></div>

    <div class="page-header">
      <h2>老师端错题模块</h2>
      <p>查看全量错题，支持直接预览题目图片与 Markdown 答案。</p>
    </div>

    <a-card class="filter-card glass-card">
      <a-space wrap>
        <a-input
          v-model:value="filters.class_id"
          placeholder="班级ID（可选）"
          allow-clear
          style="width: 180px"
        />
        <a-input
          v-model:value="filters.student_id"
          placeholder="学生ID（可选）"
          allow-clear
          style="width: 180px"
        />
        <a-input
          v-model:value="filters.question_type"
          placeholder="题型（可选）"
          allow-clear
          style="width: 170px"
        />
        <a-input
          v-model:value="filters.knowledge_keyword"
          placeholder="知识点关键词（可选）"
          allow-clear
          style="width: 240px"
          @pressEnter="handleSearch"
        />
        <a-button type="primary" :loading="loading" @click="handleSearch">查询错题</a-button>
        <a-button :loading="recommendLoading" @click="handleRecommend">获取推荐</a-button>
        <a-button @click="resetFilters">重置</a-button>
      </a-space>
    </a-card>

    <a-card title="推荐结果" class="recommend-card glass-card">
      <div v-if="recommendText" class="recommend-summary">{{ recommendText }}</div>
      <div v-if="recommendKnowledge.length" class="recommend-row">
        <span class="recommend-label">高频知识点：</span>
        <a-tag
          v-for="item in recommendKnowledge"
          :key="item.name"
          class="recommend-tag"
          color="processing"
          @click="useRecommendKnowledge(item.name)"
        >
          {{ item.name }} ({{ item.count }})
        </a-tag>
      </div>
      <div v-if="recommendTypes.length" class="recommend-row">
        <span class="recommend-label">高频题型：</span>
        <a-tag v-for="item in recommendTypes" :key="item.name" color="blue">
          {{ item.name }} ({{ item.count }})
        </a-tag>
      </div>
      <a-empty v-if="!recommendKnowledge.length && !recommendTypes.length" description="暂无推荐结果" />
    </a-card>

    <a-card class="glass-card list-card">
      <template #title>
        <div class="list-title">
          <span>错题列表</span>
          <span class="list-total">共 {{ Number(pagination.total || 0) }} 题</span>
        </div>
      </template>

      <a-spin :spinning="loading">
        <a-empty
          v-if="!rows.length"
          description="暂无错题数据"
        />

        <div v-else class="question-list">
          <div
            v-for="record in rows"
            :key="`${record.exam_id || ''}-${record.test_paper_id || ''}-${record.class_id || ''}-${record.question_key || record.question_id || ''}`"
            class="question-card"
          >
            <div class="question-card-head">
              <div class="left-info">
                <span class="question-number">第 {{ record.string_number || record.question_key || '-' }} 题</span>
                <a-tag color="gold" v-if="record.question_type">{{ record.question_type }}</a-tag>
                <a-tag color="cyan" v-if="record.class_id">班级 {{ record.class_id }}</a-tag>
              </div>
              <div class="right-metrics">
                <span>错率 {{ formatPercent(record.wrong_rate) }}</span>
                <span>错题人数 {{ Number(record.wrong_count || 0) }}/{{ Number(record.participant_count || 0) }}</span>
                <span>均分 {{ formatScore(record.avg_score) }}/{{ formatScore(record.full_score) }}</span>
              </div>
            </div>

            <div class="knowledge-wrap" v-if="normalizeStringArray(record.knowledge_points).length">
              <a-tag
                v-for="point in normalizeStringArray(record.knowledge_points)"
                :key="point"
                color="geekblue"
              >
                {{ point }}
              </a-tag>
            </div>

            <div class="content-grid">
              <div class="image-panel">
                <div class="panel-title">题目图片</div>
                <div v-if="normalizeStringArray(record.images).length" class="image-list">
                  <a-image
                    v-for="(img, imgIndex) in normalizeStringArray(record.images)"
                    :key="`${record.question_id || record.question_key || 'q'}-${imgIndex}`"
                    :src="getImageUrl(img)"
                    :preview="true"
                    class="question-image"
                  />
                </div>
                <a-empty v-else description="暂无题图" :image="null" />
              </div>

              <div class="answer-panel">
                <div class="panel-title">答案（Markdown）</div>
                <div
                  v-if="normalizeText(record.answer)"
                  class="markdown-body"
                  v-html="renderMarkdownLite(record.answer)"
                ></div>
                <a-empty v-else description="暂无答案" :image="null" />
              </div>
            </div>
          </div>
        </div>
      </a-spin>

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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import {
  getTeacherWrongQuestionRecommendApi,
  getTestPaperFileUrl,
  searchTeacherWrongQuestionApi,
} from "@/servers/api/testPaper";
import router from "@/router";
import { useUserStore } from "@/store";

type WrongQuestionRecord = {
  exam_id?: number;
  test_paper_id?: number;
  class_id?: string;
  question_key?: string;
  question_id?: number;
  string_number?: string;
  question_type?: string;
  knowledge_points?: string[] | string;
  answer?: string;
  images?: string[] | string;
  wrong_rate?: number;
  wrong_count?: number;
  participant_count?: number;
  avg_score?: number;
  full_score?: number;
};

type RecommendItem = {
  name: string;
  count: number;
};

const userStore = useUserStore();
const rows = ref<WrongQuestionRecord[]>([]);
const loading = ref(false);
const recommendLoading = ref(false);
const recommendKnowledge = ref<RecommendItem[]>([]);
const recommendTypes = ref<RecommendItem[]>([]);
const recommendText = ref("");

const filters = reactive<{
  class_id?: string;
  student_id?: string;
  question_type?: string;
  knowledge_keyword?: string;
}>({
  class_id: "",
  student_id: "",
  question_type: "",
  knowledge_keyword: "",
});

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

const normalizeText = (value: unknown) => String(value ?? "").trim();

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => normalizeText(item))
          .filter(Boolean);
      }
    } catch (_error) {
      // ignore parse error and fallback to raw text
    }
    return [text];
  }
  return [];
};

const formatPercent = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `${(num * 100).toFixed(1)}%`;
};

const formatScore = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(2);
};

const getImageUrl = (path: unknown) => {
  const text = normalizeText(path);
  if (!text) return "";
  if (/^(https?:)?\/\//i.test(text) || text.startsWith("data:")) {
    return text;
  }
  return getTestPaperFileUrl(text);
};

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderInlineMarkdown = (raw: string) => {
  let html = escapeHtml(raw);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return html;
};

const renderMarkdownLite = (value: unknown) => {
  const source = normalizeText(value);
  if (!source) return "";

  const markdown = source.replace(/\r\n/g, "\n");
  const codeBlocks: string[] = [];
  const withTokens = markdown.replace(/```([\s\S]*?)```/g, (_all, code) => {
    const token = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre class="md-code"><code>${escapeHtml(String(code || "").trim())}</code></pre>`);
    return token;
  });

  const lines = withTokens.split("\n");
  const htmlLines: string[] = [];
  let inList = false;

  const closeListIfNeeded = () => {
    if (inList) {
      htmlLines.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const text = String(line || "");
    const trimmed = text.trim();

    if (!trimmed) {
      closeListIfNeeded();
      htmlLines.push('<div class="md-gap"></div>');
      continue;
    }

    if (/^__CODE_BLOCK_\d+__$/.test(trimmed)) {
      closeListIfNeeded();
      htmlLines.push(trimmed);
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeListIfNeeded();
      const level = heading[1].length;
      htmlLines.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = trimmed.match(/^[-*+]\s+(.+)$/);
    if (listItem) {
      if (!inList) {
        htmlLines.push("<ul>");
        inList = true;
      }
      htmlLines.push(`<li>${renderInlineMarkdown(listItem[1])}</li>`);
      continue;
    }

    if (trimmed.startsWith(">")) {
      closeListIfNeeded();
      htmlLines.push(`<blockquote>${renderInlineMarkdown(trimmed.replace(/^>\s?/, ""))}</blockquote>`);
      continue;
    }

    closeListIfNeeded();
    htmlLines.push(`<p>${renderInlineMarkdown(trimmed)}</p>`);
  }

  closeListIfNeeded();

  let html = htmlLines.join("");
  codeBlocks.forEach((block, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, block);
  });
  return html;
};

const buildSearchParams = () => ({
  page: pagination.page,
  size: pagination.size,
  class_id: normalizeText(filters.class_id) || undefined,
  student_id: normalizeText(filters.student_id) || undefined,
  question_type: normalizeText(filters.question_type) || undefined,
  knowledge_keyword: normalizeText(filters.knowledge_keyword) || undefined,
});

const searchWrongQuestions = async (resetPage = false) => {
  if (resetPage) pagination.page = 1;

  loading.value = true;
  try {
    const res = await searchTeacherWrongQuestionApi(buildSearchParams());
    if (res.code !== 200) {
      message.error(res.msg || "查询错题失败");
      return;
    }
    rows.value = Array.isArray(res.data) ? res.data : [];
    pagination.total = Number(res.total || 0);
  } catch (_error) {
    message.error("查询错题失败");
  } finally {
    loading.value = false;
  }
};

const loadRecommend = async () => {
  recommendLoading.value = true;
  try {
    const res = await getTeacherWrongQuestionRecommendApi({
      class_id: normalizeText(filters.class_id) || undefined,
      student_id: normalizeText(filters.student_id) || undefined,
      question_type: normalizeText(filters.question_type) || undefined,
      knowledge_keyword: normalizeText(filters.knowledge_keyword) || undefined,
      limit: 12,
    });
    if (res.code !== 200) {
      message.error(res.msg || "获取推荐失败");
      return;
    }
    const data = res.data || {};
    recommendKnowledge.value = Array.isArray(data.knowledge_points) ? data.knowledge_points : [];
    recommendTypes.value = Array.isArray(data.question_types) ? data.question_types : [];
    recommendText.value = `匹配题量：${Number(data.matched_total || 0)}`;
  } catch (_error) {
    message.error("获取推荐失败");
  } finally {
    recommendLoading.value = false;
  }
};

const handleSearch = async () => {
  await searchWrongQuestions(true);
};

const handleRecommend = async () => {
  await loadRecommend();
};

const handlePageChange = async (page: number) => {
  pagination.page = page;
  await searchWrongQuestions(false);
};

const handleSizeChange = async (_current: number, size: number) => {
  pagination.size = size;
  pagination.page = 1;
  await searchWrongQuestions(false);
};

const useRecommendKnowledge = async (knowledge: string) => {
  filters.knowledge_keyword = knowledge;
  await searchWrongQuestions(true);
};

const resetFilters = () => {
  filters.class_id = "";
  filters.student_id = "";
  filters.question_type = "";
  filters.knowledge_keyword = "";
  rows.value = [];
  pagination.page = 1;
  pagination.total = 0;
  recommendKnowledge.value = [];
  recommendTypes.value = [];
  recommendText.value = "";
};

onMounted(async () => {
  const userInfo = userStore.getUserInfo();
  if (!userInfo?.teacher) {
    message.warning("当前账号不是老师，无法访问老师端错题模块");
    router.replace("/student_wrong_question");
    return;
  }
  await Promise.all([searchWrongQuestions(true), loadRecommend()]);
});
</script>

<style scoped lang="less">
.wrong-question-page {
  position: relative;
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(180deg, #f2f7ff 0%, #f8fbff 40%, #f3f7ff 100%);
}

.page-decoration {
  position: absolute;
  top: -120px;
  right: -80px;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle at 30% 30%, rgba(71, 140, 255, 0.25), rgba(71, 140, 255, 0));
  pointer-events: none;
}

.page-header {
  margin-bottom: 14px;
}

.page-header h2 {
  margin-bottom: 6px;
  color: #143a68;
}

.page-header p {
  margin: 0;
  color: #4f6480;
}

.glass-card {
  border-radius: 14px;
  border: 1px solid #e9f1ff;
  box-shadow: 0 10px 24px rgba(25, 65, 125, 0.08);
}

.filter-card,
.recommend-card {
  margin-bottom: 14px;
}

.recommend-summary {
  margin-bottom: 10px;
  color: #1d3f6e;
}

.recommend-row {
  margin-bottom: 8px;
}

.recommend-label {
  margin-right: 8px;
  color: #5b667a;
}

.recommend-tag {
  cursor: pointer;
  user-select: none;
}

.list-card {
  overflow: hidden;
}

.list-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.list-total {
  color: #4f6480;
  font-size: 13px;
  font-weight: 400;
}

.question-list {
  display: grid;
  gap: 14px;
}

.question-card {
  border: 1px solid #e6eefc;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  padding: 14px;
}

.question-card-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.left-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.question-number {
  font-weight: 600;
  color: #17375f;
}

.right-metrics {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  color: #335079;
  font-size: 13px;
}

.knowledge-wrap {
  margin-bottom: 10px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(300px, 44%) 1fr;
  gap: 12px;
}

.image-panel,
.answer-panel {
  border-radius: 10px;
  border: 1px solid #e8effb;
  background: #fff;
  padding: 12px;
}

.panel-title {
  margin-bottom: 8px;
  font-weight: 600;
  color: #1f426f;
}

.image-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

:deep(.question-image) {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f7ff;
  border: 1px solid #e8effb;
}

:deep(.question-image img) {
  width: 100%;
  height: 240px;
  object-fit: contain;
  background: #f8fbff;
}

.markdown-body {
  max-height: 440px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fbff;
  border: 1px solid #ebf1ff;
  color: #24364f;
  line-height: 1.7;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 8px 0;
  color: #143a68;
}

.markdown-body :deep(p) {
  margin: 0 0 8px;
}

.markdown-body :deep(ul) {
  margin: 0 0 8px;
  padding-left: 18px;
}

.markdown-body :deep(blockquote) {
  margin: 0 0 8px;
  padding: 6px 10px;
  border-left: 3px solid #81a7e6;
  background: #eef5ff;
  color: #294f83;
}

.markdown-body :deep(code) {
  padding: 2px 6px;
  border-radius: 4px;
  background: #e9f2ff;
  color: #255088;
}

.markdown-body :deep(.md-code) {
  margin: 0 0 8px;
  padding: 10px;
  border-radius: 8px;
  background: #10233d;
  color: #d8e9ff;
  overflow: auto;
}

.markdown-body :deep(.md-gap) {
  height: 8px;
}

.pagination-wrap {
  margin-top: 16px;
  text-align: right;
}

@media (max-width: 992px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  :deep(.question-image img) {
    height: 260px;
  }
}
</style>

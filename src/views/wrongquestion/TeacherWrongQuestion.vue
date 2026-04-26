<template>
  <div class="wrong-question-page">
    <div class="page-header">
      <h2>老师端错题模块</h2>
      <p>查看全量错题，支持直接预览题目图片与 Markdown 答案。</p>
    </div>

    <a-card class="filter-card">
      <a-space wrap>
        <a-select
          v-model:value="filters.class_id"
          placeholder="班级ID（可选）"
          allow-clear
          style="width: 180px"
          :options="classOptions"
          show-search
          :filter-option="filterOption"
          :loading="loadingClasses"
          @change="handleClassChange"
        />
        <a-select
          v-model:value="filters.student_id"
          placeholder="学生ID（可选）"
          allow-clear
          style="width: 180px"
          :options="studentOptions"
          show-search
          :filter-option="filterOption"
          :loading="loadingStudents"
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

    <a-card title="推荐结果" class="recommend-card">
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
        <a-tag
          v-for="item in recommendTypes"
          :key="item.name"
          color="blue"
          class="recommend-tag"
        >
          {{ item.name }} ({{ item.count }})
        </a-tag>
      </div>
      <a-empty v-if="!recommendKnowledge.length && !recommendTypes.length" description="暂无推荐结果" />
    </a-card>

    <a-card class="list-card">
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
import { getClassesApi } from "@/servers/api/classes";
import { getStudentApi } from "@/servers/api/student";
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

const classOptions = ref<Array<{ label: string; value: string }>>([]);
const studentOptions = ref<Array<{ label: string; value: string }>>([]);
const allStudentList = ref<any[]>([]);
const loadingClasses = ref(false);
const loadingStudents = ref(false);

const filters = reactive({
  class_id: undefined as string | undefined,
  student_id: undefined as string | undefined,
  question_type: "",
  knowledge_keyword: "",
});

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

// 获取班级列表
const fetchClassList = async () => {
  const userInfo = userStore.getUserInfo();
  if (!userInfo?.teacher) return;
  const schoolId = userInfo.teacher.school_id || "";
  if (!schoolId) return;

  loadingClasses.value = true;
  try {
    const res = await getClassesApi({ school_id: schoolId, size: 1000 });
    if (res.code === 200 && res.data) {
      let list = res.data.map((item: any) => ({
        label: item.name || `班级${item.class_id}`,
        value: String(item.class_id || item.id),
      }));

      list.sort((a, b) => {
        const na = a.label.match(/\d{4}/)?.[0] || "0";
        const nb = b.label.match(/\d{4}/)?.[0] || "0";
        const ga = na.slice(0, 2);
        const gb = nb.slice(0, 2);
        if (ga !== gb) return Number(gb) - Number(ga);
        return Number(na) - Number(nb);
      });

      classOptions.value = list;
    }
  } catch (err) {
    console.error("班级加载失败：", err);
  } finally {
    loadingClasses.value = false;
  }
};

// 预加载全部学生并缓存
const fetchAllStudent = async () => {
  try {
    const res = await getStudentApi({ size: 9999 });
    if (res.code === 200 && Array.isArray(res.data)) {
      allStudentList.value = res.data;
    }
  } catch (err) {
    console.error("学生列表加载失败：", err);
  }
};

// 只保留后四位
const maskStudentId = (uid: string | number) => {
  const str = String(uid);
  if (str.length <= 4) return str;
  return `**${str.slice(-4)}`;
};

// 切换班级 → 过滤本班学生
const handleClassChange = (classId?: string) => {
  filters.student_id = undefined;
  studentOptions.value = [];
  if (!classId) return;

  loadingStudents.value = true;
  // 根据班级ID精准过滤
  const filterStudents = allStudentList.value.filter(
    item => String(item.class_id) === String(classId)
  );

  studentOptions.value = filterStudents.map(item => ({
    label: `${item.name}（${maskStudentId(item.uid)}）`,
    value: String(item.uid),
  }));

  console.log("选中班级ID：", classId);
  console.log("过滤出学生数量：", filterStudents.length);
  loadingStudents.value = false;
};

const normalizeText = (value: unknown) => String(value ?? "").trim();

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => normalizeText(item)).filter(Boolean);
      }
    } catch {}
    return [text];
  }
  return [];
};

const formatPercent = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? `${(num * 100).toFixed(1)}%` : "-";
};

const formatScore = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

const getImageUrl = (path: unknown) => {
  const text = normalizeText(path);
  if (!text) return "";
  if (/^(https?:)?\/\//i.test(text) || text.startsWith("data:")) return text;
  return getTestPaperFileUrl(text);
};

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderInlineMarkdown = (raw: string) => {
  let html = escapeHtml(raw);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  return html;
};

const renderMarkdownLite = (value: unknown) => {
  const source = normalizeText(value);
  if (!source) return "";
  const markdown = source.replace(/\r\n/g, "\n");
  const codeBlocks: string[] = [];
  let withTokens = markdown.replace(/```([\s\S]*?)```/g, (_all, code) => {
    const t = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre class="md-code"><code>${escapeHtml(String(code).trim())}</code></pre>`);
    return t;
  });

  const lines = withTokens.split("\n");
  const htmlLines: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      htmlLines.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const trim = line.trim();
    if (!trim) {
      closeList();
      htmlLines.push('<div class="md-gap"></div>');
      continue;
    }
    if (/^__CODE_BLOCK_\d+__$/.test(trim)) {
      closeList();
      htmlLines.push(trim);
      continue;
    }
    const h = trim.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      closeList();
      htmlLines.push(`<h${h[1].length}>${renderInlineMarkdown(h[2])}</h${h[1].length}>`);
      continue;
    }
    const li = trim.match(/^[-*+]\s+(.+)$/);
    if (li) {
      if (!inList) {
        htmlLines.push("<ul>");
        inList = true;
      }
      htmlLines.push(`<li>${renderInlineMarkdown(li[1])}</li>`);
      continue;
    }
    if (trim.startsWith(">")) {
      closeList();
      htmlLines.push(`<blockquote>${renderInlineMarkdown(trim.replace(/^>\s?/, ""))}</blockquote>`);
      continue;
    }
    closeList();
    htmlLines.push(`<p>${renderInlineMarkdown(trim)}</p>`);
  }
  closeList();
  let html = htmlLines.join("");
  codeBlocks.forEach((b, i) => (html = html.replace(`__CODE_BLOCK_${i}__`, b)));
  return html;
};

const buildSearchParams = () => ({
  page: pagination.page,
  size: pagination.size,
  class_id: filters.class_id || undefined,
  student_id: filters.student_id || undefined,
  question_type: normalizeText(filters.question_type) || undefined,
  knowledge_keyword: normalizeText(filters.knowledge_keyword) || undefined,
});

const searchWrongQuestions = async (resetPage = false) => {
  if (resetPage) pagination.page = 1;
  loading.value = true;
  try {
    const res = await searchTeacherWrongQuestionApi(buildSearchParams());
    if (res.code !== 200) {
      message.error(res.msg || "查询失败");
      return;
    }
    rows.value = res.data || [];
    pagination.total = Number(res.total || 0);
  } catch {
    message.error("查询失败");
  } finally {
    loading.value = false;
  }
};

const loadRecommend = async () => {
  recommendLoading.value = true;
  try {
    const res = await getTeacherWrongQuestionRecommendApi(buildSearchParams());
    if (res.code === 200) {
      const d = res.data || {};
      recommendKnowledge.value = d.knowledge_points || [];
      recommendTypes.value = d.question_types || [];
      recommendText.value = `匹配题量：${d.matched_total || 0}`;
    }
  } catch {
    message.error("获取推荐失败");
  } finally {
    recommendLoading.value = false;
  }
};

const filterOption = (input: string, option: any) =>
  option.label.toLowerCase().includes(input.toLowerCase());

const handleSearch = async () => await searchWrongQuestions(true);
const handleRecommend = async () => await loadRecommend();

const handlePageChange = async (p: number) => {
  pagination.page = p;
  await searchWrongQuestions(false);
};

const handleSizeChange = async (_: number, s: number) => {
  pagination.size = s;
  pagination.page = 1;
  await searchWrongQuestions(false);
};

const useRecommendKnowledge = async (k: string) => {
  filters.knowledge_keyword = k;
  await searchWrongQuestions(true);
};

const resetFilters = () => {
  filters.class_id = undefined;
  filters.student_id = undefined;
  filters.question_type = "";
  filters.knowledge_keyword = "";
  studentOptions.value = [];
  rows.value = [];
  pagination.page = 1;
  pagination.total = 0;
  recommendKnowledge.value = [];
  recommendTypes.value = [];
  recommendText.value = "";
};

// 页面初始化：先班级→再全量学生→再请求数据
onMounted(async () => {
  const userInfo = userStore.getUserInfo();
  if (!userInfo?.teacher) {
    message.warning("非教师账号，无法访问");
    router.replace("/student_wrong_question");
    return;
  }
  await fetchClassList();
  await fetchAllStudent();
  await Promise.all([searchWrongQuestions(true), loadRecommend()]);
});
</script>

<style scoped lang="less">
.wrong-question-page {
  min-height: 100vh;
  padding: 20px;
  background:
    radial-gradient(circle at top right, rgba(22, 119, 255, 0.12), transparent 36%),
    radial-gradient(circle at left 20%, rgba(64, 158, 255, 0.08), transparent 32%),
    #f4f7fd;
  position: relative;
}

.wrong-question-page::before {
  content: '';
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(#f7fafc, 0.7);
  opacity: 0;
  z-index: 9;
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.wrong-question-page.loading::before {
  opacity: 1;
}

.page-header {
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

.filter-card,
.recommend-card,
.list-card {
  background: #ffffff;
  border: none;
  border-radius: 14px;
  box-shadow: 0 10px 28px rgba(17, 58, 109, 0.08);
  margin-bottom: 16px;
}

.recommend-summary {
  margin-bottom: 10px;
  color: #0f5365;
}

.recommend-row {
  margin-bottom: 8px;
}

.recommend-label {
  margin-right: 8px;
  color: #4b6d77;
}

.recommend-tag {
  cursor: pointer;
  user-select: none;
}

.list-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
}

.list-total {
  position: absolute;
  right: 0;
  color: #4b6d77;
  font-size: 13px;
  font-weight: 400;
}

.question-list {
  display: grid;
  gap: 12px;
}

.question-card {
  border-radius: 14px;
  border: 1px solid #d8e6f9;
  background: #fff;
  padding: 18px;
  box-shadow: 0 6px 18px rgba(15, 69, 133, 0.08);
  transition: all 0.3s ease;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(22, 119, 255, 0.16);
}

.question-card.selected {
  border-color: #1677ff;
  box-shadow: 0 10px 24px rgba(22, 119, 255, 0.2);
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
  color: #0f4d5a;
}

.right-metrics {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  color: #2a5f6a;
  font-size: 13px;
}

.knowledge-wrap {
  margin-bottom: 10px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.image-panel,
.answer-panel {
  border-radius: 12px;
  border: 1px solid #d7e8ff;
  background: #f6fbff;
  padding: 12px;
}

.panel-title {
  margin-bottom: 8px;
  font-weight: 600;
  color: #135463;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

:deep(.question-image) {
  max-width: 100%;
  width: 460px;
  border-radius: 8px;
  overflow: hidden;
  background: #effbff;
  border: 1px solid #e1f3f7;
}

:deep(.question-image img) {
  width: 100%;
  height: auto;
  object-fit: contain;
  background: #f6fdff;
}

.markdown-body {
  max-height: 440px;
  overflow: auto;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fbff;
  border: 1px solid #e6f5f9;
  color: #21444c;
  line-height: 1.7;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 8px 0;
  color: #0f4d5a;
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
  border-left: 3px solid #6bbcca;
  background: #ebf9fd;
  color: #226573;
}

.markdown-body :deep(code) {
  padding: 2px 6px;
  border-radius: 4px;
  background: #e6f7fb;
  color: #1f6170;
}

.markdown-body :deep(.md-code) {
  margin: 0 0 8px;
  padding: 10px;
  border-radius: 8px;
  background: #12343d;
  color: #d6f5fb;
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
  :deep(.question-image) {
    width: 100%;
  }
}
</style>
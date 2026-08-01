<template>
  <div class="wrong-question-page">
    <header class="page-header">
      <div>
        <h2>我的错题</h2>
        <p>只展示当前账号的小题得分低于满分的题目。</p>
      </div>
      <div class="header-right">
        <a-badge :count="cartCount" :overflow-count="99" :show-zero="false">
          <a-button @click="handleGoToCart">购物车</a-button>
        </a-badge>
        <a-button
          type="primary"
          :disabled="!selectedQuestionKeys.size"
          :loading="addingToCart"
          @click="handleAddToCart"
        >
          加入购物车 ({{ selectedQuestionKeys.size }})
        </a-button>
        <div class="student-badge">{{ studentName || studentUid || "学生" }}</div>
      </div>
    </header>

    <section class="filter-panel">
      <a-input v-model:value="filters.year" placeholder="年份" allow-clear @pressEnter="handleSearch" />
      <a-select
        v-model:value="filters.question_type"
        placeholder="题型"
        :options="questionTypeOptions"
        allow-clear
        show-search
        :filter-option="filterOption"
        @change="handleSearch"
      />
      <a-input v-model:value="filters.knowledge_keyword" placeholder="关键词" allow-clear @pressEnter="handleSearch" />
      <a-select
        v-model:value="filters.is_reviewed"
        placeholder="复习状态"
        :options="reviewStatusOptions"
        allow-clear
        @change="handleSearch"
      />
      <a-button type="primary" :loading="loading" @click="handleSearch">查询</a-button>
      <a-button :loading="recommendLoading" @click="loadRecommend">推荐筛选</a-button>
      <a-button @click="resetFilters">重置</a-button>
    </section>

    <section v-if="recommendKnowledge.length || recommendTypes.length" class="recommend-panel">
      <a-tag
        v-for="item in recommendKnowledge"
        :key="`k-${item.name}`"
        color="processing"
        class="click-tag"
        @click="useKnowledge(item.name)"
      >
        {{ item.name }}
      </a-tag>
      <a-tag
        v-for="item in recommendTypes"
        :key="`t-${item.name}`"
        color="blue"
        class="click-tag"
        @click="useType(item.name)"
      >
        {{ item.name }}
      </a-tag>
    </section>

    <section class="result-panel">
      <div class="result-head">
        <div class="result-head-left">
          <a-checkbox v-model:checked="selectAllQuestions" :indeterminate="selectedQuestionKeys.size > 0 && selectedQuestionKeys.size < rows.length" @change="handleSelectAllQuestions">
            全选
          </a-checkbox>
          <h3>错题列表</h3>
        </div>
        <span>共 {{ pagination.total }} 题</span>
      </div>

      <a-spin :spinning="loading">
        <a-empty v-if="!rows.length" description="暂无错题数据" />
        <div v-else class="question-list">
          <article v-for="record in rows" :key="recordKey(record)" class="question-card">
            <div class="question-main">
              <a-checkbox
                :checked="selectedQuestionKeys.has(recordKey(record))"
                class="question-checkbox"
                @change="toggleQuestionSelection(record)"
              />
              <div class="question-main-content">
              <div class="question-title">
                <strong>{{ record.string_number || record.question_key || "-" }} 题</strong>
                <a-tag v-if="record.subject" color="blue">{{ record.subject }}</a-tag>
                <a-tag v-if="record.question_type" color="gold">{{ record.question_type }}</a-tag>
                <a-tag v-if="record.year" color="green">{{ record.year }}</a-tag>
                <a-tag :color="record.is_reviewed ? 'green' : 'default'">
                  {{ record.is_reviewed ? "已复习" : "未复习" }}
                </a-tag>
              </div>
              <div class="metric-row">
                <span>我的得分 {{ formatScore(record.student_score) }}/{{ formatScore(record.full_score) }}</span>
                <span v-if="record.exam_name">{{ record.exam_name }}</span>
                <a-button
                  size="small"
                  :type="record.is_reviewed ? 'default' : 'primary'"
                  :loading="reviewUpdatingKey === recordKey(record)"
                  @click="toggleReviewed(record)"
                >
                  {{ record.is_reviewed ? "标记未复习" : "确认已复习" }}
                </a-button>
              </div>
              </div>
            </div>

            <div v-if="stringList(record.knowledge_points).length" class="tag-row">
              <a-tag v-for="point in stringList(record.knowledge_points)" :key="point" color="geekblue">{{ point }}</a-tag>
            </div>

            <div class="content-grid">
              <div class="media-box">
                <div class="box-title box-title-row">
                  <span>题目图片</span>
                  <a-button v-if="questionImagePaths(record).length" type="link" size="small" @click="openQuestionViewer(record)">放大</a-button>
                </div>
                <div v-if="questionImagePaths(record).length" class="image-row">
                  <img
                    v-for="(image, index) in questionImagePaths(record)"
                    :key="`${recordKey(record)}-${index}`"
                    :src="displayImageUrl(image)"
                    class="question-image"
                    loading="lazy"
                    decoding="async"
                    alt="question image"
                    @click="openQuestionViewer(record)"
                  />
                </div>
                <a-empty v-else description="暂无题图" />
              </div>
              <div class="analysis-box">
                <div class="box-title">解析</div>
                <div v-if="text(analysisContent(record))" class="analysis-body">
                  <div v-if="extractAnalysisText(analysisContent(record))" class="analysis-text">{{ extractAnalysisText(analysisContent(record)) }}</div>
                  <div v-if="extractImageUrls(analysisContent(record)).length" class="image-row">
                    <a-image
                      v-for="(url, index) in extractImageUrls(analysisContent(record))"
                      :key="`analysis-${index}`"
                      :src="displayImageUrl(url)"
                      class="question-image"
                    />
                  </div>
                </div>
                <a-empty v-else description="暂无解析" />
              </div>
            </div>
            <div class="answer-row">
              <div class="box-title">答案</div>
              <div v-if="text(record.answer)" class="markdown-body" v-html="renderMarkdown(record.answer)"></div>
              <a-empty v-else description="暂无答案" />
            </div>
          </article>
        </div>
      </a-spin>

      <div class="pagination-wrap">
        <a-pagination
          :current="pagination.page"
          :page-size="pagination.size"
          :total="pagination.total"
          show-size-changer
          :show-total="(total: number) => `共 ${total} 条`"
          @change="handlePageChange"
          @showSizeChange="handleSizeChange"
        />
      </div>
    </section>

    <a-modal
      v-model:open="analysisViewer.open"
      :title="analysisViewerTitle"
      :footer="null"
      :width="960"
      wrap-class-name="analysis-viewer-modal"
    >
      <div
        v-if="analysisViewer.record && text(analysisContent(analysisViewer.record))"
        class="markdown-body analysis-viewer-body"
        @click="handleAnalysisImageClick"
        v-html="renderMarkdown(analysisContent(analysisViewer.record))"
      ></div>
      <a-empty v-else description="暂无解析" />
    </a-modal>

    <div class="hidden-preview-group" aria-hidden="true">
      <a-image-preview-group
        v-if="questionPreviewImages.length"
        :preview="{ visible: questionPreview.open, current: questionPreview.current, onVisibleChange: handleQuestionPreviewVisibleChange }"
      >
        <a-image v-for="(src, index) in questionPreviewImages" :key="`question-preview-${index}-${src}`" :src="src" />
      </a-image-preview-group>
      <a-image-preview-group
        v-if="analysisPreviewImages.length"
        :preview="{ visible: analysisPreview.open, current: analysisPreview.current, onVisibleChange: handleAnalysisPreviewVisibleChange }"
      >
        <a-image v-for="(src, index) in analysisPreviewImages" :key="`analysis-preview-${index}-${src}`" :src="src" />
      </a-image-preview-group>
    </div>

    <!-- 错题购物车抽屉 -->
    <WrongQuestionCartDrawer v-model:open="cartDrawerOpen" :student-id="studentUid" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import router from "@/router";
import { useUserStore } from "@/store";
import {
  getStudentWrongQuestionRecommend as getStudentWrongQuestionRecommendApi,
  getStudentWrongQuestionSearch as searchStudentWrongQuestionApi,
  putStudentWrongQuestionReview,
} from "@/servers/api/wrongQuestion";
import { postCartList } from "@/servers/api/cart";
import { useWrongQuestionCart } from "@/composables/useWrongQuestionCart";
import WrongQuestionCartDrawer from "./components/WrongQuestionCartDrawer.vue";

type CountItem = { name: string; count: number };
type Option = { label: string; value: string };
type WrongQuestionRecord = {
  [key: string]: unknown;
  exam_id?: number | string;
  exam_name?: string;
  test_paper_id?: number | string;
  question_key?: string;
  string_number?: string;
  subject?: string;
  question_type?: string;
  knowledge_points?: string[] | string;
  images?: string[] | string;
  answer?: string;
  analysis?: string;
  student_score?: number | string;
  full_score?: number | string;
  class_id?: string;
  question_id?: number | string;
  is_reviewed?: boolean;
  year?: string;
};

const userStore = useUserStore();
const { cartCount, incrementCount, fetchCartCount } = useWrongQuestionCart();
const rows = ref<WrongQuestionRecord[]>([]);
const selectedQuestionKeys = ref<Set<string>>(new Set());
const addingToCart = ref(false);
const cartDrawerOpen = ref(false);
const loading = ref(false);
const recommendLoading = ref(false);
const recommendKnowledge = ref<CountItem[]>([]);
const recommendTypes = ref<CountItem[]>([]);
const questionTypeOptions = ref<Option[]>([]);
const studentUid = ref("");
const studentName = ref("");
const reviewUpdatingKey = ref("");
const questionPreview = reactive<{ open: boolean; current: number; record: WrongQuestionRecord | null }>({
  open: false,
  current: 0,
  record: null,
});
const analysisViewer = reactive<{ open: boolean; record: WrongQuestionRecord | null }>({
  open: false,
  record: null,
});
const analysisPreview = reactive({
  open: false,
  current: 0,
});

const filters = reactive({
  year: "",
  question_type: "",
  knowledge_keyword: "",
  is_reviewed: undefined as string | undefined,
});

const pagination = reactive({ page: 1, size: 5, total: 0 });
const getTestPaperFileUrl = (path: string) => `/api/tp/file?path=${encodeURIComponent(path || "")}`;
const reviewStatusOptions: Option[] = [
  { label: "未复习", value: "false" },
  { label: "已复习", value: "true" },
];

const text = (value: unknown) => String(value ?? "").trim();
const filterOption = (input: string, option: any) => text(option?.label).toLowerCase().includes(input.toLowerCase());
const analysisViewerTitle = computed(() => {
  const record = analysisViewer.record;
  const question = text(record?.string_number || record?.question_key || "-");
  return `${question} 题解析`;
});
const questionPreviewImages = computed(() => (questionPreview.record ? questionImagePaths(questionPreview.record).map(displayImageUrl).filter(Boolean) : []));
const analysisPreviewImages = computed(() => (analysisViewer.record ? extractImageUrls(analysisContent(analysisViewer.record)).map(displayImageUrl).filter(Boolean) : []));
const buildParams = () => ({
  page: pagination.page,
  size: pagination.size,
  year: text(filters.year) || undefined,
  question_type: text(filters.question_type) || undefined,
  knowledge_keyword: text(filters.knowledge_keyword) || undefined,
  is_reviewed: filters.is_reviewed,
});

const search = async (resetPage = false) => {
  if (!studentUid.value) {
    message.warning("未识别学生身份");
    return;
  }
  if (resetPage) pagination.page = 1;
  loading.value = true;
  try {
    const res = await searchStudentWrongQuestionApi({ student_uid: studentUid.value, ...buildParams() });
    if (Number(res?.code) !== 200) throw new Error(res?.msg || "查询失败");
    rows.value = Array.isArray(res?.data) ? res.data : [];
    pagination.total = Number(res?.total || rows.value.length || 0);
    preloadRecordImages(rows.value);
  } catch (error: any) {
    rows.value = [];
    pagination.total = 0;
    message.error(error?.message || "查询错题失败");
  } finally {
    loading.value = false;
  }
};

const loadRecommend = async () => {
  if (!studentUid.value) return;
  recommendLoading.value = true;
  try {
    const res = await getStudentWrongQuestionRecommendApi({
      student_uid: studentUid.value,
      ...buildParams(),
      limit: 12,
    });
    if (Number(res?.code) !== 200) throw new Error(res?.msg || "推荐失败");
    recommendKnowledge.value = Array.isArray(res?.data?.knowledge_points) ? res.data.knowledge_points : [];
    recommendTypes.value = Array.isArray(res?.data?.question_types) ? res.data.question_types : [];
    questionTypeOptions.value = recommendTypes.value.map((item) => ({ label: item.name, value: item.name }));
  } catch (error: any) {
    message.error(error?.message || "推荐加载失败");
  } finally {
    recommendLoading.value = false;
  }
};

const handleSearch = () => search(true);
const handlePageChange = async (page: number) => {
  pagination.page = page;
  await search(false);
};
const handleSizeChange = async (_page: number, size: number) => {
  pagination.size = size;
  await search(true);
};
const resetFilters = () => {
  filters.year = "";
  filters.question_type = "";
  filters.knowledge_keyword = "";
  filters.is_reviewed = undefined;
  recommendKnowledge.value = [];
  recommendTypes.value = [];
  search(true);
};
const useKnowledge = async (name: string) => {
  filters.knowledge_keyword = name;
  await search(true);
};
const useType = async (name: string) => {
  filters.question_type = name;
  await search(true);
};
const openQuestionViewer = async (record: WrongQuestionRecord) => {
  questionPreview.record = record;
  questionPreview.current = 0;
  await nextTick();
  questionPreview.open = true;
};
const openAnalysisViewer = (record: WrongQuestionRecord) => {
  analysisViewer.record = record;
  analysisViewer.open = true;
};
const handleQuestionPreviewVisibleChange = (visible: boolean) => {
  questionPreview.open = visible;
};
const handleAnalysisPreviewVisibleChange = (visible: boolean) => {
  analysisPreview.open = visible;
};
const openAnalysisImagePreview = async (src: string) => {
  const index = analysisPreviewImages.value.findIndex((item) => item === src);
  if (index < 0) return;
  analysisPreview.current = index;
  await nextTick();
  analysisPreview.open = true;
};
const handleAnalysisImageClick = (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLImageElement) || !target.classList.contains("markdown-image")) return;
  openAnalysisImagePreview(target.dataset.previewSrc || target.currentSrc || target.src);
};

const transparentImage =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
const protectedImageUrls = reactive<Record<string, string>>({});
const loadingImageUrls = new Set<string>();
const failedImageUrls = new Set<string>();

const stringList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  const raw = text(value);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(text).filter(Boolean);
  } catch {}
  return [raw];
};

const imageFieldList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(imageFieldList);
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    return imageFieldList(
      item.url ??
        item.src ??
        item.path ??
        item.file_path ??
        item.filePath ??
        item.image_url ??
        item.imageUrl ??
        item.file_url ??
        item.fileUrl
    );
  }

  const raw = text(value).replace(/^['"<]+|['">]+$/g, "");
  if (!raw) return [];
  try {
    return imageFieldList(JSON.parse(raw));
  } catch {}

  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:") || raw.startsWith("/api/tp/file")) {
    return [raw];
  }

  return raw
    .split(/[,，;\n\r]+/)
    .map((item) => item.trim().replace(/^['"<]+|['">]+$/g, ""))
    .filter(Boolean);
};

const uniqueList = (values: string[]) => Array.from(new Set(values.map(text).filter(Boolean)));

const questionImagePaths = (record: WrongQuestionRecord) =>
  uniqueList(
    [
      record.images,
      record.question_images,
      record.questionImages,
      record.image_urls,
      record.imageUrls,
      record.question_image_urls,
      record.questionImageUrls,
      record.image,
      record.question_image,
      record.image_path,
      record.question_image_path,
    ].flatMap(imageFieldList)
  );

const analysisContent = (record?: WrongQuestionRecord | null) =>
  text(
    record?.analysis ??
      record?.answer_analysis ??
      record?.answerAnalysis ??
      record?.analysis_content ??
      record?.analysisContent ??
      record?.explanation ??
      ""
  );

const fileRequestUrl = (path: unknown) => {
  const value = text(path);
  if (!value) return "";
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (value.startsWith("/api/tp/file")) return value;
  return getTestPaperFileUrl(value);
};

const isProtectedFileUrl = (url: string) => url.startsWith("/api/tp/file");

const fetchProtectedImageUrl = async (requestUrl: string) => {
  if (!requestUrl || protectedImageUrls[requestUrl] || loadingImageUrls.has(requestUrl) || failedImageUrls.has(requestUrl)) return;
  loadingImageUrls.add(requestUrl);
  try {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const response = await fetch(requestUrl, { headers, credentials: "include" });
    if (!response.ok) throw new Error(`图片加载失败：${response.status}`);
    const blob = await response.blob();
    protectedImageUrls[requestUrl] = URL.createObjectURL(blob);
  } catch {
    failedImageUrls.add(requestUrl);
  } finally {
    loadingImageUrls.delete(requestUrl);
  }
};

const displayImageUrl = (path: unknown) => {
  const requestUrl = fileRequestUrl(path);
  if (!requestUrl) return "";
  if (!isProtectedFileUrl(requestUrl)) return requestUrl;
  if (failedImageUrls.has(requestUrl)) return "";
  if (!protectedImageUrls[requestUrl]) fetchProtectedImageUrl(requestUrl);
  return protectedImageUrls[requestUrl] || transparentImage;
};
const formatScore = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};
const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const createMarkdownImagePattern = () => /!\[([^\]]*)\]\(\s*(?:<([^>]+)>|"([^"]+)"|'([^']+)'|([^)]+?))\s*(?:\s+["'][^"']*["'])?\)/g;
const markdownImagePaths = (value: unknown) => {
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  const pattern = createMarkdownImagePattern();
  while ((match = pattern.exec(text(value))) !== null) {
    const src = text(match[2] ?? match[3] ?? match[4] ?? match[5]);
    if (src) urls.push(src);
  }
  const htmlPattern = /<img\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;
  while ((match = htmlPattern.exec(text(value))) !== null) {
    const src = text(match[1] ?? match[2] ?? match[3]);
    if (src) urls.push(src);
  }
  return uniqueList(urls);
};
const renderMarkdownLine = (line: string) => {
  const imagePattern = createMarkdownImagePattern();
  let cursor = 0;
  let html = "";
  let match: RegExpExecArray | null;

  while ((match = imagePattern.exec(line)) !== null) {
    html += escapeHtml(line.slice(cursor, match.index));
    const src = displayImageUrl(match[2] ?? match[3] ?? match[4] ?? match[5]);
    if (src) {
      html += `<img class="markdown-image" src="${escapeHtml(src)}" data-preview-src="${escapeHtml(src)}" alt="${escapeHtml(match[1] || "answer image")}" loading="lazy" decoding="async" />`;
    }
    cursor = match.index + match[0].length;
  }

  html += escapeHtml(line.slice(cursor));
  return `<p>${html}</p>`;
};
const renderMarkdown = (value: unknown) => text(value).split(/\r?\n/).map(renderMarkdownLine).join("");

// 从解析文本中提取出图片URL
const extractImageUrls = (value: unknown): string[] => {
  return markdownImagePaths(value);
};

// 从解析文本中提取纯文本部分（不含图片标记）
const extractAnalysisText = (value: unknown): string => {
  const raw = text(value);
  if (!raw) return "";
  return raw.replace(/!\[[^\]]*\]\([^)\s]+(?:\s+["'][^"']*["'])?\)/g, "").trim();
};
const preloadRecordImages = (records: WrongQuestionRecord[]) => {
  for (const record of records) {
    for (const path of [...questionImagePaths(record), ...extractImageUrls(analysisContent(record)), ...extractImageUrls(record.answer)]) {
      const requestUrl = fileRequestUrl(path);
      if (isProtectedFileUrl(requestUrl)) fetchProtectedImageUrl(requestUrl);
    }
  }
};

onBeforeUnmount(() => {
  for (const url of Object.values(protectedImageUrls)) {
    if (url) URL.revokeObjectURL(url);
  }
});
const recordKey = (record: WrongQuestionRecord) =>
  [record.exam_id, record.test_paper_id, record.question_key || record.string_number].map(text).join("-");

// ===== 购物车选择相关 =====

const selectAllQuestions = computed({
  get: () => rows.value.length > 0 && selectedQuestionKeys.value.size === rows.value.length,
  set: () => {},
});

const handleSelectAllQuestions = () => {
  if (selectedQuestionKeys.value.size === rows.value.length) {
    selectedQuestionKeys.value = new Set();
  } else {
    selectedQuestionKeys.value = new Set(rows.value.map((r) => recordKey(r)));
  }
};

const toggleQuestionSelection = (record: WrongQuestionRecord) => {
  const key = recordKey(record);
  const next = new Set(selectedQuestionKeys.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  selectedQuestionKeys.value = next;
};

/** 将选中的错题添加到购物车 */
const handleAddToCart = async () => {
  if (!selectedQuestionKeys.value.size) {
    message.warning("请先勾选要加入购物车的题目");
    return;
  }
  addingToCart.value = true;
  let added = 0;
  const keys = Array.from(selectedQuestionKeys.value);
  try {
    for (const key of keys) {
      const record = rows.value.find((r) => recordKey(r) === key);
      if (!record) continue;
      try {
        const res = await postCartList({
          student_id: studentUid.value,
          test_question_id: String(record.question_id || record.question_key || record.string_number || ""),
          test_paper_id: String(record.test_paper_id || ""),
        });
        if (Number(res?.code) === 200) added++;
      } catch {
        // 跳过添加失败的，继续处理
      }
    }
    if (added > 0) {
      incrementCount(added);
      message.success(`成功添加 ${added} 道错题到购物车`);
      selectedQuestionKeys.value = new Set();
    } else {
      message.warning("添加失败，请稍后重试");
    }
  } catch {
    message.error("添加购物车出错");
  } finally {
    addingToCart.value = false;
  }
};

const handleGoToCart = () => {
  cartDrawerOpen.value = true;
};

const toggleReviewed = async (record: WrongQuestionRecord) => {
  if (!studentUid.value) return;
  const currentKey = recordKey(record);
  const questionKey = text(record.question_key || record.string_number);
  if (!record.test_paper_id || !questionKey) {
    message.warning("缺少试卷或题号信息");
    return;
  }

  reviewUpdatingKey.value = currentKey;
  try {
    const nextValue = !record.is_reviewed;
    // 生成类型 StudentWrongQuestionReview.test_paper_id 被错误定义为 Record<string, any>，实际后端接收 string
    const res = await putStudentWrongQuestionReview(
      { student_uid: studentUid.value },
      {
        test_paper_id: record.test_paper_id,
        question_key: questionKey,
        class_id: record.class_id,
        is_reviewed: nextValue,
      } as any
    );
    if (Number(res?.code) !== 200) throw new Error(res?.msg || "更新复习状态失败");
    record.is_reviewed = nextValue;
    if (filters.is_reviewed && filters.is_reviewed !== String(nextValue)) {
      rows.value = rows.value.filter((item) => recordKey(item) !== currentKey);
      pagination.total = Math.max(0, pagination.total - 1);
    }
    message.success(nextValue ? "已标记为已复习" : "已取消复习标记");
  } catch (error: any) {
    message.error(error?.message || "更新复习状态失败");
  } finally {
    reviewUpdatingKey.value = "";
  }
};

onMounted(async () => {
  const user = userStore.getUserInfo();
  if (user?.teacher) {
    message.warning("当前账号是老师，请使用老师端错题模块");
    router.replace("/wrong_question");
    return;
  }
  studentUid.value = text(user?.student?.uid || user?.role);
  studentName.value = text(user?.student?.name || user?.nickname || user?.username);
  await Promise.all([search(true), loadRecommend(), fetchCartCount(studentUid.value)]);
});
</script>

<style scoped lang="less">
.wrong-question-page {
  min-height: 100vh;
  padding: 22px;
  background: #f5f7fb;
}

.page-header,
.filter-panel,
.recommend-panel,
.result-panel {
  max-width: 1200px;
  margin: 0 auto 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  h2 {
    margin: 0;
    color: #1f2f46;
    font-size: 26px;
    font-weight: 700;
  }

  p {
    margin: 6px 0 0;
    color: #65758b;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-badge {
  border: 1px solid #d5e1ef;
  border-radius: 8px;
  padding: 8px 12px;
  background: #fff;
  color: #40566f;
  font-weight: 600;
}

.filter-panel,
.recommend-panel,
.result-panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.filter-panel {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr)) repeat(3, auto);
  gap: 10px;
  align-items: center;
  padding: 16px;
}

.recommend-panel {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
}

.click-tag {
  cursor: pointer;
}

.result-panel {
  padding: 16px;
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid #edf1f6;
  margin-bottom: 14px;

  h3 {
    margin: 0;
    color: #24364d;
    font-size: 18px;
  }

  span {
    color: #65758b;
  }
}

.question-list {
  display: grid;
  gap: 14px;
}

.question-card {
  border: 1px solid #dbe4ef;
  border-radius: 8px;
  padding: 14px;
  background: #fff;
}

.question-main,
.question-title,
.metric-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.question-main {
  justify-content: space-between;
}

.metric-row {
  color: #4c6078;
  font-size: 13px;
}

.tag-row {
  margin-top: 10px;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
  gap: 12px;
  margin-top: 12px;
}

.media-box,
.analysis-box,
.answer-row,
.analysis-box {
  min-width: 0;
  border: 1px solid #e4ebf3;
  border-radius: 8px;
  padding: 12px;
  background: #f8fafc;
}

.analysis-box {
  margin-top: 12px;
}

.box-title {
  margin-bottom: 8px;
  color: #334963;
  font-weight: 600;
}

.box-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.image-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.question-image,
:deep(.question-image) {
  width: 420px;
  max-width: 100%;
  border: 1px solid #dce6f1;
  border-radius: 6px;
  background: #fff;
  cursor: zoom-in;
}

:deep(.question-image img) {
  width: 100%;
  height: auto;
  object-fit: contain;
}

.markdown-body {
  max-height: 420px;
  overflow: auto;
  padding: 10px;
  border-radius: 6px;
  background: #fff;
  color: #26384c;
  line-height: 1.7;
}

.markdown-body :deep(p) {
  margin: 0 0 8px;
}

.markdown-body :deep(.markdown-image) {
  display: block;
  max-width: 100%;
  max-height: 360px;
  margin: 8px 0;
  object-fit: contain;
}

.analysis-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.analysis-text {
  color: #26384c;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.analysis-viewer-body {
  max-height: min(72vh, 760px);
  padding: 16px;
  font-size: 16px;
}

.analysis-viewer-body :deep(.markdown-image) {
  max-height: none;
  margin: 12px 0;
  cursor: zoom-in;
}

:global(.analysis-viewer-modal .ant-modal) {
  max-width: calc(100vw - 32px);
}

:global(.analysis-viewer-modal .ant-modal-body) {
  padding-top: 12px;
}

.pagination-wrap {
  margin-top: 16px;
  text-align: right;
}

.hidden-preview-group {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

@media (max-width: 900px) {
  .page-header,
  .question-main {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-panel,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .header-right {
    flex-wrap: wrap;
  }
}

.result-head-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.question-checkbox {
  flex-shrink: 0;
  margin-right: 4px;
}

.question-main-content {
  flex: 1;
  min-width: 0;
}
</style>

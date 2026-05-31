<template>
  <div class="wrong-question-page">
    <header class="page-header">
      <div>
        <h2>错题模块</h2>
        <p>按班级或学生查看未得满分的小题，支持题型和关键词继续筛选。</p>
      </div>
      <a-radio-group v-model:value="mode" button-style="solid" @change="handleModeChange">
        <a-radio-button value="class">班级错题</a-radio-button>
        <a-radio-button value="student">学生错题</a-radio-button>
      </a-radio-group>
    </header>

    <section class="filter-panel">
      <div class="filter-grid">
        <a-select
          v-model:value="filters.subject"
          class="filter-control"
          placeholder="科目"
          :options="subjectOptions"
          allow-clear
          @change="handleBaseChange"
        />

        <a-select
          v-model:value="filters.school_id"
          class="filter-control"
          placeholder="学校"
          :options="schoolOptions"
          :loading="schoolLoading"
          allow-clear
          show-search
          :filter-option="filterOption"
          @change="handleSchoolChange"
        />

        <a-select
          v-model:value="filters.grade"
          class="filter-control"
          placeholder="年级"
          :options="gradeOptions"
          :loading="optionLoading"
          allow-clear
          show-search
          :filter-option="filterOption"
          @change="handleGradeChange"
        />
        <a-select
          v-model:value="filters.class_id"
          class="filter-control"
          :placeholder="canChooseClass ? '班级' : '先选科目、学校和年级'"
          :disabled="!canChooseClass"
          :options="classOptions"
          :loading="optionLoading"
          allow-clear
          show-search
          :filter-option="filterOption"
          @change="handleClassChange"
        />
        <a-select
          v-model:value="filters.test_paper_id"
          class="filter-control"
          :placeholder="canChoosePaper ? '试卷' : '先选班级'"
          :disabled="!canChoosePaper"
          :options="paperOptions"
          :loading="paperLoading"
          allow-clear
          show-search
          :filter-option="filterOption"
          @change="handlePaperChange"
        />
        <a-select
          v-if="mode === 'student'"
          v-model:value="filters.student_id"
          class="filter-control"
          :placeholder="filters.class_id ? '学生' : '先选班级'"
          :disabled="!filters.class_id"
          :options="studentOptions"
          :loading="studentLoading"
          allow-clear
          show-search
          :filter-option="filterOption"
          @change="handleSearch"
        />
        <a-select
          v-model:value="filters.question_type"
          class="filter-control"
          placeholder="题型"
          :options="questionTypeOptions"
          allow-clear
          show-search
          :filter-option="filterOption"
          @change="handleSearch"
        />
        <a-input
          v-model:value="filters.knowledge_keyword"
          class="filter-control keyword-control"
          placeholder="关键词"
          allow-clear
          @pressEnter="handleSearch"
        />
      </div>

      <div class="filter-actions">
        <span class="rule-text">{{ ruleText }}</span>
        <div class="button-row">
          <a-button type="primary" :loading="loading" @click="handleSearch">查询</a-button>
          <a-button :loading="recommendLoading" @click="loadRecommend">推荐筛选</a-button>
          <a-button @click="resetFilters">重置</a-button>
        </div>
      </div>
    </section>

    <section v-if="recommendText || recommendKnowledge.length || recommendTypes.length" class="recommend-panel">
      <span class="recommend-summary">{{ recommendText }}</span>
      <a-tag
        v-for="item in recommendKnowledge"
        :key="`k-${item.name}`"
        color="processing"
        class="click-tag"
        @click="useKnowledge(item.name)"
      >
        {{ item.name }} {{ item.count }}
      </a-tag>
      <a-tag
        v-for="item in recommendTypes"
        :key="`t-${item.name}`"
        color="blue"
        class="click-tag"
        @click="useType(item.name)"
      >
        {{ item.name }} {{ item.count }}
      </a-tag>
    </section>

    <section class="result-panel">
      <div class="result-head">
        <h3>{{ mode === "class" ? "班级错题" : "学生错题" }}</h3>
        <span>共 {{ pagination.total }} 题</span>
      </div>

      <a-alert v-if="errorText" type="warning" show-icon :message="errorText" class="state-alert" />

      <a-spin :spinning="loading">
        <a-empty v-if="!rows.length" description="暂无错题数据" />
        <div v-else class="question-list">
          <article v-for="record in rows" :key="recordKey(record)" class="question-card">
            <div class="question-main">
              <div class="question-title">
                <strong>第 {{ record.string_number || record.question_key || "-" }} 题</strong>
                <a-tag v-if="record.subject" color="blue">{{ record.subject }}</a-tag>
                <a-tag v-if="record.question_type" color="gold">{{ record.question_type }}</a-tag>
                <a-tag v-if="record.class_id" color="cyan">班级 {{ record.class_id }}</a-tag>
              </div>
              <div class="metric-row">
                <span v-if="mode === 'student'">得分 {{ formatScore(record.student_score) }}/{{ formatScore(record.full_score) }}</span>
                <span v-else>错题人数 {{ record.wrong_count ?? "-" }}</span>
                <span v-if="record.participant_count">参与 {{ record.participant_count }}</span>
                <span v-if="record.wrong_rate !== undefined && record.wrong_rate !== null">错率 {{ formatPercent(record.wrong_rate) }}</span>
              </div>
            </div>

            <div v-if="stringList(record.knowledge_points).length" class="tag-row">
              <a-tag v-for="point in stringList(record.knowledge_points)" :key="point" color="geekblue">{{ point }}</a-tag>
            </div>

            <div class="content-grid">
              <div class="media-box">
                <div class="box-title">题目图片</div>
                <div v-if="stringList(record.images).length" class="image-row">
                  <a-image
                    v-for="(image, index) in stringList(record.images)"
                    :key="`${recordKey(record)}-${index}`"
                    :src="fileUrl(image)"
                    class="question-image"
                  />
                </div>
                <a-empty v-else description="暂无题图" />
              </div>
              <div class="answer-box">
                <div class="box-title">答案</div>
                <div v-if="text(record.answer)" class="markdown-body" v-html="renderMarkdown(record.answer)"></div>
                <a-empty v-else description="暂无答案" />
              </div>
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import { getClassesApi } from "@/servers/api/classes";
import { getStudentApi } from "@/servers/api/student";
import { getTestPaper as getTestPaperApi } from "@/servers/api/tp";
import {
  getTeacherWrongQuestionRecommend as getTeacherWrongQuestionRecommendApi,
  getTeacherWrongQuestionSearch as searchTeacherWrongQuestionApi,
} from "@/servers/api/wrongQuestion";
import { useUserStore } from "@/store";
import { getSchoolApi } from "@/servers/api/school";

type Option = { label: string; value: string | number };
type CountItem = { name: string; count: number };
type WrongQuestionRecord = {
  exam_id?: number | string;
  exam_name?: string;
  test_paper_id?: number | string;
  class_id?: string;
  student_id?: string;
  student_name?: string;
  question_key?: string;
  string_number?: string;
  subject?: string;
  question_type?: string;
  knowledge_points?: string[] | string;
  images?: string[] | string;
  answer?: string;
  student_score?: number | string;
  full_score?: number | string;
  wrong_count?: number | string;
  participant_count?: number | string;
  wrong_rate?: number | string;
};

const userStore = useUserStore();
const mode = ref<"class" | "student">("class");
const rows = ref<WrongQuestionRecord[]>([]);
const loading = ref(false);
const optionLoading = ref(false);
const paperLoading = ref(false);
const studentLoading = ref(false);
const recommendLoading = ref(false);
const schoolLoading = ref(false);
const errorText = ref("");
const allClasses = ref<Array<Option & { grade: string }>>([]);
const gradeOptions = ref<Option[]>([]);
const classOptions = ref<Option[]>([]);
const paperOptions = ref<Option[]>([]);
const studentOptions = ref<Option[]>([]);
const recommendKnowledge = ref<CountItem[]>([]);
const recommendTypes = ref<CountItem[]>([]);
const recommendText = ref("");

//学校下拉选项
const schoolOptions = ref<Option[]>([]);

const filters = reactive({
  subject: undefined as string | undefined,
  school_id: "",
  grade: undefined as string | undefined,
  class_id: undefined as string | undefined,
  test_paper_id: undefined as number | undefined,
  student_id: undefined as string | undefined,
  question_type: "",
  knowledge_keyword: "",
});

const pagination = reactive({ page: 1, size: 10, total: 0 });

const subjectOptions: Option[] = ["语文", "数学", "英语", "物理", "化学", "生物", "政治", "历史", "地理"].map((item) => ({
  label: item,
  value: item,
}));

const questionTypeOptions: Option[] = ["单选题", "多选题", "填空题", "解答题", "实验题", "计算题"].map((item) => ({
  label: item,
  value: item,
}));

const canChooseClass = computed(() => Boolean(filters.subject && filters.school_id && filters.grade));
const canChoosePaper = computed(() => Boolean(filters.subject && filters.school_id && filters.grade && filters.class_id));
const ruleText = computed(() =>
  mode.value === "class"
    ? "筛选班级错题前，需要先确定科目、学校、年级和班级；试卷可作为进一步筛选。"
    : "先用学校、年级、班级定位学生，再选择科目和试卷查看个人错题。"
);

const text = (value: unknown) => String(value ?? "").trim();
const normalizeGradeForApi = (value: unknown) => {
  const grade = text(value);
  if (!grade) return undefined;
  return grade.endsWith("\u7ea7") || !/^\d{4}$/.test(grade) ? grade : `${grade}\u7ea7`;
};
const getTestPaperFileUrl = (path: string) => `/api/tp/file?path=${encodeURIComponent(path || "")}`;
const filterOption = (input: string, option: any) => text(option?.label).toLowerCase().includes(input.toLowerCase());
const sortOptions = (a: Option, b: Option) => String(a.label).localeCompare(String(b.label), "zh-Hans-CN", { numeric: true });

const getLocalSchoolId = () => {
  const user = userStore.getUserInfo();
  return text(user?.teacher?.school_id || user?.school_id || user?.teacher?.school);
};

//加载学校列表
const loadSchools = async () => {
  schoolLoading.value = true;
  try {
    const res = await getSchoolApi({ page: 1, size: 1000 });
    const data = Array.isArray(res?.data) ? res.data : [];
    schoolOptions.value = data
      .map((item: any) => ({
        label: text(item.name) || `学校 ${text(item.school_id)}`,
        value: text(item.school_id),
      }))
      .filter((item) => item.value)
      .sort(sortOptions);
  } catch {
    message.error("学校加载失败");
  } finally {
    schoolLoading.value = false;
  }
};

const buildParams = () => ({
  page: pagination.page,
  size: pagination.size,
  subject: filters.subject,
  school_id: text(filters.school_id) || undefined,
  grade: normalizeGradeForApi(filters.grade),
  class_id: filters.class_id,
  test_paper_id: filters.test_paper_id,
  student_id: mode.value === "student" ? filters.student_id : undefined,
  question_type: text(filters.question_type) || undefined,
  knowledge_keyword: text(filters.knowledge_keyword) || undefined,
});

const refreshClassOptions = () => {
  const grade = text(filters.grade);
  classOptions.value = allClasses.value
    .filter((item) => !grade || item.grade === grade)
    .map(({ label, value }) => ({ label, value }))
    .sort(sortOptions);
};

const loadClasses = async () => {
  if (!text(filters.school_id)) return;
  optionLoading.value = true;
  try {
    const res = await getClassesApi({ school_id: filters.school_id, page: 1, size: 1000 } as any);
    const data = Array.isArray(res?.data) ? res.data : [];
    allClasses.value = data
      .map((item: any) => {
        const value = text(item.id || item.class_id);
        return {
          label: text(item.name) || `班级 ${value}`,
          value,
          grade: text(item.grade),
        };
      })
      .filter((item: any) => item.value);
    const gradeMap = new Map<string, string>();
    allClasses.value.forEach((item) => {
      if (item.grade) gradeMap.set(item.grade, item.grade);
    });
    gradeOptions.value = Array.from(gradeMap.entries()).map(([value, label]) => ({ label, value })).sort(sortOptions);
    refreshClassOptions();
  } catch {
    message.error("班级列表加载失败");
  } finally {
    optionLoading.value = false;
  }
};

const loadPapers = async () => {
  if (!canChoosePaper.value) return;
  paperLoading.value = true;
  try {
    const res = await getTestPaperApi({
      page: 1,
      size: 1000,
      school_id: text(filters.school_id),
      grade: normalizeGradeForApi(filters.grade),
      subject: filters.subject,
    } as any);
    const data = Array.isArray(res?.data) ? res.data : [];
    paperOptions.value = data
      .map((item: any) => ({
        label: text(item.name) || text(item.paper_name) || `试卷 ${item.id || item.paper_id}`,
        value: Number(item.id || item.paper_id),
      }))
      .filter((item: Option) => Number.isFinite(Number(item.value)))
      .sort(sortOptions);
  } catch {
    message.error("试卷列表加载失败");
  } finally {
    paperLoading.value = false;
  }
};

const loadStudents = async () => {
  if (!filters.class_id) return;
  studentLoading.value = true;
  try {
    const res = await getStudentApi({ school: filters.school_id, grade: normalizeGradeForApi(filters.grade), class_id: filters.class_id, page: 1, size: 1000 } as any);
    const data = Array.isArray(res?.data) ? res.data : [];
    studentOptions.value = data
      .map((item: any) => ({
        label: `${text(item.name) || "学生"} ${text(item.uid)}`,
        value: text(item.uid),
      }))
      .filter((item: Option) => item.value)
      .sort(sortOptions);
  } catch {
    message.error("学生列表加载失败");
  } finally {
    studentLoading.value = false;
  }
};

const validateSearch = () => {
  if (!filters.subject || !text(filters.school_id) || !filters.grade) {
    errorText.value = "请先选择科目、学校和年级。";
    return false;
  }
  if (!filters.class_id) {
    errorText.value = "请先选择班级，再查询错题。";
    return false;
  }
  if (mode.value === "student" && !filters.student_id) {
    errorText.value = "学生错题模式需要先选择班级和学生。";
    return false;
  }
  if (mode.value === "student" && !filters.test_paper_id) {
    errorText.value = "学生错题模式请选择试卷。";
    return false;
  }
  errorText.value = "";
  return true;
};

const search = async (resetPage = false) => {
  if (resetPage) pagination.page = 1;
  if (!validateSearch()) {
    rows.value = [];
    pagination.total = 0;
    return;
  }
  loading.value = true;
  try {
    const res = await searchTeacherWrongQuestionApi(buildParams());
    if (Number(res?.code) !== 200) throw new Error(res?.msg || "查询失败");
    rows.value = Array.isArray(res?.data) ? res.data : [];
    pagination.total = Number(res?.total || rows.value.length || 0);
  } catch (error: any) {
    rows.value = [];
    pagination.total = 0;
    errorText.value = error?.message || "查询错题失败";
  } finally {
    loading.value = false;
  }
};

const loadRecommend = async () => {
  if (!validateSearch()) return;
  recommendLoading.value = true;
  try {
    const res = await getTeacherWrongQuestionRecommendApi({ ...buildParams(), limit: 12 });
    if (Number(res?.code) !== 200) throw new Error(res?.msg || "推荐失败");
    recommendKnowledge.value = Array.isArray(res?.data?.knowledge_points) ? res.data.knowledge_points : [];
    recommendTypes.value = Array.isArray(res?.data?.question_types) ? res.data.question_types : [];
    recommendText.value = `匹配题量 ${Number(res?.data?.matched_total || 0)}`;
  } catch (error: any) {
    message.error(error?.message || "推荐加载失败");
  } finally {
    recommendLoading.value = false;
  }
};

const handleSearch = () => search(true);
const clearQueryResult = () => {
  rows.value = [];
  pagination.page = 1;
  pagination.total = 0;
  recommendKnowledge.value = [];
  recommendTypes.value = [];
  recommendText.value = "";
};
const handleModeChange = () => {
  filters.student_id = undefined;
  clearQueryResult();
  if (mode.value === "student" && filters.class_id) {
    loadStudents();
  }
};
const handleBaseChange = async () => {
  filters.class_id = undefined;
  filters.test_paper_id = undefined;
  filters.student_id = undefined;
  filters.question_type = "";
  classOptions.value = [];
  paperOptions.value = [];
  studentOptions.value = [];
  clearQueryResult();
  refreshClassOptions();
};
const handleSchoolChange = async () => {
  filters.grade = undefined;
  filters.class_id = undefined;
  filters.test_paper_id = undefined;
  filters.student_id = undefined;
  filters.question_type = "";
  gradeOptions.value = [];
  classOptions.value = [];
  paperOptions.value = [];
  clearQueryResult();
  await loadClasses();
};
const handleGradeChange = async () => {
  filters.class_id = undefined;
  filters.test_paper_id = undefined;
  filters.student_id = undefined;
  filters.question_type = "";
  studentOptions.value = [];
  paperOptions.value = [];
  clearQueryResult();
  refreshClassOptions();
};
const handlePaperChange = async () => {
  filters.question_type = "";
  await search(true);
};
const handleClassChange = async () => {
  filters.test_paper_id = undefined;
  filters.student_id = undefined;
  studentOptions.value = [];
  paperOptions.value = [];
  clearQueryResult();
  if (!filters.class_id) {
    errorText.value = "请先选择班级，再查询错题。";
    return;
  }
  errorText.value = "";
  await loadPapers();
  if (mode.value === "student") await loadStudents();
  else await search(true);
};
const handlePageChange = async (page: number) => {
  pagination.page = page;
  await search(false);
};
const handleSizeChange = async (_page: number, size: number) => {
  pagination.size = size;
  await search(true);
};
const resetFilters = async () => {
  filters.subject = undefined;
  filters.school_id = getLocalSchoolId();
  filters.grade = undefined;
  filters.class_id = undefined;
  filters.test_paper_id = undefined;
  filters.student_id = undefined;
  filters.question_type = "";
  filters.knowledge_keyword = "";
  rows.value = [];
  pagination.page = 1;
  pagination.total = 0;
  recommendKnowledge.value = [];
  recommendTypes.value = [];
  recommendText.value = "";
  paperOptions.value = [];
  await loadClasses();
};
const useKnowledge = async (name: string) => {
  filters.knowledge_keyword = name;
  await search(true);
};
const useType = async (name: string) => {
  filters.question_type = name;
  await search(true);
};

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
const fileUrl = (path: unknown) => {
  const value = text(path);
  if (!value) return "";
  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("/api/tp/file")) return value;
  return getTestPaperFileUrl(value);
};
const formatScore = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};
const formatPercent = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `${(num * 100).toFixed(1)}%`;
};
const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const renderMarkdownLine = (line: string) => {
  const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  let cursor = 0;
  let html = "";
  let match: RegExpExecArray | null;

  while ((match = imagePattern.exec(line)) !== null) {
    html += escapeHtml(line.slice(cursor, match.index));
    const src = fileUrl(match[2]);
    if (src) {
      html += `<img class="markdown-image" src="${escapeHtml(src)}" alt="${escapeHtml(match[1] || "answer image")}" />`;
    }
    cursor = match.index + match[0].length;
  }

  html += escapeHtml(line.slice(cursor));
  return `<p>${html}</p>`;
};
const renderMarkdown = (value: unknown) => text(value).split(/\r?\n/).map(renderMarkdownLine).join("");
const recordKey = (record: WrongQuestionRecord) =>
  [record.exam_id, record.test_paper_id, record.class_id, record.student_id, record.question_key || record.string_number].map(text).join("-");

onMounted(async () => {
  filters.school_id = getLocalSchoolId();
  await loadSchools();
  if (filters.school_id) await loadClasses();
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
  max-width: 1320px;
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

.filter-panel,
.recommend-panel,
.result-panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}

.filter-panel {
  padding: 16px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 12px;
}

.filter-control {
  width: 100%;
}

.keyword-control {
  grid-column: span 2;
}

.filter-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
}

.rule-text {
  color: #6b778c;
  font-size: 13px;
}

.button-row {
  display: flex;
  gap: 8px;
}

.recommend-panel {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
}

.recommend-summary {
  color: #40566f;
  font-weight: 600;
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

.state-alert {
  margin-bottom: 12px;
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
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 12px;
  margin-top: 12px;
}

.media-box,
.answer-box {
  min-width: 0;
  border: 1px solid #e4ebf3;
  border-radius: 8px;
  padding: 12px;
  background: #f8fafc;
}

.box-title {
  margin-bottom: 8px;
  color: #334963;
  font-weight: 600;
}

.image-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

:deep(.question-image) {
  width: 420px;
  max-width: 100%;
  border: 1px solid #dce6f1;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
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

.pagination-wrap {
  margin-top: 16px;
  text-align: right;
}

@media (max-width: 900px) {
  .page-header,
  .filter-actions,
  .question-main {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .keyword-control {
    grid-column: span 1;
  }
}
</style>
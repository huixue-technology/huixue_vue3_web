<template>
  <div class="wrong-question-page">
    <header class="page-header">
      <div>
        <h2>错题模块</h2>
        <p>按班级或学生查看未得满分的小题，支持题型和关键词继续筛选。</p>
      </div>
      <div class="header-right">
        <a-button
          type="primary"
          :disabled="!selectedQuestionKeys.size"
          :loading="addingToCart"
          @click="handleAddToCart"
        >
          加入购物车 ({{ selectedQuestionKeys.size }})
        </a-button>
        <a-radio-group v-model:value="mode" button-style="solid" @change="handleModeChange">
          <a-radio-button value="class">班级错题</a-radio-button>
          <a-radio-button value="student">学生错题</a-radio-button>
        </a-radio-group>
      </div>
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
          @change="handleStudentChange"
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
        <template v-if="mode === 'class'">
          <a-select v-model:value="statScope" class="filter-control" :options="statScopeOptions" placeholder="错题数量" />
          <a-input-number
            v-if="statScope === 'custom'"
            v-model:value="customTopN"
            class="filter-control"
            :min="1"
            :max="1000"
            :precision="0"
            placeholder="前 N 道题"
          />
          <a-input-number
            v-model:value="wrongRateFilters.min"
            class="filter-control"
            :min="0"
            :max="100"
            :step="5"
            addon-after="%"
            placeholder="最低错误率"
          />
          <a-input-number
            v-model:value="wrongRateFilters.max"
            class="filter-control"
            :min="0"
            :max="100"
            :step="5"
            addon-after="%"
            placeholder="最高错误率"
          />
        </template>
      </div>

      <div class="filter-actions">
        <span class="rule-text">{{ ruleText }}</span>
        <div class="button-row">
          <a-button v-if="mode === 'class'" :disabled="!filters.school_id" @click="openStatConfig">统计配置</a-button>
          <a-badge :count="displayedCartCount" :overflow-count="99" :show-zero="false">
            <a-button type="primary" ghost @click="handleOpenCart">购物车</a-button>
          </a-badge>
          <a-button type="primary" :loading="loading" @click="handleSearch">查询</a-button>
          <a-button :loading="recommendLoading" @click="loadRecommend">错题频次分析</a-button>
          <a-button @click="resetFilters">重置</a-button>
        </div>
      </div>
    </section>

    <a-modal v-model:open="statConfigOpen" title="学校错误率统计配置（不影响当前错题查询）" :confirm-loading="statConfigSaving" @ok="saveStatConfig">
      <a-form layout="vertical">
        <a-form-item label="统计范围">
          <a-select v-model:value="statConfigTopN" :options="statConfigOptions" />
        </a-form-item>
        <a-form-item v-if="statConfigTopN === 'custom'" label="前 N 名">
          <a-input-number v-model:value="statConfigCustomTopN" :min="1" :max="1000" :precision="0" />
        </a-form-item>
      </a-form>
      <div class="config-status">当前配置：{{ schoolConfigText }}</div>
    </a-modal>

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
          <a-checkbox
            v-model:checked="selectAllQuestions"
            :indeterminate="selectedQuestionKeys.size > 0 && selectedQuestionKeys.size < selectableRows.length"
            @change="handleSelectAllQuestions"
          >
            全选
          </a-checkbox>
          <h3>{{ mode === "class" ? "班级错题" : "学生错题" }}</h3>
        </div>
        <span>共 {{ pagination.matchedTotal }} 道错题</span>
      </div>

      <a-alert v-if="errorText" type="warning" show-icon :message="errorText" class="state-alert" />

      <a-spin :spinning="loading">
        <a-empty v-if="!rows.length" description="暂无错题数据" />
        <div v-else class="question-list">
          <article v-for="record in rows" :key="recordKey(record)" class="question-card">
            <div class="question-main">
              <a-checkbox
                v-if="!record.is_context"
                :checked="selectedQuestionKeys.has(recordKey(record))"
                class="question-checkbox"
                @change="toggleQuestionSelection(record)"
              />
              <div class="question-main-content">
              <div class="question-title">
                <strong>{{ record.question_number || "-" }} 题</strong>
                <a-tag v-if="record.is_context">母题题干</a-tag>
                <a-tag v-if="record.subject" color="blue">{{ record.subject }}</a-tag>
                <a-tag v-if="record.question_type" color="gold">{{ record.question_type }}</a-tag>
                <a-tag v-if="record.class_id" color="cyan">班级 {{ record.class_id }}</a-tag>
              </div>
              <div v-if="!record.is_context" class="metric-row">
                <span v-if="mode === 'student'">得分 {{ formatScore(record.score) }}/{{ formatScore(record.full_score) }}</span>
                <span v-else>错题人数 {{ record.wrong_count ?? "-" }}</span>
                <span v-if="record.participant_count">参与 {{ record.participant_count }}</span>
                <span v-if="record.wrong_rate !== undefined && record.wrong_rate !== null">错率 {{ formatPercent(record.wrong_rate) }}</span>
              </div>
              </div>
            </div>

            <div v-if="stringList(record.keywords).length" class="tag-row">
              <a-tag v-for="point in stringList(record.keywords)" :key="point" color="geekblue">{{ point }}</a-tag>
            </div>

            <div class="content-grid">
              <div class="media-box">
                <div class="box-title">题干</div>
                <MarkdownContent
                  v-if="record.content"
                  :content="record.content"
                  preview
                />
                <a-empty v-else description="暂无题干" />
              </div>
              <div class="analysis-box">
                <div class="box-title">解析</div>
                <MarkdownContent
                  v-if="record.answer"
                  :content="record.answer"
                  preview
                />
                <a-empty v-else description="暂无解析" />
              </div>
            </div>
            <div class="answer-row">
              <div class="box-title">答案</div>
              <MarkdownContent
                v-if="record.quick_answer"
                :content="record.quick_answer"
                preview
              />
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
          :show-total="(total: number) => `共 ${total} 组`"
          @change="handlePageChange"
          @showSizeChange="handleSizeChange"
        />
      </div>
    </section>

    <!-- 错题购物车抽屉 -->
    <WrongQuestionCartDrawer
      v-model:open="cartDrawerOpen"
      :local-items="mode === 'class' ? classCartItems : undefined"
      :student-id="mode === 'student' ? filters.student_id : undefined"
      @update:local-items="updateClassCartItems"
    />
  </div>
</template>

<script setup lang="ts">
import MarkdownContent from "@/components/MarkdownContent.vue";
import { computed, onMounted, reactive, ref } from "vue";
import { message } from "ant-design-vue";
import { getClassesApi } from "@/servers/api/classes";
import { getSchoolApi, getWrongQuestionStatConfigApi, putWrongQuestionStatConfigApi } from "@/servers/api/school";
import { getStudentApi } from "@/servers/api/student";
import { getTestPaper as getTestPaperApi } from "@/servers/api/tp";
import {
  getTeacherWrongQuestionRecommend as getTeacherWrongQuestionRecommendApi,
  getTeacherWrongQuestionSearch as searchTeacherWrongQuestionApi,
} from "@/servers/api/wrongQuestion";
import { postCartList } from "@/servers/api/cart";
import { useWrongQuestionCart } from "@/composables/useWrongQuestionCart";
import { apiErrorMessage } from "@/utils/apiError";
import { flattenQuestionGroups } from "@/utils/wrongQuestion";
import { useUserStore } from "@/store";
import WrongQuestionCartDrawer from "./components/WrongQuestionCartDrawer.vue";

type Option = { label: string; value: string | number };
type CountItem = { name: string; count: number };
type WrongQuestionRecord = {
  exam_id?: number | string;
  exam_name?: string;
  paper_id?: number | string;
  class_id?: string;
  student_id?: string;
  student_name?: string;
  question_number?: string;
  is_context?: boolean;
  sub_questions?: WrongQuestionRecord[];
  quick_answer?: string;
  subject?: string;
  question_type?: string;
  keywords?: string[] | string;
  content: string;
  answer?: string;
  question_id?: number | string;
  id?: number | string;
  test_question_id?: number | string;
  score?: number | string;
  full_score?: number | string;
  wrong_count?: number | string;
  participant_count?: number | string;
  wrong_rate?: number | string;
};

const userStore = useUserStore();
const { cartCount, incrementCount, fetchCartCount } = useWrongQuestionCart();
const mode = ref<"class" | "student">("class");
const cartDrawerOpen = ref(false);
const classCartItems = ref<WrongQuestionRecord[]>([]);
const selectedQuestionKeys = ref<Set<string>>(new Set());
const addingToCart = ref(false);
const rows = ref<WrongQuestionRecord[]>([]);
const loading = ref(false);
const schoolLoading = ref(false);
const optionLoading = ref(false);
const paperLoading = ref(false);
const studentLoading = ref(false);
const recommendLoading = ref(false);
const errorText = ref("");
const allClasses = ref<Array<Option & { grade: string }>>([]);
const gradeOptions = ref<Option[]>([]);
const classOptions = ref<Option[]>([]);
const paperOptions = ref<Array<Option & { exam_id: number }>>([]);
const studentOptions = ref<Option[]>([]);
const recommendKnowledge = ref<CountItem[]>([]);
const recommendTypes = ref<CountItem[]>([]);
const schoolList = ref<any[]>([]);
const filters = reactive({
  subject: undefined as string | undefined,
  school_id: undefined as string | undefined,
  grade: undefined as string | undefined,
  class_id: undefined as string | undefined,
  test_paper_id: undefined as number | undefined,
  student_id: undefined as string | undefined,
  question_type: "",
  knowledge_keyword: "",
});

const pagination = reactive({ page: 1, size: 5, total: 0, matchedTotal: 0 });
const selectableRows = computed(() => rows.value.filter((record) => !record.is_context));
const statScope = ref<"school_default" | "all_students" | "top_10" | "top_20" | "custom">("all_students");
const customTopN = ref<number | null>(null);
const wrongRateFilters = reactive<{ min: number | null; max: number | null }>({ min: null, max: null });
const statConfigOpen = ref(false);
const statConfigSaving = ref(false);
const statConfigLoading = ref(false);
const schoolConfigTopN = ref<number | null>(null);
const schoolConfigConfigured = ref(false);
const statConfigTopN = ref<"all_students" | "custom">("all_students");
const statConfigCustomTopN = ref<number | null>(null);

const statScopeOptions: Option[] = [
  { label: "全部错题", value: "all_students" },
  { label: "错误率最高的 10 道题", value: "top_10" },
  { label: "错误率最高的 20 道题", value: "top_20" },
  { label: "错误率最高的 N 道题", value: "custom" },
];
const statConfigOptions: Option[] = [
  { label: "全班统计", value: "all_students" },
  { label: "前 N 名", value: "custom" },
];

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
    ? "筛选班级错题前，需要先确定科目、学校、年级、班级和试卷；可直接把列表错题加入购物车。"
    : "先用学校、年级、班级定位学生，再选择科目和试卷查看个人错题。"
);
const displayedCartCount = computed(() => (mode.value === "class" ? classCartItems.value.length : cartCount.value));
const schoolConfigText = computed(() => {
  if (statConfigLoading.value) return "加载中";
  if (!schoolConfigConfigured.value || schoolConfigTopN.value === null) return "全班统计";
  return `前 ${schoolConfigTopN.value} 名`;
});

const text = (value: unknown) => String(value ?? "").trim();
const normalizeGradeForApi = (value: unknown) => {
  const grade = text(value);
  if (!grade) return undefined;
  return grade.endsWith("级") || !/^\d{4}$/.test(grade) ? grade : `${grade}级`;
};
const filterOption = (input: string, option: any) => text(option?.label).toLowerCase().includes(input.toLowerCase());
const sortOptions = (a: Option, b: Option) => String(a.label).localeCompare(String(b.label), "zh-Hans-CN", { numeric: true });
const schoolOptions = computed(() =>
  schoolList.value
    .map((item: any) => {
      const value = text(item.school_id || item.id);
      return {
        label: text(item.name || item.school_name || item.school) || value,
        value,
      };
    })
    .filter((item: Option) => item.value)
    .sort(sortOptions)
);

const getLocalSchoolId = () => {
  const user = userStore.getUserInfo();
  return text(user?.teacher?.school_id || user?.school_id || user?.teacher?.school);
};

//加载学校列表
const loadSchools = async () => {
  schoolLoading.value = true;
  try {
    const res = await getSchoolApi({ page: 1, size: 1000 } as any);
    const data = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.records) ? res.data.records : [];
    schoolList.value = data;
  } catch {
    message.error("学校列表加载失败");
  } finally {
    schoolLoading.value = false;
  }
};

const loadSchoolStatConfig = async (schoolId?: string) => {
  const id = text(schoolId);
  if (!id) {
    schoolConfigTopN.value = null;
    schoolConfigConfigured.value = false;
    return;
  }
  if (statConfigLoading.value) return;
  statConfigLoading.value = true;
  try {
    const res = await getWrongQuestionStatConfigApi({ school_id: id });
    if (Number(res?.code) !== 200) throw new Error(res?.msg || "配置加载失败");
    const data = res?.data || {};
    schoolConfigTopN.value = data.top_n === null || data.top_n === undefined ? null : Number(data.top_n);
    schoolConfigConfigured.value = Boolean(data.configured);
  } catch (error: any) {
    schoolConfigTopN.value = null;
    schoolConfigConfigured.value = false;
    message.error(error?.message || "学校统计配置加载失败");
  } finally {
    statConfigLoading.value = false;
  }
};

const openStatConfig = () => {
  if (!text(filters.school_id)) return;
  statConfigTopN.value = schoolConfigConfigured.value && schoolConfigTopN.value !== null ? "custom" : "all_students";
  statConfigCustomTopN.value = schoolConfigTopN.value;
  statConfigOpen.value = true;
};

const saveStatConfig = async () => {
  const schoolId = text(filters.school_id);
  if (!schoolId) return;
  const topN = statConfigTopN.value === "all_students" ? null : statConfigCustomTopN.value;
  if (topN !== null && (!Number.isInteger(topN) || topN < 1 || topN > 1000)) {
    message.error("自定义统计范围必须是 1 到 1000 的整数。");
    return;
  }
  statConfigSaving.value = true;
  try {
    const res = await putWrongQuestionStatConfigApi({ school_id: schoolId }, { top_n: topN });
    if (Number(res?.code) !== 200) throw new Error(res?.msg || "配置保存失败");
    const data = res?.data || { top_n: topN, configured: topN !== null };
    schoolConfigTopN.value = data.top_n === null || data.top_n === undefined ? null : Number(data.top_n);
    schoolConfigConfigured.value = Boolean(data.configured);
    statConfigOpen.value = false;
    message.success("学校统计配置已保存");
  } catch (error: any) {
    message.error(error?.message || "学校统计配置保存失败");
  } finally {
    statConfigSaving.value = false;
  }
};

const buildBaseParams = (): API.getTeacherWrongQuestionSearchParams => ({
  page: pagination.page,
  size: pagination.size,
  subject: filters.subject,
  school_id: text(filters.school_id),
  grade: normalizeGradeForApi(filters.grade),
  class_id: text(filters.class_id),
  test_paper_id: filters.test_paper_id,
  exam_id: paperOptions.value.find((paper) => paper.value === filters.test_paper_id)?.exam_id || 0,
  student_id: mode.value === "student" ? filters.student_id : undefined,
  question_type: text(filters.question_type) || undefined,
  knowledge_keyword: text(filters.knowledge_keyword) || undefined,
});

const buildParams = (): API.getTeacherWrongQuestionSearchParams => {
  const params = buildBaseParams();
  if (mode.value === "class") {
    if (wrongRateFilters.min !== null) params.min_wrong_rate = wrongRateFilters.min / 100;
    if (wrongRateFilters.max !== null) params.max_wrong_rate = wrongRateFilters.max / 100;
    if (statScope.value === "all_students") params.top_n = 0;
    else if (statScope.value === "top_10") params.top_n = 10;
    else if (statScope.value === "top_20") params.top_n = 20;
    else if (statScope.value === "custom") params.top_n = customTopN.value ?? undefined;
  }
  return params;
};

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
        exam_id: Number(item.exam_id),
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
    const res = await getStudentApi({ school: filters.school_id, grade: normalizeGradeForApi(filters.grade), class_id: text(filters.class_id), page: 1, size: 1000 } as any);
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
  const min = wrongRateFilters.min;
  const max = wrongRateFilters.max;
  if (mode.value === "class") {
    if (min !== null && (!Number.isFinite(min) || min < 0 || min > 100)) {
      errorText.value = "最低错误率必须位于 0% 到 100% 之间。";
      return false;
    }
    if (max !== null && (!Number.isFinite(max) || max < 0 || max > 100)) {
      errorText.value = "最高错误率必须位于 0% 到 100% 之间。";
      return false;
    }
    if (min !== null && max !== null && min > max) {
      errorText.value = "最低错误率不能高于最高错误率。";
      return false;
    }
    if (statScope.value === "custom" && (!Number.isInteger(customTopN.value) || customTopN.value! < 1 || customTopN.value! > 1000)) {
      errorText.value = "自定义统计范围必须是 1 到 1000 的整数。";
      return false;
    }
  }
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
  if (!filters.test_paper_id) {
    errorText.value = "请选择试卷以确定考试范围。";
    return false;
  }
  if (!Number.isInteger(buildParams().exam_id) || buildParams().exam_id <= 0) {
    errorText.value = "所选试卷缺少有效考试 ID，请先维护试卷考试关联。";
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
    pagination.matchedTotal = 0;
    return;
  }
  loading.value = true;
  try {
    const res = await searchTeacherWrongQuestionApi(buildParams());
    if (Number(res?.code) !== 200) throw new Error(apiErrorMessage(res, "查询失败"));
    rows.value = flattenQuestionGroups<WrongQuestionRecord>(Array.isArray(res?.data) ? res.data : []);
    selectedQuestionKeys.value = new Set();
    pagination.total = Number(res?.total ?? 0);
    pagination.matchedTotal = Number(res?.matched_total ?? 0);
    if (mode.value === "student" && filters.student_id) {
      fetchCartCount(filters.student_id);
    }
  } catch (error: any) {
    rows.value = [];
    pagination.total = 0;
    pagination.matchedTotal = 0;
    errorText.value = error?.message || "查询错题失败";
  } finally {
    loading.value = false;
  }
};

const loadRecommend = async () => {
  if (!validateSearch()) return;
  recommendLoading.value = true;
  try {
    const res = await getTeacherWrongQuestionRecommendApi({
      class_id: text(filters.class_id),
      test_paper_id: filters.test_paper_id,
      student_id: mode.value === "student" ? filters.student_id : undefined,
      question_type: text(filters.question_type) || undefined,
      knowledge_keyword: text(filters.knowledge_keyword) || undefined,
      limit: 12,
    });
    if (Number(res?.code) !== 200) throw new Error(apiErrorMessage(res, "推荐失败"));
    recommendKnowledge.value = Array.isArray(res?.data?.knowledge_points) ? res.data.knowledge_points : [];
    recommendTypes.value = Array.isArray(res?.data?.question_types) ? res.data.question_types : [];
  } catch (error: any) {
    message.error(error?.message || "推荐加载失败");
  } finally {
    recommendLoading.value = false;
  }
};

const handleSearch = () => { selectedQuestionKeys.value = new Set(); search(true); };
const clearQueryResult = () => {
  rows.value = [];
  pagination.page = 1;
  pagination.total = 0;
  pagination.matchedTotal = 0;
  recommendKnowledge.value = [];
  recommendTypes.value = [];
};
const resetStatFilters = () => {
  statScope.value = "all_students";
  customTopN.value = null;
  wrongRateFilters.min = null;
  wrongRateFilters.max = null;
};

const handleModeChange = () => {
  filters.student_id = undefined;
  resetStatFilters();
  selectedQuestionKeys.value = new Set();
  if (mode.value === "student") fetchCartCount();
  clearQueryResult();
  if (filters.class_id) {
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
  resetStatFilters();
  await loadSchoolStatConfig(filters.school_id);
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
  await loadStudents();
  if (mode.value === "class") await search(true);
};
const handleStudentChange = async () => {
  selectedQuestionKeys.value = new Set();
  await fetchCartCount(filters.student_id);
  if (mode.value === "student") {
    await search(true);
  }
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
  resetStatFilters();
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
  pagination.matchedTotal = 0;
  recommendKnowledge.value = [];
  recommendTypes.value = [];
  paperOptions.value = [];
  await loadClasses();
  await loadSchoolStatConfig(filters.school_id);
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
const formatScore = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};
const formatPercent = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `${(num * 100).toFixed(2)}%`;
};
const recordKey = (record: WrongQuestionRecord) =>
  [record.exam_id, record.paper_id, record.class_id, record.student_id, record.question_number].map(text).join("-");

// ===== 购物车相关 =====

const selectAllQuestions = computed({
  get: () => selectableRows.value.length > 0 && selectedQuestionKeys.value.size === selectableRows.value.length,
  set: () => {},
});

const handleSelectAllQuestions = () => {
  if (selectedQuestionKeys.value.size === selectableRows.value.length) {
    selectedQuestionKeys.value = new Set();
  } else {
    selectedQuestionKeys.value = new Set(selectableRows.value.map((r) => recordKey(r)));
  }
};

const toggleQuestionSelection = (record: WrongQuestionRecord) => {
  if (record.is_context) return;
  const key = recordKey(record);
  const next = new Set(selectedQuestionKeys.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  selectedQuestionKeys.value = next;
};

const handleOpenCart = () => {
  if (mode.value === "student" && !filters.student_id) {
    message.warning("请先选择学生，再查看购物车");
    return;
  }
  cartDrawerOpen.value = true;
};

const updateClassCartItems = (items: WrongQuestionRecord[]) => {
  classCartItems.value = items;
};

/** 将选中的错题加入购物车 */
const handleAddToCart = async () => {
  if (!selectedQuestionKeys.value.size) {
    message.warning("请先勾选要加入购物车的题目");
    return;
  }
  if (mode.value === "student" && !filters.student_id) {
    message.warning("请先选择学生，再加入购物车");
    return;
  }
  addingToCart.value = true;
  let added = 0;
  const keys = Array.from(selectedQuestionKeys.value);
  try {
    if (mode.value === "class") {
      const existingKeys = new Set(classCartItems.value.map((item) => String(item.id || item.question_id || item.test_question_id || "")));
      const newItems = keys
        .map((key) => rows.value.find((r) => recordKey(r) === key))
        .filter((record): record is WrongQuestionRecord => Boolean(record))
        .map((record) => ({
          ...record,
          id: recordKey(record),
          test_question_id: String(record.question_id || ""),
          add_cart_time: new Date().toLocaleString("zh-CN"),
        }))
        .filter((item) => !existingKeys.has(String(item.id || item.question_id || item.test_question_id || "")));

      if (newItems.length) {
        classCartItems.value = [...classCartItems.value, ...newItems];
        added = newItems.length;
      }
    } else {
      for (const key of keys) {
        const record = rows.value.find((r) => recordKey(r) === key);
        if (!record) continue;
        try {
          const res = await postCartList({
            student_id: String(filters.student_id || ""),
            test_question_id: String(record.question_id || ""),
            test_paper_id: String(record.paper_id || ""),
          });
          if (Number(res?.code) === 200) added++;
        } catch { /* skip failed */ }
      }
    }
    if (added > 0) {
      if (mode.value === "student") incrementCount(added);
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

onMounted(async () => {
  await loadSchools();
  filters.school_id = getLocalSchoolId();
  if (filters.school_id) {
    await loadClasses();
    await loadSchoolStatConfig(filters.school_id);
  }
  fetchCartCount();
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
.analysis-box,
.answer-row {
  min-width: 0;
  border: 1px solid #e4ebf3;
  border-radius: 8px;
  padding: 12px;
  background: #f8fafc;
}

.answer-row {
  margin-top: 12px;
}

.box-title {
  margin-bottom: 8px;
  color: #334963;
  font-weight: 600;
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

/* 购物车相关样式 */
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
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

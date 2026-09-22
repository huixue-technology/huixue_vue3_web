<template>
  <div class="gaokao-detail-page">
    <header class="page-header">
      <div class="page-header__left">
        <a-button type="text" class="back-btn" @click="goBack">
          <arrow-left-outlined /> 返回
        </a-button>
        <div>
          <h2>{{ paper?.name || "试卷详情" }}</h2>
          <p v-if="paper">
            <a-tag color="blue">{{ paper.year }} 年</a-tag>
            <a-tag color="green">{{ paper.subject }}</a-tag>
            <a-tag>共 {{ paper.question_count ?? questions.length }} 题</a-tag>
            <a-tag v-if="paper.missing_count" color="red">{{ paper.missing_count }} 题待补录</a-tag>
          </p>
        </div>
      </div>
      <div class="page-header__right">
        <a
          v-if="paper"
          :href="`/api/gaokao/papers/files/${paper.id}/`"
          target="_blank"
          rel="noopener"
        >下载原卷</a>
      </div>
    </header>

    <section class="filter-panel">
      <a-select
        v-model:value="statusFilter"
        placeholder="题目状态"
        :options="statusOptions"
        allow-clear
        style="width: 160px"
        @change="loadQuestions"
      />
    </section>

    <a-spin :spinning="loading">
      <a-empty v-if="!loading && visibleQuestions.length === 0" description="该试卷暂无题目" />
      <div v-else class="question-list">
        <div v-for="question in visibleQuestions" :key="question.id" class="question-item">
          <div class="question-item__head">
            <span class="question-item__number">第 {{ question.string_number }} 题</span>
            <a-tag v-if="question.question_type">{{ question.question_type }}</a-tag>
            <a-tag v-if="question.score"> {{ question.score }} 分</a-tag>
            <a-tag v-if="question.status === 'missing'" color="red">待补录</a-tag>
            <a-tag v-else-if="question.status === 'edited'" color="orange">已校对</a-tag>
            <span v-if="question.pages?.length" class="question-item__pages">
              第 {{ question.pages.join("、") }} 页
            </span>
          </div>

          <MarkdownContent
            v-if="question.content"
            :content="question.content"
            class="question-item__content"
          />
          <div v-else class="question-item__empty">该题内容待补录，可查看下方原卷裁图。</div>

          <ul v-if="optionList(question).length" class="question-item__options">
            <li v-for="(option, index) in optionList(question)" :key="index">
              <MarkdownContent :content="option" />
            </li>
          </ul>

          <div v-if="question.answer" class="question-item__answer">
            <span class="question-item__answer-label">答案</span>
            <MarkdownContent :content="question.answer" />
          </div>

          <div v-if="question.image_urls?.length" class="question-item__images">
            <a-image-preview-group>
              <a-image
                v-for="url in question.image_urls"
                :key="url"
                :src="url"
                :width="220"
                class="question-item__image"
              />
            </a-image-preview-group>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { ArrowLeftOutlined } from "@ant-design/icons-vue";
import MarkdownContent from "@/components/MarkdownContent.vue";
import {
  getGaokaoPaperDetailApi,
  getGaokaoPaperQuestionsApi,
} from "@/servers/api/papers";

type PaperDetail = {
  id: number;
  name: string;
  subject: string;
  year: string;
  question_count?: number;
  missing_count?: number;
};

type QuestionItem = {
  id: number;
  string_number: string;
  question_type?: string;
  content?: string;
  options?: Record<string, any> | string[] | null;
  answer?: string;
  score?: number;
  image_urls?: string[];
  pages?: number[];
  status?: string;
};

const route = useRoute();
const router = useRouter();
const paperId = Number(route.params.paperId);

const statusOptions = [
  { label: "已解析", value: "parsed" },
  { label: "待补录", value: "missing" },
  { label: "已校对", value: "edited" },
];

const loading = ref(false);
const paper = ref<PaperDetail | null>(null);
const questions = ref<QuestionItem[]>([]);
const statusFilter = ref<string | undefined>(undefined);

const visibleQuestions = computed(() => questions.value);

const isSuccess = (response?: { code?: number }) =>
  response?.code === undefined || response?.code === 0 || response?.code === 200;

const optionList = (question: QuestionItem): string[] => {
  const value = question.options;
  if (Array.isArray(value)) return value as string[];
  if (value && typeof value === "object") return Object.values(value) as string[];
  return [];
};

const loadPaper = async () => {
  try {
    const response = await getGaokaoPaperDetailApi({ paper_id: paperId });
    if (!isSuccess(response)) {
      message.error(response?.msg || "获取试卷信息失败");
      return;
    }
    paper.value = (response?.data as PaperDetail) ?? null;
  } catch (error: any) {
    message.error(error?.message || "获取试卷信息失败");
  }
};

const loadQuestions = async () => {
  loading.value = true;
  try {
    const response = await getGaokaoPaperQuestionsApi({
      paper_id: paperId,
      status: statusFilter.value || undefined,
      page: 1,
      size: 200,
    });
    if (!isSuccess(response)) {
      message.error(response?.msg || "获取题目失败");
      return;
    }
    questions.value = (response?.data as QuestionItem[]) || [];
  } catch (error: any) {
    message.error(error?.message || "获取题目失败");
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push("/gaokao_question_bank");
};

onMounted(() => {
  loadPaper();
  loadQuestions();
});
</script>

<style scoped lang="less">
.gaokao-detail-page {
  padding: 24px;
  // 覆盖全局 text-align: center（Vue 脚手架默认样式），试题文本需左对齐
  text-align: left;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;

    &__left {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    h2 {
      margin: 0 0 8px;
    }

    p {
      margin: 0;
    }
  }

  .back-btn {
    padding-left: 0;
  }

  .filter-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
  }
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px 18px;
  background: #fff;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__number {
    font-weight: 600;
  }

  &__pages {
    margin-left: auto;
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
  }

  &__content {
    font-size: 15px;
  }

  &__empty {
    color: rgba(0, 0, 0, 0.45);
  }

  &__options {
    margin: 10px 0 0;
    padding-left: 20px;
    color: rgba(0, 0, 0, 0.75);

    li {
      margin-bottom: 4px;
    }
  }

  &__answer {
    margin-top: 12px;
    padding: 8px 12px;
    background: #fafafa;
    border-radius: 6px;

    &-label {
      color: rgba(0, 0, 0, 0.45);
      margin-right: 8px;
    }
  }

  &__images {
    margin-top: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__image {
    border: 1px solid #f0f0f0;
    border-radius: 6px;
  }
}
</style>

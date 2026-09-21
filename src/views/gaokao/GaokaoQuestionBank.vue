<template>
  <div class="gaokao-bank-page">
    <header class="page-header">
      <div>
        <h2>高考试题</h2>
        <p>按科目、年份筛选历年高考真题，进入试卷查看逐题内容（公式已渲染）。</p>
      </div>
    </header>

    <section class="filter-panel">
      <a-select
        v-model:value="filters.subject"
        placeholder="科目"
        :options="subjectOptions"
        allow-clear
        show-search
        :filter-option="filterOption"
        style="width: 140px"
        @change="handleSearch"
      />
      <a-select
        v-model:value="filters.year"
        placeholder="年份"
        :options="yearOptions"
        allow-clear
        show-search
        style="width: 140px"
        @change="handleSearch"
      />
      <a-input
        v-model:value="filters.keyword"
        placeholder="试卷名称关键词"
        allow-clear
        style="width: 220px"
        @pressEnter="handleSearch"
      />
      <a-button type="primary" :loading="loading" @click="handleSearch">查询</a-button>
      <a-button @click="handleReset">重置</a-button>
    </section>

    <a-spin :spinning="loading">
      <a-empty v-if="!loading && filteredPapers.length === 0" description="暂无高考试卷" />
      <div v-else class="paper-grid">
        <a-card
          v-for="paper in filteredPapers"
          :key="paper.id"
          class="paper-card"
          size="small"
          hoverable
        >
          <div class="paper-card__title" :title="paper.name">{{ paper.name }}</div>
          <div class="paper-card__meta">
            <a-tag color="blue">{{ paper.year }} 年</a-tag>
            <a-tag color="green">{{ paper.subject }}</a-tag>
          </div>
          <div class="paper-card__actions">
            <a-button type="link" size="small" @click="openPaper(paper)">查看题目</a-button>
            <a
              class="paper-card__download"
              :href="`/api/gaokao/papers/files/${paper.id}/`"
              target="_blank"
              rel="noopener"
            >下载试卷</a>
          </div>
        </a-card>
      </div>
    </a-spin>

    <div v-if="total > pagination.size" class="gaokao-pagination">
      <a-pagination
        :current="pagination.page"
        :page-size="pagination.size"
        :total="total"
        :show-total="(t: number) => `共 ${t} 份`"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { getGaokaoPaperListApi } from "@/servers/api/papers";

type PaperItem = {
  id: number;
  name: string;
  subject: string;
  year: string;
};

const router = useRouter();

const SUBJECTS = ["语文", "数学", "英语", "物理", "化学", "生物", "政治", "历史", "地理"];
const subjectOptions = SUBJECTS.map((value) => ({ label: value, value }));

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 25 }, (_, index) => {
  const year = String(currentYear - index);
  return { label: `${year} 年`, value: year };
});

const filterOption = (input: string, option: any) =>
  String(option?.label ?? "").toLowerCase().includes(input.toLowerCase());

const loading = ref(false);
const papers = ref<PaperItem[]>([]);
const total = ref(0);
const filters = reactive<{ subject?: string; year?: string; keyword?: string }>({
  subject: undefined,
  year: undefined,
  keyword: undefined,
});
const pagination = reactive({ page: 1, size: 24 });

// 名称关键词在已加载结果内做前端过滤（后端仅支持科目/年份）
const filteredPapers = computed(() => {
  const keyword = (filters.keyword || "").trim().toLowerCase();
  if (!keyword) return papers.value;
  return papers.value.filter((paper) => paper.name.toLowerCase().includes(keyword));
});

const isSuccess = (response?: { code?: number }) =>
  response?.code === undefined || response?.code === 0 || response?.code === 200;

const loadPapers = async () => {
  loading.value = true;
  try {
    const response = await getGaokaoPaperListApi({
      subject: filters.subject || undefined,
      year: filters.year || undefined,
      page: pagination.page,
      size: pagination.size,
    });
    if (!isSuccess(response)) {
      message.error(response?.msg || "获取高考试卷失败");
      return;
    }
    papers.value = (response?.data as PaperItem[]) || [];
    total.value = Number(response?.total ?? papers.value.length);
  } catch (error: any) {
    message.error(error?.message || "获取高考试卷失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadPapers();
};

const handleReset = () => {
  filters.subject = undefined;
  filters.year = undefined;
  filters.keyword = undefined;
  handleSearch();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadPapers();
};

// 打开独立详情页（不用抽屉）
const openPaper = (paper: PaperItem) => {
  router.push({ name: "gaokaoPaperDetail", params: { paperId: String(paper.id) } });
};

onMounted(() => {
  loadPapers();
});
</script>

<style scoped lang="less">
.gaokao-bank-page {
  padding: 24px;
  // 覆盖全局 text-align: center（Vue 脚手架默认样式）
  text-align: left;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;

    h2 {
      margin: 0 0 6px;
    }

    p {
      margin: 0;
      color: rgba(0, 0, 0, 0.45);
    }
  }

  .filter-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
  }

  .paper-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .paper-card {
    &__title {
      font-weight: 600;
      margin-bottom: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__meta {
      margin-bottom: 12px;
    }

    &__actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .gaokao-pagination {
    margin-top: 20px;
    text-align: right;
  }
}
</style>

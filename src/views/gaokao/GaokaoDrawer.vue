<template>
  <a-drawer
    :open="open"
    title="高考试卷"
    placement="right"
    :width="520"
    @close="emit('update:open', false)"
  >
    <a-tabs v-model:activeKey="activeSubject" @change="handleSubjectChange">
      <a-tab-pane v-for="s in subjects" :key="s" :tab="s" />
    </a-tabs>

    <a-spin :spinning="loading">
      <a-empty v-if="!loading && papers.length === 0" description="暂无试卷" />
      <a-list v-else :data-source="papers" :split="true">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta>
              <template #title>{{ item.name }}</template>
              <template #description>
                <span v-if="item.year">{{ item.year }}</span>
                <span v-if="item.year && item.subject"> · </span>
                <span>{{ item.subject }}</span>
              </template>
            </a-list-item-meta>
            <template #actions>
              <a-button type="link" size="small" @click="handleDownload(item)">下载</a-button>
            </template>
          </a-list-item>
        </template>
      </a-list>
    </a-spin>

    <div v-if="total > pagination.size" class="gaokao-pagination">
      <a-pagination
        size="small"
        :current="pagination.page"
        :page-size="pagination.size"
        :total="total"
        :show-total="(t: number) => `共 ${t} 份`"
        @change="handlePageChange"
      />
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { message } from "ant-design-vue";
import { getGaokaoPapers, getGaokaoPaperDownloadUrl } from "@/servers/api/gaokao";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "update:open", val: boolean): void }>();

const subjects = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治"];
const activeSubject = ref("语文");
const papers = ref<API.GaokaoPaper[]>([]);
const total = ref(0);
const loading = ref(false);
const pagination = ref({ page: 1, size: 10 });

const loadPapers = async (page = 1) => {
  loading.value = true;
  try {
    const res = await getGaokaoPapers({
      subject: activeSubject.value,
      page,
      size: pagination.value.size,
    });
    papers.value = Array.isArray(res?.data) ? res.data : [];
    total.value = Number(res?.total ?? papers.value.length);
    pagination.value.page = page;
  } catch {
    papers.value = [];
    total.value = 0;
    message.error("加载试卷失败");
  } finally {
    loading.value = false;
  }
};

const handleSubjectChange = () => {
  loadPapers(1);
};

const handlePageChange = (page: number) => {
  loadPapers(page);
};

const handleDownload = async (item: API.GaokaoPaper) => {
  if (item.download_url) {
    window.open(item.download_url, "_blank");
    return;
  }
  try {
    const res = await getGaokaoPaperDownloadUrl({ paper_id: item.id });
    const url = res?.download_url || res?.data?.download_url;
    if (url) {
      window.open(url, "_blank");
    } else {
      message.warning("暂无下载地址");
    }
  } catch {
    message.error("获取下载地址失败");
  }
};

watch(
  () => props.open,
  (val) => {
    if (val) {
      activeSubject.value = "语文";
      loadPapers(1);
    }
  }
);
</script>

<style scoped lang="less">
.gaokao-pagination {
  margin-top: 16px;
  text-align: right;
}
</style>

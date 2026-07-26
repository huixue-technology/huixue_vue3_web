<template>
  <div class="cart-page">
    <header class="page-header">
      <div>
        <h2>错题购物车</h2>
        <p>共 {{ pagination.total }} 道错题，勾选后可批量下载或移除</p>
      </div>
    </header>

    <!-- 批量操作栏 -->
    <section v-if="pagination.total" class="action-bar">
      <div class="action-left">
        <a-checkbox v-model:checked="selectAll" :indeterminate="indeterminate" @change="handleSelectAll">
          全选
        </a-checkbox>
        <span class="selected-hint" v-if="selectedIds.length">
          已选 {{ selectedIds.length }} 项
        </span>
      </div>
      <div class="action-right">
        <a-button danger :disabled="!selectedIds.length" :loading="removing" @click="handleBatchRemove">
          移除选中
        </a-button>
        <a-button type="primary" :disabled="!selectedIds.length" @click="downloadOpen = true">
          下载选中
        </a-button>
      </div>
    </section>

    <!-- 列表区域 -->
    <section class="result-panel">
      <a-spin :spinning="loading">
        <a-empty v-if="!pagination.total && !loading" description="购物车为空，去错题页添加吧" />
        <div v-else class="cart-list">
          <article v-for="item in cartItems" :key="item.id" class="cart-item-card">
            <div class="card-left">
              <a-checkbox
                :checked="selectedIds.includes(item.id)"
                @change="toggleSelect(item.id)"
              />
            </div>
            <div class="card-body">
              <div class="question-title">
                <strong>{{ text(item.string_number || item.question_key || "-") }} 题</strong>
                <a-tag v-if="item.subject" color="blue">{{ item.subject }}</a-tag>
                <a-tag v-if="item.question_type" color="gold">{{ item.question_type }}</a-tag>
                <a-tag v-if="item.year" color="green">{{ item.year }}</a-tag>
                <a-tag :color="item.is_reviewed ? 'green' : 'default'">
                  {{ item.is_reviewed ? "已复习" : "未复习" }}
                </a-tag>
              </div>
              <div class="metric-row">
                <span v-if="item.student_score !== undefined">
                  得分 {{ formatScore(item.student_score) }}/{{ formatScore(item.full_score) }}
                </span>
                <span v-if="item.exam_name">{{ item.exam_name }}</span>
                <span v-if="item.add_cart_time" class="cart-time">加入时间：{{ item.add_cart_time }}</span>
              </div>
              <div v-if="stringList(item.knowledge_points).length" class="tag-row">
                <a-tag v-for="point in stringList(item.knowledge_points)" :key="point" color="geekblue">{{ point }}</a-tag>
              </div>
            </div>
            <div class="card-right">
              <a-button danger size="small" @click="handleRemove(item)">移除</a-button>
            </div>
          </article>
        </div>
      </a-spin>

      <div class="pagination-wrap" v-if="pagination.total">
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

    <!-- 下载弹窗（复用已有组件） -->
    <WrongQuestionDownloadModal
      v-model:open="downloadOpen"
      :total="selectedItems.length"
      :question-list="selectedItems"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { message } from "ant-design-vue";
import router from "@/router";
import { useUserStore } from "@/store";
import { deleteCartItem, getCartList } from "@/servers/api/cart";
import { useWrongQuestionCart } from "@/composables/useWrongQuestionCart";
import WrongQuestionDownloadModal from "./components/WrongQuestionDownloadModal.vue";

type CartItem = Record<string, any>;

const userStore = useUserStore();
const { decrementCount } = useWrongQuestionCart();
const studentUid = ref("");

const cartItems = ref<CartItem[]>([]);
const loading = ref(false);
const removing = ref(false);
const downloadOpen = ref(false);
const selectedIds = ref<number[]>([]);
const pagination = ref({ page: 1, size: 10, total: 0 });

const selectedItems = computed(() =>
  cartItems.value.filter((item) => selectedIds.value.includes(item.id))
);

const selectAll = computed({
  get: () => cartItems.value.length > 0 && selectedIds.value.length === cartItems.value.length,
  set: () => {},
});

const indeterminate = computed(
  () => selectedIds.value.length > 0 && selectedIds.value.length < cartItems.value.length
);

const text = (value: unknown) => String(value ?? "").trim();

const stringList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {}
  return [raw];
};

const formatScore = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
};

const loadCart = async (page = 1, size?: number) => {
  const s = size ?? pagination.value.size;
  loading.value = true;
  selectedIds.value = [];
  try {
    if (!studentUid.value) throw new Error("缺少学生ID，无法查询购物车");
    const res = await getCartList({ student_id: studentUid.value, page, size: s });
    if (Number(res?.code) !== 200) throw new Error(res?.msg || "查询购物车失败");
    cartItems.value = Array.isArray(res?.data) ? res.data : [];
    pagination.value.total = Number(res?.total || cartItems.value.length);
    pagination.value.page = page;
    pagination.value.size = s;
  } catch (error: any) {
    cartItems.value = [];
    pagination.value.total = 0;
    message.error(error?.message || "加载购物车失败");
  } finally {
    loading.value = false;
  }
};

const handleSelectAll = () => {
  if (selectedIds.value.length === cartItems.value.length) {
    selectedIds.value = [];
  } else {
    selectedIds.value = cartItems.value.map((item) => item.id).filter(Boolean);
  }
};

const toggleSelect = (id: number) => {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(id);
  }
};

const handleRemove = async (item: CartItem) => {
  if (!item.id) return;
  try {
    const res = await deleteCartItem({ cart_id: item.id });
    if (Number(res?.code) !== 200) throw new Error(res?.msg || "移除失败");
    cartItems.value = cartItems.value.filter((i) => i.id !== item.id);
    selectedIds.value = selectedIds.value.filter((id) => id !== item.id);
    pagination.value.total = Math.max(0, pagination.value.total - 1);
    decrementCount(1);
    message.success("已从购物车移除");
  } catch (error: any) {
    message.error(error?.message || "移除失败");
  }
};

const handleBatchRemove = async () => {
  if (!selectedIds.value.length) return;
  removing.value = true;
  let removed = 0;
  try {
    for (const id of selectedIds.value) {
      try {
        const res = await deleteCartItem({ cart_id: id });
        if (Number(res?.code) === 200) removed++;
      } catch {
        // 继续处理下一条
      }
    }
    decrementCount(removed);
    message.success(`成功移除 ${removed} 道错题`);
    await loadCart(pagination.value.page);
  } catch {
    message.error("批量移除出错");
  } finally {
    removing.value = false;
  }
};

const handlePageChange = async (page: number) => {
  await loadCart(page);
};

const handleSizeChange = async (_page: number, size: number) => {
  await loadCart(1, size);
};

onMounted(async () => {
  const user = userStore.getUserInfo();
  if (user?.teacher) {
    message.warning("当前账号是老师，请使用老师端错题模块");
    router.replace("/wrong_question");
    return;
  }
  studentUid.value = text(user?.student?.uid || user?.role);
  await loadCart();
});
</script>

<style scoped lang="less">
.cart-page {
  min-height: 100vh;
  padding: 22px;
  background: #f5f7fb;
}

.page-header,
.action-bar,
.result-panel {
  max-width: 1000px;
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

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 12px 16px;
}

.action-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-hint {
  color: #1677ff;
  font-weight: 500;
  font-size: 13px;
}

.action-right {
  display: flex;
  gap: 8px;
}

.result-panel {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  padding: 16px;
}

.cart-list {
  display: grid;
  gap: 12px;
}

.cart-item-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid #dbe4ef;
  border-radius: 8px;
  padding: 14px;
  background: #fff;
}

.card-left {
  padding-top: 2px;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-right {
  flex-shrink: 0;
}

.question-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.metric-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  color: #4c6078;
  font-size: 13px;
}

.cart-time {
  color: #9aa6b7;
  font-size: 12px;
}

.tag-row {
  margin-top: 8px;
}

.pagination-wrap {
  margin-top: 16px;
  text-align: right;
}
</style>

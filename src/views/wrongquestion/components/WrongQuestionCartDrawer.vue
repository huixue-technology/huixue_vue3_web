<template>
  <a-drawer
    :open="open"
    title="错题购物车"
    placement="right"
    :width="720"
    @close="emit('update:open', false)"
  >
    <div v-if="cartTotal" class="cart-toolbar">
      <div class="toolbar-left">
        <a-checkbox
          v-model:checked="selectAll"
          :indeterminate="indeterminate"
          @change="handleSelectAll"
        >
          全选
        </a-checkbox>
        <span v-if="selectedIds.length" class="selected-hint">已选 {{ selectedIds.length }} 项</span>
      </div>
      <div class="toolbar-right">
        <a-button danger size="small" :disabled="!selectedIds.length" :loading="removing" @click="handleBatchRemove">
          移除选中
        </a-button>
        <a-button type="primary" size="small" :disabled="!selectedIds.length" @click="downloadOpen = true">
          下载选中
        </a-button>
      </div>
    </div>

    <a-spin :spinning="loading" class="cart-spin">
      <a-empty v-if="!cartTotal && !loading" description="购物车为空，请先到错题页添加" />
      <div v-else class="cart-list">
        <div
          v-for="item in cartItems"
          :key="itemKey(item)"
          class="cart-item"
          :class="{ 'cart-item-selected': selectedIds.includes(itemKey(item)) }"
        >
          <a-checkbox
            :checked="selectedIds.includes(itemKey(item))"
            class="cart-item-check"
            @change="toggleSelect(itemKey(item))"
          />

          <div class="cart-item-body">
            <div class="cart-item-row">
              <span class="cart-label">题目ID</span>
              <span class="cart-value">{{ item.test_question_id || item.question_id || '-' }}</span>
            </div>
            <div v-if="item.student_id" class="cart-item-row">
              <span class="cart-label">学生ID</span>
              <span class="cart-value">{{ item.student_id }}</span>
            </div>
            <div v-if="item.class_id" class="cart-item-row">
              <span class="cart-label">班级ID</span>
              <span class="cart-value">{{ item.class_id }}</span>
            </div>
            <div class="cart-item-row">
              <span class="cart-label">试卷ID</span>
              <span class="cart-value">{{ item.paper_id || item.test_paper_id || '-' }}</span>
            </div>
            <div v-if="item.question_number || item.string_number || item.question_key" class="cart-item-row">
              <span class="cart-label">题号</span>
              <span class="cart-value">{{ item.question_number || item.string_number || item.question_key }}</span>
            </div>
            <div v-if="item.question_type" class="cart-item-row">
              <span class="cart-label">题型</span>
              <span class="cart-value">{{ item.question_type }}</span>
            </div>
            <div v-if="item.subject" class="cart-item-row">
              <span class="cart-label">科目</span>
              <span class="cart-value">{{ item.subject }}</span>
            </div>
            <div class="cart-item-row">
              <span class="cart-label">加入时间</span>
              <span class="cart-value">{{ item.add_cart_time || item.create_time || '-' }}</span>
            </div>
          </div>

          <div class="cart-item-actions">
            <a-button type="link" danger size="small" @click="handleRemove(item)">移除</a-button>
          </div>
        </div>
      </div>
    </a-spin>

    <div v-if="cartTotal > pagination.size" class="cart-pagination">
      <a-pagination
        size="small"
        :current="pagination.page"
        :page-size="pagination.size"
        :total="cartTotal"
        :show-total="(total: number) => `共 ${total} 条`"
        @change="handlePageChange"
      />
    </div>

    <WrongQuestionDownloadModal
      v-model:open="downloadOpen"
      :total="selectedItems.length"
      :question-list="selectedItems"
      :student-id="studentId"
      @download-success="handleDownloadSuccess"
    />
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { deleteCartItem, getCartList, postCartBatchRemove } from "@/servers/api/cart";
import { useWrongQuestionCart } from "@/composables/useWrongQuestionCart";
import WrongQuestionDownloadModal from "./WrongQuestionDownloadModal.vue";

type CartItem = Record<string, any>;
type CartItemId = number | string;

const props = defineProps<{
  open: boolean;
  studentId?: string;
  localItems?: CartItem[];
}>();

const emit = defineEmits<{
  (e: "update:open", val: boolean): void;
  (e: "update:localItems", val: CartItem[]): void;
}>();

const { decrementCount } = useWrongQuestionCart();

const cartItems = ref<CartItem[]>([]);
const cartTotal = ref(0);
const loading = ref(false);
const removing = ref(false);
const downloadOpen = ref(false);
const selectedIds = ref<CartItemId[]>([]);
const pagination = ref({ page: 1, size: 8 });
const text = (value: unknown) => String(value ?? "").trim();
const isLocalCart = computed(() => Array.isArray(props.localItems));

const itemKey = (item: CartItem): CartItemId => item.id || item.question_id || item.test_question_id || "";

const selectedItems = computed(() =>
  cartItems.value.filter((item) => selectedIds.value.includes(itemKey(item)))
);

const selectAll = computed({
  get: () => cartItems.value.length > 0 && selectedIds.value.length === cartItems.value.length,
  set: () => {},
});

const indeterminate = computed(
  () => selectedIds.value.length > 0 && selectedIds.value.length < cartItems.value.length
);

const loadLocalCart = (page = 1) => {
  const list = props.localItems ?? [];
  const total = list.length;
  const maxPage = Math.max(1, Math.ceil(total / pagination.value.size));
  const currentPage = Math.min(page, maxPage);
  const start = (currentPage - 1) * pagination.value.size;

  cartItems.value = list.slice(start, start + pagination.value.size);
  cartTotal.value = total;
  pagination.value.page = currentPage;
  selectedIds.value = [];
};

const loadCart = async (page = 1) => {
  if (isLocalCart.value) {
    loadLocalCart(page);
    return;
  }

  loading.value = true;
  selectedIds.value = [];
  try {
    const studentId = text(props.studentId);
    if (!studentId) throw new Error("缺少学生ID，无法查询购物车");
    const res = await getCartList({ student_id: studentId, page, size: pagination.value.size });
    if (Number(res?.code) !== 200) throw new Error(res?.msg || "查询购物车失败");
    cartItems.value = Array.isArray(res?.data) ? res.data : [];
    cartTotal.value = Number(res?.total || cartItems.value.length);
    pagination.value.page = page;
  } catch (error: any) {
    cartItems.value = [];
    cartTotal.value = 0;
    message.error(error?.message || "加载购物车失败");
  } finally {
    loading.value = false;
  }
};

const handleSelectAll = () => {
  if (selectedIds.value.length === cartItems.value.length) {
    selectedIds.value = [];
  } else {
    selectedIds.value = cartItems.value.map(itemKey).filter((id) => id !== "");
  }
};

const toggleSelect = (id: CartItemId) => {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1);
  } else {
    selectedIds.value.push(id);
  }
};

const removeLocalItems = (ids: CartItemId[]) => {
  const removeSet = new Set(ids.map(String));
  const next = (props.localItems ?? []).filter((item) => !removeSet.has(String(itemKey(item))));
  const maxPage = Math.max(1, Math.ceil(next.length / pagination.value.size));
  const currentPage = Math.min(pagination.value.page, maxPage);
  const start = (currentPage - 1) * pagination.value.size;

  emit("update:localItems", next);
  cartItems.value = next.slice(start, start + pagination.value.size);
  cartTotal.value = next.length;
  pagination.value.page = currentPage;
  selectedIds.value = [];
};

const handleRemove = async (item: CartItem) => {
  const id = itemKey(item);
  if (!id) return;

  if (isLocalCart.value) {
    removeLocalItems([id]);
    message.success("已移除");
    return;
  }

  try {
    const res = await deleteCartItem({ cart_id: Number(id) });
    if (Number(res?.code) !== 200) throw new Error(res?.msg || "移除失败");
    cartItems.value = cartItems.value.filter((i) => itemKey(i) !== id);
    selectedIds.value = selectedIds.value.filter((selectedId) => selectedId !== id);
    cartTotal.value = Math.max(0, cartTotal.value - 1);
    decrementCount(1);
    message.success("已移除");
  } catch (error: any) {
    message.error(error?.message || "移除失败");
  }
};

const handleBatchRemove = async () => {
  if (!selectedIds.value.length) return;

  if (isLocalCart.value) {
    const removed = selectedIds.value.length;
    removeLocalItems([...selectedIds.value]);
    message.success(`已移除 ${removed} 项`);
    return;
  }

  removing.value = true;
  let removed = 0;
  try {
    for (const id of selectedIds.value) {
      try {
        const res = await deleteCartItem({ cart_id: Number(id) });
        if (Number(res?.code) === 200) removed++;
      } catch { /* skip */ }
    }
    decrementCount(removed);
    message.success(`已移除 ${removed} 项`);
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

const handleDownloadSuccess = async () => {
  const ids = [...selectedIds.value];
  if (!ids.length) return;

  if (isLocalCart.value) {
    removeLocalItems(ids);
    return;
  }

  try {
    const res = await postCartBatchRemove({ ids: ids.map(Number) });
    if (Number(res?.code) !== 200) {
      throw new Error(res?.msg || "下载后清空购物车失败");
    }

    decrementCount(ids.length);
    selectedIds.value = [];

    await loadCart(1);
  } catch (error: any) {
    message.warning(error?.message || "下载成功，但购物车清空失败，请手动移除");
  }
};

watch(
  () => props.open,
  (val) => {
    if (val) loadCart(1);
  }
);

watch(
  () => props.localItems,
  () => {
    if (props.open && isLocalCart.value) loadLocalCart(pagination.value.page);
  },
  { deep: true }
);
</script>

<style scoped lang="less">
.cart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-hint {
  color: #1677ff;
  font-size: 13px;
  font-weight: 500;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.cart-spin {
  min-height: 200px;
}

.cart-list {
  display: grid;
  gap: 10px;
}

.cart-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
  transition: border-color 0.2s;
}

.cart-item-selected {
  border-color: #1677ff;
  background: #f0f5ff;
}

.cart-item-check {
  padding-top: 2px;
  flex-shrink: 0;
}

.cart-item-body {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
}

.cart-item-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.cart-label {
  color: #8c8c8c;
  flex-shrink: 0;
  min-width: 52px;
}

.cart-value {
  color: #262626;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-item-actions {
  flex-shrink: 0;
  padding-top: 2px;
}

.cart-pagination {
  margin-top: 16px;
  text-align: right;
}

@media (max-width: 640px) {
  .cart-item {
    flex-direction: column;
  }

  .cart-item-body {
    width: 100%;
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <a-drawer
    :open="open"
    title="错题购物车"
    placement="right"
    :width="720"
    @close="emit('update:open', false)"
  >
    <!-- 操作栏 -->
    <div class="cart-toolbar" v-if="cartTotal">
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

    <!-- 列表 -->
    <a-spin :spinning="loading" class="cart-spin">
      <a-empty v-if="!cartTotal && !loading" description="购物车空空如也，去错题页添加吧" />
      <div v-else class="cart-list">
        <div
          v-for="item in cartItems"
          :key="item.id"
          class="cart-item"
          :class="{ 'cart-item-selected': selectedIds.includes(item.id) }"
        >
          <a-checkbox
            :checked="selectedIds.includes(item.id)"
            class="cart-item-check"
            @change="toggleSelect(item.id)"
          />

          <div class="cart-item-body">
            <!-- 字段 2: test_question_id -->
            <div class="cart-item-row">
              <span class="cart-label">题目ID</span>
              <span class="cart-value">{{ item.test_question_id || '-' }}</span>
            </div>
            <!-- 字段 3: student_id -->
            <div class="cart-item-row">
              <span class="cart-label">学生ID</span>
              <span class="cart-value">{{ item.student_id || '-' }}</span>
            </div>
            <!-- 字段 4: test_paper_id -->
            <div class="cart-item-row">
              <span class="cart-label">试卷ID</span>
              <span class="cart-value">{{ item.test_paper_id || '-' }}</span>
            </div>
            <!-- 字段 5: require_analysis -->
            <div class="cart-item-row">
              <span class="cart-label">需解析</span>
              <span class="cart-value">
                <a-tag :color="item.require_analysis ? 'blue' : 'default'">
                  {{ item.require_analysis ? '是' : '否' }}
                </a-tag>
              </span>
            </div>
            <!-- 字段 6: add_cart_time -->
            <div class="cart-item-row">
              <span class="cart-label">加入时间</span>
              <span class="cart-value">{{ item.add_cart_time || '-' }}</span>
            </div>
            <!-- 字段 7: is_reviewed -->
            <div class="cart-item-row">
              <span class="cart-label">复习状态</span>
              <span class="cart-value">
                <a-tag :color="item.is_reviewed ? 'green' : 'orange'">
                  {{ item.is_reviewed ? '已复习' : '未复习' }}
                </a-tag>
              </span>
            </div>
            <!-- 字段 8: create_time -->
            <div class="cart-item-row">
              <span class="cart-label">创建时间</span>
              <span class="cart-value">{{ item.create_time || '-' }}</span>
            </div>
            <!-- 字段 9: update_time -->
            <div class="cart-item-row">
              <span class="cart-label">更新时间</span>
              <span class="cart-value">{{ item.update_time || '-' }}</span>
            </div>
          </div>

          <div class="cart-item-actions">
            <a-button type="link" danger size="small" @click="handleRemove(item)">移除</a-button>
          </div>
        </div>
      </div>
    </a-spin>

    <!-- 分页 -->
    <div class="cart-pagination" v-if="cartTotal > pagination.size">
      <a-pagination
        size="small"
        :current="pagination.page"
        :page-size="pagination.size"
        :total="cartTotal"
        :show-total="(total: number) => `共 ${total} 条`"
        @change="handlePageChange"
      />
    </div>

    <!-- 下载弹窗 -->
    <WrongQuestionDownloadModal
      v-model:open="downloadOpen"
      :total="selectedItems.length"
      :question-list="selectedItems"
    />
  </a-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { deleteCartItem, getCartList } from "@/servers/api/cart";
import { useWrongQuestionCart } from "@/composables/useWrongQuestionCart";
import WrongQuestionDownloadModal from "./WrongQuestionDownloadModal.vue";

type CartItem = Record<string, any>;

const props = defineProps<{
  open: boolean;
  studentId?: string;
}>();

const emit = defineEmits<{
  (e: "update:open", val: boolean): void;
}>();

const { decrementCount } = useWrongQuestionCart();

const cartItems = ref<CartItem[]>([]);
const cartTotal = ref(0);
const loading = ref(false);
const removing = ref(false);
const downloadOpen = ref(false);
const selectedIds = ref<number[]>([]);
const pagination = ref({ page: 1, size: 8 });
const text = (value: unknown) => String(value ?? "").trim();

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

const loadCart = async (page = 1) => {
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
    cartTotal.value = Math.max(0, cartTotal.value - 1);
    decrementCount(1);
    message.success("已移除");
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

// 打开抽屉时自动加载
watch(
  () => props.open,
  (val) => {
    if (val) loadCart(1);
  }
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
</style>

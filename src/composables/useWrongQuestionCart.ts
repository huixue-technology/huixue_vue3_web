import { ref } from "vue";
import { getCartList } from "@/servers/api/cart";
import { useUserStore } from "@/store";

// 模块级 ref，所有组件共享同一实例
const cartCount = ref(0);
const text = (value: unknown) => String(value ?? "").trim();

const resolveStudentId = (studentId?: unknown) => {
  const explicitStudentId = text(studentId);
  if (explicitStudentId) return explicitStudentId;
  const user = useUserStore().getUserInfo();
  return text(user?.student?.uid || (!user?.teacher ? user?.role : ""));
};

export function useWrongQuestionCart() {
  const loading = ref(false);

  /** 获取购物车总数（用于 NavBar 角标） */
  async function fetchCartCount(studentId?: unknown) {
    const resolvedStudentId = resolveStudentId(studentId);
    if (!resolvedStudentId) {
      cartCount.value = 0;
      return;
    }
    try {
      const res = await getCartList({ student_id: resolvedStudentId, page: 1, size: 1 });
      if (Number(res?.code) === 200) {
        cartCount.value = Number(res?.total || 0);
      }
    } catch {
      // 静默失败，角标不需要报错
    }
  }

  /** 获取购物车完整列表 */
  async function fetchCartList(page = 1, size = 20, studentId?: unknown) {
    const resolvedStudentId = resolveStudentId(studentId);
    if (!resolvedStudentId) {
      cartCount.value = 0;
      return { list: [], total: 0 };
    }
    loading.value = true;
    try {
      const res = await getCartList({ student_id: resolvedStudentId, page, size });
      if (Number(res?.code) === 200) {
        const list = Array.isArray(res?.data) ? res.data : [];
        cartCount.value = Number(res?.total || list.length);
        return { list, total: cartCount.value };
      }
      throw new Error(res?.msg || "获取购物车失败");
    } finally {
      loading.value = false;
    }
  }

  /** 本地增加计数 */
  function incrementCount(n = 1) {
    cartCount.value += n;
  }

  /** 本地减少计数 */
  function decrementCount(n = 1) {
    cartCount.value = Math.max(0, cartCount.value - n);
  }

  return {
    cartCount,
    loading,
    fetchCartCount,
    fetchCartList,
    incrementCount,
    decrementCount,
  };
}

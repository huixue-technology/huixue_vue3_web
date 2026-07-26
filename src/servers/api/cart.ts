// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 查询购物车列表 支持按试卷 ID、复习状态、解析需求筛选，支持分页。
默认排除已移出的条目，传 only_removed=true 可查看已移出条目。 GET /api/wrong-question/cart */
export async function getCartList(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getCartListParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/wrong-question/cart", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 将错题加入购物车 请求体 (JSON):
{
    "student_id": "xxx",          // 必填
    "test_question_id": "xxx",    // 必填
    "test_paper_id": "xxx",       // 可选
    "require_analysis": true      // 可选，默认 false
}

智能去重：同一学生对同一题目重复添加会提示错误；
如果之前移出过该题目，会自动恢复到购物车。 POST /api/wrong-question/cart */
export async function postCartList(
  body: API.CartAdd,
  options?: { [key: string]: any }
) {
  return request<any>("/api/wrong-question/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新购物车条目 请求体 (JSON):
{
    "test_paper_id": "xxx",       // 可选，更换试卷
    "require_analysis": true,     // 可选，是否需要解析
    "is_reviewed": true           // 可选，是否已复习
} PUT /api/wrong-question/cart/${param0} */
export async function putCartItem(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putCartItemParams,
  body: API.CartUpdate,
  options?: { [key: string]: any }
) {
  const { cart_id: param0, ...queryParams } = params;
  return request<any>(`/api/wrong-question/cart/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 移出购物车（软删除，数据保留） DELETE /api/wrong-question/cart/${param0} */
export async function deleteCartItem(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteCartItemParams,
  options?: { [key: string]: any }
) {
  const { cart_id: param0, ...queryParams } = params;
  return request<any>(`/api/wrong-question/cart/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 将已移出的错题恢复到购物车 恢复后：
- is_removed 设为 False
- add_cart_time 更新为当前时间
- is_reviewed 重置为 False PUT /api/wrong-question/cart/${param0}/restore */
export async function putCartRestore(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putCartRestoreParams,
  options?: { [key: string]: any }
) {
  const { cart_id: param0, ...queryParams } = params;
  return request<any>(`/api/wrong-question/cart/${param0}/restore`, {
    method: "PUT",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 标记已复习/未复习 请求体 (JSON):
{
    "reviewed": true    // true=已复习, false=未复习
} PUT /api/wrong-question/cart/${param0}/review */
export async function putCartMarkReviewed(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putCartMarkReviewedParams,
  body: API.CartMarkReviewed,
  options?: { [key: string]: any }
) {
  const { cart_id: param0, ...queryParams } = params;
  return request<any>(`/api/wrong-question/cart/${param0}/review`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 切换是否需要答案解析（反转当前状态） PUT /api/wrong-question/cart/${param0}/toggle-analysis */
export async function putCartToggleAnalysis(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putCartToggleAnalysisParams,
  options?: { [key: string]: any }
) {
  const { cart_id: param0, ...queryParams } = params;
  return request<any>(`/api/wrong-question/cart/${param0}/toggle-analysis`, {
    method: "PUT",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 批量移出购物车 请求体 (JSON):
{
    "ids": [1, 2, 3]
} POST /api/wrong-question/cart/batch-remove */
export async function postCartBatchRemove(
  body: API.CartBatchRemove,
  options?: { [key: string]: any }
) {
  return request<any>("/api/wrong-question/cart/batch-remove", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

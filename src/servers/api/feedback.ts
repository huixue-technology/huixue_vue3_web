// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 获取反馈详情 GET /api/feedback/${param0} */
export async function getFeedbackDetail(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getFeedbackDetailParams,
  options?: { [key: string]: any }
) {
  const { feedback_id: param0, ...queryParams } = params;
  return request<any>(`/api/feedback/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 更新反馈状态（管理员） PUT /api/feedback/${param0} */
export async function updateFeedbackStatus(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.updateFeedbackStatusParams,
  body: API.FeedbackUpdate,
  options?: { [key: string]: any }
) {
  const { feedback_id: param0, ...queryParams } = params;
  return request<any>(`/api/feedback/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 获取所有反馈列表（管理员） GET /api/feedback/list */
export async function getAllFeedbacks(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getAllFeedbacksParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/feedback/list", {
    method: "GET",
    params: {
      // page_size has a default value: 10
      page_size: "10",
      // page has a default value: 1
      page: "1",
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取当前用户的反馈列表 GET /api/feedback/my-feedbacks */
export async function getMyFeedbacks(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getMyFeedbacksParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/feedback/my-feedbacks", {
    method: "GET",
    params: {
      // page_size has a default value: 10
      page_size: "10",
      // page has a default value: 1
      page: "1",
      ...params,
    },
    ...(options || {}),
  });
}

/** 提交用户反馈 POST /api/feedback/submit */
export async function submitFeedback(
  body: API.FeedbackSubmit,
  options?: { [key: string]: any }
) {
  return request<any>("/api/feedback/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 获取考试记录列表，支持分页和条件过滤 GET /api/exam/ */
export async function getExamApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getExamApiParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/exam/", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 添加新的考试记录 POST /api/exam/ */
export async function postExamApi(
  body: API.Exam,
  options?: { [key: string]: any }
) {
  return request<any>("/api/exam/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取指定的考试记录详情 GET /api/exam/${param0} */
export async function getExamDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getExamDetailApiParams,
  options?: { [key: string]: any }
) {
  const { exam_id: param0, ...queryParams } = params;
  return request<any>(`/api/exam/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 更新指定的考试记录 PUT /api/exam/${param0} */
export async function putExamDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putExamDetailApiParams,
  body: API.Exam,
  options?: { [key: string]: any }
) {
  const { exam_id: param0, ...queryParams } = params;
  return request<any>(`/api/exam/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 删除指定的考试记录 DELETE /api/exam/${param0} */
export async function deleteExamDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteExamDetailApiParams,
  options?: { [key: string]: any }
) {
  const { exam_id: param0, ...queryParams } = params;
  return request<any>(`/api/exam/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

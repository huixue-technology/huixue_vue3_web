// @ts-ignore
/* eslint-disable */
import request from "umi-request";

/** 获取班级记录列表，支持分页和条件过滤 GET /api/classes/ */
export async function getClassesApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getClassesApiParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/classes/", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 添加新的班级记录 POST /api/classes/ */
export async function postClassesApi(
  body: API.Classes,
  options?: { [key: string]: any }
) {
  return request<any>("/api/classes/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取指定的班级记录详情 GET /api/classes/${param0} */
export async function getClassesDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getClassesDetailApiParams,
  options?: { [key: string]: any }
) {
  const { class_id: param0, ...queryParams } = params;
  return request<any>(`/api/classes/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 更新指定的班级记录 PUT /api/classes/${param0} */
export async function putClassesDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putClassesDetailApiParams,
  body: API.Classes,
  options?: { [key: string]: any }
) {
  const { class_id: param0, ...queryParams } = params;
  return request<any>(`/api/classes/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 删除指定的班级记录 DELETE /api/classes/${param0} */
export async function deleteClassesDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteClassesDetailApiParams,
  options?: { [key: string]: any }
) {
  const { class_id: param0, ...queryParams } = params;
  return request<any>(`/api/classes/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

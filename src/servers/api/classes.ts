// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 此处后端没有提供注释 GET /api/classes/ */
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

/** 此处后端没有提供注释 POST /api/classes/ */
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

/** 此处后端没有提供注释 GET /api/classes/${param0} */
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

/** 此处后端没有提供注释 PUT /api/classes/${param0} */
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

/** 此处后端没有提供注释 DELETE /api/classes/${param0} */
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

// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 获取学校记录列表，支持分页和条件过滤 GET /api/school/ */
export async function getSchoolApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getSchoolApiParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/school/", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 添加新的学校记录 POST /api/school/ */
export async function postSchoolApi(
  body: API.School,
  options?: { [key: string]: any }
) {
  return request<any>("/api/school/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取指定的学校记录详情 GET /api/school/${param0} */
export async function getSchoolDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getSchoolDetailApiParams,
  options?: { [key: string]: any }
) {
  const { school_id: param0, ...queryParams } = params;
  return request<any>(`/api/school/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 更新指定的学校记录 PUT /api/school/${param0} */
export async function putSchoolDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putSchoolDetailApiParams,
  body: API.School,
  options?: { [key: string]: any }
) {
  const { school_id: param0, ...queryParams } = params;
  return request<any>(`/api/school/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 删除指定的学校记录 DELETE /api/school/${param0} */
export async function deleteSchoolDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteSchoolDetailApiParams,
  options?: { [key: string]: any }
) {
  const { school_id: param0, ...queryParams } = params;
  return request<any>(`/api/school/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

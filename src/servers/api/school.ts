// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 获取学校信息 GET /api/school/school */
export async function getSchool(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getSchoolParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/school/school", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 修改学校信息 PUT /api/school/school */
export async function putSchool(
  body: API.modifySchool,
  options?: { [key: string]: any }
) {
  return request<any>("/api/school/school", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 添加学校信息 POST /api/school/school */
export async function postSchool(
  body: API.addSchool,
  options?: { [key: string]: any }
) {
  return request<any>("/api/school/school", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除学校信息 DELETE /api/school/school */
export async function deleteSchool(
  body: API.delSchool,
  options?: { [key: string]: any }
) {
  return request<any>("/api/school/school", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

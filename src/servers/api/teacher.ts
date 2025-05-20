// @ts-ignore
/* eslint-disable */
import { request } from "umi";

/** 获取教师信息 GET /api/teacher/teacher */
export async function getTeacher(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTeacherParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/teacher/teacher", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 更新教师信息 PUT /api/teacher/teacher */
export async function putTeacher(
  body: API.updateTeacher,
  options?: { [key: string]: any }
) {
  return request<any>("/api/teacher/teacher", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 添加教师 POST /api/teacher/teacher */
export async function postTeacher(
  body: API.addTeacher,
  options?: { [key: string]: any }
) {
  return request<any>("/api/teacher/teacher", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除教师 DELETE /api/teacher/teacher */
export async function deleteTeacher(
  body: API.delTeacher,
  options?: { [key: string]: any }
) {
  return request<any>("/api/teacher/teacher", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

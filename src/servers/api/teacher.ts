// @ts-ignore
/* eslint-disable */
import request from "umi-request";

/** 获取教师记录列表，支持分页和条件过滤 GET /api/teacher/ */
export async function getTeacherApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTeacherApiParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/teacher/", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 添加新的教师记录 POST /api/teacher/ */
export async function postTeacherApi(
  body: API.Teacher,
  options?: { [key: string]: any }
) {
  return request<any>("/api/teacher/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 批量删除教师 DELETE /api/teacher/ */
export async function deleteTeacherApi(
  body: API.BatchDeleteTeacher,
  options?: { [key: string]: any }
) {
  return request<any>("/api/teacher/", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取指定的教师记录详情 GET /api/teacher/${param0} */
export async function getTeacherDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTeacherDetailApiParams,
  options?: { [key: string]: any }
) {
  const { teacher_uid: param0, ...queryParams } = params;
  return request<any>(`/api/teacher/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 更新指定的教师记录 PUT /api/teacher/${param0} */
export async function putTeacherDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putTeacherDetailApiParams,
  body: API.UpdateTeacher,
  options?: { [key: string]: any }
) {
  const { teacher_uid: param0, ...queryParams } = params;
  return request<any>(`/api/teacher/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 班级绑定教师 POST /api/teacher/bind */
export async function postTeacherBindApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postTeacherBindApiParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/teacher/bind", {
    method: "POST",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 班级解绑教师 DELETE /api/teacher/bind */
export async function deleteTeacherBindApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteTeacherBindApiParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/teacher/bind", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

// @ts-ignore
/* eslint-disable */
import request from "umi-request";

/** 获取学生记录列表，支持分页和条件过滤 GET /api/student/ */
export async function getStudentApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getStudentApiParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/student/", {
    method: "GET",
    params: {
      // page has a default value: 1
      page: "1",
      // size has a default value: 20
      size: "20",

      ...params,
    },
    ...(options || {}),
  });
}

/** 添加新的学生记录 POST /api/student/ */
export async function postStudentApi(
  body: API.Student,
  options?: { [key: string]: any }
) {
  return request<any>("/api/student/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取指定的学生记录详情 GET /api/student/${param0} */
export async function getStudentDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getStudentDetailApiParams,
  options?: { [key: string]: any }
) {
  const { student_uid: param0, ...queryParams } = params;
  return request<any>(`/api/student/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 更新指定的学生记录 PUT /api/student/${param0} */
export async function putStudentDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putStudentDetailApiParams,
  body: API.Student,
  options?: { [key: string]: any }
) {
  const { student_uid: param0, ...queryParams } = params;
  return request<any>(`/api/student/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 删除指定的学生记录 DELETE /api/student/${param0} */
export async function deleteStudentDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteStudentDetailApiParams,
  options?: { [key: string]: any }
) {
  const { student_uid: param0, ...queryParams } = params;
  return request<any>(`/api/student/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 获取指定学生的考试记录列表 GET /api/student/${param0}/exam */
export async function getStudentExamApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getStudentExamApiParams,
  options?: { [key: string]: any }
) {
  const { student_uid: param0, ...queryParams } = params;
  return request<any>(`/api/student/${param0}/exam`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

// @ts-ignore
/* eslint-disable */
import { request } from "@/plugin-request";

/** 查询学生信息 GET /api/student/student */
export async function getStudent(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getStudentParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/student/student", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 修改学生信息 PUT /api/student/student */
export async function putStudent(
  body: API.modifyStudent,
  options?: { [key: string]: any }
) {
  return request<any>("/api/student/student", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 添加学生 POST /api/student/student */
export async function postStudent(
  body: API.addStudent,
  options?: { [key: string]: any }
) {
  return request<any>("/api/student/student", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除学生 DELETE /api/student/student */
export async function deleteStudent(
  body: API.delStudent,
  options?: { [key: string]: any }
) {
  return request<any>("/api/student/student", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

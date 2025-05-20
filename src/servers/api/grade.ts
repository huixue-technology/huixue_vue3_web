// @ts-ignore
/* eslint-disable */
import { request } from "umi";

/** 获取学生成绩(支持过滤条件) GET /api/grade */
export async function getGrade(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGradeParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/grade", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 修改学生成绩 PUT /api/grade */
export async function putGrade(
  body: API.updateGrade,
  options?: { [key: string]: any }
) {
  return request<any>("/api/grade", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 添加学生成绩 POST /api/grade */
export async function postGrade(
  body: API.addGrade,
  options?: { [key: string]: any }
) {
  return request<any>("/api/grade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除学生成绩 DELETE /api/grade */
export async function deleteGrade(
  body: API.delGrade,
  options?: { [key: string]: any }
) {
  return request<any>("/api/grade", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

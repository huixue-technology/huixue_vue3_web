// @ts-ignore
/* eslint-disable */
import request from "umi-request";

/** 获取学生成绩列表，支持分页和条件过滤 GET /api/grade/ */
export async function getGradeApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGradeApiParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/grade/", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 添加学生成绩 POST /api/grade/ */
export async function postGradeApi(
  body: API.Grade,
  options?: { [key: string]: any }
) {
  return request<any>("/api/grade/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 批量删除学生成绩 DELETE /api/grade/ */
export async function deleteGradeApi(
  body: API.BatchDelete,
  options?: { [key: string]: any }
) {
  return request<any>("/api/grade/", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取指定的学生成绩详情 GET /api/grade/${param0} */
export async function getGradeDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGradeDetailApiParams,
  options?: { [key: string]: any }
) {
  const { grade_id: param0, ...queryParams } = params;
  return request<any>(`/api/grade/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 更新指定的学生成绩 PUT /api/grade/${param0} */
export async function putGradeDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putGradeDetailApiParams,
  body: API.Grade,
  options?: { [key: string]: any }
) {
  const { grade_id: param0, ...queryParams } = params;
  return request<any>(`/api/grade/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 删除指定的学生成绩 DELETE /api/grade/${param0} */
export async function deleteGradeDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteGradeDetailApiParams,
  options?: { [key: string]: any }
) {
  const { grade_id: param0, ...queryParams } = params;
  return request<any>(`/api/grade/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 获取指定班级的考试列表 GET /api/grade/class_exam */
export async function getClassExam(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getClassExamParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/grade/class_exam", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取班级成绩(根据考试分数排名) GET /api/grade/class_grade */
export async function getClassGrade(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getClassGradeParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/grade/class_grade", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 根据学生id和对应的考试和班级获取前十名和后十名的信息 GET /api/grade/student_grade */
export async function getStudentGradeRank(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getStudentGradeRankParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/grade/student_grade", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

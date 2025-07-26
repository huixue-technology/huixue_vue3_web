// @ts-ignore
/* eslint-disable */
import request from "umi-request";

/** 与多次考试成绩排名对比分析例： POST /api/analysis/compare_rank_multi_exam */
export async function postCompareRankMultiExam(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postCompareRankMultiExamParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/analysis/compare_rank_multi_exam", {
    method: "POST",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 与其他学生成绩对比分析(仅限同场考试) GET /api/analysis/compare_with_student */
export async function getCompareWithStudent(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getCompareWithStudentParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/analysis/compare_with_student", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取考试小题分数 GET /api/analysis/exam_small_point */
export async function getExamSmallPoint(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getExamSmallPointParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/analysis/exam_small_point", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取对应考试的一本线 GET /api/analysis/pass_line */
export async function getPassLine(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPassLineParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/analysis/pass_line", {
    method: "GET",
    params: {
      // page has a default value: 1
      page: "1",
      // size has a default value: 10
      size: "10",
      ...params,
    },
    ...(options || {}),
  });
}

/** 更新对应考试的一本线 PUT /api/analysis/pass_line */
export async function putPassLine(
  body: API.PassLine,
  options?: { [key: string]: any }
) {
  return request<any>("/api/analysis/pass_line", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除对应考试的一本线 DELETE /api/analysis/pass_line */
export async function deletePassLine(
  body: API.PassLineDelete,
  options?: { [key: string]: any }
) {
  return request<any>("/api/analysis/pass_line", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 进一本线分析 POST /api/analysis/pass_line_analysis */
export async function postPassLineAnalysis(
  body: API.PassLineAnalysis,
  options?: { [key: string]: any }
) {
  return request<any>("/api/analysis/pass_line_analysis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 学生成绩进退步分析 GET /api/analysis/up_down_detail */
export async function getUpDownDetailAnalysis(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getUpDownDetailAnalysisParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/analysis/up_down_detail", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

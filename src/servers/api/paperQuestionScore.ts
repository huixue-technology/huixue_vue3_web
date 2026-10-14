// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 查询小题分明细，支持按学校、试卷、班级、学生、题号筛选。 GET /api/paper-question-score */
export async function getPaperQuestionScore(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPaperQuestionScoreParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/paper-question-score", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 按学校 + 试卷 + 班级删除小题分数据。 DELETE /api/paper-question-score */
export async function deletePaperQuestionScore(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deletePaperQuestionScoreParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/paper-question-score", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

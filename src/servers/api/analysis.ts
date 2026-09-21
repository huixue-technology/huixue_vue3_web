// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 获取班级单场考试分析及当前花名册、参考人数摘要。 返回指定班级、指定考试的分数段、前十名和班级摘要。在班人数取当前有效花名册，本场参考人数与最高分只基于该场成绩记录。 GET /api/analysis/class_analysis */
export async function getClassAnalysis(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getClassAnalysisParams,
  options?: { [key: string]: any }
) {
  return request<API.ClassAnalysisReply>("/api/analysis/class_analysis", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 查询班级指定科目和知识点的最近考试掌握度趋势。 按班级、科目和知识点查询最近若干场有效考试的掌握度趋势。班级掌握率按全班有效小题作答次数计算，参与人数按学生去重；仅内置管理员、普通管理员和目标班级同校教师可访问。 GET /api/analysis/class_knowledge_point_mastery */
export async function getClassKnowledgePointMasteryApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getClassKnowledgePointMasteryApiParams,
  options?: { [key: string]: any }
) {
  return request<API.ClassKnowledgePointMasteryReply>(
    "/api/analysis/class_knowledge_point_mastery",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** 查询班级知识点候选列表。 按班级和科目返回历史班级题目覆盖中的去重知识点候选。候选范围是当前学校中至少有班级成绩覆盖的题目，并按试卷题号只使用最新题目定义；关键词第 0 项按题型处理，后续成员才是知识点，名称去首尾空白后精确去重。keyword 缺失或为空时不筛选，其他值按字符串包含关系筛选；limit 默认 100，范围为 1 至 200。question_count 和 exam_count 描述历史覆盖范围，has_historical_data 只表示历史上存在有效作答，不承诺默认最近考试窗口一定有掌握度结果。仅内置管理员、普通管理员和目标班级同校教师可访问。
Returns:
    Flask ``Response``：成功时使用统一 Reply 包装候选项和过滤后总数。

Raises:
    BadRequest: Flask-RESTX 无法把缺失或格式错误的查询参数解析为声明类型；
        该异常会被转换为 400 Reply，而不会泄露解析细节。 GET /api/analysis/class_knowledge_points */
export async function getClassKnowledgePointsApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getClassKnowledgePointsApiParams,
  options?: { [key: string]: any }
) {
  return request<API.ClassKnowledgePointsReply>(
    "/api/analysis/class_knowledge_points",
    {
      method: "GET",
      params: {
        // limit has a default value: 100
        limit: "100",
        ...params,
      },
      ...(options || {}),
    }
  );
}

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

/** 查询单名学生指定科目和知识点的最近考试掌握度。 GET /api/analysis/knowledge_point_mastery */
export async function getKnowledgePointMasteryApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getKnowledgePointMasteryApiParams,
  options?: { [key: string]: any }
) {
  return request<API.KnowledgePointMasteryReply>(
    "/api/analysis/knowledge_point_mastery",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** 获取对应考试的特控线 GET /api/analysis/pass_line */
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

/** 更新对应考试的特控线 PUT /api/analysis/pass_line */
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

/** 批量删除对应考试的分数线 DELETE /api/analysis/pass_line */
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

/** 进特控线分析 POST /api/analysis/pass_line_analysis */
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

/** 获取模拟成绩的班次和名次 POST /api/analysis/simulate_grade */
export async function postSimulateGrade(
  body: API.SimulateGrade,
  options?: { [key: string]: any }
) {
  return request<any>("/api/analysis/simulate_grade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 学生自我对比分析 GET /api/analysis/student_self_compare */
export async function getStudentSelfCompareApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getStudentSelfCompareApiParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/analysis/student_self_compare", {
    method: "GET",
    params: {
      ...params,
    },
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

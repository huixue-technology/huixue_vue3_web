// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 班级题目统计：查询某次考试某班各题的得分/错误率。 GET /api/wrong-question/class-question-stat */
export async function getClassQuestionStat(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getClassQuestionStatParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/wrong-question/class-question-stat", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 单个题目错题学生名单：查询某题做错的学生列表。 GET /api/wrong-question/class-question-wrong-students */
export async function getClassQuestionWrongStudents(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getClassQuestionWrongStudentsParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/wrong-question/class-question-wrong-students", {
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

/** 批量下载错题docx，传入 question_id 列表。 POST /api/wrong-question/download */
export async function postWrongQuestionDownload(
  body: API.WrongQuestionDownload,
  options?: { [key: string]: any }
) {
  return request<any>("/api/wrong-question/download", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 学生端错题分析，返回个人高频错题知识点及题型统计。 GET /api/wrong-question/recommend/student/${param0} */
export async function getStudentWrongQuestionRecommend(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getStudentWrongQuestionRecommendParams,
  options?: { [key: string]: any }
) {
  const { student_uid: param0, ...queryParams } = params;
  return request<any>(`/api/wrong-question/recommend/student/${param0}`, {
    method: "GET",
    params: {
      // limit has a default value: 20
      limit: "20",
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 教师端错题分析，返回班级高频错题知识点及题型统计。 GET /api/wrong-question/recommend/teacher */
export async function getTeacherWrongQuestionRecommend(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTeacherWrongQuestionRecommendParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/wrong-question/recommend/teacher", {
    method: "GET",
    params: {
      // limit has a default value: 20
      limit: "20",
      ...params,
    },
    ...(options || {}),
  });
}

/** 学生标记错题已复习。 PUT /api/wrong-question/review/student/${param0} */
export async function putStudentWrongQuestionReview(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putStudentWrongQuestionReviewParams,
  body: API.StudentWrongQuestionReview,
  options?: { [key: string]: any }
) {
  const { student_uid: param0, ...queryParams } = params;
  return request<any>(`/api/wrong-question/review/student/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** 学生端错题搜索：按母题组分页，total 为组数，matched_total 为命中错题数。 sub_questions 保留个人得分和订正状态；is_context=true 的母题只提供题干。 GET /api/wrong-question/search/student/${param0} */
export async function getStudentWrongQuestionSearch(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getStudentWrongQuestionSearchParams,
  options?: { [key: string]: any }
) {
  const { student_uid: param0, ...queryParams } = params;
  return request<any>(`/api/wrong-question/search/student/${param0}`, {
    method: "GET",
    params: {
      // page has a default value: 1
      page: "1",
      // size has a default value: 10
      size: "10",

      // max_wrong_rate has a default value: 1
      max_wrong_rate: "1",

      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 教师端错题搜索：按母题组分页，total 为组数，matched_total 为命中错题数。 sub_questions 仅包含命中筛选条件的子题；is_context=true 的母题只提供题干。 GET /api/wrong-question/search/teacher */
export async function getTeacherWrongQuestionSearch(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTeacherWrongQuestionSearchParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/wrong-question/search/teacher", {
    method: "GET",
    params: {
      // page has a default value: 1
      page: "1",
      // size has a default value: 10
      size: "10",

      // max_wrong_rate has a default value: 1
      max_wrong_rate: "1",
      ...params,
    },
    ...(options || {}),
  });
}

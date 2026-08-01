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

/** 重建班级题目统计数据缓存。 POST /api/wrong-question/class-question-stat/rebuild */
export async function postClassQuestionStatRebuild(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postClassQuestionStatRebuildParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/wrong-question/class-question-stat/rebuild", {
    method: "POST",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 班级题目错题学生名单：查询某题做错的学生列表。 GET /api/wrong-question/class-question-wrong-students */
export async function getClassQuestionWrongStudents(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getClassQuestionWrongStudentsParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/wrong-question/class-question-wrong-students", {
    method: "GET",
    params: {
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

/** 学生端错题推荐，基于个人错题记录推荐练习。 GET /api/wrong-question/recommend/student/${param0} */
export async function getStudentWrongQuestionRecommend(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getStudentWrongQuestionRecommendParams,
  options?: { [key: string]: any }
) {
  const { student_uid: param0, ...queryParams } = params;
  return request<any>(`/api/wrong-question/recommend/student/${param0}`, {
    method: "GET",
    params: {
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 教师端错题推荐，基于高频错误知识点推荐练习。 GET /api/wrong-question/recommend/teacher */
export async function getTeacherWrongQuestionRecommend(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTeacherWrongQuestionRecommendParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/wrong-question/recommend/teacher", {
    method: "GET",
    params: {
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

/** 学生端错题搜索，只能查看自己的错题。 GET /api/wrong-question/search/student/${param0} */
export async function getStudentWrongQuestionSearch(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getStudentWrongQuestionSearchParams,
  options?: { [key: string]: any }
) {
  const { student_uid: param0, ...queryParams } = params;
  return request<any>(`/api/wrong-question/search/student/${param0}`, {
    method: "GET",
    params: {
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 教师端错题搜索，支持按科目、年级、班级、题型、关键词等筛选。 GET /api/wrong-question/search/teacher */
export async function getTeacherWrongQuestionSearch(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTeacherWrongQuestionSearchParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/wrong-question/search/teacher", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

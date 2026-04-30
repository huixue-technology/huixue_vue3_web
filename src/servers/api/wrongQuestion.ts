// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 此处后端没有提供注释 GET /api/wrong-question/class-question-stat */
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

/** 此处后端没有提供注释 POST /api/wrong-question/class-question-stat/rebuild */
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

/** 此处后端没有提供注释 GET /api/wrong-question/class-question-wrong-students */
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

/** 此处后端没有提供注释 GET /api/wrong-question/recommend/student/${param0} */
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

/** 此处后端没有提供注释 GET /api/wrong-question/recommend/teacher */
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

/** 此处后端没有提供注释 PUT /api/wrong-question/review/student/${param0} */
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

/** 此处后端没有提供注释 GET /api/wrong-question/search/student/${param0} */
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

/** 此处后端没有提供注释 GET /api/wrong-question/search/teacher */
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

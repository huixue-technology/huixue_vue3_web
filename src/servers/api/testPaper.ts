// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

export type TestPaperQueryParams = {
  page?: number;
  size?: number;
  exam_id?: number;
  subject?: string;
  name?: string;
};

export type TestPaperQuestionScoreQueryParams = {
  page?: number;
  size?: number;
  exam_id?: number;
  test_paper_id?: number;
  student_id?: string;
};

export type TestPaperClassQuestionStatQueryParams = {
  exam_id: number;
  test_paper_id: number;
  class_id: string;
  refresh?: string | number | boolean;
};

export type TestPaperClassQuestionWrongStudentsQueryParams = {
  page?: number;
  size?: number;
  exam_id: number;
  test_paper_id: number;
  class_id: string;
  question_key: string;
  refresh?: string | number | boolean;
};

export type WrongQuestionSearchParams = {
  page?: number;
  size?: number;
  exam_id?: number;
  test_paper_id?: number;
  class_id?: string;
  student_id?: string;
  question_type?: string;
  knowledge_keyword?: string;
  refresh?: string | number | boolean;
};

export type WrongQuestionRecommendParams = {
  exam_id?: number;
  test_paper_id?: number;
  class_id?: string;
  student_id?: string;
  question_type?: string;
  knowledge_keyword?: string;
  limit?: number;
  refresh?: string | number | boolean;
};

export async function getTestPaperApi(
  params: TestPaperQueryParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/tp/", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function getStudentTestPaperApi(
  student_uid: string,
  params: TestPaperQueryParams,
  options?: { [key: string]: any }
) {
  return request<any>(`/api/tp/student/${student_uid}`, {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function getTestPaperQuestionsApi(
  test_paper_id: number,
  options?: { [key: string]: any }
) {
  return request<any>("/api/tp/questions", {
    method: "GET",
    params: { test_paper_id },
    ...(options || {}),
  });
}

export async function getTestPaperQuestionScoreApi(
  params: TestPaperQuestionScoreQueryParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/tp/question-score", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function getTestPaperClassQuestionStatApi(
  params: TestPaperClassQuestionStatQueryParams,
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

export async function getTestPaperClassQuestionWrongStudentsApi(
  params: TestPaperClassQuestionWrongStudentsQueryParams,
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

export async function rebuildTestPaperClassQuestionStatApi(
  params: Pick<TestPaperClassQuestionStatQueryParams, "exam_id" | "test_paper_id">,
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

export async function searchTeacherWrongQuestionApi(
  params: WrongQuestionSearchParams,
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

export async function searchStudentWrongQuestionApi(
  student_uid: string,
  params: Omit<WrongQuestionSearchParams, "student_id">,
  options?: { [key: string]: any }
) {
  return request<any>(`/api/wrong-question/search/student/${student_uid}`, {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

export async function getTeacherWrongQuestionRecommendApi(
  params: WrongQuestionRecommendParams,
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

export async function getStudentWrongQuestionRecommendApi(
  student_uid: string,
  params: Omit<WrongQuestionRecommendParams, "student_id">,
  options?: { [key: string]: any }
) {
  return request<any>(`/api/wrong-question/recommend/student/${student_uid}`, {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

export function getTestPaperFileUrl(path: string) {
  return `/api/tp/file?path=${encodeURIComponent(path || "")}`;
}

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

export function getTestPaperFileUrl(path: string) {
  return `/api/tp/file?path=${encodeURIComponent(path || "")}`;
}

// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 获取高考试卷列表，按科目/年份筛选。 GET /api/gaokao/papers/ */
export async function getGaokaoPapers(
  params: API.getGaokaoPapersParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/gaokao/papers/", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取高考试卷下载地址。 GET /api/gaokao/papers/download/ */
export async function getGaokaoPaperDownloadUrl(
  params: API.getGaokaoPaperDownloadUrlParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/gaokao/papers/download/", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 获取高考试卷列表，可按科目和年份筛选。 GET /api/gaokao/papers/ */
export async function getGaokaoPaperListApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGaokaoPaperListApiParams,
  options?: { [key: string]: any }
) {
  return request<API.GaokaoPaperListResponse>("/api/gaokao/papers/", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取包含 download_url 的高考试卷下载信息列表。 GET /api/gaokao/papers/download/ */
export async function getGaokaoPaperDownloadApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGaokaoPaperDownloadApiParams,
  options?: { [key: string]: any }
) {
  return request<API.GaokaoPaperDownloadListResponse>(
    "/api/gaokao/papers/download/",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

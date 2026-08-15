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

/** 上传高考试卷并写入数据库。 POST /api/gaokao/papers/ */
export async function postGaokaoPaperListApi(
  body: {
    /** 试卷名称 */
    name: string;
    /** 高考科目 */
    subject: string;
    /** 四位年份 */
    year: string;
  },
  file?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === "object" && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ""));
        } else {
          formData.append(
            ele,
            new Blob([JSON.stringify(item)], { type: "application/json" })
          );
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<API.GaokaoPaperUploadResponse>("/api/gaokao/papers/", {
    method: "POST",
    data: formData,
    requestType: "form",
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

/** 公开下载指定高考试卷文件。 GET /api/gaokao/papers/files/${param0}/ */
export async function getGaokaoPaperFileApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGaokaoPaperFileApiParams,
  options?: { [key: string]: any }
) {
  const { paper_id: param0, ...queryParams } = params;
  return request<any>(`/api/gaokao/papers/files/${param0}/`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

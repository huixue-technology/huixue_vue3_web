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

/** 获取单份试卷详情（含题目统计）。 GET /api/gaokao/papers/${param0}/ */
export async function getGaokaoPaperDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGaokaoPaperDetailApiParams,
  options?: { [key: string]: any }
) {
  const { paper_id: param0, ...queryParams } = params;
  return request<API.GaokaoPaperDetailResponse>(
    `/api/gaokao/papers/${param0}/`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 同步解析试卷为题目（不走 Celery）：渲染→切题→跨页合并→缺题占位→裁图→入库。 POST /api/gaokao/papers/${param0}/parse/ */
export async function postGaokaoPaperParseApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postGaokaoPaperParseApiParams,
  options?: { [key: string]: any }
) {
  const { paper_id: param0, ...queryParams } = params;
  return request<API.GaokaoQuestionListResponse>(
    `/api/gaokao/papers/${param0}/parse/`,
    {
      method: "POST",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 列出该试卷已解析/已录入的题目。 GET /api/gaokao/papers/${param0}/questions/ */
export async function getGaokaoPaperQuestionsApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGaokaoPaperQuestionsApiParams,
  options?: { [key: string]: any }
) {
  const { paper_id: param0, ...queryParams } = params;
  return request<API.GaokaoQuestionListResponse>(
    `/api/gaokao/papers/${param0}/questions/`,
    {
      method: "GET",
      params: {
        ...queryParams,
      },
      ...(options || {}),
    }
  );
}

/** 人工新增一道题（用于补录漏切题）。 POST /api/gaokao/papers/${param0}/questions/ */
export async function postGaokaoPaperQuestionsApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postGaokaoPaperQuestionsApiParams,
  body: {
    string_number?: string;
    question_type?: string;
    content?: string;
    options?: string;
    answer?: string;
    score?: number;
    pages?: string;
    images?: string;
  },
  options?: { [key: string]: any }
) {
  const { paper_id: param0, ...queryParams } = params;
  return request<API.GaokaoQuestionItemResponse>(
    `/api/gaokao/papers/${param0}/questions/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    }
  );
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

/** 下发解析时从原页裁出的题目图片（供校对页展示）。 GET /api/gaokao/papers/files/question-image/${param0}/${param1}/ */
export async function getGaokaoQuestionImageApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGaokaoQuestionImageApiParams,
  options?: { [key: string]: any }
) {
  const { question_id: param0, image_index: param1, ...queryParams } = params;
  return request<any>(
    `/api/gaokao/papers/files/question-image/${param0}/${param1}/`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 查询单题详情。 GET /api/gaokao/papers/questions/${param0}/ */
export async function getGaokaoQuestionItemApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getGaokaoQuestionItemApiParams,
  options?: { [key: string]: any }
) {
  const { question_id: param0, ...queryParams } = params;
  return request<API.GaokaoQuestionItemResponse>(
    `/api/gaokao/papers/questions/${param0}/`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 修改一道题（人工校对：修正题干、选项、答案、分值等）。 PUT /api/gaokao/papers/questions/${param0}/ */
export async function putGaokaoQuestionItemApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putGaokaoQuestionItemApiParams,
  body: {
    string_number?: string;
    question_type?: string;
    content?: string;
    answer?: string;
    status?: string;
    options?: string;
    pages?: string;
    images?: string;
    score?: number;
  },
  options?: { [key: string]: any }
) {
  const { question_id: param0, ...queryParams } = params;
  return request<API.GaokaoQuestionItemResponse>(
    `/api/gaokao/papers/questions/${param0}/`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    }
  );
}

/** 删除一道题。 DELETE /api/gaokao/papers/questions/${param0}/ */
export async function deleteGaokaoQuestionItemApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteGaokaoQuestionItemApiParams,
  options?: { [key: string]: any }
) {
  const { question_id: param0, ...queryParams } = params;
  return request<any>(`/api/gaokao/papers/questions/${param0}/`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** 为题目追加一张图片（一题可多图：原卷二次裁切、补充配图等）。 POST /api/gaokao/papers/questions/${param0}/images/ */
export async function postGaokaoQuestionImageUploadApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postGaokaoQuestionImageUploadApiParams,
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const { question_id: param0, ...queryParams } = params;
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

  return request<API.GaokaoQuestionItemResponse>(
    `/api/gaokao/papers/questions/${param0}/images/`,
    {
      method: "POST",
      params: { ...queryParams },
      data: formData,
      requestType: "form",
      ...(options || {}),
    }
  );
}

/** 移除题目的一张图片。 DELETE /api/gaokao/papers/questions/${param0}/images/${param1}/ */
export async function deleteGaokaoQuestionImageDeleteApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteGaokaoQuestionImageDeleteApiParams,
  options?: { [key: string]: any }
) {
  const { question_id: param0, image_index: param1, ...queryParams } = params;
  return request<API.GaokaoQuestionItemResponse>(
    `/api/gaokao/papers/questions/${param0}/images/${param1}/`,
    {
      method: "DELETE",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 此处后端没有提供注释 GET /api/paper-question-score */
export async function getPaperQuestionScore(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getPaperQuestionScoreParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/paper-question-score", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/paper-question-score */
export async function postPaperQuestionScore(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postPaperQuestionScoreParams,
  body: {},
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
          formData.append(ele, JSON.stringify(item));
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<any>("/api/paper-question-score", {
    method: "POST",
    params: {
      ...params,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /api/paper-question-score */
export async function deletePaperQuestionScore(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deletePaperQuestionScoreParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/paper-question-score", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

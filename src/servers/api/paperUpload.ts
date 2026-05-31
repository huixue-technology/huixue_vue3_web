// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 试卷信息上传接口 POST /api/paper_upload/paper */
export async function postPaperUploadApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postPaperUploadApiParams,
  body: {},
  file?: File,
  pdf?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData();

  if (file) {
    formData.append("file", file);
  }

  if (pdf) {
    formData.append("pdf", pdf);
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

  return request<any>("/api/paper_upload/paper", {
    method: "POST",
    params: {
      ...params,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

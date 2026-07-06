// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 分数线上传：前端只需传 exam_id 和 Excel 文件，接口同步入库。 POST /api/score_line_upload/score_line */
export async function postScoreLineUploadApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postScoreLineUploadApiParams,
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

  return request<any>("/api/score_line_upload/score_line", {
    method: "POST",
    params: {
      ...params,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

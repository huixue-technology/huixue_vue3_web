// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 成绩上传：传入已有考试 id 和成绩 Excel，后台 Celery 入库。 POST /api/grade_upload/grade */
export async function postGradeUploadApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postGradeUploadApiParams,
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

  return request<any>("/api/grade_upload/grade", {
    method: "POST",
    params: {
      ...params,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

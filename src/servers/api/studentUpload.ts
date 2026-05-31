// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 学生信息上传：保存 Excel 后立即返回，后台 Celery 慢慢入库。 POST /api/student_upload/student */
export async function postStudentUploadApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postStudentUploadApiParams,
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

  return request<any>("/api/student_upload/student", {
    method: "POST",
    params: {
      ...params,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

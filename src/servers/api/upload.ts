// @ts-ignore
/* eslint-disable */
import  request  from "umi-request";

/** 上传文件（通用接口） POST /api/upload */
export async function postUpload(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postUploadParams,
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

  return request<any>("/api/upload", {
    method: "POST",
    params: {
      ...params,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

/** 删除文件 DELETE /api/upload */
export async function deleteUpload(
  body: API.delFile,
  options?: { [key: string]: any }
) {
  return request<any>("/api/upload", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

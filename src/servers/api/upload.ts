// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 上传文件（通用接口） 支持的上传类型及参数要求：
- grade: 成绩上传（建议传入school_id和exam_id，exam_name可选）
- student: 学生上传（建议传入school_id）
- teacher: 教师上传（建议传入school_id）
- exam_pass_line: 分数线上传（建议传入school_id和exam_id）
- small_point: 小点上传（建议传入exam_id，additional_info中必须包含subject）
- classes: 班级上传（建议传入school_id） POST /api/upload */
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

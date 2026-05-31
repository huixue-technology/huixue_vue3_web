// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 此处后端没有提供注释 DELETE /api/quick_admin/class */
export async function deleteQuickAdminClassDelete(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteQuickAdminClassDeleteParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/quick_admin/class", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/quick_admin/class_import */
export async function postQuickAdminClassImport(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postQuickAdminClassImportParams,
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

  return request<any>("/api/quick_admin/class_import", {
    method: "POST",
    params: {
      ...params,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/quick_admin/exams */
export async function getQuickAdminExamList(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getQuickAdminExamListParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/quick_admin/exams", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 查询学校下各年级班级数量 GET /api/quick_admin/grade_class_count */
export async function getQuickAdminGradeClassCount(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getQuickAdminGradeClassCountParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/quick_admin/grade_class_count", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 查询学校下各年级学生人数 GET /api/quick_admin/grade_student_count */
export async function getQuickAdminGradeStudentCount(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getQuickAdminGradeStudentCountParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/quick_admin/grade_student_count", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /api/quick_admin/pass_line */
export async function deleteQuickAdminPassLineDelete(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteQuickAdminPassLineDeleteParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/quick_admin/pass_line", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/quick_admin/pass_line_import */
export async function postQuickAdminPassLineImport(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postQuickAdminPassLineImportParams,
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

  return request<any>("/api/quick_admin/pass_line_import", {
    method: "POST",
    params: {
      ...params,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /api/quick_admin/score */
export async function deleteQuickAdminScoreDelete(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteQuickAdminScoreDeleteParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/quick_admin/score", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/quick_admin/score_import */
export async function postQuickAdminScoreImport(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postQuickAdminScoreImportParams,
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

  return request<any>("/api/quick_admin/score_import", {
    method: "POST",
    params: {
      ...params,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /api/quick_admin/student */
export async function deleteQuickAdminStudentDelete(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteQuickAdminStudentDeleteParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/quick_admin/student", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/quick_admin/student_import */
export async function postQuickAdminStudentImport(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postQuickAdminStudentImportParams,
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

  return request<any>("/api/quick_admin/student_import", {
    method: "POST",
    params: {
      ...params,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

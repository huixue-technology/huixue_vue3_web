// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 此处后端没有提供注释 GET /api/question-bank-papers */
export async function getQuestionBankPaperCollectionApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getQuestionBankPaperCollectionApiParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/question-bank-papers", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/question-bank-papers */
export async function postQuestionBankPaperCollectionApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postQuestionBankPaperCollectionApiParams,
  body: {
    /** 试卷名称 */
    name?: string;
    /** 卷种 */
    category?: string;
    /** 细项或地区 */
    region?: string;
    /** 科目 */
    subject?: string;
    /** 年份 */
    year?: string;
    /** 备注 */
    description?: string;
  },
  paper_file?: File,
  options?: { [key: string]: any }
) {
  const formData = new FormData();

  if (paper_file) {
    formData.append("paper_file", paper_file);
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

  return request<any>("/api/question-bank-papers", {
    method: "POST",
    params: {
      ...params,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/question-bank-papers/${param0} */
export async function getQuestionBankPaperDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getQuestionBankPaperDetailApiParams,
  options?: { [key: string]: any }
) {
  const { paper_id: param0, ...queryParams } = params;
  return request<any>(`/api/question-bank-papers/${param0}`, {
    method: "GET",
    params: {
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 PUT /api/question-bank-papers/${param0} */
export async function putQuestionBankPaperDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.putQuestionBankPaperDetailApiParams,
  body: API.QuestionBankPaperUpdate,
  options?: { [key: string]: any }
) {
  const { paper_id: param0, ...queryParams } = params;
  return request<any>(`/api/question-bank-papers/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: {
      ...queryParams,
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /api/question-bank-papers/${param0} */
export async function deleteQuestionBankPaperDetailApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteQuestionBankPaperDetailApiParams,
  options?: { [key: string]: any }
) {
  const { paper_id: param0, ...queryParams } = params;
  return request<any>(`/api/question-bank-papers/${param0}`, {
    method: "DELETE",
    params: {
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/question-bank-papers/${param0}/answer-file */
export async function postQuestionBankPaperAnswerFileApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postQuestionBankPaperAnswerFileApiParams,
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const { paper_id: param0, ...queryParams } = params;
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

  return request<any>(`/api/question-bank-papers/${param0}/answer-file`, {
    method: "POST",
    params: {
      ...queryParams,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 DELETE /api/question-bank-papers/${param0}/answer-file */
export async function deleteQuestionBankPaperAnswerFileApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteQuestionBankPaperAnswerFileApiParams,
  options?: { [key: string]: any }
) {
  const { paper_id: param0, ...queryParams } = params;
  return request<any>(`/api/question-bank-papers/${param0}/answer-file`, {
    method: "DELETE",
    params: {
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/question-bank-papers/${param0}/files/${param1} */
export async function getQuestionBankPaperProtectedFileApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getQuestionBankPaperProtectedFileApiParams,
  options?: { [key: string]: any }
) {
  const { paper_id: param0, file_kind: param1, ...queryParams } = params;
  return request<any>(`/api/question-bank-papers/${param0}/files/${param1}`, {
    method: "GET",
    params: {
      ...queryParams,
    },
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 POST /api/question-bank-papers/${param0}/paper-file */
export async function postQuestionBankPaperFileApi(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postQuestionBankPaperFileApiParams,
  body: {},
  file?: File,
  options?: { [key: string]: any }
) {
  const { paper_id: param0, ...queryParams } = params;
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

  return request<any>(`/api/question-bank-papers/${param0}/paper-file`, {
    method: "POST",
    params: {
      ...queryParams,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

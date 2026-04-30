// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 查询试卷列表 试卷主数据接口：上传试卷、查询试卷列表、删除试卷。
按考试、学校、年级、年份、学期、科目、名称等条件查询试卷，并补充考试名称、考试年份等展示字段。 GET /api/tp/ */
export async function getTestPaper(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTestPaperParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/tp/", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 上传试卷题目表 试卷主数据接口：上传试卷、查询试卷列表、删除试卷。
上传 xlsx 试卷题目表，创建试卷记录并解析题目、题型、分值和题目图片。文件表头需要包含题号、题型、分值、题目图片。 POST /api/tp/ */
export async function postTestPaper(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.postTestPaperParams,
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

  return request<any>("/api/tp/", {
    method: "POST",
    params: {
      ...params,
    },
    data: formData,
    requestType: "form",
    ...(options || {}),
  });
}

/** 删除试卷 试卷主数据接口：上传试卷、查询试卷列表、删除试卷。
按试卷ID删除试卷，同时清理该试卷下的题目和题目图片等关联资源。 DELETE /api/tp/ */
export async function deleteTestPaper(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteTestPaperParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/tp/", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 读取试卷相关文件 试卷/题目文件读取接口：用于访问本地或 OSS 中保存的试卷文件、题目图片。
根据存储路径返回文件内容。上传解析出的图片通常会以 /api/tp/file?path=... 的形式给前端访问。 GET /api/tp/file */
export async function getTestPaperFile(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTestPaperFileParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/tp/file", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 查询小题分 小题分接口：查询或删除学生在某场考试某张试卷中的小题得分。
按考试、试卷、学生筛选小题分记录；默认会补充学生姓名和班级，便于前端列表展示。 GET /api/tp/question-score */
export async function getTestPaperQuestionScore(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTestPaperQuestionScoreParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/tp/question-score", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 删除小题分 小题分接口：查询或删除学生在某场考试某张试卷中的小题得分。
删除指定考试和试卷下的全部小题分，同时清理对应错题统计缓存。 DELETE /api/tp/question-score */
export async function deleteTestPaperQuestionScore(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteTestPaperQuestionScoreParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/tp/question-score", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 查询试卷题目 试卷题目接口：查看、编辑、删除某张试卷下的题目。
根据 test_paper_id 查询试卷下所有题目，paper_id 是兼容旧前端的别名参数。 GET /api/tp/questions */
export async function getTestPaperQuestion(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getTestPaperQuestionParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/tp/questions", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 试卷题目接口：查看、编辑、删除某张试卷下的题目。
通过 JSON body 批量更新题号、题型、关键词、分值、图片、答案、正确率等题目信息。 PUT /api/tp/questions */
export async function putTestPaperQuestion(options?: { [key: string]: any }) {
  return request<any>("/api/tp/questions", {
    method: "PUT",
    ...(options || {}),
  });
}

/** 删除单个题目 试卷题目接口：查看、编辑、删除某张试卷下的题目。
删除指定试卷下的一个题目，并清理该题目关联的图片资源。 DELETE /api/tp/questions */
export async function deleteTestPaperQuestion(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.deleteTestPaperQuestionParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/tp/questions", {
    method: "DELETE",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 查询学生试卷列表 学生视角试卷接口：查询某个学生实际参与过的试卷。
根据学生UID查询该学生有小题分记录的试卷，可按考试、科目、年级等条件筛选。 GET /api/tp/student/${param0} */
export async function getStudentTestPaper(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getStudentTestPaperParams,
  options?: { [key: string]: any }
) {
  const { student_uid: param0, ...queryParams } = params;
  return request<any>(`/api/tp/student/${param0}`, {
    method: "GET",
    params: {
      ...queryParams,
    },
    ...(options || {}),
  });
}

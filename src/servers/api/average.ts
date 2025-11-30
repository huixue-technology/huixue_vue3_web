// @ts-ignore
/* eslint-disable */
import request from "umi-request";

/** 获取班级经常排名靠前或靠后的学生 POST /api/average/class_always_top_bottom_students */
export async function postClassAlwaysTopBottomStudents(
  body: API.ClassAnalysis,
  options?: { [key: string]: any }
) {
  return request<any>("/api/average/class_always_top_bottom_students", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取班级成绩综合分析 POST /api/average/class_analysis */
export async function postClassAnalysis(
  body: API.ClassAnalysis,
  options?: { [key: string]: any }
) {
  return request<any>("/api/average/class_analysis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 根据考试分数线和成绩判断优等生，边缘生，差生 POST /api/average/class_comprehensive_student_grades */
export async function postClassComprehensiveStudentGrades(
  body: API.ClassAnalysis,
  options?: { [key: string]: any }
) {
  return request<any>("/api/average/class_comprehensive_student_grades", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 计算班级成绩综合分析 POST /api/average/class_compute */
export async function postClassCompute(
  body: API.Compute,
  options?: { [key: string]: any }
) {
  return request<any>("/api/average/class_compute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取班级四条分数线过线率 POST /api/average/class_pass_line_rate */
export async function postClassPassLineRate(
  body: API.ClassAnalysis,
  options?: { [key: string]: any }
) {
  return request<any>("/api/average/class_pass_line_rate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取学生平均分分析 POST /api/average/student_average_analysis */
export async function postStudentAverageAnalysis(
  body: API.StudentAverage,
  options?: { [key: string]: any }
) {
  return request<any>("/api/average/student_average_analysis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

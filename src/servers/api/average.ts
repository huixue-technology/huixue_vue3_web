// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

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

/** 计算班级成绩综合分析 POST /api/average/class_compute_test */
export async function postClassComputeTest(
  body: API.Compute,
  options?: { [key: string]: any }
) {
  return request<any>("/api/average/class_compute_test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取班级四条线累计进线人次、有效参考人次和过线率。 返回班级全部有效考试累计的清北、985、211、一本/特控线统计。pass_count 与 actual_count 的单位为人次，不是去重学生人数。 POST /api/average/class_pass_line_rate */
export async function postClassPassLineRate(
  body: API.ClassAnalysis,
  options?: { [key: string]: any }
) {
  return request<API.ClassPassLineRateReply>(
    "/api/average/class_pass_line_rate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** 获取班级特控线过线率排名 POST /api/average/class_students_one_line_rate */
export async function postClassAlwaysTopBottomStudents(
  body: API.ClassAnalysis,
  options?: { [key: string]: any }
) {
  return request<any>("/api/average/class_students_one_line_rate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取学生平均分分析（直接查询数据库） POST /api/average/student_average_analysis */
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

/** 查询任务状态 POST /api/average/task_status */
export async function postTaskStatus(
  body: API.TaskStatus,
  options?: { [key: string]: any }
) {
  return request<any>("/api/average/task_status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

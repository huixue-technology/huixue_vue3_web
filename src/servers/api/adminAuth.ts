// @ts-ignore
/* eslint-disable */
import request from "@/utils/request";

/** 管理员以指定学生/老师身份换取短期 token POST /api/admin/impersonate */
export async function postAdminImpersonate(
  body: {
    target: "student" | "teacher";
    student_uid?: string;
    class_id?: number;
    teacher_uid?: string;
  },
  options?: { [key: string]: any }
) {
  return request<any>("/api/admin/impersonate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

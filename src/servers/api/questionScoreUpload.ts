import request from "@/utils/request";

/** 上传后由后端覆盖文件中对应班级的小题分。 */
export async function postQuestionScoreUploadApi(
  params: API.postQuestionScoreUploadApiParams,
  body: Record<string, never>,
  file?: File,
  options?: Record<string, unknown>
) {
  if (!file || !params.school_id?.trim() || !Number.isInteger(params.paper_id) || params.paper_id <= 0) {
    throw new Error("请选择文件并提供有效的学校和试卷 ID");
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("school_id", params.school_id);
  formData.append("paper_id", String(params.paper_id));
  return request("/api/question_score_upload/question_score", {
    method: "POST",
    data: formData,
    ...options,
  });
}

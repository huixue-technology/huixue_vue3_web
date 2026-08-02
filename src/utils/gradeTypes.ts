/**
 * 成绩相关自定义类型（不随 openapi 重新生成覆盖）
 *
 * 后端 GET 接口返回的是「聚合后的嵌套结构」：{ total_score, subjects: { "语文": {score, class_rank, school_rank} } }，
 * 而 openapi 从 swagger 生成的 API.Grade 是「行式」DB 模型（subject/score 一行一科）。
 * 这里补充嵌套结构类型供视图读取使用。
 */

export interface GradeSubject {
  /** 成绩 */
  score?: number;
  /** 班次（班级排名） */
  class_rank?: number;
  /** 段次（学校排名） */
  school_rank?: number;
}

/** 聚合后的学生成绩（后端 GET 返回） */
export interface GradeDetail {
  /** 成绩id */
  id?: number;
  /** 学生id */
  student_id: number;
  /** 学校id */
  school_id: string;
  /** 考试id */
  exam_id: number;
  /** 考试班级 */
  class_id: number;
  /** 学生姓名 */
  student_name?: string;
  /** 总分（原 sum_） */
  total_score?: number;
  /** 各科成绩，键为中文科目名（如 语文/数学/总分） */
  subjects?: Record<string, GradeSubject>;
  /** 是否显示 */
  show?: boolean;
}

declare namespace API {
  type BatchDelete = {
    /** 要删除的学校ID */
    school_id: string;
    /** 要删除的考试ID */
    exam_id: number;
    /** 要删除的ID列表 */
    student_ids: number[];
  };

  type BatchDeleteStudent = {
    /** 要删除的学生ID列表(与grade二选一) */
    student_ids?: number[];
    /** 学生年级(与student_ids二选一) */
    grade?: string;
  };

  type BatchDeleteTeacher = {
    /** 教师ID列表 */
    teacher_ids: string[];
  };

  type BatchStudent = {
    /** 学生ID列表 */
    student_ids: string[];
  };

  type BindStatus = {
    /** 用户ID */
    id: string;
    /** 绑定的学校 */
    school: string;
    /** 绑定的班级 */
    class_id: string;
    /** 绑定的学生 */
    stuName: string;
  };

  type ClassAnalysis = {
    /** 班级ID */
    class_ids: number[];
    /** 任务ID（用于查询异步任务状态） */
    task_id?: string;
  };

  type Classes = {
    /** 班级ID */
    id?: number;
    /** 班级名称 */
    name: string;
    /** 班主任ID */
    header: string;
    /** 学校ID */
    school_id: string;
    /** 选科 */
    subject_selection: string;
  };

  type Compute = {
    /** 班级ID */
    class_id: string;
  };

  type deleteClassesDetailApiParams = {
    class_id: number;
  };

  type deleteExamDetailApiParams = {
    exam_id: number;
  };

  type deleteGradeDetailApiParams = {
    grade_id: number;
  };

  type deleteSchoolDetailApiParams = {
    school_id: string;
  };

  type deleteTeacherBindApiParams = {
    /** 班级id */
    class: number;
  };

  type deleteUserDetailApiParams = {
    user_id: string;
  };

  type delFile = {
    /** 文件路径 */
    file_path: string;
  };

  type Exam = {
    /** 考试ID */
    id?: number;
    /** 考试名称 */
    name: string;
    /** 考试年份 */
    year: string;
    /** 考试类型：1代表高三的文理科，2代表高一、高二的选科 */
    exam_type?: string;
    /** 考试年级 */
    student_grade?: string;
    /** 考试试卷ID列表，以逗号分隔 */
    exam_paper_ids?: string;
  };

  type getClassAnalysisParams = {
    /** 班级id */
    class_id: number;
    /** 考试id */
    exam_id: number;
  };

  type getClassCompareParams = {
    /** 班级ID */
    class_id: number;
    /** 考试ID */
    exam_id: number;
    /** 需要对比的班级ID */
    compare_class_id: number;
  };

  type getClassesApiParams = {
    /** 页码 */
    page?: number;
    /** 每页记录数 */
    size?: number;
    /** 班级id */
    id?: number;
    /** 班级名称（可选） */
    name?: string;
    /** 班主任（可选） */
    header?: string;
    /** 学校ID（可选） */
    school_id?: string;
  };

  type getClassesDetailApiParams = {
    class_id: number;
  };

  type getClassExamParams = {
    /** 班级ID */
    class_id: string;
  };

  type getClassGradeParams = {
    /** 班级id */
    class_id: string;
    /** 选中考试id */
    selected_exam_id: number;
    /** 科目筛选(如: sum_, yuwen, shuxue等) */
    subject?: string;
    /** 排序方向(asc:升序, desc:降序) */
    order_direction?: string;
    /** 最低分数 */
    min_score?: number;
    /** 最高分数 */
    max_score?: number;
    /** 靠前排名 */
    min_rank?: number;
    /** 靠后排名 */
    max_rank?: number;
    /** 分数线上下范围(如: ±10分) */
    pass_line_offset?: number;
    /** 分数线id */
    pass_line_id?: number;
    /** 学生id */
    student_id?: string;
    /** 最小班级排名 */
    min_class_rank?: number;
    /** 最大班级排名 */
    max_class_rank?: number;
  };

  type getClassScoreParams = {
    /** 班级ID */
    class_id: number;
    /** 考试ID */
    exam_id: number;
  };

  type getCompareWithStudentParams = {
    /** 学生id */
    student_id: string;
    /** 对比学生id */
    compare_student_id: string;
    /** 选中考试id */
    selected_exam_id: number;
  };

  type getExamApiParams = {
    /** 页码 */
    page?: number;
    /** 每页记录数 */
    size?: number;
    /** 考试名称（可选） */
    name?: string;
    /** 考试年份（可选） */
    year?: string;
    /** 考试类型（可选） */
    exam_type?: string;
    /** 学生年级（可选） */
    student_grade?: string;
  };

  type getExamDetailApiParams = {
    exam_id: number;
  };

  type getExamSmallPointParams = {
    /** 考试id */
    exam_id: string;
    /** 科目 */
    subject: string;
    /** 学生id */
    student_id: string;
  };

  type getGradeApiParams = {
    /** 页码 */
    page?: number;
    /** 每页记录数 */
    size?: number;
    /** 学生ID（可选） */
    student_id?: string;
    /** 学校ID（可选） */
    school_id?: string;
    /** 考试ID（可选） */
    exam_id?: number;
    /** 班级ID（可选） */
    class_id?: string;
  };

  type getGradeDetailApiParams = {
    grade_id: number;
  };

  type getPassLineParams = {
    /** 考试id */
    exam_id?: number;
    /** 页码 */
    page?: number;
    /** 每页记录数 */
    size?: number;
  };

  type getSameGradeClassListParams = {
    /** 学校id */
    school_id: string;
    /** 对应年级 */
    grade: string;
  };

  type getSchoolApiParams = {
    /** 页码 */
    page?: number;
    /** 每页记录数 */
    size?: number;
    /** 学校ID（可选） */
    school_id?: string;
    /** 学校名称（可选） */
    name?: string;
  };

  type getSchoolDetailApiParams = {
    school_id: string;
  };

  type getStudentApiParams = {
    /** 页码 */
    page?: number;
    /** 每页记录数 */
    size?: number;
    /** 学生学号（可选） */
    uid?: string;
    /** 学生姓名（可选） */
    name?: string;
    /** 学生所属学校ID（可选） */
    school?: string;
    /** 学生年级（可选） */
    grade?: string;
    /** 学生班级ID（可选） */
    class_id?: number;
    /** 学生所属选课（可选） */
    subject_selection?: string;
    /** 学生是否在读（可选） */
    state?: boolean;
  };

  type getStudentDetailApiParams = {
    student_uid: string;
  };

  type getStudentExamApiParams = {
    student_uid: string;
  };

  type getStudentGradeRankParams = {
    /** 选中考试id */
    selected_exam_id: number;
    /** 学生id */
    student_id: string;
  };

  type getStudentSelfCompareApiParams = {
    /** 学生ID */
    student_id?: number;
    /** 考试ID */
    exam_id?: number;
    /** 对比的考试ID */
    compared_exam_id?: number;
  };

  type getTeacherApiParams = {
    /** 页码 */
    page?: number;
    /** 每页记录数 */
    size?: number;
    /** 教师工号（可选） */
    uid?: string;
    /** 教师姓名（可选） */
    name?: string;
    /** 所教科目（可选） */
    subject?: string;
    /** 学校ID（可选） */
    school_id?: string;
  };

  type getTeacherDetailApiParams = {
    teacher_uid: string;
  };

  type getUpDownDetailAnalysisParams = {
    /** 学生id */
    student_id: string;
    /** 最近几次成绩 */
    nums: number;
  };

  type getUserApiParams = {
    /** 页码 */
    page?: number;
    /** 每页记录数 */
    size?: number;
    /** 用户ID（可选） */
    id?: string;
    /** 用户名（可选） */
    name?: string;
    /** 手机号（可选） */
    phone?: string;
    /** 微信ID（可选） */
    wxid?: string;
    /** 学校ID（可选） */
    school_id?: string;
    /** 角色（可选） */
    role?: string;
    /** 邮箱（可选） */
    email?: string;
    /** 绑定状态（可选） */
    bind_state?: boolean;
  };

  type getUserDetailApiParams = {
    user_id: string;
  };

  type Grade = {
    /** 成绩id */
    id?: number;
    /** 学生id */
    student_id: number;
    /** 学校id */
    school_id: number;
    /** 考试id */
    exam_id: number;
    /** 考试班级 */
    class_id: number;
    /** 总分 */
    sum_: number;
    /** 总分班次 */
    sumb: number;
    /** 总分段次 */
    sumd: number;
    /** 语文 */
    yuwen?: number;
    /** 英语 */
    yingyu?: number;
    /** 物理 */
    wuli?: number;
    /** 数学 */
    shuxue?: number;
    /** 生物 */
    shengwu?: number;
    /** 历史 */
    lishi?: number;
    /** 地理 */
    dili?: number;
    /** 政治 */
    zhengzhi?: number;
    /** 化学 */
    huaxue?: number;
    /** 语文D */
    yuwend?: number;
    /** 英语D */
    yingyud?: number;
    /** 物理D */
    wulid?: number;
    /** 数学D */
    shuxued?: number;
    /** 生物D */
    shengwud?: number;
    /** 历史D */
    lishid?: number;
    /** 地理D */
    dilid?: number;
    /** 政治D */
    zhengzhid?: number;
    /** 化学D */
    huaxued?: number;
    /** 是否显示 */
    show?: boolean;
    /** 语文班次 */
    yuwenb?: number;
    /** 英语班次 */
    yingyub?: number;
    /** 物理班次 */
    wulib?: number;
    /** 数学班次 */
    shuxueb?: number;
    /** 生物班次 */
    shengwub?: number;
    /** 历史班次 */
    lishib?: number;
    /** 地理班次 */
    dilib?: number;
    /** 政治班次 */
    zhengzhib?: number;
    /** 化学班次 */
    huaxueb?: number;
  };

  type Login = {
    /** 用户邮箱 */
    email: string;
    /** 用户密码 */
    password: string;
  };

  type PassLine = {
    /** 考试id */
    exam_id: number;
    /** 学校id */
    school_id: number;
    /** 总分 */
    sum_: number;
    /** 总分排名 */
    sumd: number;
    /** 语文 */
    yuwen: number;
    /** 语文排名 */
    yuwend: number;
    /** 英语 */
    yingyu: number;
    /** 英语排名 */
    yingyud: number;
    /** 物理 */
    wuli: number;
    /** 物理排名 */
    wulid: number;
    /** 数学 */
    shuxue: number;
    /** 数学排名 */
    shuxued: number;
    /** 生物 */
    shengwu: number;
    /** 生物排名 */
    shengwud: number;
    /** 历史 */
    lishi: number;
    /** 历史排名 */
    lishid: number;
    /** 地理 */
    dili: number;
    /** 地理排名 */
    dilid: number;
    /** 政治 */
    zhengzhi: number;
    /** 政治排名 */
    zhengzhid: number;
    /** 化学 */
    huaxue: number;
    /** 化学排名 */
    huaxued: number;
  };

  type PassLineAnalysis = {
    /** 学生id */
    student_id: number;
    /** 考试id列表 */
    exam_ids: number[];
  };

  type PassLineDelete = {
    /** 考试id列表 */
    exam_ids: number[];
  };

  type postCompareRankMultiExamParams = {
    /** 学生id */
    student_id: string;
    /** 选中考试id */
    selected_exam_id: number;
    /** 需要对比的考试id列表例："20250522,20250524" */
    compare_exam_ids: string;
  };

  type postTeacherBindApiParams = {
    /** 教师ID */
    teacher_id: number;
    /** 班级id */
    class_id: number;
  };

  type postUploadParams = {
    /** 请选择上传类型 */
    type: string;
    /** 附加信息JSON格式（可选）{"exam_id": 1, "subject": 2}（可选） */
    additional_info?: string;
  };

  type putClassesDetailApiParams = {
    class_id: number;
  };

  type putExamDetailApiParams = {
    exam_id: number;
  };

  type putGradeDetailApiParams = {
    grade_id: number;
  };

  type putSchoolDetailApiParams = {
    school_id: string;
  };

  type putStudentDetailApiParams = {
    student_uid: string;
  };

  type putTeacherDetailApiParams = {
    teacher_uid: string;
  };

  type putUserDetailApiParams = {
    user_id: string;
  };

  type School = {
    /** 学校ID */
    school_id: string;
    /** 学校名称 */
    name: string;
  };

  type SimulateGrade = {
    /** 考试id */
    exam_id: number;
    /** 班级id */
    class_id: string;
    /** 学校id */
    school_id: string;
    /** 语文 */
    yuwen: number;
    /** 英语 */
    yingyu: number;
    /** 物理 */
    wuli: number;
    /** 数学 */
    shuxue: number;
    /** 生物 */
    shengwu: number;
    /** 历史 */
    lishi: number;
    /** 地理 */
    dili: number;
    /** 政治 */
    zhengzhi: number;
    /** 化学 */
    huaxue: number;
    /** 总分 */
    sum_: number;
  };

  type Student = {
    /** 学生学号 */
    uid: string;
    /** 学生姓名 */
    name: string;
    /** 学生所属学校ID */
    school?: number;
    /** 学生年级 */
    grade?: string;
    /** 学生班级ID */
    class_id?: number;
    /** 学生所属选课ID */
    subject_selection?: number;
    /** 学生是否在读 */
    state?: boolean;
  };

  type StudentAverage = {
    /** 学生ID */
    student_id: string[];
  };

  type TaskStatus = {
    /** 任务ID */
    task_id: string;
  };

  type Teacher = {
    /** 教师工号 */
    uid: string;
    /** 教师姓名 */
    name: string;
    /** 教师密码 */
    password: string;
    /** 所教科目 */
    subject?: string;
    /** 学校ID */
    school_id?: string;
  };

  type UpdateTeacher = {
    /** 教师姓名 */
    name?: string;
    /** 所教科目 */
    subject?: string;
    /** 学校ID */
    school_id?: string;
  };

  type User = {
    /** 用户ID */
    id?: string;
    /** 用户名 */
    name: string;
    /** 手机号 */
    phone?: string;
    /** 密码 */
    password?: string;
    /** 微信ID */
    wxid?: string;
    /** 学校ID */
    school_id?: string;
    /** 角色 */
    role?: string;
    /** 邮箱 */
    email: string;
    /** 绑定状态 */
    bind_state?: boolean;
  };
}

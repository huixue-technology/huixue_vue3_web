declare namespace API {
  type BindStatus = {
    /** 绑定ID */
    bind_id: string;
    /** 用户ID */
    id: string;
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

  type deleteStudentDetailApiParams = {
    student_uid: string;
  };

  type deleteTeacherDetailApiParams = {
    teacher_uid: string;
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

  type getClassGradeParams = {
    /** 班级id */
    class_id: string;
    /** 选中考试id */
    selected_exam_id: string;
  };

  type getCompareWithStudentParams = {
    /** 学生id */
    student_id: string;
    /** 对比学生id */
    compare_student_id: string;
    /** 选中考试id */
    selected_exam_id: string;
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
    student_id?: number;
    /** 学校ID（可选） */
    school_id?: number;
    /** 考试ID（可选） */
    exam_id?: number;
    /** 班级ID（可选） */
    class_id?: number;
  };

  type getGradeDetailApiParams = {
    grade_id: number;
  };

  type getPassLineAnalysisParams = {
    /** 学生id */
    student_id: number;
    /** 最近几次成绩 */
    nums: number;
  };

  type getPassLineParams = {
    /** 考试id */
    exam_id?: number;
    /** 页码 */
    page?: number;
    /** 每页记录数 */
    size?: number;
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
    student_id: number;
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
    sumB: number;
    /** 总分段次 */
    sumD: number;
    /** 语文 */
    Yuwen?: number;
    /** 英语 */
    Yingyu?: number;
    /** 物理 */
    Wuli?: number;
    /** 数学 */
    Shuxue?: number;
    /** 生物 */
    Shengwu?: number;
    /** 历史 */
    Lishi?: number;
    /** 地理 */
    Dili?: number;
    /** 政治 */
    Zhengzhi?: number;
    /** 化学 */
    Huaxue?: number;
    /** 语文D */
    YuwenD?: number;
    /** 英语D */
    YingyuD?: number;
    /** 物理D */
    WuliD?: number;
    /** 数学D */
    ShuxueD?: number;
    /** 生物D */
    ShengwuD?: number;
    /** 历史D */
    LishiD?: number;
    /** 地理D */
    DiliD?: number;
    /** 政治D */
    ZhengzhiD?: number;
    /** 化学D */
    HuaxueD?: number;
    /** 是否显示 */
    show?: boolean;
    /** 语文班次 */
    YuwenB?: number;
    /** 英语班次 */
    YingyuB?: number;
    /** 物理班次 */
    WuliB?: number;
    /** 数学班次 */
    ShuxueB?: number;
    /** 生物班次 */
    ShengwuB?: number;
    /** 历史班次 */
    LishiB?: number;
    /** 地理班次 */
    DiliB?: number;
    /** 政治班次 */
    ZhengzhiB?: number;
    /** 化学班次 */
    HuaxueB?: number;
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
    sumD: number;
    /** 语文 */
    Yuwen: number;
    /** 语文排名 */
    YuwenD: number;
    /** 英语 */
    Yingyu: number;
    /** 英语排名 */
    YingyuD: number;
    /** 物理 */
    Wuli: number;
    /** 物理排名 */
    WuliD: number;
    /** 数学 */
    Shuxue: number;
    /** 数学排名 */
    ShuxueD: number;
    /** 生物 */
    Shengwu: number;
    /** 生物排名 */
    ShengwuD: number;
    /** 历史 */
    Lishi: number;
    /** 历史排名 */
    LishiD: number;
    /** 地理 */
    Dili: number;
    /** 地理排名 */
    DiliD: number;
    /** 政治 */
    Zhengzhi: number;
    /** 政治排名 */
    ZhengzhiD: number;
    /** 化学 */
    Huaxue: number;
    /** 化学排名 */
    HuaxueD: number;
  };

  type PassLineDelete = {
    /** 考试id */
    exam_id: number;
  };

  type postCompareRankMultiExamParams = {
    /** 学生id */
    student_id: number;
    /** 选中考试id */
    selected_exam_id: number;
    /** 需要对比的考试id列表 */
    compare_exam_ids: string;
  };

  type postUploadParams = {
    /** 请选择上传类型 */
    type: string;
    /** 附加信息JSON格式（可选）{"exam_id": 1, "subject": 2}（可选） */
    additional_info?: string;
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

  type Teacher = {
    /** 教师工号 */
    uid: string;
    /** 教师姓名 */
    name: string;
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
    password: string;
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

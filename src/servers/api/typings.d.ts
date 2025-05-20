declare namespace API {
  type addGrade = {
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
    yuwenD?: number;
    /** 英语D */
    yingyuD?: number;
    /** 物理D */
    wuliD?: number;
    /** 数学D */
    shuxueD?: number;
    /** 生物D */
    shengwuD?: number;
    /** 历史D */
    lishiD?: number;
    /** 地理D */
    diliD?: number;
    /** 政治D */
    zhengzhiD?: number;
    /** 化学D */
    huaxueD?: number;
    /** 是否显示 */
    show?: boolean;
  };

  type addSchool = {
    /** 学校id */
    school_id: string;
    /** 学校名称 */
    name: string;
  };

  type addStudent = {
    /** 学生学号 */
    uid: string;
    /** 学生姓名 */
    name: string;
    /** 学生所属学校 */
    school_id?: string;
    /** 学生年级 */
    grade?: string;
    /** 学生班级 */
    class_id?: string;
    /** 学生所属选课 */
    subject_selection_id?: string;
    /** 学生是否在读 */
    state?: boolean;
  };

  type addTeacher = {
    /** 教师id */
    tid: string;
    /** 教师姓名 */
    name: string;
    /** 所教科目 */
    subject?: string;
    /** 学校id */
    school_id?: string;
  };

  type bindStatus = {
    /** 绑定id */
    bind_id: string;
    /** 用户id */
    id: string;
  };

  type del = {
    /** 用户id */
    id: string;
  };

  type delFile = {
    /** 文件路径 */
    file_path: string;
  };

  type delGrade = {
    /** 成绩id */
    id?: number;
  };

  type delSchool = {
    /** 学校id */
    school_id?: string;
  };

  type delStudent = {
    /** 学生学号 */
    uid: string;
  };

  type delTeacher = {
    /** 教师id */
    tid: string;
  };

  type getGradeParams = {
    /** 过滤条件 */
    filter?: string;
    /** 页码 */
    page?: number;
    /** 每页数量 */
    size?: number;
  };

  type getSchoolParams = {
    /** 查询条件 */
    filter?: string;
    /** 页码 */
    page?: number;
    /** 每页数量 */
    size?: number;
  };

  type getStudentParams = {
    /** 查询条件 */
    filter?: string;
    /** 页数 */
    page?: number;
    /** 每页数量 */
    page_size?: number;
  };

  type getTeacherParams = {
    /** 筛选条件 */
    filter?: string;
    /** 页码 */
    page?: number;
    /** 每页数量 */
    size?: number;
  };

  type getUserParams = {
    /** 查询条件 */
    filter?: string;
    /** 页码 */
    page?: number;
    /** 每页数量 */
    size?: number;
  };

  type login = {
    /** 用户邮箱 */
    email: string;
    /** 用户密码 */
    password: string;
  };

  type modify = {
    /** 用户id */
    id?: string;
    /** 用户名 */
    name?: string;
    /** 微信id */
    wxid?: string;
    /** 角色 */
    role?: string;
    /** 学校id */
    school_id?: string;
    /** 手机号 */
    phone?: string;
    /** 邮箱 */
    email?: string;
    /** 密码 */
    password?: string;
    /** 绑定id */
    bind_state?: boolean;
  };

  type modifySchool = {
    /** 学校id */
    school_id: string;
    /** 学校名称 */
    name: string;
  };

  type modifyStudent = {
    /** 学生学号 */
    uid: string;
    /** 学生姓名 */
    name?: string;
    /** 学生所属学校 */
    school_id?: string;
    /** 学生年级 */
    grade?: string;
    /** 学生班级 */
    class_id?: string;
    /** 学生所属选课 */
    subject_selection_id?: string;
    /** 学生是否在读 */
    state?: boolean;
  };

  type postUploadParams = {
    /** 请选择上传类型 */
    type: string;
  };

  type register = {
    /** 用户名 */
    name: string;
    /** 微信id */
    wxid?: string;
    /** 角色 */
    role?: string;
    /** 学校id */
    school_id?: string;
    /** 手机号 */
    phone?: string;
    /** 邮箱 */
    email: string;
    /** 密码 */
    password: string;
    /** 绑定状态 */
    bind_state?: boolean;
  };

  type updateGrade = {
    /** 成绩id */
    id?: number;
    /** 学生id */
    student_id?: number;
    /** 学校id */
    school_id?: number;
    /** 考试id */
    exam_id?: number;
    /** 考试班级 */
    class_id?: number;
    /** 总分 */
    sum_?: number;
    /** 总分班次 */
    sumB?: number;
    /** 总分段次 */
    sumD?: number;
    /** 是否显示 */
    show?: boolean;
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
    yuwenD?: number;
    /** 英语D */
    yingyuD?: number;
    /** 物理D */
    wuliD?: number;
    /** 数学D */
    shuxueD?: number;
    /** 生物D */
    shengwuD?: number;
    /** 历史D */
    lishiD?: number;
    /** 地理D */
    diliD?: number;
    /** 政治D */
    zhengzhiD?: number;
    /** 化学D */
    huaxueD?: number;
  };

  type updateTeacher = {
    /** 教师id */
    tid: string;
    /** 教师姓名 */
    name?: string;
    /** 所教科目 */
    subject?: string;
    /** 学校id */
    school_id?: string;
  };
}

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

  type CartAdd = {
    /** 学生 ID */
    student_id: string;
    /** 题目 ID */
    test_question_id: string;
    /** 试卷 ID */
    test_paper_id?: string;
    /** 是否需要答案解析 */
    require_analysis?: boolean;
  };

  type CartBatchRemove = {
    /** 要移除的购物车条目 ID 列表 */
    ids: number[];
  };

  type CartMarkReviewed = {
    /** 是否已复习 */
    reviewed?: boolean;
  };

  type CartUpdate = {
    /** 试卷 ID */
    test_paper_id?: string;
    /** 是否需要答案解析 */
    require_analysis?: boolean;
    /** 是否已复习 */
    is_reviewed?: boolean;
  };

  type ClassAnalysis = {
    /** 班级ID */
    class_ids: number[];
  };

  type ClassAnalysisData = {
    class_summary: ClassAnalysisSummary;
    /** 总分在线附近的学生 */
    danger_student: Record<string, any>[];
    /** 按总分降序排列的前十名学生 */
    excellent_student: Record<string, any>[];
    /** 总分分数段统计 */
    sum_score_section: Record<string, any>[];
    /** 主科分数段统计 */
    main_score_section: Record<string, any>[];
    /** 选考科目分数段统计 */
    select_score_section: Record<string, any>[];
  };

  type ClassAnalysisReply = {
    /** HTTP 业务状态码 */
    code: number;
    /** 响应消息 */
    msg: string;
    data: ClassAnalysisData;
    /** 该接口固定为 null */
    total?: Record<string, any>;
  };

  type ClassAnalysisSummary = {
    /** 当前有效花名册人数；不作为历史考试过线率分母 */
    active_student_count: number;
    /** 本场存在成绩记录的去重参考人数 */
    exam_participant_count: number;
    /** 本场参考学生的总分最高值 */
    highest_total_score?: number;
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
    /** 入学级，如 2025 */
    grade?: string;
    /** 选科 */
    subject_selection: string;
  };

  type ClassPassLineRateItem = {
    /** 班级 ID */
    class_id: number;
    /** 清北线各科累计过线率 */
    top_rate: Record<string, any>;
    /** 985 线各科累计过线率 */
    top9_rate: Record<string, any>;
    /** 211 线各科累计过线率 */
    top2_rate: Record<string, any>;
    /** 一本/特控线各科累计过线率 */
    pass_rate: Record<string, any>;
    /** 按清北、985、211、一本分组的科目统计。每个科目值为 {pass_count, actual_count, pass_rate}；计数单位均为跨考试累计人次。 */
    pass_line_stats: Record<string, any>;
  };

  type ClassPassLineRateReply = {
    /** HTTP 业务状态码 */
    code: number;
    /** 响应消息 */
    msg: string;
    data: ClassPassLineRateItem[];
    /** 该接口固定为 null */
    total?: Record<string, any>;
  };

  type Compute = {
    /** 班级ID */
    class_id: string;
  };

  type deleteCartItemParams = {
    cart_id: number;
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

  type deletePaperQuestionScoreParams = {
    /** 学校ID */
    school_id: string;
    /** 试卷编号 */
    paper_id: string;
    /** 班级ID */
    class_id?: string;
  };

  type deleteQuestionBankPaperAnswerFileApiParams = {
    /** 仅内置管理员必传的学校 ID */
    school_id?: string;
    paper_id: number;
  };

  type deleteQuestionBankPaperDetailApiParams = {
    /** 仅内置管理员必传的学校 ID */
    school_id?: string;
    paper_id: number;
  };

  type deleteQuickAdminClassDeleteParams = {
    /** 学校ID */
    school_id: string;
    /** 年级 */
    grade?: string;
  };

  type deleteQuickAdminPassLineDeleteParams = {
    /** 考试ID */
    exam_id: number;
  };

  type deleteQuickAdminScoreDeleteParams = {
    /** 考试ID */
    exam_id: number;
  };

  type deleteQuickAdminStudentDeleteParams = {
    /** 学校ID */
    school_id: string;
    /** 年级 */
    grade?: string;
  };

  type deleteSchoolDetailApiParams = {
    school_id: string;
  };

  type deleteTeacherBindApiParams = {
    /** 班级id */
    class: number;
  };

  type deleteTestPaperParams = {
    /** 试卷ID */
    test_paper_id: number;
  };

  type deleteTestPaperQuestionParams = {
    /** 试卷ID */
    test_paper_id?: number;
    /** 试卷ID别名，兼容旧参数 */
    paper_id?: number;
    /** 题目ID */
    question_id: number;
  };

  type deleteTestPaperQuestionScoreParams = {
    /** 考试ID */
    exam_id: number;
    /** 试卷ID */
    test_paper_id: number;
  };

  type deleteUserDetailApiParams = {
    user_id: string;
  };

  type Exam = {
    /** 考试ID，创建考试的时候不需要 */
    id?: number;
    /** 考试名称 */
    name: string;
    /** 考试年份 */
    year: string;
    /** 考试类型：1代表高三的文理科，2代表高一、高二的选科 */
    exam_type?: string;
    /** 考试类型 */
    exam_category?: string;
    /** 考试年级 */
    student_grade?: string;
    /** 考试开始日期，格式 YYYY-MM-DD，可为空 */
    exam_date?: string;
  };

  type FeedbackSubmit = {
    /** 用户工号/学号（可选） */
    role?: string;
    /** 用户邮箱（可选） */
    user_email?: string;
    /** 用户姓名（可选） */
    user_name?: string;
    /** 反馈类型：bug/feature/improvement/other */
    feedback_type: string;
    /** 反馈标题 */
    title: string;
    /** 反馈内容 */
    content: string;
    /** 联系方式类型：email/phone/wechat */
    contact_method?: string;
    /** 联系方式值 */
    contact_value?: string;
    /** 优先级：low/normal/high/urgent，默认normal */
    priority?: string;
  };

  type FeedbackUpdate = {
    /** 状态：pending/processing/resolved/closed */
    status: string;
    /** 管理员回复 */
    admin_reply?: string;
  };

  type GaokaoPaper = {
    id: number;
    name: string;
    subject: string;
    year: string;
  };

  type GaokaoPaperDownload =
    // #/components/schemas/GaokaoPaper
    GaokaoPaper & {
      download_url: string;
    };

  type GaokaoPaperDownloadListResponse = {
    code?: number;
    msg?: string;
    data?: GaokaoPaperDownload[];
    total?: number;
  };

  type GaokaoPaperListResponse = {
    code?: number;
    msg?: string;
    data?: GaokaoPaper[];
    total?: number;
  };

  type GaokaoPaperUploadResponse = {
    code?: number;
    msg?: string;
    data?: GaokaoPaperDownload;
    total?: number;
  };

  type getAllFeedbacksParams = {
    /** 状态筛选 */
    status?: string;
    /** 每页数量 */
    page_size?: number;
    /** 页码 */
    page?: number;
  };

  type getCartListParams = {
    /** 学生 ID */
    student_id: string;
    /** 试卷 ID 筛选 */
    test_paper_id?: string;
    /** 是否已复习 (true/false) */
    is_reviewed?: string;
    /** 是否需要解析 (true/false) */
    require_analysis?: string;
    /** 仅查看已移出条目 (true/false) */
    only_removed?: string;
    /** 页码 */
    page?: number;
    /** 每页数量 */
    size?: number;
  };

  type getClassAnalysisParams = {
    /** 必填；班级 ID */
    class_id: number;
    /** 必填；考试 ID */
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
    /** 班级名称 */
    name?: string;
    /** 班主任 */
    header?: string;
    /** 学校ID */
    school_id?: string;
    /** 入学级，如 2025 */
    grade?: string;
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
    /** 科目筛选(如: 总分, 语文, 数学等) */
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

  type getClassQuestionStatParams = {
    /** 页码 */
    page?: number;
    /** 每页数量 */
    size?: number;
    /** 考试ID */
    exam_id: number;
    /** 试卷ID */
    test_paper_id: number;
    /** 班级ID */
    class_id: string;
    /** 题号 */
    question_key?: string;
    /** 兼容旧前端参数 */
    refresh?: string;
  };

  type getClassQuestionWrongStudentsParams = {
    /** 页码 */
    page?: number;
    /** 每页数量 */
    size?: number;
    /** 考试ID */
    exam_id: number;
    /** 试卷ID */
    test_paper_id: number;
    /** 班级ID */
    class_id: string;
    /** 题号 */
    question_key?: string;
    /** 兼容旧前端参数 */
    refresh?: string;
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
    /** 对比学生id或姓名 */
    compare_student_id: string;
    /** 选中考试id */
    selected_exam_id: number;
    /** 对比学生班级id */
    compare_class_id?: string;
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
    /** 考试类型（可选） */
    exam_category?: string;
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

  type getFeedbackDetailParams = {
    feedback_id: number;
  };

  type getGaokaoPaperDownloadApiParams = {
    /** 科目 */
    subject?: string;
    /** 年份 */
    year?: string;
    /** 页码，从 1 开始 */
    page?: number;
    /** 每页数量，最大 100 */
    size?: number;
  };

  type getGaokaoPaperFileApiParams = {
    paper_id: number;
  };

  type getGaokaoPaperListApiParams = {
    /** 科目 */
    subject?: string;
    /** 年份 */
    year?: string;
    /** 页码，从 1 开始 */
    page?: number;
    /** 每页数量，最大 100 */
    size?: number;
  };

  type getGetGradeStudentCountApiParams = {
    /** 学校ID */
    school?: string;
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

  type getKnowledgePointMasteryApiParams = {
    /** 必填；学生学号，去首尾空白后不可为空 */
    student_id?: string;
    /** 必填；精确匹配的科目 */
    subject?: string;
    /** 必填；精确匹配的知识点名称 */
    knowledge_point?: string;
    /** 可选；整数，范围 1 至 100，默认 10 */
    n?: string;
  };

  type getMyFeedbacksParams = {
    /** 每页数量 */
    page_size?: number;
    /** 页码 */
    page?: number;
  };

  type getPaperQuestionScoreParams = {
    /** 页码，从 1 开始 */
    page?: number;
    /** 每页数量，最大 1000 */
    size?: number;
    /** 学校ID */
    school_id?: string;
    /** 试卷编号 */
    paper_id?: string;
    /** 班级ID */
    class_id?: string;
    /** 考号 */
    student_id?: string;
    /** 题号 */
    question_number?: string;
  };

  type getPassLineParams = {
    /** 考试id */
    exam_id?: number;
    /** 考试id列表，逗号分隔 */
    exam_ids?: string;
    /** 页码 */
    page?: number;
    /** 每页记录数 */
    size?: number;
  };

  type getQuestionBankPaperCollectionApiParams = {
    /** 页码，默认 1 */
    page?: number;
    /** 每页数量，默认 20，最大 100 */
    size?: number;
    /** 卷种 */
    category?: string;
    /** 细项或地区 */
    region?: string;
    /** 科目 */
    subject?: string;
    /** 年份 */
    year?: string;
    /** 试卷名称关键词 */
    keyword?: string;
    /** 仅内置管理员必传的学校 ID */
    school_id?: string;
  };

  type getQuestionBankPaperDetailApiParams = {
    /** 仅内置管理员必传的学校 ID */
    school_id?: string;
    paper_id: number;
  };

  type getQuestionBankPaperProtectedFileApiParams = {
    /** 仅内置管理员必传的学校 ID */
    school_id?: string;
    paper_id: number;
    file_kind: string;
  };

  type getQuickAdminExamListParams = {
    /** 页码 */
    page?: number;
    /** 每页数量 */
    size?: number;
    /** 学校ID */
    school_id?: string;
    /** 年级 */
    student_grade?: string;
    /** 年级别名 */
    grade?: string;
    /** 学期 */
    semester?: string;
    /** 考试年份/时间 */
    exam_time?: string;
    /** 考试时间别名 */
    time?: string;
    /** 年份别名 */
    year?: string;
    /** 考试类别 */
    exam_category?: string;
    /** 考试类别别名 */
    exam_type?: string;
    /** 考试名称 */
    name?: string;
    /** 考试名称别名 */
    exam_name?: string;
  };

  type getQuickAdminGradeClassCountParams = {
    /** 学校ID */
    school_id: string;
  };

  type getQuickAdminGradeStudentCountParams = {
    /** 学校ID */
    school_id: string;
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
    student_id?: string;
    /** 考试ID */
    exam_id?: number;
    /** 对比的考试ID */
    compared_exam_id?: number;
  };

  type getStudentTestPaperParams = {
    /** 学生UID */
    student_uid: string;
    /** 页码，从 1 开始 */
    page?: number;
    /** 每页数量 */
    size?: number;
    /** 考试ID */
    exam_id?: number;
    /** 学校ID */
    school_id?: string;
    /** 考试学生年级 */
    student_grade?: string;
    /** 试卷年级 */
    grade?: string;
    /** 试卷年份 */
    year?: string;
    /** 学期 */
    semester?: string;
    /** 科目 */
    subject?: string;
    /** 试卷名称，支持精确筛选 */
    name?: string;
  };

  type getStudentWrongQuestionRecommendParams = {
    /** 页码 */
    page?: number;
    /** 每页数量 */
    size?: number;
    /** 科目 */
    subject?: string;
    /** 学校ID */
    school_id?: string;
    /** 年级 */
    grade?: string;
    /** 年级别名 */
    student_grade?: string;
    /** 班级ID */
    class_id?: string;
    /** 考试ID */
    exam_id?: number;
    /** 试卷ID */
    test_paper_id?: number;
    /** 试卷ID别名 */
    paper_id?: number;
    /** 学生ID */
    student_id?: string;
    /** 题型 */
    question_type?: string;
    /** 关键词 */
    knowledge_keyword?: string;
    /** 关键词别名 */
    keyword?: string;
    /** 年份 */
    year?: string;
    /** 是否已复习 */
    is_reviewed?: string;
    /** 推荐数量 */
    limit?: number;
    student_uid: string;
  };

  type getStudentWrongQuestionSearchParams = {
    /** 页码 */
    page?: number;
    /** 每页数量 */
    size?: number;
    /** 科目 */
    subject?: string;
    /** 学校ID */
    school_id?: string;
    /** 年级 */
    grade?: string;
    /** 年级别名 */
    student_grade?: string;
    /** 班级ID */
    class_id?: string;
    /** 考试ID */
    exam_id?: number;
    /** 试卷ID */
    test_paper_id?: number;
    /** 试卷ID别名 */
    paper_id?: number;
    /** 学生ID */
    student_id?: string;
    /** 题型 */
    question_type?: string;
    /** 关键词 */
    knowledge_keyword?: string;
    /** 关键词别名 */
    keyword?: string;
    /** 年份 */
    year?: string;
    /** 是否已复习 */
    is_reviewed?: string;
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

  type getTeacherWrongQuestionRecommendParams = {
    /** 页码 */
    page?: number;
    /** 每页数量 */
    size?: number;
    /** 科目 */
    subject?: string;
    /** 学校ID */
    school_id?: string;
    /** 年级 */
    grade?: string;
    /** 年级别名 */
    student_grade?: string;
    /** 班级ID */
    class_id?: string;
    /** 考试ID */
    exam_id?: number;
    /** 试卷ID */
    test_paper_id?: number;
    /** 试卷ID别名 */
    paper_id?: number;
    /** 学生ID */
    student_id?: string;
    /** 题型 */
    question_type?: string;
    /** 关键词 */
    knowledge_keyword?: string;
    /** 关键词别名 */
    keyword?: string;
    /** 年份 */
    year?: string;
    /** 是否已复习 */
    is_reviewed?: string;
    /** 推荐数量 */
    limit?: number;
  };

  type getTeacherWrongQuestionSearchParams = {
    /** 页码 */
    page?: number;
    /** 每页数量 */
    size?: number;
    /** 科目 */
    subject?: string;
    /** 学校ID */
    school_id?: string;
    /** 年级 */
    grade?: string;
    /** 年级别名 */
    student_grade?: string;
    /** 班级ID */
    class_id?: string;
    /** 考试ID */
    exam_id?: number;
    /** 试卷ID */
    test_paper_id?: number;
    /** 试卷ID别名 */
    paper_id?: number;
    /** 学生ID */
    student_id?: string;
    /** 题型 */
    question_type?: string;
    /** 关键词 */
    knowledge_keyword?: string;
    /** 关键词别名 */
    keyword?: string;
    /** 年份 */
    year?: string;
    /** 是否已复习 */
    is_reviewed?: string;
  };

  type getTestPaperFileParams = {
    /** 文件存储路径或 /api/tp/file 访问地址 */
    path: string;
  };

  type getTestPaperParams = {
    /** 页码，从 1 开始 */
    page?: number;
    /** 每页数量 */
    size?: number;
    /** 考试ID */
    exam_id?: number;
    /** 学校ID */
    school_id?: string;
    /** 考试学生年级 */
    student_grade?: string;
    /** 试卷年级 */
    grade?: string;
    /** 试卷年份 */
    year?: string;
    /** 学期 */
    semester?: string;
    /** 科目 */
    subject?: string;
    /** 试卷名称，支持精确筛选 */
    name?: string;
  };

  type getTestPaperQuestionParams = {
    /** 试卷ID */
    test_paper_id?: number;
    /** 试卷ID别名，兼容旧参数 */
    paper_id?: number;
  };

  type getTestPaperQuestionScoreParams = {
    /** 页码，从 1 开始 */
    page?: number;
    /** 每页数量，默认 100，最大 500 */
    size?: number;
    /** 考试ID */
    exam_id?: number;
    /** 试卷ID */
    test_paper_id?: number;
    /** 学生UID */
    student_id?: string;
    /** 是否补充学生姓名和班级，默认 true */
    include_student?: string;
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
    school_id: string;
    /** 考试id */
    exam_id: number;
    /** 考试班级 */
    class_id: number;
    /** 科目名(中文: 总分/语文/数学/英语/物理/化学/生物/政治/历史/地理) */
    subject: string;
    /** 该科分数 */
    score: number;
    /** 班级名次 */
    class_rank?: number;
    /** 学校名次(段次) */
    school_rank?: number;
  };

  type KnowledgePointMasteryData = {
    /** 学生学号 */
    student_id: string;
    /** 请求科目 */
    subject: string;
    /** 请求知识点 */
    knowledge_point: string;
    /** 请求的最近考试场数 */
    requested_exam_count: number;
    /** 实际参与统计的考试场数 */
    actual_exam_count: number;
    /** 窗口内正确题数 */
    correct_question_count: number;
    /** 窗口内有效相关题数 */
    total_question_count: number;
    /** 窗口掌握率，范围 0 至 1，保留四位小数；无有效题时为空 */
    mastery_rate?: number;
    /** 按 exam_id 倒序的逐场趋势 */
    exams: KnowledgePointMasteryExamTrend[];
  };

  type KnowledgePointMasteryExamTrend = {
    /** 考试 ID */
    exam_id: number;
    /** 考试名称 */
    exam_name?: string;
    /** 考试学年 */
    exam_year?: string;
    /** 考试开始日期，格式 YYYY-MM-DD；历史考试可为空 */
    exam_date?: string;
    /** 该场正确题数 */
    correct_question_count: number;
    /** 该场有效相关题数 */
    total_question_count: number;
    /** 该场掌握率，范围 0 至 1，保留四位小数 */
    mastery_rate?: number;
  };

  type KnowledgePointMasteryReply = {
    /** HTTP 业务状态码 */
    code: number;
    /** 响应消息 */
    msg: string;
    data: KnowledgePointMasteryData;
    /** 该接口固定为 null */
    total?: Record<string, any>;
  };

  type Login = {
    /** 用户邮箱 */
    email?: string;
    /** 用户账号 */
    username?: string;
    /** 用户账号 */
    account?: string;
    /** 用户密码 */
    password: string;
    /** 是否仅允许管理员登录 */
    admin_only?: boolean;
  };

  type PassLine = {
    /** 科目行id */
    id?: number;
    /** 分数线组id(同一条线的科目行共享) */
    line_group_id?: number;
    /** 考试id */
    exam_id: number;
    /** 学校id */
    school_id: string;
    /** 分数线名称(如: 物理一本线) */
    line_name: string;
    /** 科目名(中文: 总分/语文/数学等) */
    subject: string;
    /** 该科分数线值 */
    score: number;
    /** 该科段次(达到分数线的学生人数) */
    rank?: number;
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

  type postClassQuestionStatRebuildParams = {
    /** 考试ID */
    exam_id: number;
    /** 试卷ID */
    test_paper_id: number;
    /** 班级ID */
    class_id?: string;
  };

  type postClassUploadApiParams = {
    /** 学校ID */
    school_id: string;
  };

  type postCompareRankMultiExamParams = {
    /** 学生id */
    student_id: string;
    /** 选中考试id */
    selected_exam_id: number;
    /** 需要对比的考试id列表例："20250522,20250524" */
    compare_exam_ids: string;
  };

  type postGradeUploadApiParams = {
    /** 考试id */
    exam_id: number;
  };

  type postPaperParseUploadApiParams = {
    /** 试卷ID */
    test_paper_id: number;
  };

  type postPaperQuestionScoreParams = {
    /** 学校ID */
    school_id: string;
    /** 试卷编号 */
    paper_id: string;
  };

  type postPaperUploadApiParams = {
    /** 学校id */
    school_id: string;
    /** 年级 */
    grade: string;
    /** 考试id */
    exam_id: string;
    /** 科目 */
    subject: string;
    /** 考试类型 */
    catagory?: string;
    /** 试卷名称 */
    name: string;
    /** 备注 */
    comment?: string;
  };

  type postQuestionBankPaperAnswerFileApiParams = {
    /** 仅内置管理员必传的学校 ID */
    school_id?: string;
    paper_id: number;
  };

  type postQuestionBankPaperCollectionApiParams = {
    /** 仅内置管理员必传的学校 ID */
    school_id?: string;
  };

  type postQuestionBankPaperFileApiParams = {
    /** 仅内置管理员必传的学校 ID */
    school_id?: string;
    paper_id: number;
  };

  type postQuestionScoreUploadApiParams = {
    /** 学校ID */
    school_id: string;
    /** 试卷编号 */
    paper_id: string;
  };

  type postQuickAdminClassImportParams = {
    /** 学校ID */
    school_id: string;
    /** 年级 */
    grade: string;
  };

  type postQuickAdminPassLineImportParams = {
    /** 考试ID */
    exam_id: number;
  };

  type postQuickAdminScoreImportParams = {
    /** 考试ID */
    exam_id: number;
    /** 学校ID */
    school_id?: string;
    /** 年级 */
    student_grade?: string;
    /** 年级别名 */
    grade?: string;
    /** 学期 */
    semester?: string;
    /** 考试年份/时间 */
    exam_time?: string;
    /** 考试时间别名 */
    time?: string;
    /** 年份别名 */
    year?: string;
    /** 考试类别 */
    exam_category?: string;
    /** 考试类别别名 */
    exam_type?: string;
    /** 考试名称 */
    name?: string;
    /** 考试名称别名 */
    exam_name?: string;
  };

  type postQuickAdminStudentImportParams = {
    /** 学校ID */
    school_id: string;
    /** 年级 */
    grade?: string;
    /** 年级别名 */
    student_grade?: string;
  };

  type postScoreLineUploadApiParams = {
    /** 考试ID */
    exam_id: number;
  };

  type postStudentUploadApiParams = {
    /** 学校ID */
    school_id: string;
    /** 年级 */
    grade: string;
  };

  type postTeacherBindApiParams = {
    /** 教师ID */
    teacher_id: number;
    /** 班级id */
    class_id: number;
  };

  type postTeacherUploadApiParams = {
    /** 学校ID */
    school_id: string;
  };

  type postTestPaperAnswerImageParams = {
    /** 试卷ID */
    test_paper_id: number;
  };

  type postTestPaperParams = {
    /** 学校ID */
    school_id: string;
    /** 考试ID，必须已存在 */
    exam_id: number;
    /** 科目 */
    subject: string;
    /** 年份 */
    year: string;
    /** 试卷年级 */
    grade: string;
    /** 学期 */
    semester: string;
    /** 试卷名称，不传则按年份/年级/学期/科目生成 */
    name?: string;
    /** 试卷备注 */
    description?: string;
  };

  type postTestPaperPdfParams = {
    /** 试卷ID */
    test_paper_id: number;
  };

  type postTestPaperQuestionImageParams = {
    /** 试卷ID */
    test_paper_id: number;
    /** 题目ID */
    question_id?: number;
  };

  type putCartItemParams = {
    cart_id: number;
  };

  type putCartMarkReviewedParams = {
    cart_id: number;
  };

  type putCartRestoreParams = {
    cart_id: number;
  };

  type putCartToggleAnalysisParams = {
    cart_id: number;
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

  type putQuestionBankPaperDetailApiParams = {
    /** 仅内置管理员必传的学校 ID */
    school_id?: string;
    paper_id: number;
  };

  type putSchoolDetailApiParams = {
    school_id: string;
  };

  type putStudentDetailApiParams = {
    student_uid: string;
  };

  type putStudentWrongQuestionReviewParams = {
    student_uid: string;
  };

  type putTeacherDetailApiParams = {
    teacher_uid: string;
  };

  type putUserDetailApiParams = {
    user_id: string;
  };

  type QuestionBankPaperUpdate = {
    /** 试卷名称 */
    name?: string;
    /** 卷种 */
    category?: string;
    /** 细项或地区 */
    region?: string;
    /** 科目；思想政治会规范为政治 */
    subject?: string;
    /** 四位年份 */
    year?: string;
    /** 备注；传 null 可清空 */
    description?: string;
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
    /** 总分 */
    总分?: number;
    /** 语文 */
    语文?: number;
    /** 数学 */
    数学?: number;
    /** 英语 */
    英语?: number;
    /** 物理 */
    物理?: number;
    /** 化学 */
    化学?: number;
    /** 生物 */
    生物?: number;
    /** 政治 */
    政治?: number;
    /** 历史 */
    历史?: number;
    /** 地理 */
    地理?: number;
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
    /** 学生ID或学生ID列表 */
    student_id: Record<string, any>;
    /** 考试ID列表 */
    exam_ids?: number[];
  };

  type StudentWrongQuestionReview = {
    /** 试卷ID */
    test_paper_id: Record<string, any>;
    /** 试卷ID别名 */
    paper_id?: Record<string, any>;
    /** 题号 */
    question_key: string;
    /** 题号别名 */
    question_number?: string;
    /** 题号别名 */
    string_number?: string;
    /** 班级ID */
    class_id?: string;
    /** 是否已复习 */
    is_reviewed: boolean;
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

  type TestPaperQuestionBatchUpdate = {
    /** 试卷ID */
    test_paper_id: number;
    /** 需要更新的题目列表 */
    questions: TestPaperQuestionUpdateItem[];
  };

  type TestPaperQuestionUpdateItem = {
    /** 题目ID */
    id: number;
    /** 题号 */
    string_number?: string;
    /** 题型 */
    question_type?: string;
    /** 关键词列表 */
    keywords?: string[];
    /** 年级 */
    grade?: string;
    /** 题目图片存储路径列表 */
    images?: string[];
    /** 题目答案 */
    quick_answer?: string;
    /** 题目解析，支持 Markdown */
    answer?: string;
    /** 正确率 */
    correct_rate?: number;
    /** 分值 */
    score?: number;
    /** 达标分值（错误线），低于该分值视为错题，由每个学科自主决定；置空表示按满分判定 */
    pass_score?: number;
  };

  type updateFeedbackStatusParams = {
    feedback_id: number;
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

  type WrongQuestionDownload = {
    /** 错题 question_id 列表 */
    question_ids: number[];
    /** 学生 student_id */
    student_id: string;
    /** 是否包含答案 */
    is_need_answer?: boolean;
    /** 是否包含解析 */
    is_need_analysis?: boolean;
  };
}

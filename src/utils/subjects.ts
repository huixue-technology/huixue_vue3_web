/**
 * 科目统一访问工具
 *
 * 后端成绩表/分数线表从「列式(拼音字段)」重构为「行式(中文 subjects 对象)」后，
 * 所有视图应通过本模块访问科目数据，避免手写 `subjects.语文.score` 深访问。
 */

// 科目常量（固定顺序，总分在前）
export const SUBJECTS: string[] = [
  '总分',
  '语文',
  '数学',
  '英语',
  '物理',
  '化学',
  '生物',
  '政治',
  '历史',
  '地理',
];

// 拼音科目名 → 中文科目名（老数据/列式接口用拼音键，如统计画像 pass_rate / exam_analysis 等）
export const SUBJECT_PINYIN_TO_CN: Record<string, string> = {
  sum_: '总分',
  sum: '总分',
  yuwen: '语文',
  shuxue: '数学',
  yingyu: '英语',
  wuli: '物理',
  huaxue: '化学',
  shengwu: '生物',
  zhengzhi: '政治',
  lishi: '历史',
  dili: '地理',
};

// 中文科目名 → 拼音科目名（反向映射，便于需要时转换；去重避免 sum_/sum 冲突）
export const SUBJECT_CN_TO_PINYIN: Record<string, string> = {};
Object.entries(SUBJECT_PINYIN_TO_CN).forEach(([pinyin, cn]) => {
  if (SUBJECT_CN_TO_PINYIN[cn] === undefined) {
    SUBJECT_CN_TO_PINYIN[cn] = pinyin;
  }
});

/** 把科目键统一转成中文名：兼容拼音键 / 中文键，无法识别时原样返回 */
export const normalizeSubject = (subject?: string | null): string => {
  if (!subject) return '';
  return SUBJECT_PINYIN_TO_CN[subject] || subject;
};

// 各科满分（用于雷达图等）
export const SUBJECT_MAX: Record<string, number> = {
  '总分': 750,
  '语文': 150,
  '数学': 150,
  '英语': 150,
  '物理': 100,
  '化学': 100,
  '生物': 100,
  '政治': 100,
  '历史': 100,
  '地理': 100,
};

// ---------------------------------------------------------------------------
// 成绩对象访问（grade = API.Grade / class_grade 行 / student_grade 行）
// 结构：{ total_score, subjects: { "语文": { score, class_rank, school_rank } } }
// ---------------------------------------------------------------------------

/** 总分（原 sum_） */
export const getTotalScore = (g?: any): number => g?.total_score ?? 0;

/** 总分班次（原 sumb） */
export const getTotalClassRank = (g?: any): number =>
  g?.subjects?.['总分']?.class_rank ?? 0;

/** 总分段次（原 sumd） */
export const getTotalSchoolRank = (g?: any): number =>
  g?.subjects?.['总分']?.school_rank ?? 0;

/** 某科成绩（原 yuwen 等，cn 为中文科目名如 '语文'） */
export const getSubjectScore = (g: any, cn: string): number =>
  g?.subjects?.[cn]?.score ?? 0;

/** 某科班次（原 yuwenb） */
export const getSubjectClassRank = (g: any, cn: string): number =>
  g?.subjects?.[cn]?.class_rank ?? 0;

/** 某科段次（原 yuwend） */
export const getSubjectSchoolRank = (g: any, cn: string): number =>
  g?.subjects?.[cn]?.school_rank ?? 0;

/** 从 subjects 对象提取实际存在的科目（按 SUBJECTS 固定顺序，用于动态生成列/图表） */
export const getGradeSubjects = (g?: any): string[] =>
  SUBJECTS.filter((s) => g?.subjects?.[s] != null);

// ---------------------------------------------------------------------------
// 分数线访问（pass_line 返回行式：每行一个科目）
// 结构：[{ id, line_group_id, line_name, subject: "总分", score, rank }, ...]
// ---------------------------------------------------------------------------

/** 把行式分数线数组组装成 { 科目: 分数 } 的 dict，便于按科目取值 */
export const groupPassLine = (lines?: any[]): Record<string, number> => {
  const dict: Record<string, number> = {};
  (lines || []).forEach((line) => {
    if (line?.subject != null && line?.score != null) {
      dict[line.subject] = line.score;
    }
  });
  return dict;
};

/** 某科分数线（从已聚合的 {科目:分数} dict 取值） */
export const getPassLineValue = (dict: Record<string, number> | undefined, cn: string): number =>
  dict?.[cn] ?? 0;

/** 总分数线（从已聚合的 dict 取总分） */
export const getPassLineTotal = (dict?: Record<string, number>): number =>
  dict?.['总分'] ?? 0;

// ---------------------------------------------------------------------------
// 对比接口扁平中文键访问（compare_with_student 的 current_student / compare_student）
// 结构：{ "总分": 300, "总分班次": 2, "总分段次": 5, "语文": 110, "语文班次": 2, "语文段次": 6 }
// ---------------------------------------------------------------------------

/** 某科成绩（总分或单科） */
export const getCompareScore = (o: any, cn: string): number => o?.[cn] ?? 0;

/** 某科班次（`${cn}班次`） */
export const getCompareClassRank = (o: any, cn: string): number =>
  o?.[`${cn}班次`] ?? 0;

/** 某科段次（`${cn}段次`） */
export const getCompareSchoolRank = (o: any, cn: string): number =>
  o?.[`${cn}段次`] ?? 0;

// ---------------------------------------------------------------------------
// 选科过滤
// ---------------------------------------------------------------------------

/** 根据 subject_selection 字符串（如 '物化生'）过滤应展示的科目 */
export const filterSubjectsBySelection = (
  selection?: string,
  subjects: string[] = SUBJECTS
): string[] => {
  const sel = selection?.trim();
  if (!sel || sel === '未选科') return subjects;
  return subjects.filter((s) => {
    switch (s) {
      case '物理':
        return sel.includes('物') || sel.includes('理');
      case '化学':
        return sel.includes('化');
      case '生物':
        return sel.includes('生');
      case '历史':
        return sel.includes('史');
      case '政治':
        return sel.includes('政');
      case '地理':
        return sel.includes('地');
      default:
        // 语数英、总分恒显示
        return true;
    }
  });
};

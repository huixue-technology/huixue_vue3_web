export type PaperSemesterSource = {
  exam_student_grade?: string;
  student_grade?: string;
  grade?: string;
  year?: string | number;
  semester?: string;
};

export type PaperSemesterOption = {
  label: string;
  value: string;
  year: string;
  semester: string;
};

type SemesterQuery = {
  year?: string;
  semester?: string;
};

const gradeStageLabels = ["高一", "高二", "高三"];

export const getPaperGrade = (paper: PaperSemesterSource) =>
  String(paper.exam_student_grade || paper.student_grade || paper.grade || "").trim();

const getPaperYear = (paper: PaperSemesterSource) => String(paper.year ?? "").trim();

const getPaperSemester = (paper: PaperSemesterSource) => String(paper.semester ?? "").trim();

const parseYear = (value: string) => {
  const match = value.match(/\d{4}/);
  return match ? Number(match[0]) : Number.NaN;
};

const normalizeSemesterSuffix = (semester: string) => {
  const text = semester.trim();
  if (!text) return "";
  if (text.includes("上") || text === "1" || /^first$/i.test(text)) return "上";
  if (text.includes("下") || text === "2" || /^second$/i.test(text)) return "下";
  return text;
};

const getSemesterOrder = (semester: string) => {
  const suffix = normalizeSemesterSuffix(semester);
  if (suffix === "下") return 2;
  if (suffix === "上") return 1;
  return 0;
};

const getAcademicYearStart = (year: string, semester: string) => {
  const paperYear = parseYear(year);
  if (!Number.isFinite(paperYear)) return Number.NaN;
  return normalizeSemesterSuffix(semester) === "下" ? paperYear - 1 : paperYear;
};

const getGradeStageLabel = (selectedGrade: string, year: string, semester: string) => {
  const normalizedGrade = selectedGrade.trim();
  const directStage = normalizedGrade.match(/高\s*([一二三123])/);
  if (directStage) {
    const stage = directStage[1];
    if (stage === "1" || stage === "一") return "高一";
    if (stage === "2" || stage === "二") return "高二";
    if (stage === "3" || stage === "三") return "高三";
  }

  const cohortYear = parseYear(normalizedGrade);
  const academicYearStart = getAcademicYearStart(year, semester);
  if (!Number.isFinite(cohortYear) || !Number.isFinite(academicYearStart)) {
    return normalizedGrade;
  }

  const stageIndex = academicYearStart - cohortYear;
  return gradeStageLabels[stageIndex] || normalizedGrade;
};

const encodePaperSemesterValue = (year: string, semester: string) =>
  JSON.stringify({ year, semester });

export const formatPaperSemesterLabel = (paper: PaperSemesterSource) => {
  const grade = getPaperGrade(paper);
  const year = getPaperYear(paper);
  const semester = getPaperSemester(paper);
  const semesterSuffix = normalizeSemesterSuffix(semester);
  if (!grade || !year || !semester || !semesterSuffix) return "";
  return `${getGradeStageLabel(grade, year, semester)}${semesterSuffix}`;
};

export const getPaperSemesterQuery = (value?: string): SemesterQuery => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as SemesterQuery;
    return {
      year: String(parsed.year || "").trim() || undefined,
      semester: String(parsed.semester || "").trim() || undefined,
    };
  } catch (_error) {
    return {};
  }
};

export const buildPaperSemesterOptions = (
  papers: PaperSemesterSource[],
  selectedGrade?: string
): PaperSemesterOption[] => {
  const grade = String(selectedGrade || "").trim();
  if (!grade) return [];

  const optionMap = new Map<string, PaperSemesterOption>();
  for (const paper of papers) {
    if (getPaperGrade(paper) !== grade) continue;
    const year = getPaperYear(paper);
    const semester = getPaperSemester(paper);
    const semesterSuffix = normalizeSemesterSuffix(semester);
    if (!year || !semester || !semesterSuffix) continue;

    const key = `${year}::${semesterSuffix}`;
    if (optionMap.has(key)) continue;

    optionMap.set(key, {
      label: `${getGradeStageLabel(grade, year, semester)}${semesterSuffix}`,
      value: encodePaperSemesterValue(year, semester),
      year,
      semester,
    });
  }

  return Array.from(optionMap.values()).sort((a, b) => {
    const yearDiff =
      getAcademicYearStart(b.year, b.semester) - getAcademicYearStart(a.year, a.semester);
    if (yearDiff) return yearDiff;
    return getSemesterOrder(b.semester) - getSemesterOrder(a.semester);
  });
};

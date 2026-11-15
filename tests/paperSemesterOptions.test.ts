import {
  buildPaperSemesterOptions,
  formatPaperSemesterLabel,
  getPaperSemesterQuery,
  type PaperSemesterSource,
  type PaperSemesterOption,
} from "../src/views/paper/semesterOptions";

const assertDeepEqual = (actual: unknown, expected: unknown) => {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    throw new Error(`Expected ${expectedText}, got ${actualText}`);
  }
};

const assertEqual = (actual: unknown, expected: unknown) => {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
  }
};

// 口径：秋季（9月至次年2月）为上学期，春季（3月至8月）为下学期；year 记学期开始年份。
// 2023级：2023秋=高一上、2024春=高一下、2024秋=高二上。
const papers: PaperSemesterSource[] = [
  { exam_student_grade: "2023级", year: "2023", semester: "上学期" },
  { exam_student_grade: "2023级", year: "2024", semester: "下学期" },
  { exam_student_grade: "2023级", year: "2024", semester: "上学期" },
  { exam_student_grade: "2024级", year: "2024", semester: "上学期" },
  { exam_student_grade: "2024级", year: "2026", semester: "上学期" },
];

const options = buildPaperSemesterOptions(papers, "2023级");

assertDeepEqual(
  options.map((option: PaperSemesterOption) => option.label),
  ["高二上", "高一下", "高一上"]
);

assertDeepEqual(getPaperSemesterQuery(options[0].value), {
  year: "2024",
  semester: "上学期",
});

assertDeepEqual(buildPaperSemesterOptions(papers, undefined), []);

const highGradeOptions = buildPaperSemesterOptions(
  [{ exam_student_grade: "高二", year: "2024", semester: "上学期" }],
  "高二"
);
assertEqual(highGradeOptions[0].label, "高二上");

const cohort2024Options = buildPaperSemesterOptions(papers, "2024级");
assertEqual(cohort2024Options[0].label, "高三上");

assertEqual(
  formatPaperSemesterLabel({ exam_student_grade: "2023级", year: "2024", semester: "上学期" }),
  "高二上"
);

assertEqual(formatPaperSemesterLabel({ grade: "2024级", year: "2025", semester: "2025下学期" }), "高一下");
assertEqual(formatPaperSemesterLabel({ grade: "2024级", year: "2027", semester: "2027下学期" }), "高三下");
assertDeepEqual(buildPaperSemesterOptions([
  { grade: "2024级", year: "2025", semester: "上学期" },
  { grade: "2024级", year: "2026", semester: "下学期" },
  { grade: "2024级", year: "2026", semester: "上学期" },
], "2024级").map(option => option.label), ["高三上", "高二下", "高二上"]);

console.log("paperSemesterOptions ok");

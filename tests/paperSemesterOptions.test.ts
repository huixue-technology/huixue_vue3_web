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

const papers: PaperSemesterSource[] = [
  { exam_student_grade: "2023级", year: "2023", semester: "上学期" },
  { exam_student_grade: "2023级", year: "2024", semester: "下" },
  { exam_student_grade: "2023级", year: "2024", semester: "上" },
  { exam_student_grade: "2024级", year: "2024", semester: "上" },
  { exam_student_grade: "2024级", year: "2026", semester: "下" },
];

const options = buildPaperSemesterOptions(papers, "2023级");

assertDeepEqual(
  options.map((option: PaperSemesterOption) => option.label),
  ["高二上", "高一下", "高一上"]
);

assertDeepEqual(getPaperSemesterQuery(options[0].value), {
  year: "2024",
  semester: "上",
});

assertDeepEqual(buildPaperSemesterOptions(papers, undefined), []);

const highGradeOptions = buildPaperSemesterOptions(
  [{ exam_student_grade: "高二", year: "2024", semester: "上" }],
  "高二"
);
assertEqual(highGradeOptions[0].label, "高二上");

const cohort2024Options = buildPaperSemesterOptions(papers, "2024级");
assertEqual(cohort2024Options[0].label, "高二下");

assertEqual(
  formatPaperSemesterLabel({ exam_student_grade: "2023级", year: "2024", semester: "下学期" }),
  "高一下"
);

console.log("paperSemesterOptions ok");

import { createPaperColumns } from "../src/views/paper/paperColumns";

const assertEqual = (actual: unknown, expected: unknown) => {
  if (actual !== expected) {
    throw new Error(`Expected ${String(expected)}, got ${String(actual)}`);
  }
};

const columns = createPaperColumns();
const semesterColumn = columns.find((column) => column.title === "学期");

assertEqual(Boolean(semesterColumn), true);
assertEqual(semesterColumn?.key, "paper_semester");
assertEqual(
  semesterColumn?.customRender?.({
    record: { exam_student_grade: "2023级", year: "2024", semester: "下学期" },
  }),
  "高一下"
);

console.log("paperColumns ok");

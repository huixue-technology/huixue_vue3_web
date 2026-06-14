import { formatPaperSemesterLabel, type PaperSemesterSource } from "./semesterOptions";

export type PaperColumnSource = PaperSemesterSource & {
  id?: number;
  exam_name?: string;
  name?: string;
  subject?: string;
  create_time?: string;
};

export type PaperColumn = {
  title: string;
  dataIndex?: string;
  key?: string;
  width?: number;
  ellipsis?: boolean;
  customRender?: (params: { record: PaperColumnSource }) => string;
};

export const createPaperColumns = (): PaperColumn[] => [
  { title: "试卷ID", dataIndex: "id", width: 92 },
  { title: "试卷名称", dataIndex: "name", ellipsis: true },
  { title: "考试", dataIndex: "exam_name", ellipsis: true },
  { title: "年级", dataIndex: "exam_student_grade", width: 110 },
  {
    title: "学期",
    key: "paper_semester",
    width: 100,
    customRender: ({ record }) => formatPaperSemesterLabel(record) || "-",
  },
  { title: "科目", dataIndex: "subject", width: 90 },
  { title: "创建时间", dataIndex: "create_time", width: 170 },
  { title: "操作", key: "action", width: 90 },
];

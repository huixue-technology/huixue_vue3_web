const downloadPaperDocument = (path?: string | null): boolean => {
  const filePath = path?.trim();
  if (!filePath) return false;

  const rawName = filePath.split(/[?#]/, 1)[0].split(/[\\/]/).pop() || "试卷";
  let fileName = rawName;
  try {
    fileName = decodeURIComponent(rawName);
  } catch {
    // 存储路径可能含有未编码的百分号。
  }

  const link = document.createElement("a");
  link.href = `/api/tp/file?path=${encodeURIComponent(filePath)}`;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
};

// 历史字段名包含 pdf，实际可能保存 Word 或 PDF 文件。
export const downloadOriginalPaper = (paper: { pdf_file_path?: string | null }): boolean =>
  downloadPaperDocument(paper.pdf_file_path);

export const downloadPaperAnalysis = (paper: { pdf_answer_file_path?: string | null }): boolean =>
  downloadPaperDocument(paper.pdf_answer_file_path);

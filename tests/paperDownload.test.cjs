const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function setup() {
  const module = { exports: {} };
  const downloads = [];
  const source = readFileSync(path.join(__dirname, '../src/views/paper/paperDownload.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const document = {
    createElement: () => ({
      style: {},
      remove() {},
      click() { downloads.push([this.href, this.download]); },
    }),
    body: { appendChild() {} },
  };
  vm.runInNewContext(outputText, { module, exports: module.exports, document });
  return { download: module.exports.downloadOriginalPaper, downloadAnalysis: module.exports.downloadPaperAnalysis, downloads };
}

test('下载原卷 Word 文档，保留文件名和扩展名', () => {
  const { download, downloads } = setup();
  const original = 'uploads/%E8%AF%AD%E6%96%87.docx';
  assert.equal(download({ pdf_file_path: original, file_path: '题目.xlsx', pdf_answer_file_path: '解析.docx' }), true);
  assert.deepEqual(downloads, [[`/api/tp/file?path=${encodeURIComponent(original)}`, '语文.docx']]);
});

test('原卷为 PDF 时保留 PDF 格式', () => {
  const { download, downloads } = setup();
  assert.equal(download({ pdf_file_path: 'uploads/original.pdf' }), true);
  assert.equal(downloads[0][1], 'original.pdf');
});

test('没有原卷时不下载 Excel 或解析文档', () => {
  const { download, downloads } = setup();
  assert.equal(download({ pdf_file_path: '  ', file_path: '题目.xlsx', pdf_answer_file_path: '解析.docx' }), false);
  assert.deepEqual(downloads, []);
});

test('下载解析时使用独立的解析 Word 文件', () => {
  const { downloadAnalysis, downloads } = setup();
  const analysis = 'uploads/%E8%A7%A3%E6%9E%90.docx';
  assert.equal(downloadAnalysis({ pdf_file_path: '原卷.docx', pdf_answer_file_path: analysis }), true);
  assert.equal(downloadAnalysis({ pdf_file_path: '原卷.docx' }), false);
  assert.deepEqual(downloads, [[`/api/tp/file?path=${encodeURIComponent(analysis)}`, '解析.docx']]);
});

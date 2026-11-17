const { readFileSync } = require("fs");
const { join } = require("path");

const rootDir = join(__dirname, "..");
const componentPaths = [
  "src/views/wrongquestion/TeacherWrongQuestion.vue",
  "src/views/wrongquestion/StudentWrongQuestion.vue",
];

const assertIncludes = (source, expected, filePath) => {
  if (!source.includes(expected)) {
    throw new Error(`${filePath} should include ${expected}`);
  }
};

const assertMatches = (source, pattern, message) => {
  if (!pattern.test(source)) {
    throw new Error(message);
  }
};

for (const filePath of componentPaths) {
  const source = readFileSync(join(rootDir, filePath), "utf8");

  assertMatches(
    source,
    /const pagination = reactive\(\{\s*page:\s*1,\s*size:\s*5,\s*total:\s*0/,
    `${filePath} should define reactive pagination with page: 1, size: 5, total: 0`
  );
  assertIncludes(source, '<MarkdownContent', filePath);
}

const renderer = readFileSync(join(rootDir, "src/components/MarkdownContent.vue"), "utf8");
assertIncludes(renderer, 'image.setAttribute("loading", "lazy")', "MarkdownContent.vue");
assertIncludes(renderer, 'image.setAttribute("decoding", "async")', "MarkdownContent.vue");
// 无尺寸公式图兜底高度（历史落库数据缺 width/height）
assertIncludes(renderer, ':deep(img[alt="公式"]:not([width]):not([height]))', "MarkdownContent.vue");
console.log("wrongQuestionImageLoading ok");

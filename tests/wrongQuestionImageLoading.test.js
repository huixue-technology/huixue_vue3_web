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

  assertIncludes(source, "const pagination = reactive({ page: 1, size: 5, total: 0 });", filePath);
  assertIncludes(source, 'loading="lazy"', filePath);
  assertIncludes(source, 'decoding="async"', filePath);
  assertMatches(
    source,
    /<img class="markdown-image"[^`]*loading="lazy"[^`]*decoding="async"/,
    `${filePath} markdown images should lazy-load and decode asynchronously`
  );
}

console.log("wrongQuestionImageLoading ok");

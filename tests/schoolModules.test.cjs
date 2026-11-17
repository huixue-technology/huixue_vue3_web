// 多校模块闸门（vue3 utils/school.ts）：菜单/路由按学校 modules 过滤
require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "commonjs", target: "es2020" },
});
const { test } = require("node:test");
const assert = require("node:assert");

const store = new Map();
global.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};

const {
  menuAllowed,
  routeAllowed,
  getSchoolModules,
  setSelectedSchool,
  getSelectedSchool,
  schoolParamForRequest,
  DEFAULT_SCHOOL,
} = require("../src/utils/school.ts");

test("no module config means everything allowed (single-school legacy)", () => {
  store.clear();
  assert.strictEqual(menuAllowed("wrong_question"), true);
  assert.strictEqual(routeAllowed("/wrong_question"), true);
  assert.strictEqual(getSchoolModules(), null);
});

test("wildcard module allows everything", () => {
  store.clear();
  localStorage.setItem("huixue_school_modules", JSON.stringify(["*"]));
  assert.strictEqual(menuAllowed("wrong_question"), true);
});

test("configured modules gate menu and route keys, others always allowed", () => {
  store.clear();
  localStorage.setItem(
    "huixue_school_modules",
    JSON.stringify(["import", "grade", "paper_view"]),
  );
  assert.strictEqual(menuAllowed("grade"), true);
  assert.strictEqual(menuAllowed("paper_view"), true);
  assert.strictEqual(menuAllowed("wrong_question"), false);
  assert.strictEqual(menuAllowed("gaokao_question_bank"), false);
  // 个人中心/反馈提交通道不受模块限制
  assert.strictEqual(menuAllowed("user/my-info"), true);
  assert.strictEqual(menuAllowed("teacher_info"), true);
  assert.strictEqual(routeAllowed("/wrong_question"), false);
  assert.strictEqual(routeAllowed("/wrong_question/123"), false);
  assert.strictEqual(routeAllowed("/grade"), true);
  assert.strictEqual(routeAllowed("/user/my-info"), true);
});

test("school param is omitted in single-school mode and attached in multi-school", () => {
  setSelectedSchool("sangao");
  assert.strictEqual(getSelectedSchool(), "sangao");
  const multi = [
    { code: "sangao", name: "三高" },
    { code: "huixue", name: "慧学" },
  ];
  assert.strictEqual(schoolParamForRequest(multi, "sangao"), "sangao");
  assert.strictEqual(
    schoolParamForRequest([DEFAULT_SCHOOL], DEFAULT_SCHOOL.code),
    "",
  );
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'module', 'exports', source)((name) => dependencies[name] || require(name), module, module.exports);
  return module.exports;
}

async function check() {
  const { flattenQuestionGroups } = load('src/utils/wrongQuestion.ts');
  const groups = [
    { question_id: 10, is_context: true, sub_questions: [{ question_id: 11, score: 0, sub_questions: [] }, { question_id: 12, sub_questions: [] }] },
    { question_id: 20, parent_id: 999, sub_questions: [] },
  ];
  const rows = flattenQuestionGroups(groups);
  assert.deepEqual(rows.map((row) => row.question_id), [10, 11, 12, 20]);
  assert.deepEqual(rows.filter((row) => !row.is_context).map((row) => row.question_id), [11, 12, 20]);
  assert.equal(rows[1].score, 0);
  assert.equal(groups[0].sub_questions.length, 2);
  assert.deepEqual(flattenQuestionGroups([]), []);

  const { apiErrorMessage } = load('src/utils/apiError.ts');
  assert.equal(apiErrorMessage({ msg: 'params error', data: '学校ID错误' }), '学校ID错误');
  assert.equal(apiErrorMessage({ message: 'Input payload validation failed', errors: { limit: '必须为正整数' } }), '必须为正整数');
  assert.equal(apiErrorMessage(null, '下载失败'), '下载失败');

  let call;
  const request = (url, options) => { call = { url, options }; return Promise.resolve({ code: 200 }); };
  const upload = load('src/servers/api/questionScoreUpload.ts', { '@/utils/request': { default: request } });
  await upload.postQuestionScoreUploadApi({ school_id: 'S01', paper_id: 7 }, {}, new File(['scores'], 'scores.xlsx'));
  assert.equal(call.url, '/api/question_score_upload/question_score');
  assert.equal(call.options.data.get('school_id'), 'S01');
  assert.equal(call.options.data.get('paper_id'), '7');
  assert.equal(call.options.data.get('file').name, 'scores.xlsx');
  assert.equal(call.options.headers, undefined);
  await assert.rejects(upload.postQuestionScoreUploadApi({ school_id: 'S01', paper_id: 0 }, {}, new File([], 'scores.xlsx')));
  const api = load('src/servers/api/wrongQuestion.ts', { '@/utils/request': { default: request } });
  await api.putStudentWrongQuestionReview({ student_uid: 'S001' }, { test_paper_id: 7, question_key: '1.1', class_id: 'C01', is_reviewed: true });
  assert.equal(call.url, '/api/wrong-question/review/student/S001');
  assert.equal(call.options.data.question_key, '1.1');
  await api.getClassQuestionWrongStudents({ question_id: 11, class_id: 'C01', page: 1, size: 10 });
  assert.deepEqual(call.options.params, { question_id: 11, class_id: 'C01', page: 1, size: 10 });
  let responseInterceptor;
  const client = { interceptors: { request: { use() {} }, response: { use(handler) { responseInterceptor = handler; } } } };
  const removed = [];
  global.localStorage = { getItem: () => 'token', removeItem: (key) => removed.push(key) };
  load('src/utils/request.ts', {
    '@/router': { default: { currentRoute: { value: { path: '/user/login' } } } },
    './apiError': { apiErrorMessage },
    'ant-design-vue': { message: { error() {}, info() {} } },
    'umi-request': { extend: () => client },
  });
  await assert.rejects(responseInterceptor(new Response(JSON.stringify({ errors: { limit: '必须为正整数' } }), { status: 400 })), /必须为正整数/);
  await assert.rejects(responseInterceptor(new Response(JSON.stringify({ data: '服务异常' }), { status: 500 })), /服务异常/);
  assert.deepEqual(removed, []);
  await assert.rejects(responseInterceptor(new Response('{}', { status: 401 })), /认证失败/);
  const ok = new Response('file');
  assert.equal(await responseInterceptor(ok), ok);
  console.log('接口同步检查通过：母子题、上下文选择、零分、错误响应、上传及订正/名单请求。');
}
check().catch((error) => { console.error(error); process.exitCode = 1; });

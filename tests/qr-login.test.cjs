const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/utils/qrLogin.ts'), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const ticket = 'aaaaaaaaaaaaaaaaaaaaaa';
const settle = () => new Promise(resolve => setImmediate(resolve));

test('成绩页优先使用绑定班级，仍可选其他班级，无绑定时使用上次选择', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/utils/teacherClasses.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  let stored = '11';
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports, require: () => ({}),
    localStorage: { getItem: () => stored },
  });
  const { preferredTeacherClass } = module.exports;
  const classes = [{ id: 11, is_bound: false }, { id: 12, is_bound: true }, { id: 13, is_bound: true }];
  assert.equal(preferredTeacherClass({ role: 'T' }, classes).id, 12);
  stored = '13';
  assert.equal(preferredTeacherClass({ role: 'T' }, classes).id, 13);
  assert.equal(preferredTeacherClass({ role: 'T' }, [{ id: 11 }, { id: 13 }]).id, 13);
});

function setup(client = 'portal', onSuccess) {
  const calls = [];
  const timers = new Map();
  const ready = [];
  const users = [];
  const errors = [];
  let now = 1800000000000;
  let id = 0;
  const module = { exports: {} };
  vm.runInNewContext(js, {
    module, exports: module.exports, AbortController,
    Date: class extends Date { static now() { return now; } },
    fetch: (url, options) => new Promise((resolve, reject) => calls.push({ url, options, resolve, reject })),
    setTimeout: fn => { timers.set(++id, fn); return id; },
    clearTimeout: key => timers.delete(key),
  });
  const stop = module.exports.startQrLogin(client, {
    onReady: code => ready.push(code),
    onSuccess: async (user, signal) => {
      if (onSuccess) await onSuccess(user, signal);
      else users.push(user);
    },
    onError: error => errors.push(error),
  });
  return {
    calls, ready, users, errors, timers, stop,
    code: changes => ({ ticket, browser_secret: 'browser-only-secret',
      qr_image: 'data:image/png;base64,dGVzdA==', expires_at: now / 1000 + 120, ...changes }),
    reply: (index, data, status = 200, msg = 'success') => calls[index].resolve({
      ok: status === 200, json: async () => ({ code: status, data, msg }),
    }),
    tick: (seconds = 2) => {
      now += seconds * 1000;
      for (const [key, fn] of [...timers]) { timers.delete(key); void fn(); }
    },
  };
}

for (const client of ['admin', 'portal']) {
  test(`${client}: 使用浏览器凭证轮询，只在确认后领取结果`, async () => {
    const h = setup(client);
    assert.equal(JSON.parse(h.calls[0].options.body).client, client);
    h.reply(0, h.code());
    await settle();
    assert.equal(h.ready.length, 1);
    assert.equal(h.ready[0].browser_secret, undefined);
    h.tick();
    assert.equal(h.calls[1].url, `/api/auth/qr/${ticket}/status`);
    h.reply(1, { status: 'pending' });
    await settle();
    assert.equal(h.users.length, 0);
    h.tick();
    h.reply(2, { status: 'confirmed' });
    await settle();
    assert.equal(h.calls[3].url, `/api/auth/qr/${ticket}/consume`);
    h.reply(3, { token: 'platform-token', teacher: { uid: 'T1' } });
    await settle();
    assert.equal(h.users.length, 1);
    assert.equal(h.users[0].token, 'platform-token');
    assert.equal(h.timers.size, 0);
    assert.equal(h.errors.length, 0);
    for (const call of h.calls) {
      assert.equal(call.options.method, 'POST');
      assert.equal(call.options.credentials, 'omit');
      assert.doesNotMatch(call.url, /browser-only-secret/);
    }
    assert.equal(JSON.parse(h.calls[3].options.body).browser_secret, 'browser-only-secret');
  });
}

test('切换登录方式或刷新时，旧请求完成后不会更新二维码或登录身份', async () => {
  const h = setup();
  h.stop();
  h.reply(0, h.code());
  await settle();
  assert.equal(h.ready.length, 0);
  assert.equal(h.timers.size, 0);
  assert.equal(h.calls[0].options.signal.aborted, true);
  const pending = setup();
  pending.reply(0, pending.code());
  await settle();
  pending.tick();
  pending.reply(1, { status: 'confirmed' });
  await settle();
  pending.stop();
  pending.reply(2, { token: 'old-platform-token' });
  await settle();
  assert.equal(pending.users.length, 0);
  assert.equal(pending.errors.length, 0);
});

test('本地登录码过期会停止轮询并提示刷新', async () => {
  const h = setup();
  h.reply(0, h.code());
  await settle();
  h.tick(121);
  await settle();
  assert.equal(h.calls.length, 1);
  assert.match(h.errors[0], /过期/);
  assert.equal(h.timers.size, 0);
});

test('领取后加载账号资料期间取消，后续登录逻辑能感知取消状态', async () => {
  let finish;
  let signal;
  const pending = new Promise(resolve => { finish = resolve; });
  const h = setup('portal', async (user, scope) => {
    signal = scope;
    await pending;
    if (!scope.aborted) h.users.push(user);
  });
  h.reply(0, h.code());
  await settle();
  h.tick();
  h.reply(1, { status: 'confirmed' });
  await settle();
  h.reply(2, { token: 'platform-token' });
  await settle();
  assert.equal(signal.aborted, false);
  h.stop();
  finish();
  await settle();
  assert.equal(signal.aborted, true);
  assert.equal(h.users.length, 0);
});

test('服务端无权限、过期和未配置的错误均不进入登录成功态', async () => {
  for (const [status, msg] of [[403, '无权领取'], [410, '二维码过期'], [503, '微信登录尚未配置']]) {
    const h = setup();
    h.reply(0, null, status, msg);
    await settle();
    assert.equal(h.errors[0], msg);
    assert.equal(h.users.length, 0);
    assert.equal(h.timers.size, 0);
  }
});

test('只接受图片数据二维码，拒绝远程图片地址及异常票据', async () => {
  for (const changes of [{ qr_image: 'https://untrusted.example/image' }, { ticket: '../wrong' }, { browser_secret: '' }]) {
    const h = setup();
    h.reply(0, h.code(changes));
    await settle();
    assert.equal(h.ready.length, 0);
    assert.match(h.errors[0], /无效/);
  }
});

test('重复领取或响应缺少平台 token 时，不写入登录状态', async () => {
  for (const bad of ['consumed', 'missing-token']) {
    const h = setup();
    h.reply(0, h.code());
    await settle();
    h.tick();
    h.reply(1, { status: bad === 'consumed' ? 'consumed' : 'confirmed' });
    await settle();
    if (bad === 'missing-token') { h.reply(2, { name: 'user' }); await settle(); }
    assert.equal(h.users.length, 0);
    assert.equal(h.errors.length, 1);
  }
});

test('网络中断会停止本次会话并允许界面重新生成二维码', async () => {
  const h = setup();
  h.calls[0].reject(new Error('network failed'));
  await settle();
  assert.equal(h.errors.length, 1);
  assert.equal(h.timers.size, 0);
  assert.equal(h.users.length, 0);
});

test('显式的新登录凭证不会被请求拦截器中的旧本地 token 覆盖', () => {
  const requestSource = fs.readFileSync(path.join(__dirname, '../src/utils/request.ts'), 'utf8');
  const requestJS = ts.transpileModule(requestSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  let intercept;
  const request = { interceptors: {
    request: { use: fn => { intercept = fn; } }, response: { use: () => {} },
  } };
  vm.runInNewContext(requestJS, {
    exports: {},
    localStorage: { getItem: () => 'old-token' },
    require: name => {
      if (name === 'umi-request') return { extend: () => request };
      return {};
    },
  });
  const explicit = intercept('/api/classes/C1', { headers: { Authorization: 'Bearer new-token' } });
  assert.equal(explicit.options.headers.Authorization, 'Bearer new-token');
  const implicit = intercept('/api/classes/C1', {});
  assert.equal(implicit.options.headers.Authorization, 'Bearer old-token');
});

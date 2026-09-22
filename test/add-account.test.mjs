// dsh-chanhub —— 「添加账号」功能测试。
//
// 覆盖三层，缺一层就留下真实缺陷的口子：
//   1. 宿主端点契约：loginStart / loginPoll / getChannels 转发到正确的网关路径，
//      并如实降级（旧网关无不支持 workbuddy 时不渲染入口）。
//   2. 客户端能力探测：probe 读 login_channels 而不是只探路由存在性 —— 这是
//      「旧网关同样注册了 /panel/api/channels 却对 workbuddy 回 400」的区分点。
//   3. 弹窗渲染与轮询：三段状态机（idle → awaiting → done/error）+ 定时器清理。
//
// 真机验证见 e2e-live-gateway.test.mjs 的 L 组。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const REACT_DIR = process.env.DSHC_REACT_DIR ?? '/tmp/dshc-render';
let React;
let ReactDOMClient;
let JSDOM;
let require_;

try {
  const { createRequire } = await import('node:module');
  require_ = createRequire(`${REACT_DIR}/index.js`);
  React = require_('react');
  ReactDOMClient = require_('react-dom/client');
  ({ JSDOM } = require_('jsdom'));
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
} catch {
  // 无 react/jsdom 时渲染用例自动跳过（宿主侧用例照常跑）。
}

/**
 * 加载打包产物并从**真实 jsdom window** 里取 AddAccountDialog。
 *
 * 两个必须点：
 *   1. 走产物而不是 import 源码 —— 源码依赖宿主注入的 React（不在 node_modules），
 *      直接 import 会 ERR_MODULE_NOT_FOUND；产物是 CJS + loader 形态，正是浏览器
 *      里真正跑的那份。
 *   2. `window` 参数**必须**是真实 jsdom window（`__ModuleLoader__` 挂在它上面）：
 *      bundle 里 `window.open(...)` 的自由变量解析到的是这个参数，传个 shim 对象
 *      就会得到 "window.open is not a function"（真机踩到）。与 client-render.test.mjs
 *      的 loadBundle 同一纪律。
 *
 * @param windowObject - 真实 jsdom window。
 * @returns 组件函数。
 */
function loadDialogFromBundle(windowObject) {
  const source = readFileSync(resolve(root, 'client/client.js'), 'utf8');
  const registration = { id: undefined, factory: undefined };
  windowObject.__ModuleLoader__ = {
    load: ({ id, factory }) => { registration.id = id; registration.factory = factory; },
  };
  const fn = new Function('window', 'module', 'exports', 'require', `${source}\nreturn module.exports;`);
  fn(windowObject, { exports: {} }, {}, (id) => {
    if (id === 'react') return React;
    // 打包产物现在也 require react-dom（侧边栏 popover 走 createPortal）
    if (id === 'react-dom') return require_('react-dom');
    throw new Error(`unexpected require(${JSON.stringify(id)})`);
  });
  assert.equal(registration.id, 'dsh-chanhub', 'bundle 的 loaderId 必须与包名一致');
  const mod = registration.factory((id) => {
    if (id === 'react') return React;
    // 打包产物现在也 require react-dom（侧边栏 popover 走 createPortal）
    if (id === 'react-dom') return require_('react-dom');
    throw new Error(`unexpected require(${JSON.stringify(id)})`);
  });
  return mod.AddAccountDialog;
}

/**
 * 起一个假网关，把 login 相关请求记录下来并按脚本响应。
 * @param routes - `{path: (req, res, body) => void}`。
 * @returns `{baseURL, calls, close}`。
 */
async function fakeGateway(routes) {
  const calls = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const url = new URL(req.url, 'http://127.0.0.1');
      calls.push({ method: req.method, path: url.pathname, query: url.searchParams, body });
      const handler = routes[url.pathname];
      if (!handler) {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('404 page not found');
        return;
      }
      handler(req, res, body, url);
    });
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address();
  return {
    baseURL: `http://127.0.0.1:${port}`,
    calls,
    close: () => new Promise((done) => server.close(done)),
  };
}

/** 构造一个只连到假网关的客户端。 */
async function clientFor(gateway) {
  const { ChanhubClient } = await import('../lib/chanhub-client.js');
  return new ChanhubClient({ resolveConfig: () => ({ baseURL: gateway.baseURL, apiKey: 'k' }) });
}

/**
 * 构造可直接调用 RPC handler 的宿主运行时。
 *
 * 走真实的 createRuntime(ctx)：用一个只提供 settings 的最小 ctx（本机
 * /panel/api 不需要 credentials，apiKey 由 settings.apiKey 明文字段提供）。
 * 不用手工构造 runtime 对象 —— 那样会绕过 settings 解析，测不到真实读配置路径。
 *
 * @param gateway - 假网关。
 * @returns `async (endpoint, payload) => 结果信封`。
 */
async function hostFor(gateway) {
  const { createHandler, createRuntime, SETTINGS_NAMESPACE } = await import('../lib/index.js');
  // 注意顺序：register 会先灌 SETTINGS_DEFAULTS（baseURL 默认 127.0.0.1:7866），
  // 覆盖必须发生在**读取时**，否则请求会打到真实网关上去（真机踩到：
  // 测试拿到 401，因为请求去了本机 7866 而不是假网关）。
  const defaults = {};
  const fakeCtx = {
    logger: undefined,
    get: (name) => (name === 'settings'
      ? {
          register: (_ns, _schema, options) => {
            Object.assign(defaults, options?.base ?? {});
            return { get: () => ({ ...defaults, baseURL: gateway.baseURL, apiKey: 'k', apiKeyEnv: '' }) };
          },
        }
      : undefined),
  };
  const runtime = createRuntime(fakeCtx);
  assert.equal(typeof runtime.client.loginStart, 'function', 'runtime 必须暴露登录客户端方法');
  return createHandler(runtime);
}

function json(res, code, value) {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(value));
}

// ---- 宿主端点 ----

test('H1 loginStart 打到 POST /panel/api/login/start 并透传 url/realm', async () => {
  const gw = await fakeGateway({
    '/panel/api/login/start': (req, res) => json(res, 200, {
      status: 'started',
      url: 'https://copilot.tencent.com/login?state=abc',
      realm: 'cn',
    }),
  });
  try {
    const rpc = await hostFor(gw);
    const result = await rpc('loginStart', { channel: 'workbuddy', realm: 'cn' });
    assert.equal(result.ok, true);
    assert.equal(result.value.url, 'https://copilot.tencent.com/login?state=abc');
    assert.equal(result.value.realm, 'cn');
    assert.equal(gw.calls.length, 1);
    assert.equal(gw.calls[0].method, 'POST');
    assert.equal(gw.calls[0].query.get('channel'), 'workbuddy');
    // cn 是默认域，不必显式进 query（网关侧缺省即 cn）。
    assert.equal(gw.calls[0].query.get('realm'), null);
  } finally {
    await gw.close();
  }
});

test('H2 loginStart realm=global 显式带上 realm 参数', async () => {
  const gw = await fakeGateway({
    '/panel/api/login/start': (req, res) => json(res, 200, {
      status: 'started', url: 'https://www.workbuddy.ai/login?state=x', realm: 'global',
    }),
  });
  try {
    const rpc = await hostFor(gw);
    const result = await rpc('loginStart', { channel: 'workbuddy', realm: 'global' });
    assert.equal(result.ok, true);
    assert.equal(gw.calls[0].query.get('realm'), 'global');
  } finally {
    await gw.close();
  }
});

test('H3 loginPoll 透传 status 三态，且不让 HTTP 错误体污染业务状态', async () => {
  let pollCount = 0;
  const gw = await fakeGateway({
    '/panel/api/login/poll': (req, res) => {
      pollCount += 1;
      if (pollCount === 1) return json(res, 200, { status: 'pending' });
      if (pollCount === 2) return json(res, 200, { status: 'error', error: '授权链接已过期' });
      return json(res, 200, {
        status: 'done', uid: 'uid-1', nickname: '甲', channel: 'workbuddy', realm: 'cn', credits: 120,
      });
    },
  });
  try {
    const rpc = await hostFor(gw);
    const first = await rpc('loginPoll', { channel: 'workbuddy' });
    assert.equal(first.value.status, 'pending');
    const second = await rpc('loginPoll', { channel: 'workbuddy' });
    assert.equal(second.value.status, 'error');
    assert.equal(second.value.error, '授权链接已过期');
    const third = await rpc('loginPoll', { channel: 'workbuddy' });
    assert.equal(third.value.status, 'done');
    assert.equal(third.value.uid, 'uid-1');
    assert.equal(third.value.credits, 120);
    assert.deepEqual(gw.calls.map((c) => c.method), ['GET', 'GET', 'GET']);
  } finally {
    await gw.close();
  }
});

test('H4 getChannels 读 login_channels；旧网关缺该键时回退并剔除 workbuddy', async () => {
  const modern = await fakeGateway({
    '/panel/api/channels': (req, res) => json(res, 200, {
      channels: ['workbuddy', 'traework', 'qoder'],
      login_channels: ['workbuddy', 'traework', 'qoder'],
      realms: ['cn', 'global'],
    }),
  });
  const legacy = await fakeGateway({
    // 旧网关：路由在，但没有 workbuddy 登录分支、也没有 login_channels 键。
    '/panel/api/channels': (req, res) => json(res, 200, {
      channels: ['workbuddy', 'traework', 'qoder'],
      note: '账号分布见 /status（accounts[].channel）',
    }),
  });
  try {
    const modernRpc = await hostFor(modern);
    const modernResult = await modernRpc('getChannels', {});
    assert.deepEqual(modernResult.value.loginChannels, ['workbuddy', 'traework', 'qoder']);
    assert.deepEqual(modernResult.value.realms, ['cn', 'global']);

    const legacyRpc = await hostFor(legacy);
    const legacyResult = await legacyRpc('getChannels', {});
    assert.deepEqual(legacyResult.value.loginChannels, ['traework', 'qoder']);
    assert.deepEqual(legacyResult.value.realms, ['cn']);
  } finally {
    await modern.close();
    await legacy.close();
  }
});

test('H5 getChannels 连不通网关时降级为空列表（不抛，面板据此隐藏入口）', async () => {
  const gw = await fakeGateway({}); // 无 /panel/api/channels 路由
  try {
    const rpc = await hostFor(gw);
    const result = await rpc('getChannels', {});
    assert.equal(result.ok, true);
    assert.deepEqual(result.value.loginChannels, []);
    assert.equal(result.value.available, false);
    assert.match(result.value.message, /添加账号不可用/);
  } finally {
    await gw.close();
  }
});

test('H6 loginStart 上游 400 unknown channel → 结构化 error（不是静默成功）', async () => {
  const gw = await fakeGateway({
    '/panel/api/login/start': (req, res) => json(res, 400, { error: 'unknown channel: workbuddy' }),
  });
  try {
    const rpc = await hostFor(gw);
    const result = await rpc('loginStart', { channel: 'workbuddy' });
    assert.equal(result.ok, false);
    assert.match(result.error.message, /400|unknown channel/);
  } finally {
    await gw.close();
  }
});

// ---- 外部回调（traework）----

test('H8 loginStart 透传 traework 的回调地址与 needs_paste', async () => {
  const gw = await fakeGateway({
    '/panel/api/login/start': (req, res) => json(res, 200, {
      status: 'started',
      url: 'https://www.trae.cn/authorization?...',
      callback_url: 'http://127.0.0.1:18080/authorize',
      needs_paste: true,
    }),
  });
  try {
    const rpc = await hostFor(gw);
    const result = await rpc('loginStart', { channel: 'traework', realm: 'cn' });
    assert.equal(result.ok, true);
    assert.equal(result.value.needs_paste, true);
    // 回调地址必须是 loopback。Trae 授权页硬性校验
    //   /^http:\/\/127\.0\.0\.1:(\d+)\/authorize$/
    // 非 loopback（面板 origin、公网域名、局域网 IP）会被判 invalidUrl 并显示
    // 「网络错误，请刷新页面重试。」—— 真机踩到过，这条断言把它钉住。
    assert.match(
      result.value.callback_url,
      /^http:\/\/127\.0\.0\.1:\d+\/authorize$/,
      'Trae 只接受 127.0.0.1 的 /authorize 回调',
    );
    assert.equal(gw.calls[0].method, 'POST');
    assert.equal(gw.calls[0].query.get('channel'), 'traework');
  } finally {
    await gw.close();
  }
});

test('H9 loginStart 不得发送 callback_base（该参数只会拼出 Trae 拒绝的地址）', async () => {
  const gw = await fakeGateway({
    '/panel/api/login/start': (req, res) => json(res, 200, { status: 'started', url: 'https://x/y' }),
  });
  try {
    const rpc = await hostFor(gw);
    await rpc('loginStart', { channel: 'traework' });
    assert.equal(
      gw.calls[0].query.get('callback_base'),
      null,
      'callback_base 必须已废弃：Trae 只接受 loopback 回调',
    );
  } finally {
    await gw.close();
  }
});

test('H10 loginCallback 打到 POST /panel/api/login/callback 并带上 callback', async () => {
  const gw = await fakeGateway({
    '/panel/api/login/callback': (req, res, body) => {
      assert.equal(req.method, 'POST');
      const parsed = JSON.parse(body);
      assert.equal(parsed.callback, 'http://127.0.0.1:18080/authorize?refreshToken=rt-1');
      json(res, 200, { status: 'received' });
    },
  });
  try {
    const rpc = await hostFor(gw);
    const result = await rpc('loginCallback', {
      channel: 'traework',
      callback: 'http://127.0.0.1:18080/authorize?refreshToken=rt-1',
    });
    assert.equal(result.ok, true);
    assert.equal(result.value.status, 'received');
    assert.equal(gw.calls[0].method, 'POST');
    assert.equal(gw.calls[0].query.get('channel'), 'traework');
  } finally {
    await gw.close();
  }
});

test('H11 loginCallback 网关回 error 时如实透传（不让面板误以为成功）', async () => {
  const gw = await fakeGateway({
    '/panel/api/login/callback': (req, res) => json(res, 200, { status: 'error', error: '这段内容里没有找到登录凭证' }),
  });
  try {
    const rpc = await hostFor(gw);
    const result = await rpc('loginCallback', { channel: 'traework', callback: 'x' });
    assert.equal(result.ok, true);
    assert.equal(result.value.status, 'error');
  } finally {
    await gw.close();
  }
});

// ---- Trae 授权回调的浏览器落点 ----

test('H16 probe 的 loginApi 同时反映路由存在性与渠道可用性', async () => {
  const reachable = await fakeGateway({
    '/healthz': (req, res) => json(res, 200, { service: 'chanhub2api', healthy: 1, total: 1 }),
    '/status': (req, res) => json(res, 200, { accounts: [] }),
    '/panel/api/channels': (req, res) => json(res, 200, {
      channels: ['workbuddy', 'traework'],
      login_channels: ['workbuddy', 'traework'],
      realms: ['cn'],
    }),
  });
  // 形状较老的网关（只有 channels、没有 login_channels）—— 与 service 名无关，两边都用新名
  const legacy = await fakeGateway({
    '/healthz': (req, res) => json(res, 200, { service: 'chanhub2api', healthy: 1, total: 1 }),
    '/status': (req, res) => json(res, 200, { accounts: [] }),
    '/panel/api/channels': (req, res) => json(res, 200, { channels: ['workbuddy', 'traework'] }),
  });
  try {
    const a = await clientFor(reachable);
    const probeA = await a.versionProbe({ force: true });
    assert.equal(probeA.features.loginApi, true);
    assert.deepEqual(probeA.loginChannels, ['workbuddy', 'traework']);

    const b = await clientFor(legacy);
    const probeB = await b.versionProbe({ force: true });
    assert.equal(probeB.features.loginApi, true, '路由存在 → loginApi 为真');
    assert.deepEqual(probeB.loginChannels, ['traework'], '但渠道按 login_channels 回退，剔除 workbuddy');
  } finally {
    await reachable.close();
    await legacy.close();
  }
});

test('H15 网关完全无 /panel/api/* 时 probe 不崩，loginApi=false', async () => {
  const gw = await fakeGateway({
    '/healthz': (req, res) => json(res, 200, { service: 'workbuddy2api', healthy: 0, total: 0 }),
    '/status': (req, res) => json(res, 200, { accounts: [] }),
  });
  try {
    const client = await clientFor(gw);
    const probe = await client.versionProbe({ force: true });
    assert.equal(probe.features.loginApi, false);
    assert.deepEqual(probe.loginChannels, []);
  } finally {
    await gw.close();
  }
});

// ---- 弹窗组件 ----
//
// 全部用 jsdom + 真实 react-dom 挂载打包产物里的 AddAccountDialog。
// 全局 document/window 必须临时接管（组件里用 document.addEventListener 等），
// 与 client-render.test.mjs 的 captureGlobals 同一手法。

// 只接管 DOM 相关全局。**绝不能**把 globalThis.setTimeout 指向 jsdom 的
// window.setTimeout：jsdom 实现内部会回调宿主定时器，指向自己即无限递归
// （真机踩到 "Maximum call stack size exceeded"）。计时器保持宿主 Node 的，
// 组件里的 setTimeout 调用因此落在真实时间轴上，测试照样能等到点。
const GLOBAL_KEYS = ['document', 'window', 'HTMLElement', 'Node'];

/** 暂存将被覆盖的全局。 */
function captureGlobals(keys) {
  return keys.map((key) => ({ key, had: key in globalThis, value: globalThis[key] }));
}

/** 还原全局。 */
function restoreGlobals(saved) {
  for (const entry of saved) {
    if (entry.had) globalThis[entry.key] = entry.value;
    else delete globalThis[entry.key];
  }
}

/**
 * 挂载弹窗。
 * @param props - 组件 props。
 * @returns `{container, window, act, cleanup}`。
 */
async function mountDialog(props) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    pretendToBeVisual: true,
    url: 'http://localhost/',
  });
  const { window } = dom;
  window.open = () => null; // jsdom 不实现 window.open；组件会调用它开授权页
  const saved = captureGlobals(GLOBAL_KEYS);
  for (const key of GLOBAL_KEYS) globalThis[key] = window[key];
  globalThis.document = window.document;
  globalThis.window = window;

  const { act } = React;
  const AddAccountDialog = loadDialogFromBundle(window);
  const container = window.document.getElementById('root');
  let root;
  await act(async () => {
    root = ReactDOMClient.createRoot(container);
    root.render(React.createElement(AddAccountDialog, props));
  });

  const cleanup = async () => {
    try {
      await act(async () => root.unmount());
    } catch { /* 卸载失败不影响断言 */ }
    restoreGlobals(saved);
    dom.window.close();
  };
  return { container, window, act, cleanup };
}

/** 等待真实时间过去（轮询间隔是 2.5s，必须让真计时器到点）。 */
async function waitFor(act, ms) {
  await act(async () => {
    await new Promise((done) => setTimeout(done, ms));
  });
}

/** 按文本找按钮。 */
function buttonByText(container, text) {
  return [...container.querySelectorAll('button')].find((b) => b.textContent.includes(text));
}

/**
 * 把文本写进**受控**输入框并触发 React 的 onChange。
 *
 * 为什么不能用「原生 setter + dispatchEvent('input')」这套常见手法：
 * React 19 在 node 上装了 value 追踪器（`_valueTracker`），jsdom 里派发的
 * input 事件会被它判定为「值未变化」而丢弃 —— 实测原生监听器收得到、React 的
 * onChange 收不到，受控组件状态不动（提交按钮因此一直 disabled）。
 * 直接调用挂在 node 上的 `__reactProps$.onChange` 才是真实驱动组件状态的路径，
 * 断言因此测的是组件行为而非 DOM 属性。
 *
 * @param node - 目标输入元素（textarea/input）。
 * @param value - 要写入的值。
 */
function typeInto(node, value) {
  const key = Object.keys(node).find((k) => k.startsWith('__reactProps'));
  assert.ok(key, '找不到 React props（受控输入无法驱动）');
  const onChange = node[key]?.onChange;
  assert.equal(typeof onChange, 'function', '目标元素没有 onChange 处理器');
  onChange({ target: { value } });
}

const dialogTests = React ? test : test.skip;

dialogTests('D1 未提供任何渠道时渲染「网关不支持」提示，不给出必然失败的按钮', async () => {
  const { container, act, cleanup } = await mountDialog({
    channels: [], realms: [], onClose: () => {}, onDone: () => {},
  });
  try {
    const text = container.textContent;
    assert.match(text, /添加账号/);
    assert.match(text, /未提供可用的登录渠道/);
    assert.equal(Boolean(buttonByText(container, '获取授权链接')), false);
  } finally {
    await cleanup();
  }
});

dialogTests('D2 idle → awaiting：渲染授权链接、自动打开、显示等待态', async () => {
  const opened = [];
  const { container, window, act, cleanup } = await mountDialog({
    channels: ['workbuddy'],
    realms: ['cn', 'global'],
    onStart: async () => ({ ok: true, value: { url: 'https://copilot.tencent.com/login?state=abc' } }),
    onPoll: async () => ({ ok: true, value: { status: 'pending' } }),
    onClose: () => {},
    onDone: () => {},
  });
  window.open = (url) => { opened.push(url); return null; };
  try {
    const button = buttonByText(container, '获取授权链接');
    assert.ok(button, '应渲染「获取授权链接」按钮');
    await act(async () => { button.click(); });
    await waitFor(act, 20);

    assert.match(container.textContent, /等待授权完成/, '应进入等待态');
    const link = container.querySelector('a[href^="https://copilot.tencent.com"]');
    assert.ok(link, '授权链接必须可见可点（不依赖 window.open 成功）');
    assert.equal(opened[0], 'https://copilot.tencent.com/login?state=abc', '应自动打开授权页');
  } finally {
    await cleanup();
  }
});

dialogTests('D3 poll done：展示 uid / 昵称 / 积分，并回调 onDone 刷新账号池', async () => {
  const doneCalls = [];
  const { container, act, cleanup } = await mountDialog({
    channels: ['workbuddy'],
    realms: ['cn'],
    onStart: async () => ({ ok: true, value: { url: 'https://x.test/auth' } }),
    onPoll: async () => ({
      ok: true,
      value: { status: 'done', uid: 'uid-9', nickname: '乙', realm: 'cn', credits: 88, checkin_message: '签到成功' },
    }),
    onClose: () => {},
    onDone: () => { doneCalls.push(1); },
  });
  try {
    await act(async () => { buttonByText(container, '获取授权链接').click(); });
    await waitFor(act, 2700); // 轮询间隔 2.5s：等一轮

    const text = container.textContent;
    assert.match(text, /已添加/);
    assert.match(text, /uid-9/);
    assert.match(text, /乙/);
    assert.match(text, /88/);
    assert.match(text, /签到成功/);
    assert.ok(doneCalls.length >= 1, 'onDone 必须被调用');
  } finally {
    await cleanup();
  }
});

dialogTests('D4 poll error：展示错误并提供「重新开始」重试路径', async () => {
  const { container, act, cleanup } = await mountDialog({
    channels: ['workbuddy'],
    realms: ['cn'],
    onStart: async () => ({ ok: true, value: { url: 'https://x.test/auth' } }),
    onPoll: async () => ({ ok: true, value: { status: 'error', error: '授权链接已超过 15 分钟有效期' } }),
    onClose: () => {},
    onDone: () => {},
  });
  try {
    await act(async () => { buttonByText(container, '获取授权链接').click(); });
    await waitFor(act, 2700);

    assert.match(container.textContent, /15 分钟有效期/);
    assert.ok(buttonByText(container, '重新开始'), '错误态必须给出重试路径');
  } finally {
    await cleanup();
  }
});

dialogTests('D5 onStart 失败：就地报错，不进入等待态、不起轮询', async () => {
  let polls = 0;
  const { container, act, cleanup } = await mountDialog({
    channels: ['workbuddy'],
    realms: ['cn'],
    onStart: async () => ({ ok: false, error: { message: '该网关版本不支持在面板里添加 workbuddy 账号' } }),
    onPoll: async () => { polls += 1; return { ok: true, value: { status: 'pending' } }; },
    onClose: () => {},
    onDone: () => {},
  });
  try {
    await act(async () => { buttonByText(container, '获取授权链接').click(); });
    await waitFor(act, 2700);

    assert.match(container.textContent, /不支持在面板里添加 workbuddy 账号/);
    assert.equal(container.textContent.includes('等待授权完成'), false);
    assert.equal(polls, 0, '发起失败后不应起轮询');
  } finally {
    await cleanup();
  }
});

dialogTests('D6 关闭弹窗后在途轮询必须停止（定时器零泄漏）', async () => {
  let polls = 0;
  let closed = 0;
  const { container, window, act, cleanup } = await mountDialog({
    channels: ['workbuddy'],
    realms: ['cn'],
    onStart: async () => ({ ok: true, value: { url: 'https://x.test/auth' } }),
    onPoll: async () => { polls += 1; return { ok: true, value: { status: 'pending' } }; },
    onClose: () => { closed += 1; },
    onDone: () => {},
  });
  try {
    await act(async () => { buttonByText(container, '获取授权链接').click(); });
    await waitFor(act, 2700);
    const afterFirst = polls;
    assert.ok(afterFirst >= 1, '应至少轮询一次');

    await act(async () => { window.document.querySelector('.dshc-drawer-close').click(); });
    assert.equal(closed, 1, 'onClose 应被调用');

    await waitFor(act, 6000);
    assert.equal(polls, afterFirst, '关闭后不得再轮询');
  } finally {
    await cleanup();
  }
});

dialogTests('D7 切换渠道后丢弃上一轮的授权链接与轮询结果', async () => {
  const started = [];
  const { container, act, cleanup } = await mountDialog({
    channels: ['workbuddy', 'qoder'],
    realms: ['cn'],
    onStart: async (channel) => {
      started.push(channel);
      return { ok: true, value: { url: `https://x.test/${channel}` } };
    },
    onPoll: async () => ({ ok: true, value: { status: 'pending' } }),
    onClose: () => {},
    onDone: () => {},
  });
  try {
    await act(async () => { buttonByText(container, '获取授权链接').click(); });
    await waitFor(act, 20);
    assert.match(container.textContent, /x\.test\/workbuddy/);

    // 切到 QoderWork：必须回到 idle（旧 URL 消失）。
    await act(async () => { buttonByText(container, 'QoderWork').click(); });
    await waitFor(act, 20);
    assert.equal(container.textContent.includes('x.test/workbuddy'), false, '切渠道后旧链接必须消失');
    assert.ok(buttonByText(container, '获取授权链接'), '切渠道后应回到可重新发起的 idle 态');
  } finally {
    await cleanup();
  }
});

// ---- D8~：外部回调（traework）在浏览器侧的契约 ----

dialogTests('D8 traework：start 不带多余参数，渲染 loopback 地址与粘贴框', async () => {
  const seen = [];
  const { container, act, cleanup } = await mountDialog({
    channels: ['traework'],
    realms: ['cn'],
    onStart: async (...args) => {
      seen.push(args);
      return {
        ok: true,
        value: {
          url: 'https://www.trae.cn/authorization?x=1',
          callback_url: 'http://127.0.0.1:18080/authorize',
          needs_paste: true,
        },
      };
    },
    onPoll: async () => ({ ok: true, value: { status: 'pending' } }),
    onCallback: async () => ({ ok: true, value: { status: 'received' } }),
    onClose: () => {},
    onDone: () => {},
  });
  try {
    await act(async () => { buttonByText(container, '获取授权链接').click(); });
    await waitFor(act, 20);

    // onStart(channel, realm) —— 回调地址由 Trae 的硬性规则决定，
    // 面板不该再传任何「回调基址」（传了也只会拼出被拒绝的地址）。
    assert.equal(seen.length, 1);
    assert.equal(seen[0].length, 2, `onStart 只应收到 (channel, realm)，实际 ${seen[0].length} 个参数`);

    // 必须把「打不开的地址」明示出来，并给出粘贴入口
    assert.match(container.textContent, /127\.0\.0\.1:18080/, '应展示用户会看到的 loopback 地址');
    assert.ok(container.querySelector('textarea'), '应渲染粘贴输入框');
    assert.ok(buttonByText(container, '提交并完成登录'), '应渲染提交按钮');
    // 文案必须解释「打不开是正常的」——否则用户会以为登录失败
    assert.match(container.textContent, /打不开|不是故障/, '必须解释该地址打不开属正常');
  } finally {
    await cleanup();
  }
});

dialogTests('D9 粘贴回调：提交后不直接置 done（结果以轮询为准），且失败就地报错', async () => {
  const submitted = [];
  const { container, act, cleanup } = await mountDialog({
    channels: ['traework'],
    realms: ['cn'],
    onStart: async () => ({
      ok: true,
      value: {
        url: 'https://www.trae.cn/authorization?x=1',
        callback_url: 'http://127.0.0.1:18080/authorize',
        needs_paste: true,
      },
    }),
    onPoll: async () => ({ ok: true, value: { status: 'pending' } }),
    onCallback: async (channel, callback) => {
      submitted.push({ channel, callback });
      return { ok: true, value: { status: 'error', error: '这段内容里没有找到登录凭证' } };
    },
    onClose: () => {},
    onDone: () => {},
  });
  try {
    await act(async () => { buttonByText(container, '获取授权链接').click(); });
    await waitFor(act, 20);

    const textarea = container.querySelector('textarea');
    await act(async () => {
      typeInto(textarea, 'http://127.0.0.1:18080/authorize?refreshToken=RT');
    });
    await act(async () => { buttonByText(container, '提交并完成登录').click(); });
    await waitFor(act, 20);

    assert.equal(submitted.length, 1);
    assert.equal(submitted[0].channel, 'traework');
    assert.equal(submitted[0].callback, 'http://127.0.0.1:18080/authorize?refreshToken=RT');
    // 网关拒绝 → 就地显示原因，不假装成功
    assert.match(container.textContent, /没有找到登录凭证/);
  } finally {
    await cleanup();
  }
});

dialogTests('D10 非外部回调渠道不渲染粘贴框（workbuddy 无回调可粘）', async () => {
  const { container, act, cleanup } = await mountDialog({
    channels: ['workbuddy'],
    realms: ['cn'],
    onStart: async () => ({ ok: true, value: { url: 'https://copilot.tencent.com/login?state=abc' } }),
    onPoll: async () => ({ ok: true, value: { status: 'pending' } }),
    onCallback: async () => ({ ok: true, value: { status: 'received' } }),
    onClose: () => {},
    onDone: () => {},
  });
  try {
    await act(async () => { buttonByText(container, '获取授权链接').click(); });
    await waitFor(act, 20);
    assert.match(container.textContent, /等待授权完成/);
    assert.equal(container.querySelector('textarea'), null, 'workbuddy 不应出现粘贴框');
  } finally {
    await cleanup();
  }
});

// ---- D11+：「新增账号」与「同号重登」必须说清（真机踩到）----
//
// 缺陷原状：无论这一次登录是不是把已有账号又登了一遍，done 一律渲染「✓ 已添加」。
// 用户因此反复点「添加账号」（实测同一 uid 被回「已添加」5 次），每次都说保存成功、
// 池子里却数不到新账号，只能得出「保存成功了但账号没显示出来」的结论。

dialogTests('D11 已有账号再次登录：文案必须是「账号已存在」，并明说没有新增账号', async () => {
  const doneCalls = [];
  const { container, act, cleanup } = await mountDialog({
    channels: ['workbuddy'],
    realms: ['global'],
    // 发起登录时池里已经有 uid-9 → 这次是同一个号重登。
    knownUids: ['uid-1', 'uid-9'],
    onStart: async () => ({ ok: true, value: { url: 'https://www.workbuddy.ai/auth' } }),
    onPoll: async () => ({
      ok: true,
      value: { status: 'done', uid: 'uid-9', nickname: 'lament_z', realm: 'global', credits: 350 },
    }),
    onClose: () => {},
    onDone: () => { doneCalls.push(1); },
  });
  try {
    await act(async () => { buttonByText(container, '获取授权链接').click(); });
    await waitFor(act, 2700);

    const text = container.textContent;
    assert.match(text, /账号已存在/);
    assert.match(text, /没有新增账号/);
    assert.doesNotMatch(text, /已新增账号/, '同号重登绝不能报「已新增」');
    assert.match(text, /uid-9/);
    assert.ok(doneCalls.length >= 1, 'onDone 仍必须被调用（账号池要刷新）');
  } finally {
    await cleanup();
  }
});

dialogTests('D12 全新 uid：文案是「已新增账号」，与同号重登可区分', async () => {
  const { container, act, cleanup } = await mountDialog({
    channels: ['workbuddy'],
    realms: ['global'],
    knownUids: ['uid-1', 'uid-9'],
    onStart: async () => ({ ok: true, value: { url: 'https://www.workbuddy.ai/auth' } }),
    onPoll: async () => ({
      ok: true,
      value: { status: 'done', uid: 'uid-new', nickname: 'lament-z', realm: 'global', credits: 350 },
    }),
    onClose: () => {},
    onDone: () => {},
  });
  try {
    await act(async () => { buttonByText(container, '获取授权链接').click(); });
    await waitFor(act, 2700);

    const text = container.textContent;
    assert.match(text, /已新增账号/);
    assert.doesNotMatch(text, /账号已存在/);
    assert.match(text, /uid-new/);
  } finally {
    await cleanup();
  }
});

dialogTests('D13 网关自带 existing 时以网关为准（面板快照口径可能滞后）', async () => {
  const { container, act, cleanup } = await mountDialog({
    channels: ['workbuddy'],
    realms: ['global'],
    // 面板快照里没有这个 uid（例如账号是别的入口刚加进来、面板还没刷到），
    // 但网关明确说已存在 → 必须按「已存在」渲染，而不是按快照猜「已新增」。
    knownUids: [],
    onStart: async () => ({ ok: true, value: { url: 'https://www.workbuddy.ai/auth' } }),
    onPoll: async () => ({
      ok: true,
      value: { status: 'done', uid: 'uid-9', nickname: 'lament_z', realm: 'global', existing: true },
    }),
    onClose: () => {},
    onDone: () => {},
  });
  try {
    await act(async () => { buttonByText(container, '获取授权链接').click(); });
    await waitFor(act, 2700);

    assert.match(container.textContent, /账号已存在/);
  } finally {
    await cleanup();
  }
});

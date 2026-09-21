// dsh-chanhub —— 真实组合测试（real composition）
//
// 这是最高一级的验证：不用假 req/res，而是
//   1. 起一个**真实的 node:http 服务器**，复刻 dsh-host-webserver 的 prefix 匹配与
//      「handler 拥有完整响应生命周期、返回值被丢弃」契约；
//   2. 把插件挂在**真实 cordis Context** 上，走真实的 ctx.inject / ctx.effect / fiber 生命周期，
//      并以 Loader 的方式加载（传带 inject 的 default 导出，而不是裸 apply）；
//   3. 用**真实 HTTP 请求**打过去，验证端到端 wire 行为与资源回收。
//
// 为什么值得单独一层：前两层（单测 handler、渲染组件）都绕过了 HTTP 服务器本身。
// 而本次修复的核心缺陷恰恰在「handler 与服务器契约的接缝」——
// 返回值被丢弃、res 从不写出。只有真实服务器能证明它真的修好了。

import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Context, Service } from '@deepseek-ai/cordis';

import plugin, { CHANNEL, ENDPOINTS } from '../lib/index.js';
import { ChanhubClient } from '../lib/chanhub-client.js';

const GATEWAY = process.env.DSH_CHANHUB_TEST_URL ?? 'http://127.0.0.1:7866';
const API_KEY = process.env.WB2API_API_KEY ?? '';

/**
 * 最小的 webServer 服务：复刻 dsh-host-webserver 的两条关键行为 ——
 * prefix 路由匹配，以及 `await route.handler(req, res)` 后**丢弃返回值**
 * （这正是原缺陷成立的前提）。
 */
class FakeWebServer extends Service {
  constructor(ctx) {
    super(ctx, 'webServer');
    this.prefixes = new Map();
    this.exact = new Map();
  }

  register(route) {
    const table = route.kind === 'exact' ? this.exact : this.prefixes;
    if (table.has(route.path)) throw new Error(`duplicate ${route.kind} route "${route.path}"`);
    table.set(route.path, route);
    return () => table.delete(route.path);
  }

  /** 真实服务器的分派语义：handler 的返回值被丢弃。 */
  async handle(req, res) {
    const pathname = new URL(req.url ?? '/', 'http://x').pathname;
    for (const [prefix, route] of this.prefixes) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        await route.handler(req, res);
        return;
      }
    }
    res.writeHead(404);
    res.end();
  }
}

/** connection 服务：只实现被用到的认证契约。 */
class FakeConnection extends Service {
  constructor(ctx) {
    super(ctx, 'connection');
    this.rejection = undefined;
    this.rejectionCalls = 0;
  }

  requestRejection() {
    this.rejectionCalls += 1;
    return this.rejection;
  }
}

/**
 * 组装一个真实组合：真实 cordis Context + 真实 HTTP 服务器 + 真实插件。
 * @param options - `{rejection, baseURL, apiKey}`。
 * @returns `{base, dispose, connections}`。
 */
async function compose(options = {}) {
  const root = new Context();
  const wsFiber = root.plugin(FakeWebServer);
  await wsFiber;
  const connFiber = root.plugin(FakeConnection);
  await connFiber;
  const connections = root.connection;
  // 认证状态必须在插件装载前就位 —— serveChannelRequest 每次请求都会现读它。
  if (options.rejection !== undefined) connections.rejection = options.rejection;

  const server = createServer((req, res) => {
    void root.webServer.handle(req, res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();

  // 插件运行时配置指向目标网关（走 env，避免依赖 settings 服务）
  process.env.DSH_CHANHUB_BASE_URL = options.baseURL ?? GATEWAY;
  if (options.apiKey !== undefined) process.env.WB2API_API_KEY = options.apiKey;

  // 关键：传 default 导出（带 inject），而不是裸 apply 函数 —— Loader 就是这么加载的
  const pluginFiber = root.plugin(plugin);
  await pluginFiber;

  const dispose = async () => {
    await pluginFiber.dispose();
    // server.close() 已注册的回调要等到所有连接关闭；这里显式 await 一次关闭完成。
    await new Promise((resolve) => server.close(resolve));
    await connFiber.dispose();
    await wsFiber.dispose();
  };

  return { root, base: `http://127.0.0.1:${port}`, dispose, connections };
}

/**
 * 发一次真实 RPC 调用（走网络）。
 * @returns `{status, text, body}`。
 */
async function rpc(base, endpoint, payload = {}, rpcId = 'r-1') {
  const response = await fetch(`${base}${CHANNEL}/${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'client-request', rpcId, method: endpoint, payload }),
  });
  const text = await response.text();
  // 401/403 分支写的是纯文本（unauthorized / forbidden），不是 JSON 信封 —— 不能无条件解析。
  let body;
  if (text !== '') {
    try {
      body = JSON.parse(text);
    } catch {
      body = undefined;
    }
  }
  return { status: response.status, text, body };
}

test('组合：插件挂进真实 cordis Context 后路由被注册', async () => {
  const harness = await compose();
  try {
    assert.ok(harness.root.webServer.prefixes.has(CHANNEL), '插件必须注册 RPC prefix 路由');
    assert.equal(typeof harness.root.webServer.prefixes.get(CHANNEL).handler, 'function');
  } finally {
    await harness.dispose();
  }
});

test('组合：真实 HTTP 请求能收到响应（端到端回归「永不回包」）', async () => {
  const harness = await compose();
  try {
    const started = Date.now();
    const result = await rpc(harness.base, ENDPOINTS.probe, {});
    assert.equal(result.status, 200, `期望 200，实际 ${result.status}`);
    assert.ok(Date.now() - started < 15000, '必须在超时前返回（原缺陷会挂死到客户端超时）');
    assert.equal(result.body.type, 'server-response');
    assert.equal(result.body.rpcId, 'r-1');
    assert.equal(typeof result.body.result.ok, 'boolean');
  } finally {
    await harness.dispose();
  }
});

test('组合：真实请求打到真实网关拿回真实账号数据', async () => {
  const probe = new ChanhubClient({ resolveConfig: () => ({ baseURL: GATEWAY, apiKey: API_KEY }) });
  // 闸门要求「healthz 在线 **且** 带 key 能取到账号」：
  // 只看 healthz（无需鉴权）会在「有网关但没配 key」时报失败而不是跳过。
  const reachable = await (async () => {
    if ((await probe.routeStatus('/healthz')) !== 200) return false;
    try {
      const status = await probe.status();
      return Array.isArray(status?.accounts) && status.accounts.length > 0;
    } catch {
      return false;
    }
  })();

  const harness = await compose({ apiKey: API_KEY });
  try {
    const result = await rpc(harness.base, ENDPOINTS.getStatus, {});
    assert.equal(result.status, 200);
    const value = result.body.result.value;
    if (!reachable) {
      // 三种可能形态都必须「如实」，且互不混淆：
      //   完全不可达       → reachable:false
      //   可达但鉴权失败   → reachable:true + error.code=auth-failed（不得假装有数据）
      //   可达且取到数据   → 走下面的断言
      assert.ok(
        value.reachable === false || value.error !== undefined,
        '拿不到账号数据时，必须报告不可达或带出错误，不能静默返回空',
      );
      if (value.reachable === true) {
        assert.equal(value.error?.code, 'auth-failed', `期望 auth-failed，实际 ${JSON.stringify(value.error)}`);
      }
      assert.equal(value.status, undefined, '取数失败时不得带 status 字段');
      return;
    }
    assert.equal(value.reachable, true);
    assert.equal(value.probe.isChanhub, true);
    assert.ok(Array.isArray(value.status.accounts));
    assert.ok(value.status.accounts.length > 0, '真实网关应至少有一个账号');
    const account = value.status.accounts[0];
    for (const key of ['uid', 'nickname', 'credits', 'realm']) {
      assert.ok(key in account, `缺真实账号字段 ${key}`);
    }
  } finally {
    await harness.dispose();
  }
});

test('组合：认证拒绝时真实请求收到 401，且不进业务逻辑', async () => {
  const harness = await compose({ rejection: 401 });
  try {
    const result = await rpc(harness.base, ENDPOINTS.probe, {});
    assert.equal(result.status, 401);
    assert.equal(result.text, 'unauthorized');
    assert.ok(harness.connections.rejectionCalls > 0, '必须走 connection.requestRejection 认证');
  } finally {
    await harness.dispose();
  }
});

test('组合：403（host/origin fence）被挡，且与 401 可区分', async () => {
  const harness = await compose({ rejection: 403 });
  try {
    const result = await rpc(harness.base, ENDPOINTS.probe, {});
    assert.equal(result.status, 403);
    assert.equal(result.text, 'forbidden');
  } finally {
    await harness.dispose();
  }
});

test('组合：未知 endpoint 返回 bad-request 信封；通道外路径不被插件接管', async () => {
  const harness = await compose();
  try {
    // 未知 endpoint 走的是**协议内**的失败路径：HTTP 200 + {ok:false,error} 信封
    // （与 dsh-client-connection 的 rpcFetchHandler 一致 —— 业务错误不是传输错误）。
    const unknown = await rpc(harness.base, 'definitely-not-an-endpoint', {});
    assert.equal(unknown.status, 200);
    assert.equal(unknown.body.type, 'server-response');
    assert.equal(unknown.body.rpcId, 'r-1');
    assert.equal(unknown.body.result.ok, false);
    assert.equal(unknown.body.result.error.code, 'bad-request');

    // 真正未注册的路径（通道外）由服务器 404，插件不得接管
    const outside = await fetch(`${harness.base}/some/other/path`);
    assert.equal(outside.status, 404, '其他路径不应被插件接管');
    await outside.text();
  } finally {
    await harness.dispose();
  }
});

test('组合：content-type 不对 → 415；体不是 JSON → 400', async () => {
  const harness = await compose();
  try {
    const wrongType = await fetch(`${harness.base}${CHANNEL}/${ENDPOINTS.probe}`, {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'hi',
    });
    assert.equal(wrongType.status, 415);
    await wrongType.text();

    const badJson = await fetch(`${harness.base}${CHANNEL}/${ENDPOINTS.probe}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{oops',
    });
    assert.equal(badJson.status, 400);
    await badJson.text();
  } finally {
    await harness.dispose();
  }
});

test('组合：GET 打到 RPC 通道 → 404（只接受 POST）', async () => {
  const harness = await compose();
  try {
    const response = await fetch(`${harness.base}${CHANNEL}/${ENDPOINTS.probe}`);
    assert.equal(response.status, 404);
    await response.text();
  } finally {
    await harness.dispose();
  }
});

test('组合：方法不符（method ≠ endpoint）→ 结构化 error，而不是 500', async () => {
  const harness = await compose();
  try {
    const response = await fetch(`${harness.base}${CHANNEL}/${ENDPOINTS.getStatus}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'client-request',
        rpcId: 'mismatch',
        method: ENDPOINTS.getModels,
        payload: {},
      }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.rpcId, 'mismatch');
    assert.equal(body.result.ok, false);
    assert.match(body.result.error.message, /does not match endpoint/);
  } finally {
    await harness.dispose();
  }
});

test('组合：卸载后路由被摘除（零泄漏）', async () => {
  const harness = await compose();
  // dispose 会把整个 Context 拆掉（webServer 服务也随之消失），
  // 所以要先把路由表引用留下来，才能观察卸载后是否还被占着。
  const routes = harness.root.webServer.prefixes;
  assert.ok(routes.has(CHANNEL), '装载后路由应在');
  await harness.dispose();
  assert.ok(!routes.has(CHANNEL), '卸载后必须摘除路由（否则重载会撞 duplicate route）');
});

test('组合：客户端 bundle 的 slots 注册元信息正确（Loader 消费的契约）', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../client/client.js', import.meta.url), 'utf8');
  let factory;
  const window = {
    __ModuleLoader__: {
      load: ({ factory: value }) => {
        factory = value;
      },
    },
  };
  new Function('window', 'module', 'exports', 'require', `${source}\nreturn module.exports;`)(
    window,
    { exports: {} },
    {},
    () => {},
  );
  assert.equal(typeof factory, 'function', 'bundle 必须调用 __ModuleLoader__.load');

  const React = {
    createElement: () => ({}),
    useCallback: () => {},
    useEffect: () => {},
    useMemo: () => {},
    useState: () => [null, () => {}],
    useRef: () => ({ current: null }),
  };
  const mod = factory((id) => {
    if (id === 'react') return React;
    throw new Error(id);
  });

  const registered = [];
  mod.apply({
    connection: { rpc: { call: async () => ({ ok: true, value: {} }) } },
    slots: {
      inject: (name, fn) => {
        assert.equal(name, 'settings.section', '必须注册到 settings.section');
        fn();
      },
      register: (meta, component) => registered.push({ meta, component }),
    },
  });

  assert.equal(registered.length, 1, '必须注册恰好一个 settings.section');
  const { meta, component } = registered[0];
  assert.equal(meta.name, 'settings.section');
  assert.equal(meta.id, 'dsh-chanhub', 'slot id 必须与插件 id 一致');
  assert.equal(meta.label(), '渠道中心', '侧边栏显示名必须是中文「渠道中心」');
  assert.equal(typeof component, 'function');
  const injected = meta.inject();
  assert.equal(typeof injected.rpcCall, 'function');
});

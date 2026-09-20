// 真实集成测试：RPC 通道 wire 契约 + 网关真实数据。
//
// 为什么必须是集成测试而不是字段断言：原 test/plugin.test.mjs 只断言 JSON 字段，
// 结果让一个「handler 永不回包」的致命缺陷通过了测试 —— 面板 100% 不可用，
// 而测试全绿。本文件用真实的 node:http 请求/响应对象驱动真实 handler。

import test from 'node:test';
import assert from 'node:assert/strict';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { EventEmitter } from 'node:events';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CHANNEL,
  ENDPOINTS,
  createHandler,
  createRuntime,
} from '../lib/index.js';
import { serveChannelRequest, MAX_RPC_BODY_BYTES, endpointFromChannelPath } from '../lib/rpc-channel.js';
import { ChanhubClient, normalizeBaseUrl } from '../lib/chanhub-client.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** 网关真实地址（本机 chanhub / WorkBuddy2API）。 */
const GATEWAY = process.env.DSH_CHANHUB_TEST_URL ?? 'http://127.0.0.1:7863';
const API_KEY = process.env.WB2API_API_KEY ?? '';

/**
 * 造一个假的 IncomingMessage（带真实的可读流语义）。
 *
 * @param options - `{method, url, headers, body}`。
 * @returns IncomingMessage。
 */
function fakeReq(options = {}) {
  const req = new IncomingMessage(new Socket());
  req.method = options.method ?? 'POST';
  req.url = options.url ?? `${CHANNEL}/${ENDPOINTS.getStatus}`;
  req.headers = options.headers ?? { 'content-type': 'application/json' };
  const chunks = options.body === undefined ? [] : [Buffer.from(options.body)];
  // 把 chunks 灌进可读流：async iterator 读到 end 才结束。
  queueMicrotask(() => {
    for (const chunk of chunks) req.push(chunk);
    req.push(null);
  });
  return req;
}

/**
 * 造一个假的 ServerResponse，捕获 writeHead / write / end。
 *
 * @returns `{res, captured}`。
 */
function fakeRes() {
  const captured = { status: undefined, headers: undefined, body: '', ended: false, writeHeadCalls: 0 };
  const res = new ServerResponse(new IncomingMessage(new Socket()));
  res.writeHead = (status, headers) => {
    captured.status = status;
    captured.headers = headers;
    captured.writeHeadCalls += 1;
    return res;
  };
  res.write = (chunk) => {
    captured.body += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    return true;
  };
  res.end = (chunk) => {
    if (typeof chunk === 'string') captured.body += chunk;
    else if (Buffer.isBuffer(chunk)) captured.body += chunk.toString('utf8');
    captured.ended = true;
    return res;
  };
  res.on = EventEmitter.prototype.on.bind(res);
  res.off = EventEmitter.prototype.off.bind(res);
  return { res, captured };
}

/** 造一个 mock connection（认证恒通过）。 */
function mockConnection(rejection) {
  return { requestRejection: () => rejection };
}

/**
 * 宿主的 `server-response` 解码契约，逐字复刻自
 * `@deepseek-ai/dsh-client-connection` 的 `parseConnectionResponse`。
 *
 * 为什么在插件侧复刻：这个契约是本插件 wire 层的**外部依赖**，而宿主不在
 * 本仓的测试范围内。早先的测试只断言 `{type, rpcId, result.ok}` 等字段存在，
 * 于是「result.ok===false 但 error.details 缺失」的信封全绿通过，直到浏览器里
 * 炸成 "connection: invalid server-response failure"。
 *
 * @param value - 反序列化后的 wire 信封。
 * @returns `{rpcId, result}`；不符合契约时抛 TypeError（与宿主同文案）。
 */
function parseConnectionResponse(value) {
  if (!isRecord(value) || value.type !== 'server-response' || typeof value.rpcId !== 'string') {
    throw new TypeError('connection: invalid server-response envelope');
  }
  const result = value.result;
  if (!isRecord(result)) throw new TypeError('connection: invalid server-response result');
  if (result.ok === true) return { rpcId: value.rpcId, result: { ok: true, value: result.value } };
  if (result.ok !== false || !isRecord(result.error)) {
    throw new TypeError('connection: invalid server-response result');
  }
  const error = result.error;
  if (typeof error.code !== 'string' || typeof error.message !== 'string' || !isRecord(error.details)) {
    throw new TypeError('connection: invalid server-response failure');
  }
  return { rpcId: value.rpcId, result: { ok: false, error } };
}

/** 与宿主同语义的「纯对象」判定（数组与 null 都不算）。 */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 从 env 造一个直连网关的 runtime。 */
function envRuntime() {
  const settings = {
    baseURL: GATEWAY,
    apiKeyEnv: 'WB2API_API_KEY',
    apiKey: API_KEY,
    gatewayConfigPath: '',
  };
  const client = new ChanhubClient({
    resolveConfig: () => ({ baseURL: settings.baseURL, apiKey: settings.apiKey, gatewayConfigPath: '' }),
  });
  return { client, readSettings: () => settings, resolveConfig: () => settings, warnings: [], logger: undefined };
}

// ---------------------------------------------------------------------------
// A. wire 契约（这一组正是原骨架缺的）
// ---------------------------------------------------------------------------

test('A1 成功的 RPC 调用真的写出了响应（回归：原 handler 永不回包）', async () => {
  const handler = createHandler(envRuntime());
  const { res, captured } = fakeRes();
  await serveChannelRequest(
    fakeReq({
      body: JSON.stringify({ type: 'client-request', rpcId: 'r1', method: 'probe', payload: {} }),
      url: `${CHANNEL}/${ENDPOINTS.probe}`,
    }),
    res,
    mockConnection(undefined),
    CHANNEL,
    handler,
  );

  assert.ok(captured.writeHeadCalls > 0, 'writeHead 必须被调用（原 bug：0 次）');
  assert.equal(captured.ended, true, 'res.end() 必须到达（原 bug：挂死到超时）');
  assert.equal(captured.status, 200);
  const parsed = JSON.parse(captured.body);
  assert.equal(parsed.type, 'server-response');
  assert.equal(parsed.rpcId, 'r1');
  assert.equal(typeof parsed.result.ok, 'boolean');
});

test('A2 method 与 endpoint 不符 → 结构化 error 信封（不是 500）', async () => {
  const handler = createHandler(envRuntime());
  const { res, captured } = fakeRes();
  await serveChannelRequest(
    fakeReq({
      body: JSON.stringify({ type: 'client-request', rpcId: 'r2', method: 'getModels', payload: {} }),
      url: `${CHANNEL}/${ENDPOINTS.getStatus}`,
    }),
    res,
    mockConnection(undefined),
    CHANNEL,
    handler,
  );
  const parsed = JSON.parse(captured.body);
  assert.equal(parsed.rpcId, 'r2');
  assert.equal(parsed.result.ok, false);
  assert.match(parsed.result.error.message, /does not match endpoint/);
});

test('A3 未知 endpoint → bad-request', async () => {
  const handler = createHandler(envRuntime());
  const { res, captured } = fakeRes();
  await serveChannelRequest(
    fakeReq({
      body: JSON.stringify({ type: 'client-request', rpcId: 'r3', method: 'nope', payload: {} }),
      url: `${CHANNEL}/nope`,
    }),
    res,
    mockConnection(undefined),
    CHANNEL,
    handler,
  );
  const parsed = JSON.parse(captured.body);
  assert.equal(parsed.result.ok, false);
  assert.equal(parsed.result.error.code, 'bad-request');
  // 失败信封必须能被**宿主的**解码器接受（见 A3b）：只断言 code 会让
  // 缺 details 的信封在浏览器里炸成 "invalid server-response failure"。
  assert.equal(typeof parsed.result.error.message, 'string');
  assert.ok(isRecord(parsed.result.error.details), '失败信封必须带 details');
});

test('A3b 任何失败信封都必须通过 dsh-client-connection 的解码器（回归：invalid server-response failure）', async () => {
  // 这是用户实际看到的报错的回归闸门。
  //
  // dsh-client-connection 的 parseConnectionResponse 对失败信封有硬性要求：
  //   result.ok === false && isRecord(result.error)
  //   && typeof error.code === 'string' && typeof error.message === 'string'
  //   && isRecord(error.details)          <-- 缺 details 时抛
  //   TypeError("connection: invalid server-response failure")
  // 浏览器把该异常原样冒泡成面板顶部的报错文案，于是**任何一个**失败分支都会
  // 让整块面板打不开 —— 即使网关、密钥、渲染都正常。
  //
  // 断言方式刻意不是「details 字段存在」而是「喂给真实解码器不抛」：
  // 字段断言看不出 isRecord（数组/字符串都算「有 details」），而那正是宿主拒绝的。
  const handler = createHandler(envRuntime());
  const failingEndpoints = [
    // 未知 endpoint（客户端 bundle 比宿主新时必然走到）
    { method: 'nope', payload: {} },
    // 各业务分支的真实失败路径（缺参 / 未知动作）
    { method: ENDPOINTS.getCredits, payload: {} },
    { method: ENDPOINTS.runTask, payload: {} },
    { method: ENDPOINTS.growthWrite, payload: { action: 'bogus', uid: 'x' } },
    { method: ENDPOINTS.accountMore, payload: { action: 'bogus', uid: 'x' } },
    { method: ENDPOINTS.accountDisable, payload: {} },
  ];

  for (const { method, payload } of failingEndpoints) {
    const { res, captured } = fakeRes();
    await serveChannelRequest(
      fakeReq({
        body: JSON.stringify({ type: 'client-request', rpcId: 'r3b', method, payload }),
        url: `${CHANNEL}/${method}`,
      }),
      res,
      mockConnection(undefined),
      CHANNEL,
      handler,
    );
    assert.equal(captured.status, 200, `${method}: 失败信封应走 200 + 结构化 error`);
    const parsed = JSON.parse(captured.body);
    assert.doesNotThrow(
      () => parseConnectionResponse(parsed),
      `${method}: 失败信封被宿主解码器拒绝 —— 浏览器会显示 "connection: invalid server-response failure"`,
    );
  }
});

test('A4 认证失败 → 直写 401，不进入业务逻辑', async () => {
  const handler = createHandler(envRuntime());
  const { res, captured } = fakeRes();
  await serveChannelRequest(
    fakeReq({ body: '{}', url: `${CHANNEL}/${ENDPOINTS.getStatus}` }),
    res,
    mockConnection(401),
    CHANNEL,
    handler,
  );
  assert.equal(captured.status, 401);
  assert.equal(captured.body, 'unauthorized');
  assert.equal(captured.ended, true);
});

test('A5 403（host/origin fence）同样被挡住', async () => {
  const handler = createHandler(envRuntime());
  const { res, captured } = fakeRes();
  await serveChannelRequest(
    fakeReq({ body: '{}', url: `${CHANNEL}/${ENDPOINTS.getStatus}` }),
    res,
    mockConnection(403),
    CHANNEL,
    handler,
  );
  assert.equal(captured.status, 403);
  assert.equal(captured.body, 'forbidden');
});

test('A6 content-type 不是 JSON → 415', async () => {
  const handler = createHandler(envRuntime());
  const { res, captured } = fakeRes();
  await serveChannelRequest(
    fakeReq({
      body: 'hello',
      headers: { 'content-type': 'text/plain' },
      url: `${CHANNEL}/${ENDPOINTS.probe}`,
    }),
    res,
    mockConnection(undefined),
    CHANNEL,
    handler,
  );
  assert.equal(captured.status, 415);
});

test('A7 体不是 JSON → 400', async () => {
  const handler = createHandler(envRuntime());
  const { res, captured } = fakeRes();
  await serveChannelRequest(
    fakeReq({ body: '{not json', url: `${CHANNEL}/${ENDPOINTS.probe}` }),
    res,
    mockConnection(undefined),
    CHANNEL,
    handler,
  );
  assert.equal(captured.status, 400);
});

test('A8 非 POST → 404', async () => {
  const handler = createHandler(envRuntime());
  const { res, captured } = fakeRes();
  await serveChannelRequest(
    fakeReq({ method: 'GET', body: undefined, url: `${CHANNEL}/${ENDPOINTS.getStatus}` }),
    res,
    mockConnection(undefined),
    CHANNEL,
    handler,
  );
  assert.equal(captured.status, 404);
});

test('A9 endpoint 路径校验：拒绝 .. / . / 空段', () => {
  assert.equal(endpointFromChannelPath(CHANNEL, `${CHANNEL}/getStatus`), 'getStatus');
  assert.equal(endpointFromChannelPath(CHANNEL, `${CHANNEL}/../etc/passwd`), undefined);
  assert.equal(endpointFromChannelPath(CHANNEL, `${CHANNEL}/a//b`), undefined);
  assert.equal(endpointFromChannelPath(CHANNEL, `${CHANNEL}/`), undefined);
  assert.equal(endpointFromChannelPath(CHANNEL, '/other/getStatus'), undefined);
});

test('A10 请求体超限 → 413', async () => {
  const handler = createHandler(envRuntime());
  const { res, captured } = fakeRes();
  const huge = 'x'.repeat(MAX_RPC_BODY_BYTES + 1024);
  const req = fakeReq({
    body: JSON.stringify({ type: 'client-request', rpcId: 'big', method: 'probe', payload: { pad: huge } }),
    url: `${CHANNEL}/${ENDPOINTS.probe}`,
  });
  req.destroy = () => {};
  await serveChannelRequest(req, res, mockConnection(undefined), CHANNEL, handler);
  assert.equal(captured.status, 413);
});

test('A11 上游超时 → 结构化错误信封（不是挂死）', async () => {
  const client = new ChanhubClient({
    // 10.255.255.1 是不可路由地址，用来稳定触发超时
    resolveConfig: () => ({ baseURL: 'http://10.255.255.1:7863' }),
  });
  const runtime = {
    client,
    readSettings: () => ({}),
    resolveConfig: () => ({}),
    warnings: [],
    logger: undefined,
  };
  const handler = createHandler(runtime);
  const { res, captured } = fakeRes();
  const started = Date.now();
  await serveChannelRequest(
    fakeReq({
      body: JSON.stringify({ type: 'client-request', rpcId: 'r11', method: 'getModels', payload: {} }),
      url: `${CHANNEL}/${ENDPOINTS.getModels}`,
    }),
    res,
    mockConnection(undefined),
    CHANNEL,
    handler,
  );
  assert.equal(captured.ended, true, '必须回包，不能挂死');
  const parsed = JSON.parse(captured.body);
  assert.equal(parsed.result.ok, false);
  assert.ok(
    ['upstream-timeout', 'upstream-unreachable'].includes(parsed.result.error.code),
    `期望超时/不可达，实际 ${parsed.result.error.code}`,
  );
  assert.ok(Date.now() - started < 20000, '必须在默认超时内返回');
});

// ---------------------------------------------------------------------------
// B. 真实网关数据（无网关时自动跳过，保持 CI 绿）
// ---------------------------------------------------------------------------

// 真机用例的闸门：不仅要求网关在线，还要求**带 key 能取到数据**。
//
// 为什么不能只看 /healthz：它无需鉴权，任何在跑的服务都回 200。
// 若只据此判定，在「有网关但没配 key」的环境里这些用例会真的跑起来并失败
// （CI 与本地都会踩到），而不是跳过。故这里用一次真实 /status 探到底。
const gatewayReachable = await (async () => {
  const client = new ChanhubClient({ resolveConfig: () => ({ baseURL: GATEWAY, apiKey: API_KEY }) });
  if ((await client.routeStatus('/healthz')) !== 200) return false;
  try {
    const status = await client.status();
    return Array.isArray(status?.accounts) && status.accounts.length > 0;
  } catch {
    return false; // 鉴权失败 / 上游错误 → 视为不可用于真机断言
  }
})();

test(
  'B1 真实网关：healthz 确认是本网关而非别的服务',
  { skip: !gatewayReachable && `跳过真机验证（${GATEWAY} 无可用网关或未配置可用的 WB2API_API_KEY）` },
  async () => {
    const handler = createHandler(envRuntime());
    const result = await handler(ENDPOINTS.probe, {});
    assert.equal(result.ok, true);
    assert.equal(result.value.reachable, true);
    assert.equal(result.value.service, 'workbuddy2api');
    assert.equal(result.value.isChanhub, true);
  },
);

test(
  'B2 真实网关：getStatus 返回账号与五联计数',
  { skip: !gatewayReachable && `跳过真机验证（${GATEWAY} 不可用或无凭据）` },
  async () => {
    const handler = createHandler(envRuntime());
    const result = await handler(ENDPOINTS.getStatus, {});
    assert.equal(result.ok, true);
    assert.equal(result.value.reachable, true);
    const status = result.value.status;
    assert.ok(Array.isArray(status.accounts), 'accounts 必须是数组');
    assert.ok(status.accounts.length > 0, '本机至少有一个账号（否则无法验证真实渲染）');
    for (const key of ['total', 'healthy', 'cooling', 'disabled', 'in_flight_full', 'realm_totals']) {
      assert.ok(key in status, `缺顶层字段 ${key}`);
    }
    const account = status.accounts[0];
    for (const key of ['uid', 'nickname', 'credits', 'realm', 'disabled', 'cooling', 'in_flight']) {
      assert.ok(key in account, `缺账号字段 ${key}`);
    }
  },
);

test(
  'B3 真实网关：getModels 返回模型目录',
  { skip: !gatewayReachable && `跳过真机验证（${GATEWAY} 不可用或无凭据）` },
  async () => {
    const handler = createHandler(envRuntime());
    const result = await handler(ENDPOINTS.getModels, {});
    assert.equal(result.ok, true);
    assert.ok(Array.isArray(result.value.data), 'models 必须是 {data:[]}');
    assert.ok(result.value.data.length > 0);
    assert.ok(result.value.data[0].id);
  },
);

test(
  'B4 真实网关：鉴权失败映射成 auth-failed（而不是「加载失败」）',
  { skip: !gatewayReachable && `跳过真机验证（${GATEWAY} 不可用或无凭据）` },
  async () => {
    const client = new ChanhubClient({
      resolveConfig: () => ({ baseURL: GATEWAY, apiKey: 'sk-definitely-wrong' }),
    });
    const runtime = {
      client,
      readSettings: () => ({}),
      resolveConfig: () => ({}),
      warnings: [],
      logger: undefined,
    };
    const handler = createHandler(runtime);
    const result = await handler(ENDPOINTS.getStatus, {});
    assert.equal(result.ok, true, 'RPC 本身成功，错误在 value.error 里');
    assert.equal(result.value.reachable, true);
    assert.equal(result.value.error.code, 'auth-failed');
  },
);

test(
  'B5 真实网关：getStats 在缺该端点时给出明确原因，而非报错',
  { skip: !gatewayReachable && `跳过真机验证（${GATEWAY} 不可用或无凭据）` },
  async () => {
    const handler = createHandler(envRuntime());
    const result = await handler(ENDPOINTS.getStats, {});
    assert.equal(result.ok, true);
    assert.equal(typeof result.value.available, 'boolean');
    if (!result.value.available) {
      assert.match(result.value.reason, /\/v1\/stats/);
    } else {
      assert.ok(Array.isArray(result.value.stats.models));
    }
  },
);

test(
  'B6 真实网关：版本探测识别 admin 与 stats 的存在性',
  { skip: !gatewayReachable && `跳过真机验证（${GATEWAY} 不可用或无凭据）` },
  async () => {
    const handler = createHandler(envRuntime());
    const result = await handler(ENDPOINTS.probe, {});
    const features = result.value.features;
    assert.equal(typeof features.stats, 'boolean');
    assert.equal(typeof features.admin, 'boolean');
    assert.equal(typeof features.costExplore, 'boolean');
    // 本机运行的是社区 panel（无 /v1/stats、未开 admin）—— 探测必须如实反映
    assert.equal(features.stats, false, '本机网关未提供 /v1/stats');
    assert.equal(features.admin, false, '本机网关 config 无 admin 段 → 管理端点未开启');
  },
);

test('B7 normalizeBaseUrl 归一化各种输入', () => {
  assert.equal(normalizeBaseUrl('127.0.0.1:7863'), 'http://127.0.0.1:7863');
  assert.equal(normalizeBaseUrl('http://127.0.0.1:7863/'), 'http://127.0.0.1:7863');
  assert.equal(normalizeBaseUrl('https://gw.example.com///'), 'https://gw.example.com');
  assert.equal(normalizeBaseUrl(''), 'http://127.0.0.1:7863');
  assert.equal(normalizeBaseUrl(undefined), 'http://127.0.0.1:7863');
});

// ---------------------------------------------------------------------------
// C. 宿主入口契约（原测试保留，但不再是唯一防线）
// ---------------------------------------------------------------------------

test('C1 宿主入口导出 RPC 通道与全部端点', async () => {
  const mod = await import('../lib/index.js');
  assert.equal(mod.name, 'dsh-chanhub');
  assert.ok(Array.isArray(mod.inject) && mod.inject.includes('connection'));
  assert.equal(mod.CHANNEL, '/dsh-chanhub');
  assert.equal(typeof mod.apply, 'function');
  for (const key of [
    'getStatus',
    'getModels',
    'getStats',
    'probe',
    'getConfig',
    'saveConfig',
    'accountDisable',
    'accountEnable',
    'accountRevive',
    'serviceControl',
  ]) {
    assert.ok(mod.ENDPOINTS[key], `缺少 endpoint ${key}`);
  }
});

test('C2 apply 注册 prefix 路由并返回清理函数（零泄漏）', async () => {
  const mod = await import('../lib/index.js');
  const registered = [];
  const unregistered = [];
  const fakeCtx = {
    connection: { requestRejection: () => undefined },
    logger: Object.assign(() => {}, { info: () => {}, warn: () => {}, debug: () => {}, error: () => {} }),
    get: () => undefined,
    on: () => {},
    effect: (fn) => fn(),
    inject: (_names, fn) => fn(fakeCtx),
    webServer: undefined,
  };
  fakeCtx.webServer = {
    register: (route) => {
      registered.push(route);
      return () => unregistered.push(route.path);
    },
  };

  const dispose = mod.apply(fakeCtx);
  // 只有 RPC 通道一条路由。曾经为「面板回调」加过第二条（trae-callback），
  // 但那套设计被证伪：Trae 授权页硬性要求回调是 127.0.0.1，非 loopback 一律
  // 显示「网络错误，请刷新页面重试。」，故远端改走粘贴，不再需要浏览器落点。
  assert.equal(registered.length, 1, '必须注册恰好一条路由（RPC 通道）');
  assert.equal(registered[0].kind, 'prefix');
  assert.equal(registered[0].path, CHANNEL);
  assert.equal(typeof registered[0].handler, 'function');

  assert.equal(typeof dispose, 'function');
  dispose();
  assert.deepEqual(unregistered, [CHANNEL]);
});

test('C3 createRuntime 在没有 settings 服务时降级到 env，且给出告警', () => {
  const fakeCtx = { logger: undefined, get: () => undefined };
  const runtime = createRuntime(fakeCtx);
  assert.ok(runtime.warnings.length > 0, '必须如实告警降级');
  assert.equal(typeof runtime.client.status, 'function');
});

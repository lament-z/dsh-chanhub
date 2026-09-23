// 「接入方」Tab 的宿主侧：端点表同步 + /admin/keys 六个端点的行为。
//
// 用 stub fetch 而不是真网关：这些用例要断言的正是**请求形状**
// （方法 / 路径 / 请求体 / Authorization 用哪把 key），真网关只会把形状吃掉。
import test from 'node:test';
import assert from 'node:assert/strict';

import { ENDPOINTS, createHandler } from '../lib/index.js';
import { ChanhubClient } from '../lib/chanhub-client.js';
import { ENDPOINTS as CLIENT_ENDPOINTS, CHANNEL } from '../client/endpoints.js';

/* ──────────────────────── 脚手架 ──────────────────────── */

const BASE = 'http://127.0.0.1:7866';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

/** ServeMux 对未注册路径回纯文本 404（客户端据此判定"旧网关没有该端点"）。 */
function plain404() {
  return new Response('404 page not found', { status: 404, headers: { 'content-type': 'text/plain' } });
}

function stubFetch(t, respond) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const call = {
      url: String(url),
      path: new URL(String(url)).pathname,
      method: init.method ?? 'GET',
      body: init.body === undefined ? undefined : JSON.parse(init.body),
      headers: init.headers ?? {},
    };
    calls.push(call);
    return respond(call);
  };
  t.after(() => { globalThis.fetch = original; });
  return calls;
}

function makeHandler(t, respond) {
  const calls = stubFetch(t, respond);
  const config = { baseURL: BASE, apiKey: 'master-key' };
  const handle = createHandler({
    client: new ChanhubClient({ resolveConfig: () => config }),
    resolveConfig: () => config,
    readSettings: () => ({}),
  });
  return { handle, calls };
}

/* ──────────────────────── 1. 端点表三处同步 ──────────────────────── */

const NEW_ENDPOINTS = [
  'getApiKeys',
  'createApiKey',
  'patchApiKey',
  'deleteApiKey',
  'rotateApiKey',
  'previewApiKey',
];

test('新增端点名在宿主与浏览器两份表里都存在且同名（三处同步的一部分）', () => {
  for (const name of NEW_ENDPOINTS) {
    assert.equal(typeof ENDPOINTS[name], 'string', `宿主 ENDPOINTS 缺 ${name}`);
    assert.equal(typeof CLIENT_ENDPOINTS[name], 'string', `client/endpoints.js 缺 ${name}`);
    assert.equal(ENDPOINTS[name], CLIENT_ENDPOINTS[name], `${name} 两侧取值不一致`);
  }
});

test('两份端点表整体一致（不只新增的 6 个）', () => {
  const host = Object.keys(ENDPOINTS).sort();
  const client = Object.keys(CLIENT_ENDPOINTS).sort();
  assert.deepEqual(host, client, '宿主与浏览器的端点表漂移了');
  assert.ok(CHANNEL.startsWith('/'), 'RPC 频道名必须是以 / 开头的路径');
});

/* ──────────────────────── 2. 客户端：目录走 /admin/models ──────────────────────── */

test('models() 默认走 /admin/models（全量目录，不做主体过滤）', async (t) => {
  const calls = stubFetch(t, () => json({ object: 'list', data: [] }));
  const client = new ChanhubClient({ resolveConfig: () => ({ baseURL: BASE, apiKey: 'master' }) });
  await client.models();
  assert.equal(calls[0].path, '/admin/models');
});

test('旧网关（无 /admin/models）自动回落 /v1/models，不是报错', async (t) => {
  const calls = stubFetch(t, (call) => (call.path === '/admin/models'
    ? plain404()
    : json({ object: 'list', data: [{ id: 'workbuddy:cn:a' }] })));
  const client = new ChanhubClient({ resolveConfig: () => ({ baseURL: BASE, apiKey: 'master' }) });
  const body = await client.models();
  assert.deepEqual(calls.map((c) => c.path), ['/admin/models', '/v1/models']);
  assert.equal(body.data.length, 1);
});

test('consumerModels 用**被预览的那把 key** 打 /v1/models，而不是主 key', async (t) => {
  const calls = stubFetch(t, () => json({ object: 'list', data: [] }));
  const client = new ChanhubClient({ resolveConfig: () => ({ baseURL: BASE, apiKey: 'master-key' }) });
  await client.consumerModels('sk-consumer');
  assert.equal(calls[0].path, '/v1/models');
  assert.equal(calls[0].headers.authorization, 'Bearer sk-consumer');
});

/* ──────────────────────── 3. key CRUD ──────────────────────── */

test('createApiKey 打 POST /admin/keys 并把一次性明文透给面板', async (t) => {
  const { handle, calls } = makeHandler(t, () => json({
    key: { id: 'k_1', name: 'A', key_prefix: 'sk-abc…wxyz', models: ['*'], enabled: true, role: 'consumer', allow: [], key: 'sk-abc123wxyz' },
  }));
  const result = await handle(ENDPOINTS.createApiKey, { name: 'A', models: ['*'] });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].path, '/admin/keys');
  assert.deepEqual(calls[0].body, { name: 'A', models: ['*'] });
  assert.equal(result.value.key.key, 'sk-abc123wxyz', '一次性明文必须原样回传（面板靠它做"立即复制"）');
});

test('createApiKey 在本地就拦下非法输入，一次网关都不打', async (t) => {
  const { handle, calls } = makeHandler(t, () => json({}));
  assert.equal((await handle(ENDPOINTS.createApiKey, { name: '   ', models: ['*'] })).ok, false, '空名字应拒');
  assert.equal((await handle(ENDPOINTS.createApiKey, { name: 'A', models: ['a*b'] })).ok, false, '中间 * 应拒');
  assert.equal((await handle(ENDPOINTS.createApiKey, { name: 'A' })).ok, false, 'models 必填（缺省=全量，不能默许）');
  assert.equal((await handle(ENDPOINTS.createApiKey, { name: 'A', models: 'x' })).ok, false, 'models 必须是数组');
  assert.equal(calls.length, 0, '这些都不该产生网络请求');
});

test('createApiKey 透传可选字段，未给的字段不出现在请求体里', async (t) => {
  const { handle, calls } = makeHandler(t, () => json({ key: { id: 'k_1' } }));
  await handle(ENDPOINTS.createApiKey, { name: 'B', models: [], role: 'admin', note: '备注' });
  assert.deepEqual(calls[0].body, { name: 'B', models: [], role: 'admin', note: '备注' });

  await handle(ENDPOINTS.createApiKey, { name: 'C', models: ['*'], allow: ['status'] });
  assert.deepEqual(calls[1].body, { name: 'C', models: ['*'], allow: ['status'] });
  assert.equal('role' in calls[1].body, false, '未给的 role 不该被补成默认值——由网关决定默认');
});

test('patchApiKey 只发改动字段（enabled:false 与"不改 enabled"必须可区分）', async (t) => {
  const { handle, calls } = makeHandler(t, () => json({ key: { id: 'k_1' } }));
  await handle(ENDPOINTS.patchApiKey, { id: 'k_1', enabled: false });
  assert.equal(calls[0].method, 'PATCH');
  assert.equal(calls[0].path, '/admin/keys/k_1');
  assert.deepEqual(calls[0].body, { enabled: false });

  await handle(ENDPOINTS.patchApiKey, { id: 'k_1', models: ['workbuddy:cn:*'], allow: [] });
  assert.deepEqual(calls[1].body, { models: ['workbuddy:cn:*'], allow: [] });

  const noop = await handle(ENDPOINTS.patchApiKey, { id: 'k_1' });
  assert.equal(noop.ok, false, '空 patch 应被拒而不是打一次无意义的请求');
  assert.equal(calls.length, 2);

  const bad = await handle(ENDPOINTS.patchApiKey, { id: 'k_1', models: ['a*b'] });
  assert.equal(bad.ok, false);
  assert.equal(calls.length, 2);
});

test('deleteApiKey / rotateApiKey 路径与方法正确', async (t) => {
  const { handle, calls } = makeHandler(t, (call) => (call.path.endsWith('/rotate')
    ? json({ key: { id: 'k_1', key: 'sk-new' } })
    : json({ deleted: true, id: 'k_1' })));
  const del = await handle(ENDPOINTS.deleteApiKey, { id: 'k_1' });
  assert.equal(del.ok, true);
  assert.equal(calls[0].method, 'DELETE');
  assert.equal(calls[0].path, '/admin/keys/k_1');

  const rot = await handle(ENDPOINTS.rotateApiKey, { id: 'k_1' });
  assert.equal(calls[1].method, 'POST');
  assert.equal(calls[1].path, '/admin/keys/k_1/rotate');
  assert.equal(rot.value.key.key, 'sk-new');
});

test('缺 id 时本地抛错，不拼出 /admin/keys/ 这种会和"端点不存在"混淆的路径', async (t) => {
  const { handle, calls } = makeHandler(t, () => json({}));
  const result = await handle(ENDPOINTS.deleteApiKey, {});
  assert.equal(result.ok, false);
  assert.match(String(result.error?.message ?? ''), /key id/);
  assert.equal(calls.length, 0);
});

test('getApiKeys 透出列表与计数', async (t) => {
  const { handle } = makeHandler(t, () => json({ object: 'list', keys: [{ id: 'k_1' }, { id: 'k_2' }], count: 2 }));
  const result = await handle(ENDPOINTS.getApiKeys, {});
  assert.equal(result.ok, true);
  assert.equal(result.value.count, 2);
  assert.equal(result.value.keys.length, 2);
});

/* ──────────────────────── 4. 预览（本地计算） ──────────────────────── */

const CATALOG = {
  object: 'list',
  data: [
    { id: 'workbuddy:cn:a' },
    { id: 'workbuddy:cn:b' },
    { id: 'traework:cn:c' },
  ],
};

test('previewApiKey 只拉一次全量目录，然后本地按规则算', async (t) => {
  const { handle, calls } = makeHandler(t, () => json(CATALOG));

  const scoped = await handle(ENDPOINTS.previewApiKey, { models: ['workbuddy:cn:*'] });
  assert.equal(scoped.ok, true, JSON.stringify(scoped));
  assert.deepEqual(calls.map((c) => c.path), ['/admin/models'], '预览不该产生第二条网关请求');
  assert.equal(scoped.value.total, 3);
  assert.equal(scoped.value.visible, 2);
  assert.deepEqual(scoped.value.ids, ['workbuddy:cn:a', 'workbuddy:cn:b']);
  assert.equal(scoped.value.scope.kind, 'patterns');

  const all = await handle(ENDPOINTS.previewApiKey, {});
  assert.equal(all.value.visible, 3, 'models 未提供 = 全量');

  const none = await handle(ENDPOINTS.previewApiKey, { models: [] });
  assert.equal(none.value.visible, 0, '显式空集 = 一个都看不到');
  assert.equal(none.value.scope.kind, 'none');

  const star = await handle(ENDPOINTS.previewApiKey, { models: ['*'] });
  assert.equal(star.value.visible, 3);
  assert.equal(star.value.scope.kind, 'all');
});

test('previewApiKey 的非法规则本地就拒（不打网关）', async (t) => {
  const { handle, calls } = makeHandler(t, () => json(CATALOG));
  const result = await handle(ENDPOINTS.previewApiKey, { models: ['a*b'] });
  assert.equal(result.ok, false);
  assert.equal(calls.length, 0);
});

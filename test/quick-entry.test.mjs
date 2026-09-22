// dsh-chanhub —— 侧边栏快捷入口的单元测试（纯函数 + store，不需要 DOM）
//
// 分层纪律（与 plugins/dsh-chanhub 既有测试一致）：
//   本文件锁「口径与状态机」——可用积分合计、realm 分档在途上限、活跃近似、
//   轮询/退避/陈旧判定、偏好读写降级。**渲染**由 client-render.test.mjs 走打包产物验证。
//
// 真机踩过的坑在这里都要有回归：global 档位分母、网关不可达不得显示 0、
// 旧宿主没有 settingsScope 时开关要降级而不是抛。

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  activityOf,
  accountCardVM,
  channelColor,
  quickSummaryVM,
  realmLimitOf,
  sparkPath,
} from '../client/derive.js';
import {
  QUICK_STALE_MS,
  createQuickStore,
  createSidebarPrefs,
  quickFreshness,
} from '../client/quick-store.js';

/** 造一份最小 /status（字段名与真机一致）。 */
function statusFixture(overrides = {}) {
  const accounts = overrides.accounts ?? [
    {
      uid: 'uid-1', realm: 'cn', channel: 'workbuddy', nickname: '乙', credits: 1276,
      credits_at: new Date().toISOString(), in_flight: 0, cooling: false, disabled: false,
      success_count: 12, err_total: 0, last_success: new Date(Date.now() - 5_000).toISOString(),
      credits_expiring: 120,
    },
    {
      uid: 'uid-2', realm: 'global', channel: 'traework', nickname: '阿七', credits: 980,
      credits_at: new Date(Date.now() - 7_200_000).toISOString(), in_flight: 2, cooling: false,
      disabled: false, success_count: 3, err_total: 1, last_success: new Date(Date.now() - 600_000).toISOString(),
    },
  ];
  return {
    accounts,
    total: accounts.length,
    healthy: accounts.length,
    cooling: 0,
    disabled: 0,
    in_flight_full: 0,
    sticky_sessions: 4,
    uptime_sec: 3600,
    version: 'chanhub2api',
    realm_totals: { cn: { total: 1, healthy: 1 }, global: { total: 1, healthy: 1 } },
    ...overrides.status,
  };
}

/** 造一个假的 rpcCall：按端点回放，可观察调用次数。 */
function fakeRpc(handlers = {}) {
  const calls = [];
  const rpcCall = async (endpoint, payload) => {
    calls.push({ endpoint, payload });
    const handler = handlers[endpoint];
    if (typeof handler === 'function') return handler(payload, calls.length);
    if (handler !== undefined) return handler;
    return { ok: false, error: { message: `未打桩的端点 ${endpoint}` } };
  };
  return { rpcCall, calls };
}

// ---------------------------------------------------------------------------
// A. 纯派生
// ---------------------------------------------------------------------------

test('A1 realmLimitOf：global 档优先，缺失/0 时回落 cn 档（与网关 inFlightLimit 同规则）', () => {
  const config = { pool: { max_in_flight: 3, max_in_flight_global: 2 } };
  assert.equal(realmLimitOf(config, 'global'), 2, 'global 号用 global 档');
  assert.equal(realmLimitOf(config, 'cn'), 3);
  assert.equal(realmLimitOf({ pool: { max_in_flight: 3, max_in_flight_global: 0 } }, 'global'), 3, '0 = 未设置 → 回落');
  assert.equal(realmLimitOf({ pool: { max_in_flight: 3 } }, 'global'), 3, '缺字段 → 回落');
  assert.equal(realmLimitOf(undefined, 'global'), undefined, '无 config → undefined（界面降级为不画分母）');
});

test('A2 activityOf：只给证据，不给猜测', () => {
  const now = Date.now();
  assert.deepEqual(activityOf({ in_flight: 1 }, now)?.key, 'busy');
  assert.equal(activityOf({ in_flight: 0, last_success: new Date(now - 10_000).toISOString() }, now)?.key, 'recent');
  assert.equal(activityOf({ in_flight: 0, last_success: new Date(now - 600_000).toISOString() }, now), undefined);
  assert.equal(activityOf({}, now), undefined, '零证据 → 不显示');
});

test('A3 quickSummaryVM：可用积分只算 credits 合计，渠道按 channel 计数', () => {
  const summary = quickSummaryVM({
    status: statusFixture(),
    usage: { total: { requests: 10, success: 9, failed: 1, total_tokens: 1234, credit: 5 } },
  });
  assert.equal(summary.usableCredits, 2256, '1276 + 980');
  assert.equal(summary.total, 2);
  assert.equal(summary.healthy, 2);
  assert.equal(summary.inFlight, 2, 'Σ accounts[].in_flight');
  assert.equal(summary.healthRatio, 1);
  const wb = summary.channels.find((row) => row.id === 'workbuddy');
  const trae = summary.channels.find((row) => row.id === 'traework');
  assert.equal(wb.count, 1);
  assert.equal(trae.count, 1);
  assert.equal(summary.usage24h?.requests, 10, '近 24h 用 usage.total（滚动窗口）');
  assert.equal(summary.usage24h?.tokens, 1234);
});

test('A4 quickSummaryVM：空 status 不炸、不给假数', () => {
  const summary = quickSummaryVM({});
  assert.equal(summary.total, 0);
  assert.equal(summary.usableCredits, 0);
  assert.equal(summary.usage24h, undefined, '没用量时说 undefined，而不是编 0');
  assert.equal(summary.channels.find((row) => row.id === 'workbuddy').count, 0);
});

test('A5 accountCardVM：在途分母按 realm、凭证到期优先、余额占比相对池内最高', () => {
  const config = { pool: { max_in_flight: 3, max_in_flight_global: 2 } };
  const accounts = statusFixture().accounts;
  const globalVm = accountCardVM(accounts[1], { config, maxCredits: 1276, now: Date.now() });
  assert.equal(globalVm.target, 2, 'global 号分母必须是 global 档（旧实现在这里写死 cn 档）');
  assert.equal(globalVm.inFlight, 2);
  assert.equal(globalVm.inFlightFull, true, '占满判定也要按同一档位');
  assert.equal(globalVm.state?.key, 'full');
  assert.ok(globalVm.creditsRatio > 0 && globalVm.creditsRatio < 1);
  assert.equal(globalVm.color, channelColor('traework'));

  // 凭证 expiresAt（Unix 秒）优先于积分套餐到期
  const expires = Math.floor((Date.now() + 5 * 86400e3 + 60_000) / 1000);
  const cnVm = accountCardVM(accounts[0], {
    config,
    maxCredits: 1276,
    authAccounts: [{ uid: 'uid-1', expiresAt: expires }],
    now: Date.now(),
  });
  assert.equal(cnVm.expiry?.kind, 'credential');
  assert.equal(cnVm.expiry?.days, 5);
  assert.equal(cnVm.expiring, 120);
});

test('A6 sparkPath：空序列/单点/多点的几何都不越界', () => {
  assert.deepEqual(sparkPath([]), { points: '', area: '', max: 0, flat: true });
  const single = sparkPath([5], { width: 10, height: 10, padding: 1 });
  assert.equal(single.points, '1,5', '全平序列画在中线（不贴底/贴顶）');
  assert.equal(single.flat, true);
  const many = sparkPath([0, 5, 10], { width: 22, height: 12, padding: 2 });
  const ys = many.points.split(' ').map((pair) => Number(pair.split(',')[1]));
  assert.ok(Math.min(...ys) >= 2 && Math.max(...ys) <= 10, `y 必须在 padding 内: ${many.points}`);
  assert.equal(many.max, 10);
  assert.equal(many.flat, false);
});

// ---------------------------------------------------------------------------
// B. store 状态机
// ---------------------------------------------------------------------------

test('B1 只读轮询：start 后拿到 fresh，且只打 getStatus', async () => {
  const { rpcCall, calls } = fakeRpc({
    getStatus: { ok: true, value: { reachable: true, baseURL: 'http://127.0.0.1:7866', status: statusFixture() } },
    getConfig: { ok: true, value: { ok: true, config: { pool: { max_in_flight: 3 } } } },
    getAccounts: { ok: true, value: { ok: true, accounts: [] } },
  });
  const store = createQuickStore(rpcCall, { pollMs: 60_000, document: undefined });
  store.start();
  await new Promise((resolve) => setTimeout(resolve, 10));
  const snapshot = store.getSnapshot();
  assert.equal(snapshot.phase, 'fresh');
  assert.equal(snapshot.status?.total, 2);
  assert.ok(calls.every((call) => call.endpoint !== 'refreshStatus'), '自动路径绝不打真刷新');
  assert.ok(calls.some((call) => call.endpoint === 'getConfig'), '辅助数据（分档分母）应加载');
  store.dispose();
});

test('B2 网关不可达 → error 态且不带 status（界面据此显示「不可达」而不是 0）', async () => {
  const { rpcCall } = fakeRpc({
    getStatus: { ok: true, value: { reachable: false, baseURL: 'http://127.0.0.1:7866', error: { message: '网关不可达' } } },
  });
  const store = createQuickStore(rpcCall, { pollMs: 60_000, document: undefined });
  await store.loadStatus();
  const snapshot = store.getSnapshot();
  assert.equal(snapshot.phase, 'error');
  assert.equal(snapshot.status, undefined);
  assert.equal(snapshot.error?.message, '网关不可达');
  store.dispose();
});

test('B3 用量按 TTL 缓存，force 才重取', async () => {
  const { rpcCall, calls } = fakeRpc({
    getUsage: { ok: true, value: { available: true, usage: { total: { requests: 3 }, buckets: [] } } },
  });
  const store = createQuickStore(rpcCall, { pollMs: 60_000, document: undefined, usageTtlMs: 60_000 });
  await store.loadUsage();
  await store.loadUsage();
  assert.equal(calls.filter((call) => call.endpoint === 'getUsage').length, 1, 'TTL 内不重复拉');
  await store.loadUsage({ force: true });
  assert.equal(calls.filter((call) => call.endpoint === 'getUsage').length, 2);
  store.dispose();
});

test('B4 手动刷新是唯一会打上游的路径，并带回新 status', async () => {
  const { rpcCall, calls } = fakeRpc({
    getUsage: { ok: true, value: { available: true, usage: { total: { requests: 1 }, buckets: [] } } },
    refreshStatus: {
      ok: true,
      value: { reachable: true, refreshed: true, baseURL: 'http://127.0.0.1:7866', status: statusFixture({ accounts: [] }) },
    },
  });
  const store = createQuickStore(rpcCall, { pollMs: 60_000, document: undefined });
  const ok = await store.refreshUpstream();
  assert.equal(ok, true);
  assert.equal(store.getSnapshot().refreshing, false);
  assert.equal(store.getSnapshot().status?.total, 0);
  assert.deepEqual(calls.filter((call) => call.endpoint === 'refreshStatus').length, 1);
  store.dispose();
});

test('B5 失败累积后进入退避（degraded），不每分钟继续打', async () => {
  const { rpcCall, calls } = fakeRpc({
    getStatus: { ok: false, error: { message: 'boom' } },
  });
  const store = createQuickStore(rpcCall, { pollMs: 1, document: undefined });
  for (let i = 0; i < 4; i += 1) await store.loadStatus();
  assert.ok(store.getSnapshot().failures >= 3);
  store.dispose();
  assert.ok(calls.length >= 4);
});

test('B6 dispose 后不再有订阅者，也不会继续请求', async () => {
  const { rpcCall, calls } = fakeRpc({
    getStatus: { ok: true, value: { reachable: true, status: statusFixture() } },
  });
  const store = createQuickStore(rpcCall, { pollMs: 5, document: undefined });
  let ticks = 0;
  store.subscribe(() => {
    ticks += 1;
  });
  store.start();
  await new Promise((resolve) => setTimeout(resolve, 25));
  store.dispose();
  const frozen = calls.length;
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(calls.length, frozen, 'dispose 后不得再打 RPC');
  assert.ok(ticks > 0);
});

test('B7 quickFreshness 四态与陈旧阈值', () => {
  const now = 1_000_000;
  assert.equal(quickFreshness({ fetchedAt: 0 }, now), 'loading');
  assert.equal(quickFreshness({ error: { message: 'x' }, fetchedAt: now }, now), 'error');
  assert.equal(quickFreshness({ fetchedAt: now - 1_000 }, now), 'fresh');
  assert.equal(quickFreshness({ fetchedAt: now - QUICK_STALE_MS - 1 }, now), 'stale');
});

// ---------------------------------------------------------------------------
// C. 偏好（宿主 settings 命名空间）
// ---------------------------------------------------------------------------

test('C1 远程页/memory 模式：退回本浏览器存储，仍可开关（DSH 只在 loopback 提供宿主设置）', async () => {
  // 复刻 dsh-client-ui-settings 的 memory 模式快照（非 loopback 页面就是它）
  const memoryScope = {
    getSnapshot: () => ({ status: 'unavailable', value: undefined, writable: false, mode: 'memory' }),
    subscribe: () => () => {},
    set: async () => {
      throw new Error('memory 模式不可写');
    },
    dispose: () => {},
  };
  const store = new Map();
  const storage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  };
  const prefs = createSidebarPrefs(
    { bind: () => memoryScope },
    { namespace: 'dsh-chanhub', storage },
  );
  assert.equal(prefs.available, true);
  assert.equal(prefs.mode, 'local', 'memory 模式视为 local（只作用于本浏览器）');
  assert.equal(prefs.writable, true, '本浏览器存储可写');
  assert.equal(prefs.value, true, '没记录时吃默认值（入口默认开）');
  assert.equal(await prefs.set(false), true);
  assert.equal(prefs.value, false, '写入本浏览器存储后立即可读');
  assert.equal(store.get('dsh-chanhub.sidebarEntry'), 'false');
});

test('C2 没有 settingsScope 时同样退化为本浏览器存储（不抛、可用）', async () => {
  const store = new Map();
  const prefs = createSidebarPrefs(undefined, {
    namespace: 'dsh-chanhub',
    storage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
  });
  assert.equal(prefs.available, true);
  assert.equal(prefs.mode, 'local');
  assert.equal(await prefs.set(false), true);
  assert.equal(prefs.value, false);
});

test('C3 本机页（host）：读宿主值、写宿主设置，host 优先于本浏览器记录', async () => {
  const listeners = new Set();
  let value = { sidebarEntry: false };
  const scope = {
    getSnapshot: () => ({ value, writable: true, mode: 'host' }),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set: async (field, next) => {
      value = { ...value, [field]: next };
      for (const listener of listeners) listener();
    },
    dispose: () => listeners.clear(),
  };
  const store = new Map([['dsh-chanhub.sidebarEntry', 'true']]); // 本浏览器残留 true，但宿主说 false
  const prefs = createSidebarPrefs({ bind: () => scope }, {
    namespace: 'dsh-chanhub',
    storage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
  });
  assert.equal(prefs.mode, 'host');
  assert.equal(prefs.writable, true);
  assert.equal(prefs.value, false, 'host 模式以宿主值为准（跨设备一致）');
  let changes = 0;
  prefs.subscribe(() => {
    changes += 1;
  });
  assert.equal(await prefs.set(true), true);
  assert.equal(prefs.value, true, '写入后经订阅回流');
  assert.equal(changes, 1);
  assert.equal(store.has('dsh-chanhub.sidebarEntry'), true, 'host 模式不写本浏览器存储');
  prefs.dispose();
});

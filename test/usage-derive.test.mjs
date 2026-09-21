// dsh-chanhub —— 用量 Tab 派生逻辑单测（纯函数，无 DOM）
//
// 为什么必须单独测这层：用量页的核心缺陷是**口径**（柱数 ≠ 槽数、日槽被当成小时槽、
// 跨口径混算），这些都能在纯函数层被钉死，不必等浏览器渲染才发现。
//
// 最关键的一条：usageBySlot 必须把 (槽 × 域 × 账号 × 模型) 的**行**聚合为**槽**。
// 旧实现直接 slice(-48) 把行当柱子，3 账号 × 5 模型时 72h 窗口只画出约 3 小时。

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  creditBurn,
  creditStock,
  creditsFreshness,
  formatCredit,
  formatPercent,
  formatTokens,
  niceMax,
  slotKind,
  slotLabel,
  tokenStructure,
  uptimeText,
  usageBySlot,
  usageBySlotAndModel,
  usageSeriesByKey,
  usageShares,
  windowHours,
} from '../client/derive.js';

/** 构造 `count` 个账号 × `models` 个模型的行，全部落在同一槽。 */
function rowsForSlot(slot, uids, models, requests = 1) {
  const rows = [];
  for (const uid of uids) {
    for (const model of models) {
      rows.push({
        slot, realm: 'cn', uid, model,
        requests, failed: 0, streaming: 0,
        prompt_tokens: 100, completion_tokens: 50, total_tokens: 150,
        credit: 0.1, avg_latency_ms: 200, last_seen: '2026-09-21T08:00:00Z',
      });
    }
  }
  return rows;
}

const UIDS = ['u1', 'u2', 'u3'];
const MODELS = ['m1', 'm2', 'm3', 'm4', 'm5'];

test('U1 usageBySlot：柱数 === 槽数（旧实现的核心缺陷回归）', () => {
  const buckets = [
    ...rowsForSlot('h:2026-09-21T08', UIDS, MODELS),
    ...rowsForSlot('h:2026-09-21T09', UIDS, MODELS),
    ...rowsForSlot('d:2026-09-20', UIDS, MODELS),
  ];
  const rows = usageBySlot(buckets);
  // 45 行输入 → 3 个槽。旧实现会渲染 45 根柱（slice 到 48 甚至截不到 3 小时）
  assert.equal(buckets.length, 45);
  assert.equal(rows.length, 3, '必须按槽聚合：柱数 === 槽数');
  for (const row of rows) {
    assert.equal(row.requests, 15, '每槽请求数 = 账号数 × 模型数');
    assert.equal(row.total_tokens, undefined);
    assert.equal(row.tokens, 15 * 150);
    // 累加浮点数不做严格相等比较（0.1 累加 15 次 = 1.5000000000000002）
    assert.ok(Math.abs(row.credit - 1.5) < 1e-9);
  }
});

test('U2 usageBySlot：时间升序 + 延迟按请求数加权（不是简单平均）', () => {
  const rows = usageBySlot([
    { slot: 'h:2026-09-21T09', requests: 1, failed: 0, avg_latency_ms: 1000, total_tokens: 0, credit: 0 },
    { slot: 'h:2026-09-21T08', requests: 9, failed: 0, avg_latency_ms: 1000, total_tokens: 0, credit: 0 },
    { slot: 'h:2026-09-21T08', requests: 1, failed: 0, avg_latency_ms: 2000, total_tokens: 0, credit: 0 },
  ]);
  assert.equal(rows[0].slot, 'h:2026-09-21T08', '必须按时间升序');
  assert.equal(rows[1].slot, 'h:2026-09-21T09');
  // 加权：(1000×9 + 2000×1) / 10 = 1100，简单平均会得 1500（失真）
  assert.equal(rows[0].latencyMS, 1100);
});

test('U3 usageBySlot：success = requests − failed，失败单独累计', () => {
  const rows = usageBySlot([
    { slot: 'h:2026-09-21T08', requests: 10, failed: 3, total_tokens: 0, credit: 0, avg_latency_ms: 0 },
    { slot: 'h:2026-09-21T08', requests: 5, failed: 1, total_tokens: 0, credit: 0, avg_latency_ms: 0 },
  ]);
  assert.equal(rows[0].requests, 15);
  assert.equal(rows[0].failed, 4);
  assert.equal(rows[0].success, 11);
});

test('U4 usageBySlot：坏输入不抛异常（形状漂移降级为空）', () => {
  assert.deepEqual(usageBySlot(undefined), []);
  assert.deepEqual(usageBySlot(null), []);
  assert.deepEqual(usageBySlot('nope'), []);
  assert.deepEqual(usageBySlot([null, {}, { slot: 123 }]), []);
});

test('U5 slotKind：小时槽 / 日槽 / 未知三态', () => {
  assert.equal(slotKind('h:2026-09-21T08'), 'hour');
  assert.equal(slotKind('d:2026-09-20'), 'day');
  assert.equal(slotKind('x:2026-09-20'), 'unknown');
  assert.equal(slotKind(''), 'unknown');
  assert.equal(slotKind(undefined), 'unknown');
});

test('U6 slotLabel：日槽必须自报家门（否则会被读成某小时）', () => {
  assert.match(slotLabel('h:2026-09-21T08'), /^09-21 08:00$/);
  assert.match(slotLabel('d:2026-09-20'), /^2026-09-20（日槽）$/);
  assert.equal(slotLabel('garbage'), 'garbage');
});

test('U7 tokenStructure：两段比例，且合计优先取 total_tokens', () => {
  const structure = tokenStructure({ prompt_tokens: 820, completion_tokens: 180, total_tokens: 1000 });
  assert.equal(structure.total, 1000);
  assert.equal(structure.promptShare, 0.82);
  assert.equal(structure.completionShare, 0.18);
  // total_tokens 缺失 → 由两段相加补出
  assert.equal(tokenStructure({ prompt_tokens: 3, completion_tokens: 7 }).total, 10);
  // 全空 → 不产生 NaN
  const empty = tokenStructure({});
  assert.equal(empty.total, 0);
  assert.equal(empty.promptShare, 0);
});

test('U8 tokenStructure：空 total 也不除零', () => {
  const structure = tokenStructure(undefined);
  assert.ok(Number.isFinite(structure.promptShare));
  assert.ok(Number.isFinite(structure.completionShare));
});

test('U9 usageShares：占比与成功率；除零安全', () => {
  const rows = usageShares(
    [{ key: 'a', requests: 30, failed: 3 }, { key: 'b', requests: 10, failed: 0 }],
    { requests: 40, failed: 3 },
  );
  assert.equal(rows[0].share, 0.75);
  assert.equal(rows[1].share, 0.25);
  assert.equal(rows[0].successRate, 0.9);
  assert.equal(rows[1].successRate, 1);
  // 零请求行不得产生 NaN
  const zero = usageShares([{ key: 'z', requests: 0, failed: 0 }], { requests: 0 });
  assert.equal(zero[0].successRate, 0);
  assert.equal(zero[0].share, 0);
});

test('U10 creditStock：不可消耗单列，不并入可用总量（用户明确要求）', () => {
  const accounts = [
    { uid: 'u1', credits: 2880, credits_total: 3120 },
    { uid: 'u2', credits: 10, credits_total: 100 },
  ];
  const stock = creditStock(accounts, {}, () => 'workbuddy');
  assert.equal(stock.usable, 2890);
  // 无明细端点时用 credits_total − credits 兜底：240 + 90
  assert.equal(stock.unusable, 330);
  // 明细端点在场地时取 unusable_total（更精确口径）
  const withDetail = creditStock(accounts, {
    u1: { available: true, credits: { usable_total: 2880, unusable_total: 999 } },
    u2: { available: true, credits: { usable_total: 10, unusable_total: 1 } },
  }, () => 'workbuddy');
  assert.equal(withDetail.unusable, 1000);
});

test('U11 creditStock：按渠道汇总 + 空数据不崩', () => {
  const accounts = [
    { uid: 'u1', credits: 100 },
    { uid: 'u2', credits: 50 },
    { uid: 'u3', credits: 7 },
  ];
  const channelOf = (account) => ({ u1: 'workbuddy', u2: 'traework', u3: 'traework' }[account.uid]);
  const stock = creditStock(accounts, {}, channelOf);
  const byId = Object.fromEntries(stock.byChannel.map((item) => [item.id, item]));
  assert.equal(byId.workbuddy.usable, 100);
  assert.equal(byId.traework.usable, 57);
  assert.equal(byId.traework.count, 2);
  const empty = creditStock(undefined, undefined, undefined);
  assert.equal(empty.usable, 0);
  assert.equal(empty.unusable, 0);
});

test('U12 creditBurn：正常外推 + 不编造（无消耗/无存量返回 null）', () => {
  const burn = creditBurn(4646, 396, '72h');
  assert.ok(burn !== null);
  assert.equal(Math.round(burn.perDay), 132);
  assert.ok(Math.abs(burn.days - 35.2) < 0.5);
  // 无消耗 → null（而不是除零得 Infinity 或编一个天数）
  assert.equal(creditBurn(1000, 0, '72h'), null);
  // 无存量 → null
  assert.equal(creditBurn(0, 100, '72h'), null);
  // 未知窗口 → null（不猜窗口长度）
  assert.equal(creditBurn(1000, 100, 'bogus'), null);
});

test('U13 windowHours：与网关 parseWindow 的允许值一致', () => {
  assert.equal(windowHours('24h'), 24);
  assert.equal(windowHours('72h'), 72);
  assert.equal(windowHours('168h'), 168);
  assert.equal(windowHours('720h'), 720);
  assert.equal(windowHours('7d'), 168, '网关接受 7d 别名');
  assert.equal(windowHours('30d'), 720);
  assert.equal(windowHours('12h'), null, '网关不接受的窗口不得静默当成 24h');
});

test('U14 usageSeriesByKey：保留时间轴，空键按网关规则跳过', () => {
  const buckets = [
    { slot: 'h:2026-09-21T08', uid: 'u1', realm: 'cn', model: 'm', requests: 3 },
    { slot: 'h:2026-09-21T08', uid: 'u2', realm: 'cn', model: 'm', requests: 1 },
    { slot: 'h:2026-09-21T09', uid: 'u1', realm: 'cn', model: 'm', requests: 5 },
    // 降级模式下 uid 为空 —— uid/model 维度无意义，必须跳过
    { slot: 'h:2026-09-21T09', uid: '', realm: 'cn', model: '', requests: 99 },
  ];
  const { slots, series } = usageSeriesByKey(buckets, 'uid');
  assert.equal(slots.length, 2);
  assert.deepEqual(series.get('u1'), [3, 5]);
  assert.deepEqual(series.get('u2'), [1, 0]);
  assert.ok(!series.has('total'), 'uid 维度不得把空键归为 total');
});

test('U15 usageBySlotAndModel：堆叠层与槽对齐，按总量降序', () => {
  const buckets = [
    { slot: 'h:2026-09-21T08', model: 'm1', requests: 10 },
    { slot: 'h:2026-09-21T08', model: 'm2', requests: 2 },
    { slot: 'h:2026-09-21T09', model: 'm1', requests: 4 },
    { slot: 'h:2026-09-21T09', model: 'm2', requests: 8 },
  ];
  const data = usageBySlotAndModel(buckets);
  assert.equal(data.slots.length, 2);
  assert.equal(data.models.length, 2);
  assert.equal(data.models[0].key, 'm1', '按总请求降序：m1=14 > m2=10');
  assert.deepEqual(data.models[0].values, [10, 4]);
  assert.deepEqual(data.models[1].values, [2, 8]);
  for (const model of data.models) assert.equal(model.values.length, data.slots.length);
  const empty = usageBySlotAndModel(undefined);
  assert.deepEqual(empty.slots, []);
  assert.deepEqual(empty.models, []);
});

test('U16 creditsFreshness：无时间戳不谎报「刚刚更新」', () => {
  const now = Date.parse('2026-09-21T12:00:00Z');
  assert.deepEqual(creditsFreshness([], now), { oldestISO: null, stale: false });
  assert.deepEqual(
    creditsFreshness([{ credits_at: '0001-01-01T00:00:00Z' }], now),
    { oldestISO: null, stale: false },
    '零值时间必须当作「无数据」，不能算成很旧',
  );
  const fresh = creditsFreshness([{ credits_at: '2026-09-21T11:58:00Z' }], now);
  assert.equal(fresh.stale, false);
  const stale = creditsFreshness([{ credits_at: '2026-09-21T09:00:00Z' }], now);
  assert.equal(stale.stale, true, '超过 1 小时标记为陈旧');
});

test('U17 格式化：缺失值显示 — 而不是 0 或 NaN', () => {
  assert.equal(formatTokens(412300), '412.3k');
  assert.equal(formatTokens(11680000), '11.68M');
  assert.equal(formatTokens(0), '0');
  assert.equal(formatTokens(undefined), '—');
  assert.equal(formatTokens(NaN), '—');
  assert.equal(formatCredit(396.74), '396.74');
  assert.equal(formatCredit(0.03), '0.030');
  assert.equal(formatCredit(0), '0');
  assert.equal(formatCredit(undefined), '—');
  assert.equal(formatPercent(0.998, 1), '99.8%');
  assert.equal(formatPercent(undefined), '—');
});

test('U18 niceMax：刻度上限取整，且对极端输入安全', () => {
  assert.equal(niceMax(137), 150);
  assert.equal(niceMax(9), 9);
  assert.equal(niceMax(0), 1);
  assert.equal(niceMax(-5), 1);
  assert.equal(niceMax(undefined), 1);
  assert.ok(niceMax(4321) >= 4321);
});

test('U19 uptimeText：进程累计时长，中文可读', () => {
  assert.equal(uptimeText(0), '0 秒');
  assert.equal(uptimeText(45), '45 秒');
  assert.equal(uptimeText(11520), '3 小时 12 分');
  assert.equal(uptimeText(200000), '2 天 7 小时');
  assert.equal(uptimeText(undefined), '—');
  assert.equal(uptimeText(-1), '—');
});

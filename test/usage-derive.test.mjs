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
  ALL_CONSUMERS,
  accountExpiry,
  channelPalette,
  accountShares,
  channelShares,
  consumerOptions,
  consumerShares,
  creditBurn,
  creditStock,
  creditsFreshness,
  earnedCredits,
  formatCredit,
  formatPercent,
  formatCompact,
  formatTokens,
  kpiCards,
  rankMetric,
  heatGrid,
  hourlyProfile,
  heatLevel,
  modelShares,
  niceMax,
  quartileThresholds,
  scopeUsage,
  slotKind,
  slotLabel,
  tokenStructure,
  uptimeText,
  usageByDay,
  usageBySlot,
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

test('U15 usageByDay：混合槽按天合并（小时槽 + 日槽）', () => {
  const rows = [
    { slot: 'h:2026-09-21T08', kind: 'hour', at: Date.parse('2026-09-21T08:00:00'), requests: 10, failed: 0, tokens: 100, credit: 1 },
    { slot: 'h:2026-09-21T09', kind: 'hour', at: Date.parse('2026-09-21T09:00:00'), requests: 5, failed: 0, tokens: 50, credit: 0.5 },
    { slot: 'd:2026-09-20', kind: 'day', at: Date.parse('2026-09-20T00:00:00'), requests: 20, failed: 0, tokens: 200, credit: 2 },
  ];
  const days = usageByDay(rows);
  assert.equal(days.length, 2, '同一天的两个小时槽必须合并');
  const today = days.find((d) => d.date === '2026-09-21');
  assert.equal(today.requests, 15);
  assert.equal(today.tokens, 150);
  assert.equal(today.hours, 2, '小时槽计数');
  assert.equal(days.find((d) => d.date === '2026-09-20').days, 1, '日槽计数');
  // 升序
  assert.deepEqual(days.map((d) => d.date), ['2026-09-20', '2026-09-21']);
  assert.deepEqual(usageByDay(undefined), []);
});

test('U16 heatGrid：固定 30 天骨架（不随有数据的天数伸缩）', () => {
  // 真实场景回归：网关早期只有 1 天数据。旧实现按实际天数推宽度 → 只画 1 列，
  // 屏幕上是个 11px 方块，用户以为「没有热力图」。现在骨架恒为 windowDays。
  const oneDay = [{ date: '2026-09-20', requests: 30 }];
  const grid = heatGrid(oneDay, { windowDays: 30, end: new Date('2026-09-20T12:00:00') });
  assert.equal(grid.windowDays, 30);
  assert.equal(grid.weeks, 5, '30 天 + 周一前置 → 5 周');
  assert.equal(grid.cells.length, grid.weeks * 7, '格数必须 = 周数 × 7');
  assert.equal(grid.cells.filter((c) => !c.blank).length, 30, '窗口内 30 天都应有格子');
  assert.equal(grid.activeDays, 1, '只有 1 天有记录');
  // 有数据那天必须是最深档
  const hit = grid.cells.find((c) => c.date === '2026-09-20');
  assert.equal(hit.value, 30);
  assert.equal(hit.level, 4);
  assert.equal(hit.blank, false);
  // 窗口前的格子标记 outside（用于「窗口外」tooltip，不画成「无记录」）
  assert.ok(grid.cells.some((c) => c.outside), '首周前置格应为窗口外');
  // 空数据也必须给出完整骨架
  const empty = heatGrid([], { windowDays: 30, end: new Date('2026-09-20T12:00:00') });
  assert.equal(empty.cells.filter((c) => !c.blank).length, 30, '无数据也要有完整 30 天骨架');
  assert.equal(empty.activeDays, 0);
});

test('U17 hourlyProfile：24 小时分布（数据不足一天时的替代视图）', () => {
  const buckets = [
    { at: Date.parse('2026-09-20T18:00:00'), requests: 10, tokens: 100 },
    { at: Date.parse('2026-09-20T18:30:00'), requests: 5, tokens: 50 },
    { at: Date.parse('2026-09-20T21:00:00'), requests: 3, tokens: 30 },
  ];
  const hours = hourlyProfile(buckets);
  assert.equal(hours.length, 24, '恒定 24 项（含空档，便于画柱）');
  assert.equal(hours[18].requests, 15, '同一小时的多槽应合并');
  assert.equal(hours[18].slots, 2);
  assert.equal(hours[21].requests, 3);
  assert.equal(hours[0].requests, 0);
  assert.ok(hours.every((h) => typeof h.hour === 'number'));
  assert.deepEqual(hourlyProfile(undefined).length, 24);
});

test('U18 分位色阶：长尾分布下不塌成一片浅色', () => {
  // 典型长尾：多数很小、个别极大。线性映射会让 90% 格子落最浅档。
  const values = [1, 1, 2, 2, 3, 4, 5, 900];
  const q = quartileThresholds(values);
  const levels = values.map((v) => heatLevel(v, q));
  assert.ok(levels.filter((l) => l === 4).length >= 1, '最大值必须落在最深档');
  assert.ok(new Set(levels).size >= 3, `分位应产生多个档位，实际 ${[...new Set(levels)].join(',')}`);
  assert.equal(heatLevel(0, q), 0);
  assert.deepEqual(quartileThresholds([]), [0, 0, 0, 0]);
});

test('U19 modelShares：按 token 占比降序，长尾合并为「其他」', () => {
  const rows = [
    { key: 'a', total_tokens: 60 },
    { key: 'b', total_tokens: 25 },
    { key: 'c', total_tokens: 10 },
    { key: 'd', total_tokens: 5 },
  ];
  const shares = modelShares(rows, 2);
  assert.equal(shares.length, 3, '2 个头部 + 1 个其他');
  assert.equal(shares[0].key, 'a');
  assert.ok(Math.abs(shares[0].share - 0.6) < 1e-9);
  assert.match(shares[2].key, /^其他 2 个$/);
  assert.ok(Math.abs(shares[2].share - 0.15) < 1e-9);
  // 占比合计为 1
  const sum = shares.reduce((acc, item) => acc + item.share, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, `占比合计应 = 1，实际 ${sum}`);
  // 零/缺失输入不编造
  assert.deepEqual(modelShares([], 5), []);
  assert.deepEqual(modelShares([{ key: 'x', total_tokens: 0 }], 5), []);
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

test('U20 格式化：缺失值显示 — 而不是 0 或 NaN', () => {
  assert.equal(formatTokens(412300), '412.3K');
  assert.equal(formatTokens(11680000), '11.68M');
  // B 档：真机 30 天窗口实测 19.18 亿 tokens —— 旧实现会写成 1917.97M
  assert.equal(formatTokens(1917965446), '1.92B');
  // 紧凑计数走中文量级：万 / 亿
  assert.equal(formatCompact(3844), '3,844');
  assert.equal(formatCompact(25940), '2.59W');
  assert.equal(formatCompact(570027), '57W');
  assert.equal(formatCompact(123456789), '1.23亿');
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

test('U21 niceMax：刻度上限取整，且对极端输入安全', () => {
  assert.equal(niceMax(137), 150);
  assert.equal(niceMax(9), 9);
  assert.equal(niceMax(0), 1);
  assert.equal(niceMax(-5), 1);
  assert.equal(niceMax(undefined), 1);
  assert.ok(niceMax(4321) >= 4321);
});

test('U22 uptimeText：进程累计时长，中文可读', () => {
  assert.equal(uptimeText(0), '0 秒');
  assert.equal(uptimeText(45), '45 秒');
  assert.equal(uptimeText(11520), '3 小时 12 分');
  assert.equal(uptimeText(200000), '2 天 7 小时');
  assert.equal(uptimeText(undefined), '—');
  assert.equal(uptimeText(-1), '—');
});

test('U23 earnedCredits：只算取到明细的账号，缺明细的绝不拿余额凑', () => {
  const accounts = [{ uid: 'a', credits: 100 }, { uid: 'b', credits: 800 }];
  const byUid = {
    a: { available: true, credits: { items: [{ total: 500, used: 400, remain: 100 }] } },
    // b 没取到明细 → 不计入，只进 missing
    b: { available: false, reason: '端点不可用' },
  };
  const got = earnedCredits(accounts, byUid);
  assert.equal(got.total, 500, '赚得只算有明细的账号');
  assert.equal(got.used, 400);
  assert.equal(got.remain, 100);
  assert.equal(got.covered, 1);
  assert.equal(got.missing, 1);
  assert.equal(got.count, 2);
  // 真机 5 号实测：赚得 = 已用 + 剩余，剩余与池内 credits 合计对齐
  const all = earnedCredits(
    [{ uid: 'x' }, { uid: 'y' }],
    {
      x: { available: true, credits: { items: [{ total: 5800, used: 4674, remain: 1126 }] } },
      y: { available: true, credits: { items: [{ total: 800, used: 0, remain: 800 }] } },
    },
  );
  assert.equal(all.total, 6600);
  assert.equal(all.remain, 1126 + 800, '剩余必须与池内余额同源');
  assert.deepEqual(earnedCredits([], {}), { total: 0, used: 0, remain: 0, covered: 0, missing: 0, count: 0 });
});

test('U24 accountExpiry：登录态到期优先（网关透出），其次凭证盘点，降级取最早积分到期，都没有则 null', () => {
  const now = Date.parse('2026-09-21T12:00:00Z');
  const tomorrow = Math.floor(now / 1000) + 86400;
  // ⓪ 登录态到期：网关 /status 透出的 login_expires_at（Unix 秒）—— 权威来源。
  //    关键场景：插件与网关不同机、auths 目录读不到时，只有它能给出账号真实到期日。
  const viaLogin = accountExpiry({
    account: { uid: 'a', login_expires_at: tomorrow },
    authAccounts: [],
    now,
  });
  assert.equal(viaLogin.kind, 'credential', 'login_expires_at 必须识别为登录态到期');
  assert.equal(viaLogin.days, 1, '整整 24 小时后到期 → 1 天');
  assert.equal(viaLogin.expired, false);
  // ⓪b login_expires_at 优先于同机凭证盘点（两者都在时以网关透出为准）
  const both = accountExpiry({
    account: { uid: 'a', login_expires_at: tomorrow },
    authAccounts: [{ uid: 'a', expiresAt: tomorrow + 86400 * 10 }],
    now,
  });
  assert.equal(both.days, 1, 'login_expires_at 应压过 auths 盘点的 expiresAt');
  // ⓪c 老网关给毫秒时按量级判定（不硬乘 1000）
  const viaMillis = accountExpiry({
    account: { uid: 'a', login_expires_at: (tomorrow) * 1000 },
    authAccounts: [],
    now,
  });
  assert.equal(viaMillis.days, 1, '毫秒量级也要正确换算');
  // ① 凭证到期（Unix 秒）—— 网关未透出 login_expires_at 时的同源兜底
  const viaAuth = accountExpiry({
    account: { uid: 'a' },
    authAccounts: [{ uid: 'a', expiresAt: tomorrow }],
    now,
  });
  assert.equal(viaAuth.kind, 'credential');
  assert.equal(viaAuth.days, 1, '整整 24 小时后到期 → 1 天');
  assert.equal(viaAuth.expired, false);
  // ② 无凭证 → 降级到最早一批「还有余额」的积分到期
  const viaPackage = accountExpiry({
    account: { uid: 'b' },
    authAccounts: [],
    creditsDetail: {
      available: true,
      credits: {
        items: [
          { remain: 0, expire_at: '2026-09-22' }, // 已耗尽：不算
          { remain: 10, expire_at: '2026-09-30' },
          { remain: 5, expire_at: '2026-10-21' },
        ],
      },
    },
    now,
  });
  assert.equal(viaPackage.kind, 'package');
  assert.equal(new Date(viaPackage.at).getUTCDate(), 30);
  // ③ 都没有 → null（不编造「永不过期」）
  assert.equal(accountExpiry({ account: { uid: 'c' }, now }), null);
  assert.equal(accountExpiry({ account: { uid: 'd' }, creditsDetail: { available: false }, now }), null);
});

test('U25 排行维度：默认按用量（Tokens），切维度后顺序与占比跟着变', () => {
  const rows = [
    { key: 'u1', requests: 100, total_tokens: 1000, credit: 1 },
    { key: 'u2', requests: 10, total_tokens: 9000, credit: 90 },
  ];
  const accounts = [{ uid: 'u1', nickname: '甲' }, { uid: 'u2', nickname: '乙' }];
  const total = { requests: 110, total_tokens: 10000, credit: 91 };
  assert.equal(rankMetric(undefined).id, 'tokens', '默认维度必须是按用量');

  const byTokens = accountShares(rows, total, accounts);
  assert.deepEqual(byTokens.map((r) => r.key), ['u2', 'u1'], '按 Tokens：乙在前');
  assert.ok(Math.abs(byTokens[0].share - 0.9) < 1e-9);

  const byRequests = accountShares(rows, total, accounts, () => 'workbuddy', 'requests');
  assert.deepEqual(byRequests.map((r) => r.key), ['u1', 'u2'], '按请求数：甲在前');
  assert.ok(Math.abs(byRequests[0].share - 100 / 110) < 1e-9);

  const channels = channelShares(rows, total, accounts, () => 'workbuddy', 'credit');
  assert.equal(channels[0].accounts, 2, '渠道行要带账号数（UI 展示为「2 个账号」）');
  assert.ok(Math.abs(channels[0].share - 1) < 1e-9);
});

test('U26 kpiCards：6 张、两行三列，缓存/延迟无观测显示 — 而不是 0', () => {
  const cards = kpiCards({
    total: { requests: 7157, failed: 64, total_tokens: 1917965446, credit: 570027.4, cache_hit_tokens: 1472, cache_miss_tokens: 38498, avg_latency_ms: 8446.25 },
    stock: { usable: 9658, unusable: 0 },
    days: [{ requests: 10 }],
    burn: null,
  });
  assert.deepEqual(
    cards.map((c) => c.key),
    ['tokens', 'credit', 'stock', 'requests', 'cache', 'latency'],
    '第一行 消耗三件套、第二行 效率三件套',
  );
  const byKey = Object.fromEntries(cards.map((c) => [c.key, c]));
  assert.equal(byKey.tokens.value, '1.92B');
  assert.equal(byKey.credit.value, '57W');
  assert.equal(byKey.stock.value, '9,658');
  assert.equal(byKey.requests.value, '7,157');
  assert.match(byKey.cache.value, /%$/);
  assert.equal(byKey.latency.value, '8.4 s');
  // 无观测：命中率与延迟必须显示 —，不能显示 0.0% / 0 ms
  const empty = kpiCards({ total: {}, stock: { usable: 0 }, days: [], burn: null });
  const emptyByKey = Object.fromEntries(empty.map((c) => [c.key, c]));
  assert.equal(emptyByKey.cache.value, '—');
  assert.equal(emptyByKey.latency.value, '—');
});

test('U27 channelPalette：三件套同源、soft/edge 由 identity 色派生、未知渠道回落中性灰', () => {
  const wb = channelPalette('workbuddy');
  assert.equal(wb.solid, '#4f6ef7', 'solid 必须是渠道识别色本体');
  assert.match(wb.soft, /^color-mix\(in srgb, #4f6ef7 12%, transparent\)$/, 'soft = identity 12% 混透明');
  assert.match(wb.edge, /^color-mix\(in srgb, #4f6ef7 45%, transparent\)$/, 'edge = identity 45% 混透明');
  // 三个渠道必须彼此不同（身份色的意义就在这里）
  const solids = ['workbuddy', 'traework', 'qoder'].map((id) => channelPalette(id).solid);
  assert.equal(new Set(solids).size, 3, `三渠道色必须互异，实际 ${JSON.stringify(solids)}`);
  // 未知 / 空值回落中性灰，不编品牌色（与 channelColor 同约定）
  assert.equal(channelPalette('nope').solid, '#94a3b8');
  assert.equal(channelPalette(undefined).solid, '#94a3b8');
  assert.equal(channelPalette('').soft, 'color-mix(in srgb, #94a3b8 12%, transparent)');
});

// U28 —— 消费者维「已删除的 key」折叠（2026-09-24）。
//
// 为什么必须钉死：这次改动的两个错误方向都是**静默**的 —— 逐把渲染只是把真实
// 消费者挤出 8 行预算（看起来像「没人用」），而直接过滤掉会改掉份额分母
// （看起来像「这些量不存在」）。两者都不会报错，只能靠断言拦。
test('U28 consumerShares：已删除的 key 折成一行且末位，分母与总量一字不差', () => {
  const rows = [
    { key: 'master', label: '主 key', requests: 1639, failed: 16, total_tokens: 357418199, credit: 71.93 },
    { key: 'k_live', label: 'workbuddyswitch', requests: 17, failed: 7, total_tokens: 393683, credit: 0 },
    { key: 'k_gone1', label: '', requests: 3, failed: 2, total_tokens: 649, credit: 0 },
    { key: 'k_gone2', label: '', requests: 1, failed: 1, total_tokens: 185, credit: 0 },
    { key: 'k_gone3', label: '', requests: 1, failed: 1, total_tokens: 0, credit: 0 },
  ];
  const out = consumerShares(rows, 'tokens');

  // 5 行 → 3 行（2 个真实消费者 + 1 行汇总）
  assert.equal(out.length, 3, '已删除的 3 把必须折成 1 行');
  assert.deepEqual(out.map((r) => r.key), ['master', 'k_live', '__deleted__'], '汇总行必须固定末位、不进排行');

  const gone = out[2];
  assert.equal(gone.deleted, true, '汇总行必须带 deleted 标记（卡片据此判身份）');
  assert.equal(gone.deletedSummary, true, '汇总行必须与「单把已删除的 key」区分开（卡片只认这个标记）');
  assert.equal(gone.deletedCount, 3);
  assert.deepEqual(gone.deletedIds, ['k_gone1', 'k_gone2', 'k_gone3'], 'id 明细必须保留（tooltip 是唯一出口）');
  assert.equal(gone.name, '已删除的 3 个 key');

  // 逐字段相加：分母/总量不得因折叠而变化（这是「别改成直接隐藏」的硬约束）
  assert.equal(gone.tokens, 834, 'token 必须逐行相加');
  assert.equal(gone.requests, 5);
  assert.equal(gone.failed, 4);
  assert.equal(gone.failRate, 4 / 5);
  assert.ok(Math.abs(out.reduce((sum, r) => sum + r.tokens, 0) - 357812716) < 1e-9, '总量必须守恒');
  assert.ok(Math.abs(out.reduce((sum, r) => sum + r.share, 0) - 1) < 1e-9, '份额之和必须仍是 100%');
  assert.ok(Math.abs(gone.share - 834 / 357812716) < 1e-12, '汇总行仍占分母（隐藏会破坏占比口径）');
});

test('U28b consumerShares：无已删除 key 时不多出空行；未鉴权/主 key 不被误判为已删除', () => {
  const only = consumerShares([
    { key: 'master', label: '主 key', requests: 10, total_tokens: 100 },
    { key: 'k_live', label: 'A', requests: 5, total_tokens: 50 },
  ], 'tokens');
  assert.equal(only.length, 2, '没有已删除的 key 时不得凭空多一行汇总');
  assert.ok(only.every((r) => r.deleted === false));

  // 空 key = 未鉴权（网关降级形态），不是「已删除」；label 缺失但 key 是 master 也不是
  const edge = consumerShares([
    { key: '', requests: 5, total_tokens: 10 },
    { key: 'master', requests: 1, total_tokens: 1 },
  ], 'tokens');
  assert.deepEqual(edge.map((r) => r.name), ['（未鉴权）', '主 key'], '边界行不得被折进「已删除」');
  assert.ok(edge.every((r) => r.deleted === false));

  assert.equal(consumerShares([], 'tokens').length, 0);
  assert.equal(consumerShares(undefined, 'tokens').length, 0, '旧网关无 by_key 时不得抛错');
});

// U29 —— 消费者作用域（「只看某一把 key」）。
//
// 为什么必须钉死：网关的 /v1/stats/buckets **没有**按 key 过滤的参数，收窄全靠
// 客户端重算 total / by_uid / by_model / by_key。重算一旦与网关的
// accumulate/finalizeGroup 有半点不一致，就会静默出现「KPI 是全量、模型占比是
// 单 key」这类半新半旧 —— 不会报错，只会给出错的数。
test('U29 scopeUsage：收窄后各维重算与网关同口径（加权均值 / 命中率分母 / 空键）', () => {
  const usage = scopeFixture();
  const before = JSON.stringify(usage);

  const scoped = scopeUsage(usage, 'k_a');
  assert.equal(scoped.buckets.length, 2, '只保留该 key 的分桶行');
  assert.equal(scoped.total.requests, 10);
  assert.equal(scoped.total.total_tokens, 130);
  assert.ok(Math.abs(scoped.total.credit - 0.75) < 1e-9);
  // 均值必须**按请求数加权**：(300×6 + 200×4) / 10 = 260，直接平均会得 250
  assert.ok(Math.abs(scoped.total.avg_latency_ms - 260) < 1e-9, '加权均值口径');
  // 命中率分母 = 命中 + 未命中（**写入不进分母**）：20 / (20 + 20) = 0.5
  assert.ok(Math.abs(scoped.total.cache_hit_rate - 0.5) < 1e-9, '写入不得进命中率分母');

  assert.deepEqual(scoped.by_uid.map((r) => r.key), ['u1', 'u2'], '按账号维度同步收窄');
  assert.deepEqual(scoped.by_model.map((r) => r.key), ['m1', 'm2'], '按模型维度同步收窄');
  assert.deepEqual(scoped.by_realm.map((r) => r.key).sort(), ['cn', 'global']);
  assert.equal(scoped.by_key.length, 1);
  assert.equal(scoped.by_key[0].label, 'A', 'label 必须沿用网关读取时 join 的结果，客户端不重算');

  // 「未鉴权」（空 key）是真实分组：可选、可看，且**只进 total**（与网关一致）
  const unauth = scopeUsage(usage, '');
  assert.equal(unauth.total.requests, 3);
  assert.equal(unauth.by_uid.length, 0, '空 uid 不进按账号维度（网关 accumulate 跳过空键）');
  assert.equal(unauth.by_model.length, 0);

  // 不收窄 / 幂等 / 不存在的 key
  assert.equal(scopeUsage(usage, ALL_CONSUMERS), usage, '「全部」必须原样返回同一引用（零开销）');
  assert.deepEqual(scopeUsage(scoped, 'k_a').total, scoped.total, '重复收窄同一把 key 必须幂等');
  const missing = scopeUsage(usage, 'k_nope');
  assert.equal(missing.buckets.length, 0);
  assert.equal(missing.total.requests, 0, '不存在的 key 要给全 0 total，不能是 undefined');
  assert.equal(missing.by_uid.length, 0);

  assert.equal(JSON.stringify(usage), before, 'scopeUsage 不得改动入参');
});

test('U29b consumerOptions：在用的逐把列出，已删除的折成一项（选择器不铺开废弃 key）', () => {
  const options = consumerOptions(scopeFixture().by_key);
  assert.deepEqual(options.map((o) => o.label), ['主 key', 'A', '（未鉴权）'], '没有已删除的 key 时不多一项');
  assert.ok(options.every((o) => o.deleted === false));

  const withGone = consumerOptions([
    { key: 'master', label: '主 key', requests: 5, total_tokens: 50 },
    { key: 'k_gone1', label: '', requests: 2, failed: 2, total_tokens: 0 },
    { key: 'k_gone2', label: '', requests: 3, failed: 1, total_tokens: 30 },
  ]);
  assert.deepEqual(withGone.map((o) => o.label), ['主 key', '已删除的 2 个 key'], '废弃 key 必须折成一项');
  const group = withGone[1];
  assert.equal(group.deleted, true);
  assert.deepEqual([...group.deletedIds].sort(), ['k_gone1', 'k_gone2'], '组内 id 必须保留（收窄时按这组过滤）');
  assert.equal(group.requests, 5);
  assert.equal(group.tokens, 30);
  assert.ok(Math.abs(group.failRate - 3 / 5) < 1e-9, '组内被拒率按请求数加权');

  // 折叠开关只影响汇总，不影响「指定某把 key 时要看得见它」
  const noFold = consumerShares([{ key: 'k_gone', label: '', requests: 1, total_tokens: 1 }], 'tokens', { foldDeleted: false });
  assert.equal(noFold.length, 1);
  assert.equal(noFold[0].deleted, true, '不折叠 ≠ 抹掉「已删除」这个事实');
  assert.equal(noFold[0].name, 'k_gone（已删除）');
  // 单把已删除的 key **不是**汇总行：它没有 deletedIds。卡片若按 deleted 判汇总行
  // 就会读到 undefined.join() 并整块白屏（真机踩过），故这里把两者的区别钉死。
  assert.equal(noFold[0].deletedSummary, undefined, '单把 key 不得带汇总标记');
  assert.equal(noFold[0].deletedIds, undefined);
  assert.equal(noFold.some((row) => row.deletedSummary), false, '不折叠时不得出现任何汇总行');
});

test('U29c scopeUsage 收窄到一组 key（「已删除的 N 个 key」那一项）', () => {
  const usage = scopeFixture();
  const scoped = scopeUsage(usage, ['k_a', 'k_nope']);
  assert.equal(scoped.buckets.length, 2, '只保留组内存在的 key');
  assert.equal(scoped.total.requests, 10);
  assert.equal(scoped.by_key.length, 1, '组内只有一把有数据');
  assert.equal(scoped.by_key[0].key, 'k_a');
  // 一组 key 也走同一条重算路径 —— 不会因为「组」就漏掉某个维度
  assert.deepEqual(scoped.by_uid.map((r) => r.key), ['u1', 'u2']);
});

/** 消费者作用域用例的分桶 fixture（2 把真实 key + 1 组未鉴权历史桶）。 */
function scopeFixture() {
  return {
    window: '720h',
    degraded: false,
    buckets: [
      { slot: 'h:2026-09-24T10', realm: 'cn', uid: 'u1', model: 'm1', key: 'master', requests: 10, failed: 1, success: 9, prompt_tokens: 100, completion_tokens: 50, total_tokens: 150, cache_hit_tokens: 10, cache_miss_tokens: 40, cache_write_tokens: 5, credit: 1, avg_latency_ms: 100 },
      { slot: 'h:2026-09-24T10', realm: 'cn', uid: 'u2', model: 'm2', key: 'k_a', requests: 4, failed: 0, success: 4, prompt_tokens: 40, completion_tokens: 10, total_tokens: 50, cache_hit_tokens: 0, cache_miss_tokens: 0, cache_write_tokens: 0, credit: 0.5, avg_latency_ms: 200 },
      { slot: 'h:2026-09-24T11', realm: 'global', uid: 'u1', model: 'm1', key: 'k_a', requests: 6, failed: 2, success: 4, prompt_tokens: 60, completion_tokens: 20, total_tokens: 80, cache_hit_tokens: 20, cache_miss_tokens: 20, cache_write_tokens: 0, credit: 0.25, avg_latency_ms: 300 },
      { slot: 'h:2026-09-24T11', realm: 'cn', uid: '', model: '', key: '', requests: 3, failed: 0, success: 3, total_tokens: 9, credit: 0.1 },
    ],
    by_uid: [],
    by_realm: [],
    by_model: [],
    by_key: [
      { key: 'master', label: '主 key', requests: 10, failed: 1, total_tokens: 150, credit: 1 },
      { key: 'k_a', label: 'A', requests: 10, failed: 2, total_tokens: 130, credit: 0.75 },
      { key: '', label: '', requests: 3, failed: 0, total_tokens: 9, credit: 0.1 },
    ],
    total: { key: 'total', requests: 23, failed: 3, total_tokens: 289, credit: 1.85 },
  };
}


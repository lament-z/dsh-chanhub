// dsh-chanhub —— 配置写入 / 凭证读取 / 校验表的单元测试
//
// 覆盖三处风险最高、又无法靠渲染测试触达的逻辑：
//   1. config-spec 的 patch 校验（未知项 / 类型 / 时长 / 小时值）
//   2. gateway-config 的原子写与「写入会导致网关起不来」的 fail-fast 拦截
//   3. auths 的凭证解析（两种文件形态）与「绝不回传 token」

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, chmod, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

import {
  CONFIG_FIELDS,
  DURATION_PATTERN,
  coerceField,
  coercePatchTypes,
  fieldsByGroup,
  formatFieldValue,
  getPath,
  setPath,
  validatePatch,
} from '../lib/config-spec.js';
import { locateGatewayConfig, readGatewayConfig, writeGatewayConfig } from '../lib/gateway-config.js';
import { parseAuthFile, readAuthAccounts } from '../lib/auths.js';
import { ENDPOINTS, createHandler } from '../lib/index.js';
import { ChanhubClient } from '../lib/chanhub-client.js';

// ---------------------------------------------------------------------------
// A. 配置项规格表
// ---------------------------------------------------------------------------

test('A1 规格表恰好 51 项，且分组覆盖全部', () => {
  assert.equal(CONFIG_FIELDS.length, 51, 'inventory.md 的权威口径是 51 项（开学季下线后删去两项排程配置）');
  const grouped = fieldsByGroup();
  const total = grouped.reduce((sum, group) => sum + group.fields.length, 0);
  assert.equal(total, 51, '分组后不应丢项');
  // 各分组数量与 inventory.md §A 对齐
  const byId = Object.fromEntries(grouped.map((group) => [group.id, group.fields.length]));
  assert.equal(byId.pool, 12);
  assert.equal(byId.schedule, 11);
  assert.equal(byId.upstream, 10);
  assert.equal(byId.cooldown, 2);
  assert.equal(byId.session_sticky, 3);
  assert.equal(byId.global, 3);
  assert.equal(byId.prompt, 2);
  assert.equal(byId.upstash, 2);
  assert.equal(byId.features, 1);
  assert.equal(byId.admin, 1);
  assert.equal(byId.top, 4);
});

test('A2 默认展开池与排程两组（其余收起）', () => {
  const openIds = fieldsByGroup().filter((group) => group.openByDefault).map((group) => group.id);
  assert.deepEqual(openIds, ['pool', 'schedule']);
});

test('A3 时长正则对齐 Go time.ParseDuration', () => {
  for (const ok of ['30m', '600s', '2h', '1h30m', '10ms', '1.5h', '500µs', '1us', '1ns']) {
    assert.ok(DURATION_PATTERN.test(ok), `应接受 ${ok}`);
  }
  for (const bad of ['30', 'abc', '', '1h 30m', '-5m', 'h', '30minutes']) {
    assert.ok(!DURATION_PATTERN.test(bad), `应拒绝 ${JSON.stringify(bad)}`);
  }
});

test('A4 危险语义的四个「0」在表里被显式标注（配错不生效）', () => {
  const byPath = new Map(CONFIG_FIELDS.map((field) => [field.path, field]));
  // 这四项是 inventory.md 点名的「同名不同义」，必须都有 danger + note
  for (const path of [
    'pool.max_in_flight',
    'pool.max_in_flight_global',
    'pool.expiring_soon',
    'pool.cost_explore_interval',
    'schedule.activity_report_count',
  ]) {
    const field = byPath.get(path);
    assert.ok(field, `缺字段 ${path}`);
    assert.equal(field.danger, true, `${path} 必须标 danger`);
    assert.ok(field.note && field.note.length > 0, `${path} 必须有语义说明`);
  }
});

test('A5 restart 标记与网关真实热改面一致（drift 会让人误判要不要重启）', () => {
  const byPath = new Map(CONFIG_FIELDS.map((field) => [field.path, field]));
  // 热改面（internal/server/admin_config.go dispatchHotApply）
  assert.equal(byPath.get('pool.max_in_flight').restart, false, 'pool 有 setter，可热改');
  assert.equal(byPath.get('cooldown.soft_rate').restart, false);
  assert.equal(byPath.get('schedule.checkin_hours').restart, false, 'scheduler.Reconfigure 已接线');
  assert.equal(byPath.get('schedule.checkin_enabled').restart, false);
  assert.equal(byPath.get('prompt.mode').restart, false, 'prompt.mode 走逐请求读取面');
  assert.equal(byPath.get('api_key').restart, false);
  assert.equal(byPath.get('features.sanitize_blacklist_fingerprints').restart, false);
  // 不可热改：装配期捕获 / 无 setter
  assert.equal(byPath.get('pool.expiring_soon').restart, true, '网关没有 expiring_soon 的 setter');
  assert.equal(byPath.get('cooldown.soft_rate_max').restart, true);
  assert.equal(byPath.get('listen').restart, true, '装配期捕获');
  assert.equal(byPath.get('admin.enabled').restart, true);
  assert.equal(byPath.get('upstream.timeout_seconds').restart, true);
});

test('A6 coerceField 逐类型行为', () => {
  const byPath = new Map(CONFIG_FIELDS.map((field) => [field.path, field]));
  const intField = byPath.get('pool.max_in_flight');
  assert.deepEqual(coerceField(intField, '0'), { ok: true, value: 0 }, '0 是合法值（= 不限）');
  assert.equal(coerceField(intField, '1.5').ok, false);
  assert.equal(coerceField(intField, 'abc').ok, false);

  const floatField = byPath.get('pool.idle_weight_per_hour');
  assert.deepEqual(coerceField(floatField, '0.5'), { ok: true, value: 0.5 });

  const boolField = byPath.get('schedule.checkin_enabled');
  assert.deepEqual(coerceField(boolField, 'true'), { ok: true, value: true });
  assert.deepEqual(coerceField(boolField, 'false'), { ok: true, value: false });
  assert.equal(coerceField(boolField, 'yes').ok, false);

  const enumField = byPath.get('prompt.mode');
  assert.deepEqual(coerceField(enumField, 'append'), { ok: true, value: 'append' });
  assert.equal(coerceField(enumField, 'bogus').ok, false);

  const hoursField = byPath.get('schedule.checkin_hours');
  assert.deepEqual(coerceField(hoursField, '9, 21'), { ok: true, value: [9, 21] });
  assert.deepEqual(coerceField(hoursField, '[]'), { ok: true, value: [] }, '空数组 = 未配置（回落默认）');
  assert.equal(coerceField(hoursField, '24').ok, false);
  assert.equal(coerceField(hoursField, '-1').ok, false);
});

test('A7 formatFieldValue 回填输入框', () => {
  const byPath = new Map(CONFIG_FIELDS.map((field) => [field.path, field]));
  assert.equal(formatFieldValue(byPath.get('schedule.checkin_hours'), [9, 21]), '9, 21');
  assert.equal(formatFieldValue(byPath.get('pool.max_in_flight'), 3), '3');
  assert.equal(formatFieldValue(byPath.get('schedule.checkin_enabled'), true), 'true');
  assert.equal(formatFieldValue(byPath.get('pool.max_in_flight'), undefined), '');
});

test('A8 validatePatch 拒绝未知项，并产出需重启清单', () => {
  const bad = validatePatch({ 'pool.nope': 1 });
  assert.equal(bad.ok, false);
  assert.match(bad.errors[0].message, /未知配置项/);

  const badType = validatePatch({ 'pool.max_in_flight': 'abc' });
  assert.equal(badType.ok, false);
  assert.equal(badType.errors[0].path, 'pool.max_in_flight');

  const good = validatePatch({ 'pool.max_in_flight': '5', 'schedule.checkin_hours': '9,21' });
  assert.equal(good.ok, true);
  assert.deepEqual(good.values['pool.max_in_flight'], 5);
  assert.deepEqual(good.values['schedule.checkin_hours'], [9, 21]);
  assert.deepEqual(good.restartRequired, [], 'pool 与 schedule 都在热改面上');

  const mixed = validatePatch({ 'pool.max_in_flight': '5', 'listen': ':7866' });
  assert.deepEqual(mixed.restartRequired, ['listen'], '装配期字段仍需重启');
});

test('A9 getPath / setPath 点分路径', () => {
  const object = { pool: { max_in_flight: 3 } };
  assert.equal(getPath(object, 'pool.max_in_flight'), 3);
  assert.equal(getPath(object, 'pool.missing'), undefined);
  assert.equal(getPath(object, 'nope.deep.path'), undefined);
  setPath(object, 'schedule.checkin_hours', [9]);
  assert.deepEqual(object.schedule, { checkin_hours: [9] });
  setPath(object, 'pool.max_in_flight', 9);
  assert.equal(object.pool.max_in_flight, 9);
});

test('A10 coercePatchTypes 把输入框字符串收敛成网关要求的 JSON 类型', () => {
  // 真机现场：面板输入框交上来的是字符串，网关 normalize 是强类型的
  // （Go []int / int）→ merge 后校验期 400
  // 「cannot unmarshal string into Go struct field Schedule.schedule.cat_hours of type []int」，
  // 于是 hours/int/float 这些字段永远热改不了。收敛必须发生在送网关之前。
  const result = coercePatchTypes({
    'schedule.cat_hours': '0',
    'schedule.checkin_hours': '8, 21',
    'pool.max_in_flight': '4',
    'pool.idle_weight_per_hour': '0.5',
    'cooldown.soft_rate': '600s',
    'prompt.mode': 'append',
    'features.sanitize_blacklist_fingerprints': 'false',
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.values['schedule.cat_hours'], [0], 'hours 必须是数组，不是字符串');
  assert.deepEqual(result.values['schedule.checkin_hours'], [8, 21]);
  assert.equal(result.values['pool.max_in_flight'], 4);
  assert.equal(result.values['pool.idle_weight_per_hour'], 0.5);
  assert.equal(result.values['cooldown.soft_rate'], '600s');
  assert.equal(result.values['prompt.mode'], 'append');
  assert.equal(result.values['features.sanitize_blacklist_fingerprints'], false);

  // 表外路径原样透传（认不认由网关决定，保住前向兼容）。
  const forward = coercePatchTypes({ 'logs.enabled': true, 'whatever.key': 'x' });
  assert.equal(forward.ok, true);
  assert.deepEqual(forward.values, { 'logs.enabled': true, 'whatever.key': 'x' });

  // 表内字段值不合法 → 宿主侧拦下（附字段名，便于面板/日志定位）。
  const bad = coercePatchTypes({ 'pool.max_in_flight': 'abc', 'schedule.cat_hours': '24,1' });
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.errors.map((item) => item.path), ['pool.max_in_flight', 'schedule.cat_hours']);
  assert.match(bad.errors[1].message, /0–23/);

  // 已是目标类型 → 幂等（宿主收敛后重跑不出错）。
  const idempotent = coercePatchTypes({ 'schedule.cat_hours': [0], 'pool.max_in_flight': 4 });
  assert.deepEqual(idempotent.values, { 'schedule.cat_hours': [0], 'pool.max_in_flight': 4 });
});

// ---------------------------------------------------------------------------
// B. 网关配置写入
// ---------------------------------------------------------------------------

/**
 * 造一个临时 config.json。
 * @param content - 初始内容。
 * @returns `{dir, path}`。
 */
async function tempConfig(content) {
  const dir = await mkdtemp(join(tmpdir(), 'dshc-cfg-'));
  const path = join(dir, 'config.json');
  await writeFile(path, JSON.stringify(content, null, 2), 'utf8');
  return { dir, path };
}

test('B1 读取网关配置并保留未知字段', async (t) => {
  const { dir, path } = await tempConfig({
    api_key: 'k',
    pool: { max_in_flight: 3 },
    future_field: { from_newer_version: true },
  });
  t.after(() => rm(dir, { recursive: true, force: true }));

  const result = await readGatewayConfig({ gatewayConfigPath: path }, {});
  assert.equal(result.ok, true);
  assert.equal(result.path, path);
  assert.equal(result.writable, true);
  assert.equal(result.config.pool.max_in_flight, 3);
  assert.deepEqual(result.config.future_field, { from_newer_version: true });
});

test('B2 写入是原子的，且只改 patch 涉及的路径（未知字段原样保留）', async (t) => {
  const { dir, path } = await tempConfig({
    api_key: 'k',
    pool: { max_in_flight: 3, breaker_threshold: 3 },
    future_field: 1,
  });
  t.after(() => rm(dir, { recursive: true, force: true }));

  const written = await writeGatewayConfig({ gatewayConfigPath: path }, {}, { 'pool.max_in_flight': 7 });
  assert.equal(written.ok, true);
  assert.deepEqual(written.applied, [{ path: 'pool.max_in_flight', before: 3, after: 7 }]);
  // 降级路径（文件直写）一次都热改不了：写盘成功 ≠ 生效，全部如实标需重启。
  assert.equal(written.viaGateway, false);
  assert.deepEqual(written.hotApplicable, [], '文件直写没有热应用');
  assert.deepEqual(written.restartRequired, ['pool.max_in_flight']);
  assert.equal(written.restartRequiredCount, 1);
  assert.deepEqual(written.hotCapable, ['pool.max_in_flight'], '端点可用时本可热改（修复方向）');

  const onDisk = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(onDisk.pool.max_in_flight, 7);
  assert.equal(onDisk.pool.breaker_threshold, 3, '同段其他键不能被覆盖');
  assert.equal(onDisk.api_key, 'k', '其他段不能被覆盖');
  assert.equal(onDisk.future_field, 1, '未知字段必须保留（前向兼容）');

  // 临时文件不应残留
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(dir);
  assert.deepEqual(entries, ['config.json'], `不应残留临时文件，实际：${JSON.stringify(entries)}`);
});

test('B3 拒绝会令网关起不来的写入（admin.enabled=true 且 api_key 空）', async (t) => {
  const { dir, path } = await tempConfig({ api_key: '', admin: { enabled: false } });
  t.after(() => rm(dir, { recursive: true, force: true }));

  const written = await writeGatewayConfig({ gatewayConfigPath: path }, {}, { 'admin.enabled': true });
  assert.equal(written.ok, false);
  assert.equal(written.code, 'startup-would-fail');
  assert.match(written.message, /拒绝启动/);

  // 关键：文件必须没被动过
  const onDisk = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(onDisk.admin.enabled, false, '被拒绝的写入绝不能落盘');
});

test('B4 admin.enabled=true 且 api_key 非空 → 允许写入', async (t) => {
  const { dir, path } = await tempConfig({ api_key: 'secret', admin: { enabled: false } });
  t.after(() => rm(dir, { recursive: true, force: true }));
  const written = await writeGatewayConfig({ gatewayConfigPath: path }, {}, { 'admin.enabled': true });
  assert.equal(written.ok, true);
  assert.equal(JSON.parse(await readFile(path, 'utf8')).admin.enabled, true);
});

test('B5 只读 config.json 时明确报 config-readonly 并给出挂载指引', async (t) => {
  const { dir, path } = await tempConfig({ pool: { max_in_flight: 3 } });
  t.after(async () => {
    await chmod(path, 0o600);
    await rm(dir, { recursive: true, force: true });
  });
  await chmod(path, 0o444);

  const located = await locateGatewayConfig({ gatewayConfigPath: path }, {});
  assert.equal(located.found, true);
  assert.equal(located.writable, false);
  assert.match(located.reason, /:ro/, '必须提示容器只读挂载这一常见原因');

  const written = await writeGatewayConfig({ gatewayConfigPath: path }, {}, { 'pool.max_in_flight': 5 });
  assert.equal(written.ok, false);
  assert.equal(written.code, 'config-readonly');
  assert.equal(JSON.parse(await readFile(path, 'utf8')).pool.max_in_flight, 3, '只读时不得改动');
});

test('B6 路径不存在时报 config-not-found 并列出候选路径', () => {
  // 必须在子进程里跑并清空 HOME：默认探测会命中本机真实存在的 config.json
  // （`<home>/Desktop/others/workbuddy2api-panel/conf/config.json`），
  // 那样就测不到「全都找不到」这条分支了。
  const script = `
    const { readGatewayConfig } = await import(${JSON.stringify(resolve(here, '../lib/gateway-config.js'))});
    const missing = process.env.PROBE_MISSING;
    const read = await readGatewayConfig({ gatewayConfigPath: missing }, {});
    process.stdout.write(JSON.stringify(read));
  `;
  const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    env: { ...process.env, HOME: '/tmp/dshc-empty-home-for-test', DSH_CHANHUB_DIR: '', PROBE_MISSING: '/tmp/dshc-definitely-missing/config.json' },
    encoding: 'utf8',
  });
  const read = JSON.parse(output);
  assert.equal(read.ok, false);
  assert.equal(read.code, 'config-not-found');
  assert.ok(Array.isArray(read.candidates) && read.candidates.length > 0, '必须给出候选路径供用户排查');
  assert.ok(
    read.candidates.includes('/tmp/dshc-definitely-missing/config.json'),
    '显式配置的路径应排在候选中',
  );
  assert.equal(read.candidates[0], '/tmp/dshc-definitely-missing/config.json', '显式路径必须排第一');
});

test('B7 校验失败的 patch 不落盘', async (t) => {
  const { dir, path } = await tempConfig({ pool: { max_in_flight: 3 } });
  t.after(() => rm(dir, { recursive: true, force: true }));

  const written = await writeGatewayConfig({ gatewayConfigPath: path }, {}, { 'pool.max_in_flight': 'abc' });
  assert.equal(written.ok, false);
  assert.equal(written.code, 'validation-failed');
  assert.equal(JSON.parse(await readFile(path, 'utf8')).pool.max_in_flight, 3);
});

test('B8 空 patch 与非法 patch 被拒绝', async (t) => {
  const { dir, path } = await tempConfig({ pool: {} });
  t.after(() => rm(dir, { recursive: true, force: true }));
  assert.equal((await writeGatewayConfig({ gatewayConfigPath: path }, {}, {})).code, 'bad-request');
  assert.equal((await writeGatewayConfig({ gatewayConfigPath: path }, {}, null)).code, 'bad-request');
  assert.equal((await writeGatewayConfig({ gatewayConfigPath: path }, {}, [])).code, 'bad-request');
});

test('B9 降级直写如实汇报：全部需重启 + 带上网关失败原因 + hotCapable 修复方向', async (t) => {
  const { dir, path } = await tempConfig({ pool: { max_in_flight: 3 }, schedule: { checkin_hours: [9, 21] } });
  t.after(() => rm(dir, { recursive: true, force: true }));

  const written = await writeGatewayConfig(
    { gatewayConfigPath: path },
    {},
    { 'pool.max_in_flight': 5, 'schedule.checkin_hours': [5] },
    { gatewayError: { code: 'internal', message: '网关拒绝请求（HTTP 500）：rename config: device or resource busy' } },
  );
  assert.equal(written.ok, true);
  assert.equal(written.viaGateway, false);
  // 两个字段在网关热改面上，但降级路径没通知网关 → 全部需重启，不能谎报「即时生效」。
  assert.deepEqual(written.hotApplicable, []);
  assert.equal(written.restartRequiredCount, 2);
  assert.deepEqual(written.hotCapable, ['pool.max_in_flight', 'schedule.checkin_hours']);
  assert.match(written.gatewayError.message, /device or resource busy/, '必须透出网关失败原因');
  assert.match(written.note, /热生效端点不可用/, 'note 要说清为什么全都需重启');
  assert.match(written.note, /device or resource busy/);
  // 写盘本身成功（文件确实改了）。
  const onDisk = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(onDisk.pool.max_in_flight, 5);
  assert.deepEqual(onDisk.schedule.checkin_hours, [5]);
});

test('B10 saveConfig 送网关前收敛类型（真机 400 cannot unmarshal string into []int 的回归锁）', async (t) => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: init?.body === undefined ? undefined : JSON.parse(init.body) });
    return new Response(
      JSON.stringify({
        ok: true,
        path: '/app/config.json',
        applied: ['schedule.cat_hours', 'pool.max_in_flight'],
        hot_applied: ['schedule.cat_hours', 'pool.max_in_flight'],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const config = { baseURL: 'http://127.0.0.1:1', apiKey: 'k', gatewayConfigPath: '/tmp/dshc-not-used.json' };
  const handle = createHandler({
    client: new ChanhubClient({ resolveConfig: () => config }),
    resolveConfig: () => config,
    readSettings: () => ({}),
  });

  // 面板交上来的就是这个形状：全是字符串。
  const result = await handle(ENDPOINTS.saveConfig, {
    patch: { 'schedule.cat_hours': '0', 'pool.max_in_flight': '4' },
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.value.viaGateway, true, '必须走网关热生效路径，而不是降级直写');

  const sent = calls.find((call) => call.url.includes('/admin/config'));
  assert.ok(sent, '必须打网关 /admin/config');
  assert.deepEqual(
    sent.body.patch,
    { 'schedule.cat_hours': [0], 'pool.max_in_flight': 4 },
    '送网关的必须是收敛后的 JSON 类型，否则网关强类型 normalize 会 400',
  );
});

test('B11 saveConfig 值不合法时宿主侧拦下：不打网关、不写盘、逐字段报错', async (t) => {
  let gatewayCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    gatewayCalls += 1;
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const { dir, path } = await tempConfig({ pool: { max_in_flight: 3 } });
  t.after(() => rm(dir, { recursive: true, force: true }));

  const config = { baseURL: 'http://127.0.0.1:1', apiKey: 'k', gatewayConfigPath: path };
  const handle = createHandler({
    client: new ChanhubClient({ resolveConfig: () => config }),
    resolveConfig: () => config,
    readSettings: () => ({}),
  });

  const result = await handle(ENDPOINTS.saveConfig, { patch: { 'pool.max_in_flight': 'abc' } });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'validation-failed');
  assert.match(result.error.message, /pool\.max_in_flight/);
  assert.equal(gatewayCalls, 0, '值不合法就别打网关');
  assert.equal(JSON.parse(await readFile(path, 'utf8')).pool.max_in_flight, 3, '也不许写盘');
});

test('B12 saveConfig 的 patch 类型收敛对 bool / hours 都生效（面板控件两类形态）', async (t) => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: init?.body === undefined ? undefined : JSON.parse(init.body) });
    return new Response(JSON.stringify({ ok: true, applied: [], hot_applied: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const config = { baseURL: 'http://127.0.0.1:1', apiKey: 'k', gatewayConfigPath: '/tmp/dshc-not-used.json' };
  const handle = createHandler({
    client: new ChanhubClient({ resolveConfig: () => config }),
    resolveConfig: () => config,
    readSettings: () => ({}),
  });

  await handle(ENDPOINTS.saveConfig, {
    patch: {
      'schedule.checkin_enabled': 'false',
      'schedule.checkin_hours': '8, 21',
      'features.sanitize_blacklist_fingerprints': 'true',
    },
  });
  const sent = calls.find((call) => call.url.includes('/admin/config'));
  assert.deepEqual(sent.body.patch, {
    'schedule.checkin_enabled': false,
    'schedule.checkin_hours': [8, 21],
    'features.sanitize_blacklist_fingerprints': true,
  });
});

// ---------------------------------------------------------------------------
// C. 凭证读取（渠道判定的唯一来源）
// ---------------------------------------------------------------------------
test('C1 解析嵌套形凭证（{auth, account}）', () => {
  const info = parseAuthFile(
    JSON.stringify({
      auth: { realm: 'cn', channel: 'traework', domain: 'trae.cn', expiresAt: 1792400213, accessToken: 'SECRET_TOKEN', refreshToken: 'REFRESH' },
      account: { uid: 'u-1', nickname: '甲', enterpriseId: 'e-1' },
    }),
    'fallback',
  );
  assert.equal(info.uid, 'u-1');
  assert.equal(info.nickname, '甲');
  assert.equal(info.channel, 'traework');
  assert.equal(info.domain, 'trae.cn');
  assert.equal(info.expiresAt, 1792400213);
  assert.equal(info.hasAccessToken, true);
  assert.equal(info.hasRefreshToken, true);
  // 安全：绝不带出 token 本体
  assert.ok(!('accessToken' in info) && !('refreshToken' in info), '凭证结构里不能出现 token 字段');
  assert.ok(!JSON.stringify(info).includes('SECRET_TOKEN'), 'token 明文绝不能出现在返回值里');
});

test('C2 解析扁平形凭证（顶层字段）', () => {
  const info = parseAuthFile(
    JSON.stringify({ uid: 'u-2', nickname: '乙', realm: 'cn', domain: 'qoder.com', accessToken: 'A' }),
    'fallback',
  );
  assert.equal(info.uid, 'u-2');
  assert.equal(info.nickname, '乙');
  assert.equal(info.domain, 'qoder.com');
  assert.equal(info.channel, '', '扁平形没有 channel → 空串，交由推断');
  assert.equal(info.hasAccessToken, true);
  assert.equal(info.hasRefreshToken, false);
});

test('C3 文件内无 uid 时用文件名兜底；坏 JSON 返回 undefined', () => {
  const info = parseAuthFile(JSON.stringify({ auth: { domain: 'x' } }), 'uid-from-name');
  assert.equal(info.uid, 'uid-from-name');
  assert.equal(parseAuthFile('{not json', 'x'), undefined);
  assert.equal(parseAuthFile('null', 'x'), undefined);
});

test('C4 真实列表读取：只认 workbuddy*.json，且跳过坏文件', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'dshc-auths-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await writeFile(join(dir, 'workbuddy-uid-a.json'), JSON.stringify({ account: { uid: 'uid-a', nickname: '甲' }, auth: { domain: 'www.codebuddy.cn', accessToken: 'x' } }));
  await writeFile(join(dir, 'workbuddy-uid-b.json'), JSON.stringify({ account: { uid: 'uid-b' }, auth: { channel: 'qoder', accessToken: 'y' } }));
  await writeFile(join(dir, 'workbuddy-broken.json'), '{bad json');
  await writeFile(join(dir, 'unrelated.json'), JSON.stringify({ account: { uid: 'nope' } }));

  const result = await readAuthAccounts({}, { authDir: dir });
  assert.equal(result.ok, true);
  assert.equal(result.dir, dir);
  const uids = result.accounts.map((account) => account.uid).sort();
  assert.deepEqual(uids, ['uid-a', 'uid-b'], 'unrelated.json 必须被忽略');
  assert.equal(result.failed.length, 1, '坏文件要如实报告而不是静默丢弃');
  assert.match(result.failed[0].file, /broken/);
  assert.ok(!JSON.stringify(result).includes('"x"'), 'token 值不得外泄');
});

test('C5 目录不存在时给出明确原因与候选路径', () => {
  // 同 B6：必须在清空 HOME 的子进程里跑，否则会命中本机真实的 auths 目录。
  const script = `
    const { readAuthAccounts } = await import(${JSON.stringify(resolve(here, '../lib/auths.js'))});
    const result = await readAuthAccounts({}, { authDir: process.env.PROBE_AUTHDIR });
    process.stdout.write(JSON.stringify(result));
  `;
  const output = execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    env: { ...process.env, HOME: '/tmp/dshc-empty-home-for-test', DSH_CHANHUB_DIR: '', PROBE_AUTHDIR: '/tmp/dshc-definitely-missing/auths' },
    encoding: 'utf8',
  });
  const result = JSON.parse(output);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'auth-dir-not-found');
  assert.ok(result.candidates.includes('/tmp/dshc-definitely-missing/auths'));
  assert.match(result.message, /同机/, '必须说明这是同机限制');
});

test('C6 真实本机凭证目录可读（有则验证，无则跳过）', async (t) => {
  const candidates = [
    join(process.env.HOME ?? '', 'Desktop', 'others', 'workbuddy2api-panel', 'auths'),
    join(process.env.HOME ?? '', 'Desktop', 'DSHworkspace', 'plugins', 'chanhub', 'auths'),
  ];
  let found;
  for (const candidate of candidates) {
    try {
      await mkdir(candidate, { recursive: true });
      const probe = await readAuthAccounts({}, { authDir: candidate });
      if (probe.ok && probe.accounts.length > 0) {
        found = probe;
        break;
      }
    } catch {
      // 继续
    }
  }
  if (!found) {
    t.skip('本机没有可读的 auths 目录，跳过真机凭证验证');
    return;
  }
  assert.ok(found.accounts.length > 0);
  for (const account of found.accounts) {
    assert.ok(typeof account.uid === 'string' && account.uid.length > 0);
    assert.equal(typeof account.domain, 'string');
    assert.equal(typeof account.channel, 'string');
    assert.ok(!JSON.stringify(account).includes('accessToken'));
  }
});

// ---------------------------------------------------------------------------
// D. 渠道解析（/status 原生 channel 优先，auth 文件推断为旧网关回退）
// ---------------------------------------------------------------------------

import { channelResolver, resolveChannel } from '../client/derive.js';

test('D1 channelResolver 优先用 /status 自带的 channel', () => {
  const resolver = channelResolver([]); // 不给 auth 文件
  assert.equal(resolver({ uid: 'u1', channel: 'traework' }), 'traework');
  assert.equal(resolver({ uid: 'u2', channel: 'qoder' }), 'qoder');
  // /status 没给（旧网关）→ 走 auth 文件映射
  const withFiles = channelResolver([{ uid: 'u3', channel: '', domain: 'trae.cn' }]);
  assert.equal(withFiles({ uid: 'u3' }), 'traework');
  // 都没有 → 默认 workbuddy（与后端 ChannelDefault 同值）
  assert.equal(withFiles({ uid: 'u9' }), 'workbuddy');
});

test('D2 resolveChannel 与后端 auth.ResolveChannel 同规则', () => {
  assert.equal(resolveChannel('', 'www.codebuddy.cn'), 'workbuddy');
  assert.equal(resolveChannel('', 'trae.cn'), 'traework');
  assert.equal(resolveChannel('', 'mchost.guru'), 'traework');
  assert.equal(resolveChannel('', 'qoder.com'), 'qoder');
  assert.equal(resolveChannel('qoder', 'trae.cn'), 'qoder', '显式声明优先');
  assert.equal(resolveChannel('bogus', 'trae.cn'), 'workbuddy', '未知显式值回落默认（不猜）');
});

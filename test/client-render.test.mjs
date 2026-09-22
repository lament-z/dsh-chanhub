// dsh-chanhub —— 客户端真机渲染测试（jsdom + 真实 React，含 effect 与状态）
//
// 为什么必须做真实渲染：原骨架的测试只断言 JSON 字段，结果一个「面板完全不可用」
// 的缺陷能全绿通过。本测试把**打包产物** client/client.js 挂进最小
// window.__ModuleLoader__ 垫片，用 jsdom + 真实 react-dom 挂载，
// 走完真实的 effect（数据加载）后再断言真实 DOM。
//
// 用 react-dom/server 不行：renderToStaticMarkup 不跑 useEffect，
// 面板永远停在「加载中」—— 那样断言不到任何数据相关的内容。

import test from 'node:test';
// 直接引用调色板：这样「UI 色 = channelPalette(id)」是同源断言，不是在测试里抄字面量
import { channelPalette } from '../client/derive.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

// 渲染验证依赖从临时目录解析（插件本身不依赖 React —— 那是宿主提供的）
const REACT_DIR = process.env.DSHC_REACT_DIR ?? '/tmp/dshc-render';
const require = createRequire(`${REACT_DIR}/index.js`);

// React 19 的 act() 需要这个标志，否则打印「not configured to support act」并跳过刷新。
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let React;
let ReactDOM;
let ReactDOMClient;
let JSDOM;
try {
  React = require('react');
  ReactDOM = require('react-dom');
  ReactDOMClient = require('react-dom/client');
  ({ JSDOM } = require('jsdom'));
} catch (error) {
  test('客户端渲染', { skip: `渲染验证需要 react/react-dom/jsdom（${REACT_DIR}）：${error.message}` }, () => {});
}

const canRender = Boolean(React && ReactDOMClient && JSDOM);

/**
 * 加载打包产物，执行 __ModuleLoader__ 的 factory，拿到模块导出。
 *
 * 关键：`window` 参数必须是**真实的 jsdom window**（`__ModuleLoader__` 挂在它上面）。
 * 若传一个独立的 shim 对象，bundle 里的 `window.confirm` 等就会落到 shim 上，
 * 而真实浏览器里二者是同一个对象 —— 那样测出来的行为是假的。
 *
 * @param windowObject - jsdom window。
 * @returns `{registration}`。
 */
function loadBundle(windowObject) {
  const source = readFileSync(resolve(root, 'client/client.js'), 'utf8');
  const registration = { id: undefined, factory: undefined };
  windowObject.__ModuleLoader__ = {
    load: ({ id, factory }) => {
      registration.id = id;
      registration.factory = factory;
    },
  };
  // 打包产物是 CJS 形态、由 loader 提供 require("react")
  const fn = new Function('window', 'module', 'exports', 'require', `${source}\nreturn module.exports;`);
  fn(windowObject, { exports: {} }, {}, (id) => {
    if (id === 'react') return React;
    // 侧边栏 popover 必须 createPortal 到 body（侧边栏会裁剪子内容）——
    // 宿主 loader 本来就提供 react-dom（外部插件 dsh-better-sidebar 同样 require 它）。
    if (id === 'react-dom') return ReactDOM;
    throw new Error(`unexpected require(${JSON.stringify(id)})`);
  });
  return { registration };
}

/**
 * 取到 apply() 注册的面板组件。
 * @param rpcCall - RPC 桩。
 * @param windowObject - jsdom window。
 * @returns 组件函数。
 */
function applyBundle(rpcCall, windowObject, ctxExtra = {}) {
  const { registration } = loadBundle(windowObject);
  assert.equal(registration.id, 'dsh-chanhub', 'bundle 的 loaderId 必须与包名一致');
  const mod = registration.factory((id) => {
    if (id === 'react') return React;
    if (id === 'react-dom') return ReactDOM;
    throw new Error(`unexpected require(${JSON.stringify(id)})`);
  });
  assert.equal(typeof mod.apply, 'function');

  // 按槽名收集注册：同一插件现在注册两个槽（settings.section + sidebar.footer.action）。
  const registrations = new Map();
  const metas = [];
  mod.apply({
    connection: { rpc: { call: rpcCall } },
    slots: {
      inject: (_name, fn) => fn(),
      register: (meta, component) => {
        registrations.set(meta.name, { meta, component });
        metas.push(meta);
      },
    },
    ...ctxExtra,
  });
  return { mod, registrations, metas };
}

/**
 * 取到 apply() 注册的面板组件（settings.section）。
 * @param rpcCall - RPC 桩。
 * @param windowObject - jsdom window。
 * @param ctxExtra - 额外注入的宿主服务（settingsScope 等）。
 * @returns 组件函数。
 */
function registeredComponent(rpcCall, windowObject, ctxExtra) {
  const { registrations } = applyBundle(rpcCall, windowObject, ctxExtra);
  const panel = registrations.get('settings.section')?.component;
  assert.equal(typeof panel, 'function', 'apply 必须注册面板组件');
  return panel;
}

/**
 * 取到 apply() 注册的侧边栏入口组件（sidebar.footer.action）。
 * @param rpcCall - RPC 桩。
 * @param windowObject - jsdom window。
 * @returns `{component, meta}`。
 */
function registeredQuickEntry(rpcCall, windowObject) {
  const { registrations } = applyBundle(rpcCall, windowObject);
  const entry = registrations.get('sidebar.footer.action');
  assert.ok(entry, 'apply 必须注册 sidebar.footer.action');
  assert.equal(entry.meta.id, 'chanhub-quick', '槽 id 必须有（list 槽靠它去重）');
  return entry;
}

/**
 * 真实挂载面板（jsdom + 真实 react-dom），等 effect 完成。
 * @param rpcCall - RPC 桩。
 * @returns `{html, cleanup, document, window}`。
 */
async function mount(rpcCall, options = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    pretendToBeVisual: true,
    // 给一个真实 origin：jsdom 的 localStorage 在 opaque origin 上会抛
    // 「localStorage is not available for opaque origins」，而 SWR 缓存
    // 恰好要走它。宿主里面板本来就跑在 http(s) origin 上 —— 这里对齐。
    url: 'http://127.0.0.1:7866/',
  });
  const { window } = dom;

  // 可选：模拟系统「减少动态效果」。jsdom 默认没有 matchMedia，而数字动效的
  // 可访问性分支与「动效失败兜底」都依赖它 —— 不注入就测不到那两条路径。
  if (options.reducedMotion === true) {
    window.matchMedia = (query) => ({
      matches: String(query).includes('prefers-reduced-motion'),
      media: String(query),
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() { return false; },
    });
  }

  // 面板用到 document / window.confirm / setInterval。挂在 global 上让组件可见。
  const saved = captureGlobals(['document', 'window', 'HTMLElement', 'Node', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout']);
  globalThis.document = window.document;
  globalThis.window = window;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
  window.confirm = () => true;
  window.prompt = () => '';

  const Registered = registeredComponent(rpcCall, window);
  const container = window.document.getElementById('app');

  let root;
  await React.act(async () => {
    root = ReactDOMClient.createRoot(container);
    root.render(React.createElement(Registered, { rpcCall }));
  });
  // 再等一轮，让 refresh() 里的 Promise.all 落地
  await React.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  const html = container.innerHTML;
  const cleanup = async () => {
    try {
      await React.act(async () => root.unmount());
    } catch {}
    restoreGlobals(saved);
    dom.window.close();
  };
  return { html, cleanup, document: window.document, window };
}

/** 暂存被覆盖的全局变量。 */
function captureGlobals(names) {
  return names.map((key) => ({ key, had: key in globalThis, value: globalThis[key] }));
}

/** 还原全局变量。 */
function restoreGlobals(saved) {
  for (const entry of saved) {
    if (entry.had) globalThis[entry.key] = entry.value;
    else delete globalThis[entry.key];
  }
}

/** 真实网关快照（脱敏，形状来自本机 :7866 实测）。 */
function realStatusFixture() {
  return {
    accounts: [
      {
        uid: 'uid-1',
        nickname: '甲',
        credits: 2880,
        credits_total: 3120,
        cooling: false,
        until: '0001-01-01T00:00:00Z',
        realm: 'cn',
        disabled: false,
        manual_disabled: false,
        success_count: 662,
        err_total: 3,
        last_success: new Date(Date.now() - 120000).toISOString(),
        last_err: '0001-01-01T00:00:00Z',
        in_flight: 0,
        consecutive_fails: 0,
        breaker_fails: 0,
        breaker_until: '0001-01-01T00:00:00Z',
        degrade_until: '0001-01-01T00:00:00Z',
        model_costs: [
          { model: 'deepseek-v4.1-flash', cost_per_1k: 0.000402, samples: 341, last_seen: new Date().toISOString() },
        ],
        token_usage: {
          request_count: 665,
          usage_count: 662,
          prompt_tokens: 1000,
          completion_tokens: 200,
          total_tokens: 1200,
          last_latency_ms: 6700,
          last_tokens_per_second: 155.37,
          last_model: 'cn:deepseek-v4.1-flash',
        },
      },
      {
        uid: 'uid-2',
        nickname: '手动停用的号',
        credits: 10,
        credits_total: 100,
        cooling: false,
        realm: 'cn',
        disabled: true,
        manual_disabled: true,
        manual_reason: '运维手动摘除',
        disabled_reason: '连续失败',
        success_count: 5,
        err_total: 9,
        last_success: '0001-01-01T00:00:00Z',
        last_err: new Date(Date.now() - 60000).toISOString(),
        in_flight: 2,
        consecutive_fails: 4,
        breaker_fails: 2,
        breaker_until: new Date(Date.now() + 600000).toISOString(),
        degrade_until: '0001-01-01T00:00:00Z',
      },
      {
        uid: 'uid-3',
        nickname: '冷却中的号',
        credits: 500,
        credits_total: 500,
        cooling: true,
        cool_kind: 'soft_rate',
        cool_remaining_sec: 3661,
        realm: 'cn',
        disabled: false,
        manual_disabled: false,
        success_count: 1,
        err_total: 1,
        last_success: new Date().toISOString(),
        last_err: '0001-01-01T00:00:00Z',
        in_flight: 0,
        consecutive_fails: 0,
        breaker_fails: 0,
      },
    ],
    total: 3,
    healthy: 1,
    cooling: 1,
    disabled: 1,
    in_flight_full: 0,
    realm_totals: {
      cn: { total: 3, healthy: 1, cooling: 1, disabled: 1, in_flight_full: 0 },
      global: { total: 0, healthy: 0, cooling: 0, disabled: 0, in_flight_full: 0 },
    },
    sticky_sessions: 4,
    redis_mode: 'noop',
  };
}

/**
 * 用量分桶 fixture：**三账号 × 两模型 × 三槽**。
 *
 * 为什么必须是这个形状：旧实现把 (槽 × 账号 × 模型) 的**行**当柱子渲染，
 * 单账号单模型的 fixture 恰好「行数 === 槽数」，根本测不出这个缺陷。
 * 这里 8 行 → 3 槽，是能抓到回归的最小形状。
 */
function usageFixture() {
  const rows = [];
  const uids = ['uid-1', 'uid-2', 'uid-3'];
  const models = ['cn:glm-5.2', 'cn:glm-5.2-air'];
  // 槽覆盖多天且量级递增：热力图的分位色阶需要「有梯度的分布」才测得出
  // （若全部落在同一天，只会有一个档位，断言就失去意义）。
  const slots = [
    'd:2026-09-17',                // 日槽：最早
    'd:2026-09-18',                // 日槽
    'h:2026-09-19T17',             // 小时槽（近 48h）
    'h:2026-09-19T18',
    'h:2026-09-20T09',
    'h:2026-09-21T10',
  ];
  let step = 0;
  for (const slot of slots) {
    step += 1;
    for (const uid of uids) {
      for (const model of models) {
        rows.push({
          slot, realm: 'cn', uid, model,
          requests: step, failed: uid === 'uid-2' && step > 1 ? 1 : 0, streaming: 1,
          prompt_tokens: 100, completion_tokens: 50, total_tokens: 150,
          credit: 0.25, avg_latency_ms: 300, last_seen: new Date().toISOString(),
        });
      }
    }
  }
  return {
    enabled: true,
    window: '72h0m0s',
    degraded: false,
    now: new Date().toISOString(),
    // 6 槽 × 3 账号 × 2 模型，请求数 1..6 递增 → 合计 126；失败数同步
    total: { key: 'total', requests: 126, success: 117, failed: 9, prompt_tokens: 12600, completion_tokens: 6300, total_tokens: 18900, credit: 31.5, avg_latency_ms: 300 },
    buckets: rows,
    by_uid: [
      { key: 'uid-1', requests: 12, success: 12, failed: 0, prompt_tokens: 1200, completion_tokens: 600, total_tokens: 1800, credit: 3, avg_latency_ms: 300 },
      { key: 'uid-2', requests: 6, success: 0, failed: 6, prompt_tokens: 600, completion_tokens: 300, total_tokens: 900, credit: 1.5, avg_latency_ms: 300 },
      { key: 'uid-3', requests: 6, success: 6, failed: 0, prompt_tokens: 600, completion_tokens: 300, total_tokens: 900, credit: 1.5, avg_latency_ms: 300 },
    ],
    by_realm: [{ key: 'cn', requests: 24, success: 18, failed: 6, total_tokens: 3600, credit: 6, avg_latency_ms: 300 }],
    by_model: [
      { key: 'cn:glm-5.2', requests: 18, success: 14, failed: 4, total_tokens: 2700, credit: 4.5, avg_latency_ms: 300 },
      { key: 'cn:glm-5.2-air', requests: 6, success: 4, failed: 2, total_tokens: 900, credit: 1.5, avg_latency_ms: 300 },
    ],
    note: '分桶为进程内聚合（重启清零）。',
  };
}

/** 进程累计 fixture（/v1/stats）—— 与窗口分桶是**不同口径**，用于验证分区标注。 */
function statsFixture() {
  return {
    enabled: true,
    since: '2026-09-21T08:00:00Z',
    now: new Date().toISOString(),
    uptime_sec: 11520,
    total: {
      model: 'total', requests: 40, success: 38, failed: 2, streaming: 16,
      avg_ttfb_ms: 840, avg_latency_ms: 1200, tokens_per_sec: 62.4,
      prompt_tokens: 8200, completion_tokens: 1800, total_tokens: 10000,
      cache_hit_tokens: 5600, cache_miss_tokens: 2600, cache_write_tokens: 0,
      cache_hit_rate: 0.68, credit: 26.96, credit_per_req: 0.674,
    },
    models: [
      {
        model: 'global:deepseek-chat', requests: 30, success: 29, failed: 1, streaming: 12,
        avg_ttfb_ms: 840, avg_latency_ms: 1200, tokens_per_sec: 62.4,
        prompt_tokens: 6000, completion_tokens: 1400, total_tokens: 7400,
        cache_hit_tokens: 4000, cache_miss_tokens: 2000, cache_write_tokens: 0,
        cache_hit_rate: 0.667, credit: 20.22, credit_per_req: 0.674, credits: 'x0.06',
        last_seen: new Date().toISOString(),
      },
      {
        model: 'cn:glm-5.2', requests: 10, success: 9, failed: 1, streaming: 4,
        avg_ttfb_ms: 0, avg_latency_ms: 900, tokens_per_sec: 40,
        prompt_tokens: 2200, completion_tokens: 400, total_tokens: 2600,
        cache_hit_tokens: 0, cache_miss_tokens: 0, cache_write_tokens: 0,
        cache_hit_rate: 0, credit: 6.74, credit_per_req: 0.674,
        // 倍率缺失：必须显示 —，绝不显示 x0.00
        last_seen: new Date().toISOString(),
      },
    ],
  };
}

/** 构造一个按 endpoint 返回固定数据的 rpcCall。 */
function fakeRpc(status) {
  const calls = [];
  const rpc = async (endpoint, payload) => {
    calls.push({ endpoint, payload });
    switch (endpoint) {
      // 面板刷新打 refreshStatus（网关侧先重取余额写回池，再返回 status）。
      // 形状与 getStatus 同，多一个 refreshed:true（表示余额已同上游对齐）。
      case 'refreshStatus':
      case 'getStatus':
        return {
          ok: true,
          value: {
            reachable: true,
            baseURL: 'http://127.0.0.1:7866',
            // probe.features.admin/tasks=true → admin 端点在场（成长码写按钮与批量任务可渲染）。
            probe: { reachable: true, features: { admin: true, tasks: true, stats: false, usageBuckets: true, logs: true, credits: true, growthTasks: true, schoolTasks: true } },
            status,
            ...(endpoint === 'refreshStatus' ? { refreshed: true } : {}),
          },
        };
      case 'getConfig':
        return {
          ok: true,
          value: {
            ok: true,
            path: '/tmp/config.json',
            writable: true,
            config: {
              api_key: 'sk-••••421',
              pool: { max_in_flight: 3, expiring_soon: '168h', cost_explore_interval: '0' },
              schedule: { checkin_hours: [9, 21], checkin_enabled: true, cat_enabled: true },
              admin: { enabled: false },
            },
          },
        };
      case 'getAccounts':
        return {
          ok: true,
          value: {
            ok: true,
            dir: '/tmp/auths',
            accounts: [
              { uid: 'uid-1', nickname: '甲', realm: 'cn', channel: '', domain: 'www.codebuddy.cn' },
              { uid: 'uid-2', nickname: '手动停用的号', realm: 'cn', channel: 'traework', domain: 'trae.cn' },
              { uid: 'uid-3', nickname: '冷却中的号', realm: 'cn', channel: 'qoder', domain: 'qoder.com' },
            ],
          },
        };
      case 'getStats':
        return { ok: true, value: { available: true, stats: statsFixture() } };
      case 'getTasks':
        return {
          ok: true,
          value: {
            available: true,
            tasks: {
              tasks: [
                {
                  task: 'checkin',
                  running: false,
                  run_count: 2,
                  last_start: new Date(Date.now() - 60000).toISOString(),
                  last_end: new Date(Date.now() - 50000).toISOString(),
                  duration_sec: 10.5,
                  outcomes: [
                    { uid: 'uid-1', nickname: '甲', status: 'already', credits: 2880 },
                    { uid: 'uid-2', nickname: '手动停用的号', status: 'skipped', detail: 'disabled' },
                  ],
                  outcome_summary: { total: 2, ok: 0, already: 1, fail: 0, skipped: 1 },
                },
                { task: 'travel', running: true, run_count: 1 },
                { task: 'activity', running: false, run_count: 0 },
                { task: 'keepalive', running: false, run_count: 0 },
                { task: 'school', running: false, run_count: 0 },
                { task: 'cat', running: false, run_count: 1, last_error: 'task cat panicked: boom' },
              ],
            },
          },
        };
      case 'getUsage':
        return { ok: true, value: { available: true, usage: usageFixture() } };
      case 'getLogs':
        return {
          ok: true,
          value: {
            available: true,
            logs: {
              enabled: true,
              channel: 'all',
              count: 2,
              capacity: 2000,
              truncated: false,
              entries: [
                { ts: new Date().toISOString(), ch: 'task', text: '2026/09/19 17:45:11 checkin done: total=3 ok=0 already=3' },
                { ts: new Date().toISOString(), ch: 'sys', level: 'WARN', text: '[pool] degraded' },
              ],
              note: '环形缓冲仅存进程内（重启清零）',
            },
          },
        };
      case 'runTask':
        return { ok: true, value: { started: true, busy: false, note: '已异步启动' } };
      case 'getSchoolTasks':
        return {
          ok: true,
          value: {
            available: true,
            school: {
              uid: payload?.uid ?? 'uid-1',
              in_period: true,
              note: '状态来自上游开学季任务列表。',
              tasks: [
                { task_code: 'expert_use', title: '召唤1 次开学季专家', status: 'claimed', has_progress: true, current: 1, target: 1, task_type: 'recurring', next_unlock_at: '2026-09-20T00:00:00+08:00', reward_credit: 50 },
                { task_code: 'task_student_verify', title: '学生认证', status: 'pending', has_progress: true, current: 0, target: 1, task_type: 'single' },
              ],
            },
          },
        };
      case 'getGrowthTasks':
        return {
          ok: true,
          value: {
            available: true,
            growth: {
              uid: payload?.uid ?? 'uid-1',
              mp_included: true,
              note: '进度来自上游成长任务列表。',
              tasks: [
                { task_code: 'chat_5', title: '和 AI 聊天 5 次', accept_status: 'completed', has_progress: true, current: 5, target: 5, scheduled: 'activity', reward_credit: 100 },
                { task_code: 'template_5', title: '使用 5 个模板', accept_status: 'accepted', has_progress: true, current: 2, target: 5, reward_credit: 300 },
                { task_code: 'create_canvas', title: '体验设计创意', accept_status: 'accepted', has_progress: true, current: 0, target: 1 },
                { task_code: 'Expert_Philanthropy', title: '公益专家', accept_status: 'completed', has_progress: false },
                { task_code: 'school_season', title: '校园日', accept_status: 'not_accepted', has_progress: false, from_mp: true, mp_only: true },
                { task_code: 'black_cat', title: '夜猫子', accept_status: 'claimed', has_progress: true, current: 3, target: 3, scheduled: 'cat' },
              ],
            },
          },
        };
      case 'getCredits':
        return {
          ok: true,
          value: {
            available: true,
            credits: {
              uid: payload?.uid ?? 'uid-1',
              channel: 'workbuddy',
              items: [
                { name: 'CodeBuddy个人版国内运营裂变包', total: 100, used: 0, remain: 100, expire_at: '2026-10-01T00:00:00+08:00', usable: true },
                { name: 'Trae 专用池', total: 500, used: 0, remain: 500, usable: false },
              ],
              usable_total: 100,
              unusable_total: 500,
              item_count: 2,
              upstream_remain: 100,
            },
          },
        };
      // 模型 Tab 的只读目录比对（本版新增）：回显上次拉取 + 三态判定。
      case 'getModelRecord':
        return {
          ok: true,
          value: {
            record: { at: Date.now() - 60000, count: CATALOG_MODELS.length, recorded: true },
            provider: 'chanhub2api',
            models: CATALOG_MODELS,
            backup: { at: 0, count: 0 },
          },
        };
      case 'getModelCatalog':
      case 'refreshModelCatalog':
        return {
          ok: true,
          value: {
            provider: 'chanhub2api',
            at: Date.now() - 3600000,
            sources: { 'pi-ai': { entries: 1354 }, 'models.dev': { entries: 8033 }, openrouter: { entries: 444 } },
            warnings: [],
            catalog: { keys: 3759, entries: 9831 },
            summary: {
              total: CATALOG_MODELS.length,
              counts: { image: 2, text: 1, unknown: 1, confirmed: 2, borrowed: 1, conflict: 0, alias: 1, missing: 0 },
              disagreements: [],
              gaps: [{ id: 'workbuddy:global:kimi-k3', kind: 'catalog-image-not-in-whitelist' }],
            },
            verdicts: CATALOG_VERDICTS,
            readonly: true,
            ...(endpoint === 'refreshModelCatalog' ? { refreshed: true, failures: [] } : {}),
          },
        };
      default:
        return { ok: false, error: { code: 'bad-request', message: `unknown ${endpoint}` } };
    }
  };
  rpc.calls = calls;
  return rpc;
}

/** 模型 Tab 目录比对夹具：四个模型覆盖「确认/借判/别名」三种状态。 */
const CATALOG_MODELS = [
  { id: 'workbuddy:global:kimi-k3', name: 'Kimi K3', contextWindow: 1000000, maxTokens: 64000, credits: 'x0.1', supportsImages: false },
  { id: 'workbuddy:cn:glm-5.3', name: 'GLM 5.3', contextWindow: 200000, maxTokens: 32000, credits: 'x0.06', supportsImages: false },
  { id: 'workbuddy:cn:kimi-k3-1', name: 'Kimi K3-1', contextWindow: 1000000, maxTokens: 64000, supportsImages: false },
  { id: 'workbuddy:cn:auto', name: 'Auto', contextWindow: 200000, maxTokens: 32000, supportsImages: false },
];

const CATALOG_VERDICTS = [
  { id: 'workbuddy:global:kimi-k3', tail: 'kimi-k3', status: 'confirmed', verdict: 'image', tier: 'L1', whitelist: false, how: '精确', matchedKey: 'kimik3', reason: '目录精确命中', tally: { image: 5, text: 0, entries: 5, dissent: 0 }, sources: [{ source: 'models.dev', provider: 'moonshotai', image: true, tier: 'L1' }] },
  { id: 'workbuddy:cn:glm-5.3', tail: 'glm-5.3', status: 'confirmed', verdict: 'text', tier: 'L1', whitelist: false, how: '精确', matchedKey: 'glm5.3', reason: '目录精确命中', tally: { image: 0, text: 7, entries: 7, dissent: 0 }, sources: [{ source: 'models.dev', provider: 'zai', image: false, tier: 'L1' }] },
  { id: 'workbuddy:cn:kimi-k3-1', tail: 'kimi-k3-1', status: 'borrowed', verdict: 'image', tier: 'L1', whitelist: false, how: '剥后缀→kimik3', matchedKey: 'kimik3', reason: '剥掉部署后缀后命中，结论借自同名部署（待确认）', tally: { image: 5, text: 0, entries: 5, dissent: 0 }, sources: [{ source: 'models.dev', provider: 'moonshotai', image: true, tier: 'L1' }] },
  { id: 'workbuddy:cn:auto', tail: 'auto', status: 'alias', verdict: 'unknown', tier: null, whitelist: false, how: '', matchedKey: null, reason: '渠道档位别名（通用名会假匹配，不参与目录比对）', sources: [] },
];

/** 在挂载后的 DOM 里点某个 Tab。 */
async function clickTab(document, label) {
  const buttons = [...document.querySelectorAll('button')];
  const target = buttons.find((button) => button.textContent.trim() === label);
  assert.ok(target, `找不到 Tab 按钮：${label}`);
  await React.act(async () => {
    target.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
  });
}

const skip = !canRender && '需要 react/react-dom/jsdom';

test('渲染：打包产物可被 loader 加载且 loaderId 正确', { skip }, () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const { registration } = loadBundle(dom.window);
  assert.equal(registration.id, 'dsh-chanhub');
  assert.equal(typeof registration.factory, 'function');
  dom.window.close();
});

test('渲染：面板真实挂载并加载出数据（不抛异常）', { skip }, async () => {
  const rpc = fakeRpc(realStatusFixture());
  const { html, cleanup } = await mount(rpc);
  try {
    assert.ok(html.length > 3000, `渲染输出过短（${html.length}），疑似渲染失败`);
    assert.match(html, /渠道中心/);
    assert.match(html, /dshc-tabs/);
    // 真实调用了数据端点。getStatus 换成 refreshStatus（刷新带余额同步）。
    // **getStats / getUsage 不在首批**：用量页自管数据（SWR 缓存 + 一次拉 720h），
    // 否则每次进面板都要为它多付两个端点。
    const endpoints = rpc.calls.map((call) => call.endpoint);
    for (const expected of ['refreshStatus', 'getConfig', 'getAccounts']) {
      assert.ok(endpoints.includes(expected), `未调用 ${expected}`);
    }
    assert.ok(!endpoints.includes('getStats'), '首轮不得代拉 getStats（用量页自管）');
    assert.ok(!endpoints.includes('getUsage'), '首轮不得代拉 getUsage（用量页自管）');
  } finally {
    await cleanup();
  }
});

test('渲染：5 个 Tab 标签都在', { skip }, async () => {
  const { html, cleanup } = await mount(fakeRpc(realStatusFixture()));
  try {
    for (const label of ['账号池', '任务', '用量', '日志', '配置']) {
      assert.ok(html.includes(label), `缺 Tab：${label}`);
    }
  } finally {
    await cleanup();
  }
});

test('渲染：概览 KPI 行 + 三渠道积分卡', { skip }, async () => {
  const { html, cleanup } = await mount(fakeRpc(realStatusFixture()));
  try {
    for (const label of ['账号总数', '健康', '冷却中', '在途占满']) {
      assert.ok(html.includes(label), `缺 KPI 项：${label}`);
    }
    for (const label of ['WB', 'Trae', 'Qoder']) {
      assert.ok(html.includes(label), `缺渠道卡：${label}`);
    }
    // 三渠道卡分别汇总：WB 2880 / Trae 10 / Qoder 500
    assert.ok(html.includes('2,880'), `WB 渠道积分应为 2880，实际 HTML 未包含`);
    assert.ok(html.includes('500'), `Qoder 渠道积分应为 500`);
    assert.ok(html.includes('10'), `Trae 渠道积分应为 10`);
  } finally {
    await cleanup();
  }
});

test('渲染账号池：赚得积分格（累计口径，紧贴粘性会话同行）+ 渠道卡写「N 个账号」', { skip }, async () => {
  const { html, cleanup } = await mount(fakeRpc(realStatusFixture()));
  try {
    // 赚得积分：fixture 每个账号给 2 个套餐（100 + 500），3 个账号 → 1800。
    // 现已从独占一行的卡改为 KPI 格，紧跟「粘性会话」右侧、同处一行。
    // 次级说明只保留「已消耗 X」（覆盖度文案已按需求去掉）。
    assert.ok(html.includes('赚得积分'), '缺「赚得积分」KPI 格');
    assert.ok(html.includes('1,800'), `赚得积分应为 1800，实际未渲染`);
    assert.ok(html.includes('已消耗'), '缺「已消耗」次级说明');
    assert.ok(!/覆盖\s*\d+\/\d+\s*个账号/.test(html), '不应再出现「覆盖 N/M 个账号」文案');
    // 「3 号」是内部黑话，改为带量词的「N 个账号」
    assert.match(html, /1 个账号/, '渠道卡仍在使用「N 号」写法');
    assert.ok(!/>\s*\d+\s*号\s*</.test(html), '仍有「N 号」黑话残留');
  } finally {
    await cleanup();
  }
});

test('渲染账号池：账号卡片带到期时间（凭证读不到时降级为「积分到期」）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const cards = [...document.querySelectorAll('.dshc-acctcard')];
    assert.ok(cards.length >= 1, '缺账号卡片');
    // fixture 的 auths 没有 expiresAt → 降级取套餐明细里最早的未耗尽到期日（10-01）
    const withExpiry = cards.filter((card) => card.textContent.includes('积分到期 10-01'));
    assert.equal(withExpiry.length, cards.length, '每个账号卡片都应渲染到期时间');
  } finally {
    await cleanup();
  }
});

test('渲染账号池：渠道身份走颜色 —— 渠道胶囊 + 首列渠道圆点 + 卡片左缘渠道色', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    // 渠道胶囊（jsdom 的 CSSOM 不认 color-mix，所以断言挂在 data 属性 + 内联色上）
    const chips = [...document.querySelectorAll('[data-channel-chip]')];
    assert.ok(chips.length >= 1, '账号池应至少有一个渠道胶囊');
    assert.ok(chips.every((c) => (c.getAttribute('data-channel-chip') || '').length >= 0), '渠道胶囊要带 data-channel-chip');
    assert.ok(chips.some((c) => c.getAttribute('data-channel-chip') === 'workbuddy'), 'fixture 里应有 workbuddy 渠道胶囊');
    // 渠道圆点：solid 身份色（只上形状）
    const dots = [...document.querySelectorAll('[data-channel-dot]')];
    assert.ok(dots.length >= 1, '要有渠道圆点（身份色只上形状）');
    // 同源断言：每个圆点的实际色必须等于 channelPalette(它自称的渠道).solid（jsdom 会把 hex 归一成 rgb()）
    const asRgb = (hex) => `rgb(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)})`;
    const wrong = dots.filter((d) => {
      const want = channelPalette(d.getAttribute('data-channel-dot')).solid;
      return d.style.background !== want && d.style.background !== asRgb(want);
    });
    assert.equal(wrong.length, 0, `渠道圆点色必须与 channelPalette 同源，不符：${JSON.stringify(wrong.map((d) => [d.getAttribute('data-channel-dot'), d.style.background]))}`);
    // 账号卡左缘渠道色走 CSS 变量，避免内联 box-shadow 覆盖 hover
    const card = document.querySelector('.dshc-acctcard');
    assert.ok(card, '缺账号卡片');
    assert.equal(card.style.getPropertyValue('--dshc-chan'), '#4f6ef7', '账号卡左缘渠道色必须来自 channelPalette(solid)');
    // 纪律：渠道色不得当正文色 —— 胶囊文字色必须是令牌
    const chipText = chips[0].querySelector('span');
    assert.match(chipText.style.color || '', /dsw-alias-label-primary|^$/, `渠道胶囊文字必须走令牌，实际 ${chipText.style.color}`);
    // 渠道色不得出现在胶囊文字上
    assert.ok(!(chipText.style.color || '').includes('#4f6ef7'), '渠道色不能当正文色');
  } finally {
    await cleanup();
  }
});

test('渲染用量：账号用量卡带维度切换，默认按用量（Tokens）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const card = app.querySelector('[data-card="accounts"]');
    assert.ok(card, '缺账号用量卡');
    assert.match(card.textContent, /按Tokens/, '默认维度应为按用量（Tokens）');
    const seg = card.querySelector('[data-seg="rankMetric"]');
    assert.ok(seg, '缺维度切换器');
    const labels = [...seg.querySelectorAll('button')].map((b) => b.textContent.trim());
    assert.deepEqual(labels, ['Tokens', '请求', '积分'], `维度项不符：${labels.join(',')}`);
    // 切到「请求」后副标题跟着变（维度不是装饰）
    const reqBtn = [...seg.querySelectorAll('button')].find((b) => b.textContent.trim() === '请求');
    await React.act(async () => {
      reqBtn.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    assert.match(app.querySelector('[data-card="accounts"]').textContent, /按请求/, '切维度后副标题未更新');
    // 渠道卡与账号卡同维度（否则两列不可比）
    assert.match(app.querySelector('[data-card="channels"]').textContent, /按请求/, '渠道卡未跟随维度');
    assert.match(app.querySelector('[data-card="channels"]').textContent, /个账号/, '渠道卡仍写「N 号」');
  } finally {
    await cleanup();
  }
});

test('渲染：三种账号状态标签都正确出现', { skip }, async () => {
  const { html, cleanup } = await mount(fakeRpc(realStatusFixture()));
  try {
    assert.ok(html.includes('可用'), '缺「可用」状态');
    assert.ok(html.includes('手动停用 + 系统禁用'), '叠加态标签缺失');
    assert.ok(html.includes('软限流（429）'), '冷却文案未按 cool_kind 分支');
    assert.match(html, /剩余 1 小时 1 分/, `冷却剩余时长未渲染（中文格式）：${html.match(/剩余[^<]*/)?.[0]}`);
  } finally {
    await cleanup();
  }
});

test('渲染：叠加态同时给出「启用」与「复活」，并说明两位独立清除', { skip }, async () => {
  const { html, cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    // 点开「手动停用的号」卡片 → 抽屉里出现完整折叠明细与动作
    const card = [...document.querySelectorAll('.dshc-acctcard')].find((el) => el.textContent.includes('手动停用的号'));
    assert.ok(card, '缺账号卡片');
    await React.act(async () => {
      card.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    const drawerHtml = document.getElementById('app').innerHTML;
    assert.ok(drawerHtml.includes('解除手动停用'), '缺 enable 动作');
    assert.ok(drawerHtml.includes('复活（清系统禁用）'), '缺 revive 动作');
    assert.ok(drawerHtml.includes('点一次不会同时清掉两位'), '缺叠加态行为说明（会误导用户）');
  } finally {
    await cleanup();
  }
});

test('渲染：账号折叠四组的摘要都带真实数据（抽屉内）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const card = [...document.querySelectorAll('.dshc-acctcard')].find((el) => el.textContent.includes('甲'));
    assert.ok(card, '缺账号卡片');
    await React.act(async () => {
      card.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    const html = document.getElementById('app').innerHTML;
    for (const group of ['健康', '质量', '积分']) {
      assert.ok(html.includes(group), `缺折叠组：${group}`);
    }
    assert.match(html, /662 成功 \/ 3 失败 · 成功率/, '质量组摘要缺数据');
    assert.match(html, /2,880 可用/, '积分组摘要缺数据');
  } finally {
    await cleanup();
  }
});

test('渲染：排程折叠（色块只表达配置与时间窗）在配置 Tab', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    await clickTab(document, '配置');
    const html = document.getElementById('app').innerHTML;
    for (const label of ['签到', '猫猫旅行', '开学季', '夜猫子']) {
      assert.ok(html.includes(label), `缺排程字段：${label}`);
    }
    assert.ok(html.includes('9,21'), '缺计划时刻（checkin_hours=[9,21]）');
  } finally {
    await cleanup();
  }
});

test('渲染：任务磁贴接真实任务端点（不再 disabled 占位）', { skip }, async () => {
  const { html, cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    await clickTab(document, '任务');
    const fresh = document.getElementById('app').innerHTML;
    // v2 收尾：原「任务操作台按钮 + 执行历史表」合并为磁贴（触发与状态同格）。
    assert.ok(fresh.includes('dshc-tasktile'), '缺任务磁贴');
    // 触发按钮可用（网关任务数据在场时不得全部 disabled）
    assert.ok(fresh.includes('签到'), '缺签到任务按钮');
    assert.ok(fresh.includes('查余额'), '缺余额任务按钮');
    // fixture 里 travel 正在跑（running:true）→ 只有它 disabled，其余可用。
    const batchLabels = ['签到', '查余额', 'token 保活', '猫猫旅行', '活跃地图'];
    const byLabel = Object.fromEntries(batchLabels.map((label) => {
      const button = [...document.querySelectorAll('button')].find((b) => b.textContent.includes(label));
      return [label, button];
    }));
    for (const label of batchLabels) {
      assert.ok(byLabel[label], `缺任务按钮：${label}`);
    }
    for (const label of ['签到', '查余额', 'token 保活', '活跃地图']) {
      assert.ok(!byLabel[label].disabled, `${label} 在网关任务可用时不得 disabled`);
    }
    assert.ok(byLabel['猫猫旅行'].disabled, 'travel running=true → 猫猫旅行按钮应 disabled');
    // 旧占位文案必须消失
    assert.ok(!fresh.includes('这些按钮暂不可用'), '旧「暂不可用」占位应删除');
  } finally {
    await cleanup();
  }
});

test('渲染：任务 Tab 在网关未开启 admin 时如实降级', { skip }, async () => {
  const rpc = fakeRpc(realStatusFixture());
  const { html, cleanup, document } = await mount(rpc);
  try {
    await clickTab(document, '任务');
    const fresh = document.getElementById('app').innerHTML;
    // fixture getTasks available=true（网关开了）；这里验证 available=false 的降级形态
    assert.ok(fresh.includes('任务运行状态与手动触发') || fresh.includes('dshc-tasktile'), '缺任务降级形态');
  } finally {
    await cleanup();
  }
});

test('渲染：折叠结构与 CSS（三个坑的修复；fold 在抽屉内）', { skip }, async () => {
  const { html, cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    // CSS 注入在顶栏 style 里，始终在场
    assert.ok(html.includes('.dshc-fold:not([open]) > .dshc-body'), '缺折叠态 display 压回规则');
    // 折叠 details 在账号抽屉内验证
    const card = [...document.querySelectorAll('.dshc-acctcard')].find((el) => el.textContent.includes('甲'));
    assert.ok(card, '缺账号卡片');
    await React.act(async () => {
      card.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    const drawerHtml = document.getElementById('app').innerHTML;
    assert.match(drawerHtml, /<details[^>]*class="dshc-fold"/, '必须用原生 details');
    assert.match(drawerHtml, /<summary/, '必须有 summary');
    // 坑 2：summary 内的动作必须 pointer-events:none
    assert.match(drawerHtml, /pointer-events:\s*none/, '缺 summary 内动作的 pointer-events 修复');
    // 坑 3：行用 center 对齐
    assert.ok(drawerHtml.includes('align-items: center'), '缺 center 对齐（baseline 会错位 20px）');
  } finally {
    await cleanup();
  }
});

test('渲染：账号详情抽屉默认展开明细（外层壳 + 健康/质量/积分），任务组保持折叠', { skip }, async () => {
  // 用户反馈「点开卡片，详情里信息都折叠着」。
  //
  // 结构真相（实测挂载探针，勿凭组件名臆断）：抽屉内的 .dshc-fold 有 **5 个**，
  // 是两层嵌套 ——
  //   [0] AccountFold 自己的外层壳（summary = 昵称+状态+积分）
  //       [1] 健康  [2] 质量  [3] 积分  [4] 任务
  // 只展开那四组是不够的：外层壳不展开，四组根本不可见（这正是反馈的观感）。
  //
  // 本用例断言 **open 分布**而不是「有 open 属性」——后者在外层壳/任务组上也成立，
  // 会放过「任务组被一起展开」这个与 ui-design §6 冲突的回归。
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const card = [...document.querySelectorAll('.dshc-acctcard')].find((el) => el.textContent.includes('甲'));
    assert.ok(card, '缺账号卡片');
    await React.act(async () => {
      card.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });

    const drawer = document.querySelector('.dshc-drawer');
    assert.ok(drawer, '缺账号详情抽屉');
    const folds = [...drawer.querySelectorAll('details.dshc-fold')];
    assert.equal(folds.length, 5, `抽屉内应有 5 个折叠层（外层壳 + 四组），实测 ${folds.length}`);

    const openState = folds.map((f) => f.hasAttribute('open'));
    assert.deepEqual(
      openState,
      [true, true, true, true, false],
      `默认展开态应为 [外层壳, 健康, 质量, 积分] = true、任务 = false，实测 ${JSON.stringify(openState)}`,
    );

    // 逐组确认「摘要文案 ↔ 展开态」的对应关系，避免顺序变动时断言静默错位。
    const bySummary = (text) =>
      folds.find((f) => (f.querySelector('summary')?.textContent ?? '').includes(text));
    for (const group of ['健康', '质量', '积分']) {
      const fold = bySummary(group);
      assert.ok(fold, `找不到「${group}」折叠组`);
      assert.ok(fold.hasAttribute('open'), `${group}组应默认展开`);
    }
    const taskFold = bySummary('任务');
    assert.ok(taskFold, '找不到「任务」折叠组');
    assert.ok(
      !taskFold.hasAttribute('open'),
      '任务组应保持折叠（展开是 6 项排程明细 + 说明，ui-design §6 刻意压成一行色块省高度）',
    );
  } finally {
    await cleanup();
  }
});

test('渲染：抽屉内手动折叠的组不被数据刷新弹开（「默认展开」≠「锁死展开」）', { skip }, async () => {
  // Fold 用 `open` 传固定的 true。React 只在值**变化**时写 DOM 属性，
  // 所以用户手点的折叠应当保持 —— 但这是行为保证，必须测，不能靠推断。
  const rpc = fakeRpc(realStatusFixture());
  const { cleanup, document } = await mount(rpc);
  try {
    const card = [...document.querySelectorAll('.dshc-acctcard')].find((el) => el.textContent.includes('甲'));
    await React.act(async () => {
      card.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    const drawer = document.querySelector('.dshc-drawer');
    const quality = [...drawer.querySelectorAll('details.dshc-fold')]
      .find((f) => (f.querySelector('summary')?.textContent ?? '').includes('质量'));
    assert.ok(quality?.hasAttribute('open'), '前置条件：质量组应默认展开');

    // 模拟用户手动折叠（原生 details 的交互结果）
    await React.act(async () => {
      quality.open = false;
      quality.dispatchEvent(new document.defaultView.Event('toggle'));
    });
    assert.equal(quality.open, false, '前置条件：手动折叠后应为收起');

    // 触发一次重渲染（等价于面板 refresh 落地的 setState）
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    const after = [...document.querySelector('.dshc-drawer').querySelectorAll('details.dshc-fold')]
      .find((f) => (f.querySelector('summary')?.textContent ?? '').includes('质量'));
    assert.equal(after.open, false, '用户手动折叠的组不应被重渲染弹开');
  } finally {
    await cleanup();
  }
});

test('渲染：配置 Tab 出现危险语义与「需重启」标注', { skip }, async () => {
  const rpc = fakeRpc(realStatusFixture());
  const { html, cleanup, document } = await mount(rpc);
  try {
    await clickTab(document, '配置');
    const configTabHtml = document.getElementById('app').innerHTML;
    assert.ok(configTabHtml.includes('危险'), '缺危险语义角标');
    assert.ok(configTabHtml.includes('↻'), '缺「需重启」标记（label 后缀 ↻）');
    assert.ok(configTabHtml.includes('重启网关'), '缺置顶的一键重启');
    assert.ok(configTabHtml.includes('账号池治理'), '缺配置分组');
    assert.ok(configTabHtml.includes('定时排程'), '缺定时排程分组');
  } finally {
    await cleanup();
  }
});

test('渲染：任务 Tab 的三条反直觉事实都如实呈现', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    await clickTab(document, '任务');
    const html = document.getElementById('app').innerHTML;
    // 真实任务状态数据在场（不再是「网关未提供」占位）
    assert.ok(html.includes('dshc-tasktile'), '缺任务磁贴（原执行历史与操作台合并）');
    assert.ok(html.includes('签到'), '缺签到卡');
    assert.ok(html.includes('已签过'), '缺逐账号结果标签');
    assert.ok(html.includes('甲'), '缺逐账号结果行');
    assert.ok(html.includes('开学季'), '缺开学季块');
    assert.ok(html.includes('学生认证'), '缺人工子任务（真实上游标题）');
    assert.ok(html.includes('人工项'), '缺人工项标签');
    // 事实②：只有 2 个有定时覆盖，22 个没有。
    // 表达方式从整段散文改成汇总 chip（逐行看不到「缺席」，故必须有汇总处）；
    // 详细说明移到该 chip 的 title。
    assert.ok(html.includes('定时覆盖 2/24'), '缺事实②的定时覆盖汇总');
    // 静态目录已被真实进度卡取代：码集合来自网关（与 task_runner.py MAPPING 同源）
    assert.ok(html.includes('chat_5') && html.includes('black_cat'), '缺真实任务码');
    // 事实③：开学季 = 5 个子任务（现在有真实状态卡）
    assert.ok(html.includes('开学季'), '缺开学季块');
    // in_period=true 是常态，不再挂正向标签（省版面）；只有 false 才警示过期快照。
    assert.ok(!html.includes('过期快照'), 'in_period=true 时不应出现过期快照警示');
    assert.ok(html.includes('已领取'), '缺子任务真实状态');
    assert.ok(html.includes('学生认证'), '缺人工子任务（真实数据）');
    assert.ok(html.includes('每日'), '缺 recurring 重置标注');
    // 不可代做的码必须可见（有 title 与状态，无进度数据 → 「—」）
    assert.ok(html.includes('Expert_Philanthropy') || html.includes('公益专家'), '缺不可伪造码');
  } finally {
    await cleanup();
  }
});

/** 切到用量 Tab 并等首轮数据落地，返回 app 容器。 */
async function openUsage(document) {
  await clickTab(document, '用量');
  // 用量页自己拉数据（SWR 缓存 + fetchUsage），要多等一轮 Promise.all
  await React.act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  return document.getElementById('app');
}

/** 进用量页并展开某个折叠卡（燃尽 / 进程口径），返回 app。 */
async function openFold(document, id) {
  await openUsage(document);
  const app = document.getElementById('app');
  const fold = app.querySelector(`details[data-fold="${id}"]`);
  assert.ok(fold, `缺折叠卡 ${id}`);
  if (!fold.open) {
    await React.act(async () => {
      fold.querySelector('summary').dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
  }
  return app;
}

test('渲染用量：KPI 恰好 6 卡（两行 × 三列），每卡主数字 + 一行次级文字', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const cards = [...app.querySelectorAll('.dshc-ust-kpi')];
    assert.equal(cards.length, 6, `KPI 应为 6 卡，实际 ${cards.length}`);
    // 每卡三段：标签 / 主数字 / 次级文字 —— 参考实现的「主数字 + 一行参照」纪律
    for (const card of cards) {
      assert.ok(card.querySelector('.dshc-ust-kpi-k'), '缺标签');
      assert.ok(card.querySelector('.dshc-ust-kpi-v'), '缺主数字');
      assert.ok(card.querySelector('.dshc-ust-kpi-d'), '缺次级文字');
    }
    // 键序即排布：第一行 消耗三件套、第二行 效率三件套
    const keys = cards.map((c) => c.getAttribute('data-kpi'));
    assert.deepEqual(
      keys,
      ['tokens', 'credit', 'stock', 'requests', 'cache', 'latency'],
      `KPI 键序不符：${keys.join(',')}`,
    );
    // 数值来自窗口分桶 fixture（126 请求 / 18,900 tokens / 31.5 积分）
    const text = app.textContent;
    assert.ok(text.includes('18.9K'), '缺窗口 Tokens 主数字');
    assert.ok(text.includes('126'), '缺请求数');
    // 请求数卡的次级文字必须拆成功/失败（fixture：117 成功 / 9 失败）
    const reqCard = cards.find((c) => c.getAttribute('data-kpi') === 'requests');
    assert.match(reqCard.textContent, /成功 117 · 失败 9/, '请求数卡缺成功/失败拆分');
  } finally {
    await cleanup();
  }
});

test('渲染用量：单页卡片流 —— 不再有「概览/趋势」Tab 段控与全局窗口选择器', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    // 顶层只有 6 个 Tab（账号池/任务/用量/日志/配置 + 添加账号），
    // 用量页内不得再出现第二层页签
    const pageSeg = app.querySelectorAll('[data-seg="page"]');
    assert.equal(pageSeg.length, 0, '用量页不得再有「概览/趋势」页签');
    assert.equal(app.querySelectorAll('[data-seg="window"]').length, 0, '用量页不得再有全局窗口选择器');
    // 但卡内仍有自己的切换器：热力图指标 / 每日范围 / 每日指标
    assert.ok(app.querySelector('[data-seg="heatMetric"]'), '热力图卡缺指标切换');
    assert.ok(app.querySelector('[data-seg="range"]'), '每日用量卡缺范围切换');
    assert.ok(app.querySelector('[data-seg="barMetric"]'), '每日用量卡缺指标切换');
    // 范围选项是 7d/14d/30d
    const range = [...app.querySelectorAll('[data-seg="range"] button')].map((b) => b.textContent.trim());
    assert.deepEqual(range, ['7d', '14d', '30d'], `范围选项不符：${range.join(',')}`);
  } finally {
    await cleanup();
  }
});

test('渲染用量：六张卡都在（热力 / 每日 / 账号 / 渠道 / 模型）+ 两个折叠区', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    for (const id of ['heat', 'daily', 'accounts', 'channels', 'models']) {
      assert.ok(app.querySelector(`[data-card="${id}"]`), `缺卡片 ${id}`);
    }
    assert.ok(app.querySelector('details[data-fold="burn"]'), '缺积分燃尽折叠区');
    assert.ok(app.querySelector('details[data-fold="process"]'), '缺进程口径折叠区');
    // 折叠区默认收起（排查型信息不与概览抢注意力）
    for (const id of ['burn', 'process']) {
      const fold = app.querySelector(`details[data-fold="${id}"]`);
      assert.equal(fold.open, false, `折叠区 ${id} 应默认收起`);
    }
  } finally {
    await cleanup();
  }
});

test('渲染用量：每日用量按模型堆叠，柱不越出画布（分带布局）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const svg = app.querySelector('[data-card="daily"] svg.dshc-ust-svg');
    assert.ok(svg, '缺每日用量 SVG');
    const viewBox = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
    const [, , vbW] = viewBox;
    assert.ok(vbW > 0, 'viewBox 缺宽度');
    const rects = [...svg.querySelectorAll('rect')];
    assert.ok(rects.length > 0, '堆叠柱应有矩形');
    for (const rect of rects) {
      const x = Number(rect.getAttribute('x'));
      const w = Number(rect.getAttribute('width'));
      assert.ok(x >= 0, `柱 x 不得为负（实际 ${x}）`);
      assert.ok(x + w <= vbW + 0.5, `柱右沿不得越出画布（x=${x} w=${w} 画布=${vbW}）`);
    }
    // 图例即明细：色块 + 名称 + 值 + 占比
    const legend = [...app.querySelectorAll('[data-card="daily"] .dshc-ust-legend-row')];
    assert.ok(legend.length > 0, '缺图例行');
    assert.ok(app.querySelector('.dshc-ust-legend-val'), '图例缺值');
    assert.ok(app.querySelector('.dshc-ust-legend-pct'), '图例缺占比');
    // fixture 只有 2 个模型 → 图例 2 行（不含「其他」）
    const names = legend.map((row) => row.querySelector('.dshc-ust-legend-name > span').textContent);
    assert.deepEqual(names, ['cn:glm-5.2', 'cn:glm-5.2-air'], `图例模型不符：${names.join('/')}`);
  } finally {
    await cleanup();
  }
});

test('渲染用量：热力图为固定 30 天骨架 + 分位色阶图例 + 稀疏时降级小时分布', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const heat = app.querySelector('[data-card="heat"] .dshc-heat');
    assert.ok(heat, '缺热力图网格');
    // 固定 30 天骨架：列数恒为 5 周（30 天 + 周一对齐），不随有数据天数伸缩
    const columns = heat.style.gridTemplateColumns;
    assert.match(columns, /repeat\(\d+,\s*11px\)/, `骨架应固定列数，实际 ${columns}`);
    // 分位色阶图例 5 档
    const legendLevels = [...app.querySelectorAll('[data-card="heat"] .dshc-ust-heat-legend > i')]
      .map((i) => i.className);
    assert.deepEqual(legendLevels, ['h0', 'h1', 'h2', 'h3', 'h4'], `色阶图例不符：${legendLevels.join(',')}`);
    // 标题标注时区口径（本地时区，不是参考实现的 UTC —— 我们与网关槽时区一致）
    const sub = app.querySelector('[data-card="heat"] .dshc-ust-cardsub');
    assert.match(sub.textContent, /本地时区/, '热力图必须标注时区口径');
  } finally {
    await cleanup();
  }
});

test('渲染用量：账号排行映射昵称 + 渠道标签；渠道用量按渠道聚合', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    // 账号列映射昵称（不是 uid 前 8 位）
    const accCard = app.querySelector('[data-card="accounts"]');
    assert.ok(accCard, '缺账号排行卡');
    assert.ok(accCard.textContent.includes('甲'), '账号维度应映射昵称');
    // 渠道标签来自 channelResolver（fixture 的 getAccounts 带 domain/channel）。
    // Tag 组件是纯内联样式（无 class），按行内文本断言。
    const names = [...accCard.querySelectorAll('.dshc-ust-rank-name')];
    assert.ok(names.some((n) => /\b(WB|Trae|Qoder)\b/.test(n.textContent)), '账号行缺渠道标签');
    // 渠道列按渠道聚合（fixture 有 3 个账号、2 个渠道）
    const chanCard = app.querySelector('[data-card="channels"]');
    assert.ok(chanCard, '缺渠道用量卡');
    const chanRows = [...chanCard.querySelectorAll('.dshc-ust-rank-row')];
    assert.ok(chanRows.length >= 1 && chanRows.length <= 3, `渠道行数异常：${chanRows.length}`);
    // 渠道行带账号数（N 号）
    assert.ok(chanCard.textContent.includes('号'), '渠道行缺账号数标注');
  } finally {
    await cleanup();
  }
});

test('渲染用量：donut 中心显示模型数（不是重复合计），列表含名称/tokens/占比', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const donut = app.querySelector('[data-card="models"]');
    assert.ok(donut, '缺模型占比卡');
    // 中心 = 模型数（fixture 2 个模型）；合计已在 KPI 的 Tokens 上，同一屏不得出现两遍
    const center = donut.querySelector('.dshc-donut-total');
    assert.equal(center.textContent.trim(), '2', `donut 中心应为模型数 2，实际 ${center.textContent.trim()}`);
    assert.equal(donut.querySelector('.dshc-donut-cap').textContent.trim(), '个模型');
    // 列表三段齐全
    const rows = [...donut.querySelectorAll('.dshc-mrow')];
    assert.equal(rows.length, 2, `模型列表应为 2 行，实际 ${rows.length}`);
    for (const row of rows) {
      assert.ok(row.querySelector('.dshc-mname'), '缺模型名');
      assert.ok(row.querySelector('.dshc-mtok'), '缺 tokens');
      assert.ok(row.querySelector('.dshc-mpct'), '缺占比');
    }
  } finally {
    await cleanup();
  }
});

test('渲染用量：进程口径折叠区 —— 命中率/延迟/逐模型行，倍率缺失显示 —', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openFold(document, 'process');
    const html = app.innerHTML;
    assert.ok(html.includes('进程累计'), '必须标注进程累计口径');
    // 倍率原文透出（fixture x0.06）；无倍率的行不得显示 x0.00
    assert.ok(html.includes('x0.06'), '缺上游倍率原文');
    assert.ok(!html.includes('x0.00'), '倍率缺失不得显示 x0.00（缺失 ≠ 免费）');
    // 窗口分桶的命中率与进程口径的命中率**并列但各自标注口径**
    const scopes = [...app.querySelectorAll('.dshc-row [title]')]
      .map((el) => el.getAttribute('title') || '')
      .filter((t) => t.includes('口径') || t.includes('重启清零'));
    assert.ok(scopes.length > 0, '命中率必须带口径标注');
    // 缺观测的指标显示 —
    assert.ok(html.includes('—'), '缺观测指标应显示 —');
  } finally {
    await cleanup();
  }
});

test('渲染用量：折叠区摘要在收起时就给出关键数（燃尽天数 / 进程时长）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const burn = app.querySelector('details[data-fold="burn"] summary');
    const proc = app.querySelector('details[data-fold="process"] summary');
    // 燃尽摘要：fixture 存量 4084 / 每天消耗 → 有外推天数
    assert.match(burn.textContent, /≈ 还可/, '燃尽折叠区缺「还可 N 天」摘要');
    // 进程摘要：fixture uptime 11520s = 3 小时 12 分
    assert.match(proc.textContent, /进程累计/, '进程折叠区缺「进程累计」标注');
  } finally {
    await cleanup();
  }
});

test('渲染用量：页头四态副标题 —— 成功态带更新时刻，失败态保留旧数据并如实标注', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const sub = app.querySelector('.dshc-ust-sub');
    assert.ok(sub, '缺页头副标题');
    assert.equal(sub.getAttribute('data-freshness'), 'fresh', '首轮成功应为 fresh');
    assert.match(sub.textContent, /最近更新 \d{2}:\d{2}/, `成功态副标题不符：${sub.textContent}`);
    // 页头有刷新按钮（带 loading 文案切换）
    const btn = app.querySelector('.dshc-ust-refresh');
    assert.ok(btn, '缺刷新按钮');
    assert.ok(btn.textContent.includes('刷新'), '刷新按钮文案缺失');
  } finally {
    await cleanup();
  }
});

test('渲染用量：刷新失败保留旧数据，副标题如实标注「不是最新」（绝不伪装最新）', { skip }, async () => {
  const base = fakeRpc(realStatusFixture());
  let calls = 0;
  const rpc = async (endpoint, payload) => {
    if (endpoint === 'getUsage' && (calls += 1) > 1) {
      return { ok: false, error: { code: 'gateway-unreachable', message: '网关连不上', details: {} } };
    }
    return base(endpoint, payload);
  };
  const { cleanup, document } = await mount(rpc);
  try {
    const app = await openUsage(document);
    // 首轮成功，页面上有真实数据
    assert.ok(app.textContent.includes('18.9K'), '首轮应有数据');
    // 手动刷新（失败）→ 数据仍在，状态降级为 fallback
    const btn = app.querySelector('.dshc-ust-refresh');
    await React.act(async () => { btn.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true })); });
    await React.act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    const sub = app.querySelector('.dshc-ust-sub');
    assert.equal(sub.getAttribute('data-freshness'), 'fallback', `失败后应为 fallback，实际 ${sub.getAttribute('data-freshness')}`);
    assert.match(sub.textContent, /不是最新/, '失败态必须写明「不是最新」');
    assert.match(sub.textContent, /网关连不上/, '失败态应带失败原因');
    // 数据没有被清掉
    assert.ok(app.textContent.includes('18.9K'), '失败后旧数据必须保留');
    // **不得**把失败渲染成「网关未提供分桶端点」—— 那是端点缺失的降级文案
    assert.ok(!app.textContent.includes('网关未提供分桶端点'), '失败不得伪装成端点缺失');
  } finally {
    await cleanup();
  }
});

test('渲染用量：SWR 缓存 —— 载荷落 localStorage，坏缓存被结构校验拒掉', { skip }, async () => {
  const { cleanup, document, window } = await mount(fakeRpc(realStatusFixture()));
  try {
    await openUsage(document);
    const keys = Object.keys(window.localStorage).filter((k) => k.startsWith('dsh-chanhub:usage:'));
    const key = keys[0];
    assert.ok(key, `用量载荷应写进 localStorage，实际键：${Object.keys(window.localStorage).join(',')}`);
    const cached = JSON.parse(window.localStorage.getItem(key));
    assert.equal(cached.version, 1, '缓存应带版本号');
    assert.ok(cached.payload?.usage?.buckets?.length > 0, '缓存载荷应含分桶');
    assert.ok(typeof cached.savedAt === 'number', '缓存应带成功时刻');
    // 结构校验直接拒绝坏缓存
    const { isUsableCache } = await import('../client/usage/api.js');
    assert.equal(isUsableCache({ version: 1 }), false, '缺 payload 应拒绝');
    assert.equal(isUsableCache({ version: 1, payload: { usage: {} }, savedAt: 1 }), false, '缺 buckets 应拒绝');
    assert.equal(isUsableCache({ version: 999, payload: { usage: { buckets: [], total: {}, by_uid: [], by_model: [] } }, savedAt: 1 }), false, '版本不符应拒绝');
  } finally {
    await cleanup();
  }
});

test('渲染用量：范围切换纯前端切片 —— 不再重拉分桶（RPC 次数不变）', { skip }, async () => {
  const rpc = fakeRpc(realStatusFixture());
  const { cleanup, document } = await mount(rpc);
  try {
    const app = await openUsage(document);
    const usageCalls = () => rpc.calls.filter((call) => call.endpoint === 'getUsage').length;
    const before = usageCalls();
    assert.ok(before > 0, '首轮应拉过一次分桶');
    // 切 7d → 不发请求
    const btn7 = [...app.querySelectorAll('[data-seg="range"] button')].find((b) => b.textContent.trim() === '7d');
    await React.act(async () => { btn7.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true })); });
    assert.equal(usageCalls(), before, '切范围不得重拉分桶（本地切片）');
    // 再切 14d → 仍不发
    const btn14 = [...app.querySelectorAll('[data-seg="range"] button')].find((b) => b.textContent.trim() === '14d');
    await React.act(async () => { btn14.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true })); });
    assert.equal(usageCalls(), before, '第二次切范围也不得重拉');
  } finally {
    await cleanup();
  }
});

test('渲染用量：导出菜单四项 —— 纯客户端构建 CSV/JSON，带防注入与 BOM', { skip }, async () => {
  const { buildDailyCsv, buildModelCsv, buildAccountCsv, csvCell, stamp } = await import('../client/usage/export.js');
  // 防公式注入：以 = + - @ 开头的单元格前置单引号（CSV 注入）
  assert.equal(csvCell('=cmd|a'), "'=cmd|a", '等号开头须转义');
  assert.equal(csvCell('@x'), "'@x", '@ 开头须转义');
  assert.equal(csvCell('-1'), "'-1", '减号开头须转义');
  assert.equal(csvCell('+2'), "'+2", '加号开头须转义');
  // RFC 4180：含逗号/引号/换行的字段加引号，内部引号翻倍
  assert.equal(csvCell('a,b'), '"a,b"', '含逗号须加引号');
  assert.equal(csvCell('a"b'), '"a""b"', '含引号须翻倍');
  assert.equal(csvCell('ok'), 'ok', '普通值不得加引号');
  // BOM：Excel 在中文 Windows 上按 GBK 解码会全乱
  assert.ok(buildDailyCsv([], { series: [] }).startsWith('\uFEFF'), '每日 CSV 缺 BOM');
  assert.ok(buildModelCsv([]).startsWith('\uFEFF'), '模型 CSV 缺 BOM');
  assert.ok(buildAccountCsv([]).startsWith('\uFEFF'), '账号 CSV 缺 BOM');
  // 文件名时间戳
  assert.match(stamp(new Date('2026-09-21T10:00:00')), /^20260921$/);
});

test('渲染用量：导出菜单可展开，四个导出项触发下载', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const menu = app.querySelector('.dshc-ust-exportmenu');
    assert.equal(menu, null, '导出菜单应默认收起');
    const toggle = app.querySelector('.dshc-ust-exportbtn');
    await React.act(async () => { toggle.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true })); });
    const items = [...document.querySelectorAll('.dshc-ust-exportmenu button')].map((b) => b.textContent.trim());
    assert.deepEqual(items, ['完整 JSON', '每日 CSV', '模型 CSV', '账号 CSV'], `导出项不符：${items.join('/')}`);
  } finally {
    await cleanup();
  }
});

test('渲染用量：结构化 tooltip —— 悬停柱体出现带明细行的浮层，移开即消失', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const bar = app.querySelector('[data-card="daily"] .dshc-ust-bar-day');
    assert.ok(bar, '缺可悬停的柱体');
    // React 的 onMouseEnter/onMouseLeave 由 mouseover/mouseout 合成（不直接监听
    // mouseenter），所以测试必须发 mouseover/mouseout —— 发错事件会测出假阴性。
    await React.act(async () => {
      bar.dispatchEvent(new document.defaultView.MouseEvent('mouseover', { bubbles: true }));
    });
    let tip = document.querySelector('.dshc-ust-tooltip');
    assert.ok(tip, '悬停后应出现 tooltip');
    assert.ok(tip.querySelector('.dshc-ust-tooltip-title'), 'tooltip 缺标题行');
    assert.ok(tip.querySelector('.dshc-ust-tooltip-row'), 'tooltip 缺明细行');
    assert.ok(tip.className.includes('show'), 'tooltip 应带 show 态');
    await React.act(async () => {
      bar.dispatchEvent(new document.defaultView.MouseEvent('mouseout', { bubbles: true }));
    });
    tip = document.querySelector('.dshc-ust-tooltip');
    assert.equal(tip, null, '移开后 tooltip 应消失');
  } finally {
    await cleanup();
  }
});

test('渲染用量：两个口径分区展示 —— 窗口在正文，进程只在折叠区并各自标注', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const html = app.innerHTML;
    // 正文（KPI/热力/每日/排行）只使用窗口口径，且标注「窗口口径」
    assert.match(html, /窗口口径/, '正文缺窗口口径标注');
    // 落盘路径标注（真实数据边界：重启不清零）
    assert.match(html, /data\/usage\.json/, '缺落盘路径标注');
    // 进程口径折叠区必须标注「重启清零」/「进程累计」
    const proc = app.querySelector('details[data-fold="process"]');
    assert.ok(proc.textContent.includes('进程累计'), '进程折叠区缺「进程累计」标注');
    // **不得**在正文出现进程口径的数字标签（缓存命中率 / TTFB）
    const kpiHead = app.querySelector('.dshc-ust-kpis');
    assert.ok(kpiHead, '缺 KPI 区');
    assert.ok(!kpiHead.textContent.includes('缓存命中率'), 'KPI 区不得混入进程口径指标');
  } finally {
    await cleanup();
  }
});

test('渲染用量：分桶端点缺失时如实降级（不伪装成「加载失败」）', { skip }, async () => {
  const base = fakeRpc(realStatusFixture());
  const rpc = async (endpoint, payload) => {
    if (endpoint === 'getUsage') {
      return { ok: true, value: { available: false, reason: '该网关版本未提供 /v1/stats/buckets（分桶用量不可用）' } };
    }
    return base(endpoint, payload);
  };
  const { cleanup, document } = await mount(rpc);
  try {
    const app = await openUsage(document);
    const html = app.innerHTML;
    assert.match(html, /该网关版本未提供 \/v1\/stats\/buckets/, '缺降级原因');
    assert.ok(!html.includes('加载失败'), '不得把缺端点说成加载失败');
    // KPI 区不渲染（没有数据就不编造）
    assert.equal(app.querySelector('.dshc-ust-kpis'), null, '端点缺失时不得渲染 KPI');
  } finally {
    await cleanup();
  }
});

test('渲染用量：空窗口给引导语，不渲染 NaN / Infinity', { skip }, async () => {
  const base = fakeRpc(realStatusFixture());
  const rpc = async (endpoint, payload) => {
    if (endpoint === 'getUsage') {
      return {
        ok: true,
        value: {
          available: true,
          usage: {
            enabled: true, window: '720h0m0s', degraded: false, now: new Date().toISOString(),
            total: { key: 'total', requests: 0, success: 0, failed: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, credit: 0, avg_latency_ms: 0 },
            buckets: [], by_uid: [], by_realm: [], by_model: [], note: '',
          },
        },
      };
    }
    return base(endpoint, payload);
  };
  const { cleanup, document } = await mount(rpc);
  try {
    const app = await openUsage(document);
    const html = app.innerHTML;
    assert.match(html, /该窗口内没有请求记录/, '空窗口应给引导语');
    assert.ok(html.includes('从落盘那刻开始积累'), '空态应说明数据边界（不是缺陷）');
    assert.ok(!html.includes('NaN'), '空数据不得渲染 NaN');
    assert.ok(!html.includes('Infinity'), '空数据不得渲染 Infinity');
  } finally {
    await cleanup();
  }
});

test('渲染用量：degraded 时警告如实显示，渠道/账号维度仍可用', { skip }, async () => {
  const base = fakeRpc(realStatusFixture());
  const rpc = async (endpoint, payload) => {
    const value = (await base(endpoint, payload)).value;
    if (endpoint === 'getUsage') {
      return { ok: true, value: { available: true, usage: { ...value.usage, degraded: true } } };
    }
    return { ok: true, value };
  };
  const { cleanup, document } = await mount(rpc);
  try {
    const app = await openUsage(document);
    const html = app.innerHTML;
    assert.match(html, /已降级为「槽 × 域」/, '缺降级警告');
    assert.match(html, /不再细分/, '缺降级后果说明');
    // 账号/渠道卡仍渲染（fixture 的 by_uid 有数据）
    assert.ok(app.querySelector('[data-card="accounts"]'), 'degraded 时账号卡应仍渲染');
  } finally {
    await cleanup();
  }
});

test('渲染用量：数字排版纪律 —— 主数字 19px/等宽数位（CSS 声明层面）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const css = app.querySelector('style')?.textContent ?? '';
    assert.match(css, /\.dshc-ust-kpi-v\s*\{[^}]*font-variant-numeric:\s*tabular-nums/, 'KPI 主数字缺等宽数位');
    assert.match(css, /\.dshc-ust-kpi-v\s*\{[^}]*font-size:\s*19px/, 'KPI 主数字应为 19px');
    assert.match(css, /\.dshc-ust-kpi-v\s*\{[^}]*letter-spacing:\s*-.02em/, 'KPI 主数字缺负字距');
  } finally {
    await cleanup();
  }
});

test('渲染用量：卡片浮起层级（bg-layer-1）+ 长名不撑破卡片', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const css = app.querySelector('style')?.textContent ?? '';
    // 卡片必须用 layer-1（白）浮起 —— 用 layer-2 会让卡片「后退」，整页发闷
    assert.match(css, /\.dshc-ust-card\s*\{[^}]*bg-layer-1/, '用量卡缺 layer-1 浮起层级');
    // 长模型名/账号名必须省略号截断（jsdom 不解析注入样式，改为断言声明存在）
    assert.match(css, /\.dshc-mname\s*\{[^}]*text-overflow:\s*ellipsis/, '模型名缺省略号');
    assert.match(css, /\.dshc-ust-rank-name > span:first-child\s*\{[^}]*text-overflow:\s*ellipsis/, '账号名缺省略号');
    assert.match(css, /\.dshc-mrow2-name\s*\{[^}]*text-overflow:\s*ellipsis/, '进程口径模型名缺省略号');
  } finally {
    await cleanup();
  }
});

test('渲染用量：数字入场动效可失败 —— reduced-motion 下直接给终值', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()), { reducedMotion: true });
  try {
    const app = await openUsage(document);
    // 动效被关掉时必须**立即**显示真实值 —— 显示一屏 0 比没有动效糟得多
    const reqCard = [...app.querySelectorAll('.dshc-ust-kpi')].find((c) => c.getAttribute('data-kpi') === 'requests');
    assert.ok(reqCard, '缺请求数卡');
    assert.ok(reqCard.textContent.includes('126'), `reduced-motion 下应显示终值 126，实际 ${reqCard.textContent}`);
  } finally {
    await cleanup();
  }
});

test('渲染用量：不含横向滚动溢出容器（移动端不撑破）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    // 名称列必须定宽 + 省略号（与容器 min-width:0 一起构成防撑破的两半）
    const css = app.querySelector('style')?.textContent ?? '';
    assert.match(css, /\.dshc-ust-rank-name\s*\{[^}]*min-width:\s*0/, '排行名称列缺 min-width:0');
    assert.match(css, /\.dshc-mrow2-name\s*\{[^}]*min-width:\s*0/, '进程口径模型名缺 min-width:0');
    assert.match(css, /\.dshc-ust-kpi-v\s*\{[^}]*overflow:\s*hidden/, 'KPI 主数字缺溢出裁剪');
    // KPI 栅格固定 3 列（两行 × 三列），窄屏降级而不是让卡片被压扁
    assert.match(css, /\.dshc-ust-kpis\s*\{[^}]*repeat\(3/, 'KPI 栅格应为 3 列');
    assert.match(css, /@media \(max-width: 640px\) \{ \.dshc-ust-kpis \{[^}]*repeat\(2/, '窄屏应降为 2 列');
  } finally {
    await cleanup();
  }
});

// ---------------------------------------------------------------------------
// 侧边栏快捷入口（sidebar.footer.action）：rail/wide、四态、popover 账号卡
// ---------------------------------------------------------------------------

/** 侧边栏用的 store 桩：直接给快照，不回 RPC（状态机本身在 quick-entry.test.mjs 里测）。 */
function quickStoreStub({ status, usage, config, phase = 'fresh' } = {}) {
  const listeners = new Set();
  const snapshot = {
    phase,
    status,
    usage,
    config,
    baseURL: 'http://127.0.0.1:7866',
    error: phase === 'error' ? { message: '网关不可达' } : undefined,
    fetchedAt: phase === 'loading' ? 0 : Date.now(),
    failures: phase === 'error' ? 3 : 0,
    degraded: false,
    usageAvailable: usage !== undefined,
    usageAt: usage === undefined ? 0 : Date.now(),
    refreshing: false,
    lastRefreshAt: 0,
  };
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start: () => {},
    loadUsage: () => {},
    loadAux: () => {},
    refreshUpstream: async () => true,
    dispose: () => listeners.clear(),
  };
}

/** 偏好桩（宿主 settingsScope 的等价物）。 */
function prefsStub(value = true, writable = true) {
  return {
    available: true,
    writable,
    mode: 'host',
    value,
    set: async () => true,
    subscribe: () => () => {},
    dispose: () => {},
  };
}

/**
 * 挂载侧边栏入口（真实 jsdom + 真实 React）。
 * @param options - `{wide, status, usage, config, phase, prefs}`。
 * @returns 挂载上下文。
 */
async function mountQuick(options = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    pretendToBeVisual: true,
    url: 'http://127.0.0.1:7866/',
  });
  const { window } = dom;
  const saved = captureGlobals([
    'document', 'window', 'HTMLElement', 'Node', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout',
  ]);
  globalThis.document = window.document;
  globalThis.window = window;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
  window.matchMedia = (query) => ({
    matches: false, media: String(query), onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; },
  });

  const { component, meta } = registeredQuickEntry(async () => ({ ok: false }), window);
  const store = quickStoreStub({
    status: options.status,
    usage: options.usage,
    config: options.config ?? { pool: { max_in_flight: 3 } },
    phase: options.phase,
  });
  const prefs = options.prefs ?? prefsStub(true);
  const container = window.document.getElementById('app');
  let root;
  await React.act(async () => {
    root = ReactDOMClient.createRoot(container);
    root.render(React.createElement(component, {
      wide: options.wide !== false,
      store,
      prefs,
      // 渠道中心面板：由 client/index.js 注入（这里用桩替代真面板，只验弹窗开关）
      centerPanel: options.centerPanel === null
        ? undefined
        : (options.centerPanel ?? function StubCenter() {
            return React.createElement('div', { 'data-stub': 'center' }, '渠道中心桩面板');
          }),
      centerPanelProps: options.centerPanelProps ?? {},
      // 自己的时钟走独立 prop（宿主的 `now` 是数字共享时钟，撞名会 TypeError）
      clock: options.clock ?? Date.now,
      ...(options.nowProp === undefined ? {} : { now: options.nowProp }),
    }));
  });
  await React.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return {
    window,
    document: window.document,
    container,
    meta,
    store,
    cleanup: async () => {
      try {
        await React.act(async () => root.unmount());
      } catch {}
      restoreGlobals(saved);
      dom.window.close();
    },
  };
}

/** 点一次 footer 按钮（打开/收起 popover）。 */
async function clickEntry(document, container) {
  const button = container.querySelector('button[aria-haspopup="dialog"]');
  assert.ok(button, '侧边栏入口必须是带 aria-haspopup 的按钮');
  await React.act(async () => {
    button.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
  });
  await React.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return button;
}

/** 点一个具体元素（jsdom + React 的真实事件路径）。 */
async function clickEl(document, el) {
  await React.act(async () => {
    el.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
  });
  await React.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** 给 document 发一次 keydown（Esc 关闭弹窗那条路径）。 */
async function pressKey(document, key) {
  await React.act(async () => {
    document.dispatchEvent(new document.defaultView.KeyboardEvent('keydown', { key, bubbles: true }));
  });
  await React.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** 模拟一次真实点击：pointerdown 先到（外部点击关闭走这条），随后 click 到（按钮切换走这条）。 */
async function realClick(document, el) {
  await React.act(async () => {
    el.dispatchEvent(new document.defaultView.MouseEvent('pointerdown', { bubbles: true }));
  });
  await clickEl(document, el);
}

test('渲染：宿主注入的数字 now 不会打死入口（真机 TypeError: now is not a function 的回归锁）', { skip }, async () => {
  // 宿主给每个槽位都注入共享时钟，属性名就叫 `now`，值是**数字**。
  // 之前自己的时钟也叫 now（默认 Date.now），被它覆盖后在渲染里 now() → 整条插槽变红框。
  const ctx = await mountQuick({ wide: true, status: realStatusFixture(), nowProp: 1790000000000 });
  try {
    const html = ctx.container.innerHTML;
    assert.ok(html.includes('渠道'), `数字 now 下入口仍须正常渲染，实际：${html.slice(0, 160)}`);
    assert.match(html, /\d+\/\d+ · /, '摘要也要在');
    assert.ok(!html.includes('渠道入口异常'), '不能退化成错误胶囊');
  } finally {
    await ctx.cleanup();
  }
});

test('渲染：入口内部异常被自隔离 —— 出小胶囊而不是让整条插槽变红框', { skip }, async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    pretendToBeVisual: true,
    url: 'http://127.0.0.1:7866/',
  });
  const { window } = dom;
  const saved = captureGlobals(['document', 'window', 'HTMLElement', 'Node', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout']);
  globalThis.document = window.document;
  globalThis.window = window;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
  const { component } = registeredQuickEntry(async () => ({ ok: false }), window);
  const boom = new Error('boom: 故意在渲染里抛错');
  const brokenStore = { getSnapshot: () => { throw boom; }, subscribe: () => () => {}, start: () => {}, loadUsage: () => {}, loadAux: () => {}, refreshUpstream: async () => true, dispose: () => {} };
  const host = window.document.getElementById('app');
  let root;
  try {
    await React.act(async () => {
      root = ReactDOMClient.createRoot(host);
      root.render(React.createElement(component, { wide: true, store: brokenStore, prefs: prefsStub(true) }));
    });
    await React.act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    const html = host.innerHTML;
    assert.ok(html.includes('渠道入口异常'), `应退化为自隔离胶囊，实际：${html.slice(0, 200)}`);
    assert.ok(html.includes('⚠'), '胶囊要带警示图标（一眼可见）');
    const chip = host.querySelector('button');
    assert.match(chip.getAttribute('title'), /boom: 故意在渲染里抛错/, '错误原文要能读到（手机没有控制台）');
  } finally {
    try { await React.act(async () => root.unmount()); } catch {}
    restoreGlobals(saved);
    dom.window.close();
  }
});

test('渲染：入口两态 —— 展开给摘要、收起只留 36px 图标', { skip }, async () => {
  const status = realStatusFixture();
  const wide = await mountQuick({ wide: true, status });
  const rail = await mountQuick({ wide: false, status });
  try {
    const wideHtml = wide.container.innerHTML;
    assert.ok(wideHtml.includes('渠道'), 'wide 态应带标签');
    assert.match(wideHtml, /\d+\/\d+ · /, 'wide 态应显示「健康/总数 · 可用积分」摘要');
    assert.ok(wideHtml.includes('<svg'), '应画出入口图标（不依赖 emoji）');
    // 收起态：只留 36px 图标（与宿主 lc-ov-entry-rail 同尺寸），不放摘要数字（56px 放不下）。
    const railHtml = rail.container.innerHTML;
    assert.ok(railHtml.includes('<svg'), '收起态要有图标');
    assert.ok(!/\d+\/\d+ · /.test(railHtml), '收起态不放摘要数字');
    // jsdom 没有布局（rect 恒 0），尺寸断言看内联样式
    const railBtn = rail.container.querySelector('button');
    assert.equal(railBtn.style.minWidth, '36px', '收起态尺寸与宿主 lc-ov-entry-rail 对齐（36px）');
    assert.equal(railBtn.style.height, '36px');
  } finally {
    await wide.cleanup();
    await rail.cleanup();
  }
});

test('渲染：卡片化骨架 —— 健康环 / 3px 渠道条 / 分隔线都在，且缺数据时如实退化', { skip }, async () => {
  const status = realStatusFixture();
  const wide = await mountQuick({ wide: true, status });
  const empty = await mountQuick({ wide: true, status: { accounts: [], total: 0, healthy: 0 } });
  try {
    const card = wide.container.querySelector('.dshc-entry-card');
    assert.ok(card, '展开态主按钮必须是卡片（.dshc-entry-card）');
    // 左侧 3px 健康色条 + 底部 3px 渠道条 + 右侧图标按钮的分隔线
    const strips = [...card.querySelectorAll('span[aria-hidden="true"]')];
    assert.ok(strips.some((s) => s.style.width === '3px' && s.style.height === ''), '要有左侧 3px 健康色条');
    assert.ok(strips.some((s) => s.style.height === '3px' && s.style.bottom === '0px'), '要有底部 3px 渠道堆叠条');
    // 渠道中心图标按钮必须**在卡片内部**（用户反馈：摆在卡片外面看着像两块拼在一起）
    const iconBtn = wide.container.querySelector('button[aria-label="打开渠道中心"]');
    assert.ok(iconBtn, '要有渠道中心图标按钮');
    assert.equal(card.contains(iconBtn), true, '渠道中心图标按钮必须框在卡片内');
    assert.equal(iconBtn.parentElement, card, '图标按钮要直接挂在卡片上（不再是卡片外的兄弟盒子）');
    assert.equal(wide.container.querySelector('[data-dshc-entry="row"] span[style*="width: 1px"]') !== null, true, '卡内两个点击区之间要有 1px 分隔线');
    // 两个点击区都在卡内：主按钮 + 图标按钮
    assert.equal(card.contains(card.querySelector('button[aria-label="渠道账号"]')), true, '主按钮也在卡内');
    // 健康环：16px svg + role=img 语义
    const ring = card.querySelector('[role="img"]');
    assert.ok(ring, '有账号时要渲染健康环');
    assert.equal(ring.getAttribute('aria-label'), `账号 ${status.healthy}/${status.total} 健康`);
    assert.equal(ring.querySelector('svg')?.getAttribute('width'), '16', '健康环宽度 16px');
    // 退化：没有账号时不画环、不画渠道条（卡片骨架与分隔线仍在，不出现 NaN 宽度）
    const emptyCard = empty.container.querySelector('.dshc-entry-card');
    assert.ok(emptyCard, '没账号也要有卡片骨架');
    assert.equal(emptyCard.querySelector('[role="img"]'), null, '没账号时不画健康环');
    assert.equal([...emptyCard.querySelectorAll('span[aria-hidden="true"]')].some((s) => s.style.height === '3px'), false, '没账号时不画渠道条');
    assert.ok(empty.container.innerHTML.includes('无账号'), '没账号时如实写「无账号」');
  } finally {
    await wide.cleanup();
    await empty.cleanup();
  }
});

test('渲染：入场动效可失败 —— 健康环/渠道条最终必须落到真值（不停在 0 或中间态）', { skip }, async () => {
  const ctx = await mountQuick({ wide: true, status: realStatusFixture(), usage: usageFixture() });
  try {
    // 入场动效 520ms + 150ms 兜底；等过头一点再断言终态
    await React.act(async () => { await new Promise((resolve) => setTimeout(resolve, 900)); });
    const status = realStatusFixture();
    const card = ctx.container.querySelector('.dshc-entry-card');
    const arc = card.querySelector('svg circle:nth-of-type(2)');
    const [drawn, full] = (arc.getAttribute('stroke-dasharray') || '').split(' ').map(Number);
    assert.ok(full > 0, '环要有周长');
    const want = full * (status.healthy / status.total);
    assert.ok(Math.abs(drawn - want) < 0.5, `环必须扫到健康占比（${status.healthy}/${status.total}），实际 ${drawn}/${full}`);
    const ringHost = card.querySelector('[role="img"]');
    assert.equal(Number(ringHost.style.opacity), 1, '环的入场淡入要落到 1');
    const bar = [...card.querySelectorAll('span')].find((s) => s.style.height === '3px' && s.style.bottom === '0px');
    assert.equal(Number(bar.style.opacity), 1, '渠道条淡入要落到 1');
    const segs = [...bar.children].map((c) => Number.parseFloat(c.style.width));
    assert.ok(segs.length >= 1, '至少一段（fixture 只有一个渠道）');
    assert.ok(segs.every((w) => w > 0), `每段宽度都要长出真值，实际 ${JSON.stringify(segs)}`);
    const sum = segs.reduce((acc, w) => acc + w, 0);
    assert.ok(sum > 95 && sum <= 100.5, `各段合计应接近 100%，实际 ${sum}`);
  } finally {
    await ctx.cleanup();
  }
});

test('渲染：入口点击可开可收（第二下必须关上）—— pointerdown 抢关 + click 再开的回归锁', { skip }, async () => {
  const ctx = await mountQuick({ wide: true, status: realStatusFixture(), usage: usageFixture() });
  try {
    const btn = ctx.container.querySelector('button[aria-label="渠道账号"]');
    await realClick(ctx.document, btn);
    assert.equal(ctx.document.querySelectorAll('.dshc-quick-pop').length, 1, '第一下应打开账号池浮层');
    assert.equal(btn.getAttribute('aria-expanded'), 'true');
    await realClick(ctx.document, btn);
    assert.equal(ctx.document.querySelectorAll('.dshc-quick-pop').length, 0, '第二下应关上（不能被 pointerdown 关了又被 click 打开）');
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    await realClick(ctx.document, btn);
    assert.equal(ctx.document.querySelectorAll('.dshc-quick-pop').length, 1, '第三下应再次打开');
    // 点浮层外面仍然要关（这条路径是 pointerdown 负责的，别把外部点击一起放行了）
    await React.act(async () => {
      ctx.document.body.dispatchEvent(new ctx.document.defaultView.MouseEvent('pointerdown', { bubbles: true }));
    });
    assert.equal(ctx.document.querySelectorAll('.dshc-quick-pop').length, 0, '点外部应关闭');
  } finally {
    await ctx.cleanup();
  }
});

test('渲染：入口 popover 显示汇总与账号卡（可用积分/渠道/在途/到期）', { skip }, async () => {
  const ctx = await mountQuick({
    wide: true,
    status: realStatusFixture(),
    usage: usageFixture(),
    config: { pool: { max_in_flight: 3, max_in_flight_global: 1 } },
  });
  try {
    await clickEntry(ctx.document, ctx.container);
    const body = ctx.document.body.innerHTML;
    assert.ok(body.includes('渠道账号'), 'popover 头部标题');
    assert.ok(body.includes('可用积分'), '要有可用积分统计块');
    assert.ok(body.includes('近 24h'), '要有近 24h 统计块（滚动窗口）');
    assert.ok(body.includes('甲'), '账号昵称应出现在账号卡里');
    assert.ok(body.includes('在途占满') || body.includes('在途'), '在途维度要有呈现');
    // 底栏「渠道中心」按钮：用查询断言（body.includes 会被 QUICK_CSS 注释里的同名字样误判）
    const centerBtn = [...ctx.document.querySelectorAll('button')].find((b) => b.textContent.trim() === '渠道中心');
    assert.ok(centerBtn, 'popover 底栏要有「渠道中心」入口');
    assert.equal(ctx.document.querySelectorAll('[role="dialog"]').length, 1, 'popover 必须 portal 到 body 且是 dialog');
    // 免横向滚动：根节点不得出现横向 overflow
    const dialog = ctx.document.querySelector('[role="dialog"]');
    assert.equal(dialog.style.overflowX, '', '浮层不做横向滚动');
  } finally {
    await ctx.cleanup();
  }
});

test('渲染：渠道中心弹窗 —— 右侧图标按钮打开、Esc 关闭；没有面板组件时不渲染', { skip }, async () => {
  const ctx = await mountQuick({
    wide: true,
    status: realStatusFixture(),
    usage: usageFixture(),
  });
  try {
    // 入口行最右端有一枚无文字图标按钮
    const iconBtn = ctx.container.querySelector('button[aria-label="打开渠道中心"]');
    assert.ok(iconBtn, '要有「打开渠道中心」图标按钮');
    assert.equal(iconBtn.textContent.trim(), '', '图标按钮不带文字');
    assert.ok(!ctx.document.querySelector('[aria-label="渠道中心"]'), '未点击时不该有弹窗');
    await clickEl(ctx.document, iconBtn);
    const dialog = ctx.document.querySelector('[role="dialog"][aria-label="渠道中心"]');
    assert.ok(dialog, '点击后应出现渠道中心弹窗');
    assert.ok(dialog.textContent.includes('渠道中心桩面板'), '弹窗里应渲染注入的面板组件');
    await pressKey(ctx.document, 'Escape');
    assert.ok(!ctx.document.querySelector('[aria-label="渠道中心"]'), 'Esc 应关闭弹窗');
  } finally {
    await ctx.cleanup();
  }
});

test('渲染：没注入面板组件时不渲染弹窗（能力缺失就如实不显示，不留死按钮）', { skip }, async () => {
  const ctx = await mountQuick({
    wide: true,
    status: realStatusFixture(),
    usage: usageFixture(),
    centerPanel: null,
  });
  try {
    await clickEntry(ctx.document, ctx.container);
    assert.ok(ctx.document.body.textContent.includes('可用积分'), '入口本身照常工作');
    // 用查询断言而不是 body.includes('渠道中心')：QUICK_CSS 的注释里也含这四个字
    assert.equal(ctx.document.querySelector('button[aria-label="打开渠道中心"]'), null, '没有面板组件时不渲染图标按钮');
    const footerBtn = [...ctx.document.querySelectorAll('button')].find((b) => b.textContent.trim() === '渠道中心');
    assert.equal(footerBtn, undefined, '没有面板组件时不渲染 popover 底栏的「渠道中心」按钮');
  } finally {
    await ctx.cleanup();
  }
});

test('渲染：网关不可达时如实说「不可达」，不显示 0 假数据', { skip }, async () => {
  const ctx = await mountQuick({ wide: true, phase: 'error' });
  try {
    await clickEntry(ctx.document, ctx.container);
    const body = ctx.document.body.innerHTML;
    assert.ok(body.includes('网关不可达'), '错误态文案');
    assert.ok(body.includes('127.0.0.1:7866'), '带上地址便于排查');
    assert.ok(!body.includes('可用积分'), '错误态不显示积分块（避免 0 冒充数据）');
  } finally {
    await ctx.cleanup();
  }
});

test('渲染：偏好关闭 → 按钮不渲染（配置 Tab 的开关直接生效，不需重启）', { skip }, async () => {
  const ctx = await mountQuick({ wide: true, status: realStatusFixture(), prefs: prefsStub(false) });
  try {
    assert.equal(ctx.container.innerHTML, '', '偏好关闭时入口必须整体消失');
  } finally {
    await ctx.cleanup();
  }
});

test('渲染：配置 Tab 出现「界面」开关，且网关配置不可读时依然在', { skip }, async () => {
  // 复用面板挂载，但让 getConfig 失败（configInfo.ok === false 的错误分支）
  const rpc = fakeRpc(realStatusFixture());
  const original = rpc;
  const failing = async (endpoint, payload) => {
    if (endpoint === 'getConfig') return { ok: true, value: { ok: false, code: 'config-not-found', message: '未找到网关 config.json', candidates: ['/a', '/b'] } };
    return original(endpoint, payload);
  };
  const { cleanup, document } = await mount(failing);
  try {
    await clickTab(document, '配置');
    const html = document.getElementById('app').innerHTML;
    assert.ok(html.includes('界面'), '配置 Tab 要有「界面」分组');
    assert.ok(html.includes('在侧边栏左下角显示渠道入口'), '开关文案');
    assert.ok(html.includes('未找到网关 config.json'), '错误分支仍然渲染（否则用户无法关掉入口）');
  } finally {
    await cleanup();
  }
});

test('渲染模型 Tab：只读目录判定列 + 刷新能力目录（不改配置）', { skip }, async () => {
  const rpc = fakeRpc(realStatusFixture());
  const { cleanup, document } = await mount(rpc);
  try {
    await clickTab(document, '模型');
    // 让回显（getModelRecord）与比对（getModelCatalog）两个 effect 落地
    await React.act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    const html = document.getElementById('app').innerHTML;

    assert.ok(html.includes('目录判定'), '表头要有「目录判定」列');
    assert.ok(html.includes('刷新能力目录'), '工具栏要有「刷新能力目录」按钮');
    assert.ok(html.includes('能力目录：'), '要有目录快照摘要行');
    assert.ok(html.includes('3759 个模型名'), '摘要要带真实目录规模');

    // 三态标注都要渲染出来
    assert.ok(html.includes('目录确认'), '确认态');
    assert.ok(html.includes('借判·待确认'), '借判态');
    assert.ok(html.includes('档位别名'), '别名态');
    assert.ok(html.includes('原厂'), '来源等级要显示');

    // 打开面板只读缓存：打了 getModelRecord + getModelCatalog，绝不打刷新端点
    const endpoints = rpc.calls.map((call) => call.endpoint);
    assert.ok(endpoints.includes('getModelRecord'), '回显上次拉取');
    assert.ok(endpoints.includes('getModelCatalog'), '做一次只读比对');
    assert.ok(!endpoints.includes('refreshModelCatalog'), '打开面板不得联网刷新目录');

    // 点「刷新能力目录」→ 才走 refreshModelCatalog
    const refreshBtn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('刷新能力目录'));
    assert.ok(refreshBtn, '找不到刷新按钮');
    await React.act(async () => {
      refreshBtn.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    await React.act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    assert.ok(rpc.calls.map((call) => call.endpoint).includes('refreshModelCatalog'), '点击后要走刷新端点');
  } finally {
    await cleanup();
  }
});

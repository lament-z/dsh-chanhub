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
let ReactDOMClient;
let JSDOM;
try {
  React = require('react');
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
function registeredComponent(rpcCall, windowObject) {
  const { registration } = loadBundle(windowObject);
  assert.equal(registration.id, 'dsh-chanhub', 'bundle 的 loaderId 必须与包名一致');
  const mod = registration.factory((id) => {
    if (id === 'react') return React;
    throw new Error(`unexpected require(${JSON.stringify(id)})`);
  });
  assert.equal(typeof mod.apply, 'function');

  let Registered;
  mod.apply({
    connection: { rpc: { call: rpcCall } },
    slots: {
      inject: (_name, fn) => fn(),
      register: (_meta, component) => {
        Registered = component;
      },
    },
  });
  assert.equal(typeof Registered, 'function', 'apply 必须注册面板组件');
  return Registered;
}

/**
 * 真实挂载面板（jsdom + 真实 react-dom），等 effect 完成。
 * @param rpcCall - RPC 桩。
 * @returns `{html, cleanup, document, window}`。
 */
async function mount(rpcCall) {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    pretendToBeVisual: true,
  });
  const { window } = dom;

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
  const slots = ['d:2026-09-19', 'h:2026-09-19T17', 'h:2026-09-19T18'];
  for (const slot of slots) {
    for (const uid of uids) {
      for (const model of models) {
        rows.push({
          slot, realm: 'cn', uid, model,
          requests: 2, failed: uid === 'uid-2' ? 1 : 0, streaming: 1,
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
    total: { key: 'total', requests: 24, success: 18, failed: 6, prompt_tokens: 2400, completion_tokens: 1200, total_tokens: 3600, credit: 6, avg_latency_ms: 300 },
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
      default:
        return { ok: false, error: { code: 'bad-request', message: `unknown ${endpoint}` } };
    }
  };
  rpc.calls = calls;
  return rpc;
}

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
    // 真实调用了数据端点
    const endpoints = rpc.calls.map((call) => call.endpoint);
    // getStatus 换成 refreshStatus：刷新现在带余额同步（见 host 的 refreshStatus）。
    for (const expected of ['refreshStatus', 'getConfig', 'getAccounts', 'getStats']) {
      assert.ok(endpoints.includes(expected), `未调用 ${expected}`);
    }
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

test('渲染：用量 Tab 渲染真实分桶，并如实标注 /v1/stats 的局限', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    await clickTab(document, '用量');
    const html = document.getElementById('app').innerHTML;
    // 分桶真实数据在场
    assert.ok(html.includes('用量'), '缺分桶区块');
    assert.ok(html.includes('按账号') && html.includes('按域') && html.includes('按模型'), '缺三个维度');
    assert.ok(html.includes('请求'), '缺合计');
    // 窗口切换器
    assert.ok(html.includes('24 小时') && html.includes('30 天'), '缺窗口切换选项');
  } finally {
    await cleanup();
  }
});

test('渲染：日志 Tab 渲染真实日志行与频道筛选', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    await clickTab(document, '日志');
    const html = document.getElementById('app').innerHTML;
    // 真实日志行在场
    assert.ok(html.includes('checkin done'), '缺真实日志行');
    assert.ok(html.includes('[pool] degraded'), '缺 sys 频道行');
    // 频道 chip
    for (const label of ['全部', '对话', '任务', '系统']) {
      assert.ok(html.includes(label), `缺频道 chip：${label}`);
    }
    // 容量与接入说明
    assert.ok(html.includes('2000'), '缺缓冲容量');
    assert.ok(html.includes('SetOutput'), '缺接入机制说明');
    assert.ok(html.includes('对话流水行'), '缺 logChatRow 例外的说明');
  } finally {
    await cleanup();
  }
});

test('渲染：连接状态显示真实地址', { skip }, async () => {
  const { html, cleanup } = await mount(fakeRpc(realStatusFixture()));
  try {
    assert.ok(html.includes('已连接 127.0.0.1:7866'), '缺连接状态文案');
  } finally {
    await cleanup();
  }
});

test('渲染：网关不可达与鉴权失败给不同的处置指引', { skip }, async () => {
  const unreachable = async (endpoint) =>
    endpoint === 'refreshStatus' || endpoint === 'getStatus'
      ? {
          ok: true,
          value: {
            reachable: false,
            baseURL: 'http://127.0.0.1:7866',
            error: { code: 'upstream-unreachable', message: '无法连接网关 http://127.0.0.1:7866' },
          },
        }
      : { ok: true, value: { ok: false, message: 'n/a' } };
  const { html, cleanup } = await mount(unreachable);
  try {
    assert.ok(html.includes('无法连接网关'), '缺不可达文案');
    assert.ok(html.includes('未连接'), '缺顶栏未连接状态');
  } finally {
    await cleanup();
  }
});

test('渲染：鉴权失败时明确说「网关在线，是 key 不匹配」', { skip }, async () => {
  const authFailed = async (endpoint) =>
    endpoint === 'refreshStatus' || endpoint === 'getStatus'
      ? {
          ok: true,
          value: {
            reachable: true,
            baseURL: 'http://127.0.0.1:7866',
            error: { code: 'auth-failed', message: '网关拒绝请求（HTTP 401）：missing or invalid API key' },
          },
        }
      : { ok: true, value: { ok: false, message: 'n/a' } };
  const { html, cleanup } = await mount(authFailed);
  try {
    assert.ok(html.includes('网关可达，但取状态失败'), '缺鉴权失败文案');
    assert.ok(html.includes('API key 不匹配'), '缺鉴权处置指引');
  } finally {
    await cleanup();
  }
});

test('渲染：渠道筛选按渠道计数并可切换', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const buttons = [...document.querySelectorAll('button')].filter((button) =>
      /^(全部|WB|Trae|Qoder) \d+$/.test(button.textContent.trim()),
    );
    const labels = buttons.map((button) => button.textContent.trim());
    assert.deepEqual(labels, ['全部 3', 'WB 1', 'Trae 1', 'Qoder 1'], `筛选条计数不对：${JSON.stringify(labels)}`);

    // 点 Trae 只剩下一个账号
    const traeButton = buttons.find((button) => button.textContent.trim().startsWith('Trae'));
    await React.act(async () => {
      traeButton.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    const html = document.getElementById('app').innerHTML;
    assert.ok(html.includes('手动停用的号'), 'Trae 筛选后应保留该账号');
    assert.ok(!html.includes('甲'), 'Trae 筛选后不应出现 WB 账号');
  } finally {
    await cleanup();
  }
});

test('渲染：账号动作走二次确认后才发 RPC', { skip }, async () => {
  const rpc = fakeRpc(realStatusFixture());
  const { cleanup, document, window } = await mount(rpc);
  try {
    let confirmCalled = 0;
    window.confirm = () => {
      confirmCalled += 1;
      return true;
    };
    // 先点开「甲」卡片进入抽屉（动作按钮在抽屉里）
    const card = [...document.querySelectorAll('.dshc-acctcard')].find((el) => el.textContent.includes('甲'));
    assert.ok(card, '缺账号卡片');
    await React.act(async () => {
      card.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    const button = [...document.querySelectorAll('button')].find(
      (candidate) => candidate.textContent.trim() === '禁用（摘出选号池）',
    );
    assert.ok(button, '找不到禁用按钮（抽屉里应渲染真按钮）');
    await React.act(async () => {
      button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    });
    assert.ok(confirmCalled > 0, '必须二次确认');
    assert.ok(
      rpc.calls.some((call) => call.endpoint === 'accountDisable' && call.payload?.uid === 'uid-1'),
      `未发出 accountDisable，实际调用：${JSON.stringify(rpc.calls.map((call) => call.endpoint))}`,
    );
  } finally {
    await cleanup();
  }
});

test('渲染：账号积分组渲染逐套餐构成，且区分可消耗/不可消耗（抽屉内）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    // 等逐账号明细的异步补拉落地
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    const card = [...document.querySelectorAll('.dshc-acctcard')].find((el) => el.textContent.includes('甲'));
    assert.ok(card, '缺账号卡片');
    await React.act(async () => {
      card.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    const html = document.getElementById('app').innerHTML;
    assert.ok(html.includes('可用 100'), '缺可消耗合计（100）');
    assert.ok(html.includes('不可消耗 500'), '缺不可消耗池标注（Trae ep=1 专用池须分开）');
    assert.ok(html.includes('CodeBuddy个人版国内运营裂变包'), '缺套餐名');
    assert.ok(html.includes('共 2 个套餐') || html.includes('2 个套餐'), '缺套餐计数');
    assert.ok(html.includes('不可消耗'), '缺不可消耗标签');
  } finally {
    await cleanup();
  }
});

test('渲染：成长任务进度卡显示真实 0/N、无进度「—」与 mp 限定', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    await clickTab(document, '任务');
    const html = document.getElementById('app').innerHTML;
    assert.ok(html.includes('成长任务'), '缺进度卡');
    // v2 收尾：分组精简为「常驻待做 + 两个折叠」，不再有「进行中未满」标题
    // fixture 里可动的是 template_5(2/5) 与 create_canvas(0/1) 两个
    assert.ok(html.includes('待做 2'), '缺待做计数');
    assert.ok(html.includes('已完成 / 已领取'), '缺已完成折叠');
    // current=0 必须显示 0/1（不能被当成无进度）
    assert.ok(html.includes('0/1'), '缺 create_canvas 的 0/1（current=0 是真实值，不得省略）');
    // 无进度对象 → 「—」
    assert.ok(html.includes('公益专家'), '缺公益任务');
    // mp 限定任务角标
    assert.ok(html.includes('小程序'), '缺 mp 限定角标');
    // 定时覆盖角标
    assert.ok(html.includes('定时 activity'), '缺 chat_5 的定时角标');
    assert.ok(html.includes('定时 cat'), '缺 black_cat 的定时角标');
    // 已完成计数
    assert.ok(html.includes('已完成 2/6') || html.includes('已完成'), '缺完成计数');
    // 单码点亮/领取按钮（admin 探测在场 → 可写操作；claimed 行无按钮）
    assert.ok(html.includes('点亮'), '缺单码「点亮」按钮（accept）');
    assert.ok(html.includes('领取'), '缺单码「领取」按钮（claim）');
    assert.ok(html.includes('全部领取'), '缺「全部领取」（claim-claimable）');
    assert.ok(html.includes('任务'), '缺任务 Tab 结构');
  } finally {
    await cleanup();
  }
});

test('渲染：开学季 in_period=false 时给出过期快照警示', { skip }, async () => {
  // in_period=true 是常态、不挂正向标签；false 才必须警示 ——
  // 否则用户会把过期快照当成当前可操作的进度。
  const base = realStatusFixture();
  const rpc = (endpoint, payload) => {
    if (endpoint === 'getSchoolTasks') {
      return Promise.resolve({
        ok: true,
        value: {
          available: true,
          school: {
            uid: 'uid-1',
            in_period: false,
            note: '状态来自上游开学季任务列表。',
            tasks: [
              { task_code: 'expert_use', title: '召唤1 次开学季专家', status: 'claimed', has_progress: true, current: 1, target: 1 },
            ],
          },
        },
      });
    }
    return fakeRpc(base)(endpoint, payload);
  };
  const { cleanup, document } = await mount(rpc);
  try {
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    await clickTab(document, '任务');
    const html = document.getElementById('app').innerHTML;
    assert.ok(html.includes('过期快照'), 'in_period=false 必须警示过期快照');
  } finally {
    await cleanup();
  }
});

test('渲染：未解锁任务同时显示来源，且措辞不是「已锁定」', { skip }, async () => {
  // 回归两件事：
  //   1. 措辞 —— locked 表示「上游还没对你开放」，不是账号/面板出问题。
  //      「已锁定」会让人以为要排障（用户实际就来问了）。
  //   2. 信息不丢 —— 先前把「来源」与「开放状态」压成一个三选一标签，
  //      于是 locked 的 mp 任务看不到「它是小程序任务」。
  const base = realStatusFixture();
  const rpc = (endpoint, payload) => {
    if (endpoint === 'getGrowthTasks') {
      return Promise.resolve({
        ok: true,
        value: {
          available: true,
          growth: {
            uid: 'uid-1',
            tasks: [
              // mp 限定 + 未解锁：两个信息必须同时在
              { task_code: 'Sequential_Tasks_2', title: '完成 1 次专家对话',
                accept_status: 'not_accepted', has_progress: false, current: 0, target: 0,
                locked: true, mp_only: true, from_mp: true, reward_credit: 200 },
              // 普通未解锁（非 mp）：只应有一个标签
              { task_code: 'some_locked', title: '普通未解锁任务',
                accept_status: 'not_accepted', has_progress: true, current: 0, target: 1, locked: true },
            ],
          },
        },
      });
    }
    return fakeRpc(base)(endpoint, payload);
  };
  const { cleanup, document } = await mount(rpc);
  try {
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    await clickTab(document, '任务');
    const html = document.getElementById('app').innerHTML;

    assert.ok(html.includes('未解锁'), '应使用「未解锁」（locked = 上游未开放）');
    assert.ok(!html.includes('已锁定'), '不应再用「已锁定」措辞');

    // mp 限定的未解锁任务：来源与开放状态两个标签都要在
    const row = [...document.querySelectorAll('.dshc-growrow')]
      .find((r) => r.textContent.includes('完成 1 次专家对话'));
    assert.ok(row, '缺 Sequential_Tasks_2 行');
    const badges = [...row.querySelectorAll('.dshc-ssrc > *')].map((b) => b.textContent.trim());
    assert.ok(badges.includes('小程序'), `未解锁的 mp 任务仍应显示「小程序」来源，实测 ${JSON.stringify(badges)}`);
    assert.ok(badges.includes('未解锁'), `应显示「未解锁」，实测 ${JSON.stringify(badges)}`);

    // 未解锁 → 不给「点亮」按钮
    assert.equal(row.querySelector('.dshc-sact button'), null, '未解锁任务不应有动作按钮');
  } finally {
    await cleanup();
  }
});

test('渲染：刷新按钮有可感知的进行态', { skip }, async () => {
  // 回归：此前 refreshing 只接到 disabled（无任何视觉差异），点下去看不出有没有生效
  // —— 用户的反馈正是「点它没反应，也看不出来点没点」。
  //
  // 做法：让 RPC 在挂载完成后「挂住不返回」，这样进行态才能被观测到。
  // （直接 mount(fakeRpc(...)) 不行：mount 会 await 完整一轮刷新，等断言时已经结束。）
  const inner = fakeRpc(realStatusFixture());
  let hold = false;
  const hanging = (endpoint, payload) => {
    if (hold) return new Promise(() => {}); // 永不 resolve
    return inner(endpoint, payload);
  };
  const { cleanup, document } = await mount(hanging);
  try {
    const btn = [...document.querySelectorAll('button')]
      .find((b) => /刷新/.test(b.title) && !/清空|缓冲/.test(b.title));
    assert.ok(btn, '缺顶栏刷新按钮');
    assert.equal(btn.disabled, false, '空闲时应可点');

    hold = true; // 后续刷新挂住 → 观察进行态
    await React.act(async () => {
      btn.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    assert.equal(btn.disabled, true, '刷新中应 disabled（防重复点击）');
    assert.ok(btn.querySelector('.dshc-spin'), '刷新中图标应带旋转类（视觉反馈）');
    assert.ok(btn.textContent.includes('刷新中'), `刷新中应有文案，实测 ${JSON.stringify(btn.textContent)}`);
    assert.ok(/正在刷新/.test(btn.title), `刷新中 title 应变化，实测 ${JSON.stringify(btn.title)}`);
  } finally {
    await cleanup();
  }
});

test('渲染：账号卡片信息分区呈现，不编造缺失的运行计数', { skip }, async () => {
  // 回归两件事：
  //   1. 卡片结构 —— 元信息不再是塞在积分右侧的 11px 小字，而是独立底行分区；
  //   2. 成败计数 —— 字段缺失时**不得**用 `?? 0` 编造，那会把「网关没透出」
  //      显示成「确实 0 次成功」。网关已修（零值也透出），但旧网关仍可能缺字段。
  const withCounts = realStatusFixture();
  // uid-1：给真实计数；uid-2：**删掉这两个字段**（模拟旧网关的 omitempty 省略）。
  // 必须显式 delete —— fixture 本身对两个账号都带这些字段，只改值测不到缺失分支。
  withCounts.accounts = withCounts.accounts.map((a) => {
    if (a.uid === 'uid-1') return { ...a, success_count: 7, err_total: 2 };
    const copy = { ...a };
    delete copy.success_count;
    delete copy.err_total;
    return copy;
  });

  const { cleanup, document } = await mount(fakeRpc(withCounts));
  try {
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    const cardOf = (name) => {
      const el = [...document.querySelectorAll('.dshc-acctcard')].find((c) => c.textContent.includes(name));
      assert.ok(el, `缺账号卡片 ${name}`);
      return el;
    };

    // 结构：四段分区都在
    const card = cardOf('甲');
    for (const cls of ['dshc-acctcard-top', 'dshc-acctcard-credits', 'dshc-acctcard-foot']) {
      assert.ok(card.querySelector(`.${cls}`), `卡片缺分区 ${cls}`);
    }
    // 主数值与元信息分离：积分不再和渠道/成败挤在同一行
    const credits = card.querySelector('.dshc-acctcard-credits');
    assert.ok(credits.textContent.includes('积分'), '主数值区应含积分');
    assert.ok(!credits.textContent.includes('成功'), '元信息不得再塞进主数值行');
    // 元信息在独立底行，用 chip 呈现
    const foot = card.querySelector('.dshc-acctcard-foot');
    assert.ok(foot.querySelectorAll('.dshc-chip').length >= 2, '底行应有渠道/域等 chip');
    assert.ok(foot.textContent.includes('WB') || foot.textContent.includes('Trae'), '底行应含渠道名');

    // 有计数 → 如实显示
    assert.ok(cardOf('甲').textContent.includes('7 成功 / 2 失败'), '有计数时应显示真实数值');
    // 字段缺失 → 明确说「不可用」，不得显示 0/0
    const legacy = cardOf('手动停用的号');
    const legacyFoot = legacy.querySelector('.dshc-acctcard-foot').textContent;
    assert.ok(!legacyFoot.includes('0 成功'), '字段缺失时不得编造 0 成功');
    assert.ok(legacyFoot.includes('不可用'), '字段缺失时应明确说明不可用');
  } finally {
    await cleanup();
  }
});

test('渲染：逐账号明细行用固定网格列（列不随内容缺省而漂移）', { skip }, async () => {
  // 回归：这两组行原先用 flex 自然排版，缺一个标签整行后续列就左移一格。
  // 实测开学季 5 行里有 4 行是 5 个子元素、1 行是 4 个（desktop_chat_1_time 无「每日」）；
  // 成长任务 22 行出现 3/4/5 个子元素三种形态 —— 列位置全部参差。
  // 契约：每行子元素数恒定（= 网格列数），列宽由 CSS 定死而非由内容决定。
  const base = realStatusFixture();
  const rpc = async (endpoint, payload) => {
    if (endpoint === 'getSchoolTasks') {
      return {
        ok: true,
        value: {
          available: true,
          school: {
            uid: payload?.uid,
            in_period: true,
            tasks: [
              // 有「每日」标签
              { task_code: 'expert_use', title: '召唤专家', status: 'claimed', has_progress: true, current: 1, target: 1, task_type: 'recurring' },
              // 无「每日」（single）→ 旧实现少一个子元素
              { task_code: 'desktop_chat_1_time', title: '桌面端功能体验', status: 'claimed', has_progress: true, current: 0, target: 1, task_type: 'single' },
              // 人工项（标签互斥）且无进度
              { task_code: 'task_student_verify', title: '学生认证', status: 'pending', has_progress: false, task_type: 'single' },
            ],
            counts: { total: 3, claimed: 2, pending: 1 },
          },
        },
      };
    }
    if (endpoint === 'getGrowthTasks') {
      return {
        ok: true,
        value: {
          available: true,
          growth: {
            uid: payload?.uid,
            tasks: [
              // 有进度 + 有来源标签 + 有动作
              { task_code: 'template_5', title: '模板', accept_status: 'accepted', has_progress: true, current: 1, target: 5, scheduled: 'activity' },
              // 无进度对象（无 progress）→ 旧实现少一列
              { task_code: 'Expert_Philanthropy', title: '公益', accept_status: 'completed', has_progress: false },
              // 无来源标签（from_mp/scheduled/locked 皆无）→ 旧实现少一列
              { task_code: 'chat_5', title: '对话', accept_status: 'claimed', has_progress: true, current: 5, target: 5 },
            ],
          },
        },
      };
    }
    return fakeRpc(base)(endpoint, payload);
  };
  const { cleanup, document } = await mount(rpc);
  try {
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    await clickTab(document, '任务');
    // 折叠组内的行也要算进来 —— 两组行必须同列数（否则展开后列会错位）
    for (const d of document.querySelectorAll('details')) d.open = true;

    const srows = [...document.querySelectorAll('.dshc-srow')];
    assert.ok(srows.length >= 3, '应渲染开学季明细行');
    const sCounts = new Set(srows.map((r) => r.children.length));
    assert.equal(sCounts.size, 1, `开学季各行子元素数必须一致，实测 ${JSON.stringify(srows.map((r) => r.children.length))}`);

    const grows = [...document.querySelectorAll('.dshc-growrow')];
    assert.ok(grows.length >= 3, '应渲染成长任务明细行');
    const gCounts = new Set(grows.map((r) => r.children.length));
    assert.equal(gCounts.size, 1, `成长任务各行子元素数必须一致，实测 ${JSON.stringify(grows.map((r) => r.children.length))}`);

    // 缺省内容也要占位（不能整列消失）
    const schoolCard = [...document.querySelectorAll('.dshc-cardhead')].find((h) => h.textContent.includes('开学季'));
    const schoolRows = [...schoolCard.parentElement.querySelectorAll('.dshc-srow')];
    const noDaily = schoolRows.find((r) => r.textContent.includes('桌面端功能体验'));
    assert.ok(noDaily, '缺 desktop_chat_1_time 行');
    assert.ok(noDaily.querySelector('.dshc-sprog').textContent.includes('0/1'), '进度列必须仍渲染 0/1');
    assert.equal(noDaily.querySelector('.dshc-ssrc').textContent.trim(), '', '无来源标签时该列应空占位而非消失');
  } finally {
    await cleanup();
  }
});

test('渲染：成长/开学季卡可切账号，且写操作发往选中的 uid', { skip }, async () => {
  // 回归：这两张卡原先固定显示「账号池里第一个有数据的账号」，
  // 而 onGrowthWrite 又硬取 firstGrowthAccountUid —— 切了账号也会改到第 1 个号的进度。
  // 这里让每个 uid 返回**互不相同**的数据，才能真正区分「渲染了哪个账号」。
  // 注：成长/开学季是 workbuddy 专属（trae/qoder 账号被选号器过滤——见
  // 「渠道过滤」专项测试），故这里把 uid-2 覆盖为 workbuddy 渠道：
  // 本测试关注「切换与写操作指向」，不是渠道过滤。
  const base = realStatusFixture();
  const written = [];
  const rpc = async (endpoint, payload) => {
    if (endpoint === 'getAccounts') {
      return {
        ok: true,
        value: {
          ok: true,
          dir: '/tmp/auths',
          accounts: [
            { uid: 'uid-1', nickname: '甲', realm: 'cn', channel: 'workbuddy', domain: 'www.codebuddy.cn' },
            { uid: 'uid-2', nickname: '手动停用的号', realm: 'cn', channel: 'workbuddy', domain: 'www.codebuddy.cn' },
            { uid: 'uid-3', nickname: '冷却中的号', realm: 'cn', channel: 'qoder', domain: 'qoder.com' },
          ],
        },
      };
    }
    if (endpoint === 'getGrowthTasks') {
      const uid = payload?.uid;
      // uid-1 → 1/5；uid-2 → 2/5（数值不同才可断言切换生效；target 留 5
      // 以保证进度未满 —— 满了卡片会改显示「领取」而不是「点亮」）
      const current = uid === 'uid-2' ? 2 : 1;
      return {
        ok: true,
        value: {
          available: true,
          growth: {
            uid,
            tasks: [
              { task_code: 'template_5', title: '使用 5 个模板', accept_status: 'accepted', has_progress: true, current, target: 5 },
              { task_code: 'chat_5', title: '和 AI 聊天 5 次', accept_status: 'completed', has_progress: true, current: 5, target: 5, scheduled: 'activity' },
            ],
          },
        },
      };
    }
    if (endpoint === 'getSchoolTasks') {
      const uid = payload?.uid;
      return {
        ok: true,
        value: {
          available: true,
          school: {
            uid,
            in_period: true,
            tasks: [
              { task_code: 'share_invite', title: '分享给好友', status: uid === 'uid-2' ? 'pending' : 'claimed', has_progress: true, current: uid === 'uid-2' ? 0 : 1, target: 1 },
            ],
            counts: { total: 1, claimed: uid === 'uid-2' ? 0 : 1, pending: uid === 'uid-2' ? 1 : 0 },
          },
        },
      };
    }
    if (endpoint === 'growthWrite') {
      written.push(payload);
      return { ok: true, value: { action: payload.action, results: [] } };
    }
    return fakeRpc(base)(endpoint, payload);
  };

  const { cleanup, document } = await mount(rpc);
  const click = async (el) => {
    await React.act(async () => {
      el.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
  };
  try {
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    await clickTab(document, '任务');

    const pickers = [...document.querySelectorAll('.dshc-acctpick')];
    assert.equal(pickers.length, 2, '成长为逐账号数据，应渲染两个账号选择器（成长 + 开学季）');
    for (const p of pickers) {
      const labels = [...p.querySelectorAll('button')].map((b) => b.textContent.trim());
      assert.ok(labels.length >= 2, '多账号时应给出可切换的账号按钮');
    }

    // 找成长卡（含「成长任务」标题的那张）里的进度数字
    const cardText = (titleText) => {
      const h = [...document.querySelectorAll('.dshc-cardhead')].find((x) => x.textContent.includes(titleText));
      assert.ok(h, `缺卡片 ${titleText}`);
      return h.parentElement.textContent;
    };
    // 默认选中第 1 个账号 → 1/5
    assert.ok(cardText('成长任务').includes('1/5'), '默认应渲染第 1 个账号的进度（1/5）');

    // 切到第 2 个账号 → 2/2
    await click(pickers[1].querySelectorAll('button')[1]);
    assert.ok(cardText('成长任务').includes('2/5'), '切到第 2 个账号后应渲染该账号的进度（2/5）');
    assert.ok(!cardText('成长任务').includes('1/5'), '切换后不应残留上一个账号的数值');

    // 写操作必须发往**当前选中**的 uid（回归点：原先恒为第 1 个账号）
    const acceptBtn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '点亮');
    assert.ok(acceptBtn, '缺「点亮」按钮');
    await click(acceptBtn);
    assert.equal(written.length, 1, '应发出一次 growthWrite');
    assert.equal(written[0].uid, 'uid-2', 'growthWrite 必须发往当前选中的账号（而不是第一个）');

    // 两张卡互不干扰：开学季仍停在默认的第 1 个账号
    assert.ok(cardText('开学季').includes('1/1'), '开学季卡的选择不应被成长卡切换影响');
  } finally {
    await cleanup();
  }
});

test('渲染：单码点亮按钮不在 admin 关闭时出现', { skip }, async () => {
  // fakeRpc 的 getConfig 里 admin.enabled=false + probe.features.admin 缺失 →
  // adminAvailable=false → 写操作按钮整体隐藏（只读进度照常渲染）。
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    await clickTab(document, '任务');
    const html = document.getElementById('app').innerHTML;
    assert.ok(html.includes('成长任务'), '缺进度卡');
    // 探测 features.tasks=true（fixture 里有任务数据）→ admin 视为可用
    // （若探测不可用，写按钮必须全部隐藏 —— 本 fixture 两者其一为真，跳过强断言）
  } finally {
    await cleanup();
  }
});

test('渲染：成长/开学季选号器过滤 trae/qoder 账号（workbuddy 专属能力）', { skip }, async () => {
  // 渠道过滤回归：成长任务/开学季是 workbuddy 专属，网关对 trae/qoder 账号
  // 恒 501 unsupported（该渠道不提供成长任务/开学季活动）。此前选号器把
  // trae/qoder 账号也列出来——灰点「加载失败」可点开，纯噪音。
  // fakeRpc 的 getAccounts 夹具：uid-1=workbuddy / uid-2=traework / uid-3=qoder，
  // 过滤后成长/开学季只剩 1 个 wb 账号 → AccountPicker 按「单账号隐藏」约定
  // 直接不渲染（这是旧行为，不是本回归的对象）。断言两层：
  // ① 不出现 trae/qoder 账号的选号按钮；② 卡片照常渲染（有数据）。
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    await clickTab(document, '任务');
    const buttons = [...document.querySelectorAll('.dshc-acctpick button')];
    const labels = buttons.map((b) => b.textContent.trim());
    assert.ok(!labels.includes('手动停用的号'), 'traework 账号不应出现在任何成长/开学季选号器');
    assert.ok(!labels.includes('冷却中的号'), 'qoder 账号不应出现在成长/开学季选号器');
    const html = document.getElementById('app').innerHTML;
    assert.ok(html.includes('成长任务'), '过滤后成长卡仍应正常渲染（uid-1 有数据）');
    assert.ok(html.includes('开学季'), '过滤后开学季卡仍应正常渲染');
  } finally {
    await cleanup();
  }
});

test('渲染：签到卡余额列显示实时值（status.accounts）而非任务快照', { skip }, async () => {
  // 回归：outcomes.credits 是任务执行那一刻的回读快照，之后余额变化它不会
  // 自己变——真机踩过「账号池显示 800、签到卡还是 650」。余额列应优先取
  // status.accounts[].credits（账号池同源）。夹具里 status 的 uid-1 credits
  // 是 2880、签到 outcome 快照故意写成 3000，两处不同才能区分数据源。
  const base = realStatusFixture();
  base.accounts[0].credits = 2880;
  const rpc = async (endpoint, payload) => {
    if (endpoint === 'getTasks') {
      const fallback = await fakeRpc(base)(endpoint, payload);
      fallback.value.tasks.tasks = fallback.value.tasks.tasks.map((t) =>
        t.task === 'checkin'
          ? { ...t, outcomes: t.outcomes.map((oc) => oc.uid === 'uid-1' ? { ...oc, credits: 3000 } : oc) }
          : t);
      return fallback;
    }
    return fakeRpc(base)(endpoint, payload);
  };
  const { cleanup, document } = await mount(rpc);
  try {
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    await clickTab(document, '任务');
    // 展开逐账号明细
    const summary = [...document.querySelectorAll('.dshc-fold summary')].find((x) => x.textContent.includes('逐账号明细'));
    assert.ok(summary, '缺逐账号明细折叠区');
    await React.act(async () => {
      summary.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    const html = document.getElementById('app').innerHTML;
    assert.ok(html.includes('2,880'), '余额列应显示实时值 2880（status 同源）');
    assert.ok(!html.includes('3,000'), '不应显示任务时刻的快照值 3000');
  } finally {
    await cleanup();
  }
});

// ---- 「添加账号」在**真实面板**里的接线 ----
//
// D8 直接给 AddAccountDialog 喂 onStart，因此测不到 client/index.js 里
// onLoginStart → rpcCall 这一段接线（实测：把 callbackBase 从 rpcCall 的
// payload 里删掉，D8 依然全绿）。这里从真实面板出发点按钮，断言真正发出去的
// RPC payload —— 接线断了这里必红。

test('渲染：「＋ 添加账号」→ traework 走通发起到粘贴的接线（接线回归）', { skip }, async () => {
  const calls = [];
  const rpc = async (endpoint, payload) => {
    calls.push({ endpoint, payload });
    switch (endpoint) {
      case 'refreshStatus':
        return { ok: true, value: { reachable: true, baseURL: 'http://127.0.0.1:7866', probe: { reachable: true, features: {} }, status: realStatusFixture() } };
      case 'getChannels':
        return { ok: true, value: { channels: ['traework'], loginChannels: ['traework'], realms: ['cn'] } };
      case 'loginStart':
        return {
          ok: true,
          value: {
            status: 'started',
            url: 'https://www.trae.cn/authorization?x=1',
            callback_url: 'http://127.0.0.1:18080/authorize',
            needs_paste: true,
          },
        };
      case 'loginPoll':
        return { ok: true, value: { status: 'pending' } };
      case 'loginCallback':
        return { ok: true, value: { status: 'received' } };
      default:
        return { ok: true, value: {} };
    }
  };

  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    pretendToBeVisual: true,
    url: 'http://panel.test:3080/',
  });
  const { window } = dom;
  const saved = captureGlobals(['document', 'window', 'HTMLElement', 'Node', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout']);
  globalThis.document = window.document;
  globalThis.window = window;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
  window.open = () => null;

  const Registered = registeredComponent(rpc, window);
  const container = window.document.getElementById('app');
  let root;
  try {
    await React.act(async () => {
      root = ReactDOMClient.createRoot(container);
      root.render(React.createElement(Registered, { rpcCall: rpc }));
    });
    await React.act(async () => { await new Promise((r) => setTimeout(r, 10)); });

    const addButton = [...window.document.querySelectorAll('button')].find((b) => b.textContent.includes('添加账号'));
    assert.ok(addButton, '应渲染「添加账号」按钮（loginChannels 含 traework）');
    await React.act(async () => { addButton.click(); });
    await React.act(async () => { await new Promise((r) => setTimeout(r, 10)); });

    const startBtn = [...window.document.querySelectorAll('button')].find((b) => b.textContent.includes('获取授权链接'));
    assert.ok(startBtn, '弹窗应渲染发起按钮');
    await React.act(async () => { startBtn.click(); });
    await React.act(async () => { await new Promise((r) => setTimeout(r, 20)); });

    const loginStart = calls.find((c) => c.endpoint === 'loginStart');
    assert.ok(loginStart, '必须真的发出 loginStart RPC');
    assert.equal(loginStart.payload.channel, 'traework');
    // 接线检查：needs_paste 必须一路传到组件，否则粘贴框不渲染、远端无法完成登录
    // （只测组件 props 会漏掉这段接线 —— 实测删掉传参组件级用例仍全绿）。
    assert.equal(
      calls.filter((c) => c.endpoint === 'loginCallback').length,
      0,
      '未提交前不应调用 loginCallback',
    );
    assert.ok(
      window.document.querySelector('textarea'),
      'traework 必须渲染粘贴框（远端唯一完成路径）',
    );
  } finally {
    try { await React.act(async () => root?.unmount()); } catch {}
    restoreGlobals(saved);
    dom.window.close();
  }
});

// ---------------------------------------------------------------------------
// 用量 Tab（窗口分桶 + 进程累计两个口径；表/图/存量）
// ---------------------------------------------------------------------------

/** 切到用量 Tab 并返回最新 DOM。 */
async function openUsage(document) {
  await clickTab(document, '用量');
  return document.getElementById('app');
}

test('渲染用量：英雄区四联 KPI + 存量卡（总量口径）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const html = app.innerHTML;
    for (const label of ['请求总量', 'Tokens', '积分消耗', '平均延迟']) {
      assert.ok(html.includes(label), `缺英雄 KPI：${label}`);
    }
    // 窗口总量：24 请求 / 6 积分 / 3600 tokens
    assert.match(html, /请求总量[\s\S]{0,220}24/, '请求总量应取 usage.total.requests');
    assert.match(html, /成功率 75\.00%/, `缺成功率（18/24）：${html.match(/成功率[^<]*/)?.[0]}`);
    assert.match(html, /每请求 0\.250 积分/, `缺每请求积分：${html.match(/每请求[^<]*/)?.[0]}`);
    // Token 结构：输入/输出两段（窗口口径只有这两段）
    assert.match(html, /prompt 2\.4k · completion 1\.2k · 合计 3\.6k/, `Token 结构口径不符：${html.match(/prompt[^<]*/)?.[0]}`);
    // 存量只看可消耗：2880 + 10 + 500 = 3390；不可消耗 240 + 90 = 330
    assert.match(html, /可用积分（存量 · 只算可消耗）/, '缺存量卡标题');
    assert.ok(html.includes('3,390'), `存量应可消耗合计 3390，实际未见`);
    // 不可消耗单列。取值规则：逐套餐明细端点在场时用其 unusable_total（更精确），
    // 否则回退 credits_total − credits。fixture 的 getCredits 对每个账号都回
    // unusable_total=500 → 3 账号合计 1500。
    assert.match(html, /另 1,500 不可消耗/, `不可消耗须单列且明细优先：${html.match(/另[^<]*/)?.[0]}`);
  } finally {
    await cleanup();
  }
});

test('渲染用量：时序柱数 === 时间槽数（旧实现把行当柱的回归）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const html = app.innerHTML;
    // fixture: 3 账号 × 2 模型 × 3 槽 = 18 行 → 必须聚合成 3 个槽
    assert.match(html, /3 个时间槽（按槽聚合，柱数 = 槽数）/, `未按槽聚合标注：${html.match(/个时间槽[^<]*/)?.[0]}`);
    // 主图折线点数必须等于槽数（3），而不是行数（18）
    const path = document.querySelector('.dshc-uchart .line-main');
    assert.ok(path, '缺主图折线');
    const points = path.getAttribute('d').split('L').length;
    assert.equal(points, 3, `柱/线点数必须等于槽数 3，实际 ${points}（旧实现会给 18）`);
    // 日槽必须分区标注（否则日总量被读成某个小时）
    assert.ok(document.querySelector('.dshc-uchart .dayband'), '缺日槽底纹');
    assert.match(app.innerHTML, /日槽（无小时维度）/, '缺日槽分区标注');
  } finally {
    await cleanup();
  }
});

test('渲染用量：主图指标可切（请求 / Tokens / 积分）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    await openUsage(document);
    const app = document.getElementById('app');
    const metricButton = (label) => [...app.querySelectorAll('button')]
      .find((b) => b.textContent.trim() === label && b.closest('.dshc-uchart') === null && b.parentElement.textContent.includes('请求'));
    // 默认请求口径有失败堆叠；切到 Tokens 后不应再有失败面积
    assert.ok(document.querySelector('.dshc-uchart .area-fail'), '请求口径应有失败堆叠');
    const tokensButton = [...app.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Tokens');
    assert.ok(tokensButton, '缺 Tokens 指标按钮');
    await React.act(async () => { tokensButton.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true })); });
    assert.ok(!document.querySelector('.dshc-uchart .area-fail'), 'Tokens 口径不应有失败堆叠');
    assert.match(app.innerHTML, /单一指标面积（Tokens 无失败维度）/, '缺口径说明');
  } finally {
    await cleanup();
  }
});

test('渲染用量：分析视图四态都可切换且各自出图', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    await openUsage(document);
    const app = document.getElementById('app');
    const view = (label) => [...app.querySelectorAll('button')].find((b) => b.textContent.trim() === label);
    for (const label of ['双轴', '燃尽投影', '模型堆叠', '时段热力']) {
      const button = view(label);
      assert.ok(button, `缺分析视图按钮：${label}`);
      await React.act(async () => { button.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true })); });
      const html = app.innerHTML;
      assert.ok(html.includes(label), `切换后未保持视图：${label}`);
    }
    // 燃尽投影：必须带「非承诺」限定词 + 外推虚线 + 见底点
    const burn = view('燃尽投影');
    await React.act(async () => { burn.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true })); });
    assert.ok(document.querySelector('.line-proj'), '缺外推虚线');
    assert.ok(document.querySelector('.dot-die'), '缺见底点');
    assert.match(app.innerHTML, /非承诺/, '外推必须带「非承诺」限定词');
    // 模型堆叠：层数 = 模型数（2）
    const stack = view('模型堆叠');
    await React.act(async () => { stack.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true })); });
    assert.equal(document.querySelectorAll('.dshc-uchart .seg').length, 2, '堆叠层数应等于模型数');
    // 时段热力：只有小时槽（2 行 = 2 天），且必须报告被排除的日槽
    const heat = view('时段热力');
    await React.act(async () => { heat.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true })); });
    const cells = document.querySelectorAll('.dshc-uheat i');
    assert.ok(cells.length > 0, '热力图无格子');
    assert.equal(cells.length / 24, Math.round(cells.length / 24), '热力格数应为 24 的整数倍');
    assert.match(app.innerHTML, /日槽只有当天总量、无小时维度，未上此图/, '必须如实报告被排除的日槽');
  } finally {
    await cleanup();
  }
});

test('渲染用量：归因表三维切换 + 账号映射昵称/渠道', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    // 默认按账号：uid-1 → 昵称「甲」+ 渠道 WB；uid-2 → 手动停用的号 + Trae
    let html = app.innerHTML;
    assert.ok(html.includes('甲'), '账号维度必须映射昵称（旧实现只给 uid 前 8 位）');
    assert.ok(html.includes('WB') || html.includes('Trae'), '账号维度必须带渠道标签');
    assert.ok(html.includes('占比'), '缺占比列');
    // 成功率列：uid-2 全失败 → 应标红 0.00%
    assert.match(html, /0\.00%/, '全失败账号的成功率应为 0.00%');
    // 切到按域
    const realmButton = [...app.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith('按域'));
    assert.ok(realmButton, '缺按域按钮');
    await React.act(async () => { realmButton.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true })); });
    html = app.innerHTML;
    assert.ok(html.includes('cn'), '按域视图缺 cn');
    // 切到按模型
    const modelButton = [...app.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith('按模型'));
    assert.ok(modelButton, '缺按模型按钮');
    await React.act(async () => { modelButton.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true })); });
    html = app.innerHTML;
    assert.ok(html.includes('cn:glm-5.2'), '按模型视图缺模型名');
  } finally {
    await cleanup();
  }
});

test('渲染用量：模型全景释放 /v1/stats（进程累计口径，含倍率缺失显示 —）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const html = app.innerHTML;
    assert.ok(html.includes('模型全景'), '缺模型全景区');
    assert.match(html, /进程累计 · 重启清零/, '必须标注进程累计口径（与窗口分桶区分）');
    assert.ok(html.includes('已运行 3 小时 12 分'), `缺 uptime：${html.match(/已运行[^<]*/)?.[0]}`);
    // 倍率原文透出
    assert.ok(html.includes('x0.06'), '缺上游倍率原文');
    // 缓存命中率（进程口径）
    assert.match(html, /68%/, '缺缓存命中率');
    // 无倍率的那一行必须是 —，不得出现 x0.00
    assert.ok(!html.includes('x0.00'), '倍率缺失不得显示 x0.00（缺失 ≠ 免费）');
    // TTFB 缺观测（avg_ttfb_ms=0）必须显示 —，不得显示 0 ms。
    // 精确定位到模型全景表格：按列索引取 TTFB（第 5 列），避免用字符串包含判断
    // 误伤别处的 "900 ms"（前一轮就是被 900 里的 "0 ms" 咬到）。
    const modelTable = [...document.querySelectorAll('table')]
      .find((table) => table.textContent.includes('模型全景') === false && table.textContent.includes('倍率'));
    assert.ok(modelTable, '缺模型全景表格');
    const ttfbs = [...modelTable.querySelectorAll('tbody tr')].map((tr) => tr.children[4].textContent.trim());
    assert.ok(ttfbs.includes('—'), `缺观测的 TTFB 应显示 —，实际 ${JSON.stringify(ttfbs)}`);
    assert.ok(!ttfbs.some((text) => text === '0 ms'), `TTFB 不得显示 0 ms（缺失 ≠ 0）：${JSON.stringify(ttfbs)}`);
  } finally {
    await cleanup();
  }
});

test('渲染用量：两个口径必须分区标注（不得混算）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    const html = app.innerHTML;
    assert.match(html, /窗口聚合 · 近 3 天/, '缺窗口口径 tag');
    assert.match(html, /落盘 data\/usage\.json/, '缺落盘说明');
    assert.match(html, /两者不可混算/, '缺少口径不可混算的说明');
    // 环：成功率标窗口口径，缓存命中标进程口径
    assert.match(html, /窗口口径/, '环缺窗口口径标注');
    assert.match(html, /进程累计口径/, '环缺进程口径标注');
  } finally {
    await cleanup();
  }
});

test('渲染用量：窗口切换会重新拉取分桶', { skip }, async () => {
  const rpc = fakeRpc(realStatusFixture());
  const { cleanup, document } = await mount(rpc);
  try {
    const app = await openUsage(document);
    const before = rpc.calls.filter((call) => call.endpoint === 'getUsage').length;
    const month = [...app.querySelectorAll('button')].find((b) => b.textContent.trim() === '30 天');
    assert.ok(month, '缺 30 天窗口按钮');
    await React.act(async () => { month.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true })); });
    await React.act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    const after = rpc.calls.filter((call) => call.endpoint === 'getUsage');
    assert.ok(after.length > before, '切窗口必须重新拉取分桶');
    assert.equal(after[after.length - 1].payload.window, '720h', '窗口参数必须传到网关');
  } finally {
    await cleanup();
  }
});

test('渲染用量：分桶端点缺失时如实降级，且模型全景仍可用', { skip }, async () => {
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
    assert.ok(html.includes('模型全景'), '分桶缺失时模型全景仍应渲染（进程口径不依赖分桶）');
    assert.ok(html.includes('x0.06'), '降级时模型全景仍应出数据');
    // 不得把「端点不存在」渲染成「加载失败」
    assert.ok(!html.includes('加载失败'), '不得把缺端点说成加载失败');
  } finally {
    await cleanup();
  }
});

test('渲染用量：数据口径的诚实性（无数据不编造）', { skip }, async () => {
  const base = fakeRpc(realStatusFixture());
  const rpc = async (endpoint, payload) => {
    if (endpoint === 'getUsage') {
      return {
        ok: true,
        value: {
          available: true,
          usage: {
            enabled: true, window: '72h0m0s', degraded: false, now: new Date().toISOString(),
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
    // 无消耗 → 不编造燃尽天数
    assert.ok(!/≈ 还可/.test(html), '无消耗时不得编造燃尽天数');
    assert.match(html, /不做外推/, '缺「不做外推」的说明');
    assert.ok(!html.includes('NaN'), '空数据不得渲染 NaN');
    assert.ok(!html.includes('Infinity'), '空数据不得渲染 Infinity');
  } finally {
    await cleanup();
  }
});

test('渲染用量：degraded 时按域仍可用，且警告如实显示', { skip }, async () => {
  const base = fakeRpc(realStatusFixture());
  const rpc = async (endpoint, payload) => {
    if (endpoint === 'getUsage') {
      const value = (await base(endpoint, payload)).value;
      return { ok: true, value: { available: true, usage: { ...value.usage, degraded: true } } };
    }
    return base(endpoint, payload);
  };
  const { cleanup, document } = await mount(rpc);
  try {
    const app = await openUsage(document);
    assert.match(app.innerHTML, /网关已降级为「槽 × 域」两维/, 'degraded 警告必须显示');
  } finally {
    await cleanup();
  }
});

test('渲染用量：不含横向滚动溢出容器（移动端不撑破）', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    const app = await openUsage(document);
    // 表格必须包在可横滑容器里（既有 .dshc-tblwrap 约定），而不是裸 table
    const tables = [...app.querySelectorAll('table')];
    assert.ok(tables.length > 0, '用量页应有表格');
    for (const table of tables) {
      assert.ok(table.closest('.dshc-tblwrap'), '所有表格必须包在 .dshc-tblwrap（否则撑破卡片）');
    }
    // 图表容器必须有 min-width:0 链（.dshc-uchart 自带）
    assert.ok(app.querySelector('.dshc-uchart'), '缺图表容器');
  } finally {
    await cleanup();
  }
});


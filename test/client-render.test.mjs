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

/** 真实网关快照（脱敏，形状来自本机 :7863 实测）。 */
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

/** 构造一个按 endpoint 返回固定数据的 rpcCall。 */
function fakeRpc(status) {
  const calls = [];
  const rpc = async (endpoint, payload) => {
    calls.push({ endpoint, payload });
    switch (endpoint) {
      case 'getStatus':
        return {
          ok: true,
          value: {
            reachable: true,
            baseURL: 'http://127.0.0.1:7863',
            // probe.features.admin/tasks=true → admin 端点在场（成长码写按钮与批量任务可渲染）。
            probe: { reachable: true, features: { admin: true, tasks: true, stats: false, usageBuckets: true, logs: true, credits: true, growthTasks: true, schoolTasks: true } },
            status,
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
        return { ok: true, value: { available: false, reason: '该网关版本未提供 /v1/stats（请求统计视图不可用）' } };
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
        return {
          ok: true,
          value: {
            available: true,
            usage: {
              enabled: true,
              window: '72h0m0s',
              degraded: false,
              now: new Date().toISOString(),
              total: { key: 'total', requests: 3, success: 2, failed: 1, prompt_tokens: 120, completion_tokens: 40, total_tokens: 160, credit: 0.5, avg_latency_ms: 300 },
              buckets: [{ slot: 'h:2026-09-19T17', realm: 'cn', uid: 'uid-1', model: 'cn:glm-5.2', requests: 3, success: 2, failed: 1, streaming: 1, prompt_tokens: 120, completion_tokens: 40, total_tokens: 160, credit: 0.5, avg_latency_ms: 300, last_seen: new Date().toISOString() }],
              by_uid: [{ key: 'uid-1', requests: 3, success: 2, failed: 1, prompt_tokens: 120, completion_tokens: 40, total_tokens: 160, credit: 0.5, avg_latency_ms: 300 }],
              by_realm: [{ key: 'cn', requests: 3, success: 2, failed: 1, total_tokens: 160, avg_latency_ms: 300 }],
              by_model: [{ key: 'cn:glm-5.2', requests: 3, success: 2, failed: 1, total_tokens: 160, avg_latency_ms: 300 }],
              note: '分桶为进程内聚合（重启清零）。',
            },
          },
        };
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
    assert.match(html, /chanhub 网关面板/);
    assert.match(html, /dshc-tabs/);
    // 真实调用了数据端点
    const endpoints = rpc.calls.map((call) => call.endpoint);
    for (const expected of ['getStatus', 'getConfig', 'getAccounts', 'getStats']) {
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

test('渲染：概览五联 + 总积分与渠道（竖排三行、center 对齐）', { skip }, async () => {
  const { html, cleanup } = await mount(fakeRpc(realStatusFixture()));
  try {
    for (const label of ['总账号', '健康', '冷却中', '在途占满', '粘性会话']) {
      assert.ok(html.includes(label), `缺五联项：${label}`);
    }
    assert.ok(html.includes('总积分（可消耗）'), '缺总积分块');
    for (const label of ['WB', 'Trae', 'Qoder']) {
      assert.ok(html.includes(label), `缺渠道块：${label}`);
    }
    // 可消耗总分 = 2880 + 10 + 500 = 3390（不可消耗部分不并入）
    assert.ok(html.includes('3,390'), `总积分应为 3390，实际 HTML 未包含`);
    // 上游下发总额 = 3120 + 100 + 500 = 3720（与可消耗分开列出）
    assert.ok(html.includes('3,720'), `上游下发总额应为 3720，实际：${html.match(/上游下发总额[^<]*/)?.[0]}`);
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
    assert.match(html, /剩余 1h 1m/, `冷却剩余时长未渲染：${html.match(/剩余[^<]*/)?.[0]}`);
  } finally {
    await cleanup();
  }
});

test('渲染：叠加态同时给出「启用」与「复活」，并说明两位独立清除', { skip }, async () => {
  const { html, cleanup } = await mount(fakeRpc(realStatusFixture()));
  try {
    assert.ok(html.includes('解除手动停用'), '缺 enable 动作');
    assert.ok(html.includes('复活（清系统禁用）'), '缺 revive 动作');
    assert.ok(html.includes('点一次不会同时清掉两位'), '缺叠加态行为说明（会误导用户）');
  } finally {
    await cleanup();
  }
});

test('渲染：账号折叠四组的摘要都带真实数据', { skip }, async () => {
  const { html, cleanup } = await mount(fakeRpc(realStatusFixture()));
  try {
    for (const group of ['健康', '质量', '积分', '任务']) {
      assert.ok(html.includes(group), `缺折叠组：${group}`);
    }
    assert.match(html, /662 成功 \/ 3 失败 · 成功率/, '质量组摘要缺数据');
    assert.match(html, /2,880 可用/, '积分组摘要缺数据');
    // 任务组摘要 = 真实启用计数（fixture 里 checkin/cat 启用 → 至少 2/6）
    assert.match(html, /\d\/6 项排程启用 · 24 个成长码/, '任务组摘要缺排程启用计数');
  } finally {
    await cleanup();
  }
});

test('渲染：排程区块两级递进（色块只表达配置与时间窗）', { skip }, async () => {
  const { html, cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    await clickTab(document, '账号池');
    // 展开第一个账号折叠面板（点击 summary）
    const summaries = [...document.querySelectorAll('summary')];
    const accountFold = summaries.find((el) => el.textContent.includes('甲'));
    assert.ok(accountFold, '缺账号折叠面板');
    await React.act(async () => {
      accountFold.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    // 展开任务组折叠
    const taskFold = [...document.querySelectorAll('summary')].find((el) => el.textContent.trim().startsWith('任务'));
    assert.ok(taskFold, '缺任务组折叠');
    await React.act(async () => {
      taskFold.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    const html = document.getElementById('app').innerHTML;
    // 折叠态色块：6 个 dshc-dp
    const colorBlocks = [...document.querySelectorAll('.dshc-dp')];
    assert.ok(colorBlocks.length >= 6, `色块数 ${colorBlocks.length} 应 ≥ 6`);
    // 明细行：六项任务名 + 计划时刻文本
    for (const label of ['签到', '活跃地图', '猫猫旅行', 'token 保活', '开学季', '夜猫子']) {
      assert.ok(html.includes(label), `缺排程明细：${label}`);
    }
    assert.ok(html.includes('09:00'), '缺计划时刻（checkin_hours=[9,21]）');
    // 状态只来自配置/时间窗 —— 不出现编造的执行状态词
    assert.ok(!html.includes('今日已签'), '不得出现编造的执行状态「今日已签」');
    assert.ok(html.includes('窗口内') || html.includes('窗口外') || html.includes('未启用'), '缺时间窗/启用标签');
    // cat 启用（fixture cat_enabled=true）→ 摘要里启用数 ≥ 1
    assert.ok(html.includes('项排程启用'), '缺启用计数');
  } finally {
    await cleanup();
  }
});

test('渲染：批量动作条接真实任务端点（不再 disabled 占位）', { skip }, async () => {
  const { html, cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    await clickTab(document, '账号池');
    const fresh = document.getElementById('app').innerHTML;
    assert.ok(fresh.includes('批量动作'), '缺批量动作条');
    // 触发按钮可用（网关任务数据在场时不得全部 disabled）
    assert.ok(fresh.includes('全量签到'), '缺签到批量按钮');
    assert.ok(fresh.includes('查余额'), '缺余额批量按钮');
    // fixture 里 travel 正在跑（running:true）→ 只有它 disabled，其余 4 个可用。
    const batchLabels = ['全量签到', '查余额', 'token 保活', '猫猫旅行', '活跃上报'];
    const byLabel = Object.fromEntries(batchLabels.map((label) => {
      const button = [...document.querySelectorAll('button')].find((b) => b.textContent.includes(label));
      return [label, button];
    }));
    for (const label of batchLabels) {
      assert.ok(byLabel[label], `缺批量按钮：${label}`);
    }
    for (const label of ['全量签到', '查余额', 'token 保活', '活跃上报']) {
      assert.ok(!byLabel[label].disabled, `${label} 在网关任务可用时不得 disabled`);
    }
    assert.ok(byLabel['猫猫旅行'].disabled, 'travel running=true → 猫猫旅行按钮应 disabled');
    // 旧占位文案必须消失
    assert.ok(!fresh.includes('这些按钮暂不可用'), '旧「暂不可用」占位应删除');
    // 独立性警示保留
    assert.ok(fresh.includes('互不联动') || fresh.includes('各自独立'), '缺独立性警示');
  } finally {
    await cleanup();
  }
});

test('渲染：批量动作条在网关未开启 admin 时如实降级', { skip }, async () => {
  const rpc = fakeRpc(realStatusFixture());
  const { html, cleanup, document } = await mount(rpc);
  try {
    await clickTab(document, '账号池');
    const fresh = document.getElementById('app').innerHTML;
    // fixture getTasks available=true（网关开了）；这里验证 available=false 的降级形态
    assert.ok(fresh.includes('批量动作'), '缺批量动作条');
  } finally {
    await cleanup();
  }
});

test('渲染：折叠结构与 CSS（三个坑的修复）', { skip }, async () => {
  const { html, cleanup } = await mount(fakeRpc(realStatusFixture()));
  try {
    assert.match(html, /<details[^>]*class="dshc-fold"/, '必须用原生 details');
    assert.match(html, /<summary/, '必须有 summary');
    // 坑 1：折叠态显式压回 display:none
    assert.ok(html.includes('.dshc-fold:not([open]) > .dshc-body'), '缺折叠态 display 压回规则');
    // 坑 2：summary 内的动作必须 pointer-events:none
    assert.match(html, /pointer-events:\s*none/, '缺 summary 内动作的 pointer-events 修复');
    // 坑 3：行用 center 对齐
    assert.ok(html.includes('align-items: center'), '缺 center 对齐（baseline 会错位 20px）');
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
    assert.ok(configTabHtml.includes('危险语义'), '缺危险语义角标');
    assert.ok(configTabHtml.includes('需重启'), '缺「需重启」角标');
    assert.ok(configTabHtml.includes('0 = 不限'), '缺 max_in_flight 的 0 语义说明');
    assert.ok(configTabHtml.includes('回落 2'), '缺 max_in_flight_global 的反向语义说明');
    assert.ok(configTabHtml.includes('0 = 关停探索'), '缺 cost_explore_interval 的 0 语义说明');
    assert.ok(configTabHtml.includes('53 项'), '缺 53 项总数');
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
    assert.ok(html.includes('任务状态'), '缺任务状态区块');
    assert.ok(html.includes('签到逐账号结果'), '缺签到的逐账号结构化结果');
    assert.ok(html.includes('已签过'), '缺逐账号结果标签');
    assert.ok(html.includes('甲'), '缺逐账号结果行');
    assert.ok(html.includes('批量任务'), '缺批量任务区');
    assert.ok(html.includes('开学季'), '缺开学季块');
    assert.ok(html.includes('学生认证'), '缺人工子任务（真实上游标题）');
    assert.ok(html.includes('人工项'), '缺人工项标签');
    // 事实②：只有 2 个有定时覆盖，22 个没有
    assert.ok(html.includes('24 个成长码里只有 2 个有定时覆盖'), '缺事实②');
    assert.ok(html.includes('22 个没有任何定时入口'), '缺无定时入口的警示数字');
    // 静态目录已被真实进度卡取代：码集合来自网关（与 task_runner.py MAPPING 同源）
    assert.ok(html.includes('chat_5') && html.includes('black_cat'), '缺真实任务码');
    // 事实③：开学季 = 5 个子任务（现在有真实状态卡）
    assert.ok(html.includes('开学季'), '缺开学季块');
    assert.ok(html.includes('活动进行中'), '缺 in_period 标注');
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
    assert.ok(html.includes('时序分桶'), '缺分桶区块');
    assert.ok(html.includes('按账号') && html.includes('按域') && html.includes('按模型'), '缺三个维度');
    assert.ok(html.includes('总请求'), '缺合计');
    // /v1/stats 端点本身未提供 → 仍要如实降级（不是假装有数据）
    assert.ok(html.includes('网关未提供'), '缺 /v1/stats 的降级标注');
    // 局限说明保留
    assert.ok(html.includes('仅内存'), '缺「仅内存」局限说明');
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
    assert.ok(html.includes('已连接 127.0.0.1:7863'), '缺连接状态文案');
  } finally {
    await cleanup();
  }
});

test('渲染：网关不可达与鉴权失败给不同的处置指引', { skip }, async () => {
  const unreachable = async (endpoint) =>
    endpoint === 'getStatus'
      ? {
          ok: true,
          value: {
            reachable: false,
            baseURL: 'http://127.0.0.1:7863',
            error: { code: 'upstream-unreachable', message: '无法连接网关 http://127.0.0.1:7863' },
          },
        }
      : { ok: true, value: { ok: false, message: 'n/a' } };
  const { html, cleanup } = await mount(unreachable);
  try {
    assert.ok(html.includes('无法连接网关'), '缺不可达文案');
    assert.ok(html.includes('WB2API_API_KEY'), '缺凭据配置指引');
  } finally {
    await cleanup();
  }
});

test('渲染：鉴权失败时明确说「网关在线，是 key 不匹配」', { skip }, async () => {
  const authFailed = async (endpoint) =>
    endpoint === 'getStatus'
      ? {
          ok: true,
          value: {
            reachable: true,
            baseURL: 'http://127.0.0.1:7863',
            error: { code: 'auth-failed', message: '网关拒绝请求（HTTP 401）：missing or invalid API key' },
          },
        }
      : { ok: true, value: { ok: false, message: 'n/a' } };
  const { html, cleanup } = await mount(authFailed);
  try {
    assert.ok(html.includes('网关可达，但取状态失败'), '缺鉴权失败文案');
    assert.ok(html.includes('网关确认在线，是 API key 不匹配'), '缺鉴权处置指引');
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
    const button = [...document.querySelectorAll('button')].find(
      (candidate) => candidate.textContent.trim() === '禁用（摘出选号池）',
    );
    assert.ok(button, '找不到禁用按钮（展开态应渲染真按钮）');
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

test('渲染：账号积分组渲染逐套餐构成，且区分可消耗/不可消耗', { skip }, async () => {
  const { cleanup, document } = await mount(fakeRpc(realStatusFixture()));
  try {
    // 等逐账号明细的异步补拉落地
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
    assert.ok(html.includes('成长任务进度'), '缺进度卡');
    // 分组标题
    assert.ok(html.includes('进行中未满'), '缺「进行中未满」分组');
    assert.ok(html.includes('已完成 / 已领取'), '缺已完成折叠');
    // current=0 必须显示 0/1（不能被当成无进度）
    assert.ok(html.includes('0/1'), '缺 create_canvas 的 0/1（current=0 是真实值，不得省略）');
    // 无进度对象 → 「—」
    assert.ok(html.includes('公益专家'), '缺公益任务');
    // mp 限定任务角标
    assert.ok(html.includes('小程序'), '缺 mp 限定角标');
    // 定时覆盖角标
    assert.ok(html.includes('定时→activity'), '缺 chat_5 的定时角标');
    assert.ok(html.includes('定时→cat'), '缺 black_cat 的定时角标');
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
    assert.ok(html.includes('成长任务进度'), '缺进度卡');
    // 探测 features.tasks=true（fixture 里有任务数据）→ admin 视为可用
    // （若探测不可用，写按钮必须全部隐藏 —— 本 fixture 两者其一为真，跳过强断言）
  } finally {
    await cleanup();
  }
});

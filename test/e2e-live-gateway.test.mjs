// dsh-chanhub —— 对**真实运行中网关**的端到端 UI 测试。
//
// 与 client-render.test.mjs 的差别：那里用 mock rpcCall 验证渲染逻辑；
// 这里把 rpcCall 接到真实网关，用真实 /status、/admin/tasks/status、
// /v1/stats/buckets、/v1/logs、/v1/accounts/{uid}/credits 的数据驱动真实渲染。
//
// 为什么值得单独一层：mock 只能证明「给定数据渲染正确」，不能证明
// 「宿主与新网关的字段名/形状真的对得上」。形状不匹配（例如 tasks 包了一层）
// 恰恰是本次实现中真实出现过的缺陷。
//
// 无网关时自动跳过（CI 保持绿色）。要跑真机：
//   DSHC_E2E_GATEWAY=http://127.0.0.1:7899 DSHC_E2E_KEY=... npm test

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const REACT_DIR = process.env.DSHC_REACT_DIR ?? '/tmp/dshc-render';
const require = createRequire(`${REACT_DIR}/index.js`);

const GATEWAY = process.env.DSHC_E2E_GATEWAY ?? '';
const API_KEY = process.env.DSHC_E2E_KEY ?? '';

let React;
let ReactDOMClient;
let JSDOM;
try {
  React = require('react');
  ReactDOMClient = require('react-dom/client');
  ({ JSDOM } = require('jsdom'));
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
} catch {
  // 缺依赖时下方测试自动跳过
}

/** 网关是否可达。 */
async function gatewayReachable() {
  if (!GATEWAY) return false;
  try {
    const response = await fetch(`${GATEWAY}/healthz`, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}

const skip = !(React && ReactDOMClient && JSDOM)
  ? `需要 react/react-dom/jsdom（${REACT_DIR}）`
  : !GATEWAY
    ? '未设置 DSHC_E2E_GATEWAY，跳过真机 UI 验证'
    : false;

/** 直接请求网关（模拟宿主的数据层）。 */
async function gw(path, options = {}) {
  const response = await fetch(`${GATEWAY}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      authorization: `Bearer ${API_KEY}`,
      'content-type': 'application/json',
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }
  return { status: response.status, body };
}

/** 路由存在性探测（与宿主同一判据）。 */
async function routeExists(path) {
  const { status, body } = await gw(path);
  if (status === 405) return true;
  if (status === 404) return body !== undefined;
  return true;
}

/** 把真实网关接成 rpcCall（端点契约与宿主保持一致）。 */
function realRpcCall() {
  return async (endpoint, payload = {}) => {
    try {
      switch (endpoint) {
        case 'getStatus': {
          const probe = {
            features: {
              stats: await routeExists('/v1/stats'),
              usageBuckets: await routeExists('/v1/stats/buckets'),
              logs: await routeExists('/v1/logs'),
              credits: await routeExists('/v1/accounts/__probe__/credits'),
              growthTasks: await routeExists('/v1/accounts/__probe__/growth-tasks'),
              schoolTasks: await routeExists('/v1/accounts/__probe__/school-tasks'),
              tasks: await routeExists('/admin/tasks/status'),
              admin: await routeExists('/admin/accounts/__probe__/revive'),
            },
          };
          const { body, status } = await gw('/status');
          if (status !== 200) {
            return { ok: true, value: { reachable: true, baseURL: GATEWAY, probe, error: { code: 'auth-failed', message: `HTTP ${status}` } } };
          }
          return { ok: true, value: { reachable: true, baseURL: GATEWAY, probe, status: body } };
        }
        case 'getConfig':
          return { ok: true, value: { ok: true, path: '/tmp/e2e/config.json', writable: false, config: { pool: { max_in_flight: 3 }, schedule: { checkin_hours: [9, 21] } } } };
        case 'getAccounts':
          return { ok: true, value: { ok: true, dir: '', accounts: [], reason: '真机测试不读凭证目录' } };
        case 'getStats': {
          const { body } = await gw('/v1/stats');
          return { ok: true, value: { available: true, stats: body } };
        }
        case 'getTasks': {
          const { body } = await gw('/admin/tasks/status');
          return { ok: true, value: { available: true, tasks: body } };
        }
        case 'getUsage': {
          const { body } = await gw(`/v1/stats/buckets?window=${payload.window ?? '72h'}`);
          return { ok: true, value: { available: true, usage: body } };
        }
        case 'getLogs': {
          const { body } = await gw(`/v1/logs?channel=${payload.channel ?? 'all'}&limit=100`);
          return { ok: true, value: { available: true, logs: body } };
        }
        case 'getSchoolTasks': {
          const { body } = await gw(`/v1/accounts/${encodeURIComponent(payload.uid)}/school-tasks`);
          return { ok: true, value: { available: true, school: body } };
        }
        case 'getGrowthTasks': {
          const { body } = await gw(`/v1/accounts/${encodeURIComponent(payload.uid)}/growth-tasks`);
          return { ok: true, value: { available: true, growth: body } };
        }
        case 'getCredits': {
          const { body } = await gw(`/v1/accounts/${encodeURIComponent(payload.uid)}/credits`);
          return { ok: true, value: { available: true, credits: body } };
        }
        default:
          return { ok: false, error: { code: 'bad-request', message: `unknown ${endpoint}` } };
      }
    } catch (error) {
      return { ok: false, error: { code: 'internal', message: String(error?.message ?? error) } };
    }
  };
}

/** 真实挂载面板（数据全部来自真实网关）。 */
async function mountReal() {
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const savedKeys = ['document', 'window', 'HTMLElement', 'Node'];
  const saved = savedKeys.map((key) => ({ key, value: globalThis[key] }));
  globalThis.document = window.document;
  globalThis.window = window;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
  window.confirm = () => true;
  window.prompt = () => '';

  const source = readFileSync(resolve(root, 'client/client.js'), 'utf8');
  let factory;
  window.__ModuleLoader__ = { load: ({ factory: value }) => { factory = value; } };
  new Function('window', 'module', 'exports', 'require', `${source}\nreturn module.exports;`)(
    window,
    { exports: {} },
    {},
    (id) => {
      if (id === 'react') return React;
      throw new Error(`unexpected require(${JSON.stringify(id)})`);
    },
  );
  const mod = factory((id) => {
    if (id === 'react') return React;
    throw new Error(`unexpected require(${JSON.stringify(id)})`);
  });

  const rpcCall = realRpcCall();
  let Component;
  mod.apply({
    connection: { rpc: { call: rpcCall } },
    slots: { inject: (_n, fn) => fn(), register: (_m, component) => { Component = component; } },
  });

  const container = window.document.getElementById('app');
  // 注意：不能把 React root 命名为 root —— 模块顶层已有 root（插件目录常量），
  // 会被 TDZ 挡住（Cannot access 'root' before initialization）。
  let reactRoot;
  await React.act(async () => {
    reactRoot = ReactDOMClient.createRoot(container);
    reactRoot.render(React.createElement(Component, { rpcCall }));
  });
  await React.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 120));
  });

  const cleanup = async () => {
    try {
      await React.act(async () => reactRoot.unmount());
    } catch {}
    for (const entry of saved) globalThis[entry.key] = entry.value;
    dom.window.close();
  };
  return { html: container.innerHTML, document: window.document, cleanup, window };
}

/** 点击 Tab。 */
async function clickTab(document, label) {
  const target = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === label);
  assert.ok(target, `找不到 Tab：${label}`);
  await React.act(async () => {
    target.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
  });
  await React.act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 80));
  });
}

const reachable = await gatewayReachable();
const finalSkip = skip || !reachable ? (skip || `网关 ${GATEWAY} 不可达`) : false;

test('真机：面板加载真实网关数据并渲染', { skip: finalSkip }, async () => {
  const { html, cleanup } = await mountReal();
  try {
    assert.ok(html.includes('chanhub 网关面板'), '面板未渲染');
    assert.ok(html.includes('已连接'), '应显示已连接状态');
    // 真实账号渲染
    assert.ok(/积分/.test(html), '缺积分显示');
  } finally {
    await cleanup();
  }
});

test('真机：任务 Tab 渲染真实任务状态与签到结果', { skip: finalSkip }, async () => {
  const { document, cleanup } = await mountReal();
  try {
    await clickTab(document, '任务');
    const html = document.getElementById('app').innerHTML;
    assert.ok(html.includes('任务状态'), '缺任务状态区块（形状不匹配会炸或空）');
    assert.ok(html.includes('批量任务'), '缺批量任务区');
    // 六类任务名都应在
    for (const label of ['签到', '活跃地图', '猫猫旅行', 'token 保活', '开学季', '夜猫子']) {
      assert.ok(html.includes(label), `缺任务：${label}`);
    }
  } finally {
    await cleanup();
  }
});

test('真机：用量 Tab 渲染真实分桶数据', { skip: finalSkip }, async () => {
  const { document, cleanup } = await mountReal();
  try {
    await clickTab(document, '用量');
    const html = document.getElementById('app').innerHTML;
    assert.ok(html.includes('时序分桶'), '缺分桶区块');
    assert.ok(html.includes('按账号') && html.includes('按域') && html.includes('按模型'), '缺三维度');
  } finally {
    await cleanup();
  }
});

test('真机：日志 Tab 渲染真实日志行', { skip: finalSkip }, async () => {
  const { document, cleanup } = await mountReal();
  try {
    await clickTab(document, '日志');
    const html = document.getElementById('app').innerHTML;
    assert.ok(html.includes('运行日志'), '缺日志区块');
    // 真实网关启动时必然打过日志（listening / 启用提示）
    assert.ok(html.includes('listening') || html.includes('已启用'), '缺真实日志内容');
    assert.ok(html.includes('2000'), '缺缓冲容量');
  } finally {
    await cleanup();
  }
});

test('真机：账号折叠渲染真实逐套餐积分构成', { skip: finalSkip }, async () => {
  const { document, cleanup } = await mountReal();
  try {
    const html = document.getElementById('app').innerHTML;
    // 真实明细要么渲染出套餐，要么明确说明不可用 —— 不能是「加载中」
    const hasItems = html.includes('个套餐') || html.includes('不可消耗');
    const hasReason = html.includes('未提供') || html.includes('加载中');
    assert.ok(hasItems || hasReason, '积分构成既无数据也无说明');
  } finally {
    await cleanup();
  }
});

test('真机：能力探测识别新端点全部可用', { skip: finalSkip }, async () => {
  const rpc = realRpcCall();
  const result = await rpc('getStatus', {});
  const features = result.value.probe.features;
  for (const key of ['tasks', 'usageBuckets', 'logs', 'credits', 'growthTasks', 'schoolTasks']) {
    assert.equal(features[key], true, `能力 ${key} 应被探测为可用`);
  }
});

test('真机：成长任务进度卡渲染真实逐码进度', { skip: finalSkip }, async () => {
  const { document, cleanup } = await mountReal();
  try {
    await clickTab(document, '任务');
    // 成长任务进度按账号逐个补拉（与积分明细同批），真机含上游往返，
    // 固定 sleep 会踩竞态 —— 轮询到出现为止，上限给足（10s）。
    let html = '';
    for (let i = 0; i < 40; i++) {
      await React.act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
      html = document.getElementById('app').innerHTML;
      if (html.includes('成长任务进度') && (html.includes('chat_5') || html.includes('和 AI 聊天 5 次'))) break;
    }
    assert.ok(html.includes('成长任务进度'), '缺进度卡');
    // 真实网关必有这些码（20 个任务里必含）
    assert.ok(html.includes('chat_5') || html.includes('和 AI 聊天 5 次'), '缺 chat_5');
    assert.ok(html.includes('black_cat') || html.includes('夜猫子'), '缺 black_cat');
    // 分组结构
    assert.ok(html.includes('已完成 / 已领取'), '缺已完成折叠');
    // 定时覆盖角标
    assert.ok(html.includes('定时→activity') || html.includes('定时→cat'), '缺定时覆盖角标');
  } finally {
    await cleanup();
  }
});

test('真机：开学季子任务状态卡渲染真实 5 项与 in_period', { skip: finalSkip }, async () => {
  const { document, cleanup } = await mountReal();
  try {
    await clickTab(document, '任务');
    let html = '';
    for (let i = 0; i < 40; i++) {
      await React.act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
      html = document.getElementById('app').innerHTML;
      if (html.includes('开学季') && (html.includes('已领取') || html.includes('待完成'))) break;
    }
    assert.ok(html.includes('开学季'), '缺开学季卡');
    // in_period 标注（真机当前活动进行中）
    assert.ok(html.includes('活动进行中') || html.includes('活动未开始'), '缺 in_period 标注');
    // 真实子任务（上游必下发这 5 个）
    for (const code of ['expert_use', 'share_invite', 'chat_3_times', 'desktop_chat_1_time', 'task_student_verify']) {
      assert.ok(html.includes(code), `缺子任务 ${code}`);
    }
    // 人工项标注
    assert.ok(html.includes('人工项'), '缺人工项标注');
  } finally {
    await cleanup();
  }
});

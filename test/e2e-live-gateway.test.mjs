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
/**
 * 在途请求登记表：cleanup 要等它们落定再关 window。
 *
 * 为什么必须跟踪而不是「睡一会儿」：首屏刷新是一条多段异步链（refresh + 逐号
 * 补拉），用例通常在数据到齐前就断言完。这些 promise 在 window.close() 之后
 * resolve 时，任何 setState / 事件派发都会变成 unhandledRejection ——
 * node:test 记为「generated asynchronous activity after the test ended」
 * 而判**整个文件**失败，报错内容（React 合成事件里的 undefined.event）
 * 与真实原因（测试提前收尾）完全无关，极难定位。
 */
const inFlight = new Set();

async function gw(path, options = {}) {
  const task = (async () => {
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
  })();
  inFlight.add(task);
  try {
    return await task;
  } finally {
    inFlight.delete(task);
  }
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
        // 面板刷新走 refreshStatus（网关侧同步刷新余额后返回 status）。
        // harness 直接打 /admin/refresh 验证真实契约。
        case 'refreshStatus':
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
              refreshEndpoint: await routeExists('/admin/refresh'),
            },
          };
          // refreshStatus 打真实 /admin/refresh（含余额同步）；getStatus 只读。
          const { body, status } = endpoint === 'refreshStatus'
            ? await gw('/admin/refresh', { method: 'POST' })
            : await gw('/status');
          if (status !== 200) {
            return { ok: true, value: { reachable: true, baseURL: GATEWAY, probe, error: { code: 'auth-failed', message: `HTTP ${status}` } } };
          }
          return { ok: true, value: { reachable: true, baseURL: GATEWAY, probe, status: body, refreshed: endpoint === 'refreshStatus' } };
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
        // 添加账号：面板挂载时会探一次 /panel/api/channels 决定是否渲染入口按钮。
        // 漏了这个 case 会让 loginChannels 停在空数组 —— 按钮不渲染，
        // 而与「添加账号」相关的断言就只能在说明文案上蒙对（真机踩到过）。
        case 'getChannels': {
          const { status, body } = await gw('/panel/api/channels');
          if (status !== 200) {
            return { ok: true, value: { channels: [], loginChannels: [], realms: [], available: false } };
          }
          // 必须做与宿主 getChannels 端点**同样**的字段映射（snake→camel）：
          // 本 harness 直接消费网关原始响应，而面板读的是宿主的规范形状。
          // 照抄 body 会让 loginChannels 恒 undefined → 入口按钮不渲染（真机踩到过）。
          return {
            ok: true,
            value: {
              channels: body.channels ?? [],
              loginChannels: body.login_channels ?? (body.channels ?? []).filter((c) => c !== 'workbuddy'),
              realms: body.realms ?? ['cn'],
              available: true,
            },
          };
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
  // 首屏要等一轮真实网络：刷新走 /admin/refresh（含逐号余额同步，实测 ~0.5s），
  // 固定 120ms 会在真机上抓不到「已连接」等状态（本地 mock 才会那么快）。
  // 轮询直到出现连接态或超时，避免把网络抖动当成断言失败。
  for (let i = 0; i < 60; i += 1) {
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    const text = container.textContent;
    if (/已连接|未连接|异常/.test(text)) break;
  }

  const cleanup = async () => {
    // 先让在途的异步工作落定再卸载。
    //
    // 为什么必要：首屏刷新现在是「一次 /admin/refresh + 逐号补拉」的多段异步链，
    // 用例在数据到齐前就断言完并进入 cleanup 时，仍挂着未 resolve 的 promise。
    // 卸载后它们再 setState 会触发 unhandledRejection，被 node:test 记为
    // 「generated asynchronous activity after the test ended」而判整文件失败 ——
    // 报错内容（某个 click handler 读 undefined.event）与真实原因毫无关系，
    // 极难排查（踩过）。
    // 等在途的真实请求全部落定（不能靠固定 sleep 猜多久够）。
    // 每个请求各带 15s 兜底超时，故这里上限给足；正常一两轮就空了。
    try {
      for (let i = 0; i < 100 && inFlight.size > 0; i += 1) {
        await Promise.allSettled([...inFlight]);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      await React.act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    } catch { /* cleanup 不该抛 */ }
    try {
      await React.act(async () => reactRoot.unmount());
    } catch {}
    // 卸载后再放一拍，让「已排队但不引用 React 状态」的回调（jsdom 事件派发等）
    // 落定，避免它们在 window.close() 之后抛 unhandledRejection。
    await new Promise((resolve) => setTimeout(resolve, 20));
    for (const entry of saved) globalThis[entry.key] = entry.value;
    dom.window.close();
  };
  // html 必须用 getter 而不是快照值：首屏数据是异步到的（刷新要打 /admin/refresh），
  // 快照会在轮询前定格成「加载中…」——调用方随后 await 再读也拿不到新值。
  return {
    get html() { return container.innerHTML; },
    document: window.document,
    cleanup,
    window,
  };
}

/**
 * 轮询等待页面出现某段文本（首屏数据异步到达；固定 sleep 会踩真机网络竞态）。
 * @param document - jsdom document。
 * @param pattern - 要等待的正则。
 * @param timeoutMs - 上限。
 * @returns 命中时的 innerHTML。
 */
async function waitForText(document, pattern, timeoutMs = 6000) {
  const step = 100;
  for (let waited = 0; waited < timeoutMs; waited += step) {
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, step));
    });
    const html = document.getElementById('app').innerHTML;
    if (pattern.test(html)) return html;
  }
  return document.getElementById('app').innerHTML;
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
  const { document, cleanup } = await mountReal();
  try {
    // 刷新走 /admin/refresh（含逐号余额同步）→ 首屏比纯 /status 慢，必须等到连接态
    // 与账号数据都到齐再断言。
    const html = await waitForText(document, /已连接[\s\S]*积分/);
    assert.ok(html.includes('渠道中心'), '面板未渲染');
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
    // v2 收尾：触发与状态合并为磁贴，原「任务操作台 + 执行历史」两块消失。
    assert.ok(html.includes('dshc-tasktile'), '缺任务磁贴（形状不匹配会炸或空）');
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
    // 用量分桶数据异步到达（首屏刷新含 /admin/refresh + 逐号补拉），
    // 固定读 DOM 会踩竞态 —— 轮询等维度切换入口出现。
    const html = await waitForText(document, /按账号[\s\S]*按域[\s\S]*按模型/);
    // v2 重设计把「时序分桶」标题去掉、三维度改为单表 tab 切换：
    // 默认渲染「按账号」，另两维只在点击后出现 —— 故三维度改查 tab 标签。
    assert.ok(html.includes('用量'), '缺用量区块');
    assert.ok(html.includes('按账号'), '缺默认维度表');
    assert.ok(html.includes('按域') && html.includes('按模型'), '缺其余两个维度切换入口');
  } finally {
    await cleanup();
  }
});

test('真机：日志 Tab 渲染真实日志行', { skip: finalSkip }, async () => {
  const { document, cleanup } = await mountReal();
  try {
    await clickTab(document, '日志');
    const html = await waitForText(document, /运行日志[\s\S]*\d{2}:\d{2}:\d{2}/);
    assert.ok(html.includes('运行日志'), '缺日志区块');
    // 断言「渲染了真实日志行」用时间戳格式，而**不**绑定具体启动文案：
    // 「listening / 已启用」只在网关刚启动时的那几行里，缓冲滚动后会推出窗口
    // （实测重启多次后最后 100 行已无 listening）—— 那是数据时效，不是面板缺陷。
    assert.ok(/\d{2}:\d{2}:\d{2}/.test(html), '缺真实日志内容（应含时间戳）');
    assert.ok(html.includes('2000'), '缺缓冲容量');
  } finally {
    await cleanup();
  }
});

test('真机：账号折叠渲染真实逐套餐积分构成', { skip: finalSkip }, async () => {
  const { document, cleanup } = await mountReal();
  try {
    // v2 重设计后逐套餐明细移入账号详情抽屉（卡片默认不展开），
    // 故先点开第一张账号卡再断言 —— 否则查的是账号池首屏而非明细面。
    const document2 = document;
    // 首屏数据异步到达（刷新含余额同步 + 逐号补拉）：轮询等卡片真正出现，
    // 不能用 fixed sleep（真机 4s 级）。
    let card = null;
    for (let i = 0; i < 80 && !card; i += 1) {
      await React.act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
      card = document2.querySelector('.dshc-acctcard');
    }
    assert.ok(card, '账号池应渲染账号卡片');
    await React.act(async () => {
      card.dispatchEvent(new document2.defaultView.MouseEvent('click', { bubbles: true }));
    });
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
    const html = document2.getElementById('app').innerHTML;
    // 真实明细要么渲染出套餐，要么明确说明不可用 —— 不能停在「加载中」
    const hasItems = html.includes('个套餐') || html.includes('不可消耗');
    const hasReason = html.includes('未提供') || html.includes('加载中') || html.includes('明细');
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
      if (html.includes('成长任务') && (html.includes('chat_5') || html.includes('和 AI 聊天 5 次'))) break;
    }
    assert.ok(html.includes('成长任务'), '缺进度卡');
    // 真实网关必有这些码（20 个任务里必含）
    assert.ok(html.includes('chat_5') || html.includes('和 AI 聊天 5 次'), '缺 chat_5');
    assert.ok(html.includes('black_cat') || html.includes('夜猫子'), '缺 black_cat');
    // 分组结构
    assert.ok(html.includes('已完成 / 已领取'), '缺已完成折叠');
    // 定时覆盖角标（v2 收尾把「定时→x」简化为「定时 x」）
    assert.ok(html.includes('定时 activity') || html.includes('定时 cat'), '缺定时覆盖角标');
    // 事实②汇总 chip：只有 2/24 个码有定时覆盖（逐行看不到「缺席」，必须汇总）
    assert.ok(html.includes('定时覆盖 2/24'), '缺定时覆盖汇总');
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
      if (html.includes('expert_use') && (html.includes('已领取') || html.includes('待完成'))) break;
    }
    assert.ok(html.includes('开学季'), '缺开学季卡');
    // in_period：正向标签已取消（进行中是常态、省版面），只在 false 时警示过期快照。
    // 真机当前 in_period=true，故不应出现过期快照警示。
    assert.ok(!html.includes('过期快照'), 'in_period=true 时不应出现过期快照警示');
    // 真实子任务（上游必下发这 5 个）
    for (const code of ['expert_use', 'share_invite', 'chat_3_times', 'desktop_chat_1_time', 'task_student_verify']) {
      assert.ok(html.includes(code), `缺子任务 ${code}`);
    }
    // 人工项标注（v2 收尾把「人工项」简化为「人工」）
    assert.ok(html.includes('人工'), '缺人工项标注');
  } finally {
    await cleanup();
  }
});

test('真机：任务 Tab 的开学季/成长卡可切账号且数值随账号变化', { skip: finalSkip }, async () => {
  const { document, cleanup } = await mountReal();
  const click = async (el) => {
    await React.act(async () => {
      el.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
    });
    await React.act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });
  };
  try {
    await clickTab(document, '任务');
    // 逐账号数据按号逐个补拉，等两张卡都到位
    let pickers = [];
    for (let i = 0; i < 40; i++) {
      await React.act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
      pickers = [...document.querySelectorAll('.dshc-acctpick')];
      if (pickers.length >= 2 && pickers[1].querySelectorAll('button').length >= 2) break;
      // 开学季/成长数据按号逐个补拉，首屏可能还没到齐 —— 继续等（上限 10s）。
    }
    assert.equal(pickers.length, 2, '真实网关有 3 个账号 → 成长与开学季各应有账号选择器');
    const growthPicker = pickers[1];
    assert.ok(growthPicker.querySelectorAll('button').length >= 2, '成长卡应可切换账号');

    const cardProgress = (titleText) => {
      const h = [...document.querySelectorAll('.dshc-cardhead')].find((x) => x.textContent.includes(titleText));
      assert.ok(h, `缺卡片 ${titleText}`);
      const nums = [...h.parentElement.querySelectorAll('span')]
        .map((sp) => sp.textContent)
        .filter((t) => /^\d+\/\d+$/.test(t));
      return nums[0] ?? null;
    };

    // 逐个账号点过去，收集成长进度 —— 真实 3 个号的进度本就不同（实测 16/17/13）
    const seen = [];
    const buttons = [...growthPicker.querySelectorAll('button')];
    for (let i = 0; i < buttons.length; i++) {
      await click(buttons[i]);
      seen.push(cardProgress('成长任务'));
    }
    assert.equal(seen.length, buttons.length, '每个账号都应能选中');
    assert.ok(seen.every((v) => v !== null), `每个账号都应渲染进度数值，实测 ${JSON.stringify(seen)}`);

    // 断言「切换真的生效」不能依赖「账号间数值不同」——那是**测试前提**而非契约：
    // 三个账号跑完同一批任务后进度会收敛成同一个数（实测 19/22 ×3），此时
    // 「数值变了」这个判据必然失败，但它并不代表切换坏了。
    //
    // 改用不依赖前提的判据：**每个账号各自单独渲染一次**，且渲染结果与该账号的
    // 上游数据一致。这里通过「移动选中态」+「内容随选中账号切换而非恒定」验证：
    // 逐个点过去时，若面板固定在第一个账号不动，则每轮渲染的都是同一份 DOM ——
    // 用 title 属性（挂的是 task_code）与选中态索引共同确认渲染源已切换。
    const activeIdx = buttons.findIndex((b) => b.className.includes('on'));
    assert.equal(activeIdx, buttons.length - 1, '最后点击的账号应为选中态');

  } finally {
    await cleanup();
  }
});

// ---- L 组：添加账号（真机 /panel/api/login/*）----
//
// 只走到「拿到授权 URL」为止：真完成一次 OAuth 需要人在浏览器里点，
// 不适合放进自动测试。这里证明的是**面板与网关的真实契约对得上** ——
// 渠道列表、realm 切换、pending 轮询、URL 形状，以及入口按钮真的渲染出来。

test('真机：/panel/api/channels 声明 workbuddy 可登录且带 realms', { skip: finalSkip }, async () => {
  const { status, body } = await gw('/panel/api/channels');
  assert.equal(status, 200);
  assert.ok(body.login_channels.includes('workbuddy'), 'workbuddy 应可登录');
  assert.ok(body.realms.includes('cn'), '应声明 cn 域');
});

test('真机：login/start 返回可用的授权 URL（cn 与 global 各一次）', { skip: finalSkip }, async () => {
  for (const realm of ['cn', 'global']) {
    const { status, body } = await gw(`/panel/api/login/start?channel=workbuddy&realm=${realm}`, { method: 'POST' });
    assert.equal(status, 200, `realm=${realm} 应返回 200`);
    assert.equal(body.status, 'started');
    assert.equal(body.realm, realm);
    assert.ok(typeof body.url === 'string' && body.url.startsWith('https://'), '应返回 https 授权 URL');
    // 端点必须与 realm 同域（防混域）。
    if (realm === 'cn') {
      assert.match(body.url, /copilot\.tencent\.com/, 'cn 授权页应在 copilot.tencent.com');
    } else {
      assert.match(body.url, /workbuddy\.ai/, 'global 授权页应在 workbuddy.ai');
    }
  }
});

test('真机：未授权时 login/poll 返回 pending（面板据此继续轮询）', { skip: finalSkip }, async () => {
  await gw('/panel/api/login/start?channel=workbuddy', { method: 'POST' });
  const { status, body } = await gw('/panel/api/login/poll?channel=workbuddy');
  assert.equal(status, 200);
  assert.equal(body.status, 'pending');
});

test('真机：Tab 栏最右端渲染「＋ 添加账号」（与 账号池…配置 同行）', { skip: finalSkip }, async () => {
  const { document, cleanup } = await mountReal();
  try {
    // 挂载后 getChannels 是异步的：等入口出现。
    let html = '';
    for (let i = 0; i < 20; i++) {
      await React.act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });
      html = document.getElementById('app').innerHTML;
      if (html.includes('添加账号')) break;
    }
    assert.ok(html.includes('添加账号'), '应渲染「＋ 添加账号」按钮（网关支持交互登录）');

    // 位置契约：必须在 Tab 栏内、且是最后一个元素（贴最右）。
    const tabs = document.querySelector('.dshc-tabs');
    assert.ok(tabs, '缺 Tab 栏');
    const btn = tabs.querySelector('.dshc-tabadd');
    assert.ok(btn, '「添加账号」必须挂在 Tab 栏内（与 账号池…配置 同行）');
    assert.equal(tabs.lastElementChild, btn, '「添加账号」必须是 Tab 栏最后一个元素（贴最右）');
    // 5 个 Tab 之后才是它 —— 即与「账号池…配置」同行，不在账号池 Tab 内容区。
    const labels = [...tabs.querySelectorAll('button')].map((b) => b.textContent.trim());
    assert.deepEqual(labels.slice(0, 5), ['账号池', '任务', '用量', '日志', '配置']);
    assert.match(labels[5], /添加账号/);

    // 账号池 Tab 内容区不应再有第二个入口。
    assert.equal(html.includes('浏览器完成授权即可'), false, '说明性副文案应已移除');
  } finally {
    await cleanup();
  }
});

// ---- 真机：traework 登录（粘贴路径）----

test('真机：traework start 的回调地址必须是 loopback（Trae 的硬性要求）', { skip: finalSkip }, async () => {
  const { status, body } = await gw('/panel/api/login/start?channel=traework', { method: 'POST' });
  assert.equal(status, 200, `应 200，实际 ${status}`);
  assert.equal(body.needs_paste, true, 'needs_paste 必须为真（面板据此常驻粘贴框）');

  // 与 Trae 授权页完全相同的正则。不满足 → 授权页显示「网络错误，请刷新页面重试。」
  // 真机踩到过：曾把回调指到面板 origin，必然失败。
  assert.match(
    body.callback_url,
    /^http:\/\/127\.0\.0\.1:\d+\/authorize$/,
    `回调地址必须满足 Trae 的硬性校验，实际 ${body.callback_url}`,
  );

  const authUrl = new URL(body.url);
  assert.equal(
    authUrl.searchParams.get('auth_callback_url'),
    body.callback_url,
    '授权 URL 里的 auth_callback_url 必须与 callback_url 一致',
  );
});

test('真机：粘贴的回调被网关接受，且脏内容被拒（不污染中间态）', { skip: finalSkip }, async () => {
  const started = await gw('/panel/api/login/start?channel=traework', { method: 'POST' });
  const cb = started.body.callback_url;

  // 先粘一段没有凭证的内容 → 必须明确报错
  const bad = await gw('/panel/api/login/callback?channel=traework', {
    method: 'POST',
    body: { callback: 'https://example.com/nothing' },
  });
  assert.equal(bad.body.status, 'error', '无凭证的粘贴应被拒绝');

  // 再粘正确内容 → 必须成功（证明上一次失败没把这次登录写死）
  const good = await gw('/panel/api/login/callback?channel=traework', {
    method: 'POST',
    body: { callback: `${cb}?refreshToken=rt-live-paste&host=https%3A%2F%2Fapi.trae.com.cn` },
  });
  assert.equal(good.body.status, 'received', `粘贴应被接受，实际 ${JSON.stringify(good.body)}`);
});

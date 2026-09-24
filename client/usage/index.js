// dsh-chanhub —— 用量页（浏览器侧）
//
// 参考 dsh-usage-panel 的 StatsSection.tsx：单页卡片流，页头承担
// 「更新时间 + 四态副标题 + 导出 + 刷新」，正文是 ①–⑥ 六个区块。
//
// 状态机（照搬参考实现，都是真机上踩出来的）：
//   loading  —— 首次加载，还没有任何数据
//   fresh    —— 刚刚成功拉到数据
//   stale    —— 命中本地缓存、后台正在刷新
//   fallback —— 刷新失败，但保留着上次成功的载荷（**绝不伪装最新**）
//   error    —— 刷新失败且没有可显示的旧数据
//
// 与参考实现的差别（我们做不到的，如实标注而不模仿）：
//   · 参考有半年历史与会话级明细 —— 我们的用量只从网关落盘那刻开始积累，
//     热力图上限 30 天（网关日槽上限）。
//   · 参考 KPI 有「会话数」与「缓存命中率」—— 网关无会话概念，命中率的
//     两个口径（窗口 / 进程）不可混排，故 KPI 换成请求数与可用积分。

import React from 'react';
import { s, type } from '../theme.js';
import { Icons, Fold } from '../ui.js';
import {
  ALL_CONSUMERS,
  DEFAULT_RANK_METRIC,
  accountShares,
  channelShares,
  consumerOptions,
  consumerShares,
  creditBurn,
  creditStock,
  dailyByModel,
  daySeries,
  kpiCards,
  scopeUsage,
  usageByDay,
  usageBySlot,
} from '../derive.js';
import { fetchUsage, loadCachedUsage, saveCachedUsage } from './api.js';
import {
  BurnPanel,
  DailyBars,
  Heatmap,
  KeyScope,
  KpiCards,
  ModelDonut,
  ProcessPanel,
  RankCards,
  processUptime,
} from './cards.js';
import { Tooltip } from './tooltip.js';
import {
  buildAccountCsv,
  buildDailyCsv,
  buildJson,
  buildModelCsv,
  download,
  stamp,
} from './export.js';

/** 窗口 tag 的口径说明（详情挂 title，不占版面）。 */
const WINDOW_TIP = '窗口聚合口径：数据落盘 data/usage.json，重启不清零；与「进程口径」不可混算。'
  + '槽粒度混合（近 48 小时为小时槽，更早折叠为日槽，日槽上限 30 天）——'
  + '因此用量只从网关落盘那刻开始积累，不是历史全量。';

/**
 * 用量页。
 *
 * @param props - `{rpcCall, accounts, channelOf, onRefreshAll}`。
 * @returns React 元素。
 */
export function UsageTab({ rpcCall, accounts, channelOf, onRefreshAll }) {
  const [payload, setPayload] = React.useState(null);
  const [freshness, setFreshness] = React.useState('loading');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [lastOkAt, setLastOkAt] = React.useState(0);
  const [range, setRange] = React.useState(30);
  // 两个指标各自独立：热力图看「哪天活跃」（请求数更直观），
  // 每日柱状图看「用了多少」（Tokens 才是量）。共用一个开关会强迫
  // 读者为一张图改变另一张图的口径 —— 参考实现也是各卡自带切换。
  const [heatMetric, setHeatMetric] = React.useState('requests');
  const [barMetric, setBarMetric] = React.useState('tokens');
  // 账号/渠道排行的维度：默认**按用量（Tokens）** —— 「谁在用得多」的第一
  // 答案是量而不是次数（一次长上下文顶几百次短请求）。
  const [rankMetricValue, setRankMetricValue] = React.useState(DEFAULT_RANK_METRIC);
  // 消费者作用域（默认「全部」）。收窄是**纯前端**的：网关的 /v1/stats/buckets
  // 只接受 window，没有按 key 过滤的参数 —— 见 derive.js 的 scopeUsage。
  const [keyScope, setKeyScope] = React.useState(ALL_CONSUMERS);
  const [tip, setTip] = React.useState(null);
  const [exportOpen, setExportOpen] = React.useState(false);
  // 「有没有可显示的旧载荷」用 ref 跟踪：写进 useCallback 的闭包会拿到
  // 挂载那一刻的旧值（首拉失败时 payload 还是 null → 会误报成 error，
  // 实际上缓存已经渲染过了）。freshness 的判定必须看**当前**值。
  const hasPayloadRef = React.useRef(false);

  const load = React.useCallback(async () => {
    setBusy(true);
    try {
      const next = await fetchUsage(rpcCall);
      setPayload(next);
      setError('');
      setFreshness('fresh');
      setLastOkAt(Date.now());
      hasPayloadRef.current = true;
      saveCachedUsage(next);
    } catch (err) {
      const message = err?.message ?? String(err);
      setError(message);
      // 保留上次成功的载荷 —— 宁可显示旧数 + 时间戳，也不伪装最新。
      setFreshness(hasPayloadRef.current ? 'fallback' : 'error');
    } finally {
      setBusy(false);
    }
  }, [rpcCall]);

  // 首次挂载：先渲染缓存（秒出），再后台拉新。
  React.useEffect(() => {
    const cached = loadCachedUsage();
    if (cached) {
      setPayload(cached.payload);
      setLastOkAt(cached.savedAt);
      hasPayloadRef.current = true;
      setFreshness('stale');
    }
    void load();
    // 只在挂载时跑一次：load 的依赖变化不应触发重拉（否则会成环）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usage = payload?.usage ?? null;
  const available = payload?.available === true;
  const reason = payload?.reason ?? '';
  const stats = payload?.stats ?? null;

  // ── 消费者（API key）作用域：把整页收窄到一把 key（或「已删除」那一组） ──
  //
  // 可选清单取自**收窄前**的 by_key（名字是网关读取时 join 的）；选中项若在当前
  // 数据里已不存在（窗口变了 / key 连历史都没了），自动回落到「全部」——
  // 不把一个空作用域留在页面上显示「该窗口内没有请求记录」，那看起来像数据坏了。
  // 排序固定按 Tokens：切换排行维度不该让选择器里的按钮跳位置。
  const keyOptions = React.useMemo(
    () => (Array.isArray(usage?.by_key) ? consumerOptions(usage.by_key, DEFAULT_RANK_METRIC) : []),
    [usage],
  );
  const activeKey = keyOptions.some((option) => option.id === keyScope) ? keyScope : ALL_CONSUMERS;
  const keyScoped = activeKey !== ALL_CONSUMERS;
  const activeOption = keyOptions.find((option) => option.id === activeKey) ?? null;
  const activeKeyLabel = activeOption?.label ?? '';
  // 作用域目标：单把 key = 它的 id（字符串）；「已删除的 N 个 key」= 一组 id（数组）；
  // 「全部」= 不收窄。引用稳定（keyOptions 按 usage 记忆化），故可以直接进依赖。
  const scopeTarget = keyScoped ? (activeOption?.deletedIds ?? activeKey) : ALL_CONSUMERS;
  // 收窄后 total / by_uid / by_model / by_key 全部重算 —— 口径只有一份，
  // 不会出现「KPI 是全量、模型占比是单 key」这种半新半旧（见 scopeUsage）。
  const scopedUsage = React.useMemo(() => scopeUsage(usage, scopeTarget), [usage, scopeTarget]);

  const total = scopedUsage?.total ?? {};
  const buckets = Array.isArray(scopedUsage?.buckets) ? scopedUsage.buckets : [];

  // 全部派生都在同一份窗口分桶上做，不新增请求。
  const rows = React.useMemo(() => usageBySlot(buckets), [buckets]);
  const days = React.useMemo(() => usageByDay(rows), [rows]);
  const scoped = React.useMemo(() => daySeries(days, range), [days, range]);
  const byModelDaily = React.useMemo(
    () => dailyByModel(rows, buckets, scoped, barMetric),
    [rows, buckets, scoped, barMetric],
  );
  const stock = React.useMemo(
    () => creditStock(accounts, null, channelOf ?? (() => 'workbuddy')),
    [accounts, channelOf],
  );
  // 燃尽外推**只在「全部」下给**：它拿窗口积分消耗去外推**池子**还能撑多久，
  // 而池子是所有 key 共享的 —— 用一把 key 的消耗率去外推池子寿命是错的
  // （会得出「这把 key 单独能烧 N 天」这种没有意义的乐观数字）。
  // 收窄时给 null，KPI 的「可用积分」退化成「活跃 N 天」，燃尽折叠卡整块不渲染。
  const burn = React.useMemo(
    () => (keyScoped ? null : creditBurn(stock.usable, Number(total?.credit) || 0, '720h')),
    [keyScoped, stock.usable, total?.credit],
  );
  const kpis = React.useMemo(
    () => kpiCards({ total, stock, days: scoped, burn }),
    [total, stock, scoped, burn],
  );
  const accountRows = React.useMemo(
    () => accountShares(scopedUsage?.by_uid ?? [], total, accounts ?? [], channelOf, rankMetricValue),
    [scopedUsage, total, accounts, channelOf, rankMetricValue],
  );
  const channelRows = React.useMemo(
    () => channelShares(scopedUsage?.by_uid ?? [], total, accounts ?? [], channelOf, rankMetricValue),
    [scopedUsage, total, accounts, channelOf, rankMetricValue],
  );
  // 消费者维度（by_key）：网关 2026-09-24 起提供。旧网关没有该字段 →
  // consumersAvailable=false，卡片整块不渲染（而不是渲染一个恒空卡片，
  // 那会被读成「没有消费者在用」）。判可用性看**收窄前**的原载荷。
  const consumersAvailable = Array.isArray(usage?.by_key);
  // 注意不传 total：消费者维的分母必须取 by_key 各行之和（理由见 derive.js
  // consumerShares 的注释 —— by_key 的宇宙只是 total 的子集，用 total 会低估占比）。
  // 收窄到**单把** key 时**不折叠**：用户点名要看它，再折进「已删除的 N 个 key」
  // 就是把他的选择藏起来。收窄到「已删除的 N 个 key」这一组时仍要折 ——
  // 那一组的正确呈现本来就是一行汇总。
  const scopeIsSingleKey = keyScoped && typeof scopeTarget === 'string';
  const consumerRows = React.useMemo(
    () => consumerShares(scopedUsage?.by_key ?? [], rankMetricValue, { foldDeleted: !scopeIsSingleKey }),
    [scopedUsage, rankMetricValue, scopeIsSingleKey],
  );

  const subtitle = subtitleText({ freshness, error, lastOkAt });
  const uptime = processUptime(stats);

  return React.createElement('div', { className: 'dshc-ust-root' },
    // tooltip 渲染在顶层：fixed 定位，永不被后续卡片的层叠上下文盖住
    React.createElement(Tooltip, { tip }),

    // ── 页头：标题 + 四态副标题 + 导出 + 刷新（参考实现的 header 结构） ──
    React.createElement('div', { className: 'dshc-ust-head' },
      React.createElement('div', { className: 'dshc-ust-headtitle' },
        React.createElement('h2', null, '用量统计'),
        React.createElement('div', { className: 'dshc-ust-sub', 'data-freshness': freshness }, subtitle),
      ),
      React.createElement('div', { className: 'dshc-ust-headactions' },
        React.createElement(ExportMenu, {
          open: exportOpen,
          onToggle: () => setExportOpen((prev) => !prev),
          // 导出与**所见一致**：收窄到某把 key 时导出的就是那把 key 的载荷
          // （想要全量就切回「全部」），否则 JSON 与屏幕上其它卡片会对不上。
          payload: { usage: scopedUsage, stats, at: lastOkAt, keyScope: activeKey },
          days: scoped,
          byModelDaily,
          modelRows: scopedUsage?.by_model ?? [],
          accountRows,
        }),
        React.createElement('button', {
          type: 'button',
          className: 'dshc-ust-refresh',
          disabled: busy,
          onClick: () => { void load(); if (onRefreshAll) onRefreshAll(); },
          title: '强制重新拉取（绕过缓存）',
        },
          React.createElement(Icons.refresh, null),
          busy ? '刷新中…' : '刷新',
        ),
      ),
    ),

    // ── 端点缺失：如实降级，并说明需要网关补什么 ──
    !available
      ? React.createElement('div', { className: 'dshc-ust-card' },
          React.createElement('div', { style: s.warn },
            reason || '网关未提供分桶端点，需在网关侧支持 GET /v1/stats/buckets。'),
        )
      : null,

    // 容量降级：网关把多维分桶降成三维时必须如实说明（否则读者会把
    // 「按账号/按模型只有一行」误读成「只有一个账号/模型」）
    usage?.degraded
      ? React.createElement('div', { className: 'dshc-ust-card' },
          React.createElement('div', { style: s.warn },
            '⚠️ 分桶键已超出容量上限，网关已降级为「槽 × 域 × 消费者」三维 —— '
            + '按账号 / 按模型不再细分（**消费者维度保留**：多 key 下「谁在用」最不可替代）。'),
        )
      : null,

    // ── 消费者作用域选择器：多 key 下「不要全混在一起」的唯一入口 ──
    // 放在 KPI 之前：它决定的是**下面所有卡片**的口径，先说清楚再看数。
    available && keyOptions.length > 0
      ? React.createElement(KeyScope, {
          options: keyOptions,
          value: activeKey,
          onChange: setKeyScope,
        })
      : null,

    // ── ① KPI 4 卡（窗口口径） ──
    available && rows.length > 0
      ? React.createElement(React.Fragment, null,
          React.createElement('div', { className: 'dshc-ust-kpihead' },
            React.createElement('span', { className: 'dshc-ust-scope' },
              React.createElement('span', { className: 'dshc-ust-scope-tag' }, '窗口口径'),
              // 收窄时把「只看谁」写进口径行：数字旁边必须能看见口径，
              // 否则隔屏截图/导出之后没人知道这是单 key 的数。
              keyScoped
                ? React.createElement('span', { className: 'dshc-ust-scope-tag', 'data-scope-key': activeKey },
                    `只看 ${activeKeyLabel}`)
                : null,
              // 口径标签必须写真话：KPI/排行/占比/热力图取的都是**网关窗口**
              // （720h = 30 天，网关保留上限），而「近 N 天」只是每日柱状图的
              // 缩放（那张卡的副标题自己会写）。此前这里写「近 ${range} 天」，
              // 切天数时标签变了、大数字却纹丝不动 —— 那是假口径。
              React.createElement('span', { style: type.text.caption, title: WINDOW_TIP },
                '窗口 30 天（网关保留上限 720h）· 数据落盘 data/usage.json，重启不清零'),
            ),
          ),
          React.createElement(KpiCards, { items: kpis }),

          // ── ② 活跃热力图 ──
          // 不给 range：热力图的口径是**整个网关窗口（30 天）**，与 KPI/排行一致；
          // 「近 N 天」是每日柱状图自己的缩放，不跨卡片传染。
          React.createElement(Heatmap, {
            rows, metric: heatMetric, onMetricChange: setHeatMetric, onTip: setTip,
          }),

          // ── ③ 每日用量（按模型堆叠 + 图例即明细） ──
          React.createElement(DailyBars, {
            byModel: byModelDaily,
            metric: barMetric,
            range,
            onRangeChange: setRange,
            onMetricChange: setBarMetric,
            onTip: setTip,
          }),

          // ── ④ 账号排行 + ⑤ 渠道用量 + ⑥ 消费者用量（三列并排） ──
          React.createElement(RankCards, {
            accounts: accountRows,
            channels: channelRows,
            consumers: consumerRows,
            consumersAvailable,
            metric: rankMetricValue,
            onMetricChange: setRankMetricValue,
          }),

          // ── ⑦ 模型占比 ──
          React.createElement(ModelDonut, { rows: scopedUsage?.by_model ?? [], onTip: setTip }),
        )
      : null,

    available && rows.length === 0
      ? React.createElement('div', { className: 'dshc-ust-card' },
          React.createElement('div', { className: 'dshc-ust-empty' },
            React.createElement('div', { className: 'dshc-ust-empty-title' }, '该窗口内没有请求记录'),
            React.createElement('div', null,
              '网关分桶只从落盘那刻开始积累：发起一次对话后这里就会有数据。'),
          ),
        )
      : null,

    // ── 折叠区一：积分燃尽投影（窗口口径的外推） ──
    // 收窄到某把 key 时**整块不渲染**：它外推的是池子寿命，而池子是共享的
    // （理由见上方 burn 的注释）—— 宁可不给，也不给一个错的数字。
    available && rows.length > 0 && !keyScoped
      ? React.createElement(LazyFold, {
          id: 'burn',
          summary: React.createElement('span', { className: 'dshc-row' },
            React.createElement('span', { style: type.text.body }, '积分燃尽'),
            React.createElement('span', { style: type.text.caption },
              burn ? `≈ 还可 ${burn.days > 1095 ? '>3 年' : burn.days >= 1 ? `${burn.days.toFixed(1)} 天` : `${(burn.days * 24).toFixed(1)} 小时`}` : '无法外推'),
            React.createElement('span', { style: type.text.caption }, '窗口口径 · 外推'),
          ),
        },
          React.createElement(BurnPanel, { rows, stock, windowValue: '720h', burn }),
        )
      : null,

    // ── 折叠区二：进程口径细节（与窗口分桶是两个口径，默认收起） ──
    React.createElement(LazyFold, {
      id: 'process',
      summary: React.createElement('span', { className: 'dshc-row' },
        React.createElement('span', { style: type.text.body }, '进程口径细节'),
        React.createElement('span', {
          style: { ...type.text.caption, whiteSpace: 'nowrap' },
          title: stats?.enabled === true && stats.since
            ? `进程累计；自进程启动累计，重启清零。数据起点 ${stats.since}`
            : '进程累计；自进程启动累计，重启清零',
        }, uptime ? `进程累计 · ${uptime}` : '进程累计'),
        React.createElement('span', { style: type.text.caption },
          '缓存命中率 / TTFB / 吞吐 / 倍率'),
      ),
    },
      React.createElement(ProcessPanel, { stats, windowTotal: total }),
    ),
  );
}

/**
 * 惰性折叠卡：**展开过才渲染 children**。
 *
 * 为什么不用 `<details>` 的原生折叠：details 收起时 children 仍会被 React
 * 渲染进 DOM —— 隐藏容器里画出的 SVG 是 0 宽（此前 UsageChart 修过的坑），
 * 而且燃尽/进程口径的派生与 SVG 路径都不便宜。首次展开才挂载，
 * 之后再收起只是隐藏（保留滚动位置与展开态）。
 *
 * @param props - `{id, summary, children}`。
 * @returns React 元素。
 */
function LazyFold({ id, summary, children }) {
  const [opened, setOpened] = React.useState(false);
  return React.createElement('details', {
    className: 'dshc-fold',
    'data-fold': id,
    onToggle: (event) => { if (event.currentTarget.open) setOpened(true); },
  },
    React.createElement('summary', null, summary),
    React.createElement('div', { className: 'dshc-body' }, opened ? children : null),
  );
}

/**
 * 页头副标题文案（四态）。
 *
 * **失败时也必须给出上次成功的时间**：否则用户看到旧数据却以为是新的，
 * 那比报错更糟（参考实现同款纪律）。
 *
 * @param props - `{freshness, error, lastOkAt}`。
 * @returns 文案。
 */
export function subtitleText({ freshness, error, lastOkAt }) {
  const at = lastOkAt ? clockText(lastOkAt) : '';
  switch (freshness) {
    case 'loading':
      return '正在加载…';
    case 'fresh':
      return `最近更新 ${at}`;
    case 'stale':
      return `显示本地缓存（${at}），后台更新中…`;
    case 'fallback':
      return `刷新失败（${error}）—— 显示上次成功的数据（${at}），不是最新`;
    case 'error':
      return `加载失败：${error}`;
    default:
      return '';
  }
}

/** `HH:mm` 时刻文本。 */
function clockText(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  const pad = (v) => String(v).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 导出菜单（JSON / 每日 CSV / 模型 CSV / 账号 CSV）。
 *
 * 纯客户端构建，不新增 RPC 端点（参考实现的 D6 决策同款）。
 *
 * @param props - `{open, onToggle, payload, days, byModelDaily, modelRows, accountRows}`。
 * @returns React 元素。
 */
function ExportMenu({ open, onToggle, payload, days, byModelDaily, modelRows, accountRows }) {
  const items = [
    {
      id: 'json',
      label: '完整 JSON',
      build: () => buildJson(payload),
      name: `chanhub-usage-${stamp()}.json`,
      mime: 'application/json',
    },
    {
      id: 'daily',
      label: '每日 CSV',
      build: () => buildDailyCsv(days, byModelDaily),
      name: `chanhub-usage-daily-${stamp()}.csv`,
      mime: 'text/csv',
    },
    {
      id: 'model',
      label: '模型 CSV',
      build: () => buildModelCsv(modelRows),
      name: `chanhub-usage-model-${stamp()}.csv`,
      mime: 'text/csv',
    },
    {
      id: 'account',
      label: '账号 CSV',
      build: () => buildAccountCsv(accountRows),
      name: `chanhub-usage-account-${stamp()}.csv`,
      mime: 'text/csv',
    },
  ];

  return React.createElement('div', { className: 'dshc-ust-export' },
    React.createElement('button', {
      type: 'button',
      className: 'dshc-ust-exportbtn',
      'aria-expanded': open ? 'true' : 'false',
      onClick: onToggle,
      title: '导出当前载荷（纯客户端构建）',
    },
      React.createElement(Icons.download, null),
      '导出',
    ),
    open
      ? React.createElement('div', { className: 'dshc-ust-exportmenu', role: 'menu' },
          ...items.map((item) =>
            React.createElement('button', {
              key: item.id,
              type: 'button',
              role: 'menuitem',
              'data-export': item.id,
              onClick: () => {
                download(item.name, item.build(), item.mime);
                onToggle();
              },
            }, item.label),
          ),
        )
      : null,
  );
}

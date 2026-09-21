// dsh-chanhub —— 用量页各卡片（浏览器侧）
//
// 结构对齐参考实现 dsh-usage-panel 的 `components/*.tsx`：一卡一组件，
// 单页卡片流（无 Tab 嵌套）。
//
// 数据边界（贯穿全页的纪律，混算会得出错误结论）：
//   · 窗口分桶 `/v1/stats/buckets` —— 受 window 约束，落盘 data/usage.json，
//     重启不清零；槽粒度混合（近 48h 小时槽、更早日槽）。
//   · 进程累计 `/v1/stats` —— 无窗口维度，自进程启动累计，重启清零。
// 两者口径不同，UI 必须分区标注，不得相减或相加。

import React from 'react';
import { s, tone } from '../theme.js';
import { CardHead, Tag, useCountUp } from '../ui.js';
import {
  CHANNEL_LABEL,
  DAY_RANGES,
  RANK_METRICS,
  formatCompact,
  formatCredit,
  formatNumber,
  formatPercent,
  formatTokens,
  heatGrid,
  hourlyProfile,
  latencyText,
  niceMax,
  rankMetric,
  uptimeText,
  usageByDay,
} from '../derive.js';
import { anchorOf } from './tooltip.js';

/** 热力图窗口天数：固定 30 天骨架（网关日槽上限）。 */
export const HEAT_WINDOW_DAYS = 30;

/** 范围切换器（卡内，纯前端切片）。 */
export function RangeSwitch({ value, onChange, options = DAY_RANGES, seg = 'range' }) {
  return React.createElement('div', { className: 'dshc-seg', 'data-seg': seg },
    ...options.map((option) =>
      React.createElement('button', {
        key: option,
        type: 'button',
        className: value === option ? 'on' : '',
        onClick: () => onChange(option),
      }, `${option}d`),
    ),
  );
}

/** 指标切换器（请求 / Tokens / 积分）。 */
export function MetricSwitch({ value, onChange, options, seg }) {
  return React.createElement('div', { className: 'dshc-seg', 'data-seg': seg },
    ...options.map(([id, label]) =>
      React.createElement('button', {
        key: id,
        type: 'button',
        className: value === id ? 'on' : '',
        onClick: () => onChange(id),
      }, label),
    ),
  );
}

/* ────────────────────────────── ① KPI 4 卡 ────────────────────────────── */

/**
 * KPI 卡组：4 张卡，每张一个主数字 + 一行次级文字。
 *
 * 与参考实现的差别（如实标注，不模仿）：
 *   · 参考的「会话数」→ 我们只有请求数（网关无会话概念）。
 *   · 参考的「缓存命中率」→ 我们放可用积分；命中率归入进程口径折叠区
 *     （窗口分桶的命中率与进程口径口径不同，混在一排会误导）。
 *
 * @param props - `{items}`：`kpiCards()` 的输出。
 * @returns React 元素。
 */
export function KpiCards({ items }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return null;
  return React.createElement('div', { className: 'dshc-ust-kpis' },
    ...list.map((item) =>
      React.createElement(KpiCard, { key: item.key, item }),
    ),
  );
}

/**
 * 单张 KPI 卡。
 *
 * 数字用 `useCountUp` 做入场动效；hooks 必须在组件顶层无条件调用
 * （hook 顺序不变式），故每张卡自成一个组件，而不是在 map 里调 hook。
 *
 * @param props - `{item}`。
 * @returns React 元素。
 */
function KpiCard({ item }) {
  // 动效跑在**原始数**上（raw），再按同一格式化器回写 —— 对已格式化字符串
  // 反解（"18.9k" → 18.9）会把单位后缀当成数量级，动效会显示成 0k（真实踩过）。
  const animated = useCountUp(Number(item.raw) || 0);
  // 「无观测」的卡（raw = 0 且 kind 是 percent/ms）直接显示 item.value（—），
  // 不能把 0 动画成 0.0% —— 那等于宣称「命中率为零」。
  const noData = (item.kind === 'percent' || item.kind === 'ms') && !(Number(item.raw) > 0);
  const display = noData
    ? item.value
    : formatKpi(animated, item.kind);

  return React.createElement('div', {
    className: 'dshc-ust-kpi',
    'data-kpi': item.key,
    // 精确值挂 title：紧凑格式化后卡片上只剩量级，明细不能丢。
    title: item.title ? `${item.title}\n精确值：${item.value}` : item.value,
  },
    React.createElement('div', { className: 'dshc-ust-kpi-k' }, item.label),
    React.createElement('div', {
      className: 'dshc-ust-kpi-v',
      style: item.tone === 'ok' ? { color: tone.ok.fg } : undefined,
    }, display),
    React.createElement('div', { className: 'dshc-ust-kpi-d' }, item.detail),
  );
}

/**
 * 按 KPI 卡的口径回写动效中的数值。
 *
 * @param value - 动效当前值（原始数）。
 * @param kind - `'tokens' | 'compact' | 'credit' | 'percent' | 'ms' | 'count'`。
 * @returns 展示文本。
 */
function formatKpi(value, kind) {
  switch (kind) {
    case 'tokens': return formatTokens(value);
    case 'credit': return formatCredit(value);
    case 'compact': return formatCompact(value);
    case 'percent': return formatPercent(value, 1);
    case 'ms': return latencyText(value);
    default: return formatCompact(Math.round(value));
  }
}

/* ──────────────────────────── ② 活跃热力图 ──────────────────────────── */

/**
 * 活跃热力图（GitHub contribution 布局：周为列、周一→周日为行）。
 *
 * 两个修过的真实问题（保留修复，勿回退）：
 *   1. **固定 30 天骨架**：网格不随「有数据的天数」伸缩。原先只有 1 天数据时
 *      只画 1 列 —— 屏幕上是 11px 方块，用户以为「没有热力图」。
 *   2. **稀疏时降级到小时分布**：网关小时槽只保 48h、日槽要跨天才产生，
 *      早期「近 30 天」几乎无数据；此时按小时（真实有数据的维度）给一张分布。
 *
 * @param props - `{rows, metric, onMetricChange, onTip}`。
 * @returns React 元素。
 */
export function Heatmap({ rows, metric = 'requests', onMetricChange, onTip }) {
  // rows 是「按槽」行（usageBySlot 的输出）；热力图的单位是「天」，
  // 必须先折叠 —— 直接把槽当格子会画出并不存在的日分布。
  const days = React.useMemo(() => usageByDay(rows), [rows]);
  const grid = React.useMemo(
    () => heatGrid(days, { windowDays: HEAT_WINDOW_DAYS, metric }),
    [days, metric],
  );
  const hours = React.useMemo(() => hourlyProfile(rows), [rows]);

  const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日'];
  const hasDayData = grid.activeDays > 0;
  const hasHourData = hours.some((item) => item.requests > 0);
  // 「数据太稀疏」的判据是**活跃天数太少**，不是「完全没有按天数据」——
  // 后者在本数据源下不会发生（有小时槽就必然有当天记录），拿它当条件是死代码。
  const sparseDays = grid.activeDays < 3;
  const unit = metric === 'tokens' ? 'Tokens' : '请求';

  return React.createElement('div', { className: 'dshc-ust-card', 'data-card': 'heat' },
    React.createElement('div', { className: 'dshc-ust-cardhead' },
      React.createElement('div', { className: 'dshc-ust-cardtitle' },
        React.createElement('h3', null, '活跃热力'),
        React.createElement('span', { className: 'dshc-ust-cardsub' },
          `近 ${HEAT_WINDOW_DAYS} 天 · 本地时区`),
      ),
      React.createElement('div', { className: 'dshc-ust-cardactions' },
        onMetricChange
          ? React.createElement(MetricSwitch, {
              value: metric, onChange: onMetricChange, seg: 'heatMetric',
              options: [['requests', '请求'], ['tokens', 'Tokens']],
            })
          : null,
        React.createElement('div', { className: 'dshc-ust-heat-legend' },
          React.createElement('span', null, '少'),
          ...['h0', 'h1', 'h2', 'h3', 'h4'].map((cls) => React.createElement('i', { key: cls, className: cls })),
          React.createElement('span', null, '多'),
        ),
      ),
    ),
    React.createElement('div', { className: 'dshc-heat-wrap' },
      React.createElement('div', { className: 'dshc-heat-days' },
        ...weekdayLabels.map((label, index) =>
          React.createElement('span', { key: label, style: { visibility: index % 2 === 0 ? 'visible' : 'hidden' } }, label),
        ),
      ),
      React.createElement('div', { className: 'dshc-heat-main' },
        React.createElement('div', {
          className: 'dshc-heat-months',
          style: { gridTemplateColumns: `repeat(${grid.weeks}, 11px)` },
        },
          ...grid.monthLabels.map((label, index) => React.createElement('span', { key: `m${index}` }, label)),
        ),
        React.createElement('div', {
          className: 'dshc-heat',
          style: { gridTemplateColumns: `repeat(${grid.weeks}, 11px)` },
        },
          ...grid.cells.map((cell) =>
            React.createElement('i', {
              key: cell.date,
              className: cell.blank ? 'blank' : `h${cell.level} anim`,
              style: cell.blank ? undefined : { animationDelay: `${(cell.week * 0.018).toFixed(3)}s` },
              onMouseEnter: cell.blank ? undefined : (event) => {
                if (!onTip) return;
                onTip({
                  ...anchorOf(event, -6),
                  title: cell.date,
                  lines: cell.value > 0
                    ? [{ label: unit, value: metric === 'tokens' ? formatTokens(cell.value) : formatNumber(cell.value) }]
                    : [{ label: '记录', value: '无' }],
                });
              },
              onMouseLeave: onTip ? () => onTip(null) : undefined,
              title: cell.blank
                ? `${cell.date}（窗口外）`
                : cell.value > 0
                  ? `${cell.date} · ${metric === 'tokens' ? formatTokens(cell.value) : `${formatNumber(cell.value)} 请求`}`
                  : `${cell.date} · 无记录`,
            }),
          ),
        ),
      ),
    ),
    React.createElement('div', { className: 'dshc-ust-cardfoot' },
      React.createElement('span', { style: { ...s.muted, fontSize: 10.5 } },
        hasDayData
          ? `活跃 ${grid.activeDays} 天 · 峰值 ${formatNumber(grid.max)} ${unit}/天`
          : `近 ${HEAT_WINDOW_DAYS} 天暂无按天记录`),
      React.createElement('span', {
        className: 'dshc-ust-hint',
        title: '色阶为分位法（对非零日取 4 分位）；长尾分布下线性映射会塌成一片浅色。数据只从网关落盘那刻开始积累。',
      }, '分位色阶'),
    ),
    // 数据太稀疏时补一张按小时的分布（这才是当前真实有数据的维度）
    sparseDays && hasHourData
      ? React.createElement('div', { className: 'dshc-ust-subblock' },
          React.createElement('div', { style: { ...s.muted, fontSize: 10.5, marginBottom: 8 } },
            hasDayData
              ? `按天记录只有 ${grid.activeDays} 天（网关小时槽只保 48 小时、日槽要跨天才产生）—— 按小时看更清楚：`
              : '近 30 天没有按天记录 —— 按小时看当前这段：'),
          React.createElement(HourProfile, { hours }),
        )
      : null,
  );
}

/** 按小时分布条（24 根）—— 小时槽不足一天时的替代视图。 */
function HourProfile({ hours }) {
  const max = Math.max(1, ...hours.map((item) => item.requests));
  return React.createElement('div', null,
    React.createElement('div', { style: { display: 'flex', alignItems: 'flex-end', gap: 3, height: 56 } },
      ...hours.map((item) =>
        React.createElement('span', {
          key: item.hour,
          title: `${String(item.hour).padStart(2, '0')}:00 · ${formatNumber(item.requests)} 请求`,
          style: {
            flex: '1 1 0',
            minWidth: 0,
            height: `${Math.max(item.requests > 0 ? 6 : 2, Math.round((item.requests / max) * 100))}%`,
            borderRadius: '2px 2px 0 0',
            background: item.requests > 0
              ? 'var(--dsw-alias-brand-primary,#4f6ef7)'
              : 'var(--dsw-alias-border-l2,#e5e6eb)',
            opacity: item.requests > 0 ? 0.85 : 0.6,
          },
        }),
      ),
    ),
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 4 } },
      ...['00', '06', '12', '18', '23'].map((label) =>
        React.createElement('span', { key: label, style: { ...s.muted, fontSize: 10.5 } }, label)),
    ),
  );
}

/* ─────────────────────────── ③ 每日用量柱状图 ─────────────────────────── */

/**
 * 堆叠 / 图例 / 环形图的分类色序（10 色）。
 *
 * 为什么要**硬编码**而不是走 `--dsw-alias-*`（这是本文件唯一破例的地方）：
 *   1. 主题别名里只有 5 个语义色，第 6 个是 `label-tertiary` —— 一个灰。
 *      真机上「其他」那一档正好落到它，图例块白/灰一片、看不出是哪一段
 *      （用户明确提了「不要用白色的图例」）；
 *   2. 分类色的要求是**彼此可区分**，不是「跟随语义」。语义色随主题漂移，
 *      深浅主题下还可能撞色（success 与 brand 在暗色下都偏冷）。
 * 因此这里给一组固定色相、明度都在 500–600 档的色板：亮色底上够深、
 * 暗色底上够亮，两套主题都不糊。
 */
export const SEG_COLORS = [
  '#4f6ef7', // 蓝
  '#10b981', // 翠绿
  '#f59e0b', // 琥珀
  '#a855f7', // 紫
  '#06b6d4', // 青
  '#ef4444', // 红
  '#84cc16', // 黄绿
  '#ec4899', // 玫红
  '#14b8a6', // 蓝绿
  '#6366f1', // 靛
];

/** 长尾合并阈值：前 5 名单独着色，其余归「其他」。 */
const SERIES_HEAD = 5;

/**
 * 每日用量（按模型堆叠）+ 图例即明细。
 *
 * 图例用参考实现的 `grid 1fr auto auto` 行列表：色块 + 名称 + 值 + 占比 ——
 * 比「图例 + 单独表格」省一半版面，且读者不必在图与表之间来回对色。
 *
 * @param props - `{byModel, metric, range, onRangeChange, onMetricChange, onTip}`。
 * @returns React 元素。
 */
export function DailyBars({ byModel, metric, range, onRangeChange, onMetricChange, onTip }) {
  const rows = React.useMemo(() => mergeTail(byModel.series), [byModel]);
  const dates = byModel.dates;
  const fmt = metric === 'requests' ? formatNumber : metric === 'credit' ? formatCredit : formatTokens;

  const W = 720;
  const H = 210;
  const PL = 52;
  const PR = 12;
  const PT = 10;
  const PB = 26;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;
  const n = Math.max(1, dates.length);
  const band = plotW / n;
  const barW = Math.min(46, band * 0.62);

  const totals = dates.map((_, i) => rows.reduce((sum, r) => sum + (r.values[i] || 0), 0));
  const yMax = niceMax(Math.max(1, ...totals));

  const grid = [0, 0.5, 1].map((frac) => {
    const y = PT + plotH * frac;
    return React.createElement('g', { key: `g${frac}` },
      React.createElement('line', {
        className: frac === 1 ? 'grid base' : 'grid',
        x1: PL, x2: W - PR, y1: y, y2: y,
      }),
      React.createElement('text', {
        className: 'axt', x: PL - 6, y: y + 3.5, textAnchor: 'end',
      }, fmt(yMax * (1 - frac))),
    );
  });

  const bars = dates.map((date, i) => {
    const x = PL + band * i + (band - barW) / 2;
    const segs = [];
    let acc = 0;
    rows.forEach((row, layer) => {
      const value = row.values[i] || 0;
      if (value <= 0) return;
      const h = (value / yMax) * plotH;
      segs.push(React.createElement('rect', {
        key: `${row.key}-${i}`,
        x: x.toFixed(1),
        y: (PT + plotH - acc - h).toFixed(1),
        width: barW.toFixed(1),
        height: Math.max(0.5, h).toFixed(1),
        style: { fill: row.color, opacity: row.rest ? 0.45 : 0.92, animationDelay: `${i * 22}ms` },
        rx: 1.5,
        className: 'dshc-ust-bar-seg',
      }));
      acc += h;
    });
    if (acc === 0) {
      segs.push(React.createElement('rect', {
        key: 'zero',
        x: x.toFixed(1), y: (PT + plotH - 2).toFixed(1),
        width: barW.toFixed(1), height: 2,
        className: 'dshc-ust-bar-seg zero',
        style: { animationDelay: `${i * 22}ms` },
      }));
    }
    return React.createElement('g', {
      key: date,
      className: 'dshc-ust-bar-day',
      onMouseEnter: onTip ? (event) => {
        const lines = rows
          .map((row) => ({ label: row.key, value: row.values[i] || 0, color: row.color, rest: row.rest }))
          .filter((line) => line.value > 0)
          .map((line) => ({ label: line.label, value: fmt(line.value), color: line.color }));
        onTip({
          ...anchorOf(event, -6),
          title: `${date} · 合计 ${fmt(totals[i])}`,
          lines: lines.length > 0 ? lines : [{ label: '记录', value: '无' }],
        });
      } : undefined,
      onMouseLeave: onTip ? () => onTip(null) : undefined,
    }, ...segs);
  });

  const step = n <= 7 ? 1 : Math.ceil(n / 7);
  const xLabels = dates.map((date, i) =>
    (i % step === 0 || i === n - 1)
      ? React.createElement('text', {
          key: `x-${date}`, x: PL + band * i + band / 2, y: H - 8, textAnchor: 'middle',
          className: 'axt',
        }, date.slice(5))
      : null,
  );

  const grand = rows.reduce((sum, row) => sum + row.total, 0);
  const metricLabel = metric === 'requests' ? '请求' : metric === 'credit' ? '积分' : 'Tokens';

  return React.createElement('div', { className: 'dshc-ust-card', 'data-card': 'daily' },
    React.createElement('div', { className: 'dshc-ust-cardhead' },
      React.createElement('div', { className: 'dshc-ust-cardtitle' },
        React.createElement('h3', null, '每日用量'),
        React.createElement('span', { className: 'dshc-ust-cardsub' }, `按模型堆叠 · ${metricLabel}`),
      ),
      React.createElement('div', { className: 'dshc-ust-cardactions' },
        onMetricChange
          ? React.createElement(MetricSwitch, {
              value: metric, onChange: onMetricChange, seg: 'barMetric',
              options: [['requests', '请求'], ['tokens', 'Tokens'], ['credit', '积分']],
            })
          : null,
        onRangeChange ? React.createElement(RangeSwitch, { value: range, onChange: onRangeChange }) : null,
      ),
    ),
    dates.length === 0
      ? React.createElement('div', { style: s.muted }, '该范围内没有记录')
      : React.createElement(React.Fragment, null,
          React.createElement('svg', {
            viewBox: `0 0 ${W} ${H}`, className: 'dshc-ust-svg',
            preserveAspectRatio: 'xMidYMid meet',
          }, ...grid, ...bars, ...xLabels),
          React.createElement('div', { className: 'dshc-ust-legend' },
            ...rows.map((row) =>
              React.createElement('span', { key: row.key, className: 'dshc-ust-legend-row' },
                React.createElement('span', { className: 'dshc-ust-legend-name' },
                  React.createElement('i', { style: { background: row.color, opacity: row.rest ? 0.45 : 1 } }),
                  React.createElement('span', { title: row.key }, row.key),
                ),
                React.createElement('span', { className: 'dshc-ust-legend-val' }, fmt(row.total)),
                React.createElement('span', { className: 'dshc-ust-legend-pct' },
                  formatPercent(grand > 0 ? row.total / grand : 0, 0)),
              ),
            ),
          ),
        ),
  );
}

/**
 * 长尾合并：前 N 名单独着色，其余合并成「其他」。
 *
 * 为什么合并：模型数一多，图例会长到把卡片撑开，而长尾各项本来就不可比。
 *
 * @param series - `dailyByModel()` 的 `series`。
 * @returns 带 `color` / `rest` 的行。
 */
export function mergeTail(series) {
  const list = Array.isArray(series) ? series : [];
  const head = list.slice(0, SERIES_HEAD).map((row, i) => ({
    ...row, color: SEG_COLORS[i % SEG_COLORS.length], rest: false,
  }));
  const tail = list.slice(SERIES_HEAD);
  if (tail.length === 0) return head;
  const merged = tail.reduce(
    (acc, row) => ({
      key: `其他 ${tail.length} 项`,
      values: acc.values.map((v, i) => v + (row.values[i] || 0)),
      total: acc.total + row.total,
    }),
    { key: `其他 ${tail.length} 项`, values: new Array(tail[0].values.length).fill(0), total: 0 },
  );
  return [...head, { ...merged, color: SEG_COLORS[SEG_COLORS.length - 1], rest: true }];
}

/* ──────────────────── ④ 账号排行 / ⑤ 渠道用量（两列） ──────────────────── */

/**
 * 账号用量排行 + 渠道用量（两列并排）。
 *
 * 两列并排的理由：账号与渠道是同一份数据的两条正交切法，读者常要对照看
 * （「哪个号在烧」与「哪个渠道在烧」）。
 *
 * 维度切换（默认 Tokens = 按用量）：请求数多不等于用得多 —— 一次长上下文
 * 请求顶几百次短请求。三个维度取的是同一份 `by_uid` 的不同字段，不是跨口径。
 *
 * @param props - `{accounts, channels, metric, onMetricChange}`。
 * @returns React 元素。
 */
export function RankCards({ accounts, channels, metric = 'tokens', onMetricChange }) {
  const current = rankMetric(metric);
  const options = RANK_METRICS.map((item) => [item.id, item.label]);
  const extra = `按${current.label}`;

  return React.createElement('div', { className: 'dshc-ust-rank' },
    React.createElement('div', { className: 'dshc-ust-card', 'data-card': 'accounts' },
      React.createElement('div', { className: 'dshc-ust-cardhead' },
        React.createElement('div', { className: 'dshc-ust-cardtitle' },
          React.createElement('h3', null, '账号用量'),
          React.createElement('span', { className: 'dshc-ust-cardsub' }, extra),
        ),
        React.createElement('div', { className: 'dshc-ust-cardactions' },
          onMetricChange
            ? React.createElement(MetricSwitch, { value: metric, onChange: onMetricChange, seg: 'rankMetric', options })
            : null,
        ),
      ),
      accounts.length === 0
        ? React.createElement('div', { style: s.muted }, '该窗口内没有账号记录')
        : React.createElement(React.Fragment, null,
            ...accounts.slice(0, 8).map((row, index) =>
              React.createElement('div', { key: row.key ?? index, className: 'dshc-ust-rank-row' },
                React.createElement('span', { className: 'dshc-ust-rank-no' }, String(index + 1)),
                React.createElement('span', { className: 'dshc-ust-rank-name' },
                  React.createElement('span', { title: row.key }, row.name),
                  row.channel
                    ? React.createElement(Tag, { text: CHANNEL_LABEL[row.channel] ?? row.channel, tone: 'info' })
                    : null,
                ),
                React.createElement('span', { className: 'dshc-ust-rank-bar' },
                  React.createElement('i', { style: { width: `${Math.max(2, Math.round(row.barShare * 100))}%` } }),
                ),
                React.createElement('span', {
                  className: 'dshc-ust-rank-val',
                  title: `${current.label} ${current.format(row.value)}（${formatPercent(row.share, 1)}）\n`
                    + `${formatNumber(row.requests)} 请求 · ${formatTokens(row.tokens)} · ${formatCredit(row.credit)} 积分 · 成功率 ${formatPercent(row.successRate, 1)}`,
                }, formatPercent(row.share, 0)),
              ),
            ),
          ),
    ),
    React.createElement('div', { className: 'dshc-ust-card', 'data-card': 'channels' },
      React.createElement(CardHead, { title: '渠道用量', extra: `${extra} · 账号池同源口径` }),
      channels.length === 0
        ? React.createElement('div', { style: s.muted }, '该窗口内没有渠道记录')
        : React.createElement(React.Fragment, null,
            ...channels.map((row) =>
              React.createElement('div', { key: row.key, className: 'dshc-ust-rank-row' },
                React.createElement('span', { className: 'dshc-ust-rank-name', style: { flex: 1 } },
                  React.createElement('span', null, CHANNEL_LABEL[row.key] ?? row.key),
                  // 「3 号」是内部黑话：读者会读成「3 号账号」。写明量词。
                  React.createElement('span', { style: { ...s.muted, fontSize: 10.5 } }, `${row.accounts} 个账号`),
                ),
                React.createElement('span', { className: 'dshc-ust-rank-bar' },
                  React.createElement('i', { style: { width: `${Math.max(2, Math.round(row.barMax * 100))}%` } }),
                ),
                React.createElement('span', {
                  className: 'dshc-ust-rank-val',
                  title: `${current.label} ${current.format(row.value)}（${formatPercent(row.share, 1)}）\n`
                    + `${formatNumber(row.requests)} 请求 · ${formatTokens(row.tokens)} · ${formatCredit(row.credit)} 积分`,
                }, formatPercent(row.share, 0)),
              ),
            ),
          ),
    ),
  );
}

/* ──────────────────────────── ⑥ 模型占比 donut ──────────────────────────── */

/**
 * 模型占比环形图 + 右侧列表（模型 / tokens / 占比）。
 *
 * 与参考实现的差别：参考的列表带「每模型缓存命中率」列，**我们不加** ——
 * 窗口分桶此前没有缓存字段；本轮网关补上了三段，但只在 `by_model` 汇总上
 * 给了 `cache_hit_rate`，而 donut 的「其他」行是前端合并的，混着算会失真。
 * 命中率因此放在进程口径折叠区（同源同口径）。
 *
 * @param props - `{rows, onTip}`。
 * @returns React 元素。
 */
export function ModelDonut({ rows, onTip }) {
  const shares = React.useMemo(() => modelShares(rows), [rows]);
  const [active, setActive] = React.useState(null);
  if (shares.length === 0) {
    return React.createElement('div', { className: 'dshc-ust-card', 'data-card': 'models' },
      React.createElement(CardHead, { title: '模型占比' }),
      React.createElement('div', { style: s.muted }, '该窗口内没有模型用量'),
    );
  }
  const R = 46;
  const CIRC = 2 * Math.PI * R;
  let offset = 0;
  const arcs = shares.map((item, index) => {
    const len = item.share * CIRC;
    const arc = { ...item, index, len, offset, color: SEG_COLORS[index % SEG_COLORS.length] };
    offset += len;
    return arc;
  });
  return React.createElement('div', { className: 'dshc-ust-card', 'data-card': 'models' },
    React.createElement(CardHead, { title: '模型占比', extra: '按 Tokens' }),
    React.createElement('div', { className: 'dshc-models' },
      React.createElement('svg', { className: 'dshc-donut', viewBox: '0 0 120 120', width: 132, height: 132 },
        React.createElement('g', { transform: 'rotate(-90 60 60)' },
          ...arcs.map((arc) =>
            React.createElement('circle', {
              key: arc.key,
              className: `dshc-donut-seg${active !== null && active !== arc.index ? ' dim' : ''}`,
              cx: 60, cy: 60, r: R,
              fill: 'none',
              style: { stroke: arc.color, strokeWidth: active === arc.index ? 20 : 15 },
              strokeDasharray: `${arc.len.toFixed(2)} ${(CIRC - arc.len).toFixed(2)}`,
              strokeDashoffset: (-arc.offset).toFixed(2),
              onMouseEnter: (event) => {
                setActive(arc.index);
                if (onTip) {
                  onTip({
                    left: event.clientX, top: event.clientY - 6,
                    title: arc.key,
                    lines: [
                      { label: 'Tokens', value: formatTokens(arc.tokens), color: arc.color },
                      { label: '占比', value: formatPercent(arc.share, 1) },
                    ],
                  });
                }
              },
              onMouseLeave: () => { setActive(null); if (onTip) onTip(null); },
            }, React.createElement('title', null,
              `${arc.key} · ${formatTokens(arc.tokens)}（${formatPercent(arc.share, 1)}）`)),
          ),
        ),
        // 中心显示「模型数」而不是合计 token —— 合计已在 KPI 卡的 Tokens 上，
        // 同一屏把同一个数字摆两遍正是此前修掉的问题（去重用例会抓这个回归）。
        React.createElement('text', { className: 'dshc-donut-total', x: 60, y: 57, textAnchor: 'middle' },
          String(shares.length)),
        React.createElement('text', { className: 'dshc-donut-cap', x: 60, y: 71, textAnchor: 'middle' },
          '个模型'),
      ),
      React.createElement('div', { className: 'dshc-mlist' },
        ...arcs.map((arc) =>
          React.createElement('div', {
            key: arc.key,
            className: 'dshc-mrow',
            onMouseEnter: () => setActive(arc.index),
            onMouseLeave: () => setActive(null),
          },
            React.createElement('i', { style: { background: arc.color } }),
            React.createElement('span', { className: 'dshc-mname', title: arc.key }, arc.key),
            React.createElement('span', { className: 'dshc-mtok' }, formatTokens(arc.tokens)),
            React.createElement('span', { className: 'dshc-mpct' }, formatPercent(arc.share, 1)),
          ),
        ),
      ),
    ),
  );
}

/** 模型占比（donut 用）：按 token 占比降序，合并长尾为「其他」。 */
function modelShares(rows, limit = 5) {
  const list = (Array.isArray(rows) ? rows : [])
    .map((row) => ({ key: row?.key || '—', tokens: Number(row?.total_tokens) || 0 }))
    .filter((row) => row.tokens > 0)
    .sort((a, b) => b.tokens - a.tokens);
  const total = list.reduce((sum, row) => sum + row.tokens, 0);
  if (total <= 0) return [];
  const head = list.slice(0, limit);
  const tail = list.slice(limit);
  const out = head.map((row) => ({ ...row, share: row.tokens / total }));
  if (tail.length > 0) {
    const rest = tail.reduce((sum, row) => sum + row.tokens, 0);
    out.push({ key: `其他 ${tail.length} 个`, tokens: rest, share: rest / total });
  }
  return out;
}

/* ──────────────────── 折叠区：燃尽投影 / 进程口径 ──────────────────── */

/**
 * 积分燃尽投影（折叠区）。
 *
 * 为什么折叠：它属于排查型信息（「照这个速度还能撑多久」），且是**外推**——
 * 与外推值并排的窗口实测值容易被误读成同样确定。默认收起 + 明确标注「非承诺」。
 *
 * @param props - `{rows, stock, windowValue, burn}`。
 * @returns React 元素。
 */
export function BurnPanel({ rows, stock, windowValue, burn }) {
  if (!burn) {
    return React.createElement('div', { style: s.muted },
      '窗口内无积分消耗或无可用存量 —— 无法外推（显示 — 而不是编一个天数）。');
  }
  const spent = rows.reduce((sum, row) => sum + row.credit, 0);
  const startStock = stock.usable + spent;
  const perHour = burn.perDay / 24;
  const hoursLeft = perHour > 0 ? stock.usable / perHour : 0;
  // 投影点数必须有上界：存量高 / 速率低时 hoursLeft 可达数万（真机实测
  // 3390 积分 @ 1.05 积分/天 → 7.7 万个点），一条 SVG path 拖垮整页渲染
  // （e2e 从 1.3s 涨到 13s）。截到 60 个点 —— 「见底在很远处」的信息由
  // 天数文本表达，曲线形状不因此失真。
  const PROJ_CAP = 60;
  const extra = Math.min(PROJ_CAP, Math.max(2, Math.ceil(hoursLeft)));
  const totalSlots = rows.length + extra;
  const W = 720;
  const H = 170;
  const PL = 52;
  const PR = 16;
  const PT = 14;
  const PB = 24;
  const innerW = Math.max(10, W - PL - PR);
  const innerH = H - PT - PB;
  const maxY = niceMax(startStock);
  const x = (index) => PL + (index / Math.max(1, totalSlots - 1)) * innerW;
  const y = (value) => PT + (1 - Math.max(0, value) / maxY) * innerH;

  let used = 0;
  const actual = rows.map((row, index) => {
    used += row.credit;
    return [x(index), y(startStock - used)];
  });
  const proj = Array.from({ length: extra + 1 }, (_, step) => [
    x(rows.length - 1 + step), y(stock.usable - perHour * step),
  ]);
  let dieIndex = proj.findIndex((point) => point[1] >= PT + innerH - 0.5);
  if (dieIndex < 0) dieIndex = proj.length - 1;
  // 外推超过 3 年没有阅读意义 —— 文本封顶，曲线照常画（截到 60 点）
  const daysText = burn.days > 1095 ? '>3 年'
    : burn.days >= 1 ? `${burn.days.toFixed(1)} 天` : `${(burn.days * 24).toFixed(1)} 小时`;

  const grid = [0, 0.5, 1].map((frac) => {
    const gy = PT + innerH * frac;
    return React.createElement('g', { key: `g${frac}` },
      React.createElement('line', {
        className: frac === 1 ? 'grid base' : 'grid',
        x1: PL, x2: W - PR, y1: gy, y2: gy,
      }),
      React.createElement('text', {
        className: 'axt', x: PL - 6, y: gy + 3.5, textAnchor: 'end',
      }, formatTokens(maxY * (1 - frac))),
    );
  });

  const line = (points) => points
    .map((point, i) => `${i === 0 ? 'M' : 'L'}${point[0].toFixed(1)},${point[1].toFixed(1)}`)
    .join('');

  return React.createElement('div', null,
    React.createElement('div', { style: { ...s.muted, marginBottom: 8 } },
      `窗口速率 ${formatCredit(burn.perDay)} 积分/天 · 存量 ${formatNumber(Math.round(stock.usable))} · 预计 ${daysText}后见底`),
    React.createElement('svg', {
      viewBox: `0 0 ${W} ${H}`, className: 'dshc-ust-svg', preserveAspectRatio: 'xMidYMid meet',
    },
      ...grid,
      React.createElement('path', {
        className: 'area-burn',
        d: `${line(actual)}L${x(rows.length - 1).toFixed(1)},${(PT + innerH).toFixed(1)}L${x(0).toFixed(1)},${(PT + innerH).toFixed(1)}Z`,
      }),
      React.createElement('path', { className: 'line-burn', d: line(actual) }),
      React.createElement('path', { className: 'line-proj', d: line(proj) }),
      React.createElement('line', {
        className: 'floor',
        x1: PL, x2: W - PR, y1: PT + innerH, y2: PT + innerH,
      }),
      React.createElement('circle', {
        className: 'dot-die',
        cx: proj[dieIndex][0].toFixed(1), cy: PT + innerH, r: 4,
      }),
      React.createElement('text', {
        className: 'axt err',
        x: Math.min(proj[dieIndex][0] + 8, W - PR - 66), y: PT + innerH - 7,
      }, `≈ ${daysText}后见底`),
      React.createElement('line', {
        className: 'nowline',
        x1: x(rows.length - 1).toFixed(1), x2: x(rows.length - 1).toFixed(1),
        y1: PT, y2: PT + innerH,
      }),
      React.createElement('text', {
        className: 'axt', x: x(rows.length - 1).toFixed(1), y: H - 8, textAnchor: 'middle',
      }, '现在'),
      React.createElement('text', {
        className: 'axt', x: PL, y: H - 8,
      }, '窗口起点'),
      React.createElement('text', {
        className: 'axt', x: W - PR, y: H - 8, textAnchor: 'end',
      }, '外推'),
    ),
    React.createElement('div', { style: { ...s.muted, fontSize: 10.5, marginTop: 6 } },
      React.createElement('span', {
        style: { cursor: 'help' },
        title: '实线 = 窗口起点存量按已消耗逐槽回推（回推值，非逐时实测）；虚线 = 按窗口速率线性外推（非承诺，实际偏乐观）。窗口起点存量 = 当前可用存量 + 窗口内已消耗；只算可消耗额度；账本只覆盖经本网关的请求。',
      }, '实线 = 回推 · 虚线 = 外推（非承诺）· 圆点 = 预计见底'),
    ),
  );
}

/**
 * 进程口径细节（折叠区）：缓存命中率 / 流式占比 / 平均延迟 / 逐模型明细。
 *
 * 为什么与窗口分桶**分区展示**：`/v1/stats` 无窗口维度、重启清零，
 * 而分桶落盘不清零 —— 两者相减或并排比较都会得出错误结论。
 *
 * @param props - `{stats, windowTotal}`：`windowTotal` 是窗口分桶的 `total`（含缓存三段）。
 * @returns React 元素。
 */
export function ProcessPanel({ stats, windowTotal }) {
  const [showIdle, setShowIdle] = React.useState(false);
  if (!stats || stats.enabled !== true) {
    return React.createElement('div', { style: s.muted },
      '该网关未提供 /v1/stats（进程累计视图不可用）。窗口分桶数据不受影响。');
  }
  const models = Array.isArray(stats.models) ? stats.models : [];
  const total = stats.total ?? {};
  const rate = (value, digits = 0) => (typeof value === 'number' && value > 0 ? formatPercent(value, digits) : '—');
  const ms = (value) => (typeof value === 'number' && value > 0 ? `${Math.round(value)} ms` : '—');
  const tps = (value) => (typeof value === 'number' && value > 0 ? `${value.toFixed(1)} tok/s` : '—');

  // 按积分消耗降序 —— 这一区的主题是「钱花在哪」，不是「谁请求多」。
  const decorated = models.map((model) => ({
    model,
    spend: (Number(model.credit_per_req) || 0) * (Number(model.requests) || 0),
    requests: Number(model.requests) || 0,
  }));
  const active = decorated.filter((item) => item.requests > 0).sort((a, b) => b.spend - a.spend);
  const idle = decorated.filter((item) => item.requests === 0);
  const visible = showIdle ? [...active, ...idle] : active;

  // 窗口分桶的命中率（本轮网关新补的三段）—— 与进程口径的命中率并列时
  // 必须各自标注口径，否则读者会以为两个百分比是同一件事。
  const windowRate = Number(windowTotal?.cache_hit_tokens) || 0;
  const windowMiss = Number(windowTotal?.cache_miss_tokens) || 0;
  const windowHitRate = windowRate + windowMiss > 0 ? windowRate / (windowRate + windowMiss) : null;

  return React.createElement('div', null,
    React.createElement(RatioStrip, {
      items: [
        {
          label: '缓存命中率', value: rate(total.cache_hit_rate),
          scope: '进程累计',
          title: '命中 /（命中 + 未命中），来自 /v1/stats（重启清零）',
        },
        windowHitRate === null ? null : {
          label: '缓存命中率', value: formatPercent(windowHitRate, 0),
          scope: '窗口分桶',
          title: '同公式，但来自 /v1/stats/buckets（落盘、重启不清零）—— 与进程累计是两个口径，不可混算',
        },
        (Number(total.requests) || 0) > 0 ? {
          label: '流式占比', value: rate((Number(total.streaming) || 0) / Number(total.requests)),
          scope: '进程累计',
          title: '流式请求 / 总请求，来自 /v1/stats（重启清零）',
        } : null,
        {
          label: '平均延迟', value: ms(total.avg_latency_ms),
          scope: '进程累计',
          title: '端到端耗时均值，来自 /v1/stats（重启清零）',
        },
      ],
    }),
    React.createElement('div', { style: { marginTop: 10 } },
      visible.length === 0
        ? React.createElement('div', { style: { ...s.muted, marginTop: 10 } },
            `这一程还没有模型请求记录（合计 ${formatNumber(Number(total.requests) || 0)} 次）—— 发起对话后逐模型列出。`)
        : React.createElement(React.Fragment, null,
            ...visible.map(({ model }) =>
              React.createElement('div', { key: model.model, className: 'dshc-mrow2' },
                React.createElement('div', { className: 'dshc-mrow2-top' },
                  React.createElement('span', { className: 'dshc-mrow2-name', title: model.model }, model.model),
                  // 倍率取上游原文；缺失显示 —（绝不显示 x0.00 —— 缺失 ≠ 免费）
                  model.credits
                    ? React.createElement(Tag, { text: model.credits, tone: 'idle' })
                    : React.createElement('span', {
                        style: { ...s.muted, fontSize: 10.5 },
                        title: '上游未下发该模型倍率（缺失 ≠ 免费）',
                      }, '倍率 —'),
                  React.createElement('span', { style: { ...s.muted, fontSize: 10.5, flexShrink: 0 } },
                    `${formatNumber(Number(model.requests) || 0)} 请求`),
                ),
                React.createElement('div', { className: 'dshc-mrow-detail' },
                  React.createElement('span', { style: { color: tone.ok.fg } },
                    `${formatCredit(Number(model.credit_per_req) || 0)} / 请求`),
                  React.createElement('span', { title: '前缀缓存命中率：命中 /（命中 + 未命中）' },
                    `缓存 ${rate(model.cache_hit_rate)}`),
                  React.createElement('span', { title: '首字延迟（无观测显示 —）' }, `TTFB ${ms(model.avg_ttfb_ms)}`),
                  React.createElement('span', { title: '生成吞吐' }, tps(model.tokens_per_sec)),
                  Number(model.failed) > 0
                    ? React.createElement('span', { style: { color: tone.err.fg } }, `失败 ${formatNumber(model.failed)}`)
                    : null,
                  model.last_seen ? React.createElement('span', null, relativeTimeText(model.last_seen)) : null,
                ),
              ),
            ),
            idle.length > 0
              ? React.createElement('button', {
                  type: 'button',
                  className: 'dshc-more',
                  onClick: () => setShowIdle((prev) => !prev),
                }, showIdle ? `收起无消耗模型（${idle.length}）` : `展开无消耗模型（${idle.length}）`)
              : null,
          ),
    ),
  );
}

/** 相对时间（本地化短文本）。 */
function relativeTimeText(iso) {
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (seconds < 60) return '刚刚';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
  return `${Math.floor(seconds / 86400)} 天前`;
}

/**
 * 比率指标条（标签 + 数值 + 口径标注）。
 *
 * 口径必须逐项标注：缓存命中率与流式占比来自 `/v1/stats`（进程累计），
 * 成功率来自窗口分桶 —— 两者不可混算。
 *
 * @param props - `{items}`。
 * @returns React 元素。
 */
export function RatioStrip({ items }) {
  const list = (items ?? []).filter(Boolean);
  if (list.length === 0) return null;
  return React.createElement('div', { className: 'dshc-row', style: { gap: 14 } },
    ...list.map((item, index) =>
      React.createElement('div', { key: `${item.label}-${item.scope}-${index}`, className: 'dshc-row', style: { gap: 6 } },
        React.createElement('span', { style: { ...s.muted, fontSize: 10.5 } }, item.label),
        React.createElement('span', {
          style: { fontSize: 13, fontWeight: 600, color: item.tone ?? 'var(--dsw-alias-label-primary,currentColor)' },
        }, item.value),
        React.createElement('span', {
          style: { ...s.muted, fontSize: 10.5, cursor: 'help' },
          title: item.title ?? item.scope,
        }, item.scope),
      ),
    ),
  );
}

/** 进程累计时长的可读文本（供折叠区摘要行用）。 */
export function processUptime(stats) {
  return stats?.enabled === true ? uptimeText(stats.uptime_sec) : null;
}

// dsh-chanhub —— 侧边栏快捷入口（footer 按钮 + 自带 popover）
//
// 挂载点：`sidebar.footer.action`（list 槽，与设置按钮同一 foot 区，宿主传 `{wide}`）。
//   footArea
//   ├─ footerActions ← 本组件（展开态独占一行；rail 态只剩图标 + 角标）
//   └─ settingsArea  ← 齿轮按钮（sidebar.settings）
//
// 三条硬约束（决定了这里的结构）：
//   1. **浮层必须 portal 到 body**：侧边栏是可滑动 grid track 且注释明写会 clip
//      子内容，`.footArea` 又是 flex column —— 就地绝对定位会被裁掉。
//   2. **必须独占一行**：`sidebar.footer.action` 是共享 list 槽（cordis 面板、
//      dsh-context「上下文洞察」、成本计量的容器都在这一行），而宿主那一行是**不换行**的
//      flex row —— 别人在场就会把本入口挤成半行。所以本组件把宿主那一行改成
//      `flex-wrap: wrap` 并让自己取整行宽度（见 QuickEntryInner 里的 effect）。
//   3. **宿主没有「打开设置面板」的接口**：`remote.settings.openSettingsDocument()` 是把
//      settings.yaml 交给**原生文本编辑器**，也没有 `openSettings(sectionId)` 深链。
//      所以「渠道中心」做成**本插件自己的弹窗**（`CenterModal` + portal 到 body），
//      面板组件由 client/index.js 以 prop 注入（避免与入口文件循环 import）；
//      本行最右端另有一个无文字图标按钮，点它直接开这个弹窗。
//
// 数据一律来自 quick-store 的同一份快照（按钮角标与 popover 数字永远一致），
// 自动路径只打只读端点；「刷新」是唯一会真打上游的按钮，且要用户点。

import React from 'react';
import { createPortal } from 'react-dom';

import { s, tone } from './theme.js';
import { ChannelChip, Icons, useCountUp } from './ui.js';
import {
  accountCardVM,
  channelColor,
  formatCompact,
  formatNumber,
  formatTokens,
  quickSummaryVM,
  relativeTime,
  sparkPath,
  usageSeriesByKey,
  usageBySlot,
} from './derive.js';

/** 入口行样式（hover / focus / 展开态。内联样式写不了伪类，所以在行里挂一个 style 节点）。 */
export const ENTRY_CSS = `
@keyframes dshc-entry-in { from{opacity:0} to{opacity:1} }
.dshc-entry-card { border:1px solid var(--dsw-alias-border-l2,#e5e7eb); animation:dshc-entry-in .22s ease-out both; }
.dshc-entry-card:hover { border-color:var(--dsw-alias-border-l3,#d1d5db); transform:translateY(-1px); box-shadow:0 4px 12px rgba(15,23,42,.08); }
.dshc-entry-card[data-open="true"] { border-color:var(--dsw-alias-border-l3,#d1d5db); }
.dshc-entry-card:focus-visible { outline:2px solid var(--dsw-alias-button-info-fill,#4176f7); outline-offset:1px; }
.dshc-entry-icon { background:transparent; animation:dshc-entry-in .22s ease-out both; }
.dshc-entry-icon:hover { background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05)); color:var(--dsw-alias-label-primary,#1f2328); }
.dshc-entry-icon[data-open="true"] { background:var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.06)); }
.dshc-entry-icon:focus-visible { outline:2px solid var(--dsw-alias-button-info-fill,#4176f7); outline-offset:1px; }
@media (prefers-reduced-motion:reduce){
  .dshc-entry-card{transition:none; animation:none}
  .dshc-entry-card:hover{transform:none}
  .dshc-entry-icon{animation:none}
}
`;

/** 侧边栏专属样式（动效与滚动条；颜色一律走令牌，别硬编码）。 */
export const QUICK_CSS = `
@keyframes dshc-quick-pulse { 0%{transform:scale(1);opacity:.9} 70%{transform:scale(1.9);opacity:0} 100%{opacity:0} }
.dshc-quick-dot { position:relative; }
.dshc-quick-dot::after { content:''; position:absolute; inset:0; border-radius:999px; background:currentColor; animation:dshc-quick-pulse 1.8s ease-out infinite; }
.dshc-quick-pop { animation:dshc-quick-in .16s cubic-bezier(.2,.8,.2,1); }
@keyframes dshc-quick-in { from{opacity:0; transform:translateY(6px) scale(.985)} to{opacity:1; transform:none} }
.dshc-quick-scroll { scrollbar-width:thin; }
.dshc-quick-scroll::-webkit-scrollbar { width:6px; }
.dshc-quick-scroll::-webkit-scrollbar-thumb { background:var(--dsw-alias-border-l3,#d1d5db); border-radius:999px; }
.dshc-quick-row:hover { background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04)); }
/* 渠道中心弹窗：背景淡入 + 面板轻微上浮（动效与 popover 同一套手感） */
.dshc-center-backdrop { animation:dshc-center-in .14s var(--ds-ease-in-out,ease-out); }
.dshc-center-dialog { animation:dshc-center-rise .18s cubic-bezier(.2,.8,.2,1); }
@keyframes dshc-center-in { from{opacity:0} to{opacity:1} }
@keyframes dshc-center-rise { from{opacity:0; transform:translateY(10px) scale(.99)} to{opacity:1; transform:none} }
.dshc-center-body { scrollbar-width:thin; }
.dshc-center-body::-webkit-scrollbar { width:8px; }
.dshc-center-body::-webkit-scrollbar-thumb { background:var(--dsw-alias-border-l3,#d1d5db); border-radius:999px; }
@media (prefers-reduced-motion:reduce){ .dshc-quick-pop{animation:none} .dshc-quick-dot::after{animation:none} .dshc-center-backdrop,.dshc-center-dialog{animation:none} }
`;

const POP_WIDTH = 344;
const POP_MAX_HEIGHT = 520;

/** 计分环：用两段 stroke-dasharray 表达健康占比（无第三方图表依赖）。 */
export function Ring({ ratio = 0, size = 34, stroke = 4, color = tone.ok.fg, track = 'var(--dsw-alias-border-l3,#e5e7eb)', transition = 'stroke-dasharray .35s' }) {
  const clamped = Math.max(0, Math.min(1, Number(ratio) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return React.createElement('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, 'aria-hidden': 'true' },
    React.createElement('circle', {
      cx: size / 2, cy: size / 2, r: radius, fill: 'none', stroke: track, strokeWidth: stroke,
    }),
    React.createElement('circle', {
      cx: size / 2, cy: size / 2, r: radius, fill: 'none', stroke: color, strokeWidth: stroke,
      strokeLinecap: 'round', strokeDasharray: `${circumference * clamped} ${circumference}`,
      transform: `rotate(-90 ${size / 2} ${size / 2})`, style: { transition },
    }),
  );
}

/**
 * 入场进度 0→1（挂载后播**一次**；不随 60s 轮询重播）。
 *
 * 与 `useCountUp` 同一套纪律 —— **动画必须可失败**：无 rAF、或用户开了
 * `prefers-reduced-motion: reduce` 时直接返回 1（终态）；rAF 被节流（后台标签页、
 * 无头渲染）时还有 setTimeout 兜底把进度落定，绝不让健康环/渠道条卡在中间态。
 *
 * @param duration - 毫秒。
 * @returns 0..1 的进度（减少动效时恒为 1）。
 */
export function useMountProgress(duration = 520) {
  const canAnimate = typeof requestAnimationFrame === 'function'
    && !(typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [progress, setProgress] = React.useState(canAnimate ? 0 : 1);
  React.useEffect(() => {
    if (!canAnimate) return undefined;
    const start = Date.now();
    let frame = 0;
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      setProgress(1);
    };
    const tick = () => {
      if (settled) return;
      const t = Math.min(1, (Date.now() - start) / duration);
      setProgress(t);
      if (t < 1) frame = requestAnimationFrame(tick);
      else settle();
    };
    frame = requestAnimationFrame(tick);
    const guard = setTimeout(settle, duration + 150);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      clearTimeout(guard);
    };
  }, [duration, canAnimate]);
  return progress;
}

/** 迷你折线：有起伏才画线，全平也保留基线（避免「无数据」与「全 0」混淆）。 */
export function Sparkline({ values, color = tone.info.fg, width = 96, height = 22 }) {
  const { points, area, flat } = sparkPath(values, { width, height });
  if (points === '') {
    return React.createElement('div', { style: { ...s.muted, fontSize: 10.5 } }, '无观测');
  }
  const id = `dshc-spark-${Math.abs(hashString(points)).toString(36)}`;
  return React.createElement('svg', { width, height, viewBox: `0 0 ${width} ${height}`, 'aria-hidden': 'true' },
    React.createElement('defs', null,
      React.createElement('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 },
        React.createElement('stop', { offset: '0%', stopColor: color, stopOpacity: flat ? 0.08 : 0.28 }),
        React.createElement('stop', { offset: '100%', stopColor: color, stopOpacity: 0 }),
      ),
    ),
    flat ? null : React.createElement('polygon', { points: area, fill: `url(#${id})`, stroke: 'none' }),
    React.createElement('polyline', {
      points, fill: 'none', stroke: color, strokeWidth: flat ? 1 : 1.5,
      strokeLinejoin: 'round', strokeLinecap: 'round', opacity: flat ? 0.5 : 1,
    }),
  );
}

/** 渠道分布堆叠条：色块 + 图例（颜色同时给出，不靠读者猜）。 */
export function ChannelBar({ channels, total }) {
  const rows = (channels ?? []).filter((row) => row.count > 0);
  const sum = rows.reduce((acc, row) => acc + row.count, 0) || total || 1;
  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 } },
    React.createElement('div', {
      style: { display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', background: 'var(--dsw-alias-bg-layer-2,#f3f4f6)' },
    },
      ...rows.map((row) =>
        React.createElement('span', {
          key: row.id,
          title: `${row.label} · ${row.count} 个账号`,
          style: { width: `${(row.count / sum) * 100}%`, background: row.color ?? 'var(--dsw-alias-button-info-fill,#4176f7)' },
        }),
      ),
    ),
    React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 8, minWidth: 0 } },
      ...rows.map((row) =>
        React.createElement('span', { key: row.id, style: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: 'var(--dsw-alias-label-tertiary,#8b93a1)' } },
          React.createElement('span', { style: { width: 6, height: 6, borderRadius: 999, background: row.color } }),
          `${row.label} ${row.count}`,
        ),
      ),
    ),
  );
}

/** 状态胶囊。 */
function Chip({ text, fg, bg, title }) {
  return React.createElement('span', {
    title,
    style: {
      fontSize: 10.5, lineHeight: '16px', padding: '0 7px', borderRadius: 999,
      background: bg ?? 'var(--dsw-alias-bg-layer-2,#f3f4f6)', color: fg ?? 'var(--dsw-alias-label-secondary,#6b7280)',
      whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
    },
  }, text);
}

/** 顶部小统计块。 */
function Tile({ label, value, hint, accent, children }) {
  return React.createElement('div', {
    style: {
      flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4,
      padding: '9px 10px', borderRadius: 10,
      background: 'var(--dsw-alias-bg-layer-2,#f8fafc)',
      border: '1px solid var(--dsw-alias-border-l2,#eef1f5)',
    },
  },
    React.createElement('span', { style: { fontSize: 10.5, color: 'var(--dsw-alias-label-tertiary,#8b93a1)' } }, label),
    React.createElement('span', { style: { display: 'flex', alignItems: 'baseline', gap: 4, minWidth: 0 } },
      React.createElement('span', { style: { fontSize: 17, fontWeight: 650, letterSpacing: '-0.01em', color: accent ?? 'var(--dsw-alias-label-primary,currentColor)' } }, value),
      hint ? React.createElement('span', { style: { fontSize: 10.5, color: 'var(--dsw-alias-label-tertiary,#8b93a1)' } }, hint) : null,
    ),
    children,
  );
}

/** 单个账号行（紧凑卡：色条 + 名称 + 状态 + 余额条 + 24h 迷你走势）。 */
export function AccountQuickRow({ vm, series, usageTotal }) {
  const statusTone = tone[vm.state?.tone] ?? tone.idle;
  // 24h 次数优先用网关聚合的 by_uid（权威合计），走势图只表达形状。
  const dayCount = Number(usageTotal?.requests) || (Array.isArray(series) ? series.reduce((a, b) => a + b, 0) : 0);
  return React.createElement('div', {
    className: 'dshc-quick-row',
    style: { display: 'flex', gap: 9, padding: '8px 10px', borderRadius: 10, minWidth: 0, alignItems: 'stretch' },
  },
    // 渠道色条：一眼分辨是哪个渠道的号
    React.createElement('span', { style: { width: 3, borderRadius: 999, background: vm.color, flex: '0 0 3px' } }),
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, flex: 1 } },
      // 行 1：名称 + 活跃/short 状态
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 } },
        React.createElement('span', {
          style: { fontSize: 12.5, fontWeight: 550, color: 'var(--dsw-alias-label-primary,currentColor)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 },
          title: `${vm.name} · ${vm.uid}`,
        }, vm.name),
        vm.activity
          ? React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: (tone[vm.activity.tone] ?? tone.info).fg, whiteSpace: 'nowrap' } },
              React.createElement('span', { className: vm.activity.key === 'busy' ? 'dshc-quick-dot' : undefined, style: { width: 5, height: 5, borderRadius: 999, background: 'currentColor', display: 'inline-block' } }),
              vm.activity.label,
            )
          : null,
      ),
      // 行 2：余额条（相对池内最高）+ 数值
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 } },
        React.createElement('span', {
          style: { flex: '1 1 auto', minWidth: 30, height: 4, borderRadius: 999, background: 'var(--dsw-alias-bg-layer-2,#f1f5f9)', overflow: 'hidden' },
        },
          React.createElement('span', {
            style: {
              display: 'block', height: '100%', borderRadius: 999, width: `${Math.round(vm.creditsRatio * 100)}%`,
              background: `linear-gradient(90deg, ${vm.color} 0%, ${vm.color}99 100%)`,
              transition: 'width .3s',
            },
          }),
        ),
        React.createElement('span', {
          title: `${vm.creditsExact} 积分`,
          style: { fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--dsw-alias-label-primary,currentColor)', whiteSpace: 'nowrap' },
        }, vm.creditsText),
      ),
      // 行 3：状态 + 渠道 + 24h 用量 + 到期 + 在途
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', minWidth: 0 } },
        React.createElement(Chip, { text: vm.state?.label ?? '—', fg: statusTone.fg, bg: statusTone.bg, title: vm.state?.detail || undefined }),
        // 渠道胶囊与渠道中心共用一个组件（同一渠道两处必然同色）
        React.createElement(ChannelChip, { channel: vm.channel, label: vm.channelLabel }),
        vm.inFlight > 0
          ? React.createElement(Chip, {
              text: `在途 ${vm.inFlight}${vm.target ? `/${vm.target}` : ''}`,
              fg: vm.inFlightFull ? tone.warn.fg : tone.info.fg,
              bg: vm.inFlightFull ? tone.warn.bg : tone.info.bg,
              title: vm.target ? `单号在途上限 ${vm.target}` : '未设上限（0 = 不限）',
            })
          : null,
        vm.expiry
          ? React.createElement(Chip, {
              text: vm.expiry.expired ? '凭证已过期' : `到期 ${daysText(vm.expiry.days)}`,
              fg: vm.expiry.days <= 7 ? tone.warn.fg : undefined,
              bg: vm.expiry.days <= 7 ? tone.warn.bg : undefined,
              title: `来源：${vm.expiry.kind === 'credential' ? '登录凭证' : '积分套餐'}`,
            })
          : null,
        vm.expiring > 0
          ? React.createElement(Chip, { text: `${formatCompact(vm.expiring)} 将过期`, fg: tone.warn.fg, bg: tone.warn.bg, title: '该窗口内即将过期的积分（优先消耗）' })
          : null,
        series && series.some((value) => value > 0)
          ? React.createElement('span', { style: { marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5 } },
              React.createElement(Sparkline, { values: series, color: vm.color, width: 74, height: 18 }),
              React.createElement('span', { style: { fontSize: 10.5, color: 'var(--dsw-alias-label-tertiary,#8b93a1)', whiteSpace: 'nowrap' } },
                `${formatNumber(dayCount)} 次/24h`),
            )
          : dayCount > 0
            ? React.createElement('span', { style: { marginLeft: 'auto', fontSize: 10.5, color: 'var(--dsw-alias-label-tertiary,#8b93a1)', whiteSpace: 'nowrap' } },
                `${formatNumber(dayCount)} 次/24h`)
            : null,
      ),
    ),
  );
}

/** 天数文案（今天到期/已过期/还有 N 天）。 */
function daysText(days) {
  if (days < 0) return '已过期';
  if (days === 0) return '今天';
  return `${days} 天后`;
}

/** 稳定哈希（给 SVG gradient id 用，避免同页多个 sparkline 撞 id）。 */
function hashString(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return hash;
}

/** 齿轮/入口图标：用一根「电量弧」表达账号池健康，视觉上区别于设置齿轮。 */
function EntryIcon({ size = 16, color = 'currentColor' }) {
  return React.createElement('svg', { width: size, height: size, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': 'true' },
    React.createElement('path', {
      d: 'M4 12.5a6.5 6.5 0 1 1 12 0', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round',
    }),
    React.createElement('circle', { cx: 10, cy: 13.4, r: 2.1, fill: color }),
    React.createElement('path', { d: 'M3 16.6h14', stroke: color, strokeWidth: 1.4, strokeLinecap: 'round', opacity: 0.45 }),
  );
}

/** 新鲜度小药丸（loading/fresh/stale/error 四态）。 */
function FreshnessPill({ phase, error, fetchedAt, now }) {
  const map = {
    loading: { text: '读取中…', fg: tone.idle.fg, bg: tone.idle.bg },
    fresh: { text: fetchedAt ? `${relativeTime(new Date(fetchedAt).toISOString(), now)}更新` : '已更新', fg: tone.ok.fg, bg: tone.ok.bg },
    stale: { text: '数据偏旧', fg: tone.warn.fg, bg: tone.warn.bg },
    error: { text: error?.message ? '网关不可达' : '读取失败', fg: tone.err.fg, bg: tone.err.bg },
  };
  const item = map[phase] ?? map.loading;
  return React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: item.fg } },
    React.createElement('span', { style: { width: 6, height: 6, borderRadius: 999, background: item.fg, display: 'inline-block' } }),
    item.text,
  );
}

/**
 * 入口自隔离边界（React 类组件；只有类能做错误边界）。
 *
 * 为什么必须有：插槽里某个入口抛错时，DSH 会把**整个入口**换成一块红框
 * 「your entry in slot "..." crashed while React rendered it: …」（
 * `dsh-cordis-client-runner` 的 onEntryError → reportRenderFailure），
 * 用户只看到一块红框、拿不到原因，而且这条插槽是共享的。
 * 有了这层：本插件自己的异常退化成一个小胶囊，点开就能看到错误原文
 * （手机上没有控制台，这是唯一能读到原因的地方），其余功能与同行其它入口不受影响。
 */
class EntryBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: undefined, open: false };
    this.toggle = () => this.setState((prev) => ({ open: !prev.open }));
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    try {
      console.error('[dsh-chanhub] 侧边栏入口渲染失败：', error);
    } catch {
      /* 控制台不可用就算了 */
    }
  }

  render() {
    const { error, open } = this.state;
    if (!error) return this.props.children;
    const text = String(error?.stack ?? error?.message ?? error);
    const chip = React.createElement('button', {
      type: 'button',
      onClick: this.toggle,
      title: text,
      style: {
        font: 'inherit', cursor: 'pointer', border: '1px solid var(--dsw-alias-state-error-primary,#dc2626)',
        background: 'transparent', color: 'var(--dsw-alias-state-error-primary,#dc2626)',
        borderRadius: 8, height: 28, padding: '0 8px', fontSize: 12, maxWidth: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '0 0 auto',
      },
    }, '⚠ 渠道入口异常');
    const detail = open
      ? createPortal(
          React.createElement('div', {
            role: 'dialog',
            'aria-label': '渠道入口错误',
            style: {
              position: 'fixed', left: 8, right: 8, bottom: 8, zIndex: 70, maxHeight: '60vh', overflow: 'auto',
              padding: '10px 12px', borderRadius: 12, fontSize: 11.5, lineHeight: 1.6,
              fontFamily: 'ui-monospace,Menlo,monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              background: 'var(--dsw-alias-bg-layer-1,#fff)', color: 'var(--dsw-alias-label-primary,currentColor)',
              border: '1px solid var(--dsw-alias-state-error-primary,#dc2626)',
              boxShadow: '0 18px 48px rgba(15,23,42,.2)',
            },
          }, text.slice(0, 2000)),
          document.body,
        )
      : null;
    return React.createElement(React.Fragment, null, chip, detail);
  }
}

/**
 * 侧边栏快捷入口（对外导出；内含自隔离边界）。
 *
 * @param props - `{wide, store, prefs, centerPanel, centerPanelProps, clock}`。
 * @returns React 元素。
 */
export function QuickEntry(props) {
  return React.createElement(EntryBoundary, null, React.createElement(QuickEntryInner, props));
}

/**
 * 入口主体（真正实现；异常由上面的边界兜住）。
 *
 * @param props - `{wide, store, prefs, centerPanel, centerPanelProps, clock}`。
 *   `centerPanel` 是「渠道中心」面板组件（由 client/index.js 注入，避免与它循环 import），
 *   `centerPanelProps` 是面板需要的注入属性（rpcCall / prefs）。
 * @returns React 元素。
 */
function QuickEntryInner({ wide, store, prefs, centerPanel, centerPanelProps, clock }) {
  // 真机踩坑（TypeError: now is not a function）：宿主给**每个槽位**都会注入一个
  // 共享时钟，属性名就叫 `now`，值是**数字**。之前我用 `now = Date.now` 接自己的时钟，
  // 结果被宿主的数字覆盖，`now()` 当场抛错 —— 整条 sidebar.footer.action 变成红框。
  // 现在自己的时钟走独立名字 `clock`（仅测试用），并且对传数字也兼容。
  const now = React.useMemo(() => {
    if (typeof clock === 'function') return clock;
    if (typeof clock === 'number') return () => clock;
    return Date.now;
  }, [clock]);
  const [snapshot, setSnapshot] = React.useState(() => store?.getSnapshot?.());
  const [enabled, setEnabled] = React.useState(() => (prefs ? prefs.value : true));
  const [open, setOpen] = React.useState(false);
  /** 「渠道中心」弹窗开关（与账号池 popover 是两个独立浮层，同一时刻只留一个）。 */
  const [centerOpen, setCenterOpen] = React.useState(false);
  const [anchor, setAnchor] = React.useState();
  const buttonRef = React.useRef(null);
  const rootRef = React.useRef(null);
  /** 打开渠道中心：先收起账号池 popover，避免两个浮层叠在一起。 */
  const openCenter = React.useCallback(() => {
    setOpen(false);
    setCenterOpen(true);
  }, []);

  // 数据订阅 + 启动轮询（卸载时 dispose 由 apply 侧负责，这里只退订）
  React.useEffect(() => {
    if (!store) return undefined;
    const off = store.subscribe(setSnapshot);
    store.start?.();
    return off;
  }, [store]);

  // 偏好订阅：宿主设置改了要即时反映（无需重启/刷新页面）
  React.useEffect(() => {
    if (!prefs) return undefined;
    const sync = () => setEnabled(prefs.value);
    sync();
    return prefs.subscribe?.(sync);
  }, [prefs]);

  // 关闭偏好 → 收起浮层（不留孤儿浮层）
  React.useEffect(() => {
    if (!enabled && open) setOpen(false);
  }, [enabled, open]);

  // 定位：优先向上开（按钮在 foot 区最下），上方不够就翻到下面开；
  // maxHeight 按可用空间收敛 —— 否则窗口一矮，浮层顶部会被裁掉（真机布局实测）。
  React.useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewportH = typeof window === 'undefined' ? 0 : window.innerHeight;
      const viewportW = typeof window === 'undefined' ? POP_WIDTH : window.innerWidth;
      const width = Math.min(POP_WIDTH, viewportW - 24);
      const left = Math.max(8, Math.min(rect.left, viewportW - width - 8));
      const spaceAbove = rect.top - 8;
      const spaceBelow = viewportH - rect.bottom - 8;
      const openUp = spaceAbove >= Math.min(POP_MAX_HEIGHT, 260) || spaceAbove >= spaceBelow;
      const maxHeight = Math.max(180, Math.min(POP_MAX_HEIGHT, openUp ? spaceAbove : spaceBelow));
      setAnchor({
        left,
        width,
        maxHeight,
        ...(openUp
          ? { bottom: viewportH - rect.top + 8 }
          : { top: rect.bottom + 8 }),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  // 外部点击 / Esc 关闭；Esc 后焦点回到按钮
  React.useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      // 入口按钮自己由 onClick 切换（开→关）。这里再顺手关一次的话，紧接着的 click 会
      // 立刻又打开 —— 真机表现就是「点第二下收不回」（pointerdown 抢关 + click 再开）。
      // 所以入口按钮（含 rail 态那颗图标）上的 pointerdown 一律放行给 onClick。
      if (buttonRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus?.();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // 展开时拉用量与辅助数据（按需；TTL 内不重复打）
  React.useEffect(() => {
    if (!open) return;
    void store?.loadUsage?.({});
    void store?.loadAux?.({});
  }, [open, store]);

  // 侧边栏折叠/展开切换 → 锚点失效，收起浮层
  const prevWide = React.useRef(wide);
  React.useEffect(() => {
    if (prevWide.current !== wide) {
      prevWide.current = wide;
      setOpen(false);
    }
  }, [wide]);

  // 独占一行：`sidebar.footer.action` 是**共享**的 list 槽（cordis 面板、dsh-context
  // 「上下文洞察」、成本计量的容器都注册在这一行），而宿主把这一行做成**不换行**的
  // flex row —— 所以只要同行还有别人在场，本入口就被挤成半行。这里做两件事：
  //   1. 把宿主那一行改成 `flex-wrap: wrap`（卸载时还原原值）；
  //   2. 自己的按钮取整行宽度（见下面 style 的 flexBasis）。
  // 于是本入口独占一行，同行其它条目自动落到上一行。收起态（rail）**不动**：
  // 宿主 CSS 把那一行居中、只剩 ~36px，换行会让图标错位。
  React.useEffect(() => {
    if (wide !== true) return undefined;
    const button = buttonRef.current;
    if (!button) return undefined;
    // 槽位包装层是 `display: contents`（不产生盒子）、本入口自己也套了一层行内盒子
    // （`data-dshc-entry`），两者都不能当作行容器 —— 一路往上找到真正的宿主行。
    let row = button.parentElement;
    const view = typeof window === 'undefined' ? undefined : window;
    while (row && row !== (view?.document?.body ?? null)) {
      const mine = typeof row.hasAttribute === 'function' && row.hasAttribute('data-dshc-entry');
      if (!mine && !(view && view.getComputedStyle(row).display === 'contents')) break;
      row = row.parentElement;
    }
    if (!row || row === view?.document?.body) return undefined;
    const before = row.style.flexWrap;
    row.style.flexWrap = 'wrap';
    return () => {
      row.style.flexWrap = before;
    };
  }, [wide]);

  // 摘要 VM 与积分动效都必须在 `if (!enabled)` 这个提前 return **之前** 调用（Hook 顺序规则）。
  // 顺带把 VM 记忆化：以前每次渲染都重算一遍（同口径纯函数，重算是浪费）。
  const summary = React.useMemo(
    () => quickSummaryVM({ status: snapshot?.status, usage: snapshot?.usage, now: now() }),
    [snapshot, now],
  );
  // 积分数字动效：useCountUp 初值就是真值（不在挂载时从 0 爬），只在数值变化时播一次；
  // 无 rAF / prefers-reduced-motion 时直接落终值，永远不会停在动画中间值。
  const shownCredits = useCountUp(summary.usableCredits);
  // 入场动效（健康环扫出 / 渠道条逐段长出 / 卡片淡入）：挂载后播一次，60s 轮询不重播。
  const enter = useMountProgress(520);

  if (!enabled) return null;
  // 收起态（56px 轨道）= 只画一个 36px 图标（与 `lc-ov-entry-rail` 同尺寸），不放摘要数字。
  // 注意：这一行是共享 list 槽，宿主 CSS 是
  // `.collapsed .footerActions{justify-content:center;width:auto}`，56px 列扣掉左右内边距
  // 只剩 ~36px —— 也就是说**收起态只容得下一个图标**。若将来同行的其它入口
  // （dsh-context「上下文洞察」、cordis 面板）也回到收起态，会互相挤；届时或把本入口
  // 收起态关掉（一行 return null），或让用户在配置 Tab 的「界面」组里关闭本入口。
  const rail = wide === false;

  const phase = snapshot?.phase ?? 'loading';
  const hasAccounts = summary.total > 0;
  const alert = phase === 'error' || summary.inFlightFull > 0 || (summary.total > 0 && summary.cooling > 0);
  const badgeColor = phase === 'error' ? tone.err.fg : phase === 'stale' ? tone.warn.fg : alert ? tone.warn.fg : tone.ok.fg;

  // 底部渠道条用的分段：只算有账号的渠道，宽度按账号数占比；tooltip 注明各家账号数。
  const barRows = (summary.channels ?? []).filter((row) => row.count > 0);
  const barTotal = barRows.reduce((acc, row) => acc + row.count, 0) || 1;
  const barTitle = barRows.map((row) => `${row.label ?? row.id} ${row.count} 个`).join(' · ');
  // 逐段长出：把入场进度按 index 错开，最后一段恰好在 enter=1 收尾（整体仍是一次性动画）
  const SEG_STAGGER = 0.28;
  const segProgress = (index) => {
    const span = 1 + SEG_STAGGER * Math.max(0, barRows.length - 1);
    return Math.max(0, Math.min(1, enter * span - index * SEG_STAGGER));
  };

  // ── 主按钮：展开态是「卡片」（圆角 10 + 1px 令牌描边 + 左侧 3px 健康色条 + 极浅渐变），
  // 收起态仍是 36×36 的扁平图标（宿主 rail 那一行是居中布局，不能带卡片边框）。
  const card = wide === true;
  const button = React.createElement('button', {
    ref: buttonRef,
    type: 'button',
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-label': '渠道账号',
    title: '渠道账号 · 点击查看账号池',
    onClick: () => setOpen((value) => !value),
    ...(card ? { className: 'dshc-entry-card', 'data-open': open ? 'true' : 'false' } : {}),
    style: {
      font: 'inherit', cursor: 'pointer',
      // 卡片态的 1px 描边由 .dshc-entry-card 提供（内联 border 会盖掉类里的 hover 变色）
      ...(card ? {} : { border: 'none' }),
      boxSizing: 'border-box',
      color: 'var(--dsw-alias-label-secondary,#6b7280)',
      // 展开态：外面那层行盒子占满宿主行（见下面的 entryRow），本按钮吃掉除右侧图标
      // 之外的全部宽度 —— 文案一行读完，不再和别人抢宽。卡片背景用极浅 info 渐变 + 层底色。
      // 注意：不要用 `var(--token)14` 这种拼十六进制后缀的写法 —— token 是 6 位 hex，
      // 拼完在浏览器里整条 background 会被判无效（实测 backgroundImage=none）；
      // 要半透明一律走 color-mix。
      flex: card ? '1 1 auto' : '0 0 auto', minWidth: rail ? 36 : 0, maxWidth: '100%',
      height: 36, padding: rail ? 0 : '0 8px 0 11px',
      justifyContent: rail ? 'center' : undefined,
      position: 'relative', overflow: 'hidden',
      display: 'inline-flex', alignItems: 'center', gap: 7,
      ...(card
        ? {
            borderRadius: 10,
            background: open
              ? 'linear-gradient(135deg, color-mix(in srgb, var(--dsw-alias-button-info-fill,#4176f7) 12%, transparent), transparent 70%), var(--dsw-alias-bg-layer-2,#f9fafb)'
              : 'linear-gradient(135deg, color-mix(in srgb, var(--dsw-alias-button-info-fill,#4176f7) 8%, transparent), transparent 70%), var(--dsw-alias-bg-layer-1,#fff)',
            transition: 'border-color .15s, transform .15s, box-shadow .15s, background .15s',
          }
        : { borderRadius: 8, background: open ? 'var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.06))' : 'transparent', transition: 'background .15s' }),
    },
  },
    // 左侧 3px 健康色条：卡片被 overflow:hidden 裁在圆角里，正好当左侧强调边
    card
      ? React.createElement('span', {
          'aria-hidden': 'true',
          style: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: badgeColor },
        })
      : null,
    // 底部 3px 渠道堆叠条：一眼看出池子由哪几家渠道、各几个号（workbuddy / traework 识别色）。
    // 入场：整体淡入 + 逐段从 0 长出（enter=1 后恢复 width 过渡，后续账号数变化平滑跟随）。
    card && hasAccounts && phase !== 'error' && barRows.length > 0
      ? React.createElement('span', {
          'aria-hidden': 'true',
          title: barTitle,
          style: {
            position: 'absolute', left: 3, right: 0, bottom: 0, height: 3,
            display: 'flex', overflow: 'hidden',
            opacity: enter >= 1 ? 1 : 0.35 + 0.65 * enter,
          },
        },
          ...barRows.map((row, index) =>
            React.createElement('span', {
              key: row.id,
              style: {
                width: `${(row.count / barTotal) * 100 * segProgress(index)}%`,
                background: channelColor(row.id),
                transition: enter >= 1 ? 'width .35s' : 'none',
              },
            }),
          ),
        )
      : null,
    React.createElement('span', { style: { position: 'relative', display: 'inline-flex', flex: '0 0 auto' } },
      React.createElement(EntryIcon, { size: wide ? 17 : 18, color: badgeColor }),
      // 角标：rail 态唯一的异常信号
      alert || phase === 'stale'
        ? React.createElement('span', {
            style: {
              position: 'absolute', right: -1, top: -1, width: 7, height: 7, borderRadius: 999,
              background: badgeColor, boxShadow: '0 0 0 2px var(--dsw-alias-bg-layer-1,#fff)',
            },
          })
        : null,
    ),
    wide
      ? React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1, justifyContent: 'space-between' } },
          React.createElement('span', { style: { fontSize: 13, fontWeight: 550, color: 'var(--dsw-alias-label-primary,currentColor)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, '渠道账号'),
          React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0, flex: '0 0 auto' } },
            // 健康环：把「5/5」从纯文字变成一眼可扫的占比（16px / 3px 描边；语义在 title + aria-label）
            // 入场：从 0 扫到目标占比 + 淡入；扫出期间关掉 CSS 过渡（否则两套动画叠加会发飘）。
            hasAccounts && phase !== 'error'
              ? React.createElement('span', {
                  role: 'img',
                  'aria-label': `账号 ${summary.healthy}/${summary.total} 健康`,
                  title: `账号 ${summary.healthy}/${summary.total} 健康${summary.cooling > 0 ? ` · 冷却 ${summary.cooling}` : ''}${summary.disabled > 0 ? ` · 禁用 ${summary.disabled}` : ''}`,
                  style: {
                    display: 'inline-flex', flex: '0 0 auto',
                    opacity: enter >= 1 ? 1 : 0.25 + 0.75 * enter,
                  },
                }, React.createElement(Ring, {
                  ratio: summary.healthRatio * enter,
                  size: 16,
                  stroke: 3,
                  color: badgeColor,
                  transition: enter >= 1 ? undefined : 'none',
                }))
              : null,
            React.createElement('span', { style: { fontSize: 11.5, color: 'var(--dsw-alias-label-tertiary,#8b93a1)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } },
              phase === 'error'
                ? '不可达'
                : hasAccounts
                  ? `${summary.healthy}/${summary.total} · ${formatCompact(shownCredits)}`
                  : '无账号',
            ),
          ),
        )
      : null,
  );

  // 渠道中心图标按钮（无文字）：钉在本行最右端，点一下开弹窗。
  // 收起态（rail）不渲染：56px 轨道里放不下两个图标，会让两个都糊在一起。
  // 没有面板组件时也不渲染 —— 能力缺失就如实不显示，不留死按钮。
  const centerButton = wide && centerPanel
    ? React.createElement('button', {
        type: 'button',
        'aria-haspopup': 'dialog',
        'aria-expanded': centerOpen,
        'aria-label': '打开渠道中心',
        title: '打开渠道中心 · 账号池 / 任务 / 日志 / 用量',
        onClick: openCenter,
        className: 'dshc-entry-icon',
        'data-open': centerOpen ? 'true' : 'false',
        style: {
          font: 'inherit', cursor: 'pointer', border: 'none', flex: '0 0 auto',
          width: 36, height: 36, borderRadius: 10, padding: 0,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--dsw-alias-label-secondary,#6b7280)', transition: 'background .15s, color .15s',
        },
      }, React.createElement(Icons.hub, { width: 17, height: 17, 'aria-hidden': 'true' }))
    : null;

  // 本入口的整行盒子：占满宿主行（配合把宿主行改成 wrap 的 effect），右侧给图标按钮留位。
  // 入口行样式（hover / focus-visible）跟着行盒子挂一次即可，不额外占布局。
  // 两个按钮之间用 1px 令牌竖线分开，避免"两块贴在一起"的糊感。
  const divider = wide && centerButton
    ? React.createElement('span', {
        'aria-hidden': 'true',
        style: { flex: '0 0 auto', width: 1, height: 18, background: 'var(--dsw-alias-border-l2,#e5e7eb)' },
      })
    : null;
  const entryRow = React.createElement('div', {
    'data-dshc-entry': 'row',
    style: {
      flex: wide === true ? '0 0 100%' : '0 0 auto', minWidth: 0, maxWidth: '100%',
      display: 'flex', alignItems: 'center', gap: wide ? 4 : 6,
    },
  }, React.createElement('style', null, ENTRY_CSS), button, divider, centerButton);

  const popover = open && anchor
    ? createPortal(
        React.createElement(Popover, {
          snapshot,
          summary,
          anchor,
          now,
          rootRef,
          onClose: () => {
            setOpen(false);
            buttonRef.current?.focus?.();
          },
          onRefresh: () => void store?.refreshUpstream?.(),
          openCenter: centerPanel ? openCenter : undefined,
        }),
        document.body,
      )
    : null;

  // 渠道中心弹窗：与账号池 popover 一样 portal 到 body（侧边栏 grid track 会裁剪子内容）
  const centerModal = centerOpen && centerPanel
    ? createPortal(
        React.createElement(CenterModal, { onClose: () => setCenterOpen(false) },
          React.createElement(centerPanel, centerPanelProps ?? {})),
        document.body,
      )
    : null;

  return React.createElement(React.Fragment, null, entryRow, popover, centerModal);
}

/** 浮层本体（拆出来便于测试单独渲染）。 */
export function Popover({ snapshot, summary, anchor, now, rootRef, onClose, onRefresh, openCenter }) {
  const phase = snapshot?.phase ?? 'loading';
  const error = snapshot?.error;
  const refreshing = snapshot?.refreshing === true;
  const usage = snapshot?.usage;
  const sheet = typeof window !== 'undefined' && window.innerWidth < 480;

  // 逐账号 24h 走势（同一份 buckets，按 uid 归因）
  const seriesByUid = React.useMemo(() => {
    const buckets = usage?.buckets;
    if (!Array.isArray(buckets) || buckets.length === 0) return new Map();
    return usageSeriesByKey(buckets, 'uid').series;
  }, [usage]);
  const usageByUid = React.useMemo(() => {
    const rows = Array.isArray(usage?.by_uid) ? usage.by_uid : [];
    return new Map(rows.map((row) => [row.key, row]));
  }, [usage]);

  const maxCredits = Math.max(0, ...summary.accounts.map((account) => Number(account?.credits) || 0));
  const vms = summary.accounts
    .map((account) =>
      accountCardVM(account, {
        config: snapshot?.config,
        maxCredits,
        channelOf: undefined,
        authAccounts: snapshot?.authAccounts,
        creditsByUid: snapshot?.creditsByUid,
        now: now(),
      }),
    )
    .sort((a, b) => b.credits - a.credits || a.name.localeCompare(b.name));

  const daySpark = React.useMemo(() => {
    if (!Array.isArray(usage?.buckets)) return [];
    return usageBySlot(usage.buckets).map((row) => row.requests);
  }, [usage]);

  return React.createElement('div', {
    ref: rootRef,
    className: 'dshc-quick-pop',
    role: 'dialog',
    'aria-label': '渠道账号',
    'data-freshness': phase,
    style: {
      position: 'fixed', zIndex: 60,
      left: sheet ? 8 : anchor?.left,
      ...(sheet
        ? { bottom: 8, right: 8 }
        : anchor?.top !== undefined
          ? { top: anchor.top }
          : { bottom: anchor?.bottom }),
      width: sheet ? 'auto' : anchor?.width ?? POP_WIDTH,
      right: sheet ? 8 : undefined,
      maxWidth: sheet ? undefined : 'calc(100vw - 16px)',
      // 高度按按钮上下可用空间收敛（宿主窗口矮时不能顶着边缘被裁）
      maxHeight: sheet ? '70vh' : anchor?.maxHeight ?? POP_MAX_HEIGHT,
      display: 'flex', flexDirection: 'column',
      background: 'var(--dsw-alias-bg-layer-1,#fff)',
      color: 'var(--dsw-alias-label-primary,currentColor)',
      border: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
      borderRadius: 14,
      boxShadow: '0 18px 48px rgba(15,23,42,.20), 0 2px 8px rgba(15,23,42,.08)',
      overflow: 'hidden',
    },
  },
    React.createElement('style', null, QUICK_CSS),
    // ── 头部：品牌色渐变条 + 标题 + 新鲜度 + 关闭
    React.createElement('div', {
      style: {
        padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0,
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--dsw-alias-button-info-fill,#4176f7) 8%, transparent), transparent 70%)',
        borderBottom: '1px solid var(--dsw-alias-border-l2,#eef1f5)',
      },
    },
      React.createElement('span', { style: { color: tone.info.fg, display: 'inline-flex' } }, React.createElement(EntryIcon, { size: 15, color: 'currentColor' })),
      React.createElement('span', { style: { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' } }, '渠道账号'),
      // 头部只留「标题 + 新鲜度」：网关自述名（/status 的 version）与进程 uptime 不放这里 ——
      // 它们紧贴标题、灰字、无前缀，会被读成一条账号摘要（用户反馈）。要看这两项去
      // 「渠道中心」的用量页（进程累计那块）。
      React.createElement('span', { style: { marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 } },
        React.createElement(FreshnessPill, { phase, error, fetchedAt: snapshot?.fetchedAt, now: now() }),
        React.createElement('button', {
          type: 'button', 'aria-label': '关闭', onClick: onClose,
          style: { font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--dsw-alias-label-tertiary,#8b93a1)', width: 22, height: 22, borderRadius: 6, lineHeight: 1 },
        }, '✕'),
      ),
    ),

    // ── 错误态：不显示 0、不假装有数据
    phase === 'error'
      ? React.createElement('div', { style: { padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8 } },
          React.createElement('div', { style: { fontSize: 12.5, color: tone.err.fg, display: 'flex', alignItems: 'center', gap: 6 } },
            React.createElement('span', { style: { width: 6, height: 6, borderRadius: 999, background: 'currentColor' } }),
            error?.message ?? '网关不可达',
          ),
          React.createElement('div', { style: { ...s.muted, fontSize: 11.5 } }, snapshot?.baseURL ? `地址 ${snapshot.baseURL}` : '未配置网关地址'),
          React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 2 } },
            React.createElement('button', { type: 'button', onClick: () => onRefresh?.(), style: { ...s.btnGhost, height: 28, fontSize: 12 } }, '重试'),
            openCenter ? React.createElement('button', { type: 'button', onClick: () => { onClose?.(); openCenter?.(); }, style: { ...s.btnPri, height: 28, fontSize: 12 } }, '打开渠道中心') : null,
          ),
        )
      : React.createElement(React.Fragment, null,
          // ── 汇总：三块统计
          React.createElement('div', { style: { display: 'flex', gap: 8, padding: '10px 12px 4px' } },
            React.createElement(Tile, {
              label: '可用积分', value: formatCompact(summary.usableCredits), accent: tone.info.fg,
              hint: summary.creditsFreshness?.stale ? '偏旧' : undefined,
            },
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 } },
                React.createElement(Ring, { ratio: summary.healthRatio, color: summary.healthy === summary.total ? tone.ok.fg : tone.warn.fg }),
                React.createElement('span', { style: { fontSize: 10.5, color: 'var(--dsw-alias-label-tertiary,#8b93a1)', lineHeight: 1.35 } },
                  `账号 ${summary.healthy}/${summary.total}`,
                  summary.cooling > 0 ? React.createElement('br', null) : null,
                  summary.cooling > 0 ? `冷却 ${summary.cooling}` : '',
                ),
              ),
            ),
            React.createElement(Tile, { label: '近 24h', value: summary.usage24h ? formatNumber(summary.usage24h.requests) : '—', hint: '次' },
              React.createElement('div', { style: { marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 } },
                React.createElement(Sparkline, { values: daySpark, color: tone.info.fg, width: 92, height: 20 }),
              ),
            ),
          ),
          React.createElement('div', { style: { padding: '6px 12px 10px' } },
            React.createElement(ChannelBar, {
              channels: summary.channels.map((row) => ({ ...row, color: channelColor(row.id) })),
              total: summary.total,
            }),
            summary.usage24h
              ? React.createElement('div', { style: { ...s.muted, fontSize: 10.5, marginTop: 6 } },
                  `${formatTokens(summary.usage24h.tokens)} tokens · 成功 ${formatNumber(summary.usage24h.success)} / 失败 ${formatNumber(summary.usage24h.failed)}${summary.inFlight > 0 ? ` · 在途 ${summary.inFlight}` : ''}${typeof summary.sticky === 'number' ? ` · 粘性 ${summary.sticky}` : ''}`,
                )
              : null,
          ),

          // ── 账号列表（滚动区）
          React.createElement('div', {
            className: 'dshc-quick-scroll',
            style: { display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 6px 8px', overflowY: 'auto', minHeight: 0, flex: 1 },
          },
            vms.length === 0
              ? React.createElement('div', { style: { ...s.muted, padding: '10px 8px', fontSize: 11.5 } },
                  '网关还没有账号 —— 到「渠道中心」添加后这里会自动出现。')
              : vms.map((vm) =>
                  React.createElement(AccountQuickRow, {
                    key: vm.uid,
                    vm,
                    series: seriesByUid.get(vm.uid),
                    usageTotal: usageByUid.get(vm.uid),
                  }),
                ),
          ),

          // ── 底栏：新鲜度 + 动作
          React.createElement('div', {
            style: {
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
              borderTop: '1px solid var(--dsw-alias-border-l2,#eef1f5)', background: 'var(--dsw-alias-bg-layer-2,#fafbfc)',
            },
          },
            React.createElement('span', { style: { ...s.muted, fontSize: 10.5, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
              snapshot?.refreshError
                ? `刷新失败：${snapshot.refreshError.message ?? '未知原因'}`
                : summary.creditsFreshness?.oldestISO
                  ? `积分 ${relativeTime(summary.creditsFreshness.oldestISO, now())}${summary.creditsFreshness.stale ? '（偏旧）' : ''}`
                  : ' '),
            React.createElement('span', { style: { marginLeft: 'auto', display: 'inline-flex', gap: 6 } },
              React.createElement('button', {
                type: 'button', disabled: refreshing, onClick: onRefresh,
                title: '向上游重取各账号余额（会真打一次上游）',
                style: { ...s.btnGhost, height: 28, fontSize: 12, opacity: refreshing ? 0.6 : 1 },
              }, refreshing ? '刷新中…' : '刷新'),
              openCenter
                ? React.createElement('button', {
                    type: 'button',
                    title: '打开「渠道中心」面板（含账号池、任务、日志、用量）',
                    onClick: () => { onClose?.(); openCenter?.(); },
                    style: { ...s.btnPri, height: 28, fontSize: 12 },
                  }, '渠道中心')
                : null,
            ),
          ),
        ),
  );
}

/**
 * 「渠道中心」弹窗（portal 到 body）。
 *
 * 为什么用弹窗而不是主区面板：渠道中心是**管理台**（账号池 / 任务 / 日志 / 用量），
 * 用弹窗能在不打断当前会话上下文的前提下查看，移动端也是一张全屏 sheet，比把会话
 * 面板换掉更轻（宿主也没有「打开设置面板到指定分区」的接口）。
 *
 * @param props - `{onClose, children}`。
 * @returns React 元素。
 */
export function CenterModal({ onClose, children }) {
  const closeRef = React.useRef(null);
  const sheet = typeof window !== 'undefined' && window.innerWidth < 640;

  // Esc 关闭；打开期间锁 body 滚动（关掉恢复原值，不硬写 ''）
  React.useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose?.();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const body = document.body;
    const before = body?.style?.overflow ?? '';
    if (body) body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (body) body.style.overflow = before;
    };
  }, [onClose]);

  // 打开时把焦点交给关闭按钮，关闭后还给原处（键盘/读屏可达）
  React.useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus?.();
    return () => {
      previous?.focus?.();
    };
  }, []);

  return React.createElement('div', {
    className: 'dshc-center-backdrop',
    // 只在点到背景遮罩本身时关闭（点内容不关）
    onMouseDown: (event) => {
      if (event.target === event.currentTarget) onClose?.();
    },
    style: {
      position: 'fixed', inset: 0, zIndex: 80,
      display: 'flex', alignItems: sheet ? 'stretch' : 'center', justifyContent: 'center',
      padding: sheet ? 0 : 24,
      background: 'rgba(15,23,42,.45)',
    },
  },
    React.createElement('div', {
      className: 'dshc-center-dialog',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': '渠道中心',
      style: {
        display: 'flex', flexDirection: 'column', minWidth: 0,
        width: sheet ? '100%' : 'min(1040px, 100%)',
        height: sheet ? '100%' : undefined,
        maxHeight: sheet ? undefined : 'min(88vh, 920px)',
        background: 'var(--dsw-alias-bg-layer-1,#fff)',
        color: 'var(--dsw-alias-label-primary,currentColor)',
        border: sheet ? 'none' : '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
        borderRadius: sheet ? 0 : 16,
        boxShadow: sheet ? 'none' : '0 24px 64px rgba(15,23,42,.28), 0 2px 8px rgba(15,23,42,.10)',
        overflow: 'hidden',
      },
    },
      // 头部：图标 + 标题 + 关闭（与 popover 头部同一套令牌，不写死颜色）
      React.createElement('div', {
        style: {
          padding: sheet ? '12px 12px' : '10px 12px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0,
          borderBottom: '1px solid var(--dsw-alias-border-l2,#eef1f5)',
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--dsw-alias-button-info-fill,#4176f7) 8%, transparent), transparent 70%)',
        },
      },
        React.createElement('span', { style: { color: tone.info.fg, display: 'inline-flex' } },
          React.createElement(Icons.hub, { width: 17, height: 17, 'aria-hidden': 'true' })),
        React.createElement('span', { style: { fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' } }, '渠道中心'),
        React.createElement('button', {
          ref: closeRef,
          type: 'button',
          'aria-label': '关闭渠道中心',
          title: '关闭（Esc）',
          onClick: onClose,
          style: {
            font: 'inherit', cursor: 'pointer', border: 'none', background: 'transparent',
            color: 'var(--dsw-alias-label-tertiary,#8b93a1)', width: 32, height: 32, borderRadius: 8,
            marginLeft: 'auto', lineHeight: 1, flex: '0 0 auto',
          },
        }, '✕'),
      ),
      // 主体：渠道中心面板本体（滚动区，移动端整屏）
      React.createElement('div', {
        className: 'dshc-center-body',
        style: { flex: 1, minHeight: 0, overflow: 'auto', padding: sheet ? '12px 12px 20px' : '12px 14px 16px' },
      }, children),
    ),
  );
}

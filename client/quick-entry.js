// dsh-chanhub —— 侧边栏快捷入口（footer 按钮 + 自带 popover）
//
// 挂载点：`sidebar.footer.action`（list 槽，与设置按钮同一 foot 区，宿主传 `{wide}`）。
//   footArea
//   ├─ footerActions ← 本组件（rail 态只剩图标 + 角标）
//   └─ settingsArea  ← 齿轮按钮（sidebar.settings）
//
// 两条硬约束（决定了这里的结构）：
//   1. **浮层必须 portal 到 body**：侧边栏是可滑动 grid track 且注释明写会 clip
//      子内容，`.footArea` 又是 flex column —— 就地绝对定位会被裁掉。
//   2. **不能按 section 深链设置**：全仓只有 `remote.settings.openSettingsDocument()`，
//      所以「打开渠道中心」只能打开设置面板本身；账户信息由本 popover 自己承载。
//
// 数据一律来自 quick-store 的同一份快照（按钮角标与 popover 数字永远一致），
// 自动路径只打只读端点；「刷新」是唯一会真打上游的按钮，且要用户点。

import React from 'react';
import { createPortal } from 'react-dom';

import { s, tone } from './theme.js';
import {
  accountCardVM,
  channelColor,
  formatCompact,
  formatNumber,
  formatTokens,
  quickSummaryVM,
  relativeTime,
  sparkPath,
  uptimeText,
  usageSeriesByKey,
  usageBySlot,
} from './derive.js';

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
@media (prefers-reduced-motion:reduce){ .dshc-quick-pop{animation:none} .dshc-quick-dot::after{animation:none} }
`;

const POP_WIDTH = 344;
const POP_MAX_HEIGHT = 520;

/** 计分环：用两段 stroke-dasharray 表达健康占比（无第三方图表依赖）。 */
export function Ring({ ratio = 0, size = 34, stroke = 4, color = tone.ok.fg, track = 'var(--dsw-alias-border-l3,#e5e7eb)' }) {
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
      transform: `rotate(-90 ${size / 2} ${size / 2})`, style: { transition: 'stroke-dasharray .35s' },
    }),
  );
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
        React.createElement(Chip, { text: vm.channelLabel }),
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
 * 侧边栏快捷入口主体。
 *
 * @param props - `{wide, store, prefs, openSettings, now}`。
 * @returns React 元素。
 */
export function QuickEntry({ wide, store, prefs, openSettings, hasOpenSettings, now = Date.now() }) {
  const [snapshot, setSnapshot] = React.useState(() => store?.getSnapshot?.());
  const [enabled, setEnabled] = React.useState(() => (prefs ? prefs.value : true));
  const [open, setOpen] = React.useState(false);
  const [anchor, setAnchor] = React.useState();
  const buttonRef = React.useRef(null);
  const rootRef = React.useRef(null);

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

  if (!enabled) return null;
  // 收起态（56px 轨道）= 只画一个 36px 图标（与 `lc-ov-entry-rail` 同尺寸），不放摘要数字。
  // 注意：这一行是共享 list 槽，宿主 CSS 是
  // `.collapsed .footerActions{justify-content:center;width:auto}`，56px 列扣掉左右内边距
  // 只剩 ~36px —— 也就是说**收起态只容得下一个图标**。若将来同行的其它入口
  // （dsh-context「上下文洞察」、cordis 面板）也回到收起态，会互相挤；届时或把本入口
  // 收起态关掉（一行 return null），或让用户在配置 Tab 的「界面」组里关闭本入口。
  const rail = wide === false;

  const summary = quickSummaryVM({
    status: snapshot?.status,
    usage: snapshot?.usage,
    now: now(),
  });
  const phase = snapshot?.phase ?? 'loading';
  const hasAccounts = summary.total > 0;
  const alert = phase === 'error' || summary.inFlightFull > 0 || (summary.total > 0 && summary.cooling > 0);
  const badgeColor = phase === 'error' ? tone.err.fg : phase === 'stale' ? tone.warn.fg : alert ? tone.warn.fg : tone.ok.fg;

  const button = React.createElement('button', {
    ref: buttonRef,
    type: 'button',
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-label': '渠道账号',
    title: '渠道账号 · 点击查看账号池',
    onClick: () => setOpen((value) => !value),
    style: {
      font: 'inherit', cursor: 'pointer', border: 'none', background: open ? 'var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.06))' : 'transparent',
      color: 'var(--dsw-alias-label-secondary,#6b7280)', borderRadius: 8,
      // foot 区那一行是**共享**的（`sidebar.footer.action` 是 list 槽：dsh-context 的
      // 「上下文洞察」也在这里，且它自身是 `width: calc(100% + 4px)` 的整行样式）。
      // 所以这里**不能用 width:100%** —— 那会和它互相抢宽、被挤成半行而看不清。
      // flex:0 0 auto = 取自然宽度、永不被压扁；让整行样式的那一项去收缩。
      flex: '0 0 auto', maxWidth: '100%',
      height: rail ? 36 : 32, padding: rail ? 0 : '0 8px', minWidth: rail ? 36 : 96,
      justifyContent: rail ? 'center' : undefined,
      display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'background .15s', overflow: 'hidden',
    },
  },
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
      ? React.createElement('span', { style: { display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0, flex: 1, justifyContent: 'space-between' } },
          React.createElement('span', { style: { fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, '渠道'),
          React.createElement('span', { style: { fontSize: 11.5, color: 'var(--dsw-alias-label-tertiary,#8b93a1)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' } },
            phase === 'error'
              ? '不可达'
              : hasAccounts
                ? `${summary.healthy}/${summary.total} · ${formatCompact(summary.usableCredits)}`
                : '无账号',
          ),
        )
      : null,
  );

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
          // 便利入口：宿主没有 remote.settings 时不渲染「渠道中心」按钮（其余功能照常）
          openSettings: hasOpenSettings?.() === true ? openSettings : undefined,
        }),
        document.body,
      )
    : null;

  return React.createElement(React.Fragment, null, button, popover);
}

/** 浮层本体（拆出来便于测试单独渲染）。 */
export function Popover({ snapshot, summary, anchor, now, rootRef, onClose, onRefresh, openSettings }) {
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
        background: 'linear-gradient(135deg, var(--dsw-alias-button-info-fill,#4176f7)14, transparent 70%)',
        borderBottom: '1px solid var(--dsw-alias-border-l2,#eef1f5)',
      },
    },
      React.createElement('span', { style: { color: tone.info.fg, display: 'inline-flex' } }, React.createElement(EntryIcon, { size: 15, color: 'currentColor' })),
      React.createElement('span', { style: { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' } }, '渠道账号'),
      React.createElement('span', { style: { fontSize: 10.5, color: 'var(--dsw-alias-label-tertiary,#8b93a1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 } },
        summary.version ? `${summary.version}${summary.uptimeSec ? ` · ${uptimeText(summary.uptimeSec)}` : ''}` : ''),
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
            openSettings ? React.createElement('button', { type: 'button', onClick: openSettings, style: { ...s.btnPri, height: 28, fontSize: 12 } }, '打开渠道中心') : null,
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
              openSettings
                ? React.createElement('button', { type: 'button', onClick: openSettings, style: { ...s.btnPri, height: 28, fontSize: 12 } }, '渠道中心')
                : null,
            ),
          ),
        ),
  );
}

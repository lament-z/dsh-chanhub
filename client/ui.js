// dsh-chanhub —— 客户端共享 UI 基元（浏览器侧）
//
// 为什么单独成文件：用量 Tab 拆到 `client/usage/` 后需要 Tag / CardHead /
// Fold / Unavailable / Icons 等基元。若它们仍留在 `client/index.js`，
// `usage/*` 就得反过来 import 入口文件 —— 形成环，esbuild 打包后会在
// 模块初始化期拿到 undefined（真机表现为整块面板白屏）。
//
// 因此把**无状态、无依赖**的基元下沉到这里：index.js 与 usage/* 都从
// 本文件 import，依赖方向单向。

import React from 'react';
import { s, tone } from './theme.js';

/**
 * 内联 SVG 外壳（统一 viewBox / stroke 约定）。
 * @param props - 透传给 `<svg>` 的属性。
 * @param children - 子元素。
 * @returns React 元素。
 */
export const svg = (props, ...children) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      width: 16,
      height: 16,
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ...props,
    },
    ...children,
  );

export const Icons = {
  // 渠道中心主图标：三条汇入一个节点的线（渠道汇聚），与 bridge 的
  // tunnel/ops/gear、宿主齿轮 fallback 均不重合。
  hub: (props) =>
    svg(
      { width: 18, height: 18, ...props },
      React.createElement('circle', { key: 'c', cx: 12, cy: 12, r: 2.6 }),
      React.createElement('path', { key: 'a', d: 'M12 9.4V3.5' }),
      React.createElement('path', { key: 'b', d: 'M9.8 13.4l-5.1 3' }),
      React.createElement('path', { key: 'd', d: 'M14.2 13.4l5.1 3' }),
      React.createElement('circle', { key: 'e', cx: 12, cy: 3, r: 1.6 }),
      React.createElement('circle', { key: 'f', cx: 4, cy: 17, r: 1.6 }),
      React.createElement('circle', { key: 'g', cx: 20, cy: 17, r: 1.6 }),
    ),
  chart: (props) =>
    svg(
      props,
      React.createElement('path', { key: 'a', d: 'M3 20h18' }),
      React.createElement('rect', { key: 'b', x: 4, y: 10, width: 4, height: 8, rx: 1 }),
      React.createElement('rect', { key: 'c', x: 10, y: 5, width: 4, height: 13, rx: 1 }),
      React.createElement('rect', { key: 'd', x: 16, y: 13, width: 4, height: 5, rx: 1 }),
    ),
  check: (props) => svg(props, React.createElement('path', { d: 'M20 6L9 17l-5-5' })),
  trend: (props) =>
    svg(
      props,
      React.createElement('path', { key: 'a', d: 'M3 17l6-6 4 4 8-8' }),
      React.createElement('path', { key: 'b', d: 'M15 7h6v6' }),
    ),
  list: (props) =>
    svg(props, React.createElement('path', { d: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' })),
  gear: (props) =>
    svg(
      props,
      React.createElement('circle', { key: 'c', cx: 12, cy: 12, r: 3 }),
      React.createElement('path', {
        key: 'p',
        d: 'M12 2l1.6 1.2 2-.2.8 1.9 1.8.9-.3 2 1.2 1.7-1.2 1.7.3 2-1.8.9-.8 1.9-2-.2L12 22l-1.6-1.2-2 .2-.8-1.9-1.8-.9.3-2L4.9 12l1.2-1.7-.3-2 1.8-.9.8-1.9 2 .2z',
      }),
    ),
  refresh: (props) =>
    svg(
      { width: 13, height: 13, ...props },
      React.createElement('path', { key: 'a', d: 'M21 12a9 9 0 1 1-3-6.7' }),
      React.createElement('path', { key: 'b', d: 'M21 3v6h-6' }),
    ),
  // v2 新增
  eye: (props) =>
    svg(
      { width: 14, height: 14, ...props },
      React.createElement('path', { key: 'a', d: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z' }),
      React.createElement('circle', { key: 'b', cx: 12, cy: 12, r: 3 }),
    ),
  eyeOff: (props) =>
    svg(
      { width: 14, height: 14, ...props },
      React.createElement('path', { key: 'a', d: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' }),
      React.createElement('line', { key: 'b', x1: 1, y1: 1, x2: 23, y2: 23 }),
    ),
  copy: (props) =>
    svg(
      { width: 13, height: 13, ...props },
      React.createElement('rect', { key: 'a', x: 9, y: 9, width: 13, height: 13, rx: 2 }),
      React.createElement('path', { key: 'b', d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' }),
    ),
  cardView: (props) =>
    svg(
      { width: 13, height: 13, ...props },
      React.createElement('rect', { key: 'a', x: 3, y: 3, width: 7, height: 7, rx: 1.5 }),
      React.createElement('rect', { key: 'b', x: 14, y: 3, width: 7, height: 7, rx: 1.5 }),
      React.createElement('rect', { key: 'c', x: 3, y: 14, width: 7, height: 7, rx: 1.5 }),
      React.createElement('rect', { key: 'd', x: 14, y: 14, width: 7, height: 7, rx: 1.5 }),
    ),
  listView: (props) =>
    svg(
      { width: 13, height: 13, ...props },
      React.createElement('rect', { key: 'a', x: 3, y: 4, width: 18, height: 4, rx: 1 }),
      React.createElement('rect', { key: 'b', x: 3, y: 10, width: 18, height: 4, rx: 1 }),
      React.createElement('rect', { key: 'c', x: 3, y: 16, width: 18, height: 4, rx: 1 }),
    ),
  bolt: (props) =>
    svg(props, React.createElement('path', { d: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z' })),
  // 用量页新增：导出菜单的下载图标
  download: (props) =>
    svg(
      { width: 13, height: 13, ...props },
      React.createElement('path', { key: 'a', d: 'M12 3v12' }),
      React.createElement('path', { key: 'b', d: 'M7 10l5 5 5-5' }),
      React.createElement('path', { key: 'c', d: 'M4 20h16' }),
    ),
};

/**
 * 语义色小标签。
 * @param props - `{text, tone, title}`。
 * @returns React 元素。
 */
export function Tag({ text, tone: toneName = 'idle', title }) {
  const palette = tone[toneName] ?? tone.idle;
  return React.createElement(
    'span',
    {
      style: { ...s.tag, background: palette.bg, color: palette.fg },
      ...(title === undefined ? {} : { title }),
    },
    text,
  );
}

/**
 * 卡片标题行：左标题 + 右次要信息（可选）+ 右侧动作（可选）。
 *
 * 统一各卡的标题排版 —— 原先每张卡各写一遍 `{...s.label}` 加手工 margin，
 * 结果同一页里标题字号/间距/右侧信息位置各不相同。
 *
 * @param props - `{title, extra, actions}`。
 * @returns React 元素。
 */
export function CardHead({ title, extra, actions }) {
  return React.createElement('div', { className: 'dshc-cardhead' },
    React.createElement('span', { style: s.label }, title),
    extra ? React.createElement('span', { style: s.muted }, extra) : null,
    actions ? React.createElement('span', { className: 'dshc-row', style: { marginLeft: 'auto', gap: 6 } }, actions) : null,
  );
}

/**
 * 「网关未提供此数据」的显式占位。
 *
 * 本面板的诚实性要求：数据源不存在时不隐藏区块、也不编造值，
 * 而是明确说出缺什么、后端需要补什么端点。
 *
 * @param props - `{title, needs, hint}`。
 * @returns React 元素。
 */
export function Unavailable({ title, needs, hint }) {
  return React.createElement(
    'div',
    { style: { ...s.card, borderStyle: 'dashed' } },
    React.createElement(
      'div',
      { style: { ...s.label, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
      title,
      React.createElement(Tag, { text: '网关未提供', tone: 'warn' }),
    ),
    React.createElement(
      'div',
      { style: { ...s.muted, marginTop: 8, lineHeight: 1.7 } },
      '当前网关（plugins/chanhub）没有暴露此视图所需的数据端点，因此这里不显示任何推断值。',
    ),
    needs
      ? React.createElement(
          'div',
          {
            style: {
              ...s.code,
              marginTop: 8,
              background: 'var(--dsw-alias-bg-layer-1,#fff)',
              padding: '8px 10px',
              borderRadius: 6,
            },
          },
          `所需后端端点：${needs}`,
        )
      : null,
    hint ? React.createElement('div', { style: { ...s.muted, marginTop: 8 } }, hint) : null,
  );
}

/**
 * 可折叠区块。
 *
 * 用原生 `<details>`；折叠组头右侧的动作必须是 `<span>` + `pointer-events:none`
 * （`<summary>` 内放真 `<button>` 会连带触发展开，见 ui-design.md §7 坑 2）。
 *
 * @param props - `{summary, children, open, id, onToggle}`。
 * @returns React 元素。
 */
export function Fold({ summary, children, open = false, id }) {
  return React.createElement(
    'details',
    { className: 'dshc-fold', ...(open ? { open: true } : {}), ...(id ? { 'data-fold': id } : {}) },
    React.createElement('summary', null, summary),
    React.createElement('div', { className: 'dshc-body' }, children),
  );
}

/** 渠道展示名（短名，表格/标签用）。 */
export function channelLabel(channel) {
  return { workbuddy: 'WB', traework: 'Trae', qoder: 'Qoder' }[channel] ?? '';
}

/** 绝对时间展示。 */
export function formatAbsolute(iso) {
  const value = Date.parse(iso);
  if (!Number.isFinite(value) || value <= 0) return '—';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

/** 吞吐格式化（保留 1 位小数）。 */
export function formatLatency(value) {
  return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(1)} tok/s` : '—';
}

/**
 * 数字入场动效（900ms，与参考实现同款缓动）。
 *
 * 可访问性：系统开启「减少动态效果」时**直接返回终值**，不注册 rAF
 * —— 动画是锦上添花，不该成为拒绝动画的用户被迫接受的东西。
 * 另：组件卸载时取消 rAF，避免泄漏。
 *
 * @param target - 目标值。
 * @param duration - 时长（毫秒）。
 * @returns 当前应显示的值。
 */
export function useCountUp(target, duration = 900) {
  const value = Number(target) || 0;
  const [shown, setShown] = React.useState(value);
  const fromRef = React.useRef(value);

  React.useEffect(() => {
    // 动效必须「可失败」：任何环境下都不能把真实数字留成动画中间值。
    // 因此（a）无 rAF / 关了动效 → 直接给终值；（b）rAF 被节流（标签页后台、
    // 无头渲染）时，还有一个 setTimeout 兜底把终值落定 —— 否则用户会看到
    // 一屏 0，这比没有动效糟得多。
    const canAnimate = typeof requestAnimationFrame === 'function'
      && typeof cancelAnimationFrame === 'function'
      && !(typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (!canAnimate) {
      fromRef.current = value;
      setShown(value);
      return undefined;
    }

    const from = fromRef.current;
    const start = Date.now();
    let frame = 0;
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      fromRef.current = value;
      setShown(value);
    };
    const tick = () => {
      if (settled) return;
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (value - from) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else settle();
    };
    frame = requestAnimationFrame(tick);
    const guard = setTimeout(settle, duration + 150);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      clearTimeout(guard);
    };
  }, [value, duration]);

  // 值变化时（切窗口/刷新）立即从当前显示值起步，避免从 0 重播
  const shownRef = React.useRef(shown);
  shownRef.current = shown;
  React.useEffect(() => { fromRef.current = shownRef.current; }, [value]);

  return shown;
}

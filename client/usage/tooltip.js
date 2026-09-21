// dsh-chanhub —— 图表悬停 tooltip（浏览器侧）
//
// 参考 dsh-usage-panel 的 Tooltip.tsx：**fixed 定位**（不跟随鼠标偏移），
// 标题行 + 色点 + 名称 + 右对齐数值。
//
// 为什么必须 fixed：跟随鼠标的 tooltip 在 SVG 上会因 mousemove 高频重渲染而
// 抖动，且贴近画布边缘时会被裁掉。fixed + 由调用方给出锚点坐标最稳。

import React from 'react';

/**
 * tooltip 渲染器。
 *
 * 由页面顶层渲染一次（`position: fixed`），各图表只负责上报/清除 tip 状态 ——
 * 这样 tooltip 永远在最上层，不会被后续卡片的层叠上下文盖住。
 *
 * @param props - `{tip}`：`{left, top, title, lines:[{label, value, color}]}` 或 null。
 * @returns React 元素或 null。
 */
export function Tooltip({ tip }) {
  if (!tip) return null;
  const lines = Array.isArray(tip.lines) ? tip.lines.filter(Boolean) : [];
  return React.createElement('div', {
    className: 'dshc-ust-tooltip show',
    style: { left: tip.left, top: tip.top },
  },
    React.createElement('div', { className: 'dshc-ust-tooltip-title' }, tip.title),
    ...lines.map((line, index) =>
      React.createElement('div', { key: `${line.label}-${index}`, className: 'dshc-ust-tooltip-row' },
        React.createElement('i', { style: { background: line.color || 'var(--dsw-alias-label-tertiary,#8b93a1)' } }),
        React.createElement('span', { className: 'dshc-ust-tooltip-label' }, line.label),
        React.createElement('span', { className: 'dshc-ust-tooltip-value' }, line.value),
      ),
    ),
  );
}

/**
 * 从事件目标算出 tooltip 锚点（元素上沿中心）。
 *
 * 用 `getBoundingClientRect()` 而不是 `clientX/clientY`：柱状图/热力图的
 * 悬停单元是**固定几何**，用元素位置锚定可以让 tooltip 稳定停在那一格上方，
 * 不随鼠标在图内移动而漂移。
 *
 * @param event - 鼠标事件。
 * @param dy - 相对元素上沿的额外偏移（默认 -6，即浮在元素上方）。
 * @returns `{left, top}`。
 */
export function anchorOf(event, dy = -6) {
  const rect = event?.currentTarget?.getBoundingClientRect?.();
  if (!rect) return { left: 0, top: 0 };
  return { left: rect.left + rect.width / 2, top: rect.top + dy };
}

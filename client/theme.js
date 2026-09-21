// dsh-chanhub —— 视觉令牌与共享样式（浏览器侧）
//
// 令牌取自 DSH 真实主题 `@deepseek-ai/dsh-client-ui-theme` 的 `--dsw-alias-*` 变量，
// 与 dsh-bridge-gateway 的 `s` 对象同源。**不要硬编码颜色** —— 否则亮/暗主题会崩。
//
// 见 `.scratch/chanhub-panel/ui-design.md` §3 的令牌表（含亮/暗两套解析值）。

/** 卡片 / 按钮 / 标签等共享样式（与 dsh-bridge-gateway 对齐并扩充）。 */
export const s = {
  card: {
    // 参考 dsh-usage-panel / dsh-token-monitor：卡片用 layer-1（白）浮在灰页面上。
    // 原先用 layer-2（比页面更暗）会让卡片「后退」，整页发闷 —— 这是本轮
    // 「差点意思」的主要来源之一。
    background: 'var(--dsw-alias-bg-layer-1,#fff)',
    border: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
    borderRadius: 12,
    padding: '16px 18px',
    marginBottom: 16,
    boxSizing: 'border-box',
    minWidth: 0,
  },
  block: {
    borderTop: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
    marginTop: 12,
    paddingTop: 12,
    minWidth: 0,
  },
  muted: { color: 'var(--dsw-alias-label-tertiary,#8b93a1)', fontSize: 12, lineHeight: 1.5 },
  label: { color: 'var(--dsw-alias-label-primary,currentColor)', fontSize: 13, fontWeight: 500 },
  code: {
    fontFamily: 'ui-monospace,Menlo,monospace',
    fontSize: 12,
    wordBreak: 'break-all',
    color: 'var(--dsw-alias-label-primary,currentColor)',
  },
  btnPri: {
    font: 'inherit',
    cursor: 'pointer',
    border: 'none',
    background: 'var(--dsw-alias-button-info-fill,#4176e6)',
    color: '#fff',
    height: 32,
    padding: '0 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  btnGhost: {
    font: 'inherit',
    cursor: 'pointer',
    border: '1px solid var(--dsw-alias-border-l2,#d1d5db)',
    background: 'var(--dsw-alias-bg-layer-2,#f9fafb)',
    color: 'var(--dsw-alias-label-primary,currentColor)',
    height: 32,
    padding: '0 14px',
    borderRadius: 999,
    fontSize: 13,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    textDecoration: 'none',
  },
  btnLink: {
    font: 'inherit',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    color: 'var(--dsw-alias-state-business-primary,#4176e6)',
    fontSize: 12,
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    textDecoration: 'none',
  },
  input: {
    font: 'inherit',
    fontSize: 12,
    height: 28,
    padding: '0 8px',
    borderRadius: 6,
    border: '1px solid var(--dsw-alias-border-l2,#d1d5db)',
    background: 'var(--dsw-alias-bg-layer-1,#fff)',
    color: 'var(--dsw-alias-label-primary,currentColor)',
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
  },
  warn: {
    background: 'var(--dsw-alias-state-warn-tertiary,#fffbeb)',
    border: '1px solid var(--dsw-alias-border-l2,#fde68a)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 12,
    color: 'var(--dsw-alias-state-warn-primary,#92400e)',
    lineHeight: 1.6,
  },
  tip: {
    background: 'var(--dsw-alias-bg-layer-2,#f9fafb)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 12,
    color: 'var(--dsw-alias-label-secondary,#6b7280)',
    lineHeight: 1.6,
  },
  err: {
    background: 'var(--dsw-alias-interactive-bg-hover-danger,#fef2f2)',
    border: '1px solid var(--dsw-alias-border-l2,#fecaca)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 12,
    color: 'var(--dsw-alias-state-error-primary,#dc2626)',
    lineHeight: 1.6,
  },
  // KPI 统计格：与 .dshc-kpi / .dshc-kpis 配套。此前 s 里没有这一项，
  // 用量页只挂 className（于是 padding 全丢），账号池页内联兜底、两边不一致。
  kpi: {
    border: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
    borderRadius: 10,
    background: 'var(--dsw-alias-bg-layer-1,#fff)',
    padding: '10px 12px',
    minWidth: 0,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    minWidth: 'max-content',
    lineHeight: 1.4,
  },
};

/** 语义色（供状态标签 / 色块 / 色条复用）。 */
export const tone = {
  ok: {
    fg: 'var(--dsw-alias-state-success-primary,#059669)',
    bg: 'var(--dsw-alias-state-success-tertiary,#ecfdf5)',
  },
  warn: {
    fg: 'var(--dsw-alias-state-warn-primary,#b45309)',
    bg: 'var(--dsw-alias-state-warn-tertiary,#fffbeb)',
  },
  err: {
    fg: 'var(--dsw-alias-state-error-primary,#dc2626)',
    bg: 'var(--dsw-alias-interactive-bg-hover-danger,#fef2f2)',
  },
  info: {
    fg: 'var(--dsw-alias-button-info-fill,#4176e6)',
    bg: 'var(--dsw-alias-bg-layer-2,#eef2ff)',
  },
  idle: {
    fg: 'var(--dsw-alias-label-secondary,#6b7280)',
    bg: 'var(--dsw-alias-bg-layer-2,#f3f4f6)',
  },
};

/**
 * 折叠样式表（注入一次的 `<style>` 内容）。
 *
 * 这里修的是 ui-design.md §7 记录的两个真实坑：
 *   1. `<details>` 内元素一旦有显式 `display`，折叠隐藏就会失效
 *      （浏览器靠 UA 的 `display:none` 隐藏未展开内容）→
 *      必须显式补 `:not([open])` 规则把它压回去。
 *   2. `<summary>` 里放真 `<button>` 会连带触发展开 →
 *      折叠组头右侧的「执行」用 `<span>` + `pointer-events:none`。
 */
export const FOLD_CSS = `
.dshc-fold { border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 8px; margin-bottom: 8px; background: var(--dsw-alias-bg-layer-2,#f9fafb); min-width: 0; }
.dshc-fold > summary { cursor: pointer; padding: 8px 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; list-style: none; min-width: 0; }
.dshc-fold > summary::-webkit-details-marker { display: none; }
.dshc-fold > summary::before { content: '▸'; flex-shrink: 0; color: var(--dsw-alias-label-tertiary,#8b93a1); font-size: 11px; }
.dshc-fold[open] > summary::before { content: '▾'; }
/* 坑 1：显式 display 会覆盖折叠隐藏 —— 显式压回 */
.dshc-fold:not([open]) > .dshc-body { display: none; }
.dshc-body { padding: 4px 12px 12px; min-width: 0; }
/* 网格行的统一内边距：折叠体（.dshc-body）带 12px 左右内边距，而常驻的
   「待做」组在卡片直下 —— 不补同样内边距，两组行的网格起点就差 12px（实测 13px），
   看起来像列没对齐。给两组同一个水平内边距，网格列才对得上。 */
.dshc-rows { padding: 0 12px; min-width: 0; border-left: 1px solid transparent; border-right: 1px solid transparent; }
/* 说明：折叠卡 .dshc-fold 自带 1px 边框，其内容因此比卡片直下的兄弟节点右移 1px。
   上面的 transparent 边框把常驻行组也推同样的 1px，两组网格列才严格同一 x。
   用 border 而不是 margin：margin 会让宽度也差 2px（实测 674 vs 672）。 */
.dshc-body .dshc-body { background: var(--dsw-alias-bg-layer-1,#fff); }
/* 行：一律 center 对齐 —— 竖排块与单行文字用 baseline 会错位（实测 20px，坑 3） */
.dshc-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.dshc-grid { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.dshc-sub { padding-left: 16px; border-left: 2px solid var(--dsw-alias-border-l2,#e5e7eb); margin-left: 6px; }
/* 表格横向滚动：容器链上必须有 min-width:0，否则 min-width 会撑破卡片 */
.dshc-tblwrap { overflow-x: auto; min-width: 0; }
.dshc-tblwrap > table { min-width: 600px; border-collapse: collapse; width: 100%; font-size: 12px; }
.dshc-tblwrap th { text-align: left; font-weight: 500; color: var(--dsw-alias-label-tertiary,#8b93a1); padding: 6px 8px; border-bottom: 1px solid var(--dsw-alias-border-l2,#e5e7eb); white-space: nowrap; }
.dshc-tblwrap td { padding: 6px 8px; border-bottom: 1px solid var(--dsw-alias-border-l2,#f3f4f6); color: var(--dsw-alias-label-primary,currentColor); font-variant-numeric: tabular-nums; }
.dshc-codebar { width: 3px; border-radius: 2px; align-self: stretch; flex-shrink: 0; }
.dshc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dshc-palette { display: inline-flex; align-items: center; max-width: 420px; min-width: 80px; height: 12px; border-radius: 3px; overflow: hidden; flex-grow: 1; background: var(--dsw-alias-bg-layer-2,#f3f4f6); }
.dshc-palette > span { height: 100%; }
.dshc-five { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
@media (max-width: 560px) { .dshc-five { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
/* 总积分与渠道：窄屏换行 / 极窄屏竖排 */
.dshc-totalrow { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
@media (max-width: 900px) { .dshc-totalrow { gap: 10px; } .dshc-chan { padding: 0 10px; min-width: 54px; } }
@media (max-width: 520px) { .dshc-totalrow { flex-direction: column; align-items: flex-start; gap: 8px; } }
.dshc-channels { display: flex; align-items: center; }
.dshc-chan { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 14px; min-width: 62px; }
.dshc-chan + .dshc-chan { border-left: 1px solid var(--dsw-alias-border-l2,#e5e7eb); align-self: stretch; }
.dshc-schedblock { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.dshc-dp { width: 18px; height: 14px; border-radius: 3px; font-size: 9px; line-height: 14px; text-align: center; flex-shrink: 0; }
.dshc-dp.ok { background: var(--dsw-alias-state-success-primary,#22c55e); color: #fff; }
.dshc-dp.run { border: 1.5px solid var(--dsw-alias-button-info-fill,#4176e6); color: var(--dsw-alias-button-info-fill,#4176e6); }
.dshc-dp.part { background: var(--dsw-alias-state-warn-tertiary,#fffbeb); border: 1.5px solid var(--dsw-alias-state-warn-primary,#f59e0b); color: var(--dsw-alias-state-warn-primary,#b45309); }
.dshc-dp.wait { background: var(--dsw-alias-bg-layer-2,#f3f4f6); color: var(--dsw-alias-label-tertiary,#9ca3af); }
.dshc-dp.na { border: 1.5px dashed var(--dsw-alias-border-l2,#d1d5db); color: var(--dsw-alias-label-tertiary,#9ca3af); }
.dshc-ck { width: 15px; height: 15px; border-radius: 50%; font-size: 9px; line-height: 15px; text-align: center; flex-shrink: 0; border: 1.5px solid var(--dsw-alias-border-l2,#d1d5db); color: var(--dsw-alias-label-tertiary,#9ca3af); }
.dshc-ck.on { background: var(--dsw-alias-state-success-primary,#22c55e); border-color: var(--dsw-alias-state-success-primary,#22c55e); color: #fff; }
.dshc-ck.na { border-style: dashed; }
.dshc-codes { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 6px; }
@media (max-width: 560px) { .dshc-codes { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); } }
.dshc-codepill { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 6px; background: var(--dsw-alias-bg-layer-1,#fff); border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); font-size: 11.5px; min-width: 0; }
.dshc-log { font-family: ui-monospace,Menlo,monospace; font-size: 11.5px; line-height: 1.7; word-break: break-all; }
.dshc-tabs { display: flex; align-items: center; gap: 0; border-bottom: 1px solid var(--dsw-alias-border-l2,#e5e7eb); margin-bottom: 14px; overflow-x: auto; scrollbar-width: none; }
.dshc-tabs::-webkit-scrollbar { display: none; }
/* ---- v2 重设计新增 ---- */
/* 顶栏一行药丸条 */
.dshc-topbar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 12px; background: var(--dsw-alias-bg-layer-2,#f9fafb); margin-bottom: 12px; flex-wrap: wrap; min-width: 0; }
.dshc-topbar-title { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary,currentColor); white-space: nowrap; }
.dshc-statusdot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.dshc-keypill { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2,#d1d5db); background: var(--dsw-alias-bg-layer-1,#fff); font-family: ui-monospace,Menlo,monospace; font-size: 11.5px; color: var(--dsw-alias-label-secondary,#6b7280); cursor: pointer; max-width: 260px; overflow: hidden; white-space: nowrap; flex-shrink: 0; }
.dshc-keypill > span { overflow: hidden; text-overflow: ellipsis; }
.dshc-keypill-ico { border: none; background: none; cursor: pointer; padding: 2px; display: inline-flex; color: var(--dsw-alias-label-tertiary,#8b93a1); flex-shrink: 0; }
.dshc-keypill-ico:hover { color: var(--dsw-alias-brand-primary,#4f6ef7); }
/* Tab 栏最右的「添加账号」：与 5 个 Tab 同行，贴右端。
   sticky 的原因： .dshc-tabs 是 overflow-x:auto 的滚动容器，窄屏下按钮会被滚出视野
   —— 它是常驻入口，不该随 Tab 横向滚动而消失。 */
.dshc-tabadd { position: sticky; right: 0; flex-shrink: 0; align-self: center; margin: 0 0 4px 8px; font: inherit; cursor: pointer; height: 28px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--dsw-alias-button-info-fill,#4176e6); background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-button-info-fill,#4176e6); font-size: 12.5px; font-weight: 500; white-space: nowrap; }
.dshc-tabadd:hover { background: var(--dsw-alias-bg-layer-2,#eef2ff); }
/* 数字排版：等宽数位（tabular-nums）—— 参考实现同款。
   不做等宽时，KPI 与表格里的数字宽度随内容跳动，横排数字对不齐。 */
.dshc-num { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1; letter-spacing: -.02em; }
/* 热力图（GitHub 式）：周为列、周一→周日为行，顶部月份、左侧星期。 */
.dshc-heat-wrap { display: flex; align-items: flex-start; gap: 6px; min-width: 0; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
.dshc-heat-wrap::-webkit-scrollbar { display: none; }
.dshc-heat-days { display: grid; grid-template-rows: repeat(7, 1fr); gap: 3px; font-size: 10.5px; color: var(--dsw-alias-label-tertiary,#8b93a1); }
.dshc-heat-main { min-width: 0; flex: 1 1 auto; }
.dshc-heat-months { display: grid; gap: 3px; height: 13px; margin-bottom: 3px; font-size: 10.5px; color: var(--dsw-alias-label-tertiary,#8b93a1); }
.dshc-heat-months > span { white-space: nowrap; overflow: hidden; }
.dshc-heat { display: grid; grid-auto-flow: column; grid-template-rows: repeat(7, 1fr); gap: 3px; }
.dshc-heat > i { width: 11px; height: 11px; border-radius: 2.5px; display: block; }
.dshc-heat > i.blank { background: transparent; }
.dshc-heat > i:hover { box-shadow: 0 0 0 1px var(--dsw-alias-border-l2,#d5d5d5); }
/* 分位色阶（参考实现的蓝 ramp；深浅主题各一套） */
.dshc-heat > i.h0 { background: var(--dsw-alias-bg-layer-2,#f1f4f9); }
.dshc-heat > i.h1 { background: #dbeafe; }
.dshc-heat > i.h2 { background: #93c5fd; }
.dshc-heat > i.h3 { background: #3b82f6; }
.dshc-heat > i.h4 { background: #1d4ed8; }
body[data-ds-dark-theme] .dshc-heat > i.h0 { background: #1f2937; }
body[data-ds-dark-theme] .dshc-heat > i.h1 { background: #1e3a8a; }
body[data-ds-dark-theme] .dshc-heat > i.h2 { background: #2563eb; }
body[data-ds-dark-theme] .dshc-heat > i.h3 { background: #3b82f6; }
body[data-ds-dark-theme] .dshc-heat > i.h4 { background: #60a5fa; }
.dshc-heat-legend { display: flex; align-items: center; gap: 5px; font-size: 10.5px; color: var(--dsw-alias-label-tertiary,#8b93a1); margin-left: auto; }
.dshc-heat-legend > i { width: 11px; height: 11px; border-radius: 2.5px; display: inline-block; }
/* 入场动效（数字 count-up 由 JS 驱动；此条只为热力图的逐列淡入） */
@keyframes dshc-heat-in { from { opacity: 0 } to { opacity: 1 } }
.dshc-heat > i.anim { animation: dshc-heat-in .45s linear both; }
/* 尊重系统「减少动态效果」：参考实现同款处理 */
@media (prefers-reduced-motion: reduce) {
  .dshc-heat > i.anim { animation: none; }
}
/* 模型环形图 + 排行列表 */
.dshc-models { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
.dshc-donut { flex-shrink: 0; }
.dshc-donut-seg { cursor: pointer; transition: stroke-width .15s; }
.dshc-donut-seg.dim { opacity: .35; }
.dshc-donut-total { fill: var(--dsw-alias-label-primary,currentColor); font-size: 17px; font-weight: 700; }
.dshc-donut-cap { fill: var(--dsw-alias-label-tertiary,#8b93a1); font-size: 10px; }
.dshc-mlist { flex: 1 1 200px; min-width: 180px; }
.dshc-mrow { display: flex; align-items: center; gap: 9px; padding: 6px 2px; font-size: 12px; min-width: 0; }
.dshc-mrow + .dshc-mrow { border-top: 1px solid var(--dsw-alias-border-l2,#f3f4f6); }
.dshc-mrow > i { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.dshc-mname { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-mtok { color: var(--dsw-alias-label-primary,currentColor); font-variant-numeric: tabular-nums; }
.dshc-mpct { width: 52px; text-align: right; color: var(--dsw-alias-label-tertiary,#8b93a1); font-variant-numeric: tabular-nums; }
/* 紧凑段控（窗口 / 指标 / 视图 / 维度切换共用）。
   与 .dshc-viewtoggle 的分工：那一款是「页级」视图切换（较大），本款是页内的
   轻量选择器 —— 边框只有 1px 且无外发光，让内容而非控件成为视觉主角。 */
.dshc-seg { display: inline-flex; align-items: center; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 7px; overflow: hidden; background: var(--dsw-alias-bg-layer-2,#f9fafb); flex-shrink: 0; max-width: 100%; }
.dshc-seg > button { font: inherit; font-size: 12px; line-height: 1; border: none; background: none; color: var(--dsw-alias-label-secondary,#61666b); padding: 5px 9px; cursor: pointer; white-space: nowrap; }
.dshc-seg > button + button { border-left: 1px solid var(--dsw-alias-border-l2,#e5e7eb); }
.dshc-seg > button:hover { color: var(--dsw-alias-label-primary,currentColor); }
.dshc-seg > button.on { background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-brand-primary,#4f6ef7); font-weight: 600; box-shadow: inset 0 -2px 0 var(--dsw-alias-brand-primary,#4f6ef7); }
/* 分析视图选择器（收起态）：标题 + 当前值 + 折叠箭头，整体可点。
   为什么做成「收起」：四个视图是探索型入口，默认铺开会让页面先呈现控件而非数据。 */
.dshc-viewpick { display: inline-flex; align-items: center; gap: 8px; font: inherit; cursor: pointer; border: 1px solid transparent; background: none; border-radius: 7px; padding: 3px 8px; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-viewpick:hover { background: var(--dsw-alias-bg-layer-2,#f3f4f6); border-color: var(--dsw-alias-border-l2,#e5e7eb); }
.dshc-viewpick-cur { font-size: 12px; color: var(--dsw-alias-brand-primary,#4f6ef7); font-weight: 600; }
.dshc-viewpick-caret { font-size: 10.5px; color: var(--dsw-alias-label-tertiary,#8b93a1); }
/* KPI 行（可点击的统计格） */
.dshc-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
@media (max-width: 560px) { .dshc-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.dshc-kpi { border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 10px; background: var(--dsw-alias-bg-layer-1,#fff); padding: 10px 12px; cursor: pointer; text-align: left; font: inherit; min-width: 0; }
/* 渠道三卡 */
.dshc-chancards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
@media (max-width: 560px) { .dshc-chancards { grid-template-columns: 1fr; } }
.dshc-chancard { border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 10px; padding: 12px 14px; background: var(--dsw-alias-bg-layer-1,#fff); min-width: 0; }
.dshc-chancard.dim { opacity: 0.55; }
/* 视图切换（卡片/列表） */
.dshc-viewtoggle { display: inline-flex; border: 1px solid var(--dsw-alias-border-l2,#d1d5db); border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.dshc-viewtoggle > button { font: inherit; border: none; background: var(--dsw-alias-bg-layer-2,#f9fafb); color: var(--dsw-alias-label-secondary,#6b7280); padding: 4px 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
.dshc-viewtoggle > button.on { background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-brand-primary,#4f6ef7); font-weight: 600; }
/* 账号卡片（网格） */
.dshc-acctgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
/* 账号卡：四段式纵向结构（头 / 主数值 / 在途条 / 底行），信息各归其位。
   原先只有两行且右侧挤一行 11px 小字，主体大片留白 —— 改为一列铺满，
   主数值放大占整行，元信息拆到独立底行（字号 11.5px 仍可读）。 */
.dshc-acctcard { display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 10px; padding: 12px 14px; background: var(--dsw-alias-bg-layer-1,#fff); cursor: pointer; min-width: 0; text-align: left; font: inherit; transition: box-shadow .15s, border-color .15s; }
.dshc-acctcard:hover { box-shadow: 0 2px 10px rgba(0,0,0,.08); border-color: var(--dsw-alias-brand-primary,#4f6ef7); }
.dshc-acctcard-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; }
.dshc-acctcard-name { display: inline-flex; align-items: center; gap: 7px; min-width: 0; }
.dshc-acctcard-nametext { font-size: 13px; font-weight: 500; color: var(--dsw-alias-label-primary,currentColor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* 主数值：积分大字独占一行，不再与元信息争宽 */
.dshc-acctcard-credits { display: flex; align-items: baseline; gap: 6px; min-width: 0; flex-wrap: wrap; }
.dshc-acctcard-credits-num { font-size: 22px; font-weight: 600; line-height: 1.15; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-acctcard-credits-unit { font-size: 11.5px; color: var(--dsw-alias-label-tertiary,#8b93a1); }
.dshc-acctcard-expiring { font-size: 11px; color: var(--dsw-alias-state-warn-primary,#b45309); background: var(--dsw-alias-state-warn-tertiary,#fffbeb); border-radius: 999px; padding: 1px 7px; white-space: nowrap; }
/* 余额新鲜度（相对时间）：告诉用户这个积分值有多旧 */
.dshc-acctcard-updated { font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); white-space: nowrap; }
/* 在途占用：轨道 + 填充 + 右标注 */
.dshc-acctcard-bar { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dshc-acctcard-track { flex: 1 1 auto; min-width: 40px; height: 4px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2,#f3f4f6); overflow: hidden; }
.dshc-acctcard-fill { display: block; height: 100%; border-radius: 999px; background: var(--dsw-alias-button-info-fill,#4176e6); transition: width .3s; }
.dshc-acctcard-fill.full { background: var(--dsw-alias-state-warn-primary,#f59e0b); }
.dshc-acctcard-bartext { font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); white-space: nowrap; }
/* 底行：渠道 / 域 / 成败 —— 元信息从「右下角小字」改为独立一行 */
.dshc-acctcard-foot { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; min-width: 0; margin-top: auto; padding-top: 7px; border-top: 1px solid var(--dsw-alias-border-l2,#f3f4f6); }
.dshc-chip { font-size: 11px; line-height: 1.5; padding: 1px 7px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2,#f3f4f6); color: var(--dsw-alias-label-secondary,#6b7280); white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.dshc-chip-dim { color: var(--dsw-alias-label-tertiary,#9ca3af); }
/* 逐账号明细行：**网格固定列**，保证同一列在每行位置一致。
   背景：开学季有 5 行但「每日」标签只 4 行有、成长任务 22 行里出现 3/4/5 个子元素
   三种形态 —— 用 flex 自然排版时缺一列就会让后续列左移，视觉上「错位」。 */
.dshc-srow { display: grid; grid-template-columns: 20px minmax(0, 1fr) 54px 64px max-content; align-items: center; gap: 8px; padding: 3px 0; min-width: 0; }
.dshc-growrow { display: grid; grid-template-columns: 3px minmax(0, 1fr) 54px minmax(74px, auto) max-content 74px; align-items: center; gap: 8px; padding: 3px 0; min-width: 0; }
.dshc-stitle { font-size: 13px; font-weight: 500; color: var(--dsw-alias-label-primary,currentColor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.dshc-sprog { font-family: ui-monospace,Menlo,monospace; font-size: 12px; text-align: right; color: var(--dsw-alias-label-secondary,#6b7280); white-space: nowrap; }
/* 口径异常（上游给「已领取」但进度未满）：加虚线底纹，提示不是面板算错 */
.dshc-sprog.odd { color: var(--dsw-alias-state-warn-primary,#b45309); border-bottom: 1px dotted var(--dsw-alias-state-warn-primary,#b45309); cursor: help; }
.dshc-ssrc { display: flex; align-items: center; gap: 4px; min-width: 0; flex-wrap: wrap; }
.dshc-sact { display: inline-flex; align-items: center; gap: 6px; justify-content: flex-end; }
@media (max-width: 560px) {
  .dshc-srow { grid-template-columns: 20px minmax(0, 1fr) 48px max-content; }
  .dshc-srow > .dshc-ssrc { display: none; }
  .dshc-growrow { grid-template-columns: 3px minmax(0, 1fr) 48px minmax(62px, auto) max-content 70px; }
  .dshc-growrow > .dshc-ssrc { display: none; }
}
/* 账号选择器（逐账号数据卡共用）：只在多账号时渲染 */
.dshc-acctpick { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 10px; min-width: 0; }
.dshc-acctpick-label { font-size: 11.5px; color: var(--dsw-alias-label-tertiary,#8b93a1); margin-right: 2px; }
.dshc-acctpick-btn { font: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2,#d1d5db); background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-label-secondary,#6b7280); font-size: 12px; max-width: 160px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dshc-acctpick-btn.on { border-color: var(--dsw-alias-button-info-fill,#4176e6); color: var(--dsw-alias-button-info-fill,#4176e6); font-weight: 600; background: var(--dsw-alias-bg-layer-2,#eef2ff); }
.dshc-acctpick-btn:hover { border-color: var(--dsw-alias-brand-primary,#4f6ef7); }
/* 卡片标题行：标题 + 右次要信息 + 右动作 */
.dshc-cardhead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
/* 任务磁贴：一行七个（窄屏自动折行），点即触发 */
.dshc-taskgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 8px; }
.dshc-taskgrid-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dshc-tasktile { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 10px; background: var(--dsw-alias-bg-layer-1,#fff); font: inherit; cursor: pointer; text-align: left; min-width: 0; transition: border-color .15s, box-shadow .15s; }
.dshc-tasktile:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary,#4f6ef7); box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.dshc-tasktile:disabled { cursor: default; opacity: .8; }
.dshc-tasktile.failed { border-color: var(--dsw-alias-border-l2,#fecaca); }
.dshc-tasktile-ico { font-size: 15px; line-height: 1.2; }
.dshc-tasktile-name { font-size: 12.5px; font-weight: 500; color: var(--dsw-alias-label-primary,currentColor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.dshc-tasktile-meta { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
/* 任务按钮呼吸态（运行中） */
@keyframes dshc-pulse { 0%, 100% { box-shadow: 0 0 0 0 var(--dsw-alias-button-info-fill,#4176e6); opacity: 1; } 50% { box-shadow: 0 0 0 5px rgba(65,118,230,0); opacity: .75; } }
.dshc-taskbtn.running { animation: dshc-pulse 1.6s ease-in-out infinite; border-color: var(--dsw-alias-button-info-fill,#4176e6); color: var(--dsw-alias-button-info-fill,#4176e6); }
/* 队列进度条 */
.dshc-progress { height: 6px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2,#f3f4f6); overflow: hidden; min-width: 120px; flex-grow: 1; }
.dshc-progress > span { display: block; height: 100%; border-radius: 999px; background: var(--dsw-alias-button-info-fill,#4176e6); transition: width .5s; }
/* 用量时序柱（渐变 + hover） */
.dshc-bars { display: flex; align-items: flex-end; gap: 3px; height: 72px; overflow-x: auto; padding-bottom: 2px; }
.dshc-bars > span { width: 14px; flex-shrink: 0; border-radius: 3px 3px 0 0; background: linear-gradient(180deg, var(--dsw-alias-brand-primary,#4f6ef7), var(--dsw-alias-button-info-fill,#4176e6)); opacity: .85; transition: opacity .15s; cursor: default; }
.dshc-bars > span:hover { opacity: 1; }
.dshc-bars > span.bad { background: linear-gradient(180deg, var(--dsw-alias-state-warn-primary,#f59e0b), var(--dsw-alias-state-error-primary,#dc2626)); }
/* 配置两列网格 */
.dshc-cfggrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 18px; }
@media (max-width: 760px) { .dshc-cfggrid { grid-template-columns: 1fr; } }
.dshc-cfgrow { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 3px 0; }
.dshc-cfgrow > label { flex: none; width: 132px; font-size: 12px; color: var(--dsw-alias-label-secondary,#6b7280); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshc-cfgrow > .dshc-cfgctl { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; }
.dshc-cfgrow.danger > label { color: var(--dsw-alias-state-warn-primary,#b45309); }
/* 详情滑出面板 */
.dshc-drawer-mask { position: fixed; inset: 0; background: rgba(0,0,0,.25); z-index: 9998; }
.dshc-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(480px, 92vw); background: var(--dsw-alias-bg-layer-2,#fff); border-left: 1px solid var(--dsw-alias-border-l2,#e5e7eb); box-shadow: -8px 0 30px rgba(0,0,0,.12); z-index: 9999; padding: 18px 20px; overflow-y: auto; box-sizing: border-box; }
.dshc-drawer-close { position: absolute; top: 12px; right: 14px; border: none; background: none; cursor: pointer; font: inherit; font-size: 16px; color: var(--dsw-alias-label-tertiary,#8b93a1); padding: 4px; }
.dshc-drawer-close:hover { color: var(--dsw-alias-label-primary,currentColor); }
/* 居中弹窗（添加账号）：与抽屉同层叠顺序；高度受限内部滚动 */
.dshc-dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(520px, 92vw); max-height: 88vh; overflow-y: auto; background: var(--dsw-alias-bg-layer-2,#fff); border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,.18); z-index: 9999; padding: 20px 22px; box-sizing: border-box; }
/* 单选药丸（渠道 / 域） */
.dshc-choice { font: inherit; cursor: pointer; display: inline-flex; align-items: baseline; gap: 5px; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2,#d1d5db); background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-label-secondary,#6b7280); font-size: 12.5px; }
.dshc-choice.on { border-color: var(--dsw-alias-button-info-fill,#4176e6); color: var(--dsw-alias-button-info-fill,#4176e6); font-weight: 600; background: var(--dsw-alias-bg-layer-2,#eef2ff); }
.dshc-choice:disabled { cursor: default; opacity: .8; }
.dshc-choice-note { font-size: 10.5px; color: var(--dsw-alias-label-tertiary,#9ca3af); }
/* 通用旋转（刷新按钮图标等） */
.dshc-spin { display: inline-flex; animation: dshc-spin .8s linear infinite; }
/* 等待授权的小转圈 */
@keyframes dshc-spin { to { transform: rotate(360deg); } }
.dshc-spinner { width: 14px; height: 14px; flex-shrink: 0; border-radius: 50%; border: 2px solid var(--dsw-alias-border-l2,#e5e7eb); border-top-color: var(--dsw-alias-button-info-fill,#4176e6); animation: dshc-spin .8s linear infinite; }
/* ══════════ 用量图表（纯内联 SVG + CSS 变量） ══════════════════════════════
   关键约束（原型实测）：**SVG 的 fill/stroke 不写 var()**。
   presentation attribute 里写 var() 在部分浏览器不解析 → 一律挂 class，
   颜色由这里决定。切主题只换变量，SVG 无需重渲染。 */
.dshc-uchart { position: relative; min-width: 0; }
.dshc-uchart > svg { display: block; width: 100%; overflow: visible; }
.dshc-uchart .grid { stroke: var(--dsw-alias-border-l2,#e5e7eb); stroke-dasharray: 2 3; stroke-width: 1; }
.dshc-uchart .axt { fill: var(--dsw-alias-label-tertiary,#8b93a1); font-size: 10.5px; }
.dshc-uchart .axt.warn { fill: var(--dsw-alias-state-warn-primary,#b45309); }
.dshc-uchart .axt.err { fill: var(--dsw-alias-state-error-primary,#dc2626); }
/* 面积 + 折线（主图） */
.dshc-uchart .area-main { fill: url(#dshcAreaMain); }
.dshc-uchart .area-fail { fill: url(#dshcAreaFail); }
.dshc-uchart .line-main { fill: none; stroke: var(--dsw-alias-brand-primary,#4f6ef7); stroke-width: 2; stroke-linejoin: round; }
/* 柱 + 折线（双轴） */
.dshc-uchart .bar-main { fill: url(#dshcBarMain); }
.dshc-uchart .bar-main.bad { fill: url(#dshcBarBad); }
.dshc-uchart .line-credit { fill: none; stroke: var(--dsw-alias-state-warn-primary,#f59e0b); stroke-width: 2; }
.dshc-uchart .dot-credit { fill: var(--dsw-alias-bg-layer-1,#fff); stroke: var(--dsw-alias-state-warn-primary,#f59e0b); stroke-width: 2; }
/* 燃尽投影 */
.dshc-uchart .area-burn { fill: url(#dshcAreaBurn); }
.dshc-uchart .line-burn { fill: none; stroke: var(--dsw-alias-label-secondary,#61666b); stroke-width: 2; stroke-linejoin: round; }
.dshc-uchart .line-proj { fill: none; stroke: var(--dsw-alias-state-warn-primary,#f59e0b); stroke-width: 2; stroke-dasharray: 5 4; }
.dshc-uchart .dot-die { fill: var(--dsw-alias-bg-layer-1,#fff); stroke: var(--dsw-alias-state-error-primary,#dc2626); stroke-width: 2.5; }
/* 日槽区底纹（无小时维度，必须视觉上区分） */
.dshc-uchart .dayband { fill: var(--dsw-alias-label-tertiary,#8b93a1); opacity: .07; }
.dshc-uchart .slotdiv { stroke: var(--dsw-alias-border-l2,#e5e7eb); stroke-dasharray: 3 3; stroke-width: 1; }
/* 堆叠面积 */
.dshc-uchart .seg { stroke: var(--dsw-alias-bg-layer-1,#fff); stroke-width: .6; }
/* hover 十字线 / 圆点 / 提示 */
.dshc-ucross { position: absolute; top: 0; width: 1px; background: var(--dsw-alias-brand-primary,#4f6ef7); opacity: .45; pointer-events: none; display: none; }
.dshc-udot { position: absolute; width: 9px; height: 9px; border-radius: 50%; background: var(--dsw-alias-bg-layer-1,#fff); border: 2px solid var(--dsw-alias-brand-primary,#4f6ef7); transform: translate(-50%,-50%); pointer-events: none; display: none; }
.dshc-utip { position: absolute; z-index: 6; pointer-events: none; background: var(--dsw-alias-bg-layer-1,#fff); border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 8px; padding: 7px 9px; box-shadow: 0 6px 20px rgba(0,0,0,.16); font-size: 11.5px; white-space: nowrap; line-height: 1.65; color: var(--dsw-alias-label-primary,currentColor); }
/* 环形百分比 */
.dshc-uring { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 8px; }
@media (max-width: 560px) { .dshc-uring { grid-template-columns: 1fr; } }
.dshc-uring > div { border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 10px; background: var(--dsw-alias-bg-layer-1,#fff); padding: 12px 14px; text-align: center; min-width: 0; }
.dshc-uring svg { display: block; margin: 0 auto; }
.dshc-uring .rv { font-size: 17px; font-weight: 600; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-uring .rl { font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); margin-top: 2px; }
.dshc-uring .track { fill: none; stroke: var(--dsw-alias-bg-layer-2,#f3f4f6); stroke-width: 7; }
.dshc-uring .arc { fill: none; stroke-width: 7; stroke-linecap: round; transform: rotate(-90deg); transform-origin: center; }
.dshc-uring .arc.ok { stroke: var(--dsw-alias-state-success-primary,#22c55e); }
.dshc-uring .arc.brand { stroke: var(--dsw-alias-brand-primary,#4f6ef7); }
.dshc-uring .arc.warn { stroke: var(--dsw-alias-state-warn-primary,#f59e0b); }
/* Token 结构条 */
.dshc-ustack { display: flex; height: 14px; border-radius: 4px; overflow: hidden; background: var(--dsw-alias-bg-layer-2,#f3f4f6); }
.dshc-ustack > i { display: block; height: 100%; }
/* 英雄区 */
.dshc-uhero { display: grid; grid-template-columns: minmax(0,1.55fr) minmax(0,1fr); gap: 10px; }
@media (max-width: 820px) { .dshc-uhero { grid-template-columns: 1fr; } }
.dshc-ustock { border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 10px; background: var(--dsw-alias-bg-layer-1,#fff); padding: 12px 14px; min-width: 0; }
.dshc-ustock .big { font-size: 26px; font-weight: 700; line-height: 1.2; color: var(--dsw-alias-state-success-primary,#059669); }
.dshc-uchans { display: flex; margin-top: 10px; border-top: 1px solid var(--dsw-alias-border-l2,#e5e7eb); padding-top: 8px; }
.dshc-uchans > div { flex: 1; min-width: 0; text-align: center; border-right: 1px solid var(--dsw-alias-border-l2,#e5e7eb); }
.dshc-uchans > div:last-child { border-right: 0; }
.dshc-uchans .n { font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); }
.dshc-uchans .c { font-size: 15px; font-weight: 600; color: var(--dsw-alias-label-primary,currentColor); }
/* 占比条 */
.dshc-ushare { display: inline-block; height: 6px; border-radius: 999px; background: var(--dsw-alias-brand-primary,#4f6ef7); opacity: .85; vertical-align: middle; }
/* 时段热力 */
.dshc-uheat { display: grid; gap: 2px; min-width: 0; }
.dshc-uheat .hl { font-size: 10px; color: var(--dsw-alias-label-tertiary,#8b93a1); line-height: 14px; white-space: nowrap; }
.dshc-uheat i { height: 14px; border-radius: 2px; background: var(--dsw-alias-brand-primary,#4f6ef7); display: block; }
.dshc-uheat i.zero { background: var(--dsw-alias-bg-layer-2,#f3f4f6); opacity: 1 !important; }
`;

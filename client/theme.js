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
    bg: 'var(--dsw-alias-state-business-tertiary,#e4edfd)',
  },
  idle: {
    fg: 'var(--dsw-alias-label-secondary,#6b7280)',
    bg: 'var(--dsw-alias-bg-layer-2,#f3f4f6)',
  },
};

/**
 * 文本三阶（标题 / 正文 / 说明）—— 统一字体层级的单一事实来源。
 * 全部走 DSH label-primary/secondary/tertiary 变量，浅/深主题自适应，不硬编码。
 * 用 `type.text.heading` / `type.text.body` / `type.text.caption` 取代散落的
 * `s.muted`（说明）与无措辞的 fontSize 硬拼。
 */
export const type = {
  /** 字号分档：H1 20 / H2 15 / body 13 / caption 12 / micro 11。 */
  size: {
    h1: 20,
    h2: 15,
    h3: 13,
    body: 13,
    caption: 12,
    micro: 11,
  },
  text: {
    heading: { color: 'var(--dsw-alias-label-primary,currentColor)', fontSize: 15, fontWeight: 600, lineHeight: 1.4 },
    body: { color: 'var(--dsw-alias-label-primary,currentColor)', fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
    secondary: { color: 'var(--dsw-alias-label-secondary,#6b7280)', fontSize: 12, fontWeight: 400, lineHeight: 1.5 },
    caption: { color: 'var(--dsw-alias-label-tertiary,#8b93a1)', fontSize: 11, fontWeight: 400, lineHeight: 1.5 },
    code: {
      fontFamily: 'ui-monospace,Menlo,monospace',
      fontSize: 12,
      fontWeight: 400,
      wordBreak: 'break-all',
      color: 'var(--dsw-alias-label-primary,currentColor)',
    },
    num: {
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '-.01em',
      color: 'var(--dsw-alias-label-primary,currentColor)',
    },
    link: { color: 'var(--dsw-alias-brand-primary,#4f6ef7)', fontSize: 12, fontWeight: 500, textDecoration: 'none' },
  },
  /** KPI 主数值：统一给语义色（ok 绿 / warn 橙 / danger 红 / info 蓝 / idle 灰）。 */
  kpi: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-.02em',
    fontVariantNumeric: 'tabular-nums',
  },
};

/**
 * 图表序列色板（堆叠柱 / 模型占比 / 排行共用的固定商务色序）。
 * 同模型跨图表必须同色，故用固定 hex（不在 DSH 主题变量内，避免深浅主题下
 * 同一模型忽蓝忽红）。
 *
 * **7 色，且刻意不含三个渠道识别色**（`#4f6ef7` 蓝 / `#a855f7` 紫 / `#06b6d4` 青）：
 * 渠道维度一律走 `channelPalette()`（唯一色源），分类色板让位给它，避免出现
 * 「某渠道 = 蓝，某模型也 = 蓝」的同色不同义。
 */
export const SEG_COLORS = [
  '#10b981', // 翠绿
  '#f59e0b', // 琥珀
  '#ef4444', // 红
  '#84cc16', // 黄绿
  '#ec4899', // 玫红
  '#14b8a6', // 蓝绿
  '#6366f1', // 靛
];

/**
 * 语义色板（界面 / 状态 / KPI 高亮）：6 语义 × {fg,bg}，全走 DSH 变量自适应。
 * 与 `tone` 同源但在语义命名上更完整（supportsSuccess/…），供跨 Tab 统一取色。
 */
export const semantic = {
  accent: { fg: 'var(--dsw-alias-state-business-primary,#4176e6)', bg: 'var(--dsw-alias-state-business-tertiary,#e4edfd)' },
  success: { fg: 'var(--dsw-alias-state-success-primary,#059669)', bg: 'var(--dsw-alias-state-success-tertiary,#ecfdf5)' },
  warning: { fg: 'var(--dsw-alias-state-warn-primary,#b45309)', bg: 'var(--dsw-alias-state-warn-tertiary,#fffbeb)' },
  danger: { fg: 'var(--dsw-alias-state-error-primary,#dc2626)', bg: 'var(--dsw-alias-interactive-bg-hover-danger,#fef2f2)' },
  info: { fg: 'var(--dsw-alias-button-info-fill,#4176e6)', bg: 'var(--dsw-alias-state-business-tertiary,#e4edfd)' },
  neutral: { fg: 'var(--dsw-alias-label-secondary,#6b7280)', bg: 'var(--dsw-alias-bg-layer-2,#f3f4f6)' },
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
/* 渠道三卡（当前可用积分：WB / Trae / Qoder） */
.dshc-chancards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
@media (max-width: 560px) { .dshc-chancards { grid-template-columns: 1fr; } }
.dshc-chancard { border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-left: 3px solid var(--dshc-chan, var(--dsw-alias-border-l2,#e5e7eb)); border-radius: 10px; padding: 12px 14px; background: var(--dsw-alias-bg-layer-1,#fff); min-width: 0; }
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
.dshc-acctcard { display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-left: 3px solid var(--dshc-chan, var(--dsw-alias-border-l2,#e5e7eb)); border-radius: 10px; padding: 12px 14px; background: var(--dsw-alias-bg-layer-1,#fff); cursor: pointer; min-width: 0; text-align: left; font: inherit; transition: box-shadow .15s, border-color .15s; }
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
/* 到期临近 / 已过期：唯一需要抢注意力的元信息，故用警示底而非灰底 */
.dshc-chip-warn { background: var(--dsw-alias-state-warn-tertiary,#fffbeb); color: var(--dsw-alias-state-warn-primary,#b45309); }
/* 逐账号明细行：**网格固定列**，保证同一列在每行位置一致。
   背景：同一张表里各行的可选子元素数量不等（有的行有「每日」标签、有的没有），
   用 flex 自然排版时缺一列就会让后续列左移，视觉上「错位」。 */
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
/* ══════════ 用量页 v4（单页卡片流，参考 AlfredChaos/dsh-usage-panel） ══════════
   两条硬约束（都是原型/真机上踩出来的，别回退）：

   1. **SVG 的 fill/stroke 不写 var()**。presentation attribute 里的 var()
      在部分浏览器不解析 → 静态色一律挂 class（下面 .dshc-ust-svg 子树），
      动态色（模型分色）走 'style'（CSS 属性，var() 可解析）。

   2. **卡片用 bg-layer-1（白）浮在灰页面上**。参考实现同款；用 layer-2
      （比页面更暗）会让卡片「后退」，整页发闷。 */
.dshc-ust-root { position: relative; display: flex; flex-direction: column; gap: 14px; min-width: 0; }

/* ── 页头：标题 + 四态副标题 + 导出 + 刷新 ── */
.dshc-ust-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; min-width: 0; }
.dshc-ust-headtitle { min-width: 0; }
.dshc-ust-head h2 { margin: 0; font-size: 16px; font-weight: 650; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-ust-sub { margin-top: 3px; font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); }
/* 失败态用警示色 —— 「显示的是旧数据」必须一眼可见，不能只靠一行小字 */
.dshc-ust-sub[data-freshness="fallback"], .dshc-ust-sub[data-freshness="error"] { color: var(--dsw-alias-state-warn-primary,#b45309); }
.dshc-ust-headactions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.dshc-ust-refresh { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-label-primary,currentColor); border-radius: 8px; padding: 6px 11px; font: inherit; font-size: 12px; cursor: pointer; }
.dshc-ust-refresh:hover { border-color: var(--dsw-alias-border-l2,#d1d5db); }
.dshc-ust-refresh:disabled { opacity: .55; cursor: default; }

/* ── 导出菜单（纯客户端构建，不新增端点） ── */
.dshc-ust-export { position: relative; }
.dshc-ust-exportbtn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-label-primary,currentColor); border-radius: 8px; padding: 6px 11px; font: inherit; font-size: 12px; cursor: pointer; }
.dshc-ust-exportmenu { position: absolute; right: 0; top: calc(100% + 4px); min-width: 150px; background: var(--dsw-alias-bg-layer-1,#fff); border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 8px; padding: 4px; box-shadow: 0 4px 16px rgba(0,0,0,.12); z-index: 9000; }
.dshc-ust-exportmenu button { display: block; width: 100%; text-align: left; border: none; background: transparent; color: var(--dsw-alias-label-primary,currentColor); font: inherit; font-size: 12px; padding: 7px 10px; border-radius: 6px; cursor: pointer; }
.dshc-ust-exportmenu button:hover { background: var(--dsw-alias-bg-layer-2,#f7f8fa); }

/* ── 卡片外壳 ── */
.dshc-ust-card { background: var(--dsw-alias-bg-layer-1,#fff); border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 12px; padding: 14px 16px; min-width: 0; }
.dshc-ust-cardhead { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.dshc-ust-cardtitle { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.dshc-ust-cardtitle h3 { margin: 0; font-size: 13px; font-weight: 600; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-ust-cardsub { font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); }
.dshc-ust-cardactions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dshc-ust-cardfoot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px; flex-wrap: wrap; }
.dshc-ust-hint { font-size: 10.5px; color: var(--dsw-alias-label-tertiary,#8b93a1); cursor: help; }
.dshc-ust-subblock { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--dsw-alias-border-l2,#e5e7eb); }
.dshc-ust-empty { padding: 26px 8px; text-align: center; color: var(--dsw-alias-label-tertiary,#8b93a1); font-size: 12px; line-height: 1.8; }
.dshc-ust-empty-title { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary,currentColor); margin-bottom: 4px; }

/* ── 口径标注行（窗口 / 进程两个口径各自留痕） ── */
.dshc-ust-kpihead { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.dshc-ust-scope { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
.dshc-ust-scope-tag { font-size: 10px; letter-spacing: .03em; padding: 2px 7px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2,#f3f4f6); color: var(--dsw-alias-label-secondary,#6b7280); flex-shrink: 0; }

/* ── ① KPI 6 卡：主数字 + 一行次级文字 ──
   参考实现的 kpi 卡：数值 19px/700/负字距/等宽数位，次级文字 11px。
   固定 3 列（auto-fit 会在宽屏排成 4 列，把「三消耗 + 三效率」的两行语义
   切成 4+2，读的时候就不成组了）；窄屏降 2 列、再窄 1 列。 */
.dshc-ust-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
@media (max-width: 640px) { .dshc-ust-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 400px) { .dshc-ust-kpis { grid-template-columns: 1fr; } }
.dshc-ust-kpi { background: var(--dsw-alias-bg-layer-1,#fff); border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 12px; padding: 13px 15px; min-width: 0; }
.dshc-ust-kpi-k { font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dshc-ust-kpi-v { margin-top: 7px; font-size: 19px; font-weight: 700; line-height: 1.2; letter-spacing: -.02em; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-primary,currentColor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshc-ust-kpi-d { margin-top: 4px; font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── ② 活跃热力图（GitHub 布局：周为列、周一→周日为行） ── */
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
.dshc-ust-heat-legend { display: flex; align-items: center; gap: 5px; font-size: 10.5px; color: var(--dsw-alias-label-tertiary,#8b93a1); }
.dshc-ust-heat-legend > i { width: 11px; height: 11px; border-radius: 2.5px; display: inline-block; }
.dshc-ust-heat-legend > i.h0 { background: var(--dsw-alias-bg-layer-2,#f1f4f9); }
.dshc-ust-heat-legend > i.h1 { background: #dbeafe; }
.dshc-ust-heat-legend > i.h2 { background: #93c5fd; }
.dshc-ust-heat-legend > i.h3 { background: #3b82f6; }
.dshc-ust-heat-legend > i.h4 { background: #1d4ed8; }
body[data-ds-dark-theme] .dshc-ust-heat-legend > i.h0 { background: #1f2937; }
body[data-ds-dark-theme] .dshc-ust-heat-legend > i.h1 { background: #1e3a8a; }
body[data-ds-dark-theme] .dshc-ust-heat-legend > i.h2 { background: #2563eb; }
body[data-ds-dark-theme] .dshc-ust-heat-legend > i.h3 { background: #3b82f6; }
body[data-ds-dark-theme] .dshc-ust-heat-legend > i.h4 { background: #60a5fa; }
/* 时段分布条（24 小时）：**与热力分位色阶同源**。
   此前用 --dsw-alias-brand-primary 单色（#4f6ef7），与正上方图例的蓝 ramp
   (#dbeafe→#1d4ed8) 不是一套 —— 同一张卡里两种蓝，用户读成「颜色不对」。
   现在按同一 h0..h4 分位级上色，图例直接解释这张图。 */
.dshc-ust-hourbar { display: flex; align-items: flex-end; gap: 3px; height: 56px; }
.dshc-ust-hourbar > span { flex: 1 1 0; min-width: 0; display: block; border-radius: 2px 2px 0 0; }
.dshc-ust-hourbar > span:hover { box-shadow: 0 0 0 1px var(--dsw-alias-border-l2,#d5d5d5); }
.dshc-ust-hourbar > span.h0 { background: var(--dsw-alias-bg-layer-2,#f1f4f9); }
.dshc-ust-hourbar > span.h1 { background: #dbeafe; }
.dshc-ust-hourbar > span.h2 { background: #93c5fd; }
.dshc-ust-hourbar > span.h3 { background: #3b82f6; }
.dshc-ust-hourbar > span.h4 { background: #1d4ed8; }
body[data-ds-dark-theme] .dshc-ust-hourbar > span.h0 { background: #1f2937; }
body[data-ds-dark-theme] .dshc-ust-hourbar > span.h1 { background: #1e3a8a; }
body[data-ds-dark-theme] .dshc-ust-hourbar > span.h2 { background: #2563eb; }
body[data-ds-dark-theme] .dshc-ust-hourbar > span.h3 { background: #3b82f6; }
body[data-ds-dark-theme] .dshc-ust-hourbar > span.h4 { background: #60a5fa; }
.dshc-ust-hourfoot { display: flex; justify-content: space-between; margin-top: 4px; }
/* 入场动效（逐列延迟的淡入） */
@keyframes dshc-heat-in { from { opacity: 0 } to { opacity: 1 } }
.dshc-heat > i.anim { animation: dshc-heat-in .45s linear both; }
@media (prefers-reduced-motion: reduce) {
  .dshc-heat > i.anim { animation: none; }
}

/* ── ③ 每日用量 SVG（柱状堆叠 + 燃尽） ──
   静态色全在这里：见本段开头的约束 1。 */
.dshc-ust-svg { display: block; width: 100%; height: auto; overflow: visible; }
.dshc-ust-svg .grid { stroke: var(--dsw-alias-border-l2,#e5e7eb); stroke-dasharray: 3 3; stroke-width: 1; }
.dshc-ust-svg .grid.base { stroke-dasharray: none; }
.dshc-ust-svg .axt { fill: var(--dsw-alias-label-tertiary,#8b93a1); font-size: 10.5px; }
.dshc-ust-svg .axt.err { fill: var(--dsw-alias-state-error-primary,#dc2626); }
.dshc-ust-svg .floor { stroke: var(--dsw-alias-state-error-primary,#dc2626); stroke-width: 1; opacity: .5; }
.dshc-ust-svg .nowline { stroke: var(--dsw-alias-label-secondary,#6b7280); stroke-width: 1; opacity: .4; }
.dshc-ust-svg .area-burn { fill: var(--dsw-alias-state-error-primary,#dc2626); opacity: .14; }
.dshc-ust-svg .line-burn { fill: none; stroke: var(--dsw-alias-label-secondary,#61666b); stroke-width: 2; stroke-linejoin: round; }
.dshc-ust-svg .line-proj { fill: none; stroke: var(--dsw-alias-state-warn-primary,#f59e0b); stroke-width: 2; stroke-dasharray: 5 4; }
.dshc-ust-svg .dot-die { fill: var(--dsw-alias-bg-layer-1,#fff); stroke: var(--dsw-alias-state-error-primary,#dc2626); stroke-width: 2.5; }
.dshc-ust-svg .zero { fill: var(--dsw-alias-border-l2,#e5e7eb); }
/* 柱状入场：从底部长起（transform-origin 必须配 transform-box，否则以视口原点缩放） */
.dshc-ust-bar-seg { transform-box: fill-box; transform-origin: bottom; animation: dshc-ust-bar-grow .7s cubic-bezier(.16,1,.3,1) both; }
@keyframes dshc-ust-bar-grow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@media (prefers-reduced-motion: reduce) { .dshc-ust-bar-seg { animation: none; } }
/* 图例即明细：色块 + 名称 + 值 + 占比（借参考实现的 grid 1fr auto auto） */
.dshc-ust-legend { display: flex; flex-direction: column; gap: 2px; margin-top: 10px; }
.dshc-ust-legend-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 12px; align-items: center; padding: 4px 6px; border-radius: 6px; font-size: 12px; }
.dshc-ust-legend-row:hover { background: var(--dsw-alias-bg-layer-2,#f7f8fa); }
.dshc-ust-legend-name { display: inline-flex; align-items: center; gap: 8px; min-width: 0; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-ust-legend-name > i { width: 10px; height: 10px; border-radius: 3px; flex: none; display: inline-block; }
.dshc-ust-legend-name > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshc-ust-legend-val { font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-secondary,#61666b); white-space: nowrap; }
.dshc-ust-legend-pct { min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-tertiary,#8b93a1); white-space: nowrap; }

/* ── ④ 账号排行 / ⑤ 渠道用量（两列并排） ──
   名字定宽 + 4px 细条 + 右对齐占比 —— 一屏能排 8 行还不显挤。
   条长按**相对最大值**归一：各项接近时用绝对占比会让所有条一样长。 */
/* 三张卡片（账号 / 渠道 / 消费者）用 auto-fit 而不是写死 2 列：
   写死 2 列时第三张会孤零零折到第二行左侧，看起来像布局坏了。
   auto-fit + minmax 让它按实际宽度自适应（宽屏 3 列、中屏 2 列、窄屏 1 列）。 */
.dshc-ust-rank { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; }
@media (max-width: 760px) { .dshc-ust-rank { grid-template-columns: 1fr; } }
.dshc-ust-rank-row { display: flex; align-items: center; gap: 10px; font-size: 12px; padding: 4px 0; min-width: 0; }
.dshc-ust-rank-row + .dshc-ust-rank-row { border-top: 1px solid var(--dsw-alias-border-l2,#f3f4f6); }
.dshc-ust-rank-no { flex: none; width: 16px; color: var(--dsw-alias-label-tertiary,#8b93a1); font-variant-numeric: tabular-nums; font-size: 11px; }
.dshc-ust-rank-name { flex: none; width: 104px; display: inline-flex; align-items: center; gap: 6px; min-width: 0; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-ust-rank-name > span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.dshc-ust-rank-bar { flex: 1; height: 4px; border-radius: 2px; background: var(--dsw-alias-bg-layer-2,#f1f3f6); overflow: hidden; min-width: 28px; }
.dshc-ust-rank-bar > i { display: block; height: 100%; border-radius: 2px; background: var(--dsw-alias-brand-primary,#4f6ef7); }
/* 占比一位小数（「100.0%」6 字符）→ 定宽 44px 会挤到换行/溢出，故放宽到 52px
   并禁止换行：三张卡共用这一列，一起改才不会左右不齐。 */
.dshc-ust-rank-val { flex: none; width: 52px; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-tertiary,#8b93a1); }
@media (max-width: 560px) { .dshc-ust-rank-name { width: 84px; } }

/* ── 消费者（API key）选择器：把整页收窄到一把 key ──
   复用 .dshc-seg 的视觉（与窗口/维度切换同族），只加一层横向滚动：
   key 数量不定，窄屏必须能滑，不能把页面撑宽。 */
.dshc-ust-keyscope { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 2px 0 10px; min-width: 0; }
.dshc-ust-keyscope-label { flex: none; font-size: 12px; color: var(--dsw-alias-label-tertiary,#8b93a1); }
.dshc-ust-keyscope-seg { overflow-x: auto; overflow-y: hidden; max-width: 100%; }
/* flex: none 是这条的关键：默认 flex-shrink:1 会让按钮被**压扁**（内容互相盖住），
   而不是把容器撑出滚动条 —— 真机上 10 个按钮挤在 564px 里就是这个现象。 */
.dshc-ust-keyscope-seg > button { flex: none; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
.dshc-ust-keyscope-note { font-size: 12px; color: var(--dsw-alias-label-tertiary,#8b93a1); }

/* ── ⑥ 模型占比环形图 + 列表 ── */
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

/* ── 进程口径折叠区：逐模型行（成本优先） ── */
.dshc-mrow2 { padding: 8px 0; min-width: 0; }
.dshc-mrow2 + .dshc-mrow2 { border-top: 1px solid var(--dsw-alias-border-l2,#f3f4f6); }
.dshc-mrow2-top { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dshc-mrow2-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace,Menlo,monospace; font-size: 12.5px; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-mrow-detail { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 4px; font-size: 10.5px; color: var(--dsw-alias-label-tertiary,#8b93a1); font-variant-numeric: tabular-nums; }
.dshc-more { font: inherit; cursor: pointer; border: none; background: none; color: var(--dsw-alias-brand-primary,#4f6ef7); font-size: 11.5px; padding: 6px 0 0; }
.dshc-more:hover { text-decoration: underline; }

/* ── 结构化 tooltip（fixed 定位；参考实现的 tooltip 样式） ── */
.dshc-ust-tooltip { position: fixed; left: 0; top: 0; transform: translate(-50%, -110%); background: var(--dsw-alias-bg-layer-1,#fff); border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); color: var(--dsw-alias-label-primary,currentColor); padding: 5px 10px; border-radius: 6px; font-size: 11px; white-space: nowrap; pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,.06); opacity: 0; transition: opacity .1s; z-index: 9999; }
.dshc-ust-tooltip.show { opacity: 1; }
.dshc-ust-tooltip-title { font-size: 11px; font-weight: 600; margin-bottom: 4px; white-space: nowrap; }
.dshc-ust-tooltip-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--dsw-alias-label-secondary,#6b7280); white-space: nowrap; line-height: 1.6; }
.dshc-ust-tooltip-row i { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
.dshc-ust-tooltip-label { flex: 1; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-ust-tooltip-value { color: var(--dsw-alias-label-primary,currentColor); font-variant-numeric: tabular-nums; }

/* ── 模型 Tab（结论条 / 筛选条 / 分组表格） ──
   设计语言与其他页面同源：卡片用 layer-1（白）浮在灰页面上（s.card 的注释：用
   layer-2 会让卡片「后退、整页发闷」）；按钮走 s.btnPri / s.btnGhost（32px 高、
   999 圆角、13px）；筛选 chip 对齐用量页 .dshc-seg 的形态（26px 高、12px、选中态
   白底 + 品牌色描边）；数字一律 tabular-nums；颜色只走 --dsw-alias-* 语义 token。 */
/* 结论条：两段式结构（上=规模数字 + 主按钮；下=次级动作，1px 分隔）。
   为什么分段而不是一个大 flex-wrap：窄面板（内容区实测 558px）里 6 个按钮必然换行，
   平铺换行看起来像"挤在一起"，分段后换行也是有意为之的结构。 */
.dshc-ma-head { display: flex; flex-direction: column; gap: 12px; padding: 13px 16px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 12px; background: var(--dsw-alias-bg-layer-1,#fff); }
.dshc-ma-head-top { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.dshc-ma-head-primary { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.dshc-ma-stats { display: flex; align-items: center; flex-wrap: wrap; min-width: 0; }
/* 统计块之间用 1px 竖线分隔（与概览卡「渠道竖排 + 竖线」同一手法），
   比一排胶囊安静，也更像仪表盘。 */
.dshc-ma-stat { display: flex; flex-direction: column; gap: 1px; padding: 0 14px; border-right: 1px solid var(--dsw-alias-border-l2,#eef0f3); }
.dshc-ma-stat:first-child { padding-left: 0; }
.dshc-ma-stat:last-child { border-right: none; }
.dshc-ma-stat-v { font-size: 16px; font-weight: 600; line-height: 1.25; font-variant-numeric: tabular-nums; letter-spacing: -.01em; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-ma-stat-k { font-size: 10.5px; line-height: 1.3; color: var(--dsw-alias-label-tertiary,#8b93a1); white-space: nowrap; }
.dshc-ma-head-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid var(--dsw-alias-border-l2,#eef0f3); }
.dshc-ma-more { display: flex; flex-direction: column; gap: 10px; padding: 13px 16px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 12px; background: var(--dsw-alias-bg-layer-1,#fff); }
.dshc-ma-filter { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dshc-ma-searchwrap { position: relative; display: inline-flex; align-items: center; flex: 1 1 200px; max-width: 320px; }
.dshc-ma-searchicon { position: absolute; left: 9px; font-size: 13px; line-height: 1; color: var(--dsw-alias-label-tertiary,#8b93a1); pointer-events: none; }
.dshc-ma-searchwrap > input.dshc-ma-search { font: inherit; font-size: 12px; height: 28px; width: 100%; padding: 0 10px 0 26px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); background: var(--dsw-alias-bg-layer-2,#f9fafb); color: var(--dsw-alias-label-primary,currentColor); box-sizing: border-box; }
.dshc-ma-searchwrap > input.dshc-ma-search:focus { outline: none; border-color: var(--dsw-alias-brand-primary,#4f6ef7); background: var(--dsw-alias-bg-layer-1,#fff); }
.dshc-ma-chip { font: inherit; cursor: pointer; height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); background: var(--dsw-alias-bg-layer-2,#f9fafb); color: var(--dsw-alias-label-secondary,#61666b); font-size: 12px; line-height: 1; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
.dshc-ma-chip > i { font-style: normal; font-size: 11px; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-tertiary,#8b93a1); }
.dshc-ma-chip:hover { color: var(--dsw-alias-label-primary,currentColor); border-color: var(--dsw-alias-border-l2,#d1d5db); }
/* 选中态用 is-on 而不是 on：宿主有一条全局 button.on 规则（brand 底 + 白字），
   在暗色主题下 --dsw-alias-brand-primary 本身就是近白（#f9fafb），于是"白底白字"
   完全看不见（真机实测确认）。换名字比堆 specificity 干净，也不会再撞别的全局类。 */
.dshc-ma-chip.is-on { background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-brand-primary,#4f6ef7); border-color: var(--dsw-alias-brand-primary,#4f6ef7); font-weight: 600; }
.dshc-ma-chip.is-on > i { color: var(--dsw-alias-brand-primary,#4f6ef7); opacity: .75; }
.dshc-ma-chip.clear { border-style: dashed; color: var(--dsw-alias-label-tertiary,#8b93a1); }
.dshc-ma-count { margin-left: auto; white-space: nowrap; }
/* 滚动容器 + 吸顶表头：110 行不该把整页撑爆，滚到哪儿都知道在看哪一列 */
.dshc-ma-scroll { max-height: 62vh; overflow: auto; }
.dshc-ma-scroll thead th { position: sticky; top: 0; z-index: 2; }
.dshc-ma-scroll tbody tr { height: 34px; }
.dshc-ma-scroll tbody tr:hover > td { background: var(--dsw-alias-interactive-bg-hover,#f7f8fa); }
.dshc-ma-scroll tbody tr.dshc-ma-group:hover > td { background: var(--dsw-alias-bg-layer-2,#f3f4f6); }
.dshc-ma-group > td { background: var(--dsw-alias-bg-layer-2,#f3f4f6); border-bottom: 1px solid var(--dsw-alias-border-l2,#e5e7eb); }
.dshc-ma-grouptoggle { font: inherit; cursor: pointer; border: none; background: none; padding: 0; font-size: 12px; font-weight: 600; letter-spacing: -.01em; font-family: ui-monospace,Menlo,monospace; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-ma-grouptoggle:hover { color: var(--dsw-alias-brand-primary,#4f6ef7); }
.dshc-ma-notes > summary { cursor: pointer; font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); }
.dshc-ma-notes > p { margin: 6px 0 0; }

/* ── 结构化 tooltip（fixed 定位；参考实现的 tooltip 样式） ── */
.dshc-ust-tooltip { position: fixed; left: 0; top: 0; transform: translate(-50%, -110%); background: var(--dsw-alias-bg-layer-1,#fff); border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); color: var(--dsw-alias-label-primary,currentColor); padding: 5px 10px; border-radius: 6px; font-size: 11px; white-space: nowrap; pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,.06); opacity: 0; transition: opacity .1s; z-index: 9999; }
.dshc-ust-tooltip.show { opacity: 1; }
.dshc-ust-tooltip-title { font-size: 11px; font-weight: 600; margin-bottom: 4px; white-space: nowrap; }
.dshc-ust-tooltip-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--dsw-alias-label-secondary,#6b7280); white-space: nowrap; line-height: 1.6; }
.dshc-ust-tooltip-row i { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
.dshc-ust-tooltip-label { flex: 1; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-ust-tooltip-value { color: var(--dsw-alias-label-primary,currentColor); font-variant-numeric: tabular-nums; }


`;

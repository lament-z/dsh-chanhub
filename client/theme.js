// dsh-chanhub —— 视觉令牌与共享样式（浏览器侧）
//
// 令牌取自 DSH 真实主题 `@deepseek-ai/dsh-client-ui-theme` 的 `--dsw-alias-*` 变量，
// 与 dsh-bridge-gateway 的 `s` 对象同源。**不要硬编码颜色** —— 否则亮/暗主题会崩。
//
// 见 `.scratch/chanhub-panel/ui-design.md` §3 的令牌表（含亮/暗两套解析值）。

/** 卡片 / 按钮 / 标签等共享样式（与 dsh-bridge-gateway 对齐并扩充）。 */
export const s = {
  card: {
    background: 'var(--dsw-alias-bg-layer-2,#f9fafb)',
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
.dshc-body .dshc-body { background: var(--dsw-alias-bg-layer-1,#fff); }
/* 行：一律 center 对齐 —— 竖排块与单行文字用 baseline 会错位（实测 20px，坑 3） */
.dshc-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.dshc-grid { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.dshc-sub { padding-left: 16px; border-left: 2px solid var(--dsw-alias-border-l2,#e5e7eb); margin-left: 6px; }
/* 表格横向滚动：容器链上必须有 min-width:0，否则 min-width 会撑破卡片 */
.dshc-tblwrap { overflow-x: auto; min-width: 0; }
.dshc-tblwrap > table { min-width: 600px; border-collapse: collapse; width: 100%; font-size: 12px; }
.dshc-tblwrap th { text-align: left; font-weight: 500; color: var(--dsw-alias-label-tertiary,#8b93a1); padding: 6px 8px; border-bottom: 1px solid var(--dsw-alias-border-l2,#e5e7eb); white-space: nowrap; }
.dshc-tblwrap td { padding: 6px 8px; border-bottom: 1px solid var(--dsw-alias-border-l2,#f3f4f6); color: var(--dsw-alias-label-primary,currentColor); }
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
`;

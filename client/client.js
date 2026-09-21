window.__ModuleLoader__.load({
  id: "dsh-chanhub",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// client/index.js
var index_exports = {};
__export(index_exports, {
  AddAccountDialog: () => AddAccountDialog,
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);

// client/theme.js
var s = {
  card: {
    // 参考 dsh-usage-panel / dsh-token-monitor：卡片用 layer-1（白）浮在灰页面上。
    // 原先用 layer-2（比页面更暗）会让卡片「后退」，整页发闷 —— 这是本轮
    // 「差点意思」的主要来源之一。
    background: "var(--dsw-alias-bg-layer-1,#fff)",
    border: "1px solid var(--dsw-alias-border-l2,#e5e7eb)",
    borderRadius: 12,
    padding: "16px 18px",
    marginBottom: 16,
    boxSizing: "border-box",
    minWidth: 0
  },
  block: {
    borderTop: "1px solid var(--dsw-alias-border-l2,#e5e7eb)",
    marginTop: 12,
    paddingTop: 12,
    minWidth: 0
  },
  muted: { color: "var(--dsw-alias-label-tertiary,#8b93a1)", fontSize: 12, lineHeight: 1.5 },
  label: { color: "var(--dsw-alias-label-primary,currentColor)", fontSize: 13, fontWeight: 500 },
  code: {
    fontFamily: "ui-monospace,Menlo,monospace",
    fontSize: 12,
    wordBreak: "break-all",
    color: "var(--dsw-alias-label-primary,currentColor)"
  },
  btnPri: {
    font: "inherit",
    cursor: "pointer",
    border: "none",
    background: "var(--dsw-alias-button-info-fill,#4176e6)",
    color: "#fff",
    height: 32,
    padding: "0 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    gap: 4
  },
  btnGhost: {
    font: "inherit",
    cursor: "pointer",
    border: "1px solid var(--dsw-alias-border-l2,#d1d5db)",
    background: "var(--dsw-alias-bg-layer-2,#f9fafb)",
    color: "var(--dsw-alias-label-primary,currentColor)",
    height: 32,
    padding: "0 14px",
    borderRadius: 999,
    fontSize: 13,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    textDecoration: "none"
  },
  btnLink: {
    font: "inherit",
    cursor: "pointer",
    border: "none",
    background: "none",
    color: "var(--dsw-alias-state-business-primary,#4176e6)",
    fontSize: 12,
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    textDecoration: "none"
  },
  input: {
    font: "inherit",
    fontSize: 12,
    height: 28,
    padding: "0 8px",
    borderRadius: 6,
    border: "1px solid var(--dsw-alias-border-l2,#d1d5db)",
    background: "var(--dsw-alias-bg-layer-1,#fff)",
    color: "var(--dsw-alias-label-primary,currentColor)",
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0
  },
  warn: {
    background: "var(--dsw-alias-state-warn-tertiary,#fffbeb)",
    border: "1px solid var(--dsw-alias-border-l2,#fde68a)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    color: "var(--dsw-alias-state-warn-primary,#92400e)",
    lineHeight: 1.6
  },
  tip: {
    background: "var(--dsw-alias-bg-layer-2,#f9fafb)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    color: "var(--dsw-alias-label-secondary,#6b7280)",
    lineHeight: 1.6
  },
  err: {
    background: "var(--dsw-alias-interactive-bg-hover-danger,#fef2f2)",
    border: "1px solid var(--dsw-alias-border-l2,#fecaca)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    color: "var(--dsw-alias-state-error-primary,#dc2626)",
    lineHeight: 1.6
  },
  // KPI 统计格：与 .dshc-kpi / .dshc-kpis 配套。此前 s 里没有这一项，
  // 用量页只挂 className（于是 padding 全丢），账号池页内联兜底、两边不一致。
  kpi: {
    border: "1px solid var(--dsw-alias-border-l2,#e5e7eb)",
    borderRadius: 10,
    background: "var(--dsw-alias-bg-layer-1,#fff)",
    padding: "10px 12px",
    minWidth: 0,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 2
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: "nowrap",
    flexShrink: 0,
    minWidth: "max-content",
    lineHeight: 1.4
  }
};
var tone = {
  ok: {
    fg: "var(--dsw-alias-state-success-primary,#059669)",
    bg: "var(--dsw-alias-state-success-tertiary,#ecfdf5)"
  },
  warn: {
    fg: "var(--dsw-alias-state-warn-primary,#b45309)",
    bg: "var(--dsw-alias-state-warn-tertiary,#fffbeb)"
  },
  err: {
    fg: "var(--dsw-alias-state-error-primary,#dc2626)",
    bg: "var(--dsw-alias-interactive-bg-hover-danger,#fef2f2)"
  },
  info: {
    fg: "var(--dsw-alias-button-info-fill,#4176e6)",
    bg: "var(--dsw-alias-bg-layer-2,#eef2ff)"
  },
  idle: {
    fg: "var(--dsw-alias-label-secondary,#6b7280)",
    bg: "var(--dsw-alias-bg-layer-2,#f3f4f6)"
  }
};
var FOLD_CSS = `
.dshc-fold { border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 8px; margin-bottom: 8px; background: var(--dsw-alias-bg-layer-2,#f9fafb); min-width: 0; }
.dshc-fold > summary { cursor: pointer; padding: 8px 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; list-style: none; min-width: 0; }
.dshc-fold > summary::-webkit-details-marker { display: none; }
.dshc-fold > summary::before { content: '\u25B8'; flex-shrink: 0; color: var(--dsw-alias-label-tertiary,#8b93a1); font-size: 11px; }
.dshc-fold[open] > summary::before { content: '\u25BE'; }
/* \u5751 1\uFF1A\u663E\u5F0F display \u4F1A\u8986\u76D6\u6298\u53E0\u9690\u85CF \u2014\u2014 \u663E\u5F0F\u538B\u56DE */
.dshc-fold:not([open]) > .dshc-body { display: none; }
.dshc-body { padding: 4px 12px 12px; min-width: 0; }
/* \u7F51\u683C\u884C\u7684\u7EDF\u4E00\u5185\u8FB9\u8DDD\uFF1A\u6298\u53E0\u4F53\uFF08.dshc-body\uFF09\u5E26 12px \u5DE6\u53F3\u5185\u8FB9\u8DDD\uFF0C\u800C\u5E38\u9A7B\u7684
   \u300C\u5F85\u505A\u300D\u7EC4\u5728\u5361\u7247\u76F4\u4E0B \u2014\u2014 \u4E0D\u8865\u540C\u6837\u5185\u8FB9\u8DDD\uFF0C\u4E24\u7EC4\u884C\u7684\u7F51\u683C\u8D77\u70B9\u5C31\u5DEE 12px\uFF08\u5B9E\u6D4B 13px\uFF09\uFF0C
   \u770B\u8D77\u6765\u50CF\u5217\u6CA1\u5BF9\u9F50\u3002\u7ED9\u4E24\u7EC4\u540C\u4E00\u4E2A\u6C34\u5E73\u5185\u8FB9\u8DDD\uFF0C\u7F51\u683C\u5217\u624D\u5BF9\u5F97\u4E0A\u3002 */
.dshc-rows { padding: 0 12px; min-width: 0; border-left: 1px solid transparent; border-right: 1px solid transparent; }
/* \u8BF4\u660E\uFF1A\u6298\u53E0\u5361 .dshc-fold \u81EA\u5E26 1px \u8FB9\u6846\uFF0C\u5176\u5185\u5BB9\u56E0\u6B64\u6BD4\u5361\u7247\u76F4\u4E0B\u7684\u5144\u5F1F\u8282\u70B9\u53F3\u79FB 1px\u3002
   \u4E0A\u9762\u7684 transparent \u8FB9\u6846\u628A\u5E38\u9A7B\u884C\u7EC4\u4E5F\u63A8\u540C\u6837\u7684 1px\uFF0C\u4E24\u7EC4\u7F51\u683C\u5217\u624D\u4E25\u683C\u540C\u4E00 x\u3002
   \u7528 border \u800C\u4E0D\u662F margin\uFF1Amargin \u4F1A\u8BA9\u5BBD\u5EA6\u4E5F\u5DEE 2px\uFF08\u5B9E\u6D4B 674 vs 672\uFF09\u3002 */
.dshc-body .dshc-body { background: var(--dsw-alias-bg-layer-1,#fff); }
/* \u884C\uFF1A\u4E00\u5F8B center \u5BF9\u9F50 \u2014\u2014 \u7AD6\u6392\u5757\u4E0E\u5355\u884C\u6587\u5B57\u7528 baseline \u4F1A\u9519\u4F4D\uFF08\u5B9E\u6D4B 20px\uFF0C\u5751 3\uFF09 */
.dshc-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.dshc-grid { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.dshc-sub { padding-left: 16px; border-left: 2px solid var(--dsw-alias-border-l2,#e5e7eb); margin-left: 6px; }
/* \u8868\u683C\u6A2A\u5411\u6EDA\u52A8\uFF1A\u5BB9\u5668\u94FE\u4E0A\u5FC5\u987B\u6709 min-width:0\uFF0C\u5426\u5219 min-width \u4F1A\u6491\u7834\u5361\u7247 */
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
/* \u603B\u79EF\u5206\u4E0E\u6E20\u9053\uFF1A\u7A84\u5C4F\u6362\u884C / \u6781\u7A84\u5C4F\u7AD6\u6392 */
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
/* ---- v2 \u91CD\u8BBE\u8BA1\u65B0\u589E ---- */
/* \u9876\u680F\u4E00\u884C\u836F\u4E38\u6761 */
.dshc-topbar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 12px; background: var(--dsw-alias-bg-layer-2,#f9fafb); margin-bottom: 12px; flex-wrap: wrap; min-width: 0; }
.dshc-topbar-title { font-size: 14px; font-weight: 600; color: var(--dsw-alias-label-primary,currentColor); white-space: nowrap; }
.dshc-statusdot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.dshc-keypill { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2,#d1d5db); background: var(--dsw-alias-bg-layer-1,#fff); font-family: ui-monospace,Menlo,monospace; font-size: 11.5px; color: var(--dsw-alias-label-secondary,#6b7280); cursor: pointer; max-width: 260px; overflow: hidden; white-space: nowrap; flex-shrink: 0; }
.dshc-keypill > span { overflow: hidden; text-overflow: ellipsis; }
.dshc-keypill-ico { border: none; background: none; cursor: pointer; padding: 2px; display: inline-flex; color: var(--dsw-alias-label-tertiary,#8b93a1); flex-shrink: 0; }
.dshc-keypill-ico:hover { color: var(--dsw-alias-brand-primary,#4f6ef7); }
/* Tab \u680F\u6700\u53F3\u7684\u300C\u6DFB\u52A0\u8D26\u53F7\u300D\uFF1A\u4E0E 5 \u4E2A Tab \u540C\u884C\uFF0C\u8D34\u53F3\u7AEF\u3002
   sticky \u7684\u539F\u56E0\uFF1A .dshc-tabs \u662F overflow-x:auto \u7684\u6EDA\u52A8\u5BB9\u5668\uFF0C\u7A84\u5C4F\u4E0B\u6309\u94AE\u4F1A\u88AB\u6EDA\u51FA\u89C6\u91CE
   \u2014\u2014 \u5B83\u662F\u5E38\u9A7B\u5165\u53E3\uFF0C\u4E0D\u8BE5\u968F Tab \u6A2A\u5411\u6EDA\u52A8\u800C\u6D88\u5931\u3002 */
.dshc-tabadd { position: sticky; right: 0; flex-shrink: 0; align-self: center; margin: 0 0 4px 8px; font: inherit; cursor: pointer; height: 28px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--dsw-alias-button-info-fill,#4176e6); background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-button-info-fill,#4176e6); font-size: 12.5px; font-weight: 500; white-space: nowrap; }
.dshc-tabadd:hover { background: var(--dsw-alias-bg-layer-2,#eef2ff); }
/* \u6570\u5B57\u6392\u7248\uFF1A\u7B49\u5BBD\u6570\u4F4D\uFF08tabular-nums\uFF09\u2014\u2014 \u53C2\u8003\u5B9E\u73B0\u540C\u6B3E\u3002
   \u4E0D\u505A\u7B49\u5BBD\u65F6\uFF0CKPI \u4E0E\u8868\u683C\u91CC\u7684\u6570\u5B57\u5BBD\u5EA6\u968F\u5185\u5BB9\u8DF3\u52A8\uFF0C\u6A2A\u6392\u6570\u5B57\u5BF9\u4E0D\u9F50\u3002 */
.dshc-num { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum' 1; letter-spacing: -.02em; }
/* \u70ED\u529B\u56FE\uFF08GitHub \u5F0F\uFF09\uFF1A\u5468\u4E3A\u5217\u3001\u5468\u4E00\u2192\u5468\u65E5\u4E3A\u884C\uFF0C\u9876\u90E8\u6708\u4EFD\u3001\u5DE6\u4FA7\u661F\u671F\u3002 */
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
/* \u5206\u4F4D\u8272\u9636\uFF08\u53C2\u8003\u5B9E\u73B0\u7684\u84DD ramp\uFF1B\u6DF1\u6D45\u4E3B\u9898\u5404\u4E00\u5957\uFF09 */
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
/* \u5165\u573A\u52A8\u6548\uFF08\u6570\u5B57 count-up \u7531 JS \u9A71\u52A8\uFF1B\u6B64\u6761\u53EA\u4E3A\u70ED\u529B\u56FE\u7684\u9010\u5217\u6DE1\u5165\uFF09 */
@keyframes dshc-heat-in { from { opacity: 0 } to { opacity: 1 } }
.dshc-heat > i.anim { animation: dshc-heat-in .45s linear both; }
/* \u5C0A\u91CD\u7CFB\u7EDF\u300C\u51CF\u5C11\u52A8\u6001\u6548\u679C\u300D\uFF1A\u53C2\u8003\u5B9E\u73B0\u540C\u6B3E\u5904\u7406 */
@media (prefers-reduced-motion: reduce) {
  .dshc-heat > i.anim { animation: none; }
}
/* \u6A21\u578B\u73AF\u5F62\u56FE + \u6392\u884C\u5217\u8868 */
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
/* \u7D27\u51D1\u6BB5\u63A7\uFF08\u7A97\u53E3 / \u6307\u6807 / \u89C6\u56FE / \u7EF4\u5EA6\u5207\u6362\u5171\u7528\uFF09\u3002
   \u4E0E .dshc-viewtoggle \u7684\u5206\u5DE5\uFF1A\u90A3\u4E00\u6B3E\u662F\u300C\u9875\u7EA7\u300D\u89C6\u56FE\u5207\u6362\uFF08\u8F83\u5927\uFF09\uFF0C\u672C\u6B3E\u662F\u9875\u5185\u7684
   \u8F7B\u91CF\u9009\u62E9\u5668 \u2014\u2014 \u8FB9\u6846\u53EA\u6709 1px \u4E14\u65E0\u5916\u53D1\u5149\uFF0C\u8BA9\u5185\u5BB9\u800C\u975E\u63A7\u4EF6\u6210\u4E3A\u89C6\u89C9\u4E3B\u89D2\u3002 */
.dshc-seg { display: inline-flex; align-items: center; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 7px; overflow: hidden; background: var(--dsw-alias-bg-layer-2,#f9fafb); flex-shrink: 0; max-width: 100%; }
.dshc-seg > button { font: inherit; font-size: 12px; line-height: 1; border: none; background: none; color: var(--dsw-alias-label-secondary,#61666b); padding: 5px 9px; cursor: pointer; white-space: nowrap; }
.dshc-seg > button + button { border-left: 1px solid var(--dsw-alias-border-l2,#e5e7eb); }
.dshc-seg > button:hover { color: var(--dsw-alias-label-primary,currentColor); }
.dshc-seg > button.on { background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-brand-primary,#4f6ef7); font-weight: 600; box-shadow: inset 0 -2px 0 var(--dsw-alias-brand-primary,#4f6ef7); }
/* \u5206\u6790\u89C6\u56FE\u9009\u62E9\u5668\uFF08\u6536\u8D77\u6001\uFF09\uFF1A\u6807\u9898 + \u5F53\u524D\u503C + \u6298\u53E0\u7BAD\u5934\uFF0C\u6574\u4F53\u53EF\u70B9\u3002
   \u4E3A\u4EC0\u4E48\u505A\u6210\u300C\u6536\u8D77\u300D\uFF1A\u56DB\u4E2A\u89C6\u56FE\u662F\u63A2\u7D22\u578B\u5165\u53E3\uFF0C\u9ED8\u8BA4\u94FA\u5F00\u4F1A\u8BA9\u9875\u9762\u5148\u5448\u73B0\u63A7\u4EF6\u800C\u975E\u6570\u636E\u3002 */
.dshc-viewpick { display: inline-flex; align-items: center; gap: 8px; font: inherit; cursor: pointer; border: 1px solid transparent; background: none; border-radius: 7px; padding: 3px 8px; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-viewpick:hover { background: var(--dsw-alias-bg-layer-2,#f3f4f6); border-color: var(--dsw-alias-border-l2,#e5e7eb); }
.dshc-viewpick-cur { font-size: 12px; color: var(--dsw-alias-brand-primary,#4f6ef7); font-weight: 600; }
.dshc-viewpick-caret { font-size: 10.5px; color: var(--dsw-alias-label-tertiary,#8b93a1); }
/* KPI \u884C\uFF08\u53EF\u70B9\u51FB\u7684\u7EDF\u8BA1\u683C\uFF09 */
.dshc-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
@media (max-width: 560px) { .dshc-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.dshc-kpi { border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 10px; background: var(--dsw-alias-bg-layer-1,#fff); padding: 10px 12px; cursor: pointer; text-align: left; font: inherit; min-width: 0; }
/* \u6E20\u9053\u4E09\u5361\uFF08\u5F53\u524D\u53EF\u7528\u79EF\u5206\uFF1AWB / Trae / Qoder\uFF09 */
.dshc-chancards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
@media (max-width: 560px) { .dshc-chancards { grid-template-columns: 1fr; } }
.dshc-chancard { border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 10px; padding: 12px 14px; background: var(--dsw-alias-bg-layer-1,#fff); min-width: 0; }
.dshc-chancard.dim { opacity: 0.55; }
/* \u89C6\u56FE\u5207\u6362\uFF08\u5361\u7247/\u5217\u8868\uFF09 */
.dshc-viewtoggle { display: inline-flex; border: 1px solid var(--dsw-alias-border-l2,#d1d5db); border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.dshc-viewtoggle > button { font: inherit; border: none; background: var(--dsw-alias-bg-layer-2,#f9fafb); color: var(--dsw-alias-label-secondary,#6b7280); padding: 4px 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
.dshc-viewtoggle > button.on { background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-brand-primary,#4f6ef7); font-weight: 600; }
/* \u8D26\u53F7\u5361\u7247\uFF08\u7F51\u683C\uFF09 */
.dshc-acctgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
/* \u8D26\u53F7\u5361\uFF1A\u56DB\u6BB5\u5F0F\u7EB5\u5411\u7ED3\u6784\uFF08\u5934 / \u4E3B\u6570\u503C / \u5728\u9014\u6761 / \u5E95\u884C\uFF09\uFF0C\u4FE1\u606F\u5404\u5F52\u5176\u4F4D\u3002
   \u539F\u5148\u53EA\u6709\u4E24\u884C\u4E14\u53F3\u4FA7\u6324\u4E00\u884C 11px \u5C0F\u5B57\uFF0C\u4E3B\u4F53\u5927\u7247\u7559\u767D \u2014\u2014 \u6539\u4E3A\u4E00\u5217\u94FA\u6EE1\uFF0C
   \u4E3B\u6570\u503C\u653E\u5927\u5360\u6574\u884C\uFF0C\u5143\u4FE1\u606F\u62C6\u5230\u72EC\u7ACB\u5E95\u884C\uFF08\u5B57\u53F7 11.5px \u4ECD\u53EF\u8BFB\uFF09\u3002 */
.dshc-acctcard { display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 10px; padding: 12px 14px; background: var(--dsw-alias-bg-layer-1,#fff); cursor: pointer; min-width: 0; text-align: left; font: inherit; transition: box-shadow .15s, border-color .15s; }
.dshc-acctcard:hover { box-shadow: 0 2px 10px rgba(0,0,0,.08); border-color: var(--dsw-alias-brand-primary,#4f6ef7); }
.dshc-acctcard-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; }
.dshc-acctcard-name { display: inline-flex; align-items: center; gap: 7px; min-width: 0; }
.dshc-acctcard-nametext { font-size: 13px; font-weight: 500; color: var(--dsw-alias-label-primary,currentColor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* \u4E3B\u6570\u503C\uFF1A\u79EF\u5206\u5927\u5B57\u72EC\u5360\u4E00\u884C\uFF0C\u4E0D\u518D\u4E0E\u5143\u4FE1\u606F\u4E89\u5BBD */
.dshc-acctcard-credits { display: flex; align-items: baseline; gap: 6px; min-width: 0; flex-wrap: wrap; }
.dshc-acctcard-credits-num { font-size: 22px; font-weight: 600; line-height: 1.15; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-acctcard-credits-unit { font-size: 11.5px; color: var(--dsw-alias-label-tertiary,#8b93a1); }
.dshc-acctcard-expiring { font-size: 11px; color: var(--dsw-alias-state-warn-primary,#b45309); background: var(--dsw-alias-state-warn-tertiary,#fffbeb); border-radius: 999px; padding: 1px 7px; white-space: nowrap; }
/* \u4F59\u989D\u65B0\u9C9C\u5EA6\uFF08\u76F8\u5BF9\u65F6\u95F4\uFF09\uFF1A\u544A\u8BC9\u7528\u6237\u8FD9\u4E2A\u79EF\u5206\u503C\u6709\u591A\u65E7 */
.dshc-acctcard-updated { font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); white-space: nowrap; }
/* \u5728\u9014\u5360\u7528\uFF1A\u8F68\u9053 + \u586B\u5145 + \u53F3\u6807\u6CE8 */
.dshc-acctcard-bar { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dshc-acctcard-track { flex: 1 1 auto; min-width: 40px; height: 4px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2,#f3f4f6); overflow: hidden; }
.dshc-acctcard-fill { display: block; height: 100%; border-radius: 999px; background: var(--dsw-alias-button-info-fill,#4176e6); transition: width .3s; }
.dshc-acctcard-fill.full { background: var(--dsw-alias-state-warn-primary,#f59e0b); }
.dshc-acctcard-bartext { font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); white-space: nowrap; }
/* \u5E95\u884C\uFF1A\u6E20\u9053 / \u57DF / \u6210\u8D25 \u2014\u2014 \u5143\u4FE1\u606F\u4ECE\u300C\u53F3\u4E0B\u89D2\u5C0F\u5B57\u300D\u6539\u4E3A\u72EC\u7ACB\u4E00\u884C */
.dshc-acctcard-foot { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; min-width: 0; margin-top: auto; padding-top: 7px; border-top: 1px solid var(--dsw-alias-border-l2,#f3f4f6); }
.dshc-chip { font-size: 11px; line-height: 1.5; padding: 1px 7px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2,#f3f4f6); color: var(--dsw-alias-label-secondary,#6b7280); white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.dshc-chip-dim { color: var(--dsw-alias-label-tertiary,#9ca3af); }
/* \u5230\u671F\u4E34\u8FD1 / \u5DF2\u8FC7\u671F\uFF1A\u552F\u4E00\u9700\u8981\u62A2\u6CE8\u610F\u529B\u7684\u5143\u4FE1\u606F\uFF0C\u6545\u7528\u8B66\u793A\u5E95\u800C\u975E\u7070\u5E95 */
.dshc-chip-warn { background: var(--dsw-alias-state-warn-tertiary,#fffbeb); color: var(--dsw-alias-state-warn-primary,#b45309); }
/* \u9010\u8D26\u53F7\u660E\u7EC6\u884C\uFF1A**\u7F51\u683C\u56FA\u5B9A\u5217**\uFF0C\u4FDD\u8BC1\u540C\u4E00\u5217\u5728\u6BCF\u884C\u4F4D\u7F6E\u4E00\u81F4\u3002
   \u80CC\u666F\uFF1A\u5F00\u5B66\u5B63\u6709 5 \u884C\u4F46\u300C\u6BCF\u65E5\u300D\u6807\u7B7E\u53EA 4 \u884C\u6709\u3001\u6210\u957F\u4EFB\u52A1 22 \u884C\u91CC\u51FA\u73B0 3/4/5 \u4E2A\u5B50\u5143\u7D20
   \u4E09\u79CD\u5F62\u6001 \u2014\u2014 \u7528 flex \u81EA\u7136\u6392\u7248\u65F6\u7F3A\u4E00\u5217\u5C31\u4F1A\u8BA9\u540E\u7EED\u5217\u5DE6\u79FB\uFF0C\u89C6\u89C9\u4E0A\u300C\u9519\u4F4D\u300D\u3002 */
.dshc-srow { display: grid; grid-template-columns: 20px minmax(0, 1fr) 54px 64px max-content; align-items: center; gap: 8px; padding: 3px 0; min-width: 0; }
.dshc-growrow { display: grid; grid-template-columns: 3px minmax(0, 1fr) 54px minmax(74px, auto) max-content 74px; align-items: center; gap: 8px; padding: 3px 0; min-width: 0; }
.dshc-stitle { font-size: 13px; font-weight: 500; color: var(--dsw-alias-label-primary,currentColor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.dshc-sprog { font-family: ui-monospace,Menlo,monospace; font-size: 12px; text-align: right; color: var(--dsw-alias-label-secondary,#6b7280); white-space: nowrap; }
/* \u53E3\u5F84\u5F02\u5E38\uFF08\u4E0A\u6E38\u7ED9\u300C\u5DF2\u9886\u53D6\u300D\u4F46\u8FDB\u5EA6\u672A\u6EE1\uFF09\uFF1A\u52A0\u865A\u7EBF\u5E95\u7EB9\uFF0C\u63D0\u793A\u4E0D\u662F\u9762\u677F\u7B97\u9519 */
.dshc-sprog.odd { color: var(--dsw-alias-state-warn-primary,#b45309); border-bottom: 1px dotted var(--dsw-alias-state-warn-primary,#b45309); cursor: help; }
.dshc-ssrc { display: flex; align-items: center; gap: 4px; min-width: 0; flex-wrap: wrap; }
.dshc-sact { display: inline-flex; align-items: center; gap: 6px; justify-content: flex-end; }
@media (max-width: 560px) {
  .dshc-srow { grid-template-columns: 20px minmax(0, 1fr) 48px max-content; }
  .dshc-srow > .dshc-ssrc { display: none; }
  .dshc-growrow { grid-template-columns: 3px minmax(0, 1fr) 48px minmax(62px, auto) max-content 70px; }
  .dshc-growrow > .dshc-ssrc { display: none; }
}
/* \u8D26\u53F7\u9009\u62E9\u5668\uFF08\u9010\u8D26\u53F7\u6570\u636E\u5361\u5171\u7528\uFF09\uFF1A\u53EA\u5728\u591A\u8D26\u53F7\u65F6\u6E32\u67D3 */
.dshc-acctpick { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 10px; min-width: 0; }
.dshc-acctpick-label { font-size: 11.5px; color: var(--dsw-alias-label-tertiary,#8b93a1); margin-right: 2px; }
.dshc-acctpick-btn { font: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2,#d1d5db); background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-label-secondary,#6b7280); font-size: 12px; max-width: 160px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dshc-acctpick-btn.on { border-color: var(--dsw-alias-button-info-fill,#4176e6); color: var(--dsw-alias-button-info-fill,#4176e6); font-weight: 600; background: var(--dsw-alias-bg-layer-2,#eef2ff); }
.dshc-acctpick-btn:hover { border-color: var(--dsw-alias-brand-primary,#4f6ef7); }
/* \u5361\u7247\u6807\u9898\u884C\uFF1A\u6807\u9898 + \u53F3\u6B21\u8981\u4FE1\u606F + \u53F3\u52A8\u4F5C */
.dshc-cardhead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
/* \u4EFB\u52A1\u78C1\u8D34\uFF1A\u4E00\u884C\u4E03\u4E2A\uFF08\u7A84\u5C4F\u81EA\u52A8\u6298\u884C\uFF09\uFF0C\u70B9\u5373\u89E6\u53D1 */
.dshc-taskgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 8px; }
.dshc-taskgrid-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dshc-tasktile { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 10px; background: var(--dsw-alias-bg-layer-1,#fff); font: inherit; cursor: pointer; text-align: left; min-width: 0; transition: border-color .15s, box-shadow .15s; }
.dshc-tasktile:hover:not(:disabled) { border-color: var(--dsw-alias-brand-primary,#4f6ef7); box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.dshc-tasktile:disabled { cursor: default; opacity: .8; }
.dshc-tasktile.failed { border-color: var(--dsw-alias-border-l2,#fecaca); }
.dshc-tasktile-ico { font-size: 15px; line-height: 1.2; }
.dshc-tasktile-name { font-size: 12.5px; font-weight: 500; color: var(--dsw-alias-label-primary,currentColor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.dshc-tasktile-meta { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
/* \u4EFB\u52A1\u6309\u94AE\u547C\u5438\u6001\uFF08\u8FD0\u884C\u4E2D\uFF09 */
@keyframes dshc-pulse { 0%, 100% { box-shadow: 0 0 0 0 var(--dsw-alias-button-info-fill,#4176e6); opacity: 1; } 50% { box-shadow: 0 0 0 5px rgba(65,118,230,0); opacity: .75; } }
.dshc-taskbtn.running { animation: dshc-pulse 1.6s ease-in-out infinite; border-color: var(--dsw-alias-button-info-fill,#4176e6); color: var(--dsw-alias-button-info-fill,#4176e6); }
/* \u961F\u5217\u8FDB\u5EA6\u6761 */
.dshc-progress { height: 6px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2,#f3f4f6); overflow: hidden; min-width: 120px; flex-grow: 1; }
.dshc-progress > span { display: block; height: 100%; border-radius: 999px; background: var(--dsw-alias-button-info-fill,#4176e6); transition: width .5s; }
/* \u7528\u91CF\u65F6\u5E8F\u67F1\uFF08\u6E10\u53D8 + hover\uFF09 */
.dshc-bars { display: flex; align-items: flex-end; gap: 3px; height: 72px; overflow-x: auto; padding-bottom: 2px; }
.dshc-bars > span { width: 14px; flex-shrink: 0; border-radius: 3px 3px 0 0; background: linear-gradient(180deg, var(--dsw-alias-brand-primary,#4f6ef7), var(--dsw-alias-button-info-fill,#4176e6)); opacity: .85; transition: opacity .15s; cursor: default; }
.dshc-bars > span:hover { opacity: 1; }
.dshc-bars > span.bad { background: linear-gradient(180deg, var(--dsw-alias-state-warn-primary,#f59e0b), var(--dsw-alias-state-error-primary,#dc2626)); }
/* \u914D\u7F6E\u4E24\u5217\u7F51\u683C */
.dshc-cfggrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px 18px; }
@media (max-width: 760px) { .dshc-cfggrid { grid-template-columns: 1fr; } }
.dshc-cfgrow { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 3px 0; }
.dshc-cfgrow > label { flex: none; width: 132px; font-size: 12px; color: var(--dsw-alias-label-secondary,#6b7280); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshc-cfgrow > .dshc-cfgctl { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; }
.dshc-cfgrow.danger > label { color: var(--dsw-alias-state-warn-primary,#b45309); }
/* \u8BE6\u60C5\u6ED1\u51FA\u9762\u677F */
.dshc-drawer-mask { position: fixed; inset: 0; background: rgba(0,0,0,.25); z-index: 9998; }
.dshc-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(480px, 92vw); background: var(--dsw-alias-bg-layer-2,#fff); border-left: 1px solid var(--dsw-alias-border-l2,#e5e7eb); box-shadow: -8px 0 30px rgba(0,0,0,.12); z-index: 9999; padding: 18px 20px; overflow-y: auto; box-sizing: border-box; }
.dshc-drawer-close { position: absolute; top: 12px; right: 14px; border: none; background: none; cursor: pointer; font: inherit; font-size: 16px; color: var(--dsw-alias-label-tertiary,#8b93a1); padding: 4px; }
.dshc-drawer-close:hover { color: var(--dsw-alias-label-primary,currentColor); }
/* \u5C45\u4E2D\u5F39\u7A97\uFF08\u6DFB\u52A0\u8D26\u53F7\uFF09\uFF1A\u4E0E\u62BD\u5C49\u540C\u5C42\u53E0\u987A\u5E8F\uFF1B\u9AD8\u5EA6\u53D7\u9650\u5185\u90E8\u6EDA\u52A8 */
.dshc-dialog { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(520px, 92vw); max-height: 88vh; overflow-y: auto; background: var(--dsw-alias-bg-layer-2,#fff); border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,.18); z-index: 9999; padding: 20px 22px; box-sizing: border-box; }
/* \u5355\u9009\u836F\u4E38\uFF08\u6E20\u9053 / \u57DF\uFF09 */
.dshc-choice { font: inherit; cursor: pointer; display: inline-flex; align-items: baseline; gap: 5px; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2,#d1d5db); background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-label-secondary,#6b7280); font-size: 12.5px; }
.dshc-choice.on { border-color: var(--dsw-alias-button-info-fill,#4176e6); color: var(--dsw-alias-button-info-fill,#4176e6); font-weight: 600; background: var(--dsw-alias-bg-layer-2,#eef2ff); }
.dshc-choice:disabled { cursor: default; opacity: .8; }
.dshc-choice-note { font-size: 10.5px; color: var(--dsw-alias-label-tertiary,#9ca3af); }
/* \u901A\u7528\u65CB\u8F6C\uFF08\u5237\u65B0\u6309\u94AE\u56FE\u6807\u7B49\uFF09 */
.dshc-spin { display: inline-flex; animation: dshc-spin .8s linear infinite; }
/* \u7B49\u5F85\u6388\u6743\u7684\u5C0F\u8F6C\u5708 */
@keyframes dshc-spin { to { transform: rotate(360deg); } }
.dshc-spinner { width: 14px; height: 14px; flex-shrink: 0; border-radius: 50%; border: 2px solid var(--dsw-alias-border-l2,#e5e7eb); border-top-color: var(--dsw-alias-button-info-fill,#4176e6); animation: dshc-spin .8s linear infinite; }
/* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 \u7528\u91CF\u9875 v4\uFF08\u5355\u9875\u5361\u7247\u6D41\uFF0C\u53C2\u8003 AlfredChaos/dsh-usage-panel\uFF09 \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   \u4E24\u6761\u786C\u7EA6\u675F\uFF08\u90FD\u662F\u539F\u578B/\u771F\u673A\u4E0A\u8E29\u51FA\u6765\u7684\uFF0C\u522B\u56DE\u9000\uFF09\uFF1A

   1. **SVG \u7684 fill/stroke \u4E0D\u5199 var()**\u3002presentation attribute \u91CC\u7684 var()
      \u5728\u90E8\u5206\u6D4F\u89C8\u5668\u4E0D\u89E3\u6790 \u2192 \u9759\u6001\u8272\u4E00\u5F8B\u6302 class\uFF08\u4E0B\u9762 .dshc-ust-svg \u5B50\u6811\uFF09\uFF0C
      \u52A8\u6001\u8272\uFF08\u6A21\u578B\u5206\u8272\uFF09\u8D70 'style'\uFF08CSS \u5C5E\u6027\uFF0Cvar() \u53EF\u89E3\u6790\uFF09\u3002

   2. **\u5361\u7247\u7528 bg-layer-1\uFF08\u767D\uFF09\u6D6E\u5728\u7070\u9875\u9762\u4E0A**\u3002\u53C2\u8003\u5B9E\u73B0\u540C\u6B3E\uFF1B\u7528 layer-2
      \uFF08\u6BD4\u9875\u9762\u66F4\u6697\uFF09\u4F1A\u8BA9\u5361\u7247\u300C\u540E\u9000\u300D\uFF0C\u6574\u9875\u53D1\u95F7\u3002 */
.dshc-ust-root { position: relative; display: flex; flex-direction: column; gap: 14px; min-width: 0; }

/* \u2500\u2500 \u9875\u5934\uFF1A\u6807\u9898 + \u56DB\u6001\u526F\u6807\u9898 + \u5BFC\u51FA + \u5237\u65B0 \u2500\u2500 */
.dshc-ust-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; min-width: 0; }
.dshc-ust-headtitle { min-width: 0; }
.dshc-ust-head h2 { margin: 0; font-size: 16px; font-weight: 650; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-ust-sub { margin-top: 3px; font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); }
/* \u5931\u8D25\u6001\u7528\u8B66\u793A\u8272 \u2014\u2014 \u300C\u663E\u793A\u7684\u662F\u65E7\u6570\u636E\u300D\u5FC5\u987B\u4E00\u773C\u53EF\u89C1\uFF0C\u4E0D\u80FD\u53EA\u9760\u4E00\u884C\u5C0F\u5B57 */
.dshc-ust-sub[data-freshness="fallback"], .dshc-ust-sub[data-freshness="error"] { color: var(--dsw-alias-state-warn-primary,#b45309); }
.dshc-ust-headactions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.dshc-ust-refresh { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-label-primary,currentColor); border-radius: 8px; padding: 6px 11px; font: inherit; font-size: 12px; cursor: pointer; }
.dshc-ust-refresh:hover { border-color: var(--dsw-alias-border-l2,#d1d5db); }
.dshc-ust-refresh:disabled { opacity: .55; cursor: default; }

/* \u2500\u2500 \u5BFC\u51FA\u83DC\u5355\uFF08\u7EAF\u5BA2\u6237\u7AEF\u6784\u5EFA\uFF0C\u4E0D\u65B0\u589E\u7AEF\u70B9\uFF09 \u2500\u2500 */
.dshc-ust-export { position: relative; }
.dshc-ust-exportbtn { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); background: var(--dsw-alias-bg-layer-1,#fff); color: var(--dsw-alias-label-primary,currentColor); border-radius: 8px; padding: 6px 11px; font: inherit; font-size: 12px; cursor: pointer; }
.dshc-ust-exportmenu { position: absolute; right: 0; top: calc(100% + 4px); min-width: 150px; background: var(--dsw-alias-bg-layer-1,#fff); border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 8px; padding: 4px; box-shadow: 0 4px 16px rgba(0,0,0,.12); z-index: 9000; }
.dshc-ust-exportmenu button { display: block; width: 100%; text-align: left; border: none; background: transparent; color: var(--dsw-alias-label-primary,currentColor); font: inherit; font-size: 12px; padding: 7px 10px; border-radius: 6px; cursor: pointer; }
.dshc-ust-exportmenu button:hover { background: var(--dsw-alias-bg-layer-2,#f7f8fa); }

/* \u2500\u2500 \u5361\u7247\u5916\u58F3 \u2500\u2500 */
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

/* \u2500\u2500 \u53E3\u5F84\u6807\u6CE8\u884C\uFF08\u7A97\u53E3 / \u8FDB\u7A0B\u4E24\u4E2A\u53E3\u5F84\u5404\u81EA\u7559\u75D5\uFF09 \u2500\u2500 */
.dshc-ust-kpihead { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.dshc-ust-scope { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
.dshc-ust-scope-tag { font-size: 10px; letter-spacing: .03em; padding: 2px 7px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2,#f3f4f6); color: var(--dsw-alias-label-secondary,#6b7280); flex-shrink: 0; }

/* \u2500\u2500 \u2460 KPI 6 \u5361\uFF1A\u4E3B\u6570\u5B57 + \u4E00\u884C\u6B21\u7EA7\u6587\u5B57 \u2500\u2500
   \u53C2\u8003\u5B9E\u73B0\u7684 kpi \u5361\uFF1A\u6570\u503C 19px/700/\u8D1F\u5B57\u8DDD/\u7B49\u5BBD\u6570\u4F4D\uFF0C\u6B21\u7EA7\u6587\u5B57 11px\u3002
   \u56FA\u5B9A 3 \u5217\uFF08auto-fit \u4F1A\u5728\u5BBD\u5C4F\u6392\u6210 4 \u5217\uFF0C\u628A\u300C\u4E09\u6D88\u8017 + \u4E09\u6548\u7387\u300D\u7684\u4E24\u884C\u8BED\u4E49
   \u5207\u6210 4+2\uFF0C\u8BFB\u7684\u65F6\u5019\u5C31\u4E0D\u6210\u7EC4\u4E86\uFF09\uFF1B\u7A84\u5C4F\u964D 2 \u5217\u3001\u518D\u7A84 1 \u5217\u3002 */
.dshc-ust-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
@media (max-width: 640px) { .dshc-ust-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 400px) { .dshc-ust-kpis { grid-template-columns: 1fr; } }
.dshc-ust-kpi { background: var(--dsw-alias-bg-layer-1,#fff); border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); border-radius: 12px; padding: 13px 15px; min-width: 0; }
.dshc-ust-kpi-k { font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dshc-ust-kpi-v { margin-top: 7px; font-size: 19px; font-weight: 700; line-height: 1.2; letter-spacing: -.02em; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-primary,currentColor); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshc-ust-kpi-d { margin-top: 4px; font-size: 11px; color: var(--dsw-alias-label-tertiary,#8b93a1); font-variant-numeric: tabular-nums; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* \u2500\u2500 \u2461 \u6D3B\u8DC3\u70ED\u529B\u56FE\uFF08GitHub \u5E03\u5C40\uFF1A\u5468\u4E3A\u5217\u3001\u5468\u4E00\u2192\u5468\u65E5\u4E3A\u884C\uFF09 \u2500\u2500 */
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
/* \u5206\u4F4D\u8272\u9636\uFF08\u53C2\u8003\u5B9E\u73B0\u7684\u84DD ramp\uFF1B\u6DF1\u6D45\u4E3B\u9898\u5404\u4E00\u5957\uFF09 */
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
/* \u5165\u573A\u52A8\u6548\uFF08\u9010\u5217\u5EF6\u8FDF\u7684\u6DE1\u5165\uFF09 */
@keyframes dshc-heat-in { from { opacity: 0 } to { opacity: 1 } }
.dshc-heat > i.anim { animation: dshc-heat-in .45s linear both; }
@media (prefers-reduced-motion: reduce) {
  .dshc-heat > i.anim { animation: none; }
}

/* \u2500\u2500 \u2462 \u6BCF\u65E5\u7528\u91CF SVG\uFF08\u67F1\u72B6\u5806\u53E0 + \u71C3\u5C3D\uFF09 \u2500\u2500
   \u9759\u6001\u8272\u5168\u5728\u8FD9\u91CC\uFF1A\u89C1\u672C\u6BB5\u5F00\u5934\u7684\u7EA6\u675F 1\u3002 */
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
/* \u67F1\u72B6\u5165\u573A\uFF1A\u4ECE\u5E95\u90E8\u957F\u8D77\uFF08transform-origin \u5FC5\u987B\u914D transform-box\uFF0C\u5426\u5219\u4EE5\u89C6\u53E3\u539F\u70B9\u7F29\u653E\uFF09 */
.dshc-ust-bar-seg { transform-box: fill-box; transform-origin: bottom; animation: dshc-ust-bar-grow .7s cubic-bezier(.16,1,.3,1) both; }
@keyframes dshc-ust-bar-grow { from { transform: scaleY(0) } to { transform: scaleY(1) } }
@media (prefers-reduced-motion: reduce) { .dshc-ust-bar-seg { animation: none; } }
/* \u56FE\u4F8B\u5373\u660E\u7EC6\uFF1A\u8272\u5757 + \u540D\u79F0 + \u503C + \u5360\u6BD4\uFF08\u501F\u53C2\u8003\u5B9E\u73B0\u7684 grid 1fr auto auto\uFF09 */
.dshc-ust-legend { display: flex; flex-direction: column; gap: 2px; margin-top: 10px; }
.dshc-ust-legend-row { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 12px; align-items: center; padding: 4px 6px; border-radius: 6px; font-size: 12px; }
.dshc-ust-legend-row:hover { background: var(--dsw-alias-bg-layer-2,#f7f8fa); }
.dshc-ust-legend-name { display: inline-flex; align-items: center; gap: 8px; min-width: 0; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-ust-legend-name > i { width: 10px; height: 10px; border-radius: 3px; flex: none; display: inline-block; }
.dshc-ust-legend-name > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshc-ust-legend-val { font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-secondary,#61666b); white-space: nowrap; }
.dshc-ust-legend-pct { min-width: 44px; text-align: right; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-tertiary,#8b93a1); white-space: nowrap; }

/* \u2500\u2500 \u2463 \u8D26\u53F7\u6392\u884C / \u2464 \u6E20\u9053\u7528\u91CF\uFF08\u4E24\u5217\u5E76\u6392\uFF09 \u2500\u2500
   \u540D\u5B57\u5B9A\u5BBD + 4px \u7EC6\u6761 + \u53F3\u5BF9\u9F50\u5360\u6BD4 \u2014\u2014 \u4E00\u5C4F\u80FD\u6392 8 \u884C\u8FD8\u4E0D\u663E\u6324\u3002
   \u6761\u957F\u6309**\u76F8\u5BF9\u6700\u5927\u503C**\u5F52\u4E00\uFF1A\u5404\u9879\u63A5\u8FD1\u65F6\u7528\u7EDD\u5BF9\u5360\u6BD4\u4F1A\u8BA9\u6240\u6709\u6761\u4E00\u6837\u957F\u3002 */
.dshc-ust-rank { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
@media (max-width: 760px) { .dshc-ust-rank { grid-template-columns: 1fr; } }
.dshc-ust-rank-row { display: flex; align-items: center; gap: 10px; font-size: 12px; padding: 4px 0; min-width: 0; }
.dshc-ust-rank-row + .dshc-ust-rank-row { border-top: 1px solid var(--dsw-alias-border-l2,#f3f4f6); }
.dshc-ust-rank-no { flex: none; width: 16px; color: var(--dsw-alias-label-tertiary,#8b93a1); font-variant-numeric: tabular-nums; font-size: 11px; }
.dshc-ust-rank-name { flex: none; width: 104px; display: inline-flex; align-items: center; gap: 6px; min-width: 0; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-ust-rank-name > span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.dshc-ust-rank-bar { flex: 1; height: 4px; border-radius: 2px; background: var(--dsw-alias-bg-layer-2,#f1f3f6); overflow: hidden; min-width: 28px; }
.dshc-ust-rank-bar > i { display: block; height: 100%; border-radius: 2px; background: var(--dsw-alias-brand-primary,#4f6ef7); }
.dshc-ust-rank-val { flex: none; width: 44px; text-align: right; font-variant-numeric: tabular-nums; color: var(--dsw-alias-label-tertiary,#8b93a1); }
@media (max-width: 560px) { .dshc-ust-rank-name { width: 84px; } }

/* \u2500\u2500 \u2465 \u6A21\u578B\u5360\u6BD4\u73AF\u5F62\u56FE + \u5217\u8868 \u2500\u2500 */
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

/* \u2500\u2500 \u8FDB\u7A0B\u53E3\u5F84\u6298\u53E0\u533A\uFF1A\u9010\u6A21\u578B\u884C\uFF08\u6210\u672C\u4F18\u5148\uFF09 \u2500\u2500 */
.dshc-mrow2 { padding: 8px 0; min-width: 0; }
.dshc-mrow2 + .dshc-mrow2 { border-top: 1px solid var(--dsw-alias-border-l2,#f3f4f6); }
.dshc-mrow2-top { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dshc-mrow2-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace,Menlo,monospace; font-size: 12.5px; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-mrow-detail { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 4px; font-size: 10.5px; color: var(--dsw-alias-label-tertiary,#8b93a1); font-variant-numeric: tabular-nums; }
.dshc-more { font: inherit; cursor: pointer; border: none; background: none; color: var(--dsw-alias-brand-primary,#4f6ef7); font-size: 11.5px; padding: 6px 0 0; }
.dshc-more:hover { text-decoration: underline; }

/* \u2500\u2500 \u7ED3\u6784\u5316 tooltip\uFF08fixed \u5B9A\u4F4D\uFF1B\u53C2\u8003\u5B9E\u73B0\u7684 tooltip \u6837\u5F0F\uFF09 \u2500\u2500 */
.dshc-ust-tooltip { position: fixed; left: 0; top: 0; transform: translate(-50%, -110%); background: var(--dsw-alias-bg-layer-1,#fff); border: 1px solid var(--dsw-alias-border-l2,#e5e7eb); color: var(--dsw-alias-label-primary,currentColor); padding: 5px 10px; border-radius: 6px; font-size: 11px; white-space: nowrap; pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,.06); opacity: 0; transition: opacity .1s; z-index: 9999; }
.dshc-ust-tooltip.show { opacity: 1; }
.dshc-ust-tooltip-title { font-size: 11px; font-weight: 600; margin-bottom: 4px; white-space: nowrap; }
.dshc-ust-tooltip-row { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--dsw-alias-label-secondary,#6b7280); white-space: nowrap; line-height: 1.6; }
.dshc-ust-tooltip-row i { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
.dshc-ust-tooltip-label { flex: 1; color: var(--dsw-alias-label-primary,currentColor); }
.dshc-ust-tooltip-value { color: var(--dsw-alias-label-primary,currentColor); font-variant-numeric: tabular-nums; }
`;

// client/ui.js
var import_react = __toESM(require("react"), 1);
var svg = (props, ...children) => import_react.default.createElement(
  "svg",
  {
    viewBox: "0 0 24 24",
    width: 16,
    height: 16,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  },
  ...children
);
var Icons = {
  // 渠道中心主图标：三条汇入一个节点的线（渠道汇聚），与 bridge 的
  // tunnel/ops/gear、宿主齿轮 fallback 均不重合。
  hub: (props) => svg(
    { width: 18, height: 18, ...props },
    import_react.default.createElement("circle", { key: "c", cx: 12, cy: 12, r: 2.6 }),
    import_react.default.createElement("path", { key: "a", d: "M12 9.4V3.5" }),
    import_react.default.createElement("path", { key: "b", d: "M9.8 13.4l-5.1 3" }),
    import_react.default.createElement("path", { key: "d", d: "M14.2 13.4l5.1 3" }),
    import_react.default.createElement("circle", { key: "e", cx: 12, cy: 3, r: 1.6 }),
    import_react.default.createElement("circle", { key: "f", cx: 4, cy: 17, r: 1.6 }),
    import_react.default.createElement("circle", { key: "g", cx: 20, cy: 17, r: 1.6 })
  ),
  chart: (props) => svg(
    props,
    import_react.default.createElement("path", { key: "a", d: "M3 20h18" }),
    import_react.default.createElement("rect", { key: "b", x: 4, y: 10, width: 4, height: 8, rx: 1 }),
    import_react.default.createElement("rect", { key: "c", x: 10, y: 5, width: 4, height: 13, rx: 1 }),
    import_react.default.createElement("rect", { key: "d", x: 16, y: 13, width: 4, height: 5, rx: 1 })
  ),
  check: (props) => svg(props, import_react.default.createElement("path", { d: "M20 6L9 17l-5-5" })),
  trend: (props) => svg(
    props,
    import_react.default.createElement("path", { key: "a", d: "M3 17l6-6 4 4 8-8" }),
    import_react.default.createElement("path", { key: "b", d: "M15 7h6v6" })
  ),
  list: (props) => svg(props, import_react.default.createElement("path", { d: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" })),
  gear: (props) => svg(
    props,
    import_react.default.createElement("circle", { key: "c", cx: 12, cy: 12, r: 3 }),
    import_react.default.createElement("path", {
      key: "p",
      d: "M12 2l1.6 1.2 2-.2.8 1.9 1.8.9-.3 2 1.2 1.7-1.2 1.7.3 2-1.8.9-.8 1.9-2-.2L12 22l-1.6-1.2-2 .2-.8-1.9-1.8-.9.3-2L4.9 12l1.2-1.7-.3-2 1.8-.9.8-1.9 2 .2z"
    })
  ),
  refresh: (props) => svg(
    { width: 13, height: 13, ...props },
    import_react.default.createElement("path", { key: "a", d: "M21 12a9 9 0 1 1-3-6.7" }),
    import_react.default.createElement("path", { key: "b", d: "M21 3v6h-6" })
  ),
  // v2 新增
  eye: (props) => svg(
    { width: 14, height: 14, ...props },
    import_react.default.createElement("path", { key: "a", d: "M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" }),
    import_react.default.createElement("circle", { key: "b", cx: 12, cy: 12, r: 3 })
  ),
  eyeOff: (props) => svg(
    { width: 14, height: 14, ...props },
    import_react.default.createElement("path", { key: "a", d: "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" }),
    import_react.default.createElement("line", { key: "b", x1: 1, y1: 1, x2: 23, y2: 23 })
  ),
  copy: (props) => svg(
    { width: 13, height: 13, ...props },
    import_react.default.createElement("rect", { key: "a", x: 9, y: 9, width: 13, height: 13, rx: 2 }),
    import_react.default.createElement("path", { key: "b", d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
  ),
  cardView: (props) => svg(
    { width: 13, height: 13, ...props },
    import_react.default.createElement("rect", { key: "a", x: 3, y: 3, width: 7, height: 7, rx: 1.5 }),
    import_react.default.createElement("rect", { key: "b", x: 14, y: 3, width: 7, height: 7, rx: 1.5 }),
    import_react.default.createElement("rect", { key: "c", x: 3, y: 14, width: 7, height: 7, rx: 1.5 }),
    import_react.default.createElement("rect", { key: "d", x: 14, y: 14, width: 7, height: 7, rx: 1.5 })
  ),
  listView: (props) => svg(
    { width: 13, height: 13, ...props },
    import_react.default.createElement("rect", { key: "a", x: 3, y: 4, width: 18, height: 4, rx: 1 }),
    import_react.default.createElement("rect", { key: "b", x: 3, y: 10, width: 18, height: 4, rx: 1 }),
    import_react.default.createElement("rect", { key: "c", x: 3, y: 16, width: 18, height: 4, rx: 1 })
  ),
  bolt: (props) => svg(props, import_react.default.createElement("path", { d: "M13 2L3 14h7l-1 8 10-12h-7l1-8z" })),
  // 用量页新增：导出菜单的下载图标
  download: (props) => svg(
    { width: 13, height: 13, ...props },
    import_react.default.createElement("path", { key: "a", d: "M12 3v12" }),
    import_react.default.createElement("path", { key: "b", d: "M7 10l5 5 5-5" }),
    import_react.default.createElement("path", { key: "c", d: "M4 20h16" })
  )
};
function Tag({ text, tone: toneName = "idle", title }) {
  const palette = tone[toneName] ?? tone.idle;
  return import_react.default.createElement(
    "span",
    {
      style: { ...s.tag, background: palette.bg, color: palette.fg },
      ...title === void 0 ? {} : { title }
    },
    text
  );
}
function CardHead({ title, extra, actions }) {
  return import_react.default.createElement(
    "div",
    { className: "dshc-cardhead" },
    import_react.default.createElement("span", { style: s.label }, title),
    extra ? import_react.default.createElement("span", { style: s.muted }, extra) : null,
    actions ? import_react.default.createElement("span", { className: "dshc-row", style: { marginLeft: "auto", gap: 6 } }, actions) : null
  );
}
function Unavailable({ title, needs, hint }) {
  return import_react.default.createElement(
    "div",
    { style: { ...s.card, borderStyle: "dashed" } },
    import_react.default.createElement(
      "div",
      { style: { ...s.label, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
      title,
      import_react.default.createElement(Tag, { text: "\u7F51\u5173\u672A\u63D0\u4F9B", tone: "warn" })
    ),
    import_react.default.createElement(
      "div",
      { style: { ...s.muted, marginTop: 8, lineHeight: 1.7 } },
      "\u5F53\u524D\u7F51\u5173\uFF08plugins/chanhub\uFF09\u6CA1\u6709\u66B4\u9732\u6B64\u89C6\u56FE\u6240\u9700\u7684\u6570\u636E\u7AEF\u70B9\uFF0C\u56E0\u6B64\u8FD9\u91CC\u4E0D\u663E\u793A\u4EFB\u4F55\u63A8\u65AD\u503C\u3002"
    ),
    needs ? import_react.default.createElement(
      "div",
      {
        style: {
          ...s.code,
          marginTop: 8,
          background: "var(--dsw-alias-bg-layer-1,#fff)",
          padding: "8px 10px",
          borderRadius: 6
        }
      },
      `\u6240\u9700\u540E\u7AEF\u7AEF\u70B9\uFF1A${needs}`
    ) : null,
    hint ? import_react.default.createElement("div", { style: { ...s.muted, marginTop: 8 } }, hint) : null
  );
}
function Fold({ summary, children, open = false, id }) {
  return import_react.default.createElement(
    "details",
    { className: "dshc-fold", ...open ? { open: true } : {}, ...id ? { "data-fold": id } : {} },
    import_react.default.createElement("summary", null, summary),
    import_react.default.createElement("div", { className: "dshc-body" }, children)
  );
}
function channelLabel(channel) {
  return { workbuddy: "WB", traework: "Trae", qoder: "Qoder" }[channel] ?? "";
}
function formatAbsolute(iso) {
  const value = Date.parse(iso);
  if (!Number.isFinite(value) || value <= 0) return "\u2014";
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
function formatLatency(value) {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(1)} tok/s` : "\u2014";
}
function useCountUp(target, duration = 900) {
  const value = Number(target) || 0;
  const [shown, setShown] = import_react.default.useState(value);
  const fromRef = import_react.default.useRef(value);
  import_react.default.useEffect(() => {
    const canAnimate = typeof requestAnimationFrame === "function" && typeof cancelAnimationFrame === "function" && !(typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (!canAnimate) {
      fromRef.current = value;
      setShown(value);
      return void 0;
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
  const shownRef = import_react.default.useRef(shown);
  shownRef.current = shown;
  import_react.default.useEffect(() => {
    fromRef.current = shownRef.current;
  }, [value]);
  return shown;
}

// lib/config-spec.js
var DURATION_PATTERN = /^(\d+(\.\d+)?(ns|us|µs|ms|s|m|h))+$/;
var CONFIG_GROUPS = [
  { id: "pool", label: "\u8D26\u53F7\u6C60\u6CBB\u7406", openByDefault: true },
  { id: "schedule", label: "\u5B9A\u65F6\u6392\u7A0B", openByDefault: true },
  { id: "cooldown", label: "\u51B7\u5374\u4E0E\u7194\u65AD\u9000\u907F", openByDefault: false },
  { id: "session_sticky", label: "\u4F1A\u8BDD\u7C98\u6027", openByDefault: false },
  { id: "upstream", label: "\u4E0A\u6E38\u5BA2\u6237\u7AEF", openByDefault: false },
  { id: "global", label: "\u56FD\u9645\u7248\u57DF\uFF08global\uFF09", openByDefault: false },
  { id: "prompt", label: "\u7CFB\u7EDF\u63D0\u793A\u8BCD", openByDefault: false },
  { id: "upstash", label: "Redis \u955C\u50CF\uFF08upstash\uFF09", openByDefault: false },
  { id: "features", label: "\u7279\u6027\u5F00\u5173", openByDefault: false },
  { id: "admin", label: "\u7BA1\u7406\u7AEF\u70B9", openByDefault: false },
  { id: "top", label: "\u9876\u5C42\uFF08\u88C5\u914D\u671F\uFF09", openByDefault: false }
];
var CONFIG_FIELDS = (
  /** @type {FieldSpec[]} */
  [
    // ---- pool（12 项；6 个 setter 已就绪，可热改）----
    {
      path: "pool.max_in_flight",
      label: "\u5355\u8D26\u53F7\u5728\u9014\u4E0A\u9650",
      type: "int",
      default: "3",
      restart: false,
      note: "0 = \u4E0D\u9650\uFF08\u4E0D\u662F\u300C\u56DE\u843D\u9ED8\u8BA4\u300D\uFF09\u2014\u2014 \u4E0E\u5176\u4ED6 pool \u9879\u8BED\u4E49\u76F8\u53CD\uFF0C\u914D\u9519\u4F1A\u653E\u5F00\u5E76\u53D1\u95F8\u95E8",
      danger: true
    },
    {
      path: "pool.max_in_flight_global",
      label: "global \u57DF\u5355\u8D26\u53F7\u5728\u9014\u4E0A\u9650",
      type: "int",
      default: "2",
      restart: false,
      note: "0 \u6216\u8D1F\u6570 \u2192 \u56DE\u843D 2\uFF08\u4E0E max_in_flight \u76F8\u53CD\uFF01\uFF09",
      danger: true
    },
    { path: "pool.breaker_threshold", label: "\u7194\u65AD\u89E6\u53D1\u8FDE\u8D25\u6570", type: "int", default: "3", restart: false, note: "\u22640 \u2192 \u56DE\u843D 3" },
    { path: "pool.breaker_cooldown", label: "\u7194\u65AD\u57FA\u7840\u65F6\u957F", type: "duration", default: "30m", restart: false },
    { path: "pool.breaker_cooldown_max", label: "\u7194\u65AD\u9000\u907F\u5C01\u9876", type: "duration", default: "6h", restart: false },
    { path: "pool.degrade_threshold", label: "\u8FDE\u8D25\u964D\u6743\u9608\u503C", type: "int", default: "5", restart: false, note: "\u22640 \u2192 \u56DE\u843D 5" },
    { path: "pool.degrade_cooldown", label: "\u964D\u6743\u65F6\u957F", type: "duration", default: "10m", restart: false, note: "\u56FA\u5B9A\u503C\uFF0C\u4E0D\u6307\u6570\u9000\u907F" },
    { path: "pool.degrade_cooldown_max", label: "\u964D\u6743\u65F6\u957F\u4E0A\u9650", type: "duration", default: "2h", restart: false },
    { path: "pool.idle_weight_per_hour", label: "\u95F2\u7F6E\u8865\u507F\u6743\u91CD/\u5C0F\u65F6", type: "float", default: "0.5", restart: false, note: "\u22640 \u2192 \u56DE\u843D 0.5" },
    { path: "pool.idle_weight_max", label: "\u95F2\u7F6E\u8865\u507F\u5C01\u9876", type: "float", default: "5.0", restart: false, note: "\u22640 \u2192 \u56DE\u843D 5.0" },
    {
      path: "pool.expiring_soon",
      label: "\u5FEB\u8FC7\u671F\u79EF\u5206\u7A97\u53E3",
      type: "duration",
      default: "168h",
      restart: true,
      note: "0 \u6216\u8D1F = \u7981\u7528\u5FEB\u8FC7\u671F\u5206\u6876\uFF08\u5408\u6CD5\u503C\uFF0C\u4E0D\u662F\u56DE\u843D\uFF09\uFF1B\u65E0\u70ED\u6539 setter \u2014\u2014 \u53EA\u5199\u76D8\uFF0C\u9700\u91CD\u542F\u7F51\u5173\u624D\u6539\u7A97\u53E3",
      danger: true
    },
    {
      path: "pool.cost_explore_interval",
      label: "costTier \u63A2\u7D22\u7A97\u53E3",
      type: "duration",
      default: "30m",
      restart: false,
      note: "0 = \u5173\u505C\u63A2\u7D22\uFF08\u5408\u6CD5\u503C\uFF0C\u4E0D\u56DE\u843D\u9ED8\u8BA4\uFF09",
      danger: true
    },
    // ---- schedule（13 项；scheduler.Reconfigure 已接线 → 可热改）----
    { path: "schedule.checkin_hours", label: "\u7B7E\u5230\u5C0F\u65F6", type: "hours", default: "[9,21]", restart: false, note: "\u70ED\u6539\u7ECF scheduler.Reconfigure\uFF08\u4E0B\u8F6E\u6392\u7A0B\u751F\u6548\uFF09" },
    { path: "schedule.travel_hours", label: "\u732B\u732B\u65C5\u884C\u5C0F\u65F6", type: "hours", default: "[9,21]", restart: false },
    { path: "schedule.activity_hours", label: "\u6D3B\u8DC3\u5730\u56FE\u5C0F\u65F6", type: "hours", default: "[10]", restart: false },
    { path: "schedule.keepalive_hours", label: "token \u4FDD\u6D3B\u5C0F\u65F6", type: "hours", default: "[22]", restart: false },
    { path: "schedule.school_hours", label: "\u5F00\u5B66\u5B63\u5C0F\u65F6", type: "hours", default: "[12]", restart: false },
    { path: "schedule.cat_hours", label: "\u591C\u732B\u5B50\u5C0F\u65F6", type: "hours", default: "[1]", restart: false, note: "\u7A97\u53E3 23:00\u201308:00 CST" },
    { path: "schedule.checkin_enabled", label: "\u542F\u7528\u7B7E\u5230", type: "bool", default: "true", restart: false },
    { path: "schedule.travel_enabled", label: "\u542F\u7528\u65C5\u884C", type: "bool", default: "true", restart: false },
    { path: "schedule.activity_enabled", label: "\u542F\u7528\u6D3B\u8DC3\u4E0A\u62A5", type: "bool", default: "true", restart: false },
    { path: "schedule.keepalive_enabled", label: "\u542F\u7528\u4FDD\u6D3B", type: "bool", default: "true", restart: false },
    { path: "schedule.school_enabled", label: "\u542F\u7528\u5F00\u5B66\u5B63", type: "bool", default: "true", restart: false },
    { path: "schedule.cat_enabled", label: "\u542F\u7528\u591C\u732B\u5B50", type: "bool", default: "true", restart: false },
    {
      path: "schedule.activity_report_count",
      label: "\u6BCF\u6B21\u4E0A\u62A5\u6761\u6570",
      type: "int",
      default: "5",
      restart: false,
      note: "\u7F3A\u7701 5\uFF1B\u663E\u5F0F 0 \u2192 \u53D8\u4E3A 1\uFF08\u4E24\u6761\u8DEF\u5F84\u4E0D\u5408\u5E76\uFF0C\u662F\u523B\u610F\u7684\uFF09",
      danger: true
    },
    // ---- cooldown（2 项）----
    { path: "cooldown.soft_rate", label: "\u8F6F\u9650\u6D41\u51B7\u5374\u57FA\u6570", type: "duration", default: "600s", restart: false, note: "\u70ED\u6539\u7ECF handler.SoftCooldown\uFF08429/6004 \u8DEF\u5F84\u9010\u8BF7\u6C42\u8BFB\u53D6\uFF09" },
    {
      path: "cooldown.soft_rate_max",
      label: "\u8F6F\u51B7\u5374\u9000\u907F\u5C01\u9876",
      type: "duration",
      default: "2h",
      restart: true,
      note: "\u7F51\u5173\u53EA\u70ED\u6539\u57FA\u6570\uFF08soft_rate\uFF09\uFF0C\u5C01\u9876\u4ECD\u5728\u88C5\u914D\u671F\u8BFB\u53D6 \u2014\u2014 \u6539\u5B83\u5FC5\u987B\u91CD\u542F"
    },
    // ---- session_sticky（3 项）----
    { path: "session_sticky.enabled", label: "\u542F\u7528\u7C98\u6027\u4F1A\u8BDD", type: "bool", default: "true", restart: true },
    { path: "session_sticky.ttl", label: "\u7ED1\u5B9A TTL", type: "duration", default: "30m", restart: true, note: "\u6EDA\u52A8\u7EED\u671F" },
    { path: "session_sticky.gc_interval", label: "GC \u5468\u671F", type: "duration", default: "5m", restart: true },
    // ---- upstream（10 项）----
    { path: "upstream.timeout_seconds", label: "\u77ED RPC \u603B\u65F6\u957F\u4E0A\u9650", type: "int", default: "120", restart: true, note: "\u5355\u4F4D\u79D2" },
    { path: "upstream.header_timeout_seconds", label: "SSE \u9996\u5B57\u8282\u4E0A\u9650", type: "int", default: "0", restart: true, note: "0 \u2192 \u56DE\u843D timeout_seconds" },
    { path: "upstream.idle_timeout_seconds", label: "SSE \u7A7A\u95F2\u4E0A\u9650", type: "int", default: "0", restart: true, note: "0 \u2192 \u56DE\u843D 300" },
    { path: "upstream.user_agent", label: "\u51FA\u7AD9 UA \u8986\u76D6", type: "string", default: "", restart: true },
    { path: "upstream.client_version", label: "UA \u7684 WorkBuddy \u7248\u672C", type: "string", default: "", restart: true },
    { path: "upstream.cli_version", label: "UA \u7684 CLI \u7248\u672C", type: "string", default: "", restart: true },
    { path: "upstream.device_token", label: "\u8BBE\u5907\u98CE\u63A7 token", type: "string", default: "", restart: true, danger: true },
    { path: "upstream.device_token_file", label: "\u8BBE\u5907 token \u6587\u4EF6", type: "string", default: "", restart: true, note: "\u8BFB\u7F13\u5B58 5 \u5206\u949F" },
    { path: "upstream.client_name", label: "\u7528\u91CF\u5F52\u5C5E\u5934", type: "string", default: "WorkBuddy", restart: true, note: "\u586B SaaS \u53EF\u8FD8\u539F\u65E7\u884C\u4E3A" },
    { path: "upstream.passthrough_ip", label: "\u900F\u4F20\u5BA2\u6237\u7AEF IP", type: "bool", default: "false", restart: true },
    // ---- global（3 项）----
    { path: "global.enabled", label: "\u542F\u7528 global \u57DF\u8DEF\u7531", type: "bool", default: "true", restart: true, note: "false = \u7EAF CN \u9501\u5B9A\uFF08\u9003\u751F\u95E8\uFF09" },
    { path: "global.chat_base", label: "chat base \u8986\u76D6", type: "string", default: "", restart: true },
    { path: "global.billing_base", label: "billing base \u8986\u76D6", type: "string", default: "", restart: true },
    // ---- prompt（2 项）----
    { path: "prompt.mode", label: "\u63D0\u793A\u8BCD\u6A21\u5F0F", type: "enum", enumValues: "passthrough,custom,append", default: "passthrough", restart: false, note: "\u975E\u6CD5\u503C\u4F1A\u5BFC\u81F4\u7F51\u5173\u542F\u52A8\u62A5\u9519\uFF1B\u70ED\u6539\u7ECF\u9010\u8BF7\u6C42\u8BFB\u53D6\u9762" },
    { path: "prompt.file", label: "\u63D0\u793A\u8BCD\u6587\u4EF6", type: "string", default: "", restart: true, note: "custom/append \u4E0B\u975E\u7A7A\u4F46\u4E0D\u53EF\u8BFB \u2192 \u542F\u52A8\u62A5\u9519" },
    // ---- upstash（2 项）----
    { path: "upstash.url", label: "Redis URL", type: "string", default: "", restart: true, note: "\u7A7A = \u7EAF\u5185\u5B58" },
    { path: "upstash.token", label: "Redis token", type: "string", default: "", restart: true, danger: true },
    // ---- features（1 项）----
    { path: "features.sanitize_blacklist_fingerprints", label: "\u9ED1\u540D\u5355\u6307\u7EB9\u8131\u654F", type: "bool", default: "true", restart: false },
    // ---- admin（1 项）----
    { path: "admin.enabled", label: "\u542F\u7528\u7BA1\u7406\u7AEF\u70B9", type: "bool", default: "false", restart: true, danger: true, note: "\u5F00\u542F\u4E14 api_key \u4E3A\u7A7A \u2192 \u7F51\u5173\u62D2\u7EDD\u542F\u52A8" },
    // ---- 顶层（4 项）----
    { path: "listen", label: "\u76D1\u542C\u5730\u5740", type: "string", default: ":7866", restart: true, note: "assembly \u671F\u6355\u83B7\uFF0C\u5FC5\u987B\u91CD\u542F" },
    { path: "api_key", label: "API key", type: "string", default: "", restart: false, danger: true, note: "\u70ED\u751F\u6548\uFF1B\u6539\u52A8\u540E\u9700\u540C\u6B65\u66F4\u65B0\u63D2\u4EF6\u8BBE\u7F6E\uFF0C\u5426\u5219\u9762\u677F\u5931\u8054" },
    { path: "auth_dir", label: "\u51ED\u8BC1\u76EE\u5F55", type: "string", default: "./auths", restart: true },
    { path: "state_file", label: "\u72B6\u6001\u843D\u76D8\u8DEF\u5F84", type: "string", default: "./data/state.json", restart: true }
  ]
);
function fieldsByGroup() {
  const grouped = new Map(CONFIG_GROUPS.map((group) => [group.id, []]));
  for (const field of CONFIG_FIELDS) {
    const groupId = field.path.includes(".") ? field.path.split(".")[0] : "top";
    const bucket = grouped.get(groupId);
    if (bucket) bucket.push(field);
  }
  return CONFIG_GROUPS.map((group) => ({ ...group, fields: grouped.get(group.id) ?? [] }));
}
function getPath(object, path) {
  let cursor = object;
  for (const segment of path.split(".")) {
    if (cursor === null || typeof cursor !== "object") return void 0;
    cursor = cursor[segment];
  }
  return cursor;
}
function coerceField(field, raw) {
  switch (field.type) {
    case "bool": {
      if (typeof raw === "boolean") return { ok: true, value: raw };
      if (raw === "true") return { ok: true, value: true };
      if (raw === "false") return { ok: true, value: false };
      return { ok: false, message: "\u5FC5\u987B\u662F true \u6216 false" };
    }
    case "int": {
      const text = String(raw).trim();
      if (!/^[+-]?\d+$/.test(text)) return { ok: false, message: "\u5FC5\u987B\u662F\u6574\u6570" };
      return { ok: true, value: Number.parseInt(text, 10) };
    }
    case "float": {
      const text = String(raw).trim();
      if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(text)) return { ok: false, message: "\u5FC5\u987B\u662F\u6570\u5B57" };
      return { ok: true, value: Number.parseFloat(text) };
    }
    case "duration": {
      const text = String(raw).trim();
      if (text === "") return { ok: false, message: "\u65F6\u957F\u4E0D\u80FD\u4E3A\u7A7A" };
      if (!DURATION_PATTERN.test(text)) {
        return { ok: false, message: `\u4E0D\u662F\u5408\u6CD5\u65F6\u957F\uFF08\u5BF9\u9F50 Go time.ParseDuration\uFF0C\u5982 30m / 1h30m / 600s\uFF09` };
      }
      return { ok: true, value: text };
    }
    case "enum": {
      const allowed = field.enumValues.split(",");
      const text = String(raw).trim();
      if (!allowed.includes(text)) return { ok: false, message: `\u53EA\u80FD\u53D6 ${field.enumValues}` };
      return { ok: true, value: text };
    }
    case "hours": {
      const text = String(raw).trim();
      if (text === "" || text === "[]") return { ok: true, value: [] };
      const body = text.replace(/^\[|\]$/g, "").trim();
      if (body === "") return { ok: true, value: [] };
      const parts = body.split(",").map((piece) => piece.trim()).filter((piece) => piece !== "");
      const hours = [];
      for (const piece of parts) {
        if (!/^\d{1,2}$/.test(piece)) return { ok: false, message: `\u975E\u6CD5\u5C0F\u65F6\u503C "${piece}"` };
        const hour = Number.parseInt(piece, 10);
        if (hour < 0 || hour > 23) return { ok: false, message: `\u5C0F\u65F6\u5FC5\u987B\u5728 0\u201323\uFF1A${hour}` };
        hours.push(hour);
      }
      return { ok: true, value: hours };
    }
    case "string":
    default: {
      return { ok: true, value: typeof raw === "string" ? raw : String(raw) };
    }
  }
}
function formatFieldValue(field, value) {
  if (value === void 0 || value === null) return "";
  if (field.type === "hours") return Array.isArray(value) ? value.join(", ") : String(value);
  if (field.type === "bool") return value ? "true" : "false";
  return String(value);
}

// client/derive.js
var CHANNEL_LABEL = {
  workbuddy: "WB",
  traework: "Trae",
  qoder: "Qoder"
};
var CHANNEL_ORDER = ["workbuddy", "traework", "qoder"];
var SCHEDULE_ITEMS = [
  { id: "checkin", icon: "\u{1F4C5}", label: "\u7B7E\u5230", hoursKey: "checkin_hours", enabledKey: "checkin_enabled" },
  { id: "activity", icon: "\u{1F5FA}", label: "\u6D3B\u8DC3\u5730\u56FE", hoursKey: "activity_hours", enabledKey: "activity_enabled" },
  { id: "travel", icon: "\u{1F431}", label: "\u732B\u732B\u65C5\u884C", hoursKey: "travel_hours", enabledKey: "travel_enabled" },
  { id: "keepalive", icon: "\u{1F511}", label: "token \u4FDD\u6D3B", hoursKey: "keepalive_hours", enabledKey: "keepalive_enabled" },
  { id: "school", icon: "\u{1F393}", label: "\u5F00\u5B66\u5B63", hoursKey: "school_hours", enabledKey: "school_enabled", subtasks: 5 },
  { id: "cat", icon: "\u{1F319}", label: "\u591C\u732B\u5B50", hoursKey: "cat_hours", enabledKey: "cat_enabled", note: "\u7A97\u53E3 23:00\u201308:00 CST" }
];
var GROWTH_CODES = [
  { code: "create_canvas", label: "\u81EA\u9020\u753B\u5E03", target: 1 },
  { code: "template_5", label: "\u4F7F\u7528\u6A21\u677F 5 \u6B21", target: 5 },
  { code: "expert_5", label: "\u53EC\u5524\u4E13\u5BB6 5 \u6B21", target: 5 },
  { code: "Expert_team_use_3", label: "\u56E2\u961F\u4E13\u5BB6 3 \u6B21", target: 3 },
  { code: "skill_1", label: "\u4F7F\u7528\u6280\u80FD 1 \u6B21", target: 1 },
  { code: "automation_1", label: "\u521B\u5EFA\u81EA\u52A8\u5316 1 \u6B21", target: 1 },
  { code: "playbook_prompt", label: "\u4F7F\u7528\u6848\u4F8B 1 \u6B21", target: 1 },
  { code: "Expert_lighthouse", label: "\u8F7B\u91CF\u4E91\u4E13\u5BB6", target: 1 },
  { code: "Buddy_App", label: "Buddy \u5E94\u7528", target: 1 },
  { code: "Buddy_App_QQ", label: "\u4F01\u9E45\u6559\u5E08\u52A9\u624B", target: 1 },
  { code: "Hp_Appearance", label: "\u66F4\u6362\u4E3B\u9898\u5916\u89C2", target: 1 },
  { code: "chat_5", label: "\u5BF9\u8BDD 5 \u6B21", target: 5 },
  { code: "Model_chat_GLM5.2", label: "GLM5.2 \u5BF9\u8BDD", target: 1 },
  { code: "black_cat", label: "\u591C\u732B\u5B50\u5BF9\u8BDD", target: 3 },
  { code: "first_buddy", label: "\u9886\u517B Buddy", target: 1 },
  { code: "RichMeow_Chat", label: "\u684C\u9762\u7AEF\u5BF9\u8BDD\u94FE", target: 1 },
  { code: "Library_read", label: "\u8D44\u6599\u5E93\u70B9\u51FB", target: 1 },
  { code: "chat_3_times", label: "\u4E0E AI \u5BF9\u8BDD 3 \u6B21", target: 3 },
  { code: "expert_use", label: "\u5F00\u5B66\u5B63\u4E13\u5BB6", target: 1 },
  { code: "share_invite", label: "\u5206\u4EAB\u7ED9\u597D\u53CB", target: 1 },
  { code: "desktop_chat_1_time", label: "\u684C\u9762\u7AEF\u5BF9\u8BDD 1 \u6B21", target: 1 },
  { code: "Sequential_Tasks_1", label: "\u5C0F\u7A0B\u5E8F\u8FDE\u7EED\u4EFB\u52A1", target: 1 },
  { code: "school_season", label: "\u6821\u56ED\u65E5\u4EFB\u52A1", target: 1 },
  { code: "Expert_Philanthropy", label: "\u516C\u76CA\u63D0\u95EE\uFF08\u4E0D\u53EF\u4EE3\u505A\uFF09", target: 1, unforgeable: true }
];
var SCHEDULED_CODES = { chat_5: "activity", black_cat: "cat" };
function accountState(account, maxInFlight) {
  const manual = account?.manual_disabled === true;
  const disabled = account?.disabled === true;
  if (manual && disabled) {
    return {
      key: "manual+disabled",
      label: "\u624B\u52A8\u505C\u7528 + \u7CFB\u7EDF\u7981\u7528",
      tone: "err",
      actions: ["enable", "revive"],
      detail: [account.manual_reason, account.disabled_reason].filter(Boolean).join(" \xB7 ")
    };
  }
  if (manual) {
    return {
      key: "manual",
      label: "\u624B\u52A8\u505C\u7528",
      tone: "err",
      actions: ["enable"],
      detail: account.manual_reason || ""
    };
  }
  if (disabled) {
    return {
      key: "disabled",
      label: "\u5DF2\u7981\u7528\uFF08\u7CFB\u7EDF\uFF09",
      tone: "err",
      actions: ["revive"],
      detail: account.disabled_reason || ""
    };
  }
  if (account?.cooling === true) {
    const kind = account.cool_kind;
    const remaining = account.cool_remaining_sec;
    let text = "\u51B7\u5374\u4E2D";
    if (kind === "soft_rate") text = "\u8F6F\u9650\u6D41\uFF08429\uFF09";
    else if (kind === "hard_credit") text = "\u79EF\u5206\u8017\u5C3D\uFF0C\u51B7\u5374\u81F3\u6B21\u65E5 04:00";
    else if (kind === "degrade") text = "\u8FDE\u8D25\u964D\u6743\u4E2D";
    else if (account.reason) text = account.reason;
    const suffix = typeof remaining === "number" && remaining > 0 ? ` \xB7 \u5269\u4F59 ${formatDuration(remaining)}` : "";
    return { key: "cooling", label: `\u51B7\u5374 \xB7 ${text}`, tone: "warn", actions: [], detail: suffix };
  }
  const limit = typeof maxInFlight === "number" ? maxInFlight : void 0;
  const inFlight = typeof account?.in_flight === "number" ? account.in_flight : 0;
  if (limit !== void 0 && limit > 0 && inFlight >= limit) {
    return {
      key: "full",
      label: `\u5728\u9014\u5360\u6EE1 ${inFlight}/${limit}`,
      tone: "warn",
      actions: [],
      detail: ""
    };
  }
  return { key: "ok", label: "\u53EF\u7528", tone: "ok", actions: ["disable"], detail: "" };
}
function formatDuration(seconds) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return "\u2014";
  const total = Math.floor(seconds);
  const day = Math.floor(total / 86400);
  const hour = Math.floor(total % 86400 / 3600);
  const minute = Math.floor(total % 3600 / 60);
  const second = total % 60;
  const parts = [];
  if (day > 0) parts.push(`${day} \u5929`);
  if (hour > 0) parts.push(`${hour} \u5C0F\u65F6`);
  if (minute > 0 && day === 0) parts.push(`${minute} \u5206`);
  if (parts.length === 0) parts.push(`${second} \u79D2`);
  return parts.slice(0, 2).join(" ");
}
function relativeTime(iso, now = Date.now()) {
  if (iso === void 0 || iso === null || iso === "") return "\u2014";
  const value = typeof iso === "number" ? iso : Date.parse(iso);
  if (!Number.isFinite(value)) return "\u2014";
  if (value <= 0) return "\u2014";
  const delta = Math.max(0, now - value);
  const seconds = Math.floor(delta / 1e3);
  if (seconds < 60) return `${seconds} \u79D2\u524D`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} \u5206\u949F\u524D`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} \u5C0F\u65F6\u524D`;
  return `${Math.floor(seconds / 86400)} \u5929\u524D`;
}
function isZeroTime(iso) {
  if (typeof iso !== "string" || iso === "") return true;
  return Date.parse(iso) <= 0;
}
function formatNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "\u2014";
  return value.toLocaleString("en-US");
}
function formatCompact(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "\u2014";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${trimUnit(value / 1e12)}\u4E07\u4EBF`;
  if (abs >= 1e8) return `${trimUnit(value / 1e8)}\u4EBF`;
  if (abs >= 1e4) return `${trimUnit(value / 1e4)}W`;
  return formatNumber(Math.round(value));
}
function trimUnit(value) {
  const abs = Math.abs(value);
  const text = abs >= 100 ? value.toFixed(0) : abs >= 10 ? value.toFixed(1) : value.toFixed(2);
  return text.replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}
function groupByChannel(accounts, channelOf = () => "workbuddy") {
  const buckets = /* @__PURE__ */ new Map();
  for (const id of CHANNEL_ORDER) {
    buckets.set(id, { id, label: CHANNEL_LABEL[id] ?? id, credits: 0, creditsTotal: 0, count: 0 });
  }
  for (const account of accounts ?? []) {
    const id = channelOf(account) || "workbuddy";
    if (!buckets.has(id)) {
      buckets.set(id, { id, label: CHANNEL_LABEL[id] ?? id, credits: 0, creditsTotal: 0, count: 0 });
    }
    const bucket = buckets.get(id);
    bucket.credits += typeof account?.credits === "number" ? account.credits : 0;
    bucket.creditsTotal += typeof account?.credits_total === "number" ? account.credits_total : 0;
    bucket.count += 1;
  }
  const channels = [...buckets.values()].filter((bucket) => bucket.count > 0 || CHANNEL_ORDER.includes(bucket.id));
  return {
    total: channels.reduce((sum, bucket) => sum + bucket.credits, 0),
    creditsTotal: channels.reduce((sum, bucket) => sum + bucket.creditsTotal, 0),
    channels
  };
}
function earnedCredits(accounts = [], creditsByUid = {}) {
  let total = 0;
  let used = 0;
  let remain = 0;
  let covered = 0;
  let missing = 0;
  for (const account of Array.isArray(accounts) ? accounts : []) {
    const wrap = creditsByUid?.[account?.uid];
    const items = wrap?.available === true ? wrap?.credits?.items : void 0;
    if (!Array.isArray(items)) {
      missing += 1;
      continue;
    }
    covered += 1;
    for (const item of items) {
      const itemTotal = Number(item?.total) || 0;
      const itemUsed = Number(item?.used) || 0;
      const itemRemain = Number(item?.remain);
      total += itemTotal;
      used += itemUsed;
      remain += Number.isFinite(itemRemain) ? itemRemain : Math.max(0, itemTotal - itemUsed);
    }
  }
  return {
    total,
    used,
    remain,
    covered,
    missing,
    count: Array.isArray(accounts) ? accounts.length : 0
  };
}
function accountExpiry({ account, authAccounts = [], creditsDetail, now = Date.now() }) {
  const uid = account?.uid;
  const loginRaw = Number(account?.login_expires_at);
  if (Number.isFinite(loginRaw) && loginRaw > 0) {
    const at = loginRaw < 1e12 ? loginRaw * 1e3 : loginRaw;
    return decorateExpiry(at, "credential", now);
  }
  const auth = (Array.isArray(authAccounts) ? authAccounts : []).find((entry) => entry?.uid === uid);
  const raw = Number(auth?.expiresAt);
  if (Number.isFinite(raw) && raw > 0) {
    const at = raw < 1e12 ? raw * 1e3 : raw;
    return decorateExpiry(at, "credential", now);
  }
  const items = creditsDetail?.available === true ? creditsDetail?.credits?.items : void 0;
  if (Array.isArray(items)) {
    let nearest = NaN;
    for (const item of items) {
      if ((Number(item?.remain) || 0) <= 0) continue;
      const at = Date.parse(item?.expire_at ?? "");
      if (!Number.isFinite(at) || at <= 0) continue;
      if (!Number.isFinite(nearest) || at < nearest) nearest = at;
    }
    if (Number.isFinite(nearest)) return decorateExpiry(nearest, "package", now);
  }
  return null;
}
function decorateExpiry(at, kind, now) {
  return {
    at,
    kind,
    // 剩余天数按「还剩几个自然日」算：今天到期 = 0 天，昨天到期 = 已过期。
    days: Math.floor((at - now) / 864e5),
    expired: at <= now
  };
}
function realmAvailability(realmTotals) {
  const labels = { cn: "CN \u57DF", global: "Global \u57DF" };
  const realms = ["cn", "global"];
  return realms.filter((realm) => realm in (realmTotals ?? {})).map((realm) => {
    const entry = realmTotals[realm] ?? {};
    return {
      realm,
      label: labels[realm] ?? realm,
      healthy: entry.healthy ?? 0,
      total: entry.total ?? 0,
      cooling: entry.cooling ?? 0,
      disabled: entry.disabled ?? 0
    };
  });
}
function summaryCounters(status) {
  const sticky = status?.sticky_sessions;
  return [
    { key: "total", label: "\u8D26\u53F7\u603B\u6570", value: status?.total ?? 0, tone: "idle" },
    { key: "healthy", label: "\u5065\u5EB7", value: status?.healthy ?? 0, tone: "ok" },
    { key: "cooling", label: "\u51B7\u5374\u4E2D", value: status?.cooling ?? 0, tone: "warn" },
    { key: "in_flight_full", label: "\u5728\u9014\u5360\u6EE1", value: status?.in_flight_full ?? 0, tone: "warn" },
    ...typeof sticky === "number" ? [{ key: "sticky", label: "\u7C98\u6027\u4F1A\u8BDD", value: sticky, tone: "info" }] : []
  ];
}
function qualitySummary(account) {
  const success = account?.success_count ?? 0;
  const errTotal = account?.err_total ?? 0;
  const total = success + errTotal;
  const rate = total > 0 ? `${(success / total * 100).toFixed(1)}%` : "\u2014";
  return `${success} \u6210\u529F / ${errTotal} \u5931\u8D25 \xB7 \u6210\u529F\u7387 ${rate} \xB7 ${relativeTime(account?.last_success)}`;
}
function healthSummary(account, state) {
  const inFlight = account?.in_flight ?? 0;
  const breaker = account?.breaker_fails ?? 0;
  const parts = [state?.label ?? "\u2014", `\u5728\u9014 ${inFlight}`];
  if (breaker > 0) parts.push(`\u7194\u65AD\u8BA1\u6570 ${breaker}`);
  if (!isZeroTime(account?.breaker_until)) parts.push(`\u7194\u65AD\u81F3 ${account.breaker_until}`);
  if (account?.consecutive_fails > 0) parts.push(`\u8FDE\u8D25 ${account.consecutive_fails}`);
  return parts.join(" \xB7 ");
}
function creditsSummary(account) {
  const usable = account?.credits ?? 0;
  const totalCredits = account?.credits_total ?? 0;
  const unusable = Math.max(0, totalCredits - usable);
  const parts = [`${formatNumber(usable)} \u53EF\u7528`];
  if (unusable > 0) parts.push(`${formatNumber(unusable)} \u4E0D\u53EF\u6D88\u8017`);
  return parts.join(" \xB7 ");
}
function scheduleState(item, scheduleConfig, now = /* @__PURE__ */ new Date()) {
  const enabled = scheduleConfig?.[item.enabledKey] !== false;
  const hours = scheduleConfig?.[item.hoursKey];
  const hourList = Array.isArray(hours) ? hours : [];
  const currentHour = now.getHours();
  let inWindow = false;
  if (item.id === "cat") {
    inWindow = currentHour >= 23 || currentHour < 8;
  } else {
    inWindow = hourList.includes(currentHour);
  }
  let key;
  if (!enabled) key = "na";
  else if (hourList.length === 0 && item.id !== "cat") {
    key = "na";
  } else if (inWindow) key = "run";
  else key = "wait";
  return {
    key,
    label: item.label,
    enabled,
    hours: hourList,
    inWindow,
    // 执行结果不可得 —— 显式标注，UI 才能如实显示而不是编造。
    unknown: true
  };
}
function scheduleHoursText(item, scheduleConfig) {
  if (item.id === "cat") return "23:00\u201308:00";
  const hours = scheduleConfig?.[item.hoursKey];
  if (!Array.isArray(hours) || hours.length === 0) return "\u9ED8\u8BA4";
  return hours.map((hour) => `${String(hour).padStart(2, "0")}:00`).join(" \xB7 ");
}
function codeCoverage() {
  const total = GROWTH_CODES.length;
  const scheduled = Object.keys(SCHEDULED_CODES).length;
  return { total, scheduled, unscheduled: total - scheduled };
}
function maxInFlightOf(gatewayConfig) {
  const value = getPath(gatewayConfig ?? {}, "pool.max_in_flight");
  return typeof value === "number" ? value : void 0;
}
function realmLimitOf(gatewayConfig, realm) {
  if (realm === "global") {
    const globalTier = getPath(gatewayConfig ?? {}, "pool.max_in_flight_global");
    if (typeof globalTier === "number" && globalTier > 0) return globalTier;
  }
  return maxInFlightOf(gatewayConfig);
}
var CHANNEL_COLOR = {
  workbuddy: "#4f6ef7",
  traework: "#a855f7",
  qoder: "#06b6d4"
};
function channelColor(channel) {
  return CHANNEL_COLOR[channel] ?? "#94a3b8";
}
function activityOf(account, now = Date.now()) {
  const inFlight = Number(account?.in_flight) || 0;
  if (inFlight > 0) return { key: "busy", label: "\u5360\u7528\u4E2D", tone: "info" };
  const last = Date.parse(account?.last_success ?? "");
  if (Number.isFinite(last) && now - last < 9e4) return { key: "recent", label: "\u521A\u7528\u8FC7", tone: "ok" };
  return void 0;
}
function quickSummaryVM({ status, usage, config, now = Date.now() } = {}) {
  const accounts = Array.isArray(status?.accounts) ? status.accounts : [];
  const usableCredits = accounts.reduce((sum, account) => sum + (Number(account?.credits) || 0), 0);
  const channels = CHANNEL_ORDER.map((id) => ({ id, label: CHANNEL_LABEL[id] ?? id, count: 0, credits: 0 }));
  const byChannel = new Map(channels.map((row) => [row.id, row]));
  for (const account of accounts) {
    const raw = typeof account?.channel === "string" && account.channel !== "" ? account.channel : "workbuddy";
    const row = byChannel.get(raw) ?? byChannel.get("workbuddy");
    if (!row) continue;
    row.count += 1;
    row.credits += Number(account?.credits) || 0;
  }
  const inFlight = accounts.reduce((sum, account) => sum + (Number(account?.in_flight) || 0), 0);
  const total = Number(status?.total) || 0;
  const healthy = Number(status?.healthy) || 0;
  const window24h = usage?.total ?? void 0;
  return {
    accounts,
    total,
    healthy,
    cooling: Number(status?.cooling) || 0,
    disabled: Number(status?.disabled) || 0,
    inFlightFull: Number(status?.in_flight_full) || 0,
    inFlight,
    sticky: typeof status?.sticky_sessions === "number" ? status.sticky_sessions : void 0,
    usableCredits,
    channels: channels.filter((row) => row.count > 0 || row.id === "workbuddy"),
    healthRatio: total > 0 ? healthy / total : 0,
    /** 近 24h（**滚动窗口**，不是自然日）：请求/成功/失败/tokens。 */
    usage24h: window24h ? {
      requests: Number(window24h.requests) || 0,
      success: Number(window24h.success) || 0,
      failed: Number(window24h.failed) || 0,
      tokens: Number(window24h.total_tokens) || 0,
      credit: Number(window24h.credit) || 0
    } : void 0,
    uptimeSec: Number(status?.uptime_sec) || 0,
    version: status?.version,
    realmTotals: status?.realm_totals,
    creditsFreshness: creditsFreshness(accounts, now)
  };
}
function accountCardVM(account, params = {}) {
  const { config, maxCredits, channelOf, authAccounts, creditsByUid, now = Date.now() } = params;
  const limit = realmLimitOf(config, account?.realm);
  const state = accountState(account, limit);
  const credits = Number(account?.credits) || 0;
  const inFlight = Number(account?.in_flight) || 0;
  const target = typeof limit === "number" && limit > 0 ? limit : void 0;
  const channel = typeof account?.channel === "string" && account.channel !== "" ? account.channel : channelOf?.(account) ?? "workbuddy";
  const expiry = accountExpiry({
    account,
    authAccounts,
    creditsDetail: creditsByUid?.[account?.uid],
    now
  });
  const creditsAt = isZeroTime(account?.credits_at) ? void 0 : account?.credits_at;
  const lastSuccess = isZeroTime(account?.last_success) ? void 0 : account?.last_success;
  return {
    uid: String(account?.uid ?? ""),
    name: account?.nickname || String(account?.uid ?? "").slice(0, 8),
    realm: account?.realm,
    channel,
    channelLabel: CHANNEL_LABEL[channel] ?? channel,
    color: channelColor(channel),
    credits,
    creditsText: formatCompact(credits),
    creditsExact: formatNumber(credits),
    /** 相对池内最高余额的占比（卡片里那根横条用；0–1）。 */
    creditsRatio: maxCredits > 0 ? Math.min(1, credits / (maxCredits || 1)) : 0,
    expiring: Number(account?.credits_expiring) || 0,
    state,
    inFlight,
    target,
    inFlightRatio: target ? Math.min(1, inFlight / target) : 0,
    inFlightFull: Boolean(target && inFlight >= target),
    activity: activityOf(account, now),
    expiry,
    creditsAt,
    creditsAtText: creditsAt ? relativeTime(creditsAt, now) : void 0,
    lastSuccessText: lastSuccess ? relativeTime(lastSuccess, now) : void 0,
    successCount: Number(account?.success_count) || 0,
    errTotal: Number(account?.err_total) || 0
  };
}
function sparkPath(values, options = {}) {
  const { width = 96, height = 22, padding = 2 } = options;
  const list = (Array.isArray(values) ? values : []).map((value) => Number(value) || 0);
  if (list.length === 0) return { points: "", area: "", max: 0, flat: true };
  const max = Math.max(...list);
  const min = Math.min(...list);
  const span = max - min || 1;
  const flat = max === min;
  const stepX = list.length > 1 ? (width - padding * 2) / (list.length - 1) : 0;
  const pointAt = (value, index) => {
    const x = padding + index * stepX;
    const y = flat ? height / 2 : height - padding - (value - min) / span * (height - padding * 2);
    return [Number(x.toFixed(2)), Number(y.toFixed(2))];
  };
  const points = list.map((value, index) => pointAt(value, index).join(",")).join(" ");
  const first = pointAt(list[0], 0);
  const last = pointAt(list[list.length - 1], list.length - 1);
  const area = `${first[0]},${height - padding} ${points} ${last[0]},${height - padding}`;
  return { points, area, max, flat };
}
function channelResolver(authFiles) {
  const byUid = /* @__PURE__ */ new Map();
  for (const entry of authFiles ?? []) {
    if (entry?.uid) byUid.set(entry.uid, resolveChannel(entry.channel, entry.domain));
  }
  return (account) => {
    if (typeof account?.channel === "string" && account.channel !== "") {
      return account.channel;
    }
    return byUid.get(account?.uid) ?? "workbuddy";
  };
}
function resolveChannel(explicit, domain) {
  const trimmed = typeof explicit === "string" ? explicit.trim().toLowerCase() : "";
  if (trimmed !== "") {
    if (trimmed === "workbuddy" || trimmed === "traework" || trimmed === "qoder") return trimmed;
    return "workbuddy";
  }
  const value = typeof domain === "string" ? domain.trim().toLowerCase() : "";
  if (value.endsWith("qoder.com.cn") || value.endsWith("qoder.com")) return "qoder";
  if (value.endsWith("trae.cn") || value.endsWith("trae.com.cn") || value.endsWith("mchost.guru")) {
    return "traework";
  }
  return "workbuddy";
}
var K = 1e3;
var M = 1e3 * 1e3;
var B = 1e3 * 1e3 * 1e3;
function slotKind(slot) {
  if (typeof slot !== "string" || slot.length < 2) return "unknown";
  if (slot.startsWith("h:")) return "hour";
  if (slot.startsWith("d:")) return "day";
  return "unknown";
}
function parseSlot(slot) {
  const kind = slotKind(slot);
  if (kind === "unknown") return Number.NaN;
  const raw = slot.slice(2);
  return kind === "hour" ? Date.parse(`${raw}:00:00`) : Date.parse(`${raw}T00:00:00`);
}
function usageBySlot(buckets) {
  if (!Array.isArray(buckets)) return [];
  const table = /* @__PURE__ */ new Map();
  for (const row of buckets) {
    if (!row || typeof row.slot !== "string") continue;
    const key = row.slot;
    let entry = table.get(key);
    if (!entry) {
      entry = {
        slot: key,
        kind: slotKind(key),
        at: parseSlot(key),
        requests: 0,
        failed: 0,
        success: 0,
        promptTokens: 0,
        completionTokens: 0,
        tokens: 0,
        credit: 0,
        latencySum: 0
      };
      table.set(key, entry);
    }
    const requests = Number(row.requests) || 0;
    entry.requests += requests;
    entry.failed += Number(row.failed) || 0;
    entry.promptTokens += Number(row.prompt_tokens) || 0;
    entry.completionTokens += Number(row.completion_tokens) || 0;
    entry.tokens += Number(row.total_tokens) || 0;
    entry.credit += Number(row.credit) || 0;
    entry.latencySum += (Number(row.avg_latency_ms) || 0) * requests;
  }
  return [...table.values()].map((entry) => ({
    slot: entry.slot,
    kind: entry.kind,
    at: entry.at,
    requests: entry.requests,
    failed: entry.failed,
    success: entry.requests - entry.failed,
    promptTokens: entry.promptTokens,
    completionTokens: entry.completionTokens,
    tokens: entry.tokens,
    credit: entry.credit,
    latencyMS: entry.requests > 0 ? entry.latencySum / entry.requests : 0
  })).sort((a, b) => a.at - b.at);
}
function usageShares(rows, total) {
  const list = Array.isArray(rows) ? rows : [];
  const totalRequests = Number(total?.requests) || list.reduce((sum, row) => sum + (Number(row?.requests) || 0), 0);
  return list.map((row) => {
    const requests = Number(row?.requests) || 0;
    const failed = Number(row?.failed) || 0;
    return {
      ...row,
      share: totalRequests > 0 ? requests / totalRequests : 0,
      successRate: requests > 0 ? (requests - failed) / requests : 0
    };
  });
}
function tokenStructure(total) {
  const prompt = Number(total?.prompt_tokens) || 0;
  const completion = Number(total?.completion_tokens) || 0;
  const sum = Number(total?.total_tokens) || prompt + completion;
  const denom = sum > 0 ? sum : 1;
  return {
    prompt,
    completion,
    total: sum,
    promptShare: prompt / denom,
    completionShare: completion / denom
  };
}
function creditStock(accounts, creditsByUid, channelOf = () => "workbuddy") {
  const list = Array.isArray(accounts) ? accounts : [];
  const byChannel = /* @__PURE__ */ new Map();
  let usable = 0;
  let unusable = 0;
  for (const account of list) {
    const channel = channelOf(account) ?? "workbuddy";
    if (!byChannel.has(channel)) byChannel.set(channel, { id: channel, usable: 0, count: 0 });
    const bucket = byChannel.get(channel);
    const live = Number(account?.credits) || 0;
    bucket.usable += live;
    bucket.count += 1;
    usable += live;
    const detail = creditsByUid?.[account?.uid];
    if (detail?.available === true && detail.credits) {
      unusable += Number(detail.credits.unusable_total) || 0;
    } else {
      const upstream = Number(account?.credits_total);
      if (Number.isFinite(upstream)) unusable += Math.max(0, upstream - live);
    }
  }
  return { usable, unusable, byChannel: [...byChannel.values()], accountCount: list.length };
}
function creditBurn(usable, windowCredit, windowValue) {
  const hours = windowHours(windowValue);
  const credit = Number(windowCredit) || 0;
  const stock = Number(usable) || 0;
  if (hours === null || credit <= 0 || stock <= 0) return null;
  const perHour = credit / hours;
  const perDay = perHour * 24;
  if (!Number.isFinite(perDay) || perDay <= 0) return null;
  return { days: stock / perDay, perDay };
}
function windowHours(value) {
  const map = { "24h": 24, "72h": 72, "168h": 168, "720h": 720, "7d": 168, "30d": 720 };
  return map[value] ?? null;
}
function creditsFreshness(accounts, now = Date.now()) {
  const times = (Array.isArray(accounts) ? accounts : []).map((account) => Date.parse(account?.credits_at)).filter((value) => Number.isFinite(value) && value > 0);
  if (times.length === 0) return { oldestISO: null, stale: false };
  const oldest = Math.min(...times);
  return { oldestISO: new Date(oldest).toISOString(), stale: now - oldest > 36e5 };
}
function formatTokens(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "\u2014";
  const abs = Math.abs(value);
  if (abs >= B) return `${(value / B).toFixed(2)}B`;
  if (abs >= M) return `${(value / M).toFixed(2)}M`;
  if (abs >= K) return `${(value / K).toFixed(1)}K`;
  return String(Math.round(value));
}
function formatCredit(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "\u2014";
  if (value === 0) return "0";
  if (Math.abs(value) >= 1e3) return formatNumber(Math.round(value));
  if (Math.abs(value) >= 1) return value.toFixed(2);
  return value.toFixed(3);
}
function formatPercent(value, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "\u2014";
  return `${(value * 100).toFixed(digits)}%`;
}
function niceMax(value) {
  const max = Number(value);
  if (!Number.isFinite(max) || max <= 0) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / (power / 2)) * (power / 2);
}
function uptimeText(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return "\u2014";
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor(value % 3600 / 60);
  if (hours >= 24) return `${Math.floor(hours / 24)} \u5929 ${hours % 24} \u5C0F\u65F6`;
  if (hours > 0) return `${hours} \u5C0F\u65F6 ${minutes} \u5206`;
  if (minutes > 0) return `${minutes} \u5206`;
  return `${Math.floor(value)} \u79D2`;
}
function usageSeriesByKey(buckets, field) {
  const slots = usageBySlot(buckets).map((row) => row.slot);
  const index = new Map(slots.map((slot, i) => [slot, i]));
  const series = /* @__PURE__ */ new Map();
  for (const row of Array.isArray(buckets) ? buckets : []) {
    if (!row || typeof row.slot !== "string") continue;
    const slotIndex = index.get(row.slot);
    if (slotIndex === void 0) continue;
    const raw = row[field];
    const key = typeof raw === "string" && raw !== "" ? raw : "";
    if (key === "" && field !== "realm") continue;
    const useKey = key === "" ? "total" : key;
    if (!series.has(useKey)) series.set(useKey, new Array(slots.length).fill(0));
    series.get(useKey)[slotIndex] += Number(row.requests) || 0;
  }
  return { slots, series };
}
function usageByDay(rows) {
  const table = /* @__PURE__ */ new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const at = Number(row?.at);
    if (!Number.isFinite(at)) continue;
    const date = localDayKey(new Date(at));
    let entry = table.get(date);
    if (!entry) {
      entry = { date, requests: 0, tokens: 0, credit: 0, hours: 0, days: 0 };
      table.set(date, entry);
    }
    entry.requests += Number(row.requests) || 0;
    entry.tokens += Number(row.tokens) || 0;
    entry.credit += Number(row.credit) || 0;
    if (row.kind === "hour") entry.hours += 1;
    else entry.days += 1;
  }
  return [...table.values()].sort((a, b) => a.date < b.date ? -1 : 1);
}
function localDayKey(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function quartileThresholds(values) {
  const list = (Array.isArray(values) ? values : []).map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (list.length === 0) return [0, 0, 0, 0];
  const at = (q) => list[Math.min(list.length - 1, Math.max(0, Math.floor(q * (list.length - 1))))];
  return [at(0.25), at(0.5), at(0.75), at(1)];
}
function heatLevel(value, thresholds) {
  const v = Number(value) || 0;
  if (v <= 0) return 0;
  const [q1, q2, q3, q4] = thresholds;
  if (q1 === q4) return v >= q4 ? 4 : 1;
  if (v <= q1) return 1;
  if (v <= q2) return 2;
  if (v <= q3) return 3;
  return 4;
}
function heatGrid(days, options = {}) {
  const windowDays = Math.max(1, Number(options.windowDays) || 30);
  const list = (Array.isArray(days) ? days : []).filter((d) => d && typeof d.date === "string");
  const byDate = new Map(list.map((d) => [d.date, d]));
  const end = options.end instanceof Date ? new Date(options.end) : /* @__PURE__ */ new Date();
  end.setHours(0, 0, 0, 0);
  const first = new Date(end.getTime() - (windowDays - 1) * 864e5);
  const lead = (first.getDay() + 6) % 7;
  const weeks = Math.ceil((lead + windowDays) / 7);
  const metric = options.metric === "tokens" ? "tokens" : "requests";
  const inWindow = list.filter((d) => {
    const at = (/* @__PURE__ */ new Date(`${d.date}T00:00:00`)).getTime();
    return at >= first.getTime() && at <= end.getTime();
  });
  const nonzero = inWindow.filter((d) => (Number(d[metric]) || 0) > 0).map((d) => Number(d[metric]) || 0);
  const thresholds = quartileThresholds(nonzero);
  const cells = [];
  const monthLabels = [];
  let prevMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const monday = new Date(first.getTime() + (w * 7 - lead) * 864e5);
    const month = monday.getMonth();
    monthLabels.push(w === 0 || month !== prevMonth ? `${month + 1}\u6708` : "");
    prevMonth = month;
    for (let r = 0; r < 7; r++) {
      const cur = new Date(monday.getTime() + r * 864e5);
      const key = localDayKey(cur);
      const beforeWindow = cur.getTime() < first.getTime();
      const afterWindow = cur.getTime() > end.getTime();
      const rec = byDate.get(key);
      cells.push(
        beforeWindow || afterWindow ? { date: key, value: 0, level: 0, blank: true, outside: true, week: w } : {
          date: key,
          value: rec ? Number(rec[metric]) || 0 : 0,
          level: rec ? heatLevel(Number(rec[metric]) || 0, thresholds) : 0,
          blank: false,
          outside: false,
          week: w
        }
      );
    }
  }
  return {
    weeks,
    cells,
    monthLabels,
    metric,
    max: nonzero.length > 0 ? Math.max(...nonzero) : 0,
    activeDays: nonzero.length,
    coveredDays: inWindow.length,
    windowDays
  };
}
function hourlyProfile(rows) {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, requests: 0, tokens: 0, slots: 0 }));
  for (const row of Array.isArray(rows) ? rows : []) {
    const at = Number(row?.at);
    if (!Number.isFinite(at)) continue;
    const bucket = buckets[new Date(at).getHours()];
    bucket.requests += Number(row.requests) || 0;
    bucket.tokens += Number(row.tokens) || 0;
    bucket.slots += 1;
  }
  return buckets;
}
var BURN_DAYS_CAP = 365 * 3;
function burnDaysText(days) {
  if (days > BURN_DAYS_CAP) return ">3 \u5E74";
  return days >= 1 ? `${days.toFixed(1)} \u5929` : `${(days * 24).toFixed(1)} \u5C0F\u65F6`;
}
function tryBurn(burn, stock) {
  if (!burn) {
    return `\u53EA\u7B97\u53EF\u6D88\u8017\u989D\u5EA6\uFF0C\u4E0D\u542B\u6E20\u9053\u4E13\u7528\u6C60\u3002\u4E0D\u53EF\u6D88\u8017 ${formatNumber(Math.round(Number(stock?.unusable) || 0))}`;
  }
  return `\u6309\u7A97\u53E3\u901F\u7387\u5916\u63A8 \u2248 \u8FD8\u53EF ${burnDaysText(burn.days)}\uFF08${formatCredit(burn.perDay)} \u79EF\u5206/\u5929\uFF09\u3002\u7EBF\u6027\u5916\u63A8\uFF0C\u975E\u627F\u8BFA\uFF1B\u8D26\u672C\u53EA\u8986\u76D6\u7ECF\u672C\u7F51\u5173\u7684\u8BF7\u6C42\uFF0C\u5B9E\u9645\u504F\u4E50\u89C2\u3002\u53EA\u7B97\u53EF\u6D88\u8017\u989D\u5EA6\u3002`;
}
var DAY_RANGES = [7, 14, 30];
function daySeries(days, range) {
  const list = Array.isArray(days) ? days : [];
  const n = Math.max(1, Number(range) || 30);
  return list.slice(-n);
}
function dailyByModel(rows, buckets, days, metric = "tokens") {
  const dates = (Array.isArray(days) ? days : []).map((d) => d.date);
  const index = new Map(dates.map((date, i) => [date, i]));
  const field = metric === "requests" ? "requests" : metric === "credit" ? "credit" : "total_tokens";
  const table = /* @__PURE__ */ new Map();
  for (const bucket of Array.isArray(buckets) ? buckets : []) {
    if (!bucket || typeof bucket.slot !== "string") continue;
    const at = parseSlot(bucket.slot);
    if (!Number.isFinite(at)) continue;
    const date = localDayKey(new Date(at));
    const slotIndex = index.get(date);
    if (slotIndex === void 0) continue;
    const key = typeof bucket.model === "string" && bucket.model !== "" ? bucket.model : "\uFF08\u672A\u6807\u6CE8\u6A21\u578B\uFF09";
    if (!table.has(key)) table.set(key, { key, values: new Array(dates.length).fill(0), total: 0 });
    const value = Number(bucket[field]) || 0;
    table.get(key).values[slotIndex] += value;
    table.get(key).total += value;
  }
  const series = [...table.values()].sort((a, b) => b.total - a.total);
  return { dates, series, field };
}
var RANK_METRICS = [
  { id: "tokens", field: "total_tokens", label: "Tokens", format: formatTokens },
  { id: "requests", field: "requests", label: "\u8BF7\u6C42", format: formatNumber },
  { id: "credit", field: "credit", label: "\u79EF\u5206", format: formatCredit }
];
var DEFAULT_RANK_METRIC = "tokens";
function rankMetric(id) {
  return RANK_METRICS.find((item) => item.id === id) ?? RANK_METRICS[0];
}
function metricGrandTotal(total, rows, metric) {
  const field = rankMetric(metric).field;
  const fromTotal = Number(total?.[field]);
  if (Number.isFinite(fromTotal) && fromTotal > 0) return fromTotal;
  return rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
}
function accountShares(rows, total, accounts = [], channelOf = () => "workbuddy", metric = DEFAULT_RANK_METRIC) {
  const shares = usageShares(rows, total);
  const byUid = new Map((Array.isArray(accounts) ? accounts : []).map((a) => [a?.uid, a]));
  const field = rankMetric(metric).field;
  const decorated = shares.map((row) => {
    const account = byUid.get(row.key);
    return {
      ...row,
      name: account?.nickname || (row.key ? `${String(row.key).slice(0, 8)}\u2026` : "\uFF08\u672A\u9009\u53F7\uFF09"),
      channel: account ? channelOf(account) ?? "workbuddy" : "",
      tokens: Number(row.total_tokens) || 0,
      credit: Number(row.credit) || 0,
      value: Number(row[field]) || 0
    };
  });
  const grand = metricGrandTotal(total, decorated, metric);
  const max = Math.max(...decorated.map((row) => row.value), 1);
  return decorated.map((row) => ({
    ...row,
    share: grand > 0 ? row.value / grand : 0,
    barShare: row.value / max
  })).sort((a, b) => b.value - a.value);
}
function channelShares(rows, total, accounts = [], channelOf = () => "workbuddy", metric = DEFAULT_RANK_METRIC) {
  const accountsRows = accountShares(rows, total, accounts, channelOf, metric);
  const table = /* @__PURE__ */ new Map();
  for (const row of accountsRows) {
    const key = row.channel || "unknown";
    if (!table.has(key)) {
      table.set(key, {
        key,
        requests: 0,
        tokens: 0,
        credit: 0,
        failed: 0,
        success: 0,
        accounts: 0,
        value: 0
      });
    }
    const entry = table.get(key);
    entry.requests += Number(row.requests) || 0;
    entry.tokens += row.tokens;
    entry.credit += row.credit;
    entry.failed += Number(row.failed) || 0;
    entry.success += Number(row.success) || 0;
    entry.value += row.value;
    entry.accounts += 1;
  }
  const list = [...table.values()].sort((a, b) => b.value - a.value);
  const grand = metricGrandTotal(total, accountsRows, metric);
  const max = Math.max(...list.map((entry) => entry.value), 1);
  return list.map((entry) => ({
    ...entry,
    share: grand > 0 ? entry.value / grand : 0,
    barMax: entry.value / max
  }));
}
function kpiCards({ total, stock, days, burn }) {
  const requests = Number(total?.requests) || 0;
  const failed = Number(total?.failed) || 0;
  const credit = Number(total?.credit) || 0;
  const structure = tokenStructure(total);
  const usable = Math.round(Number(stock?.usable) || 0);
  const list = Array.isArray(days) ? days : [];
  const active = list.filter((day) => (Number(day.requests) || 0) > 0);
  const hit = hitRate(total);
  const latency = Number(total?.avg_latency_ms);
  return [
    {
      key: "tokens",
      label: "Tokens\u6D88\u8017",
      value: formatTokens(structure.total),
      // raw + kind：KPI 卡对**原始数**做入场动效、再按同一格式化器回写。
      // 对已格式化字符串反解（"18.9k" → 18.9）会把单位当数量级，动效会显示 0k。
      raw: structure.total,
      kind: "tokens",
      detail: `\u8F93\u5165 ${formatTokens(structure.prompt)} \xB7 \u8F93\u51FA ${formatTokens(structure.completion)}`,
      title: `\u7A97\u53E3\u5185 prompt + completion \u5408\u8BA1 ${formatNumber(structure.total)}\uFF08\u4E24\u6BB5\u4E92\u65A5\uFF0C\u76F8\u52A0\u4E0D\u91CD\u590D\u8BA1\uFF09`
    },
    {
      key: "credit",
      label: "\u79EF\u5206\u6D88\u8017",
      value: formatCompact(credit),
      raw: credit,
      kind: "compact",
      detail: requests > 0 ? `\u6BCF\u8BF7\u6C42 ${formatCredit(credit / requests)}` : "\u7A97\u53E3\u5185\u65E0\u8BF7\u6C42",
      tone: "ok",
      title: `\u7A97\u53E3\u5185\u771F\u5B9E\u6263\u8D39\u5408\u8BA1 ${formatCredit(credit)}\uFF08\u7F51\u5173\u8D26\u672C\u53E3\u5F84\uFF09`
    },
    {
      key: "stock",
      label: "\u53EF\u7528\u79EF\u5206",
      value: formatCompact(usable),
      raw: usable,
      kind: "compact",
      detail: burn ? `\u2248 \u8FD8\u53EF ${burnDaysText(burn.days)}` : `\u6D3B\u8DC3 ${active.length} \u5929`,
      tone: "ok",
      title: burn ? tryBurn(burn, stock) : `\u53EA\u7B97\u53EF\u6D88\u8017\u989D\u5EA6\uFF0C\u4E0D\u542B\u6E20\u9053\u4E13\u7528\u6C60\u3002\u7A97\u53E3\u5185 ${list.length} \u5929\u4E2D\u6709 ${active.length} \u5929\u6709\u8BF7\u6C42`
    },
    {
      key: "requests",
      label: "\u8BF7\u6C42\u6570",
      value: formatCompact(requests),
      raw: requests,
      kind: "compact",
      detail: `\u6210\u529F ${formatNumber(requests - failed)} \xB7 \u5931\u8D25 ${formatNumber(failed)}`,
      title: "\u7F51\u5173\u65E0\u4F1A\u8BDD\u6982\u5FF5\uFF0C\u6545\u8FD9\u91CC\u5982\u5B9E\u7ED9\u8BF7\u6C42\u6570\uFF08\u4E0D\u7F16\u9020\u300C\u4F1A\u8BDD\u6570\u300D\uFF09"
    },
    {
      key: "cache",
      label: "\u7F13\u5B58\u547D\u4E2D",
      // 「没有观测」与「命中率为 0」是两件事：无观测显示 —，不显示 0%。
      value: hit === null ? "\u2014" : formatPercent(hit, 1),
      raw: hit ?? 0,
      kind: "percent",
      detail: hit === null ? "\u7A97\u53E3\u5185\u65E0\u7F13\u5B58\u89C2\u6D4B" : `\u547D\u4E2D ${formatTokens(Number(total?.cache_hit_tokens) || 0)} \xB7 \u672A\u547D\u4E2D ${formatTokens(Number(total?.cache_miss_tokens) || 0)}`,
      title: "\u7A97\u53E3\u5206\u6876\u53E3\u5F84\uFF1A\u547D\u4E2D /\uFF08\u547D\u4E2D + \u672A\u547D\u4E2D\uFF09\uFF0C\u5199\u5165\u4E0D\u8BA1\u5165\u5206\u6BCD\u3002\u8FDB\u7A0B\u7D2F\u8BA1\u53E3\u5F84\u7684\u547D\u4E2D\u7387\u89C1\u4E0B\u65B9\u6298\u53E0\u533A\uFF08\u4E24\u8005\u4E0D\u53EF\u6DF7\u7B97\uFF09"
    },
    {
      key: "latency",
      label: "\u5E73\u5747\u5EF6\u8FDF",
      value: Number.isFinite(latency) && latency > 0 ? latencyText(latency) : "\u2014",
      raw: Number.isFinite(latency) ? latency : 0,
      kind: "ms",
      detail: requests > 0 ? `\u6309\u8BF7\u6C42\u6570\u52A0\u6743 \xB7 ${formatNumber(requests)} \u6B21` : "\u7A97\u53E3\u5185\u65E0\u8BF7\u6C42",
      title: "\u7A97\u53E3\u5206\u6876\u53E3\u5F84\uFF1A\u9010\u69FD\u5747\u503C\u6309\u8BF7\u6C42\u6570\u52A0\u6743\u540E\u7684\u7AEF\u5230\u7AEF\u8017\u65F6\uFF08\u4E0E /v1/stats \u7684\u8FDB\u7A0B\u7D2F\u8BA1\u5747\u503C\u662F\u4E24\u4E2A\u53E3\u5F84\uFF09"
    }
  ];
}
function latencyText(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value) || value <= 0) return "\u2014";
  return value >= 1e3 ? `${(value / 1e3).toFixed(1)} s` : `${Math.round(value)} ms`;
}
function hitRate(row) {
  const hit = Number(row?.cache_hit_tokens) || 0;
  const miss = Number(row?.cache_miss_tokens) || 0;
  const denom = hit + miss;
  if (denom <= 0) return null;
  return hit / denom;
}

// client/endpoints.js
var ENDPOINTS = {
  getStatus: "getStatus",
  refreshStatus: "refreshStatus",
  getModels: "getModels",
  getStats: "getStats",
  probe: "probe",
  getConfig: "getConfig",
  saveConfig: "saveConfig",
  getAccounts: "getAccounts",
  getCredits: "getCredits",
  getGrowthTasks: "getGrowthTasks",
  getSchoolTasks: "getSchoolTasks",
  getUsage: "getUsage",
  getLogs: "getLogs",
  getTasks: "getTasks",
  runTask: "runTask",
  growthWrite: "growthWrite",
  taskScan: "taskScan",
  taskQueueStart: "taskQueueStart",
  taskQueueStatus: "taskQueueStatus",
  schoolStatusAll: "schoolStatusAll",
  schoolVouchersAll: "schoolVouchersAll",
  accountMore: "accountMore",
  accountDisable: "accountDisable",
  accountEnable: "accountEnable",
  accountRevive: "accountRevive",
  loginStart: "loginStart",
  loginPoll: "loginPoll",
  loginCallback: "loginCallback",
  getChannels: "getChannels",
  serviceControl: "serviceControl",
  revealApiKey: "revealApiKey"
};
var CHANNEL = "/dsh-chanhub";

// client/add-account.js
var import_react2 = __toESM(require("react"), 1);
var CHANNEL_LABEL2 = { workbuddy: "WorkBuddy", traework: "TraeWork", qoder: "QoderWork" };
var CHANNEL_REALMS = {
  workbuddy: [
    { id: "cn", label: "\u56FD\u5185\u7248", note: "copilot.tencent.com" },
    { id: "global", label: "\u56FD\u9645\u7248", note: "www.workbuddy.ai" }
  ],
  traework: [{ id: "cn", label: "\u9ED8\u8BA4", note: "trae.cn" }],
  qoder: [{ id: "cn", label: "\u9ED8\u8BA4", note: "qoder.com.cn" }]
};
var POLL_INTERVAL_MS = 2500;
var MAX_POLL_ATTEMPTS = 360;
function RadioRow({ label, options, value, onChange }) {
  return import_react2.default.createElement(
    "div",
    { className: "dshc-row", style: { marginBottom: 10 } },
    import_react2.default.createElement("span", { style: { ...s.muted, width: 52, flexShrink: 0 } }, label),
    ...options.map(
      (option) => import_react2.default.createElement(
        "button",
        {
          key: option.id,
          type: "button",
          className: `dshc-choice${option.id === value ? " on" : ""}`,
          disabled: options.length === 1,
          title: option.note,
          onClick: () => onChange(option.id)
        },
        option.label,
        option.note ? import_react2.default.createElement("span", { className: "dshc-choice-note" }, option.note) : null
      )
    )
  );
}
function AddAccountDialog({ channels, realms, onStart, onPoll, onCallback, onClose, onDone }) {
  const available = Array.isArray(channels) && channels.length > 0 ? channels : [];
  const [channel, setChannel] = import_react2.default.useState(available[0] ?? "");
  const [realm, setRealm] = import_react2.default.useState("cn");
  const [phase, setPhase] = import_react2.default.useState("idle");
  const [url, setUrl] = import_react2.default.useState("");
  const [message, setMessage] = import_react2.default.useState("");
  const [error, setError] = import_react2.default.useState("");
  const [result, setResult] = import_react2.default.useState(null);
  const [callbackUrl, setCallbackUrl] = import_react2.default.useState("");
  const [needsPaste, setNeedsPaste] = import_react2.default.useState(false);
  const [pasted, setPasted] = import_react2.default.useState("");
  const [pasting, setPasting] = import_react2.default.useState(false);
  const [pasteError, setPasteError] = import_react2.default.useState("");
  const timer = import_react2.default.useRef(null);
  const attempts = import_react2.default.useRef(0);
  const generation = import_react2.default.useRef(0);
  const stopPolling = import_react2.default.useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);
  import_react2.default.useEffect(() => stopPolling, [stopPolling]);
  const pollOnce = import_react2.default.useCallback(
    (gen) => {
      timer.current = setTimeout(async () => {
        if (generation.current !== gen) return;
        attempts.current += 1;
        if (attempts.current > MAX_POLL_ATTEMPTS) {
          setPhase("error");
          setError(
            `\u7B49\u5F85\u8D85\u65F6\uFF08\u7EA6 ${Math.round(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 6e4)} \u5206\u949F\u672A\u5B8C\u6210\uFF09\u3002\u82E5\u6D4F\u89C8\u5668\u5DF2\u63D0\u793A\u300C\u65E0\u6CD5\u8BBF\u95EE\u6B64\u7F51\u7AD9\u300D\uFF0C\u8BF4\u660E Trae \u672A\u80FD\u81EA\u52A8\u8DF3\u56DE\u9762\u677F \u2014\u2014 \u8BF7\u7528\u4E0A\u65B9\u7684\u300C\u7C98\u8D34\u56DE\u8C03\u94FE\u63A5\u300D\u5B8C\u6210\u767B\u5F55\uFF0C\u6216\u91CD\u65B0\u53D1\u8D77\u3002`
          );
          return;
        }
        try {
          const res = await onPoll(channel);
          if (generation.current !== gen) return;
          if (res?.ok === false) {
            setPhase("error");
            setError(res.error?.message ?? "\u8F6E\u8BE2\u5931\u8D25");
            return;
          }
          const value = res?.value ?? {};
          if (value.status === "done") {
            setPhase("done");
            setResult(value);
            setMessage(value.checkin_message || "");
            void onDone?.();
            return;
          }
          if (value.status === "error") {
            setPhase("error");
            setError(value.error ?? "\u767B\u5F55\u5931\u8D25");
            return;
          }
          setPhase("awaiting");
          pollOnce(gen);
        } catch (err) {
          if (generation.current !== gen) return;
          setPhase("error");
          setError(err?.message ?? String(err));
        }
      }, POLL_INTERVAL_MS);
    },
    [channel, onPoll, onDone]
  );
  const start = import_react2.default.useCallback(async () => {
    stopPolling();
    generation.current += 1;
    const gen = generation.current;
    attempts.current = 0;
    setPhase("idle");
    setError("");
    setResult(null);
    setCallbackUrl("");
    setPasted("");
    setPasteError("");
    setMessage("\u6B63\u5728\u83B7\u53D6\u6388\u6743\u94FE\u63A5\u2026");
    try {
      const res = await onStart(channel, realm);
      if (res?.ok === false) {
        setPhase("error");
        setMessage("");
        setError(res.error?.message ?? "\u53D1\u8D77\u767B\u5F55\u5931\u8D25");
        return;
      }
      const value = res?.value ?? {};
      if (typeof value.url !== "string" || value.url === "") {
        setPhase("error");
        setMessage("");
        setError("\u7F51\u5173\u672A\u8FD4\u56DE\u6388\u6743\u94FE\u63A5");
        return;
      }
      setUrl(value.url);
      setMessage("");
      setPhase("awaiting");
      setNeedsPaste(value.needs_paste === true);
      setCallbackUrl(typeof value.callback_url === "string" ? value.callback_url : "");
      if (typeof window !== "undefined") window.open(value.url, "_blank", "noopener,noreferrer");
      pollOnce(gen);
    } catch (err) {
      setPhase("error");
      setMessage("");
      setError(err?.message ?? String(err));
    }
  }, [channel, realm, onStart, pollOnce, stopPolling]);
  const submitPasted = import_react2.default.useCallback(async () => {
    const raw = pasted.trim();
    if (raw === "") {
      setPasteError("\u8BF7\u5148\u7C98\u8D34\u56DE\u8C03\u94FE\u63A5\uFF08\u6D4F\u89C8\u5668\u5730\u5740\u680F\u91CC\u7684\u5B8C\u6574\u5730\u5740\uFF09");
      return;
    }
    setPasting(true);
    setPasteError("");
    try {
      const res = await onCallback?.(channel, raw);
      if (res?.ok === false) {
        setPasteError(res.error?.message ?? "\u63D0\u4EA4\u5931\u8D25");
        return;
      }
      const value = res?.value ?? {};
      if (value.status !== "received") {
        setPasteError(value.error ?? "\u7F51\u5173\u672A\u63A5\u53D7\u8BE5\u56DE\u8C03");
        return;
      }
      setPasted("");
      setMessage("\u56DE\u8C03\u5DF2\u63D0\u4EA4\uFF0C\u6B63\u5728\u6362\u53D6\u51ED\u8BC1\u2026");
    } catch (err) {
      setPasteError(err?.message ?? String(err));
    } finally {
      setPasting(false);
    }
  }, [pasted, onCallback, channel]);
  const close = import_react2.default.useCallback(() => {
    generation.current += 1;
    stopPolling();
    onClose();
  }, [onClose, stopPolling]);
  import_react2.default.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close]);
  if (available.length === 0) {
    return import_react2.default.createElement(
      "div",
      null,
      import_react2.default.createElement("div", { className: "dshc-drawer-mask", onClick: close }),
      import_react2.default.createElement(
        "div",
        { className: "dshc-dialog" },
        import_react2.default.createElement("button", { type: "button", className: "dshc-drawer-close", onClick: close, title: "\u5173\u95ED" }, "\u2715"),
        import_react2.default.createElement("div", { style: { ...s.label, marginBottom: 8 } }, "\u6DFB\u52A0\u8D26\u53F7"),
        import_react2.default.createElement(
          "div",
          { style: s.warn },
          "\u7F51\u5173\u672A\u63D0\u4F9B\u53EF\u7528\u7684\u767B\u5F55\u6E20\u9053 \u2014\u2014 \u9700\u5728 chanhub \u4FA7\u542F\u7528 /panel/api/login/*\uFF08\u542B workbuddy \u5206\u652F\uFF09\u3002",
          "\u5347\u7EA7\u7F51\u5173\u540E\u91CD\u65B0\u6253\u5F00\u672C\u5F39\u7A97\u3002"
        )
      )
    );
  }
  const realmOptions = CHANNEL_REALMS[channel] ?? [{ id: "cn", label: "\u9ED8\u8BA4", note: "" }];
  const allowedRealms = Array.isArray(realms) && realms.length > 0 ? realms : ["cn"];
  const visibleRealmOptions = realmOptions.filter((o) => allowedRealms.includes(o.id));
  return import_react2.default.createElement(
    "div",
    null,
    import_react2.default.createElement("div", { className: "dshc-drawer-mask", onClick: close }),
    import_react2.default.createElement(
      "div",
      { className: "dshc-dialog", role: "dialog", "aria-label": "\u6DFB\u52A0\u8D26\u53F7" },
      import_react2.default.createElement("button", { type: "button", className: "dshc-drawer-close", onClick: close, title: "\u5173\u95ED" }, "\u2715"),
      import_react2.default.createElement("div", { style: { ...s.label, marginBottom: 12 } }, "\u6DFB\u52A0\u8D26\u53F7"),
      // 表单（awaiting 之后锁住，避免中途换渠道导致 state 对不上）
      import_react2.default.createElement(RadioRow, {
        label: "\u6E20\u9053",
        options: available.map((id) => ({ id, label: CHANNEL_LABEL2[id] ?? id })),
        value: channel,
        onChange: (id) => {
          setChannel(id);
          generation.current += 1;
          attempts.current = 0;
          stopPolling();
          setPhase("idle");
          setUrl("");
          setResult(null);
          setError("");
          setCallbackUrl("");
          setPasted("");
          setPasteError("");
        }
      }),
      import_react2.default.createElement(RadioRow, {
        label: "\u57DF",
        options: visibleRealmOptions,
        value: realm,
        onChange: (id) => {
          setRealm(id);
          generation.current += 1;
          attempts.current = 0;
          stopPolling();
          setPhase("idle");
          setUrl("");
          setResult(null);
          setError("");
          setCallbackUrl("");
          setPasted("");
          setPasteError("");
        }
      }),
      phase === "idle" ? import_react2.default.createElement(
        "button",
        { type: "button", style: { ...s.btnPri, width: "100%", justifyContent: "center", marginTop: 4 }, onClick: start },
        message || "\u83B7\u53D6\u6388\u6743\u94FE\u63A5"
      ) : null,
      // 授权链接：无论自动打开是否成功，链接始终可见可复制。
      phase === "awaiting" || phase === "done" ? import_react2.default.createElement(
        "div",
        { style: { ...s.tip, marginTop: 8 } },
        import_react2.default.createElement(
          "div",
          { style: { marginBottom: 6 } },
          phase === "awaiting" ? needsPaste ? "\u2460 \u5728\u65B0\u6253\u5F00\u7684\u9875\u9762\u5B8C\u6210\u767B\u5F55\u3000\u2461 \u6309\u4E0B\u65B9\u8BF4\u660E\u628A\u5730\u5740\u680F\u5185\u5BB9\u7C98\u56DE\u6765" : "\u2460 \u5728\u65B0\u6253\u5F00\u7684\u9875\u9762\u5B8C\u6210\u767B\u5F55\u3000\u2461 \u56DE\u5230\u672C\u9762\u677F\uFF0C\u65E0\u9700\u5176\u4ED6\u64CD\u4F5C" : "\u767B\u5F55\u5DF2\u5B8C\u6210\uFF0C\u4EE5\u4E0B\u94FE\u63A5\u5DF2\u5931\u6548\u3002"
        ),
        import_react2.default.createElement("a", {
          href: url,
          target: "_blank",
          rel: "noopener noreferrer",
          style: { ...s.code, color: tone.info.fg, display: "block", wordBreak: "break-all" }
        }, url)
      ) : null,
      phase === "awaiting" ? import_react2.default.createElement(
        "div",
        { className: "dshc-row", style: { marginTop: 10, gap: 6 } },
        import_react2.default.createElement("span", { className: "dshc-spinner" }),
        import_react2.default.createElement("span", { style: s.muted }, "\u7B49\u5F85\u6388\u6743\u5B8C\u6210\u2026\uFF08\u6BCF 2.5 \u79D2\u81EA\u52A8\u68C0\u67E5\uFF09")
      ) : null,
      // 粘贴完成（traework）。Trae 授权页硬性要求回调地址为
      // http://127.0.0.1:<端口>/authorize，远端浏览器**必然**打不开该地址，
      // 但登录成功后地址栏里就带着凭证 —— 复制回这里即可完成。
      //
      // 常驻渲染（不只在超时后）：这个「打不开」是必然发生的，不是异常情况，
      // 等超时才提示等于让用户先困惑一次。
      (phase === "awaiting" || phase === "error") && needsPaste ? import_react2.default.createElement(
        "div",
        { style: { ...s.tip, marginTop: 10 } },
        import_react2.default.createElement(
          "div",
          { style: { marginBottom: 6 } },
          "\u628A\u6D4F\u89C8\u5668\u5730\u5740\u680F\u91CC\u7684\u5185\u5BB9\u590D\u5236\u5230\u4E0B\u9762\u5B8C\u6210\u767B\u5F55\uFF1A"
        ),
        import_react2.default.createElement(
          "div",
          { style: { ...s.muted, marginBottom: 6 } },
          "\u767B\u5F55\u6210\u529F\u540E\u6D4F\u89C8\u5668\u4F1A\u8DF3\u5230\u4E00\u4E2A\u6253\u4E0D\u5F00\u7684\u5730\u5740\uFF08\u8FD9\u662F Trae \u7684\u9650\u5236\uFF0C\u4E0D\u662F\u6545\u969C\uFF09\u3002",
          "\u90A3\u4E2A\u9875\u9762\u7684**\u5730\u5740\u680F\u91CC\u5E26\u7740\u767B\u5F55\u51ED\u8BC1** \u2014\u2014 \u6574\u6BB5\u590D\u5236\u8FC7\u6765\u5373\u53EF\u3002"
        ),
        import_react2.default.createElement(
          "div",
          { style: { ...s.muted, marginBottom: 8, wordBreak: "break-all" } },
          `\u4F60\u4F1A\u770B\u5230\u7684\u5730\u5740\u5F62\u5982\uFF1A${callbackUrl || "http://127.0.0.1:<\u7AEF\u53E3>/authorize"}?refreshToken=\u2026`
        ),
        import_react2.default.createElement("textarea", {
          value: pasted,
          onChange: (e) => {
            setPasted(e.target.value);
            if (pasteError) setPasteError("");
          },
          placeholder: "\u7C98\u8D34\u5730\u5740\u680F\u91CC\u7684\u5B8C\u6574\u5730\u5740",
          rows: 2,
          spellCheck: false,
          style: {
            width: "100%",
            boxSizing: "border-box",
            fontFamily: "monospace",
            fontSize: 11,
            padding: "6px 8px",
            resize: "vertical",
            marginBottom: 8
          }
        }),
        import_react2.default.createElement(
          "button",
          {
            type: "button",
            disabled: pasting || pasted.trim() === "",
            style: { ...s.btnGhost, width: "100%", justifyContent: "center" },
            onClick: submitPasted
          },
          pasting ? "\u63D0\u4EA4\u4E2D\u2026" : "\u63D0\u4EA4\u5E76\u5B8C\u6210\u767B\u5F55"
        ),
        pasteError ? import_react2.default.createElement("div", { style: { ...s.err, marginTop: 6 } }, pasteError) : null,
        import_react2.default.createElement(
          "div",
          { style: { ...s.muted, marginTop: 6 } },
          "\u63D0\u793A\uFF1A\u8BE5\u5730\u5740\u5305\u542B\u4E00\u6B21\u6027\u767B\u5F55\u51ED\u8BC1\uFF0C\u4EC5\u63D0\u4EA4\u7ED9\u672C\u7F51\u5173\uFF0C\u52FF\u8F6C\u53D1\u4ED6\u4EBA\u3002"
        )
      ) : null,
      phase === "done" && result ? import_react2.default.createElement(
        "div",
        { style: { ...s.card, marginTop: 12, marginBottom: 0, padding: "12px 14px" } },
        import_react2.default.createElement(
          "div",
          { className: "dshc-row", style: { gap: 8, marginBottom: 6 } },
          import_react2.default.createElement("span", { style: { ...s.label } }, "\u2713 \u5DF2\u6DFB\u52A0"),
          result.nickname ? import_react2.default.createElement("span", { style: s.muted }, result.nickname) : null,
          result.realm ? import_react2.default.createElement("span", { style: s.muted }, result.realm === "global" ? "\u56FD\u9645\u7248" : "\u56FD\u5185\u7248") : null
        ),
        import_react2.default.createElement(
          "div",
          { style: s.muted },
          import_react2.default.createElement("div", null, `UID\u3000${result.uid}`),
          typeof result.credits === "number" && result.credits >= 0 ? import_react2.default.createElement("div", null, `\u79EF\u5206\u3000${result.credits}`) : null,
          import_react2.default.createElement("div", null, "\u51ED\u8BC1\u5DF2\u843D\u76D8\u5E76\u70ED\u52A0\u8F7D\u8FDB\u6C60\uFF0C\u65E0\u9700\u91CD\u542F\u7F51\u5173\u3002")
        ),
        message ? import_react2.default.createElement("div", { style: { ...s.muted, marginTop: 6 } }, message) : null
      ) : null,
      phase === "error" ? import_react2.default.createElement(
        "div",
        { style: { marginTop: 10 } },
        import_react2.default.createElement("div", { style: s.err }, error),
        import_react2.default.createElement("button", {
          type: "button",
          style: { ...s.btnGhost, marginTop: 8, width: "100%", justifyContent: "center" },
          onClick: () => {
            setPhase("idle");
            setError("");
          }
        }, "\u91CD\u65B0\u5F00\u59CB")
      ) : null
    )
  );
}

// client/usage/index.js
var import_react5 = __toESM(require("react"), 1);

// client/usage/api.js
var USAGE_CACHE_VERSION = 1;
var CACHE_KEY = `dsh-chanhub:usage:v${USAGE_CACHE_VERSION}`;
function isUsableCache(value) {
  if (!value || typeof value !== "object") return false;
  if (value.version !== USAGE_CACHE_VERSION) return false;
  const payload = value.payload;
  if (!payload || typeof payload !== "object") return false;
  const usage = payload.usage;
  if (!usage || typeof usage !== "object") return false;
  if (!Array.isArray(usage.buckets)) return false;
  if (!usage.total || typeof usage.total !== "object") return false;
  if (!Array.isArray(usage.by_uid) || !Array.isArray(usage.by_model)) return false;
  if (typeof value.savedAt !== "number") return false;
  return true;
}
function loadCachedUsage() {
  try {
    const raw = storage()?.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isUsableCache(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
function saveCachedUsage(payload) {
  try {
    storage()?.setItem(
      CACHE_KEY,
      JSON.stringify({ version: USAGE_CACHE_VERSION, savedAt: Date.now(), payload })
    );
  } catch {
  }
}
function storage() {
  try {
    return globalThis.localStorage ?? globalThis.window?.localStorage ?? void 0;
  } catch {
    return void 0;
  }
}
async function fetchUsage(rpcCall) {
  const [usageResult, statsResult] = await Promise.all([
    rpcCall(ENDPOINTS.getUsage, { window: "720h" }),
    rpcCall(ENDPOINTS.getStats, {})
  ]);
  if (usageResult?.ok === false) {
    const error = new Error(usageResult?.error?.message ?? "\u52A0\u8F7D\u5931\u8D25");
    error.code = usageResult?.error?.code;
    throw error;
  }
  const value = usageResult?.value ?? null;
  return {
    available: value?.available === true,
    usage: value?.usage ?? null,
    reason: value?.reason ?? "",
    stats: statsResult?.value?.available ? statsResult.value.stats : null
  };
}

// client/usage/cards.js
var import_react4 = __toESM(require("react"), 1);

// client/usage/tooltip.js
var import_react3 = __toESM(require("react"), 1);
function Tooltip({ tip }) {
  if (!tip) return null;
  const lines = Array.isArray(tip.lines) ? tip.lines.filter(Boolean) : [];
  return import_react3.default.createElement(
    "div",
    {
      className: "dshc-ust-tooltip show",
      style: { left: tip.left, top: tip.top }
    },
    import_react3.default.createElement("div", { className: "dshc-ust-tooltip-title" }, tip.title),
    ...lines.map(
      (line, index) => import_react3.default.createElement(
        "div",
        { key: `${line.label}-${index}`, className: "dshc-ust-tooltip-row" },
        import_react3.default.createElement("i", { style: { background: line.color || "var(--dsw-alias-label-tertiary,#8b93a1)" } }),
        import_react3.default.createElement("span", { className: "dshc-ust-tooltip-label" }, line.label),
        import_react3.default.createElement("span", { className: "dshc-ust-tooltip-value" }, line.value)
      )
    )
  );
}
function anchorOf(event, dy = -6) {
  const rect = event?.currentTarget?.getBoundingClientRect?.();
  if (!rect) return { left: 0, top: 0 };
  return { left: rect.left + rect.width / 2, top: rect.top + dy };
}

// client/usage/cards.js
var HEAT_WINDOW_DAYS = 30;
function RangeSwitch({ value, onChange, options = DAY_RANGES, seg = "range" }) {
  return import_react4.default.createElement(
    "div",
    { className: "dshc-seg", "data-seg": seg },
    ...options.map(
      (option) => import_react4.default.createElement("button", {
        key: option,
        type: "button",
        className: value === option ? "on" : "",
        onClick: () => onChange(option)
      }, `${option}d`)
    )
  );
}
function MetricSwitch({ value, onChange, options, seg }) {
  return import_react4.default.createElement(
    "div",
    { className: "dshc-seg", "data-seg": seg },
    ...options.map(
      ([id, label]) => import_react4.default.createElement("button", {
        key: id,
        type: "button",
        className: value === id ? "on" : "",
        onClick: () => onChange(id)
      }, label)
    )
  );
}
function KpiCards({ items }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return null;
  return import_react4.default.createElement(
    "div",
    { className: "dshc-ust-kpis" },
    ...list.map(
      (item) => import_react4.default.createElement(KpiCard, { key: item.key, item })
    )
  );
}
function KpiCard({ item }) {
  const animated = useCountUp(Number(item.raw) || 0);
  const noData = (item.kind === "percent" || item.kind === "ms") && !(Number(item.raw) > 0);
  const display = noData ? item.value : formatKpi(animated, item.kind);
  return import_react4.default.createElement(
    "div",
    {
      className: "dshc-ust-kpi",
      "data-kpi": item.key,
      // 精确值挂 title：紧凑格式化后卡片上只剩量级，明细不能丢。
      title: item.title ? `${item.title}
\u7CBE\u786E\u503C\uFF1A${item.value}` : item.value
    },
    import_react4.default.createElement("div", { className: "dshc-ust-kpi-k" }, item.label),
    import_react4.default.createElement("div", {
      className: "dshc-ust-kpi-v",
      style: item.tone === "ok" ? { color: tone.ok.fg } : void 0
    }, display),
    import_react4.default.createElement("div", { className: "dshc-ust-kpi-d" }, item.detail)
  );
}
function formatKpi(value, kind) {
  switch (kind) {
    case "tokens":
      return formatTokens(value);
    case "credit":
      return formatCredit(value);
    case "compact":
      return formatCompact(value);
    case "percent":
      return formatPercent(value, 1);
    case "ms":
      return latencyText(value);
    default:
      return formatCompact(Math.round(value));
  }
}
function Heatmap({ rows, metric = "requests", onMetricChange, onTip }) {
  const days = import_react4.default.useMemo(() => usageByDay(rows), [rows]);
  const grid = import_react4.default.useMemo(
    () => heatGrid(days, { windowDays: HEAT_WINDOW_DAYS, metric }),
    [days, metric]
  );
  const hours = import_react4.default.useMemo(() => hourlyProfile(rows), [rows]);
  const weekdayLabels = ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"];
  const hasDayData = grid.activeDays > 0;
  const hasHourData = hours.some((item) => item.requests > 0);
  const sparseDays = grid.activeDays < 3;
  const unit = metric === "tokens" ? "Tokens" : "\u8BF7\u6C42";
  return import_react4.default.createElement(
    "div",
    { className: "dshc-ust-card", "data-card": "heat" },
    import_react4.default.createElement(
      "div",
      { className: "dshc-ust-cardhead" },
      import_react4.default.createElement(
        "div",
        { className: "dshc-ust-cardtitle" },
        import_react4.default.createElement("h3", null, "\u6D3B\u8DC3\u70ED\u529B"),
        import_react4.default.createElement(
          "span",
          { className: "dshc-ust-cardsub" },
          `\u8FD1 ${HEAT_WINDOW_DAYS} \u5929 \xB7 \u672C\u5730\u65F6\u533A`
        )
      ),
      import_react4.default.createElement(
        "div",
        { className: "dshc-ust-cardactions" },
        onMetricChange ? import_react4.default.createElement(MetricSwitch, {
          value: metric,
          onChange: onMetricChange,
          seg: "heatMetric",
          options: [["requests", "\u8BF7\u6C42"], ["tokens", "Tokens"]]
        }) : null,
        import_react4.default.createElement(
          "div",
          { className: "dshc-ust-heat-legend" },
          import_react4.default.createElement("span", null, "\u5C11"),
          ...["h0", "h1", "h2", "h3", "h4"].map((cls) => import_react4.default.createElement("i", { key: cls, className: cls })),
          import_react4.default.createElement("span", null, "\u591A")
        )
      )
    ),
    import_react4.default.createElement(
      "div",
      { className: "dshc-heat-wrap" },
      import_react4.default.createElement(
        "div",
        { className: "dshc-heat-days" },
        ...weekdayLabels.map(
          (label, index) => import_react4.default.createElement("span", { key: label, style: { visibility: index % 2 === 0 ? "visible" : "hidden" } }, label)
        )
      ),
      import_react4.default.createElement(
        "div",
        { className: "dshc-heat-main" },
        import_react4.default.createElement(
          "div",
          {
            className: "dshc-heat-months",
            style: { gridTemplateColumns: `repeat(${grid.weeks}, 11px)` }
          },
          ...grid.monthLabels.map((label, index) => import_react4.default.createElement("span", { key: `m${index}` }, label))
        ),
        import_react4.default.createElement(
          "div",
          {
            className: "dshc-heat",
            style: { gridTemplateColumns: `repeat(${grid.weeks}, 11px)` }
          },
          ...grid.cells.map(
            (cell) => import_react4.default.createElement("i", {
              key: cell.date,
              className: cell.blank ? "blank" : `h${cell.level} anim`,
              style: cell.blank ? void 0 : { animationDelay: `${(cell.week * 0.018).toFixed(3)}s` },
              onMouseEnter: cell.blank ? void 0 : (event) => {
                if (!onTip) return;
                onTip({
                  ...anchorOf(event, -6),
                  title: cell.date,
                  lines: cell.value > 0 ? [{ label: unit, value: metric === "tokens" ? formatTokens(cell.value) : formatNumber(cell.value) }] : [{ label: "\u8BB0\u5F55", value: "\u65E0" }]
                });
              },
              onMouseLeave: onTip ? () => onTip(null) : void 0,
              title: cell.blank ? `${cell.date}\uFF08\u7A97\u53E3\u5916\uFF09` : cell.value > 0 ? `${cell.date} \xB7 ${metric === "tokens" ? formatTokens(cell.value) : `${formatNumber(cell.value)} \u8BF7\u6C42`}` : `${cell.date} \xB7 \u65E0\u8BB0\u5F55`
            })
          )
        )
      )
    ),
    import_react4.default.createElement(
      "div",
      { className: "dshc-ust-cardfoot" },
      import_react4.default.createElement(
        "span",
        { style: { ...s.muted, fontSize: 10.5 } },
        hasDayData ? `\u6D3B\u8DC3 ${grid.activeDays} \u5929 \xB7 \u5CF0\u503C ${formatNumber(grid.max)} ${unit}/\u5929` : `\u8FD1 ${HEAT_WINDOW_DAYS} \u5929\u6682\u65E0\u6309\u5929\u8BB0\u5F55`
      ),
      import_react4.default.createElement("span", {
        className: "dshc-ust-hint",
        title: "\u8272\u9636\u4E3A\u5206\u4F4D\u6CD5\uFF08\u5BF9\u975E\u96F6\u65E5\u53D6 4 \u5206\u4F4D\uFF09\uFF1B\u957F\u5C3E\u5206\u5E03\u4E0B\u7EBF\u6027\u6620\u5C04\u4F1A\u584C\u6210\u4E00\u7247\u6D45\u8272\u3002\u6570\u636E\u53EA\u4ECE\u7F51\u5173\u843D\u76D8\u90A3\u523B\u5F00\u59CB\u79EF\u7D2F\u3002"
      }, "\u5206\u4F4D\u8272\u9636")
    ),
    // 数据太稀疏时补一张按小时的分布（这才是当前真实有数据的维度）
    sparseDays && hasHourData ? import_react4.default.createElement(
      "div",
      { className: "dshc-ust-subblock" },
      import_react4.default.createElement(
        "div",
        { style: { ...s.muted, fontSize: 10.5, marginBottom: 8 } },
        hasDayData ? `\u6309\u5929\u8BB0\u5F55\u53EA\u6709 ${grid.activeDays} \u5929\uFF08\u7F51\u5173\u5C0F\u65F6\u69FD\u53EA\u4FDD 48 \u5C0F\u65F6\u3001\u65E5\u69FD\u8981\u8DE8\u5929\u624D\u4EA7\u751F\uFF09\u2014\u2014 \u6309\u5C0F\u65F6\u770B\u66F4\u6E05\u695A\uFF1A` : "\u8FD1 30 \u5929\u6CA1\u6709\u6309\u5929\u8BB0\u5F55 \u2014\u2014 \u6309\u5C0F\u65F6\u770B\u5F53\u524D\u8FD9\u6BB5\uFF1A"
      ),
      import_react4.default.createElement(HourProfile, { hours })
    ) : null
  );
}
function HourProfile({ hours }) {
  const max = Math.max(1, ...hours.map((item) => item.requests));
  return import_react4.default.createElement(
    "div",
    null,
    import_react4.default.createElement(
      "div",
      { style: { display: "flex", alignItems: "flex-end", gap: 3, height: 56 } },
      ...hours.map(
        (item) => import_react4.default.createElement("span", {
          key: item.hour,
          title: `${String(item.hour).padStart(2, "0")}:00 \xB7 ${formatNumber(item.requests)} \u8BF7\u6C42`,
          style: {
            flex: "1 1 0",
            minWidth: 0,
            height: `${Math.max(item.requests > 0 ? 6 : 2, Math.round(item.requests / max * 100))}%`,
            borderRadius: "2px 2px 0 0",
            background: item.requests > 0 ? "var(--dsw-alias-brand-primary,#4f6ef7)" : "var(--dsw-alias-border-l2,#e5e6eb)",
            opacity: item.requests > 0 ? 0.85 : 0.6
          }
        })
      )
    ),
    import_react4.default.createElement(
      "div",
      { style: { display: "flex", justifyContent: "space-between", marginTop: 4 } },
      ...["00", "06", "12", "18", "23"].map((label) => import_react4.default.createElement("span", { key: label, style: { ...s.muted, fontSize: 10.5 } }, label))
    )
  );
}
var SEG_COLORS = [
  "#4f6ef7",
  // 蓝
  "#10b981",
  // 翠绿
  "#f59e0b",
  // 琥珀
  "#a855f7",
  // 紫
  "#06b6d4",
  // 青
  "#ef4444",
  // 红
  "#84cc16",
  // 黄绿
  "#ec4899",
  // 玫红
  "#14b8a6",
  // 蓝绿
  "#6366f1"
  // 靛
];
var SERIES_HEAD = 5;
function DailyBars({ byModel, metric, range, onRangeChange, onMetricChange, onTip }) {
  const rows = import_react4.default.useMemo(() => mergeTail(byModel.series), [byModel]);
  const dates = byModel.dates;
  const fmt = metric === "requests" ? formatNumber : metric === "credit" ? formatCredit : formatTokens;
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
    return import_react4.default.createElement(
      "g",
      { key: `g${frac}` },
      import_react4.default.createElement("line", {
        className: frac === 1 ? "grid base" : "grid",
        x1: PL,
        x2: W - PR,
        y1: y,
        y2: y
      }),
      import_react4.default.createElement("text", {
        className: "axt",
        x: PL - 6,
        y: y + 3.5,
        textAnchor: "end"
      }, fmt(yMax * (1 - frac)))
    );
  });
  const bars = dates.map((date, i) => {
    const x = PL + band * i + (band - barW) / 2;
    const segs = [];
    let acc = 0;
    rows.forEach((row, layer) => {
      const value = row.values[i] || 0;
      if (value <= 0) return;
      const h = value / yMax * plotH;
      segs.push(import_react4.default.createElement("rect", {
        key: `${row.key}-${i}`,
        x: x.toFixed(1),
        y: (PT + plotH - acc - h).toFixed(1),
        width: barW.toFixed(1),
        height: Math.max(0.5, h).toFixed(1),
        style: { fill: row.color, opacity: row.rest ? 0.45 : 0.92, animationDelay: `${i * 22}ms` },
        rx: 1.5,
        className: "dshc-ust-bar-seg"
      }));
      acc += h;
    });
    if (acc === 0) {
      segs.push(import_react4.default.createElement("rect", {
        key: "zero",
        x: x.toFixed(1),
        y: (PT + plotH - 2).toFixed(1),
        width: barW.toFixed(1),
        height: 2,
        className: "dshc-ust-bar-seg zero",
        style: { animationDelay: `${i * 22}ms` }
      }));
    }
    return import_react4.default.createElement("g", {
      key: date,
      className: "dshc-ust-bar-day",
      onMouseEnter: onTip ? (event) => {
        const lines = rows.map((row) => ({ label: row.key, value: row.values[i] || 0, color: row.color, rest: row.rest })).filter((line) => line.value > 0).map((line) => ({ label: line.label, value: fmt(line.value), color: line.color }));
        onTip({
          ...anchorOf(event, -6),
          title: `${date} \xB7 \u5408\u8BA1 ${fmt(totals[i])}`,
          lines: lines.length > 0 ? lines : [{ label: "\u8BB0\u5F55", value: "\u65E0" }]
        });
      } : void 0,
      onMouseLeave: onTip ? () => onTip(null) : void 0
    }, ...segs);
  });
  const step = n <= 7 ? 1 : Math.ceil(n / 7);
  const xLabels = dates.map(
    (date, i) => i % step === 0 || i === n - 1 ? import_react4.default.createElement("text", {
      key: `x-${date}`,
      x: PL + band * i + band / 2,
      y: H - 8,
      textAnchor: "middle",
      className: "axt"
    }, date.slice(5)) : null
  );
  const grand = rows.reduce((sum, row) => sum + row.total, 0);
  const metricLabel = metric === "requests" ? "\u8BF7\u6C42" : metric === "credit" ? "\u79EF\u5206" : "Tokens";
  return import_react4.default.createElement(
    "div",
    { className: "dshc-ust-card", "data-card": "daily" },
    import_react4.default.createElement(
      "div",
      { className: "dshc-ust-cardhead" },
      import_react4.default.createElement(
        "div",
        { className: "dshc-ust-cardtitle" },
        import_react4.default.createElement("h3", null, "\u6BCF\u65E5\u7528\u91CF"),
        import_react4.default.createElement("span", { className: "dshc-ust-cardsub" }, `\u6309\u6A21\u578B\u5806\u53E0 \xB7 ${metricLabel}`)
      ),
      import_react4.default.createElement(
        "div",
        { className: "dshc-ust-cardactions" },
        onMetricChange ? import_react4.default.createElement(MetricSwitch, {
          value: metric,
          onChange: onMetricChange,
          seg: "barMetric",
          options: [["requests", "\u8BF7\u6C42"], ["tokens", "Tokens"], ["credit", "\u79EF\u5206"]]
        }) : null,
        onRangeChange ? import_react4.default.createElement(RangeSwitch, { value: range, onChange: onRangeChange }) : null
      )
    ),
    dates.length === 0 ? import_react4.default.createElement("div", { style: s.muted }, "\u8BE5\u8303\u56F4\u5185\u6CA1\u6709\u8BB0\u5F55") : import_react4.default.createElement(
      import_react4.default.Fragment,
      null,
      import_react4.default.createElement("svg", {
        viewBox: `0 0 ${W} ${H}`,
        className: "dshc-ust-svg",
        preserveAspectRatio: "xMidYMid meet"
      }, ...grid, ...bars, ...xLabels),
      import_react4.default.createElement(
        "div",
        { className: "dshc-ust-legend" },
        ...rows.map(
          (row) => import_react4.default.createElement(
            "span",
            { key: row.key, className: "dshc-ust-legend-row" },
            import_react4.default.createElement(
              "span",
              { className: "dshc-ust-legend-name" },
              import_react4.default.createElement("i", { style: { background: row.color, opacity: row.rest ? 0.45 : 1 } }),
              import_react4.default.createElement("span", { title: row.key }, row.key)
            ),
            import_react4.default.createElement("span", { className: "dshc-ust-legend-val" }, fmt(row.total)),
            import_react4.default.createElement(
              "span",
              { className: "dshc-ust-legend-pct" },
              formatPercent(grand > 0 ? row.total / grand : 0, 0)
            )
          )
        )
      )
    )
  );
}
function mergeTail(series) {
  const list = Array.isArray(series) ? series : [];
  const head = list.slice(0, SERIES_HEAD).map((row, i) => ({
    ...row,
    color: SEG_COLORS[i % SEG_COLORS.length],
    rest: false
  }));
  const tail = list.slice(SERIES_HEAD);
  if (tail.length === 0) return head;
  const merged = tail.reduce(
    (acc, row) => ({
      key: `\u5176\u4ED6 ${tail.length} \u9879`,
      values: acc.values.map((v, i) => v + (row.values[i] || 0)),
      total: acc.total + row.total
    }),
    { key: `\u5176\u4ED6 ${tail.length} \u9879`, values: new Array(tail[0].values.length).fill(0), total: 0 }
  );
  return [...head, { ...merged, color: SEG_COLORS[SEG_COLORS.length - 1], rest: true }];
}
function RankCards({ accounts, channels, metric = "tokens", onMetricChange }) {
  const current = rankMetric(metric);
  const options = RANK_METRICS.map((item) => [item.id, item.label]);
  const extra = `\u6309${current.label}`;
  return import_react4.default.createElement(
    "div",
    { className: "dshc-ust-rank" },
    import_react4.default.createElement(
      "div",
      { className: "dshc-ust-card", "data-card": "accounts" },
      import_react4.default.createElement(
        "div",
        { className: "dshc-ust-cardhead" },
        import_react4.default.createElement(
          "div",
          { className: "dshc-ust-cardtitle" },
          import_react4.default.createElement("h3", null, "\u8D26\u53F7\u7528\u91CF"),
          import_react4.default.createElement("span", { className: "dshc-ust-cardsub" }, extra)
        ),
        import_react4.default.createElement(
          "div",
          { className: "dshc-ust-cardactions" },
          onMetricChange ? import_react4.default.createElement(MetricSwitch, { value: metric, onChange: onMetricChange, seg: "rankMetric", options }) : null
        )
      ),
      accounts.length === 0 ? import_react4.default.createElement("div", { style: s.muted }, "\u8BE5\u7A97\u53E3\u5185\u6CA1\u6709\u8D26\u53F7\u8BB0\u5F55") : import_react4.default.createElement(
        import_react4.default.Fragment,
        null,
        ...accounts.slice(0, 8).map(
          (row, index) => import_react4.default.createElement(
            "div",
            { key: row.key ?? index, className: "dshc-ust-rank-row" },
            import_react4.default.createElement("span", { className: "dshc-ust-rank-no" }, String(index + 1)),
            import_react4.default.createElement(
              "span",
              { className: "dshc-ust-rank-name" },
              import_react4.default.createElement("span", { title: row.key }, row.name),
              row.channel ? import_react4.default.createElement(Tag, { text: CHANNEL_LABEL[row.channel] ?? row.channel, tone: "info" }) : null
            ),
            import_react4.default.createElement(
              "span",
              { className: "dshc-ust-rank-bar" },
              import_react4.default.createElement("i", { style: { width: `${Math.max(2, Math.round(row.barShare * 100))}%` } })
            ),
            import_react4.default.createElement("span", {
              className: "dshc-ust-rank-val",
              title: `${current.label} ${current.format(row.value)}\uFF08${formatPercent(row.share, 1)}\uFF09
${formatNumber(row.requests)} \u8BF7\u6C42 \xB7 ${formatTokens(row.tokens)} \xB7 ${formatCredit(row.credit)} \u79EF\u5206 \xB7 \u6210\u529F\u7387 ${formatPercent(row.successRate, 1)}`
            }, formatPercent(row.share, 0))
          )
        )
      )
    ),
    import_react4.default.createElement(
      "div",
      { className: "dshc-ust-card", "data-card": "channels" },
      import_react4.default.createElement(CardHead, { title: "\u6E20\u9053\u7528\u91CF", extra: `${extra} \xB7 \u8D26\u53F7\u6C60\u540C\u6E90\u53E3\u5F84` }),
      channels.length === 0 ? import_react4.default.createElement("div", { style: s.muted }, "\u8BE5\u7A97\u53E3\u5185\u6CA1\u6709\u6E20\u9053\u8BB0\u5F55") : import_react4.default.createElement(
        import_react4.default.Fragment,
        null,
        ...channels.map(
          (row) => import_react4.default.createElement(
            "div",
            { key: row.key, className: "dshc-ust-rank-row" },
            import_react4.default.createElement(
              "span",
              { className: "dshc-ust-rank-name", style: { flex: 1 } },
              import_react4.default.createElement("span", null, CHANNEL_LABEL[row.key] ?? row.key),
              // 「3 号」是内部黑话：读者会读成「3 号账号」。写明量词。
              import_react4.default.createElement("span", { style: { ...s.muted, fontSize: 10.5 } }, `${row.accounts} \u4E2A\u8D26\u53F7`)
            ),
            import_react4.default.createElement(
              "span",
              { className: "dshc-ust-rank-bar" },
              import_react4.default.createElement("i", { style: { width: `${Math.max(2, Math.round(row.barMax * 100))}%` } })
            ),
            import_react4.default.createElement("span", {
              className: "dshc-ust-rank-val",
              title: `${current.label} ${current.format(row.value)}\uFF08${formatPercent(row.share, 1)}\uFF09
${formatNumber(row.requests)} \u8BF7\u6C42 \xB7 ${formatTokens(row.tokens)} \xB7 ${formatCredit(row.credit)} \u79EF\u5206`
            }, formatPercent(row.share, 0))
          )
        )
      )
    )
  );
}
function ModelDonut({ rows, onTip }) {
  const shares = import_react4.default.useMemo(() => modelShares(rows), [rows]);
  const [active, setActive] = import_react4.default.useState(null);
  if (shares.length === 0) {
    return import_react4.default.createElement(
      "div",
      { className: "dshc-ust-card", "data-card": "models" },
      import_react4.default.createElement(CardHead, { title: "\u6A21\u578B\u5360\u6BD4" }),
      import_react4.default.createElement("div", { style: s.muted }, "\u8BE5\u7A97\u53E3\u5185\u6CA1\u6709\u6A21\u578B\u7528\u91CF")
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
  return import_react4.default.createElement(
    "div",
    { className: "dshc-ust-card", "data-card": "models" },
    import_react4.default.createElement(CardHead, { title: "\u6A21\u578B\u5360\u6BD4", extra: "\u6309 Tokens" }),
    import_react4.default.createElement(
      "div",
      { className: "dshc-models" },
      import_react4.default.createElement(
        "svg",
        { className: "dshc-donut", viewBox: "0 0 120 120", width: 132, height: 132 },
        import_react4.default.createElement(
          "g",
          { transform: "rotate(-90 60 60)" },
          ...arcs.map(
            (arc) => import_react4.default.createElement("circle", {
              key: arc.key,
              className: `dshc-donut-seg${active !== null && active !== arc.index ? " dim" : ""}`,
              cx: 60,
              cy: 60,
              r: R,
              fill: "none",
              style: { stroke: arc.color, strokeWidth: active === arc.index ? 20 : 15 },
              strokeDasharray: `${arc.len.toFixed(2)} ${(CIRC - arc.len).toFixed(2)}`,
              strokeDashoffset: (-arc.offset).toFixed(2),
              onMouseEnter: (event) => {
                setActive(arc.index);
                if (onTip) {
                  onTip({
                    left: event.clientX,
                    top: event.clientY - 6,
                    title: arc.key,
                    lines: [
                      { label: "Tokens", value: formatTokens(arc.tokens), color: arc.color },
                      { label: "\u5360\u6BD4", value: formatPercent(arc.share, 1) }
                    ]
                  });
                }
              },
              onMouseLeave: () => {
                setActive(null);
                if (onTip) onTip(null);
              }
            }, import_react4.default.createElement(
              "title",
              null,
              `${arc.key} \xB7 ${formatTokens(arc.tokens)}\uFF08${formatPercent(arc.share, 1)}\uFF09`
            ))
          )
        ),
        // 中心显示「模型数」而不是合计 token —— 合计已在 KPI 卡的 Tokens 上，
        // 同一屏把同一个数字摆两遍正是此前修掉的问题（去重用例会抓这个回归）。
        import_react4.default.createElement(
          "text",
          { className: "dshc-donut-total", x: 60, y: 57, textAnchor: "middle" },
          String(shares.length)
        ),
        import_react4.default.createElement(
          "text",
          { className: "dshc-donut-cap", x: 60, y: 71, textAnchor: "middle" },
          "\u4E2A\u6A21\u578B"
        )
      ),
      import_react4.default.createElement(
        "div",
        { className: "dshc-mlist" },
        ...arcs.map(
          (arc) => import_react4.default.createElement(
            "div",
            {
              key: arc.key,
              className: "dshc-mrow",
              onMouseEnter: () => setActive(arc.index),
              onMouseLeave: () => setActive(null)
            },
            import_react4.default.createElement("i", { style: { background: arc.color } }),
            import_react4.default.createElement("span", { className: "dshc-mname", title: arc.key }, arc.key),
            import_react4.default.createElement("span", { className: "dshc-mtok" }, formatTokens(arc.tokens)),
            import_react4.default.createElement("span", { className: "dshc-mpct" }, formatPercent(arc.share, 1))
          )
        )
      )
    )
  );
}
function modelShares(rows, limit = 5) {
  const list = (Array.isArray(rows) ? rows : []).map((row) => ({ key: row?.key || "\u2014", tokens: Number(row?.total_tokens) || 0 })).filter((row) => row.tokens > 0).sort((a, b) => b.tokens - a.tokens);
  const total = list.reduce((sum, row) => sum + row.tokens, 0);
  if (total <= 0) return [];
  const head = list.slice(0, limit);
  const tail = list.slice(limit);
  const out = head.map((row) => ({ ...row, share: row.tokens / total }));
  if (tail.length > 0) {
    const rest = tail.reduce((sum, row) => sum + row.tokens, 0);
    out.push({ key: `\u5176\u4ED6 ${tail.length} \u4E2A`, tokens: rest, share: rest / total });
  }
  return out;
}
function BurnPanel({ rows, stock, windowValue, burn }) {
  if (!burn) {
    return import_react4.default.createElement(
      "div",
      { style: s.muted },
      "\u7A97\u53E3\u5185\u65E0\u79EF\u5206\u6D88\u8017\u6216\u65E0\u53EF\u7528\u5B58\u91CF \u2014\u2014 \u65E0\u6CD5\u5916\u63A8\uFF08\u663E\u793A \u2014 \u800C\u4E0D\u662F\u7F16\u4E00\u4E2A\u5929\u6570\uFF09\u3002"
    );
  }
  const spent = rows.reduce((sum, row) => sum + row.credit, 0);
  const startStock = stock.usable + spent;
  const perHour = burn.perDay / 24;
  const hoursLeft = perHour > 0 ? stock.usable / perHour : 0;
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
  const x = (index) => PL + index / Math.max(1, totalSlots - 1) * innerW;
  const y = (value) => PT + (1 - Math.max(0, value) / maxY) * innerH;
  let used = 0;
  const actual = rows.map((row, index) => {
    used += row.credit;
    return [x(index), y(startStock - used)];
  });
  const proj = Array.from({ length: extra + 1 }, (_, step) => [
    x(rows.length - 1 + step),
    y(stock.usable - perHour * step)
  ]);
  let dieIndex = proj.findIndex((point) => point[1] >= PT + innerH - 0.5);
  if (dieIndex < 0) dieIndex = proj.length - 1;
  const daysText2 = burn.days > 1095 ? ">3 \u5E74" : burn.days >= 1 ? `${burn.days.toFixed(1)} \u5929` : `${(burn.days * 24).toFixed(1)} \u5C0F\u65F6`;
  const grid = [0, 0.5, 1].map((frac) => {
    const gy = PT + innerH * frac;
    return import_react4.default.createElement(
      "g",
      { key: `g${frac}` },
      import_react4.default.createElement("line", {
        className: frac === 1 ? "grid base" : "grid",
        x1: PL,
        x2: W - PR,
        y1: gy,
        y2: gy
      }),
      import_react4.default.createElement("text", {
        className: "axt",
        x: PL - 6,
        y: gy + 3.5,
        textAnchor: "end"
      }, formatTokens(maxY * (1 - frac)))
    );
  });
  const line = (points) => points.map((point, i) => `${i === 0 ? "M" : "L"}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join("");
  return import_react4.default.createElement(
    "div",
    null,
    import_react4.default.createElement(
      "div",
      { style: { ...s.muted, marginBottom: 8 } },
      `\u7A97\u53E3\u901F\u7387 ${formatCredit(burn.perDay)} \u79EF\u5206/\u5929 \xB7 \u5B58\u91CF ${formatNumber(Math.round(stock.usable))} \xB7 \u9884\u8BA1 ${daysText2}\u540E\u89C1\u5E95`
    ),
    import_react4.default.createElement(
      "svg",
      {
        viewBox: `0 0 ${W} ${H}`,
        className: "dshc-ust-svg",
        preserveAspectRatio: "xMidYMid meet"
      },
      ...grid,
      import_react4.default.createElement("path", {
        className: "area-burn",
        d: `${line(actual)}L${x(rows.length - 1).toFixed(1)},${(PT + innerH).toFixed(1)}L${x(0).toFixed(1)},${(PT + innerH).toFixed(1)}Z`
      }),
      import_react4.default.createElement("path", { className: "line-burn", d: line(actual) }),
      import_react4.default.createElement("path", { className: "line-proj", d: line(proj) }),
      import_react4.default.createElement("line", {
        className: "floor",
        x1: PL,
        x2: W - PR,
        y1: PT + innerH,
        y2: PT + innerH
      }),
      import_react4.default.createElement("circle", {
        className: "dot-die",
        cx: proj[dieIndex][0].toFixed(1),
        cy: PT + innerH,
        r: 4
      }),
      import_react4.default.createElement("text", {
        className: "axt err",
        x: Math.min(proj[dieIndex][0] + 8, W - PR - 66),
        y: PT + innerH - 7
      }, `\u2248 ${daysText2}\u540E\u89C1\u5E95`),
      import_react4.default.createElement("line", {
        className: "nowline",
        x1: x(rows.length - 1).toFixed(1),
        x2: x(rows.length - 1).toFixed(1),
        y1: PT,
        y2: PT + innerH
      }),
      import_react4.default.createElement("text", {
        className: "axt",
        x: x(rows.length - 1).toFixed(1),
        y: H - 8,
        textAnchor: "middle"
      }, "\u73B0\u5728"),
      import_react4.default.createElement("text", {
        className: "axt",
        x: PL,
        y: H - 8
      }, "\u7A97\u53E3\u8D77\u70B9"),
      import_react4.default.createElement("text", {
        className: "axt",
        x: W - PR,
        y: H - 8,
        textAnchor: "end"
      }, "\u5916\u63A8")
    ),
    import_react4.default.createElement(
      "div",
      { style: { ...s.muted, fontSize: 10.5, marginTop: 6 } },
      import_react4.default.createElement("span", {
        style: { cursor: "help" },
        title: "\u5B9E\u7EBF = \u7A97\u53E3\u8D77\u70B9\u5B58\u91CF\u6309\u5DF2\u6D88\u8017\u9010\u69FD\u56DE\u63A8\uFF08\u56DE\u63A8\u503C\uFF0C\u975E\u9010\u65F6\u5B9E\u6D4B\uFF09\uFF1B\u865A\u7EBF = \u6309\u7A97\u53E3\u901F\u7387\u7EBF\u6027\u5916\u63A8\uFF08\u975E\u627F\u8BFA\uFF0C\u5B9E\u9645\u504F\u4E50\u89C2\uFF09\u3002\u7A97\u53E3\u8D77\u70B9\u5B58\u91CF = \u5F53\u524D\u53EF\u7528\u5B58\u91CF + \u7A97\u53E3\u5185\u5DF2\u6D88\u8017\uFF1B\u53EA\u7B97\u53EF\u6D88\u8017\u989D\u5EA6\uFF1B\u8D26\u672C\u53EA\u8986\u76D6\u7ECF\u672C\u7F51\u5173\u7684\u8BF7\u6C42\u3002"
      }, "\u5B9E\u7EBF = \u56DE\u63A8 \xB7 \u865A\u7EBF = \u5916\u63A8\uFF08\u975E\u627F\u8BFA\uFF09\xB7 \u5706\u70B9 = \u9884\u8BA1\u89C1\u5E95")
    )
  );
}
function ProcessPanel({ stats, windowTotal }) {
  const [showIdle, setShowIdle] = import_react4.default.useState(false);
  if (!stats || stats.enabled !== true) {
    return import_react4.default.createElement(
      "div",
      { style: s.muted },
      "\u8BE5\u7F51\u5173\u672A\u63D0\u4F9B /v1/stats\uFF08\u8FDB\u7A0B\u7D2F\u8BA1\u89C6\u56FE\u4E0D\u53EF\u7528\uFF09\u3002\u7A97\u53E3\u5206\u6876\u6570\u636E\u4E0D\u53D7\u5F71\u54CD\u3002"
    );
  }
  const models = Array.isArray(stats.models) ? stats.models : [];
  const total = stats.total ?? {};
  const rate = (value, digits = 0) => typeof value === "number" && value > 0 ? formatPercent(value, digits) : "\u2014";
  const ms = (value) => typeof value === "number" && value > 0 ? `${Math.round(value)} ms` : "\u2014";
  const tps = (value) => typeof value === "number" && value > 0 ? `${value.toFixed(1)} tok/s` : "\u2014";
  const decorated = models.map((model) => ({
    model,
    spend: (Number(model.credit_per_req) || 0) * (Number(model.requests) || 0),
    requests: Number(model.requests) || 0
  }));
  const active = decorated.filter((item) => item.requests > 0).sort((a, b) => b.spend - a.spend);
  const idle = decorated.filter((item) => item.requests === 0);
  const visible = showIdle ? [...active, ...idle] : active;
  const windowRate = Number(windowTotal?.cache_hit_tokens) || 0;
  const windowMiss = Number(windowTotal?.cache_miss_tokens) || 0;
  const windowHitRate = windowRate + windowMiss > 0 ? windowRate / (windowRate + windowMiss) : null;
  return import_react4.default.createElement(
    "div",
    null,
    import_react4.default.createElement(RatioStrip, {
      items: [
        {
          label: "\u7F13\u5B58\u547D\u4E2D\u7387",
          value: rate(total.cache_hit_rate),
          scope: "\u8FDB\u7A0B\u7D2F\u8BA1",
          title: "\u547D\u4E2D /\uFF08\u547D\u4E2D + \u672A\u547D\u4E2D\uFF09\uFF0C\u6765\u81EA /v1/stats\uFF08\u91CD\u542F\u6E05\u96F6\uFF09"
        },
        windowHitRate === null ? null : {
          label: "\u7F13\u5B58\u547D\u4E2D\u7387",
          value: formatPercent(windowHitRate, 0),
          scope: "\u7A97\u53E3\u5206\u6876",
          title: "\u540C\u516C\u5F0F\uFF0C\u4F46\u6765\u81EA /v1/stats/buckets\uFF08\u843D\u76D8\u3001\u91CD\u542F\u4E0D\u6E05\u96F6\uFF09\u2014\u2014 \u4E0E\u8FDB\u7A0B\u7D2F\u8BA1\u662F\u4E24\u4E2A\u53E3\u5F84\uFF0C\u4E0D\u53EF\u6DF7\u7B97"
        },
        (Number(total.requests) || 0) > 0 ? {
          label: "\u6D41\u5F0F\u5360\u6BD4",
          value: rate((Number(total.streaming) || 0) / Number(total.requests)),
          scope: "\u8FDB\u7A0B\u7D2F\u8BA1",
          title: "\u6D41\u5F0F\u8BF7\u6C42 / \u603B\u8BF7\u6C42\uFF0C\u6765\u81EA /v1/stats\uFF08\u91CD\u542F\u6E05\u96F6\uFF09"
        } : null,
        {
          label: "\u5E73\u5747\u5EF6\u8FDF",
          value: ms(total.avg_latency_ms),
          scope: "\u8FDB\u7A0B\u7D2F\u8BA1",
          title: "\u7AEF\u5230\u7AEF\u8017\u65F6\u5747\u503C\uFF0C\u6765\u81EA /v1/stats\uFF08\u91CD\u542F\u6E05\u96F6\uFF09"
        }
      ]
    }),
    import_react4.default.createElement(
      "div",
      { style: { marginTop: 10 } },
      visible.length === 0 ? import_react4.default.createElement(
        "div",
        { style: { ...s.muted, marginTop: 10 } },
        `\u8FD9\u4E00\u7A0B\u8FD8\u6CA1\u6709\u6A21\u578B\u8BF7\u6C42\u8BB0\u5F55\uFF08\u5408\u8BA1 ${formatNumber(Number(total.requests) || 0)} \u6B21\uFF09\u2014\u2014 \u53D1\u8D77\u5BF9\u8BDD\u540E\u9010\u6A21\u578B\u5217\u51FA\u3002`
      ) : import_react4.default.createElement(
        import_react4.default.Fragment,
        null,
        ...visible.map(
          ({ model }) => import_react4.default.createElement(
            "div",
            { key: model.model, className: "dshc-mrow2" },
            import_react4.default.createElement(
              "div",
              { className: "dshc-mrow2-top" },
              import_react4.default.createElement("span", { className: "dshc-mrow2-name", title: model.model }, model.model),
              // 倍率取上游原文；缺失显示 —（绝不显示 x0.00 —— 缺失 ≠ 免费）
              model.credits ? import_react4.default.createElement(Tag, { text: model.credits, tone: "idle" }) : import_react4.default.createElement("span", {
                style: { ...s.muted, fontSize: 10.5 },
                title: "\u4E0A\u6E38\u672A\u4E0B\u53D1\u8BE5\u6A21\u578B\u500D\u7387\uFF08\u7F3A\u5931 \u2260 \u514D\u8D39\uFF09"
              }, "\u500D\u7387 \u2014"),
              import_react4.default.createElement(
                "span",
                { style: { ...s.muted, fontSize: 10.5, flexShrink: 0 } },
                `${formatNumber(Number(model.requests) || 0)} \u8BF7\u6C42`
              )
            ),
            import_react4.default.createElement(
              "div",
              { className: "dshc-mrow-detail" },
              import_react4.default.createElement(
                "span",
                { style: { color: tone.ok.fg } },
                `${formatCredit(Number(model.credit_per_req) || 0)} / \u8BF7\u6C42`
              ),
              import_react4.default.createElement(
                "span",
                { title: "\u524D\u7F00\u7F13\u5B58\u547D\u4E2D\u7387\uFF1A\u547D\u4E2D /\uFF08\u547D\u4E2D + \u672A\u547D\u4E2D\uFF09" },
                `\u7F13\u5B58 ${rate(model.cache_hit_rate)}`
              ),
              import_react4.default.createElement("span", { title: "\u9996\u5B57\u5EF6\u8FDF\uFF08\u65E0\u89C2\u6D4B\u663E\u793A \u2014\uFF09" }, `TTFB ${ms(model.avg_ttfb_ms)}`),
              import_react4.default.createElement("span", { title: "\u751F\u6210\u541E\u5410" }, tps(model.tokens_per_sec)),
              Number(model.failed) > 0 ? import_react4.default.createElement("span", { style: { color: tone.err.fg } }, `\u5931\u8D25 ${formatNumber(model.failed)}`) : null,
              model.last_seen ? import_react4.default.createElement("span", null, relativeTimeText(model.last_seen)) : null
            )
          )
        ),
        idle.length > 0 ? import_react4.default.createElement("button", {
          type: "button",
          className: "dshc-more",
          onClick: () => setShowIdle((prev) => !prev)
        }, showIdle ? `\u6536\u8D77\u65E0\u6D88\u8017\u6A21\u578B\uFF08${idle.length}\uFF09` : `\u5C55\u5F00\u65E0\u6D88\u8017\u6A21\u578B\uFF08${idle.length}\uFF09`) : null
      )
    )
  );
}
function relativeTimeText(iso) {
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return "\u2014";
  const seconds = Math.max(0, Math.round((Date.now() - at) / 1e3));
  if (seconds < 60) return "\u521A\u521A";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} \u5206\u949F\u524D`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} \u5C0F\u65F6\u524D`;
  return `${Math.floor(seconds / 86400)} \u5929\u524D`;
}
function RatioStrip({ items }) {
  const list = (items ?? []).filter(Boolean);
  if (list.length === 0) return null;
  return import_react4.default.createElement(
    "div",
    { className: "dshc-row", style: { gap: 14 } },
    ...list.map(
      (item, index) => import_react4.default.createElement(
        "div",
        { key: `${item.label}-${item.scope}-${index}`, className: "dshc-row", style: { gap: 6 } },
        import_react4.default.createElement("span", { style: { ...s.muted, fontSize: 10.5 } }, item.label),
        import_react4.default.createElement("span", {
          style: { fontSize: 13, fontWeight: 600, color: item.tone ?? "var(--dsw-alias-label-primary,currentColor)" }
        }, item.value),
        import_react4.default.createElement("span", {
          style: { ...s.muted, fontSize: 10.5, cursor: "help" },
          title: item.title ?? item.scope
        }, item.scope)
      )
    )
  );
}
function processUptime(stats) {
  return stats?.enabled === true ? uptimeText(stats.uptime_sec) : null;
}

// client/usage/export.js
function csvCell(value) {
  let text = value === null || value === void 0 ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}
function toCsv(header, rows) {
  return `\uFEFF${[header.join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n")}`;
}
function buildDailyCsv(days, byModel) {
  const dates = (Array.isArray(days) ? days : []).map((d) => d.date);
  const header = ["date", "requests", "tokens", "credit", ...byModel.series.map((s2) => s2.key)];
  const rows = dates.map((date, i) => [
    date,
    days[i].requests || 0,
    days[i].tokens || 0,
    days[i].credit || 0,
    ...byModel.series.map((s2) => s2.values[i] || 0)
  ]);
  return toCsv(header, rows);
}
function buildModelCsv(rows) {
  const header = [
    "model",
    "requests",
    "success",
    "failed",
    "prompt_tokens",
    "completion_tokens",
    "total_tokens",
    "cache_hit_tokens",
    "cache_miss_tokens",
    "cache_write_tokens",
    "credit",
    "avg_latency_ms"
  ];
  const list = Array.isArray(rows) ? rows : [];
  return toCsv(header, list.map((row) => [
    row.key,
    row.requests,
    row.success,
    row.failed,
    row.prompt_tokens,
    row.completion_tokens,
    row.total_tokens,
    row.cache_hit_tokens,
    row.cache_miss_tokens,
    row.cache_write_tokens,
    row.credit,
    row.avg_latency_ms
  ]));
}
function buildAccountCsv(rows) {
  const header = [
    "uid",
    "nickname",
    "channel",
    "requests",
    "success",
    "failed",
    "total_tokens",
    "credit",
    "avg_latency_ms",
    "share"
  ];
  const list = Array.isArray(rows) ? rows : [];
  return toCsv(header, list.map((row) => [
    row.key,
    row.name,
    row.channel,
    row.requests,
    row.success,
    row.failed,
    row.total_tokens,
    row.credit,
    row.avg_latency_ms,
    (Number(row.share) || 0).toFixed(4)
  ]));
}
function buildJson(payload) {
  return JSON.stringify(payload, null, 2);
}
function download(filename, content, mime) {
  try {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
    return true;
  } catch {
    return false;
  }
}
function stamp(now = /* @__PURE__ */ new Date()) {
  const pad = (v) => String(v).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
}

// client/usage/index.js
var WINDOW_TIP = "\u7A97\u53E3\u805A\u5408\u53E3\u5F84\uFF1A\u6570\u636E\u843D\u76D8 data/usage.json\uFF0C\u91CD\u542F\u4E0D\u6E05\u96F6\uFF1B\u4E0E\u300C\u8FDB\u7A0B\u53E3\u5F84\u300D\u4E0D\u53EF\u6DF7\u7B97\u3002\u69FD\u7C92\u5EA6\u6DF7\u5408\uFF08\u8FD1 48 \u5C0F\u65F6\u4E3A\u5C0F\u65F6\u69FD\uFF0C\u66F4\u65E9\u6298\u53E0\u4E3A\u65E5\u69FD\uFF0C\u65E5\u69FD\u4E0A\u9650 30 \u5929\uFF09\u2014\u2014\u56E0\u6B64\u7528\u91CF\u53EA\u4ECE\u7F51\u5173\u843D\u76D8\u90A3\u523B\u5F00\u59CB\u79EF\u7D2F\uFF0C\u4E0D\u662F\u5386\u53F2\u5168\u91CF\u3002";
function UsageTab({ rpcCall, accounts, channelOf, onRefreshAll }) {
  const [payload, setPayload] = import_react5.default.useState(null);
  const [freshness, setFreshness] = import_react5.default.useState("loading");
  const [error, setError] = import_react5.default.useState("");
  const [busy, setBusy] = import_react5.default.useState(false);
  const [lastOkAt, setLastOkAt] = import_react5.default.useState(0);
  const [range, setRange] = import_react5.default.useState(30);
  const [heatMetric, setHeatMetric] = import_react5.default.useState("requests");
  const [barMetric, setBarMetric] = import_react5.default.useState("tokens");
  const [rankMetricValue, setRankMetricValue] = import_react5.default.useState(DEFAULT_RANK_METRIC);
  const [tip, setTip] = import_react5.default.useState(null);
  const [exportOpen, setExportOpen] = import_react5.default.useState(false);
  const hasPayloadRef = import_react5.default.useRef(false);
  const load = import_react5.default.useCallback(async () => {
    setBusy(true);
    try {
      const next = await fetchUsage(rpcCall);
      setPayload(next);
      setError("");
      setFreshness("fresh");
      setLastOkAt(Date.now());
      hasPayloadRef.current = true;
      saveCachedUsage(next);
    } catch (err) {
      const message = err?.message ?? String(err);
      setError(message);
      setFreshness(hasPayloadRef.current ? "fallback" : "error");
    } finally {
      setBusy(false);
    }
  }, [rpcCall]);
  import_react5.default.useEffect(() => {
    const cached = loadCachedUsage();
    if (cached) {
      setPayload(cached.payload);
      setLastOkAt(cached.savedAt);
      hasPayloadRef.current = true;
      setFreshness("stale");
    }
    void load();
  }, []);
  const usage = payload?.usage ?? null;
  const available = payload?.available === true;
  const reason = payload?.reason ?? "";
  const stats = payload?.stats ?? null;
  const total = usage?.total ?? {};
  const buckets = Array.isArray(usage?.buckets) ? usage.buckets : [];
  const rows = import_react5.default.useMemo(() => usageBySlot(buckets), [buckets]);
  const days = import_react5.default.useMemo(() => usageByDay(rows), [rows]);
  const scoped = import_react5.default.useMemo(() => daySeries(days, range), [days, range]);
  const byModelDaily = import_react5.default.useMemo(
    () => dailyByModel(rows, buckets, scoped, barMetric),
    [rows, buckets, scoped, barMetric]
  );
  const stock = import_react5.default.useMemo(
    () => creditStock(accounts, null, channelOf ?? (() => "workbuddy")),
    [accounts, channelOf]
  );
  const burn = import_react5.default.useMemo(
    () => creditBurn(stock.usable, Number(total?.credit) || 0, "720h"),
    [stock.usable, total?.credit]
  );
  const kpis = import_react5.default.useMemo(
    () => kpiCards({ total, stock, days: scoped, burn }),
    [total, stock, scoped, burn]
  );
  const accountRows = import_react5.default.useMemo(
    () => accountShares(usage?.by_uid ?? [], total, accounts ?? [], channelOf, rankMetricValue),
    [usage, total, accounts, channelOf, rankMetricValue]
  );
  const channelRows = import_react5.default.useMemo(
    () => channelShares(usage?.by_uid ?? [], total, accounts ?? [], channelOf, rankMetricValue),
    [usage, total, accounts, channelOf, rankMetricValue]
  );
  const subtitle = subtitleText({ freshness, error, lastOkAt });
  const uptime = processUptime(stats);
  return import_react5.default.createElement(
    "div",
    { className: "dshc-ust-root" },
    // tooltip 渲染在顶层：fixed 定位，永不被后续卡片的层叠上下文盖住
    import_react5.default.createElement(Tooltip, { tip }),
    // ── 页头：标题 + 四态副标题 + 导出 + 刷新（参考实现的 header 结构） ──
    import_react5.default.createElement(
      "div",
      { className: "dshc-ust-head" },
      import_react5.default.createElement(
        "div",
        { className: "dshc-ust-headtitle" },
        import_react5.default.createElement("h2", null, "\u7528\u91CF\u7EDF\u8BA1"),
        import_react5.default.createElement("div", { className: "dshc-ust-sub", "data-freshness": freshness }, subtitle)
      ),
      import_react5.default.createElement(
        "div",
        { className: "dshc-ust-headactions" },
        import_react5.default.createElement(ExportMenu, {
          open: exportOpen,
          onToggle: () => setExportOpen((prev) => !prev),
          payload: { usage, stats, at: lastOkAt },
          days: scoped,
          byModelDaily,
          modelRows: usage?.by_model ?? [],
          accountRows
        }),
        import_react5.default.createElement(
          "button",
          {
            type: "button",
            className: "dshc-ust-refresh",
            disabled: busy,
            onClick: () => {
              void load();
              if (onRefreshAll) onRefreshAll();
            },
            title: "\u5F3A\u5236\u91CD\u65B0\u62C9\u53D6\uFF08\u7ED5\u8FC7\u7F13\u5B58\uFF09"
          },
          import_react5.default.createElement(Icons.refresh, null),
          busy ? "\u5237\u65B0\u4E2D\u2026" : "\u5237\u65B0"
        )
      )
    ),
    // ── 端点缺失：如实降级，并说明需要网关补什么 ──
    !available ? import_react5.default.createElement(
      "div",
      { className: "dshc-ust-card" },
      import_react5.default.createElement(
        "div",
        { style: s.warn },
        reason || "\u7F51\u5173\u672A\u63D0\u4F9B\u5206\u6876\u7AEF\u70B9\uFF0C\u9700\u5728\u7F51\u5173\u4FA7\u652F\u6301 GET /v1/stats/buckets\u3002"
      )
    ) : null,
    // 容量降级：网关把四维分桶降成两维时必须如实说明（否则读者会把
    // 「按账号/按模型只有一行」误读成「只有一个账号/模型」）
    usage?.degraded ? import_react5.default.createElement(
      "div",
      { className: "dshc-ust-card" },
      import_react5.default.createElement(
        "div",
        { style: s.warn },
        "\u26A0\uFE0F \u5206\u6876\u952E\u5DF2\u8D85\u51FA\u5BB9\u91CF\u4E0A\u9650\uFF0C\u7F51\u5173\u5DF2\u964D\u7EA7\u4E3A\u300C\u69FD \xD7 \u57DF\u300D\u4E24\u7EF4 \u2014\u2014 \u6309\u8D26\u53F7 / \u6309\u6A21\u578B\u4E24\u4E2A\u7EF4\u5EA6\u5C06\u4E0D\u518D\u7EC6\u5206\u3002"
      )
    ) : null,
    // ── ① KPI 4 卡（窗口口径） ──
    available && rows.length > 0 ? import_react5.default.createElement(
      import_react5.default.Fragment,
      null,
      import_react5.default.createElement(
        "div",
        { className: "dshc-ust-kpihead" },
        import_react5.default.createElement(
          "span",
          { className: "dshc-ust-scope" },
          import_react5.default.createElement("span", { className: "dshc-ust-scope-tag" }, "\u7A97\u53E3\u53E3\u5F84"),
          import_react5.default.createElement(
            "span",
            { style: { ...s.muted, fontSize: 10.5 }, title: WINDOW_TIP },
            `\u8FD1 ${range} \u5929 \xB7 \u6570\u636E\u843D\u76D8 data/usage.json\uFF0C\u91CD\u542F\u4E0D\u6E05\u96F6`
          )
        )
      ),
      import_react5.default.createElement(KpiCards, { items: kpis }),
      // ── ② 活跃热力图 ──
      import_react5.default.createElement(Heatmap, {
        rows,
        metric: heatMetric,
        onMetricChange: setHeatMetric,
        onTip: setTip
      }),
      // ── ③ 每日用量（按模型堆叠 + 图例即明细） ──
      import_react5.default.createElement(DailyBars, {
        byModel: byModelDaily,
        metric: barMetric,
        range,
        onRangeChange: setRange,
        onMetricChange: setBarMetric,
        onTip: setTip
      }),
      // ── ④ 账号排行 + ⑤ 渠道用量（两列并排，维度可切，默认按用量） ──
      import_react5.default.createElement(RankCards, {
        accounts: accountRows,
        channels: channelRows,
        metric: rankMetricValue,
        onMetricChange: setRankMetricValue
      }),
      // ── ⑥ 模型占比 ──
      import_react5.default.createElement(ModelDonut, { rows: usage?.by_model ?? [], onTip: setTip })
    ) : null,
    available && rows.length === 0 ? import_react5.default.createElement(
      "div",
      { className: "dshc-ust-card" },
      import_react5.default.createElement(
        "div",
        { className: "dshc-ust-empty" },
        import_react5.default.createElement("div", { className: "dshc-ust-empty-title" }, "\u8BE5\u7A97\u53E3\u5185\u6CA1\u6709\u8BF7\u6C42\u8BB0\u5F55"),
        import_react5.default.createElement(
          "div",
          null,
          "\u7F51\u5173\u5206\u6876\u53EA\u4ECE\u843D\u76D8\u90A3\u523B\u5F00\u59CB\u79EF\u7D2F\uFF1A\u53D1\u8D77\u4E00\u6B21\u5BF9\u8BDD\u540E\u8FD9\u91CC\u5C31\u4F1A\u6709\u6570\u636E\u3002"
        )
      )
    ) : null,
    // ── 折叠区一：积分燃尽投影（窗口口径的外推） ──
    available && rows.length > 0 ? import_react5.default.createElement(
      LazyFold,
      {
        id: "burn",
        summary: import_react5.default.createElement(
          "span",
          { className: "dshc-row" },
          import_react5.default.createElement("span", { style: s.label }, "\u79EF\u5206\u71C3\u5C3D"),
          import_react5.default.createElement(
            "span",
            { style: { ...s.muted, fontSize: 10.5 } },
            burn ? `\u2248 \u8FD8\u53EF ${burn.days > 1095 ? ">3 \u5E74" : burn.days >= 1 ? `${burn.days.toFixed(1)} \u5929` : `${(burn.days * 24).toFixed(1)} \u5C0F\u65F6`}` : "\u65E0\u6CD5\u5916\u63A8"
          ),
          import_react5.default.createElement("span", { style: { ...s.muted, fontSize: 10.5 } }, "\u7A97\u53E3\u53E3\u5F84 \xB7 \u5916\u63A8")
        )
      },
      import_react5.default.createElement(BurnPanel, { rows, stock, windowValue: "720h", burn })
    ) : null,
    // ── 折叠区二：进程口径细节（与窗口分桶是两个口径，默认收起） ──
    import_react5.default.createElement(
      LazyFold,
      {
        id: "process",
        summary: import_react5.default.createElement(
          "span",
          { className: "dshc-row" },
          import_react5.default.createElement("span", { style: s.label }, "\u8FDB\u7A0B\u53E3\u5F84\u7EC6\u8282"),
          import_react5.default.createElement("span", {
            style: { ...s.muted, fontSize: 10.5 },
            title: stats?.enabled === true && stats.since ? `\u81EA\u8FDB\u7A0B\u542F\u52A8\u7D2F\u8BA1\uFF0C\u91CD\u542F\u6E05\u96F6\u3002\u6570\u636E\u8D77\u70B9 ${stats.since}` : "\u81EA\u8FDB\u7A0B\u542F\u52A8\u7D2F\u8BA1\uFF0C\u91CD\u542F\u6E05\u96F6"
          }, uptime ? `\u8FDB\u7A0B\u7D2F\u8BA1 \xB7 ${uptime}` : "\u8FDB\u7A0B\u7D2F\u8BA1"),
          import_react5.default.createElement(
            "span",
            { style: { ...s.muted, fontSize: 10.5 } },
            "\u7F13\u5B58\u547D\u4E2D\u7387 / TTFB / \u541E\u5410 / \u500D\u7387"
          )
        )
      },
      import_react5.default.createElement(ProcessPanel, { stats, windowTotal: total })
    )
  );
}
function LazyFold({ id, summary, children }) {
  const [opened, setOpened] = import_react5.default.useState(false);
  return import_react5.default.createElement(
    "details",
    {
      className: "dshc-fold",
      "data-fold": id,
      onToggle: (event) => {
        if (event.currentTarget.open) setOpened(true);
      }
    },
    import_react5.default.createElement("summary", null, summary),
    import_react5.default.createElement("div", { className: "dshc-body" }, opened ? children : null)
  );
}
function subtitleText({ freshness, error, lastOkAt }) {
  const at = lastOkAt ? clockText(lastOkAt) : "";
  switch (freshness) {
    case "loading":
      return "\u6B63\u5728\u52A0\u8F7D\u2026";
    case "fresh":
      return `\u6700\u8FD1\u66F4\u65B0 ${at}`;
    case "stale":
      return `\u663E\u793A\u672C\u5730\u7F13\u5B58\uFF08${at}\uFF09\uFF0C\u540E\u53F0\u66F4\u65B0\u4E2D\u2026`;
    case "fallback":
      return `\u5237\u65B0\u5931\u8D25\uFF08${error}\uFF09\u2014\u2014 \u663E\u793A\u4E0A\u6B21\u6210\u529F\u7684\u6570\u636E\uFF08${at}\uFF09\uFF0C\u4E0D\u662F\u6700\u65B0`;
    case "error":
      return `\u52A0\u8F7D\u5931\u8D25\uFF1A${error}`;
    default:
      return "";
  }
}
function clockText(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "\u2014";
  const pad = (v) => String(v).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function ExportMenu({ open, onToggle, payload, days, byModelDaily, modelRows, accountRows }) {
  const items = [
    {
      id: "json",
      label: "\u5B8C\u6574 JSON",
      build: () => buildJson(payload),
      name: `chanhub-usage-${stamp()}.json`,
      mime: "application/json"
    },
    {
      id: "daily",
      label: "\u6BCF\u65E5 CSV",
      build: () => buildDailyCsv(days, byModelDaily),
      name: `chanhub-usage-daily-${stamp()}.csv`,
      mime: "text/csv"
    },
    {
      id: "model",
      label: "\u6A21\u578B CSV",
      build: () => buildModelCsv(modelRows),
      name: `chanhub-usage-model-${stamp()}.csv`,
      mime: "text/csv"
    },
    {
      id: "account",
      label: "\u8D26\u53F7 CSV",
      build: () => buildAccountCsv(accountRows),
      name: `chanhub-usage-account-${stamp()}.csv`,
      mime: "text/csv"
    }
  ];
  return import_react5.default.createElement(
    "div",
    { className: "dshc-ust-export" },
    import_react5.default.createElement(
      "button",
      {
        type: "button",
        className: "dshc-ust-exportbtn",
        "aria-expanded": open ? "true" : "false",
        onClick: onToggle,
        title: "\u5BFC\u51FA\u5F53\u524D\u8F7D\u8377\uFF08\u7EAF\u5BA2\u6237\u7AEF\u6784\u5EFA\uFF09"
      },
      import_react5.default.createElement(Icons.download, null),
      "\u5BFC\u51FA"
    ),
    open ? import_react5.default.createElement(
      "div",
      { className: "dshc-ust-exportmenu", role: "menu" },
      ...items.map(
        (item) => import_react5.default.createElement("button", {
          key: item.id,
          type: "button",
          role: "menuitem",
          "data-export": item.id,
          onClick: () => {
            download(item.name, item.build(), item.mime);
            onToggle();
          }
        }, item.label)
      )
    ) : null
  );
}

// client/quick-entry.js
var import_react6 = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");
var QUICK_CSS = `
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
var POP_WIDTH = 344;
var POP_MAX_HEIGHT = 520;
function Ring({ ratio = 0, size = 34, stroke = 4, color = tone.ok.fg, track = "var(--dsw-alias-border-l3,#e5e7eb)" }) {
  const clamped = Math.max(0, Math.min(1, Number(ratio) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return import_react6.default.createElement(
    "svg",
    { width: size, height: size, viewBox: `0 0 ${size} ${size}`, "aria-hidden": "true" },
    import_react6.default.createElement("circle", {
      cx: size / 2,
      cy: size / 2,
      r: radius,
      fill: "none",
      stroke: track,
      strokeWidth: stroke
    }),
    import_react6.default.createElement("circle", {
      cx: size / 2,
      cy: size / 2,
      r: radius,
      fill: "none",
      stroke: color,
      strokeWidth: stroke,
      strokeLinecap: "round",
      strokeDasharray: `${circumference * clamped} ${circumference}`,
      transform: `rotate(-90 ${size / 2} ${size / 2})`,
      style: { transition: "stroke-dasharray .35s" }
    })
  );
}
function Sparkline({ values, color = tone.info.fg, width = 96, height = 22 }) {
  const { points, area, flat } = sparkPath(values, { width, height });
  if (points === "") {
    return import_react6.default.createElement("div", { style: { ...s.muted, fontSize: 10.5 } }, "\u65E0\u89C2\u6D4B");
  }
  const id = `dshc-spark-${Math.abs(hashString(points)).toString(36)}`;
  return import_react6.default.createElement(
    "svg",
    { width, height, viewBox: `0 0 ${width} ${height}`, "aria-hidden": "true" },
    import_react6.default.createElement(
      "defs",
      null,
      import_react6.default.createElement(
        "linearGradient",
        { id, x1: 0, y1: 0, x2: 0, y2: 1 },
        import_react6.default.createElement("stop", { offset: "0%", stopColor: color, stopOpacity: flat ? 0.08 : 0.28 }),
        import_react6.default.createElement("stop", { offset: "100%", stopColor: color, stopOpacity: 0 })
      )
    ),
    flat ? null : import_react6.default.createElement("polygon", { points: area, fill: `url(#${id})`, stroke: "none" }),
    import_react6.default.createElement("polyline", {
      points,
      fill: "none",
      stroke: color,
      strokeWidth: flat ? 1 : 1.5,
      strokeLinejoin: "round",
      strokeLinecap: "round",
      opacity: flat ? 0.5 : 1
    })
  );
}
function ChannelBar({ channels, total }) {
  const rows = (channels ?? []).filter((row) => row.count > 0);
  const sum = rows.reduce((acc, row) => acc + row.count, 0) || total || 1;
  return import_react6.default.createElement(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 } },
    import_react6.default.createElement(
      "div",
      {
        style: { display: "flex", height: 6, borderRadius: 999, overflow: "hidden", background: "var(--dsw-alias-bg-layer-2,#f3f4f6)" }
      },
      ...rows.map(
        (row) => import_react6.default.createElement("span", {
          key: row.id,
          title: `${row.label} \xB7 ${row.count} \u4E2A\u8D26\u53F7`,
          style: { width: `${row.count / sum * 100}%`, background: row.color ?? "var(--dsw-alias-button-info-fill,#4176f7)" }
        })
      )
    ),
    import_react6.default.createElement(
      "div",
      { style: { display: "flex", flexWrap: "wrap", gap: 8, minWidth: 0 } },
      ...rows.map(
        (row) => import_react6.default.createElement(
          "span",
          { key: row.id, style: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "var(--dsw-alias-label-tertiary,#8b93a1)" } },
          import_react6.default.createElement("span", { style: { width: 6, height: 6, borderRadius: 999, background: row.color } }),
          `${row.label} ${row.count}`
        )
      )
    )
  );
}
function Chip({ text, fg, bg, title }) {
  return import_react6.default.createElement("span", {
    title,
    style: {
      fontSize: 10.5,
      lineHeight: "16px",
      padding: "0 7px",
      borderRadius: 999,
      background: bg ?? "var(--dsw-alias-bg-layer-2,#f3f4f6)",
      color: fg ?? "var(--dsw-alias-label-secondary,#6b7280)",
      whiteSpace: "nowrap",
      maxWidth: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, text);
}
function Tile({ label, value, hint, accent, children }) {
  return import_react6.default.createElement(
    "div",
    {
      style: {
        flex: "1 1 0",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "9px 10px",
        borderRadius: 10,
        background: "var(--dsw-alias-bg-layer-2,#f8fafc)",
        border: "1px solid var(--dsw-alias-border-l2,#eef1f5)"
      }
    },
    import_react6.default.createElement("span", { style: { fontSize: 10.5, color: "var(--dsw-alias-label-tertiary,#8b93a1)" } }, label),
    import_react6.default.createElement(
      "span",
      { style: { display: "flex", alignItems: "baseline", gap: 4, minWidth: 0 } },
      import_react6.default.createElement("span", { style: { fontSize: 17, fontWeight: 650, letterSpacing: "-0.01em", color: accent ?? "var(--dsw-alias-label-primary,currentColor)" } }, value),
      hint ? import_react6.default.createElement("span", { style: { fontSize: 10.5, color: "var(--dsw-alias-label-tertiary,#8b93a1)" } }, hint) : null
    ),
    children
  );
}
function AccountQuickRow({ vm, series, usageTotal }) {
  const statusTone = tone[vm.state?.tone] ?? tone.idle;
  const dayCount = Number(usageTotal?.requests) || (Array.isArray(series) ? series.reduce((a, b) => a + b, 0) : 0);
  return import_react6.default.createElement(
    "div",
    {
      className: "dshc-quick-row",
      style: { display: "flex", gap: 9, padding: "8px 10px", borderRadius: 10, minWidth: 0, alignItems: "stretch" }
    },
    // 渠道色条：一眼分辨是哪个渠道的号
    import_react6.default.createElement("span", { style: { width: 3, borderRadius: 999, background: vm.color, flex: "0 0 3px" } }),
    import_react6.default.createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 5, minWidth: 0, flex: 1 } },
      // 行 1：名称 + 活跃/short 状态
      import_react6.default.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 6, minWidth: 0 } },
        import_react6.default.createElement("span", {
          style: { fontSize: 12.5, fontWeight: 550, color: "var(--dsw-alias-label-primary,currentColor)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 },
          title: `${vm.name} \xB7 ${vm.uid}`
        }, vm.name),
        vm.activity ? import_react6.default.createElement(
          "span",
          { style: { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, color: (tone[vm.activity.tone] ?? tone.info).fg, whiteSpace: "nowrap" } },
          import_react6.default.createElement("span", { className: vm.activity.key === "busy" ? "dshc-quick-dot" : void 0, style: { width: 5, height: 5, borderRadius: 999, background: "currentColor", display: "inline-block" } }),
          vm.activity.label
        ) : null
      ),
      // 行 2：余额条（相对池内最高）+ 数值
      import_react6.default.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 } },
        import_react6.default.createElement(
          "span",
          {
            style: { flex: "1 1 auto", minWidth: 30, height: 4, borderRadius: 999, background: "var(--dsw-alias-bg-layer-2,#f1f5f9)", overflow: "hidden" }
          },
          import_react6.default.createElement("span", {
            style: {
              display: "block",
              height: "100%",
              borderRadius: 999,
              width: `${Math.round(vm.creditsRatio * 100)}%`,
              background: `linear-gradient(90deg, ${vm.color} 0%, ${vm.color}99 100%)`,
              transition: "width .3s"
            }
          })
        ),
        import_react6.default.createElement("span", {
          title: `${vm.creditsExact} \u79EF\u5206`,
          style: { fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--dsw-alias-label-primary,currentColor)", whiteSpace: "nowrap" }
        }, vm.creditsText)
      ),
      // 行 3：状态 + 渠道 + 24h 用量 + 到期 + 在途
      import_react6.default.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", minWidth: 0 } },
        import_react6.default.createElement(Chip, { text: vm.state?.label ?? "\u2014", fg: statusTone.fg, bg: statusTone.bg, title: vm.state?.detail || void 0 }),
        import_react6.default.createElement(Chip, { text: vm.channelLabel }),
        vm.inFlight > 0 ? import_react6.default.createElement(Chip, {
          text: `\u5728\u9014 ${vm.inFlight}${vm.target ? `/${vm.target}` : ""}`,
          fg: vm.inFlightFull ? tone.warn.fg : tone.info.fg,
          bg: vm.inFlightFull ? tone.warn.bg : tone.info.bg,
          title: vm.target ? `\u5355\u53F7\u5728\u9014\u4E0A\u9650 ${vm.target}` : "\u672A\u8BBE\u4E0A\u9650\uFF080 = \u4E0D\u9650\uFF09"
        }) : null,
        vm.expiry ? import_react6.default.createElement(Chip, {
          text: vm.expiry.expired ? "\u51ED\u8BC1\u5DF2\u8FC7\u671F" : `\u5230\u671F ${daysText(vm.expiry.days)}`,
          fg: vm.expiry.days <= 7 ? tone.warn.fg : void 0,
          bg: vm.expiry.days <= 7 ? tone.warn.bg : void 0,
          title: `\u6765\u6E90\uFF1A${vm.expiry.kind === "credential" ? "\u767B\u5F55\u51ED\u8BC1" : "\u79EF\u5206\u5957\u9910"}`
        }) : null,
        vm.expiring > 0 ? import_react6.default.createElement(Chip, { text: `${formatCompact(vm.expiring)} \u5C06\u8FC7\u671F`, fg: tone.warn.fg, bg: tone.warn.bg, title: "\u8BE5\u7A97\u53E3\u5185\u5373\u5C06\u8FC7\u671F\u7684\u79EF\u5206\uFF08\u4F18\u5148\u6D88\u8017\uFF09" }) : null,
        series && series.some((value) => value > 0) ? import_react6.default.createElement(
          "span",
          { style: { marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5 } },
          import_react6.default.createElement(Sparkline, { values: series, color: vm.color, width: 74, height: 18 }),
          import_react6.default.createElement(
            "span",
            { style: { fontSize: 10.5, color: "var(--dsw-alias-label-tertiary,#8b93a1)", whiteSpace: "nowrap" } },
            `${formatNumber(dayCount)} \u6B21/24h`
          )
        ) : dayCount > 0 ? import_react6.default.createElement(
          "span",
          { style: { marginLeft: "auto", fontSize: 10.5, color: "var(--dsw-alias-label-tertiary,#8b93a1)", whiteSpace: "nowrap" } },
          `${formatNumber(dayCount)} \u6B21/24h`
        ) : null
      )
    )
  );
}
function daysText(days) {
  if (days < 0) return "\u5DF2\u8FC7\u671F";
  if (days === 0) return "\u4ECA\u5929";
  return `${days} \u5929\u540E`;
}
function hashString(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = hash * 31 + text.charCodeAt(i) | 0;
  return hash;
}
function EntryIcon({ size = 16, color = "currentColor" }) {
  return import_react6.default.createElement(
    "svg",
    { width: size, height: size, viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true" },
    import_react6.default.createElement("path", {
      d: "M4 12.5a6.5 6.5 0 1 1 12 0",
      stroke: color,
      strokeWidth: 1.6,
      strokeLinecap: "round"
    }),
    import_react6.default.createElement("circle", { cx: 10, cy: 13.4, r: 2.1, fill: color }),
    import_react6.default.createElement("path", { d: "M3 16.6h14", stroke: color, strokeWidth: 1.4, strokeLinecap: "round", opacity: 0.45 })
  );
}
function FreshnessPill({ phase, error, fetchedAt, now }) {
  const map = {
    loading: { text: "\u8BFB\u53D6\u4E2D\u2026", fg: tone.idle.fg, bg: tone.idle.bg },
    fresh: { text: fetchedAt ? `${relativeTime(new Date(fetchedAt).toISOString(), now)}\u66F4\u65B0` : "\u5DF2\u66F4\u65B0", fg: tone.ok.fg, bg: tone.ok.bg },
    stale: { text: "\u6570\u636E\u504F\u65E7", fg: tone.warn.fg, bg: tone.warn.bg },
    error: { text: error?.message ? "\u7F51\u5173\u4E0D\u53EF\u8FBE" : "\u8BFB\u53D6\u5931\u8D25", fg: tone.err.fg, bg: tone.err.bg }
  };
  const item = map[phase] ?? map.loading;
  return import_react6.default.createElement(
    "span",
    { style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, color: item.fg } },
    import_react6.default.createElement("span", { style: { width: 6, height: 6, borderRadius: 999, background: item.fg, display: "inline-block" } }),
    item.text
  );
}
function QuickEntry({ wide, store, prefs, openSettings, hasOpenSettings, now = Date.now() }) {
  const [snapshot, setSnapshot] = import_react6.default.useState(() => store?.getSnapshot?.());
  const [enabled, setEnabled] = import_react6.default.useState(() => prefs ? prefs.value : true);
  const [open, setOpen] = import_react6.default.useState(false);
  const [anchor, setAnchor] = import_react6.default.useState();
  const buttonRef = import_react6.default.useRef(null);
  const rootRef = import_react6.default.useRef(null);
  import_react6.default.useEffect(() => {
    if (!store) return void 0;
    const off = store.subscribe(setSnapshot);
    store.start?.();
    return off;
  }, [store]);
  import_react6.default.useEffect(() => {
    if (!prefs) return void 0;
    const sync = () => setEnabled(prefs.value);
    sync();
    return prefs.subscribe?.(sync);
  }, [prefs]);
  import_react6.default.useEffect(() => {
    if (!enabled && open) setOpen(false);
  }, [enabled, open]);
  import_react6.default.useLayoutEffect(() => {
    if (!open) return void 0;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewportH = typeof window === "undefined" ? 0 : window.innerHeight;
      const viewportW = typeof window === "undefined" ? POP_WIDTH : window.innerWidth;
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
        ...openUp ? { bottom: viewportH - rect.top + 8 } : { top: rect.bottom + 8 }
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);
  import_react6.default.useEffect(() => {
    if (!open) return void 0;
    const onPointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus?.();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
  import_react6.default.useEffect(() => {
    if (!open) return;
    void store?.loadUsage?.({});
    void store?.loadAux?.({});
  }, [open, store]);
  const prevWide = import_react6.default.useRef(wide);
  import_react6.default.useEffect(() => {
    if (prevWide.current !== wide) {
      prevWide.current = wide;
      setOpen(false);
    }
  }, [wide]);
  if (!enabled) return null;
  const summary = quickSummaryVM({
    status: snapshot?.status,
    usage: snapshot?.usage,
    now: now()
  });
  const phase = snapshot?.phase ?? "loading";
  const hasAccounts = summary.total > 0;
  const alert = phase === "error" || summary.inFlightFull > 0 || summary.total > 0 && summary.cooling > 0;
  const badgeColor = phase === "error" ? tone.err.fg : phase === "stale" ? tone.warn.fg : alert ? tone.warn.fg : tone.ok.fg;
  const button = import_react6.default.createElement(
    "button",
    {
      ref: buttonRef,
      type: "button",
      "aria-haspopup": "dialog",
      "aria-expanded": open,
      "aria-label": "\u6E20\u9053\u8D26\u53F7",
      title: "\u6E20\u9053\u8D26\u53F7 \xB7 \u70B9\u51FB\u67E5\u770B\u8D26\u53F7\u6C60",
      onClick: () => setOpen((value) => !value),
      style: {
        font: "inherit",
        cursor: "pointer",
        border: "none",
        background: open ? "var(--dsw-alias-interactive-bg-active,rgba(0,0,0,.06))" : "transparent",
        color: "var(--dsw-alias-label-secondary,#6b7280)",
        borderRadius: 8,
        height: 32,
        padding: wide ? "0 8px" : 0,
        width: wide ? "100%" : 32,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        minWidth: 0,
        transition: "background .15s"
      }
    },
    import_react6.default.createElement(
      "span",
      { style: { position: "relative", display: "inline-flex", flex: "0 0 auto" } },
      import_react6.default.createElement(EntryIcon, { size: wide ? 17 : 18, color: badgeColor }),
      // 角标：rail 态唯一的异常信号
      alert || phase === "stale" ? import_react6.default.createElement("span", {
        style: {
          position: "absolute",
          right: -1,
          top: -1,
          width: 7,
          height: 7,
          borderRadius: 999,
          background: badgeColor,
          boxShadow: "0 0 0 2px var(--dsw-alias-bg-layer-1,#fff)"
        }
      }) : null
    ),
    wide ? import_react6.default.createElement(
      "span",
      { style: { display: "flex", alignItems: "baseline", gap: 6, minWidth: 0, flex: 1, justifyContent: "space-between" } },
      import_react6.default.createElement("span", { style: { fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, "\u6E20\u9053"),
      import_react6.default.createElement(
        "span",
        { style: { fontSize: 11.5, color: "var(--dsw-alias-label-tertiary,#8b93a1)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" } },
        phase === "error" ? "\u4E0D\u53EF\u8FBE" : hasAccounts ? `${summary.healthy}/${summary.total} \xB7 ${formatCompact(summary.usableCredits)}` : "\u65E0\u8D26\u53F7"
      )
    ) : null
  );
  const popover = open && anchor ? (0, import_react_dom.createPortal)(
    import_react6.default.createElement(Popover, {
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
      openSettings: hasOpenSettings?.() === true ? openSettings : void 0
    }),
    document.body
  ) : null;
  return import_react6.default.createElement(import_react6.default.Fragment, null, button, popover);
}
function Popover({ snapshot, summary, anchor, now, rootRef, onClose, onRefresh, openSettings }) {
  const phase = snapshot?.phase ?? "loading";
  const error = snapshot?.error;
  const refreshing = snapshot?.refreshing === true;
  const usage = snapshot?.usage;
  const sheet = typeof window !== "undefined" && window.innerWidth < 480;
  const seriesByUid = import_react6.default.useMemo(() => {
    const buckets = usage?.buckets;
    if (!Array.isArray(buckets) || buckets.length === 0) return /* @__PURE__ */ new Map();
    return usageSeriesByKey(buckets, "uid").series;
  }, [usage]);
  const usageByUid = import_react6.default.useMemo(() => {
    const rows = Array.isArray(usage?.by_uid) ? usage.by_uid : [];
    return new Map(rows.map((row) => [row.key, row]));
  }, [usage]);
  const maxCredits = Math.max(0, ...summary.accounts.map((account) => Number(account?.credits) || 0));
  const vms = summary.accounts.map(
    (account) => accountCardVM(account, {
      config: snapshot?.config,
      maxCredits,
      channelOf: void 0,
      authAccounts: snapshot?.authAccounts,
      creditsByUid: snapshot?.creditsByUid,
      now: now()
    })
  ).sort((a, b) => b.credits - a.credits || a.name.localeCompare(b.name));
  const daySpark = import_react6.default.useMemo(() => {
    if (!Array.isArray(usage?.buckets)) return [];
    return usageBySlot(usage.buckets).map((row) => row.requests);
  }, [usage]);
  return import_react6.default.createElement(
    "div",
    {
      ref: rootRef,
      className: "dshc-quick-pop",
      role: "dialog",
      "aria-label": "\u6E20\u9053\u8D26\u53F7",
      "data-freshness": phase,
      style: {
        position: "fixed",
        zIndex: 60,
        left: sheet ? 8 : anchor?.left,
        ...sheet ? { bottom: 8, right: 8 } : anchor?.top !== void 0 ? { top: anchor.top } : { bottom: anchor?.bottom },
        width: sheet ? "auto" : anchor?.width ?? POP_WIDTH,
        right: sheet ? 8 : void 0,
        maxWidth: sheet ? void 0 : "calc(100vw - 16px)",
        // 高度按按钮上下可用空间收敛（宿主窗口矮时不能顶着边缘被裁）
        maxHeight: sheet ? "70vh" : anchor?.maxHeight ?? POP_MAX_HEIGHT,
        display: "flex",
        flexDirection: "column",
        background: "var(--dsw-alias-bg-layer-1,#fff)",
        color: "var(--dsw-alias-label-primary,currentColor)",
        border: "1px solid var(--dsw-alias-border-l2,#e5e7eb)",
        borderRadius: 14,
        boxShadow: "0 18px 48px rgba(15,23,42,.20), 0 2px 8px rgba(15,23,42,.08)",
        overflow: "hidden"
      }
    },
    import_react6.default.createElement("style", null, QUICK_CSS),
    // ── 头部：品牌色渐变条 + 标题 + 新鲜度 + 关闭
    import_react6.default.createElement(
      "div",
      {
        style: {
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          minWidth: 0,
          background: "linear-gradient(135deg, var(--dsw-alias-button-info-fill,#4176f7)14, transparent 70%)",
          borderBottom: "1px solid var(--dsw-alias-border-l2,#eef1f5)"
        }
      },
      import_react6.default.createElement("span", { style: { color: tone.info.fg, display: "inline-flex" } }, import_react6.default.createElement(EntryIcon, { size: 15, color: "currentColor" })),
      import_react6.default.createElement("span", { style: { fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" } }, "\u6E20\u9053\u8D26\u53F7"),
      import_react6.default.createElement(
        "span",
        { style: { fontSize: 10.5, color: "var(--dsw-alias-label-tertiary,#8b93a1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 } },
        summary.version ? `${summary.version}${summary.uptimeSec ? ` \xB7 ${uptimeText(summary.uptimeSec)}` : ""}` : ""
      ),
      import_react6.default.createElement(
        "span",
        { style: { marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 } },
        import_react6.default.createElement(FreshnessPill, { phase, error, fetchedAt: snapshot?.fetchedAt, now: now() }),
        import_react6.default.createElement("button", {
          type: "button",
          "aria-label": "\u5173\u95ED",
          onClick: onClose,
          style: { font: "inherit", cursor: "pointer", border: "none", background: "transparent", color: "var(--dsw-alias-label-tertiary,#8b93a1)", width: 22, height: 22, borderRadius: 6, lineHeight: 1 }
        }, "\u2715")
      )
    ),
    // ── 错误态：不显示 0、不假装有数据
    phase === "error" ? import_react6.default.createElement(
      "div",
      { style: { padding: "14px 12px", display: "flex", flexDirection: "column", gap: 8 } },
      import_react6.default.createElement(
        "div",
        { style: { fontSize: 12.5, color: tone.err.fg, display: "flex", alignItems: "center", gap: 6 } },
        import_react6.default.createElement("span", { style: { width: 6, height: 6, borderRadius: 999, background: "currentColor" } }),
        error?.message ?? "\u7F51\u5173\u4E0D\u53EF\u8FBE"
      ),
      import_react6.default.createElement("div", { style: { ...s.muted, fontSize: 11.5 } }, snapshot?.baseURL ? `\u5730\u5740 ${snapshot.baseURL}` : "\u672A\u914D\u7F6E\u7F51\u5173\u5730\u5740"),
      import_react6.default.createElement(
        "div",
        { style: { display: "flex", gap: 8, marginTop: 2 } },
        import_react6.default.createElement("button", { type: "button", onClick: () => onRefresh?.(), style: { ...s.btnGhost, height: 28, fontSize: 12 } }, "\u91CD\u8BD5"),
        openSettings ? import_react6.default.createElement("button", { type: "button", onClick: openSettings, style: { ...s.btnPri, height: 28, fontSize: 12 } }, "\u6253\u5F00\u6E20\u9053\u4E2D\u5FC3") : null
      )
    ) : import_react6.default.createElement(
      import_react6.default.Fragment,
      null,
      // ── 汇总：三块统计
      import_react6.default.createElement(
        "div",
        { style: { display: "flex", gap: 8, padding: "10px 12px 4px" } },
        import_react6.default.createElement(
          Tile,
          {
            label: "\u53EF\u7528\u79EF\u5206",
            value: formatCompact(summary.usableCredits),
            accent: tone.info.fg,
            hint: summary.creditsFreshness?.stale ? "\u504F\u65E7" : void 0
          },
          import_react6.default.createElement(
            "div",
            { style: { display: "flex", alignItems: "center", gap: 8, marginTop: 2 } },
            import_react6.default.createElement(Ring, { ratio: summary.healthRatio, color: summary.healthy === summary.total ? tone.ok.fg : tone.warn.fg }),
            import_react6.default.createElement(
              "span",
              { style: { fontSize: 10.5, color: "var(--dsw-alias-label-tertiary,#8b93a1)", lineHeight: 1.35 } },
              `\u8D26\u53F7 ${summary.healthy}/${summary.total}`,
              summary.cooling > 0 ? import_react6.default.createElement("br", null) : null,
              summary.cooling > 0 ? `\u51B7\u5374 ${summary.cooling}` : ""
            )
          )
        ),
        import_react6.default.createElement(
          Tile,
          { label: "\u8FD1 24h", value: summary.usage24h ? formatNumber(summary.usage24h.requests) : "\u2014", hint: "\u6B21" },
          import_react6.default.createElement(
            "div",
            { style: { marginTop: 2, display: "flex", alignItems: "center", gap: 6, minWidth: 0 } },
            import_react6.default.createElement(Sparkline, { values: daySpark, color: tone.info.fg, width: 92, height: 20 })
          )
        )
      ),
      import_react6.default.createElement(
        "div",
        { style: { padding: "6px 12px 10px" } },
        import_react6.default.createElement(ChannelBar, {
          channels: summary.channels.map((row) => ({ ...row, color: channelColor(row.id) })),
          total: summary.total
        }),
        summary.usage24h ? import_react6.default.createElement(
          "div",
          { style: { ...s.muted, fontSize: 10.5, marginTop: 6 } },
          `${formatTokens(summary.usage24h.tokens)} tokens \xB7 \u6210\u529F ${formatNumber(summary.usage24h.success)} / \u5931\u8D25 ${formatNumber(summary.usage24h.failed)}${summary.inFlight > 0 ? ` \xB7 \u5728\u9014 ${summary.inFlight}` : ""}${typeof summary.sticky === "number" ? ` \xB7 \u7C98\u6027 ${summary.sticky}` : ""}`
        ) : null
      ),
      // ── 账号列表（滚动区）
      import_react6.default.createElement(
        "div",
        {
          className: "dshc-quick-scroll",
          style: { display: "flex", flexDirection: "column", gap: 2, padding: "4px 6px 8px", overflowY: "auto", minHeight: 0, flex: 1 }
        },
        vms.length === 0 ? import_react6.default.createElement(
          "div",
          { style: { ...s.muted, padding: "10px 8px", fontSize: 11.5 } },
          "\u7F51\u5173\u8FD8\u6CA1\u6709\u8D26\u53F7 \u2014\u2014 \u5230\u300C\u6E20\u9053\u4E2D\u5FC3\u300D\u6DFB\u52A0\u540E\u8FD9\u91CC\u4F1A\u81EA\u52A8\u51FA\u73B0\u3002"
        ) : vms.map(
          (vm) => import_react6.default.createElement(AccountQuickRow, {
            key: vm.uid,
            vm,
            series: seriesByUid.get(vm.uid),
            usageTotal: usageByUid.get(vm.uid)
          })
        )
      ),
      // ── 底栏：新鲜度 + 动作
      import_react6.default.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 12px",
            borderTop: "1px solid var(--dsw-alias-border-l2,#eef1f5)",
            background: "var(--dsw-alias-bg-layer-2,#fafbfc)"
          }
        },
        import_react6.default.createElement(
          "span",
          { style: { ...s.muted, fontSize: 10.5, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
          snapshot?.refreshError ? `\u5237\u65B0\u5931\u8D25\uFF1A${snapshot.refreshError.message ?? "\u672A\u77E5\u539F\u56E0"}` : summary.creditsFreshness?.oldestISO ? `\u79EF\u5206 ${relativeTime(summary.creditsFreshness.oldestISO, now())}${summary.creditsFreshness.stale ? "\uFF08\u504F\u65E7\uFF09" : ""}` : " "
        ),
        import_react6.default.createElement(
          "span",
          { style: { marginLeft: "auto", display: "inline-flex", gap: 6 } },
          import_react6.default.createElement("button", {
            type: "button",
            disabled: refreshing,
            onClick: onRefresh,
            title: "\u5411\u4E0A\u6E38\u91CD\u53D6\u5404\u8D26\u53F7\u4F59\u989D\uFF08\u4F1A\u771F\u6253\u4E00\u6B21\u4E0A\u6E38\uFF09",
            style: { ...s.btnGhost, height: 28, fontSize: 12, opacity: refreshing ? 0.6 : 1 }
          }, refreshing ? "\u5237\u65B0\u4E2D\u2026" : "\u5237\u65B0"),
          openSettings ? import_react6.default.createElement("button", { type: "button", onClick: openSettings, style: { ...s.btnPri, height: 28, fontSize: 12 } }, "\u6E20\u9053\u4E2D\u5FC3") : null
        )
      )
    )
  );
}

// client/quick-store.js
var QUICK_POLL_MS = 6e4;
var QUICK_STALE_MS = 12e4;
var QUICK_USAGE_TTL_MS = 6e4;
var QUICK_BACKOFF_MS = 3e5;
var QUICK_FAIL_THRESHOLD = 3;
var QUICK_MANUAL_QUIET_MS = 5e3;
var QUICK_AUX_TTL_MS = 6e5;
function quickFreshness(snapshot, now = Date.now()) {
  if (!snapshot) return "loading";
  if (snapshot.error) return "error";
  if (!snapshot.fetchedAt) return "loading";
  return now - snapshot.fetchedAt > QUICK_STALE_MS ? "stale" : "fresh";
}
function createQuickStore(rpcCall, options = {}) {
  const pollMs = options.pollMs ?? QUICK_POLL_MS;
  const now = options.now ?? (() => Date.now());
  const doc = options.document ?? (typeof document === "undefined" ? void 0 : document);
  const usageTtlMs = options.usageTtlMs ?? QUICK_USAGE_TTL_MS;
  const manualQuietMs = options.manualQuietMs ?? QUICK_MANUAL_QUIET_MS;
  let snapshot = {
    phase: "loading",
    // loading | fresh | stale | error
    status: void 0,
    // /status 正文
    baseURL: "",
    probe: void 0,
    error: void 0,
    fetchedAt: 0,
    failures: 0,
    degraded: false,
    // 是否处于退避期（通知 UI 别期待自动恢复）
    usage: void 0,
    usageAvailable: void 0,
    usageReason: void 0,
    usageAt: 0,
    /** 网关 config.json（只为 `pool.max_in_flight*` 分档分母；读不到就降级为无上限显示）。 */
    config: void 0,
    /** 凭证盘点（只为「到期」用凭证 expiresAt 优先）；读不到就回落到积分套餐到期。 */
    authAccounts: void 0,
    auxAt: 0,
    refreshing: false,
    refreshError: void 0,
    lastRefreshAt: 0
  };
  const listeners = /* @__PURE__ */ new Set();
  let timer;
  let inFlight;
  let disposed = false;
  let visibleListener;
  let quietUntil = 0;
  const emit = () => {
    const next = { ...snapshot, phase: quickFreshness(snapshot, now()), degraded: snapshot.degraded };
    snapshot = next;
    for (const listener of [...listeners]) {
      try {
        listener(snapshot);
      } catch {
      }
    }
  };
  const patch = (part) => {
    snapshot = { ...snapshot, ...part };
    emit();
  };
  async function loadStatus() {
    if (disposed || inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const result = await rpcCall(ENDPOINTS.getStatus, {});
        if (disposed) return;
        if (!result || result.ok === false) {
          throw new Error(result?.error?.message ?? "RPC \u8C03\u7528\u5931\u8D25");
        }
        const value = result.value ?? {};
        if (value.reachable === false) {
          patch({
            status: void 0,
            baseURL: value.baseURL ?? snapshot.baseURL,
            probe: value.probe,
            error: value.error ?? { code: "unreachable", message: "\u7F51\u5173\u4E0D\u53EF\u8FBE" },
            fetchedAt: 0,
            failures: snapshot.failures + 1
          });
          return;
        }
        if (value.error) {
          patch({
            status: void 0,
            baseURL: value.baseURL ?? snapshot.baseURL,
            probe: value.probe,
            error: value.error,
            fetchedAt: 0,
            failures: snapshot.failures + 1
          });
          return;
        }
        patch({
          status: value.status,
          baseURL: value.baseURL ?? snapshot.baseURL,
          probe: value.probe,
          error: void 0,
          fetchedAt: now(),
          failures: 0,
          degraded: false
        });
      } catch (error) {
        if (disposed) return;
        patch({
          error: { code: error?.code ?? "unexpected", message: String(error?.message ?? error) },
          failures: snapshot.failures + 1
        });
      } finally {
        inFlight = void 0;
        emit();
      }
    })();
    return inFlight;
  }
  async function loadUsage({ force = false } = {}) {
    if (disposed) return;
    if (!force && snapshot.usage && now() - snapshot.usageAt < usageTtlMs) return;
    try {
      const result = await rpcCall(ENDPOINTS.getUsage, { window: "24h" });
      if (disposed) return;
      if (!result || result.ok === false) {
        patch({ usageAvailable: false, usageReason: result?.error?.message ?? "\u7528\u91CF\u4E0D\u53EF\u7528", usageAt: now() });
        return;
      }
      const value = result.value ?? {};
      patch({
        usage: value.available === false ? void 0 : value.usage,
        usageAvailable: value.available !== false,
        usageReason: value.reason,
        usageAt: now()
      });
    } catch (error) {
      if (disposed) return;
      patch({ usageAvailable: false, usageReason: String(error?.message ?? error), usageAt: now() });
    }
  }
  async function loadAux({ force = false } = {}) {
    if (disposed) return;
    if (!force && snapshot.auxAt && now() - snapshot.auxAt < (options.auxTtlMs ?? QUICK_AUX_TTL_MS)) return;
    const [configResult, accountsResult] = await Promise.all([
      rpcCall(ENDPOINTS.getConfig, {}).catch((error) => ({ ok: false, error: { message: String(error?.message ?? error) } })),
      rpcCall(ENDPOINTS.getAccounts, {}).catch(() => ({ ok: false }))
    ]);
    if (disposed) return;
    const configValue = configResult?.ok === false ? void 0 : configResult?.value;
    const accountsValue = accountsResult?.ok === false ? void 0 : accountsResult?.value;
    patch({
      config: configValue?.ok === false ? void 0 : configValue?.config,
      authAccounts: Array.isArray(accountsValue?.accounts) ? accountsValue.accounts : snapshot.authAccounts,
      auxAt: now()
    });
  }
  async function refreshUpstream() {
    if (disposed || snapshot.refreshing) return false;
    patch({ refreshing: true, refreshError: void 0 });
    try {
      const result = await rpcCall(ENDPOINTS.refreshStatus, {});
      if (disposed) return false;
      if (!result || result.ok === false) {
        patch({ refreshing: false, refreshError: result?.error ?? { message: "\u5237\u65B0\u5931\u8D25" } });
        return false;
      }
      const value = result.value ?? {};
      patch({
        refreshing: false,
        status: value.status ?? snapshot.status,
        baseURL: value.baseURL ?? snapshot.baseURL,
        error: value.reachable === false ? value.error ?? { message: "\u7F51\u5173\u4E0D\u53EF\u8FBE" } : void 0,
        refreshError: value.refreshed === false ? value.refreshError ?? { message: "\u5237\u65B0\u672A\u5B8C\u6210" } : void 0,
        fetchedAt: value.status ? now() : snapshot.fetchedAt,
        failures: 0,
        lastRefreshAt: now()
      });
      void loadUsage({ force: true });
      quietUntil = now() + manualQuietMs;
      return true;
    } catch (error) {
      if (disposed) return false;
      patch({ refreshing: false, refreshError: { message: String(error?.message ?? error) } });
      return false;
    } finally {
      schedule();
    }
  }
  function schedule() {
    if (disposed || !timer) return;
    clearTimeout(timer);
    timer = setTimeout(tick, pollMs);
    if (typeof timer?.unref === "function") timer.unref();
  }
  async function tick() {
    if (disposed) return;
    if (doc?.visibilityState === "hidden") {
      schedule();
      return;
    }
    if (now() < quietUntil) {
      schedule();
      return;
    }
    if (snapshot.failures >= QUICK_FAIL_THRESHOLD) {
      timer = setTimeout(tick, QUICK_BACKOFF_MS);
      if (typeof timer?.unref === "function") timer.unref();
      patch({ degraded: true });
      return;
    }
    await loadStatus();
    schedule();
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start() {
      if (disposed) return;
      if (!timer) {
        timer = setTimeout(tick, pollMs);
        if (typeof timer?.unref === "function") timer.unref();
      }
      if (doc?.addEventListener && !visibleListener) {
        visibleListener = () => {
          if (doc.visibilityState === "visible") void loadStatus().then(schedule);
        };
        doc.addEventListener("visibilitychange", visibleListener);
      }
      void loadStatus();
      void loadAux();
    },
    loadStatus,
    loadUsage,
    loadAux,
    refreshUpstream,
    dispose() {
      disposed = true;
      if (timer) clearTimeout(timer);
      timer = void 0;
      if (doc?.removeEventListener && visibleListener) {
        doc.removeEventListener("visibilitychange", visibleListener);
      }
      visibleListener = void 0;
      listeners.clear();
    }
  };
}
function createSidebarPrefs(settingsScope, options = {}) {
  const namespace = options.namespace ?? "dsh-chanhub";
  const key = options.key ?? "sidebarEntry";
  const defaultValue = options.defaultValue ?? true;
  if (!settingsScope || typeof settingsScope.bind !== "function") {
    return {
      available: false,
      writable: false,
      mode: "unavailable",
      value: defaultValue,
      set: async () => false,
      subscribe: () => () => {
      },
      dispose: () => {
      }
    };
  }
  const scope = settingsScope.bind({ namespace });
  const read = () => {
    const snap = scope.getSnapshot?.() ?? {};
    const value = snap?.value?.[key];
    return typeof value === "boolean" ? value : defaultValue;
  };
  return {
    available: true,
    get writable() {
      const snap = scope.getSnapshot?.() ?? {};
      return snap.writable === true && snap.mode === "host";
    },
    get mode() {
      return scope.getSnapshot?.()?.mode ?? "unknown";
    },
    get value() {
      return read();
    },
    /** 写宿主设置；返回是否成功（失败时不改本地判断，交给订阅回流）。 */
    async set(next) {
      try {
        await scope.set?.(key, next);
        return true;
      } catch {
        return false;
      }
    },
    subscribe(listener) {
      const off = scope.subscribe?.(listener);
      return typeof off === "function" ? off : () => {
      };
    },
    dispose() {
      scope.dispose?.();
    }
  };
}

// client/index.js
var name = "dsh-chanhub";
var SETTINGS_NAMESPACE = "dsh-chanhub";
var inject = ["slots", "connection", "settingsScope"];
var TASK_DEFS = [
  { name: "checkin", label: "\u7B7E\u5230", icon: "\u{1F4C5}", key: "checkin" },
  // balance 第七类任务（网关 balance.go）：逐号查余额不签到，签到后余额才解冻的
  // 传统路径之外，给面板一个独立的「立即刷新余额」入口（改 expiring_soon 后即查）。
  { name: "balance", label: "\u67E5\u4F59\u989D", icon: "\u{1F4B0}", key: "balance" },
  { name: "activity", label: "\u6D3B\u8DC3\u5730\u56FE", icon: "\u{1F5FA}", key: "activity" },
  { name: "travel", label: "\u732B\u732B\u65C5\u884C", icon: "\u{1F431}", key: "travel" },
  { name: "keepalive", label: "token \u4FDD\u6D3B", icon: "\u{1F511}", key: "keepalive" },
  { name: "school", label: "\u5F00\u5B66\u5B63", icon: "\u{1F393}", key: "school" },
  { name: "cat", label: "\u591C\u732B\u5B50", icon: "\u{1F319}", key: "cat" }
];
var TASK_STATUS_TONE = { ok: "ok", already: "info", fail: "err", skipped: "idle" };
var TASK_STATUS_LABEL = { ok: "\u5DF2\u5B8C\u6210", already: "\u5DF2\u7B7E\u8FC7", fail: "\u5931\u8D25", skipped: "\u8DF3\u8FC7" };
var TABS = [
  { id: "accounts", label: "\u8D26\u53F7\u6C60", icon: "chart" },
  { id: "tasks", label: "\u4EFB\u52A1", icon: "check" },
  { id: "usage", label: "\u7528\u91CF", icon: "trend" },
  { id: "logs", label: "\u65E5\u5FD7", icon: "list" },
  { id: "config", label: "\u914D\u7F6E", icon: "gear" }
];
function OverviewCard({ status, channelOf, showDistribution, onToggleDistribution, earned }) {
  const counters = summaryCounters(status);
  const realms = realmAvailability(status?.realm_totals);
  const grouped = groupByChannel(status?.accounts ?? [], channelOf);
  const maxRealm = Math.max(1, ...realms.map((realm) => realm.total));
  const earnTitle = earned ? `\u8D5A\u5F97\u79EF\u5206 = \u5404\u8D26\u53F7\u9010\u5957\u9910\u660E\u7EC6\u7684\u989D\u5EA6\u603B\u91CF\u4E4B\u548C\uFF08\u542B\u5DF2\u6D88\u8017\u6389\u7684\uFF09\uFF0C\u6DB5\u76D6\u7B7E\u5230 / \u6D3B\u52A8 / \u62C9\u65B0\u7B49\u6765\u6E90\u3002\u5DF2\u6D88\u8017 ${formatNumber(Math.round(earned.used))} \xB7 \u5269\u4F59 ${formatNumber(Math.round(earned.remain))}\u3002\u5DF2\u8FC7\u671F\u4E14\u4E0A\u6E38\u4E0D\u518D\u4E0B\u53D1\u7684\u5957\u9910\u4E0D\u8BA1\u5165 \u2014\u2014 \u56E0\u6B64\u662F\u4E0B\u754C\u3002` + (earned.missing > 0 ? `\u53E6\u6709 ${earned.missing} \u4E2A\u8D26\u53F7\u672A\u53D6\u5230\u660E\u7EC6\uFF0C\u672A\u8BA1\u5165\u3002` : "") : "";
  const earnValue = earned && earned.covered > 0 ? formatCompact(Math.round(earned.total)) : "\u2014";
  const earnSub = earned ? earned.covered > 0 ? `\u5DF2\u6D88\u8017 ${formatCompact(Math.round(earned.used))}` : `${earned.count} \u4E2A\u8D26\u53F7\u5747\u672A\u53D6\u5230\u5957\u9910\u660E\u7EC6` : "\u52A0\u8F7D\u4E2D\u2026";
  const earnCounter = {
    key: "earned",
    label: "\u8D5A\u5F97\u79EF\u5206",
    value: earnValue,
    tone: "ok",
    title: earnTitle,
    valueTitle: earned && earned.covered > 0 ? `\u7CBE\u786E\u503C ${formatNumber(Math.round(earned.total))}` : void 0,
    sub: earnSub
  };
  const stickyIdx = counters.findIndex((c) => c.key === "sticky");
  const ordered = stickyIdx >= 0 ? [...counters.slice(0, stickyIdx + 1), earnCounter, ...counters.slice(stickyIdx + 1)] : [...counters, earnCounter];
  return React.createElement(
    "div",
    { style: s.card },
    // KPI 行：账号总数（点击展开渠道分布）+ 健康/冷却/在途满 + 粘性会话 + 赚得积分。
    // 赚得积分紧贴粘性会话右侧，与粘性会话同处一行（insert 在 sticky 之后）。
    React.createElement(
      "div",
      { className: "dshc-kpis" },
      ...ordered.map((counter) => {
        const clickable = counter.key === "total";
        const valueTitle = counter.valueTitle;
        const sub = counter.sub;
        return React.createElement(
          "button",
          {
            key: counter.label,
            type: "button",
            className: "dshc-kpi",
            onClick: clickable ? onToggleDistribution : void 0,
            title: counter.title ?? (clickable ? "\u70B9\u51FB\u67E5\u770B\u6E20\u9053\u5206\u5E03" : void 0),
            style: { ...s.kpi, cursor: clickable ? "pointer" : "default" }
          },
          React.createElement(
            "div",
            { style: { ...s.muted, fontSize: 11 } },
            counter.label,
            clickable ? " \u25BE" : ""
          ),
          React.createElement(
            "div",
            {
              style: { fontSize: 20, fontWeight: 600, color: (tone[counter.tone] ?? tone.idle).fg },
              title: valueTitle
            },
            String(counter.value)
          ),
          sub ? React.createElement("div", { style: { ...s.muted, fontSize: 10.5, marginTop: 2 } }, sub) : null
        );
      })
    ),
    // 渠道分布（点「账号总数」展开）
    showDistribution ? React.createElement(
      "div",
      { className: "dshc-row", style: { marginTop: 10, paddingLeft: 4 } },
      ...grouped.channels.map(
        (channel) => React.createElement(Tag, {
          key: channel.id,
          text: `${channel.label} ${channel.count} \u4E2A\u8D26\u53F7`,
          tone: channel.count > 0 ? "info" : "idle"
        })
      )
    ) : null,
    // 三渠道积分卡（WB / Trae / Qoder；无号的置灰占位）—— 这是**当前可用**，
    // 与 KPI 行里的「累计赚得」是两个数，别读成一个。
    React.createElement(
      "div",
      { className: "dshc-chancards", style: { marginTop: 10 } },
      ...grouped.channels.map(
        (channel) => React.createElement(
          "div",
          { key: channel.id, className: `dshc-chancard${channel.count === 0 ? " dim" : ""}` },
          React.createElement("div", { style: { ...s.muted, fontSize: 11 } }, channel.label),
          React.createElement(
            "div",
            {
              style: { fontSize: 22, fontWeight: 700, lineHeight: 1.3, color: channel.count > 0 ? tone.ok.fg : tone.idle.fg },
              title: `\u7CBE\u786E\u503C ${formatNumber(channel.credits)}`
            },
            channel.count > 0 ? formatCompact(channel.credits) : "\u2014"
          ),
          React.createElement("div", { style: { ...s.muted, fontSize: 10.5 } }, `${channel.count} \u4E2A\u8D26\u53F7`)
        )
      )
    ),
    // 域可用性条（realm_totals 独有数据，保留）
    realms.length > 0 ? React.createElement(
      "div",
      { style: { marginTop: 10 } },
      ...realms.map(
        (realm) => React.createElement(
          "div",
          { key: realm.realm, className: "dshc-row", style: { marginBottom: 4 } },
          React.createElement("span", { style: { ...s.muted, width: 74, flexShrink: 0 } }, realm.label),
          React.createElement(
            "span",
            { style: { ...s.muted, whiteSpace: "nowrap" } },
            `${realm.healthy}/${realm.total} \u53EF\u7528`
          ),
          React.createElement(
            "span",
            { className: "dshc-palette" },
            React.createElement("span", {
              style: {
                width: `${realm.healthy / maxRealm * 100}%`,
                background: tone.ok.fg
              }
            })
          ),
          realm.cooling > 0 ? React.createElement(Tag, { text: `\u51B7\u5374 ${realm.cooling}`, tone: "warn" }) : null,
          realm.disabled > 0 ? React.createElement(Tag, { text: `\u7981\u7528 ${realm.disabled}`, tone: "err" }) : null
        )
      )
    ) : null
  );
}
function AccountFold({ account, maxInFlight, channel, onAction, busy, credits, scheduleConfig, onRemove, defaultOpen = false }) {
  const state = accountState(account, maxInFlight);
  const dot = (tone[state.tone] ?? tone.idle).fg;
  const label = channelLabel(channel);
  const actionButton = (action) => {
    const text = { disable: "\u7981\u7528", enable: "\u542F\u7528", revive: "\u590D\u6D3B" }[action];
    return React.createElement(
      "button",
      {
        key: action,
        type: "button",
        style: { ...s.btnLink, opacity: busy ? 0.5 : 1 },
        disabled: busy,
        onClick: (event) => {
          event.preventDefault();
          event.stopPropagation();
          onAction(account, action);
        }
      },
      text
    );
  };
  const summary = React.createElement(
    React.Fragment,
    null,
    React.createElement("span", { className: "dshc-dot", style: { background: dot } }),
    React.createElement(
      "span",
      { style: { ...s.label, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
      account.nickname || account.uid.slice(0, 8)
    ),
    label ? React.createElement(Tag, { text: label, tone: "info" }) : null,
    account.realm ? React.createElement(Tag, { text: account.realm, tone: "idle" }) : null,
    React.createElement(Tag, { text: state.label, tone: state.tone, title: state.detail || void 0 }),
    React.createElement(
      "span",
      { style: { ...s.muted, marginLeft: "auto", textAlign: "right" } },
      `${formatNumber(account.credits ?? 0)} \u79EF\u5206 \xB7 \u5728\u9014 ${account.in_flight ?? 0} \xB7 ${account.success_count ?? 0}/${account.err_total ?? 0}`
    ),
    // 折叠头右侧动作：必须是 span + pointer-events:none，否则会连带触发展开（坑 2）
    state.actions.length > 0 ? React.createElement(
      "span",
      { style: { display: "inline-flex", gap: 8, pointerEvents: "none", flexShrink: 0 } },
      ...state.actions.map(
        (action) => React.createElement(
          "span",
          { key: action, style: { ...s.btnLink, opacity: busy ? 0.5 : 1 } },
          { disable: "\u7981\u7528", enable: "\u542F\u7528", revive: "\u590D\u6D3B" }[action]
        )
      )
    ) : null
  );
  return React.createElement(
    Fold,
    { summary, open: defaultOpen },
    // 四组折叠：健康 / 质量 / 积分 / 任务。收起时也要能判断状态（摘要带关键数据）。
    React.createElement(
      Fold,
      { summary: React.createElement(
        "span",
        { className: "dshc-row", style: { minWidth: 0 } },
        React.createElement("span", { style: s.label }, "\u5065\u5EB7"),
        React.createElement("span", { style: s.muted }, healthSummary(account, state))
      ), open: defaultOpen },
      React.createElement(
        "div",
        { className: "dshc-grid" },
        ...accountRow("UID", account.uid),
        ...accountRow("\u57DF", account.realm || "\u2014"),
        ...accountRow("\u6E20\u9053", label || "\u2014"),
        ...accountRow("\u5728\u9014", String(account.in_flight ?? 0)),
        ...accountRow("\u7194\u65AD\u8BA1\u6570", String(account.breaker_fails ?? 0)),
        ...accountRow("\u7194\u65AD\u81F3", isZeroTime(account.breaker_until) ? "\u2014" : formatAbsolute(account.breaker_until)),
        ...accountRow("\u8FDE\u8D25", String(account.consecutive_fails ?? 0)),
        ...accountRow("\u964D\u6743\u81F3", isZeroTime(account.degrade_until) ? "\u2014" : formatAbsolute(account.degrade_until)),
        ...account.cooling ? [
          ...accountRow("\u51B7\u5374\u7C7B\u578B", account.cool_kind || "\u2014"),
          ...accountRow("\u51B7\u5374\u5269\u4F59", formatDuration(account.cool_remaining_sec))
        ] : [],
        ...account.manual_reason ? accountRow("\u624B\u52A8\u505C\u7528\u539F\u56E0", account.manual_reason) : [],
        ...account.disabled_reason ? accountRow("\u7CFB\u7EDF\u7981\u7528\u539F\u56E0", account.disabled_reason) : []
      ),
      // 动作按钮放在展开区（真正的 button，可点击）
      state.actions.length > 0 ? React.createElement(
        "div",
        { className: "dshc-row", style: { marginTop: 10 } },
        ...state.actions.map(
          (action) => React.createElement(
            "button",
            {
              key: action,
              type: "button",
              style: s.btnGhost,
              disabled: busy,
              onClick: () => onAction(account, action)
            },
            { disable: "\u7981\u7528\uFF08\u6458\u51FA\u9009\u53F7\u6C60\uFF09", enable: "\u89E3\u9664\u624B\u52A8\u505C\u7528", revive: "\u590D\u6D3B\uFF08\u6E05\u7CFB\u7EDF\u7981\u7528\uFF09" }[action]
          )
        ),
        ...onRemove ? [React.createElement("button", {
          key: "remove",
          type: "button",
          style: { ...s.btnGhost, borderColor: tone.err.fg, color: tone.err.fg },
          disabled: busy,
          onClick: () => onRemove(account)
        }, "\u79FB\u9664\u8D26\u53F7\uFF08\u5220\u9664\u51ED\u8BC1\uFF09")] : []
      ) : null,
      state.key === "manual+disabled" ? React.createElement(
        "div",
        { style: { ...s.warn, marginTop: 10 } },
        "\u8BE5\u8D26\u53F7\u540C\u65F6\u5904\u4E8E\u300C\u624B\u52A8\u505C\u7528\u300D\u4E0E\u300C\u7CFB\u7EDF\u7981\u7528\u300D\u4E24\u4E2A\u72EC\u7ACB\u72B6\u6001\u4F4D\u3002\u540E\u7AEF\u4E24\u8005\u72EC\u7ACB\u6E05\u9664\uFF1A",
        "\u9700\u5148\u300C\u89E3\u9664\u624B\u52A8\u505C\u7528\u300D\u518D\u300C\u590D\u6D3B\u300D\u624D\u80FD\u56DE\u5230\u9009\u53F7\u6C60 \u2014\u2014 \u70B9\u4E00\u6B21\u4E0D\u4F1A\u540C\u65F6\u6E05\u6389\u4E24\u4F4D\u3002"
      ) : null
    ),
    React.createElement(
      Fold,
      { summary: React.createElement(
        "span",
        { className: "dshc-row", style: { minWidth: 0 } },
        React.createElement("span", { style: s.label }, "\u8D28\u91CF"),
        React.createElement("span", { style: s.muted }, qualitySummary(account))
      ), open: defaultOpen },
      React.createElement(
        "div",
        { className: "dshc-grid" },
        ...accountRow("\u6210\u529F\u6B21\u6570", String(account.success_count ?? 0)),
        ...accountRow("\u5931\u8D25\u6B21\u6570", String(account.err_total ?? 0)),
        ...accountRow("\u6700\u8FD1\u6210\u529F", relativeTime(account.last_success)),
        ...accountRow("\u6700\u8FD1\u5931\u8D25", isZeroTime(account.last_err) ? "\u2014" : relativeTime(account.last_err)),
        ...accountRow("\u8FDE\u7EED12153", String(account.session_dead_fails ?? 0)),
        ...accountRow("\u9000\u907F\u6307\u6570", String(account.retry_count ?? 0))
      ),
      tokenUsageTable(account.token_usage)
    ),
    React.createElement(
      Fold,
      { summary: React.createElement(
        "span",
        { className: "dshc-row", style: { minWidth: 0 } },
        React.createElement("span", { style: s.label }, "\u79EF\u5206"),
        React.createElement("span", { style: s.muted }, creditsSummary(account))
      ), open: defaultOpen },
      React.createElement(
        "div",
        { className: "dshc-grid" },
        ...accountRow("\u53EF\u6D88\u8017\u79EF\u5206", formatNumber(account.credits ?? 0)),
        ...isZeroTime(account.credits_at) ? [] : accountRow("\u4F59\u989D\u66F4\u65B0\u4E8E", relativeTime(account.credits_at)),
        ...account.credits_expiring !== void 0 ? accountRow("\u5FEB\u8FC7\u671F\u79EF\u5206", formatNumber(account.credits_expiring)) : [],
        ...accountRow("\u4E0A\u6E38\u603B\u989D", formatNumber(account.credits_total ?? 0)),
        ...accountRow("\u4E0D\u53EF\u6D88\u8017", formatNumber(Math.max(0, (account.credits_total ?? 0) - (account.credits ?? 0))))
      ),
      React.createElement(CreditsBreakdown, { credits, account }),
      modelCostsTable(account.model_costs),
      rateLimitedNotice(account.rate_limited_models)
    ),
    React.createElement(
      Fold,
      { summary: React.createElement(
        "span",
        { className: "dshc-row", style: { minWidth: 0 } },
        React.createElement("span", { style: s.label }, "\u4EFB\u52A1"),
        React.createElement(
          "span",
          { style: s.muted },
          scheduleFoldSummary(scheduleConfig)
        )
      ) },
      // 排程区块（两级递进，ui-design §4.2）：折叠态一行 6 色块，展开看 6 项明细。
      // 数据源是两类真实信息：
      //   1. 排程配置（config.json schedule 段：启用状态 / 计划时刻）；
      //   2. 是否在可执行时间窗内（由小时表与本机时钟推导）。
      // 执行结果（已签与否/进行中）网关不透出 → scheduleState 返回 unknown，
      // 色块只表达「启用/窗口内/待窗口」，绝不编造执行状态。
      React.createElement(
        "div",
        { className: "dshc-row", style: { marginBottom: 8 } },
        ...SCHEDULE_ITEMS.map((item) => {
          const st = scheduleState(item, scheduleConfig);
          return React.createElement("span", {
            key: item.id,
            className: `dshc-dp ${st.key}`,
            title: `${st.label}\uFF1A${scheduleHoursText(item, scheduleConfig)}` + (st.key === "na" ? " \xB7 \u672A\u542F\u7528/\u672A\u914D\u7F6E" : st.inWindow ? " \xB7 \u65F6\u95F4\u7A97\u5185" : " \xB7 \u7A97\u53E3\u5916")
          }, st.key === "na" ? "\u2014" : st.inWindow ? "\u25CF" : "\xB7");
        }),
        React.createElement(
          "span",
          { style: { ...s.muted, marginLeft: 4 } },
          scheduleFoldSummary(scheduleConfig)
        )
      ),
      React.createElement(
        "div",
        { style: { marginBottom: 8 } },
        ...SCHEDULE_ITEMS.map((item) => {
          const st = scheduleState(item, scheduleConfig);
          return React.createElement(
            "div",
            { key: item.id, className: "dshc-row", style: { minHeight: 22 } },
            React.createElement("span", { style: { ...s.label, minWidth: 90 } }, `${item.icon} ${item.label}`),
            React.createElement("span", { style: s.muted }, scheduleHoursText(item, scheduleConfig)),
            React.createElement(Tag, {
              text: st.key === "na" ? "\u672A\u542F\u7528" : st.inWindow ? "\u7A97\u53E3\u5185" : "\u7A97\u53E3\u5916",
              tone: st.key === "na" ? "idle" : "info"
            }),
            item.note ? React.createElement("span", { style: s.muted }, item.note) : null
          );
        })
      ),
      React.createElement(
        "div",
        { style: { ...s.muted, lineHeight: 1.7 } },
        "\u8272\u5757\u4E0E\u6807\u7B7E\u53EA\u8868\u8FBE\u6392\u7A0B\u914D\u7F6E\u4E0E\u65F6\u95F4\u7A97\uFF08\u771F\u5B9E\u53EF\u8BFB\uFF09\uFF1B\u5404\u4EFB\u52A1\u7684\u6267\u884C\u7ED3\u679C",
        "\u5728\u300C\u4EFB\u52A1\u300DTab \u7ECF\u7F51\u5173\u4EFB\u52A1\u72B6\u6001\u7AEF\u70B9\u67E5\u770B \u2014\u2014 \u90A3\u91CC\u662F\u7F51\u5173\u5B9E\u6D4B\u6570\u636E\uFF0C\u6B64\u5904\u4E0D\u91CD\u590D\u3002"
      )
    )
  );
}
function scheduleFoldSummary(scheduleConfig) {
  const enabled = SCHEDULE_ITEMS.filter((item) => scheduleState(item, scheduleConfig).key !== "na").length;
  return `${enabled}/${SCHEDULE_ITEMS.length} \u9879\u6392\u7A0B\u542F\u7528 \xB7 ${GROWTH_CODES.length} \u4E2A\u6210\u957F\u7801`;
}
function CreditsBreakdown({ credits, account }) {
  if (credits && credits.available === false) {
    return React.createElement(
      "div",
      { style: { ...s.muted, marginTop: 10, lineHeight: 1.7 } },
      credits.reason ?? "\u8BE5\u7F51\u5173\u7248\u672C\u672A\u63D0\u4F9B\u9010\u5957\u9910\u660E\u7EC6\u7AEF\u70B9\u3002"
    );
  }
  if (!credits || credits.available !== true || !credits.credits) {
    return React.createElement("div", { style: { ...s.muted, marginTop: 10 } }, "\u9010\u5957\u9910\u660E\u7EC6\u52A0\u8F7D\u4E2D\u2026");
  }
  const data = credits.credits;
  const items = Array.isArray(data.items) ? data.items : [];
  const withBalance = items.filter((item) => (item.remain ?? 0) > 0);
  const spent = items.length - withBalance.length;
  if (items.length === 0) {
    return React.createElement(
      "div",
      { style: { ...s.muted, marginTop: 10 } },
      "\u7F51\u5173\u672A\u8FD4\u56DE\u4EFB\u4F55\u5957\u9910\u660E\u7EC6\u3002"
    );
  }
  return React.createElement(
    "div",
    { style: { marginTop: 10 } },
    React.createElement(
      "div",
      { className: "dshc-row", style: { marginBottom: 8 } },
      React.createElement(Tag, { text: `\u53EF\u7528 ${formatNumber(data.usable_total ?? 0)}`, tone: "ok" }),
      (data.unusable_total ?? 0) > 0 ? React.createElement(Tag, { text: `\u4E0D\u53EF\u6D88\u8017 ${formatNumber(data.unusable_total)}`, tone: "warn" }) : null,
      React.createElement(Tag, { text: `\u5171 ${data.item_count ?? items.length} \u4E2A\u5957\u9910`, tone: "idle" }),
      spent > 0 ? React.createElement(Tag, { text: `${spent} \u4E2A\u5DF2\u8017\u5C3D`, tone: "idle" }) : null,
      typeof data.upstream_remain === "number" && data.upstream_remain !== data.usable_total ? React.createElement(Tag, {
        text: `\u4E0A\u6E38\u5408\u8BA1 ${formatNumber(data.upstream_remain)}\uFF08\u4E0E\u660E\u7EC6\u6C42\u548C\u4E0D\u4E00\u81F4\uFF09`,
        tone: "warn"
      }) : null
    ),
    React.createElement(
      "div",
      { className: "dshc-tblwrap" },
      React.createElement(
        "table",
        null,
        React.createElement(
          "thead",
          null,
          React.createElement(
            "tr",
            null,
            ...["\u5957\u9910", "\u603B\u91CF", "\u5DF2\u7528", "\u5269\u4F59", "\u6709\u6548\u671F", ""].map((h) => React.createElement("th", { key: h }, h))
          )
        ),
        React.createElement(
          "tbody",
          null,
          ...withBalance.map(
            (item, index) => React.createElement(
              "tr",
              { key: `${item.name}-${item.expire_at}-${index}` },
              React.createElement("td", null, item.name),
              React.createElement("td", null, formatNumber(item.total ?? 0)),
              React.createElement("td", null, formatNumber(item.used ?? 0)),
              React.createElement("td", null, formatNumber(item.remain ?? 0)),
              React.createElement("td", null, item.expire_at ? formatAbsolute(item.expire_at) : "\u2014"),
              React.createElement(
                "td",
                null,
                item.usable === false ? React.createElement(Tag, { text: "\u4E0D\u53EF\u6D88\u8017", tone: "warn" }) : null
              )
            )
          )
        )
      )
    ),
    React.createElement(
      "div",
      { style: { ...s.muted, marginTop: 8, lineHeight: 1.7 } },
      "\u53EA\u5217\u8FD8\u6709\u4F59\u989D\u7684\u5957\u9910\uFF08\u5DF2\u8017\u5C3D\u7684 " + spent + " \u4E2A\u4E0D\u663E\u793A\uFF09\u3002",
      (data.unusable_total ?? 0) > 0 ? "\u300C\u4E0D\u53EF\u6D88\u8017\u300D\u6307\u8BE5\u989D\u5EA6\u6C60\u672C\u7F51\u5173\u7528\u4E0D\u4E86\uFF08\u5982 Trae \u7684\u5B98\u65B9\u5BA2\u6237\u7AEF\u4E13\u7528\u6C60\uFF09\uFF0C\u4E0D\u8BA1\u5165\u53EF\u7528\u4F59\u989D\u3002" : ""
    )
  );
}
function accountRow(label, value) {
  return [
    React.createElement("div", { key: `k-${label}`, style: { ...s.muted, minWidth: 78 } }, label),
    React.createElement("div", { key: `v-${label}`, style: { ...s.code, minWidth: 90 } }, value)
  ];
}
function tokenUsageTable(usage) {
  if (!usage || typeof usage !== "object") return null;
  const rows = [
    ["\u8BF7\u6C42\u6570", formatNumber(usage.request_count ?? 0)],
    ["\u8BA1\u8D39\u6B21\u6570", formatNumber(usage.usage_count ?? 0)],
    ["Prompt", formatNumber(usage.prompt_tokens ?? 0)],
    ["Completion", formatNumber(usage.completion_tokens ?? 0)],
    ["\u5408\u8BA1", formatNumber(usage.total_tokens ?? 0)]
  ];
  return React.createElement(
    "div",
    { className: "dshc-tblwrap", style: { marginTop: 10 } },
    React.createElement(
      "table",
      null,
      React.createElement(
        "thead",
        null,
        React.createElement("tr", null, ...rows.map(
          (row) => React.createElement("th", { key: row[0] }, row[0])
        ))
      ),
      React.createElement(
        "tbody",
        null,
        React.createElement("tr", null, ...rows.map(
          (row) => React.createElement("td", { key: row[0] }, row[1])
        ))
      )
    ),
    React.createElement(
      "div",
      { style: { ...s.muted, marginTop: 6 } },
      `\u6700\u8FD1\u5EF6\u8FDF ${usage.last_latency_ms ?? "\u2014"} ms \xB7 \u6700\u8FD1\u541E\u5410 ${formatLatency(usage.last_tokens_per_second)} \xB7 \u6700\u8FD1\u6A21\u578B ${usage.last_model ?? "\u2014"}`
    )
  );
}
function modelCostsTable(costs) {
  if (!Array.isArray(costs) || costs.length === 0) return null;
  return React.createElement(
    "div",
    { className: "dshc-tblwrap", style: { marginTop: 10 } },
    React.createElement(
      "table",
      null,
      React.createElement(
        "thead",
        null,
        React.createElement(
          "tr",
          null,
          React.createElement("th", null, "\u6A21\u578B"),
          React.createElement("th", null, "\u6BCF 1k \u79EF\u5206"),
          React.createElement("th", null, "\u6837\u672C\u6570"),
          React.createElement("th", null, "\u6700\u8FD1\u89C2\u6D4B")
        )
      ),
      React.createElement(
        "tbody",
        null,
        ...costs.map(
          (cost) => React.createElement(
            "tr",
            { key: cost.model },
            React.createElement("td", null, cost.model),
            React.createElement("td", null, typeof cost.cost_per_1k === "number" ? cost.cost_per_1k.toFixed(6) : "\u2014"),
            React.createElement("td", null, String(cost.samples ?? "\u2014")),
            React.createElement("td", null, relativeTime(cost.last_seen))
          )
        )
      )
    )
  );
}
function rateLimitedNotice(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return React.createElement(
    "div",
    { style: { ...s.warn, marginTop: 10 } },
    "\u6A21\u578B\u7EA7\u9650\u989D\u4E2D\uFF1A",
    ...list.map(
      (item, index) => React.createElement(
        "div",
        { key: `${item.model}-${index}` },
        `${item.model} \xB7 \u81F3 ${formatAbsolute(item.until)}${item.reason ? ` \xB7 ${item.reason}` : ""}`
      )
    )
  );
}
function AccountsTab({ status, channelOf, maxInFlight, limitOf, onAction, busy, onRefresh, error, creditsByUid, scheduleConfig, onRemove, authAccounts }) {
  const limitFor = (account) => typeof limitOf === "function" ? limitOf(account) : maxInFlight;
  const [filter, setFilter] = React.useState("all");
  const [view, setView] = React.useState("card");
  const [showDistribution, setShowDistribution] = React.useState(false);
  const [detailAccount, setDetailAccount] = React.useState(null);
  const accounts = status?.accounts ?? [];
  const earned = React.useMemo(
    () => earnedCredits(accounts, creditsByUid),
    [accounts, creditsByUid]
  );
  const counts = React.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const account of accounts) {
      const channel = channelOf(account);
      map.set(channel, (map.get(channel) ?? 0) + 1);
    }
    return map;
  }, [accounts, channelOf]);
  const filtered = React.useMemo(
    () => filter === "all" ? accounts : accounts.filter((account) => channelOf(account) === filter),
    [accounts, channelOf, filter]
  );
  return React.createElement(
    "div",
    null,
    error ? React.createElement("div", { style: { ...s.err, marginBottom: 14 } }, error) : null,
    React.createElement(OverviewCard, {
      status,
      channelOf,
      showDistribution,
      onToggleDistribution: () => setShowDistribution((v) => !v),
      earned
    }),
    // 渠道 / 域筛选 + 视图切换 + 账号列表
    React.createElement(
      "div",
      { style: s.card },
      React.createElement(
        "div",
        { className: "dshc-row", style: { justifyContent: "space-between" } },
        React.createElement(
          "div",
          { className: "dshc-row" },
          React.createElement("span", { style: { ...s.muted, marginRight: 4 } }, "\u6E20\u9053"),
          segmentButton("all", "\u5168\u90E8", filter, setFilter, accounts.length),
          ...CHANNEL_ORDER.filter((id) => (counts.get(id) ?? 0) > 0).map(
            (id) => segmentButton(id, channelLabel(id), filter, setFilter, counts.get(id) ?? 0)
          )
        ),
        React.createElement(ViewToggle, { view, setView })
      ),
      // 账号区：卡片式（默认，点开抽屉详情）或列表式
      React.createElement(
        "div",
        { style: s.block },
        filtered.length === 0 ? React.createElement("div", { style: s.muted }, "\u8BE5\u7B5B\u9009\u4E0B\u6CA1\u6709\u8D26\u53F7\u3002") : view === "card" ? React.createElement(
          "div",
          { className: "dshc-acctgrid" },
          ...filtered.map(
            (account) => React.createElement(AccountCard, {
              key: account.uid,
              account,
              maxInFlight: limitFor(account),
              channel: channelOf(account),
              liveCredits: creditsByUid?.[account.uid],
              authAccounts,
              onOpen: () => setDetailAccount(account)
            })
          )
        ) : React.createElement(
          "div",
          { className: "dshc-tblwrap" },
          React.createElement(
            "table",
            null,
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                ...["\u8D26\u53F7", "\u6E20\u9053", "\u72B6\u6001", "\u79EF\u5206", "\u5230\u671F", "\u5728\u9014", "\u6210\u529F/\u5931\u8D25"].map((h) => React.createElement("th", { key: h }, h))
              )
            ),
            React.createElement(
              "tbody",
              null,
              ...filtered.map((account) => {
                const st = accountState(account, limitFor(account));
                const exp = accountExpiry({
                  account,
                  authAccounts,
                  creditsDetail: creditsByUid?.[account.uid]
                });
                return React.createElement(
                  "tr",
                  { key: account.uid },
                  React.createElement("td", null, account.nickname || account.uid.slice(0, 8)),
                  React.createElement("td", null, channelLabel(channelOf(account)) || "\u2014"),
                  React.createElement(
                    "td",
                    null,
                    React.createElement(Tag, { text: st.label, tone: st.tone, title: st.detail || void 0 })
                  ),
                  React.createElement("td", null, formatNumber(account.credits ?? 0)),
                  React.createElement("td", null, exp ? React.createElement(ExpiryChip, { expiry: exp }) : "\u2014"),
                  React.createElement("td", null, `${account.in_flight ?? 0}/${limitFor(account) ?? "\u2014"}`),
                  React.createElement("td", null, `${account.success_count ?? 0}/${account.err_total ?? 0}`)
                );
              })
            )
          )
        )
      )
    ),
    // 账号详情抽屉（点卡片弹出；复用 AccountFold 的完整明细）
    detailAccount ? React.createElement(AccountDrawer, {
      account: detailAccount,
      maxInFlight: limitFor(detailAccount),
      channel: channelOf(detailAccount),
      credits: creditsByUid?.[detailAccount.uid],
      scheduleConfig,
      onAction,
      busy,
      onRemove,
      onClose: () => setDetailAccount(null)
    }) : null
  );
}
function AccountDrawer({ account, maxInFlight, channel, credits, scheduleConfig, onAction, busy, onRemove, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return React.createElement(
    "div",
    null,
    React.createElement("div", { className: "dshc-drawer-mask", onClick: onClose }),
    React.createElement(
      "div",
      { className: "dshc-drawer" },
      React.createElement("button", { type: "button", className: "dshc-drawer-close", onClick: onClose, title: "\u5173\u95ED" }, "\u2715"),
      React.createElement(
        "div",
        { className: "dshc-row", style: { marginBottom: 12 } },
        React.createElement("span", { style: { ...s.label, fontSize: 15 } }, account.nickname || account.uid.slice(0, 8)),
        channelLabel(channel) ? React.createElement(Tag, { text: channelLabel(channel), tone: "info" }) : null,
        account.realm ? React.createElement(Tag, { text: account.realm, tone: "idle" }) : null
      ),
      // 完整明细：直接复用 AccountFold（四组折叠），保持数据面不丢；动作在抽屉里可用。
      // `defaultOpen: true` 让「点开卡片即见明细」—— 默认展开外层壳与健康/质量/积分，
      // 任务组仍折叠（见 AccountFold 的说明）。
      React.createElement(AccountFold, {
        account,
        maxInFlight,
        channel,
        onAction,
        busy: Boolean(busy?.[account.uid]),
        credits,
        scheduleConfig,
        onRemove,
        defaultOpen: true
      })
    )
  );
}
function ViewToggle({ view, setView }) {
  return React.createElement(
    "span",
    { className: "dshc-viewtoggle" },
    React.createElement("button", {
      type: "button",
      className: view === "card" ? "on" : "",
      onClick: () => setView("card"),
      title: "\u5361\u7247\u89C6\u56FE"
    }, React.createElement(Icons.cardView, null), "\u5361\u7247"),
    React.createElement("button", {
      type: "button",
      className: view === "list" ? "on" : "",
      onClick: () => setView("list"),
      title: "\u5217\u8868\u89C6\u56FE"
    }, React.createElement(Icons.listView, null), "\u5217\u8868")
  );
}
function AccountCard({ account, maxInFlight, channel, onOpen, liveCredits, authAccounts }) {
  const state = accountState(account, maxInFlight);
  const expiry = accountExpiry({ account, authAccounts, creditsDetail: liveCredits });
  const credits = account.credits ?? 0;
  const creditsAt = isZeroTime(account.credits_at) ? void 0 : account.credits_at;
  const target = typeof maxInFlight === "number" && maxInFlight > 0 ? maxInFlight : void 0;
  const inFlight = account.in_flight ?? 0;
  const busyPct = target ? Math.min(100, Math.round(inFlight / target * 100)) : 0;
  const hasOutcome = account.success_count !== void 0 || account.err_total !== void 0;
  const lastSuccess = isZeroTime(account.last_success) ? void 0 : account.last_success;
  return React.createElement(
    "button",
    { type: "button", className: "dshc-acctcard", onClick: onOpen, title: "\u70B9\u51FB\u67E5\u770B\u8BE6\u60C5" },
    // 顶行：昵称 + 状态
    React.createElement(
      "div",
      { className: "dshc-acctcard-top" },
      React.createElement(
        "span",
        { className: "dshc-acctcard-name" },
        React.createElement("span", { className: "dshc-dot", style: { background: (tone[state.tone] ?? tone.idle).fg } }),
        React.createElement(
          "span",
          { className: "dshc-acctcard-nametext" },
          account.nickname || account.uid.slice(0, 8)
        )
      ),
      React.createElement(Tag, { text: state.label, tone: state.tone, title: state.detail || void 0 })
    ),
    // 主数值：积分占满宽度，不再被右侧小字挤成半栏
    React.createElement(
      "div",
      { className: "dshc-acctcard-credits" },
      React.createElement("span", { className: "dshc-acctcard-credits-num" }, formatNumber(credits)),
      React.createElement("span", { className: "dshc-acctcard-credits-unit" }, "\u79EF\u5206"),
      creditsAt ? React.createElement(
        "span",
        { className: "dshc-acctcard-updated", title: `\u4F59\u989D\u66F4\u65B0\u4E8E ${formatAbsolute(creditsAt)}` },
        relativeTime(creditsAt)
      ) : null,
      account.credits_expiring > 0 ? React.createElement("span", {
        className: "dshc-acctcard-expiring",
        title: "\u8BE5\u7A97\u53E3\u5185\u5373\u5C06\u8FC7\u671F\u7684\u79EF\u5206\uFF08\u4F18\u5148\u6D88\u8017\uFF09"
      }, `${formatNumber(account.credits_expiring)} \u5C06\u8FC7\u671F`) : null
    ),
    // 在途占用：数值 + 细进度条（有在途时才显示）
    target ? React.createElement(
      "div",
      { className: "dshc-acctcard-bar", title: `\u5355\u53F7\u5728\u9014\u4E0A\u9650 ${target}` },
      React.createElement(
        "span",
        { className: "dshc-acctcard-track" },
        React.createElement("span", {
          className: `dshc-acctcard-fill${inFlight >= target ? " full" : ""}`,
          style: { width: `${busyPct}%` }
        })
      ),
      React.createElement("span", { className: "dshc-acctcard-bartext" }, `\u5728\u9014 ${inFlight}/${target}`)
    ) : null,
    // 底行：渠道 · 域 · 到期 · 成败 —— 从 11px 右下小字改为独立一行，字号可读
    React.createElement(
      "div",
      { className: "dshc-acctcard-foot" },
      React.createElement("span", { className: "dshc-chip" }, channelLabel(channel) || "\u2014"),
      account.realm ? React.createElement("span", { className: "dshc-chip" }, account.realm === "global" ? "\u56FD\u9645\u7248" : "\u56FD\u5185\u7248") : null,
      expiry ? React.createElement(ExpiryChip, { expiry }) : null,
      // 成败比：新网关恒透出（零值也写），旧网关缺字段时退回在途数、不编造。
      hasOutcome ? React.createElement(
        "span",
        { className: "dshc-chip" },
        `${account.success_count} \u6210\u529F / ${account.err_total} \u5931\u8D25`
      ) : React.createElement("span", {
        className: "dshc-chip dshc-chip-dim",
        title: "\u8BE5\u7F51\u5173\u7248\u672C\u672A\u900F\u51FA\u8FD0\u884C\u8BA1\u6570\uFF08success_count / err_total\uFF09\uFF1B\u5347\u7EA7 chanhub \u540E\u53EF\u89C1"
      }, "\u6210\u8D25\u8BA1\u6570\u4E0D\u53EF\u7528"),
      lastSuccess ? React.createElement("span", { className: "dshc-chip dshc-chip-dim" }, `\u6700\u8FD1\u6210\u529F ${relativeTime(lastSuccess)}`) : null
    )
  );
}
function ExpiryChip({ expiry }) {
  const date = new Date(expiry.at);
  const pad = (value) => String(value).padStart(2, "0");
  const dayText = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const prefix = expiry.kind === "credential" ? "\u767B\u5F55\u5230\u671F" : "\u79EF\u5206\u5230\u671F";
  const left = expiry.days;
  const urgent = expiry.expired || left <= 3;
  const title = expiry.kind === "credential" ? `\u767B\u5F55\u6001\u5230\u671F\uFF08\u8FC7\u671F\u540E\u9700\u91CD\u65B0\u767B\u5F55\uFF09\uFF1A${formatAbsolute(new Date(expiry.at).toISOString())}${expiry.expired ? "\uFF08\u5DF2\u8FC7\u671F\uFF09" : `\uFF08\u8FD8\u6709 ${left} \u5929\uFF09`}` : `\u6700\u65E9\u4E00\u6279\u79EF\u5206\u5230\u671F\uFF1A${dayText}${expiry.expired ? "\uFF08\u5DF2\u8FC7\u671F\uFF09" : `\uFF08\u8FD8\u6709 ${left} \u5929\uFF09`} \u2014\u2014 \u767B\u5F55\u6001\u5230\u671F\u65F6\u95F4\u672A\u80FD\u53D6\u5F97\uFF08\u7F51\u5173\u672A\u900F\u51FA login_expires_at \u4E14\u8BFB\u4E0D\u5230\u51ED\u8BC1\u76EE\u5F55\uFF09`;
  return React.createElement("span", {
    className: `dshc-chip${urgent ? " dshc-chip-warn" : " dshc-chip-dim"}`,
    title
  }, `${prefix} ${dayText}${expiry.expired ? " \xB7 \u5DF2\u8FC7\u671F" : left <= 0 ? " \xB7 \u4ECA\u5929" : ` \xB7 ${left} \u5929`}`);
}
function segmentButton(id, label, active, onChange, count) {
  const isActive = active === id;
  return React.createElement(
    "button",
    {
      key: id,
      type: "button",
      onClick: () => onChange(id),
      style: {
        ...s.btnGhost,
        height: 28,
        padding: "0 12px",
        fontSize: 12,
        borderColor: isActive ? "var(--dsw-alias-brand-primary,#4f6ef7)" : "var(--dsw-alias-border-l2,#d1d5db)",
        color: isActive ? "var(--dsw-alias-brand-primary,#4f6ef7)" : "var(--dsw-alias-label-primary,currentColor)",
        fontWeight: isActive ? 600 : 400
      }
    },
    `${label}${count === void 0 ? "" : ` ${count}`}`
  );
}
function TaskTile({ task, state, busy, onRun, scheduleConfig }) {
  const ran = (state?.run_count ?? 0) > 0;
  const failed = Boolean(state?.last_error);
  const dot = busy ? tone.info.fg : failed ? tone.err.fg : ran ? tone.ok.fg : tone.idle.fg;
  const scheduleItem = SCHEDULE_ITEMS.find((item) => item.id === task.name);
  const planned = scheduleItem ? scheduleHoursText(scheduleItem, scheduleConfig) : "";
  const hours = planned === "\u9ED8\u8BA4" ? "" : planned;
  const meta = busy ? "\u8FD0\u884C\u4E2D\u2026" : ran ? `${state?.last_start ? relativeTime(state.last_start) : ""}${typeof state?.duration_sec === "number" ? " \xB7 " + formatDuration(state.duration_sec) : ""}` : hours;
  return React.createElement(
    "button",
    {
      type: "button",
      className: `dshc-tasktile${busy ? " running" : ""}${failed ? " failed" : ""}`,
      disabled: busy,
      onClick: () => onRun(task.name),
      title: [
        `${task.label}\uFF1A\u70B9\u5373\u6267\u884C`,
        ran ? `\u4E0A\u6B21\u6267\u884C ${state?.last_start ? formatAbsolute(state.last_start) : "\u2014"}` : "\u5C1A\u672A\u6267\u884C\u8FC7",
        state?.run_count != null ? `\u7D2F\u8BA1 ${state.run_count} \u6B21` : "",
        hours ? `\u8BA1\u5212 ${hours}` : "",
        failed ? `\u4E0A\u6B21\u9519\u8BEF\uFF1A${state.last_error}` : ""
      ].filter(Boolean).join("\n")
    },
    React.createElement("span", { className: "dshc-tasktile-ico" }, task.icon),
    React.createElement("span", { className: "dshc-tasktile-name" }, task.label),
    React.createElement(
      "span",
      { className: "dshc-tasktile-meta" },
      React.createElement("span", { className: "dshc-dot", style: { background: dot } }),
      meta || "\u672A\u6267\u884C"
    )
  );
}
function TasksTab({ status, channelOf, maxInFlight, taskData, growthData, schoolData, growthUid, setGrowthUid, schoolUid, setSchoolUid, onRunTask, runningName, onRefresh, scheduleConfig, onGrowthWrite, growthWriteBusy, adminAvailable, scanData, scanning, queueData, onScan, onQueueStart, vouchersData, vouchersLoading, onViewVouchers }) {
  const accounts = status?.accounts ?? [];
  const accountsMap = React.useMemo(
    () => new Map(accounts.map((account) => [account.uid, account])),
    [accounts]
  );
  const wbAccounts = accounts.filter((account) => (channelOf?.(account) ?? "workbuddy") === "workbuddy");
  const taskList = Array.isArray(taskData?.tasks?.tasks) ? taskData.tasks.tasks : [];
  const byName = new Map(taskList.map((task) => [task.task, task]));
  const doneCount = (queueData?.items ?? []).filter((it) => it.status === "done" || it.status === "error").length;
  const pct = queueData?.total > 0 ? Math.round(doneCount / queueData.total * 100) : 100;
  if (taskData && taskData.available === false) {
    return React.createElement(Unavailable, {
      title: "\u4EFB\u52A1\u8FD0\u884C\u72B6\u6001\u4E0E\u624B\u52A8\u89E6\u53D1",
      needs: "GET /admin/tasks/status + POST /admin/tasks/{name}",
      hint: `${taskData.reason} \u8FD9\u4E9B\u7AEF\u70B9\u5DF2\u5728 chanhub \u4E2D\u5B9E\u73B0\uFF0C\u4F46\u9700\u8981\u7F51\u5173\u5F00\u542F\u7BA1\u7406\u9762\u3002`
    });
  }
  return React.createElement(
    "div",
    null,
    // 任务磁贴：一行七个，点即触发，状态就地显示。
    // 原先「操作台按钮」与「执行历史表」把同一批任务各列一遍（7 按钮 + 7 行 × 6 列），
    // 状态还得跨区块对照 —— 磁贴把触发与状态收进同一格，整张表随之删除。
    React.createElement(
      "div",
      { style: s.card },
      React.createElement(
        "div",
        { className: "dshc-taskgrid" },
        ...TASK_DEFS.map(
          (task) => React.createElement(TaskTile, {
            key: task.name,
            task,
            state: byName.get(task.name),
            busy: runningName === task.name || byName.get(task.name)?.running === true,
            onRun: onRunTask,
            scheduleConfig
          })
        )
      ),
      adminAvailable ? React.createElement(
        "div",
        { className: "dshc-row", style: { marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--dsw-alias-border-l2,#e5e7eb)" } },
        React.createElement("button", {
          type: "button",
          style: { ...s.btnGhost, height: 28 },
          disabled: scanning,
          onClick: onScan,
          title: "\u53EA\u8BFB\u626B\u63CF\uFF1A\u5217\u51FA\u6BCF\u4E2A\u8D26\u53F7\u672A\u5B8C\u6210\u4E14\u53EF\u81EA\u52A8\u5316\u7684\u4EFB\u52A1"
        }, scanning ? "\u626B\u63CF\u4E2D\u2026" : "\u626B\u63CF\u5F85\u529E"),
        React.createElement("button", {
          type: "button",
          style: { ...s.btnGhost, height: 28 },
          onClick: onQueueStart,
          title: "\u628A\u626B\u63CF\u51FA\u7684\u5F85\u529E\u6392\u961F\u6267\u884C\uFF08\u8D26\u53F7\u5185\u4E32\u884C\u3001\u8D26\u53F7\u95F4\u5E76\u53D1\uFF09"
        }, "\u6267\u884C\u961F\u5217"),
        queueData ? React.createElement(
          "span",
          { className: "dshc-row", style: { gap: 8, flexGrow: 1, minWidth: 140 } },
          React.createElement(
            "span",
            { className: "dshc-progress" },
            React.createElement("span", { style: { width: `${pct}%` } })
          ),
          React.createElement(
            "span",
            { style: { ...s.muted, whiteSpace: "nowrap" } },
            `${doneCount}/${queueData.total}${queueData.running ? "" : " \u5DF2\u7ED3\u675F"}`
          )
        ) : null
      ) : null
    ),
    // 签到逐账号结果：摘要常驻（一眼可见），明细折起（默认不占版面）。
    // 余额列取实时值（status.accounts[].credits —— 与账号池 Tab 同源，刷新时
    // 网关已把余额写回池）：outcomes.credits 是任务执行那一刻的回读快照，
    // 之后余额变化它不会自己变，两处会对不上（真机踩过：账号池 800 / 签到卡 650）。
    React.createElement(CheckinOutcomesCard, {
      task: byName.get("checkin"),
      liveByUid: accountsMap
    }),
    // 待办扫描 / 队列明细：只在有数据时出现，且折起。
    scanData?.accounts?.length > 0 ? React.createElement(
      "div",
      { style: s.card },
      React.createElement(
        "div",
        { className: "dshc-taskgrid-head" },
        React.createElement("span", { style: s.label }, "\u5F85\u529E\u626B\u63CF\u7ED3\u679C"),
        React.createElement("span", { style: s.muted }, `${scanData.accounts.length} \u4E2A\u8D26\u53F7`)
      ),
      ...scanData.accounts.map(
        (it) => React.createElement(
          "div",
          { key: it.uid, className: "dshc-row", style: { marginTop: 6 } },
          React.createElement("span", { style: { ...s.label, minWidth: 0 } }, it.nickname || it.uid.slice(0, 8)),
          it.growth?.length > 0 ? React.createElement(Tag, { text: `\u6210\u957F\u5F85\u529E ${it.growth.length}`, tone: "warn", title: it.growth.join(" \xB7 ") }) : React.createElement(Tag, { text: "\u6210\u957F\u65E0\u5F85\u529E", tone: "ok" }),
          it.chances > 0 ? React.createElement(Tag, { text: `\u62BD\u5956 ${it.chances}`, tone: "info" }) : null,
          it.growthErr ? React.createElement(Tag, { text: "\u6210\u957F\u67E5\u8BE2\u5931\u8D25", tone: "err", title: it.growthErr }) : null,
          it.schoolErr ? React.createElement(Tag, { text: "\u5F00\u5B66\u5B63\u67E5\u8BE2\u5931\u8D25", tone: "err", title: it.schoolErr }) : null
        )
      )
    ) : null,
    queueData?.items?.length > 0 ? React.createElement(
      "div",
      { style: s.card },
      React.createElement(
        "div",
        { className: "dshc-taskgrid-head" },
        React.createElement("span", { style: s.label }, "\u6267\u884C\u961F\u5217\u660E\u7EC6"),
        React.createElement("span", { style: s.muted }, `${doneCount}/${queueData.total}`)
      ),
      React.createElement(
        "div",
        { className: "dshc-tblwrap", style: { marginTop: 8 } },
        React.createElement(
          "table",
          null,
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              null,
              ...["\u8D26\u53F7", "\u4EFB\u52A1", "\u72B6\u6001", "\u8BF4\u660E"].map((h2) => React.createElement("th", { key: h2 }, h2))
            )
          ),
          React.createElement(
            "tbody",
            null,
            ...queueData.items.map(
              (it, i) => React.createElement(
                "tr",
                { key: `${it.uid}-${it.kind}-${it.code}-${i}` },
                React.createElement("td", null, it.nickname || it.uid.slice(0, 8)),
                React.createElement("td", { style: { ...s.code }, title: it.kind === "school" ? "\u5F00\u5B66\u5B63" : "\u6210\u957F" }, it.code),
                React.createElement(
                  "td",
                  null,
                  React.createElement(Tag, {
                    text: { pending: "\u5F85\u6267\u884C", running: "\u6267\u884C\u4E2D", done: "\u5B8C\u6210", skipped: "\u8DF3\u8FC7", error: "\u5931\u8D25" }[it.status] ?? it.status,
                    tone: { done: "ok", error: "err", running: "info", skipped: "idle", pending: "idle" }[it.status] ?? "idle"
                  })
                ),
                React.createElement("td", { style: { ...s.muted, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: it.message || "" }, it.message || "\u2014")
              )
            )
          )
        )
      )
    ) : null,
    // 开学季（真实子任务状态：来自网关 GET /v1/accounts/{uid}/school-tasks）
    // 账号列表按渠道过滤：成长任务/开学季是 workbuddy 专属（Trae/Qoder 无此体系，
    // 网关侧恒 501 unsupported）。不过滤的话 trae/qoder 账号会在选号器里显示成
    // 永远「加载失败」的灰点，且可被点开 —— 纯噪音。
    // 全是 workbuddy 账号时传全量（保持原行为，AccountPicker 单账号自动隐藏）。
    React.createElement(SchoolTasksCard, {
      schoolData: schoolData?.[schoolUid],
      accounts: wbAccounts ?? accounts,
      byUid: schoolData,
      selectedUid: schoolUid,
      onSelectUid: setSchoolUid,
      running: runningName === "school",
      onRunTask,
      vouchersData,
      vouchersLoading,
      onViewVouchers,
      adminAvailable
    }),
    // 成长任务进度（真实数据：来自网关 GET /v1/accounts/{uid}/growth-tasks）
    React.createElement(GrowthTasksCard, {
      growthData: growthData?.[growthUid],
      accounts: wbAccounts ?? accounts,
      byUid: growthData,
      selectedUid: growthUid,
      onSelectUid: setGrowthUid,
      onRefresh,
      onGrowthWrite,
      writeBusy: growthWriteBusy,
      adminAvailable
    })
  );
}
function defaultAccountUid(byUid, accounts) {
  for (const account of accounts ?? []) {
    if (byUid?.[account.uid]?.available === true) return account.uid;
  }
  for (const account of accounts ?? []) {
    if (byUid?.[account.uid]) return account.uid;
  }
  return void 0;
}
function AccountPicker({ accounts, byUid, value, onChange, label = "\u8D26\u53F7" }) {
  const list = accounts ?? [];
  if (list.length <= 1) return null;
  return React.createElement(
    "div",
    { className: "dshc-acctpick" },
    React.createElement("span", { className: "dshc-acctpick-label" }, label),
    ...list.map((account) => {
      const entry = byUid?.[account.uid];
      const dot = !entry ? tone.idle.fg : entry.available === true ? tone.ok.fg : tone.err.fg;
      const name2 = account.nickname || account.uid.slice(0, 8);
      const active = account.uid === value;
      return React.createElement(
        "button",
        {
          key: account.uid,
          type: "button",
          className: `dshc-acctpick-btn${active ? " on" : ""}`,
          onClick: () => onChange(account.uid),
          title: entry?.available === false ? `${name2}\uFF1A${entry.reason ?? "\u8BE5\u8D26\u53F7\u6570\u636E\u4E0D\u53EF\u7528"}` : name2
        },
        React.createElement("span", { className: "dshc-dot", style: { background: dot } }),
        name2
      );
    })
  );
}
function useSelectedUid(selected, byUid, accounts) {
  const fallback = defaultAccountUid(byUid, accounts);
  if (selected && byUid?.[selected]) return selected;
  return fallback;
}
var SCHOOL_STATUS = {
  claimed: { text: "\u5DF2\u9886\u53D6", tone: "ok" },
  completed: { text: "\u5DF2\u5B8C\u6210", tone: "ok" },
  pending: { text: "\u5F85\u5B8C\u6210", tone: "warn" }
};
function SchoolTasksCard({ schoolData, accounts, byUid, selectedUid, onSelectUid, running, onRunTask, vouchersData, vouchersLoading, onViewVouchers, adminAvailable }) {
  if (schoolData && schoolData.available === false) {
    return React.createElement(Unavailable, {
      title: "\u5F00\u5B66\u5B63\u5B50\u4EFB\u52A1\u72B6\u6001",
      needs: "GET /v1/accounts/{uid}/school-tasks",
      hint: schoolData.reason
    });
  }
  if (!schoolData || schoolData.available !== true) {
    return React.createElement(
      "div",
      { style: s.card },
      React.createElement(CardHead, { title: "\u5F00\u5B66\u5B63" }),
      React.createElement("div", { style: { ...s.muted, marginTop: 8 } }, "\u52A0\u8F7D\u4E2D\u2026")
    );
  }
  const data = schoolData.school;
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const counts = data.counts ?? {};
  const claimed = counts.claimed ?? 0;
  const total = counts.total ?? tasks.length;
  const stale = data.in_period === false;
  return React.createElement(
    "div",
    { style: s.card },
    React.createElement(CardHead, {
      title: "\u{1F393} \u5F00\u5B66\u5B63",
      actions: [
        React.createElement("button", {
          key: "run",
          type: "button",
          className: `dshc-taskbtn${running ? " running" : ""}`,
          style: { ...s.btnGhost, height: 26, padding: "0 10px", fontSize: 12 },
          disabled: running,
          onClick: () => onRunTask("school")
        }, running ? "\u6267\u884C\u4E2D\u2026" : "\u6267\u884C"),
        adminAvailable ? React.createElement("button", {
          key: "vouchers",
          type: "button",
          style: { ...s.btnLink, fontSize: 12 },
          disabled: vouchersLoading,
          onClick: onViewVouchers,
          title: "\u67E5\u8BE2\u5404\u8D26\u53F7\u62BD\u4E2D\u7684\u7B2C\u4E09\u65B9\u5238\u7801\uFF08KFC/\u745E\u5E78/\u9177\u72D7\u7B49\uFF0C\u53EA\u8BFB\uFF09"
        }, vouchersLoading ? "\u67E5\u8BE2\u4E2D\u2026" : "\u5238\u7801") : null
      ]
    }),
    // 账号选择器：逐账号数据必须能切换（此前固定显示第 1 个账号）
    React.createElement(AccountPicker, {
      accounts,
      byUid,
      value: selectedUid,
      onChange: onSelectUid
    }),
    // 进度条 + 计数（比 "已领 4/5" 标签更直观，且一眼看出还剩多少）
    React.createElement(
      "div",
      { className: "dshc-row", style: { marginTop: 12 } },
      React.createElement(
        "span",
        { className: "dshc-progress" },
        React.createElement("span", {
          style: {
            width: `${total > 0 ? Math.round(claimed / total * 100) : 0}%`,
            background: claimed >= total ? tone.ok.fg : "var(--dsw-alias-button-info-fill,#4176e6)"
          }
        })
      ),
      React.createElement("span", { style: { ...s.muted, whiteSpace: "nowrap" } }, `${claimed}/${total}`)
    ),
    stale ? React.createElement(
      "div",
      { style: { ...s.warn, marginTop: 10 } },
      "\u6D3B\u52A8\u672A\u5F00\u59CB\u6216\u5DF2\u7ED3\u675F \u2014\u2014 \u4EE5\u4E0B\u4E3A\u8FC7\u671F\u5FEB\u7167\uFF0C\u4E0D\u4EE3\u8868\u5F53\u524D\u53EF\u64CD\u4F5C\u3002"
    ) : null,
    tasks.length === 0 ? React.createElement("div", { style: { ...s.muted, marginTop: 10 } }, "\u7F51\u5173\u672A\u8FD4\u56DE\u5B50\u4EFB\u52A1\u3002") : React.createElement(
      "div",
      { className: "dshc-sub", style: { marginTop: 12 } },
      ...tasks.map((task) => {
        const status = SCHOOL_STATUS[task.status] ?? { text: task.status ?? "\u2014", tone: "idle" };
        const done = ["claimed", "completed"].includes(task.status);
        const recurring = task.task_type === "recurring";
        const manual = task.task_code === "task_student_verify";
        return React.createElement(
          "div",
          { key: task.task_code, className: "dshc-srow" },
          React.createElement("span", {
            className: done ? "dshc-ck on" : manual ? "dshc-ck na" : "dshc-ck",
            title: done ? "\u5DF2\u9886\u53D6" : manual ? "\u4EBA\u5DE5\u9879\uFF08\u7F51\u5173\u4E0D\u53EF\u4EE3\u505A\uFF09" : status.text
          }, done ? "\u2713" : manual ? "\u2014" : "\u25CB"),
          React.createElement(
            "span",
            { className: "dshc-stitle", title: task.task_code },
            task.title || task.task_code
          ),
          // 进度：claimed 但未满时（上游实测存在，如 desktop_chat_1_time 为
          // claimed + 0/1）不隐藏也不改写 —— 如实显示，但加注说明这是上游口径，
          // 避免与左侧「已领取」勾看起来自相矛盾。
          React.createElement("span", {
            className: `dshc-sprog${done && task.has_progress && task.current < task.target ? " odd" : ""}`,
            ...done && task.has_progress && task.current < task.target ? { title: `\u4E0A\u6E38\u53E3\u5F84\uFF1A\u8BE5\u4EFB\u52A1\u5DF2\u9886\u53D6\uFF0C\u4F46\u8FDB\u5EA6\u8BA1\u6570\u4E3A ${task.current}/${task.target}` } : {}
          }, task.has_progress ? `${task.current}/${task.target}` : "\u2014"),
          React.createElement(
            "span",
            { className: "dshc-ssrc" },
            recurring ? React.createElement(Tag, { text: "\u6BCF\u65E5", tone: "info" }) : null,
            manual ? React.createElement(Tag, { text: "\u4EBA\u5DE5", tone: "idle" }) : null
          ),
          React.createElement(Tag, { text: status.text, tone: status.tone })
        );
      })
    ),
    // 券码（按需加载）：只读表格，折进结果区
    vouchersData ? React.createElement(
      "details",
      { className: "dshc-fold", style: { marginTop: 10 }, open: true },
      React.createElement("summary", null, React.createElement("span", { style: s.label }, "\u5238\u7801")),
      React.createElement(
        "div",
        { className: "dshc-body" },
        React.createElement(
          "div",
          { className: "dshc-tblwrap" },
          React.createElement(
            "table",
            null,
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                ...["\u8D26\u53F7", "\u5956\u54C1", "\u5238\u7801", "\u6709\u6548\u671F"].map((h2) => React.createElement("th", { key: h2 }, h2))
              )
            ),
            React.createElement(
              "tbody",
              null,
              ...(function() {
                const rows = [];
                for (const r of vouchersData.rows ?? []) {
                  if ((r.vouchers ?? []).length === 0) continue;
                  for (const v of r.vouchers) {
                    rows.push(React.createElement(
                      "tr",
                      { key: `${r.uid}-${v.grant_id}` },
                      React.createElement("td", null, r.nickname || r.uid.slice(0, 8)),
                      React.createElement("td", null, v.prize_name || v.sku_code || "\u2014"),
                      React.createElement("td", { style: { ...s.code, userSelect: "all" } }, v.code || "\u2014"),
                      React.createElement("td", null, v.valid_to || "\u2014")
                    ));
                  }
                }
                if (rows.length === 0) {
                  rows.push(React.createElement(
                    "tr",
                    { key: "empty" },
                    React.createElement("td", { colSpan: 4, style: { ...s.muted, textAlign: "center" } }, "\u6682\u65E0\u5238\u7801\u3002")
                  ));
                }
                return rows;
              })()
            )
          )
        )
      )
    ) : null
  );
}
function GrowthTasksCard({ growthData, accounts, byUid, selectedUid, onSelectUid, onRefresh, onGrowthWrite, writeBusy, adminAvailable }) {
  if (growthData && growthData.available === false) {
    return React.createElement(Unavailable, {
      title: "\u6210\u957F\u4EFB\u52A1\u8FDB\u5EA6\uFF08\u9010\u7801\uFF09",
      needs: "GET /v1/accounts/{uid}/growth-tasks",
      hint: growthData.reason
    });
  }
  if (!growthData || growthData.available !== true) {
    return React.createElement(
      "div",
      { style: s.card },
      React.createElement(CardHead, { title: "\u6210\u957F\u4EFB\u52A1" }),
      React.createElement("div", { style: { ...s.muted, marginTop: 8 } }, "\u52A0\u8F7D\u4E2D\u2026")
    );
  }
  const data = growthData.growth;
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  if (tasks.length === 0) {
    return React.createElement(
      "div",
      { style: s.card },
      React.createElement(CardHead, { title: "\u6210\u957F\u4EFB\u52A1" }),
      React.createElement("div", { style: { ...s.muted, marginTop: 8 } }, "\u8D26\u53F7\u53EF\u80FD\u65E0\u6210\u957F\u4EFB\u52A1\u8D44\u683C\u3002")
    );
  }
  const actionable = tasks.filter((t) => t.has_progress && !["completed", "claimed"].includes(t.accept_status) && t.current < (t.target || 1));
  const claimable = tasks.filter((t) => ["completed", "claimed"].includes(t.accept_status) || t.has_progress && t.target > 0 && t.current >= t.target && t.accept_status !== "claimed");
  const pending = tasks.filter((t) => !t.has_progress);
  const claimableUnclaimed = claimable.filter((t) => t.accept_status !== "claimed");
  const statusTone = { claimed: "ok", completed: "ok", accepted: "info", in_progress: "info", not_accepted: "idle" };
  const statusLabel = {
    claimed: "\u5DF2\u9886\u53D6",
    completed: "\u5DF2\u5B8C\u6210",
    accepted: "\u8FDB\u884C\u4E2D",
    in_progress: "\u8FDB\u884C\u4E2D",
    not_accepted: "\u672A\u63A5\u53D7"
  };
  const renderRow = (t) => {
    const progress = t.has_progress ? `${t.current}/${t.target}` : null;
    const full = t.has_progress && t.target > 0 && t.current >= t.target;
    const claimed = t.accept_status === "claimed";
    const completed = t.accept_status === "completed";
    const busyThis = writeBusy === `${t.task_code}`;
    const showAccept = adminAvailable && !claimed && !completed && !t.locked && !full;
    const showClaim = adminAvailable && (completed || full) && !claimed;
    const badges = [];
    if (t.from_mp) badges.push({ text: "\u5C0F\u7A0B\u5E8F", tone: "info" });
    if (t.scheduled) badges.push({ text: `\u5B9A\u65F6 ${t.scheduled}`, tone: "info" });
    if (t.locked) {
      badges.push({
        text: "\u672A\u89E3\u9501",
        tone: "warn",
        title: "\u4E0A\u6E38\u5BF9\u8BE5\u4EFB\u52A1\u6807\u8BB0\u4E3A\u672A\u5F00\u653E\uFF08locked\uFF09\uFF1A\u5F53\u524D\u4E0D\u53EF\u505A\uFF0C\u9762\u677F\u4E5F\u4E0D\u4F1A\u4EE3\u505A\u3002\u8FD9\u901A\u5E38\u662F\u4E0A\u6E38\u7684\u7070\u5EA6/\u8D44\u683C\u63A7\u5236\uFF0C\u4E0E\u8D26\u53F7\u72B6\u6001\u65E0\u5173\u3002"
      });
    }
    return React.createElement(
      "div",
      { key: t.task_code, className: "dshc-growrow" },
      React.createElement("span", {
        className: "dshc-codebar",
        style: { background: full || claimed || completed ? tone.ok.fg : t.has_progress ? tone.warn.fg : "transparent" }
      }),
      React.createElement("span", { className: "dshc-stitle", title: t.task_code }, t.title || t.task_code),
      React.createElement("span", { className: "dshc-sprog" }, progress ?? "\u2014"),
      React.createElement(
        "span",
        { className: "dshc-ssrc" },
        ...badges.map((b) => React.createElement(Tag, { key: b.text, text: b.text, tone: b.tone, title: b.title }))
      ),
      React.createElement(Tag, { text: statusLabel[t.accept_status] ?? t.accept_status ?? "\u2014", tone: statusTone[t.accept_status] ?? "idle" }),
      React.createElement(
        "span",
        { className: "dshc-sact" },
        showAccept ? React.createElement("button", {
          type: "button",
          style: { ...s.btnLink, fontSize: 12 },
          disabled: busyThis,
          onClick: () => onGrowthWrite("accept", t.task_code),
          title: "\u5BF9\u4E0A\u6E38 accept \u8BE5\u7801\uFF08\u5F00\u59CB\u505A\uFF1B\u5BF9\u8BDD\u7C7B\u7801\u4F1A\u771F\u5B9E\u53D1\u8D77\u5BF9\u8BDD\uFF09"
        }, busyThis ? "\u2026" : "\u70B9\u4EAE") : null,
        showClaim ? React.createElement("button", {
          type: "button",
          style: { ...s.btnLink, fontSize: 12 },
          disabled: busyThis,
          onClick: () => onGrowthWrite("claim", t.task_code),
          title: "\u9886\u53D6\u8BE5\u7801\u5956\u52B1\uFF08\u5E42\u7B49\uFF1A\u91CD\u590D\u9886\u53D6\u8FD4\u56DE\u5DF2\u9886\u6001\uFF0C\u4E0D\u7B97\u5931\u8D25\uFF09"
        }, busyThis ? "\u2026" : "\u9886\u53D6") : null
      )
    );
  };
  const doneCount = claimable.length;
  const coverage = codeCoverage();
  return React.createElement(
    "div",
    { style: s.card },
    React.createElement(CardHead, {
      title: "\u6210\u957F\u4EFB\u52A1",
      actions: [
        adminAvailable ? React.createElement("button", {
          key: "claim-all",
          type: "button",
          style: { ...s.btnGhost, height: 26, padding: "0 10px", fontSize: 12 },
          disabled: writeBusy === "claim-claimable" || claimableUnclaimed.length === 0,
          onClick: () => onGrowthWrite("claim-claimable"),
          title: "\u9886\u53D6\u5F53\u524D\u5168\u90E8\u5DF2\u5B8C\u6210\u672A\u9886\u7684\u5956\u52B1\uFF08\u5E42\u7B49\uFF09"
        }, writeBusy === "claim-claimable" ? "\u9886\u53D6\u4E2D\u2026" : "\u5168\u90E8\u9886\u53D6") : null,
        React.createElement("button", {
          key: "refresh",
          type: "button",
          style: { ...s.btnLink, fontSize: 12 },
          onClick: onRefresh
        }, "\u5237\u65B0")
      ]
    }),
    // 账号选择器：逐账号数据必须能切换（此前固定显示第 1 个账号）
    React.createElement(AccountPicker, {
      accounts,
      byUid,
      value: selectedUid,
      onChange: onSelectUid
    }),
    React.createElement(
      "div",
      { className: "dshc-row", style: { marginTop: 12 } },
      React.createElement(
        "span",
        { className: "dshc-progress" },
        React.createElement("span", {
          style: {
            width: `${tasks.length > 0 ? Math.round(doneCount / tasks.length * 100) : 0}%`,
            background: doneCount >= tasks.length ? tone.ok.fg : "var(--dsw-alias-button-info-fill,#4176e6)"
          }
        })
      ),
      React.createElement("span", { style: { ...s.muted, whiteSpace: "nowrap" } }, `${doneCount}/${tasks.length}`),
      actionable.length > 0 ? React.createElement(Tag, {
        text: `\u5F85\u505A ${actionable.length}`,
        tone: "warn",
        title: "\u6709\u8FDB\u5EA6\u672A\u6EE1\u3001\u53EF\u7EE7\u7EED\u63A8\u52A8\u7684\u7801"
      }) : null,
      // 事实②（定时覆盖只有 2/24）压成一个 chip：它的内容是「别的码没有定时入口」，
      // 逐行看不到（缺席不可见），故必须有一处汇总 —— 但一句话即可，不写整段散文。
      React.createElement(Tag, {
        text: `\u5B9A\u65F6\u8986\u76D6 ${coverage.scheduled}/${coverage.total}`,
        tone: "idle",
        title: `\u53EA\u6709 ${coverage.scheduled} \u4E2A\u7801\u6709\u5B9A\u65F6\u6392\u7A0B\uFF08chat_5 \u8D70\u6D3B\u8DC3\u5730\u56FE\u3001black_cat \u8D70\u591C\u732B\u5B50\uFF09\uFF1B\u5176\u4F59 ${coverage.unscheduled} \u4E2A\u6CA1\u6709\u4EFB\u4F55\u5B9A\u65F6\u5165\u53E3\uFF0C\u53EA\u80FD\u624B\u52A8\u70B9\u300C\u70B9\u4EAE\u300D\u3002`
      })
    ),
    // 只有一类常驻展开：需要动手的。其余折叠。
    actionable.length > 0 ? React.createElement(
      "div",
      { className: "dshc-rows", style: { marginTop: 12 } },
      ...actionable.map(renderRow)
    ) : React.createElement("div", { style: { ...s.muted, marginTop: 12 } }, "\u6CA1\u6709\u5F85\u505A\u7684\u7801\u3002"),
    claimable.length > 0 ? React.createElement(
      "details",
      { className: "dshc-fold", style: { marginTop: 8 } },
      React.createElement(
        "summary",
        null,
        React.createElement("span", { style: s.label }, "\u5DF2\u5B8C\u6210 / \u5DF2\u9886\u53D6"),
        React.createElement("span", { style: { ...s.muted, marginLeft: "auto" } }, `${claimable.length} \u4E2A`)
      ),
      React.createElement("div", { className: "dshc-body" }, ...claimable.map(renderRow))
    ) : null,
    pending.length > 0 ? React.createElement(
      "details",
      { className: "dshc-fold" },
      React.createElement(
        "summary",
        null,
        React.createElement("span", { style: s.label }, "\u65E0\u8FDB\u5EA6\u6570\u636E"),
        React.createElement("span", { style: { ...s.muted, marginLeft: "auto" } }, `${pending.length} \u4E2A`)
      ),
      React.createElement(
        "div",
        { className: "dshc-body" },
        ...pending.map(renderRow),
        React.createElement(
          "div",
          { style: { ...s.muted, marginTop: 6 } },
          "\u4E0A\u6E38\u4E0D\u4E0B\u53D1\u8FDB\u5EA6\u5BF9\u8C61\uFF0C\u901A\u5E38\u662F\u4E0D\u53EF\u4EE3\u505A\u7684\u771F\u5B9E\u884C\u4E3A\uFF08\u5982\u516C\u76CA\u6350\u6B3E\uFF09\u3002"
        )
      )
    ) : null
  );
}
function CheckinOutcomesCard({ task, liveByUid }) {
  const outcomes = task?.outcomes;
  if (!Array.isArray(outcomes) || outcomes.length === 0) return null;
  const summary = task.outcome_summary ?? {};
  const balanceOf = (oc) => {
    const live = liveByUid?.get?.(oc.uid);
    if (typeof live?.credits === "number") return live.credits;
    return typeof oc.credits === "number" ? oc.credits : null;
  };
  const attention = outcomes.filter((oc) => oc.status === "fail" || oc.status === "skipped");
  return React.createElement(
    "div",
    { style: s.card },
    React.createElement(CardHead, {
      title: "\u7B7E\u5230",
      extra: task.last_end ? `${relativeTime(task.last_end)}${typeof task.duration_sec === "number" ? " \xB7 " + formatDuration(task.duration_sec) : ""}` : void 0
    }),
    React.createElement(
      "div",
      { className: "dshc-row", style: { marginTop: 10 } },
      React.createElement(Tag, { text: `\u6210\u529F ${summary.ok ?? 0}`, tone: "ok" }),
      React.createElement(Tag, { text: `\u5DF2\u7B7E\u8FC7 ${summary.already ?? 0}`, tone: "info" }),
      (summary.fail ?? 0) > 0 ? React.createElement(Tag, { text: `\u5931\u8D25 ${summary.fail}`, tone: "err" }) : null,
      (summary.skipped ?? 0) > 0 ? React.createElement(Tag, { text: `\u8DF3\u8FC7 ${summary.skipped}`, tone: "idle" }) : null,
      React.createElement("span", { style: { ...s.muted, marginLeft: "auto" } }, `\u5171 ${summary.total ?? outcomes.length} \u4E2A`)
    ),
    ...attention.map(
      (oc) => React.createElement(
        "div",
        { key: oc.uid, className: "dshc-row", style: { marginTop: 6 } },
        React.createElement("span", { className: "dshc-dot", style: { background: oc.status === "fail" ? tone.err.fg : tone.idle.fg } }),
        React.createElement("span", { style: { ...s.label, minWidth: 0 } }, oc.nickname || oc.uid.slice(0, 8)),
        React.createElement("span", {
          style: { ...s.muted, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
          title: oc.detail || ""
        }, oc.detail || TASK_STATUS_LABEL[oc.status] || oc.status)
      )
    ),
    React.createElement(
      "details",
      { className: "dshc-fold", style: { marginTop: 10 } },
      React.createElement(
        "summary",
        null,
        React.createElement("span", { style: s.label }, "\u9010\u8D26\u53F7\u660E\u7EC6"),
        React.createElement("span", { style: { ...s.muted, marginLeft: "auto" } }, `${outcomes.length} \u4E2A\u8D26\u53F7`)
      ),
      React.createElement(
        "div",
        { className: "dshc-body" },
        React.createElement(
          "div",
          { className: "dshc-tblwrap" },
          React.createElement(
            "table",
            null,
            React.createElement(
              "thead",
              null,
              React.createElement(
                "tr",
                null,
                ...["\u8D26\u53F7", "\u7ED3\u679C", "\u4F59\u989D", "\u8BF4\u660E"].map((h) => React.createElement("th", { key: h }, h))
              )
            ),
            React.createElement(
              "tbody",
              null,
              ...outcomes.map(
                (oc) => React.createElement(
                  "tr",
                  { key: oc.uid },
                  React.createElement("td", null, oc.nickname || oc.uid.slice(0, 8)),
                  React.createElement(
                    "td",
                    null,
                    React.createElement(Tag, {
                      text: TASK_STATUS_LABEL[oc.status] ?? oc.status,
                      tone: TASK_STATUS_TONE[oc.status] ?? "idle"
                    })
                  ),
                  React.createElement("td", null, typeof balanceOf(oc) === "number" ? formatNumber(balanceOf(oc)) : "\u2014"),
                  React.createElement("td", { style: { ...s.muted } }, oc.detail || "\u2014")
                )
              )
            )
          )
        )
      )
    )
  );
}
function LogsTab({ logs, logChannel, onChannelChange, onRefresh, onClear }) {
  if (logs && logs.available === false) {
    return React.createElement(
      "div",
      null,
      React.createElement(Unavailable, {
        title: "\u8FD0\u884C\u65E5\u5FD7",
        needs: "GET /v1/logs\uFF08\u9700\u7F51\u5173 config logs.enabled=true\uFF09",
        hint: `${logs.reason} \u65E5\u5FD7\u542B uid \u4E0E\u6635\u79F0\uFF0C\u6545\u7F51\u5173\u9ED8\u8BA4\u4E0D\u5F00\u542F\u3002`
      }),
      React.createElement(ReactLogSection, null)
    );
  }
  const data = logs?.logs;
  const entries = data?.entries ?? [];
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: s.card },
      React.createElement(
        "div",
        { className: "dshc-row", style: { justifyContent: "space-between" } },
        React.createElement("div", { style: { ...s.label } }, "\u8FD0\u884C\u65E5\u5FD7"),
        React.createElement(
          "div",
          { className: "dshc-row" },
          React.createElement(
            "span",
            { style: s.muted },
            data ? `${data.count} / ${data.capacity} \u884C` : ""
          ),
          React.createElement(
            "button",
            { type: "button", style: s.btnLink, onClick: onRefresh },
            React.createElement(Icons.refresh, null),
            "\u5237\u65B0"
          ),
          React.createElement("button", { type: "button", style: s.btnLink, onClick: onClear }, "\u6E05\u7A7A\u7F13\u51B2")
        )
      ),
      // 频道 chip
      React.createElement(
        "div",
        { className: "dshc-row", style: { marginTop: 10, marginBottom: 10 } },
        ...[
          { value: "all", label: "\u5168\u90E8" },
          { value: "chat", label: "\u5BF9\u8BDD" },
          { value: "task", label: "\u4EFB\u52A1" },
          { value: "sys", label: "\u7CFB\u7EDF" }
        ].map(
          (option) => React.createElement(
            "button",
            {
              key: option.value,
              type: "button",
              onClick: () => onChannelChange(option.value),
              style: {
                ...s.btnGhost,
                height: 26,
                padding: "0 12px",
                fontSize: 12,
                borderColor: logChannel === option.value ? "var(--dsw-alias-brand-primary,#4f6ef7)" : void 0,
                color: logChannel === option.value ? "var(--dsw-alias-brand-primary,#4f6ef7)" : void 0
              }
            },
            option.label
          )
        ),
        data?.truncated ? React.createElement(Tag, { text: "\u5DF2\u622A\u65AD\uFF08\u53EA\u663E\u793A\u6700\u8FD1\u82E5\u5E72\u884C\uFF09", tone: "warn" }) : null
      ),
      entries.length === 0 ? React.createElement(
        "div",
        { style: s.muted },
        "\u8BE5\u9891\u9053\u6682\u65E0\u65E5\u5FD7\u3002\u4EFB\u52A1\u7C7B\u65E5\u5FD7\u9700\u6267\u884C\u8FC7\u4EFB\u52A1\uFF1B\u5BF9\u8BDD\u7C7B\u65E5\u5FD7\u9700\u53D1\u8D77\u8FC7\u5BF9\u8BDD\u8BF7\u6C42\u3002"
      ) : React.createElement(
        "div",
        {
          className: "dshc-log",
          style: {
            maxHeight: 420,
            overflowY: "auto",
            background: "var(--dsw-alias-bg-layer-1,#fff)",
            border: "1px solid var(--dsw-alias-border-l2,#e5e7eb)",
            borderRadius: 8,
            padding: "8px 10px"
          }
        },
        ...entries.map(
          (entry, index) => React.createElement(
            "div",
            {
              key: `${entry.ts}-${index}`,
              style: {
                color: entry.level === "ERR" ? tone.err.fg : entry.level === "WARN" ? tone.warn.fg : "var(--dsw-alias-label-primary,currentColor)"
              }
            },
            entry.text
          )
        )
      ),
      React.createElement("div", { style: { ...s.muted, marginTop: 10, lineHeight: 1.7 } }, data?.note ?? "")
    ),
    React.createElement(ReactLogSection, null)
  );
}
function ReactLogSection() {
  return React.createElement(
    "div",
    { style: s.card },
    React.createElement("div", { style: { ...s.label, marginBottom: 8 } }, "\u8FD9\u5957\u65E5\u5FD7\u662F\u600E\u4E48\u63A5\u5165\u7684"),
    React.createElement(
      "div",
      { style: { ...s.tip, lineHeight: 1.8 } },
      "\u7F51\u5173\u7528 log.SetOutput(io.MultiWriter(os.Stderr, ring)) \u4E00\u5904\u63A5\u7BA1\uFF0C",
      "196 \u5904\u65E2\u6709\u65E5\u5FD7\u8C03\u7528\u70B9\u4E00\u884C\u672A\u6539\uFF1B\u539F stderr \u884C\u4E3A\u4FDD\u6301\u4E0D\u53D8\uFF0C\u53EA\u662F\u591A\u590D\u5236\u4E00\u8DEF\u8FDB\u73AF\u5F62\u7F13\u51B2\u3002",
      React.createElement("br", null),
      "\u552F\u4E00\u4F8B\u5916\u662F\u5BF9\u8BDD\u6D41\u6C34\u884C \u2014\u2014 \u5B83\u8D70 fmt.Fprintf(os.Stdout, ...) \u800C\u975E log \u5305\uFF0C",
      "\u6240\u4EE5\u5355\u72EC\u6302\u4E86\u4E00\u8DEF\u8F93\u51FA\uFF0C\u5426\u5219\u300C\u5BF9\u8BDD\u300D\u9891\u9053\u4F1A\u6052\u7A7A\u3002"
    )
  );
}
function Switch({ checked, disabled, onChange, label }) {
  return React.createElement(
    "button",
    {
      type: "button",
      role: "switch",
      "aria-checked": checked === true,
      "aria-label": label,
      disabled,
      onClick: () => onChange?.(!checked),
      style: {
        font: "inherit",
        cursor: disabled ? "not-allowed" : "pointer",
        flex: "0 0 auto",
        width: 38,
        height: 22,
        borderRadius: 999,
        border: "1px solid transparent",
        padding: 2,
        background: checked ? "var(--dsw-alias-button-info-fill,#4176f7)" : "var(--dsw-alias-border-l3,#d1d5db)",
        opacity: disabled ? 0.5 : 1,
        transition: "background .18s",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: checked ? "flex-end" : "flex-start"
      }
    },
    React.createElement("span", {
      style: {
        width: 16,
        height: 16,
        borderRadius: 999,
        background: "#fff",
        boxShadow: "0 1px 3px rgba(15,23,42,.25)",
        transition: "all .18s"
      }
    })
  );
}
function InterfaceCard({ prefs }) {
  const [, force] = React.useReducer((value) => value + 1, 0);
  React.useEffect(() => {
    if (!prefs?.subscribe) return void 0;
    return prefs.subscribe(() => force());
  }, [prefs]);
  const available = prefs?.available === true;
  const writable = prefs?.writable === true;
  const enabled = prefs ? prefs.value : true;
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const toggle = async (next) => {
    if (!writable || busy) return;
    setBusy(true);
    setFailed(false);
    const ok = await prefs.set(next);
    setBusy(false);
    if (!ok) setFailed(true);
  };
  return React.createElement(
    "div",
    { style: { ...s.card, marginBottom: 16 } },
    React.createElement(
      "div",
      { className: "dshc-row", style: { justifyContent: "space-between" } },
      React.createElement(
        "div",
        { className: "dshc-row" },
        React.createElement(
          "span",
          { style: { ...s.label, display: "flex", alignItems: "center", gap: 6 } },
          React.createElement(Icons.gear, { style: { width: 15, height: 15, color: "var(--dsw-alias-state-business-primary,#4176ef)" } }),
          "\u754C\u9762"
        )
      ),
      React.createElement(Tag, {
        text: !available ? "\u5BBF\u4E3B\u4E0D\u652F\u6301" : writable ? "\u53EF\u4FEE\u6539" : "\u53EA\u8BFB",
        tone: !available ? "idle" : writable ? "ok" : "warn"
      })
    ),
    React.createElement(
      "div",
      {
        className: "dshc-row",
        style: { justifyContent: "space-between", gap: 12, marginTop: 10, alignItems: "flex-start" }
      },
      React.createElement(
        "div",
        { style: { minWidth: 0 } },
        React.createElement("div", { style: { ...s.label, fontSize: 13 } }, "\u5728\u4FA7\u8FB9\u680F\u5DE6\u4E0B\u89D2\u663E\u793A\u6E20\u9053\u5165\u53E3"),
        React.createElement(
          "div",
          { style: { ...s.muted, marginTop: 3, fontSize: 11.5, lineHeight: 1.6 } },
          "\u663E\u793A\u300C\u6E20\u9053\u300D\u6309\u94AE\uFF0C\u70B9\u5F00\u5373\u770B\u8D26\u53F7\u6C60\u6458\u8981\u4E0E\u5404\u53F7\u53EF\u7528\u79EF\u5206\uFF08\u53EA\u8BFB\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u6253\u4E0A\u6E38\uFF09\u3002",
          React.createElement("br", null),
          "\u5173\u6389\u540E\u5165\u53E3\u9690\u85CF\uFF0C\u672C\u9762\u677F\u4E0D\u53D7\u5F71\u54CD\uFF1B\u4E5F\u53EF\u5728 DSH \u539F\u751F\u63D2\u4EF6\u8BBE\u7F6E\u91CC\u6539\u3002"
        )
      ),
      React.createElement(Switch, {
        checked: enabled,
        disabled: !writable || busy,
        onChange: toggle,
        label: "\u5728\u4FA7\u8FB9\u680F\u5DE6\u4E0B\u89D2\u663E\u793A\u6E20\u9053\u5165\u53E3"
      })
    ),
    failed ? React.createElement(
      "div",
      { style: { ...s.muted, marginTop: 8, fontSize: 11.5, color: tone.err.fg } },
      "\u4FDD\u5B58\u5931\u8D25\uFF1A\u5BBF\u4E3B\u8BBE\u7F6E\u672A\u5199\u5165\uFF0C\u5DF2\u56DE\u6EDA\u4E3A\u5F53\u524D\u503C\u3002"
    ) : null,
    !available ? React.createElement(
      "div",
      { style: { ...s.muted, marginTop: 8, fontSize: 11.5 } },
      "\u5F53\u524D\u5BBF\u4E3B\u6CA1\u6709 settingsScope \u670D\u52A1\uFF0C\u65E0\u6CD5\u5728\u6B64\u5F00\u5173\uFF1B\u5165\u53E3\u6309\u9ED8\u8BA4\uFF08\u5F00\u542F\uFF09\u663E\u793A\u3002"
    ) : null
  );
}
function ConfigTab({ configInfo, onSave, saving, onServiceControl, serviceControlResult, serviceBusy, prefs }) {
  const [draft, setDraft] = React.useState({});
  const groups = React.useMemo(() => fieldsByGroup(), []);
  const config = configInfo?.config ?? {};
  const editable = Boolean(configInfo?.ok && configInfo?.writable);
  const setField = (path, value) => setDraft((prev) => ({ ...prev, [path]: value }));
  const dirty = Object.keys(draft);
  const validation = React.useMemo(() => {
    const errors = {};
    const restart = /* @__PURE__ */ new Set();
    const values = {};
    const byPath = /* @__PURE__ */ new Map();
    for (const group of groups) for (const field of group.fields) byPath.set(field.path, field);
    for (const [path, raw] of Object.entries(draft)) {
      const field = byPath.get(path);
      if (!field) continue;
      const result = coerceField(field, raw);
      if (!result.ok) errors[path] = result.message;
      else values[path] = result.value;
      if (field.restart !== false) restart.add(path);
    }
    return { errors, restart, values };
  }, [draft, groups]);
  const errorCount = Object.keys(validation.errors).length;
  if (configInfo && configInfo.ok === false) {
    return React.createElement(
      "div",
      null,
      // 界面偏好与网关文件无关 —— 必须留在错误分支里，否则远程部署时用户
      // 反而没法把侧边栏入口关掉（本卡在正常分支同样渲染）。
      React.createElement(InterfaceCard, { prefs }),
      React.createElement(Unavailable, {
        title: "\u7F51\u5173\u914D\u7F6E\u8BFB\u5199",
        needs: "\u540C\u673A\u6587\u4EF6\u8BBF\u95EE\uFF08config.json\uFF09",
        hint: configInfo.message
      }),
      configInfo.candidates ? React.createElement(
        "div",
        { style: s.card },
        React.createElement("div", { style: s.label, marginBottom: 8 }, "\u5DF2\u63A2\u6D4B\u7684\u5019\u9009\u8DEF\u5F84"),
        React.createElement(
          "div",
          { style: { ...s.code, lineHeight: 1.8 } },
          ...configInfo.candidates.map(
            (candidate) => React.createElement("div", { key: candidate }, candidate)
          )
        ),
        React.createElement(
          "div",
          { style: { ...s.muted, marginTop: 8 } },
          "\u5728\u63D2\u4EF6\u8BBE\u7F6E\u91CC\u586B\u5199 gatewayConfigPath\uFF08\u5BBF\u4E3B\u4E0A\u7684\u7EDD\u5BF9\u8DEF\u5F84\uFF09\u53EF\u76F4\u63A5\u6307\u5B9A\u3002"
        )
      ) : null
    );
  }
  return React.createElement(
    "div",
    null,
    // 界面偏好（插件自身偏好，置顶：与网关配置无关，任何部署形态都可用）
    React.createElement(InterfaceCard, { prefs }),
    // 服务操作（置顶：重启网关 + 可写状态）
    React.createElement(
      "div",
      { style: s.card },
      React.createElement(
        "div",
        { className: "dshc-row", style: { justifyContent: "space-between" } },
        React.createElement(
          "div",
          { className: "dshc-row" },
          React.createElement(
            "span",
            { style: { ...s.label, display: "flex", alignItems: "center", gap: 6 } },
            React.createElement(Icons.bolt, { style: { width: 15, height: 15, color: "var(--dsw-alias-state-warn-primary,#b45309)" } }),
            "\u670D\u52A1\u64CD\u4F5C"
          ),
          React.createElement(Tag, {
            text: editable ? "\u914D\u7F6E\u53EF\u5199" : "\u914D\u7F6E\u53EA\u8BFB",
            tone: editable ? "ok" : "warn"
          })
        ),
        React.createElement(
          "button",
          {
            type: "button",
            style: { ...s.btnGhost, borderColor: tone.warn.fg, color: tone.warn.fg },
            disabled: serviceBusy,
            onClick: onServiceControl
          },
          serviceBusy ? "\u91CD\u542F\u4E2D\u2026" : "\u21BB \u91CD\u542F\u7F51\u5173"
        )
      ),
      serviceControlResult ? React.createElement(
        "div",
        { style: { ...serviceControlResult.ok ? s.tip : s.err, marginTop: 10, lineHeight: 1.7 } },
        serviceControlResult.ok ? `\u547D\u4EE4\u5DF2\u6267\u884C\uFF1A${serviceControlResult.command}` : `${serviceControlResult.message ?? "\u6267\u884C\u5931\u8D25"}`,
        serviceControlResult.stdout ? React.createElement("div", { style: { ...s.code, marginTop: 6 } }, serviceControlResult.stdout) : null,
        serviceControlResult.stderr ? React.createElement("div", { style: { ...s.code, marginTop: 6 } }, serviceControlResult.stderr) : null
      ) : null
    ),
    ...groups.map(
      (group) => React.createElement(
        Fold,
        {
          key: group.id,
          id: `group-${group.id}`,
          open: group.openByDefault,
          summary: React.createElement(
            "span",
            { className: "dshc-row", style: { minWidth: 0 } },
            React.createElement("span", { style: s.label }, group.label),
            React.createElement("span", { style: s.muted }, `${group.fields.length} \u9879`),
            ...group.fields.filter((field) => field.danger).slice(0, 1).map((field) => React.createElement(Tag, { key: field.path, text: "\u542B\u5371\u9669\u8BED\u4E49", tone: "warn" })),
            dirty.some((path) => group.fields.some((field) => field.path === path)) ? React.createElement(Tag, { text: "\u6709\u6539\u52A8", tone: "info" }) : null
          )
        },
        React.createElement(
          "div",
          { className: "dshc-cfggrid" },
          ...group.fields.map(
            (field) => React.createElement(ConfigField, {
              key: field.path,
              field,
              value: field.path in draft ? draft[field.path] : getPath(config, field.path),
              error: validation.errors[field.path],
              dirty: field.path in draft,
              disabled: !editable,
              onChange: (value) => setField(field.path, value),
              onReset: () => setDraft((prev) => {
                const next = { ...prev };
                delete next[field.path];
                return next;
              })
            })
          )
        )
      )
    ),
    // 保存条
    React.createElement(
      "div",
      { style: s.card },
      React.createElement(
        "div",
        { className: "dshc-row", style: { justifyContent: "space-between" } },
        React.createElement(
          "div",
          { style: { ...s.label } },
          dirty.length === 0 ? "\u6CA1\u6709\u5F85\u4FDD\u5B58\u7684\u6539\u52A8" : `${dirty.length} \u9879\u5F85\u4FDD\u5B58`
        ),
        React.createElement(
          "div",
          { className: "dshc-row" },
          React.createElement(
            "button",
            {
              type: "button",
              style: s.btnGhost,
              disabled: dirty.length === 0,
              onClick: () => setDraft({})
            },
            "\u5168\u90E8\u8FD8\u539F"
          ),
          React.createElement(
            "button",
            {
              type: "button",
              style: { ...s.btnPri, opacity: errorCount > 0 || !editable ? 0.5 : 1 },
              disabled: errorCount > 0 || !editable || dirty.length === 0 || saving,
              onClick: () => onSave(validation.values)
            },
            saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58"
          )
        )
      ),
      errorCount > 0 ? React.createElement("div", { style: { ...s.err, marginTop: 10 } }, `${errorCount} \u9879\u6821\u9A8C\u672A\u901A\u8FC7\uFF0C\u65E0\u6CD5\u4FDD\u5B58\u3002`) : null,
      validation.restart.size > 0 ? React.createElement(
        "div",
        { style: { ...s.warn, marginTop: 10 } },
        `\u5176\u4E2D ${validation.restart.size} \u9879\u9700\u91CD\u542F\u7F51\u5173\u751F\u6548\u3002`
      ) : null
    )
  );
}
function ConfigField({ field, value, error, dirty, disabled, onChange, onReset }) {
  const inputProps = {
    style: {
      ...s.input,
      ...error ? { borderColor: "var(--dsw-alias-state-error-primary,#dc2626)" } : {},
      ...disabled ? { opacity: 0.6 } : {}
    },
    disabled,
    value: formatFieldValue(field, value),
    onChange: (event) => onChange(event.target.value)
  };
  let control;
  if (field.type === "bool") {
    control = React.createElement(
      "select",
      { ...inputProps, value: value === true ? "true" : value === false ? "false" : "" },
      React.createElement("option", { value: "true" }, "true"),
      React.createElement("option", { value: "false" }, "false")
    );
  } else if (field.type === "enum") {
    control = React.createElement(
      "select",
      inputProps,
      ...field.enumValues.split(",").map(
        (option) => React.createElement("option", { key: option, value: option }, option)
      )
    );
  } else {
    control = React.createElement("input", { ...inputProps, type: "text", placeholder: field.default ?? "" });
  }
  const rowTitle = [field.path, field.default ? `\u9ED8\u8BA4 ${field.default}` : "", field.note ?? ""].filter(Boolean).join(" \xB7 ");
  return React.createElement(
    "div",
    { className: `dshc-cfgrow${field.danger ? " danger" : ""}`, style: { flexWrap: field.note && field.danger ? "wrap" : "nowrap" } },
    React.createElement(
      "label",
      { title: rowTitle },
      field.label,
      field.restart !== false ? " \u21BB" : ""
    ),
    React.createElement(
      "span",
      { className: "dshc-cfgctl" },
      control,
      dirty ? React.createElement(
        "span",
        { style: { ...s.btnLink, cursor: "pointer", flexShrink: 0 }, onClick: onReset, title: "\u8FD8\u539F\u4E3A\u5F53\u524D\u6587\u4EF6\u503C" },
        "\u8FD8\u539F"
      ) : null
    ),
    field.danger ? React.createElement(Tag, { text: "\u5371\u9669", tone: "warn" }) : null,
    error ? React.createElement("span", { style: { ...s.muted, color: tone.err.fg, flexBasis: "100%" } }, error) : null
  );
}
function maskKey(value) {
  if (!value) return "";
  if (value.length <= 8) return "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022";
  return `${value.slice(0, 4)}\u2022\u2022\u2022\u2022${value.slice(-4)}`;
}
function ApiKeyPill({ onReveal }) {
  const [plain, setPlain] = React.useState("");
  const [revealed, setRevealed] = React.useState(false);
  const display = revealed && plain ? plain : maskKey(plain || "sk-\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022");
  const toggleEye = async () => {
    if (revealed) {
      setRevealed(false);
      return;
    }
    let value = plain;
    if (!value) {
      value = await onReveal();
      if (!value) return;
      setPlain(value);
    }
    setRevealed(true);
  };
  const copyAll = async () => {
    let value = plain;
    if (!value) value = await onReveal();
    if (!value) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch {
    }
  };
  return React.createElement(
    "span",
    { className: "dshc-keypill", style: { marginLeft: "auto" }, onClick: copyAll, title: "\u70B9\u51FB\u590D\u5236\u5B8C\u6574 API Key" },
    React.createElement("span", { style: { fontFamily: "ui-monospace,Menlo,monospace" } }, display),
    React.createElement("button", {
      type: "button",
      className: "dshc-keypill-ico",
      title: revealed ? "\u9690\u85CF" : "\u663E\u793A",
      onClick: (e) => {
        e.stopPropagation();
        void toggleEye();
      }
    }, revealed ? React.createElement(Icons.eyeOff, null) : React.createElement(Icons.eye, null)),
    React.createElement("span", { className: "dshc-keypill-ico", title: "\u590D\u5236" }, React.createElement(Icons.copy, null))
  );
}
function TabBar({ active, onChange, statusText, onAdd }) {
  return React.createElement(
    "div",
    { className: "dshc-tabs" },
    ...TABS.map(({ id, label, icon }) => {
      const isActive = active === id;
      const TabIcon = Icons[icon];
      return React.createElement(
        "button",
        {
          key: id,
          type: "button",
          onClick: () => onChange(id),
          style: {
            font: "inherit",
            cursor: "pointer",
            border: "none",
            background: "none",
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: isActive ? 600 : 400,
            color: isActive ? "var(--dsw-alias-state-business-primary,#4176e6)" : "var(--dsw-alias-label-secondary,#6b7280)",
            borderBottom: isActive ? "2px solid var(--dsw-alias-brand-primary,#4f6ef7)" : "2px solid transparent",
            marginBottom: -1,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
            flexShrink: 0
          }
        },
        TabIcon ? React.createElement(TabIcon, { style: { flexShrink: 0 } }) : null,
        label
      );
    }),
    // statusText 目前恒为空串（v2 把连接状态移到顶栏了），故条件渲染 ——
    // 否则这个空 span 的 paddingLeft 会在「添加账号」左侧留下 12px 死空隙。
    statusText ? React.createElement(
      "span",
      { style: { ...s.muted, marginLeft: "auto", paddingLeft: 12, whiteSpace: "nowrap" } },
      statusText
    ) : null,
    // 添加账号：与「账号池 … 配置」同一行、贴最右。是否渲染由 onAdd 是否存在决定。
    onAdd ? React.createElement("button", {
      type: "button",
      className: "dshc-tabadd",
      onClick: onAdd,
      title: "OAuth \u8BBE\u5907\u6388\u6743\u767B\u5F55\uFF1A\u6D4F\u89C8\u5668\u5B8C\u6210\u6388\u6743\u540E\u81EA\u52A8\u843D\u76D8\u5E76\u70ED\u52A0\u8F7D\u8FDB\u6C60\uFF0C\u65E0\u9700\u91CD\u542F\u7F51\u5173"
    }, "\uFF0B \u6DFB\u52A0\u8D26\u53F7") : null
  );
}
function ChanhubPanel({ rpcCall, prefs }) {
  const [activeTab, setActiveTab] = React.useState("accounts");
  const [data, setData] = React.useState(null);
  const [configInfo, setConfigInfo] = React.useState(null);
  const [authInfo, setAuthInfo] = React.useState(null);
  const [tasks, setTasks] = React.useState(null);
  const [creditsByUid, setCreditsByUid] = React.useState({});
  const [growthByUid, setGrowthByUid] = React.useState({});
  const [schoolByUid, setSchoolByUid] = React.useState({});
  const channelOf = React.useMemo(
    () => channelResolver(authInfo?.ok ? authInfo.accounts : []),
    [authInfo]
  );
  const [growthUid, setGrowthUid] = React.useState("");
  const [schoolUid, setSchoolUid] = React.useState("");
  const [logs, setLogs] = React.useState(null);
  const [logChannel, setLogChannel] = React.useState("all");
  const [runningTask, setRunningTask] = React.useState("");
  const [err, setErr] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshDegraded, setRefreshDegraded] = React.useState("");
  const [busyAccount, setBusyAccount] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [serviceBusy, setServiceBusy] = React.useState(false);
  const [serviceResult, setServiceResult] = React.useState(null);
  const [toast, setToast] = React.useState("");
  const toastTimer = React.useRef(null);
  const creditsGeneration = React.useRef(0);
  const unmountedRef = React.useRef(false);
  React.useEffect(
    () => () => {
      unmountedRef.current = true;
    },
    []
  );
  const showToast = React.useCallback((message, ms = 6e3) => {
    setToast(message);
    if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      toastTimer.current = null;
      setToast("");
    }, ms);
  }, []);
  React.useEffect(
    () => () => {
      if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    },
    []
  );
  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const [statusResult, configResult, accountsResult, tasksResult, logsResult] = await Promise.all([
        rpcCall(ENDPOINTS.refreshStatus, {}),
        rpcCall(ENDPOINTS.getConfig, {}),
        rpcCall(ENDPOINTS.getAccounts, {}),
        rpcCall(ENDPOINTS.getTasks, {}),
        rpcCall(ENDPOINTS.getLogs, { channel: logChannel, limit: 500 })
      ]);
      if (statusResult?.ok === false) {
        setErr(statusResult?.error?.message ?? "\u52A0\u8F7D\u5931\u8D25");
        setData(null);
        return;
      }
      setErr("");
      setData(statusResult?.value ?? null);
      setRefreshDegraded(statusResult?.value?.refreshed === false ? statusResult.value.refreshError?.message ?? "\u5237\u65B0\u672A\u751F\u6548" : "");
      setConfigInfo(configResult?.ok === false ? { ok: false, message: configResult?.error?.message } : configResult?.value ?? null);
      setAuthInfo(accountsResult?.value ?? null);
      setTasks(tasksResult?.value ?? null);
      setLogs(logsResult?.value ?? null);
      const accounts = statusResult?.value?.status?.accounts ?? [];
      const generation = ++creditsGeneration.current;
      void Promise.all(
        accounts.map(async (account) => {
          try {
            const result = await rpcCall(ENDPOINTS.getCredits, { uid: account.uid });
            return [account.uid, result?.value ?? { available: false, reason: "\u52A0\u8F7D\u5931\u8D25" }];
          } catch {
            return [account.uid, { available: false, reason: "\u52A0\u8F7D\u5931\u8D25" }];
          }
        })
      ).then((entries) => {
        if (creditsGeneration.current !== generation || unmountedRef.current) return;
        setCreditsByUid(Object.fromEntries(entries));
      });
      void Promise.all(
        accounts.map(async (account) => {
          try {
            const result = await rpcCall(ENDPOINTS.getGrowthTasks, { uid: account.uid });
            return [account.uid, result?.value ?? { available: false, reason: "\u52A0\u8F7D\u5931\u8D25" }];
          } catch {
            return [account.uid, { available: false, reason: "\u52A0\u8F7D\u5931\u8D25" }];
          }
        })
      ).then((entries) => {
        if (creditsGeneration.current !== generation || unmountedRef.current) return;
        setGrowthByUid(Object.fromEntries(entries));
      });
      void Promise.all(
        accounts.map(async (account) => {
          try {
            const result = await rpcCall(ENDPOINTS.getSchoolTasks, { uid: account.uid });
            return [account.uid, result?.value ?? { available: false, reason: "\u52A0\u8F7D\u5931\u8D25" }];
          } catch {
            return [account.uid, { available: false, reason: "\u52A0\u8F7D\u5931\u8D25" }];
          }
        })
      ).then((entries) => {
        if (creditsGeneration.current !== generation || unmountedRef.current) return;
        setSchoolByUid(Object.fromEntries(entries));
      });
    } catch (error) {
      setErr(error?.message ?? String(error));
    } finally {
      setRefreshing(false);
    }
  }, [rpcCall, logChannel]);
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  const onAccountAction = React.useCallback(
    async (account, action) => {
      const endpoint = {
        disable: ENDPOINTS.accountDisable,
        enable: ENDPOINTS.accountEnable,
        revive: ENDPOINTS.accountRevive
      }[action];
      const label = account.nickname || account.uid.slice(0, 8);
      const confirmText = {
        disable: `\u786E\u5B9A\u628A\u300C${label}\u300D\u6458\u51FA\u9009\u53F7\u6C60\uFF08\u624B\u52A8\u505C\u7528\uFF09\uFF1F

\u8BE5\u8D26\u53F7\u4ECD\u4FDD\u7559\u5728\u6C60\u91CC\uFF0C\u7B7E\u5230\u4E0E\u4FDD\u6D3B\u7167\u5E38\uFF0C\u53EF\u968F\u65F6\u542F\u7528\u3002`,
        enable: `\u786E\u5B9A\u89E3\u9664\u300C${label}\u300D\u7684\u624B\u52A8\u505C\u7528\uFF1F`,
        revive: `\u786E\u5B9A\u590D\u6D3B\u300C${label}\u300D\uFF08\u6E05\u9664\u7CFB\u7EDF\u7981\u7528\u72B6\u6001\uFF09\uFF1F`
      }[action];
      if (typeof window !== "undefined" && !window.confirm(confirmText)) return;
      let reason = "";
      if (action === "disable" && typeof window !== "undefined") {
        reason = window.prompt("\u505C\u7528\u539F\u56E0\uFF08\u53EF\u9009\uFF09\uFF1A", "") ?? "";
      }
      setBusyAccount((prev) => ({ ...prev, [account.uid]: true }));
      try {
        const result = await rpcCall(endpoint, action === "disable" ? { uid: account.uid, reason } : { uid: account.uid });
        if (result?.ok === false) {
          showToast(`\u64CD\u4F5C\u5931\u8D25\uFF1A${result?.error?.message ?? "\u672A\u77E5\u9519\u8BEF"}`);
        } else {
          const value = result?.value ?? {};
          const stillDisabled = value.disabled === true && action !== "revive";
          showToast(
            `\u5DF2${action === "disable" ? "\u505C\u7528" : action === "enable" ? "\u542F\u7528" : "\u590D\u6D3B"}\u300C${label}\u300D` + (stillDisabled ? " \u2014\u2014 \u6CE8\u610F\uFF1A\u7CFB\u7EDF\u7981\u7528\u4F4D\u4ECD\u4E3A true\uFF0C\u9700\u518D\u70B9\u300C\u590D\u6D3B\u300D\u624D\u80FD\u56DE\u6C60\u3002" : "")
          );
          await refresh();
        }
      } catch (error) {
        showToast(`\u64CD\u4F5C\u5F02\u5E38\uFF1A${error?.message ?? error}`);
      } finally {
        setBusyAccount((prev) => ({ ...prev, [account.uid]: false }));
      }
    },
    [rpcCall, refresh, showToast]
  );
  const onSave = React.useCallback(
    async (patch) => {
      setSaving(true);
      try {
        const result = await rpcCall(ENDPOINTS.saveConfig, { patch });
        const value = result?.value ?? {};
        if (result?.ok === false) {
          showToast(`\u4FDD\u5B58\u5931\u8D25\uFF1A${result?.error?.message ?? "\u672A\u77E5\u9519\u8BEF"}`);
        } else if (value.ok === false) {
          showToast(`\u4FDD\u5B58\u88AB\u62D2\u7EDD\uFF1A${value.message}`);
        } else {
          const parts = [`\u5DF2\u5199\u5165 ${value.applied?.length ?? 0} \u9879`];
          const hot = Array.isArray(value.hot_applied) ? value.hot_applied.length : 0;
          const restart = Array.isArray(value.restart_required) ? value.restart_required.length : typeof value.restartRequiredCount === "number" ? value.restartRequiredCount : 0;
          if (hot > 0) parts.push(`${hot} \u9879\u5DF2\u5373\u65F6\u751F\u6548`);
          if (restart > 0) parts.push(`${restart} \u9879\u9700\u91CD\u542F\u7F51\u5173\u751F\u6548`);
          if (value.viaGateway === false) {
            const capable = Array.isArray(value.hotCapable) ? value.hotCapable.length : 0;
            parts.push(`\u26A0 \u7F51\u5173\u70ED\u751F\u6548\u7AEF\u70B9\u4E0D\u53EF\u7528\uFF08${value.gatewayError?.message ?? "\u5DF2\u964D\u7EA7\u4E3A\u6587\u4EF6\u76F4\u5199"}\uFF09`);
            if (capable > 0) parts.push(`\u4FEE\u590D\u540E\u8FD9 ${capable} \u9879\u53EF\u5373\u65F6\u751F\u6548`);
          }
          if (value.api_key_hint) parts.push(value.api_key_hint);
          showToast(parts.join(" \xB7 "), 8e3);
          await refresh();
        }
      } catch (error) {
        showToast(`\u4FDD\u5B58\u5F02\u5E38\uFF1A${error?.message ?? error}`);
      } finally {
        setSaving(false);
      }
    },
    [rpcCall, refresh, showToast]
  );
  const [growthWriteBusy, setGrowthWriteBusy] = React.useState("");
  const [taskScanData, setTaskScanData] = React.useState(null);
  const [taskScanning, setTaskScanning] = React.useState(false);
  const [taskQueueData, setTaskQueueData] = React.useState(null);
  const [vouchersData, setVouchersData] = React.useState(null);
  const [vouchersLoading, setVouchersLoading] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [loginChannels, setLoginChannels] = React.useState(null);
  const [loginRealms, setLoginRealms] = React.useState([]);
  React.useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const result = await rpcCall(ENDPOINTS.getChannels, {});
        if (!alive) return;
        setLoginChannels(result?.value?.loginChannels ?? []);
        setLoginRealms(result?.value?.realms ?? []);
      } catch {
        if (alive) setLoginChannels([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [rpcCall]);
  const onTaskScan = React.useCallback(
    async () => {
      setTaskScanning(true);
      try {
        const result = await rpcCall(ENDPOINTS.taskScan, {});
        if (result?.ok === false) {
          showToast(`\u626B\u63CF\u5931\u8D25\uFF1A${result.error?.message ?? "\u672A\u77E5\u9519\u8BEF"}`);
        } else {
          setTaskScanData(result?.value ?? null);
        }
      } catch (error) {
        showToast(`\u626B\u63CF\u5F02\u5E38\uFF1A${error?.message ?? error}`);
      } finally {
        setTaskScanning(false);
      }
    },
    [rpcCall, showToast]
  );
  const onTaskQueueStart = React.useCallback(
    async () => {
      try {
        const result = await rpcCall(ENDPOINTS.taskQueueStart, { concurrency: 2 });
        const value = result?.value ?? {};
        if (result?.ok === false) {
          showToast(`\u961F\u5217\u542F\u52A8\u5931\u8D25\uFF1A${result.error?.message ?? "\u672A\u77E5\u9519\u8BEF"}`);
          return;
        }
        if (value.started === false) {
          showToast(value.message ?? "\u6CA1\u6709\u5F85\u529E\u4EFB\u52A1\uFF0C\u6216\u961F\u5217\u5DF2\u5728\u6267\u884C\u4E2D");
          return;
        }
        showToast(`\u961F\u5217\u5DF2\u542F\u52A8\uFF1A${value.total} \u9879\uFF08\u5E76\u53D1 2\uFF09`);
        const poll = async () => {
          try {
            const status2 = await rpcCall(ENDPOINTS.taskQueueStatus, {});
            const snap = status2?.value ?? null;
            setTaskQueueData(snap);
            if (snap?.running) {
              setTimeout(poll, 5e3);
            } else {
              showToast("\u961F\u5217\u6267\u884C\u7ED3\u675F\u3002");
              await refresh();
            }
          } catch {
          }
        };
        setTimeout(poll, 2e3);
      } catch (error) {
        showToast(`\u961F\u5217\u5F02\u5E38\uFF1A${error?.message ?? error}`);
      }
    },
    [rpcCall, refresh, showToast]
  );
  const onRemoveAccount = React.useCallback(
    async (account) => {
      const label = account.nickname || account.uid.slice(0, 8);
      if (typeof window !== "undefined" && !window.confirm(`\u79FB\u9664\u8D26\u53F7\u300C${label}\u300D\u5C06\u5220\u9664\u6C60\u72B6\u6001\u4E0E auths/ \u4E0B\u7684\u51ED\u8BC1\u6587\u4EF6\uFF0C\u4E14\u4E0D\u53EF\u6062\u590D\u3002\u786E\u8BA4\u79FB\u9664\uFF1F`)) {
        return;
      }
      try {
        const result = await rpcCall(ENDPOINTS.accountMore, { action: "remove", uid: account.uid });
        if (result?.ok === false) {
          showToast(`\u79FB\u9664\u5931\u8D25\uFF1A${result.error?.message ?? "\u672A\u77E5\u9519\u8BEF"}`);
        } else {
          const fileError = result?.value?.file_error;
          showToast(fileError ? `\u5DF2\u51FA\u6C60\uFF0C\u4F46\u51ED\u8BC1\u6587\u4EF6\u5220\u9664\u5931\u8D25\uFF1A${fileError}` : `\u300C${label}\u300D\u5DF2\u79FB\u9664\u3002`);
          await refresh();
        }
      } catch (error) {
        showToast(`\u79FB\u9664\u5F02\u5E38\uFF1A${error?.message ?? error}`);
      }
    },
    [rpcCall, refresh, showToast]
  );
  const onLoginStart = React.useCallback(
    async (channel, realm) => {
      try {
        const result = await rpcCall(ENDPOINTS.loginStart, { channel, realm });
        if (result?.ok === false && channel === "workbuddy") {
          const message = result.error?.message ?? "";
          if (/unknown channel/i.test(message)) {
            return { ok: false, error: { message: "\u8BE5\u7F51\u5173\u7248\u672C\u4E0D\u652F\u6301\u5728\u9762\u677F\u91CC\u6DFB\u52A0 workbuddy \u8D26\u53F7 \u2014\u2014 \u8BF7\u5347\u7EA7 chanhub \u7F51\u5173\u540E\u91CD\u8BD5\u3002" } };
          }
        }
        return result;
      } catch (error) {
        return { ok: false, error: { message: String(error?.message ?? error) } };
      }
    },
    [rpcCall]
  );
  const onLoginPoll = React.useCallback(
    async (channel) => rpcCall(ENDPOINTS.loginPoll, { channel }),
    [rpcCall]
  );
  const onLoginCallback = React.useCallback(
    async (channel, callback) => rpcCall(ENDPOINTS.loginCallback, { channel, callback }),
    [rpcCall]
  );
  const onViewVouchers = React.useCallback(
    async () => {
      setVouchersLoading(true);
      try {
        const result = await rpcCall(ENDPOINTS.schoolVouchersAll, {});
        if (result?.ok === false) {
          showToast(`\u5238\u7801\u67E5\u8BE2\u5931\u8D25\uFF1A${result.error?.message ?? "\u672A\u77E5\u9519\u8BEF"}`);
        } else {
          setVouchersData(result?.value ?? { rows: [] });
        }
      } catch (error) {
        showToast(`\u5238\u7801\u67E5\u8BE2\u5F02\u5E38\uFF1A${error?.message ?? error}`);
      } finally {
        setVouchersLoading(false);
      }
    },
    [rpcCall, showToast]
  );
  const taskAccounts = data?.status?.accounts ?? [];
  const wbTaskAccounts = taskAccounts.filter((account) => (channelOf?.(account) ?? "workbuddy") === "workbuddy");
  const effectiveGrowthUid = useSelectedUid(growthUid, growthByUid, wbTaskAccounts.length > 0 ? wbTaskAccounts : taskAccounts);
  const effectiveSchoolUid = useSelectedUid(schoolUid, schoolByUid, wbTaskAccounts.length > 0 ? wbTaskAccounts : taskAccounts);
  const onGrowthWrite = React.useCallback(
    async (action, code) => {
      const uid = effectiveGrowthUid;
      if (!uid) {
        showToast("\u6210\u957F\u4EFB\u52A1\u8FDB\u5EA6\u662F\u9010\u8D26\u53F7\u7684\uFF1A\u5F53\u524D\u6CA1\u6709\u53EF\u64CD\u4F5C\u7684\u8D26\u53F7\u6570\u636E\u3002");
        return;
      }
      setGrowthWriteBusy(code ?? action);
      try {
        const result = await rpcCall(ENDPOINTS.growthWrite, {
          action,
          uid,
          codes: code ? [code] : void 0
        });
        const value = result?.value ?? {};
        if (result?.ok === false) {
          showToast(`\u64CD\u4F5C\u5931\u8D25\uFF1A${result.error?.message ?? "\u672A\u77E5\u9519\u8BEF"}`);
        } else {
          const bad = (value.results ?? []).filter((r) => !r.ok);
          if (bad.length > 0) {
            showToast(`\u300C${action}\u300D\u90E8\u5206\u5931\u8D25\uFF1A${bad.map((r) => `${r.code}\uFF08${r.detail}\uFF09`).join("\uFF1B")}`, 8e3);
          } else {
            showToast(action === "claim-claimable" ? "\u5DF2\u9886\u53D6\u5168\u90E8\u53EF\u9886\u5956\u52B1\u3002" : `\u300C${code}\u300D${action === "accept" ? "\u5DF2\u4E0B\u53D1\u70B9\u4EAE" : "\u5DF2\u9886\u53D6"}\u3002`);
          }
          await refresh();
        }
      } catch (error) {
        showToast(`\u64CD\u4F5C\u5F02\u5E38\uFF1A${error?.message ?? error}`);
      } finally {
        setGrowthWriteBusy("");
      }
    },
    [rpcCall, refresh, showToast, effectiveGrowthUid]
  );
  const onRunTask = React.useCallback(
    async (name2) => {
      const def = TASK_DEFS.find((task) => task.name === name2);
      const label = def ? def.label : name2;
      setRunningTask(name2);
      try {
        const result = await rpcCall(ENDPOINTS.runTask, { name: name2 });
        const value = result?.value ?? {};
        if (result?.ok === false) {
          showToast(`\u89E6\u53D1\u300C${label}\u300D\u5931\u8D25\uFF1A${result.error?.message ?? "\u672A\u77E5\u9519\u8BEF"}`);
        } else if (value.busy) {
          showToast(`\u300C${label}\u300D\u5DF2\u5728\u8FD0\u884C\u4E2D \u2014\u2014 \u7F51\u5173\u672A\u91CD\u590D\u53D1\u8D77\uFF08\u907F\u514D\u91CD\u590D\u6253\u4E0A\u6E38\uFF09\u3002`);
        } else if (value.started) {
          showToast(`\u300C${label}\u300D\u5DF2\u542F\u52A8\uFF0C\u6B63\u5728\u7F51\u5173\u4FA7\u5F02\u6B65\u6267\u884C\uFF1B\u7A0D\u540E\u5237\u65B0\u53EF\u89C1\u7ED3\u679C\u3002`);
          await refresh();
        } else {
          showToast(`\u300C${label}\u300D\u672A\u88AB\u542F\u52A8\u3002`);
        }
      } catch (error) {
        showToast(`\u89E6\u53D1\u5F02\u5E38\uFF1A${error?.message ?? error}`);
      } finally {
        setRunningTask("");
      }
    },
    [rpcCall, refresh, showToast]
  );
  const onClearLogs = React.useCallback(async () => {
    try {
      await rpcCall(ENDPOINTS.getLogs, { channel: logChannel, clear: true });
      await refresh();
    } catch (error) {
      showToast(`\u6E05\u7A7A\u5931\u8D25\uFF1A${error?.message ?? error}`);
    }
  }, [rpcCall, logChannel, refresh, showToast]);
  const onServiceControl = React.useCallback(async () => {
    if (typeof window !== "undefined" && !window.confirm("\u786E\u5B9A\u5728\u5BBF\u4E3B\u6267\u884C\u91CD\u542F\u547D\u4EE4\uFF1F\u8FD9\u4F1A\u77ED\u6682\u4E2D\u65AD\u7F51\u5173\u670D\u52A1\u3002")) return;
    setServiceBusy(true);
    setServiceResult(null);
    try {
      const result = await rpcCall(ENDPOINTS.serviceControl, {});
      setServiceResult(result?.value ?? { ok: false, message: result?.error?.message ?? "\u65E0\u54CD\u5E94" });
    } catch (error) {
      setServiceResult({ ok: false, message: String(error?.message ?? error) });
    } finally {
      setServiceBusy(false);
    }
  }, [rpcCall]);
  const status = data?.status;
  const maxInFlight = maxInFlightOf(configInfo?.config);
  const limitOf = React.useCallback((account) => realmLimitOf(configInfo?.config, account?.realm), [configInfo?.config]);
  const adminAvailable = data?.probe?.features?.admin === true || data?.probe?.features?.tasks === true;
  const onReveal = React.useCallback(async () => {
    try {
      const result = await rpcCall(ENDPOINTS.revealApiKey, {});
      if (result?.ok === false) {
        showToast(`\u83B7\u53D6\u5931\u8D25\uFF1A${result?.error?.message ?? "\u672A\u77E5\u9519\u8BEF"}`);
        return "";
      }
      return String(result?.value?.apiKey ?? "");
    } catch (error) {
      showToast(`\u83B7\u53D6\u5931\u8D25\uFF1A${error?.message ?? error}`);
      return "";
    }
  }, [rpcCall, showToast]);
  const statusText = (() => {
    if (data?.reachable === false) return "\u25CF \u672A\u8FDE\u63A5";
    if (data?.error) return `\u25CF ${data.error.code === "auth-failed" ? "\u9274\u6743\u5931\u8D25" : "\u5F02\u5E38"}`;
    if (data?.reachable === true) {
      const base = (data.baseURL ?? "").replace(/^https?:\/\//, "");
      return `\u25CF \u5DF2\u8FDE\u63A5 ${base}`;
    }
    return "\u52A0\u8F7D\u4E2D\u2026";
  })();
  return React.createElement(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 0, minWidth: 0 } },
    React.createElement("style", null, FOLD_CSS),
    // 顶栏（单行药丸条）：标题 + 连接状态 + API_KEY 药丸 + 刷新
    React.createElement(
      "div",
      { className: "dshc-topbar" },
      React.createElement(Icons.hub, { style: { color: "var(--dsw-alias-brand-primary,#4f6ef7)", width: 20, height: 20, flexShrink: 0 } }),
      React.createElement("span", { className: "dshc-topbar-title" }, "\u6E20\u9053\u4E2D\u5FC3"),
      React.createElement(
        "span",
        { className: "dshc-row", style: { gap: 6, marginLeft: 4 } },
        React.createElement("span", {
          className: "dshc-statusdot",
          style: { background: data?.reachable === false || data?.error ? tone.err.fg : data?.reachable ? tone.ok.fg : tone.idle.fg }
        }),
        React.createElement(
          "span",
          { style: { ...s.muted, whiteSpace: "nowrap" } },
          data?.reachable === true ? `\u5DF2\u8FDE\u63A5 ${(data.baseURL ?? "").replace(/^https?:\/\//, "")}` : data?.reachable === false ? "\u672A\u8FDE\u63A5" : data?.error ? "\u5F02\u5E38" : "\u52A0\u8F7D\u4E2D\u2026"
        )
      ),
      React.createElement(ApiKeyPill, { onReveal }),
      React.createElement(
        "button",
        {
          type: "button",
          // 刷新反馈：图标旋转 + 文案切换 + 禁用态。此前只有 disabled（无任何视觉
          // 差异），点下去看不出有没有生效 —— 与「刷新没反应」的报告一致。
          style: { ...s.btnGhost, height: 26, padding: "0 10px", marginLeft: "auto", flexShrink: 0, gap: 5, opacity: refreshing ? 0.65 : 1 },
          onClick: refresh,
          disabled: refreshing,
          title: refreshing ? "\u6B63\u5728\u5237\u65B0\u2026" : "\u5237\u65B0\u6570\u636E\uFF08\u91CD\u65B0\u62C9\u53D6\u8D26\u53F7\u3001\u4EFB\u52A1\u3001\u7528\u91CF\u3001\u65E5\u5FD7\uFF09"
        },
        React.createElement(
          "span",
          { className: refreshing ? "dshc-spin" : "" },
          React.createElement(Icons.refresh, null)
        ),
        refreshing ? React.createElement("span", { style: { fontSize: 12 } }, "\u5237\u65B0\u4E2D\u2026") : null
      )
    ),
    // 出错时的细警示条（仅出错时出现，替代原整卡说明）
    data?.reachable === false ? React.createElement(
      "div",
      { style: { ...s.err, marginBottom: 12, lineHeight: 1.7 } },
      `\u65E0\u6CD5\u8FDE\u63A5\u7F51\u5173\uFF1A${data.error?.message ?? "\u672A\u77E5\u539F\u56E0"} \u2014\u2014 \u8BF7\u786E\u8BA4\u7F51\u5173\u5DF2\u542F\u52A8\u3001\u5730\u5740\u6B63\u786E\u3002`
    ) : null,
    data?.reachable === true && data?.error ? React.createElement(
      "div",
      { style: { ...s.err, marginBottom: 12, lineHeight: 1.7 } },
      `\u7F51\u5173\u53EF\u8FBE\uFF0C\u4F46\u53D6\u72B6\u6001\u5931\u8D25\uFF1A${data.error.message}`,
      data.error.code === "auth-failed" ? "\uFF08API key \u4E0D\u5339\u914D\uFF0C\u8BF7\u6838\u5BF9\u63D2\u4EF6\u8BBE\u7F6E\u91CC\u7684\u51ED\u8BC1\uFF09" : ""
    ) : null,
    err ? React.createElement("div", { style: { ...s.err, marginBottom: 12 } }, err) : null,
    // 刷新降级提示：网关没开 admin.enabled（或版本较旧）时刷新拿不到新余额，
    // 显示的是缓存值。必须说出来 —— 否则用户会以为积分卡住了。
    refreshDegraded ? React.createElement(
      "div",
      { style: { ...s.warn, marginBottom: 12, lineHeight: 1.7 } },
      `\u79EF\u5206\u53EF\u80FD\u4E0D\u662F\u6700\u65B0\u7684\uFF1A${refreshDegraded}`,
      React.createElement(
        "div",
        { style: { marginTop: 4 } },
        "\u5728\u7F51\u5173 config.json \u91CC\u8BBE\u7F6E ",
        React.createElement("code", { style: s.code }, "admin.enabled: true"),
        " \u540E\u91CD\u542F\u7F51\u5173\uFF0C\u5237\u65B0\u5373\u53EF\u540C\u6B65\u6700\u65B0\u4F59\u989D\u3002"
      )
    ) : null,
    // onAdd 为空（loginChannels 空数组 = 旧网关，或 null = 尚未探完）时不渲染按钮。
    React.createElement(TabBar, {
      active: activeTab,
      onChange: setActiveTab,
      statusText: "",
      onAdd: loginChannels && loginChannels.length > 0 ? () => setAddOpen(true) : void 0
    }),
    // Tab 内容
    activeTab === "accounts" ? React.createElement(AccountsTab, {
      status,
      channelOf,
      maxInFlight,
      limitOf,
      onAction: onAccountAction,
      busy: busyAccount,
      onRefresh: refresh,
      error: "",
      creditsByUid,
      scheduleConfig: configInfo?.config?.schedule,
      onRemove: onRemoveAccount,
      // 凭证盘点（只读、不含 token）：账号卡片的「到期」取它。
      authAccounts: authInfo?.ok ? authInfo.accounts : []
    }) : null,
    activeTab === "tasks" ? React.createElement(TasksTab, {
      status,
      channelOf,
      maxInFlight,
      taskData: tasks,
      growthData: growthByUid,
      schoolData: schoolByUid,
      growthUid: effectiveGrowthUid,
      setGrowthUid,
      schoolUid: effectiveSchoolUid,
      setSchoolUid,
      onRunTask,
      runningName: runningTask,
      onRefresh: refresh,
      scheduleConfig: configInfo?.config?.schedule,
      onGrowthWrite,
      growthWriteBusy,
      adminAvailable,
      scanData: taskScanData,
      scanning: taskScanning,
      queueData: taskQueueData,
      onScan: onTaskScan,
      onQueueStart: onTaskQueueStart,
      vouchersData,
      vouchersLoading,
      onViewVouchers
    }) : null,
    activeTab === "usage" ? React.createElement(UsageTab, {
      // 用量页自管数据（SWR 缓存 + 一次拉 720h + 前端切片）。
      // 存量与归因命名复用账号池同源数据 —— 不新增任何网关请求。
      rpcCall,
      accounts: data?.status?.accounts ?? [],
      channelOf,
      onRefreshAll: refresh
    }) : null,
    activeTab === "logs" ? React.createElement(LogsTab, {
      logs,
      logChannel,
      onChannelChange: setLogChannel,
      onRefresh: refresh,
      onClear: onClearLogs
    }) : null,
    activeTab === "config" ? React.createElement(ConfigTab, {
      configInfo,
      onSave,
      saving,
      onServiceControl,
      serviceControlResult: serviceResult,
      serviceBusy,
      prefs
    }) : null,
    // 添加账号弹窗（OAuth 设备授权）。会话态在网关侧，故关掉弹窗不丢失在途登录；
    // 重开只是重新发起——这是有意的：避免面板里藏一个不可见的后台轮询。
    addOpen ? React.createElement(AddAccountDialog, {
      channels: loginChannels ?? [],
      realms: loginRealms,
      onStart: onLoginStart,
      onPoll: onLoginPoll,
      onCallback: onLoginCallback,
      // 关弹窗也刷一次：登录成功那条路径由 onDone 触发，但「粘贴回调后直接
      // 关掉」「登录中途放弃」等路径同样可能已经改变了池状态，让账号池
      // 停在上一次快照上是不可接受的。刷新是幂等的读操作，多一次无副作用。
      onClose: () => {
        setAddOpen(false);
        void refresh();
      },
      onDone: refresh
    }) : null,
    // 轻量提示条
    toast ? React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 9999,
          maxWidth: 380,
          background: "var(--dsw-alias-bg-layer-2,#fff)",
          border: "1px solid var(--dsw-alias-border-l2,#e5e7eb)",
          borderRadius: 10,
          padding: "10px 14px",
          fontSize: 12,
          lineHeight: 1.6,
          boxShadow: "0 6px 20px rgba(0,0,0,.12)",
          color: "var(--dsw-alias-label-primary,currentColor)"
        }
      },
      toast
    ) : null
  );
}
function apply(ctx) {
  const rpcCall = async (endpoint, payload, signal) => {
    return ctx.connection.rpc.call(CHANNEL, endpoint, payload, signal);
  };
  const effect = (factory, label) => {
    if (typeof ctx.effect === "function") return ctx.effect(factory, label);
    return void 0;
  };
  const prefs = createSidebarPrefs(ctx.settingsScope, { namespace: SETTINGS_NAMESPACE, key: "sidebarEntry" });
  const store = createQuickStore(rpcCall);
  effect(() => () => store.dispose(), "dsh-chanhub: sidebar quick store");
  effect(() => () => prefs.dispose?.(), "dsh-chanhub: sidebar entry prefs");
  const remoteSettings = () => {
    try {
      const remote = typeof ctx.get === "function" ? ctx.get("remote") : void 0;
      return remote?.settings;
    } catch {
      return void 0;
    }
  };
  ctx.slots.inject(
    "sidebar.footer.action",
    () => ctx.slots.register(
      {
        name: "sidebar.footer.action",
        id: "chanhub-quick",
        order: 100,
        label: () => "\u6E20\u9053\u8D26\u53F7",
        inject: () => ({
          store,
          prefs,
          hasOpenSettings: () => typeof remoteSettings()?.openSettingsDocument === "function",
          openSettings: () => remoteSettings()?.openSettingsDocument?.()
        })
      },
      QuickEntry
    )
  );
  ctx.slots.inject(
    "settings.section",
    () => ctx.slots.register(
      {
        name: "settings.section",
        id: "dsh-chanhub",
        order: 11,
        label: () => "\u6E20\u9053\u4E2D\u5FC3",
        inject: () => ({ rpcCall, prefs })
      },
      ChanhubPanel
    )
  );
}

    return module.exports;
  }
});

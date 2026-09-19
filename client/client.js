window.__ModuleLoader__.load({
  id: "dsh-chanhub",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// client/index.js
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);

// client/theme.js
var s = {
  card: {
    background: "var(--dsw-alias-bg-layer-2,#f9fafb)",
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
.dshc-body .dshc-body { background: var(--dsw-alias-bg-layer-1,#fff); }
/* \u884C\uFF1A\u4E00\u5F8B center \u5BF9\u9F50 \u2014\u2014 \u7AD6\u6392\u5757\u4E0E\u5355\u884C\u6587\u5B57\u7528 baseline \u4F1A\u9519\u4F4D\uFF08\u5B9E\u6D4B 20px\uFF0C\u5751 3\uFF09 */
.dshc-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.dshc-grid { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.dshc-sub { padding-left: 16px; border-left: 2px solid var(--dsw-alias-border-l2,#e5e7eb); margin-left: 6px; }
/* \u8868\u683C\u6A2A\u5411\u6EDA\u52A8\uFF1A\u5BB9\u5668\u94FE\u4E0A\u5FC5\u987B\u6709 min-width:0\uFF0C\u5426\u5219 min-width \u4F1A\u6491\u7834\u5361\u7247 */
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
`;

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
      restart: false,
      note: "0 \u6216\u8D1F = \u7981\u7528\u5FEB\u8FC7\u671F\u5206\u6876\uFF08\u5408\u6CD5\u503C\uFF0C\u4E0D\u662F\u56DE\u843D\uFF09",
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
    // ---- schedule（13 项；chanhub 无 Reconfigure → 需重启）----
    { path: "schedule.checkin_hours", label: "\u7B7E\u5230\u5C0F\u65F6", type: "hours", default: "[9,21]", restart: true },
    { path: "schedule.travel_hours", label: "\u732B\u732B\u65C5\u884C\u5C0F\u65F6", type: "hours", default: "[9,21]", restart: true },
    { path: "schedule.activity_hours", label: "\u6D3B\u8DC3\u5730\u56FE\u5C0F\u65F6", type: "hours", default: "[10]", restart: true },
    { path: "schedule.keepalive_hours", label: "token \u4FDD\u6D3B\u5C0F\u65F6", type: "hours", default: "[22]", restart: true },
    { path: "schedule.school_hours", label: "\u5F00\u5B66\u5B63\u5C0F\u65F6", type: "hours", default: "[12]", restart: true },
    { path: "schedule.cat_hours", label: "\u591C\u732B\u5B50\u5C0F\u65F6", type: "hours", default: "[1]", restart: true, note: "\u7A97\u53E3 23:00\u201308:00 CST" },
    { path: "schedule.checkin_enabled", label: "\u542F\u7528\u7B7E\u5230", type: "bool", default: "true", restart: true },
    { path: "schedule.travel_enabled", label: "\u542F\u7528\u65C5\u884C", type: "bool", default: "true", restart: true },
    { path: "schedule.activity_enabled", label: "\u542F\u7528\u6D3B\u8DC3\u4E0A\u62A5", type: "bool", default: "true", restart: true },
    { path: "schedule.keepalive_enabled", label: "\u542F\u7528\u4FDD\u6D3B", type: "bool", default: "true", restart: true },
    { path: "schedule.school_enabled", label: "\u542F\u7528\u5F00\u5B66\u5B63", type: "bool", default: "true", restart: true },
    { path: "schedule.cat_enabled", label: "\u542F\u7528\u591C\u732B\u5B50", type: "bool", default: "true", restart: true },
    {
      path: "schedule.activity_report_count",
      label: "\u6BCF\u6B21\u4E0A\u62A5\u6761\u6570",
      type: "int",
      default: "5",
      restart: true,
      note: "\u7F3A\u7701 5\uFF1B\u663E\u5F0F 0 \u2192 \u53D8\u4E3A 1\uFF08\u4E24\u6761\u8DEF\u5F84\u4E0D\u5408\u5E76\uFF0C\u662F\u523B\u610F\u7684\uFF09",
      danger: true
    },
    // ---- cooldown（2 项）----
    { path: "cooldown.soft_rate", label: "\u8F6F\u9650\u6D41\u51B7\u5374\u57FA\u6570", type: "duration", default: "600s", restart: false },
    { path: "cooldown.soft_rate_max", label: "\u8F6F\u51B7\u5374\u9000\u907F\u5C01\u9876", type: "duration", default: "2h", restart: false },
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
    { path: "prompt.mode", label: "\u63D0\u793A\u8BCD\u6A21\u5F0F", type: "enum", enumValues: "passthrough,custom,append", default: "passthrough", restart: true, note: "\u975E\u6CD5\u503C\u4F1A\u5BFC\u81F4\u7F51\u5173\u542F\u52A8\u62A5\u9519" },
    { path: "prompt.file", label: "\u63D0\u793A\u8BCD\u6587\u4EF6", type: "string", default: "", restart: true, note: "custom/append \u4E0B\u975E\u7A7A\u4F46\u4E0D\u53EF\u8BFB \u2192 \u542F\u52A8\u62A5\u9519" },
    // ---- upstash（2 项）----
    { path: "upstash.url", label: "Redis URL", type: "string", default: "", restart: true, note: "\u7A7A = \u7EAF\u5185\u5B58" },
    { path: "upstash.token", label: "Redis token", type: "string", default: "", restart: true, danger: true },
    // ---- features（1 项）----
    { path: "features.sanitize_blacklist_fingerprints", label: "\u9ED1\u540D\u5355\u6307\u7EB9\u8131\u654F", type: "bool", default: "true", restart: false },
    // ---- admin（1 项）----
    { path: "admin.enabled", label: "\u542F\u7528\u7BA1\u7406\u7AEF\u70B9", type: "bool", default: "false", restart: true, danger: true, note: "\u5F00\u542F\u4E14 api_key \u4E3A\u7A7A \u2192 \u7F51\u5173\u62D2\u7EDD\u542F\u52A8" },
    // ---- 顶层（4 项）----
    { path: "listen", label: "\u76D1\u542C\u5730\u5740", type: "string", default: ":7863", restart: true, note: "assembly \u671F\u6355\u83B7\uFF0C\u5FC5\u987B\u91CD\u542F" },
    { path: "api_key", label: "API key", type: "string", default: "", restart: true, danger: true, note: "\u6539\u52A8\u540E\u672C\u9762\u677F\u81EA\u8EAB\u4F1A\u5931\u8054\uFF0C\u9700\u540C\u6B65\u66F4\u65B0\u63D2\u4EF6\u8BBE\u7F6E" },
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
var SCHOOL_SUBTASKS = [
  { code: "share_invite", label: "\u5206\u4EAB\u6D3B\u52A8\u7ED9\u597D\u53CB", manual: false },
  { code: "chat_3_times", label: "\u4E0E AI \u5BF9\u8BDD 3 \u6B21", manual: false },
  { code: "desktop_chat_1_time", label: "\u684C\u9762\u7AEF\u5BF9\u8BDD 1 \u6B21", manual: false },
  { code: "expert_use", label: "\u53EC\u5524\u5F00\u5B66\u5B63\u4E13\u5BB6\u5E76\u5BF9\u8BDD", manual: false },
  { code: "task_student_verify", label: "\u5FAE\u4FE1\u5B66\u751F\u8BA4\u8BC1", manual: true }
];
var SCHOOL_SHARED_CODES = SCHOOL_SUBTASKS.filter((task) => !task.manual).map((task) => task.code);
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
  if (day > 0) parts.push(`${day}d`);
  if (hour > 0) parts.push(`${hour}h`);
  if (minute > 0 && day === 0) parts.push(`${minute}m`);
  if (parts.length === 0) parts.push(`${second}s`);
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
    { label: "\u603B\u8D26\u53F7", value: status?.total ?? 0, tone: "idle" },
    { label: "\u5065\u5EB7", value: status?.healthy ?? 0, tone: "ok" },
    { label: "\u51B7\u5374\u4E2D", value: status?.cooling ?? 0, tone: "warn" },
    { label: "\u5728\u9014\u5360\u6EE1", value: status?.in_flight_full ?? 0, tone: "warn" },
    { label: "\u7C98\u6027\u4F1A\u8BDD", value: typeof sticky === "number" ? sticky : "\u2014", tone: "info" }
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
var INTUITION_FACTS = {
  batchIndependent: "\u8FD9\u4E9B\u6309\u94AE\u5404\u81EA\u72EC\u7ACB\uFF0C\u4E92\u4E0D\u8054\u52A8 \u2014\u2014 \u70B9\u300C\u5168\u91CF\u7B7E\u5230\u300D\u53EA\u8DD1\u7B7E\u5230\uFF0C\u4E0D\u4F1A\u987A\u5E26\u89E6\u53D1\u5176\u4ED6\u4EFB\u52A1\u3002\u6210\u957F\u4EFB\u52A1\u9700\u5355\u72EC\u70B9\u300C\u5168\u90E8\u70B9\u4EAE\u300D\u3002",
  scheduledCoverage: () => `24 \u4E2A\u6210\u957F\u7801\u91CC\u53EA\u6709 2 \u4E2A\u6709\u5B9A\u65F6\u8986\u76D6\uFF08chat_5 \u8D70\u6D3B\u8DC3\u5730\u56FE\u3001black_cat \u8D70\u591C\u732B\u5B50\uFF09\uFF0C\u5176\u4F59 ${codeCoverage().unscheduled} \u4E2A\u6CA1\u6709\u4EFB\u4F55\u5B9A\u65F6\u5165\u53E3\uFF0C\u53EA\u80FD\u624B\u52A8\u89E6\u53D1\u3002`,
  schoolSeason: () => `\u5F00\u5B66\u5B63 = 5 \u4E2A\u5B50\u4EFB\u52A1\uFF1A\u524D 4 \u4E2A\u53EF\u81EA\u52A8\u6267\u884C\uFF0C\u7B2C 5 \u4E2A\uFF08\u5FAE\u4FE1\u5B66\u751F\u8BA4\u8BC1\uFF09\u662F\u4EBA\u5DE5\u9879\u3002\u5176\u4E2D 4 \u4E2A\u4E0E task_runner.py \u7684\u6210\u957F\u7801\u662F\u540C\u4E00\u6279 \u2014\u2014 \u4E24\u5957\u6267\u884C\u5668\u5171\u7528\uFF0C\u8DD1\u4EFB\u4E00\u8FB9\u63A8\u8FDB\u540C\u4E00\u8FDB\u5EA6\u3002`
};

// client/index.js
var CHANNEL = "/dsh-chanhub";
var name = "dsh-chanhub";
var inject = ["slots", "connection"];
var ENDPOINTS = {
  getStatus: "getStatus",
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
  accountDisable: "accountDisable",
  accountEnable: "accountEnable",
  accountRevive: "accountRevive",
  serviceControl: "serviceControl"
};
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
var USAGE_WINDOWS = [
  { value: "24h", label: "24 \u5C0F\u65F6" },
  { value: "72h", label: "3 \u5929" },
  { value: "168h", label: "7 \u5929" },
  { value: "720h", label: "30 \u5929" }
];
var TABS = [
  { id: "accounts", label: "\u8D26\u53F7\u6C60", icon: "chart" },
  { id: "tasks", label: "\u4EFB\u52A1", icon: "check" },
  { id: "usage", label: "\u7528\u91CF", icon: "trend" },
  { id: "logs", label: "\u65E5\u5FD7", icon: "list" },
  { id: "config", label: "\u914D\u7F6E", icon: "gear" }
];
var svg = (props, ...children) => React.createElement(
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
  gateway: (props) => svg(
    { width: 18, height: 18, ...props },
    React.createElement("circle", { key: "c", cx: 12, cy: 12, r: 9 }),
    React.createElement("path", { key: "a", d: "M3 12h18" }),
    React.createElement("path", { key: "b", d: "M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z" })
  ),
  chart: (props) => svg(
    props,
    React.createElement("path", { key: "a", d: "M3 20h18" }),
    React.createElement("rect", { key: "b", x: 4, y: 10, width: 4, height: 8, rx: 1 }),
    React.createElement("rect", { key: "c", x: 10, y: 5, width: 4, height: 13, rx: 1 }),
    React.createElement("rect", { key: "d", x: 16, y: 13, width: 4, height: 5, rx: 1 })
  ),
  check: (props) => svg(props, React.createElement("path", { d: "M20 6L9 17l-5-5" })),
  trend: (props) => svg(
    props,
    React.createElement("path", { key: "a", d: "M3 17l6-6 4 4 8-8" }),
    React.createElement("path", { key: "b", d: "M15 7h6v6" })
  ),
  list: (props) => svg(props, React.createElement("path", { d: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" })),
  gear: (props) => svg(
    props,
    React.createElement("circle", { key: "c", cx: 12, cy: 12, r: 3 }),
    React.createElement("path", {
      key: "p",
      d: "M12 2l1.6 1.2 2-.2.8 1.9 1.8.9-.3 2 1.2 1.7-1.2 1.7.3 2-1.8.9-.8 1.9-2-.2L12 22l-1.6-1.2-2 .2-.8-1.9-1.8-.9.3-2L4.9 12l1.2-1.7-.3-2 1.8-.9.8-1.9 2 .2z"
    })
  ),
  refresh: (props) => svg(
    { width: 13, height: 13, ...props },
    React.createElement("path", { key: "a", d: "M21 12a9 9 0 1 1-3-6.7" }),
    React.createElement("path", { key: "b", d: "M21 3v6h-6" })
  )
};
function Tag({ text, tone: toneName = "idle", title }) {
  const palette = tone[toneName] ?? tone.idle;
  return React.createElement(
    "span",
    {
      style: { ...s.tag, background: palette.bg, color: palette.fg },
      ...title === void 0 ? {} : { title }
    },
    text
  );
}
function Unavailable({ title, needs, hint }) {
  return React.createElement(
    "div",
    { style: { ...s.card, borderStyle: "dashed" } },
    React.createElement(
      "div",
      { style: { ...s.label, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
      title,
      React.createElement(Tag, { text: "\u7F51\u5173\u672A\u63D0\u4F9B", tone: "warn" })
    ),
    React.createElement(
      "div",
      { style: { ...s.muted, marginTop: 8, lineHeight: 1.7 } },
      "\u5F53\u524D\u7F51\u5173\uFF08plugins/chanhub\uFF09\u6CA1\u6709\u66B4\u9732\u6B64\u89C6\u56FE\u6240\u9700\u7684\u6570\u636E\u7AEF\u70B9\uFF0C\u56E0\u6B64\u8FD9\u91CC\u4E0D\u663E\u793A\u4EFB\u4F55\u63A8\u65AD\u503C\u3002"
    ),
    needs ? React.createElement(
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
    hint ? React.createElement("div", { style: { ...s.muted, marginTop: 8 } }, hint) : null
  );
}
function Fold({ summary, children, open = false, id }) {
  return React.createElement(
    "details",
    { className: "dshc-fold", ...open ? { open: true } : {}, ...id ? { "data-fold": id } : {} },
    React.createElement("summary", null, summary),
    React.createElement("div", { className: "dshc-body" }, children)
  );
}
function OverviewCard({ status, channelOf, onRefresh, refreshing }) {
  const counters = summaryCounters(status);
  const realms = realmAvailability(status?.realm_totals);
  const grouped = groupByChannel(status?.accounts ?? [], channelOf);
  const maxRealm = Math.max(1, ...realms.map((realm) => realm.total));
  return React.createElement(
    "div",
    { style: s.card },
    React.createElement(
      "div",
      { className: "dshc-row", style: { justifyContent: "space-between" } },
      React.createElement(
        "div",
        { style: { ...s.label, display: "flex", alignItems: "center", gap: 8 } },
        React.createElement(Icons.chart, { style: { width: 16, height: 16 } }),
        "\u6982\u89C8"
      ),
      React.createElement(
        "div",
        { className: "dshc-row" },
        React.createElement(
          "span",
          { style: s.muted },
          `${status?.healthy ?? 0} \u53EF\u7528 \xB7 ${formatNumber(grouped.total)} \u79EF\u5206`
        ),
        React.createElement(
          "button",
          { type: "button", style: s.btnLink, onClick: onRefresh, disabled: refreshing },
          React.createElement(Icons.refresh, null),
          refreshing ? "\u5237\u65B0\u4E2D" : "\u5237\u65B0"
        )
      )
    ),
    // 五联
    React.createElement(
      "div",
      { className: "dshc-five", style: { marginTop: 12 } },
      ...counters.map(
        (counter) => React.createElement(
          "div",
          {
            key: counter.label,
            style: {
              background: "var(--dsw-alias-bg-layer-1,#fff)",
              border: "1px solid var(--dsw-alias-border-l2,#e5e7eb)",
              borderRadius: 8,
              padding: "8px 10px",
              minWidth: 0
            }
          },
          React.createElement("div", { style: { ...s.muted, fontSize: 11 } }, counter.label),
          React.createElement(
            "div",
            { style: { fontSize: 18, fontWeight: 600, color: (tone[counter.tone] ?? tone.idle).fg } },
            String(counter.value)
          )
        )
      )
    ),
    // 域可用性条（realm_totals 是 chanhub 独有字段）
    realms.length > 0 ? React.createElement(
      "div",
      { style: { marginTop: 12 } },
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
    ) : null,
    // 总积分 / 渠道（竖排三行并排，center 对齐）
    React.createElement(
      "div",
      { style: s.block },
      React.createElement(
        "div",
        { className: "dshc-totalrow" },
        React.createElement(
          "div",
          null,
          React.createElement("div", { style: { ...s.muted, fontSize: 11 } }, "\u603B\u79EF\u5206\uFF08\u53EF\u6D88\u8017\uFF09"),
          React.createElement(
            "div",
            { style: { fontSize: 24, fontWeight: 700, color: tone.ok.fg, lineHeight: 1.2 } },
            formatNumber(grouped.total)
          )
        ),
        React.createElement(
          "div",
          { className: "dshc-channels" },
          ...grouped.channels.map(
            (channel) => React.createElement(
              "div",
              { key: channel.id, className: "dshc-chan" },
              React.createElement("div", { style: { ...s.muted, fontSize: 10.5 } }, channel.label),
              React.createElement(
                "div",
                { style: { fontSize: 15, fontWeight: 600, color: "var(--dsw-alias-label-primary,currentColor)" } },
                formatNumber(channel.credits)
              ),
              React.createElement("div", { style: { ...s.muted, fontSize: 10.5 } }, `${channel.count} \u53F7`)
            )
          )
        )
      ),
      React.createElement(
        "div",
        { style: { ...s.muted, marginTop: 8 } },
        `\u4E0A\u6E38\u4E0B\u53D1\u603B\u989D ${formatNumber(grouped.creditsTotal)}\uFF1B\u5176\u4E2D\u4E0D\u53EF\u6D88\u8017\u90E8\u5206\u4E0D\u8BA1\u5165\u4E0A\u65B9\u603B\u6570`,
        "\uFF08Trae \u7684 ep=1 \u4E13\u7528\u6C60\u6DF7\u7B97\u4F1A\u5BFC\u81F4\u6309\u865A\u9AD8\u4F59\u989D\u9009\u53F7\uFF09\u3002"
      )
    )
  );
}
function AccountFold({ account, maxInFlight, channel, onAction, busy, credits, scheduleConfig }) {
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
    { summary },
    // 四组折叠：健康 / 质量 / 积分 / 任务。收起时也要能判断状态（摘要带关键数据）。
    React.createElement(
      Fold,
      { summary: React.createElement(
        "span",
        { className: "dshc-row", style: { minWidth: 0 } },
        React.createElement("span", { style: s.label }, "\u5065\u5EB7"),
        React.createElement("span", { style: s.muted }, healthSummary(account, state))
      ) },
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
        )
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
      ) },
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
      ) },
      React.createElement(
        "div",
        { className: "dshc-grid" },
        ...accountRow("\u53EF\u6D88\u8017\u79EF\u5206", formatNumber(account.credits ?? 0)),
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
function channelLabel(channel) {
  return { workbuddy: "WB", traework: "Trae", qoder: "Qoder" }[channel] ?? "";
}
function formatAbsolute(iso) {
  const value = Date.parse(iso);
  if (!Number.isFinite(value) || value <= 0) return "\u2014";
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
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
function formatLatency(value) {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(1)} tok/s` : "\u2014";
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
function AccountsTab({ status, channelOf, maxInFlight, onAction, busy, onRefresh, refreshing, error, creditsByUid, scheduleConfig, onRunTask, runningName, taskData }) {
  const [filter, setFilter] = React.useState("all");
  const accounts = status?.accounts ?? [];
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
  const taskList = Array.isArray(taskData?.tasks?.tasks) ? taskData.tasks.tasks : [];
  const byName = new Map(taskList.map((task) => [task.task, task]));
  const tasksUnavailable = taskData && taskData.available === false;
  const batchActions = [
    { id: "checkin", label: "\u{1F4C5} \u5168\u91CF\u7B7E\u5230" },
    { id: "balance", label: "\u{1F4B0} \u67E5\u4F59\u989D" },
    { id: "keepalive", label: "\u{1F511} token \u4FDD\u6D3B" },
    { id: "travel", label: "\u{1F431} \u732B\u732B\u65C5\u884C" },
    { id: "activity", label: "\u{1F5FA} \u6D3B\u8DC3\u4E0A\u62A5" }
  ];
  return React.createElement(
    "div",
    null,
    error ? React.createElement("div", { style: { ...s.err, marginBottom: 14 } }, error) : null,
    React.createElement(OverviewCard, { status, channelOf, onRefresh, refreshing }),
    // 批量动作条（置顶，在筛选条上方；ui-design §2 排版要求）
    React.createElement(
      "div",
      { style: s.card },
      React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "\u6279\u91CF\u52A8\u4F5C"),
      tasksUnavailable ? React.createElement(
        "div",
        { className: "dshc-row" },
        React.createElement("span", { style: { ...s.tag, background: tone.warn.bg, color: tone.warn.fg } }, "\u7F51\u5173\u672A\u5F00\u542F"),
        React.createElement(
          "span",
          { style: s.muted },
          "\u4EFB\u52A1\u7AEF\u70B9\u5728\u7F51\u5173 admin.enabled \u95E8\u69DB\u5185\uFF1B\u5F00\u542F\u540E\u8FD9\u91CC\u53EF\u6279\u91CF\u89E6\u53D1\u3002"
        )
      ) : React.createElement(
        "div",
        { className: "dshc-row" },
        React.createElement("span", { style: { ...s.tag, background: tone.ok.bg, color: tone.ok.fg } }, "\u7F51\u5173\u4EFB\u52A1\u7AEF\u70B9"),
        React.createElement("span", { style: s.muted }, "\u89E6\u53D1\u540E\u5F02\u6B65\u6267\u884C\uFF1B\u9010\u53F7\u7ED3\u679C\u89C1\u300C\u4EFB\u52A1\u300DTab \u6216\u70B9\u300C\u5237\u65B0\u72B6\u6001\u300D\u3002")
      ),
      React.createElement(
        "div",
        { className: "dshc-row", style: { marginTop: 10 } },
        ...batchActions.map((action) => {
          const state = byName.get(action.id);
          const isRunning = runningName === action.id || state?.running === true;
          return React.createElement(
            "button",
            {
              key: action.id,
              type: "button",
              style: { ...s.btnGhost, opacity: isRunning ? 0.5 : 1 },
              disabled: tasksUnavailable || isRunning,
              onClick: () => onRunTask(action.id),
              title: state?.last_end ? `\u4E0A\u6B21\u6267\u884C\uFF1A${relativeTime(state.last_end)}` : "\u5C1A\u672A\u6267\u884C\u8FC7"
            },
            `${action.label}${isRunning ? " \xB7 \u8FD0\u884C\u4E2D" : ""}`
          );
        })
      ),
      React.createElement("div", { style: { ...s.warn, marginTop: 12 } }, INTUITION_FACTS.batchIndependent)
    ),
    // 渠道 / 域筛选
    React.createElement(
      "div",
      { style: s.card },
      React.createElement(
        "div",
        { className: "dshc-row" },
        React.createElement("span", { style: { ...s.muted, marginRight: 4 } }, "\u6E20\u9053"),
        segmentButton("all", "\u5168\u90E8", filter, setFilter, accounts.length),
        ...CHANNEL_ORDER.filter((id) => (counts.get(id) ?? 0) > 0).map(
          (id) => segmentButton(id, channelLabel(id), filter, setFilter, counts.get(id) ?? 0)
        )
      ),
      // 账号折叠面板
      React.createElement(
        "div",
        { style: s.block },
        filtered.length === 0 ? React.createElement("div", { style: s.muted }, "\u8BE5\u7B5B\u9009\u4E0B\u6CA1\u6709\u8D26\u53F7\u3002") : React.createElement(
          "div",
          null,
          ...filtered.map(
            (account) => React.createElement(AccountFold, {
              key: account.uid,
              account,
              maxInFlight,
              channel: channelOf(account),
              onAction,
              busy: Boolean(busy?.[account.uid]),
              credits: creditsByUid?.[account.uid],
              scheduleConfig
            })
          )
        )
      )
    )
  );
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
function TasksTab({ status, channelOf, maxInFlight, taskData, growthData, schoolData, onRunTask, runningName, onRefresh, scheduleConfig }) {
  const accounts = status?.accounts ?? [];
  const taskList = Array.isArray(taskData?.tasks?.tasks) ? taskData.tasks.tasks : [];
  const byName = new Map(taskList.map((task) => [task.task, task]));
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
    // 批量动作区（真实可用）
    React.createElement(
      "div",
      { style: s.card },
      React.createElement(
        "div",
        { className: "dshc-row", style: { justifyContent: "space-between" } },
        React.createElement("div", { style: { ...s.label } }, "\u6279\u91CF\u4EFB\u52A1"),
        React.createElement(
          "button",
          { type: "button", style: s.btnLink, onClick: onRefresh },
          React.createElement(Icons.refresh, null),
          "\u5237\u65B0\u72B6\u6001"
        )
      ),
      React.createElement(
        "div",
        { className: "dshc-row", style: { marginTop: 10 } },
        ...TASK_DEFS.map((task) => {
          const state = byName.get(task.name);
          const busy = runningName === task.name || state?.running === true;
          return React.createElement(
            "button",
            {
              key: task.name,
              type: "button",
              style: { ...s.btnGhost, opacity: busy ? 0.5 : 1 },
              disabled: busy,
              onClick: () => onRunTask(task.name),
              title: state?.last_end ? `\u4E0A\u6B21\u6267\u884C\uFF1A${relativeTime(state.last_end)}` : "\u5C1A\u672A\u6267\u884C\u8FC7"
            },
            `${task.icon} ${task.label}`,
            busy ? " \xB7 \u8FD0\u884C\u4E2D" : ""
          );
        })
      ),
      React.createElement("div", { style: { ...s.warn, marginTop: 12 } }, INTUITION_FACTS.batchIndependent),
      React.createElement(
        "div",
        { style: { ...s.muted, marginTop: 8 } },
        "\u4EFB\u52A1\u5728\u7F51\u5173\u4FA7\u5F02\u6B65\u6267\u884C\uFF08\u811A\u672C\u7C7B\u4EFB\u52A1\u53EF\u80FD\u8DD1\u6570\u5206\u949F\uFF09\uFF1B\u6B64\u5904\u663E\u793A\u7684\u662F\u542F\u52A8\u56DE\u6267\uFF0C\u7ED3\u679C\u7ECF\u300C\u5237\u65B0\u72B6\u6001\u300D\u67E5\u770B\u3002"
      )
    ),
    // 执行状态（含签到的逐账号结构化结果）
    React.createElement(
      "div",
      { style: s.card },
      React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "\u4EFB\u52A1\u72B6\u6001"),
      React.createElement(
        "div",
        { className: "dshc-row", style: { marginBottom: 8 } },
        ...TASK_DEFS.map((task) => {
          const state = byName.get(task.name);
          const glyph = state?.running ? "\u25CF" : state?.run_count > 0 ? "\u2713" : "\xB7";
          const cls = state?.running ? "dshc-dp run" : state?.run_count > 0 ? "dshc-dp ok" : "dshc-dp wait";
          return React.createElement("span", {
            key: task.name,
            className: cls,
            title: `${task.label}\uFF1A${state ? `\u5DF2\u6267\u884C ${state.run_count} \u6B21` : "\u5C1A\u672A\u6267\u884C"}`
          }, glyph);
        }),
        React.createElement(
          "span",
          { style: { ...s.muted, marginLeft: 6 } },
          `${[...byName.values()].filter((t) => t.run_count > 0).length} / ${TASK_DEFS.length} \u9879\u6267\u884C\u8FC7`
        )
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
              ...["\u4EFB\u52A1", "\u72B6\u6001", "\u6B21\u6570", "\u4E0A\u6B21\u5F00\u59CB", "\u8017\u65F6", "\u9519\u8BEF"].map(
                (h) => React.createElement("th", { key: h }, h)
              )
            )
          ),
          React.createElement(
            "tbody",
            null,
            ...TASK_DEFS.map((task) => {
              const state = byName.get(task.name);
              return React.createElement(
                "tr",
                { key: task.name },
                React.createElement("td", null, `${task.icon} ${task.label}`),
                React.createElement(
                  "td",
                  null,
                  React.createElement(Tag, {
                    text: state?.running ? "\u8FD0\u884C\u4E2D" : state?.run_count > 0 ? "\u5DF2\u6267\u884C" : "\u672A\u6267\u884C",
                    tone: state?.running ? "info" : state?.run_count > 0 ? "ok" : "idle"
                  })
                ),
                React.createElement("td", null, String(state?.run_count ?? 0)),
                React.createElement("td", null, state?.last_start ? relativeTime(state.last_start) : "\u2014"),
                React.createElement(
                  "td",
                  null,
                  typeof state?.duration_sec === "number" ? `${state.duration_sec.toFixed(1)}s` : "\u2014"
                ),
                React.createElement(
                  "td",
                  null,
                  state?.last_error ? React.createElement("span", { style: { color: tone.err.fg } }, state.last_error.slice(0, 60)) : "\u2014"
                )
              );
            })
          )
        )
      )
    ),
    // 签到的逐账号结果（chanhub 比 panel 强的一点：结构化结果可查）
    React.createElement(CheckinOutcomesCard, { task: byName.get("checkin") }),
    // 开学季（真实子任务状态：来自网关 GET /v1/accounts/{uid}/school-tasks）
    React.createElement(SchoolTasksCard, {
      schoolData: schoolForAccount(schoolData, accounts),
      accountCount: (accounts || []).length,
      running: runningName === "school",
      onRunTask
    }),
    // 成长任务进度（真实数据：来自网关 GET /v1/accounts/{uid}/growth-tasks）
    React.createElement(GrowthTasksCard, {
      growthData: growthForAccount(growthData, accounts),
      accountCount: (accounts || []).length,
      onRefresh
    }),
    // 按账号（保留主轴结构）
    React.createElement(
      "div",
      { style: s.card },
      React.createElement("div", { style: { ...s.label, marginBottom: 10 } }, "\u6309\u8D26\u53F7\u67E5\u770B"),
      accounts.length === 0 ? React.createElement("div", { style: s.muted }, "\u6682\u65E0\u8D26\u53F7\u3002") : React.createElement(
        "div",
        null,
        ...accounts.map(
          (account) => React.createElement(AccountFold, {
            key: account.uid,
            account,
            maxInFlight,
            channel: channelOf(account),
            onAction: () => {
            },
            busy: false,
            scheduleConfig
          })
        )
      )
    )
  );
}
function schoolForAccount(schoolByUid, accounts) {
  for (const account of accounts ?? []) {
    const entry = schoolByUid?.[account.uid];
    if (entry && entry.available === true) return entry;
  }
  for (const account of accounts ?? []) {
    const entry = schoolByUid?.[account.uid];
    if (entry) return entry;
  }
  return void 0;
}
var SCHOOL_STATUS = {
  claimed: { text: "\u5DF2\u9886\u53D6", tone: "ok" },
  completed: { text: "\u5DF2\u5B8C\u6210", tone: "ok" },
  pending: { text: "\u5F85\u5B8C\u6210", tone: "warn" }
};
function SchoolTasksCard({ schoolData, accountCount, running, onRunTask }) {
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
      React.createElement("div", { style: s.label }, "\u5F00\u5B66\u5B63\u5B50\u4EFB\u52A1\u72B6\u6001"),
      React.createElement("div", { style: { ...s.muted, marginTop: 8 } }, "\u52A0\u8F7D\u4E2D\u2026")
    );
  }
  const data = schoolData.school;
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const counts = data.counts ?? {};
  return React.createElement(
    "div",
    { style: s.card },
    React.createElement(
      "div",
      { className: "dshc-row", style: { justifyContent: "space-between" } },
      React.createElement("div", { style: { ...s.label } }, "\u{1F393} \u5F00\u5B66\u5B63"),
      React.createElement(
        "div",
        { className: "dshc-row" },
        React.createElement(Tag, {
          text: data.in_period ? "\u6D3B\u52A8\u8FDB\u884C\u4E2D" : "\u6D3B\u52A8\u672A\u5F00\u59CB/\u5DF2\u7ED3\u675F",
          tone: data.in_period ? "ok" : "warn",
          title: data.in_period ? void 0 : "in_period=false\uFF1A\u4EE5\u4E0B\u72B6\u6001\u4E3A\u8FC7\u671F\u5FEB\u7167\uFF0C\u4E0D\u4EE3\u8868\u5F53\u524D\u53EF\u64CD\u4F5C"
        }),
        React.createElement(Tag, { text: `\u5DF2\u9886 ${counts.claimed ?? 0}/${counts.total ?? tasks.length}`, tone: "ok" }),
        accountCount > 1 ? React.createElement(Tag, { text: `\u5F53\u524D\u663E\u793A\u7B2C 1 \u4E2A\u8D26\u53F7\uFF08\u5171 ${accountCount} \u4E2A\uFF09`, tone: "idle" }) : null
      )
    ),
    React.createElement("div", { style: { ...s.tip, marginTop: 8, marginBottom: 10 } }, INTUITION_FACTS.schoolSeason()),
    tasks.length === 0 ? React.createElement("div", { style: s.muted }, "\u7F51\u5173\u672A\u8FD4\u56DE\u5B50\u4EFB\u52A1\u3002") : React.createElement(
      "div",
      { className: "dshc-sub" },
      ...tasks.map((task) => {
        const status = SCHOOL_STATUS[task.status] ?? { text: task.status ?? "\u2014", tone: "idle" };
        const done = ["claimed", "completed"].includes(task.status);
        const recurring = task.task_type === "recurring";
        const manual = task.task_code === "task_student_verify";
        return React.createElement(
          "div",
          { key: task.task_code, className: "dshc-row", style: { marginBottom: 5 } },
          React.createElement("span", {
            className: done ? "dshc-ck on" : manual ? "dshc-ck na" : "dshc-ck",
            title: done ? "\u5DF2\u9886\u53D6" : manual ? "\u4EBA\u5DE5\u9879\uFF08\u7F51\u5173\u4E0D\u53EF\u4EE3\u505A\uFF09" : status.text
          }, done ? "\u2713" : manual ? "\u2014" : "\u25CB"),
          React.createElement(
            "span",
            { style: { ...s.label, minWidth: 0, flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
            task.title || task.task_code
          ),
          React.createElement("span", { style: { ...s.code, minWidth: 160 } }, task.task_code),
          task.has_progress ? React.createElement("span", { style: { ...s.code, minWidth: 44, textAlign: "right" } }, `${task.current}/${task.target}`) : React.createElement("span", { style: { ...s.code, minWidth: 44, textAlign: "right" } }, "\u2014"),
          React.createElement(Tag, { text: status.text, tone: status.tone }),
          manual ? React.createElement(Tag, { text: "\u4EBA\u5DE5\u9879", tone: "idle" }) : null,
          recurring ? React.createElement(Tag, { text: "\u6BCF\u65E5", tone: "info" }) : null
        );
      })
    ),
    // recurring 任务的重置提示（已领但每日可再做）
    tasks.some((task) => task.task_type === "recurring" && ["claimed", "completed"].includes(task.status) && task.next_unlock_at) ? React.createElement(
      "div",
      { style: { ...s.tip, marginTop: 10, lineHeight: 1.7 } },
      "\u6807\u300C\u6BCF\u65E5\u300D\u7684\u4EFB\u52A1\u6BCF\u5929\u53EF\u5B8C\u6210\u4E00\u6B21\uFF1A\u4E0A\u9762\u663E\u793A\u7684\u662F**\u4ECA\u65E5**\u72B6\u6001\uFF0C\u660E\u65E5 00:00 \u91CD\u7F6E\u540E\u53EF\u518D\u505A",
      "\uFF08\u811A\u672C /admin/tasks/school \u4F1A\u81EA\u52A8\u8865\u505A\uFF09\u3002"
    ) : null,
    React.createElement(
      "div",
      { style: s.block },
      React.createElement(
        "button",
        {
          type: "button",
          style: { ...s.btnGhost, opacity: running ? 0.5 : 1 },
          disabled: running,
          onClick: () => onRunTask("school")
        },
        running ? "\u{1F393} \u6267\u884C\u4E2D\u2026" : "\u{1F393} \u6267\u884C\u5F00\u5B66\u5B63"
      ),
      React.createElement(
        "span",
        { style: { ...s.muted, marginLeft: 10 } },
        "\u811A\u672C\u6574\u4F53\u6267\u884C\uFF08\u70B9\u4EAE + \u9886\u5956 + \u62BD\u5956\uFF09\uFF0C\u6267\u884C\u540E\u5237\u65B0\u53EF\u89C1\u9010\u9879\u72B6\u6001\u53D8\u5316\u3002"
      )
    ),
    React.createElement("div", { style: { ...s.muted, marginTop: 8, lineHeight: 1.7 } }, data.note ?? "")
  );
}
function growthForAccount(growthByUid, accounts) {
  for (const account of accounts ?? []) {
    const entry = growthByUid?.[account.uid];
    if (entry && entry.available === true) return entry;
  }
  for (const account of accounts ?? []) {
    const entry = growthByUid?.[account.uid];
    if (entry) return entry;
  }
  return void 0;
}
function GrowthTasksCard({ growthData, accountCount, onRefresh }) {
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
      React.createElement("div", { style: s.label }, "\u6210\u957F\u4EFB\u52A1\u8FDB\u5EA6"),
      React.createElement("div", { style: { ...s.muted, marginTop: 8 } }, "\u52A0\u8F7D\u4E2D\u2026")
    );
  }
  const data = growthData.growth;
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  if (tasks.length === 0) {
    return React.createElement(
      "div",
      { style: s.card },
      React.createElement("div", { style: s.label }, "\u6210\u957F\u4EFB\u52A1\u8FDB\u5EA6"),
      React.createElement(
        "div",
        { style: { ...s.muted, marginTop: 8 } },
        "\u7F51\u5173\u672A\u8FD4\u56DE\u4EFB\u4F55\u4EFB\u52A1\uFF08\u8D26\u53F7\u53EF\u80FD\u65E0\u6210\u957F\u4EFB\u52A1\u8D44\u683C\uFF09\u3002"
      )
    );
  }
  const active = tasks.filter((t) => t.has_progress && !["completed", "claimed"].includes(t.accept_status) && t.current < (t.target || 1));
  const done = tasks.filter((t) => ["completed", "claimed"].includes(t.accept_status));
  const noProgress = tasks.filter((t) => !t.has_progress);
  const others = tasks.filter((t) => t.has_progress && !["completed", "claimed"].includes(t.accept_status) && t.current >= (t.target || 1));
  const statusTone = { claimed: "ok", completed: "ok", accepted: "info", in_progress: "info", not_accepted: "idle" };
  const statusLabel = {
    claimed: "\u5DF2\u9886\u53D6",
    completed: "\u5DF2\u5B8C\u6210",
    accepted: "\u8FDB\u884C\u4E2D",
    in_progress: "\u8FDB\u884C\u4E2D",
    not_accepted: "\u672A\u63A5\u53D7"
  };
  const renderRow = (t) => {
    const progress = t.has_progress ? `${t.current}/${t.target}` : "\u2014";
    const full = t.has_progress && t.target > 0 && t.current >= t.target;
    return React.createElement(
      "div",
      { key: t.task_code, className: "dshc-row", style: { marginBottom: 5 } },
      // 左侧色条：进行中未满 = 橙（提示还有活干），已满/已领 = 绿
      React.createElement("span", {
        className: "dshc-codebar",
        style: { background: full || ["completed", "claimed"].includes(t.accept_status) ? tone.ok.fg : t.has_progress ? tone.warn.fg : "transparent" }
      }),
      React.createElement(
        "span",
        { style: { ...s.label, minWidth: 0, flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
        t.title || t.task_code
      ),
      React.createElement("span", { style: { ...s.code, minWidth: 84 } }, t.task_code),
      React.createElement("span", { style: { ...s.code, minWidth: 46, textAlign: "right" } }, progress),
      React.createElement(Tag, {
        text: statusLabel[t.accept_status] ?? t.accept_status ?? "\u2014",
        tone: statusTone[t.accept_status] ?? "idle"
      }),
      t.from_mp ? React.createElement(Tag, { text: "\u5C0F\u7A0B\u5E8F", tone: "info" }) : null,
      t.scheduled ? React.createElement(Tag, { text: `\u5B9A\u65F6\u2192${t.scheduled}`, tone: "info" }) : null,
      t.locked ? React.createElement(Tag, { text: "\u5DF2\u9501\u5B9A", tone: "warn" }) : null
    );
  };
  return React.createElement(
    "div",
    { style: s.card },
    React.createElement(
      "div",
      { className: "dshc-row", style: { justifyContent: "space-between" } },
      React.createElement("div", { style: { ...s.label } }, "\u6210\u957F\u4EFB\u52A1\u8FDB\u5EA6"),
      accountCount > 1 ? React.createElement(Tag, {
        text: `\u5F53\u524D\u663E\u793A\u7B2C 1 \u4E2A\u8D26\u53F7\uFF08\u5171 ${accountCount} \u4E2A\uFF09`,
        tone: "idle",
        title: "\u6210\u957F\u4EFB\u52A1\u8FDB\u5EA6\u662F\u9010\u8D26\u53F7\u7684\uFF1B\u5207\u6362\u8D26\u53F7\u9700\u5728\u8D26\u53F7\u6C60\u5C55\u5F00\u5BF9\u5E94\u8D26\u53F7\u3002\u591A\u8D26\u53F7\u7684\u8FDB\u5EA6\u53EF\u80FD\u4E0D\u540C\u3002"
      }) : null,
      React.createElement(
        "div",
        { className: "dshc-row" },
        React.createElement(Tag, { text: `\u5DF2\u5B8C\u6210 ${done.length}/${tasks.length}`, tone: "ok" }),
        active.length > 0 ? React.createElement(Tag, { text: `\u8FDB\u884C\u4E2D ${active.length}`, tone: "warn" }) : null,
        React.createElement("button", { type: "button", style: s.btnLink, onClick: onRefresh }, "\u5237\u65B0")
      )
    ),
    React.createElement(
      "div",
      { style: { ...s.muted, marginTop: 6 } },
      `\u6765\u6E90\uFF1A\u4E0A\u6E38\u6210\u957F\u4EFB\u52A1\u5217\u8868\uFF08\u7F51\u5173\u5DF2\u5408\u5E76\u9ED8\u8BA4\u4E0E\u5C0F\u7A0B\u5E8F\u4E24\u4E2A\u4E0B\u53D1\u53E3\u5F84${data.mp_error ? "\uFF1B\u5C0F\u7A0B\u5E8F\u53E3\u5F84\u67E5\u8BE2\u5931\u8D25\uFF1A" + data.mp_error : ""}\uFF09\u3002`,
      INTUITION_FACTS.scheduledCoverage()
    ),
    // 进行中未满（最值得看的）
    active.length > 0 ? React.createElement(
      "div",
      { style: s.block },
      React.createElement("div", { style: { ...s.label, marginBottom: 6 } }, `\u8FDB\u884C\u4E2D\u672A\u6EE1\uFF08${active.length}\uFF09`),
      ...active.map(renderRow)
    ) : null,
    // 已满但状态未推进（accepted 且进度已满 —— 通常点一次执行即可领）
    others.length > 0 ? React.createElement(
      "div",
      { style: s.block },
      React.createElement("div", { style: { ...s.label, marginBottom: 6 } }, `\u8FDB\u5EA6\u5DF2\u6EE1\uFF08${others.length}\uFF09`),
      ...others.map(renderRow)
    ) : null,
    // 无进度对象（公益提问等，无法代做）
    noProgress.length > 0 ? React.createElement(
      "div",
      { style: s.block },
      React.createElement("div", { style: { ...s.label, marginBottom: 6 } }, `\u65E0\u8FDB\u5EA6\u6570\u636E\uFF08${noProgress.length}\uFF09`),
      ...noProgress.map(renderRow),
      React.createElement(
        "div",
        { style: { ...s.muted, marginTop: 6 } },
        "\u8FD9\u4E9B\u4EFB\u52A1\u4E0A\u6E38\u4E0D\u4E0B\u53D1\u8FDB\u5EA6\u5BF9\u8C61\uFF08\u901A\u5E38\u662F\u4E0D\u53EF\u4EE3\u505A\u7684\u771F\u5B9E\u884C\u4E3A\uFF0C\u5982\u516C\u76CA\u6350\u6B3E\uFF09\u3002"
      )
    ) : null,
    // 已完成折叠
    done.length > 0 ? React.createElement(
      "details",
      { className: "dshc-fold", style: { marginTop: 8 } },
      React.createElement(
        "summary",
        null,
        React.createElement("span", { style: s.label }, `\u5DF2\u5B8C\u6210 / \u5DF2\u9886\u53D6\uFF08${done.length}\uFF09`),
        React.createElement("span", { style: { ...s.muted, marginLeft: "auto" } }, "\u70B9\u5F00\u67E5\u770B")
      ),
      React.createElement("div", { className: "dshc-body" }, ...done.map(renderRow))
    ) : null,
    React.createElement("div", { style: { ...s.muted, marginTop: 10, lineHeight: 1.7 } }, data.note ?? "")
  );
}
function CheckinOutcomesCard({ task }) {
  const outcomes = task?.outcomes;
  if (!Array.isArray(outcomes) || outcomes.length === 0) return null;
  const summary = task.outcome_summary ?? {};
  return React.createElement(
    "div",
    { style: s.card },
    React.createElement(
      "div",
      { className: "dshc-row", style: { justifyContent: "space-between" } },
      React.createElement("div", { style: s.label }, "\u7B7E\u5230\u9010\u8D26\u53F7\u7ED3\u679C"),
      React.createElement(
        "span",
        { style: s.muted },
        `${task.last_end ? relativeTime(task.last_end) : ""} \xB7 \u8017\u65F6 ${typeof task.duration_sec === "number" ? task.duration_sec.toFixed(1) : "\u2014"}s`
      )
    ),
    React.createElement(
      "div",
      { className: "dshc-row", style: { marginTop: 10 } },
      React.createElement(Tag, { text: `\u5171 ${summary.total ?? outcomes.length}`, tone: "idle" }),
      React.createElement(Tag, { text: `\u6210\u529F ${summary.ok ?? 0}`, tone: "ok" }),
      React.createElement(Tag, { text: `\u5DF2\u7B7E\u8FC7 ${summary.already ?? 0}`, tone: "info" }),
      React.createElement(Tag, { text: `\u5931\u8D25 ${summary.fail ?? 0}`, tone: (summary.fail ?? 0) > 0 ? "err" : "idle" }),
      React.createElement(Tag, { text: `\u8DF3\u8FC7 ${summary.skipped ?? 0}`, tone: "idle" })
    ),
    React.createElement(
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
            ...["\u8D26\u53F7", "\u7ED3\u679C", "\u7B7E\u5230\u540E\u4F59\u989D", "\u8BF4\u660E"].map((h) => React.createElement("th", { key: h }, h))
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
              React.createElement("td", null, typeof oc.credits === "number" ? formatNumber(oc.credits) : "\u2014"),
              React.createElement("td", null, oc.detail || "\u2014")
            )
          )
        )
      )
    )
  );
}
function UsageTab({ stats, usage, usageWindow, onWindowChange, onRefresh }) {
  const bucketsAvailable = usage?.available === true;
  const usageData = usage?.usage;
  return React.createElement(
    "div",
    null,
    React.createElement(
      "div",
      { style: s.card },
      React.createElement(
        "div",
        { className: "dshc-row", style: { justifyContent: "space-between" } },
        React.createElement("div", { style: s.label }, "\u65F6\u5E8F\u5206\u6876"),
        React.createElement(
          "div",
          { className: "dshc-row" },
          ...USAGE_WINDOWS.map(
            (option) => React.createElement(
              "button",
              {
                key: option.value,
                type: "button",
                onClick: () => onWindowChange(option.value),
                style: {
                  ...s.btnGhost,
                  height: 26,
                  padding: "0 10px",
                  fontSize: 12,
                  borderColor: usageWindow === option.value ? "var(--dsw-alias-brand-primary,#4f6ef7)" : void 0,
                  color: usageWindow === option.value ? "var(--dsw-alias-brand-primary,#4f6ef7)" : void 0
                }
              },
              option.label
            )
          ),
          React.createElement("button", { type: "button", style: s.btnLink, onClick: onRefresh }, "\u5237\u65B0")
        )
      ),
      !bucketsAvailable ? React.createElement(
        "div",
        { style: { ...s.tip, marginTop: 10 } },
        usage?.reason ?? "\u7F51\u5173\u672A\u63D0\u4F9B\u5206\u6876\u7AEF\u70B9\uFF0C\u9700\u5728\u7F51\u5173\u4FA7\u652F\u6301 GET /v1/stats/buckets\u3002"
      ) : React.createElement(UsageBucketBody, { usage: usageData })
    ),
    React.createElement(ModelStatsCard, { stats })
  );
}
function UsageBucketBody({ usage }) {
  if (!usage) {
    return React.createElement("div", { style: { ...s.muted, marginTop: 10 } }, "\u52A0\u8F7D\u4E2D\u2026");
  }
  const buckets = usage.buckets ?? [];
  const maxRequests = Math.max(1, ...buckets.map((bucket) => bucket.requests));
  return React.createElement(
    "div",
    { style: { marginTop: 12 } },
    // 降级提示必须如实显示
    usage.degraded ? React.createElement(
      "div",
      { style: { ...s.warn, marginBottom: 10 } },
      "\u26A0\uFE0F \u5206\u6876\u952E\u5DF2\u8D85\u51FA\u5BB9\u91CF\u4E0A\u9650\uFF0C\u7F51\u5173\u5DF2\u964D\u7EA7\u4E3A\u300C\u69FD \xD7 \u57DF\u300D\u4E24\u7EF4 \u2014\u2014 \u6309\u8D26\u53F7 / \u6309\u6A21\u578B\u4E24\u4E2A\u7EF4\u5EA6\u5C06\u4E0D\u518D\u7EC6\u5206\u3002"
    ) : null,
    // 合计
    React.createElement(
      "div",
      { className: "dshc-five", style: { marginBottom: 12 } },
      ...usageStat("\u603B\u8BF7\u6C42", usage.total?.requests ?? 0),
      ...usageStat("\u6210\u529F", usage.total?.success ?? 0),
      ...usageStat("\u5931\u8D25", usage.total?.failed ?? 0),
      ...usageStat("Prompt tokens", usage.total?.prompt_tokens ?? 0),
      ...usageStat("Completion tokens", usage.total?.completion_tokens ?? 0)
    ),
    // 时序柱
    buckets.length === 0 ? React.createElement(
      "div",
      { style: { ...s.muted, marginBottom: 12 } },
      "\u8BE5\u7A97\u53E3\u5185\u6CA1\u6709\u8BF7\u6C42\u8BB0\u5F55\u3002\u53D1\u8D77\u4E00\u6B21\u5BF9\u8BDD\u540E\u5373\u53EF\u770B\u5230\u5206\u6876\u3002"
    ) : React.createElement(
      "div",
      { style: { marginBottom: 14 } },
      React.createElement(
        "div",
        { style: { ...s.muted, marginBottom: 6 } },
        `\u5171 ${buckets.length} \u4E2A\u6876\uFF08\u7A97\u53E3 ${usage.window}\uFF09`
      ),
      React.createElement(
        "div",
        { className: "dshc-row", style: { alignItems: "flex-end", gap: 3, overflowX: "auto" } },
        ...buckets.slice(-48).map(
          (bucket, index) => React.createElement("span", {
            key: `${bucket.slot}-${bucket.uid}-${bucket.model}-${index}`,
            title: `${bucket.slot} \xB7 ${bucket.uid ? bucket.uid.slice(0, 8) : "\u5168\u90E8\u8D26\u53F7"} \xB7 ${bucket.model || "\u5168\u90E8\u6A21\u578B"}
\u8BF7\u6C42 ${bucket.requests} \xB7 \u5931\u8D25 ${bucket.failed} \xB7 tokens ${bucket.total_tokens}`,
            style: {
              width: 12,
              flexShrink: 0,
              height: Math.max(3, Math.round(bucket.requests / maxRequests * 60)),
              background: bucket.failed > 0 ? tone.warn.fg : tone.ok.fg,
              borderRadius: 2
            }
          })
        )
      )
    ),
    ...["ByUID", "ByRealm", "ByModel"].map((key) => {
      const label = { ByUID: "\u6309\u8D26\u53F7", ByRealm: "\u6309\u57DF", ByModel: "\u6309\u6A21\u578B" }[key];
      const rows = usage[`by_${key.slice(2).toLowerCase()}`] ?? usage[key.toLowerCase()] ?? [];
      return React.createElement(
        "div",
        { key, style: { marginBottom: 12 } },
        React.createElement("div", { style: { ...s.label, marginBottom: 6 } }, label),
        rows.length === 0 ? React.createElement("div", { style: s.muted }, "\u65E0\u6570\u636E") : React.createElement(
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
                ...["\u952E", "\u8BF7\u6C42", "\u6210\u529F", "\u5931\u8D25", "Prompt", "Completion", "\u5408\u8BA1", "\u6263\u8D39", "\u5E73\u5747\u5EF6\u8FDF"].map(
                  (h) => React.createElement("th", { key: h }, h)
                )
              )
            ),
            React.createElement(
              "tbody",
              null,
              ...rows.map(
                (row) => React.createElement(
                  "tr",
                  { key: row.key },
                  React.createElement("td", null, row.key),
                  React.createElement("td", null, formatNumber(row.requests ?? 0)),
                  React.createElement("td", null, formatNumber(row.success ?? 0)),
                  React.createElement("td", null, formatNumber(row.failed ?? 0)),
                  React.createElement("td", null, formatNumber(row.prompt_tokens ?? 0)),
                  React.createElement("td", null, formatNumber(row.completion_tokens ?? 0)),
                  React.createElement("td", null, formatNumber(row.total_tokens ?? 0)),
                  React.createElement("td", null, typeof row.credit === "number" ? row.credit.toFixed(4) : "\u2014"),
                  React.createElement("td", null, `${(row.avg_latency_ms ?? 0).toFixed(0)} ms`)
                )
              )
            )
          )
        )
      );
    }),
    React.createElement("div", { style: { ...s.muted, marginTop: 8, lineHeight: 1.7 } }, usage.note ?? "")
  );
}
function ModelStatsCard({ stats }) {
  if (!stats) {
    return React.createElement(Unavailable, {
      title: "\u5168\u5C40\u6309\u6A21\u578B\u7EDF\u8BA1",
      needs: "GET /v1/stats\uFF08\u672C\u7F51\u5173\u672A\u63D0\u4F9B\uFF09",
      hint: "\u8BE5\u7AEF\u70B9\u5728 chanhub \u4E2D\u5DF2\u5B9E\u73B0\uFF08\u4EC5\u6309\u6A21\u578B\u805A\u5408\u3001\u4EC5\u5185\u5B58\uFF09\u3002"
    });
  }
  const models = Array.isArray(stats.models) ? stats.models : [];
  return React.createElement(
    "div",
    { style: s.card },
    React.createElement(
      "div",
      { className: "dshc-row", style: { justifyContent: "space-between" } },
      React.createElement("div", { style: s.label }, "\u5168\u5C40\u6309\u6A21\u578B\u7EDF\u8BA1"),
      React.createElement(Tag, { text: `\u8FD0\u884C ${formatDuration(stats.uptime_sec)}`, tone: "idle" })
    ),
    models.length === 0 ? React.createElement("div", { style: { ...s.muted, marginTop: 10 } }, "\u6682\u65E0\u8BF7\u6C42\u8BB0\u5F55\u3002") : React.createElement(
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
            ...["\u6A21\u578B", "\u8BF7\u6C42", "\u6210\u529F", "\u5931\u8D25", "TTFB", "\u5EF6\u8FDF", "\u541E\u5410", "Prompt", "Completion", "\u7F13\u5B58\u547D\u4E2D", "\u6263\u8D39", "\u6700\u8FD1"].map(
              (h) => React.createElement("th", { key: h }, h)
            )
          )
        ),
        React.createElement(
          "tbody",
          null,
          ...models.map(
            (model) => React.createElement(
              "tr",
              { key: model.model },
              React.createElement("td", null, model.model),
              React.createElement("td", null, formatNumber(model.requests ?? 0)),
              React.createElement("td", null, formatNumber(model.success ?? 0)),
              React.createElement("td", null, formatNumber(model.failed ?? 0)),
              React.createElement("td", null, `${(model.avg_ttfb_ms ?? 0).toFixed(0)} ms`),
              React.createElement("td", null, `${(model.avg_latency_ms ?? 0).toFixed(0)} ms`),
              React.createElement("td", null, (model.tokens_per_sec ?? 0).toFixed(1)),
              React.createElement("td", null, formatNumber(model.prompt_tokens ?? 0)),
              React.createElement("td", null, formatNumber(model.completion_tokens ?? 0)),
              React.createElement("td", null, `${((model.cache_hit_rate ?? 0) * 100).toFixed(1)}%`),
              React.createElement("td", null, typeof model.credit === "number" ? model.credit.toFixed(4) : "\u2014"),
              React.createElement("td", null, relativeTime(model.last_seen))
            )
          )
        )
      )
    ),
    React.createElement(
      "div",
      { style: { ...s.muted, marginTop: 10, lineHeight: 1.7 } },
      "\u26A0\uFE0F \u8BE5\u8868\u7684\u4E24\u4E2A\u5C40\u9650\uFF1A**\u4EC5\u5185\u5B58**\uFF08\u8FDB\u7A0B\u91CD\u542F\u6E05\u96F6\uFF09\u3001**\u53EA\u6709\u6A21\u578B\u4E00\u7EF4**\uFF08\u65E0\u6CD5\u56DE\u7B54\u300C\u54EA\u4E2A\u8D26\u53F7\u7528\u4E86\u591A\u5C11\u300D\uFF09\u3002",
      "\u4E0A\u9762\u7684\u5206\u6876\u89C6\u56FE\u8865\u4E0A\u4E86\u8D26\u53F7 / \u57DF / \u65F6\u5E8F\u4E09\u4E2A\u7EF4\u5EA6\u3002"
    )
  );
}
function usageStat(label, value) {
  return [
    React.createElement(
      "div",
      {
        key: label,
        style: {
          background: "var(--dsw-alias-bg-layer-1,#fff)",
          border: "1px solid var(--dsw-alias-border-l2,#e5e7eb)",
          borderRadius: 8,
          padding: "8px 10px",
          minWidth: 0
        }
      },
      React.createElement("div", { style: { ...s.muted, fontSize: 11 } }, label),
      React.createElement("div", { style: { fontSize: 16, fontWeight: 600 } }, formatNumber(value))
    )
  ];
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
function ConfigTab({ configInfo, onSave, saving, onServiceControl, serviceControlResult, serviceBusy }) {
  const [draft, setDraft] = React.useState({});
  const groups = React.useMemo(() => fieldsByGroup(), []);
  const config = configInfo?.config ?? {};
  const editable = Boolean(configInfo?.ok && configInfo?.writable);
  const setField = (path, value) => setDraft((prev) => ({ ...prev, [path]: value }));
  const dirty = Object.keys(draft);
  const validation = React.useMemo(() => {
    const errors = {};
    const restart = /* @__PURE__ */ new Set();
    const byPath = /* @__PURE__ */ new Map();
    for (const group of groups) for (const field of group.fields) byPath.set(field.path, field);
    for (const [path, raw] of Object.entries(draft)) {
      const field = byPath.get(path);
      if (!field) continue;
      const result = coerceField(field, raw);
      if (!result.ok) errors[path] = result.message;
      if (field.restart !== false) restart.add(path);
    }
    return { errors, restart };
  }, [draft, groups]);
  const errorCount = Object.keys(validation.errors).length;
  if (configInfo && configInfo.ok === false) {
    return React.createElement(
      "div",
      null,
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
    React.createElement(
      "div",
      { style: s.card },
      React.createElement(
        "div",
        { className: "dshc-row", style: { justifyContent: "space-between" } },
        React.createElement("div", { style: s.label }, "\u7F51\u5173\u914D\u7F6E\uFF08config.json \u5168\u91CF 53 \u9879\uFF09"),
        React.createElement(Tag, {
          text: editable ? "\u53EF\u5199" : "\u53EA\u8BFB",
          tone: editable ? "ok" : "warn"
        })
      ),
      React.createElement(
        "div",
        { style: { ...s.muted, marginTop: 8, lineHeight: 1.7 } },
        `\u914D\u7F6E\u6587\u4EF6\uFF1A${configInfo?.path ?? "\u2014"}`
      ),
      configInfo?.reason ? React.createElement("div", { style: { ...s.warn, marginTop: 10 } }, configInfo.reason) : null,
      !editable ? React.createElement(
        "div",
        { style: { ...s.tip, marginTop: 10 } },
        "\u5F53\u524D\u4E3A\u53EA\u8BFB\uFF1A\u6539\u52A8\u4E0D\u4F1A\u88AB\u4FDD\u5B58\u3002\u5BB9\u5668\u90E8\u7F72\u5E38\u89C1 `./config.json:/app/config.json:ro`\uFF0C\u9700\u53BB\u6389 `:ro` \u540E\u91CD\u542F\u5BB9\u5668\u3002"
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
          null,
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
              onClick: () => onSave(draft)
            },
            saving ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58"
          )
        )
      ),
      errorCount > 0 ? React.createElement("div", { style: { ...s.err, marginTop: 10 } }, `${errorCount} \u9879\u6821\u9A8C\u672A\u901A\u8FC7\uFF0C\u65E0\u6CD5\u4FDD\u5B58\u3002`) : null,
      validation.restart.size > 0 ? React.createElement(
        "div",
        { style: { ...s.warn, marginTop: 10 } },
        `\u5176\u4E2D ${validation.restart.size} \u9879\u5C5E\u4E8E\u300C\u9700\u91CD\u542F\u300D\u5B57\u6BB5 \u2014\u2014 chanhub \u6CA1\u6709\u914D\u7F6E\u70ED\u52A0\u8F7D\uFF0C\u4FDD\u5B58\u540E\u9700\u91CD\u542F\u7F51\u5173\u624D\u751F\u6548\u3002`
      ) : null
    ),
    // 服务控制（放本 Tab 底部，与「需重启」说明同处）
    React.createElement(
      "div",
      { style: s.card },
      React.createElement("div", { style: { ...s.label, marginBottom: 8 } }, "\u{1F504} \u670D\u52A1\u63A7\u5236"),
      React.createElement(
        "div",
        { style: { ...s.tip, marginBottom: 10, lineHeight: 1.7 } },
        "chanhub \u81EA\u8EAB\u6CA1\u6709\u91CD\u542F\u80FD\u529B\uFF08\u65E0\u70ED\u52A0\u8F7D\u3001\u65E0 SIGHUP \u5904\u7406\uFF09\u3002\u91CD\u542F\u5FC5\u987B\u7531**\u63D2\u4EF6\u5BBF\u4E3B**\u6267\u884C\u672C\u673A\u547D\u4EE4\uFF0C",
        "\u56E0\u6B64\u9ED8\u8BA4\u5173\u95ED\uFF1A\u9700\u5728\u63D2\u4EF6\u8BBE\u7F6E\u91CC\u6253\u5F00 allowServiceControl \u5E76\u586B\u5199\u91CD\u542F\u547D\u4EE4\u3002"
      ),
      React.createElement(
        "div",
        { style: { ...s.code, background: "var(--dsw-alias-bg-layer-1,#fff)", padding: "8px 10px", borderRadius: 6 } },
        "docker compose restart <\u670D\u52A1\u540D>   # \u767D\u540D\u5355\u524D\u7F00\u4E4B\u4E00"
      ),
      React.createElement(
        "div",
        { className: "dshc-row", style: { marginTop: 10 } },
        React.createElement(
          "button",
          {
            type: "button",
            style: s.btnGhost,
            disabled: serviceBusy,
            onClick: onServiceControl
          },
          serviceBusy ? "\u6267\u884C\u4E2D\u2026" : "\u4E00\u952E\u91CD\u542F\u670D\u52A1"
        )
      ),
      serviceControlResult ? React.createElement(
        "div",
        { style: { ...serviceControlResult.ok ? s.tip : s.err, marginTop: 10, lineHeight: 1.7 } },
        serviceControlResult.ok ? `\u547D\u4EE4\u5DF2\u6267\u884C\uFF1A${serviceControlResult.command}` : `${serviceControlResult.message ?? "\u6267\u884C\u5931\u8D25"}`,
        serviceControlResult.stdout ? React.createElement("div", { style: { ...s.code, marginTop: 6 } }, serviceControlResult.stdout) : null,
        serviceControlResult.stderr ? React.createElement("div", { style: { ...s.code, marginTop: 6 } }, serviceControlResult.stderr) : null
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
  return React.createElement(
    "div",
    { style: { marginBottom: 10, minWidth: 0 } },
    React.createElement(
      "div",
      { className: "dshc-row", style: { marginBottom: 4 } },
      React.createElement("span", { style: { ...s.label, minWidth: 150 } }, field.label),
      React.createElement("span", { style: { ...s.code, color: "var(--dsw-alias-label-tertiary,#8b93a1)" } }, field.path),
      dirty ? React.createElement(
        "span",
        { style: { ...s.btnLink, cursor: "pointer" }, onClick: onReset, title: "\u8FD8\u539F\u4E3A\u5F53\u524D\u6587\u4EF6\u503C" },
        "\u8FD8\u539F"
      ) : null,
      field.danger ? React.createElement(Tag, { text: "\u5371\u9669\u8BED\u4E49", tone: "warn" }) : null,
      field.restart !== false ? React.createElement(Tag, { text: "\u9700\u91CD\u542F", tone: "idle" }) : null,
      field.type ? React.createElement(Tag, { text: field.type, tone: "idle" }) : null,
      field.default ? React.createElement("span", { style: s.muted }, `\u9ED8\u8BA4 ${field.default}`) : null
    ),
    control,
    field.note ? React.createElement(
      "div",
      {
        style: {
          ...s.muted,
          marginTop: 4,
          ...field.danger ? { color: tone.warn.fg } : {}
        }
      },
      field.note
    ) : null,
    error ? React.createElement("div", { style: { ...s.muted, marginTop: 4, color: tone.err.fg } }, error) : null
  );
}
function TabBar({ active, onChange, statusText }) {
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
    React.createElement(
      "span",
      { style: { ...s.muted, marginLeft: "auto", paddingLeft: 12, whiteSpace: "nowrap" } },
      statusText
    )
  );
}
function ChanhubPanel({ rpcCall }) {
  const [activeTab, setActiveTab] = React.useState("accounts");
  const [data, setData] = React.useState(null);
  const [configInfo, setConfigInfo] = React.useState(null);
  const [authInfo, setAuthInfo] = React.useState(null);
  const [stats, setStats] = React.useState(null);
  const [tasks, setTasks] = React.useState(null);
  const [creditsByUid, setCreditsByUid] = React.useState({});
  const [growthByUid, setGrowthByUid] = React.useState({});
  const [schoolByUid, setSchoolByUid] = React.useState({});
  const [usage, setUsage] = React.useState(null);
  const [logs, setLogs] = React.useState(null);
  const [usageWindow, setUsageWindow] = React.useState("72h");
  const [logChannel, setLogChannel] = React.useState("all");
  const [runningTask, setRunningTask] = React.useState("");
  const [err, setErr] = React.useState("");
  const [refreshing, setRefreshing] = React.useState(false);
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
      const [statusResult, configResult, accountsResult, statsResult, tasksResult, usageResult, logsResult] = await Promise.all([
        rpcCall(ENDPOINTS.getStatus, {}),
        rpcCall(ENDPOINTS.getConfig, {}),
        rpcCall(ENDPOINTS.getAccounts, {}),
        rpcCall(ENDPOINTS.getStats, {}),
        rpcCall(ENDPOINTS.getTasks, {}),
        rpcCall(ENDPOINTS.getUsage, { window: usageWindow }),
        rpcCall(ENDPOINTS.getLogs, { channel: logChannel, limit: 500 })
      ]);
      if (statusResult?.ok === false) {
        setErr(statusResult?.error?.message ?? "\u52A0\u8F7D\u5931\u8D25");
        setData(null);
        return;
      }
      setErr("");
      setData(statusResult?.value ?? null);
      setConfigInfo(configResult?.ok === false ? { ok: false, message: configResult?.error?.message } : configResult?.value ?? null);
      setAuthInfo(accountsResult?.value ?? null);
      setStats(statsResult?.value?.available ? statsResult.value.stats : null);
      setTasks(tasksResult?.value ?? null);
      setUsage(usageResult?.value ?? null);
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
  }, [rpcCall, usageWindow, logChannel]);
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    if (typeof document === "undefined") return void 0;
    const handler = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  React.useEffect(() => {
    if (!visible) return void 0;
    const timer = setInterval(() => {
      void refresh();
    }, 8e3);
    return () => clearInterval(timer);
  }, [visible, refresh]);
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
  const channelOf = React.useMemo(
    () => channelResolver(authInfo?.ok ? authInfo.accounts : []),
    [authInfo]
  );
  const status = data?.status;
  const maxInFlight = maxInFlightOf(configInfo?.config);
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
    // 顶部品牌行
    React.createElement(
      "div",
      { style: { ...s.card, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" } },
      React.createElement(Icons.gateway, { style: { color: "var(--dsw-alias-brand-primary,#4f6ef7)", width: 22, height: 22 } }),
      React.createElement(
        "div",
        { style: { minWidth: 0, flexGrow: 1 } },
        React.createElement("div", { style: { ...s.label, fontSize: 15 } }, "chanhub \u7F51\u5173\u9762\u677F"),
        React.createElement(
          "div",
          { style: s.muted },
          "\u8D26\u53F7\u6C60 \xB7 \u79EF\u5206 \xB7 \u7194\u65AD\u51B7\u5374 \xB7 \u914D\u7F6E \u2014\u2014 \u6570\u636E\u76F4\u8FDE lament-z/chanhub\uFF08WorkBuddy2API\uFF09\u7F51\u5173"
        )
      ),
      React.createElement(Tag, {
        text: statusText,
        tone: data?.reachable === false || data?.error ? "err" : data?.reachable ? "ok" : "idle"
      })
    ),
    // 不可达时的说明（区分「网关没起来」与「key 不对」——处置完全不同）
    data?.reachable === false ? React.createElement(
      "div",
      { style: { ...s.err, marginBottom: 14, lineHeight: 1.7 } },
      `\u65E0\u6CD5\u8FDE\u63A5\u7F51\u5173\uFF1A${data.error?.message ?? "\u672A\u77E5\u539F\u56E0"}`,
      React.createElement(
        "div",
        { style: { marginTop: 6 } },
        "\u8BF7\u786E\u8BA4\u7F51\u5173\u5DF2\u542F\u52A8\u3001\u5730\u5740\u6B63\u786E\uFF0C\u5E76\u5728\u63D2\u4EF6\u8BBE\u7F6E\u91CC\u914D\u7F6E apiKeyEnv\uFF08\u9ED8\u8BA4 WB2API_API_KEY\uFF09\u3002"
      )
    ) : null,
    data?.reachable === true && data?.error ? React.createElement(
      "div",
      { style: { ...s.err, marginBottom: 14, lineHeight: 1.7 } },
      `\u7F51\u5173\u53EF\u8FBE\uFF0C\u4F46\u53D6\u72B6\u6001\u5931\u8D25\uFF1A${data.error.message}`,
      data.error.code === "auth-failed" ? React.createElement(
        "div",
        { style: { marginTop: 6 } },
        "\u7F51\u5173\u786E\u8BA4\u5728\u7EBF\uFF0C\u662F API key \u4E0D\u5339\u914D\u3002\u8BF7\u5728\u63D2\u4EF6\u8BBE\u7F6E\u91CC\u6838\u5BF9 apiKeyEnv \u6307\u5411\u7684\u51ED\u8BC1\uFF0C\u6216\u7F51\u5173 config.json \u7684 api_key\u3002"
      ) : null
    ) : null,
    err ? React.createElement("div", { style: { ...s.err, marginBottom: 14 } }, err) : null,
    React.createElement(TabBar, { active: activeTab, onChange: setActiveTab, statusText }),
    // Tab 内容
    activeTab === "accounts" ? React.createElement(AccountsTab, {
      status,
      channelOf,
      maxInFlight,
      onAction: onAccountAction,
      busy: busyAccount,
      onRefresh: refresh,
      refreshing,
      error: "",
      creditsByUid,
      scheduleConfig: configInfo?.config?.schedule,
      onRunTask,
      runningName: runningTask,
      taskData: tasks
    }) : null,
    activeTab === "tasks" ? React.createElement(TasksTab, {
      status,
      channelOf,
      maxInFlight,
      taskData: tasks,
      growthData: growthByUid,
      schoolData: schoolByUid,
      onRunTask,
      runningName: runningTask,
      onRefresh: refresh,
      scheduleConfig: configInfo?.config?.schedule
    }) : null,
    activeTab === "usage" ? React.createElement(UsageTab, {
      stats,
      usage,
      usageWindow,
      onWindowChange: setUsageWindow,
      onRefresh: refresh
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
      serviceBusy
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
  ctx.slots.inject(
    "settings.section",
    () => ctx.slots.register(
      {
        name: "settings.section",
        id: "dsh-chanhub",
        order: 11,
        label: () => "chanhub",
        inject: () => ({ rpcCall })
      },
      ChanhubPanel
    )
  );
}

    return module.exports;
  }
});

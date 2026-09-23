// model-ability.js —— 「模型能力」Tab：拉网关全字段模型目录，勾选视觉模型，
// 一键给 DSH llm-pi-ai providers.<provider>.models 补 input:["text","image"]。
//
// 纯展示 + 调两个 RPC 端点（discoverModelsForPatch / applyModelsPatch）。
// provider 默认 chanhub2api（DSH 里 chanhub 连接的 provider 名）。
import React from 'react';
import { s, tone, type } from './theme.js';
import { ENDPOINTS } from './endpoints.js';
import { relativeTime } from './derive.js';

const DEFAULT_PROVIDER = 'chanhub2api';

/** 差异字段的中文名（与宿主快照字段一一对应）。 */
const FIELD_LABEL = { name: '名称', ctx: '上文', maxOut: '输出', credits: '倍率', vision: '能力' };

/** 补齐配置字段时，pi-ai 字段名 → 面板文案。 */
const COMPLETION_LABEL = {
  contextWindow: '上下文',
  maxTokens: '输出上限',
  reasoningEfforts: '推理档位',
  input: '视觉',
};

/** 配置里「未写入」的标记：DSH 会回落到 256K/32K，用户看到的面板值并不是 DSH 读到的值。 */
function NotWrittenMark({ fields, children }) {
  return React.createElement(
    'span',
    {
      style: { display: 'inline-flex', alignItems: 'center', gap: 4 },
      title: `DSH 配置里没写：${fields.join('、')}\n`
        + 'pi-ai 会回落到默认值（上下文 262144 / 输出 32768），面板这里显示的是网关自报值。\n'
        + '点「补齐配置字段」即可写入。',
    },
    React.createElement('span', { style: { color: tone.warn.fg } }, children),
    React.createElement('span', {
      style: { ...s.tag, color: tone.warn.fg, background: tone.warn.bg },
    }, '未写入'),
  );
}

function fmtWindow(n) {
  if (!n || n <= 0) return '—';
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

/** 目录判定状态的中文名（与宿主 lib/model-catalog.js 的 VERDICT_STATUS 对应）。 */
const CATALOG_STATUS_LABEL = {
  confirmed: '目录确认',
  borrowed: '借判·待确认',
  conflict: '双源冲突',
  alias: '档位别名',
  missing: '目录无收录',
};
/** 来源等级：原厂 > 云托管 > 转售。 */
const CATALOG_TIER_LABEL = { L1: '原厂', L2: '云托管', L3: '转售' };

/** 目录判定的配色：确认=绿/灰，借判=琥珀，冲突=红，别名/无收录=灰。 */
function catalogColors(v) {
  if (!v) return tone.idle;
  if (v.status === 'conflict') return tone.err;
  if (v.status === 'borrowed') return tone.warn;
  if (v.verdict === 'image') return tone.ok;
  return tone.idle;
}

/**
 * 实测标记：把「实测结论」与「目录判定」摆在一起，**不一致时显式标矛盾**。
 *
 * 为什么必须标出来：真机实测发现目录对 CN 渠道的「纯文本」标注经常是错的
 * （hy3-x / hy4-preview-f / glm-5.3 等目录标「文」、实测能读图）。矛盾不标出来，
 * 用户只会看到两个并排的徽章，不知道该信谁 —— 按本项目纪律：**实测优先**。
 */
function ProbeMark({ result, capability, verdict, canProbe, busy, onProbe }) {
  const measured = result?.verdict
    ?? (capability?.tier === 'L0' ? (capability.image === true ? 'image' : 'text') : null);
  const label = { image: '图', text: '文', unknown: '未定' };
  const color = measured === 'image' ? tone.ok : measured === 'text' ? tone.idle : tone.warn;
  const catalogVerdict = verdict?.verdict;
  const conflict = measured !== null && measured !== 'unknown'
    && (catalogVerdict === 'image' || catalogVerdict === 'text')
    && measured !== catalogVerdict;
  return React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 6 } },
    measured
      ? React.createElement('span', {
          style: { ...s.tag, color: color.fg, background: color.bg },
          title: result
            ? `实测：${result.reason}`
            : `已沉淀（${capability.tier}）：${capability.how ?? ''} —— 来自能力基线，不是本次会话实测`,
        }, `${result ? '实测' : '已沉淀'}：${label[measured] ?? measured}`)
      : null,
    conflict
      ? React.createElement('span', {
          style: { ...s.tag, color: tone.err.fg, background: tone.err.bg },
          title: `实测与目录不一致：目录说「${label[catalogVerdict]}」（${verdict.status}），实测说「${label[measured]}」。`
            + '按纪律以实测为准 —— 点「沉淀确认项」把实测结论写进基线。',
        }, '与目录矛盾')
      : null,
    canProbe
      ? React.createElement('button', {
          ...s.btnGhost,
          style: { ...s.btnGhost, padding: '1px 6px', fontSize: 11, opacity: busy ? 0.5 : 1 },
          type: 'button',
          disabled: busy,
          onClick: onProbe,
          title: '只实测这一个模型（发一张带「颜色+数字」的图，答对才算看见）',
        }, '实测')
      : null);
}

/** 目录判定徽章（只读标注，不写配置）。hover 里带证据：等级/票数/命中方式/来源。 */
function CatalogBadge({ verdict, whitelisted }) {
  if (!verdict) {
    return React.createElement('span', { style: { ...s.tag, color: tone.idle.fg, background: tone.idle.bg } }, '未比对');
  }
  const colors = catalogColors(verdict);
  const text = verdict.verdict === 'image' ? '多模态' : (verdict.verdict === 'text' ? '纯文本' : '待确认');
  const status = CATALOG_STATUS_LABEL[verdict.status] ?? verdict.status;
  const tally = verdict.tally ? `图 ${verdict.tally.image} / 文 ${verdict.tally.text}` : '';
  const sources = (verdict.sources ?? []).slice(0, 6)
    .map((x) => `${x.source}/${x.provider || '?'}${x.image ? '图' : '文'}`).join('、');
  const more = (verdict.sources ?? []).length > 6 ? ` 等 ${verdict.sources.length} 条` : '';
  const title = [
    `${status}｜${verdict.tier ? (CATALOG_TIER_LABEL[verdict.tier] ?? verdict.tier) : '无来源'}`,
    tally,
    verdict.reason ?? '',
    verdict.how ? `命中方式：${verdict.how}` : '',
    sources ? `来源：${sources}${more}` : '',
    '这只是目录标注，不会改动 DSH 配置。',
  ].filter(Boolean).join('\n');
  // 与本地白名单打架时额外打一个记号：白名单说图、目录说文（或反过来）
  const conflictWithWhitelist = (whitelisted === true && verdict.verdict === 'text')
    || (whitelisted === false && verdict.verdict === 'image');
  return React.createElement(
    'span',
    { style: { display: 'inline-flex', alignItems: 'center', gap: 4 }, title },
    React.createElement('span', { style: { ...s.tag, color: colors.fg, background: colors.bg } }, text),
    React.createElement('span', { style: { ...type.text.caption, color: tone.idle.fg } },
      `${status}${verdict.tier ? ` · ${CATALOG_TIER_LABEL[verdict.tier] ?? verdict.tier}` : ''}`),
    conflictWithWhitelist
      ? React.createElement('span', {
          style: { ...s.tag, color: tone.warn.fg, background: tone.warn.bg },
          title: '与本地白名单不一致 —— 白名单可能标错，或目录收录的不是同一个模型',
        }, '≠白名单')
      : null,
  );
}

function VisionBadge() {
  return React.createElement(
    'span',
    { style: { ...s.tag, color: tone.ok.fg, background: tone.ok.bg } },
    '多模态',
  );
}
function TextBadge() {
  return React.createElement(
    'span',
    { style: { ...s.tag, color: tone.idle.fg, background: tone.idle.bg } },
    '文本',
  );
}

export function ModelAbilityTab({ rpcCall, showToast }) {
  const [state, setState] = React.useState({ kind: 'idle' }); // idle | loading | loaded | error
  const [provider, setProvider] = React.useState(DEFAULT_PROVIDER);
  const [models, setModels] = React.useState(null);
  const [selected, setSelected] = React.useState(() => new Set());
  const [applyBusy, setApplyBusy] = React.useState(false);
  const [lastOk, setLastOk] = React.useState(null); // {added,skipped,wrote} | null
  const [lastErr, setLastErr] = React.useState(null);
  // 拉取记录（快照）+ 与上次的差异 + 覆盖相关状态
  const [record, setRecord] = React.useState(null); // {at,count,recorded}
  const [diff, setDiff] = React.useState(null); // {added,removed,changed,first}
  const [backup, setBackup] = React.useState(null); // {at,count}
  const [overwrite, setOverwrite] = React.useState(false); // 默认关：覆盖 DSH 模型配置是破坏性动作
  const [rollbackBusy, setRollbackBusy] = React.useState(false);
  // 目录比对（只读）：宿主返回的三态判定 + 目录快照元信息
  const [catalog, setCatalog] = React.useState(null); // {at,sources,catalog,summary,warnings,failures,verdicts:Map}
  const [catalogBusy, setCatalogBusy] = React.useState(false);
  // 补齐配置字段：configured=配置里缺哪些字段；completion=补齐预览（dry-run 结果）
  const [configuredGaps, setConfiguredGaps] = React.useState({});
  const [completion, setCompletion] = React.useState(null);
  const [completeBusy, setCompleteBusy] = React.useState(false);
  // 实测（探针）：probeResults = 本次会话的实测结果；probeBusy = 正在打探针
  const [probeResults, setProbeResults] = React.useState({});
  const [probeBusy, setProbeBusy] = React.useState(false);

  const notify = (msg) => {
    if (typeof showToast === 'function') {
      showToast(msg);
      return;
    }
    // 兜底：面板没传 showToast 时只打日志。
    // eslint-disable-next-line no-console
    console.log('[dsh-chanhub]', msg);
  };

  const applyCatalogResult = React.useCallback((v) => {
    if (!v) return;
    setCatalog({
      at: v.at ?? 0,
      sources: v.sources ?? {},
      catalog: v.catalog ?? null,
      summary: v.summary ?? null,
      warnings: v.warnings ?? [],
      failures: v.failures ?? [],
      // 基线状态（已沉淀/待沉淀）—— 漏了它「沉淀确认项」按钮就不会出现
      baseline: v.baseline ?? null,
      verdicts: new Map((v.verdicts ?? []).map((x) => [x.id, x])),
    });
  }, []);

  // 只读比对：把当前目录喂给宿主做三态判定。**零网络** —— 宿主只读本地 pi-ai
  // 目录 + 缓存（在线目录只有点「刷新目录」时才会去抓）。
  const loadCatalog = React.useCallback(async (list) => {
    if (!rpcCall) return;
    try {
      const result = await rpcCall(ENDPOINTS.getModelCatalog, { provider, models: list ?? [] });
      if (result?.ok !== true) return;
      applyCatalogResult(result.value);
    } catch {
      // 比对失败不影响拉取/打补丁主流程：静默留在「未比对」
    }
  }, [rpcCall, provider, applyCatalogResult]);

  // 回显：纯本地读插件 settings（快照 + 基线），**不请求网关**。
  const reloadRecord = React.useCallback(async () => {
    if (!rpcCall) return;
    try {
      const result = await rpcCall(ENDPOINTS.getModelRecord, {});
      if (result?.ok !== true || !result.value?.record) return;
      const v = result.value;
      setModels(v.models ?? []);
      setRecord(v.record);
      if (typeof v.provider === 'string' && v.provider !== '') setProvider(v.provider);
      if (v.backup && v.backup.at > 0) setBackup(v.backup);
      setConfiguredGaps(v.configured?.gaps ?? {});
      setState({ kind: 'cached' });
      loadCatalog(v.models ?? []);
    } catch {
      // 回显失败不算错误：静默留在 idle，用户点「拉取」即可。
    }
  }, [rpcCall, loadCatalog]);

  // 显式刷新在线目录（models.dev + OpenRouter）→ 宿主落盘缓存 → 同一次往返拿判定。
  const refreshCatalog = React.useCallback(async () => {
    if (!rpcCall) return;
    setCatalogBusy(true);
    try {
      const result = await rpcCall(ENDPOINTS.refreshModelCatalog, { provider, models: models ?? [] });
      if (result?.ok !== true) {
        notify(`刷新目录失败：${result?.error?.message ?? '未知错误'}`);
        return;
      }
      applyCatalogResult(result.value);
      const c = result.value.catalog ?? {};
      const failed = result.value.failures ?? [];
      notify(`目录已刷新：${c.keys ?? 0} 个模型名 / ${c.entries ?? 0} 条标注`
        + (failed.length > 0 ? `（${failed.map((f) => f.source).join('、')} 拉取失败）` : ''));
    } catch (error) {
      notify(`刷新目录异常：${error?.message ?? error}`);
    } finally {
      setCatalogBusy(false);
    }
  }, [rpcCall, provider, models, applyCatalogResult]);

  // 补齐配置字段：先 dry-run 出预览（零网络：走拉取快照），确认后才真写。
  const previewCompletion = React.useCallback(async () => {
    if (!rpcCall) return;
    setCompleteBusy(true);
    setLastErr(null);
    try {
      const result = await rpcCall(ENDPOINTS.completeModelFields, { provider, dryRun: true });
      if (result?.ok !== true) {
        const msg = result?.error?.message ?? '补齐预览失败';
        setLastErr(msg);
        notify(`补齐预览失败：${msg}`);
        return;
      }
      setCompletion(result.value);
    } catch (error) {
      setLastErr(error?.message ?? String(error));
    } finally {
      setCompleteBusy(false);
    }
  }, [rpcCall, provider]);

  const applyCompletion = React.useCallback(async () => {
    if (!rpcCall) return;
    setCompleteBusy(true);
    setLastErr(null);
    try {
      const result = await rpcCall(ENDPOINTS.completeModelFields, { provider, dryRun: false });
      if (result?.ok !== true) {
        const msg = result?.error?.message ?? '补齐失败';
        setLastErr(msg);
        notify(`补齐失败：${msg}`);
        return;
      }
      const v = result.value;
      setCompletion(null);
      notify(`已补齐 ${(v.changes ?? []).length} 个模型的配置字段`);
      await reloadRecord();
    } catch (error) {
      setLastErr(error?.message ?? String(error));
    } finally {
      setCompleteBusy(false);
    }
  }, [rpcCall, provider, reloadRecord]);

  // 实测：真发一张 8×8 图问这条渠道收不收。默认只打**未定项**（借判/冲突/无收录），
  // 单批上限 12、串行 250ms 间隔 —— 保护账号。结论直接沉淀进基线（L0 实测）。
  const runProbe = React.useCallback(async (ids) => {
    if (!rpcCall) return;
    setProbeBusy(true);
    setLastErr(null);
    try {
      const result = await rpcCall(ENDPOINTS.probeModelVision, {
        provider,
        commit: true,
        ...(Array.isArray(ids) && ids.length > 0 ? { ids } : {}),
      });
      if (result?.ok !== true) {
        const msg = result?.error?.message ?? '实测失败';
        setLastErr(msg);
        notify(`实测失败：${msg}`);
        return;
      }
      const v = result.value;
      const byId = { ...probeResults };
      for (const r of v.results ?? []) byId[r.id] = r;
      setProbeResults(byId);
      if (v.report) applyCatalogResult(v.report);
      const img = (v.results ?? []).filter((r) => r.verdict === 'image').length;
      const txt = (v.results ?? []).filter((r) => r.verdict === 'text').length;
      notify(`实测 ${v.done} 个：多模态 ${img} · 纯文本 ${txt} · 未定 ${v.unknown ?? 0}`
        + ((v.remaining ?? []).length > 0 ? `；还有 ${v.remaining.length} 个待实测，再点一次继续` : '')
        + ((v.committed?.added ?? []).length > 0 ? `；已沉淀 ${v.committed.added.length} 项` : ''));
      await reloadRecord();
    } catch (error) {
      setLastErr(error?.message ?? String(error));
    } finally {
      setProbeBusy(false);
    }
  }, [rpcCall, provider, probeResults, applyCatalogResult, reloadRecord]);

  const load = React.useCallback(async (withOverwrite = false) => {
    if (!rpcCall) return;
    if (withOverwrite) {
      // 破坏性动作先要一次显式确认（宿主会先备份，仍给一次后悔机会）
      const okGo = typeof window === 'undefined' || typeof window.confirm !== 'function'
        ? true
        : window.confirm(`将以网关目录整体覆盖 DSH 里 provider「${provider}」的模型配置：\n`
          + '· 网关已删除的模型会从本地移除\n· 视觉能力按本地白名单自动带上\n'
          + '· 覆盖前会自动备份，可随时「回滚上次覆盖」\n\n继续？');
      if (!okGo) return;
    }
    setState({ kind: 'loading' });
    setLastOk(null);
    setLastErr(null);
    try {
      const result = await rpcCall(ENDPOINTS.discoverModelsForPatch, {
        provider,
        overwriteDshModels: withOverwrite,
      });
      if (result?.ok !== true || !result.value) {
        setState({ kind: 'error', message: result?.error?.message ?? '拉取模型目录失败' });
        return;
      }
      const v = result.value;
      setModels(v.models ?? []);
      setSelected(new Set());
      setRecord(v.record ?? null);
      setDiff(v.diff ?? null);
      if (v.backup && v.backup.at > 0) setBackup(v.backup);
      setState({ kind: 'loaded' });
      // 新目录到手 → 顺手做一次只读比对（零网络）
      loadCatalog(v.models ?? []);
      const d = v.diff;
      if (d) {
        const parts = [`新增 ${d.added.length}`, `消失 ${d.removed.length}`, `变化 ${d.changed.length}`];
        notify(`已拉取 ${(v.models ?? []).length} 个模型（${parts.join(' / ')}）`
          + (v.overwrote ? '；已覆盖 DSH 模型配置' : ''));
      }
    } catch (error) {
      setState({ kind: 'error', message: error?.message ?? String(error) });
    }
  }, [rpcCall, provider]);

  // 沉淀：把目录比对的**确认态**结论写进能力基线（只写确认项，借判/冲突不写）。
  const commitCapabilities = React.useCallback(async () => {
    if (!rpcCall) return;
    setCatalogBusy(true);
    try {
      const result = await rpcCall(ENDPOINTS.commitModelCapabilities, { provider, models: models ?? [] });
      if (result?.ok !== true) {
        notify(`沉淀失败：${result?.error?.message ?? '未知错误'}`);
        return;
      }
      const v = result.value;
      if (v.report) applyCatalogResult(v.report);
      notify(`已沉淀 ${(v.added ?? []).length} 项`
        + ((v.changed ?? []).length > 0 ? `、改写 ${v.changed.length} 项` : '')
        + ((v.downgraded ?? []).length > 0 ? `、保住 ${v.downgraded.length} 项实测结论` : '')
        + `（基线共 ${v.count ?? 0} 项；跳过未确认 ${v.skipped ?? 0} 项）`);
      // 基线变了 → 勾选框可用范围跟着变，重读一次回显（零网关请求）
      await reloadRecord();
    } catch (error) {
      notify(`沉淀异常：${error?.message ?? error}`);
    } finally {
      setCatalogBusy(false);
    }
  }, [rpcCall, provider, models, applyCatalogResult, reloadRecord]);

  // 打开 Tab 先回显**上次拉取的结果**（纯本地读插件 settings，不请求网关）。
  // 为什么要这一步：本 Tab 在宿主里是条件渲染的，切到别的页签就卸载，models/
  // record 这些组件状态随之丢失；若打开时只能空手等用户再点一次「拉取」，就等于
  // 每开一次面板都要重打一次网关。快照本来就落在 settings 里，这里读回来即可。
  // 只跑一次：之后 provider 归输入框管，回显不再覆盖用户的输入。
  const hydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (hydratedRef.current || !rpcCall) return;
    hydratedRef.current = true;
    reloadRecord();
  }, [rpcCall, reloadRecord]);

  const toggle = React.useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const apply = React.useCallback(async () => {
    if (!rpcCall || !models) return;
    if (selected.size === 0) {
      notify('请先勾选要补视觉能力的模型');
      return;
    }
    setApplyBusy(true);
    setLastOk(null);
    setLastErr(null);
    try {
      const result = await rpcCall(ENDPOINTS.applyModelsPatch, {
        provider,
        selectedIds: [...selected],
      });
      if (result?.ok !== true) {
        const msg = result?.error?.message ?? '未知错误';
        setLastErr(msg);
        notify(`应用失败：${msg}`);
        return;
      }
      const v = result.value;
      setLastOk({ added: v.added ?? [], skipped: v.skipped ?? [], wrote: v.wrote === true });
      notify(`已给 ${(v.added ?? []).length} 个模型补多模态能力`);
    } catch (error) {
      setLastErr(error?.message ?? String(error));
      notify(`应用异常：${error?.message ?? error}`);
    } finally {
      setApplyBusy(false);
    }
  }, [rpcCall, models, selected, provider]);

  const rollback = React.useCallback(async () => {
    if (!rpcCall) return;
    setRollbackBusy(true);
    setLastErr(null);
    try {
      const result = await rpcCall(ENDPOINTS.rollbackModelsSync, { provider });
      if (result?.ok !== true) {
        const msg = result?.error?.message ?? '回滚失败';
        setLastErr(msg);
        notify(`回滚失败：${msg}`);
        return;
      }
      notify(`已回滚到覆盖前（${result.value?.restored ?? 0} 个模型）`);
      setState({ kind: 'idle' });
      setModels(null);
      setSelected(new Set());
      setRecord(null);
      setDiff(null);
    } catch (error) {
      setLastErr(error?.message ?? String(error));
    } finally {
      setRollbackBusy(false);
    }
  }, [rpcCall, provider]);

  const clearRecord = React.useCallback(async () => {
    if (!rpcCall) return;
    try {
      const result = await rpcCall(ENDPOINTS.clearModelRecord, {});
      if (result?.ok !== true) {
        notify(`清空失败：${result?.error?.message ?? '未知错误'}`);
        return;
      }
      setRecord(null);
      setDiff(null);
      // 表格若只是打开面板时「回显」出来的，记录没了就该一起收走，否则会剩一张
      // 没有记录可对照的表；若是本次刚拉取的（loaded），表是新数据，留着。
      if (state.kind === 'cached') {
        setModels(null);
        setState({ kind: 'idle' });
      }
      notify('已清空拉取记录（未改动 DSH 模型配置）');
    } catch (error) {
      notify(`清空异常：${error?.message ?? error}`);
    }
  }, [rpcCall, state.kind]);

  const removed = diff?.removed ?? [];
  const changedMap = new Map((diff?.changed ?? []).map((c) => [c.id, c.fields]));
  const addedSet = new Set(diff?.added ?? []);
  const alreadyImage = models ? models.filter((m) => m.supportsImages === true).length : 0;

  const mono = { fontFamily: type.text.code.fontFamily, fontSize: 12, wordBreak: 'break-all', color: s.label.color };

  return React.createElement(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, padding: '4px 2px' } },
    // 工具栏
    React.createElement(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' } },
      React.createElement(
        'span',
        { style: type.text.secondary },
        'provider',
      ),
      React.createElement('input', {
        style: { ...s.input, flex: '1 1 200px', maxWidth: 240 },
        value: provider,
        placeholder: 'chanhub2api',
        onChange: (ev) => setProvider(ev.target.value.trim() || DEFAULT_PROVIDER),
      }),
      React.createElement(
        'button',
        {
          style: overwrite ? { ...s.btnPri, background: tone.err.fg, borderColor: tone.err.fg } : s.btnPri,
          type: 'button',
          disabled: applyBusy,
          onClick: () => load(overwrite),
          title: overwrite ? '拉取后以网关目录整体覆盖 DSH 的该 provider 模型配置（覆盖前自动备份）' : '只拉取目录并记录，不改动 DSH 模型配置',
        },
        state.kind === 'loading'
          ? '拉取中…'
          : (overwrite
            ? '拉取并覆盖 DSH 模型配置'
            : (state.kind === 'cached' ? '重新拉取（刷新）' : '拉取全渠道模型')),
      ),
      React.createElement(
        'label',
        { style: { ...type.text.caption, display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' } },
        React.createElement('input', {
          type: 'checkbox',
          checked: overwrite,
          onChange: (ev) => setOverwrite(ev.target.checked),
          style: { cursor: 'pointer' },
        }),
        '拉取时覆盖（网关为准）',
      ),
      models && models.length > 0
        ? React.createElement(
            'button',
            { ...s.btnGhost, style: { ...s.btnGhost, opacity: applyBusy || selected.size === 0 ? 0.6 : 1 }, type: 'button', disabled: applyBusy || selected.size === 0, onClick: apply },
            applyBusy ? '应用中…' : `应用补丁（${selected.size}）`,
          )
        : null,
      React.createElement(
        'button',
        {
          ...s.btnGhost,
          style: { ...s.btnGhost, opacity: catalogBusy ? 0.6 : 1 },
          type: 'button',
          disabled: catalogBusy,
          onClick: refreshCatalog,
          title: '联网抓取 models.dev 与 OpenRouter 的多模态标注，落盘到 ~/.dsh/dsh-chanhub/model-catalog.json；'
            + '平时打开面板只读缓存，不联网、不改 DSH 配置',
        },
        catalogBusy ? '刷新目录中…' : '刷新能力目录',
      ),
      catalog && (catalog.summary?.undecided ?? []).length > 0
        ? React.createElement(
            'button',
            {
              ...s.btnGhost,
              style: { ...s.btnGhost, opacity: probeBusy ? 0.6 : 1 },
              type: 'button',
              disabled: probeBusy,
              onClick: () => runProbe(),
              title: '真发一张图问这条渠道认不认得：图里画了「背景色 + 数字」，只有答对才算看见 —— '
                + '实测发现只发图看报错根本证明不了什么（纯文本模型照样回 200，甚至会编一个颜色）。'
                + '目录是别人的二手标注，白名单是人工认定，实测才是最终裁决。'
                + '串行 + 300ms 间隔 + 单批 12 个（保护账号）；拿不准的一律记「未定」，不写配置。'
                + '确认结论会沉淀进能力基线（等级 L0 实测）。',
            },
            probeBusy
              ? '实测中…'
              : `实测未定项（${Math.min(catalog.summary.undecided.length, 12)}/${catalog.summary.undecided.length}）`,
          )
        : null,
      models && models.length > 0 && Object.keys(configuredGaps).length > 0
        ? React.createElement(
            'button',
            {
              ...s.btnGhost,
              style: { ...s.btnGhost, opacity: completeBusy ? 0.6 : 1 },
              type: 'button',
              disabled: completeBusy,
              onClick: previewCompletion,
              title: '给 DSH 配置里已存在的条目补上 contextWindow / maxTokens / 推理档位（+ 视觉 input）：'
                + '只填空缺，不增不删条目，也不动你手改过的其它字段。'
                + '缺字段时 pi-ai 会回落到 256K / 32K —— 这就是「上游 1M、DSH 显示 256K」的原因。',
            },
            completeBusy ? '处理中…' : `补齐配置字段（${Object.keys(configuredGaps).length}）`,
          )
        : null,
      catalog && (catalog.baseline?.pending ?? 0) > 0
        ? React.createElement(
            'button',
            {
              ...s.btnGhost,
              style: { ...s.btnGhost, opacity: catalogBusy ? 0.6 : 1 },
              type: 'button',
              disabled: catalogBusy,
              onClick: commitCapabilities,
              title: '把目录比对中**确认态**的结论写进能力基线（settings.modelCapabilities）：'
                + '确认多模态的模型会获得视觉能力，确认纯文本的会被记下来。'
                + '借判/模糊/冲突/别名/无收录一律不写。只改插件 settings，不动 DSH 模型配置。',
            },
            `沉淀确认项（${catalog.baseline.pending}）`,
          )
        : null,
    ),
    // 拉取记录：上次拉取时刻 + 与本次的差异（记录每次拉取都是**整体覆盖**）
    record
      ? React.createElement('div', { style: { ...type.text.caption, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
          React.createElement('span', null,
            `上次拉取：${relativeTime(record.at) || '—'} · ${record.count} 个模型`
            + (record.recorded === true ? '' : '（记录写入失败）')),
          diff && !diff.first
            ? React.createElement('span', { style: { color: tone.info.fg } },
                `本次新增 ${diff.added.length} / 消失 ${diff.removed.length} / 变化 ${diff.changed.length}`)
            : diff && diff.first
              ? React.createElement('span', { style: { color: tone.idle.fg } }, '（首次记录，无历史可比）')
              : null,
          React.createElement('button', {
            type: 'button',
            style: { ...s.btnGhost, height: 24, padding: '0 8px', fontSize: 11.5 },
            onClick: clearRecord,
            title: '只清空这份拉取记录，不动 DSH 模型配置',
          }, '清空记录'),
          backup && backup.at > 0
            ? React.createElement('button', {
                type: 'button',
                style: { ...s.btnGhost, height: 24, padding: '0 8px', fontSize: 11.5 },
                disabled: rollbackBusy,
                onClick: rollback,
                title: `回滚到覆盖前（备份于 ${new Date(backup.at).toLocaleString()}，${backup.count} 个模型）`,
              }, rollbackBusy ? '回滚中…' : `回滚上次覆盖（${backup.count}）`)
            : null,
        )
      : null,
    // 上游已移除：这些模型本次没再出现，覆盖后会从 DSH 配置里消失（不单列就看不见了）
    removed.length > 0
      ? React.createElement('div', { style: { ...s.tip, borderColor: tone.warn.fg } },
          `上游已移除 ${removed.length} 个模型：${removed.slice(0, 8).join('、')}`
          + (removed.length > 8 ? ` 等 ${removed.length} 个` : '')
          + '（覆盖模式下会从 DSH 配置里移除；仅补视觉能力模式不动它们）')
      : null,
    // 目录比对摘要（只读标注）：三态计数 + 目录快照新旧 + 源可用性
    catalog
      ? React.createElement('div', { style: { ...type.text.caption, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
          React.createElement('span', null,
            `能力目录：${catalog.catalog?.keys ?? 0} 个模型名 / ${catalog.catalog?.entries ?? 0} 条标注`
            + (catalog.at > 0 ? ` · 快照 ${relativeTime(catalog.at) || '—'}` : ' · 只有离线源')),
          catalog.summary
            ? React.createElement('span', { style: { color: tone.info.fg } },
                `判定：多模态 ${catalog.summary.counts.image} / 纯文本 ${catalog.summary.counts.text} / 待确认 ${catalog.summary.counts.unknown}`
                + `（确认 ${catalog.summary.counts.confirmed} · 借判 ${catalog.summary.counts.borrowed}`
                + ` · 冲突 ${catalog.summary.counts.conflict} · 别名 ${catalog.summary.counts.alias}`
                + ` · 无收录 ${catalog.summary.counts.missing}）`)
            : null,
          catalog.baseline && catalog.baseline.count > 0
            ? React.createElement('span', { style: { color: tone.ok.fg } },
                `已沉淀 ${catalog.baseline.count} 项`
                + (catalog.baseline.pending > 0 ? `（待沉淀 ${catalog.baseline.pending}）` : ''))
            : null,
          catalog.summary && catalog.summary.disagreements.length > 0
            ? React.createElement('span', { style: { color: tone.warn.fg } },
                `与白名单不一致 ${catalog.summary.disagreements.length} 个`)
            : null,
          catalog.summary && catalog.summary.gaps.length > 0
            ? React.createElement('span', {
                style: { color: tone.warn.fg },
                title: catalog.summary.gaps.map((g) => `${g.id}（${g.status === 'confirmed' ? '确认' : '借判待确认'}）`).join('\n'),
              },
                `白名单可补 ${catalog.summary.gaps.length} 个`
                + (catalog.summary.gaps.some((g) => g.status !== 'confirmed')
                  ? `（其中借判 ${catalog.summary.gaps.filter((g) => g.status !== 'confirmed').length}）`
                  : ''))
            : null,
          catalog.warnings.length > 0
            ? React.createElement('span', { title: catalog.warnings.join('\n'), style: { color: tone.idle.fg } },
                `⚠ ${catalog.warnings[0]}`)
            : null,
          catalog.failures.length > 0
            ? React.createElement('span', { style: { color: tone.err.fg } },
                `源失败：${catalog.failures.map((f) => f.source).join('、')}`)
            : null,
        )
      : null,
    // 说明
    React.createElement('p', { style: { ...type.text.caption, lineHeight: 1.7 } }, '「多模态」= 本地评审白名单内、真实支持图片输入的模型（上游 supports_images 字段不可靠，故未采信）。应用补丁会把勾选的模型写入 DSH 设置 llm-pi-ai 的 providers.&lt;provider&gt;.models[].input = ["text","image"]，让 DSH 允许图片上传。注意：之后别在「设置→模型」里重新「从提供商搜索」，否则视觉标记会被清回。'),
    React.createElement('p', { style: { ...type.text.caption, lineHeight: 1.7 } }, '「目录判定」= 拿公开结构化目录（DSH 自带 pi-ai 目录 + models.dev + OpenRouter）比对出来的结论，只作标注、**不会改动任何配置**。裁决按来源分级：原厂(L1) > 云托管(L2) > 转售(L3)，同级平票才算冲突；剥后缀/模糊命中的结论是「借判」，目录查不到的标「无收录」，渠道档位别名（auto / fast-model 等）不参与比对。'),
    state.kind === 'cached'
      ? React.createElement('div', { style: s.tip },
          `以下是上次拉取的结果（${record ? (relativeTime(record.at) || '—') : '—'}），`
          + '打开面板时直接回显、未重新请求网关。要看最新目录点「重新拉取（刷新）」。')
      : null,
    state.kind === 'loading'
      ? React.createElement('div', { style: s.tip }, '正在拉取网关模型目录…')
      : null,
    state.kind === 'error'
      ? React.createElement('div', { style: s.err }, state.message)
      : null,
    lastOk
      ? React.createElement(
          'div',
          { style: { ...s.tip, color: tone.ok.fg } },
          `已应用：给 ${lastOk.added.length} 个模型补多模态能力` +
            (lastOk.skipped.length ? `；忽略 ${lastOk.skipped.length} 个未找到的 id` : '') +
            (lastOk.wrote ? '' : '（无可写变更）'),
        )
      : null,
    // 补齐预览：dry-run 的结果 + 二次确认（写入是第二个按钮，不点不写）
    completion
      ? React.createElement('div', { style: { ...s.tip, display: 'flex', flexDirection: 'column', gap: 6 } },
          React.createElement('span', { style: { fontWeight: 600 } },
            `补齐预览：将改动 ${completion.changes.length} 个模型`
            + `（已一致不动 ${completion.unchanged} 个）`),
          React.createElement('span', null,
            `数据源：${completion.source?.kind === 'gateway' ? '网关实时' : '拉取快照'}`
            + (completion.source?.at ? ` · ${relativeTime(completion.source.at) || '—'}` : '')
            + '；只填空缺，不增不删条目'),
          completion.source?.staleFields?.length > 0
            ? React.createElement('span', { style: { color: tone.warn.fg } },
                '这份快照记录于「推理档位」采集上线之前 → 档位这次补不了：'
                + '先把上面「覆盖」勾选框留空、点一次「拉取」刷新快照，再回来补齐。')
            : null,
          React.createElement('span', null,
            Object.entries(completion.changes.reduce((acc, c) => {
              for (const f of c.fields) acc[f] = (acc[f] ?? 0) + 1;
              return acc;
            }, {})).map(([f, n]) => `${COMPLETION_LABEL[f] ?? f} ${n}`).join(' · ') || '无'),
          completion.changes.length > 0
            ? React.createElement('span', { style: { ...type.text.caption, maxHeight: 96, overflow: 'auto' } },
                completion.changes.slice(0, 12).map((c) => `${c.id}（${c.fields.map((f) => COMPLETION_LABEL[f] ?? f).join('/')}）`).join('；')
                + (completion.changes.length > 12 ? ` …等 ${completion.changes.length} 个` : ''))
            : null,
          completion.warnings?.length > 0
            ? React.createElement('span', { style: { color: tone.warn.fg } },
                `网关自报异常 ${completion.warnings.length} 条（照写不改）：`
                + completion.warnings.slice(0, 3).map((w) => `${w.id} 输出 ${w.maxTokens} > 上下文 ${w.contextWindow}`).join('；'))
            : null,
          completion.missingInCatalog?.length > 0
            ? React.createElement('span', { style: { color: tone.idle.fg } },
                `${completion.missingInCatalog.length} 个条目在目录里找不到（保持原样）：`
                + completion.missingInCatalog.slice(0, 5).join('、'))
            : null,
          React.createElement('span', { style: { display: 'flex', gap: 8 } },
            React.createElement('button', {
              ...s.btnPri,
              style: { ...s.btnPri, opacity: completeBusy ? 0.6 : 1 },
              type: 'button',
              disabled: completeBusy || completion.changes.length === 0,
              onClick: applyCompletion,
            }, completeBusy ? '写入中…' : `确认写入（${completion.changes.length}）`),
            React.createElement('button', {
              ...s.btnGhost,
              type: 'button',
              onClick: () => setCompletion(null),
            }, '取消')),
        )
      : null,
    lastErr
      ? React.createElement('div', { style: s.err }, lastErr)
      : null,
    // 表格
    models && models.length > 0
      ? React.createElement(
          'div',
          { style: { ...s.card, padding: 0, overflow: 'hidden', marginBottom: 0 } },
          React.createElement(
            'table',
            { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 } },
            React.createElement('thead', null,
              React.createElement('tr', null,
                th(''),
                th('模型 ID'),
                th('名称'),
                th('上文'),
                th('输出'),
                th('倍率'),
                th('能力'),
                th('目录判定'),
              ),
            ),
            React.createElement('tbody', null,
              models.map((m) => {
                const checked = selected.has(m.id);
                const changedFields = changedMap.get(m.id);
                const isNew = addedSet.has(m.id);
                return React.createElement('tr', {
                  key: m.id,
                  style: { background: checked ? 'rgba(11,110,67,.06)' : 'transparent' },
                },
                  React.createElement('td', tdStyle,
                    React.createElement('input', {
                      type: 'checkbox',
                      checked,
                      onChange: () => toggle(m.id),
                      disabled: m.supportsImages !== true,
                      style: { cursor: m.supportsImages === true ? 'pointer' : 'not-allowed', accentColor: 'var(--dsw-alias-button-info-fill,#4176e6)' },
                    }),
                  ),
                  React.createElement('td', tdStyle,
                    React.createElement('span', { style: mono }, m.id),
                    isNew
                      ? React.createElement('span', {
                          style: { ...s.tag, marginLeft: 6, color: tone.ok.fg, background: tone.ok.bg },
                        }, '新增')
                      : changedFields
                        ? React.createElement('span', {
                            style: { ...s.tag, marginLeft: 6, color: tone.warn.fg, background: tone.warn.bg },
                            title: `与上次拉取相比：${changedFields.map((f) => FIELD_LABEL[f] ?? f).join('、')} 变了`,
                          }, `变化 ${changedFields.map((f) => FIELD_LABEL[f] ?? f).join('/')}`)
                        : null),
                  React.createElement('td', { ...tdStyle, whiteSpace: 'nowrap' }, m.name),
                  React.createElement('td', { ...tdStyle, whiteSpace: 'nowrap' },
                    configuredGaps[m.id]?.includes('contextWindow')
                      ? React.createElement(NotWrittenMark, { fields: ['contextWindow'] }, fmtWindow(m.contextWindow))
                      : fmtWindow(m.contextWindow)),
                  React.createElement('td', { ...tdStyle, whiteSpace: 'nowrap' },
                    configuredGaps[m.id]?.includes('maxTokens')
                      ? React.createElement(NotWrittenMark, { fields: ['maxTokens'] }, fmtWindow(m.maxTokens))
                      : fmtWindow(m.maxTokens)),
                  React.createElement('td', { ...tdStyle, whiteSpace: 'nowrap' },
                    typeof m.credits === 'string' && m.credits !== '' ? m.credits : '—',
                    // 倍率补充（qoder 错峰折扣等）：小字跟在倍率下面，
                    // 长说明（含折扣时段）进 tooltip。上游没给就整块不渲染。
                    typeof m.creditsNote === 'string' && m.creditsNote !== ''
                      ? React.createElement('div', {
                          style: { ...type.text.caption, color: tone.info.fg, marginTop: 2 },
                          title: typeof m.creditsNoteDetail === 'string' && m.creditsNoteDetail !== ''
                            ? m.creditsNoteDetail
                            : m.creditsNote,
                        }, m.creditsNote)
                      : null),
                  React.createElement('td', { ...tdStyle, whiteSpace: 'nowrap' }, m.supportsImages === true ? React.createElement(VisionBadge) : React.createElement(TextBadge)),
                  React.createElement('td', tdStyle,
                    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' } },
                      React.createElement(CatalogBadge, {
                        verdict: catalog?.verdicts?.get(m.id) ?? null,
                        whitelisted: catalog?.verdicts?.get(m.id)?.whitelist,
                      }),
                      React.createElement(ProbeMark, {
                        result: probeResults[m.id] ?? null,
                        capability: catalog?.capabilities?.[m.id] ?? null,
                        verdict: catalog?.verdicts?.get(m.id) ?? null,
                        canProbe: (catalog?.summary?.undecided ?? []).includes(m.id) && !probeResults[m.id],
                        busy: probeBusy,
                        onProbe: () => runProbe([m.id]),
                      }))),
                );
              }),
            ),
          ),
          React.createElement('p', { style: { ...type.text.caption, padding: '8px 14px' } },
            `${models.length} 个模型 · ${alreadyImage} 个多模态（可勾选）。`,
          ),
        )
      : models && (state.kind === 'loaded' || state.kind === 'cached')
        ? React.createElement('div', { style: s.tip }, '该 provider 没有模型目录。')
        : null,
  );
}

function th(text) {
  return React.createElement('th', {
    style: {
      textAlign: 'left', fontWeight: 600, color: 'var(--dsw-alias-label-secondary,#6b7280)',
      padding: '8px 10px', whiteSpace: 'nowrap', borderBottom: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
      background: 'var(--dsw-alias-bg-layer-2,#f9fafb)',
    },
  }, text);
}
const tdStyle = {
  padding: '7px 10px',
  borderBottom: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
  color: 'var(--dsw-alias-label-primary,currentColor)',
  verticalAlign: 'top',
  maxWidth: 280,
};
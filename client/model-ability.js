// model-ability.js —— 「模型能力」Tab：拉网关全字段模型目录，勾选视觉模型，
// 一键给 DSH llm-pi-ai providers.<provider>.models 补 input:["text","image"]。
//
// 纯展示 + 调两个 RPC 端点（discoverModelsForPatch / applyModelsPatch）。
// provider 默认 chanhub2api（DSH 里 chanhub 连接的 provider 名）。
import React from 'react';
import { s, tone, type } from './theme.js';
import { ENDPOINTS } from './endpoints.js';

const DEFAULT_PROVIDER = 'chanhub2api';

function fmtWindow(n) {
  if (!n || n <= 0) return '—';
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
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

  const notify = (msg) => {
    if (typeof showToast === 'function') {
      showToast(msg);
      return;
    }
    // 兜底：面板没传 showToast 时只打日志。
    // eslint-disable-next-line no-console
    console.log('[dsh-chanhub]', msg);
  };

  const load = React.useCallback(async () => {
    if (!rpcCall) return;
    setState({ kind: 'loading' });
    setLastOk(null);
    setLastErr(null);
    try {
      const result = await rpcCall(ENDPOINTS.discoverModelsForPatch, { provider });
      if (result?.ok !== true || !result.value) {
        setState({ kind: 'error', message: result?.error?.message ?? '拉取模型目录失败' });
        return;
      }
      setModels(result.value.models ?? []);
      setSelected(new Set());
      setState({ kind: 'loaded' });
    } catch (error) {
      setState({ kind: 'error', message: error?.message ?? String(error) });
    }
  }, [rpcCall, provider]);

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
        { style: s.btnPri, type: 'button', disabled: applyBusy, onClick: load },
        state.kind === 'loading' ? '拉取中…' : '拉取全渠道模型',
      ),
      models && models.length > 0
        ? React.createElement(
            'button',
            { ...s.btnGhost, style: { ...s.btnGhost, opacity: applyBusy || selected.size === 0 ? 0.6 : 1 }, type: 'button', disabled: applyBusy || selected.size === 0, onClick: apply },
            applyBusy ? '应用中…' : `应用补丁（${selected.size}）`,
          )
        : null,
    ),
    // 说明
    React.createElement('p', { style: { ...type.text.caption, lineHeight: 1.7 } }, '「多模态」= 本地评审白名单内、真实支持图片输入的模型（上游 supports_images 字段不可靠，故未采信）。应用补丁会把勾选的模型写入 DSH 设置 llm-pi-ai 的 providers.&lt;provider&gt;.models[].input = ["text","image"]，让 DSH 允许图片上传。注意：之后别在「设置→模型」里重新「从提供商搜索」，否则视觉标记会被清回。'),
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
              ),
            ),
            React.createElement('tbody', null,
              models.map((m) => {
                const checked = selected.has(m.id);
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
                  React.createElement('td', tdStyle, React.createElement('span', { style: mono }, m.id)),
                  React.createElement('td', { ...tdStyle, whiteSpace: 'nowrap' }, m.name),
                  React.createElement('td', { ...tdStyle, whiteSpace: 'nowrap' }, fmtWindow(m.contextWindow)),
                  React.createElement('td', { ...tdStyle, whiteSpace: 'nowrap' }, fmtWindow(m.maxTokens)),
                  React.createElement('td', { ...tdStyle, whiteSpace: 'nowrap' }, typeof m.credits === 'string' && m.credits !== '' ? m.credits : '—'),
                  React.createElement('td', { ...tdStyle, whiteSpace: 'nowrap' }, m.supportsImages === true ? React.createElement(VisionBadge) : React.createElement(TextBadge)),
                );
              }),
            ),
          ),
          React.createElement('p', { style: { ...type.text.caption, padding: '8px 14px' } },
            `${models.length} 个模型 · ${alreadyImage} 个多模态（可勾选）。`,
          ),
        )
      : models && state.kind === 'loaded'
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
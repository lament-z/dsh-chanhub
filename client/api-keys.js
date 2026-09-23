// api-keys.js —— 「接入方」Tab：多消费者 API Key 与它们各自的模型集合。
//
// 对应网关 chanhub 的 /admin/keys（见 internal/server/admin_keys.go）：
//   GET    列表（**不含明文**，只有 key_prefix 打码形态）
//   POST   新建（响应带一次性明文）
//   PATCH  改 name / role / allow / models / enabled / note
//   DELETE 删除
//   POST   /rotate（响应带一次性明文）
//
// 三个必须如实呈现、不能"顺手美化"的点：
//
//  1. **明文只见一次**。创建/轮换成功后网关就再也不返回它了，所以弹窗必须做成
//     阻塞式（提供复制按钮 + 明确的"我已保存"），不能只弹个 3 秒 toast 了事 ——
//     用户没抄下来就只能重新轮换。
//  2. **集合三态语义不等价**：「全量」（`["*"]`）、「空集」（`[]`）与「N 条规则」
//     是三种不同状态，其中空集会让该 key 的 chat 全拒。列表里必须能一眼分清，
//     不能都渲染成"已配置"。
//  3. **预览是本地算的**（见 lib/model-scope.js 的对齐说明）：网关没有按 key.id
//     求值的端点，key 明文事后也拿不到，所以"这个 key 会看到什么"由宿主用与
//     网关逐条对齐的规则本地算。UI 上标注「按规则推算」，不假装是实测值。
import React from 'react';
import { s, tone, type } from './theme.js';
import { CardHead } from './ui.js';
import { ENDPOINTS } from './endpoints.js';
import { relativeTime } from './derive.js';

/** role 的中文名。 */
const ROLE_LABEL = { consumer: '仅对话', admin: '全权（含管理面）' };

/** 观测面枚举（与网关 keys.go 的 surface* 常量一一对应）。 */
const SURFACES = [
  { id: 'status', label: '账号状态 /status' },
  { id: 'stats', label: '用量统计 /v1/stats' },
  { id: 'logs', label: '运行日志 /v1/logs' },
  { id: 'models_probes', label: '实测上限 /v1/models/probes' },
  { id: 'models_credits', label: '倍率记录 /v1/models/credits' },
  { id: 'accounts', label: '账号明细 /v1/accounts/*' },
];

/* ──────────────────────── 小工具 ──────────────────────── */

/** 集合可读摘要（与宿主 model-scope.js 的 describeScope 同义，前端只需展示）。 */
function scopeSummary(models) {
  if (models === null || models === undefined) return { kind: 'all', label: '全量' };
  if (!Array.isArray(models) || models.length === 0) return { kind: 'none', label: '空集' };
  if (models.length === 1 && models[0] === '*') return { kind: 'all', label: '全量' };
  return { kind: 'patterns', label: `${models.length} 条规则` };
}

/** 摘要对应的配色：空集是危险态（该 key 的 chat 会被全拒），必须显眼。 */
function scopeTone(kind) {
  if (kind === 'none') return tone.err;
  if (kind === 'all') return tone.idle;
  return tone.info;
}

/** 把规则数组解析成文本行（文本框 ↔ 数组两视图共用一个真相）。 */
function patternsToText(models) {
  if (!Array.isArray(models)) return '';
  return models.join('\n');
}

/** 文本行 → 规则数组（去空行、去首尾空白；**不**做合法性判断，交给宿主校）。 */
function textToPatterns(text) {
  return String(text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

/** 从 canonical id 取渠道段（"workbuddy:cn:x" → "workbuddy:cn"）。 */
function bucketOf(id) {
  const parts = String(id ?? '').split(':');
  return parts.length >= 3 ? `${parts[0]}:${parts[1]}` : (parts[0] ?? '');
}

/* ──────────────────────── 弹窗外壳 ──────────────────────── */

/** 居中遮罩弹窗（点遮罩关闭；点内容不冒泡）。 */
function Overlay({ children, onClose }) {
  return React.createElement(
    'div',
    {
      style: {
        position: 'fixed', inset: 0, zIndex: 95,
        background: 'rgba(15,23,42,.32)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      },
      onClick: onClose,
    },
    React.createElement(
      'div',
      {
        onClick: (event) => event.stopPropagation(),
        style: { ...s.card, width: 'min(720px, 100%)', maxHeight: '86vh', overflow: 'auto', marginBottom: 0, boxShadow: '0 12px 40px rgba(0,0,0,.2)' },
      },
      children,
    ),
  );
}

/* ──────────────────────── 一次性明文弹窗 ──────────────────────── */

/**
 * 密钥只在这里出现一次。
 *
 * 为什么做成阻塞式而不是 toast：网关此后任何接口都不再返回明文，用户没抄下来
 * 就只能重新轮换 —— 那会打断正在用的下游。故给大字号明文 + 复制按钮 +
 * 明确的「我已保存」出口。
 */
function SecretDialog({ name, value, onClose }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  return React.createElement(
    Overlay,
    { onClose },
    React.createElement('div', { style: type.text.heading }, `密钥：${name}`),
    React.createElement(
      'div',
      { style: { ...s.warn, marginTop: 10 } },
      '这段明文**只显示这一次**。关闭后网关不再返回它 —— 请立刻复制到下游配置里；'
      + '若没抄下来，只能回列表点「轮换」重新生成一把。',
    ),
    React.createElement(
      'div',
      {
        style: {
          ...s.code, marginTop: 12, padding: '10px 12px', borderRadius: 8,
          background: 'var(--dsw-alias-bg-layer-2,#f9f9fb)',
          border: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
          fontSize: 14, userSelect: 'all',
        },
      },
      value,
    ),
    React.createElement(
      'div',
      { style: { display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' } },
      React.createElement('button', { type: 'button', style: s.btnGhost, onClick: copy },
        copied ? '已复制 ✓' : '复制'),
      React.createElement('button', { type: 'button', style: s.btnPri, onClick: onClose }, '我已保存，关闭'),
    ),
  );
}

/* ──────────────────────── 集合编辑器 ──────────────────────── */

/**
 * 集合编辑器：两个快捷态 + 模型勾选 + 自由手写规则。
 *
 * 真相只有一个 —— `patterns` 数组。文本框与勾选框都从它派生、都写回它，
 * 避免"文本框改了勾选框没跟上"这类双真相不同步。
 */
function ScopeEditor({ catalog, patterns, onChange }) {
  const [filter, setFilter] = React.useState('');
  const selected = new Set(patterns);
  const buckets = React.useMemo(() => {
    const map = new Map();
    for (const item of catalog) {
      const key = bucketOf(item.id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()];
  }, [catalog]);

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };
  const addRule = (rule) => {
    if (selected.has(rule)) return;
    onChange([...patterns, rule]);
  };

  const keyword = filter.trim().toLowerCase();
  const matches = keyword === ''
    ? []
    : catalog.filter((item) => item.id.toLowerCase().includes(keyword)).slice(0, 40);

  // 三态用显式分支算出来（不写成嵌套三元：那既有可读性问题，也容易把
  // 「某个分支返回两个元素」写成非法的逗号表达式 —— 这里踩过一次）。
  let listSection;
  if (catalog.length === 0) {
    listSection = React.createElement('div', { style: { ...s.muted, marginTop: 6 } }, '目录加载中或不可得');
  } else if (keyword === '') {
    listSection = React.createElement(
      'div',
      { style: { ...s.muted, marginTop: 6 } },
      `共 ${catalog.length} 个模型（输入关键字搜索；也可用上面的渠道前缀一键覆盖）`,
    );
  } else {
    listSection = React.createElement(
      'div',
      {
        style: {
          marginTop: 6, maxHeight: 220, overflow: 'auto',
          border: '1px solid var(--dsw-alias-border-l2,#e5e7eb)', borderRadius: 8, padding: '6px 10px',
        },
      },
      ...(matches.length === 0
        ? [React.createElement('div', { key: 'none', style: s.muted }, '无匹配')]
        : matches.map((item) => React.createElement(
            'label',
            { key: item.id, style: { display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0', cursor: 'pointer' } },
            React.createElement('input', {
              type: 'checkbox',
              checked: selected.has(item.id),
              onChange: () => toggle(item.id),
            }),
            React.createElement('span', { style: { ...type.text.code, flex: 1 } }, item.id),
            React.createElement('span', { style: { ...type.text.caption } }, item.name ?? ''),
          ))),
    );
  }

  return React.createElement(
    'div',
    null,
    React.createElement(
      'div',
      { style: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' } },
      React.createElement('span', { style: { ...type.text.secondary } }, '快捷：'),
      React.createElement('button', {
        type: 'button', style: s.btnGhost, onClick: () => onChange(['*']),
      }, '全量（*）'),
      React.createElement('button', {
        type: 'button', style: s.btnGhost, onClick: () => onChange([]),
      }, '空集（全部拒绝）'),
      React.createElement('span', { style: { ...type.text.caption } },
        '规则只支持前缀通配，* 必须在末尾'),
    ),

    // 按渠道一键加前缀 —— 这是最高频的操作，放在勾选列表之前。
    catalog.length > 0
      ? React.createElement(
          'div',
          { style: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 } },
          ...buckets.map(([bucket, items]) => React.createElement('button', {
            key: bucket,
            type: 'button',
            style: { ...s.btnLink, padding: '2px 8px', border: '1px solid var(--dsw-alias-border-l2,#e5e7eb)', borderRadius: 999 },
            onClick: () => addRule(`${bucket}:*`),
            title: `加入规则 ${bucket}:*（该渠道全部 ${items.length} 个模型）`,
          }, `+ ${bucket}:*`)),
        )
      : null,

    React.createElement('div', { style: { ...s.label, marginTop: 12 } }, '规则（一行一条）'),
    React.createElement('textarea', {
      value: patternsToText(patterns),
      onChange: (event) => onChange(textToPatterns(event.target.value)),
      spellCheck: false,
      rows: Math.min(8, Math.max(2, patterns.length)),
      style: { ...s.input, height: 'auto', padding: '8px 10px', marginTop: 4, lineHeight: 1.7, resize: 'vertical' },
      placeholder: 'workbuddy:cn:*\ntraework:cn:qwen3.8-max',
    }),

    React.createElement('div', { style: { ...s.label, marginTop: 12 } }, '勾选具体模型（可选）'),
    React.createElement('input', {
      value: filter,
      onChange: (event) => setFilter(event.target.value),
      placeholder: '搜模型 id…',
      style: { ...s.input, marginTop: 4 },
    }),
    listSection,
  );
}

/* ──────────────────────── 新建 / 编辑弹窗 ──────────────────────── */

function KeyEditor({ rpcCall, initial, onCancel, onSaved }) {
  const isEdit = initial?.id !== undefined;
  const [name, setName] = React.useState(initial?.name ?? '');
  const [role, setRole] = React.useState(initial?.role ?? 'consumer');
  const [allow, setAllow] = React.useState(Array.isArray(initial?.allow) ? initial.allow : []);
  const [patterns, setPatterns] = React.useState(() => {
    if (initial === undefined || initial === null) return ['workbuddy:cn:*'];
    if (initial.models === null || initial.models === undefined) return ['*'];
    return Array.isArray(initial.models) ? [...initial.models] : ['*'];
  });
  const [catalog, setCatalog] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const result = await rpcCall(ENDPOINTS.getModels, {});
        if (!alive) return;
        const body = result?.ok ? result.value : undefined;
        const data = Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
        setCatalog(data.filter((item) => typeof item?.id === 'string').map((item) => ({ id: item.id, name: item.name })));
      } catch {
        if (alive) setCatalog([]);
      }
    })();
    return () => { alive = false; };
  }, [rpcCall]);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const payload = { name, models: patterns, role };
      if (role === 'admin') payload.allow = [];
      else payload.allow = allow;
      const result = isEdit
        ? await rpcCall(ENDPOINTS.patchApiKey, { id: initial.id, ...payload })
        : await rpcCall(ENDPOINTS.createApiKey, payload);
      if (!result?.ok) {
        setError(result?.error?.message ?? '保存失败');
        return;
      }
      onSaved(result.value?.key ?? null, isEdit);
    } catch (err) {
      setError(String(err?.message ?? err));
    } finally {
      setBusy(false);
    }
  };

  return React.createElement(
    Overlay,
    { onClose: busy ? () => {} : onCancel },
    React.createElement('div', { style: type.text.heading }, isEdit ? `编辑接入方：${initial.name}` : '新建接入方'),

    React.createElement('div', { style: { ...s.label, marginTop: 12 } }, '名称'),
    React.createElement('input', {
      value: name,
      onChange: (event) => setName(event.target.value),
      placeholder: '例如 workbuddy-switch / 我的另一台 DSH',
      style: { ...s.input, marginTop: 4 },
    }),

    React.createElement('div', { style: { ...s.label, marginTop: 12 } }, '权限'),
    React.createElement(
      'select',
      {
        value: role,
        onChange: (event) => setRole(event.target.value),
        style: { ...s.input, marginTop: 4 },
      },
      ...Object.entries(ROLE_LABEL).map(([value, label]) =>
        React.createElement('option', { key: value, value }, label)),
    ),

    role === 'consumer'
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement('div', { style: { ...s.label, marginTop: 12 } }, '额外放行的观测端点'),
          React.createElement('div', { style: { ...s.muted, marginTop: 2 } },
            '不勾 = 该 key 只能对话与拉模型。账号池 / 用量 / 日志默认不给下游。'),
          React.createElement(
            'div',
            { style: { display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 6 } },
            ...SURFACES.map((item) => React.createElement(
              'label',
              { key: item.id, style: { display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 12 } },
              React.createElement('input', {
                type: 'checkbox',
                checked: allow.includes(item.id),
                onChange: () => setAllow((prev) => (prev.includes(item.id)
                  ? prev.filter((x) => x !== item.id)
                  : [...prev, item.id])),
              }),
              item.label,
            )),
          ),
        )
      : React.createElement('div', { style: { ...s.warn, marginTop: 12 } },
          '「全权」= 该 key 可访问 /admin/*（改网关配置、关账号）。只给确实需要的用途。'),

    React.createElement('div', { style: { ...s.label, marginTop: 14 } }, '模型集合'),
    React.createElement(ScopeEditor, { catalog, patterns, onChange: setPatterns }),

    error !== '' ? React.createElement('div', { style: { ...s.err, marginTop: 12 } }, error) : null,
    React.createElement(
      'div',
      { style: { display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' } },
      React.createElement('button', { type: 'button', style: s.btnGhost, onClick: onCancel, disabled: busy }, '取消'),
      React.createElement('button', { type: 'button', style: s.btnPri, onClick: save, disabled: busy },
        busy ? '保存中…' : (isEdit ? '保存' : '创建')),
    ),
  );
}

/* ──────────────────────── 主 Tab ──────────────────────── */

export function ApiKeysTab({ rpcCall, showToast }) {
  const [state, setState] = React.useState({ loading: true, error: '', keys: [] });
  const [editor, setEditor] = React.useState(null);
  const [secret, setSecret] = React.useState(null);
  const [busyId, setBusyId] = React.useState('');
  const [previews, setPreviews] = React.useState({});

  const load = React.useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const result = await rpcCall(ENDPOINTS.getApiKeys, {});
      if (!result?.ok) {
        setState({ loading: false, error: result?.error?.message ?? '读取失败', keys: [] });
        return;
      }
      setState({ loading: false, error: '', keys: Array.isArray(result.value?.keys) ? result.value.keys : [] });
    } catch (error) {
      setState({ loading: false, error: String(error?.message ?? error), keys: [] });
    }
  }, [rpcCall]);

  React.useEffect(() => { load(); }, [load]);

  /** 统一的动作包装：置忙、报错、刷新列表。 */
  const act = async (id, endpoint, payload, okMessage) => {
    setBusyId(id);
    try {
      const result = await rpcCall(endpoint, payload);
      if (!result?.ok) {
        showToast?.(`失败：${result?.error?.message ?? '未知错误'}`);
        return undefined;
      }
      if (okMessage) showToast?.(okMessage);
      await load();
      return result.value;
    } catch (error) {
      showToast?.(`失败：${String(error?.message ?? error)}`);
      return undefined;
    } finally {
      setBusyId('');
    }
  };

  const preview = async (item) => {
    setPreviews((prev) => ({ ...prev, [item.id]: { loading: true } }));
    try {
      const result = await rpcCall(ENDPOINTS.previewApiKey, {
        models: item.models === null || item.models === undefined ? undefined : item.models,
      });
      setPreviews((prev) => ({
        ...prev,
        [item.id]: result?.ok
          ? { loading: false, data: result.value }
          : { loading: false, error: result?.error?.message ?? '预览失败' },
      }));
    } catch (error) {
      setPreviews((prev) => ({ ...prev, [item.id]: { loading: false, error: String(error?.message ?? error) } }));
    }
  };

  const remove = async (item) => {
    const ok = typeof window === 'undefined'
      ? true
      : window.confirm(`删除接入方「${item.name}」？\n\n该 key 立即失效（用它配置的下游会开始报 401）。\n历史用量会保留，但不再显示名字。`);
    if (!ok) return;
    await act(item.id, ENDPOINTS.deleteApiKey, { id: item.id }, '已删除');
  };

  const rotate = async (item) => {
    const ok = typeof window === 'undefined'
      ? true
      : window.confirm(`轮换「${item.name}」的密钥？\n\n旧密钥立即失效 —— 用它配置的下游必须同步换新，否则会一直 401。`);
    if (!ok) return;
    const value = await act(item.id, ENDPOINTS.rotateApiKey, { id: item.id });
    if (value?.key) setSecret(value.key);
  };

  const actions = React.createElement(
    React.Fragment,
    null,
    React.createElement('button', {
      type: 'button', style: s.btnPri, onClick: () => setEditor({ mode: 'create' }), disabled: state.loading,
    }, '＋ 新建接入方'),
    React.createElement('button', { type: 'button', style: s.btnGhost, onClick: load }, '刷新'),
  );

  return React.createElement(
    'div',
    null,
    React.createElement(
      'div',
      { style: s.card },
      React.createElement(CardHead, {
        title: '接入方（API Key）',
        extra: `${state.keys.length} 个`,
        actions,
      }),
      React.createElement(
        'div',
        { style: { ...s.muted, marginTop: 8 } },
        '每个下游用自己的一把 key，各自只看到自己集合内的模型；集合外的模型在对话接口上会被直接拒绝（403），且不消耗账号额度。',
        '面板拿的是**全量目录**（/admin/models），不受任何 key 的集合影响。',
      ),
      state.error !== ''
        ? React.createElement('div', { style: { ...s.err, marginTop: 10 } }, state.error)
        : null,
    ),

    state.loading && state.keys.length === 0
      ? React.createElement('div', { style: { ...s.card, ...s.muted } }, '加载中…')
      : null,

    state.keys.length === 0 && !state.loading && state.error === ''
      ? React.createElement(
          'div',
          { style: { ...s.card, ...s.muted } },
          '还没有接入方。当前所有下游共用网关配置里那把主 key（恒全量）。',
          '新建一把之后，就能按下游把模型目录收窄。',
        )
      : null,

    ...state.keys.map((item) => {
      const summary = scopeSummary(item.models);
      const st = scopeTone(summary.kind);
      const previewState = previews[item.id];
      return React.createElement(
        'div',
        { key: item.id, style: s.card },
        React.createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
          React.createElement('span', { style: { ...type.text.heading, flex: 1 } }, item.name),
          item.enabled === false
            ? React.createElement('span', { style: { ...s.tag, color: tone.idle.fg, background: tone.idle.bg } }, '已停用')
            : null,
          React.createElement('span', { style: { ...s.tag, color: st.fg, background: st.bg } }, summary.label),
          React.createElement('span', {
            style: { ...s.tag, color: item.role === 'admin' ? tone.warn.fg : tone.idle.fg, background: item.role === 'admin' ? tone.warn.bg : tone.idle.bg },
          }, ROLE_LABEL[item.role] ?? item.role),
        ),

        React.createElement(
          'div',
          { style: { ...s.code, marginTop: 8 } },
          item.key_prefix,
          React.createElement('span', { style: { ...type.text.caption, marginLeft: 8 } },
            '（只显示前后几位；完整密钥仅在创建/轮换时出现过一次）'),
        ),

        React.createElement(
          'div',
          { style: { ...s.muted, marginTop: 6 } },
          `最近使用：${item.last_used_at ? relativeTime(item.last_used_at) : '从未使用'}`,
          item.created_at ? `　创建于 ${relativeTime(item.created_at)}` : '',
          Array.isArray(item.allow) && item.allow.length > 0 ? `　额外放行：${item.allow.join('、')}` : '',
        ),

        // 规则明细：全量/空集不需要展开，规则集才列出来。
        summary.kind === 'patterns'
          ? React.createElement(
              'div',
              { style: { ...s.code, marginTop: 6, ...type.text.caption } },
              item.models.join('　'),
            )
          : null,

        previewState
          ? React.createElement(
              'div',
              { style: { ...(previewState.error ? s.err : s.tip), marginTop: 8 } },
              previewState.loading
                ? '推算中…'
                : previewState.error
                  ? `预览失败：${previewState.error}`
                  : `按规则推算：全量目录 ${previewState.data.total} 个，该 key 可见 ${previewState.data.visible} 个`
                    + `（${previewState.data.scope?.label ?? ''}）`
                    + '。这是按与网关逐条对齐的规则本地算的，不是实测值。',
            )
          : null,

        React.createElement(
          'div',
          { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 } },
          React.createElement('button', {
            type: 'button', style: s.btnGhost, disabled: busyId === item.id,
            onClick: () => preview(item),
          }, '预览可见模型'),
          React.createElement('button', {
            type: 'button', style: s.btnGhost, disabled: busyId === item.id,
            onClick: () => setEditor({ mode: 'edit', key: item }),
          }, '编辑'),
          React.createElement('button', {
            type: 'button', style: s.btnGhost, disabled: busyId === item.id,
            onClick: () => act(item.id, ENDPOINTS.patchApiKey,
              { id: item.id, enabled: item.enabled === false }, item.enabled === false ? '已启用' : '已停用'),
          }, item.enabled === false ? '启用' : '停用'),
          React.createElement('button', {
            type: 'button', style: s.btnGhost, disabled: busyId === item.id,
            onClick: () => rotate(item),
          }, '轮换密钥'),
          React.createElement('button', {
            type: 'button', style: { ...s.btnGhost, color: tone.err.fg }, disabled: busyId === item.id,
            onClick: () => remove(item),
          }, '删除'),
        ),
      );
    }),

    editor
      ? React.createElement(KeyEditor, {
          rpcCall,
          initial: editor.mode === 'edit' ? editor.key : undefined,
          onCancel: () => setEditor(null),
          onSaved: async (created, isEdit) => {
            setEditor(null);
            await load();
            if (!isEdit && created) setSecret(created);
            else showToast?.('已保存');
          },
        })
      : null,

    secret
      ? React.createElement(SecretDialog, {
          name: secret.name,
          value: secret.key,
          onClose: () => setSecret(null),
        })
      : null,
  );
}

// dsh-chanhub —— 客户端面板（浏览器侧，经 dsh.client.inject 加载）
//
// 结构（见 `.scratch/chanhub-panel/ui-design.md` §2）：
//   5 个 Tab：账号池 / 任务 / 用量 / 日志 / 配置，右侧显示连接状态。
//
// 设计风格严格对齐 dsh-bridge-gateway：同一套视觉令牌、同一套 RPC 调用封装、
// 同样经 ctx.slots.inject('settings.section', …) 注册。
//
// 数据边界（重要 —— 它决定了哪些区块显示「无数据」而不是编造值）：
//   真实可得：/status（账号池）、/v1/models、/v1/stats（若网关有）、
//             config.json（同机可读写）、auths/*.json（同机可读 → 渠道判定）
//   本仓 chanhub **不提供**：按账号任务状态、批量任务动作、单码执行、
//             用量分桶、日志端点。相关区块一律显式标注「网关未提供」，
//             并列出所需的后端端点 —— 如实呈现，不是掩盖缺陷。

import { s, tone, FOLD_CSS } from './theme.js';
import {
  CHANNEL_ORDER,
  GROWTH_CODES,
  INTUITION_FACTS,
  SCHOOL_SUBTASKS,
  SCHEDULE_ITEMS,
  accountState,
  channelResolver,
  codeBadges,
  codeCoverage,
  creditsSummary,
  formatDuration,
  formatNumber,
  groupByChannel,
  healthSummary,
  isZeroTime,
  maxInFlightOf,
  qualitySummary,
  realmAvailability,
  relativeTime,
  scheduleHoursText,
  scheduleState,
  summaryCounters,
} from './derive.js';
import { coerceField, fieldsByGroup, formatFieldValue, getPath } from '../lib/config-spec.js';

const CHANNEL = '/dsh-chanhub';
const name = 'dsh-chanhub';
const inject = ['slots', 'connection'];

/** RPC 端点（与宿主 lib/index.js 的 ENDPOINTS 保持一致）。 */
const ENDPOINTS = {
  getStatus: 'getStatus',
  getModels: 'getModels',
  getStats: 'getStats',
  probe: 'probe',
  getConfig: 'getConfig',
  saveConfig: 'saveConfig',
  getAccounts: 'getAccounts',
  getCredits: 'getCredits',
  getGrowthTasks: 'getGrowthTasks',
  getSchoolTasks: 'getSchoolTasks',
  getUsage: 'getUsage',
  getLogs: 'getLogs',
  getTasks: 'getTasks',
  runTask: 'runTask',
  growthWrite: 'growthWrite',
  accountDisable: 'accountDisable',
  accountEnable: 'accountEnable',
  accountRevive: 'accountRevive',
  serviceControl: 'serviceControl',
};

/** 六类可触发任务（与网关 scheduler 的任务名一一对应）。 */
const TASK_DEFS = [
  { name: 'checkin', label: '签到', icon: '📅', key: 'checkin' },
  // balance 第七类任务（网关 balance.go）：逐号查余额不签到，签到后余额才解冻的
  // 传统路径之外，给面板一个独立的「立即刷新余额」入口（改 expiring_soon 后即查）。
  { name: 'balance', label: '查余额', icon: '💰', key: 'balance' },
  { name: 'activity', label: '活跃地图', icon: '🗺', key: 'activity' },
  { name: 'travel', label: '猫猫旅行', icon: '🐱', key: 'travel' },
  { name: 'keepalive', label: 'token 保活', icon: '🔑', key: 'keepalive' },
  { name: 'school', label: '开学季', icon: '🎓', key: 'school' },
  { name: 'cat', label: '夜猫子', icon: '🌙', key: 'cat' },
];

/** 任务状态 → 视觉。 */
const TASK_STATUS_TONE = { ok: 'ok', already: 'info', fail: 'err', skipped: 'idle' };
const TASK_STATUS_LABEL = { ok: '已完成', already: '已签过', fail: '失败', skipped: '跳过' };

/** 用量窗口选项（与网关的 window 参数一致）。 */
const USAGE_WINDOWS = [
  { value: '24h', label: '24 小时' },
  { value: '72h', label: '3 天' },
  { value: '168h', label: '7 天' },
  { value: '720h', label: '30 天' },
];

/** Tab 定义。 */
const TABS = [
  { id: 'accounts', label: '账号池', icon: 'chart' },
  { id: 'tasks', label: '任务', icon: 'check' },
  { id: 'usage', label: '用量', icon: 'trend' },
  { id: 'logs', label: '日志', icon: 'list' },
  { id: 'config', label: '配置', icon: 'gear' },
];

const svg = (props, ...children) =>
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

const Icons = {
  gateway: (props) =>
    svg(
      { width: 18, height: 18, ...props },
      React.createElement('circle', { key: 'c', cx: 12, cy: 12, r: 9 }),
      React.createElement('path', { key: 'a', d: 'M3 12h18' }),
      React.createElement('path', { key: 'b', d: 'M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z' }),
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
};

/**
 * 语义色小标签。
 * @param props - `{text, tone, title}`。
 * @returns React 元素。
 */
function Tag({ text, tone: toneName = 'idle', title }) {
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
 * 「网关未提供此数据」的显式占位。
 *
 * 本面板的诚实性要求：数据源不存在时不隐藏区块、也不编造值，
 * 而是明确说出缺什么、后端需要补什么端点。
 *
 * @param props - `{title, needs, hint}`。
 * @returns React 元素。
 */
function Unavailable({ title, needs, hint }) {
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
function Fold({ summary, children, open = false, id }) {
  return React.createElement(
    'details',
    { className: 'dshc-fold', ...(open ? { open: true } : {}), ...(id ? { 'data-fold': id } : {}) },
    React.createElement('summary', null, summary),
    React.createElement('div', { className: 'dshc-body' }, children),
  );
}

/**
 * 概览卡：五联计数 + 域可用性条 + 总积分/渠道。
 *
 * 排版规则来自 ui-design.md §5.1（迭代 3 轮的成果）：
 *   总积分 24px 粗体绿在左，渠道竖排三行（名 10.5px / 积分 15px / 号数 10.5px）并排右侧，
 *   渠道间 1px 竖线。**`.row` 用 center 而不是 baseline** —— 竖排块较高，
 *   baseline 会错位（实测 20px，坑 3）。
 *
 * @param props - `{status, channelOf, onRefresh, refreshing}`。
 * @returns React 元素。
 */
function OverviewCard({ status, channelOf, onRefresh, refreshing }) {
  const counters = summaryCounters(status);
  const realms = realmAvailability(status?.realm_totals);
  const grouped = groupByChannel(status?.accounts ?? [], channelOf);
  const maxRealm = Math.max(1, ...realms.map((realm) => realm.total));

  return React.createElement(
    'div',
    { style: s.card },
    React.createElement(
      'div',
      { className: 'dshc-row', style: { justifyContent: 'space-between' } },
      React.createElement(
        'div',
        { style: { ...s.label, display: 'flex', alignItems: 'center', gap: 8 } },
        React.createElement(Icons.chart, { style: { width: 16, height: 16 } }),
        '概览',
      ),
      React.createElement(
        'div',
        { className: 'dshc-row' },
        React.createElement(
          'span',
          { style: s.muted },
          `${status?.healthy ?? 0} 可用 · ${formatNumber(grouped.total)} 积分`,
        ),
        React.createElement(
          'button',
          { type: 'button', style: s.btnLink, onClick: onRefresh, disabled: refreshing },
          React.createElement(Icons.refresh, null),
          refreshing ? '刷新中' : '刷新',
        ),
      ),
    ),

    // 五联
    React.createElement(
      'div',
      { className: 'dshc-five', style: { marginTop: 12 } },
      ...counters.map((counter) =>
        React.createElement(
          'div',
          {
            key: counter.label,
            style: {
              background: 'var(--dsw-alias-bg-layer-1,#fff)',
              border: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
              borderRadius: 8,
              padding: '8px 10px',
              minWidth: 0,
            },
          },
          React.createElement('div', { style: { ...s.muted, fontSize: 11 } }, counter.label),
          React.createElement(
            'div',
            { style: { fontSize: 18, fontWeight: 600, color: (tone[counter.tone] ?? tone.idle).fg } },
            String(counter.value),
          ),
        ),
      ),
    ),

    // 域可用性条（realm_totals 是 chanhub 独有字段）
    realms.length > 0
      ? React.createElement(
          'div',
          { style: { marginTop: 12 } },
          ...realms.map((realm) =>
            React.createElement(
              'div',
              { key: realm.realm, className: 'dshc-row', style: { marginBottom: 4 } },
              React.createElement('span', { style: { ...s.muted, width: 74, flexShrink: 0 } }, realm.label),
              React.createElement('span', { style: { ...s.muted, whiteSpace: 'nowrap' } },
                `${realm.healthy}/${realm.total} 可用`,
              ),
              React.createElement(
                'span',
                { className: 'dshc-palette' },
                React.createElement('span', {
                  style: {
                    width: `${(realm.healthy / maxRealm) * 100}%`,
                    background: tone.ok.fg,
                  },
                }),
              ),
              realm.cooling > 0
                ? React.createElement(Tag, { text: `冷却 ${realm.cooling}`, tone: 'warn' })
                : null,
              realm.disabled > 0
                ? React.createElement(Tag, { text: `禁用 ${realm.disabled}`, tone: 'err' })
                : null,
            ),
          ),
        )
      : null,

    // 总积分 / 渠道（竖排三行并排，center 对齐）
    React.createElement('div', { style: s.block },
      React.createElement(
        'div',
        { className: 'dshc-totalrow' },
        React.createElement(
          'div',
          null,
          React.createElement('div', { style: { ...s.muted, fontSize: 11 } }, '总积分（可消耗）'),
          React.createElement(
            'div',
            { style: { fontSize: 24, fontWeight: 700, color: tone.ok.fg, lineHeight: 1.2 } },
            formatNumber(grouped.total),
          ),
        ),
        React.createElement(
          'div',
          { className: 'dshc-channels' },
          ...grouped.channels.map((channel) =>
            React.createElement(
              'div',
              { key: channel.id, className: 'dshc-chan' },
              React.createElement('div', { style: { ...s.muted, fontSize: 10.5 } }, channel.label),
              React.createElement(
                'div',
                { style: { fontSize: 15, fontWeight: 600, color: 'var(--dsw-alias-label-primary,currentColor)' } },
                formatNumber(channel.credits),
              ),
              React.createElement('div', { style: { ...s.muted, fontSize: 10.5 } }, `${channel.count} 号`),
            ),
          ),
        ),
      ),
      React.createElement(
        'div',
        { style: { ...s.muted, marginTop: 8 } },
        `上游下发总额 ${formatNumber(grouped.creditsTotal)}；其中不可消耗部分不计入上方总数`,
        '（Trae 的 ep=1 专用池混算会导致按虚高余额选号）。',
      ),
    ),
  );
}

/**
 * 账号折叠面板（账号池与任务 Tab 共用）。
 *
 * @param props - `{account, maxInFlight, channel, onAction, busy, credits, scheduleConfig}`。
 * @returns React 元素。
 */
function AccountFold({ account, maxInFlight, channel, onAction, busy, credits, scheduleConfig }) {
  const state = accountState(account, maxInFlight);
  const dot = (tone[state.tone] ?? tone.idle).fg;
  const label = channelLabel(channel);

  const actionButton = (action) => {
    const text = { disable: '禁用', enable: '启用', revive: '复活' }[action];
    return React.createElement(
      'button',
      {
        key: action,
        type: 'button',
        style: { ...s.btnLink, opacity: busy ? 0.5 : 1 },
        disabled: busy,
        onClick: (event) => {
          event.preventDefault();
          event.stopPropagation();
          onAction(account, action);
        },
      },
      text,
    );
  };

  const summary = React.createElement(
    React.Fragment,
    null,
    React.createElement('span', { className: 'dshc-dot', style: { background: dot } }),
    React.createElement('span', { style: { ...s.label, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
      account.nickname || account.uid.slice(0, 8),
    ),
    label ? React.createElement(Tag, { text: label, tone: 'info' }) : null,
    account.realm ? React.createElement(Tag, { text: account.realm, tone: 'idle' }) : null,
    React.createElement(Tag, { text: state.label, tone: state.tone, title: state.detail || undefined }),
    React.createElement('span', { style: { ...s.muted, marginLeft: 'auto', textAlign: 'right' } },
      `${formatNumber(account.credits ?? 0)} 积分 · 在途 ${account.in_flight ?? 0} · ${account.success_count ?? 0}/${account.err_total ?? 0}`,
    ),
    // 折叠头右侧动作：必须是 span + pointer-events:none，否则会连带触发展开（坑 2）
    state.actions.length > 0
      ? React.createElement(
          'span',
          { style: { display: 'inline-flex', gap: 8, pointerEvents: 'none', flexShrink: 0 } },
          ...state.actions.map((action) =>
            React.createElement('span', { key: action, style: { ...s.btnLink, opacity: busy ? 0.5 : 1 } },
              { disable: '禁用', enable: '启用', revive: '复活' }[action],
            ),
          ),
        )
      : null,
  );

  return React.createElement(
    Fold,
    { summary },
    // 四组折叠：健康 / 质量 / 积分 / 任务。收起时也要能判断状态（摘要带关键数据）。
    React.createElement(
      Fold,
      { summary: React.createElement('span', { className: 'dshc-row', style: { minWidth: 0 } },
        React.createElement('span', { style: s.label }, '健康'),
        React.createElement('span', { style: s.muted }, healthSummary(account, state)),
      ) },
      React.createElement('div', { className: 'dshc-grid' },
        ...accountRow('UID', account.uid),
        ...accountRow('域', account.realm || '—'),
        ...accountRow('渠道', label || '—'),
        ...accountRow('在途', String(account.in_flight ?? 0)),
        ...accountRow('熔断计数', String(account.breaker_fails ?? 0)),
        ...accountRow('熔断至', isZeroTime(account.breaker_until) ? '—' : formatAbsolute(account.breaker_until)),
        ...accountRow('连败', String(account.consecutive_fails ?? 0)),
        ...accountRow('降权至', isZeroTime(account.degrade_until) ? '—' : formatAbsolute(account.degrade_until)),
        ...(account.cooling
          ? [
              ...accountRow('冷却类型', account.cool_kind || '—'),
              ...accountRow('冷却剩余', formatDuration(account.cool_remaining_sec)),
            ]
          : []),
        ...(account.manual_reason ? accountRow('手动停用原因', account.manual_reason) : []),
        ...(account.disabled_reason ? accountRow('系统禁用原因', account.disabled_reason) : []),
      ),
      // 动作按钮放在展开区（真正的 button，可点击）
      state.actions.length > 0
        ? React.createElement('div', { className: 'dshc-row', style: { marginTop: 10 } },
            ...state.actions.map((action) =>
              React.createElement(
                'button',
                {
                  key: action,
                  type: 'button',
                  style: s.btnGhost,
                  disabled: busy,
                  onClick: () => onAction(account, action),
                },
                { disable: '禁用（摘出选号池）', enable: '解除手动停用', revive: '复活（清系统禁用）' }[action],
              ),
            ),
          )
        : null,
      state.key === 'manual+disabled'
        ? React.createElement('div', { style: { ...s.warn, marginTop: 10 } },
            '该账号同时处于「手动停用」与「系统禁用」两个独立状态位。后端两者独立清除：',
            '需先「解除手动停用」再「复活」才能回到选号池 —— 点一次不会同时清掉两位。',
          )
        : null,
    ),

    React.createElement(
      Fold,
      { summary: React.createElement('span', { className: 'dshc-row', style: { minWidth: 0 } },
        React.createElement('span', { style: s.label }, '质量'),
        React.createElement('span', { style: s.muted }, qualitySummary(account)),
      ) },
      React.createElement('div', { className: 'dshc-grid' },
        ...accountRow('成功次数', String(account.success_count ?? 0)),
        ...accountRow('失败次数', String(account.err_total ?? 0)),
        ...accountRow('最近成功', relativeTime(account.last_success)),
        ...accountRow('最近失败', isZeroTime(account.last_err) ? '—' : relativeTime(account.last_err)),
        // C 类透出字段（网关 /status）：12153 判死进度，运维据此看到
        // 「连续 N 次 session dead，快禁用了」而不是等禁用才发现。
        ...accountRow('连续12153', String(account.session_dead_fails ?? 0)),
        ...accountRow('退避指数', String(account.retry_count ?? 0)),
      ),
      tokenUsageTable(account.token_usage),
    ),

    React.createElement(
      Fold,
      { summary: React.createElement('span', { className: 'dshc-row', style: { minWidth: 0 } },
        React.createElement('span', { style: s.label }, '积分'),
        React.createElement('span', { style: s.muted }, creditsSummary(account)),
      ) },
      React.createElement('div', { className: 'dshc-grid' },
        ...accountRow('可消耗积分', formatNumber(account.credits ?? 0)),
        // 快过期子集（选号第四因子 ×8 权重的快照）：运维核对「为什么它总被选」。
        ...(account.credits_expiring !== undefined
          ? accountRow('快过期积分', formatNumber(account.credits_expiring))
          : []),
        ...accountRow('上游总额', formatNumber(account.credits_total ?? 0)),
        ...accountRow('不可消耗', formatNumber(Math.max(0, (account.credits_total ?? 0) - (account.credits ?? 0)))),
      ),
      React.createElement(CreditsBreakdown, { credits, account }),
      modelCostsTable(account.model_costs),
      rateLimitedNotice(account.rate_limited_models),
    ),

    React.createElement(
      Fold,
      { summary: React.createElement('span', { className: 'dshc-row', style: { minWidth: 0 } },
        React.createElement('span', { style: s.label }, '任务'),
        React.createElement('span', { style: s.muted },
          scheduleFoldSummary(scheduleConfig),
        ),
      ) },
      // 排程区块（两级递进，ui-design §4.2）：折叠态一行 6 色块，展开看 6 项明细。
      // 数据源是两类真实信息：
      //   1. 排程配置（config.json schedule 段：启用状态 / 计划时刻）；
      //   2. 是否在可执行时间窗内（由小时表与本机时钟推导）。
      // 执行结果（已签与否/进行中）网关不透出 → scheduleState 返回 unknown，
      // 色块只表达「启用/窗口内/待窗口」，绝不编造执行状态。
      React.createElement('div', { className: 'dshc-row', style: { marginBottom: 8 } },
        ...SCHEDULE_ITEMS.map((item) => {
          const st = scheduleState(item, scheduleConfig);
          return React.createElement('span', {
            key: item.id,
            className: `dshc-dp ${st.key}`,
            title: `${st.label}：${scheduleHoursText(item, scheduleConfig)}` +
              (st.key === 'na' ? ' · 未启用/未配置' : st.inWindow ? ' · 时间窗内' : ' · 窗口外'),
          }, st.key === 'na' ? '—' : st.inWindow ? '●' : '·');
        }),
        React.createElement('span', { style: { ...s.muted, marginLeft: 4 } },
          scheduleFoldSummary(scheduleConfig),
        ),
      ),
      React.createElement('div', { style: { marginBottom: 8 } },
        ...SCHEDULE_ITEMS.map((item) => {
          const st = scheduleState(item, scheduleConfig);
          return React.createElement('div', { key: item.id, className: 'dshc-row', style: { minHeight: 22 } },
            React.createElement('span', { style: { ...s.label, minWidth: 90 } }, `${item.icon} ${item.label}`),
            React.createElement('span', { style: s.muted }, scheduleHoursText(item, scheduleConfig)),
            React.createElement(Tag, {
              text: st.key === 'na' ? '未启用' : st.inWindow ? '窗口内' : '窗口外',
              tone: st.key === 'na' ? 'idle' : 'info',
            }),
            item.note ? React.createElement('span', { style: s.muted }, item.note) : null,
          );
        }),
      ),
      React.createElement('div', { style: { ...s.muted, lineHeight: 1.7 } },
        '色块与标签只表达排程配置与时间窗（真实可读）；各任务的执行结果',
        '在「任务」Tab 经网关任务状态端点查看 —— 那里是网关实测数据，此处不重复。',
      ),
    ),
  );
}

/**
 * 任务折叠组的摘要：启用数 + 成长码数（真实计数）。
 * @param scheduleConfig - config.json 的 schedule 段（可空）。
 * @returns 摘要文本，如「4/6 项排程启用 · 24 个成长码」。
 */
function scheduleFoldSummary(scheduleConfig) {
  const enabled = SCHEDULE_ITEMS.filter((item) => scheduleState(item, scheduleConfig).key !== 'na').length;
  return `${enabled}/${SCHEDULE_ITEMS.length} 项排程启用 · ${GROWTH_CODES.length} 个成长码`;
}

/**
 * 逐套餐积分构成（chanhub 新增端点 GET /v1/accounts/{uid}/credits）。
 *
 * 排版要点：
 *   - 只列**还有余额**的套餐（真实数据里常有 79 个条目、大量已耗尽，
 *     全列会把面板撑爆且无信息量）；已耗尽的折叠计数。
 *   - 可消耗与不可消耗**分开统计**：混算会让用户按虚高余额判断账号价值
 *     （Trae 的 ep=1 专用池就是这样）。
 *   - 空 expires 不显示有效期列（不编造「永不过期」）。
 *
 * @param props - `{credits, account}`。
 * @returns React 元素。
 */
function CreditsBreakdown({ credits, account }) {
  if (credits && credits.available === false) {
    return React.createElement('div', { style: { ...s.muted, marginTop: 10, lineHeight: 1.7 } },
      credits.reason ?? '该网关版本未提供逐套餐明细端点。',
    );
  }
  if (!credits || credits.available !== true || !credits.credits) {
    return React.createElement('div', { style: { ...s.muted, marginTop: 10 } }, '逐套餐明细加载中…');
  }

  const data = credits.credits;
  const items = Array.isArray(data.items) ? data.items : [];
  const withBalance = items.filter((item) => (item.remain ?? 0) > 0);
  const spent = items.length - withBalance.length;

  if (items.length === 0) {
    return React.createElement('div', { style: { ...s.muted, marginTop: 10 } },
      '网关未返回任何套餐明细。',
    );
  }

  return React.createElement('div', { style: { marginTop: 10 } },
    React.createElement('div', { className: 'dshc-row', style: { marginBottom: 8 } },
      React.createElement(Tag, { text: `可用 ${formatNumber(data.usable_total ?? 0)}`, tone: 'ok' }),
      (data.unusable_total ?? 0) > 0
        ? React.createElement(Tag, { text: `不可消耗 ${formatNumber(data.unusable_total)}`, tone: 'warn' })
        : null,
      React.createElement(Tag, { text: `共 ${data.item_count ?? items.length} 个套餐`, tone: 'idle' }),
      spent > 0
        ? React.createElement(Tag, { text: `${spent} 个已耗尽`, tone: 'idle' })
        : null,
      typeof data.upstream_remain === 'number' && data.upstream_remain !== data.usable_total
        ? React.createElement(Tag, {
            text: `上游合计 ${formatNumber(data.upstream_remain)}（与明细求和不一致）`,
            tone: 'warn',
          })
        : null,
    ),
    React.createElement(
      'div',
      { className: 'dshc-tblwrap' },
      React.createElement('table', null,
        React.createElement('thead', null,
          React.createElement('tr', null,
            ...['套餐', '总量', '已用', '剩余', '有效期', ''].map((h) => React.createElement('th', { key: h }, h)),
          ),
        ),
        React.createElement('tbody', null,
          ...withBalance.map((item, index) =>
            React.createElement('tr', { key: `${item.name}-${item.expire_at}-${index}` },
              React.createElement('td', null, item.name),
              React.createElement('td', null, formatNumber(item.total ?? 0)),
              React.createElement('td', null, formatNumber(item.used ?? 0)),
              React.createElement('td', null, formatNumber(item.remain ?? 0)),
              React.createElement('td', null, item.expire_at ? formatAbsolute(item.expire_at) : '—'),
              React.createElement('td', null,
                item.usable === false
                  ? React.createElement(Tag, { text: '不可消耗', tone: 'warn' })
                  : null,
              ),
            ),
          ),
        ),
      ),
    ),
    React.createElement('div', { style: { ...s.muted, marginTop: 8, lineHeight: 1.7 } },
      '只列还有余额的套餐（已耗尽的 ' + spent + ' 个不显示）。',
      (data.unusable_total ?? 0) > 0
        ? '「不可消耗」指该额度池本网关用不了（如 Trae 的官方客户端专用池），不计入可用余额。'
        : '',
    ),
  );
}

/** 账号字段的一行（标签 + 值）。 */
function accountRow(label, value) {
  return [
    React.createElement('div', { key: `k-${label}`, style: { ...s.muted, minWidth: 78 } }, label),
    React.createElement('div', { key: `v-${label}`, style: { ...s.code, minWidth: 90 } }, value),
  ];
}

/** 渠道展示名。 */
function channelLabel(channel) {
  return { workbuddy: 'WB', traework: 'Trae', qoder: 'Qoder' }[channel] ?? '';
}

/** 绝对时间展示。 */
function formatAbsolute(iso) {
  const value = Date.parse(iso);
  if (!Number.isFinite(value) || value <= 0) return '—';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

/**
 * token 用量小表。
 * @param usage - `account.token_usage`。
 * @returns React 元素或 null。
 */
function tokenUsageTable(usage) {
  if (!usage || typeof usage !== 'object') return null;
  const rows = [
    ['请求数', formatNumber(usage.request_count ?? 0)],
    ['计费次数', formatNumber(usage.usage_count ?? 0)],
    ['Prompt', formatNumber(usage.prompt_tokens ?? 0)],
    ['Completion', formatNumber(usage.completion_tokens ?? 0)],
    ['合计', formatNumber(usage.total_tokens ?? 0)],
  ];
  return React.createElement(
    'div',
    { className: 'dshc-tblwrap', style: { marginTop: 10 } },
    React.createElement(
      'table',
      null,
      React.createElement('thead', null,
        React.createElement('tr', null, ...rows.map((row) =>
          React.createElement('th', { key: row[0] }, row[0]),
        )),
      ),
      React.createElement('tbody', null,
        React.createElement('tr', null, ...rows.map((row) =>
          React.createElement('td', { key: row[0] }, row[1]),
        )),
      ),
    ),
    React.createElement('div', { style: { ...s.muted, marginTop: 6 } },
      `最近延迟 ${usage.last_latency_ms ?? '—'} ms · 最近吞吐 ${formatLatency(usage.last_tokens_per_second)} · 最近模型 ${usage.last_model ?? '—'}`,
    ),
  );
}

/** 吞吐格式化（保留 1 位小数）。 */
function formatLatency(value) {
  return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(1)} tok/s` : '—';
}

/**
 * 每模型成本台账表（/status 的 model_costs，真实可得）。
 * @param costs - `account.model_costs`。
 * @returns React 元素或 null。
 */
function modelCostsTable(costs) {
  if (!Array.isArray(costs) || costs.length === 0) return null;
  return React.createElement(
    'div',
    { className: 'dshc-tblwrap', style: { marginTop: 10 } },
    React.createElement(
      'table',
      null,
      React.createElement('thead', null,
        React.createElement('tr', null,
          React.createElement('th', null, '模型'),
          React.createElement('th', null, '每 1k 积分'),
          React.createElement('th', null, '样本数'),
          React.createElement('th', null, '最近观测'),
        ),
      ),
      React.createElement('tbody', null,
        ...costs.map((cost) =>
          React.createElement('tr', { key: cost.model },
            React.createElement('td', null, cost.model),
            React.createElement('td', null, typeof cost.cost_per_1k === 'number' ? cost.cost_per_1k.toFixed(6) : '—'),
            React.createElement('td', null, String(cost.samples ?? '—')),
            React.createElement('td', null, relativeTime(cost.last_seen)),
          ),
        ),
      ),
    ),
  );
}

/**
 * 模型级限额提示。
 * @param list - `account.rate_limited_models`。
 * @returns React 元素或 null。
 */
function rateLimitedNotice(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return React.createElement(
    'div',
    { style: { ...s.warn, marginTop: 10 } },
    '模型级限额中：',
    ...list.map((item, index) =>
      React.createElement('div', { key: `${item.model}-${index}` },
        `${item.model} · 至 ${formatAbsolute(item.until)}${item.reason ? ` · ${item.reason}` : ''}`,
      ),
    ),
  );
}

/**
 * 账号池 Tab。
 *
 * 批量动作条（置顶，ui-design §2 要求）：接网关真实任务端点
 * POST /admin/tasks/{name}（与「任务」Tab 同一数据面）。五类手动可触发；
 * 触发后经「刷新」看 /admin/tasks/status 的逐号结果。
 *
 * @param props - `{status, channelOf, maxInFlight, onAction, busy, onRefresh, refreshing, error, creditsByUid, scheduleConfig, onRunTask, runningName, taskData}`。
 * @returns React 元素。
 */
function AccountsTab({ status, channelOf, maxInFlight, onAction, busy, onRefresh, refreshing, error, creditsByUid, scheduleConfig, onRunTask, runningName, taskData }) {
  const [filter, setFilter] = React.useState('all');
  const accounts = status?.accounts ?? [];

  const counts = React.useMemo(() => {
    const map = new Map();
    for (const account of accounts) {
      const channel = channelOf(account);
      map.set(channel, (map.get(channel) ?? 0) + 1);
    }
    return map;
  }, [accounts, channelOf]);

  const filtered = React.useMemo(
    () => (filter === 'all' ? accounts : accounts.filter((account) => channelOf(account) === filter)),
    [accounts, channelOf, filter],
  );

  // 任务运行状态（/admin/tasks/status）：批量按钮的运行中标记与触发回执。
  const taskList = Array.isArray(taskData?.tasks?.tasks) ? taskData.tasks.tasks : [];
  const byName = new Map(taskList.map((task) => [task.task, task]));
  const tasksUnavailable = taskData && taskData.available === false;

  const batchActions = [
    { id: 'checkin', label: '📅 全量签到' },
    { id: 'balance', label: '💰 查余额' },
    { id: 'keepalive', label: '🔑 token 保活' },
    { id: 'travel', label: '🐱 猫猫旅行' },
    { id: 'activity', label: '🗺 活跃上报' },
  ];

  return React.createElement(
    'div',
    null,
    error ? React.createElement('div', { style: { ...s.err, marginBottom: 14 } }, error) : null,

    React.createElement(OverviewCard, { status, channelOf, onRefresh, refreshing }),

    // 批量动作条（置顶，在筛选条上方；ui-design §2 排版要求）
    React.createElement('div', { style: s.card },
      React.createElement('div', { style: { ...s.label, marginBottom: 10 } }, '批量动作'),
      tasksUnavailable
        ? React.createElement('div', { className: 'dshc-row' },
            React.createElement('span', { style: { ...s.tag, background: tone.warn.bg, color: tone.warn.fg } }, '网关未开启'),
            React.createElement('span', { style: s.muted },
              '任务端点在网关 admin.enabled 门槛内；开启后这里可批量触发。',
            ),
          )
        : React.createElement('div', { className: 'dshc-row' },
            React.createElement('span', { style: { ...s.tag, background: tone.ok.bg, color: tone.ok.fg } }, '网关任务端点'),
            React.createElement('span', { style: s.muted }, '触发后异步执行；逐号结果见「任务」Tab 或点「刷新状态」。'),
          ),
      React.createElement('div', { className: 'dshc-row', style: { marginTop: 10 } },
        ...batchActions.map((action) => {
          const state = byName.get(action.id);
          const isRunning = runningName === action.id || state?.running === true;
          return React.createElement(
            'button',
            {
              key: action.id,
              type: 'button',
              style: { ...s.btnGhost, opacity: isRunning ? 0.5 : 1 },
              disabled: tasksUnavailable || isRunning,
              onClick: () => onRunTask(action.id),
              title: state?.last_end ? `上次执行：${relativeTime(state.last_end)}` : '尚未执行过',
            },
            `${action.label}${isRunning ? ' · 运行中' : ''}`,
          );
        }),
      ),
      React.createElement('div', { style: { ...s.warn, marginTop: 12 } }, INTUITION_FACTS.batchIndependent),
    ),

    // 渠道 / 域筛选
    React.createElement('div', { style: s.card },
      React.createElement('div', { className: 'dshc-row' },
        React.createElement('span', { style: { ...s.muted, marginRight: 4 } }, '渠道'),
        segmentButton('all', '全部', filter, setFilter, accounts.length),
        ...CHANNEL_ORDER.filter((id) => (counts.get(id) ?? 0) > 0).map((id) =>
          segmentButton(id, channelLabel(id), filter, setFilter, counts.get(id) ?? 0),
        ),
      ),

      // 账号折叠面板
      React.createElement('div', { style: s.block },
        filtered.length === 0
          ? React.createElement('div', { style: s.muted }, '该筛选下没有账号。')
          : React.createElement('div', null,
              ...filtered.map((account) =>
                React.createElement(AccountFold, {
                  key: account.uid,
                  account,
                  maxInFlight,
                  channel: channelOf(account),
                  onAction,
                  busy: Boolean(busy?.[account.uid]),
                  credits: creditsByUid?.[account.uid],
                  scheduleConfig,
                }),
              ),
            ),
      ),
    ),
  );
}

/** 分段筛选按钮。 */
function segmentButton(id, label, active, onChange, count) {
  const isActive = active === id;
  return React.createElement(
    'button',
    {
      key: id,
      type: 'button',
      onClick: () => onChange(id),
      style: {
        ...s.btnGhost,
        height: 28,
        padding: '0 12px',
        fontSize: 12,
        borderColor: isActive ? 'var(--dsw-alias-brand-primary,#4f6ef7)' : 'var(--dsw-alias-border-l2,#d1d5db)',
        color: isActive ? 'var(--dsw-alias-brand-primary,#4f6ef7)' : 'var(--dsw-alias-label-primary,currentColor)',
        fontWeight: isActive ? 600 : 400,
      },
    },
    `${label}${count === undefined ? '' : ` ${count}`}`,
  );
}

/**
 * 任务 Tab（账号为主轴）。
 *
 * 数据源（chanhub 新增端点，本插件配套实现）：
 *   GET  /admin/tasks/status  六类任务的运行状态 + 签到的逐账号结构化结果
 *   POST /admin/tasks/{name}  触发一类任务
 * 两者都在网关 admin.enabled 门槛内；未开启时本 Tab 明确显示所需配置。
 *
 * @param props - `{status, channelOf, maxInFlight, taskData, onRunTask, runningName, onRefresh}`。
 * @returns React 元素。
 */
function TasksTab({ status, channelOf, maxInFlight, taskData, growthData, schoolData, onRunTask, runningName, onRefresh, scheduleConfig, onGrowthWrite, growthWriteBusy, adminAvailable }) {
  const accounts = status?.accounts ?? [];
  // taskData 是宿主 getTasks 的 value，形如 {available, tasks:{tasks:[...]}}。
  // 逐层取并把非数组一律当空 —— 形状不符时降级为空表，而不是抛异常炸掉整个 Tab。
  const taskList = Array.isArray(taskData?.tasks?.tasks) ? taskData.tasks.tasks : [];
  const byName = new Map(taskList.map((task) => [task.task, task]));

  if (taskData && taskData.available === false) {
    return React.createElement(Unavailable, {
      title: '任务运行状态与手动触发',
      needs: 'GET /admin/tasks/status + POST /admin/tasks/{name}',
      hint: `${taskData.reason} 这些端点已在 chanhub 中实现，但需要网关开启管理面。`,
    });
  }

  return React.createElement(
    'div',
    null,
    // 批量动作区（真实可用）
    React.createElement('div', { style: s.card },
      React.createElement(
        'div',
        { className: 'dshc-row', style: { justifyContent: 'space-between' } },
        React.createElement('div', { style: { ...s.label } }, '批量任务'),
        React.createElement(
          'button',
          { type: 'button', style: s.btnLink, onClick: onRefresh },
          React.createElement(Icons.refresh, null),
          '刷新状态',
        ),
      ),
      React.createElement('div', { className: 'dshc-row', style: { marginTop: 10 } },
        ...TASK_DEFS.map((task) => {
          const state = byName.get(task.name);
          const busy = runningName === task.name || state?.running === true;
          return React.createElement(
            'button',
            {
              key: task.name,
              type: 'button',
              style: { ...s.btnGhost, opacity: busy ? 0.5 : 1 },
              disabled: busy,
              onClick: () => onRunTask(task.name),
              title: state?.last_end ? `上次执行：${relativeTime(state.last_end)}` : '尚未执行过',
            },
            `${task.icon} ${task.label}`,
            busy ? ' · 运行中' : '',
          );
        }),
      ),
      React.createElement('div', { style: { ...s.warn, marginTop: 12 } }, INTUITION_FACTS.batchIndependent),
      React.createElement('div', { style: { ...s.muted, marginTop: 8 } },
        '任务在网关侧异步执行（脚本类任务可能跑数分钟）；此处显示的是启动回执，结果经「刷新状态」查看。',
      ),
    ),

    // 执行状态（含签到的逐账号结构化结果）
    React.createElement('div', { style: s.card },
      React.createElement('div', { style: { ...s.label, marginBottom: 10 } }, '任务状态'),
      React.createElement('div', { className: 'dshc-row', style: { marginBottom: 8 } },
        ...TASK_DEFS.map((task) => {
          const state = byName.get(task.name);
          const glyph = state?.running ? '●' : state?.run_count > 0 ? '✓' : '·';
          const cls = state?.running ? 'dshc-dp run' : state?.run_count > 0 ? 'dshc-dp ok' : 'dshc-dp wait';
          return React.createElement('span', {
            key: task.name,
            className: cls,
            title: `${task.label}：${state ? `已执行 ${state.run_count} 次` : '尚未执行'}`,
          }, glyph);
        }),
        React.createElement('span', { style: { ...s.muted, marginLeft: 6 } },
          `${[...byName.values()].filter((t) => t.run_count > 0).length} / ${TASK_DEFS.length} 项执行过`,
        ),
      ),
      React.createElement(
        'div',
        { className: 'dshc-tblwrap' },
        React.createElement('table', null,
          React.createElement('thead', null,
            React.createElement('tr', null,
              ...['任务', '状态', '次数', '上次开始', '耗时', '错误'].map((h) =>
                React.createElement('th', { key: h }, h),
              ),
            ),
          ),
          React.createElement('tbody', null,
            ...TASK_DEFS.map((task) => {
              const state = byName.get(task.name);
              return React.createElement('tr', { key: task.name },
                React.createElement('td', null, `${task.icon} ${task.label}`),
                React.createElement('td', null,
                  React.createElement(Tag, {
                    text: state?.running ? '运行中' : state?.run_count > 0 ? '已执行' : '未执行',
                    tone: state?.running ? 'info' : state?.run_count > 0 ? 'ok' : 'idle',
                  }),
                ),
                React.createElement('td', null, String(state?.run_count ?? 0)),
                React.createElement('td', null, state?.last_start ? relativeTime(state.last_start) : '—'),
                React.createElement('td', null,
                  typeof state?.duration_sec === 'number' ? `${state.duration_sec.toFixed(1)}s` : '—',
                ),
                React.createElement('td', null,
                  state?.last_error
                    ? React.createElement('span', { style: { color: tone.err.fg } }, state.last_error.slice(0, 60))
                    : '—',
                ),
              );
            }),
          ),
        ),
      ),
    ),

    // 签到的逐账号结果（chanhub 比 panel 强的一点：结构化结果可查）
    React.createElement(CheckinOutcomesCard, { task: byName.get('checkin') }),

    // 开学季（真实子任务状态：来自网关 GET /v1/accounts/{uid}/school-tasks）
    React.createElement(SchoolTasksCard, {
      schoolData: schoolForAccount(schoolData, accounts),
      accountCount: (accounts || []).length,
      running: runningName === 'school',
      onRunTask,
    }),

    // 成长任务进度（真实数据：来自网关 GET /v1/accounts/{uid}/growth-tasks）
    React.createElement(GrowthTasksCard, {
      growthData: growthForAccount(growthData, accounts),
      accountCount: (accounts || []).length,
      onRefresh,
      onGrowthWrite,
      writeBusy: growthWriteBusy,
      adminAvailable,
    }),

    // 按账号（保留主轴结构）
    React.createElement('div', { style: s.card },
      React.createElement('div', { style: { ...s.label, marginBottom: 10 } }, '按账号查看'),
      accounts.length === 0
        ? React.createElement('div', { style: s.muted }, '暂无账号。')
        : React.createElement('div', null,
            ...accounts.map((account) =>
              React.createElement(AccountFold, {
                key: account.uid,
                account,
                maxInFlight,
                channel: channelOf(account),
                onAction: () => {},
                busy: false,
                scheduleConfig,
              }),
            ),
          ),
    ),
  );
}

/**
 * schoolForAccount 取「账号池顺序里第一个有数据」的开学季状态。
 * 与 growthForAccount 同理由：进度逐账号，合并会造出假进度。
 */
/**
 * firstGrowthAccountUid 取「进度数据可用的第一个账号 uid」：
 * 成长码写操作与进度查看同源（同一账号），保证面板显示的进度就是操作的进度。
 * @param growthByUid - getGrowthTasks 的逐账号结果表。
 * @returns uid 或 undefined。
 */
function firstGrowthAccountUid(growthByUid) {
  for (const [uid, entry] of Object.entries(growthByUid ?? {})) {
    if (entry?.available === true) return uid;
  }
  for (const [uid, entry] of Object.entries(growthByUid ?? {})) {
    if (entry) return uid;
  }
  return undefined;
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
  return undefined;
}

/** 开学季状态 → 视觉。 */
const SCHOOL_STATUS = {
  claimed: { text: '已领取', tone: 'ok' },
  completed: { text: '已完成', tone: 'ok' },
  pending: { text: '待完成', tone: 'warn' },
};

/**
 * 开学季子任务状态卡（真实数据）。
 *
 * 数据源：GET /v1/accounts/{uid}/school-tasks。
 * 关键语义：
 *   - in_period=false 时以下为**过期快照**，必须显示「活动未开始/已结束」；
 *   - recurring 任务每日重置：已领 + next_unlock_at → 显示「每日」角标，
 *     而不是让用户以为这个任务永远没了；
 *   - 人工项（学生认证）网关不可代做，如实标注。
 */
function SchoolTasksCard({ schoolData, accountCount, running, onRunTask }) {
  if (schoolData && schoolData.available === false) {
    return React.createElement(Unavailable, {
      title: '开学季子任务状态',
      needs: 'GET /v1/accounts/{uid}/school-tasks',
      hint: schoolData.reason,
    });
  }
  if (!schoolData || schoolData.available !== true) {
    return React.createElement('div', { style: s.card },
      React.createElement('div', { style: s.label }, '开学季子任务状态'),
      React.createElement('div', { style: { ...s.muted, marginTop: 8 } }, '加载中…'),
    );
  }

  const data = schoolData.school;
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const counts = data.counts ?? {};

  return React.createElement('div', { style: s.card },
    React.createElement('div', { className: 'dshc-row', style: { justifyContent: 'space-between' } },
      React.createElement('div', { style: { ...s.label } }, '🎓 开学季'),
      React.createElement('div', { className: 'dshc-row' },
        React.createElement(Tag, {
          text: data.in_period ? '活动进行中' : '活动未开始/已结束',
          tone: data.in_period ? 'ok' : 'warn',
          title: data.in_period ? undefined : 'in_period=false：以下状态为过期快照，不代表当前可操作',
        }),
        React.createElement(Tag, { text: `已领 ${counts.claimed ?? 0}/${counts.total ?? tasks.length}`, tone: 'ok' }),
        accountCount > 1 ? React.createElement(Tag, { text: `当前显示第 1 个账号（共 ${accountCount} 个）`, tone: 'idle' }) : null,
      ),
    ),
    React.createElement('div', { style: { ...s.tip, marginTop: 8, marginBottom: 10 } }, INTUITION_FACTS.schoolSeason()),

    tasks.length === 0
      ? React.createElement('div', { style: s.muted }, '网关未返回子任务。')
      : React.createElement('div', { className: 'dshc-sub' },
          ...tasks.map((task) => {
            const status = SCHOOL_STATUS[task.status] ?? { text: task.status ?? '—', tone: 'idle' };
            const done = ['claimed', 'completed'].includes(task.status);
            const recurring = task.task_type === 'recurring';
            // 人工项：学生认证（网关脚本会跳过它）
            const manual = task.task_code === 'task_student_verify';
            return React.createElement('div', { key: task.task_code, className: 'dshc-row', style: { marginBottom: 5 } },
              React.createElement('span', {
                className: done ? 'dshc-ck on' : manual ? 'dshc-ck na' : 'dshc-ck',
                title: done ? '已领取' : manual ? '人工项（网关不可代做）' : status.text,
              }, done ? '✓' : manual ? '—' : '○'),
              React.createElement('span', { style: { ...s.label, minWidth: 0, flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
                task.title || task.task_code,
              ),
              React.createElement('span', { style: { ...s.code, minWidth: 160 } }, task.task_code),
              task.has_progress
                ? React.createElement('span', { style: { ...s.code, minWidth: 44, textAlign: 'right' } }, `${task.current}/${task.target}`)
                : React.createElement('span', { style: { ...s.code, minWidth: 44, textAlign: 'right' } }, '—'),
              React.createElement(Tag, { text: status.text, tone: status.tone }),
              manual ? React.createElement(Tag, { text: '人工项', tone: 'idle' }) : null,
              recurring ? React.createElement(Tag, { text: '每日', tone: 'info' }) : null,
            );
          }),
        ),

    // recurring 任务的重置提示（已领但每日可再做）
    tasks.some((task) => task.task_type === 'recurring' && ['claimed', 'completed'].includes(task.status) && task.next_unlock_at)
      ? React.createElement('div', { style: { ...s.tip, marginTop: 10, lineHeight: 1.7 } },
          '标「每日」的任务每天可完成一次：上面显示的是**今日**状态，明日 00:00 重置后可再做',
          '（脚本 /admin/tasks/school 会自动补做）。',
        )
      : null,

    React.createElement('div', { style: s.block },
      React.createElement(
        'button',
        { type: 'button', style: { ...s.btnGhost, opacity: running ? 0.5 : 1 },
          disabled: running, onClick: () => onRunTask('school') },
        running ? '🎓 执行中…' : '🎓 执行开学季',
      ),
      React.createElement('span', { style: { ...s.muted, marginLeft: 10 } },
        '脚本整体执行（点亮 + 领奖 + 抽奖），执行后刷新可见逐项状态变化。',
      ),
    ),
    React.createElement('div', { style: { ...s.muted, marginTop: 8, lineHeight: 1.7 } }, data.note ?? ''),
  );
}

/**
 * growthForAccount 取「账号池顺序里第一个有数据」的成长任务进度。
 *
 * 为什么不并集合并：进度是逐账号的（各账号的 current/target 不同），
 * 合并会制造出谁都没有的假进度。首版先展示第一个账号，
 * 并在多账号时如实标注「当前显示第 1 个」。
 *
 * @param growthByUid - `{uid: growthData}`。
 * @param accounts - 账号池顺序。
 * @returns 单个账号的 growthData，或 undefined。
 */
function growthForAccount(growthByUid, accounts) {
  for (const account of accounts ?? []) {
    const entry = growthByUid?.[account.uid];
    if (entry && entry.available === true) return entry;
  }
  // 全都失败也取第一份（让卡片区显示「网关未提供」的原因，而不是加载中）
  for (const account of accounts ?? []) {
    const entry = growthByUid?.[account.uid];
    if (entry) return entry;
  }
  return undefined;
}

/**
 * 成长任务进度卡（真实数据）。
 *
 * 数据源：GET /v1/accounts/{uid}/growth-tasks（网关已合并两个下发口径）。
 *
 * 展示要点：
 *   - 「进行中未满」的码排前面（用户最关心「还差几个」）；
 *   - current=0 是真实值，必须显示 0/N（不能与「无进度」混同）；
 *   - 上游没下发 progress 对象的任务（如公益提问）显示「—」；
 *   - 已完成/已领的折叠成汇总行。
 *
 * @param props - `{growthData, accounts, onRefresh}`。
 * @returns React 元素。
 */
function GrowthTasksCard({ growthData, accountCount, onRefresh, onGrowthWrite, writeBusy, adminAvailable }) {
  if (growthData && growthData.available === false) {
    return React.createElement(Unavailable, {
      title: '成长任务进度（逐码）',
      needs: 'GET /v1/accounts/{uid}/growth-tasks',
      hint: growthData.reason,
    });
  }
  if (!growthData || growthData.available !== true) {
    return React.createElement('div', { style: s.card },
      React.createElement('div', { style: s.label }, '成长任务进度'),
      React.createElement('div', { style: { ...s.muted, marginTop: 8 } }, '加载中…'),
    );
  }

  const data = growthData.growth;
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  if (tasks.length === 0) {
    return React.createElement('div', { style: s.card },
      React.createElement('div', { style: s.label }, '成长任务进度'),
      React.createElement('div', { style: { ...s.muted, marginTop: 8 } },
        '网关未返回任何任务（账号可能无成长任务资格）。',
      ),
    );
  }

  // 分类：进行中未满 → 已完成 → 无进度对象
  const active = tasks.filter((t) =>
    t.has_progress && !['completed', 'claimed'].includes(t.accept_status) &&
    t.current < (t.target || 1));
  const done = tasks.filter((t) => ['completed', 'claimed'].includes(t.accept_status));
  const noProgress = tasks.filter((t) => !t.has_progress);
  const others = tasks.filter((t) =>
    t.has_progress && !['completed', 'claimed'].includes(t.accept_status) &&
    t.current >= (t.target || 1));

  const statusTone = { claimed: 'ok', completed: 'ok', accepted: 'info', in_progress: 'info', not_accepted: 'idle' };
  const statusLabel = {
    claimed: '已领取', completed: '已完成',
    accepted: '进行中', in_progress: '进行中', not_accepted: '未接受',
  };

  const renderRow = (t) => {
    const progress = t.has_progress ? `${t.current}/${t.target}` : '—';
    const full = t.has_progress && t.target > 0 && t.current >= t.target;
    const claimed = t.accept_status === 'claimed';
    const completed = t.accept_status === 'completed';
    const busyThis = writeBusy === `${t.task_code}`;
    // 单码动作（admin.enabled 门槛内；写操作真实推进状态）：
    //   - accepted（未满）→ 可 accept 重新推进（幂等：上游按码判重）
    //   - completed / 进度已满 → claim 领奖（幂等：重复领返回已领态不算失败）
    //   - claimed → 无动作（已完结）
    const showAccept = adminAvailable && !claimed && !completed && !t.locked;
    const showClaim = adminAvailable && (completed || full);
    return React.createElement('div', { key: t.task_code, className: 'dshc-row', style: { marginBottom: 5 } },
      // 左侧色条：进行中未满 = 橙（提示还有活干），已满/已领 = 绿
      React.createElement('span', {
        className: 'dshc-codebar',
        style: { background: full || ['completed', 'claimed'].includes(t.accept_status) ? tone.ok.fg : t.has_progress ? tone.warn.fg : 'transparent' },
      }),
      React.createElement('span', { style: { ...s.label, minWidth: 0, flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
        t.title || t.task_code,
      ),
      React.createElement('span', { style: { ...s.code, minWidth: 84 } }, t.task_code),
      React.createElement('span', { style: { ...s.code, minWidth: 46, textAlign: 'right' } }, progress),
      React.createElement(Tag, {
        text: statusLabel[t.accept_status] ?? t.accept_status ?? '—',
        tone: statusTone[t.accept_status] ?? 'idle',
      }),
      t.from_mp ? React.createElement(Tag, { text: '小程序', tone: 'info' }) : null,
      t.scheduled ? React.createElement(Tag, { text: `定时→${t.scheduled}`, tone: 'info' }) : null,
      t.locked ? React.createElement(Tag, { text: '已锁定', tone: 'warn' }) : null,
      showAccept
        ? React.createElement('button', {
            type: 'button', style: { ...s.btnGhost, height: 22, padding: '0 8px', fontSize: 11 },
            disabled: busyThis, onClick: () => onGrowthWrite('accept', t.task_code),
            title: '对上游 accept 该码（开始做；对话类码会真实发起对话）',
          }, busyThis ? '…' : '点亮')
        : null,
      showClaim
        ? React.createElement('button', {
            type: 'button', style: { ...s.btnGhost, height: 22, padding: '0 8px', fontSize: 11 },
            disabled: busyThis, onClick: () => onGrowthWrite('claim', t.task_code),
            title: '领取该码奖励（幂等：重复领取返回已领态，不算失败）',
          }, busyThis ? '…' : '领取')
        : null,
    );
  };

  return React.createElement('div', { style: s.card },
    React.createElement('div', { className: 'dshc-row', style: { justifyContent: 'space-between' } },
      React.createElement('div', { style: { ...s.label } }, '成长任务进度'),
      accountCount > 1 ? React.createElement(Tag, {
        text: `当前显示第 1 个账号（共 ${accountCount} 个）`,
        tone: 'idle',
        title: '成长任务进度是逐账号的；切换账号需在账号池展开对应账号。多账号的进度可能不同。',
      }) : null,
      React.createElement('div', { className: 'dshc-row' },
        React.createElement(Tag, { text: `已完成 ${done.length}/${tasks.length}`, tone: 'ok' }),
        active.length > 0 ? React.createElement(Tag, { text: `进行中 ${active.length}`, tone: 'warn' }) : null,
        // 「全部领取」：对当前 completed 未领的码逐个 claim（不自动 accept ——
        // accept 会引发真实对话副作用链，是否点亮由用户逐码决定）。
        adminAvailable
          ? React.createElement('button', {
              type: 'button', style: s.btnGhost,
              disabled: writeBusy === 'claim-claimable' || done.every((t) => t.accept_status === 'claimed'),
              onClick: () => onGrowthWrite('claim-claimable'),
              title: '领取当前全部已完成未领的奖励（幂等）',
            }, writeBusy === 'claim-claimable' ? '领取中…' : '全部领取')
          : null,
        React.createElement('button', { type: 'button', style: s.btnLink, onClick: onRefresh }, '刷新'),
      ),
    ),
    React.createElement('div', { style: { ...s.muted, marginTop: 6 } },
      `来源：上游成长任务列表（网关已合并默认与小程序两个下发口径${data.mp_error ? '；小程序口径查询失败：' + data.mp_error : ''}）。`,
      INTUITION_FACTS.scheduledCoverage(),
    ),

    // 进行中未满（最值得看的）
    active.length > 0
      ? React.createElement('div', { style: s.block },
          React.createElement('div', { style: { ...s.label, marginBottom: 6 } }, `进行中未满（${active.length}）`),
          ...active.map(renderRow),
        )
      : null,

    // 已满但状态未推进（accepted 且进度已满 —— 通常点一次执行即可领）
    others.length > 0
      ? React.createElement('div', { style: s.block },
          React.createElement('div', { style: { ...s.label, marginBottom: 6 } }, `进度已满（${others.length}）`),
          ...others.map(renderRow),
        )
      : null,

    // 无进度对象（公益提问等，无法代做）
    noProgress.length > 0
      ? React.createElement('div', { style: s.block },
          React.createElement('div', { style: { ...s.label, marginBottom: 6 } }, `无进度数据（${noProgress.length}）`),
          ...noProgress.map(renderRow),
          React.createElement('div', { style: { ...s.muted, marginTop: 6 } },
            '这些任务上游不下发进度对象（通常是不可代做的真实行为，如公益捐款）。',
          ),
        )
      : null,

    // 已完成折叠
    done.length > 0
      ? React.createElement(
          'details',
          { className: 'dshc-fold', style: { marginTop: 8 } },
          React.createElement('summary', null,
            React.createElement('span', { style: s.label }, `已完成 / 已领取（${done.length}）`),
            React.createElement('span', { style: { ...s.muted, marginLeft: 'auto' } }, '点开查看'),
          ),
          React.createElement('div', { className: 'dshc-body' }, ...done.map(renderRow)),
        )
      : null,

    React.createElement('div', { style: { ...s.muted, marginTop: 10, lineHeight: 1.7 } }, data.note ?? ''),
  );
}

/**
 * 签到的逐账号结果卡（chanhub 的能力：CheckinOutcome 结构化可查）。
 * @param props - `{task}`。
 * @returns React 元素或 null。
 */
function CheckinOutcomesCard({ task }) {
  const outcomes = task?.outcomes;
  if (!Array.isArray(outcomes) || outcomes.length === 0) return null;
  const summary = task.outcome_summary ?? {};

  return React.createElement('div', { style: s.card },
    React.createElement('div', { className: 'dshc-row', style: { justifyContent: 'space-between' } },
      React.createElement('div', { style: s.label }, '签到逐账号结果'),
      React.createElement('span', { style: s.muted },
        `${task.last_end ? relativeTime(task.last_end) : ''} · 耗时 ${typeof task.duration_sec === 'number' ? task.duration_sec.toFixed(1) : '—'}s`,
      ),
    ),
    React.createElement('div', { className: 'dshc-row', style: { marginTop: 10 } },
      React.createElement(Tag, { text: `共 ${summary.total ?? outcomes.length}`, tone: 'idle' }),
      React.createElement(Tag, { text: `成功 ${summary.ok ?? 0}`, tone: 'ok' }),
      React.createElement(Tag, { text: `已签过 ${summary.already ?? 0}`, tone: 'info' }),
      React.createElement(Tag, { text: `失败 ${summary.fail ?? 0}`, tone: (summary.fail ?? 0) > 0 ? 'err' : 'idle' }),
      React.createElement(Tag, { text: `跳过 ${summary.skipped ?? 0}`, tone: 'idle' }),
    ),
    React.createElement(
      'div',
      { className: 'dshc-tblwrap', style: { marginTop: 10 } },
      React.createElement('table', null,
        React.createElement('thead', null,
          React.createElement('tr', null,
            ...['账号', '结果', '签到后余额', '说明'].map((h) => React.createElement('th', { key: h }, h)),
          ),
        ),
        React.createElement('tbody', null,
          ...outcomes.map((oc) =>
            React.createElement('tr', { key: oc.uid },
              React.createElement('td', null, oc.nickname || oc.uid.slice(0, 8)),
              React.createElement('td', null,
                React.createElement(Tag, {
                  text: TASK_STATUS_LABEL[oc.status] ?? oc.status,
                  tone: TASK_STATUS_TONE[oc.status] ?? 'idle',
                }),
              ),
              React.createElement('td', null, typeof oc.credits === 'number' ? formatNumber(oc.credits) : '—'),
              React.createElement('td', null, oc.detail || '—'),
            ),
          ),
        ),
      ),
    ),
  );
}

/**
 * 用量 Tab。
 *
 * 两个数据源（都是 chanhub 真实端点）：
 *   GET /v1/stats          全局按模型（既有端点，18 字段，响应零变更）
 *   GET /v1/stats/buckets  四维分桶（新增：槽 × 域 × 账号 × 模型）
 *
 * @param props - `{stats, usage, usageWindow, onWindowChange, onRefresh}`。
 * @returns React 元素。
 */
function UsageTab({ stats, usage, usageWindow, onWindowChange, onRefresh }) {
  const bucketsAvailable = usage?.available === true;
  const usageData = usage?.usage;

  return React.createElement(
    'div',
    null,
    React.createElement('div', { style: s.card },
      React.createElement('div', { className: 'dshc-row', style: { justifyContent: 'space-between' } },
        React.createElement('div', { style: s.label }, '时序分桶'),
        React.createElement(
          'div',
          { className: 'dshc-row' },
          ...USAGE_WINDOWS.map((option) =>
            React.createElement(
              'button',
              {
                key: option.value,
                type: 'button',
                onClick: () => onWindowChange(option.value),
                style: {
                  ...s.btnGhost,
                  height: 26,
                  padding: '0 10px',
                  fontSize: 12,
                  borderColor: usageWindow === option.value ? 'var(--dsw-alias-brand-primary,#4f6ef7)' : undefined,
                  color: usageWindow === option.value ? 'var(--dsw-alias-brand-primary,#4f6ef7)' : undefined,
                },
              },
              option.label,
            ),
          ),
          React.createElement('button', { type: 'button', style: s.btnLink, onClick: onRefresh }, '刷新'),
        ),
      ),
      !bucketsAvailable
        ? React.createElement('div', { style: { ...s.tip, marginTop: 10 } },
            usage?.reason ?? '网关未提供分桶端点，需在网关侧支持 GET /v1/stats/buckets。',
          )
        : React.createElement(UsageBucketBody, { usage: usageData }),
    ),

    React.createElement(ModelStatsCard, { stats }),
  );
}

/**
 * 分桶视图主体：时序柱 + 三个维度的表格。
 * @param props - `{usage}`。
 * @returns React 元素。
 */
function UsageBucketBody({ usage }) {
  if (!usage) {
    return React.createElement('div', { style: { ...s.muted, marginTop: 10 } }, '加载中…');
  }
  const buckets = usage.buckets ?? [];
  const maxRequests = Math.max(1, ...buckets.map((bucket) => bucket.requests));

  return React.createElement(
    'div',
    { style: { marginTop: 12 } },
    // 降级提示必须如实显示
    usage.degraded
      ? React.createElement('div', { style: { ...s.warn, marginBottom: 10 } },
          '⚠️ 分桶键已超出容量上限，网关已降级为「槽 × 域」两维 —— 按账号 / 按模型两个维度将不再细分。',
        )
      : null,

    // 合计
    React.createElement('div', { className: 'dshc-five', style: { marginBottom: 12 } },
      ...usageStat('总请求', usage.total?.requests ?? 0),
      ...usageStat('成功', usage.total?.success ?? 0),
      ...usageStat('失败', usage.total?.failed ?? 0),
      ...usageStat('Prompt tokens', usage.total?.prompt_tokens ?? 0),
      ...usageStat('Completion tokens', usage.total?.completion_tokens ?? 0),
    ),

    // 时序柱
    buckets.length === 0
      ? React.createElement('div', { style: { ...s.muted, marginBottom: 12 } },
          '该窗口内没有请求记录。发起一次对话后即可看到分桶。',
        )
      : React.createElement('div', { style: { marginBottom: 14 } },
          React.createElement('div', { style: { ...s.muted, marginBottom: 6 } },
            `共 ${buckets.length} 个桶（窗口 ${usage.window}）`,
          ),
          React.createElement('div', { className: 'dshc-row', style: { alignItems: 'flex-end', gap: 3, overflowX: 'auto' } },
            ...buckets.slice(-48).map((bucket, index) =>
              React.createElement('span', {
                key: `${bucket.slot}-${bucket.uid}-${bucket.model}-${index}`,
                title: `${bucket.slot} · ${bucket.uid ? bucket.uid.slice(0, 8) : '全部账号'} · ${bucket.model || '全部模型'}\n请求 ${bucket.requests} · 失败 ${bucket.failed} · tokens ${bucket.total_tokens}`,
                style: {
                  width: 12,
                  flexShrink: 0,
                  height: Math.max(3, Math.round((bucket.requests / maxRequests) * 60)),
                  background: bucket.failed > 0 ? tone.warn.fg : tone.ok.fg,
                  borderRadius: 2,
                },
              }),
            ),
          ),
        ),

    // 三维表格
    ...['ByUID', 'ByRealm', 'ByModel'].map((key) => {
      const label = { ByUID: '按账号', ByRealm: '按域', ByModel: '按模型' }[key];
      const rows = usage[`by_${key.slice(2).toLowerCase()}`] ?? usage[key.toLowerCase()] ?? [];
      return React.createElement(
        'div',
        { key, style: { marginBottom: 12 } },
        React.createElement('div', { style: { ...s.label, marginBottom: 6 } }, label),
        rows.length === 0
          ? React.createElement('div', { style: s.muted }, '无数据')
          : React.createElement(
              'div',
              { className: 'dshc-tblwrap' },
              React.createElement('table', null,
                React.createElement('thead', null,
                  React.createElement('tr', null,
                    ...['键', '请求', '成功', '失败', 'Prompt', 'Completion', '合计', '扣费', '平均延迟'].map((h) =>
                      React.createElement('th', { key: h }, h),
                    ),
                  ),
                ),
                React.createElement('tbody', null,
                  ...rows.map((row) =>
                    React.createElement('tr', { key: row.key },
                      React.createElement('td', null, row.key),
                      React.createElement('td', null, formatNumber(row.requests ?? 0)),
                      React.createElement('td', null, formatNumber(row.success ?? 0)),
                      React.createElement('td', null, formatNumber(row.failed ?? 0)),
                      React.createElement('td', null, formatNumber(row.prompt_tokens ?? 0)),
                      React.createElement('td', null, formatNumber(row.completion_tokens ?? 0)),
                      React.createElement('td', null, formatNumber(row.total_tokens ?? 0)),
                      React.createElement('td', null, typeof row.credit === 'number' ? row.credit.toFixed(4) : '—'),
                      React.createElement('td', null, `${(row.avg_latency_ms ?? 0).toFixed(0)} ms`),
                    ),
                  ),
                ),
              ),
            ),
      );
    }),

    React.createElement('div', { style: { ...s.muted, marginTop: 8, lineHeight: 1.7 } }, usage.note ?? ''),
  );
}

/**
 * 全局按模型统计（/v1/stats，既有端点）。
 * @param props - `{stats}`。
 * @returns React 元素。
 */
function ModelStatsCard({ stats }) {
  if (!stats) {
    return React.createElement(Unavailable, {
      title: '全局按模型统计',
      needs: 'GET /v1/stats（本网关未提供）',
      hint: '该端点在 chanhub 中已实现（仅按模型聚合、仅内存）。',
    });
  }
  const models = Array.isArray(stats.models) ? stats.models : [];
  return React.createElement('div', { style: s.card },
    React.createElement('div', { className: 'dshc-row', style: { justifyContent: 'space-between' } },
      React.createElement('div', { style: s.label }, '全局按模型统计'),
      React.createElement(Tag, { text: `运行 ${formatDuration(stats.uptime_sec)}`, tone: 'idle' }),
    ),
    models.length === 0
      ? React.createElement('div', { style: { ...s.muted, marginTop: 10 } }, '暂无请求记录。')
      : React.createElement(
          'div',
          { className: 'dshc-tblwrap', style: { marginTop: 10 } },
          React.createElement('table', null,
            React.createElement('thead', null,
              React.createElement('tr', null,
                ...['模型', '请求', '成功', '失败', 'TTFB', '延迟', '吞吐', 'Prompt', 'Completion', '缓存命中', '扣费', '最近'].map((h) =>
                  React.createElement('th', { key: h }, h),
                ),
              ),
            ),
            React.createElement('tbody', null,
              ...models.map((model) =>
                React.createElement('tr', { key: model.model },
                  React.createElement('td', null, model.model),
                  React.createElement('td', null, formatNumber(model.requests ?? 0)),
                  React.createElement('td', null, formatNumber(model.success ?? 0)),
                  React.createElement('td', null, formatNumber(model.failed ?? 0)),
                  React.createElement('td', null, `${(model.avg_ttfb_ms ?? 0).toFixed(0)} ms`),
                  React.createElement('td', null, `${(model.avg_latency_ms ?? 0).toFixed(0)} ms`),
                  React.createElement('td', null, (model.tokens_per_sec ?? 0).toFixed(1)),
                  React.createElement('td', null, formatNumber(model.prompt_tokens ?? 0)),
                  React.createElement('td', null, formatNumber(model.completion_tokens ?? 0)),
                  React.createElement('td', null, `${((model.cache_hit_rate ?? 0) * 100).toFixed(1)}%`),
                  React.createElement('td', null, typeof model.credit === 'number' ? model.credit.toFixed(4) : '—'),
                  React.createElement('td', null, relativeTime(model.last_seen)),
                ),
              ),
            ),
          ),
        ),
    React.createElement('div', { style: { ...s.muted, marginTop: 10, lineHeight: 1.7 } },
      '⚠️ 该表的两个局限：**仅内存**（进程重启清零）、**只有模型一维**（无法回答「哪个账号用了多少」）。',
      '上面的分桶视图补上了账号 / 域 / 时序三个维度。',
    ),
  );
}

/** 用量统计小格。 */
function usageStat(label, value) {
  return [
    React.createElement(
      'div',
      {
        key: label,
        style: {
          background: 'var(--dsw-alias-bg-layer-1,#fff)',
          border: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
          borderRadius: 8,
          padding: '8px 10px',
          minWidth: 0,
        },
      },
      React.createElement('div', { style: { ...s.muted, fontSize: 11 } }, label),
      React.createElement('div', { style: { fontSize: 16, fontWeight: 600 } }, formatNumber(value)),
    ),
  ];
}

/**
 * 日志 Tab（chanhub 新增端点 GET /v1/logs，需网关 logs.enabled=true）。
 *
 * @param props - `{logs, logChannel, onChannelChange, onRefresh, onClear}`。
 * @returns React 元素。
 */
function LogsTab({ logs, logChannel, onChannelChange, onRefresh, onClear }) {
  if (logs && logs.available === false) {
    return React.createElement(
      'div',
      null,
      React.createElement(Unavailable, {
        title: '运行日志',
        needs: 'GET /v1/logs（需网关 config logs.enabled=true）',
        hint: `${logs.reason} 日志含 uid 与昵称，故网关默认不开启。`,
      }),
      React.createElement(ReactLogSection, null),
    );
  }

  const data = logs?.logs;
  const entries = data?.entries ?? [];

  return React.createElement(
    'div',
    null,
    React.createElement('div', { style: s.card },
      React.createElement('div', { className: 'dshc-row', style: { justifyContent: 'space-between' } },
        React.createElement('div', { style: { ...s.label } }, '运行日志'),
        React.createElement('div', { className: 'dshc-row' },
          React.createElement('span', { style: s.muted },
            data ? `${data.count} / ${data.capacity} 行` : '',
          ),
          React.createElement('button', { type: 'button', style: s.btnLink, onClick: onRefresh },
            React.createElement(Icons.refresh, null), '刷新'),
          React.createElement('button', { type: 'button', style: s.btnLink, onClick: onClear }, '清空缓冲'),
        ),
      ),

      // 频道 chip
      React.createElement('div', { className: 'dshc-row', style: { marginTop: 10, marginBottom: 10 } },
        ...[
          { value: 'all', label: '全部' },
          { value: 'chat', label: '对话' },
          { value: 'task', label: '任务' },
          { value: 'sys', label: '系统' },
        ].map((option) =>
          React.createElement(
            'button',
            {
              key: option.value,
              type: 'button',
              onClick: () => onChannelChange(option.value),
              style: {
                ...s.btnGhost, height: 26, padding: '0 12px', fontSize: 12,
                borderColor: logChannel === option.value ? 'var(--dsw-alias-brand-primary,#4f6ef7)' : undefined,
                color: logChannel === option.value ? 'var(--dsw-alias-brand-primary,#4f6ef7)' : undefined,
              },
            },
            option.label,
          ),
        ),
        data?.truncated
          ? React.createElement(Tag, { text: '已截断（只显示最近若干行）', tone: 'warn' })
          : null,
      ),

      entries.length === 0
        ? React.createElement('div', { style: s.muted },
            '该频道暂无日志。任务类日志需执行过任务；对话类日志需发起过对话请求。',
          )
        : React.createElement(
            'div',
            {
              className: 'dshc-log',
              style: {
                maxHeight: 420,
                overflowY: 'auto',
                background: 'var(--dsw-alias-bg-layer-1,#fff)',
                border: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
                borderRadius: 8,
                padding: '8px 10px',
              },
            },
            ...entries.map((entry, index) =>
              React.createElement(
                'div',
                {
                  key: `${entry.ts}-${index}`,
                  style: {
                    color: entry.level === 'ERR'
                      ? tone.err.fg
                      : entry.level === 'WARN'
                        ? tone.warn.fg
                        : 'var(--dsw-alias-label-primary,currentColor)',
                  },
                },
                entry.text,
              ),
            ),
          ),

      React.createElement('div', { style: { ...s.muted, marginTop: 10, lineHeight: 1.7 } }, data?.note ?? ''),
    ),

    React.createElement(ReactLogSection, null),
  );
}

/** 日志能力的实现说明（非端点数据，属于固定背景信息）。 */
function ReactLogSection() {
  return React.createElement('div', { style: s.card },
    React.createElement('div', { style: { ...s.label, marginBottom: 8 } }, '这套日志是怎么接入的'),
    React.createElement('div', { style: { ...s.tip, lineHeight: 1.8 } },
      '网关用 log.SetOutput(io.MultiWriter(os.Stderr, ring)) 一处接管，',
      '196 处既有日志调用点一行未改；原 stderr 行为保持不变，只是多复制一路进环形缓冲。',
      React.createElement('br', null),
      '唯一例外是对话流水行 —— 它走 fmt.Fprintf(os.Stdout, ...) 而非 log 包，',
      '所以单独挂了一路输出，否则「对话」频道会恒空。',
    ),
  );
}

/**
 * 配置 Tab：53 项分组折叠 + 危险语义标注 + 时长校验 + 服务控制。
 *
 * 写入走宿主直接改网关 config.json（若 host（宿主）与网关同机且文件可写）。
 * chanhub **没有配置热加载** —— 面板如实标注「需重启」，不做假的立即生效。
 *
 * @param props - `{configInfo, onSave, saving, onServiceControl, serviceControlResult, serviceBusy}`。
 * @returns React 元素。
 */
function ConfigTab({ configInfo, onSave, saving, onServiceControl, serviceControlResult, serviceBusy }) {
  const [draft, setDraft] = React.useState({});
  const groups = React.useMemo(() => fieldsByGroup(), []);

  const config = configInfo?.config ?? {};
  const editable = Boolean(configInfo?.ok && configInfo?.writable);

  const setField = (path, value) => setDraft((prev) => ({ ...prev, [path]: value }));
  const dirty = Object.keys(draft);

  /** 校验当前 draft，得到逐字段错误与「需重启」清单。 */
  const validation = React.useMemo(() => {
    const errors = {};
    const restart = new Set();
    const byPath = new Map();
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
      'div',
      null,
      React.createElement(Unavailable, {
        title: '网关配置读写',
        needs: '同机文件访问（config.json）',
        hint: configInfo.message,
      }),
      configInfo.candidates
        ? React.createElement('div', { style: s.card },
            React.createElement('div', { style: s.label, marginBottom: 8 }, '已探测的候选路径'),
            React.createElement('div', { style: { ...s.code, lineHeight: 1.8 } },
              ...configInfo.candidates.map((candidate) =>
                React.createElement('div', { key: candidate }, candidate),
              ),
            ),
            React.createElement('div', { style: { ...s.muted, marginTop: 8 } },
              '在插件设置里填写 gatewayConfigPath（宿主上的绝对路径）可直接指定。',
            ),
          )
        : null,
    );
  }

  return React.createElement(
    'div',
    null,
    React.createElement('div', { style: s.card },
      React.createElement('div', { className: 'dshc-row', style: { justifyContent: 'space-between' } },
        React.createElement('div', { style: s.label }, '网关配置（config.json 全量 53 项）'),
        React.createElement(Tag, {
          text: editable ? '可写' : '只读',
          tone: editable ? 'ok' : 'warn',
        }),
      ),
      React.createElement('div', { style: { ...s.muted, marginTop: 8, lineHeight: 1.7 } },
        `配置文件：${configInfo?.path ?? '—'}`,
      ),
      configInfo?.reason
        ? React.createElement('div', { style: { ...s.warn, marginTop: 10 } }, configInfo.reason)
        : null,
      !editable
        ? React.createElement('div', { style: { ...s.tip, marginTop: 10 } },
            '当前为只读：改动不会被保存。容器部署常见 `./config.json:/app/config.json:ro`，需去掉 `:ro` 后重启容器。',
          )
        : null,
    ),

    // 分组折叠
    ...groups.map((group) =>
      React.createElement(
        Fold,
        {
          key: group.id,
          id: `group-${group.id}`,
          open: group.openByDefault,
          summary: React.createElement('span', { className: 'dshc-row', style: { minWidth: 0 } },
            React.createElement('span', { style: s.label }, group.label),
            React.createElement('span', { style: s.muted }, `${group.fields.length} 项`),
            ...group.fields
              .filter((field) => field.danger)
              .slice(0, 1)
              .map((field) => React.createElement(Tag, { key: field.path, text: '含危险语义', tone: 'warn' })),
            dirty.some((path) => group.fields.some((field) => field.path === path))
              ? React.createElement(Tag, { text: '有改动', tone: 'info' })
              : null,
          ),
        },
        React.createElement('div', null,
          ...group.fields.map((field) =>
            React.createElement(ConfigField, {
              key: field.path,
              field,
              value: field.path in draft ? draft[field.path] : getPath(config, field.path),
              error: validation.errors[field.path],
              dirty: field.path in draft,
              disabled: !editable,
              onChange: (value) => setField(field.path, value),
              onReset: () =>
                setDraft((prev) => {
                  const next = { ...prev };
                  delete next[field.path];
                  return next;
                }),
            }),
          ),
        ),
      ),
    ),

    // 保存条
    React.createElement('div', { style: s.card },
      React.createElement('div', { className: 'dshc-row', style: { justifyContent: 'space-between' } },
        React.createElement('div', { style: { ...s.label } },
          dirty.length === 0 ? '没有待保存的改动' : `${dirty.length} 项待保存`,
        ),
        React.createElement('div', { className: 'dshc-row' },
          React.createElement(
            'button',
            {
              type: 'button',
              style: s.btnGhost,
              disabled: dirty.length === 0,
              onClick: () => setDraft({}),
            },
            '全部还原',
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              style: { ...s.btnPri, opacity: errorCount > 0 || !editable ? 0.5 : 1 },
              disabled: errorCount > 0 || !editable || dirty.length === 0 || saving,
              onClick: () => onSave(draft),
            },
            saving ? '保存中…' : '保存',
          ),
        ),
      ),
      errorCount > 0
        ? React.createElement('div', { style: { ...s.err, marginTop: 10 } }, `${errorCount} 项校验未通过，无法保存。`)
        : null,
      validation.restart.size > 0
        ? React.createElement('div', { style: { ...s.warn, marginTop: 10 } },
            `其中 ${validation.restart.size} 项属于「需重启」字段 —— chanhub 没有配置热加载，保存后需重启网关才生效。`,
          )
        : null,
    ),

    // 服务控制（放本 Tab 底部，与「需重启」说明同处）
    React.createElement('div', { style: s.card },
      React.createElement('div', { style: { ...s.label, marginBottom: 8 } }, '🔄 服务控制'),
      React.createElement('div', { style: { ...s.tip, marginBottom: 10, lineHeight: 1.7 } },
        'chanhub 自身没有重启能力（无热加载、无 SIGHUP 处理）。重启必须由**插件宿主**执行本机命令，',
        '因此默认关闭：需在插件设置里打开 allowServiceControl 并填写重启命令。',
      ),
      React.createElement('div', { style: { ...s.code, background: 'var(--dsw-alias-bg-layer-1,#fff)', padding: '8px 10px', borderRadius: 6 } },
        'docker compose restart <服务名>   # 白名单前缀之一',
      ),
      React.createElement('div', { className: 'dshc-row', style: { marginTop: 10 } },
        React.createElement(
          'button',
          {
            type: 'button',
            style: s.btnGhost,
            disabled: serviceBusy,
            onClick: onServiceControl,
          },
          serviceBusy ? '执行中…' : '一键重启服务',
        ),
      ),
      serviceControlResult
        ? React.createElement(
            'div',
            { style: { ...(serviceControlResult.ok ? s.tip : s.err), marginTop: 10, lineHeight: 1.7 } },
            serviceControlResult.ok
              ? `命令已执行：${serviceControlResult.command}`
              : `${serviceControlResult.message ?? '执行失败'}`,
            serviceControlResult.stdout
              ? React.createElement('div', { style: { ...s.code, marginTop: 6 } }, serviceControlResult.stdout)
              : null,
            serviceControlResult.stderr
              ? React.createElement('div', { style: { ...s.code, marginTop: 6 } }, serviceControlResult.stderr)
              : null,
          )
        : null,
    ),
  );
}

/**
 * 单个配置项输入。
 * @param props - `{field, value, error, dirty, disabled, onChange, onReset}`。
 * @returns React 元素。
 */
function ConfigField({ field, value, error, dirty, disabled, onChange, onReset }) {
  const inputProps = {
    style: {
      ...s.input,
      ...(error ? { borderColor: 'var(--dsw-alias-state-error-primary,#dc2626)' } : {}),
      ...(disabled ? { opacity: 0.6 } : {}),
    },
    disabled,
    value: formatFieldValue(field, value),
    onChange: (event) => onChange(event.target.value),
  };

  let control;
  if (field.type === 'bool') {
    control = React.createElement(
      'select',
      { ...inputProps, value: value === true ? 'true' : value === false ? 'false' : '' },
      React.createElement('option', { value: 'true' }, 'true'),
      React.createElement('option', { value: 'false' }, 'false'),
    );
  } else if (field.type === 'enum') {
    control = React.createElement(
      'select',
      inputProps,
      ...field.enumValues.split(',').map((option) =>
        React.createElement('option', { key: option, value: option }, option),
      ),
    );
  } else {
    control = React.createElement('input', { ...inputProps, type: 'text', placeholder: field.default ?? '' });
  }

  return React.createElement(
    'div',
    { style: { marginBottom: 10, minWidth: 0 } },
    React.createElement(
      'div',
      { className: 'dshc-row', style: { marginBottom: 4 } },
      React.createElement('span', { style: { ...s.label, minWidth: 150 } }, field.label),
      React.createElement('span', { style: { ...s.code, color: 'var(--dsw-alias-label-tertiary,#8b93a1)' } }, field.path),
      dirty
        ? React.createElement(
            'span',
            { style: { ...s.btnLink, cursor: 'pointer' }, onClick: onReset, title: '还原为当前文件值' },
            '还原',
          )
        : null,
      field.danger ? React.createElement(Tag, { text: '危险语义', tone: 'warn' }) : null,
      field.restart !== false ? React.createElement(Tag, { text: '需重启', tone: 'idle' }) : null,
      field.type ? React.createElement(Tag, { text: field.type, tone: 'idle' }) : null,
      field.default ? React.createElement('span', { style: s.muted }, `默认 ${field.default}`) : null,
    ),
    control,
    field.note
      ? React.createElement(
          'div',
          {
            style: {
              ...s.muted,
              marginTop: 4,
              ...(field.danger ? { color: tone.warn.fg } : {}),
            },
          },
          field.note,
        )
      : null,
    error
      ? React.createElement('div', { style: { ...s.muted, marginTop: 4, color: tone.err.fg } }, error)
      : null,
  );
}

/**
 * Tab 栏（复刻 dsh-bridge-gateway 的 TabBar：纯前端状态，非 DSH slot 机制）。
 *
 * @param props - `{active, onChange, statusText}`。
 * @returns React 元素。
 */
function TabBar({ active, onChange, statusText }) {
  return React.createElement(
    'div',
    { className: 'dshc-tabs' },
    ...TABS.map(({ id, label, icon }) => {
      const isActive = active === id;
      const TabIcon = Icons[icon];
      return React.createElement(
        'button',
        {
          key: id,
          type: 'button',
          onClick: () => onChange(id),
          style: {
            font: 'inherit',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: isActive ? 600 : 400,
            color: isActive
              ? 'var(--dsw-alias-state-business-primary,#4176e6)'
              : 'var(--dsw-alias-label-secondary,#6b7280)',
            borderBottom: isActive
              ? '2px solid var(--dsw-alias-brand-primary,#4f6ef7)'
              : '2px solid transparent',
            marginBottom: -1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          },
        },
        TabIcon ? React.createElement(TabIcon, { style: { flexShrink: 0 } }) : null,
        label,
      );
    }),
    React.createElement('span', { style: { ...s.muted, marginLeft: 'auto', paddingLeft: 12, whiteSpace: 'nowrap' } },
      statusText,
    ),
  );
}

/**
 * 主面板。
 * @param props - `{rpcCall}`。
 * @returns React 元素。
 */
function ChanhubPanel({ rpcCall }) {
  const [activeTab, setActiveTab] = React.useState('accounts');
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
  const [usageWindow, setUsageWindow] = React.useState('72h');
  const [logChannel, setLogChannel] = React.useState('all');
  const [runningTask, setRunningTask] = React.useState('');
  const [err, setErr] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  const [busyAccount, setBusyAccount] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [serviceBusy, setServiceBusy] = React.useState(false);
  const [serviceResult, setServiceResult] = React.useState(null);
  const [toast, setToast] = React.useState('');

  // 提示条的自动消失定时器。必须受控：组件卸载后仍触发的 setTimeout 会 setState
  // 到已卸载组件（React 会警告），并让面板的 8s 轮询在卸载后继续跑。
  const toastTimer = React.useRef(null);
  // creditsGeneration：明细补拉的世代号（只接受最新一代的结果，丢弃过期响应）。
  // unmountedRef：卸载后不再 setState。两者一起保证「切 Tab / 关面板」时
  // 在途的异步明细请求不会打到已拆卸的组件上。
  const creditsGeneration = React.useRef(0);
  const unmountedRef = React.useRef(false);
  React.useEffect(
    () => () => {
      unmountedRef.current = true;
    },
    [],
  );
  const showToast = React.useCallback((message, ms = 6000) => {
    setToast(message);
    if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      toastTimer.current = null;
      setToast('');
    }, ms);
  }, []);
  React.useEffect(
    () => () => {
      if (toastTimer.current !== null) clearTimeout(toastTimer.current);
    },
    [],
  );

  /** 拉一次全量数据。 */
  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const [statusResult, configResult, accountsResult, statsResult, tasksResult, usageResult, logsResult] =
        await Promise.all([
          rpcCall(ENDPOINTS.getStatus, {}),
          rpcCall(ENDPOINTS.getConfig, {}),
          rpcCall(ENDPOINTS.getAccounts, {}),
          rpcCall(ENDPOINTS.getStats, {}),
          rpcCall(ENDPOINTS.getTasks, {}),
          rpcCall(ENDPOINTS.getUsage, { window: usageWindow }),
          rpcCall(ENDPOINTS.getLogs, { channel: logChannel, limit: 500 }),
        ]);

      if (statusResult?.ok === false) {
        setErr(statusResult?.error?.message ?? '加载失败');
        setData(null);
        return;
      }
      setErr('');
      setData(statusResult?.value ?? null);
      setConfigInfo(configResult?.ok === false ? { ok: false, message: configResult?.error?.message } : configResult?.value ?? null);
      setAuthInfo(accountsResult?.value ?? null);
      setStats(statsResult?.value?.available ? statsResult.value.stats : null);
      setTasks(tasksResult?.value ?? null);
      setUsage(usageResult?.value ?? null);
      setLogs(logsResult?.value ?? null);

      // 逐套餐明细按账号逐个拉（上游一次只返回一个账号的明细），
      // 故不并入上面的 Promise.all —— 账号多时会拖慢首屏。
      // 失败静默降级为「不可用」，不干扰主数据渲染。
      const accounts = statusResult?.value?.status?.accounts ?? [];
      // 组件可能在明细返回前卸载（切 Tab / 关面板）：用 ref 标记，避免对已卸载
      // 组件 setState —— 那会在宿主控制台抛 "Cannot read properties of undefined"
      // 之类的异步异常（真机 e2e 里被测试框架捕获为 unhandledRejection）。
      const generation = ++creditsGeneration.current;
      void Promise.all(
        accounts.map(async (account) => {
          try {
            const result = await rpcCall(ENDPOINTS.getCredits, { uid: account.uid });
            return [account.uid, result?.value ?? { available: false, reason: '加载失败' }];
          } catch {
            return [account.uid, { available: false, reason: '加载失败' }];
          }
        }),
      ).then((entries) => {
        if (creditsGeneration.current !== generation || unmountedRef.current) return;
        setCreditsByUid(Object.fromEntries(entries));
      });

      // 成长任务进度按账号逐个拉（同明细：上游一次只查一个账号）。
      void Promise.all(
        accounts.map(async (account) => {
          try {
            const result = await rpcCall(ENDPOINTS.getGrowthTasks, { uid: account.uid });
            return [account.uid, result?.value ?? { available: false, reason: '加载失败' }];
          } catch {
            return [account.uid, { available: false, reason: '加载失败' }];
          }
        }),
      ).then((entries) => {
        if (creditsGeneration.current !== generation || unmountedRef.current) return;
        setGrowthByUid(Object.fromEntries(entries));
      });

      // 开学季子任务状态按账号逐个拉（同上：上游一次只查一个账号）。
      void Promise.all(
        accounts.map(async (account) => {
          try {
            const result = await rpcCall(ENDPOINTS.getSchoolTasks, { uid: account.uid });
            return [account.uid, result?.value ?? { available: false, reason: '加载失败' }];
          } catch {
            return [account.uid, { available: false, reason: '加载失败' }];
          }
        }),
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

  // 页面隐藏时暂停轮询（省网关开销），可见时恢复并立即刷一次。
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const handler = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  React.useEffect(() => {
    if (!visible) return undefined;
    const timer = setInterval(() => {
      void refresh();
    }, 8000);
    return () => clearInterval(timer);
  }, [visible, refresh]);

  /** 账号动作（带二次确认）。 */
  const onAccountAction = React.useCallback(
    async (account, action) => {
      const endpoint = {
        disable: ENDPOINTS.accountDisable,
        enable: ENDPOINTS.accountEnable,
        revive: ENDPOINTS.accountRevive,
      }[action];
      const label = account.nickname || account.uid.slice(0, 8);
      const confirmText = {
        disable: `确定把「${label}」摘出选号池（手动停用）？\n\n该账号仍保留在池里，签到与保活照常，可随时启用。`,
        enable: `确定解除「${label}」的手动停用？`,
        revive: `确定复活「${label}」（清除系统禁用状态）？`,
      }[action];
      if (typeof window !== 'undefined' && !window.confirm(confirmText)) return;

      let reason = '';
      if (action === 'disable' && typeof window !== 'undefined') {
        reason = window.prompt('停用原因（可选）：', '') ?? '';
      }

      setBusyAccount((prev) => ({ ...prev, [account.uid]: true }));
      try {
        const result = await rpcCall(endpoint, action === 'disable' ? { uid: account.uid, reason } : { uid: account.uid });
        if (result?.ok === false) {
          showToast(`操作失败：${result?.error?.message ?? '未知错误'}`);
        } else {
          const value = result?.value ?? {};
          // 叠加态提示：后端两位独立清除，一次点击不会同时回池。
          const stillDisabled = value.disabled === true && action !== 'revive';
          showToast(
            `已${action === 'disable' ? '停用' : action === 'enable' ? '启用' : '复活'}「${label}」` +
              (stillDisabled ? ' —— 注意：系统禁用位仍为 true，需再点「复活」才能回池。' : ''),
          );
          await refresh();
        }
      } catch (error) {
        showToast(`操作异常：${error?.message ?? error}`);
      } finally {
        setBusyAccount((prev) => ({ ...prev, [account.uid]: false }));
      }
    },
    [rpcCall, refresh, showToast],
  );

  /** 保存配置。 */
  const onSave = React.useCallback(
    async (patch) => {
      setSaving(true);
      try {
        const result = await rpcCall(ENDPOINTS.saveConfig, { patch });
        const value = result?.value ?? {};
        if (result?.ok === false) {
          showToast(`保存失败：${result?.error?.message ?? '未知错误'}`);
        } else if (value.ok === false) {
          showToast(`保存被拒绝：${value.message}`);
        } else {
          // 两路保存形状统一呈现：
          //   - 网关端点（P3）：hot_applied = 已就地生效；restart_required = 需重启；
          //   - 文件直写（降级）：restartRequiredCount = 需重启数（无热应用）。
          const parts = [`已写入 ${value.applied?.length ?? 0} 项`];
          const hot = Array.isArray(value.hot_applied) ? value.hot_applied.length : 0;
          const restart =
            Array.isArray(value.restart_required) ? value.restart_required.length
            : typeof value.restartRequiredCount === 'number' ? value.restartRequiredCount
            : 0;
          if (hot > 0) parts.push(`${hot} 项已即时生效`);
          if (restart > 0) parts.push(`${restart} 项需重启网关生效`);
          if (value.api_key_hint) parts.push(value.api_key_hint);
          showToast(parts.join(' · '), 8000);
          await refresh();
        }
      } catch (error) {
        showToast(`保存异常：${error?.message ?? error}`);
      } finally {
        setSaving(false);
      }
    },
    [rpcCall, refresh, showToast],
  );

  // 成长码写操作的逐码 busy 标记（值 = task_code 或 'claim-claimable'）。
  const [growthWriteBusy, setGrowthWriteBusy] = React.useState('');

  /** 单码/批量成长码写操作（点亮 accept / 领取 claim / 全部领取）。 */
  const onGrowthWrite = React.useCallback(
    async (action, code) => {
      const uid = firstGrowthAccountUid(growthByUid);
      if (!uid) {
        showToast('成长任务进度是逐账号的：当前没有可操作的账号数据。');
        return;
      }
      setGrowthWriteBusy(code ?? action);
      try {
        const result = await rpcCall(ENDPOINTS.growthWrite, {
          action,
          uid,
          codes: code ? [code] : undefined,
        });
        const value = result?.value ?? {};
        if (result?.ok === false) {
          showToast(`操作失败：${result.error?.message ?? '未知错误'}`);
        } else {
          const bad = (value.results ?? []).filter((r) => !r.ok);
          if (bad.length > 0) {
            showToast(`「${action}」部分失败：${bad.map((r) => `${r.code}（${r.detail}）`).join('；')}`, 8000);
          } else {
            showToast(action === 'claim-claimable' ? '已领取全部可领奖励。' : `「${code}」${action === 'accept' ? '已下发点亮' : '已领取'}。`);
          }
          await refresh();
        }
      } catch (error) {
        showToast(`操作异常：${error?.message ?? error}`);
      } finally {
        setGrowthWriteBusy('');
      }
    },
    [rpcCall, refresh, showToast, growthByUid],
  );

  /** 触发一类任务（异步：网关立即回执，结果经刷新查看）。 */
  const onRunTask = React.useCallback(
    async (name) => {
      const def = TASK_DEFS.find((task) => task.name === name);
      const label = def ? def.label : name;
      setRunningTask(name);
      try {
        const result = await rpcCall(ENDPOINTS.runTask, { name });
        const value = result?.value ?? {};
        if (result?.ok === false) {
          showToast(`触发「${label}」失败：${result.error?.message ?? '未知错误'}`);
        } else if (value.busy) {
          showToast(`「${label}」已在运行中 —— 网关未重复发起（避免重复打上游）。`);
        } else if (value.started) {
          showToast(`「${label}」已启动，正在网关侧异步执行；稍后刷新可见结果。`);
          // 脚本类任务可能跑数分钟，先刷一次让状态表显示「运行中」
          await refresh();
        } else {
          showToast(`「${label}」未被启动。`);
        }
      } catch (error) {
        showToast(`触发异常：${error?.message ?? error}`);
      } finally {
        setRunningTask('');
      }
    },
    [rpcCall, refresh, showToast],
  );

  /** 清空网关日志缓冲。 */
  const onClearLogs = React.useCallback(async () => {
    try {
      await rpcCall(ENDPOINTS.getLogs, { channel: logChannel, clear: true });
      await refresh();
    } catch (error) {
      showToast(`清空失败：${error?.message ?? error}`);
    }
  }, [rpcCall, logChannel, refresh, showToast]);

  /** 服务控制。 */
  const onServiceControl = React.useCallback(async () => {
    if (typeof window !== 'undefined' && !window.confirm('确定在宿主执行重启命令？这会短暂中断网关服务。')) return;
    setServiceBusy(true);
    setServiceResult(null);
    try {
      const result = await rpcCall(ENDPOINTS.serviceControl, {});
      setServiceResult(result?.value ?? { ok: false, message: result?.error?.message ?? '无响应' });
    } catch (error) {
      setServiceResult({ ok: false, message: String(error?.message ?? error) });
    } finally {
      setServiceBusy(false);
    }
  }, [rpcCall]);

  const channelOf = React.useMemo(
    () => channelResolver(authInfo?.ok ? authInfo.accounts : []),
    [authInfo],
  );

  const status = data?.status;
  const maxInFlight = maxInFlightOf(configInfo?.config);
  // admin 门槛可用性：探测 /admin/* 路由存在（405 判定）。true = 管理端点已开启，
  // 成长码写操作（点亮/领取）与批量任务按钮才出现；false = 如实隐藏并说明。
  const adminAvailable = data?.probe?.features?.admin === true || data?.probe?.features?.tasks === true;

  /** 顶部连接状态文案。 */
  const statusText = (() => {
    if (data?.reachable === false) return '● 未连接';
    if (data?.error) return `● ${data.error.code === 'auth-failed' ? '鉴权失败' : '异常'}`;
    if (data?.reachable === true) {
      const base = (data.baseURL ?? '').replace(/^https?:\/\//, '');
      return `● 已连接 ${base}`;
    }
    return '加载中…';
  })();

  return React.createElement(
    'div',
    { style: { display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 } },
    React.createElement('style', null, FOLD_CSS),

    // 顶部品牌行
    React.createElement(
      'div',
      { style: { ...s.card, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } },
      React.createElement(Icons.gateway, { style: { color: 'var(--dsw-alias-brand-primary,#4f6ef7)', width: 22, height: 22 } }),
      React.createElement(
        'div',
        { style: { minWidth: 0, flexGrow: 1 } },
        React.createElement('div', { style: { ...s.label, fontSize: 15 } }, 'chanhub 网关面板'),
        React.createElement('div', { style: s.muted },
          '账号池 · 积分 · 熔断冷却 · 配置 —— 数据直连 lament-z/chanhub（WorkBuddy2API）网关',
        ),
      ),
      React.createElement(Tag, {
        text: statusText,
        tone: data?.reachable === false || data?.error ? 'err' : data?.reachable ? 'ok' : 'idle',
      }),
    ),

    // 不可达时的说明（区分「网关没起来」与「key 不对」——处置完全不同）
    data?.reachable === false
      ? React.createElement('div', { style: { ...s.err, marginBottom: 14, lineHeight: 1.7 } },
          `无法连接网关：${data.error?.message ?? '未知原因'}`,
          React.createElement('div', { style: { marginTop: 6 } },
            '请确认网关已启动、地址正确，并在插件设置里配置 apiKeyEnv（默认 WB2API_API_KEY）。',
          ),
        )
      : null,
    data?.reachable === true && data?.error
      ? React.createElement('div', { style: { ...s.err, marginBottom: 14, lineHeight: 1.7 } },
          `网关可达，但取状态失败：${data.error.message}`,
          data.error.code === 'auth-failed'
            ? React.createElement('div', { style: { marginTop: 6 } },
                '网关确认在线，是 API key 不匹配。请在插件设置里核对 apiKeyEnv 指向的凭证，或网关 config.json 的 api_key。',
              )
            : null,
        )
      : null,
    err ? React.createElement('div', { style: { ...s.err, marginBottom: 14 } }, err) : null,

    React.createElement(TabBar, { active: activeTab, onChange: setActiveTab, statusText }),

    // Tab 内容
    activeTab === 'accounts'
      ? React.createElement(AccountsTab, {
          status,
          channelOf,
          maxInFlight,
          onAction: onAccountAction,
          busy: busyAccount,
          onRefresh: refresh,
          refreshing,
          error: '',
          creditsByUid,
          scheduleConfig: configInfo?.config?.schedule,
          onRunTask,
          runningName: runningTask,
          taskData: tasks,
        })
      : null,
    activeTab === 'tasks'
      ? React.createElement(TasksTab, {
          status,
          channelOf,
          maxInFlight,
          taskData: tasks,
          growthData: growthByUid,
          schoolData: schoolByUid,
          onRunTask,
          runningName: runningTask,
          onRefresh: refresh,
          scheduleConfig: configInfo?.config?.schedule,
          onGrowthWrite: onGrowthWrite,
          growthWriteBusy: growthWriteBusy,
          adminAvailable: adminAvailable,
        })
      : null,
    activeTab === 'usage'
      ? React.createElement(UsageTab, {
          stats,
          usage,
          usageWindow,
          onWindowChange: setUsageWindow,
          onRefresh: refresh,
        })
      : null,
    activeTab === 'logs'
      ? React.createElement(LogsTab, {
          logs,
          logChannel,
          onChannelChange: setLogChannel,
          onRefresh: refresh,
          onClear: onClearLogs,
        })
      : null,
    activeTab === 'config'
      ? React.createElement(ConfigTab, {
          configInfo,
          onSave,
          saving,
          onServiceControl,
          serviceControlResult: serviceResult,
          serviceBusy,
        })
      : null,

    // 轻量提示条
    toast
      ? React.createElement(
          'div',
          {
            style: {
              position: 'fixed',
              right: 20,
              bottom: 20,
              zIndex: 9999,
              maxWidth: 380,
              background: 'var(--dsw-alias-bg-layer-2,#fff)',
              border: '1px solid var(--dsw-alias-border-l2,#e5e7eb)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 12,
              lineHeight: 1.6,
              boxShadow: '0 6px 20px rgba(0,0,0,.12)',
              color: 'var(--dsw-alias-label-primary,currentColor)',
            },
          },
          toast,
        )
      : null,
  );
}

/** 注册到设置侧边栏（与 dsh-bridge-gateway 完全一致）。 */
function apply(ctx) {
  const rpcCall = async (endpoint, payload, signal) => {
    return ctx.connection.rpc.call(CHANNEL, endpoint, payload, signal);
  };

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'dsh-chanhub',
        order: 11,
        label: () => 'chanhub',
        inject: () => ({ rpcCall }),
      },
      ChanhubPanel,
    ),
  );
}

export { name, inject, apply };

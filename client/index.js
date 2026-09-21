// dsh-chanhub —— 客户端面板（浏览器侧，经 dsh.client.inject 加载）
//
// 结构（见 `.scratch/chanhub-panel/ui-design.md` §2）：
//   5 个 Tab：账号池 / 任务 / 用量 / 日志 / 配置；Tab 栏最右端是「＋ 添加账号」
//   （连接状态在顶栏，不在 Tab 栏）。
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
// 无状态基元下沉到 ui.js：用量页拆到 client/usage/ 后，两处都要用它们。
// 留在本文件会让 usage/* 反向 import 入口 —— 成环，打包后在模块初始化期
// 拿到 undefined（真机表现为整块面板白屏）。
import {
  CardHead,
  Fold,
  Icons,
  Tag,
  Unavailable,
  channelLabel,
  formatAbsolute,
  formatLatency,
  svg,
} from './ui.js';
import {
  CHANNEL_LABEL,
  CHANNEL_ORDER,
  GROWTH_CODES,
  SCHEDULE_ITEMS,
  accountExpiry,
  accountState,
  channelResolver,
  codeCoverage,
  creditBurn,
  creditStock,
  creditsSummary,
  earnedCredits,
  formatCompact,
  formatCredit,
  formatDuration,
  formatNumber,
  formatPercent,
  formatTokens,
  groupByChannel,
  heatGrid,
  healthSummary,
  overviewStats,
  hourlyProfile,
  isZeroTime,
  modelShares,
  maxInFlightOf,
  niceMax,
  qualitySummary,
  realmAvailability,
  realmLimitOf,
  relativeTime,
  scheduleHoursText,
  scheduleState,
  slotLabel,
  usageByDay,
  summaryCounters,
  tokenStructure,
  uptimeText,
  usageBySlot,
  usageShares,
  windowHours,
} from './derive.js';
import { coerceField, fieldsByGroup, formatFieldValue, getPath } from '../lib/config-spec.js';
import { CHANNEL, ENDPOINTS } from './endpoints.js';
import { AddAccountDialog } from './add-account.js';
import { UsageTab } from './usage/index.js';
import { QuickEntry } from './quick-entry.js';
import { createQuickStore, createSidebarPrefs } from './quick-store.js';

const name = 'dsh-chanhub';
/** 插件 settings 命名空间（与宿主 lib/index.js 的 SETTINGS_NAMESPACE 同值）。 */
const SETTINGS_NAMESPACE = 'dsh-chanhub';
// settingsScope：读写插件偏好（侧边栏入口开关）；remote/remote.settings：
// 打开设置面板（openSettingsDocument）。旧宿主缺这些服务时各自降级，不硬失败。
const inject = ['slots', 'connection', 'remote', 'remote.settings', 'settingsScope'];

/** RPC 端点（与宿主 lib/index.js 的 ENDPOINTS 保持一致）。 */

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

/** Tab 定义。 */
const TABS = [
  { id: 'accounts', label: '账号池', icon: 'chart' },
  { id: 'tasks', label: '任务', icon: 'check' },
  { id: 'usage', label: '用量', icon: 'trend' },
  { id: 'logs', label: '日志', icon: 'list' },
  { id: 'config', label: '配置', icon: 'gear' },
];


/**
 * 概览卡：五联计数 + 域可用性条 + 总积分/渠道。
 *
 * 排版规则来自 ui-design.md §5.1（迭代 3 轮的成果）：
 *   总积分 24px 粗体绿在左，渠道竖排三行（名 10.5px / 积分 15px / 号数 10.5px）并排右侧，
 *   渠道间 1px 竖线。**`.row` 用 center 而不是 baseline** —— 竖排块较高，
 *   baseline 会错位（实测 20px，坑 3）。
 *
 * @param props - `{status, channelOf, showDistribution, onToggleDistribution, earned}`。
 *   `earned` 是 `earnedCredits()` 的输出（赚得积分：逐套餐明细额度总量之和）。
 * @returns React 元素。
 */
function OverviewCard({ status, channelOf, showDistribution, onToggleDistribution, earned }) {
  const counters = summaryCounters(status);
  const realms = realmAvailability(status?.realm_totals);
  const grouped = groupByChannel(status?.accounts ?? [], channelOf);
  const maxRealm = Math.max(1, ...realms.map((realm) => realm.total));
  // 赚得积分的覆盖度必须显式写出来：拿不到明细的账号不计入，只报「已覆盖 N/M」
  // 而不是拿池内余额去凑一个看起来完整的总数。
  const earnTitle = earned
    ? '赚得积分 = 各账号逐套餐明细的额度总量之和（含已消耗掉的），涵盖签到 / 活动 / 拉新等来源。'
      + `已消耗 ${formatNumber(Math.round(earned.used))} · 剩余 ${formatNumber(Math.round(earned.remain))}。`
      + '已过期且上游不再下发的套餐不计入 —— 因此是下界。'
      + (earned.missing > 0 ? `另有 ${earned.missing} 个账号未取到明细，未计入。` : '')
    : '';

  // 赚得积分做成 KPI 格，紧跟「粘性会话」右侧、与其同行（见下方 ordered 插入逻辑）。
  // 之前的版本它是独占一行的 .dshc-chancards.one 卡，与粘性会话不在同一行、视觉上被读成
  // 另一个区块；现在归到 KPI 行、紧贴粘性会话，符合「同行、在右」的布局要求。
  const earnValue = earned && earned.covered > 0 ? formatCompact(Math.round(earned.total)) : '—';
  const earnSub = earned
    ? (earned.covered > 0
        ? `已消耗 ${formatCompact(Math.round(earned.used))}`
        : `${earned.count} 个账号均未取到套餐明细`)
    : '加载中…';
  const earnCounter = {
    key: 'earned',
    label: '赚得积分',
    value: earnValue,
    tone: 'ok',
    title: earnTitle,
    valueTitle: earned && earned.covered > 0 ? `精确值 ${formatNumber(Math.round(earned.total))}` : undefined,
    sub: earnSub,
  };
  // 粘性会话（status.sticky_sessions 为数字时出现）紧跟其后、再接赚得积分 ——
  // 两者同处一行、赚得在右。网关无粘性会话时不强行插空位，直接追加到末尾。
  const stickyIdx = counters.findIndex((c) => c.key === 'sticky');
  const ordered = stickyIdx >= 0
    ? [...counters.slice(0, stickyIdx + 1), earnCounter, ...counters.slice(stickyIdx + 1)]
    : [...counters, earnCounter];

  return React.createElement(
    'div',
    { style: s.card },
    // KPI 行：账号总数（点击展开渠道分布）+ 健康/冷却/在途满 + 粘性会话 + 赚得积分。
    // 赚得积分紧贴粘性会话右侧，与粘性会话同处一行（insert 在 sticky 之后）。
    React.createElement(
      'div',
      { className: 'dshc-kpis' },
      ...ordered.map((counter) => {
        const clickable = counter.key === 'total';
        const valueTitle = counter.valueTitle;
        const sub = counter.sub;
        return React.createElement(
          'button',
          {
            key: counter.label,
            type: 'button',
            className: 'dshc-kpi',
            onClick: clickable ? onToggleDistribution : undefined,
            title: counter.title ?? (clickable ? '点击查看渠道分布' : undefined),
            style: { ...s.kpi, cursor: clickable ? 'pointer' : 'default' },
          },
          React.createElement('div', { style: { ...s.muted, fontSize: 11 } },
            counter.label, clickable ? ' ▾' : ''),
          React.createElement(
            'div',
            {
              style: { fontSize: 20, fontWeight: 600, color: (tone[counter.tone] ?? tone.idle).fg },
              title: valueTitle,
            },
            String(counter.value),
          ),
          sub ? React.createElement('div', { style: { ...s.muted, fontSize: 10.5, marginTop: 2 } }, sub) : null,
        );
      }),
    ),

    // 渠道分布（点「账号总数」展开）
    showDistribution
      ? React.createElement(
          'div',
          { className: 'dshc-row', style: { marginTop: 10, paddingLeft: 4 } },
          ...grouped.channels.map((channel) =>
            React.createElement(Tag, {
              key: channel.id,
              text: `${channel.label} ${channel.count} 个账号`,
              tone: channel.count > 0 ? 'info' : 'idle',
            }),
          ),
        )
      : null,

    // 三渠道积分卡（WB / Trae / Qoder；无号的置灰占位）—— 这是**当前可用**，
    // 与 KPI 行里的「累计赚得」是两个数，别读成一个。
    React.createElement(
      'div',
      { className: 'dshc-chancards', style: { marginTop: 10 } },
      ...grouped.channels.map((channel) =>
        React.createElement(
          'div',
          { key: channel.id, className: `dshc-chancard${channel.count === 0 ? ' dim' : ''}` },
          React.createElement('div', { style: { ...s.muted, fontSize: 11 } }, channel.label),
          React.createElement(
            'div',
            {
              style: { fontSize: 22, fontWeight: 700, lineHeight: 1.3, color: channel.count > 0 ? tone.ok.fg : tone.idle.fg },
              title: `精确值 ${formatNumber(channel.credits)}`,
            },
            channel.count > 0 ? formatCompact(channel.credits) : '—',
          ),
          React.createElement('div', { style: { ...s.muted, fontSize: 10.5 } }, `${channel.count} 个账号`),
        ),
      ),
    ),

    // 域可用性条（realm_totals 独有数据，保留）
    realms.length > 0
      ? React.createElement(
          'div',
          { style: { marginTop: 10 } },
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
  );
}

/**
 * 账号折叠面板（账号池与任务 Tab 共用）。
 *
 * 现在是两层折叠：外层壳 + 四组（健康/质量/积分/任务）。
 * 详情抽屉里默认展开外层与健康/质量/积分三组，让「点开卡片就看到明细」；
 * 任务组保持折叠 —— 它展开是 6 项排程明细 + 说明，ui-design §6 刻意压成
 * 一行色块省高度（`defaultOpen` 只作用于前四层，不含任务组）。
 *
 * 注意「默认展开」≠「锁死展开」：`Fold` 收到的是固定 `open: true`，React 只在
 * 该值**变化**时写 DOM 属性，故用户手点的折叠在重渲染后保持。
 *
 * @param props - `{account, maxInFlight, channel, onAction, busy, credits, scheduleConfig, onRemove, defaultOpen}`。
 * @returns React 元素。
 */
function AccountFold({ account, maxInFlight, channel, onAction, busy, credits, scheduleConfig, onRemove, defaultOpen = false }) {
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
    { summary, open: defaultOpen },
    // 四组折叠：健康 / 质量 / 积分 / 任务。收起时也要能判断状态（摘要带关键数据）。
    React.createElement(
      Fold,
      { summary: React.createElement('span', { className: 'dshc-row', style: { minWidth: 0 } },
        React.createElement('span', { style: s.label }, '健康'),
        React.createElement('span', { style: s.muted }, healthSummary(account, state)),
      ), open: defaultOpen },
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
            ...onRemove
              ? [React.createElement('button', {
                  key: 'remove',
                  type: 'button',
                  style: { ...s.btnGhost, borderColor: tone.err.fg, color: tone.err.fg },
                  disabled: busy,
                  onClick: () => onRemove(account),
                }, '移除账号（删除凭证）')]
              : [],
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
      ), open: defaultOpen },
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
      ), open: defaultOpen },
      React.createElement('div', { className: 'dshc-grid' },
        ...accountRow('可消耗积分', formatNumber(account.credits ?? 0)),
        ...(isZeroTime(account.credits_at) ? [] : accountRow('余额更新于', relativeTime(account.credits_at))),
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
 * @param props - `{status, channelOf, maxInFlight, onAction, busy, onRefresh, error, creditsByUid, scheduleConfig, onRemove, authAccounts}`。
 * @returns React 元素。
 */
function AccountsTab({ status, channelOf, maxInFlight, limitOf, onAction, busy, onRefresh, error, creditsByUid, scheduleConfig, onRemove, authAccounts }) {
  // 在途上限按 realm 分档（与网关 pool.inFlightLimit 同规则）：global 号用
  // max_in_flight_global。缺 limitOf（旧调用）时回落到统一 maxInFlight。
  const limitFor = (account) => (typeof limitOf === 'function' ? limitOf(account) : maxInFlight);
  const [filter, setFilter] = React.useState('all');
  const [view, setView] = React.useState('card');
  const [showDistribution, setShowDistribution] = React.useState(false);
  const [detailAccount, setDetailAccount] = React.useState(null);
  const accounts = status?.accounts ?? [];
  // 赚得积分：逐套餐明细求和（口径见 derive.earnedCredits）。
  const earned = React.useMemo(
    () => earnedCredits(accounts, creditsByUid),
    [accounts, creditsByUid],
  );

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

  return React.createElement(
    'div',
    null,
    error ? React.createElement('div', { style: { ...s.err, marginBottom: 14 } }, error) : null,

    React.createElement(OverviewCard, {
      status,
      channelOf,
      showDistribution,
      onToggleDistribution: () => setShowDistribution((v) => !v),
      earned,
    }),

    // 渠道 / 域筛选 + 视图切换 + 账号列表
    React.createElement('div', { style: s.card },
      React.createElement('div', { className: 'dshc-row', style: { justifyContent: 'space-between' } },
        React.createElement('div', { className: 'dshc-row' },
          React.createElement('span', { style: { ...s.muted, marginRight: 4 } }, '渠道'),
          segmentButton('all', '全部', filter, setFilter, accounts.length),
          ...CHANNEL_ORDER.filter((id) => (counts.get(id) ?? 0) > 0).map((id) =>
            segmentButton(id, channelLabel(id), filter, setFilter, counts.get(id) ?? 0),
          ),
        ),
        React.createElement(ViewToggle, { view, setView }),
      ),


      // 账号区：卡片式（默认，点开抽屉详情）或列表式
      React.createElement('div', { style: s.block },
        filtered.length === 0
          ? React.createElement('div', { style: s.muted }, '该筛选下没有账号。')
          : view === 'card'
            ? React.createElement('div', { className: 'dshc-acctgrid' },
                ...filtered.map((account) =>
                  React.createElement(AccountCard, {
                    key: account.uid,
                    account,
                    maxInFlight: limitFor(account),
                    channel: channelOf(account),
                    liveCredits: creditsByUid?.[account.uid],
                    authAccounts,
                    onOpen: () => setDetailAccount(account),
                  }),
                ),
              )
            : React.createElement('div', { className: 'dshc-tblwrap' },
                React.createElement('table', null,
                  React.createElement('thead', null,
                    React.createElement('tr', null,
                      ...['账号', '渠道', '状态', '积分', '到期', '在途', '成功/失败'].map((h) =>
                        React.createElement('th', { key: h }, h))),
                  ),
                  React.createElement('tbody', null,
                    ...filtered.map((account) => {
                      const st = accountState(account, limitFor(account));
                      const exp = accountExpiry({
                        account,
                        authAccounts,
                        creditsDetail: creditsByUid?.[account.uid],
                      });
                      return React.createElement('tr', { key: account.uid },
                        React.createElement('td', null, account.nickname || account.uid.slice(0, 8)),
                        React.createElement('td', null, channelLabel(channelOf(account)) || '—'),
                        React.createElement('td', null,
                          React.createElement(Tag, { text: st.label, tone: st.tone, title: st.detail || undefined })),
                        React.createElement('td', null, formatNumber(account.credits ?? 0)),
                        React.createElement('td', null, exp
                          ? React.createElement(ExpiryChip, { expiry: exp })
                          : '—'),
                        React.createElement('td', null, `${account.in_flight ?? 0}/${limitFor(account) ?? '—'}`),
                        React.createElement('td', null, `${account.success_count ?? 0}/${account.err_total ?? 0}`),
                      );
                    }),
                  ),
                ),
              ),
      ),
    ),

    // 账号详情抽屉（点卡片弹出；复用 AccountFold 的完整明细）
    detailAccount
      ? React.createElement(AccountDrawer, {
          account: detailAccount,
          maxInFlight: limitFor(detailAccount),
          channel: channelOf(detailAccount),
          credits: creditsByUid?.[detailAccount.uid],
          scheduleConfig,
          onAction,
          busy,
          onRemove,
          onClose: () => setDetailAccount(null),
        })
      : null,
  );
}

/**
 * 账号详情抽屉：右侧滑出，承载原 AccountFold 的健康/质量/积分明细。
 * @param props - `{account, maxInFlight, channel, credits, scheduleConfig, onAction, busy, onRemove, onClose}`。
 */
function AccountDrawer({ account, maxInFlight, channel, credits, scheduleConfig, onAction, busy, onRemove, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return React.createElement(
    'div',
    null,
    React.createElement('div', { className: 'dshc-drawer-mask', onClick: onClose }),
    React.createElement(
      'div',
      { className: 'dshc-drawer' },
      React.createElement('button', { type: 'button', className: 'dshc-drawer-close', onClick: onClose, title: '关闭' }, '✕'),
      React.createElement('div', { className: 'dshc-row', style: { marginBottom: 12 } },
        React.createElement('span', { style: { ...s.label, fontSize: 15 } }, account.nickname || account.uid.slice(0, 8)),
        channelLabel(channel) ? React.createElement(Tag, { text: channelLabel(channel), tone: 'info' }) : null,
        account.realm ? React.createElement(Tag, { text: account.realm, tone: 'idle' }) : null,
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
        defaultOpen: true,
      }),
    ),
  );
}
function ViewToggle({ view, setView }) {
  return React.createElement(
    'span',
    { className: 'dshc-viewtoggle' },
    React.createElement('button', {
      type: 'button', className: view === 'card' ? 'on' : '', onClick: () => setView('card'), title: '卡片视图',
    }, React.createElement(Icons.cardView, null), '卡片'),
    React.createElement('button', {
      type: 'button', className: view === 'list' ? 'on' : '', onClick: () => setView('list'), title: '列表视图',
    }, React.createElement(Icons.listView, null), '列表'),
  );
}

/**
 * 账号卡片（一行最主要有用的信息；点开抽屉看全部明细）。
 * @param props - `{account, maxInFlight, channel, onOpen, liveCredits, authAccounts}`。
 */
function AccountCard({ account, maxInFlight, channel, onOpen, liveCredits, authAccounts }) {
  const state = accountState(account, maxInFlight);
  // 到期：凭证到期优先（账号整体失效的时刻），不可读时降级为「最早一批积分到期」。
  // 两者都没有 → 不渲染（不编造「永不过期」）。
  const expiry = accountExpiry({ account, authAccounts, creditsDetail: liveCredits });
  // 积分一律取 account.credits —— 刷新时网关已先把余额写回池（见 host 的
  // refreshStatus），所以它就是最新的。不再做「实时值 vs 缓存值」双源显示。
  const credits = account.credits ?? 0;
  // 新鲜度：credits_at 为零值 = 从未刷新过。展示相对时间让人判断该不该刷新。
  const creditsAt = isZeroTime(account.credits_at) ? undefined : account.credits_at;
  const target = typeof maxInFlight === 'number' && maxInFlight > 0 ? maxInFlight : undefined;
  const inFlight = account.in_flight ?? 0;
  // 在途占用条：有空闲≠满，所以只在有在途时才画（全 0 画一排空条是噪音）。
  const busyPct = target ? Math.min(100, Math.round((inFlight / target) * 100)) : 0;

  // 成败计数：网关曾对这两个字段用 omitempty，值为 0 时 key 整个不出现 ——
  // 那样面板只能编造 0，无法区分「0 次成功」与「字段不存在」（已修 chanhub：
  // 零值也透出，与 consecutive_fails 等同口径）。这里仍按「字段缺失即不显示」
  // 处理，以兼容未升级的旧网关。
  const hasOutcome = account.success_count !== undefined || account.err_total !== undefined;
  const lastSuccess = isZeroTime(account.last_success) ? undefined : account.last_success;

  return React.createElement(
    'button',
    { type: 'button', className: 'dshc-acctcard', onClick: onOpen, title: '点击查看详情' },
    // 顶行：昵称 + 状态
    React.createElement('div', { className: 'dshc-acctcard-top' },
      React.createElement('span', { className: 'dshc-acctcard-name' },
        React.createElement('span', { className: 'dshc-dot', style: { background: (tone[state.tone] ?? tone.idle).fg } }),
        React.createElement('span', { className: 'dshc-acctcard-nametext' },
          account.nickname || account.uid.slice(0, 8)),
      ),
      React.createElement(Tag, { text: state.label, tone: state.tone, title: state.detail || undefined }),
    ),

    // 主数值：积分占满宽度，不再被右侧小字挤成半栏
    React.createElement('div', { className: 'dshc-acctcard-credits' },
      React.createElement('span', { className: 'dshc-acctcard-credits-num' }, formatNumber(credits)),
      React.createElement('span', { className: 'dshc-acctcard-credits-unit' }, '积分'),
      creditsAt
        ? React.createElement('span', { className: 'dshc-acctcard-updated', title: `余额更新于 ${formatAbsolute(creditsAt)}` },
            relativeTime(creditsAt))
        : null,
      account.credits_expiring > 0
        ? React.createElement('span', {
            className: 'dshc-acctcard-expiring',
            title: '该窗口内即将过期的积分（优先消耗）',
          }, `${formatNumber(account.credits_expiring)} 将过期`)
        : null,
    ),

    // 在途占用：数值 + 细进度条（有在途时才显示）
    target
      ? React.createElement('div', { className: 'dshc-acctcard-bar', title: `单号在途上限 ${target}` },
          React.createElement('span', { className: 'dshc-acctcard-track' },
            React.createElement('span', {
              className: `dshc-acctcard-fill${inFlight >= target ? ' full' : ''}`,
              style: { width: `${busyPct}%` },
            }),
          ),
          React.createElement('span', { className: 'dshc-acctcard-bartext' }, `在途 ${inFlight}/${target}`),
        )
      : null,

    // 底行：渠道 · 域 · 到期 · 成败 —— 从 11px 右下小字改为独立一行，字号可读
    React.createElement('div', { className: 'dshc-acctcard-foot' },
      React.createElement('span', { className: 'dshc-chip' }, channelLabel(channel) || '—'),
      account.realm ? React.createElement('span', { className: 'dshc-chip' }, account.realm === 'global' ? '国际版' : '国内版') : null,
      expiry ? React.createElement(ExpiryChip, { expiry }) : null,
      // 成败比：新网关恒透出（零值也写），旧网关缺字段时退回在途数、不编造。
      hasOutcome
        ? React.createElement('span', { className: 'dshc-chip' },
            `${account.success_count} 成功 / ${account.err_total} 失败`)
        : React.createElement('span', {
            className: 'dshc-chip dshc-chip-dim',
            title: '该网关版本未透出运行计数（success_count / err_total）；升级 chanhub 后可见',
          }, '成败计数不可用'),
      lastSuccess
        ? React.createElement('span', { className: 'dshc-chip dshc-chip-dim' }, `最近成功 ${relativeTime(lastSuccess)}`)
        : null,
    ),
  );
}

/**
 * 到期小标签。
 *
 * 文案刻意带**语义前缀**（「到期」vs「积分到期」）：账号整体失效与「一批
 * 积分要作废」是两件事，混成一个「到期」会让人以为号要没了。
 * 近 3 天内（含已过期）转警示色 —— 这是唯一需要抢注意力的情形。
 *
 * @param props - `{expiry}`：`accountExpiry()` 的输出。
 * @returns React 元素。
 */
function ExpiryChip({ expiry }) {
  const date = new Date(expiry.at);
  const pad = (value) => String(value).padStart(2, '0');
  const dayText = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const prefix = expiry.kind === 'credential' ? '到期' : '积分到期';
  const left = expiry.days;
  const urgent = expiry.expired || left <= 3;
  const title = expiry.kind === 'credential'
    ? `登录凭证到期：${formatAbsolute(new Date(expiry.at).toISOString())}${expiry.expired ? '（已过期）' : `（还有 ${left} 天）`}`
    : `最早一批积分到期：${dayText}${expiry.expired ? '（已过期）' : `（还有 ${left} 天）`}`
      + ' —— 凭证到期时间未能读取（宿主与网关不同机时读不到 auths 目录）';
  return React.createElement('span', {
    className: `dshc-chip${urgent ? ' dshc-chip-warn' : ' dshc-chip-dim'}`,
    title,
  }, `${prefix} ${dayText}${expiry.expired ? ' · 已过期' : left <= 0 ? ' · 今天' : ` · ${left} 天`}`);
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
 * 任务磁贴：一个任务一格，点即触发，状态就地显示。
 *
 * 为什么合并掉原来的「操作台按钮 + 执行历史表」：同一批 7 个任务被列了两遍
 * （7 个按钮 + 7 行 × 6 列），状态与触发入口分离，读一眼要跨两个区块对照。
 * 磁贴把两者收进同一格 —— 表整张删除，状态在按下去的地方就有。
 *
 * 状态语义（三态，不用 Tag 以免与页面其它标签混淆）：
 *   未执行 → 灰点 + 「未执行」　　已执行 → 绿点 + 相对时间　　运行中 → 呼吸发光
 * 错误只在真有错误时出现，且压成一行小字（不占独立列）。
 *
 * @param props - `{task, state, busy, onRun, scheduleConfig}`。
 * @returns React 元素。
 */
function TaskTile({ task, state, busy, onRun, scheduleConfig }) {
  const ran = (state?.run_count ?? 0) > 0;
  const failed = Boolean(state?.last_error);
  // 色点优先级：运行中 > 失败 > 已执行 > 未执行。
  const dot = busy ? tone.info.fg : failed ? tone.err.fg : ran ? tone.ok.fg : tone.idle.fg;
  // 次要信息压成一行：已执行显示「上次执行 + 耗时」，否则显示计划时刻（若有）。
  const scheduleItem = SCHEDULE_ITEMS.find((item) => item.id === task.name);
  // '默认' 是 scheduleHoursText 在「未显式配置」时的占位 —— 它不含信息量，
  // 显示在磁贴里只会增加噪音。真有无配置差异时，tooltip 已经写明计划时刻。
  const planned = scheduleItem ? scheduleHoursText(scheduleItem, scheduleConfig) : '';
  const hours = planned === '默认' ? '' : planned;
  const meta = busy
    ? '运行中…'
    : ran
      ? `${state?.last_start ? relativeTime(state.last_start) : ''}${typeof state?.duration_sec === 'number' ? ' · ' + formatDuration(state.duration_sec) : ''}`
      : hours;

  return React.createElement(
    'button',
    {
      type: 'button',
      className: `dshc-tasktile${busy ? ' running' : ''}${failed ? ' failed' : ''}`,
      disabled: busy,
      onClick: () => onRun(task.name),
      title: [
        `${task.label}：点即执行`,
        ran ? `上次执行 ${state?.last_start ? formatAbsolute(state.last_start) : '—'}` : '尚未执行过',
        state?.run_count != null ? `累计 ${state.run_count} 次` : '',
        hours ? `计划 ${hours}` : '',
        failed ? `上次错误：${state.last_error}` : '',
      ].filter(Boolean).join('\n'),
    },
    React.createElement('span', { className: 'dshc-tasktile-ico' }, task.icon),
    React.createElement('span', { className: 'dshc-tasktile-name' }, task.label),
    React.createElement(
      'span',
      { className: 'dshc-tasktile-meta' },
      React.createElement('span', { className: 'dshc-dot', style: { background: dot } }),
      meta || '未执行',
    ),
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
function TasksTab({ status, channelOf, maxInFlight, taskData, growthData, schoolData, growthUid, setGrowthUid, schoolUid, setSchoolUid, onRunTask, runningName, onRefresh, scheduleConfig, onGrowthWrite, growthWriteBusy, adminAvailable, scanData, scanning, queueData, onScan, onQueueStart, vouchersData, vouchersLoading, onViewVouchers }) {
  const accounts = status?.accounts ?? [];
  // uid → 账号实时快照（含 credits）：签到卡余额列的实时来源（与账号池同源）。
  const accountsMap = React.useMemo(
    () => new Map(accounts.map((account) => [account.uid, account])),
    [accounts],
  );
  // 成长任务/开学季是 workbuddy 专属能力（Trae/Qoder 渠道没有这套体系，
  // 网关 /v1/accounts/{uid}/growth-tasks、school-tasks 对非 workbuddy 恒 501）。
  // 选号器只列 workbuddy 账号；列表为空说明池里全是 trae/qoder，两张卡
  // 走「网关未提供」的降级分支而非无限加载。
  const wbAccounts = accounts.filter((account) => (channelOf?.(account) ?? 'workbuddy') === 'workbuddy');
  // taskData 是宿主 getTasks 的 value，形如 {available, tasks:{tasks:[...]}}。
  // 逐层取并把非数组一律当空 —— 形状不符时降级为空表，而不是抛异常炸掉整个 Tab。
  const taskList = Array.isArray(taskData?.tasks?.tasks) ? taskData.tasks.tasks : [];
  const byName = new Map(taskList.map((task) => [task.task, task]));
  const doneCount = (queueData?.items ?? []).filter((it) => it.status === 'done' || it.status === 'error').length;
  const pct = queueData?.total > 0 ? Math.round((doneCount / queueData.total) * 100) : 100;

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
    // 任务磁贴：一行七个，点即触发，状态就地显示。
    // 原先「操作台按钮」与「执行历史表」把同一批任务各列一遍（7 按钮 + 7 行 × 6 列），
    // 状态还得跨区块对照 —— 磁贴把触发与状态收进同一格，整张表随之删除。
    React.createElement('div', { style: s.card },
      React.createElement('div', { className: 'dshc-taskgrid' },
        ...TASK_DEFS.map((task) =>
          React.createElement(TaskTile, {
            key: task.name,
            task,
            state: byName.get(task.name),
            busy: runningName === task.name || byName.get(task.name)?.running === true,
            onRun: onRunTask,
            scheduleConfig,
          }),
        ),
      ),
      adminAvailable
        ? React.createElement('div', { className: 'dshc-row', style: { marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--dsw-alias-border-l2,#e5e7eb)' } },
            React.createElement('button', {
              type: 'button', style: { ...s.btnGhost, height: 28 },
              disabled: scanning, onClick: onScan,
              title: '只读扫描：列出每个账号未完成且可自动化的任务',
            }, scanning ? '扫描中…' : '扫描待办'),
            React.createElement('button', {
              type: 'button', style: { ...s.btnGhost, height: 28 }, onClick: onQueueStart,
              title: '把扫描出的待办排队执行（账号内串行、账号间并发）',
            }, '执行队列'),
            queueData
              ? React.createElement('span', { className: 'dshc-row', style: { gap: 8, flexGrow: 1, minWidth: 140 } },
                  React.createElement('span', { className: 'dshc-progress' },
                    React.createElement('span', { style: { width: `${pct}%` } })),
                  React.createElement('span', { style: { ...s.muted, whiteSpace: 'nowrap' } },
                    `${doneCount}/${queueData.total}${queueData.running ? '' : ' 已结束'}`),
                )
              : null,
          )
        : null,
    ),

    // 签到逐账号结果：摘要常驻（一眼可见），明细折起（默认不占版面）。
    // 余额列取实时值（status.accounts[].credits —— 与账号池 Tab 同源，刷新时
    // 网关已把余额写回池）：outcomes.credits 是任务执行那一刻的回读快照，
    // 之后余额变化它不会自己变，两处会对不上（真机踩过：账号池 800 / 签到卡 650）。
    React.createElement(CheckinOutcomesCard, {
      task: byName.get('checkin'),
      liveByUid: accountsMap,
    }),

    // 待办扫描 / 队列明细：只在有数据时出现，且折起。
    scanData?.accounts?.length > 0
      ? React.createElement('div', { style: s.card },
          React.createElement('div', { className: 'dshc-taskgrid-head' },
            React.createElement('span', { style: s.label }, '待办扫描结果'),
            React.createElement('span', { style: s.muted }, `${scanData.accounts.length} 个账号`),
          ),
          ...scanData.accounts.map((it) =>
            React.createElement('div', { key: it.uid, className: 'dshc-row', style: { marginTop: 6 } },
              React.createElement('span', { style: { ...s.label, minWidth: 0 } }, it.nickname || it.uid.slice(0, 8)),
              it.growth?.length > 0
                ? React.createElement(Tag, { text: `成长待办 ${it.growth.length}`, tone: 'warn', title: it.growth.join(' · ') })
                : React.createElement(Tag, { text: '成长无待办', tone: 'ok' }),
              it.chances > 0 ? React.createElement(Tag, { text: `抽奖 ${it.chances}`, tone: 'info' }) : null,
              it.growthErr ? React.createElement(Tag, { text: '成长查询失败', tone: 'err', title: it.growthErr }) : null,
              it.schoolErr ? React.createElement(Tag, { text: '开学季查询失败', tone: 'err', title: it.schoolErr }) : null,
            ),
          ),
        )
      : null,
    queueData?.items?.length > 0
      ? React.createElement('div', { style: s.card },
          React.createElement('div', { className: 'dshc-taskgrid-head' },
            React.createElement('span', { style: s.label }, '执行队列明细'),
            React.createElement('span', { style: s.muted }, `${doneCount}/${queueData.total}`),
          ),
          React.createElement('div', { className: 'dshc-tblwrap', style: { marginTop: 8 } },
            React.createElement('table', null,
              React.createElement('thead', null,
                React.createElement('tr', null,
                  ...['账号', '任务', '状态', '说明'].map((h2) => React.createElement('th', { key: h2 }, h2)),
                ),
              ),
              React.createElement('tbody', null,
                ...queueData.items.map((it, i) =>
                  React.createElement('tr', { key: `${it.uid}-${it.kind}-${it.code}-${i}` },
                    React.createElement('td', null, it.nickname || it.uid.slice(0, 8)),
                    React.createElement('td', { style: { ...s.code }, title: it.kind === 'school' ? '开学季' : '成长' }, it.code),
                    React.createElement('td', null,
                      React.createElement(Tag, {
                        text: { pending: '待执行', running: '执行中', done: '完成', skipped: '跳过', error: '失败' }[it.status] ?? it.status,
                        tone: { done: 'ok', error: 'err', running: 'info', skipped: 'idle', pending: 'idle' }[it.status] ?? 'idle',
                      }),
                    ),
                    React.createElement('td', { style: { ...s.muted, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, title: it.message || '' }, it.message || '—'),
                  ),
                ),
              ),
            ),
          ),
        )
      : null,

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
      running: runningName === 'school',
      onRunTask,
      vouchersData,
      vouchersLoading,
      onViewVouchers,
      adminAvailable,
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
      adminAvailable,
    }),
  );
}

/**
 * 逐账号数据的默认选号：账号池顺序里第一个「有数据」的账号。
 *
 * 为什么不再用「第一个 available」的旧 selector：那让卡片固定显示第 1 个账号、
 * 其余账号的进度看不到（而数据其实早就全量拉过了）。现在选号是显式状态，
 * 这里只负责给出**初始值**。
 *
 * @param byUid - `{uid: {available, ...}}` 的逐账号结果表。
 * @param accounts - 账号池顺序。
 * @returns uid，或 undefined（无任何数据）。
 */
function defaultAccountUid(byUid, accounts) {
  for (const account of accounts ?? []) {
    if (byUid?.[account.uid]?.available === true) return account.uid;
  }
  for (const account of accounts ?? []) {
    if (byUid?.[account.uid]) return account.uid;
  }
  return undefined;
}

/**
 * 账号选择器（逐账号数据卡共用）。
 *
 * 只在多账号时渲染 —— 单账号下它只是一行噪音。
 * 每个按钮带状态点：绿=有数据、灰=无数据、红=查询失败，
 * 这样不必逐个点开就知道哪个账号值得看。
 *
 * @param props - `{accounts, byUid, value, onChange, label?}`。
 * @returns React 元素或 null。
 */
function AccountPicker({ accounts, byUid, value, onChange, label = '账号' }) {
  const list = accounts ?? [];
  if (list.length <= 1) return null;
  return React.createElement('div', { className: 'dshc-acctpick' },
    React.createElement('span', { className: 'dshc-acctpick-label' }, label),
    ...list.map((account) => {
      const entry = byUid?.[account.uid];
      const dot = !entry ? tone.idle.fg : entry.available === true ? tone.ok.fg : tone.err.fg;
      const name = account.nickname || account.uid.slice(0, 8);
      const active = account.uid === value;
      return React.createElement('button', {
        key: account.uid,
        type: 'button',
        className: `dshc-acctpick-btn${active ? ' on' : ''}`,
        onClick: () => onChange(account.uid),
        title: entry?.available === false
          ? `${name}：${entry.reason ?? '该账号数据不可用'}`
          : name,
      },
      React.createElement('span', { className: 'dshc-dot', style: { background: dot } }),
      name);
    }),
  );
}

/**
 * 逐账号数据卡的选中 uid（受控状态 + 兜底）。
 *
 * 为什么需要兜底：刷新后账号池可能变化（账号被移除），选中的 uid 会失效；
 * 此时回落到默认 uid 而不是显示空白。
 *
 * @param selected - 当前选中的 uid。
 * @param byUid - 逐账号结果表。
 * @param accounts - 账号池顺序。
 * @returns 有效 uid 或 undefined。
 */
function useSelectedUid(selected, byUid, accounts) {
  const fallback = defaultAccountUid(byUid, accounts);
  if (selected && byUid?.[selected]) return selected;
  return fallback;
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
function SchoolTasksCard({ schoolData, accounts, byUid, selectedUid, onSelectUid, running, onRunTask, vouchersData, vouchersLoading, onViewVouchers, adminAvailable }) {
  if (schoolData && schoolData.available === false) {
    return React.createElement(Unavailable, {
      title: '开学季子任务状态',
      needs: 'GET /v1/accounts/{uid}/school-tasks',
      hint: schoolData.reason,
    });
  }
  if (!schoolData || schoolData.available !== true) {
    return React.createElement('div', { style: s.card },
      React.createElement(CardHead, { title: '开学季' }),
      React.createElement('div', { style: { ...s.muted, marginTop: 8 } }, '加载中…'),
    );
  }

  const data = schoolData.school;
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const counts = data.counts ?? {};
  const claimed = counts.claimed ?? 0;
  const total = counts.total ?? tasks.length;

  // in_period=false 时才需要警示（过期快照），true 是常态、不占版面。
  const stale = data.in_period === false;

  return React.createElement('div', { style: s.card },
    React.createElement(CardHead, {
      title: '🎓 开学季',
      actions: [
        React.createElement('button', {
          key: 'run',
          type: 'button',
          className: `dshc-taskbtn${running ? ' running' : ''}`,
          style: { ...s.btnGhost, height: 26, padding: '0 10px', fontSize: 12 },
          disabled: running,
          onClick: () => onRunTask('school'),
        }, running ? '执行中…' : '执行'),
        adminAvailable
          ? React.createElement('button', {
              key: 'vouchers',
              type: 'button',
              style: { ...s.btnLink, fontSize: 12 },
              disabled: vouchersLoading, onClick: onViewVouchers,
              title: '查询各账号抽中的第三方券码（KFC/瑞幸/酷狗等，只读）',
            }, vouchersLoading ? '查询中…' : '券码')
          : null,
      ],
    }),

    // 账号选择器：逐账号数据必须能切换（此前固定显示第 1 个账号）
    React.createElement(AccountPicker, {
      accounts,
      byUid,
      value: selectedUid,
      onChange: onSelectUid,
    }),

    // 进度条 + 计数（比 "已领 4/5" 标签更直观，且一眼看出还剩多少）
    React.createElement('div', { className: 'dshc-row', style: { marginTop: 12 } },
      React.createElement('span', { className: 'dshc-progress' },
        React.createElement('span', {
          style: {
            width: `${total > 0 ? Math.round((claimed / total) * 100) : 0}%`,
            background: claimed >= total ? tone.ok.fg : 'var(--dsw-alias-button-info-fill,#4176e6)',
          },
        })),
      React.createElement('span', { style: { ...s.muted, whiteSpace: 'nowrap' } }, `${claimed}/${total}`),
    ),

    stale
      ? React.createElement('div', { style: { ...s.warn, marginTop: 10 } },
          '活动未开始或已结束 —— 以下为过期快照，不代表当前可操作。')
      : null,

    tasks.length === 0
      ? React.createElement('div', { style: { ...s.muted, marginTop: 10 } }, '网关未返回子任务。')
      : React.createElement('div', { className: 'dshc-sub', style: { marginTop: 12 } },
          ...tasks.map((task) => {
            const status = SCHOOL_STATUS[task.status] ?? { text: task.status ?? '—', tone: 'idle' };
            const done = ['claimed', 'completed'].includes(task.status);
            const recurring = task.task_type === 'recurring';
            const manual = task.task_code === 'task_student_verify';
            // 网格行：五列固定（勾 / 标题 / 进度 / 来源 / 状态），列宽由 CSS 定死。
            // 之前用 flex 自然排版，缺一个标签整行后续列就左移一格 —— 5 行里有 4 行
            // 是 5 个子元素、1 行是 4 个（desktop_chat_1_time 无「每日」），于是错位。
            return React.createElement('div', { key: task.task_code, className: 'dshc-srow' },
              React.createElement('span', {
                className: done ? 'dshc-ck on' : manual ? 'dshc-ck na' : 'dshc-ck',
                title: done ? '已领取' : manual ? '人工项（网关不可代做）' : status.text,
              }, done ? '✓' : manual ? '—' : '○'),
              React.createElement('span', { className: 'dshc-stitle', title: task.task_code },
                task.title || task.task_code),
              // 进度：claimed 但未满时（上游实测存在，如 desktop_chat_1_time 为
              // claimed + 0/1）不隐藏也不改写 —— 如实显示，但加注说明这是上游口径，
              // 避免与左侧「已领取」勾看起来自相矛盾。
              React.createElement('span', {
                className: `dshc-sprog${done && task.has_progress && task.current < task.target ? ' odd' : ''}`,
                ...(done && task.has_progress && task.current < task.target
                  ? { title: '上游口径：该任务已领取，但进度计数为 ' + `${task.current}/${task.target}` }
                  : {}),
              }, task.has_progress ? `${task.current}/${task.target}` : '—'),
              React.createElement('span', { className: 'dshc-ssrc' },
                recurring ? React.createElement(Tag, { text: '每日', tone: 'info' }) : null,
                manual ? React.createElement(Tag, { text: '人工', tone: 'idle' }) : null,
              ),
              React.createElement(Tag, { text: status.text, tone: status.tone }),
            );
          }),
        ),

    // 券码（按需加载）：只读表格，折进结果区
    vouchersData
      ? React.createElement(
          'details',
          { className: 'dshc-fold', style: { marginTop: 10 }, open: true },
          React.createElement('summary', null, React.createElement('span', { style: s.label }, '券码')),
          React.createElement('div', { className: 'dshc-body' },
            React.createElement('div', { className: 'dshc-tblwrap' },
              React.createElement('table', null,
                React.createElement('thead', null,
                  React.createElement('tr', null,
                    ...['账号', '奖品', '券码', '有效期'].map((h2) => React.createElement('th', { key: h2 }, h2)),
                  ),
                ),
                React.createElement('tbody', null,
                  ...(function () {
                    const rows = [];
                    for (const r of vouchersData.rows ?? []) {
                      if ((r.vouchers ?? []).length === 0) continue;
                      for (const v of r.vouchers) {
                        rows.push(React.createElement('tr', { key: `${r.uid}-${v.grant_id}` },
                          React.createElement('td', null, r.nickname || r.uid.slice(0, 8)),
                          React.createElement('td', null, v.prize_name || v.sku_code || '—'),
                          React.createElement('td', { style: { ...s.code, userSelect: 'all' } }, v.code || '—'),
                          React.createElement('td', null, v.valid_to || '—'),
                        ));
                      }
                    }
                    if (rows.length === 0) {
                      rows.push(React.createElement('tr', { key: 'empty' },
                        React.createElement('td', { colSpan: 4, style: { ...s.muted, textAlign: 'center' } }, '暂无券码。'),
                      ));
                    }
                    return rows;
                  })(),
                ),
              ),
            ),
          ),
        )
      : null,
  );
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
function GrowthTasksCard({ growthData, accounts, byUid, selectedUid, onSelectUid, onRefresh, onGrowthWrite, writeBusy, adminAvailable }) {
  if (growthData && growthData.available === false) {
    return React.createElement(Unavailable, {
      title: '成长任务进度（逐码）',
      needs: 'GET /v1/accounts/{uid}/growth-tasks',
      hint: growthData.reason,
    });
  }
  if (!growthData || growthData.available !== true) {
    return React.createElement('div', { style: s.card },
      React.createElement(CardHead, { title: '成长任务' }),
      React.createElement('div', { style: { ...s.muted, marginTop: 8 } }, '加载中…'),
    );
  }

  const data = growthData.growth;
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  if (tasks.length === 0) {
    return React.createElement('div', { style: s.card },
      React.createElement(CardHead, { title: '成长任务' }),
      React.createElement('div', { style: { ...s.muted, marginTop: 8 } }, '账号可能无成长任务资格。'),
    );
  }

  // 分类：需要动手的 → 可领奖的 → 上游无进度对象的。已完成不再单列一类，
  // 它与「可领奖」在动作上是同一件事（claim），合并后少一个分组。
  const actionable = tasks.filter((t) =>
    t.has_progress && !['completed', 'claimed'].includes(t.accept_status) &&
    t.current < (t.target || 1));
  const claimable = tasks.filter((t) =>
    ['completed', 'claimed'].includes(t.accept_status) ||
    (t.has_progress && t.target > 0 && t.current >= t.target && t.accept_status !== 'claimed'));
  const pending = tasks.filter((t) => !t.has_progress);
  const claimableUnclaimed = claimable.filter((t) => t.accept_status !== 'claimed');

  const statusTone = { claimed: 'ok', completed: 'ok', accepted: 'info', in_progress: 'info', not_accepted: 'idle' };
  const statusLabel = {
    claimed: '已领取', completed: '已完成',
    accepted: '进行中', in_progress: '进行中', not_accepted: '未接受',
  };

  const renderRow = (t) => {
    const progress = t.has_progress ? `${t.current}/${t.target}` : null;
    const full = t.has_progress && t.target > 0 && t.current >= t.target;
    const claimed = t.accept_status === 'claimed';
    const completed = t.accept_status === 'completed';
    const busyThis = writeBusy === `${t.task_code}`;
    const showAccept = adminAvailable && !claimed && !completed && !t.locked && !full;
    const showClaim = adminAvailable && (completed || full) && !claimed;
    // 来源与开放状态是**两件独立的事**，不能压成一个标签：
    //   - 来源：小程序口径 / 有定时排程覆盖
    //   - 开放状态：上游未解锁（locked）
    // 此前把三者做成三选一，于是 locked 的行就看不到「它是小程序任务」——
    // 信息被静默丢掉（真机踩到：Sequential_Tasks_2 只显示「已锁定」，
    // 看不出它还是 mp 限定任务）。现在最多挂两个标签。
    //
    // 措辞用「未解锁」而非「已锁定」：locked 表示该任务上游尚未对你开放，
    // 不是账号/面板出了问题 —— 后者会让人以为要排障。
    const badges = [];
    if (t.from_mp) badges.push({ text: '小程序', tone: 'info' });
    if (t.scheduled) badges.push({ text: `定时 ${t.scheduled}`, tone: 'info' });
    if (t.locked) {
      badges.push({
        text: '未解锁',
        tone: 'warn',
        title: '上游对该任务标记为未开放（locked）：当前不可做，面板也不会代做。'
          + '这通常是上游的灰度/资格控制，与账号状态无关。',
      });
    }

    // 网格行：六列固定（色条 / 标题 / 进度 / 来源 / 状态 / 动作）。
    // 原先 flex 自然排版，22 行里出现 3、4、5 个子元素三种形态（无进度、无来源、
    // 无动作各不相同）→ 进度与标签列逐行参差。列宽定死后无论有无内容都对齐。
    return React.createElement('div', { key: t.task_code, className: 'dshc-growrow' },
      React.createElement('span', {
        className: 'dshc-codebar',
        style: { background: full || claimed || completed ? tone.ok.fg : t.has_progress ? tone.warn.fg : 'transparent' },
      }),
      React.createElement('span', { className: 'dshc-stitle', title: t.task_code }, t.title || t.task_code),
      React.createElement('span', { className: 'dshc-sprog' }, progress ?? '—'),
      React.createElement('span', { className: 'dshc-ssrc' },
        ...badges.map((b) => React.createElement(Tag, { key: b.text, text: b.text, tone: b.tone, title: b.title })),
      ),
      React.createElement(Tag, { text: statusLabel[t.accept_status] ?? t.accept_status ?? '—', tone: statusTone[t.accept_status] ?? 'idle' }),
      React.createElement('span', { className: 'dshc-sact' },
        showAccept
          ? React.createElement('button', {
              type: 'button', style: { ...s.btnLink, fontSize: 12 },
              disabled: busyThis, onClick: () => onGrowthWrite('accept', t.task_code),
              title: '对上游 accept 该码（开始做；对话类码会真实发起对话）',
            }, busyThis ? '…' : '点亮')
          : null,
        showClaim
          ? React.createElement('button', {
              type: 'button', style: { ...s.btnLink, fontSize: 12 },
              disabled: busyThis, onClick: () => onGrowthWrite('claim', t.task_code),
              title: '领取该码奖励（幂等：重复领取返回已领态，不算失败）',
            }, busyThis ? '…' : '领取')
          : null,
      ),
    );
  };

  const doneCount = claimable.length;
  const coverage = codeCoverage();

  return React.createElement('div', { style: s.card },
    React.createElement(CardHead, {
      title: '成长任务',
      actions: [
        adminAvailable
          ? React.createElement('button', {
              key: 'claim-all',
              type: 'button',
              style: { ...s.btnGhost, height: 26, padding: '0 10px', fontSize: 12 },
              disabled: writeBusy === 'claim-claimable' || claimableUnclaimed.length === 0,
              onClick: () => onGrowthWrite('claim-claimable'),
              title: '领取当前全部已完成未领的奖励（幂等）',
            }, writeBusy === 'claim-claimable' ? '领取中…' : '全部领取')
          : null,
        React.createElement('button', {
          key: 'refresh', type: 'button', style: { ...s.btnLink, fontSize: 12 }, onClick: onRefresh,
        }, '刷新'),
      ],
    }),

    // 账号选择器：逐账号数据必须能切换（此前固定显示第 1 个账号）
    React.createElement(AccountPicker, {
      accounts,
      byUid,
      value: selectedUid,
      onChange: onSelectUid,
    }),

    React.createElement('div', { className: 'dshc-row', style: { marginTop: 12 } },
      React.createElement('span', { className: 'dshc-progress' },
        React.createElement('span', {
          style: {
            width: `${tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0}%`,
            background: doneCount >= tasks.length ? tone.ok.fg : 'var(--dsw-alias-button-info-fill,#4176e6)',
          },
        })),
      React.createElement('span', { style: { ...s.muted, whiteSpace: 'nowrap' } }, `${doneCount}/${tasks.length}`),
      actionable.length > 0
        ? React.createElement(Tag, {
            text: `待做 ${actionable.length}`,
            tone: 'warn',
            title: '有进度未满、可继续推动的码',
          })
        : null,
      // 事实②（定时覆盖只有 2/24）压成一个 chip：它的内容是「别的码没有定时入口」，
      // 逐行看不到（缺席不可见），故必须有一处汇总 —— 但一句话即可，不写整段散文。
      React.createElement(Tag, {
        text: `定时覆盖 ${coverage.scheduled}/${coverage.total}`,
        tone: 'idle',
        title: `只有 ${coverage.scheduled} 个码有定时排程（chat_5 走活跃地图、black_cat 走夜猫子）；`
          + `其余 ${coverage.unscheduled} 个没有任何定时入口，只能手动点「点亮」。`,
      }),
    ),

    // 只有一类常驻展开：需要动手的。其余折叠。
    actionable.length > 0
      ? React.createElement('div', { className: 'dshc-rows', style: { marginTop: 12 } },
          ...actionable.map(renderRow),
        )
      : React.createElement('div', { style: { ...s.muted, marginTop: 12 } }, '没有待做的码。'),

    claimable.length > 0
      ? React.createElement(
          'details',
          { className: 'dshc-fold', style: { marginTop: 8 } },
          React.createElement('summary', null,
            React.createElement('span', { style: s.label }, '已完成 / 已领取'),
            React.createElement('span', { style: { ...s.muted, marginLeft: 'auto' } }, `${claimable.length} 个`),
          ),
          React.createElement('div', { className: 'dshc-body' }, ...claimable.map(renderRow)),
        )
      : null,

    pending.length > 0
      ? React.createElement(
          'details',
          { className: 'dshc-fold' },
          React.createElement('summary', null,
            React.createElement('span', { style: s.label }, '无进度数据'),
            React.createElement('span', { style: { ...s.muted, marginLeft: 'auto' } }, `${pending.length} 个`),
          ),
          React.createElement('div', { className: 'dshc-body' },
            ...pending.map(renderRow),
            React.createElement('div', { style: { ...s.muted, marginTop: 6 } },
              '上游不下发进度对象，通常是不可代做的真实行为（如公益捐款）。'),
          ),
        )
      : null,
  );
}

function CheckinOutcomesCard({ task, liveByUid }) {
  const outcomes = task?.outcomes;
  if (!Array.isArray(outcomes) || outcomes.length === 0) return null;
  const summary = task.outcome_summary ?? {};

  // 余额列取实时值优先（liveByUid = status.accounts 快照，与账号池 Tab 同源），
  // outcomes.credits（任务执行那一刻的回读）兜底：任务跑完后余额可能又变了。
  const balanceOf = (oc) => {
    const live = liveByUid?.get?.(oc.uid);
    if (typeof live?.credits === 'number') return live.credits;
    return typeof oc.credits === 'number' ? oc.credits : null;
  };

  // 摘要常驻、明细折起：签到「多数号都成功」是常态，逐号表格常驻会挤掉下面
  // 更值得看的开学季/成长进度。失败与跳过的号才是要看的，故默认只展开它们。
  const attention = outcomes.filter((oc) => oc.status === 'fail' || oc.status === 'skipped');

  return React.createElement('div', { style: s.card },
    React.createElement(CardHead, {
      title: '签到',
      extra: task.last_end
        ? `${relativeTime(task.last_end)}${typeof task.duration_sec === 'number' ? ' · ' + formatDuration(task.duration_sec) : ''}`
        : undefined,
    }),
    React.createElement('div', { className: 'dshc-row', style: { marginTop: 10 } },
      React.createElement(Tag, { text: `成功 ${summary.ok ?? 0}`, tone: 'ok' }),
      React.createElement(Tag, { text: `已签过 ${summary.already ?? 0}`, tone: 'info' }),
      (summary.fail ?? 0) > 0 ? React.createElement(Tag, { text: `失败 ${summary.fail}`, tone: 'err' }) : null,
      (summary.skipped ?? 0) > 0 ? React.createElement(Tag, { text: `跳过 ${summary.skipped}`, tone: 'idle' }) : null,
      React.createElement('span', { style: { ...s.muted, marginLeft: 'auto' } }, `共 ${summary.total ?? outcomes.length} 个`),
    ),
    // 需关注的号（失败/跳过）直接列出；全部正常时只留上面的摘要。
    ...attention.map((oc) =>
      React.createElement('div', { key: oc.uid, className: 'dshc-row', style: { marginTop: 6 } },
        React.createElement('span', { className: 'dshc-dot', style: { background: oc.status === 'fail' ? tone.err.fg : tone.idle.fg } }),
        React.createElement('span', { style: { ...s.label, minWidth: 0 } }, oc.nickname || oc.uid.slice(0, 8)),
        React.createElement('span', {
          style: { ...s.muted, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
          title: oc.detail || '',
        }, oc.detail || TASK_STATUS_LABEL[oc.status] || oc.status),
      ),
    ),
    React.createElement(
      'details',
      { className: 'dshc-fold', style: { marginTop: 10 } },
      React.createElement('summary', null,
        React.createElement('span', { style: s.label }, '逐账号明细'),
        React.createElement('span', { style: { ...s.muted, marginLeft: 'auto' } }, `${outcomes.length} 个账号`),
      ),
      React.createElement('div', { className: 'dshc-body' },
        React.createElement('div', { className: 'dshc-tblwrap' },
          React.createElement('table', null,
            React.createElement('thead', null,
              React.createElement('tr', null,
                ...['账号', '结果', '余额', '说明'].map((h) => React.createElement('th', { key: h }, h)),
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
                  React.createElement('td', null, typeof balanceOf(oc) === 'number' ? formatNumber(balanceOf(oc)) : '—'),
                  React.createElement('td', { style: { ...s.muted } }, oc.detail || '—'),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
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
 * 开关（pill + 滑块）：比裸 checkbox 更合本面板的视觉语言，且带 role="switch"。
 * @param props - `{checked, disabled, onChange, label}`。
 * @returns React 元素。
 */
function Switch({ checked, disabled, onChange, label }) {
  return React.createElement('button', {
    type: 'button',
    role: 'switch',
    'aria-checked': checked === true,
    'aria-label': label,
    disabled,
    onClick: () => onChange?.(!checked),
    style: {
      font: 'inherit', cursor: disabled ? 'not-allowed' : 'pointer', flex: '0 0 auto',
      width: 38, height: 22, borderRadius: 999, border: '1px solid transparent', padding: 2,
      background: checked ? 'var(--dsw-alias-button-info-fill,#4176f7)' : 'var(--dsw-alias-border-l3,#d1d5db)',
      opacity: disabled ? 0.5 : 1, transition: 'background .18s',
      display: 'inline-flex', alignItems: 'center', justifyContent: checked ? 'flex-end' : 'flex-start',
    },
  },
    React.createElement('span', {
      style: {
        width: 16, height: 16, borderRadius: 999, background: '#fff',
        boxShadow: '0 1px 3px rgba(15,23,42,.25)', transition: 'all .18s',
      },
    }),
  );
}

/**
 * 「界面」偏好卡：插件自身的前端偏好（**不是**网关 config.json 的 52 项）。
 *
 * 为什么单独一张卡、且必须渲染在 ConfigTab 的错误提前返回之前：这些偏好不依赖
 * 网关文件；远程部署 / config.json 不可读时用户仍然要能把侧边栏入口关掉。
 *
 * @param props - `{prefs}`：quick-store 的 createSidebarPrefs 返回值。
 * @returns React 元素。
 */
function InterfaceCard({ prefs }) {
  const [, force] = React.useReducer((value) => value + 1, 0);
  React.useEffect(() => {
    if (!prefs?.subscribe) return undefined;
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

  return React.createElement('div', { style: { ...s.card, marginBottom: 16 } },
    React.createElement('div', { className: 'dshc-row', style: { justifyContent: 'space-between' } },
      React.createElement('div', { className: 'dshc-row' },
        React.createElement('span', { style: { ...s.label, display: 'flex', alignItems: 'center', gap: 6 } },
          React.createElement(Icons.gear, { style: { width: 15, height: 15, color: 'var(--dsw-alias-state-business-primary,#4176ef)' } }),
          '界面'),
      ),
      React.createElement(Tag, {
        text: !available ? '宿主不支持' : writable ? '可修改' : '只读',
        tone: !available ? 'idle' : writable ? 'ok' : 'warn',
      }),
    ),
    React.createElement('div', {
      className: 'dshc-row',
      style: { justifyContent: 'space-between', gap: 12, marginTop: 10, alignItems: 'flex-start' },
    },
      React.createElement('div', { style: { minWidth: 0 } },
        React.createElement('div', { style: { ...s.label, fontSize: 13 } }, '在侧边栏左下角显示渠道入口'),
        React.createElement('div', { style: { ...s.muted, marginTop: 3, fontSize: 11.5, lineHeight: 1.6 } },
          '显示「渠道」按钮，点开即看账号池摘要与各号可用积分（只读，不会自动打上游）。',
          React.createElement('br', null),
          '关掉后入口隐藏，本面板不受影响；也可在 DSH 原生插件设置里改。'),
      ),
      React.createElement(Switch, {
        checked: enabled,
        disabled: !writable || busy,
        onChange: toggle,
        label: '在侧边栏左下角显示渠道入口',
      }),
    ),
    failed
      ? React.createElement('div', { style: { ...s.muted, marginTop: 8, fontSize: 11.5, color: tone.err.fg } },
          '保存失败：宿主设置未写入，已回滚为当前值。')
      : null,
    !available
      ? React.createElement('div', { style: { ...s.muted, marginTop: 8, fontSize: 11.5 } },
          '当前宿主没有 settingsScope 服务，无法在此开关；入口按默认（开启）显示。')
      : null,
  );
}

/**
 * 配置 Tab：53 项分组折叠 + 危险语义标注 + 时长校验 + 服务控制 + 界面偏好。
 *
 * 保存优先走网关端点 `POST /admin/config`（写盘 + 字段级热应用，见 lib/index.js）；
 * 网关端点不可用时降级为宿主直写 config.json。角标「↻ 需重启」来自
 * config-spec.js 的 `restart` 字段 —— 那是**网关热改面**的镜像，
 * 过期会让标注与真实结局打架，故与网关同步维护。
 *
 * @param props - `{configInfo, onSave, saving, onServiceControl, serviceControlResult, serviceBusy, prefs}`。
 * @returns React 元素。
 */
function ConfigTab({ configInfo, onSave, saving, onServiceControl, serviceControlResult, serviceBusy, prefs }) {
  const [draft, setDraft] = React.useState({});
  const groups = React.useMemo(() => fieldsByGroup(), []);

  const config = configInfo?.config ?? {};
  const editable = Boolean(configInfo?.ok && configInfo?.writable);

  const setField = (path, value) => setDraft((prev) => ({ ...prev, [path]: value }));
  const dirty = Object.keys(draft);

  /** 校验当前 draft，得到逐字段错误、「需重启」清单，以及**已按规格表收敛的提交值**。 */
  const validation = React.useMemo(() => {
    const errors = {};
    const restart = new Set();
    const values = {};
    const byPath = new Map();
    for (const group of groups) for (const field of group.fields) byPath.set(field.path, field);
    for (const [path, raw] of Object.entries(draft)) {
      const field = byPath.get(path);
      if (!field) continue;
      const result = coerceField(field, raw);
      if (!result.ok) errors[path] = result.message;
      // 输入框交上来的是字符串（"0" / "8, 21"），网关 normalize 是强类型的 ——
      // 提交收敛后的值，不是原始文本（宿主侧还有同样的收敛兜底，见 lib/index.js saveConfig）。
      else values[path] = result.value;
      if (field.restart !== false) restart.add(path);
    }
    return { errors, restart, values };
  }, [draft, groups]);

  const errorCount = Object.keys(validation.errors).length;

  if (configInfo && configInfo.ok === false) {
    return React.createElement(
      'div',
      null,
      // 界面偏好与网关文件无关 —— 必须留在错误分支里，否则远程部署时用户
      // 反而没法把侧边栏入口关掉（本卡在正常分支同样渲染）。
      React.createElement(InterfaceCard, { prefs }),
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
    // 界面偏好（插件自身偏好，置顶：与网关配置无关，任何部署形态都可用）
    React.createElement(InterfaceCard, { prefs }),
    // 服务操作（置顶：重启网关 + 可写状态）
    React.createElement('div', { style: s.card },
      React.createElement('div', { className: 'dshc-row', style: { justifyContent: 'space-between' } },
        React.createElement('div', { className: 'dshc-row' },
          React.createElement('span', { style: { ...s.label, display: 'flex', alignItems: 'center', gap: 6 } },
            React.createElement(Icons.bolt, { style: { width: 15, height: 15, color: 'var(--dsw-alias-state-warn-primary,#b45309)' } }),
            '服务操作'),
          React.createElement(Tag, {
            text: editable ? '配置可写' : '配置只读',
            tone: editable ? 'ok' : 'warn',
          }),
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            style: { ...s.btnGhost, borderColor: tone.warn.fg, color: tone.warn.fg },
            disabled: serviceBusy,
            onClick: onServiceControl,
          },
          serviceBusy ? '重启中…' : '↻ 重启网关',
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

    // 分组折叠（两列网格布局，每项一行双列）
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
        React.createElement('div', { className: 'dshc-cfggrid' },
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
              onClick: () => onSave(validation.values),
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
            `其中 ${validation.restart.size} 项需重启网关生效。`,
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

  // 紧凑单行：label + 控件 + （需重启/危险/还原）标记；path 与默认值进 tooltip。
  const rowTitle = [field.path, field.default ? `默认 ${field.default}` : '', field.note ?? '']
    .filter(Boolean).join(' · ');

  return React.createElement(
    'div',
    { className: `dshc-cfgrow${field.danger ? ' danger' : ''}`, style: { flexWrap: field.note && field.danger ? 'wrap' : 'nowrap' } },
    React.createElement('label', { title: rowTitle },
      field.label,
      field.restart !== false ? ' ↻' : '',
    ),
    React.createElement('span', { className: 'dshc-cfgctl' },
      control,
      dirty
        ? React.createElement(
            'span',
            { style: { ...s.btnLink, cursor: 'pointer', flexShrink: 0 }, onClick: onReset, title: '还原为当前文件值' },
            '还原',
          )
        : null,
    ),
    field.danger
      ? React.createElement(Tag, { text: '危险', tone: 'warn' })
      : null,
    error
      ? React.createElement('span', { style: { ...s.muted, color: tone.err.fg, flexBasis: '100%' } }, error)
      : null,
  );
}

/**
 * 密钥脱敏显示：保留首尾各 4 位，中间圆点。
 * @param value - 原始或占位字符串。
 * @returns 脱敏后的字符串。
 */
function maskKey(value) {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

/**
 * API_KEY 药丸（顶栏右段）。
 *
 * 默认脱敏（首尾各 4 位），👁 切换明文 / 再隐藏；药丸本体点击 = 复制。
 * 明文经 revealApiKey RPC 从宿主取（与网关同机文件/凭证缓存同源），
 * 浏览器端不落 localStorage，仅存组件内存。
 *
 * @param props - `{onReveal: () => Promise<string>}`。
 * @returns React 元素。
 */
function ApiKeyPill({ onReveal }) {
  const [plain, setPlain] = React.useState('');
  const [revealed, setRevealed] = React.useState(false);
  const display = revealed && plain ? plain : maskKey(plain || 'sk-••••••••');

  const toggleEye = async () => {
    if (revealed) {
      setRevealed(false);
      return;
    }
    let value = plain;
    if (!value) {
      value = await onReveal();
      if (!value) return; // onReveal 已 toast 错误
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
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch { /* 剪贴板不可用：静默（宿主 iframe 限制时常见） */ }
  };

  return React.createElement(
    'span',
    { className: 'dshc-keypill', style: { marginLeft: 'auto' }, onClick: copyAll, title: '点击复制完整 API Key' },
    React.createElement('span', { style: { fontFamily: 'ui-monospace,Menlo,monospace' } }, display),
    React.createElement('button', {
      type: 'button',
      className: 'dshc-keypill-ico',
      title: revealed ? '隐藏' : '显示',
      onClick: (e) => { e.stopPropagation(); void toggleEye(); },
    }, revealed ? React.createElement(Icons.eyeOff, null) : React.createElement(Icons.eye, null)),
    React.createElement('span', { className: 'dshc-keypill-ico', title: '复制' }, React.createElement(Icons.copy, null)),
  );
}

/**
 * Tab 栏（复刻 dsh-bridge-gateway 的 TabBar：纯前端状态，非 DSH slot 机制）。
 *
 * @param props - `{active, onChange, statusText, onAdd}`。
 *   onAdd 为空 = 网关不支持交互登录，此时不渲染「添加账号」按钮
 *   （不给出必然失败的入口）。
 * @returns React 元素。
 */
function TabBar({ active, onChange, statusText, onAdd }) {
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
    // statusText 目前恒为空串（v2 把连接状态移到顶栏了），故条件渲染 ——
    // 否则这个空 span 的 paddingLeft 会在「添加账号」左侧留下 12px 死空隙。
    statusText
      ? React.createElement('span', { style: { ...s.muted, marginLeft: 'auto', paddingLeft: 12, whiteSpace: 'nowrap' } },
          statusText,
        )
      : null,
    // 添加账号：与「账号池 … 配置」同一行、贴最右。是否渲染由 onAdd 是否存在决定。
    onAdd
      ? React.createElement('button', {
          type: 'button',
          className: 'dshc-tabadd',
          onClick: onAdd,
          title: 'OAuth 设备授权登录：浏览器完成授权后自动落盘并热加载进池，无需重启网关',
        }, '＋ 添加账号')
      : null,
  );
}

/**
 * 主面板。
 * @param props - `{rpcCall}`。
 * @returns React 元素。
 */
function ChanhubPanel({ rpcCall, prefs }) {
  const [activeTab, setActiveTab] = React.useState('accounts');
  const [data, setData] = React.useState(null);
  const [configInfo, setConfigInfo] = React.useState(null);
  const [authInfo, setAuthInfo] = React.useState(null);
  const [tasks, setTasks] = React.useState(null);
  const [creditsByUid, setCreditsByUid] = React.useState({});
  const [growthByUid, setGrowthByUid] = React.useState({});
  const [schoolByUid, setSchoolByUid] = React.useState({});

  // 渠道解析器：account → 'workbuddy' | 'traework' | 'qoder'。
  // 供账号列表分组、以及成长任务/开学季卡的 workbuddy 过滤共用。
  // 声明须在 wbTaskAccounts/effectiveGrowthUid 等首次使用之前（TDZ）。
  const channelOf = React.useMemo(
    () => channelResolver(authInfo?.ok ? authInfo.accounts : []),
    [authInfo],
  );
  // 逐账号卡各自记住选中的账号（两张卡独立 —— 开学季与成长任务的进度本就无关）。
  // 空串 = 未显式选择 → 由 useSelectedUid 给出默认（账号池顺序里第一个有数据的）。
  const [growthUid, setGrowthUid] = React.useState('');
  const [schoolUid, setSchoolUid] = React.useState('');
  const [logs, setLogs] = React.useState(null);
  const [logChannel, setLogChannel] = React.useState('all');
  const [runningTask, setRunningTask] = React.useState('');
  const [err, setErr] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  // 刷新降级原因（非空 = 本次没刷到新余额，显示的是缓存值）。
  const [refreshDegraded, setRefreshDegraded] = React.useState('');
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
      // 刷新首选 refreshStatus（网关侧先重取余额写回池，再返回 status）——
      // 这样积分就是新鲜的，不需要「实时值 vs 缓存值」两套显示。
      // 网关未开 admin.enabled 时它内部降级为只读 status，并带 refreshError。
      // 用量页不在这一批里：它自管数据（SWR 缓存 + 一次拉 720h + 前端切片），
      // 否则每次进面板都要为它多付两个端点（其中 getStats 还是进程口径的）。
      const [statusResult, configResult, accountsResult, tasksResult, logsResult] =
        await Promise.all([
          rpcCall(ENDPOINTS.refreshStatus, {}),
          rpcCall(ENDPOINTS.getConfig, {}),
          rpcCall(ENDPOINTS.getAccounts, {}),
          rpcCall(ENDPOINTS.getTasks, {}),
          rpcCall(ENDPOINTS.getLogs, { channel: logChannel, limit: 500 }),
        ]);

      if (statusResult?.ok === false) {
        setErr(statusResult?.error?.message ?? '加载失败');
        setData(null);
        return;
      }
      setErr('');
      setData(statusResult?.value ?? null);
      // 刷新降级（网关未开 admin.enabled）：积分是缓存值，不是最新的 —— 如实提示。
      setRefreshDegraded(statusResult?.value?.refreshed === false
        ? (statusResult.value.refreshError?.message ?? '刷新未生效')
        : '');
      setConfigInfo(configResult?.ok === false ? { ok: false, message: configResult?.error?.message } : configResult?.value ?? null);
      setAuthInfo(accountsResult?.value ?? null);
      setTasks(tasksResult?.value ?? null);
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
  }, [rpcCall, logChannel]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  // 自动刷新已移除（默认不轮询）：进面板时上方 refresh() 触发一次，
  // 之后由顶栏 ↻ 手动刷新。

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
          // 降级（网关端点失败）必须点名原因：否则「N 项需重启」会被读成「热生效没接」。
          // hotCapable = 端点恢复后本可即时生效的项数，给一个可执行的修复方向。
          if (value.viaGateway === false) {
            const capable = Array.isArray(value.hotCapable) ? value.hotCapable.length : 0;
            parts.push(`⚠ 网关热生效端点不可用（${value.gatewayError?.message ?? '已降级为文件直写'}）`);
            if (capable > 0) parts.push(`修复后这 ${capable} 项可即时生效`);
          }
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
  // 任务中心（panel 对照补齐）：扫描结果 / 扫描中 / 队列状态。
  const [taskScanData, setTaskScanData] = React.useState(null);
  const [taskScanning, setTaskScanning] = React.useState(false);
  const [taskQueueData, setTaskQueueData] = React.useState(null);
  // 开学季券码（任务 Tab 按需查看）。
  const [vouchersData, setVouchersData] = React.useState(null);
  const [vouchersLoading, setVouchersLoading] = React.useState(false);
  // 添加账号：弹窗开关 + 网关能力（loginChannels 为空 = 不渲染入口）。
  const [addOpen, setAddOpen] = React.useState(false);
  const [loginChannels, setLoginChannels] = React.useState(null);
  const [loginRealms, setLoginRealms] = React.useState([]);

  // 网关可登录渠道只在挂载时探一次：这是网关**版本能力**，不会在会话中变化，
  // 没必要跟着 8s 轮询反复打 /panel/api/channels。
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
    return () => { alive = false; };
  }, [rpcCall]);

  /** 全账号任务扫描（只读）。 */
  const onTaskScan = React.useCallback(
    async () => {
      setTaskScanning(true);
      try {
        const result = await rpcCall(ENDPOINTS.taskScan, {});
        if (result?.ok === false) {
          showToast(`扫描失败：${result.error?.message ?? '未知错误'}`);
        } else {
          setTaskScanData(result?.value ?? null);
        }
      } catch (error) {
        showToast(`扫描异常：${error?.message ?? error}`);
      } finally {
        setTaskScanning(false);
      }
    },
    [rpcCall, showToast],
  );

  /** 启动执行队列 + 轮询进度直到收尾。 */
  const onTaskQueueStart = React.useCallback(
    async () => {
      try {
        const result = await rpcCall(ENDPOINTS.taskQueueStart, { concurrency: 2 });
        const value = result?.value ?? {};
        if (result?.ok === false) {
          showToast(`队列启动失败：${result.error?.message ?? '未知错误'}`);
          return;
        }
        if (value.started === false) {
          showToast(value.message ?? '没有待办任务，或队列已在执行中');
          return;
        }
        showToast(`队列已启动：${value.total} 项（并发 2）`);
        const poll = async () => {
          try {
            const status = await rpcCall(ENDPOINTS.taskQueueStatus, {});
            const snap = status?.value ?? null;
            setTaskQueueData(snap);
            if (snap?.running) {
              setTimeout(poll, 5000);
            } else {
              showToast('队列执行结束。');
              await refresh();
            }
          } catch { /* 轮询失败静默，下一轮再试 */ }
        };
        setTimeout(poll, 2000);
      } catch (error) {
        showToast(`队列异常：${error?.message ?? error}`);
      }
    },
    [rpcCall, refresh, showToast],
  );

  /** 移除账号（删除性操作：出池 + 删凭证文件；window.confirm 已由宿主全局确认兜底）。 */
  const onRemoveAccount = React.useCallback(
    async (account) => {
      const label = account.nickname || account.uid.slice(0, 8);
      if (typeof window !== 'undefined' && !window.confirm(`移除账号「${label}」将删除池状态与 auths/ 下的凭证文件，且不可恢复。确认移除？`)) {
        return;
      }
      try {
        const result = await rpcCall(ENDPOINTS.accountMore, { action: 'remove', uid: account.uid });
        if (result?.ok === false) {
          showToast(`移除失败：${result.error?.message ?? '未知错误'}`);
        } else {
          const fileError = result?.value?.file_error;
          showToast(fileError ? `已出池，但凭证文件删除失败：${fileError}` : `「${label}」已移除。`);
          await refresh();
        }
      } catch (error) {
        showToast(`移除异常：${error?.message ?? error}`);
      }
    },
    [rpcCall, refresh, showToast],
  );

  /**
   * 添加账号：发起 OAuth 登录，返回授权 URL。
   *
   * 返回原始 RPC 信封（`{ok, value|error}`）而不是抛异常：弹窗要按失败原因渲染
   * 就地提示。旧的网关对 workbuddy 回 400 unknown channel（`upstream-error`），
   * 这里把它翻译成可读的一句话——面板必须能区分「渠道不支持」与「网络故障」。
   */
  const onLoginStart = React.useCallback(
    async (channel, realm) => {
      try {
        const result = await rpcCall(ENDPOINTS.loginStart, { channel, realm });
        if (result?.ok === false && channel === 'workbuddy') {
          const message = result.error?.message ?? '';
          if (/unknown channel/i.test(message)) {
            return { ok: false, error: { message: '该网关版本不支持在面板里添加 workbuddy 账号 —— 请升级 chanhub 网关后重试。' } };
          }
        }
        return result;
      } catch (error) {
        return { ok: false, error: { message: String(error?.message ?? error) } };
      }
    },
    [rpcCall],
  );

  /** 添加账号：轮询登录态（弹窗负责节奏，这里只做转发）。 */
  const onLoginPoll = React.useCallback(
    async (channel) => rpcCall(ENDPOINTS.loginPoll, { channel }),
    [rpcCall],
  );

  /**
   * 添加账号：提交用户粘贴的回调。
   *
   * traework 的必经路径：Trae 授权页硬性要求回调是 127.0.0.1（远端打不开），
   * 登录凭证只能靠用户从地址栏复制回来。
   */
  const onLoginCallback = React.useCallback(
    async (channel, callback) => rpcCall(ENDPOINTS.loginCallback, { channel, callback }),
    [rpcCall],
  );

  /** 查看开学季券码（全部账号，只读）。 */
  const onViewVouchers = React.useCallback(
    async () => {
      setVouchersLoading(true);
      try {
        const result = await rpcCall(ENDPOINTS.schoolVouchersAll, {});
        if (result?.ok === false) {
          showToast(`券码查询失败：${result.error?.message ?? '未知错误'}`);
        } else {
          setVouchersData(result?.value ?? { rows: [] });
        }
      } catch (error) {
        showToast(`券码查询异常：${error?.message ?? error}`);
      } finally {
        setVouchersLoading(false);
      }
    },
    [rpcCall, showToast],
  );

  // 逐账号卡的有效选中 uid：用户显式选择优先；刷新后账号池变化导致选中失效时，
  // 回落到「账号池顺序里第一个有数据的账号」（而不是显示空白）。
  // 成长任务/开学季是 workbuddy 专属：兜底选号只在 wb 账号里挑，避免默认选中
  // trae/qoder 账号后卡片一直显示「加载失败」（网关对非 workbuddy 恒 501）。
  const taskAccounts = data?.status?.accounts ?? [];
  const wbTaskAccounts = taskAccounts.filter((account) => (channelOf?.(account) ?? 'workbuddy') === 'workbuddy');
  const effectiveGrowthUid = useSelectedUid(growthUid, growthByUid, wbTaskAccounts.length > 0 ? wbTaskAccounts : taskAccounts);
  const effectiveSchoolUid = useSelectedUid(schoolUid, schoolByUid, wbTaskAccounts.length > 0 ? wbTaskAccounts : taskAccounts);
  /** 单码/批量成长码写操作（点亮 accept / 领取 claim / 全部领取）。 */
  const onGrowthWrite = React.useCallback(
    async (action, code) => {
      // 必须用**当前卡片选中的账号**：此前这里取「第一个有数据的账号」，
      // 于是切到第 3 个账号后点「点亮」，改的却是第 1 个账号的进度（真机踩到）。
      const uid = effectiveGrowthUid;
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
    [rpcCall, refresh, showToast, effectiveGrowthUid],
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

  const status = data?.status;
  const maxInFlight = maxInFlightOf(configInfo?.config);
  // 按 realm 取在途上限（global 档优先）—— 账号卡/状态判定/在途列都用它，
  // 避免 global 号按 cn 档位误判「在途占满」。
  const limitOf = React.useCallback((account) => realmLimitOf(configInfo?.config, account?.realm), [configInfo?.config]);
  // admin 门槛可用性：探测 /admin/* 路由存在（405 判定）。true = 管理端点已开启，
  // 成长码写操作（点亮/领取）与批量任务按钮才出现；false = 如实隐藏并说明。
  const adminAvailable = data?.probe?.features?.admin === true || data?.probe?.features?.tasks === true;

  /** API_KEY 明文获取（顶栏小眼睛用；走已认证 RPC 通道，明文不落盘）。 */
  const onReveal = React.useCallback(async () => {
    try {
      const result = await rpcCall(ENDPOINTS.revealApiKey, {});
      if (result?.ok === false) {
        showToast(`获取失败：${result?.error?.message ?? '未知错误'}`);
        return '';
      }
      return String(result?.value?.apiKey ?? '');
    } catch (error) {
      showToast(`获取失败：${error?.message ?? error}`);
      return '';
    }
  }, [rpcCall, showToast]);

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

    // 顶栏（单行药丸条）：标题 + 连接状态 + API_KEY 药丸 + 刷新
    React.createElement(
      'div',
      { className: 'dshc-topbar' },
      React.createElement(Icons.hub, { style: { color: 'var(--dsw-alias-brand-primary,#4f6ef7)', width: 20, height: 20, flexShrink: 0 } }),
      React.createElement('span', { className: 'dshc-topbar-title' }, '渠道中心'),
      React.createElement(
        'span',
        { className: 'dshc-row', style: { gap: 6, marginLeft: 4 } },
        React.createElement('span', {
          className: 'dshc-statusdot',
          style: { background: data?.reachable === false || data?.error ? tone.err.fg : data?.reachable ? tone.ok.fg : tone.idle.fg },
        }),
        React.createElement('span', { style: { ...s.muted, whiteSpace: 'nowrap' } },
          data?.reachable === true
            ? `已连接 ${(data.baseURL ?? '').replace(/^https?:\/\//, '')}`
            : data?.reachable === false ? '未连接' : data?.error ? '异常' : '加载中…',
        ),
      ),
      React.createElement(ApiKeyPill, { onReveal }),
      React.createElement(
        'button',
        {
          type: 'button',
          // 刷新反馈：图标旋转 + 文案切换 + 禁用态。此前只有 disabled（无任何视觉
          // 差异），点下去看不出有没有生效 —— 与「刷新没反应」的报告一致。
          style: { ...s.btnGhost, height: 26, padding: '0 10px', marginLeft: 'auto', flexShrink: 0, gap: 5, opacity: refreshing ? 0.65 : 1 },
          onClick: refresh,
          disabled: refreshing,
          title: refreshing ? '正在刷新…' : '刷新数据（重新拉取账号、任务、用量、日志）',
        },
        React.createElement('span', { className: refreshing ? 'dshc-spin' : '' },
          React.createElement(Icons.refresh, null)),
        refreshing ? React.createElement('span', { style: { fontSize: 12 } }, '刷新中…') : null,
      ),
    ),

    // 出错时的细警示条（仅出错时出现，替代原整卡说明）
    data?.reachable === false
      ? React.createElement('div', { style: { ...s.err, marginBottom: 12, lineHeight: 1.7 } },
          `无法连接网关：${data.error?.message ?? '未知原因'} —— 请确认网关已启动、地址正确。`)
      : null,
    data?.reachable === true && data?.error
      ? React.createElement('div', { style: { ...s.err, marginBottom: 12, lineHeight: 1.7 } },
          `网关可达，但取状态失败：${data.error.message}`,
          data.error.code === 'auth-failed' ? '（API key 不匹配，请核对插件设置里的凭证）' : '')
      : null,
    err ? React.createElement('div', { style: { ...s.err, marginBottom: 12 } }, err) : null,

    // 刷新降级提示：网关没开 admin.enabled（或版本较旧）时刷新拿不到新余额，
    // 显示的是缓存值。必须说出来 —— 否则用户会以为积分卡住了。
    refreshDegraded
      ? React.createElement('div', { style: { ...s.warn, marginBottom: 12, lineHeight: 1.7 } },
          `积分可能不是最新的：${refreshDegraded}`,
          React.createElement('div', { style: { marginTop: 4 } },
            '在网关 config.json 里设置 ',
            React.createElement('code', { style: s.code }, 'admin.enabled: true'),
            ' 后重启网关，刷新即可同步最新余额。'))
      : null,

    // onAdd 为空（loginChannels 空数组 = 旧网关，或 null = 尚未探完）时不渲染按钮。
    React.createElement(TabBar, {
      active: activeTab,
      onChange: setActiveTab,
      statusText: '',
      onAdd: loginChannels && loginChannels.length > 0 ? () => setAddOpen(true) : undefined,
    }),

    // Tab 内容
    activeTab === 'accounts'
      ? React.createElement(AccountsTab, {
          status,
          channelOf,
          maxInFlight,
          limitOf,
          onAction: onAccountAction,
          busy: busyAccount,
          onRefresh: refresh,
          error: '',
          creditsByUid,
          scheduleConfig: configInfo?.config?.schedule,
          onRemove: onRemoveAccount,
          // 凭证盘点（只读、不含 token）：账号卡片的「到期」取它。
          authAccounts: authInfo?.ok ? authInfo.accounts : [],
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
          growthUid: effectiveGrowthUid,
          setGrowthUid,
          schoolUid: effectiveSchoolUid,
          setSchoolUid,
          onRunTask,
          runningName: runningTask,
          onRefresh: refresh,
          scheduleConfig: configInfo?.config?.schedule,
          onGrowthWrite: onGrowthWrite,
          growthWriteBusy: growthWriteBusy,
          adminAvailable: adminAvailable,
          scanData: taskScanData,
          scanning: taskScanning,
          queueData: taskQueueData,
          onScan: onTaskScan,
          onQueueStart: onTaskQueueStart,
          vouchersData: vouchersData,
          vouchersLoading: vouchersLoading,
          onViewVouchers: onViewVouchers,
        })
      : null,
    activeTab === 'usage'
      ? React.createElement(UsageTab, {
          // 用量页自管数据（SWR 缓存 + 一次拉 720h + 前端切片）。
          // 存量与归因命名复用账号池同源数据 —— 不新增任何网关请求。
          rpcCall,
          accounts: data?.status?.accounts ?? [],
          channelOf,
          onRefreshAll: refresh,
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
          prefs,
        })
      : null,

    // 添加账号弹窗（OAuth 设备授权）。会话态在网关侧，故关掉弹窗不丢失在途登录；
    // 重开只是重新发起——这是有意的：避免面板里藏一个不可见的后台轮询。
    addOpen
      ? React.createElement(AddAccountDialog, {
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
          onDone: refresh,
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
  // ctx.effect 在宿主里必有；渲染测试的极简垫片没有 —— 缺了也不能炸（生命周期
  // 归属只是「谁负责 dispose」，没有它插件照样能跑）。
  const effect = (factory, label) => {
    if (typeof ctx.effect === 'function') return ctx.effect(factory, label);
    return undefined;
  };

  // 侧边栏入口偏好：宿主 settings 命名空间 `dsh-chanhub.sidebarEntry`（跨浏览器一致），
  // 客户端用 settingsScope 读写；旧宿主没有该服务时降级为「默认开启、不可改」。
  const prefs = createSidebarPrefs(ctx.settingsScope, { namespace: SETTINGS_NAMESPACE, key: 'sidebarEntry' });
  // 侧边栏数据源：footer 按钮角标与 popover 读同一份快照（口径统一由 derive.js 保证）。
  const store = createQuickStore(rpcCall);
  effect(() => () => store.dispose(), 'dsh-chanhub: sidebar quick store');
  effect(() => () => prefs.dispose?.(), 'dsh-chanhub: sidebar entry prefs');

  // foot 区入口（list 槽；cordis 面板按默认 order=0 排在前，我们取 100 排其后）。
  ctx.slots.inject('sidebar.footer.action', () =>
    ctx.slots.register(
      {
        name: 'sidebar.footer.action',
        id: 'chanhub-quick',
        order: 100,
        label: () => '渠道账号',
        inject: () => ({
          store,
          prefs,
          // 宿主只提供「打开设置面板」；按 section 深链不存在，故不做假设。
          openSettings: () => ctx.remote?.settings?.openSettingsDocument?.(),
        }),
      },
      QuickEntry,
    ),
  );

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'dsh-chanhub',
        order: 11,
        label: () => '渠道中心',
        inject: () => ({ rpcCall, prefs }),
      },
      ChanhubPanel,
    ),
  );
}

// AddAccountDialog 与 apply 一并导出：前者是测试入口——渲染测试走打包产物
// （client/client.js）而非源码，与 client-render.test.mjs 的既有纪律一致。
export { name, inject, apply, AddAccountDialog };

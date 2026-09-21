// dsh-chanhub —— 纯派生逻辑（浏览器侧，无 React / 无 DOM）
//
// 为什么单独成文件：这一层承载全部**判定语义**（账号状态优先级、排程色块、
// 成长码归类、渠道拆分），是面板正确性的核心。抽出来才能在 node 下直接测。
//
// 依据：`ui-design.md` §4 状态语义、§5.1 总积分/渠道、§5.6 三个反直觉事实。

import { getPath } from '../lib/config-spec.js';

/** 渠道展示名。 */
export const CHANNEL_LABEL = {
  workbuddy: 'WB',
  traework: 'Trae',
  qoder: 'Qoder',
};

/** 渠道展示顺序（与用户要求的 WB / Trae / Qoder 一致）。 */
export const CHANNEL_ORDER = ['workbuddy', 'traework', 'qoder'];

/** 六类排程的展示定义（顺序即 UI 顺序）。 */
export const SCHEDULE_ITEMS = [
  { id: 'checkin', icon: '📅', label: '签到', hoursKey: 'checkin_hours', enabledKey: 'checkin_enabled' },
  { id: 'activity', icon: '🗺', label: '活跃地图', hoursKey: 'activity_hours', enabledKey: 'activity_enabled' },
  { id: 'travel', icon: '🐱', label: '猫猫旅行', hoursKey: 'travel_hours', enabledKey: 'travel_enabled' },
  { id: 'keepalive', icon: '🔑', label: 'token 保活', hoursKey: 'keepalive_hours', enabledKey: 'keepalive_enabled' },
  { id: 'school', icon: '🎓', label: '开学季', hoursKey: 'school_hours', enabledKey: 'school_enabled', subtasks: 5 },
  { id: 'cat', icon: '🌙', label: '夜猫子', hoursKey: 'cat_hours', enabledKey: 'cat_enabled', note: '窗口 23:00–08:00 CST' },
];

/**
 * 24 个成长任务码。
 *
 * 全部来自 `plugins/chanhub/scripts/task_runner.py` 的 MAPPING 表（逐条核对），
 * 不是从别处抄的。`target` 是该码的完成定义次数。
 */
export const GROWTH_CODES = [
  { code: 'create_canvas', label: '自造画布', target: 1 },
  { code: 'template_5', label: '使用模板 5 次', target: 5 },
  { code: 'expert_5', label: '召唤专家 5 次', target: 5 },
  { code: 'Expert_team_use_3', label: '团队专家 3 次', target: 3 },
  { code: 'skill_1', label: '使用技能 1 次', target: 1 },
  { code: 'automation_1', label: '创建自动化 1 次', target: 1 },
  { code: 'playbook_prompt', label: '使用案例 1 次', target: 1 },
  { code: 'Expert_lighthouse', label: '轻量云专家', target: 1 },
  { code: 'Buddy_App', label: 'Buddy 应用', target: 1 },
  { code: 'Buddy_App_QQ', label: '企鹅教师助手', target: 1 },
  { code: 'Hp_Appearance', label: '更换主题外观', target: 1 },
  { code: 'chat_5', label: '对话 5 次', target: 5 },
  { code: 'Model_chat_GLM5.2', label: 'GLM5.2 对话', target: 1 },
  { code: 'black_cat', label: '夜猫子对话', target: 3 },
  { code: 'first_buddy', label: '领养 Buddy', target: 1 },
  { code: 'RichMeow_Chat', label: '桌面端对话链', target: 1 },
  { code: 'Library_read', label: '资料库点击', target: 1 },
  { code: 'chat_3_times', label: '与 AI 对话 3 次', target: 3 },
  { code: 'expert_use', label: '开学季专家', target: 1 },
  { code: 'share_invite', label: '分享给好友', target: 1 },
  { code: 'desktop_chat_1_time', label: '桌面端对话 1 次', target: 1 },
  { code: 'Sequential_Tasks_1', label: '小程序连续任务', target: 1 },
  { code: 'school_season', label: '校园日任务', target: 1 },
  { code: 'Expert_Philanthropy', label: '公益提问（不可代做）', target: 1, unforgeable: true },
];

/**
 * 有定时排程覆盖的成长码 —— 这是 §5.6 事实② 的核心数据。
 *
 * 只有两个：`chat_5` 走活跃地图（间接，`ReportChatActivity`），
 * `black_cat` 走夜猫子（直接 `--only black_cat`）。**其余 22 个无任何定时入口。**
 */
export const SCHEDULED_CODES = { chat_5: 'activity', black_cat: 'cat' };

/**
 * 判定账号状态（按优先级，见 ui-design.md §4.1）。
 *
 * 优先级刻意如此：叠加态（手动停用 + 系统禁用）必须**同时**给出两个按钮，
 * 因为后端两位独立清除（`entry.go` 的 manual_disabled 与 disabled 并列），
 * 合并成一个按钮会误导用户以为一次点击即回池。
 *
 * @param account - `/status` 的单个账号对象。
 * @param maxInFlight - `pool.max_in_flight`（0 = 不限）。
 * @returns `{label, tone, actions, detail}`。
 */
export function accountState(account, maxInFlight) {
  const manual = account?.manual_disabled === true;
  const disabled = account?.disabled === true;

  // 叠加态：两个动作都要给
  if (manual && disabled) {
    return {
      key: 'manual+disabled',
      label: '手动停用 + 系统禁用',
      tone: 'err',
      actions: ['enable', 'revive'],
      detail: [account.manual_reason, account.disabled_reason].filter(Boolean).join(' · '),
    };
  }
  if (manual) {
    return {
      key: 'manual',
      label: '手动停用',
      tone: 'err',
      actions: ['enable'],
      detail: account.manual_reason || '',
    };
  }
  if (disabled) {
    return {
      key: 'disabled',
      label: '已禁用（系统）',
      tone: 'err',
      actions: ['revive'],
      detail: account.disabled_reason || '',
    };
  }
  if (account?.cooling === true) {
    const kind = account.cool_kind;
    const remaining = account.cool_remaining_sec;
    let text = '冷却中';
    if (kind === 'soft_rate') text = '软限流（429）';
    else if (kind === 'hard_credit') text = '积分耗尽，冷却至次日 04:00';
    else if (kind === 'degrade') text = '连败降权中';
    else if (account.reason) text = account.reason;
    const suffix = typeof remaining === 'number' && remaining > 0 ? ` · 剩余 ${formatDuration(remaining)}` : '';
    return { key: 'cooling', label: `冷却 · ${text}`, tone: 'warn', actions: [], detail: suffix };
  }
  const limit = typeof maxInFlight === 'number' ? maxInFlight : undefined;
  const inFlight = typeof account?.in_flight === 'number' ? account.in_flight : 0;
  if (limit !== undefined && limit > 0 && inFlight >= limit) {
    return {
      key: 'full',
      label: `在途占满 ${inFlight}/${limit}`,
      tone: 'warn',
      actions: [],
      detail: '',
    };
  }
  return { key: 'ok', label: '可用', tone: 'ok', actions: ['disable'], detail: '' };
}

/**
 * 账号左侧状态圆点的颜色语义。
 * @param state - accountState 的返回值。
 * @returns 'ok' | 'warn' | 'err'。
 */
export function dotTone(state) {
  if (!state) return 'idle';
  return state.tone;
}

/**
 * 把秒数格式化成中文时长（完整单位，不用缩写）。
 * @param seconds - 秒数。
 * @returns 如 `2 小时 5 分` / `45 秒` / `1 天 3 小时`。
 */
export function formatDuration(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return '—';
  const total = Math.floor(seconds);
  const day = Math.floor(total / 86400);
  const hour = Math.floor((total % 86400) / 3600);
  const minute = Math.floor((total % 3600) / 60);
  const second = total % 60;
  const parts = [];
  if (day > 0) parts.push(`${day} 天`);
  if (hour > 0) parts.push(`${hour} 小时`);
  if (minute > 0 && day === 0) parts.push(`${minute} 分`);
  if (parts.length === 0) parts.push(`${second} 秒`);
  return parts.slice(0, 2).join(' ');
}

/**
 * 相对时间（「2 分钟前」）。
 * @param iso - 时间字符串或时间戳。
 * @param now - 参照时刻（毫秒），便于测试注入。
 * @returns 中文相对时间；无法解析时返回 '—'。
 */
export function relativeTime(iso, now = Date.now()) {
  if (iso === undefined || iso === null || iso === '') return '—';
  const value = typeof iso === 'number' ? iso : Date.parse(iso);
  if (!Number.isFinite(value)) return '—';
  // Go 的零值时间（0001-01-01）语义是「从未发生」，必须与「很久以前」区分。
  if (value <= 0) return '—';
  const delta = Math.max(0, now - value);
  const seconds = Math.floor(delta / 1000);
  if (seconds < 60) return `${seconds} 秒前`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
  return `${Math.floor(seconds / 86400)} 天前`;
}

/**
 * 判断一个 Go 时间字符串是否为「零值」（0001-01-01T00:00:00Z）。
 * @param iso - 时间字符串。
 * @returns true 表示零值。
 */
export function isZeroTime(iso) {
  if (typeof iso !== 'string' || iso === '') return true;
  return Date.parse(iso) <= 0;
}

/**
 * 千分位格式化。
 * @param value - 数字。
 * @returns 带分隔符的字符串。
 */
export function formatNumber(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toLocaleString('en-US');
}

/**
 * 从账号列表按渠道分组，产出「总积分 + 各渠道积分与号数」。
 *
 * 语义要点（ui-design.md §5.1）：**不可消耗积分不并入总数**，
 * 所以这里分两个口径返回：
 *   - `consumable`：该渠道号数 × 当前 credits 之和（可消耗，用于选号判断）
 *   - `creditsTotal`：上游下发的 credits_total（含不可消耗的池），仅供参考
 *
 * @param accounts - `/status` 的 accounts 数组。
 * @param channelOf - `(account) => channel` 的解析函数（渠道来自 auth 文件，不在 /status 里）。
 * @returns `{total, creditsTotal, channels:[{id,label,credits,creditsTotal,count}]}`。
 */
export function groupByChannel(accounts, channelOf = () => 'workbuddy') {
  const buckets = new Map();
  for (const id of CHANNEL_ORDER) {
    buckets.set(id, { id, label: CHANNEL_LABEL[id] ?? id, credits: 0, creditsTotal: 0, count: 0 });
  }
  for (const account of accounts ?? []) {
    const id = channelOf(account) || 'workbuddy';
    if (!buckets.has(id)) {
      buckets.set(id, { id, label: CHANNEL_LABEL[id] ?? id, credits: 0, creditsTotal: 0, count: 0 });
    }
    const bucket = buckets.get(id);
    bucket.credits += typeof account?.credits === 'number' ? account.credits : 0;
    bucket.creditsTotal += typeof account?.credits_total === 'number' ? account.credits_total : 0;
    bucket.count += 1;
  }
  const channels = [...buckets.values()].filter((bucket) => bucket.count > 0 || CHANNEL_ORDER.includes(bucket.id));
  return {
    total: channels.reduce((sum, bucket) => sum + bucket.credits, 0),
    creditsTotal: channels.reduce((sum, bucket) => sum + bucket.creditsTotal, 0),
    channels,
  };
}

/**
 * 由 realm_totals 计算域可用性条。
 * @param realmTotals - `/status` 的 realm_totals。
 * @returns `[{realm, healthy, total, label}]`。
 */
export function realmAvailability(realmTotals) {
  const labels = { cn: 'CN 域', global: 'Global 域' };
  const realms = ['cn', 'global'];
  return realms
    .filter((realm) => realm in (realmTotals ?? {}))
    .map((realm) => {
      const entry = realmTotals[realm] ?? {};
      return {
        realm,
        label: labels[realm] ?? realm,
        healthy: entry.healthy ?? 0,
        total: entry.total ?? 0,
        cooling: entry.cooling ?? 0,
        disabled: entry.disabled ?? 0,
      };
    });
}

/**
 * 五联计数。
 * @param status - `/status` 响应。
 * @returns `[{label,value,tone}]`。
 */
export function summaryCounters(status) {
  const sticky = status?.sticky_sessions;
  return [
    { key: 'total', label: '账号总数', value: status?.total ?? 0, tone: 'idle' },
    { key: 'healthy', label: '健康', value: status?.healthy ?? 0, tone: 'ok' },
    { key: 'cooling', label: '冷却中', value: status?.cooling ?? 0, tone: 'warn' },
    { key: 'in_flight_full', label: '在途占满', value: status?.in_flight_full ?? 0, tone: 'warn' },
    ...(typeof sticky === 'number'
      ? [{ key: 'sticky', label: '粘性会话', value: sticky, tone: 'info' }]
      : []),
  ];
}

/**
 * 质量组摘要（折叠态也要能判断状态）。
 * @param account - 账号对象。
 * @returns 摘要文本。
 */
export function qualitySummary(account) {
  const success = account?.success_count ?? 0;
  const errTotal = account?.err_total ?? 0;
  const total = success + errTotal;
  const rate = total > 0 ? `${((success / total) * 100).toFixed(1)}%` : '—';
  return `${success} 成功 / ${errTotal} 失败 · 成功率 ${rate} · ${relativeTime(account?.last_success)}`;
}

/**
 * 健康组摘要。
 * @param account - 账号对象。
 * @param state - accountState 的返回值。
 * @returns 摘要文本。
 */
export function healthSummary(account, state) {
  const inFlight = account?.in_flight ?? 0;
  const breaker = account?.breaker_fails ?? 0;
  const parts = [state?.label ?? '—', `在途 ${inFlight}`];
  if (breaker > 0) parts.push(`熔断计数 ${breaker}`);
  if (!isZeroTime(account?.breaker_until)) parts.push(`熔断至 ${account.breaker_until}`);
  if (account?.consecutive_fails > 0) parts.push(`连败 ${account.consecutive_fails}`);
  return parts.join(' · ');
}

/**
 * 积分组摘要。
 * @param account - 账号对象。
 * @returns 摘要文本。
 */
export function creditsSummary(account) {
  const usable = account?.credits ?? 0;
  const totalCredits = account?.credits_total ?? 0;
  const unusable = Math.max(0, totalCredits - usable);
  const parts = [`${formatNumber(usable)} 可用`];
  if (unusable > 0) parts.push(`${formatNumber(unusable)} 不可消耗`);
  return parts.join(' · ');
}

/**
 * 排程项的当前状态。
 *
 * ⚠️ **数据来源限制（必须如实告知）**：chanhub 目前**没有**任何按账号的排程执行状态
 * 接口（已穷举全部路由确认）。所以这里只能表达两类**真实**信息：
 *   1. 该排程是否已启用、计划时刻是什么（来自 config.json，真实可读）；
 *   2. 是否处于可执行时间窗口内（由 config 的小时值与本机时钟算出，真实可推导）。
 * **执行结果（今日已签 / 进行中 / 已完成）无法获得** —— 返回 `unknown`，
 * 由 UI 显示为「无数据」，绝不用推测值填充。
 *
 * @param item - SCHEDULE_ITEMS 的一项。
 * @param scheduleConfig - config.json 的 schedule 段。
 * @param now - 当前 Date（便于测试注入）。
 * @returns `{key, label, tone, hours, enabled, inWindow, unknown}`。
 */
export function scheduleState(item, scheduleConfig, now = new Date()) {
  const enabled = scheduleConfig?.[item.enabledKey] !== false;
  const hours = scheduleConfig?.[item.hoursKey];
  const hourList = Array.isArray(hours) ? hours : [];
  const currentHour = now.getHours();

  let inWindow = false;
  if (item.id === 'cat') {
    // 夜猫子窗口跨午夜：23:00–08:00
    inWindow = currentHour >= 23 || currentHour < 8;
  } else {
    inWindow = hourList.includes(currentHour);
  }

  let key;
  if (!enabled) key = 'na';
  else if (hourList.length === 0 && item.id !== 'cat') {
    // 空数组 = 未配置 → 后端回落默认。我们无法知道实际生效值，标 na 而不是假装知道。
    key = 'na';
  } else if (inWindow) key = 'run';
  else key = 'wait';

  return {
    key,
    label: item.label,
    enabled,
    hours: hourList,
    inWindow,
    // 执行结果不可得 —— 显式标注，UI 才能如实显示而不是编造。
    unknown: true,
  };
}

/**
 * 排程小时的可读展示。
 * @param item - 排程项定义。
 * @param scheduleConfig - schedule 段。
 * @returns 如 `09:00 · 21:00`。
 */
export function scheduleHoursText(item, scheduleConfig) {
  if (item.id === 'cat') return '23:00–08:00';
  const hours = scheduleConfig?.[item.hoursKey];
  if (!Array.isArray(hours) || hours.length === 0) return '默认';
  return hours.map((hour) => `${String(hour).padStart(2, '0')}:00`).join(' · ');
}

/**
 * 统计「有多少成长码没有任何定时入口」—— §5.6 事实② 的警示数字。
 * @returns `{total, scheduled, unscheduled}`。
 */
export function codeCoverage() {
  const total = GROWTH_CODES.length;
  const scheduled = Object.keys(SCHEDULED_CODES).length;
  return { total, scheduled, unscheduled: total - scheduled };
}

/**
 * 由 config.json 的 pool 段取在途上限（用于账号状态判定）。
 * @param gatewayConfig - config.json 内容。
 * @returns 数值；缺失时 undefined。
 */
export function maxInFlightOf(gatewayConfig) {
  const value = getPath(gatewayConfig ?? {}, 'pool.max_in_flight');
  return typeof value === 'number' ? value : undefined;
}

/**
 * 建账号 → channel 解析函数。
 *
 * 优先级（新→旧）：
 *   1. `/status` 自带的 `account.channel`（网关已原生透出 —— 首选，
 *      无同机限制、无 auths 目录依赖）；
 *   2. auth 凭证文件推断（`auth.channel` / `auth.domain`，旧网关回退路径，
 *      规则与后端 `auth.ResolveChannel` 一致）；
 *   3. 都没有 → workbuddy（后端 ChannelDefault 同值）。
 *
 * @param authFiles - `[{uid, channel, domain}]`（旧回退源，可空）。
 * @returns `(account) => channel` 的解析函数。
 */
export function channelResolver(authFiles) {
  const byUid = new Map();
  for (const entry of authFiles ?? []) {
    if (entry?.uid) byUid.set(entry.uid, resolveChannel(entry.channel, entry.domain));
  }
  return (account) => {
    // 新网关：/status 直接给 channel（来自登录落盘的 channel_ext / Backfill）
    if (typeof account?.channel === 'string' && account.channel !== '') {
      return account.channel;
    }
    return byUid.get(account?.uid) ?? 'workbuddy';
  };
}

/**
 * 渠道推断（与 chanhub `auth.ResolveChannel` 同规则）。
 * @param explicit - 凭证里显式声明的 channel。
 * @param domain - 凭证里的 domain。
 * @returns 归一化渠道名。
 */
export function resolveChannel(explicit, domain) {
  // 与后端 auth.ResolveChannel 逐条对齐：
  //   - 显式值非空但**不认识** → 直接回落 workbuddy（后端同款「不猜」），
  //     不得继续走 domain 推断 —— 两处判定必须一致，否则面板显示的渠道
  //     会与网关实际选路不符（D2 测试抓到过这条偏差）。
  const trimmed = typeof explicit === 'string' ? explicit.trim().toLowerCase() : '';
  if (trimmed !== '') {
    if (trimmed === 'workbuddy' || trimmed === 'traework' || trimmed === 'qoder') return trimmed;
    return 'workbuddy';
  }
  const value = typeof domain === 'string' ? domain.trim().toLowerCase() : '';
  if (value.endsWith('qoder.com.cn') || value.endsWith('qoder.com')) return 'qoder';
  if (value.endsWith('trae.cn') || value.endsWith('trae.com.cn') || value.endsWith('mchost.guru')) {
    return 'traework';
  }
  return 'workbuddy';
}

/* ══════════════════════════════════════════════════════════════════════════
   用量 Tab 专用派生逻辑（纯函数，node 下可测）
   ══════════════════════════════════════════════════════════════════════════
   数据边界（务必分清，混算会得出错误结论）：
     · 窗口分桶 /v1/stats/buckets —— 受 window 参数约束，落盘 data/usage.json，
       重启不清；槽粒度混合（近 48h 小时槽，更早日槽）。
     · 进程累计 /v1/stats —— 无窗口维度，自进程启动累计，重启清零。
   两者口径不同，UI 必须分区标注，不得相减或相加。
   ══════════════════════════════════════════════════════════════════════════ */

/** 单位换算常量（token 展示用）。 */
const K = 1000;
const M = 1000 * 1000;

/**
 * 槽类型：网关 `bucketSlot()` 的镜像判定。
 *
 * 为什么需要：小时槽 `h:2026-09-21T08` 与日槽 `d:2026-09-19` 混在同一数组里，
 * 语义完全不同（前者=某小时，后者=整天折叠）。若不区分，热力图/时间轴会把
 * 「一整天的量」画成「某个小时」，凭空造出不存在的小时分布。
 *
 * @param slot - 槽字符串。
 * @returns `'hour'` | `'day'` | `'unknown'`。
 */
export function slotKind(slot) {
  if (typeof slot !== 'string' || slot.length < 2) return 'unknown';
  if (slot.startsWith('h:')) return 'hour';
  if (slot.startsWith('d:')) return 'day';
  return 'unknown';
}

/**
 * 解析槽字符串为时间戳（本地时区，与网关 `time.Format` 同构）。
 * @param slot - 槽字符串。
 * @returns 毫秒时间戳；无法解析时返回 NaN。
 */
export function parseSlot(slot) {
  const kind = slotKind(slot);
  if (kind === 'unknown') return Number.NaN;
  // h:2026-09-21T08 → 2026-09-21T08:00 本地时间
  // d:2026-09-19     → 2026-09-19T00:00 本地时间
  const raw = slot.slice(2);
  return kind === 'hour' ? Date.parse(`${raw}:00:00`) : Date.parse(`${raw}T00:00:00`);
}

/**
 * 按时间槽聚合分桶行 —— **修掉旧实现的核心 bug**。
 *
 * 旧实现：`buckets.slice(-48)` 直接把 (槽 × 域 × 账号 × 模型) 的**行**当柱子渲染。
 *   3 账号 × 5 模型 = 每小时 15 行，72h 窗口下最后一屏只有约 3 小时的数据，
 *   且同一小时被画成 15 根柱 —— 柱数 ≠ 槽数，时间轴与总量对不上。
 * 本函数：先按 `slot` 求和，一行代表**一个时间槽**，柱数 === 槽数。
 *
 * @param buckets - `/v1/stats/buckets` 的 buckets 数组。
 * @returns 时间升序的 `[{slot, kind, at, requests, failed, success, tokens, promptTokens, completionTokens, credit, latencyMS}]`。
 */
export function usageBySlot(buckets) {
  if (!Array.isArray(buckets)) return [];
  const table = new Map();
  for (const row of buckets) {
    if (!row || typeof row.slot !== 'string') continue;
    const key = row.slot;
    let entry = table.get(key);
    if (!entry) {
      entry = {
        slot: key,
        kind: slotKind(key),
        at: parseSlot(key),
        requests: 0, failed: 0, success: 0,
        promptTokens: 0, completionTokens: 0, tokens: 0,
        credit: 0, latencySum: 0,
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
    // 均值必须按请求数加权重算 —— 分桶只有各自均值，直接平均会失真
    // （与网关 accumulate() 的加权口径一致）。
    entry.latencySum += (Number(row.avg_latency_ms) || 0) * requests;
  }
  return [...table.values()]
    .map((entry) => ({
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
      latencyMS: entry.requests > 0 ? entry.latencySum / entry.requests : 0,
    }))
    .sort((a, b) => a.at - b.at);
}

/**
 * 归因表占比与派生列。
 *
 * @param rows - `by_uid` / `by_realm` / `by_model` 之一。
 * @param total - 同响应里的 `total`。
 * @returns 每行补上 `share`（0–1）与 `successRate`（0–1）。
 */
export function usageShares(rows, total) {
  const list = Array.isArray(rows) ? rows : [];
  const totalRequests = Number(total?.requests) || list.reduce((sum, row) => sum + (Number(row?.requests) || 0), 0);
  return list.map((row) => {
    const requests = Number(row?.requests) || 0;
    const failed = Number(row?.failed) || 0;
    return {
      ...row,
      share: totalRequests > 0 ? requests / totalRequests : 0,
      successRate: requests > 0 ? (requests - failed) / requests : 0,
    };
  });
}

/**
 * Token 结构比例（窗口口径：分桶只有 prompt / completion 两段）。
 *
 * 刻意**不**拆缓存段：`cache_*` 只存在于进程累计的 `/v1/stats`，
 * 混进窗口结构条就是跨口径拼数据。
 *
 * @param total - 窗口 total。
 * @returns `{prompt, completion, total, promptShare, completionShare}`。
 */
export function tokenStructure(total) {
  const prompt = Number(total?.prompt_tokens) || 0;
  const completion = Number(total?.completion_tokens) || 0;
  const sum = Number(total?.total_tokens) || prompt + completion;
  const denom = sum > 0 ? sum : 1;
  return {
    prompt,
    completion,
    total: sum,
    promptShare: prompt / denom,
    completionShare: completion / denom,
  };
}

/**
 * 存量积分（跨账号汇总）。
 *
 * 语义要点（用户明确要求 + ui-design §5.1）：**只把可消耗算进总数**，
 * 不可消耗单列 —— 混算会让用户按虚高余额判断账号价值。
 *
 * @param accounts - `/status` 的 accounts。
 * @param creditsByUid - `{uid: {available, credits:{usable_total, unusable_total}}}`。
 * @param channelOf - `(account) => channel`。
 * @returns `{usable, unusable, byChannel:[{id,usable,count}], accountCount}`。
 */
export function creditStock(accounts, creditsByUid, channelOf = () => 'workbuddy') {
  const list = Array.isArray(accounts) ? accounts : [];
  const byChannel = new Map();
  let usable = 0;
  let unusable = 0;
  for (const account of list) {
    const channel = channelOf(account) ?? 'workbuddy';
    if (!byChannel.has(channel)) byChannel.set(channel, { id: channel, usable: 0, count: 0 });
    const bucket = byChannel.get(channel);
    const live = Number(account?.credits) || 0;
    bucket.usable += live;
    bucket.count += 1;
    usable += live;
    // 不可消耗 = 上游总额 − 可消耗。明细端点在场时取更精确的口径。
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

/**
 * 燃尽天数预估：存量 ÷ 窗口日均消耗。
 *
 * 仅当窗口有正消耗时才有意义 —— 无消耗时返回 `null`，由 UI 显示「—」，
 * 而不是除零得 Infinity 或编一个数字。
 *
 * @param usable - 可用存量。
 * @param windowCredit - 窗口内积分消耗。
 * @param windowValue - 窗口字符串（`24h`/`72h`/`168h`/`720h`）。
 * @returns `{days, perDay}` 或 `null`。
 */
export function creditBurn(usable, windowCredit, windowValue) {
  const hours = windowHours(windowValue);
  const credit = Number(windowCredit) || 0;
  const stock = Number(usable) || 0;
  if (hours === null || credit <= 0 || stock <= 0) return null;
  const perHour = credit / hours;
  const perDay = perHour * 24;
  if (!Number.isFinite(perDay) || perDay <= 0) return null;
  return { days: stock / perDay, perDay };
}

/** 窗口字符串 → 小时数（与网关 parseWindow 的可选值一致）。 */
export function windowHours(value) {
  const map = { '24h': 24, '72h': 72, '168h': 168, '720h': 720, '7d': 168, '30d': 720 };
  return map[value] ?? null;
}

/**
 * 余额新鲜度：最早一次余额更新的相对时间。
 * @param accounts - accounts 数组。
 * @returns `{oldestISO, stale}`；stale 表示超过 1 小时未更新。
 */
export function creditsFreshness(accounts, now = Date.now()) {
  const times = (Array.isArray(accounts) ? accounts : [])
    .map((account) => Date.parse(account?.credits_at))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (times.length === 0) return { oldestISO: null, stale: false };
  const oldest = Math.min(...times);
  return { oldestISO: new Date(oldest).toISOString(), stale: now - oldest > 3600e3 };
}

/**
 * Token 数量紧凑格式化（k / M）。
 * @param value - 数字。
 * @returns 如 `412.3k` / `11.68M`。
 */
export function formatTokens(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  if (Math.abs(value) >= M) return `${(value / M).toFixed(2)}M`;
  if (Math.abs(value) >= K) return `${(value / K).toFixed(1)}k`;
  return String(Math.round(value));
}

/**
 * 积分格式化（小数量保留更多位，避免 0.03 被显示成 0.0）。
 * @param value - 数字。
 * @returns 字符串。
 */
export function formatCredit(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  if (Math.abs(value) >= 1000) return formatNumber(Math.round(value));
  if (Math.abs(value) >= 1) return value.toFixed(2);
  return value.toFixed(3);
}

/**
 * 百分比格式化。
 * @param value - 0–1 的比例。
 * @param digits - 小数位（默认 1）。
 * @returns 如 `99.8%`；非有限值返回 `—`。
 */
export function formatPercent(value, digits = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

/**
 * 时间段标签（轴刻度 / tooltip）。
 * @param slot - 槽字符串。
 * @returns 小时槽 → `MM-DD HH:00`；日槽 → `YYYY-MM-DD（日槽）`；其他 → 原串。
 */
export function slotLabel(slot) {
  const at = parseSlot(slot);
  if (!Number.isFinite(at)) return slot;
  const date = new Date(at);
  const pad = (value) => String(value).padStart(2, '0');
  if (slotKind(slot) === 'day') {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}（日槽）`;
  }
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:00`;
}

/**
 * 刻度上限取整（图表 y 轴用）。
 * @param value - 数据最大值。
 * @returns 不小于 value 的「好看」上限。
 */
export function niceMax(value) {
  const max = Number(value);
  if (!Number.isFinite(max) || max <= 0) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / (power / 2)) * (power / 2);
}

/**
 * 进程累计口径的时长（uptime 秒 → 中文）。
 * @param seconds - 秒。
 * @returns 如 `3 小时 12 分`。
 */
export function uptimeText(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return '—';
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  if (hours >= 24) return `${Math.floor(hours / 24)} 天 ${hours % 24} 小时`;
  if (hours > 0) return `${hours} 小时 ${minutes} 分`;
  if (minutes > 0) return `${minutes} 分`;
  return `${Math.floor(value)} 秒`;
}

/**
 * 逐键请求序列（归因表 sparkline 用）。
 *
 * 与 `usageShares` 的分工：后者给「整窗口合计 + 占比」，本函数给「随时间的变化」。
 * 两者都从同一份 buckets 派生，但一个按槽聚合、一个按键聚合并保留时间轴。
 *
 * @param buckets - buckets 数组。
 * @param field - `'uid'` | `'realm'` | `'model'`。
 * @returns `{slots:[slot...], series: Map<key, number[]>}`，`series` 的值与 `slots` 对齐。
 */
export function usageSeriesByKey(buckets, field) {
  const slots = usageBySlot(buckets).map((row) => row.slot);
  const index = new Map(slots.map((slot, i) => [slot, i]));
  const series = new Map();
  for (const row of Array.isArray(buckets) ? buckets : []) {
    if (!row || typeof row.slot !== 'string') continue;
    const slotIndex = index.get(row.slot);
    if (slotIndex === undefined) continue;
    // 与网关 accumulate() 的键规则一致：空键在 uid/model 维度无意义，跳过。
    const raw = row[field];
    const key = typeof raw === 'string' && raw !== '' ? raw : '';
    if (key === '' && field !== 'realm') continue;
    const useKey = key === '' ? 'total' : key;
    if (!series.has(useKey)) series.set(useKey, new Array(slots.length).fill(0));
    series.get(useKey)[slotIndex] += Number(row.requests) || 0;
  }
  return { slots, series };
}

/* ══════════════════════════════════════════════════════════════════════════
   热力图 / 环形图派生（参考 dsh-usage-panel 的 GitHub 式热力图与 donut）
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * 把分桶行折叠成「日历日 → 请求/Token/积分」。
 *
 * 为什么要合并两种槽：网关的槽粒度是混合的 —— 近 48h 是小时槽 `h:...`，
 * 更早折叠成日槽 `d:...`（`internal/server/usage.go` 的 bucketSlot）。
 * 但**热力图的单位是「天」**，小时槽属于哪天是确定的，所以两段可以在
 * 「天」这一层安全相加 —— 这不是跨口径混算（两者同属窗口分桶）。
 * 反面做法：直接把日槽当小时槽塞进「日期×小时」网格（上一版就这么干过，
 * 会凭空造出不存在的小时分布）。
 *
 * @param rows - `usageBySlot()` 的输出。
 * @returns `[{date, requests, tokens, credit, kind}]`，date 为本地 `YYYY-MM-DD`。
 */
export function usageByDay(rows) {
  const table = new Map();
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
    if (row.kind === 'hour') entry.hours += 1;
    else entry.days += 1;
  }
  return [...table.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** 本地日历日 `YYYY-MM-DD`。 */
export function localDayKey(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * 分位阈值（参考实现同款）：对**非零**值取 4 分位，色阶 h0..h4。
 *
 * 为什么用分位而不是线性：用量分布长尾极重（一天几十、某天几千），
 * 线性映射会让绝大多数格子落在最浅两档，热力图退化成一片浅色。
 *
 * @param values - 非零数值数组。
 * @returns 4 个升序阈值；样本不足时按可用值退化。
 */
export function quartileThresholds(values) {
  const list = (Array.isArray(values) ? values : [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);
  if (list.length === 0) return [0, 0, 0, 0];
  const at = (q) => list[Math.min(list.length - 1, Math.max(0, Math.floor(q * (list.length - 1))))];
  return [at(0.25), at(0.5), at(0.75), at(1)];
}

/**
 * 按分位阈值给数值定级（0=无用量，1..4 由浅到深）。
 * @param value - 当日数值。
 * @param thresholds - `quartileThresholds()` 的输出。
 * @returns 0–4。
 */
export function heatLevel(value, thresholds) {
  const v = Number(value) || 0;
  if (v <= 0) return 0;
  const [q1, q2, q3, q4] = thresholds;
  // 样本过少时四分位会塌成同一个值（如只有 1 天数据 → 4 个阈值都等于它），
  // 此时「最大值」必须仍显示为最深档，否则整张图只剩最浅色、看不出强弱。
  if (q1 === q4) return v >= q4 ? 4 : 1;
  if (v <= q1) return 1;
  if (v <= q2) return 2;
  if (v <= q3) return 3;
  return 4;
}

/**
 * 构建热力图网格（周为列、周一→周日为行）—— **固定窗口骨架**。
 *
 * 设计要点（修的是真实数据下的退化）：网格宽度由 `windowDays` 决定，
 * **不随「有数据的天数」伸缩**。原先按实际天数推 weeks，于是只有 1 天数据时
 * 只画 1 列 —— 屏幕上就是一个 11px 方块，用户以为「没有热力图」。
 * 现在无论有没有数据，骨架都是完整的 30 天：形状先立住，让人看出
 * 「功能在，只是这段没记录」，而不是以为功能缺失。
 *
 * @param days - `usageByDay()` 的输出（用于取值）。
 * @param options - `{windowDays, end}`：窗口天数（默认 30）与窗口结束日。
 * @returns `{weeks, cells, monthLabels, max, activeDays, coveredDays}`。
 */
export function heatGrid(days, options = {}) {
  const windowDays = Math.max(1, Number(options.windowDays) || 30);
  const list = (Array.isArray(days) ? days : []).filter((d) => d && typeof d.date === 'string');
  const byDate = new Map(list.map((d) => [d.date, d]));

  // 窗口结束日：默认今天（本地时区），截断到当天 0 点
  const end = options.end instanceof Date ? new Date(options.end) : new Date();
  end.setHours(0, 0, 0, 0);
  const first = new Date(end.getTime() - (windowDays - 1) * 86400e3);

  // 周一为一周之始；窗口起点之前的格子留空（GitHub 同款处理）
  const lead = (first.getDay() + 6) % 7;
  const weeks = Math.ceil((lead + windowDays) / 7);

  const inWindow = list.filter((d) => {
    const at = new Date(`${d.date}T00:00:00`).getTime();
    return at >= first.getTime() && at <= end.getTime();
  });
  const nonzero = inWindow.filter((d) => d.requests > 0).map((d) => d.requests);
  const thresholds = quartileThresholds(nonzero);

  const cells = [];
  const monthLabels = [];
  let prevMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const monday = new Date(first.getTime() + (w * 7 - lead) * 86400e3);
    const month = monday.getMonth();
    monthLabels.push(w === 0 || month !== prevMonth ? `${month + 1}月` : '');
    prevMonth = month;
    for (let r = 0; r < 7; r++) {
      const cur = new Date(monday.getTime() + r * 86400e3);
      const key = localDayKey(cur);
      const beforeWindow = cur.getTime() < first.getTime();
      const afterWindow = cur.getTime() > end.getTime();
      const rec = byDate.get(key);
      cells.push(
        beforeWindow || afterWindow
          ? { date: key, value: 0, level: 0, blank: true, outside: true, week: w }
          : {
              date: key,
              value: rec ? rec.requests : 0,
              level: rec ? heatLevel(rec.requests, thresholds) : 0,
              blank: false,
              outside: false,
              week: w,
            },
      );
    }
  }

  return {
    weeks,
    cells,
    monthLabels,
    max: nonzero.length > 0 ? Math.max(...nonzero) : 0,
    activeDays: nonzero.length,
    coveredDays: inWindow.length,
    windowDays,
  };
}

/**
 * 按「一天中的第几小时」汇总（0–23）—— 数据不足以画「按天」热力图时的替代视图。
 *
 * 为什么需要：网关的小时槽只保留 48 小时，所以「近 30 天热力图」在早期
 * 几乎无数据可画。此时按「小时」反而是**真实有数据**的那个维度，
 * 能回答同一个问题（什么时候在用），而不是留一块空网格。
 *
 * @param rows - `usageBySlot()` 的输出。
 * @returns 24 项 `[{hour, requests, tokens, slots}]`。
 */
export function hourlyProfile(rows) {
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

/**
 * 模型占比（donut 用）：按 token 占比降序，合并长尾为「其他」。
 *
 * @param rows - `by_model`。
 * @param limit - 保留的前 N 名（其余合并）。
 * @returns `[{key, tokens, share}]`。
 */
export function modelShares(rows, limit = 5) {
  const list = (Array.isArray(rows) ? rows : [])
    .map((row) => ({ key: row?.key || '—', tokens: Number(row?.total_tokens) || 0 }))
    .filter((row) => row.tokens > 0)
    .sort((a, b) => b.tokens - a.tokens);
  const total = list.reduce((sum, row) => sum + row.tokens, 0);
  if (total <= 0) return [];
  const head = list.slice(0, limit);
  const tail = list.slice(limit);
  const out = head.map((row) => ({ ...row, share: row.tokens / total }));
  if (tail.length > 0) {
    const rest = tail.reduce((sum, row) => sum + row.tokens, 0);
    out.push({ key: `其他 ${tail.length} 个`, tokens: rest, share: rest / total });
  }
  return out;
}

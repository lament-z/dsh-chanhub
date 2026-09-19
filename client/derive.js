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
 * 开学季的 5 个子任务。前 4 个与 task_runner.py 的成长码**是同一批**
 * （两套执行器共用，跑任一边推进同一进度），第 5 个是人工项。
 */
export const SCHOOL_SUBTASKS = [
  { code: 'share_invite', label: '分享活动给好友', manual: false },
  { code: 'chat_3_times', label: '与 AI 对话 3 次', manual: false },
  { code: 'desktop_chat_1_time', label: '桌面端对话 1 次', manual: false },
  { code: 'expert_use', label: '召唤开学季专家并对话', manual: false },
  { code: 'task_student_verify', label: '微信学生认证', manual: true },
];

/** 与开学季共用的成长码（用于给成长码打「开学季」角标）。 */
export const SCHOOL_SHARED_CODES = SCHOOL_SUBTASKS.filter((task) => !task.manual).map((task) => task.code);

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
 * 把秒数格式化成中文时长。
 * @param seconds - 秒数。
 * @returns 如 `2h 5m` / `45s`。
 */
export function formatDuration(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) return '—';
  const total = Math.floor(seconds);
  const day = Math.floor(total / 86400);
  const hour = Math.floor((total % 86400) / 3600);
  const minute = Math.floor((total % 3600) / 60);
  const second = total % 60;
  const parts = [];
  if (day > 0) parts.push(`${day}d`);
  if (hour > 0) parts.push(`${hour}h`);
  if (minute > 0 && day === 0) parts.push(`${minute}m`);
  if (parts.length === 0) parts.push(`${second}s`);
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
    { label: '总账号', value: status?.total ?? 0, tone: 'idle' },
    { label: '健康', value: status?.healthy ?? 0, tone: 'ok' },
    { label: '冷却中', value: status?.cooling ?? 0, tone: 'warn' },
    { label: '在途占满', value: status?.in_flight_full ?? 0, tone: 'warn' },
    { label: '粘性会话', value: typeof sticky === 'number' ? sticky : '—', tone: 'info' },
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
 * 成长码归类（用于徽标与默认可见性）。
 * @param code - 成长码定义。
 * @returns `{scheduled, schoolShared, badge}`。
 */
export function codeBadges(code) {
  const scheduled = Object.keys(SCHEDULED_CODES).includes(code.code);
  const schoolShared = SCHOOL_SHARED_CODES.includes(code.code);
  const badges = [];
  if (scheduled) badges.push('定时');
  if (schoolShared) badges.push('开学季');
  if (code.unforgeable) badges.push('人工');
  return { scheduled, schoolShared, badges };
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

/**
 * 三个反直觉事实的文案（必须如实呈现，否则误导用户）。
 *
 * 见 ui-design.md §5.6。这些不是「可选的说明」，而是正确性要求。
 */
export const INTUITION_FACTS = {
  batchIndependent:
    '这些按钮各自独立，互不联动 —— 点「全量签到」只跑签到，不会顺带触发其他任务。成长任务需单独点「全部点亮」。',
  scheduledCoverage: () =>
    `24 个成长码里只有 2 个有定时覆盖（chat_5 走活跃地图、black_cat 走夜猫子），其余 ${codeCoverage().unscheduled} 个没有任何定时入口，只能手动触发。`,
  schoolSeason: () =>
    `开学季 = 5 个子任务：前 4 个可自动执行，第 5 个（微信学生认证）是人工项。其中 4 个与 task_runner.py 的成长码是同一批 —— 两套执行器共用，跑任一边推进同一进度。`,
};

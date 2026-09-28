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

/**
 * 渠道展示名（全称，弹窗/抽屉用）。
 * 站点不是渠道 —— qoder 的 work/cn/global 走 CHANNEL_SITES，不在此列。
 */
export const CHANNEL_FULL_LABEL = {
  workbuddy: 'WorkBuddy',
  traework: 'TraeWork',
  qoder: 'Qoder',
};

/**
 * 渠道 → 站点清单（渠道内的第二维；面板据此渲染「选渠道 → 选站点」）。
 *
 * 与网关 /panel/api/channels 的 sites 字段同源口径（网关是权威，这里是展示信息）：
 *   workbuddy → realm：cn / global
 *   traework  → 无（恒 cn）
 *   qoder     → site ：work / cn / global
 *
 * 为什么 qoder 有三个而别的渠道没有：work 与 cn **同域名**（qoder.com.cn）但协议
 * 不同，global 走 .sh（三域名分离）—— 它们是同一渠道的三个上游站点。
 */
export const CHANNEL_SITES = {
  workbuddy: [
    { id: 'cn', label: '国内版', note: 'copilot.tencent.com' },
    { id: 'global', label: '国际版', note: 'www.workbuddy.ai' },
  ],
  traework: [{ id: 'cn', label: '默认', note: 'trae.cn' }],
  qoder: [
    { id: 'work', label: 'QoderWork', note: 'qoder.com.cn · 桌面版协议' },
    { id: 'cn', label: 'QoderCN', note: 'qoder.com.cn · IDE 协议' },
    { id: 'global', label: '国际版', note: 'openapi.qoder.sh' },
  ],
};

/** 渠道展示顺序（与用户要求的 WB / Trae / Qoder 一致）。 */
export const CHANNEL_ORDER = ['workbuddy', 'traework', 'qoder'];

/** 六类排程的展示定义（顺序即 UI 顺序）。 */
export const SCHEDULE_ITEMS = [
  { id: 'checkin', icon: '📅', label: '签到', hoursKey: 'checkin_hours', enabledKey: 'checkin_enabled' },
  { id: 'activity', icon: '🗺', label: '活跃地图', hoursKey: 'activity_hours', enabledKey: 'activity_enabled' },
  { id: 'travel', icon: '🐱', label: '猫猫旅行', hoursKey: 'travel_hours', enabledKey: 'travel_enabled' },
  { id: 'keepalive', icon: '🔑', label: 'token 保活', hoursKey: 'keepalive_hours', enabledKey: 'keepalive_enabled' },
  { id: 'cat', icon: '🌙', label: '夜猫子', hoursKey: 'cat_hours', enabledKey: 'cat_enabled', note: '窗口 23:00–08:00 CST' },
];

/**
 * 19 个成长任务码。
 *
 * 全部来自 `plugins/chanhub/scripts/task_runner.py` 的 MAPPING 表（逐条核对），
 * 不是从别处抄的。`target` 是该码的完成定义次数。
 *
 * ⚠️ 这张表是**手工镜像**，会与后端静默漂移：2026-09-28 开学季下线时实测发现它
 * 多出 4 个后端早已不存在的码（chat_3_times / expert_use / share_invite /
 * desktop_chat_1_time —— 全是开学季任务），界面因此一直渲染着点不亮的幽灵行。
 * 核对方法（改动本表后请跑一次）：
 *   comm -23 <(grep -o "code: '[^']*'" client/derive.js | sed "s/code: '//;s/'//" | sort -u) \
 *            <(cd ../chanhub && python3 -c "import sys;sys.path.insert(0,'scripts');\
 *               import task_runner as t;print('\n'.join(sorted(t.MAPPING)))" | sort -u)
 * 两段输出都为空才算一致。
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
  { code: 'Sequential_Tasks_1', label: '小程序连续任务', target: 1 },
  { code: 'Expert_Philanthropy', label: '公益提问（不可代做）', target: 1, unforgeable: true },
];

/**
 * 有定时排程覆盖的成长码 —— 这是 §5.6 事实② 的核心数据。
 *
 * 只有两个：`chat_5` 走活跃地图（间接，`ReportChatActivity`），
 * `black_cat` 走夜猫子（直接 `--only black_cat`）。**其余 21 个无任何定时入口。**
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
 * 紧凑数字（K / W / M / B 量级）。
 *
 * 为什么分两套梯子（这是「灵活判断」的落点，改口径请看这里）：
 *   · 计数类（积分 / 请求数）走**中文量级**：万 → 亿。真机上一屏同时出现
 *     570,027 积分与 25,940 积分，全写千分位会把卡片撑开、且读不出量级。
 *   · Token 走**国际量级**：K / M / B —— token 数天然是英文单位习惯
 *     （1.92B tokens 比「19.2 亿」更贴近这个领域的读法）。
 *
 * 精确值不丢：所有用本函数的 UI 都把原值挂在 `title` 上，鼠标悬停可见。
 *
 * @param value - 数字。
 * @returns 如 `3,844` / `2.59W` / `1.23亿`。
 */
export function formatCompact(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${trimUnit(value / 1e12)}万亿`;
  if (abs >= 1e8) return `${trimUnit(value / 1e8)}亿`;
  if (abs >= 1e4) return `${trimUnit(value / 1e4)}W`;
  return formatNumber(Math.round(value));
}

/** 单位数值：保留 1–2 位小数并去掉无意义的 `0`。 */
function trimUnit(value) {
  const abs = Math.abs(value);
  const text = abs >= 100 ? value.toFixed(0) : abs >= 10 ? value.toFixed(1) : value.toFixed(2);
  return text.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
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
 * 赚得积分（累计获得过的额度总量）。
 *
 * 口径（**必须先说清楚，网关没有这个字段**）：
 *   chanhub 不存在「累计获得积分」端点，所以这里是**逐套餐明细求和**：
 *   `Σ 各套餐 total`（= 已用 + 剩余）。套餐明细里躺着的就是签到、活动、
 *   拉新、体验包这些来源发的额度包（真机实测：每日签到 ×31、每月登录 ×1、
 *   裂变包 ×56、拉新权益包 ×49），所以「赚得」确实涵盖签到与各类活动积分。
 *
 * 两条必须如实标注的边界：
 *   1. 拿不到明细的账号**不计入**（返回 `covered`/`missing` 让 UI 标出来），
 *      绝不拿池内余额去猜 —— 那是「还剩多少」，不是「拿过多少」。
 *   2. 已过期且上游不再下发的套餐会从这个列表里消失，因此结果是**下界**。
 *      真机 5 号实测：赚得 25,940 = 已用 16,282 + 剩余 9,658（剩余与池内
 *      credits 合计逐号对齐，可交叉验证）。
 *
 * @param accounts - `/status` 的 accounts。
 * @param creditsByUid - `{uid: {available, credits:{items}}}`，逐套餐明细。
 * @returns `{total, used, remain, covered, missing, count}`。
 */
export function earnedCredits(accounts = [], creditsByUid = {}) {
  let total = 0;
  let used = 0;
  let remain = 0;
  let covered = 0;
  let missing = 0;
  for (const account of Array.isArray(accounts) ? accounts : []) {
    const wrap = creditsByUid?.[account?.uid];
    const items = wrap?.available === true ? wrap?.credits?.items : undefined;
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
    total, used, remain, covered, missing, count: Array.isArray(accounts) ? accounts.length : 0,
  };
}

/**
 * 账号「什么时候到期」。
 *
 * 三个真实来源，按可信度取先者：
 *   1. **登录态到期**（`/status` 的 `accounts[].login_expires_at`，网关直接透出）——
 *      权威来源：这才是「这个账号什么时候到期」——登录态过期后该号整体失效、
 *      需重新登录（续期成功后该时刻后推）。网关自己持有凭证，因此**恒可透出**，
 *      不依赖插件宿主能否读到 auths 目录。
 *   2. **凭证到期**（`auths/*.json` 的 `expiresAt`，宿主只读盘点透出）——与 ① 同源，
 *      仅当网关版本较旧（尚未透出 ①）且恰好同机可读时的兜底。
 *   3. **积分到期**（逐套餐明细里最近的 `expire_at`，只取还有余额的）——
 *      前两者都不可得时的最后降级，语义是「最早一批积分作废」，**不是账号到期**。
 *
 * 三个都没有 → 返回 `null`：由 UI 显示「—」或干脆不渲染，不编造「永不过期」。
 *
 * @param props - `{account, authAccounts, creditsDetail, now}`。
 *   `creditsDetail` 是 `creditsByUid[uid]`（含 `{available, credits:{items}}`）。
 * @returns `{at, kind, days, expired}` 或 `null`。
 */
export function accountExpiry({ account, authAccounts = [], creditsDetail, now = Date.now() }) {
  const uid = account?.uid;

  // ① 登录态到期：网关 /status 透出的 login_expires_at（Unix 秒，老网关给毫秒时
  //    按量级判定而不是硬乘 1000）。
  const loginRaw = Number(account?.login_expires_at);
  if (Number.isFinite(loginRaw) && loginRaw > 0) {
    const at = loginRaw < 1e12 ? loginRaw * 1000 : loginRaw;
    return decorateExpiry(at, 'credential', now);
  }

  // ② 宿主凭证盘点透出的 expiresAt（同机部署时的同源兜底）
  const auth = (Array.isArray(authAccounts) ? authAccounts : []).find((entry) => entry?.uid === uid);
  const raw = Number(auth?.expiresAt);
  if (Number.isFinite(raw) && raw > 0) {
    const at = raw < 1e12 ? raw * 1000 : raw;
    return decorateExpiry(at, 'credential', now);
  }

  // ③ 积分到期：最近的、还有余额的套餐到期日
  const items = creditsDetail?.available === true ? creditsDetail?.credits?.items : undefined;
  if (Array.isArray(items)) {
    let nearest = NaN;
    for (const item of items) {
      if ((Number(item?.remain) || 0) <= 0) continue;
      const at = Date.parse(item?.expire_at ?? '');
      if (!Number.isFinite(at) || at <= 0) continue;
      if (!Number.isFinite(nearest) || at < nearest) nearest = at;
    }
    if (Number.isFinite(nearest)) return decorateExpiry(nearest, 'package', now);
  }
  return null;
}

/** 到期信息补上剩余天数与过期标记。 */
function decorateExpiry(at, kind, now) {
  return {
    at,
    kind,
    // 剩余天数按「还剩几个自然日」算：今天到期 = 0 天，昨天到期 = 已过期。
    days: Math.floor((at - now) / 86400e3),
    expired: at <= now,
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
 * 按 realm 取在途上限 —— 与网关 `pool.inFlightLimit(e)` **同一规则**。
 *
 * 网关：`maxInFlightGlobal > 0 && realm == "global"` → 用 global 档，否则用
 * `max_in_flight`（`internal/pool/pick.go`）。面板早期只读 `max_in_flight`，
 * 于是 global 档生效时账号卡的占用条分母与「在途占满」判定都会误报。
 *
 * @param gatewayConfig - config.json 内容。
 * @param realm - 账号所属域（`'cn'` / `'global'`）。
 * @returns 数值；缺失时 undefined。
 */
export function realmLimitOf(gatewayConfig, realm) {
  if (realm === 'global') {
    const globalTier = getPath(gatewayConfig ?? {}, 'pool.max_in_flight_global');
    if (typeof globalTier === 'number' && globalTier > 0) return globalTier;
  }
  return maxInFlightOf(gatewayConfig);
}

/** 渠道识别色（仅用于侧边栏卡片的小色点/竖条；面板其它地方仍走 tone 令牌）。 */
export const CHANNEL_COLOR = {
  workbuddy: '#4f6ef7',
  traework: '#a855f7',
  qoder: '#06b6d4',
};

/**
 * 渠道识别色（未知渠道回落到中性灰，不编造品牌色）。
 * @param channel - 渠道 id。
 * @returns CSS 颜色。
 */
export function channelColor(channel) {
  return CHANNEL_COLOR[channel] ?? '#94a3b8';
}

/**
 * 渠道配色三件套（**唯一色源**：侧边栏浮层与渠道中心共用）。
 *
 * 为什么要有这一层：渠道识别色原来只有 `channelColor()` 一个 hex，各处各写各的 ——
 * 浮层拿它画色条/余额条/走势线，渠道中心压根没用这套色（渠道名一律 `tone:'info'`，
 * 三家渠道在中心里看不出区别），用量图表那边又抄了一份字面量调色板。
 * 统一成三件套后两边拿到同一套派生色，不会再出现「同一渠道两处不同颜色」。
 *
 * 纪律：渠道色**只上形状**（条/点/线/底），文字一律走 `--dsw-alias-*` 令牌 ——
 * 这三个是 500–600 档中间色，暗色主题下当正文偏暗。
 *
 * @param channel - 渠道 id（未知/空回落中性灰，不编造品牌色）。
 * @returns `{solid, soft, edge}`：`solid` 身份色本体；`soft` 胶囊底/行 hover（12%）；
 *   `edge` 描边/分隔（45%）。都用 `color-mix` 派生，亮暗两套都够淡且不会被整条丢弃。
 */
export function channelPalette(channel) {
  const solid = channelColor(channel);
  return {
    solid,
    soft: `color-mix(in srgb, ${solid} 12%, transparent)`,
    edge: `color-mix(in srgb, ${solid} 45%, transparent)`,
  };
}

/**
 * 「活跃」近似标签。
 *
 * 为什么只能近似：「本会话在用哪个账号」要会话粘性键（网关侧由首条 user 消息
 * 派生的内容哈希），浏览器侧不可复现 —— 见侧边栏设计文档。这里只如实说
 * 「占用中 / 刚用过」，**没有证据就不返回**（不猜）。
 *
 * @param account - `/status` 的账号项。
 * @param now - 当前毫秒时间戳。
 * @returns `{key,label,tone}` 或 undefined。
 */
export function activityOf(account, now = Date.now()) {
  const inFlight = Number(account?.in_flight) || 0;
  if (inFlight > 0) return { key: 'busy', label: '占用中', tone: 'info' };
  const last = Date.parse(account?.last_success ?? '');
  if (Number.isFinite(last) && now - last < 90_000) return { key: 'recent', label: '刚用过', tone: 'ok' };
  return undefined;
}

/**
 * 侧边栏摘要视图模型 —— 与账号池 Tab **同一口径**（同一纯函数，避免两处数字打架）。
 *
 * @param params - `{status, usage, config, now}`。
 * @returns 摘要 VM。
 */
export function quickSummaryVM({ status, usage, config, now = Date.now() } = {}) {
  const accounts = Array.isArray(status?.accounts) ? status.accounts : [];
  // 可用积分 = Σ accounts[].credits（不可消耗积分不并入 —— 与面板同一约定）。
  const usableCredits = accounts.reduce((sum, account) => sum + (Number(account?.credits) || 0), 0);
  const channels = CHANNEL_ORDER.map((id) => ({ id, label: CHANNEL_LABEL[id] ?? id, count: 0, credits: 0 }));
  const byChannel = new Map(channels.map((row) => [row.id, row]));
  for (const account of accounts) {
    const raw = typeof account?.channel === 'string' && account.channel !== '' ? account.channel : 'workbuddy';
    const row = byChannel.get(raw) ?? byChannel.get('workbuddy');
    if (!row) continue;
    row.count += 1;
    row.credits += Number(account?.credits) || 0;
  }
  const inFlight = accounts.reduce((sum, account) => sum + (Number(account?.in_flight) || 0), 0);
  const total = Number(status?.total) || 0;
  const healthy = Number(status?.healthy) || 0;
  const window24h = usage?.total ?? undefined;
  return {
    accounts,
    total,
    healthy,
    cooling: Number(status?.cooling) || 0,
    disabled: Number(status?.disabled) || 0,
    inFlightFull: Number(status?.in_flight_full) || 0,
    inFlight,
    sticky: typeof status?.sticky_sessions === 'number' ? status.sticky_sessions : undefined,
    usableCredits,
    channels: channels.filter((row) => row.count > 0 || row.id === 'workbuddy'),
    healthRatio: total > 0 ? healthy / total : 0,
    /** 近 24h（**滚动窗口**，不是自然日）：请求/成功/失败/tokens。 */
    usage24h: window24h
      ? {
          requests: Number(window24h.requests) || 0,
          success: Number(window24h.success) || 0,
          failed: Number(window24h.failed) || 0,
          tokens: Number(window24h.total_tokens) || 0,
          credit: Number(window24h.credit) || 0,
        }
      : undefined,
    uptimeSec: Number(status?.uptime_sec) || 0,
    version: status?.version,
    realmTotals: status?.realm_totals,
    creditsFreshness: creditsFreshness(accounts, now),
  };
}

/**
 * 单个账号的侧边栏卡片视图模型（复用账号池的判定/格式化，保证同一数字）。
 *
 * @param account - `/status` 的账号项。
 * @param params - `{config, maxCredits, channelOf, authAccounts, creditsByUid, now}`。
 * @returns 卡片 VM。
 */
export function accountCardVM(account, params = {}) {
  const { config, maxCredits, channelOf, authAccounts, creditsByUid, now = Date.now() } = params;
  const limit = realmLimitOf(config, account?.realm);
  const state = accountState(account, limit);
  const credits = Number(account?.credits) || 0;
  const inFlight = Number(account?.in_flight) || 0;
  const target = typeof limit === 'number' && limit > 0 ? limit : undefined;
  const channel =
    typeof account?.channel === 'string' && account.channel !== ''
      ? account.channel
      : (channelOf?.(account) ?? 'workbuddy');
  const expiry = accountExpiry({
    account,
    authAccounts,
    creditsDetail: creditsByUid?.[account?.uid],
    now,
  });
  const creditsAt = isZeroTime(account?.credits_at) ? undefined : account?.credits_at;
  const lastSuccess = isZeroTime(account?.last_success) ? undefined : account?.last_success;
  return {
    uid: String(account?.uid ?? ''),
    name: account?.nickname || String(account?.uid ?? '').slice(0, 8),
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
    creditsAtText: creditsAt ? relativeTime(creditsAt, now) : undefined,
    lastSuccessText: lastSuccess ? relativeTime(lastSuccess, now) : undefined,
    successCount: Number(account?.success_count) || 0,
    errTotal: Number(account?.err_total) || 0,
  };
}

/**
 * 迷你折线（sparkline）路径 —— 侧边栏 popover 的 24h 用量走势。
 *
 * 纯函数，便于单测；只为「有无起伏」服务，不做坐标轴（面板里的大图才有）。
 *
 * @param values - 数值序列（时间升序，可含 0）。
 * @param options - `{width, height, padding}`。
 * @returns `{points, area, max, flat}`；序列为空时 `points` 为空串。
 */
export function sparkPath(values, options = {}) {
  const { width = 96, height = 22, padding = 2 } = options;
  const list = (Array.isArray(values) ? values : []).map((value) => Number(value) || 0);
  if (list.length === 0) return { points: '', area: '', max: 0, flat: true };
  const max = Math.max(...list);
  const min = Math.min(...list);
  const span = max - min || 1;
  // 全平序列画在竖直中线：贴着底部画会被读成「0 用量」，贴顶会读成「打满」。
  const flat = max === min;
  const stepX = list.length > 1 ? (width - padding * 2) / (list.length - 1) : 0;
  const pointAt = (value, index) => {
    const x = padding + index * stepX;
    const y = flat ? height / 2 : height - padding - ((value - min) / span) * (height - padding * 2);
    return [Number(x.toFixed(2)), Number(y.toFixed(2))];
  };
  const points = list.map((value, index) => pointAt(value, index).join(',')).join(' ');
  const first = pointAt(list[0], 0);
  const last = pointAt(list[list.length - 1], list.length - 1);
  const area = `${first[0]},${height - padding} ${points} ${last[0]},${height - padding}`;
  return { points, area, max, flat };
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
const B = 1000 * 1000 * 1000;

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
 * Token 数量紧凑格式化（K / M / B）。
 *
 * B 是这一版补的：真机 30 天窗口实测 19.18 亿 tokens，旧实现会写成
 * `1917.97M` —— 一个比原始数还难读的字符串。1e9 以上走 B。
 *
 * @param value - 数字。
 * @returns 如 `412.3K` / `11.68M` / `1.92B`。
 */
export function formatTokens(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= B) return `${(value / B).toFixed(2)}B`;
  if (abs >= M) return `${(value / M).toFixed(2)}M`;
  if (abs >= K) return `${(value / K).toFixed(1)}K`;
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

  // 指标口径：请求数 / tokens —— 概览页标题行的切换落到这里
  const metric = options.metric === 'tokens' ? 'tokens' : 'requests';
  const inWindow = list.filter((d) => {
    const at = new Date(`${d.date}T00:00:00`).getTime();
    return at >= first.getTime() && at <= end.getTime();
  });
  const nonzero = inWindow
    .filter((d) => (Number(d[metric]) || 0) > 0)
    .map((d) => Number(d[metric]) || 0);
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
              value: rec ? (Number(rec[metric]) || 0) : 0,
              level: rec ? heatLevel(Number(rec[metric]) || 0, thresholds) : 0,
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
    metric,
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

/**
 * 概览统计条的取值（参考 Javis603/token-monitor 的 `STAT_CARDS`，按我们的数据面映射）。
 *
 * 映射取舍（见 `.scratch/chanhub-panel/usage-v3-javis-plan.md` §3）：
 *   - 参考的 `totalCost` 是货币金额 → 我们换成本系统的成本单位**积分**（不换算成钱）。
 *   - 参考的 `activeTimeMs`（活跃时长）→ 网关**不记录**，不编造，
 *     换成我们真实有的「可用积分存量」。
 *   - `messages`（消息数）→ 我们只有**请求数**，如实标注为请求。
 *
 * @param props - `{total, stock, days, burn, topModel}`。
 * @returns 7 项 `[{key, label, value, unit, tone, title}]`（顺序即展示顺序）。
 */
export function overviewStats({ total, stock, days, burn, topModel }) {
  const requests = Number(total?.requests) || 0;
  const failed = Number(total?.failed) || 0;
  const credit = Number(total?.credit) || 0;
  const structure = tokenStructure(total);

  const list = Array.isArray(days) ? days : [];
  const active = list.filter((day) => day.requests > 0);
  const peak = active.length > 0 ? Math.max(...active.map((day) => day.requests)) : 0;
  const peakDay = active.find((day) => day.requests === peak) || null;

  // 连续活跃天数：从最近一天往回数，遇到空档即停（半开区间，不把「今天还没用」算断）
  let streak = 0;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i].requests > 0) streak += 1;
    else if (i < list.length - 1 || list[i].requests === 0) {
      // 末尾若本来就没有今天的数据，允许跳过最后一格不算断
      if (i === list.length - 1) continue;
      break;
    }
  }

  return [
    {
      key: 'tokens', label: 'Tokens', value: formatTokens(structure.total),
      title: `输入 ${formatNumber(structure.prompt)} · 输出 ${formatNumber(structure.completion)}（窗口口径）`,
    },
    {
      key: 'credit', label: '积分消耗', value: formatCredit(credit), tone: 'ok',
      title: `每请求 ${requests > 0 ? formatCredit(credit / requests) : '—'} 积分（窗口口径）`,
    },
    {
      key: 'stock', label: '可用积分', value: formatNumber(Math.round(Number(stock?.usable) || 0)), tone: 'ok',
      title: tryBurn(burn, stock),
    },
    {
      key: 'days', label: '活跃天', value: String(active.length),
      title: `窗口内 ${list.length} 天中有 ${active.length} 天有请求`,
    },
    {
      key: 'streak', label: '连续', value: String(streak),
      title: '自最近一次活跃起连续有记录的天数',
    },
    {
      key: 'peak', label: '峰值/天', value: formatNumber(peak),
      title: peakDay ? `${peakDay.date} 峰值 ${formatNumber(peak)} 请求` : '窗口内无请求',
    },
    {
      key: 'requests', label: '请求', value: formatNumber(requests),
      title: `成功 ${formatNumber(requests - failed)} · 失败 ${formatNumber(failed)}（窗口口径）`,
    },
  ];
}

/** 燃尽天数的展示封顶：外推超过 3 年已无阅读意义，如实标注「>3 年」而不是甩一个六位数。 */
const BURN_DAYS_CAP = 365 * 3;

/** 天数文本（>3 年显示「>3 年」，<1 天换算成小时）。 */
function burnDaysText(days) {
  if (days > BURN_DAYS_CAP) return '>3 年';
  return days >= 1 ? `${days.toFixed(1)} 天` : `${(days * 24).toFixed(1)} 小时`;
}

/** 燃尽标题文案（无外推时如实说明）。 */
function tryBurn(burn, stock) {
  if (!burn) {
    return `只算可消耗额度，不含渠道专用池。不可消耗 ${formatNumber(Math.round(Number(stock?.unusable) || 0))}`;
  }
  return `按窗口速率外推 ≈ 还可 ${burnDaysText(burn.days)}（${formatCredit(burn.perDay)} 积分/天）。线性外推，非承诺；账本只覆盖经本网关的请求，实际偏乐观。只算可消耗额度。`;
}

/* ══════════════════════════════════════════════════════════════════════════
   用量页 v4 派生（单页卡片流：范围切片 / 账号与渠道归因 / KPI）
   ══════════════════════════════════════════════════════════════════════════ */

/** 每日用量的可选范围（天）—— 与参考实现的 7/14/30 切换一致。 */
export const DAY_RANGES = [7, 14, 30];

/**
 * 按天切片：取最后 N 天（纯前端，不再发请求）。
 *
 * 为什么要前端切片：原先每次切窗口都要重拉 7 个端点（含逐账号的
 * credits / growth），只为改一个时间范围。而网关分桶一次就能
 * 给到 30 天上限，范围切换只是「看多少」的问题 —— 本地切片即可。
 *
 * 边界：天数不足时返回全部（不是补零）—— 补零会画出并不存在的「安静日」。
 *
 * @param days - `usageByDay()` 的输出（按日期升序）。
 * @param range - 天数（7 / 14 / 30）。
 * @returns 末尾 `range` 条（不足则全部）。
 */
export function daySeries(days, range) {
  const list = Array.isArray(days) ? days : [];
  const n = Math.max(1, Number(range) || 30);
  return list.slice(-n);
}

/**
 * 按天 × 模型的堆叠序列（每日柱状图用）。
 *
 * 与 `usageSeriesByKey` 的分工：后者按**槽**（小时/日混合）保留时间轴，
 * 用于趋势图；本函数按**日历日**折叠并保留模型维度，用于堆叠柱状图 ——
 * 混合槽在「天」这一层相加是合法的（同属窗口分桶）。
 *
 * @param rows - `usageBySlot()` 的输出。
 * @param buckets - 原始 buckets（带 model 维度）。
 * @param days - 已切片的 `usageByDay()` 输出（决定横轴）。
 * @param metric - `'tokens'` | `'requests'` | `'credit'`。
 * @returns `{dates, series}`，`series = [{key, values[], total}]` 按总量降序。
 */
export function dailyByModel(rows, buckets, days, metric = 'tokens') {
  const dates = (Array.isArray(days) ? days : []).map((d) => d.date);
  const index = new Map(dates.map((date, i) => [date, i]));
  const field = metric === 'requests' ? 'requests' : metric === 'credit' ? 'credit' : 'total_tokens';

  const table = new Map();
  for (const bucket of Array.isArray(buckets) ? buckets : []) {
    if (!bucket || typeof bucket.slot !== 'string') continue;
    const at = parseSlot(bucket.slot);
    if (!Number.isFinite(at)) continue;
    const date = localDayKey(new Date(at));
    const slotIndex = index.get(date);
    if (slotIndex === undefined) continue;
    const key = typeof bucket.model === 'string' && bucket.model !== '' ? bucket.model : '（未标注模型）';
    if (!table.has(key)) table.set(key, { key, values: new Array(dates.length).fill(0), total: 0 });
    const value = Number(bucket[field]) || 0;
    table.get(key).values[slotIndex] += value;
    table.get(key).total += value;
  }

  const series = [...table.values()].sort((a, b) => b.total - a.total);
  return { dates, series, field };
}

/**
 * 排行维度的定义（账号用量 / 渠道用量共用）。
 *
 * 为什么加维度：请求数多 ≠ 用得多 —— 真机上「谁在烧钱」要看 Tokens / 积分。
 * 三个维度共用同一份 `by_uid`，只是取的字段不同，不存在跨口径混算。
 */
export const RANK_METRICS = [
  { id: 'tokens', field: 'total_tokens', label: 'Tokens', format: formatTokens },
  { id: 'requests', field: 'requests', label: '请求', format: formatNumber },
  { id: 'credit', field: 'credit', label: '积分', format: formatCredit },
];

/** 默认维度：**按用量（Tokens）** —— 「谁在用」的第一答案就是量，不是次数。 */
export const DEFAULT_RANK_METRIC = 'tokens';

/**
 * 「已删除的 key」这一组的哨兵 id。
 *
 * 两个地方共用它，因为它们是同一个概念（「认不出名字的那一批」）：
 *   · 消费者卡折叠出来的汇总行，`key` 取它；
 *   · 选择器里「已删除的 N 个 key」那一项的 `id`，选中即把整页收窄到这一组。
 *
 * 判身份一律用 `row.deleted` / `row.deletedSummary`，别拿它当判据。
 */
export const DELETED_CONSUMERS = '__deleted__';

/** 取维度定义（未知 id 回落默认维度，不抛错）。 */
export function rankMetric(id) {
  return RANK_METRICS.find((item) => item.id === id) ?? RANK_METRICS[0];
}

/**
 * 某维度的总量：优先用响应里的 `total`，缺失时才回落到行求和
 * （与 `usageShares` 同款兜底，避免网关漏给 total 时全表占比为 0）。
 *
 * @param total - `by_uid` 同响应的 total。
 * @param rows - 已装饰的行。
 * @param metric - 维度 id。
 * @returns 数值（可能为 0）。
 */
function metricGrandTotal(total, rows, metric) {
  const field = rankMetric(metric).field;
  const fromTotal = Number(total?.[field]);
  if (Number.isFinite(fromTotal) && fromTotal > 0) return fromTotal;
  return rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
}

/**
 * 按账号归因（账号排行用）：`by_uid` + 昵称/渠道解析 + 相对最大值归一。
 *
 * 相对最大值归一的理由：各项接近时（33/33/33）用绝对占比会让所有条一样长、
 * 失去比较意义（沿用 `.dshc-bd-bar` 的既有纪律）。
 *
 * @param rows - `by_uid`。
 * @param total - 同响应里的 `total`。
 * @param accounts - `/status` 的 accounts（用于映射昵称）。
 * @param channelOf - `channelResolver()` 的产物。
 * @param metric - 排行维度（默认 `tokens` = 按用量）。
 * @returns `[{key, name, channel, requests, tokens, credit, share, successRate, barShare, value}]`。
 */
export function accountShares(rows, total, accounts = [], channelOf = () => 'workbuddy', metric = DEFAULT_RANK_METRIC) {
  const shares = usageShares(rows, total);
  const byUid = new Map((Array.isArray(accounts) ? accounts : []).map((a) => [a?.uid, a]));
  const field = rankMetric(metric).field;
  const decorated = shares.map((row) => {
    const account = byUid.get(row.key);
    return {
      ...row,
      name: account?.nickname || (row.key ? `${String(row.key).slice(0, 8)}…` : '（未选号）'),
      channel: account ? (channelOf(account) ?? 'workbuddy') : '',
      tokens: Number(row.total_tokens) || 0,
      credit: Number(row.credit) || 0,
      value: Number(row[field]) || 0,
    };
  });
  const grand = metricGrandTotal(total, decorated, metric);
  const max = Math.max(...decorated.map((row) => row.value), 1);
  return decorated
    .map((row) => ({
      ...row,
      share: grand > 0 ? row.value / grand : 0,
      barShare: row.value / max,
    }))
    // 排行按**当前维度**降序 —— 切到 Tokens 时顺序必须跟着变，否则「排行」名不副实。
    .sort((a, b) => b.value - a.value);
}

/**
 * 按**消费者**归因：直接折 `by_key`（网关 2026-09-24 起的第 4 个维度）。
 *
 * 与 `accountShares` 是两条正交的切法，不可互相替代：
 *   - `by_uid` 回答「**哪个上游账号被用了**」（资源视角，会不会被限流）；
 *   - `by_key` 回答「**谁在用**」（消费者视角，哪台下游在烧额度）。
 * 同一批请求会同时进这两个维度，所以两者的 Tokens 合计应当相等 —— 不等就说明
 * 有请求没带消费者身份（未鉴权形态）。
 *
 * 名字由网关在**读取时** join key 表（所以支持改名）。已删除的 key 没有 label，
 * 这里退化成显示 id 而不是编造一个名字 —— 历史用量不该因为删了 key 就认不出来。
 *
 * 但**逐把渲染会挤掉真实消费者**（实测 720h 下 7 把废弃 key 占掉 8 行里的 6 行），
 * 所以已删除的 key 在这里折成**一行**汇总（`deleted: true`，含 `deletedCount`
 * 与 `deletedIds`），并固定排在末位。理由与口径见函数体内注释。
 *
 * @param rows - `usage.by_key`（旧网关没有该字段 → 传 [] / undefined）。
 * @param metric - 维度 id（tokens / requests / credit）。**不接 total**：见下。
 * @param options - `{foldDeleted}`：默认 true（折成一行）。**指定了某一把 key
 *   来看时传 false** —— 用户既然点名要看这把 key，再把它折进「已删除的 N 个 key」
 *   就是把他的选择藏起来。
 * @returns 已装饰的行：真实消费者按维度降序，末位（若有）是「已删除」汇总行。
 */
export function consumerShares(rows, metric = DEFAULT_RANK_METRIC, options = {}) {
  const foldDeleted = options?.foldDeleted !== false;
  const list = Array.isArray(rows) ? rows : [];
  const field = rankMetric(metric).field;
  const decorated = list.map((row) => {
    const key = String(row?.key ?? '');
    const label = typeof row?.label === 'string' && row.label !== '' ? row.label : '';
    // 「已删除」的判据只有一条：网关没给 label，且既不是主 key 也不是未鉴权。
    // 网关在**读取时** join key 表，所以「查不到名字」= 这把 key 已不在表里。
    const deleted = label === '' && key !== '' && key !== 'master';
    const name = label !== ''
      ? label
      : key === 'master'
        ? '主 key'
        : deleted
          ? `${key}（已删除）`
          : '（未鉴权）';
    const requests = Number(row?.requests) || 0;
    const failed = Number(row?.failed) || 0;
    return {
      ...row,
      name,
      deleted,
      tokens: Number(row?.total_tokens) || 0,
      credit: Number(row?.credit) || 0,
      value: Number(row?.[field]) || 0,
      requests,
      failed,
      // 硬拒（集合外 403）也记 failed 且 uid 为空 —— 对消费者视图来说
      // 「失败率」正是诊断「下游模型名配错」的关键信号，故一并透出。
      failRate: requests > 0 ? failed / requests : 0,
    };
  });
  // 分母口径（**别改回 total**）：消费者维的宇宙只是 total 的一个**子集**。
  // by_key 只覆盖「带消费者归属」的请求（多消费者 key 上线之后）；更早的历史桶
  // keyID 为空，被网关的 accumulate 直接跳过，只进 by_uid/by_model。
  // 拿响应里的 total 当分母会让每一行的占比被系统性低估 —— 实测 720h 下
  // master 显示 18.7%、各行占比之和也只有 18.7%（不是 100%），24h 下才接近正确。
  // 故这里改用本维度各行之和：份额之和恒为 100%，且跨窗口稳定。
  //
  // 与「账号用量」「渠道用量」两张卡的区别：那两张的宇宙≈total，用 total 是对的
  // （metricGrandTotal 的首选分支），不要一起改。
  const grand = decorated.reduce((sum, row) => sum + row.value, 0);
  const max = Math.max(...decorated.map((row) => row.value), 1);
  const withShares = (row) => ({
    ...row,
    share: grand > 0 ? row.value / grand : 0,
    barShare: row.value / max,
  });

  // ── 已删除的 key 折叠成**一行**（2026-09-24） ──
  //
  // 为什么不逐把渲染、也不直接不显示：
  //   · 逐把渲染会**挤掉真实消费者**。实测 720h 窗口 7 把废弃 key（每把 1~3 次
  //     被拒的探针请求、0 token）+ 2 个真实消费者 = 9 行，卡片只画 8 行 ——
  //     于是 8 行里有 6 行是「k_xxx（已删除）0%」，真正在用的 key 反而容易被挤没。
  //   · 直接不显示会**破坏份额口径**：grand 是本维各行之和，删掉的行仍占分母
  //     （实测这 7 把里有 2 把带 token），可见行的占比就不再合 100%，而且
  //     「有一批历史用量认不出是谁」这件事被悄悄抹掉了。
  //   · 折叠成一行则两条都保住：加法逐字段合并 → 分母一字不差；行数从 N 变 1；
  //     具体 id 仍在 `deletedIds` 里，卡片用 tooltip 兜住，信息没丢。
  //
  // 位置：**不进排行**。它不是可比较的消费者，而是「认不出名字的历史」，
  // 故固定排在末位（调用方据此把它渲染成末行、不占序号、不占 8 行预算）。
  const gone = foldDeleted ? decorated.filter((row) => row.deleted) : [];
  const merged = gone.length === 0 ? null : {
    key: DELETED_CONSUMERS,
    label: '',
    // 两个标记分工必须分清（曾经混用过一次，直接让面板崩了）：
    //   `deleted`        = 这把 key 已不在 key 表里（**单个 key 也可能为真**，
    //                      比如用户点名要看一把已删除的 key）；
    //   `deletedSummary` = 这是**折叠出来的汇总行**，只有它才有 deletedIds。
    // 卡片判「汇总行」只能看 deletedSummary —— 看 deleted 会把单把已删除的 key
    // 当成汇总行去读 deletedIds.join()，于是 TypeError 白屏。
    deleted: true,
    deletedSummary: true,
    deletedCount: gone.length,
    deletedIds: gone.map((row) => row.key),
    name: `已删除的 ${gone.length} 个 key`,
    requests: gone.reduce((sum, row) => sum + row.requests, 0),
    failed: gone.reduce((sum, row) => sum + row.failed, 0),
    tokens: gone.reduce((sum, row) => sum + row.tokens, 0),
    credit: gone.reduce((sum, row) => sum + row.credit, 0),
    value: gone.reduce((sum, row) => sum + row.value, 0),
  };
  if (merged) {
    merged.failRate = merged.requests > 0 ? merged.failed / merged.requests : 0;
  }

  const ranked = decorated
    .filter((row) => !(foldDeleted && row.deleted))
    .map(withShares)
    .sort((a, b) => b.value - a.value);
  return merged ? [...ranked, withShares(merged)] : ranked;
}

/* ──────────────────── 消费者（API key）作用域 ──────────────────── */

/** 「全部消费者」哨兵。**不能**用空串 —— 空 key 是「未鉴权」这一真实分组。 */
export const ALL_CONSUMERS = '__all__';

/**
 * 把分桶行按某一维聚合成与网关 `usageGroupPayload` **同构**的行。
 *
 * 为什么要在这里重算（而不是只让网关算）：网关的 `/v1/stats/buckets` 只接受
 * `window`，没有按 key 过滤的参数。面板要「只看某一把 key」只能自己收窄 ——
 * 而收窄后 `total` / `by_uid` / `by_model` 都必须跟着变，否则 KPI 与各卡会
 * 各说各话。
 *
 * 与网关 `accumulate` / `addGroupRow` / `finalizeGroup` 逐条对齐：
 *   · 空键**跳过**（降级模式下 uid/model 为空 → 这两个维度为空表，与网关一致；
 *     `total` 例外：它把每一行都算进去，包括空键行）；
 *   · 均值按**请求数加权**累加，收尾除以请求数；
 *   · 命中率 = 命中 /（命中 + 未命中），**写入不进分母**；分母为 0 时留 0
 *     （前端据此显示「—」而不是 0%）。
 *
 * @param rows - 分桶行（`usage.buckets`）。
 * @param dim - `'uid'` / `'model'` / `'realm'` / `'key'`；传 `null` 表示合计。
 * @returns 聚合行数组（合计时长度为 1）。
 */
function aggregateRows(rows, dim) {
  const empty = (key) => ({
    key, label: '',
    requests: 0, success: 0, failed: 0, streaming: 0,
    prompt_tokens: 0, completion_tokens: 0, total_tokens: 0,
    cache_hit_tokens: 0, cache_miss_tokens: 0, cache_write_tokens: 0,
    cache_hit_rate: 0, credit: 0, avg_latency_ms: 0,
  });
  const table = new Map();
  // 合计**先占位**：收窄到一把窗口内无数据的 key 时也要返回一个全 0 的 total，
  // 而不是 undefined —— 否则调用方一个 `total.requests` 就是 TypeError。
  if (dim === null) table.set('total', empty('total'));
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row) continue;
    const key = dim === null ? 'total' : String(row[dim] ?? '');
    if (dim !== null && key === '') continue;
    let group = table.get(key);
    if (!group) {
      group = empty(key);
      table.set(key, group);
    }
    const requests = Number(row.requests) || 0;
    group.requests += requests;
    group.success += Number(row.success) || 0;
    group.failed += Number(row.failed) || 0;
    group.streaming += Number(row.streaming) || 0;
    group.prompt_tokens += Number(row.prompt_tokens) || 0;
    group.completion_tokens += Number(row.completion_tokens) || 0;
    group.total_tokens += Number(row.total_tokens) || 0;
    group.cache_hit_tokens += Number(row.cache_hit_tokens) || 0;
    group.cache_miss_tokens += Number(row.cache_miss_tokens) || 0;
    group.cache_write_tokens += Number(row.cache_write_tokens) || 0;
    group.credit += Number(row.credit) || 0;
    group.avg_latency_ms += (Number(row.avg_latency_ms) || 0) * requests;
  }
  const out = [...table.values()];
  for (const group of out) {
    if (group.requests > 0) group.avg_latency_ms /= group.requests;
    const denom = group.cache_hit_tokens + group.cache_miss_tokens;
    group.cache_hit_rate = denom > 0 ? group.cache_hit_tokens / denom : 0;
  }
  // 与网关 sortedGroups 同序（请求数降序，同数按 key）—— 顺序稳定才不会有
  // 「刷新一下排行榜换了个位置」的抖动。
  return out.sort((a, b) => (b.requests - a.requests) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

/**
 * 把整个用量载荷**收窄**到一把消费者 key（纯前端，不新增请求）。
 *
 * 口径纪律：收窄的是**同一份窗口分桶**，不是新窗口 —— `buckets` 过滤后重算
 * `total` / `by_uid` / `by_model` / `by_realm` / `by_key`，于是 KPI、热力图、
 * 每日柱、账号/渠道/模型归因全部自动跟着走，不会出现「KPI 是全量、模型占比
 * 是单 key」这种半新半旧。
 *
 * **为什么不在这里做「近 N 天」**（2026-09-24 评估后否决）：客户端从 buckets
 * 重算 total 是**有损**的 —— 网关的 total 是它自己 accumulate 的权威值，含
 * 客户端看不到的部分（桶容量超限降级后的聚合、跨桶去重等）。真机 fixture 上
 * 同一份数据重算出的 total_tokens 与网关值就能差 3.5 倍。要做真正的天数窗口，
 * 正确做法是拿 `?window=168h` **重新问网关**（它支持 24h/72h/168h/720h），
 * 而不是在客户端做减法。「近 N 天」目前只是每日柱状图的**缩放**，标签已写明。
 *
 * `label` 沿用网关在**读取时** join 的结果（客户端不重算名字，也不编造）。
 *
 * @param usage - `payload.usage`。
 * @param keyId - 单把 key 的 id、一组 id（数组），或 `ALL_CONSUMERS`（不收窄）。
 * @returns 新的 usage 对象（不收窄时原样返回同一个引用）。
 */
export function scopeUsage(usage, keyId) {
  if (!usage || keyId == null || keyId === ALL_CONSUMERS) return usage;
  const wanted = new Set(Array.isArray(keyId) ? keyId.map(String) : [String(keyId)]);
  const buckets = (Array.isArray(usage.buckets) ? usage.buckets : [])
    .filter((row) => wanted.has(String(row?.key ?? '')));
  // 名字只可能来自网关的 by_key（客户端没有 key 表）——先建映射再回填。
  const labels = new Map(
    (Array.isArray(usage.by_key) ? usage.by_key : []).map((row) => [String(row?.key ?? ''), row?.label ?? '']),
  );
  return {
    ...usage,
    buckets,
    by_uid: aggregateRows(buckets, 'uid'),
    by_realm: aggregateRows(buckets, 'realm'),
    by_model: aggregateRows(buckets, 'model'),
    by_key: aggregateRows(buckets, 'key')
      .map((row) => ({ ...row, label: labels.get(row.key) ?? '' })),
    total: aggregateRows(buckets, null)[0],
  };
}

/**
 * 可选的消费者清单（供选择器渲染）：在用的 key 逐把列出，已删除的**折成一项**。
 *
 * 为什么选择器里也要折：真机 720h 窗口里 7 把废弃 key + 2 把在用的 key ——
 * 逐把铺开就是 10 个按钮挤在 564px 的列里（实测被压到互相盖住），
 * 而卡片那边刚刚因为同一批废弃 key 折过一回。同一个道理不能只在卡片上用。
 * 折叠后选择器是「全部 / 在用的 key… / 已删除的 N 个 key」，选中最后一项
 * 即把整页收窄到这一组（`scopeUsage` 支持一组 id）。
 *
 * 复用 `consumerShares` 的命名规则（label → 主 key → 未鉴权 → `k_xxx（已删除）`），
 * 免得选择器和卡片对同一把 key 给出两个名字。
 *
 * @param byKey - `usage.by_key`（收窄前的那份）。
 * @param metric - 维度 id（决定排序，不影响名字）。
 * @returns `[{id, label, deleted, deletedIds?, requests, tokens, failRate}]`；不含「全部」。
 */
export function consumerOptions(byKey, metric = DEFAULT_RANK_METRIC) {
  const rows = consumerShares(byKey, metric, { foldDeleted: false });
  const live = [];
  const gone = [];
  for (const row of rows) {
    const item = {
      id: row.key,
      label: row.name,
      deleted: row.deleted === true,
      requests: row.requests,
      tokens: row.tokens,
      failRate: row.failRate,
    };
    if (item.deleted) gone.push(item);
    else live.push(item);
  }
  if (gone.length === 0) return live;
  const sum = (field) => gone.reduce((acc, item) => acc + (Number(item[field]) || 0), 0);
  const requests = sum('requests');
  const failed = gone.reduce((acc, item) => acc + (Number(item.requests) || 0) * (Number(item.failRate) || 0), 0);
  return [...live, {
    id: DELETED_CONSUMERS,
    label: `已删除的 ${gone.length} 个 key`,
    deleted: true,
    deletedIds: gone.map((item) => item.id),
    requests,
    tokens: sum('tokens'),
    failRate: requests > 0 ? failed / requests : 0,
  }];
}

/**
 * 按渠道归因：把 `by_uid` 折成渠道（WB / Trae / Qoder）。
 *
 * 为什么从账号再折一层：网关的 `by_realm` 只有 cn/global 两域，
 * 而「哪个渠道在烧钱」是面板用户真正要问的问题（三个渠道余额互相独立）。
 * 渠道归属由 `/status` 的 channel + `channelResolver()` 决定，与账号池同源。
 *
 * @param rows - `by_uid`。
 * @param total - 同响应里的 `total`。
 * @param accounts - `/status` 的 accounts。
 * @param channelOf - `channelResolver()` 的产物。
 * @param metric - 排行维度（默认 `tokens` = 按用量）。
 * @returns 按当前维度降序的渠道行（含 `share` / `barMax`）。
 */
export function channelShares(rows, total, accounts = [], channelOf = () => 'workbuddy', metric = DEFAULT_RANK_METRIC) {
  const accountsRows = accountShares(rows, total, accounts, channelOf, metric);
  const table = new Map();
  for (const row of accountsRows) {
    const key = row.channel || 'unknown';
    if (!table.has(key)) {
      table.set(key, {
        key, requests: 0, tokens: 0, credit: 0, failed: 0, success: 0, accounts: 0, value: 0,
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
    barMax: entry.value / max,
  }));
}

/**
 * 概览 KPI 卡（6 张，两行 × 三列）。
 *
 * 排布（用户指定，顺序即展示顺序）：
 *   第一行 Tokens消耗 · 积分消耗 · 可用积分 —— 「花了多少 / 还剩多少」；
 *   第二行 请求数 · 缓存命中 · 平均延迟   —— 「怎么花的」。
 *
 * 口径纪律：六张卡**全部来自窗口分桶 `total`**（缓存三段与 avg_latency_ms
 * 都是网关这一版补进分桶的），所以不存在跨口径并排。进程累计口径的
 * 命中率仍在折叠区单独展示 —— 那两个数不可混算。
 *
 * 参考实现的取舍（详见 `.scratch/chanhub-panel/usage-v4-plan.md` §4）：
 *   - 参考的「会话数」→ 我们只有**请求数**（网关无会话概念，不编造）。
 *
 * @param props - `{total, stock, days, burn}`。
 * @returns 6 项 `[{key, label, value, detail, tone, title, raw, kind}]`。
 */
export function kpiCards({ total, stock, days, burn }) {
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
      key: 'tokens',
      label: 'Tokens消耗',
      value: formatTokens(structure.total),
      // raw + kind：KPI 卡对**原始数**做入场动效、再按同一格式化器回写。
      // 对已格式化字符串反解（"18.9k" → 18.9）会把单位当数量级，动效会显示 0k。
      raw: structure.total,
      kind: 'tokens',
      tone: 'info',
      detail: `输入 ${formatTokens(structure.prompt)} · 输出 ${formatTokens(structure.completion)}`,
      title: `窗口内 prompt + completion 合计 ${formatNumber(structure.total)}（两段互斥，相加不重复计）`,
    },
    {
      key: 'credit',
      label: '积分消耗',
      value: formatCompact(credit),
      raw: credit,
      kind: 'compact',
      detail: requests > 0 ? `每请求 ${formatCredit(credit / requests)}` : '窗口内无请求',
      tone: 'warn',
      title: `窗口内真实扣费合计 ${formatCredit(credit)}（网关账本口径）`,
    },
    {
      key: 'stock',
      label: '可用积分',
      value: formatCompact(usable),
      raw: usable,
      kind: 'compact',
      detail: burn
        ? `≈ 还可 ${burnDaysText(burn.days)}`
        : `活跃 ${active.length} 天`,
      tone: 'ok',
      title: burn
        ? tryBurn(burn, stock)
        : `只算可消耗额度，不含渠道专用池。窗口内 ${list.length} 天中有 ${active.length} 天有请求`,
    },
    {
      key: 'requests',
      label: '请求数',
      value: formatCompact(requests),
      raw: requests,
      kind: 'compact',
      detail: `成功 ${formatNumber(requests - failed)} · 失败 ${formatNumber(failed)}`,
      tone: 'info',
      title: '网关无会话概念，故这里如实给请求数（不编造「会话数」）',
    },
    {
      key: 'cache',
      label: '缓存命中',
      // 「没有观测」与「命中率为 0」是两件事：无观测显示 —，不显示 0%。
      value: hit === null ? '—' : formatPercent(hit, 1),
      raw: hit ?? 0,
      kind: 'percent',
      detail: hit === null
        ? '窗口内无缓存观测'
        : `命中 ${formatTokens(Number(total?.cache_hit_tokens) || 0)} · 未命中 ${formatTokens(Number(total?.cache_miss_tokens) || 0)}`,
      tone: hit !== null && hit >= 0.75 ? 'ok' : 'idle',
      title: '窗口分桶口径：命中 /（命中 + 未命中），写入不计入分母。进程累计口径的命中率见下方折叠区（两者不可混算）',
    },
    {
      key: 'latency',
      label: '平均延迟',
      value: Number.isFinite(latency) && latency > 0 ? latencyText(latency) : '—',
      raw: Number.isFinite(latency) ? latency : 0,
      kind: 'ms',
      detail: requests > 0 ? `按请求数加权 · ${formatNumber(requests)} 次` : '窗口内无请求',
      tone: Number.isFinite(latency) && latency > 0 && latency >= 5000 ? 'warn' : 'idle',
      title: '窗口分桶口径：逐槽均值按请求数加权后的端到端耗时（与 /v1/stats 的进程累计均值是两个口径）',
    },
  ];
}

/** 延迟可读文本：≥1s 用秒，否则用毫秒。 */
export function latencyText(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${Math.round(value)} ms`;
}

/**
 * 命中率：命中 /（命中 + 未命中）。
 *
 * 写入不进分母 —— 与网关 `finalizeGroup()` 同公式（写入是「为后续命中付的费」，
 * 计入会压低首次请求的命中率）。分母为 0 返回 **null**（前端显示「—」，
 * 而不是显示 0% —— 0% 意味着「命中率为零」，与「没有观测」是两件事）。
 *
 * @param row - 带 `cache_hit_tokens` / `cache_miss_tokens` 的行。
 * @returns 0–1 或 null。
 */
export function hitRate(row) {
  const hit = Number(row?.cache_hit_tokens) || 0;
  const miss = Number(row?.cache_miss_tokens) || 0;
  const denom = hit + miss;
  if (denom <= 0) return null;
  return hit / denom;
}

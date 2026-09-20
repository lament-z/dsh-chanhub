// dsh-chanhub —— chanhub 网关配置项全量规格表
//
// 为什么单独成文件：这张表同时被两处消费 ——
//   1. 宿主（lib/gateway-config.js）用它做写入校验；
//   2. 浏览器面板（client/index.js）用它渲染 53 项配置表单与危险语义角标。
// 两边共用同一份定义，才不会出现「后端校验一套、前端提示另一套」的漂移。
//
// 本文件**不得引入任何 Node 依赖**（会被打进浏览器 bundle）。
//
// 依据：`.scratch/chanhub-panel/inventory.md` §A（逐字段核对 cmd/server/config.go
// 与 internal/config/schedule.go），危险语义依据同文档与 issue 05。

/** Go `time.ParseDuration` 接受的时长字面量。 */
export const DURATION_PATTERN = /^(\d+(\.\d+)?(ns|us|µs|ms|s|m|h))+$/;

/**
 * @typedef {object} FieldSpec
 * @property {string} path - 点分路径，如 `pool.max_in_flight`。
 * @property {string} label - 中文短名。
 * @property {'bool'|'int'|'float'|'string'|'duration'|'enum'|'hours'} type - 控件类型。
 * @property {string} [enumValues] - enum 的可选值（逗号分隔展示）。
 * @property {string} [note] - 危险语义或特殊行为说明（会显示在 UI 上）。
 * @property {boolean} [danger] - 标红显示。
 * @property {boolean} [restart] - 改动需重启（chanhub 无热加载）。
 * @property {string} [default] - 默认值（仅用于展示提示）。
 */

/**
 * 配置分组。每个分组对应 UI 上的一个折叠块。
 * `openByDefault` 只对 `pool` 与 `schedule` 为真（对齐 ui-design.md §5.5）。
 */
export const CONFIG_GROUPS = [
  { id: 'pool', label: '账号池治理', openByDefault: true },
  { id: 'schedule', label: '定时排程', openByDefault: true },
  { id: 'cooldown', label: '冷却与熔断退避', openByDefault: false },
  { id: 'session_sticky', label: '会话粘性', openByDefault: false },
  { id: 'upstream', label: '上游客户端', openByDefault: false },
  { id: 'global', label: '国际版域（global）', openByDefault: false },
  { id: 'prompt', label: '系统提示词', openByDefault: false },
  { id: 'upstash', label: 'Redis 镜像（upstash）', openByDefault: false },
  { id: 'features', label: '特性开关', openByDefault: false },
  { id: 'admin', label: '管理端点', openByDefault: false },
  { id: 'top', label: '顶层（装配期）', openByDefault: false },
];

/**
 * 53 个可配置叶子项的规格表。
 *
 * `restart: false` 仅用于已在 chanhub 具备 setter 的 `pool.*`（6 个 setter 已就绪，
 * 见 implementation.md §P3）。其余一律 `true` —— chanhub 没有配置热加载，
 * 面板**不做假的「立即生效」**。
 */
export const CONFIG_FIELDS = /** @type {FieldSpec[]} */ ([
  // ---- pool（12 项；6 个 setter 已就绪，可热改）----
  {
    path: 'pool.max_in_flight',
    label: '单账号在途上限',
    type: 'int',
    default: '3',
    restart: false,
    note: '0 = 不限（不是「回落默认」）—— 与其他 pool 项语义相反，配错会放开并发闸门',
    danger: true,
  },
  {
    path: 'pool.max_in_flight_global',
    label: 'global 域单账号在途上限',
    type: 'int',
    default: '2',
    restart: false,
    note: '0 或负数 → 回落 2（与 max_in_flight 相反！）',
    danger: true,
  },
  { path: 'pool.breaker_threshold', label: '熔断触发连败数', type: 'int', default: '3', restart: false, note: '≤0 → 回落 3' },
  { path: 'pool.breaker_cooldown', label: '熔断基础时长', type: 'duration', default: '30m', restart: false },
  { path: 'pool.breaker_cooldown_max', label: '熔断退避封顶', type: 'duration', default: '6h', restart: false },
  { path: 'pool.degrade_threshold', label: '连败降权阈值', type: 'int', default: '5', restart: false, note: '≤0 → 回落 5' },
  { path: 'pool.degrade_cooldown', label: '降权时长', type: 'duration', default: '10m', restart: false, note: '固定值，不指数退避' },
  { path: 'pool.degrade_cooldown_max', label: '降权时长上限', type: 'duration', default: '2h', restart: false },
  { path: 'pool.idle_weight_per_hour', label: '闲置补偿权重/小时', type: 'float', default: '0.5', restart: false, note: '≤0 → 回落 0.5' },
  { path: 'pool.idle_weight_max', label: '闲置补偿封顶', type: 'float', default: '5.0', restart: false, note: '≤0 → 回落 5.0' },
  {
    path: 'pool.expiring_soon',
    label: '快过期积分窗口',
    type: 'duration',
    default: '168h',
    restart: false,
    note: '0 或负 = 禁用快过期分桶（合法值，不是回落）',
    danger: true,
  },
  {
    path: 'pool.cost_explore_interval',
    label: 'costTier 探索窗口',
    type: 'duration',
    default: '30m',
    restart: false,
    note: '0 = 关停探索（合法值，不回落默认）',
    danger: true,
  },

  // ---- schedule（13 项；chanhub 无 Reconfigure → 需重启）----
  { path: 'schedule.checkin_hours', label: '签到小时', type: 'hours', default: '[9,21]', restart: true },
  { path: 'schedule.travel_hours', label: '猫猫旅行小时', type: 'hours', default: '[9,21]', restart: true },
  { path: 'schedule.activity_hours', label: '活跃地图小时', type: 'hours', default: '[10]', restart: true },
  { path: 'schedule.keepalive_hours', label: 'token 保活小时', type: 'hours', default: '[22]', restart: true },
  { path: 'schedule.school_hours', label: '开学季小时', type: 'hours', default: '[12]', restart: true },
  { path: 'schedule.cat_hours', label: '夜猫子小时', type: 'hours', default: '[1]', restart: true, note: '窗口 23:00–08:00 CST' },
  { path: 'schedule.checkin_enabled', label: '启用签到', type: 'bool', default: 'true', restart: true },
  { path: 'schedule.travel_enabled', label: '启用旅行', type: 'bool', default: 'true', restart: true },
  { path: 'schedule.activity_enabled', label: '启用活跃上报', type: 'bool', default: 'true', restart: true },
  { path: 'schedule.keepalive_enabled', label: '启用保活', type: 'bool', default: 'true', restart: true },
  { path: 'schedule.school_enabled', label: '启用开学季', type: 'bool', default: 'true', restart: true },
  { path: 'schedule.cat_enabled', label: '启用夜猫子', type: 'bool', default: 'true', restart: true },
  {
    path: 'schedule.activity_report_count',
    label: '每次上报条数',
    type: 'int',
    default: '5',
    restart: true,
    note: '缺省 5；显式 0 → 变为 1（两条路径不合并，是刻意的）',
    danger: true,
  },

  // ---- cooldown（2 项）----
  { path: 'cooldown.soft_rate', label: '软限流冷却基数', type: 'duration', default: '600s', restart: false },
  { path: 'cooldown.soft_rate_max', label: '软冷却退避封顶', type: 'duration', default: '2h', restart: false },

  // ---- session_sticky（3 项）----
  { path: 'session_sticky.enabled', label: '启用粘性会话', type: 'bool', default: 'true', restart: true },
  { path: 'session_sticky.ttl', label: '绑定 TTL', type: 'duration', default: '30m', restart: true, note: '滚动续期' },
  { path: 'session_sticky.gc_interval', label: 'GC 周期', type: 'duration', default: '5m', restart: true },

  // ---- upstream（10 项）----
  { path: 'upstream.timeout_seconds', label: '短 RPC 总时长上限', type: 'int', default: '120', restart: true, note: '单位秒' },
  { path: 'upstream.header_timeout_seconds', label: 'SSE 首字节上限', type: 'int', default: '0', restart: true, note: '0 → 回落 timeout_seconds' },
  { path: 'upstream.idle_timeout_seconds', label: 'SSE 空闲上限', type: 'int', default: '0', restart: true, note: '0 → 回落 300' },
  { path: 'upstream.user_agent', label: '出站 UA 覆盖', type: 'string', default: '', restart: true },
  { path: 'upstream.client_version', label: 'UA 的 WorkBuddy 版本', type: 'string', default: '', restart: true },
  { path: 'upstream.cli_version', label: 'UA 的 CLI 版本', type: 'string', default: '', restart: true },
  { path: 'upstream.device_token', label: '设备风控 token', type: 'string', default: '', restart: true, danger: true },
  { path: 'upstream.device_token_file', label: '设备 token 文件', type: 'string', default: '', restart: true, note: '读缓存 5 分钟' },
  { path: 'upstream.client_name', label: '用量归属头', type: 'string', default: 'WorkBuddy', restart: true, note: '填 SaaS 可还原旧行为' },
  { path: 'upstream.passthrough_ip', label: '透传客户端 IP', type: 'bool', default: 'false', restart: true },

  // ---- global（3 项）----
  { path: 'global.enabled', label: '启用 global 域路由', type: 'bool', default: 'true', restart: true, note: 'false = 纯 CN 锁定（逃生门）' },
  { path: 'global.chat_base', label: 'chat base 覆盖', type: 'string', default: '', restart: true },
  { path: 'global.billing_base', label: 'billing base 覆盖', type: 'string', default: '', restart: true },

  // ---- prompt（2 项）----
  { path: 'prompt.mode', label: '提示词模式', type: 'enum', enumValues: 'passthrough,custom,append', default: 'passthrough', restart: true, note: '非法值会导致网关启动报错' },
  { path: 'prompt.file', label: '提示词文件', type: 'string', default: '', restart: true, note: 'custom/append 下非空但不可读 → 启动报错' },

  // ---- upstash（2 项）----
  { path: 'upstash.url', label: 'Redis URL', type: 'string', default: '', restart: true, note: '空 = 纯内存' },
  { path: 'upstash.token', label: 'Redis token', type: 'string', default: '', restart: true, danger: true },

  // ---- features（1 项）----
  { path: 'features.sanitize_blacklist_fingerprints', label: '黑名单指纹脱敏', type: 'bool', default: 'true', restart: false },

  // ---- admin（1 项）----
  { path: 'admin.enabled', label: '启用管理端点', type: 'bool', default: 'false', restart: true, danger: true, note: '开启且 api_key 为空 → 网关拒绝启动' },

  // ---- 顶层（4 项）----
  { path: 'listen', label: '监听地址', type: 'string', default: ':7863', restart: true, note: 'assembly 期捕获，必须重启' },
  { path: 'api_key', label: 'API key', type: 'string', default: '', restart: false, danger: true, note: '热生效；改动后需同步更新插件设置，否则面板失联' },
  { path: 'auth_dir', label: '凭证目录', type: 'string', default: './auths', restart: true },
  { path: 'state_file', label: '状态落盘路径', type: 'string', default: './data/state.json', restart: true },
]);

/** 按分组返回字段。 */
export function fieldsByGroup() {
  const grouped = new Map(CONFIG_GROUPS.map((group) => [group.id, []]));
  for (const field of CONFIG_FIELDS) {
    const groupId = field.path.includes('.') ? field.path.split('.')[0] : 'top';
    const bucket = grouped.get(groupId);
    if (bucket) bucket.push(field);
  }
  return CONFIG_GROUPS.map((group) => ({ ...group, fields: grouped.get(group.id) ?? [] }));
}

/**
 * 按点分路径取值。
 * @param object - 源对象。
 * @param path - 点分路径。
 * @returns 值，或 undefined。
 */
export function getPath(object, path) {
  let cursor = object;
  for (const segment of path.split('.')) {
    if (cursor === null || typeof cursor !== 'object') return undefined;
    cursor = cursor[segment];
  }
  return cursor;
}

/**
 * 按点分路径写值（沿途缺失的中间对象会被创建）。
 * @param object - 目标对象（会被就地修改）。
 * @param path - 点分路径。
 * @param value - 要写入的值。
 */
export function setPath(object, path, value) {
  const segments = path.split('.');
  const last = segments.pop();
  let cursor = object;
  for (const segment of segments) {
    if (cursor[segment] === null || typeof cursor[segment] !== 'object') cursor[segment] = {};
    cursor = cursor[segment];
  }
  cursor[last] = value;
}

/**
 * 校验单个字段的输入值。
 *
 * 校验规则对齐后端语义（而非「我认为合理的语义」）——
 * 例如 `pool.max_in_flight` 的 0 是合法值（不限），而 `pool.max_in_flight_global`
 * 的 0 会静默回落 2。两者都不能被前端拦下，只能如实提示。
 *
 * @param field - 字段规格。
 * @param raw - 用户输入（字符串，或已是目标类型的值）。
 * @returns `{ok:true,value}` 或 `{ok:false,message}`。
 */
export function coerceField(field, raw) {
  switch (field.type) {
    case 'bool': {
      if (typeof raw === 'boolean') return { ok: true, value: raw };
      if (raw === 'true') return { ok: true, value: true };
      if (raw === 'false') return { ok: true, value: false };
      return { ok: false, message: '必须是 true 或 false' };
    }
    case 'int': {
      const text = String(raw).trim();
      if (!/^[+-]?\d+$/.test(text)) return { ok: false, message: '必须是整数' };
      return { ok: true, value: Number.parseInt(text, 10) };
    }
    case 'float': {
      const text = String(raw).trim();
      if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(text)) return { ok: false, message: '必须是数字' };
      return { ok: true, value: Number.parseFloat(text) };
    }
    case 'duration': {
      const text = String(raw).trim();
      if (text === '') return { ok: false, message: '时长不能为空' };
      if (!DURATION_PATTERN.test(text)) {
        return { ok: false, message: `不是合法时长（对齐 Go time.ParseDuration，如 30m / 1h30m / 600s）` };
      }
      return { ok: true, value: text };
    }
    case 'enum': {
      const allowed = field.enumValues.split(',');
      const text = String(raw).trim();
      if (!allowed.includes(text)) return { ok: false, message: `只能取 ${field.enumValues}` };
      return { ok: true, value: text };
    }
    case 'hours': {
      const text = String(raw).trim();
      if (text === '' || text === '[]') return { ok: true, value: [] };
      const body = text.replace(/^\[|\]$/g, '').trim();
      if (body === '') return { ok: true, value: [] };
      const parts = body.split(',').map((piece) => piece.trim()).filter((piece) => piece !== '');
      const hours = [];
      for (const piece of parts) {
        if (!/^\d{1,2}$/.test(piece)) return { ok: false, message: `非法小时值 "${piece}"` };
        const hour = Number.parseInt(piece, 10);
        if (hour < 0 || hour > 23) return { ok: false, message: `小时必须在 0–23：${hour}` };
        hours.push(hour);
      }
      return { ok: true, value: hours };
    }
    case 'string':
    default: {
      return { ok: true, value: typeof raw === 'string' ? raw : String(raw) };
    }
  }
}

/**
 * 把字段值渲染成输入框文本。
 * @param field - 字段规格。
 * @param value - 当前值。
 * @returns 输入框文本。
 */
export function formatFieldValue(field, value) {
  if (value === undefined || value === null) return '';
  if (field.type === 'hours') return Array.isArray(value) ? value.join(', ') : String(value);
  if (field.type === 'bool') return value ? 'true' : 'false';
  return String(value);
}

/**
 * 校验一整个 patch（`{path: value}`）并产出「需重启的字段」清单。
 * @param patch - 点分路径到新值的映射。
 * @returns `{ok:true,values,restartRequired}` 或 `{ok:false,errors}`。
 */
export function validatePatch(patch) {
  const errors = [];
  const values = {};
  const restartRequired = [];
  const byPath = new Map(CONFIG_FIELDS.map((field) => [field.path, field]));

  for (const [path, raw] of Object.entries(patch ?? {})) {
    const field = byPath.get(path);
    if (!field) {
      errors.push({ path, message: '未知配置项（不在 53 项清单内）' });
      continue;
    }
    const result = coerceField(field, raw);
    if (!result.ok) {
      errors.push({ path, message: result.message });
      continue;
    }
    values[path] = result.value;
    if (field.restart !== false) restartRequired.push(path);
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, values, restartRequired };
}

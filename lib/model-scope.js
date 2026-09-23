// dsh-chanhub —— 消费者模型集合的匹配与校验（宿主与浏览器共用的纯逻辑）
//
// **必须与网关 `internal/server/keys.go` 的 `matchModelPattern` / `validatePatterns`
// 逐条对齐。**
//
// 为什么规则要在插件侧复制一份：面板的「这个 key 会看到什么」是本地算出来的 ——
// 网关按 key.id 求值的端点不存在，而 key 明文只在创建/轮换那一刻出现一次，
// 事后无法再拿明文去打 `/v1/models` 实测。于是只剩两条路：本地算，或为预览
// 新增一个网关端点（要再重建一次容器）。选了前者。
//
// 漂移的代价很高：面板显示一个与网关实际下发不一致的数字，**比不显示更糟** ——
// 用户会以为自己配对了。故对齐靠三件事：
//   1. 规则只有三条（见下），没有正则、没有大小写折叠、没有前缀通配之外的花样；
//   2. 校验规则同样照抄网关（`*` 只允许在末尾、非空、无空白、单条上限）；
//   3. `test/model-scope.test.mjs` 的用例表与网关 `keys_test.go` 的
//      `TestMatchModelPattern` / `TestValidatePatterns` **逐条相同**。
//      改任何一边都必须同步改用例表 —— 用例表本身就是对齐的锚点。
//
// 规则（与 Go 版一字不差）：
//   "*"          → 全部命中
//   以 "*" 结尾   → 前缀命中
//   其他          → 精确相等

/** 单条模式长度上限（与网关 maxKeyPatternLen 一致）。 */
export const MAX_PATTERN_LEN = 200;

/** 单 key 模式条数上限（与网关 maxKeyPatterns 一致）。 */
export const MAX_PATTERNS = 500;

/**
 * 判断一个 canonical 模型 id 是否命中一条集合模式。
 *
 * @param pattern - 模式串（如 `*` / `workbuddy:cn:*` / `workbuddy:cn:glm-5.3`）。
 * @param id - canonical 模型 id（三段式，与 `/v1/models` 输出同口径）。
 * @returns 是否命中。
 */
export function matchesModelScope(pattern, id) {
  if (typeof pattern !== 'string' || typeof id !== 'string') return false;
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) return id.startsWith(pattern.slice(0, -1));
  return pattern === id;
}

/**
 * 集合三态语义（与网关 `Principal.Scope` 同义）：
 *
 *   `null` / `undefined` → **全量**（字段缺失，零回归默认）
 *   `[]`                 → **空集**（该 key 一个模型都看不到、chat 全拒）
 *   非空数组             → 并集命中
 *
 * 三态不能塌成两态：把 `[]` 当「全量」会让「临时封禁一个 key」变成「放开全部」，
 * 这是最危险的一种误读。
 *
 * @param models - 全量目录条目（`{id}` 数组）。
 * @param scope - 该 key 的 `models` 字段。
 * @returns 过滤后的条目，保持原顺序。
 */
export function visibleModels(models, scope) {
  if (!Array.isArray(models)) return [];
  if (scope === null || scope === undefined) return models;
  if (!Array.isArray(scope)) return [];
  return models.filter((m) => scope.some((p) => matchesModelScope(p, m?.id)));
}

/**
 * 集合可读摘要（列表与预览共用，避免两处各写一套文案）。
 *
 * @param scope - 该 key 的 `models` 字段。
 * @returns `{kind, label, count}`；kind 为 `all` / `none` / `patterns`。
 */
export function describeScope(scope) {
  if (scope === null || scope === undefined) return { kind: 'all', label: '全量', count: 0 };
  if (!Array.isArray(scope) || scope.length === 0) return { kind: 'none', label: '空集', count: 0 };
  if (scope.length === 1 && scope[0] === '*') return { kind: 'all', label: '全量', count: 0 };
  return { kind: 'patterns', label: `${scope.length} 条规则`, count: scope.length };
}

/**
 * 校验一组模式（照抄网关 `validatePatterns` 的判据）。
 *
 * 本地先拦一道的价值：错误能在面板上标到具体那一行规则，而不是等网关回一个
 * 400 再把整串错误文案糊在顶上。但**网关照旧会再校验一次** —— 本地校验是
 * 体验优化，不是安全边界。
 *
 * @param value - 待校验的 `models` 字段。
 * @returns `{ok:true, value}` 或 `{ok:false, message}`。
 */
export function validateScope(value) {
  if (!Array.isArray(value)) return { ok: false, message: 'models 必须是数组' };
  if (value.length > MAX_PATTERNS) {
    return { ok: false, message: `规则条数过多（上限 ${MAX_PATTERNS}）` };
  }
  for (const pattern of value) {
    if (typeof pattern !== 'string' || pattern === '') {
      return { ok: false, message: '规则必须是非空字符串' };
    }
    if (pattern.length > MAX_PATTERN_LEN) {
      return { ok: false, message: `规则过长（上限 ${MAX_PATTERN_LEN} 字符）：${pattern.slice(0, 40)}…` };
    }
    if (/\s/.test(pattern)) {
      return { ok: false, message: `规则含空白字符：${pattern}` };
    }
    if (pattern.includes('*') && !pattern.endsWith('*')) {
      return { ok: false, message: `* 只能出现在末尾（只支持前缀通配）：${pattern}` };
    }
    if ((pattern.match(/\*/g) ?? []).length > 1) {
      return { ok: false, message: `规则含多个 *：${pattern}` };
    }
  }
  return { ok: true, value: value.slice() };
}

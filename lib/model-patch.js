// model-patch.js —— 「一键给 DSH 模型配置打补丁」的纯逻辑。
//
// 背景（完整链路见 issue / 记忆）：
//   DSH 按 connection.models[i].inputModalities（deepseek 适配器）或
//   .input（pi-ai 适配器）判断某模型是否支持图片；但 DSH 的 discoverModels /
//   adopt() 会丢弃网关下发的视觉能力字段，导致从 chanhub /v1/models 拉到的
//   supports_images 到不了 DSH 配置，所有模型被判纯文本 → 上传图片被拦。
//
//   解法（不碰宿主）：dsh-chanhub 面板「一键应用」时，把网关已知的视觉模型
//   能力，write 回 DSH 那条 chanhub 连接的 models[n].input = ["text","image"]，
//   让 DSH 的 resolveModel 返回 inputModalities 含 image、不再拦截。
//
// 本模块只包含读写配置的纯转换（拿什么配置、给哪些模型补哪个字段），不触碰
// RPC / 网络：RPC 层只管从 settingsService 读当前值、把本模块的结果写回。
// 这样逻辑可被 node --test 直接单测。
//
// @module dsh-chanhub/model-patch

// pi-ai 适配器的连接命名空间（DSH settings 里 chanhub 走的就是它）。
export const PI_NS = 'llm-pi-ai';

// 视觉模型白名单（评审过、真实支持图片输入的模型 ID）。
//
// 为什么不用网关透出的 supports_images：workbuddy 渠道直传上游 WorkBuddy 的
// supportsImages 字段，而该上游字段粗粒度失真——几乎所有 chat 模型都标 true，
// 无法反映真实视觉输入能力（实测 42 个里 39 个误标 true，纯文本 glm-5.3 /
// deepseek-v4-pro 等都标了）。traework 渠道则完全不透出任何能力字段。
// 白名单来源：
//   - workbuddy：用模型描述（"原生多模态/视觉/支持图片输入"）逐个人工核实；
//   - traework：上游 get_detail_param 的 display_config.multimodal（权威、逐模型
//     细粒度字段），剔除 computer_use/browser_use/file_search/explore 子代理与
//     custom_model_* 自定义模型。
// 本白名单是「本地维护的可信视觉集合」；未来上游字段可靠后可改为读上游。
export const VISION_MODEL_WHITELIST = new Set([
  // workbuddy（描述核实，8 个）
  'workbuddy:cn:glm-5v-turbo',
  'workbuddy:cn:glm-5.3-flash',
  'workbuddy:cn:glm-4.6v',
  'workbuddy:cn:kimi-k2.5',
  'workbuddy:cn:kimi-k2.6',
  'workbuddy:cn:kimi-k2.7',
  'workbuddy:cn:minimax-m3',
  'workbuddy:cn:deepseek-v4.1-flash',
  // traework（上游 multimodal 核实，13 个；剔除子代理/自定义）
  'traework:cn:Doubao-Seed-Evolving',
  'traework:cn:Doubao-Seed-2.1-Pro',
  'traework:cn:seed-code-pro-0430',
  'traework:cn:Doubao-Seed-2.1-Turbo',
  'traework:cn:Doubao-Seed-2.0-Code',
  'traework:cn:kimi-k3',
  'traework:cn:kimi-k2.7-code',
  'traework:cn:kimi-k2.6',
  'traework:cn:minimax-m3',
  'traework:cn:qwen3.8-max',
  'traework:cn:qwen-3.7-plus',
  'traework:cn:sagitta',
  'traework:cn:aquila',
]);

/**
 * 某模型是否具备真实视觉能力。
 *
 * 两个来源：人工评审白名单 + **已沉淀的能力基线**（见 parseCapabilities）。
 * 基线是「目录比对确认过、用户点过沉淀」的集合，所以它能让白名单不必手工扩张；
 * 传入的 `extraVision` 是调用方一次性算好的 Set（避免逐模型重算）。
 *
 * @param id - 模型 id。
 * @param extraVision - 可选：额外视为视觉的 id 集合（基线里 image=true 的）。
 */
export function isVisionModel(id, extraVision) {
  if (VISION_MODEL_WHITELIST.has(id)) return true;
  return extraVision instanceof Set ? extraVision.has(id) : false;
}

/* ──────────────────── 能力基线（沉淀）──────────────────── */

/**
 * 能力基线 = `settings.modelCapabilities` 里存的 JSON，形态：
 * `{ at, entries: { "<id>": { image, status, tier, how, at } } }`。
 *
 * 三件套的分工：拉取快照记「看到了什么」，覆盖备份记「改前是什么」，
 * 基线记「评审后认定是什么」。基线只收**确认态**（confirmed）的结论 ——
 * 借判/模糊/冲突/无收录一律不沉淀，避免把猜测写成事实。
 *
 * 坏值一律降级为 null（同 parseSnapshot：用户手改坏这一格不能让面板打不开）。
 *
 * @param text - settings 字段值。
 * @returns `{at, entries}` 或 null。
 */
export function parseCapabilities(text) {
  if (typeof text !== 'string' || text.trim() === '') return null;
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object' || !raw.entries || typeof raw.entries !== 'object') return null;
  const entries = {};
  for (const [id, v] of Object.entries(raw.entries)) {
    if (typeof id !== 'string' || id === '' || !v || typeof v !== 'object') continue;
    if (v.image !== true && v.image !== false) continue;
    entries[id] = {
      image: v.image === true,
      status: typeof v.status === 'string' ? v.status : '',
      tier: typeof v.tier === 'string' ? v.tier : '',
      how: typeof v.how === 'string' ? v.how : '',
      at: Number(v.at) || 0,
    };
  }
  return { at: Number(raw.at) || 0, entries };
}

/** 基线里判定为「有视觉」的 id 集合（喂给 isVisionModel 的第二参）。 */
export function capabilityVisionSet(baseline) {
  const parsed = typeof baseline === 'string' ? parseCapabilities(baseline) : baseline;
  const set = new Set();
  for (const [id, v] of Object.entries(parsed?.entries ?? {})) {
    if (v?.image === true) set.add(id);
  }
  return set;
}

/** 稳定序列化（键排序）——让 settings 里的基线可 diff、可评审。 */
export function serializeCapabilities(baseline) {
  const entries = {};
  for (const id of Object.keys(baseline?.entries ?? {}).sort()) entries[id] = baseline.entries[id];
  return JSON.stringify({ at: Number(baseline?.at) || 0, entries });
}

/**
 * 把一次目录比对的**确认态**结论并入基线（幂等：同一结论重复沉淀不产生变化）。
 *
 * @param prev - 现有基线（settings 字符串或 parseCapabilities 的结果）。
 * @param verdicts - classifyAll 的输出。
 * @param opts - `{ at }`。
 * @returns `{at, entries, added, changed, skipped, count}`；added/changed 供 UI 如实汇报。
 */
/** 证据等级：数值越小越硬。L0 = 实测（真发图答对了），L1 = 原厂标注，L2 云托管，L3 转售。 */
const TIER_RANK = { L0: 0, L1: 1, L2: 2, L3: 3 };
function tierRank(tier) {
  const rank = TIER_RANK[tier];
  return rank === undefined ? 9 : rank;
}

export function mergeCapabilities(prev, verdicts, { at = Date.now() } = {}) {
  const base = typeof prev === 'string' ? parseCapabilities(prev) : prev;
  const entries = { ...(base?.entries ?? {}) };
  const added = [];
  const changed = [];
  const downgraded = [];
  let skipped = 0;
  for (const v of Array.isArray(verdicts) ? verdicts : []) {
    if (!v || typeof v.id !== 'string' || v.id === '') continue;
    // 只沉淀确认态：借判/冲突/别名/无收录都可能是错的，宁可不写
    if (v.status !== 'confirmed' || (v.verdict !== 'image' && v.verdict !== 'text')) {
      skipped += 1;
      continue;
    }
    const image = v.verdict === 'image';
    const before = entries[v.id];
    // **等级保护**：实测（L0）压过目录（L1-L3）。没有这道闸，用户点一次「沉淀确认项」
    // 就会把实测翻过来的结论用目录的错标注覆盖回去 —— 真机上目录对 CN 渠道有 17 个漏判。
    if (before && tierRank(v.tier) > tierRank(before.tier)) {
      downgraded.push({ id: v.id, kept: before.image ? 'image' : 'text', ignored: image ? 'image' : 'text', keptTier: before.tier, ignoredTier: v.tier ?? '' });
      continue;
    }
    if (!before) added.push(v.id);
    else if (before.image !== image) {
      changed.push({ id: v.id, from: before.image ? 'image' : 'text', to: image ? 'image' : 'text' });
    }
    entries[v.id] = { image, status: v.status, tier: v.tier ?? '', how: v.how ?? '', at };
  }
  return { at, entries, added, changed, downgraded, skipped, count: Object.keys(entries).length };
}

// pi-ai 命名空间下，提供商名的 settingsPath 前缀：providers.<provider>.models。
export function providerModelsPath(provider) {
  return ['providers', provider, 'models'];
}

/**
 * 从网关 /v1/models 响应里提取「模型目录快照」的展示形态。
 * 网关每条：{ id, name, context_length, max_output_tokens, supports_images,
 *            credits, reasoning_supported_efforts, ... }。
 * @param {object} body - client.models() 的原样返回（{ object, data:[...] } 或数组）。
 * @returns {Array<object>} 排序后的目录条目（id 去重保首）。
 */
export function listFromGatewayBody(body, { extraVision } = {}) {
  const data = Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
  const seen = new Set();
  const out = [];
  for (const raw of data) {
    const id = raw?.id;
    if (typeof id !== 'string' || id.length === 0 || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      name: typeof raw.name === 'string' ? raw.name : id,
      // 上文/输出长度：网关用 context_length / max_output_tokens（或 maxTokens）。
      contextWindow: numOr(raw.context_length, raw.contextWindow, raw.max_input_tokens),
      maxTokens: numOr(raw.max_output_tokens, raw.maxTokens),
      // 倍率：credits 或 description 里的 "x0.06" 前缀。
      credits: typeof raw.credits === 'string' && raw.credits !== '' ? raw.credits : undefined,
      // 倍率补充（qoder 的错峰折扣）：短句跟倍率并排显示，长说明作 tooltip。
      creditsNote: typeof raw.credits_note === 'string' && raw.credits_note !== ''
        ? raw.credits_note
        : undefined,
      creditsNoteDetail: typeof raw.credits_note_detail === 'string' && raw.credits_note_detail !== ''
        ? raw.credits_note_detail
        : undefined,
      // 多模态能力（核心）：**以本地白名单为准**，不信任网关透出的
      // supports_images（workbuddy 上游该字段失真、traework 不透出）。
      supportsImages: isVisionModel(id, extraVision),
      // 官方标记：网关按上游 agents[name=cli] 打好的（见 chanhub 的 /v1/models）。
      // 面板默认只显示官方，其余折叠成「扩展」—— 官方没列 ≠ 不可用（真机核对
      // 有 18 个官方没暴露但跑得通的模型），所以是**分层**不是删除。
      official: raw.official === true,
      // 附带展示：推理能力 / effort。
      supportsReasoning: raw.supports_reasoning === true,
      reasoningEfforts: Array.isArray(raw.reasoning_supported_efforts)
        ? raw.reasoning_supported_efforts
        : undefined,
    });
  }
  return out;
}

function numOr(...vals) {
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  }
  return undefined;
}

/**
 * 计算要写给 DSH llm-pi-ai providers.<provider>.models 的补丁。
 *
 * 语义：read-modify-write 的「modify」。给勾选中的模型条目补
 * input: ["text","image"]；保留该条目既有其他字段（contextWindow/maxTokens/
 * name/…）不动；未勾选的模型条目原样保留。返回新旧 models 数组与变更统计，
 * 便于上层决定要不要真写、以及 UI 提示。
 *
 * @param {Array<object>|undefined} current - 当前 DSH models 数组（可缺省）。
 * @param {Array<string>} selectedIds - 要补视觉能力的模型 id（完整 id，如
 *   "workbuddy:cn:glm-5.3"）。
 * @returns {{models:Array<object>, added:number, skipped:Array<string>}}
 *   models = 写回用数组；added = 本次新增 image 能力的条数；skipped = 勾选了但
 *   当前目录里不在（无该 id）而被忽略的 id。
 */
export function buildModelsPatch(current, selectedIds, { extraVision } = {}) {
  const base = Array.isArray(current) ? current.map(cloneModel) : [];
  const byId = new Map(base.map((m) => [m.id, m]));
  const added = [];
  const skipped = [];
  const seenSelected = new Set(selectedIds ?? []);

  for (const m of byId.values()) {
    if (!seenSelected.has(m.id)) continue;
    // 防御：只允许给白名单内的真实视觉模型补图片能力。若勾选了白名单外模型
    //（网关 supports_images 误标、或手工输入），不落 input 补丁。
    if (!isVisionModel(m.id, extraVision)) {
      skipped.push(m.id);
      continue;
    }
    if (!addImageInput(m)) continue;
    added.push(m.id);
  }

  for (const id of seenSelected) {
    if (!byId.has(id)) skipped.push(id);
  }

  return { models: [...byId.values()], added, skipped };
}

/** 深拷贝单个模型条目（只拷 JSON 值字段，防上层误改传入对象）。 */
function cloneModel(m) {
  if (!m || typeof m !== 'object') return {};
  const out = {};
  for (const k of Object.keys(m)) {
    if (Array.isArray(m[k])) out[k] = [...m[k]];
    else if (m[k] && typeof m[k] === 'object') out[k] = { ...m[k] };
    else out[k] = m[k];
  }
  return out;
}

/**
 * 给 model 加 pi-ai 的视觉 input。幂等：已有且含 image 时返回 false（无改动）。
 * @param {object} model - 将被原地修改（浅拷贝后由调用方持有，故 safe）。
 * @returns {boolean} 是否发生了新增/修改。
 */
export function addImageInput(model) {
  if (!model || typeof model !== 'object') return false;
  const cur = Array.isArray(model.input) ? model.input.filter((x) => typeof x === 'string') : [];
  const hasText = cur.includes('text');
  const hasImage = cur.includes('image');
  // 已是规范形态（text + image，text 在首、无重复）→ 无改动。
  if (hasText && hasImage && cur[0] === 'text' && cur.length === 2) return false;
  // 本函数语义 = 给模型补 image 能力 → 恒收敛到 [text, image] + 其余模态。
  const next = ['text', 'image'];
  for (const x of cur) if (x !== 'text' && x !== 'image' && !next.includes(x)) next.push(x);
  model.input = next;
  return true;
}
/* ──────────────────── 拉取记录（快照）与差异 ──────────────────── */

/**
 * 把网关模型目录压成**拉取快照**。字段"都存"：与 UI 表格列一一对应
 * （id / name / ctx / maxOut / credits / vision），这样下次拉取能逐字段算差异。
 *
 * @param {Array<object>} catalog - listFromGatewayBody 的输出。
 * @param {{at?:number,provider?:string}} meta - 拉取时刻与 provider。
 * @returns {{at:number,provider:string,count:number,models:Array<object>}}
 */
export function snapshotFromCatalog(catalog, { at = Date.now(), provider = '' } = {}) {
  const models = (Array.isArray(catalog) ? catalog : [])
    .filter((m) => m && typeof m.id === 'string' && m.id !== '')
    .map((m) => ({
      id: m.id,
      name: typeof m.name === 'string' ? m.name : '',
      ctx: numOr(m.contextWindow),
      maxOut: numOr(m.maxTokens),
      credits: typeof m.credits === 'string' ? m.credits : '',
      // 折扣短句 / 长说明：**要存进快照** —— 打开面板是从快照回显的，
      // 不存就等于每次打开都丢折扣信息。但**不进 SNAPSHOT_FIELDS**：
      // 错峰折扣按小时切换，计入差异会天天报「变化」刷屏（credits 变已足够提示）。
      note: typeof m.creditsNote === 'string' ? m.creditsNote : '',
      noteDetail: typeof m.creditsNoteDetail === 'string' ? m.creditsNoteDetail : '',
      vision: m.supportsImages === true,
      // 官方标记存进快照（打开面板是从快照回显的，不存就等于每次打开都丢分层）。
      // **不进 SNAPSHOT_FIELDS**：它由上游 agents[cli] 决定，上游调整名单会成片
      // 翻转，计进差异只会刷屏「变化 官方」—— 与 note/noteDetail 同待遇。
      official: m.official === true,
      // 推理档位按需写：补齐配置字段要用它，网关改了档位也算「变化」。
      // 无档位就不写这个键 —— 与「老快照」的区分靠顶层 hasEfforts，不靠这里的空数组。
      ...(Array.isArray(m.reasoningEfforts) && m.reasoningEfforts.length > 0
        ? { efforts: m.reasoningEfforts.map(String) }
        : {}),
    }));
  return {
    at: Number(at) || 0,
    provider: typeof provider === 'string' ? provider : '',
    count: models.length,
    models,
    // 这份快照是否采集过推理档位：老快照没有该字段，补齐时不能假装补过
    hasEfforts: true,
  };
}

/**
 * 解析 settings 里存的快照 JSON。**坏值一律降级为 null**（当作"没有记录"），
 * 绝不因为用户手改坏了这一格就让模型 Tab 打不开。
 *
 * @param {unknown} text - settings 字段值（字符串）。
 * @returns {object|null} 规范化后的快照，或 null。
 */
export function parseSnapshot(text) {
  if (typeof text !== 'string' || text.trim() === '') return null;
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.models)) return null;
  const models = raw.models
    .filter((m) => m && typeof m.id === 'string' && m.id !== '')
    .map((m) => ({
      id: m.id,
      name: typeof m.name === 'string' ? m.name : '',
      ctx: numOr(m.ctx),
      maxOut: numOr(m.maxOut),
      credits: typeof m.credits === 'string' ? m.credits : '',
      note: typeof m.note === 'string' ? m.note : '',
      noteDetail: typeof m.noteDetail === 'string' ? m.noteDetail : '',
      vision: m.vision === true,
      official: m.official === true,
      ...(Array.isArray(m.efforts) && m.efforts.length > 0 ? { efforts: m.efforts.map(String) } : {}),
    }));
  return {
    at: Number(raw.at) || 0,
    provider: typeof raw.provider === 'string' ? raw.provider : '',
    count: models.length,
    models,
    hasEfforts: raw.hasEfforts === true,
  };
}

/**
 * 把 settings 里的拉取快照还原成**目录展示形态**（与 listFromGatewayBody 同形）。
 *
 * 为什么需要：模型 Tab 在宿主里是条件渲染的（切走即卸载），组件状态随卸载丢失。
 * 若打开时只能空手等用户点「拉取」，就等于每开一次面板都要重打一次网关。快照
 * 本来就已落在 settings 里，这里把它还原成表格能直接吃的形状 —— 打开即有内容，
 * 「拉取」按钮退化为「刷新」。**纯本地还原，不发起任何网关请求。**
 *
 * @param {object|null} snapshot - parseSnapshot 的输出。
 * @returns {Array<object>} 目录条目（字段与 listFromGatewayBody 对齐）。
 */
export function catalogFromSnapshot(snapshot) {
  const models = Array.isArray(snapshot?.models) ? snapshot.models : [];
  return models
    .filter((m) => m && typeof m.id === 'string' && m.id !== '')
    .map((m) => ({
      id: m.id,
      // 名称缺失时回落成 id：表格那一列不该是空白。
      name: typeof m.name === 'string' && m.name !== '' ? m.name : m.id,
      contextWindow: numOr(m.ctx),
      maxTokens: numOr(m.maxOut),
      credits: typeof m.credits === 'string' && m.credits !== '' ? m.credits : undefined,
      // 折扣说明照原样还原（空则不写该键，与 listFromGatewayBody 的「省略」形状一致）。
      creditsNote: typeof m.note === 'string' && m.note !== '' ? m.note : undefined,
      creditsNoteDetail: typeof m.noteDetail === 'string' && m.noteDetail !== '' ? m.noteDetail : undefined,
      supportsImages: m.vision === true,
      official: m.official === true,
      ...(Array.isArray(m.efforts) && m.efforts.length > 0 ? { reasoningEfforts: m.efforts } : {}),
    }));
}

/** 快照里参与比较的字段（顺序即 UI 展示顺序）。 */
const SNAPSHOT_FIELDS = ['name', 'ctx', 'maxOut', 'credits', 'vision', 'efforts'];

/**
 * 两次快照的差异。`prev` 为 null（首次拉取）时 `removed` 恒为空 ——
 * 第一次拉取没有"上游消失"可言，不能拿它去提示"少了 N 个"。
 *
 * @param {object|null} prev - 上次快照。
 * @param {object} next - 本次快照。
 * @returns {{added:string[],removed:string[],changed:Array<{id:string,fields:string[]}>,first:boolean}}
 */
/**
 * 快照字段的相等判定。**数组必须逐项比**。
 *
 * 真机踩到的坑（2026-09-24）：`efforts` 是数组，用 `!==` 比引用的话，两次拉取
 * 拿到的同内容数组永远不相等 —— 于是「变化 N」恒定报 51（所有带档位的模型），
 * 面板上那个「变化」筛选永远筛出半个列表，等于没有。
 *
 * @param {unknown} a - 上次值。
 * @param {unknown} b - 本次值。
 * @returns {boolean} 是否相等。
 */
function sameSnapshotValue(a, b) {
  const aArr = Array.isArray(a);
  const bArr = Array.isArray(b);
  if (aArr || bArr) {
    const x = aArr ? a : [];
    const y = bArr ? b : [];
    return x.length === y.length && x.every((v, i) => v === y[i]);
  }
  return (a ?? undefined) === (b ?? undefined);
}

export function diffModelSnapshots(prev, next) {
  const nextModels = Array.isArray(next?.models) ? next.models : [];
  if (!prev || !Array.isArray(prev.models)) {
    return { added: nextModels.map((m) => m.id), removed: [], changed: [], first: true };
  }
  const prevById = new Map(prev.models.map((m) => [m.id, m]));
  const nextById = new Map(nextModels.map((m) => [m.id, m]));
  const added = [];
  const changed = [];
  for (const m of nextModels) {
    const before = prevById.get(m.id);
    if (!before) {
      added.push(m.id);
      continue;
    }
    const fields = SNAPSHOT_FIELDS.filter((f) => !sameSnapshotValue(before[f], m[f]));
    if (fields.length > 0) changed.push({ id: m.id, fields });
  }
  const removed = prev.models.filter((m) => !nextById.has(m.id)).map((m) => m.id);
  return { added, removed, changed, first: false };
}

/** 目录里我们认识的字段；其余键在覆盖时从原条目保留（不吞用户/DSH 的额外配置）。 */
const KNOWN_MODEL_KEYS = new Set(['id', 'name', 'contextWindow', 'maxTokens', 'input', 'reasoningEfforts']);

/**
 * 网关的 `reasoning_supported_efforts`（字符串数组，如 `["low","high"]`）→ pi-ai 的
 * `reasoningEfforts`（**对象映射** `{ level: 发出去的线上值 }`，见 dsh-llm-pi-ai 的
 * resolveModelReasoning）。
 *
 * 两个刻意的取舍：
 *   1. 只声明网关报出来的档位 —— 不猜、不补默认档（DSH 未声明的档位就是「不提供」）；
 *   2. **不声明 off**。本路由 thinkingFormat 探测为 "openai"，off 时 DSH 什么都不发，
 *      而网关侧 internal/upstream/thinking.go 见不到 reasoning_effort 就会注入
 *      thinking:{type:"enabled"} —— 声明 off 等于给用户一个按了没用的开关。真要能关，
 *      得给该模型加 compat:{thinkingFormat:"deepseek"}，那是另一个决定。
 *
 * @param raw - 网关字段（数组）。
 * @returns 对象映射，或 undefined（无可用档位）。
 */
export function reasoningEffortsFromGateway(raw) {
  const LEVELS = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
  if (!Array.isArray(raw)) return undefined;
  const out = {};
  for (const level of raw) {
    if (typeof level !== 'string') continue;
    const key = level.trim().toLowerCase();
    if (!LEVELS.includes(key) || out[key] !== undefined) continue;
    // 线上值 = 档位名（本路由走 OpenAI 的 reasoning_effort 字段）
    out[key] = key;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * 由网关目录构造要写进 DSH `llm-pi-ai providers.<provider>.models` 的数组。
 *
 * 语义 = "以网关为准"：目录里有但原来没有的 → 新增；原来有、目录里没的 → **丢弃**；
 * 两边都有的 → 用网关的 id/name/contextWindow/maxTokens 刷新，视觉能力按本地白名单补
 * `input:["text","image"]`，而**原条目里我们没在管的额外键原样保留**（避免把 DSH 或用户
 * 自己加的字段吞掉）。
 *
 * @param {Array<object>} catalog - listFromGatewayBody 的输出。
 * @param {{previous?:Array<object>}} opts - 当前 DSH models（用于保留额外键）。
 * @returns {Array<object>} 新的 DSH models 数组。
 */
export function modelsFromCatalog(catalog, { previous, extraVision } = {}) {
  const prevById = new Map(
    (Array.isArray(previous) ? previous : [])
      .filter((m) => m && typeof m.id === 'string')
      .map((m) => [m.id, m]),
  );
  return (Array.isArray(catalog) ? catalog : [])
    .filter((m) => m && typeof m.id === 'string' && m.id !== '')
    .map((m) => {
      const out = {};
      for (const [k, v] of Object.entries(prevById.get(m.id) ?? {})) {
        if (!KNOWN_MODEL_KEYS.has(k)) out[k] = v;
      }
      out.id = m.id;
      if (typeof m.name === 'string' && m.name !== '') out.name = m.name;
      if (Number.isFinite(m.contextWindow)) out.contextWindow = m.contextWindow;
      if (Number.isFinite(m.maxTokens)) out.maxTokens = m.maxTokens;
      const efforts = reasoningEffortsFromGateway(m.reasoningEfforts);
      if (efforts) out.reasoningEfforts = efforts;
      if (isVisionModel(m.id, extraVision)) out.input = ['text', 'image'];
      return out;
    });
}

/* ──────────────────── 补齐配置字段（不增不删，只填空缺）──────────────────── */

/**
 * 「补齐」= 给**已经在 DSH 配置里**的模型条目补上网关报出来的字段。
 *
 * 与 `modelsFromCatalog`（以网关为准覆盖）的分工：
 *   - 覆盖：目录为准，**增/删/改**条目（破坏性，需显式开关）；
 *   - 补齐：配置为准，**只填空缺**，条目一个不增一个不减（默认连不一致也不改）。
 *
 * 为什么需要它：pi-ai 对缺字段的条目回落到 DEFAULT_CONTEXT_WINDOW=262144 /
 * DEFAULT_MAX_TOKENS=32768 —— 用户看到「上游 1M、DSH 只有 256K」就是这么来的。
 * 补齐是把这个回落消掉的最小动作。
 *
 * @param current - 当前 DSH models 数组。
 * @param catalog - listFromGatewayBody 的输出（或快照还原的目录）。
 * @param opts - `{ extraVision, refresh }`：refresh=true 时连「已有但与网关不一致」的
 *   字段也刷新（默认 false，只填空缺）。
 * @returns `{models, changes, unchanged, missingInCatalog, warnings}`。
 */
export function buildCompletionPatch(current, catalog, { extraVision, refresh = false } = {}) {
  const models = (Array.isArray(current) ? current : []).map(cloneModel);
  const byId = new Map(
    (Array.isArray(catalog) ? catalog : [])
      .filter((m) => m && typeof m.id === 'string')
      .map((m) => [m.id, m]),
  );
  const changes = [];
  const missingInCatalog = [];
  const warnings = [];
  let unchanged = 0;

  for (const m of models) {
    if (typeof m.id !== 'string' || m.id === '') continue;
    const g = byId.get(m.id);
    if (!g) {
      missingInCatalog.push(m.id);
      continue;
    }
    const fields = [];
    const fillNumber = (key, value) => {
      if (!Number.isFinite(value) || value <= 0) return;
      const cur = m[key];
      if (!Number.isFinite(cur)) {
        m[key] = value;
        fields.push(key);
      } else if (refresh && cur !== value) {
        m[key] = value;
        fields.push(key);
      }
    };
    fillNumber('contextWindow', g.contextWindow);
    fillNumber('maxTokens', g.maxTokens);

    const efforts = reasoningEffortsFromGateway(g.reasoningEfforts);
    if (efforts) {
      const cur = m.reasoningEfforts;
      if (cur === undefined) {
        m.reasoningEfforts = efforts;
        fields.push('reasoningEfforts');
      } else if (refresh && JSON.stringify(cur) !== JSON.stringify(efforts)) {
        m.reasoningEfforts = efforts;
        fields.push('reasoningEfforts');
      }
    }

    if (isVisionModel(m.id, extraVision)) {
      const cur = Array.isArray(m.input) ? m.input : [];
      if (!cur.includes('image') && addImageInput(m)) fields.push('input');
    }

    // 网关自相矛盾（输出上限 > 上下文）如实提示，但不擅自改它的值
    if (Number.isFinite(m.maxTokens) && Number.isFinite(m.contextWindow) && m.maxTokens > m.contextWindow) {
      warnings.push({ id: m.id, kind: 'max-out-gt-context', maxTokens: m.maxTokens, contextWindow: m.contextWindow });
    }

    if (fields.length > 0) changes.push({ id: m.id, fields });
    else unchanged += 1;
  }

  return { models, changes, unchanged, missingInCatalog, warnings };
}

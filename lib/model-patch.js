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

/** 某模型是否在白名单内（真实视觉能力）。 */
export function isVisionModel(id) {
  return VISION_MODEL_WHITELIST.has(id);
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
export function listFromGatewayBody(body) {
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
      // 多模态能力（核心）：**以本地白名单为准**，不信任网关透出的
      // supports_images（workbuddy 上游该字段失真、traework 不透出）。
      supportsImages: isVisionModel(id),
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
export function buildModelsPatch(current, selectedIds) {
  const base = Array.isArray(current) ? current.map(cloneModel) : [];
  const byId = new Map(base.map((m) => [m.id, m]));
  const added = [];
  const skipped = [];
  const seenSelected = new Set(selectedIds ?? []);

  for (const m of byId.values()) {
    if (!seenSelected.has(m.id)) continue;
    // 防御：只允许给白名单内的真实视觉模型补图片能力。若勾选了白名单外模型
    //（网关 supports_images 误标、或手工输入），不落 input 补丁。
    if (!isVisionModel(m.id)) {
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
      vision: m.supportsImages === true,
    }));
  return { at: Number(at) || 0, provider: typeof provider === 'string' ? provider : '', count: models.length, models };
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
      vision: m.vision === true,
    }));
  return { at: Number(raw.at) || 0, provider: typeof raw.provider === 'string' ? raw.provider : '', count: models.length, models };
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
      supportsImages: m.vision === true,
    }));
}

/** 快照里参与比较的字段（顺序即 UI 展示顺序）。 */
const SNAPSHOT_FIELDS = ['name', 'ctx', 'maxOut', 'credits', 'vision'];

/**
 * 两次快照的差异。`prev` 为 null（首次拉取）时 `removed` 恒为空 ——
 * 第一次拉取没有"上游消失"可言，不能拿它去提示"少了 N 个"。
 *
 * @param {object|null} prev - 上次快照。
 * @param {object} next - 本次快照。
 * @returns {{added:string[],removed:string[],changed:Array<{id:string,fields:string[]}>,first:boolean}}
 */
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
    const fields = SNAPSHOT_FIELDS.filter((f) => (before[f] ?? undefined) !== (m[f] ?? undefined));
    if (fields.length > 0) changed.push({ id: m.id, fields });
  }
  const removed = prev.models.filter((m) => !nextById.has(m.id)).map((m) => m.id);
  return { added, removed, changed, first: false };
}

/** 目录里我们认识的字段；其余键在覆盖时从原条目保留（不吞用户/DSH 的额外配置）。 */
const KNOWN_MODEL_KEYS = new Set(['id', 'name', 'contextWindow', 'maxTokens', 'input']);

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
export function modelsFromCatalog(catalog, { previous } = {}) {
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
      if (isVisionModel(m.id)) out.input = ['text', 'image'];
      return out;
    });
}

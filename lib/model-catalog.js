// model-catalog.js —— 多模态能力判定的「结构化目录」层（纯逻辑 + 目录源装载）。
//
// 背景（用户决策）：
//   上游网关透出的 supports_images 不可信 —— workbuddy 直传上游 WorkBuddy 的粗粒度
//   字段（实测 42 个里 39 个误标 true，纯文本 glm-5.3 也被标 true），traework 则完全
//   不透出。人工白名单（VISION_MODEL_WHITELIST）能兜底但不可扩展。改为「结构化目录
//   三态比对」：本地 pi-ai 目录（离线、随 DSH 升级）→ models.dev 整包 → OpenRouter
//   整包；搜索引擎只作目录缺口的线索，且必须回官方 model card。
//
// 本模块只做纯转换与判定（可被 node --test 直接单测）；网络请求与落盘由 host 层调用。
// 第一步（本版）只做「只读标注」，不写任何 DSH 配置。
//
// @module dsh-chanhub/model-catalog

import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFile, writeFile, rename, mkdir, readdir } from 'node:fs/promises';

/** 目录源标识（与缓存文件、UI 文案一一对应）。 */
export const CATALOG_SOURCES = {
  piAi: 'pi-ai',
  modelsDev: 'models.dev',
  openRouter: 'openrouter',
};

/** 各目录源的整包地址（只在用户显式「刷新目录」时请求）。 */
export const CATALOG_URLS = {
  [CATALOG_SOURCES.modelsDev]: 'https://models.dev/api.json',
  [CATALOG_SOURCES.openRouter]: 'https://openrouter.ai/api/v1/models',
};

/** 缓存文件格式版本：格式变化时旧缓存直接判废，重新刷新即可。 */
export const CATALOG_CACHE_VERSION = 1;

/** 判定状态：三态 + 两类「待确认」。 */
export const VERDICT_STATUS = {
  confirmed: 'confirmed', // 精确命中目录且源内无分歧
  conflict: 'conflict', // 命中但同级源之间分歧
  borrowed: 'borrowed', // 剥后缀 / 模糊命中（结论借自邻近型号，待确认）
  alias: 'alias', // 渠道档位别名（通用名，不参与匹配）
  missing: 'missing', // 目录无收录
};

/** 来源等级：L1 原厂/官方 > L2 云厂商托管 > L3 转售/聚合。 */
export const TIER_LABEL = { L1: '原厂', L2: '云托管', L3: '转售' };

/**
 * 原厂（L1）判定：模型名族 → 该族的官方 provider 键。
 * 为什么按「名族 + provider」而不是只按 provider：同一份目录里既有原厂条目也有
 * 转售条目，只有「原厂 provider 里的同族模型」才算第一手证据。
 */
const FAMILY_VENDORS = [
  { re: /^deepseek/, vendors: ['deepseek'] },
  { re: /^(kimi|moonshot)/, vendors: ['moonshotai', 'moonshotai-cn', 'kimi-coding'] },
  { re: /^(glm|chatglm)/, vendors: ['zai', 'zai-coding-cn', 'zai-coding-plan', 'zhipuai', 'zhipuai-coding-plan'] },
  { re: /^qwen/, vendors: ['qwen-token-plan', 'qwen-token-plan-cn', 'qwen-token-plan-individual', 'qwen-token-plan-sgp', 'alibaba', 'alibaba-cn', 'alibaba-token-plan'] },
  { re: /^(gpt|chatgpt|o[1-9])/, vendors: ['openai'] },
  { re: /^claude/, vendors: ['anthropic'] },
  { re: /^gemini/, vendors: ['google', 'google-vertex'] },
  { re: /^(doubao|seed)/, vendors: ['volcengine', 'volcengine-coding-plan'] },
  { re: /^(hunyuan|hy[0-9])/, vendors: ['tencent', 'tencent-coding-plan', 'tencent-token-plan', 'tencent-tokenhub'] },
  { re: /^minimax/, vendors: ['minimax', 'minimax-cn'] },
  { re: /^step/, vendors: ['stepfun-ai'] },
  { re: /^grok/, vendors: ['xai'] },
  { re: /^mistral/, vendors: ['mistral'] },
  { re: /^llama/, vendors: ['meta', 'llama'] },
];

/** 云厂商托管（L2）：能力标注随云厂商自己的部署，通常可信度高于转售商。 */
const CLOUD_PROVIDERS = new Set([
  'digitalocean', 'ollama-cloud', 'qiniu-ai', 'github-copilot', 'opencode', 'opencode-go',
  'vercel-ai-gateway', 'cloudflare-workers-ai', 'cloudflare-ai-gateway',
  'together', 'fireworks', 'baseten', 'groq', 'cerebras', 'huggingface',
  'amazon-bedrock', 'azure-openai', 'azure-openai-responses', 'azure-cognitive-services',
  'nvidia', 'deepinfra', 'nebius', 'sambanova', 'targon', 'wandb', 'browserbase',
  'xiaomi', 'xiaomi-token-plan-cn', 'xiaomi-token-plan-sgp', 'xiaomi-token-plan-ams',
]);

/** 其余一律 L3（转售/聚合）：结论只作参考，不与 L1/L2 抢裁决权。 */
export function providerTier(providerKey, modelKey = '') {
  const provider = String(providerKey ?? '').toLowerCase();
  const key = String(modelKey ?? '');
  for (const family of FAMILY_VENDORS) {
    if (!family.re.test(key)) continue;
    if (family.vendors.includes(provider)) return 'L1';
  }
  if (CLOUD_PROVIDERS.has(provider)) return 'L2';
  return 'L3';
}

/** 归一化：小写 + 去掉一切非 [a-z0-9.]（`DeepSeek-V4.1-Flash` → `deepseekv4.1flash`）。 */
export function normalizeModelKey(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9.]/g, '');
}

/** 渠道前缀后的模型名：`workbuddy:cn:kimi-k3` → `kimi-k3`。 */
export function channelTail(id) {
  const parts = String(id ?? '').split(':');
  return parts[parts.length - 1] ?? '';
}

/**
 * 渠道/部署后缀。**只收明确是部署标记的词**，绝不收 instruct / thinking / code /
 * turbo / flash / pro / vision 这类会改变模型身份的 token —— 剥错会把
 * `kimi-k2-thinking` 借判成 `kimi-k2`，那是两个模型。
 */
const DEPLOYMENT_SUFFIXES = new Set([
  'official', 'exp', 'preview', 'beta', 'latest', 'sg', 'f', 'x', '1',
  'volc', 'lkeap', 'taiji',
]);

/**
 * 从尾部剥**一层**部署后缀：`hy4-preview-f` → `hy4-preview`，`kimi-k3-1` → `kimi-k3`，
 * `deepseek-v3-1-lkeap` → `deepseek-v3-1`。
 *
 * 为什么只剥一层：连剥会把 `hy4-preview-f` 一路剥到 `hy4` —— 那是另一代模型，借判就错了。
 * 一层不够时宁可落到「模糊命中」分支（同样标成待确认），也不赌。
 */
export function stripKnownSuffix(key, rounds = 1) {
  let current = String(key ?? '');
  for (let i = 0; i < rounds; i += 1) {
    const cut = current.lastIndexOf('-');
    if (cut <= 0) break;
    const tail = current.slice(cut + 1);
    // 大小写无关：网关的 id 是混合大小写（`DeepSeek-V4-Flash-Official`）
    if (!DEPLOYMENT_SUFFIXES.has(tail.toLowerCase())) break;
    current = current.slice(0, cut);
  }
  return current;
}

/**
 * 渠道档位别名：这些是网关自己的路由档位名（auto / fast-model / …），任何公开目录
 * 都不会有；更要紧的是它们会**假匹配** —— 实测 `workbuddy:cn:auto` 会撞上
 * models.dev 里 morph 的 `auto`，纯属巧合。故直接排除出目录匹配。
 */
const GENERIC_ALIASES = new Set([
  'auto', 'default', 'default-model', 'model', 'summary',
  'fast-model', 'balanced-model', 'deep-model', 'primary-model',
  'default-1.1', 'default-1.2', 'default-1.3',
]);

export function isGenericAlias(key) {
  return GENERIC_ALIASES.has(String(key ?? ''));
}

/** 前缀相似度（0~1）：只在精确/剥后缀都落空时用来「借判」，阈值默认 0.85。 */
export function prefixSimilarity(a, b) {
  const left = String(a ?? '');
  const right = String(b ?? '');
  if (left === '' || right === '') return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) {
    return Math.min(left.length, right.length) / Math.max(left.length, right.length);
  }
  let same = 0;
  const shortest = Math.min(left.length, right.length);
  for (let i = 0; i < shortest; i += 1) {
    if (left[i] === right[i]) same += 1;
  }
  return same / Math.max(left.length, right.length);
}

// ---------------------------------------------------------------------------
// 目录源 → 扁平索引
// ---------------------------------------------------------------------------

function entryFrom({ source, provider, id, input, ctx, out }) {
  const modalities = Array.isArray(input) ? input.map((m) => String(m).toLowerCase()) : [];
  const key = normalizeModelKey(id);
  if (key === '') return null;
  return {
    key,
    id: String(id),
    source,
    provider: String(provider ?? ''),
    image: modalities.includes('image'),
    modalities,
    ctx: Number.isFinite(ctx) ? ctx : undefined,
    out: Number.isFinite(out) ? out : undefined,
    tier: providerTier(provider, key),
  };
}

/** models.dev `api.json` → 条目数组。 */
export function indexFromModelsDev(payload) {
  const out = [];
  for (const [providerKey, provider] of Object.entries(payload ?? {})) {
    const models = provider?.models;
    if (!models || typeof models !== 'object') continue;
    for (const [modelId, model] of Object.entries(models)) {
      const entry = entryFrom({
        source: CATALOG_SOURCES.modelsDev,
        provider: providerKey,
        id: model?.id ?? modelId,
        input: model?.modalities?.input,
        ctx: model?.limit?.context,
        out: model?.limit?.output,
      });
      if (entry) out.push(entry);
    }
  }
  return out;
}

/** OpenRouter `/api/v1/models` → 条目数组（id 形如 `vendor/model`）。 */
export function indexFromOpenRouter(payload) {
  const out = [];
  const list = Array.isArray(payload?.data) ? payload.data : [];
  for (const model of list) {
    const id = typeof model?.id === 'string' ? model.id : '';
    if (id === '') continue;
    const slash = id.indexOf('/');
    const entry = entryFrom({
      source: CATALOG_SOURCES.openRouter,
      provider: slash === -1 ? '' : id.slice(0, slash),
      id: slash === -1 ? id : id.slice(slash + 1),
      input: model?.architecture?.input_modalities,
      ctx: model?.limit?.context_length,
      out: model?.limit?.max_completion_tokens,
    });
    if (entry) out.push(entry);
  }
  return out;
}

/**
 * pi-ai 自带目录（`dist/providers/data/<provider>.json`）→ 条目数组。
 * 文件形态：`{ "<api>": { "<modelId>": { id, name, input, contextWindow, maxTokens } } }`。
 * @param files - `{ [providerKey]: parsedJson }`。
 */
export function indexFromPiAiFiles(files) {
  const out = [];
  for (const [providerKey, doc] of Object.entries(files ?? {})) {
    if (!doc || typeof doc !== 'object') continue;
    for (const group of Object.values(doc)) {
      if (!group || typeof group !== 'object' || Array.isArray(group)) continue;
      for (const [modelId, model] of Object.entries(group)) {
        if (!model || typeof model !== 'object') continue;
        const entry = entryFrom({
          source: CATALOG_SOURCES.piAi,
          provider: providerKey,
          id: model.id ?? modelId,
          input: model.input,
          ctx: model.contextWindow,
          out: model.maxTokens,
        });
        if (entry) out.push(entry);
      }
    }
  }
  return out;
}

/** 条目数组 → `Map<归一化名, 条目[]>`（同源同 provider 同 id 去重）。 */
export function buildCatalogIndex(entryLists) {
  const index = new Map();
  const seen = new Set();
  for (const list of Array.isArray(entryLists) ? entryLists : [entryLists]) {
    for (const entry of list ?? []) {
      if (!entry || typeof entry.key !== 'string' || entry.key === '') continue;
      const fingerprint = `${entry.source}|${entry.provider}|${entry.id}`;
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      const bucket = index.get(entry.key);
      if (bucket) bucket.push(entry);
      else index.set(entry.key, [entry]);
    }
  }
  return index;
}

/** 索引摘要（UI 显示「目录快照：N 个模型 / 三源可用性」）。 */
export function catalogSummary(index) {
  const bySource = {};
  const byTier = {};
  for (const entries of index.values()) {
    for (const entry of entries) {
      bySource[entry.source] = (bySource[entry.source] ?? 0) + 1;
      byTier[entry.tier] = (byTier[entry.tier] ?? 0) + 1;
    }
  }
  return { keys: index.size, entries: [...index.values()].reduce((n, list) => n + list.length, 0), bySource, byTier };
}

/** 索引 → 可落盘的纯 JSON（缓存文件用）。 */
export function serializeCatalogIndex(index) {
  const out = {};
  for (const [key, entries] of index) {
    out[key] = entries.map((e) => ({
      id: e.id, s: e.source, p: e.provider, img: e.image, t: e.tier,
      ...e.ctx === undefined ? {} : { ctx: e.ctx },
      ...e.out === undefined ? {} : { out: e.out },
    }));
  }
  return out;
}

/** 缓存文件里的纯 JSON → 索引。 */
export function deserializeCatalogIndex(raw) {
  const index = new Map();
  for (const [key, entries] of Object.entries(raw ?? {})) {
    if (!Array.isArray(entries)) continue;
    index.set(key, entries.map((e) => ({
      key,
      id: String(e?.id ?? key),
      source: String(e?.s ?? ''),
      provider: String(e?.p ?? ''),
      image: e?.img === true,
      modalities: e?.img === true ? ['text', 'image'] : ['text'],
      tier: String(e?.t ?? 'L3'),
      ctx: Number.isFinite(e?.ctx) ? e.ctx : undefined,
      out: Number.isFinite(e?.out) ? e.out : undefined,
    })));
  }
  return index;
}

// ---------------------------------------------------------------------------
// 判定
// ---------------------------------------------------------------------------

/**
 * 同级源内加权裁决：L1（原厂）先裁，没有 L1 再看 L2（云托管），最后 L3（转售）。
 * 为什么不是「有分歧就算冲突」：实测 models.dev 内部就有 121 个模型名在转售商之间
 * 打架（glm-5.3-flash 25 条里 3 条说纯文本），一律判冲突等于把噪声当结论。按等级
 * 取第一手证据，同级平票才叫冲突。
 * @returns `{verdict, tier, image, text, entries, dissent}` 或 null（无条目）。
 */
export function decideByTier(entries) {
  for (const tier of ['L1', 'L2', 'L3']) {
    const group = entries.filter((e) => e.tier === tier);
    if (group.length === 0) continue;
    const image = group.filter((e) => e.image === true).length;
    const text = group.length - image;
    if (image === text) return { verdict: 'conflict', tier, image, text, entries: group.length, dissent: text };
    return {
      verdict: image > text ? 'image' : 'text',
      tier,
      image,
      text,
      entries: group.length,
      dissent: Math.min(image, text),
    };
  }
  return null;
}

function finish(base, entries, { status, matchedKey, how, reason }) {
  const decision = decideByTier(entries);
  const sources = entries
    .map((e) => ({ source: e.source, provider: e.provider, id: e.id, image: e.image, tier: e.tier }))
    .sort((a, b) => (a.tier < b.tier ? -1 : a.tier > b.tier ? 1 : 0));
  if (!decision) {
    return { ...base, status: VERDICT_STATUS.missing, verdict: 'unknown', tier: null, sources, matchedKey, how, reason: '目录无收录（需探针或人工确认）' };
  }
  const conflicted = decision.verdict === 'conflict';
  return {
    ...base,
    status: conflicted ? VERDICT_STATUS.conflict : status,
    verdict: conflicted ? 'unknown' : decision.verdict,
    tier: decision.tier,
    tally: { image: decision.image, text: decision.text, entries: decision.entries, dissent: decision.dissent },
    sources,
    matchedKey,
    how,
    reason: conflicted
      ? `${TIER_LABEL[decision.tier] ?? decision.tier}级源内平票（图 ${decision.image} / 文 ${decision.text}）`
      : reason,
  };
}

/**
 * 判定单个模型。
 * @param id - 网关模型 id（如 `workbuddy:cn:kimi-k3`）。
 * @param index - {@link buildCatalogIndex} 的输出。
 * @param opts - `{ whitelist?: Set<string>, fuzzyThreshold?: number }`。
 * @returns 判定对象：`{id, tail, status, verdict, tier, sources, matchedKey, how, reason, whitelist}`。
 */
export function classifyModel(id, index, { whitelist = null, fuzzyThreshold = 0.85 } = {}) {
  const tail = channelTail(id);
  const key = normalizeModelKey(tail);
  const base = {
    id: String(id),
    tail,
    whitelist: whitelist === null ? null : whitelist.has(String(id)),
  };
  if (key === '') {
    return { ...base, status: VERDICT_STATUS.missing, verdict: 'unknown', tier: null, sources: [], matchedKey: null, how: '', reason: 'id 为空' };
  }
  if (isGenericAlias(key)) {
    return {
      ...base,
      status: VERDICT_STATUS.alias,
      verdict: 'unknown',
      tier: null,
      sources: [],
      matchedKey: null,
      how: '',
      reason: '渠道档位别名（通用名会假匹配，不参与目录比对）',
    };
  }
  const exact = index.get(key);
  if (exact && exact.length > 0) {
    return finish(base, exact, { status: VERDICT_STATUS.confirmed, matchedKey: key, how: '精确', reason: '目录精确命中' });
  }
  // 注意：剥后缀必须作用在**原始 tail** 上（归一化会把 `-` 全删掉，之后再剥就没词可剥了）。
  const stripped = normalizeModelKey(stripKnownSuffix(tail));
  if (stripped !== key && stripped !== '') {
    const hit = index.get(stripped);
    if (hit && hit.length > 0) {
      return finish(base, hit, { status: VERDICT_STATUS.borrowed, matchedKey: stripped, how: `剥后缀→${stripped}`, reason: '剥掉部署后缀后命中，结论借自同名部署（待确认）' });
    }
  }
  let bestKey = null;
  let bestScore = 0;
  for (const candidate of index.keys()) {
    const score = prefixSimilarity(key, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestKey = candidate;
    }
  }
  if (bestKey !== null && bestScore >= fuzzyThreshold) {
    return finish(base, index.get(bestKey), {
      status: VERDICT_STATUS.borrowed,
      matchedKey: bestKey,
      how: `模糊 ${bestScore.toFixed(2)}→${bestKey}`,
      reason: `模糊命中 ${bestKey}（相似度 ${bestScore.toFixed(2)}），结论是借判，待确认`,
    });
  }
  return { ...base, status: VERDICT_STATUS.missing, verdict: 'unknown', tier: null, sources: [], matchedKey: null, how: '', reason: '目录无收录（需探针或人工确认）' };
}

/**
 * 批量判定 + 汇总。
 *
 * 两类「与本地白名单的差异」分开报，别混成一个数：
 *   - disagreements：白名单说**视觉**、目录说**纯文本** —— 白名单可能标错了，要人看；
 *   - gaps：目录说**视觉**、白名单没收录 —— 是缺口（可补），不是冲突。
 * 目录说文本且白名单也没有的，是两边一致，不算差异。
 * @returns `{verdicts, summary}`。
 */
export function classifyAll(models, index, { whitelist = null, fuzzyThreshold = 0.85 } = {}) {
  const verdicts = (Array.isArray(models) ? models : []).map((m) => classifyModel(
    typeof m === 'string' ? m : m?.id,
    index,
    { whitelist, fuzzyThreshold },
  ));
  const counts = { image: 0, text: 0, unknown: 0, confirmed: 0, borrowed: 0, conflict: 0, alias: 0, missing: 0 };
  const disagreements = [];
  const gaps = [];
  for (const v of verdicts) {
    counts[v.verdict] = (counts[v.verdict] ?? 0) + 1;
    counts[v.status] = (counts[v.status] ?? 0) + 1;
    if (v.whitelist === true && v.verdict === 'text') disagreements.push({ id: v.id, kind: 'whitelist-image-catalog-text' });
    if (v.whitelist === false && v.verdict === 'image') gaps.push({ id: v.id, kind: 'catalog-image-not-in-whitelist' });
  }
  return { verdicts, summary: { total: verdicts.length, counts, disagreements, gaps } };
}

// ---------------------------------------------------------------------------
// 目录缓存（拉取时零网络：读缓存；只有显式刷新才联网）
// ---------------------------------------------------------------------------

/** 缓存文件路径：`~/.dsh/dsh-chanhub/model-catalog.json`。 */
export function catalogCachePath(home = homedir()) {
  return join(home, '.dsh', 'dsh-chanhub', 'model-catalog.json');
}

/** 读缓存；不存在 / 版本不符 / 解析失败都返回 null（调用方降级到「无目录」）。 */
export async function readCatalogCache(path = catalogCachePath()) {
  try {
    const text = await readFile(path, 'utf8');
    const parsed = JSON.parse(text);
    if (!parsed || parsed.version !== CATALOG_CACHE_VERSION) return null;
    return {
      version: parsed.version,
      at: Number.isFinite(parsed.at) ? parsed.at : 0,
      sources: parsed.sources && typeof parsed.sources === 'object' ? parsed.sources : {},
      index: deserializeCatalogIndex(parsed.index),
    };
  } catch {
    return null;
  }
}

/** 原子写缓存（tmp + rename，0600）。 */
export async function writeCatalogCache(path, { at, sources, index }) {
  await mkdir(join(path, '..'), { recursive: true });
  const payload = {
    version: CATALOG_CACHE_VERSION,
    at,
    sources,
    index: serializeCatalogIndex(index),
  };
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(payload), { encoding: 'utf8', mode: 0o600 });
  await rename(tmp, path);
  return payload;
}

/** 抓一个在线目录源（仅显式刷新时调用）。 */
export async function fetchCatalogSource(source, { fetchImpl = globalThis.fetch, timeoutMs = 30000, signal } = {}) {
  const url = CATALOG_URLS[source];
  if (!url) throw new Error(`未知目录源：${source}`);
  if (typeof fetchImpl !== 'function') throw new Error('当前运行时没有 fetch，无法刷新目录');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener?.('abort', onAbort, { once: true });
  try {
    const response = await fetchImpl(url, { signal: controller.signal, headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`${source} 返回 HTTP ${response.status}`);
    const payload = await response.json();
    const entries = source === CATALOG_SOURCES.openRouter
      ? indexFromOpenRouter(payload)
      : indexFromModelsDev(payload);
    return { source, at: Date.now(), entries };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', onAbort);
  }
}

/**
 * pi-ai 自带目录的数据目录候选（离线源，随 DSH 升级自动更新）。
 * 解析失败不报错：拿不到就少一个源，UI 里如实显示。
 */
export function piAiDataDirCandidates({ requireResolve, home = homedir(), env = process.env } = {}) {
  const dirs = [];
  if (typeof requireResolve === 'function') {
    try {
      const pkg = requireResolve('@earendil-works/pi-ai/package.json');
      if (typeof pkg === 'string') dirs.push(join(pkg, '..', 'dist', 'providers', 'data'));
    } catch {
      // 解析不到就继续试固定路径
    }
  }
  const dshHome = env.DSH_HOME || join(home, '.dsh');
  dirs.push(join(dshHome, 'profiles', 'node_modules', '@earendil-works', 'pi-ai', 'dist', 'providers', 'data'));
  dirs.push('/usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@earendil-works/pi-ai/dist/providers/data');
  return dirs;
}

/** 读 pi-ai 自带目录（第一个存在的候选目录），失败返回 null。 */
export async function loadPiAiCatalog({ dirs } = {}) {
  const candidates = Array.isArray(dirs) && dirs.length > 0 ? dirs : piAiDataDirCandidates({});
  for (const dir of candidates) {
    let names;
    try {
      names = await readdir(dir);
    } catch {
      continue;
    }
    const files = {};
    for (const name of names) {
      if (!name.endsWith('.json')) continue;
      try {
        files[name.replace(/\.json$/, '')] = JSON.parse(await readFile(join(dir, name), 'utf8'));
      } catch {
        // 单个文件坏掉不影响其它 provider
      }
    }
    if (Object.keys(files).length === 0) continue;
    return { dir, entries: indexFromPiAiFiles(files) };
  }
  return null;
}

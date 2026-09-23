// dsh-chanhub —— 宿主侧插件入口（Node / Host 运行时）
//
// 职责：
//   1. 声明 loader 元信息（name / inject）；
//   2. 在自身 webServer 作用域注册 namespaced RPC 通道，承接浏览器面板
//      （client/client.js）经 ctx.connection.rpc.call(CHANNEL, endpoint, payload) 发来的请求；
//   3. 作为 chanhub 网关的唯一出口：API key 只在宿主持有，浏览器 bundle 里没有 key。
//
// 设计风格对齐 dsh-bridge-gateway：
//   - 单一 cordis row（见 cordis.patch.yml）；
//   - RPC 通道名集中常量管理，客户端与宿主共享同一 CHANNEL；
//   - 浏览器面板由打包后的 client/client.js 经 ctx.slots.inject('settings.section', …) 注册，
//     宿主此文件只负责后端 RPC 面，不引入任何浏览器依赖。
//
// 关于 webServer 路由（本版的关键修复）：
//   WebServer 的 handler 契约是「owns the full response lifecycle」——
//   它 await handler(req, res) 之后**完全丢弃返回值**，也从不读 res.headers。
//   所以往返回 Response 是无效的：必须把 status/headers/body 写回 res。
//   适配逻辑收在 lib/rpc-channel.js 的 serveChannelRequest。

import {
  PROBE_VERDICT,
  probeModelVisionBatch,
  probeVerdictsForCommit,
} from './model-probe.js';
import { basename, delimiter, dirname, isAbsolute, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { ChanhubClient, ChanhubError, DEFAULT_BASE_URL, normalizeBaseUrl } from './chanhub-client.js';
import { readGatewayConfig, writeGatewayConfig, resolveConfigPathCandidates } from './gateway-config.js';
import { readAuthAccounts } from './auths.js';
import { coercePatchTypes } from './config-spec.js';
import { serveChannelRequest } from './rpc-channel.js';
import {
  buildCompletionPatch,
  buildModelsPatch,
  catalogFromSnapshot,
  diffModelSnapshots,
  listFromGatewayBody,
  modelsFromCatalog,
  parseSnapshot,
  providerModelsPath,
  snapshotFromCatalog,
  capabilityVisionSet,
  isVisionModel,
  mergeCapabilities,
  parseCapabilities,
  serializeCapabilities,
  PI_NS,
  VISION_MODEL_WHITELIST,
} from './model-patch.js';
import {
  CATALOG_SOURCES,
  buildCatalogIndex,
  catalogCachePath,
  catalogSummary,
  classifyAll,
  fetchCatalogSource,
  loadPiAiCatalog,
  readCatalogCache,
  writeCatalogCache,
} from './model-catalog.js';

export const name = 'dsh-chanhub';
// 宿主注入：connection 提供 RPC 认证（requestRejection），webServer 用于挂载 HTTP 路由。
// settings / credentials 是可选依赖，用 ctx.get() 读取，缺失时降级到 env（不硬失败）。
export const inject = ['connection'];

// RPC 通道名（与 client/index.js 中常量保持一致）
export const CHANNEL = '/dsh-chanhub';

// 设置命名空间（与 dsh-plugin.naming.json 的 settingsNamespaces 一致）
export const SETTINGS_NAMESPACE = 'dsh-chanhub';

// 当前面板可调用的端点（与 client/index.js 的 ENDPOINTS 保持一致）
export const ENDPOINTS = {
  getStatus: 'getStatus',
  refreshStatus: 'refreshStatus',
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
  taskScan: 'taskScan',
  taskQueueStart: 'taskQueueStart',
  taskQueueStatus: 'taskQueueStatus',
  schoolStatusAll: 'schoolStatusAll',
  schoolVouchersAll: 'schoolVouchersAll',
  accountMore: 'accountMore',
  accountDisable: 'accountDisable',
  accountEnable: 'accountEnable',
  accountRevive: 'accountRevive',
  // 添加账号（OAuth 设备授权两段式：start 拿授权 URL → poll 轮询结果）。
  // getChannels 单独成端点：面板要据此决定「添加账号」按钮列哪些渠道——
  // 旧网关没有 workbuddy 登录分支，按钮必须按网关实际能力渲染而不是按插件假设。
  loginStart: 'loginStart',
  loginPoll: 'loginPoll',
  loginCallback: 'loginCallback',
  getChannels: 'getChannels',
  serviceControl: 'serviceControl',
  revealApiKey: 'revealApiKey',
  // 「一键模型能力打补丁」：拉全字段模型目录 + 给 DSH llm-pi-ai 配置补 input 视觉能力。
  discoverModelsForPatch: 'discoverModelsForPatch',
  applyModelsPatch: 'applyModelsPatch',
  // 拉取记录（快照）与「以网关为准覆盖 DSH 模型配置」的备份/回滚/清记录。
  getModelRecord: 'getModelRecord',
  rollbackModelsSync: 'rollbackModelsSync',
  clearModelRecord: 'clearModelRecord',
  getModelCatalog: 'getModelCatalog',
  refreshModelCatalog: 'refreshModelCatalog',
  commitModelCapabilities: 'commitModelCapabilities',
  completeModelFields: 'completeModelFields',
  probeModelVision: 'probeModelVision',
};

function ok(value) {
  return { ok: true, value };
}

/**
 * 构造一个失败信封。
 *
 * **`details` 必须永远是纯对象**：宿主的 wire 解码器
 * （`@deepseek-ai/dsh-client-connection` 的 `parseConnectionResponse`）要求
 * 失败信封满足 `isRecord(error.details)`，否则抛
 * `TypeError("connection: invalid server-response failure")` —— 该异常会被
 * 浏览器原样冒泡成面板报错，于是**任何一个**失败分支都能让整块面板打不开，
 * 即使网关、密钥、渲染都正常。原来这里是 `details === undefined ? {} : …`，
 * 把可选的 details 整个省掉，正好踩中这条。
 *
 * 配方对齐 dsh-bridge-gateway 的 bridge-rpc.js：details 里保底带
 * `{ issues: [{ message }] }`，额外字段合并进去。`issues` 也是宿主既有约定
 * （RPC 层用它承载校验问题列表），缺失时补空数组即可。
 *
 * @param code - 稳定错误码。
 * @param message - 面向用户的说明。
 * @param details - 可选附加信息（非纯对象时忽略，避免把 details 写成数组/字符串）。
 * @returns `{ok:false,error}`。
 */
function fail(code, message, details = undefined) {
  const extra = details !== null && typeof details === 'object' && !Array.isArray(details) ? details : {};
  return { ok: false, error: { code, message, details: { issues: [], ...extra } } };
}

/**
 * 把任意异常映射成失败信封（保留 ChanhubError 的稳定错误码）。
 * @param error - 抛出的异常。
 * @returns `{ok:false,error}`。
 */
function failFromError(error) {
  if (error instanceof ChanhubError) return fail(error.code, error.message, error.details);
  return fail('internal', String(error?.message ?? error));
}

/**
 * 读 DSH 指定 provider 当前的 models 数组（pi-ai 命名空间 providers.<p>.models）。
 * settings 服务不可用 / 无该 provider / 该 provider 无 models → 返回 undefined，
 * 由上层走「整段写入」而不是「合并覆盖空数组」。
 * @param settingsService - DSH settings 服务（createRuntime 暴露的原始 provider）。
 * @param provider - pi-ai provider 名（如 chanhub2api）。
 * @returns {Array<object>|undefined}
 */
function readConfigModels(settingsService, provider) {
  if (!settingsService || typeof settingsService.get !== 'function') return undefined;
  const section = settingsService.get(PI_NS);
  if (!section || typeof section !== 'object') return undefined;
  const providerNs = section.providers?.[provider];
  if (!providerNs || typeof providerNs !== 'object') return undefined;
  return Array.isArray(providerNs.models) ? providerNs.models : undefined;
}

/**
 * 装载「模型能力目录」索引：本地 pi-ai 目录（离线，随 DSH 升级）+ 缓存里的在线源。
 *
 * **拉取时零网络**是本设计的硬约束：在线源（models.dev / OpenRouter）只在用户显式点
 * 「刷新目录」时抓取并落盘到 `~/.dsh/dsh-chanhub/model-catalog.json`，平时只读缓存。
 *
 * @param opts - `{ logger, cacheFile, piAiDirs }`（后两者便于测试指定临时路径）。
 * @returns `{index, at, sources, warnings}`；任何一份缺失都只记 warning，不抛。
 */
async function loadCatalogIndex({ logger, cacheFile, piAiDirs } = {}) {
  const warnings = [];
  const sources = {};
  const entryLists = [];

  const piAi = await loadPiAiCatalog(Array.isArray(piAiDirs) ? { dirs: piAiDirs } : {});
  if (piAi) {
    entryLists.push(piAi.entries);
    sources[CATALOG_SOURCES.piAi] = { at: 0, entries: piAi.entries.length, dir: piAi.dir, cached: false };
  } else {
    warnings.push('没找到 DSH 自带的 pi-ai 目录（离线源不可用，只剩在线源）');
  }

  const cache = await readCatalogCache(cacheFile ?? catalogCachePath());
  let at = 0;
  if (cache) {
    entryLists.push([...cache.index.values()].flat());
    at = cache.at;
    for (const [source, meta] of Object.entries(cache.sources)) {
      sources[source] = { ...meta, cached: true };
    }
  } else {
    warnings.push('还没有在线目录缓存 —— 点「刷新目录」拉一次 models.dev / OpenRouter');
  }

  const index = buildCatalogIndex(entryLists);
  logger?.debug?.(`[dsh-chanhub] 能力目录：${index.size} 个模型名 / ${sources ? Object.keys(sources).length : 0} 个源`);
  return { index, at, sources, warnings };
}

/**
 * 配置里每个条目「缺哪些我们管的字段」——面板据此标「未写入」。
 * 为什么需要：表格里的「上文/输出」来自网关（1M），而 DSH 实际读的是配置条目；
 * 配置里没写就回落到 DEFAULT_CONTEXT_WINDOW=262144，用户看到的就是「怎么才 256K」。
 * @param models - DSH 配置里的 models 数组（可缺省）。
 * @returns `{ [id]: string[] }`；没缺口的条目不出现在结果里。
 */
function configuredFieldGaps(models) {
  const gaps = {};
  for (const m of Array.isArray(models) ? models : []) {
    if (!m || typeof m.id !== 'string' || m.id === '') continue;
    const missing = [];
    if (!Number.isFinite(m.contextWindow)) missing.push('contextWindow');
    if (!Number.isFinite(m.maxTokens)) missing.push('maxTokens');
    if (m.reasoningEfforts === undefined) missing.push('reasoningEfforts');
    if (!Array.isArray(m.input) || !m.input.includes('image')) missing.push('input');
    if (missing.length > 0) gaps[m.id] = missing;
  }
  return gaps;
}

/**
 * 决定拿哪些模型去比对：优先用面板传来的当前目录，其次退回拉取快照。
 * @returns 模型数组（元素至少带 `id`）。
 */
function collectVerdictModels(payload, readSettings) {
  const given = payload?.models;
  if (Array.isArray(given) && given.length > 0) return given;
  const snapshot = parseSnapshot(readSettings?.()?.modelPullSnapshot ?? '');
  return snapshot ? catalogFromSnapshot(snapshot) : [];
}

/**
 * 「目录比对」报告体：索引 + 三态判定 + 汇总。只读，不写任何配置。
 * @returns 端点返回值。
 */
async function buildCatalogReport(payload, { readSettings, logger, cacheFile, piAiDirs, extra = {} } = {}) {
  const provider = typeof payload?.provider === 'string' && payload.provider !== ''
    ? payload.provider
    : 'chanhub2api';
  const { index, at, sources, warnings } = await loadCatalogIndex({ logger, cacheFile, piAiDirs });
  const models = collectVerdictModels(payload, readSettings);
  const baseline = parseCapabilities(readSettings?.()?.modelCapabilities ?? '');
  // 比对的「本地认定集合」= 白名单 ∪ 基线（沉淀过的确认项）：这样沉淀完，
  // 「白名单可补」的缺口会自动消失，而不是让用户再手工抄一遍。
  const effectiveVision = effectiveVisionSet(baseline);
  const { verdicts, summary } = classifyAll(models, index, { whitelist: effectiveVision });
  const baselined = verdicts.filter((v) => v.status === 'confirmed'
    && baseline?.entries?.[v.id]?.image === (v.verdict === 'image')).length;
  const pending = verdicts.filter((v) => v.status === 'confirmed'
    && baseline?.entries?.[v.id]?.image !== (v.verdict === 'image')).length;
  return {
    provider,
    at,
    sources,
    warnings,
    catalog: catalogSummary(index),
    verdicts,
    summary,
    baseline: {
      at: baseline?.at ?? 0,
      count: baseline ? Object.keys(baseline.entries).length : 0,
      baselined,
      pending,
    },
    // 基线明细：面板据此在每行标「实测 / 已沉淀」，也让「实测」与「目录」结论可对照
    capabilities: baseline?.entries ?? {},
    readonly: true,
    ...extra,
  };
}

/**
 * 有效视觉集合 = 人工白名单 ∪ 基线里 image=true 的条目。
 * @param baseline - parseCapabilities 的结果（或 settings 字符串）。
 * @returns `Set<string>`。
 */
function effectiveVisionSet(baseline) {
  const set = new Set(VISION_MODEL_WHITELIST);
  for (const id of capabilityVisionSet(baseline)) set.add(id);
  return set;
}

/**
 * 从环境变量读一个值（值本身绝不进日志）。
 * @param key - 环境变量名。
 * @returns 值或空串。
 */
function envValue(key) {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
}

// apiKeyEnv → 已解析的密钥值。credentials 面是异步的，用一个进程内缓存把它桥接成同步读。
const credentialCache = new Map();

/**
 * 读缓存里的密钥值（未预热则空串）。
 * @param service - credentials 服务（可能 undefined）。
 * @param refName - 环境变量名形式的引用。
 * @returns 值或空串。
 */
function cachedCredential(service, refName) {
  if (!service) return '';
  const entry = credentialCache.get(refName);
  return typeof entry?.value === 'string' ? entry.value : '';
}

/**
 * 插件设置 schema（settings 命名空间 `dsh-chanhub`）。
 *
 * 宿主 settings 服务对注册的 schema 同时要求两件事：
 *   1. 可调用：`schema(input)` 把「schemastery 默认值 + base + 用户段」解出最终值
 *      （见服务端 `resolve()`）；
 *   2. 可序列化：`schema.toJSON()` 必须存在，返回 schemastery 形态的 `{uid, refs}`，
 *      宿主在构建「提供方目录 / 设置」表面时会对**每个**已注册命名空间调用它。
 *
 * 之前这里只给了一个普通函数（缺 `toJSON`），宿主遍历所有注册时在第一个未提供方处
 * 抛 “registration.schema.toJSON is not a function”，把**整个提供方目录（模型列表）**
 * 顶挂掉。这里在函数上补一个由 SETTINGS_DEFAULTS 派生的对象 schema JSON——
 * 既不引入 schemastery 依赖，又满足契约（可调用 + 可序列化）。
 */
export const SETTINGS_DEFAULTS = {
  baseURL: DEFAULT_BASE_URL,
  apiKeyEnv: 'WB2API_API_KEY',
  apiKey: '',
  gatewayConfigPath: '',
  restartCommand: '',
  allowServiceControl: false,
  // 侧边栏左下角入口开关（客户端读它决定 footer 按钮是否渲染；配置 Tab 的
  // 「界面」组就是它的编辑面）。boolean → settingsSchema.toJSON() 自动派生成布尔字段。
  sidebarEntry: true,
  // 「模型能力」Tab 的拉取记录：全量快照 JSON 字符串（每次拉取整体 set = 覆盖，不做合并）。
  // 用字符串是因为本插件的 settings schema 只派生 boolean|string 字段（见 toJSON）。
  modelPullSnapshot: '',
  // 「以网关为准覆盖 DSH 模型配置」前的自动备份（同样 JSON 字符串），供回滚。
  modelSyncBackup: '',
  // 能力基线（沉淀）：目录比对**确认态**结论的落盘副本，JSON 字符串
  // （{at, entries:{id:{image,status,tier,how,at}}}）。与 modelPullSnapshot /
  // modelSyncBackup 构成三件套：快照=看到了什么，备份=改前是什么，基线=认定是什么。
  // 基线里的 image=true 会让该模型具备视觉能力（不必再手工扩白名单）。
  modelCapabilities: '',
};

/** settings 服务要求的 schema 形态（`schema(input) => value`）。 */
export function settingsSchema(input) {
  return { ...SETTINGS_DEFAULTS, ...(input && typeof input === 'object' ? input : {}) };
}

/**
 * schemastery 形态的 schema 序列化（`{uid, refs}`，refs: uid → 节点）。
 *
 * 宿主在构建提供方目录时会对每个注册命名空间调用 `schema.toJSON()`，
 * 缺失即抛 “toJSON is not a function”。这里按 SETTINGS_DEFAULTS 生成一个
 * 等价的对象 schema：object 节点用 `dict` 指向各字段节点，字段节点给出
 * `type` 与 `meta.default`，与真实 schemastery 输出结构一致（便于宿主渲染设置表单）。
 * `apiKey` 标记 `role: 'secret'`，宿主可据此在值上做密文脱敏。
 */
settingsSchema.toJSON = function settingsSchemaToJSON() {
  const refs = {};
  let uid = 0;
  const alloc = () => String(++uid);
  const field = (type, def, meta = {}) => {
    const id = alloc();
    refs[id] = { type, meta: { default: def, ...meta } };
    return id;
  };
  const dict = {};
  for (const [key, def] of Object.entries(SETTINGS_DEFAULTS)) {
    const type = typeof def === 'boolean' ? 'boolean' : 'string';
    const meta = key === 'apiKey' ? { role: 'secret' } : {};
    dict[key] = field(type, def, meta);
  }
  const root = alloc();
  refs[root] = { type: 'object', meta: { default: {} }, dict };
  return { uid: Number(root), refs };
};

/**
 * 组装运行时依赖：settings 命名空间 + credentials + config.json 路径解析。
 *
 * 三层优先级，逐层降级（任何一层缺失都不报错，只是少一份证据）：
 *   apiKey:   凭证引用（apiKeyEnv）→ settings.apiKey → 同名环境变量
 *   baseURL:  settings.baseURL → DSH_CHANHUB_BASE_URL → 默认 127.0.0.1:7866
 *
 * @param ctx - 插件上下文。
 * @returns `{client, readSettings, settingsScope, resolveConfig, warnings, logger, credentialsService}`。
 */
export function createRuntime(ctx) {
  const warnings = [];
  const logger = ctx?.logger?.('dsh-chanhub') ?? ctx?.logger;

  // ---- settings 命名空间（可选）----
  let settingsScope;
  const settingsService = typeof ctx?.get === 'function' ? ctx.get('settings') : undefined;
  if (settingsService && typeof settingsService.register === 'function') {
    try {
      settingsScope = settingsService.register(SETTINGS_NAMESPACE, settingsSchema, {
        base: { ...SETTINGS_DEFAULTS },
      });
    } catch (error) {
      warnings.push(`settings 命名空间注册失败，已降级为 env：${error?.message ?? error}`);
    }
  } else {
    warnings.push('settings 服务不可用 —— 配置改由 env 提供（WB2API_API_KEY / DSH_CHANHUB_BASE_URL）');
  }

  const readSettings = () => {
    const value = typeof settingsScope?.get === 'function' ? settingsScope.get() : undefined;
    return value && typeof value === 'object' ? value : {};
  };

  // ---- credentials（可选，仅用于把 apiKeyEnv 解析成实际密钥）----
  const credentialsService = typeof ctx?.get === 'function' ? ctx.get('credentials') : undefined;

  const resolveConfig = () => {
    const settings = readSettings();
    const apiKeyEnv = settings.apiKeyEnv || 'WB2API_API_KEY';
    const baseURL = normalizeBaseUrl(
      settings.baseURL || envValue('DSH_CHANHUB_BASE_URL') || DEFAULT_BASE_URL,
    );
    // 同步读：先用预热的凭证缓存，再退到环境变量，最后才是 settings 里的明文字段。
    const apiKey =
      cachedCredential(credentialsService, apiKeyEnv) || envValue(apiKeyEnv) || settings.apiKey || '';
    return {
      baseURL,
      apiKey,
      apiKeyEnv,
      gatewayConfigPath: settings.gatewayConfigPath || '',
    };
  };

  const client = new ChanhubClient({ resolveConfig, logger });

  // settings 服务的原始 provider（非 chanhub 自己的 scope）：需要它对任意已注册
  // 命名空间（如 llm-pi-ai）做 get/update/mutate —— 「一键给 DSH 模型配置打补丁」。
  const settingsServiceRaw =
    settingsService && typeof settingsService.get === 'function' ? settingsService : undefined;

  return {
    client,
    readSettings,
    settingsScope,
    settingsService: settingsServiceRaw,
    resolveConfig,
    warnings,
    logger,
    credentialsService,
    // 能力目录缓存：默认 ~/.dsh/dsh-chanhub/model-catalog.json，可用 env 改到别处。
    catalogCacheFile: envValue('DSH_CHANHUB_CATALOG_CACHE') || catalogCachePath(),
  };
}

/**
 * 构造 RPC 处理器。
 * @param runtime - createRuntime 的返回值。
 * @returns `async (endpoint, payload, signal) => result`。
 */
export function createHandler(runtime) {
  const { client, settingsService, resolveConfig, readSettings, logger } = runtime;
  // 目录缓存路径允许从 runtime 注入（测试与自定义部署用），默认走标准路径。
  const catalogCacheFile = runtime.catalogCacheFile ?? catalogCachePath();

  return async function handleRpc(endpoint, payload = {}, signal) {
    if (signal?.aborted) return fail('cancelled', '请求已取消');

    try {
      switch (endpoint) {
        // 刷新（面板顶栏 ↻ 与进面板自动刷新都走它）：
        // 首选网关的同步刷新端点（重取余额 → 写回池 → 返回 status，一次往返）；
        // 网关未开 admin.enabled（或版本较旧）时降级为只读 /status —— 此时积分
        // 可能不是最新的，故把降级原因带回给面板显示，不静默假装成功。
        case ENDPOINTS.refreshStatus: {
          const probe = await client.versionProbe(payload?.forceProbe === true ? { force: true } : {});
          if (!probe.reachable) {
            return ok({
              reachable: false,
              baseURL: probe.baseURL,
              probe,
              error: probe.errors[0] ?? { code: 'unreachable', message: '网关不可达' },
            });
          }
          try {
            const snapshot = await client.refresh();
            return ok({ reachable: true, baseURL: probe.baseURL, probe, status: snapshot, refreshed: true });
          } catch (error) {
            const failure = failFromError(error);
            // 降级：拿得到 status 就返回它 + 刷新失败原因，面板据此提示
            // 「积分可能不是最新」而不是这次刷新整页失败。
            try {
              const snapshot = await client.status();
              return ok({
                reachable: true,
                baseURL: probe.baseURL,
                probe,
                status: snapshot,
                refreshed: false,
                refreshError: failure.error,
              });
            } catch (statusError) {
              return failFromError(statusError);
            }
          }
        }

        case ENDPOINTS.getStatus: {
          const probe = await client.versionProbe(payload?.forceProbe === true ? { force: true } : {});
          if (!probe.reachable) {
            return ok({
              reachable: false,
              baseURL: probe.baseURL,
              probe,
              error: probe.errors[0] ?? { code: 'unreachable', message: '网关不可达' },
            });
          }
          try {
            const status = await client.status();
            return ok({ reachable: true, baseURL: probe.baseURL, probe, status });
          } catch (error) {
            // 探活通了但取状态失败（多为鉴权）：如实带出错误，UI 才能区分
            // 「网关没启动」与「key 不对」——这两者的处置完全不同。
            return ok({ reachable: true, baseURL: probe.baseURL, probe, error: failFromError(error).error });
          }
        }

        case ENDPOINTS.getModels: {
          try {
            return ok(await client.models());
          } catch (error) {
            return failFromError(error);
          }
        }

        // 模型能力打补丁：拉全字段目录 + 读当前 DSH llm-pi-ai providers.<provider>.models。
        // 顺带做两件事（用户要求「拉取要能记录、重新拉取覆盖掉」）：
        //   A. 把本次目录写成**拉取快照**（整字段 set = 覆盖，不做合并），并算出与上次的差异；
        //   B. 可选（payload.overwriteDshModels=true）：以网关为准整体覆盖 DSH 的该 provider
        //      模型配置 —— 覆盖前先把现状备份进 settings，失败/手滑可走 rollbackModelsSync。
        case ENDPOINTS.discoverModelsForPatch: {
          const provider = typeof payload?.provider === 'string' && payload.provider !== ''
            ? payload.provider
            : 'chanhub2api';
          const wantsOverwrite = payload?.overwriteDshModels === true;
          try {
            const body = await client.models();
            const baseline = parseCapabilities(readSettings().modelCapabilities);
            const extraVision = capabilityVisionSet(baseline);
            const catalog = listFromGatewayBody(body, { extraVision });
            const current = await readConfigModels(settingsService, provider);
            const previous = parseSnapshot(readSettings().modelPullSnapshot);
            const snapshot = snapshotFromCatalog(catalog, { at: Date.now(), provider });
            const diff = diffModelSnapshots(previous, snapshot);

            const canWrite = Boolean(settingsService && typeof settingsService.mutate === 'function');
            let overwrote = false;
            let backupAt = 0;
            let backupCount = 0;
            if (wantsOverwrite) {
              if (!canWrite) return fail('settings-unavailable', 'DSH settings 服务不可用，无法覆盖模型配置');
              const backupModels = Array.isArray(current) ? current : [];
              const backup = {
                at: Date.now(),
                provider,
                count: backupModels.length,
                // 备份现状（含用户手改的额外字段），回滚时原样写回
                models: backupModels,
              };
              await settingsService.mutate(SETTINGS_NAMESPACE, [
                { op: 'set', path: ['modelSyncBackup'], value: JSON.stringify(backup) },
              ]);
              const nextModels = modelsFromCatalog(catalog, { previous: current, extraVision });
              await settingsService.mutate(PI_NS, [
                { op: 'set', path: providerModelsPath(provider), value: nextModels },
              ]);
              overwrote = true;
              backupAt = backup.at;
              backupCount = backup.models.length;
            }

            // A：覆盖式写快照（整字段 set）。写失败不影响本次拉取的展示，但要如实回报。
            let recorded = false;
            if (canWrite) {
              try {
                await settingsService.mutate(SETTINGS_NAMESPACE, [
                  { op: 'set', path: ['modelPullSnapshot'], value: JSON.stringify(snapshot) },
                ]);
                recorded = true;
              } catch {
                recorded = false;
              }
            }

            return ok({
              provider,
              models: catalog,
              configured: { present: Array.isArray(current), id: current?.map((m) => m.id) ?? [] },
              record: { at: snapshot.at, count: snapshot.count, recorded },
              previous,
              diff,
              overwrote,
              backup: { at: backupAt, count: backupCount },
              baseline: { at: baseline?.at ?? 0, count: baseline ? Object.keys(baseline.entries).length : 0 },
            });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 读回上次拉取的记录（快照），**不请求网关**。
        // 用途：模型 Tab 每次打开都是新挂载的组件，靠这个端点把上次拉取的结果
        // 立刻回显出来，用户不必为了看一眼目录而重新打一次网关。返回的 models
        // 是快照还原出的目录形态，与 discoverModelsForPatch 的 models 同形。
        case ENDPOINTS.getModelRecord: {
          const snapshot = parseSnapshot(readSettings().modelPullSnapshot);
          if (!snapshot) return ok({ record: null, models: [], backup: { at: 0, count: 0 } });
          const backup = parseSnapshot(readSettings().modelSyncBackup);
          const baseline = parseCapabilities(readSettings().modelCapabilities);
          const extraVision = capabilityVisionSet(baseline);
          const models = catalogFromSnapshot(snapshot).map((m) => (
            m.supportsImages === true ? m : { ...m, supportsImages: isVisionModel(m.id, extraVision) }
          ));
          const configured = await readConfigModels(settingsService, snapshot.provider || 'chanhub2api');
          return ok({
            record: { at: snapshot.at, count: snapshot.count, recorded: true },
            provider: snapshot.provider,
            models,
            backup: { at: backup?.at ?? 0, count: backup?.count ?? 0 },
            baseline: { at: baseline?.at ?? 0, count: baseline ? Object.keys(baseline.entries).length : 0 },
            // 配置里「缺哪些字段」：面板据此把「上文/输出」标成「未写入」——
            // 否则用户看到的是网关值（1M），而 DSH 实际回落到 256K，差别不可见。
            configured: { gaps: configuredFieldGaps(configured) },
          });
        }

        // 回滚上一次「以网关为准覆盖」：把备份里的 models 原样写回（幂等，可反复回滚）。
        case ENDPOINTS.rollbackModelsSync: {
          const provider = typeof payload?.provider === 'string' && payload.provider !== ''
            ? payload.provider
            : 'chanhub2api';
          if (!settingsService || typeof settingsService.mutate !== 'function') {
            return fail('settings-unavailable', 'DSH settings 服务不可用，无法回滚');
          }
          const backup = parseSnapshot(readSettings().modelSyncBackup);
          if (!backup) return fail('no-backup', '没有可回滚的备份（还没执行过覆盖，或记录已被清空）');
          try {
            await settingsService.mutate(PI_NS, [
              { op: 'set', path: providerModelsPath(backup.provider || provider), value: backup.models },
            ]);
            return ok({ restored: backup.models.length, at: backup.at, provider: backup.provider || provider });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 清空拉取记录（快照）。**不动 DSH 模型配置**，也不动备份。
        case ENDPOINTS.clearModelRecord: {
          if (!settingsService || typeof settingsService.mutate !== 'function') {
            return fail('settings-unavailable', 'DSH settings 服务不可用，无法清空记录');
          }
          try {
            await settingsService.mutate(SETTINGS_NAMESPACE, [
              { op: 'set', path: ['modelPullSnapshot'], value: '' },
            ]);
            return ok({ cleared: true });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 给勾选的模型补视觉能力（只动 input，其余字段原样保留）。
        // 防御：只允许给「有效视觉集合」（白名单 ∪ 基线）内的模型补 —— 网关
        // supports_images 误标、或手工乱填的 id 一律拒绝落 input。
        case ENDPOINTS.applyModelsPatch: {
          const provider = typeof payload?.provider === 'string' && payload.provider !== ''
            ? payload.provider
            : 'chanhub2api';
          const selected = Array.isArray(payload?.selectedIds)
            ? payload.selectedIds.filter((x) => typeof x === 'string')
            : [];
          if (selected.length === 0) {
            return fail('empty-selection', '请先勾选要补视觉能力的模型');
          }
          if (!settingsService || typeof settingsService.get !== 'function') {
            return fail('settings-unavailable', 'DSH settings 服务不可用，无法写入模型配置');
          }
          try {
            const current = await readConfigModels(settingsService, provider);
            const extraVision = capabilityVisionSet(parseCapabilities(readSettings().modelCapabilities));
            const { models, added, skipped } = buildModelsPatch(current, selected, { extraVision });
            if (added.length > 0) {
              // pi-ai 命名空间整段写回 providers.<provider>.models
              await settingsService.mutate(PI_NS, [
                { op: 'set', path: providerModelsPath(provider), value: models },
              ]);
            }
            return ok({ added, skipped, wrote: added.length > 0 });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 沉淀：把本次目录比对的**确认态**结论并入能力基线（settings.modelCapabilities）。
        // 只收 confirmed —— 借判/模糊/冲突/别名/无收录一律不写，避免把猜测写成事实。
        case ENDPOINTS.commitModelCapabilities: {
          if (!settingsService || typeof settingsService.mutate !== 'function') {
            return fail('settings-unavailable', 'DSH settings 服务不可用，无法写入能力基线');
          }
          try {
            const report = await buildCatalogReport(payload, {
              readSettings,
              logger,
              cacheFile: catalogCacheFile,
              piAiDirs: runtime.catalogPiAiDirs,
            });
            const prev = parseCapabilities(readSettings().modelCapabilities);
            const merged = mergeCapabilities(prev, report.verdicts, { at: Date.now() });
            await settingsService.mutate(SETTINGS_NAMESPACE, [
              { op: 'set', path: ['modelCapabilities'], value: serializeCapabilities(merged) },
            ]);
            return ok({
              added: merged.added,
              changed: merged.changed,
              // 被等级保护挡下的条目（目录想覆盖实测）—— 面板据此提示用户
              downgraded: merged.downgraded,
              skipped: merged.skipped,
              count: merged.count,
              at: merged.at,
              // 沉淀后重算一次报告：面板据此刷新「已沉淀 / 待沉淀」与缺口
              report: await buildCatalogReport(payload, {
                readSettings,
                logger,
                cacheFile: catalogCacheFile,
                piAiDirs: runtime.catalogPiAiDirs,
              }),
            });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 视觉能力**实测**（探针）：真发一张 74 字节的图，看这条渠道收不收。
        // 目录是别人的二手标注，白名单是人工认定 —— 实测才是最终裁决（L0）。
        // 纪律与目录比对一致：串行 + 间隔 + 单批上限；unknown 一律不写、不进基线。
        case ENDPOINTS.probeModelVision: {
          const provider = typeof payload?.provider === 'string' && payload.provider !== ''
            ? payload.provider
            : 'chanhub2api';
          const commit = payload?.commit === true;
          const explicit = Array.isArray(payload?.ids)
            ? payload.ids.filter((x) => typeof x === 'string' && x !== '')
            : [];
          try {
            let ids = explicit;
            if (ids.length === 0) {
              const report = await buildCatalogReport(payload, {
                readSettings,
                logger,
                cacheFile: catalogCacheFile,
                piAiDirs: runtime.catalogPiAiDirs,
              });
              ids = report.summary?.undecided ?? [];
            }
            if (ids.length === 0) {
              return ok({
                provider,
                results: [],
                done: 0,
                remaining: [],
                capped: false,
                message: '没有待实测的模型（全部已是确认态）',
              });
            }
            const batch = await probeModelVisionBatch({
              client,
              ids,
              limit: payload?.limit,
              delayMs: payload?.delayMs,
            });
            const unknown = batch.results.filter((r) => r.verdict === PROBE_VERDICT.UNKNOWN).length;
            let committed = null;
            if (commit) {
              if (!settingsService || typeof settingsService.mutate !== 'function') {
                return fail('settings-unavailable', 'DSH settings 服务不可用，无法写入能力基线');
              }
              const toCommit = probeVerdictsForCommit(batch.results, { at: Date.now() });
              const prev = parseCapabilities(readSettings().modelCapabilities);
              const merged = mergeCapabilities(prev, toCommit, { at: Date.now() });
              if (merged.added.length > 0 || merged.changed.length > 0) {
                await settingsService.mutate(SETTINGS_NAMESPACE, [
                  { op: 'set', path: ['modelCapabilities'], value: serializeCapabilities(merged) },
                ]);
              }
              committed = {
                added: merged.added,
                changed: merged.changed,
                count: merged.count,
                unknown,
              };
            }
            return ok({
              provider,
              results: batch.results,
              done: batch.done,
              remaining: batch.remaining,
              capped: batch.capped,
              unknown,
              committed,
              ...(commit
                ? {
                    report: await buildCatalogReport(payload, {
                      readSettings,
                      logger,
                      cacheFile: catalogCacheFile,
                      piAiDirs: runtime.catalogPiAiDirs,
                    }),
                  }
                : {}),
            });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 补齐配置字段：给已配置的条目补 contextWindow / maxTokens / reasoningEfforts
        // （+ 有效视觉集合内的 input）。**不增不删条目**，默认连「已有但不一致」也不动。
        // 数据源优先用拉取快照（零网络），没有快照才回落到网关。
        case ENDPOINTS.completeModelFields: {
          const provider = typeof payload?.provider === 'string' && payload.provider !== ''
            ? payload.provider
            : 'chanhub2api';
          const dryRun = payload?.dryRun !== false;
          const refresh = payload?.refresh === true;
          try {
            const current = await readConfigModels(settingsService, provider);
            if (!Array.isArray(current)) {
              return fail('no-models', `DSH 里 provider「${provider}」还没有模型配置，先「拉取」或「覆盖」一次`);
            }
            const snapshot = parseSnapshot(readSettings().modelPullSnapshot);
            let catalog;
            let source;
            if (snapshot) {
              catalog = catalogFromSnapshot(snapshot);
              // 快照记录于「推理档位」采集上线前 → 档位补不了，如实说，别让用户以为补过了
              const staleEfforts = snapshot.hasEfforts !== true;
              source = {
                kind: 'snapshot',
                at: snapshot.at,
                count: snapshot.count,
                ...(staleEfforts ? { staleFields: ['reasoningEfforts'] } : {}),
              };
            } else {
              const body = await client.models();
              catalog = listFromGatewayBody(body);
              source = { kind: 'gateway', at: Date.now(), count: catalog.length };
            }
            const extraVision = capabilityVisionSet(parseCapabilities(readSettings().modelCapabilities));
            const plan = buildCompletionPatch(current, catalog, { extraVision, refresh });
            let wrote = false;
            if (!dryRun && plan.changes.length > 0) {
              if (!settingsService || typeof settingsService.mutate !== 'function') {
                return fail('settings-unavailable', 'DSH settings 服务不可用，无法写入模型配置');
              }
              await settingsService.mutate(PI_NS, [
                { op: 'set', path: providerModelsPath(provider), value: plan.models },
              ]);
              wrote = true;
            }
            return ok({
              provider,
              dryRun,
              wrote,
              source,
              refresh,
              changes: plan.changes,
              unchanged: plan.unchanged,
              missingInCatalog: plan.missingInCatalog,
              warnings: plan.warnings,
            });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 「多模态能力目录比对」只读报告：本地 pi-ai + 缓存的在线目录 → 三态判定。
        // 零网络、零写入 —— 只为让用户看着真实证据拍板，再决定要不要写 input。
        case ENDPOINTS.getModelCatalog: {
          try {
            return ok(await buildCatalogReport(payload, {
              readSettings,
              logger,
              cacheFile: catalogCacheFile,
              piAiDirs: runtime.catalogPiAiDirs,
            }));
          } catch (error) {
            return failFromError(error);
          }
        }

        // 显式刷新在线目录（models.dev + OpenRouter）→ 落盘缓存。这是目录链路里
        // **唯一**会联网的动作；刷完顺带把判定一并返回，面板一次往返就能更新。
        case ENDPOINTS.refreshModelCatalog: {
          try {
            const entryLists = [];
            const sourceMeta = {};
            const failures = [];
            for (const source of [CATALOG_SOURCES.modelsDev, CATALOG_SOURCES.openRouter]) {
              try {
                const result = await fetchCatalogSource(source, {
                  signal,
                  fetchImpl: runtime.fetchImpl,
                  timeoutMs: runtime.catalogFetchTimeoutMs,
                });
                entryLists.push(result.entries);
                sourceMeta[source] = { at: result.at, entries: result.entries.length };
              } catch (error) {
                failures.push({ source, message: error?.message ?? String(error) });
              }
            }
            if (entryLists.length === 0) {
              return fail(
                'catalog-unreachable',
                `目录源都拉不动：${failures.map((f) => `${f.source}（${f.message}）`).join('；')}`,
              );
            }
            await writeCatalogCache(catalogCacheFile, {
              at: Date.now(),
              sources: sourceMeta,
              index: buildCatalogIndex(entryLists),
            });
            return ok(await buildCatalogReport(payload, {
              readSettings,
              logger,
              cacheFile: catalogCacheFile,
              piAiDirs: runtime.catalogPiAiDirs,
              extra: { refreshed: true, failures },
            }));
          } catch (error) {
            return failFromError(error);
          }
        }

        case ENDPOINTS.getStats: {
          const probe = await client.versionProbe();
          if (!probe.features.stats) {
            return ok({ available: false, reason: '该网关版本未提供 /v1/stats（请求统计视图不可用）' });
          }
          try {
            return ok({ available: true, stats: await client.stats() });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 凭证只读盘点：渠道判定的唯一可行路径（/status 没有 channel 字段）。
        case ENDPOINTS.getAccounts: {
          const result = await readAuthAccounts(resolveConfig(), readSettings());
          return ok(result);
        }

        // 逐套餐积分明细（chanhub 新端点）。旧网关无此端点 → 明确降级，
        // 不把「版本不支持」渲染成「加载失败」。
        case ENDPOINTS.getCredits: {
          const uid = payload?.uid;
          try {
            const value = await client.credits(uid);
            if (value === undefined) {
              return ok({ available: false, reason: '该网关版本未提供 /v1/accounts/{uid}/credits（逐套餐积分不可用）' });
            }
            return ok({ available: true, credits: value });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 成长任务进度（逐码 当前/目标/状态；含 mp 限定任务）。
        case ENDPOINTS.getGrowthTasks: {
          try {
            const value = await client.growthTasks(payload?.uid);
            if (value === undefined) {
              return ok({ available: false, reason: '该网关版本未提供 /v1/accounts/{uid}/growth-tasks（成长码进度不可用）' });
            }
            return ok({ available: true, growth: value });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 开学季子任务状态（5 个子任务，含 in_period 与 next_unlock_at）。
        case ENDPOINTS.getSchoolTasks: {
          try {
            const value = await client.schoolTasks(payload?.uid);
            if (value === undefined) {
              return ok({ available: false, reason: '该网关版本未提供 /v1/accounts/{uid}/school-tasks（开学季子任务状态不可用）' });
            }
            return ok({ available: true, school: value });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 用量分桶（chanhub 新端点）。
        case ENDPOINTS.getUsage: {
          try {
            const value = await client.usageBuckets(payload?.window ?? '72h');
            if (value === undefined) {
              return ok({ available: false, reason: '该网关版本未提供 /v1/stats/buckets（分桶用量不可用）' });
            }
            return ok({ available: true, usage: value });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 运行日志（需网关 config logs.enabled=true）。
        case ENDPOINTS.getLogs: {
          try {
            const value = await client.logs({
              channel: payload?.channel ?? 'all',
              limit: payload?.limit ?? 500,
              clear: payload?.clear === true,
            });
            if (value === undefined) {
              return ok({ available: false, reason: '网关未开启日志端点 —— 需在 config.json 设置 logs.enabled=true 并重启网关。' });
            }
            return ok({ available: true, logs: value });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 六类任务的运行状态（含签到的逐账号结构化结果）。
        case ENDPOINTS.getTasks: {
          try {
            const value = await client.taskStatus();
            if (value === undefined) {
              return ok({ available: false, reason: '网关未开启任务端点 —— 需在 config.json 设置 admin.enabled=true 并重启网关。' });
            }
            return ok({ available: true, tasks: value });
          } catch (error) {
            return failFromError(error);
          }
        }

        // 触发一类任务（异步：立即返回是否启动）。
        case ENDPOINTS.runTask: {
          try {
            return ok(await client.triggerTask(payload?.name));
          } catch (error) {
            return failFromError(error);
          }
        }

        // 成长码写操作（单码/批量 accept 与 claim、claim-claimable）。
        // 写操作：真实推进任务状态（admin.enabled 门槛内），与只读查询分开。
        case ENDPOINTS.growthWrite: {
          try {
            return ok(await client.growthWrite(payload?.action, payload?.uid, payload?.codes));
          } catch (error) {
            return failFromError(error);
          }
        }

        // ---- 任务中心（panel 对照补齐）----
        case ENDPOINTS.taskScan:
          return ok(await client.taskScan());
        case ENDPOINTS.taskQueueStart:
          return ok(await client.taskQueueStart(payload?.concurrency));
        case ENDPOINTS.taskQueueStatus:
          return ok(await client.taskQueueStatus());
        case ENDPOINTS.schoolStatusAll:
          return ok(await client.schoolStatusAll());
        case ENDPOINTS.schoolVouchersAll:
          return ok(await client.schoolVouchersAll());
        case ENDPOINTS.accountMore:
          return ok(await client.accountActionMore(payload?.action, payload?.uid));

        case ENDPOINTS.probe:
          return ok(await client.versionProbe({ force: true }));

        case ENDPOINTS.accountDisable:
          return ok(await client.accountAction('disable', payload?.uid, payload?.reason));
        case ENDPOINTS.accountEnable:
          return ok(await client.accountAction('enable', payload?.uid));
        case ENDPOINTS.accountRevive:
          return ok(await client.accountAction('revive', payload?.uid));

        // ---- 添加账号（OAuth 设备授权）----
        // 两段式与网关的交互模型一致：start 拿授权 URL（前端打开浏览器）→
        // 轮询 poll 直到 done/error。宿主只做转发，不持有任何登录会话状态——
        // 会话态在网关侧（data/login-state-*.json），插件重启不打断在途登录。
        case ENDPOINTS.getChannels: {
          try {
            return ok(await client.channels());
          } catch (error) {
            // 旧网关没有 /panel/api/channels 时如实降级成空列表，面板隐藏添加入口
            // （而不是渲染一个必然失败的按钮）。
            return ok({
              channels: [],
              loginChannels: [],
              realms: [],
              available: false,
              message: `网关未提供 /panel/api/channels（添加账号不可用）：${error?.message ?? error}`,
            });
          }
        }

        case ENDPOINTS.loginStart: {
          try {
            // 第二维随渠道解释：qoder→site，workbuddy→realm（client 内部映射）。
            const value = await client.loginStart(payload?.channel, payload?.realm);
            // 渠道名由网关校验；这里做一道前置校验只为给出更准确的提示
            // （网关对未知渠道回 400 unknown channel，同样如实透传）。
            return ok({ ...value, channel: payload?.channel ?? 'workbuddy' });
          } catch (error) {
            return failFromError(error);
          }
        }

        case ENDPOINTS.loginPoll: {
          try {
            return ok(await client.loginPoll(payload?.channel, payload?.realm));
          } catch (error) {
            return failFromError(error);
          }
        }

        // 粘贴回调：用户把 Trae 授权页地址栏里的内容交上来，由宿主转给网关。
        // 这是 traework 在远端唯一的完成路径（回调地址被 Trae 限制为 loopback）。
        case ENDPOINTS.loginCallback: {
          try {
            return ok(await client.loginCallback(payload?.channel, payload?.callback));
          } catch (error) {
            return failFromError(error);
          }
        }

        case ENDPOINTS.getConfig: {
          const result = await readGatewayConfig(resolveConfig(), readSettings());
          if (!result.ok) return ok({ ok: false, ...result });
          // api_key / upstash.token 属敏感项：展示时脱敏，绝不回传明文。
          return ok(redactConfig(result));
        }

        case ENDPOINTS.revealApiKey: {
          // 顶栏小眼睛「点开看/复制」用的明文端点。走已认证的 namespaced RPC
          // 通道（与其它端点同一鉴权面），明文仅回传给本机面板，不写日志。
          // 密钥来源与网关调用一致（凭证缓存 → env → settings），保证展示的
          // 就是实际生效的 key。
          const apiKey = resolveConfig().apiKey;
          if (!apiKey) return ok({ apiKey: '', available: false, message: '未配置 API key（apiKeyEnv / settings 均为空）' });
          return ok({ apiKey, available: true });
        }

        case ENDPOINTS.saveConfig: {
          // 首选网关端点 POST /admin/config（P3）：网关侧做完整 normalize 校验 +
          // 写盘 + **可热改字段就地生效**（pool/schedule/prompt/api_key）。
          // 降级路径：网关未接线（501）/ admin 未开启（404）/ 写盘失败（500，真机典型是
          // config.json 以单文件 `:ro` 挂进容器 → rename 覆盖挂载点 EBUSY）→ 走本地
          // 文件直写（tmp+rename + fail-fast 预检），全部字段如实标「需重启」。
          // 降级必须带上网关失败原因：否则面板只说「N 项需重启」，用户会以为热生效压根没接。
          // 两路形状对齐：{ok, path, applied, hot_applied, restart_required, api_key_hint}。
          //
          // 送网关前**必须**先做类型收敛：面板输入框交上来的是字符串（"0" / "8, 21"），
          // 而网关的 normalize 是强类型的（Go `[]int` / `int`），拿字符串去 merge 会在
          // 校验期直接 400（cannot unmarshal string into ... []int）→ 于是 hours/int/
          // float/duration 这些字段永远热改不了，全部掉进降级路径。收敛用与面板同一张规格表。
          const coerced = coercePatchTypes(payload?.patch);
          if (!coerced.ok) {
            return fail(
              'validation-failed',
              `配置校验未通过：${coerced.errors.map((item) => `${item.path} ${item.message}`).join('；')}`,
              { errors: coerced.errors },
            );
          }
          const patch = coerced.values;
          let gatewayError;
          try {
            const viaGateway = await client.saveConfigViaGateway(patch);
            if (viaGateway) return ok({ ...viaGateway, viaGateway: true });
          } catch (error) {
            gatewayError = {
              code: error?.code ?? 'unknown',
              message: String(error?.message ?? error),
            };
            logger?.info?.('[dsh-chanhub] gateway config endpoint unavailable, falling back to file write: %s',
              gatewayError.message);
          }
          const written = await writeGatewayConfig(resolveConfig(), readSettings(), patch, { gatewayError });
          return ok(written);
        }

        case ENDPOINTS.serviceControl:
          return ok(await runServiceControl(payload, readSettings(), logger));

        default:
          return fail('bad-request', `Unknown endpoint: ${endpoint}`);
      }
    } catch (error) {
      logger?.error?.('[dsh-chanhub] RPC %s failed: %s', endpoint, error?.message ?? error);
      return failFromError(error);
    }
  };
}

// docker / docker-compose 的已知安装位（宿主 PATH 之外的兜底搜索目录）。
// 真机故障现场：Docker.app 在 /Applications 里、容器跑得好好的，但 /usr/local/bin
// 下没有 CLI 软链，dsh 又是 launchd 拉起的（最小 PATH）→ 点重启直接
// `docker: command not found`。所以 PATH 之外必须有一份已知安装位。
const SERVICE_BIN_HINT_DIRS = [
  '/usr/local/bin',
  '/opt/homebrew/bin',
  '/usr/bin',
  '/bin',
  '/usr/sbin',
  '/sbin',
  ...(process.platform === 'darwin' ? ['/Applications/Docker.app/Contents/Resources/bin'] : []),
  ...(process.platform === 'linux' ? ['/snap/bin'] : []),
];

// 命令最终走 `/bin/sh -c`，这类元字符一律挡掉 —— 这条通道不能变成命令注入面。
const SHELL_METACHAR = /[;&|`$<>\n\r]/;

/**
 * 服务控制：重启网关。
 *
 * chanhub **自身没有重启能力**（全仓无热加载、无 SIGHUP 处理器），
 * 所以这是插件宿主侧的动作：在宿主上执行 `docker compose restart <service>`。
 * 因此默认**关闭**，需要用户在设置里显式开启（会执行本机命令），
 * 且命令前缀走白名单 —— 这条通道不能变成任意命令执行面。
 *
 * @param payload - `{command?}`，缺省用 settings.restartCommand。
 * @param settings - settings 命名空间值（allowServiceControl / restartCommand）。
 * @param logger - 日志器。
 * @returns 执行结果。
 */
async function runServiceControl(payload, settings, logger) {
  if (settings?.allowServiceControl !== true) {
    return {
      ok: false,
      code: 'disabled',
      message: '服务控制默认关闭 —— 需在插件设置里显式开启（会在宿主执行本机命令）。',
    };
  }
  const command =
    typeof payload?.command === 'string' && payload.command.trim() !== ''
      ? payload.command.trim()
      : typeof settings?.restartCommand === 'string' && settings.restartCommand.trim() !== ''
        ? settings.restartCommand.trim()
        : '';
  if (command === '') {
    return { ok: false, code: 'no-command', message: '未配置重启命令 —— 请先在插件设置里填写。' };
  }

  const shape = inspectRestartCommand(command);
  if (!shape.ok) {
    return { ok: false, code: 'command-not-allowed', message: shape.message };
  }

  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(exec);

  // 不能假设宿主进程的 PATH 里有 docker —— 这是本函数最容易踩的坑：
  // dsh 多半由 launchd 拉起（com.dsh.web.plist），继承的是 launchd 的最小 PATH
  // （/usr/bin:/bin:/usr/sbin:/sbin），而 Docker Desktop **未必**在 /usr/local/bin
  // 放 CLI 软链（真机上就没有）。于是命令本身没错，报的却是
  // `/bin/sh: docker: command not found`。
  // 所以先按 PATH + 已知安装位解析出绝对位置，再把它的目录补进子进程 PATH。
  const binPath = await resolveServiceBinary(shape.bin);
  if (!binPath) {
    return {
      ok: false,
      code: 'binary-not-found',
      message:
        `找不到可执行文件 \`${shape.bin}\` —— 已搜索宿主 PATH 与 ${SERVICE_BIN_HINT_DIRS.join(' / ')}。` +
        'Docker Desktop 自带 CLI 在 /Applications/Docker.app/Contents/Resources/bin/docker：' +
        '把它软链进 /usr/local/bin，或在插件设置里直接填绝对路径（白名单接受绝对路径）。',
      searched: SERVICE_BIN_HINT_DIRS,
    };
  }
  const env = buildServiceEnv(binPath);

  // cwd 刻意不设：重启命令是用户在插件设置里配置的整行命令（含可能的 -f 指向），
  // 在宿主任意工作目录下 shell 都能解析 docker compose 的 context 解析规则；
  // 强行把 cwd 指到 config 目录反而会让相对 compose 路径失效。
  try {
    const { stdout, stderr } = await run(command, { timeout: 120000, windowsHide: true, env });
    logger?.info?.('[dsh-chanhub] service control ok: %s (bin=%s)', command, binPath);
    return {
      ok: true,
      command,
      binPath,
      stdout: String(stdout).slice(0, 4000),
      stderr: String(stderr).slice(0, 4000),
    };
  } catch (error) {
    const stderrText = String(error?.stderr ?? '');
    const looksLikeNotFound =
      error?.code === 127 || /command not found|No such file or directory/i.test(stderrText);
    return {
      ok: false,
      code: 'command-failed',
      message:
        `命令执行失败：${error?.message ?? error}` +
        (looksLikeNotFound ? `（可执行文件已解析到 ${binPath}，仍报 not found —— 检查它是否为可执行位正常的真实文件）` : ''),
      binPath,
      stdout: String(error?.stdout ?? '').slice(0, 4000),
      stderr: stderrText.slice(0, 4000),
    };
  }
}

/**
 * 重启命令的形状校验（白名单）。
 *
 * 比「前缀匹配」略松一点：`docker compose -f ./x.yml restart svc` 这种带参数的
 * 写法在真实部署里很常见，前缀匹配会误杀。但**绝不放开任意命令** ——
 * 这条通道会以宿主用户身份跑 shell，所以顺带挡掉 shell 元字符，
 * 免得 `docker restart x; rm -rf …` 这类拼接混进来。
 *
 * @param command - 用户配置的整行命令。
 * @returns `{ok:true, bin}` 或 `{ok:false, message}`。
 */
function inspectRestartCommand(command) {
  if (SHELL_METACHAR.test(command)) {
    return {
      ok: false,
      message: '重启命令不允许包含 shell 元字符（; & | ` $ < > 或换行）—— 它会以宿主用户身份执行。',
    };
  }
  const tokens = command.split(/\s+/).filter(Boolean);
  const raw = tokens[0] ?? '';
  // 允许写绝对路径（/Applications/Docker.app/Contents/Resources/bin/docker restart …）。
  const bin = basename(raw).replace(/\.(exe|cmd|bat)$/i, '');
  if (bin === 'docker') {
    if (tokens[1] === 'restart') return { ok: true, bin: raw };
    if (tokens[1] === 'compose' && tokens.slice(2).includes('restart')) return { ok: true, bin: raw };
  } else if (bin === 'docker-compose' && tokens[1] === 'restart') {
    return { ok: true, bin: raw };
  } else if (bin === 'dev.sh' && tokens[1] === 'restart') {
    return { ok: true, bin: raw };
  }
  return {
    ok: false,
    message:
      '重启命令只能是以下几种：`docker restart …`、`docker compose … restart …`' +
      '（允许 -f 等参数，如 `docker compose -f /path/docker-compose.yml restart svc`）、' +
      '`docker-compose restart …`、`./dev.sh restart`；可执行文件也允许写绝对路径。',
  };
}

/**
 * 解析重启命令的可执行文件绝对路径。
 *
 * 先查宿主 PATH，再查 Docker Desktop / Homebrew 等已知安装位。
 *
 * @param bin - 命令首 token（`docker` / `docker-compose` / `./dev.sh` / 绝对路径）。
 * @returns 绝对路径；找不到返回 null。
 */
async function resolveServiceBinary(bin) {
  const { access, constants } = await import('node:fs/promises');
  const isPathLike = bin.includes('/') || bin.includes('\\');
  if (isPathLike) {
    const full = isAbsolute(bin) ? bin : resolve(process.cwd(), bin);
    try {
      await access(full, constants.X_OK);
      return full;
    } catch {
      return null;
    }
  }
  const names = process.platform === 'win32' ? [bin, `${bin}.exe`, `${bin}.cmd`, `${bin}.bat`] : [bin];
  const dirs = [...(process.env.PATH ?? '').split(delimiter).filter(Boolean), ...SERVICE_BIN_HINT_DIRS];
  for (const dir of dirs) {
    for (const name of names) {
      const full = join(dir, name);
      try {
        await access(full, constants.X_OK);
        return full;
      } catch {
        // 该候选不存在或不可执行，继续找下一个
      }
    }
  }
  return null;
}

/**
 * 子进程环境：把解析到的二进制所在目录补进 PATH，并保证 HOME 存在。
 *
 * HOME 这一项不是多余的：Docker Desktop 的 daemon socket 在
 * `~/.docker/run/docker.sock`，CLI 靠 `~/.docker/config.json` 里的
 * currentContext=desktop-linux 才能找到它。HOME 缺失时 CLI 会退回默认的
 * /var/run/docker.sock（macOS 上根本不存在），报「Cannot connect to the Docker
 * daemon」—— 看起来像守护进程挂了，其实是 HOME 丢了。
 *
 * @param binPath - 已解析的可执行文件绝对路径。
 * @returns 子进程 env。
 */
function buildServiceEnv(binPath) {
  const dir = dirname(binPath);
  const current = (process.env.PATH ?? '').split(delimiter).filter(Boolean);
  const env = { ...process.env };
  env.PATH = (current.includes(dir) ? current : [dir, ...current]).join(delimiter);
  if (!env.HOME && process.platform !== 'win32') env.HOME = homedir();
  return env;
}

/**
 * 脱敏后的配置（api_key / upstash.token 不回传明文）。
 * @param result - readGatewayConfig 的结果。
 * @returns 可安全回传浏览器的配置。
 */
function redactConfig(result) {
  const config = structuredClone(result.config ?? {});
  const redacted = [];
  if (typeof config.api_key === 'string' && config.api_key !== '') {
    config.api_key = mask(config.api_key);
    redacted.push('api_key');
  }
  if (config.upstash && typeof config.upstash.token === 'string' && config.upstash.token !== '') {
    config.upstash.token = mask(config.upstash.token);
    redacted.push('upstash.token');
  }
  return { ...result, config, redacted };
}

/**
 * 只保留首尾各 3 位，中间用圆点代替。
 * @param value - 原始密钥。
 * @returns 脱敏后的字符串。
 */
function mask(value) {
  if (value.length <= 8) return '••••••••';
  return `${value.slice(0, 3)}••••${value.slice(-3)}`;
}

// 后三个导出是为了可测：服务控制的「能不能找到 docker」这一层没法靠肉眼审，
// 必须能在测试里脱离 RPC 直接调用（见 test/service-control.test.mjs）。
export {
  resolveConfigPathCandidates,
  runServiceControl,
  inspectRestartCommand,
  resolveServiceBinary,
  buildServiceEnv,
  SERVICE_BIN_HINT_DIRS,
};

export function apply(ctx) {
  if (!ctx?.connection) {
    ctx.logger?.warn?.('[dsh-chanhub] Connection service unavailable — UI will not work');
    return () => {};
  }

  const runtime = createRuntime(ctx);
  for (const warning of runtime.warnings) ctx.logger?.info?.('[dsh-chanhub] %s', warning);

  const handler = createHandler(runtime);

  // 预热 credentials（把异步的 resolve 桥接成同步读）。失败只降级到 env，不阻塞装载。
  if (runtime.credentialsService && typeof runtime.credentialsService.resolve === 'function') {
    const prewarm = async () => {
      try {
        const ref = runtime.resolveConfig().apiKeyEnv;
        const resolved = await runtime.credentialsService.resolve(ref);
        if (typeof resolved?.value === 'string' && resolved.value !== '') {
          credentialCache.set(ref, { value: resolved.value });
        }
      } catch (error) {
        ctx.logger?.debug?.('[dsh-chanhub] credentials prewarm skipped: %s', error?.message ?? error);
      }
    };
    void prewarm();
    // 凭证更新后重新预热（credentials 的语义是「每次操作现解析」）。
    ctx.on?.('credentials/reference-updated', () => {
      void prewarm();
    });
  }

  return ctx.inject(['connection', 'webServer'], (c) => {
    const connection = c.connection;
    return c.effect(() => {
      const unregister = c.webServer.register({
        kind: 'prefix',
        path: CHANNEL,
        handler: (req, res) => {
          void serveChannelRequest(req, res, connection, CHANNEL, handler, {
            logger: ctx.logger,
          }).catch((error) => {
            ctx.logger?.error?.('[dsh-chanhub] channel request failed: %s', error?.message ?? error);
            if (!res.headersSent) {
              res.writeHead(500);
              res.end();
            }
          });
        },
      });

      return () => {
        try {
          unregister?.();
        } catch {}
      };
    }, 'dsh-chanhub: rpc channel');
  });
}

export default { name, inject, apply, CHANNEL, ENDPOINTS, SETTINGS_NAMESPACE };

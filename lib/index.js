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

import { ChanhubClient, ChanhubError, DEFAULT_BASE_URL, normalizeBaseUrl } from './chanhub-client.js';
import { readGatewayConfig, writeGatewayConfig, resolveConfigPathCandidates } from './gateway-config.js';
import { readAuthAccounts } from './auths.js';
import { serveChannelRequest } from './rpc-channel.js';

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

  return { client, readSettings, settingsScope, resolveConfig, warnings, logger, credentialsService };
}

/**
 * 构造 RPC 处理器。
 * @param runtime - createRuntime 的返回值。
 * @returns `async (endpoint, payload, signal) => result`。
 */
export function createHandler(runtime) {
  const { client, resolveConfig, readSettings, logger } = runtime;

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
            return ok(await client.loginPoll(payload?.channel));
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
          // 原子写 + **可热改字段就地生效**（pool/schedule/prompt/api_key）。
          // 降级路径：网关未接线（501）或 admin 未开启（404）→ 走本地文件直写
          // （tmp+rename + fail-fast 预检），全部字段如实标「需重启」。
          // 两路形状对齐：{ok, path, applied, hot_applied, restart_required, api_key_hint}。
          try {
            const viaGateway = await client.saveConfigViaGateway(payload?.patch);
            if (viaGateway) return ok(viaGateway);
          } catch (error) {
            // 404（admin 关）/ 501（未接线）→ 降级；其余错误也降级但记录。
            logger?.info?.('[dsh-chanhub] gateway config endpoint unavailable, falling back to file write: %s',
              error?.message ?? error);
          }
          const written = await writeGatewayConfig(resolveConfig(), readSettings(), payload?.patch);
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

  const ALLOWED_PREFIXES = [
    'docker compose restart',
    'docker-compose restart',
    'docker restart',
    './dev.sh restart',
  ];
  if (!ALLOWED_PREFIXES.some((prefix) => command.startsWith(prefix))) {
    return {
      ok: false,
      code: 'command-not-allowed',
      message: `重启命令必须以以下之一开头：${ALLOWED_PREFIXES.join(' / ')}`,
    };
  }

  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const run = promisify(exec);
  // cwd 刻意不设：重启命令是用户在插件设置里配置的整行命令（含可能的 -f 指向），
  // 在宿主任意工作目录下 shell 都能解析 docker compose 的 context 解析规则；
  // 强行把 cwd 指到 config 目录反而会让相对 compose 路径失效。
  try {
    const { stdout, stderr } = await run(command, { timeout: 120000, windowsHide: true });
    logger?.info?.('[dsh-chanhub] service control ok: %s', command);
    return {
      ok: true,
      command,
      stdout: String(stdout).slice(0, 4000),
      stderr: String(stderr).slice(0, 4000),
    };
  } catch (error) {
    return {
      ok: false,
      code: 'command-failed',
      message: `命令执行失败：${error?.message ?? error}`,
      stdout: String(error?.stdout ?? '').slice(0, 4000),
      stderr: String(error?.stderr ?? '').slice(0, 4000),
    };
  }
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

export { resolveConfigPathCandidates };

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

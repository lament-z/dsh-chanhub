// dsh-chanhub —— chanhub 网关 HTTP 客户端（宿主侧）
//
// 为什么必须走宿主（而不是浏览器直连网关）：
//   1. 网关没有任何 CORS 头 → 浏览器 fetch 直连必然失败；
//   2. 网关要求 `Authorization: Bearer <api_key>`；
//   3. client/client.js 是明文构建产物，key 内联进 bundle 等于泄漏。
//
// 因此 API key 只存在于宿主进程，浏览器只经 RPC 通道拿数据。

/** 默认网关地址（chanhub 网关默认 :7866）。 */
export const DEFAULT_BASE_URL = 'http://127.0.0.1:7866';

/** 单次请求默认超时（毫秒）。 */
export const DEFAULT_TIMEOUT_MS = 15000;

/** 探活请求超时（更短，避免拖住首次渲染）。 */
export const PROBE_TIMEOUT_MS = 4000;

/** 版本探测缓存时长（毫秒）。 */
export const VERSION_PROBE_TTL_MS = 60000;

/**
 * 网关确认自己身份的 service 标识（`/healthz` 的 `service` 字段）。
 *
 * 网关侧 2026-09-22 随容器化替换由 `workbuddy2api` 更名为 `chanhub2api`。这里**只认新名**：
 * 旧名意味着对端跑的是未重建的旧容器 —— 那正是需要立刻暴露的部署错位，迁就它反而会把
 * 「网关没重建」藏起来（用户明确要求不做双名兼容）。
 */
export const EXPECTED_SERVICE = 'chanhub2api';

/**
 * 归一化 baseURL（补协议、去尾斜杠）。
 * @param raw - 用户填的地址或 env 值。
 * @returns 可用的 baseURL。
 */
export function normalizeBaseUrl(raw) {
  const value = typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : DEFAULT_BASE_URL;
  const withScheme = /^https?:\/\//i.test(value) ? value : `http://${value}`;
  return withScheme.replace(/\/+$/, '');
}

/**
 * 一个带 code 的错误，便于 RPC 层映射成 `{ok:false,error}`。
 */
export class ChanhubError extends Error {
  /**
   * @param code - 稳定的错误码，供前端分支判断。
   * @param message - 面向用户的说明。
   * @param details - 可选附加信息。
   */
  constructor(code, message, details = undefined) {
    super(message);
    this.name = 'ChanhubError';
    this.code = code;
    this.details = details;
  }
}

/**
 * 把上游 HTTP 响应体解成 JSON，失败时给出带上下文的错误。
 * @param response - fetch 响应。
 * @returns 解析后的对象。
 */
async function readJson(response) {
  const text = await response.text();
  if (text === '') return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new ChanhubError('upstream-bad-json', `网关返回了非 JSON 响应（HTTP ${response.status}）`, {
      status: response.status,
      body: text.slice(0, 500),
    });
  }
}

/**
 * 网关客户端。无状态 —— 每次调用都重新解析配置，便于配置热改后立即生效。
 */
export class ChanhubClient {
  /**
   * @param options - `{ resolveConfig }`，resolveConfig 返回 `{baseURL, apiKey}`。
   */
  constructor(options = {}) {
    this.resolveConfig = options.resolveConfig ?? (() => ({}));
    this.logger = options.logger;
  }

  /** 解析一次当前配置。 */
  config() {
    const raw = this.resolveConfig() ?? {};
    return {
      baseURL: normalizeBaseUrl(raw.baseURL),
      apiKey: typeof raw.apiKey === 'string' ? raw.apiKey.trim() : '',
    };
  }

  /**
   * 发一次请求并解 JSON。
   * @param path - 以 `/` 开头的路径。
   * @param options - `{ method, body, timeoutMs, auth }`。
   * @returns `{status, ok, body}`。
   */
  async request(path, options = {}) {
    const { baseURL, apiKey } = this.config();
    const auth = options.auth ?? true;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const headers = { accept: 'application/json' };
    if (auth && apiKey !== '') headers.authorization = `Bearer ${apiKey}`;
    let body;
    if (options.body !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetch(new URL(path, `${baseURL}/`), {
        method: options.method ?? 'GET',
        headers,
        ...(body === undefined ? {} : { body }),
        signal: controller.signal,
      });
    } catch (error) {
      const aborted = error?.name === 'AbortError';
      throw new ChanhubError(
        aborted ? 'upstream-timeout' : 'upstream-unreachable',
        aborted
          ? `网关请求超时（${timeoutMs}ms）：${baseURL}${path}`
          : `无法连接网关 ${baseURL}：${error?.message ?? error}`,
        { baseURL, path },
      );
    } finally {
      clearTimeout(timer);
    }

    // JSON 解析失败不抛：探测路径恰恰依赖**非 JSON**响应 ——
    // Go 的 ServeMux 对 404/405 返回纯文本（"404 page not found" / "Method Not Allowed"），
    // 而「错误方法打一次」正是判断路由存在性的手段。若在这里抛，
    // routeStatus 会退化成 0，能力探测全部误报为「不支持」（真机踩到过）。
    let parsed;
    try {
      parsed = await readJson(response);
    } catch {
      parsed = undefined;
    }
    return { status: response.status, ok: response.ok, body: parsed };
  }

  /**
   * 把一次请求的结果转成值，或在网关报错时抛出 ChanhubError。
   *
   * 网关的错误体有两种形态：OpenAI 风格 `{error:{code,message}}`，
   * 以及 net/http 默认的纯文本 `404 page not found`。
   *
   * @param path - 路径。
   * @param options - 同 request。
   * @returns 响应体。
   */
  async expect(path, options = {}) {
    const { status, ok, body } = await this.request(path, options);
    if (ok) {
      if (body === undefined) {
        // 2xx 但体不是 JSON：对 expect 的调用方（都是拿结构化数据）属异常。
        throw new ChanhubError('upstream-bad-json', `网关返回了非 JSON 响应（HTTP ${status}）：${path}`, {
          status,
          path,
        });
      }
      return body;
    }
    const code = body?.error?.code;
    const message = body?.error?.message;
    if (typeof code === 'string' && typeof message === 'string') {
      throw new ChanhubError(
        code === 'invalid_api_key' ? 'auth-failed' : code,
        `网关拒绝请求（HTTP ${status}）：${message}`,
        { status },
      );
    }
    // 非 JSON 错误体（404/405 的纯文本）统一归 upstream-error 并带上状态码，
    // 让调用方能用 status 区分「未注册」与「其他错误」。
    throw new ChanhubError('upstream-error', `网关返回 HTTP ${status}：${path}`, { status, path });
  }

  /** 探活（无鉴权）。 */
  async healthz() {
    return this.expect('/healthz', { auth: false, timeoutMs: PROBE_TIMEOUT_MS });
  }

  /** 网关主状态。 */
  async status() {
    return this.expect('/status');
  }

  /**
   * 同步刷新：先向上游重取各账号余额并写回池，再返回 status（含 `refresh` 段）。
   *
   * 为什么面板刷新走它而不是 `/status`：`/status` 的 `credits` 是池内存缓存，
   * 只在签到/余额任务/单号查余额时更新 —— 默认排程下可能陈旧数小时，于是
   * 「点了刷新积分不动」。本端点把「重取余额 → 写回 → 返回 status」收成一次往返
   * （实测 3 账号 0.5s）。
   *
   * 需要 admin.enabled（它会真实打上游）。未开启时抛 admin-disabled，
   * 调用方降级到 status()。
   *
   * @returns status 响应（含 refresh 段）。
   */
  async refresh() {
    try {
      return await this.expect('/admin/refresh', { method: 'POST' });
    } catch (error) {
      if (
        error instanceof ChanhubError &&
        ((error.code === 'upstream-error' && error.details?.status === 404) ||
          (error.code === 'not_found' && error.details?.status === 404))
      ) {
        throw new ChanhubError(
          'admin-disabled',
          '网关未开启管理端点（admin.enabled）—— 刷新只能读缓存值，积分可能不是最新的。',
        );
      }
      throw error;
    }
  }

  /** 请求统计（本仓 chanhub HEAD 提供；部分部署未启用）。 */
  async stats() {
    return this.expect('/v1/stats');
  }

  /** 模型清单。 */
  async models() {
    return this.expect('/v1/models');
  }

  /**
   * 取一条路径在探测超时下的 HTTP 状态码（网络失败返回 0）。
   *
   * 为什么需要：chanhub 的能力随版本漂移（`cost_explore` 是后加的，
   * `/v1/stats` 在部分版本缺失）。前端只渲染探测通过的区块，
   * 而不是把「端点不存在」渲染成「加载失败」。
   *
   * @param path - 待探测路径。
   * @param options - `{method, auth, timeoutMs}`。
   * @returns 状态码；连不上时 0。
   */
  async routeStatus(path, options = {}) {
    try {
      const { status, body } = await this.request(path, {
        ...options,
        timeoutMs: options.timeoutMs ?? PROBE_TIMEOUT_MS,
      });
      return status;
    } catch {
      return 0;
    }
  }

  /**
   * 探测一次请求的完整形状（状态码 + 体是否为 JSON）。
   *
   * 为什么要看「体是不是 JSON」：Go 的 `ServeMux` 对**未注册**路径回纯文本 404，
   * 而 chanhub 自己的 handler 对**已注册**路径回 JSON 信封 404（如「账号不存在」）。
   * 两者状态码相同，只有 Content-Type 能区分 —— 这正是判断路由存在性的依据。
   *
   * @param path - 待探测路径。
   * @param options - `{method, timeoutMs}`。
   * @returns `{status, json, unreachable}`。
   */
  async routeShape(path, options = {}) {
    try {
      const { status, body } = await this.request(path, {
        ...options,
        timeoutMs: options.timeoutMs ?? PROBE_TIMEOUT_MS,
      });
      return { status, json: body !== undefined, unreachable: false };
    } catch {
      return { status: 0, json: false, unreachable: true };
    }
  }

  /**
   * 判断一条路径是否已被网关注册（不区分方法）。
   *
   * 依据 ServeMux 的**真机实测**行为（三种形态）：
   *
   *   路径未注册          → 404 + **纯文本**体
   *   路径已注册、方法不符 → 405
   *   路径已注册、方法相符 → 200/401/…（或业务 404 + **JSON** 信封）
   *
   * 所以不能只看状态码：已注册路径也可能回 404（例如「账号不存在」），
   * 它与「路由不存在」的唯一区别是体为 JSON。
   *
   * @param path - 待探测路径。
   * @param options - `{method, timeoutMs}`。
   * @returns true 表示路径已注册。
   */
  async routeExists(path, options = {}) {
    const shape = await this.routeShape(path, { method: 'GET', ...options });
    if (shape.unreachable) return false;
    if (shape.status === 405) return true; // 已注册但方法不符
    if (shape.status === 404) return shape.json; // JSON 404 = 已注册的业务 404
    return true; // 200/401/403 等都说明路由存在
  }

  /**
   * 逐套餐积分明细（chanhub 的新端点 GET /v1/accounts/{uid}/credits）。
   *
   * 网关没有该端点时（旧版本）返回 undefined，由调用方降级 —— 不报错，
   * 因为「该版本不支持示例细」与「请求失败」是两件事。
   *
   * @param uid - 账号 uid。
   * @returns 明细响应，或 undefined（端点不存在）。
   */
  async credits(uid) {
    if (typeof uid !== 'string' || uid === '') {
      throw new ChanhubError('bad-request', '缺少账号 uid');
    }
    try {
      return await this.expect(`/v1/accounts/${encodeURIComponent(uid)}/credits`);
    } catch (error) {
      if (error instanceof ChanhubError && error.code === 'upstream-error' && error.details?.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * 用量分桶（chanhub 的新端点 GET /v1/stats/buckets）。
   * @param window - `24h` / `72h` / `168h` / `720h`。
   * @returns 分桶响应，或 undefined（端点不存在）。
   */
  async usageBuckets(window = '72h') {
    const allowed = ['24h', '72h', '168h', '720h'];
    const value = allowed.includes(window) ? window : '72h';
    try {
      return await this.expect(`/v1/stats/buckets?window=${encodeURIComponent(value)}`);
    } catch (error) {
      if (error instanceof ChanhubError && error.code === 'upstream-error' && error.details?.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * 运行日志（chanhub 的新端点 GET /v1/logs，需 config logs.enabled=true）。
   *
   * @param options - `{channel, limit, clear}`。
   * @returns 日志响应，或 undefined（端点未注册 = 未开启）。
   */
  async logs(options = {}) {
    const params = new URLSearchParams();
    if (options.channel && options.channel !== 'all') params.set('channel', options.channel);
    if (options.limit) params.set('limit', String(options.limit));
    if (options.clear === true) params.set('clear', '1');
    const query = params.toString();
    try {
      return await this.expect(`/v1/logs${query === '' ? '' : `?${query}`}`);
    } catch (error) {
      if (error instanceof ChanhubError && error.code === 'upstream-error' && error.details?.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * 触发一类任务（chanhub 的新端点 POST /admin/tasks/{name}）。
   *
   * 语义：返回 `{started}`。409（已在运行）不是异常 —— 网关用状态码如实表达
   * 「同类任务正在跑，我没重复打上游」，故这里把它转成 `{started:false, busy:true}`。
   *
   * @param name - 任务名（checkin/travel/activity/keepalive/school/cat）。
   * @returns `{started, busy, note}`。
   */
  async triggerTask(name) {
    if (typeof name !== 'string' || name === '') {
      throw new ChanhubError('bad-request', '缺少任务名');
    }
    const path = `/admin/tasks/${encodeURIComponent(name)}`;
    let result;
    try {
      result = await this.request(path, { method: 'POST', body: {} });
    } catch (error) {
      throw new ChanhubError('upstream-unreachable', `无法连接网关：${error?.message ?? error}`);
    }
    if (result.status === 202) return { started: true, busy: false, note: result.body?.note };
    if (result.status === 409) return { started: false, busy: true, note: result.body?.error?.message };
    if (result.status === 404) {
      throw new ChanhubError(
        'admin-disabled',
        '网关未开启管理端点（或该版本没有任务端点）—— 需在 config.json 设置 admin.enabled=true 并重启网关。',
      );
    }
    const message = result.body?.error?.message ?? `网关返回 HTTP ${result.status}`;
    throw new ChanhubError(result.body?.error?.code ?? 'upstream-error', message, { status: result.status });
  }

  /**
   * 任务运行状态（chanhub 的新端点 GET /admin/tasks/status）。
   * @returns 状态响应，或 undefined（端点不存在）。
   */
  async taskStatus() {
    try {
      return await this.expect('/admin/tasks/status');
    } catch (error) {
      if (error instanceof ChanhubError && error.code === 'upstream-error' && error.details?.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * 成长任务进度（chanhub 新端点 GET /v1/accounts/{uid}/growth-tasks）。
   *
   * 两个下发口径已由网关合并（默认 + 小程序），mp 限定任务带 from_mp=true。
   *
   * @param uid - 账号 uid。
   * @returns 进度响应，或 undefined（端点不存在 = 旧版网关）。
   */
  async growthTasks(uid) {
    if (typeof uid !== 'string' || uid === '') {
      throw new ChanhubError('bad-request', '缺少账号 uid');
    }
    try {
      return await this.expect(`/v1/accounts/${encodeURIComponent(uid)}/growth-tasks`);
    } catch (error) {
      if (error instanceof ChanhubError && error.code === 'upstream-error' && error.details?.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * 成长码写操作（POST /admin/growth-tasks/{uid}/{action}，admin.enabled 门槛）。
   *
   * **写操作**：真实推进任务状态、真实打上游（accept 语义是「开始做」，
   * 部分码会引发真实对话副作用链——如对话类任务要真的打对话）。
   * 与只读查询（growthTasks）的门槛/风险面完全不同。
   *
   * claim 的幂等态（already_claimed）网关侧已归一为 OK + detail 说明，
   * 这里不重复判别。
   *
   * @param action - `accept` / `claim` / `claim-claimable`。
   * @param uid - 账号 uid。
   * @param codes - 任务码列表（claim-claimable 可省略，网关自查当前可领码）。
   * @returns 逐码结果 `{uid, ok, results:[{code, ok, detail}]}`。
   */
  async growthWrite(action, uid, codes) {
    if (!['accept', 'claim', 'claim-claimable'].includes(action)) {
      throw new ChanhubError('bad-request', `未知成长码操作：${action}`);
    }
    if (typeof uid !== 'string' || uid === '') {
      throw new ChanhubError('bad-request', '缺少账号 uid');
    }
    if (action !== 'claim-claimable') {
      if (!Array.isArray(codes) || codes.length === 0) {
        throw new ChanhubError('bad-request', '缺少任务码列表');
      }
    }
    const path = `/admin/growth-tasks/${encodeURIComponent(uid)}/${action}`;
    const body = action === 'claim-claimable' ? {} : { codes };
    try {
      return await this.expect(path, { method: 'POST', body });
    } catch (error) {
      if (error instanceof ChanhubError && error.code === 'upstream-error' && error.details?.status === 404) {
        throw new ChanhubError(
          'admin-disabled',
          '网关未开启管理端点 —— 需在 config.json 里设置 admin.enabled=true 并重启网关。',
        );
      }
      throw error;
    }
  }

  /**
   * 开学季子任务状态（chanhub 新端点 GET /v1/accounts/{uid}/school-tasks）。
   *
   * @param uid - 账号 uid。
   * @returns 状态响应，或 undefined（端点不存在 = 旧版网关）。
   */
  async schoolTasks(uid) {
    if (typeof uid !== 'string' || uid === '') {
      throw new ChanhubError('bad-request', '缺少账号 uid');
    }
    try {
      return await this.expect(`/v1/accounts/${encodeURIComponent(uid)}/school-tasks`);
    } catch (error) {
      if (error instanceof ChanhubError && error.code === 'upstream-error' && error.details?.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * 账号级管理动作。
   * @param action - `disable` / `enable` / `revive`。
   * @param uid - 账号 uid。
   * @param reason - 仅 disable 使用。
   * @returns 网关回执。
   */
  async accountAction(action, uid, reason) {
    if (!['disable', 'enable', 'revive'].includes(action)) {
      throw new ChanhubError('bad-request', `未知账号动作：${action}`);
    }
    if (typeof uid !== 'string' || uid === '') {
      throw new ChanhubError('bad-request', '缺少账号 uid');
    }
    const path = `/admin/accounts/${encodeURIComponent(uid)}/${action}`;
    try {
      return await this.expect(path, {
        method: 'POST',
        body: action === 'disable' ? { reason: reason ?? '' } : {},
      });
    } catch (error) {
      if (error instanceof ChanhubError) {
        // admin 端点未开启时，Go mux 对未注册路径返回纯文本 404。
        if (
          (error.code === 'upstream-error' && error.details?.status === 404) ||
          (error.code === 'not_found' && error.details?.status === 404)
        ) {
          throw new ChanhubError(
            'admin-disabled',
            '网关未开启管理端点 —— 需在 config.json 里设置 admin.enabled=true 并重启网关。',
          );
        }
      }
      throw error;
    }
  }

  /**
   * 经网关端点保存配置（POST /admin/config，P3）。
   *
   * 网关侧做完整 normalize 校验 + 原子写 + 可热改字段就地生效 ——
   * 优于本地文件直写（后者只能标「需重启」）。
   *
   * @param patch - 点路径 patch，如 `{ 'pool.max_in_flight': 4 }`。
   * @returns 成功时返回响应（含 hot_applied / restart_required 分流）；
   *   端点不存在（admin 未开启 / 网关旧版本）返回 null —— 调用方降级文件直写。
   * @throws ChanhubError 校验失败（validation_failed）等真错误向上抛。
   */
  async saveConfigViaGateway(patch) {
    try {
      return await this.expect('/admin/config', { method: 'POST', body: { patch: patch ?? {} } });
    } catch (error) {
      if (error instanceof ChanhubError) {
        // admin 未开启 / 未接线配置路径（旧网关）→ null = 降级，不是错误。
        if (error.code === 'admin-disabled' || error.details?.status === 404 || error.details?.status === 501) {
          return null;
        }
      }
      throw error;
    }
  }

  /**
   * 任务中心：全账号任务扫描（只读）。
   * @returns `{accounts: ScanAccountItem[]}`。
   */
  async taskScan() {
    return this.expect('/admin/tasks/scan');
  }

  /**
   * 任务中心：启动执行队列。
   * @param concurrency - 账号间并发数（1..4）。
   * @returns `{started, total, seq}`。
   */
  async taskQueueStart(concurrency) {
    return this.expect('/admin/tasks/queue/start', {
      method: 'POST',
      body: { concurrency: concurrency ?? 1 },
    });
  }

  /** 任务中心：队列状态轮询。 */
  async taskQueueStatus() {
    return this.expect('/admin/tasks/queue');
  }

  /** 开学季：全账号状态 + 抽奖余额（只读）。 */
  async schoolStatusAll() {
    return this.expect('/admin/school/status');
  }

  /** 开学季：全账号券码列表（只读）。 */
  async schoolVouchersAll() {
    return this.expect('/admin/school/vouchers');
  }

  /**
   * 添加账号：发起 OAuth 登录，返回授权 URL（浏览器由前端负责打开）。
   *
   * 网关端点 `POST /panel/api/login/start?channel=...`。支持的渠道与 realm：
   *   workbuddy → cn / global；traework、qoder → 仅 cn。
   * 网关版本较旧（只搬了 trae/qoder、没有 workbuddy 分支）时，workbuddy 会回
   * 400 `unknown channel` —— 如实抛 upstream-error，由调用方渲染「网关版本过旧」。
   *
   * traework 额外返回 `callback_url` 与 `needs_paste`：它的回调地址**必须**是
   * `http://127.0.0.1:<端口>/authorize`（Trae 授权页硬性校验，非 loopback 一律报
   * 「网络错误，请刷新页面重试。」），因此远端浏览器必然到不了 —— 面板据此提示
   * 用户把地址栏内容复制回来（见 loginCallback）。
   *
   * @param channel - 渠道名。
   * @param second - 渠道内的第二维：workbuddy 是 realm（`cn`/`global`），
   *                 qoder 是 site（`work`/`cn`/`global`）。
   * @returns `{status, url, realm?, callback_url?, needs_paste?}`。
   */
  async loginStart(channel, second) {
    const query = new URLSearchParams({ channel: channel ?? 'workbuddy' });
    // ★ qoder 的第二维是 **site** 且必须**恒显式带上**：它的默认是 work 而不是 cn，
    //   若沿用「cn 即省略」的哨兵，用户选 cn（QoderCN）会被网关按缺省解成 work。
    if (typeof second === 'string' && second !== '') {
      if (channel === 'qoder') query.set('site', second);
      else if (second !== 'cn') query.set('realm', second);
    }
    return this.expect(`/panel/api/login/start?${query.toString()}`, { method: 'POST' });
  }

  /**
   * 添加账号：轮询登录态。
   *
   * @param channel - 渠道名。
   * @param second - 渠道内的第二维（qoder 传 site，用于定位该站点的登录中间态文件）。
   * @returns `{status: 'pending'|'done'|'error', ...}`。
   */
  async loginPoll(channel, second) {
    const query = new URLSearchParams({ channel: channel ?? 'workbuddy' });
    if (channel === 'qoder' && typeof second === 'string' && second !== '') {
      query.set('site', second);
    }
    return this.expect(`/panel/api/login/poll?${query.toString()}`);
  }

  /**
   * 添加账号：把用户粘贴的回调交给网关（traework 唯一的完成路径）。
   *
   * 网关端点 `POST /panel/api/login/callback?channel=traework`，body
   * `{callback}` 为用户从地址栏复制的完整 URL（或裸 query）。
   *
   * @param channel - 渠道名。
   * @param callback - 回调 URL 或 query 原文。
   * @returns `{status: 'received'}` 或 `{status:'error', error}`。
   */
  async loginCallback(channel, callback) {
    const query = new URLSearchParams({ channel: channel ?? 'traework' });
    return this.expect(`/panel/api/login/callback?${query.toString()}`, {
      method: 'POST',
      body: { callback },
    });
  }

  /**
   * 已注册渠道（含可交互登录的子集与支持的 realm）。
   *
   * 旧网关无 `login_channels` 键：此时按 `channels` 兜底并**去掉 workbuddy**
   * ——旧版没有 workbuddy 登录分支，列出来只会引导用户点一个必然 400 的按钮。
   *
   * @returns `{channels, loginChannels, realms, sites}`。
   */
  async channels() {
    const body = await this.expect('/panel/api/channels');
    const all = Array.isArray(body?.channels) ? body.channels : [];
    const login = Array.isArray(body?.login_channels)
      ? body.login_channels
      : all.filter((c) => c !== 'workbuddy');
    const realms = Array.isArray(body?.realms) ? body.realms : ['cn'];
    // sites：渠道 → 站点清单（qoder 的 work/cn/global）。
    // ★ 必须透传：面板的站点选择器要它才拿得到 "work" —— 全局 realms 只有
    //   cn/global，只看 realms 会把 QoderWork 站点过滤掉。
    // 旧网关无此字段 → 空对象，面板回落到 realms（与旧网关能力一致，不编造）。
    const sites = body?.sites && typeof body.sites === 'object' ? body.sites : {};
    return { channels: all, loginChannels: login, realms, sites };
  }

  /**
   * 单号定向签到/余额/移除（admin 门槛）。
   * @param action - `checkin` / `balance` / `remove`。
   */
  async accountActionMore(action, uid) {
    if (!['checkin', 'balance', 'remove'].includes(action)) {
      throw new ChanhubError('bad-request', `未知账号操作：${action}`);
    }
    if (typeof uid !== 'string' || uid === '') {
      throw new ChanhubError('bad-request', '缺少账号 uid');
    }
    try {
      return await this.expect(`/admin/accounts/${encodeURIComponent(uid)}/${action}`, {
        method: 'POST',
        body: {},
      });
    } catch (error) {
      if (error instanceof ChanhubError && error.code === 'upstream-error' && error.details?.status === 404) {
        // 区分「账号不存在」与「admin 未开启」：后者是纯文本 404 的路径级判定
        // 已由 expect 归为 upstream-error；这里把账号级 404（JSON 信封）透传。
        if (error.details?.json === true) throw error;
        throw new ChanhubError('admin-disabled',
          '网关未开启管理端点 —— 需在 config.json 里设置 admin.enabled=true 并重启网关。');
      }
      throw error;
    }
  }

  /**
   * 版本/能力探测（缓存 60s）。
   *
   * 三层证据，缺一层就如实降级：
   *   1. `/healthz` 的 `service` 必须是 `chanhub2api`（确认连的是本网关，而不是别的
   *      服务、也不是没重建的旧容器）；
   *   2. `/status` 的顶层键（`cost_explore` 等后加字段是否存在）；
   *   3. 可选端点的存在性（`/v1/stats`、`/admin/*`）。
   *
   * @param options - `{force}` 忽略缓存。
   * @returns 探测结果。
   */
  async versionProbe(options = {}) {
    const now = Date.now();
    if (!options.force && this.probeCache && now - this.probeCache.at < VERSION_PROBE_TTL_MS) {
      return this.probeCache.value;
    }

    const probe = {
      at: now,
      baseURL: this.config().baseURL,
      reachable: false,
      isChanhub: false,
      service: undefined,
      realmServable: undefined,
      statusKeys: [],
      features: {},
      // loginChannels / loginRealms 由 /panel/api/channels 填充（features.loginApi 为真时有意义）。
      // 初始化成空数组而非 undefined：面板可直接 .length / .map 而不必先判空。
      loginChannels: [],
      loginRealms: [],
      errors: [],
    };

    try {
      const health = await this.healthz();
      probe.reachable = true;
      probe.service = health?.service;
      probe.isChanhub = health?.service === EXPECTED_SERVICE;
      probe.realmServable = health?.realm_servable;
      if (!probe.isChanhub) {
        probe.errors.push({
          code: 'not-chanhub',
          message: `该地址的 /healthz 未报告 service=${EXPECTED_SERVICE}（实际为 ${JSON.stringify(health?.service)}）；若对端是旧容器，请在 plugins/chanhub 执行 docker compose up -d --build 重建`,
        });
      }
    } catch (error) {
      probe.errors.push({ code: error.code ?? 'probe-failed', message: error.message });
      this.probeCache = { at: now, value: probe };
      return probe;
    }

    try {
      const status = await this.status();
      probe.statusKeys = Object.keys(status ?? {});
      probe.features.costExplore = 'cost_explore' in (status ?? {});
      probe.features.realmTotals = 'realm_totals' in (status ?? {});
      probe.features.stickySessions = 'sticky_sessions' in (status ?? {});
      probe.features.redisMode = 'redis_mode' in (status ?? {});
      const accounts = Array.isArray(status?.accounts) ? status.accounts : [];
      const sample = accounts[0] ?? {};
      for (const key of [
        'manual_disabled',
        'cool_kind',
        'cool_remaining_sec',
        'err_total',
        'soft_streak',
        'rate_limited_models',
        'model_costs',
        'credits_expiring',
        'channel',
      ]) {
        probe.features[key] = key in sample;
      }
    } catch (error) {
      probe.errors.push({ code: error.code ?? 'status-failed', message: error.message });
    }

    probe.features.stats = await this.routeExists('/v1/stats');
    probe.features.models = await this.routeExists('/v1/models');
    // 管理端点：条件注册（config admin.enabled）。用 GET 打一个 POST-only 路由，
    // 405 表示已注册，404 表示未开启 —— 该探测无副作用（不会真的改任何账号状态）。
    probe.features.admin = await this.routeExists('/admin/accounts/__probe__/revive');
    // chanhub 新增能力（本插件配套的后端端点）：
    //   usageBuckets / logs / credits 是只读端点，任务端点在 admin 门槛内。
    // 用「方法不符 → 405」判存在性，同样无副作用（不会真的触发任务或写配置）。
    probe.features.usageBuckets = await this.routeExists('/v1/stats/buckets');
    probe.features.logs = await this.routeExists('/v1/logs');
    probe.features.credits = await this.routeExists('/v1/accounts/__probe__/credits');
    probe.features.growthTasks = await this.routeExists('/v1/accounts/__probe__/growth-tasks');
    probe.features.schoolTasks = await this.routeExists('/v1/accounts/__probe__/school-tasks');
    probe.features.tasks = await this.routeExists('/admin/tasks/status');
    // 添加账号能力（/panel/api/*）：不只是「路由在不在」，还要知道**哪些渠道能登录**。
    // 旧网关（只搬了 trae/qoder）同样注册 /panel/api/channels，却对 workbuddy 回 400，
    // 故必须读 login_channels 而不能只探路由存在性——否则面板会给出一个必然失败的按钮。
    try {
      const ch = await this.channels();
      probe.features.loginApi = true;
      probe.loginChannels = ch.loginChannels;
      probe.loginRealms = ch.realms;
      probe.loginSites = ch.sites;
    } catch {
      probe.features.loginApi = false;
      probe.loginChannels = [];
      probe.loginRealms = [];
    }

    this.probeCache = { at: now, value: probe };
    return probe;
  }
}

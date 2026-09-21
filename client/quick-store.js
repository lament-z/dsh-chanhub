// dsh-chanhub —— 侧边栏快捷入口的状态层（无 DOM 依赖，可单测）
//
// 为什么单独一层：footer 按钮（角标）与 popover（数字/卡片）必须读**同一份快照**，
// 否则会出现「按钮说 5/5，popover 说 4/5」这种自相矛盾。轮询节奏、页面隐藏暂停、
// 失败退避、陈旧判定也都只应有一份实现。
//
// 纪律（与面板一致，别在这里破例）：
//   - 自动路径只打**只读**端点：getStatus(/status) 与 getUsage(/v1/stats/buckets)；
//   - `refreshStatus` 会真打上游（/admin/refresh）→ **只有用户点击**才允许调用；
//   - 网关不可达时给 error 态，**不返回 0 或空对象**冒充数据。
//
// 用量窗口是**滚动 24h**（网关 parseWindow 口径），文案不能写「今日」。

import { ENDPOINTS } from './endpoints.js';

/** 常驻轮询间隔（`/status` 是本地读，成本可忽略；60s 足够看住可用性）。 */
export const QUICK_POLL_MS = 60_000;
/** 超过这个时间没成功刷新 → stale（黄标），提醒数字可能旧了。 */
export const QUICK_STALE_MS = 120_000;
/** 用量快照 TTL：popover 反复开合不必重复拉。 */
export const QUICK_USAGE_TTL_MS = 60_000;
/** 连续失败达阈值后的退避时长（避免网关挂了还每分钟打）。 */
export const QUICK_BACKOFF_MS = 300_000;
/** 触发退避的连续失败次数。 */
export const QUICK_FAIL_THRESHOLD = 3;
/** 手动真刷新后暂停自动轮询的窗口（避免立刻又打一次）。 */
export const QUICK_MANUAL_QUIET_MS = 5_000;
/** 辅助数据（网关 config.json / 凭证盘点）的 TTL —— 变化很慢，别跟着 60s 轮询打。 */
export const QUICK_AUX_TTL_MS = 600_000;

/**
 * 由快照推出新鲜度四态。
 * @param snapshot - store 快照。
 * @param now - 当前毫秒时间戳。
 * @returns `'loading' | 'fresh' | 'stale' | 'error'`。
 */
export function quickFreshness(snapshot, now = Date.now()) {
  if (!snapshot) return 'loading';
  if (snapshot.error) return 'error';
  if (!snapshot.fetchedAt) return 'loading';
  return now - snapshot.fetchedAt > QUICK_STALE_MS ? 'stale' : 'fresh';
}

/**
 * 建一个侧边栏数据 store。
 *
 * @param rpcCall - `(endpoint, payload, signal) => Promise<{ok,value,error}>`。
 * @param options - `{ pollMs, now, document }`（测试注入用）。
 * @returns store 实例。
 */
export function createQuickStore(rpcCall, options = {}) {
  const pollMs = options.pollMs ?? QUICK_POLL_MS;
  const now = options.now ?? (() => Date.now());
  const doc = options.document ?? (typeof document === 'undefined' ? undefined : document);
  const usageTtlMs = options.usageTtlMs ?? QUICK_USAGE_TTL_MS;
  const manualQuietMs = options.manualQuietMs ?? QUICK_MANUAL_QUIET_MS;

  let snapshot = {
    phase: 'loading', // loading | fresh | stale | error
    status: undefined, // /status 正文
    baseURL: '',
    probe: undefined,
    error: undefined,
    fetchedAt: 0,
    failures: 0,
    degraded: false, // 是否处于退避期（通知 UI 别期待自动恢复）
    usage: undefined,
    usageAvailable: undefined,
    usageReason: undefined,
    usageAt: 0,
    /** 网关 config.json（只为 `pool.max_in_flight*` 分档分母；读不到就降级为无上限显示）。 */
    config: undefined,
    /** 凭证盘点（只为「到期」用凭证 expiresAt 优先）；读不到就回落到积分套餐到期。 */
    authAccounts: undefined,
    auxAt: 0,
    refreshing: false,
    refreshError: undefined,
    lastRefreshAt: 0,
  };
  const listeners = new Set();
  let timer;
  let inFlight;
  let disposed = false;
  let visibleListener;
  let quietUntil = 0;

  const emit = () => {
    const next = { ...snapshot, phase: quickFreshness(snapshot, now()), degraded: snapshot.degraded };
    snapshot = next;
    for (const listener of [...listeners]) {
      try {
        listener(snapshot);
      } catch {
        // 单个订阅者抛错不能拖垮轮询
      }
    }
  };

  const patch = (part) => {
    snapshot = { ...snapshot, ...part };
    emit();
  };

  /** 只读拉一次 /status（并发去重：同一时刻只允许一个在途请求）。 */
  async function loadStatus() {
    if (disposed || inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const result = await rpcCall(ENDPOINTS.getStatus, {});
        if (disposed) return;
        if (!result || result.ok === false) {
          throw new Error(result?.error?.message ?? 'RPC 调用失败');
        }
        const value = result.value ?? {};
        if (value.reachable === false) {
          patch({
            status: undefined,
            baseURL: value.baseURL ?? snapshot.baseURL,
            probe: value.probe,
            error: value.error ?? { code: 'unreachable', message: '网关不可达' },
            fetchedAt: 0,
            failures: snapshot.failures + 1,
          });
          return;
        }
        if (value.error) {
          // 探活通了但取状态失败（多为鉴权）——与「没启动」区分开。
          patch({
            status: undefined,
            baseURL: value.baseURL ?? snapshot.baseURL,
            probe: value.probe,
            error: value.error,
            fetchedAt: 0,
            failures: snapshot.failures + 1,
          });
          return;
        }
        patch({
          status: value.status,
          baseURL: value.baseURL ?? snapshot.baseURL,
          probe: value.probe,
          error: undefined,
          fetchedAt: now(),
          failures: 0,
          degraded: false,
        });
      } catch (error) {
        if (disposed) return;
        patch({
          error: { code: error?.code ?? 'unexpected', message: String(error?.message ?? error) },
          failures: snapshot.failures + 1,
        });
      } finally {
        inFlight = undefined;
        emit();
      }
    })();
    return inFlight;
  }

  /** 按需拉用量（滚动 24h）。 */
  async function loadUsage({ force = false } = {}) {
    if (disposed) return;
    if (!force && snapshot.usage && now() - snapshot.usageAt < usageTtlMs) return;
    try {
      const result = await rpcCall(ENDPOINTS.getUsage, { window: '24h' });
      if (disposed) return;
      if (!result || result.ok === false) {
        patch({ usageAvailable: false, usageReason: result?.error?.message ?? '用量不可用', usageAt: now() });
        return;
      }
      const value = result.value ?? {};
      patch({
        usage: value.available === false ? undefined : value.usage,
        usageAvailable: value.available !== false,
        usageReason: value.reason,
        usageAt: now(),
      });
    } catch (error) {
      if (disposed) return;
      patch({ usageAvailable: false, usageReason: String(error?.message ?? error), usageAt: now() });
    }
  }

  /**
   * 辅助数据：网关 config.json（在途上限分档分母）+ 凭证盘点（到期口径）。
   *
   * 两者都**可失败**：读不到时界面降级（不画在途条分母 / 到期回落到积分套餐），
   * 绝不让辅助数据把主状态拖成 error。
   */
  async function loadAux({ force = false } = {}) {
    if (disposed) return;
    if (!force && snapshot.auxAt && now() - snapshot.auxAt < (options.auxTtlMs ?? QUICK_AUX_TTL_MS)) return;
    const [configResult, accountsResult] = await Promise.all([
      rpcCall(ENDPOINTS.getConfig, {}).catch((error) => ({ ok: false, error: { message: String(error?.message ?? error) } })),
      rpcCall(ENDPOINTS.getAccounts, {}).catch(() => ({ ok: false })),
    ]);
    if (disposed) return;
    const configValue = configResult?.ok === false ? undefined : configResult?.value;
    const accountsValue = accountsResult?.ok === false ? undefined : accountsResult?.value;
    patch({
      config: configValue?.ok === false ? undefined : configValue?.config,
      authAccounts: Array.isArray(accountsValue?.accounts) ? accountsValue.accounts : snapshot.authAccounts,
      auxAt: now(),
    });
  }

  /**
   * 手动真刷新（**唯一**会打上游的路径）：先重取余额写回池，再拿新 status。
   * @returns 是否成功。
   */
  async function refreshUpstream() {
    if (disposed || snapshot.refreshing) return false;
    patch({ refreshing: true, refreshError: undefined });
    try {
      const result = await rpcCall(ENDPOINTS.refreshStatus, {});
      if (disposed) return false;
      if (!result || result.ok === false) {
        patch({ refreshing: false, refreshError: result?.error ?? { message: '刷新失败' } });
        return false;
      }
      const value = result.value ?? {};
      patch({
        refreshing: false,
        status: value.status ?? snapshot.status,
        baseURL: value.baseURL ?? snapshot.baseURL,
        error: value.reachable === false ? value.error ?? { message: '网关不可达' } : undefined,
        refreshError: value.refreshed === false ? value.refreshError ?? { message: '刷新未完成' } : undefined,
        fetchedAt: value.status ? now() : snapshot.fetchedAt,
        failures: 0,
        lastRefreshAt: now(),
      });
      // 余额变了 → 用量视图也跟着过期
      void loadUsage({ force: true });
      quietUntil = now() + manualQuietMs;
      return true;
    } catch (error) {
      if (disposed) return false;
      patch({ refreshing: false, refreshError: { message: String(error?.message ?? error) } });
      return false;
    } finally {
      schedule();
    }
  }

  function schedule() {
    if (disposed || !timer) return;
    clearTimeout(timer);
    timer = setTimeout(tick, pollMs);
    // Node（单测）里避免定时器把进程吊住
    if (typeof timer?.unref === 'function') timer.unref();
  }

  async function tick() {
    if (disposed) return;
    if (doc?.visibilityState === 'hidden') {
      schedule();
      return;
    }
    if (now() < quietUntil) {
      schedule();
      return;
    }
    if (snapshot.failures >= QUICK_FAIL_THRESHOLD) {
      // 退避：网关大概率挂了，别每分钟打
      timer = setTimeout(tick, QUICK_BACKOFF_MS);
      if (typeof timer?.unref === 'function') timer.unref();
      patch({ degraded: true });
      return;
    }
    await loadStatus();
    schedule();
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start() {
      if (disposed) return;
      if (!timer) {
        timer = setTimeout(tick, pollMs);
        if (typeof timer?.unref === 'function') timer.unref();
      }
      if (doc?.addEventListener && !visibleListener) {
        visibleListener = () => {
          if (doc.visibilityState === 'visible') void loadStatus().then(schedule);
        };
        doc.addEventListener('visibilitychange', visibleListener);
      }
      void loadStatus();
      void loadAux();
    },
    loadStatus,
    loadUsage,
    loadAux,
    refreshUpstream,
    dispose() {
      disposed = true;
      if (timer) clearTimeout(timer);
      timer = undefined;
      if (doc?.removeEventListener && visibleListener) {
        doc.removeEventListener('visibilitychange', visibleListener);
      }
      visibleListener = undefined;
      listeners.clear();
    },
  };
}

/**
 * 侧边栏入口偏好（宿主 settings 命名空间 `dsh-chanhub` 的 `sidebarEntry`）。
 *
 * 为什么走宿主 settings 而不是 localStorage：settings.yaml 是跨浏览器/跨设备的
 * 同一份真值，且这个命名空间已注册（schema 里加一个 boolean 即可），
 * 客户端用现成的 `ctx.settingsScope.bind()` 读写，**不需要新端点**。
 *
 * @param settingsScope - 客户端 settingsScope 服务（可能不存在 → 降级为只读默认值）。
 * @param options - `{ namespace, key, defaultValue }`。
 * @returns `{ available, writable, mode, value, set, subscribe, dispose }`。
 */
export function createSidebarPrefs(settingsScope, options = {}) {
  const namespace = options.namespace ?? 'dsh-chanhub';
  const key = options.key ?? 'sidebarEntry';
  const defaultValue = options.defaultValue ?? true;

  if (!settingsScope || typeof settingsScope.bind !== 'function') {
    return {
      available: false,
      writable: false,
      mode: 'unavailable',
      value: defaultValue,
      set: async () => false,
      subscribe: () => () => {},
      dispose: () => {},
    };
  }

  const scope = settingsScope.bind({ namespace });
  const read = () => {
    const snap = scope.getSnapshot?.() ?? {};
    const value = snap?.value?.[key];
    return typeof value === 'boolean' ? value : defaultValue;
  };
  return {
    available: true,
    get writable() {
      const snap = scope.getSnapshot?.() ?? {};
      return snap.writable === true && snap.mode === 'host';
    },
    get mode() {
      return scope.getSnapshot?.()?.mode ?? 'unknown';
    },
    get value() {
      return read();
    },
    /** 写宿主设置；返回是否成功（失败时不改本地判断，交给订阅回流）。 */
    async set(next) {
      try {
        await scope.set?.(key, next);
        return true;
      } catch {
        return false;
      }
    },
    subscribe(listener) {
      const off = scope.subscribe?.(listener);
      return typeof off === 'function' ? off : () => {};
    },
    dispose() {
      scope.dispose?.();
    },
  };
}

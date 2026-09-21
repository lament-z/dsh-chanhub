// dsh-chanhub —— 用量页的数据获取与 SWR 缓存（浏览器侧）
//
// 参考 dsh-usage-panel 的 api.ts：把最近一次成功载荷存进 localStorage
// （带版本号 + 结构校验），刷新页面即刻渲染，后台再拉新的。
//
// 两条纪律（照搬参考实现，也都是真机上踩出来的）：
//   1. **刷新失败绝不伪装最新**：保留旧数据，但状态降级为 fallback，
//      界面如实显示「上次成功 hh:mm」。宁可显示旧数 + 时间戳，
//      也不要让用户以为看到的是刚刚的数。
//   2. **版本号不匹配即丢弃**：不用手维护字段白名单 —— 载荷结构一变，
//      版本号 +1 就能让旧缓存整体失效，不会出现「半新半旧」的渲染。

import { ENDPOINTS } from '../endpoints.js';

/** 缓存键版本。载荷结构变更时 +1（旧缓存自动失效，无需迁移代码）。 */
export const USAGE_CACHE_VERSION = 1;

const CACHE_KEY = `dsh-chanhub:usage:v${USAGE_CACHE_VERSION}`;

/**
 * 结构校验：只接受**每个字段都在**的载荷。
 *
 * 为什么不用 try/catch 包住整个渲染：坏缓存若漏进来，渲染期抛错会让
 * 整块面板白屏。在入口拒掉比在渲染期兜底便宜得多。
 *
 * @param value - 反序列化后的值。
 * @returns 是否可用。
 */
export function isUsableCache(value) {
  if (!value || typeof value !== 'object') return false;
  if (value.version !== USAGE_CACHE_VERSION) return false;
  const payload = value.payload;
  if (!payload || typeof payload !== 'object') return false;
  const usage = payload.usage;
  if (!usage || typeof usage !== 'object') return false;
  if (!Array.isArray(usage.buckets)) return false;
  if (!usage.total || typeof usage.total !== 'object') return false;
  if (!Array.isArray(usage.by_uid) || !Array.isArray(usage.by_model)) return false;
  if (typeof value.savedAt !== 'number') return false;
  return true;
}

/**
 * 读缓存。
 * @returns `{savedAt, payload}` 或 null（无缓存 / 坏缓存 / 存储被禁）。
 */
export function loadCachedUsage() {
  try {
    const raw = storage()?.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isUsableCache(parsed) ? parsed : null;
  } catch {
    // 存储被禁（无痕 / iframe 限制）或内容损坏：面板照常工作，只是没有缓存。
    return null;
  }
}

/**
 * 写缓存。
 * @param payload - `{available, usage, stats, at}` 形状的载荷。
 */
export function saveCachedUsage(payload) {
  try {
    storage()?.setItem(
      CACHE_KEY,
      JSON.stringify({ version: USAGE_CACHE_VERSION, savedAt: Date.now(), payload }),
    );
  } catch {
    // 配额满 / 存储被禁：静默降级为无缓存。
  }
}

/** 清缓存（导出菜单的「清除本地缓存」用）。 */
export function clearCachedUsage() {
  try {
    storage()?.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * localStorage 解析。
 *
 * 真实浏览器里 `globalThis === window`，直接取即可；但无头渲染（node --test
 * 的 jsdom 环境）里 `window` 是单独的对象，`globalThis.localStorage` 不存在
 * —— 必须回退到 `window.localStorage`，否则 SWR 缓存永远写不进去。
 *
 * @returns Storage 或 undefined（被禁/无痕）。
 */
function storage() {
  try {
    return globalThis.localStorage ?? globalThis.window?.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * 拉取用量页所需的三份数据（窗口分桶 + 进程累计 + 账号池）。
 *
 * 一次拉 `720h`（网关保留上限）：范围切换因此可以纯前端切片，不再每切一次
 * 就重拉 7 个端点。**代价**是分桶行数变多 —— 网关的槽数上界是
 * 78（48 小时槽 + 30 日槽）× realm × uid × model，实测个位数账号时
 * 仍在数十行量级。
 *
 * @param rpcCall - `(endpoint, payload) => Promise<信封>`。
 * @returns `{available, usage, stats, reason}`。
 */
export async function fetchUsage(rpcCall) {
  const [usageResult, statsResult] = await Promise.all([
    rpcCall(ENDPOINTS.getUsage, { window: '720h' }),
    rpcCall(ENDPOINTS.getStats, {}),
  ]);

  if (usageResult?.ok === false) {
    const error = new Error(usageResult?.error?.message ?? '加载失败');
    error.code = usageResult?.error?.code;
    throw error;
  }

  const value = usageResult?.value ?? null;
  return {
    available: value?.available === true,
    usage: value?.usage ?? null,
    reason: value?.reason ?? '',
    stats: statsResult?.value?.available ? statsResult.value.stats : null,
  };
}

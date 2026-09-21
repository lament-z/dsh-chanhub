// dsh-chanhub —— 网关 config.json 读写（宿主侧，仅同机可用）
//
// 背景（`.scratch/chanhub-panel/inventory.md` §C）：
//   chanhub **没有**任何配置写端点（已 grep 确认）。配置就是本地 config.json 文件。
//   所以「面板改配置」的正确路径是**文件层**，不是 HTTP 层。
//
// 由此产生两条硬约束，必须如实呈现给用户，不能假装能做到：
//   1. 只有插件宿主与网关**同机**时才能读写；远程部署下只有只读展示（L3）。
//   2. 容器部署常见 `./config.json:/app/config.json:ro`（只读挂载）→ 写不进去。
//      此时必须显式报错并给出「改为可写挂载」的引导，而不是静默失败。
//
// 写入用 tmp + rename 原子替换，避免网关切在半个文件上。

import { readFile, writeFile, rename, access, stat } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { getPath, setPath, validatePatch } from './config-spec.js';

/**
 * 常见部署形态下 config.json 的候选路径。
 *
 * 为什么要探测：容器里看到的 `/app/config.json` 是**容器内路径**，
 * 宿主插件需要的是**挂载源路径**（`docker inspect` 的 Mounts[].Source）。
 * 本环境无 docker CLI 可用（已验证），所以退化为「常见位置探测 + 用户显式指定」。
 *
 * @param settings - settings 命名空间的值（可含显式 `gatewayConfigPath`）。
 * @returns 候选绝对路径列表（去重，显式配置排第一）。
 */
export function resolveConfigPathCandidates(settings = {}) {
  const candidates = [];
  if (typeof settings.gatewayConfigPath === 'string' && settings.gatewayConfigPath.trim() !== '') {
    const raw = settings.gatewayConfigPath.trim();
    candidates.push(isAbsolute(raw) ? raw : resolve(process.cwd(), raw));
  }

  const roots = [
    process.env.DSH_CHANHUB_DIR,
    join(homedir(), 'Desktop', 'DSHworkspace', 'plugins', 'chanhub'),
    join(homedir(), 'Desktop', 'others', 'workbuddy2api-panel'),
    process.env.DSH_CHANHUB_DIR ? dirname(process.env.DSH_CHANHUB_DIR) : undefined,
  ].filter((value) => typeof value === 'string' && value !== '');

  for (const root of roots) {
    candidates.push(join(root, 'config.json'));
    // container/panel 形态：配置在 conf/config.json
    candidates.push(join(root, 'conf', 'config.json'));
  }

  return [...new Set(candidates)];
}

/**
 * 第一个存在的候选路径。
 * @param candidates - 候选路径。
 * @returns 存在的路径，或 undefined。
 */
async function firstExisting(candidates) {
  for (const candidate of candidates) {
    try {
      await access(candidate, FS.R_OK);
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      // 不存在或不可读 → 试下一个
    }
  }
  return undefined;
}

/**
 * 探测 config.json 的位置与可写性。
 *
 * @param config - `{gatewayConfigPath}`。
 * @param settings - settings 值。
 * @returns `{found, path, candidates, writable, reason}`。
 */
export async function locateGatewayConfig(config = {}, settings = {}) {
  const candidates = resolveConfigPathCandidates({ ...settings, gatewayConfigPath: config.gatewayConfigPath ?? settings.gatewayConfigPath });
  const found = await firstExisting(candidates);
  if (found === undefined) {
    return {
      found: false,
      path: undefined,
      candidates,
      writable: false,
      reason:
        '未找到网关 config.json —— 插件宿主与网关可能不同机。请在插件设置里填写 gatewayConfigPath（宿主上的绝对路径）。',
    };
  }
  let writable = true;
  try {
    await access(found, FS.W_OK);
  } catch {
    writable = false;
  }
  return {
    found: true,
    path: found,
    candidates,
    writable,
    reason: writable
      ? undefined
      : 'config.json 存在但不可写 —— 容器常以 `:ro` 挂载（./config.json:/app/config.json:ro）。需在 docker-compose.yml 去掉 `:ro` 后重启容器，或直接编辑宿主文件。',
  };
}

/**
 * 读取网关配置（深拷贝，调用方可安全修改）。
 *
 * @param config - 运行时 config。
 * @param settings - settings 值。
 * @returns `{ok:true,path,writable,config}` 或 `{ok:false,code,message,candidates}`。
 */
export async function readGatewayConfig(config = {}, settings = {}) {
  const located = await locateGatewayConfig(config, settings);
  if (!located.found) {
    return { ok: false, code: 'config-not-found', message: located.reason, candidates: located.candidates };
  }
  try {
    const text = await readFile(located.path, 'utf8');
    const parsed = JSON.parse(text);
    return {
      ok: true,
      path: located.path,
      writable: located.writable,
      reason: located.reason,
      config: parsed,
    };
  } catch (error) {
    return {
      ok: false,
      code: 'config-unreadable',
      message: `读取 config.json 失败：${error?.message ?? error}`,
      path: located.path,
    };
  }
}

/**
 * 写入网关配置（原子替换）。
 *
 * 流程刻意保守：
 *   1. 先读原文件（保留 JSON 未知字段，只改 patch 涉及的路径）；
 *   2. 校验 patch（未知项 / 类型错误一律拒绝）；
 *   3. 写临时文件 → rename 覆盖。
 *
 * **这是降级路径**：首选是网关端点 `POST /admin/config`（写盘 + 字段级热应用），
 * 只有它 404/501（admin 关 / 旧网关）或报错时才落到这里。
 * **文件直写一次都热改不了** —— chanhub 没有配置热加载（无 fsnotify、无 SIGHUP），
 * 所以这里把**全部**被改字段如实标成 `restartRequired`，绝不拿 config-spec 的
 * `restart:false` 去宣称「已即时生效」（那会制造假象：网关根本没被通知）。
 * `hotCapable` 另列出「若网关端点可用本可热改」的字段，供 UI 提示修复方向。
 * 调用方（lib/index.js）会把网关失败原因经 options.gatewayError 透传进来，
 * 让面板说清「为什么这次保存全都需重启」。
 *
 * @param config - 运行时 config。
 * @param settings - settings 值。
 * @param patch - `{ 'pool.max_in_flight': 3, ... }`。
 * @param options - `{ gatewayError?: {code?, message?} }`：网关端点为何不可用。
 * @returns 写入结果。
 */
export async function writeGatewayConfig(config = {}, settings = {}, patch = {}, options = {}) {
  if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
    return { ok: false, code: 'bad-request', message: 'patch 必须是对象' };
  }
  if (Object.keys(patch).length === 0) {
    return { ok: false, code: 'bad-request', message: 'patch 为空，没有可写入的改动' };
  }

  const validated = validatePatch(patch);
  if (!validated.ok) {
    return { ok: false, code: 'validation-failed', errors: validated.errors, message: '配置校验未通过' };
  }

  const located = await locateGatewayConfig(config, settings);
  if (!located.found) {
    return { ok: false, code: 'config-not-found', message: located.reason, candidates: located.candidates };
  }
  if (!located.writable) {
    return { ok: false, code: 'config-readonly', message: located.reason, path: located.path };
  }

  let current;
  let originalText;
  try {
    originalText = await readFile(located.path, 'utf8');
    current = JSON.parse(originalText);
  } catch (error) {
    return {
      ok: false,
      code: 'config-unreadable',
      message: `读取现有 config.json 失败：${error?.message ?? error}`,
      path: located.path,
    };
  }

  // 只改 patch 涉及的路径，其余字段（含本插件未知的前瞻字段）原样保留。
  const next = structuredClone(current);
  const applied = [];
  for (const [path, value] of Object.entries(validated.values)) {
    const before = getPath(next, path);
    setPath(next, path, value);
    applied.push({ path, before, after: value });
  }

  // 后端 fail-fast 约束的预检：admin.enabled=true 且 api_key 空 → 网关拒绝启动。
  // 这里必须拦住，否则一次「保存」会让网关起不来。
  const adminEnabled = getPath(next, 'admin.enabled');
  const apiKey = getPath(next, 'api_key');
  if (adminEnabled === true && (typeof apiKey !== 'string' || apiKey === '')) {
    return {
      ok: false,
      code: 'startup-would-fail',
      message:
        '拒绝写入：admin.enabled=true 且 api_key 为空 —— chanhub 会拒绝启动（config.go 的 fail-fast）。请先设置 api_key。',
    };
  }

  const serialized = `${JSON.stringify(next, null, 2)}\n`;
  const tempPath = `${located.path}.dsh-chanhub.tmp`;
  try {
    await writeFile(tempPath, serialized, { encoding: 'utf8', mode: 0o600 });
    await rename(tempPath, located.path);
  } catch (error) {
    return {
      ok: false,
      code: 'config-write-failed',
      message: `写入失败：${error?.message ?? error}`,
      path: located.path,
    };
  }

  const appliedPaths = applied.map((item) => item.path);
  const gatewayError =
    options && typeof options === 'object' && options.gatewayError
      ? {
          code: options.gatewayError.code,
          message: String(options.gatewayError.message ?? options.gatewayError),
        }
      : undefined;
  return {
    ok: true,
    path: located.path,
    applied,
    viaGateway: false,
    // 降级路径：写盘成功 ≠ 生效 —— 网关没被通知，被改字段**全部**需重启。
    restartRequired: appliedPaths,
    restartRequiredCount: appliedPaths.length,
    hotApplicable: [],
    // 若网关端点可用，这批字段本可即时生效（给 UI 一个修复方向，不是生效承诺）。
    hotCapable: appliedPaths.filter((path) => !validated.restartRequired.includes(path)),
    ...(gatewayError ? { gatewayError } : {}),
    note:
      `已写入网关 config.json，但热生效端点不可用${gatewayError?.message ? `（${gatewayError.message}）` : ''}：` +
      '本路降级为文件直写，chanhub 不会重读文件，全部改动需重启网关才生效。',
  };
}

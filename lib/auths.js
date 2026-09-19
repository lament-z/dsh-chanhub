// dsh-chanhub —— 网关凭证文件读取（宿主侧，仅同机可用）
//
// 为什么需要读 auths/*.json：
//   「账号怎么区分渠道」这个需求的答案**不在任何 HTTP 接口里**。
//   已核实 `pool.Status`（internal/pool/entry.go:34）**没有 channel 字段**，
//   routeapi 的注释声称「账号分布见 /status（accounts[].channel）」是错的
//   （`internal/routeapi/routeapi.go:170`）。
//
//   渠道只能从凭证文件推断：`auth.channel` 显式声明优先，否则按 `auth.domain` 后缀。
//   推断规则与后端 `auth.ResolveChannel`（internal/auth/channel.go:53）**逐条对齐**，
//   两处判定必须一致，否则面板显示的渠道会与网关实际选路不符。
//
// 安全：**绝不回传 accessToken / refreshToken** —— 只取 uid / nickname / realm /
// channel / domain / expiresAt。这是只读盘点，不写任何文件。

import { readdir, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { homedir } from 'node:os';

/** 凭证文件名模式（与后端 `auth.AuthFileGlob = "workbuddy*.json"` 一致）。 */
const AUTH_FILE_PATTERN = /^workbuddy.*\.json$/;

/**
 * 猜测 auths 目录的候选位置。
 *
 * 与 gateway-config.js 同样的思路：容器里看到的 `/app/auths` 是容器内路径，
 * 宿主需要的是挂载源。本机实测挂载源是 `<repo>/auths`。
 *
 * @param config - `{gatewayConfigPath}`。
 * @param explicitDir - settings 里显式配置的目录。
 * @returns 候选绝对路径列表。
 */
export function authDirCandidates(config = {}, explicitDir = '') {
  const candidates = [];
  if (typeof explicitDir === 'string' && explicitDir.trim() !== '') {
    const raw = explicitDir.trim();
    candidates.push(isAbsolute(raw) ? raw : resolve(process.cwd(), raw));
  }

  // 网关配置常写 `auth_dir: "./auths"` —— 相对于**网关的工作目录**，
  // 而 config.json 通常就在那个目录里，所以以此为基准解析。
  const configPath = config?.gatewayConfigPath;
  if (typeof configPath === 'string' && configPath !== '') {
    candidates.push(join(dirname(configPath), 'auths'));
  }

  const roots = [
    process.env.DSH_CHANHUB_DIR,
    join(homedir(), 'Desktop', 'DSHworkspace', 'plugins', 'chanhub'),
    join(homedir(), 'Desktop', 'others', 'workbuddy2api-panel'),
  ].filter((value) => typeof value === 'string' && value !== '');
  for (const root of roots) candidates.push(join(root, 'auths'));

  return [...new Set(candidates)];
}

/**
 * 从 auth 文件的 JSON 解析出可展示字段（**不含任何 token**）。
 *
 * 同时兼容嵌套形（`{auth:{...}, account:{...}}`）与扁平形（顶层字段）——
 * 后端 `auth.parse` 两种都支持，面板也必须两种都认。
 *
 * @param raw - 文件文本。
 * @param fallbackUid - 从文件名推得的 uid（文件内没有时用）。
 * @returns 可展示凭证信息，或 undefined（解析失败）。
 */
export function parseAuthFile(raw, fallbackUid) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (parsed === null || typeof parsed !== 'object') return undefined;

  const nestedAuth = parsed.auth && typeof parsed.auth === 'object' ? parsed.auth : undefined;
  const nestedAccount = parsed.account && typeof parsed.account === 'object' ? parsed.account : undefined;
  const pick = (key) => nestedAuth?.[key] ?? parsed[key];
  const pickAccount = (key) => nestedAccount?.[key] ?? parsed[key];

  const uid = typeof pickAccount('uid') === 'string' && pickAccount('uid') !== ''
    ? pickAccount('uid')
    : fallbackUid;

  return {
    uid,
    nickname: typeof pickAccount('nickname') === 'string' ? pickAccount('nickname') : '',
    realm: typeof pick('realm') === 'string' ? pick('realm') : '',
    // channel / domain 是渠道推断的输入，原样带出（推断在客户端做，规则与后端一致）
    channel: typeof pick('channel') === 'string' ? pick('channel') : '',
    domain: typeof pick('domain') === 'string' ? pick('domain') : '',
    expiresAt: typeof pick('expiresAt') === 'number' ? pick('expiresAt') : undefined,
    enterpriseId:
      typeof pickAccount('enterpriseId') === 'string' ? pickAccount('enterpriseId') : '',
    // 只透出「有没有 token」，绝不透出 token 本身
    hasAccessToken: typeof pick('accessToken') === 'string' && pick('accessToken') !== '',
    hasRefreshToken: typeof pick('refreshToken') === 'string' && pick('refreshToken') !== '',
  };
}

/**
 * 读取凭证目录，返回可展示的账号渠道清单。
 *
 * @param config - 运行时 config（含 `gatewayConfigPath`）。
 * @param settings - settings 值（可含 `authDir`）。
 * @returns `{ok, dir, accounts, candidates}` 或 `{ok:false, code, message, candidates}`。
 */
export async function readAuthAccounts(config = {}, settings = {}) {
  const candidates = authDirCandidates(config, settings.authDir);
  let dir;
  for (const candidate of candidates) {
    try {
      const entries = await readdir(candidate);
      if (entries.some((entry) => AUTH_FILE_PATTERN.test(entry))) {
        dir = candidate;
        break;
      }
    } catch {
      // 不可读 → 试下一个
    }
  }
  if (dir === undefined) {
    return {
      ok: false,
      code: 'auth-dir-not-found',
      message:
        '未找到网关凭证目录（auths/*.json）—— 插件宿主与网关可能不同机。渠道只能在同机读取凭证文件时判定；否则一律按默认渠道 workbuddy 显示。',
      candidates,
    };
  }

  let entries;
  try {
    entries = await readdir(dir);
  } catch (error) {
    return {
      ok: false,
      code: 'auth-dir-unreadable',
      message: `读取凭证目录失败：${error?.message ?? error}`,
      dir,
    };
  }

  const accounts = [];
  const failed = [];
  for (const entry of entries) {
    if (!AUTH_FILE_PATTERN.test(entry)) continue;
    const fallbackUid = entry.replace(/^workbuddy-?/, '').replace(/\.json$/, '');
    try {
      const raw = await readFile(join(dir, entry), 'utf8');
      const info = parseAuthFile(raw, fallbackUid);
      if (info === undefined) {
        failed.push({ file: entry, reason: 'JSON 解析失败' });
        continue;
      }
      accounts.push(info);
    } catch (error) {
      failed.push({ file: entry, reason: String(error?.message ?? error) });
    }
  }

  return { ok: true, dir, accounts, failed };
}

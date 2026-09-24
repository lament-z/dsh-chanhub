// dsh-chanhub —— 「保持唤醒」宿主侧实现（caffeinate）
//
// 为什么在插件侧而不是网关侧：chanhub 网关跑在 Docker(Alpine) 容器里，容器内
// 既没有 caffeinate、也无法操作宿主机电源；而本插件运行在宿主机 Node 进程内，
// 有完整的子进程能力。网关侧因此零改动。
//
// 语义（用户明确要求）：状态**跨 Mac 重启不保留** —— 重启后一律归零为「关」，
// 只有用户手动打开时才对外服务。这是 fail-safe 方向：出任何意外都是
// 「服务下线」，而不是「机器永远不睡」。
//
// 实现靠 kern.boottime 守卫：状态文件里记下写入时的开机时刻。
//   - 插件 / DSH 重启（开机时刻未变）→ 恢复上次状态
//   - Mac 重启（开机时刻变了）        → 强制归零为「关」
//
// 孤儿 caffeinate 防护（不带 -t 的 caffeinate 会一直跑到被杀）：
//   a. spawn 时带 `-w <本进程 pid>`：宿主进程一退出，caffeinate 自己就退。
//      这是**主要防线**，从构造上消灭孤儿。
//   b. 每次 spawn 前按状态文件里的 pid 清理陈旧进程 —— 但只认带 `-w` 的
//      caffeinate（我们的签名），绝不误杀 dsh-sentry 那个带 `-t 28800` 的。
//   c. 插件启动即 reconcile，不信任文件里的 pid。
//   d. dispose（插件卸载）时主动 kill。

import { execFileSync, spawn } from 'node:child_process';
import { chmodSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/** 状态文件里 desired 的合法取值。 */
export const KEEPAWAKE_ON = 'on';
export const KEEPAWAKE_OFF = 'off';

/**
 * 状态文件路径（与插件既有的 model-catalog.json 同目录，保持一处约定）。
 * @param home - 用户主目录，默认 homedir()。
 * @returns 绝对路径。
 */
export function keepAwakeStatePath(home = homedir()) {
  return join(home, '.dsh', 'dsh-chanhub', 'keepawake.json');
}

/**
 * 读状态文件。不存在 / 损坏 / 字段非法一律返回 null（调用方按「关」处理）。
 *
 * 为什么不抛：这个文件是**运行态缓存**，不是用户配置。一个坏文件不应该让
 * 整个面板报错 —— 归零为「关」是安全方向，与语义一致。
 *
 * @param path - 状态文件路径。
 * @returns `{desired,pid,hostPid,since,boot}` 或 null。
 */
export function readKeepAwakeState(path) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const desired = parsed.desired === KEEPAWAKE_ON ? KEEPAWAKE_ON : KEEPAWAKE_OFF;
  return {
    desired,
    pid: Number.isInteger(parsed.pid) && parsed.pid > 0 ? parsed.pid : null,
    hostPid: Number.isInteger(parsed.hostPid) && parsed.hostPid > 0 ? parsed.hostPid : null,
    since: typeof parsed.since === 'string' && parsed.since ? parsed.since : null,
    boot: typeof parsed.boot === 'string' && parsed.boot ? parsed.boot : null,
  };
}

/**
 * 原子写状态文件（tmp + rename），权限 0600。
 * @param path - 状态文件路径。
 * @param state - `{desired,pid,hostPid,since,boot}`。
 */
export function writeKeepAwakeState(path, state) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  chmodSync(tmp, 0o600);
  renameSync(tmp, path);
}

/**
 * 读当前开机时刻标识。
 *
 * 取 `kern.boottime` 的 sec 字段：同一个开机会话内恒定，重启后必变。
 * 拿不到（非 darwin、sysctl 不可用）返回 null —— 调用方此时**不**做重启归零
 * 判定，避免因探测失败而误把用户的「开」抹掉。
 *
 * @returns 形如 `boot-1790233000` 的字符串，或 null。
 */
export function readBootId() {
  try {
    const out = execFileSync('sysctl', ['-n', 'kern.boottime'], {
      encoding: 'utf8',
      timeout: 3000,
    });
    const m = /\bsec\s*=\s*(\d+)/.exec(out);
    return m ? `boot-${m[1]}` : null;
  } catch {
    return null;
  }
}

/**
 * 判断某个 pid 是不是**我们自己**拉起的 caffeinate。
 *
 * 判别式（两个条件都要满足）：
 *   1. 命令名是 caffeinate
 *   2. 命令行里带 `-w`（我们的签名；dsh-sentry 用的是 `-t 28800`）
 *
 * 第 2 条是安全边界：没有它就会误杀 dsh-sentry 的 caffeinate，
 * 把「DSH 任务在跑时别睡」这个既有能力一起干掉。
 *
 * @param pid - 候选 pid。
 * @returns boolean。
 */
export function isOurCaffeinate(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    const out = execFileSync('ps', ['-o', 'command=', '-p', String(pid)], {
      encoding: 'utf8',
      timeout: 3000,
    });
    const cmd = out.trim();
    if (!/(^|\/)caffeinate\b/.test(cmd)) return false;
    return /(^|\s)-w(\s|$)/.test(cmd);
  } catch {
    // ps 非零退出 = 进程不存在，正是「不是我们的」。
    return false;
  }
}

/**
 * 创建保持唤醒控制器。
 *
 * 可注入项（全部有真实默认值，仅为可测性而存在）：
 *   - stateFile  状态文件路径
 *   - bootIdFn   开机时刻探测
 *   - spawnFn    子进程创建
 *   - killFn     按 pid 发信号（**必须可注入**：否则用例里造的假 pid 会打到真实
 *                进程上 —— 这个坑在写用例时真的踩到过，当时 6001~6006 恰好都不
 *                存在才没出事。注入后用例与真实进程彻底隔离。）
 *   - isOursFn   pid 归属判定
 *   - nowFn      时钟
 *   - selfPid    用于 `-w` 的宿主 pid
 *
 * @param options - 见上。
 * @returns `{status, set, reconcile, dispose, stateFile}`。
 */
export function createKeepAwake(options = {}) {
  const logger = options.logger;
  const stateFile = options.stateFile ?? keepAwakeStatePath();
  const bootIdFn = options.bootIdFn ?? readBootId;
  const spawnFn = options.spawnFn ?? spawn;
  const isOursFn = options.isOursFn ?? isOurCaffeinate;
  const killFn = options.killFn ?? ((pid) => process.kill(pid, 'SIGTERM'));
  const nowFn = options.nowFn ?? (() => new Date());
  const selfPid = options.selfPid ?? process.pid;

  /** 内存里的子进程句柄。插件重启后为 null，靠状态文件 + 归属判定恢复。 */
  let child = null;

  function killPid(pid, reason) {
    if (!Number.isInteger(pid) || pid <= 0) return false;
    if (!isOursFn(pid)) return false;
    try {
      killFn(pid);
      logger?.info?.('[dsh-chanhub] keepawake: 已结束陈旧 caffeinate pid=%d (%s)', pid, reason);
      return true;
    } catch (error) {
      logger?.warn?.(
        '[dsh-chanhub] keepawake: 结束 pid=%d 失败：%s',
        pid,
        error?.message ?? error,
      );
      return false;
    }
  }

  function killChild() {
    if (!child) return;
    try {
      child.kill('SIGTERM');
    } catch (error) {
      logger?.warn?.('[dsh-chanhub] keepawake: kill child 失败：%s', error?.message ?? error);
    }
    child = null;
  }

  /**
   * 拉起 caffeinate。
   *
   * `-i` 阻止空闲休眠，`-s` 阻止系统休眠（插电时生效），
   * `-w <宿主pid>` 让它在宿主进程退出时自行退出 —— 孤儿防护的主要防线。
   */
  function spawnCaffeinate() {
    const args = ['-i', '-s', '-w', String(selfPid)];
    const proc = spawnFn('caffeinate', args, {
      stdio: 'ignore',
      // 不 detach：保持与宿主的父子关系，便于随宿主一起被回收。
      detached: false,
    });
    proc.on?.('error', (error) => {
      logger?.warn?.('[dsh-chanhub] keepawake: caffeinate 启动失败：%s', error?.message ?? error);
      child = null;
    });
    proc.on?.('exit', () => {
      // 只清理指向自己的句柄，避免把后来者覆盖掉。
      if (child === proc) child = null;
    });
    proc.unref?.();
    child = proc;
    return proc.pid ?? null;
  }

  /**
   * 当前状态。
   *
   * active 的判定不信任内存句柄（插件可能刚重启），而是**从状态文件里的 pid
   * 反查进程是否真的在**。这样 UI 才能显示「已开启但未生效」这个异常态 ——
   * 少了它，用户会以为按住了，其实没有。
   */
  function status() {
    const state = readKeepAwakeState(stateFile);
    const desired = state?.desired === KEEPAWAKE_ON ? KEEPAWAKE_ON : KEEPAWAKE_OFF;
    const pid = state?.pid ?? null;
    const active = desired === KEEPAWAKE_ON && pid !== null && isOursFn(pid);
    const since = state?.since ?? null;
    const holdingMs =
      active && since ? Math.max(0, nowFn().getTime() - new Date(since).getTime()) : 0;
    return {
      desired,
      active,
      pid: active ? pid : null,
      since: active ? since : null,
      holdingMs,
      stateFile,
    };
  }

  /**
   * 切换保持唤醒。
   * @param on - true = 保持唤醒，false = 允许休眠。
   * @returns 切换后的 status()。
   */
  function set(on) {
    const boot = bootIdFn();
    const prev = readKeepAwakeState(stateFile);

    // 无论开还是关，都先把已知的陈旧进程清掉：开→避免叠加两个 caffeinate；
    // 关→确保真的释放（内存句柄可能已失效，pid 才是权威）。
    killChild();
    if (prev?.pid) killPid(prev.pid, 'set');

    if (on) {
      const pid = spawnCaffeinate();
      writeKeepAwakeState(stateFile, {
        desired: KEEPAWAKE_ON,
        pid,
        hostPid: selfPid,
        since: nowFn().toISOString(),
        boot,
      });
    } else {
      writeKeepAwakeState(stateFile, {
        desired: KEEPAWAKE_OFF,
        pid: null,
        hostPid: selfPid,
        since: null,
        boot,
      });
    }
    return status();
  }

  /**
   * 启动时对账。**不信任状态文件里的 pid**，只信「文件说的意图 + 进程实际在不在」。
   *
   * 两种归零路径：
   *   1. 开机时刻与记录不符 → Mac 重启过 → 强制归零（用户的明确要求）
   *   2. 记录说「开」但进程不在 → 补拉起（插件/DSH 重启，机器没重启）
   */
  function reconcile() {
    const state = readKeepAwakeState(stateFile);
    if (!state || state.desired !== KEEPAWAKE_ON) {
      // 没有记录、或记录就是「关」：清掉可能残留的进程，保持关。
      if (state?.pid) killPid(state.pid, 'reconcile-off');
      return status();
    }

    const bootNow = bootIdFn();
    if (state.boot && bootNow && state.boot !== bootNow) {
      logger?.info?.(
        '[dsh-chanhub] keepawake: 检测到 Mac 重启（%s → %s），按语义归零为「关」',
        state.boot,
        bootNow,
      );
      if (state.pid) killPid(state.pid, 'reconcile-reboot');
      writeKeepAwakeState(stateFile, {
        desired: KEEPAWAKE_OFF,
        pid: null,
        hostPid: selfPid,
        since: null,
        boot: bootNow,
      });
      return status();
    }

    // 开机时刻未变：若进程还活着就沿用，否则补拉起。
    if (state.pid && isOursFn(state.pid)) return status();
    const pid = spawnCaffeinate();
    writeKeepAwakeState(stateFile, { ...state, pid, hostPid: selfPid, boot: bootNow ?? state.boot });
    return status();
  }

  /** 插件卸载时释放：不留孤儿。 */
  function dispose() {
    killChild();
  }

  return { status, set, reconcile, dispose, stateFile };
}

/** 清掉状态文件（仅测试与排障用）。 */
export function clearKeepAwakeState(path) {
  rmSync(path, { force: true });
}

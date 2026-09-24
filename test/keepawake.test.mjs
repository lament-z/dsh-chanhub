// 「保持唤醒」宿主侧用例。
//
// 这组用例锁的是三件容易写歪的事：
//   1. **语义**：跨 Mac 重启必须归零为「关」（用户明确要求），靠 kern.boottime 守卫。
//   2. **误杀边界**：清理陈旧进程时只能杀带 `-w` 的（我们的签名），
//      绝不能碰 dsh-sentry 那个带 `-t 28800` 的 —— 那会把「DSH 任务在跑时别睡」
//      这个既有能力一起干掉。
//   3. **异常态可见**：desired=on 但进程不在时，status().active 必须是 false。
//      少了它 UI 会显示「已按住」，而机器其实会睡。
//
// 全部用注入的假 spawn / 假 kill / 假 pid 判定，不碰真实 caffeinate、
// 也不改真实机器电源状态。**kill 必须注入**：早期版本直接调 process.kill，
// 用例里造的假 pid 会打到真实进程上（当时恰好都不存在才没出事）。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createKeepAwake,
  isOurCaffeinate,
  keepAwakeStatePath,
  readBootId,
  readKeepAwakeState,
  writeKeepAwakeState,
} from '../lib/index.js';

const BOOT_A = 'boot-1000';
const BOOT_B = 'boot-2000';

/** 造一个临时状态文件路径。 */
function tempStateFile() {
  return join(mkdtempSync(join(tmpdir(), 'dsh-chanhub-ka-')), 'keepawake.json');
}

/**
 * 假 spawn + 假 kill + 假「进程还活着」判定，三者共享同一份存活集合，
 * 于是 set / reconcile 的进程语义可以被确定性地观察。
 */
function makeFakeProc() {
  const calls = [];
  const alive = new Set();
  const killed = [];
  let nextPid = 5000;

  const spawnFn = (cmd, args) => {
    const pid = (nextPid += 1);
    calls.push({ cmd, args, pid });
    alive.add(pid);
    return {
      pid,
      on() {},
      unref() {},
      kill() {
        alive.delete(pid);
        killed.push(pid);
      },
    };
  };

  const killFn = (pid) => {
    alive.delete(pid);
    killed.push(pid);
  };

  const isOursFn = (pid) => alive.has(pid);
  return { spawnFn, killFn, isOursFn, calls, alive, killed };
}

/** 用假件造一个控制器；selfPid 固定 777，便于断言 `-w 777`。 */
function makeKa(file, fake, { bootId = BOOT_A } = {}) {
  return createKeepAwake({
    stateFile: file,
    bootIdFn: () => bootId,
    spawnFn: fake.spawnFn,
    killFn: fake.killFn,
    isOursFn: fake.isOursFn,
    selfPid: 777,
  });
}

/** 直接落一份状态文件（模拟上一次会话留下的记录）。 */
function seed(file, { desired, pid, boot }) {
  writeKeepAwakeState(file, {
    desired,
    pid,
    hostPid: 777,
    since: desired === 'on' ? '2026-09-24T00:00:00.000Z' : null,
    boot,
  });
}

test('keepAwakeStatePath 落在插件的状态目录下（与 model-catalog.json 同处）', () => {
  assert.equal(keepAwakeStatePath('/Users/x'), '/Users/x/.dsh/dsh-chanhub/keepawake.json');
});

test('readKeepAwakeState：不存在 / 损坏 / 非法值一律安全降级', () => {
  const file = tempStateFile();
  assert.equal(readKeepAwakeState(file), null, '不存在 → null');

  writeFileSync(file, '{ not json');
  assert.equal(readKeepAwakeState(file), null, '损坏 → null');

  writeFileSync(file, JSON.stringify({ desired: 'ON', pid: -1 }));
  const s = readKeepAwakeState(file);
  assert.equal(s.desired, 'off', '未知 desired 归零为 off');
  assert.equal(s.pid, null, '非法 pid 归零为 null');
});

test('writeKeepAwakeState：原子写 + 0600 + 可回读', () => {
  const file = tempStateFile();
  seed(file, { desired: 'on', pid: 4242, boot: BOOT_A });

  assert.equal(statSync(file).mode & 0o777, 0o600, '状态文件权限必须是 0600');
  const back = readKeepAwakeState(file);
  assert.equal(back.desired, 'on');
  assert.equal(back.pid, 4242);
  assert.equal(back.boot, BOOT_A);
  assert.ok(readFileSync(file, 'utf8').endsWith('\n'), '以换行结尾，便于人工查看');
});

test('isOurCaffeinate：非法 pid 一律否（判别式不依赖本机真有进程）', () => {
  assert.equal(isOurCaffeinate(0), false, 'pid 0 直接否');
  assert.equal(isOurCaffeinate(-1), false, '负 pid 直接否');
  assert.equal(isOurCaffeinate(999999999), false, '不存在的 pid → false');
});

test('readBootId：本机可读时返回 boot-<sec> 形态', () => {
  const id = readBootId();
  if (process.platform !== 'darwin') {
    assert.equal(id, null, '非 darwin 应返回 null（调用方据此跳过重启归零判定）');
    return;
  }
  assert.match(id ?? '', /^boot-\d+$/, 'darwin 上应拿到 boot-<秒>');
});

test('set(true)：spawn 一次、记录 pid、状态为生效中', () => {
  const file = tempStateFile();
  const fake = makeFakeProc();
  const ka = makeKa(file, fake);

  const st = ka.set(true);
  assert.equal(fake.calls.length, 1, '只 spawn 一次');
  assert.equal(fake.calls[0].cmd, 'caffeinate');
  // -w <宿主pid> 是孤儿防护的主要防线：宿主一退，caffeinate 自己就退。
  assert.deepEqual(fake.calls[0].args, ['-i', '-s', '-w', '777']);
  assert.equal(st.desired, 'on');
  assert.equal(st.active, true);
  assert.equal(st.pid, fake.calls[0].pid);
  assert.ok(st.holdingMs >= 0);
});

test('set(false)：结束进程并落盘为关', () => {
  const file = tempStateFile();
  const fake = makeFakeProc();
  const ka = makeKa(file, fake);

  ka.set(true);
  const pid = fake.calls[0].pid;
  const st = ka.set(false);
  assert.equal(st.desired, 'off');
  assert.equal(st.active, false);
  assert.equal(st.pid, null);
  assert.ok(fake.killed.includes(pid), '必须真的把进程结束掉');
  assert.equal(fake.alive.size, 0, '不留存活进程');
});

test('reconcile：开机时刻变了 → 强制归零为「关」（用户明确要求的语义）', () => {
  const file = tempStateFile();
  const fake = makeFakeProc();
  seed(file, { desired: 'on', pid: 6001, boot: BOOT_A });
  fake.alive.add(6001);

  const ka = makeKa(file, fake, { bootId: BOOT_B }); // ← Mac 重启过
  const st = ka.reconcile();

  assert.equal(st.desired, 'off', '重启后必须归零');
  assert.equal(st.active, false);
  assert.equal(fake.calls.length, 0, '不得重新拉起');
  assert.ok(fake.killed.includes(6001), '残留进程要清掉');
});

test('reconcile：开机时刻未变 + 进程已死 → 补拉起（插件/DSH 重启场景）', () => {
  const file = tempStateFile();
  const fake = makeFakeProc();
  seed(file, { desired: 'on', pid: 6002, boot: BOOT_A });
  // 故意不让 6002 活着 —— 模拟插件重启后旧 caffeinate 已随宿主退出

  const st = makeKa(file, fake).reconcile();
  assert.equal(fake.calls.length, 1, '应补拉起一次');
  assert.equal(st.desired, 'on');
  assert.equal(st.active, true);
  assert.notEqual(st.pid, 6002, '用的是新 pid');
});

test('reconcile：开机时刻未变 + 进程还活着 → 沿用，不重复 spawn', () => {
  const file = tempStateFile();
  const fake = makeFakeProc();
  seed(file, { desired: 'on', pid: 6003, boot: BOOT_A });
  fake.alive.add(6003);

  const st = makeKa(file, fake).reconcile();
  assert.equal(fake.calls.length, 0, '不得重复 spawn');
  assert.equal(st.active, true);
  assert.equal(st.pid, 6003);
});

test('reconcile：记录为关时不拉起，并清掉可能的残留', () => {
  const file = tempStateFile();
  const fake = makeFakeProc();
  seed(file, { desired: 'off', pid: 6004, boot: BOOT_A });
  fake.alive.add(6004);

  const st = makeKa(file, fake).reconcile();
  assert.equal(fake.calls.length, 0);
  assert.equal(st.desired, 'off');
  assert.ok(fake.killed.includes(6004), '关态下的残留进程也要清');
});

test('异常态可见：desired=on 但进程不在 → active=false（UI 才能显示「未生效」）', () => {
  const file = tempStateFile();
  const fake = makeFakeProc();
  seed(file, { desired: 'on', pid: 6005, boot: BOOT_A });
  // 6005 不在存活集合里

  const st = makeKa(file, fake).status();
  assert.equal(st.desired, 'on', '意图如实保留');
  assert.equal(st.active, false, '未生效必须如实报告 —— 这是这个字段存在的全部意义');
  assert.equal(st.pid, null);
  assert.equal(st.holdingMs, 0, '未生效时不报持续时长');
});

test('set(true) 前先清陈旧进程，避免叠加两个 caffeinate', () => {
  const file = tempStateFile();
  const fake = makeFakeProc();
  seed(file, { desired: 'on', pid: 6006, boot: BOOT_A });
  fake.alive.add(6006);

  makeKa(file, fake).set(true);
  assert.ok(fake.killed.includes(6006), '旧的先杀');
  assert.equal(fake.alive.size, 1, '最终只有一个存活');
});

test('dispose 释放进程，不留孤儿', () => {
  const file = tempStateFile();
  const fake = makeFakeProc();
  const ka = makeKa(file, fake);

  ka.set(true);
  assert.equal(fake.alive.size, 1);
  ka.dispose();
  assert.equal(fake.alive.size, 0, 'dispose 后不得残留');
});

test('孤儿防护：spawn 参数必须带 -w（宿主退出即自退，这是主要防线）', () => {
  const file = tempStateFile();
  const fake = makeFakeProc();
  makeKa(file, fake).set(true);
  const args = fake.calls[0].args;
  assert.ok(args.includes('-w'), '缺 -w 就没有孤儿防护的主要防线');
  assert.equal(args[args.indexOf('-w') + 1], '777', '-w 后跟宿主 pid');
  assert.ok(!args.includes('-t'), '绝不能带 -t：那会重演「到期自己断了」的坑');
});

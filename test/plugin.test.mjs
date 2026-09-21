// 装载契约冒烟测试：校验 package.json / 命名声明 / 宿主入口的静态一致性。
//
// 注意分工：本文件只做**静态契约**核对。真实行为（RPC wire 契约、真实网关数据、
// 客户端渲染）由 rpc-channel.test.mjs / client-render.test.mjs /
// config-and-auths.test.mjs 覆盖 —— 原骨架里只有本文件，结果一个「handler 永不回包」
// 的致命缺陷能全绿通过，所以才拆开。

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const naming = JSON.parse(readFileSync(resolve(root, 'dsh-plugin.naming.json'), 'utf8'));

test('package.json 基本字段完整', () => {
  assert.equal(pkg.name, 'dsh-chanhub');
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.main, 'lib/index.js');
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml');
  assert.deepEqual(pkg.dsh.client.inject, [
    '@deepseek-ai/dsh-client-connection',
    '@deepseek-ai/dsh-client-ui-slots',
  ]);
  assert.equal(pkg.publishConfig.access, 'public');
  assert.ok(pkg.engines.node.includes('22'), 'engines 必须声明 Node 版本');
});

test('构建链完整：build:client 依赖 esbuild 且 prepack 会跑它（任务 00-C）', () => {
  assert.ok(pkg.scripts['build:client'], '缺 build:client 脚本');
  assert.ok(pkg.scripts.prepack, '缺 prepack 脚本');
  assert.match(pkg.scripts.prepack, /build:client/, 'prepack 必须构建客户端产物');
  assert.ok(pkg.devDependencies?.esbuild, '必须声明 devDependencies.esbuild（否则干净 clone 后构建失败）');
});

test('client/client.js 同时被 files 收录且不在 .gitignore（任务 00-B）', () => {
  // 这两条必须同时成立：只满足一个就会出现「tarball 缺 bundle」或
  // 「干净 clone 后 prepack 必失败」。dsh-bridge-gateway 的做法是产物 tracked。
  assert.ok(pkg.files.includes('client'), 'files 必须包含 client（含 client.js）');
  const gitignore = readFileSync(resolve(root, '.gitignore'), 'utf8');
  const lines = gitignore
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
  assert.ok(
    !lines.includes('client/client.js'),
    'client/client.js 不能出现在 .gitignore 里 —— 它与 files 白名单冲突，会让 pacote 打包时跳过该文件',
  );
});

test('dependencies 不含未使用的包（任务 00-D）', () => {
  // 原骨架声明了 @deepseek-ai/schemastery 却零 import —— 显式禁止回归。
  assert.deepEqual(pkg.dependencies ?? {}, {}, 'dependencies 应为空：本插件只用 Node 内置模块与宿主服务');
});

test('命名声明与 package 对齐，且不含幽灵事件（任务 07 的核对项）', () => {
  assert.equal(naming.plugin.packageName, 'dsh-chanhub');
  assert.equal(naming.plugin.coordinate, 'lament-z/chanhub');
  assert.ok(naming.names.pluginNames.includes('dsh-chanhub'));
  assert.ok(naming.names.loaderIds.includes('dsh-chanhub'));
  assert.ok(naming.names.settingsNamespaces.includes('dsh-chanhub'));

  // 声明的每个 surface 都必须在代码里真实存在
  const source = readFileSync(resolve(root, 'lib/index.js'), 'utf8');
  for (const name of naming.names.pluginNames) {
    assert.ok(source.includes(`'${name}'`), `pluginNames 里的 ${name} 在代码里不存在`);
  }
  // 事件：不得声明代码里没有的事件（原声明 dsh-chanhub/rpc 就是幽灵项）
  for (const event of naming.names.events ?? []) {
    assert.ok(source.includes(event), `events 里的 ${event} 在代码里不存在`);
  }
  // 路由：声明 prefix 与登记路径，且代码里确实注册了它
  const route = (naming.names.routes ?? [])[0];
  assert.ok(route, '必须声明 webServer 路由');
  assert.equal(route.kind, 'prefix');
  assert.equal(route.path, '/dsh-chanhub');
  assert.ok(source.includes(route.path), `routes 里的 ${route.path} 在代码里不存在`);
  // settings 命名空间必须在代码里注册
  for (const ns of naming.names.settingsNamespaces) {
    assert.ok(source.includes(`'${ns}'`), `settingsNamespaces 里的 ${ns} 在代码里不存在`);
  }
});

test('宿主入口导出 RPC 通道与全部端点', async () => {
  const mod = await import('../lib/index.js');
  assert.equal(mod.name, 'dsh-chanhub');
  assert.ok(Array.isArray(mod.inject) && mod.inject.includes('connection'));
  assert.equal(mod.CHANNEL, '/dsh-chanhub');
  assert.equal(typeof mod.apply, 'function');
  assert.equal(mod.SETTINGS_NAMESPACE, 'dsh-chanhub');
  for (const key of [
    'getStatus',
    'getModels',
    'getStats',
    'probe',
    'getConfig',
    'saveConfig',
    'getAccounts',
    'accountDisable',
    'accountEnable',
    'accountRevive',
    'serviceControl',
  ]) {
    assert.ok(mod.ENDPOINTS[key], `缺少 endpoint ${key}`);
  }
});

test('客户端与宿主共享同一通道名（构建期内联，改一边就会断）', () => {
  // 通道名/端点常量下沉到 client/endpoints.js：用量页拆到 client/usage/ 后要共用，
  // 留在入口文件会让 usage/* 反向 import 入口 —— 成环，打包后拿 undefined。
  const clientSource = readFileSync(resolve(root, 'client/endpoints.js'), 'utf8');
  const hostSource = readFileSync(resolve(root, 'lib/index.js'), 'utf8');
  assert.ok(clientSource.includes("export const CHANNEL = '/dsh-chanhub'"), '客户端通道名必须与宿主一致');
  assert.ok(hostSource.includes("export const CHANNEL = '/dsh-chanhub'"));
});

test('客户端端点常量与宿主导出逐一对应', async () => {
  const mod = await import('../lib/index.js');
  const clientSource = readFileSync(resolve(root, 'client/endpoints.js'), 'utf8');
  for (const value of Object.values(mod.ENDPOINTS)) {
    assert.ok(
      clientSource.includes(`${value}: '${value}'`) || clientSource.includes(`'${value}'`),
      `客户端未声明 endpoint ${value}`,
    );
  }
});

test('cordis.patch.yml 是单一 row 且 id 与包名一致', () => {
  const patch = readFileSync(resolve(root, 'cordis.patch.yml'), 'utf8');
  assert.match(patch, /id: dsh-chanhub/);
  assert.match(patch, /name: 'dsh-chanhub'/);
});

// host-channels.test.mjs 宿主侧 channels() 的字段透传契约。
//
// 回归背景（真机踩到）：channels() 把网关响应**白名单化**成
// { channels, loginChannels, realms }，把新增的 sites 字段丢掉了。
// 后果是静默的：面板站点选择器拿不到 "work"，只能回落到全局 realms（cn/global），
// 于是「QoderWork」站点选不到，选「国际版」时第二维也传不出去 —— 表现就是
// 「选了国际版，账号还是落在国内站点」。
//
// 这类「字段白名单漏项」不会报错、不会 panic，只会让功能悄悄降级，故用测试钉住。
import test from 'node:test';
import assert from 'node:assert/strict';

import { ChanhubClient } from '../lib/chanhub-client.js';

/** 构造一个 expect 被替换成固定响应的客户端（不发起真实 HTTP）。 */
function clientWith(body) {
  const c = new ChanhubClient({ resolveConfig: () => ({ baseUrl: 'http://127.0.0.1:1', apiKey: 'k' }) });
  c.expect = async () => body;
  return c;
}

test('channels()：透传 sites（qoder 站点选择器依赖它）', async () => {
  const c = clientWith({
    channels: ['workbuddy', 'traework', 'qoder'],
    login_channels: ['workbuddy', 'traework', 'qoder'],
    realms: ['cn', 'global'],
    sites: { qoder: ['work', 'cn', 'global'], workbuddy: ['cn', 'global'], traework: ['cn'] },
  });
  const got = await c.channels();

  assert.deepEqual(got.channels, ['workbuddy', 'traework', 'qoder']);
  assert.deepEqual(got.realms, ['cn', 'global']);
  // ★ 核心断言：sites 必须原样带出，否则 qoder 的 "work" 在面板侧不存在。
  assert.deepEqual(got.sites.qoder, ['work', 'cn', 'global'], 'channels() 必须透传 sites');
  assert.deepEqual(got.sites.traework, ['cn']);
});

test('channels()：旧网关无 sites → 空对象，不编造', async () => {
  const c = clientWith({ channels: ['qoder'], realms: ['cn'] });
  const got = await c.channels();
  assert.deepEqual(got.sites, {}, '旧网关应回落空对象而不是编造站点');
  // login_channels 缺失时的既有兜底不受影响（workbuddy 除外）。
  assert.deepEqual(got.loginChannels, ['qoder']);
});

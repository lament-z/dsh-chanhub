// dsh-chanhub —— 「能力目录比对」RPC 契约测试。
//
// 三条硬约束（用户决策）在这里钉死：
//   A. getModelCatalog **零网络、零写入** —— 只读本地 pi-ai + 缓存，不动任何 DSH 配置；
//   B. 只有 refreshModelCatalog 才联网，抓完落盘缓存（默认 ~/.dsh/dsh-chanhub/…）；
//   C. 判定用「L1 原厂 > L2 云托管 > L3 转售」加权，且把「白名单说图 / 目录说文」
//      单独报成 disagreements（缺口另报 gaps），不混成一个数。
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createHandler, ENDPOINTS, SETTINGS_DEFAULTS } from '../lib/index.js';
import { CATALOG_CACHE_VERSION, CATALOG_SOURCES } from '../lib/model-catalog.js';

const PROVIDER = 'chanhub2api';

const MODELS_DEV_FIXTURE = {
  moonshotai: { models: { 'kimi-k3': { id: 'kimi-k3', modalities: { input: ['text', 'image'] } } } },
  deepseek: { models: { 'deepseek-v4-flash': { id: 'deepseek-v4-flash', modalities: { input: ['text'] } } } },
  greenpt: {
    models: {
      // 转售商反对票：L3 说 kimi-k3 是纯文本，必须被 L1 压过
      'kimi-k3': { id: 'kimi-k3', modalities: { input: ['text'] } },
      // 白名单冲突用例：白名单里 workbuddy:cn:deepseek-v4.1-flash 是视觉，目录说纯文本
      'deepseek-v4.1-flash': { id: 'deepseek-v4.1-flash', modalities: { input: ['text'] } },
    },
  },
};

const OPENROUTER_FIXTURE = {
  data: [
    { id: 'moonshotai/kimi-k3', architecture: { input_modalities: ['text', 'image'] } },
    { id: 'reseller/glm-5.3', architecture: { input_modalities: ['text'] } },
  ],
};

/** 造 runtime：client 打点计数（用来证明「零网关调用」），缓存落到临时目录。 */
async function makeRuntime({ fetchImpl, pluginNs = {}, piAiDirs = ['/nonexistent/pi-ai'] } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'chanhub-catalog-rpc-'));
  const cacheFile = join(dir, 'model-catalog.json');
  const ns = { ...SETTINGS_DEFAULTS, ...pluginNs };
  const calls = [];
  const writes = [];
  const runtime = {
    client: {
      models: async () => { calls.push('models'); return { object: 'list', data: [] }; },
    },
    settingsService: {
      get: () => ({ providers: { [PROVIDER]: { models: [] } } }),
      register: () => ({ get: () => ns }),
      mutate: async (namespace, ops) => { writes.push({ namespace, ops }); return { ok: true }; },
    },
    readSettings: () => ns,
    resolveConfig: () => ({ baseURL: 'http://127.0.0.1:7866', apiKey: '' }),
    warnings: [],
    logger: undefined,
    catalogCacheFile: cacheFile,
    catalogPiAiDirs: piAiDirs,
    ...(fetchImpl ? { fetchImpl } : {}),
  };
  return { handle: createHandler(runtime), calls, writes, dir, cacheFile, ns };
}

const MODELS = [
  { id: 'workbuddy:global:kimi-k3' },
  { id: 'workbuddy:cn:deepseek-v4-flash' },
  { id: 'workbuddy:cn:auto' },
];

test('getModelCatalog：零网关调用、零写入，返回三态判定', async () => {
  const rt = await makeRuntime({
    pluginNs: { modelPullSnapshot: JSON.stringify({ at: 1, provider: PROVIDER, count: 3, models: MODELS }) },
  });
  try {
    const result = await rt.handle(ENDPOINTS.getModelCatalog, { provider: PROVIDER });
    assert.equal(result.ok, true);
    assert.equal(rt.calls.length, 0, '目录比对不许打网关');
    assert.equal(rt.writes.length, 0, '只读端点不许写 settings');
    assert.equal(result.value.readonly, true);
    assert.equal(result.value.verdicts.length, 3);
    assert.equal(result.value.summary.counts.alias, 1);
    // 没有缓存时如实提示，不假装有目录
    assert.ok(result.value.warnings.some((w) => w.includes('刷新目录')));
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('refreshModelCatalog：抓两个源 → 落盘缓存 → 同一次往返给出判定', async () => {
  const seen = [];
  const rt = await makeRuntime({
    fetchImpl: async (url) => {
      seen.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => (url.includes('models.dev') ? MODELS_DEV_FIXTURE : OPENROUTER_FIXTURE),
      };
    },
  });
  try {
    const result = await rt.handle(ENDPOINTS.refreshModelCatalog, { provider: PROVIDER, models: MODELS });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.refreshed, true);
    assert.equal(seen.length, 2, '两个在线源都要抓');
    assert.deepEqual(result.value.failures, []);

    // 缓存落盘可读，且只存在线源（pi-ai 是离线实时读的）
    const raw = JSON.parse(await readFile(rt.cacheFile, 'utf8'));
    assert.equal(raw.version, CATALOG_CACHE_VERSION);
    assert.ok(raw.sources[CATALOG_SOURCES.modelsDev].entries > 0);
    assert.ok(raw.sources[CATALOG_SOURCES.openRouter].entries > 0);
    assert.equal(raw.sources[CATALOG_SOURCES.piAi], undefined);

    // 判定：kimi-k3 的 L3 反对票被 L1 压过 → image
    const kimi = result.value.verdicts.find((v) => v.id === 'workbuddy:global:kimi-k3');
    assert.equal(kimi.verdict, 'image');
    assert.equal(kimi.tier, 'L1');
    assert.equal(kimi.status, 'confirmed');
    const flash = result.value.verdicts.find((v) => v.id === 'workbuddy:cn:deepseek-v4-flash');
    assert.equal(flash.verdict, 'text');
    assert.equal(result.value.summary.counts.alias, 1);

    // 第二次调用（不联网）也能拿到同样的判定 —— 证明「拉取零网络」成立
    const again = await rt.handle(ENDPOINTS.getModelCatalog, { provider: PROVIDER, models: MODELS });
    assert.equal(again.ok, true);
    assert.equal(again.value.at > 0, true, '缓存时间戳要带出来');
    assert.equal(again.value.verdicts.find((v) => v.id === 'workbuddy:global:kimi-k3').verdict, 'image');
    assert.equal(rt.calls.length, 0, '整个目录链路都不该打网关');
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('refreshModelCatalog：源全挂 → 明确失败，且不写坏缓存', async () => {
  const rt = await makeRuntime({
    fetchImpl: async () => { throw new Error('ETIMEDOUT'); },
  });
  try {
    const result = await rt.handle(ENDPOINTS.refreshModelCatalog, { provider: PROVIDER, models: MODELS });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'catalog-unreachable');
    assert.match(result.error.message, /models\.dev/);
    await assert.rejects(readFile(rt.cacheFile, 'utf8'), '失败时不该留下缓存文件');
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('部分源失败也照常落盘，并把失败原因带出来', async () => {
  const rt = await makeRuntime({
    fetchImpl: async (url) => {
      if (url.includes('openrouter')) throw new Error('HTTP 429');
      return { ok: true, status: 200, json: async () => MODELS_DEV_FIXTURE };
    },
  });
  try {
    const result = await rt.handle(ENDPOINTS.refreshModelCatalog, { provider: PROVIDER, models: MODELS });
    assert.equal(result.ok, true);
    assert.equal(result.value.failures.length, 1);
    assert.equal(result.value.failures[0].source, CATALOG_SOURCES.openRouter);
    assert.match(result.value.failures[0].message, /429/);
    const raw = JSON.parse(await readFile(rt.cacheFile, 'utf8'));
    assert.equal(raw.sources[CATALOG_SOURCES.openRouter], undefined);
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('白名单与目录打架时报 disagreements，缺口报 gaps（两者不混）', async () => {
  const rt = await makeRuntime({
    fetchImpl: async (url) => ({
      ok: true,
      status: 200,
      json: async () => (url.includes('models.dev') ? MODELS_DEV_FIXTURE : { data: [] }),
    }),
  });
  try {
    const result = await rt.handle(ENDPOINTS.refreshModelCatalog, {
      provider: PROVIDER,
      // workbuddy:cn:deepseek-v4.1-flash 在白名单里（白名单说视觉），目录说纯文本 → 真冲突
      models: [{ id: 'workbuddy:cn:deepseek-v4.1-flash' }, { id: 'workbuddy:global:kimi-k3' }],
    });
    assert.equal(result.ok, true);
    const { disagreements, gaps } = result.value.summary;
    assert.deepEqual(disagreements.map((d) => d.id), ['workbuddy:cn:deepseek-v4.1-flash']);
    assert.equal(disagreements[0].kind, 'whitelist-image-catalog-text');
    assert.deepEqual(gaps.map((g) => g.id), ['workbuddy:global:kimi-k3']);
    assert.equal(gaps[0].kind, 'catalog-image-not-in-whitelist');
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('缓存版本不符判废：不崩，只是当没有目录', async () => {
  const rt = await makeRuntime();
  try {
    await writeFile(rt.cacheFile, JSON.stringify({ version: 0, at: 1, sources: {}, index: {} }), 'utf8');
    const result = await rt.handle(ENDPOINTS.getModelCatalog, { provider: PROVIDER, models: MODELS });
    assert.equal(result.ok, true);
    assert.equal(result.value.at, 0);
    assert.ok(result.value.warnings.some((w) => w.includes('刷新目录')));
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

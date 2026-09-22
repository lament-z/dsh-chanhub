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

/**
 * 造 runtime：client 打点计数（用来证明「零网关调用」），缓存落到临时目录，
 * settings 是**会真的落盘**的内存实现（否则「沉淀 → 后续读回」这条链测不出来）。
 */
async function makeRuntime({ fetchImpl, pluginNs = {}, piModels = [], gatewayModels = [], piAiDirs = ['/nonexistent/pi-ai'] } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'chanhub-catalog-rpc-'));
  const cacheFile = join(dir, 'model-catalog.json');
  const ns = { ...SETTINGS_DEFAULTS, ...pluginNs };
  // piModels === null 表示「DSH 里根本没有该 provider 的模型配置」
  const piNs = piModels === null ? {} : { providers: { [PROVIDER]: { models: piModels } } };
  const calls = [];
  const writes = [];
  const applyOps = (root, ops) => {
    for (const op of ops) {
      if (op.op !== 'set') continue;
      let node = root;
      for (let i = 0; i < op.path.length - 1; i += 1) {
        const key = op.path[i];
        if (typeof node[key] !== 'object' || node[key] === null) node[key] = {};
        node = node[key];
      }
      node[op.path[op.path.length - 1]] = op.value;
    }
  };
  const runtime = {
    client: {
      models: async () => { calls.push('models'); return { object: 'list', data: gatewayModels }; },
    },
    settingsService: {
      get: (namespace) => (namespace === 'llm-pi-ai' ? piNs : ns),
      register: () => ({ get: () => ns }),
      mutate: async (namespace, ops) => {
        writes.push({ namespace, ops });
        applyOps(namespace === 'llm-pi-ai' ? piNs : ns, ops);
        return { ok: true };
      },
    },
    readSettings: () => ns,
    resolveConfig: () => ({ baseURL: 'http://127.0.0.1:7866', apiKey: '' }),
    warnings: [],
    logger: undefined,
    catalogCacheFile: cacheFile,
    catalogPiAiDirs: piAiDirs,
    ...(fetchImpl ? { fetchImpl } : {}),
  };
  return { handle: createHandler(runtime), calls, writes, dir, cacheFile, ns, piNs };
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

// --- 沉淀（能力基线）与「应用补丁」----------------------------------------

/** 先把缓存灌好（models.dev 夹具），后续调用都走零网络的缓存路径。 */
async function seedCatalog(rt) {
  const result = await rt.handle(ENDPOINTS.refreshModelCatalog, { provider: PROVIDER, models: [] });
  assert.equal(result.ok, true);
}

const COMMIT_MODELS = [
  { id: 'workbuddy:global:kimi-k3' }, // 确认 → 图
  { id: 'workbuddy:cn:deepseek-v4-flash' }, // 确认 → 文
  { id: 'workbuddy:cn:kimi-k3-1' }, // 借判（剥后缀）→ 不沉淀
  { id: 'workbuddy:cn:auto' }, // 档位别名 → 不沉淀
];

test('commitModelCapabilities：只沉淀确认态，写进 settings.modelCapabilities', async () => {
  const rt = await makeRuntime({
    fetchImpl: async (url) => ({
      ok: true, status: 200,
      json: async () => (url.includes('models.dev') ? MODELS_DEV_FIXTURE : OPENROUTER_FIXTURE),
    }),
  });
  try {
    await seedCatalog(rt);
    const result = await rt.handle(ENDPOINTS.commitModelCapabilities, { provider: PROVIDER, models: COMMIT_MODELS });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.deepEqual(result.value.added.sort(), ['workbuddy:cn:deepseek-v4-flash', 'workbuddy:global:kimi-k3']);
    assert.equal(result.value.skipped, 2, '借判与别名不沉淀');

    const stored = JSON.parse(rt.ns.modelCapabilities);
    assert.equal(stored.entries['workbuddy:global:kimi-k3'].image, true);
    assert.equal(stored.entries['workbuddy:cn:deepseek-v4-flash'].image, false);
    assert.equal(stored.entries['workbuddy:cn:kimi-k3-1'], undefined, '借判不得落盘');
    assert.equal(stored.entries['workbuddy:cn:auto'], undefined, '别名不得落盘');

    // 沉淀后报告：待沉淀归零，已沉淀计数跟着来
    assert.equal(result.value.report.baseline.pending, 0);
    assert.equal(result.value.report.baseline.count, 2);

    // 幂等：再沉淀一次没有任何新增
    const again = await rt.handle(ENDPOINTS.commitModelCapabilities, { provider: PROVIDER, models: COMMIT_MODELS });
    assert.deepEqual(again.value.added, []);
    assert.deepEqual(again.value.changed, []);
    assert.equal(again.value.count, 2);
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('沉淀后「白名单可补」缺口消失（基线进了有效视觉集合）', async () => {
  const rt = await makeRuntime({
    fetchImpl: async (url) => ({
      ok: true, status: 200,
      json: async () => (url.includes('models.dev') ? MODELS_DEV_FIXTURE : OPENROUTER_FIXTURE),
    }),
  });
  try {
    await seedCatalog(rt);
    const before = await rt.handle(ENDPOINTS.getModelCatalog, { provider: PROVIDER, models: COMMIT_MODELS });
    // 确认态的缺口 + 借判态的疑似缺口都要列出来，但状态可区分
    assert.deepEqual(before.value.summary.gaps.map((g) => g.id), ['workbuddy:global:kimi-k3', 'workbuddy:cn:kimi-k3-1']);
    assert.deepEqual(before.value.summary.gaps.map((g) => g.status), ['confirmed', 'borrowed']);
    assert.equal(before.value.baseline.pending, 2);

    await rt.handle(ENDPOINTS.commitModelCapabilities, { provider: PROVIDER, models: COMMIT_MODELS });

    const after = await rt.handle(ENDPOINTS.getModelCatalog, { provider: PROVIDER, models: COMMIT_MODELS });
    // 确认项沉淀后从缺口里消失；借判的那条还在（它没被确认，也不该被沉淀）
    assert.deepEqual(after.value.summary.gaps.map((g) => g.id), ['workbuddy:cn:kimi-k3-1']);
    assert.deepEqual(after.value.summary.gaps.map((g) => g.status), ['borrowed']);
    assert.equal(after.value.baseline.pending, 0);
    assert.equal(after.value.baseline.count, 2);
    // 基线里的确认项仍然在判定里标为「有效视觉集合内」
    const kimi = after.value.verdicts.find((v) => v.id === 'workbuddy:global:kimi-k3');
    assert.equal(kimi.whitelist, true, 'whitelist 字段现在表示「本地认定集合」');
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('applyModelsPatch：白名单外的模型要等沉淀后才允许补 input', async () => {
  const rt = await makeRuntime({
    fetchImpl: async (url) => ({
      ok: true, status: 200,
      json: async () => (url.includes('models.dev') ? MODELS_DEV_FIXTURE : OPENROUTER_FIXTURE),
    }),
    piModels: [{ id: 'workbuddy:global:kimi-k3', name: 'Kimi K3', contextWindow: 1000000, custom: 'keep' }],
  });
  try {
    await seedCatalog(rt);
    const denied = await rt.handle(ENDPOINTS.applyModelsPatch, {
      provider: PROVIDER,
      selectedIds: ['workbuddy:global:kimi-k3'],
    });
    assert.equal(denied.ok, true);
    assert.deepEqual(denied.value.added, []);
    assert.deepEqual(denied.value.skipped, ['workbuddy:global:kimi-k3'], '未沉淀 → 拒绝落 input');

    await rt.handle(ENDPOINTS.commitModelCapabilities, { provider: PROVIDER, models: [{ id: 'workbuddy:global:kimi-k3' }] });

    const allowed = await rt.handle(ENDPOINTS.applyModelsPatch, {
      provider: PROVIDER,
      selectedIds: ['workbuddy:global:kimi-k3'],
    });
    assert.equal(allowed.ok, true, JSON.stringify(allowed));
    assert.deepEqual(allowed.value.added, ['workbuddy:global:kimi-k3']);
    const written = rt.piNs.providers[PROVIDER].models;
    assert.deepEqual(written[0].input, ['text', 'image']);
    assert.equal(written[0].custom, 'keep', '额外键保留');
    assert.equal(written[0].contextWindow, 1000000);
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('getModelRecord：回显时叠加基线（沉淀后无需重拉即可勾选）', async () => {
  const rt = await makeRuntime({
    pluginNs: {
      modelPullSnapshot: JSON.stringify({
        at: 1,
        provider: PROVIDER,
        count: 1,
        models: [{ id: 'workbuddy:global:kimi-k3', name: 'Kimi K3', ctx: 1000000, maxOut: 64000, credits: 'x0.1', vision: false }],
      }),
    },
  });
  try {
    const before = await rt.handle(ENDPOINTS.getModelRecord, {});
    assert.equal(before.value.models[0].supportsImages, false);
    assert.equal(before.value.baseline.count, 0);

    rt.ns.modelCapabilities = JSON.stringify({ at: 2, entries: { 'workbuddy:global:kimi-k3': { image: true, status: 'confirmed' } } });

    const after = await rt.handle(ENDPOINTS.getModelRecord, {});
    assert.equal(after.value.models[0].supportsImages, true, '基线叠加到回显');
    assert.equal(after.value.baseline.count, 1);
    assert.equal(rt.calls.length, 0, '回显依然零网关请求');
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('discoverModelsForPatch：extraVision 贯通到目录与覆盖写入', async () => {
  const rt = await makeRuntime({
    gatewayModels: [
      { id: 'workbuddy:global:kimi-k3', name: 'Kimi K3', context_length: 1000000, max_output_tokens: 64000, reasoning_supported_efforts: ['low', 'high'] },
    ],
    pluginNs: {
      modelCapabilities: JSON.stringify({ at: 2, entries: { 'workbuddy:global:kimi-k3': { image: true, status: 'confirmed' } } }),
    },
  });
  try {
    const result = await rt.handle(ENDPOINTS.discoverModelsForPatch, { provider: PROVIDER, overwriteDshModels: true });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.models[0].supportsImages, true, '基线让目录条目直接带视觉');
    assert.equal(result.value.baseline.count, 1);
    const written = rt.piNs.providers[PROVIDER].models;
    assert.deepEqual(written[0].input, ['text', 'image']);
    assert.deepEqual(written[0].reasoningEfforts, { low: 'low', high: 'high' }, '推理档位也要写进去');
    assert.equal(written[0].contextWindow, 1000000);
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

// --- 补齐配置字段（256K 的解法）--------------------------------------------

const SNAP_MODELS = [
  { id: 'workbuddy:global:deepseek-v4.1-flash', name: 'DS', ctx: 1000000, maxOut: 128000, credits: 'x1', vision: false, efforts: ['low', 'high'] },
  { id: 'traework:cn:DeepSeek-V4-Flash-Official', name: 'DS-F', ctx: 1000000, maxOut: undefined, credits: '', vision: false, efforts: [] },
];

function snapshotText(models = SNAP_MODELS) {
  return JSON.stringify({ at: 1234, provider: PROVIDER, count: models.length, models, hasEfforts: true });
}

/** 老快照：没有 efforts 字段、也没有 hasEfforts 标记（记录于档位采集上线前）。 */
function snapshotOldText(models = SNAP_MODELS) {
  return JSON.stringify({
    at: 1234,
    provider: PROVIDER,
    count: models.length,
    models: models.map(({ efforts, ...rest }) => rest),
  });
}

test('completeModelFields：dry-run 只出预览，零写入零网关（走拉取快照）', async () => {
  const rt = await makeRuntime({
    pluginNs: { modelPullSnapshot: snapshotText() },
    piModels: [{ id: 'workbuddy:global:deepseek-v4.1-flash', name: 'DS', credits: 'x1', custom: 'keep' }],
  });
  try {
    const result = await rt.handle(ENDPOINTS.completeModelFields, { provider: PROVIDER, dryRun: true });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.dryRun, true);
    assert.equal(result.value.wrote, false);
    assert.equal(result.value.source.kind, 'snapshot');
    assert.equal(result.value.source.staleFields, undefined, '新快照带 hasEfforts，不该误报');
    assert.deepEqual(result.value.changes, [{
      id: 'workbuddy:global:deepseek-v4.1-flash',
      fields: ['contextWindow', 'maxTokens', 'reasoningEfforts'],
    }]);
    assert.equal(rt.calls.length, 0, '有快照就不打网关');
    assert.equal(rt.writes.length, 0, 'dry-run 不写 settings');
    assert.equal(rt.piNs.providers[PROVIDER].models[0].contextWindow, undefined, '配置保持原样');
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('completeModelFields：确认写入 → 条目拿到 1M 上下文 / 输出 / 推理档位', async () => {
  const rt = await makeRuntime({
    pluginNs: {
      modelPullSnapshot: snapshotText(),
      modelCapabilities: JSON.stringify({ at: 1, entries: { 'workbuddy:global:deepseek-v4.1-flash': { image: true, status: 'confirmed' } } }),
    },
    piModels: [
      { id: 'workbuddy:global:deepseek-v4.1-flash', name: 'DS', credits: 'x1', custom: 'keep' },
      { id: 'traework:cn:DeepSeek-V4-Flash-Official', name: 'DS-F' },
    ],
  });
  try {
    const result = await rt.handle(ENDPOINTS.completeModelFields, { provider: PROVIDER, dryRun: false });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.value.wrote, true);
    assert.equal(result.value.source.staleFields, undefined, '带 efforts 的新快照不该报旧');
    const written = rt.piNs.providers[PROVIDER].models;
    const first = written.find((m) => m.id === 'workbuddy:global:deepseek-v4.1-flash');
    assert.equal(first.contextWindow, 1000000, '256K 的解法：把网关的 1M 写进配置');
    assert.equal(first.maxTokens, 128000);
    assert.deepEqual(first.reasoningEfforts, { low: 'low', high: 'high' });
    assert.deepEqual(first.input, ['text', 'image'], '基线里的确认项也一并补上视觉');
    assert.equal(first.custom, 'keep', '额外键保留');
    // 网关没给 maxTokens 的那条不编造
    const second = written.find((m) => m.id === 'traework:cn:DeepSeek-V4-Flash-Official');
    assert.equal(second.contextWindow, 1000000);
    assert.equal('maxTokens' in second, false);
    // 再跑一次：全部已一致 → 无改动（幂等）
    const again = await rt.handle(ENDPOINTS.completeModelFields, { provider: PROVIDER, dryRun: false });
    assert.deepEqual(again.value.changes, []);
    assert.equal(again.value.unchanged, 2);
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('completeModelFields：没有快照就回落到网关一次（并如实标注数据源）', async () => {
  const rt = await makeRuntime({
    gatewayModels: [{ id: 'a:1', name: 'A', context_length: 999000, max_output_tokens: 32000 }],
    piModels: [{ id: 'a:1', name: 'A' }],
  });
  try {
    const result = await rt.handle(ENDPOINTS.completeModelFields, { provider: PROVIDER, dryRun: true });
    assert.equal(result.ok, true);
    assert.equal(result.value.source.kind, 'gateway');
    assert.deepEqual(result.value.changes, [{ id: 'a:1', fields: ['contextWindow', 'maxTokens'] }]);
    assert.deepEqual(rt.calls, ['models']);
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('completeModelFields：配置里没有模型 → 明确报错，不静默什么都不做', async () => {
  const rt = await makeRuntime({ pluginNs: { modelPullSnapshot: snapshotText() }, piModels: null });
  try {
    const result = await rt.handle(ENDPOINTS.completeModelFields, { provider: PROVIDER, dryRun: false });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'no-models');
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('getModelRecord：报出「配置里缺哪些字段」，面板才能标未写入', async () => {
  const rt = await makeRuntime({
    pluginNs: { modelPullSnapshot: snapshotText() },
    piModels: [
      { id: 'workbuddy:global:deepseek-v4.1-flash', name: 'DS', contextWindow: 1000000, maxTokens: 128000, reasoningEfforts: { low: 'low' }, input: ['text', 'image'] },
      { id: 'traework:cn:DeepSeek-V4-Flash-Official', name: 'DS-F' },
    ],
  });
  try {
    const result = await rt.handle(ENDPOINTS.getModelRecord, {});
    assert.equal(result.ok, true);
    const gaps = result.value.configured.gaps;
    assert.equal(gaps['workbuddy:global:deepseek-v4.1-flash'], undefined, '四项齐全就不算缺口');
    assert.deepEqual(gaps['traework:cn:DeepSeek-V4-Flash-Official'], ['contextWindow', 'maxTokens', 'reasoningEfforts', 'input']);
    assert.equal(rt.calls.length, 0);
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

test('completeModelFields：老快照（档位采集上线前）要如实说「档位补不了」', async () => {
  const rt = await makeRuntime({
    pluginNs: { modelPullSnapshot: snapshotOldText() },
    piModels: [{ id: 'workbuddy:global:deepseek-v4.1-flash', name: 'DS' }],
  });
  try {
    const result = await rt.handle(ENDPOINTS.completeModelFields, { provider: PROVIDER, dryRun: true });
    assert.equal(result.ok, true);
    assert.deepEqual(result.value.source.staleFields, ['reasoningEfforts']);
    assert.deepEqual(result.value.changes, [{
      id: 'workbuddy:global:deepseek-v4.1-flash',
      fields: ['contextWindow', 'maxTokens'],
    }], '档位补不了就不假装补');
  } finally {
    await rm(rt.dir, { recursive: true, force: true });
  }
});

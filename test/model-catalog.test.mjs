// dsh-chanhub —— 「多模态能力目录比对」纯逻辑测试。
//
// 用户诉求（原话）：多模态能力不信任上游，用结构化目录比对标注后沉淀。
// 本测试钉死四件事：
//   1. 名字归一化/后缀剥离的**保守性** —— 绝不把 thinking/instruct/turbo 这类
//      改变模型身份的 token 剥掉（否则 kimi-k2-thinking 会借判成 kimi-k2）；
//   2. 通用名（auto/default-model）必须排除，它们会假匹配（实测撞上 morph 的 auto）；
//   3. 裁决顺序 L1 原厂 > L2 云托管 > L3 转售，同级平票才算冲突；
//   4. 剥后缀/模糊命中的结论只算「借判」（待确认），不能当精确命中。
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  CATALOG_CACHE_VERSION,
  CATALOG_SOURCES,
  buildCatalogIndex,
  catalogCachePath,
  catalogSummary,
  channelTail,
  classifyAll,
  classifyModel,
  decideByTier,
  deserializeCatalogIndex,
  indexFromModelsDev,
  indexFromOpenRouter,
  indexFromPiAiFiles,
  isGenericAlias,
  loadPiAiCatalog,
  normalizeModelKey,
  piAiDataDirCandidates,
  prefixSimilarity,
  providerTier,
  readCatalogCache,
  serializeCatalogIndex,
  stripKnownSuffix,
  writeCatalogCache,
} from '../lib/model-catalog.js';

// --- 归一化与后缀 ---------------------------------------------------------

test('normalizeModelKey 小写并去掉一切非 [a-z0-9.]', () => {
  assert.equal(normalizeModelKey('DeepSeek-V4.1-Flash'), 'deepseekv4.1flash');
  assert.equal(normalizeModelKey('Kimi_K2.6'), 'kimik2.6');
  assert.equal(normalizeModelKey(''), '');
});

test('channelTail 取渠道前缀后的模型名', () => {
  assert.equal(channelTail('workbuddy:cn:kimi-k3'), 'kimi-k3');
  assert.equal(channelTail('traework:cn:DeepSeek-V4-Flash-Official'), 'DeepSeek-V4-Flash-Official');
  assert.equal(channelTail('nocolon'), 'nocolon');
});

test('stripKnownSuffix 只剥部署后缀，反复两轮', () => {
  assert.equal(stripKnownSuffix('hy4-preview-f'), 'hy4-preview');
  assert.equal(stripKnownSuffix('kimi-k3-1'), 'kimi-k3');
  assert.equal(stripKnownSuffix('deepseek-v3-1-lkeap'), 'deepseek-v3-1');
  assert.equal(stripKnownSuffix('deepseek-v4-flash-official'), 'deepseek-v4-flash');
});

test('stripKnownSuffix 大小写无关（网关 id 是混合大小写）', () => {
  assert.equal(stripKnownSuffix('DeepSeek-V4-Flash-Official'), 'DeepSeek-V4-Flash');
  assert.equal(stripKnownSuffix('hy4-Preview-F'), 'hy4-Preview');
});

test('stripKnownSuffix 只剥一层，不把 hy4-preview-f 剥成 hy4', () => {
  assert.equal(stripKnownSuffix('hy4-preview-f'), 'hy4-preview');
  assert.equal(stripKnownSuffix('hy4-preview-f', 2), 'hy4');
});

test('stripKnownSuffix 绝不剥会改变模型身份的 token', () => {
  // 这几个剥掉就会把不同模型混为一谈，必须原样返回
  assert.equal(stripKnownSuffix('kimi-k2-thinking'), 'kimi-k2-thinking');
  assert.equal(stripKnownSuffix('kimi-k2-instruct'), 'kimi-k2-instruct');
  assert.equal(stripKnownSuffix('kimi-k2.7-code'), 'kimi-k2.7-code');
  assert.equal(stripKnownSuffix('glm-5v-turbo'), 'glm-5v-turbo');
  assert.equal(stripKnownSuffix('deepseek-v4-pro'), 'deepseek-v4-pro');
});

test('通用名别名被识别（避免 auto 撞上 morph 的 auto）', () => {
  for (const name of ['auto', 'default-model', 'fast-model', 'balanced-model', 'deep-model', 'primary-model', 'summary']) {
    assert.equal(isGenericAlias(name), true, `${name} 应判为别名`);
  }
  assert.equal(isGenericAlias('hy3'), false, 'hy3 是真实模型，不能当别名');
  assert.equal(isGenericAlias('kimi-k3'), false);
});

// --- 来源分级 -------------------------------------------------------------

test('providerTier：原厂 L1 / 云托管 L2 / 转售 L3', () => {
  assert.equal(providerTier('deepseek', 'deepseekv4.1flash'), 'L1');
  assert.equal(providerTier('moonshotai', 'kimik3'), 'L1');
  assert.equal(providerTier('zhipuai-coding-plan', 'glm5.3flash'), 'L1');
  assert.equal(providerTier('tencent-token-plan', 'hy4preview'), 'L1');
  assert.equal(providerTier('digitalocean', 'kimik3'), 'L2');
  assert.equal(providerTier('ollama-cloud', 'minimaxm3'), 'L2');
  // 转售商即使卖的是原厂模型也不是 L1
  assert.equal(providerTier('greenpt', 'kimik3'), 'L3');
  assert.equal(providerTier('aihubmix', 'glm5.3flash'), 'L3');
  // 原厂 provider 里的**别的**模型族不算 L1（避免把 openai 目录里的杂项当第一手）
  assert.equal(providerTier('deepseek', 'gpt5.6'), 'L3');
});

// --- 目录源解析 -----------------------------------------------------------

test('indexFromModelsDev 读出 modalities.input 与 limit', () => {
  const entries = indexFromModelsDev({
    deepseek: { models: { 'deepseek-v4.1-flash': { id: 'deepseek-v4.1-flash', modalities: { input: ['text', 'image'] }, limit: { context: 1000000, output: 128000 } } } },
  });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].key, 'deepseekv4.1flash');
  assert.equal(entries[0].image, true);
  assert.equal(entries[0].tier, 'L1');
  assert.equal(entries[0].ctx, 1000000);
  assert.equal(entries[0].source, CATALOG_SOURCES.modelsDev);
});

test('indexFromOpenRouter 从 architecture.input_modalities 读多模态', () => {
  const entries = indexFromOpenRouter({
    data: [{ id: 'moonshotai/kimi-k3', architecture: { input_modalities: ['text', 'image'] }, limit: { context_length: 1000000 } }],
  });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].key, 'kimik3');
  assert.equal(entries[0].provider, 'moonshotai');
  assert.equal(entries[0].image, true);
  assert.equal(entries[0].tier, 'L1');
});

test('indexFromPiAiFiles 读 pi-ai 的 { api: { id: model } } 形态', () => {
  const entries = indexFromPiAiFiles({
    moonshotai: { 'openai-completions': { 'kimi-k3': { id: 'kimi-k3', input: ['text', 'image'], contextWindow: 1000000 } } },
  });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].key, 'kimik3');
  assert.equal(entries[0].source, CATALOG_SOURCES.piAi);
  assert.equal(entries[0].image, true);
});

test('buildCatalogIndex 归一化分桶并按 源|provider|id 去重', () => {
  const index = buildCatalogIndex([
    indexFromModelsDev({ a: { models: { 'kimi-k3': { id: 'kimi-k3', modalities: { input: ['text'] } } } } }),
    indexFromModelsDev({ a: { models: { 'kimi-k3': { id: 'kimi-k3', modalities: { input: ['text'] } } } } }),
  ]);
  assert.equal(index.size, 1);
  assert.equal(index.get('kimik3').length, 1);
});

// --- 裁决 -----------------------------------------------------------------

test('decideByTier：L1 原厂压过 L3 转售的多数票', () => {
  const decision = decideByTier([
    { tier: 'L1', image: true }, { tier: 'L1', image: true },
    { tier: 'L3', image: false }, { tier: 'L3', image: false }, { tier: 'L3', image: false },
  ]);
  assert.equal(decision.verdict, 'image');
  assert.equal(decision.tier, 'L1');
  assert.equal(decision.dissent, 0);
});

test('decideByTier：没有 L1 时用 L2；同级平票判冲突', () => {
  const l2 = decideByTier([{ tier: 'L2', image: false }, { tier: 'L2', image: false }, { tier: 'L3', image: true }]);
  assert.equal(l2.verdict, 'text');
  assert.equal(l2.tier, 'L2');
  const tie = decideByTier([{ tier: 'L3', image: true }, { tier: 'L3', image: false }]);
  assert.equal(tie.verdict, 'conflict');
});

test('decideByTier：无条目返回 null', () => {
  assert.equal(decideByTier([]), null);
});

// --- 单模型判定 -----------------------------------------------------------

function fixtureIndex() {
  return buildCatalogIndex([
    indexFromModelsDev({
      moonshotai: { models: { 'kimi-k3': { id: 'kimi-k3', modalities: { input: ['text', 'image'] } } } },
      deepseek: { models: { 'deepseek-v4-flash': { id: 'deepseek-v4-flash', modalities: { input: ['text'] } } } },
      greenpt: { models: { 'kimi-k3': { id: 'kimi-k3', modalities: { input: ['text'] } } } },
    }),
  ]);
}

test('classifyModel：精确命中 → confirmed，L1 压过转售的反对票', () => {
  const v = classifyModel('workbuddy:global:kimi-k3', fixtureIndex());
  assert.equal(v.status, 'confirmed');
  assert.equal(v.verdict, 'image');
  assert.equal(v.tier, 'L1');
  assert.equal(v.how, '精确');
});

test('classifyModel：纯文本模型判 text', () => {
  const v = classifyModel('workbuddy:cn:deepseek-v4-flash', fixtureIndex());
  assert.equal(v.status, 'confirmed');
  assert.equal(v.verdict, 'text');
});

test('classifyModel：通用名别名不参与匹配', () => {
  const v = classifyModel('workbuddy:cn:auto', fixtureIndex());
  assert.equal(v.status, 'alias');
  assert.equal(v.verdict, 'unknown');
  assert.equal(v.sources.length, 0);
});

test('classifyModel：剥后缀命中 → borrowed（待确认），不是 confirmed', () => {
  const v = classifyModel('workbuddy:cn:kimi-k3-1', fixtureIndex());
  assert.equal(v.status, 'borrowed');
  assert.equal(v.verdict, 'image');
  assert.equal(v.matchedKey, 'kimik3');
  assert.match(v.how, /剥后缀/);
});

test('classifyModel：模糊命中 → borrowed，且带上相似度与目标', () => {
  const v = classifyModel('workbuddy:cn:kimi-k3x', fixtureIndex());
  assert.equal(v.status, 'borrowed');
  assert.equal(v.matchedKey, 'kimik3');
  assert.match(v.how, /模糊/);
});

test('classifyModel：preview 这类部署后缀走剥后缀而非模糊', () => {
  const v = classifyModel('workbuddy:cn:kimi-k3-preview', fixtureIndex());
  assert.equal(v.status, 'borrowed');
  assert.match(v.how, /剥后缀/);
});

test('classifyModel：目录无收录 → missing/unknown', () => {
  const v = classifyModel('workbuddy:cn:sagitta', fixtureIndex());
  assert.equal(v.status, 'missing');
  assert.equal(v.verdict, 'unknown');
});

test('classifyModel：同级源平票 → conflict/unknown', () => {
  const index = buildCatalogIndex([
    indexFromModelsDev({ resellerA: { models: { 'kimi-k9': { id: 'kimi-k9', modalities: { input: ['text', 'image'] } } } } }),
    indexFromOpenRouter({ data: [{ id: 'resellerB/kimi-k9', architecture: { input_modalities: ['text'] } }] }),
  ]);
  const v = classifyModel('workbuddy:cn:kimi-k9', index);
  assert.equal(v.status, 'conflict');
  assert.equal(v.verdict, 'unknown');
  assert.match(v.reason, /平票/);
});

test('prefixSimilarity 基本性质', () => {
  assert.equal(prefixSimilarity('kimik3', 'kimik3'), 1);
  assert.ok(prefixSimilarity('kimik3', 'kimik31') > 0.8);
  assert.ok(prefixSimilarity('kimik3', 'glm53') < 0.5);
});

// --- 批量判定 -------------------------------------------------------------

test('classifyAll 汇总三态计数；白名单冲突与「目录说图但白名单没收录」分开报', () => {
  const index = fixtureIndex();
  const whitelist = new Set(['workbuddy:cn:deepseek-v4-flash']); // 白名单说它是视觉，目录说纯文本
  const { verdicts, summary } = classifyAll(
    [{ id: 'workbuddy:global:kimi-k3' }, { id: 'workbuddy:cn:deepseek-v4-flash' }, { id: 'workbuddy:cn:auto' }],
    index,
    { whitelist },
  );
  assert.equal(verdicts.length, 3);
  assert.equal(summary.total, 3);
  assert.equal(summary.counts.image, 1);
  assert.equal(summary.counts.text, 1);
  assert.equal(summary.counts.alias, 1);
  // 白名单标了图、目录说文的：真冲突，要人看
  assert.equal(summary.disagreements.length, 1);
  assert.equal(summary.disagreements[0].id, 'workbuddy:cn:deepseek-v4-flash');
  assert.equal(summary.disagreements[0].kind, 'whitelist-image-catalog-text');
  // 目录说图、白名单没收录的：是缺口不是冲突
  assert.equal(summary.gaps.length, 1);
  assert.equal(summary.gaps[0].id, 'workbuddy:global:kimi-k3');
});

test('classifyAll 支持裸 id 字符串数组', () => {
  const { verdicts } = classifyAll(['workbuddy:global:kimi-k3'], fixtureIndex());
  assert.equal(verdicts[0].id, 'workbuddy:global:kimi-k3');
});

// --- 序列化 / 缓存 --------------------------------------------------------

test('serialize/deserialize 往返保持判定结果一致', () => {
  const index = fixtureIndex();
  const restored = deserializeCatalogIndex(serializeCatalogIndex(index));
  assert.equal(restored.size, index.size);
  assert.equal(classifyModel('workbuddy:global:kimi-k3', restored).verdict, 'image');
  assert.equal(classifyModel('workbuddy:cn:deepseek-v4-flash', restored).verdict, 'text');
});

test('缓存读写往返；版本不符判废', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'chanhub-catalog-'));
  const path = join(dir, 'nested', 'model-catalog.json');
  try {
    assert.equal(await readCatalogCache(path), null, '文件不存在时返回 null');
    const index = fixtureIndex();
    await writeCatalogCache(path, { at: 123, sources: { 'models.dev': { at: 123, entries: 3 } }, index });
    const cache = await readCatalogCache(path);
    assert.equal(cache.version, CATALOG_CACHE_VERSION);
    assert.equal(cache.at, 123);
    assert.equal(cache.sources['models.dev'].entries, 3);
    assert.equal(cache.index.size, index.size);

    const { writeFile } = await import('node:fs/promises');
    await writeFile(path, JSON.stringify({ version: 999, index: {} }), 'utf8');
    assert.equal(await readCatalogCache(path), null, '版本不符判废');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('catalogCachePath 落在 ~/.dsh/dsh-chanhub 下', () => {
  assert.equal(catalogCachePath('/home/u'), '/home/u/.dsh/dsh-chanhub/model-catalog.json');
});

test('catalogSummary 统计键数/条目数/来源/等级', () => {
  const summary = catalogSummary(fixtureIndex());
  assert.equal(summary.keys, 2); // kimik3 / deepseekv4flash
  assert.equal(summary.entries, 3);
  assert.equal(summary.bySource[CATALOG_SOURCES.modelsDev], 3);
  assert.equal(summary.byTier.L1, 2);
  assert.equal(summary.byTier.L3, 1);
});

// --- 离线源装载（不依赖真实 DSH 安装）------------------------------------

test('piAiDataDirCandidates 解析失败也不抛，且始终带兜底路径', () => {
  const dirs = piAiDataDirCandidates({
    requireResolve: () => { throw new Error('not installed'); },
    home: '/home/u',
    env: {},
  });
  assert.ok(dirs.length >= 2);
  assert.ok(dirs.some((d) => d.includes('pi-ai')));
  assert.ok(dirs.includes('/home/u/.dsh/profiles/node_modules/@earendil-works/pi-ai/dist/providers/data'));
});

test('loadPiAiCatalog 目录都不存在时返回 null', async () => {
  const result = await loadPiAiCatalog({ dirs: ['/nonexistent/pi-ai/data'] });
  assert.equal(result, null);
});

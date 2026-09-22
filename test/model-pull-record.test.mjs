// dsh-chanhub —— 模型 Tab「拉取记录 + 覆盖」的宿主侧契约测试。
//
// 覆盖用户诉求：「拉取模型要能记录，重新拉取时覆盖掉」。两条语义都在这里钉死：
//   A. 记录 = 插件 settings 里的 modelPullSnapshot（**整字段 set = 覆盖**，不做合并）；
//   B. 覆盖 = 可选地把 DSH `llm-pi-ai providers.<provider>.models` 以网关目录整体替换，
//      覆盖前自动备份，可回滚。
import test from 'node:test';
import assert from 'node:assert/strict';

import { createHandler, ENDPOINTS, SETTINGS_DEFAULTS } from '../lib/index.js';
import { PI_NS } from '../lib/model-patch.js';

const PROVIDER = 'chanhub2api';

/** 造一个内存 settings 服务（只支持本用例用到的 set + path 数组）。 */
function makeSettingsStore() {
  const pluginNs = { ...SETTINGS_DEFAULTS };
  const piNs = { providers: { [PROVIDER]: { models: [] } } };
  const applyOps = (root, ops) => {
    for (const op of ops) {
      assert.equal(op.op, 'set', `本测试只实现 set，收到 ${op.op}`);
      let node = root;
      for (let i = 0; i < op.path.length - 1; i += 1) {
        const key = op.path[i];
        if (typeof node[key] !== 'object' || node[key] === null) node[key] = {};
        node = node[key];
      }
      node[op.path[op.path.length - 1]] = op.value;
    }
  };
  return {
    pluginNs,
    piNs,
    service: {
      get: (ns) => (ns === PI_NS ? piNs : pluginNs),
      register: () => ({ get: () => pluginNs, getSnapshot: () => pluginNs }),
      mutate: async (ns, ops) => {
        applyOps(ns === PI_NS ? piNs : pluginNs, ops);
        return { ok: true };
      },
    },
  };
}

/** 造 runtime（client 只实现本用例需要的 models()）。 */
function makeRuntime({ catalog, initialModels = [] }) {
  const store = makeSettingsStore();
  store.piNs.providers[PROVIDER].models = initialModels;
  // 记录网关调用次数：getModelRecord 的契约是「纯本地读」，一次都不许打网关。
  const calls = [];
  return {
    store,
    calls,
    handle: createHandler({
      client: {
        models: async () => {
          calls.push('models');
          return { object: 'list', data: catalog };
        },
      },
      settingsService: store.service,
      readSettings: () => store.pluginNs,
      resolveConfig: () => ({ baseURL: 'http://127.0.0.1:7866', apiKey: '' }),
      warnings: [],
      logger: undefined,
    }),
  };
}

const CATALOG_V1 = [
  { id: 'workbuddy:cn:glm-5.3-flash', name: 'A', context_length: 1000000, max_output_tokens: 64000, credits: 'x0.06' },
  { id: 'traework:cn:glm-5.3', name: 'B', context_length: 200000, max_output_tokens: 8000, credits: 'x0.39' },
];
const CATALOG_V2 = [
  // 名称/上文变了 → 算「变化」
  { id: 'workbuddy:cn:glm-5.3-flash', name: 'A2', context_length: 1000000, max_output_tokens: 64000, credits: 'x0.06' },
  // B 消失；新增 C
  { id: 'qoder:cn:qwen3-max', name: 'C', context_length: 128000, max_output_tokens: 16000 },
];

test('拉取记录：首次拉取写入快照，再次拉取**覆盖**旧记录（不是追加）', async () => {
  const v1 = makeRuntime({ catalog: CATALOG_V1 });
  const r1 = await v1.handle(ENDPOINTS.discoverModelsForPatch, { provider: PROVIDER });
  assert.equal(r1.ok, true);
  assert.equal(r1.value.record.recorded, true, '首次拉取必须落盘记录');
  assert.equal(r1.value.diff.first, true, '首次没有历史可比');
  assert.deepEqual(r1.value.diff.added.sort(), CATALOG_V1.map((m) => m.id).sort());
  assert.deepEqual(r1.value.diff.removed, [], '首次不能报「消失」');

  const snap1 = JSON.parse(v1.store.pluginNs.modelPullSnapshot);
  assert.equal(snap1.count, 2);
  assert.equal(snap1.provider, PROVIDER);
  // "都存"：展示列涉及的字段一个不少
  for (const key of ['id', 'name', 'ctx', 'maxOut', 'credits', 'vision']) {
    assert.ok(key in snap1.models[0], `快照字段缺 ${key}`);
  }

  // 第二次拉取：目录变了 → 记录被整体覆盖（字段里只有最新一份）
  const v2 = makeRuntime({ catalog: CATALOG_V2 });
  v2.store.pluginNs.modelPullSnapshot = v1.store.pluginNs.modelPullSnapshot;
  const r2 = await v2.handle(ENDPOINTS.discoverModelsForPatch, { provider: PROVIDER });
  assert.equal(r2.ok, true);
  const snap2 = JSON.parse(v2.store.pluginNs.modelPullSnapshot);
  assert.equal(snap2.count, 2, '覆盖后是本次目录的数量');
  assert.deepEqual(snap2.models.map((m) => m.id).sort(), CATALOG_V2.map((m) => m.id).sort());
  assert.equal(snap2.models.find((m) => m.id === 'workbuddy:cn:glm-5.3-flash').name, 'A2', '字段被新值覆盖');
  assert.equal(JSON.stringify(v2.store.pluginNs.modelPullSnapshot).includes('traework:cn:glm-5.3'), false, '旧记录不得残留');
  // 差异：新增 1 / 消失 1 / 变化 1
  assert.deepEqual(r2.value.diff.added, ['qoder:cn:qwen3-max']);
  assert.deepEqual(r2.value.diff.removed, ['traework:cn:glm-5.3']);
  assert.equal(r2.value.diff.changed.length, 1);
  assert.deepEqual(r2.value.diff.changed[0].fields, ['name']);
  assert.equal(r2.value.overwrote, false, '没开覆盖开关时不许动 DSH 配置');
  assert.deepEqual(v2.store.piNs.providers[PROVIDER].models, [], '未开覆盖时 DSH 模型配置保持原样');
});

test('覆盖 DSH 模型配置：以网关为准增删改 + 自动备份 + 额外键保留', async () => {
  const initial = [
    { id: 'workbuddy:cn:glm-5.3-flash', name: 'old', contextWindow: 1, maxTokens: 2, custom: 'keep-me' },
    { id: 'gone:model', name: 'gone' },
  ];
  const { handle, store } = makeRuntime({ catalog: CATALOG_V1, initialModels: initial });
  const r = await handle(ENDPOINTS.discoverModelsForPatch, { provider: PROVIDER, overwriteDshModels: true });
  assert.equal(r.ok, true);
  assert.equal(r.value.overwrote, true);
  const models = store.piNs.providers[PROVIDER].models;
  assert.deepEqual(models.map((m) => m.id), CATALOG_V1.map((m) => m.id), '目录顺序与内容即新配置；旧 id 不残留');
  const wb = models.find((m) => m.id === 'workbuddy:cn:glm-5.3-flash');
  assert.equal(wb.name, 'A', '名称按网关刷新');
  assert.equal(wb.contextWindow, 1000000, '上文按网关刷新');
  assert.deepEqual(wb.input, ['text', 'image'], '白名单视觉模型自动带图片能力');
  assert.equal(wb.custom, 'keep-me', '原条目里我们不认识的键要保留');
  const trae = models.find((m) => m.id === 'traework:cn:glm-5.3');
  assert.equal(trae.input, undefined, '非白名单模型不补 input');
  // 备份 = 覆盖前现状
  const backup = JSON.parse(store.pluginNs.modelSyncBackup);
  assert.equal(backup.count, 2);
  assert.deepEqual(backup.models.map((m) => m.id), initial.map((m) => m.id));
  assert.equal(r.value.backup.count, 2);
});

test('回滚：把备份原样写回；没有备份时如实拒绝', async () => {
  const initial = [{ id: 'workbuddy:cn:glm-5.3-flash', name: 'old' }, { id: 'gone:model' }];
  const { handle, store } = makeRuntime({ catalog: CATALOG_V1, initialModels: initial });
  assert.equal((await handle(ENDPOINTS.rollbackModelsSync, { provider: PROVIDER })).error.code, 'no-backup');
  await handle(ENDPOINTS.discoverModelsForPatch, { provider: PROVIDER, overwriteDshModels: true });
  assert.equal(store.piNs.providers[PROVIDER].models.length, 2);
  const r = await handle(ENDPOINTS.rollbackModelsSync, { provider: PROVIDER });
  assert.equal(r.ok, true);
  assert.equal(r.value.restored, 2);
  assert.deepEqual(store.piNs.providers[PROVIDER].models.map((m) => m.id), initial.map((m) => m.id), '回滚后与覆盖前一致');
  // 幂等：可以再滚一次
  assert.equal((await handle(ENDPOINTS.rollbackModelsSync, { provider: PROVIDER })).ok, true);
});

test('清空记录：只清快照，不动 DSH 模型配置与备份', async () => {
  const { handle, store } = makeRuntime({ catalog: CATALOG_V1, initialModels: [{ id: 'x' }] });
  await handle(ENDPOINTS.discoverModelsForPatch, { provider: PROVIDER, overwriteDshModels: true });
  const before = JSON.stringify(store.piNs.providers[PROVIDER].models);
  const backupBefore = store.pluginNs.modelSyncBackup;
  const r = await handle(ENDPOINTS.clearModelRecord, {});
  assert.equal(r.ok, true);
  assert.equal(store.pluginNs.modelPullSnapshot, '');
  assert.equal(JSON.stringify(store.piNs.providers[PROVIDER].models), before, 'DSH 配置不许被清记录顺手改掉');
  assert.equal(store.pluginNs.modelSyncBackup, backupBefore);
});

test('坏记录（用户手改坏 JSON）降级为「无记录」，且不阻塞拉取', async () => {
  const { handle, store } = makeRuntime({ catalog: CATALOG_V1 });
  store.pluginNs.modelPullSnapshot = '{ 这不是 JSON';
  const r = await handle(ENDPOINTS.discoverModelsForPatch, { provider: PROVIDER });
  assert.equal(r.ok, true);
  assert.equal(r.value.previous, null);
  assert.equal(r.value.diff.first, true, '坏记录按首次处理，不编造「消失」');
  assert.equal(JSON.parse(store.pluginNs.modelPullSnapshot).count, 2, '坏记录被本次正常快照覆盖');
});

// ── getModelRecord：打开面板时的「回显」，用户诉求「别每次打开都重新拉取」──

test('getModelRecord：没有记录时如实返回空，且不请求网关', async () => {
  const { handle, calls } = makeRuntime({ catalog: CATALOG_V1 });
  const r = await handle(ENDPOINTS.getModelRecord, {});
  assert.equal(r.ok, true);
  assert.equal(r.value.record, null, '没有记录就是 null，不许编一个「刚刚拉过」');
  assert.deepEqual(r.value.models, []);
  assert.deepEqual(r.value.backup, { at: 0, count: 0 });
  assert.deepEqual(calls, [], '回显是纯本地读，一次网关请求都不该发');
});

test('getModelRecord：把快照还原成目录形态（打开面板即有内容，无需重新拉取）', async () => {
  const { handle, calls } = makeRuntime({ catalog: CATALOG_V1 });
  await handle(ENDPOINTS.discoverModelsForPatch, { provider: PROVIDER });
  calls.length = 0;

  const r = await handle(ENDPOINTS.getModelRecord, {});
  assert.equal(r.ok, true);
  assert.deepEqual(calls, [], '回显不许打网关');
  assert.equal(r.value.record.count, 2);
  assert.equal(r.value.record.recorded, true);
  assert.equal(r.value.provider, PROVIDER);
  assert.deepEqual(r.value.models.map((m) => m.id), CATALOG_V1.map((m) => m.id));

  // 字段要从快照的短名（ctx/maxOut/vision）还原回表格吃的目录名。
  const flash = r.value.models.find((m) => m.id === 'workbuddy:cn:glm-5.3-flash');
  assert.equal(flash.name, 'A');
  assert.equal(flash.contextWindow, 1000000);
  assert.equal(flash.maxTokens, 64000);
  assert.equal(flash.credits, 'x0.06');
  assert.equal(flash.supportsImages, true, '白名单视觉模型回显后仍可勾选');

  const trae = r.value.models.find((m) => m.id === 'traework:cn:glm-5.3');
  assert.equal(trae.supportsImages, false, '非白名单模型回显后仍是纯文本');
});

test('getModelRecord：带出可回滚的备份；清空记录后回到空', async () => {
  const { handle } = makeRuntime({ catalog: CATALOG_V1, initialModels: [{ id: 'x' }] });
  await handle(ENDPOINTS.discoverModelsForPatch, { provider: PROVIDER, overwriteDshModels: true });
  const withBackup = await handle(ENDPOINTS.getModelRecord, {});
  assert.equal(withBackup.value.backup.count, 1, '覆盖过的备份要能被面板读到（决定要不要显示回滚按钮）');
  assert.ok(withBackup.value.backup.at > 0);

  await handle(ENDPOINTS.clearModelRecord, {});
  const after = await handle(ENDPOINTS.getModelRecord, {});
  assert.equal(after.value.record, null);
  assert.deepEqual(after.value.models, []);
});

test('getModelRecord：快照被手改坏时降级为「无记录」，不打网关也不抛错', async () => {
  const { handle, store, calls } = makeRuntime({ catalog: CATALOG_V1 });
  store.pluginNs.modelPullSnapshot = '{"models": "不是数组"}';
  const r = await handle(ENDPOINTS.getModelRecord, {});
  assert.equal(r.ok, true, '坏记录不能让模型 Tab 打不开');
  assert.equal(r.value.record, null);
  assert.deepEqual(r.value.models, []);
  assert.deepEqual(calls, []);
});

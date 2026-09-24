// dsh-chanhub —— model-patch 纯逻辑测试。
// 覆盖：网关 /v1/models → 目录快照；DSH 模型补 input 视觉能力的 read-modify-write。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addImageInput,
  buildModelsPatch,
  catalogFromSnapshot,
  diffModelSnapshots,
  listFromGatewayBody,
  modelsFromCatalog,
  parseSnapshot,
  providerModelsPath,
  snapshotFromCatalog,
  PI_NS,
} from '../lib/model-patch.js';

test('listFromGatewayBody 以白名单判定多模态（不信网关 fields）', () => {
  const body = {
    object: 'list',
    data: [
      // 白名单内（真视觉），即便网关误标 false 也应为 true
      { id: 'workbuddy:cn:glm-5.3-flash', name: '[workbuddy] GLM-5.3-Flash · x0.06', context_length: 1000000, max_output_tokens: 64000, supports_images: false, credits: 'x0.06' },
      // 白名单外（纯文本），即便网关误标 true 也应为 false
      { id: 'traework:cn:glm-5.3', name: '[traework] GLM-5.3 · x0.39', context_length: 200000, max_output_tokens: null, supports_images: true },
      // trae 白名单内
      { id: 'traework:cn:kimi-k3', name: '[traework] Kimi-K3 · x1.83', supports_images: false },
      { id: 'workbuddy:cn:glm-5.3-flash', name: 'dup', supports_images: true }, // 去重，保首
    ],
  };
  const out = listFromGatewayBody(body);
  assert.equal(out.length, 3);
  assert.equal(out[0].id, 'workbuddy:cn:glm-5.3-flash');
  assert.equal(out[0].contextWindow, 1000000);
  assert.equal(out[0].maxTokens, 64000);
  assert.equal(out[0].supportsImages, true); // 白名单覆盖网关 false
  assert.equal(out[0].credits, 'x0.06');
  assert.equal(out[1].id, 'traework:cn:glm-5.3');
  assert.equal(out[1].supportsImages, false); // 白名单外，网关 true 不采信
  assert.equal(out[1].maxTokens, undefined);
  assert.equal(out[2].id, 'traework:cn:kimi-k3');
  assert.equal(out[2].supportsImages, true); // trae 白名单内
});

test('listFromGatewayBody 兼容裸数组与字段缺省', () => {
  assert.deepEqual(listFromGatewayBody([{ id: 'a', supports_images: true }]).map((m) => m.id), ['a']);
  assert.deepEqual(listFromGatewayBody({}), []);
  assert.deepEqual(listFromGatewayBody({ data: null }), []);
  // 缺 id / 空 id 会被丢弃
  assert.deepEqual(listFromGatewayBody({ data: [{ id: '', name: 'x' }] }), []);
});

test('buildModelsPatch 给白名单视觉模型补 image、跳过非白名单、不动未勾选', () => {
  const current = [
    { id: 'workbuddy:cn:glm-5v-turbo', name: 'glm5v', contextWindow: 1000000, maxTokens: 64000 },
    { id: 'workbuddy:cn:deepseek-v4.1-flash', name: 'ds', contextWindow: 1000000, maxTokens: 128000 },
    { id: 'traework:cn:glm-5.3', name: 'tw' }, // 未勾选 → 不动
  ];
  // 勾选：白名单内 glm-5v-turbo、deepseek-v4.1-flash；白名单外 traework:cn:glm-5.3
  const { models, added, skipped } = buildModelsPatch(current, ['workbuddy:cn:glm-5v-turbo', 'workbuddy:cn:deepseek-v4.1-flash', 'traework:cn:glm-5.3', 'nope:missing']);
  assert.equal(models.length, 3);
  const glm = models.find((m) => m.id === 'workbuddy:cn:glm-5v-turbo');
  assert.deepEqual(glm.input, ['text', 'image']);
  assert.equal(glm.contextWindow, 1000000); // 保留
  const ds = models.find((m) => m.id === 'workbuddy:cn:deepseek-v4.1-flash');
  assert.deepEqual(ds.input, ['text', 'image']);
  const tw = models.find((m) => m.id === 'traework:cn:glm-5.3');
  assert.equal(tw.input, undefined); // 非白名单勾选 → 不落补丁；且其它未勾选项不动
  // workbuddy:cn:glm-5v-turbo 与 deepseek-v4.1-flash 补上；traework:cn:glm-5.3 被防御性跳过
  assert.deepEqual(added, ['workbuddy:cn:glm-5v-turbo', 'workbuddy:cn:deepseek-v4.1-flash']);
  assert.deepEqual(skipped.sort(), ['nope:missing', 'traework:cn:glm-5.3']);
});

test('buildModelsPatch 幂等：已含 image 不重复加、不误报 added', () => {
  const current = [{ id: 'm', input: ['text', 'image'] }];
  const { models, added } = buildModelsPatch(current, ['m']);
  assert.deepEqual(models[0].input, ['text', 'image']);
  assert.deepEqual(added, []);
});

test('buildModelsPatch 不改传入对象（深拷贝隔离）', () => {
  const current = [{ id: 'm', name: 'x' }];
  const before = JSON.stringify(current);
  buildModelsPatch(current, ['m']);
  assert.equal(JSON.stringify(current), before);
});

test('addImageInput 幂等与归一化', () => {
  assert.equal(addImageInput({ id: 'a', input: ['text', 'image'] }), false); // 已有 → 无改动
  const m1 = { id: 'a' };
  assert.equal(addImageInput(m1), true);
  assert.deepEqual(m1.input, ['text', 'image']);
  const m2 = { id: 'b', input: ['image'] };
  assert.equal(addImageInput(m2), true);
  assert.deepEqual(m2.input, ['text', 'image']); // text 挪到首位
  const m3 = { id: 'c', input: ['text', 'image', 'text'] };
  assert.equal(addImageInput(m3), true); // 重复 text → 归一化
  assert.deepEqual(m3.input, ['text', 'image']);
});

test('常量与路径助手', () => {
  assert.equal(PI_NS, 'llm-pi-ai');
  assert.deepEqual(providerModelsPath('chanhub2api'), ['providers', 'chanhub2api', 'models']);
});
// ---------------------------------------------------------------------------
// 拉取记录（快照）/ 差异 / 覆盖用目录映射 —— 纯函数
// ---------------------------------------------------------------------------

const CAT = [
  { id: 'workbuddy:cn:glm-5.3-flash', name: 'A', contextWindow: 1000000, maxTokens: 64000, credits: 'x0.06', supportsImages: true, official: true },
  { id: 'traework:cn:glm-5.3', name: 'B', contextWindow: 200000, supportsImages: false },
];

test('snapshotFromCatalog：字段都存（id/name/ctx/maxOut/credits/vision），无 id 的条目丢弃', () => {
  const snap = snapshotFromCatalog([...CAT, { name: 'no-id' }, null], { at: 123, provider: 'chanhub2api' });
  assert.equal(snap.at, 123);
  assert.equal(snap.provider, 'chanhub2api');
  assert.equal(snap.count, 2);
  assert.deepEqual(snap.models[0], { id: 'workbuddy:cn:glm-5.3-flash', name: 'A', ctx: 1000000, maxOut: 64000, credits: 'x0.06', note: '', noteDetail: '', vision: true, official: true });
  assert.deepEqual(snap.models[1], { id: 'traework:cn:glm-5.3', name: 'B', ctx: 200000, maxOut: undefined, credits: '', note: '', noteDetail: '', vision: false, official: false });
});

test('parseSnapshot：坏 JSON / 形状不对一律降级为 null（不抛）', () => {
  assert.equal(parseSnapshot(undefined), null);
  assert.equal(parseSnapshot(''), null);
  assert.equal(parseSnapshot('   '), null);
  assert.equal(parseSnapshot('{不是 JSON'), null);
  assert.equal(parseSnapshot('{"models":{}}'), null); // models 必须是数组
  assert.equal(parseSnapshot('"字符串"'), null);
  const ok = parseSnapshot(JSON.stringify(snapshotFromCatalog(CAT, { at: 9, provider: 'p' })));
  assert.equal(ok.count, 2);
  assert.equal(ok.models[0].vision, true);
});

test('diffModelSnapshots：首次不报「消失」；之后按新增/消失/逐字段变化算', () => {
  const s1 = snapshotFromCatalog(CAT, { at: 1, provider: 'p' });
  const first = diffModelSnapshots(null, s1);
  assert.equal(first.first, true);
  assert.deepEqual(first.added, CAT.map((m) => m.id));
  assert.deepEqual(first.removed, [], '首次拉取没有「上游消失」可言');
  // 无变化
  const same = diffModelSnapshots(s1, snapshotFromCatalog(CAT, { at: 2, provider: 'p' }));
  assert.deepEqual({ added: same.added, removed: same.removed, changed: same.changed }, { added: [], removed: [], changed: [] });
  // 改名 + 上文变 + 消失 + 新增 + 视觉能力变
  const s2 = snapshotFromCatalog([
    { id: 'workbuddy:cn:glm-5.3-flash', name: 'A2', contextWindow: 500000, maxTokens: 64000, credits: 'x0.06', supportsImages: false },
    { id: 'qoder:cn:new', name: 'C' },
  ], { at: 3, provider: 'p' });
  const d = diffModelSnapshots(s1, s2);
  assert.equal(d.first, false);
  assert.deepEqual(d.added, ['qoder:cn:new']);
  assert.deepEqual(d.removed, ['traework:cn:glm-5.3']);
  assert.deepEqual(d.changed, [{ id: 'workbuddy:cn:glm-5.3-flash', fields: ['name', 'ctx', 'vision'] }]);
});

test('modelsFromCatalog：以网关为准（增删改）+ 白名单补 input + 保留原条目额外键', () => {
  const previous = [
    { id: 'workbuddy:cn:glm-5.3-flash', name: 'old', contextWindow: 1, maxTokens: 2, custom: 'keep', input: ['text'] },
    { id: 'gone:model', name: 'gone' },
  ];
  const out = modelsFromCatalog(CAT, { previous });
  assert.deepEqual(out.map((m) => m.id), CAT.map((m) => m.id), '目录里没有的旧 id 被丢弃');
  const wb = out[0];
  assert.equal(wb.name, 'A');
  assert.equal(wb.contextWindow, 1000000);
  assert.equal(wb.maxTokens, 64000);
  assert.deepEqual(wb.input, ['text', 'image'], '白名单视觉模型补图片能力');
  assert.equal(wb.custom, 'keep', '我们不认识的键保留（不吞 DSH/用户配置）');
  assert.equal(out[1].input, undefined, '非白名单不补 input');
  assert.deepEqual(modelsFromCatalog([{ id: 'x' }], { previous: [] }), [{ id: 'x' }]);
  assert.deepEqual(modelsFromCatalog(null, {}), []);
});

// ---------------------------------------------------------------------------
// catalogFromSnapshot —— 快照还原成目录（打开模型 Tab 时回显，不打网关）
// ---------------------------------------------------------------------------

test('catalogFromSnapshot：短名还原回目录名，视觉能力随 vision 走', () => {
  const snap = snapshotFromCatalog(CAT, { at: 7, provider: 'p' });
  const out = catalogFromSnapshot(snap);
  assert.deepEqual(out, [
    { id: 'workbuddy:cn:glm-5.3-flash', name: 'A', contextWindow: 1000000, maxTokens: 64000, credits: 'x0.06', creditsNote: undefined, creditsNoteDetail: undefined, supportsImages: true, official: true },
    { id: 'traework:cn:glm-5.3', name: 'B', contextWindow: 200000, maxTokens: undefined, credits: undefined, creditsNote: undefined, creditsNoteDetail: undefined, supportsImages: false, official: false },
  ]);
});

test('diffModelSnapshots：同内容的 efforts 数组不算「变化」（引用比较会让变化数恒假）', () => {
  // 真机踩到：efforts 是数组，用 !== 比引用时两次拉取的同内容数组永远不相等 ——
  // 「变化 N」恒定报 51（所有带档位的模型），面板上那个筛选等于没有。
  const a = snapshotFromCatalog([{ id: 'x', name: 'X', reasoningEfforts: ['low', 'high'] }], { at: 1, provider: 'p' });
  const b = snapshotFromCatalog([{ id: 'x', name: 'X', reasoningEfforts: ['low', 'high'] }], { at: 2, provider: 'p' });
  assert.notEqual(a.models[0].efforts, b.models[0].efforts, '两次快照拿到的确实是不同数组实例');
  assert.deepEqual(diffModelSnapshots(a, b).changed, [], '内容相同就不该报变化');

  // 真变了（少一档）必须报出来
  const c = snapshotFromCatalog([{ id: 'x', name: 'X', reasoningEfforts: ['low'] }], { at: 3, provider: 'p' });
  assert.deepEqual(diffModelSnapshots(b, c).changed, [{ id: 'x', fields: ['efforts'] }]);
  // 一侧有、一侧没有也算变
  const d = snapshotFromCatalog([{ id: 'x', name: 'X' }], { at: 4, provider: 'p' });
  assert.deepEqual(diffModelSnapshots(c, d).changed, [{ id: 'x', fields: ['efforts'] }]);
});

// ---------------------------------------------------------------------------
// 倍率补充（qoder 错峰折扣）—— 网关 credits_note → 面板 → 快照往返
// ---------------------------------------------------------------------------

test('listFromGatewayBody：读网关的 credits_note / credits_note_detail', () => {
  const out = listFromGatewayBody({
    data: [
      {
        id: 'qoder:work:qwen3.8-max',
        name: '[qoder:work] Qwen3.8-Max',
        credits: 'x0.20',
        credits_note: '错峰 4 折 · 原 x0.50',
        credits_note_detail: '错峰时段4折优惠（10 PM-8 AM UTC+8）',
      },
      // 无折扣的模型：两个键都不写（不是空串）—— 面板据此不渲染那一格。
      { id: 'qoder:work:glm-5.3', name: 'GLM-5.3', credits: 'x0.80' },
    ],
  });
  assert.equal(out[0].credits, 'x0.20');
  assert.equal(out[0].creditsNote, '错峰 4 折 · 原 x0.50');
  assert.equal(out[0].creditsNoteDetail, '错峰时段4折优惠（10 PM-8 AM UTC+8）');
  assert.equal(out[1].creditsNote, undefined, '上游没给折扣就不该编一个空串出来');
  assert.equal(out[1].creditsNoteDetail, undefined);
});

test('折扣说明能穿过快照往返（打开面板回显时不丢）', () => {
  const catalog = listFromGatewayBody({
    data: [{
      id: 'qoder:work:qwen3.8-max',
      name: 'Qwen3.8-Max',
      credits: 'x0.20',
      credits_note: '错峰 4 折 · 原 x0.50',
      credits_note_detail: '错峰时段4折优惠（10 PM-8 AM UTC+8）',
    }],
  });
  // catalog → 快照 → 解析 → 还原，四步之后折扣仍在。
  const restored = catalogFromSnapshot(parseSnapshot(JSON.stringify(snapshotFromCatalog(catalog, { at: 1, provider: 'p' }))));
  assert.equal(restored[0].creditsNote, '错峰 4 折 · 原 x0.50');
  assert.equal(restored[0].creditsNoteDetail, '错峰时段4折优惠（10 PM-8 AM UTC+8）');
});

test('错峰折扣**不进**差异比对（按小时切换，不该天天报「变化」）', () => {
  const withPromo = listFromGatewayBody({
    data: [{ id: 'qoder:work:m', name: 'M', credits: 'x0.20', credits_note: '错峰 4 折 · 原 x0.50' }],
  });
  // 倍率与折扣一起变（错峰开始/结束）—— 差异只应报 credits 一项，不重复报折扣。
  const withoutPromo = listFromGatewayBody({
    data: [{ id: 'qoder:work:m', name: 'M', credits: 'x0.50' }],
  });
  const d = diffModelSnapshots(
    snapshotFromCatalog(withoutPromo, { at: 1, provider: 'p' }),
    snapshotFromCatalog(withPromo, { at: 2, provider: 'p' }),
  );
  assert.deepEqual(d.changed, [{ id: 'qoder:work:m', fields: ['credits'] }]);
});

test('catalogFromSnapshot：catalog→snapshot→catalog 往返不丢展示字段', () => {
  const back = catalogFromSnapshot(snapshotFromCatalog(CAT, { at: 1, provider: 'p' }));
  // credits 缺省与 maxTokens 缺省在往返中会收敛成 undefined（原本就没有），其余逐字相同。
  assert.deepEqual(back.map((m) => [m.id, m.name, m.contextWindow, m.supportsImages]),
    CAT.map((m) => [m.id, m.name, m.contextWindow, m.supportsImages]));
});

test('catalogFromSnapshot：空/坏输入一律给空数组，且名称缺失回落成 id', () => {
  assert.deepEqual(catalogFromSnapshot(null), []);
  assert.deepEqual(catalogFromSnapshot({}), []);
  assert.deepEqual(catalogFromSnapshot({ models: null }), []);
  assert.deepEqual(catalogFromSnapshot({ models: [{ id: '' }, null, { id: 'x' }] }), [
    { id: 'x', name: 'x', contextWindow: undefined, maxTokens: undefined, credits: undefined, creditsNote: undefined, creditsNoteDetail: undefined, supportsImages: false, official: false },
  ]);
});

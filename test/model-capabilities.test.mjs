// dsh-chanhub —— 能力基线（沉淀）与覆盖路径的纯逻辑测试。
//
// 用户诉求：目录比对出来的标注要「沉淀」下来，别每次靠临时判断。
// 本测试钉死四件事：
//   1. 沉淀**只收确认态** —— 借判/模糊/冲突/别名/无收录一律不写（不把猜测写成事实）；
//   2. 基线里 image=true 的模型获得视觉能力（白名单不必手工扩张）；
//   3. 坏 JSON 一律降级为「没有基线」，绝不让面板打不开；
//   4. reasoningEfforts 是**对象映射**（网关给的是数组），且不声明 off（本路由关不掉，
//      声明了就是给用户一个按了没用的开关）。
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  VISION_MODEL_WHITELIST,
  buildCompletionPatch,
  buildModelsPatch,
  capabilityVisionSet,
  catalogFromSnapshot,
  isVisionModel,
  listFromGatewayBody,
  diffModelSnapshots,
  mergeCapabilities,
  modelsFromCatalog,
  parseCapabilities,
  parseSnapshot,
  reasoningEffortsFromGateway,
  serializeCapabilities,
  snapshotFromCatalog,
} from '../lib/model-patch.js';

// --- 基线解析 -------------------------------------------------------------

test('parseCapabilities：坏值一律降级为 null', () => {
  assert.equal(parseCapabilities(''), null);
  assert.equal(parseCapabilities('   '), null);
  assert.equal(parseCapabilities('{不是 JSON'), null);
  assert.equal(parseCapabilities('[]'), null);
  assert.equal(parseCapabilities('{"at":1}'), null, '缺 entries 判废');
  assert.equal(parseCapabilities(undefined), null);
});

test('parseCapabilities：逐条过滤非法条目', () => {
  const parsed = parseCapabilities(JSON.stringify({
    at: 123,
    entries: {
      'a:ok-image': { image: true, status: 'confirmed', tier: 'L1' },
      'b:ok-text': { image: false, status: 'confirmed' },
      'c:bad': { image: 'yes' }, // image 必须是布尔
      'd:null': null,
    },
  }));
  assert.equal(parsed.at, 123);
  assert.deepEqual(Object.keys(parsed.entries).sort(), ['a:ok-image', 'b:ok-text']);
  assert.equal(parsed.entries['a:ok-image'].image, true);
  assert.equal(parsed.entries['b:ok-text'].image, false);
});

test('capabilityVisionSet：只收 image=true', () => {
  const baseline = parseCapabilities(JSON.stringify({
    at: 1,
    entries: { 'a:1': { image: true }, 'b:2': { image: false } },
  }));
  const set = capabilityVisionSet(baseline);
  assert.equal(set.has('a:1'), true);
  assert.equal(set.has('b:2'), false);
  assert.equal(capabilityVisionSet(null).size, 0);
});

test('serializeCapabilities：键排序，可 diff', () => {
  const text = serializeCapabilities({
    at: 5,
    entries: { 'z:1': { image: true, status: 'confirmed', tier: 'L1', how: '精确', at: 1 }, 'a:1': { image: false, status: 'confirmed', tier: 'L1', how: '精确', at: 1 } },
  });
  assert.ok(text.indexOf('"a:1"') < text.indexOf('"z:1"'), '键要排序');
  assert.equal(JSON.parse(text).at, 5);
});

// --- 沉淀 -----------------------------------------------------------------

const CONFIRMED_IMAGE = { id: 'workbuddy:global:kimi-k3', status: 'confirmed', verdict: 'image', tier: 'L1', how: '精确' };
const CONFIRMED_TEXT = { id: 'workbuddy:cn:glm-5.3', status: 'confirmed', verdict: 'text', tier: 'L1', how: '精确' };
const BORROWED = { id: 'workbuddy:cn:kimi-k3-1', status: 'borrowed', verdict: 'image', tier: 'L1', how: '剥后缀→kimik3' };
const CONFLICT = { id: 'x:y', status: 'conflict', verdict: 'unknown' };
const MISSING = { id: 'x:z', status: 'missing', verdict: 'unknown' };
const ALIAS = { id: 'workbuddy:cn:auto', status: 'alias', verdict: 'unknown' };

test('mergeCapabilities：只沉淀确认态，其余计入 skipped', () => {
  const merged = mergeCapabilities(null, [CONFIRMED_IMAGE, CONFIRMED_TEXT, BORROWED, CONFLICT, MISSING, ALIAS], { at: 7 });
  assert.deepEqual(merged.added, ['workbuddy:global:kimi-k3', 'workbuddy:cn:glm-5.3']);
  assert.equal(merged.count, 2);
  assert.equal(merged.skipped, 4, '借判/冲突/无收录/别名都不写');
  assert.equal(merged.entries['workbuddy:global:kimi-k3'].image, true);
  assert.equal(merged.entries['workbuddy:cn:glm-5.3'].image, false);
  assert.equal(merged.entries['workbuddy:global:kimi-k3'].at, 7);
});

test('mergeCapabilities：幂等（同一结论重复沉淀无变化）', () => {
  const once = mergeCapabilities(null, [CONFIRMED_IMAGE], { at: 1 });
  const twice = mergeCapabilities(serializeCapabilities(once), [CONFIRMED_IMAGE], { at: 2 });
  assert.deepEqual(twice.added, []);
  assert.deepEqual(twice.changed, []);
  assert.equal(twice.count, 1);
});

test('mergeCapabilities：结论反转要如实报 changed（图 → 文）', () => {
  const base = mergeCapabilities(null, [CONFIRMED_IMAGE], { at: 1 });
  const flipped = mergeCapabilities(serializeCapabilities(base), [{ ...CONFIRMED_IMAGE, verdict: 'text' }], { at: 2 });
  assert.deepEqual(flipped.changed, [{ id: 'workbuddy:global:kimi-k3', from: 'image', to: 'text' }]);
  assert.equal(flipped.entries['workbuddy:global:kimi-k3'].image, false);
});

test('mergeCapabilities：接受 parseCapabilities 结果或 settings 字符串', () => {
  const a = mergeCapabilities(parseCapabilities(serializeCapabilities(mergeCapabilities(null, [CONFIRMED_TEXT]))), [CONFIRMED_IMAGE]);
  assert.equal(a.count, 2);
  const b = mergeCapabilities(serializeCapabilities(a), []);
  assert.equal(b.count, 2);
  assert.deepEqual(b.added, []);
});

// --- 有效视觉集合 ---------------------------------------------------------

test('isVisionModel：白名单命中，或基线追加集命中', () => {
  const whitelisted = [...VISION_MODEL_WHITELIST][0];
  assert.equal(isVisionModel(whitelisted), true);
  assert.equal(isVisionModel('workbuddy:global:gpt-5.6-sol'), false);
  const extra = new Set(['workbuddy:global:gpt-5.6-sol']);
  assert.equal(isVisionModel('workbuddy:global:gpt-5.6-sol', extra), true);
  assert.equal(isVisionModel('workbuddy:global:gpt-5.6-sol', null), false);
});

test('listFromGatewayBody：extraVision 让基线确认的模型直接带上视觉', () => {
  const body = { data: [{ id: 'workbuddy:global:gpt-5.6-sol', name: 'Sol' }] };
  assert.equal(listFromGatewayBody(body)[0].supportsImages, false);
  const withBaseline = listFromGatewayBody(body, { extraVision: new Set(['workbuddy:global:gpt-5.6-sol']) });
  assert.equal(withBaseline[0].supportsImages, true);
});

test('buildModelsPatch：extraVision 放行，否则 skipped', () => {
  const current = [{ id: 'workbuddy:global:gpt-5.6-sol', name: 'Sol', contextWindow: 400000 }];
  const denied = buildModelsPatch(current, ['workbuddy:global:gpt-5.6-sol']);
  assert.deepEqual(denied.added, []);
  assert.deepEqual(denied.skipped, ['workbuddy:global:gpt-5.6-sol']);

  const allowed = buildModelsPatch(current, ['workbuddy:global:gpt-5.6-sol'], {
    extraVision: new Set(['workbuddy:global:gpt-5.6-sol']),
  });
  assert.deepEqual(allowed.added, ['workbuddy:global:gpt-5.6-sol']);
  assert.deepEqual(allowed.models[0].input, ['text', 'image']);
  assert.equal(allowed.models[0].contextWindow, 400000, '其余字段不动');
});

test('catalogFromSnapshot：快照形态与网关目录同形（基线叠加由宿主做）', () => {
  const models = catalogFromSnapshot({ at: 1, models: [{ id: 'a:1', name: '', ctx: 1000, maxOut: 100, credits: 'x1', vision: true }] });
  assert.equal(models[0].supportsImages, true);
  assert.equal(models[0].name, 'a:1', '名称缺失回落成 id');
});

// --- reasoningEfforts -----------------------------------------------------

test('reasoningEffortsFromGateway：数组 → 对象映射，过滤未知档位', () => {
  assert.deepEqual(reasoningEffortsFromGateway(['low', 'high']), { low: 'low', high: 'high' });
  assert.deepEqual(reasoningEffortsFromGateway(['high', 'bogus', 'off']), { high: 'high' });
  assert.deepEqual(reasoningEffortsFromGateway(['LOW', ' XHigh ']), { low: 'low', xhigh: 'xhigh' });
  assert.equal(reasoningEffortsFromGateway([]), undefined);
  assert.equal(reasoningEffortsFromGateway(undefined), undefined);
  assert.equal(reasoningEffortsFromGateway('high'), undefined);
});

test('modelsFromCatalog：把网关的推理档位写进 pi-ai 的 reasoningEfforts', () => {
  const models = modelsFromCatalog([{
    id: 'workbuddy:cn:glm-5.3',
    name: 'GLM 5.3',
    contextWindow: 200000,
    maxTokens: 32000,
    reasoningEfforts: ['low', 'high'],
  }]);
  assert.deepEqual(models[0].reasoningEfforts, { low: 'low', high: 'high' });
  assert.equal('off' in models[0].reasoningEfforts, false, '本路由关不掉思考，不声明 off');
});

test('modelsFromCatalog：网关没给档位就不写该字段（不猜默认档）', () => {
  const models = modelsFromCatalog([{ id: 'workbuddy:cn:glm-5.3', name: 'X', reasoningEfforts: undefined }]);
  assert.equal('reasoningEfforts' in models[0], false);
});

test('modelsFromCatalog：extraVision 决定是否补 input，额外键仍保留', () => {
  const previous = [{ id: 'workbuddy:global:gpt-5.6-sol', custom: 'keep-me', reasoningEfforts: { low: 'low' } }];
  const models = modelsFromCatalog([{ id: 'workbuddy:global:gpt-5.6-sol', name: 'Sol', contextWindow: 400000 }], {
    previous,
    extraVision: new Set(['workbuddy:global:gpt-5.6-sol']),
  });
  assert.deepEqual(models[0].input, ['text', 'image']);
  assert.equal(models[0].custom, 'keep-me');
  // 网关没给档位时，旧的 reasoningEfforts 不残留（它在我们管的键里）
  assert.equal('reasoningEfforts' in models[0], false);
});

// --- 补齐配置字段（不增不删，只填空缺）------------------------------------

const GATEWAY_ROW = {
  id: 'workbuddy:global:deepseek-v4.1-flash',
  name: '[workbuddy] DeepSeek-V4.1-Flash',
  contextWindow: 1000000,
  maxTokens: 128000,
  reasoningEfforts: ['low', 'high', 'max'],
};

test('buildCompletionPatch：把缺的三个字段一次补齐', () => {
  const plan = buildCompletionPatch([{ id: GATEWAY_ROW.id, name: 'x' }], [GATEWAY_ROW]);
  assert.deepEqual(plan.changes, [{
    id: GATEWAY_ROW.id,
    fields: ['contextWindow', 'maxTokens', 'reasoningEfforts'],
  }]);
  assert.equal(plan.unchanged, 0);
  const written = plan.models[0];
  assert.equal(written.contextWindow, 1000000, '这就是 256K 的解法');
  assert.equal(written.maxTokens, 128000);
  assert.deepEqual(written.reasoningEfforts, { low: 'low', high: 'high', max: 'max' });
  assert.equal(written.name, 'x', '已有字段不动');
});

test('buildCompletionPatch：默认不覆盖已有值（refresh=false）', () => {
  const current = [{ id: GATEWAY_ROW.id, contextWindow: 200000, maxTokens: 32000, reasoningEfforts: { low: 'low' } }];
  const plan = buildCompletionPatch(current, [GATEWAY_ROW]);
  assert.deepEqual(plan.changes, []);
  assert.equal(plan.unchanged, 1);
  assert.equal(plan.models[0].contextWindow, 200000, '手填的值默认不动');
  assert.deepEqual(plan.models[0].reasoningEfforts, { low: 'low' });
});

test('buildCompletionPatch：refresh=true 才刷新不一致的字段', () => {
  const current = [{ id: GATEWAY_ROW.id, contextWindow: 200000, maxTokens: 128000 }];
  const plan = buildCompletionPatch(current, [GATEWAY_ROW], { refresh: true });
  assert.deepEqual(plan.changes, [{ id: GATEWAY_ROW.id, fields: ['contextWindow', 'reasoningEfforts'] }]);
  assert.equal(plan.models[0].contextWindow, 1000000);
  assert.equal(plan.models[0].maxTokens, 128000, '一致的不动');
});

test('buildCompletionPatch：不增不删条目，目录里没有的原样留着', () => {
  const current = [{ id: 'local:only', name: '本地独有', contextWindow: 123 }];
  const plan = buildCompletionPatch(current, [GATEWAY_ROW, { id: 'gateway:only', contextWindow: 999 }]);
  assert.equal(plan.models.length, 1, '不新增目录里的条目');
  assert.deepEqual(plan.missingInCatalog, ['local:only']);
  assert.equal(plan.models[0].contextWindow, 123, '目录里没有就不动它');
});

test('buildCompletionPatch：视觉 input 只在有效视觉集合内才补', () => {
  const current = [{ id: GATEWAY_ROW.id }];
  assert.equal(buildCompletionPatch(current, [GATEWAY_ROW]).models[0].input, undefined);
  const withVision = buildCompletionPatch(current, [GATEWAY_ROW], { extraVision: new Set([GATEWAY_ROW.id]) });
  assert.deepEqual(withVision.models[0].input, ['text', 'image']);
  assert.ok(withVision.changes[0].fields.includes('input'));
});

test('buildCompletionPatch：网关自报 maxOut > ctx 只提示不擅自改', () => {
  const row = { id: 'qoder:work:deepseek-v4-pro', contextWindow: 200000, maxTokens: 384000 };
  const plan = buildCompletionPatch([{ id: row.id }], [row]);
  assert.deepEqual(plan.warnings, [{
    id: row.id, kind: 'max-out-gt-context', maxTokens: 384000, contextWindow: 200000,
  }]);
  assert.equal(plan.models[0].maxTokens, 384000, '照写，不替上游改数');
});

test('buildCompletionPatch：网关没给 maxTokens 就不写该字段（不编造）', () => {
  const row = { id: 'traework:cn:DeepSeek-V4-Flash-Official', contextWindow: 1000000 };
  const plan = buildCompletionPatch([{ id: row.id }], [row]);
  assert.deepEqual(plan.changes, [{ id: row.id, fields: ['contextWindow'] }]);
  assert.equal('maxTokens' in plan.models[0], false);
});

test('快照带上推理档位，且档位变化算「变化」', () => {
  const snap = snapshotFromCatalog([
    { id: 'a:1', name: 'A', contextWindow: 1000, maxTokens: 100, reasoningEfforts: ['low', 'high'] },
  ]);
  assert.deepEqual(snap.models[0].efforts, ['low', 'high']);
  const round = parseSnapshot(JSON.stringify(snap));
  assert.deepEqual(round.models[0].efforts, ['low', 'high']);
  // 还原成目录形态时档位要回来（补齐靠它）
  assert.deepEqual(catalogFromSnapshot(round)[0].reasoningEfforts, ['low', 'high']);
  // 网关改了档位 → 差异里要看得见
  const next = snapshotFromCatalog([
    { id: 'a:1', name: 'A', contextWindow: 1000, maxTokens: 100, reasoningEfforts: ['low'] },
  ]);
  assert.deepEqual(diffModelSnapshots(round, next).changed, [{ id: 'a:1', fields: ['efforts'] }]);
});

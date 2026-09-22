// dsh-chanhub —— model-patch 纯逻辑测试。
// 覆盖：网关 /v1/models → 目录快照；DSH 模型补 input 视觉能力的 read-modify-write。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listFromGatewayBody, buildModelsPatch, addImageInput, providerModelsPath, PI_NS } from '../lib/model-patch.js';

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
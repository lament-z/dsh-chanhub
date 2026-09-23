// model-scope —— 消费者模型集合匹配器的对齐锚点。
//
// **用例表与网关 chanhub 的 internal/server/keys_test.go 逐条相同**
// （TestMatchModelPattern / TestValidatePatterns / TestPrincipalScopeTriState）。
// 这不是巧合：面板的「这个 key 会看到什么」是本地算的（见 lib/model-scope.js
// 顶部说明），一旦两边规则漂移，面板就会显示一个与网关实际下发不一致的数字 ——
// 比不显示更糟。改任何一边都必须同步改这张表。
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_PATTERN_LEN,
  describeScope,
  matchesModelScope,
  validateScope,
  visibleModels,
} from '../lib/model-scope.js';

// 与 keys_test.go 的 TestMatchModelPattern 用例表逐条对应。
const MATCH_CASES = [
  ['*', 'workbuddy:cn:any', true],
  ['workbuddy:cn:*', 'workbuddy:cn:glm-5.3', true],
  ['workbuddy:cn:*', 'workbuddy:global:glm-5.3', false],
  ['workbuddy:cn:glm-5.3', 'workbuddy:cn:glm-5.3', true],
  ['workbuddy:cn:glm-5.3', 'workbuddy:cn:glm-5.30', false],
  ['traework:*', 'traework:cn:x', true],
  ['qoder:*', 'qoder:work:x', true],
  ['', 'workbuddy:cn:x', false],
];

test('matchesModelScope 与网关 matchModelPattern 逐条一致', () => {
  for (const [pattern, id, want] of MATCH_CASES) {
    assert.equal(matchesModelScope(pattern, id), want, `match(${pattern}, ${id})`);
  }
});

test('matchesModelScope 对非字符串输入一律不命中（不抛错）', () => {
  assert.equal(matchesModelScope(undefined, 'a:b:c'), false);
  assert.equal(matchesModelScope('*', undefined), false);
  assert.equal(matchesModelScope('*', 42), false);
});

test('visibleModels 三态语义与网关 Principal.Scope 同义', () => {
  const models = [{ id: 'workbuddy:cn:a' }, { id: 'workbuddy:cn:b' }, { id: 'traework:cn:c' }];

  // 字段缺失 = 全量
  assert.equal(visibleModels(models, undefined).length, 3);
  assert.equal(visibleModels(models, null).length, 3);
  // 显式空集 = 一个都不给（**不能**塌成"全量"——那会把"临时封禁"变成"放开全部"）
  assert.equal(visibleModels(models, []).length, 0);
  // 星号 = 全量
  assert.equal(visibleModels(models, ['*']).length, 3);
  // 前缀
  assert.deepEqual(visibleModels(models, ['workbuddy:cn:*']).map((m) => m.id), ['workbuddy:cn:a', 'workbuddy:cn:b']);
  // 精确
  assert.deepEqual(visibleModels(models, ['traework:cn:c']).map((m) => m.id), ['traework:cn:c']);
  // 保持原顺序（面板目录顺序不该因过滤而抖）
  assert.deepEqual(visibleModels(models, ['traework:cn:c', 'workbuddy:cn:*']).map((m) => m.id),
    ['workbuddy:cn:a', 'workbuddy:cn:b', 'traework:cn:c']);
});

test('describeScope 区分全量 / 空集 / 规则集', () => {
  assert.equal(describeScope(undefined).kind, 'all');
  assert.equal(describeScope(['*']).kind, 'all');
  assert.equal(describeScope([]).kind, 'none');
  assert.equal(describeScope(['a', 'b']).kind, 'patterns');
  assert.equal(describeScope(['a', 'b']).label, '2 条规则');
});

// 与 keys_test.go 的 TestValidatePatterns 用例表逐条对应。
test('validateScope 放行合法集合', () => {
  for (const value of [['*'], ['workbuddy:cn:*'], ['workbuddy:cn:glm-5.3'], []]) {
    assert.equal(validateScope(value).ok, true, JSON.stringify(value));
  }
});

test('validateScope 拒绝与网关同样形态的非法集合', () => {
  const bad = [
    ['work*buddy:cn:*'], // 中间带 *
    ['**'], // 多个 *
    [''], // 空串
    ['a b'], // 含空白
    ['x'.repeat(MAX_PATTERN_LEN + 1)], // 过长
    'not-an-array',
    [42],
  ];
  for (const value of bad) {
    assert.equal(validateScope(value).ok, false, JSON.stringify(value));
  }
});

test('validateScope 条数上限与网关 maxKeyPatterns 一致', () => {
  const over = Array.from({ length: 501 }, () => 'x');
  assert.equal(validateScope(over).ok, false);
  const atLimit = Array.from({ length: 500 }, (_, i) => `m${i}`);
  assert.equal(validateScope(atLimit).ok, true);
});

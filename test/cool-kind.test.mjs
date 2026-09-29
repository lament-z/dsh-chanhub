// dsh-chanhub —— cool_kind 文案映射（与 chanhub 的 Status.CoolKind 同源）
//
// 为什么要单测：cool_kind 由 chanhub 侧按「until / breakerUntil / degradeUntil 三截止
// 取最远者」派生，**不是**直接取存下来的 coolKind 字段（熔断与连败降权从不写那个
// 字段，而它的零值是 CoolHard）。取值：hard_credit / soft_rate / account_fault /
// breaker / degrade。
//
// 未识别的取值会落到 reason 兜底，而 reason 常是一句上游原文（如「6004 model rate
// limit」）——运维看不出「这是熔断还是账号级风控」。本测试把五个取值钉死，任何一边
// 新增取值都会在这里显形。
import test from 'node:test';
import assert from 'node:assert/strict';
import { accountState } from '../client/derive.js';

test('cool_kind 五个取值都有专属文案，不落到 reason 兜底', () => {
  const cases = [
    ['soft_rate', '软限流（429）'],
    ['hard_credit', '积分耗尽，冷却至次日 04:00'],
    ['account_fault', '账号级风控冷却中'],
    ['breaker', '熔断中'],
    ['degrade', '连败降权中'],
  ];
  for (const [kind, want] of cases) {
    const st = accountState({ uid: 'u1', cooling: true, cool_kind: kind, reason: '上游原文' }, 0);
    assert.equal(st.key, 'cooling', `${kind}: 应判为 cooling 态，实际 ${st.key}`);
    assert.ok(st.label.includes(want), `${kind}: label=${st.label}，应含「${want}」`);
    assert.ok(!st.label.includes('上游原文'), `${kind}: 不应落到 reason 兜底`);
  }
});

test('未知 cool_kind 仍回落 reason（不编造文案）', () => {
  const st = accountState(
    { uid: 'u1', cooling: true, cool_kind: 'something_new', reason: '上游原文' },
    0,
  );
  assert.ok(st.label.includes('上游原文'), `label=${st.label}，未知取值应回落 reason`);
});

test('既无 cool_kind 也无 reason 时显示「冷却中」', () => {
  const st = accountState({ uid: 'u1', cooling: true }, 0);
  assert.ok(st.label.includes('冷却中'), `label=${st.label}`);
});

test('冷却剩余时长仍照常拼接', () => {
  const st = accountState({ uid: 'u1', cooling: true, cool_kind: 'breaker', cool_remaining_sec: 90 }, 0);
  assert.ok(st.label.includes('熔断中'), `label=${st.label}`);
  assert.ok(/剩余/.test(st.detail), `detail=${st.detail}，应带剩余时长`);
});

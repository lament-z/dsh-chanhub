// dsh-chanhub —— 视觉能力实测（探针）层的测试。
//
// 这一层是「多模态能力」的最终裁决：目录是别人的二手标注，白名单是人工认定，
// 只有真发一张图、且模型**答对了图里的内容**，才算数。测试要钉死的是**纪律**：
//   1. 只发图看有没有报错不算数（真机：纯文本模型照样 200、甚至编一个颜色）——
//      所以探针必须行为化：图里画数字 + 背景色，答对才算看见；
//   2. thinking 模型会把预算烧在思考上（content 空、reasoning 满）→ 放大预算重试一次；
//   3. 模型不存在/无健康账号 → unknown（与视觉无关，不许赖到图上）；
//   4. unknown 一律不进基线；只有 image/text 才是可沉淀的确认态；
//   5. 串行 + 间隔 + 单批上限（保护账号），剩余项如实回报。
import test from 'node:test';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';

import {
  DEFAULT_PROBE_LIMIT,
  PROBE_COLORS,
  PROBE_QUESTION,
  PROBE_VERDICT,
  RETRY_PROBE_MAX_TOKENS,
  buildProbeCase,
  classifyProbeAnswer,
  classifyProbeOutcome,
  encodePng,
  probeAnswer,
  probeErrorMessage,
  probeModelVision,
  probeModelVisionBatch,
  probeRequestBody,
  probeSeed,
  probeSucceeded,
  probeVerdictsForCommit,
} from '../lib/model-probe.js';

const okBody = (content) => ({ choices: [{ message: { role: 'assistant', content } }] });
/** 该模型「看图作答」的正确回答（颜色同义词 + 数字）。 */
const correctAnswer = (id) => {
  const c = buildProbeCase(id);
  return `${c.expect.colorTokens[0]},${c.expect.digit}`;
};

/** 假网关：按脚本回应 `/v1/chat/completions`。 */
function fakeClient(handler) {
  const calls = [];
  return {
    calls,
    request: async (path, options) => {
      calls.push({ path, body: options?.body });
      return handler(options?.body, calls.length - 1);
    },
  };
}

// --- 造题与图片 -----------------------------------------------------------

test('buildProbeCase：同一模型固定样本（可复现），不同模型不同样本', () => {
  const a1 = buildProbeCase('workbuddy:cn:hy3');
  const a2 = buildProbeCase('workbuddy:cn:hy3');
  assert.equal(a1.dataUrl, a2.dataUrl, '同一 id 必须复现同一张图');
  assert.equal(a1.digit, a2.digit);
  assert.equal(a1.color, a2.color);
  const b = buildProbeCase('workbuddy:cn:glm-5.3');
  assert.notEqual(`${a1.color}/${a1.digit}`, `${b.color}/${b.digit}`, '不同模型不该总是同一题');
  assert.equal(probeSeed('x'), probeSeed('x'));
  assert.notEqual(probeSeed('x'), probeSeed('y'));
});

test('buildProbeCase：期望值合法（色在调色板里、数字 0-9）', () => {
  for (const id of ['a', 'b', 'workbuddy:cn:kimi-k3', 'qoder:work:qwen3.8-max', 'traework:cn:aquila']) {
    const c = buildProbeCase(id);
    assert.ok(PROBE_COLORS.some((p) => p.key === c.color), c.color);
    assert.match(c.digit, /^[0-9]$/);
    assert.ok(c.dataUrl.startsWith('data:image/png;base64,'));
    assert.ok(c.expect.colorTokens.length > 0);
  }
});

test('buildProbeCase：图里真的画了数字（解码 PNG 逐像素核对）', () => {
  const c = buildProbeCase('workbuddy:cn:hy3');
  const png = Buffer.from(c.dataUrl.split(',')[1], 'base64');
  assert.deepEqual([...png.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'PNG 魔数');
  assert.equal(png.readUInt32BE(16), 40, '宽 40');
  assert.equal(png.readUInt32BE(20), 40, '高 40');
  // 取出 IDAT 解压：filter=0，逐行 RGB
  let offset = 8;
  let idat = null;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') idat = png.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
  }
  const raw = zlib.inflateSync(idat);
  const stride = 40 * 3 + 1;
  const pixel = (x, y) => {
    const o = y * stride + 1 + x * 3;
    return [raw[o], raw[o + 1], raw[o + 2]];
  };
  const palette = PROBE_COLORS.find((p) => p.key === c.color);
  assert.deepEqual(pixel(0, 0), palette.rgb, '角落是背景色');
  // 数字笔画一定落在画布中间区域：统计中心白色像素
  let white = 0;
  for (let y = 8; y < 32; y += 1) for (let x = 13; x < 28; x += 1) {
    const [r, g, b] = pixel(x, y);
    if (r > 200 && g > 200 && b > 200) white += 1;
  }
  assert.ok(white > 100, `数字笔画要有足够白色像素，实际 ${white}`);
});

test('encodePng：自己编的 PNG 能被标准解码器读回', () => {
  const pixels = [...Array(4)].map(() => [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]]).flat();
  const png = encodePng(4, 4, pixels);
  assert.equal(png.toString('ascii', 12, 16), 'IHDR');
  assert.equal(png.readUInt32BE(16), 4);
});

// --- 提问与请求体 ---------------------------------------------------------

test('probeRequestBody：带图是两段 content，纯文本对照是字符串', () => {
  const c = buildProbeCase('a:1');
  const withImage = probeRequestBody('a:1', { dataUrl: c.dataUrl });
  assert.equal(withImage.model, 'a:1');
  assert.equal(withImage.stream, false);
  const parts = withImage.messages[0].content;
  assert.equal(parts.length, 2);
  assert.equal(parts[0].text, PROBE_QUESTION);
  assert.equal(parts[1].image_url.url, c.dataUrl);
  assert.ok(withImage.max_tokens >= 512, '预算要够 thinking 模型回答');

  const textOnly = probeRequestBody('a:1', { withImage: false, maxTokens: 32 });
  assert.equal(typeof textOnly.messages[0].content, 'string');
  assert.equal(textOnly.max_tokens, 32);
});

// --- 答案判定 -------------------------------------------------------------

test('classifyProbeAnswer：答对颜色与数字 → 图', () => {
  const expect = { digit: '7', colorTokens: ['紫', 'purple'] };
  assert.equal(classifyProbeAnswer({ content: '紫色, 7', expect }).verdict, PROBE_VERDICT.IMAGE);
  assert.equal(classifyProbeAnswer({ content: 'purple,7', expect }).verdict, PROBE_VERDICT.IMAGE);
  assert.equal(classifyProbeAnswer({ content: '背景是紫色，数字是 7', expect }).verdict, PROBE_VERDICT.IMAGE);
});

test('classifyProbeAnswer：自述看不到图 → 文', () => {
  for (const content of [
    '抱歉，我没有看到您上传的图片。',
    '请上传图片，我就能告诉您颜色。',
    "I can't see any image in your message.",
    '没有收到图片',
    // 真机原话（deepseek-r1-0528-lkeap / hunyuan-chat）：
    '不支持,0',
    '无法识别，当前模型不支持图片分析。请使用多模态模型或换一种方式描述图片内容。',
    '抱歉，我无法处理图像信息。请切换到支持多模态的模型，或使用文字描述图片内容。',
    // 二轮实测原话（traework:cn:DeepSeek-V4-Pro / DeepSeek-V4-Flash）
    '没有提供图像，无法回答。',
    '无法提供答案，因为没有图片。请提供图片描述。',
  ]) {
    const r = classifyProbeAnswer({ content, expect: { digit: '7', colorTokens: ['紫'] } });
    assert.equal(r.verdict, PROBE_VERDICT.TEXT, content);
  }
});

test('classifyProbeAnswer：数字对 + 色族对 → 图（真机：navy 答「蓝色」、maroon 答「红色」）', () => {
  // 真机原话：minimax-m3 期望 navy/3 答「蓝色,3」；deepseek-flash 期望 olive/7 答「绿色,7」；
  // deepseek-v4-pro 期望 teal/1 答「蓝绿色,1」；summary 期望 maroon/6 答「红色,6」
  const cases = [
    [{ digit: '3', colorTokens: ['深蓝', 'navy'], colorFamily: ['蓝', 'blue', 'navy'] }, '蓝色,3'],
    [{ digit: '7', colorTokens: ['橄榄', 'olive'], colorFamily: ['绿', 'green', 'olive'] }, '绿色,7'],
    [{ digit: '1', colorTokens: ['青', 'teal'], colorFamily: ['青', '蓝绿', 'teal'] }, '蓝绿色,1'],
    [{ digit: '6', colorTokens: ['酒红', 'maroon'], colorFamily: ['红', 'red', 'maroon'] }, '红色,6'],
  ];
  for (const [expect, content] of cases) {
    const r = classifyProbeAnswer({ content, expect });
    assert.equal(r.verdict, PROBE_VERDICT.IMAGE, content);
    assert.ok(r.reason.includes('同色族'), r.reason);
  }
  // 数字对、色族也不符 → 未定（例如答「黑色,7」）
  assert.equal(classifyProbeAnswer({
    content: '黑色,7', expect: { digit: '7', colorTokens: ['紫'], colorFamily: ['紫', 'purple'] },
  }).verdict, PROBE_VERDICT.UNKNOWN);
});

test('classifyProbeAnswer：答错/答一半 → 未定（真机里模型会编颜色，不能算看见也不能算纯文本）', () => {
  const expect = { digit: '7', colorTokens: ['紫', 'purple'] };
  assert.equal(classifyProbeAnswer({ content: '浅灰色', expect }).verdict, PROBE_VERDICT.UNKNOWN);
  assert.equal(classifyProbeAnswer({ content: '紫色, 3', expect }).verdict, PROBE_VERDICT.UNKNOWN, '颜色对、数字错');
  assert.equal(classifyProbeAnswer({ content: '', expect }).verdict, PROBE_VERDICT.UNKNOWN, '空回答');
  assert.equal(classifyProbeAnswer({ content: '', reasoning: '思考了 700 字', expect }).verdict, PROBE_VERDICT.UNKNOWN);
  assert.equal(classifyProbeAnswer({ content: '紫色,7', expect, status: 502 }).verdict, PROBE_VERDICT.UNKNOWN);
});

test('probeAnswer / probeSucceeded / probeErrorMessage：形状容错', () => {
  assert.deepEqual(probeAnswer(okBody('紫色,7')), { content: '紫色,7', reasoning: '' });
  assert.deepEqual(probeAnswer({ choices: [{ message: { content: ' x ', reasoning_content: ' y ' } }] }), { content: 'x', reasoning: 'y' });
  assert.deepEqual(probeAnswer(undefined), { content: '', reasoning: '' });
  assert.equal(probeSucceeded(200, okBody('x')), true);
  assert.equal(probeSucceeded(200, { error: { message: 'x' } }), false);
  assert.equal(probeSucceeded(503, okBody('x')), false);
  assert.equal(probeErrorMessage({ error: { message: 'boom' } }), 'boom');
  assert.equal(probeErrorMessage({ error: 'boom' }), 'boom');
  assert.equal(probeErrorMessage(undefined), '');
});

// --- 请求级归因 -----------------------------------------------------------

test('classifyProbeOutcome：上游明说不收图 → 文', () => {
  for (const message of [
    'This model does not support image input',
    'invalid content type: image_url',
    '当前模型不支持图片输入',
    'multimodal input is not supported for this model',
  ]) {
    const r = classifyProbeOutcome({ imageStatus: 400, imageBody: { error: { message } } });
    assert.equal(r.verdict, PROBE_VERDICT.TEXT, message);
  }
});

test('classifyProbeOutcome：模型不存在 / 无健康账号 → 未定（与视觉无关）', () => {
  for (const message of [
    'model not found: a:1',
    'no such model',
    '无此模型',
    '{"code":"no_healthy_account","gateway_hint":"upstream has no such model on this backend"}',
  ]) {
    const r = classifyProbeOutcome({ imageStatus: 503, imageBody: { error: { message } } });
    assert.equal(r.verdict, PROBE_VERDICT.UNKNOWN, message);
  }
});

test('classifyProbeOutcome：限流/过载 → 未定（绝不能靠对照判成纯文本）', () => {
  // 真机：traework:cn:explore_sub_agent_v2 带图 502 且报文里裹着限流文案，
  // 若走纯文本对照，对照同样被限流 → 会被误判成「纯文本可过、带图失败」
  const rateLimited = classifyProbeOutcome({
    imageStatus: 502,
    imageBody: { error: { message: "solo error code=3004 msg=We're sorry, your requests have exceeded the rate limit." } },
    textStatus: 200,
    textBody: okBody('ok'),
  });
  assert.equal(rateLimited.verdict, PROBE_VERDICT.UNKNOWN);
  assert.ok(rateLimited.reason.includes('临时失败'));
  assert.equal(classifyProbeOutcome({
    imageStatus: 429, imageBody: { error: { message: 'too many requests' } },
  }).verdict, PROBE_VERDICT.UNKNOWN);
});

test('probeModelVision：限流时不补纯文本对照（省一次必然也失败的请求）', async () => {
  const client = fakeClient(() => ({
    status: 502,
    body: { error: { message: 'solo error code=3004 exceeded the rate limit' } },
  }));
  const r = await probeModelVision({ client, id: 'traework:cn:explore_sub_agent_v2' });
  assert.equal(r.verdict, PROBE_VERDICT.UNKNOWN);
  assert.equal(client.calls.length, 1, '不该再打一次');
});

test('classifyProbeOutcome：含糊失败靠纯文本对照归因', () => {
  const caused = classifyProbeOutcome({
    imageStatus: 400,
    imageBody: { error: { message: 'invalid request' } },
    textStatus: 200,
    textBody: okBody('ok'),
  });
  assert.equal(caused.verdict, PROBE_VERDICT.TEXT);
  const both = classifyProbeOutcome({
    imageStatus: 502,
    imageBody: { error: { message: 'bad gateway' } },
    textStatus: 502,
    textBody: { error: { message: 'bad gateway' } },
  });
  assert.equal(both.verdict, PROBE_VERDICT.UNKNOWN);
  const gone = classifyProbeOutcome({
    imageStatus: 400,
    imageBody: { error: { message: 'invalid request' } },
    textStatus: 404,
    textBody: { error: { message: 'model not found' } },
  });
  assert.equal(gone.verdict, PROBE_VERDICT.UNKNOWN);
});

// --- 单模型探针 -----------------------------------------------------------

test('probeModelVision：答对就是一次请求搞定', async () => {
  const client = fakeClient((body) => ({ status: 200, body: okBody(correctAnswer(body.model)) }));
  const r = await probeModelVision({ client, id: 'workbuddy:cn:hy3' });
  assert.equal(r.verdict, PROBE_VERDICT.IMAGE);
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].path, '/v1/chat/completions');
  assert.equal(r.evidence.attempts, 1);
});

test('probeModelVision：只回思考没回正文 → 放大预算重试一次', async () => {
  const client = fakeClient((body, index) => {
    if (index === 0) {
      return { status: 200, body: { choices: [{ message: { content: '', reasoning_content: '想了 700 字' } }] } };
    }
    return { status: 200, body: okBody(correctAnswer(body.model)) };
  });
  const r = await probeModelVision({ client, id: 'workbuddy:cn:deepseek-v4.1-flash' });
  assert.equal(r.verdict, PROBE_VERDICT.IMAGE, '重试后答对');
  assert.equal(client.calls.length, 2);
  assert.equal(client.calls[0].body.max_tokens, 600);
  assert.equal(client.calls[1].body.max_tokens, RETRY_PROBE_MAX_TOKENS, '第二次放大预算');
  assert.equal(r.evidence.retried, true);
});

test('probeModelVision：预算吃光且重试仍空 → 未定', async () => {
  const client = fakeClient(() => ({ status: 200, body: { choices: [{ message: { content: '', reasoning_content: '还在想' } }] } }));
  const r = await probeModelVision({ client, id: 'a:1' });
  assert.equal(r.verdict, PROBE_VERDICT.UNKNOWN);
  assert.ok(r.reason.includes('思考'));
  assert.equal(client.calls.length, 2, '重试过');
});

test('probeModelVision：模型无健康账号 → 未定，且不做纯文本对照（省一次请求）', async () => {
  const client = fakeClient(() => ({ status: 503, body: { error: { message: '{"code":"no_healthy_account"}' } } }));
  const r = await probeModelVision({ client, id: 'workbuddy:cn:glm-4.6v' });
  assert.equal(r.verdict, PROBE_VERDICT.UNKNOWN);
  assert.equal(client.calls.length, 1);
});

test('probeModelVision：含糊失败补一次纯文本对照', async () => {
  const client = fakeClient((body) => (typeof body.messages[0].content === 'string'
    ? { status: 200, body: okBody('ok') }
    : { status: 400, body: { error: { message: 'invalid request' } } }));
  const r = await probeModelVision({ client, id: 'a:1' });
  assert.equal(r.verdict, PROBE_VERDICT.TEXT);
  assert.equal(client.calls.length, 2);
  assert.equal(typeof client.calls[1].body.messages[0].content, 'string');
});

test('probeModelVision：client.request 抛异常（超时/断网）也折成未定，不冒泡', async () => {
  const client = { request: async () => { throw new Error('网关请求超时（60000ms）'); } };
  const r = await probeModelVision({ client, id: 'a:1' });
  assert.equal(r.verdict, PROBE_VERDICT.UNKNOWN);
  assert.ok(r.reason.includes('无法归因'));
});

// --- 批量与沉淀 -----------------------------------------------------------

test('probeModelVisionBatch：串行 + 间隔 + 单批上限，剩余项如实回报', async () => {
  const client = fakeClient((body) => ({ status: 200, body: okBody(correctAnswer(body.model)) }));
  const slept = [];
  const seen = [];
  const ids = ['a:1', 'a:2', 'a:3', 'a:4', 'a:5'];
  const batch = await probeModelVisionBatch({
    client,
    ids,
    limit: 3,
    delayMs: 300,
    sleep: async (ms) => { slept.push(ms); },
    onResult: (r) => seen.push(r.id),
  });
  assert.equal(batch.done, 3);
  assert.deepEqual(batch.remaining, ['a:4', 'a:5']);
  assert.equal(batch.capped, true);
  assert.deepEqual(slept, [300, 300], '只在请求之间等，最后一个不等');
  assert.deepEqual(seen, ['a:1', 'a:2', 'a:3']);
});

test('probeModelVisionBatch：默认上限与脏输入处理', async () => {
  const client = fakeClient((body) => ({ status: 200, body: okBody(correctAnswer(body.model)) }));
  const ids = [...Array(DEFAULT_PROBE_LIMIT + 5)].map((_, i) => `a:${i}`);
  const batch = await probeModelVisionBatch({ client, ids, delayMs: 0 });
  assert.equal(batch.done, DEFAULT_PROBE_LIMIT);
  assert.equal(batch.remaining.length, 5);
  const dirty = await probeModelVisionBatch({ client, ids: ['a:1', '', null, 42], delayMs: 0 });
  assert.equal(dirty.done, 1, '空值/非字符串一律剔除');
});

test('probeVerdictsForCommit：只有 image/text 进得去，unknown 一律丢弃', () => {
  const verdicts = probeVerdictsForCommit([
    { id: 'a:1', verdict: 'image' },
    { id: 'a:2', verdict: 'text' },
    { id: 'a:3', verdict: 'unknown', reason: '网关 503' },
    { id: '', verdict: 'image' },
    null,
  ], { at: 42 });
  assert.deepEqual(verdicts, [
    { id: 'a:1', status: 'confirmed', verdict: 'image', tier: 'L0', how: '实测', at: 42 },
    { id: 'a:2', status: 'confirmed', verdict: 'text', tier: 'L0', how: '实测', at: 42 },
  ]);
});

test('实测结论沉淀后：L0 实测能压过目录结论（等级最高）', async () => {
  const { mergeCapabilities, capabilityVisionSet, parseCapabilities } = await import('../lib/model-patch.js');
  // 目录说「无收录/借判」，实测说「图」→ 基线里就是图
  const merged = mergeCapabilities(null, probeVerdictsForCommit([
    { id: 'workbuddy:global:hy4-preview-f', verdict: 'image' },
  ], { at: 1 }), { at: 1 });
  const baseline = parseCapabilities(JSON.stringify(merged));
  assert.equal(baseline.entries['workbuddy:global:hy4-preview-f'].image, true);
  assert.equal(baseline.entries['workbuddy:global:hy4-preview-f'].tier, 'L0');
  assert.equal(baseline.entries['workbuddy:global:hy4-preview-f'].how, '实测');
  assert.equal(capabilityVisionSet(baseline).has('workbuddy:global:hy4-preview-f'), true);
});

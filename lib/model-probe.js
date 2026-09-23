// dsh-chanhub —— 视觉能力**实测**（探针）层。
//
// 为什么需要第三层证据：
//   ① 白名单 = 人工认定（会漏、会旧）；
//   ② 目录比对 = 公开目录的二手标注（原厂 README / 云托管清单 / 转售商配置，
//      三态判定再稳，也仍是**别人写的**）；
//   ③ 实测 = 拿这个网关、这条渠道、这个模型**真的发一张图**，看它认不认得。
// 用户对多模态能力「不信任上游」，那就只剩实测能算数 —— 这一层是最终裁决。
//
// ⚠️ 真机教训（本模块的设计依据，别退回「200 就算支持」）：
//   只发一张图看有没有报错**证明不了任何事** —— 实测 `workbuddy:cn:hy3`（目录标注
//   纯文本）带图请求返回 200，纯文本的 `glm-5.3` 也返回 200，甚至还会**编一个颜色**
//   （「浅灰色」）。图片可能被网关/上游静默丢弃，模型照样作答。
//   所以探针必须**行为化**：图里画一个**数字** + 一种**背景色**，问它「背景色 + 数字」，
//   答对了才算真看见。盲猜命中率 ≈ 1/10 × 1/6 ≈ 1.7%，可以忽略。
//
// 成本与安全：
//   - 单次 `max_tokens` 600，thinking 模型吃光预算（content 空、reasoning 满）时
//     自动用 2400 重试一次（真机：deepseek-v4.1-flash 600 空 → 2400 答对）；
//   - 串行 + 间隔（默认 300ms）+ 单批上限（默认 12 个），避免把账号打出风控；
//   - 任何「拿不准」都只报 unknown：不写配置、不进基线（与目录比对同一纪律）。

import zlib from 'node:zlib';

export const PROBE_VERDICT = { IMAGE: 'image', TEXT: 'text', UNKNOWN: 'unknown' };

/** 单批默认上限与请求间隔：宁可多按几次，也不要把账号打出风控。 */
export const DEFAULT_PROBE_LIMIT = 12;
export const DEFAULT_PROBE_DELAY_MS = 300;
export const DEFAULT_PROBE_TIMEOUT_MS = 60000;
/** thinking 模型常把预算烧在思考上：先用小预算，content 空且 reasoning 非空时再放大重试。 */
export const DEFAULT_PROBE_MAX_TOKENS = 600;
export const RETRY_PROBE_MAX_TOKENS = 2400;

/** 探针提问：一次问两件「只有真看见才能答」的事。 */
export const PROBE_QUESTION = '这张图：背景是什么颜色？中间的数字是几？只回答「颜色,数字」。';

/**
 * 备选背景色 + 同义写法。
 *
 * `tokens` = 精确叫法；`family` = 同一色族的宽叫法。为什么要分两档：真机里模型
 * 常按色族作答 —— navy 答「蓝色」、teal 答「蓝绿色」、maroon 答「红色」、olive 答「绿色」，
 * 而**数字都答对了**。只认精确叫法会把这些真看见图的模型误判成未定。
 * 判定时以**数字**为主信号（10 选 1），色族只做辅助（所以盲猜同时命中 ≈ 1/10 × 1/3）。
 */
export const PROBE_COLORS = [
  { key: 'purple', rgb: [0x66, 0x33, 0x99], tokens: ['紫', 'purple', 'violet'], family: ['紫', 'purple', 'violet'] },
  { key: 'orange', rgb: [0xe6, 0x7e, 0x22], tokens: ['橙', 'orange'], family: ['橙', 'orange', '橘'] },
  { key: 'teal', rgb: [0x1a, 0x94, 0x94], tokens: ['青', 'teal', 'cyan', '蓝绿', '绿蓝'], family: ['青', 'teal', 'cyan', '蓝绿', '绿蓝', '碧', 'turquoise'] },
  { key: 'navy', rgb: [0x19, 0x2a, 0x56], tokens: ['深蓝', '藏青', 'navy', '暗蓝', '靛'], family: ['蓝', 'blue', 'navy', '藏青', '靛', 'indigo'] },
  { key: 'olive', rgb: [0x80, 0x80, 0x00], tokens: ['橄榄', 'olive', '黄绿'], family: ['绿', 'green', '橄榄', 'olive', '黄绿'] },
  { key: 'maroon', rgb: [0x80, 0x00, 0x00], tokens: ['酒红', 'maroon', '暗红', '深红'], family: ['红', 'red', 'maroon', '栗', '棕红'] },
];

/** 3×5 点阵数字，放大 ×5 画进图里。 */
const DIGIT_FONT = {
  0: ['111', '101', '101', '101', '111'],
  1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'],
  4: ['101', '101', '111', '001', '001'],
  5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'],
  7: ['111', '001', '001', '001', '001'],
  8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'],
};

const CANVAS = 40;
const SCALE = 5;

const CRC_TABLE = (() => {
  const table = new Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const tag = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([tag, data])), 0);
  return Buffer.concat([length, tag, data, crc]);
}

/** 把 RGB 像素矩阵编成 PNG（纯 JS，无依赖：探针图必须自给自足，不能依赖任何外部资源）。 */
export function encodePng(width, height, pixels) {
  const stride = width * 3 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * stride;
    raw[rowOffset] = 0; // filter: none
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = pixels[y * width + x];
      raw[rowOffset + 1 + x * 3] = r;
      raw[rowOffset + 2 + x * 3] = g;
      raw[rowOffset + 3 + x * 3] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/** 由模型 id 派生确定性的探针样本：同一模型每次拿到同一张图（可复现），不同模型不同。 */
export function probeSeed(id) {
  const text = String(id ?? '');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

/**
 * 造一道探针题：背景色 + 数字（都只有真看见才能答对）。
 * @param id - 模型 id（决定样本，保证可复现）。
 * @returns `{color, digit, dataUrl, expect}`。
 */
export function buildProbeCase(id) {
  const seed = probeSeed(id);
  const color = PROBE_COLORS[seed % PROBE_COLORS.length];
  const digit = String(Math.floor(seed / PROBE_COLORS.length) % 10);
  const pixels = new Array(CANVAS * CANVAS);
  for (let i = 0; i < pixels.length; i += 1) pixels[i] = color.rgb;
  const font = DIGIT_FONT[digit];
  const offsetX = Math.floor((CANVAS - 3 * SCALE) / 2);
  const offsetY = Math.floor((CANVAS - 5 * SCALE) / 2);
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      if (font[row][col] !== '1') continue;
      for (let dy = 0; dy < SCALE; dy += 1) {
        for (let dx = 0; dx < SCALE; dx += 1) {
          const x = offsetX + col * SCALE + dx;
          const y = offsetY + row * SCALE + dy;
          if (x < 0 || y < 0 || x >= CANVAS || y >= CANVAS) continue;
          pixels[y * CANVAS + x] = [0xff, 0xff, 0xff];
        }
      }
    }
  }
  return {
    color: color.key,
    digit,
    dataUrl: `data:image/png;base64,${encodePng(CANVAS, CANVAS, pixels).toString('base64')}`,
    expect: { digit, colorTokens: color.tokens, colorFamily: color.family, color: color.key },
  };
}

/** 上游明确拒绝「图」的措辞（中英混排，命中即判 text）。 */
const IMAGE_REJECTED = /(image|vision|multimodal|modality|visual|图片|图像|视觉|多模态|不支持.{0,4}(图|文件|附件))/i;
/** 模型本身不存在/不可用 —— 与视觉无关，只能报 unknown。 */
const MODEL_UNAVAILABLE = /(no such model|model not found|not found.{0,12}model|unknown model|invalid model|unsupported model|模型.{0,4}(不存在|不可用|无法使用)|无此模型|no_healthy_account|no healthy account)/i;
/** 模型自述「看不到图」——真机常见措辞。 */
const BLIND_DENIAL = /(没有(看到|收到|上传|提供|发送|附带)|未(看到|收到|提供)|看不到|没有图|无法(查看|看到|识别|确定|处理|读取|解析|分析).{0,12}(图|图片|图像)|请(上传|重新发送|提供).{0,6}(图|图片)|(切换|改用|使用|请用).{0,8}(多模态|视觉模型|图像模型|支持图像)|不支持|unsupported|not support|i (can'?t|cannot|don'?t) see|no image|without an image|not able to (see|view))/i;
/**
 * 限流/过载/额度 —— **与视觉无关**的临时失败。
 * 真机踩到过：502 里裹着 "exceeded the rate limit"，若当普通失败走「纯文本对照」，
 * 对照请求同样被限流 → 会被误判成「纯文本可过、带图失败」= 纯文本模型。那是错的。
 */
const TRANSIENT_FAILURE = /(rate.?limit|too many requests|exceeded the rate|quota|overload|temporarily unavailable|solo error|429|50[234])/i;

/**
 * 把上游的报错对象压成一行可读文本。
 * @param body - 响应体（可能是任意形状）。
 * @returns 字符串（空串表示没有可读报错）。
 */
export function probeErrorMessage(body) {
  const raw = body?.error?.message ?? body?.error ?? body?.message ?? body?.detail;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    try {
      return JSON.stringify(raw);
    } catch {
      return String(raw);
    }
  }
  return '';
}

/** 响应是否算「成功拿到一次补全」。 */
export function probeSucceeded(status, body) {
  if (status !== 200) return false;
  if (body?.error) return false;
  return Array.isArray(body?.choices) && body.choices.length > 0;
}

/** 取出回答正文（含 thinking 模型只给 reasoning 的情况）。 */
export function probeAnswer(body) {
  const message = body?.choices?.[0]?.message;
  if (!message) return { content: '', reasoning: '' };
  return {
    content: typeof message.content === 'string' ? message.content.trim() : '',
    reasoning: typeof message.reasoning_content === 'string' ? message.reasoning_content.trim() : '',
  };
}

/**
 * 判定回答：只有**答对了**才算看见图。
 *
 * @param opts - `{content, reasoning, expect, status}`。
 * @returns `{verdict, reason}`。
 */
export function classifyProbeAnswer({ content, reasoning = '', expect, status = 200 } = {}) {
  const answer = String(content ?? '');
  if (status !== 200) return { verdict: PROBE_VERDICT.UNKNOWN, reason: `HTTP ${status}` };
  if (answer === '') {
    return {
      verdict: PROBE_VERDICT.UNKNOWN,
      reason: reasoning !== '' ? '只回了思考、没给正文（预算被思考吃光）' : '空回答',
    };
  }
  // 自述看不到图 → 纯文本模型
  if (BLIND_DENIAL.test(answer)) {
    return { verdict: PROBE_VERDICT.TEXT, reason: `模型自述看不到图：${answer.slice(0, 80)}` };
  }
  // 数字是主信号（10 选 1）；色族是辅助（模型常按色族作答：navy→蓝、maroon→红）
  const gotDigit = answer.includes(expect.digit);
  const hit = (list) => (list ?? []).some((t) => answer.toLowerCase().includes(String(t).toLowerCase()));
  const exactColor = hit(expect.colorTokens);
  const familyColor = hit(expect.colorFamily ?? expect.colorTokens);
  if (gotDigit && familyColor) {
    return {
      verdict: PROBE_VERDICT.IMAGE,
      reason: `答对数字${exactColor ? '与背景色' : '、背景色属同色族'}（${expect.color}/${expect.digit}）：${answer.slice(0, 60)}`,
    };
  }
  if (gotDigit && !familyColor) {
    return {
      verdict: PROBE_VERDICT.UNKNOWN,
      reason: `数字答对但背景色不符（期望 ${expect.color}/${expect.digit}）：${answer.slice(0, 60)}`,
    };
  }
  // 答错/答一半一律未定：真机里 glm-5.3 带图会**编**一个颜色（浅灰色）——那既不是「看见」，
  // 也不能算「纯文本」，只能记未定，绝不替上游下结论。
  return {
    verdict: PROBE_VERDICT.UNKNOWN,
    reason: `答案与图不符（期望 ${expect.color}/${expect.digit}）：${answer.slice(0, 60)}`,
  };
}

/**
 * 归因一次探针的**请求级**失败（拿不到有效回答时）。
 *
 * @param opts - `{imageStatus, imageBody, textStatus, textBody}`。
 * @returns `{verdict, reason}`。
 */
export function classifyProbeOutcome({ imageStatus, imageBody, textStatus, textBody } = {}) {
  const imageMessage = probeErrorMessage(imageBody);
  if (probeSucceeded(imageStatus, imageBody)) {
    // 请求成功但答案不对 → 交给 classifyProbeAnswer，这里只兜底
    return { verdict: PROBE_VERDICT.UNKNOWN, reason: '请求成功，结论由答案判定' };
  }
  // 顺序要紧：先看「明确拒绝图片」再看「模型不可用」。中文里「模型不支持图片输入」
  // 同时含「模型」与「不支持」，先判不可用就会把它误判成 unknown —— 而它恰恰是最
  // 明确的「纯文本模型」证据（真机踩到过，测试钉住）。
  if (IMAGE_REJECTED.test(imageMessage)) {
    return { verdict: PROBE_VERDICT.TEXT, reason: `上游拒绝图片：${imageMessage}` };
  }
  if (MODEL_UNAVAILABLE.test(imageMessage)) {
    return { verdict: PROBE_VERDICT.UNKNOWN, reason: `模型不可用：${imageMessage || imageStatus}` };
  }
  if (TRANSIENT_FAILURE.test(imageMessage)) {
    return { verdict: PROBE_VERDICT.UNKNOWN, reason: `上游临时失败（限流/过载/额度），与视觉无关：${imageMessage.slice(0, 120)}` };
  }
  if (textStatus !== undefined) {
    if (probeSucceeded(textStatus, textBody)) {
      return { verdict: PROBE_VERDICT.TEXT, reason: `纯文本可过、带图失败（${imageStatus} ${imageMessage || '无报错信息'}）` };
    }
    const textMessage = probeErrorMessage(textBody);
    if (MODEL_UNAVAILABLE.test(textMessage)) {
      return { verdict: PROBE_VERDICT.UNKNOWN, reason: `模型不可用：${textMessage}` };
    }
    return {
      verdict: PROBE_VERDICT.UNKNOWN,
      reason: `带图与纯文本都失败（图 ${imageStatus} / 文 ${textStatus}），原因不在视觉`,
    };
  }
  return { verdict: PROBE_VERDICT.UNKNOWN, reason: `带图请求失败且无法归因：${imageStatus} ${imageMessage || '无报错信息'}` };
}

/** 构造探针请求体。 */
export function probeRequestBody(id, { withImage = true, dataUrl, maxTokens = DEFAULT_PROBE_MAX_TOKENS } = {}) {
  const content = withImage
    ? [
        { type: 'text', text: PROBE_QUESTION },
        { type: 'image_url', image_url: { url: dataUrl } },
      ]
    : PROBE_QUESTION;
  return { model: id, messages: [{ role: 'user', content }], max_tokens: maxTokens, stream: false };
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 打一次 /v1/chat/completions，任何异常都折成 `{status, body}`（不抛）。 */
async function probeChat(client, id, { withImage, timeoutMs, dataUrl, maxTokens }) {
  try {
    const response = await client.request('/v1/chat/completions', {
      method: 'POST',
      body: probeRequestBody(id, { withImage, dataUrl, maxTokens }),
      timeoutMs,
    });
    return { status: response?.status ?? 0, body: response?.body };
  } catch (error) {
    return { status: 0, body: { error: { message: error?.message ?? String(error) } } };
  }
}

/**
 * 实测单个模型的视觉能力。
 *
 * 流程：造题（该 id 固定样本）→ 带图问一次 → 答对即 image；
 * 只回思考没回正文 → 放大预算重试一次；失败含糊 → 补一次纯文本对照归因。
 *
 * @param opts - `{client, id, timeoutMs, maxTokens}`。
 * @returns `{id, verdict, reason, expect, evidence}`。
 */
export async function probeModelVision({
  client,
  id,
  timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
  maxTokens = DEFAULT_PROBE_MAX_TOKENS,
} = {}) {
  const testCase = buildProbeCase(id);
  const image = await probeChat(client, id, {
    withImage: true, timeoutMs, dataUrl: testCase.dataUrl, maxTokens,
  });
  const first = probeAnswer(image.body);
  const succeeded = probeSucceeded(image.status, image.body);

  // thinking 模型把预算烧在思考上 → 放大预算重试一次（真机：600 空、2400 答对）
  let answer = first;
  let attempts = 1;
  let retried = false;
  if (succeeded && first.content === '' && first.reasoning !== '') {
    const retry = await probeChat(client, id, {
      withImage: true, timeoutMs, dataUrl: testCase.dataUrl, maxTokens: RETRY_PROBE_MAX_TOKENS,
    });
    attempts += 1;
    retried = true;
    if (probeSucceeded(retry.status, retry.body)) answer = probeAnswer(retry.body);
  }

  const evidence = {
    imageStatus: image.status,
    imageMessage: probeErrorMessage(image.body).slice(0, 300),
    answer: answer.content.slice(0, 200),
    reasoningChars: answer.reasoning.length,
    attempts,
    retried,
  };

  if (succeeded) {
    const judged = classifyProbeAnswer({
      content: answer.content, reasoning: answer.reasoning, expect: testCase.expect, status: 200,
    });
    return { id, verdict: judged.verdict, reason: judged.reason, expect: testCase.expect, evidence };
  }

  // 请求级失败：含糊时补一次纯文本对照（连网关都没连上就别补，重试没意义）
  const message = probeErrorMessage(image.body);
  const ambiguous = image.status !== 0
    && !IMAGE_REJECTED.test(message)
    && !MODEL_UNAVAILABLE.test(message)
    && !TRANSIENT_FAILURE.test(message); // 限流/过载时补对照会被同样限流 → 误判成纯文本
  const text = ambiguous
    ? await probeChat(client, id, { withImage: false, timeoutMs, maxTokens: 32 })
    : undefined;
  const judged = classifyProbeOutcome({
    imageStatus: image.status,
    imageBody: image.body,
    ...(text ? { textStatus: text.status, textBody: text.body } : {}),
  });
  return {
    id,
    verdict: judged.verdict,
    reason: judged.reason,
    expect: testCase.expect,
    evidence: { ...evidence, ...(text ? { textStatus: text.status } : {}) },
  };
}

/**
 * 批量实测：串行 + 间隔 + 单批上限（保护账号，也保护网关）。
 *
 * @param opts - `{client, ids, limit, delayMs, timeoutMs, maxTokens, sleep, onResult}`。
 * @returns `{results, done, remaining, capped}`；`remaining` 是本次没跑的 id。
 */
export async function probeModelVisionBatch({
  client,
  ids,
  limit = DEFAULT_PROBE_LIMIT,
  delayMs = DEFAULT_PROBE_DELAY_MS,
  timeoutMs = DEFAULT_PROBE_TIMEOUT_MS,
  maxTokens = DEFAULT_PROBE_MAX_TOKENS,
  sleep = defaultSleep,
  onResult,
} = {}) {
  const all = (Array.isArray(ids) ? ids : []).filter((id) => typeof id === 'string' && id !== '');
  const cap = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : DEFAULT_PROBE_LIMIT;
  const batch = all.slice(0, cap);
  const results = [];
  for (let i = 0; i < batch.length; i += 1) {
    const result = await probeModelVision({ client, id: batch[i], timeoutMs, maxTokens });
    results.push(result);
    if (typeof onResult === 'function') onResult(result);
    if (i < batch.length - 1 && delayMs > 0) await sleep(delayMs);
  }
  return { results, done: results.length, remaining: all.slice(batch.length), capped: all.length > cap };
}

/**
 * 把实测结论转成「可沉淀的确认态」，喂给 mergeCapabilities。
 * 只有 image/text 进得去；unknown 一律丢弃（不写配置、不进基线）。
 *
 * @param results - probeModelVisionBatch 的 results。
 * @param opts - `{at}`。
 * @returns 形如 classifyAll 输出的 verdict 数组。
 */
export function probeVerdictsForCommit(results, { at = Date.now() } = {}) {
  return (Array.isArray(results) ? results : [])
    .filter((r) => r && typeof r.id === 'string' && r.id !== '' && r.verdict !== PROBE_VERDICT.UNKNOWN)
    .map((r) => ({
      id: r.id,
      status: 'confirmed',
      verdict: r.verdict,
      tier: 'L0',
      how: '实测',
      at,
    }));
}

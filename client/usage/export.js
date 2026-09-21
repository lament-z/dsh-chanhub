// dsh-chanhub —— 用量页导出（浏览器侧）
//
// 参考 dsh-usage-panel 的 export.ts，三条纪律照搬：
//   1. **防公式注入**：以 `=` `+` `-` `@` 开头的单元格前置单引号 ——
//      否则模型名/昵称里的这类字符会被 Excel 当公式执行（CSV 注入）。
//   2. **RFC 4180**：含引号/逗号/换行的字段用双引号包起，内部引号翻倍。
//   3. **UTF-8 BOM**：不加 BOM 时 Excel 在中文 Windows 上会按 GBK 解码，中文全乱。
//
// 为什么放在客户端：导出是「把已经在内存里的载荷换一种序列化」，
// 不需要新端点，也不该让网关承担这份工作。

/**
 * 转义一个 CSV 单元格（RFC 4180 + 防公式注入）。
 * @param value - 原始值。
 * @returns 可直接拼进 CSV 的文本。
 */
export function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** 把行数组拼成带 BOM 的 CSV。 */
function toCsv(header, rows) {
  return `\uFEFF${[header.join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n')}`;
}

/**
 * 每日用量 CSV（按天 × 模型）。
 * @param days - `usageByDay()` 的输出。
 * @param byModel - `dailyByModel()` 的输出。
 * @returns CSV 文本。
 */
export function buildDailyCsv(days, byModel) {
  const dates = (Array.isArray(days) ? days : []).map((d) => d.date);
  const header = ['date', 'requests', 'tokens', 'credit', ...byModel.series.map((s) => s.key)];
  const rows = dates.map((date, i) => [
    date,
    (days[i].requests) || 0,
    (days[i].tokens) || 0,
    (days[i].credit) || 0,
    ...byModel.series.map((s) => s.values[i] || 0),
  ]);
  return toCsv(header, rows);
}

/**
 * 模型用量 CSV。
 * @param rows - `by_model`。
 * @returns CSV 文本。
 */
export function buildModelCsv(rows) {
  const header = [
    'model', 'requests', 'success', 'failed',
    'prompt_tokens', 'completion_tokens', 'total_tokens',
    'cache_hit_tokens', 'cache_miss_tokens', 'cache_write_tokens',
    'credit', 'avg_latency_ms',
  ];
  const list = Array.isArray(rows) ? rows : [];
  return toCsv(header, list.map((row) => [
    row.key, row.requests, row.success, row.failed,
    row.prompt_tokens, row.completion_tokens, row.total_tokens,
    row.cache_hit_tokens, row.cache_miss_tokens, row.cache_write_tokens,
    row.credit, row.avg_latency_ms,
  ]));
}

/**
 * 账号用量 CSV（含昵称与渠道 —— 导出后仍能对上账号池）。
 * @param rows - `accountShares()` 的输出。
 * @returns CSV 文本。
 */
export function buildAccountCsv(rows) {
  const header = [
    'uid', 'nickname', 'channel', 'requests', 'success', 'failed',
    'total_tokens', 'credit', 'avg_latency_ms', 'share',
  ];
  const list = Array.isArray(rows) ? rows : [];
  return toCsv(header, list.map((row) => [
    row.key, row.name, row.channel, row.requests, row.success, row.failed,
    row.total_tokens, row.credit, row.avg_latency_ms,
    (Number(row.share) || 0).toFixed(4),
  ]));
}

/**
 * 完整 JSON（原始载荷，便于二次分析）。
 * @param payload - 用量载荷。
 * @returns JSON 文本。
 */
export function buildJson(payload) {
  return JSON.stringify(payload, null, 2);
}

/**
 * 触发浏览器下载。
 *
 * 失败可容忍：`URL.createObjectURL` 在某些沙箱 iframe 下不可用 ——
 * 此时静默返回 false，由调用方给出提示，而不是抛异常炸掉面板。
 *
 * @param filename - 文件名。
 * @param content - 文件内容。
 * @param mime - MIME 类型（会自动补 charset）。
 * @returns 是否成功触发。
 */
export function download(filename, content, mime) {
  try {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

/** 导出文件名的时间戳后缀（本地日期）。 */
export function stamp(now = new Date()) {
  const pad = (v) => String(v).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
}

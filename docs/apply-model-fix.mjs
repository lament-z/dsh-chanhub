// dsh-chanhub —— 命令行版「沉淀 + 补齐」（面板按钮的等价物，用于无 GUI 场景与复盘）
//
// 用法：node docs/apply-model-fix.mjs          # 预演，只打印不写
//       node docs/apply-model-fix.mjs --apply  # 真写（先自动备份 settings.yaml）
//
// 把「实测结论 + 目录确认态」沉淀进能力基线，并按基线补齐 DSH 模型配置里缺失的字段。
// 走宿主同款写入链路：yaml Document 叶子级 diff + 跨进程文件锁 + 原子写；
// settings.yaml 被 chokidar 监听，宿主热加载，无需重启。
import fs from 'node:fs';
import { parseDocument } from '/usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/yaml/dist/index.js';
import yaml from '/usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/js-yaml/index.js';
import { withFileLock, writeFileAtomic } from '/usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-atomic-write/lib/index.js';

const PLUGIN = '<repo>';
const FILE = '~/.dsh/settings.yaml';
const APPLY = process.argv.includes('--apply');
const PROVIDER = 'chanhub2api';

const MC = await import(`${PLUGIN}/lib/model-catalog.js`);
const MP = await import(`${PLUGIN}/lib/model-patch.js`);
const PR = await import(`${PLUGIN}/lib/model-probe.js`);
const { ChanhubClient } = await import(`${PLUGIN}/lib/chanhub-client.js`);

const settings = yaml.load(fs.readFileSync(FILE, 'utf8'));
const chanhub = settings['dsh-chanhub'];
const current = settings['llm-pi-ai'].providers[PROVIDER].models;

// ① 现拉一次网关目录（补齐 refresh=true 用得到，也顺带更新快照）
const client = new ChanhubClient({ resolveConfig: () => ({ baseURL: chanhub.baseURL, apiKey: chanhub.apiKey }) });
const body = await client.models();
const catalog = MP.listFromGatewayBody(body);
console.log(`网关目录：${catalog.length} 个模型`);

// ② 目录确认态
const gw = (body?.data ?? []).map((m) => m.id);
const cache = await MC.readCatalogCache();
const { verdicts } = MC.classifyAll(gw, cache.index, { whitelist: MP.VISION_MODEL_WHITELIST });

// ③ 实测结论（离线重放修正后的判定；样本由 id 哈希决定，可复现）
const measured = JSON.parse(fs.readFileSync('/tmp/probe-final.json', 'utf8')).results;

// ④ 合并基线：先目录确认态，再实测（后写者胜 —— 实测 L0 压过目录）
const at = Date.now();
const prevBaseline = MP.parseCapabilities(chanhub.modelCapabilities);
const step1 = MP.mergeCapabilities(prevBaseline, verdicts, { at });
const merged = MP.mergeCapabilities(step1, PR.probeVerdictsForCommit(measured, { at }), { at });
console.log(`基线：${Object.keys(prevBaseline?.entries ?? {}).length} → ${merged.count} 条`
  + `（新增 ${merged.added.length}，翻转 ${merged.changed.length}，跳过未确认 ${merged.skipped}）`);
for (const c of merged.changed) console.log(`  ↺ ${c.id}: ${c.from} → ${c.to}`);

// ⑤ 补齐：按新基线算有效视觉集合，只填缺失字段（不增不删模型）
const extraVision = MP.capabilityVisionSet(merged);
console.log(`有效视觉集合：${extraVision.size} 个`);
const plan = MP.buildCompletionPatch(current, catalog, { extraVision, refresh: true });
const counts = plan.changes.reduce((a, c) => { for (const f of (c.fields ?? [])) a[f] = (a[f] ?? 0) + 1; return a; }, {});
console.log(`补齐：${plan.changes.length} 个模型要改 / ${plan.unchanged} 个不动 / 目录缺 ${(plan.missingInCatalog ?? []).length} 个`);
console.log('  字段分布：', JSON.stringify(counts));
for (const c of plan.changes.slice(0, 5)) console.log(`  · ${c.id} → ${JSON.stringify(c.next ?? c.changed ?? c)}`);
if (plan.warnings?.length) console.log('警告：', plan.warnings);

if (!APPLY) { console.log('\n（预演模式，未写入。加 --apply 才写）'); process.exit(0); }

// ⑥ 备份 + 叶子级写入（保留注释与格式）
const backup = `${FILE}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
fs.copyFileSync(FILE, backup);
const doc = parseDocument(fs.readFileSync(FILE, 'utf8'));
doc.setIn(['dsh-chanhub', 'modelCapabilities'], MP.serializeCapabilities(merged));
doc.setIn(['dsh-chanhub', 'modelPullSnapshot'], JSON.stringify(MP.snapshotFromCatalog(catalog, { at, provider: PROVIDER })));
doc.setIn(['llm-pi-ai', 'providers', PROVIDER, 'models'], plan.models);
await withFileLock(FILE, async () => { await writeFileAtomic(FILE, doc.toString(), {}); });

// ⑦ 读回验证
const after = yaml.load(fs.readFileSync(FILE, 'utf8'));
const entry = (id) => after['llm-pi-ai'].providers[PROVIDER].models.find((m) => m.id === id) ?? {};
console.log('\n写入完成，读回验证：');
console.log('  备份：', backup);
console.log('  基线条目：', MP.parseCapabilities(after['dsh-chanhub'].modelCapabilities).entries ? Object.keys(MP.parseCapabilities(after['dsh-chanhub'].modelCapabilities).entries).length : 0);
console.log('  模型数：', current.length, '→', after['llm-pi-ai'].providers[PROVIDER].models.length);
for (const id of ['workbuddy:cn:deepseek-v4.1-flash', 'traework:cn:kimi-k2.7-code', 'qoder:work:deepseek-v4-pro']) {
  const m = entry(id);
  console.log(`  ${id}: ctx=${m.contextWindow} maxOut=${m.maxTokens} input=${JSON.stringify(m.input)} efforts=${m.reasoningEfforts ? Object.keys(m.reasoningEfforts).join('/') : '-'}`);
}

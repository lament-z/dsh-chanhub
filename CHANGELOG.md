# Changelog

### 补齐 cool_kind 的 breaker / account_fault 文案（对齐网关本轮吸收）

网关的 `/status` 把 `cool_kind` 改成按「`until` / `breakerUntil` / `degradeUntil`
三截止取最远者」派生（吸收 panel `5f6c7ca` #4）。此前它直接取存下来的 `coolKind`
字段，而熔断与连败降权**从不写那个字段**，其零值又是 `CoolHard` —— 于是仅熔断的
账号被渲染成「积分耗尽，冷却至次日 04:00」，把排查方向带偏。

派生之后取值变成五个：`hard_credit` / `soft_rate` / `account_fault` / `breaker` /
`degrade`。插件侧此前只认 `soft_rate` / `hard_credit` / `degrade`，`breaker` 与
`account_fault` 会落到 `reason` 兜底 —— 而 `reason` 常是一句上游原文（如
`6004 model rate limit`），运维看不出「这是熔断还是账号级风控」。本次补上两条文案。

新增 `test/cool-kind.test.mjs` 把五个取值钉死：任何一边新增取值都会在那里显形；
未知取值仍回落 `reason`（不编造文案）。`client/client.js` 已重新构建（宿主加载的是
产物，改源不重建等于没改）。

### 下线开学季界面、暴露成长队列排程、新增「最早到期优先选号」开关

三件事同批，都与网关侧对齐。

**一、开学季（校园日）界面全量下线**

该活动一年一次、当时已下线，但界面还在：任务中心里留着一个永远不会执行的
`schoolseason` 任务码，模型/任务列表里也带着它的残留。清掉的东西：

- 开学季专属的界面块与入口（活动已下线，留着只会污染界面、让人以为还能用）；
- `GROWTH_CODES` 里的 4 个**幽灵码**（`chat_3_times` / `expert_use` / `share_invite` /
  `desktop_chat_1_time`）—— 它们由三方交叉核对（插件码表 / 网关 `task_runner.py` 的
  MAPPING / 上游实际返回）发现：两边都查不到，属于早期抄漏后一直没被发现的死码。
  码表 23 → 19，双向 `comm` 比对为空。
- 删掉 `schoolTasks()` 这个「兼容层」。它**没有任何调用方**：全仓零引用，另外 5 个插件
  零引用，且 `package.json` 的 `exports` 是白名单（只有 `.` / `./client` / `./package.json`），
  `./lib/chanhub-client.js` 对 npm 消费者根本不可达 —— 当初「可能有外部调用方」的
  保留理由不成立。**教训**：「可能有外部调用方」必须一路查到 `exports` / `files` 才能当理由用。

**二、暴露成长队列排程（对齐网关 `74c324a`）**

网关新增了 `growth` 任务（每日 01:00 扫描全账号待办并执行）。插件侧补上它的
`growth_hours` / `growth_enabled` 两个配置项，默认 `[1]` —— 取 01:00 而非 00:00 是因为
`Sequential_Tasks_*` 族每日零点才解锁下一环，00:00 扫描会撞上解锁竞态、只看到上一环的
陈旧状态。注意它**只关定时自动执行**，任务中心「执行全部待办」不受影响。

**三、新增 `pool.prefer_expiring`（最早到期优先选号，EDF）**

网关把选号从「快过期积分占比 ×8 权重」换成了「最早到期优先」：候选里只要有账号带
有效的最早到期批次，就按最早到期升序**确定性**选它，绕过 top5 + 加权随机。这个开关
默认开，**可热改**。

为什么插件必须暴露它：EDF 的代价是把中等负载下的压力堆在最早到期的那个号上
（拿「摊开负载」换「截止期优先」），单请求延时先升高、更快撞到该账号的限流。
生产上出现这个现象时，运维需要**一键退回**纯加权随机，而不是去改配置文件再重启。

配置规格表因此 53 → 54 项。顺手把 `config-spec.js` 里那句硬编码「不在 53 项清单内」
的报错文案改成不带数字 —— 计数词本身就是腐化源（这轮已经因为「三因子」「51 项」
「Seven task kinds」漂移过三次）。


### 修复：模型 Tab 的「错位 / 挤在一起」——残留 CSS + 行高不齐 + 列内元素过多

用户反馈「有的胶囊或者行，视觉效果上错位了，挤在一起」。实测（真机 3088 + getComputedStyle
+ 逐元素量尺寸）三个独立原因：

1. **残留的旧 CSS 把新样式盖回去了**：第一版重做留下的整块 `.dshc-ma-*` 规则仍在样式表里，
   且排在新的后面 —— 同优先级下后者胜，于是「仪表盘式统计块」被盖回成第一版的**胶囊**
   （`border-radius:999px` + `padding:2px 8px`），6 个统计块彼此紧贴、看起来像一坨。
   → 删掉残留块（并加了断言防止再次插错位置）。
2. **行高在 25/31/34/44/63px 之间跳**：目录判定列最多塞 5 个元素（能力 / 判定 / 状态 /
   ≠白名单 / 实测 / 矛盾），122px 下必然折 2~3 行，整行被顶高，同表内行高不齐 → 「错位」。
   → 目录判定压成「能力徽章 + 一致性记号（✓ / ≠ / ? / ·）」，证据全进 tooltip；
   `与目录矛盾`→`矛盾`、`≠白名单`→`≠`、`未写入`徽章压成小号（61px → 43px），
   并把倍率从「上文/输出」列移回名称（与网关下发一致，不再重复占位）；
   列宽按实测重排（22/142/104/116/174 = 558）；`tbody tr { height: 34px }`。
   结果：前 14 行全部 34px（仅 qoder 带折扣说明的行 37px）。
3. **结论条 6 个按钮在 558px 里必然换行**（实测 5 个按钮合计 624px），平铺换行看起来像
   挤在一起 → 改两段式：上行 = 规模数字 + 主按钮（唯一会写配置的动作），1px 分隔，
   下行 = 次级动作；并把「刷新能力目录」「沉淀确认项」两个低频维护动作收进「更多」
   （仍是一次点击可达；两个渲染用例改为先展开「更多」再断言）。
   结论条高度 204 → 164px。

测试：`node --test` 410 用例 0 失败（2 个用例按新的「更多」结构更新，1 处 const→let）。
真机：浅色 / 暗色两套主题都截图核对；行高统一、统计块竖线分隔、按钮分段。
### 修复：模型 Tab 把 traework / qoder 的模型整片藏掉（official 三态语义）+ 视觉重做

**一、渠道模型被丢（严重）**

用户报「模型 tab 除了 workbuddy 渠道，其他渠道的模型被丢了」。根因：官方名单是
**WorkBuddy 上游**的目录字段（`data.agents[cli]`），traework / qoder 走各自上游
协议、根本没有这个概念，而上一版给它们也写了 `official=false` → 面板默认的
「只看官方」把 traework 28 + qoder 14 全藏掉。

三态必须分清：`true`=在官方名单 / `false`=明确不在（只有 workbuddy 有资格下这个
结论）/ **缺失**=该渠道没有官方名单（照常显示）。改法：

- 网关：`official` 只对 workbuddy 渠道输出（chanhub 提交 6a9430d）；
- 插件 lib：四处透传改为**三态原样**（缺失不再被压成 false）；
- 面板：筛选语义改为「隐藏扩展」——只藏**明确**的扩展，缺失那一类始终显示；
  结论条的官方/扩展计数也按此口径，tooltip 写明「另 N 条来自没有官方名单的渠道」。

**二、视觉重做（对齐其他页面）**

结论条改成仪表盘式统计块（16px 数字 + 10.5px 标签 + 1px 竖线分隔，与概览卡
「渠道竖排 + 竖线」同一手法），卡片统一用 layer-1（白/暗底）浮在页面底色上；
筛选 chip 对齐用量页 `.dshc-seg` 的形态（26px、12px、选中态品牌描边）；
搜索框改胶囊 + 前置图标；表头 11px + 字距，行加 hover，单元格 12.5px。

**踩坑记录（值得写下来）**：chip 的选中态类名最初用 `.on`，结果在暗色主题下
渲染成**白底白字完全看不见** —— 宿主有一条全局 `button.on` 规则（brand 底 + 白字），
而暗色下 `--dsw-alias-brand-primary` 本身就是近白 `#f9fafb`，同时压过我的
`.dshc-ma-chip.on`（2 个类）。改用 `is-on` 比堆 specificity 干净，也不会再撞别的
全局类。CSS 注释里还踩了一次：模板字符串里的反引号会把 CSS 字符串截断。

测试：新增「没有官方名单的渠道（official 缺失）不被『隐藏扩展』藏掉」渲染用例
（3 条：官方 1 + 无名单 2，扩展被藏）；`node --test` 410 用例 0 失败。
真机（3080 + 网关 :7866）：默认显示 83/109、四组齐全、暗色下 chip 可读。
### 新增：模型 Tab 信息架构重做 —— 结论条 / 搜索筛选 / 按渠道分组 / 官方分层

现象（用户反馈）：模型 Tab 界面太乱、信息太多，110 个模型时看不过来。

诊断（量化）：`ModelAbilityTab` 是 ~900 行单组件，表格上方 10 个信息块，表格本体
8 列 × 110 行，**无搜索 / 筛选 / 分组 / 滚动上限**，每行最多 ~10 个视觉元素，所有
信息同一视觉权重平铺 —— 而真正需要动手的（待确认 30 / 未写入 14）只占少数。

改法：
- **结论条**：`110 个模型 · 40 官方 · 70 扩展 · 61 可勾选 · 30 待确认 · 14 未写入`
  + 主按钮（应用补丁 / 补齐配置字段按状态显隐）；provider / 覆盖开关 / 拉取记录 /
  回滚收进「更多」；两段口径长文收进 `<details>`。
- **搜索 + 快捷筛选 chips**：搜索 id / 名称；chips 覆盖官方 / 扩展 / 待确认 /
  双源冲突 / 未写入 / 变化 / 可勾选，**同时满足**（渐进收窄）+ 一键清空 +
  `显示 N / M 个 · K 组`。
- **按渠道分组**：三段式 id 的前两段成组（workbuddy:cn 44 / traework:cn 28 /
  qoder:cn 14 / workbuddy:global 24），组头带计数、可整组收起。
- **官方分层**（配合网关新增的 `official` 标记，见 chanhub 599c343）：默认
  「只看官方」，扩展只折叠不删除；**旧快照没有该字段时该筛选自动失效**，
  绝不把列表筛成空的（那看起来像"模型全没了"）。
- **表格**：滚动容器 `max-height: 62vh` + 吸顶表头；`table-layout: fixed` + 逐列
  定宽（真机实测面板内容区只有 **558px**，自适应布局会撑到 765px 把「目录判定」
  挤出可视区）；上文 / 输出 / 倍率三列并一列；名称去掉冗余的 `[渠道]` 前缀
  （组头已写渠道）；目录判定的等级 / 票数 / 来源收进 tooltip（状态压成 ✓ ? ! — · 记号）；
  长 id 走省略号，全值进 title。

顺带修一个存量 bug：`diffModelSnapshots` 用 `!==` 比 `efforts` **数组** → 引用不同
即判「变了」，真机上「变化」恒定报 51（所有带档位的模型），那个筛选等于没有。
改为逐项比较。

注意：`lib/` 侧的改动（快照新增 `official` 字段、diff 修复）**需要重启宿主进程**才
生效 —— 客户端 bundle 刷新页面即可重载，服务端模块是启动时加载的。

测试：新增渲染用例「结论条 + 搜索/筛选 chips + 按渠道分组 + 滚动吸顶」与
「同内容的 efforts 数组不算变化」；`node --test` 409 用例 0 失败。
真机（3080 + 网关 :7866）：默认显示 40 条（官方 CN 16 + global 24，与
`GET /v1/models?catalog=official` 逐条一致），分组 4 组，收起首组 110 → 66 行，
吸顶表头 / 滚动上限 / 口径说明折叠均生效。

### 修复：用量页「时段分布」那张图说不清是什么 / 颜色不对 / 没有标注 / 没有合计

现象（用户反馈）：网关小时槽只保 48 小时、日槽要跨天才产生，所以「按天」早期只有
1–2 天数据；页面降级出一张按小时的分布条，但那张图**没有标题、没有单位、没有合计**，
条的颜色是品牌蓝（#4f6ef7），与正上方图例的蓝 ramp（#dbeafe→#1d4ed8）不是一套 ——
同一张卡里两种蓝；而且它硬编码画 `requests`，把卡片切到 Tokens 时下面还在画请求数。

改法：
- 时段分布条自带标题 + 单位 + 合计（`24 小时时段分布 · Tokens · 合计 1.8K`）；
- 配色改走热力图同一套分位色阶（复用 `quartileThresholds`/`heatLevel` → `h0..h4`，
  新增 `.dshc-ust-hourbar` 的深浅主题 CSS），于是同一张卡里的图例能直接解释它；
- 口径跟随卡片指标开关（`hourlyProfile` 本来就同时给 requests/tokens，此前只用了前者）；
- 每日用量卡补「合计」数字 —— 它此前只被当作图例百分比的分母，数字本身从没露过面；
- 每日用量卡副标题写明「近 N 天」，并修掉页头口径标签的假话：KPI/排行/占比/热力图
  取的都是**网关窗口**（720h = 30 天），而「近 N 天」只是每日柱状图的缩放。

顺带记录一个**被否决**的方案：曾把「近 N 天」做成全页口径（在 `scopeUsage` 里按天切分桶
并重算 total），被渲染测试当场拦下 —— 客户端从 buckets 重算的 total 与网关 accumulate
的权威值不是一回事（真机 fixture 上 total_tokens 差 3.5 倍；真实环境还有桶容量降级等
客户端看不到的项）。要做真正的天数窗口，正确做法是拿 `?window=168h` **重新问网关**，
而不是在客户端做减法。理由已写进 `scopeUsage` 的注释，免得后人再走一遍。

测试：新增渲染用例「稀疏时的时段分布条带标题/单位/合计，配色走热力分位色阶，口径跟随
指标开关」；`node --test` 407 用例 0 失败。

### 新增：模型能力治理 —— 目录三态比对 → 能力基线 → 补齐配置字段（解「上游 1M、DSH 只有 256K」）

现象（用户提问）：上游标注 `deepseek-v4.1-flash` 上下文 1M，DSH 里只显示 256K。
根因在 `dsh-llm-pi-ai`：`entry.contextWindow ?? base?.contextWindow ?? request.defaultContextWindow`，
配置里没写就落到 `DEFAULT_CONTEXT_WINDOW = 262144`。**不是上游标错，是我们没把真实上限写进配置。**

改法：一条从「证据」到「写入」的链路，每一层都可单独叫停。
- **① 目录三态比对**（`lib/model-catalog.js`，只读）：本地 pi-ai 目录（离线，随 DSH 升级）
  + `models.dev`（8033 模型）+ OpenRouter（444）→ 归一化键后按
  「精确 → 剥一层部署后缀 → 前缀相似度 ≥ 0.85」匹配；结论按证据等级投票
  （L1 原厂 > L2 云托管 > L3 转售），同级平票记 `conflict`，无收录记 `missing`，
  档位别名（`auto`/`fast-model`/`default-model`…）不参与比对。在线目录只落盘缓存，
  面板打开**零网络**；`refreshModelCatalog` 是唯一联网动作。
- **② 能力基线**（`settings.modelCapabilities`，`lib/model-patch.js`）：只沉淀**确认态**，
  借判/冲突/别名/无收录一律不写 —— 宁可不写，也不把猜测写成事实。
  有效视觉集合 = 人工白名单 ∪ 基线里的 `image` 项。
- **③ 补齐配置字段**（`completeModelFields`）：只填**缺失**字段（`contextWindow` /
  `maxTokens` / `reasoningEfforts` / `input`），不增不删模型；先给预演（改哪些、改成什么），
  用户点「确认写入」才落盘。
- 面板（模型 Tab）：「刷新能力目录」/「补齐配置字段（N）」/「沉淀确认项（N）」三个按钮，
  每行一个只读徽章（等级/票数/命中方式/来源 hover 可见）。
- 顺带修：`applyModelsPatch` 端点被上一次提交漏掉，面板「应用补丁」一直报
  `Unknown endpoint`；`reasoningEfforts` 按 pi-ai 的**对象映射**（`{level: wireValue}`）写入。

测试：`test/model-catalog.test.mjs`(32) + `test/model-catalog-rpc.test.mjs`(22) +
`test/model-capabilities.test.mjs`(25) + `test/model-pull-record.test.mjs`。
真机：旧快照下 28 个模型缺字段；写入后 `workbuddy:cn:deepseek-v4.1-flash` 由回落的
`262144` 变为 **`1000000`**（maxOut 128000、档位 low/high/max、`input: [text, image]`），
36 → 36 个模型（只填字段不增不删），第二次预演 0 改动（幂等）。
写入走 `yaml` Document 叶子级 diff + `withFileLock` + `writeFileAtomic`，注释与格式不动。

### 新增：多模态能力「实测」探针 —— 真发一张图，答对才算看见（L0 最终裁决）

动机（用户原话）：**「除了多模态能力不信任上游」**。目录是别人的二手标注、白名单是人工认定，
那就只剩实测能算数 —— 这一层是最终裁决，等级 L0。

⚠️ **真机教训（三次打脸，代码注释里钉住了，别退回「200 就算支持」）**：
- 只发一张图看有没有报错**证明不了任何事**：`workbuddy:cn:hy3`、`glm-5.3`（目录都标「文」）
  带图请求都返回 200 —— 图片被静默丢弃时模型照样作答；`glm-5.3` 还会**编**一个颜色（「浅灰色」）。
- 图太小本身会误判：8×8 纯色图问颜色，`glm-5.3` 编颜色；换成 40×40 带数字的图后它答对了。
- 只认精确色名会漏判：模型常按**色族**作答（navy 答「蓝色」、teal 答「蓝绿色」、
  maroon 答「红色」、olive 答「绿色」）而**数字全对**。

改法（`lib/model-probe.js`）：
- **行为化提问**：图里画「背景色 + 白色数字」（3×5 点阵放大 ×5，纯 JS 手编 PNG，零依赖），
  问「背景是什么颜色？中间的数字是几？」—— **答对才算看见**（盲猜同时命中 ≈ 3%）。
  样本由模型 id 哈希决定：同一模型可复现（所以能拿录下的回答离线重放分类器），不同模型不同题。
- **判定**：数字是主信号（10 选 1），色族做辅助；自述看不到图（`看不到`/`无法处理图像`/
  `不支持`/`请切换到支持多模态的模型`/`没有提供图像`…）→ 文；答错/答一半 → **未定**
  （模型会编颜色：既不算看见，也不能算纯文本）。
- **请求级归因**：明确拒绝图片 → 文；模型不存在/无健康账号（`service info not found` 11102）→ 未定；
  **限流/过载（3003/3004、rate limit、429、502-504）→ 未定且不补纯文本对照**
  （补了也会被同样限流，会被误判成「纯文本可过、带图失败」—— 真机踩到过）；
  含糊 400 → 补一次纯文本对照归因。
- **thinking 预算**：thinking 模型会把预算烧在思考上（`content` 空、`reasoning_content` 满），
  `max_tokens=600` 时先试一次，空则自动放大到 2400 重试（真机：`deepseek-v4.1-flash`
  600 空 → 2400 答对）。
- **纪律**：串行 + 间隔（默认 300ms）+ 单批上限 12（保护账号）；`unknown` 一律不写配置、不进基线；
  只有 image/text 可沉淀。
- **等级保护**：`mergeCapabilities` 加等级闸（L0 实测 < L1 原厂 < L2 云托管 < L3 转售），
  目录结论不得覆盖实测结论 —— 否则用户点一次「沉淀确认项」就会把实测翻过来的结论
  用目录的错标注覆盖回去。
- 面板：「实测未定项（N/总数）」+ 每行「实测」按钮；实测结论与目录判定并列显示，
  **不一致时打红色「与目录矛盾」**（hover 说明该信谁：按纪律以实测为准）。

真机实测（全量 107 个模型，两轮；逐条见 `docs/vision-probe-measured.md`）：
```
一轮 107 个（间隔 500ms）→ 图 59 · 文 9 · 未定 39（离线重放修正分类器后：图 67 · 文 11 · 未定 29）
二轮 30 个（只重测「临时失败 / 数字答错」，间隔 1500ms + 按渠道轮转，避开单个上游限流）
两轮合并（取最硬证据 图 > 文 > 未定）→ 图 69 · 文 13 · 未定 25
```
- **目录标「文」、实测「图」17 个**（目录漏判）：`hy3-x`、`hy4-preview-f`(×2)、`hy4-preview`(×2)、
  `glm-5.3`(cn/qoder)、`glm-5.2`(cn/qoder)、`glm-5.1`、`minimax-m2.7`(cn/qoder)、
  `deepseek-v4-pro`(cn/qoder)、`deepseek-v3-2-volc`、`qwen3.7-max`、`hy3`(global)。
- **目录无收录、实测「图」19 个**：`glm-5.0-turbo`、`kimi-k2.8-preview`(×3)、`deepseek-v4-flash`、
  `seed-code-pro-0430`、`sagitta`、`aquila`，以及全部渠道档位别名
  （`auto`/`fast-model`/`balanced-model`/`deep-model`/`default-model`/`primary-model`）。
- **目录标「图」、实测「文」1 个**（目录错判）：`workbuddy:global:glm-5.3-flash`。
- **同名模型在不同渠道结论相反**：`glm-5.3` cn 图 / global 文，`glm-5.3-flash` 同，`glm-5.2` 同
  —— 目录是全局标注，天生区分不出渠道，这正是「按网关实测」不可替代的原因。
- 未定 25 个几乎全是**与视觉无关**的原因：8 个模型在当前账号下不可用（11102）、
  traework 的 glm 系持续限流（3004）、`Doubao-Seed-2.0-Code`/`kimi-k3` 90s 超时、
  少数「数字答错」的按纪律记未定。

测试：`test/model-probe.test.mjs`(25，含解码 PNG 逐像素核对数字真画在图上) +
`test/client-render.test.mjs`(59，含「与目录矛盾」必须出现)。全量 357 例 / 336 通过 / 0 失败 / 21 跳过。
附带 `docs/apply-model-fix.mjs`：命令行版「沉淀 + 补齐」（面板按钮的等价物，可预演、可复盘）。

### 侧边栏入口：把「渠道中心」图标按钮收进卡片（一张卡两个点击区）

现象（用户反馈）：卡片 + 1px 分隔线 + 独立图标按钮是**三个并排盒子**，看着割裂。

改法：展开态的**整行盒子就是那张卡片**（描边/圆角/渐变/左健康色条/底部渠道条全在它身上，
`overflow:hidden` 把装饰裁在圆角里），卡内是两个独立点击区 —— 账号池主按钮（`flex:1 1 auto`，
透明底）与右侧 30×30 无文字图标按钮（`Icons.hub`），中间 1px 令牌竖线分区。
- hover **任意一处**：整卡描边升一档（`l2→l3`）+ 轻阴影，同时被 hover 的那个点击区出底色；
  **不做位移**（早先 D 步的 `translateY(-1px)` 已按用户要求去掉 —— 卡片不该随鼠标动）；
  键盘聚焦用 `:focus-within` 抬描边 —— 即"一张卡"而不是"两块"。
- 半透明底色一律走 `color-mix`（`var(--token)14` 会被浏览器整条丢弃）；
  卡内两个点击区的 hover/open 底色改由 `ENTRY_CSS` 的 `.dshc-entry-cell` / `.dshc-entry-icon` 提供
  （内联 background 会盖掉类规则）。
- rail（56px 轨道）不变：没有卡片，只有一个 36×36 图标。

测试：新增断言「渠道中心图标按钮必须框在卡片内（`iconBtn.parentElement === card`）、
主按钮也在卡内、卡内有 1px 分隔线」。全量 `node --test test/*.test.mjs` → 233 例 / 212 通过 / 0 失败 / 21 跳过。
真机实测：卡片 `256×36 @(12,1242)`（1px 令牌描边、圆角 10）、主按钮 `205×34 @(24,1243)`、
图标 `30×30 @(234,1245)` 且 `card.contains(icon)=true`、左健康条 `3×34`、底部渠道条 `251×3`（3 段）；
hover 图标 → 卡片位置不变（`transform: none`，矩形仍是 `12,1242,256,36`）+ 描边 `l3` + 图标底色；点图标开弹窗、点主区开浮层；
rail 仍 `36×36`；横向溢出 0、`[data-slot-error]` 计数 0。

### 配色吸收：渠道中心改用与侧边栏同一套渠道色（唯一色源 `channelPalette`）

问题：同一个渠道在侧边栏浮层是**有身份的**（蓝色条 + 余额渐变 + 走势线），到了渠道中心
却只剩文字 —— 账号池是 `<Tag tone="info">`（三家全同一种蓝）、表格是纯 `td`、筛选项是纯文字按钮，
**三家渠道在中心里看不出区别**；用量图表的分类色板又抄了一份含同色 hex 的字面量按下标分配。
吸收后「同一渠道在浮层 / 账号池 / 用量页三处必然同色」变成**结构保证**，不是靠各处记得调 `channelColor`。

三层落地（按方案执行，一次一处，每步全量测试）：

1. **同源**：`derive.js` 新增 `channelPalette(id)` → `{solid, soft, edge}`（`solid` = 现有
   `channelColor`；`soft` = `color-mix(solid 12%)`；`edge` = `color-mix(solid 45%)`），
   并配单测 `U27`（三渠道互异 / soft·edge 由 identity 派生 / 未知与空值回落中性灰）。
2. **同形**：`ui.js` 新增共享组件 `ChannelDot` / `ChannelChip`（带 `data-channel-dot` /
   `data-channel-chip` 便于断言），浮层 `AccountQuickRow` 与渠道中心**用同一个组件**：
   - 浮层行：原 `Chip(vm.channelLabel)` → `ChannelChip`；
   - 账号池表格：首列加渠道圆点、渠道列改渠道胶囊；渠道筛选项每段带圆点；
   - 账号卡：左缘渠道色走 CSS 变量 `--dshc-chan`（不内联 box-shadow，避免覆盖 hover 阴影）；
   - 详情抽屉头部：渠道 `Tag(tone:info)` → `ChannelChip`。
3. **同用**：
   - 概览「渠道分布」：有号走渠道胶囊、无号保持中性灰 Tag；「三渠道积分卡」左缘渠道色 + 标题圆点；
   - 用量 Tab：`seriesColor(item, index)` 新增 —— **渠道维度用 `channelColor`**（账号排行行按
     `row.channel`、渠道用量行按 `row.key`），其它维度才走分类色板；两处排行条按渠道着色；
   - `SEG_COLORS` **让位**：删掉与渠道色重复的蓝/紫/青三色（10 → 7 色），并让 `usage/cards.js`
     改为从 `theme.js` 单一来源导入（原来两份字面量各写一遍），杜绝「某渠道=蓝、某模型也=蓝」。

纪律（已锁进测试）：渠道色**只上形状**（条/点/线/底），文字一律 `--dsw-alias-*` 令牌 ——
真机实测胶囊文字色是 `rgb(249,250,251)`（暗）/ `rgb(15,17,21)`（亮），渠道色从未出现在正文上。

**两处如实不做**（没有数据就不画，不编造）：日志行的 `ch` 是**日志频道**（chat/task/sys），
不是 provider 渠道；配置页也没有按渠道分组的字段 —— 这两处没有渠道身份可吸收，故不加渠道点。

测试：`node --test test/*.test.mjs` → **227 例 / 206 通过 / 0 失败 / 21 跳过**。
新增渲染用例「渠道身份走颜色」——断言挂在 `data-channel-*` 上（jsdom 的 CSSOM 不认 `color-mix`，
不能用内联色断言），并**直接引用 `channelPalette()` 作为期望值**做同源校验。

真机回归（无头 Chrome + 真实宿主）：

| 断言 | 实测 |
|---|---|
| 浮层 vs 中心的同渠道色 | workbuddy `rgb(79,110,247)` 两处相等；traework `rgb(168,85,247)` 两处相等 ✓ |
| 中心三渠道圆点 | WB/Trae/Qoder = `#4f6ef7` / `#a855f7` / `#06b6d4` |
| 卡片左缘 | `dshc-chancard` / `dshc-acctcard` 的 `--dshc-chan` = 渠道 hex，计算后 `border-left-color` 同色 |
| 用量排行条 | 账号行按各自渠道着色；渠道用量行 WB=蓝、Trae=紫 |
| 亮色主题 | 胶囊 soft 底仍解析为 `color(srgb … / 0.12)`，文字随令牌变亮色 —— 无硬编码泄漏 |
| 布局 | 桌面 / 390px 移动端横向溢出均为 0 |

### 入场动效：健康环扫出 + 渠道条逐段长出 + 卡片淡入（一次性，不随轮询重播）

在 `useCountUp`（数字）之外，给另外三个视觉元素补入场：

- **健康环**：520ms 内从 0 扫到目标占比 + 淡入。扫出期间把 `Ring` 的 CSS 过渡关掉
  （新增可选 `transition` prop，默认值不变），否则 JS 进度与 CSS 过渡两套动画叠加会发飘；
  扫完交回 `stroke-dasharray .35s`，之后健康占比变化仍然平滑。
- **3px 渠道条**：整体淡入 + **逐段错开长出**（`SEG_STAGGER = 0.28`，最后一段恰好在 enter=1 收尾）；
  入场结束后恢复 `transition: width .35s`，后续账号数变化平滑跟随。
- **卡片 / 图标按钮**：`ENTRY_CSS` 里一条只动 opacity 的 `dshc-entry-in .22s`（不用 transform，
  避免和 hover 的 `translateY(-1px)` 抢同一属性；**该上浮后经用户要求已撤销**，见最新一条）。

新增 `useMountProgress(duration)` hook（放在 `quick-entry.js`，与 `Ring` 相邻），沿用 `useCountUp` 的
**"动画必须可失败"** 纪律：无 rAF、或 `prefers-reduced-motion: reduce` → 直接返回 1（终态）；
rAF 被节流时还有 `setTimeout(duration + 150)` 兜底落定，环/条**绝不会停在中间态**。
动效只在挂载时播一次（effect 依赖 `[duration, canAnimate]`），60s 轮询与浮层开关引起的重渲染都不重播 —— 已实测。

测试：`node --test test/*.test.mjs` → **225 例 / 204 通过 / 0 失败 / 21 跳过**。
新增渲染用例「入场动效可失败 —— 健康环/渠道条最终必须落到真值（不停在 0 或中间态）」
（按 fixture 的 `healthy/total` 反推期望弧长，并断言各段宽度合计≈100%）。
真机分帧采样（无头 Chrome，每帧 ≤1ms 轮询，1.5s 共 3817 次）：

| 时刻 | 环弧长 | 条不透明度 | 分段宽度 | 卡片不透明度 |
|---|---|---|---|---|
| 16ms | 2.3 / 40.84 | 0.39 | `[9, 0]`（第二段尚未开始） | 0.00 |
| 342ms | 27.9 | 0.79 | `[108, 49]` | 1.00 |
| 515ms | 40.84（满） | 1.00 | `[124, 77]` | 1.00 |
| ≥875ms | 40.84 | 1.00 | `[124, 82]`（真值 3:2） | 1.00 |

同一页面开 `prefers-reduced-motion: reduce` 后采样：**首帧即为终值**（弧 40.84、条 1.00、分段 124/82），
确认减动效环境下不播动画、也不停在初值。另测：连开连关浮层 2 次（触发重渲染），环/条/卡片数值不变 → 无重播。

### 修：侧边栏入口「点第二下收不回」（pointerdown 抢关 + click 再开）

现象：点一下开账号池浮层，再点一下**关不掉**（`aria-expanded` 一直是 true），只能点外部或 Esc 才关。

根因：两个处理器抢同一件事 —— 外部点击关闭挂在 `document` 的 **pointerdown**（捕获）上，入口按钮不在
`rootRef`（浮层根）里，于是 pointerdown 先 `setOpen(false)`；紧接着同一个物理点击的 **click** 到达按钮的
`onClick`，它做的是 `setOpen(v => !v)`，读到刚被关掉的 `false` 又切回 `true`。净效果 = 永远开着。

修法：`onPointerDown` 里对**入口按钮自己的子树**（`buttonRef`，含 rail 态那颗图标）一律放行，
把开关交给 `onClick` 独占；点外部（浮层与按钮之外）仍然由 pointerdown 关闭。

测试：新增渲染用例「入口点击可开可收（第二下必须关上）」——用 pointerdown + click 两次事件
模拟真实点击（旧的 `clickEntry` 只派发 click，抓不到这个 bug），并额外断言「点外部仍会关」。
`node --test test/*.test.mjs` → **224 例 / 203 通过 / 0 失败 / 21 跳过**。
真机回归（无头 Chrome）：第一下 `pop=true` → 第二下 `pop=false` → 第三下 `pop=true`；
点主区空白 → 关；Esc → 关；浮层开着点右侧图标 → 浮层关 + 渠道中心弹窗开。

### 侧边栏入口行视觉改版：卡片化 → 健康环 → 3px 渠道条 → 分隔线 → 数字动效

用户嫌「5/5 · 1.02W」单调。按先给方案、选定顺序后**一次一处**落地（每步全量测试 + 真机回归）：

1. **D 卡片化（骨架）**：展开态主按钮从"透明按钮"变成**卡片** —— 圆角 10、`1px var(--dsw-alias-border-l2)`
   描边、极浅 info 渐变叠层底色、左侧 **3px 健康色条**（`overflow:hidden` 裁在圆角内），
   标签改 `label-primary` + 550 字重；hover 上浮 1px + 阴影 + 描边升一档（`l2→l3`），
   在行里挂一个 `ENTRY_CSS` style 节点承载 `:hover/:focus-visible`（内联写不了伪类）。
   行高 32 → **36px**（footArea 82 → 86，会话列表少 4px；rail 仍 36×36 不变）。
2. **A 健康环**：数字左边加 16px `Ring`（3px 描边）表示健康占比，`role="img"` +
   `aria-label/title = 「账号 5/5 健康 · 冷却 N · 禁用 N」`；无账号或错误态**不画环**（只留文字）。
3. **B 3px 渠道堆叠条**：卡片底边内嵌 3px 条，按渠道识别色分段（宽度 = 各渠道账号数占比），
   `title` 注明「WB 3 个 · Trae 2 个」；无账号 / 错误态不画（不留空槽）。
4. **F 分隔线**：卡片与右侧渠道中心图标按钮之间加 1px 令牌竖线（18px 高），行 gap 6 → 4。
5. **E 数字动效**：积分数字走 `useCountUp` —— 初值即真值（**不在挂载时从 0 爬**），只在数值变化时
   播一次；无 rAF / `prefers-reduced-motion` 直接落终值，绝不会停在动画中间值。
   顺带把 `quickSummaryVM` 记忆化，并把摘要与动效 hook 挪到 `if (!enabled) return null` **之前**（Hook 顺序规则）。

顺带修掉一个真 bug：`var(--token)14` 这种"给 token 拼十六进制 alpha 后缀"的写法在本主题下**整条
background 被浏览器判无效**（实测 `backgroundImage: none`），popover 头部与渠道中心弹窗头部的渐变一直没生效。
三处一律改成 `color-mix(in srgb, var(--token) N%, transparent)`。

测试：`node --test test/*.test.mjs` → **223 例 / 202 通过 / 0 失败 / 21 跳过**。
新增渲染用例「卡片化骨架 —— 健康环 / 3px 渠道条 / 分隔线都在，且缺数据时如实退化」。
真机回归（无头 Chrome，1708×1334 / 900×900 / 390×844 三档）：卡片 211×36（描边 1px 令牌色、
渐变有效、圆角 10）、健康环 16×16 @(128,1252) 带 aria、渠道条 206×3 两段（蓝 125 / 紫 84）、
分隔线 1×18 令牌色、图标按钮 36×36；hover → `translateY(-1px)` + 阴影 + 描边 `l3`；
亮色令牌下描边/分隔线随之变（`rgba(0,0,0,.12)`）；rail 与移动端均无卡片/图标按钮且无横向溢出；
`[data-slot-error]` 计数 0；两次读取文案一致（动效不留中间值）。

### 侧边栏「渠道账号」入口：独占一行 + 右侧图标直开渠道中心（弹窗）；网关身份更名 chanhub2api

用户真机反馈，逐条落地（本条为最新）：

1. **网关名 `workbuddy2api` → `chanhub2api`（网关仓库，不做双名兼容）**：`internal/server/handler.go`
   的 `ServiceName`（`/healthz` 的 `service` 字段、`X-Service` 头、`/status` 的 `version` 同源），
   `cmd/server/main.go` 启动日志改引该常量。插件侧 `lib/chanhub-client.js` 的探针**只认新名**
   （用户明确要求不做兼容）：遇到旧名就报「不是本网关」并在文案里给出重建命令 ——
   旧名等于「容器没重建」，迁就它反而把部署错位藏起来。
   已在 `plugins/chanhub` 执行 `docker compose build` + `docker compose up -d --wait`，
   实测 `/healthz` → `"service":"chanhub2api"`、`/status` → `version=chanhub2api`（5/5 healthy）。
2. **入口独占一行**：`sidebar.footer.action` 是共享 list 槽（cordis 面板、dsh-context、成本计量
   的容器都在这行），宿主那一行是**不换行**的 flex row，别人在场就把本入口挤成半行。
   现在 `QuickEntryInner` 把宿主那一行改成 `flex-wrap: wrap`（卸载还原），本入口外面套一层
   `data-dshc-entry` 行盒子取整行宽度（仅展开态；rail 不动），可见文案放宽为「渠道账号 5/5 · 1.02W」。
3. **右侧加「渠道中心」图标按钮（无文字）+ 渠道中心改为弹窗**：整行宽度空出来的右侧放一枚
   32×32 图标按钮（`Icons.hub`，`aria-label="打开渠道中心"`），点它直接开渠道中心；收起态不渲染
   （56px 轨道放不下两个图标）。渠道中心由「主区面板」改为**本插件自己的弹窗**（`CenterModal`，
   portal 到 body，最大 1040×920、移动端整屏 sheet，Esc / 点遮罩关闭，锁 body 滚动、焦点可回收）：
   - 原先那条路走不通且行为也不对：`remote.settings.openSettingsDocument()` 的语义是把 settings.yaml
     交给**原生文本编辑器**，宿主也没有 `openSettings(sectionId)` 深链（见
     `.scratch/sidebar-quick-entry/spec.md`）；主区面板虽然能开，但会把当前会话换掉，看管理台代价过大。
   - 面板组件由 `client/index.js` 以 `centerPanel` / `centerPanelProps` **prop 注入**给入口
     （避免与入口文件循环 import），与设置里的「渠道中心」分区共用同一组件/数据源；没注入面板时
     图标按钮与 popover 底栏按钮都如实不渲染（不留死按钮）。设置里那个分区入口保持不变。
4. **popover 头部只留标题 + 新鲜度**：删掉紧贴标题的「网关名 · 进程 uptime」灰字 ——
   它无前缀、紧贴标题，会被读成一条账号摘要（用户就是这么读的）。要看这两项去「渠道中心」用量页。

测试：`node --test test/*.test.mjs` → 222 例 / 201 通过 / 0 失败 / 21 跳过（真机 e2e）。
新增：`C4 网关身份`（只认 `chanhub2api`，旧名与其他服务一律拒绝）、渲染用例
「渠道中心弹窗：右侧图标打开 / Esc 关闭 / 没注入面板时不渲染」。
真机验证（无头 Chrome + 真实宿主）：入口行 256×32（主按钮 218×32 + 图标 236,1246,32×32）、
`footerActions` 计算样式 `flex-wrap: wrap`、点图标弹出 `[role=dialog][aria-label=渠道中心]`
（1042×922，内含真面板 `.dshc-topbar-title=渠道中心`）、Esc 关闭、popover 底栏「渠道中心」也进同一弹窗、
rail 态回到 `nowrap` 且只剩 36×36 图标、`[data-slot-error]` 计数 0。

### 新增：侧边栏「渠道」入口（foot 区按钮 + 账号池 popover）+ 配置 Tab 的界面开关

左侧栏 foot 区（设置按钮同区、在其上方）新增一个入口：平时只显示「渠道」+ `健康/总数 · 可用积分`，
rail（56px）态只留图标 + 异常角标；点开是一个自带 popover，直接看账号池，不用再进设置面板。

**设计（有颜色也有图，不靠文字堆）**

- 汇总三块：可用积分（大字 + **健康环**）、近 24h（**迷你走势 sparkline**，滚动窗口不是自然日）、
  **渠道分布堆叠条**（workbuddy/traework/qoder 三段识别色 + 图例）。
- 逐账号紧凑卡：渠道色竖条 + 昵称 + 状态胶囊 + **余额相对条**（相对池内最高，渐变）+ 该号 24h 走势 +
  「占用中/刚用过」活跃徽标（带脉冲点）。状态胶囊含在途 `n/limit`、到期（凭证 `expiresAt` 优先）、
  将过期积分。
- 全部为内联 SVG / CSS 渐变实现，**不引入任何图表依赖**；颜色一律走 `theme.js` 的令牌与渠道识别色，
  亮/暗两套主题都过（无头 Chrome 实测：`dialog-bg`、`ring` 随令牌变化）。

**数据纪律（与面板同一口径）**

- 自动路径只打只读端点：`getStatus`（60s 轮询）、`getUsage?window=24h`（展开时，TTL 60s）、
  `getConfig` / `getAccounts`（10min TTL，只为在途分母与到期口径）。
- **只有用户点「刷新」** 才打 `refreshStatus`（真上一次上游）；页面隐藏暂停轮询；连续失败 3 次退避 5 分钟。
- 口径复用 `derive.js` 纯函数：可用积分 = Σ `accounts[].credits`（不可消耗不并入）、健康取 `/status` 顶层计数。
- 网关不可达时如实说「网关不可达 + 地址」，**不显示 0 假数据**。
- 活跃只给证据：`in_flight>0` → 「占用中」，`last_success<90s` → 「刚用过」，否则不显示（「本会话在用哪个
  账号」需要会话粘性键，浏览器侧拿不到，本轮不做）。

**入口偏好转为两级存储（远程页也能开关）**

真机发现：DSH 客户端只在**本机页面**提供宿主设置读写 ——
`dsh-client-ui-settings/lib/client.js:1345`
`const persistence = ctx.remote.$host.isLoopback ? "host" : "memory";`
非 loopback（手机/局域网远程访问）时 scope 恒为 `{status:'unavailable', value:undefined, writable:false}`，
宿主设置**读不到也写不了**（dsh-context 的「上下文洞察入口=隐藏」在远程页失效也是同一个原因）。

改动：`createSidebarPrefs` 变成两级 —— 本机页写宿主 settings（跨设备一致，标「可修改」）；
远程页/无服务时退回 localStorage（只作用于本浏览器，标「仅本浏览器」并给出说明文字）。
这样入口开关在远程页也能真正生效，而不是只能吃默认值。

**修复：入口一渲染就崩（真机 `TypeError: now is not a function`）**

宿主给**每个槽位**都会注入一个共享时钟，属性名就叫 **`now`**，值是**数字**。
我原先自己的时钟也叫 `now`（`now = Date.now` 默认值）→ 被宿主的数字覆盖 → 渲染里
`now()` 当场抛错 → 整条 `sidebar.footer.action` 变成红框「your entry in slot … crashed」，
用户看到的就是"那一行只有一块红、渠道入口不见了"。

改法：自己的时钟改用独立名字 `clock`（仅测试注入用），并对传数字也兼容；
渲染用例新增回归锁 —— 传 `now: 1790000000000`（数字，模拟宿主）时入口仍须正常渲染、
摘要齐全、**不得**退化成错误胶囊。

教训：往共享槽位注册组件时，**不要用宿主公共 props 的名字（`now` 这类）做自己的参数**；
本仓的 `EntryBoundary` 自隔离边界正是这次能立刻看到原因的关键（手机/远程没有控制台）。

**入口自隔离（拿到真机红框后补的护栏）**

真机截图里那一行是一块**红框**（DSH 对「插槽入口渲染崩溃」的占位，
文案形如 `your entry in slot "…" crashed while React rendered it: …`，
由 `dsh-cordis-client-runner` 的 `onEntryError → reportRenderFailure` 产生），
红框替代了整个入口，用户只看到一块红、拿不到原因，而这条插槽还是共享的。

现在 `QuickEntry` 外面套了一层错误边界（类组件）：本插件自己抛错时退化为一个小胶囊
「⚠ 渠道入口异常」，**点开就地显示错误原文**（手机没有控制台，这是唯一能读到原因的地方），
不再让整条插槽变红框，也不影响同行其它入口。配套渲染用例：注入一个 throw 的 store
→ 断言出现胶囊且 `title` 带错误原文。

**foot 行是共享槽位（真机反馈后修正）**

- 那一行（`.footerActions`）里已有 dsh-context 的「上下文洞察」（`order:10`，自身
  `width: calc(100% + 4px)` 的整行样式）。本入口原先也写 `width:100%` → 两项互相抢宽、
  各被压到半行（260px 侧边栏实测 119px），看起来像"没加进来"。
  现在改为 `flex: 0 0 auto` + `min-width: 96`：本项取自然宽度、永不被压扁，让整行样式的那项去收缩。
- 收起态（56px 轨道）扣掉内边距只剩 ~36px，**只容得下一个图标**：本入口按宿主
  `lc-ov-entry-rail` 的规格渲染 36px 图标（不放数字）。当前同行的「上下文洞察」已隐藏、
  cordis 面板在收起态不占位，故独占该槽；**若将来别的入口也回到收起态会互相挤** ——
  届时在配置 Tab「界面」组里关掉本入口即可，或把收起态改回不渲染（一行）。
  实测脚本：`.scratch/sidebar-quick-entry/`（真实 sidebar CSS + 真实 lc-ov-entry 宽度复现）。

**浮层实现**

- `createPortal` 到 `body`（侧边栏 grid track 会裁剪子内容）；锚点用按钮 rect，**按上下可用空间收敛
  maxHeight**，上方不够时翻到下方开（体检时发现矮窗口会裁顶）；`Esc`/外部点击/切 rail/偏好关闭都会收起；
  宽度 `min(344, 100vw-24)`，窄屏降级为底部 sheet；任何一行都不横向滚动。

**配置 Tab 新增「界面」组**

- `☑ 在侧边栏左下角显示渠道入口`（pill 开关，`role="switch"`），持久化在插件 settings 命名空间
  `dsh-chanhub.sidebarEntry`（宿主 `settings.yaml`，跨浏览器一致），客户端用现成的 `ctx.settingsScope`
  读写，**不新增任何 RPC 端点**；改完即时生效，不需要重启。
- 这一组**渲染在「网关配置不可读」错误分支之前**：远程部署 / config.json 读不到时，用户仍然关得掉入口。
- 客户端 `inject` 只加 `settingsScope`（有第三方先例）：`remote` / `remote.settings` 改为**惰性取** ——
  客户端 runner 把「注入了但尚未就绪的服务」记为 `waitingFor` 并**不激活插件**，为「打开设置面板」
  这种便利功能声明依赖，风险是把「渠道中心」面板一起拖下线；现在取不到只隐藏那一个按钮。
- 宿主没有 `settingsScope`（旧版本）时自动降级为「默认开启、开关禁用并说明原因」。

**顺手修掉的口径缺陷**

- 在途分母现在按 realm 分档：`pool.max_in_flight_global`（global 号）优先，否则 `pool.max_in_flight`，
  与网关 `pool.inFlightLimit()` 同规则。此前面板把同一分母套给所有账号，global 档生效时会把
  「在途 n/2」显示成「n/3」并误判「在途占满」。

**测试**：新增 `test/quick-entry.test.mjs`（16 例：口径/store/偏好降级）；`client-render` 补 5 例
（rail/wide 摘要、popover 内容、错误态不显示 0、偏好关闭后不渲染、配置 Tab 错误分支仍有开关）。
全量 **210 例：189 通过 / 0 失败 / 21 跳过**；渲染层用真实 jsdom + 真实 React 跑打包产物（此前 21 例因缺
依赖被 skip，本轮补齐 `/tmp/dshc-render` 后转为实跑）。
设计预览与实施方案见 `.scratch/sidebar-quick-entry/`（spec.md + 亮/暗两张截图）。

### 修复：面板保存恒 400「cannot unmarshal string into []int」—— 送网关前没做类型收敛

上一版修好挂载/写盘后，真机第一次保存就撞到第二个 bug：

```
已写入 1 项 · 1 项需重启网关生效 ·
⚠ 网关热生效端点不可用（网关拒绝请求（HTTP 400）：
  parse config: json: cannot unmarshal string into Go struct field
  Schedule.schedule.cat_hours of type []int）
```

根因：面板输入框交上来的一律是**字符串**（`"0"` / `"8, 21"` / `"false"`），而网关的
`normalize()` 是强类型的（Go `[]int` / `int` / `bool`）。`lib/index.js` 之前把草稿
**原样**发给 `POST /admin/config` → 网关在**校验期**（合并后写临时文件再走 `Load`）
就 400，于是 hours / int / float / duration / enum 这些「输入框来的」字段**一个都热改
不了**，全部掉进降级路径（写盘成功 + 需重启）。降级直写本来就会转换类型，所以磁盘上的
值一直是对的 —— 坏的只有「热生效」这一段。

改动：

- `lib/config-spec.js`：新增 `coercePatchTypes()` —— 用与面板**同一张**规格表把草稿
  收敛成网关要求的 JSON 类型；表外路径原样透传（认不认由网关决定，保住前向兼容）；
  表内字段值不合法则返回逐字段错误。与 `validatePatch` 的分工写进了注释。
- `lib/index.js`：`saveConfig` 送网关前先收敛；不合法就在宿主侧以 `validation-failed`
  收场（**不打网关、不写盘**，附带逐字段错误）。网关成功路径回包带 `viaGateway: true`。
- `client/index.js`：保存按钮改传 `onSave(validation.values)`（校验时已收敛的值），
  不再把输入框原始文本直接发出去 —— 「你校验过的就是你提交的」。

测试：`config-and-auths.test.mjs` 新增 A10（收敛单测：类型、表外透传、非法值、幂等）、
B10（真机 400 的回归锁：面板同形字符串 patch → 断言送网关的是 `[0]` / `4`）、
B11（不合法拦在宿主侧，不打网关不写盘）、B12（bool / hours 两类控件形态）。
全量 189 例：168 通过 / 0 失败 / 21 跳过。

真机验证（dsh 重启后走插件真实 RPC 通道 `/dsh-chanhub/saveConfig`）：

```
{"patch":{"schedule.cat_hours":"0","schedule.checkin_enabled":"true","pool.max_in_flight":"3"}}
→ {ok:true, viaGateway:true, hot_applied:[三个字段]}
{"patch":{"pool.max_in_flight":"abc"}}
→ {ok:false, code:'validation-failed', message:'配置校验未通过：pool.max_in_flight 必须是整数'}
```

修复前第一条正是本条目开头那段 400 toast。

### 面板迭代：8 项可用性修正（加号即刷 · 到期可见 · 用量维度 · 赚得积分 · 紧凑数字）

用户逐条反馈，逐条落实：

**1. 添加账号后自动刷新**
`AddAccountDialog` 的 `onDone` 接到 `refresh()`；**关弹窗也刷一次**（`onClose`）——
「粘贴回调后直接关掉」「中途放弃」这些路径同样可能已经改了池状态，让面板停在上一次
快照上不可接受。刷新是幂等读操作，多一次无副作用。

**2. 图例不再出现白色**
`SEG_COLORS` 从「CSS 变量 + tertiary 灰兜底」换成 10 色固定色板（蓝 / 翠绿 / 琥珀 /
紫 / 青 / 红 / 黄绿 / 玫红 / 蓝绿 / 靛）。旧实现依赖宿主 `--dsw-alias-*` 变量，
宿主没定义时整排图例退化成灰白 —— 深浅主题都不好看。堆叠图图例、模型环形图、
图例行三处共用同一组色；长尾合并的「其他」取末位色并压到 `opacity .45` 作区分。

**3. 账号卡片显示到期时间**
新增 `accountExpiry()`，两个真实来源按可信度取先：
- ① **凭证到期**（`auths/*.json` 的 `expiresAt`，Unix 秒，宿主只读盘点透出）——
  这才是「账号什么时候到期」：登录态一过期该号整体失效 → 显示「到期 09-30」；
- ② 凭证读不到（插件与网关不同机）**降级取积分到期**：最近的、**还有余额**的套餐
  `expire_at` → 显示「积分到期 10-01」。
两个都没有显示「—」，不编造「永不过期」；剩余 ≤3 天或已过期标红，卡片与表格视图同源。

**4. 用量排行加维度，且默认「按用量」**
`RANK_METRICS = [Tokens, 请求, 积分]`，`DEFAULT_RANK_METRIC = 'tokens'`。理由：请求数多
≠ 用得多，一次长上下文请求顶几百次短请求。账号卡右上角放分段器，**渠道卡跟随同一
维度**（否则两列对照不可比）。三个维度取的是同一份 `by_uid` 的不同字段，不是跨口径拼数。

**5. KPI 改 6 卡、两行三列**
一行 `Tokens消耗 / 积分消耗 / 可用积分`（消耗与存量），
二行 `请求数 / 缓存命中 / 平均延迟`（效率）。
栅格固定 `repeat(3, …)` 而不是 `auto-fit`：宽屏 auto-fit 会排成 4+2，把「消耗 / 效率」的
分组语义切碎；窄屏降 2 列、再窄 1 列。缓存与延迟**无观测显示「—」**，不显示 `0.0%` /
`0 ms` —— 没观测和观测到 0 是两件事。

**6. 渠道卡文案**
「3 号」→「3 个账号」（「号」是内部黑话，读者会读成「3 号账号」）；账号池的渠道分布
标签同步改。

**7. 账号池新增「赚得积分」卡**
新增 `earnedCredits()`：各账号逐套餐明细的 `total` 之和（含已消耗掉的），即
「历史上拿到过多少」。三条诚实性约束：
- 取不到明细的账号**不计入**，只如实标注「覆盖 N/M 个账号」，**绝不拿池内余额凑总数**；
- 卡头写「累计获得 · 含已消耗」，与下方三张渠道卡（**当前可用**）明确分开，不被读成同一个数；
- tooltip 给出已消耗 / 剩余与精确值，并写明「已过期且上游不再下发的套餐不计入，
  因此这是**下界**」。

**8. 大数字紧凑单位**
新增 `formatCompact()`：计数类（积分 / 请求）走中文量级 `W / 亿 / 万亿`，
Token 走国际量级 `K / M / B`（token 天然是英文单位习惯，`1.92B` 比「19.2 亿」更贴近这个
领域的读法）。精确值不丢 —— 所有用到它的位置都把原值挂在 `title` 上。
顺带把 `formatTokens` 的单位从 `k` 改成 `K`。

**一个踩过的坑**：KPI 卡的入场动效必须跑在**原始数**上再回写，不能对已格式化的字符串
反解（`"18.9K"` → 18.9 当数量级）—— 那样数字会显示成 `0K`。

**测试**
新增 U23–U26（赚得积分口径 / 到期两级降级 / 排行维度切换 / KPI 六卡与无观测降级），
3 例渲染断言（赚得卡覆盖度、「N 号」黑话无残留、切维度副标题与渠道卡同步），
真机 e2e 的 KPI 断言同步为 6 卡。全量 184 例 0 失败；渲染 42/42（跑在真机数据上）、
真机 e2e 15/15。

### 修复：配置「热生效」在真机上从未成功过 —— 单文件 `:ro` 挂载让网关写盘恒 500

用户反馈：保存配置后仍要手动重启网关，怀疑热生效压根没接。**热生效是接了的**
（`414e646` 起优先走网关 `POST /admin/config`），但你那套部署下这条通道 100% 失败：

- `chanhub/docker-compose.yml` 挂的是 `./config.json:/app/config.json:ro`。单文件
  bind mount 的挂载点在容器内**无法被 `rename(2)` 覆盖**，实测：

  ```
  POST /admin/config → HTTP 500 {"code":"internal",
    "message":"rename config: rename /app/config.json.admin.tmp /app/config.json: device or resource busy"}
  容器内 `mv` 覆盖挂载点 → Resource busy；直写 → Read-only file system
  ```

- 插件的 `saveConfigViaGateway` 只把 404/501/admin-disabled 当「降级」，500 直接
  rethrow → 落到宿主文件直写（`writeGatewayConfig`）→ 返回 `restartRequiredCount`，
  面板 toast 只剩「已写入 N 项 · N 项需重启网关生效」。**改动确实落盘了，只是网关
  一次都没被通知**（chanhub 无 fsnotify / 无 SIGHUP），于是每次都得手动重启。

三处一起修：

**网关（`chanhub` 仓）**
- `internal/server/admin_config.go`：新增 `writeConfigFile()` —— `tmp`+rename 因
  `EBUSY`/`EXDEV` 失败时退化为「先留 `.bak`、再原地截断写」，并把失败原因写进
  500 文案（点名「容器部署请去掉 `:ro`」）。`renameFile` 做成可注入变量，
  单测用 `syscall.EBUSY` 复现挂载点场景。
- `internal/server/admin_config_merge.go`：合并结果改 `MarshalIndent`（此前
  `json.Marshal` 会把 config.json 压成一整行）。
- 真机验证（同一台 Docker Desktop）：单文件挂载上 `rename` 必 EBUSY，而
  rw 挂载的原地写成功并落到宿主文件 —— 所以「去掉 `:ro` + 原地写回退」才能救活。
- 测试：`TestAdminConfigFallsBackOnBusyRename`、`TestAdminConfigWriteIsIndented`
  两例新增；`go test ./internal/server/ -run TestAdminConfig` 11 例全绿
  （该包另有 5 例 model/stats 用例在 HEAD 上就红，与本改动无关，已用 worktree 对照确认）。

**部署（`chanhub/docker-compose.yml`）**
- `./config.json:/app/config.json:ro` → `./config.json:/app/config.json`，并在注释里
  写明「不要加回 `:ro`」的原因（否则热生效端点只会 500）。

**插件**
- `lib/config-spec.js`：`restart` 标记与网关 `dispatchHotApply` 对齐 ——
  修掉四处 drift：`schedule.*`（13 项，`scheduler.Reconfigure` 早已接线却仍标需重启）、
  `prompt.mode`（走逐请求读取面）由「需重启」改为热改；`pool.expiring_soon`、
  `cooldown.soft_rate_max`（网关没有 setter / 只有基数热改）由「热改」改回需重启。
- `lib/gateway-config.js`：降级路径不再借用 spec 的热改标记 —— 文件直写**全部**
  字段标需重启，新增 `viaGateway:false` / `hotCapable` / `gatewayError`，note 说清
  「写盘成功 ≠ 生效」。
- `lib/index.js` + `client/index.js`：把网关失败原因透传到返回值与 toast
  （「⚠ 网关热生效端点不可用（…）· 修复后这 N 项可即时生效」），不再让用户把
  「N 项需重启」误读成「热生效没接」。
- 测试：`config-and-auths.test.mjs` 的 A5/A8/B2 按新语义重写，新增 B9（降级如实汇报）；
  全量 185 例：164 通过 / 0 失败 / 21 跳过。

### 修复：点「↻ 重启网关」报 `/bin/sh: docker: command not found`

真机现场：Docker.app 装着、`chanhub2api-chanhub2api` 容器跑得好好的，点重启却报
`命令执行失败：Command failed: docker restart chanhub2api-chanhub2api /bin/sh: docker:
command not found`。**命令本身没错，是宿主进程找不到 docker 这个二进制**：

- dsh 由 `com.dsh.web.plist`（launchd）拉起，继承的是 launchd 的最小 PATH
  （`/usr/bin:/bin:/usr/sbin:/sbin`，见 `~/.dsh/launchd/dsh-web-launcher.sh` 里那行
  `export PATH`，它只补了 `/usr/local/bin` 与 `/opt/homebrew/bin`）；
- 而 Docker Desktop **未必**往 `/usr/local/bin` 放 CLI 软链（本机就没有，
  `which docker` 为空，二进制只在 `/Applications/Docker.app/Contents/Resources/bin`）。

`docker restart` 走 `/bin/sh -c`，PATH 里没有就只会吐一句含糊的 not found，
看起来像命令写错或守护进程挂了。改动：

**二进制解析（PATH → 已知安装位）**
- 新增 `resolveServiceBinary()`：先查宿主 PATH，再退到 `SERVICE_BIN_HINT_DIRS`
  （`/usr/local/bin`、`/opt/homebrew/bin`、`/usr/bin`…，darwin 追加
  `/Applications/Docker.app/Contents/Resources/bin`，linux 追加 `/snap/bin`）；
  win32 下还带 `.exe/.cmd/.bat` 变体。解析到的目录补进子进程 PATH（已存在则
  保持原顺序，不把它顶到最前）。
- 解析不到时返回 `binary-not-found` + 搜过的目录 + 「软链 / 填绝对路径」的可操作
  提示，而不是让 shell 甩一句 not found。

**子进程 env 补 HOME**（顺手修掉下一个坑）
- Docker Desktop 的 daemon socket 在 `~/.docker/run/docker.sock`，CLI 靠
  `~/.docker/config.json` 的 `currentContext=desktop-linux` 才能找到它。HOME 缺失时
  CLI 退回默认的 `/var/run/docker.sock`（macOS 上不存在），报
  「Cannot connect to the Docker daemon」—— 看着像守护进程挂了，其实是 HOME 丢了。

**白名单从「前缀匹配」改成「形状校验」**（`inspectRestartCommand()`）
- 前缀匹配会误杀真实部署里常见的 `docker compose -f /srv/x/docker-compose.yml
  restart svc`；现在只要首 token 是 docker/docker-compose/dev.sh（允许绝对路径），
  且动作是 restart 即可。
- 同时挡掉 shell 元字符（`; & | \` $ < >` 与换行）—— 这条通道以宿主用户身份跑
  shell，不能靠「前缀白名单看起来够严」兜底。
- 返回体新增 `binPath`，失败结果里也能看到用的是哪个 docker。

**测试**：新增 `test/service-control.test.mjs`（11 例）：形状白名单的接受/拒绝
（含 `docker rm -f`、`; rm -rf`、`$(id)` 等注入写法）、PATH 命中 / 绝对与相对路径 /
找不到返回 null、env 的 PATH 去重与 HOME 兜底、disabled/no-command/not-allowed 三态，
以及一条真机回归 —— **把 PATH 掏成 launchd 的最小集后仍要能执行到 docker**
（用不存在的容器名，只让 docker 报错退出，不碰真实网关）。全量 181 例：160 通过 /
0 失败 / 21 跳过。

### 「用量」Tab v4 —— 单页卡片流重构（参考 AlfredChaos/dsh-usage-panel）

读了参考实现源码（`src/client/*` 全部组件、`styles.ts`、`api.ts`、`export.ts`、
`DECISIONS.md`/`docs/P2-decisions.md`），借它的**信息架构与交互纪律**，
落到网关分桶的数据面上。参考项目的数据源是 DSH 会话日志投影（装完即有半年
历史 + 每会话明细）；我们的数据源是网关请求分桶（48 小时槽 + 30 天日槽，
从落盘那刻开始积累）—— 能借的是结构，不是面板清单。

**信息架构：2 Tab 嵌套 → 单页卡片流**
- 删掉「概览/趋势」第二层页签与全局窗口选择器（`USAGE_WINDOWS` 整体删除）。
- 一次拉 `720h`（网关保留上限），范围切换**纯前端切片**（`daySeries`）——
  原先每切一次窗口就重拉 7 个端点，现在 0 次额外 RPC（回归用例锁定）。
- 页头对齐参考实现：标题 + 四态副标题（loading/fresh/stale/fallback/error，
  `data-freshness` 属性驱动样式）+ 导出菜单 + 带 loading 文案的刷新按钮。
- 正文六卡：① KPI 4 卡（Tokens/积分消耗/请求数/可用积分，主数字 + 次级文字，
  count-up 跑在**原始数**上）② 活跃热力（卡内指标切换 + 分位色阶图例移进卡头）
  ③ 每日用量（按模型堆叠，卡内 7/14/30 范围 + 请求/Tokens/积分切换，图例即明细）
  ④ 账号排行 + ⑤ 渠道用量（两列并排，昵称/渠道标签来自账号池同源口径）
  ⑥ 模型占比 donut（中心显示**模型数**，不重复合计）。
- 两个折叠区默认收起且**惰性渲染**（`LazyFold`：展开过才挂 children）——
  隐藏容器里画 0 宽 SVG 是 `UsageChart` 时代修过的坑，收起的折叠区还会白付
  燃尽外推的重派生。

**新增能力（参考有而我们没有的）**
- **结构化 tooltip**（`usage/tooltip.js`）：fixed 定位 + 标题行 + 色点明细行 +
  右对齐等宽数值；热力格子/堆叠柱/donut 扇区共用。测试用 `mouseover/mouseout`
  （React 的 onMouseEnter 由 mouseover 合成，发 mouseenter 测出的是假阴性）。
- **SWR 缓存**（`usage/api.js`）：载荷带版本号写 localStorage，结构校验拒绝
  坏缓存；刷新失败**保留旧数据**并如实标注「显示上次成功的数据，不是最新」
  —— 修掉了旧实现把瞬时 RPC 失败渲染成「网关未提供分桶端点」的口径错误。
- **导出**（`usage/export.js`）：完整 JSON / 每日 CSV / 模型 CSV / 账号 CSV，
  防公式注入（`=+-@` 前缀转义）+ RFC 4180 + UTF-8 BOM，纯客户端构建零新端点。

**诚实性（不模仿参考实现做不到的）**
- 不做会话排行/主子代理拆分（网关无会话概念）、不做半年热力图（日槽上限 30 天，
  卡头如实标注「本地时区」）、KPI 的「会话数」换成请求数、窗口与进程两个口径
  分区展示不相加（进程口径只在折叠区并标注「重启清零」）。
- 空窗口说明「数据从落盘那刻开始积累」—— 是数据边界不是缺陷。

**顺带修复**
- `creditsBurn` 外推天数封顶：真机实测 0.002 积分/天 × 存量 10033 显示
  「还可 6019800.0 天」—— 超 3 年如实显示「>3 年」，曲线照常画（截 60 点）。
- 燃尽投影点数封顶 60（存量高/速率低时 hoursLeft 可达数万，一条 SVG path
  拖垮整页渲染，真机 e2e 1.3s → 13s）。
- React 重复 key：每日图的柱体与 x 轴标签同处一个 SVG，key 都用裸日期会撞。

**结构性拆分（修一次「反向 import 成环」的隐患）**
- 共享基元下沉：`client/ui.js`（Tag/CardHead/Fold/Unavailable/Icons/useCountUp）、
  `client/endpoints.js`（CHANNEL/ENDPOINTS）。用量段拆到 `client/usage/`
  （api/export/tooltip/cards/index），`index.js` 从 4721 行瘦身约 1500 行；
  v2 遗留的死代码（UsageHero/UsageAreaChart/UsageModelDonut/UsageShareList/
  USAGE_AXES/TREND_VIEWS/USAGE_DIMS 及配套 CSS ≈600 行）一并删除。
- 面板首轮不再代拉 getStats/getUsage（用量页自管数据）。

**测试**：166 例 160 通过 / 0 失败（21→6 跳过，真机 e2e 全跑）。用量渲染用例
全部重写为 v4 结构（KPI 4 卡、无页签残留、切片零 RPC、失败保留旧数据、
tooltip、导出防注入、reduced-motion 直接给终值、几何无横向溢出）；
新增纯函数用例 daySeries/accountShares/channelShares/kpiCards/hitRate。
无头 Chrome 390/760/1040 × 浅色 × 收起/展开态：横向溢出 0、无越界元素、
无 0 宽 SVG（截图见 `.scratch/chanhub-panel/usage-v4/`）。

### 「用量」Tab 参考 dsh-usage-panel / dsh-token-monitor 重做

读了两个参考实现的源码（`AlfredChaos/dsh-usage-panel` 的 `styles.ts`/`KpiCards`/
`Heatmap`，`zhangzheng25/dsh-token-monitor` 的 `client/bundle.js`），提取它们的
共同视觉语言，落到我们的数据面上。

**根因修复：卡片层级反了。** 两个参考都用 `bg-layer-1`（白）让卡片浮在灰页面上；
我们此前用 `bg-layer-2`（比页面更暗），卡片是「后退」的 —— 这是「差点意思」的
主要来源之一。已统一为 layer-1。

**新增/替换**：
- **数字排版**：`.dshc-num` = `tabular-nums` + 负字距（英雄 26px/700）；表格数字
  也改等宽，横排不再跳动。
- **数字入场动效**：900ms count-up。**可失败设计** —— rAF 缺失、系统开启
  「减少动态效果」、或 rAF 被节流（后台标签页/无头渲染）时都保证落到真实值；
  真机实测发现无兜底时会显示一屏 0，比没有动效更糟，故加 `setTimeout` 兜底。
- **活跃热力图**（替换原「日期×小时」网格）：GitHub contribution 布局 —— 周为列、
  周一→周日为行、顶部月份标签、左侧星期列、右下角色阶图例。**分位色阶** h0–h4
  （长尾分布下线性映射会退化成一片浅色）。混合槽按「日历日」合并（小时槽与日槽
  同属窗口分桶，按天相加合法），不再把日槽硬塞进小时网格凭空造出小时分布。
  入场为按周列延迟的淡入，`prefers-reduced-motion` 下关闭。
- **模型占比环形图**（替换原堆叠面积）：donut 按 token 占比分色，hover 放大扇区并
  弱化其余，右侧列出模型名 / token / 占比。中心显示**模型数**而非 token 合计 ——
  合计已在英雄区，同一屏摆两遍正是前一轮修掉的问题（去重用例当场抓到）。
- 视图切换默认落在「模型占比」，四个视图顺序按信息价值重排。

**保留**：v1/v2 的全部诚实性标注（窗口 vs 进程累计、降级、空态、「非承诺」、
倍率缺失 `—`）。参考实现有会话级数据（top sessions / main-subagent）与 6 个月
历史，我们只有网关分桶 —— **不虚构**这些面板，热力图上限定近 30 天。

效果：页高 1040px 1418–1503（各视图）、390px 1695–1726；四个视图 × 浅/深色 ×
390/760/1040 实测无横向溢出、0 宽 SVG。

测试 179 例 158 通过 / 0 失败。新增 5 条回归：分位色阶不塌成单档、donut 扇区数
= 模型数、卡片用 layer-1、reduced-motion 下直接给终值、去重（防 donut 再引入重复
数字）。其中「减少动态效果」那条经反向验证 —— 破坏分支后 4 条用例失败，确认非空转。


### 「用量」Tab 界面精简：说明性文字收进 tooltip

上版把口径细节全铺在页面上（口径说明段、Token 结构长注、存量口径解释、
燃尽图三行说明、归因表用法、页脚数据说明整卡），读起来像文档而不像面板。

现在：**可见文字只留数据与结论，口径细节一律挂 `title`** —— 鼠标停一下能
看全，默认不占版面。具体：

- 口径条：4 行散文 + 独立 chip 行 → 顶栏一个 `近 3 天` tag（title 内含
  落盘路径、槽粒度、账本范围、与进程累计不可混算）；模型全景 tag 显示
  `进程累计 · 3 小时 12 分`（title 含数据起点与重启清零）。
- Token 结构：删 69 字长注 → `输入 / 输出两段`（title 保留口径边界）。
- 存量卡：删「存量与消耗是两个口径…」整段；标签 `可用积分（存量 · 只算
  可消耗）` → `可用积分`（title 说明只算可消耗）；燃尽行
  「按近 72 小时速率（82.22 积分/天）≈ 还可 49.7 天」→
  「≈ 还可 49.7 天 · 82.22 积分/天」。
- 主图：图例压成 `峰值 138 请求/槽 · 红 = 失败`；删「按槽聚合，柱数 = 槽数」
  这类实现说明（聚合正确性已由测试断言折线点数保证）。
- 燃尽图：3 行 60+ 字说明 → `实线 = 回推 · 虚线 = 外推（非承诺）· 圆点 =
  预计见底`（完整口径与「实际偏乐观」的边界进 title）。
- 归因表：删用法说明整段（表头已有 `↓` 排序指示）。
- 页脚「数据说明」整卡删除。
- 双轴/热力图说明各压一行。

**保留不动**（这些是错误/降级/空态提示，不是冗余说明）：分桶端点缺失、
degraded 降级警告、空窗口引导、无小时槽说明、热力图排除日槽的说明、
「不做外推」、倍率缺失显示 `—`。

效果（同浏览器同 fixture）：说明性文本 17 → 13 条，最长说明 69 → 42 字
（且已是数据行），页面高度 1040px 下 1935 → 1735px、390px 下 2691 →
2332px。测试 169 例 148 通过 / 0 失败（4 处断言随文案更新，其中 1 处
发现 uptime 被误删并已恢复）。


### 「用量」Tab 重做：修掉口径错误，补齐总量/归因/存量/进程全景

**背景**：旧实现的用量页有三处硬伤（都有代码证据）：

1. **时序柱口径错了**：`usage.buckets` 是 (槽 × 域 × 账号 × 模型) 四维行，旧代码
   `buckets.slice(-48)` 直接把**行**当柱子渲染。3 账号 × 5 模型时同一小时被拆成 15 根柱，
   72h 窗口实际只画出最后约 3 小时 —— 柱数 ≠ 槽数，时间轴与总量对不上。
2. **`/v1/stats` 取了不用**：`stats` 传进 `UsageTab` 却全程零引用，18 个字段
   （TTFB、tok/s、缓存命中率、每请求积分、模型倍率、streaming、uptime）全部不可见。
3. **合计行漏项 + 口径打架**：只报「请求/失败/completion tokens」，漏 prompt、更漏
   **积分消耗**（`usage.total.credit` 网关一直在返回）；表格 Tokens 列却用 `total_tokens`。

**现在**（网关零改动，纯前端；不新增任何网关请求）：

- **英雄总量区**：请求（含成功/失败/成功率）│ Tokens（↑prompt / ↓completion）│
  **积分消耗 + 每请求积分** │ 平均延迟；右侧存量卡：可用积分（**只算可消耗**）+ 不可消耗单列 +
  逐渠道拆分 + 燃尽预估。
- **走势**：先按 `slot` 聚合成时间槽再画（柱数 === 槽数），面积 + 失败红色下段堆叠 +
  4 等分网格 + 十字线富 tooltip；请求 / Tokens / 积分三指标切换。
- **分析视图**（切换式，避免图墙）：双轴（柱+折线）、燃尽投影（回推实线 + 外推虚线 + 见底点）、
  模型堆叠面积、时段热力网格。
- **归因表**：按账号 / 域 / 模型，含占比条、成功率、可排序；账号维度映射昵称 + 渠道 + 域
  （旧实现只显示 `uid.slice(0,8)`）。
- **模型全景**：释放 `/v1/stats` —— 缓存命中率、TTFB、tok/s、积分/请求、上游倍率原文；
  该区不依赖分桶端点，**旧网关（缺分桶）时依然可用**。

**口径诚实性**（本版重点）：

- 窗口分桶（落盘）与进程累计（重启清零）**分区展示、各自标注**，不相加相减。
- 槽粒度混合（近 48h 小时槽 / 更早日槽）：主图给日槽区加底纹、分界虚线、区域标签；
  **热力图只用小时槽**并如实报告被排除的日槽 —— 不再把「某天的总量」画成「某个小时的量」。
- 倍率缺失显示 `—`（不显示 `x0.00`，缺失 ≠ 免费）；TTFB 无观测显示 `—`（不显示 `0 ms`）；
  无消耗时不做燃尽外推（不编天数）。
- 燃尽图的「窗口起点存量」是**回推值**（当前存量 + 窗口内消耗），非逐时实测；
  账本只覆盖经本网关的请求，旁路消耗不在其中 —— 三点都在 UI 上写明。

**测试**：新增 `test/usage-derive.test.mjs`（19 例纯函数）+ 12 例渲染用例；
回归守门用例「柱数 === 槽数」经反向验证（把聚合退回旧行为 → 7 例失败）。
全量 169 例：**148 通过 / 0 失败 / 21 跳过**（基线 117 通过，无回归）。
真机 Chrome 验证：4 视图 × 2 主题 × 3 宽度无横向溢出、无 0 宽 SVG。


## 0.1.10

### 更正：TraeWork 的远端登录只能靠「粘贴地址栏」，方案 3 已证伪

**背景**：0.1.9 尝试让 Trae 授权页把浏览器跳回面板（`<面板 origin>/dsh-chanhub/trae-callback/<nonce>`），
以为「Trae 可能接受非 loopback 回调」。真机验证失败，用户看到授权页报
「**网络错误，请刷新页面重试。**」

**根因（上游硬性限制，非我方 bug）**：Trae 授权页源码 `authorization/page.js` 里
同一正则出现两次：

```js
var T = "网络错误，请刷新页面重试。";
if(!W || !Z || !/^http:\/\/127\.0\.0\.1:(\d+)\/authorize$/.test(Z)){
  O(!1), ew("invalidUrl"), ep(3);   // ep(3) 渲染的就是 T
}
```

`Z` 即 `auth_callback_url`。**任何非 loopback 地址都会被判 `invalidUrl`**，因此
「网关不监听端口 + 回调注入」的设计不可能成立。已全部回退：

- 删掉 `callback_base` 参数与 `/dsh-chanhub/trae-callback/<nonce>` 浏览器落点路由；
- 网关回调恒为 `http://127.0.0.1:<端口>/authorize`；
- `nonce` 机制随之移除（回调地址固定，无法承载随机段）。

### 现在：粘贴即为唯一路径，且写清楚用户会看到什么

- 发起登录后弹窗**常驻粘贴框**，文案明确三点：会跳到一个打不开的地址、
  这是 Trae 的限制不是故障、地址栏里带着凭证整段复制回来即可。
- 粘贴支持完整 URL 与裸 query；`refreshToken` / `userJwt` / `authCodeInfo` 三种形态都能解析。
- **不含凭证的粘贴明确报错**，且不写入中间态 —— 用户可立刻重贴，不必重新发起
  （0.1.9 会把 state 写成 error，用户看到一句与自己操作无关的失败原因）。
- 已完成的登录**拒绝重复提交**，使后来者无法覆盖本次结果。
- 网关中间态补 15 分钟 TTL；面板轮询 360 次封顶。

### 测试

136 用例通过。新增/改写并做变异验证：

- 网关：回调地址恒满足 Trae 的硬性正则（把它改成非 loopback → 用例变红）、
  粘贴全链路、userJwt 形态、垃圾内容拒绝且不污染 state、重贴成功、
  重复提交拒绝、仅 traework 开放、必须鉴权、TTL 过期与未过期。
- 面板：弹窗只收 `(channel, realm)` 两个参数、渲染 loopback 地址与粘贴框、
  文案解释「打不开属正常」、提交走 `loginCallback` 且失败就地报错。
- 真机：`发起 → 粘贴 → 越过 pending 进入真实换 token` 全链路。


## 0.1.9

### 修复：TraeWork「添加账号」永远卡在「等待授权完成」

**症状**：面板点「＋ 添加账号 → TraeWork」，浏览器走完登录后弹窗永远停在
「等待授权完成…（每 2.5 秒自动检查）」，既不成功也不报错。

**根因**（网关侧，两层叠加）：

1. **回调地址浏览器够不到**。Trae 的凭证只从回跳 URL 回来（服务端**没有**设备流端点
   可轮询），旧实现沿用官方客户端的做法在网关进程内 `net.Listen("127.0.0.1:0")`，
   把 `http://127.0.0.1:<容器随机端口>/authorize` 交给授权页。但网关跑在容器里 ——
   容器自己的 `127.0.0.1` 在浏览器眼里什么都不是（实测：该地址容器内可达、宿主不可达；
   且 Docker 的用户态代理也转不到绑在容器 loopback 上的 socket）。
2. **没有超时**。workbuddy 有 15 分钟 TTL，traework 的中间态永不过期，
   于是「死掉的登录」只会表现为无限 pending。

**修法**：新增**面板回调**形态（`callback_base`），网关不再监听任何端口：

```
面板把 window.location.origin 交给网关
  → 回调地址 = <origin>/dsh-chanhub/trae-callback/<nonce>
  → 授权页跳回该地址（面板 host 侧的新路由接住，转交网关）
  → 复用现成的 ParseCallback 落盘 → 现有 poll 路径照常消费
```

- 不传 `callback_base` 时行为与旧版**逐字一致**（本地监听），零回归。
- 回调路由比 RPC 通道前缀更长（webserver 最长前缀优先），且有意不经 `connection`
  的 cookie 围栏 —— Trae 从外部站点跳回来时不带 DSH 的 loopback cookie。
- **`nonce` 必须匹配**：回调携带 `refreshToken`（等价账号凭证），
  不校验即可被抢注。`nonce` 只出现在已鉴权的 `start` 响应里。
- 面板解析失败时**绝不在 HTML 里回显 query**（凭证会留在浏览器侧）。
- traework 中间态补齐 15 分钟 TTL（与 workbuddy 同口径），超时明确报错。

### 新增：粘贴临时链接兜底

Trae 若拒绝把浏览器跳到非 loopback 地址，自动跳转会落在一个打不开的页面上。
弹窗因此常驻一个粘贴框：把地址栏内容贴进去提交即可完成 —— 与自动跳转走**同一个**
网关回调入口（不是另一套实现），因此两条路径的解析逻辑不会分叉。

### 面板：轮询上限与更明确的失败

- 轮询 360 次（约 15 分钟）封顶，超时提示指向「粘贴回调链接」而不是继续转。
- 网关为旧版（不认识 `callback_base`，会静默回落本地监听）时明确提示升级，
  而不是让用户干等一个永远不来的回调。

### 测试

新增 16 个用例并做变异验证（删掉 nonce 校验、删掉 TTL、丢掉 `callback_base` 透传、
在 HTML 里回显凭证 —— 四种变异各自对应的用例都会变红）：

- 网关：外部回调 start / 注入 / nonce 拒绝 / TTL 过期与未过期 / origin 校验 /
  query 形态粘贴 / workbuddy·qoder 不开放回调注入。
- 面板：host 侧回调转发与「不回显凭证」、面板级接线断言 `callbackBase` 真的进了
  RPC payload（只测弹窗组件会漏掉这段接线 —— 实测把 `callbackBase` 从 payload 删掉，
  组件级用例依然全绿）。
- 真机：对运行中的网关验证「回调地址落在面板 origin 且不含 127.0.0.1」
  与「伪造 nonce 被拒」。


## 0.1.8

### 重构：刷新即同步余额，积分只有一个来源

上一版（0.1.7）把「实时值 vs 缓存值」做成双源显示 + 单独的「同步余额」按钮。
那是**错的设计**：同一屏出现两个互相矛盾的数（4176 vs 2626），还把「刷新」拆成两件事
（观察数据 vs 余额），用户得先理解缓存语义才知道该点哪个。按反馈重做：

- **刷新 = 同步刷新**：网关新增 `POST /admin/refresh` —— 先逐号重取余额并写回池，
  再返回与 `/status` 同形的响应（多一个 `refresh` 段）。一次往返（实测 3 账号 0.5s）。
- **面板顶栏 ↻ 与「进面板自动刷新」都走它**，所以：
  - 打开渠道中心即自动刷新，积分当场就是最新的；
  - 点 ↻ 会真正更新缓存（不再是「只重取观测数据」）。
- **积分只有一个来源**：一律显示 `account.credits`。删掉 `creditsView` 的双源比对、
  卡片上的「缓存 N」角标、抽屉里的「网关缓存 N」标签、「同步余额」按钮与其
  handler/state —— 共约 90 行净减少。
- **新增 `credits_at`**（网关 `Status` 字段）+ 卡片「更新于 N 分钟前」：让「这个数多旧」
  可见，而不再靠两源对照去猜。
- **降级如实**：网关未开 `admin.enabled` 时该路由不注册，面板降级为只读 `/status`
  并在页顶说明「积分可能不是最新的」+ 给出开启方法，不静默假装刷新成功。

### 面板：账号详情抽屉默认展开明细

- **点开账号卡片即见明细**：详情抽屉里曾把外层壳与四个组全部折叠着，
  用户点开卡片只看到一个折叠条，得逐组点开才对得上「点进来看详情」的预期。
  现在默认展开**外层壳 + 健康 / 质量 / 积分**三组。
- **任务组仍保持折叠**（按 ui-design §6）：它展开是 6 项排程明细 + 一段说明，
  当初刻意压成「折叠态一行 6 色块」省高度。
- 实现走既有模式：`AccountFold` 新增 `defaultOpen`，由 `AccountDrawer` 传 `true`
  （配置 Tab 的分组默认展开用的也是这招），不把「抽屉要全展开」烧进通用组件。
- **「默认展开」≠「锁死展开」**：`Fold` 收到固定 `open: true`，React 只在值变化时
  写 DOM 属性，所以用户手动收起的组在数据刷新后保持收起（有测试把这条钉住）。

### 顺带修的四个真缺陷

- **设置里点「渠道中心」整页报 `connection: invalid server-response failure`**（严重）：
  宿主的 wire 解码器（`@deepseek-ai/dsh-client-connection` 的
  `parseConnectionResponse`）对失败信封有硬性要求 ——
  `typeof error.code === 'string' && typeof error.message === 'string' && isRecord(error.details)`。
  本插件的 `fail()` 此前写成 `...(details === undefined ? {} : { details })`，把可选的
  `details` **整个省掉**，于是任何 `{ok:false}` 信封都被解码器判为非法并抛该 TypeError，
  浏览器再把它原样显示在面板上 —— 网关、密钥、渲染全正常也照样打不开。
  改为对齐 `dsh-bridge-gateway` 的配方：`details` 恒为纯对象，保底
  `{ issues: [{ message }] }`。回归闸门见 `test/rpc-channel.test.mjs` A3b：
  用**逐字复刻的宿主解码器**喂每个失败分支，而不是只断言字段存在
  （字段断言看不出 `isRecord`，数组/字符串都算「有 details」）。

  这条报错有两个独立来源，必须一起处理才不再出现：
  1. 上述信封缺陷 —— 任何失败分支都会触发；
  2. **宿主侧插件代码不热重载** —— `dsh-base` 里 `hmr` 行的默认是
     `disabled: true`（只有 client bundle 走 HMR，`lib/` 改动仅在启动时加载）。
     于是「浏览器已拿到新 bundle（会调 `refreshStatus`）而宿主进程仍是旧代码」时，
     旧宿主回 `Unknown endpoint: refreshStatus` —— 走的正是上面那个坏信封，
     显示成同一句话。**改完 `lib/` 必须重启宿主进程**（改 `client/` 只需重新构建）。

- **手动任务全部不执行**（网关，严重）：`TryRunTask` 把 `r.Context()` 交给后台
  goroutine，而它在响应写出后立刻取消 → 点「查余额」得到
  `ok=0 skipped=3 / cancelled: context canceled`，7 类手动任务全部无效。
  上一轮修的是队列（同 bug 的另一出口），这次收口到生命周期 ctx。
  实测修复后 `ok=3`，三账号缓存 2626/363/3061 → 4176/506/3788。
- **「已锁定」措辞 + 来源标签信息丢失**：改「未解锁」（locked = 上游未开放，
  不是账号出问题）；并把先前压成一个标签的「来源」与「开放状态」拆开
  （未解锁的小程序任务此前看不到「小程序」标签）。
- **刷新按钮无可感知进行态**：此前只有 `disabled`（视觉无差异）。加图标旋转 +
  「刷新中…」+ title 变化。

### 测试基建（本轮踩到的坑）

- **e2e 首屏等待**：刷新含逐号余额同步后首屏变慢（实测 4s 级），固定 sleep 全部踩竞态。
  新增 `waitForText` 轮询 + `mountReal` 的 `html` 改为 getter（快照会在数据到达前定格）。
- **`inFlight` 请求登记表**：用例在数据到齐前收尾时，未落定的 promise 在
  `window.close()` 后 setState → node:test 记「generated asynchronous activity
  after the test ended」并判**整个文件**失败，报错内容（React 合成事件里的
  `undefined.event`）与真实原因完全无关。改为 cleanup 等所有在途请求落定（有界）。
- **修两条断言的前提依赖**：「账号间进度数值不同」「日志含 listening」都只是
  **测试前提**而非契约 —— 跑完队列后三账号进度收敛成同一个数（19/22 ×3），
  重启多次后 listening 也被推出日志缓冲窗口。改为不依赖前提的判据。

### 测试

- 网关新增 `admin_refresh_test.go`（3 例：条件注册 / 响应形状 / 方法与鉴权）。
- 插件新增 2 例（未解锁措辞与来源标签、刷新按钮进行态）。
- 全量：网关 22 包全绿；插件 123 pass / 0 fail（含真机 e2e 13/13，连跑两轮稳定）。

## 0.1.7

### 修复：刷新看似无效 + 积分不更新 + 手动任务一项都不跑

三件事同一个观察（「点刷新没反应、积分不刷新」），但根因分三层。

**① 刷新按钮没有可感知的进行态**（面板层）

`refreshing` 此前只接到 `disabled` —— 禁用态在视觉上没有差异，点下去看不出有没有生效。
实测按钮其实**工作正常**（点击发出 16 个 RPC），只是没有任何反馈。
现加：图标旋转（`.dshc-spin`）+「刷新中…」文案 + 透明度 + title 变化。

**② 手动任务从未真正执行**（网关层，严重）

`TryRunTask` 把 HTTP handler 传进来的 `r.Context()` 直接交给后台 goroutine，
而该 ctx 在响应写出后**立刻取消**。`BalanceAll` 是逐号检查 `ctx.Err()` 的那个
（优雅停机语义），于是点「查余额」得到的逐号结果是：

```
余额任务: total=3 ok=0 fail=0 skipped=3
  乙  skipped  cancelled: context canceled
  丙  skipped  cancelled: context canceled
  甲   skipped  cancelled: context canceled
```

**全部 7 类手动任务都受影响** —— 面板上的「签到 / 查余额 / 活跃地图 / 保活 / 开学季 /
夜猫子」按钮点了都等于没点。上一轮修的是队列（同一个 bug 的另一个出口），这次一并
收口到生命周期 ctx。

**③ 积分显示的是过期缓存**（数据语义层）

同一个账号，面板卡片显示 2626、抽屉里的套餐明细合计 4176 —— 两个数互相矛盾：

| 来源 | 性质 |
|---|---|
| `/status` 的 `accounts[].credits` | 网关**池内存缓存**，只在签到 / 余额任务 / 单号查余额时更新 |
| `/v1/accounts/{uid}/credits` 的 `usable_total` | **实时查上游** |

默认排程下（`balance_refresh_minutes=0` + 签到 9/21 点）缓存可陈旧数小时。
顶栏刷新只重取观测数据，**不会**更新这个缓存 —— 所以「刷新了积分也不动」。

- 新增 `creditsView(account, liveCredits)` 统一展示口径：**实时值优先**，
  同时点出缓存偏差（卡片挂「缓存 N」角标，抽屉明细挂「网关缓存 N」标签）。
- 偏差不只是显示问题：池缓存的 `credits` 正是**选号权重**（credits 比例 ×10）的输入，
  陈旧意味着选号倾斜 —— 故如实披露而不是抹平。
- 账号池工具栏新增「**同步余额**」按钮：触发网关已有的 balance 任务（逐号查上游 +
  写回 pool，与签到同口径，自动获得任务级互斥），完成后重取。工具栏同时提示
  「N 个账号缓存过期」。独立于顶栏刷新 —— 它会真实打上游，有成本，不该藏在刷新后面。

### 修复：「已锁定」措辞与信息丢失

- 措辞 **「已锁定」→「未解锁」**。`locked` 表示上游尚未对该任务开放，不是账号或面板
  出了问题 —— 前者会让人去排障。
- 修信息丢失：先前把「来源」与「开放状态」压成一个三选一标签，于是 `locked` 的
  小程序任务就看不到「它是小程序任务」了。现在最多挂两个标签（来源 + 开放状态）。
- 未解锁任务的 tooltip 说明这是上游行为、与账号状态无关。

### 测试

- 新增 `TestManualTaskSurvivesRequestContextCancel` —— 用 **balance** 做载体
  （它是唯一逐号检查 `ctx.Err()` 的任务；先用 checkin 写时**变异验证不通过**，
  因为 checkin 不检查 ctx，传被取消的 ctx 也会「成功」。载体选错等于没测）。
  已做变异验证：改回旧行为测试转红，报出的正是真机那行 `cancelled: context canceled`。
- 新增两条渲染测试：未解锁任务的措辞与来源标签、刷新按钮的进行态。
  后者用「挂住不返回的 RPC」才能观测到 in-flight 状态（直接 mount 会 await 完一轮刷新）。
- 测试同步：网关 22 包全绿；插件 29 pass / 0 fail。
- 真机验证：`balance` 从 `ok=0 skipped=3` → `ok=3`，三个账号缓存 2626/363/3061
  → 4176/506/3788，与实时上游一致。

## 0.1.6

### 账号卡片重做 + 修掉编造的运行计数

账号卡原先只有两行：昵称+状态，然后「积分大字 + 右侧一行 11px 小字」。结果是
**主体大片留白**（240–280px 宽的卡片里，信息全挤在右下一角），而 `realm`、
`credits_expiring`、`last_success` 这些已有数据根本没用上。

- **改四段式纵向结构**（`flex-direction: column`，各段等宽铺满）：
  1. 顶行：状态点 + 昵称 + 状态标签
  2. 主数值：积分 22px 独占一行（不再与元信息争宽），将过期积分另挂警示小标签
  3. 在途条：细进度条 + `在途 N/M`（满了转橙）；无在途时不渲染（空条是噪音）
  4. 底行：渠道 / 域 / 成败计数 / 最近成功 —— 从 11px 右下小字改为独立 chip 行
- 实测几何：内容纵向占比 **98%**，各段 `x=15 w=210` 等宽，无溢出。
- 字号层次：22px 主数值 / 13px 昵称 / 12px 状态 / 11px 元信息 chip。

### 修掉「编造 0 成功 / 0 失败」

卡片原先写的是 `${account.success_count ?? 0}✓/${account.err_total ?? 0}✗` ——
而这两个字段在 `/status` 里**根本不存在**，于是恒定显示 `0✓/0✗`。
把一个「网关没透出的字段」显示成「确实 0 次成功」，是编造数据。

根因在网关侧：`internal/pool/entry.go` 的 API 层结构体对这两个字段用了
`json:",omitempty"`，值为 0 时 key 整个不出现。而同一文件里 `consecutive_fails` /
`session_dead_fails` / `credits_expiring` 早已按「零值也透出」口径写成无 omitempty，
注释还明确写着「零值缺失会让人误以为"没记录"，实际是零值被省略」——
这两个是遗漏（持久化层的 `ErrTotal` 也早已去掉 omitempty，只有 API 层漏了）。

- **网关**：`success_count` / `err_total` 去掉 `omitempty`，零值也透出。
- **面板**：字段缺失时不再兜 0，改为明确提示「成败计数不可用（该网关版本未透出）」
  —— 兼容未升级的旧网关，两种情况都不编造。

### 测试

- 新增 `渲染：账号卡片信息分区呈现，不编造缺失的运行计数`：
  一个账号给真实计数（7/2）、另一个**显式 delete 两个字段**（模拟旧网关 omitempty），
  断言有计数时显示真值、缺失时不得出现 `0 成功`。
  已做**变异验证**：改回 `?? 0` 后该测试转红。
- 测试同步：121 pass / 0 fail；网关侧 22 包全绿。

## 0.1.5

### 修复：逐账号明细行的列错位

开学季与成长任务两组明细行原先用 flex 自然排版 —— **列位置由内容决定**，
而每行的列数并不固定，于是缺一个标签整行后续列就左移一格：

| 卡片 | 实测 | 后果 |
|---|---|---|
| 开学季 | 5 行里 4 行是 5 个子元素、1 行 4 个（`desktop_chat_1_time` 是 `single`，没有「每日」标签） | 该行的进度与状态标签整体左移一格 |
| 成长任务 | 22 行出现 **3 / 4 / 5** 个子元素三种形态（无进度、无来源标签、无动作各不相同） | 进度、来源、状态、动作四列逐行参差 |

- 两组行改为 **CSS 网格固定列**：开学季 `20px / 1fr / 54px / 64px / max-content`，
  成长任务 `3px / 1fr / 54px / 74px / max-content / 74px`。缺省内容渲染空占位，
  列不再随内容漂移。
- 修掉两个容器导致的整列偏移：折叠区 `.dshc-body` 与常驻「待做」组的水平起点
  差 12px；折叠卡 `.dshc-fold` 自带 1px 边框，其内容比卡片直下的兄弟再右移 1px。
  给常驻组同一组 padding + transparent 边框后，两组网格列严格同一 x。
- 窄屏（≤560px）隐藏「来源」列，避免五/六列挤在一起。

### 关于 `desktop_chat_1_time` 显示 `0/1` 却标「已领取」

这是**上游数据的真实口径**，不是面板算错：网关 `/v1/accounts/{uid}/school-tasks`
对该码透传的就是 `status=claimed` 且 `progress=0 / target_count=1`（三个账号实测一致）。
面板原先的无障碍问题是它同时渲染「✓ 勾」与「0/1」，两个信号看起来自相矛盾。

- 保持如实显示，但给这种行加**虚线底纹 + tooltip**：「上游口径：该任务已领取，
  但进度计数为 0/1」—— 既不改写数据，也不让它看起来像面板的 bug。

### 测试

- 新增 `渲染：逐账号明细行用固定网格列`：断言开学季与成长任务**每组内各行的
  子元素数一致**（缺省会少一列正是原缺陷），且 `desktop_chat_1_time` 这类行
  仍渲染进度列、来源列为空占位。已做**变异验证**：改回条件渲染后该测试转红
  （实测 `[5,4,5]`）。
- 另用无头 Chrome 量了真实布局坐标：修复后 27 行的每一列 x/宽完全一致。
- 测试同步：120 pass / 0 fail。

## 0.1.4

### 修复：任务 Tab 的开学季/成长任务卡不能切账号

两张卡原先固定显示**账号池里第一个有数据的账号**，并在标题右侧标注
「第 1 个账号 / 共 3 个」—— 其余账号的进度根本看不到，而数据其实早就
全量拉过了（`accounts.map(...)` 逐号请求后存进 `growthByUid` / `schoolByUid`）。
纯显示层缺陷。

同时发现一个更严重的**写操作错号**缺陷：

> `onGrowthWrite`（点亮 / 领取 / 全部领取）取的是 `firstGrowthAccountUid(growthByUid)`
> —— 恒为「第一个有数据的账号」。所以切到第 3 个账号后点「点亮」，
> 改的是**第 1 个账号**的进度。既有测试没发现，因为 fixture 对每个 uid
> 返回完全相同的数据（`uid: payload?.uid ?? 'uid-1'`），无从区分。

- **新增账号选择器**（`AccountPicker`）：两张卡各自独立记住选中的账号
  （成长与开学季的进度本就无关）。只在多账号时渲染；每个按钮带状态点
  —— 绿=有数据、灰=无数据、红=查询失败，不必逐个点开就知道哪个号值得看。
- **写操作跟选中账号走**：`onGrowthWrite` 改用当前卡片的有效 uid。
- **选中失效兜底**：刷新后账号池变化（账号被移除）时，失效的 uid 回落到默认账号，
  不显示空白（`useSelectedUid`）。
- 删除三个只服务旧行为的函数（`growthForAccount` / `schoolForAccount` /
  `firstGrowthAccountUid`），统一为 `defaultAccountUid` + `useSelectedUid`。

### 测试

- 新增 `渲染：成长/开学季卡可切账号，且写操作发往选中的 uid`：
  fixture 让**每个 uid 返回不同数值**（uid-1 → 1/5、uid-2 → 2/5），
  从而能真正断言「渲染的是哪个账号」与「写操作发给谁」。
  已做**变异验证**：把 `onGrowthWrite` 改回旧行为，该测试确实转红。
- 新增真机 e2e：逐个账号点过去，断言数值随账号变化（真实 3 个号实测 16/17/13），
  且选中态跟随 —— 只断言「有选择器」是不够的，必须证明切了真的变。
- 测试同步：119 pass / 0 fail。

## 0.1.3

### 任务 Tab 重做：去噪音、加设计感

原先这一页有 5 张卡片、2 张表格、5 处长段说明文字，同一批 7 个任务被列两遍
（7 个按钮 + 7 行 × 6 列），状态与触发入口分离 —— 读一眼要跨区块对照。

- **任务磁贴取代「操作台 + 执行历史」**：7 个任务各一格，点即触发。
  一格里同时给出图标 / 名称 / 状态点 / 次要信息（已执行显示「上次执行 · 耗时」，
  未执行显示计划时刻），原来那张 6 列表格整张删除。
- **删除所有说明性散文**：
  - `INTUITION_FACTS` 三段（批量独立性 / 定时覆盖 / 开学季构成）—— 前两段是
    操作说明、第三段是结构说明，都不该常驻占版面；
  - 「每日任务明日 00:00 重置」「无进度对象通常是不可代做的真实行为」
    「脚本整体执行后刷新可见逐项变化」+ 两处上游 `note` 回显。
- **事实② 改用汇总 chip 保留**：`derive.js` 明确把「24 个成长码里只有 2 个有定时
  覆盖」标为**正确性要求**（逐行看不到「缺席」，必须有一处汇总）。故压成
  `定时覆盖 2/24` 一个 chip，详细说明移进 title —— 信息不丢，版面不占。
- **签到卡**：摘要标签常驻（成功/已签过/失败/跳过 + 总数），逐账号表格折起；
  失败与跳过的号直接列在摘要下（那才是要看的）。原先 4 列表格常驻。
- **开学季卡**：`已领 4/5` 标签改为进度条；`in_period=true` 不再挂正向标签
  （进行中是常态），只在 `false` 时警示「过期快照」；每行删掉 `task_code`
  列（移进 title）与冗余的「每日」/「人工项」并行标签。
- **成长任务卡**：四个分组精简为「待做（常驻）+ 已完成/已领取（折起）+
  无进度数据（折起）」；每行最多 4 个标签降为 1 个来源标签（已锁定 / 定时 x /
  小程序三选一）；新增进度条与「完成 N/M」。

净结果（同一脚本渲染真机数据前后对比）：**表格 2 → 1**、**说明性正文块 5 → 0**，
任务触发与状态由「7 按钮 + 7 行 × 6 列」收进 7 个磁贴。`derive.js` 清掉 3 个
已无消费者的导出（`INTUITION_FACTS` / `codeBadges` / `SCHOOL_SUBTASKS`）。

> 注：这几个函数的**行数并未减少**（TasksTab 163→139，其余三卡因新增进度条、
> 折叠结构与 `CardHead` 略增，合计 +12 行）。本次目标是版面与信息密度，
> 不是代码行数 —— 把长表格拆成组件反而会略增行数。

### 技术面

- `client/index.js`：新增 `TaskTile`（磁贴）与 `CardHead`（统一卡片标题行+
  右侧动作）两个组件；`TasksTab` / `SchoolTasksCard` / `GrowthTasksCard` /
  `CheckinOutcomesCard` 重写。
- `client/theme.js`：新增 `.dshc-taskgrid` / `.dshc-tasktile`* / `.dshc-cardhead`。
- 测试同步：117 pass / 0 fail。新增 1 例（`in_period=false` 的过期快照警示）。
  多处断言随结构改名更新（`任务操作台`+`执行历史` → `dshc-tasktile`；
  `成长任务进度` → `成长任务`；`定时→x` → `定时 x`），**行为契约未放松** ——
  仍逐一断言 7 个任务名、按钮 disabled 语义、真实任务码、标签语义。

## 0.1.2

### 添加账号（补齐「能移除却不能新增」的功能缺口）

账号池此前只有「移除账号」，没有新增入口 —— 加号必须回到宿主命令行
（`chanhub/login.sh` + 重启容器），而 `login.sh` 还依赖 host 侧 Go 工具链。
本次把网关的 OAuth 设备授权接到面板里，形成闭环。

- **面板入口**：**Tab 栏最右端**新增「**＋ 添加账号**」按钮（与「账号池 … 配置」
  同一行；连接状态在顶栏，该位此前空置）→ 弹窗选渠道
  （WorkBuddy / TraeWork / QoderWork）+ 域（国内版 / 国际版）→ 取授权链接
  （自动新开标签页，链接同时可见可复制给其他浏览器）→ 浏览器完成登录 →
  面板每 2.5 秒轮询 → 成功后展示 uid / 昵称 / 域 / 积分。
- **免重启**：凭证落盘后由网关 `pool.Add` 热加载进池并顺带签到、查余额回填，
  不需要重启容器，也不需要 host 侧 Go 工具链。
- **入口按网关能力渲染**（不给出必然失败的按钮）：`/panel/api/channels` 的
  `login_channels` 不含目标渠道时隐藏入口；已进入则明确提示「该网关版本不支持…请升级」。
- **两段式契约**：`loginStart` → `loginPoll` 转发到网关 `POST /panel/api/login/start`
  与 `GET /panel/api/login/poll`；会话态在网关侧（`data/login-state-*.json`，15 分钟 TTL），
  面板不持有登录会话，插件重启不打断在途登录。

### 技术面

- `lib/index.js`：新增 `loginStart` / `loginPoll` / `getChannels` 三个 RPC 端点。
- `lib/chanhub-client.js`：新增 `loginStart` / `loginPoll` / `channels`；
  能力探测加 `features.loginApi` + `probe.loginChannels` / `probe.loginRealms`
  —— 必须读 `login_channels` 而不能只探路由存在性：旧的 chanhub 网关同样注册
  `/panel/api/channels`，却对 `workbuddy` 回 400（面板会给出一个必然失败的按钮）。
- `client/add-account.js`（新）：弹窗组件，三段状态机（idle → awaiting → done/error）
  + poll 世代号（切渠道/重发起丢弃在途结果）+ 关闭时清定时器（零泄漏）。
- `client/theme.js`：新增 `.dshc-dialog` / `.dshc-choice` / `.dshc-spinner` /
  `.dshc-tabadd`（`position: sticky; right: 0` —— `.dshc-tabs` 是横向滚动容器，
  常驻入口不该随 Tab 滚出视野）。同时把恒为空串的 `statusText` 改条件渲染，
  否则它的 `paddingLeft` 会在按钮左侧留下 12px 死空隙。
- 测试同步：116 pass / 0 fail（新增 `test/add-account.test.mjs` 15 例 +
  真机 e2e 4 例）。真机 e2e 只走到「拿到授权 URL」为止 —— 完成一次 OAuth
  需要人在浏览器里点，不适合自动测试；渠道列表、realm 切换、pending 轮询、
  URL 域绑定、入口渲染均已覆盖。

> 配套网关改动（chanhub 仓库）：`internal/routeapi/login_workbuddy.go` 新增
> `channel=workbuddy` 分支（此前只有 traework/qoder），并修掉 `routeapi.writeJSON`
> 丢弃状态码的缺陷（所有 401/400/502 实际都返回 HTTP 200）。

## 0.1.1

### UI 重设计 v2

按用户反馈的 8 项改进，全部落地：

- **侧边栏更名**：`chanhub` → **「渠道中心」**（纯显示名，loaderId/坐标不变）。
- **顶栏一行化**：删掉三行品牌卡，改为单行药丸条 —— 图标 + 「渠道中心」 +
  `● 已连接 host:port` + API_KEY 药丸 + 刷新按钮。API_KEY 默认脱敏
  （`sk-••••421`），👁 点开明文、再点隐藏，药丸点击复制（`execCommand` 回退）。
  新增宿主端点 `revealApiKey`（走已认证 RPC 通道，明文不落盘、不写日志）。
- **自动刷新默认关闭**：移除 8s 轮询；进面板刷新一次，其余手动。
- **账号池 Tab**：「总账号」→「账号总数」（点击展开渠道分布）；总积分大字块
  删除，改为 **WB / Trae / Qoder 三张渠道积分卡**（无号渠道置灰占位）；
  账号区新增 **卡片/列表双视图**（默认卡片：昵称+状态+积分+在途+成败比，
  点卡片右侧滑出详情抽屉承载原四组折叠）；批量动作条删除（统一去任务 Tab）。
- **任务 Tab**：批量任务卡 + 任务中心卡合并为**任务操作台**（7 个触发按钮一排，
  运行中呼吸发光；扫描待办/执行队列+进度条内联）；任务状态表 + 签到逐账号卡
  合并为**执行历史**；删除底部「按账号查看」死折叠；重复的独立性警示删除。
- **用量 Tab**：时序柱改渐变柱；`/v1/stats` 12 列大表删除，三维表格改为
  **维度切换单表**（列精简为 请求/失败/Tokens/扣费/平均延迟，prompt/completion
  进 tooltip）。
- **配置 Tab**：一键重启**置顶**（服务操作卡）；53 项改**两列网格**，行内只留
  label+控件+（危险/还原），path 与默认值进 tooltip；`api_key` 标注改为热生效
  （`restart: false`）。
- **时长中文化**：`formatDuration` 输出 `1 天 3 小时` / `2 分 5 秒`，
  不再使用 `1d 3h` 缩写；任务耗时、冷却剩余同步。
- **去重**：账号池批量动作条、任务 Tab 底部按账号折叠、重复警示、重复的
  模型统计表全部移除 —— 每份数据只有一个"家"。

### 技术面

- `lib/index.js`：新增 `revealApiKey` RPC（复用 `resolveConfig().apiKey`，
  与网关调用同源，保证展示的就是实际生效的 key）。
- `lib/config-spec.js`：`api_key.restart` 修正为 `false`（网关端点热生效）。
- `client/theme.js`：新增药丸条/KPI/渠道卡/视图切换/账号卡/呼吸发光/进度条/
  渐变柱/两列网格/抽屉样式（全部 `--dsw-alias-*` 令牌，亮暗主题不破）。
- 测试同步：83 pass / 0 fail。

## 0.1.0

### 初版骨架

- `package.json` / `dsh-plugin.naming.json` 遵循 `plugin-write` 命名规范（坐标 `lament-z/chanhub`）。
- 宿主侧 `lib/index.js`：单一 cordis row，namespaced RPC 通道 `/dsh-chanhub`。
- 客户端 `client/index.js`：经 `ctx.slots.inject('settings.section', …)` 在设置侧边栏注册「chanhub」项。
- 视觉令牌与卡片结构对齐 `dsh-bridge-gateway`，保证页面设计一致。

### 任务中心 / 单码点亮 / 券码（panel 对照补齐）

与 panel 分支功能面对照后的全面补齐（execution-report §8）：

- **单码点亮放开**：成长任务进度卡每行按状态出「点亮」（accept）/「领取」
  （claim，幂等）按钮；「全部领取」走 claim-claimable（只碰 completed，
  不自动 accept —— 是否点亮由用户逐码决定）。admin 探测不可用时整体隐藏。
- **任务中心卡**（任务 Tab 顶部）：「扫描待办」（只读，跨账号列出未完成且
  可自动化的任务码 + 抽奖余额）→「执行队列」（账号内串行、账号间并发 ≤4、
  逐项状态表 + 进度轮询，动作后自动领奖）。
- **开学季券码**：「🎟 我的券码」逐账号列出抽中的第三方券（奖品/券码/有效期，
  券码可复制核销）。
- **单号移除**：账号面板红色「移除账号（删除凭证）」按钮 + 二次确认；
  网关侧出池并删除 auths 凭证文件。
- 网关配套（chanhub 仓）：桌面/小程序行为指纹协议移植（17 码纯 API 动作链）、
  任务中心调度（ScanAll/StartQueue/QueueStatus）、School 写链、
  周期余额刷新（schedule.balance_refresh_minutes，可热改）、
  `/status` 增 version/uptime_sec。

### 批量动作 / 排程区块 / 配置热生效（audit 收尾）

- **批量动作条接真实端点**（账号池 Tab 置顶）：全量签到 / 查余额 / token 保活 /
  猫猫旅行 / 活跃上报 —— 全部走网关 `POST /admin/tasks/{name}`（此前是 disabled
  空壳占位）。运行中标记 + 上次执行时间 tooltip，逐号结果在「任务」Tab 查看。
- **账号面板「任务」组排程区块**（两级递进）：折叠态一行 6 色块（启用/窗口内/
  窗口外，绝不编造执行状态），展开 6 项明细（计划时刻 + 时间窗标签）。
  摘要从「网关未提供执行状态」改为真实计数（N/6 启用 · 24 个成长码）。
- **配置保存优先走网关 `POST /admin/config`**：可热改字段（pool.* / schedule.* /
  prompt.mode / cooldown.soft_rate / features.sanitize_* / api_key）就地生效，
  响应里 hot_applied 与 restart_required 分流呈现；网关端点不可用时自动降级
  文件直写（两路形状统一）。api_key 变更带失联专项警示。
- **C 类持久化计数透出**：账号「质量」组新增 连续12153 / 退避指数，
  「积分」组新增 快过期积分（`/status` 新字段 `session_dead_fails` /
  `retry_count` / `credits_expiring`）。
- **任务清单加 `balance`**（第七类）：独立查余额不签到；改 `expiring_soon`
  窗口后可立即重算快过期分桶。
- 修复：`serviceControl` 的 cwd 死分支（`cond ? undefined : undefined`）——
  命令在宿主当前目录执行（含注释说明为何不设 cwd），签名相应收敛。
- 主题补 `≤900px` 断点（spec §6 要求）：总积分行收窄间距、渠道块压缩内边距。

### 面板实现（本次）

**致命缺陷修复**（原骨架下设置页 chanhub 面板完全不可用）：

- `lib/rpc-channel.js`：新增 RPC 通道适配层。原实现在 `lib/index.js` 里对
  `node:http` 的 `IncomingMessage` 调 `req.json?.()` —— 该方法不存在，可选链恒短路，
  请求体永远是 `{}`；且 handler 返回 `Response.json(...)` 被 `WebServer` 丢弃
  （其契约是「handler 拥有完整响应生命周期」）。现按 `dsh-bridge-gateway` 的配方实现
  认证 → `IncomingMessage`→`Request` → 回写 status/headers/body，并补齐 400/404/413/415 分支。
- `.gitignore` 移除 `client/client.js`：它是构建产物却又被 `package.json.files` 收录，
  两者冲突会让 `pacote` 打包时跳过该文件（tarball 缺 bundle）。
- `devDependencies` 补 `esbuild`：此前靠软链才能构建，干净 clone 后 `prepack` 必失败。
- 移除未使用的 `dependencies.@deepseek-ai/schemastery`（全仓零 import）。

**宿主数据层**：

- `lib/chanhub-client.js`：网关 HTTP 客户端（超时、错误码映射、`Bearer` 鉴权）。
  版本/能力探测缓存 60s，并用「错误方法打一次」区分 404（未注册）与 405（已注册），
  据此实事求是地渲染区块，而不是把「端点不存在」显示成「加载失败」。
- `lib/gateway-config.js`：直接读写网关 `config.json`（网关没有配置写端点）。
  原子写（tmp + rename）、只改 patch 涉及的路径（保留未知字段）、
  并在写入前拦截 `admin.enabled=true` 且 `api_key` 为空 —— 那会让网关拒绝启动。
- `lib/config-spec.js`：53 项配置规格表，宿主校验与前端表单共用同一份定义。
- `lib/auths.js`：只读盘点网关凭证文件。**渠道判定的唯一来源** ——
  `pool.Status` 没有 `channel` 字段，只能从 `auths/*.json` 的 `channel`/`domain` 推断
  （规则与后端 `auth.ResolveChannel` 一致）。绝不回传 access/refresh token。
- 10 个 RPC 端点（`getStatus` / `getModels` / `getStats` / `probe` / `getConfig` /
  `saveConfig` / `getAccounts` / `accountDisable` / `accountEnable` / `accountRevive` /
  `serviceControl`），API key 只在宿主持有。

**面板**：

- 5 Tab 结构（账号池 / 任务 / 用量 / 日志 / 配置），复刻 `dsh-bridge-gateway` 的 TabBar。
- 账号池：概览五联、按域可用性条、总积分与渠道竖排分列（`center` 对齐，
  不可消耗积分单列不并入总数）、渠道筛选、账号折叠面板四组（健康 / 质量 / 积分 / 任务）。
- 账号状态按优先级判定，**叠加态（手动停用 + 系统禁用）同时给出两个按钮** ——
  后端两位独立清除，合并会误导用户以为一次点击即回池。
- 任务 Tab：呈现排程**配置**与 24 个成长码目录，并如实呈现三个反直觉事实。
- 配置 Tab：53 项分组折叠 + 时长即时校验（对齐 `time.ParseDuration`）+
  危险语义标注（四个「0」的不同含义）+ 统一「需重启」提示 + 服务控制（默认关闭、命令白名单）。
- 折叠组件修掉三个实测坑：`<details>` 内显式 `display` 会覆盖折叠隐藏；
  `<summary>` 内真 `<button>` 会连带触发展开；竖排块与单行文字不能用 `baseline` 对齐。

### 网关侧配套端点（本版一并实现）

原先判为「网关未提供」的四块能力经复核**并非能力缺失，而是 core 已实现、只差
HTTP 接线**（`coverage.md` §2.1.1 的 A 类）。已在 `plugins/chanhub` 补齐：

- `POST /admin/tasks/{name}` + `GET /admin/tasks/status` —— 六类任务手动触发与状态，
  含**签到的逐账号结构化结果**（uid / 状态 / 签到后余额 / 原因）。
  任务级互斥锁由定时排程与手动触发共用；panic 统一 recover（避免点一下按钮就挂网关）。
- `GET /v1/accounts/{uid}/credits` —— 逐套餐积分构成（总量 / 已用 / 剩余 / 有效期 / 可否消耗），
  可消耗与不可消耗分开统计（Trae 的 ep=1 专用池不计入可用余额）。
- `GET /v1/stats/buckets` —— 用量分桶（槽 × 域 × 账号 × 模型），小时槽 48h + 日槽 30 天，
  超容量闸降级为「槽 × 域」两维（不丢弃观测），落盘 `data/usage.json`。
  `/v1/stats` 响应逐字段不变。
- `GET /v1/logs` —— 运行日志（2000 行环形缓冲 + 频道分类），默认关闭（`logs.enabled`）。
  经 `log.SetOutput` 一处接管 196 个既有调用点，一行未改。

- `GET /v1/accounts/{uid}/growth-tasks` —— **成长任务逐码进度**（当前/目标/状态/中文标题/奖励）。
  网关直查上游任务列表并合并两个下发口径（默认 + 小程序限定），mp 限定任务带 `from_mp` 标记。
  面板按「进行中未满 → 进度已满 → 无进度数据 → 已完成折叠」分组渲染。

- `GET /v1/accounts/{uid}/school-tasks` —— **开学季 5 个子任务的真实状态**。
  网关直查上游小程序域任务列表；带 `in_period` 活动期标志（false 时面板显示
  「活动未开始/已结束」而不是渲染过期快照）、recurring 任务的 `next_unlock_at`
  （每日重置时刻）、人工项（学生认证）标注。

### 仍不显示的部分（如实降级）

- **账号渠道 `channel`** —— `pool.Status` 无该字段；面板从 `auths/*.json` 推断
  （需插件宿主与网关同机）。这一项渲染明确的「网关未提供」占位并列出所需端点，
  不使用推断值填充。

**测试**（91 项，全部通过；含接真实运行中网关的端到端 UI 测试）：

- `test/rpc-channel.test.mjs`：真实 `node:http` 请求/响应对象驱动真实 handler，
  覆盖 wire 契约、认证失败、方法不符、体超限、上游超时；并对本机真实网关做端到端验证。
- `test/client-render.test.mjs`：把**打包产物**挂进 `__ModuleLoader__` 垫片，
  用真实 React + jsdom 挂载，断言真实 DOM（含 effect 后的数据渲染、渠道筛选、二次确认）。
- `test/config-and-auths.test.mjs`：配置校验、原子写、fail-fast 拦截、只读降级、凭证解析。
- `test/plugin.test.mjs`：静态装载契约（构建链、files/gitignore 一致性、命名声明无幽灵项）。

# Changelog

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

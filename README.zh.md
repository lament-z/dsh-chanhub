# dsh-chanhub

简体中文 | [English](./README.md)

把 [chanhub](https://github.com/lament-z/chanhub)（WorkBuddy2API 上游网关）接进 **DeepSeek Harness（DSH）** 的 Web 界面：侧边栏快捷入口用来看账号池与用量，**设置 → 渠道中心**用来看和改。插件本身不是网关 —— 它通过宿主 RPC 读网关的真实端点，并把网关 `config.json` 的配置面映射成表单。

> **分工**：网关（Go，默认 `:7866`）负责账号池、渠道登录、定时任务、模型目录与 `/v1/*` OpenAI 兼容面；本插件是它的 DSH 客户端。面板按网关**实际提供的能力**渲染 —— 启动时做一次版本/能力探测，缺的路由与功能如实隐藏并说明，不假装可用。

## 功能

7 个 Tab（`client/index.js:122`），数据全部来自网关真实端点：

| Tab | 数据来源 | 能做什么 |
|---|---|---|
| **账号池** | `/status`、`/panel/api/*`、逐号积分端点 | 五联计数 + 分域（realm）可用性条 + 总积分 + 渠道竖排 + 「赚得积分」（累计获得，覆盖度如实标注）；渠道筛选、卡片/列表双视图；账号详情抽屉（健康 / 质量 / 积分 / 排程四组、逐套餐积分、token 用量、模型成本、软限流提示）；停用（带原因）/ 启用 / 复活 / 移除，动作均二次确认 |
| **任务** | `/admin/tasks/*` | 7 类任务一键触发（签到 / 查余额 / 活跃地图 / 猫猫旅行 / token 保活 / 开学季 / 夜猫子）；签到逐号结构化结果；成长任务逐码进度与 accept / claim；开学季子任务与券码；**任务中心**：全账号扫描 → 队列执行（账号内串行、账号间并发 2）→ 5s 轮询进度 |
| **用量** | `/v1/stats/buckets`（窗口分桶） | KPI 4 卡、活跃热力图、每日按模型堆叠、账号排行、渠道用量、消费者用量；**按消费者 key 收窄**；燃尽与进程口径两个折叠区；CSV / JSON 导出；localStorage SWR 缓存 + 四态（loading / fresh / stale / fallback / error） |
| **模型** | `/admin/models`（缺则回落 `/v1/models`） | 能力目录三态判定（confirmed / borrowed / conflict / alias / missing）与来源等级（L1 原厂 / L2 云托管 / L3 转售）；搜索、快捷筛选 chips、按渠道分组、吸顶表头；应用补丁、补齐配置字段、**实测未定项**（自绘 PNG 的视觉探针）、沉淀确认项、刷新目录、回滚、清记录 |
| **接入方** | `/admin/keys` | 多消费者 API Key 增删改查与轮换；集合三态语义（`["*"]` 全量 / `[]` 空集（危险）/ N 条规则）；明文只在创建/轮换后出现一次（阻塞式确认）；观测面开关；「按规则推算」的预览 |
| **日志** | `/v1/logs` | 按频道（all / chat / task / sys）筛选、500 条视图、清空；宿主日志段 |
| **配置** | 网关 `config.json` | 53 项配置 / 11 组；逐字段校验 + 「↻ 需重启」角标；保存结果区分 `applied` / `hot_applied` / `restart_required`；网关重启（命令白名单，默认关闭）；「界面」组里的侧边栏入口开关 |

> 「接入方」Tab 只在网关提供 `/admin/keys` 时出现（`client/index.js:3272`）。

**顶栏**（所有 Tab 共有）：连接状态、API_KEY 药丸（点击回传明文，不落日志）、「保持唤醒」开关（开启后 20s 轮询，关闭需二次确认）、刷新。

### 添加账号（面板内闭环）

Tab 栏最右端有「**＋ 添加账号**」，走网关的 OAuth 登录，面板每 2.5s 轮询（上限 15 分钟），成功后账号**无需重启网关**即进池：

| 渠道 | 凭证怎么回来 | 远端可用 |
|---|---|---|
| WorkBuddy | 网关轮询上游设备流端点 | ✅ 只要网关能出网 |
| QoderWork | 网关轮询 `deviceToken/poll` | ✅ 同上 |
| TraeWork | 授权页把凭证写进**回跳 URL**，且回调地址被上游硬校验为 `http://127.0.0.1:<port>/authorize` | ✅ 但**必须粘贴**：登录后浏览器会跳到一个打不开的地址（Trae 的限制），把地址栏整段复制回面板即可 |

入口按**网关实际能力**渲染：网关没有 `/panel/api/*`、或 `login_channels` 不含目标渠道时，入口如实隐藏并说明「该网关版本不支持，请升级」。

## 侧边栏快捷入口

侧边栏底部「渠道账号」入口（与「设置」同区、在其上方），两种形态：

- **展开态**：独占一行，卡片显示健康色条、健康环、渠道分布堆叠条与计数动效，摘要如「渠道账号 5/5 · 1.02W」；
- **收起态（rail）**：只画 36×36 图标，规格与宿主其它入口一致。

右侧还有「打开渠道中心」按钮，弹出 `CenterModal`（portal 到 body，桌面最大 1040×920，移动端整屏 sheet，Esc / 遮罩关闭并锁 body 滚动）。**弹窗内渲染的就是设置里那个「渠道中心」面板**（同一组件、同一份数据源），避免两处数字打架。popover 里是可用积分、健康环、近 24h 滚动窗口、渠道分布，以及逐账号紧凑卡（渠道色条 / 昵称 / 状态胶囊含在途 n/limit / 余额相对条 / 24h sparkline / 到期 / 活跃徽标）。

自动路径只打只读端点（`/status` 60s），**只有点「刷新」才真打一次上游**；网关不可达时如实显示「不可达 + 地址」，不显示 0。宿主没注入面板时，图标按钮与底栏按钮**如实不渲染**，不留死按钮。

## 与网关的通信

- **通道**：插件在自身 `webServer` 上注册 prefix 路由 `/dsh-chanhub`（`lib/rpc-channel.js`），浏览器侧统一走 `ctx.connection.rpc.call('/dsh-chanhub', endpoint, payload, signal)`。DSH 0.1.5 起第三方拿不到 `connection.rpc.handle`，因此走 prefix 路由，wire 格式不变。
- **鉴权**：浏览器 → 宿主由 `connection` 的请求门禁把关；宿主 → 网关用 `Authorization: Bearer <api_key>`。
- **api_key 三层取值**：`ctx.credentials` 解析 `apiKeyEnv`（默认 `WB2API_API_KEY`）→ 同名环境变量 → settings 里的 `apiKey`。浏览器**不直连**网关（网关无 CORS 头、要求 Bearer、bundle 是明文产物）。
- **能力探测**：启动探一次网关版本与特性（stats / models / adminModels / adminKeys / admin / usageBuckets / logs / credits / growthTasks / schoolTasks / tasks / loginApi），面板据此决定显示什么。网关身份只认 `chanhub2api`，旧名 `workbuddy2api` 一律拒绝（不做双名兼容）。
- **降级**：旧网关缺路由时按 `isMissingRoute`（404 + `upstream-error` / `not_found`）安全回落；`refreshStatus` 失败时回落 `/status` 并显式提示「积分可能不是最新」；失败信封统一 `{ok:false,error:{code,message,details}}`，`details` 保底带 `issues:[]`（否则宿主 wire 解码器会让整块面板打不开）。
- **超时**：常规 15s，探活 4s，版本探测缓存 60s。

## 配置项

settings 命名空间 `dsh-chanhub`，共 10 项（`lib/index.js:380`）：

| 字段 | 默认 | 说明 |
|---|---|---|
| `baseURL` | `http://127.0.0.1:7866` | 网关地址 |
| `apiKeyEnv` | `WB2API_API_KEY` | 凭证引用（经 `ctx.credentials` 解析） |
| `apiKey` | 空 | 明文兜底，schema 标 `role: 'secret'` |
| `gatewayConfigPath` | 空 | 宿主上网关 `config.json` 的绝对路径（读写网关配置用） |
| `restartCommand` | 空 | 网关重启命令（白名单：`docker restart` / `docker compose … restart` / `docker-compose restart` / `./dev.sh restart`） |
| `allowServiceControl` | `false` | 必须显式开启才允许执行重启 |
| `sidebarEntry` | `true` | 侧边栏入口开关（远程页降级为 localStorage） |
| `modelPullSnapshot` | 空 | 模型拉取记录全量快照 |
| `modelSyncBackup` | 空 | 「以网关为准覆盖 DSH 配置」前的自动备份 |
| `modelCapabilities` | 空 | 能力基线 JSON |

环境变量旁路：`DSH_CHANHUB_BASE_URL`、`DSH_CHANHUB_CATALOG_CACHE`、`DSH_CHANHUB_KEEPAWAKE_STATE`。

## 前置条件

- DSH Web profile，宿主 **0.1.7-rc.2 实测通过**（0.1.5 线同样兼容）。
- 一个可访问的 chanhub 网关（默认 `http://127.0.0.1:7866`），且网关 `api_key` 与本插件配置一致。
- Node `^22.19.0 || >=24`。

## 安装

```sh
# 从 GitHub 安装（推荐）
dsh plugin --profile web add github:lament-z/dsh-chanhub

# 从本地 clone / 工作副本安装
dsh plugin --profile web add link:<本目录>
```

装完重启 `dsh web` 并刷新页面：侧边栏底部会出现「渠道账号」，设置里会出现「渠道中心」。

## 开发

```sh
npm run build:client   # esbuild 打包 client/index.js → client/client.js（CJS + __ModuleLoader__ 包装）
npm test               # node --test test/*.test.mjs（20 个文件 / 约 396 例）
```

- `client/client.js` **入库**（构建产物随包发布，`prepack` 会自动重建）；改了 `client/` 下的源码后必须重新构建并一起提交。
- 渲染类测试需要 React + jsdom：设 `DSHC_REACT_DIR` 指向一份装好 react / react-dom 的目录；缺省时这些用例自动 skip。
- 真机 e2e（`test/e2e-live-gateway.test.mjs`）与 RPC B1–B6 在网关不在线时自动跳过，CI 仍绿。
- CI（`.github/workflows/ci.yml`）：install → build → 渲染依赖 → `npm test` → `npm pack --dry-run` 并校验 tarball 里含 `client/client.js`；打 `v*` tag 时发布 npm 并建 GitHub Release。

## 目录结构

| 路径 | 职责 |
|---|---|
| `lib/index.js` | loader 元信息、`ENDPOINTS`、settings schema、`createRuntime`、端点分发、路由注册、keep-awake 对账与凭证明文回传 |
| `lib/rpc-channel.js` | RPC 通道适配：认证 → 收 body → `Request` → 处理器 → 把 status/headers/body 写回 `res` |
| `lib/chanhub-client.js` | 网关 HTTP 客户端 + 版本/能力探测 + 各端点方法 |
| `lib/gateway-config.js` | 网关 `config.json` 原子读写（`:ro` 挂载报 `config-readonly`） |
| `lib/config-spec.js` | 53 项配置规格表 + 分组 + 校验（宿主与浏览器共用，不引 Node 依赖） |
| `lib/auths.js` | 凭证文件只读盘点；**绝不回传 accessToken / refreshToken** |
| `lib/model-catalog.js` | 多模态目录：pi-ai 离线目录 + models.dev + OpenRouter → 归一化 / 模糊匹配 + 三态投票 |
| `lib/model-patch.js` | 能力基线 + 拉取快照 + 补齐计划 + DSH `llm-pi-ai` 配置读写 |
| `lib/model-probe.js` | 视觉实测探针（自绘 PNG、行为化判定、串行批量） |
| `lib/model-scope.js` | 消费者模型集合匹配 / 校验（与网关 `internal/server/keys.go` 逐条对齐） |
| `lib/keepawake.js` | 「保持唤醒」caffeinate 控制器（重启归零守卫、防孤儿、0600 状态文件） |
| `client/index.js` | 浏览器半区主文件：7 个 Tab、侧边栏入口、设置注册 |
| `client/derive.js` | 与网关同口径的派生计算（见下） |
| `client/usage/`、`client/model-ability.js`、`client/api-keys.js`、`client/add-account.js`、`client/quick-entry.js` | 用量页、模型页、接入方页、添加账号弹窗、侧边栏入口 |

## 数据口径

「用量」「账号池」里的数字不是插件自创的，全部与网关 `internal/` 的口径**逐条对齐**（`client/derive.js`）：渠道判定对齐 `auth.ResolveChannel`、在途上限对齐 `pool.inFlightLimit`、命中率分母对齐 `finalizeGroup()`（写入不进分母）、分桶键对齐 `bucketSlot()`、窗口取值对齐 `parseWindow`、消费者集合规则对齐 `internal/server/keys.go`、成长码表对齐 `task_runner.py` 的 MAPPING 表、53 项配置对齐 `cmd/server/config.go` + `internal/config/schedule.go`。

拿不到证据的地方**如实留空**：会话粘性键浏览器侧看不到，就不显示「正在用哪个号」；没有正消耗就不算燃尽天数（显示「—」而不是除零或编造）；`earnedCredits` 是下界并标注「已覆盖 N/M」。

## 兼容性

- 宿主 **0.1.7-rc.2** 实测通过；0.1.5 线兼容（同一份代码两条线都能跑）。
- **0.1.7 的 `settingsScope` 不再由宿主提供**：写进模块级 `inject` 会让整个插件被 park（面板与侧边栏入口一起消失，`[data-slot-error]` 为 0）。本插件只在 `inject` 里放 `['slots','connection']`，`settingsScope` 改为惰性 `ctx.get()`（丢了就退回 localStorage）。
- 宿主给每个 slot 注入名为 `now` 的**数字** prop，插件自己的时钟因此改名为 `clock`，避免 `now is not a function` 把整条插槽变红框。
- `sidebar.footer.action` 是共享 list 槽且宿主那行不换行：入口主动改 `flex-wrap: wrap` 并取整行，卸载时还原。

## 参考与致谢

本插件的设计、配方与数据口径明确参考了以下工程，**不是原创**：

| 参考对象 | 借了什么 | 证据 |
|---|---|---|
| [lament-z/dsh-bridge-gateway](https://github.com/lament-z/dsh-bridge-gateway)（同作者） | **视觉令牌与卡片结构**（`client/theme.js` 与它的 `s` 对象同源）、**`settings.section` 注册方式**、**TabBar 复刻**（纯前端状态，非 DSH slot）、**RPC 配方**（prefix 路由方案、失败信封 `details` 保底 `issues:[]`、esbuild 打包形态） | `client/index.js:7,2541,3419`、`lib/rpc-channel.js:6`、`lib/index.js:178`、`client/build.mjs:2` |
| [AlfredChaos/dsh-usage-panel](https://github.com/AlfredChaos/dsh-usage-panel) | **用量页 v4 的单页卡片流**：一卡一组件、localStorage SWR、导出纪律、Tooltip fixed 定位、KPI 卡与热力图形态 | `client/usage/index.js:3`、`client/usage/cards.js:3`、`client/usage/export.js:3`、`client/usage/tooltip.js:3`、`client/usage/api.js:3` |
| [Javis603/token-monitor](https://github.com/Javis603/token-monitor)（另有 `zhangzheng25/dsh-token-monitor`） | **信息架构与概览统计条取值**（`overviewStats` 参考其 `STAT_CARDS`）；三处**刻意不照抄**：金额 → 积分、活跃时长（网关不记录）→ 不编造、会话数 → 请求数 | `client/derive.js:1399-1403`、`CHANGELOG.md:763` |
| [lament-z/chanhub](https://github.com/lament-z/chanhub)（同作者的网关） | 不是「参考」而是**契约来源**：所有派生计算与网关实现逐条对齐（见上文「数据口径」） | `lib/model-scope.js:3`、`lib/auths.js:11`、`client/derive.js:813,596,2059,876` |

## License

MIT

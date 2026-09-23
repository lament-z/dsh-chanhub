# dsh-chanhub

DeepSeek Harness 客户端插件：在「设置」侧边栏接入 **chanhub**（[lament-z/chanhub](https://github.com/lament-z/chanhub)，即 WorkBuddy2API 上游网关）的观测与配置面板。

设计风格对齐 [dsh-bridge-gateway](https://github.com/lament-z/dsh-bridge-gateway)：复用同一套视觉令牌与卡片结构，并以相同的 `ctx.slots.inject('settings.section', …)` 机制注册设置项，保证页面观感一致。

## 功能

6 个 Tab，数据来自网关真实端点（`GET /status`、`GET /v1/models`、`GET /v1/stats/buckets`、
`GET /admin/tasks/status` 等，见下表）与网关 `config.json`：

| Tab | 内容 |
|---|---|
| 账号池 | 概览五联、按域可用性、**赚得积分**（累计获得，覆盖度如实标注）、按渠道的当前可用积分、渠道筛选、**批量任务触发**（网关真实端点）、账号卡片（含到期时间）、账号折叠面板（健康 / 质量 / 积分 / 排程区块） |
| 任务 | 任务磁贴（点即触发，状态就地显示）、签到结果（摘要常驻 + 明细折起）、开学季子任务、成长任务进度（后两者均可切换账号） |
| 用量 | 单页卡片流：6 张 KPI（Tokens消耗 / 积分消耗 / 可用积分 · 请求数 / 缓存命中 / 平均延迟）、活跃热力图、每日按模型堆叠、账号与渠道排行（**维度可切，默认按用量 Tokens**）、模型占比；一次拉 720h 前端切片，`/v1/stats` 局限如实标注 |
| 模型 | DSH 模型配置与多模态能力治理：拉取网关目录 / 覆盖 / 回滚备份、**能力目录三态比对**（原厂 > 云托管 > 转售，借判不写配置）、**补齐缺失字段**（`contextWindow` / `maxTokens` / 推理档位 / 视觉 `input`，只填空缺、预演后确认）、**实测探针**（真发一张带「颜色 + 数字」的图，答对才算看见）、**能力基线沉淀**（L0 实测压过目录标注） |
| 日志 | 实时日志环形缓冲 + 频道筛选（对话 / 任务 / 系统） |
| 配置 | 53 项网关配置，分组折叠 + 校验 + 危险语义标注 + 服务控制 |

API key 只在宿主持有：所有网关调用都在宿主侧完成，经 `/dsh-chanhub` RPC 通道代理给浏览器。

### 添加账号（面板内闭环）

Tab 栏最右端（与「账号池 … 配置」同一行）有「**＋ 添加账号**」按钮，走网关的 OAuth 设备授权：

```
选渠道（WorkBuddy / TraeWork / QoderWork）+ 选域（国内版 / 国际版）
  → 「获取授权链接」（自动新开标签页，链接同时可见可复制）
  → 浏览器完成登录
  → 面板每 2.5 秒轮询，授权一完成就落盘并热加载进池
```

成功后弹窗显示 uid / 昵称 / 域 / 积分，账号**无需重启网关**即出现在池中（网关侧 `pool.Add` + 顺带签到）。
弹窗关闭时在途轮询会被清掉；重新发起即新开一轮（面板不持有登录会话，会话态在网关侧的
`data/login-state-<channel>.json`，15 分钟 TTL）。

#### 三个渠道的登录模型不同（决定「远端能不能加账号」）

| 渠道 | 凭证怎么回来 | 需要入站回调吗 | 远端可用 |
|---|---|---|---|
| WorkBuddy | 网关轮询上游设备流端点（`auth/token?state=`） | 不需要 | ✅ 只要网关能出网 |
| QoderWork | 网关轮询 `deviceToken/poll`；`redirect_uri` 是自定义 scheme，只唤醒桌面端 | 不需要 | ✅ 同上 |
| TraeWork | 授权页把凭证写进**回跳 URL**，服务端无设备流端点 | **需要**，且**只接受 127.0.0.1** | ✅ 但必须走粘贴（见下） |

**TraeWork 为什么必须粘贴**：Trae 授权页对回调地址有硬性校验
（`authorization/page.js`，同一正则出现两次）：

```js
var T = "网络错误，请刷新页面重试。";
if(!W || !Z || !/^http:\/\/127\.0\.0\.1:(\d+)\/authorize$/.test(Z)){
  O(!1), ew("invalidUrl"), ep(3);   // ep(3) 渲染的就是 T
}
```

`Z` 即 `auth_callback_url`。任何非 loopback 的地址（面板 origin、公网域名、
局域网 IP）都会被判 `invalidUrl`，用户只看到「**网络错误，请刷新页面重试。**」
—— 面板侧原本设想的「回调打到面板路由」方案因此**不可能成立**（曾据此实现并
真机验证失败，已回退）。

所以面板对 TraeWork 的做法是：

1. 发起登录（网关恒起本地一次性监听，回调必然是 `http://127.0.0.1:<端口>/authorize`）。
2. 弹窗常驻**粘贴框**，并明确告知：登录成功后浏览器会跳到一个打不开的地址，
   这是 Trae 的限制而非故障；那个页面的地址栏里带着登录凭证，整段复制回来即可。
3. 提交后走 `POST /panel/api/login/callback` 交给网关，再由现有 `poll` 路径
   完成换 token + 取 uid。

轮询有上限（15 分钟，与网关 TTL 对齐），超时会给出可执行提示而不是一直转。

入口按**网关实际能力**渲染，而不是按插件假设：

| 网关情况 | 面板表现 |
|---|---|
| 有 `/panel/api/channels` 且 `login_channels` 含目标渠道 | 渲染「＋ 添加账号」 |
| 有该端点但渠道不在 `login_channels`（旧网关没有 `workbuddy` 登录分支） | 隐藏入口；若已进入则明确提示「该网关版本不支持…请升级 chanhub 网关」 |
| 完全没有 `/panel/api/*` | 隐藏入口 |
| 网关不认识 `callback_base`（TraeWork 旧版） | 提示「该网关版本不支持面板回调…请升级」而不是让用户干等 |

> 旧的 chanhub 网关只搬进了 `traework` / `qoder` 两个渠道的登录，对 `workbuddy` 直接回
> 400 `unknown channel` —— 而绝大多数部署的账号正是 workbuddy。这就是「面板能移除账号却不能新增账号」的根因。
> 对应网关侧改动见 chanhub 仓库 `internal/routeapi/login_workbuddy.go` 与
> `internal/channel/login/trae/login.go`（外部回调 + TTL）。

### 消费的网关端点

以下新端点都在 `plugins/chanhub`（`internal/server/{tasks,credits,usage,logring}.go`），
且全部是**加性**改动 —— `/v1/stats` 的响应逐字段不变。

| 端点 | 支撑的视图 | 门槛 |
|---|---|---|
| `GET /status` | 账号池、五联计数、按域可用性 | `withAuth` |
| `GET /v1/models` | 模型清单 | `withAuth` |
| `GET /v1/stats` | 按模型统计 | `withAuth` |
| `GET /v1/accounts/{uid}/credits` | 逐套餐积分构成 | `withAuth` |
| `GET /v1/accounts/{uid}/growth-tasks` | 成长任务逐码进度（含小程序口径） | `withAuth` |
| `GET /v1/accounts/{uid}/school-tasks` | 开学季子任务状态（含活动期标志） | `withAuth` |
| `GET /v1/stats/buckets` | 用量分桶（槽 × 域 × 账号 × 模型） | `withAuth` |
| `GET /v1/logs` | 运行日志环形缓冲 | `logs.enabled=true` |
| `GET /v1/models/probes` | 模型实测输出上限（手动探测结果） | `withAuth` |
| `GET /admin/tasks/status` | 任务状态 + 签到/余额逐账号结果 | `admin.enabled=true` |
| `POST /admin/tasks/{name}` | 手动触发一类任务（7 类，含 `balance`） | `admin.enabled=true` |
| `GET /admin/tasks/scan` | 全账号待办扫描（未完成且可自动化的任务） | `admin.enabled=true` |
| `POST /admin/tasks/queue/start` | 启动执行队列（账号内串行、账号间并发） | `admin.enabled=true` |
| `GET /admin/tasks/queue` | 队列进度轮询 | `admin.enabled=true` |
| `GET /admin/school/status` | 各账号开学季状态 + 抽奖余额 | `admin.enabled=true` |
| `GET /admin/school/vouchers` | 各账号券码列表（只读） | `admin.enabled=true` |
| `POST /admin/growth-tasks/{uid}/accept` | 接受成长任务码 | `admin.enabled=true` |
| `POST /admin/growth-tasks/{uid}/claim` | 领取成长任务奖励 | `admin.enabled=true` |
| `POST /admin/growth-tasks/{uid}/claim-claimable` | 领取全部已完成未领奖励 | `admin.enabled=true` |
| `POST /admin/config` | 校验 + 原子写配置；可热改字段就地生效 | `admin.enabled=true` |
| `POST /admin/accounts/{uid}/{disable,enable,revive}` | 账号动作 | `admin.enabled=true` |
| `POST /admin/accounts/{uid}/{checkin,balance,remove}` | 单号签到 / 余额 / 移除 | `admin.enabled=true` |
| `GET /panel/api/channels` | 渠道清单（`channels` 协议全集 / `login_channels` 可登录集 / `realms`） | `withAuth` |
| `POST /panel/api/login/start?channel=…[&realm=…]` | 发起登录，返回授权 URL；traework 额外回 `callback_url`（恒为 `http://127.0.0.1:<端口>/authorize`）与 `needs_paste` | `withAuth` |
| `GET /panel/api/login/poll?channel=…` | 轮询登录态（`pending` / `done` / `error`） | `withAuth` |
| `POST /panel/api/login/callback?channel=traework` | 提交用户粘贴的回调（body `{callback}`）—— traework 在远端唯一的完成路径 | `withAuth` |

能力探测依据 `ServeMux` 的真实行为：未注册路径返回**纯文本** 404，
已注册路径返回 **JSON** 信封（方法不符则是 405）。面板按实际探测结果渲染各区块。

### 原交接文档的数据缺口已全部补齐

- **成长任务逐码进度**（如 `2/3`）—— `GET /v1/accounts/{uid}/growth-tasks`（含小程序口径）
- **开学季逐子任务状态** —— `GET /v1/accounts/{uid}/school-tasks`（含 `in_period` 活动期标志与每日重置时刻）
- **账号渠道 `channel`** —— `/status` 的 `accounts[].channel` 原生透出（WB / Trae / Qoder），
  判定与登录链路同源（登录落盘 `channel_ext` → `BackfillChannel` 回写 → `auth.Channel()`）
- **持久化计数已透出** —— `credits_expiring` / `session_dead_fails` / `retry_count`
  此前已落 `state.json` 但面板不可见，现经 `/status` 透出
- **配置写入支持热生效** —— `POST /admin/config` 与启动同一套 `normalize()` 校验、
  写盘（`tmp`+rename；`config.json` 是单文件挂载时挂载点无法被 rename 覆盖，
  退化为原地写），可热改字段（`pool.*` / `schedule.*` / `prompt.mode` /
  `cooldown.soft_rate` / `features.sanitize_*` / `api_key`）就地生效；需重启字段在
  响应里明确列出。面板的逐字段「↻ 需重启」角标以**网关热改面**为准，
  `lib/config-spec.js` 与该清单同步维护
- **侧边栏快捷入口** —— 左侧栏 foot 区（设置按钮同区）显示「渠道」入口：平时 `健康/总数 · 可用积分`，
  rail 态只留图标 + 异常角标；点开是自带 popover —— 可用积分 + 健康环、近 24h 迷你走势、
  渠道分布堆叠条、逐账号紧凑卡（渠道色条 / 余额相对条 / 状态与在途 / 到期 / 24h 走势）。
  自动路径只打只读端点（`/status` 60s、分桶用量展开时拉），**只有点「刷新」才真打一次上游**；
  网关不可达时如实显示「不可达 + 地址」，不显示 0。开关在**配置 Tab →「界面」**（持久化在插件 settings，
  改完即时生效；配置 Tab 在网关 config.json 读不到时该开关依然可见可改）
- **降级不静默** —— 热生效端点不可用（典型：`config.json` 以 `:ro` 挂载）时，
  面板照旧写宿主上的文件，但会**点名失败原因**、把全部改动标成需重启，
  并列出「端点修复后本可即时生效」的字段
- **模型实测上限** —— `scripts/probe_max_tokens.py`（手动执行，耗额度）写
  `data/model_probes.json`；`GET /v1/models/probes` 只读透出。网关绝不自动探测
- **新增账号** —— `POST /panel/api/login/start` + `GET /panel/api/login/poll?channel=workbuddy`，
  面板内 OAuth 闭环，落盘后热加载进池（此前只有「移除」没有「新增」，是真实的功能缺口，
  不是数据缺口。网关侧只支持 traework/qoder 的登录，workbuddy 分支由本次一并补上）

当前没有已知数据缺口。若网关版本较旧缺少某个端点，面板按能力探测结果渲染
「网关未提供」占位并列出所需端点，不使用推断值填充。
完整证据见 `.scratch/chanhub-panel/execution-report.md`。

## 前置条件

- 插件宿主能连到网关（默认 `http://127.0.0.1:7866`）。
- 「添加账号」要求网关带 `/panel/api/login/*` 且 `login_channels` 含目标渠道
  （旧的 chanhub 网关只支持 traework/qoder）。不满足时面板隐藏入口，其余功能不受影响。
- 读写网关 `config.json` 要求**插件宿主与网关同机**（账号渠道已由 `/status`
  原生透出，不再依赖同机读取凭证文件）。
  容器部署若挂载 `./config.json:/app/config.json:ro` 则为只读 —— 必须去掉 `:ro`：
  否则网关的热生效端点在每次保存时回 `500`（挂载点无法被 rename 覆盖），面板只能
  降级为宿主文件直写，结果就是「保存成功但仍要手动重启网关」。

## 配置项（settings 命名空间 `dsh-chanhub`）

| 字段 | 默认 | 说明 |
|---|---|---|
| `baseURL` | `http://127.0.0.1:7866` | 网关地址 |
| `apiKeyEnv` | `WB2API_API_KEY` | 凭证引用，经 `ctx.credentials` 解析 |
| `apiKey` | `""` | 明文兜底（建议优先用 `apiKeyEnv`） |
| `gatewayConfigPath` | `""` | 宿主上网关 `config.json` 的绝对路径 |
| `authDir` | `""` | 网关凭证目录（用于渠道推断） |
| `restartCommand` | `""` | 重启命令，只接受 `docker restart …` / `docker compose … restart …` / `docker-compose restart …` / `./dev.sh restart`（可执行文件允许写绝对路径）；**找不到 docker 时会自动到 Docker Desktop 自带 CLI 目录找**，见下方「重启网关」 |
| `allowServiceControl` | `false` | 必须显式开启才会执行重启命令 |
| `modelPullSnapshot` | `""` | 上次「拉取」记录的网关模型目录快照（JSON；`hasEfforts` 标记是否含推理档位），「覆盖」与「补齐」的依据，也用于回滚比对 |
| `modelCapabilities` | `""` | **能力基线**（JSON，`{at, entries:{id:{image,status,tier,how,at}}}`）。只沉淀**确认态**（借判/冲突/别名/无收录一律不写）；等级 L0 实测 > L1 原厂 > L2 云托管 > L3 转售，低等级不得覆盖高等级 —— 有效视觉集合 = 人工白名单 ∪ 基线里的 `image` 项 |

### 重启网关（`docker: command not found` 怎么办）

面板里点的「↻ 重启网关」是在**宿主**上跑命令，不是在容器里。常见故障是命令没错、
二进制找不到：dsh 由 launchd 拉起时 PATH 只有 `/usr/bin:/bin:/usr/sbin:/sbin`，
而 Docker Desktop 未必在 `/usr/local/bin` 放 CLI 软链 → `/bin/sh: docker: command not found`。

插件已自动处理：先按 PATH 找，找不到再退到已知安装位（含
`/Applications/Docker.app/Contents/Resources/bin`），并把该目录补进子进程 PATH、
保证 `HOME` 存在（否则 docker CLI 找不到 `~/.docker/run/docker.sock`）。
仍失败时结果里会带 `binPath` 与搜过的目录，便于定位。

想一劳永逸也可以自己补软链：

```bash
sudo ln -s /Applications/Docker.app/Contents/Resources/bin/docker /usr/local/bin/docker
```

## 安装

```bash
dsh plugin --profile web add dsh-chanhub@latest
# 或
npx --yes @deepseek-ai/dsh plugin --profile web add dsh-chanhub@latest
```

## 开发

```bash
npm install
npm run build:client   # client/index.js -> client/client.js（esbuild 打包）
npm test
npm pack --dry-run     # tarball 必须包含 client/client.js
```

客户端渲染测试需要 React 与 jsdom，但插件本身不依赖它们（React 由宿主提供）。
把它们装在一个临时目录里再指过去：

```bash
mkdir -p /tmp/dshc-render && cd /tmp/dshc-render && npm init -y
npm install react@19 react-dom@19 jsdom
# 然后回到插件根目录：
DSHC_REACT_DIR=/tmp/dshc-render npm test
```

未提供时这些渲染测试会自动跳过，宿主侧与单元测试照常运行。

依赖真实网关的测试（`test/rpc-channel.test.mjs` 的 `B1`–`B6`）在 `127.0.0.1:7866`
无人应答时自动跳过，因此无网关的 CI 仍然是绿的。

## 目录结构

| 路径 | 说明 |
|---|---|
| `lib/index.js` | 宿主侧插件入口：RPC 通道、端点分发、loader 元信息 |
| `lib/rpc-channel.js` | RPC 通道适配层（认证 + IncomingMessage→Request→写回 res） |
| `lib/chanhub-client.js` | 网关 HTTP 客户端 + 版本/能力探测 |
| `lib/gateway-config.js` | 网关 `config.json` 读写（原子写 + fail-fast 预检） |
| `lib/config-spec.js` | 53 项配置规格表（宿主校验与前端表单共用） |
| `lib/auths.js` | 凭证文件只读盘点（渠道判定的唯一来源） |
| `lib/model-catalog.js` | 多模态能力目录：pi-ai 离线目录 + models.dev + OpenRouter → 归一化/剥后缀/模糊匹配 + 三态投票判定（纯逻辑，可离线测） |
| `lib/model-patch.js` | 模型配置补丁：白名单、能力基线（`mergeCapabilities` 含等级保护）、拉取快照、补齐计划（`buildCompletionPatch`） |
| `lib/model-probe.js` | 视觉能力**实测**探针：自绘 PNG（背景色 + 数字）、行为化判定、请求级归因、串行批量 |
| `client/index.js` | 浏览器侧面板：5 Tab 界面 |
| `client/add-account.js` | 「添加账号」弹窗（设备授权三段状态机 + 轮询生命周期） |
| `client/model-ability.js` | 「模型」Tab：能力目录徽章、实测按钮与「与目录矛盾」告警、补齐预演、沉淀 |
| `client/derive.js` | 纯派生逻辑（状态判定 / 分组 / 归纳），可在 node 下直接测 |
| `client/theme.js` | DSH 视觉令牌与折叠 CSS |
| `client/build.mjs` | esbuild 打包脚本（与 dsh-bridge-gateway 一致） |
| `cordis.patch.yml` | cordis bundle patch（单一 row） |
| `dsh-plugin.naming.json` | 命名声明（经 `plugin-write` 校验） |
| `docs/vision-probe-measured.md` | 全量 107 个模型的视觉能力实测结果（逐条依据 + 目录漏判/错判清单） |
| `docs/apply-model-fix.mjs` | 命令行版「沉淀 + 补齐」（面板按钮的等价物，`--apply` 前先预演） |

## 协议

MIT

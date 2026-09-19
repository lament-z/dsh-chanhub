# dsh-chanhub

DeepSeek Harness 客户端插件：在「设置」侧边栏接入 **chanhub**（[lament-z/chanhub](https://github.com/lament-z/chanhub)，即 WorkBuddy2API 上游网关）的观测与配置面板。

设计风格对齐 [dsh-bridge-gateway](https://github.com/lament-z/dsh-bridge-gateway)：复用同一套视觉令牌与卡片结构，并以相同的 `ctx.slots.inject('settings.section', …)` 机制注册设置项，保证页面观感一致。

## 功能

5 个 Tab，数据来自网关真实端点（`GET /status`、`GET /v1/models`、`GET /v1/stats/buckets`、
`GET /admin/tasks/status` 等，见下表）与网关 `config.json`：

| Tab | 内容 |
|---|---|
| 账号池 | 概览五联、按域可用性、总积分与渠道分列、渠道筛选、**批量任务触发**（网关真实端点）、账号折叠面板（健康 / 质量 / 积分 / 排程区块） |
| 任务 | 任务触发与运行状态（签到/余额逐号结果）、成长任务逐码进度、开学季子任务状态 |
| 用量 | 四维用量分桶（窗口切换 24h–30d），`/v1/stats` 局限如实标注 |
| 日志 | 实时日志环形缓冲 + 频道筛选（对话 / 任务 / 系统） |
| 配置 | 53 项网关配置，分组折叠 + 校验 + 危险语义标注 + 服务控制 |

API key 只在宿主持有：所有网关调用都在宿主侧完成，经 `/dsh-chanhub` RPC 通道代理给浏览器。

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
  原子写，可热改字段（`pool.*` / `schedule.*` / `prompt.mode` / `api_key` 等）
  就地生效；需重启字段在响应里明确列出
- **模型实测上限** —— `scripts/probe_max_tokens.py`（手动执行，耗额度）写
  `data/model_probes.json`；`GET /v1/models/probes` 只读透出。网关绝不自动探测

当前没有已知数据缺口。若网关版本较旧缺少某个端点，面板按能力探测结果渲染
「网关未提供」占位并列出所需端点，不使用推断值填充。
完整证据见 `.scratch/chanhub-panel/execution-report.md`。

## 前置条件

- 插件宿主能连到网关（默认 `http://127.0.0.1:7863`）。
- 读写网关 `config.json` 要求**插件宿主与网关同机**（账号渠道已由 `/status`
  原生透出，不再依赖同机读取凭证文件）。
  容器部署若挂载 `./config.json:/app/config.json:ro` 则为只读 —— 需去掉 `:ro` 才能编辑。

## 配置项（settings 命名空间 `dsh-chanhub`）

| 字段 | 默认 | 说明 |
|---|---|---|
| `baseURL` | `http://127.0.0.1:7863` | 网关地址 |
| `apiKeyEnv` | `WB2API_API_KEY` | 凭证引用，经 `ctx.credentials` 解析 |
| `apiKey` | `""` | 明文兜底（建议优先用 `apiKeyEnv`） |
| `gatewayConfigPath` | `""` | 宿主上网关 `config.json` 的绝对路径 |
| `authDir` | `""` | 网关凭证目录（用于渠道推断） |
| `restartCommand` | `""` | 重启命令，必须以白名单前缀开头 |
| `allowServiceControl` | `false` | 必须显式开启才会执行重启命令 |

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

依赖真实网关的测试（`test/rpc-channel.test.mjs` 的 `B1`–`B6`）在 `127.0.0.1:7863`
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
| `client/index.js` | 浏览器侧面板：5 Tab 界面 |
| `client/derive.js` | 纯派生逻辑（状态判定 / 分组 / 归纳），可在 node 下直接测 |
| `client/theme.js` | DSH 视觉令牌与折叠 CSS |
| `client/build.mjs` | esbuild 打包脚本（与 dsh-bridge-gateway 一致） |
| `cordis.patch.yml` | cordis bundle patch（单一 row） |
| `dsh-plugin.naming.json` | 命名声明（经 `plugin-write` 校验） |

## 协议

MIT

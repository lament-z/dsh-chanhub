# dsh-chanhub

English | [简体中文](./README.zh.md)

Brings [chanhub](https://github.com/lament-z/chanhub) (the WorkBuddy2API upstream gateway) into the **DeepSeek Harness (DSH)** web UI: a sidebar quick entry for the account pool and usage, and a **Settings → Channel Center** panel for observing and configuring the gateway. The plugin is *not* the gateway — it reads the gateway's real endpoints over host RPC and maps the gateway `config.json` surface into a form.

> **Division of labour**: the gateway (Go, default `:7866`) owns the account pool, channel logins, scheduled tasks, the model catalog and the OpenAI-compatible `/v1/*` surface; this plugin is its DSH client. The panel renders whatever the gateway **actually provides** — it probes the gateway's version/capabilities once at startup and honestly hides (with an explanation) anything the gateway does not serve.

## Features

Seven tabs (`client/index.js:122`), all driven by real gateway endpoints:

| Tab | Data source | What you can do |
|---|---|---|
| **Accounts** | `/status`, `/panel/api/*`, per-account credits endpoints | Five counters + per-realm availability bar + total credits + per-channel breakdown + lifetime credits earned (with coverage stated); channel filter, card/list views; per-account drawer (health / quality / credits / schedule blocks, per-package credits, token usage, model costs, soft-rate notice); disable (with reason) / enable / revive / remove, each behind a confirmation |
| **Tasks** | `/admin/tasks/*` | Trigger any of 6 task kinds (check-in / balance / activity / cat travel / token keepalive / night owl); structured per-account check-in results; growth-task per-code progress with accept / claim; **Task Center**: scan all accounts → run the queue (serial per account, 2 in parallel) → poll progress every 5s |
| **Usage** | `/v1/stats/buckets` (window buckets) | Four KPI cards, activity heatmap, daily stacked-by-model chart, account ranking, channel usage, consumer usage; **narrow by consumer key**; burn-down and process-scope fold-outs; CSV / JSON export; localStorage SWR cache with four states (loading / fresh / stale / fallback / error) |
| **Models** | `/admin/models` (falls back to `/v1/models`) | Capability catalog with three-way verdicts (confirmed / borrowed / conflict / alias / missing) and provenance tiers (L1 vendor / L2 cloud host / L3 reseller); search, quick-filter chips, grouping by channel, sticky header; apply patch, fill missing fields, **probe the undecided** (a self-drawn PNG vision probe), settle confirmed entries, refresh catalog, roll back, clear records |
| **Consumers** | `/admin/keys` | Create / edit / delete / rotate multi-consumer API keys; the three-state scope semantics (`["*"]` everything / `[]` empty (dangerous) / N patterns); plaintext shown exactly once after create/rotate (blocking confirmation); observation-surface switches; "computed from the rules" preview |
| **Logs** | `/v1/logs` | Filter by channel (all / chat / task / sys), 500-line view, clear; host log section |
| **Config** | gateway `config.json` | All 53 config fields in 11 groups; per-field validation and a "↻ restart required" badge; save results distinguished as `applied` / `hot_applied` / `restart_required`; gateway restart (command allowlist, off by default); the sidebar-entry switch lives in the "Interface" group |

> The **Consumers** tab only appears when the gateway serves `/admin/keys` (`client/index.js:3272`).

**Top bar** (every tab): connection state, the API_KEY pill (reveals the plaintext on click; never logged), the "keep awake" toggle (polls every 20s while on, double confirmation to turn off), refresh.

### Adding an account (closed loop in the panel)

The right end of the tab bar has **+ Add account**, which drives the gateway's OAuth login; the panel polls every 2.5s (15-minute cap) and the account lands in the pool **without a gateway restart**:

| Channel | How the credential comes back | Works remotely |
|---|---|---|
| WorkBuddy | the gateway polls the upstream device-flow endpoint | ✅ as long as the gateway has egress |
| QoderWork | the gateway polls `deviceToken/poll` | ✅ same |
| TraeWork | the authorization page writes the credential into the **redirect URL**, and the upstream hard-validates the callback to `http://127.0.0.1:<port>/authorize` | ✅ but **you must paste**: after login the browser lands on an unreachable address (a Trae restriction) — copy the whole address bar back into the panel |

The entry renders according to the gateway's real capabilities: if the gateway has no `/panel/api/*`, or its `login_channels` does not include the target channel, the entry is hidden with an explicit "this gateway version does not support it, please upgrade".

## Sidebar quick entry

A "Channel accounts" entry at the bottom of the sidebar (same area as Settings, directly above it), in two shapes:

- **Expanded**: takes a full row; the card shows a health bar, a health ring, a channel-distribution stacked bar and a counting animation, summarised as e.g. `渠道账号 5/5 · 1.02W`.
- **Rail (collapsed)**: just a 36×36 icon matching the host's other entries.

A second button opens the **Channel Center** modal (`CenterModal`, portalled to body, up to 1040×920 on desktop, full-screen sheet on mobile, Esc/overlay to close, body scroll locked). **The modal renders the very same panel as the Settings entry** (same component, same data source), so the two can never disagree. The popover shows usable credits, the health ring, a rolling 24h window, the channel distribution, and compact per-account cards (channel stripe / nickname / status pill with in-flight n/limit / relative balance bar / 24h sparkline / expiry / activity badge).

Automatic paths only hit read-only endpoints (`/status` every 60s); **only pressing Refresh actually hits the upstream**. When the gateway is unreachable it says so (with the address) instead of showing zeros. With no panel injected, the icon and footer buttons are simply not rendered — no dead buttons.

## Talking to the gateway

- **Channel**: the plugin registers a prefix route `/dsh-chanhub` on its own `webServer` (`lib/rpc-channel.js`); the browser calls `ctx.connection.rpc.call('/dsh-chanhub', endpoint, payload, signal)`. Since DSH 0.1.5 third parties no longer get `connection.rpc.handle`, hence the prefix route; the wire format is unchanged.
- **Auth**: browser → host goes through `connection`'s request gate; host → gateway uses `Authorization: Bearer <api_key>`.
- **Where the api_key comes from** (three-step fallback): `ctx.credentials` resolving `apiKeyEnv` (default `WB2API_API_KEY`) → the same-named environment variable → `apiKey` in settings. The browser **never** talks to the gateway directly (no CORS headers, Bearer required, the bundle is plain text).
- **Capability probe**: one probe at startup records the gateway version and features (stats / models / adminModels / adminKeys / admin / usageBuckets / logs / credits / growthTasks / tasks / loginApi); the panel renders from it. The gateway identity must be `chanhub2api`; the legacy name `workbuddy2api` is rejected (no dual-name compatibility).
- **Degradation**: a missing route on an older gateway is detected by `isMissingRoute` (404 + `upstream-error` / `not_found`) and falls back safely; a failed `refreshStatus` falls back to `/status` and says "credits may be stale"; every failure envelope is `{ok:false,error:{code,message,details}}` with `details` always carrying `issues:[]` (otherwise the host wire decoder takes the whole panel down).
- **Timeouts**: 15s normally, 4s for liveness, 60s version-probe cache.

## Configuration

Settings namespace `dsh-chanhub`, 10 fields (`lib/index.js:380`):

| Field | Default | Meaning |
|---|---|---|
| `baseURL` | `http://127.0.0.1:7866` | Gateway address |
| `apiKeyEnv` | `WB2API_API_KEY` | Credential reference (resolved via `ctx.credentials`) |
| `apiKey` | empty | Plaintext fallback; schema marks `role: 'secret'` |
| `gatewayConfigPath` | empty | Absolute path to the gateway `config.json` on the host (for reading/writing gateway config) |
| `restartCommand` | empty | Gateway restart command (allowlist: `docker restart` / `docker compose … restart` / `docker-compose restart` / `./dev.sh restart`) |
| `allowServiceControl` | `false` | Must be explicitly enabled before a restart is executed |
| `sidebarEntry` | `true` | Sidebar-entry switch (falls back to localStorage on remote pages) |
| `modelPullSnapshot` | empty | Full snapshot of the model pull record |
| `modelSyncBackup` | empty | Automatic backup taken before "overwrite the DSH config from the gateway" |
| `modelCapabilities` | empty | Capability baseline JSON |

Environment bypasses: `DSH_CHANHUB_BASE_URL`, `DSH_CHANHUB_CATALOG_CACHE`, `DSH_CHANHUB_KEEPAWAKE_STATE`.

## Requirements

- A DSH web profile; host **0.1.7-rc.2 verified** (the 0.1.5 line works too).
- A reachable chanhub gateway (default `http://127.0.0.1:7866`) whose `api_key` matches this plugin's configuration.
- Node `^22.19.0 || >=24`.

## Install

```sh
# From GitHub (recommended)
dsh plugin --profile web add github:lament-z/dsh-chanhub

# From a local clone / working copy
dsh plugin --profile web add link:<this directory>
```

Restart `dsh web` and reload: "Channel accounts" appears at the bottom of the sidebar and "Channel Center" under Settings.

## Develop

```sh
npm run build:client   # esbuild bundles client/index.js → client/client.js (CJS + __ModuleLoader__ wrapper)
npm test               # node --test test/*.test.mjs (20 files / ~396 cases)
```

- `client/client.js` **is committed** (the build output ships with the package; `prepack` rebuilds it). After editing sources under `client/`, rebuild and commit the bundle together.
- Render tests need React + jsdom: point `DSHC_REACT_DIR` at a directory with react / react-dom installed; those cases skip otherwise.
- The live e2e (`test/e2e-live-gateway.test.mjs`) and RPC B1–B6 skip when no gateway is reachable; CI stays green.
- CI (`.github/workflows/ci.yml`): install → build → render deps → `npm test` → `npm pack --dry-run` and assert the tarball contains `client/client.js`; a `v*` tag publishes to npm and creates a GitHub Release.

## Layout

| Path | Responsibility |
|---|---|
| `lib/index.js` | Loader metadata, `ENDPOINTS`, settings schema, `createRuntime`, endpoint dispatch, route registration, keep-awake reconciliation and plaintext credential return |
| `lib/rpc-channel.js` | RPC channel adapter: authenticate → collect body → `Request` → handler → write status/headers/body back to `res` |
| `lib/chanhub-client.js` | Gateway HTTP client + version/capability probe + per-endpoint methods |
| `lib/gateway-config.js` | Atomic read/write of the gateway `config.json` (reports `config-readonly` on a `:ro` mount) |
| `lib/config-spec.js` | The 53-field config spec + groups + validation (shared by host and browser; no Node deps) |
| `lib/auths.js` | Read-only inventory of credential files; **never returns accessToken / refreshToken** |
| `lib/model-catalog.js` | Multimodal catalog: pi-ai offline catalog + models.dev + OpenRouter → normalisation / fuzzy matching + three-way vote |
| `lib/model-patch.js` | Capability baseline + pull snapshot + completion plan + DSH `llm-pi-ai` config read/write |
| `lib/model-probe.js` | Vision probe (self-drawn PNG, behavioural verdict, serial batches) |
| `lib/model-scope.js` | Consumer model-set matching/validation (aligned line by line with the gateway's `internal/server/keys.go`) |
| `lib/keepawake.js` | "Keep awake" caffeinate controller (reboot-zero guard, orphan prevention, 0600 state file) |
| `client/index.js` | Browser half: the seven tabs, the sidebar entry, the settings registration |
| `client/derive.js` | Derivations that share the gateway's own accounting (below) |
| `client/usage/`, `client/model-ability.js`, `client/api-keys.js`, `client/add-account.js`, `client/quick-entry.js` | Usage page, models page, consumers page, add-account dialog, sidebar entry |

## Data accounting

The numbers in **Usage** and **Accounts** are not invented by the plugin: they are aligned **line by line** with the gateway's `internal/` (`client/derive.js`). Channel resolution follows `auth.ResolveChannel`; the in-flight cap follows `pool.inFlightLimit`; the hit-rate denominator follows `finalizeGroup()` (writes never enter the denominator); bucket keys follow `bucketSlot()`; window values follow `parseWindow`; consumer-set rules follow `internal/server/keys.go`; the growth-code table follows `task_runner.py`'s MAPPING table; the 53 config fields follow `cmd/server/config.go` + `internal/config/schedule.go`.

Where evidence is missing it stays **honestly empty**: the browser cannot see the session-stickiness key, so it does not claim "which account is in use"; with no positive burn it does not compute burn-down days (it shows "—" instead of dividing by zero or inventing a number); `earnedCredits` is a lower bound and says "covered N/M".

## Compatibility

- Host **0.1.7-rc.2** verified; the 0.1.5 line works from the same code.
- **0.1.7 no longer provides `settingsScope`**: declaring it in the module-level `inject` parks the whole plugin (panel *and* sidebar entry vanish, `[data-slot-error]` stays 0). This plugin injects only `['slots','connection']` and reads `settingsScope` lazily via `ctx.get()` (falling back to localStorage).
- The host injects a **number** prop named `now` into every slot; the plugin's own clock is therefore called `clock`, so `now is not a function` can no longer paint the whole slot red.
- `sidebar.footer.action` is a shared list slot and the host's row does not wrap: the entry sets `flex-wrap: wrap` and takes a full row, restoring it on unmount.

## Credits and references

The design, recipes and data accounting of this plugin are explicitly derived from the following projects — **this is not original work**:

| Reference | What was borrowed | Evidence |
|---|---|---|
| [lament-z/dsh-bridge-gateway](https://github.com/lament-z/dsh-bridge-gateway) (same author) | **Design tokens and card structure** (`client/theme.js` is the same `s` object), the **`settings.section` registration**, the **TabBar clone** (pure front-end state, not a DSH slot), and the **RPC recipe** (prefix route, failure envelope keeping `issues:[]`, the esbuild bundling shape) | `client/index.js:7,2541,3419`, `lib/rpc-channel.js:6`, `lib/index.js:178`, `client/build.mjs:2` |
| [AlfredChaos/dsh-usage-panel](https://github.com/AlfredChaos/dsh-usage-panel) | **The Usage page v4 single-page card flow**: one component per card, localStorage SWR, the export discipline, fixed-positioned tooltips, KPI cards and heatmap shapes | `client/usage/index.js:3`, `client/usage/cards.js:3`, `client/usage/export.js:3`, `client/usage/tooltip.js:3`, `client/usage/api.js:3` |
| [Javis603/token-monitor](https://github.com/Javis603/token-monitor) (also `zhangzheng25/dsh-token-monitor`) | **Information architecture and the overview stat strip** (`overviewStats` follows its `STAT_CARDS`); three deliberate departures: money → credits, active time (the gateway does not record it) → not invented, session count → request count | `client/derive.js:1399-1403`, `CHANGELOG.md:763` |
| [lament-z/chanhub](https://github.com/lament-z/chanhub) (the gateway, same author) | Not a "reference" but the **source of truth for the contract**: every derivation is aligned line by line with the gateway implementation (see "Data accounting") | `lib/model-scope.js:3`, `lib/auths.js:11`, `client/derive.js:813,596,2059,876` |

## License

MIT

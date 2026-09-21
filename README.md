# dsh-chanhub

A DeepSeek Harness client plugin that adds a **chanhub** panel to the Settings sidebar for observing and configuring the [lament-z/chanhub](https://github.com/lament-z/chanhub) (WorkBuddy2API) upstream gateway.

The visual design mirrors [dsh-bridge-gateway](https://github.com/lament-z/dsh-bridge-gateway): it reuses the same design tokens and card structure, and registers its Settings entry via the same `ctx.slots.inject('settings.section', …)` mechanism, so the page looks consistent.

## Features

Five tabs, driven by real gateway endpoints (`GET /status`, `GET /v1/models`, `GET /v1/stats/buckets`, `GET /admin/tasks/status`, … — see the table below) plus the gateway `config.json`:

| Tab | Content |
|---|---|
| Accounts | Overview counters, per-realm availability, total/channel credits, channel filter, **batch task triggers** (real gateway endpoints), per-account fold panels (health / quality / credits / schedule blocks) |
| Tasks | Task trigger + run status (per-account check-in results), growth-task progress, school-season subtask status |
| Usage | Four-dimension usage buckets (window switch 24h–30d) with the `/v1/stats` limitation stated |
| Logs | Live log ring buffer with channel chips (chat / task / sys) |
| Config | All 53 gateway config fields, grouped and validated, plus service control |

The API key never reaches the browser: every gateway call is made host-side and proxied over the `/dsh-chanhub` RPC channel.

### Gateway endpoints this panel consumes

All new endpoints live in `plugins/chanhub` (`internal/server/{tasks,credits,usage,logring}.go`)
and are purely additive — `/v1/stats` responds with exactly its previous fields.

| Endpoint | Powers | Gate |
|---|---|---|
| `GET /status` | Account pool, counters, per-realm availability | `withAuth` |
| `GET /v1/models` | Model list | `withAuth` |
| `GET /v1/stats` | Per-model statistics | `withAuth` |
| `GET /v1/accounts/{uid}/credits` | Per-package credit breakdown | `withAuth` |
| `GET /v1/accounts/{uid}/growth-tasks` | Per-code growth-task progress (incl. miniprogram context) | `withAuth` |
| `GET /v1/accounts/{uid}/school-tasks` | School-season subtask status (with activity-period flag) | `withAuth` |
| `GET /v1/stats/buckets` | Usage buckets (slot × realm × uid × model) | `withAuth` |
| `GET /v1/logs` | Runtime log ring buffer | `logs.enabled=true` |
| `GET /v1/models/probes` | Model measured output limits (manual probe results) | `withAuth` |
| `GET /admin/tasks/status` | Task status + per-account check-in and balance results | `admin.enabled=true` |
| `POST /admin/tasks/{name}` | Trigger one task (7 kinds incl. `balance`) | `admin.enabled=true` |
| `GET /admin/tasks/scan` | Scan all accounts for pending automatable tasks | `admin.enabled=true` |
| `POST /admin/tasks/queue/start` | Start the task queue (per-account serial, cross-account parallel) | `admin.enabled=true` |
| `GET /admin/tasks/queue` | Queue progress | `admin.enabled=true` |
| `GET /admin/school/status` | School-season status + lottery chances per account | `admin.enabled=true` |
| `GET /admin/school/vouchers` | Voucher codes per account (read-only) | `admin.enabled=true` |
| `POST /admin/growth-tasks/{uid}/accept` | Accept growth-task codes | `admin.enabled=true` |
| `POST /admin/growth-tasks/{uid}/claim` | Claim growth-task rewards | `admin.enabled=true` |
| `POST /admin/growth-tasks/{uid}/claim-claimable` | Claim all completed (unclaimed) rewards | `admin.enabled=true` |
| `POST /admin/config` | Validate + atomically write config; hot-applies eligible fields | `admin.enabled=true` |
| `POST /admin/accounts/{uid}/{disable,enable,revive}` | Account actions | `admin.enabled=true` |
| `POST /admin/accounts/{uid}/{checkin,balance,remove}` | Per-account check-in / balance / removal | `admin.enabled=true` |

Capability probing uses the real `ServeMux` behaviour: an unregistered path returns
a **plain-text** 404, a registered one returns a **JSON** envelope (or 405 on a method
mismatch). The panel renders each area according to what it actually detects.

### Data gaps from the original handoff are now closed

- **Per-code growth-task progress** (e.g. `2/3`) — `GET /v1/accounts/{uid}/growth-tasks`
  (merges both download contexts, miniprogram included).
- **School-season subtask status** — `GET /v1/accounts/{uid}/school-tasks`
  (includes the `in_period` activity flag and per-day reset times).
- **Per-account `channel`** — `/status` now carries `accounts[].channel` natively
  (WB / Trae / Qoder), derived through the same chain the login flow writes
  (`channel_ext` → `BackfillChannel` → `auth.Channel()`).
- **Persisted counters now surfaced** — `credits_expiring` / `session_dead_fails` /
  `retry_count` are exposed through `/status` (they were persisted in
  `state.json` but invisible to the panel).
- **Config writes hot-apply** — `POST /admin/config` validates with the same
  `normalize()` semantics as startup, writes atomically, and applies eligible
  fields (`pool.*`, `schedule.*`, `prompt.mode`, `api_key`, …) in-place;
  restart-required fields are listed explicitly in the response.
- **Model measured limits** — `scripts/probe_max_tokens.py` (manual, costs quota)
  writes `data/model_probes.json`; `GET /v1/models/probes` surfaces it read-only.
  The gateway never probes automatically.

No known data gaps remain. If an older gateway lacks an endpoint, the panel renders
a "网关未提供" placeholder naming the required endpoint, rather than inventing values.
See `.scratch/chanhub-panel/execution-report.md` for the evidence.

## Requirements

- The plugin host must be able to reach the gateway (default `http://127.0.0.1:7866`).
- Reading and writing the gateway `config.json` requires the plugin host and the
  gateway to be on the same machine. Container deployments that mount
  `./config.json:/app/config.json:ro` are read-only — remove `:ro` to allow edits.
  (Account channels come from `/status` natively; no same-machine credential reading
  is needed for that anymore.)

## Configuration

The plugin registers the settings namespace `dsh-chanhub`:

| Field | Default | Meaning |
|---|---|---|
| `baseURL` | `http://127.0.0.1:7866` | Gateway address |
| `apiKeyEnv` | `WB2API_API_KEY` | Credential reference resolved through `ctx.credentials` |
| `apiKey` | `""` | Fallback literal key (prefer `apiKeyEnv`) |
| `gatewayConfigPath` | `""` | Absolute path to the gateway `config.json` on the host |
| `authDir` | `""` | Gateway credential directory (for channel derivation) |
| `restartCommand` | `""` | Restart command; only `docker restart …` / `docker compose … restart …` / `docker-compose restart …` / `./dev.sh restart` are accepted (absolute paths to the binary are allowed). If `docker` is not on PATH, the plugin falls back to known install locations (incl. Docker Desktop's bundled CLI) — see below |
| `allowServiceControl` | `false` | Must be enabled to run the restart command |

### Restart gateway / `docker: command not found`

The "restart gateway" button runs the command **on the host**, not inside the container.
A common failure is not the command but the missing binary: when dsh is launched by
launchd its PATH is only `/usr/bin:/bin:/usr/sbin:/sbin`, and Docker Desktop does not
always install a CLI symlink into `/usr/local/bin` → `/bin/sh: docker: command not found`.

The plugin now handles this: it looks up PATH first, then falls back to known install
locations (including `/Applications/Docker.app/Contents/Resources/bin`), prepends that
directory to the child process PATH, and ensures `HOME` is set (without it the CLI cannot
resolve `~/.docker/run/docker.sock`). Failures report `binPath` and the searched dirs.

You can also fix it once for every tool with a symlink:

```bash
sudo ln -s /Applications/Docker.app/Contents/Resources/bin/docker /usr/local/bin/docker
```

## Install

```bash
dsh plugin --profile web add dsh-chanhub@latest
```

## Develop

```bash
npm install
npm run build:client   # writes client/client.js
npm test
npm pack --dry-run     # the tarball must contain client/client.js
```

Client render tests need React and jsdom, which the plugin itself does not depend on
(the host provides React). Point them at a scratch install:

```bash
mkdir -p /tmp/dshc-render && cd /tmp/dshc-render && npm init -y
npm install react@19 react-dom@19 jsdom
# then, from the plugin root:
DSHC_REACT_DIR=/tmp/dshc-render npm test
```

Without them, the render tests skip; the host-side and unit tests still run.

Gateway-backed tests (`B1`–`B6` in `test/rpc-channel.test.mjs`) skip automatically when no
gateway answers on `127.0.0.1:7866`, so CI stays green without one.

## Layout

| Path | Purpose |
|---|---|
| `lib/index.js` | Host entry: RPC channel, endpoint dispatch, loader metadata |
| `lib/rpc-channel.js` | RPC channel adapter (auth + IncomingMessage→Request→write back to res) |
| `lib/chanhub-client.js` | Gateway HTTP client + version/capability probing |
| `lib/gateway-config.js` | Gateway `config.json` read/write (atomic + fail-fast precheck) |
| `lib/config-spec.js` | The 53-field config spec (shared by host validation and the UI) |
| `lib/auths.js` | Read-only credential inventory (the only source for channel derivation) |
| `client/index.js` | Browser panel: the five-tab UI |
| `client/derive.js` | Pure derivation logic, testable directly under Node |
| `client/theme.js` | DSH visual tokens and fold CSS |
| `client/build.mjs` | esbuild bundle script (same shape as dsh-bridge-gateway) |
| `cordis.patch.yml` | cordis bundle patch (single row) |
| `dsh-plugin.naming.json` | Naming declaration (validated by `plugin-write`) |

## License

MIT

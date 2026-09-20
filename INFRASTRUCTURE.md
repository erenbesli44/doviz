# Döviz Veri — Infrastructure & Operations Guide

> **This file must never contain secret values.** The `doviz` repo is currently
> **public** on GitHub. Record *where* a credential lives (vault entry, env var
> name), never the value itself. See [Credential policy](#credential-policy).

Last verified: 2026-09-20.

---

## 1. Platform inventory

| Platform | What it is | URL / identifier | Access method |
|---|---|---|---|
| **Hetzner Cloud** | The VPS provider. Owns the box. | Project `14049062`, server `125828489` | Web console + REST API token |
| **Coolify** | Self-hosted PaaS on that box. Builds/deploys containers, manages env vars, terminates TLS via Traefik. | `http://<server-ip>:8000` | Web UI (email+password) + API token |
| **GitHub** | Source for all three services. Coolify deploys from `main`. | `erenbesli44/doviz`, `erenbesli44/tracker` | SSH key / PAT |
| **Cloudflare / DNS** | `dovizveri.com` + `api.dovizveri.com` A-records → server IP. No CDN in front (verified: `dig` returns the origin IP directly). | — | registrar login |

### The server

```
name      jagermeister-1
type      CX23 — 2 vCPU, 4 GB RAM, 40 GB disk
region    eu-central (Helsinki)
os        Ubuntu 24.04 (noble), kernel 6.8.x
swap      NONE CONFIGURED   ← see Known issues
```

2 vCPU / 4 GB is modest for what it runs. Docker image builds are the heaviest
thing it does, and **two concurrent builds will saturate it**. Always deploy one
service at a time.

---

## 2. What runs on the box

Thirteen containers. Coolify manages all of them.

**Platform layer (Coolify's own):**

| Container | Role |
|---|---|
| `coolify` | The PaaS web app (Laravel) |
| `coolify-db` | Postgres 15 — Coolify's own state |
| `coolify-redis` | Redis 7 — queues |
| `coolify-realtime` | Websocket push for the UI |
| `coolify-sentinel` | Metrics agent |
| `coolify-proxy` | **Traefik v3.6** — terminates TLS, routes all public traffic |

**Application layer:**

| App | Coolify UUID | Public URL | Source |
|---|---|---|---|
| `doviz-ui` | `xzlh50wclbz58hq3c18kd5mc` | `https://dovizveri.com` | `doviz` / `liquid-economy` |
| `doviz-api` | `v2rjz0t9by9f1ssp145zcql2` | `https://api.dovizveri.com` | `doviz` / `finance-api` |
| `tracker-api` | `t122yraee5v724x7tonr3d6g` | `http://<uuid>.<ip>.sslip.io` | `tracker` repo |
| `tracker-db` | — | internal only | Postgres 16 |

### Request flow

```
browser ──► Traefik ──► doviz-ui (nginx)
                          └─ /api/* proxied, injects X-API-Key
                             ──► doviz-api (FastAPI)
                                   ├──► Finnhub / FMP / CoinGecko   (market data)
                                   └──► tracker-api                 (YouTube analysis)
                                          └──► tracker-db (Postgres)

iOS app ──────────────────────────────────► tracker-api  (direct, X-API-Key)
```

**Key coupling:** `doviz-api` proxies to `tracker-api`. If the tracker is down,
`/v1/news/*` and `/v1/channels/*` fail. The iOS app depends on `tracker-api`
*only* — it does not touch `doviz-api`.

---

## 3. Credential policy

**Never commit secrets.** Store them in a password manager (1Password/Bitwarden)
and reference them here by name only.

| Credential | Where it lives | Notes |
|---|---|---|
| Hetzner API token | vault → `hetzner/api-token` | Full project control **including server deletion**. Read-only isn't available; treat as root. |
| Hetzner console login | vault → `hetzner/console` | Enable 2FA. |
| Coolify UI login | vault → `coolify/admin` | — |
| Coolify API token | vault → `coolify/api-token` | Can read **all app env vars** → effectively discloses every secret below. Highest-value target. |
| Server root SSH | **key-based only** (`~/.ssh/id_ed25519`) | Password auth should be disabled — see Known issues. |
| App secrets (`GEMINI_API_KEY`, `MINIMAX_API_KEY`, Twitter ×4, Webshare ×2, `FMP_API_KEY`, `FINNHUB_API_KEY`, `API_SECRET_KEY`, `TRACKER_API_KEY`, `DATABASE_URL`) | Coolify UI → app → Environment Variables | Mirrored locally in gitignored `finance-api/.env` and `liquid-economy/.env.local`. |
| iOS `TRACKER_API_KEY` | `Secrets.xcconfig` (gitignored) | Template: `Secrets.sample.xcconfig`. |

Local files that legitimately hold secrets and **are** gitignored — keep it that way:
`finance-api/.env`, `liquid-economy/.env.local`, `tracker-ios-app/.../Secrets.xcconfig`.

---

## 4. Monitoring

Nothing is currently automated. Everything below is manual. Setting up even a
basic uptime check is the highest-value improvement available (see Known issues).

### 4.1 Health endpoints — the fastest check

```bash
for u in https://dovizveri.com/ \
         https://api.dovizveri.com/v1/health \
         http://<tracker-host>/health; do
  printf "%-46s " "$u"; curl -sS -m 15 -o /dev/null -w "%{http_code}\n" "$u"
done
```

Expected: `200`, `200`, `200`.

**Reading failures:**

| Symptom | Meaning |
|---|---|
| `503` + body `no available server` | Traefik is alive, the backend container is down. Check Coolify. |
| `404` on a known route | Traefik has **no route at all** — the container doesn't exist. Needs redeploy, not restart. |
| Connects but returns nothing (`ttfb=0`) | The host is resource-starved. Check Hetzner metrics. |
| DNS resolves, no TCP | Host down or firewalled. |

### 4.2 Hetzner metrics — the ground truth for host health

This is what diagnosed the Sep-2026 incident. Needs only the API token.

```bash
HZ=<hetzner-token>
START=$(date -u -v-6H +%Y-%m-%dT%H:%M:%SZ); END=$(date -u +%Y-%m-%dT%H:%M:%SZ)
curl -sS -H "Authorization: Bearer $HZ" \
  "https://api.hetzner.cloud/v1/servers/125828489/metrics?type=cpu&start=$START&end=$END&step=300"
```

`type` accepts `cpu`, `disk`, `network`.

**Baselines (healthy):**

| Metric | Normal | Alarm |
|---|---|---|
| CPU | 40–90% (of 200% = 2 cores) | **sustained >180%** |
| Disk read | low, bursty | sustained >500 MB/s |
| Disk write | low | — |
| Network | small but non-zero | — |

> CPU is reported out of **200%** because there are 2 vCPUs. 200% = both cores pinned.

**Interpreting combinations:**
- High CPU + high *network* → possible cryptominer / compromise
- High CPU + high disk *read* + ~no network → runaway local process (this was the Sep-2026 case)
- Everything slow + `df` near 100% → disk full

### 4.3 Coolify API — per-app status

```bash
TOKEN=<coolify-token>
API=http://<server-ip>:8000/api/v1
curl -sS -H "Authorization: Bearer $TOKEN" "$API/applications"
curl -sS -H "Authorization: Bearer $TOKEN" "$API/servers/<server-uuid>/resources"
```

Status strings: `running:healthy` · `running:unknown` (up, but no healthcheck
configured — not an error) · `exited:unhealthy` (down).

Useful endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /applications` | All apps + status |
| `GET /applications/{uuid}` | Detail, git ref, scheduled tasks |
| `GET /applications/{uuid}/envs` | **Env vars — handle as secret** |
| `GET /applications/{uuid}/logs?lines=N` | Container logs (**only while running**) |
| `GET /applications/{uuid}/start` \| `/stop` \| `/restart` | Lifecycle (yes, GET) |
| `GET /deployments` | In-flight deployments |

### 4.4 Host-level (SSH, key auth)

```bash
ssh root@<server-ip> 'uptime; free -h; df -h /; docker ps -a --format "{{.Names}}\t{{.Status}}"'
ssh root@<server-ip> 'ps -eo pid,pcpu,pmem,etime,comm --sort=-pcpu | head'
ssh root@<server-ip> 'for c in $(docker ps -aq); do \
  echo "$(docker inspect -f "{{.RestartCount}} {{.Name}}" $c)"; done | sort -rn | head'
```

A high `RestartCount` means a crash loop. All-zero rules it out.

---

## 5. Common operations

**Restart an app**

```bash
curl -sS -H "Authorization: Bearer $TOKEN" "$API/applications/<uuid>/restart"
```

**Deploy** — push to `main`; Coolify builds from the repo. Build one at a time.

**Check what's deployed** — `git_commit_sha` from `GET /applications/{uuid}`.
Note: routes that exist only in uncommitted local files will 404 in production.
Deployment follows `main`, not your working tree.

---

## 6. Incident playbook

Derived from the 2026-09-20 outage.

**1 · Classify from outside.** Health endpoints + `ping` + port check. Distinguish
*host down* / *proxy up, backends down* / *host starved*.

**2 · Check host metrics** via the Hetzner API before touching anything. CPU,
disk read/write, network — the combination identifies the cause (§4.2).

**3 · Check Coolify.** If its API is slow but static pages load, the box is
starved, not Coolify itself.

**4 · Reboot if starved.** `POST /v1/servers/{id}/actions/reboot` (graceful).
Use `/actions/reset` only if that fails. Rescue mode if you need to inspect
without Docker running.

**5 · Restart apps one at a time,** waiting for each to go healthy.

**6 · Verify the full chain,** not just health endpoints — `doviz-api` proxies to
`tracker-api`, so test a route that crosses the boundary (`/v1/news/latest`).

---

## 7. Known issues / backlog

| # | Issue | Impact | Fix |
|---|---|---|---|
| 1 | **No monitoring or alerting.** Both apps were down for weeks (`doviz-api` 24 days, `tracker-api` 38) with nobody notified. | Silent outages | Uptime check on the 3 health endpoints (UptimeRobot/Healthchecks.io) |
| 2 | **No swap.** 4 GB RAM, zero swap → OOM killer acts immediately. | Hard kills under pressure | Add 2–4 GB swapfile |
| 3 | **Root SSH password auth enabled** on a public IP. | Brute-force surface | Key auth is now installed; set `PermitRootLogin prohibit-password`, restart sshd |
| 4 | **YouTube ingestion is unscheduled.** No Coolify scheduled task; newest video is 2026-07-22. | Tracker silently stops collecting | Add scheduled task, or cron → `POST /ingestions/youtube` |
| 5 | `tracker-api` has **no healthcheck** → shows `running:unknown`. | Coolify can't detect failure | Enable healthcheck on `/health` |
| 6 | **169-day uptime before reboot**, large unattended-upgrades backlog incl. kernel. | Pending-update churn; kernel fixes unapplied | Schedule periodic reboots after kernel updates |
| 7 | iOS app **disables TLS validation** (`InsecureSessionDelegate`) and talks plain HTTP to a raw IP, sending its API key in clear. | API key interceptable | Give tracker a real domain + HTTPS; remove the delegate |
| 8 | iOS base URL is a **hardcoded Coolify sslip.io host** containing the container UUID. | Container recreation breaks the app; needs App Store release to fix | Move to a stable domain + xcconfig |

---

## 8. Quick reference

```
Hetzner project / server   14049062 / 125828489
Server                     jagermeister-1 · CX23 · Helsinki
Coolify server UUID        wg45ldzrfmdyewkrjjgxosi3

doviz-ui      xzlh50wclbz58hq3c18kd5mc   https://dovizveri.com
doviz-api     v2rjz0t9by9f1ssp145zcql2   https://api.dovizveri.com
tracker-api   t122yraee5v724x7tonr3d6g   http://<uuid>.<ip>.sslip.io

Hetzner API   https://api.hetzner.cloud/v1
Coolify API   http://<server-ip>:8000/api/v1
```

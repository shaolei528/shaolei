# ABYSSAL WAKE – Cloudflare Game Site and Realtime Relay

The root Wrangler project serves the selected 3/4-camera candidate as static assets and keeps the existing Cloudflare Worker + Durable Object realtime relay. The public game entry is `/`; `/health` and `/ws` stay routed through the Worker.

## Endpoints

- `GET /health` — health check
- `GET /` – the packaged 3/4-camera game entry
- `WebSocket /ws` — realtime game transport using protocol `abyssal-relay-v1`

The Durable Object uses the WebSocket Hibernation API, so idle rooms can hibernate while browser WebSocket connections remain attached to Cloudflare's network.

## Prepare and deploy

Install the repository's Node dependencies, then from the repository root:

```sh
npm install
npm run build:site
npm run deploy
```

`build:site` copies an explicit allowlist into a content-addressed `.cloudflare-site-*` directory and points Wrangler at that directory. It includes the 3/4 entry, its V21 runtime modules, and the required existing gameplay sheets. It does not package V17 entry pages, tests, documentation, or art-intake folders. Previous build directories are preserved. The local manifest detects unexpected edits and extra files and stops without removing them. Wrangler deploys the Worker and static files together.

The worker's Durable Object and Relay protocol are unchanged. Relay delivery is not authoritative world simulation or persistent player saving. The public candidate still requires visual, mobile, gameplay-loop, and sustained co-op acceptance before it can be called production-ready; the current terrain art verdict is REVISE.

## Current release check — 2026-10-19

- **Local package:** `npm run build:site` succeeded with 98 public files (0.64 MiB) in `.cloudflare-site-324189090211`. This verifies the local static package only.
- **Public entry:** [`main/index.html`](https://raw.githack.com/shaolei528/shaolei/main/index.html) still displays V17f. The current local checkout is on `fix/awakening-production-gate-qa-findings-v1` at `54d294a` with a mixed, dirty worktree; no new commit or push was made.
- **Wrangler authentication:** verified 2026-10-19 with Wrangler 4.151.1: the current environment is not authenticated. `npx wrangler deploy --dry-run --outdir=.wrangler-dist` succeeded and read 138 packaged assets with the `WORLD` Durable Object binding, but this is local validation only. `npm run check:worker` currently fails because this checkout has no local `wrangler` executable installed. No Worker/site deployment was attempted.
- **Manual play:** UNKNOWN. The domain route and water collision regressions pass, but this turn could not inspect or play the browser page. The first-expedition test still advances world positions directly, so it does not prove ordinary-input completion or that the game feels fun.
- **Release acceptance:** the ordinary-input combat-and-return loop, persistent save reload, public Relay behavior and sustained two-client co-op remain unverified. A successful package build is not production acceptance.

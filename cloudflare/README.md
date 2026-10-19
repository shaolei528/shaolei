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

- **Local package:** `npm run build:site` succeeded with 100 public files (0.66 MiB) in `.cloudflare-site-0236434a53b7`. Wrangler dry-run read 140 static assets and recognized the `WORLD` Durable Object binding. Both checks are local validation, not deployment.
- **Public entry:** public `main` remains at `6a7f107e9447ea949695e02b2160abd1786dea89`; a fresh `raw.githack.com/shaolei528/shaolei/main/index.html` request returned HTTP 200 and still contains V17f. The selected 3/4 graybox is on `feat/unified-graybox-slice-v1` at `d9d73dde73b1ab54e96ed61ee0d75013e2ebe354`, with draft [PR #4](https://github.com/shaolei528/shaolei/pull/4). The fixed-commit candidate URL returned HTTP 200: https://raw.githack.com/shaolei528/shaolei/d9d73dde73b1ab54e96ed61ee0d75013e2ebe354/prototypes/successor-3-4/live-candidate.html.
- **Wrangler authentication:** verified 2026-10-19 with Wrangler 4.151.2: this environment is not authenticated. No Worker/site deployment was attempted. Requests to the existing Relay `/health` endpoint failed before an HTTP response in this environment, so its current availability is UNKNOWN.
- **Manual play:** UNKNOWN. The fixed-commit page is retrievable, but this turn did not capture or inspect gameplay in the browser. The focused collision/render checks do not establish that the player's feet align with the shoreline in the actual page or that the game feels fun.
- **Release acceptance:** current-browser play, persistent save reload, sustained two-client co-op, and Cloudflare deployment remain unverified. Keep PR #4 a draft until those player-facing checks pass.

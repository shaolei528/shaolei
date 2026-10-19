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

- **Merged source:** PR [#4](https://github.com/shaolei528/shaolei/pull/4) was merged to public `main` at `f61903bd8733f6629c49bf38d874ea77f0b236ab`. The merge makes the selected 3/4 graybox the current GitHub source; it does not establish that the full game is fun or release-ready.
- **Share links:** development: https://raw.githack.com/shaolei528/shaolei/main/prototypes/successor-3-4/live-candidate.html. Stable pinned build: https://rawcdn.githack.com/shaolei528/shaolei/f61903bd8733f6629c49bf38d874ea77f0b236ab/prototypes/successor-3-4/live-candidate.html. Both returned HTTP 200 in the release check; this confirms static retrieval only.
- **Local package:** `npm run build:site` succeeded with 100 public files (0.66 MiB); Wrangler dry-run read 140 static assets and recognized the `WORLD` Durable Object binding. These checks are local validation, not deployment.
- **Relay:** GitHub Actions on the merged PR confirmed the existing `/health` endpoint and a live two-client relay/reconnect flow. This confirms the already-running relay at that CI check, not a new Worker deployment or full gameplay synchronization.
- **Cloudflare deployment:** Wrangler 4.151.2 reports this environment is unauthenticated. No new Worker/site deployment occurred. Deploy after Wrangler is authenticated to the permanent Cloudflare account, then verify the deployed `/health` endpoint and two clients.
- **Manual play:** UNKNOWN. The current in-app browser reports the 8876 QA preview as connection refused; browser inspection of the separate 8883 tab is blocked by a saved access policy. Do not claim ordinary-input play, game feel, or fun from static retrieval or automated tests.
- **Release acceptance:** ordinary-input full loop, persistent save reload, sustained co-op gameplay, and Cloudflare deployment remain unverified. The public source is updated, but player-facing acceptance is still required.

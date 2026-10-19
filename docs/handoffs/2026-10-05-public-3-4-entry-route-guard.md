# Public 3/4 entry route guard — 2026-10-05

## Finding

The packaged root and top-level `survival-v21.html` route already point visitors to the 3/4 candidate. A direct request for `survival-v7.html` could still open the inherited V21/V7 UI runtime as a separate page. The successor candidate still loads V21, whose `mountUI()` fetches `survival-v7.html` and reads its styles/body as the UI shell.

## Change and boundary

- **Lead:** Integration & QA, for release routing and acceptance evidence.
- **Partners:** UI & Map and Rendering & Camera, for the player entry and 3/4 destination.
- **Interface:** packaged `survival-v7.html` redirects only when opened as a top-level page (`window.top === window.self`). V21's `fetch('./survival-v7.html?ui='+VER)` still receives the same UI shell; fetched scripts are stripped before its styles/body are mounted.
- **File scope:** `cloudflare/build-site.mjs`, the newly generated content-addressed Cloudflare package, `wrangler.jsonc` asset-directory pointer, and this handoff/project-state record.
- **Boundary:** local historical source files remain intact. No gameplay state, save, network protocol, Relay route, asset, or Durable Object migration changed. Previous generated release folders were preserved.

## Verification

- `node --check cloudflare/build-site.mjs` — PASS.
- `npm run build:site` — PASS; 56 files (0.34 MiB) prepared at `.cloudflare-site-46fe2ebb4c11`.
- Packaged V7 contains the top-level redirect and keeps its UI `gate`; packaged V21 has its existing top-level redirect; packaged candidate sets `AW_DEV_QA=false` — PASS by source/package inspection.
- `node tests/successor-live-candidate-v1.test.mjs` — PASS.
- `node tests/successor-camera-adapter-v1.test.mjs` — PASS.
- Current loop regressions `awakening-expedition-loop-v1.test.mjs`, `awakening-home-workbench-upgrade-v1.test.mjs`, `awakening-world-v1.test.mjs`, and `successor-natural-route-v1.test.mjs` — PASS. The fixtures cover session-local route phases/required salvage, HOME Field Rig costs, POI/collision data, and a natural HOME-to-OUTSIDE route. These remain logic fixtures, not rendered gameplay acceptance.
- Follow-up serial regression sweep — PASS, all 56 current `tests/*.test.mjs` files. This is local fixture evidence only; it does not establish browser/mobile/player acceptance.
- `git diff --check` — PASS (existing unrelated CRLF conversion warnings only).

## Release status and unknowns

- **Production art gate:** BLOCKED. `npm run validate:awakening-assets` exits 1 with `ERROR missing manifest.json`; `assets=0 files=0` indicates nothing was validated from a production manifest. The current candidate can use existing V21 art/fallbacks, but it has no production-art acceptance.
- **Browser navigation:** UNKNOWN. The browser inventory had no open game tabs; opening the configured Workers.dev root in the in-app browser returned `net::ERR_BLOCKED_BY_CLIENT`, and the web reader also could not access it. These are tool-side access failures, not evidence that the Worker is down; neither the redirect nor live page response was observed.
- **Desktop/mobile quality:** UNKNOWN for the exact new package; prior candidate art remains REVISE pending fresh screenshots and gameplay checks.
- **Cloudflare deployment:** NOT DEPLOYED. Wrangler, Cloudflare deployment credentials, and a Cloudflare deployment connector are unavailable. No public URL was created.
- **Worktree:** branch `fix/awakening-production-gate-qa-findings-v1`, HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`; the worktree has broad modified and untracked content of mixed/unknown provenance. No unrelated files were changed.

# Successor menu route copy fix — 2026-10-05

## Confirmed issue

The visible 3/4 candidate menu used a shared shell footer that said `V21 · 像素地表 · SafeCamp · Cloudflare WebSocket Relay`. This described internal implementation details and the previous view instead of the selected 3/4 experience.

## Narrow change

- **Lead:** UI & Map. **Partners:** Rendering & Camera, Integration & QA.
- **Interface:** the 3/4 entry sets `window.AW_SUCCESSOR_VIEW='34'` before booting modules; the shell reads it and updates only `.shell-status`.
- **Player label:** `3/4 斜俯视 · 海岸营地 · 探索后归来`.
- The V21 menu keeps its original footer when that flag is absent. The V7 shared template remains unchanged.
- Files changed: `modules/ui/game-shell-v1.js`, `prototypes/successor-3-4/live-candidate.js`, `prototypes/successor-3-4/preview.js`, and focused UI/entry tests.
- Save settings, player save data, Relay, network protocol, simulation, and interaction remain unchanged.

## Verification

- `node --check` for the shell module, live candidate entry and guarded preview — PASS.
- `tests/game-shell-v1.test.mjs` — PASS; a VM check verifies both that 3/4 gets the new copy and that the V21 route without the flag retains its label.
- `tests/successor-live-candidate-v1.test.mjs`, `successor-camera-adapter-v1.test.mjs`, and `successor-touch-controls-platform-visibility-v1.test.mjs` — PASS.
- `tests/module-sort.test.mjs` — PASS; root/module compatibility copies, save shape and Relay protocol stayed stable.
- `tests/cloudflare-site-entry-redirect-v1.test.mjs` and `cloudflare/test.mjs` — PASS.
- Release preparation produced `.cloudflare-site-78157c1f1fe6` (56 files, 0.34 MiB). All manifest hashes match, and the 3/4 entry flag plus its menu copy are present in the package.

## Acceptance boundary

The browser blocked localhost after a prior security-review timeout, so a post-fix screenshot is **UNKNOWN**. Package preparation is local only; no Cloudflare deployment occurred. Production art, physical-phone view, public co-op, persistence and the complete HOME → POI → return/growth loop remain open.

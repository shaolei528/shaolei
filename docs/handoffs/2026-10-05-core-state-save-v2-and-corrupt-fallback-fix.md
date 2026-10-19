# Handoff — Core State & Save V2 and corrupt V5 fallback fix

Date: 2026-10-05 (Asia/Rangoon)  
Status: narrow local bug fix plus DRAFT module-card update; no commit, merge or deployment.

## Evidence checked

- Repository: `C:\Users\MECH\Documents\ChatGPT\游戏编程\abyssal-wake-integration`
- Branch / HEAD at start: `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`.
- Worktree was already heavily modified and contained untracked files. Provenance is unknown. Preserve them; do not clean/reset or attribute them to this handoff.
- Active V21 boot loads `modules/core/runtime-state.js` first. V5 player save uses `abyssal_wake_save_v5`; legacy fallback uses `abyssal_wake_save_v4`.

## Confirmed bug and bounded repair

Before the repair, one `try/catch` covered both V5 parsing/restoration and V4 fallback. A malformed V5 JSON threw before the V4 read, so an available valid V4 save was ignored. The original migration fixture did not cover this pair; adding the case first failed as expected (`inventory.wood` remained 0 instead of restoring V4's 2).

The current working copy now isolates the V5 attempt from the V4 attempt in both `modules/core/runtime-state.js` and the legacy aggregate `game-core.js`, which is still referenced by older page versions. A V5 error can reach the existing V4 migration path. It does not delete or overwrite the corrupt V5 key and does not change key names, schema, migration fields or Relay behavior.

## Documentation routing

- Added `docs/content-inbox/2026-10-05-core-state-save-module-card-v2.md`; V1 is preserved as history.
- Updated `docs/SUCCESSOR_MODULE_MAP.md` canonical card and V21 crosswalk to V2.
- Added the current status and limits to `docs/PROJECT_STATE.md`.
- The V2 corrects obsolete 48-hour V5 expiry wording, marks local-storage key enumeration incomplete, separates player save/HOME/Guide/gameplay/settings/session/Relay boundaries, and limits visual QA to player-visible save/recovery UI.

## Validation

- `node tests/player-save-v5-migration.test.mjs` — PASS: old V5 restore, valid V5 priority, V4 fallback, malformed V5 with valid V4 fallback in both split runtime and legacy aggregate.
- `node tests/awakening-home-workbench-upgrade-v1.test.mjs` — PASS: adjacent HOME persistence/cost/Relay contract.
- `node tests/successor-module-routing-contract-v1.test.mjs` — PASS: 27 canonical owners, 27 cards, zero broken links/duplicate owners/missing triggers/missing interfaces.
- Full serial test set: 59/60 PASS. `tests/module-sort.test.mjs` fails at `game-play.js must reconstruct from categorized parts without semantic drift`; root aggregate and split gameplay modules have unrelated/unknown working-tree differences. Its Core/game-core reconstruction check passes before that gameplay assertion. Do not modify gameplay modules/aggregate under this save task; handle the mirror drift as a separately scoped audit.

These are local fixture/source tests, not browser refresh, privacy/quota, multi-tab, cross-device or live-world save acceptance. Complete storage-key/write-site inventory remains **PLANNED / UNKNOWN**. `saveLocal()` failure feedback must be checked through its individual callers before claiming players are informed. No art or runtime visual changed; actual successor art quality is outside this data-only fix.

## Exact attribution limit

Only the two `loadLocal()` exception boundaries, their shared migration fixture, the Core State & Save V2 routing, project-state note and this handoff are in this task's scope. `runtime-state.js`, `game-core.js`, the fixture and project docs already had unrelated/unknown working-tree changes; inspect final diffs before any later commit and keep all unrelated work intact.

# HOME Workbench storage failure fix - 2026-10-05

## Scope and owners

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- **Lead:** HOME & Building, Field Rig upgrade transaction.
- **Partner:** Core State & Save, V5 inventory writer result.
- Files: `modules/safe-camp/home-workbench-upgrade-v1.js`, `modules/core/runtime-state.js`, its reconstructed aggregate `game-core.js`, focused HOME regression test, and this contract/status record.
- Interface: existing `saveLocal()` keeps writing the same key and V5 payload; it now returns boolean write success. HOME consumes that result and rolls back the Field Rig transaction on a reported failure. No UI state authority, item schema, cost, Relay event or backend boundary changed.

## Confirmed bug

An isolated VM run supplied 3 stone, 2 shards and a valid return clearance. Its storage accepted `abyssal_home_workbench_v1` reads but threw on writes to that key, while accepting the regular V5 player save. The old code reported the upgrade successful, persisted zero stone/zero shards, but a reload restored Field Rig tier 1 and no clearance. This was a reproducible material-loss path.

## Repair and evidence

- The Field Rig module snapshots tier, clearance and resource counts before attempting the upgrade.
- If its dedicated HOME write fails, it restores the snapshot and does not call the player save.
- If the HOME write succeeds but `saveLocal()` returns false, it restores the snapshot and attempts a compensating HOME write.
- `saveLocal()` reports success only after the existing V5 `setItem` returns normally. The serialized V5 object and `abyssal_wake_save_v5` key are unchanged.
- **PASS, run serially:** `awakening-home-workbench-upgrade-v1.test.mjs` (successful upgrade plus HOME-write and player-write failures), `awakening-expedition-loop-v1.test.mjs`, `module-sort.test.mjs`, `player-save-v5-migration.test.mjs`, `field-ward-duration-regression.test.mjs`, `expedition-ward-hud-feedback.test.mjs`.
- **PASS:** `node --check` for `modules/core/runtime-state.js`, `game-core.js`, `modules/safe-camp/home-workbench-upgrade-v1.js`; scoped `git diff --check`.

## Limits

The tests use a VM storage shim, not browser quota or private-mode behavior. HOME tier and player inventory remain in two separate localStorage keys. The code compensates synchronous write failures, but an abrupt process/tab termination between two successful writes is not crash-atomic. No browser gameplay, persistent user save or real device was used in this fix.

## Shared-worktree note

The active worktree is broadly dirty. This scoped change was applied after verifying these four tracked files' current content. Unrelated and untracked work remains untouched; this does not authorize merge, cleanup or deployment.

# Regression Follow-up: Legacy Gameplay Aggregate

Date: 2026-10-04 (Asia/Rangoon)

## Scope

Targeted a newly observed failure in the complete serial test sweep while preserving the shared dirty worktree. No gameplay, network, save, or production-art runtime code was changed in this follow-up. Two test assertions in successor camera QA were aligned with current UI wording and labels.

## Verified

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Final serial suite: 48 tests total, 47 passed, 1 failed.
- Passing natural route fixture reaches the authored `poi:store:shelf-food-b` through movement simulation and exercises V21 terrain and POI collision.
- Passing targeted combat and network fixtures are listed in `PROJECT_STATE.md`; they remain local deterministic checks, not live multiplayer acceptance.

## Remaining stable failure

`tests/module-sort.test.mjs` fails because it requires root `game-play.js` to reconstruct byte-for-byte from the current split modules. The active V21 boot list loads split files, where `simulation-update.js` dispatches through `ABYSSAL_MOB_COMBAT_V1`; the root aggregate still directly invokes `updateMobs(dt)`.

The root aggregate is still referenced by older `survival-v*` entrypoints and CI. More directly, the current local `index.html` links to `survival-v17.html`, which loads `game-play.js`; public-host routing was not checked. The mismatch includes mob-update dispatch and starter-zone aggro/camp-boundary logic, so this review cannot call the aggregate dead code. Rebuilding it from the changed split modules would also copy the mob cooldown payload extension (`mobId`, `hitCd`, `hitCdUntil`) into the default local V17 path. Project state explicitly marks that cross-client payload extension UNAPPROVED for integration until it receives a scoped decision. The aggregate was therefore preserved and the failing check reported as an unresolved compatibility boundary.

## Not established

- Whether the current local V17 link is meant to remain the supported player entrypoint while V21 develops in parallel.
- Whether the legacy aggregate should be synchronized, deliberately versioned, or excluded from the active module parity contract.
- Live Relay delivery, two-client authority handoff, browser/mobile presentation, and full-loop acceptance.

No commit, push, merge, deploy, reset, or cleanup was performed.

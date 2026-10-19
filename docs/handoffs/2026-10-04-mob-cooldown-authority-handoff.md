# Mob cooldown authority-handoff regression — 2026-10-04

**Status:** local deterministic fix and focused regressions pass; real two-client Relay acceptance remains UNKNOWN.  
**Lead:** Network & Co-op / Combat & Creatures.  
**Coordinates:** Integration & QA.  
**Branch / HEAD:** `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`.

## Finding and repair

The previous zone leader could set a mob's melee cooldown, broadcast `mob_hit` to another player, then hand off authority before the next mob snapshot. Receivers reset `hitCd` to zero, allowing a new leader to hit the same nearby player again before the original cooldown elapsed. A second case also needed coverage: when the leader itself was hit, the old code applied local damage but sent no mob state to its peers.

The current local change carries optional `mobId`, relative `hitCd`, and absolute `hitCdUntil` fields on the existing `mob_hit` event. Every hit now broadcasts mob state; the local target still receives exactly one immediate damage application, while remote peers synchronize the cooldown before applying target-only player damage. The Relay excludes the sender, so the local event is not applied twice. Periodic `mobs` and full `world` snapshots also carry both cooldown forms. Snapshot ingestion prefers a consistent deadline, falls back to the relative duration when client wall clocks differ, and keeps a newer known deadline when a stale legacy snapshot arrives. Legacy payloads still follow the original player-damage behavior; old clients can ignore the added fields.

Damage values, melee range, cooldown durations (`0.9s` crawler / `1.15s` other mobs), event names, save format, and collision logic are unchanged. No Relay transport or backend code was modified in this repair.

## Verification

- The new `tests/mob-cooldown-authority-handoff-v1.test.mjs` first failed against the old code because `mob_hit` had no mob identity. After the repair it passes remote-target and local-leader hit paths, cooldown restore, stale legacy snapshot, authority handoff → next simulation tick, full-world restoration, wall-clock skew fallback and legacy payload behavior.
- `node cloudflare/test.mjs` confirms the Relay delivers the added fields unchanged to another subscriber and does not echo the packet to its sender.
- Passed serially: the new handoff regression; `awakening-world-logic-hardening-v1.test.mjs`; `field-ward-duration-regression.test.mjs`; `network-disconnect-simulation-pause.test.mjs`.
- `node --check` passed for all four touched runtime files. `git diff --check` reported only line-ending conversion warnings; no whitespace errors.
- The existing shared worktree was already dirty. Its unrelated edits remain untouched; no commit, push, merge, deploy, or live Relay test was performed.

## Remaining verification

Run two clients in one isolated test session and verify one hit event, leader disconnect/handoff, no early repeat before the remaining cooldown, then a normal hit after expiry. Also verify a real newly joined client receives the periodic cooldown deadline. Do not claim multiplayer acceptance until that check passes.

## Older V17C aggregate compatibility and full local regression — 2026-10-04

The repository's `module-sort.test.mjs` initially failed because `survival-v17c.html` still loads the root aggregates `game-core.js` and `game-play.js`, while the cooldown fix had advanced only in their canonical split modules. Rebuilt those two aggregate files from the exact module lists already declared by the test. `node tests/module-sort.test.mjs` now passes byte-identical reconstruction, load-order, save-key and Relay-protocol checks. V21 continues to load split modules directly.

The natural-route fixture briefly failed while its untracked test was changing in the shared worktree; a fresh run of the current fixture passed and reached the real MIRE MART interaction while registering authored POI collision. The test file was not edited during this repair and its provenance remains unknown.

All 46 current `tests/*.test.mjs` files passed when run individually and serially after the aggregate rebuild. This remains local fixture evidence only: real browser/device play, live Relay and two-client authority handoff remain UNKNOWN. Branch and HEAD were unchanged; no commit, push, merge, deploy or cleanup was performed.

# HOME -> POI -> return loop source review - 2026-10-04

**Status:** VERIFIED SOURCE REVIEW / LIVE PLAYER ACCEPTANCE UNKNOWN.
**Lead module:** World, POI & Exploration.
**Coordinates with:** HOME & Building, Rendering & Art, Network & Co-op, Integration & QA.

## Source findings

- `survival-v21.html` loads `modules/world/awakening-world-v1.js`, `modules/world/awakening-expedition-loop-v1.js`, and `modules/safe-camp/home-workbench-upgrade-v1.js` in that order.
- The expedition service defines a session-local phase sequence from preparation through MIRE MART salvage and return. It requires 2 shards; its source rejects early return and does not treat death/respawn as successful completion.
- Successful return records local HOME upgrade clearance. The existing Field Rig costs 3 stone + 2 shards and changes the next departure ward from 15 seconds to 25 seconds. Tier and clearance are persisted under the separate `abyssal_home_workbench_v1` key.
- The current Field Rig presentation is a row in the crafting panel plus quest/toast text. No Field Rig tier/API reference was found under `modules/render/`; the upgrade does not currently change the visible camp structure.
- V21 movement/simulation is gated by `zoneConnected`; entering through the normal V21 UI starts Relay connection and zone subscription. The isolated 3/4 camera prototype is not part of the V21 boot path, so it cannot prove this loop or the production camera.

## Evidence limits

- This is a source-only review. No test was run in this review, no live expedition was played, and no public Relay room was entered.
- Prior PROJECT_STATE notes report focused local fixture tests for this loop; those results do not establish browser/mobile feel, physical touch, live collision, Relay recovery, or two-client authority.
- The full HOME -> POI -> exploration/combat/salvage -> return -> visible HOME growth experience remains **UNKNOWN / INCOMPLETE** as player-facing acceptance.

## Recommended next slice

After the camera/material direction is settled, implement one read-only world-space appearance for the existing Field Rig tiers using the existing tier API. Keep cost, ward duration, storage key, gameplay authority, collision, and Relay behavior unchanged. First confirm a stable HOME placement/occlusion contract; do not add a duplicate tier state. This is a draft recommendation, not authorization to implement.

## Worktree snapshot

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Existing dirty and untracked work was preserved; its provenance remains unknown.

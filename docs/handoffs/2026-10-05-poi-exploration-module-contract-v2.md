# POI & Exploration V2 module contract handoff

Date: 2026-10-05 (Asia/Rangoon)
Lead: POI & Exploration
Scope: current-source audit, modular owner contract and regression evidence
Status: DRAFT / NOT IMPLEMENTED as a separate successor service

## Baseline

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD at inspection: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Shared worktree has unrelated dirty/untracked changes with mixed/unknown provenance. Preserved.
- V21 `awakening-world-v1.js` statically defines MIRE MART geometry and interaction/resource content; no independent generic POI discovery registry or persistence contract was confirmed.
- `ABYSSAL_EXPEDITION_LOOP_V1` owns one session-local V21 operational phase machine. It observes the current total `inventory.shard >= 2`, not source IDs or expedition inventory delta. Already-held shard can satisfy the threshold after reaching `SEARCH_FIGHT`; this does not prove the resource came from MIRE MART. Current route copy may imply provenance the state machine does not prove. This is an existing behavior/design wording risk, not a reproduced bug.
- V12 interaction handling changes local inventory/save and broadcasts non-camp `harvest` cooldown identity/expiry. That is not shared discovery or team expedition authority. Combat/loot/inventory paths remain mixed V21 implementation.
- Expedition completion requests HOME Workbench return clearance; HOME owns its independent persistence/material/tier state. This does not make the expedition phase persistent.

## Independent review

A read-only reviewer audited the V1 and current source boundaries, then reviewed the V2 core excerpts. It confirmed the POI definition/discovery/attempt separation, total-shard provenance caveat, harvest broadcast semantics, owner boundaries and historical-REVISE/current-UNKNOWN visual distinction. No severe misstatement was found. The full V2 card has five separate future player-experience outcomes and a test-scope section.

## Artifacts

- [`POI & Exploration V2`](../content-inbox/2026-10-05-poi-exploration-module-card-v2.md) replaces V1 in canonical module routing and keeps V1 as history.
- It defines five-game player outcomes, current V21 facts, owner boundaries, future POI event/save/co-op requirements, pixel-art/runtime gates and a one-module AI prompt.
- No new POI content or art was generated this pass. The existing MIRE MART signal idea remains unselected draft content.

## Verification

- **PASS:** `awakening-expedition-loop-v1`, `awakening-world-logic-hardening-v1`, `terrain-v21`, `successor-natural-route-v1`, `successor-live-candidate-v1`, `successor-live-screen-movement-v1`, `successor-module-routing-contract-v1` (27 canonical owners/cards, 0 broken links/duplicate owners/missing triggers/interfaces), `module-sort` (byte-identical reconstruction and load order preserved), and `git diff --check`.
- **FAIL / repeated stale assertion:** `awakening-home-workbench-upgrade-v1.test.mjs:169` still expects `/Field Rig/` in player-facing objective text, while the active localized objective says “野外装备架”. The test stops at that assertion. This is a localization/test-contract mismatch, not proof the return/upgrade logic failed. The test and runtime contain mixed-worktree modifications and were not changed by this POI doc task; resolve separately with narrow owner review.
- `git diff --check` emitted line-ending conversion warnings for existing dirty files only. Manual trailing-whitespace scan of the POI V2 artifacts and routing/state documents is recorded after final verification.

## Limits and next step

No current production/successor paired screenshots, physical phone acceptance, persistent discovery service, shared multiplayer expedition authority or shard source attribution was verified. Historical 3/4 scene evidence is **REVISE** for the build reviewed in that report; current HEAD and production visual acceptance remain **UNKNOWN**. No runtime/tests/art/manifest/save/Relay/merge/deployment edits were made. Next module card in sequence: HOME & Building.

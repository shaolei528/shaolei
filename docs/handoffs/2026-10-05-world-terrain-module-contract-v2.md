# World & Terrain V2 module contract handoff

Date: 2026-10-05 (Asia/Rangoon)
Lead: World & Terrain
Scope: source-boundary audit and module handoff documents only
Status: DRAFT / NOT IMPLEMENTED as a unified successor service

## Baseline

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD at inspection: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- The shared worktree has many unrelated dirty/untracked files. Do not attribute or remove them.
- V21 uses world coordinates such as `me.x/y`, but update/writes and collision are distributed: `simulation-update.js`, `terrain-v21.js`, `world-spatial-v1.js`, and `awakening-world-v1.js` each participate in different paths.
- `terrain-v21.js` provides a bounded 24×20 / 64×64 world-unit Safe Camp slice with a separate collision grid and legacy behavior outside the slice. This is not a complete world terrain service or successor display-size contract.
- `world-spatial-v1.js` provides zone collider registration, point/circle collision, movement resolution and sampled melee LOS. It is a spatial query helper, not proof that all active collision has one authority.
- `awakening-world-v1.js` currently mixes MIRE MART/region content, geometry, terrain/prop/decal/FX drawing and wrappers. Future owner separation is planned; this card does not refactor it.
- The root V21 asset contract uses 64×64 source cells and nearest-neighbor rules. The separate successor density V2 proposal's 80×40/96×48 are comparison inputs, not frozen values.

## Independent source review

A separate read-only reviewer verified the distributed owner chain and advised keeping current code facts separate from the target canonical owner. It confirmed POI identity/discovery/operation belongs to POI & Exploration, HOME construction remains HOME & Building, and image pixels cannot decide collision. The reviewer also distinguished historic dual-viewport preview evidence from current-build proof.

## Visual and bug evidence

- A dated runtime visual handoff recorded a guarded preview at 1280×720 and 390×844 with repeated/coarse grass/shore, small actors and crowded mobile HUD; that build was **REVISE**. It is not verified as the exact current HEAD or production art.
- A separate terrain atlas semantic mapping repair was reported and tested in the successor renderer; the old grass IDs had sampled sand cells. The repair uses mirrored sampling from the available legacy atlas. Its mapped-code regression passed in its handoff, but a post-fix browser screenshot was not obtained; natural variation and pixel-art quality remain **REVISE / UNKNOWN**.
- The density contract still awaits Rendering & Camera decision. World & Terrain must not freeze screen-projection dimensions.

## Artifact and verification

- [`World & Terrain V2 card`](../content-inbox/2026-10-05-world-terrain-module-card-v2.md) replaces the V1 card in the canonical index and defines five-game player outcomes, one-owner boundaries, source facts, focused regressions, rollback scope and crisp dual-viewport gates.
- V1 remains historical. No new terrain art candidate was generated; user-provided artwork and current art contributor work are kept separate until a source/display contract is selected.
- **PASS:** `terrain-v21`, `awakening-world-v1`, `awakening-world-logic-hardening-v1`, `successor-live-screen-movement-v1`, `successor-natural-route-v1`, `successor-terrain-atlas-mapping-v1`, `successor-module-routing-contract-v1` (27 owners/cards, no broken links or duplicate owners), `module-sort` (byte-identical reconstruction/load order preserved), and `git diff --check`.
- **FAIL / unrelated stale preview assertion:** `successor-camera-adapter-v1.test.mjs:26` expects `preview.js` to read `awDevQa=1` and interpolate `devQa`. Current `preview.js` sets `window.AW_DEV_QA=false` unconditionally, matching the project-state direction to hide QA shortcuts from player views. Treat this as a preview test/code-contract mismatch for a separate Integration & QA task; it is not a World/Terrain failure. No preview code or test was edited.
- No runtime/test/art/manifest/save/Relay change was made by this documentation task. Git emitted only existing mixed-worktree LF-to-CRLF warnings.

## Not accepted

No current paired screenshot was captured during this documentation pass, no real phone was tested, and no production asset manifest or independent successor world was accepted. Current-build visual state and physical-device behavior remain **UNKNOWN**; historical preview remains **REVISE**.

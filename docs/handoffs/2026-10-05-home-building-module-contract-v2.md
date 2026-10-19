# Handoff — HOME & Building V2 module contract

Date: 2026-10-05 (Asia/Rangoon)

## Verified snapshot

- Repository: ABYSSAL WAKE integration checkout.
- Branch: `fix/awakening-production-gate-qa-findings-v1`.
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`.
- Worktree already contained extensive modified and untracked files before this documentation update. Their authorship is unknown; no existing dirty file or intake asset was removed or overwritten.
- V21 `modules/safe-camp/home-workbench-upgrade-v1.js` exposes `ABYSSAL_HOME_WORKBENCH_V1`, dedicated key `abyssal_home_workbench_v1`, return clearance, Field Rig tier, 3 stone + 2 shard cost, and departure ward duration. `HOME_WORKBENCH_UPGRADE_V1.md` constrains the value from 15 seconds to 25 seconds. Existing module accesses the legacy inventory object directly and persists its own small HOME record; do not describe this as the future Inventory transaction or Core Save adapter.
- V21 Safe Camp interactions and props remain distributed among legacy modules. The checked successor path snapshots camp props but does not establish a reusable building/placement service. Free placement, catalog, shared build authority and building save schema are not verified as existing.

## Decisions recorded as draft

- Created [`HOME & Building V2 module card`](../content-inbox/2026-10-05-home-building-module-card-v2.md), marked DRAFT / NOT IMPLEMENTED.
- Updated [`SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md) to route its one canonical HOME owner to V2.
- Updated [`PROJECT_STATE.md`](../PROJECT_STATE.md) with source distinctions, independent review boundary, open visual acceptance and this handoff.
- HOME owns future structure identity/layout/placement descriptions. World validates space/collision; Items applies resource changes; Crafting defines recipes and required station capability; Save persists state; Network owns shared authority; UI/Input send player commands; Rendering/Animation present snapshots; Asset Pipeline owns source-image contracts; QA checks integrated behavior.
- The five reference games are converted to separate future observable experience goals without copying their protected content or claiming those features exist.
- Field Rig visible tier art remains a distinct candidate task, avoiding overlap with the other AI's art work.

## Independent review

A second AI reviewed the boundary summary read-only. It agreed that the draft separates V21 single-upgrade behavior from future free building and emphasized station identity (HOME) versus recipe/station qualification (Crafting), source art (Asset Pipeline) versus display sizing/projection (Rendering), and the unimplemented nature of atomic Inventory/Save/shared build interfaces. This review is not user approval, implementation, or QA acceptance.

## Verification status

- `node tests/awakening-expedition-loop-v1.test.mjs`: PASS.
- `node tests/successor-module-routing-contract-v1.test.mjs`: PASS, 27 owners/cards, no broken links/duplicates/missing triggers/interfaces.
- `node tests/module-sort.test.mjs`: PASS, 14 unchanged source copies and 17 split parts reconstruct byte-identically; loader order preserved.
- `node tests/awakening-home-workbench-upgrade-v1.test.mjs`: FAIL at line 169. The test expects `/Field Rig/`, while the current Expedition objective text is Chinese “野外装备架”. This confirms a stale localized-copy assertion; it does not prove the underlying return/upgrade flow is defective. No runtime/test change was made in this docs-only task.
- `git diff --check`: PASS; Git emitted existing LF→CRLF working-copy notices for unrelated dirty files.

The handoff/card files are untracked in this shared checkout, so a separate direct whitespace scan was run on all four HOME V2 documents; it found no trailing whitespace.

Runtime visual acceptance is **UNKNOWN** for the current HOME build. No current same-build 1280×720 and 390×844 screenshots were captured. A passed source test does not establish art clarity, safe-area layout, physical-phone behavior or shared multiplayer.

## Scope and next owner

This handoff changes documentation only. It does not edit runtime, tests, art, manifests, Save, Relay, merge, deploy or clean unknown worktree content. Any future implementation must be a separately selected narrow task with exact files, regression scope, reversible changes, and real runtime visual evidence.

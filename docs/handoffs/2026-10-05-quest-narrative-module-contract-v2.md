# Quest & Narrative V2 module contract handoff

Date: 2026-10-05 (Asia/Rangoon)
Lead: Quest & Narrative
Scope: source audit, five-game criteria, module boundaries, handoff card only
Status: DRAFT / NOT IMPLEMENTED

## Source baseline

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD at inspection: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Many unrelated/unattributed working-tree changes remain. Preserve them.
- V21 `ABYSSAL_EXPEDITION_LOOP_V1` owns one MIRE MART operational route locally for the current session, with no persistence and no multiplayer/server authority.
- Loader order loads `awakening-world-v1.js` before the Expedition script. World wraps legacy objective text; Expedition finally replaces `window.updateQuest` and writes the `questText` element. This last display writer is not a generic Quest state service.
- V12 Guide dialogue separately composes advice from inventory/knife/`hasLeftCamp` without reading Expedition snapshot. This is a second presentation judgment and potential stale-copy risk; no wrong line was reproduced here, so it is not reported as a confirmed bug.
- Expedition completion asks HOME Workbench to record return clearance; HOME owns Field Rig state/materials and its persistence. Inventory, Combat/Creatures, Survival, NPC, Save and Relay retain their respective boundaries.
- The existing MIRE MART signal content remains a user-unselected draft. No successor Quest registry, log, durable narrative record or shared multiplayer quest authority was verified.

## Independent review

A read-only reviewer confirmed the loader/order and state boundary above, clarified that only V21's local state machine exists, and recommended testing future Quest orchestration separately from POI progression and HOME payoff. It also confirmed that V21 phase tests do not prove successor Quest persistence or co-op semantics. No review edits or tests were made by the reviewer.

A second read-only review of the V2 card found no owner-boundary blocker. Non-blocking cautions were applied: mark all five-game criteria as future player-playtest goals rather than covered by unit tests; clarify preview claims are path-specific; state that joined canonical owners are collaborators, not joint state owners; leave future Quest save schema/migration undefined until designed; and require mobile controls/safe-area visibility in the target-size gate.

## Artifact

- [`Quest & Narrative V2`](../content-inbox/2026-10-05-quest-narrative-module-card-v2.md) now replaces V1 as the canonical task card, translates all five game references into observable outcomes, and defines high-detail pixel UI acceptance at 1280×720 and 390×844.
- V1 remains as historical detail. No new quest content was authored this pass; the user-unselected MIRE MART signal remains unchanged.
- [`SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md) routes the owner index and NPC/Quest crosswalk to V2.

## Checks and limits

- **PASS:** `awakening-expedition-loop-v1`, `interaction-guide-task-v12`, `successor-natural-route-v1`, `successor-module-routing-contract-v1`, `module-sort`, and `git diff --check`.
- **FAIL / existing assertion mismatch:** `awakening-home-workbench-upgrade-v1` stops at line 169 because the fixture expects `/Field Rig/` in the task text, while the current Expedition objective says the localized Chinese label “野外装备架”. The workbench module still uses “Field Rig” elsewhere. This points to a stale or inconsistent string assertion; it does not prove a gameplay failure. The test and runtime were already modified in the mixed worktree and were not edited for this card. Reconcile only in a separately scoped localization/test task.
- Independent reviewer did not run tests. No runtime, tests, art, manifest, save, Relay, merge or deployment change is in scope.
- Actual story readability, real successor Quest UI, mobile screen review, two-client authority and persistent task state remain UNKNOWN / NOT IMPLEMENTED.

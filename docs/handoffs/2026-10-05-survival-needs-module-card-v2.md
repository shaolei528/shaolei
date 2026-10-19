# Survival & Needs module card V2 — 2026-10-05

Date: 2026-10-05 (Asia/Rangoon)  
Status: documentation and process update only; no game runtime or asset changes.

## What changed

- Added [`Survival & Needs V2`](../content-inbox/2026-10-05-survival-needs-module-card-v2.md) as the canonical draft card and routed the owner map/crosswalk to it.
- Preserved [`Survival & Needs V1`](../content-inbox/2026-10-04-survival-needs-module-card-v1.md) as historical context; it is no longer an active task route.
- Clarified the player-state boundary in [`SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md) and [`GAMEPLAY_VISION_AND_REFERENCE_ANALYSIS_V1.md`](../GAMEPLAY_VISION_AND_REFERENCE_ANALYSIS_V1.md): Survival owns needs and dead-state semantics; Combat confirms damage; Items owns inventory costs/penalties; HOME/World validates recovery destinations; Core Save persists; UI and Network present/transport their respective data.
- Added a Skill procedure to compare overlapping module cards and canonical owner/transaction routes whenever boundaries change. Evidence and scope are in [`ABYSSAL_WAKE_SKILL_CHANGELOG.md`](../ABYSSAL_WAKE_SKILL_CHANGELOG.md).

## Evidence and validation

- **VERIFIED docs defect:** prior Survival V1 excluded death/respawn lifecycle while Core State & Save V2 assigned death/recovery semantics to Survival. V2 resolves the division and states that it is a design card, not a claim that V21 has already been separated.
- **VERIFIED source boundary:** current V21 behavior spans status/lifecycle, network inbound damage handling, main-loop gating, input rest, Safe Camp and Core Save. The card records current source behavior separately from planned ownership/interfaces.
- **Independent review correction:** `onAttack` deducts player HP only, while `onMobHit` deducts both HP and sanity; corrected this distinction in the V2 source table. A wording typo (`family meal`) was corrected to `field meal`.
- **Independent review additions:** the planned rollback gate now covers consistency between death state and inventory if a death-penalty save fails; art acceptance explicitly includes death/respawn feedback; one-request/one-effect wording is scoped to a local request/transaction and does not imply Relay exactly-once delivery.
- **VERIFIED checks:**
  - `node tests/successor-module-routing-contract-v1.test.mjs` — 27 canonical owners/cards, zero broken links/duplicate owners, zero missing triggers/interfaces.
  - `node tests/core-smoke.test.mjs` — survival rates, combat Safe Camp guard and Safe Camp checks pass.
  - `node tests/crafting-processing-v1.test.mjs` — meal effects and rollback/Inventory ownership check pass.
  - `node tests/module-sort.test.mjs` — split-source reconstruction and loader order pass.
  - Scoped `git diff --check` passes. Repository-wide diff-check only emitted existing CRLF normalization warnings for unrelated modified files.
- An independent read-only cross-card review was requested; its report should be appended here before marking review closed.

## Limits and next use

- This update does not implement a separated Survival service, change player numbers, saves, death penalties, respawn coordinates, UI, network events, production art or game code.
- Real two-client damage authority, device respawn behavior and survival HUD visual acceptance remain **UNKNOWN**.
- Any runtime extraction needs a separate bounded task, an audit of the active V21 loader/handlers, one owner-write change at a time and the focused regressions in the V2 card. The 3/4 visual goal remains under the global high-detail-pixel acceptance gate.

## Workspace snapshot

- Branch: `fix/awakening-production-gate-qa-findings-v1`.
- HEAD when checked: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`.
- The shared worktree already contained extensive mixed-provenance edits and untracked files. They were preserved; no commit, push, merge or deployment was made.

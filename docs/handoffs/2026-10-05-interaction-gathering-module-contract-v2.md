# Handoff — Interaction & Gathering module contract V2

Date: 2026-10-05 (Asia/Rangoon)
Status: documentation-only planning contract; no runtime or asset edits.

## Verified basis

- Rechecked branch `fix/awakening-production-gate-qa-findings-v1` and HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`. The project docs and relevant V21 interaction source have untracked/modified shared state; do not attribute these edits.
- `survival-v21.html` contains the V12 interaction module in its dynamic boot list. The inspected V12 source includes target selection and a common context action for pointer input, plus Guide, workbench, chest, fire and gathering branches.
- The current inspected `harvestResource()` mutates `inventory[r.type]` directly before saving/updating UI. This is a **VERIFIED workspace-source observation of transitional V21 coupling**, not the intended successor boundary, not remote-commit provenance, and not proof that V21 browser behavior was played.
- Existing tests include `interaction-v12.test.mjs` and `interaction-retry-idempotency-v1.test.mjs`; those test slices must be rerun for any later implementation, but passing fixtures do not prove physical touch behavior or all runtime routes.

## Change

- Added `content-inbox/2026-10-05-interaction-gathering-module-card-v2.md` while preserving V1.
- Mapped all five reference games to original interaction constraints; clarified Input vs Interaction vs World/POI/Reward/Inventory/NPC/Quest/HOME/Survival/Save/Network ownership; and explicitly documented the current V21 inventory-write coupling as a migration boundary rather than hiding it.
- Added one-intent/one-result, target consistency, stale target, owner rejection, duplicate request, cross-input regression requirements, plus actual 1280×720 / 390×844 crisp high-detail pixel and prompt readability gates.
- Independent read-only review caught a possible owner overlap: device-event de-duplication is now explicitly owned by Input & Accessibility; Interaction validates/routes business requests; the settlement owner handles final idempotency/claim. Shared resource availability/cooldown ownership is recorded as an unresolved contract gap.
- Updated the canonical module table to route Interaction & Gathering to V2. No gameplay, candidate content, API, art, manifest, save, or network schema was created or changed.

## Validation and limits

- Read the current module map, gameplay reference index, Art Bible, V1 card, V21 boot list and V12 source before writing.
- Run the canonical routing test, both interaction source fixtures, card/reference link checks, and source-copy parity check before a future implementation is accepted.
- The successor interaction boundary, Inventory-owned settlement, real desktop/mobile view, physical input, shared resource claims, save and multiplayer behavior remain **PLANNED / UNKNOWN / NOT ACCEPTED**.

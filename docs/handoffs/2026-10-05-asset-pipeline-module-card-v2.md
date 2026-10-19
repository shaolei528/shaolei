# Asset Pipeline module card V2 — 2026-10-05

Date: 2026-10-05 (Asia/Rangoon)  
Status: documentation-only; no asset, manifest or runtime changes.

## Change

- Added [`Asset Pipeline V2`](../content-inbox/2026-10-05-asset-pipeline-module-card-v2.md) as canonical owner card, preserving V1 and routing the index/crosswalk in [`SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md) to V2.
- Defined source/provenance/hash intake, family-specific dimensions/anchors/frames, preview-first integration, exact validator scope, visual dual-viewport ownership and a per-family rollback gate.
- Clarified ownership among user-selected art contributor, Asset Pipeline, Rendering & Camera, Animation & Presentation, Content & Localization, World & Terrain, and Integration & QA.

## Verified evidence

- **Production manifest check:** `npm run validate:awakening-assets` exits 1 with `ERROR missing manifest.json`, `assets=0 files=0`. Production art therefore remains blocked; this is an actual packaging gate result, not an inferred judgment about the isolated candidate PNGs.
- **Validator unit/source check:** `node tests/awakening-assets-validator.test.mjs` passes the in-process suite for manifest/schema, PNG/path/dimensions, IDs/bindings, alpha, anchor and strict-required checks. It reports that its CLI child-process assertion is skipped because this Windows host blocks child-process creation; CI still must validate CLI execution.
- Confirmed `manifest.json` strict production requirements and mechanical validator rules from `tools/awakening-assets/lib.mjs` and `validate-pack.mjs`; these do not check artistic quality or actual game presentation.
- **Independent review correction:** the ordinary `npm run validate:awakening-assets` command does not pass `--strict-required`; CI explicitly does. Updated the card to distinguish local default checks from the strict ID/binding gate and replaced the remaining crosswalk link to V1 with V2 + clearly marked V1 history.
- The validator only bounds frame-count and frame-duration values; it does not prove source-frame layout, crop order, or visual anchor placement. Added this explicit limitation to the card.
- Scope remains docs only. Existing dirty/untracked files and candidate art were preserved. Branch/HEAD: `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba` when checked.

## Limits and next use

- No art candidate was generated, chosen, hashed, moved, or promoted by this card update. Candidate provenance/authorization and current dual-viewport visual acceptance remain **UNKNOWN** unless separately checked.
- Next step for actual art progress: identify one user-approved source family, confirm its contract and source provenance, then intake it into an isolated candidate/preview stage; require current-entry 1280×720 and 390×844 screenshots before any production manifest change.
- No runtime, manifest, save, collision, Relay, merge, or deployment changes were made.

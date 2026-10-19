# Handoff — Farming & Food module contract V2

Date: 2026-10-05 (Asia/Rangoon)  
Status: documentation-only draft; no farming runtime, code, test, art or save changes.

## Verified basis

- The canonical module map defines 27 unique owners. Farming & Food owns crop/livestock cycles and production eligibility; Time supplies clock/weather, Inventory applies outputs, and Survival applies food effects.
- The current Farming & Food card was a short DRAFT with lifecycle and visual requirements but did not explicitly map all five game inspirations or define a detailed high-quality art acceptance path.
- The source checkout remains broadly dirty/untracked. Branch is `fix/awakening-production-gate-qa-findings-v1`; HEAD is `54d294abc13dd19ee53b56563fe43aaecc81b9ba`. Do not interpret this documentation change as attribution for existing files.

## Change

- Added `content-inbox/2026-10-05-farming-food-module-card-v2.md` as a separate dated draft, preserving the existing V1 card.
- The new card translates Stardew Valley, Don't Starve, Minecraft, Terraria and Crashlands into original Farming & Food constraints; defines the single canonical owner and neighbor interfaces; forbids duplicate inventory/clock/survival/save/companion state; adds one-time-output and retry regressions; and states crisp Modern High-Detail Pixel Art acceptance at 1280×720 and 390×844.
- Updated the canonical module index to point Farming & Food at V2. The old V1 file was not deleted or overwritten.
- No concrete crop, formula, asset, runtime API, save behavior, animal AI or multiplayer behavior was invented or promoted. Today's existing Tide-mark Runner stays the only content candidate.

## Validation and limits

- Reviewed the existing module owner row, five-game reference routing table, charter, Art Bible and current farming card before writing.
- `successor-module-routing-contract-v1.test.mjs` and link/path checks are the relevant validation to run.
- This is a planning artifact only. It does not establish that Farming & Food is implemented, that any art is generated or integrated, or that game visuals pass either target viewport.
- Live code paths, save ownership, off-line growth, shared farm ownership, and runtime visuals remain **UNKNOWN / NOT IMPLEMENTED** pending a separately scoped task.

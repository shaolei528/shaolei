# Handoff — Crafting & Processing module contract V2

Date: 2026-10-05 (Asia/Rangoon)  
Status: documentation-only draft; no gameplay, code, test, art or save changes.

## Verified basis

- The canonical module map gives Crafting & Processing one owner: recipe validation and input-to-output transformations. HOME owns station placement/identity; Inventory settles item deltas.
- The V1 card already proposed atomic settlement and basic recipe regressions, but did not map all five game inspirations or specify the user's crisp, high-detail art acceptance at actual target viewports.
- The worktree remains broadly dirty/untracked. Current branch/HEAD rechecked as `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`. Existing changes were not attributed or overwritten.

## Change

- Added `content-inbox/2026-10-05-crafting-processing-module-card-v2.md`; preserved the prior V1 card.
- V2 maps Crashlands, Terraria, Minecraft, Don't Starve and Stardew Valley to original crafting constraints; makes the single-owner transaction and neighboring interfaces explicit; and defines retry/concurrency/failed-settlement regressions.
- Added high-detail pixel-art, nearest-neighbor, source/atlas evidence and actual 1280×720 / 390×844 menu-readability acceptance. Any unsupported visual claim remains UNKNOWN/REVISE.
- Updated the canonical module index to link V2. No recipe, value, content item, runtime API, asset, save behavior or Relay event was added.
- An independent read-only review found the older source crosswalk still linked V1 and ambiguously routed farm outputs through "inventory/crafting". Both links now point to V2 and farm output is described as Inventory settlement; any later transformation is a separate Crafting request.

## Validation and limits

- Read the canonical owner map, reference-routing table, charter, Art Bible and V1 card before editing.
- The canonical module routing test, file/link checks and five-reference coverage check are the relevant validation.
- This is a planning contract only. Current crafting implementation, browser/mobile visual result, save/Relay effects and multiplayer transaction safety remain **UNKNOWN** until a separate single-module task gathers current source/runtime evidence.
- Today's existing Tide-mark Runner remains the only content candidate; this module-contract improvement adds no second candidate.

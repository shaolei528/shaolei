# First knife safety check and SafeCamp terrain candidate — 2026-10-06

## Scope and ownership

- Gameplay check: SafeCamp / Items & Inventory; interface checked against Crafting & Processing and the active V21 module loader.
- Visual candidate: Asset Pipeline; review-only, isolated from the renderer and release manifest.
- Worktree was already mixed: branch `fix/awakening-production-gate-qa-findings-v1`, HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`, with 109 status entries before this handoff. Existing changes were preserved and are not attributed here.

## Verified first-knife resources

- The V21 module loader loads `modules/safe-camp/game-v7-patch.js` before `modules/input/interaction-v12.js`.
- The SafeCamp override provides 6 wood, 4 stone, and 3 food resource nodes; all 13 are inside `CAMP.r=500`.
- The active knife recipe costs 4 wood and 3 stone. A first-time player can gather and craft the weapon without leaving the protected camp.
- A prior read-only subagent finding that only counted the base 3 wood / 2 stone was incorrect because it missed the later SafeCamp override. No resource or recipe values were changed.
- Added `tests/safe-camp-first-knife-preparation-v1.test.mjs`. It executes the actual `addCampResources` override in a VM, checks the active load order and recipe cost, and verifies every starter node is within the safety radius.
- The new starter-material check and existing `awakening-expedition-loop-v1.test.mjs` passed serially. These are contract/state-machine checks, not a full ordinary-input player run.

## Visual work and limits

- Added `assets/art-candidates/safecamp-terrain-material-atlas-v1/terrain-material-atlas-DRAFT-NOT-PRODUCTION.png` and its README. The generated transparent concept board is 2205×713 and shows grass, worn path, and sand variants.
- The image has colored edge fringes and soft detail; its output dimensions do not match the renderer's 64×64 source cells clipped to 64×32 gameplay diamonds. It remains DRAFT and is not used by V21, the successor renderer, a manifest, or the Cloudflare package.
- Revised the isolated SafeCamp proof-scene builder for denser material clusters and a different coast layout, then inspected the output. The scene still has a repeated sawtooth shore and the ground detail is noisy at review size. Verdict remains **REVISE**; this edit is not claimed as a visual-quality acceptance.
- The local game server started on `127.0.0.1:8877`, but the available browser returned `ERR_BLOCKED_BY_CLIENT`. The server was stopped; no browser screenshot, two-client session, public deployment, commit, or push was completed.

## Next acceptance target

Use the guarded successor with ordinary input to verify one coherent first session: gather starter materials in SafeCamp, craft the knife, reach MIRE MART, complete combat and salvage, return, then upgrade HOME. Capture actual 1280×720 and 390×844 gameplay views separately from fixture evidence. Keep the generated terrain concept isolated until exact source-cell crops, 3×3 seams, alpha edges, and both runtime views are accepted.

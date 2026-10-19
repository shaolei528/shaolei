# Handoff — Multi-frame Awakening FX repair

Date: 2026-10-04 (Asia/Rangoon)
Repository: `shaolei528/shaolei`
Branch / HEAD: `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
Status: narrow confirmed bug repaired in the current dirty worktree; not committed or merged.

## Verified

- `modules/render/awakening-art-assets-v1.js::drawFx()` previously reassigned a `const entry` when choosing a multi-frame animation source rectangle, causing a runtime TypeError beyond frame one.
- The current module uses separate `drawEntryData`. `tests/awakening-art-assets-multiframe-fx-v1.test.mjs` covers frame two and wraparound without source-rectangle mutation.
- V21 loads the module directly from its loader. Root `game-render.js` is a different legacy renderer, so it was not synchronized with this V21-only fix.
- Passed serial checks: multi-frame regression, art mapping, Awakening world hardening, terrain V21, and module-sort. Module syntax and scoped `git diff --check` passed.

## Limits and next check

- **Isolated pixel-render check:** the actual `drawFx()` API loaded the preview manifest (57/57 images) and the 96×16 failing-light candidate in a temporary canvas. At 1280×720 the source pixels stayed sharp and both frames rendered; the strip is very thin and frame contrast is subtle. A 390×844-sized canvas was also composed inside a desktop browser, but this was not a mobile browser/device or the game scene. Treat the art verdict as **REVISE / runtime UNKNOWN**, not acceptance.
- **Guarded game preview:** `http://127.0.0.1:8765/prototypes/successor-3-4/index.html?awArtPreview=1` returned a page, but the iframe stayed on its V21 boot-failure screen and the outer page reported `V21 module boot timed out`. Individual module URLs returned HTTP 200; the exact loader failure was not resolved. Real in-game animation readability, phone rendering and production art acceptance remain UNKNOWN.
- **Adjacent existing-check findings:** `successor-camera-adapter-v1.test.mjs` fails an assertion requiring a world-north control formula absent from the current preview source. `successor-preview-live-gate-v1.test.mjs` fails its memory-shim regex because the `Map` is declared separately from the storage object. These are reproducible source/test mismatches; neither alone proves a live gameplay defect. Natural-route and V21 loader retry fixtures passed.
- The temporary `prototypes/successor-3-4/fx-review.html` was created only for the isolated pixel-render check and removed after review. No persistent review page or production asset was added.
- Worktree has many unrelated dirty/untracked files of unknown provenance. Preserve them; do not stage broadly, clean, or claim authorship.
- Next: first resolve the guarded preview boot failure and reconcile the two stale preview tests against current intended behavior, with a regression proving storage/network guards remain intact. Then inspect the FX in an actual rendered scene at 1280×720 and 390×844. Preserve the preview candidate as non-production until then.

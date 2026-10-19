# Handoff: Pets & Companions module contract review — 2026-10-05

## Result

The existing Pets & Companions card already translated the five reference games into an original companion concept, assigned one state owner, separated Farming, Combat, Quest, Save, Network, World, Rendering and Asset Pipeline, and set a strong high-detail pixel-art acceptance bar. The Tide-mark Runner / 潮痕信使 remains the only current daily content candidate.

An independent read-only audit found no companion sprite/portrait files, Pets runtime module or Pets-specific tests in the current checkout. The candidate is **DRAFT / NOT IMPLEMENTED**. Its art quality and runtime behavior therefore remain unverified.

## Documentation change

Updated [`../content-inbox/2026-10-04-pets-companions-module-card-v1.md`](../content-inbox/2026-10-04-pets-companions-module-card-v1.md) to make future single-module work more concrete:

- aligned art responsibilities with canonical owners: Asset Pipeline for source package/metadata/checks, Rendering & Camera for projection/sampling/runtime display;
- marked the old 96×96 sprite/frame proposal as unverified and required the owners to check current art/runtime contracts before artwork is produced;
- specified explicit draft animation IDs and per-clip metadata so a future asset worker cannot return an ambiguous sprite sheet;
- proposed clear FOLLOW, WAIT and RECALL semantics; RECALL targets the owner and does not mean returning HOME, dismissing or teleporting;
- made World & Terrain the sole authority for coordinates, walkability and collision-checked movement; unresolved numeric thresholds remain deliberately open;
- bounded the first preview to single-zone, single-player, non-persistent, non-Relay behavior until Save and Network owners approve their contracts;
- clarified that companion glances are character performance only and cannot promise or award a hidden clue;
- required actual 1280×720 and 390×844 successor screenshots plus display/DPR evidence before art acceptance.

## Evidence and limits

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Worktree: broad modified/untracked content with mixed or unknown provenance; preserved.
- Validation: current card, module map, project state, art-contract docs and companion path inventory were checked; an independent read-only card audit reported no implementation assets or tests. The 27-owner routing contract test passed, a separate parity check found all 27 canonical owners in the five-game index, and all 56 `tests/*.test.mjs` scripts passed serially. The asset-validator fixture skipped its CLI subprocess assertion because this Windows host blocks child-process creation; CI remains required for that path. None of these automated checks accepts companion art or actual in-game visuals.
- No runtime code, tests, image, manifest, save, Relay payload, game state, commit, merge or deployment changed.

## Next step

Keep all companion work in PET-0 until the user selects the Tide-mark Runner candidate and its art stage. Then verify the live asset/render contracts and finalize frame dimensions before any source art is generated. Do not claim a playable pet feature or accepted artwork from this document.

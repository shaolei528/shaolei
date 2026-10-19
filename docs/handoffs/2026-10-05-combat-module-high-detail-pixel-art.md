# Handoff — Combat Module High-Detail Pixel-Art Brief

Date: 2026-10-05  
Status: design brief DRAFT; no gameplay or art integration.

## Verified baseline

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Worktree: broadly dirty/untracked with mixed provenance. Do not reset, clean, or attribute concurrent changes without evidence.
- V21 source keeps player attack guards, cooldown/range/damage, hit checks, mob HP effects, and parts of reward routing in existing code. The source snapshot is transitional; the 27-module successor boundary is a design target, not a physically implemented split.

## Deliverables

- Expanded [`Combat & Weapons module card`](../content-inbox/2026-10-04-combat-weapons-module-card-v1.md) with a specific Modern High-Detail Pixel Art quality gate for combat content.
- Added [`Combat visual readability brief`](../content-inbox/2026-10-05-combat-high-detail-pixel-art-brief-v1.md). It maps the five reference games to an original combat slice, names each domain owner, separates hit confirmation from effects, and requires actual desktop/mobile review.
- Updated the canonical single-module routing test in `tests/successor-module-routing-contract-v1.test.mjs` during the preceding module-routing pass. This Combat art pass itself adds no runtime test because no runtime or art asset was changed.

## Visual concept result

Two combat concept versions shown and inspected here explored an original coastal melee scene. Both remained painterly/brush-textured after one pixel-style refinement. They fail the charter's deliberate pixel-cluster style gate and are **REVISE / NOT PROJECT ASSETS**. Neither image was copied into the repository, added to a manifest, or connected to the game. The style mismatch is visible in the conversation's generated previews; future concepts need hard-edged designed pixel clusters, consistent sprite density, and review in the real combat scene.

## Verification and open work

- The previous current full Node suite: 58 passed, 0 failed, run serially; one Windows-restricted CLI subprocess assertion was skipped by the test.
- The routing contract test verifies 27 module cards plus 27 five-game routing rows, task triggers and cooperation interfaces.
- Focused serial regressions passed: Core smoke, world/combat boundary, weapon presentation, combat presentation, mob windup, mob cooldown handoff, and successor routing (7 passed, 0 failed).
- No runtime combat, creature AI, UI, audio, art asset, save data, network protocol, or build/deploy file changed in this brief pass.
- **UNKNOWN:** approved pixel-art source submission, actual combat screenshot at 1280×720 and 390×844, physical-device input/feel, audio mix, and two-client outcome consistency.

## Next step

Use this brief as the design contract when the art-direction owner schedules a Combat visual pass. Do not pick a generated concept or change production assets until it matches the user-approved game art direction and passes actual runtime-size review. Any gameplay repair remains a separate one-bug/one-regression task with the relevant domain owner and adjacent-system check.

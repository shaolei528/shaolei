# Single-module AI prompt: five-game routing and visual-contract handoff

Date: 2026-10-05
Status: documentation change; no gameplay implementation.

## Verified baseline

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- The shared worktree contains many dirty and untracked files with mixed or unknown provenance. They were preserved.
- The canonical map lists 27 module owners and links 27 dedicated DRAFT cards. The five-game analysis routes each owner to relevant player-experience lessons, an original task trigger, and cooperating interfaces.
- These records describe modular ownership and planned work. They do not prove that all successor services, gameplay content or art are implemented.

## Finding and correction

The copyable single-module AI prompt already required one canonical owner, explicit state ownership, allowed files, neighboring regressions and target-size visual checks. It did not tell a new assignee to read the integrated five-game routing analysis or the central visual bible. The prompt now requires those documents and directs each task to use only the relevant lessons in that module's routing row. This prevents an assignee from arbitrarily selecting a reference game's lesson or forcing irrelevant references onto cross-cutting modules.

For tasks involving art, animation, maps, HUD or other visible content, the prompt now directs the assignee to follow `ART_BIBLE.md` and verify the Asset Pipeline source contract and Rendering & Camera display contract before fixing dimensions or scale. Actual successor captures at 1280×720 and 390×844 remain required evidence. Pure system/data tasks need not invent art deliverables.

## Verification and limits

- `node tests/successor-module-routing-contract-v1.test.mjs`: PASS; 27 owners, 27 cards, 27 reference routes, no broken links or missing triggers/interfaces.
- This focused routing test verifies index completeness, not the semantic quality of every future task or live art quality.
- The art AI's SafeCamp visual work remains a separate workstream. This handoff does not change its files, renderer, assets, manifest or implementation.
- No runtime code, tests, production assets, manifests, save data or Relay contract were changed. No merge or deployment occurred.
- Future AI work and live pixel readability remain UNKNOWN until reviewed in actual game sessions.

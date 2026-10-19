# ABYSSAL WAKE successor QA handoff — 2026-10-04

## Snapshot

- Branch `fix/awakening-production-gate-qa-findings-v1`, HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`.
- Worktree broadly dirty; ownership of shared modifications is UNKNOWN. No runtime, art, or test source was changed during this review.
- `modules/world/awakening-expedition-loop-v1.js` has a working-tree diff that adds remaining field-ward time to objective text. Preserved; not attributed to this review.

## Verified

- `survival-v21.html` loads world, expedition, and HOME workbench modules in that order.
- Serial checks passed: expedition loop, HOME workbench upgrade, Awakening world, and world logic hardening.
- Current checks cover fixture-level route transitions and selected HOME upgrade, save-key, ward, POI, collision and combat behaviors.
- Existing user-reviewable Field Rig visual-payoff draft already exists, so no duplicate content card was added.

## Still UNKNOWN / not accepted

- Natural player input for HOME gathering/preparation and completing HOME -> MIRE MART -> combat/salvage -> HOME.
- Browser/player-visible clarity and usability; exact 1280x720 and 390x844 views.
- Public Relay health and live two-client consistency.
- Whether the working-tree ward-count HUD change fits without crowding or conflicting with other UI.

## Next recommended gate

Lead: Integration & QA. Coordinate with Home & Building / Interaction & Crafting, World & Terrain / Combat & Creatures, UI & Input, and Network & Co-op. Run the complete route through natural controls in a guarded browser session, capture desktop/mobile at target sizes, then verify two clients and persistent local HOME growth. Treat each failed/unavailable check as UNKNOWN or a reproduced bug with precise evidence. Protect existing dirty work; no deletion, merge, or deployment.

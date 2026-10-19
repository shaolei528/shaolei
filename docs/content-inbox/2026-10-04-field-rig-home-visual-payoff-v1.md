# 2026-10-04 Design Card: Field Rig returns a visible HOME payoff

**Status: DRAFT / NOT IMPLEMENTED — for user review**

**Purpose**
Make a successful MIRE MART return feel like it improved HOME. After the player buys the Field Rig, show one small, readable change at the existing Safe Camp workbench. Keep the expedition reward useful and visible without starting a general building system.

**Lead module:** Home & Building  
**Coordinates with:** Rendering & Art (world-space presentation), Core State & Save (read-only tier query), UI & Input (upgrade intent and status copy), Integration & QA (desktop/mobile and reload acceptance).

**Proposed interface**
- Home Workbench Upgrade remains the sole owner of eligibility, resource consumption, persistence, and upgrade tier.
- Rendering reads the already exposed tier through a read-only presentation query or event; it never grants an upgrade or changes gameplay state.
- Keep the existing departure ward as the functional payoff. Visuals only show confirmed tier 1 / tier 2 state.
- No Relay event or shared-base claim: the current contract defines this as a local-player upgrade.

**Proposed presentation**
Add a compact, hand-authored field-kit attachment to the existing workbench silhouette: a rolled weatherproof map case and one clipped utility lamp. Before upgrade, show the bare work surface; after upgrade, show the two items. Keep it practical and coastal-modern, with restrained lighting and no abyssal purple or tentacles. This is a design direction only; no art asset has been created or approved.

**File scope if selected**
- Likely: `modules/safe-camp/home-workbench-upgrade-v1.js` for a read-only presentation signal only if no safe query already exists; a HOME prop/render module for drawing; a new isolated candidate under `assets/awakening-v1/intake/` only after visual direction approval.
- Do not edit Relay protocol, player save v5, collision/map geometry, inventory rules, or existing production manifest as part of the presentation slice.
- Inspect exact SafeCamp draw ownership and current art fallback before selecting final paths; current provenance of dirty worktree changes is unknown.

**Risks / tradeoffs**
- The standard preview manifest currently has no production manifest, so a new prop would remain a candidate until it passes native-size, nearest-neighbor and in-game display review.
- The existing contract explicitly excludes new presentation polish. This card is a proposed follow-up choice, not an interpretation that visual work is already authorized by that contract.
- A local tier must not be presented as a shared co-op base upgrade unless multiplayer semantics are redesigned separately.

**Acceptance if selected**
1. Before/after captures show the same Safe Camp composition at desktop and mobile sizes; prop edges stay crisp and the object reads at actual game scale.
2. Tier 1 shows no Field Rig attachment; tier 2 shows exactly one attachment after reload.
3. The renderer only reflects the confirmed tier; it does not consume inventory, alter ward time, or mutate saves.
4. Existing HOME upgrade and MIRE MART return tests pass; boot order is unchanged; Relay protocol and player save schema are unchanged.
5. If the prop is hard to read or looks blurry at either viewport, mark it **REVISE / BLOCKED**, not approved.

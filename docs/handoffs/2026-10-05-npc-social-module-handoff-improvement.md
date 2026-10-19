# NPC & Social module handoff improvement

Date: 2026-10-05 (Asia/Rangoon)
Owner: NPC & Social (documentation/readiness only)
Status: DRAFT / NOT IMPLEMENTED

## Review findings

- The five-game routing is appropriate: Stardew-like routines/community, Crashlands-like memorable character voice, Terraria-like next-stage guidance, Minecraft-like useful HOME service, and Don't Starve-like preparation cues.
- The card keeps NPC identity/dialogue separate from Quest progress, Inventory transactions, UI/Input, Save, Network, rendering, animation and audio. Existing Guide/chat/expedition facts are clearly distinguished from planned full social simulation.
- The original NPC card did not give future content authors a concrete early-game horror pacing gate and did not directly point them to the global art rules.

## Changes made

- Added a dialogue rule: early HOME lines emphasize ordinary coastal-city life, with at most one subtle anomaly. Stronger horror only appears after confirmed World/Time or Quest milestones; NPC dialogue cannot advance global awakening state.
- Linked the root `ART_BIBLE.md` and added an original modern-coastal-resident pixel-art review contract. Asset Pipeline verifies source/frame data; Rendering & Camera owns display scale, projection, anchoring and occlusion. No guessed source size was added.
- Added target-size runtime review at 1280×720 and 390×844 for identity/silhouette, ground anchoring, occlusion, dialogue readability, touch-space overlap and sharp nearest-neighbor display. Source art alone does not pass.

## Verification and limits

- `node tests/successor-module-routing-contract-v1.test.mjs` confirms 27 canonical owners, 27 indexed cards and no broken links, duplicate owners, missing triggers or missing interfaces.
- Independently checked the new relative link from `docs/content-inbox/` to `../../ART_BIBLE.md`; the target exists at the repository root. Text review confirms all new visual acceptance clauses remain assigned to the correct canonical owners.
- No game code, test, art, manifest, save, Relay contract, merge or deployment was changed. The Guide's current runtime appearance, any specific new dialogue, target-size renders, physical mobile, co-op behavior and full NPC module remain UNKNOWN / NOT IMPLEMENTED.
- Parallel audit was read-only. Shared worktree files outside the two documentation paths remain untouched and have mixed/unknown provenance.

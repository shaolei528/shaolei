# Handoff — Pets & Companions V2 module contract

Date: 2026-10-05 (Asia/Rangoon)

## Verified scope and current source evidence

- Branch: `fix/awakening-production-gate-qa-findings-v1`.
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`.
- Shared worktree is extensively dirty/untracked, with unknown authorship. No unrelated files or art candidates were removed or overwritten.
- This turn searched the V21 active entry, `modules/`, guarded 3/4 successor preview, tests for pet/companion terms, and asset filenames. No evidence of an active companion domain owner, FOLLOW/WAIT/RECALL service, dedicated runtime art, roster persistence or companion networking was found in those scopes. This is a scoped static search, not a claim of full runtime proof.
- `modules/combat/mob-combat.js` is enemy mob behavior. Farming & Food owns farm animals/production; NPC & Social owns NPC identity/relationships; Quest & Narrative owns story qualification; these do not become companion functionality.

## Updated draft and routing

- Created [`Pets & Companions V2`](../content-inbox/2026-10-05-pets-companions-module-card-v2.md), marked DRAFT / PLANNED / NOT IMPLEMENTED.
- Preserved V1 as historical detail. The original `companion.tidemark_runner` / “潮痕信使” remains unselected and without source art; no duplicate concept or image was generated.
- Updated [`SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md) to route the canonical owner to V2. The combined Pets/Animals/Farming crosswalk is explicitly non-owner navigation.
- Updated [`PROJECT_STATE.md`](../PROJECT_STATE.md) with source-check scope, UNKNOWN acceptance, review status and this handoff.
- Future Pets state: roster/valid player binding/current companion/commands/behavior. Player identity comes from Character/Network identity; Network handles shared authority/transport, Save handles persistence/migration, World/Movement validates position, UI/Input sends intent, Rendering reads snapshots, Asset Pipeline validates image sources. Combat/Loot/Inventory/Farming/Quest retain their respective outcomes and state.
- `FOLLOW`, `WAIT`, and `RECALL` remain proposed, not APIs. RECALL cannot teleport; unreachable/blocked/owner-unavailable cases must return a visible safe failure/wait result. Capture, care items, healing, equipment, breeding, drops and resource production are outside V2.
- All five references are mapped to original observable goals. Pixel-art dimension/anchor/frame contracts remain UNKNOWN; runtime presentation must be checked at 1280×720 and 390×844 before acceptance. Existing V1 sample size is not a source contract.

## Independent review

A second AI reviewed the V2 summary read-only and confirmed the single-owner split, five-game translation, DRAFT boundaries, art gates and staged work. It recommended explicitly qualifying static-search scope, identifying who supplies player owner IDs, specifying RECALL failure behavior, and excluding unspecified capture/care/drop rules. Those clarifications were added. This review is not implementation, user selection, test pass or QA acceptance.

## Verification and limits

- `successor-module-routing-contract-v1.test.mjs`: PASS after routing change; 27 canonical owners/cards, no broken links/duplicates/missing triggers/interfaces.
- `module-sort.test.mjs`: PASS; 14 unchanged source copies and 17 split parts reconstruct byte-identically; V21 loader order preserved.
- PET-0 adjacent checks rerun serially: `successor-live-screen-movement-v1`, `successor-camera-adapter-v1`, `successor-live-candidate-v1`, `terrain-v21`, and `awakening-world-logic-hardening-v1` all PASS. These exercise existing player/world/render/preview paths only; they do not test pet behavior.
- `git diff --check`: PASS with existing line-ending warnings on other dirty files. Direct trailing-whitespace scan of the four Pets V2 documents: PASS.
- No Pets-specific runtime or unit test exists in the checked test list. No companion behavior was implemented, so behavior test acceptance remains PLANNED.
- Current 3/4 companion appearance, production art, source/destination pixel ratio, device controls, persistence, owner recovery and co-op visibility are UNKNOWN / NOT ACCEPTED.

## PET-0 source/interface map — 2026-10-05

- **Movement/collision:** `terrain-v21.js` exposes `ABYSSAL_TERRAIN_V21.resolveMovement`, which checks the V21 terrain water map, but the loader wrapper snapshots and resolves only global player `me.x/y`. `ABYSSAL_WORLD_SPATIAL_V1.resolveMovement(zone,...)` resolves against registered rectangle geometry and returns the target unchanged when that zone has no registrations. `ABYSSAL_AWAKENING_WORLD_V1.resolveMovement(...)` uses the current-zone spatial wrapper. These do not establish one whole-world, any-actor movement/pathing contract. PET behavior must wait for World & Terrain to define a tested resolver spanning relevant terrain/obstacles; do not move a pet directly from its AI.
- **3/4 draw hook:** successor `drawActor()` reads `img.player` 24×32 source frames, renders 28×38 with hard-coded `y−38` offset, and sorts props/Guide/remotes/player/mobs/resources by `x+y` with ID tie-break. No companion snapshot/source art is present. Camera adapter provides projection/depth functions; it is a guarded preview, not a production renderer.
- **Preview boundary:** iframe preview replaces local storage with memory and blocks WebSocket. It can test local draw/input behavior, not real companion persistence or co-op.
- **Input:** V21 joystick and successor touch/keyboard pad feed player movement. Existing USE is already bound to contextual interaction; no pet command interface exists.
- **Save/Network:** player `abyssal_wake_save_v5` has no companion roster. Current Relay `move` payload is a player/session snapshot (`SESSION_ID`, position, direction and player state); remote actors are indexed by player ID. Do not extend this payload or invent a companion message without Network/Save review.
- **Stable identity blocker:** `runtime-state.js:2` creates `SESSION_ID` randomly for each run; it is not verified as a persistent account/player identity. Do not key a future durable companion roster directly to that session ID. Character/Network/Save must define the stable owner and guest fallback first.
- **Relevant existing fixtures:** `successor-live-screen-movement-v1`, `successor-camera-adapter-v1`, `successor-live-candidate-v1`, `terrain-v21`, and `awakening-world-logic-hardening-v1` cover portions of player movement, camera, preview isolation and existing terrain/POI behavior. None tests companion behavior or visual acceptance.

### PET-0 conclusion and next task

PET-0 is complete as a scoped static source review. The highest priority blocker before companion behavior is a World & Terrain contract for legal movement of non-player entities across collision contexts. This is an interface/design task owned by World & Terrain; it should not be folded into Pet AI. Pet art can be a separate future candidate after Asset Pipeline confirms source cell/anchor requirements and must use a dedicated directory, avoiding the active Safe Camp art paths. Rendering work can later consume a temporary read-only companion snapshot. Persistent roster and co-op remain separate Save and Network tasks.

An independent AI performed a second read-only review of the source-boundary summary. It confirmed that the V21 movement wrappers are player-only, World Spatial is zone-registration-dependent, the successor draw path has no companion snapshot, and current save/network identities are insufficient evidence for durable companion ownership. No additional blockers were found. The review does not implement or approve a new API.

## Next bounded task

Next recommended owner: **World & Terrain**. Specify the tested, zone-aware movement/collision request needed by any non-player entity and prove the existing V21 terrain and Awakening geometry boundaries it must cover. No runtime migration is implied. Keep later pet art, rendering, behavior, commands, persistence and co-op as separate assignments.

# ABYSSAL WAKE Successor — One-page visual standard

**Status: DRAFT / ART-LEAD PROPOSAL / NOT FROZEN / NOT PRODUCTION.**
**Scope:** art direction and review criteria for the selected 3/4 oblique successor. This page does not authorize renderer, gameplay, manifest, or production-asset changes.

## One sentence

Paint a lived-in modern coast in deliberate, high-detail pixel clusters: HOME gives players a warm, legible reason to prepare and return; OUTSIDE cools, obscures and threatens them while preserving a readable route, landmark and reward. Cosmic wrongness appears as a rare interruption in an otherwise believable world.

## Camera, ground and feet

- Keep the chosen 3/4 oblique projection. The current successor proof maps one 64×64 logical cell to a 64×32 screen diamond; that is existing preview behavior, **not** an approved high-detail source-art or final display-size contract.
- Build walkable ground as connected value shapes and material transitions. A path must read continuously through grass, dirt, sand, shore and work areas; do not let a conspicuous road cut across the camp's preparation focal space.
- Place actors by a declared bottom-center foot contact `(w/2, h)` and props by a declared ground-contact point. The foot/contact point rests on the projected ground plane; heads and roofs rise away from it. World simulation/collision coordinates remain independent of painted pixels.
- A typical human should be tall enough to read face direction, clothing, carried tool and feet, yet remain subordinate to shelters and major terrain forms. Proposed ratios (half a projected-cell wide and about 1.5 cells high) are review inputs only until Rendering & Camera freezes the actual source, display, anchor and DPR mapping.

## Pixel construction and detail hierarchy

- Use hard-edged clusters on a consistent pixel grid, nearest-neighbor display and no resampling to force art into a mismatched box. Choose one dominant cluster scale per material; reserve the smallest clusters for identity and gameplay cues.
- Silhouettes first: characters, threats and interactable stations must separate from the ground before internal texture is added. Use a mostly dark local contour, generally 1–2 native pixels where needed; avoid a uniform thick black sticker outline and avoid outlining every texture fleck.
- Model each form with three readable value groups: lit plane, body plane and contact/cast shadow. Add a few shaped accents (cloth seam, wet edge, wood grain, tool, grass clump) where they survive at actual viewport size. No noisy single-pixel confetti pass.
- Detail density follows play: densest around player/Guide/preparation stations, lower on broad travel ground, purposeful again at routes, resource nodes and threats. Leave quiet space around the route and interaction target.

## Shared material and lighting language

- Light convention: soft coastal daylight from upper-left of the scene; lit facets trend upper-left, cast/contact shadows fall lower-right. Keep one convention through terrain, actors, props and buildings. Night lowers ambient value and shifts cool; it does not erase silhouettes or map landmarks.
- **HOME:** warm olive and layered living greens; weathered honey-brown wood, canvas/linen neutrals, stone and muted coastal blue. Hearth/window light is a small amber focal pool that warms nearby feet, tools and faces while leaving the wider camp readable. Safe does not mean flat or over-saturated.
- **OUTSIDE:** cold blue-grey, wet asphalt, desaturated grass, concrete, muted soil and restrained rust. Separate wet planes with controlled cool highlights, not a global blue/purple wash. Use brighter values to direct toward a landmark, salvage or return route.
- **Anomaly:** a scarce, controlled abnormal hue/value event (sickly teal, mineral cyan or restrained bruised violet) appears on a specific residue, failing fixture or creature cue. Keep ordinary coastal materials dominant; anomaly accents should signal an actionable danger/discovery, not recolor the entire screen.
- Transparent assets keep hard alpha edges without resampling fringes or hidden-color halos. Terrain underlays close exposed diamond corners. Visual alpha never defines collision.

## Gameplay readability — five reference principles, original expression

| Experience principle | Visual consequence in ABYSSAL WAKE |
|---|---|
| Crashlands: immediate combat feedback | Attacks, windups, hit and defeat read as distinct silhouettes/value changes; effects do not hide the target or claim unowned gameplay state. |
| Terraria: exploration earns discovery and progression | Landmarks, gates and unusual salvage have distinct silhouettes; equipment makes a newly reachable destination visually understandable. |
| Minecraft: a home becomes the player's own | Buildable stations and additions read as modular pieces; new home objects visibly support preparation and growth. |
| Don't Starve: survival pressure is legible | Needs, weather and OUTSIDE danger communicate through a few stable visual cues, leaving the return direction readable. |
| Stardew Valley: routines and community make home matter | NPCs have recognizable work/rest poses and readable interaction presence; daily-use spaces feel warm and intentionally arranged. |

These are experience lessons only; no reference game's art, map, UI, characters, buildings, icons, text or exact systems are to be copied.

## First scene composition and art gate

The first cohesive review scene is SafeCamp as one continuous place: grass/path/sand/shore transitions; neighboring shelter, work/preparation station, hearth and supplies; player + one distinct Guide; and clear walk space connecting them to a pier/exit. Group the preparation cluster around a warm focal point. Route travel around it, not through it. Give the grass a few large, irregular value masses instead of uniform repeated tufts. Keep props and people grounded to the same projected plane.

Review source-pixel edges, alpha fringe, 3×3 material repetition, transitions, actor/prop proportions, foot/contact anchors, overlap order and nearest-neighbor enlargement. Then inspect the real successor gameplay at **1280×720** and **390×844**, including ordinary movement and interaction. Record arena bounds, backing scale/DPR, visible world extents, HUD/control safe areas and source-to-destination sizes. A static composite or correct enlargement is not in-game acceptance.

## Freeze gate and owners

**Engineering review decision:** Rendering & Camera approved one offline composition review board using Tier A study inputs: native ground diamond `80×40`; actor frame `40×60`, 4 facing rows × 4 frames; actor/prop source-image contact point `(w/2,h)`. This is approval for the finite DRAFT board only. It does not freeze runtime projection, destination size, the world-point-to-image-anchor adapter, CSS/device/DPR mapping, collision, renderer support or any reusable production family.

**Viewport evidence / limitation:** a same-build guarded QA pass measured 1280×720 outer viewport → 1100×589 CSS arena with 1881×1008 backing (~1.71 backing px/CSS px), and 390×844 browser-emulated viewport → 390×713 CSS arena with 390×713 backing (DPR 1 for this emulation). The adapter requests 2× `pixelZoom` under 480 CSS px; physical-phone DPR is unknown. World AABB is only estimated by inverse projection and exact safe-area overlap remains unmeasured. If offline Tier A samples were drawn 1:1 CSS before camera zoom, the 80×40 ground diamond and 40×60 actor would become 160×80 and 80×120 CSS px in the narrow preview; that would show only about 2.4 ground diamonds across the 390 px arena. This is a scale-risk illustration, not an approved source/destination contract. The offline board is not loaded in the successor.

For any later runtime contract, owners still need source-pixel/reference-space to CSS/device-pixel/DPR mapping, exact world visibility and safe-area overlap, and revised-view visual acceptance. Rendering & Camera recommends an explicit per-asset image contact anchor (human actor default bottom-center); Asset Pipeline owns IDs, source rect/dimensions, alpha/trim/padding and animation metadata; image alpha never defines collision; World & Terrain / HOME & Building own logical footprints; Rendering & Camera owns projection, depth sorting and visual occlusion, with large-building bounds supplied by the world/building owner. These are owner-review proposals, not yet signed/frozen contracts. No full reusable family or manifest integration is authorized by the one-board review.

## Evidence basis and unresolved items

- Current project direction and five experience references: `docs/PROJECT_CHARTER.md` and `docs/GAMEPLAY_VISION_AND_REFERENCE_ANALYSIS_V1.md`.
- Current successor draw measurements and open proposals: `ART_BIBLE.md`, `prototypes/successor-3-4/successor-renderer.js`, and `docs/content-inbox/2026-10-04-successor-high-detail-pixel-density-contract-v2.md`.
- New isolated composition board: `assets/art-candidates/safecamp-tier-a-review-board-v1/`. Revision 2 adds meadow relief and coastal scrub/tree framing; revision 3 adds the Guide lantern/tent seams; revision 4's sawtooth background was rejected; revisions 5–6 explore far banks and camp life; revision 7 adds three distinct low-contrast meadow forms and a small woodpile beside the shelter. Revision 7 passed visual 1×/2× review and native alpha/dimension plus exact-2× file checks. It remains **REVISE**: the terrain forms are still angular, the central lawn stays broad, and the material-cell diagnostic retains repeat motifs.
- The new board has not been loaded into a browser or actual successor. This page does not claim browser compositing, SafeCamp viewport quality, or mobile acceptance.
- The one-board source-size/anchor input is accepted by the engineering review only for that finite offline board. The paired current-build screenshots report **REVISE** at both viewport sizes; they update arena evidence but do not accept this board, freeze runtime mappings or establish physical-device behavior.

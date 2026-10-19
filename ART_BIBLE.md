# ABYSSAL WAKE — Art Bible (B2-A)

## Visual target
- Reference baseline: the three user-approved concept images in this project discussion.
- Style: polished, hand-authored **warm small-scale pixel art** in a 3/4 oblique top-down view. Use the selected concept images for composition and mood only; do not copy their realistic illustration finish into gameplay art. Keep actor, building, prop and ground pixels on one deliberate density and palette, with crisp native-size clusters, clear silhouettes and nearest-neighbor rendering. Quality comes from composition, animation, material transitions and readable detail, not realistic source images or forced enlargement.
- Mood: a lived-in modern coastal town is the scene language; warm safe spaces and everyday street detail come first. Restrained eldritch/Cthulhu clues emerge through damp reflections, failing lights and hidden infrastructure.
- Daylight: bright, readable, inviting. Night: colder, darker, more eldritch.
- Information density: low. World readability takes priority over HUD density.

## Scale and composition
- Base terrain grid: 64×64 tiles.
- Large props/buildings may span multiple tiles; do not force them into 64×64 bounds.
- Player visual scale should remain close to the approved concept images: readable but smaller than the surrounding environment.
- PC camera: slightly wider. Mobile camera: slightly closer. Normal play uses stable zoom.
- Camera target: use the user-approved 3/4 oblique concept as the visual direction. The active V21 renderer currently maps world X/Y directly to screen X/Y; do not claim it already has this projection. Before converting production terrain or character sheets, prototype one SafeCamp and one dark OUTSIDE composition and check sprite scale, occlusion order, walkable-ground readability, mobile HUD fit and pixel clarity. Any renderer migration is a separate implementation decision.

## Rendering rules
- Keep world coordinates independent from tile size. 64×64 is an art/map-grid concern, not a rewrite of multiplayer/world coordinates.
- Gameplay terrain and sprites use native pixel dimensions, nearest-neighbor rendering (`imageSmoothingEnabled = false`), integer placement and a shared pixel-density contract. Smooth painterly concepts may remain mood references or static editorial images; they do not set gameplay sprite rendering or scale.
- Ground, objects, collision, interaction and spawn/navigation data are separate layers.
- Art does not define collision by alpha or by visual appearance.

## Measured 3/4 prototype display baseline — NOT A PRODUCTION ART CONTRACT
- Main owner: Rendering & Camera. Partners: Asset Pipeline; Integration & QA.
- Interface: source-image crop rectangles and world-space foot/ground anchors are projected by the successor camera into the gameplay viewport. Renderer owns projection and draw size; assets do not set collision or gameplay state. Keep this prototype baseline separate from V21's legacy top-down renderer contract.
- Terrain in the inspected prototype: `assets/art-v21/terrain-v21.png` is 320×256, arranged as 5×4 cells of 64×64. A terrain cell has a 64×64 world/map footprint, but the successor renderer samples that full square and clips/displays it as a 64×32 screen-space diamond at base zoom. Those are different measurements; do not make a 64×64 square terrain source look like a finished 3/4 diamond just because the atlas cell is square.
- Current legacy sprite draws in the successor renderer (source crop → base display size): player 24×32 → 28×38; monster 32×32 → 38×38; resource 32×32 → 28×28; camp prop 48×48 → 48×48 times its per-placement scale. The observed sheet files are respectively 96×128, 128×96 and 128×32 for player, monster and resource; these are current implementation measurements, not quality targets or approval for new art.
- At viewport CSS width below 480px, the prototype applies a 2× camera pixel zoom; otherwise it applies 1×. Canvas backing resolution separately uses device pixel ratio capped at 2. These two scales are independent. The narrow-screen zoom can enlarge coarse legacy pixels; it does not add source detail or prove mobile clarity.
- Verification for any proposed production contract: check decoded source and cell dimensions, anchors, nearest-neighbor edges and seams; then inspect actual 1280×720 and 390×844 gameplay captures for crisp detail, sprite/world scale, occlusion, ground readability and HUD fit. Until those runtime views pass, production source dimensions and final display scale remain OPEN and visual acceptance remains REVISE/UNKNOWN as applicable.

## B2-A production batch
First production batch:
1. Grass
2. Sand
3. Water
4. Coast/shore transition
5. Road/path
6. Tile renderer foundation
7. Separate collision/debug overlay

Deferred:
- Character sprite replacement
- Large buildings/props
- Combat animation overhaul
- Monster art overhaul

## Collision/debug semantics
- Walkable ground: no overlay in normal mode.
- Collision debug uses explicit map data only.
- Debug overlay convention:
  - red = blocked
  - yellow = interaction
  - blue = water/non-walkable terrain
  - green = explicitly walkable debug region when needed

## Quality gate
A tile batch is not accepted merely because the source image looks good. It must pass:
- exact output dimensions
- native-resolution pixel cleanup without forced downsampling or fractional-size resampling
- seam inspection at repeated boundaries
- nearest-neighbor in-game render
- collision/data separation
- desktop/mobile visual check
- regression tests for existing gameplay/network interfaces

Generated concept art may be shown unchanged in UI, portraits, dossier cards and other suitable static presentation. For a controllable character, use matching direction/action frames derived from the approved design; never stretch a single portrait into a fake walk cycle. Keep visual art separate from authoritative collision or gameplay data.

# ABYSSAL WAKE — Art Bible (B2-A)

## Visual target
- Reference baseline: the three user-approved concept images in this project discussion.
- Style: polished top-down pixel art, not painterly realism.
- Mood: A = warm coastal survival camp as the primary language; B = restrained eldritch/Cthulhu motifs as secondary accents.
- Daylight: bright, readable, inviting. Night: colder, darker, more eldritch.
- Information density: low. World readability takes priority over HUD density.

## Scale and composition
- Base terrain grid: 64×64 tiles.
- Large props/buildings may span multiple tiles; do not force them into 64×64 bounds.
- Player visual scale should remain close to the approved concept images: readable but smaller than the surrounding environment.
- PC camera: slightly wider. Mobile camera: slightly closer. Normal play uses stable zoom.

## Rendering rules
- Keep world coordinates independent from tile size. 64×64 is an art/map-grid concern, not a rewrite of multiplayer/world coordinates.
- Pixel art must use nearest-neighbor rendering (`imageSmoothingEnabled = false`).
- Ground, objects, collision, interaction and spawn/navigation data are separate layers.
- Art does not define collision by alpha or by visual appearance.

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
- pixel-art downsample/cleanup
- seam inspection at repeated boundaries
- nearest-neighbor in-game render
- collision/data separation
- desktop/mobile visual check
- regression tests for existing gameplay/network interfaces

Generated concept art is a visual target only. It is never treated as authoritative collision or gameplay data.

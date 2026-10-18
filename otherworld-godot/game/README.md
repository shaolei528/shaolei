# Godot 2.5D migration technical slice

This standalone fixture validates a proposed **real 3D world + Sprite3D character** direction. It does not contain the 238 gameplay modules of the production JavaScript game and does not replace its production deployment or saves.

## Modules

- `scripts/player_3d.gd`: CharacterBody3D capsule, gravity, jumping, camera-relative movement, touch input.
- `scripts/world_3d.gd`: real 3D meshes/colliders, sloped ramp, elevated terrace, cabin, trees, collectible and crafted campfire/light.
- `scripts/crafting_system.gd`: item counts and a small recipe table with ingredient checks/consumption.
- `scripts/camera_rig.gd`: orthographic Camera3D; configurable azimuth/elevation.
- `scripts/hud.gd`: keyboard/touch instructions, directional buttons, collection, jump and campfire crafting.
- `tests/smoke.gd`: collision, movement, ramp climbing, elevation, jump, collection, inventory, recipe checks and camera assertions.

## Run / verify

```sh
godot --path . --editor
godot --headless --path . --script res://tests/smoke.gd
mkdir -p build/web
godot --headless --path . --export-release Web build/web/index.html
```

Web export is Compatibility and **single threaded** (`variant/thread_support=false`). Use a local HTTP server rather than opening HTML via file://. WebGL 2 support is required. Browser checks are tracked separately by the integration agent; the existence of this fixture is not evidence they passed.

## Controls

WASD / arrow keys move relative to the screen. Space jumps. E collects the nearby gold ember. Return to the cabin work area and press C to spend it on a campfire. On-screen buttons support pointer/touch play. Walk north up the beige ramp to reach the elevated terrace. Trees and cabin occlude the hero through real 3D depth testing.

HUD uses actual viewport dimensions instead of a fixed landscape letterbox. U/L/D/R directional controls are 56 pixels; action buttons are vertically stacked. Browser-only `window.__otherworldQA` telemetry updates every 0.15 seconds with player coordinates, collection/crafting state, inventory, viewport dimensions and button rectangles. It exposes no command or state mutation API.

## Official API references consulted

- https://docs.godotengine.org/en/stable/classes/class_characterbody3d.html — velocity + physics-step move_and_slide and slope/floor classification.
- https://docs.godotengine.org/en/stable/classes/class_camera3d.html — orthographic projection.
- https://docs.godotengine.org/en/stable/classes/class_spritebase3d.html — billboard sprite, alpha-cut discard/depth testing and pixel scale.
- https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html — Compatibility rendering and Web export limitations.

The copied hero PNG originates in the project's archived Godot prototype. All other geometry and materials are created in code, without external dependencies.

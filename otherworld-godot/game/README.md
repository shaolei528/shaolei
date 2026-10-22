# Godot 2.5D migration technical slice

This standalone fixture validates a proposed **real 3D world + Sprite3D character** direction. It does not contain the 238 gameplay modules of the production JavaScript game and does not replace its production deployment or saves.

## Modules

- `scripts/player_3d.gd`: CharacterBody3D capsule, gravity, jumping, camera-relative movement, a short directional dodge, health and respawn.
- `scripts/world_3d.gd`: real 3D meshes/colliders, sloped ramp, elevated terrace, cabin, trees, collectible/campfire loop, one awakened Ashling encounter, and a one-time campfire upgrade.
- `scripts/enemy_controller.gd`: one small 2-HP Ashling that approaches and attacks after the first campfire; defeat drops one `ashen_shard` into the shared inventory.
- `scripts/crafting_system.gd`: item counts and recipe checks/consumption for campfire construction and the Ashen Shard campfire upgrade.
- `scripts/camera_rig.gd`: orthographic Camera3D; configurable azimuth/elevation.
- `scripts/hud.gd`: keyboard/touch instructions, directional buttons, collection, jump, crafting, attack and dodge.
- `tests/smoke.gd`: collision, movement, ramp climbing, elevation, jump, collection, inventory, crafting, enemy damage, dodge immunity, one-time loot and campfire-upgrade assertions.

## Run / verify

```sh
godot --path . --editor
godot --headless --path . --script res://tests/smoke.gd
mkdir -p build/web
godot --headless --path . --export-release Web build/web/index.html
```

Web export is Compatibility and **single threaded** (`variant/thread_support=false`). Use a local HTTP server rather than opening HTML via file://. WebGL 2 support is required. Browser checks are tracked separately by the integration agent; the existence of this fixture is not evidence they passed.

## Controls

WASD / arrow keys move relative to the screen. Space jumps. E collects the nearby gold ember. Return to the cabin work area and press C to spend it on a campfire; its light awakens the Ashling. F attacks nearby; Shift performs a brief directional dodge with a short damage-immunity window. Defeating the 2-HP enemy grants one `ashen_shard`. Stand within 3 m of the built campfire and press U (or the Upgrade Fire touch button) to spend the shard once, extend the campfire light, and shift its flame to blue. On-screen buttons support pointer/touch play. Walk north up the beige ramp to reach the elevated terrace. Trees and cabin occlude the hero through real 3D depth testing.

HUD uses actual viewport dimensions instead of a fixed landscape letterbox. U/L/D/R directional controls are 56 pixels; action buttons are vertically stacked. Browser-only `window.__otherworldQA` telemetry updates every 0.15 seconds with player coordinates/health/dodge state, collection/crafting/upgrade state, campfire light range, Ashling position/health/alive state, inventory, viewport dimensions and button rectangles. It exposes no command or state mutation API.

## Official API references consulted

- https://docs.godotengine.org/en/stable/classes/class_characterbody3d.html — velocity + physics-step move_and_slide and slope/floor classification.
- https://docs.godotengine.org/en/stable/classes/class_camera3d.html — orthographic projection.
- https://docs.godotengine.org/en/stable/classes/class_spritebase3d.html — billboard sprite, alpha-cut discard/depth testing and pixel scale.
- https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html — Compatibility rendering and Web export limitations.

The copied hero PNG originates in the project's archived Godot prototype. All other geometry and materials are created in code, without external dependencies.

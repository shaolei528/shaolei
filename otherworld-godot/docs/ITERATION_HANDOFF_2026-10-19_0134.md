# Otherworld Godot iteration 0.2 handoff

Base: isolated 2.5D branch commit `7bbe13233b0de056816c7340b6639604b69d46e2`.

## Scope delivered

Added a small recipe-backed inventory, one Ember pickup, a camp work-area check, and a visible campfire craftable for one Ember. The HUD now shows Ember count and exposes E/C keyboard controls plus mobile buttons. Web-only QA telemetry reports the inventory and campfire state so browser tests can verify the actual player flow.

## Acceptance checks

- 22 Godot smoke assertions: 14 previous 3D checks plus inventory, crafting range, ingredient retention/consumption, visible fire/light, and duplicate protection.
- Browser flow: move to and collect Ember; return to camp; craft; verify inventory drops to zero and fire appears; verify mobile direction controls still move the player and remain in viewport.
- CI must be green before calling engine/browser tests passed. Local static JavaScript syntax check passed in the coding environment. Godot desktop executable was not present in this new hourly workspace, so local Godot tests have not been run here.

## Responsibilities

- B gameplay: inventory and recipe/campfire loop.
- D integration: Godot headless, Web export, browser keyboard/touch gate in GitHub Actions.
- A art: no new art assets in this iteration; fire is placeholder geometry and light.
- C networking: no networking implementation in this iteration.

## Known next work

Replace the fire placeholder with authored sprite/particles/audio, then add one readable enemy and a basic attack/dodge cycle. Keep the shared versioned item IDs as the integration boundary. Do not represent the cut as a complete port of the production JS game.

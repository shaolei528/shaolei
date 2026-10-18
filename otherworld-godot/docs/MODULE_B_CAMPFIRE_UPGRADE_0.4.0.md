# Module B · Ashen Shard Campfire Upgrade · 0.4.0

## Goal

Extend the existing isolated Godot slice with one clear reward for defeating the Ashling: spend one `ashen_shard` at the campfire to create a one-time visible upgrade. This does not change the production JavaScript game, saves, or multiplayer system.

## Player flow

1. Build the first campfire with the existing `ember` recipe.
2. Defeat the Ashling to receive one `ashen_shard` in the shared inventory.
3. Return within 3 m of the campfire and press `U` or tap **Upgrade Fire**.
4. The shard is consumed once; the flame changes to blue and the light radius grows from 5 m to 8 m.

## Rules and rejection cases

- The recipe ID is `campfire_upgrade` and costs exactly one `ashen_shard`.
- No campfire, out-of-range position, missing material, and already-upgraded state all reject without consuming inventory.
- Upgrade range uses the same 3 m camp interaction radius as construction.
- The upgrade is one-time for this run; persistence across reloads is not in this slice.

## QA acceptance

- Smoke tests cover missing shard, distance rejection with and without a shard, successful consumption, light/color change, and duplicate-use rejection.
- Browser E2E covers the Ashling reward, distant rejection, return-to-camp upgrade with the `U` key, repeat rejection, mobile button bounds, and tapping the mobile upgrade button.
- CI uses the official Godot 4.7.2 engine to import, run smoke tests, export Web, and drive the browser flow. A local Godot binary is not assumed.

## Boundaries

This remains a single-player Godot prototype slice, not a full migration. The Ashling and fire are still procedural placeholder visuals; the upgrade is a gameplay prototype, not final art. C networking is unchanged and production remains untouched.

# Module B · Ashling combat, dodge, and loot · 0.3.0

## Goal

Add one compact combat loop to the isolated Godot 2.5D slice without touching the production JavaScript game or multiplayer service: light the first campfire, meet one nearby enemy, dodge its attack, defeat it, and receive one material in the existing inventory.

## Files and interfaces

- `game/scripts/enemy_controller.gd`: one Ashling with 2 HP, proximity awareness, a simple approach/attack loop, and a single `defeated(drop_id)` signal.
- `game/scripts/player_3d.gd`: 3 HP, directional Shift dodge with a one-second cooldown and short damage-immunity window, incoming damage, and safe respawn.
- `game/scripts/world_3d.gd`: awakens the Ashling when the campfire is crafted, validates melee distance, connects the defeat signal to `CraftingSystem.add_item("ashen_shard")`, and shows a procedural shard visual.
- `game/scripts/crafting_system.gd`: reuses the shared inventory; stable item IDs are `ember` and `ashen_shard`.
- `game/scripts/hud.gd`: F/Shift keyboard actions and touch buttons for attack/dodge; displays both materials and player HP.
- `game/tests/smoke.gd`, `qa/browser.cjs`: logic and end-to-end acceptance.

## Acceptance

- Campfire crafting awakens exactly one Ashling.
- One nearby F attack reduces its HP from 2 to 1; a second defeats it.
- Shift produces a directional burst; the smoke test verifies an incoming hit during the dodge-immunity window does not reduce HP.
- Defeat adds exactly one `ashen_shard` to the same inventory and displays a loot visual; a defeated enemy cannot drop another.
- Browser flow verifies movement, ember pickup/campfire craft, keyboard attack, dodge movement, defeat/loot, touch movement, 390×844 control bounds, and zero browser errors.

## Actual verification

GitHub Actions used official Godot 4.7.2 stable. Both push run `39161930943` and PR run `39161934081` passed: 34/34 Godot smoke assertions, headless run, Web export (`index.wasm`/`index.pck`), and browser end-to-end. Local Godot was unavailable, so no local engine run is claimed. See `qa/manifest.json`, `qa/results/ITERATION_TEST_LOG_0.3.0.json`, and the handoff.

## Boundaries and next work

Ashling/shard geometry is a placeholder, not final concept art. This slice does not migrate the complete game, saves, or multiplayer. Next A-art task: replace the enemy placeholder with a consistent authored sprite/animation; next B-gameplay task: give `ashen_shard` one camp recipe/upgrade with range, material, and duplicate-craft checks. Keep C networking unchanged until the single-player item/combat contracts stabilize.

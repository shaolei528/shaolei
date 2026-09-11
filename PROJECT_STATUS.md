# Project Status — V21

This document is an audit of commit `f15129ff4a3843dc880757df2adb7064b4fa62dd`. It is a map, not a runtime contract. `survival-v21.html` is the active boot authority.

## Current playable foundation

- The active page is `survival-v21.html` (`VER='21a'`). It loads 33 split/extension modules in an explicit order.
- Player state is local-save v5: position, HP, hunger, sanity, inventory, and `hasLeftCamp` (`modules/core/runtime-state.js`). v4 migration remains present.
- SafeCamp is an active gameplay boundary: combat is blocked there; recovery and camp interactions are covered by `tests/core-smoke.test.mjs`.
- Field combat is active: player attacks, mobs, loot, player damage, death/respawn, and hit feedback are loaded from the active V21 boot list.
- Zone-based multiplayer is active in code: global and zone presence, remote players, movement messages, attacks, mobs, loot, harvest, and world-state messages are registered by the zone wiring.
- Terrain, mobile input, interaction, crafting/resource interactions, visual rendering, UI localization, connection quality, and gameplay/survival update modules are all in the active V21 load list.

## Current formal multiplayer route

The intended V21 route is Cloudflare WebSocket Relay:

1. `survival-v21.html` sees `ABYSSAL_CONFIG.RELAY_URL`.
2. It requires that Relay URL and does not load a Supabase SDK or shim.
3. `modules/network/network-relay-v16.js`, loaded later in V21, installs Relay channels and disables the retained V9 compatibility lifecycle.
4. The Relay protocol is `abyssal-relay-v1`.

The old Supabase route is not a V21 production fallback. V21 now reports a missing Relay configuration and does not attempt a Supabase connection when the Relay fails. Treat retained Supabase code as legacy compatibility, not an available recovery path.

## Explicitly not established as current gameplay

- A working production Supabase fallback.
- Server-authoritative movement or complete anti-cheat.
- The frozen PvP hardening branch, Monster Telegraph branch, or any unmerged branch feature.
- Farming/animal systems, expanded NPC/life systems, marriage, large story content, or a large open world. This audit found no V21 boot evidence that these are implemented.

## Audit boundaries

This pass makes no claim that an unbooted file is safe to delete. Files can support old pages, external bookmarks, regression contracts, historical recovery, or manually selected entrypoints. Those need a separate cleanup branch and the validation named in `LEGACY_CODE.md`.

# Module Map — Active V21

Source of truth: the ordered `files` array in `survival-v21.html`. Every item below is runtime-loaded by V21. "Called from" means the V21 loader unless a more specific runtime relationship is visible in the module name or audited code. The codebase uses browser globals rather than ES-module exports; therefore a missing named public entry below means **do not infer one**.

| File | Responsibility | Visible entry points / runtime role | Depends on / called from | Does not own |
|---|---|---|---|---|
| `modules/core/runtime-state.js` | Shared game state and local save v5/v4 migration | `saveLocal`, `loadLocal`; shared state declarations | V21 first; used by later gameplay | transport policy, rendering decisions |
| `modules/ui/base-ui.js` | Base DOM/UI setup | DOM handles used later | V21 | simulation, network transport |
| `modules/world/world-state.js` | World/zone state helpers | world-state broadcast helper is present | V21 | connection lifecycle |
| `modules/network/session-zone.js` | Retained session metadata and leader-election helpers | `electLeader`; V21 Relay entry uses this shared session state | V21; Relay lifecycle consumes its state | Relay socket implementation or Supabase fallback |
| `modules/network/inbound-events.js` | Applies inbound movement, combat, world, loot events | `onMove`, `onAttack`, `onMobs`, `onMobHit`, `onLoot` | zone event registrations | outbound transport |
| `modules/network/outbound-sync.js` | Outbound movement synchronization | `sendMove` | simulation update | inbound state application |
| `modules/network/chat-sync.js` | Chat receive/send behavior | chat sync handlers | V21 and global channel wiring | zone combat |
| `modules/safe-camp/base-interactions.js` | Base SafeCamp interactions | harvest event use is visible | V21 | player combat numbers |
| `modules/combat/player-combat.js` | Player attack and combat-side loot logic | `attack`; attack/loot broadcasts | input and V21 | mob movement/update |
| `modules/survival/lifecycle.js` | Lifecycle behavior | module-loaded lifecycle hooks | V21 | network protocol |
| `modules/input/joystick.js` | Joystick input | joystick handlers | V21 | combat resolution |
| `modules/survival/status.js` | Hunger/sanity/HP survival update | `applyLocalSurvival` | simulation update | persistence format |
| `modules/main-loop/simulation-update.js` | Per-tick simulation coordination | `mobs` broadcast is visible | V21 scheduler | rendering implementation |
| `modules/combat/mob-combat.js` | Mob AI/combat and player mob damage | `updateMobs`; `mob_hit` broadcast | simulation update | player input mapping |
| `modules/survival/day-night.js` | Day/night state | day/night helper | V21/render/survival consumers | transport |
| `modules/render/base-renderer.js` | Base world renderer | renderer functions | V21 scheduler | game authority |
| `modules/main-loop/legacy-scheduler.js` | Render/update scheduling | scheduler hooks | V21 | gameplay rules |
| `modules/safe-camp/game-v7-patch.js` | Loaded SafeCamp compatibility extension | harvest event use is visible | V21 after base systems | Relay implementation |
| `modules/input/mobile-fixes.js` | Loaded mobile compatibility extension | module-specific hooks not audited in this pass | V21 | save/network protocol |
| `modules/network/network-v9.js` | Retained V9 networking compatibility surface | compatibility helpers retained for load order/legacy contracts | V21 before Relay override | active Relay transport or a Supabase fallback |
| `modules/survival/gameplay-v9.js` | Loaded survival/gameplay compatibility extension | module-specific hooks not audited in this pass | V21 | base save schema |
| `modules/safe-camp/content-v9.js` | Loaded SafeCamp content extension | module-specific hooks not audited in this pass | V21 | multiplayer protocol |
| `terrain-v21.js` | V21 terrain generation/render support | terrain API consumed by active game | V21 | player authority |
| `modules/render/render-v9.js` | Loaded rendering compatibility extension | module-specific hooks not audited in this pass | V21 | game state ownership |
| `modules/core/optimize-v9.js` | Loaded performance compatibility extension | module-specific hooks not audited in this pass | V21 | feature rules |
| `modules/ui/ux-cn-v11.js` | Loaded Chinese UI/UX extension | UI extension hooks | V21 | simulation/network authority |
| `modules/input/interaction-v12.js` | Interaction targets, harvest, rest, chest | `harvestResource`, `restAtFire`, `openChest` | input/UI | relay socket |
| `modules/input/platform-inventory-v19.js` | Platform inventory/input behavior | module-specific hooks not audited in this pass | V21 | persistence ownership |
| `modules/network/network-relay-v16.js` | Cloudflare WebSocket Relay adapter | Relay channel lifecycle, reconnect/resubscribe, diagnostics; replaces the retained V9 lifecycle | V21 after `network-v9.js` | save format, gameplay rules |
| `modules/network/network-quality-v20.js` | Network quality display/logic extension | quality hooks | V21 after Relay | transport protocol |
| `modules/main-loop/smooth-motion-v18.js` | Smooth movement extension | motion hooks | V21 after main loop | authoritative world state |
| `modules/ui/regression-v14.js` | UI regression compatibility extension | module-specific hooks not audited in this pass | V21 | gameplay/network policy |
| `modules/ui/game-shell-v1.js` | Main menu, local shell settings, game menu and input isolation | `ABYSSAL_SHELL_V1`; independent `abyssal_wake_settings_v1` storage | V21 after platform controls | player save schema, Relay protocol, world persistence or account/friends backend |
| `modules/combat/hit-feedback.js` | Local visual/haptic combat feedback | feedback hooks | V21 last | damage/range/cooldown authority |

## Wiring constraints for future changes

- `network-relay-v16.js` deliberately loads after `network-v9.js`; changing their order changes which `connectGlobal`/`switchZone` functions run.
- `inbound-events.js` applies inbound game data, while `outbound-sync.js` sends movement. Do not merge their responsibilities merely because both are networking files.
- SafeCamp behavior spans base interactions, compatibility patches, player combat, survival status, and UI. Changing one file is not proof that all SafeCamp rules changed.
- The aggregate files `game-core.js`, `game-play.js`, and `game-render.js` are not V21-loaded, but `tests/module-sort.test.mjs` treats them as reconstructions of split parts. See `LEGACY_CODE.md`.

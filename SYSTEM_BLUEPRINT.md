# ABYSSAL WAKE System Blueprint v2

## Scope and status language

This is a design boundary map, not evidence that a future system exists. Runtime evidence is the V21 boot list in `survival-v21.html` and the referenced source files.

- **ACTIVE**: loaded by V21 and evidenced in current code.
- **PARTIAL**: a useful slice is active, but its intended product loop is incomplete.
- **PLANNED**: product direction only; no claim of implementation.
- **LEGACY**: retained code not used as the V21 production route.

## Current runtime spine

`survival-v21.html` loads browser-global modules in a fixed order: shared state/UI/world, networking event plumbing, SafeCamp/combat/survival/input, simulation/render scheduling, then compatibility and V21 extensions. It requires `ABYSSAL_CONFIG.RELAY_URL`; V21 does not enter a Supabase fallback.

The present multiplayer transport is Cloudflare WebSocket Relay (`abyssal-relay-v1`): `modules/network/network-relay-v16.js` installs the channel adapter, and `cloudflare/src/index.js` routes all V21 connections into the constant relay Durable Object name `abyssal-wake-public-v1`. This is real-time relay/presence infrastructure, **not** an account system, private-world selector, durable shared-world store, or complete server-authoritative simulation.

Current local persistence is `abyssal_wake_save_v5` with a v4 migration in `modules/core/runtime-state.js`. It holds local player state; it is not proof of persistent co-op world state.

## System family map

| Family | Status | Current evidence and responsibility | Boundary / does not own | Product MVP and future direction |
|---|---|---|---|---|
| Core runtime and player state | ACTIVE | `runtime-state.js` owns shared browser-global state, local save/load, HP, hunger, sanity, inventory, position and camp-leave state. | Does not establish server authority or a shared world save. | Keep a small, versioned player-state core; later separate account, World Survivor, and world-instance data. |
| Input and mobile controls | ACTIVE | `joystick.js`, `mobile-fixes.js`, `interaction-v12.js`, and `platform-inventory-v19.js` are V21-loaded. | Does not resolve combat or own persistence. | Preserve touch areas/safe areas; add bindings/accessibility through a dedicated shell/input pass. |
| UI and frontend shell | PARTIAL | `base-ui.js`, `ux-cn-v11.js`, `regression-v14.js`, and `game-shell-v1.js` provide the current in-game UI plus Main Menu, local shell settings and multiplayer-safe game menu. | Does not define account, friends, private worlds, lobby backend or social architecture. | Continue Phase 1 with a coherent start/lobby/settings/game-HUD shell without changing gameplay rules. |
| Rendering, pixel art and audio | PARTIAL | `base-renderer.js`, `render-v9.js`, `terrain-v21.js`, day/night and hit-feedback are loaded. `ART_BIBLE.md` is the visual contract. | No current evidence of a complete audio framework or production content pipeline. | Warm HOME versus dangerous OUTSIDE; modern ruins become abyssally altered by authored place-based art, not a global purple overlay. Audio is PLANNED. |
| Local world, terrain and collision | PARTIAL | Fixed `WORLD`/`CAMP` dimensions live in `runtime-state.js`; `terrain-v21.js` supplies a 64×64 Camp-adjacent tile slice with separate visual/collision handling. | Not a complete explorable world map, mining world, or persistent terrain mutation system. | Add authored overworld regions, POIs, dungeons and top-down underground slices before broad procedural expansion. |
| Map and exploration | PLANNED | Relay recognizes `map_pos`, but this is not evidence of a finished player map/exploration loop. | Do not infer fog of war, markers, discovery, or routing. | World map, discovered POIs, region danger, expeditions, and return-to-base navigation. |
| Network and session lifecycle | PARTIAL | Relay adapter, session-zone helpers, inbound/outbound/chat modules and Worker relay are active. Zones, remote players and relay reconnect lifecycle exist. | Client input remains untrusted; relay is not complete anti-cheat or persistent-world authority. | Keep protocol stable; later introduce an explicit world-instance coordinator without conflating owner and authority. |
| Save, account and logical worlds | PARTIAL / PLANNED | Local v5 save is ACTIVE; account, friends, private co-op worlds, invitations and durable shared world state are PLANNED. | No current `worldId`, account identity, ownership permission model, or DO-backed world state is established. | A logical persistent world instance: shared world progression plus each player’s World Survivor progression; owner grants access but is not game authority. |
| SafeCamp, home and settlement | PARTIAL | SafeCamp interactions/patches, recovery boundaries and combat restriction are active (`base-interactions.js`, `game-v7-patch.js`, combat/status modules). | This is not freeform building, power, storage networks, NPC settlement, or base defense. | Expand SafeCamp → base → settlement: shelter, storage, processing, defense, survivors and comfort; every addition must support expedition readiness or recovery. |
| Survival and life pressure | PARTIAL | HP, hunger, sanity, day/night, recovery and death/respawn behavior are loaded in V21. | No evidence of seasons/calendar, temperature, hard weather, farming, animal husbandry, fishing or deep cooking. | Later add readable environmental pressure, calendar and base defense only after the first life/adventure loop works. |
| Items, inventory, equipment and tools | PARTIAL | Inventory is saved; interaction and combat code evidence basic resources, loot and weapon use. | No confirmed full equipment slot model, rarity ecosystem, tool tiers, repair economy or research tree. | Build a modest equipment/tool loop: weapons affect combat roles, tools open POIs/resources, armor prepares harder expeditions. |
| Crafting, processing and cooking | PARTIAL / PLANNED | Current interaction/SafeCamp gameplay includes limited crafting/resource interaction. | Do not label a complete station, recipe, farming, cooking or economy system as active. | Crafting and processing are the bridge from salvage to combat readiness; cooking is a later survival/life loop. |
| Combat and creatures | PARTIAL | Player attack uses current base values and SafeCamp checks; mob update/combat and local hit feedback are active. Current source names crawler, cultist and watcher as basic mob kinds. | Not server-authoritative combat, advanced telegraphs, boss progression, broad AI ecology or PvP anti-cheat. | Keep Crashlands-like readable impact and Terraria-like combat rhythm: telegraphs, dodge windows, roles, drops and first boss only when each is testable. |
| Loot, progression and research | PLANNED | Loot messages exist, but there is no evidence of a designed progression/research/codex loop. | Do not treat network messages as a finished reward economy. | POI salvage → crafting/equipment → new access; research/codex should explain threats and open choices, not force text-heavy story. |
| Building and construction | PLANNED | SafeCamp is active; Minecraft-style freeform building is not. | No placement protocol, world-mutation persistence, ownership rules, or construction UI is established. | Begin with a small, reversible building MVP tied to safety, storage, processing and defense. |
| Pets, farm animals and fishing | PLANNED | No V21 evidence of pet capture, animal care, fishing or breeding. | Keep companion combat utility distinct from farm/life economy. | Pets support exploration/combat; farm animals, farming and fishing support the later HOME economy. |
| NPCs, quests, story and social | PLANNED | Chat sync exists; it is not NPC, dialogue, relationship, quest or friend-system evidence. | No account/social graph, narrative framework or economy is currently present. | Survivors, concise environmental mystery, quests, trade and relationship systems follow the core loop rather than precede it. |
| World stages, bosses, transport and defense | PLANNED | Day/night and basic mobs are active only. | No evidence of stage gates, boss loops, vehicles, electricity or recurring raids. | World corruption stages should change POIs/enemies/risks; transport and power belong after meaningful world scale and settlement needs. |
| Content data and tooling | PARTIAL | Split runtime modules and aggregate reconstruction tests exist; content remains largely code-adjacent/browser-global. | No established data schema, editor, content registry or localization pipeline. | Gradually separate stable rules from declarative content data after ownership boundaries are mapped and tested. |

## Multiplayer authority boundary

Today, the Relay canonicalizes connection/session identity for selected messages and distributes real-time traffic. It does not make all client-provided movement, combat, mob, loot or world claims authoritative. `modules/network/inbound-events.js` is an inbound application boundary; `outbound-sync.js` is an outbound state boundary. Future authority work must be a dedicated compatibility/security task, preserving event names, payload shapes, protocol and sync frequency unless explicitly approved.

## Long-term logical-world model (PLANNED)

One logical world is a persistent co-op game instance, not “a physical server.” It should eventually have a stable `worldId`, access policy/invites, shared world progression and a coordinator/storage boundary. Each player keeps a separate World Survivor progression layer. The present constant Relay DO name is only a public relay room and must not be silently reinterpreted as that product model.

## Boundary candidates — record only, no refactor approved

| Candidate | Evidence | Risk if changed casually | Future extraction direction |
|---|---|---|---|
| `modules/core/runtime-state.js` | Shared runtime declarations and local persistence coexist. | Save migration or browser-global consumers can break. | Separate versioned persistence adapter from stable runtime state only after a migration contract exists. |
| `modules/network/network-relay-v16.js` | Transport, reconnect/channel lifecycle and connection-facing diagnostics are closely related. | Module load order deliberately overrides V9 lifecycle names. | Keep a narrow transport adapter; expose lifecycle events rather than letting gameplay own sockets. |
| `terrain-v21.js` | Terrain slice contains authored tiles plus collision/render integration. | Visual/collision divergence and the legacy outside-slice behavior are deliberate. | Later split declarative terrain data from renderer/collision adapters, after world design is settled. |
| `modules/network/inbound-events.js` | Multiple game event types are applied at one trust boundary. | Authority/security changes can desync clients. | Introduce per-domain validators only in a dedicated protocol-compatible authority task. |

## Non-negotiable design constraints

- Protect multiplayer, combat feel, HP/Hunger/Sanity, SafeCamp, save compatibility and mobile input first.
- HOME is warm, useful and social; OUTSIDE is tense, unknown and rewarding.
- Modern post-apocalypse and cosmic horror are expressed through authored landmarks, altered infrastructure, sound, creatures and events—not generic recolors.
- Learn from the five reference games’ player experience; do not copy their content, names, maps, assets or systems verbatim.
- A non-core system needs a concrete connection to expedition, combat readiness, survival, SafeCamp or co-op before implementation.

# ABYSSAL WAKE Roadmap

This roadmap is ordered by dependency, not by a promise that later phases are already started. A phase begins only after its predecessor has a tested stable point.

| Phase | Goal | Exit criteria before the next phase |
|---|---|---|
| 0 — Blueprint v2 | Establish product, system and ownership boundaries. | `SYSTEM_BLUEPRINT.md`, `GAME_DESIGN.md` and this roadmap remain factual about current V21. |
| 1 — High-quality game shell | Make entry, settings, HUD, feedback, accessibility and mobile behavior feel like one product. | Start-to-play flow works; UI does not regress touch/safe-area behavior; no gameplay semantics change without its own task. |
| 2 — V21 art / visual | Turn the current slice into a coherent modern-ruin / abyss visual language. | Camp, terrain, creatures, lighting and UI follow `ART_BIBLE.md`; pixel clarity and mobile performance are checked. |
| 3 — Combat feel | Strengthen readable attack impact, enemy intent and recovery without changing authority casually. | Player and enemy feedback are understandable; combat regression and multiplayer checks pass. |
| 4 — Awakening vertical slice | Deliver one compact HOME → POI → return loop with a visible world change. | A player can prepare, enter one authored dangerous place, fight/salvage, return, improve something and understand the next objective. |
| 5 — Life + Adventure vertical slice | Make the first 20–30 minutes carry both expedition and home value. | Food/recovery/crafting choices, a practical base improvement and a small exploration decision form one repeatable session. |
| 6 — Building | Add a minimal, safe construction loop. | Placement, ownership/permission boundary, persistence decision, mobile UI and rollback/compatibility behavior are specified and tested. |
| 7 — World / POI / underground | Expand authored exploration, POIs and top-down underground routes. | Several distinct routes have purpose, hazards, rewards and return paths; map/discovery scope is explicit. |
| 8 — Equipment / armor / tools / loot | Establish a clear progression economy. | Tools and equipment open combat/exploration choices without making prior content irrelevant. |
| 9 — Pets + first progression boss | Add one companion loop and a first staged boss gate. | Pet utility and boss counterplay are readable, do not trivialize co-op, and fit loot/progression. |
| 10 — Hard survival / calendar / base defense | Add deeper world pressure only after HOME has value. | Calendar/environment signals, preparation, defense and failure recovery are fair and testable. |
| 11 — Persistent worlds / world creation backend | Build actual logical-world identity and persistence. | `worldId`, access/invites, shared versus individual state, coordinator/storage authority, migration and recovery are designed and implemented in a dedicated backend task. |
| 12 — Accounts / friends / presence / invites / chat | Add social product infrastructure on top of persistent worlds. | Identity, privacy, presence, invitations and moderation/error states are defined and tested. |

## Current placement

The repository has completed Phase 0 documentation and a partial Phase 1 Game Shell V1: main menu, current Relay entry presentation, independent local menu settings and a multiplayer-safe in-game menu. V21 still has not completed Phase 1 as a whole, nor Phases 2–4 as product vertical slices. Frozen experimental branches are not roadmap completion evidence.

## Sequencing rules

- Do not begin farming, animal care, broad NPC life, marriage, a huge open world or long-form story before the supporting loop exists.
- Do not treat Relay transport as persistent-world infrastructure.
- At every phase, keep multiplayer protocol, saves, terrain/collision and mobile input stable unless the phase expressly approves a compatible change.
- Every new subsystem must connect to combat, survival, SafeCamp/HOME, expeditions or co-op.

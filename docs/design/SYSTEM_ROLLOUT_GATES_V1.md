# ABYSSAL WAKE — System Rollout Gates V1

Status: Director delivery contract
Runtime authority: None
Scope: Converts long-term design into build order, acceptance gates and team ownership boundaries.

## 1. Purpose

The project now has enough parallel work that speed can be lost through branch collisions, premature systems and duplicated ownership.

This document defines when a system is allowed to start, what proves it is complete enough to unlock the next system, and which team role should own it.

The goal is faster total delivery, not maximum simultaneous activity.

## 2. Current operating principle

Do not ask every chat to stay busy at all times.

Keep only independent workstreams active.

Priority order:

1. unblock current playable loop
2. close architectural blocker that prevents content scaling
3. close production-art blocker
4. improve feel/presentation
5. expand content
6. add long-term infrastructure only when required

## 3. Ownership map

### A — Director

Owns:
- product identity
- progression architecture
- narrative/world-state rules
- scope
- sequencing
- accept/reject
- cross-branch integration decision

Does not own:
- routine runtime implementation
- asset pipeline implementation
- QA execution

### B — Core / World / Gameplay Engineering

Owns:
- gameplay runtime
- world runtime
- spatial/collision hooks
- objective/progression implementation when assigned
- core integration

Must not own:
- canonical production art pipeline
- source-art generation
- QA acceptance

### C — QA / Gatekeeper

Owns:
- exact-head verification
- ancestry/diff review
- regression
- conflict matrix
- acceptance status

Should not become feature engineer except for isolated test infrastructure explicitly assigned.

### D — Art Lab

Owns:
- source art
- visual candidates
- redraws from exact production specs

Must not own:
- manifests
- validators
- runtime bindings
- code/tooling

### E — Art Integration / Tooling

Owns:
- canonical asset validation
- production manifest
- slicer/preview/tooling
- semantic binding gate

Must not own:
- gameplay collision authority
- world logic
- combat

### F — Feel / Audio / Playtest Engineering

Owns:
- presentation feedback
- audio
- performance/playtest tooling

Must not own:
- gameplay damage/range/cooldown authority
- world/collision architecture
- canonical art intake

### G — Asset Processing / Intake

Owns:
- mechanical crop/cleanup/alpha preparation when source art requires it

Must not create:
- competing manifest/tooling pipeline
- runtime semantics

## 4. Gate 0 — Stable Code Spine

### Required

- Loader retry idempotency accepted
- shared spatial hooks accepted
- current Smoothness/Input baseline preserved
- relevant exact-head CI green

### Exit condition

One combined candidate contains both Loader and Spatial behavior with no divergent `survival-v21.html` semantics.

### Why this gate exists

Do not build additional POI/objective systems on a branch that still has known loader/spatial ancestry conflict.

## 5. Gate 1 — First Expedition Loop

### Required player experience

`HOME -> prepare -> MIRE MART -> fight/search -> obtain required salvage -> return HOME -> explicit result`

### Required system qualities

- objective order is understandable
- no second inventory system
- no new network architecture
- repeat/retry behavior defined
- early return behavior defined
- death/respawn behavior tested

### Exit condition

A new player can complete the loop without Director explanation.

### Owner

B

### QA owner

C

## 6. Gate 2 — First HOME Functional Upgrade

### Start only after

Gate 1 is stable enough that returned salvage exists as meaningful value.

### Required

One visible HOME anchor changes preparation.

Recommended first candidates:
- workbench
- generator
- medical station

### Exit condition

The player can answer:

> What can I do on my next expedition that I could not do before this upgrade?

### Deferred

- broad building catalog
- shared persistent-world architecture

## 7. Gate 3 — First Capability Gate

### Required

A new capability opens or softens a real risk.

Examples:
- light enables a dark interior
- access tool enables a sealed room
- medical capability enables a longer route
- generator enables a powered interaction

### Exit condition

The new capability changes route/loadout choice.

Do not accept a gate that is only an arbitrary item check with no world logic.

## 8. Gate 4 — First Reactive World Beat

### Start only after

The player has completed at least one loop and one HOME payoff.

### Required

One event changes:
- world/POI state
- gameplay/economy/threat
- presentation
- narrative/social signal

### Strong candidate

Grid instability + MIRE MART aftermath.

### Exit condition

The player notices the world changed without needing a patch-note explanation.

## 9. Gate 5 — Second Distinct POI

### Start only after

- Spatial V1 is integrated
- Gate 1–4 grammar is proven

### New POI must differ from MIRE MART in at least three ways

- reason to visit
- resource emphasis
- dominant risk
- capability pressure
- narrative evidence
- revisit potential

### Preferred candidate families

- clinic/pharmacy
- utility/substation
- gas station/service

### Do not build

A second convenience-store-shaped combat room with different props.

## 10. Gate 6 — Minimal POI Network

### Required

At least 3 meaningful destinations create route choice.

The player should sometimes choose between:
- urgent survival supply
- capability material
- knowledge/story opportunity

### Exit condition

Destination choice changes preparation.

## 11. Gate 7 — Minimal Building

### Start only after

HOME already has at least one useful fixed anchor and the project understands why construction matters.

### Required first building categories

- storage
- work surface
- light/power
- simple defense

### Architecture gate

Must define:
- placement authority
- collision
- permissions
- save/persistence behavior
- mobile input
- rollback/compatibility expectations

### Explicitly deferred

Large cosmetic catalog.

## 12. Gate 8 — Life Economy Seed

### Start only after

HOME is useful enough that routine production has a purpose.

### Pick only one or two initially

- cooking
- fishing
- farming
- simple processing

### Required connection

The loop must reduce or alter an expedition pressure.

Example:

`fishing -> food/ingredient -> better field preparation`

A disconnected minigame fails the gate.

## 13. Gate 9 — First NPC Service Network

### Required

2–4 recurring NPCs max initially.

Each must alter a player decision through:
- service
- information
- capability
- production
- trade/conversion

### Exit condition

The player remembers NPCs because of practical and emotional continuity, not because they are quest dispensers.

## 14. Gate 10 — First Major Boss / Event

### Start only after

- combat tells readable
- preparation matters
- equipment/capability progression exists
- world beat system has at least one proof

### Required boss reward

At least one:
- world state change
- route unlock
- HOME capability
- resource ecology change
- major knowledge reveal

A large HP bar plus loot is insufficient.

## 15. Gate 11 — Hard Survival / Calendar / Defense

### Start only after

HOME is worth protecting.

Potential systems:
- weather pressure
- temperature
- preservation
- timed world events
- base defense

### Guardrail

Every new pressure must have:
- warning
- preparation
- counterplay
- recovery after failure

## 16. Gate 12 — Persistent Worlds

### This is a backend phase, not a UI feature.

Required architecture before implementation:
- `worldId`
- shared vs individual state
- access/permissions
- authoritative storage
- migrations
- reconnect/recovery
- idempotency
- conflict resolution

Current Relay transport is not this system.

## 17. Gate 13 — Accounts / Friends / Invites / Presence

Start only after persistent world identity exists.

Do not design social infrastructure on top of temporary assumptions about world ownership.

## 18. Art rollout gates

### Reference Art

May guide:
- palette
- material
- composition
- silhouette

Cannot gain runtime authority.

### Production Candidate

Must pass:
- pixel-art style
- dimensions/density
- alpha/crop
- anchor
- naming
- allowed semantic

### Production Binding

Only E's canonical pipeline may approve binding.

### Gameplay Authority

Never inferred from art alpha or file name.

## 19. Current production-art blockers

The current art pipeline should remain blocked from a full production manifest until all required approved semantics have valid production candidates.

Known blocker categories include:
- cold grass variants
- early residue decal
- store debris
- failing-light FX
- early residue/anomaly FX

Unsupported raw art remains unbound rather than expanding runtime semantics casually.

## 20. Audio / presentation rollout gates

Presentation may consume gameplay/world state.

It may not:
- alter damage
- pause simulation for true hit-stop without explicit architecture approval
- create world authority
- change collision

Ambience state examples:
- HOME
- OUTSIDE
- MIRE MART

Transitions must not leak nodes/listeners.

## 21. Integration order rule

Prefer integration in dependency order.

General pattern:

`reliability/input spine`
`-> gameplay/world architecture`
`-> passive assets`
`-> canonical art integration`
`-> presentation/feel`
`-> docs/contracts`
`-> combined QA`

Do not infer that branch creation time determines integration order.

## 22. Branch acceptance levels

### ACCEPT

Implementation is fit for future integration subject to combined-head QA.

### CONDITIONAL

Design/implementation is valid but ancestry, CI, missing dependency or integration conflict remains.

### REJECT CURRENT HEAD

Current branch is not integration-safe.

This does not automatically reject the underlying design.

### FROZEN

Do not append unrelated work. Use the accepted HEAD as evidence/source.

## 23. Exact-head rule

A branch report is stale as soon as the remote HEAD changes.

Before Director acceptance:
- refetch remote HEAD
- compare correct base
- inspect changed files
- inspect exact-head CI

Do not accept "it passed earlier" if the current HEAD differs.

## 24. Combined-head rule

Green component branches do not prove a green integration candidate.

Before a release/integration point:
- build combined candidate
- run full relevant CI
- run targeted cross-system regression

This is especially important where two branches touch:
- loader order
- input handlers
- aggregate reconstruction
- audio lifecycle
- world/combat hooks

## 25. No-busywork rule

Do not create tasks solely to keep a team active.

Valid reasons to freeze a team:
- dependency not ready
- next task would duplicate another owner
- available work would produce throwaway artifacts
- integration gate should complete first

This is a speed optimization, not inactivity.

## 26. Director priority algorithm

When choosing the next task, score it conceptually by:

`player-loop value`
`x dependency unlock value`
`x reuse value`
`x confidence`
`/ conflict risk`
`/ throwaway risk`

High-value examples:
- shared spatial service before POI expansion
- first HOME payoff before broad crafting catalog
- production art validator before mass asset binding

Low-value examples:
- second POI before first expedition has a payoff
- dozens of recipes with no equipment economy
- new art semantics because a file already exists

## 27. Near-term team topology after current overnight work

Assuming current active branches validate successfully:

### B

Finish integrated Loader + Spatial spine, then first expedition loop.

### C

Audit exact-head integration and the first expedition ownership boundaries.

### D

Produce only exact production blockers and highest-value character/enemy/icon source art.

### E

Harden production manifest gates and validate D/G output.

### F

Finish combat presentation, then HOME/OUTSIDE/MIRE MART atmosphere state.

### G

Stay frozen until D produces source art that actually needs mechanical processing.

### A

Maintain progression/campaign architecture, verify reports, control integration and prevent scope collision.

## 28. Release-quality vertical slice gate

Before calling the first Awakening vertical slice product-complete, require:

### Loop

- prepare
- leave HOME
- reach authored POI
- fight/survive
- salvage
- return
- HOME payoff
- next objective

### Feel

- readable combat
- useful audio
- PC/mobile input
- stable frame pacing on target hardware

### Art

- coherent pixel-art terrain/props/decals/FX
- no reference-art cheating

### World

- collision/LOS correct
- at least one POI state/reactive beat

### Multiplayer

- two-player visibility/movement/combat/basic world behavior stable

### QA

- combined-head CI
- manual PC
- manual iPhone Safari
- 20–30 minute playtest protocol

## 29. What "big progress" means

Big progress is not file count, commit count or number of parallel branches.

For ABYSSAL WAKE, big progress means one of these becomes true when it was false before:

- the player can complete a meaningful loop
- a new capability changes exploration
- HOME becomes functionally more valuable
- the world reacts to progression
- a production bottleneck is removed
- content can now scale safely
- a high-risk architecture conflict disappears

## 30. Final rule

> Close loops before multiplying content.

That is the fastest route from a technically impressive prototype to a game people can understand, remember and keep playing.

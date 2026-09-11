# ABYSSAL WAKE — Awakening World-State Contract V1

Status: Director architecture contract
Runtime authority: None
Scope: Defines how civilization decline and cosmic awakening should eventually be represented as gameplay state without prescribing the current implementation.

## 1. Why this contract exists

The project already uses Stage 0 / early Stage 1 terminology and a corruption intensity seed in the current Awakening world slice. That is not yet a complete world-state system.

This document prevents two failure modes:

1. treating Awakening as a visual filter or enemy-stat multiplier;
2. building a giant global state machine before concrete content beats are known.

The required approach is incremental, authored and testable.

## 2. Core distinction

Awakening Stage is a **world condition**.

It is not:
- player level
- quest chapter number
- difficulty setting
- enemy tier
- corruption shader amount

A world stage summarizes broad reality/civilization conditions, while individual POIs and systems may lag, lead or react differently.

## 3. Two-layer model

Use two conceptual layers.

### Global Band

Represents the campaign-wide condition:

- Stage 0: Ordinary / Hairline Cracks
- Stage 1: Disturbance
- Stage 2: Social Fracture
- Stage 3: Reality Contamination
- Stage 4: Awakening

### Local World Beats

Specific authored changes such as:

- MIRE MART loses grid power
- clinic enters evacuation state
- roadblock appears
- substation becomes accessible
- unusual fog event begins
- survivor group reaches HOME
- anomaly residue becomes stable enough to collect

The global band should not directly hard-code every local change.

## 4. Why local beats matter

Civilization decline is believable when the player witnesses concrete changes.

A global stage transition with no changed places is abstract.

A local beat can be remembered:

> The last time I was here, the lights still worked.

That memory is the emotional unit of the campaign.

## 5. Stage 0 — Ordinary / Hairline Cracks

### World promise

Normal explanations remain plausible.

### Institutional condition

- utilities mostly function
- commerce still exists
- emergency services still respond
- news/radio still frame incidents conventionally

### Horror vocabulary

- missing people
- odd animal behavior
- strange coastal conditions
- brief power instability
- contradictory local reports
- subtle sound/light anomalies

### Gameplay implications

- ordinary supplies dominate value
- early hostile encounters are localized
- modern infrastructure is still useful
- HOME is improvised rather than fully isolated

### Forbidden shortcut

Do not show full abyssal architecture, ubiquitous monsters or society-wide collapse here.

## 6. Stage 1 — Disturbance

### World promise

Normal systems still operate, but explanations and containment begin failing.

### Institutional condition

- closures/quarantines
- controlled road access
- shortages begin
- hospitals/police/utilities show stress
- some communications fail locally

### Horror vocabulary

- persistent creature sightings
- repeated impossible sounds
- sealed underground/shoreline zones
- unexplained medical symptoms
- recurring light/electrical disturbances

### Gameplay implications

- preparation becomes visibly useful
- selected POIs gain dangerous states
- special salvage categories emerge
- first route restrictions appear
- HOME begins replacing lost public services

## 7. Stage 2 — Social Fracture

### World promise

Human systems are failing faster than they can be repaired.

### Institutional condition

- evacuations
- fragmented authority
- unreliable grid/logistics
- looting/scarcity
- survivor movement
- local communities self-organize

### Horror vocabulary

- creatures no longer deniable
- contamination clusters
- altered behavior among people/animals
- repeating environmental anomalies

### Gameplay implications

- HOME services become central
- route choice matters
- salvage economy overtakes normal commerce
- NPC roles emerge from necessity
- co-op logistics becomes valuable

## 8. Stage 3 — Reality Contamination

### World promise

The crisis cannot be explained as disease, war or ordinary natural disaster.

### Institutional condition

- formal response mostly local/fragmented
- maps and records lose reliability
- surviving institutions operate as enclaves

### Horror vocabulary

- impossible geometry
- altered signage/text patterns
- shared dreams/memory disturbance
- abnormal tides/weather
- structures changing between visits
- materials with impossible properties

### Gameplay implications

- anomaly tools become relevant
- old POIs receive new affordances/hazards
- knowledge becomes a progression resource
- routes may change state
- enemy ecology mutates in understandable but disturbing ways

## 9. Stage 4 — Awakening

### World promise

The Abyss is no longer an inference. Reality is entering a different physical regime.

### Institutional condition

- civilization survives primarily through enclaves and local networks
- large systems are unreliable or absent

### Horror vocabulary

- major world events
- deep/forbidden regions
- explicit abyssal entities
- stable impossible phenomena
- large-scale environmental transformation

### Gameplay implications

- major bosses/events
- settlement defense/preparation pressure
- high-risk anomaly economy
- permanent regional transformations
- late-game knowledge/capability interactions

## 10. Stage transition rule

A global stage transition is valid only if the project has authored enough local content to make it observable.

Minimum transition payload:

1. at least one POI/world-space change
2. at least one gameplay/economy/threat change
3. at least one presentation change
4. at least one narrative/social signal

If only presentation changes, the transition fails the Director gate.

## 11. Beat trigger categories

Future beats may be triggered by:

### Player Achievement

Examples:
- recover critical evidence
- restore a facility
- defeat a major entity

### Time / Campaign Progress

Use cautiously. Time-based decline can create urgency, but should not punish slow players unpredictably.

### World Event

Examples:
- grid failure
- evacuation order
- storm/anomaly event

### Discovery

A location may enter a new known state when the player discovers information, even if the physical change occurred earlier.

### Compound Trigger

Recommended for major transitions.

Example:

`restore radio + recover substation logs + survive first regional anomaly`

This creates causal texture rather than a simple XP threshold.

## 12. Beat payload categories

A world beat may modify conceptually:

- POI availability
- POI local state
- route status
- hazard state
- enemy population profile
- loot/resource profile
- interaction availability
- NPC availability/routine/service
- HOME demand
- audio/light/weather presentation
- knowledge records
- future event eligibility

Not every beat touches every category.

## 13. Causality rule

Whenever practical, world changes should have an understandable cause chain.

Example:

`grid instability`
`-> repeated outages`
`-> MIRE MART refrigeration fails`
`-> food spoils / interior changes`
`-> generator parts become valuable`
`-> HOME power becomes a strategic objective`

This is stronger than independent scripted changes.

## 14. POI local-state contract

A future POI state should be describable with a small authored record.

Conceptual fields:

- `poiId`
- `stateId`
- `minimumWorldStage`
- `activationBeatIds[]`
- `presentationProfile`
- `resourceProfile`
- `enemyProfile`
- `interactionProfile`
- `routeProfile`
- `narrativeEvidenceIds[]`

These are conceptual names only. Engineering may choose a different runtime schema after repository audit.

## 15. Beat contract

A future world beat should conceptually declare:

- `beatId`
- `category`
- `trigger`
- `preconditions`
- `effects`
- `idempotency expectation`
- `persistence authority`
- `coOp visibility`

Idempotency matters because reconnect/retry and shared-world delivery can otherwise apply one world change twice.

## 16. Persistence boundary

Before persistent shared worlds exist, world-stage/beat experiments must clearly label themselves as one of:

- local prototype
- session-only
- local save
- Relay transient sync
- future persistent-world candidate

Never silently promote local browser state into shared authoritative campaign state.

## 17. Co-op consistency rule

Future shared world beats require a single authoritative result.

Questions engineering must answer before implementation:

- Who decides the beat occurred?
- Can two players trigger it simultaneously?
- What does a late joiner see?
- What happens after reconnect?
- Can a client replay the beat?
- Is the change global, per-world, per-party or per-player?

Until persistent-world architecture is implemented, avoid pretending those answers already exist.

## 18. Idempotency rule

A beat must be safe under repeated observation.

Bad:

`on load -> add 20 scrap because generator-restored beat is active`

Good:

`generator state is restored; reward transaction is separately recorded/consumed once`

World condition and one-time reward should not be conflated.

## 19. Reversibility rule

Not every state change is permanent.

Three categories:

### Permanent Campaign Beat

Examples:
- major institution collapses
- boss/world event completed
- region permanently transformed

### Persistent but Repairable State

Examples:
- generator broken
- bridge blocked
- clinic service offline

### Temporary Event State

Examples:
- storm
- blackout
- roaming threat

The category must be explicit before implementation.

## 20. Civilization decline and HOME growth coupling

The world should not only become worse.

Each major decline beat should create at least one possible human response.

Examples:

Grid failure
-> HOME generator/power progression

Medical shortage
-> medical station / medic progression

Communications collapse
-> radio network progression

Food distribution failure
-> cooking/farming/fishing progression

Institutional retreat
-> survivor roles / local governance progression

This preserves the central tension:

> Civilization declines globally while the player's local community becomes more capable.

## 21. Horror pacing budget

Each stage has a maximum visual/narrative reveal budget.

### Stage 0

Use mostly absence, contradiction and minor sensory anomalies.

### Stage 1

Show undeniable incidents, but keep causes uncertain.

### Stage 2

Show repeated unnatural patterns and hostile ecology.

### Stage 3

Show impossible reality behavior.

### Stage 4

Show explicit abyssal structures/entities/events.

Do not spend Stage 4 imagery in Stage 0 for short-term spectacle.

## 22. Information reliability curve

Narrative information should degrade in a structured way.

Stage 0:
- official sources mostly reliable

Stage 1:
- delayed/conflicting information

Stage 2:
- fragmented/local information

Stage 3:
- records/maps may contradict reality

Stage 4:
- knowledge requires local observation and specialized interpretation

This creates gameplay value for radio, survivor intel and field evidence.

## 23. Economy evolution by stage

### Stage 0

Normal goods still meaningful.

### Stage 1

Shortage goods increase in importance.

### Stage 2

Salvage/repair materials become central.

### Stage 3

Specialized protection/anomaly materials appear.

### Stage 4

Rare high-risk materials support late capabilities and defenses.

Avoid introducing late anomaly currencies too early.

## 24. Enemy evolution rule

Do not only replace weak enemy with stronger enemy.

A world stage may alter:

- where enemies appear
- how they use terrain
- what behaviors are common
- what materials they drop
- how recognizable their human/animal origin remains

Early enemies should help preserve ambiguity.

Late enemies may become explicitly impossible.

## 25. Audio / presentation coupling

Presentation systems may read world/POI state but should not own it.

Examples:

- HOME ambience reacts to HOME services
- OUTSIDE ambience reacts to world stage/weather
- MIRE MART ambience reacts to power/anomaly state

Audio/FX must remain consumers of state, not authorities that drive progression.

## 26. Art coupling

Production art should support multiple state variants without becoming gameplay authority.

Examples:

- powered vs unpowered sign/light
- intact vs abandoned prop composition
- subtle vs contaminated decal sets

Collision, interaction and progression state remain separate data.

## 27. Testing expectations for future implementation

Any implementation of world beats/stages should eventually cover:

- trigger exactly once where intended
- repeated evaluation is safe
- reconnect/late-load behavior
- POI state selection
- unsupported stage fallback
- save/load compatibility
- co-op state consistency
- presentation reads correct state
- no gameplay semantics inferred from art assets

## 28. First implementation recommendation

Do not implement all five stages.

The first valid implementation should prove only:

`Stage 0 -> one early Stage 1 beat`

Suggested proof shape:

1. complete first MIRE MART expedition
2. return HOME with evidence/salvage
3. one grounded world event occurs
4. MIRE MART or its route changes in a small authored way
5. one new gameplay opportunity/risk appears
6. audio/light/narrative signal the change

This is enough to prove the architecture.

## 29. Recommended first beat candidates

Choose one later after current vertical-slice integration stabilizes.

### Candidate A — Grid Instability

Pros:
- grounded
- supports generator/power HOME anchor
- changes light/audio/interactions
- fits gradual collapse

### Candidate B — Emergency Closure / Roadblock

Pros:
- visibly shows institutional response
- changes route logic
- supports alternate exploration

### Candidate C — MIRE MART Aftermath

Pros:
- reuses existing POI
- proves revisit value
- can change loot/enemy/presentation state

### Candidate D — Radio Warning

Pros:
- cheap first narrative signal
- can point to future destination

Best product value may come from combining a small version of A + C later.

## 30. Non-goals

This V1 contract does not authorize:

- a giant global event bus rewrite
- a new network protocol
- persistent-world storage
- procedural world-state generation
- dynamic AI director
- automatic asset-semantic inference
- all-stage content production

## 31. Director acceptance rule

A proposed Awakening feature is accepted only if it answers:

1. What changed in the world?
2. Why did it change?
3. What can the player now do differently?
4. What does HOME need because of it?
5. How does the player perceive it without exposition?
6. What state authority owns it?
7. Is it safe for solo and co-op?
8. Is it appropriately restrained for the current horror stage?

## 32. Final statement

Awakening should feel like the player is living through a historical process, not advancing through a level select.

The player should remember ordinary places, watch systems fail, improvise replacements at HOME, and eventually realize that the crisis was not merely social or ecological.

The world itself is becoming something else.

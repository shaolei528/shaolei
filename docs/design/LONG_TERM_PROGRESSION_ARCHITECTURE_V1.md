# ABYSSAL WAKE — Long-Term Progression Architecture V1

Status: Director architecture contract
Runtime authority: None
Scope: Long-form player/world progression, capability gates, HOME growth, POI lifecycle, co-op compatibility, save/network boundaries, milestone sequencing.

## 1. Purpose

ABYSSAL WAKE needs a progression architecture that can support years of content without turning into one giant quest chain or a collection of unrelated crafting systems.

This contract defines the product-level progression model before broad content expansion.

It deliberately does not prescribe implementation files or force a global refactor. Engineering should implement only the smallest slice required by the current milestone while preserving the boundaries defined here.

## 2. Progression is four coupled systems

The game should never use one number as the entire progression model.

Progression has four axes:

1. Survivor Capability
2. HOME Capability
3. World / Awakening State
4. Knowledge / Access

### Survivor Capability

Examples:
- weapon handling
- field medicine
- light/visibility
- carrying/extraction
- mobility
- environmental protection
- anomaly handling

This is the layer closest to equipment, tools and skills.

### HOME Capability

Examples:
- storage
- repair/fabrication
- power
- medical service
- food/water
- communications
- defense
- survivor services

HOME progression changes preparation and recovery.

### World / Awakening State

Examples:
- infrastructure condition
- enemy ecology
- resource availability
- POI state
- weather/audio/light behavior
- anomaly intensity
- institutional presence
- major event access

This is not player level. It represents what the world has become.

### Knowledge / Access

Examples:
- discovered routes
- decoded warnings
- known weaknesses
- radio frequencies
- access credentials
- facility maps
- survivor intel
- anomaly observations

Knowledge progression allows a player to gain options without always increasing raw power.

## 3. The progression equation

A healthy progression beat should ideally look like:

`new information or need`
`+ preparation choice`
`+ expedition risk`
`+ extracted value`
`-> new capability`
`-> changed world decision`

A weak progression beat looks like:

`fill bar -> number increases`.

Raw stat increases are allowed, but they should support the capability loop rather than replace it.

## 4. Capability gates

A gate is not necessarily a locked door.

ABYSSAL WAKE uses five gate types.

### Hard Gate

The action cannot be completed without a required capability.

Examples:
- powered lock requires restored electricity
- contaminated sample requires sealed container
- flooded route requires water-safe equipment

Use sparingly.

### Soft Gate

The content is technically possible, but the player is strongly underprepared.

Examples:
- dark interior without light
- long route without medicine
- heavy salvage without carrying capacity

Preferred for survival-driven exploration because it preserves player agency.

### Knowledge Gate

The player cannot meaningfully exploit the opportunity until they learn something.

Examples:
- hidden service tunnel
- enemy vulnerability
- radio code
- safe anomaly timing

### World-State Gate

The opportunity exists only after a civilization/Awakening beat.

Examples:
- evacuation opens a formerly occupied building
- power failure disables a security barrier
- anomaly emergence exposes a new underground route

### Social/HOME Gate

A service or survivor relationship makes an option available.

Examples:
- mechanic can repair advanced tools
- medic can stabilize certain injuries
- radio operator can identify new signals

## 5. Progression should create lateral choices

Avoid a single mandatory upgrade ladder whenever possible.

Early examples:

Choice A — restore generator
- reliable HOME lighting
- powered workbench
- some powered POI interactions

Choice B — restore medical station
- stronger recovery
- field medical recipes
- better failure tolerance

Choice C — improve storage / hauling
- larger extraction value
- less forced abandonment

The player may eventually obtain all of them, but the order should change expedition strategy.

This makes HOME feel authored by the player's priorities.

## 6. Campaign scale model

The campaign should be designed in bands, not as one continuous content dump.

### Band 0 — Ordinary World / Hairline Cracks

Player state:
- limited equipment
- modern systems still recognizable
- institutions still partially functioning

HOME state:
- temporary or improvised
- low capability
- dependent on scavenged modern supplies

World state:
- anomalies deniable
- creature encounters rare/localized
- normal infrastructure mostly visible

Primary player question:

> What is happening?

### Band 1 — Disturbance / Adaptation

Player state:
- first reliable expedition loadouts
- early crafted tools
- first meaningful specialization choices

HOME state:
- one or two repaired anchors
- emerging survivor roles
- basic local production

World state:
- shortages
- closures
- repeated abnormal incidents
- localized hostile ecology

Primary player question:

> How do we keep functioning while the outside gets worse?

### Band 2 — Social Fracture / Local Survival Economy

Player state:
- deliberate equipment builds
- larger extraction decisions
- route planning matters

HOME state:
- several practical services
- salvage/production economy
- residents have interdependent needs

World state:
- institutions retreat
- roads/clinics/shops change state
- safe routes become unstable
- information reliability decreases

Primary player question:

> What can this community still provide for itself?

### Band 3 — Reality Contamination

Player state:
- anomaly-handling capabilities
- specialized protection/tools
- knowledge becomes as important as gear

HOME state:
- defended human enclave
- controlled anomaly research/use begins carefully

World state:
- impossible spatial/environmental behavior
- old maps become partially unreliable
- POIs revisit in altered states
- creature ecology changes visibly

Primary player question:

> Which rules of reality still hold?

### Band 4 — Awakening

Player state:
- mature builds and co-op roles
- capabilities designed around specific world threats

HOME state:
- resilient settlement
- major services and defenses
- community decisions have campaign consequences

World state:
- explicit abyssal events
- deep routes and major bosses
- permanent regional transformations
- civilization-scale collapse is undeniable

Primary player question:

> What can humanity preserve, and what must it become to survive?

## 7. HOME progression architecture

HOME should progress through anchors, not abstract town level.

Recommended anchor families:

### Power

Tier 0: improvised lamps / unreliable power
Tier 1: repaired generator
Tier 2: stable local grid
Tier 3: specialized power / redundancy

Unlocks:
- lighting
- powered crafting
- radio
- refrigeration
- selected POI interactions

### Fabrication

Tier 0: hand repair
Tier 1: workbench
Tier 2: powered fabrication
Tier 3: anomaly-safe fabrication

Unlocks:
- tools
- equipment repair
- advanced components
- specialized containers

### Medical

Tier 0: basic rest/bandage
Tier 1: medical station
Tier 2: medic service
Tier 3: advanced treatment / contamination management

Unlocks:
- better recovery
- field medicine
- injury treatment
- later anomaly exposure mitigation

### Logistics

Tier 0: personal inventory only
Tier 1: shared/local storage
Tier 2: organized stockpile / hauling
Tier 3: expedition staging

Unlocks:
- extraction value
- co-op role differentiation
- resource planning

### Communications

Tier 0: noise / local notes
Tier 1: working radio
Tier 2: survivor network
Tier 3: regional intelligence

Unlocks:
- destination intel
- warnings
- survivor contacts
- world events

### Food / Water

Tier 0: scavenged consumables
Tier 1: cooking / purification
Tier 2: stable production
Tier 3: specialized supplies

Unlocks:
- expedition duration
- buffs
- community resilience

### Defense

Tier 0: safety by location
Tier 1: lighting / barriers
Tier 2: perimeter defense
Tier 3: event response

Unlocks:
- survival of later world pressure
- safer recovery

## 8. HOME upgrade rules

A valid HOME upgrade must satisfy at least two:

- visually changes HOME
- changes expedition preparation
- changes resource demand
- unlocks a recipe/service
- changes recovery/failure tolerance
- unlocks a route/interaction
- creates a new NPC role
- affects co-op division of labor

Avoid upgrades that only change a hidden percentage.

## 9. Equipment progression architecture

Equipment is organized by function rather than rarity color alone.

Recommended equipment families:

### Melee

Purpose:
- reliable close-range defense
- distinct timing/reach/control choices

Progression examples:
- improvised knife
- maintained/reinforced blade
- specialized melee tool

Do not add many near-identical weapons early.

### Light

Purpose:
- visibility
- signaling
- anomaly detection later

Progression examples:
- handheld flashlight
- stronger/longer-lasting light
- utility light with special interaction

### Medical

Purpose:
- reduce expedition failure risk
- treat different injury classes later

### Carry / Extraction

Purpose:
- increase what can be brought home
- create movement/weight tradeoffs later if desired

### Access Tools

Purpose:
- pry/cut/repair/power/scan specific environmental gates

### Protective Gear

Purpose:
- weather, contamination, environmental hazards

### Anomaly Tools

Purpose:
- observe, contain, stabilize or exploit abnormal phenomena

These should arrive late enough that early anomalies remain frightening and poorly understood.

## 10. Crafting progression architecture

Crafting should be shallow vertically and broad by capability.

Bad early structure:

`knife I -> knife II -> knife III -> knife IV -> knife V`

Preferred:

`knife`
`+ light tool`
`+ medical tool`
`+ access tool`
`+ carry improvement`

Then later specialize each branch.

Crafting stations act as capability hubs.

Recommended rule:

> A station tier should unlock a new class of decisions, not merely a larger recipe list.

## 11. Resource taxonomy

Avoid dozens of meaningless currencies.

Recommended resource classes:

### Ordinary Salvage

Examples:
- scrap metal
- wiring/electronics
- cloth
- plastic/containers
- basic chemicals

Use:
- repair
- fabrication
- HOME infrastructure

### Survival Supplies

Examples:
- food
- water
- medicine
- fuel/batteries

Use:
- expedition preparation
- daily resilience

### Specialized Components

Examples:
- medical components
- electrical parts
- mechanical parts
- secure access parts

Use:
- capability-specific upgrades

### Knowledge Items

Examples:
- maps
- records
- keys/codes
- radio frequencies
- research notes

Use:
- route and interaction unlocks

### Anomaly Materials

Examples:
- residue
- stabilized sample
- impossible material fragment

Use:
- late capability progression
- narrative/world discovery

Early anomaly materials should be rare, mysterious and difficult to exploit.

## 12. POI lifecycle architecture

POIs are not static dungeons.

Every important POI may define multiple authored states.

Recommended state fields conceptually:

- availability
- civilian/institution presence
- structural condition
- power state
- loot/resource emphasis
- enemy ecology
- anomaly intensity
- active interactions
- narrative evidence
- route connections

Example lifecycle for one modern location:

`operational`
`-> stressed/shortage`
`-> closed/evacuated`
`-> looted/abandoned`
`-> survivor-used`
`-> contaminated`
`-> abyssal`

Not every POI needs every state.

## 13. POI authoring rule

Before a new POI is approved, define:

1. Current civilization state
2. Reason to visit
3. Main risk
4. Primary extracted value
5. Capability or knowledge unlocked
6. HOME dependency created
7. Revisit potential
8. Awakening mutation potential

If these cannot be answered, the POI is probably decorative content rather than progression content.

## 14. Revisit architecture

At least some locations should become relevant again after:

- HOME power restored
- a new access tool is crafted
- an NPC provides information
- Awakening changes the location
- a boss/event alters the world

Revisits should reveal meaningful new affordances, not merely respawn loot.

## 15. Failure and recovery

The game should create risk without making co-op progression brittle.

Recommended failure layers:

### Field Failure

The player retreats or is forced back.

Consequence:
- time/resources lost
- some extraction value lost or delayed
- world continues

### Downed State / Co-op Rescue

Future co-op layer:
- partner can stabilize/revive
- rescue consumes time/supplies and creates tactical risk

### Death / Respawn

Should not casually erase major campaign progress.

Potential consequences can include:
- dropped field cargo
- temporary injury
- resource loss
- route reset

Exact mechanics require separate design and multiplayer authority review.

## 16. Co-op progression architecture

Co-op must not create separate incompatible progression logic.

Use shared goals where appropriate, but preserve individual capability choices.

Potential shared state:
- HOME anchors
- world stage
- POI state
- major route unlocks
- community survivors

Potential individual state:
- loadout
- personal equipment
- skill preference
- optional discoveries/records

Persistent-world authority is deferred until its dedicated backend phase.

Current Relay multiplayer must not be treated as proof that shared persistence exists.

## 17. Role emergence without hard classes

Prefer loadout-driven roles over mandatory classes.

Examples:

Scout:
- mobility
- light
- detection

Fighter:
- combat control
- armor
- medical backup

Hauler:
- extraction capacity
- support tools

Technician:
- access tools
- repair/power interactions

Medic:
- treatment
- supplies

Solo players can combine functions less efficiently.

## 18. Awakening progression coupling

World progression must not simply scale enemy HP.

Each Awakening band should alter combinations of:

- what is safe
- what is valuable
- what can be trusted
- what routes exist
- which institutions remain
- how old locations behave
- which tools matter

This makes the world feel like it is transforming rather than leveling up around the player.

## 19. Narrative progression coupling

Narrative should align with mechanical change.

Bad:

NPC says the power grid has collapsed, but every light and service works exactly as before.

Good:

A grid failure:
- changes lighting/audio
- closes or opens routes
- creates generator demand
- changes loot priorities
- alters NPC behavior
- creates a new HOME objective

Major story beats require at least one observable mechanical consequence.

## 20. Milestone dependency graph

### Milestone A — First Expedition Loop

Requires:
- clear objective
- MIRE MART trip
- combat/salvage
- return
- explicit result

Does not require:
- persistent world backend
- broad crafting
- second POI

### Milestone B — First HOME Capability

Requires:
- returned salvage has a use
- one visible functional upgrade
- one new preparation option

### Milestone C — First Capability Gate

Requires:
- equipment/tool or HOME service
- an existing/new interaction becomes viable

### Milestone D — First World Beat

Requires:
- one POI/world state change
- one gameplay consequence
- one presentation consequence

### Milestone E — POI Network

Requires:
- at least 2–3 destinations with distinct purpose
- route choice
- resource/capability differentiation

### Milestone F — Minimal Building

Requires:
- stable ownership/collision/input/persistence boundaries
- practical utility placement first

### Milestone G — Life Economy

Requires:
- HOME already matters
- at least one expedition pressure can be relieved by routine production

### Milestone H — First Boss / Major Event

Requires:
- learned combat patterns
- preparation economy
- meaningful world-change reward

### Milestone I — Persistent Worlds

Requires dedicated backend architecture:
- world identity
- authority
- permissions
- migrations
- recovery
- conflict handling

## 21. Save / persistence boundaries

Until persistent shared worlds are formally implemented, do not design features under the assumption that local state equals authoritative multiplayer state.

Any new progression system must explicitly declare which of these it uses:

- presentation-only local state
- local player save state
- session state
- Relay-synchronized transient state
- future persistent world state

If a feature cannot state this clearly, it is not architecture-ready.

## 22. Network boundaries

Progression design must not casually introduce new Relay authority.

Before adding networked progression semantics, define:

- authoritative source
- event ownership
- retry/reconnect behavior
- duplicate-event behavior
- late join behavior
- host/leader assumptions
- solo fallback

This is especially important for:
- shared upgrades
- POI state changes
- boss completion
- resource ownership
- world-stage transitions

## 23. Content scaling rule

Do not scale by adding more of everything.

Scale in this order:

1. more decisions
2. more interactions between existing systems
3. more world-state reactions
4. more distinct destinations
5. more content variants

This keeps production sustainable and reduces content debt.

## 24. Economy rule

The economy should make the player care about what they bring home.

Three questions must stay balanced:

- What do I spend before leaving?
- What am I risking while outside?
- What is valuable enough to bring back?

If extraction has no tradeoff, salvage becomes passive vacuuming.

If preparation is too expensive, the player becomes afraid to play.

If HOME has no meaningful demand, loot loses value.

## 25. Information economy

Not every reward needs to be an item.

High-value information rewards include:
- new route
- hazard forecast
- enemy tell/weakness
- safe time window
- hidden room
- survivor location
- radio contact
- POI state warning

This supports mystery without inflating item counts.

## 26. Horror progression rule

Horror intensity and mechanical complexity should rise together, but not uniformly.

Early:
- subtle sound/light abnormality
- rare impossible detail
- human explanations still plausible

Middle:
- repeated contradictions
- changed POIs
- creature/environment interaction
- infrastructure failure

Late:
- explicit reality violation
- deep anomaly mechanics
- major world events

Do not use cosmic spectacle as filler content.

## 27. Director gate for any progression feature

A proposed feature must answer:

1. Which progression axis does it advance?
2. What new capability or decision appears?
3. What gate does it open or soften?
4. What HOME or OUTSIDE loop does it affect?
5. Does it react to world state?
6. Is it solo-valid and co-op-useful?
7. What state authority owns it?
8. What is the smallest testable implementation?

If these are unclear, the feature should remain a concept rather than enter production.

## 28. Current near-term interpretation

Given the current repository state, the next product value should come from closing loops rather than expanding breadth.

Priority sequence:

1. stabilize the accepted Loader + Spatial integration spine
2. prove MIRE MART expedition objective flow
3. make return-to-HOME produce a meaningful result
4. add one functional HOME anchor
5. add one capability gate tied to that anchor
6. implement one world-state reaction
7. only then expand destination count

This sequencing is compatible with the current Director master plan and does not require any other team's ongoing branch to be rewritten.

## 29. Non-goals of V1

This contract does not authorize immediate implementation of:

- skill trees
- large item rarity systems
- procedural quest generation
- persistent world backend
- faction reputation
- dozens of NPC services
- complex weight simulation
- raids
- farming seasons
- marriage/social simulation
- large boss roster

These remain future design space.

## 30. Final architecture statement

ABYSSAL WAKE progression is successful when the player can look backward and see two histories at once:

1. the history of a HOME that became more capable, inhabited and worth defending;
2. the history of an OUTSIDE world that became less stable, less human and less explainable.

Every major system should strengthen one or both histories.

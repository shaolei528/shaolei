# ABYSSAL WAKE — Core Loop / Awakening / Civilization Decline Master Plan V1

Status: Director design contract
Scope: Product direction, vertical-slice loop, long-form narrative progression, feature-gap priorities
Runtime authority: None. This document does not change gameplay semantics by itself.

## 1. Product identity

**ABYSSAL WAKE / 深渊苏醒** is a modern post-apocalyptic cosmic-horror co-op survival sandbox RPG about building a human home while the outside world gradually stops behaving like reality.

The core emotional contrast is:

> **HOME becomes more human, warm, useful and personal while OUTSIDE becomes less explainable, less stable and less recognizably real.**

This is not a game that begins after civilization has already disappeared. The player should witness the decline.

The long-form experience begins close to recognizable modern life, then moves through social disruption, infrastructure failure, localized anomalies, loss of institutional control, reality contamination and finally true abyssal awakening.

## 2. The five-game DNA model

The reference games are experiential sources, not content to copy literally.

### Crashlands — moment-to-moment combat and useful crafting

Keep:
- readable enemy intent
- immediate hit confirmation
- movement-based combat
- crafting/equipment that materially improves capability
- strange creature personality
- later pet/companion utility

ABYSSAL WAKE translation:

`fight -> salvage -> craft a capability -> survive a harder expedition`

### Terraria — exploration-gated progression

Keep:
- equipment opens new places and risks
- memorable authored regions and underground routes
- bosses as progression gates, not just large HP pools
- discovery that continually suggests something exists beyond the current boundary

ABYSSAL WAKE translation:

`POI -> tool/equipment/knowledge gate -> new route -> staged boss/world event`

### Minecraft — a base that belongs to the player

Keep:
- practical building
- player expression
- the world can be changed by the player
- home becomes visibly different because of previous expeditions

ABYSSAL WAKE translation:

`salvage returned from OUTSIDE -> HOME gains a new physical capability`

The first implementation must be small and useful before broad construction is attempted.

### Don't Starve — preparation and readable survival pressure

Keep:
- leaving safety should feel like a decision
- supplies matter before the trip
- hunger / health / sanity pressure is readable and counterplayable
- OUTSIDE has a hostile ecology and time pressure

ABYSSAL WAKE translation:

`prepare correctly or accept a harder return journey`

Survival systems must create choices, not arbitrary punishment.

### Stardew Valley — home life has value beyond recovery

Keep:
- routine
- useful NPCs
- production and gradual growth
- a place that feels lived in
- long-term attachment to people and home

ABYSSAL WAKE translation:

HOME should eventually support:
- service NPCs
- repairing / crafting / cooking / farming / fishing
- practical daily routines
- visible community growth

Do not begin with a giant relationship simulator. Life systems enter only after the expedition loop is meaningful.

## 3. The fusion rule

The five inspirations should not become five disconnected minigames.

Use this product structure:

**HOME = Stardew Valley + Minecraft**

**OUTSIDE = Don't Starve + Terraria**

**COMBAT = Crashlands**

**AWAKENING = ABYSSAL WAKE's unique world-progression layer across all of them**

Every new subsystem should connect to at least one of:
- expedition preparation
- combat/survival
- discovery
- return-home value
- co-op role/value
- awakening/world change

If a feature connects to none of these, it is probably not a current priority.

## 4. Primary game loop

The canonical loop is:

```text
HOME: recover / organize / craft / choose destination
  -> prepare food, medicine, tools, light and equipment
  -> leave safety
  -> travel through an authored OUTSIDE route
  -> observe a changing modern world
  -> fight / avoid / survive
  -> enter a POI
  -> salvage resources, clues and special materials
  -> make a return-risk decision
  -> return to HOME
  -> repair / craft / upgrade something meaningful
  -> unlock a new capability, route or objective
  -> world awakening state advances or reacts
  -> repeat
```

The return step is mandatory. A successful expedition is not complete until what was brought home changes the player's next decision.

## 5. First 20–30 minute vertical slice

The first truly complete slice should prove the entire loop rather than simply prove isolated systems.

### Opening state

HOME / Safe Camp contains:
- rest/recovery
- minimal storage
- one broken or incomplete practical facility
- basic preparation options
- at least one human NPC/service presence or clear future hook

The player receives a grounded reason to investigate MIRE MART or its surrounding road.

### Preparation

The player chooses a small loadout:
- basic knife
- food/water or equivalent recovery item
- bandage/medical preparation
- optional light/tool if available

The important design goal is not inventory quantity. It is that the player understands: **OUTSIDE is safer when prepared.**

### Expedition

Route:

`HOME -> roadside OUTSIDE -> MIRE MART exterior -> MIRE MART interior/threshold -> combat/salvage -> return`

The route should communicate:
- civilization still existed here recently
- something is wrong, but the truth is not yet known
- danger increases with distance from HOME

### Combat

Crawler combat should demonstrate:
- readable attack intent
- clear hit vs miss
- player hurt feedback
- movement matters
- the creature is disturbing without immediately revealing full cosmic-horror scale

### Salvage

The player returns with a deliberately small set of valuable items, for example:
- scrap metal
- batteries/electrical parts
- medicine
- food
- an anomalous residue/sample

### HOME payoff

The first vertical slice must allow at least one **visible, functional HOME improvement**.

Recommended first choice:

**Repair a workbench / generator / medical station.**

This should:
- consume returned salvage
- visibly change HOME
- unlock a capability for the next expedition

Examples:
- workbench -> improved knife / utility tool
- generator -> reliable light / powered equipment
- medical station -> better recovery or field supplies

Only one needs to be implemented initially.

### Next objective

After the HOME improvement, reveal a second destination or a new condition at an existing location.

The player should finish the slice understanding:

> I went outside, risked something, brought value home, changed my base and now I can go somewhere I could not meaningfully handle before.

## 6. Long-form narrative rule: witness civilization decline

The story should be long enough that the player remembers the world before it became fully abyssal.

Do not start with a complete apocalypse.

The early experience should contain recognizable modern systems:
- convenience stores
- roads
- clinics
- apartments
- transit
- utility infrastructure
- phones/radio/news
- police/municipal response
- ordinary work and family concerns

The horror becomes powerful because those systems fail gradually.

## 7. Civilization decline arc

### Stage 0 — Normality with hairline cracks

The world is mostly explainable.

Examples:
- unusual coastal fog
- isolated disappearances
- abnormal animal behavior
- temporary power cuts
- strange emergency notices
- rumors treated as misinformation

Institutions still function.

Player feeling:

> Something is wrong, but normal life still exists.

Gameplay effect:
- mostly recognizable POIs
- low corruption intensity
- ordinary loot/economy still matters
- creature encounters are rare and deniable

### Stage 1 — Disturbance

Official explanations begin to fail.

Examples:
- contamination claims
- quarantine zones
- sealed tunnels
- unexplained medical cases
- restricted coastline
- communications become unreliable in specific areas

Institutions still attempt control.

Gameplay effect:
- selected POIs change
- new hazards appear locally
- first persistent hostile creatures
- sound/light anomalies
- specific resources become harder to obtain

### Stage 2 — Social fracture

The problem is no longer local.

Examples:
- shortages
- looting
- roadblocks
- hospital overload
- evacuations
- unreliable grid power
- fragmented communication
- refugees/survivors entering HOME

Player feeling:

> The systems that made modern life easy are breaking.

Gameplay effect:
- preparation matters more
- HOME services become valuable
- salvage replaces normal purchasing
- NPC roles emerge
- safe routes and dangerous routes diverge

### Stage 3 — Reality contamination

Human institutions can no longer explain what is happening.

Examples:
- impossible growth through concrete
- geometry that no longer matches maps
- altered signage/language
- recurring sounds with no source
- abnormal tides/weather
- shared dreams/memories
- recognizable places changing between visits

Gameplay effect:
- old POIs gain new states
- traversal assumptions change
- enemies mutate in readable ways
- anomalies become mechanics, not decoration
- new resources and risks appear

### Stage 4 — Awakening

The world is entering a new physical condition.

This is not simply "more purple" or "more tentacles".

It should affect:
- weather
- soundscape
- creature ecology
- NPC behavior
- routes
- underground/deep-water access
- resources
- boss/world events
- HOME defense and preparation

The player now understands that the earlier crisis was not disease, war or ordinary environmental collapse.

The Abyss is waking.

## 8. Narrative implementation rule

Civilization decline must be shown through **changed places and changed routines**, not only exposition.

A POI should be able to have multiple life states.

Example: MIRE MART

```text
normal convenience store
-> shortage / partial closure
-> looted emergency stop
-> survivor shelter
-> abandoned dangerous POI
-> localized anomaly site
-> later abyssal state
```

The same principle applies to:
- clinics
- gas stations
- apartment blocks
- transit stations
- docks
- warehouses
- schools
- utility facilities

A player should be able to say:

> I remember when this place was still normal.

That memory is part of the horror design.

## 9. NPC decline rule

NPCs should also experience civilization decline.

Avoid NPCs who exist only to explain lore.

Useful NPC arc example:

```text
ordinary mechanic worried about power cuts
-> repairs camp generator
-> searches for missing family
-> begins hearing unexplained sounds
-> contributes to settlement survival
-> changes behavior as awakening increases
```

NPC changes should affect services, requests, information, routines or practical HOME value.

## 10. Awakening is world progression, not player XP

The game has two opposing progression curves.

### Human progression

```text
fragile camp
-> useful home
-> equipped survivor
-> functioning community
-> defended human foothold
```

### World progression

```text
normal
-> disturbed
-> unstable
-> contaminated
-> awakened
```

This tension is a defining identity of ABYSSAL WAKE.

The player becomes more capable while reality becomes more dangerous and less familiar.

## 11. Awakening system requirements

A future Awakening system should eventually react through data/events rather than visual filters alone.

A stage transition may affect:
- POI state
- enemy tables/behavior
- resource availability
- environmental audio
- weather/lighting
- NPC schedules/dialogue/services
- routes/blocked passages
- anomalies
- boss access
- HOME pressure/events

Do not implement all of these at once.

The minimum valid implementation is:

**one stage change -> at least one POI change + one gameplay change + one presentation change**

If only the color grading changes, Awakening is not implemented.

## 12. Co-op design rule

Multiplayer should become more than shared visibility.

Future high-value co-op behaviors:
- revive/help a downed player
- carry/share supplies
- complementary equipment/loadouts
- shared expedition objectives
- shared HOME improvements
- scouting vs fighting vs hauling roles
- coordinated extraction/return decisions

Do not make solo state invalid. Co-op should amplify options and stories, not become mandatory for basic progression.

## 13. Current feature-gap priorities

### P0 — Complete the first real loop

Required before broad expansion:
- meaningful salvage return
- one HOME functional upgrade
- one crafting/equipment payoff
- clear next expedition objective

### P1 — Equipment/crafting progression

Start small:
- improved melee option
- flashlight/light utility
- bandage/medical field option
- backpack/carry improvement
- one exploration tool/gadget

Every item must change a decision, not merely increase inventory count.

### P1 — Exploration/discovery structure

Build a small authored network of memorable destinations before a huge map.

Candidate future POIs:
- clinic
- gas station
- apartment block
- utility/substation
- transit/subway entrance
- dock/warehouse

Each POI must answer:
1. Why go there?
2. What danger changes the route?
3. What comes home?
4. What does it unlock or reveal?

### P1 — Awakening progression seed

Convert the current Stage 0 / early Stage 1 concept into a real data-driven progression contract later.

Do not prematurely create a giant global state machine before the first two authored stage transitions are known.

### P2 — Minimal building

First building implementation should be practical:
- storage
- work surface
- light/power
- simple defense

Do not begin with a giant construction catalog.

### P2 — HOME life

After HOME has practical value, add one or two loops at a time:
- cooking
- fishing
- farming
- NPC service roles
- small production chains

### P2 — Boss progression

The first boss should test learned systems and unlock a world change.

Do not implement it as only a high-HP creature.

## 14. Features intentionally deferred

Do not prioritize yet:
- marriage/large relationship simulation
- dozens of NPCs
- broad farming catalog
- animal breeding
- giant procedural open world
- large class system
- dozens of bosses
- persistent private-world backend before the local loop is proven
- complex guild/social infrastructure

These may be valuable later, but they are not current vertical-slice blockers.

## 15. Architecture / modularity verdict

Current modularization should be treated as **substantially established but not complete**.

What is already true:
- V21 runtime is split into responsibility-oriented files
- network/combat/input/render/world/survival ownership is documented
- art pipeline is separated from collision/gameplay authority
- testing/CI contracts exist for important runtime paths

What remains architectural debt:
- some behavior still depends on browser-global load order
- compatibility modules remain
- some ownership boundaries are enforced by wrapper/capture patterns rather than narrow service hooks
- world/combat spatial wrapper debt must be removed before authored POI expansion
- loader retry hardening should be integrated after QA acceptance

Do **not** stop product development to rewrite the entire game into ES modules.

Rule:

> Fix architectural debt when it blocks the next product step; do not perform architecture rewrites for aesthetic purity.

## 16. Art and horror pacing rule

Early ABYSSAL WAKE must remain visually recognizable as a modern human world.

Do not begin with:
- full-screen purple corruption
- ubiquitous tentacles
- every human already mutated
- every building already ruined beyond recognition

The visual progression should move roughly:

```text
modern / familiar
-> neglected / disrupted
-> damaged / abandoned
-> locally impossible
-> explicitly abyssal
```

This applies to:
- terrain
- props
- lighting
- enemies
- NPCs
- weather
- FX
- audio

## 17. Director acceptance test for any new feature

Before approving a new feature, ask:

1. Which part of the core loop does this strengthen?
2. Does it create a new decision or only more content volume?
3. Does it belong to HOME, OUTSIDE, COMBAT or AWAKENING?
4. Does it conflict with current architecture ownership?
5. Does it preserve gradual civilization decline?
6. Does it work for solo and make co-op better rather than mandatory?
7. Is it more valuable than completing the current vertical slice?

If the answers are weak, defer the feature.

## 18. Near-term development order

After current overnight branches are independently audited, the recommended product sequence is:

1. integrate accepted reliability/feel/art changes safely
2. complete canonical production art intake for the current slice
3. complete one HOME functional-upgrade loop
4. connect MIRE MART salvage to that HOME upgrade
5. add the smallest meaningful crafting/equipment progression
6. implement one visible/reactive Awakening transition
7. only then author POI #2
8. before POI #2, finish shared spatial/combat hook refactor and regression parity
9. expand life/building systems only after the first loop is repeatable

## 19. Core statement

ABYSSAL WAKE should ultimately feel like this:

> You leave a home that is slowly becoming worth protecting, enter a modern world that is slowly becoming impossible, survive long enough to bring something useful back, and every successful return makes humanity a little stronger while the Abyss becomes a little more awake.

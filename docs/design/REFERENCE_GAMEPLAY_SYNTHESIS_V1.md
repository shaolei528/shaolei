# ABYSSAL WAKE — Reference Gameplay Synthesis V1

Status: Director research/design contract
Runtime authority: None
Scope: Translate the five reference games into reusable design laws for ABYSSAL WAKE without copying content, story, art, names, maps, recipes, or implementation.

## 1. Why this document exists

The project already has a clear identity. The remaining risk is feature accumulation: taking a mechanic from each reference game until the project becomes a pile of disconnected systems.

This document defines what to borrow at the level of player psychology and progression structure, what to reject, and how each principle maps into ABYSSAL WAKE.

The core rule is:

> Borrow loops and decision structures, not surface content.

## 2. The five reference roles

- Crashlands teaches how combat, crafting and equipment can form one fast capability loop.
- Terraria teaches staged world progression, capability gates, biome identity and boss-triggered world change.
- Minecraft teaches player ownership, practical construction and the value of making a place physically yours.
- Don't Starve teaches preparation pressure, systemic survival, self-directed goals and a hostile environment that teaches through consequence.
- Stardew Valley teaches attachment to place, productive routines, long-term home improvement and community value.

ABYSSAL WAKE fuses these under one unique progression layer:

> Humanity becomes more organized while reality becomes less stable.

## 3. Crashlands — capability-first crafting

### What works

Crashlands links exploration and crafting directly to combat capability. Better crafted equipment lets the player survive stronger creatures and enter more dangerous regions. Combat is readable enough that equipment does not replace skill; it changes options and error tolerance.

Its crafting ecosystem also includes workstations, active gadgets, passive trinkets and creature/pet utility. That creates different capability vectors instead of a single linear damage number.

### Borrow

- Crafting must create a new capability, not only a larger stat.
- Combat progression should combine player execution with preparation.
- A new workstation should unlock a meaningful branch of possible decisions.
- Side progression can produce optional power without blocking the main path.
- Creature utility can later become a support layer rather than a required damage multiplier.

### Reject

- Hundreds of recipes before the core loop is proven.
- Inventory volume as a progression goal by itself.
- Large recipe trees where most outputs are functionally redundant.
- Pets as mandatory DPS automation.

### ABYSSAL WAKE translation

Early capability families should be small:

1. melee reliability
2. light / visibility
3. medical field recovery
4. carrying / extraction capacity
5. environmental access
6. anomaly handling

A valid recipe should answer:

- What new risk can the player now accept?
- What previous friction is reduced?
- What location becomes more practical?
- What co-op role can this support?

If the answer is only "+5 damage", it is weak unless that stat crosses a clearly designed threshold.

## 4. Terraria — cyclic progression and world-state gates

### What works

Terraria progression repeatedly cycles through:

`new place -> new danger -> new resource -> better equipment -> boss/event -> world changes -> new place`

Major bosses do more than award loot. Some permanently change the world or unlock new areas, enemies, NPCs and resources. Crafting stations and key materials are also embedded in progression rather than existing as a flat catalog from the start.

### Borrow

- Exploration and progression should form a cycle, not a checklist.
- Major victories should change what exists in the world.
- Regions should have distinct resource/threat identities.
- Important equipment should function as access keys or preparation thresholds.
- Previously visited locations can become newly relevant after a world-state change.

### Reject

- Boss quantity as a success metric.
- Pure gear-score doors with no fiction or world logic.
- Huge biome count before each biome has a reason to exist.
- Progression that invalidates all earlier content after each tier.

### ABYSSAL WAKE translation

A major progression beat should ideally change at least three of these:

- route availability
- POI state
- enemy ecology
- resource table
- NPC behavior/service
- anomaly behavior
- HOME requirement
- presentation layer

Example:

`restore emergency power -> access substation systems -> discover abnormal grid behavior -> new powered doors become usable -> radio interference increases -> new anomaly resource appears`

This is stronger than:

`reach level 5 -> door opens`.

## 5. Minecraft — ownership through transformation

### What works

Minecraft's survival loop turns exploration and resource collection into a world the player can physically reshape. The home is useful because it stores effort, protects the player, enables production and reflects personal choices.

The important lesson is not "add lots of blocks". The important lesson is that the world remembers player labor spatially.

### Borrow

- HOME must visibly change because of expeditions.
- Construction should solve practical problems before serving decoration.
- Storage, lighting, access, defense and production are stronger first building goals than broad cosmetic catalogs.
- The player should develop spatial memory and ownership.
- Resource scarcity can naturally motivate exploration.

### Reject

- Voxel-style unrestricted construction as an early requirement.
- Thousands of placeable objects before persistence/ownership is stable.
- Building systems that do not affect preparation or survival.
- Cosmetic freedom that destabilizes multiplayer authority.

### ABYSSAL WAKE translation

The first building ladder should be:

`repair -> place utility -> improve utility -> connect utilities -> defend utilities`

Recommended early HOME anchors:

- workbench
- generator
- medical station
- storage
- radio/communications table
- water/food preparation
- perimeter light

Each anchor should be understandable at a glance and create a new preparation option.

## 6. Don't Starve — endogenous goals and preparation pressure

### What works

Don't Starve deliberately avoids over-directing the player. Its crafting interface, environmental danger and survival needs teach the player to form their own goals. The player learns by discovering relationships between resources, tools, time, light, food and risk.

Its strongest lesson is that survival systems are valuable when they create planning, not when they merely drain bars.

### Borrow

- The player should often infer the next preparation step from the world.
- Survival pressure should create timing and loadout choices.
- The environment should punish unreadiness in predictable ways.
- Early failure should teach a system relationship.
- Crafting progression should reveal the next class of problem without requiring constant quest arrows.

### Reject

- Opaque punishment with no readable counterplay.
- Harsh permadeath as the default product identity.
- Survival meters that exist only as chores.
- Constant quest-marker guidance that removes discovery.

### ABYSSAL WAKE translation

The objective system should guide the first expedition, but the mature game should gradually shift toward player-owned goals.

Early:

`Find medicine at MIRE MART.`

Later:

`The clinic route is flooded, the generator is low, and your medic is out of antiseptic.`

The player should be able to decide:

- repair power first
- risk the flooded route
- craft more medical supplies
- take a different POI
- ask a co-op partner to cover another need

This is stronger than a permanent linear quest list.

## 7. Stardew Valley — attachment, routine and home economy

### What works

Stardew creates long-term attachment because the home and community change through repeated small actions. Farming, fishing, mining, combat, crafting, NPC interaction and restoration all feed a broader sense of growth.

The important lesson is that low-intensity activity can be meaningful when it changes future options or relationships.

### Borrow

- HOME should contain productive routines, not only menus.
- NPCs should have practical roles and changing needs.
- Repeated activities can become comforting when they are short, readable and useful.
- Community restoration is a strong long-term progression vector.
- Skill growth should unlock options, recipes, efficiency or specialization.

### Reject

- Large relationship systems before core expedition gameplay works.
- Farming as a disconnected side game.
- Routine that becomes mandatory maintenance with no meaningful choice.
- Calendar complexity before HOME has enough value to justify it.

### ABYSSAL WAKE translation

Every life-system activity must support one or more expedition pressures.

Examples:

- cooking -> better field recovery / buffs
- fishing -> food + rare contamination samples
- farming -> stable ingredients / medicine inputs
- mechanic NPC -> repairs power/tools
- medic NPC -> treatment + field medical recipes
- scavenger NPC -> information + salvage conversion
- radio operator -> route intel / warnings

HOME life exists to make the player care about returning.

## 8. Synthesis: the ABYSSAL loop

The combined loop is not five parallel loops. It is one nested structure.

### Minute-to-minute

Crashlands influence:

`read threat -> move -> attack/avoid -> receive feedback -> adapt`

### Expedition-to-expedition

Don't Starve + Terraria influence:

`prepare -> choose risk -> explore -> discover -> obtain capability material -> extract`

### Session-to-session

Minecraft + Stardew influence:

`return -> improve HOME -> strengthen services/routines -> unlock preparation options`

### Campaign-to-campaign

ABYSSAL WAKE unique layer:

`human foothold strengthens while civilization and reality deteriorate`

This produces two opposing curves:

Human curve:

`isolated survivor -> useful camp -> organized household -> survivor community -> defended enclave`

World curve:

`ordinary city -> disruption -> institutional failure -> contamination -> impossible geography -> awakening`

## 9. Seven design laws

### Law 1 — Every expedition must change the next decision

A successful trip must return at least one of:

- capability material
- knowledge
- access key
- survivor/NPC value
- HOME upgrade input
- anomaly evidence

A trip that only increases generic currency is weak.

### Law 2 — Every major upgrade must open or simplify a risk

Examples:

- flashlight -> dark interiors become viable
- better medical kit -> longer trips become viable
- generator -> powered HOME services / powered POI interactions
- pry tool -> sealed salvage rooms
- anomaly container -> unstable samples can be extracted

### Law 3 — Every world stage must alter gameplay, not only presentation

Minimum stage transition contract:

- one place changes
- one gameplay rule/resource/threat changes
- one presentation layer changes

### Law 4 — HOME upgrades must be spatially visible

Menus can support systems, but a major HOME improvement should have a world-space representation whenever practical.

### Law 5 — Early horror is uncertainty, not spectacle

Before full Awakening, the player should repeatedly encounter situations where normal explanations are plausible but increasingly insufficient.

### Law 6 — Co-op adds parallel options, not mandatory dependency

Two players should gain:

- faster information gathering
- complementary loadouts
- safer extraction/revive
- division of labor

Solo remains valid.

### Law 7 — Content follows capability

Do not author ten POIs that all support the same decisions.

Add a POI when it introduces at least one new:

- resource category
- enemy pattern
- traversal requirement
- narrative evidence type
- HOME dependency
- world-state interaction

## 10. The anti-bloat test

Reject or defer a feature if all are true:

- it does not unlock a decision
- it does not strengthen HOME/OUTSIDE contrast
- it does not support survival/combat/discovery/co-op
- it does not react to Awakening
- it duplicates an existing capability

Examples of likely premature work:

- many decorative furniture sets
- dozens of recipes with equivalent outputs
- a second melee weapon that only differs by tiny DPS
- NPC relationship tiers with no practical consequence
- large procedural maps with no authored purpose

## 11. Progression vocabulary for future engineering

Use these terms consistently:

- **Capability**: something the player can now do reliably that they could not do before.
- **Gate**: a risk, route or interaction that becomes practical after a capability is gained.
- **Expedition**: a HOME-originating risk loop intended to return value to HOME.
- **HOME Anchor**: a spatial facility or service that changes preparation.
- **POI State**: the authored condition of a location at a given world stage.
- **Awakening Stage**: global narrative/world progression band, not player level.
- **World Beat**: a discrete change caused by story, expedition success or Awakening.
- **Extraction Value**: anything that matters only if successfully returned to HOME.
- **Knowledge Unlock**: information that creates a route, recipe, warning or interaction rather than raw stats.

## 12. Research-derived design opportunities not yet in the current slice

These are not immediate implementation assignments. They are future high-value candidates.

### Capability-gated revisit

Borrow the Terraria principle that a previously known place becomes newly useful after progression.

Example:

MIRE MART early visit:
- food / medicine / crawler encounter

Later revisit after power capability:
- freezer room opens
- security terminal reveals delivery route
- abnormal refrigeration residue becomes extractable

### Workstation progression

Borrow Crashlands/Terraria crafting-station progression, but keep it small.

Possible chain:

`damaged workbench -> repaired workbench -> powered bench -> anomaly-safe fabrication`

Each tier should unlock a distinct capability family.

### Environmental teaching

Borrow Don't Starve's preference for learning through system consequence.

Example:

The player first experiences darkness as a mild visibility problem near HOME, then as an ambush risk outside, then learns why carrying a light source matters before entering underground infrastructure.

### Community restoration

Borrow Stardew's restoration arc without copying its structure.

Possible long-term goal:

Restore essential civic functions in miniature:

- power
- medicine
- water
- communications
- food
- security

The camp gradually becomes a small replacement for failed institutions.

### Spatial ownership

Borrow Minecraft's visible permanence.

The player should be able to identify screenshots of their HOME at different campaign phases without relying on UI labels.

## 13. What makes ABYSSAL WAKE distinct

The project should not be pitched internally as "Crashlands + Terraria + Minecraft + Don't Starve + Stardew + Cthulhu".

The stronger identity is:

> A co-op survival RPG about maintaining a human home while witnessing modern civilization and physical reality fail in stages.

The five references provide proven answers to different design problems. They do not define the product.

ABYSSAL WAKE's unique promise is the tension between restoration and collapse.

## 14. Source notes

Public design/gameplay material consulted for this synthesis:

- Butterscotch Shenanigans / Crashlands developer writing on combining story with crafting progression.
- Crashlands product feature descriptions covering crafting-driven character progression, combat, exploration and building.
- Official Terraria Wiki progression guidance describing the recurring explore/resource/upgrade/boss/world-change cycle and permanent world-state changes such as Hardmode.
- Minecraft official survival-mode material describing exploration, gathering, crafting, combat, hunger/health and building.
- Klei's Don't Starve design writing on intrinsic versus extrinsic goals and crafting-led learning, plus official Don't Starve Together descriptions of fighting, farming, building and exploration.
- Stardew Valley official product description describing home restoration, farming, crafting, skills, community and cave exploration.

These sources are used only to infer high-level design principles. No copyrighted game content, assets, dialogue, code or proprietary implementation is reproduced here.

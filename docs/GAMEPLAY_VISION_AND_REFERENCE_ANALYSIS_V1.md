# ABYSSAL WAKE Gameplay Vision and Reference Analysis V1

**Status:** User-approved product and camera direction. The user chose the supplied concept image's 3/4 oblique view, accepts the successor gameplay direction, and wants a high-quality full-game refresh. The successor route is approved to proceed; prototypes and captures are validation tools, not a pending decision about whether to pursue 3/4. V21 remains the compatibility/reference build until the successor has passed real-loop, visual, save/network, and regression gates; only then may individually audited obsolete files be retired. This document defines product intent; it does not claim the pictured systems or art are implemented.

## 1. The game we are making

**ABYSSAL WAKE / 深渊苏醒** is a cooperative survival sandbox RPG in a recognizable modern coastal city, presented in a **3/4 oblique top-down view** rather than a strict isometric grid. The opening should feel like a place people could live: a small safe harbor, useful camp routines, familiar shops and roads, and friends meeting before danger. Strange signals, failing lights, wrong tides and missing people gradually reveal that the abyss is waking. The city changes district by district; cosmic horror grows from ordinary urban life instead of replacing it on the first screen.

The core promise is **边生活，边战斗**. Players prepare and care for HOME, choose a reason to risk an OUTSIDE expedition, explore and fight, bring back supplies or clues, then improve the camp and its people's lives. Co-op adds scouting, combat, carrying, building and shared discoveries while keeping a solo player's progress understandable.

The art target is **Modern High-Detail Pixel Art**: deliberate pixel clusters, authored shapes and readable characters at game scale. The provided concept is a mood/composition reference; its blended painterly texture, tiny UI labels and AI-rendered text are not production specifications. Final assets must follow `ART_BIBLE.md` and the existing asset intake gates.

## 2. What the supplied concept image communicates

The image is a stitched concept presentation, not evidence of a running game. Its strongest ideas are:

- **A readable home base:** a sunny coastal safe zone with a campfire, dock, shelter, sign, named people and visible places to rest, craft and trade.
- **A complete set of player needs:** health, food and a purple mind/sanity meter; equipment and materials on a hotbar; a quest prompt that gives a first useful goal.
- **A social world:** several recognizable NPCs, short speech bubbles, nearby/world chat, and a visible co-op presence indicator.
- **A reason to leave safety:** a night scene with a lantern, a distant watcher and a short warning. Day and night feel like different risk states.
- **A loop between screens:** inventory/crafting shows costs and results; the map shows named destinations around the home; the main scene shows where those choices happen.
- **A mobile-aware control layout:** large attack, interact and dash buttons with a thumb area, alongside a compact hotbar.

The most important visual contrast is warm, inhabited HOME against a beautiful but uneasy OUTSIDE. Keep the safe area bright enough to navigate. Let shadows, sound, weather and one anomalous detail carry early fear; increase enemy presence and environmental corruption later.

Use the pictured UI as a feature inventory, not a mandate to show everything at once. On a phone, the quest panel, chat, three meters, map, hotbar and three action buttons compete for space. The shipped interface should prioritize the current action, offer collapsible panels, respect safe areas and be checked at real mobile sizes. The pictured coordinates, server/online labels, quest names, recipes, locations and companion animals are placeholders until separately designed and validated.

The concept's diagonal 3/4 camera gives strong depth to the docks and buildings. The user has approved this as the successor presentation direction. The active V21 boot list loads the current renderer and 64×64 terrain slice; those draw world X and Y directly to screen X and Y, so they do not implement the pictured 3/4 projection. Camera conversion affects terrain, occlusion, collision presentation, sprite animation and mobile readability. Build the successor in isolated, reviewable slices that preserve V21 save/network/gameplay contracts until each compatible replacement passes; use prototypes to test the implementation and quality, not to reopen the chosen direction.

## 3. Five references, one original game

Learn from each game's player experience and combine the lessons around ABYSSAL WAKE's HOME/OUTSIDE loop. Do not copy characters, names, maps, art, UI, recipes, or exact systems.

| Reference | Useful design lesson | ABYSSAL WAKE adaptation | Canonical modules that deliver the lesson | Keep out of the first slice |
|---|---|---|---|---|
| **Crashlands** | Characterful creatures, attacks the player can learn, resource-to-craft progression, companions and story momentum. | Make each enemy's intent readable; make drops answer a crafting or expedition need; introduce one useful companion only after basic combat and home value work. | Combat & Weapons; Creatures & AI; Loot & Rewards; Crafting & Processing; Animation & Presentation; later Pets & Companions. | Wacky tone that breaks the modern cosmic-horror mood; a broad creature-taming collection before the core loop. |
| **Terraria** | Exploration makes discoveries and equipment open new places; combat, materials, homes and bosses feed each other. | Use a small number of authored city POIs; tools, clues and upgrades open safer or deeper routes; build toward a first boss as a world event. | World & Terrain; POI & Exploration; Character & Progression; Quest & Narrative; Items & Inventory; Crafting & Processing; Combat & Weapons; Creatures & AI; Loot & Rewards. | A huge map, many gear tiers or boss ladder before one memorable route is complete. |
| **Minecraft** | Gathered materials become useful shelter and player expression; the base changes what the next trip can do. | Start with modular camp upgrades—light, storage, a workbench and simple protection—whose value is visible on the next expedition. | HOME & Building; Items & Inventory; Crafting & Processing; Rendering & Camera. | An unlimited block catalog or persistent shared construction before world ownership and save authority are designed. |
| **Don't Starve / Don't Starve Together** | Preparation, environmental pressure and resource chains create meaningful risk; co-op makes survival a shared activity. | Give clear warnings for night, hunger, sanity and dangerous districts; let co-op players divide practical expedition tasks. | Survival & Needs; Time & Weather; Network & Co-op; UI & Map; Input & Accessibility; Items & Inventory; Crafting & Processing; Farming & Food. | Surprise punishment, opaque survival decay or permanent loss that makes newcomers afraid to explore. |
| **Stardew Valley** | Small routines, named residents, relationships, farming and restoration make a home feel worth returning to. | Give NPCs distinct camp roles and schedules; use short personal quests and shared restoration goals; add farming/animals when food has a clear expedition purpose. | NPC & Social; Quest & Narrative; Farming & Food; HOME & Building; Time & Weather. | A large romance/calendar/social simulation before NPCs have useful roles in the survival loop. |

These references complement one another rather than making five equal feature lists. The defining combination is: **Crashlands' readable action + Terraria's discovery and gates + Minecraft's useful home + Don't Starve's legible preparation + Stardew's people and routines**, all filtered through modern-city science fiction and gradually escalating abyssal horror.

### 27-owner reference routing index

The five references are experience sources, not a requirement to force every technical owner under one game's label. Use this index to route future single-module tasks: a module may draw on multiple player-experience lessons, or be a **cross-cutting support owner** with no single reference-game inspiration. The original ABYSSAL WAKE loop and the current module map remain authoritative; examples below are prompts for original design, not claims that these features are implemented.

| Canonical owner | Reference lesson(s) / support role | Original ABYSSAL WAKE task trigger | Cross-module interface / cooperating canonical owner(s) |
|---|---|---|---|
| Core State & Save | Cross-cutting support; protects persistence independently of all five designs | A player returns to HOME and the selected, approved camp upgrade survives reload without losing older saves. | Domain owners provide versioned state; Network & Co-op consumes only the separately approved shared snapshot. |
| Character & Progression | Terraria progression gates; Crashlands' clear crafting/action growth | One recovered tool opens a newly authored route choice, without granting generic XP by default. | Items & Inventory supplies equipment facts; Quest & Narrative consumes unlock milestones; UI & Map displays choices. |
| Movement & Locomotion | Don't Starve's readable risk preparation; Crashlands' responsive action | A short dodge or movement response is tuned and tested without letting presentation bypass collision. | Input & Accessibility sends intent; World & Terrain resolves legal coordinates; Character & Progression supplies approved modifiers; Animation & Presentation reads motion. |
| Items & Inventory | Minecraft and Terraria resource-to-choice progression; Don't Starve preparation | A compact expedition kit lets the player choose light, healing food or salvage capacity. | Crafting & Processing, Loot & Rewards, Farming & Food, and Interaction & Gathering request transactions; Inventory alone settles stacks/equipment. |
| Crafting & Processing | Crashlands' resource-to-craft momentum; Minecraft's useful HOME preparation | One station turns a verified salvage part into a practical next-trip upgrade. | HOME & Building supplies station identity; Items & Inventory atomically applies costs/results; Content & Localization supplies stable recipe definitions. |
| Interaction & Gathering | Terraria exploration; Stardew's object-centered daily routines | Inspecting one authored object creates a request; its domain owner decides discovery or reward. | Input & Accessibility sends one intent; World & Terrain / POI & Exploration validates target context; the domain owner settles result and Items & Inventory applies item changes. |
| Combat & Weapons | Crashlands readable attacks; Terraria encounter escalation; Don't Starve risk management | A distinct enemy telegraph creates a readable choice to evade, block or counter. | Input & Accessibility sends attack intent; Creatures & AI applies confirmed mob damage; Survival & Needs applies confirmed player damage; Animation & Presentation / Audio & Feel consume confirmed events. |
| Creatures & AI | Crashlands characterful creatures; Terraria encounter identity | One original coastal creature signals intent clearly and requests damage through Combat. | Combat & Weapons validates hits/attacks and emits confirmed damage; World & Terrain / POI & Exploration supply legal space/context; Loot & Rewards owns defeat rewards. |
| Loot & Rewards | Crashlands useful drops; Terraria progression rewards; Minecraft materials support home | A confirmed POI search yields one authored item choice through Inventory, once only. | POI & Exploration, Creatures & AI or Quest & Narrative supplies confirmed eligibility; Items & Inventory settles the grant. |
| World & Terrain | Terraria exploration; Don't Starve environmental pressure | A visible high-tide edge matches its separately owned blocked/walkable world query. | Movement & Locomotion, Interaction & Gathering, POI & Exploration and Creatures & AI query canonical space; Rendering & Camera reads world snapshots. |
| POI & Exploration | Terraria discovery and gated routes | A small civic location reveals a route clue; Quest and Loot remain separate owners. | World & Terrain validates location/space; POI owns operational visit/search phases; Quest & Narrative consumes milestones without copying them; Loot & Rewards settles search rewards. |
| HOME & Building | Minecraft player expression/useful shelter; Stardew home restoration | A player-chosen workbench or lamp placement visibly improves preparation for one trip. | World & Terrain validates placement; Items & Inventory settles costs; Crafting & Processing queries stations; Core State & Save persists approved building state. |
| Quest & Narrative | Terraria progression gates; Stardew personal/community requests | A resident asks for a verified route repair; Quest alone owns that narrative request's acceptance and completion state. | NPC & Social offers the request; POI & Exploration supplies visit/search milestones; Loot & Rewards settles approved rewards; UI & Map presents the objective. |
| NPC & Social | Stardew routines and community; Crashlands characterful storytelling | One named harbor resident changes location by a simple schedule and offers a short optional conversation. | Time & Weather supplies clock context; Quest & Narrative owns accepted request state; Input & Accessibility / UI & Map sends interaction choices; Items & Inventory settles exchanges. |
| Pets & Companions | Crashlands companion personality; Minecraft player choice; Don't Starve expedition preparation; Stardew HOME presence | `companion.tidemark_runner` remains a draft until the user selects it; begin with follow/wait/recall only. | Input & Accessibility sends commands; World & Terrain resolves legal movement; Rendering & Camera / Animation & Presentation displays read-only state; Core State & Save / Network & Co-op join only in separately approved stages. |
| Fishing & Catch Log | Stardew timing and collection; Crashlands' rare or dangerous catch possibility | Cast from a dry bank, react during the bite window, and record one fish in the catch log. | Input & Accessibility sends cast/reel intent; World & Terrain validates water reach; Items & Inventory settles one catch; Survival & Needs owns meal effects; Core State & Save stores the log. |
| Farming & Food | Stardew's meaningful routine; Don't Starve's readable resource preparation | One crop or animal product should answer a concrete food/expedition need before adding a full farm economy. | Time & Weather supplies cycles; HOME & Building supplies farm space; Items & Inventory stores outputs; Survival & Needs applies nutrition. |
| Survival & Needs | Don't Starve's legible pressure and preparation | A warning gives time to respond to hunger or exposure; no surprise punishment. | Time & Weather supplies time/environment facts; World & Terrain supplies exposure context; Combat & Weapons confirms hostile damage; Items & Inventory settles consumed items. |
| Time & Weather | Don't Starve environmental shifts; Stardew daily rhythm | Rain or tide changes a route cue and HOME ambience, while domain owners decide any gameplay effect. | World & Terrain reports location/exposure; Farming & Food, Survival & Needs, UI & Map and Audio & Feel consume the clock/weather snapshot. |
| Rendering & Camera | Cross-cutting support for the approved 3/4 successor and high-detail pixel-art target | The same actor and shoreline remain sharp, correctly depth-sorted and readable at desktop and phone sizes. | World & Terrain supplies coordinates; Asset Pipeline supplies validated assets; Animation & Presentation supplies visual state; Input & Accessibility uses inverse projection. |
| Animation & Presentation | Crashlands action readability; Stardew's expressive everyday motion | A confirmed hit or HOME rest event receives a distinct animation without changing game state. | Combat & Weapons / Creatures & AI / HOME & Building emit confirmed events; Rendering & Camera owns projection/order; this module owns clips only. |
| UI & Map | Don't Starve danger/status legibility; Terraria discovery; Stardew routine display | Show the nearest actionable route clue while allowing secondary panels to collapse on mobile. | Core/domain owners supply read-only snapshots; Input & Accessibility normalizes chosen commands; POI & Exploration / Quest & Narrative supply map/objective facts. |
| Input & Accessibility | Crashlands responsive action; Don't Starve's readable control/preparation loop | One normalized interact command works from keyboard and touch without firing twice. | UI & Map collects device input; Movement & Locomotion, Combat & Weapons, and Interaction & Gathering validate/settle their own commands. |
| Network & Co-op | Don't Starve Together shared preparation and role clarity | Two players coordinate a scouting and return plan while existing Relay contracts stay unchanged. | Domain owners define approved shared snapshots/events; Core State & Save remains separate persistence owner; UI & Map displays connection/session state. |
| Audio & Feel | Cross-cutting feedback support; Crashlands combat clarity and Don't Starve atmosphere | One confirmed telegraph or hit receives a distinct, comfortable cue without duplicate sounds. | Combat & Weapons, Creatures & AI, Survival & Needs, World & Terrain and Time & Weather provide confirmed events/read-only ambience context. |
| Content & Localization | Cross-cutting support for Stardew-like named residents and understandable world text | A stable POI/NPC content ID resolves readable Chinese and a safe fallback string. | Domain owners consume stable IDs; UI & Map displays localized labels; Asset Pipeline validates asset references without owning simulation rules. |
| Asset Pipeline | Cross-cutting support for every reference-inspired visual; no game owns the project's art contract | Validate a new original sprite's source size, alpha, frame grid and anchor before runtime use. | User-designated art contributor creates isolated candidates (non-canonical role); Content & Localization supplies stable IDs; Rendering & Camera validates the runtime display. |
| Integration & QA | Cross-cutting quality owner; verifies the combined HOME → POI → return experience | Re-run one focused feature regression plus adjacent movement, interaction and save/network checks. | Every affected domain owner supplies its regression contract; Integration & QA verifies the combined loop, target-size visuals and evidence scope. |

**Coverage:** all 28 canonical owners have a routing row, a concrete original task trigger and named cross-module handoff(s). Six owners are explicitly cross-cutting support rather than being artificially assigned to a reference game's feature list. The cooperation column is an interface-routing aid, not shared ownership: each task still chooses exactly one canonical lead owner and treats the others as input/validation partners.

Official descriptions used for this synthesis: [Crashlands — Butterscotch Shenanigans](https://www.bscotch.net/games/crashlands), [Terraria — Re-Logic](https://terraria.org/about), [Minecraft — Mojang](https://www.minecraft.net/en-us/article/how-minecraft), [Don't Starve Together — Klei](https://www.klei.com/games/dont-starve-together), [Stardew Valley — official site](https://www.stardewvalley.net/about/).

## 4. The integrated player loop

1. **Live at HOME:** meet people, check supplies, recover, craft, sort equipment and choose a destination.
2. **Choose a reason to go:** a practical resource, an NPC request, a repair part, a clue or a new route. Keep the first destinations close and recognizable.
3. **Explore OUTSIDE:** read the terrain and enemy intent, gather what is useful, decide whether to fight or avoid danger, and notice one environmental story detail.
4. **Return with value:** bring back resources, knowledge or a rescued survivor. A successful return should change the next choice at HOME.
5. **Grow the foothold:** improve a station, shelter, relationship, supply routine or future expedition option; then choose what the changing city reveals next.

The first designed session should be a compact version of this loop, not a tutorial tour of every planned system. The existing MIRE MART expedition and HOME workbench contracts are the closest repository design anchors; recheck their implementation status before describing them as playable.

## 5. System modules and boundaries

These are product/module boundaries for the successor and for safely understanding V21 during transition; they are not a mandate to rewrite every subsystem at once. Canonical names and owner decisions live in [`SUCCESSOR_MODULE_MAP.md`](SUCCESSOR_MODULE_MAP.md); this table is the gameplay-oriented summary and must stay aligned with it. Each task has one lead module; neighbor modules communicate through explicit requests/events and documented data ownership.

| Canonical module | Owns | Boundary rule |
|---|---|---|
| Core State & Save | Versioned player/world save snapshots and migration | Does not own live Relay transport or duplicate domain rules. |
| Character & Progression | Player identity, attributes, skills and unlock rules | Does not own item stacks, combat resolution or UI layout. |
| Movement & Locomotion | Player movement response, velocity/acceleration and locomotion state | Input sends normalized intent; World & Terrain validates space; Animation presents movement. |
| Items & Inventory | Item definitions, stacks, slots, equipment and inventory transactions | Does not decide recipes, quest eligibility or attack results. |
| Crafting & Processing | Recipe validation, station requirements and transformation requests | HOME owns station placement; Inventory settles item changes. |
| Interaction & Gathering | Player requests, target/range checks and gathering intent | Does not grant rewards or own inventory counts; calls the domain owner. |
| Combat & Weapons | Attack/hit validation, damage amount/cooldown and accepted damage events | Does not own enemy intent, creature HP/life, reward tables, visuals or transport. |
| Creatures & AI | Creature definitions, mob HP/life/respawn, intent, movement and behavior phases | Requests attacks from Combat; applies accepted damage; emits defeat once; never owns drops. |
| Loot & Rewards | Eligible reward selection, unique claim and reward request | Requires confirmed combat/quest/world outcomes; Inventory applies items. |
| World & Terrain | Canonical coordinates, regions, terrain and collision queries | Camera projection and art never determine walkability. |
| POI & Exploration | Destination data, discovery records, operational visit/expedition/search phases and exploration facts | Quest & Narrative consumes POI milestones but does not mirror the operational phase machine; Loot & Rewards settles rewards. |
| HOME & Building | Camp structures, placement/upgrade state and station identity | Crafting queries stations; Save persists approved state. |
| Quest & Narrative | Narrative request acceptance/decline/completion, story choices/flags and quest-specific completion eligibility | NPC may offer a request; POI & Exploration owns operational travel/search phases; Quest consumes milestones without duplicating them. |
| NPC & Social | Resident identity, schedules, dialogue and relationships | Quest owns objective state; Items & Inventory settles item exchanges. |
| Pets & Companions | Companion roster, follow/wait behavior and commands | Farm animals belong to Farming; combat effects go through Combat. |
| Farming & Food | Crop/livestock cycles and farm production eligibility | Time supplies clock/weather; Inventory applies outputs; Survival applies food effects. |
| Survival & Needs | Player HP, hunger, sanity, food effects, zero-HP/death-state and recovery semantics | Combat confirms damage; Survival applies needs/dead-state effects; Items applies inventory costs/penalties; HOME/World supplies a validated recovery destination; Core Save persists. It does not own item counts, world coordinates or clock/weather. |
| Time & Weather | World clock, day/night and weather state | World reports exposure; Survival/Combat apply explicitly owned effects. |
| Rendering & Camera | Projection, viewport, depth ordering, scene layers and draw lifecycle | Reads snapshots only; never mutates world or gameplay state. |
| Animation & Presentation | Visual states, animation clips, VFX and camera feedback cues | Consumes confirmed events; Rendering owns projection and draw ordering. |
| UI & Map | HUD, menus, inventory/map views and displayed state | Sends commands; does not own domain state. |
| Input & Accessibility | Keyboard/touch/controller mapping and accessible intent | Sends one normalized intent; domain modules validate and settle it. |
| Network & Co-op | Session transport, approved message contracts and shared delivery | Does not become game-rule authority or persistent save storage. |
| Audio & Feel | Music, SFX, haptics and bounded sensory feedback | Communicates confirmed events; does not create gameplay results. |
| Content & Localization | Stable content IDs, authored data and localized text | Does not implement simulation rules or own art-file processing. |
| Asset Pipeline | Art source metadata, validation, manifests and runtime asset lookup | Rendering owns how assets are projected; asset data never defines collision. |
| Integration & QA | Cross-module regression gates and evidence scope | Does not silently take ownership of domain behavior. |

## 6. Recommended build order

1. **Protect and map the compatibility base:** verify actual V21 entry, mobile controls, SafeCamp, Relay, save, MIRE MART route and workbench upgrade. Inventory the successor's current entry and shared-worktree ownership. Treat this as preserving player value during transition, not a reason to keep V21 as the final visual target.
2. **Build the successor's high-quality 3/4 foundation:** coordinate art and engineering contracts (source scale, anchors, ground projection, collision/world coordinates, occlusion and input mapping). Use one coherent HOME composition and one dark OUTSIDE view as early acceptance scenes. Reject blurry, coarse-mosaic, painterly-inconsistent or unreadable output; validate at desktop and phone sizes before scaling content production.
3. **Integrate the first complete successor loop:** HOME preparation → one POI → readable combat/search → return → visible useful HOME improvement. Reuse proven domain behavior behind explicit interfaces where safe; keep save/network formats and gameplay authority compatible unless a separate migration is reviewed.
4. **Add one NPC loop:** one resident with a useful role, a simple schedule, one optional request and one visible effect at HOME. This tests the NPC/quest/UI boundaries before expanding the cast.
5. **Expand progression in small connected slices:** equipment/tool access, one companion, one farm/food use, more POIs, then a first staged boss. Each should make the expedition/home loop richer.
6. **Retire V21 only after replacement acceptance:** prove the successor owns the real HOME-to-POI loop, visual quality, save compatibility, co-op boundaries and regression coverage. Then audit each legacy file's entry points, tests and external references; retain a rollback point and retire only files with no remaining consumers. Design persistent shared worlds and larger settlement systems later, after ownership and migration rules are clear.

## 7. Acceptance tests for future feature proposals

Before accepting a new system or daily content candidate, answer in plain language:

- What does the player do with it, and how does it connect HOME to OUTSIDE?
- Which one module owns its state, and which neighboring modules consume it?
- Does co-op remain understandable and fair? What does a solo player do?
- Does the art read at the actual game/mobile scale and fit the gradual horror arc?
- What existing behavior, save data or network contract could it affect?
- What visible result proves the feature works in play?

If these answers are missing, keep the idea in the content inbox as a draft rather than adding it to the implementation roadmap.

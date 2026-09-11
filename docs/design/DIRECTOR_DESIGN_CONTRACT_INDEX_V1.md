# ABYSSAL WAKE — Director Design Contract Index V1

Status: Director navigation contract
Runtime authority: None

## 1. Purpose

This index tells future engineering, QA and art work which Director design documents answer which questions and how to resolve overlap.

## 2. Contract set

### ABYSSAL_WAKE_CORE_LOOP_AWAKENING_MASTER_PLAN_V1.md

Use for:
- product identity
- five-reference fusion rule
- first 20–30 minute loop
- HOME vs OUTSIDE emotional structure
- initial feature-gap priority

### CIVILIZATION_DECLINE_NARRATIVE_ARC_V1.md

Use for:
- long-form civilization decline
- narrative escalation
- reality becoming gradually less explainable
- horror pacing

### REFERENCE_GAMEPLAY_SYNTHESIS_V1.md

Use for:
- what is actually worth borrowing from Crashlands, Terraria, Minecraft, Don't Starve and Stardew Valley
- anti-bloat tests
- capability/progression design laws

### LONG_TERM_PROGRESSION_ARCHITECTURE_V1.md

Use for:
- player/HOME/world/knowledge progression axes
- capability gates
- HOME anchor families
- equipment/crafting/resource taxonomy
- POI lifecycle/revisit rules
- save/network authority questions
- milestone dependency graph

### AWAKENING_WORLD_STATE_CONTRACT_V1.md

Use for:
- Stage 0–4 meaning
- global stage vs local world beat distinction
- transition requirements
- persistence/idempotency questions
- first reactive world beat design

### FIRST_10_HOURS_CAMPAIGN_BLUEPRINT_V1.md

Use for:
- opening campaign pacing
- when civilization decline becomes visible
- when cosmic evidence becomes undeniable
- early POI/NPC/equipment sequencing
- first-ten-hour production targets

### SYSTEM_ROLLOUT_GATES_V1.md

Use for:
- build order
- team ownership
- acceptance gates
- integration sequencing
- what not to start yet

## 3. Precedence

When documents appear to overlap, apply this order:

1. current repository/runtime truth
2. newest explicit Director decision
3. system-specific Director contract
4. broad master plan
5. older roadmap/documentation

No design document can override actual runtime behavior by declaration alone.

## 4. Implementation rule

These are design/architecture contracts, not permission to build every described system immediately.

Engineering must still:
- re-read current branch/HEAD/diff
- identify ownership
- choose the smallest milestone-aligned implementation
- run tests
- avoid main
- avoid automatic merge/deploy

## 5. Scope collision rule

Before starting a task, identify which contract owns the decision.

Examples:

- combat feel -> Core Loop + F ownership
- collision/LOS -> repository architecture + B ownership
- asset semantics -> canonical E contract/pipeline
- world-stage behavior -> Awakening World-State Contract
- long campaign pacing -> First 10 Hours Blueprint / Civilization Decline Arc
- new POI timing -> System Rollout Gates

If two active branches would edit the same ownership surface, Director must choose an order rather than letting both proceed independently.

## 6. Current strategic sentence

> Close loops before multiplying content; strengthen HOME while the outside world becomes less stable and less explainable.

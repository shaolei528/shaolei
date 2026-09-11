# MIRE MART Expedition Loop V1

Status: session/local-slice gameplay contract

## Objective

Turn the existing route into a complete, understandable expedition loop:

`SafeCamp → north road → MIRE MART → search/fight → secure salvage → SafeCamp → clear result / next step`

This is **not** a second POI, quest engine, inventory system, network protocol, save backend, Building system, or Persistent World implementation.

## State contract

Canonical V1 progression:

1. `PREPARE`
2. `LEAVE_HOME`
3. `REACH_MIRE_MART`
4. `SEARCH_FIGHT` (displayed as `SEARCH / FIGHT`)
5. `SECURE_REQUIRED_SALVAGE`
6. `RETURN_HOME`
7. `COMPLETE`

Required salvage for V1 is the existing inventory item:

- `shard >= 2`

No new item type or inventory schema is introduced.

## Ownership

### Expedition service owns

- current session objective phase
- progression between the seven states
- death/retry handling for the expedition attempt
- objective text derived from the current phase and existing runtime state
- one local completion announcement

### Existing systems continue to own

- SafeCamp rules
- inventory
- harvesting
- combat and all combat numbers
- crawlers / mobs
- MIRE MART placement, collision, interactions and loot
- movement / LOS
- save format
- Relay / multiplayer protocol

The UI is presentation only. It displays the state owned by the expedition service.

## Progression rules

### PREPARE

The player must have the existing Bone Knife before the expedition can advance. Existing wood/stone counts are shown only to guide preparation; they are not duplicated into expedition-owned inventory.

### LEAVE_HOME

Leaving SafeCamp advances the run. No new movement or zone authority is introduced.

### REACH_MIRE_MART

Entering the existing MIRE MART store or parking footprint advances the run.

### SEARCH_FIGHT

The player searches the existing MIRE MART interactions and may fight the existing crawlers. Combat is not mandatory as a separate quest flag; the objective is to secure the required existing salvage without changing combat semantics.

### SECURE_REQUIRED_SALVAGE

The run recognizes `inventory.shard >= 2`. Existing salvage already carried by the player is valid, but the player must still physically reach MIRE MART and complete the expedition route; starting with two shards does not auto-complete the expedition from HOME.

### RETURN_HOME

The player must leave MIRE MART with the required salvage and physically return to SafeCamp.

### COMPLETE

Completion occurs only on a live return to SafeCamp with the required salvage. Respawning at HOME after death does not count as a successful return.

The completion result points to the existing workbench / Lantern path when the player does not yet have a Lantern. If a Lantern already exists, the next hint is to resupply for another expedition.

## Early return

Returning to SafeCamp before the required salvage is secured does **not** complete or reset the objective. The UI directs the player back to MIRE MART.

## Death / respawn

Death interrupts the active expedition attempt. On respawn at SafeCamp, the service starts a new local attempt at `LEAVE_HOME` (or `PREPARE` if the required preparation is no longer present).

This prevents death/respawn from being misclassified as `RETURN_HOME → COMPLETE`.

If death reduces inventory below the required salvage threshold, the player must secure the missing salvage again.

## Re-entry / idempotency

Repeated entry into MIRE MART does not duplicate state, rewards, listeners, timers, mobs, loot, or completion announcements.

The service adds no scheduler and no event listener root. It advances when the existing UI update path calls `updateQuest()`.

## Scope / persistence debt

V1 expedition state is intentionally **session-local**.

It is not written into `abyssal_wake_save_v5`, Relay messages, or any shared-world persistence layer.

Consequences:

- page reload can restart the expedition objective state even though existing inventory/save data remains
- completion does not grant a permanent HOME upgrade
- multiplayer clients can be on different local objective phases while still sharing the same world/combat/resource state

A future persistent expedition/quest system must define authoritative shared-world semantics before adding permanent HOME upgrades or cross-session completion. V1 must not pretend that problem is solved.

## Regression requirements

Before acceptance, verify:

- fresh start
- complete state order
- repeated MIRE MART entry
- early return
- death / respawn
- starting with sufficient salvage
- SafeCamp combat suppression unchanged
- PC/mobile input unchanged
- loader retry semantics unchanged
- Relay protocol unchanged
- production relay health
- live two-client multiplayer

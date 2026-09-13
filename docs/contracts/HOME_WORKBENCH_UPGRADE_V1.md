# HOME Workbench Upgrade V1

Status: local-player persistent HOME gameplay contract

## Objective

Close the first playable progression loop without adding a second POI or a building system:

`Safe Camp → MIRE MART → secure salvage → return alive → Workbench → Field Rig upgrade → stronger next expedition capability`

The upgrade is deliberately small and functional. It does not add farming, a building catalog, a boss, another POI, or a new network architecture.

## Eligibility

The existing MIRE MART Expedition Loop remains authoritative for the expedition objective.

A Field Rig upgrade clearance is recorded only when that loop reaches `COMPLETE`, which already requires:

- the player to leave Safe Camp
- physically reach MIRE MART
- secure at least 2 existing `shard` inventory items
- leave MIRE MART with the required salvage
- return alive to Safe Camp

Simply owning shards does not grant the clearance.

The clearance is local-player persistent so a page reload after a successful return does not erase the HOME payoff opportunity.

## Workbench upgrade

The existing Safe Camp workbench is the only upgrade station used by V1.

Field Rig cost:

- `stone: 3`
- `shard: 2`

Upgrade rules:

- must have a successful-return clearance
- must currently be inside Safe Camp
- must have the required existing inventory resources
- consumes the resources exactly once
- is idempotent after completion
- persists independently from the existing `abyssal_wake_save_v5` inventory schema

## Functional payoff

Before upgrade:

- leaving Safe Camp grants the existing field ward for 15 seconds

After Field Rig upgrade:

- leaving Safe Camp grants the same existing field ward for 25 seconds

No new combat stat, damage rule, movement rule, mob rule, or invulnerability system is created. V1 only changes the duration supplied to the already-existing departure ward.

## Multiplayer semantics

Field Rig V1 is a personal HOME upgrade, not a shared-base mutation.

The existing multiplayer architecture continues to sync only the existing `ward: boolean` presence/movement state. The local client simply keeps that boolean true for 25 seconds instead of 15 seconds after an upgraded departure.

V1 adds:

- no Relay protocol version change
- no new broadcast event
- no new packet field
- no server-side save authority
- no shared-world building state

Remote players therefore observe the upgraded ward through the same existing boolean they already consume.

## Persistence

Dedicated key:

`abyssal_home_workbench_v1`

Stored state is intentionally minimal:

- upgrade tier
- successful-return clearance
- last qualifying return timestamp

The module does not change `abyssal_wake_save_v5`, `abyssal_v9_gameplay`, or Relay persistence formats.

## Ownership boundaries

Core / World / Gameplay owns:

- successful-return handoff from the expedition objective
- HOME upgrade eligibility and resource consumption
- departure ward-duration capability

This slice does not modify:

- E art assets, render mappings, sprites, terrain, decals, or production intake
- F audio, hit feel, weapon presentation, camera feel, or presentation polish

The workbench reuses the existing craft panel and recipe styling; no new art asset or presentation framework is introduced.

## Regression requirements

Acceptance requires:

- no upgrade before a qualifying MIRE MART return
- early return cannot unlock the upgrade
- death / respawn cannot unlock the upgrade
- successful return records clearance once
- upgrade requires Safe Camp
- upgrade consumes exactly 3 stone + 2 shard
- repeated upgrade attempts do not consume more resources
- tier persists across reload
- departure ward remains 15 seconds before upgrade
- departure ward becomes 25 seconds after upgrade
- MIRE MART Expedition Loop regressions still pass
- V21 loader ordering remains deterministic
- Relay protocol remains `abyssal-relay-v1`
- existing gameplay regression suite passes
- production relay health passes
- live two-client multiplayer passes

# Handoff — Successor Module Routing Contract Review

Date: 2026-10-05  
Status: documentation contract pass; successor systems remain planned, not implemented.

## Verified project baseline

- Repository: `shaolei528/shaolei`
- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Working tree: broadly dirty and untracked, with mixed/unknown provenance. Preserve it; do not reset, clean, overwrite, or claim unattributed work.

## What this pass clarified

The successor routing index now gives all 27 canonical module owners a distinct task trigger and named cooperating owner/interface. The added cooperation column is a routing aid; every task still has one canonical lead.

Three ownership boundaries were made explicit:

1. **POI & Exploration / Quest & Narrative:** POI owns the operational expedition phases (leave, arrive, search, secure, return). Quest owns narrative request acceptance, choices, completion and story flags. Quest consumes POI milestones; it does not maintain another copy of the travel/search phase machine.
2. **Combat & Weapons / Creatures & AI:** Combat validates and confirms damage. Creatures owns mob HP/life, applies confirmed mob damage, and emits defeat once. AI and presentation cannot decide hits or mutate mob HP.
3. **Art production / integration:** the user-designated art contributor is a creative role, not a canonical module owner. Asset Pipeline owns intake/metadata/manifests; Rendering & Camera owns runtime projection and display acceptance. Neither role owns game rules.

The gathering transaction was also tightened after review: Interaction & Gathering checks the target and availability; World & Terrain / POI & Exploration supply spatial and place context; Loot & Rewards decides explicitly authored award eligibility; Items & Inventory applies item changes. Ownership/persistence for depleted shared resource nodes is still undefined and needs a separate contract before implementation.

The POI, Quest and Creatures cards, the asset-pipeline card, the routing map, five-game reference index, and generic single-module task prompt were updated to match those boundaries.

## Verification and limits

- `node tests/successor-module-routing-contract-v1.test.mjs`: 27 owners, 27 indexed cards, zero broken links, zero duplicate owners; now also asserts 27 matching five-game reference rows and nonempty task triggers/interfaces.
- Independent routing-index parity check: 27 canonical owner rows and 27 corresponding reference-index rows.
- The complete current Node test suite was rerun serially after the routing-test change: 58 passed, 0 failed. One Windows-restricted CLI subprocess assertion was skipped by its test. No runtime code changed in this documentation pass; CI was not rerun.
- No runtime APIs, gameplay, art files, save data, network protocol, merge, or deployment changed in this pass.

## Next implementation rule

Before implementing any of these planned modules, inspect the active code and state owner again, define the event/command contract with adjacent modules, and add a focused regression for both the lead module and affected neighbor. In particular, do not start Quest work by adding a second MIRE MART expedition phase machine, and do not put mob HP settlement into Combat. Keep the full HOME → POI → encounter/salvage → return → persistent-growth loop and real 1280×720 / 390×844 art review marked UNKNOWN until actually exercised.

Current successor map: [`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md).  
Current project state: [`../PROJECT_STATE.md`](../PROJECT_STATE.md).

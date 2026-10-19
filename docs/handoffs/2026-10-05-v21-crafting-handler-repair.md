# V21 Crafting Handler Repair — 2026-10-05

## Ownership and scope

- **Lead:** Crafting & Processing — existing Bone Knife, Lantern, and field-meal actions.
- **Partners:** Items & Inventory for atomic local inventory/save mutation; Survival & Needs for meal effects; Integration & QA for V21 loader wiring and regression.
- **Interfaces:** `ABYSSAL_CRAFTING_PROCESSING_V1.craft(id)` routes verified recipe intent; `ABYSSAL_INVENTORY_TRANSACTIONS_V1.commitCraftMutation({costs, unlocks})` validates, mutates and locally saves; `ABYSSAL_SURVIVAL_NEEDS_V1.eatFieldMeal()` owns hunger/health effects; current V12 interaction target confirms the workbench context.
- **Files changed by this repair:** `modules/crafting/crafting-processing-v1.js`, `modules/items/inventory-transactions-v1.js`, `modules/survival/needs-consumption-v1.js`, `survival-v21.html`, `tests/crafting-processing-v1.test.mjs`.
- **Boundaries:** No recipe costs/effects, save schema, Relay protocol, gameplay authority, old mirrored aggregate, or assets changed. Transaction rejects invalid/insufficient inputs; a failed save restores changed inventory and meal stats. Duplicate equipment is rejected before material checks.

## Evidence and verification

- **CONFIRMED bug:** V21 dynamically loads `survival-v7.html` as its UI template but does not load legacy aggregate `game-play.js`; the visible `[data-craft]` buttons had no active handler. Reproduction was a VM click against the shipped handler graph: no crafting service existed before this change.
- **VERIFIED repair:** V21 now loads Inventory transactions after runtime state, Survival meal consumption after status, and Crafting after the interaction/workbench modules. The UI handler checks for a live workbench target and reports failures without false success.
- **Regression:** `node tests/crafting-processing-v1.test.mjs`; `node tests/module-sort.test.mjs`; all 61 `tests/*.test.mjs` files run serially — pass. `node tests/successor-live-candidate-v1.test.mjs` — pass. `node cloudflare/test.mjs` — pass. `git diff --check` and syntax checks — pass.
- **Release candidate:** local builder prepared `.cloudflare-site-78550aa27d8a` with 59 files. The new Inventory, Survival and Crafting modules are included and their hashes match the manifest; tests/docs/QA harness are excluded. This is local packaging only; no public deployment occurred.
- **Module ownership risk:** Inventory transaction API is deliberately narrow and currently used for these three recipes; migration of all other legacy inventory writers remains a separate task. Multi-client authority and reconnect/duplicate network behavior are outside this fix.
- **UNKNOWN / NOT ACCEPTED:** Actual browser play through the workbench, 1280×720 and 390×844 crafting UI readability, touch acceptance, and public Cloudflare hosting. Node coverage is not visual or player acceptance.

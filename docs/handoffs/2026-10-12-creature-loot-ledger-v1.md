# Handoff: creature loot claims

## Current state

- **VERIFIED (source and focused VM checks):** ordinary crawler/cultist/watcher grants now come from `data/loot/creature-rewards-v1.json`; `modules/loot/creature-rewards-v1.js` owns selection and repeat-claim rejection; `modules/items/inventory-transactions-v1.js` remains the only inventory writer. The V21 loader fetches the data and installs Loot after `inbound-events.js`, before `player-combat.js`.
- **VERIFIED:** the claim reuses the existing `loot` Relay event and `mobRewardKey` field. No Relay message type or save version changed. A V5 owner extension stores the most recently claimed defeat time per mob identity. Duplicate deliveries and older claims are rejected; a later respawn can award again. A failed inventory save restores both the inventory and claim record.
- **VERIFIED:** `tests/loot-creature-rewards-v1.test.mjs`, `tests/combat-loot-settlement-v1.test.mjs`, `tests/boss-progression-v1.test.mjs`, `tests/save-extensions-v1.test.mjs`, and `tests/awakening-world-logic-hardening-v1.test.mjs` pass. `npm run build:site` prepared 98 files (0.64 MiB) at `.cloudflare-site-72d11a03d43e`; the new config and module are in the package.
- **VERIFIED (local guarded browser):** the V21 preview booted with the new loader. In FIGHT QA, ordinary Space attacks reduced a crawler from 58 to 47 and then 36 HP; this was not a loot acceptance test. The four-creature pressure point killed the unequipped player before a defeat, and the player was returned to camp afterward.
- **NOT PASS:** the full player loop still lacks a browser-confirmed kill, loot receipt, and return-home completion. The fight observation used the QA locator and no crafted knife; do not treat it as the natural expedition route.

## Verification limits and current blockers

- Relay is blocked and local preview storage is an in-memory shim. Real multiplayer delivery, concurrent claims, real disk reload, public deployment and production release are unverified. The ledger does not make the client Relay an anti-cheat authority.
- `node tests/module-sort.test.mjs` stops before loader assertions because the existing worktree copies `modules/safe-camp/game-v7-patch.js` and `game-v7-patch.js` differ. Neither file was changed in this slice. The new Loot test separately checks the relevant loader order.
- Worktree remains mixed and dirty. Preserve unrelated changes. No commit, push, deploy or cleanup was performed.

## Next step

Continue the player-facing graybox loop: repeat ordinary resource gathering and bone-knife crafting, isolate one survivable creature encounter, verify the configured reward in the inventory, then travel back to HOME. Keep QA teleport results separate from natural-route acceptance.

## 2026-10-15 update

- The active Safe Camp override previously ignored its own “two ambient pursuers” comment and spawned three mixed creatures. It now seeds two separated 48-HP crawlers in the camp region; outer-region density and tougher creature types remain intact.
- Focused tests passed: starter encounter, first-knife preparation, combat loot settlement, and Boss progression. The isolated V21 preview reports two camp-region mobs and a 48-HP crawler.
- The ordinary knife-kill → reward receipt → HOME return loop remains **NOT PASS**. Local preview still blocks Relay and substitutes in-memory saves.

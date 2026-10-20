# Handoff: expedition credit after kiting

## Current work

- Implemented on `fix/expedition-kite-kill-proof`, based on `main` at `0453ae9`; merged by PR #19 as `ff7dfcd`.
- `POI & Exploration` owns the expedition kill proof. `UI & Map` presents its next target; combat, loot, V5 save and Relay contracts remain unchanged.
- `recordConfirmedMobLoot()` now accepts only the local player's valid, configured reward for an authored `poi:store:crawler-*` while the player remains in MIRE MART Zone `1:0`. It no longer rejects the kill just because the player kited beyond the store/parking footprint.
- The 3/4 route marker points to the nearest living authored crawler until a confirmed kill, then points to nearby MIRE MART shards.
- Updated the MIRE MART expedition contract and included `successor-route-guidance-v1.test.mjs` in the terrain workflow.
- Also synchronized the first-expedition integration assertion with the current post-return Lantern objective.
- The first CI run exposed an old route fixture that lacked confirmed-kill state; it was corrected and the rerun passed both `cloudflare-check` and `terrain-v21-check`.

## Verified

- `node tests/awakening-expedition-loop-v1.test.mjs`
- `node tests/successor-route-guidance-v1.test.mjs`
- `node tests/first-expedition-domain-integration-v1.test.mjs` — defeats the second crawler from just outside the parking bounds and still advances on its confirmed reward.
- `node tests/first-expedition-keyboard-input-v1.test.mjs` — full keyboard/motion simulation through resource gathering, crafting, MIRE MART, Lantern, Boss and zone unlock.
- `node tests/successor-natural-route-v1.test.mjs`
- Farming/livestock/fishing/cooking/survival V5 chain, livestock breeding, companion combat/incubation and Boss progression focused tests also passed before this route-only change.
- `node --check` passed on all changed JavaScript files; `npm run build:site` prepared 102 public files.
- GitHub Actions for PR #19: `cloudflare-check` and `terrain-v21-check` passed, including the deployed Relay health and live two-client multiplayer checks.

## Limits

- The browser's saved site permission denied observation of `http://127.0.0.1:8883`; do not use another surface or endpoint to work around it. Full ordinary browser play remains `UNKNOWN / NOT PASS`.
- Keyboard tests are V21 motion simulation, not manual browser play.
- Cloudflare was not deployed or changed in this work. Existing live Relay smoke does not prove the full client loop.
- Merged into `main` through [PR #19](https://github.com/shaolei528/shaolei/pull/19), squash commit `ff7dfcd14f7538613e5221448aec31ec71cba4c2`.

## Next

Complete the single player route in an approved ordinary game page: gather, craft, fight, claim loot, return; then validate Lantern/Boss progression and reload separately. Only after those pass, continue the shared-world/co-op acceptance and broader five-game gameplay checks.

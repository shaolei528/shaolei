# Handoff — Loot & Rewards module contract V2

Date: 2026-10-05 (Asia/Rangoon)
Status: documentation-only; no reward runtime, inventory, Relay, save, tests or assets changed.

## Verified source observations

- Branch/HEAD rechecked as `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`; shared worktree remains mixed/dirty. Do not assign concurrent source edits to this task.
- `player-combat.js` `rewardKill()` currently chooses shard/food deltas and routes locally or through the `loot` broadcast. `inbound-events.js` `onLoot()` filters to the local target, clamps counts, directly changes inventory, then saves and updates UI.
- Existing `awakening-world-logic-hardening-v1.test.mjs` asserts the one-time single kill path awards once. A source/test search did not find an `onLoot()` duplicate-message/idempotency fixture.
- The source handler visibly lacks a claim key and duplicate check. This confirms missing receiver-side validation in the inspected code, but **does not prove actual Relay redelivery or successful message forgery**; network policy and live two-client behavior were not tested.
- No standalone Loot & Rewards runtime owner was found in the inspected paths; source currently mixes reward selection, dispatch and inventory settlement.

## Change

- Added `content-inbox/2026-10-05-loot-rewards-module-card-v2.md`, preserving V1 and updating both module-map routes to V2.
- V2 maps all five references; separates event eligibility, reward selection/claim, Inventory settlement, transport/save and presentation; labels the missing idempotency/source checks precisely; distinguishes source evidence from runtime exploit claims; and adds concrete high-detail pixel, desktop/mobile, duplicate-claim and adjacent regression requirements.
- No new reward table, item, claim protocol, save key, art asset or implementation was created. Existing daily content candidate is unchanged.

## Validation and limits

- Reviewed the current source snippets, V1 contract, canonical map, five-game reference index and relevant combat fixture coverage.
- Run canonical module-routing, targeted reward/kill regressions and card-link/reference checks before future integration; validate live Relay permissions and two-client behavior separately.
- Test/source review does not prove actual player reward UX, unique shared claim under reconnect, client/server authority, mobile display or production art. Those remain **UNKNOWN / NOT ACCEPTED**.

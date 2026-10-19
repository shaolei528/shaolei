# Mob cooldown leader-handoff audit — 2026-10-04

## Finding

**CONFIRMED by current source path; live Relay reproduction UNKNOWN.** A leader applies contact damage and sets a mob's `hitCd` to 0.9s (crawler) or 1.15s (other mobs). Both regular `mobs` snapshots and the full `world` snapshot omit that cooldown. `onMobs()` reconstructs received mobs with `hitCd:0`. When presence elects a new local leader, it keeps that received list and starts simulating immediately. A player still in contact range and line of sight can therefore be hit before the previous leader's cooldown expires.

Existing `tests/awakening-world-logic-hardening-v1.test.mjs` covers local-owner cooldown and collision/LOS, but not received snapshot restoration or leader transition.

## Proposed repair boundary — approval required

Lead: Network & Co-op / Combat & Creatures joint contract review.

Candidate: add optional `mobId` and remaining `hitCooldown` fields to the existing `mob_hit` payload. Every client restores the identified mob's cooldown; only the intended target runs the existing HP/sanity damage path. The current event name and send frequency can stay unchanged. The receiver should tolerate older payloads without the optional fields.

This changes a shared message payload contract even though the extension is additive and old clients may ignore the fields. Do not implement until the user approves the protocol-compatible extension and the owners of the dirty networking/simulation files are clear.

## Files and checks if approved

- State source: `modules/combat/mob-combat.js`.
- Message emission/receiver: `modules/combat/mob-combat.js`, `modules/network/inbound-events.js`.
- Focused regression: new `tests/mob-hitcooldown-leader-handoff.test.mjs`, covering hit -> handoff -> next tick; crawler and non-crawler cooldowns; older payload compatibility; one hit per cooldown.
- Neighbor checks: `tests/awakening-world-logic-hardening-v1.test.mjs`, relevant Relay/session-zone tests, then guarded two-client Relay QA.
- Preserve save schema, event name, simulation authority and backend. Physical/live two-client behavior remains UNKNOWN until tested.

Current dirty edits in `modules/main-loop/simulation-update.js`, `modules/network/session-zone.js`, and `modules/network/network-relay-v16.js` have UNKNOWN ownership. This audit changed documentation only; no code or tests were modified or run.

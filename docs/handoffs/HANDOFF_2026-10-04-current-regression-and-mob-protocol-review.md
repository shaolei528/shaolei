# Current regression and mob payload review — 2026-10-04

## Verified current state

- Branch `fix/awakening-production-gate-qa-findings-v1`, HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`; the worktree remains broadly dirty with UNKNOWN-provenance changes.
- Ran all 46 `tests/*.test.mjs` files serially with Node: 46 passed, 0 failed. `awakening-assets-validator.test.mjs` reported its CLI child-process assertion skipped because subprocess creation is blocked on this Windows host; CI exercises that CLI path. A passing fixture suite is not player-visible acceptance.
- Focused checks also passed for `mob-cooldown-authority-handoff-v1`, `awakening-world-logic-hardening-v1`, `network-disconnect-simulation-pause`, and `cloudflare/test.mjs`; syntax checks for the combat/inbound/world and Worker files passed; scoped `git diff --check` passed.
- Source review confirms the current working copy carries cooldown values through `mob_hit`, periodic `mobs`, and full `world` state. The Worker `canonicalBroadcastPayload()` leaves `mob_hit` payloads unchanged; the local Worker fixture checks forwarding of the extra fields to another subscriber. These are local source/stub checks only.

## Contract and approval status

- The change appears to address the confirmed source path where a newly elected mob authority may lose an in-progress cooldown.
- It adds optional `mobId`, `hitCd`, and `hitCdUntil` data to existing shared payload shapes. Existing event names and old payload behavior remain covered by a fixture, but message-shape compatibility testing is not user approval.
- The Network & Co-op module card says to preserve all existing payloads absent a separately selected protocol task. The project state previously treated general bug-fix authorization as approval for this extension; that reading was too broad. The extension is therefore recorded as **UNAPPROVED FOR INTEGRATION / PROMOTION pending explicit user choice**. Its runtime, test, and Worker-test edits pre-existed this review and have UNKNOWN ownership. Nothing was changed, reverted, committed, merged or deployed here.

## Acceptance limits

- **UNKNOWN:** actual two-client authority handoff, live Relay delivery, real network latency/clock behavior, and whether the cooldown feels right in play.
- Other UNKNOWNs remain: complete HOME → POI → combat/salvage → return → HOME growth in a browser, target-size desktop/mobile visuals, and actual co-op acceptance.

## Ownership and next action

- Lead: Network & Co-op / Combat & Creatures joint contract review.
- Coordinates: Integration & QA for handoff and Worker forwarding regressions; Core State & Save for HP ownership and persistence boundaries.
- User decision needed before promoting the payload extension: approve the additive fields under the existing events, or require an alternative that leaves shared payloads unchanged. Keep the current dirty tree preserved while this is unresolved. Browser/two-client acceptance remains separate.

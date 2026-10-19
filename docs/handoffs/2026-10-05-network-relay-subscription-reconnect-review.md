# Network & Co-op subscription/reconnect review — 2026-10-05

## Scope and owners

- **Lead:** Network & Co-op (Relay Client and Relay Worker contracts).
- **Partner:** Integration & QA (regression and acceptance evidence); UI & Map consumes connection/reconnect status.
- **Interfaces:** Relay `hello_ack` and `subscribed` messages under the existing `abyssal-relay-v1` WebSocket contract; `RelayChannel.ready`; `globalConnected` and `zoneConnected` simulation gates.
- **Files read:** `modules/network/network-relay-v16.js`, `modules/network/session-zone.js`, `cloudflare/src/index.js`, `survival-v21.html`, and the focused Relay/session tests listed below.
- **Boundary:** read-only review. No event names, payloads, frequency, saves, authoritative gameplay state, or Relay behavior changed. `modules/network/network-relay-v16.js`, `modules/network/session-zone.js`, and the root compatibility copy were already dirty before this review; their provenance remains unknown and they were not edited.

## Source findings

- V21 loads the split `modules/network/network-relay-v16.js` path.
- The Worker replies `subscribed` for each valid `subscribe` request. The client tracks pending channel generations and only opens a channel after the matching acknowledgement.
- Missing hello or subscription acknowledgements are bounded by an 8-second timeout. Subscription timeout closes/removes the pending channel, clears connection gates, and schedules a retry.
- A zone join remains pending until the acknowledgement or timeout. This is an expected wait, not proof of an indefinite hang.
- No confirmed client-side stuck-promise defect was found in this recheck.

## Verification

All checks below passed locally:

- `tests/network-relay-v16-subscribe-ack-hang.test.mjs`
- `tests/network-relay-v16-subscribe-ack-timeout.test.mjs`
- `tests/network-relay-v16-reconnect.test.mjs`
- `tests/network-relay-v16-offline-online-reconnect.test.mjs`
- `tests/session-zone-network-entry.test.mjs`
- `tests/network-quality-v20.test.mjs`
- `tests/network-disconnect-simulation-pause.test.mjs`
- `cloudflare/test.mjs`
- `tests/module-sort.test.mjs`
- `node --check` on the active Relay and session-zone modules

These fixtures cover fake WebSocket handshakes, acknowledgement timeout/late-ack rejection, channel-generation changes, automatic recovery, offline simulation/save pause, Worker protocol behavior, and source/load-order invariants. They do not prove public service uptime, real packet-loss behavior, or sustained two-client gameplay.

## Limits and risks

- **UNKNOWN:** public Relay subscription behavior under real network delay/loss and sustained two-client use. This review did not connect to the public Worker.
- **UNKNOWN:** whether an 8-second pending period feels acceptable on the player screen; runtime waiting feedback was not visually reviewed here.
- A prior same-day two-client preview reported presence working with high latency/loss. That result remains separate evidence and is not replaced by these local fixtures.
- The root Relay compatibility copy and active split module have unknown-provenance dirty edits. `module-sort.test.mjs` passed the repository's current split/reconstruction checks; no changes were made to either copy.

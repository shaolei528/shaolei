# Network recovery regression review - 2026-10-05

## Repository and ownership

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Worktree is broadly dirty. Changes under Network & Co-op and several new tests have UNKNOWN provenance; they were preserved and not attributed to this review.
- **Lead:** Network & Co-op. **Collaborator:** Integration & QA.
- **Boundary:** inspect the existing `abyssal-relay-v1` reconnect and Zone-ready boundary. Transport recovery does not grant authoritative game state or persistent save behavior.

## Current source evidence

- `survival-v21.html` loads `modules/network/network-relay-v16.js`, then `modules/network/network-quality-v20.js`, then `modules/main-loop/smooth-motion-v18.js`.
- Root `network-relay-v16.js` and V21 module `modules/network/network-relay-v16.js` currently have matching SHA-256 hashes.
- Current Relay module retains `abyssal-relay-v1`. It waits for channel `subscribed` acknowledgements; channel joins arm an 8-second timeout; a successful retry resubscribes Global and Zone channels. The simulation update returns while `zoneConnected` is false.

## Verified checks

All were run serially from the repository root and passed:

- `node tests/network-relay-v16-reconnect.test.mjs` — pre-ack and established disconnect recovery, Global/Zone resubscription, no duplicate channels.
- `node tests/network-relay-v16-offline-online-reconnect.test.mjs` — established and startup sessions recover after browser offline/online signals.
- `node tests/network-relay-v16-subscribe-ack-hang.test.mjs` — reproduces the pending Zone join when `subscribed` is absent, then confirms a delayed acknowledgement resolves it.
- `node tests/network-relay-v16-subscribe-ack-timeout.test.mjs` — bounded Zone/Global settlement, late/stale acknowledgement rejection, current-generation retry, rapid zone switch, protocol unchanged.
- `node tests/network-disconnect-simulation-pause.test.mjs` — simulation, survival, sends and saves pause while disconnected and resume after subscription returns.
- `node tests/network-quality-v20.test.mjs` — quality thresholds, movement rate, protocol payload and active V21 module order.

No runtime or test source was edited in this review. No new confirmed defect was found in this bounded fixture pass.

## Limits / next evidence

- Fake WebSockets do not verify the public Relay service, browser/OS event ordering, two-client behavior, mobile network changes or sustained play under latency.
- Keep protocol, save format and backend authority boundaries unchanged. Continue only with a targeted live/reproduction QA when a real Relay session and second client are available; do not turn this review into a protocol rewrite.

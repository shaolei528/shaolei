# Relay timeout and recovery QA revalidation — 2026-10-04

## Evidence checked

- **VERIFIED repository:** `fix/awakening-production-gate-qa-findings-v1` at `54d294abc13dd19ee53b56563fe43aaecc81b9ba`. The shared worktree remains dirty; the Relay implementation and tests below are existing working-copy edits with UNKNOWN provenance.
- **VERIFIED source path:** active V21 boot loads `modules/network/session-zone.js` before `modules/network/network-relay-v16.js`; simulation checks `zoneConnected`. Session entry awaits the Zone channel and only shows the welcome toast when the join succeeds.
- **VERIFIED local checks, run serially:**
  - `node tests/network-relay-v16-subscribe-ack-hang.test.mjs`
  - `node tests/network-relay-v16-subscribe-ack-timeout.test.mjs`
  - `node tests/network-relay-v16-offline-online-reconnect.test.mjs`
  - `node tests/network-disconnect-simulation-pause.test.mjs`
  - `node --check modules/network/network-relay-v16.js`
  - scoped `git diff --check`

  All passed. The timeout fixture covers absent Global/Zone ACK, delayed/late ACK, retry with a fresh socket, rapid zone switches, same-key channel generations and unchanged protocol. Offline recovery and simulation/save pause/resume are covered only through deterministic stubs.
- **Finding status:** earlier project notes about a potentially pending subscription describe the pre-timeout source review. The current working copy has bounded timeout/cleanup and current deterministic regressions pass. Implementation/test provenance is UNKNOWN; this review did not edit them.
- **UNKNOWN:** public Relay behavior, browser/OS offline toggling, two-client recovery, and physical mobile networking. No live Relay session was opened; no protocol, persistence, server, or user save was changed.

## Module ownership

- Lead: Network & Co-op (`modules/network/network-relay-v16.js`).
- Coordinates: UI & Input (`modules/network/session-zone.js` reconnect/welcome messaging), Core State & Save (`modules/main-loop/simulation-update.js` disconnection pause boundary), Integration & QA (stub and live acceptance).
- Scope checked: active boot order and the named test fixtures. Existing dirty code and tests preserved; no runtime or test edits in this revalidation.

## Next acceptance step

When the guarded browser and Relay are available, confirm entry/reconnect messaging and run an actual two-client disconnect/reconnect check. Keep co-op acceptance **UNKNOWN** until that evidence exists.

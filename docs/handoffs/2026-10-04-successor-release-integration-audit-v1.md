# 3/4 Successor Release Integration Audit

Date: 2026-10-04 (Asia/Rangoon)

## Goal and ownership

- **Lead:** Rendering & Camera. **Partners:** Network & Co-op, Core State & Save, UI & Map, Input & Accessibility, Integration & QA.
- **Current checked files:** `survival-v21.html`, `survival-config.js`, `modules/network/network-relay-v16.js`, `modules/core/runtime-state.js`, `prototypes/successor-3-4/preview.js`, `prototypes/successor-3-4/successor-renderer.js`, `cloudflare/src/index.js`, and `wrangler.jsonc`.
- **Allowed change boundary for the next implementation slice:** successor boot/renderer bridge and focused fixtures only. Keep world simulation, combat authority, local-save format, Relay event names/payloads, server architecture and art candidates unchanged. Keep V21 available until the replacement passes its gates.

## Verified current state

- The successor proof page boots V21 through an iframe. It replaces iframe storage with a memory map and replaces WebSocket with a throwing stub.
- The successor renderer replaces `zoneCh` and `switchZone` with local preview behavior, marks the session connected locally, and disables the V21 Relay adapter. It also starts the scene itself. This is a deliberate preview guard, not a production connection.
- V21's normal entry owns session start. Its Relay adapter then connects to `RELAY_URL`; `runtime-state.js` stores the V5 player snapshot in browser `localStorage`. The Cloudflare Worker relays live presence and broadcasts. Its Durable Object uses WebSocket attachment state; no app save/load operation or durable world snapshot was found in the inspected Worker.
- `tests/successor-preview-live-gate-v1.test.mjs` passes. `cloudflare/test.mjs` passes. `node --check prototypes/successor-3-4/preview.js` and `tests/successor-natural-route-v1.test.mjs` pass.
- The `tests/successor-camera-adapter-v1.test.mjs` whole-file run fails at its continuous-input QA sequence expectation (`HOLD NW`), which is absent in the checked renderer. The test's preceding `AW_DEV_QA=false` assertion passes before that later failure. Do not count the whole test as passing.
- The live `GET /health` request could not complete because the local network connection closed during receive; the web fetch tool also could not access the URL. **Relay availability is UNKNOWN**, not a confirmed server outage.
- `wrangler.jsonc` configures only the Relay Worker and Durable Object, not static game assets. Wrangler and `node_modules` are absent in this checkout. The default `index.html` still points to V17. The production art gate remains blocked by the missing `assets/awakening-v1/manifest.json`.

## Acceptance and risk

Do not publish the guarded page as the game or change the default player route yet. First create a separate production boot path that installs the 3/4 renderer before the V21 motion loop captures its draw callback, leaves the normal entry/Relay/local V5 save path intact, and never replaces the real zone channel. Keep the local preview's memory/WebSocket guards and local QA hidden. Then verify one-client entry, save unchanged-or-expected V5 behavior, natural HOME-to-POI movement/collision, and a real two-client Relay session. Review 1280x720 and 390x844 captures; visual quality is currently REVISE/UNKNOWN.

No root route, storage contract, protocol, old file, or Cloudflare deployment was changed in this audit.

# 3/4 candidate local-save route audit - 2026-10-05

## Scope and ownership

- **Lead:** Core State & Save. **Partner:** Integration & QA; Rendering & Camera provides the candidate entry only.
- **Interface reviewed:** existing V21 `saveLocal()` / `loadLocal()` adapter and the existing `abyssal_wake_save_v5` / fallback `abyssal_wake_save_v4` browser-local keys.
- **Files reviewed:** `modules/core/runtime-state.js`, `prototypes/successor-3-4/live-candidate.js`, `prototypes/successor-3-4/live-candidate.html`, V21 entry, and focused save/entry/HOME tests. No game or save code was changed.
- **Boundary:** the candidate supplies a view inside the V21 runtime; it does not define a new save schema or become a save owner. This review does not authorize clearing either the legacy V17 source or any player data.

## Findings

- **VERIFIED source:** V21 writes the v5 player snapshot and reads valid v5 first; if unavailable, it reads v4 and migrates supported fields. The loader does not delete the v4 key. `saveLocal()` reports storage write success/failure.
- **VERIFIED candidate source:** the candidate fetches the existing V21 entry, injects its renderer, and assigns that document to an unsandboxed iframe `srcdoc` with a base URL pointing at the V21 entry. It disables preview mode and installs no memory-only storage shim. It retains the existing V21 loader, save, and Relay owners.
- **VERIFIED fixtures:** `player-save-v5-migration`, `v21-loader-retry-idempotency-v1`, `successor-live-candidate-v1`, and `awakening-home-workbench-upgrade-v1` pass on rerun. The save fixture's storage is an isolated in-memory map; it proves the tested migration logic, not a real player's browser storage.
- **Transient check:** one initial HOME upgrade test run failed at the final upgrade assertion. Without modifying repository files, the same test was rerun with diagnostic output and then rerun unchanged; both passed. No persistent regression was reproduced, so this is not classified as a confirmed bug.
- **UNKNOWN:** an actual browser reload through the public/Cloudflare route and restoration of an existing user's save were not exercised here. The same-origin iframe storage behavior is inferred from the candidate source and web platform rules, not proven by a live gameplay session in this audit.

## Release meaning

The inspected candidate keeps the current V21 local save path and does not itself migrate or clear a save. Source and isolated fixture checks are positive. Public deployment, real browser save continuity, mobile/desktop visuals, and production-art acceptance remain separate gates; this audit does not mark them accepted.

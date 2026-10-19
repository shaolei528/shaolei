# 3/4 release route and QA panel audit — 2026-10-05

## What the screenshot buttons do

The HOME, MIRE MART QA, LOOT QA, FIGHT QA, MOVE, nearest-resource, and workbench controls are developer testing shortcuts. They can move the local test player to a chosen spot or feed movement input so QA can inspect the scene. They are not game progression or player features.

The current live 3/4 entry explicitly sets `AW_DEV_QA=false`, and the guarded preview does the same. I opened the current local candidate menu and entered its guarded preview. In the active guarded gameplay accessibility tree, none of the QA shortcut buttons were present. The supplied screenshot therefore came from a QA-enabled capture. Keep those controls out of the player route; retain them only for deliberate QA sessions.

## Current 3/4 runtime boundary

- **Lead:** Integration & QA for release routing. **Partners:** Rendering & Camera for the selected view; Network & Co-op and Core State & Save keep their existing owners.
- **Interface:** packaged `/` → `prototypes/successor-3-4/live-candidate.html` → `live-candidate.js` fetches `survival-v21.html`, boots its module runtime, then replaces the final renderer with the 3/4 camera adapter and successor renderer.
- **Files reviewed:** `wrangler.jsonc`, active package manifest and contents, `cloudflare/build-site.mjs`, the live candidate entry/boot, and successor renderer. No game behavior or saved state was changed.
- The candidate is a 3/4 presentation over current V21 movement, combat, inventory, save and Relay systems. It is not an independent runtime. V17 entry pages are not in the public allowlist, but local legacy/shared files remain. Removing shared V21 code now would break the selected candidate; no source files were deleted.

## Evidence and gates

- **VERIFIED:** Wrangler's configured `.cloudflare-site-66543ace9bad` contains 56 files. Every file matches its package manifest hash and the current packaging source calculation. Its root page redirects to the 3/4 candidate.
- **PASS:** `node tests/successor-live-candidate-v1.test.mjs`, `node tests/successor-camera-adapter-v1.test.mjs`, and `node cloudflare/test.mjs`.
- **NOT DEPLOYED:** Wrangler executable and Cloudflare login are unavailable in this environment.
- **BLOCKED production art:** `assets/awakening-v1/manifest.json` is absent. Existing terrain/actors remain under **REVISE** visual review. Physical phone, sustained public co-op, browser save restoration, and full HOME → POI → return/growth play are not accepted.

## Next safe step

Continue the successor scene/art and complete-loop acceptance while retaining the current V21 game-state owners. Keep V17-only source outside the public package. Before any local deletion, map each proposed file against the current V21 module load and compatibility paths so rollback and shared runtime files are preserved.

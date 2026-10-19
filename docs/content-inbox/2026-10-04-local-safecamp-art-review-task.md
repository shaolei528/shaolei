# Draft engineering task — local SafeCamp art review page

**Status:** DRAFT / NOT IMPLEMENTED. This proposal is for an isolated developer preview only. It does not approve or promote any art candidate.  
**Lead module:** Rendering & Art  
**Coordinates with:** World & Terrain (map/tile contracts), Core State & Save (no persistent writes), Network & Co-op (no Relay), UI & Input (viewport presentation), Integration & QA (screen captures and guard checks).

## Why this is the next useful step

The normal V21 entry has no verified offline gameplay path. `modules/network/session-zone.js::enter()` starts `connectGlobal()` and awaits `switchZone(currentZone)`; the simulation waits for `zoneConnected`. The static terrain page can compare ground tiles but omits the player, camp props, HUD and actual camera framing. Entering the public Relay is outside this review boundary.

## Proposed bounded preview

Create a separate page under `prototypes/` that reuses the real V21 drawing modules needed for a fixed SafeCamp frame:

- Reuse the active `base-renderer.js`, `terrain-v21.js`, SafeCamp art placement, and the current render wrappers only after their dependencies are confirmed.
- Load the real player, monster, resource and prop sheets plus the opt-in SafeCamp terrain candidate. Keep the source atlas and displayed canvas at native contracts; do not resample art.
- Use a deterministic, fixed sample state centered on SafeCamp. Do not add movement, interaction, combat, collision authority or save behavior.
- Do not load the Relay/session modules or call `connectGlobal`, `switchZone`, or `WebSocket`. Add a fail-closed WebSocket guard so accidental network construction is visible and blocked.
- Replace persistent localStorage with an in-memory shim in the preview page before loading project modules; verify existing player/settings storage remains byte-for-byte unchanged after opening and closing the preview.
- Mark the page **DEV ART PREVIEW — NOT PRODUCTION** and show the active source atlas and fallback/load state.

This page validates asset composition in the active renderer's screen projection. It does **not** implement or approve a 3/4 camera migration; the current V21 renderer remains axis-aligned.

## Current renderer dependency recheck - 2026-10-04

- **VERIFIED source:** V21 loads `base-renderer.js`, then `terrain-v21.js`, then `render-v9.js`. Terrain wraps the base ground draw, and the V9 wrapper replaces the draw loop to add the existing landmarks, shadows, camp glow, particles, lighting, and threat vignette.
- **VERIFIED dependency:** `render-v9.js` requires `window.ABYSSAL_CONTENT_V9` and `window.ABYSSAL_GAMEPLAY_V9`. Loading the real gameplay/content modules also installs intervals, reads `localStorage`, adds a preparation button, and overrides `sendMove`; so the page must not load the full V21 boot list just to paint a static art frame.
- **Preview constraint:** build a fixed-state harness around the real rendering functions and terrain wrapper. Supply read-only fixture objects for the V9 render API, load only the image sheets needed for the frame, and omit session, simulation, save, input, and network modules. Keep an in-memory storage shim and a fail-closed WebSocket guard as defense in depth. Do not expose controls that call `sendMove`.
- **UNKNOWN until implementation:** whether every required renderer global can be supplied by the isolated harness without copying production draw logic. If not, stop and report the exact dependency; do not add production boot modules or weaken their guards to make the preview run.

## Acceptance evidence

1. Browser console shows no uncaught errors; the page visibly identifies preview mode and lists loaded/missing sheets.
2. Network log shows no WebSocket request and browser-side WebSocket construction is blocked by the guard.
3. Local storage values before/after are identical; no gameplay, collision, Relay or save modules are changed by the task.
4. Capture desktop at 1280x720 and mobile at 390x844 with the same deterministic state.
5. Compare default and candidate SafeCamp terrain with the real player and camp props present. Review native 1x clarity, nearest-neighbor scaling, path/lawn balance, actor scale, occlusion and HUD safe areas.
6. Label every art family KEEP / REVISE / UNKNOWN; a green load check alone is not art acceptance.

## Stop conditions

If the exact active render dependencies cannot be isolated without loading a persistent-save or network path, stop and report the dependency. Do not remove or mock project authority in production code to make the preview work. Keep this prototype separate from `survival-v21.html`, production manifests and candidate source assets.

## Selection

To select the bounded preview-tool task, say **Implement isolated SafeCamp art preview**. That selection authorizes only a new developer preview page and its focused mechanical/browser checks; production renderer, assets, gameplay, save and Relay remain outside scope.

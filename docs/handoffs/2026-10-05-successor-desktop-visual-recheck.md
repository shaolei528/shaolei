# 3/4 successor desktop visual recheck - 2026-10-05

## Owner and scope

- **Lead:** Rendering & Camera. **Partners:** Asset Pipeline (pixel density and source/display fit), Integration & QA (acceptance evidence).
- **Interface:** renderer consumes existing V21 state snapshots and maps its projection to the canvas. This check did not change the V21 owner, input, collision, save, or Relay contracts.
- **Files reviewed:** `prototypes/successor-3-4/index.html`, `preview.js`, `preview.css`, `successor-renderer.js`, `camera-adapter.js`, and the existing local assets reported by the preview.
- **Boundary:** local guarded preview only; its wrapper blocks Relay and redirects save writes to an in-memory shim. It is not the public candidate or production entry.

## Fresh observation

- **VERIFIED desktop capture:** opened the current local guarded preview in the Codex in-app browser. The browser viewport was 1280×720; the game scene reported 1100×618. The page loaded the player, terrain, props, resources, monsters and Camp Guide. The scene showed a broad repeated grass texture, visibly repeated coastline edge, small low-detail actors, sparse props, and HUD/status groups occupying noticeable screen space. The Guide now appears in the camp scene. A screenshot was captured and inspected in-session, but was not saved as a repository image.
- **Visual status: REVISE.** The intended 3/4 direction works in this preview, but the current scene still does not meet the user's Modern High-Detail Pixel Art target. These are visual-quality findings, not confirmed gameplay bugs.
- **VERIFIED source scaling:** the renderer disables canvas image smoothing and caps backing-store DPR at 2. The shared player frame is 24×32 and is drawn at 28×38 CSS pixels, so the source scaling is nearest-neighbor but not an integer multiple. The camera adapter requests a 2× display zoom below 480 CSS pixels wide.
- **UNKNOWN:** a real 390×844 gameplay capture, physical-phone view, public candidate/runtime, combat/full-loop image clarity, and authored production-art acceptance. The responsive code path is not a substitute for the missing phone-size capture.

## Verification and next action

- The local preview HTML responded HTTP 200 and reported all reviewed art sheets loaded. `LOCAL PREVIEW · RELAY BLOCKED` and `memory save shim` were visibly active; no production save or real multiplayer room was used.
- Next visual stage should be owned by Rendering & Camera with Asset Pipeline supplying approved source dimensions/anchors; Integration & QA should recheck the resulting scene at 1280×720 and 390×844. Keep edits limited to an explicitly selected art/render stage and do not promote the preview assets to production while the visual gate remains REVISE.

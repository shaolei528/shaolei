# Successor module routing handoff — 2026-10-04

## Objective and decisions

- Build ABYSSAL WAKE as an original co-op survival sandbox that combines player-experience lessons from Crashlands, Terraria, Minecraft, Don't Starve and Stardew Valley around HOME → POI → exploration/combat/salvage → return/growth.
- The user chose the 3/4 oblique direction and accepts its gameplay direction. High-quality, clear Modern High-Detail Pixel Art remains a hard acceptance gate; current 3/4 previews are not production-quality proof.
- A successor should take over the real game loop. Keep V21 as the compatibility/reference build until visual, gameplay, save/network and regression acceptance pass. Retire old files only after per-file reference/dependency review; preserve unknown dirty/untracked work.
- Split the art owner (visual standard and art candidates) from engineering (successor modules, integration and bug regression). Do not edit the same files or claim work without repository evidence.

## Current verified repository snapshot

- Checkout: `C:\Users\MECH\Documents\ChatGPT\游戏编程\abyssal-wake-integration`
- Branch / HEAD: `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Worktree: dirty, with many modified and untracked files of unknown/shared provenance. Do not reset, clean, overwrite, delete, or claim them as authored without a live diff.
- `MODULE_MAP.md` lists the V21 loaded modules. `prototypes/successor-3-4/preview.js` loads V21 into a guarded iframe with memory-only saves and blocked WebSocket, then injects `camera-adapter.js` and `successor-renderer.js`.
- The successor preview reuses V21 world/player/terrain/POI/mob state and collision behavior for local review. `successor-renderer.js` remains a large combined proof script with development shortcuts. This is not a production successor, independent module architecture, real co-op, or accepted final art.

## Documents updated

- `docs/SUCCESSOR_MODULE_MAP.md`: module crosswalk showing V21 source baseline, successor proof state/gaps, proposed ownership and interfaces.
- `docs/content-inbox/2026-10-04-modular-gameplay-development-blueprint-v1.md`: successor-first stage order and single-module task template.
- `docs/GAMEPLAY_VISION_AND_REFERENCE_ANALYSIS_V1.md`: removes the outdated requirement to re-decide the chosen camera direction after a prototype.
- `docs/PROJECT_CHARTER.md` and `docs/PROJECT_STATE.md`: cross-reference the successor map and record the user decision.

## Verification

- All 16 detailed module-card links and 40 explicit source-file references in the successor map resolve.
- Local Markdown links in the updated planning/state docs resolve.
- `node --check prototypes/successor-3-4/camera-adapter.js` and `node --check prototypes/successor-3-4/successor-renderer.js` pass.
- `git diff --check` passes, with existing line-ending warnings in unrelated dirty files.
- No runtime, art, save, protocol, production manifest, or test code was changed for this documentation handoff. No commit, push, merge or deployment occurred.

## Next safe engineering step

Use `SUCCESSOR_MODULE_MAP.md` to split only the successor proof renderer's responsibilities into reviewable modules after the camera/art contracts are aligned. Preserve V21 gameplay owners and coordinates; add interfaces only where the first real HOME → POI → combat/salvage → return loop needs them. Keep the art owner on isolated assets, validate desktop and mobile runtime views, and run the affected module plus neighboring regressions. Do not delete V21 as a cleanup shortcut.

## Unknown / not accepted

- Final art quality and visual consistency at desktop/mobile sizes.
- A production successor entry, complete route, save compatibility, live Relay/two-client behavior, real touch, and final occlusion/input feel.
- Which current dirty changes belong to each parallel contributor unless verified by live diff/thread evidence.

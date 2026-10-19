# 3/4 QA 面板隐藏与 Cloudflare 发布状态 — 2026-10-05

## Result

Disabled visible developer QA shortcuts in the isolated 3/4 preview, including when opened with the former `?awDevQa=1` query. The stand-alone QA harness source and its automated behavior tests remain available; the public candidate entry was already configured with QA false and was not changed. No files were deleted, no player state or save behavior changed, and no deployment was attempted.

## Ownership and interface

- **Lead:** Rendering & Camera.
- **Partner:** Integration & QA.
- **Interface:** preview presentation flag `AW_DEV_QA`; the preview now fixes it false and does not inject the QA panel script.
- **Files:** `prototypes/successor-3-4/preview.js`, `tests/successor-preview-live-gate-v1.test.mjs`, `docs/PROJECT_STATE.md`, and this handoff.
- **Boundary:** QA panel presentation only. Test harness source remains intact; no gameplay authority, save format, Relay protocol, art manifest, merge, or deployment change.

## Verification

- PASS: `node tests/successor-preview-live-gate-v1.test.mjs`.
- PASS: `node tests/successor-qa-harness-v1.test.mjs`.
- PASS: `node tests/successor-live-candidate-v1.test.mjs`.
- PASS: `git diff --check` (only pre-existing line-ending warnings elsewhere in the worktree).
- PASS: opened the guarded local preview with `?awDevQa=1`; the loaded in-game accessibility tree showed ordinary HUD/menu controls and no developer shortcuts. Status remained Relay blocked and memory-only saves.
- CONFIRMED preview-shell bug/fix: the developer status header used to float over the game's top HUD, especially when its text wrapped on a narrow view. `prototypes/successor-3-4/preview.css` now lays the status strip above the game iframe. Browser screenshots at 390×844 (arena reported as 390×713) and 1280×720 (arena 1100×589) show the top HUD unobstructed.
- **REVISE remains:** both views still show repetitive grass, coarse shoreline tiles and small actors/props; the phone HUD and controls still compete for scene space. The preview-shell layout fix does not change candidate art or count as visual acceptance.
- The supplied screenshot's extra nearest-resource/workbench/hold-duration labels still have no matching source in the active project files; exact origin remains UNKNOWN.

## Expedition objective localization follow-up

- **CONFIRMED player-facing defect:** the SafeCamp objective panel mixed English phase labels (`PREPARE`, `LEAVE HOME`, `SEARCH / FIGHT`, `RETURN HOME`) into otherwise Chinese instructions.
- **Narrow fix:** `modules/world/awakening-expedition-loop-v1.js` now presents the phase headings and guidance in Chinese while retaining the existing English enum values for internal state. The recipe, required salvage, state transitions, combat, persistence and Relay contracts are unchanged.
- **Lead / partner:** World POI & Exploration; Localization / UI. Interface: existing `objectiveText()` display string consumed by the quest panel. Files: `modules/world/awakening-expedition-loop-v1.js`, `tests/awakening-expedition-loop-v1.test.mjs`, and project state.
- **PASS:** `awakening-expedition-loop-v1`, `safe-return-localization`, `expedition-ward-hud-feedback`, and `camp-guide-talk-sync`; guarded 390×844 browser now visibly reports `出发准备` with Chinese instructions. Real-phone touch remains UNKNOWN.

## Narrow desktop viewport layout follow-up

- **Evidence correction:** the 390×844 browser was a Windows desktop with an explicit narrow viewport; `abyssal-desktop-v19` remained active. This does not count as a physical-phone or touch-mode capture. Real mobile rendering remains **UNKNOWN**.
- **CONFIRMED layout bug/fix:** desktop HUD minimum tracks (56px + 250px + 220px) overflowed a narrow 390px window and clipped network metrics. `modules/input/platform-inventory-v19.js` and its root compatibility mirror now use shrinking desktop tracks below 680px and allow child grids to shrink. Touch mode, game state and input rules remain unchanged.
- **Lead / partner:** Input & Accessibility; Rendering & Camera / Integration & QA. Interface: existing `abyssal-desktop-v19` presentation class. Files: `modules/input/platform-inventory-v19.js`, `platform-inventory-v19.js`, `tests/platform-inventory-v19.test.mjs`, and handoff state.
- **PASS:** platform inventory, input retry/idempotency, successor touch-pad visibility and module-mirror tests; browser columns at 390px measured 46px / 171px / 145px with network metrics inside the viewport. Console had no warning/error entries.

## Cloudflare and visual gates

- The configured package directory exists and its 3/4 candidate entry sets `AW_DEV_QA=false`; it does not include `qa-harness.js`.
- **Deployment unavailable:** Wrangler is not on PATH or locally installed, no Wrangler login config was found, and no Cloudflare-related environment variables or `.dev.vars` file were present. No account-side state or public deployment was verified.
- The 3/4 scene remains **REVISE** for repeating ground detail, coarse shoreline tiles, and small player/prop scale. Do not describe the game as production-ready based on automated tests or the local package.

## Next action

Improve and review the 3/4 scene against the existing pixel-scale/camera contract. Revisit public deployment only after the artifact is visually acceptable and Cloudflare tooling/authentication is available; retain the current Relay and save boundaries.

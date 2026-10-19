# Successor responsive HUD presentation fix — 2026-10-06

## Scope and ownership

- **Lead:** Rendering & Camera. **Partners:** UI & Map, Input & Accessibility, Integration & QA.
- **Interface:** `pixelZoomForViewport(width)` selects the successor canvas display scale; the narrow information button toggles only the presentation class `successor-info-open` and accessible `aria-expanded` state for the existing task and nearby-survivor panels.
- **Files:** `prototypes/successor-3-4/camera-adapter.js`, `prototypes/successor-3-4/successor-renderer.js`, `tests/successor-camera-adapter-v1.test.mjs`, and `tests/successor-responsive-hud-v1.test.mjs`. The guarded site builder generated a new content-addressed package and updated the Wrangler static asset directory. The previous package directory was preserved.
- **Boundary:** no movement intent, inventory, task, combat, save, Relay protocol, production art, or legacy page behavior was changed. No deletion, merge, or deployment occurred.

## Change

- Narrow viewports now retain integer 1× canvas display scale instead of magnifying the entire world 2×. This exposes more terrain in the same view and avoids coarse enlargement; it also makes actors smaller in CSS pixels, so final phone readability is not accepted by this change alone.
- At widths up to 480 CSS px, task and nearby-survivor panels start collapsed behind a `任务 / 队友` button. Opening the button reveals the same live panels; the control reports expanded state to assistive technology. Desktop panel layout is unchanged.

## Verification

- **PASS:** `node --check prototypes/successor-3-4/successor-renderer.js`.
- **PASS:** successor camera, touch-mode visibility, live candidate isolation, preview/live guard, QA-harness isolation, Cloudflare root redirect, Relay protocol, and responsive HUD disclosure tests, all run serially on 2026-10-06.
- **VERIFIED guarded desktop preview:** after the edit, the local preview loaded the 1100×589 game canvas and all required atlases; desktop layout remained unchanged. It is a local dev preview with Relay blocked and memory-only persistence.
- **VERIFIED package integrity:** `.cloudflare-site-1d6adff07846` contains 59 manifest-listed files, 0 hash mismatches, 0 untransformed source drift, and no QA harness. Root routing remains the 3/4 candidate.
- **UNKNOWN:** this session could not capture a current 390×844 browser viewport, so narrow visual spacing and expanded-card overlap have only focused source/VM contract coverage. Physical-phone pixel density, touch, motion readability, and actor legibility remain unverified.
- **REVISE:** repeated ground/path patterns and production-art quality remain outside this bounded layout/camera fix. A passing test or valid package does not mean the game is ready to publish.

## Repository state

- Branch `fix/awakening-production-gate-qa-findings-v1`; HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba` at review start. The worktree contains many pre-existing modified and untracked files of unknown ownership; none were reset or removed.
- Local package preparation is not deployment. No Cloudflare upload or remote change was made.

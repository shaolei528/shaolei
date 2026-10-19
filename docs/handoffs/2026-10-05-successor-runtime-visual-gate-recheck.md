# 3/4 successor runtime visual gate recheck — 2026-10-05

## Ownership and boundary

- **Lead:** Rendering & Camera. **Partners:** Asset Pipeline (source art/sampling contract), Integration & QA (runtime capture), UI & Input (mobile layout).
- **Interface:** guarded local preview → existing V21 runtime/state → 3/4 camera adapter and successor renderer. Preview blocks Relay and substitutes page-local memory storage; no QA mode was enabled.
- **Scope:** read-only desktop and mobile browser review. No source, art, save, Relay, package, or user settings were changed. The guarded preview was left available for handoff.

## Verified runtime evidence

- At desktop browser size **1280×720**, V21's canvas reported **1100×618**. Terrain (`320×256`), player (`96×128`), props (`192×96`), resource (`128×32`) and monster (`128×96`) images loaded; terrain returned HTTP 200. The capture showed a repeated grass/shore pattern, angular flat shore/water tiles, small actors and props, and dense HUD information.
- At mobile browser size **390×844**, the outer iframe fills the viewport; V21 reserves **102 px** for its in-game top HUD, so the arena canvas correctly reports **390×742**. Touch controls appeared. The separate developer status banner overlays the top HUD and wraps across the screen; this is a preview-only obstruction, not lost viewport height in the game. The scene itself still shows coarse/repeated environment and small HUD elements competing with scene content.
- **QA controls:** no QA shortcut controls appeared in the guarded preview accessibility tree. The normal 3/4 candidate also keeps `AW_DEV_QA=false`; the public-package audit confirms the QA harness file is excluded.
- **Safety/runtime:** preview status showed `LOCAL PREVIEW · RELAY BLOCKED`; one in-memory save occurred; `data-real-storage-unchanged=true`; no browser console warnings or errors were recorded. The normal player candidate's Enter action was not used.

## Gate decision

- **Visual status: REVISE.** Current terrain/shore repetition and actor/prop scale do not meet the selected Modern High-Detail Pixel Art target. The mobile preview header/HUD arrangement also needs review before player acceptance.
- **UNKNOWN / NOT ACCEPTED:** physical-device touch behavior, public deployment, production asset manifest, real co-op, and the complete HOME → POI → return/growth loop. This browser review is one local guarded preview, not release acceptance.
- **Next owner action:** Rendering & Camera and Asset Pipeline should compare the current displayed sheets against native source dimensions, intended pixel density and anchor contracts, then evaluate revised art in the actual 3/4 runtime at both target sizes. Preserve existing art until a candidate passes.

## Evidence correction and narrow desktop HUD follow-up

- The earlier **390×844** capture was made in a Windows desktop browser with a narrow viewport, not on a phone. The platform detector kept `abyssal-desktop-v19` active; some action buttons were forced visible by successor preview CSS, but the virtual joystick was hidden by the desktop rule. Physical phone input and rendering remain **UNKNOWN**.
- The narrow desktop capture did confirm a 390px HUD overflow: the desktop grid tracks measured 56px + 250px + 220px, clipping right-side network metrics. Under 680px, the desktop HUD now uses shrinking columns; touch-device rules were not changed.
- **PASS:** platform inventory, input retry/idempotency, successor touch-pad visibility and module-mirror checks. The refreshed 390px desktop-mode preview measured 46px + 171px + 145px columns, with metrics inside the viewport; no console warnings/errors.


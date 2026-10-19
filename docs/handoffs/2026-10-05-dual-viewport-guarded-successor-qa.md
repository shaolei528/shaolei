# Dual-viewport guarded successor QA — 2026-10-05

## Scope and ownership

- **Lead:** Integration & QA. **Partners:** Rendering & Camera, Input & Accessibility, Asset Pipeline.
- **Interface:** guarded successor outer browser viewport → embedded V21-backed game arena → renderer diagnostics and visible SafeCamp UI.
- **Files changed:** this handoff and `docs/PROJECT_STATE.md` only. No runtime, art, manifest, save, Relay, package, merge or deployment changes.
- **Build under review:** local `prototypes/successor-3-4/index.html?review=1` on `127.0.0.1:8765`. The page identifies itself as `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`; the inner game reports `LOCAL PREVIEW · RELAY BLOCKED` and the memory-only save shim.

## VERIFIED — same guarded page, two browser viewports

| Browser viewport | Successor game arena from live renderer diagnostic | Observation |
|---|---:|---|
| 1280×720 | 1100×589 CSS px | Desktop screenshot shows repeating fine-dot ground, small actors/props and broad empty ground. **REVISE** for the intended high-detail, coherent presentation. |
| 390×844 | 390×713 CSS px | Narrow screenshot shows task and survivor panels competing with the scene, a compact top HUD, large/stacked touch actions and a crowded bottom area. **REVISE** for readability and control layout. |

- Both captures came from the same open local preview build. The 390×844 viewport was browser responsive-size emulation, not a physical phone or real-touch test. The temporary viewport override was reset afterward; the page returned to its default 1100×589 arena.
- Both view diagnostics reported terrain 320×256 (HTTP 200), player 96×128, props 192×96, resources 128×32 and monsters 128×96. This confirms files loaded, not that their game-scale detail is accepted.
- Current-source mappings are 64×64 logical terrain cells drawn as 64×32 CSS diamonds, 24×32 player source frames drawn at 28×38 CSS px, and a request for 2× camera zoom below a 480 CSS-pixel arena width. These are implementation facts, not accepted production dimensions.
- **VERIFIED canvas backing:** the desktop canvas element is 1881×1008 backing pixels for its 1100×589 CSS arena (about 1.71 backing px/CSS px). In 390×844 responsive emulation it is 390×713 for the 390×713 CSS arena (1:1 backing ratio). Renderer source requests `displayScale=1` on desktop and `2` below 480 CSS px, so its effective canvas transform is about 1.71× on desktop and 2× in this DPR-1 narrow emulation. The mobile result does not establish a physical phone's DPR.
- **Source-to-destination mapping from the active draw calls:** terrain source 64×64 → 64×32 CSS at desktop / 128×64 at narrow zoom; player 24×32 → 28×38 CSS / 56×76; mob 32×32 → 38×38 CSS / 76×76; resource 32×32 → 28×28 CSS / 56×56; prop 48×48 → 48×`objectScale` CSS / 96×`objectScale` at narrow zoom. These are configured destinations; no acceptance of perceived detail is implied. Backing scaling puts the desktop actor close to 2× source-pixel blocks, while the DPR-1 narrow emulation uses uneven ~2.33×/2.375× actor scaling with nearest-neighbor sampling; its visual effect requires review on real hardware.
- **Inferred, not measured from a world-bounds overlay:** using the current projection inverse and rectangular arena, the visible world AABB half-extent around camera center is about ±1139 world units (~17.8 logical 64-unit cells) per axis on desktop and ±454 (~7.1 cells) on the narrow emulation. This is a projection-derived estimate; exact culling, map coverage and physical-device framing remain unverified.
- The preview hunger meter ticked down during passive observation. No game control was activated; Relay was blocked and storage was memory-only, so this was a transient local preview change, not evidence of a persistent save write.

## REVISE / UNKNOWN — acceptance boundary

- The paired captures resolve the former lack of same-build CSS viewport and arena measurements. They do **not** freeze a reusable production-art family or pass visual acceptance.
- Physical-phone DPR/rendering/touch, exact safe-area overlap, combat clarity and production entry behavior remain **UNKNOWN**. Canvas backing values and source/destination mappings above apply only to this guarded browser preview; world AABB is only a geometry-derived estimate.
- Next: record DPR/backing dimensions and world coverage on this protected build; then revise the HUD/touch layout and one isolated art candidate. Recheck both target views. Do not promote or deploy until owner and visual gates accept the result.
- Browser screenshots and accessibility snapshots are the evidence for this pass; no screenshot file was written into the repository.

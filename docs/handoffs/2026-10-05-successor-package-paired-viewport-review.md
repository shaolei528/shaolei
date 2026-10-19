# Paired viewport review of synchronized 3/4 sources — 2026-10-05

## Ownership and scope

- **Lead:** Integration & QA.
- **Partners:** Rendering & Camera; Input & Accessibility.
- **Interface checked:** current Cloudflare package `.cloudflare-site-289496248407` selects the 3/4 candidate; guarded preview loads the same 3/4 renderer and V21 gameplay modules, but substitutes memory-only save and blocks Relay.
- **Scope:** current local browser screenshots, CSS/canvas measurements, preview accessibility text and console warnings/errors. No gameplay input after preview start; no runtime, art, manifest, protocol, save, deployment or cleanup changes.

## Evidence

- Guarded URL: `http://127.0.0.1:8765/prototypes/successor-3-4/index.html?review=1`; browser screenshots captured at 1280×720 and 390×844 viewport override. The temporary viewport override was reset and the temporary tab closed.
- **1280×720 desktop-browser capture:** inner page 1280×691; scene arena 1100×589.2 CSS px; canvas backing 1881×1008; reported DPR 1.71. Ground and path show repeated/coarse clusters; actors and props occupy little scene area. Verdict: **REVISE**.
- **390×844 narrow viewport capture:** inner page 390×815; scene arena/canvas 390×713.2 CSS px; backing 390×713; reported DPR 1.00. Task panel 150×65.9 px, survivor panel 130×36.3 px, action-control region 123×123 px; joystick remained hidden. Text and controls consume a large share of the visible scene, and art enlarges into coarse blocks. Verdict: **REVISE**.
- The normal guarded player scene showed no developer QA shortcut panel. The page identified itself as `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`, with `LOCAL PREVIEW · RELAY BLOCKED` and memory-only save shim. Passive simulation reduced hunger from 98 to 94; no move, attack, harvest, inventory or save action was performed, and no persistent write was evidenced.
- Browser console warning/error query returned no entries. This is only console evidence, not proof of bug-free runtime.

## Native terrain candidate tiling check — 2026-10-06

- **Lead:** Rendering & Camera. **Partner:** Asset Pipeline. **Review-only interface:** native 64×32 diamond terrain cells → repeated diamond placement. No runtime draw path, world cell size, collision, or manifest changed.
- Rechecked `successor-renderer.js`: each 64×64 V21 atlas cell is clipped and drawn into a 64×32 CSS diamond; production grass B and flower IDs both resolve to grass A with flips. The candidate `safecamp-successor-proof-v1` instead supplies 64×32 source cells and three variants for grass, road, sand, water, and shore, so its nominal cell dimensions match the successor's projected diamond bounds.
- Built a disposable, untracked temporary contact sheet under the OS temp directory, repeating each candidate source in a staggered diamond grid. It shows pronounced repeating diagonal bands on road, regularly repeated sand flecks, repeated sawtooth shore edges, and sparse grass clusters. Candidate README separately labels the full composition **DRAFT / REVISE** and says gameplay camera/viewport acceptance has not been performed.
- **Verdict: candidate remains REVISE / NOT PRODUCTION.** Matching the 64×32 cell size does not establish density, seam, lighting, runtime, or viewport acceptance. Need material-specific cluster variation, less periodic shore transitions, and a denser but restrained grass vocabulary; then inspect the selected materials in the actual current renderer at desktop and narrow viewports.
- The guarded preview service was not listening at this check, and the browser had no project tab; no service was restarted. Production `assets/awakening-v1/manifest.json` is still absent, so there is no approved production asset selection path. No repository art/code/runtime files were changed by this review.

## Fresh guarded desktop screenshot — 2026-10-06

- **Lead:** Integration & QA. **Partners:** Rendering & Camera; Asset Pipeline. Rechecked the current guarded 3/4 preview at the ordinary in-app desktop viewport. Opened only after confirming localhost port 8765 was free; served the current checkout read-only, then closed the tab and stopped the temporary server.
- **VERIFIED route/runtime boundary:** the preview reached the CAMP screen, reported 1100×589 CSS arena, terrain/player/props/resources/monster assets loaded (terrain HTTP 200), `LOCAL PREVIEW · RELAY BLOCKED`, and `memory save shim`. No game action was performed.
- **Visible verdict: REVISE.** Repeated diagonal ground pattern and rough sawtooth coast remain obvious; trail texture reads as a stamped brick band; actors and small camp props are visually small against the broad open map; HUD and interaction text compete with the play space. This is a current desktop preview screenshot only; physical phone, public candidate, actual persistent save and real co-op remain **UNKNOWN**.
- No gameplay or asset file was changed. A scene screenshot is available from the current session transcript; this handoff records its qualitative result rather than claiming a stored repository capture.

## Fresh guarded 390×844 narrow screenshot — 2026-10-06

- **Lead:** Integration & QA. **Partners:** Rendering & Camera; UI & Map; Input & Accessibility. Reused the same guarded local V21-backed 3/4 preview at a 390×844 browser viewport override; no touch emulation, movement, combat, or harvesting input.
- **VERIFIED preview state:** arena reports 390×713 CSS px; terrain HTTP 200 and all reported sheets load. Page remains `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`, `LOCAL PREVIEW · RELAY BLOCKED`, memory-save shim.
- **Visual verdict: REVISE.** Camera crop gives a close, partial view of the camp; the task and survivor panels overlay a substantial area; the right-side action stack, bottom controls, inventory and interaction prompt crowd the lower half. Ground/path motifs become visibly coarse at this narrow scale. This browser-size emulation is not a physical-phone, touch, UA or device-DPR acceptance run.
- After capture, reset the viewport override, closed the temporary browser tab, stopped the loopback server and confirmed port 8765 was no longer listening. No repository game files changed.

## Narrow viewport replication and bounded repair boundary — 2026-10-06

- Repeated the same 390×844 responsive-browser capture from the current worktree. Preview again reported arena 390×713, loaded sheets, blocked Relay and memory-only saves. No player controls were used; viewport reset and temporary loopback server stopped.
- **CONFIRMED source cause for coarse zoom:** `camera-adapter.js` returns `pixelZoomForViewport(width)=2` for every width below 480 CSS px. Renderer applies this scale to the complete world canvas around its center, so the visible world extent is halved in both axes; terrain and sprites are enlarged together. In the same screenshot, the 150px task panel, 130px survivor panel and 123px action region are on top of the narrow arena; inventory, chat/map, prompt and bottom touch pad occupy additional space.
- Narrow scope for a future selected implementation task: **Input & Accessibility** owns touch hit targets/placement; **UI & Map** owns task/survivor/HUD placement and density; **Rendering & Camera** owns camera zoom and crop; **Integration & QA** coordinates. Candidate files are `prototypes/successor-3-4/camera-adapter.js`, `prototypes/successor-3-4/successor-renderer.js` (only its presentation CSS), and focused preview tests. Preserve gameplay coordinates, movement intent mapping, save, Relay, V21 and production manifests.
- Validation should compare the same guarded HOME frame at desktop and 390×844, measure visible world bounds and HUD/control overlap, and run camera projection, touch-pad visibility, module-routing and no-stretch regressions. Physical-device and touch feel stay UNKNOWN until tested on a phone.
- Repository continuity instructions still classify default work as read-only review/design; this recheck therefore records the proven cause and interface boundary without altering game runtime code.

## Temporary narrow zoom A/B preview — 2026-10-06

- Served the guarded preview from the current checkout with one in-memory response-only override: for widths below 480 CSS px, `pixelZoomForViewport` returned 1.25 instead of 2. The checked-in file remained unchanged; the override was visible only to this local preview session.
- At 390×844 (390×713 arena), the wider view showed more of camp and coastline while actors stayed recognizable at the screenshot scale. **This is a useful camera direction, not an accepted final value.** Grass/path tiling stayed repetitive, and task/survivor panels plus right/bottom controls still cover play space; camera zoom alone is insufficient.
- Preview confirmed memory-only save and blocked Relay. No controls were used. Browser override reset, tab closed, temporary server stopped and port checked free. This experiment provides visual direction only; it does not alter the prior REVISE verdict or count as a production/runtime fix.

## Integer 1× narrow camera comparison — 2026-10-06

- Repeated the same guarded 390×844 browser preview with a response-only local override selecting integer `pixelZoomForViewport=1` below 480 CSS px. No workspace file changed; the preview remained memory-only and Relay-blocked; no gameplay controls were used.
- Compared with 2×, 1× showed a substantially wider HOME area and coastline. Ground/path source pixels were visibly smaller and less blocky; actors also shrank but remained identifiable in this static screenshot. Compared with 1.25×, this follows the camera tests' integer-scale invariant and is a stronger crisp-pixel candidate.
- **Still REVISE / not accepted:** HUD and touch controls retain the same screen-space overlap; repeated source patterns remain; this was a static desktop-browser emulation without touch and not a device-DPR test. No scale option can be called final from this evidence alone.
- Viewport override reset, tab closed, local server stopped and port checked free. No game code or tests changed.

## DPR and camera-test boundary — 2026-10-06

- `successor-renderer.js` sets `dpr=min(devicePixelRatio,2)`, then applies `dpr*displayScale` to world drawing. Thus below 480px the current 2× camera uses up to 4 backing pixels per CSS pixel on a device with DPR≥2; the temporary 1× camera would use up to 2. **This is source-derived**, not measured on a physical phone.
- The 390×844 browser override used DPR 1, so it cannot validate phone DPR or native touch. `successor-camera-adapter-v1.test.mjs` explicitly asserts 2× at 390px and integer zooms; adopting 1× requires revising that selected camera expectation as part of a separately selected implementation and running camera/no-stretch/touch/routing regressions.
- Therefore 1× remains a useful candidate, but physical-device scale, touch readability and pixel density remain **UNKNOWN**. No source, tests or art were edited.

## Actor source-to-screen size audit — 2026-10-06

- **Rendering & Camera** owns the measurement; Asset Pipeline is partner for source density. Player frames are 24×32 source pixels drawn to 28×38 CSS pixels (about 1.17× each axis) with smoothing disabled; mobs 32×32→38×38 (~1.19×); resources 32×32→28×28 (0.875×); props use 48×48 atlas cells and placement scale. The global narrow zoom then multiplies these CSS destinations by 2.
- At the 390×713 arena and emulated DPR 1, player destination is 56×76 displayed CSS px under current zoom; under the temporary 1× comparison it is 28×38. Actor readibility remained adequate in the static 1× screenshot but dynamic combat/device acceptance is unknown. Repeating ground detail is separate from sprite size.
- **Source-level risk, not confirmed defect:** per-axis fractional sprite scaling plus DPR/camera multiplication can give uneven pixel-cluster widths; `imageSmoothingEnabled=false` preserves hard sampling but cannot guarantee the source detail reads well. Do not resize source sheets as a shortcut. Any chosen adjustment should compare actor art at the intended native CSS size and physical DPR, with foot anchor and combat FX reviewed.
- No runtime or art change. The 1× candidate still conflicts with the current adapter test's asserted 2× choice and needs a separately selected implementation to update that contract.

## Acceptance boundary and next work

- These are browser viewport captures; 390×844 is not a physical phone or touch-input acceptance run. Mobile/UA/DPR and sustained gameplay remain **UNKNOWN**.
- The preview wrappers differ from the public candidate; only the selected camera/renderer and shared runtime source was cross-checked against the synchronized package. This is not production acceptance.
- Keep the visual result **REVISE**. Rendering & Camera should revise the authored scene/readability and agree the sampling/density contract with Asset Pipeline; Input & Accessibility should inspect narrow touch controls after real touch-mode evidence is available. Integration & QA should recapture the same current build at both sizes. Do not promote or deploy based on these captures.

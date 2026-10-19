# Successor natural-route live recheck — 2026-10-04

## Current browser state

- **VERIFIED:** the existing Edge tab was refreshed to the current guarded preview source after its visible QA buttons were found to lag the disk version. The active runtime now displays `HOME → POI LOOT · QA` and the warning `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`.
- **VERIFIED guard:** outer preview reports `Relay blocked`, `MEMORY SAVE SHIM`, one memory-only write and `realStorageUnchanged=true`. Console warning/error list is empty. The local URL returned HTTP 200. The preview was left in HOME with automatic input stopped.
- **VERIFIED display sample:** Edge viewport 1490x810, DPR 1.71; embedded game canvas 1100x709. The actual screenshot shows the 3/4 scene but also visibly repeating grass/shore tiles and small actors, props and HUD text. This is one current desktop preview view with legacy sheets, not production or candidate-art acceptance. The separate 1280x720 / 390x844 capture report remains in `2026-10-04-successor-runtime-visual-review.md`; this recheck did not independently inspect mobile.

## Input attempt and limits

- A one-shot ArrowRight through the browser locator did not produce an observable coordinate change. The tool sends a brief key press and does not provide a documented key-hold/drag action; classify this result **UNKNOWN**, not a confirmed movement bug.
- The non-teleport `HOME → POI LOOT · QA` projected-input sequence was started to check its real movement/collision path, then stopped. While active, the player advanced north from the HOME start only to about `(2400,2306)`, remained in CAMP, and showed `COLLISION CLEAR`. Life, hunger and sanity stayed at 100; wood and stone stayed at 0, food at 2, shard at 0. The route did not reach the POI, harvest, craft, fight or return. Do not count this as natural-input or full-loop acceptance.
- The preview exposed very low observed update-tick progress during the wait despite `document.visibilityState='visible'`. That may be automation/background throughput; it is insufficient to diagnose game performance. No sustained key/joystick input or normal-performance measurement was achieved.

## Code, data and owner boundaries

- Lead: Integration & QA. Coordinates: UI & Input (ordinary movement), Home & Building / Interaction & Crafting (resource/use/workbench), World & Terrain / Combat & Creatures (route/POI), Network & Co-op (Relay gate), Rendering & Art (screen-size quality).
- No game source, tests, candidates, manifests, save data, network protocol, server process or shared preview files were edited. The only browser state changes were refreshing the guarded in-memory preview, respawning once after observing its death screen, starting/stopping the local QA input and a brief key press. Real local storage remained unchanged.

## Next evidence needed

1. Use a supported sustained ordinary joystick or key input action and confirm that movement reaches a nearby resource.
2. Gather naturally, craft the Bone Knife at the workbench, travel to MIRE MART, fight/search, return and verify HOME growth; keep each stage observed.
3. Capture candidate-specific rendered scenes at 1280x720 and 390x844; keep art status REVISE until actual in-game readability passes.
4. Verify two-client/network behavior separately. The currently observed preview blocks Relay and is not multiplayer acceptance.

The current 46-test serial sweep and its subprocess limitation are recorded in `PROJECT_STATE.md`. It does not replace browser play or mobile/device acceptance.

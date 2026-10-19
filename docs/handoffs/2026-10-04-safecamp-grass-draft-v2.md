
## SafeCamp grass draft V2 experiment - 2026-10-04

**Lead:** Rendering & Art. **Coordinates:** World & Terrain, Integration & QA.

Built a separate native-resolution SafeCamp terrain atlas and offline composition under `assets/awakening-v1/intake/whole-game-art-candidate-v2/`. Candidate V1, runtime files and existing dirty work were preserved. The generated atlas is 320x256 with the existing 20 64x64 cells; the map composition uses current V21 map/tile IDs but is not a runtime capture.

Visual result is **REVISE / NOT PRODUCTION**: denser leaf clusters make stronger material marks, but the marks repeat in visible rows across the fixed tile map. Offline rotation softens direction repetition yet retains the repeated rhythm. The image remains below the user's concept-reference detail density. This experiment does not change the default game's appearance.

Next useful engineering question: determine whether a larger art family or stable per-cell visual variation can break the repeated rhythm. Any renderer-side variation requires a separately selected implementation task and must preserve terrain IDs/collision. Candidate details and limits are in its `README.md`.

## Default-versus-candidate terrain browser comparison - 2026-10-04

The local Edge browser showed the static SafeCamp terrain page at 1280x720. The normal route (no query) showed the existing ground art: denser fine speckle and noticeable tile/road repetition. `?awTerrainArtPreview=1` showed the calmer V1 grass candidate with clearer clumps, but visible repeated bands remained. This is **REVISE / NOT PRODUCTION**, not a full game screenshot. Browser reported DPR about 1.71 and a 931x665 CSS canvas backed by 896x640; these measurements apply only to the terrain preview page. Mobile, characters, props, HUD and live gameplay remain unverified. The main game stayed at the entry screen; no Relay was entered.

No V21 game or production asset changed. Current worktree changes are preserved.

## V21 gameplay preview access check - 2026-10-04

Read the active `modules/network/session-zone.js::enter()` and `modules/main-loop/simulation-update.js::update()` paths. Entering the gameplay page starts global Relay connection and awaits the current zone subscription; simulation is gated on `zoneConnected`. The source has no confirmed offline gameplay entry. I left the browser at the main menu and did not enter the shared Relay room. The static terrain page is safe but cannot prove full player/prop/HUD composition. Actual full-screen PC/mobile art remains UNKNOWN. Recommended future implementation candidate: an isolated local-only renderer preview that uses active draw code while excluding Relay and save writes; this needs separate selection under the project boundary.

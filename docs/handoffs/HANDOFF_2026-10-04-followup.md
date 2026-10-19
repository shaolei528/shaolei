# ABYSSAL WAKE handoff follow-up 鈥?2026-10-04

## Repository snapshot

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Worktree: broad modified and untracked files remain. Provenance is UNKNOWN; preserve them. No runtime or test files were changed in this follow-up.

## Verified QA

- Sequentially passed local fixtures: ward HUD feedback, field ward duration and AI pursuit, expedition loop, HOME workbench upgrade, core smoke, V21 loader retry idempotency, Relay reconnect, missing subscribe acknowledgement, bounded subscribe-ack timeout, offline/online recovery, session entry, disconnect simulation pause, V5/V4 player save restore, and network quality.
- The newly present subscribe-ack timeout fixture verifies timeout settlement, stale/late acknowledgement rejection, fresh retry, and rapid zone-switch supersession. Its provenance remains UNKNOWN; it was run as found and not edited here.
- Syntax checks passed for Relay V16, simulation update, and session-zone modules.

## Limits and next step

- These are controlled local tests. Browser OS offline/online behavior, public Relay, two-client recovery, and player-visible HUD fit/comprehension remain UNKNOWN.
- Existing successor preview blocks WebSocket and redirects storage writes to memory, but starts local simulation, mob spawning, and UI updates. It is not a static HUD-only screenshot harness.
- A source reread of the active Expedition Loop and HOME Workbench services against their contracts found no new confirmed mismatch. Their existing local regressions cover route progression, death/return handling, salvage, and one-time upgrade cost.
- This turn's browser inventory found no open tabs and failed with `Unable to load browser request-header policy`; no new capture was obtained. The current project-state file separately records a parallel 390脳844/desktop successor-preview capture: HUD and controls crowded/small, ground repetitive/coarse, rated **REVISE / NOT PRODUCTION**. That visual evidence has UNKNOWN ownership and does not prove formal V21 production quality, physical-phone behavior, combat, or two-client play.
- The isolated SafeCamp art/HUD preview remains DRAFT / NOT IMPLEMENTED. Lead module: Integration & QA; coordinate with UI & Input, Network & Co-op, and Core State & Save. Next acceptance step is an isolated local scene capture at desktop and mobile viewports, after that implementation task is selected.

## Successor bridge and MIRE MART regression recheck

- `successor-camera-adapter-v1.test.mjs`, `terrain-v21.test.mjs`, and `awakening-world-v1.test.mjs` passed; preview, adapter, and renderer scripts passed `node --check`.
- The browser evidence in `2026-10-04-successor-renderer-engineering-contract.md` shows the V21 frame bridge and a local MIRE MART scene using actual V21 world/POI/HUD data, with Relay blocked and persistent storage unchanged. This remains a graybox developer preview.
- Visual status remains **REVISE** for repeated/coarse ground and simple props. Exact 1280脳720 and 390脳844 successor captures, physical touch, collision edges, complete combat/loot/return loop, and co-op remain **UNKNOWN**. No prototype changes were made in this recheck; provenance of existing shared preview files remains unknown.

## V21 entry and connection-status source review

- Static review confirms the menu labels the entry as a public real-time camp. Boot loads configured Relay and gameplay modules before the existing entry action runs.
- The welcome toast is gated on a successful Zone subscription; a failed join reports reconnection. No false-success message was confirmed in source.
- Real browser click/touch, public Relay entry, and player understanding remain **UNKNOWN**. Prior local session-entry fixtures exist in the project QA record and were not rerun in this review. No runtime/test changes were made.

## Relay entry and disconnect regression recheck

- Serially passed: `network-relay-v16-subscribe-ack-timeout`, `network-relay-v16-subscribe-ack-hang`, `network-relay-v16-reconnect`, `network-relay-v16-offline-online-reconnect`, `session-zone-network-entry`, and `network-disconnect-simulation-pause` fixtures. Syntax checks passed for Relay V16, session-zone, and simulation-update.
- Controlled fixtures confirm bounded settlement for missing Global/Zone acknowledgements, late-ack rejection, fresh retry, rapid zone-switch settlement, offline/online recovery behavior, and simulation pause/resume behind `zoneConnected`.
- Public Relay, OS-level browser events, two-client reconnect, and physical mobile behavior remain UNKNOWN. The known failure was reproduced in a fake Relay fixture, not a live session; no protocol/save/runtime files were changed.
- Lead module: Network & Co-op, coordinated with UI & Input, Core State & Save, and Integration & QA.

## Local browser entry acceptance attempt

- The existing local server answered HTTP 200 for the successor preview URL; no server process was started or stopped.
- Edge browser automation had no open tabs and rejected both inventory/local-tab attempts with `Unable to load browser request-header policy`. The browser barrier was not bypassed and no public Relay was entered.
- Rendered state, clicks/touch, screenshot layout, and embedded runtime console remain UNKNOWN. An HTTP 200 is not player-visible acceptance. No preview/runtime/test files changed.

## Successor terrain projection pixel-detail review

- Source confirms 320脳256 terrain atlas with 64脳64 cells. The successor renderer draws each cell into a 64脳32 diamond with image smoothing disabled.
- Halving the vertical pixel dimension is intentional for the 2:1 projection, but may discard source-row detail and contribute to the recorded coarse/repetitive appearance. This is a **SUSPECTED visual risk**, not a confirmed code defect.
- **VERIFIED source-sheet inspection:** reused the RGB PNG decoding/filter logic already in `tests/terrain-v21.test.mjs` to make a temporary BMP under the OS temp directory. At source resolution (320×256; each terrain tile 64×64), grass and sand show sparse scattered detail pixels, water sparse short highlights, and road dense brick clusters. This confirms uneven material texture density in the source sheet; it does not establish what players see after projection and canvas scaling.
- **UNKNOWN:** contribution of source detail, 2:1 projection, and canvas scaling to coarse/repetitive in-game appearance. No 1280×720 or 390×844 successor canvas capture was available in this pass. Current art remains **REVISE / NOT PRODUCTION** pending render comparison at both target sizes.
- **VERIFIED isolated candidate and offline scale review (ownership UNKNOWN):** the new `assets/art-candidates/safecamp-successor-proof-v1/` folder has individual native 64×32 transparent diamond tiles and an 832×544 static proof scene. The art bypasses vertical squeeze by authoring at 64×32, but does not match the active renderer contract (which samples semantic IDs from a 320×256 5×4 atlas of 64×64 cells); no runtime/preview manifest references this candidate. Nearest-neighbor contain-fit of its proof scene gives 832×544 at desktop 1× and 390×255 at 0.469× on a 390×844 viewport, making actors/props too small on mobile. The offline image has visibly repeated shoreline teeth and diamond-grid rhythm, plus simplified props; no transparent tile gaps were detected. Status **REVISE / NOT PRODUCTION**; no production screenshot, HUD, game loop, or runtime wiring was tested.
- Lead module: Rendering & Art; coordinate with World & Terrain, UI & Input and Integration & QA. No assets or code changed.
- Handoff gate for future selected work: add an isolated candidate README/status contract; define material IDs, draw footprint and variation; keep art lookup separate from collision/map authority; capture the actual successor renderer at 1280×720 and 390×844 to check pixel sharpness, player/prop readability, repetition and HUD/control fit. Until that proof exists, the proof scene remains an offline art study and **REVISE / NOT PRODUCTION**.
- **VERIFIED pixel follow-up:** the RGBA8 64×32 PNG alpha mask matches each intended diamond exactly (1,024 opaque pixels); transparent corners are correct art, not damage. The proof scene is fully opaque and its builder places tile centers every 32px horizontally / 16px vertically, with no exposed cell gaps in the composition. Shore tiles use selective sand/grass overlap, so document neighbor/material draw order before general use. The files still do not match the active 64×64 atlas sampler.
- **VERIFIED candidate handoff gap:** scoped folder review found no candidate README/status, map from candidate material names to active V21 tile IDs, manifest/preview reference, or installed repository browser screenshot runner. Builder uses three seeded samples per material but composes the study with deterministic `variant=(col*3+row*5)%3`; map-scale repetition acceptance remains UNKNOWN. Keep the candidate isolated and **REVISE / NOT PRODUCTION**.
- Lead module: Rendering & Art; coordinate with World & Terrain and Integration & QA. No code or image was changed.

## SafeCamp art candidate update detected during review

- The shared candidate changed since its earlier review (provenance UNKNOWN): the old 832×544 proof is archived under `reviews/revise-pass-1/`; current builder outputs use a 960×600 1× scene, a 1920×1200 nearest-neighbor inspection copy and a 40×96 pier candidate. Do not attribute those edits to this review.
- **VERIFIED:** two isolated temp builds produced 27/27 byte-identical outputs, and all 27 match the corresponding current candidate files. The builder succeeded without writing into the repository.
- **VERIFIED offline only:** 390×844 contain-fit scales the scene to 390×243 (0.40625×); the broader coast and pier are visible, but actors/props remain too small and shoreline teeth repeat regularly. The scene contains no HUD, so HUD/gameplay/camera fit remains UNKNOWN.
- Still **REVISE / NOT PRODUCTION**: material-to-V21 tile-ID map and candidate status README remain absent; there is no successor runtime or preview-manifest reference. No runtime, art, manifest or test changed in this review.
- Lead: Rendering & Art. Coordinates: World & Terrain (material map), UI & Input (mobile frame), Integration & QA (desktop/mobile game captures). Next useful gate: document the isolated candidate contract, then only after selection run a separate reversible integration/capture task.
## SafeCamp art candidate and contract recheck

- Shared candidate files changed during this review; provenance UNKNOWN. The new README now documents native 64×32/center anchor (32,16), three material variants, actor/prop anchors, dimensions, rebuild path and **DRAFT / REVISE / NOT PRODUCTION**. It says full renderer contract is not frozen and candidate-specific target screenshots are not done.
- **VERIFIED:** latest builder remained byte-stable over two temp-only runs; each produced 29 files, and the outputs matched exactly across runs and against the corresponding current candidate files. No repo asset was written by the audit.
- The native 64×32 source is consistent with the proposed successor art contract §14 and is deliberately separate from the V21 64×64 atlas contract. Prior notes saying “not directly compatible” apply only to the legacy V21 sampler; the needed successor adapter/frozen contract is still absent from runtime. No current manifest/renderer reference to these candidate files was found.
- Current 960×600 composition contain-fit to 390×844 becomes 390×243 (0.40625×); newest camp props and shore placements are present, but actors/props stay tiny and shore motif repetition remains visible. This is only an offline image fit.
- Art-contract §15 records prior guarded-preview screenshots at 1280×720 and 390×844 using legacy V21 art; those are not candidate captures and reported cramped HUD/recurring ground. The currently open Edge `SafeCamp input check` tab belongs to another CUA browser session; it was left untouched, so no live candidate render was captured here.
- Owner: Rendering & Art. Coordinates: World & Terrain, UI & Input, Integration & QA. Next gate: freeze renderer/source/anchor/cell contract and provide a reversible adapter; then capture candidate in the guarded successor at both target viewports. Keep candidate **REVISE / NOT PRODUCTION**.
# 3/4 live candidate and Relay check

Date: 2026-10-05 (Asia/Rangoon)

## Scope and ownership

- **Lead:** Rendering & Camera. **Partners:** Network & Co-op, Core State & Save, UI & Map / Input & Accessibility, Integration & QA.
- **Files changed in this slice:** `index.html`, `prototypes/successor-3-4/live-candidate.html`, `live-candidate.js`, `successor-renderer.js`, `preview.js`, `tests/successor-live-candidate-v1.test.mjs`, plus project state and this handoff.
- The candidate boot owns only display/camera activation. V21 remains the owner of its existing start screen, simulation, collision, Relay adapter, and V5 browser-local save. The candidate does not alter save shape, network messages, combat authority, old files, or Cloudflare deployment. The root entry was separately redirected to this candidate and verified locally.
- **Repository snapshot:** branch `fix/awakening-production-gate-qa-findings-v1`, HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`. The worktree is broadly dirty and the successor/test tree is untracked; preserve all unrelated files and treat other untracked edits as unknown provenance.

## Implementation and verified checks

- Added a separate **live candidate** page under the successor prototype. It loads V21, suppresses its old draw call before the motion module captures it, then installs the 3/4 camera and renderer before exposing the normal V21 entry button.
- The renderer now uses explicit `AW_SUCCESSOR_PREVIEW` branching. The guarded preview sets the flag to `true` and retains memory-only storage, blocked WebSocket, and local-only channel simulation. The live candidate sets it to `false`, so the renderer leaves the real Relay channel and `switchZone` in place. QA shortcuts remain hidden by `AW_DEV_QA=false`.
- A browser run first exposed a missing quote in the candidate's cache-busting URL rewrite; that caused a confirmed V21 script parse failure. The URL was corrected and a VM compile check was added to the focused live-candidate fixture. The fixture now passes.
- Passing checks: `tests/successor-live-candidate-v1.test.mjs`, `tests/successor-preview-live-gate-v1.test.mjs`, `tests/successor-natural-route-v1.test.mjs`, `cloudflare/test.mjs`, and JavaScript syntax checks for the candidate/renderer scripts.
- `tests/successor-camera-adapter-v1.test.mjs` currently passes, including eight-direction projection, V21 movement normalization and collision-resolved direction checks. A prior run during this shared-worktree session failed on a stale QA harness expectation; the latest run no longer reproduces that failure. Other concurrent changes in this untracked test have unknown provenance.

## Browser and Relay evidence

- At **1280×720**, the live candidate reached the V21 menu and 3/4 background. A crop showed the menu text is sharp, but the background terrain repeats in strong diagonal bands. Overall visual status: **REVISE**.
- At **390×844**, the candidate entered HOME and rendered HUD, joystick, nearby-player panel and world terrain. The screenshot is real gameplay display evidence, not phone hardware evidence. Small HUD text/legacy character scale and repeated ground remain **REVISE**; physical touch, sound, combat and full expedition remain **UNKNOWN**.
- Two isolated browser origins connected to the public Relay simultaneously. Each client reported **Online 2** and displayed the other temporary test player (`QA Test` / `QA Peer`). This confirms two-client presence delivery for the observed session.
- During the two-client sample, the HUD peaked around 2.6 seconds RTT, 1.3 seconds jitter and 29.2% packet loss. **SUSPECTED / unstable quality; not a server-root-cause finding.** Movement/combat payload sync and longer stability were not tested. A later direct `/health` navigation was blocked by the browser client, so endpoint health is **UNKNOWN**, not confirmed down.
- **VERIFIED browser-local persistence:** after a test start, reopening the same origin showed “Continue last camp”; the second isolated port began without that option. This confirms the candidate uses origin-scoped browser persistence, not a Cloudflare/world save. The two temporary QA saves were left intact.
- Both tabs and both loopback static servers were closed; the temporary viewport override was reset. Local browser storage on the two test origins was left intact; no data was cleared.

## Release gates still open

- The default `index.html` now redirects and links to the 3/4 candidate; a browser opened the root URL and landed there. This is local source state only. No public static site was deployed, and the Cloudflare Worker root still lacks a static asset binding.
- Cloudflare Worker config does not serve the static game. Wrangler and dependencies are absent in the checkout. Production art manifest/gate remains blocked. Save data remains local to each browser origin; the Worker does not persist the application world.
- Next: investigate the Relay latency/loss with a reproducible external-network sample; verify actual movement and state delivery between the two isolated clients; capture desktop gameplay (not only menu) and complete 390×844 HUD/art review. Only after visual, gameplay, save/network and static-host gates pass should public deployment or old-version cleanup proceed.

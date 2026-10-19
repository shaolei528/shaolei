# V21 3/4 successor focus, campfire light, and release check — 2026-10-06

## Scope and source ownership

- Working copy: `C:\Users\MECH\Documents\ChatGPT\游戏编程\abyssal-wake-integration`
- Branch / HEAD observed: `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`.
- The worktree contains roughly 108 modified/untracked status entries with mixed/unknown ownership. Preserve them; no cleanup, staging, commit, or push was done.
- Changes made during this task are limited to local preview input focus in `prototypes/successor-3-4/preview.js`, matching assertions in `tests/successor-preview-live-gate-v1.test.mjs`, and a renderer-only SafeCamp campfire lighting treatment in `prototypes/successor-3-4/successor-renderer.js`. All three files remain untracked in this worktree, so there is no Git baseline diff to attribute.
- The renderer treatment uses the existing campfire placement and adds a warm low ground glow with small animated ember pixels. It does not change simulation, collision, inventory, combat, Relay, save schema, or asset manifests.

## Player-visible verification

- Guarded local page: `http://127.0.0.1:8765/prototypes/successor-3-4/index.html` (Codex in-app browser tab retained as a deliverable).
- **VERIFIED:** guarded route loads the real V21 SafeCamp state with the 3/4 renderer; terrain and the player/prop/resource/monster atlases load. The page reports `LOCAL PREVIEW · RELAY BLOCKED` and uses the preview memory-save shim.
- **VERIFIED:** clicking the game canvas and pressing `E` triggers the in-game campfire rest message. The iframe canvas now receives explicit keyboard focus when clicked, while clicking other UI controls does not route focus through the canvas handler.
- **NOT VERIFIED:** sustained movement and the ordinary-input full expedition. The UI automation here sends key pulses, not a held key; a pulse did not establish movement. Do not treat the VM eight-direction test as live player evidence.
- **REVISE:** ground/path repetition and low scene detail are still visible. This change is a bounded camp focal-light pass, not final production art or an overall art acceptance.

## Checks and release state

- **PASS:** all 63 `tests/*.test.mjs` scripts were run serially; each exited successfully. One test explicitly skipped its CLI child-process assertion because this Windows sandbox blocks process spawning.
- **PASS:** `node --check` on the successor renderer and preview entry; focused expedition, world, HOME-upgrade and guarded-preview tests all exited 0.
- **PASS:** `node cloudflare/build-site.mjs` prepared `.cloudflare-site-365c3997727a` with 59 allowlisted payload files and updated `wrangler.jsonc` to that package.
- **PASS:** Wrangler 4.102.0 `deploy --dry-run` read 79 assets-directory entries and exited without upload.
- **NOT DEPLOYED:** `wrangler whoami` returned “You are not authenticated”; no Cloudflare token is present. Do not start broad OAuth: a prior audit cancelled the login before consent because its requested scopes crossed unrelated Cloudflare products. GitHub remote status also could not be queried because `github.com:443` is unavailable through the current proxy.
- No production URL, public deployment, GitHub push, two-client Relay run, mobile-device check, or full player route is established by this handoff.

## Next high-value work

1. With real held input or a controlled browser pointer-hold, finish one ordinary-input route: prepare/craft → leave HOME → MIRE MART fight/search → secure both shards → return → Field Rig upgrade.
2. Recheck the campfire light at dusk/night and compare one 1280×720 and one 390×844 guarded gameplay view; retain the overall art verdict as REVISE until terrain variety/production source art is fixed.
3. For publication, provide an existing narrowly scoped Cloudflare Workers Editor API token for the already-configured Worker; then perform an authenticated dry-run, deploy, health check and two-client Relay check. Before a raw.githack public update, establish the actual public repo branch and push only reviewed/owned changes. Development URLs use a branch; CDN URLs must use a tag or commit and are cached permanently by the exact URL, per raw.githack's current documentation.

## Follow-up — movement-pad focus and starter waypoints — 2026-10-06

- The shared worktree is now at **110** modified/untracked status entries. Provenance remains mixed/unknown; no broad cleanup, staging, commit, or push was done. The successor preview, renderer and test files cited below are untracked, so there is no clean Git baseline diff to claim.
- Updated only the guarded preview focus route: clicking the game canvas or `.successor-pad` explicitly focuses the iframe. Source-contract test passes. Clicking the movement pad in the local browser placed keyboard focus inside the `about:srcdoc` game frame. This verifies focus routing, not held-key movement.
- Added successor-only ground pings for the nearest available wood and stone while starter inventory is short; once both recipe costs are met, the ping points to the workbench until the knife exists. No V21 simulation, save, manifest, combat, Relay or Cloudflare code was changed.
- **VERIFIED 960×615 guarded browser view:** SafeCamp renders both labeled pings (`木材 · E`, `石料 · E`), terrain and sprite atlases. Preview still reports `LOCAL PREVIEW · RELAY BLOCKED` and `memory save shim`. Overall terrain/art remains **REVISE**.
- **PASS:** `node --check` on `preview.js` and `successor-renderer.js`; `successor-preview-live-gate-v1.test.mjs`; `safe-camp-first-knife-preparation-v1.test.mjs`; scoped `git diff --check`.
- **UNKNOWN:** dynamic waypoint transitions after real gathering/crafting, sustained ordinary-input movement, full expedition, 390×844/mobile acceptance, production wiring, live multiplayer and public release. The Windows process-spawn restriction also prevented using Playwright's separately launched Chromium for a held-input measurement.

## Follow-up — shore signal and contextual workbench navigation — 2026-10-06

- Revalidated the actual worktree before editing: branch `fix/awakening-production-gate-qa-findings-v1`, HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`, with 111 modified/untracked status entries. Candidate renderer and new focused test remain untracked; this count is a shared mixed-provenance snapshot, not ownership attribution.
- Added a sparse, intermittent cyan shore signal in the guarded 3/4 renderer to create a distant anomaly landmark. It is renderer-only and changes no V21 simulation, inventory, combat, persistence or Relay behavior.
- Tightened the starter workbench waypoint: it uses the SafeCamp interaction anchor `(2195,2535)`, labels the action `工作台 · E`, and appears only within 350 world units while inside the visible gameplay area. The active V21 interaction radius remains 125 units; near resources continue to use the existing `【互动】采集…` prompt.
- **VERIFIED screenshot:** the guarded 960×615 view still loads V21 terrain and actor/prop/resource/monster atlases, displays wood/stone pings and the intermittent shoreline signal, and labels itself `DEV SUCCESSOR PREVIEW · NOT PRODUCTION` / `LOCAL PREVIEW · RELAY BLOCKED`.
- **PASS:** renderer syntax; `successor-starter-workbench-waypoint-v1.test.mjs`; `successor-preview-live-gate-v1.test.mjs`; `safe-camp-first-knife-preparation-v1.test.mjs`; scoped `git diff --check`.
- **NOT VERIFIED:** automation's click method rejected attempted coordinate calls, so this follow-up did not establish ordinary-input held movement or dynamic waypoints after gathering/crafting. Do not report the preparation route as player-complete.
- The existing `live-candidate.html` / `live-candidate.js` entry is only a local integration candidate; it still depends on V21 and its 64px atlases and is not a formal production takeover. No commit, push, public URL, Cloudflare deployment or two-client Relay verification was made.
- **VERIFIED source geometry / new guidance:** after a knife is owned, the guarded 3/4 renderer can show `↗ MIRE MART` at `(CAMP.x, WORLD.zone - 10)`, stays visible after leaving the safe radius, and disappears naturally when V21 switches from zone `1:1` to `1:0`. The target projects upper-right from SafeCamp, matching the authored road. This is static/runtime-source geometry plus regression evidence; ordinary player traversal remains UNKNOWN.
- **PASS:** focused waypoint regression now checks the real SafeCamp anchor, 125-unit interaction radius, viewport-stable overlay coordinates, world-zone destination and upper-right projected direction.
- **New candidate integration:** the same renderer now reads the existing expedition phase without owning it. It points `REACH_MIRE_MART` toward the real parking rectangle, `SEARCH_FIGHT` toward the nearest available POI shard, `SECURE_REQUIRED_SALVAGE` / `RETURN_HOME` toward the `1:1` boundary, and the return leg inside `1:1` toward the campfire. Existing `awakening-expedition-loop-v1.test.mjs` still passes unchanged.
- **Boundary:** phase changes and marker transitions have not been observed through ordinary player input because the guarded preview starts with zero inventory and the available click automation rejected attempted coordinates. This proves renderer wiring and source geometry, not the complete player route.
- **Combat presentation gap confirmed and bridged in the candidate:** V21 weapon presentation wrapped `drawPlayer()` and hit feedback wrapped `drawMobs()` / default draw hooks; the 3/4 renderer draws actors and mobs directly, bypassing those hooks. The weapon owner now exposes its existing pixel-knife draw function for a supplied canvas, and the candidate maps shared pose/direction to its isometric screen coordinates. It consumes the existing confirmed-hit spark/impact records, applies the existing local canvas kick, and draws the existing hurt flash.
- **Presentation hit-stop:** the successor holds the just-rendered local confirmed hit frame for 24/48/64/112ms by hit severity/lethal outcome. Simulation and Relay continue advancing; this is a render-only freeze and does not pause authoritative clocks. Combat timings, damage, range, cooldown, save and network contracts remain unchanged.
- **PASS:** focused successor combat wiring regression; shared weapon presentation regression (including alternate-canvas crisp rendering); combat hit-feedback and playable-feel regressions; waypoint, guarded-preview, first-knife and expedition-loop regressions; both edited JavaScript files pass `node --check`.
- **NOT VERIFIED:** a live hit/kill has not yet been performed in the guarded 3/4 browser, so the new weapon, impact and freeze presentation are covered by runtime-source regression and existing combat VM tests rather than a candidate combat screenshot. Full ordinary-input travel/combat/salvage/return remains UNKNOWN.

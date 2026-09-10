# ABYSSAL WAKE — NEW CHAT HANDOFF

## Read this first
This is the canonical handoff for the existing Abyssal Wake project. **Do not restart the game from scratch. Do not replace the existing project with a new toy prototype.** Continue from the current repository and preserve implemented systems.

## Repository / backup
- Repository: `shaolei528/shaolei`
- Main branch: `main`
- Pre-hotfix stable backup branch: `backup/abyssal-wake-v7-2026-09-10`
- That backup branch points to commit `ccf1976e2395c5765f31ac37f5ffa6747f5144e7`.
- Current main entry is V8 startup hotfix while the full gameplay remains V7.

## Non-negotiable project rules
1. This is a **real-time multiplayer shared-world survival game**. Multiplayer networking must never be deleted, commented out, or replaced by single-player logic.
2. Highest-priority regression every round: **ENTER SAFE CAMP must always respond**. Audit its event binding, initialization order, external resource loading, and continuation into real-time world connection every iteration.
3. Preserve existing gameplay and extend it; do not repeatedly rewrite the game from zero.
4. All new gameplay must work correctly with multiple clients and synchronized state.
5. Hosting/backend must stay on $0/free plans unless the user explicitly changes this requirement.
6. Mobile phones are the primary client, including Myanmar mobile networks and higher latency.
7. Art direction: polished 16-bit/pixel-art Cthulhu/cosmic-horror survival. Brighter readable daylight at arrival; darkness should be atmospheric, not unreadable.
8. AI concept art is reference only. In-game art should be character sprites, animation frames, monster sprites, props, terrain tiles, effects, and UI assets — never a whole concept image pasted over gameplay.

## Current launch architecture
### `index.html`
- Current homepage.
- Now points to `survival-v8.html?v=8`.
- V8 message explicitly says the gameplay is preserved and only startup is hardened.

### `survival-v8.html`
- Small wrapper, **not a rewrite of the game**.
- Fetches the current `survival-v7.html` with `cache: no-store`.
- Removes only the old blocking script startup tail.
- Injects `boot-v8.js?v=8`.
- The full V7 HTML/UI/gameplay is otherwise reused unchanged.

### `boot-v8.js`
V8 startup hotfix. It exists because the old V7 page loaded the external real-time library synchronously before `game-core.js`, while `game-core.js` begins by reading `window.supabase.createClient`. On a slow/blocked CDN this meant the core never loaded and ENTER SAFE CAMP appeared dead.

V8 behavior:
- Binds ENTER SAFE CAMP immediately before loading the real-time dependency.
- Gives immediate visual feedback (`ENTERING MIREWOOD…`, status text).
- Tries two real-time library mirrors in order:
  1. jsDelivr UMD build
  2. unpkg UMD build
- Uses per-load timeouts instead of hanging forever.
- Only after the real-time library is available does it sequentially load the unchanged existing modules:
  - `game-core.js`
  - `game-play.js`
  - `game-render.js`
  - `game-v7-patch.js`
  - `mobile-fixes.js`
- If the user already tapped ENTER, it re-fires the click after the original V7 listener is installed.
- If loading fails, the button becomes usable again and explicitly offers retry.
- Multiplayer is never removed or replaced with offline play.

## Existing gameplay source — preserve these
- `survival-v7.html` — full current game interface and existing UI.
- `game-core.js` — world state, Supabase channels, presence, zone switching, player state, save data, network stats, chat foundations.
- `game-play.js` — interaction, harvesting, crafting, combat, mob AI, survival loop, death/respawn, controls.
- `game-render.js` — world/player/mob/resource rendering and lighting.
- `game-v7-patch.js` — Safe Camp/tutorial/daylight/map and V7 iteration behavior.
- `mobile-fixes.js` — mobile canvas fitting, input cancellation, reconnect UI and mobile safeguards.
- `survival-config.js` — public client-side real-time configuration. Read this file instead of duplicating credentials in documentation.

## Existing art assets
Repository `assets/` contains independent in-game assets/sprite sheets. Continue using/growing this model rather than whole-scene concept images.
Known asset categories include:
- player 4-direction walking sprite sheet
- monster sprite sheet
- camp props
- resource sprites

## Existing gameplay systems
Do not discard these systems:
- shared public world (no room code required)
- multiplayer player presence
- 3x3 / nine-zone world structure
- zone-specific high-frequency state sync
- global presence/chat layer
- zone leader election for authoritative shared mob state
- remote-player interpolation
- adaptive movement update rate for weak networks
- PING / JITTER / SYNC LOSS / GOOD-FAIR-POOR states
- HP
- FOOD/Hunger
- MIND/Sanity
- inventory
- Wood / Stone / Food / Eldritch Shards
- Bone Knife
- Lantern
- Field Meal
- harvesting
- crafting
- PvP outside safety rules
- Watcher / Cultist / Crawler enemies
- mob combat and synchronized mob state
- kill rewards / loot logic
- death and respawn
- field protection / ward after leaving camp
- Safe Camp
- Camp Guide/tutorial flow
- campfire recovery
- chat
- world map
- day/night cycle
- sanity visual effects
- local progress saving
- pixel-art character/monster/world direction

## Safe Camp design intent
User specifically requested time to meet/talk with friends before danger begins.
Safe Camp should provide:
- no monsters inside
- no PvP inside
- recovery
- beginner supplies
- tutorial/Guide
- crafting/workbench
- campfire
- enough calm time for friends to connect and talk
- player chooses when to leave
- field grace/ward after first exit

Start the player's first session in readable daylight. Do not make arrival instantly dark.

## Infrastructure state
### Supabase
- Project: `abyssal-wake`
- Region: Singapore (`ap-southeast-1`)
- Created on free/$0 plan.
- Real-time configuration is already connected in `survival-config.js`.
- Architecture uses global presence/chat and zoned high-frequency broadcast.

### Vercel
- Project name: `abyssal-wake`
- Project ID: `prj_UugP1DqBhEnHHLcH7hIjROqh6k5K`
- Account/team scope discovered as `shaolei528`
- Vercel account ID: `team_dffUvognICmXYYYmsoxDrMI6`
- Production aliases seen:
  - `abyssal-wake.vercel.app`
  - `abyssal-wake-shaolei.vercel.app`
- A Vercel inspection showed the deployment itself as `READY`, `aliasError: null`, and build logs with no errors.
- However the user saw browser-level `ERR_CONNECTION_FAILED` on Myanmar LTE for the Vercel domain. Treat this as a hosting/network access path issue unless new evidence shows a build/runtime failure.
- A fresh Vercel preview deployment could also be created successfully, proving the Vercel deployment API itself works.

### Netlify fallback
- An existing Netlify project named `abyssal-wake` was found.
- Site ID: `a2807882-74fe-43f4-936e-9811a7274246`
- Primary URL shown: `abyssal-wake.netlify.app`
- No password / no SSO visitor protection was reported.
- Netlify should be used as a practical alternate public host if `*.vercel.app` remains unreliable from Myanmar.
- Current game files were not yet fully mirrored to this Netlify site at handoff time; this is an important next task.

## Known problems / do not trust previous claims blindly
The conversation contained many rapid iterations. Re-audit the actual repository before claiming a bug is fixed.
Priority checks:
1. ENTER SAFE CAMP on iPhone/Safari/ChatGPT in-app browser.
2. V8 wrapper correctly finds and replaces the V7 legacy script tail.
3. `boot-v8.js` loads the UMD real-time bundle and then all five local modules in sequence.
4. Multiplayer starts after early ENTER tap rather than only displaying the camp shell.
5. Two clients see each other and ONLINE updates.
6. Zone change does not create duplicate leaders/channels.
7. Safe Camp no-PvP/no-monster rules are enforced on all clients, not just locally.
8. Beginner resources: verify whether camp resource harvest is actually per-player or still broadcast/shared. Fix based on actual source, not prior chat claims.
9. Verify Field Ward is included in movement/presence payloads used by mob targeting; previous versions had local-only protection bugs.
10. Verify dead/old saves respawn safely at camp rather than in dangerous coordinates.
11. Verify chat/map/craft panels cancel mobile movement input.
12. Verify night overlay remains readable on real phone screens.
13. Verify external CDN failure shows a retry state instead of a dead button.

## Immediate next actions for the new chat
1. Read this `HANDOFF.md` first.
2. Inspect the current main branch files listed above; do not regenerate the project.
3. Syntax/logic-check `boot-v8.js` and the `survival-v8.html` replacement markers against current `survival-v7.html`.
4. Test ENTER SAFE CAMP startup path.
5. Prefer removing the external CDN as a single point of failure (for example, vendor an approved local browser bundle in the repository) while preserving the same Supabase multiplayer backend.
6. Deploy the **complete current repository** to the existing Netlify `abyssal-wake` site as the Myanmar-friendly fallback, then verify it from a real browser.
7. Keep Vercel intact as another deployment target; do not delete it just because Myanmar LTE could not reach it.
8. Once launch/network reliability is stable, continue content expansion instead of another rewrite.

## Next content expansion after stability
Suggested next major gameplay round, all multiplayer-compatible:
- equipment slots
- axe / spear
- physical world drops
- tree chopping animation/state
- treasure chests
- ruins/interiors
- quest NPC progression
- first regional mini-boss
- richer terrain tiles and biome landmarks
- more readable pixel lighting and particles
- synchronized world events

## Development behavior expected by user
- Be proactive: audit, fix, then enhance each round.
- Do not ask for confirmation every tiny step.
- Do not throw away existing work.
- If a previous statement conflicts with repository source, trust and inspect the source.
- User prefers a finished playable game, not standalone concept images or isolated snippets.

# Handoff: first expedition guidance and encounter pacing

## Scope and ownership

- **Lead:** Integration & QA, coordinating one slice across the canonical POI & Exploration and Creatures & AI owners.
- **Owned changes:** `modules/world/awakening-expedition-loop-v1.js` clarifies the POI preparation objective when the player is outside HOME. `modules/safe-camp/game-v7-patch.js` now seeds no unrelated ambient pack in the first MIRE MART zone; POI-authored crawlers remain in `modules/world/awakening-world-v1.js`.
- **Interfaces:** No Relay message, inventory schema, save version, movement rule, or reward contract changed.
- `cloudflare/README.md` now records the current package build, public V17f entry, branch/dirty-worktree state and UNKNOWN Wrangler authentication instead of its stale tooling claims.

## Verified

- The preparation objective now says to return to Safe Camp when the player leaves before crafting the knife, and shows the missing wood and stone counts.
- The first expedition zone no longer layers two ambient watcher/cultist enemies over the two POI-authored crawlers. The Safe Camp starter area still has two separated 48-HP crawlers; other regions retain their mixed encounters.
- Ten focused tests passed serially: `first-expedition-domain-integration-v1`, `awakening-expedition-loop-v1`, `safe-camp-first-knife-preparation-v1`, `interaction-resource-work`, `crafting-processing-v1`, `combat-loot-settlement-v1`, `loot-creature-rewards-v1`, `awakening-world-v1`, `successor-natural-route-v1`, and `starter-encounter-v1`.
- The new `tests/first-expedition-domain-integration-v1.test.mjs` composes actual harvest final-hit settlement, Inventory transaction, Crafting service, Player Combat, configured Loot claim and Expedition state machine. It observes all 24 staged wood/stone feedback events, reaches 4 wood / 3 stone, crafts the knife, defeats two authored crawlers, receives two shards, and completes the return phase. This is VM domain integration with direct position changes, not ordinary browser movement/collision evidence.
- `npm run build:site` prepared 98 public files (0.64 MiB) in `.cloudflare-site-324189090211`. The package build and focused tests are local checks only.
- The public raw.githack `main/index.html` still displays V17f.

## Not verified / current limits

- The ordinary browser route still has **NOT PASS** status: no verified player run has gathered resources, crafted the knife, defeated a creature, received its reward and returned to HOME in one session.
- The isolated preview blocks Relay and uses an in-memory save shim. Public co-op, disk persistence, deployment and release acceptance remain unverified.
- A local preview server process printed its ready URL, but this turn's local HTTP socket probe was denied by the environment and CUA rejected observation of localhost. Do not claim the page was visually or interactively verified.
- Wrangler authentication was confirmed absent on 2026-10-15. A 2026-10-19 `whoami` recheck returned no output and was interrupted, so current auth is UNKNOWN.
- Branch/HEAD at inspection: `fix/awakening-production-gate-qa-findings-v1` / `54d294a`. The worktree remains mixed and dirty; no commit, push, cleanup, merge or deploy was performed.

## Next

Use a browser session that can observe the local candidate and complete the route with ordinary movement and interaction. Then verify real save reload and a two-client Relay session as separate gates before pushing the selected work to the public branch and deploying the Worker/site together.

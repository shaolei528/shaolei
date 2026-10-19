# SafeCamp continuous pixel materials handoff - 2026-10-06

Status: **DRAFT / successor candidate; not V21 production art**.

## Verified changes

- **How scene art enters the game:** `preview.js` enables the local ground candidate only for explicit `awDevQa=1&awLiveGroundArt=1`. `successor-renderer.js` loads tileable meadow/water/sand PNGs, clips each texture paint to the projected cells from the existing SafeCamp map, then renders the unchanged road/entities/interactions and normal V21-backed player simulation above it. This lets designed surface art appear in gameplay coordinates without using a mismatched full-scene painting as a false collision map.
- The same guarded route selects the matching pixel survivor and lightly scales camp props/resources for composition review. These presentation changes do not alter collision, interaction reach, tile IDs, saves, or Relay messages.
- Branch at review: `fix/awakening-production-gate-qa-findings-v1`; base HEAD observed before this work: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`.
- Added generated 128x128 repeatable meadow, water and sand textures plus a packed-earth road texture. The 3/4 candidate clips each material to its union of projected SafeCamp cells and keeps other terrain/transition cells on the original map.
- The actual painted lake illustration remains a separately guarded visual comparison because it does not own the collision map. Movement authority, tile IDs, persistence, and Relay contract were not changed.
- Cloudflare static packaging completed locally into `.cloudflare-site-c8bc2637d42f`; 68 public files (10.72 MiB) include the four ground materials and updated candidate renderer. No Cloudflare deployment, GitHub push, raw.githack update, or release occurred.

## Checks

- `node --check` passed for `successor-renderer.js`, `preview.js`, and the terrain art generator.
- `node tests/successor-live-candidate-v1.test.mjs` passed.
- `node tests/successor-terrain-atlas-mapping-v1.test.mjs` passed.
- `node tests/cloudflare-site-entry-redirect-v1.test.mjs` passed against the newly prepared static package.
- `node tests/successor-live-road-ground-v1.test.mjs` passed; the Cloudflare test now asserts packaged road art and current continuous-road source ownership.
- Browser showed the guarded local page with `groundStudy:128x128`, continuous grass, water and shore, and `LOCAL PREVIEW · RELAY BLOCKED`.
- Browser viewport was 1037x660. The candidate reported `playerCandidate:1254x1254`; dragging the visible joystick changed the camera framing and player pose, confirming the scene art is rendered inside the running preview. This short interaction is not sustained jitter or device acceptance evidence.

## Still unknown / next work

- A joystick drag visibly moved the player/camera in one browser snapshot. Long-duration motion stability remains unverified. The live view showed dense small grass marks, blocky water flecks and coarse loose props; the next art pass should use larger calm pixel clusters, cleaner shoreline/path transitions and a more unified prop style.
- Review the 3/4 candidate at 1080p and narrow viewport size, especially shoreline joins, path surface, and actor/prop scale.
- V21 formal art acceptance, public co-op session, backend deployment state, remote two-client gameplay, commit/push, and release remain unverified.

## Latest local review

- Added a small city-rim silhouette behind the camp map after the user noted that the area outside the camera/map was invisible. A fully loaded browser capture shows dark block façades and sparse windows at the left/right map edges, while the SafeCamp terrain remains foreground and the harbor sea/background remains non-walkable. Camera zoom and world/collision dimensions stay unchanged.
- After the first screenshot, the candidate survivor was too large relative to camp props and its walk cycle read as hesitant. It is now `.26` desktop / `.22` narrow scale on this guarded art route (about 81px / 69px source-cell image size), with the nameplate anchor moved closer and walk-frame cadence advanced from 5 to 7 ticks. A refreshed view shows improved scene proportion; a joystick drag confirms short movement/camera response. Extended feel still needs player acceptance.
- The current local package is `.cloudflare-site-c8bc2637d42f` (68 public files, 10.72 MiB). It is a local package only; no public deploy, commit, push, or raw.githack update occurred.
- **Loop gap audit:** V21 has harvest/craft/combat/POI return scaffolding and lantern/night/SAN pressure; confirmed major missing gameplay is co-op-safe placeable defense and a real night-to-Boss loop. There is no authoritative building/collision/persistence contract for a barricade yet, so a local-only preview prop would not satisfy the requested shared loop. Keep this as the next systems-level integration task, not a claimed feature.

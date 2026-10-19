# SafeCamp composition review — scene board V2

**Status: DRAFT / OFFLINE IMAGE REVIEW / NOT PRODUCTION.**
**Image reviewed:** `assets/art-candidates/safecamp-continuous-scene-draft-v2/SafeCamp_DRAFT_DEV-ART-PREVIEW_1x_NOT-PRODUCTION.png` (960×632; 960×600 scene plus 32px footer). This review is based on the stored image opened at native board size. It is not an in-game viewport capture.

## What reads now

- HOME vs shore is clear: broad muted grass gives way to warm sand and cool water. The one-piece irregular coast avoids visible tile seams in this composition.
- The pier meets the shore at lower-right and the hand-painted return arrow points southwest toward the camp. This supports a visual departure/return relationship without asserting a runtime route.
- The hearth anchors a recognizable cluster of two shelters, a Guide, player, workbench, bedroll, benches and supplies. The fire is a compact warm focal point, not a large soft glow.
- Source sprites preserve hard edges and opaque/transparent alpha only, according to the native-PNG scan recorded in the candidate README. This says nothing about future runtime compositing.

## Next composition revision — no new assets

1. **Quiet the road where it crosses the hearth.** Retain its direction and continuity, but reduce the central span's visual weight enough that the fire/player/Guide/home cluster becomes the first read. Keep the path brighter or wider only where it needs to lead the eye toward the pier.
2. **Group daily preparation visibly.** The player and Guide should frame the workbench/supplies as a shared preparation spot. Keep tents as the second read and peripheral furniture/fence as the third. Do not move candidate sprites in ways that alter their source bounds or imply new world coordinates.
3. **Replace micro-speckle pressure with a few broad ground-material clusters.** Lawn detail is currently a mixture of many fine repeated accents and large open regions. Use a small number of larger, irregular, low-contrast grass clumps at lawn margins; preserve open negative space around actors and the route. Do not add another uniform/random scatter pass.
4. **Preserve the coast's value hierarchy.** Keep distinct grass → dry sand → wet edge → deep water bands; vary shoreline width and ripple groups instead of regular teeth or evenly spaced highlights. Leave the pier landing uncluttered.
5. **Use color to support the survival loop.** HOME stays olive/wood/amber, with the fire brightest. The OUTSIDE side of this study begins at the cool shore; it may be cooler and wetter, but should not be globally purple. Reserve anomalous cyan/violet for a later authored anomaly focal point, not ordinary camp terrain.

## Five experience pillars at scene scale

| Pillar | What this HOME image can show | What must not be inferred |
|---|---|---|
| Crashlands | Strong character/object silhouettes and a decisive fire focus. | Combat behavior, damage, telegraphs or an encounter. This is a HOME proof, so do not add a decorative enemy. |
| Terraria | A readable pier/shore transition and landmarks that orient an outward journey. | New POIs, unlock gates, routes or exploration rewards. |
| Minecraft | A visibly used camp with preparation objects and personal warmth. | Free-form building beyond current supported systems. |
| Don't Starve | A clear safe-home vs exposed cool shore contrast. | Hunger timers or danger states absent from the image data. |
| Stardew Valley | A welcoming Guide and human-scale arrangement that rewards return. | NPC schedules, friendship or dialogue features not represented by current behavior. |

## Keep and revise disposition

- **KEEP:** irregular shoreline transition, short return sign, warm hearth light, two distinct shelter silhouettes, Guide/player color separation, native sprite bounds.
- **REVISE:** central road dominance, the preparation-workspace grouping, and the balance between broad empty lawn and repeated small accents.
- **WAIT:** sprite scale/anchor changes, building depth bands, modular terrain extraction, animation expansion, palette production freeze, OUTSIDE threat art, runtime hookup. These depend on owner decisions and successor screen evidence.

## Safety and acceptance limits

The current scene builder writes all native sprites and both board PNGs in place. Candidate ownership is still unknown, so this review did not run it or edit any image. A future revision should use an owner-confirmed isolated output copy or a scoped candidate edit that preserves all existing files. Do not call the scene accepted until the selected candidate is drawn through the actual successor at 1280×720 and 390×844 with crop, scale, actor contacts, prop occlusion, HUD safe areas and fallback visible.

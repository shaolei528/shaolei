# NPC & Social V2 module contract handoff

Date: 2026-10-05 (Asia/Rangoon)
Lead: NPC & Social
Scope: source audit, module contract and user-reviewable NPC content draft only
Status: DRAFT / NOT IMPLEMENTED

## Verified baseline

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD at inspection: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Worktree contains many dirty and untracked files with unknown/mixed provenance. They were preserved; do not attribute them to this task.
- V21 Guide snapshot and `guideTalked` memory live in `modules/safe-camp/game-v7-patch.js`; V12 fixed-dialogue UI and task-advice inference live in `modules/input/interaction-v12.js`.
- `tests/camp-guide-talk-sync-v1.test.mjs` covers the V12 normal talk path calling SafeCamp `markTalked()`. A legacy `newUse()` path still writes the Guide closure/key directly; therefore this is a local fix, not proof every talk route was consolidated or migrated to Core State & Save.
- V12 task text independently infers progress from inventory, knife and `hasLeftCamp`. World wraps objective text, and Expedition ultimately writes its objective. The Expedition contract is session-local (`persistence:none-v1`, `authority:local-objective-state-only`). It is not a persistent Quest service or multiplayer/server authority.
- Player chat is separate from NPC dialogue. No NPC relationship/schedule service or NPC trade settlement system is established in the reviewed active source.
- Existing Guide uses the general player sprite and CSS dialog portrait placeholder. Dedicated high-detail NPC art is not established. Prior handoffs report desktop guarded-preview visibility, but no current 1280×720 and 390×844 NPC captures were taken during this task; NPC visual acceptance remains UNKNOWN.

## Artifacts

- [`NPC & Social V2 contract`](../content-inbox/2026-10-05-npc-social-module-card-v2.md) replaces V1 as the routing card. V1 remains historical.
- [`Harbor radio maintainer content candidate`](../content-inbox/2026-10-05-npc-content-harbor-radio-maintainer-v1.md) is an original DRAFT / NOT IMPLEMENTED; name, dialogue and art direction are not approved or integrated.
- [`Canonical module map`](../SUCCESSOR_MODULE_MAP.md) now routes NPC & Social to V2 and distinguishes current scattered Guide/Expedition responsibilities.

## Five-game experience translation

The card turns Stardew-like return/community value, Crashlands-like memorable voice, Terraria-like state-aware guidance, Minecraft-like useful home service, and Don't Starve-like risk preparation into observable original acceptance criteria. It does not claim those future features already exist or copy protected content.

## Verification and limits

Independent read-only NPC reviewer confirmed the above source boundaries and noted that V1 overstated all-path Guide synchronization and failed to state the Guide task advice does not read the actual Expedition snapshot.

Passed serially: `core-smoke`, `camp-guide-talk-sync-v1`, `interaction-guide-task-v12`, `successor-camp-guide-render-v1`, `awakening-expedition-loop-v1`, `successor-module-routing-contract-v1`, and `module-sort`. Routing reports 27 owners/cards, 0 broken links, 0 duplicate owners, 0 missing triggers/interfaces. `module-sort` reports byte-identical reconstruction and preserved load order. `git diff --check` found no whitespace errors; Git emitted only existing mixed-worktree LF-to-CRLF warnings. These source/test checks do not establish mobile visuals, NPC content quality, full NPC service implementation or multiplayer behavior. No runtime code, tests, art files, manifest, save, Relay, merge or deployment was changed.

## Next step

User can keep/edit/delete the single NPC candidate. If retained, the next engineering task should still name one concrete NPC issue or one Guide data-driven slice, with exact allowed files and adjacent regression. Do not start a full NPC system by default.

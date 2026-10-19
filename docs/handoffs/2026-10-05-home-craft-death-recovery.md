# Guarded HOME prep, Bone Knife craft, and death recovery - 2026-10-05

## Scope and owners

- Lead: **Interaction & Gathering**. Collaborators: **Crafting & Processing / Items & Inventory**, **Movement & Locomotion / Input & Accessibility**, **Quest & Narrative**, **Creatures & AI**, and **Integration & QA**.
- Evidence came from live guarded browser tab `122977165` at `127.0.0.1:8765/prototypes/successor-3-4/index.html`. Guard displayed `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`, `LOCAL PREVIEW · RELAY BLOCKED`, memory-only save. No production gameplay files or server were changed.
- The run used developer-only single-frame STEP buttons for projected movement. Those controls apply a short ordinary simulation input and do not teleport or set world coordinates, but this remains QA-assisted preview play rather than normal keyboard/mobile acceptance.

## Verified play

1. Fresh HOME state showed wood 0/4 and stone 0/3. Native E at visible resource prompts raised the HUD to wood 4/4 and stone 3/3. No inventory injection or location teleport was used.
2. Reached the authored workbench by projected step movement. The prompt read `使用工作台`; native E opened the existing panel with `骨刃 · 4 木材 + 3 石头`. Selecting its existing 制作 button advanced the objective to LEAVE HOME.
3. The backpack showed `† 骨刃 已装备 近战武器 当前生效`; wood and stone were 0. This verifies only the local recipe and equip presentation in the guarded preview.
4. North-projected steps changed the objective from LEAVE HOME to REACH MIRE MART after leaving the SafeCamp radius. Near the Zone boundary, a hostile was about 29 units away, HP 36 and one windup was visible. A Space input was issued; the player died before a hit or enemy damage result could be confirmed.
5. Used the normal death-screen 返回营地 action. HP restored to 100; Bone Knife remained equipped; food went from 2 to 1; wood/stone stayed at 0. The objective became `LEAVE HOME · 上次远征因死亡中断...`, consistent with the death-interrupted path.

## Exact continuation and limits

- The same tab was left open and marked for handoff. At last read: HOME, HP 100, food 1, Bone Knife equipped, wood 0, stone 0, objective LEAVE HOME for an interrupted attempt.
- No MIRE MART entry, search, shard salvage, successful combat hit, natural post-salvage return, or HOME growth was verified. Space attack effect is UNKNOWN. The page was one-client Relay-blocked and memory-only; actual durable save and multiplayer behavior remain UNKNOWN.
- Desktop image quality remains **REVISE** based on coarse repetitive terrain, small legacy sprites, and dense QA diagnostics. Mobile and formal production-art acceptance were not checked.
- Next: re-read the retained tab and decide from current food/health state whether to rest/resupply; repeat prep only if needed. Travel in short observed intervals so health and enemy windup can be checked before committing deeper into the POI. Do not claim the expedition is complete.

## Regression and shared-worktree boundary

- No source regression test was added for this manual play; no production code changed. Existing project worktree remains dirty across many shared paths of unknown ownership. Preserve those changes and attribute none of them based only on this play session.

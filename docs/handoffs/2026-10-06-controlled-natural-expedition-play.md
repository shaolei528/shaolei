# 2026-10-06 controlled natural expedition play

## Build and safety boundary

- Worktree: `fix/awakening-production-gate-qa-findings-v1` at `54d294abc13dd19ee53b56563fe43aaecc81b9ba`; the mixed-provenance dirty worktree was preserved.
- Entry: `http://127.0.0.1:8765/prototypes/successor-3-4/index.html?awDevQa=1&awArtPreview=1`.
- This is the guarded successor preview: the outer page says `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`; the embedded game says `LOCAL PREVIEW · RELAY BLOCKED`, uses memory-only save, and loaded 57/57 art-preview files. No production route, save, public Relay, deploy, commit, or push was changed.
- All player actions below used ordinary on-screen movement, E, Space, the actual workbench, and the in-game death/return flow. No QA teleport or fight shortcut was used.

## Verified natural-play slice

1. Reloaded into SafeCamp at full HP and resources `wood 0 / stone 0 / food 2 / shard 0`.
2. Walked to visible camp nodes and gathered with E. The resource prompt and target update as nearby nodes enter range. Reached `wood 6 / stone 3 / food 2`.
3. Opened the actual workbench with E and crafted the Bone Knife from its displayed `4 wood + 3 stone` recipe. The game showed `远征装备已准备好。和队友确认后再出发。`; inventory became `wood 2 / stone 0`, and the button changed to `标记准备`.
4. Marked ready and walked north with the normal joystick. At `(2299, 1906)` the game crossed out of the camp, changed the area label to `沼林岛`, and showed the temporary field ward message. HP was 100.
5. Closed to a crawler at reported distance 71 with the player facing north, pressed Space, and directly observed `古老的怪物倒下了。`, live mob count `3 → 2`, and shard count `0 → 1`. This verifies one ordinary player attack can damage and kill a mob and award salvage in the local preview.
6. Continued north with ordinary joystick movement. At `(2316, 1732)`, the nearest mob was 19, one windup was active, the game showed `有什么东西正在撕咬你。`, and HP had fallen to 72. Space was pressed, but the player died before another kill was confirmed. The death screen offered the normal `返回营地` action.
7. Returned to camp through that action. HP/sanity restored to 100; wood decreased from 2 to 1, food from 2 to 1, and the previously carried shard was lost. The SafeCamp message confirmed monsters cannot enter. This is local preview death-recovery evidence only.

## What this proves and what it does not

- **Proved:** SafeCamp gathering, recipe UI, one-click Bone Knife craft, ready state, normal movement across the camp boundary, one successful local melee kill and shard reward, one death and camp recovery.
- **Still unproved:** A stable combat encounter, reaching/searching MIRE MART, two-shard salvage, a complete return/growth loop, persistence across reloads, multiplayer synchronization, mobile/player-facing visual acceptance, and any public build/deployment.
- The repeated death is not enough to distinguish missed facing/range, multiple mobs, cooldown/windup timing, or the slower-than-human sequence of discrete UI drag actions. Do not change combat damage or enemy rules based only on this one encounter.

## Next work

1. Reproduce the next hostile windup with close state reads and establish whether the player was facing the attacker when Space was sent; capture enemy HP/kill feedback and player HP before and after each action.
2. If the combat rule is sound, make the facing/attack/windup cues clearer in the live scene and verify them in ordinary play. If the rule fails under a controlled facing-and-range case, make the narrow fix in the existing V21 combat path.
3. Repeat the route toward MIRE MART only after the encounter can be read and answered, then gather evidence for POI search, required salvage, and return.
4. Keep the guarded-preview/live-Relay distinction. Do not publish the mixed dirty worktree; the existing Cloudflare site package still has seven source drifts, no configured upstream, and no verified raw.githack URL.

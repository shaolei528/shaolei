# V21 workbench single-owner craft fix — 2026-10-06

## Snapshot

- Branch: `fix/awakening-production-gate-qa-findings-v1`
- HEAD: `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- Worktree: 120 modified/untracked entries at the snapshot check; mixed/unknown provenance. No unrelated cleanup, staging, commit, push, deploy or release.
- Preview: `http://127.0.0.1:8766/prototypes/successor-3-4/index.html?awDevQa=1&awArtPreview=1`

## Finding and repair

Ordinary guarded-preview play gathered the Bone Knife recipe (4 wood + 3 stone), walked to the SafeCamp workbench and clicked once. The materials were consumed once, but the final toast said the player already owned a Bone Knife. The active V21 boot loaded two recipe listeners: a legacy inline mutation in `modules/safe-camp/base-interactions.js`, then the canonical recipe transaction in `modules/crafting/crafting-processing-v1.js`. The legacy listener equipped the knife first, so the canonical handler saw an already-owned result and showed a false failure.

Removed only the legacy recipe click listener. The canonical Crafting & Processing and Inventory transaction remain the sole recipe path. Rebuilt `game-play.js` from its categorized source parts and added an integration regression that executes the V21 module order, asserts exactly one recipe listener, and checks one successful click causes one save and one success toast.

## Evidence

- Before: guarded browser click with 4 wood / 3 stone changed counts to 0 / 0 and ended with “你已经有骨刃”.
- After: reloaded browser page, moved with the normal joystick to the actual workbench, clicked the recipe with 0 / 0 materials, and got one “需要 4 木材 + 3 石头。” result; counts remained 0 / 0.
- `node tests/crafting-processing-v1.test.mjs` — PASS.
- `node tests/module-sort.test.mjs` — PASS; root reconstruction and existing Relay protocol assertions held.
- All 69 `tests/*.test.mjs` scripts — PASS serially.
- `git diff --check` — PASS; Git printed existing LF-to-CRLF warnings.
- The guarded preview blocks WebSocket and uses in-memory save storage. No persistent save, public Relay, deployment or share link was changed.

## Remaining acceptance

This verifies part of SafeCamp gathering/crafting only. The ordinary-input MIRE MART combat/salvage/return/HOME-growth loop, public two-client co-op, mobile, production manifest/art gate, public share route and deployment remain unverified. Do not describe the guarded preview as production or a complete expedition.

## Additional ordinary-input play evidence - 2026-10-06

- **Current playable local link:** `http://127.0.0.1:8765/prototypes/successor-3-4/index.html?awDevQa=1&awArtPreview=1`. After the previous 8766 server had stopped, restarted Python's standard static server on loopback port 8765 and confirmed HTTP 200 for both the page and `preview.js`; the script contains the throwing `PreviewSocketBlocked` guard. Reloaded the deliverable browser tab to a fresh SafeCamp start and confirmed `LOCAL PREVIEW · RELAY BLOCKED`, `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`, loaded candidate assets 57/57 and memory-save shim. The server runs as a local session; it is not a public/share URL.
- **Current release-source audit:** `wrangler.jsonc` points to `.cloudflare-site-365c3997727a`; its 59-entry manifest is internally present, but 7 non-transformed packaged JS files differ from current source (`weapon-presentation-v1.js`, `interaction-v12.js`, `platform-inventory-v19.js`, `awakening-art-assets-v1.js`, `base-renderer.js`, `base-interactions.js`, `successor-renderer.js`). Current branch has no upstream; `wrangler` and `gh` commands are unavailable. No current raw.githack URL was found in the repository. This dirty working tree was not pushed or deployed, and the existing package should not be treated as its release.
- Revalidated the retained local page without QA teleports. The tab reports `LOCAL PREVIEW · RELAY BLOCKED`, ping/jitter `--`, `0.0%` loss and a memory-save shim. The page is the guarded `prototypes/successor-3-4/index.html` preview, whose iframe policy is same-origin-only and whose WebSocket constructor throws. The unrelated packaged/local candidate Relay anomaly in the 2026-10-05 state remains a separate release-path risk; do not conflate the two entrypoints.
- Gathered wood ×4 and stone ×3 with ordinary joystick movement and E, opened the actual SafeCamp workbench and clicked 制作 once. **The post-fix browser result is now directly verified:** the HUD changed to wood 0 / stone 0, the game showed `远征装备已准备好。和队友确认后再出发。`, and the backpack later showed `† 骨刃 已装备 · 近战武器 · 当前生效`. This closes the prior handoff's gap where only an insufficient-material click had been checked in the browser.
- Marked the solo preview player ready and walked out through normal controls, crossing into Zone `1:0` / 黑沼. The first attempt reached HP 0 near position `(2271, 1333)` with 8 mobs nearby. The ordinary death-screen 返回营地 action restored HP to 100; after recovery the backpack still showed the Bone Knife, while food was 1 and wood/stone were 0. This confirms local recovery behavior only.
- A second daylight route attempt also entered Zone `1:0`; at `(2176, 1100)` the HUD showed HP 44, sanity 84, 8 mobs, nearest mob 37. A Space input was issued, but the next observed state was the death screen, so **no successful player hit or attack effect is verified**. Death-recovery behavior had already been checked on the first attempt; the second attempt was not respawned.
- These repeated ordinary-input deaths are consistent with the previously recorded route risk. They do **not** isolate a damage-balance defect: joystick automation releases between short drags and is slower than a continuous human hold, and Space arrived at critically low health. Inspect attack acceptance/heading and tune a controlled encounter before changing damage, grace duration or mob rules. Avoid repeating an unchanged full route as evidence.
- Visual captures still show coarse repeated terrain, small legacy actors/props and prominent developer diagnostics; the scene remains **REVISE**, not the requested polished art result. The session remains solo, local, guarded and memory-only; public Relay, durable save, co-op and production art/deployment are not proven.

## Exact continuation

- Retained browser tab 5 remains on the guarded preview; after recording the second death, the ordinary 返回营地 action was used to leave a healthy, safe-camp scene open for review. Current: HP 100, hunger 78, sanity 100, CAMP, wood/stone/food/shards all 0; backpack confirms the Bone Knife remains equipped. The page still reports Relay blocked and memory save. Do not use HOME/MIRE/LOOT/FIGHT QA controls as player evidence.
- Next useful step: isolate whether Space attacks are accepted and which way the player is facing during a controlled, short natural encounter, then verify an enemy HP/death or hit-feedback outcome before attempting the full MIRE route again. Preserve all mixed-provenance worktree edits and do not deploy this dirty snapshot.

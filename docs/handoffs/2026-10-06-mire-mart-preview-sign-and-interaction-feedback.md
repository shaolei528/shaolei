# MIRE MART preview sign and immediate interaction feedback — 2026-10-06

## Worktree and safety boundary

- Actual repository: `C:\Users\MECH\Documents\ChatGPT\游戏编程\abyssal-wake-integration`.
- Branch / HEAD rechecked after implementation: `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`.
- The shared worktree has 116 modified/untracked status entries with mixed and unknown provenance. Preserve concurrent changes. No cleanup, stage, commit, push, deploy or release was performed.
- Leads: Rendering & Camera for the isolated sign display; Interaction & Gathering for prompt refresh. Save, inventory, collision, POI and Relay ownership are unchanged.

## What changed

1. The successor 3/4 renderer can display the manifest-bound MIRE MART sign in explicit art-preview mode. It uses the candidate PNG's source rectangle, native 46×75 dimensions and bottom-center anchor, disables smoothing, and adds a small readable `MIRE MART` plaque. Production mode keeps the existing text fallback. No formal production manifest was created.
2. Resource collection now immediately recalculates the nearby interaction prompt after the harvested cooldown is installed and inventory/UI update. Guide dialog open/close refreshes the same prompt; the 200ms polling interval remains a fallback.
3. Two pre-existing source-pair mismatches were found by repository tests while running the full suite. The categorized `modules/input/interaction-v12.js` now matches its legacy root copy with the newer expedition guidance; `game-render.js` was reconstructed from its categorized renderer and scheduler parts so the root copy includes the categorized mob windup cue. These copies do not replace the active modular V21 boot order.

## Evidence

- Focused tests passed: successor art-sign, guarded preview/live-gate, QA harness, art mapping, `interaction-v12`, interaction retry/idempotency and module-sort.
- Full serial run: **68/68** `tests/*.test.mjs` scripts exited successfully. One script explicitly skipped a CLI child-process assertion because this Windows sandbox blocks child-process creation; the CI workflow remains responsible for that subprocess path.
- `node --check` passed for the successor renderer and Interaction V12; `git diff --check` passed.
- Guarded local browser view: `http://127.0.0.1:8766/prototypes/successor-3-4/index.html?awDevQa=1&awArtPreview=1`, game viewport 1100×589 in a 1280×720 browser viewport. MIRE MART teleported test view displays the pixel sign/plaque and the badge says 57/57 candidate art files loaded. This is evidence of the candidate rendered inside the game, not proof of approved art or a playable/public build. Browser tab is preserved as a deliverable.
- A delegated ordinary-input check in the guarded preview verified campfire rest, chest rewards and gathering wood/stone while the page displayed `Relay blocked` and memory-only storage. The real local save was reported unchanged. Knife craft, normal departure, actual MIRE MART combat/salvage, return and Field Rig upgrade were **not** completed.

## Remaining acceptance

- Overall art stays **REVISE**: repeated old terrain, sparse roadside dressing, simplified MIRE MART walls and props remain. Only one isolated preview sign was added; no generated/external art was promoted.
- Normal-input interaction prompt refresh after collection passed source/VM regression but has not yet been re-observed in the browser after the edit.
- 390×844 presentation, sustained touch/mobile, full ordinary-input solo route, two-client Cloudflare Relay, public raw.githack link, formal production manifest, package and deployment remain **UNKNOWN / NOT VERIFIED**.
- Next high-value step: use controlled held input in the guarded local preview to verify movement → craft → MIRE MART combat and both shards → return → Field Rig, then address the store/terrain art families in the real 3/4 composition. Do not infer co-op or persistence from the guarded preview.

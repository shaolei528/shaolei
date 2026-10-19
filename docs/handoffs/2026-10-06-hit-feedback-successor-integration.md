# 2026-10-06 hit feedback in the 3/4 successor

## Current snapshot and preview boundary

- Worktree: `fix/awakening-production-gate-qa-findings-v1`, HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba` at the last branch/HEAD check. The worktree contains extensive mixed-provenance edits and untracked content; preserve all of it.
- Player-facing guarded preview: `http://127.0.0.1:8765/prototypes/successor-3-4/index.html?awDevQa=1&awArtPreview=1&awQaControls=0&awGroundStudy=pass7`.
- Browser capture showed the V21-backed SafeCamp/shore scene in the successor camera, no QA button panel, and a loaded candidate ground study. The outer page labels itself `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`; the embedded runtime says `LOCAL PREVIEW · RELAY BLOCKED`, uses memory-only saves, and reports 57/57 art-preview files. This URL is local to this computer.

## One-owner implementation slice

- Lead owner: **Animation & Presentation**. Integration seam: the existing confirmed-hit records produced by `modules/combat/hit-feedback.js` are consumed by the successor's `drawCombatImpacts()` in `prototypes/successor-3-4/successor-renderer.js`.
- Confirmed-hit sparks and impact pulses now have longer lifetimes (390 ms ordinary, 480–520 ms lethal); confirmed damage records also carry a bounded floating number. The 3/4 renderer draws and retires those numbers. Existing damage/range/cooldown and multiplayer message behavior remain untouched.
- Runtime files: `modules/combat/hit-feedback.js`, `prototypes/successor-3-4/successor-renderer.js`. Regression files: `tests/combat-hit-feedback.test.mjs`, `tests/successor-combat-rendering-v1.test.mjs`; the existing local-preview gate assertion in `tests/successor-preview-live-gate-v1.test.mjs` was updated to match the repository-root asset loader already present in this dirty worktree.
- Rollback boundary: revert only the new `FX.labels`/duration changes and their successor draw block plus matching assertions. Do not revert entire dirty files or change the V21 attack rules.

## Evidence

- **PASS:** `node tests/combat-hit-feedback.test.mjs`
- **PASS:** `node tests/successor-combat-rendering-v1.test.mjs`
- **PASS:** `node tests/successor-preview-live-gate-v1.test.mjs`
- **PASS:** `node tests/successor-natural-route-v1.test.mjs` (deterministic source/VM route only)
- **PASS:** `node --check modules/combat/hit-feedback.js`, `node --check prototypes/successor-3-4/successor-renderer.js`, `node --check tests/successor-combat-rendering-v1.test.mjs`, and scoped `git diff --check`.
- An initial `node --test` attempt failed with Windows `spawn EPERM`; direct `node <test-file>` runs were used instead.
- The browser was refreshed after the renderer change and its 3/4 scene loaded. **No screenshot of a successful combat event with the new floating number was captured.** A developer FIGHT QA teleport landed inside a dense mob group and the player died before attack feedback could be observed; that attempt is explicitly not counted as player-route evidence.

## Release-path audit (read-only current snapshot)

- Root `index.html` selects `prototypes/successor-3-4/live-candidate.html`; a repository-recorded raw.githack URL and the remote served version were not found.
- `wrangler.jsonc` targets the existing Cloudflare Worker/`GameWorld` contract; client and Worker source retain the configured Relay channel and protocol. Public Worker health and two-client behavior were not tested.
- The configured Cloudflare package contains 59 manifest entries, but **8 packaged JS files drift from current source**, including `hit-feedback.js` and `successor-renderer.js`. No branch upstream, `gh` command or Wrangler CLI is available locally. No push/deployment was performed. Older state notes saying seven drifting files are stale and have been corrected in the project state section.

## Remaining acceptance and next step

- Use ordinary movement to approach a single enemy with the equipped Bone Knife, keep the facing aligned, land one hit, and capture the number/impact in the active 3/4 browser view. Confirm one local damage result and no duplicate reward. Do not use teleport/fight QA controls as proof of natural gameplay.
- Then repeat a stable encounter before proceeding to MIRE MART search, salvage, return and HOME growth. Death-recovery alone does not prove that loop.
- Re-audit current Cloudflare/raw.githack files and two-client Relay using the actual production route before any sharing claim. No push or deployment was made by this slice.

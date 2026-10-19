# 3/4 successor QA shortcut gating — 2026-10-05

## Result

The 3/4 player candidate and ordinary local preview now do not create the developer QA shortcut navigation. A developer can opt in to the panel by opening the isolated preview with `?awDevQa=1`. The configured Cloudflare package was also confirmed stale and the content-addressed build was verified locally; no upload or deployment occurred.

## Evidence

- `prototypes/successor-3-4/live-candidate.js` sets `AW_DEV_QA=false` before loading the renderer.
- `prototypes/successor-3-4/preview.js` defaults QA false and sets it true only for the explicit `?awDevQa=1` preview query.
- `successor-renderer.js` creates and appends the QA navigation only inside `if(window.AW_DEV_QA===true)`.
- `wrangler.jsonc` previously pointed at `.cloudflare-site-78157c1f1fe6`, which still contained the old hidden navigation. The safe content-addressed builder prepared `.cloudflare-site-290a9dee0538` and updated the config pointer without deleting old packages.
- The configured package contains 56 files (0.34 MiB); all 56 manifest hashes pass and the packaged successor-renderer SHA-256 matches source.
- Passed `node tests/successor-camera-adapter-v1.test.mjs`, `node tests/successor-live-candidate-v1.test.mjs`, and `node tests/successor-preview-live-gate-v1.test.mjs`.
- Passed `node cloudflare/test.mjs`.
- `git diff --check` on the changed renderer, preview and focused test passed.

## Scope and boundary

- Lead: Rendering & Camera. Partner: Integration & QA.
- Interface: the early `AW_DEV_QA` presentation flag. The renderer owns the QA panel presentation; UI controls do not gain gameplay-state authority.
- Files: `prototypes/successor-3-4/successor-renderer.js`, `prototypes/successor-3-4/preview.js`, `tests/successor-camera-adapter-v1.test.mjs`, and this handoff/project-state record.
- No save, game-state, gameplay authority, Relay, network protocol, art asset, merge, deployment or deletion changed.

## Remaining unknowns

The supplied screenshot's NEAREST / WORKBENCH / HOLD controls match a family documented in the 2026-10-04 guarded-preview handoffs, making an old or separate developer preview the most likely source. Its FOOD / 20-second labels do not match the current source or those records, so the exact page/build origin remains unknown. The verified local package is not proof that every captured panel was removed. Fresh browser/device visual verification remains pending; do not report screenshot acceptance. Cloudflare configuration points to the local package, which remains undeployed.

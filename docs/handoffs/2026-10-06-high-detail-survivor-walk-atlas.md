# High-detail survivor atlas preview — 2026-10-06

## Scope and safety

- Repository: `abyssal-wake-integration`; branch `fix/awakening-production-gate-qa-findings-v1`; HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba` at inspection.
- Existing worktree contains mixed-provenance edits and untracked files. This work was restricted to an isolated art candidate, guarded 3/4 preview wiring and status documentation. No cleanup, staging, commit, push, package build, public deploy or production-art manifest edit occurred.
- User-designated generated survivor image is the visual identity reference. The new atlas was produced with built-in image_gen and is a separate review candidate.

## Evidence

- New candidate: `assets/art-candidates/modern-survivor-spritesheet-review-2026-10-06/modern-survivor-generated-walk-atlas-6frame-DRAFT.png`; 1536×1024 RGBA; 6 columns × 4 rows of 256×256; direction rows front/right/back/left; SHA-256 `05dfd208a5066e58aa099981a913caed8146c6a0b04617986f63ef1b54e5c5ca`.
- Cell gap samples are alpha 0. About 6.04% of the canvas has alpha 1–8; review the subtle alpha fringe. Character design features match the reference; generated pixels are detailed and textured but not fully hard-edge hand-authored pixel art.
- Guarded route uses `awPlayerWalkAtlas=1`; renderer maps its own front/left/right/back to atlas rows 0/3/1/2, enables image smoothing only for this candidate, and uses a local per-cell foot anchor. Browser preview loaded 1536×1024, displayed the character near its projected camp ground point, and accepted a joystick drag with orientation change.
- Browser view was 960×615. The outer page states `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`; in-game badge states `LOCAL PREVIEW · RELAY BLOCKED`; storage is memory-only. No live co-op, 1080p, mobile, production manifest or formal visual acceptance is established.
- `node --check` passed for `preview.js` and `successor-renderer.js`; candidate metadata JSON parsed; `git diff --check` passed (pre-existing LF/CRLF warnings elsewhere). No test suite added or run.

## Next step

Review and refine alpha fringe, exact ground baselines, frame continuity and weapon/tool overlays at game scale. Keep this isolated candidate gated until the full 4-direction cycle and environmental art harmony are accepted. Continue the larger RPG sandbox, combat, online and release goals independently; this art preview does not satisfy them.

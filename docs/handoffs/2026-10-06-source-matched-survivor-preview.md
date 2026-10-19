# Source-matched survivor in the 3/4 preview - 2026-10-06

## Ownership and scope

- **Lead:** Rendering & Camera (`prototypes/successor-3-4/successor-renderer.js`). **Partners:** Asset Pipeline for the existing source crop/anchor metadata; Integration & QA for the preview and package contract.
- **Branch / HEAD:** `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba` at verification. The worktree was already broadly dirty with mixed-provenance changes; no broad cleanup or attribution was attempted.
- No V21 production manifest, gameplay/save authority, collision, Relay contract, or backend was changed.

## Changes and evidence

- Reviewed the 1536×1024 generated walk sheet at original size and checked its alpha bounds per cell. Profile poses cross the 256px cell edges, so the image is rejected for live runtime and was removed from the fixed Cloudflare package allowlist. The failed source remains an isolated review asset with a clear README verdict.
- The live 3/4 renderer uses the separate lossless pose crops from the exact selected 1254×1254 character concept, using existing per-pose foot anchors and smooth sampling. Drawing scale is `.78` desktop / `.62` narrow viewport (about 120 CSS pixels high on desktop). The front portrait is also applied to the HUD avatar.
- Player name is placed above the enlarged silhouette. The guarded review adds `awCharacterDossier=0`, which hides the oversized dossier card while leaving the high-detail avatar visible.
- Browser route: `http://127.0.0.1:8876/prototypes/successor-3-4/index.html?awDevQa=1&awArtPreview=1&awQaControls=0&awGroundStudy=pass7&awPlayerCandidate=1&awCharacterPortrait=1&awCharacterDossier=0`.
- **VERIFIED browser:** 1037×660 guarded preview loaded `playerCandidate:768x1280` and `characterPortrait:150x298`; actual drawn survivor is clearly larger and the name no longer crosses its chest. The screen still contains legacy props/terrain and foreground trees that obscure parts of the player, so the overall art gate is **REVISE**.
- **VERIFIED local package:** `.cloudflare-site-08a7338144e8`, 63 allowlisted files / 3.98 MiB; contains the portrait, anchored atlas and frame JSON; rejected generated atlas absent.
- **PASS checks:** `node --check` on preview/renderer/live candidate/package builder; `tests/cloudflare-site-entry-redirect-v1.test.mjs`; `tests/successor-live-candidate-v1.test.mjs`; `tests/successor-preview-live-gate-v1.test.mjs`; camera, movement and lighting regressions; `cloudflare/test.mjs`; scoped `git diff --check`.

## Still incomplete

- Source concept poses are crisp and identity-matched but are not a hand-authored production walk cycle. Sustained movement, direction transitions with held tools, 1280×720 / 390×844, and depth sorting around trees remain unaccepted.
- The guarded page blocks Relay and uses memory-only storage. No public Cloudflare deployment, GitHub push, raw.githack URL check, two-client session, full RPG sandbox loop, or production promotion occurred.
- Current changes remain uncommitted in a mixed-provenance checkout with no upstream on the active branch. Keep all unrelated files untouched.

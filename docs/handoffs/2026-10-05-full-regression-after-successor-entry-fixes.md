# Full regression after successor entry and input fixes - 2026-10-05

## Owner and scope

- **Lead:** Integration & QA. **Partners:** Input & Accessibility, Movement & Locomotion, Rendering & Camera, Core State & Save, Network & Co-op, Combat & Weapons, Audio & Feel and Content & Localization.
- **Purpose:** check whether the recent packaged-root redirect and desktop touch-pad visibility fix coexist with the rest of the current working tree.
- **Files:** all current `tests/*.test.mjs` fixtures. No production source, test, art, save, manifest or network contract was changed during this regression sweep.
- **Repository snapshot:** branch `fix/awakening-production-gate-qa-findings-v1`; HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`. The worktree is broadly modified/untracked with mixed/unknown provenance; preserve unrelated state.

## Result

- **VERIFIED:** 58 tests run one at a time; **58 passed, 0 failed**. This includes the Cloudflare packaged-root test, platform-mode visibility, V21 movement, module byte parity, V5 save migration, expedition/HOME, combat, Relay lifecycle/quality, audio, art-pipeline and localization fixtures.
- The focused screenshot evidence still applies only to the local guarded 1280×720 preview. The full fixture suite does **not** prove 390×844 phone rendering, physical-device input/audio, a public Cloudflare deployment, art production readiness, or full human gameplay acceptance.
- The production Awakening manifest and Cloudflare deployment access remain separate blockers; green tests do not change those statuses.

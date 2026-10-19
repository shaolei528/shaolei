# Handoff — Items & Inventory module contract V2

Date: 2026-10-05 (Asia/Rangoon)
Status: documentation-only; no inventory runtime, save, network, UI, art or tests changed.

## Verified source observations

- Rechecked branch `fix/awakening-production-gate-qa-findings-v1` and HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`. The shared worktree contains mixed/untracked changes; do not attribute them to this update.
- V21 declares the global inventory and V4/V5 save read/write paths in `modules/core/runtime-state.js`. The later SafeCamp patch normalizes current resource counts to 0–999 and equipment to booleans.
- `modules/input/platform-inventory-v19.js` builds an inventory snapshot/signature and renders the bag panel from the global object; it is primarily a UI reader, not the unique mutation service.
- Source search shows direct writes across gathering/chest (`interaction-v12.js`), loot receipt (`inbound-events.js`), crafting/meal (`base-interactions.js`), death loss (`lifecycle.js`) and workbench upgrade (`home-workbench-upgrade-v1.js`). `ux-cn-v11.js` chest and `safe-camp/game-v7-patch.js:newUse` gathering code also write inventory but listen on old `#useBtn`; later `interaction-v12.js` replaces that button in the current boot sequence. Their live reachability is **UNKNOWN / NEEDS DYNAMIC VERIFICATION**, so they are source-level candidates, not confirmed active player paths. Re-scan the full loader and active wrappers before claiming a complete write inventory.
- Current tests include `platform-inventory-v19.test.mjs`, `player-save-v5-migration.test.mjs`, and `awakening-home-workbench-upgrade-v1.test.mjs`; these cover particular display/save/upgrade seams, not proof that all writes flow through one service.

## Change

- Added `content-inbox/2026-10-05-items-inventory-module-card-v2.md`, preserving V1 and routing the canonical index/crosswalk to V2.
- V2 maps all five references, distinguishes current V21 mixed writers from the successor's Inventory-only transaction goal, documents save/UI boundaries, adds idempotent atomic transaction and adjacent regression gates, and requires real high-detail-pixel bag/item checks at 1280×720 and 390×844.
- No inventory API, item, capacity rule, save migration, Relay field, art asset or runtime code was added.

## Validation and limits

- Reviewed the current V21 loader, runtime-state, inventory panel, SafeCamp normalization, visible write paths, module map, reference routing and relevant tests. Independent read-only review flagged the two old-button write paths; both are now explicitly marked as reachability-unknown.
- Run canonical routing, platform inventory, V5 migration and HOME workbench tests before future implementation; perform a full write-site/load-order audit then.
- A clean VM fixture cannot establish complete V21 authority separation, real save compatibility, live two-client inventory consistency or actual mobile visual quality. These remain **PLANNED / UNKNOWN / NOT ACCEPTED**.

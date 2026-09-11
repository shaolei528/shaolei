# Legacy and Compatibility Code Register

Classification means only what current evidence proves. `DEAD` is used narrowly: not a working V21 route under the documented Relay configuration. It does **not** automatically authorize deletion.

| Area | Classification | Evidence | Why it remains | Deletion risk / required validation |
|---|---|---|---|---|
| Supabase mechanics in `modules/network/network-v9.js` | `COMPATIBILITY`; Supabase fallback is `DEAD` for configured V21 Relay boot | V21 loads it, then loads `network-relay-v16.js`; V21 installs a nonconnecting shim when `RELAY_URL` exists | Relay adapter still references `ABYSSAL_NET_V9` lifecycle state | High. Prove Relay-only boot, reconnect, UI diagnostics, and all V21 network tests without it before removal. |
| `game-core.js`, `game-play.js`, `game-render.js` | `COMPATIBILITY` | V21 does not load them; `tests/module-sort.test.mjs` rebuilds and compares them | Regression contract / compatibility aggregates | High. Replace or intentionally retire the reconstruction contract first. |
| `modules/core/game-core.js`, `modules/combat/game-play.js`, `modules/render/game-render.js` | `LEGACY candidate` | V21 explicitly asserts it does not load these paths; this pass found no active-V21 reference | Historical split/aggregate transition artifacts | Medium. Search old page and external usage, then load V21 and historical pages chosen for support before deciding. |
| Root V9/V16 helper copies such as `network-v9.js`, `network-relay-v16.js`, `gameplay-v9.js`, `render-v9.js` | `COMPATIBILITY` / `LEGACY candidate` | V21 loads `modules/...` paths; module-sort test byte-compares several root/module pairs | Test contract and older page support may depend on root copies | Medium/high. Preserve byte-pair tests or migrate old entrypoints in a dedicated branch. |
| `boot-v8.js`, `boot-v9.js`, `survival-v3.html` through `survival-v17c.html`, `index-v7-direct-backup.html`, `index.html`, `world-v2.html` | `LEGACY` | They are alternate historical boot/HTML entrypoints, not V21's active page | Historical recovery and possible manual/external access | High. Inventory hosting routes and external links before archival or removal. |
| `backups/**` | `LEGACY snapshot` | Named snapshots of terrain, module-sort, art, and combat work | Manual recovery evidence | Low for moving after archive verification; never bulk-delete without confirming Git history and user recovery needs. |
| `node_modules/` in the local worktree | `GENERATED / LOCAL` | Untracked on audit start | Local dependency installation, not repository source | Do not commit or delete as part of a code cleanup pass. |
| `.wrangler-dist/` or similar dry-run output, if created locally | `GENERATED / LOCAL` | Produced by Worker dry-run tooling, not V21 source | Build/dry-run artifact | Confirm ignore rules; do not commit. |

## Cleanup candidates

These are proposals only. None was changed in this branch.

1. **`chore/document-relay-only-runtime`** — make the Relay-only V21 requirement explicit next to the compatibility adapter. Evidence: V21's shim makes the supposed Supabase fallback nonfunctional. Risk: comments/docs can drift unless paired with a narrow boot test.
2. **`fix/retire-v21-supabase-fallback`** — remove or isolate dead fallback behavior only after Relay boot, reconnect, real A/B multiplayer, and compatibility decisions are verified. Risk: high; `network-relay-v16.js` currently calls legacy lifecycle code.
3. **`chore/archive-historical-entrypoints`** — move old V3–V17 pages and boot files into a documented archive after checking host routes and bookmarks. Risk: high if any deployment still exposes them.
4. **`chore/define-aggregate-generation`** — declare one mechanical owner for the three root aggregate compatibility files, or retire the byte-reconstruction test in a separate approved change. Risk: medium; a manual edit can desynchronize active split modules and aggregates.
5. **`chore/archive-snapshots-policy`** — inventory `backups/**`, define which snapshots Git already preserves, and move only confirmed redundant snapshots to an archive. Risk: medium; backups are explicitly useful recovery points.

## Do not treat as cleanup candidates in this pass

- The frozen `fix/pvp-input-hardening` branch and `feat/monster-attack-telegraph` branch are not files in this branch and must not be altered here.
- CRLF/LF module-sort failures are a separate baseline/tooling issue, not permission to rewrite files during hygiene mapping.

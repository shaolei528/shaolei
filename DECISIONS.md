# Project Decisions

## Runtime and multiplayer

- `survival-v21.html` is the active V21 boot authority. A file existing in the repository does not make it active.
- Cloudflare WebSocket Relay (`abyssal-relay-v1`) is the formal V21 multiplayer route when `RELAY_URL` is configured.
- Supabase is legacy/dead for V21: the boot does not load an SDK/shim and Relay failure does not trigger a Supabase fallback. Do not automatically restore or design new gameplay around it.
- Client input is not automatically trusted. Damage, movement, world state, and leader behavior require an explicit authority decision before they become security boundaries.

## Development shape

- `feat/module-sort` is complete. Do not repeat a repository-wide split/reorganization without a separately approved structural reason.
- New systems are added incrementally: complete a small subsystem, test it, preserve a stable point, then integrate the next one.
- Long-term separation is: stable core state, gameplay systems, and content data. Existing browser-global modules are mapped before changing ownership or APIs.
- A non-core system must have a clear relationship to core combat, survival, multiplayer, or SafeCamp before it is added.
- The product is a modern post-apocalyptic cosmic-horror co-op survival sandbox: Adventure, Home & Life, Survival, and Progression are its four pillars. Detailed target design belongs in `GAME_DESIGN.md`; it does not imply those systems are current runtime features.
- A future persistent world is a logical co-op instance with shared world progression and individual World Survivor progression. World owner/access is not combat or world authority. The current public Relay DO is not that future system.

## Branch and release discipline

- Work belongs on a scoped `feat/*` or `fix/*` branch. Do not directly edit `main`.
- Do not merge or deploy without explicit approval.
- A committed but unmerged branch is a preserved experiment, not part of the production baseline.
- The PvP hardening branch and Monster Telegraph branch are frozen unless explicitly resumed.

## Compatibility discipline

- Preserve save compatibility unless a separately approved migration states defaults and rollback behavior.
- Preserve event names, payload shapes, relay protocol, and synchronization frequency unless a dedicated compatibility review approves the change.
- Legacy code is not automatically disposable. The evidence and validation required to retire it belong in `LEGACY_CODE.md`.

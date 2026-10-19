# Cloudflare 3/4 static release preparation — 2026-10-05

## User direction

The user selected the 3/4 camera as the public game direction and said the old 2D V17 player version is no longer wanted. They authorized a public Cloudflare deployment. Workspace cleanup and external publication are still treated separately: this handoff makes no deletion and no deployment.

## Owner and contract

- **Lead:** Integration & QA (release packaging and acceptance evidence).
- **Partners:** Rendering & Camera (candidate entry and presentation), Asset Pipeline (public file allowlist), Network & Co-op (preserve `/health`, `/ws`, and `abyssal-relay-v1`).
- **Interfaces:** `/` serves the 3/4 entry; `/health` and `/ws` are routed to the existing Worker first. The game still loads its V21 runtime modules and uses the existing public Relay URL.
- **Files changed:** `.gitignore`, `package.json`, `wrangler.jsonc`, `cloudflare/README.md`, and the new `cloudflare/build-site.mjs`. The builder creates an ignored, content-addressed `.cloudflare-site-<hash>` folder. Source runtime files, Relay implementation, message contract, saves and original art were not edited by this release-preparation task.
- **Boundary:** the package contains an explicit list of 56 files (3/4 page, V21 source/runtime, and five existing gameplay images). It omits V17 entry pages, tests, docs, and art-intake directories. The packaged `survival-v21.html` redirects top-level navigation to the 3/4 candidate, while the embedded candidate may still fetch it as its runtime source. Local historical files remain present.

## Verification

- `node --check cloudflare/build-site.mjs` — PASS.
- `npm run build:site` — PASS twice against the same content fingerprint; 56 files, about 0.34 MiB.
- Inventory audit — PASS: no missing listed files, V17 entry pages, tests, docs, or art-intake files; the staged V21 page has exactly one top-level 3/4 redirect guard.
- `git diff --check` for release config/package/docs — PASS.
- Cloudflare's current Workers Static Assets documentation supports deploying assets beside a Worker; static assets are served from the configured directory while `/health` and `/ws` are set to run through the Worker first. See [Static Assets](https://developers.cloudflare.com/workers/static-assets/) and [configuration and bindings](https://developers.cloudflare.com/workers/static-assets/binding/).
- During the first packaging attempt, the untracked successor renderer changed after the first snapshot. The builder stopped instead of overwriting it. That original ignored staging folder remains untouched; the final configuration points at a new content-addressed build made from the current source. This confirms another shared-worktree edit occurred during this task; its ownership remains UNKNOWN.

## Release status

- **NOT DEPLOYED:** Wrangler is absent. `npm install --ignore-scripts --no-package-lock` failed because npm is restricted to its empty cache (`ENOTCACHED`); a network retry produced no response for over a minute and was stopped. No Cloudflare credentials were detected in the available environment variables. There is no new public URL from this work.
- **NOT PRODUCTION-READY:** previous desktop and mobile browser captures show repeated terrain banding and small HUD/actor presentation (**REVISE**). A same-day handoff also records the local successor SafeCamp Guide actor as missing. Real mobile-device input, audio, the full HOME → POI → return/growth loop, movement/combat synchronization, and sustained two-client stability remain unverified. Earlier two-client presence did work, but the observed connection quality was unstable.
- The current live-candidate route still uses the existing browser-local save behavior and Relay; it does not provide authoritative persistent world saves.
- No game source, existing user data, old 2D file or art candidate was deleted. No Worker protocol, Durable Object migration, or public service was changed.

## Next gate

First complete a candidate-quality pass for the SafeCamp Guide, terrain repetition, readable mobile HUD, and a real HOME-to-POI-to-HOME loop, then repeat desktop/mobile and two-client evidence on the exact packaged build. After that, Wrangler can publish the already-authorized 3/4 entry once Cloudflare login is available. Workspace V17 cleanup still needs a separate risk review because deleting it removes the local rollback path and some V21/shared modules may be referenced by both versions.

## Current package refresh - 2026-10-05 follow-up

- After subsequent shared-worktree edits, `npm run build:site` prepared the current allowlisted package at `.cloudflare-site-a34f255aeaa6`; `wrangler.jsonc` points to it. The package has 56 files and is about 0.34 MiB. Older content-addressed packages remain present.
- **VERIFIED current package:** every packaged file matches its manifest SHA-256; `/`, top-level V21, and top-level V7 routing point toward the 3/4 candidate; the V7 gate remains available when V21 fetches it as a UI template; the candidate entry is present; no V17-named entry is packaged. Local V17 source files were not removed.
- `node cloudflare/test.mjs` passes for the existing Relay protocol. `git diff --check -- wrangler.jsonc cloudflare/build-site.mjs` passes.
- **NOT DEPLOYED / BLOCKED BY ENVIRONMENT:** Wrangler CLI is absent (`node_modules/.bin/wrangler.cmd` not present); the usual Wrangler credential file is absent; no Cloudflare environment variables or deployment connector are available. No new public URL or live deployment evidence exists. The package's complete hashes and routes do not prove a live page or art acceptance.

## Root entry legacy-copy fix - 2026-10-05

- **Lead:** Integration & QA (release routing). **Partners:** Rendering & Camera and UI & Map (3/4 destination). Interface: packaged `/` entry redirects to `./prototypes/successor-3-4/live-candidate.html`; the destination retains the V21 runtime/save/Relay owners.
- **CONFIRMED package mismatch:** source `index.html` still contains V17f landing copy and relies on a zero-second meta refresh. Its browser route did reach the successor, but that response still exposed legacy branding and could present the old landing content while navigating. The user's accepted public product direction is 3/4.
- **VERIFIED bounded repair:** `cloudflare/build-site.mjs` now emits a minimal Chinese 3/4 redirect shell for packaged `index.html` only. The original dirty `index.html` source was not edited or removed. A new focused regression checks the packaged route, fallback link, destination presence and absence of V17 landing copy.
- **VERIFIED checks:** builder syntax, new `cloudflare-site-entry-redirect-v1` regression, Worker Relay protocol test, candidate owner/isolation fixture, V21 loader retry fixture, two consecutive release builds, scoped whitespace check, and actual local package-root browser navigation all pass. The browser ended at the Chinese 3/4 candidate's V21 menu; no Play action was sent, no Relay client joined, and no browser save was written by this route check.
- Build output: `.cloudflare-site-748fa2630467`, 56 files (~0.34 MiB); earlier content-addressed package directories were left in place. This is still **NOT DEPLOYED**; Cloudflare credentials/CLI/connector are absent. Production-art and phone-size visuals remain unaccepted.

## Current configured-package and access recheck — 2026-10-06

- Current Wrangler configuration points to `.cloudflare-site-289496248407` (59 files). Rechecked manifest SHA-256 for all 59 packaged files and direct source hashes for all 56 untransformed files: **0 integrity/source drift**. The three entry files are intentionally transformed by the guarded builder; packaged root and V21 redirect were inspected and route top-level players to the 3/4 candidate.
- Wrangler is still absent from PATH; Cloudflare API environment credentials are absent; no Cloudflare dashboard session is open in available browser tabs. No login, upload, Worker deployment or Durable Object mutation was attempted.
- Visual acceptance remains **REVISE**, so package integrity is release-preparation evidence only. Existing package directories were preserved.

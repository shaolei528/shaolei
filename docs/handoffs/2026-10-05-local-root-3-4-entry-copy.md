# Local root entry copy aligned with 3/4 — 2026-10-05

## Scope

- **Lead:** Integration & QA (route); **partner:** UI & Map (entry presentation).
- **Interface:** local `/` continues to redirect to `prototypes/successor-3-4/live-candidate.html`.
- **File:** `index.html` only. This file was already modified in the shared worktree to redirect to the 3/4 entry; its existing user/parallel changes are preserved.
- Removed the V17f description and old player-sheet hero from the brief pre-redirect fallback. Updated title, 3/4 description, button label and redirect note. No gameplay systems, assets, save data, Relay configuration, other source files or public deployment changed.

## Verification

- A focused local-source assertion confirms the V17f copy and old hero element are absent, and the redirect plus 3/4 button remain.
- `node tests/cloudflare-site-entry-redirect-v1.test.mjs` — PASS.
- `node tests/successor-live-candidate-v1.test.mjs` — PASS.
- `node tests/successor-camera-adapter-v1.test.mjs` — PASS.
- Browser recheck: security approval first timed out; one retry ended with `ERR_BLOCKED_BY_CLIENT`. No alternate route or proxy was used. The updated local-root screenshot remains **UNKNOWN**.

## Current gate

The public release package was not rebuilt or deployed for this local-copy-only change; its package builder emits a separate minimal 3/4 redirect entry. Wrangler deployment, production-art acceptance, physical-phone review and the full successor gameplay loop remain open.

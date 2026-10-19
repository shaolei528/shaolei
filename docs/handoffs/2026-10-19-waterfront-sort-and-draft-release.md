# 2026-10-19 Handoff: Waterfront Sort and Draft Release

## Current snapshot

- Branch: `feat/unified-graybox-slice-v1`
- Unified graybox commit: `938bc7712895826c6b5b7e5fe495ff99395d9699`
- Latest pushed fix: `d9d73dde73b1ab54e96ed61ee0d75013e2ebe354`
- Draft PR: https://github.com/shaolei528/shaolei/pull/4
- Latest candidate URL returned HTTP 200: https://raw.githack.com/shaolei528/shaolei/d9d73dde73b1ab54e96ed61ee0d75013e2ebe354/prototypes/successor-3-4/live-candidate.html. This confirms the static file is retrievable only.

## Change made after the unified slice commit

The rendered camp pond uses a widened dry bank that matches its collision padding. The renderer's actor depth-sort anchor omitted that padding, so the foreground bank could be drawn behind a player standing at the south/east edge. The water rendering module now calculates the anchor from the water body's full padded bounds, and the successor renderer consumes that shared value. Collision authority and save/Relay formats are unchanged.

## Evidence and limits

- `successor-fishing-rendering-v1.test.mjs` passes for a padded shoreline anchor and renderer integration.
- `node --check` passes for the edited renderer files; `git diff --check` has no whitespace errors.
- `npm run build:site` produces 100 static files; current Wrangler dry-run recognizes `env.WORLD`.
- Current browser appearance, ordinary-input full loop, sustained two-client Relay, and Cloudflare deployment remain unverified.
- Wrangler is currently unauthenticated. The existing Relay health request did not reach an HTTP response from this environment. Do not call the dry-run a deployment.

## Next steps

1. Recheck the shared browser at the pond shoreline and play the ordinary-input loop when visual browser inspection is available.
2. Keep PR #4 a draft until player-facing acceptance. The public `main` still points at V17f.
3. Deploy the Worker only after a permanent Cloudflare account is authenticated; current static preview availability is not a Cloudflare deployment.

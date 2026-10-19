# 2026-10-19 Handoff: Waterfront Sort and Merged Graybox Release

## Current snapshot

- PR [#4](https://github.com/shaolei528/shaolei/pull/4) is merged to `main` at `f61903bd8733f6629c49bf38d874ea77f0b236ab`.
- Development link: https://raw.githack.com/shaolei528/shaolei/main/prototypes/successor-3-4/live-candidate.html
- Stable pinned link: https://rawcdn.githack.com/shaolei528/shaolei/f61903bd8733f6629c49bf38d874ea77f0b236ab/prototypes/successor-3-4/live-candidate.html
- Both links returned HTTP 200 in the release check. That proves the static entry is retrievable, not that the game has been played or accepted.

## Change made after the unified slice commit

The rendered camp pond uses a widened dry bank that matches its collision padding. The renderer's actor depth-sort anchor omitted that padding, so the foreground bank could be drawn behind a player standing at the south/east edge. The water rendering module now calculates the anchor from the water body's full padded bounds, and the successor renderer consumes that shared value. Collision authority and save/Relay formats are unchanged.

## Evidence and limits

- The shoreline sort regression, JS syntax checks, `git diff --check`, and site package build passed before merge; all 13 GitHub Actions checks passed on the PR head.
- CI on the merged PR confirmed the existing Relay `/health` endpoint and two-client relay/reconnect flow. This did not deploy a new Worker or verify the complete game loop.
- Wrangler is unauthenticated in this environment; no new Cloudflare deployment occurred. The dry-run is not a deployment.
- Manual gameplay remains UNKNOWN. The 8876 QA browser page reports connection refused. Access to inspect the separate 8883 tab is denied by a saved browser permission, so no workaround was attempted.

## Next steps

1. Restore an approved local preview and verify with ordinary keyboard input that gathering, crafting, combat, rewards, and return-to-camp form one understandable loop.
2. Get Cloudflare Wrangler authenticated to the permanent account, deploy the built Worker/site, then verify `/health` and two-client movement/reconnect.
3. Treat game feel and the five inspiration loops as unfinished until player-facing checks pass; the merged code and CI do not establish fun.

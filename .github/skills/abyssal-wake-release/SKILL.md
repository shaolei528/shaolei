---
name: abyssal-wake-release
description: Diagnose the local preview, build and deploy the ABYSSAL WAKE Cloudflare game, and verify the public Worker and two-client Relay without confusing these states.
---

# ABYSSAL WAKE release and recovery

Read [`docs/RELEASE_RUNBOOK.md`](../../../docs/RELEASE_RUNBOOK.md) first.

## Required state distinctions

- `localhost` is a local Node process. If there is no listener, restart `tools/serve-aw-local-preview.mjs`; do not infer a production outage.
- `raw.githack.com` serves GitHub source. A successful static response does not prove the Worker deployed.
- Cloudflare deployment is complete only after the production GitHub Actions workflow reports deployment success and its `/health` smoke check passes.
- Relay is verified only after the workflow's two-client reconnect test passes. None of these checks proves a player completed the gameplay loop.

## Repair sequence

1. Check `git status`, current branch, root `index.html`, and the exact URL the player opened. Preserve unknown worktree changes.
2. For local refusal, check listener state on port 8884 and run the documented local server command once. If the helper reports an occupied port, inspect that process instead of launching another copy.
3. For release, inspect the latest `Deploy production` run. It should run the entry-contract test, `npm run check:worker`, Cloudflare deploy, `/health` and root asset checks, then `npm run test:live-relay`.
4. If production secrets are missing, report the required secret names from the runbook. Never request or print their values in chat, logs, or source files.
5. Keep the release state `UNKNOWN` until each matching check has fresh passing evidence. Do not call build output, dry-run, PR merge, or HTTP static retrieval a deployment.

## External references

- [GitHub deployment environments](https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments)
- [Cloudflare Wrangler GitHub Action](https://github.com/cloudflare/wrangler-action)
- [GitHub setup-node and lockfile guidance](https://github.com/actions/setup-node)

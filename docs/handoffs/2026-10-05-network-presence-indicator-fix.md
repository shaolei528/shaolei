# Presence HUD false-online fix - 2026-10-05

## Finding

The isolated successor preview explicitly displayed `LOCAL PREVIEW · RELAY BLOCKED`, yet its online HUD said `在线 1`. The preview flag represented one local test actor, not one Relay participant. The value was fabricated by a forced minimum in V16; a 160 ms localization refresh then overwrote the local preview label. Separately, disconnecting did not consistently discard the last global-presence snapshot, so old members could remain visible as online.

## Change

- `modules/network/network-relay-v16.js` and its root compatibility copy now derive the label from actual connection state. Preview displays `本地 1`; a newly connected Relay displays `同步中` until a fresh presence snapshot arrives, then displays the exact synced set size including zero; offline/disconnected/reconnecting states never display stale members as online.
- Disconnect, browser-offline, and subscription-timeout paths clear the global presence snapshot. A fresh snapshot repopulates it after reconnect.
- `modules/ui/ux-cn-v11.js` and its root copy no longer force a fabricated minimum or periodically overwrite the label.
- The offline/reconnect VM test now checks local preview, unconnected, exact live count (including a fresh empty snapshot as `在线 0`), offline clearing, syncing-before-fresh-snapshot, and count restoration after a new snapshot. `module-sort.test.mjs` guards label ownership and module-copy parity.

## Verification

- PASS: `network-relay-v16-offline-online-reconnect.test.mjs`
- PASS: `network-relay-v16-reconnect.test.mjs`
- PASS: `network-relay-v16-subscribe-ack-hang.test.mjs`
- PASS: `network-relay-v16-subscribe-ack-timeout.test.mjs`
- PASS: `module-sort.test.mjs`
- PASS: all 61 `tests/*.test.mjs`, each in a separate sequential Node process
- PASS: `git diff --check`
- PASS: local guarded preview at 1100×589 visibly says `本地 1` and `LOCAL PREVIEW · RELAY BLOCKED`; memory-only save shim active. No controls were clicked.

## Limits and repository state

Physical mobile, public Relay, and live co-op behavior remain untested. The full suite is repository-level regression evidence, not proof that every runtime scenario is bug-free. Branch `fix/awakening-production-gate-qa-findings-v1`, HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`. The shared worktree already contained extensive mixed-provenance modifications; all were preserved. No commit, push, merge, deployment, save change, protocol change, or gameplay change was made.

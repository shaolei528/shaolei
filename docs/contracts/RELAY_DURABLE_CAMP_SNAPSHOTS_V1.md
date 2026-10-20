# Relay Durable HOME Snapshots V1

Status: additive Durable Object checkpoint for the existing `camp_world_v1` relay event.

## Ownership

- Farming & Food remains the owner of crop and livestock state and validation.
- HOME & Building remains the owner of structure state and placement rules.
- Network & Co-op transports and checkpoints the latest owner-authored snapshot. It does not own domain schemas, grant inventory, arbitrate harvest transactions, or decide gameplay outcomes.
- The existing V5 browser save remains per player. This contract adds one shared snapshot per domain and zone to the existing public Durable Object world.

## Write rules

The Worker accepts durable checkpoints only for `farm`, `livestock`, and `building` snapshots when all of these match:

- The event uses the existing `camp_world_v1` name and a valid zone channel.
- Payload zone and domain match the channel and the versioned state shape.
- The payload identity matches the Worker's authenticated socket attachment.
- The sender is the lowest sorted session ID among currently tracked players in that zone, matching the existing client leader election.
- The serialized payload is at most 40 KiB. Farm snapshots contain at most 64 plants, livestock at most 48 animals, and building snapshots at most 72 structures.
- Replayed sequence numbers from the same sender epoch do not overwrite a newer checkpoint.

The relay still forwards the existing event to connected peers. A storage failure reports `WORLD_SNAPSHOT_SAVE_FAILED` to the sender and does not stop live peer delivery.

## Restore rules

When a player first tracks a zone, or the current leader leaves, the Worker sends stored snapshots to the newly elected zone leader using the existing `camp_world_v1` event with the reserved `abyssal-relay` sender identity. Client-side domain validation and V5 save writes still apply. The leader then republishes its validated owner snapshot through the existing event so active peers converge.

## Scope limits

- This persists HOME crops, livestock, and placed structures across an empty room and Durable Object restart.
- It does not persist harvested field nodes, enemy HP/death, player inventories, rewards, or transactional ownership. Those require their own domain contracts and idempotency rules.
- The current deployment has one public world identity, not private room save isolation.
- Local tests and CI do not deploy this Worker. Deployment and a real reload-after-all-players-leave check remain separate acceptance gates.

## Verification

- `cloudflare/test.mjs` verifies leader-only writes, rejection of a follower overwrite, reserved relay identity, and restoration of all three snapshots after a new `GameWorld` instance is created with the same durable storage.
- `tests/camp-world-sync-v1.test.mjs` verifies that only the elected zone leader applies a Worker replay and republishes it through the domain owner.

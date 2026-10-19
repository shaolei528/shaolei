# Fishing & Catch Log — local playable slice

**State: IMPLEMENTED IN SOURCE / LOGIC TESTED / PLAYER AND CO-OP ACCEPTANCE UNKNOWN**

## Owns

- Data-defined camp water, legal cast reach, cast timing, bite window, missed-bite result, weighted fish selection, and the local discovery log.
- The versioned owner snapshot `fishing.v1` inside the existing V5 save record.

## Does not own

- Inventory counts or item grants. `modules/items/inventory-transactions-v1.js` commits fish items.
- Player food or sanity effects. Those belong to Survival & Needs and are not implemented for raw fish yet.
- Camera, water collision, multiplayer authority, or Relay protocol.

## Current runtime

- Data: `data/fishing/fish-v1.json` defines one safe-camp pond, three weighted fish, wait timing, and the bite window.
- State and actions: `modules/fishing/fishing-v1.js` exports `getTarget`, `castFishingLine`, `reelIn`, and `interact`.
- Presentation: `modules/render/fishing-render-v1.js` paints the small graybox pond; `successor-renderer.js` reads it as a scene layer.
- Input: the shared E/互动 action casts, waits, and reels during the bite window.

## Gates still open

- Ordinary-input play from the single public candidate entry.
- Real-time feel of the bite window at desktop and phone sizes.
- Save/reload in the browser and co-op synchronization through the existing Relay channel.
- Cooking and nutrition for caught fish.

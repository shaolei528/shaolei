# Successor touch pad desktop visibility fix - 2026-10-05

## Owner and scope

- **Lead:** Input & Accessibility (device mode and control availability). **Partners:** Rendering & Camera (successor pad presentation), Integration & QA.
- **Interface:** existing `abyssal-desktop-v19` / `abyssal-touch-v19` root classes published by the V21 platform adapter. No new input API was introduced.
- **Files:** `modules/input/platform-inventory-v19.js`, its byte-identical compatibility copy `platform-inventory-v19.js`, and focused regression `tests/successor-touch-controls-platform-visibility-v1.test.mjs`. The static package builder then produced a new content-addressed build.
- **Boundary:** one CSS visibility rule only. Pointer input, normalized directions, movement speed, collision, gameplay state, save and Relay behavior are unchanged. V17 pages remain local rollback sources and remain excluded from the public package.

## Finding and repair

- **CONFIRMED UX bug:** the 3/4 renderer hid the original V21 joystick, but always inserted a new `.successor-pad`. The platform adapter hid `.joystick` and `.actions` in desktop mode, not `.successor-pad`. The prior 1280×720 rendered scene visibly showed this extra touch joystick.
- **VERIFIED minimal repair:** the existing desktop-mode CSS now hides `.successor-pad` along with the other touch controls. The exact matching root compatibility copy was synchronized to preserve the repository's byte-identical source contract. Touch-mode class and pointer handlers were retained.
- One first `module-sort` run failed because the two source copies no longer matched after the module-only edit; the compatibility copy was synced and the test then passed.

## Verification

- `tests/successor-touch-controls-platform-visibility-v1.test.mjs` — PASS.
- `tests/platform-inventory-v19.test.mjs` — PASS; platform/keyboard/touch fixture behaviors pass.
- `tests/successor-live-screen-movement-v1.test.mjs` — PASS; eight projected directions unchanged.
- `tests/module-sort.test.mjs` — PASS; root/module bytes match and load order/save/protocol contracts unchanged.
- `tests/cloudflare-site-entry-redirect-v1.test.mjs` — PASS; current package root still routes to the 3/4 entry.
- `npm run build:site` — PASS; current package `.cloudflare-site-66543ace9bad`, 56 files, ~0.34 MiB.
- **VERIFIED in browser:** local guarded preview at 1280×720 reports an 1100×618 game viewport. After the CSS change the custom touch pad is absent while keyboard instructions remain. It visibly reports `LOCAL PREVIEW · RELAY BLOCKED` and a memory save shim; no live Relay or persistent save was used.
- **UNKNOWN:** physical phone / actual 390×844 rendering, public Cloudflare delivery, combat feel and overall art quality. The overall scene remains **REVISE** for repetitive terrain and low-detail/small actors.

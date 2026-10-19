# Scene placement preview V1

Base: unified playtest candidate `97143f80869b071060b5b1a62a8086c901d00775`.

**Retired:** the standalone `awakening-scene-preview.html` page has been removed so it cannot be mistaken for another game. This contract remains as historical geometry guidance. Use the single root `index.html` route for player-facing checks; use focused tests for geometry until a named art task is selected.

## Verified observations

- G preview: 50/50 PNG files loaded; store and road views render without browser exceptions.
- Default mode: absent production manifest returns `manifest-404` and draws fallback. No production manifest was created.
- Native PNGs do not cover several authored obstacle footprints. Previously accepting a PNG suppressed the whole fallback object, making parts of collidable walls/furniture invisible.
- Preview mode now draws the existing obstacle representation before the unscaled PNG. Production/default bound rendering remains unchanged. Collision, entrance, loot, saves and network are unchanged.
- Gold outlines show authoritative collision; cyan crosses show prop bottom-center anchors. These are diagnostic overlays only in this separate page.

## Placement evidence, not automatic redraw orders

| Binding | Selected G native PNG | Existing placement footprint |
|---|---:|---:|
| prop.wall | 80×60 | north 640×16; side 16×448 |
| prop.fence | 84×37 | west 16×176; east 16×160 |
| prop.counter | 73×40 | 160×48 |
| prop.shelf | 53×45 | 128×32 |
| prop.fridge | 27×48 | 112×48 |
| prop.sign | 46×75 | 128×32 |

A footprint is not a mandatory sprite size. Production decisions require visible obstacle coverage, orientation and final-scale art review. Do not stretch these images to fit, infer collision from alpha, or declare this preview production-ready. Modular wall/fence composition or purpose-authored orientation variants may be needed in a later explicitly scoped pass.

D's current seven blocker assets remain defined by `PRODUCTION_BLOCKER_REDRAW_SPEC_V1.md`; this evidence does not silently expand that assignment. Finish the current blockers before issuing a separate structural-prop art/composition task. Unsupported grime/entrance/bollard bindings remain disallowed.

## Regression

`tests/awakening-scene-placement-preview-v1.test.mjs` exercises actual world hooks with a successful art adapter: each prop draws once, preview obstacle underlays remain visible, production bindings receive no underlay, geometry is identical and the store doorway remains open. Existing world, art mapping, strict production gate, expedition and HOME upgrade tests also pass locally.


# Handoff — North-road candidate scene review

Date: 2026-10-05 (Asia/Rangoon)
Repository: `shaolei528/shaolei`
Branch / HEAD: `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`

## Verified in the local preview

- Opened `awakening-scene-preview.html?awArtPreview=1`; the page reports `57/57` images loaded and identifies itself as a development preview, not production. Its own notice says terrain, debris, and FX may still use fallback.
- Selected the `北路` scene and hid collision/anchor guides. At the captured 960×768 scene canvas, the ground motifs repeat visibly; the road/shoulder composition forms broad block-shaped bands, and debris/fence images look sparse relative to the large scene areas. This is a visual review of the existing V21 orthographic placement page, not the approved successor 3/4 camera or the full playable loop.
- The page's placement table reports candidate-vs-placement mismatches for several MIRE MART objects (for example shelf 53×45 vs 128×32, wall 80×60 vs 640×16, sign 46×75 vs 128×32, fridge 27×48 vs 112×48). Its own notice says collision rectangles are not image scale targets. These figures identify a need for an explicit art/world placement contract; they do not alone prove incorrect scaling.

## Verdict and boundaries

- North-road composition: **REVISE / NOT PRODUCTION** for visible repetition and incomplete visual coverage at this preview scale.
- Formal production art remains unverified; this preview does not establish production manifest readiness, actual successor 3/4 rendering, mobile readability, or a full playable scene.
- Do not classify this as a confirmed gameplay bug. Rendering & Camera should own projection/placement; Asset Pipeline and Art should jointly check source dimensions, anchors, density, and scene coverage.
- No code, manifests, source art, gameplay, save, or network files were changed for this review. Existing dirty/untracked work remains of unknown provenance and must be preserved.

## Recommended next step

Have the existing visual-unification owner inspect this evidence and decide the appropriate placement/scale contract. Then capture the same candidate scene in the successor 3/4 preview at desktop and 390×844 mobile sizes, with source-to-runtime crispness and repetition assessed. Keep all candidates preview-only until those gates pass.

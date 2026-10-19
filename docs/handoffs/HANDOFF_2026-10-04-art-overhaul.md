# ABYSSAL WAKE — 全游戏美术替换接班记录

**日期：** 2026-10-04（Asia/Rangoon）  
**仓库：** `abyssal-wake-integration`  
**分支 / HEAD：** `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`  
**工作区：** 已有多项 modified 与 untracked，保持原样；不要清理、重置或把来源不明的改动归到本任务。

## 用户明确目标

全游戏画质和统一风格是首要任务；背景、人物等低画质资源最终都要系统性替换。以概念图建立独立原创的现代沿海 HOME → 危险 OUTSIDE 视觉语言，遵守原生尺寸和像素清晰度门槛。长期 Goal 仍 active。

## 已核实的运行时事实

- V21 启动顺序由 `survival-v21.html` 定义，载入 `runtime-state.js`、`base-renderer.js`、`terrain-v21.js`、`render-v9.js` 等模块。
- 基础地面先由 24×24 程序色块绘制；SafeCamp 的 `terrain-v21.js` 随后叠加 64×64、24×20 的固定 tile 地图。`assets/art-v21/terrain-v21.png` 是精确 320×256、5×4 图集。视觉 tile ID 与独立碰撞图分离。
- 玩家、怪物、营地道具、资源分别使用 `assets/player_sheet.png`、`assets/monster_sheet.png`、`assets/camp_props.png`、`assets/resource_sheet.png` 的格子图集；部分缺图回退为程序矩形。
- 地图 canvas 是程序 3×3 色块；HUD 是独立 HTML/CSS。Awakening 57 张预览与生产 manifest 隔离。
- 当前运行相机还未证实已实现概念图中的 3/4 斜俯视；这是全套人物/建筑资产比例的重要验收依赖。

## 本轮产物与限制

- 新增 `docs/content-inbox/2026-10-04-whole-game-art-replacement-plan-v1.md`：运行时资产清单、去留原则、分批顺序和验收条件。
- 新增 `docs/content-inbox/2026-10-04-whole-game-terrain-atlas-study.png`：生成器试片，1402×1122，地表细节过密，不能对齐 320×256 固定 atlas。标记 **REVISE / NOT FOR GAME**。不得缩小后接入。
- 新增隔离目录 `assets/awakening-v1/intake/whole-game-art-candidate-v1/` 和绘制脚本 `tools/awakening-art-lab/create-safe-camp-atlas-preview.mjs`。原生像素坐标生成的图集为 320×256 / 5×4 / cell 64×64，机械规格通过；目视仍为 **REVISE**（材质偏平、草簇重复可见），未接入运行时。目录 README 明确标注 DEV ART PREVIEW。
- 用户询问可否替换既有图集后，已按范围加上仅显式 `?awTerrainArtPreview=1` 才选择候选图集的开关；默认仍使用旧图。离线 `terrain-v21-preview.html` 显示 DEV ART PREVIEW 警告，未进入 Relay。`node tests/terrain-v21.test.mjs` 通过。没有生产资源替换，也没有真实浏览器/移动端截图，因此候选尚不能升格。
- 当前已有 loopback 静态服务在 `127.0.0.1:8765`；检查页面、renderer JS、候选 PNG 都返回 200。可从 `http://127.0.0.1:8765/terrain-v21-preview.html?awTerrainArtPreview=1` 打开静态 SafeCamp 预览。HTTP 结果不等于浏览器实景验收。
- 随后对原尺寸图块增加沙土颗粒、路面磨损和水面高光，并调整岸线石子使其停留在陆地侧。复查 PNG/构建器/地形回归均通过；图集 3×3 目视仍显示草簇重复，因此继续标记 **REVISE**。
- 试片只说明生成器本轮没有输出精确规格图，不是首批美术替换完成。游戏实际画面、手机/桌面表现尚未验证。
- 未改运行时图像、正式/预览 manifest、玩法、地图、碰撞、存档、网络、测试；无提交、推送、合并或部署。

## 下一项最值得做的工作

继续 **Rendering & Art**：为 SafeCamp 原地表 tile 合同制作原生 64×64 图块，而不是把大图重采样成 atlas。与旧图集并列比较，通过接缝、1×可读性和实际渲染门槛后再接入预览。随后按共享像素比例完成玩家/NPC、怪物、营地道具和资源，再逐区替换程序背景。若浏览器截图持续不可用，先记录候选并明确 `UNKNOWN / BLOCKED`，不能假装实际验收已完成。

参考：[`../content-inbox/2026-10-04-whole-game-art-replacement-plan-v1.md`](../content-inbox/2026-10-04-whole-game-art-replacement-plan-v1.md)


## Continuation note - 2026-10-04

- Added the isolated player sprite candidate and its review card. Mechanical contract checks passed; it remains a draft pending true scene-scale review. No runtime player sheet, manifest, gameplay, save or network behavior changed.
- Rechecked the canvas scaling source: desktop non-uniform stretching remains a verified issue and is the recommended implementation prerequisite for judging new art. The user has not selected that separate runtime task.
- Tried the available browser surface for the local offline preview; no browser was available. Loopback HTTP returned 200, which proves serving only, not rendered quality.

## Art preview access update - 2026-10-04

- **VERIFIED / BLOCKED:** computer-use rejected access to the existing browser tab because its current URL protocol was disallowed and explicitly prohibited attempts to reach the same preview through other browser surfaces or lower-level automation. No workaround was attempted. The candidate remains visually unaccepted at runtime size; only local PNG inspection and source/test review are available in this session.
- The player review card now marks the runtime visual check BLOCKED / UNKNOWN. No production art, manifest, gameplay, save or network path changed.

## SafeCamp offline map art review - 2026-10-04

- **VERIFIED offline composition:** a new review tool evaluates the actual 24x20 V21 terrain IDs and assembles the candidate and current 320x256 atlas at native 64x64 scale. The 10x9 cell center crop shows actual map placement; the full image is 1536x1280. Tile-use counts include 146 grass_a, 128 grass_b and 25 grass_flowers cells.
- **VERIFIED visual finding:** old grass appears denser but noisy; candidate grass is cleaner but strongly repeats within the 64x64 grid. A deterministic quarter-turn-only-on-grass experiment adds some variation but does not remove the repeating motif. Candidate remains REVISE / NOT PRODUCTION.
- **VERIFIED checks:** offline compositor syntax passes and node tests/terrain-v21.test.mjs passes. It reads existing renderer tile IDs and separate collision remains untouched. This image is a direct PNG composition, not a browser or live-game screenshot.
- Evidence and output files are listed in assets/awakening-v1/intake/whole-game-art-candidate-v1/README.md. No runtime renderer, manifest, gameplay, save, collision or network code changed.

## Character module and multi-frame FX regression — 2026-10-04

- Added `docs/content-inbox/2026-10-04-character-progression-module-card-v1.md` as a draft for an independent Character & Progression owner. It distinguishes the current survival/profile fields from unimplemented XP/level progression and sets high-detail pixel-art acceptance rules. No character art or feature was added.
- Reproduced a `TypeError: Assignment to constant variable` in `drawFx()` for a valid multi-frame FX manifest entry. The renderer now uses a derived per-frame entry; `tests/awakening-art-assets-multiframe-fx-v1.test.mjs` covers frame advance and wrap.
- Passed the new regression, existing `tests/awakening-art-mapping-v1.test.mjs`, and JavaScript syntax checks. Current preview manifest has no multi-frame FX entries; live browser animation remains unverified.
- Only the art FX renderer line was changed for the bug fix; SafeCamp atlas scripts, images, manifests and shared runtime contracts were left untouched.

## SafeCamp grass atlas iteration - 2026-10-04

- Redrew the isolated 64x64 grass tiles toward the user's coastal-camp reference palette and detail density. Candidate now reads greener and has compact blade clusters, but repetitions remain visible across the actual map composition.
- **Status: REVISE / DEV ART PREVIEW / NOT PRODUCTION.** Image evidence is an offline composition, not browser-rendered gameplay. Desktop/mobile runtime acceptance is UNKNOWN.
- Candidate and outputs: `assets/awakening-v1/intake/whole-game-art-candidate-v1/README.md`. No formal atlas, manifest, gameplay, collision, save, network, deploy or release changes were made.

## Runtime asset inventory check - 2026-10-04

- Verified current boot loader and corrected the art-target map: `game-render.js` is not loaded; the active V21 path is `base-renderer.js` + `game-v7-patch.js` + `render-v9.js`, then terrain/Awakening/presentation wrappers.
- Recorded exact PNG sheet dimensions/cell contracts and per-family missing-art fallbacks in the whole-game art replacement draft. Main finding: terrain atlas replacement only affects the authored SafeCamp slice; other regions and landmarks still use procedural primitives. Camp props silently disappear if the sheet fails, while monster/resource fallbacks are squares.
- Visually inspected the five active source sheets. Their small cell contracts and sparse visible clusters support phased replacement, but player/mobile screen readability is still UNKNOWN without in-game screenshots.
- No runtime file, production asset, manifest, gameplay, collision, save or network code changed in this audit.

## SafeCamp props draft - 2026-10-04

- Added isolated 8-prop sprite sheet candidate at native 48x48 cell contract and a nearest-neighbor review enlargement. Order matches the current Camp prop index usage.
- The source sheet looks clearer and more coherent at native asset size; placement and game-scale readability are still unverified. Status remains **DRAFT / REVISE / NOT PRODUCTION**.
- The old `assets/camp_props.png`, runtime draw calls, interaction anchors and collision remain unchanged. See the candidate README for paths and scope.

## SafeCamp prop map-scale review - 2026-10-04

- Composed old and draft camp props over the candidate terrain using V21 tile-map crop and `drawCamp` placements/scales, with the existing idle player for size reference. The crop was expanded to 16x16 terrain cells so camp-edge items are not cut off.
- The sheet-level silhouettes remain clear, but the map-scale review found the draft tent/workbench too small and icon-like, with flatter shading than needed. Status stays **REVISE / NOT PRODUCTION**; refine these silhouettes/material clusters before preview wiring.
- The composition is offline and omits the live renderer/canvas scaling behavior. No runtime or production art changed.

## User clarification - generated art vs actual game - 2026-10-04

- User asked whether generated images are used and whether the in-game quality changed. Verified current defaults: terrain remains `assets/art-v21/terrain-v21.png`; player, monsters, props and resources remain the old sheets. Candidate grass only appears through an explicit development preview query; candidate camp props are not wired. The generated four-swatch image is only a style reference.
- Answer clearly: no whole-game or default production quality change has occurred. Existing candidates are not accepted high-detail game art yet (grass repetition; camp tent/workbench map-scale REVISE). Do not imply otherwise.

## SafeCamp props draft refinement - 2026-10-04

- Revised only the isolated tent and workbench drawings in `tools/awakening-art-lab/create-safe-camp-props-preview.mjs`; regenerated the 192x96 candidate atlas and offline A/B composition. Dimensions, slot order and native 48x48 cell contract are unchanged.
- The composition makes their silhouettes larger and more readable, but is still a static offline approximation. It does not establish production quality or runtime appearance. Keep **REVISE / DEV ART PREVIEW / NOT PRODUCTION**.
- `node --check` passed for both preview builders. `git diff --check` has only the already-present line-ending warning on `assets/awakening-v1/manifest.preview.json`. No runtime, gameplay, manifest, production image or network behavior changed; default game visuals remain unchanged.

## 3/4 camera prototype source review - 2026-10-04

- Verified the isolated prototype uses a 2:1 oblique transform for ground and movement, but its person and building shapes remain screen-aligned rectangles. Treat it as composition/movement blockout, not a final-art or full depth-sorting validation.
- Actual mobile/desktop prototype screenshots and pixel clarity remain UNKNOWN. The standalone prototype's DPR sizing does not fix or verify V21's different canvas scaling path.
- Recommended next engineering task remains the draft V21 canvas aspect-ratio repair in `docs/content-inbox/2026-10-04-desktop-canvas-scale-fix.md`; it requires user selection before runtime edits. Review: `docs/content-inbox/2026-10-04-camera-prototype-source-review.md`.
- No runtime, test, manifest, production asset or gameplay file changed during this source review.

## Weekly HOME → POI → return loop review - 2026-10-04

- Re-ran six relevant scripts sequentially on the current working copy; all passed: `awakening-world-v1.test.mjs`, `awakening-world-logic-hardening-v1.test.mjs`, `awakening-expedition-loop-v1.test.mjs`, `awakening-home-workbench-upgrade-v1.test.mjs`, `interaction-v12.test.mjs`, and `module-sort.test.mjs`.
- These local tests cover the logical MIRE MART expedition and HOME Field Rig payoff. Browser/mobile feel, Relay, two-client authority, and shared persistent world behavior remain UNKNOWN.
- The day's original content candidate already exists (`docs/content-inbox/2026-10-04-draft-tide-resonator-module-item-v1.md`, DRAFT / NOT IMPLEMENTED), so no duplicate was created. Personal schedule state is not queryable from the current tools.
- No code/tests/assets changed in this QA pass; the pre-existing dirty worktree was preserved.

## Browser terrain-preview capture - 2026-10-04

- Opened the static terrain route in the supported Edge UI: `terrain-v21-preview.html?awTerrainArtPreview=1`. It renders the candidate sheet with its DEV ART PREVIEW / NOT PRODUCTION badge and explicitly does not connect to multiplayer.
- At displayed map scale, repeated grass motifs create obvious tile bands/grid patches. The candidate remains REVISE / NOT PRODUCTION.
- This is a terrain-only preview page, not the active game screenshot. Player/NPC, props, HUD, movement, phone layout, production defaults, and complete HOME-to-POI scenes remain UNKNOWN. Browser access is verified only for this route.

## SafeCamp grass draft experiment - 2026-10-04

- A trial multiscale-noise/cluster pass created obvious repeating bush-shaped motifs in the offline map. It was reverted; the prior candidate atlas was regenerated, and the browser terrain preview again shows that prior state with its visible repeated tile bands.
- This failed experiment is not a visual improvement. The fixed 64x64 atlas cells are reused per map tile; offline quarter-turns add variety but do not fully remove repetition. A stronger per-cell visual variation would require a separately selected art-only renderer task and must leave map IDs/collision unchanged.
- Only an isolated generator was briefly tested then restored; no runtime/gameplay/manifest/production art changed. Syntax and offline compositor commands completed successfully; no tests were run for this draft-only iteration.

## SafeCamp grass visual-variation task proposal - 2026-10-04

- Read-only source review confirmed V21 repeats the selected atlas cell unchanged by map coordinate; collision is independent. An offline quarter-turn study exists, but is not integrated and does not fully remove repetition.
- Added `docs/content-inbox/2026-10-04-safecamp-grass-visual-variation-task.md` for a separately selectable Rendering & Art task. Scope is stable visual rotation of grass cells only; no collision/map/save/network change.
- Recommended sequence: select and resolve desktop canvas proportions first, then implement and evaluate this visual variation at real desktop/mobile display sizes. Until selected, no runtime or test edits.

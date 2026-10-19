# DRAFT — ABYSSAL WAKE 全游戏美术替换计划 V1

**状态：** DRAFT / ART REPLACEMENT IN PROGRESS / NOT PRODUCTION. 用户已明确将全游戏画质与风格统一列为主任务。以下按当前 V21 源码盘点；本文件不是美术验收，也不代表已经替换运行时资源。

**主责模块：** Rendering & Art  
**配合模块：** World & Terrain、Home & Building、Combat & Creatures、UI & Input、Integration & QA

## 目标规范

- 以用户提供的 2026-10-04 概念图为构图和气氛参考：现代沿海安全营地、3/4 斜俯视、清晰角色比例；室外逐步转冷并显露克苏鲁式异常。只借鉴方向，不复制图中的界面、角色、地图或具体画面。
- 统一为 Modern High-Detail Pixel Art：原生最终像素尺寸、硬边像素簇、少量受控高光、清楚的脚点和物件底边、最近邻绘制。细节必须在 1×游戏尺寸下可读；禁止用缩小高分辨率生成图来凑尺寸。
- HOME 用暖沙土、旧木、苔绿和局部暖灯；OUTSIDE 再逐区降低色温与饱和度。异常色用于少量可定位线索，不能一开始铺满全屏。
- 美术只负责显示。地图、碰撞、伤害、交互、AI、掉落、联网和存档权威留在现有数据与代码中。

## 当前实际使用的画面资源

| 画面 | V21 运行路径与现状 | 替换方向 |
|---|---|---|
| SafeCamp 与未覆盖地带的底地面 | `survival-v21.html` 载入 `modules/core/runtime-state.js`、`modules/render/base-renderer.js`、`terrain-v21.js`、`modules/render/render-v9.js`。`base-renderer.js` 先以 24×24 `fillRect` 程序色块铺底；`terrain-v21.js` 再把 320×256、5×4 的 `assets/art-v21/terrain-v21.png` 图集画到 SafeCamp 的 64×64 网格上。因此 SafeCamp 中心并非只有一张新图，而是图集覆盖在旧色块之上。 | 先替换并对照 20 个既有 tile 的 SafeCamp 地面家族；随后消除/遮蔽重复程序底色，但保持 tile ID、地图格和独立碰撞图不变。相邻草地、土路、沙滩和水岸一起验收。 |
| 其他世界区块背景 | 同一个 `base-renderer.js` 的 24×24 程序色块和稀疏小矩形；9 个 biome 只是不同底色，没有一套完整区域地表贴图。 | 按 DROWNED WOOD、BLACK FEN、SALT RUINS、MARSH、SHORE 等现有区域主题制作完整地表族与边界转换，保留旧色块作为加载失败 fallback。不要一次给所有区块套同一张草纹。 |
| 玩家、NPC 外观 | 运行时从 `assets/player_sheet.png` 读 24×32 cell；四方向 × 四帧的旧图集由 `drawPlayer` 与 `drawGuide` 使用。名字、状态轮廓仍由运行时代码绘制。 | 按角色统一身高、头身比、朝向、脚点、轮廓和明暗；先验证实际摄像机投影，再锁定新图集合同。不要把概念图人物直接切图。 |
| 怪物 | `assets/monster_sheet.png`，每帧 32×32；三类怪物 × 四帧，缺图时绘制矩形 fallback。 | 统一轮廓清晰度、帧节奏和色彩阶段；战斗预警/命中状态继续由 gameplay/presentation 逻辑提供，不烘焙进静态贴图。 |
| 营地物件、地标 | `assets/camp_props.png` 按 48×48 cell 取图；场景坐标、缩放和绘制顺序由 `drawCamp` 与 `render-v9.js` 控制。 | 先做 SafeCamp 建筑/围挡/灯具同一套材料语言和底边接地阴影；美术不表达碰撞边界。大型建筑尺寸合同需逐项核实后再画。 |
| 资源、掉落 | `assets/resource_sheet.png` 按 32×32 cell 绘制木、石、食物、碎片；缺图时出现小矩形。 | 与地面共享光照、阴影方向和簇像素密度；图标需要在地面上不遮住人物脚点。 |
| Awakening/MIRE MART | `modules/render/awakening-art-assets-v1.js` 仅显式读取开发预览清单；七张候选在 `manifest.preview.json`，生产 `manifest.json` 不存在。 | 现有候选逐项重新套用全局规范评审；保留预览隔离，不把 57/57 加载作为风格或 production 通过。 |
| HUD、地图与图标 | 主要由 HTML/CSS 和独立地图 canvas 绘制；`game-v7-patch.js` 的地图仍是 3×3 色块。 | 放到世界地面、角色比例稳定之后统一边框、字重、图标和移动端信息层级；当前不改联网或 UI 功能。 |
| 光照、特效、命中提示 | 渲染模块里有程序渐层/色罩、粒子和圆环，不全是可替换图片。 | 把光照、粒子、攻击提示分别盘点；视觉素材不获得伤害或网络状态权威。减少全屏滤镜，避免暗部吞掉道路和角色。 |

## 分批实施与验收

1. **地面垂直切片：** SafeCamp 草地、土路、沙滩/水岸 + 同屏玩家和一个营地物件。保持现有 64×64、20 格位置与碰撞数据。对照原图与游戏 1×、nearest-neighbor 放大、3×3/6×6 平铺。
2. **共享角色族：** 玩家/NPC 及四方向行走帧，紧接着一组怪物；核对脚点、移动帧、攻击/受击可读性和远程玩家显示。
3. **HOME 道具与资源：** 建筑、营地 props、资源和地图地标；统一接触阴影、轮廓和像素密度。
4. **OUTSIDE 区域包：** 逐个区域完成主地表、边缘转换、道路/水域、地标和异常提示。以 HOME → POI → 返回的实际路线复查色温渐变。
5. **UI/FX 与性能：** 最后统一图标、地图、HUD、天气/灯光/异常 FX；检查小屏遮挡、动效读数和画面干扰。

每批通过条件：原生文件尺寸和 alpha 合同正确；无缩放补尺寸；1×轮廓可读；邻格接缝与重复频率可接受；nearest-neighbor 清晰；390×844 与 1280×720 游戏实际画面都能辨认道路、角色和交互物；fallback 清楚；相关玩法/碰撞/联网/存档未受影响。任何一项未能实际观察时标 **UNKNOWN / BLOCKED**，不得标为完成。

## 本轮生成试片记录

- 文件：[`2026-10-04-whole-game-terrain-atlas-study.png`](2026-10-04-whole-game-terrain-atlas-study.png)。
- **VERIFIED：** 输出为 1402×1122；现有地形图集为 320×256。生成器未遵从最终尺寸要求，不能通过缩放接入。
- 视觉观察：颜色方向可用于讨论，但地表小簇过密、颗粒噪点过多；岸线内容压到格界附近。其用途仅限方向讨论，标记 **REVISE / NOT FOR GAME / NOT PRODUCTION**。
- 本轮没有更换任何运行时图片，没有改 manifest、渲染、玩法、碰撞、测试、存档或联网代码。PC/手机运行画面仍 **UNKNOWN**；Edge 阻止本地预览的已知问题见项目状态。

## 原尺寸手绘图集候选

- 隔离目录：[`assets/awakening-v1/intake/whole-game-art-candidate-v1/`](../../assets/awakening-v1/intake/whole-game-art-candidate-v1/)。PNG 由 [`create-safe-camp-atlas-preview.mjs`](../../tools/awakening-art-lab/create-safe-camp-atlas-preview.mjs) 用整数像素坐标直接绘制；没有把生成器的大图缩小。
- **VERIFIED（机械）：** 320×256 图集、20 格、单格 64×64；3×3 单格平铺评审图为 960×768。PNG 可正常解码，输出是 RGBA 不透明 terrain 候选。tile 次序与现有 manifest ID 对应。没有修改正式图集、preview/production manifest 或碰撞层。
- **VERIFIED（开发预览接线）：** `terrain-v21.js` 支持显式 `?awTerrainArtPreview=1` 选择此候选；默认图集路径未变。`terrain-v21-preview.html` 是静态离线场景，不连接多人网络，并显示 **DEV ART PREVIEW — NOT PRODUCTION**。
- **REVISE（目视）：** tile 的面感仍偏平、草簇节奏能看出重复；角落岸线图块必须放回相邻海岸组合判断，孤立单格 3×3 不代表地图拼接结果。不能声称达到高细节目标，也不能接入正式游戏。
- **本轮小修：** 增加了沙土颗粒、压实路面磨损和水面高光簇；岸线石子的位置限定在陆地方向，避免画进泡沫/海水。原尺寸预览已重新生成。目视仍为 **REVISE**，未接受为正式图集。
- 当前最小下一步：继续提高草地/沙地/道路的材质层次和 A/B 变体差异，再用固定 tile 地图排列检查海岸连续性；随后建立隔离的 SafeCamp 实景对比，再谈替换。

## 关键依赖与待解决项

- 概念图是 3/4 斜俯视；当前 V21 世界坐标仍近似直接映射到屏幕 X/Y，SafeCamp tile renderer 也是轴对齐方格。角色/建筑在大量重绘前应先以实际画面锁定投影和像素比例，避免新资产再次割裂。
- 缺少可用的浏览器运行截图时，不能声称候选在游戏中清晰或统一；继续制作可检查的原尺寸源图与隔离预览，同时记录该 blocker，不跳过实际画面门槛。
- 既有文件/工作区改动来源保持 UNKNOWN；不删除或覆盖现存贴图、预览素材与脏改动。

## Runtime art inventory verification - 2026-10-04

**主责模块：Rendering & Art。协作：World & Terrain、Home & Building、Combat & Creatures、Integration & QA。**

The current `survival-v21.html` loader list is the source of truth for the active path. It loads `modules/core/runtime-state.js`, `modules/render/base-renderer.js`, `modules/safe-camp/game-v7-patch.js`, `terrain-v21.js`, `modules/render/render-v9.js`, and later the Awakening art/world modules. The active draw flow starts from `base-renderer.js`; `game-v7-patch.js` adds the guide and wraps the draw loop; `render-v9.js` supplies the final loop with shadows, particles and landmark primitives; later presentation modules wrap player drawing. `modules/render/game-render.js` contains similar functions but is not in the V21 boot list, so it is not the replacement target.

| Runtime visual | Verified source and contract | Current rendering and fallback | Replacement priority |
|---|---|---|---|
| SafeCamp ground | `assets/art-v21/terrain-v21.png`, RGB8 320x256, 5x4 cells of 64x64; tile IDs in `terrain-v21.js` | `base-renderer.js` paints a 24px `fillRect` ground first; the 64px authored terrain slice overlays SafeCamp zone 1:1. Collision is separate. Outside the authored slice remains procedural color blocks. | P0 visible ground slice. Keep ID order and collision unchanged; review shoreline/path together. |
| Player and camp guide | `assets/player_sheet.png`, RGBA8 96x128, 4x4 cells of 24x32 | `drawPlayer` and `game-v7-patch.js` `drawGuide` select this sheet. Guide uses one fixed frame. Missing player art has no body fallback; the guide border/name can still render. | P1 after view/scale contract is stable; replace player and guide as one style family. |
| Monsters | `assets/monster_sheet.png`, RGBA8 128x96, 4 columns x 3 rows of 32x32 | `drawMobs` maps watcher/cultist/crawler to rows and cycles four frames; missing art becomes a small rectangle. Combat tells remain code-driven. | P1; redraw silhouettes/frames without changing combat meaning. |
| SafeCamp props | `assets/camp_props.png`, RGBA8 192x96, 4x2 cells of 48x48 | `drawCamp` calls `prop()` for fire, tents/barriers and lights. Missing image silently omits the prop. | P0 alongside ground so the camp does not remain visually split. |
| World pickups | `assets/resource_sheet.png`, RGBA8 128x32, four 32x32 cells | Resource frames are mapped by wood/stone/food/shard; missing frame uses a pale square. | P1 after ground/props palette is set. |
| Procedural landmarks | No image binding in `render-v9.js` for ruin/idol/pier/ward | These are assembled from `fillRect` and simple stroke primitives. Replacing existing PNGs alone cannot improve them. | P1 world art pass; propose authored multi-cell props while leaving interaction/collision data authoritative. |
| North-road / MIRE MART overlay | `modules/world/awakening-world-v1.js` requests terrain/decal/prop/FX bindings through the art API | Default art loader requests `manifest.json`; current approved workflow uses `manifest.preview.json` only in preview mode. Missing semantic bindings use procedural ground, decals and prop primitives. | Later coherent region batch; do not promote the seven blocker candidates based on preview loading alone. |

**Visual inspection finding:** direct sheet previews confirm the existing character/monster/item sprites are authored within very small cells and use few visible color clusters. This supports the need for replacement, but does not prove how sharp or readable they appear at actual desktop/mobile display size. `drawSprite` scales 24x32 actors by 1.18, so source-to-screen clarity and canvas scaling still require runtime screenshots before acceptance.

**Verified limitation:** replacing only `terrain-v21.png` will change the authored SafeCamp slice, not every biome. Most other ground is the 24px procedural renderer; landmarks are primitive drawings. A whole-game art pass must therefore proceed by asset family and region, not by replacing a single sheet.

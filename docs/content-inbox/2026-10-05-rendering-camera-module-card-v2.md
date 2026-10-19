# Rendering & Camera — 独立模块卡 V2

**状态：DRAFT / NOT IMPLEMENTED as a separated successor renderer**  
**唯一主责：Rendering & Camera**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)  
**历史卡：**[Rendering & Camera V1](2026-10-04-rendering-camera-module-card-v1.md)

V2 是当前唯一派工卡。V1 保留作历史，不再作为 canonical 路由。此卡定义的是目标职责和验收，不证明 successor renderer 已经拆成服务，也不表示当前画质已通过。

## 玩家目标与五款游戏的启发

用用户选定的 3/4 斜俯视呈现现代沿海 HOME 与逐渐苏醒的深渊区域。角色、道路、敌人、资源、建筑与交互物在实际游戏尺寸下要锐利、层次丰富、风格统一、容易辨认。HOME 温暖且有生活细节；OUTSIDE 逐渐变冷和危险。高分辨率原图不等于游戏显示清晰；不能接受缩放后发糊、粗马赛克、过小或丢失关键细节。

只吸收五款参考游戏的体验：Crashlands 的战斗空间可读性；Terraria 的场景层次与探索方向；Minecraft 的空间连续性和建造可读性；Don't Starve 的危险氛围与清晰预警；Stardew Valley 的温暖日常构图。不得复制其美术、地图或界面。

## 当前实现事实（不是目标架构）

| 核对项 | VERIFIED 本地源码 | 结论/限制 |
|---|---|---|
| V21 正式画面 | `survival-v21.html` 先加载 `modules/render/base-renderer.js`、`modules/render/render-v9.js`、`modules/render/awakening-art-assets-v1.js`，后续世界/输入/FX 模块还会参与显示。 | V21 是行为/兼容基线，不是已接受的 3/4 高清 successor。修改 renderer 前核对 loader 最终 draw owner。 |
| 3/4 preview | `prototypes/successor-3-4/preview.js` 注入 `camera-adapter.js` 和 `successor-renderer.js`；renderer 捕获 V21 frame、推进现有模拟，再投影 V21 状态。 | Guarded preview 不是独立游戏入口或 production successor。真实 Relay 和存档路径不可由它证明。 |
| 渲染职责现状 | `successor-renderer.js` 仍混合 viewport/DPR、投影、地形、prop、角色/怪物/资源绘制、场景排序、部分预览行为。QA 控制已另有 `qa-harness.js`。 | 仍是 proof renderer，不可继续堆成全游戏单文件，也不可以仅按文件名声称模块已分离。 |
| 有证据的密度风险 | 该 renderer 的 actor draw 将 24×32 player source cell 显示为 28×38，怪物 32×32 显示为 38×38；Canvas 禁用 smoothing。 | **VERIFIED source-level risk, visual effect UNKNOWN:** 非整数源到目标尺寸及 DPR 合成可能损失像素簇清晰度；禁用 smoothing 单独不能证明清晰。不要改 sprite 源帧凑显示尺寸；用双视口运行图验证。 |
| 历史运行画面 | 2026-10-05 guarded successor browser review 在 **1280×720**（游戏 viewport 1100×618）与 **390×844**（游戏 viewport 390×742）都标为 **REVISE**：前者地面重复/偏粗、角色细节不足；后者角色和触控可见但 HUD/调试区挤占空间。另一次 1280×720 桌面审阅也见草地/岸线重复、actors/props 偏小。 | [双视口 guarded successor 记录](../handoffs/HANDOFF_2026-10-05-guarded-successor-visual-recheck.md) 和 [桌面运行时审阅](../handoffs/2026-10-05-successor-runtime-visual-gate-recheck.md) 对应其审阅的旧构建；不自动代表当前 HEAD。没有同一当前 build 的双视口新证据时，当前总体画质标 UNKNOWN；不可继承历史 PASS。 |

每项源码行为要在任务当次重新核实当前分支、入口、loader 顺序和 dirty state。聊天、旧截图和 V1 卡仅作线索。

## 唯一职责与模块接口

**Rendering & Camera owns:** camera/world-to-screen projection and inverse mapping contract; viewport/canvas sizing, backing resolution and DPR policy; depth/sort keys and scene draw layers; rendering lifecycle and observable render diagnostics. It reads canonical snapshots and stable art IDs, then draws them. It never writes world/player coordinates, collision, HP, inventory, AI, interaction results, quest state, save data or Relay authority.

- **World & Terrain** supplies world-space geometry, material/region snapshots and collision facts; visual alpha/color never defines walkability.
- **Movement & Locomotion** owns resolved movement state. **Input & Accessibility** maps screen intent through the projection inverse; renderer cannot change movement speed to compensate for zoom.
- **Animation & Presentation** supplies confirmed visual phases/FX; renderer orders/draws them and cannot infer or invent hit/death authority.
- **Asset Pipeline** validates source pixels, dimensions, anchors, frame metadata, alpha and manifest; Rendering owns sampling/display scale and the final in-game crispness gate.
- **Rendering & Camera** supplies canvas viewport, safe-area available bounds and scene/layering baseline. **UI & Map** owns HUD/menu/dialog/map semantics and their internal layout; **Input & Accessibility** owns hit regions and touch-intent mapping. These owners share measured bounds but do not become co-owners of layout state.
- **Audio & Feel** consumes confirmed events independently; no visual render timing can duplicate or suppress authoritative audio/gameplay events.
- **Integration & QA** captures same-build routes and checks adjacent behavior; it is validation owner, not a shared renderer owner.

One lead module per task. A rendering task may call named partner interfaces, but may not combine their state ownership.

## High-detail pixel acceptance contract

Every player-visible rendering/art change records **source file/ID and dimensions, source rect/frame, logical anchor/contact point, intended native pixel density, destination dimensions, actual CSS viewport, canvas backing dimensions, DPR and scale policy**. State which assets intentionally use pixel-cluster style; crisp nearest-neighbor sampling does not make a low-detail source high-detail.

For one unchanged build, scene state and capture setup, review both **1280×720** and **390×844**:

1. Save full-screen captures with viewport, arena/CSS bounds, backing pixels, DPR, projection tier, visible world extents, zoom and safe areas. Identify whether each is desktop/mobile CSS mode; browser viewport is not physical-phone evidence.
2. Compare original art beside its native-size in-game appearance (not a magnified crop alone). Check crisp pixel edges, retained small details, alpha fringe, color/value separation, actor foot anchor, prop scale/contact, animation stability and fallback status.
3. Inspect the composed HOME → path → shore/buildings and OUTSIDE/POI scene: seams/repetition, terrain material boundaries, foreground occlusion, player/threat/resource silhouettes, combat effects and readable retreat path. Check UI/control occlusion and stable detail during movement, not just a still PNG.
4. PASS only when both target viewport captures are sharp, richly detailed, unified and readable. If either visibly blurs, becomes coarse mosaic, loses source detail, makes important actors/routes unclear, or shows broken seams/anchors, mark **REVISE**. Missing current-build evidence is **UNKNOWN**, never inferred PASS.

The target composition must retain the project's gradual escalation: ordinary modern coastal reality first, then subtle anomaly, infrastructure trouble, monsters and deeper abyss. Do not make early HOME uniformly purple/cosmic to simulate polish.

## Tests and change safety

For projection/viewport changes run current `tests/successor-camera-adapter-v1.test.mjs`, `tests/canvas-aspect-fit-v1.test.mjs`, `tests/successor-module-routing-contract-v1.test.mjs`, `tests/module-sort.test.mjs`, plus focused UI, movement and preview-route regressions relevant to files touched. Source/VM tests establish math, ownership or deterministic route behavior only; they do not pass the visual gate.

One slice at a time: projection/inverse; canvas sizing/DPR; sort/depth; one renderer layer; then source-art display. List precise allowlisted files and rollback path. Preserve legacy V21 behavior, save and Relay contracts unless a separate explicit task authorizes changes. Do not batch replace art, alter collision to match artwork, or delete unknown assets.

## Delivery stages

1. **RENDER-0 audit:** verify active V21 and guarded successor entry, draw owners, asset source/destination dimensions, regression surface and fresh screenshots; no code edits.
2. **RENDER-1 proof slice:** select one complete scene (HOME player + NPC + station/prop + ground/path/shore) and agree finite source/anchor/density/projection inputs with World and Asset Pipeline. Compare candidate density tiers in the actual two viewports.
3. **RENDER-2 bounded extraction:** move one rendering responsibility behind a named interface while preserving V21 simulation and input inverse mapping; add one-owner tests and one adjacent-route regression.
4. **RENDER-3 family rollout:** only after the proof scene passes, expand one family (terrain, actor, prop, threat or effects) at a time; capture both target viewports on the real selected entry and recheck HOME → POI gameplay.

No stage authorizes production promotion, manifest replacement, merge or deployment by itself.

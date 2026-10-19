# World & Terrain — 独立模块任务卡 V2

**状态：DRAFT / NOT IMPLEMENTED as one separated successor service**
**唯一主责：World & Terrain**
**基线：**2026-10-05，本地 `fix/awakening-production-gate-qa-findings-v1`，HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。本轮限于模块文档、代码/测试核查；工作区其它脏文件与未跟踪文件来源混杂，不做归因或覆盖。

本卡把当前 V21 分散行为和未来 successor owner 分开。Canonical 分工以 [`SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md) 为准；此处“一个 World owner”是目标架构，不代表已经有单一运行服务。

## 1. 玩家目标与五款参考游戏

玩家走在熟悉的现代沿海城市里，应能从地面、道路、岸线、建筑和地标读懂身处何处；角色不能穿墙或跨水，显示的路径要与可走空间一致。HOME 应舒服、清楚、有人气；OUTSIDE 逐步显得冷、潮湿而危险。采用 3/4 斜俯视与 Modern High-Detail Pixel Art：地面层次丰富、道路/岸线轮廓可读、细节在最终运行尺寸下仍锐利。不能仅靠放大低细节 tile，也不能把高清原图压小到模糊或粗马赛克。

| 参考 | 世界/地形带来的玩家体验 | 未来可观察标准（PLANNED） |
|---|---|---|
| Terraria | 区域与地标暗示探索方向，逐渐开放新路线 | 从 HOME 到近邻 POI 的道路/入口可辨；地形视觉变体不改变 POI gate 和真实碰撞 |
| Don't Starve Together | 环境危险和回家路线应易判断 | 岸线、障碍、可走通道可从画面理解；夜色/天气若改变风险须由 Time/Survival owner 宣布，不由材质颜色暗改伤害 |
| Minecraft | 世界空间支持玩家建造和自己的营地布局 | World 提供占地/可行走查询，HOME & Building 决定结构放置规则；更换外观不改变碰撞和空间坐标 |
| Crashlands | 战斗/资源所处空间能快速读懂 | 墙角、遮挡和开阔战斗位让接近/远离选择清楚；素材不决定 LOS、命中或掉落 |
| Stardew Valley | HOME 附近路径、岸边和居民空间让日常回家舒服 | HOME 到设施/居民的步行空间连续清楚；生活装饰不能堵路，具体建筑/居民归各自模块 |

这些是以后实际试玩和双尺寸画面验收目标，不是现有自动测试已经覆盖的内容。参考游戏只提供体验灵感，不复制地图、地形贴图、道具或系统。

## 2. 当前运行行为：坐标与碰撞还不是集中服务

| 能力 | 当前源码观察 | 状态/限制 |
|---|---|---|
| 世界坐标 | V21 玩家使用 world-space `me.x/y`；世界模拟、移动、网络位置和渲染在不同路径读写/投影 | **VERIFIED：**3/4 camera 是画面变换，不得重写移动、战斗、采集或存档的世界单位 |
| 世界基础值 | `modules/world/world-state.js` 保存世界/区域/营地等基础结构；它不是统一地形、POI、碰撞和移动 service | **VERIFIED：**状态职责仍分布在其他模块 |
| V21 Safe Camp 地面 | `terrain-v21.js` 定义 64×64 world-unit 网格、24×20 authored slice、稳定材质/语义 tile ID 和独立 collision map；slice 外回退 legacy behavior | **VERIFIED：**V21 legacy contract，不是 successor 画面尺寸合同，也不是全世界地形服务 |
| 空间几何 | `modules/world/world-spatial-v1.js` 按 zone 注册 axis-aligned 矩形 collider，提供 point/circle query、逐段移动解析和采样式 melee LOS | **VERIFIED：**空间查询工具；不能据此声称所有当前碰撞只有一个 authority 或所有活动移动都统一经过它 |
| 当前移动写入链 | `modules/main-loop/simulation-update.js` 推进/写入玩家位置；`terrain-v21.js` 和 `modules/world/awakening-world-v1.js` 对特定地形/POI行为加包装或解析 | **VERIFIED：**执行链跨 owner；未来拆分要保留相邻移动/发包行为 |
| MIRE MART 几何 | `modules/world/awakening-world-v1.js` 放 POI 元数据、collider 注册、区域 tile/prop/decal/FX 表现及部分碰撞 wrapper | **VERIFIED：**当前文件混合地理/POI/表现职责。未来 POI 身份/发现/操作阶段归 POI & Exploration，World 保留空间查询；不要在本卡一起重构 |
| Successor view | `prototypes/successor-3-4/camera-adapter.js` 映射屏幕方向输入；`successor-renderer.js` 把 V21 世界/地形资料投影成 3/4 diamonds | **VERIFIED：**guarded preview 重用 V21 simulation；不是独立 successor World service 或正式生产入口 |
| 地形素材合同 | 根 [`AWAKENING_ASSET_CONTRACT.md`](../../AWAKENING_ASSET_CONTRACT.md) 规定 V21 awakening batch 使用 64×64 atlas cells、nearest-neighbor、图像不拥有碰撞；其尺寸不冻结 successor pixel density | **VERIFIED：**不可拿旧 atlas cell 尺寸要求 successor 继续输出相同显示大小 |
| successor 密度提案 | [`3/4 high-detail pixel density V2`](2026-10-04-successor-high-detail-pixel-density-contract-v2.md) 将 80×40/96×48 projected diamonds 和更大 actor 尺寸列作 comparison study，尚待 Rendering & Camera 冻结 | **DRAFT / NOT FROZEN：**World 保持逻辑坐标/地形语义，不替 Rendering 决定 zoom/source density |

**目标单一 owner：**World & Terrain 拥有 canonical world coordinate/terrain/region/可行走事实；当前现实是这些行为还分散于 World State、Terrain V21、World Spatial、main loop 和 Awakening World wrappers。只能在一次单模块实施里逐步收敛，不能把卡片当已完成迁移。

## 3. 模块分界

| Owner | 权责与接口 |
|---|---|
| World & Terrain | 坐标、地面/区域语义、明确碰撞/占用查询、移动解析接口；未来只提供读查询和受约束更新。不可由视觉 alpha/颜色推断 walkability |
| Movement & Locomotion | 玩家速度/输入后的运动状态；调用 World 查询/resolve，不另存地形 authority |
| POI & Exploration | POI identity/anchor/discovery/访问搜寻与返家里程碑；World 提供空间约束。World 不推进探索阶段 |
| HOME & Building | 营地建筑、站点身份、建造/升级规则；通过 World 检查空间合法性，World 不处理材料/升级 |
| Interaction & Gathering | 目标距离/意图；World 提供空间/阻挡查询，Interaction 决定有效目标与采集请求 |
| Creatures & AI / Combat & Weapons | AI/攻击与伤害 owner 使用合法位置/LOS 查询；地形图不能自行伤害、判 hit 或授 loot |
| Rendering & Camera | 将 world snapshot 投影到像素屏幕、terrain layer 与 sort band；不得写坐标、碰撞、POI 或移动结果 |
| Asset Pipeline / Content & Localization | Source image/material ID/atlas 元数据与纹理验证；地形 tile art 不决定 collision/区域事实 |
| Time & Weather / Survival & Needs | 时间天气、环境效应、存活规则各由各 owner 决定；World 可暴露区域/暴露上下文，不直接改 HP 或模拟时间 |
| Core State & Save / Network & Co-op | Save adapter 与获批 world snapshot 协议由各自 owner 决定；World 不建 localStorage、Relay payload 或多人权威 |
| Integration & QA | 组合真实路径与相邻回归、两视口证据；不拥有地形规则 |

表中多 owner 是调用/验证协作，不是联合状态 owner。建筑摆放、采集结算、相机投影与素材细节不能塞入 World。

## 4. 画质：现有画面状态与必须达到的 Gate

- 历史审阅手册记录 guarded successor 在 **1280×720 与 390×844 均为 REVISE**：草地/岸线重复、边缘块状、角色和道具比例偏小、手机 HUD 与场景争空间。此为该记录所审阅构建的证据，不保证等于当前 HEAD；因此 **当前构建的最终视觉状态 UNKNOWN**，也不能用预览报告宣称 production PASS。
- 历史 atlas 映射复核发现逻辑 grass ID 曾取到 atlas 的 sand cells，后续在 successor renderer 做了 mirrored-cell 兼容修复；回归报告 PASS，但当时未取得修复后的浏览器画面，地形自然度/重复改善仍 REVISE/UNKNOWN。正式独立草地/岸线素材尚未因此被验收。
- 比较密度提案中 64×32 是当前 legacy displayed diamond；80×40/96×48 只是下一步对照样本。**World & Terrain 不冻结这些尺寸**；Rendering & Camera 要决定显示尺度、投影、DPR 和实际可见地面；Asset Pipeline 核对源像素和 atlas。
- 下一次验收使用同一个 successor build、相同 HOME/POI 状态，在 1280×720 与 390×844 分别运行并保留截图。标记接缝/纹理重复周期、地面高低明暗层次、道路/沙地/湿岸辨认、角色/道具脚点与遮挡、移动时细节稳定性、nearest-neighbor 锐度和手机安全区。不能只看 PNG 原图、局部放大、测试通过或 atlas 尺寸。
- 碰撞独立可视化或自动overlay用来对比可走/阻挡形状与地形/门口；试玩覆盖边缘、斜向、高速 dash、窄门、POI 边界和墙角。视觉建议不得静默扩张/收缩碰撞。
- 任何显示后发糊、粗马赛克、道路边界难辨、tile seam 明显或角色比例细节落后目标风格，状态为 **REVISE**；没有当前 build 的两视口证据，状态为 **UNKNOWN**。

## 5. 现有回归与证据范围

执行实现任务时重新运行当前目标路径的相关测试，不沿用旧报告代替本轮证据：

- `tests/terrain-v21.test.mjs`：V21 64×64 slice/材质与独立 collision、zone 边界、dash 跨水阻挡、贴图 seams/渲染基础；不是全地图 successor 玩家验收。
- `tests/awakening-world-logic-hardening-v1.test.mjs`：MIRE MART geometry/移动、doorway、家具/墙体碰撞、LOS、mob spatial wrappers 和输入/战斗相邻规则；不证明所有 zone 空间统一。
- `tests/successor-camera-adapter-v1.test.mjs`：camera 投影与输入逆映射的 fixture；不证明实机手感或视觉密度通过。
- `tests/successor-live-screen-movement-v1.test.mjs`：预览屏幕输入经过 V21 的移动路径；需分清 fixture 场景覆盖，不能当完整 POI 路线。
- `tests/successor-natural-route-v1.test.mjs`：自然路线/碰撞切片；不能证明手机实际触控或 art accepted。
- `tests/successor-terrain-atlas-mapping-v1.test.mjs`：逻辑地形 ID 到 atlas sampling contract；不能证明 tile 接缝和现场材质变化好看。
- `tests/successor-module-routing-contract-v1.test.mjs` 与 `tests/module-sort.test.mjs`：分别检查模块文档路由和 V21 split-source 重建/加载顺序，不是地形体验通过。

所有名字需以本地当前文件存在为准。检测到 bug 时，先证明触发步骤与影响，再只动允许文件，运行主回归加一个相邻移动/POI/战斗/渲染检查；高风险改动准备回滚点。单测通过不等于没有其它 bug。

## 6. 分阶段派工

1. **WORLD-0：**源码地图（本卡）：列清当前 world coords、碰撞和投影链；不改代码。
2. **WORLD-1：**一个小区域/一种碰撞语义，输出结构和稳定查询接口；用边界/斜向/高速通行检查，避免改全局坐标。
3. **WORLD-2：**对照一个 3×3 authored terrain arrangement 和一段真实 HOME 路线，确定 source metadata 与 seam gate；显示像素尺寸由 Rendering & Camera 与 Asset Pipeline 决定。
4. **WORLD-3：**仅当对应 real preview/production入口被选择后，将一套正式区域视觉接入；对原图、manifest、active-renderer 和双视口画面逐项验收。

### 给 World & Terrain AI 的单模块任务模板

```text
你只负责 ABYSSAL WAKE 的 World & Terrain。先读 AGENTS.md、项目 Skill、PROJECT_CHARTER.md、PROJECT_STATE.md、SUCCESSOR_MODULE_MAP.md、本卡、AWAKENING_ASSET_CONTRACT.md 与相关测试；重新核对 branch/HEAD、脏工作区、survival-v21 loader 和实际 successor入口。规划中的单一 World owner 尚未实现，不能说现有各路径已收敛。

唯一目标：【一个区域、地形语义或碰撞行为】。唯一 lead：World & Terrain。允许文件：【精确清单】。协作 owner：【Movement/POI/HOME/Rendering/Asset Pipeline 中实际依赖者】，只读输入与输出接口要列明。World 确定逻辑坐标/阻挡事实；Art 不决定通行，Camera 不改世界坐标；不改存档/Relay合同。

先复现路径和碰撞结果；确认问题后做最小可回退改动。验证静止、边界、斜向/快速移动、窄入口和相邻POI；再检查一个相邻owner回归。不要重写所有V21或清理未知来源文件。

每项 terrain art 结果需说明 source ID/尺寸/anchor/原生像素密度，和源图到实际游戏画面的清晰度。在同一真实入口和状态截图1280x720、390x844，报告world extents、seams、材质层级、脚点遮挡、锐度和碰撞overlay。旧guarded preview只作历史参考；未见当前截图写UNKNOWN。模糊/粗马赛克/接缝明显标REVISE。

用简单中文报告玩家会看到什么、代码/美术是否真的接入、测试结果、剩余风险和回滚边界；不删文件、不自动提交/合并/部署。
```

## 7. 明确不在本卡范围

不修改 world coordinates schema、不换生产地形 atlas、不选择 80×40 或 96×48 密度、不重构所有 V21 碰撞、不改 POI/Quest/建筑/移动/战斗/存档/Relay，也不把历史浏览器观察当成当前画面验收。任何实现是下一项明确限定的独立工程任务。

## 8. 相关资料

- [`AWAKENING_ASSET_CONTRACT.md`](../../AWAKENING_ASSET_CONTRACT.md) — V21 art intake contract，不是 successor projection freeze。
- [`Successor high-detail pixel-density contract V2`](2026-10-04-successor-high-detail-pixel-density-contract-v2.md) — comparison study only。
- [`World & Terrain V1 history`](2026-10-04-world-terrain-module-card-v1.md)
- [`POI & Exploration V1`](2026-10-04-poi-exploration-module-card-v1.md)
- [`3/4 visual recheck handoff`](../handoffs/2026-10-05-successor-runtime-visual-gate-recheck.md)
- [`Terrain atlas repair handoff`](../handoffs/2026-10-05-terrain-atlas-grass-source-mapping-repair.md)

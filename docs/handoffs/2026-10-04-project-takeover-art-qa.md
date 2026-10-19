# ABYSSAL WAKE — 长期项目接班与双线审查

**日期：**2026-10-04（Asia/Rangoon）  
**状态：**ACTIVE / 持续目标未完成  
**审查范围：**当前 V21 美术渲染路径与只读 Bug/回归风险审查。两位协作者只读，没有写文件；本次未运行测试、未连接公网 Relay。

## 1. 项目目标

《深渊苏醒》是一款现代沿海城市背景的多人合作生存沙盒 RPG。玩家在安全温暖的 HOME 准备和生活，前往 OUTSIDE 探索、战斗或搜刮，再带着资源、线索或发现回家成长。恐怖从日常小异常逐步升级，不让开局就变成满屏深渊。

**当前最高优先级：全面提升正式游戏的画面质量并统一风格。**目标是清楚、锐利、材质层次丰富、实际尺寸可读的 Modern High-Detail Pixel Art。用户提供的概念图是构图、氛围和 3/4 斜俯视参考，不是可直接切图的生产资源。原 V21 需要逐区域、逐资源族翻新；相机和像素比例要协调，避免批量替换后风格、缩放或遮挡更乱。

玩法主线仍是紧凑的 HOME → 附近 POI → 探索/战斗/搜刮 → 回家成长。每轮也审查相关 Bug 与回归；判断须标明已确认、疑似或未知。

## 2. 当前阶段与仓库事实

- **VERIFIED：**仓库为 `C:\Users\MECH\Documents\ChatGPT\游戏编程\abyssal-wake-integration`，分支 `fix/awakening-production-gate-qa-findings-v1`，HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。
- **VERIFIED：**工作区有大量已修改文件及未跟踪文件，包含代码、测试、美术候选和项目文档；来源尚未逐项确认。全部保留，本接班轮次不归因、不重置、不清理。
- **VERIFIED：**正式入口 `survival-v21.html` 的活动渲染仍使用原来的轴对齐世界坐标显示。3/4 方向目前在 `prototypes/camera-3-4-v1/` 与 `prototypes/camera-3-4-v2/` 作为独立视觉实验；不在 V21 启动链，也不是正式版本替换。玩家看到实验页和 V21 不同，是隔离原型使用临时场景的结果。
- **VERIFIED：**V21 SafeCamp 使用程序地面和 `assets/art-v21/terrain-v21.png` 的 64×64 地形切片；角色、怪物、资源、营地道具仍从原图集中读取。其他世界区域仍混有 24×24 程序地面和矩形 fallback。MIRE MART 有开发预览渲染路径，但其 placeholder 和候选素材并非全面正式美术。
- **VERIFIED：**`assets/awakening-v1/manifest.preview.json` 是显式预览资源清单；正式的 `assets/awakening-v1/manifest.json` 当前不存在。57/57 加载或 PNG 尺寸/alpha 检查不等于正式美术验收。
- **VERIFIED：**已有 SafeCamp 草地、道具和人物候选仍在 intake/preview；重复纹样、实际人物比例和全屏表现尚未通过生产验收。不要把原型美术或预览图写成正式游戏已经变好。
- **VERIFIED：**当前正式渲染链顺序为 `base-renderer.js` → `terrain-v21.js` → `render-v9.js`。V9 绘制依赖内容/玩法 API；直接加载完整 V21 模块还会带入存档、计时器、输入、联网副作用。隔离预览应使用固定画面状态和受限渲染依赖，不加载会启动游戏会话的模块。
- **VERIFIED：**本轮对现有 SafeCamp 预览任务草案补充了上述渲染依赖与安全约束；只改了该 DRAFT 文档，没有改游戏代码、测试、manifest、正式素材、存档或网络行为。

## 3. 本轮两条独立审查线

### A. 全游戏美术与渲染路径

**状态：只读审查完成。**确认正式 V21 未全面翻新，轴对齐视角仍在；SafeCamp 地面和旧角色/物件图集仍是主要画面来源，候选图仍为预览。核心问题是视角目标尚未进入正式渲染、不同区域材质和像素密度不统一、fallback 会遮住素材缺失情况、真实 PC/手机画面还没完成验收。

### B. Bug 与回归风险

**状态：只读审查完成，未运行测试。**发现一个 **P1 / SUSPECTED**：WebSocket 收到 `hello_ack` 后，Zone channel 若始终不返回 `subscribed`，`RelayChannel.ready` 目前没有订阅超时或拒绝路径，而 `switchZoneRelay()` 会一直等待；模拟更新又要求 `zoneConnected`，玩家可能停在已显示的游戏页但不能行动。尚未用假 Relay 或真实服务复现，不得说成已确认 Bug。相关测试覆盖 join 返回 null 和正常订阅成功，但没有覆盖永不确认的 Zone 订阅。

另有 **P2 / 待设计确认**：v5 存档加载目前可恢复超过 48 小时的记录，邻接测试明确要求恢复 49 小时前的数据。现有证据不支持称为 Bug；先确认这是有意的长期存档规则还是误改，不动存档格式。

**其它审查边界：**断线后暂停模拟有测试作为预期，但实际重连 UX 未验证；地形与碰撞在数据上分离，但没有真实游戏屏幕证明视觉调整无碰撞副作用；测试本轮未运行。

## 4. 活跃模块与责任边界

| 主责模块 | 本阶段职责 | 需要配合 |
|---|---|---|
| **Rendering & Art** | 运行时资源盘点、统一视觉规范、SafeCamp 美术切片、fallback 可诊断 | World & Terrain、Home & Building、UI & Input、Integration & QA |
| **Integration & QA** | 每轮回归风险梳理、尺寸/alpha/绑定/实际屏幕清晰度验收 | 所有被影响模块 |
| **Camera / UI & Input** | 3/4 输入投影、角色朝向、手机控件和画面取景 | Rendering & Art、World & Terrain、Network & Co-op |
| **Network & Co-op** | 验证 suspected Zone 订阅挂起边界与恢复状态 | UI & Input、Core State & Save、Integration & QA |
| **Home & Building / World & Terrain** | SafeCamp 地面、营地布局、POI 及视觉/碰撞分离 | Rendering & Art、Interaction & Crafting |

美术不决定碰撞、伤害、奖励、AI、联机权威或存档语义；UI 只表达状态和意图；网络测试不得借机改协议。

## 5. 分阶段计划

1. **接班与证据阶段（当前）：**保护脏工作区；确认实际 V21 渲染与素材；每次审相关 Bug；区分正式运行、预览和原型。每日候选已经存在于 `docs/content-inbox/2026-10-04-draft-tide-resonator-module-item-v1.md`，标有 DRAFT / NOT IMPLEMENTED，本日不再重复出一份。
2. **画面可审查阶段：**选定并实现隔离的 V21 SafeCamp 美术审查预览。使用 V21 实际渲染代码、确定性画面状态，显示默认资源与候选资源、加载/fallback 状态；不连接 Relay、不写存档、不改变玩法。该画面能验证原 V21 中的资源和色彩，但因相机尚未迁移，不能代表 3/4 正式最终画面。
3. **SafeCamp 可见切片：**先完成相机/比例策略复核，再联合重做 SafeCamp 草坪、路径/沙地/岸边过渡、营地物件与角色比例；保持原 64×64 地形与独立碰撞合同。检查桌面 1280×720、手机 390×844、原生 1x 像素簇、最近邻缩放、接缝、重复节奏、遮挡、HUD 可读性。
4. **正式视角工程评审：**3/4 已选为产品视觉目标；判断 V21 何时迁移需有可逆实施方案与 world-to-screen/input/collision/network/save 接口分析。实验原型不能被称为正式视角迁移。
5. **逐区扩展：**SafeCamp 通过后再做完整 MIRE MART、北路、其它 OUTSIDE 区域；同一批保持光照、边缘、阴影、材质细节密度统一。再做玩家/NPC、怪物、道具/UI/FX 的成组替换，不孤立地攒互不相干图集。
6. **玩法纵切片：**在视觉与相机稳定后，验证 HOME → POI → 战斗/搜刮 → 返回 → 可见成长。当前 Field Rig 是面板/提示表现，世界空间营地变化未证实。

每项实现任务开工前明确一个主责模块、配合接口、文件范围、不得触碰的权威边界与回归检查范围。

## 6. 合规和文件保护准则

- 按 `AGENTS.md` 与连续性 Skill：默认审查、内容草案、Bug 报告。只有用户明确选择具体实现任务后才能改游戏代码、测试、manifest 或正式素材。
- **不要批量删除、覆盖、重置、清理**现有文件。修改前重新检查 `git status`；未知 provenance 继续保持未知。
- 候选图必须与正式 manifest 隔离，标记 `DEV ART PREVIEW — NOT PRODUCTION`；不新增无合同 gameplay semantic；不让美术决定玩法语义。
- 不进入公网 Relay/多人房间，不变更共享世界；不改变存档格式、Relay 协议、碰撞或玩法权威，除非单独选定并审查。
- 不合并、推送或部署；不把长 Goal 当成后台日程执行。当前日程状态只有既有文档的 REPORTED 记录，工具侧无法验证是否正在触发；不创建重复自动化。
- 两位协作者的产出只作为带证据的审查结果；没有共享分支/提交或实际文件证据时，不声称他们已实现资源或修复。

## 7. 验收标准

### 视觉与素材

- 概念图的氛围语言能转成自己的作品：熟悉的海岸生活、温暖 HOME、OUTSIDE 逐步变冷和异常，不复制参考图内容。
- 图像满足各自既有尺寸、cell、sourceRect、anchor、透明度和动画合同；不为凑尺寸缩放/重采样。
- 游戏实际尺寸里边缘清楚、像素簇有意设计、角色/道路/交互点可辨；原图与桌面/手机截图比较。出现模糊、粗马赛克、接缝、密度丢失或风格断裂即 REVISE / BLOCKED。
- SafeCamp、OUTSIDE、MIRE MART 统一材质、光照、轮廓、比例与细节密度；fallback 可观察、可诊断；手机 UI 不挡玩家/道路。
- 只有开发预览中的素材加载成功、3×3 平铺没有机械接缝、或单独图集放大好看，都不能当作最终验收。

### Bug 与玩法

- 每轮说明 CONFIRMED / SUSPECTED / UNKNOWN；对被影响模块做对应回归和真实运行检查，清楚列明未验证项。
- 视觉改动不得改变碰撞、移动、伤害、掉落、AI、联网、存档、交互或成长结果。
- 证明 HOME → POI → 探索/战斗/搜刮 → 回家成长可读、可复现；测试通过不等于双客户端或实体手机验收。

## 8. 风险预警与未知

- 正式 V21 目前轴对齐；如果在相机路径未定时批量做 3/4 资源，可能全部需要返工。相反，继续只做低细节 V2 方块原型也不能解决正式版画质不满。
- SafeCamp 预览需面对 V21 渲染模块的玩法/存储 API 依赖；加载完整启动链可能写存档或触发 Relay。隔离 harness 可行性未由实现验证。
- 一次换地面不换人物/建筑会加重风格割裂；必须以完整小场景为切片。
- **P1 SUSPECTED** Zone channel 永不确认订阅风险需要定向复现；当前无真实 Relay 证据。
- **UNKNOWN：**真实 PC/手机 V21 画面、实体触屏、3/4 正式迁移、完整 HOME→POI 循环、双客户端/长期网络恢复、音频混音质量、候选最终艺术质量。

## 9. 两份分开工作的 A+ 任务提示词

以下两份是可复制的只读审查任务。分工避免文件重叠；若之后要让任一方实现，需先由用户单独选定明确实现范围。

### A+ 任务一：全游戏美术运行路径和风格统筹

```text
你负责 ABYSSAL WAKE 的 Rendering & Art 只读审查。先检查 AGENTS.md、.agents/skills/abyssal-wake-continuity/SKILL.md、docs/PROJECT_CHARTER.md、docs/PROJECT_STATE.md、ART_BIBLE.md、MODULE_MAP.md、AWAKENING_ASSET_CONTRACT.md，然后核对分支、HEAD、git status 和 survival-v21.html 的真实模块启动顺序。

用户的最高优先级是：把原正式 V21 全游戏画质全面翻新并统一为 Modern High-Detail Pixel Art；指定参考图的海岸生存氛围和 3/4 斜俯视方向；不能把独立相机原型当成新正式游戏。盘点 SafeCamp、OUTSIDE、MIRE MART、角色/NPC/怪物/道具/资源/UI/地图/FX 实际使用的图像、绘制函数、manifest 选择、程序 fallback、尺寸/锚点/像素缩放约定。把正式运行、dev 预览、prototype 三类明确区分。

只读，不改任何文件/图片/代码，不跑测试，不删图。输出中文：VERIFIED证据（路径和行号）、KEEP/REPAINT/REPLACE/WAIT 去留表、风格规范差距、为什么 prototype 看起来像另一款游戏、最能验证画面的一块垂直切片、桌面/手机验收清单、未知与风险、一个推荐的下一工程任务。不得声称资源已接入或批准。
```

### A+ 任务二：V21 Bug / 回归 / 合同审查

```text
你负责 ABYSSAL WAKE 的 Integration & QA 只读审查。先检查 AGENTS.md、连续性 Skill、PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md 及相关存档/网络/地形/美术合同，再独立核对 branch、HEAD、dirty worktree 和 V21 实际 boot path。

用户要求每轮都审 Bug。重点审当前工作区中 V21 的 session/network-relay、simulation-update、runtime-state/save migration、terrain render/collision、awakening art manifest/fallback/multiframe FX 的源码和相邻测试。文件修改 provenance 未知，不归因给自己或其他 agent。没有清楚授权时只读；不改代码/测试/协议/存档，不连公网 Relay，不运行测试。发现项按 P0/P1/P2 + CONFIRMED/SUSPECTED/UNKNOWN 分类，附证据行号、复现情况、影响、已有哪些测试及覆盖边界、主责模块/接口、最小修复方向。

优先复核疑似风险：hello_ack 成功但 zone subscribed 永不返回时 RelayChannel.ready 是否会无限等待、zoneConnected 是否保持 false、V21 是否卡在游玩画面。没有动态复现证据就保持 SUSPECTED。另核对 v5 存档过期策略测试与实现是否是设计约定，不要擅改存档格式。
```

## 10. 下一步建议

完成本轮交接后，首要实现候选仍是现有 DRAFT `docs/content-inbox/2026-10-04-local-safecamp-art-review-task.md` 中的 **Implement isolated SafeCamp art preview**。它把正式 V21 的地面、角色和营地道具放在同一原版渲染画面里，让玩家明确看见“正式游戏还没变”与候选的区别。这个任务不批准资源替换或 3/4 迁移。Zone 订阅挂起风险保留为需单独选择的 QA 任务，不在视觉预览里顺手改网络代码。

用户可以：
- 选择 **Implement isolated SafeCamp art preview**，开始做原版 V21 的隔离视觉审查页；
- 或先选择单独的 Zone 订阅挂起验证任务；
- 或要求修改视觉方向/阶段顺序。审查报告本身不需要用户再提供代码日志。

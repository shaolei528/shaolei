# Animation & Presentation 模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED / 供模块分工、用户审阅和后续 AI 接手**  
**主责：Animation & Presentation（动画与表现）**  
**配合：Movement & Locomotion、Combat & Weapons、Creatures & AI、World & Terrain、Rendering & Camera、Audio & Feel、UI & Map、Input & Accessibility、Network & Co-op、Asset Pipeline、Integration & QA**  
**目标实现路径：successor 的 3/4 斜俯视正式画面；V21 仅作为已存在行为和兼容边界的参考。**

本卡定义职责、接口和验收，不授权本轮修改运行代码、动画资源、manifest、战斗数值、存档或 Relay。

> **归属说明：**本卡只对应 canonical **Animation & Presentation**。角色属性归 **Character & Progression**，移动状态归 **Movement & Locomotion**，坐标/投影/绘制归 **World & Terrain / Rendering & Camera**，输入归 **Input & Accessibility**，HUD 归 **UI & Map**，音频归 **Audio & Feel**；组合旧模块名称不产生额外 owner。完整名录见 [`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)。

## 1. 玩家价值与五款参考经验

角色移动、挥击、受击、死亡、敌人意图、交互和场景异变都应该自然、清晰、连贯，让玩家在实际游戏尺寸下快速看懂发生了什么。动画强化操作手感与情绪，不可让运动、特效或镜头掩盖重要信息。

- **Crashlands：**用清楚的攻击动作、命中与敌人预备动作提升战斗可读性。
- **Terraria：**以可读的动作和特效区别探索、危险与成长阶段。
- **Minecraft：**角色、工具、建造动作与可交互世界物件对齐。
- **Don't Starve Together：**动作传达准备不足、环境危险与合作状态，不用无提示动画惩罚玩家。
- **Stardew Valley：**居民日常姿态与反应增加 HOME 生活感。

只借鉴体验，不复制原作角色、动画、美术、音效或特效。

## 2. 模块负责与不负责

**负责：**读取角色/生物已确认的移动状态和领域事件，选择视觉状态、朝向、帧段、短时插值；表现挥空、确认命中、受伤、击败、交互、对话和环境异常；管理本地纯表现 FX 的生命周期、数量上限及无障碍表现选项。把动画/FX 的绘制交给 Rendering & Camera 的 draw/layer 接口。

**不负责：**移动坐标、碰撞、攻击是否合法、伤害、HP、死亡裁决、掉落、物品或任务结果、POI/环境权威、多人事件/存档、游戏音频合成与总线、UI 输入、Rendering & Camera 所拥有的 3/4 投影/视口/深度排序、运行时素材的正式批准。

表现可以订阅事件或读取只读快照；不得改变事件来源状态。挥空可表现攻击开始，但只有 Combat 已确认命中后才能显示命中特效。看到一个死亡快照不代表可无限重复播放击杀效果；需用对象生命周期/事件身份去重，不能自己裁决死亡。

## 3. 当前 V21 可核对快照（不是 successor 设计，也不是视觉验收）

**VERIFIED source：**survival-v21.html 的加载路径依次包含 smooth-motion-v18.js、hit-feedback.js、weapon-presentation-v1.js、playable-feel-v1.js，再载入音频模块。多个 extension 包装 drawPlayer、drawMobs、drawLighting 和 combat handlers，因此重入保护、调用顺序、基础 handler 恰好调用一次都是重要兼容点。

- modules/combat/weapon-presentation-v1.js 根据玩家方向和既有 attackFlash 绘制 Bone Knife pose；本地刀型读取 inventory，远端刀型根据 attack payload 的 range/damage 分类。该分类是现有启发式，不是稳定通用武器 ID 合同。
- modules/combat/hit-feedback.js 观察 Mob HP 变化和玩家 HP 变化，绘制挥击 arc、hit spark/pulse、受伤 overlay，并限长 spark/impact 队列；本地确认受击时调用短 haptic。它没有创建伤害或死亡规则。
- modules/combat/playable-feel-v1.js 观察封装前后的 HP/Mob 状态变化，发出本地 presentation events：abyssal:player-swing、abyssal:combat-hit、abyssal:mob-death、abyssal:player-hurt，并将 canvas kick 限于 3.6 px / 140 ms。此语义不是 Relay 或存档协议。
- `modules/main-loop/smooth-motion-v18.js` 是 V21 的组合式扩展，不是 canonical `Main Loop / Network Motion` owner。Network & Co-op 交付既有远端快照，Movement & Locomotion 定义移动状态，Rendering & Camera 拥有相机与投影；Animation & Presentation 只消费已形成的视觉状态/时间戳。接班实现不得复制位置权威、相机跟随或另建第二套远端平滑链。
- modules/render/awakening-art-assets-v1.js 可按时间选择 manifest 中 FX 帧；多帧绘制的帧坐标回归已有独立测试，但当前 preview manifest 没有确认实际游戏内多帧表现。
- modules/audio/playable-feel-audio-v1.js 独立订阅表现语义与战斗音频事件。Animation 不拥有音轨、混音总线或 WebAudio 生命周期。
- reducedMotion 已在 playable feel 的 kick 路径读取。需另行检查其它短时画面动画哪些应减弱/停用，同时保留理解攻击和受伤所需的基本状态反馈；不能只看设置开关就声称全游戏已支持。

以上是本卡制作时工作副本的源码观察；接手者仍需重查当前 HEAD、脏工作区、加载顺序、wrapper 和测试。源码/VM 测试不证明高画质、帧 pacing、手机显示或玩家观感。successor 画面与运动效果的真实运行验收为 **UNKNOWN**。

**VERIFIED successor source / pixel-density review item:** 当前 proof renderer `prototypes/successor-3-4/successor-renderer.js` 自己运行 draw loop 并直接选帧绘制 actor/mob；player source rect 写为 `24×32`、destination 为 `28×38`，mob source rect `32×32`、destination 为 `38×38`，canvas 设置 `imageSmoothingEnabled=false`。这些是当前代码参数，不是批准的 art/renderer contract。非整数且非等比的目标比例存在像素密度/形状不匀的**画面风险**，但最终效果须由真实 `1280×720` / `390×844` 截图确认，当前仍 **UNKNOWN**。该参数和投影/像素采样归 **Rendering & Camera**；Animation & Presentation 不得靠改动画帧尺寸来补偿尚未接受的渲染比例。proof renderer 也尚未拆成正式动画服务。

## 4. 模块接口与职责 owner

| 状态/行为 | Canonical owner / source | Animation & Presentation 可做什么 | 禁止越界 |
|---|---|---|---|
| 世界位置、朝向、移动意图 | Movement & Locomotion 拥有移动状态；World & Terrain 拥有坐标/碰撞；Input & Accessibility 提供 intent | 读取经验证的位置、方向和移动状态，选择 pose | 不改坐标、碰撞、速度或 Relay movement |
| 攻击、伤害、怪物生命、defeat | Combat & Weapons / Creatures & AI | Combat 发布已接受攻击/伤害事件；Creatures 发布一次 defeat；本模块读取后表现 | 不靠动画时点、粒子重叠或客户端推断写伤害/HP/死亡 |
| 角色动画图集与资产元数据 | Asset Pipeline；Rendering & Camera 提供显示合同 | 依批准的 sprite/frame/anchor manifest 绘制 | 不替美术批准资产、不建立第二套 manifest 或缩放合同 |
| 画面坐标、深度排序、镜头投影 | Rendering & Camera owns projection/depth; World & Terrain supplies coordinates | 提供屏幕变换、层级和遮挡接口；动画在该空间绘制 | 不私自变换权威 world state 或接管相机/terrain |
| 远端角色运动快照与投影 | Network & Co-op delivers approved snapshots; Movement & Locomotion defines movement state; Rendering & Camera owns camera/projection | 消费上游提供的展示状态，输出纯视觉 pose | 不创建新的 Relay event、同步频率、第二套位置插值或假造 server reconciliation；不移动 camera |
| 游戏声音、音量、混音 | Audio & Feel | 发布/消费语义事件并约定同步时机 | 不由动画调用重复音频、不创建第二音频总线 |
| 玩家选项与辅助体验 | UI & Map displays options; Core State & Save persists approved settings; Input & Accessibility owns device accessibility mapping | 读取 reduced-motion 等设置，使用稳定公开接口 | 不拥有菜单状态或吞掉输入 |
| 本地短时 FX 队列 | Animation & Presentation | 管理纯表现对象的建立、上限、自然到期和清理 | 不保存成战利品、任务进度、世界伤害或跨会话状态 |

接口方向：Movement / Combat / World owners 提供只读快照与确认后的语义事件；Animation & Presentation 消费这些状态并绘制到 Renderer / Asset API；Audio & Feel 可在约定语义时机读取事件。动画状态不能反向成为领域模块的权威来源。

建议 successor 为角色/生物定义小而稳定的 visual state：idle、locomotion、attack-start、attack-active、recovery、hurt、defeated、interact。进入状态的领域条件由各自 owner 裁决；animation clip 只读取状态与时间戳。接口名仅为设计示意，不是现有 API。

## 5. 高清像素动画硬标准

- sprite、tiles、props、UI icon、FX 分别遵守自己的源尺寸、像素密度、frame rect、anchor、透明边缘和缩放合同；不能把某类素材的尺寸合同套给另一类，也不能把高清概念图直接缩成生产 spritesheet。
- pixel art 的轮廓、手持物、脚底锚点、帧间体积与方向一致性须由最终像素簇构成。放大时使用已批准的清晰采样策略，不能让高细节源图在 runtime 变糊或变成大片粗方块。
- 动画采样与相机/世界坐标转换须服从 Rendering & Camera 的 crisp-pixel 合同；不要各自在 Animation 模块设置另一套采样、缩放或 projection 规则。实际结果出现 fractional sampling blur 时标 **REVISE**，不要靠改材质源图来掩盖 renderer 问题。
- 每种重要动作都在 successor 实际窗口与手机尺寸检查：角色、武器和敌人是否好认；脚底是否贴地；上下/斜向动作是否符合 3/4 投影；遮挡顺序是否正确；UI/触控是否被粒子盖住。
- 高品质不等于堆更多粒子。优先清楚轮廓、预备/接触/恢复节奏、帧时序、材质层次与克制的反馈；命中强于挥空，但不误报命中。
- 减少动态选项应压低镜头 kick、闪烁、重复 screen overlay 与非必要环境漂浮；保留玩家识别危险所需的基本动作提示，并实测低动态替代。

## 6. 未来实现切片（一次只领一个）

1. **接口/owner 审查：**为 successor 定义只读 visual-state 消费点和 renderer 层级接口，不动玩法或资源包。
2. **角色移动切片：**一个玩家、项目选定的 3/4 朝向方案、idle/walk 两组动画；输入方向与投影一致，脚底锚定，桌面/手机清楚。
3. **攻击可读性切片：**为一个已有武器制作预备/接触/恢复表现；挥空没有 hit FX；确认命中只播一次；保留原伤害、距离、cooldown。
4. **敌人意图/反应切片：**动画读取 Mob owner 的 wind-up/attack/recovery 状态；被遮挡时仍能识别危险；不改 AI 时间或命中区域。
5. **HOME/社交切片：**一个居民的 idle、移动和简单互动反应，增强 HOME 生活感；日程/对话/任务进度由 NPC/Quest owner 管理。
6. **性能/辅助体验切片：**限制 active FX 数量和帧时长，检查减少动态、后台暂停、切场景、重载和长时间战斗。

切片 2–6 须先在 successor 上定义接口和素材规格。V21 工作只可用于确认 Bug 的最小修复，或用户明确选定的专门任务；不要把候选卡变成 V21 永久架构。

## 7. 验收与防回归

### 源码/自动检查

- 进入、退出与重复初始化后，每个 wrapper/base draw/base handler 恰好一次；事件 retry 或重复 mob snapshot 不产生重复 hit/death 动画。
- miss、非法攻击、Safe Camp guard、失败互动不触发成功 hit/death/quest presentation。
- 表现事件必须来自已确认状态变化；呈现层不修改伤害、HP、cooldown、range、位置、物品、任务或网络字段。
- FX 在队列上限、寿命到期、场景切换、tab hidden/resume 后回收；不能无限增长或留下旧 overlay。
- reduced-motion 下无持续 kick/闪烁/多余环境动画，基础危险状态仍可辨识。
- 改 loader 顺序时运行 tests/module-sort.test.mjs 和相关 boot tests；改素材/多帧时跑对应 art mapping 与 frame tests；改 combat hook 时跑已有 combat/presentation idempotency tests。

### 真实运行验收

- successor Desktop + mobile 实际截图/录屏，至少检查 HOME、OUTSIDE、移动、挥空、命中、受伤和死亡/退场。
- 在 390×844 与 1280×720 检查 sprite 密度、清晰度、透明边缘、遮挡、字幕可读性和触控遮盖；比较原始素材与 runtime 截图。
- reduced-motion 开/关对照；键鼠与触屏分别输入；双客户端观察同一远端角色/怪物状态时不重复或错序。
- Node 测试不等于画质、手感或联机验收。无法真实运行的项标 **UNKNOWN**，不能用静态图冒称游戏截图。

## 8. 后续 AI 可直接领取的任务提示词

你负责 ABYSSAL WAKE 的 Animation & Presentation 模块。本卡是职责和验收设计，不代表实现已存在。先读 PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md、本模块卡及相关美术/runtime 合同；核对分支、HEAD、dirty worktree、successor 入口和其它 AI 正在编辑的文件。

主责只限 Animation & Presentation。先评审 successor 的只读状态输入和渲染层级接口，再提出一个小的可见动作切片。不得让表现层裁决伤害、命中、死亡、掉落、任务或联网权威；不得修改 save/Relay/data authority；保留所有现有和未知来源文件，不重置或清理工作区。美术资产只读取经批准的合同，不代替视觉 owner 批准候选。

报告改动与未改文件、状态 owner 和接口、游戏内实际尺寸对照证据、测试和设备覆盖、未知项、最小回滚方式。桌面/手机/真实运行未看过就标 UNKNOWN；不得只凭 Node test 宣称高画质或动画验收通过。

## 9. 关联模块卡

- [Combat & Weapons](2026-10-04-combat-weapons-module-card-v1.md)
- [Creatures & AI](2026-10-04-creatures-ai-module-card-v1.md)
- [Movement & Locomotion](2026-10-04-movement-locomotion-module-card-v1.md)
- [World & Terrain](2026-10-04-world-terrain-module-card-v1.md)
- [Rendering & Camera](2026-10-04-rendering-camera-module-card-v1.md)
- [Asset Pipeline](2026-10-04-asset-pipeline-module-card-v1.md)
- [Audio & Feel](2026-10-04-audio-feel-module-card-v1.md)
- [UI & Map](2026-10-04-ui-map-module-card-v1.md) and [Input & Accessibility](2026-10-04-input-accessibility-module-card-v1.md)
- [Unified art direction](2026-10-04-unified-art-direction-v2.md)
- [Successor art contract and runtime inventory](2026-10-04-successor-art-contract-and-runtime-inventory-v1.md)

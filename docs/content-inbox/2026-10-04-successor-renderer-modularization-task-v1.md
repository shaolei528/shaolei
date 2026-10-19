# Successor Renderer Modularization — 单模块工程任务卡 V1

**状态：阶段 1 已实施（Integration & QA）；阶段 2–8 仍为 DRAFT / NOT IMPLEMENTED**
**派工规则：每个阶段必须从 `SUCCESSOR_MODULE_MAP.md` 指定一个 canonical owner；本总任务横跨多个模块，不得作为一个联合 owner 的大任务分派。**
**可配合的 canonical owners：Rendering & Camera、World & Terrain、UI & Map、Input & Accessibility、Asset Pipeline、Animation & Presentation、Integration & QA。**
**目标：**把当前 3/4 successor 预览中混在一起的投影、绘制、输入和 QA 代码拆成可独立审查的边界，为后续 AI 按区块工作提供明确入口，同时保留 V21 玩法与碰撞权威，逐步达到真正的 HOME → POI → 战斗/搜刮 → 返回闭环。

本卡不表示模块已经拆分，也不表示新画质已达到验收。它只根据当前本地文件快照规划一个安全拆分顺序；实现前需重新检查文件、并行所有者、素材合同与 loader。

后续 AI 只能领取下表或实施顺序中的**一个阶段**，并在派工单里明确该阶段的唯一主责 owner、允许文件及回归测试。表格中的合作方是接口/评审方，不构成共同 owner。`Art contributor` 是美术创作角色，也不是代码模块。

## 1. 当前代码基线（VERIFIED source snapshot）

- `prototypes/successor-3-4/index.html` 是标有 `DEV SUCCESSOR PREVIEW · NOT PRODUCTION` 的开发页面。
- `preview.js` 在 guarded iframe 中加载现有 `survival-v21.html`，替换持久存储为内存 shim，阻断 WebSocket，再注入 `camera-adapter.js` 与 successor renderer。它不是独立生产启动器。
- **实施前 source snapshot（2026-10-05）：**`successor-renderer.js` 曾为 107 行、21,213 字节的压缩式 IIFE。该尺寸仅供历史对照；QA harness extraction 后源码已改变，派工前必须重查当前快照。
- 同一文件当前还负责开发 CSS、资源载入/状态、地形与菱形图块、SafeCamp 道具采样、POI 方块、玩家/NPC/怪物/资源绘制、深度排序、夜色层、移动输入、碰撞诊断、local-preview adapter 与逐帧循环。**阶段 1 后**，QA 自动输入、地点按钮、状态面板已移入独立 `qa-harness.js`；renderer 仅在显式开发预览中暴露本地桥接。
- 顶部初始化代码还有内联投影 fallback，与独立 `camera-adapter.js` 重叠。最终投影和输入反变换应有唯一 owner。
- 当前 source 使用 V21 terrain/player/prop/resource/monster 图集和程序 fallback。`imageSmoothingEnabled=false` 是清晰采样措施，不是高画质证明；24×32 角色被绘为 28×38，32×32 怪物被绘为 38×38。目标尺寸观感和候选美术接入仍需实际画面验收。

已核对的当前符号定位线索：开发 QA 输入、sequence、按钮和诊断位于 `qa-harness.js` 的 `setStep`、`beginSequence`、`advance`、`button` 与 `updateStatus`；renderer 的窄桥接为 `ABYSSAL_SUCCESSOR_QA_BRIDGE_V1`。视口/投影为 `resize`、`project`、`drawDiamond`；地形/实体绘制为 `terrainDraw`、`drawPoiProp`、`drawProp`、`drawActor`、`drawMob`、`drawResource`；场景组装为 `render`；V21 frame bridge 与模拟为 `canonicalFrame`、`simulationStep`、`frame`、`loop`；设备输入为 `keyVector`、`padMove`、`padRelease`；本地 preview 事件/Relay 替身仍在 renderer 的 preview adapter；素材诊断为 `assetStatus`、`reportAssetStatus`。preview bootstrap 的线索为 `boot`、`waitForModules`、`inject`、`install`。源码含压缩行与匿名 closure，符号只是搜索入口，不是稳定模块 API；开工前重新定位当前定义及调用者。

## 2. 目标边界与建议模块

| 独立职责块 | 该阶段唯一主责 owner | 输入/输出边界 | 不得拥有 |
|---|---|---|---|
| Preview Guard & QA Harness | **Integration & QA** | 仅开发页中的存储/网络隔离、QA 快捷键/地点按钮、自动输入和诊断；从 `preview.js` 接收 V21 frame/state，输出 QA 意图与诊断 | production 功能、真实 Relay、持久保存、战斗/掉落权威 |
| Camera Projection & Viewport | **Rendering & Camera** | 视口/DPR、world-to-screen、screen-intent-to-world、depth key；接受 canonical world coordinates 和 viewport，返回显示坐标/输入向量 | 玩家世界坐标、碰撞、移动速度、存档值 |
| Asset Contract Metadata | **Asset Pipeline** | 核实/验证已批准素材的稳定 ID、source rect、anchor、frame 尺寸与像素密度合同；向渲染 owner 提供只读元数据 | 运行时场景绘制、画面 fallback 表现、地图语义、碰撞、物品/战斗规则或未批准的 manifest 绑定 |
| Runtime Asset Lookup & Diagnostics | **Rendering & Camera** | 加载并查询已批准的素材定义，把通过合同的 asset handles 和失败状态提供给绘制层 | 修改/批准素材源图与 manifest metadata、地图语义、碰撞、物品/战斗规则 |
| Terrain & Ground Layer | **Rendering & Camera** | HOME/OUTSIDE 地面投影、tile 查找和材质绘制；只读 World & Terrain 快照、projection、asset registry，输出 canvas draw calls | walkability、zone ownership、运行时地形/碰撞变更 |
| Scene Entity Layers | **Rendering & Camera** | 道具、POI props、角色、怪物、资源的绘制和遮挡；读取领域 owner 快照与确认事件，共用 projection/context | HP、AI、loot、库存、伙伴/NPC 状态或交互资格 |
| Presentation & Environment | **Animation & Presentation**（表现状态）；Rendering & Camera 负责绘制 | 夜色/光照/动画时钟/视觉反馈；只读 Time & Weather 与已确认 presentation events | 改 simulation time、结算 combat hit 或加入未确认伤害 |
| Input Adapter | **Input & Accessibility** | 键盘/触屏屏幕方向归一化与投影逆变换；向既有 V21 owner 发唯一 movement/attack/interact intent | 直接修改 collision/world、双发动作、持久输入状态 |
| V21 Simulation Bridge | **Integration & QA**（preview 调度/单次调用保护）；原 V21 owner 继续拥有模拟状态 | 对每帧调用 captured canonical frame 一次并提供只读视图；向 rendering 提供最新 V21 state | 新造第二份 simulation、跨越 Relay/save 权威或改变 tick 频率 |

这些是目标模块职责，第一轮不用机械地拆成八个文件。实现者应优先建立最少的纯函数/模块边界，确保每块能独立测试；不要用过多抽象让小功能更难看懂。

## 3. 实施顺序与工作边界

1. **Integration & QA — Preview Guard & QA Harness（已实施）。** QA buttons、bounded input/route sequence 和诊断面板位于仅在 `preview.js` 检测到 `?awDevQa=1` 时注入的 `qa-harness.js`。renderer 提供只在 guarded preview 中存在的 bridge；player candidate 不加载 harness。local action adapter 仍属于 renderer/V21 preview 边界，并未迁入 harness。
2. **Rendering & Camera — Camera Projection & Viewport。** 确认 `camera-adapter.js` 是唯一变换 owner，再移除重复投影 fallback；测试投影/逆变换、斜向速度、视口 resize 和深度 tie-break。不得重写 canonical world coordinate。
3. **Rendering & Camera — RenderContext 与场景层。** 用小型只读 context 共享 canvas、viewport、camera、资产句柄和 world snapshot；分开地面层、实体层和环境表现层。绘制顺序与遮挡要有回归或可重复 capture。
4. **Asset Pipeline — Asset Contract Metadata。** 由实际源图和 loader 冻结 source size、display scale、foot anchor、frame 顺序、像素密度与高 DPI 约束；本阶段不接入候选图、不改 manifest。
5. **Rendering & Camera — Runtime Asset Lookup。** 只消费冻结的 metadata，建立 renderer 使用的 asset handle 与失败诊断；不重新批准或改写源图合同、manifest。
6. **Input & Accessibility — Input Adapter。** 键鼠和触屏各自归一成一次屏幕 intent，再经唯一 camera adapter 转换；碰撞仍由现有 World & Terrain / Movement & Locomotion owner 处理。
7. **Integration & QA — V21 Simulation Bridge。** 保持原 `canonicalFrame()` 每画面帧仅推进一次；用 focused regression 验证初始化、resize 和重试不会多推进模拟。V21 领域状态与 tick authority 不迁移。
8. **分阶段视觉验收。** 使用同一 HOME 与 MIRE MART 确定性状态，比较原始素材与运行帧；在 1280×720 与 390×844 检查 native pixel cluster、DPR/缩放、脚点、遮挡、路线/角色辨识和失败 fallback。未达到高细节、清晰锐利、统一的 Modern High-Detail Pixel Art 时标 **REVISE**；旧图集或程序块不算美术升级。

## 4. 回归与验收门

- **调用频率：**每个 requestAnimationFrame 恰好推进一次原 V21 canonical frame；画面刷新、尺寸变化或模块初始化不能额外推进 simulation。
- **坐标/玩法：**上下左右和斜向输入经镜头逆变换后，实际屏幕方向正确且速度一致；世界坐标、碰撞、交互距离、攻击距离、HP、掉落和 Relay payload 不变。
- **绘制：**固定 snapshot 下 HOME、MIRE MART、角色、道具、怪物、资源与 POI 层级稳定；并列深度 key 有确定 tie-break；任何视觉 fallback 不创建玩法对象。
- **输入：**键鼠与触屏只发一次 intent；QA 输入只在 preview 可见；丢焦/取消 pointer 时输入归零。
- **安全隔离：**preview 仍阻断 WebSocket 和真实 localStorage；生产页面不加载 QA shortcuts、内存 shim 或 preview CSS。
- **素材：**无资源、坏 PNG、frame/anchor 不匹配能显示诊断并安全 fallback；实际 1280×720 与 390×844 画面均锐利、细节可读，没有粗马赛克、模糊、断层或风格冲突。
- **玩家体验：**普通控件能从 HOME 出发到一个 POI、处理一个遭遇/搜刮并回 HOME；QA teleport 不能计为完成路线。接回 co-op 前另做双客户端与断线恢复验收。

运行适合本次真实改动的聚焦测试，串行运行 Node 测试并审查相邻系统。测试通过只表示该测试覆盖范围通过；没有浏览器/手机/Relay 证据的项目必须写 UNKNOWN。

## 5. 交给下一位 AI 的单一目标模板

```text
本次只执行 Successor Renderer Modularization 的一个阶段：【明确编号】。
主责模块（必须是 `SUCCESSOR_MODULE_MAP.md` 中的一个 canonical owner）：【按阶段填写，例如第 1 阶段为 Integration & QA，第 2 阶段为 Rendering & Camera】。其它合作模块只提供接口或回归，不是共同 owner。先读本卡、docs/SUCCESSOR_MODULE_MAP.md、docs/GAMEPLAY_VISION_AND_REFERENCE_ANALYSIS_V1.md、ART_BIBLE.md、PROJECT_CHARTER.md、PROJECT_STATE.md、项目 Skill 和相关 camera/art/world/input contracts；核对当前 branch、HEAD、dirty files、loader 与并行 owner。

只允许修改：【本轮具体文件】。不得触碰美术 owner 的图像/合同，除非其已明确交付；不得改生产 V21 玩法、collision、save schema、Relay protocol、combat authority 或 production art manifest。保护所有来源不明的现有修改。

先写出拆分前后接口和 rollback 点，再做最小的一阶段提取。保留 guarded preview、canonical simulation 单次调用和 V21 world state。跑新增的纯函数/组件回归与相邻 V21 regression；在 1280x720 和 390x844 实际画面检查后，分别报告 VERIFIED、REVISE 和 UNKNOWN。不要把 preview 说成生产版，也不要宣称画质通过，除非游戏实际显示画面满足目标。

不删 V21 文件、不 merge、不 deploy。最终用简单中文报告变更文件、玩家可见提升、回归结果、真实画面证据、未完成模块和下一个单块任务。
```

## 6. 现在的选择

**阶段 1 已由 Integration & QA 完成。**测试确认普通 player entry 不注入 harness，未选择 `awDevQa=1` 的 preview 也不显示 QA 控件；11 个开发按钮、bounded input、序列、inactive cancellation 和状态读取由隔离 harness 测试覆盖。全套 59 个 Node 测试通过；asset-validator CLI 子进程断言仍因 Windows `EPERM` 跳过，需 CI 验证。阶段 2（Rendering & Camera 投影/视口）是后续建议，不代表已实施；开工前仍须复核唯一 owner、精确 allowlist 与共享 dirty worktree。

阶段 1 已完成并记录在项目状态与 `docs/handoffs/2026-10-05-successor-qa-harness-extraction.md`。后续每阶段仍须单独核对该文件的当前改动/并行所有者，并明确唯一 owner、文件 allowlist 与聚焦测试；不能借此改动未经授权的镜头、资产、玩法或正式 UI。

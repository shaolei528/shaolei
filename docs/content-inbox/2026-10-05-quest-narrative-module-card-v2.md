# Quest & Narrative — 独立模块任务卡 V2

**状态：DRAFT / NOT IMPLEMENTED / 后续 AI 派工与用户审阅**
**唯一主责：Quest & Narrative**
**基线：**2026-10-05，本地 `fix/awakening-production-gate-qa-findings-v1`，HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。本次 Quest 审查只处理文档；仓库其它脏文件/未跟踪文件来源混杂，不作归因，也不覆盖。

这张卡定义 successor 的叙事任务 owner，不授权改 V21 或创建通用任务引擎。Canonical owner 表见 [`SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)。

## 1. 玩家目标：让任务推动生活循环，而不是接管游戏

任务应该简短回答：我为什么出发、可以选什么、成功后回家有什么变化？主目标给方向但允许玩家偏离；可选线索奖励好奇心；死亡或早返要说明情况，不应靠 UI 猜测或凭空授予进度。叙事从熟悉的现代沿海日常渐进到异常、设施失灵、怪物和深渊侵蚀。

五款参考游戏只提供体验灵感，不复制角色、名字、地图、任务、对白、UI 或整套机制：

| 参考 | Quest 的原创玩家体验 | 未来可观察的验收标准 |
|---|---|---|
| Crashlands | 目标、敌人、物资用途直接明白，完成反馈干脆 | 首次试玩者能说出当前目标/所需资源；重复完成事件也只显示一次结算 |
| Terraria | 发现与装备逐步打开新区域，门槛有真实理由 | 阶段条件来自 POI、装备或已确认叙事里程碑；返家/重试后仍能解释为什么可继续 |
| Minecraft | 主线不锁死玩家的家园表达和活动顺序 | 玩家可以先建造/采集/偏离路线；Quest 状态不因非目标活动被误完成或重置 |
| Don't Starve Together | 出发建议让危险与准备更可判断，便于队伍协商 | 只显示经 Time/Weather、Survival、World 确认的风险/时段快照；当前天气/夜晚提醒未接入 Quest |
| Stardew Valley | 居民请求和社区变化使返家值得期待 | 完成一个请求后有可见 HOME/社区结果；当前没有居民请求目录或持久社区成长 |

以上均是 **PLANNED 的未来玩家体验验收目标**，不是已有自动化测试覆盖；Crashlands 试玩理解和 Don't Starve 队伍协商等需要实际试玩/多人观察，单测不能替代。

## 2. 当前事实：V21 局部路线不是通用 Quest

| 项目 | 当前源码观察 | 状态与含义 |
|---|---|---|
| 运行路线 | `modules/world/awakening-expedition-loop-v1.js` 中 `ABYSSAL_EXPEDITION_LOOP_V1` 推进 PREPARE → LEAVE_HOME → REACH_MIRE_MART → SEARCH_FIGHT → SECURE_REQUIRED_SALVAGE → RETURN_HOME → COMPLETE | **VERIFIED：一条 V21 局部路线。**合同 `scope=session-local-slice`、`persistence=none-v1`、`authority=local-objective-state-only`；进度不持久化，也不是服务端/多人共同权威 |
| 阶段输入 | 读取本客户端 started/dead、位置/inCamp、POI 区域、knife 和当前总 shard 数（要求 ≥2） | **VERIFIED：**阶段观察来自现有本地运行态；不是领域事件/正式 Quest 记录。HP/战斗、采集、库存仍由相邻系统管理 |
| 目标展示最后写入者 | V21 loader 先载 World V1，再载 Expedition V1；World 包装旧 `updateQuest`，Expedition 最终覆盖 `window.updateQuest`，直接更新 `questText.textContent` | **VERIFIED：当前正常 loader 链的最终目标栏写入者为 Expedition。**SafeCamp/UX-CN/World 有旧文案/包装器，但不是多个合法 Quest 权威 |
| Guide 任务提示 | V12 `currentTaskAdvice/currentTaskText` 另按 inventory、knife、`hasLeftCamp` 拼对话提示，不读取 Expedition snapshot | **VERIFIED：额外的显示判断，不拥有任务状态。**过期文案风险尚未复现为可见错误，标 **RISK / NOT CONFIRMED BUG** |
| HOME 返家结果 | Expedition 完成后请求 `ABYSSAL_HOME_WORKBENCH_V1.recordExpeditionReturn()`；HOME 模块拥有 Field Rig tier/return-clearance、保存和材料结算 | **VERIFIED：**Quest 不得直接升级、授物或写建筑状态 |
| 叙事/存档/联机 | 本地 `abyssal_guide_v7` 是 Guide 交谈标记；当前 Expedition 无 save 写入；`chat-sync.js` 是玩家聊天 | **VERIFIED：**没有在已查活动模块中确认通用 Quest registry、日志、分支、持久叙事记录或共享多人任务合同。多人同时在线不等于共同任务 |
| 内容草稿 | [`MIRE MART signal`](2026-10-04-mire-mart-signal.md) 是未选择的原创信号候选 | **DRAFT / NOT IMPLEMENTED / 未获用户选择。**不能把候选当成当前剧情事实 |
| successor 路径 | guarded 3/4 preview 通过 wrapper/iframe 引用 V21 状态和模拟，并显示任务栏；该证据只适用于对应已审查的 preview 路径，不代表其它 preview 版本或生产包 | **PREVIEW SCOPE ONLY：**没有独立 successor Quest 服务或生产 Quest 接管证据；每次须检查对应手册/实际入口 |

这些边界由 Quest 卡的独立只读审查复核。静态文案、旧单测或预览都不能证明一整套叙事系统已实现。

## 3. 单一状态 owner 和接口

| Canonical owner | 单一职责 | Quest 可如何协作 |
|---|---|---|
| Quest & Narrative | successor 的任务定义/接受/拒绝/放弃、叙事选择和完成状态、线索日志、任务完成资格 | 唯一修改 narrative request state；只用经确认的邻接事实 |
| POI & Exploration | 地点发现、路线/访问/搜寻/返家等 operational expedition 阶段 | 产出 POI milestone snapshot/event；Quest 可消费，不复制 phase machine |
| World & Terrain | 世界坐标、区域事实、碰撞/可通行 | 提供只读地理事实；Quest 不宣布 walkability 或改地形 |
| Combat & Weapons + Creatures & AI | 命中确认；怪物 HP/life/一次死亡事实 | Quest 消费确认结果，不轮询 HP 或判定击杀 |
| Items & Inventory + Loot & Rewards | 库存事实/原子结算；经授权的奖励资格/唯一 claim/grant request | Quest 只给固定 reward ID/资格请求；两位 owner 的交易/idempotency 接口仍待定义 |
| NPC & Social | 人物 identity、对白和提供的请求 offer | Quest 返回请求状态；不存 NPC 名册、关系/日程 |
| HOME & Building | Field Rig、营地结构/升级及返家 payoff | 接收明确请求；Quest 不直接写升级或材料 |
| Survival & Needs + Time & Weather | 生存数值、时间、天气与相关环境快照 | Quest 读取经确认快照；不改变 HP/饥饿、计时或天气 |
| Core State & Save | 版本化存档、读写协调与迁移 | 将来仅通过批准的版本化 Quest slice 持久化；不让每个任务自建 localStorage key |
| Network & Co-op | 既有传输协议与共享消息合同 | 只有个人/团队/世界权威语义、重连/加入/冲突和回滚规则确认后，才承载共享任务数据 |
| UI & Map + Input & Accessibility | 展示只读 Quest snapshot，规范化提交玩家选择 | 当前 V21 直接写 DOM 是 legacy；UI 不判定进度、不发奖 |
| Content & Localization | 稳定内容 ID、短文案和安全回退 | 任务引用内容 key；不能把缺失翻译变成阻断性乱码 |
| Rendering & Camera + Animation & Presentation + Audio & Feel | 视口、图层与表现 | 只响应已确认的叙事/阶段事件；VFX、音效不能完成任务 |
| Integration & QA | 跨模块回归和证据范围 | 检查完整真实流程；不接管 Quest 规则 |

表中“+”只表示协作接口，不表示联合状态 owner；每个状态仍由一位 canonical owner 决定。

目标数据流（**PLANNED，非现有 API**）：领域 owner 确认事实 → Quest 幂等地核对前置并改变自己的 narrative record → Save adapter 按已批准 schema 持久化 → UI/地图读取 snapshot → Presentation/Audio 展示确认事件。重复事件 ID、保存失败、奖励请求失败时必须维持一致且可重试状态。Successor Quest 的 Save schema 和迁移策略尚未设计；不得提前猜字段、迁移步骤或保留期限。

## 4. 首条内容切片与视觉品质

首个 successor Quest 候选复用既有 HOME → MIRE MART → HOME 的位置和 POI，不另建区域或 expedition 阶段。Quest 只负责“为什么去、调查什么叙事线索、玩家可选什么、叙事确认后如何表达”；POI 负责走到哪里/完成何种搜寻操作，Items 负责 shard 数量，HOME 负责 Field Rig 结果。现有 V21 的“带回 2 shard”仍属 Expedition 局部合同，不自动成为长期 Quest 规则。

- 任务主句建议控制为一条短行动语句 + 可选的一条上下文；最多一个当前目标标记，不同时把主线、支线、聊天和地图提示塞满手机屏幕。
- 线索要先像停电、海潮或通信故障；早期最多出现一个无法解释的小细节。具体无线电信号想法仅可沿用未选择的候选，不能变成既定剧情。
- 画面参考用户概念图：3/4 斜俯视的可居住 HOME、探索理由和简洁 quest UI；它不是运行证据。使用 Modern High-Detail Pixel Art，字体/图标边缘锐利、像素密度统一，不能被压缩或缩放成粗马赛克。
- Quest 视觉交付不要求新画角色或地图：UI & Map 拥有布局，Rendering & Camera 决定显示/叠层，Asset Pipeline 验证任务图标源规格，Content & Localization 管理 key；一个模块只按所选任务改自己允许文件。
- 真实验收要用同一 successor build 和同一 quest state 分别截取 1280×720、390×844：检查目标层级/阅读时间、按钮安全区、文本裁切、与角色/路径/攻击/交互遮挡；手机上不可盖住方向、Interact、Attack、Dash，必需信息需在安全区内可达；并检查最近邻清晰度和图标缩放。无截图标 **UNKNOWN**，明显模糊/丢细节标 **REVISE**；文本 mockup、超清原图和通过测试都不能代替。

**新原创内容卡：**尚无新 Quest 台词/目标在本轮写入；用户未指定要保留旧 signal 草案。本轮只完善模块合同，避免重复创作并混淆用户已选择内容。

## 5. 状态机、失败恢复与验收草图

未来 Quest 记录可采用有限状态（具体字段后续设计）：`locked / available / accepted / declined / completed / failed / abandoned`。它只管理 narrative request，不复制 POI phase。每个任务需明确可重试还是一次性、事件 ID、个人/团队范围、reward request ID、保存版本、失败提示及玩家退出/重进语义。

至少覆盖：合法接取/拒绝/放弃；前置不满足；POI 提前离开和正常返家；玩家死亡/重试；重复或乱序领域事件；库存条件恰好变动；Save 写失败/损坏旧档回退；奖励发放失败/重试；两名队员同时触发；断线重连与晚加入；旧客户端/版本兼容。每条回归必须由对应 owner 负责其规则，Quest 只测试编排/幂等接口。当前 V21 Expedition 测试只能证明那条本地路线，不能当作 Quest service 测试。

当前相关测试/范围：

- `tests/awakening-expedition-loop-v1.test.mjs`：局部阶段、提前返家、死亡、两件 shard、完成一次性与禁止越权；非通用 Quest。
- `tests/awakening-home-workbench-upgrade-v1.test.mjs`：返家资格、Field Rig 与存档反馈；非叙事存档。
- `tests/interaction-guide-task-v12.test.mjs`：V12 条件提示展示；非 Quest 权威。
- `tests/successor-natural-route-v1.test.mjs`：预览路线；非 Quest persistence/多玩家。
- `tests/successor-module-routing-contract-v1.test.mjs`：文档 owner 路由；非游戏验收。

所有检查需在任务实现时重新执行，本卡本身没有声称它们在本轮重跑通过。

## 6. 分阶段任务路由

1. **Quest-0：**一张源代码映射表，区分 V21 最终目标写入者、legacy wrapper、Guide 旁路文案、POI 操作状态、HOME payoff 和 Save 键；不改代码。
2. **Quest-1：**单条短原创任务内容/目标 HUD mockup；只写 DRAFT，检查中英文长度和视口层级。
3. **Quest-2：**successor 单条 Quest state/command/event 接口设计；先完成个人或团队权威决策及 Save/POI/Reward 边界，再实现一条任务。
4. **Quest-3：**有单测和邻接回归后，进行单人桌面/手机真实流程验收；再决定是否需要双人/持久化合同。
5. **Quest-4：**一次只添加一个 NPC 请求、社区 payoff 或新区域剧情；不批量扩系统。

### 单模块派工模板

```text
你只负责 ABYSSAL WAKE 的 Quest & Narrative。先读 AGENTS.md、continuity Skill、PROJECT_CHARTER.md、PROJECT_STATE.md、SUCCESSOR_MODULE_MAP.md、本卡和相关 contracts/tests；重新核实 branch/HEAD、工作区和实际 boot path。V21 是兼容基线；不能说已有通用 successor Quest service。

唯一目标：【一个任务 bug / 一个任务状态切片 / 一条短内容草案】。唯一 lead：Quest & Narrative。允许文件：【精确清单】。邻接读取/请求：【POI、NPC、Inventory/Loot、HOME、Save、UI 中确实需要者】。其它模块只作只读输入或接口协作，不扩大为多 owner 改造。

先定位是否可复现。错误根因没有证据时先记 SUSPECTED/UNKNOWN。若是已确认 bug，做最小可回滚修改，覆盖原问题及一个会被连带影响的邻接系统；不删未知文件，不迁移旧存档、不改 Relay、不覆盖并发修改。任务的重复/乱序、失败、死亡、早返、保存失败和奖励失败均不得误报为成功。

每个玩家可见任务都附高细节像素 UI/图标要求和 1280×720、390×844 实际运行验收。未截图写 UNKNOWN，模糊或粗马赛克标 REVISE。最后用简单中文报告结果、证据、测试、剩余风险和回滚点；不自动合并或部署。
```

## 7. 明确不在 V2 范围

不修改 `modules/world/awakening-expedition-loop-v1.js`、Guide/UI、HOME/Save、Items/Loot 或网络；不把已有 V21 route 改名成 Quest service；不生成新剧情作为“用户已选”；不建立通用任务编辑器、共享剧情后端或生产图标。任何实现是后续另选的单一工程目标。

## 8. 参考证据

- 当前 V21 路线合同：[`MIRE_MART_EXPEDITION_LOOP_V1.md`](../contracts/MIRE_MART_EXPEDITION_LOOP_V1.md)
- NPC 边界：[`NPC & Social V2`](2026-10-05-npc-social-module-card-v2.md)
- 产品与五游戏体验：[`GAMEPLAY_VISION_AND_REFERENCE_ANALYSIS_V1.md`](../GAMEPLAY_VISION_AND_REFERENCE_ANALYSIS_V1.md)
- 当前来源：`survival-v21.html`、`modules/world/awakening-world-v1.js`、`modules/world/awakening-expedition-loop-v1.js`、`modules/safe-camp/home-workbench-upgrade-v1.js`、`modules/input/interaction-v12.js`

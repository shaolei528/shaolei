# Quest & Narrative — 独立模块任务卡 V1

**状态：DRAFT / NOT IMPLEMENTED / 供后续 AI 领取与用户审阅**  
**目的：**让未来一个 AI 能负责目标、线索、支线请求和故事进度，同时不重复维护物品、POI、击杀、NPC 关系、营地升级或存档数据。  
**源码快照：**2026-10-04，本地分支 `fix/awakening-production-gate-qa-findings-v1`，HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`；工作区存在来源未知的改动，本卡不认领它们。  
**目标版本：**用户已确认 3/4 镜头/玩法方向可继续，原型画质还未通过；目标是 successor 接管原游戏体验，V21 在替代路径过关后再逐步退役。本卡中的 V21 文件只是行为与兼容基线，不是要求未来任务继续堆进 V21。

## 1. 玩家体验目标

任务要让玩家知道“为什么从 HOME 出发、路上在找什么、可以如何选择、回家后世界或准备有什么变化”。剧情从熟悉的现代沿海城市生活开始：异常信号、设施故障与人的线索先于直接的深渊威胁。主目标要短而清楚；可选发现让愿意探索的人多知道一些，但不强迫玩家读大段文本或照着标记跑完全图。

**Crashlands：**任务目标与敌人/资源用途清楚，完成时反馈利落。  
**Terraria：**发现、装备与地点成长能串成阶段，但每个门槛由真实世界条件解释。  
**Minecraft：**玩家能自由选择先做什么，目标不接管家园表达。  
**Don't Starve Together：**出发前讲明夜晚、饥饿和区域危险，队伍能讨论准备。  
**Stardew Valley：**居民请求和社区变化让玩家有回家的理由。  

原创转化要服务同一条 HOME → POI → 探索/战斗/搜集 → 返回成长循环；不复制五款参考作的角色、关卡、文本、任务表或完整任务结构。

## 2. 当前实现快照：已有一条局部远征目标，不等于通用任务系统

**VERIFIED source：**

- `modules/world/awakening-expedition-loop-v1.js` 暴露 `ABYSSAL_EXPEDITION_LOOP_V1`，拥有一条 **session-local operational expedition** 状态机：`PREPARE → LEAVE_HOME → REACH_MIRE_MART → SEARCH_FIGHT → SECURE_REQUIRED_SALVAGE → RETURN_HOME → COMPLETE`。其合同写明 `persistence:'none-v1'`，所需物资为当前背包总数中的 2 个 shard。Successor 的 canonical owner 是 POI & Exploration；V21 文件位置和路线任务文字不能据此把操作阶段归给 Quest。
- Expedition Loop 读取 World POI、`me`、`inventory`、死亡与营地状态，并直接写 `questText` 作为当前目标展示；这个字符串是展示输出，不是 Quest 状态 owner 的证据。它不负责位置、伤害、采集、网络和存档写入。成功回家时只尝试调用 HOME Workbench 的 `recordExpeditionReturn()` 一次。
- `modules/world/awakening-world-v1.js` 定义 MIRE MART 的地点、实体、交互和世界阶段资料。该世界阶段是 authored world metadata，不是完整主线章节或可变剧情状态。
- `modules/safe-camp/home-workbench-upgrade-v1.js` 拥有自己的 Field Rig tier/return-clearance 存储及材料结算；远征完成后才给它返程资格。Quest 不能自行加物品或设 Field Rig 状态。
- `modules/safe-camp/game-v7-patch.js` 和 `modules/ui/ux-cn-v11.js` 中还可找到旧目标文字/Guide 已交谈标记；最后的 V21 boot 顺序由 Awakening Expedition Loop 覆盖当前目标函数。不要把这些旧显示/标记误当作多个合法 Quest owner，也不要在 successor 清理它们之前删代码。
- `tests/awakening-expedition-loop-v1.test.mjs` 验证路线、早返、死亡重生、所需物资、一次性完成提示、接口边界和 loader 顺序；`tests/awakening-home-workbench-upgrade-v1.test.mjs` 验证完整返家如何解锁 Field Rig。它们证明局部路线逻辑，不证明完整任务/分支剧情或实际设备体验。
- 已有 `docs/content-inbox/2026-10-04-mire-mart-signal.md` 是关于商店信号的 **DRAFT / NOT IMPLEMENTED** 候选。它尚未被用户选择，不能宣称任务内容已确定。

**当前状态：**V21 有一个能跑局部远征流程的 PARTIAL 状态机与单独存档的 HOME 回报；没有确认到通用 Quest registry、任务日志、可靠的持久 quest state、支线/选择框架、章节演进或多人共享任务合同。这些都标为 **PLANNED / 未核实实现**。

## 3. 模块边界与唯一状态 owner

**唯一主责：Quest & Narrative。**目标 successor 中，该模块拥有任务定义、接受/拒绝/放弃状态、任务自身的叙事目标/选择状态、线索日志和一次性任务完成标记。它可把 POI 里程碑用作任务条件，但不保存 POI 旅行/抵达/搜寻/返家操作阶段的副本；World discovery、NPC 关系等状态仍属于各自 domain owner。

> **Canonical owner 表：**本卡中旧的 `World & POI`、`Combat & Creatures`、`Core Save & Persistence` 等表达已在下表按 canonical owner 拆开。后文如仍出现旧概括，只用于说明历史/接口背景；具体派工始终采用 [`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md) 的名称。

| 相邻模块 | Quest 如何协作 | Quest 不得做什么 |
|---|---|---|
| World & Terrain | 查询合法地点/坐标/碰撞事实 | 不自行宣布地点已发现、改坐标/碰撞/区域解锁 |
| POI & Exploration | 读取 POI 定义/发现信息，消费其确认的 operational visit/search/return milestones 作为 Quest 条件；操作阶段仍只由 POI 保存 | 不复制 expedition/search phases，也不自行宣布 POI 事实或改地点/碰撞 |
| Combat & Weapons / Creatures & AI | 消费经 Combat 确认的战斗事件和 Creatures 发布的一次 defeated 事实 | 不扫描 HP 推断死亡或直接发战利品 |
| Items & Inventory / Crafting & Processing / Loot & Rewards | Crafting 提供配方查询；任务奖励给 Loot 一个固定 reward ID，由 Inventory 执行库存变更 | 不直接读写 `inventory`、扣料或创建资源 |
| NPC & Social | NPC 提供可接受请求和对白；Quest 回答该请求状态 | 不拥有 NPC 人物名册、关系值、日程或对白显示 |
| HOME & Building | 返家之后向 workbench/营地升级服务请求已批准的 payoff | 不设置 Field Rig、建筑等级或 return-clearance |
| Survival & Needs | 读取/订阅生存阶段事实（若故事需要） | 不改 HP、饥饿、理智、死亡/重生规则 |
| Core State & Save | 提供版本化、可序列化的个人剧情片段；协调器负责实际读写/迁移 | 不让每个任务私自用一个 localStorage key；不假设当前 session-local 状态会跨重载保存 |
| Network & Co-op | 先明确任务是个人还是共同世界状态，再走批准接口 | 不把 Relay chat 当故事同步或共享持久权威；本卡不改协议 |
| UI & Map / Input & Accessibility | 显示 Quest snapshot，发送规范化接受/选择意图 | 不以字符串或按钮自身判定进度、发奖励 |
| Rendering & Camera / Animation & Presentation / Audio & Feel | 消费已确认的阶段变化，表现新目标/线索 | 不依据 VFX/SFX 动画完成剧情阶段 |
| Content & Localization / Integration & QA | 稳定 text key、内容验证、跨模块回归和设备验收 | 不把机器翻译或测试绿灯当叙事/可读性通过 |

上表是**规划中的职责**，不是对现有 API 的声明。对象名和事件名只是接口语义提案，须等 successor 的领域事件/状态模型落地后再定真实代码接口。

## 4. 任务数据与流程建议（设计阶段）

1. **任务定义：**稳定 ID、任务类型（主目标/可选请求/线索）、触发来源、前置条件、目标列表、文本 key、成功/失败分支、完成后的请求式 payoff。内容数据与通用规则分开。
2. **玩家任务记录：**`available / accepted / completed / declined / failed` 等有限状态；每个目标的判定来源和可重复性必须明确。不同模块同时发同一事件时按稳定事件 ID 去重。
3. **输入：**玩家接受、拒绝、选择或放弃任务，是有校验的命令；UI 无权直接把状态设为 completed。
4. **进度：**只使用相关领域 owner 发出的确认事件。任务先检查当前阶段/条件，再在一次逻辑结算中更新记录，避免同一帧或重复 Relay 包多次推进。
5. **奖励：**先检查 Quest 未完成与奖励请求唯一 ID，再调用真实奖励 owner；若失败，任务不能先标 completed 后丢掉奖励，也不能扣一半物品。
6. **持久化：**当前 V21 expedition 仅 session-local；新系统先决定个人任务记录是否保存。若需要保存，必须先有版本化 migration、旧档保留/回滚和损坏档处理方案，不能直接改 `abyssal_wake_save_v5`。
7. **多人：**默认明确标个人或团队共享。共享任务需定义 leader/冲突/重复事件/队员掉线/后来加入/任务奖励范围；在这些规则没有定案前，只做本地设计预览，不广播状态。
8. **叙事文字：**内容引用稳定 key，短目标与环境线索相辅；当前目标优先级有限，不让任务、聊天、地图标记、状态 HUD 同时争夺窄屏空间。

## 5. 首个任务切片：先整理现有路线，不复制第二份

**建议主线切片：**把 MIRE MART 调查与 Safe Camp 的返家成长读成同一条玩家经历：准备骨刃 → 沿北路抵达商店 → 搜查并处理危险 → 带回 2 个 shard → 回到 HOME → 看到 Field Rig 可升级的实际下一步。

V21 已有局部 operational expedition 状态机和 HOME payoff，后续不应重建第二条同名路线。Successor 的 **POI & Exploration** owner 承接地点、路线和操作阶段（准备/离营/抵达/搜寻/带回/返家）；**Quest & Narrative** 只建立一个叙事任务记录，保存接取/拒绝/完成与故事选择，并以 POI 的确认里程碑作为条件，不另存一套旅行/搜寻阶段。Items & Inventory 提供资源事实，Combat & Weapons / Creatures & AI 提供确认的遭遇结果，HOME & Building 提供 Field Rig payoff。`questText` 只是 V21 目标显示输出，不决定 successor 状态归属。先完成行为/接口映射，再做一条原创叙事内容。现有 `mire-mart-signal.md` 只是一个尚待决定的可选旁支方向，可以接在主线旁边，也可以搁置；不可把它算成已接受内容。

**故事气氛：**白天主要是停电商店、海潮留下的痕迹和居民的实际担忧；只在 optional clue 中出现一个无法由常规故障解释的细节。回家先体现有用生活变化，暂不强行出现 Boss、世界毁灭或满屏深渊。

## 6. 阶段计划与未来 AI 派工

### Quest-0：successor 接口/状态地图（只读）

核实 successor 当前入口与领域 owner；把 V21 Expedition Loop 的操作阶段映射给 POI & Exploration，再把它作为只读条件映射给 Quest & Narrative；另将 World POI、HOME upgrade、UI 目标文本和存档路径逐项映射到 successor 目标模块。输出一张来源/负责人/迁移风险/测试表；不改代码、不删除 V21。

### Quest-1：一个可读的主线 + 一个可选故事钩子（设计/原型）

以现有 MIRE MART route 为主线映射，围绕尚待用户选择的 `mire-mart-signal.md` 旁支候选做简短原创对白/环境线索，不增加第二个任务 owner、奖励表或 POI。先用文字线框与屏幕层级说明确认可读性和渐进恐怖节奏。

### Quest-2：successor 单任务状态与领域接口（单独实现任务）

仅在 successor 的状态 owner、命令/事件协议、UI 调用点和存档归属确定后，实施一条任务；为重复事件、无效目标、死后重来、提早返家/断线、领取奖励失败写回归。

### Quest-3：可选线索、居民请求和章节变化

每项单独评估，完成 Quest↔NPC、Quest↔World stage、Quest↔Co-op 合同后才扩充；每轮只加一个玩家可感知内容，不打包建完整分支任务编辑器。

### 给 Quest AI 的直接任务提示词

```text
你只负责《深渊苏醒》successor 的 Quest & Narrative 模块。先读 AGENTS.md、项目 Skill、PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md、本卡、Quest/World/Save 相关合同和现有测试。重新核对分支、HEAD、脏工作区、successor 实际入口；V21 文件只能作为旧行为参考。用户选择的是 3/4 successor 方向，原型画质尚未达标。

先映射当前 `ABYSSAL_EXPEDITION_LOOP_V1` 的 MIRE MART session-local 操作路线与 HOME Workbench payoff。Successor 中，POI & Exploration 拥有这条路线的抵达/搜寻/返家阶段；Quest & Narrative 只拥有叙事任务记录并消费确认里程碑。不要新建一条重复的 expedition phase machine 或第二份 V21 状态，也不要把 `mire-mart-signal.md` 草案说成已被用户选定。主责只限 Quest & Narrative；明确每个实际状态 owner 与接口后再做改动。

POI/地区事实与探索阶段归 POI & Exploration；叙事任务接取/选择/完成归 Quest & Narrative；mob 命中确认归 Combat & Weapons、mob HP/life 归 Creatures & AI；物品数量归 Items & Inventory、奖励请求归 Loot & Rewards；NPC 对话与关系归 NPC & Social；Field Rig 归 HOME & Building；HP/饥饿/理智归 Survival & Needs；持久化归 Core State & Save；UI & Map 只展示，Input & Accessibility 只提交规范化意图。保持 Relay 和旧 save 合同，不删 V21 文件；successor 通过接管和回归验收后才可单独审查旧文件退役列表。

本轮唯一交付：【填写一个任务接口/一条叙事内容/一个 bug 的明确小目标】。优先最小、可回退、能以真实玩家流程验证的切片。逐一测试成功、拒绝/失败、重复事件、早返/死亡、奖励结算和 UI 状态；将图像标为 DRAFT 直到 A+1 规格与真实 successor 桌面/手机画面通过。发现其它缺陷时记录证据，不顺手扩范围。

结尾用简单中文区分 VERIFIED / REPORTED / PLANNED / UNKNOWN，列出测试、浏览器/双人/手机未验证项和回滚边界。不覆盖/删除未知文件，不自动提交、合并或部署。
```

## 7. 高品质画面与叙事表现要求

- Quest 文本短而具体，使用现代城市可理解的词；避免难读的长台词、屏幕上同时出现多个标记或需要辨认微小符号才能继续。
- 任务标记、日志、地点牌、角色肖像和特效按 A+1 冻结的像素密度/素材合同制作；细节丰富但边缘锐利，按实际显示格检查，不用柔焦、随意缩小或粗马赛克补细节。
- 关键故事信息至少有一种不依赖颜色/音量的可读表达；对白字体、任务卡和地图标记要在 1280×720 与 390×844 窄屏检查，勿挡角色、可走路线、攻击按钮或交互目标。
- 阶段变化可以用高质量动画/音频突出，但视觉/声音只响应 `quest-stage-changed` 等已经确认的领域结果，不拥有完成 authority。
- 验收目标场景是真实 successor 的 HOME→MIRE MART→HOME 视角，不用孤立剧情卡、素材大图或旧预览页冒充游戏完成。

## 8. 本卡的验收标准和限制

1. 只有一个 Quest 状态 owner；POI & Exploration 单独保存 expedition/search 操作阶段但不复制 Quest 接取/完成/故事状态；背包、战斗、NPC、HOME 和存档也不各自保存一份 Quest 状态。
2. 成功、拒绝、提前返回、死亡、重复事件和奖励失败都有确定结果；同一完成/奖励不能重复结算。
3. 任务文案能解释出发目的和返家价值，支线可选，不提前透支深渊升级节奏。
4. 全部内容区分 DRAFT、已写入 successor、已运行、真实设备/多人通过；browser/mobile 缺证据就标 UNKNOWN。
5. 现有单元测试范围已知，不拿旧 V21 fixture 证明 successor 已完成。

本卡只建立模块边界与下一 AI 的输入；不实现通用 Quest 引擎、不新增/保存任务、不改变剧情、不修改存档/Relay/正式美术，也不授权删除旧 V21 文件。

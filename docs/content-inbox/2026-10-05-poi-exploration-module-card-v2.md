# POI & Exploration — 独立模块任务卡 V2

**状态：DRAFT / NOT IMPLEMENTED as an independent successor service**
**唯一主责：POI & Exploration**
**基线：**2026-10-05，本地 `fix/awakening-production-gate-qa-findings-v1`，HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。本轮只审模块边界、源码与相关回归；其它来源混杂的 dirty/untracked 工作区文件不作归因、不覆盖。

Canonical owner directory 在 [`SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)。本卡定义 successor 的 POI/探索目标；V21 现有路线仍叫 `ABYSSAL_EXPEDITION_LOOP_V1`，不因更新卡片而改代码或变更权威。

## 1. 玩家目标与五款参考游戏体验

玩家离开温暖的 HOME 后，应能认出附近值得去的现代城市地点，理解路上和地点内的风险，选择搜索、战斗、绕行或返家，最后带着有用东西/发现回家。地点探索是可读、可逆的小冒险，不该靠 QA teleport、地图文字或图片切换假装完成。

| 参考游戏 | POI/探索提供的原创玩家体验 | 未来实际验收信号（PLANNED） |
|---|---|---|
| Terraria | 小地点、地标和装备条件串出逐渐开放的探索阶段 | 玩家能从真实地标理解当前入口和下一条可选路线；工具条件有原因，发现状态不会只由镜头切换触发 |
| Don't Starve Together | 搜索有风险，玩家要决定准备、协作或撤退 | 进入前能读懂距离/威胁/回家路；撤退规则明确；夜晚和天气效果来自 Time/Survival 确认状态 |
| Minecraft | 同一世界留有玩家选择与营地布置空间 | 玩家可绕路、先采集或先回家，不因偏离主任务丢失 POI/世界事实；建筑空间由 HOME 决定 |
| Crashlands | 一处地点有清楚的小目标、可理解遭遇和有用收获 | 玩家能说出为何调查、需要什么、回家能做什么；命中/击杀/掉落反馈由 Combat/Creatures/Loot 各 owner 确认 |
| Stardew Valley | 反复回访地点与返家成长让世界有日常和社区感 | 已批准的 visit/discovery 记录跨任务边界稳定；居民请求可消费 POI milestone，但社区状态由 NPC/Quest/HOME owner 管理 |

以上是未来玩家体验标准，不是现有自动测试已覆盖，也不是五款游戏内容复制。地图、地点名、敌人、任务、资源和美术都需为 ABYSSAL WAKE 原创。

## 2. 当前 V21 事实：地点内容与路线状态分散

| 能力 | 当前活动源码观察 | 证据状态与限制 |
|---|---|---|
| MIRE MART 地点 | `modules/world/awakening-world-v1.js` 定义 north-road region、`poi:abandoned-convenience-store`、world anchor/size、entrance、parking、清理区域、collider、props/decals/FX 与 interaction/resource nodes | **VERIFIED：静态单地点内容混在 Awakening World 模块。**没有确认通用 POI registry、已发现目录或 discovery persistence |
| POI 定义 / discovery / attempt 区分 | 现有静态 store definition、玩家是否已知地点、此次旅程去过/搜过/是否带回，是三种不同语义 | **VERIFIED gap：**源码可见单地点定义和 expedition attempt；没有确认独立 discovery record/map reveal persistence。未来 owner 可都属 POI 模块，但 snapshot/schema 必须分开表达范围和生命周期，不能塞成一个含义模糊的 `poiState` |
| 探索路线 | `modules/world/awakening-expedition-loop-v1.js` 中 `ABYSSAL_EXPEDITION_LOOP_V1` 推进 7 个本地阶段：准备→离营→抵达→搜索/战斗→取得所需物资→返家→完成 | **VERIFIED：**这是当前 V21 的 operational expedition owner，`scope=session-local-slice`、`persistence=none-v1`、`authority=local-objective-state-only`；不是 successor 独立服务、Quest registry、服务端或团队共享权威 |
| 抵达判断 | Route 读取 `ABYSSAL_AWAKENING_WORLD_V1.poi`，按 store/parking 几何和当前玩家位置判断 `atMart` | **VERIFIED：**需处于对应地点/阶段；renderer 切场景本身不推进。具体位置和合法碰撞由 World/Spatial owner 提供 |
| 搜索/物资门槛 | 当前 expedition 读取当前客户端 `inventory.shard >= 2`；起始已有 shard 也计入。到 MIRE MART 并进入 SEARCH_FIGHT 后，下次更新即可因总数过线推进；没有 shard source ID、`poi interaction` 来源或 expedition 开始后的 inventory delta | **VERIFIED：现有 V1 规则。**它要求走到地点并返家，但**不构成 MIRE MART 搜索已发生的证明**。任务栏“带回 MIRE MART 物资”的 source attribution 没被状态机验证。这是已实现取舍/文字语义风险，不是已复现 bug；要改成必须当地搜到，需独立设计 POI/Interaction/Loot/Items 合同 |
| 交互/资源同步 | World V1 给出 POI resource nodes；V12 `harvestResource` 在本地改 inventory/save 并对非营地节点 broadcast harvest `rid/until` 冷却；玩家击杀路径仍在 Combat/Inbound 混合选奖/派发/改 inventory | **VERIFIED：混合 V21 链。**harvest 冷却广播不是 POI discovery，也不代表队伍共享 expedition phase；POI 不得自己加物品、判击杀或建立第二库存写点 |
| 任务展示 | World V1 有旧 objective wrapper，之后 Expedition 最终覆写 `updateQuest()`/目标栏 | **VERIFIED：**当前路线文字是 Expedition 展示输出，不是 POI discovery state，也不等于 Quest service |
| 返家 payoff | Expedition 完成时请求 `ABYSSAL_HOME_WORKBENCH_V1.recordExpeditionReturn()`；HOME 模块保存 return-clearance/Field Rig 材料与升级 | **VERIFIED：**Route 阶段仍不持久化；HOME 的独立返程资格可在其自身保存成功时持久化。二者不是同一条 POI save |
| 死亡/重载/多人 | Expedition attempt 内存状态在死亡后重试，但不写 save/Relay；不同 client 可处于不同阶段 | **VERIFIED contract：**不是共享任务或持久探索服务。真实双客户端冲突行为、晚加入/房主切换状态仍 **UNKNOWN** |
| successor preview | Guarded 3/4 preview 复用 V21 simulation/world data 并展示自然移动/碰撞切片 | **PREVIEW SCOPE ONLY：**自然路线 fixture 不证明完整 Expedition 的独立 successor 运行时、真实持久化/多人或正式 art 集成 |

## 3. POI owner 与相邻模块合同

**目标 owner:** POI & Exploration 拥有稳定 POI identity/definition、玩家/队伍可见的 discovery record、一次探索流程的 operational visit/search/return milestones。三者可由同一 domain owner 管，但定义、scope、authority 和生命周期必须分开。状态和条件只能写一份。当前 V21 还未物理按此拆分，也没有 discovery 持久化合同。

| Canonical owner | 唯一职责 | POI 如何协作 |
|---|---|---|
| POI & Exploration | 地点 ID/内容引用、availability/discovery、探索操作阶段和已确认 milestone | 对事实提供一个 snapshot/event；不保存第二份 Quest/Inventory/World 状态 |
| World & Terrain | world coordinate、region、walkability/collision、合法空间/LOS 查询 | POI 给 world anchor/尺寸/身份；World 验证合法空间，画面像素不决定抵达/碰撞 |
| Quest & Narrative | 个人/团队叙事任务接受、选择、完成与故事里程碑 | 消费 POI milestone，不复制 visit/search/return phase |
| Interaction & Gathering | 目标选择、距离、玩家交互意图、节点冷却请求 | 查询 POI context 后发出有效调查/采集 intent；不把“发现地点”自动等同于拿到道具 |
| Combat & Weapons / Creatures & AI | 攻击命中确认、怪物 HP/life 和一次 defeat | POI 提供遭遇地点 context；不轮询怪物 HP/自己判击杀 |
| Loot & Rewards | 来源资格、固定 reward definition/claim 请求 | POI 提交确认的搜索/发现来源事实，不直接 mint reward |
| Items & Inventory | 唯一管理 item count/stack/equipment 与原子库存变更 | 提供 shard snapshot 或应用奖励请求；POI 不写库存/save |
| HOME & Building | 营地、Workbench 和设施升级/返程 payoff | POI 在旅程完成后按现有批准接口请求 HOME result；不创建建筑状态 |
| Core State & Save | 已批准版本化 world/player 状态读写/迁移 | POI 状态持久化须经 Save 合同和迁移审查；当前没有 successor schema，不猜字段/保留期 |
| Network & Co-op | Relay transport 与明确的共享消息合同 | 只有先选定 shared authority、断线/加入/冲突语义后承载共同 discovery；不能把广播当服务器权威 |
| UI & Map / Input & Accessibility | 展示 POI snapshot/地图标识；规范化提交玩家意图 | 不 owns discovery/progression，不因 UI 地图点击冒充到达或完成 |
| Rendering & Camera / Animation & Presentation / Audio & Feel | 渲染世界位置、遮挡、探索/发现反馈 | 只读已确认事实；镜头淡入、动画/SFX 不改变 POI 状态 |
| Asset Pipeline / Content & Localization | 验证地点图像/稳定 content ID 与本地化 | 地图与店铺图片必须在真实视口清晰，但不决定 POI 存在/可进入 |
| Integration & QA | 跨模块路线/回归/可视证据 | 组合 HOME→POI→返回证据，不 owns 领域逻辑 |

“/”或“+”表示不同 owner 的协作，不是联合状态所有权。不同 POI、任务和奖励各自选择一个 lead 模块执行。

## 4. 未来的状态/事件合同草案

所有接口名均为 **PLANNED / 未实现 API**。POI definition 可引用 `poiId`, world anchor/content key 和进入条件；World/Interaction 提供合法到达/调查事实；POI 执行唯一的操作阶段状态转换并生成有稳定 identity 的 milestone；Quest 消费 milestone；Loot 校验奖励资格；Items 原子写入；Save 依批准版本存 POI discovery（若决定持久）；UI 读取只读 snapshot。

至少设计好这些规则后才能实现跨会话/多人状态：POI 是个人还是世界共享、何时可发现、重访/刷新、离线/掉线/晚加入、重复/乱序事件、存档失败恢复、奖励失败重试、房主迁移以及旧客户端兼容。当前仅有 V21 session-local expedition 和若干局部资源/冷却协议；不增加新 Relay payload 或 save key 作为捷径。

## 5. 地点体验与高画质验收

- 地点需有可读的视觉层级：远看能辨认目标 landmark，靠近能读入口/可交互物；墙、货架、门口和资源脚点应让 3/4 遮挡关系可信。昼夜/海岸氛围从普通现代城市开始，开局只用克制异常，不整屏紫色或触手。
- Modern High-Detail Pixel Art 必须在最终显示尺度检查；大图原始分辨率高不等于游戏画质高。tiles/props/sign/icon 在游戏内不能糊、粗马赛克、丢边缘簇或风格互相冲突。World 只承诺语义/位置，Asset Pipeline 和 Rendering & Camera 负责源格、锚点、投影采样和运行表现。
- **当前历史证据：**dated guarded 3/4 preview review 在 1280×720 与 390×844 报告地面/岸线重复或粗糙，角色/道具偏小、手机 HUD 占空间，整体 **REVISE**。报告绑定到它所审查的预览构建，不能推断当前 HEAD 或生产包相同；当前对应页面未在本轮重开，现状态 **UNKNOWN**。
- 将来在同一 build、同一 POI/route state 截取桌面 1280×720 和手机 390×844 游戏画面。验收路线和 landmark、实际可见世界范围、入口/标牌/交互节点、角色和 prop 脚点、sort/遮挡、道路到 POI 的连续性、tile seam/重复周期、源像素到目的像素锐度、HUD 和移动操作安全区。静态 atlas、拼图稿、fixture 与测试绿灯不能替代。
- 使用普通 controls 完成 HOME→离营→进入 POI→搜索/选择→返家；需要验证提早返回、死亡/重试和资源变化。QA teleport 只能定位某个测试状态，不算自然路线通过证据。
- 若资源或互动图像接入后模糊、碰撞/可走道路和画面明显冲突、POI 路牌难读、触控目标被 HUD 盖住，标 **REVISE**；缺双尺寸当前 build 实证标 **UNKNOWN / NOT ACCEPTED**。

## 6. 相关回归与安全修复规则

本卡撰写/路由任务需在实现时重新串行运行。测试通过范围不得外推成完整探索、联机或画质通过：

- `tests/awakening-expedition-loop-v1.test.mjs` — V21 七阶段、重复进入、提前返家、死亡、现有 salvage、单次完成；session-local route fixture。
- `tests/awakening-world-logic-hardening-v1.test.mjs` — MIRE MART geometry/collision/LOS/world wrappers/mob neighbor rules；非通用 POI/save service。
- `tests/awakening-home-workbench-upgrade-v1.test.mjs` — HOME return-clearance/upgrade persistence 邻接行为；非 POI discovery persistence。
- `tests/terrain-v21.test.mjs` — V21 slice/collision separation and movement boundaries；非 3/4 scene art acceptance。
- `tests/successor-natural-route-v1.test.mjs` — guarded 3/4 preview/V21 spatial route fixture；不能证明完整互动、Quest、奖励、实机触控或生产运行。
- `tests/successor-live-candidate-v1.test.mjs` / `tests/successor-live-screen-movement-v1.test.mjs` — candidate route/movement integration slices；核对当前入口/页面后使用，不把 QA state shortcut 当用户路线。
- `tests/successor-module-routing-contract-v1.test.mjs`, `tests/module-sort.test.mjs` — only routing/reconstruction/load order checks.

**Bug 流程：**明确步骤/状态/结果和可复现 fixture；标 CONFIRMED 前区分候选风险、设计取舍和真实错误。确认后只修一个 POI 行为，在原测试外再跑一个相邻 World/Interaction/Items/Loot/Save 回归，核实玩家体验没有倒退。工作区有未知来源修改时不改/删其文件；发现不属于 POI 的缺陷另开独立 owner 记录。

## 7. 分阶段派工

1. **POI-0：源码 owner map**（本卡）：只记录现有 World、Expedition、Interaction、HOME、Loot/Items、Save/Relay 与UI行为，不重建服务。
2. **POI-1：一个地点的内容/可读性片**：只设计或审核一个 POI 的 landmark/入口/调查目标；保持 DRAFT，附原生高清像素 brief 与双尺寸验证计划。
3. **POI-2：successor POI snapshot/discovery**：在明确 Save 与个人/共享语义后，仅建一个稳定 POI 记录和一次探索 milestone。
4. **POI-3：自然 HOME→POI→回家小循环**：普通玩家控制、一次搜索/奖励/返家效果，端到端做对照测试；不复制 Quest phase 或 Inventory。
5. **POI-4：扩大地点**：每轮一个地点和一个玩家可感知的新收益；先通过当前两个 target viewport 与邻接回归再扩量。

### 给后续 POI AI 的单模块提示词

```text
你只负责 ABYSSAL WAKE 的 POI & Exploration。先读 AGENTS.md、项目 Skill、PROJECT_CHARTER.md、PROJECT_STATE.md、SUCCESSOR_MODULE_MAP.md、本卡、MIRE_MART_EXPEDITION_LOOP_V1.md 和相关 tests；重新核对 branch/HEAD、dirty worktree、V21 loader 与 successor 实际入口。

唯一目标：【一个 POI identity/discovery/visit/search/return问题或一个地点内容草案】。唯一 lead owner：POI & Exploration。允许文件：【精确列出】。需读取/请求的邻接 owner：【World & Terrain / Interaction & Gathering / Quest / Loot & Rewards / Items & Inventory / HOME / Save / Network / UI中实际需要者】。禁止复制 Expedition、Quest、Inventory、碰撞、NPC或地图状态。

准确区分当前 ABYSSAL_EXPEDITION_LOOP_V1（V21 session-local operational phase）与 successor POI owner 的目标；当前 MIRE MART 流程用总 inventory.shard>=2，不证明碎片来自该 POI。不要将此设计取舍自行改掉。不得改 save/Relay schema 或测试以外的模块边界；若发现需求缺口先报告证据和owner。

bug需可复现后最小可回滚修改；运行POI主回归和一个相邻owner回归。普通控制自然路线和fixture区分。保留所有未知来源文件，不自动提交、合并或部署。

艺术/场景交付遵守Modern High-Detail Pixel Art；在真实同包1280x720和390x844画面比对原素材与显示尺寸，记录路线、seam、脚点/遮挡、像素锐度和控件空间。只有历史截图/原图/绿测试就写UNKNOWN；模糊、粗马赛克或明显重复写REVISE。最后用简单中文说明玩家收益、证据/测试、未验证项和回滚范围。
```

## 8. 明确不在本卡范围

不改世界坐标/碰撞owner、不建立通用 Quest/地图编辑器、不直接改 inventory 或奖励、不在 NPC/Dialogue 建 POI 完成状态、不增加 save/Relay 语义、不改变 HOME upgrade、不批量生成或接入生产地形/POI美术。本卡是设计合同，不是实现完成证明。

## 9. 相关资料

- [`MIRE_MART_EXPEDITION_LOOP_V1.md`](../contracts/MIRE_MART_EXPEDITION_LOOP_V1.md)
- [`Quest & Narrative V2`](2026-10-05-quest-narrative-module-card-v2.md)
- [`World & Terrain V2`](2026-10-05-world-terrain-module-card-v2.md)
- [`Loot & Rewards V2`](2026-10-05-loot-rewards-module-card-v2.md)
- [`AWAKENING_ASSET_CONTRACT.md`](../../AWAKENING_ASSET_CONTRACT.md)
- [`POI & Exploration V1 history`](2026-10-04-poi-exploration-module-card-v1.md)

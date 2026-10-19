# Survival, Time & Weather — 独立模块任务卡 V1

**状态：DRAFT / NOT IMPLEMENTED / 供用户审阅和后续任务分派**  
**目标：**把角色生存数值、昼夜时间、未来天气和生活内容切成独立职责，保留玩家的准备选择与逐步升级的恐怖感，避免一项天气/食物/农场改动意外牵动伤害、存档、联网或所有 NPC。  
**基线：**2026-10-04，分支 `fix/awakening-production-gate-qa-findings-v1`，HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。工作区脏且有来源未知的并行改动；本卡只记录静态源码证据，接手者必须重新核对。

> **归属说明：**本卡把数个邻接领域放在同一张规划卡里，不构成单一 owner。按 [`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md) 分开派工：**Survival & Needs** 管角色需求/效果，**Time & Weather** 管时间天气快照，**Farming & Food** 管生产资格。存档、物品、HOME、交互仍归各自模块；实施任务一次只选一个主责。

## 1. 五款参考游戏如何进入本模块

- **Crashlands：**状态变化和环境反馈要立刻让玩家看懂；生存系统不暗中改战斗判定。
- **Terraria：**白天/黑夜等世界条件可以逐渐打开新探索节奏和风险，但不应一开始就用满屏灾害阻止新手。
- **Minecraft：**玩家能选择怎么准备、用什么物品克服环境；生存规则鼓励自己的解决办法。
- **Don't Starve Together：**出发前看得懂饥饿、危险和天气线索；环境压力有预告、应对方法和可理解的失败后果。
- **Stardew Valley：**天气与季节未来可支持家园日常、种植和动物生活，但不要在远征/存档/食物循环尚未稳定前一次做整套农业模拟。

只借鉴体验原则，不复制原作天气事件、季节日历、温度公式、作物、UI、美术或音乐。

## 2. 当前 V21 事实快照

**VERIFIED（loader / 调用）：**`survival-v21.html` 当前加载顺序为 `modules/core/runtime-state.js` → `modules/survival/lifecycle.js` → `modules/survival/status.js` → `modules/main-loop/simulation-update.js` → `modules/combat/mob-combat.js` → `modules/survival/day-night.js` → renderer/scheduler → `modules/safe-camp/game-v7-patch.js`，之后才加载交互、Network/Art、POI 等扩展。`simulation-update.js` 每个有效 simulation tick 调 `applyLocalSurvival(dt)`；断开 zone channel 时当前模拟规则会受对应连接门控，不能另起独立天气计时继续扣玩家状态。

**VERIFIED（最终昼夜生效规则）：**`modules/survival/day-night.js` 先定义一版基于 `sessionStartedAt` 的 `nightLevel()`；后加载的 `modules/safe-camp/game-v7-patch.js` 再用 `phase()` 覆盖 `nightLevel()`，因此应从覆盖后的 V7 规则理解现时序，不能只读更早的文件就认定活动周期。当前 V7 规则：新会话先有 300 秒白天；之后循环 600 秒，其中 DAY 260 秒、DUSK 80 秒、NIGHT 160 秒、DAWN 100 秒。第一次 DUSK 在会话开始约 9 分 20 秒后开始（最初 300 秒加循环 DAY 的 260 秒），第一次 NIGHT 约在 10 分 40 秒后开始；之后每 10 分钟循环。会话进入时在 session-zone 路径重置起点；时间不共享、不过场景重进持久化，死亡 respawn 本身不重置时间。

**VERIFIED（当前生存）：**`modules/survival/status.js` 中 HP、hunger、sanity 是运行时角色状态。SafeCamp 被动恢复：HP +0.65/sec、sanity +2.1/sec、hunger -0.018/sec；野外 hunger -0.095/sec，sanity 每秒基础 -0.009 再加 night-level 系数 0.055；携带 lantern 将该耗损乘 0.43；220 世界单位内每只存活 watcher 再加 .10/sec，其他 mob 加 .032/sec；hunger 为 0 时 HP -1.7/sec，sanity 为 0 时 HP -.26/sec。此为当前代码基线，不代表平衡已做过试玩验收。

篝火主动休息在活动 `interaction-v12.js` 路径由 12 秒 cooldown 控制，每次恢复 HP +24、sanity +34，结果调 `saveLocal()` / `updateUI()`。V7 compatibility patch 也包含另一份旧式交互/rest 代码；改之前须实际追踪 loader 后 button 绑定与有效 handler，不能把旧处理器数值误报为当前体验。

**VERIFIED（死亡 / 保存）：**`modules/survival/lifecycle.js` 的死亡处理会将 wood/stone/food 各损失约 20%、shard 损失约 25%（向下取整），然后保存；respawn 回 SafeCamp 周围，HP=100、hunger=78、sanity=100，获得 5 秒 invulnerability 并保存。主玩家 V5 本地档案保存 HP/hunger/sanity/库存等，但不保存昼夜阶段、天气或季节。Expedition V1 有自己的 death/retry 阶段，不应由天气或 hunger 状态替它判断远征完成。

**PLANNED / 未确认：**当前没有可核实的天气/季节/温度/风暴/降雨系统，也没有农场、作物周期或农场动物功能。地图视觉上的水/草颜色不代表气候规则。`modules/survival/gameplay-v9.js` 有旧式准备状态、威胁标签和远征统计 key `abyssal_v9_gameplay`，不拥有 hp/hunger/sanity、昼夜 phase 或天气；不得让它成为第二份生存真相。

**UNKNOWN：**以上规则对新手是否公平、长时间游玩是否舒适、用户真实感受的节奏、夜间画面/音效和真实手机体验；本卡未运行游戏或测试。

## 3. 单一 owner 设计

| 模块 | 拥有状态 | 配合方式 | 不负责 |
|---|---|---|---|
| Survival | HP/hunger/sanity、被动耗损/恢复和明确的 survival effect 语义 | 读取 Time phase、World exposure、已确认 mob proximity；Food 使用请求先验证物品并调用 Survival effect | 自行扣库存、定义天气阶段、决定 POI/任务或敌人行为 |
| Time & Day-Night | 当前本地 session clock 与 phase（day/dusk/night/dawn）的唯一快照和读取接口；未来共享 world clock 另立合同 | Simulation 驱动 tick；Survival/Renderer/Audio 读取 phase；新玩法请求只读时间 | 角色生存数值、天气随机性、改多个文件覆写 nightLevel |
| Weather & Climate（未来） | weather kind、forecast、duration 与版本化状态（先明确 session/local/persistent） | Time 提供 clock/seed；World 提供地区暴露信息，Weather 按地区查询；Renderer/Audio 展示；Survival 只接受明确定义且预告的效果 | 自己拥有或修改地区暴露、伤害玩家、改移动/碰撞、生成战斗/搜刮奖励或私写存档/Relay |
| HOME / Rest Interaction | 安全区、设施位置/可用条件、休息命令 | Interaction 验证命令/距离与 cooldown；向 Survival 请求恢复效果 | 重复一套 HP/sanity/hunger 结算公式 |
| Core Character Lifecycle / Death | 死亡/respawn 流程、触发死亡结果；Inventory owner 处理具体物资变化 | Survival 报告 HP 归零；Save owner 保存角色快照；Expedition 观察死亡结果并开新尝试 | 天气的死亡惩罚或自有库存副本 |
| Farming & Food | 未来作物/畜牧周期与农场产物（独立 owner；细节见 canonical module map） | Time & Weather 提供只读状态；Items & Inventory 储存产品；Survival & Needs 应用食用效果 | 把 farm animal 当 companion、天气直接发资源或直接修改角色状态 |
| World / Region | 区域边界、室内/室外、遮挡与气候暴露查询的唯一 owner | Weather 按 region id 读取查询结果；World 不保存天气预测 | 决定天气种类/预报/时长，或由 Weather 复制一份地区暴露状态 |
| Core Save / Network | 当前玩家 V5 保存；Relay 当前 session 消息范围 | 只有批准迁移/共享合同后才承载新状态 | 把当前每个客户端本地 session clock 描述为统一世界时间 |

接口方向：

```text
Time ──phase snapshot──▶ Survival / Weather / Renderer / Audio
Weather ──validated climate snapshot──▶ Survival (若后续获批规则明确要求)
World ──exposure/zone query──▶ Weather
HOME / Interaction ──rest request──▶ Survival
Items / Food ──preflight + consume intent──▶ Survival effect
Survival (HP reaches zero) ──death request──▶ Core Character Lifecycle
Renderer / Audio / UI 只读相应 snapshot；Core Save/Network 保留自己的 schema/authority。
```

以上 API 只是建议语义，不能假设现在已有 Weather 服务、统一 clock API 或 NPC/农场接口。

## 4. 一条新的 Weather 内容切片建议（待审）

### WEATHER-1：海雾预报 — 纯表现原型

HOME 的旧海事广播在出发前提示“北路晚些时候可能有薄雾”。到北路后出现短暂、薄而不遮挡关键通道/角色的海雾变化；雾退去后场景恢复。第一版只改变可读的环境氛围和轻柔环境声，不降低可视距离到误导、不影响碰撞/移动/敌人感知/HP/hunger/sanity/掉落/任务/存档/Relay。具体时间和数值需做小 prototype 后再选，不能直接写死为 production 规则。

它吸收 Don't Starve 的“出发前听懂风险”和 Stardew 的“天气让日常世界有变化”，再用 Terraria 探索期待与 Minecraft 的准备选择服务本作现代海边 HOME→OUTSIDE 循环；不复制任何原作天气事件。

**这个创意的审美重点：**保留现代道路、公交站/便利店灯光、人物轮廓与可走路线的清晰度；薄雾通过分层低对比像素雾带、局部灯光散射和柔和海风底音营造，而不是全屏灰遮罩或噪点。仍须使用项目 Modern High-Detail Pixel Art 视觉标准，关闭不合适的平滑缩放，并在 V21 当前 renderer 的真实画面/手机比例下检查。

天气本身先作为单独 Weather owner 输出只读快照；Time owner 选一小段可控 phase，World 提供室外暴露查询，Renderer/Audio 订阅；不碰物理/视距/生存规则。没获用户保留前仍只是 DRAFT。

## 5. 分阶段模块路线

1. **LIFE-0 只读权责图：**核对 V21 最终存活的 phase/nightLevel 函数、被覆盖的旧函数、存档/死亡/rest handlers、simulation connect gate；列出谁持有哪项状态。
2. **TIME-1 时钟合同：**不改变现有周期，只设计唯一 phase snapshot/query 和边界条件测试，确认 session start、重连、respawn、tab suspend 的语义。
3. **WEATHER-0 天气内容卡：**用户保留后，定义天气状态 scope、forecast/readout、持续时间、地区暴露、视觉与音频边界。
4. **WEATHER-1 海雾表现原型：**使用隔离预览或单一事件回调做一段不影响玩法权威的可见天气变化；检查清晰度与性能，不修改正式画面或天气影响规则。
5. **SURVIVAL-1 可选环境效果：**只有薄雾可读、用户认可且 Survival/Time/Weather 接口有独立回归后，才讨论风寒/饥饿/理智等规则；必须有预告、反制和新手能理解的恢复路径。
6. **FARM-0 / FOOD-0：**另开 Farming & Animals 以及 Food/Consumables 任务卡；分别定义产出状态 owner、堆叠库存、烹饪条件和原子消费/效果，不并入天气代码。
7. **持久化 / Co-op：**需要季节日历或多人同步时，另立 Save/Network 权限与迁移合同；当前目标不授权改 v5 或 Relay。

## 6. 验收与回归

天气切片如果被用户选中，最低回归范围：

- DAY/DUSK/NIGHT/DAWN 的边界、session 开始、死亡 respawn、换区、断开/重连和长 tab suspend 均得到明确可复现语义；没有测试的特殊时序写 UNKNOWN。
- 只有一个活跃 time/Weather owner；重复加载/重试不会装上第二组 timer/listener，也不会出现两种互相冲突的 `nightLevel()`。
- SafeCamp 被动恢复、篝火距离/cooldown/rest 恢复、野外 hunger/sanity drain、lantern modifier、mob proximity、死亡损失与 respawn 状态保持；本卡 Weather-1 默认只做表现，不碰这些规则。
- `abyssal_wake_save_v5` 的 hp/hunger/sanity/物品和 V4 migration 不被格式重写；时间/天气若将来要保存，单独设计版本、回退和损坏档处理。
- `zoneConnected` 停止 simulation 时，不产生独立 survival/weather tick 继续让玩家掉状态；无需另造游戏主循环。
- 夜景/雾不遮挡玩家/敌人/门/资源/危险提示，画面缩放无模糊、粗马赛克或细节损失；混音不压住对白/战斗，用户可以理解预报。
- PC/mobile/双客户端和环境音实测没有证据时标 UNKNOWN；纯 VM 测试和人工概念图不能代替实际画面体验。

**可重用的相关回归：**`tests/core-smoke.test.mjs`（真正执行 status.js 的 SafeCamp 与 daylight 小场景，但 nightLevel 固定 stub 为 0）；`tests/interaction-v12.test.mjs`（互动/休息边界）；`tests/player-save-v5-migration.test.mjs`；`tests/awakening-expedition-loop-v1.test.mjs`；`tests/awakening-home-workbench-upgrade-v1.test.mjs`；`tests/network-disconnect-simulation-pause.test.mjs`（目前文件来源未知，需重读并复测）；以及未来新增的 phase/time/weather 专测。当前未见专门覆盖 V7 日夜阶段边界、完整 survival multiplier 组合或真实天气显示的测试。

## 7. 交给未来 AI 的单模块目标

```text
你本次只负责《深渊苏醒》的【Survival / Time & Day-Night / Weather / Farming & Animals 中一个模块】。先读本卡、PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md、V21 loader、当前 save/interaction/simulation owner 和相关测试，然后核对 branch、HEAD、脏工作区及函数覆盖顺序。

唯一目标：【LIFE-0/TIME-1/WEATHER-0/WEATHER-1/SURVIVAL-1/FARM-0 中选定的一项】。主责模块：【一项】；依赖接口：【明确列出】；允许编辑文件：【逐个列出】。不要把 weather、farm、survival、time、save、UI、Relay 写成一个大系统。

查清真正生效的后加载实现，尤其 day-night.js 的早期函数会被 SafeCamp V7 patch 覆盖。Survival owns HP/hunger/sanity; Time owns phase; Weather 不直接扣状态/改碰撞/发奖励；Home/Interaction owns rest command/range; Lifecycle handles death/respawn; Inventory/Save/Network 保留各自权威。

先列实际状态 owner、复现步骤、回归风险与测试基线，再做一个根因的最小改动。保护所有用户文件、存档和脏工作区，绝不删除/重置/覆盖。串行运行对应 Node 回归并审阅完整 diff；若产生新失败先停下来隔离回归。浏览器、手机、音频或双客户端没测就如实写 UNKNOWN，不自动提交/合并/部署。

用简单中文报告玩家会感受到什么、真实验证了什么、没验证什么，以及推荐下一步。Weather/art 候选未过实际运行画面的清晰度门槛前只算 DRAFT。
```

## 8. 交接导航

- [总模块化玩法开发蓝图](2026-10-04-modular-gameplay-development-blueprint-v1.md)
- [World, POI & Exploration 模块卡](2026-10-04-world-poi-exploration-module-card-v1.md)
- [Items, Inventory & Crafting 模块卡](2026-10-04-items-inventory-crafting-module-card-v1.md)
- [潮汐谐振器 DRAFT](2026-10-04-draft-tide-resonator-module-item-v1.md)
- [Combat & Weapons 模块卡](2026-10-04-combat-weapons-module-card-v1.md)
- [NPC & Social 模块卡](2026-10-04-npc-social-module-card-v1.md)
- [Pets & Companions 模块卡](2026-10-04-pets-companions-module-card-v1.md)

**本卡是设计/交接草案。本轮没有改运行时代码、时间规则、存档、Weather、音频或生产美术。**

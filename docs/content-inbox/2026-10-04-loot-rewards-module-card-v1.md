# Loot & Rewards — 单一模块任务卡 V1

**状态：DRAFT / NOT IMPLEMENTED / 模块合同提案**  
**主责模块：Loot & Rewards**  
**目的：**把“击杀/调查/任务完成后给什么”从怪物 AI、POI 图片、UI 和背包写入代码里分离出来，避免重复发奖、错误发奖和状态 owner 不清。本文不批准任何存档迁移、Relay payload 变化、素材接入或运行时代码改动。

## 1. 五款参考体验的原创转化

- **Crashlands：**战斗成果用途清楚，少量奖励推动下一步准备。
- **Terraria：**奖励能提示新的探索方向，但不靠无止境掉落堆数量。
- **Minecraft：**奖励支持玩家改进自己的 HOME 与装备选择。
- **Don't Starve Together：**奖励值得冒险取得，同时不消除出行风险或队伍分工。
- **Stardew Valley：**任务/社区成果能帮助营地成长；奖励不替代居民关系和日常本身。

仅借鉴体验，不复制原作物品、掉率、配方、UI、美术或奖励表。

## 2. 当前源码状态（静态检查）

- `modules/combat/player-combat.js` 中存在 `rewardKill()`；`modules/network/inbound-events.js` 中存在 `onLoot()`，将 shard/food 直接加进 `inventory` 并保存/刷新 UI。
- `modules/input/interaction-v12.js` 的 `harvestResource()` 修改 `harvested` 冷却；资源节点的输入资格、共享 harvest 通知与本地库存变化分布在交互/网络路径中。
- 没有独立 `loot` 或 `reward` runtime service 文件。以上 dirty-worktree 内容的来源未知，只描述现有快照，不视为设计批准或当前正式协议。
- `mobId`、`hitCd`、`hitCdUntil` 等额外战斗 payload 字段在项目状态中明确为 **UNAPPROVED FOR INTEGRATION**；本卡不得推广或批准它们。

因此，Loot & Rewards 当前是**需要明确 owner 的设计边界**，不是已经存在的完整系统。

## 3. 唯一职责与接口

Loot & Rewards 拥有：

- 奖励来源 ID、合法奖励条目和原创奖励表。
- 某次已确认事件是否有资格领奖、结算出的奖励清单，以及防止同一 request 重复领奖所需的唯一 claim key。
- 对异常、重复、无效或超额请求作安全拒绝并留下可诊断结果。

它不拥有：怪物 HP/死亡判定、Quest 完成资格、POI/资源节点位置与碰撞、玩家库存/装备、存档版本、Relay 传输、奖励图像或 UI。

| 上游请求 | 负责确认的 owner | Loot & Rewards 的工作 | 最终写入 owner |
|---|---|---|---|
| 怪物奖励 | Creatures & AI 在接受 Combat & Weapons 的伤害后发布一次 defeat 事件 | 校验 source/claim，按奖励定义给出一次奖励清单 | Items & Inventory |
| 任务奖励 | Quest & Narrative 确认目标完成并给 reward ID | 校验该 reward ID 和唯一领取条件；不重新判断 Quest 阶段 | Items & Inventory |
| 搜刮/节点产物 | Interaction & Gathering 确认有效操作；World/POI 确认目标存在 | 按已批准节点定义提供固定或配置奖励，不接受 UI 自报数量 | Items & Inventory |

概念输出仅为 `AwardDecision { claimKey, sourceId, itemDeltas, result }`；这不是现有 API，也不是 Relay 格式。调用方不能绕过 Inventory 直接应用库存变化。跨客户端 claim authority 未设计前，明确限定为既有可验证的本地/session 范围，不能声称抗作弊或持久共享。

## 4. 美术与表现边界

奖励图标/地面可见物由 Asset Pipeline 管理稳定 ID、源尺寸、透明边缘、像素密度和 anchor；Rendering & Camera 决定目标视口下清晰显示；Loot & Rewards 只引用 item/reward ID。使用原创 Modern High-Detail Pixel Art，在实际 UI 与世界比例下保持锐利、轮廓可辨、颜色层级足够；模糊、粗马赛克或细节丢失标 **REVISE**。图片、动画、闪光或 UI 数字不能使奖励生效。

## 5. 阶段与验收

1. **LOOT-0 只读审计：**重查 V17 当前首页路径、V21 loader、`rewardKill`、`onLoot`、采集节点、保存和 Relay 事件，画出写入点/谁有权确认。不同入口分别标记，不能只审 V21。
2. **LOOT-1 纯逻辑决策：**若经选择进入实现，先测有效/无效 source、重复 claim、未知 item、超限数量与请求冲突；不改网络/存档/运行时画面。
3. **LOOT-2 单一来源接入：**选一个当前怪物或节点奖励，接至 Inventory 的单次事务路径；保持现有公开 payload 和本地 save key 不变，除非后续单独批准合同迁移。
4. **LOOT-3 画面交付：**关联一项清晰原创掉落图标/拾取表现候选；在 1280×720 与 390×844 实际运行画面审查，不以 asset load 或生成图代替验收。

必须验证命中/挥空边界、同一击杀不重复领奖、死亡/重生、重复交互、资源冷却、HUD/库存一致、保存行为和相邻任务奖励。真实 Relay、双客户端、移动设备和 production art 若未测，标 **UNKNOWN**。每次只一个源事件，不顺手重做 Item Catalog、Quest、Inventory 或 Relay。

## 6. 相关材料

- [Canonical module owners](../SUCCESSOR_MODULE_MAP.md#canonical-module-owners)
- [Items & Inventory / Crafting card](2026-10-04-items-inventory-crafting-module-card-v1.md)
- [Combat & Weapons card](2026-10-04-combat-weapons-module-card-v1.md)
- [Creatures & AI card](2026-10-04-creatures-ai-module-card-v1.md)
- [World, POI & Exploration card](2026-10-04-world-poi-exploration-module-card-v1.md)
- `modules/combat/player-combat.js`, `modules/network/inbound-events.js`, `modules/input/interaction-v12.js`

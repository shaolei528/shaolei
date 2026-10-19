# Survival & Needs — 独立模块卡 V2

**状态：DRAFT / NOT IMPLEMENTED as a separated successor service**  
**唯一主责：Survival & Needs**  
**V2 replaces the V1 routing card; V1 is kept as history.**  
**Owner directory:** [`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

## 玩家体验目标

学习《Don't Starve / Don't Starve Together》“压力能看懂、出发前能准备”的体验：在 HOME 看懂生命、饥饿、理智与风险；带着合适食物和照明去 OUTSIDE；收到危险提示后有机会撤退；回家休息或补给。参考游戏只提供体验启发，不复制其角色、画面、数值或惩罚。

## 本次核实的 V21 事实

这些是当前本地 V21 源码行为，不代表新 successor 服务已实现；对动态行为的判断须重新沿 `survival-v21.html` loader 验证。

| 事实 | 当前来源 | 状态与边界 |
|---|---|---|
| 玩家拥有 `me.hp`、`me.hunger`、`me.sanity`；V5 save 保存这三项。 | `modules/core/runtime-state.js`; `survival-v21.html` | VERIFIED。Core State & Save 管读写和迁移；不定义数值规则。V5 key/schema 不属于本卡。 |
| 本地生存模拟在 HOME 每秒恢复 HP `0.65`、理智 `2.1`，饥饿减少 `0.018`；OUTSIDE 饥饿减少 `0.095`。理智消耗由夜晚、灯和 220 范围内的存活怪物影响。饥饿/理智归零后分别每秒损失 HP `1.7` / `0.26`。 | `modules/survival/status.js::applyLocalSurvival(dt)` | VERIFIED source + `core-smoke` fixture。`dt` 以秒计；不要悄悄改率、边界或将图像表现用作模拟权威。 |
| 主模拟只在 `started && zoneConnected` 时推进；dead 玩家不再跑移动和本地 needs 更新。 | `modules/main-loop/simulation-update.js::update(dt)` | VERIFIED。离线暂停是既有行为；不要在抽取模块时让饥饿/理智离线继续流逝。 |
| `onAttack` 当前扣玩家 HP 并在符合条件时调用 `die()`；`onMobHit` 当前同时扣玩家 HP 和理智，也会调用 `die()`；这些状态写入仍混在旧事件适配器里。 | `modules/network/inbound-events.js` | VERIFIED source；这是 V21 客户端行为，不证明服务器权威或公平的双客户端战斗。目标是 Combat 产生已确认伤害，Survival 应用玩家 needs 变化；Network 只传输既有事件。 |
| 食用两份食物会加饥饿 `48`、HP `10`；需要背包/工作台情境，库存事务保存失败时回滚 needs 和物品。 | `modules/survival/needs-consumption-v1.js::eatFieldMeal()`; `modules/crafting/crafting-processing-v1.js`; `modules/items/inventory-transactions-v1.js` | VERIFIED。Inventory 单独拥有数量和事务；Survival 单独计算营养效果；Crafting/Interaction 只发请求。 |
| V12 篝火休息有 12 秒冷却，恢复 HP `24`、理智 `34`。 | `modules/input/interaction-v12.js::restAtFire()` | VERIFIED source。它是当前互动入口中的效果，不代表效果规则应该继续归 Input 所有。 |
| 死亡转换把 HP 设为 0，当前 V21 还在同一 handler 扣木材/石头/食物各 20%、碎片 25% 并保存；复活恢复 HP `100`、饥饿 `78`、理智 `100`、给 5 秒伤害保护并重设位置。 | `modules/survival/lifecycle.js::die()` / `respawnBtn`; `modules/safe-camp/game-v7-patch.js` | VERIFIED source，所有权混合。Survival 应拥有 HP=0/death state 和 needs 恢复规则；Items & Inventory 应执行获准物品变化；HOME/World 应决定并验证安全重生点；UI 显示。不要由 Survival 自己扣库存或推断重生碰撞。 |
| `modules/survival/status.js`, `needs-consumption-v1.js`, `lifecycle.js` 与 `modules/safe-camp/game-v7-patch.js`、`modules/input/interaction-v12.js` 都参与相关边界；loader 的先后顺序影响最终活动入口。 | `survival-v21.html` | VERIFIED。只按文件名判断主责会误读覆盖顺序。V12 会 clone 并替换旧 `#useBtn`；不要把 Safe Camp patch 上旧按钮的 listener 当作 clone 后仍有效。改 handler 前要用入口级测试确认实际触发次数。 |

## Canonical 所有权与接口

**Survival & Needs owns:** 玩家当前 HP、饥饿、理智；恢复、营养、暴露/饥饿/理智归零后果；从存活到死亡的状态转换；已确认死亡后的 needs 恢复值。死亡状态属于 Survival 语义，但它不使 Survival 获得全部死亡流程的其他数据所有权。

- **Combat & Weapons** 确认攻击和玩家受到的伤害量/事件；Survival 才应用到玩家 needs。Creatures & AI 拥有怪物 HP/life，不能让怪物或伤害展示直接改玩家状态。
- **Network & Co-op** 只运送获准事件/快照，不拥有伤害规则或在线权威。保持当前 Relay event、payload、频率和 V5 save 不变，除非独立批准相应合同变更。
- **Items & Inventory** 验证并提交消耗、掉落/死亡惩罚库存变化；Survival 传入效果请求，不直接写 `inventory.*`。
- **Time & Weather** 提供时间与天气快照；**World & Terrain / Creatures & AI** 提供暴露、区域与附近威胁事实；Survival 决定其对玩家状态的规则。
- **HOME & Building / World & Terrain** 决定并验证休息位置和安全重生坐标；**Input & Accessibility / Interaction & Gathering / Crafting & Processing** 发送已规范化的休息或食用请求。
- **Core State & Save** 按原 schema 保存/加载已确定的状态；**UI & Map / Animation & Presentation / Audio & Feel** 读取状态或已确认事件，不自建第二份 HP/饥饿规则、不暗中造成伤害。

建议 successor 接口先保持很小：`applyConfirmedDamage(effect)`、`applyRecovery(effect)`、`tickNeeds(environmentSnapshot, dtSeconds)` 和 `getSnapshot()`。这是 **PLANNED interface**，目前除 `ABYSSAL_SURVIVAL_NEEDS_V1.eatFieldMeal()` 外，没有证据表明这些 API 已存在。不得为它们另建新的 hp/hunger owner 或改成新 Relay 协议。

## 分阶段派工与文件边界

这张卡仅能指导一次一个的小任务；当前不授权大规模物理拆分。

1. **Audit only:** 记录本次 loader、handler、状态写入者、调用者和相关回归；找到有效 death/respawn 与 rest/family meal 路径。
2. **One rule per implementation task:** 例如只将篝火恢复结算转到 Survival API；保留旧入口作 adapter；由调用者传请求，Survival 返回结果，Items/Core 按自身接口处理。
3. **Later extraction:** 每次只抽一个唯一状态写入点；禁止同时重做 Combat、死亡 UI、世界重生、存档和 Relay。

可能读取/后续候选文件：`modules/survival/status.js`, `needs-consumption-v1.js`, `lifecycle.js`, `modules/network/inbound-events.js`, `modules/main-loop/simulation-update.js`, `modules/input/interaction-v12.js`, `modules/safe-camp/game-v7-patch.js`, `modules/items/inventory-transactions-v1.js`, `modules/core/runtime-state.js`, `survival-v21.html`。此列表是**核对清单，不是一次任务的修改许可**。新手无需挑文件或诊断；执行 AI 要先报告一个主责和精确范围。

## 回归验收

- Focused: `tests/core-smoke.test.mjs` (HOME/OUTSIDE rate and recovery); `tests/crafting-processing-v1.test.mjs` (food transaction and failed-save rollback).
- Neighbor: `tests/field-ward-duration-regression.test.mjs`; `tests/network-disconnect-simulation-pause.test.mjs`; `tests/player-save-v5-migration.test.mjs`; relevant Combat / mob-hit tests; `tests/module-sort.test.mjs` and loader-order contract.
- New extracted path must prove: HP/hunger/sanity remain within documented bounds; zero thresholds transition once; pause/reconnect do not add an extra tick; one local meal/rest request produces one effect and one inventory transaction (this is not a claim of network exactly-once delivery); failed save restores all participating state; a death-penalty save failure leaves death state and inventory consistent; death penalties have one Items owner; respawn position passes World/HOME validation; Safe Camp protection and current V5 data remain unchanged.
- A source/VM PASS is not browser/gameplay acceptance. If HUD/status/icons, authored food visuals, death overlay or respawn feedback change, follow `ART_BIBLE.md` and successor map: sharp Modern High-Detail Pixel Art at actual `1280×720` and `390×844`; validate native pixel density, source/display size, alpha/anchor where relevant, HUD fit and obstacle readability. Blurry, coarse-mosaic, undersized or detail-losing results are **REVISE / BLOCKED**. A system-only task needs no invented art.
- Real Relay, two-client damage, device play and full HOME → POI → combat/salvage → return loop remain **UNKNOWN** unless exercised and captured.

## V1 history

The unindexed V1 card incorrectly excluded death/recovery lifecycle without assigning its state transition. V2 resolves the boundary: Survival owns the player needs/dead-state semantics; Inventory, HOME/World, UI, Core Save and Network keep their own data and effects. Keep the V1 file for history; do not route future work through it.

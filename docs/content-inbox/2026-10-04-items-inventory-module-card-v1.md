# Items & Inventory — 独立模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED as a separated successor service**  
**唯一主责：Items & Inventory**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

## 玩家目标

玩家能清楚知道带了什么、装备了什么、还缺什么；搜刮和制作的资源变化可信且不会重复。库存变化要支持“HOME 准备 → OUTSIDE 搜刮 → 回家制作/升级”。

## 唯一状态归属

物品 ID/定义、堆叠数量、装备槽、容量规则及原子增减由本模块拥有。其他模块只提交带来源的增减请求；Inventory 校验并应用。背包 UI 只读快照，不可直接写全局库存。

**不拥有：**配方（Crafting & Processing）、奖励资格（Loot & Rewards）、交互距离（Interaction & Gathering）、角色属性（Character & Progression）、营养效果（Survival & Needs）、HUD（UI & Map）、存档迁移（Core State & Save）或 Relay。

## 接口草案

- 读取：只读 `InventorySnapshot`，含物品 ID、数量、装备和容量状态。
- 写入请求：`InventoryDeltaRequest`，带来源/请求身份、增减项及拒绝原因；消费/制作应原子提交，失败不得扣一半。
- 输出：一次且仅一次的已接受变更事件，供 Save/UI/Audio/Animation 观察。
- 以上为设计合同，**不是当前 API**；先映射当前 V21 的实际写入点及保存顺序。

## 实施验收

1. 从 V21 loader 找齐所有背包写入/读存档入口和快捷栏消费者；查重复/超堆叠/负数/失败半提交。
2. 覆盖 add/remove/equip/满格/无效 ID/重放请求的单元回归，并跑相邻制作、掉落、存档迁移和 Relay 旧 payload 测试。
3. UI 与快捷栏显示一致；若物品图标重绘，按原生密度和清晰缩放在 1280×720 与 390×844 看真实运行画面。未看 runtime 标 UNKNOWN。
4. 不更改存档格式、事件名或 Relay payload；确需变更时拆成新目标单独评审。

## 下一位 AI 的任务模板

一次只选一个可复现的库存问题。写明基线 branch/HEAD、owner、允许文件、读取/写入接口、排除模块、回归命令和未验证项。保留共享工作区已有改动；不得为了“整理”删除文件。

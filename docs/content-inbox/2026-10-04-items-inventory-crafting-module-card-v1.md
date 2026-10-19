# Items, Inventory & Crafting — 独立模块任务卡 V1

**状态：DRAFT / NOT IMPLEMENTED / 供用户审阅和后续任务分派**  
**目的：**为物品、玩家库存和制作建立一个清楚的状态 owner 与交易接口，让“准备出发 → 探索搜刮 → 带资源回家 → 制作/成长”可以逐步扩展，同时保护现有存档、战斗、掉落和联机行为。  
**基线：**2026-10-04，分支 `fix/awakening-production-gate-qa-findings-v1`，HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。工作区有大量来源未知的改动；本卡只使用静态源码和文档证据，接手者必须重新核对。

> **归属说明：**本卡是跨模块概览，不是单一主责派工卡。按 [`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md) 拆分为 **Items & Inventory**（数量、装备、原子增减）和 **Crafting & Processing**（配方、加工）；需要交互时另由 **Interaction & Gathering** 发起请求。任何具体实施必须只指定一个主责模块和对应文件范围。

## 1. 为什么这是下一块

它把参考游戏的经验收进同一个玩家循环：

- **Crashlands：**资源有明确用途，打败/探索的收获能推动下一步制作。
- **Terraria：**少量装备与材料门槛能打开新路线；先有清楚用途，再增加数量。
- **Minecraft：**物品、工具与 HOME 工作台帮助玩家准备、表达和改善下一趟出发。
- **Don't Starve：**玩家看得懂自己带什么、缺什么，准备不足时能做出有意义的选择。
- **Stardew Valley：**材料回家以后能投入日常制作与生活成长；后续食物/种植另有明确 owner。

这些是体验来源，不复制原作的物品、配方、UI、美术、数值表或系统结构。第一步要让已有材料/配方行为有可靠边界，再增加原创内容。

## 2. 当前实现：静态源码核对

**VERIFIED（源码结构）：**V21 `survival-v21.html` 加载 `modules/core/runtime-state.js`、`modules/safe-camp/base-interactions.js`、`modules/input/interaction-v12.js`、`modules/input/platform-inventory-v19.js`、`modules/network/inbound-events.js`、`modules/survival/lifecycle.js` 和 `modules/safe-camp/home-workbench-upgrade-v1.js` 等相关文件。

**VERIFIED（当前限制）：**

- `runtime-state.js` 持有单个全局 `inventory` 对象，目前字段是 wood、stone、food、shard 计数和 knife、lantern 布尔值；目前看不到独立物品目录、背包格子/容量、物品实例、耐久或完整装备服务。
- `saveLocal()` 把整个库存对象写进本地 `abyssal_wake_save_v5`；读取支持 V5 与旧 V4。它是本地玩家档案，不是账户仓库或服务器权威共享库存。
- 采集由 SafeCamp/交互逻辑递增库存，掉落在 `inbound-events.js:onLoot` 应用到本地玩家，死亡损失在 `survival/lifecycle.js:die` 扣减材料；这些路径分散，不能只改“背包 UI”。
- 骨刃、提灯、食物制作逻辑目前由 SafeCamp 基础交互中的面板处理器完成；V21 后加载的 `game-v7-patch.js` 扩展 `use`/互动行为。具体活动 handler 和 loader 顺序在接任务时仍须复核。
- `platform-inventory-v19.js` 主要处理桌面/移动输入和库存展示，不因此成为物品数据 owner；HUD 的四种物资显示在 `modules/ui/base-ui.js`。
- HOME Field Rig 升级是相邻的独立服务：单独保存升级状态、消耗 stone/shard，并调用既有 `saveLocal()`；它有专项合同与回归测试。
- Relay 当前同步区域 harvest/loot 结果，不代表玩家背包在多个客户端间共享；不得为背包卡擅加 Relay 消息或更改现有协议。

**VERIFIED 的邻接合同：**远征要求骨刃及特定 shard 进度；工作台升级需要活着完成远征并回家。数值和背包行为属于已有体验，重构时要保持行为一致，不能让库存 delta 单独伪造远征完成。

**UNKNOWN：**真实浏览器、触屏设备和两客户端下库存/制作表现是否完全一致。本卡没有运行测试或实机检查。现有相关测试覆盖若干局部；没有发现独立的配方交易服务、库存容量合同或完整双客户端物品权威测试。

## 3. 模块所有权与接口边界

**主责模块：Items & Inventory。**目标是让所有物品数量/装备状态只有一个可验证的写入入口。当前旧式共享全局对象仍是实际状态；卡片不假称新 service 已存在。

**Crafting 是配合模块/子领域：**拥有配方定义、工作台条件与制作意图；它请求库存服务校验并原子结算材料与产物。不得维护第二份库存或直接改 `inventory`。

| 范围 | 唯一责任 | 配合方式 | 不负责 |
|---|---|---|---|
| Item Catalog | 稳定 item ID、显示名称 key、类别、可堆叠/最大堆叠等静态定义 | UI、配方和掉落按 ID 查询 | 运行时数量、掉落权威、图片碰撞 |
| Player Inventory | 玩家拥有的物品数量、拥有型装备标记/装备状态；验证 add/remove/transaction；安全拒绝非法数量 | Save coordinator 读写已版本化快照；Crafting/loot/harvest/death penalty 通过公开命令请求变更 | 自行授予任务奖励、决定伤害/食物效果、联网权威 |
| Crafting | 配方 ID、材料需求、产物、站点/条件检查、制作请求 | 请求库存以一个不可分的 transaction 扣料并加产物；UI 展示结果 | 自己扣材料、直接调用 `localStorage`、绕过 HOME 站点要求 |
| Survival / Consumables | 食用后的饥饿/生命/状态变化及死亡规则 | 使用服务先预检效果 owner 是否接受，再协调一次消费提交；提交后效果应用必须保证成功，若效果应用仍可失败则需有明确回滚/补偿语义，且只在整笔操作成功后保存 | 背包数量或食物效果由物品图标决定 |
| Core Save | V5 主玩家档案、V4/V5 读取迁移和写入入口 | Inventory 提供/读取序列化快照，由当前 save owner 协调 | 每个物品子模块各自改全局存档 key/schema |
| UI & Input | 背包显示、按钮和键鼠/触控请求 | 同一领域命令处理各设备输入 | 将 UI 数字当权威库存，直接扣料 |
| Combat / Drops / World | 由对应 owner 裁决击杀、掉落、采集资格、搜刮结果 | 结果确认后请求库存发放 | 给美术、客户端动画或重复网络消息发奖 |
| Network & Co-op | 现有 Relay 会话与事件边界 | 按现存合同传送获准事件 | 未经单独合同扩展共享仓库/物品协议 |

方向示意：

```text
UI / 输入 ──请求──▶ Crafting ──原子交易请求──▶ Inventory owner
                         │                         │
                         └──查询站点──▶ HOME       ├──只读快照──▶ HUD / 背包 UI
                                                   └──版本化快照──▶ Core Save
World / Loot / Death ──已确认变更请求────────────▶ Inventory owner
Inventory 消耗确认 ──使用意图──▶ Survival / Combat 等效果 owner
```

以下只是**建议语义名**，并非现成代码 API：`getInventorySnapshot()`、`requestInventoryTransaction({requestId, costs, grants})`、`requestCraft(recipeId, stationId, requestId)`。实施前按 V21 browser-global loader 约定、现有文件和输入事件复核；不要仅为模块化整体搬成新构建体系。

## 4. 首个实现切片建议：INV-1 Bone Knife 交易边界

暂不增加新配方或背包格子。把已经存在的 Bone Knife 制作改为调用唯一、原子、可测试的交易路径，并保持玩家看到的功能不变。

- 配方仍是现有的 **4 wood + 3 stone → 1 Bone Knife**。
- 已拥有 Bone Knife 时拒绝，不扣材料，不重复产出。
- 材料不足时说明缺什么，库存和存档均不改变。
- 两次快速点击/重复请求最多成功一次；材料扣除与产物授予要么全部成功，要么库存完全不变，材料不允许变负。
- 成功后复用现有 HUD/背包刷新与 `saveLocal()`；不要在新服务旁写第二个存档。
- 键盘与触屏继续调用同一制作意图；不改 SafeCamp 可用性或其他配方。
- 不碰死亡损失、shard/food loot、远征进度、Field Rig、战斗数值、Relay 消息、V5 schema 或任何正式资产。

只有这条交易通过后，才另立任务扩展 item catalog、其它既有配方、装备槽/容量或食物效果。Bone Knife 可读化的像素图标应满足统一的 Modern High-Detail Pixel Art 和当前实际 UI 清晰度合同；素材生成、背包机制实现、正式资产接入分成不同任务，不能让新图标直接改变 item key/伤害。

## 5. 顺序与验收

1. **INV-0 只读合同：**重查活动 loader 和所有库存写入点；明确 V21 与 legacy 文件，列出实际 API、字段、Save/Relay owner 和测试。不得先搬目录。
2. **INV-1 骨刃原子交易：**只围绕一个配方；先添加能重现边界的纯逻辑测试，再接现有按钮。
3. **INV-2 配方登记：**INV-1 稳定后，按一个既有配方逐个迁移；每次都确认不改变配方数值和 HOME 合同。
4. **INV-3 物品定义/库存扩展：**另写容量、堆叠、装备槽与迁移方案，验证通过后再扩 item ID；不要默认为 RPG 必须有格子背包。
5. **INV-4 消耗品与交易：**分别让 Survival、NPC trade、Quest reward 使用正式接口；每个领域只申请库存变更，不越权写入。
6. **多人/账户共享库存：**独立项目和合同。必须先定权威、重复消息去重、断线恢复、冲突解决及存档迁移；当前卡不批准协议变化。

INV-1 的回归验收至少覆盖：

- 木材/石头不足、刚好足够、超出所需；材料扣除、武器授予及提示符合预期。
- 已有武器拒绝再次制作；重复/双击请求不重复扣料或产物。
- 库存交易接口对未知物品 ID、非法负数、缺失状态和事务失败有安全拒绝；这些只验证通用交易防线，不添加/修改 Bone Knife 以外的配方或界面。
- 保存调用只发生在成功状态；失败、取消/关闭面板不改变 V5 数据。
- 现有 V4→V5 迁移与旧 V5 已知物品字段保留；对未知库存 key 的兼容/拒绝策略按现有 schema 明确并测试，不静默丢弃数据；不得删除用户存档或清空已有字段。
- SafeCamp 攻击 guard、knife/unarmed damage/range/cooldown、灯笼照明、远征门槛、HOME upgrade 单次消耗、资源采集和战利品仍通过其现有回归。
- 键盘与触屏都走一个命令；实际设备未测就标 UNKNOWN。
- 串行运行相关 Node 测试；最终检查 branch/HEAD、活动入口、完整 diff。代码任务完成也不能冒充完整手机/多人体验验收。

如果发现相关测试原本失败，先确认失败基线，不把旧失败算成本次回归；如果改动导致任何新失败，停止叠加修改，先隔离和定位回归。

## 6. 美术、内容与 UI 质量

本模块会连接高画质体验，但数字可读性和图标质感不是同一任务：

- 物品图标必须采用项目的 Modern High-Detail Pixel Art 视觉方向，边缘锐利、颜色/轮廓能在实际格子尺寸下辨认；原图大或细节多不代表缩小后可读。
- 不指定所有图标通用的像素尺寸。先检查现有 UI 格子尺寸、资源合同、像素密度和缩放路径，再给具体 item 类别定图集格子。
- 维持最近邻/项目认可的清晰缩放，检查透明边缘、锚点和多状态（默认/选中/不足材料/无法制作）。不得将概念图直接塞进 production。
- 核验桌面和真实手机尺寸下的文字、数量、触控命中区与画面层级；缺少截图/设备证据就写 UNKNOWN。
- UI 可以把缺料表达得清楚，但配方条件必须读取 crafting owner；画面不能决定物品是否存在。

## 7. 交给未来 AI 的单模块任务目标

```text
你本次负责 ABYSSAL WAKE 的 Items & Inventory；若目标涉及 recipe，只让 Crafting 作为明确配合模块。先读本卡、PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md、相关合同、V21 启动清单和测试，再重新核对分支、HEAD、脏工作区及活动运行代码。

唯一目标：【INV-0/INV-1/INV-2/INV-3/INV-4 中明确的一项】。主责模块：Items & Inventory。允许修改文件：【明确列出】。本轮不碰其它配方/模块，除非列出的合同需要最小配合。

先确认一个状态 owner 和当前每个库存写入点。UI/Input 只发请求；Crafting 不直接扣库存；Save owner 管理 V4/V5；World/Loot/Combat/Survival 只由各自 owner 确认结果。不要擅改 Relay、存档 schema、武器数值、死亡惩罚、主循环、正式资产或未列出的文件。

修复或新增功能前先描述可重现行为和相关回归风险，确认足够证据后一次做一个根因的最小改动。保护所有脏文件和用户数据；绝不删除或覆盖现有文件。串行运行对应 Node 测试、阅读完整最终 diff；若有新失败，先隔离回归，不要继续叠加改动。真实设备或两客户端没测就标 UNKNOWN。

最终用简单中文说明：玩家得到什么体验改善、改了哪些文件、测试的真实结果、未验证项/回归风险，以及下一步。DRAFT、本地通过或 UI 占位都不能描述成已正式接入。
```

## 8. 交接导航

- [DRAFT 内容候选：潮汐谐振器](2026-10-04-draft-tide-resonator-module-item-v1.md)
- [总模块化玩法开发蓝图](2026-10-04-modular-gameplay-development-blueprint-v1.md)
- [Combat & Weapons 模块卡](2026-10-04-combat-weapons-module-card-v1.md)
- [NPC & Social 模块卡](2026-10-04-npc-social-module-card-v1.md)
- [Pets & Companions 模块卡](2026-10-04-pets-companions-module-card-v1.md)
- 实际运行状态 owner 初始位置：`modules/core/runtime-state.js`；存档 owner 为同文件的 `saveLocal/loadLocal`。
- 配方/交互/UI/掉落/死亡/远征/HOME 交接位置见上述证据清单和 `MODULE_MAP.md`；路径会随项目变化，接手者必须重新查。

**此卡仅规划和描述接口，不改变任何游戏运行文件、存档、素材、Relay 协议或玩法数值。**

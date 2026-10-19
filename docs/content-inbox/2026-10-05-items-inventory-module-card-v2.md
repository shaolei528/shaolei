# Items & Inventory — 独立模块卡 V2

**状态：DRAFT / PLANNED as one canonical successor service; V21 writes remain distributed**  
**唯一主责：Items & Inventory**  
**目的：**让后续 AI 能单独开发/修复一个背包操作，并清楚区分物品定义、数量/装备、原子变更、存档适配和 UI 显示。本卡不是新的库存 API、容量规则、物品表或存档迁移批准。

## 玩家体验与五款参考游戏转译

背包让玩家清楚知道“带了什么、装备了什么、为什么还不能制作/出发”，并稳定支撑 HOME 准备 → OUTSIDE 搜刮 → 返回成长。资源改动可信、失败不丢材料；选项有意义但界面不臃肿，不让整理背包本身变成负担。

| 参考游戏 | 本模块采用的体验原则 | 不照搬 |
|---|---|---|
| Minecraft | 收集材料能转换成玩家自选的 HOME/装备表达；装备和储备帮助下一趟准备。 | 不复制方块、无限堆叠、配方或箱子系统。 |
| Terraria | 工具/装备/材料为区域探索和逐步成长提供清楚门槛。 | 不复制矿物/装备阶梯、Boss 或 progression table。 |
| Don't Starve | 出门前的物品准备让夜晚/饥饿/危险有可应对的代价。 | 不复制饥饿规则、季节惩罚、损失公式或物品耐久。 |
| Crashlands | 获得和消费物品反馈明确，材料能看出用途。 | 不复制原作物品、美术、掉落链或背包 UI。 |
| Stardew Valley | 家中储备与生活/社区成长有关，但管理操作应轻松。 | 不复制收纳容量、礼物表、商店经济或关系系统。 |

这些是体验参考，不是把五种背包规则叠加在一起。一个任务只交付一个能说明其玩家价值的库存行为。

## 当前 V21 源码边界：服务尚未拆开

**VERIFIED workspace-source observations (not attribution, not live acceptance):**

- `modules/core/runtime-state.js` 声明全局可变 `inventory`，V5 `saveLocal()` 把它随玩家存档序列化；`loadLocal()` 合并 V5 或旧 V4 的 inventory。
- 后续 `modules/safe-camp/game-v7-patch.js` 用 `safeCount()` 将当前木、石、食物、碎片夹到 0–999，并规范化刀/灯笼布尔值。这是加载流程中的兼容处理，不等于 Inventory service。
- V21 `modules/input/platform-inventory-v19.js` 提供背包 UI 和派生 `inventorySnapshot()`；当前面板读取全局库存并渲染，不是全局库存的唯一写入者。
- 可读到的库存写入源码仍散在不同 owner：`interaction-v12.js` 采集/宝箱、`inbound-events.js` 收到 loot、`safe-camp/base-interactions.js` 制作/吃食、`lifecycle.js` 死亡损失、`home-workbench-upgrade-v1.js` 升级扣料。`ux-cn-v11.js` 的宝箱路径和 `safe-camp/game-v7-patch.js` 的 `newUse` 采集路径也含直接写入，但监听旧 `#useBtn`；当前启动顺序稍后由 `interaction-v12.js` 替换该按钮，所以运行时是否仍可达 **UNKNOWN / NEEDS DYNAMIC VERIFICATION**，不能先当作有效玩家路径。实现级迁移前还必须全仓检索，并沿活动 loader 核对最终生效函数与事件入口。
- 因此模块地图中的“Inventory 独占物品数量/装备写入”是目标架构约束，当前 V21 还未落实。当前项目没有已证明的独立 Inventory mutation service。

这些源文件和副本可能有共享工作区的修改；接手 AI 必须重新检查 branch/HEAD/diff、V21 实际启动顺序及根/模块副本，不能覆盖或归因并行文件。文档快照不代表远端版本或实际运行结果。

## 唯一状态 owner 与事务接口

**Items & Inventory 唯一拥有：**规范 item ID 的库存状态、stack 数量、装备拥有/装备状态、受批准的容量/有效值约束，以及所有库存原子变更的接受/拒绝结果。物品描述/翻译通过 Content & Localization 管理；图片/frame/anchor 由 Asset Pipeline 管理；Inventory 不拥有表现资产。

| 调用方 | 提交什么 | Items & Inventory 负责什么 | 调用方不得做什么 |
|---|---|---|---|
| Loot & Rewards | 已确认奖励来源与 reward ID / delta request | 校验 item、数量与 claim 请求，原子写入或拒绝 | 直接给玩家加库存。 |
| Crafting & Processing | 已通过配方/站点资格的输入/输出交易请求 | 原子扣除输入并加入产物，失败不部分结算 | 自己修改库存数组。 |
| Interaction & Gathering / Farming & Food | 已确认的采集/生产结果请求 | 接受合法物品变更，防止重复请求造成重复写入 | 使用交互图标/节点表现假装入包成功。 |
| HOME & Building | 经验证的建筑升级成本请求 | 原子提交费用；失败保留旧数量 | 复制一次性成本规则或自行回写库存。 |
| Survival & Needs | 已确认的消费请求 | 扣物品并返回已接受/拒绝；营养效果仍由 Survival 应用 | 越过库存 owner 扣数量。 |
| Core State & Save | 读取/提交持久化快照 | Inventory 提供合法 snapshot/变更；Save 负责格式与迁移 | Inventory 另写一套 save key/version。 |
| Network & Co-op | 按独立协议传递已批准请求/结果 | 不把来源不可信的网络载荷直接当库存变更 | 把网络连接本身当库存 authority。 |
| UI / Animation / Audio / Rendering | 只读库存快照或确认后的变化 | 提供可显示的状态 | 直接改数量、装备、解锁或 claim。 |

**提议的语义（未批准 API）：**`InventorySnapshot` 是只读的；`InventoryDeltaRequest` 带稳定 request/claim 标识、来源、item delta 和预期条件；一次事务要么完整接受并发出一次 confirmed change，要么拒绝且不做部分扣料。存档是否成功的提交顺序、重试去重的保存周期及网络可信来源必须先和 Core Save / Network owner 对齐。

这个提议不是现有函数名、事件格式、Relay payload 或存档 schema。不要先造第二个全局库存对象再让其他模块自己同步。

## 单 AI 实施边界

每次只选一个可复现问题或一种交易（例如单一制作消耗、单一奖励入包或装备开关）。实施前写清：

1. 活动 V21 loader 的状态创建/加载、所有对应写入、UI 读路径和最终生效 handler。
2. 变更由哪个 domain owner 授权、Inventory 接收哪个请求；事务失败/存档失败/重试后的预期结果。
3. 该任务的精确允许文件与镜像副本；不得清理、覆盖、重排未知来源的更改。
4. 需要一个目标回归和一个邻接 owner 回归；触及物品 save contract 或 Relay 时拆成专门迁移/协议任务。

不顺手添加背包格数、重量、耐久、交易、仓库、掉落、配方树、新物品 ID 或多玩家共享箱；若这些尚无产品决定或 owner 合同，就明确标 UNKNOWN / OUT OF SCOPE。

## 高清图标/背包 UI 验收

遵守根目录 [`ART_BIBLE.md`](../../ART_BIBLE.md)：原创 Modern High-Detail Pixel Art，轮廓锐利、像素簇有组织、物品外形与材质能区分。库存 icon 的原始像素很多，不等于它在背包格子里仍清晰。

- 先从当前源图与 runtime 合同核对 item ID、sprite cell、源尺寸、帧/锚点、透明边缘、色彩与采样方式；没有依据的尺寸写 `UNKNOWN`，不把概念图拉伸/缩小凑格子。
- 在实际 inventory/crafting/HUD 页面检查 `1280×720` 桌面和 `390×844` 手机：图标边缘不糊、不成为粗马赛克；数量、装备态、材料需求、选中/不可用状态可读；窄屏不裁按钮/提示或遮住主要操作。
- 并排检查源图与游戏画面，确认不是加载了高分辨率原图、但缩放/压缩后丢失细节。游戏截图、实际 device/browser 信息要记录；静态构图和 VM 测试不能证明玩家视觉质量。
- 任一真实视口未检查时标 **UNKNOWN / NOT ACCEPTED**。如果糊化、粗马赛克、alpha halo、裁切/色彩混乱或状态难懂，标 **REVISE** 并指出原因。

## 回归和验收

- 数量不为负/不越权；无效 item ID、非法数量、库存不足、并发扣料、重复请求、满容量（仅当容量合同存在）行为有明确结果。
- 多项扣料与产出事务原子：任一条失败则无半扣料；存档写入失败要么完整回滚，要么按已批准的可恢复状态合同处理。
- 装备开关只能依照 Inventory/Character 合同接受一次；HUD、快捷栏与只读 snapshot 始终反映同一状态。
- 回归 V5→V4 fallback/兼容、Safe Camp 制作、HOME Workbench 升级、Loot 入包、互动采集及 Survival 消费中被本次改动触及的路径；保存 key、字段、Relay event 不能悄悄变化。
- 只读 source/Node 测试通过不表示 browser/mobile visuals、两客户端一致性、真实存档或长期无 Bug。未覆盖项标 UNKNOWN。

## 可复制给后续 AI 的单模块目标

```text
本次你只负责《深渊苏醒》的 Items & Inventory 模块。先读取 PROJECT_CHARTER.md、PROJECT_STATE.md、SUCCESSOR_MODULE_MAP.md、本卡、ART_BIBLE.md、MODULE_MAP.md 与相关测试；重新核对 branch、HEAD、dirty workspace、survival-v21.html 启动顺序、V21 全部库存写入/Save 入口和当前 3/4 candidate 依赖。

唯一目标：【填写一个能复现的库存 Bug，或一种很小的原库存交易】。先证明当前实现、唯一状态 owner、domain 来源和玩家影响；写明精确允许文件、根/模块副本、一个目标回归和一个相邻系统回归。默认只读审查/设计；只有本次目标明确授权具体实现才改代码。

Inventory 独占接受/拒绝和物品数量写入；Loot 选择奖励，Crafting 校验配方，Interaction 选择目标，Survival 决定营养，Core Save 写既有存档格式，UI 只读快照，Network 只传递既有合同。V21 目前存在多个直接写全局 inventory 的过渡路径；必须先核对再隔离迁移，不能只给背包 UI 包一层就宣称完成模块化。

不更改 V5 save schema/key、Relay payload、item IDs 或损失/制作规则，除非拆成已批准的迁移任务。保护并行未提交文件；不删除。实现先测所选行为与失败/重放边界，再做最小修改；串行跑目标和相邻回归并检查最终 diff。

图标与背包 UI 遵循 ART_BIBLE.md，在真实 1280×720 和 390×844 游戏视口验证锐利、高细节和信息可读；没有视口证据就标 UNKNOWN。最后用简单中文说明玩家能看到/感受到什么改善、五款参考体验采用了哪一点、改动、回归、可能连带 Bug 和未验证项。不提交、不合并、不部署。
```

## 当前状态

V1/V2 是目标设计合同。V21 全局 inventory 仍有多处写入，`platform-inventory-v19.js` 主要提供 UI/只读 snapshot；独立原子 Inventory service 与实际 successor 背包视觉尚未验收。全量写入扫描、Inventory mutation API、跨客户端 claim/transaction、安全上限的玩家规则、真实视口和设备体验均为 **PLANNED / UNKNOWN / NOT ACCEPTED**。

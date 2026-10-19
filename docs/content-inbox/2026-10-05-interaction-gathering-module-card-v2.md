# Interaction & Gathering — 独立模块卡 V2

**状态：DRAFT / PLANNED as a clean successor boundary; V21 contains transitional mixed ownership**
**唯一主责：Interaction & Gathering**
**目的：**让后续 AI 可以单独处理一个交互路径，并能看清当前 V21 耦合、目标 owner、跨输入回归和高清画面验收。不代表所有交互已经拆成独立服务。

## 玩家目标

玩家靠近一个清楚可辨的目标后，键盘、手柄或触屏只提交一次动作。提示说的是哪个目标，最终结算就作用于同一个目标；游戏明确说明成功、失败或不可用，不会因点快两次重复获得物品。

## 五款参考游戏如何转为原创交互体验

| 参考体验 | 在本模块中的设计约束 | 不照搬 |
|---|---|---|
| Terraria | 交互揭示附近世界/POI 的可用路线与线索，探索有下一步方向。 | 不复制地图、洞穴、宝箱、解锁路线或 UI。 |
| Stardew Valley | 日常目标（居民、站点、资源）在接近时容易识别，交互促进社区与家园生活。 | 不复制人物、日历、对话、礼物或关系系统。 |
| Crashlands | 动作响应直接，目标与“获得了什么/发生什么”容易读懂。 | 不复制收集动作、敌人、物品、动画或奖励。 |
| Minecraft | 交互让玩家使用自己安排的 HOME 设施；设施位置与建造仍由 HOME/Building 拥有。 | 不复制方块点击、合成表、建筑或交互界面。 |
| Don't Starve | 危险/生存相关交互应让玩家预先看懂条件与风险，避免突然惩罚。 | 不复制生存数值、陷阱、季节或饥饿规则。 |

每个交互切片只选择一个明确玩家收益，不需要把五款体验同时塞入一个按钮。

## V21 当前代码快照与重要差异

**VERIFIED source observation in this workspace (not successor acceptance):** `survival-v21.html` 的启动列表包含 `modules/input/interaction-v12.js`；当前可读到的 V12 代码里有 `interactionTarget()` 目标选择、`interact()` 分支、触控按钮复用的 context-action 入口，以及 Guide、工作台、宝箱、篝火和资源采集路径。V12 的 `harvestResource()` 直接执行 `inventory[r.type] += 1`，同时写采集冷却、保存、刷新 UI 并提示结果。这是 V21 过渡代码的混合责任，**与目标架构中 Inventory 唯一写入库存的边界不一致**。

因此后续任务必须先核对：V21 当前 handler 的最终加载/覆盖顺序；根目录与模块目录副本是否一致；用户并行改动；目标路径实际调用的是哪一个文件。若任务触及库存归属，只提出一处隔离迁移：Interaction 检查目标并发请求，Inventory 决定库存提交，成功后再反馈。不可为了“模块化”顺手更改采集冷却、save、Relay、资源 ID、工作台规则或玩家输入合同。

上述是当前工作区源码快照，工作树中相关文件带未提交修改；不能推断这些变化属于哪个 AI，也不能把它当成远端提交或真实运行证据。目标 successor 的模块边界仍为 **PLANNED**。

## 唯一责任和接口

**Interaction & Gathering 拥有：**当前可交互目标查询与优先级、交互距离/可见性请求校验、领域动作请求路由，以及把确认结果交给 UI/表现。它不持有其他领域的最终状态，也不负责键盘/触屏事件去重或资源最终 claim。

- **Input & Accessibility** 把键盘/手柄/触屏转换为一个标准意图，并负责输入层只提交一次；Interaction 校验该业务请求。业务幂等键的最终消费/重复 claim 拒绝属于结算 owner，不由输入模块或 Interaction 单方面保证。
- **World & Terrain** 回答合法坐标、距离/遮挡等空间事实；Interaction 不改碰撞或玩家坐标。World 不替 Interaction 选择 UI 目标。
- **POI & Exploration** 拥有地点访问/搜索/发现阶段；交互只能请求它检查某个 POI 操作。
- **Loot & Rewards** 决定合规奖励；**Items & Inventory** 原子写物品数量。采集节点的可用/冷却状态、共享 claim 和持久化当前缺少完整 owner 合同；实施前必须确认唯一 owner，不能由 Interaction 擅造。
- **HOME & Building** 拥有设施 ID、位置与建造状态；**Crafting & Processing** 负责配方校验；Interaction 只提交使用请求。
- **NPC & Social** 拥有 NPC 身份/关系/对话；**Quest & Narrative** 拥有任务接受和完成。交谈按钮不直接改 NPC 状态或推进任务。
- **Survival & Needs** 拥有休息/食用带来的状态效果；Interaction 只请求并显示确认结果。
- **UI & Map** 显示 prompt 和结果；**Animation & Presentation / Audio & Feel** 只消费已确认结果。
- **Save / Network & Co-op** 各自负责持久化/共享传输；任何共享采集、宝箱 claim 或请求幂等合同都需单独审查。

**规划中的动作语义（不是已实现 API）：**Input 归一化并提交一次意图 → Interaction 解析/锁定目标快照，校验距离/遮挡/可用资格 → 向唯一领域 owner 发请求 → owner 处理幂等与 claim，Inventory 或对应 owner 确认结算 → 收到确认后反馈。目标在请求前消失、被其他玩家取得或请求失败时，不发奖励，不显示成功。

## 每个单模块任务的范围

一次只选一个具体路径（例如一次 Guide 对话、一个工作台打开请求、一个采集动作或一个 POI 搜索）。开始前写清：

1. 当前生效路径/handler 与该路径在 V21 boot 中的覆盖顺序。
2. 目标状态 owner、空间/输入接口、允许修改的确切文件；共享脏文件所有权 UNKNOWN 时停在只读审查。
3. 一项玩家可感知结果和一个复现/修复目标，不混合修 UI、存档、联网和美术素材导入。
4. 目标消失、无效距离、遮挡、未解锁、操作重试、快速双击、双输入、领域 owner 拒绝时的预期结果。
5. 遇到单一 owner 缺口时先记录缺口并限定事务接口；不得复制第二个库存/任务/POI 状态机。

## 高画质和信息可读验收

所有目标标记、采集资源、交互提示、站点/NPC 图标和交互动画遵守根目录 [`ART_BIBLE.md`](../../ART_BIBLE.md)：Modern High-Detail Pixel Art，轮廓清楚，细节靠组织良好的像素簇，不靠糊化纹理/噪点。高清源图不等于游戏内高清。

- 先依据当前资产合同读取真实源图尺寸、像素密度、帧布局、alpha、锚点和采样方式；未有依据的值标 `UNKNOWN`，不任意缩放或重采样。
- 在实际 3/4 游戏场景检查 1280×720 与 390×844：最近目标提示、可交互轮廓、按钮文字和触控命中区清楚；不会被角色/地形/HUD 遮挡；目标切换时提示与请求对象一致。
- 原图和运行画面并排检查。明显糊、粗马赛克、缩小后丢失目标细节、提示文字太小或目标难以区分时标 `REVISE`，指出源素材、采样、投影、遮挡或 UI 布局的具体原因。
- 只有代码/VM 测试而无实际视口截图时，交互逻辑可按覆盖情况报告，画质/UI 可读性仍标 `UNKNOWN / NOT ACCEPTED`。

## 回归要求

- 有目标/无目标、目标优先级边界、可交互距离内外、遮挡、目标刚消失都作用于正确目标；提示与结算目标一致。
- 每个物品/地点/对话操作只向领域 owner 请求一次；快速双击、事件重试、键鼠+触控同时发生不会重复产生结果。
- owner 拒绝或断线时不显示成功；失败不留下部分库存、任务或 save 改动。旧 V21 遗留规则需有回归，而非按新草案直接更改玩家习惯。
- Guide / 工作台 / 采集 / POI 路径按所改功能选择相邻回归；碰到输入则回归 PC 与移动端，碰到采集库存则回归 Inventory/资源冷却，碰到共享对象则跑网络幂等专项。
- 完成后核对文件 diff、根/模块副本、已验证和 UNKNOWN 分开报告。局部测试通过不代表整个游戏没有 Bug。

## 可复制给后续 AI 的任务目标

```text
本次你只负责 Interaction & Gathering 的一个已存在交互路径。先读取 PROJECT_CHARTER.md、PROJECT_STATE.md、SUCCESSOR_MODULE_MAP.md、本卡、ART_BIBLE.md、MODULE_MAP.md 和当前实际源码/相关测试；重新核对 branch、HEAD、工作树、survival-v21.html 加载与最后生效 handler。

唯一目标：【填一个具体复现 bug 或一个小交互路径】。只指定 Interaction & Gathering 为主责；写出允许文件、owner 接口、一个目标回归和一个相邻系统回归。默认只读检查或设计草案；明确授权了具体实现才改代码。尤其注意 V21 V12 的采集代码可能直接写 inventory，这是待处理的旧模块耦合，不能误报为 successor 已拆分。

不得顺手改变 Inventory/save/Relay/schema、碰撞/坐标、任务规则、NPC 关系、战斗结算或站点身份；不得覆盖/删除/归因共享工作区的未知改动。需要跨模块改变时拆成独立任务。验证所改行为和相邻边界，检查最终 diff；没有运行时/实机证据的事项标 UNKNOWN。

图标和提示需遵守 ART_BIBLE.md，并用实际游戏中的 1280×720、390×844 画面验证边缘清晰、目标可读和提示不遮挡；概念图或 VM 不能代替。最终用简单中文报告玩家结果、五款参考体验中实际采用了哪一项、变更、回归、潜在连带 Bug 和未验证项。不提交、不合并、不部署。
```

## 当前状态

V21 已有部分交互行为，但当前源码仍混合输入路由、领域动作与库存写入；完整 successor 模块边界尚未实现。新 API、原子请求合同、多人采集 claim、素材清晰度和真实设备体验均为 **PLANNED / UNKNOWN / NOT ACCEPTED**。

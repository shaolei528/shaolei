# HOME & Building — 模块卡 V2

**状态：DRAFT / NOT IMPLEMENTED（未来模块目标）**

**唯一主责：HOME & Building**

**当前分支快照：**`fix/awakening-production-gate-qa-findings-v1`

**当前 HEAD：**`54d294abc13dd19ee53b56563fe43aaecc81b9ba`

## 玩家目标

HOME 是玩家愿意回来的安全生活据点。玩家带回资源和发现后，通过有意义、看得见的修复与设施成长，让下一次出行准备得更充分；营地逐渐从现代沿海城市里的临时避难点，成长为有人生活、有功能、有个人表达的家。恐怖由外部逐步侵入，不能让开局 HOME 失去温暖、安全和可读性。

## 当前实际状态（V21）

- **VERIFIED：**V21 有一个 Safe Camp 工作台和专用 Field Rig 升级模块 `modules/safe-camp/home-workbench-upgrade-v1.js`。MIRE MART 远征成功返回后，玩家可以在营地消费 3 stone + 2 shard，令现有离营护佑从 15 秒变成 25 秒。模块把 tier/返程资格/时间保存在独立 key `abyssal_home_workbench_v1`；它不是通用 Save adapter。
- **VERIFIED：**营火休息、Guide 对话、资源采集、工作台交互及静态 Safe Camp 内容分布在既有 V21 文件。此处描述的是现状导航，不代表未来模块已在代码中分开。
- **VERIFIED：**现有 V21/successor 预览没有经确认的自由建筑摆放、建筑目录、通用建筑状态服务或共享营地建造权威。不得把 Field Rig 叫作通用建筑系统。
- **VERIFIED：**`docs/contracts/HOME_WORKBENCH_UPGRADE_V1.md` 是当前 Field Rig 行为约束；本模块卡不改其规则。
- **UNKNOWN：**当前 HEAD 的实际 HOME 画面品质、清晰度、移动端比例与 Field Rig 升级前后是否有场景视觉差异；没有本轮同一运行版本的 1280×720 和 390×844 对照证据。

## 唯一所有权

未来 HOME & Building owner 保存据点布局描述、建筑/设施 ID、站点身份、摆放与升级定义，以及 HOME 范围内这些定义的生命周期。它可以提出有效的空间占用和材料请求；不能亲自裁定相邻领域的状态。

| 邻接模块 | 明确接口边界 |
|---|---|
| World & Terrain | HOME 请求验证摆放坐标/占地；World 是地面、碰撞、可行走与空间有效性的唯一权威。视觉像素不能决定碰撞。 |
| Items & Inventory | HOME 发送成本/返还请求；Items 负责原子结算和堆叠。HOME 不直接扣背包。现有 V21 Field Rig 是历史例外，保留到另一个明确实施任务迁移。 |
| Crafting & Processing | HOME 提供已解锁站点身份/位置查询；Crafting 验证配方与加工，不由 HOME 复制配方表。 |
| Core State & Save | HOME 提供领域状态快照与版本迁移需求；Save adapter 负责写入、恢复与失败语义。新建筑不另开第二份 tier 状态。 |
| Network & Co-op | HOME 提供建造意图/领域变更请求；Network 校验获批的世界权限与同步。未有共享权威合同之前，建筑不能宣称多人共享或持久化。 |
| Rendering & Camera / Animation & Presentation | 只读 HOME 快照并显示设施外观、投影、遮挡和动画；不写建筑等级、碰撞、成本或保存状态。 |
| UI & Map / Input & Accessibility | 提交玩家意图并呈现结果；不执行建造、扣费或决定可放置性。移动端触控需独立验收。 |
| Integration & QA | 检查真实 HOME→外出→返回→成长路径及相邻模块回归；不接管 HOME 规则。 |

单次实现只选一项设施/升级；列出唯一状态 owner、接口、允许文件、相邻回归与回滚办法。结构位置、成本、视觉变化和实际玩法收益都要有玩家可理解的反馈。

## 五款参考游戏：转化为本作的体验目标

这些是**未来验收方向**，不是声称 HOME 已有这些系统，也不复制原作内容。

- **Minecraft：**给玩家有限但有意义的营地表达；布置/升级灯、储物或工作站，要能明确改善下一次出行准备。验收看玩家是否能说出选择带来的用途，而非无限堆方块。
- **Stardew Valley：**让居所和居民有温暖、熟悉的变化；回家后通过一项短小可见的修复/生活变化感受到社区成长。NPC 身份、日程和关系仍归 NPC & Social。
- **Don't Starve：**安全营地帮助准备，但不能消除外出风险；玩家能从光源、补给点或设施状态读懂出行准备，真正威胁仍由 Survival/World/Creatures 处理。
- **Terraria：**让探索收获逐步解锁新的建造/功能选择；每个阶段给清楚目标和回报，不提前引入大量无用建筑菜单。
- **Crashlands：**让材料→制作/设施→实用反馈的因果关系直接易懂；建成或升级后，反馈清楚但不偷偷改战斗数值。

## 视觉与高清验收

- 目标是 **Modern High-Detail Pixel Art + 已选择的 3/4 斜俯视**：现代沿海城市材质、温暖安全 HOME、丰富但有序的像素簇；像素边缘锐利，角色、道路、入口、设施和交互点容易辨认。
- 不以概念图分辨率、素材原图放大或静态拼图作为接入验收。必须在实际选定的游戏入口看到运行画面；本轮 V21 基线和 successor 都要清楚标记各自用途。
- 每个候选先核对实际素材合同、源像素密度、透明边缘、脚点/底部锚点、占地 footprint、投影假设与层级。不可为凑屏幕尺寸任意拉伸/重采样，也不可从美术 alpha 推导碰撞。
- 对同一状态采集 **1280×720** 和 **390×844** 实际游戏画面；检查材质层次、像素锐度、设施/角色比例、遮挡、可走通道、交互可读性、窄屏安全区及移动时细节稳定性。
- 如果接入后发糊、变成粗马赛克、层级混乱、锚点漂移或遮住路径，标记 **REVISE**；没有实际双尺寸运行截图则为 **UNKNOWN**。测试绿不能证明美术过关。

## 未来建造实现验收

仅当用户之后选择明确的实现任务时适用：

1. 放置请求经 World 验证地面、占地、碰撞、边界和与其他设施的重叠；无效请求不给消耗。
2. 成本和建筑状态作为一个可恢复事务结算；重复请求不能重复扣费/发奖；存档失败须报告并保持状态一致。
3. 同一站点 ID 在 HOME、Crafting 与保存快照之间一致；UI 只显示快照，渲染只显示视觉变体。
4. HOME 安全区、休息、工作台、MIRE MART 远征/返家和当前离营护佑不回归。
5. 新能力不改变 combat damage、movement、AI、Relay 协议或既有存档 schema，除非用户另行选择对应跨模块迁移任务。
6. 针对确切实现运行 HOME、World 碰撞、Items 原子操作、Crafting、Save、interaction、移动输入和模块路由回归；人工实际走一遍建造/撤销/离开/返回路径。
7. 回归结果逐条标 PASS/FAIL/BLOCKED；故障只报告证据和影响，不扩大到顺手重构。完整 diff 必须审阅；保留来源不明的工作区改动。

## 当前建议的最小下一阶段

先保持现有 Field Rig 玩法不变，只把它当作本作第一个“回家成长”示范。要让它获得 tier 视觉差异，需另行选择独立 Rendering/Asset 工作，并先确认活动 renderer、位置/锚点合同和美术负责人正在处理的素材范围；未经选择不动代码或素材。自由建造应等核心循环与 World/Save/Network 的占地和持久化接口明确后再立小任务。

## 给未来 HOME AI 的可复制任务说明

```text
你是 ABYSSAL WAKE 的 HOME & Building 模块 AI。本模块卡为 DRAFT 目标，不代表通用建造已经实现。先读 AGENTS.md、项目 Skill、PROJECT_CHARTER.md、PROJECT_STATE.md、SUCCESSOR_MODULE_MAP.md、本卡和 HOME_WORKBENCH_UPGRADE_V1.md；重新核对 branch、HEAD、脏工作区、活动 V21 boot 和所选 successor 入口。

目前 Field Rig 是 V21 中唯一确认的简单 HOME 升级：MIRE MART 成功返家后用 3 stone + 2 shard，把同一离营 ward 从15秒延长到25秒；key 为 abyssal_home_workbench_v1。不要将其描述为自由建造系统，也不要在别的服务复制 tier。

一次只处理用户选择的一项 HOME 内容。先声明唯一 owner、允许文件、请求/响应接口和对应回归。World 判空间/碰撞，Items 扣材料，Crafting 判配方与站点，Save 管持久化，Network 管多人权威；UI/Input 送意图，Rendering/Animation 只显示。不要默默改 Relay、存档或旧 HOME 规则，不删或覆盖未知来源文件。

视觉走 Modern High-Detail Pixel Art 与已选择的 3/4 斜俯视。确认实际 art contract、像素密度、anchor、footprint 和 active renderer；只用运行画面验收 1280×720 / 390×844 的清晰度，素材原图和单测都不够。没实际截图写 UNKNOWN；发糊/粗马赛克/遮挡错误写 REVISE。简明报告玩家获得什么、实际改了哪些文件、邻近回归结果、未知项和回滚边界。不自动删文件、合并或部署。
```

**交付性质：**设计/路由文档草案。没有实现自由建造、生成美术或改动游戏运行行为。

# NPC & Social — 独立模块任务卡 V2

**状态：DRAFT / NOT IMPLEMENTED / 供用户审阅和后续分派**
**主责模块：NPC & Social**
**基线：**2026-10-05，本地 `fix/awakening-production-gate-qa-findings-v1`，HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。工作区有大量来源混杂的修改与未跟踪文件；除本卡及明确列出的项目状态、索引、交接外，本轮不改其内容，也不把它们归为本轮产物。

本卡将当前 V21 散落实现与未来模块合同分开。唯一 owner 列表见 [`SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)。旧版 [`NPC V1`](2026-10-04-npc-social-module-card-v1.md) 保留历史，不再作为新任务路由入口。

## 1. 玩家目标与五款参考游戏

让 HOME 居民像现代沿海社区里的真实居民：有清楚身份、生活职责和短而有记忆点的表达；其帮助能让下一趟准备或探索更有意义。恐怖从日常潮汐、通讯、维修和供给中的小异常逐步发展。目标视觉是 3/4 斜俯视 Modern High-Detail Pixel Art：轮廓清晰、像素簇锐利、屏幕实际尺寸下可读；不接受素材接入后变糊、粗马赛克或细节丢失。

把五款参考转为可以观察的原创体验目标，不复制角色、台词、地图、关系、日历、任务或系统：

| 参考 | NPC 模块要产生的玩家体验 | 后续可验收信号 |
|---|---|---|
| Stardew Valley | HOME 居民与社区随时间有可感知变化，让玩家愿意回来 | 由 Time/Save 授权的重访变化可重复观察；当前无 NPC 日程/社区持久化服务 |
| Crashlands | 每位居民有稳定语气及一个可识别的小行为/信息差 | 玩家能仅凭一两句或动作区分角色，而非只看任务按钮 |
| Terraria | 居民能把当前探索阶段解释成可选的下一步 | 只消费 Quest/POI 正式快照；阶段变化后旧提示消失。当前 Guide 部分自行推断，不达此合同 |
| Minecraft | 居民建议或服务能支持玩家自选的 HOME 准备/建设 | 提示能落到现有工作台、营地或准备流程；建设规则仍归 HOME |
| Don't Starve | 居民能给出清楚、有时效依据的风险准备提示 | 只消费 Time/Weather/Threat 已确认快照；说明风险和时间窗口。当前没有情境预警服务 |

## 2. 现有代码事实与未来 owner

| 能力 | 当前观察到的 V21 行为 | 事实状态与边界 |
|---|---|---|
| Guide 身份/位置 | `modules/safe-camp/game-v7-patch.js` 提供单一 `ABYSSAL_CAMP_GUIDE_V1.getSnapshot()`，并维护 Guide 内存状态 | **VERIFIED，局部散落实现。**尚无居民目录、命名角色系统或独立 NPC service |
| 已交谈标记 | SafeCamp `.markTalked()` 同步闭包和旧 `abyssal_guide_v7` localStorage key；V12 正常对话打开路径会调用它。SafeCamp 旧 `newUse()` 还保留另一条直接写闭包/key 的 legacy 路径 | **VERIFIED。**`tests/camp-guide-talk-sync-v1.test.mjs`覆盖 V12 入口；不可据此声称所有入口都统一或已迁移到版本化存档。不得删除/改名旧 key |
| Guide 表现 | V21 `drawGuide()` 复用玩家 sprite，放大绘制并加 GUIDE 标签；V12 对话头像是 CSS 形状占位 | **VERIFIED 来源观察。**不等于有正式高清专属 NPC 资产 |
| 对话 | `modules/input/interaction-v12.js` 有固定话题页和任务建议；打开时标记已交谈、调用 UI/quest 更新 | **VERIFIED。**不等于数据驱动对话服务 |
| 当前目标与提示 | V12 的 `currentTaskAdvice/currentTaskText` 按 inventory、knife、`hasLeftCamp` 自行拼提示；World 有 `updateQuest` wrapper，最后 Expedition V1 又覆盖目标文案 | **VERIFIED。**存在多个 UI 文案路径；V12 并不读取 Expedition snapshot，提示有过时风险。仅为边界/维护风险，未复现错误文本时不能称 bug |
| Expedition | `modules/world/awakening-expedition-loop-v1.js` 拥有模块级 session-local phase；contract 写明 `persistence:none-v1`、`authority:local-objective-state-only` | **VERIFIED。**不是持久化 Quest service，也不是服务端/多人权威。NPC 不得另存一份阶段或声称共享任务权威 |
| 玩家间聊天 | `modules/network/chat-sync.js` 广播玩家文字 | **VERIFIED。**与 NPC 对话无关；不代表 NPC 台词、关系或交易同步 |
| NPC 多人状态/交易 | 当前未见 Guide 快照、对白、关系/状态由 Relay 同步；未见 NPC shop/offer 结算机制 | **当前未实现（源码范围已查）；**实际多人状态行为仍 UNKNOWN。玩家资源广播不构成 NPC 交易合同 |
| successor 可视化 | Guarded successor renderer 曾遗漏 Guide；dated review/follow-up 报告后来桌面 guarded preview 能见 Guide 并触发对话 | **REPORTED / 有交接线索。**本轮未重开浏览器复查，不将手机画面或当前活动 runtime 标 PASS |

### 唯一状态 owner 与调用边界

| Canonical owner | 拥有状态/规则 | NPC 只消费或请求 |
|---|---|---|
| NPC & Social | 居民 identity、NPC 自身 schedule/relationship、对白选项和 offer terms（未来） | 输出 NPC snapshot / 对话意图；不掌管玩家任务、物品、碰撞或存档落盘 |
| Quest & Narrative | 请求接受/拒绝、叙事里程碑、完成判定和奖励请求 | 向 NPC 提供正式阶段/任务快照 |
| POI & Exploration | 当前 Expedition/POI 操作阶段（现 V21 仍是局部模块状态） | 提供探索状态；当前不因此变成持久 Quest 或多人权威 |
| Core State & Save | 经批准的版本化玩家/世界存档和迁移 | 将来可持久化个人社交片段；NPC 不得各自直接写 localStorage |
| Items & Inventory | item catalog、背包与原子增减/交换 | 未来处理交易结算；交易机制当前 **PLANNED** |
| World & HOME | 地点、可行走空间、HOME 站点 | 接收 NPC 目标位置/地点意图；碰撞合法性不归 NPC |
| UI & Map / Input & Accessibility | 对话窗口、可见选项、标准化输入 | 显示 NPC 提供内容并提交意图；UI 不拥有社交/任务权威 |
| Network & Co-op | 已批准网络协议、消息传输 | 未来明确共享/个人语义后承载状态；NPC/Quest 不能顺手改 Relay |
| Rendering & Camera / Animation & Presentation / Audio & Feel | 投影、显示、动画/音频表达 | 只读 NPC snapshot 和语义事件，不做任务/关系结算 |
| Asset Pipeline / Content & Localization / Integration & QA | 素材验证、内容 key、跨模块证据 | 验证源素材与实际运行效果；测试 owner 边界和回归 |

建议的未来边界 API（**PLANNED、未实现**）：NPC `getSnapshot(npcId)` / `requestTalk(npcId)` / `chooseDialogue(npcId, optionId)`；Quest 返回只读 objective/milestone snapshot；Items 提供原子交换请求；Save 决定可持久化社交字段。不得仅为这些名字新建重复服务。

## 3. 第一位居民与新内容候选

现有 Guide 先作为系统原型，不添加好感度、恋爱、送礼、实时寻路、交易、新 Relay 消息或共享居民存档。职责称呼继续用“营地向导”，个人姓名未由用户确认。

另有一份原创可审阅提案：[`港湾无线电维护员 NPC 内容卡`](2026-10-05-npc-content-harbor-radio-maintainer-v1.md)。它是 **DRAFT / NOT IMPLEMENTED**，不是要求马上加入的角色；用户可以保留、修改或删除。早期 HOME 台词以真实沿海生活为主，单句最多一个轻微异常；更强线索必须等待 World/Time 或 Quest 正式里程碑。角色不得自行推进觉醒、发放物品、接受 Quest 或改变玩家状态。

## 4. 高清角色美术与运行画面 Gate

- Global art contract: [`ART_BIBLE.md`](../../ART_BIBLE.md)。角色概念图不是 spritesheet；Asset Pipeline 核对源图尺寸、帧格、透明边缘、像素密度和 anchor；Rendering & Camera 确认投影、显示尺度、脚点、深度层和采样。
- 当前 Guide 源代码复用通用玩家 sprite，CSS 头像不是角色源图；**专属高清 Guide/NPC 资产未验证/未建立合同**。本轮没有创建或导入新美术。
- V1 验收目标仍是 1280×720 桌面与 390×844 手机的真实游戏显示，但本轮未获得两种尺寸截图，因此 NPC 的剪影识别、最近邻锐度、遮挡和文字布局一律 **UNKNOWN**。已有 successor 总览报告当前场景整体视觉 **REVISE**，不是 NPC 专项通过证据。
- 后续 Gate 必须在同一候选包与相同场景状态下分别截图两种视口：检查 Guide 与其他居民剪影/脸部可辨、脚点贴地、树棚/玩家/NPC 深度遮挡、名称/交互提示/对白气泡是否挡路或盖住手机触控区，缩放后是否清楚锐利且未粗马赛克。任一显示明显发糊/丢细节标 **REVISE**；只有实际帧验证通过才可 PASS。

## 5. 分阶段工作

1. **NPC-0 当前状态盘点：**本卡已完成（源码与独立只读审查）。修订边界：不把 V12 局部测试外推成全部入口已统一；不把 Expedition 误说成持久 Quest；不把桌面预览证据外推到手机。
2. **NPC-1 单一 Guide 对话问题：**选一个可复现体验问题，只改 NPC 主责的最小范围；保留旧 key、任务/库存/网络合同，增加一项相邻回归。
3. **NPC-2 数据驱动 Guide：**定义身份/对白内容与运行逻辑分离；先验证 V21 loader、兼容入口、重复加载和移动版布局，再考虑第二居民。
4. **NPC-3 日常规律：**只做一位居民 2–3 段时段；Time 提供时钟，World/Pathfinding 负责合法移动，Pause/掉线/跨日有回归。
5. **NPC-4 请求/关系：**仅在 Quest owner 和 Save 语义稳定后实现一个选拒请求；NPC 不复制 quest 状态，个人与共享关系需先确定。
6. **NPC-5 服务/社区成长：**待 HOME、Items 原子结算及持久化接口稳定后，以一个小案例验证，再扩展目录。

## 6. QA 与安全修复原则

NPC 有可见代码变化时至少跑：

- `node tests/core-smoke.test.mjs`
- `node tests/camp-guide-talk-sync-v1.test.mjs`
- `node tests/interaction-guide-task-v12.test.mjs`
- `node tests/successor-camp-guide-render-v1.test.mjs`
- `node tests/awakening-expedition-loop-v1.test.mjs`
- `node tests/successor-module-routing-contract-v1.test.mjs`

如果改 loader，再跑 `node tests/module-sort.test.mjs`。按 Windows 限制直接串行运行各脚本。回归必须覆盖关闭/重开、重复触发、跨模块状态读数及手机布局所需证据。只有可复现或源码合同明确违例的问题才登记 CONFIRMED BUG；先保留用户文件，做最小、可回滚修复，并检查相邻系统是否回归。源码风险称 SUSPECTED/UNKNOWN，不臆测已修。

## 7. 可复制的单模块派工提示

```text
你只负责 ABYSSAL WAKE 的 NPC & Social 模块。先读 docs/PROJECT_CHARTER.md、docs/PROJECT_STATE.md、docs/SUCCESSOR_MODULE_MAP.md、本卡及相关代码/测试，然后核对分支、HEAD、脏工作区和入口。工程事实来自当前仓库；这张卡中标为 PLANNED/UNKNOWN 的内容不得说成已经实现。

唯一目标：【用户指定的一个 NPC 问题或一个居民小切片】。主责 owner：NPC & Social。允许文件：【列明】。需要读取/调用的邻接接口：【Quest/POI/World/UI/Items/Save 中实际需要项】。不要顺手改邻接 owner 的规则、存档、Relay、战斗、碰撞、正式素材或 manifest。未选择工程实现时只做审查和 DRAFT。

先找可复现证据；确认为 bug 后只做最小修复并跑 NPC 专项和一个相邻回归。对话、Quest 目标、Expedition 阶段、玩家 chat、交易、存档分别保持一个 owner；不得把局部 V12 标记测试说成全入口迁移完成。不得删除/清理未知来源文件，不自动提交、合并或部署。

实际画面必须在 1280x720 和 390x844 核对原图到运行画面的清晰度；没有两尺寸截图就标 UNKNOWN。输出简单中文：玩家能看到的结果、VERIFIED/PLANNED/UNKNOWN、测试与视觉证据、未解决风险和一个下一步。
```

## 8. 明确不在本卡范围

不实现完整 NPC 社会模拟、不更改 Quest/Expedition authority、不新增交易/好友/聊天/Relay 协议、不制作或接入正式 NPC 资产、不更改存档迁移、不合并/部署。本卡与内容候选均等待用户审阅。


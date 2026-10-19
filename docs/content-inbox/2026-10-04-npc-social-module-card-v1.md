# NPC & Social — 独立模块任务卡 V1

**状态：DRAFT / NOT IMPLEMENTED / 供用户审阅和后续分派**  
**目的：**让一个 AI 能单独负责营地居民/NPC，而不把对话、主线任务、多人聊天、物品、存档或全局 UI 混成一个系统。  
**本轮基线：**2026-10-04 10:26（Asia/Rangoon），本地分支 `fix/awakening-production-gate-qa-findings-v1`，HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。工作区脏且存在未提交、未跟踪内容；其作者和完成状态未知。本卡仅作源码快照，不把这些改动归给本轮。

> **归属说明：**本卡只定义 **NPC & Social**。任务进度归 **Quest & Narrative**，物品交易变更由 **Items & Inventory** 结算，玩家/世界保存归 **Core State & Save**；不要因同一角色界面而合并这些状态 owner。完整 owner 表见 [`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)。

## 1. 玩家体验目标

HOME 里的人要像生活在这个营地的居民，而不是一排重复的任务按钮。玩家可以看出每个人是谁、为何留在这里、能提供什么帮助；对话简短自然，NPC 的请求让下一趟出发有明确理由，回来后能看到结果。安全营地应温暖、可信；OUTSIDE 的线索和居民反应逐步揭开现代城市中的异常。

**Stardew Valley 的借鉴：**日常节奏、独特居民和社区成长让玩家愿意回家。  
**Crashlands 的借鉴：**角色个性要通过少量有记忆点的对白和行为呈现。  
**Terraria 的借鉴：**居民需求可以帮助玩家理解下一阶段能探索什么。  
**Minecraft 的借鉴：**居民和服务让 HOME 对玩家选择有实际影响。  
**Don't Starve 的借鉴：**营地居民可以帮助解释出发风险和准备方式。  

不复制参考游戏的 NPC、对白、外观、关系、日历、任务或交易系统。先从现有营地向导做起，不先开发庞大的恋爱/送礼/好感度模拟。

## 2. 现有内容快照：有 Guide，占位与完整 NPC 系统须区分

静态源码核对到以下内容：

- `modules/safe-camp/game-v7-patch.js` 绘制一位 Camp Guide，并用 `abyssal_guide_v7` 保存是否交谈过；她/他的提示围绕营地材料、骨刃和是否准备好出发。
- SafeCamp 是 Guide 内存状态 owner，并导出 `window.ABYSSAL_CAMP_GUIDE_V1.getSnapshot()` 与 `.markTalked()`；标记仍写入既有 `abyssal_guide_v7`，不新增存档字段。
- `modules/input/interaction-v12.js` 提供“营地向导”的对话面板、固定话题分支（任务、采集、安全、朋友）和依当前背包/骨刃/离营状态变化的当前提示。身份暂时以职责名称 “Camp Guide” 表示，未见用户确认的个人姓名。
- **已确认并修复的会话同步缺陷：**V12 打开对话时必须调用 SafeCamp 的 `markTalked()`，这样同一会话中的内存状态、`!` 绘制标记和现有保存键能一起更新；`tests/camp-guide-talk-sync-v1.test.mjs` 覆盖真实 V12 对话入口。
- `modules/network/chat-sync.js` 与网络模块负责玩家间聊天/同步；它不代表 NPC 台词、日程、关系或 NPC AI。
- `modules/world/awakening-expedition-loop-v1.js` 拥有当前 session-local 远征目标状态。Guide 的提示可以读取目标或现有物资，但 NPC 不能再维护一份独立任务阶段。
- 当前未从活动源码核实完整的 NPC 名册/数据目录、日程模拟、关系成长、条件对白内容管线或 NPC 交易结算系统。

因此本模块当前标注为 **PARTIAL / 有一位 Guide 与基础对话 UI**；“居民生态/社会系统”仍属 **PLANNED**。单测通过不能证明 NPC 画面、触控对话或剧情观感通过实际游戏体验验收。

## 3. 模块边界：一个状态只有一个 owner

**主责模块：NPC & Social。**它负责居民身份、NPC 自身状态、日程呈现、对话选择及社交关系（未来功能）。NPC 模块不是总任务系统、聊天系统、背包系统或存档后端。

| 相邻模块 | 合作方式 | NPC 模块不得做的事 |
|---|---|---|
| World & HOME | 世界提供地点/可行走查询，NPC 提供身份和计划位置；渲染读取 NPC 位置 | 不在 NPC 数据里私自定义碰撞或世界权威 |
| UI & Map / Input & Accessibility | UI 展示台词和按钮；输入提交规范化 talk/choice 意图 | UI 不拥有对话进度/关系权威；NPC 规则不直接绑定所有 DOM 和设备事件 |
| Quest & Narrative | NPC 发布请求入口；Quest 服务拥有接受状态、目标、完成判定和奖励流程 | 不在 NPC localStorage/台词里另存任务完成状态或直接发奖 |
| Items & Inventory / Crafting & Processing | NPC owns offer terms; Inventory atomically applies validated item exchange; Crafting is used only for recipe queries | 不直接改 `inventory` 或自己新增相同物品表 |
| Core State & Save | NPC 提供可版本化的玩家个人社交片段；存档协调器决定持久化和迁移 | 不由每个 NPC 分别读取/写入 localStorage，不覆盖现有 Guide key |
| Network & Co-op / Core State & Save | 明确 NPC 的共享/个人范围后，使用既有已批准协议或独立的新合同 | 不把 NPC 台词广播当成任务权威；不顺手改 Relay event/载荷 |
| Audio / Presentation | 订阅对话开始/结束、表情/情绪等语义，播放视觉/音频反馈 | 音频和动画不决定对话选项、好感或任务结果 |
| Integration & QA | 核对 V21 loader、重入、输入、保存范围与对话流程 | 不因有测试通过就声称移动端/联机体验已验收 |

当前 V21 的窄接口为 `ABYSSAL_CAMP_GUIDE_V1.getSnapshot()`（由 SafeCamp 提供只读快照）和 `.markTalked()`（由 SafeCamp 同步一次性交谈状态及既有保存键）；V12 优先调用该状态 owner，只有接口不存在时才回退写旧键。未来可评估 `requestTalk(npcId)`、`chooseDialogue(npcId, optionId)`、`npcScheduleChanged(npcId, location)`、`npcRequestOffered(npcId, requestId)`，这些仍未实现。Quest/Inventory 服务才处理任务接受和物品交易。

## 4. 社交数据分层

逐项设计，不能把所有社交状态塞进同一份 NPC 对象：

1. **居民定义（内容数据）：**稳定 ID、暂定显示名、职责、肖像/像素角色引用、初始位置、对白 key。内容和代码逻辑分开。
2. **世界表现：**当前位置、朝向、短动作和可交互半径；实际位置与碰撞由 World 接口协商。
3. **对话内容：**短文本、选项、出现条件和目标结果 key；台词不得直接内嵌资源数量修改或隐藏伤害机制。
4. **个人社交状态：**已见过、特定谈话完成、信任/关系（未来）。先确定这些是玩家个人还是共享世界字段，才能决定保存位置。
5. **NPC 请求：**仅把请求内容交给 Quest owner；Quest 返回状态快照，NPC 只显示“可接/进行中/已完成/已拒绝”。
6. **交易：**NPC 给出报价，Inventory/Crafting 服务检查与结算；失败时不扣一半材料，且重试不会重复交易。
7. **多人语义：**玩家个人对话选择和关系应与全队共享世界事件分开。V1 可先采用本地个人对话，不广播每个选项；若多人需要共同剧情，先另写权威/冲突合同。

## 5. 第一位 Guide 的最小 V1 内容切片

**不是新增一名居民。**以当前 Camp Guide 为唯一原型，逐步把现有散落行为整理成清楚的数据/接口：

- 保留 Guide 的“守火人/新手向导”职责；是否为人物命名交由用户决定，未定前使用职责称呼。
- 给出一段简短初次问候、一个可跳过的准备提示、一个可选的朋友/营地问题。
- 根据现有真实状态显示木材/石头/骨刃/是否离营提示，不复制物品数量或远征阶段。
- 让玩家关闭对话后继续移动；方向键/摇杆、攻击/冲刺、关闭按钮不应误触或重复提交选项。
- 交谈标记仅作为“已见过/已完成引导”的轻量本地状态。要更改 `abyssal_guide_v7` 兼容规则，需独立迁移任务；不要随 NPC 重构清掉旧键。
- 首个 NPC 请求可以先只做“邀请玩家补给并探索北路”的可选引导；真正接受/完成状态仍归现有 expedition/quest owner。
- 本轮不加好感度数值、送礼、恋爱、商店、NPC 实时路径规划、新 Relay 消息或共享世界居民保存。

### 开局对白的渐进恐怖约束

- HOME 早期对白先呈现可信的现代海港日常：潮汐、码头、停电维修、补给和居民分工。单句至多带出一个轻微异常观察，不直接解释成深渊或让 NPC 预知后期剧情。
- 更强烈的失踪、怪物或深渊线索，只能在 World / Time 或 Quest & Narrative 提供已确认的里程碑后展示。NPC 读取并表现这些事实，不自行推进全局觉醒阶段、不复制 Quest 完成状态，也不靠隐藏计时突然改变世界调性。
- 对白验收记录所用的世界/任务状态、预期解锁层级和可见文本；缺少已确认里程碑时，后期对白必须保持不可见。具体剧情内容仍是 DRAFT，等待用户审阅。

### 原创角色与运行画面的美术合同

- 全局规则见根目录 [`ART_BIBLE.md`](../../ART_BIBLE.md)：Modern High-Detail Pixel Art、3/4 斜俯视、清晰像素簇和最近邻采样。NPC 服饰/剪影应符合现代沿海社区的生活身份；HOME 保持温暖可信，开局只允许克制的异常细节，不把 painterly 概念图或整身紫色深渊装饰直接当成正式角色资产。
- NPC & Social 提供角色身份、职责、姿态/情绪语义和已确认事件；**Asset Pipeline** 核验源图尺寸、帧格、透明边缘和命名，**Rendering & Camera** 决定显示尺寸/脚点锚定、投影、遮挡及实际采样。NPC 模块不得单方面冻结素材尺寸或修改碰撞。
- 视觉验收须在 successor 的真实运行画面检查 1280×720 与 390×844：居民剪影和身份是否易辨、脚点是否贴合地面、玩家/Guide/道具遮挡是否正确、对白气泡是否可读且不遮关键路线/触控区，以及缩放后是否仍锐利、没有粗马赛克或细节丢失。仅有源 PNG、静态排版或自动测试时，画面接受状态写 **UNKNOWN**；未通过标 **REVISE**。本卡不生成或接入素材。

验收应能回答：玩家首次见到 Guide 是否理解 HOME 能做什么、如何准备、是否可以自己选择出发；再次打开时能否看到符合真实状态的提示；拒绝/关闭对话不会卡住或改变玩法状态。

## 6. 面向未来 AI 的分阶段派工

每张卡只选择一个主任务；其它阶段不能顺手混入：

### NPC-0：状态盘点（已完成，2026-10-05）

已追踪 V21 loader → SafeCamp Guide 快照/状态 → Interaction V12 范围判定与对话 → UI 当前目标显示；确认玩家 chat、Expedition 状态与 Guide 各自分离。发现闭包 `guideTalked` 与 V12 仅写 localStorage 导致同一会话标记不更新的 CONFIRMED UX bug，已通过 SafeCamp 状态 API 修复并加回归。桌面/手机真实对话观感及完整居民系统仍 UNKNOWN / PLANNED。

### NPC-1：Guide 对话体验小修（如用户选择）

只处理 Guide 的一个清晰问题（例如文字易懂性或触控关闭），保持 `abyssal_guide_v7`、工作台、Quest、移动输入和网络合同不变。添加有意义的回归。

### NPC-2：数据驱动的单一居民定义

先用一个 Guide 试验内容定义与运行逻辑分离；验证 V21 loader 顺序、重复加载幂等、旧交互兼容和手机布局。未通过不扩第二位居民。

### NPC-3：简单日常规律

先给一位居民 2–3 个可见时段/地点；时钟状态由 Time 模块提供，NPC 仅报告目标位置，World/Pathfinding 负责合法移动。注意游戏暂停、掉线和跨午夜边界。

### NPC-4：请求与关系

只有 Quest owner 已有稳定接口后，NPC 才展示一个可接受/拒绝的可选请求。关系系统需先确定玩家个人/世界共享语义，且不能把关系点与 Quest 状态重复保存。

### NPC-5：交易与社区成长

待 Items、交易原子结算、HOME 成长和持久化合同明确后，增加小规模交易或社区修复。先由一个交易/居民案例验证接口，再扩展目录。

## 7. AI 派工模板

```text
你本次只负责《深渊苏醒》的 NPC & Social 模块。先读本卡、PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md、相关任务合同和当前 V21 源码，核实分支、HEAD、脏工作区与运行入口。

唯一目标：【用户指定一个具体 NPC 问题或一个小切片】。主责模块：NPC & Social。允许文件：【填写】。配合接口：【World/Quest/Items/UI/Save 中实际需要的项】。

先区分 Camp Guide 现有逻辑、玩家间 chat、Quest owner 和 Inventory owner；不得重复创建 NPC、chat、quest、inventory 或 save。保持旧交谈状态兼容。NPC 台词和表现不能直接授予物品、推进远征或更改联网状态；跨模块需求通过已有接口并明确谁改状态。

先给可复现步骤和回归，再做最小范围修改；串行运行相关测试，检查 V21 启动顺序与最终 diff。设备/多人未实测写 UNKNOWN。不覆盖未知来源的脏文件，不提交、合并或部署。

用简单中文说明玩家体验收益、改动/草案状态、证据、未验证项与后续建议；不得声称全游戏已经验收。
```

## 8. QA 验收清单

### 自动测试和源码边界

- `tests/core-smoke.test.mjs`：Guide 交互目标仍存在，其他 SafeCamp 互动未退化。
- `tests/camp-guide-talk-sync-v1.test.mjs`：V12 打开对话后，SafeCamp 内存状态、现有保存键及 `!` 标记同一会话内同步。
- `tests/interaction-retry-idempotency-v1.test.mjs`：重载/重试不会重复事件监听或对话面板状态。
- `tests/awakening-expedition-loop-v1.test.mjs`：NPC 提示没有复制或绕过远征阶段 owner。
- `tests/awakening-home-workbench-upgrade-v1.test.mjs`：对话/请求不能绕过成功返家资格和升级结算。
- `tests/module-sort.test.mjs`：如改 V21 loader，验证模块顺序与重建合同。
- 新数据必须覆盖未知 NPC ID、无可用选项、无效选项、关闭/重开、状态刷新和对话重复触发。

### 真实体验检查

- 首次见 Guide → 看懂目标 → 关闭 → 移动、采集、制作都正常。
- 物资/骨刃/出营状态变化后再次交谈，显示内容应与实际状态一致。
- 手机窄屏和较大字体下文字/选项可读，滚动/关闭不与攻击或摇杆误触。
- 重新加载后交谈标记符合持久化约定；旧 `abyssal_guide_v7` 状态不会被静默抹掉。
- 多人同时和 Guide 交谈时，一名玩家的本地对话不意外改变另一名玩家的本地目标。
- 若后续加入 schedule，验证暂停、断线和夜昼切换后位置/对话一致。

单测不能证明对白有趣、NPC 动画清楚或手机阅读舒适；没有实际运行证据时标 UNKNOWN。

## 9. 明确不在 V1 范围内

- 多人聊天/好友系统/私有房间（Network & Co-op）。
- 通用任务引擎或改变现有 Expedition Loop（Quest & Narrative）。
- Inventory、商店库存、掉落、制作或经济结算（Items / Crafting）。
- 宠物、可控队友或动物照料（Pets & Animals / Farming）。
- 大规模好感度、恋爱、送礼、日历、语音 AI 或生成式实时 NPC。
- NPC 路径寻路、碰撞栅格、区域生态、共享居民世界存档。
- NPC 美术批量接入与正式素材 manifest；需要和正在进行的美术工作分开排期。

## 10. 关联资料

- [模块化玩法开发总蓝图](2026-10-04-modular-gameplay-development-blueprint-v1.md)
- [MIRE MART Expedition Loop V1](../contracts/MIRE_MART_EXPEDITION_LOOP_V1.md)
- `modules/safe-camp/game-v7-patch.js`、`modules/input/interaction-v12.js`、`modules/network/chat-sync.js`
- `modules/world/awakening-expedition-loop-v1.js`、`modules/safe-camp/home-workbench-upgrade-v1.js`

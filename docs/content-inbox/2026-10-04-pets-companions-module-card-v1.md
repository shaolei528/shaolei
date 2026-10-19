# Pets & Companions — 独立模块任务卡 V1

**状态：DRAFT / NOT IMPLEMENTED / 供用户审阅和后续任务分派**  
**目的：**为未来的宠物/同行伙伴功能建立单一状态 owner 和清晰接口；与战斗、物品、NPC、农场动物、存档和多人同步分工。  
**基线核对：**2026-10-04 10:28（Asia/Rangoon），本地分支 `fix/awakening-production-gate-qa-findings-v1`，HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。工作区脏且有未提交/未跟踪文件，作者归属未知。本卡只记录当时源码快照；接手者必须重新核对。

> **归属说明：**本卡中的 Pets & Companions 是单一领域 owner；它不包含牲畜/作物生产（**Farming & Food**）、NPC 社交（**NPC & Social**）、战斗判定（**Combat & Weapons**）或存档/联网。完整 owner 与交接见 [`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)。

## 1. 玩家体验目标

玩家在逐渐崩坏的沿海城市中救助或结识一位可信赖的同行伙伴。它要让旅途更有情感与辨识度，帮助玩家关注世界、准备出行、平安回家；不能成为抢戏的自动战斗/自动捡东西外挂，也不能变成第二套玩家背包或另一个怪物 AI。

五款参考游戏的体验借鉴：

- **Crashlands：**伙伴拥有可辨认的性格和有限、清楚的辅助方式；后续再逐个验证战斗伙伴的平衡。
- **Terraria：**伙伴/召唤物可随成长增加选项，但数量和解锁节奏克制，避免收集表压过探索。
- **Minecraft：**玩家能选择伙伴的外观/跟随方式，让它成为自己 HOME 与旅程的一部分。
- **Don't Starve Together：**伙伴要帮助团队准备和辨识风险；合作玩家不能因宠物自动解决威胁而失去分工。
- **Stardew Valley：**回家照料、互动和共同生活能产生情感价值；农场动物另属农业/食物经济模块。

学习设计原则，不复制原作动物、外观、能力、动画、取得方式或喂养系统。

## 2. 当前实现状态

**PLANNED。**本次在 `survival-v21.html` 活动模块列表和相关 V21 源码中没有找到宠物拥有/跟随/驯服、宠物指令或农场动物系统。当前玩家和怪物绘制路径分别位于 `modules/render/base-renderer.js`，mob AI 在 `modules/combat/mob-combat.js`；它们都不构成宠物系统。不要把同伴 AI 塞进 mob 敌人种类或复用怪物掉落逻辑冒充宠物。

## 3. 子模块拆分与状态所有权

**主责模块：Pets & Companions。**伙伴 roster、绑定玩家、当前伙伴、跟随/等待/召回状态由此模块唯一拥有。每个阶段仍需单独指定实施负责人。

| 子模块 | 所有权与职责 | 协作接口 | 明确不负责 |
|---|---|---|---|
| Companion Catalog / 内容定义 | 稳定 `companionId`、物种/性格、肖像/动画引用、可解锁条件 ID | 内容管线校验 key 和美术合同 | 不拥有运行时状态、碰撞或奖励 |
| Roster / Bonding | 玩家拥有哪些伙伴、当前出行伙伴、绑定 owner、亲密度（仅未来） | Quest/Narrative 可确认救助/结识资格；Core State & Save 保存玩家档案片段 | 不自行接受 Quest、不写 localStorage、不发物品 |
| Follow / Behavior | FOLLOW、WAIT、RETURN 等有限状态，间距/脱离后追赶/休息规则 | World & Terrain 查询合法移动/阻挡；Time 提供时间；输入可发伙伴命令 | 不修改玩家移动、敌人 AI 或空间碰撞规则 |
| Companion Presentation | 伙伴 sprite/动画、朝向、表情、靠近/互动提示 | Asset Pipeline 校验素材；Rendering & Camera 绘制只读伙伴快照；Animation & Presentation 管动作表现 | 画面层不拥有伙伴进度、命中或获取资格 |
| Companion Ability（后续） | 伙伴的非权威辅助意图或能力冷却 | Combat/World 等 owner 验证请求并决定生效结果 | 不直接伤害怪物、发奖励、自动搜刮或绕过冷却 |
| Pet Interaction（后续） | 抚摸/呼唤/简单互动输入 | UI/Input 提交命令，Pets 校验距离/状态 | 不吞掉玩家交互或移动输入 |
| Farm Animals（独立模块） | 动物照料、饲料、产物周期、繁育及畜栏 | Farming & Food、Items、HOME/Building、Time | 不与同行伙伴共用成长/产物规则 |
| Co-op / Persistence adapter | 玩家各自拥有的伙伴数据与共享呈现边界 | Network & Co-op 定义消息边界；Core State & Save 定义持久化与迁移；其他客户端读取 owner 快照 | 不假设 Relay 已有宠物同步，也不私自扩展现有 move payload |

重要接口方向：

```text
Input / UI ──命令──▶ Pets & Companions ──只读快照──▶ Renderer / Animation
                           │
                           ├──查询/请求──▶ World & Collision
                           ├──资格请求───▶ Quest / Narrative
                           ├──能力请求───▶ Combat 或 World owner
                           └──版本化玩家数据片段──▶ Save coordinator
```

未来 API 语义可考虑 `getCompanionSnapshot(ownerId)`、`requestCompanionCommand(companionId, command)`、`requestBondCompanion(companionId)`。它们只是**规划名称**，不是现有代码接口；必须先检查 loader、坐标系统和协议合同。

## 4. 第一阶段可玩切片建议

先做一个低风险、可见、可测试的单伙伴基础；不要首发就造宠物图鉴、繁殖、技能树和自动拾取。

### Companion V1：同行与情感存在

- roster 先只允许一个 active companion；内容 ID 和 player owner 清楚。
- 命令先限制为 **FOLLOW / WAIT / RECALL**；UI 提示当前状态，命令有明确反馈。
- 跟随目标为玩家可见位置，不驱动玩家或怪物；行走追赶使用 World 的空间/阻挡服务，不能穿墙、挡门或挤掉 NPC/战斗交互。
- 伙伴被卡住、玩家切区、死亡重生或短暂断线时，进入明确的 wait/return/恢复规则；不允许无限追赶或瞬间传送造成画面跳变。若必要的短距离回位要用作兜底，需有距离上限和可见反馈。
- 这一阶段建议不提供伤害、自动拾取、背包扩容、治疗或资源生产，以便先验证跟随可靠性和人物比例/画质。
- 获取方式保持待定：可以通过一项救助/故事选择获得，但解锁资格由 Quest/Narrative 确认，不能假定已有可捕捉资源或宠物道具。

### 后续各自独立的可选路线

1. **探索辅助：**提示某种可读环境线索，但不替玩家自动采集；需评估与 POI/Quest/UI 的接口。
2. **战斗伙伴：**一项有限、可预测的辅助动作；命中、伤害、冷却、敌人死亡和掉落仍由 Combat owner 裁决。必须单独做数值/多人公平合同。
3. **HOME 互动：**伙伴回到营地的待机/休息表现，纯表现与伙伴关系状态分离。
4. **宠物照护：**只有 food/economy 已有可持续目的时再设计喂养、状态和消耗，不能因“别的游戏有宠物”就增加惩罚。
5. **农场动物：**拆给 Farming & Food，不与跟随伙伴的 AI 或战斗能力混用。

## 5. 联机、坐标与存档先决条件

ABYSSAL WAKE 是合作游戏，伙伴不能只在拥有者客户端悄悄出现后就被宣称完成联机体验。实现前需由 **Network & Co-op** 与 **Core State & Save** 明确：

- 伙伴是玩家个人实体还是共享世界实体；owner ID 从何处验证。
- Remote companion 使用独立实体消息、复用玩家快照的扩展，还是其他契约；这涉及协议范围，不能未经批准改 `abyssal-relay-v1` event/payload。
- 两名玩家的伙伴重叠、切区、重连、离线拥有者回来时由谁决定位置与行为。
- 哪些字段保存在玩家本地档案，哪些需要共享；版本号、缺档/旧档迁移和损坏回退方式。
- 当前 V21 位置以世界坐标表达，视觉相机投影另行处理。宠物 AI 使用世界坐标/World 空间服务；Renderer 不把屏幕像素坐标保存成宠物状态。

在上述协议和保存范围未批准之前，可以制作隔离、**非 production** 的单人视觉原型，但不得称作已交付联机宠物系统，亦不可接入真实存档/Relay。

## 6. AI 单块派工顺序

1. **PET-0 静态设计/风险审查：**给出状态机、所有者/多人范围、world 坐标约定和待定决策；不改代码。
2. **PET-1 单人同行原型：**仅验证一只临时伙伴的 FOLLOW/WAIT、阻挡绕行、视线/层级和手机可读性；与 V21 production/save/Relay 隔离，并标 NOT IMPLEMENTED。
3. **PET-2 数据与状态服务：**用户批准后，加入一个 companion ID、roster/active state、有限命令和可靠 catch-up；不做战斗技能/农场系统。
4. **PET-3 联机与存档合同：**单独批准协议/持久化方案，写迁移及两客户端回归后再接入 production。
5. **PET-4 一种辅助能力：**提交独立能力合同，由 Combat/World owner 裁决结果；第一种能力稳定后才考虑第二种。
6. **FARM-0 / FARM-1：**另开 Farming & Food 模块，先定义一条可用的食物闭环，再分别实现作物和动物。不能把该任务附加到宠物追随 PR/改动中。

## 7. 交给未来 AI 的目标模板

```text
你本次只负责 ABYSSAL WAKE 的 Pets & Companions 模块。先读本卡、PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md、相关合同和当前 V21 源码，再核对分支、HEAD、脏工作区与活动 loader。

唯一目标：【用户指定 PET-0/PET-1/PET-2/PET-3/PET-4 中一项】。主责模块：Pets & Companions。允许改动文件：【列出】。相邻接口：【World / Quest / Combat / Save / Network 中实际需要的项】。

当前没有确认的生产宠物系统。不得把 companion 混成 enemy mob、NPC、farm animal、inventory slot 或 chat actor。不得擅改 collision、玩家位置、Combat damage/loot、存档格式、Relay 协议、艺术 manifest。无批准协议时只能做隔离原型。

先写状态/复现和回归验收，再做一处限定改动；串行运行相关测试并看完整最终 diff。至少说明追随阻挡、HOME/OUTSIDE、死亡/重生、切区/掉线、两客户端显示、手机输入、存档迁移的覆盖或 UNKNOWN。发现回归就停止叠改，隔离尝试并找根因。不提交、合并或部署。

最终用简单中文报告玩家收益、改动状态、真实验证结果、未验证项、协议/接口风险和下一步；不以本卡或单测通过代替全游戏验收。
```

## 8. 验收标准

### 逻辑与隔离测试

- 未拥有伙伴不能被召回；错误 companion ID 和未知命令安全拒绝。
- FOLLOW / WAIT / RECALL 幂等，重复按键不重复实例化伙伴/动画/网络事件。
- 伙伴不会穿过登记的墙、POI 家具、SafeCamp 边界或水域；卡住能有限恢复，且不改玩家位置。
- 玩家死亡、重生、切区、加载旧档和 Relay 暂断之后，伙伴不会复制、丢主或永久卡死。
- companion ability 不得绕过原 Combat/World 校验，不得双重发奖。
- roster 保存/恢复具有显式 schema version；协议迁移有独立测试。

### 体验验证

- HOME 与 OUTSIDE 的伙伴尺寸、遮挡顺序、动画帧与目标高清像素比例一致；画面不糊、不因缩放变粗马赛克。
- 角色/门/交互点/怪物附近不因伙伴而无法读图或误触；伙伴行为能被玩家理解和控制。
- 手机一手移动、一手发命令时不争抢摇杆/攻击按钮；键鼠、触屏行为一致。
- 双客户端看到同一只伙伴位置、命令、切区、死亡/重连状态，且只有正确 owner 控制。
- 无用户已批准的多客户端方案或真实设备证据时，对应项写 UNKNOWN，不宣称完成。

## 9. 每日原创内容候选：潮痕信使（DRAFT / NOT IMPLEMENTED）

> 这是一个供用户保留、修改或删除的原创内容草案，不是现有游戏角色、素材或已批准的实现任务。仅吸收五款参考游戏的体验启发，不复刻原作内容。

**内容 ID（草案）：** `companion.tidemark_runner`  
**暂定俗名：** 潮痕信使  
**模块 owner：** Pets & Companions  
**首次出现建议：** HOME 外沿的退潮浅滩；玩家完成一次短途 POI 往返后，看到它把一枚被海水冲来的营地徽记推回灯下。是否绑定/收留，仍由后续 Quest & Narrative 设计确认。

### 角色与玩法

- 它是身形低矮、耳鳍像湿布般贴伏、背上长有少量玻璃质潮纹的原创海岸生物。主色为暖灰褐与海玻璃青，腹部和眼睛有克制的灯火暖色反射；身上只有一两处不对称的微光斑，早期不做紫色触手或全身发光，以保持“现实沿海城市逐渐异常”的开局调性。
- 性格表现为谨慎、好奇、认路：HOME 会靠近灯火休息；OUTSIDE 会短暂停步观察被风吹动的塑料布、异常水线或安全路标，再看向玩家。它只提供“这里有值得留意的东西”的情绪线索，不自动标记秘密、不采集、不发现任务完成条件。
- 初始切片只做 **FOLLOW / WAIT / RECALL**。伙伴保持玩家附近但不占交互焦点；被墙/家具隔开时先找短路，不瞬移穿墙，失败就停下并给可读状态提示。玩家倒地、切区、掉线和重生规则在实现前单独确认。
- 一次简短互动可让它在篝火旁蜷卧，提供生活感；不消耗食物，不产生资源，不治疗，不参与命中判定，不扩展背包。以免把五种系统揉进一个“宠物大包”。

### 五款参考经验怎样汇合

| 参考经验 | 本原创候选的落点 | 明确不照搬 |
|---|---|---|
| Crashlands 的生物个性 | 通过耳鳍、嗅闻、缩身和回头看玩家形成可读性格 | 不复制既有外观、名字、动画、掉落或战斗能力 |
| Terraria 的探索动力 | 潮痕姿态提醒玩家留心环境，线索仍需玩家自己调查 | 不做装备门槛、宠物收集图鉴或自动寻路奖励 |
| Minecraft 的玩家表达 | 允许玩家选择跟随/等待，在 HOME 安排伙伴停留位置（后续独立切片） | 不做建造系统/方块宠物复刻 |
| Don't Starve 的出行准备 | 出发前玩家可确认伙伴是同行还是留守；危险提示必须诚实、有限 | 不增加饥饿惩罚、不代替玩家侦察或战斗 |
| Stardew Valley 的生活节奏 | 回家后有短暂休息姿态和主动靠近灯火的小动作 | 不照搬好感礼物、动物产品或农场经济 |

### 高画质概念素材合同（后续 DRAFT brief）

- **模块职责（canonical owner）：** Asset Pipeline 负责源图包、元数据与检查；Rendering & Camera 负责投影、采样和实际画面验收。概念创作/美术指导是协作者职责，不另造一个模块 owner。本卡目前只给 brief，不生成或接入正式 PNG。
- **候选素材 ID（仅 DRAFT）：** `candidate.companion.tidemark_runner.anim.idle`、`.walk`、`.observe`、`.rest`、`.portrait`；观察微光 `.signal_glint` 可选且必须是独立表现资产，不能携带提示判定逻辑。Asset Pipeline 确认 ID/文件命名与现有清单合同兼容后才可冻结。
- **源尺寸/帧格状态：** 旧提案中的 96×96 px、锚点 `(48, 82)`、主体 68–76 px 和每动作 4 帧都只是**未核实的样例**，不可作为已批准的出图尺寸。PET-ART-1 开始前，Asset Pipeline 与 Rendering & Camera 要先查当前角色帧格、相机投影、目标显示尺寸和像素密度合同；然后在 brief 中填写每帧宽高、锚点、每动画帧数、排列方向、透明留边和目标屏幕尺寸。帧数据要么逐动画单独文件，要么按已核实 loader 合同组成图集；不得把多个动作塞成没有元数据的单张图。
- **风格：** 细节丰富但像素簇边缘清楚；限定 12–20 个主要颜色，阴影用有形状的像素块，不用柔焦、噪点、渐变雾或缩放补尺寸。潮纹必须在原生尺寸仍可读；别靠放大滤镜制造“高清”。
- **显示目标：** 角色可见高约 50–68 屏幕 CSS px 仅为 **UNVERIFIED 的软目标**，不是冻结尺寸；Rendering & Camera 必须按实际 3/4 投影和两种 viewport 复核后才能选定显示比例。脚底投影和碰撞脚点分开定义；电脑 1280×720 与手机 390×844 都要检查全身辨识、同玩家遮挡关系、互动距离和邻近地面清晰度。
- **清晰度验收：** 记录源图尺寸/alpha/色数/帧格/锚点/哈希；在实际 renderer drawImage 路径验证 imageSmoothing/整数或明确比例缩放、DPR 1/2、非整数移动时是否发糊。必须看运行画面，源图或 2×放大预览不能代替游戏尺寸；一旦变粗马赛克、轮廓糊、缩小后个性丢失或压住玩家/交互点，标记 **REVISE**。
- **高低光测试：** 白天营地与首次 OUTSIDE 阴影各一张；微光只给观察状态短暂反馈，不能持续盖住像素细节，也不能像战斗命中提示。

### 分模块实施顺序与交付物

1. **PET-CONTENT-0（本卡）：**用户审阅这只伙伴与体验范围；无代码/素材产出。
2. **PET-ART-1：**先确认尺寸/帧格合同，再只画 sprite/portrait 视觉探索；Asset Pipeline 接收原始 PNG、逐帧预览、源文件哈希、尺寸/alpha/锚点与动画布局清单。限定候选美术目录，不碰 loader、碰撞、存档、UI 和 Relay。用户选形象后再进入下一块。
3. **PET-RENDER-1：**在隔离 3/4 预览显示静止 actor，验证脚底排序、清晰度和两个目标视口。只读假快照；不能新增伙伴状态或互动。
4. **PET-BEHAVIOR-1：**独立建立 FOLLOW/WAIT/RECALL 的临时行为合同与单元测试，World & Terrain 提供坐标单位、可行走查询和经过碰撞校验的移动接口；Pets 不能直接写越过校验的位置。不处理保存/联机/战斗。
5. **PET-COMMAND-1：**Input/Accessibility 发一次归一化命令，Pets 状态 owner 处理 FOLLOW/WAIT/RECALL；UI 展示状态；重复输入不得重复生成实体。
6. **PET-PERSIST-1 与 PET-COOP-1：**保存迁移和双客户端可见性必须分成不同任务，由 Core State & Save 与 Network & Co-op 审批；无批准前保持本地隔离，不改 schema/event/payload。
7. **PET-ABILITY-1（可选，最后）：**只有跟随可靠、核心战斗已验收后才讨论观察能力；Combat/World 决定其效果，Pets 只能发请求，不能判命中/给奖励。

每块都要有明确 allowlist、一个主责 owner、一个相邻接口、一个自身回归、一个邻接回归和回滚点。运行测试顺序：先宠物独立，再 World/Movement/Interaction/Animation 的接口回归，再全套串行；遇到新增失败先隔离并查根因，不继续堆补丁。

### 用户审阅方式

可直接回复：**保留潮痕信使 / 修改：…… / 删除该候选**。没有用户选择前，本候选只保存在草案区；不会自动生成源图、加入任务路线或接入游戏。

## 10. PET-0 合同缺口与下一位 AI 的执行约定

**本轮状态：**只读复核确认当前仓库只有本模块卡和内容交接文档；未找到潮痕信使 sprite/portrait、宠物运行时 owner 或 Pets 专项测试。因此角色、素材和玩法依旧是 **DRAFT / NOT IMPLEMENTED**，本轮修订只让交接条件更可执行，不代表已制作美术或功能。

下一位 AI 先完成以下合同核对，不要用猜测填数值：

1. **命令定义（本卡的设计提案）：**`FOLLOW` 让伙伴跟随当前 owner；`WAIT` 让伙伴停在当前可行走位置直到新命令；`RECALL` 让伙伴尝试沿已验证的合法路径回到 owner 身边，**不代表回 HOME、不代表收起伙伴，也不允许瞬移**。这些语义尚未实现；若用户/模块评审要改，先改本卡与测试合同再写行为代码。
2. **空间与卡住规则：**World & Terrain 是坐标、可行走性和碰撞结果的唯一 owner。PET-BEHAVIOR-1 必须先核实世界坐标单位及可调用的移动/碰撞接口；Pets 只计算目标意图并请求合法位移。停走距离、追赶速度、最大脱离距离、卡住判定时限都必须由实际坐标/移动合同和手感测试确定，不在本卡虚构数字。目标不可达时安全转 `WAIT` 并显示简短状态，不穿墙、不挤过门、不改玩家坐标。
3. **分区边界：**PET-1 是单区、单机、非存档/非 Relay 原型。没有经 Network & Co-op 与 Core State & Save 审核的切区/重连/死亡恢复合同前，不跨区创建副本、不接真实玩家存档或联网消息；这些情况在原型中保持可见的 `UNKNOWN / not supported`。
4. **观察表现边界：**潮痕信使可以做谨慎张望、嗅闻水线等角色表演，但表演本身不代表存在可采集物、隐藏 POI、任务目标或奖励。未来若要提示真实线索，POI & Exploration 或 Quest & Narrative 必须提供明确的只读线索事件/快照；Pets 不能自己发现、解锁或发奖。
5. **图像合同和验收交付：**不得直接沿用尚未核实的 96×96 样例。PET-ART-1 交付原始 PNG、每个动画的帧布局说明、帧/锚点预览、尺寸与 alpha 检查、源哈希和候选文件清单；PET-RENDER-1 在真实 successor 运行中提供 1280×720 与 390×844 截图及显示缩放/DPR 记录。源图好看或 57/57 加载成功都不等于游戏内画质通过；没有真实运行图时仍标 `UNKNOWN`，出现模糊、粗马赛克、角色辨识丢失或遮挡错误则 `REVISE`。
6. **责任命名：**任务单只用 canonical owner `Pets & Companions`、`Asset Pipeline`、`Rendering & Camera`、`World & Terrain`、`Input & Accessibility`、`UI & Map`、`Core State & Save` 和 `Network & Co-op`。不得把“Rendering & Art”当成另一个代码 owner。

**建议顺序：**先完成 PET-0 合同确认；用户保留潮痕信使并选中美术阶段后才做 PET-ART-1；之后分开验收 PET-RENDER-1、PET-BEHAVIOR-1 和 PET-COMMAND-1。存档、多人同步和任何战斗能力另立任务并由相应 owner 审核。此排序是待执行计划，不表示任何阶段已开始。

## 11. 相关模块与资料

- [总模块化玩法开发蓝图](2026-10-04-modular-gameplay-development-blueprint-v1.md)
- [Combat & Weapons 模块卡](2026-10-04-combat-weapons-module-card-v1.md)
- [NPC & Social 模块卡](2026-10-04-npc-social-module-card-v1.md)
- 当前玩家/怪物/远程同步/世界碰撞所有者：`modules/core/runtime-state.js`、`modules/combat/mob-combat.js`、`modules/network/outbound-sync.js`、`modules/network/inbound-events.js`、`modules/world/world-spatial-v1.js`

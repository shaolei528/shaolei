# Pets & Companions — 模块卡 V2

**状态：DRAFT / PLANNED / NOT IMPLEMENTED**

### 概念图补充（2026-10-05）

- **DRAFT visual study:** AI 生成了一张 716×716 的“潮痕信使”概念图，呈现海岸湿沙环境中的小型暖灰褐生物、海玻璃青色鳍耳/潮纹和琥珀色眼睛。图像仅用于讨论轮廓、配色和气质；未选定、未进入仓库/游戏、不是 sprite 或 production asset。
- **审阅意见：**亲和但警觉的海岸生物方向贴合 HOME/OUTSIDE 情绪；图中微小高频颗粒、柔化光影和复杂背景不可直接缩小为游戏角色。后续源图需用清楚硬边像素簇重画，隔离角色透明背景，并通过实际 successor 视口锐度验收。
- **UNKNOWN:** 概念图源文件 SHA/可追踪项目路径、正式角色 source dimensions、帧表、anchor 和屏幕显示尺寸。图像生成尺寸 716×716 不构成任何素材合同。

**唯一主责：Pets & Companions**

**项目目标：**为合作生存沙盒中的同行伙伴建立可单独交给 AI 设计、实现和验收的模块，帮助玩家的 HOME 与远征有情感联系，不把伙伴变成自动战斗、自动采集或第二背包。

## 当前代码事实

- **VERIFIED（限定本轮检索范围）：**本轮查看 `survival-v21.html` 活动入口、`modules/`、`prototypes/successor-3-4/`、`tests/` 中 pet/companion 关键字，以及 assets 中相关文件名；没有找到能证明伙伴 owner、follow/wait/recall 命令、专用运行时美术、宠物存档或同步路径的证据。这是静态来源核对，不等于全仓运行时证明。`modules/combat/mob-combat.js` 管敌对生物，不等于伙伴系统；玩家/敌人绘制不提供伙伴领域状态。
- **VERIFIED：**`Farming & Food` 是单独的 canonical owner；农场动物、成长周期、饲料与产品归它，不纳入同行伙伴 roster。NPC 关系/对话属于 NPC & Social；伙伴取得资格/叙事决定属于 Quest & Narrative。
- **UNKNOWN：**目标 3/4 successor 中伙伴的脚点、显示像素密度、遮挡层级和实际视觉合同尚未验证。仓库没有本候选 `潮痕信使` 的源图；V1 中的尺寸/帧格示例不能直接当生产合同。
- **状态边界：**本卡只定义下一阶段可审阅目标，不代表伙伴图像、服务、玩法、存档或联机功能已加入游戏。V1 保留为历史和候选细节参考，不删除。

## PET-0 静态接口核对（2026-10-05）

以下为本次源码检查所得，不是运行时宠物验证：

- **VERIFIED — 两个不同的碰撞入口：**`terrain-v21.js:152–180,237–245,264–286` 暴露 `ABYSSAL_TERRAIN_V21.resolveMovement`；但它查询 V21 地形的水域图，活动 wrapper 只包住玩家全局 `me.x/y`。`modules/world/world-spatial-v1.js:11–28` 暴露按 zone 注册矩形几何的查询；`resolveMovement` 在该 zone 没有注册几何体时会直接返回目标坐标。`modules/world/awakening-world-v1.js:81–82,111` 提供依赖 `currentZone` 的 Awakening 几何 wrapper。它们范围不同，当前没有证据表明存在覆盖所有区块、所有地形/障碍并供任意实体调用的统一合法移动/寻路接口。**PET-BEHAVIOR blocker：**先由 World & Terrain 明确统一的实体位移/阻挡契约，不能将玩家 wrapper 或可能为空的空间注册表直接当作完整伙伴寻路。
- **VERIFIED — 3/4 绘制可借用但不是宠物模块：**`prototypes/successor-3-4/successor-renderer.js:41,56–68` 有 `drawActor`、统一 `x+y` 深度排序和玩家/远程玩家/NPC绘制；当前 actor 复用 `img.player` 的 24×32 源帧并画成 28×38，锚点偏移是硬编码 `y−38`。render list 只收 camp Guide、players、mobs、resources、props；没有 companion snapshot 或伴侣专属美术/锚点。`camera-adapter.js:3–12` 提供 3/4 投影、深度键和 viewport backing-size helper。此处只可当 PET-RENDER 原型入口，不证明 production successor 已承接 V21。
- **VERIFIED — preview 隔离：**`prototypes/successor-3-4/preview.js:5–13,38–40,65–71` 用 iframe 加载 V21后注入 successor，替换为内存存档 shim 并屏蔽 WebSocket；可以观察本地渲染/部分玩家路径，不能证明宠物真实存档或 co-op。
- **VERIFIED — 当前输入与多人消息：**V21 `joystick.js` 只写玩家 `joystickState`；3/4 preview 的独立触控 pad/键盘也只控制玩家。`interaction-v12.js:270–278` 的 USE 已绑定交互按钮，不是空闲的宠物命令接口。`outbound-sync.js` 的 `move` 事件只发送 `SESSION_ID`、玩家坐标/朝向/状态；`network-relay-v16.js` 的接收器按玩家 ID 建立 `remotes`。没有伙伴实体快照/所有者控制合同。**不得**把伙伴塞入现有玩家 `move` payload 或自行发明 Relay event。
- **VERIFIED — 玩家存档：**`runtime-state.js:2,6` 的 `abyssal_wake_save_v5` 保存玩家位置、状态、inventory、`hasLeftCamp` 等；未见伙伴 roster 字段。successor 预览会拦截真实 localStorage，所以测试它不能证明生产迁移或存档持久化。
- **VERIFIED — owner ID 限制：**`runtime-state.js:2` 的 `SESSION_ID` 每次运行从 `crypto.randomUUID()`（或临时随机 fallback）派生并截短，是 session identity；现有证据不足以把它作为跨会话稳定的玩家/账号 owner ID。**Save/Network blocker：**先确认持久身份来源以及未登录/访客状态的绑定规则。
- **VERIFIED — 已有相邻测试范围：**`successor-live-screen-movement-v1.test.mjs` 覆盖 V21 玩家移动与两个既有 collision owner；`successor-camera-adapter-v1.test.mjs` 覆盖相机变换；`successor-live-candidate-v1.test.mjs` 检查 preview 隔离。当前没有 Pets 专项测试；这些现存测试不能证明伙伴追随、阻挡、owner 恢复、伙伴图像质量或多人同步。
- **UNKNOWN：**完整可复用寻路/合法实体位移 API；伙伴行为状态的 authority；真实 successor 的伙伴 layer/anchor/源图/屏幕显示尺寸；可交给两个 viewport screenshot 的 companion runtime scene；正式多人伙伴权限和存档 schema。

**PET-0 结论：**可借用 3/4 renderer 的投影/绘制设施做隔离视觉样稿，但需要专属只读 actor record 与已确认的 art contract。行为实现前必须补足或正式指定跨地形空间位移接口；持久化和 co-op 必须等 Save/Network 单独设计。此为已完成的静态核对，不是 bug 修复或 playable pet 功能。

**独立二审：**另一位 AI 逐项复核本节的源码边界摘要，确认“玩家 wrapper / successor actor draw / Relay 玩家快照不能推导为宠物既有接口”的结论有源码依据；没有新增 blocker。此二审是只读意见，不代表新 API 已建成。

## 玩家体验与五款参考游戏的原创转化

伙伴帮助玩家与这座逐渐失常的现代沿海城市建立联系：HOME 灯下让人觉得有生命陪伴，OUTSIDE 用克制、可读的动作表达自己的性格。玩家控制它跟随还是暂候；它不能代替玩家战斗、搜刮、发现任务或判断危险。

| 参考游戏体验 | ABYSSAL WAKE 的未来可观察目标 | 不复制、不越界 |
|---|---|---|
| Crashlands | 伙伴有鲜明但克制的个性动作；未来战斗能力先由 Combat 裁定结果。观察者能辨认动作，不会误读成攻击。 | 不复制角色、生物、动作、武器、掉落或夸张语气。 |
| Terraria | 随探索/成长逐步开放少量伙伴选择；UI 能清楚区分且不压过区域发现。 | 不复制召唤物、宠物图鉴、解锁树或区域顺序。Quest/Progression owner 决定资格。 |
| Minecraft | 玩家能决定同行或留在 HOME；命令只执行一次且状态反馈清楚。 | 不复制方块宠物或驯服/喂养规则；玩家表达不意味着自由建造由本模块拥有。 |
| Don't Starve Together | 出门前看懂伙伴状态；危险时伙伴可靠、有限、可预测；未来双端检查仅在 Network 合同建立后进行。 | 不复制饥饿惩罚、角色能力、季节或伙伴代打；不宣称多人同步存在。 |
| Stardew Valley | 回家时伙伴休息/靠近灯火的动作让 HOME 更温暖；互动短且自愿，并在目标视口下保持可辨。 | 不复制动物、礼物好感表、日历或农场产物；农场牲畜归 Farming & Food。 |

每个阶段只交付一项玩家收益。首个目标是可靠的同行存在和清楚的命令反馈，不是一次塞入宠物战斗、繁殖、资源生产、情绪值与多人协议。

## 单一状态 owner 与接口

Pets & Companions 唯一拥有未来伙伴的 roster、player owner 绑定、当前伙伴 ID、FOLLOW/WAIT 状态和伙伴自身行为状态。内容目录提供不可变 ID/资格引用；不能另外复制第二份玩家背包、任务、敌人生命值或保存/网络权威。

| 协作 owner | 请求/提供的边界 | Pets 不得代替 |
|---|---|---|
| Quest & Narrative | 由故事/救助结果确认能否结识；Pets 只提交资格请求或读取结果。 | 不接受/完成任务、不解锁 POI。 |
| World & Terrain / Movement & Locomotion | 提供坐标单位、可行走查询与经碰撞验证的位移/路线能力。 | 不直接写未经校验的世界坐标、不穿墙、不修改玩家速度/位置。 |
| Input & Accessibility / UI & Map | 输入将设备操作标准化为一次伙伴命令；UI 显示当前状态和失败原因。 | 不由按钮/UI 改 roster 或伙伴位置；不和移动/攻击输入双触发。 |
| Rendering & Camera / Animation & Presentation | 读取伙伴只读快照，负责 3/4 投影、深度排序、动作和交互显示。 | 不决定获得资格、跟随规则、碰撞、奖励或命中。 |
| Asset Pipeline | 校验原创 PNG、帧格/anchor 元数据、透明边缘、许可与候选清单。 | 不替代 Rendering 的投影/游戏内画面验收；美术候选不能自动进正式 manifest。 |
| Core State & Save | 规定版本化持久化、恢复/回滚与玩家档案迁移。 | Pets 不写任意 localStorage，也不因存档缺失猜造已拥有伙伴。 |
| Network & Co-op | 明确个人 owner、远程呈现、验证权威、切区/重连和兼容协议。 | 不扩展 `abyssal-relay-v1` event/payload、不把本地显示说成 co-op。 |
| Combat & Weapons / Loot & Rewards | 若将来设计战斗行为，Pets 只发有限意图；Combat 判伤害/命中，Loot 判资格/奖励，Items 提交资源。 | 不直接减 HP、判死亡、拾取、发物品或绕过冷却。 |
| Farming & Food | 管理农场动物及其照护和产出，与同行宠物互不共用 roster/状态机。 | 不混合 livestock、产品周期和伙伴跟随状态。 |
| Integration & QA | 覆盖伙伴自身及 Movement、World、Input、Save、Network、Rendering 相邻回归并核验证据。 | QA 不拥有伙伴领域状态；测试绿不代表图像或整款游戏完成。 |

未来命令语义提案（尚无运行时 API）：`FOLLOW` 跟随 owner；`WAIT` 留在当前位置的合法可行走点；`RECALL` 尝试沿合法路径回到 owner 附近，**不等于回 HOME、隐藏伙伴或瞬移**。目标不可达、路径被堵或 owner 暂时不可用时，安全停止并报告失败/等待/可重试状态，不能暗中传送。World/Movement 验证位移，Pets 只更新自身行为状态。

玩家 owner 的身份 ID 应由经过确认的 Character/account/Network identity 提供；Pets 只存储并校验 companion 到有效 player ID 的绑定关系，不创建第二套玩家身份。当前 V21 `runtime-state.js` 中的 `SESSION_ID` 是本次运行新生成的随机会话 ID，不能直接当成跨会话稳定的宠物 owner。伙伴将来属于本地玩家实体还是共享世界实体仍为 **PLANNED**；owner 离线、死亡、切区、换角色、重连和所有权冲突的处理均为 **UNKNOWN**，须由 Network/Save 合同裁定，不能在各客户端复制权威状态。

本 V2 **不定义**捕获/招募方法、喂食/治疗/装备、繁殖、伙伴掉落或资源产出。未来若提出：Quest 决定招募资格；Items 原子结算消耗品；Pets 只改变自己的 roster/bond/care 状态；Farming 管农场动物及其产出；Combat/Creatures 确认战斗结果。本轮检索没有发现这些功能的现行证据。

## 原创候选：潮痕信使

**状态：DRAFT / NOT IMPLEMENTED / 未选定。**沿用 V1 提出的 `companion.tidemark_runner`，不创建重复候选，不生成或接入素材。概念是一只谨慎、好奇、认路的海岸生物：暖灰褐主体、海玻璃青潮纹，只有少量受营地灯火映亮的微光。它在异常水线或被风吹动的城市碎片前短暂停看，再回头看玩家；表演只是性格，不代表它发现了可收集物、秘密、任务或奖励。

### 高画质美术 brief 与验收

- 目标风格 **Modern High-Detail Pixel Art**，目标镜头是用户选定的 **3/4 斜俯视**。剪影、眼神、耳鳍/背部潮纹要在实际游戏比例仍可辨；细节来自组织良好的硬边像素簇、材质明暗和克制配色，而非噪点、柔焦或把大图缩小后称作高清。
- HOME 与 OUTSIDE 使用同一可识别轮廓；HOME 亲和温暖，OUTSIDE 的警觉动作微妙，开局不全身紫光、不抢玩家与道路焦点。动作概念限 idle / walk / observe / rest；不先扩展战斗帧或复杂技能。
- **尺寸、sprite cell、帧数、排布、anchor、目标显示尺寸均为 UNKNOWN。**PET-ART 开工时，先与 Asset Pipeline 和 Rendering & Camera 核查当前像素密度/角色 atlas/投影合同。V1 提到的 96×96、`(48,82)`、帧数及屏幕高度都只是未验证示例，不能作为已批准出图规格。
- 每个候选交付源图、无插值帧预览、文件 SHA-256、真实尺寸/色彩/alpha 检查、frame layout、透明留边和 source anchor 说明。脚点/逻辑碰撞点分开；不以透明边缘猜碰撞。
- 在选定 successor 实际运行状态测试 **1280×720** 与 **390×844**：报告 DPR、CSS 与源像素尺寸/缩放、角色在场景中占比、运动时锐度、脚点遮挡、轮廓辨识、交互命中区域与手机控件冲突。源图、单图放大和静态拼贴都不算运行时验收。
- 画面放入游戏后发糊、成为粗马赛克、缩小后失去物种辨识、边缘抖动或挡住玩家/交互/道路，记 **REVISE**；没有真实运行的两种目标视口则记 **UNKNOWN / NOT ACCEPTED**。不得改素材/manifest 来掩盖失败。

美术协作者只在明确候选目录工作，不改代码、碰撞、UI、loader、存档、联网或 manifest。PET-RENDER 是另一项工作：Renderer 读取临时只读伙伴快照，不自造已拥有伙伴；只有用户另选 PET-ART 后才创建任何新图像。

## 分阶段任务路由

| 阶段 | 唯一 lead | 结果与边界 |
|---|---|---|
| PET-0 合同/状态审查 | Pets & Companions | 复核坐标、现有 World/Movement 查询、输入通道、renderer、保存与联网前置；只读，无代码/素材。 |
| PET-ART-1 原创候选 | 用户指定的美术协作者（只负责该候选图，不增设代码 owner） | Asset Pipeline 先确认源图合同；候选交付带完整源文件/元数据并进入独立审阅，不改 manifest/runtime。 |
| PET-RENDER-1 角色显示 | Rendering & Camera | 仅将临时只读 snapshot 显示于隔离 successor；测试锚点、排序和两种屏幕尺寸，不建 roster/保存。 |
| PET-BEHAVIOR-1 跟随状态 | Pets & Companions | 单机、单区、临时伙伴状态与 FOLLOW/WAIT/RECALL；只能请求 World 合法移动。不加伤害、拾取、Save/Relay。 |
| PET-COMMAND-1 玩家命令 | Pets & Companions | 一次输入只改变一次合法伙伴状态；Input 发规范 intent，UI 展示状态。 |
| PET-PERSIST-1 / PET-COOP-1 | Core State & Save / Network & Co-op 各自负责合同 | 分开审定玩家 owner、schema/migration、远端快照、重连和权限；不得混进单机跟随切片。 |
| PET-ABILITY-1（以后可选） | Combat & Weapons 或对应领域 owner | 在伙伴可靠性及主循环验收之后另立提案；Combat/World 判定效果，Pets 仅请求。 |

每个具体 AI 任务必须只有一个主责 owner；若需要跨模块同时改状态/合同，应拆成依赖明确的小任务，不给两个 AI 同时编辑同一批文件。并行美术与代码工作必须使用分开的目录/文件，并检查共享工作区，保留来源未知的内容。

## 行为与回归验收

未来 PET-BEHAVIOR/COMMAND 实现最少验证：无所有权时不能召回；未知 ID/命令安全拒绝；重复命令幂等；只有一个实体；等待位置可行走；狭门、墙、水、POI 家具、HOME 边界不穿越/堵塞；路径不可达能安全停止；不能移动玩家；不能吞掉玩家交互/战斗输入。死亡/重生、切区、刷新、掉线/重连的行为在 Save/Network 合同没确定前明示不支持，而不是猜处理。

行为代码落地后，首条命令应只有一个明确结果，重复命令不会复制实体或事件；玩家能一眼看出伙伴当前是在 FOLLOW、WAIT 还是受阻，并能区分伙伴与敌人/NPC。运行对应 Pets fixture，再跑 movement/world/interaction、successor 移动与投影、模块路由/module-sort 中实际相关检查。对每项记录 PASS/FAIL/UNKNOWN；检查完整 diff 和相邻模块回归。失败先停下找根因，不连续堆补丁；已确认 bug 才能标 bug，修复也要用复现步骤和回归证明。没有真实手柄/手机/双客户端证据不得声称通过。

## 下一项可执行任务

**PET-0 已完成（只读）：**上节记录了确切代码边界。下一步应由 World & Terrain 明确一条经验证、可供多个实体请求的跨地图位移/碰撞合同；在此之前 PET-BEHAVIOR 不能安全开工。可与其并行、但必须使用不同候选目录的是 PET-ART-1 单角色概念源图；它需要 Asset Pipeline 先确认宠物源格/anchor 规格，且不能改正在进行的 Safe Camp art 文件。PET-RENDER-1 可在合同和用户选择后用假快照验证专属 actor 绘制。禁止把源图、状态机、UI、保存和联网塞成一个大任务。

## 给下一位 AI 的可复制 Goal

```text
你只负责 ABYSSAL WAKE 的 Pets & Companions 模块。目标是把有个性的同行伙伴逐步做成高清、清晰、可靠、模块边界明确的体验，但当前没有已验证的 production companion service 或 companion art。

开始前先读 AGENTS.md、项目 Skill、PROJECT_CHARTER.md、PROJECT_STATE.md、SUCCESSOR_MODULE_MAP.md、本 V2 卡与活动的 World/Movement/Input/Rendering/Save/Network 代码和测试；重新核对 branch、HEAD、dirty worktree、loader 和当前运行入口。旧 V1 与聊天只能作线索。

一轮只处理一块并指定唯一主责。当前推荐 PET-0 静态核对：查世界坐标/碰撞合法移动、输入、actor draw hook、像素密度/anchor、Save/Relay 边界，列出处和 blocker；不写代码、不生成素材。不许把农场动物、NPC、敌人 AI、物品、任务状态合并为伙伴 owner。

画面目标为 Modern High-Detail Pixel Art + 3/4 斜俯视。不得猜尺寸或沿用 V1 示例规格；美术先核 Asset Pipeline/Rendering 合同。运行游戏后用 1280×720 和 390×844 查边缘清晰度、角色辨识、遮挡、比例与触控冲突；发糊/粗马赛克写 REVISE，无现场画面写 UNKNOWN。单测通过不等于高清。

不改/删/覆盖并行 AI 或来源不明文件。未明确选择实现前只做只读审查和设计草案；不改 Save schema/Relay/正式 manifest，不提交、合并或部署。最终用简单中文说明玩家收益、证据、实际改动、回归风险和未验证事项；发现回归先停下来隔离并查根因。
```

**本卡交付：**模块与审查目标 DRAFT。潮痕信使保持待审内容；没有新增或接入美术、运行时代码、存档及联网行为。

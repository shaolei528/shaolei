# Creatures & AI — 独立模块任务卡 V2

**状态：DRAFT / NOT IMPLEMENTED as a separate successor service; concept art only / NOT A PROJECT ASSET**  
**唯一主责：Creatures & AI**  
**核对基线：**`fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。共享工作区有大量并行脏改动；本卡只记录能从当前文件确认的状态，不归因这些修改是谁做的。

## 玩家目标与五款游戏经验

怪物不是只有一条血条的障碍。玩家要能观察、判断、绕行或撤退；回家准备和地域环境应帮助玩家选择应对方式。生物也不能全部是敌人，未来温和动物、伙伴、居民周边生物分别配合 Pets、Farming、NPC 模块。

| 参考游戏 | 转译成本作可检查的体验 | 不照搬 |
|---|---|---|
| Crashlands | 少量怪物就有不同、可辨认的轮廓和应对方式；攻击准备清晰，玩家能学会反制 | 怪物造型、行为模板、动画、数值或掉落 |
| Terraria | 新区域逐步引入新的危险和准备要求；Boss 或强敌需作为以后独立阶段，不开局堆难度 | 生物图鉴、Boss 顺序、敌群密度或装备门槛 |
| Minecraft | 地形、障碍、房间和撤退路线能改变追逐与站位；空间由 World & Terrain 验证 | 方块生物生态、刷怪公式、行为代码 |
| Don't Starve | 昼夜与区域危险有预告；玩家有时间准备、观察、躲避并回家恢复 | 理智惩罚、角色能力、饥饿/夜晚系统 |
| Stardew Valley | HOME 与居民周围允许非敌对生物/生活感；世界不等于战斗场 | 村民、宠物、农场、季节或社交系统 |

所有内容应从现代沿海城市与缓慢苏醒的深渊原创发展，不复制参考作品的角色、名字、精灵图、攻击模式、地区、任务和掉落。

## 当前实现核对：现在代码实际做什么（VERIFIED source）

- `survival-v21.html` 按顺序加载 `modules/world/world-state.js`，再加载 `modules/combat/mob-combat.js`；后者提供 `ABYSSAL_MOB_COMBAT_V1.updateMobs()`，主循环显式调用它。Awakening World 会包装 `freshMob`/`spawnMobs` 并追加自己的地点实体。Presentation 与音频包装在后续加载，不是 AI owner。
- `modules/world/world-state.js` 定义基础 `crawler`、`cultist`、`watcher` 与普通区域初值；后续加载的 `modules/safe-camp/game-v7-patch.js` 覆盖生成规则：普通区域 6 只，Safe Camp zone `1:1` 生成 3 只 crawler/cultist/crawler。普通区 HP 为 crawler 58、cultist 72、watcher 95；Safe Camp patch 将 crawler 设为 48、cultist 60。MIRE MART 另在 `modules/world/awakening-world-v1.js` 定义两个 crawler。它们是实际生成参数，不代表平衡或生态设计已经验收。
- `modules/combat/mob-combat.js` 选择可攻击玩家、移动追踪、走动、营地避让、近战视线判断和攻击风暴（windup）。当前 windup crawler/cultist/watcher 为 `.8/.95/1.1s`；攻击冷却 `.9s`（crawler）或 `1.15s`（其他），**冷却从 windup 开始计时**。若玩家不再可打或 LOS 被挡，风暴会取消，但冷却仍消耗；这影响玩法节奏，不能被 presenter 改写。真实玩家是否读得懂/感觉公平仍 UNKNOWN。
- `mob.phase` 当前同时充当漫游相位和负值 windup 计时状态；`hitCd`/`hitCdUntil` 是另行同步的冷却状态。视觉系统目前通过 `phase < 0` 读风暴，再选择怪物帧；不要把通用漫游 phase 当作一个完整、持久的行为状态机。
- **职责混合事实：**`mob-combat.js` 执行 AI/移动；但当前 Mob HP、死亡/重生和奖励仍由 `modules/combat/player-combat.js` 的 `handleMobAttack()` 修改/触发。尚无独立 Creatures HP/life service。区域 leader 负责部分 Mob 模拟与命中结算；Creature canonical owner 是未来目标，不是当前落地架构。
- **快照核对：**周期 `mobs` 与 world snapshot 当前可带 `id/kind/x/y/hp/phase/hitCd/hitCdUntil/respawnAt`；`inbound-events.js` 接收快照并保留冷却窗口。请在实施前重新查看传输路径、字段与频率。V21 客户端 zone leader 的模拟/Relay 广播不等于可信服务端权威，真实双客户端 handoff 也不能由 VM fixture 证明。
- 当前普通击杀有 `m.hp <= 0` guard，达到死亡条件后会设约 11 秒的 `respawnAt`，然后将 mob 重建。已有单次正常击杀测试，但攻击没有清晰的请求去重编号；奖励广播按 target 增加库存，没有独立 claim id。**重复/重放攻击、重复 loot、断线或 leader 切换时 exact-once 奖励行为为 UNKNOWN / SUSPECTED 风险，不是已确认 Bug。**不要未经重现就更改协议或宣称奖励系统有 bug。

必须把上方实现事实与下方目标分开，AI 接手不能按目标表直接开始搬代码。

## 未来 canonical ownership（PLANNED）

| 唯一 owner | 拥有的状态/规则 | 交界规则 |
|---|---|---|
| Creatures & AI | 生物身份与行为状态、目标选择、行为/攻击阶段、mob HP/life/respawn、仅一次 defeated 语义 | 收到 Combat 已确认 damage 后才变更 HP；不决定玩家/怪物攻击是否命中，不发物品，不拥有网络或存档 |
| Combat & Weapons | 攻击请求验证、合法命中、伤害结果语义与现有冷却合同 | 将被接受的 mob/player damage request 交给相应状态 owner；不直接成为 creature AI 或 loot 表 |
| World & Terrain | 坐标、地形/边界/碰撞、路径合法性和 LOS 查询 | AI 请求移动/空间查询；美术像素不得定义墙、命中或可走路 |
| POI & Exploration | 区域语境、POI 身份、远征/访问阶段 | 给生成规则提供只读 place context；不拥有怪物 species、HP 或奖励 |
| Survival & Needs | 玩家 HP、sanity、受伤恢复和生存效果 | 接受经批准的受伤请求；怪物 AI 不直接扣玩家状态 |
| Loot & Rewards → Items & Inventory | 奖励资格/唯一领取 → Inventory 应用库存事务 | 仅消费已确认 defeat；怪物定义/客户端 snapshot 不得直接授予物品 |
| Network & Co-op | 运输现有允许字段与同步消息 | 不把 leader client 说成 server；协议修改需独立审查 |
| Animation & Presentation / Audio & Feel | 订阅意图/确认结果并作视觉、声音、震动表现 | 只读状态；不能以图层、帧或声音决定攻击、伤害、死亡、奖励 |
| Asset Pipeline / Rendering & Camera | 前者验源文件/frame/anchor/manifest，后者验实际投影、DPR 与显示尺寸 | Creature 提供行为语义与美术 brief，但不自建 pipeline，也不把贴图帧宽强行设为 gameplay API |

## 行为合同与第一个可交付切片

DRAFT 状态序列只描述需验证的语义，不意味着现有 API：

```text
ROAM / IDLE → ALERT / SENSE → TELEGRAPH
  → Combat-validated ATTACK → RECOVER / REPOSITION
  → CONFIRMED HURT / DEFEATED
```

第一个测试切片只选一个已有 crawler：在 Safe Camp 外看见玩家后追踪；进入可打范围时做清楚的前倾风暴；玩家离开范围/LOS 或进入安全保护时取消；否则提交一次近战伤害请求；战后有清楚恢复期。所有世界坐标经既有 World/POI 空间约束，击杀后走独立 Loot 请求。暂不添加新生物、Boss、宠物行为、掉落表、生态链或多段攻击。

新 creature 的 DRAFT 内容卡必须说明现代沿海/恐怖阶段、玩家为什么遇到它、读得到的意图、至少一种躲避/绕行方法、与 HOME 备战/返程的联系、行为失败/取消、安全区边界和奖励 owner。五款参考只作为体验问句，不代替本作原创设计。

## 高品质怪物美术与动画门槛

- 目标：**Modern High-Detail Pixel Art**。硬边、统一像素簇尺度、清晰动作轮廓和有节制的材质光影；高细节不等于照片纹理/笔刷/噪点，也不能被处理成粗大马赛克。
- 当前 `assets/monster_sheet.png` 经 PNG 解码验证为 `128×96`，有 alpha；旧 renderer 从 `32×32` 单元取帧。V21 renderer 以 `1.2×` 输出；3/4 preview 从同一 `32×32` 源帧绘到 `38×38`。这说明当前读取尺寸，不证明画面清晰或艺术质量合格。
- 不能由当前旧 sheet 推断 future source contract。Asset Pipeline 接收候选前要核对精确帧布局、朝向顺序、脚点 anchor、alpha、source density、状态覆盖和回退图；不确定的像素维度写 `UNKNOWN`，不猜尺寸、不拉伸/降采样补救。
- 逐项看**原图 → 单帧裁切 → active renderer 实画**；在真实 combat 路线以 `1280×720` 桌面和 `390×844` 手机视口检查。记录 canvas/backing size、DPR、帧源尺寸、显示尺寸、脚点和遮挡。日/夜、草地/道路/店内背景和 HUD 状态都看一次。模拟手机不能冒充实体手机。
- 静态轮廓须分得出 walker/crawler 等原创类别；动画在 idle、警觉、windup、攻击、受击、死亡之间清楚。Telegraph 需方向/姿势/时序多重可读，不依赖单一颜色；地面 cue 不得画错攻击范围或挡住退路。
- 原始文件像素清晰但游戏内变糊、缩放成粗马赛克、脚点漂移、帧跳难读或预警被 UI 遮挡：标 `REVISE / NOT PRODUCTION` 并定位 Asset/Renderer/Animation owner，禁止声称素材接入验收通过。

## 当前测试证据与缺口

本工作区已有 focused regression：

- `tests/mob-attack-windup-v1.test.mjs`：风暴延迟伤害、躲避/LOS 取消、windup 状态表现兼容。
- `tests/mob-cooldown-authority-handoff-v1.test.mjs`：leader handoff/cooldown 数据 fixture。
- `tests/awakening-world-logic-hardening-v1.test.mjs`：墙体/POI 空间与 LOS、Safe Camp、正常击杀奖励、重生/速度等 fixture。
- `tests/core-smoke.test.mjs`、`tests/combat-hit-feedback.test.mjs`、`tests/combat-presentation-retry-idempotency-v1.test.mjs`、`tests/playable-slice-combat-presentation-v1.test.mjs` 为相邻合同。
- loader/split copies 改动还需 `tests/module-sort.test.mjs` 及相关 V21/V17 source-parity 测试。

这些测试通过不表示全体生物设计/平衡、真机可读、奖励去重、多人公平、切区/断线 edge cases 或真实服务器 authority 已通过。需要加的回归建议：一击影响多个敌人边界；重复 attack packet 不二次结算；同一 defeat 只发一次奖励；重复 `loot` event 不重复加库存；HP=0 snapshot 后 leader takeover 至 respawn 生命周期；玩家离开/死亡/field ward/LOS 改变后 windup 的确定行为。当前未证明的问题保持 `UNKNOWN`，先构造可复现例再定 bug。

## 单模块派工文本

```text
本次只负责 ABYSSAL WAKE 的 Creatures & AI。先读 AGENTS.md、continuity Skill、PROJECT_CHARTER.md、PROJECT_STATE.md、SUCCESSOR_MODULE_MAP.md、本 V2 卡、Combat V2 卡、MODULE_MAP.md、活动 survival-v21.html 和 creature/world/combat/network 代码。重查当前 branch/HEAD/dirty worktree；保护未知并行文件。

唯一目标：【用户选择的一个可复现 Creature bug 或一个很小的 AI 行为切片】。唯一主责：Creatures & AI。协作者按需要写 Combat & Weapons / World & Terrain / POI & Exploration / Network & Co-op / Animation & Presentation。先画出现状调用链，说明不是已实现的未来 API。允许改动的精确文件：【现场确认】。

若为 Bug，先提供失败复现与玩家影响，再做最小回退友好修复；回归覆盖目标与邻接边界。Mob HP 改动不得跳过 Combat 确认；玩家 HP 归 Survival；掉落经 Loot 到 Inventory；空间经 World/POI；动画/音频只读；不改协议、save 或权威系统作为顺手扩展。duplicate/replay/leader handoff 先当 UNKNOWN，未复现不要报 confirmed bug。

怪物视觉只做 DRAFT；源帧未核合同或没有 active renderer 图像时写 UNKNOWN / REVISE。实际 1280×720 与 390×844 显示报告 DPR/source/display/frame/anchor；真实设备、双客户端和公网状态分开写。不删除、合并或部署。

最后用简单中文说明玩家影响、改动文件、测试、是否引入相邻风险和未验证项。不要用“测试全过”替代实机/多人/画质验收。
```

## DRAFT 审阅方式

本轮生成两版六姿态原创 shoreline crawler 概念板，仅在聊天中预览，没有复制到工程。第一版边缘/纹理偏涂绘，判 `REVISE`；第二版经过风格编辑后有更清楚的硬边和像素簇，可作为 **pixel-art direction study** 讨论，但各格动作差异仍不足、没有固定 source frame/anchor/比例合同，因此仍是 **DRAFT / NOT A PROJECT ASSET / NOT A SPRITE SHEET**。后续姿态区分编辑请求连接失败；不得把第二版自动接入 atlas 或 production。用户之后可选择保留/修改/删除设计卡或要求重做视觉稿；保留设计卡不表示选择新敌人、授权代码、批准 PNG/精灵表或允许进入正式素材。

# Combat & Weapons — 独立模块任务卡 V2

**状态：DRAFT / NOT IMPLEMENTED；概念图请求因连接失败未生成**  
**唯一主责：Combat & Weapons**  
**当前工程基线：**本地 `fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。工作区有大量来源混杂的修改和未跟踪文件，均须保留，不能归因给本轮。

## 玩家目标与五款游戏体验转译

玩家要马上知道自己挥了什么、有没有打中、敌人从哪里进攻、自己能否退开；战斗为准备、探索与回家成长服务，不压过 HOME 生活感。借鉴体验但保留 ABYSSAL WAKE 自己的角色、武器、敌人、数值、动画、地图和奖励：

| 参考 | 转化为本作的战斗验收 | 不照搬 |
|---|---|---|
| Crashlands | 每种基础攻击的起手、挥空、确认命中、受伤反馈容易区分；敌人有辨识度 | 角色、怪物、武器、攻击模板和反馈特效 |
| Terraria | 新装备/区域逐步增加可读战术选择；进入新威胁前教会必要反应 | 武器树、Boss 阶段、区域顺序与数值 |
| Minecraft | 出门装备准备与 HOME 工作台/库存自然衔接 | 合成配方、装备槽、武器属性架构 |
| Don't Starve | 危险有可读的准备信号和撤退窗口；生存压力由其 owner 结算 | 疯狂值曲线、角色差异、饥饿战斗惩罚 |
| Stardew Valley | 战斗是日常与社区生活的一部分，安全营地让玩家放松 | 村民、日历、任务、地图、音画内容 |

## 先区分现在和目标

### 当前 V21 源码观察（VERIFIED source；不表示模块边界已完成）

- `survival-v21.html` 是实际 loader。它先加载 `player-combat.js`、Survival 与输入模块，后加载 `mob-combat.js`；碰撞/世界包装在 terrain 与 Awakening world 阶段继续接入；更后才加载 hit-feedback、weapon-presentation、playable-feel 与音频包装。改 loader 顺序必须重跑 `module-sort` 和对应镜像/重试检查。
- `modules/combat/player-combat.js` 处理玩家攻击门控、Safe Camp 攻击保护、既有 `attack` 广播；其当前区域 leader 命中路径也直接改变 `m.hp`、设 `respawnAt` 并调用奖励函数。V21 现状因此仍混合了 Combat、Creatures 与 Loot 职责。
- `modules/combat/mob-combat.js` 当前更新 mob 移动、攻击准备/冷却并请求共享空间/近战 LOS 检查；这些是既有混合实现事实，不等于独立 Creatures 服务已经建立。
- 玩家 HP 写入并非集中 owner：`modules/network/inbound-events.js` 对玩家受到的攻击/怪物命中扣 HP 与 sanity；`modules/survival/status.js` 处理本地生存状态变化；`modules/survival/lifecycle.js` 管死亡/重生。Survival & Needs 集中应用玩家伤害是未来边界，不是现有完整实现。
- Relay/zone leader 传递现有 `attack`、`mob_hit`、`mobs`、`loot` 消息。攻击事件包含客户端提供的坐标、方向、范围与伤害字段；leader 结算及 clamp 不代表完整 server authority 或反作弊。保留既有协议；协议/权威模型需独立决策。
- 当前在源码合同里可见基础数据：徒手 damage 11 / range 62 / cooldown 0.48s；Bone Knife damage 22 / range 80 / cooldown 0.32s；Safe Camp 拒绝攻击。实施任何数值任务前仍须核对活动入口和真实工作树。
- Presentation / audio 包装读取攻击与结果语义。它不得决定伤害、HP、敌人死亡、掉落或攻击是否命中。

### 未来 canonical ownership（PLANNED，不是已迁移事实）

| owner | 唯一职责 | 与 Combat 的接口 |
|---|---|---|
| Input & Accessibility | 各设备生成一次规范化攻击 intent | 调用既有攻击入口；不判命中 |
| Combat & Weapons | 攻击请求规则、合法目标/命中条件、冷却/伤害合同、确认伤害结果 | 对 Creature / Survival owner 发确认的伤害请求 |
| Creatures & AI | mob 身份、AI 意图、Mob HP/life/respawn、每次 defeat 一次 | Combat 确认后才结算 mob damage；自己不决定命中 |
| Survival & Needs | 玩家 HP、sanity、生存效果 | 接收已确认的玩家伤害；Combat 不直接改 needs 状态 |
| Loot & Rewards | 按已确认 defeat/剧情 eligibility 选择奖励 | 发 grant request；不能直接改 Inventory |
| Items & Inventory | 库存原子增减、装备事实 | 接收已确认奖励；Combat 不拥有 stacks |
| Network & Co-op | 按现有协议传递同步信息 | 不是游戏规则 owner 或存档 owner |
| Animation & Presentation / Audio & Feel | 订阅已确认结果并反馈 | 只读，不回写 gameplay authority |
| Rendering & Camera / Asset Pipeline | 投影/显示验收；源美术元数据、绑定与 intake | 分别对接读取状态与图像源，不定义 combat collision |
| Integration & QA | 跨模块回归、证据分级与验收报告 | 不持有领域状态 |

### 五款参考游戏的原创战斗切片

候选切片 **DRAFT / NOT IMPLEMENTED**：Safe Camp 门口出现一个原有低阶爬行敌人；玩家以 Bone Knife 观察一次攻击准备，试着退开，再回击并带资源回 HOME。动作状态至少区分 `ATTACK_REQUESTED → SWING/MISS` 与已确认 `HIT → HURT/DEFEAT`；敌方 `WINDUP → HIT/CANCEL`。准确事件/API 名称须服从实际 owner 合同，图中箭头不是批准接口。

玩家可观察标准：输入一次仅攻击一次；挥空没有命中特效/奖励；确认命中只结算一次；安全营地保护不退化；预警方向/危险窗口和实际攻击逻辑一致；玩家有看得懂的退路；击杀才进入奖励流程。任何闪光、声音、动画帧、像素轮廓都不能成为命中或奖励依据。

## 视觉与高画质门槛

- **Modern High-Detail Pixel Art**：锐利硬边、清楚轮廓、有组织的材质像素簇、受控明暗；高细节不能靠照片纹理/涂抹笔触/噪声。高清源图不自动是合格游戏素材。
- 武器、玩家、怪物的 frame size、anchor、源像素密度和 display scaling 先从当前 atlas/Asset Pipeline 合同核实；未核实写 `UNKNOWN`，禁止猜尺寸、拉伸或降采样凑规格。
- 在真实 3/4 combat gameplay 的 `1280×720` 与 `390×844` 检查角色足点、刀锋、预警和逃生路是否锐利可辨；检查 HUD 遮挡、背景与角色密度一致性。记录 browser/canvas/DPR、source/display 尺寸。物理手机和模拟视口分别陈述。
- 预警不仅靠颜色：方向、轮廓、动画时序应可读；警示形状不得暗示错误的判定距离。挥空、命中、玩家受伤和击杀要一眼区分，且不允许闪光淹没怪物/道路。
- 本地既有 combat 概念图记录为 `REVISE / NOT PROJECT ASSETS`。本轮准备的一张原创高清像素概念图生成遇到连接失败，**尚无新图**。之后只可作为内容草案展示；必须由用户选留、再按 Asset Pipeline/Rendering & Camera 流程验收，不能直连正式 manifest。

## 测试和当前风险证据

本轮对当前工作区串行重跑以下 8 个针对性 fixtures，均 PASS：

- `core-smoke.test.mjs`：Safe Camp 攻击保护与基础 combat。
- `awakening-world-logic-hardening-v1.test.mjs`：空间/LOS、边界、既有 combat 数值及兼容性 fixture。
- `combat-hit-feedback.test.mjs`：表现层不变更伤害、范围、冷却与网络字段。
- `combat-presentation-retry-idempotency-v1.test.mjs`：重复包装重试后 feedback wrapper 稳定。
- `playable-slice-combat-presentation-v1.test.mjs`：挥空/命中语义、受伤与死亡表现、受限镜头反馈。
- `mob-attack-windup-v1.test.mjs`：攻击前准备、躲避/LOS 取消与快照兼容 fixture。
- `mob-cooldown-authority-handoff-v1.test.mjs`：leader 切换保留攻击冷却的边界 fixture。
- `awakening-expedition-loop-v1.test.mjs`：远征逻辑维持现有 combat 与 Relay 行为。

这些是隔离测试与源码合同，不证明真实 Relay 双客户端同结算、重复/乱序奖励全覆盖、真机输入手感、实际音频舒适度、生产战斗美术或完整 HOME → POI → 战斗 → 返家验收。没有本轮复现证据的风险仍是 `UNKNOWN`，不称为 Bug。发生 Bug 修复须先给出复现、失败回归、窄范围 diff、目标与相邻回归结果及未测影响。

## 单次实施范围模板

每个派工只选一个可核验目标，填写：主责 Combat & Weapons；协作 owner；用户可见结果；允许文件；排除文件/协议；活动 branch+HEAD；复现方法/失败回归；目标与邻接回归；runtime/viewport/双客户端证据。其他 AI/工作树正在改动的文件只读保护。

```text
本次只负责《深渊苏醒》Combat & Weapons。开工先读 AGENTS.md、Skill、PROJECT_CHARTER.md、PROJECT_STATE.md、SUCCESSOR_MODULE_MAP.md、此 V2 卡与 MIRE_MART_EXPEDITION_LOOP_V1.md，并重新核对活动 branch/HEAD/工作区/loader 顺序/相关源码。

唯一目标：【用户已经选定的一项可复现 Bug，或单个小战斗设计切片】。主责 owner：Combat & Weapons。协作接口：【本次实际需要的 owner】。允许文件：【重新盘点后逐项列明】。

先证明当前行为及其对玩家的影响；Bug 要加能够失败的回归，再做最小可回退修复。区分现有实现和未来 canonical owner，保留 Safe Camp 保护、当前数值及 `abyssal-relay-v1` 事件合同，除非用户另行明确选择协议/数值变更任务。严禁让 presenter/audio/art 决定游戏命中、mob HP 或奖励。

高画质验收必须基于真实战斗画面，在 1280×720 与390×844报告 source 尺寸、显示尺寸、DPR、HUD遮挡和读图效果。图稿只留为 DRAFT，未通过运行时美术门槛标 REVISE/UNKNOWN。真实 browser/device/双客户端缺证据不得宣称通过。不提交、不合并、不部署、不删除未知文件。

最终用简明中文列出玩家结果、VERIFIED/UNKNOWN、文件、复现与测试、潜在相邻回归以及未验证项；红字/测试失败要解释意义，不猜 Bug 原因。
```

## 下一步

1. 先以这张 V2 卡和 [Combat 高细节像素 brief](2026-10-05-combat-high-detail-pixel-art-brief-v1.md) 做只读设计审阅。
2. 下一项可选的是相同武器/怪物的单场景 pixel art study；前述生成失败后暂不复用旧 painterly 图。先让用户看到真实草案后再收意见。
3. 实际 combat code bug 必须单独明确目标；模块卡本身不给任何 runtime 迁移或新机制授权。

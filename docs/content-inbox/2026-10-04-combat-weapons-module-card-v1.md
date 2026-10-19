# Combat & Weapons — 独立模块任务卡 V1

**状态：DRAFT / NOT IMPLEMENTED / 供未来任务分派**  
**本卡目的：**让一个 AI 能独立审查或开发 Combat & Weapons，而不顺手重写怪物、背包、移动、联网、音效或整个玩家循环。  
**基线核对：**2026-10-04 10:24（Asia/Rangoon），本地分支 `fix/awakening-production-gate-qa-findings-v1`，HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。工作区有多个未提交/未跟踪文件，归属不明；本卡只记录代码快照，不确认这些改动是谁做的。

## 1. 玩家体验目标

玩家按下攻击后，角色应快速、清楚地挥出武器；玩家能读懂是否命中、是否击杀、敌人是否正在攻击，并能用移动/闪避/退回 HOME 做出应对。装备升级和探索所得要逐渐丰富战斗选择，但不能在第一个切片塞进很多难以理解的武器与状态。

五款参考游戏转化为本模块的设计约束：

- **Crashlands：**敌人意图、攻击反馈和战利品用途容易理解；敌人有个性但不靠混乱数值制造难度。
- **Terraria：**武器/工具与地区成长可以逐步解锁；一件新装备要带来清楚的新选择。
- **Don't Starve：**出门准备、昼夜和危险要有可读提示；生存压力与战斗节奏互相支持。
- **Minecraft：**HOME 的工作台和装备准备影响下一趟远征；不要在 Combat 内重复实现制作/背包。
- **Stardew Valley：**居民请求可在未来给战斗/搜刮提供目标，但 NPC/任务不拥有命中与伤害。

只借鉴玩家体验，不复制原作角色、武器、动画、怪物、美术、数值、招式或掉落表。

## 2. 模块职责和唯一状态 owner

**主责模块：Combat & Weapons。**当前 V21 相关代码分布在 `modules/combat/player-combat.js`、`modules/combat/mob-combat.js`，并由网络输入处理、共享玩家状态和表现扩展接合。

| 子职责 | 谁拥有 / 读写什么 | 不可越界 |
|---|---|---|
| 玩家攻击请求 | `player-combat.js` 接受攻击意图，应用当前开局/死亡/冷却/安全营地条件并发出当前协议消息 | UI、按钮和摇杆不能自己扣血或决定命中 |
| 命中规则 | 现有区域 leader 的 combat 路径检查距离、朝向、遮挡并更新 mob HP | 动画、音效、特效不能确认命中；Relay 在线不代表完整 server authority |
| 怪物移动/接触攻击 | `mob-combat.js` 更新现有基础怪物状态，并请求空间服务检查移动和 melee LOS | 怪物 AI 不得复制玩家背包、存档或网络 socket 生命周期 |
| 死亡/奖励交接 | Combat 发布已确认的命中/伤害结果；Creatures 更新 mob HP/life 并发出一次 defeat；Loot & Rewards 决定奖励清单；Inventory 应用库存变化 | Combat 不直接发明 item schema、存档键、掉率或 POI 资源规则；此为目标边界，现有代码仍分散 |
| 动画与命中表现 | `weapon-presentation-v1.js`、`hit-feedback.js`、`playable-feel-v1.js` 读取攻击/命中/受伤结果 | 表现包装器不得改伤害、距离、冷却、Mob HP 或命中权威 |
| 战斗音频 | `playable-feel-audio-v1.js` 订阅 swing / confirmed hit / hurt 等语义 | 不能从音频播放反推命中；UI 音效不应重复触发战斗音效 |
| UI 与设备输入 | 键鼠/触控绑定调用同一个攻击请求；V21 当前触控 attack button 从 `pointerdown` 进入 | 输入不得出现 PC/mobile 两套战斗判定或一次按压双结算 |

## 3. 当前已验证的实现快照（不是验收结论）

当前 V21 启动列表加载 `player-combat.js`、`mob-combat.js`，随后加载 `hit-feedback.js`、`weapon-presentation-v1.js`、`playable-feel-v1.js` 和 audio 模块。静态源码可见：

- SafeCamp 攻击会被阻止并显示提示。
- 徒手：伤害 11、距离 62、冷却 0.48 秒；Bone Knife：伤害 22、距离 80、冷却 0.32 秒；基础攻击表现计时 0.15 秒。
- 攻击信息通过既有 Relay zone `attack` 广播；区域 leader 路径负责 mob HP 结算，mob 对玩家伤害也走既有 `mob_hit` 路径。
- 玩家移动/世界坐标、mob/碰撞和存档并非 Combat 模块独立拥有。workbench 的 field ward 与 expedition 状态有各自合同。
- 当前客户端会提交位置、方向、距离和伤害等攻击字段；当前架构不是完整服务器权威/反作弊系统。任何校验增强都要作为独立、安全与兼容任务，不可由一个手感任务顺便改协议。
- 手感/特效/音频代码与模块加载只说明运行时具备这些扩展；真实手机延迟、真实双人一致性、混音舒适度和整体手感尚需浏览器/设备/双客户端实测。

以上快照来自当日源码与文档核对。接手的 AI 必须重新读取活动 V21 启动顺序和工作区，不能只凭本卡断言当前实现。

## 4. 模块接口草图（规划，不是当前新增 API）

```text
UI / Keyboard / Touch
        │ attack intent
        ▼
Combat & Weapons ── existing Relay attack event ── zone combat owner
        │                                      │
        │ confirmed swing / hit / hurt / death  └─ confirmed gameplay result
        ▼                                                  │
Animation / VFX / Audio                         Inventory / Loot adapter
```

将来若把接口从全局函数拆成明确事件，可采用这类语义，但必须先查现有全局包装器及顺序，不能重命名既有 Relay event：

- `attackRequested(actorId, weaponId, aim)`：玩家输入意图，不是命中证明。
- `attackStarted(actorId, weaponId)`：合法攻击开始，供武器动画/挥空声音读取。
- `hitConfirmed(attackerId, targetId, damageKind)`：权威 combat 路径已确认命中后发出。
- `actorHurt(actorId, cause)` / `actorDefeated(actorId)`：状态已变更后发出。
- Loot 通过已确认击杀结果请求奖励；UI/音频/特效消费只读事件。

这些名称只用于设计沟通，**尚未作为代码接口批准**。V1 继续尊重当前 `attack`、`mob_hit`、`loot` 载荷和 `abyssal-relay-v1` 协议合同。

## 5. 明确不属于这张卡

- 新敌人、Boss 阶段、怪物收集/驯服：归 Creatures & AI / Pets 模块。
- 新物品类型、背包格子、装备栏、掉落经济：归 Items & Inventory / Loot 模块。
- 新地点/发现归 POI & Exploration；坐标/碰撞归 World & Terrain；projection/视角归 Rendering & Camera；source-art intake 归 Asset Pipeline。
- 动画、相机震动、hit-stop、特效制作和整体混音大改：归 Animation & Presentation / Audio & Feel。
- NPC 对话和任务：归 NPC & Social / Quest & Narrative。
- 改存档结构、Relay 包、leader/authority 体系、安全模型：分别作为专门迁移/协议/权威设计任务。
- 将另一个 AI 的美术接入到游戏：本模块只读取被批准的资产语义，不编辑同一美术文件。

## 6. 未来实现任务的建议切片

每次只选一项，不把下列项合成“大改 Combat”：

1. **Combat audit / bug fix：**一个能稳定复现的战斗问题，加一条实际回归；只改相关 combat 文件。
2. **敌人意图可读性：**先为一种现有怪物定义攻击准备、危险窗口、取消/中断条件与视觉语义；presenter 只读 mob state。
3. **一种武器扩展：**先定义它如何改变打法和出门准备，再定 combat 数值、输入、库存物品和动画/音效接口；跨模块拆卡分别交付。
4. **Boss / 状态异常：**待首条 POI 路线、伤害反馈、联机结算和测试稳定后再立合同。

每次 AI 派工必须写：一个主责模块、允许改动文件、依赖接口、明确排除项、基线 commit、回归命令、真实设备/多人测试责任和未知风险。若共享工作区正在变化，先停在只读审查并请求稳定基线，不覆盖别人文件。

## 7. 验收清单

### 自动与隔离测试

- `tests/core-smoke.test.mjs`：SafeCamp 攻击保护和既有基础 combat 行为。
- `tests/awakening-world-logic-hardening-v1.test.mjs`：碰撞、LOS、combat 与世界空间边界。
- `tests/weapon-presentation-v1.test.mjs`：表现读既有 attack state，不创造攻击 timer，PC/mobile 输入只绑定一次。
- `tests/playable-slice-combat-presentation-v1.test.mjs`：命中/挥空/击杀表现语义和限制。
- `tests/awakening-expedition-loop-v1.test.mjs`：远征变化不得改战斗数值/协议。
- 改 loader 时另跑 `tests/module-sort.test.mjs`；改 Relay 输入或多人结算时按对应合同增加协议和重复包回归。

测试通过只证明各自覆盖的代码路径；不能代替浏览器或真实设备验证。

### 运行时体验

- SafeCamp：攻击确实不触发，角色和提示不误导玩家。
- PC：键盘/鼠标输入响应及时，挥空与命中容易分辨。
- 手机：触控攻击可持续单指操作，不与摇杆/交互面板抢触点；portrait/landscape 都检查。
- 敌人：telegraph 能提前看清；遮挡墙后不能误命中/穿墙受伤；死亡和掉落只结算一次。
- 双客户端：攻击者/旁观者看到同一次命中、受伤、死亡和奖励结果；断线重连不重复奖励或永久卡住状态。
- 表现：测试 reduce-motion 设置、不同帧率和长时间战斗；没有逐帧累积特效或重复音效。
- 画质：武器/角色在游戏原生 backing size 和实际屏幕缩放下边缘清楚，不把高清源图降成难读的大方块。

### Combat 高细节像素美术门槛

- 每个战斗内容切片都要附一份视觉 brief：列明复用的角色/武器/怪物语义、像素密度来源、帧尺寸/锚点合同出处，以及需要玩家一眼读出的攻击或危险信号。没有经核对的尺寸合同就写 `UNKNOWN`，不得猜尺寸或先重采样。
- 画风必须是 **Modern High-Detail Pixel Art**：硬边、可辨认且有意设计的像素簇；高细节来自形状、材质和明暗组织，不来自照片纹理、柔焦、绘画笔触或强行缩小的高清概念图。不要把粗大方块、噪点或拉伸失真误当像素风。
- 观感验收要在真实 Combat 场景、真实投影和最近邻显示合同中检查：桌面 `1280×720` 与手机 `390×844`。攻击准备、打击范围和玩家退避路线不能被地表细节、特效或 HUD 淹没；不同设备尺寸下都要能区分挥空、确认命中、受伤与击杀。
- 攻击预警以方向/轮廓/时序共同表达，可使用颜色辅助但不可只靠颜色。表现只能显示已确认事件；图片、预警形状、闪光或声音不得决定攻击是否命中。
- 概念图只用于确定设计方向。任何生成图或源图只要仍显 painterly、游戏尺寸下发糊、粗马赛克化、像素密度与现有角色不协调，或遮挡了战况，就标 **REVISE / NOT PRODUCTION**；由 Asset Pipeline 与 Rendering & Camera 分别验收后才进入提案阶段。

本轮展示并检查的两版战斗场景概念都表现为笔触化半写实画面；像素风修订仍未形成足够明确的像素簇，故标记 **REVISE / NOT A PROJECT ASSET**；没有接入或复制至素材目录。专门的视觉输入与验收项见 [Combat 视觉可读性 brief](2026-10-05-combat-high-detail-pixel-art-brief-v1.md)。

未执行的设备、浏览器、音频和双客户端项目必须写 **UNKNOWN / 未验证**，不要由 Node 测试推断通过。

## 8. 推荐分派给未来 AI 的目标文本

```text
你本次只负责《深渊苏醒》的 Combat & Weapons 模块。开始前读取本卡、PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md、MIRE_MART_EXPEDITION_LOOP_V1.md 和当前相关源码；重新核对 V21 加载顺序、分支/HEAD/脏工作区。

本次唯一目标：【由用户填写一个 bug 或一个很小的玩法切片】。主责文件：【填写】。配合接口：【填写】。不得修改：美术资产、存档格式、Relay 协议、POI/碰撞、NPC、背包架构、无关系统。不要覆盖/清理未知来源的未提交工作。

保持 SafeCamp attack guard、当前 combat 数值和命中权威边界，除非目标明确批准某一项变化。先提供复现与失败回归，再做一处最小实现，串行跑相关测试、检查最终 diff。动画/音效只表现已确认结果。真实运行未完成的 PC/mobile/双客户端项目标 UNKNOWN。不提交、不合并、不部署。

最终用简单中文报告基线、改动文件、预期/实际、测试结果、运行证据、未验证项和接口风险；不要说“全游戏 QA 通过”。
```

## 9. 关联资料

- [总模块化玩法开发蓝图](2026-10-04-modular-gameplay-development-blueprint-v1.md)
- [MIRE MART Expedition Loop V1](../contracts/MIRE_MART_EXPEDITION_LOOP_V1.md)
- [HOME Workbench Upgrade V1](../contracts/HOME_WORKBENCH_UPGRADE_V1.md)
- `modules/combat/player-combat.js`、`mob-combat.js`、`hit-feedback.js`、`weapon-presentation-v1.js`、`playable-feel-v1.js`
- `modules/network/inbound-events.js`、`modules/network/network-relay-v16.js`、`modules/audio/playable-feel-audio-v1.js`

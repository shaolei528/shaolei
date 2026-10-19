# Creatures & AI 模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED（系统与内容工作边界）**  
**主责模块：**Creatures & AI  
**协作模块：**Combat & Weapons、World & Terrain、POI & Exploration、Animation & Presentation、Audio & Feel、Items & Inventory、Loot & Rewards、Network & Co-op、Rendering & Camera、Asset Pipeline  
**目的：**让怪物有可读的行为和原创个性，同时不把 AI、战斗判定、视觉资源、掉落和网络放进同一个不可维护的模块。

> **Canonical routing:** use [`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md). Older collaborator labels in this card are navigation hints only: split “World & POI” into **World & Terrain** / **POI & Exploration**, “Items & Loot” into **Items & Inventory** / **Loot & Rewards**, and “Rendering & Art” into **Rendering & Camera** / **Asset Pipeline**. This card's sole lead remains Creatures & AI.

## 玩家价值与五款参考经验

怪物应让玩家观察、判断、选择准备和应对；危险来自可以读懂的意图和地区关系，不靠突然出现或不透明伤害。

- **Crashlands：**不同生物有容易辨认的行为和回应方法，击败它们的资源有实际用途。
- **Terraria：**生物和挑战随地点/成长逐步变化；Boss 是阶段性门槛，不是开局堆叠。
- **Minecraft：**生物行为和环境位置彼此配合，玩家能利用空间做选择。
- **Don't Starve Together：**夜间、区域与资源压力清晰；玩家能提前决定装备和路线。
- **Stardew Valley：**世界不只有敌人；温和动物、伙伴和居民周边生物应和社区/家园生活相连。

仅借鉴体验，不复制参考游戏中的怪物造型、名字、动画、攻击模式、掉落、数值或设定。深渊生物应从现代城市语境自然异变，恐怖逐步升级。

## 当前 V21 源码快照

以下为静态源码核对，不代表实机战斗或画质验收：

- 活动 V21 loader 会载入 modules/combat/mob-combat.js；静态怪物/世界初始化在 modules/world/world-state.js，MIRE MART 额外怪物来自 modules/world/awakening-world-v1.js。
- 当前基础种类有 crawler、cultist、watcher。源码字段包括稳定 mob id、kind、世界坐标、hp、phase、hitCd 和 respawnAt。
- 当前移动更新选择附近玩家，基于距离向玩家移动，超出追击范围后漂移；所有当前种类共享近似接触攻击节奏。Crawler 速度较快，Cultist/Watcher 较慢。
- 当前攻击造成的生命值/理智值伤害按种类分配；Watcher 造成较高理智影响。安全营地半径和离开营地短暂保护会影响怪物交战。
- 当前图片文件 assets/monster_sheet.png 为 128x96；renderer 按每格 32x32、4 列动画和 3 行种类选择绘制。若替换素材，必须重新核对实际像素密度、帧合同、加载/fallback 及运行尺寸；本卡没有做图像观感验收。
- 世界快照只传 mob 的 id/kind/x/y/hp/phase/respawnAt 一部分字段。Relay 传输不等于服务端 AI 或权威；客户端 Zone leader 当前执行一部分 AI 和世界模拟。
- 当前源码和 atlas 存在，不等于复杂状态机、远程公平性、所有意图提示和高品质动画已经实现；Boss、驯化、生态链均不是当前能力的证明。

接手 AI 必须重新检查 active boot path、字段载荷、存档/网络合同和实际 renderer，不可把本卡当成最新实现事实。

## Owner 与接口边界

| 子职责 | 唯一 owner | 输入/输出 | 不得越界 |
|---|---|---|---|
| Creature Catalog / Runtime Mob | Creatures & AI | 稳定 kind/id、mob HP/life/respawn 与行为配置 | 不拥有奖励表或渲染路径 |
| AI / 行为状态 | Creatures & AI | 玩家/POI/环境只读信息 → 移动/意图/攻击请求 | 不直接扣玩家 HP、不自己裁定 Combat 命中、不操作背包/存档/socket |
| 生命与受击状态 | Creatures & AI 拥有 mob HP/life；Combat & Weapons 发布已接受伤害结果 | Creature owner 应用伤害 delta，HP 到零只发出一次 defeated 事件 | AI/presenter 不可伪造已接受伤害或击杀 |
| Combat / Damage | Combat & Weapons | 验证距离、视线、安全区、冷却和命中；发布已确认的 mob damage 事件，由 Creatures & AI 将接受的伤害应用到 mob HP | AI/动画不能自行确认命中或改 mob HP；不更改网络协议作为顺手优化 |
| 生成资格与种群规则 | Creatures & AI | 选择何时、生成多少、何种生物以及 respawn policy | 不直接选择无效空间或覆盖地点玩法 |
| 生成位置与区域上下文 | World & Terrain / POI & Exploration | 返回合法坐标/空间查询和地点语义 | 不决定怪物种类、生成数量、掉落或 AI 状态 |
| Loot & Rewards | 独立 Loot & Rewards owner | 只接收 Creatures 已确认 defeated 或 Quest 已确认完成的请求 | 怪物静态配置、客户端图像和 AI 状态不能直接增加物品 |
| 意图表现 | Animation & Presentation / Audio & Feel | 读取 telegraph、attack-started、hit-confirmed、defeated 等确认事件 | 不参与命中检测、玩家伤害或死亡决定 |
| Multiplayer | Network & Co-op | 按现有接口同步受支持快照 | 不把玩家自报或 Relay 在线当成服务端权威 |

接口名称如 creatureIntentChanged、attackWindowOpened、creatureDefeated 只是未来语义草图，不是已经批准的公共 API。先沿用当前模块合同；接口修改需独立回归和兼容审查。

## AI 行为合同

为每种 creature 写短状态图，至少列出状态、进入条件、退出条件、计时器 owner、可取消条件及失败情况。小型第一版可包括：

- **IDLE / ROAM：**局部活动，不跨越世界边界或安全区合同。
- **SENSE：**发现玩家或环境信号；给出可读的转向、声响或动画准备。
- **TELEGRAPH：**攻击即将发生的窗口，清楚说明威胁方向/范围；必须允许打断或失败回到安全状态。
- **ATTACK REQUEST：**提交 Combat 请求；没有 Combat 确认时，视觉挥击不得造成玩家伤害。
- **RECOVER / REPOSITION：**攻击后有可理解的空档或重新定位。
- **HURT / DEFEATED：**读取确认的 gameplay 结果，停止或切换 AI；掉落交由 loot owner。
- **DESPAWN / RESPAWN：**由明确 world/session owner 管理；别让渲染隐藏和持久世界状态混为一谈。

必须定义：感知半径、目标选取并列规则、玩家离线/死亡时行为、安全区/障碍/POI边缘、多个目标时的选择、同一攻击是否只能命中一次、leader 换手/快照恢复和重复命令处理。数值都是游戏规则；不能藏在动画/美术资源里。

## 高品质怪物美术合同

全新美术由用户指定的 art contributor（非 canonical module owner）按统一视觉 brief 制作隔离候选；本模块给出物种/行为需求并校验行为语义，Asset Pipeline 负责 intake/metadata，Rendering & Camera 负责游戏内比例与显示验收。本模块不另起美术管线、不覆盖候选素材。

每个 creature 设计 brief 至少包含：

1. 玩家首次看见它时能否在真实游戏尺寸识别轮廓、体型和危险级别。
2. 朝向/动作帧是否明确表达巡游、警觉、蓄势、攻击、受伤、退却和死亡。
3. 威胁提示在白天、夜间、复杂地形、色觉差异和手机屏幕上仍可辨认；不可只靠颜色。
4. 动画 sheet 的原生单帧尺寸、像素簇尺度、锚点、帧序、循环速度和 fallback，遵守 Asset Pipeline intake 与 Rendering & Camera 显示合同。
5. 素材进入 active renderer 后分别检查原始像素、原生尺寸、桌面实际显示和手机视口；细节模糊、变粗马赛克、动作难读、角色遮挡错乱则为 REVISE / BLOCKED。
6. 通用血条/伤害数值 UI 属 UI 模块；怪物自身轮廓和动作语义属美术/动画，不能将 UI 视觉当作怪物画质通过。

概念图、生成图、精灵表和独立 asset preview 都不是实际游戏接入验收。

## 新怪物的分阶段工作卡

任何新怪物先提交一页 DRAFT 设计，再由用户决定是否保留、修改或删除；不得声称已经进入游戏。

- **CREATURE-0 行为与用途：**所属 POI/恐怖阶段、玩家为何遇见、玩家可以观察到什么、可选择的对策、与 HOME 准备和资源循环的关系。
- **CREATURE-1 意图原型：**使用现有敌人资产或灰盒表达状态，只验证 telegraph/距离/取消/安全区；不制造正式美术、不引入多段伤害。
- **CREATURE-2 战斗接口：**与 Combat owner 定义攻击请求、已确认伤害、冷却和失败/中断；写一条重复命中和一条遮挡回归。
- **CREATURE-3 世界放置：**由 World/POI 确认位置、数量上限、重生、跨区与玩家离开行为；按真实空间/碰撞合同验证。
- **CREATURE-4 美术协作：**给 Art 负责人 brief 和尺寸/帧/锚点需求；评审高质量接入画面，避免同时编辑同一候选目录。
- **CREATURE-5 合作验证：**单客户端、双客户端、断线/Zone leader 变更的行为边界逐项验证；超出当前协议能力的项目标 UNKNOWN，并独立设计后续方案。

Boss 多阶段、驯化/收集、生态链、繁殖和大群体模拟都要在基础 HOME→POI→返回闭环稳定之后另立目标；不要塞进首次怪物切片。

## 回归与验收

- **行为：**至少覆盖未发现/发现、预警、打断、命中、玩家死亡/离开、怪物死亡/重生；挥空不能造成伤害，单次攻击不能重复结算。
- **空间：**碰撞、墙体视线、安全营地保护、区域边界和生成位置满足现有 world contracts。
- **生命周期：**反复载入/切区不复制实体、监听器、掉落或奖励；重生和死亡不会从快照造成重复击杀。
- **网络：**验证快照字段、id 去重、sender 对齐、Zone leader 变化；没有双客户端实证写 UNKNOWN。
- **表现：**关键意图在时间窗口里能读清，动画/音频不先于玩法结果谎报命中；关闭 reduce-motion 时不隐藏玩法信息。
- **画质：**检查原图合同及 active renderer 的 1280x720 / 手机视口；不以生成图原分辨率或单元测试推断高清通过。
- **测试：**先跑本模块的 focused regression，再跑 tests/core-smoke.test.mjs、tests/awakening-world-v1.test.mjs 和受影响的 loader/world/combat 相关测试。若改加载顺序，另跑 tests/module-sort.test.mjs。
- **报告：**分列代码测试、浏览器运行、真实触屏、真实联机和图像验收，不把一类证据扩写成全部通过。

## 交给未来 Creatures AI 的目标

你本次只负责《深渊苏醒》的 Creatures & AI 模块。先读 AGENTS.md、continuity Skill、PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md、本模块卡及相邻 Combat/World/art contracts；核对当前分支、HEAD、工作区和实际 V21 loader。保留未提交和来源不明的文件。

唯一交付：【一个已有 creature 的可复现行为 Bug，或一个用户选定的小型行为切片】。先区分 CONFIRMED / SUSPECTED / UNKNOWN；指定唯一状态 owner、对外接口和允许改动文件。动画/声音只能表现已确认状态；战斗命中、玩家 HP、掉落、存档、Relay 协议不属于 AI 可私自改变的范围。新增 creature 先交 DRAFT brief，未经选择不得加入运行时代码或正式美术。改动后运行命中/挥空、遮挡、安全区、切区/重生和相邻模块回归；没有实际桌面/手机/双客户端与美术证据的部分标 UNKNOWN。不得覆盖另一位美术 AI 文件，不删除未知文件，不合并、不部署。

---
这是怪物系统的设计与任务边界草案；不代表新敌人、Boss、动画或正式美术已经进入游戏。


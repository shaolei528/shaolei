# World, POI & Exploration — 独立模块任务卡 V1

**状态：DRAFT / NOT IMPLEMENTED / 供用户审阅和后续任务分派**  
**目的：**把世界区域/场景摆放、POI 身份与玩家发现、空间碰撞、交互搜刮、任务路线、视觉表现和多人状态分开，方便未来 AI 独立接手一个区块，也为原创城市地点留下可扩充的接口。  
**基线：**2026-10-04，分支 `fix/awakening-production-gate-qa-findings-v1`，HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。工作区脏且另有来源未知的代码/terrain/美术改动；本卡没有修改它们。未来接手者必须重新核对当前状态。

> **归属说明：**这是体验概览，不是一个可整体派工的 owner。唯一归属以 [`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md) 为准：**World & Terrain** 管坐标/地形/碰撞，**POI & Exploration** 管地点发现/远征状态，**Interaction & Gathering** 管目标范围与采集请求，**Loot & Rewards** 管奖励资格与发放请求，**Quest & Narrative** 管任务目标。实施前按一个 owner 拆成小任务。

> **旧表格约束：**下文子系统/组件表用于定位历史实现，里面的组合标签如“World & POI”“Progression/Narrative”“Rendering & Art”不是 owner 名称；不得直接照表作为跨模块派工。按 canonical index 的单模块卡和 source crosswalk 重写任务边界。

## 1. 玩家体验目标

玩家从温暖、有居民的 HOME 出发，沿能理解的现代城市路线探索一个 POI；在现场看见可读的环境细节、明确的通行路线与一个值得调查的线索；选择战斗、绕行或搜刮；把有用途的物资/发现带回 HOME，改变下一次准备或故事选择。

五款参考游戏只提供设计经验：

- **Crashlands：**新地点的威胁、怪物和资源能一眼看懂且各有用途。
- **Terraria：**地图逐步打开；地点发现与成长门槛带来探索回报。
- **Minecraft：**地形/建筑组合给玩家留下辨认与返回的空间。
- **Don't Starve Together：**外出路线、距离和危险等级让准备成为玩家选择。
- **Stardew Valley：**地点属于有生活痕迹的社区/城市，而非只有敌人和箱子。

学习探索节奏，不复制原作地图、地点、美术、NPC、任务、机制或具体内容。恐怖应从现代城市生活中的小异常逐步升级；初期 POI 仍可看出原来的公交、商店、码头或维修用途。

## 2. 当前 V21 实现证据

**VERIFIED（当前仓库源码）：**V21 loader 在 `survival-v21.html` 中按顺序载入 `modules/world/world-spatial-v1.js`、地形与美术适配、`modules/world/awakening-world-v1.js`、`modules/world/awakening-expedition-loop-v1.js`、HOME 升级服务和移动表现模块。未来变更需保持依赖次序或同步更新 loader/test。

当前能力可以分成几块：

- `runtime-state.js` 持有基础世界尺寸、zone 坐标和运行期 `resources`、`mobs`、`harvested` 容器；`world-state.js` 有程序化 zone 资源/mob 初始化与 leader 发送的短期 `world` 快照。这不是可持久化共享世界。
- `terrain-v21.js` 与基础 renderer 提供现有底层地形；`world-spatial-v1.js` 是独立的矩形几何注册/查询服务，提供点/圆阻挡、移动解析和近战 LOS 查询。它不是地图探索/POI 发现系统。
- `awakening-world-v1.js` 定义当前一个北路/废弃便利店切片及七类静态层：terrain、decals、props、collision、interactions、entities、FX；定义店内六个搜刮节点，并把它们注入既有全局 `resources`。
- 同文件绘制钩子扩展现有地形、营地/props、lighting/FX；该场景目前仍有 placeholder art/fallback，逻辑矩形和视觉素材分开，图片不能决定碰撞。
- `interaction-v12.js` 负责附近 Guide、工作台、篝火、营地共享箱与资源的交互选择/距离验证；采集直接增加本地库存并同步临时资源冷却。素材/POI 定义不拥有玩家背包。
- `awakening-expedition-loop-v1.js` 拥有 MIRE MART 的 session-local 目标阶段 `PREPARE → LEAVE_HOME → REACH_MIRE_MART → SEARCH_FIGHT → SECURE_REQUIRED_SALVAGE → RETURN_HOME → COMPLETE`。它读 POI 几何、库存和玩家状态，不是通用地图解锁/发现或持久任务服务。
- Combat owner 裁定怪物攻击/击杀并请求掉落；Inventory/Save owner 应用玩家物品与本地保存；HOME 服务记录符合合同的返家升级。上述状态不得复制到 POI 数据中。

**VERIFIED（合同）：**`docs/contracts/MIRE_MART_EXPEDITION_LOOP_V1.md` 明确远征状态不持久；Relay 只传输已有世界/mob/harvest/loot 消息，不自动带来可信服务器权限或世界存档。营地箱子的共享冷却/客户端奖励行为不应被当成以后安全、公平的权限模板。

**PLANNED / 当前未确认：**通用 POI registry、玩家发现日志/地图迷雾、跨重进地点解锁、可编辑地图系统、持久世界资源耗尽、服务器验证的共享搜刮权威，当前都不能声称已实现。

**UNKNOWN：**浏览器/桌面/真实手机显示、实际多人客户端在换区/断线/leader 更换下的 POI、碰撞和资源体验；本卡没有运行测试或启动游戏。

## 3. 目标模块职责与不可混淆的 owner

| Canonical owner | 负责的唯一事实 | 配合接口 | 不得接管 |
|---|---|---|---|
| World & Terrain | Zone/region 网格、统一世界坐标、静态地形、合法空间/碰撞/LOS 查询 | POI 与 Movement 查询世界事实；Rendering 读取快照 | 屏幕投影、素材 alpha 碰撞、奖励、任务进度 |
| Movement & Locomotion | 玩家意图后的移动响应/速度状态（与独立 movement card 对齐） | World & Terrain 结算合法位置；Input 提供方向 intent；Combat 查询位置 | 自己重做碰撞或斜俯相机逆映射 |
| POI & Exploration | 稳定 POI ID/入口语义、地点发现和远征/调查阶段 | World 提供 region/坐标/碰撞；Interaction 查询目标；Quest 订阅已确认事件 | 区域网格、碰撞、背包、任务阶段、奖励结算 |
| Interaction & Gathering | 目标选择、距离/条件检查、采集与调查请求、节点可用状态 | Input 发 intent；World/POI 验证目标；领域 owner 结算结果 | 自行发 POI 发现、无校验给物品、决定 Relay 权威 |
| Loot & Rewards | 合法奖励条目、一次性 claim 和奖励请求 | Combat/Creatures、Quest、Interaction 提供已确认来源；Items & Inventory 应用结果 | 不拥有击杀/defeat、POI 完成、背包或存档状态 |
| Quest & Narrative | 任务状态、章节/阶段、条件和奖励 ID 请求 | 订阅 domain owners 已确认事件；UI 读目标 | 重复保存 POI/库存/战斗状态或直接发奖励 |
| Core State & Save | 玩家/世界持久化格式和迁移 | 领域模块提供其状态序列化片段 | 不重新定义 POI/世界/战斗语义 |
| Network & Co-op | 现有 Relay 消息传输和批准的共享状态同步 | World/POI/Combat 提供兼容数据 | 不把 Relay broadcast 误当服务端验证或持久化 |
| Rendering & Camera | 依据只读 world/POI snapshot 投影场景与深度 | Asset Pipeline 提供有效素材；UI & Map 绘制地图/标记 | 任何权威世界状态、碰撞几何或发现奖励 |
| UI & Map | POI 名称/标记/探索提示等信息展示 | 消费稳定 ID 与已确认状态；Input 发统一 intent | 输入设备路由或任何 domain state |
| Asset Pipeline | POI/terrain 美术文件、source rect、anchor 与校验合同 | Rendering & Camera 读取已校验资源 | 碰撞、POI 解锁、探索或奖励状态 |

接口方向：

```text
World / POI 静态定义 ──注册──▶ World Spatial
          │                         │
          ├──只读地点定义──▶ Exploration / Discovery ──只读快照──▶ UI / Map
          │                         └──已确认发现事件────────────▶ Progression
          └──静态交互 ID──▶ Interaction ──请求──▶ Resource / Loot / NPC / Combat owner
                                                           │ 已确认奖励请求
                                                           ▼
                                                      Inventory owner

Renderer / Art 只读场景和状态；Network / Save 只按单独批准合同同步/保存，不反向拥有玩法状态。
```

这些是**规划边界**，不是已经存在的 API。以后可考虑 `getPoiDefinition(poiId)`、`queryPoisInZone(zoneId)`、`recordPoiDiscovery(poiId, clueId)` 等命名；先检查 V21 loader/全局 API、实际多人权威、坐标转换与已有地图文件，再定真实接口。

## 4. 一条未来原创探索切片建议

当用户批准新地点内容后，可在已有 HOME → 北路 → MIRE MART 主循环稳定之后，再设计一个小型临海公交终点站 POI（暂名 **Floodline Transfer / 潮线换乘站**）：

- 白天可读出原本的城市公交/轮渡换乘用途；破损时刻牌出现短暂不一致的“下一班潮汐”提示，但初期异常只作为小线索，不铺满紫色腐化。
- 玩家能从外围道路安全观察入口、挡路物和一条可选择的进退路线；进入后查到一份维护便笺或无线电记录，为 HOME 的居民对话/下次准备提供问题，而不是直接给完整剧情答案。
- 第一版最多一个短区域、一个主要调查点和少量可读道具/声音提示；是否有战斗、实际掉落和能否重复访问需另开对应模块决策。
- 设计受 Terraria 探索发现、Don't Starve 出行取舍、Minecraft 地点空间辨识、Stardew 城市生活痕迹及 Crashlands 清晰遭遇反馈共同启发；内容、名字和美术均原创。
- 该场景只是**内容候选**。不自动加入 roadmap、production world 或素材 manifest，也不声称当前 V21 有“洪水潮位”系统。

首个实施原型更适合只验证 World/POI 的静态布局、入口/碰撞与高品质视觉可读性；发现状态、剧情、搜刮、多人与持久世界按独立切片批准，避免把所有系统绑进一张地图。

## 5. 分阶段 AI 任务卡

1. **WORLD-0 只读地图与权限合同：**复核 world/terrain/spatial/POI/loot/progression owners、V21 loader、现有 tests 和共享工作区；输出逐文件职责图与事实状态，不改运行代码。
2. **WORLD-1 POI 静态数据原型：**仅为一个获批小 POI 定 immutable IDs、zone/world coords、entrance、layer definitions 和 collision registration；用隔离预览确认布局，保持生产 world、save、Relay 与当前 MIRE 数据不变。
3. **WORLD-2 近距调查：**定义 Interaction 提交“调查”请求、World/POI 提供可选对象、Exploration/Progression owner 记录结果的接口；先单人 session-local，不添加伪共享状态。
4. **WORLD-3 发现与地图反馈：**只有定义 discovery 的本地/玩家持久/多人共享范围后才做 UI map；Save/Network 各写合同与迁移/去重测试。
5. **WORLD-4 搜刮与地点恢复：**独立解决资源 claim、刷新、奖励去重及断线/换区/leader 变更，再扩 POI 消耗状态；Relay 不是授权验证方。
6. **WORLD-5 第二地点内容：**前置区域可读、素材通过实际尺寸和碰撞门槛、HOME 返回闭环有验证后，再给 Floodline Transfer 或用户指定地点编写场景卡。

## 6. 防回归验收

任何获批实现必须先写可复现条件，再一次做一个根因的最小改动；保留用户数据/未提交文件，不删除、不重置、不覆盖。至少明确覆盖：

- MIRE MART 与 SafeCamp 仍是不同 zone/region；现有北路、店铺入口、停车 footprint、碰撞边界、交互距离保持合同。
- zone seed / POI 注册反复调用不重复资源、mob、geometry、监听器或奖励；切区不把 POI nodes 泄漏到 HOME。
- 玩家和 mob 都不能穿墙/柜台；门洞持续可达；碰撞仍由几何合同决定，不被素材 alpha 或图片尺寸取代。
- 资源 ID 稳定、超距/冷却/重复请求按指定 owner 拒绝；不因为打开地图或看到物品图就发奖励。
- Expedition 的安全离营、确实到达 POI、领取所需 shard、死亡/提前返家规则不被地图进入事件偷换；路线完成不由库存变化单独伪造。
- Relay broadcast/late join/leader 变更/掉线失败时标清当前客户端权限与 UNKNOWN；本轮不擅改任何事件名、载荷、刷新权限或持久化语义。
- V21 loader 依赖顺序、资源/mob world snapshot、HOME Field Rig 的返回合同、键鼠/触控共用交互入口均保持。
- 运行相关 Node 测试时串行执行并核对基线；再按切片要求做浏览器预览、桌面/手机和真实双客户端检查。只读预览或绿色单测不能替代运行验收。

**建议相关回归：**`awakening-world-v1.test.mjs`、`awakening-world-logic-hardening-v1.test.mjs`、`awakening-expedition-loop-v1.test.mjs`、`awakening-home-workbench-upgrade-v1.test.mjs`、`awakening-scene-placement-preview-v1.test.mjs`、`awakening-production-manifest-gate-hardening-v1.test.mjs`、`terrain-v21.test.mjs`、`interaction-v12.test.mjs`、`module-sort.test.mjs`。按实际变更范围选择；浏览器/手机/双客户端证据当前均未由本卡实测。

## 7. 高品质场景与模块美术合同

- 场景目标是 Modern High-Detail Pixel Art；环境、POI props、道路、交互点和角色保持统一的像素密度与光影逻辑。一个高分辨率参考图不是合格的 runtime 资产。
- 以 `ART_BIBLE.md`、`AWAKENING_ASSET_CONTRACT.md`、`docs/contracts/SCENE_PLACEMENT_PREVIEW_V1.md` 的当前要求为准：逐类别定义尺寸/透明度/锚点/帧布局；POI 坐标基于 World 的 world coords；显式碰撞几何独立；透明边缘无 halo；像素缩放清楚。
- 不要把地形的 64×64 tile 条件套给所有 POI 道具，也不要为了塞进 manifest 强行重采样。先核对活动 renderer、相机投影与项目已批准的 3/4 原型。
- 每个新 POI 必须同时展示“环境图”和实际游戏窗口/手机尺寸画面；确认路、入口、墙体和关键物件可读，玩家/怪物遮挡与绘制层级正确。未经实际尺寸检查的概念仍是 DRAFT / REVISE。
- 美术资产只表现世界场景，不决定入口、碰撞、物品、奖励或地点是否开放；达到素材门槛也不等于接入 V21。

## 8. 交给未来 AI 的单模块目标

```text
你本次只负责《深渊苏醒》的【World & Terrain / POI Catalog / Exploration & Discovery / WORLD-0..5 中一项】。先读本卡、PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md、docs/contracts/MIRE_MART_EXPEDITION_LOOP_V1.md、相关资产合同和测试，再核对当前分支、HEAD、脏工作区和 V21 loader。

唯一交付目标：【一个指定的 POI/世界子系统结果】。主责模块：【一个】；配合接口：【明确列出】；允许修改文件：【逐个列出】。本轮不得顺手扩地图、任务、背包奖励、动画系统、Relay 或正式素材。

World & Terrain 只拥有坐标、地形和碰撞事实；POI & Exploration 拥有地点身份、发现与远征状态；Movement & Locomotion 负责玩家移动响应并向 World 查询合法空间。Interaction & Gathering 验证玩家命令与距离；Loot & Rewards、Combat & Weapons、Character & Progression 各自批准其结果；Items & Inventory 应用物品变化；Core State & Save / Network & Co-op 保持各自现有合同。把 Relay 当传输层，不能声称它验证玩家权限或保存世界。

先写证据、复现、状态 owner、回归矩阵和实际 V21 调用路径。一次处理一个根因。不得删除、重置或覆盖用户文件/脏工作区；串行运行相关测试，审阅完整 diff；有新回归就先停止并隔离根因。真实浏览器、手机或双人证据不足处标 UNKNOWN。候选内容/概念图标 DRAFT，未通过运行中画面验收前不能说已加入游戏。

最终用简单中文说明玩家体验变化、改动文件、可复现与测试结果、未验证风险和一个建议下一步；不自动提交、合并或部署。
```

## 9. 交接链接

- [总模块化玩法开发蓝图](2026-10-04-modular-gameplay-development-blueprint-v1.md)
- [Items, Inventory & Crafting 模块卡](2026-10-04-items-inventory-crafting-module-card-v1.md)
- [潮汐谐振器 DRAFT](2026-10-04-draft-tide-resonator-module-item-v1.md)
- [Combat & Weapons 模块卡](2026-10-04-combat-weapons-module-card-v1.md)
- [NPC & Social 模块卡](2026-10-04-npc-social-module-card-v1.md)
- [Pets & Companions 模块卡](2026-10-04-pets-companions-module-card-v1.md)

**本卡是设计与任务规划，不更改游戏代码、地图数据、存档、素材、Relay 协议或现有玩法。**

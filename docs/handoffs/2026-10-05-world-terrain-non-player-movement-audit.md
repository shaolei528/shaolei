# World & Terrain 非玩家实体移动接口审查 — 2026-10-05

**状态：**接口审查完成；通用非玩家移动服务仍 **DRAFT / NOT IMPLEMENTED**。  
**唯一主责：**World & Terrain。  
**协作模块：**Movement & Locomotion、Creatures & AI、Pets & Companions、NPC & Social、Integration & QA。

## 玩家体验目标

五款参考游戏在这里各提供一种体验提醒：Terraria 的区域/路线要能读懂；Don't Starve 的安全边界和危险区域不能误导；Minecraft 的家园布局需要可信的占地/通道；Crashlands 的怪物必须在战斗空间里合理接近；Stardew Valley 的居民需要像生活在地点里。它们只作为原创玩法的体验参考，不代表这些系统已实现，也不复制原作内容。

## 当前真实调用链

| 部分 | VERIFIED 源码事实 | 尚不能据此声称 |
|---|---|---|
| 世界坐标 | `modules/core/runtime-state.js:2` 定义 4800×4800 world，zone 宽 1600；`terrain-v21.js:12` 使用 64 world-unit tile。角色位置以世界坐标保存/模拟，3/4 camera 只投影画面。 | 不能把 CSS 像素、tile 绘图比例或角色贴图尺寸当作实体碰撞尺寸。 |
| 玩家步进 | `modules/main-loop/simulation-update.js:1` 接收归一化输入并写入 `me.x/y`、将玩家限制在地图外边界内，再按位置切 zone。`terrain-v21.js:267–283` 的 resolver wrapper 仍专门读取全局玩家 `me`。 | 不能把玩家 wrapper 直接当作任意 NPC/宠物 API。 |
| 地形碰撞 | `terrain-v21.js:146–180` 从有限的 Safe Camp authored slice 查询水域；slice 外返回 `legacy`，因此不会由这个 resolver 证明其它区域的全局地形碰撞。 | 不能声称整张 4800×4800 地图都已由此地形碰撞网格约束。 |
| 静态 POI 阻挡 | `modules/world/world-spatial-v1.js:11–28` 注册按 zone 分组的轴对齐矩形，圆形用中心+8个采样点查询，沿路径每最多8 world units解析并允许轴向滑动。`modules/world/awakening-world-v1.js:6–41` 当前为 MIRE MART 在 `1:0` 注册几何。 | 不是通用导航网格、动态实体碰撞、全世界阻挡图或寻路服务。 |
| 无注册几何 | `world-spatial-v1.js:24–25` 对没有注册几何的 zone 保持自由移动和无遮挡 LOS；`tests/awakening-world-logic-hardening-v1.test.mjs:108` 将 `1:1` 此语义作为兼容行为测试。 | 不是“未知区域已确认安全”。新增实体不能偷偷把这个 fallback 当作完整世界合同。 |
| 活动玩家 wrapper | `awakening-world-v1.js:80–103` 的查询按全局 `currentZone` 解析，并在玩家更新/发移动包前修正位置。 | 不是可传入独立 zone/碰撞体的实体接口。 |
| 怪物移动 | `modules/combat/mob-combat.js:2,6+` 怪物行为由 Creatures & AI 路径推进，调用共享空间解析器，但参数是全局 `currentZone` 和固定半径10；之后怪物被限制在当前 zone 的边界内。 | 不能证明动态怪物之间互相避让，也不能推导跨区追踪或所有 zone 有静态几何。 |
| 营地向导 | `modules/safe-camp/game-v7-patch.js:2–3` 提供固定坐标快照；`interaction-v12.js:151–189` 只用于对话距离/请求。Successor renderer 读取快照用于绘制。 | 不是移动 NPC、日程系统或寻路消费者。 |
| 同步/持久化 | 玩家和怪物有各自既有的 save/network 路径；当前没有经核实的 companion roster、稳定 companion identity、移动快照或跨区迁移合同。 | 不能因为实体能在本地被画出，就默认其可多人同步或存档。 |

## 架构结论

**VERIFIED：**现在存在若干可复用的局部能力，而不是统一的非玩家合法移动服务。World Spatial 的几何 API 比玩家专用 wrapper 更通用，但它以 zone 注册几何为输入；无几何时默认自由通过。Terrain resolver 只证明受覆盖切片的地形语义。玩家移动有 World 边界 clamp，怪物有自己的 zone clamp，但两者并非同一服务。

**VERIFIED 修复：**在本轮之前，Spatial point/circle 对 `NaN` / `Infinity` 输入报告未阻挡；本轮最小修复为 fail-closed，并新增独立回归。该修复不改变无注册 zone 对有效坐标的自由移动兼容规则。相关范围和完整测试结果见 [`invalid-coordinate fix`](2026-10-05-world-spatial-invalid-coordinate-fix.md)。

**UNKNOWN：**其它 zone 的真实 terrain/collider 覆盖、跨区实体切换、动态实体之间的碰撞、实体各自的活动 zone、斜向窄道/墙角适配保证、导航路线质量，以及普通 NPC/pet 是否需要真实寻路。本次没有确认某个具体伙伴已穿墙或穿水。

## 下一阶段的接口提案（未冻结 API 名称）

World & Terrain 应拥有实体请求位置是否合法的事实，至少需要明确：

- 实体所属 zone 与可用世界范围；不要隐式读玩家的 `currentZone`。
- 起点、期望目标/步进向量、碰撞形状或明确的逻辑半径；不能从 PNG alpha 或可见体型推断碰撞。
- 对有效覆盖区域给出解析后坐标、是否完整到达、是否部分移动/被阻挡及可机器识别的原因；对无覆盖、无效输入或不支持跨区的情况给出明确结果，不伪装为安全通过。
- World 处理静态地形/建筑占用；Movement & Locomotion 形成移动步进；Creatures/Pets/NPC 负责意图和行为状态并消费结果；Rendering 只画经批准的快照；Save/Network 各自决定持久化/传输。

现有“不存在几何则自由通过”的 `resolveMovement` 是兼容行为。新接口是否沿用、改为 `unsupported`，或按 zone capability 显式配置，须由 World & Terrain 和现有消费者共同定合同后才能实现。暂不需要为宠物建 A*、导航网格或动态避障。

## 最小验证矩阵

1. 已注册区与未注册区的结果均有显式断言；未注册区结果需准确标为 compatibility/unsupported，不宣称地形安全。
2. 起点合法/非法、目标合法/非法、零步进、NaN/Infinity、地图边界，以及不同逻辑碰撞尺寸。
3. 墙、便利店门口/货架、水岸、斜向移动和窄通道；既有玩家路由、玩家网络包、怪物墙体 chase/攻击 LOS 做邻接回归。
4. 跨 zone 要么清楚拒绝/交由 zone owner，要么由一个单独合同验证；不得默默用玩家当前 zone 测 NPC/伙伴位置。
5. 明确没有寻路保证时，追随行为不得承诺绕墙、跨水或长距离到达。

这只是本地 VM/源码合同建议。可见 NPC/宠物移动、手机触控、多人权威和最终高清像素画面仍需要真实运行验收；本次不授权批量美术、runtime 导航新服务或 companion 资产接入。

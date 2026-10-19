# World & Terrain：非玩家实体合法移动合同任务

**状态：DRAFT / NOT IMPLEMENTED**

**唯一主责：World & Terrain**

**协作接口：Movement & Locomotion；后续消费者 Pets & Companions、Creatures & AI、NPC & Social；验证由 Integration & QA**

**类型：代码前的窄范围架构审查，不授权运行时代码变更**

## 为什么需要

Pets & Companions 的 PET-0 源码核对没有找到可供任意非玩家实体使用的统一合法位移合同。**限定说明：**`terrain-v21.js` 暴露可调用的 `ABYSSAL_TERRAIN_V21.resolveMovement`，但只覆盖其有限地形切片；绑定活动玩家全局 `me.x/y` 的是玩家移动 wrapper。World Spatial 查询依赖按 zone 注册的矩形几何，未注册时会直接放行目标坐标。不能把这些局部能力假定为覆盖全世界的通用实体碰撞或寻路服务。**风险推断：**没有证据表明某个具体伙伴已经穿墙/穿水；但若在缺少适用 resolver 或几何覆盖证据时实现实体追随/路径，就无法证明其不会越过阻挡或安全区域。

## 这张任务卡要求交付

1. **现状表：**定位当前活动入口和真实调用链，分别列出坐标单位、地形阻挡、zone 几何、玩家专用 wrapper、已注册碰撞形状与缺口；每项标明源码/测试位置。
2. **最小接口提案：**定义非玩家实体查询/移动需要的参数、返回值和失败语义，例如实体碰撞尺寸、zone、目标坐标、阻挡原因、部分移动/停止状态。不得直接定最终 API 名称，先以当前坐标及物理模型为依据。
3. **边界：**世界/地形负责“某实体是否能合法占据/移动到此处”的事实；Movement & Locomotion 负责移动意图/步进；Pets、Creatures、NPC 只请求并消费结果；Renderer 不修改世界坐标。先明确单区/跨区、静态阻挡/动态实体碰撞、斜向移动和水域语义是否已有证据。
4. **验证矩阵：**玩家既有路径不回归；未知 zone/无几何 fail-closed 还是显式 unsupported；墙、水、地图边界与窄通道；不同碰撞尺寸；非法输入与零步进；若无寻路则明确“不提供路线保证”。不要把未定义项伪装成通过。
5. **依赖建议：**指出最小可验证第一阶段以及哪些必须等待 Save/Network/实体身份合同；无需为宠物立即实现完整导航网格、A*、动态避障或新系统。

## PET-0 已有证据锚点（接手时需重读，不可照抄旧结论）

- `terrain-v21.js:152–180, 237–245`：有限 Safe Camp terrain slice 的碰撞查询/resolver 与导出；`terrain-v21.js:267–283`：玩家 `me.x/y` wrapper。范围及活动 boot 引用仍需本轮确认。
- `modules/world/world-spatial-v1.js:11–28`：zone 注册的矩形几何查询/resolver；要检查无注册几何时的明确返回语义。
- `modules/world/awakening-world-v1.js:41, 82, 102–103`：MIRE MART 几何注册、当前 zone resolver 和围绕玩家/既有更新链的 wrapper。不得据此推论已覆盖整个世界或任意实体。
- 相关历史测试候选：`tests/terrain-v21.test.mjs`、`tests/awakening-world-logic-hardening-v1.test.mjs`、`tests/successor-live-screen-movement-v1.test.mjs`；本卡要求重新检查实际用例，不能只凭文件名说覆盖通过。

## 限制与验收

- 只读审查与文档草案；不得改 runtime、tests、save、Relay、manifest、现有资产或 boot order。
- 不把玩家专用 collision wrapper 宣称为可复用 API；不因注册几何缺失就声称安全无碰撞。
- 用 VERIFIED / REPORTED / PLANNED / UNKNOWN 标注结论，附确切文件/行或测试证据。
- 交付后由 Integration & QA 只读核对接口边界和测试覆盖建议；用户选择实现后，再拆一项有明确文件范围的小实现任务。

## 与伙伴候选的关系

这只是 Pets & Companions 后续行为的前置合同任务，不自动批准“潮痕信使”、其图像、伙伴 AI 或运行时代码。该候选仍由用户选择、修改或丢弃。

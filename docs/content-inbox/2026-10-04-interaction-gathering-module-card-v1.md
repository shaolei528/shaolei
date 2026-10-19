# Interaction & Gathering — 独立模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED as a separated successor service**  
**唯一主责：Interaction & Gathering**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

## 玩家目标

键盘、手柄或触控发出一次明确动作后，游戏选中正确目标、检查距离/条件，只结算一次，并给出清楚反馈。采集、搜刮、休息、交谈和使用工作台有可辨认的目标与结果。

## 唯一职责与边界

拥有交互目标查询、优先级、距离/视线检查、节点可用状态的交互请求和本地 cooldown。**Input & Accessibility** 只规范化玩家意图；**World & Terrain / POI & Exploration** 提供目标和空间事实；**Loot & Rewards / HOME / NPC / Crafting** 各自结算领域结果；**Items & Inventory** 写入物品。

不得自行发物品、推进任务、改 NPC 关系、修改碰撞/坐标、改变伤害或直接写存档/Relay。一次按键不能经桌面+触控路径双触发。

## 接口草案

`InteractionIntent(targetHint, action)` → 查目标/有效距离 → 调对应 domain request → 等待确认结果 → 发布本地反馈。重复意图需幂等/节流；远程对象须由其权威 owner 确认。合同是规划，不是当前 API。

## 验收

- 有目标/无目标、刚好在范围内外、遮挡、冷却、目标消失、快速双击、键盘与触屏同时输入均有回归。
- 检查 loader 的最终 handler 覆盖顺序和 Safe Camp guard；回归采集、工作台和普通路线。
- HUD prompt 必须与最终结算对象一致，不能提示 A 却结算 B；交互图标在两个目标尺寸清楚、锐利。
- 保存格式/Relay 消息不变；新增跨客户端 claim 另行设计。

## 派工模板

写一个具体交互路径、权威结果 owner、涉及文件、一个目标测试+一个相邻系统回归、桌面/手机验收和未知项。任何范围外模块仅通过接口协作。

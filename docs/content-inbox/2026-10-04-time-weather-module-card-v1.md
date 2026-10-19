# Time & Weather — 独立模块卡 V1

**状态：DRAFT / PLANNED; weather feature NOT IMPLEMENTED unless current source proves otherwise**  
**唯一主责：Time & Weather**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

## 玩家目标

昼夜/天气让玩家有理由规划出发时间、补给和路线。早期仍从熟悉的城市生活开始，危险逐步加深；天气提示必须可理解、可应对。

## 唯一职责与边界

拥有时钟、DAY/DUSK/NIGHT/DAWN 阶段及天气状态快照。**World & Terrain** 提供区域/暴露事实；**Survival & Needs** 决定是否影响角色数值；**Farming & Food** 使用天气/时段作为生产输入；**Rendering & Camera / Audio & Feel** 表现环境；**UI & Map** 显示预报/阶段。

不拥有伤害/饥饿结算、作物产量、地形碰撞、掉落、视觉 FX 规则或存档结构。

## 当前代码提示

日夜实现曾由 V21 `modules/survival/day-night.js` 和后加载 Safe Camp patch 覆盖；活动行为需按现有 loader 和函数引用实时核验。天气是否存在不得由设计卡推断。

## 验收

- 阶段边界、暂停/断线语义、回 HOME、死亡/respawn 与持久化均有定时器边缘回归。
- 可预测的天气提示对应实际生效规则；无提示天气伤害为失败。
- 屏幕颜色/雾效仍能清楚辨路、辨怪、辨物品，保持高细节像素边缘；低端手机效果和可访问选项需测。
- 未实现天气维持 DRAFT；不增加 server/Relay 时钟或 save 字段为本卡默认行为。

## 派工模板

只选择时钟或一种天气议题；写清权威时钟、输入快照、消费者、文件/测试、玩家通知和无法验证的设备范围。

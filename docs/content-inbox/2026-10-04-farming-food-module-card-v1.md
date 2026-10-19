# Farming & Food — 独立模块卡 V1

**状态：DRAFT / PLANNED; farming/livestock features are not assumed implemented**  
**唯一主责：Farming & Food**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

## 玩家目标

种植、养护和食物准备让 HOME 更有生活感，并能为下一次探索提供明确收益；流程可见、节奏简洁，不逼玩家每天做繁琐维护。

## 唯一职责与边界

拥有作物/农场动物定义、成长周期、养护资格和生产 eligibility。**Time & Weather** 提供时间/天气快照；**World & Terrain / HOME & Building** 提供可放置地块/设施资格；**Items & Inventory** 应用产物；**Survival & Needs** 应用食物效果；**Pets & Companions** 只拥有同行伙伴，不拥有牲畜生产。

Farming 不改库存数量、昼夜时钟、营养数值、放置碰撞或宠物 roster；不暗中要求实时在线成长。

## 验收

- 单机/多人状态 owner、离线时间、重复采收、地块失效、季节/天气边界和存档恢复先写清再编码。
- 同一成熟作物不能重复产出；工具/水/时间条件清楚，UI 显示依据和下一步。
- 相关图标/作物动画符合 Modern High-Detail Pixel Art，在原生尺寸、两类目标 viewport 清晰锐利，不因缩放变糊或粗马赛克。
- 运行时、save、Relay、繁殖/动物 AI 未通过独立目标前保持 PLANNED，不伪装成已经有系统。

## 派工模板

限定一种作物/生产阶段，写清时间 authority、地块 owner、产物 Inventory 接口、允许文件、一次性产出回归、UI/画质证据和未知项。

# Crafting & Processing — 独立模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED as a separated successor service**  
**唯一主责：Crafting & Processing**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

## 玩家目标

出发前，玩家能用已收集资源制作明确有用的装备、补给或营地设施；配方逐步开放新路线，而不是堆一张难懂的大菜单。

## 唯一职责与边界

拥有配方定义、解锁条件、加工规则、站点需求检查和制作请求的可行性。**Items & Inventory** 是物品数量唯一写入者，负责原子扣料/加成；**HOME & Building** 拥有工作台的空间位置和身份；**Character & Progression / Quest & Narrative** 只能提供已确认的解锁条件。Crafting 不直接改库存、不放置建筑、不授予任务进度。

## 事务合同草案

`CraftRequest(recipeId, stationId, requestId)` → 校验配方/站点/解锁 → 请求 Inventory 原子结算 → 仅在成功时发布 `CraftCompleted`。失败必须返回可读原因且无部分扣料。此为提案，不代表已有 API。

## 验收

- 覆盖材料恰好足够、不足、站点错误/距离错误、未解锁、重复 request、回滚失败和同时制作；旧配方行为需有回归。
- 在 V21 boot order 中追踪实际制作按钮和 handler，避免改到未生效的旧实现。
- HUD/动画只消费确认结果。桌面/手机菜单文字和图标可读；更新图标时在 1280×720、390×844 检查清晰度。
- 保留 save、Relay、item ID、资源计数和既有物品图片合同，除非另外批准迁移任务。

## 派工模板

主责始终只有 Crafting & Processing；接口配合可列 Inventory、HOME、UI，但不得把它们写成共同 owner。逐次指定允许文件、一个玩家可见结果、配方/库存回归、相关相邻回归、回滚边界和 UNKNOWN。

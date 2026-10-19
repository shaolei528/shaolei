# Survival & Needs — 独立模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED as a separated successor service**  
**唯一主责：Survival & Needs**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

> **历史卡片：**本卡已由 [`Survival & Needs V2`](2026-10-05-survival-needs-module-card-v2.md) 取代，不再是 canonical 任务路由。V1 曾把死亡/复活生命周期排除在外，却未指定玩家零 HP 状态转换的归属；保留原文供历史参考，后续工作按 V2 和 Owner Map 执行。

## 玩家目标

饥饿、生命与精神压力清楚可读，给玩家可准备、可应对的风险；回 HOME 后恢复，但任何损失都来自能解释的规则。

## 唯一职责与边界

拥有玩家当前 HP、hunger、sanity、恢复和食用效果结算。**Items & Inventory** 拥有物品数量并授权消费请求；本模块返回应用效果；**Time & Weather / World** 提供环境事实；**Core State & Save** 负责持久化适配；**UI & Map / Audio** 只表现确认状态。

不拥有昼夜时钟、天气、物品数量、攻击命中、死亡/复活生命周期、网络 authority、UI 或存档版本。

## 当前代码提示

现有设计记录指出 V21 `modules/survival/status.js` 与 lifecycle、main-loop、后加载 Safe Camp patch 有调用/覆盖关系。此处仅为定位提示；实现前必须从 loader 重新追踪最终生效 handler 和当前数值，不能照抄旧快照。

## 验收

- 食物消费成功只扣一次；无效/重复使用无副作用；安全区/断线/死亡边界与旧规则一致。
- 覆盖 HP/hunger/sanity 上下限、恢复、零值、时间步长和重连；跑 Combat、Save、Safe Camp 和 UI 回归。
- 图标/状态条在 1280×720、390×844 清晰可读；音效不会遮住战斗信息。
- 不更改玩家 save schema、Relay 或战斗伤害公式，除非单独选择并覆盖迁移/多人测试。

## 派工模板

写明一个状态规则、触发事件、物品/时间输入、owner、文件范围、相邻 Combat/Save 回归、真实 UI viewport 证据及 UNKNOWN。

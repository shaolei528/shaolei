# UI & Map — 独立模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED as a separated successor UI**  
**唯一主责：UI & Map**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

## 玩家目标

玩家始终看懂 HP/生存状态、当前目标、地图位置、物品和可交互对象；HOME 操作安定，OUTSIDE 危险提示明确。桌面与手机界面都不遮住关键游戏画面。

## 唯一职责与边界

拥有 HUD、菜单、背包/制作/角色/地图等 presentation view、文本层级、可访问性显示和安全边距。消费领域快照、发出明确用户命令。**Input & Accessibility** 负责键鼠/手柄/触控映射；**domain owners** 结算命令；**Rendering & Camera** 负责世界绘图/投影；**Content & Localization** 供稳定文案 key。

UI 不拥有 HP、库存、任务阶段、交互范围、点击命中的 gameplay resolution、存档、Relay 或 renderer camera state。

## 验收

- 桌面和 390×844 两种布局检查字号/对比/安全区/触控目标/信息优先级；实机手机触控另标证据。
- 世界画面中角色、道路、攻击意图、掉落、重要 POI 不被面板遮挡；支持长文本/中文、低分辨率和系统缩放。
- 点击一次只发一个 request；延迟、拒绝和离线状态有正确反馈；不乐观篡改权威状态。
- 自定义图标遵循 native density / pixel art contract，实际运行不模糊不粗马赛克。
- 覆盖 UI state/render 回归和相邻 Input/Inventory/Interaction 路径；Node 测试不能替代截图与用户操作检查。

## 派工模板

只选择一个面板/地图信息功能。明确数据 snapshot owner、命令接口、DOM/canvas 文件、交互边界、键鼠/手机验收和视觉证据。

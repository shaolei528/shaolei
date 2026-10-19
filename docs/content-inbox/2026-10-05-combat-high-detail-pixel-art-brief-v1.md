# Combat & Weapons — 高细节像素美术与可读性 Brief V1

**状态：DRAFT / NOT IMPLEMENTED / NOT SELECTED FOR PRODUCTION**  
**主责模块：**Combat & Weapons（只定义战斗意图/结果如何被读懂）  
**配合模块：**Creatures & AI、Animation & Presentation、Audio & Feel、Rendering & Camera、Asset Pipeline、Integration & QA  
**事实边界：**下述接口是设计目标；实现前必须重新核对 V21 代码与当前 successor 入口。

## 体验目标

玩家要能在短时间内看懂：“我按下了什么、攻击是否有效、危险从哪里来、我能不能躲开”。视觉要有高细节，但构图、轮廓和事件层级仍然清楚；HOME 周边的白天战斗保持现代城市生活感，深渊异常只逐步出现。

参考经验转换为原创方向：

- **Crashlands：**每次攻击和敌人反应都给清楚、立即的反馈。
- **Terraria：**攻击模式和威胁规模为后续探索逐步升级；第一段只教会一个基础选择。
- **Minecraft：**武器与准备来自玩家熟悉的 HOME/工作台循环，Combat 不另做背包或配方。
- **Don't Starve：**危险提前可读，玩家有时间准备、观察和退开。
- **Stardew Valley：**战斗只占生活世界的一部分；不要让视觉基调掩盖安全营地与居民生活。

这些是体验参考，不复制角色、武器、敌人、攻击动作、美术、音效或掉落。

## 首个视觉切片草案

仅复用仓库当前已存在的 Bone Knife 与基础怪物做表现研究；不新增怪物种类、不改伤害数值、不创造新的玩法语义。候选画面可以选 MIRE MART 近景战斗，但地点和角色的正式美术选择权仍在整体视觉方向负责人/用户。

一帧/一组状态要清楚呈现：

1. 攻击开始前的短暂准备，以及玩家当前朝向。
2. 刀锋扫过的方向与有效危险区；挥空时不出现命中特效。
3. 只有收到已确认命中事件后才出现短促 impact/受击反馈。
4. 敌人的准备动作/预警给玩家明确退避时机；不要使用会与真实判定范围不符的危险区形状。
5. HOME 攻击保护、退避/返回路线和重要交互不会被特效遮住。

这些状态如何分帧、由何种表现呈现，属于 Animation & Presentation 与 Audio & Feel 的接口协作；Combat 只说明语义以及可接受的结果事件，不拥有动画定时器或美术权威。

## 高清像素风验收

- **风格：**Modern High-Detail Pixel Art，清晰硬边与刻意组织的像素簇。复杂度来自轮廓、材质分区和受控光影；不依靠摄影纹理、涂抹笔触、柔化放大或满屏粒子制造“高清”。
- **角色比例：**武器与角色沿用实际 atlas/source contract 中的像素密度。尺寸、帧格、anchor、alpha、稳定资产 ID 未核实时标 `UNKNOWN`；禁止为了塞进画面私自拉伸、缩小或重采样。
- **战况层级：**玩家轮廓、怪物轮廓、预警形状、当前攻击方向、确认命中特效各有层级。可以用颜色辅助，但轮廓、方向和时序也要可辨认。
- **实际屏幕：**使用真实战斗区域，在 `1280×720` 桌面与 `390×844` 手机画布里检查原生像素和项目显示缩放。检查角色是否够大、细节是否发糊/粗马赛克、预警是否被 HUD 遮挡，以及相邻地块风格是否割裂。
- **判定隔离：**素材、特效、音效只表达状态。它们不得更改攻击范围、冷却、伤害、Mob HP、掉落、碰撞、网络消息或存档。
- **未过即退回：**Painterly、模糊、粗马赛克、密度不一、命中与挥空难区分、或预警显示与规则不符时标 `REVISE / NOT PRODUCTION`。加载成功、CI 绿色或概念图漂亮都不等于画质验收通过。

## Owner / 接口合同

| 内容 | 唯一 owner | 协作方式 |
|---|---|---|
| 攻击请求、命中条件与确认伤害事件 | Combat & Weapons | Input & Accessibility 送出一次规范化意图；Combat 检查并发布确认结果。 |
| 怪物意图、Mob HP/life 与 defeated | Creatures & AI | 将 Combat 确认的 mob damage 应用到 Mob HP；HP 到零只发布一次 defeated。 |
| 玩家 HP/受伤结果 | Survival & Needs | 应用已确认的玩家伤害；表现层只读。 |
| 武器/怪物动画、VFX 与镜头反馈 | Animation & Presentation | 读取确认事件，不回调改玩法状态。 |
| 音效、混音与震动 | Audio & Feel | 消费同一确认语义；不从声音推断命中。 |
| 素材源、帧格与 manifest | Asset Pipeline | 校验用户指定美术提供的候选与元数据；没有独立的第二条 pipeline。 |
| 3/4 投影、层级、桌面/手机实际可读性 | Rendering & Camera | 从 canonical state 绘制并接受 runtime 尺寸表现。 |
| 邻接回归与证据状态 | Integration & QA | 将模拟测试、浏览器画面、设备和双客户端证据分别报告。 |

`attackRequested`、`attackStarted`、`hitConfirmed` 等名称仅为语义说明，不能直接视为已批准 API。维持现有 `attack`、`mob_hit`、`loot` 与 `abyssal-relay-v1` 合同；任何网络权威/安全调整都须另开任务。

## 给未来 Combat AI 的单模块交付模板

```text
唯一主责：Combat & Weapons
唯一玩家可见目标：【一处可复现 bug 或一个小战斗切片】
允许改动文件：【实现前根据当前真实 boot path 填写】
协作 owner：【从上表按本任务填写】
明确排除：未选择的 art 文件、全局 manifest、Mob AI/HP、Inventory/Loot、save、Relay 协议、无关 renderer/UI。
回归：复现测试 + Combat 专项 + 至少一个相邻 owner 的合同检查。
画面验收：真实 1280×720 / 390×844；报告 source density、显示缩放、清晰度和误读点。
如果同时在有其它 AI 改动的 shared worktree：先确认允许范围；冲突文件只读，不覆盖或清理未知来源内容。
报告：VERIFIED / REPORTED / PLANNED / UNKNOWN；不以单测通过宣称双客户端、真机或完整游戏循环通过。
```

## 审阅选择

用户可以：**保留**这份规范作为 Combat 美术验收方向、**修改**高亮/构图/反馈语义、或**删除**草案。选择保留只表示接受设计方向，不会自动批准某张图片、production manifest 或 runtime 接入。

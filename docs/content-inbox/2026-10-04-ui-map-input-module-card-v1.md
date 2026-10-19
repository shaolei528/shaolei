# UI, Map & Input — 单模块任务卡 V1

**状态：DRAFT / NOT IMPLEMENTED（本卡定义边界与候选，不代表新 UI 已进游戏）**  
**目标：**让玩家在桌面与触屏设备上都能看懂角色状态、当前目标和周围地点，并可靠地移动、战斗、交互；UI 显示领域模块的状态，输入只发送意图，不偷偷成为游戏规则 owner。

> **归属说明：**本卡是体验与现状的合并概览，不是一个主责模块。具体 UI/HUD/地图工作由 **UI & Map** 卡负责；键盘、手柄、触屏规范化由 **Input & Accessibility** 卡负责。不能把两边的状态或文件默认交给同一 AI；完整 owner 见 [`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)。

## 1. 五款参考如何转为本作的 UI 体验

- **Crashlands：**命中、受伤、交互可用状态一眼易辨。状态栏不能遮挡敌人与攻击提示。
- **Terraria：**探索地图、当前目标与成长线索相连，但地图只显示世界模块确实提供的信息。
- **Minecraft：**快捷栏和地图支持玩家准备与物品选择，不由 HUD 复制一份背包。
- **Don't Starve Together：**饥饿、夜间危险和出发准备要清楚；颜色以外还要有图标/文字/动画等可读区别。
- **Stardew Valley：**背包、居民互动和家园菜单易浏览，避免把全部系统塞进一张拥挤面板。

这些体验共同服务 HOME → OUTSIDE → HOME。参考游戏只作体验学习，不复制界面、图标、字体、美术或地图。

## 2. V21 已核实的当前能力

- **VERIFIED（入口与装配）：**`survival-v21.html` 用 `survival-v7.html` 的 DOM/CSS 作为 UI 模板，再依序加载 `modules/ui/base-ui.js`、`ux-cn-v11.js`、`game-shell-v1.js` 等 UI，以及 joystick、interaction、platform-inventory 等输入扩展。界面和行为因此分布在模板与多层扩展中，不能仅改一个脚本就假定所有设备路径都变了。
- **VERIFIED（桌面按键）：**`platform-inventory-v19.js` 将 WASD/方向键映射移动；Shift 冲刺、Space 攻击、E 互动、B/I 背包。输入面板打开或主菜单/输入框取得焦点时会阻断相应游戏热键。
- **VERIFIED（触控）：**`joystick.js` 用 Pointer Events 与 pointer capture 驱动共享移动向量，并在 `pointerup`/`pointercancel` 清零；`mobile-fixes.js` 在页面失焦、隐藏和关闭时取消移动。平台模块按 fine pointer / hover 选择桌面控件，避免单看视口宽度把窄窗口 Windows 键盘用户误判成手机。
- **VERIFIED（UI）：**V21 已有 HUD 状态条、任务文字、在线/连接指标、快捷栏、聊天、交互对话、地图/地图面板、背包、制作面板和入口设置/暂停菜单。活动地图路径由后加载的 `ux-cn-v11.js` 隐藏原 `mapPanel` 并创建 `mapPanelV11`；旧路径在 `game-v7-patch.js` 中也会绘制 `mapPanel`。当前 V11 地图画 3×3 全部 biome 区域及名称、HOME 安全圈、玩家/队友、向导/篝火/工作台/箱子，以及所有活跃 mob 和可用 shard 资源；没有 POI discovery 状态。敌人/资源全图显示是否符合设计尚 UNKNOWN，本卡不擅自改掉。
- 设置保存到 `abyssal_wake_settings_v1`，与 V5 玩家存档分开；当前菜单明确多人打开时 simulation 不暂停，但会停止本地移动/攻击输入。
- **VERIFIED（清晰度措施）：**模板含安全区 inset、pixelated canvas；canvas 适配会设置 `imageSmoothingEnabled=false`。这是源码措施，不证明屏幕上的艺术质量、HUD 可读性或刷新/缩放观感已通过。
- **VERIFIED（本轮回归）：**以下文件在本轮直接逐个执行并通过：`tests/game-shell-v1.test.mjs`、`tests/platform-inventory-v19.test.mjs`、`tests/platform-input-retry-idempotency-v1.test.mjs`、`tests/interaction-v12.test.mjs`、`tests/interaction-retry-idempotency-v1.test.mjs`。分别覆盖菜单/设置隔离、键鼠和触控映射、输入框隔离、主要对话/采集路径及重复初始化 listener 等。输出为当前脏工作区的本地 Node/DOM stub 证据，不是浏览器或设备体验结果。
- **UNKNOWN：**真实 390×844 触屏操作、平板/桌面缩放、刘海/安全区下 HUD 与按钮不遮挡、多人延迟时的输入感觉、地图是否帮助玩家在真实场景认路、色弱/字幕/文本放大实测。当前没从此卡的验证命令得到浏览器或真机画面。

## 3. 单一责任边界

| 模块 | 唯一职责 | 可读取/发送 | 不拥有 |
|---|---|---|---|
| UI / HUD / Panels | 以快照显示 HP、饥饿、理智、物品、任务、网络提示；管理本地面板开合与焦点 | 读取对应领域模块只读状态；发送攻击/交互/制作/地图等用户请求 | 伤害、物品数量、任务完成、连接权威或额外复制的角色状态 |
| World & Exploration | 现有 world module 提供 biome 与 MIRE MART POI 定义；未来 discovery owner/API 尚未建立 | 将来需提供带发现权限语义的地图快照；API 未有前，UI 原型只能用明确标注的假数据 | 屏幕布局、玩家按键或 UI 的临时选中状态 |
| Input Adapter | 把键盘/手柄/触控归一成移动、攻击、冲刺、互动意图；负责输入焦点、去重和取消 | 调用既有 `joystickState`/攻击/互动入口；受菜单、对话、输入框状态门控 | 决定攻击是否命中、消耗物品、完成任务、改变世界或写存档 |
| Gameplay Domain Modules | 各自校验并裁决生存、战斗、交互/制作、任务、网络状态 | 接受 UI/Input 请求并给出结果快照/事件 | 由 UI 代替自己改权威状态 |
| Renderer & Art | 清楚绘制地图符号、图标和像素界面素材 | 读取 UI model / World snapshot | 地图发现权限、POI 真相、碰撞或奖励 |
| Save / Network | 保持自己的 schema、玩家/会话边界与同步协议 | 只有另开任务并有迁移/权限合同才扩展 | 不把面板状态等同玩家进度或持久世界 |

当前 V21 的许多状态仍是 browser-global 变量与兼容包装器；上表是模块目标，不代表仓库已提供一套通用 event bus、统一状态管理库或 server-authoritative 输入。后续 AI 开工必须跟踪活动 boot order 和实际函数绑定，不应为了“模块化”一次重写全部旧控件。

## 4. 一条原创 UI 内容候选（待审）

### MAP-1：潮线导航页 — 静态 UI 原型

**DRAFT / NOT IMPLEMENTED。**当前没有可验证的 POI discovery state/API，也没有地图 view-model；World 目前只暴露 MIRE MART POI 定义，Expedition phase/目标文案不能冒充地点发现记录。因此第一张地图稿只能在隔离 DOM/canvas 原型用显式标记的 `DEMO / 假数据` 或空态展示 HOME、当前位置、示例 POI；不得连接生产 World/Expedition、写真实地图 marker、计算动态返家方向、路线或距离。真实游戏地图的 POI 显示要等独立 Discovery owner/API 先经审查。

**独立静态演示页：**[潮线导航图 UI-1 DEMO](2026-10-04-map-ui-prototype-demo.html)。

此静态原型重点是清楚层级、图标、图例、空态和触控关闭；不添加地图内容、奖励、迷雾规则、自动寻路或任务状态，也不掩盖当前活动地图显示所有 biome/mob/shard marker 的行为。是否要保留现有全图敌人与 shard 显示是单独的产品决定/平衡议题，本卡仅记录为 UNKNOWN。

设计借鉴 Terraria 的地点发现、Minecraft 的地图准备、Don't Starve 的出发/返家意识、Stardew 的日常地点辨认与 Crashlands 的目标可读性。地图符号要和实际像素场景互相辨认；提供图标+短文本/形状，不只靠颜色；触控尺寸与对比必须在实际设备验证。地图板的视觉材质可以采用现代海岸巡查图/旧公交线路图的原创组合，并符合 `ART_BIBLE.md`。这只是 UI 概念文字，不是已生成或已绑定的生产美术。

## 5. 单切片建议与允许边界

下一项可选工作是 **MAP-1 静态演示稿**：使用单独的测试 fixture（或明确空态）在隔离 DOM/canvas 预览中整理层级；不可直接读取未提供 discovery API 的真实 POI/Expedition 数据。之后若用户决定要实际 POI 导航，先开 World/Progression 单独任务，定义 discovery 状态 owner/API 及隐藏地点权限，再开 UI 实际接入切片。主责 UI/Map；World/Progression 提供未来合同；输入模块仅处理开关与焦点。由于本轮没有浏览器/运行截图，不能预判实际 renderer 的坐标投影适配方式。

未来实现至少明确准确文件名单后，限定为一个地图 UI 组件及它的测试/loader 接线；不重写背包、操作、World POI、相机投影或 Relay。UI 引用正式 art 前先遵从美术负责人当时正在使用的视觉规范与素材合同，不编辑共享 art intake/atlas/manifest，不覆盖未知来源文件。

## 6. 验收和回归标准

- 静态原型的假 marker 与真实 World API 完全隔离并有醒目 DEMO 标记；关闭面板或刷新 UI 不会发奖、揭示生产地点或修改存档。
- WASD/方向键、触控 joystick、Shift/Space/E/B/I 保持原映射；打开面板、Pause、聊天输入、pointercancel、失焦、orientation change 后移动输入均能按预期停止/恢复。
- 桌面、手机与多人中的菜单暂停语义明确；多人打开本地 overlay 不应造成全局世界暂停。地图/背包/制作/聊天/设置同时切换时不重复覆盖 handler、不遗留遮罩或失效焦点。
- 390×844 和 1280×720 实际截图中，关键指标/任务/按钮/角色不互相遮挡；字与图标清楚；重点交互有足够触控区域；像素边缘在实际尺寸仍锐利。未实测的设备写 UNKNOWN。
- 当前没有 discovery API 时，production 接入必须 BLOCKED 或呈清楚空态；不能把 `poi` 定义表、expedition phase 或 objective text 当成 discovered 状态，不能全量暴露 POI，也不能编造连接线、距离、返家方向或“自动导航已启用”。
- 相关 Node 回归仍需逐文件顺序运行：`game-shell-v1.test.mjs`、`platform-inventory-v19.test.mjs`、`platform-input-retry-idempotency-v1.test.mjs`、`interaction-v12.test.mjs`、`interaction-retry-idempotency-v1.test.mjs`。本轮这些已过，但并不替代新 UI 的地图数据 selector 测试、浏览器操作、手机试玩或双人检查。
- 审阅完整 diff 与所有脏/未跟踪文件来源；不删文件，不自动提交/合并/部署。

## 7. 给未来 UI 单模块 AI 的复制任务

```text
你本次只负责 ABYSSAL WAKE 的 UI / Map / Input 中【一个明确切片】，不要重写整个 HUD。先读本卡、PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md、ART_BIBLE.md，以及 survival-v21.html 的 loader、survival-v7.html 模板、base-ui.js、ux-cn-v11.js、interaction-v12.js、platform-inventory-v19.js、game-shell-v1.js 和相关测试。重查 branch/HEAD/dirty worktree。

UI 只显示领域 owner 状态；Input 只归一输入意图。World 目前没有 POI discovery API，目标文案也不是发现记录；地图任务先只准使用隔离 mock fixture/空态。未来真实地图接入前，必须另行定义并审查 discovery owner/API 和未发现地点权限；不能从 `ABYSSAL_AWAKENING_WORLD_V1.poi` 列表推断所有地点已发现。当前 V21 有多层 browser-global 包装器，先确认实际 handler/boot 顺序，不假设已有统一 UI state store 或 event bus。不要改变伤害/背包/存档/Relay/世界 authority。

唯一目标：【例如 MAP-1 地图静态模型与原型】。先列明确的模块 owner、数据字段、失败空态、允许文件和回归风险，再做最小可审阅的 isolated slice。保持安全区、pixelated 清晰度、键鼠/触控映射和面板焦点行为。运行对应 Node 测试并审 diff；如果只跑了 stub tests，就说明浏览器/手机/多人仍 UNKNOWN，不要声称游戏体验已通过。所有现有文件都先保留，不删除或覆盖未知来源改动；不自动合并、部署。
```

**本卡是待审的独立模块规划。五个相关回归在本轮通过；没有编辑运行时代码、UI、美术素材、manifest、存档或 Relay。**

# DRAFT — World Map 视觉与像素接口提案 V1

**状态：DRAFT / UI & RENDERING OWNER REVIEW REQUIRED / NOT IMPLEMENTED / NOT PRODUCTION。** 这是对现有 V21 320×320 实时地图的展示提案，用于解决九宫格纯色、SafeCamp 符号拥挤、手机图例微小和地图弹层被交互提示盖住等已观察问题。不增加 POI、探索揭露/迷雾、寻路、任务规则、危险预警或新地图系统。

## 现状证据与数据边界

- `modules/core/runtime-state.js:2` 定义 `WORLD={w:4800,h:4800,zone:1600}` 和 9 个 `BIOMES`；九宫格一格对应 1600×1600 world units。
- `modules/ui/ux-cn-v11.js:7–18, 285–340` 定义营地 Guide `(2325,2370)`、fire `(2400,2400)`、workbench `(2195,2535)`、shared chest `(2590,2540)`、9 个中文 zone 名、320×320 canvas 与位置绘制。转换为地图时每 15 个 world units 约 1 个 map pixel；玩家/队友、Guide、fire、workbench、chest、存活 mobs、未拾 shard 会出现。不存在已确认的地图路线 polyline 或真实地图图像素材。
- 地图每 200 ms 刷新；canvas 展开时才绘制。当前每个 biome 是独立纯色色块，边界为细线，current zone 为浅黄色描边；点位由颜色圆点和可选 1 字符标签表示。
- `survival-v7.html:9` 设 `.map-canvas` 为 `width:min(100%,340px)` 且 `image-rendering:pixelated`。来源 320×320 映到 340×340 时是 17/16 非整数倍率；地图 panel 中的玩家符号因此没有已确认的 integer display-pixel contract。
- `modules/input/interaction-v12.js:40` 将 `#interactionPromptV12` 置于 z-index 44；`survival-v7.html:9` map panel 为 z-index 24。已复现的手机地图面板截图中，世界交互提示仍压在地图与场景之上。该项是 UI 遮挡缺陷，不是美术素材缺失。
- SafeCamp 聚簇区域很小：fire 与中心 zone 同点；Guide、workbench、chest 彼此只相差数十至数百 world units，在 320 像素整图上彼此相邻。这是既有世界位置映射造成的重叠压力，不可通过任意挪动标记伪装实际坐标。

## 建议的展示语言

### 1. 阅读优先级

地图打开后按此顺序读：**当前区域与玩家 → Guide/营地核心 → 队友 → 共享交互点 → 可见敌人 → shard**。区域名与边界保持背景层；除玩家外的点不应抢过当前位置。图例放在地图 canvas 外的 UI 面板，避免缩进地图图形。

### 2. 地表底图与区域

- 保留真实 3×3 zone 拓扑与现有 `WORLD` 比例；九区保持各自现有 biome 语义色，不从概念图重画不存在的海岸/道路。
- 以低对比暖灰绿、湿地青绿、海岸蓝灰等值域分区；zone 分隔使用稳定 1 px 内线，当前区使用浅暖边框 + 文字 `当前区域`/现有区域名，不只靠颜色判断。
- 可以加入低密度原生像素纹理作 biome 质感，但质感不编码新的路径、碰撞边界、资源位置或危险程度。已有数据没有准确 route polyline 时，不绘制暗示可通行方向的装饰线。
- 所有 `WORLD.w/3` 的几何边界本身不可被 320 整除；显示边界应吸附到整数 raster 坐标，并保持边界累计覆盖 320 px，不能留下缝或半像素线。吸附算法交 UI/Rendering owner 确认。

### 3. 点位符号语义

沿用当前已有实体类别，不增数据：

| 对象 | 现有状态 | 建议图形编码 | 约束 |
|---|---|---|---|
| 本地玩家 | 当前坐标 | 亮色实心方向/中心记号 + 深色 1 px 外缘；旁边短标签 `我` | 第一视觉层；由实时坐标驱动。 |
| 队友 | presence / remote 坐标 | 绿色空心菱形或双层环 + 名称缩写 | 与本地玩家用形状区分；没有在线成员时不画虚构伙伴。 |
| Guide | 固定既有 NPC 坐标 | 暖白向导/旗标记号 + `向` | 不暗示新的任务或队伍功能。 |
| 篝火 / 工作台 / 共享箱 | 现有 SafeCamp 交互点 | 火焰 / 十字工具 / 方箱轮廓，分别标 `火` / `台` / `箱`；箱子保持可用状态与 cooldown 的现有色差语义 | 不挪动点位；重叠时宁可减少文字，也保留正确图形位置。 |
| 怪物 | 存活 mob 坐标 | 暗红三角/断角标记 + 外缘 | 只表示现存怪物位置，不表示攻击方向、仇恨或预测伤害。 |
| 异质碎片 | 当前可拾取 shard | 紫色四角晶片轮廓 + 1 px 浅色切面 | 与敌人红色警示形状不同；不显示已拾/已消失节点。 |

颜色只作冗余编码，缩至最终 map CSS 尺寸后仍需用形状、边框、文字区分。当前仅 source canvas 320×320 可确认，实际 marker 的整数缩放和设备像素密度仍未知；以上像素数是视觉提案，不是已签认合同。

### 4. 营地聚簇与弹层

- SafeCamp 内 4 个主要 mark 按真实 world-to-map 点位绘制，图形中心不漂移。文字 label 使用分离的 callout/引线或仅保留当前焦点类别的短标签；不把 Guide、fire、bench、chest 统一移到网格角落。
- 打开地图时，world interaction prompt 应隐藏或降到 dimmed game layer 下方；地图 panel、关闭按钮和地图图例必须在上层且可操作。摇杆/快捷栏可以保留暗化背景作场景上下文，但不可看似仍正在前景交互。
- 这需要 UI/Input owner 审批 z-order 与 input lock；本提案不授权修改行为、暂停模拟、增加地图手势或改变多人更新节奏。

## 采样与双 viewport Gate

地图已有 source raster 为 320×320。美术与 UI owner 应先共同签定以下一种实现，再画高密度纹样/图标：

1. 320×320 CSS 显示（图形 1 CSS px : 1 canvas pixel），手机内部空间可容纳时居中；或
2. 重新定义 canvas backing size 与图标/文字栅格，使 desktop/mobile display 尺寸和整数倍率均可验证。

不可把 320 px art map 拉伸到 340 px 后就称原生锐利。若 DPR 产生设备像素映射，要分别记录 CSS size、canvas backing size、DPR、browser/device output 和 smoothing 状态。Canvas 字体/文字保持可读并与硬像素符号有意区分；禁止半像素边线/随机纹理盖住标记。

审阅顺序：原生 320×320 canvas；340 px 当前桌面 panel A/B；390×844 map modal 与点击关闭/遮挡；1280×720 modal 与场景关系。最后两项均须在真实 guarded successor 运行图中核对；离线 mockup 不算验收。显示图例必须完整可辨，玩家/Guide/fire/bench/chest 即使集中也能分别辨认，背景 path prompt 不应压过地图。preview badge 与开发诊断不得伪装 production UI。

## 对五款玩法体验的约束

UI 仅服务于当前既有循环：用清晰图例支持 Terraria 式方向/发现、用准确敌人符号表达 Don't Starve 式可读风险、用常驻 SafeCamp/Guide/工作区标记强化 Minecraft 与 Stardew 的回家/社区识别、用形状明显的怪物符号提升 Crashlands 式遭遇读取。以上不代表新增迷雾揭露、指南针、发现奖励、警戒状态、营地建造或居民日程。

## Owner 决议项

| 决议 | 建议 | Owner / evidence |
|---|---|---|
| Map native display size / DPR | 优先保持 320×320 CSS 1:1；按 mobile panel 可用宽度决定是否可行。 | UI/Input + Rendering；记录两种 viewport 的 CSS/backing/DPR/nearest data。 |
| Zone raster boundaries | 用累计整数 edge `[0,107,213,320]` 或 owner 认可的映射；label/marker 使用同一 world-to-map 变换。 | Rendering；加离线 3×3 seams/marker overlap sheet。 |
| Marker glyph sizes / anchors | 先作图形清晰度比较板，不进入 manifest；地点中心以现有 world x/y 为准。 | Rendering & Art + UI/Input。 |
| Modal z-order | map modal 高于 world prompt；打开期间 prompt 不压住地图。 | UI/Input；目标 viewport 截图/交互证据。 |
| 内容范围 | 只现有 9 zone 和当前动态实体；无静态路线、新 POI、迷雾或危险预测。 | World & Terrain owner 核对数据语义。 |

**当前决定：未签认、未实施。** 这是 UI/art interface proposal，不冻结现有 320→340 缩放、source pixel density、图标 glyph、地图地理内容或输入层级。无需扩绘资源组；等 UI/Rendering owner 接受接口后，先出一张符号与底图 review board，再评估真实 successor 两尺寸复核。

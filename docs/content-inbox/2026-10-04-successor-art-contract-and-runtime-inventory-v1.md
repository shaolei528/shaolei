# DRAFT — Successor 美术合同提案与 V21 运行时资产盘点 V1

**状态：DRAFT / REVIEW INPUTS PROPOSED / ENGINEERING OWNER CONFIRMATION PENDING / FULL CONTRACT NOT FROZEN / NOT PRODUCTION。** 本文结合现有源码、camera-3-4-v2 研究页及 `docs/handoffs/2026-10-04-successor-renderer-engineering-contract.md`。只读工程合同审核方建议 §14 的源图尺寸与 source-coordinate anchor 可作为单张合同评审样稿输入；这不是负责工程 owner 的签字、renderer 实现或完整合同冻结。其余接口仍须主协调者与工程负责人确认。不得扩画完整资产组或接入 V21。

## 状态说明

**优先阅读第 §14 节。** 第 §4、§5 节记录早期提案背景，其中角色脚点 `(16,47)` 表示法及道具 `(width/2,height-1)` 锚点已被 §14 的图片下沿 placement anchor `(16,48)`、`(width/2,height)` 取代；早期“合同完全冻结后才画评审样稿”的顺序也已由 §14 更具体的阶段安排取代。下文 §14 为本稿当前口径。

**主责：** Rendering & Art。**协作：** World & Terrain、Home & Building、UI & Input、Integration & QA。

## 1. V21 运行时资产与处置建议

下表列出当前 V21 实际引用，不按资产目录中 PNG 的数量推断。建议针对 successor 的美术处置；KEEP 表示 V21 替换完成前保留运行保障，不代表画面已经通过。

| 区域 / 类别 | VERIFIED 路径、用途与合同 | 缺图或当前限制 | 建议 |
|---|---|---|---|
| SafeCamp 地面 | `survival-v21.html:28` 加载 `terrain-v21.js`；`terrain-v21.js:12–16, 205–221, 256–261` 选择 `assets/art-v21/terrain-v21.png`，5×4、64×64 格，覆盖 SafeCamp 24×20 地图；碰撞另存于 `COLLISION_MAP`（`terrain-v21.js:120–124`）。底层另由 `base-renderer.js:5` 绘制 24×24 色块。 | tilesheet 失败时 `terrain-v21.js:184` 保留 legacy ground。V21 网格为轴对齐；并非 3/4 投影。 | **REPLACE** successor 视觉；旧 V21 保持为 fallback，直至替代路径通过验收。碰撞独立保留。 |
| OUTSIDE 普通区域 | V21 通用地面仍由 `modules/render/base-renderer.js:5` 以 biome 色块和稀疏小矩形绘制；9 区 biome 色来自 `modules/core/runtime-state.js:2`。 | 无完整区域贴图族；SafeCamp tile atlas 不覆盖普通全世界地表。 | **REPAINT**，按区域成组重做地面与边界，最后逐区接替旧 fallback。 |
| OUTSIDE 北路 / MIRE MART 地形 | `survival-v21.html:28` 加载 `awakening-world-v1.js`；`modules/world/awakening-world-v1.js:6–7, 54–69, 98` 定义 north-road 区域、加载 V21 atlas，并叠加 64×64 terrain/decal。美术适配器 `modules/render/awakening-art-assets-v1.js:5–6, 76–88` 默认请求 `assets/awakening-v1/manifest.json`，只有 `?awArtPreview=1` 才请求 `manifest.preview.json`。 | 当前检出中正式 manifest 不存在；正式模式走 64×64 atlas 或原始绘图 fallback。开发清单不会自动成为生产资源。 | **REPAINT** successor 区域素材；旧区域先 KEEP，preview 资产继续隔离。 |
| SafeCamp 建筑与道具 | `modules/core/runtime-state.js:3` 读 `assets/camp_props.png`；`modules/render/base-renderer.js:2,6–7` 按 48×48 cell 取图并逐项布置篝火、帐篷、围栏、灯具等。 | 缺图时 `drawSprite` 返回 false，但营地 props 无通用替代绘制，可能直接缺席。 | **REPAINT**，与地面同场统一重做；V21 未替换前 KEEP。 |
| MIRE MART 建筑 / 室内道具 | `modules/world/awakening-world-v1.js:28–38, 70–78` 按显式 world rectangle 绘制墙、货架、冰柜、柜台、碎屑、栅栏、路障及招牌；绑定 PNG 由 awakening art adapter 提供。 | PNG 无绑定或不加载时使用 `fillRect` primitive；碰撞 footprints 与美术 PNG 尺寸不必相同。入口和碰撞由独立数据定义。 | **REPAINT**；保持模块化视觉并保留入口/碰撞数据权威。 |
| 玩家与营地 NPC | 玩家图为 `assets/player_sheet.png`，24×32 cell；`modules/render/base-renderer.js:10` 选四方向行、四帧动画，显示名称/状态；营地 Guide 在 `modules/safe-camp/game-v7-patch.js:42` 复用玩家图首帧。 | 玩家本体缺图时没有实体 sprite fallback；Guide 的框、名称和提示仍由文字/矩形绘制。源码中可确认的营地 NPC 是 Guide，不把远程玩家误计为 NPC。 | **REPLACE** successor 玩家与 Guide 视觉；保留名称、交互和状态的运行逻辑。 |
| 怪物 | `assets/monster_sheet.png`，32×32 cell；`modules/render/base-renderer.js:9` 以 4 列×3 行表现 watcher/cultist/crawler，四帧循环。 | 贴图不可用时显示 20×20 暗色方块；攻击/受击表现另由 combat presentation 提供。 | **REPAINT**，保持怪物语义与 gameplay 状态分离。 |
| 资源 / 掉落 / 背包图标 | `modules/core/runtime-state.js:3` 读 `assets/resource_sheet.png`，实际 PNG 为 128×32、四个 32×32 帧；拾取绘制见 `modules/render/base-renderer.js:8`，背包 sprite CSS 见 `modules/input/platform-inventory-v19.js:97`。 | 地面拾取图缺失显示 8×8 浅色方块。背包 CSS 把 128×32 源表设为 152×38，单格 32×32 → 38×38（19/16 倍），虽启用 `image-rendering:pixelated`，仍有非整数 pixel-density 风险；具体画面锐度/像素宽度尚未按目标 viewport 复核。 | **REPAINT / REVISE sampling review** 背包图标并统一像素密度；物品类型和数量保持数据驱动。不得只因尺寸源代码推断实际屏幕上已发糊。 |
| 地标 | `modules/safe-camp/content-v9.js:15–25` 定义营火、工作台、祭坛、码头等语义；`modules/render/render-v9.js:84–130` 用基本矩形与线条绘制 ruin/idol/pier/ward。 | 没有对应图片资源；仅替换 PNG 不会改变这些程序图形。 | **REPAINT** 为原创像素资产候选，交互仍由地标数据驱动。 |
| HUD / 地图 / 控件 | `survival-v21.html:28,33` 按序加载模块并挂载 `survival-v7.html` 的 HTML/CSS（样式行 9）；HUD、joystick/action、地图面板以 DOM/CSS/文字为主。实时地图由 `modules/ui/ux-cn-v11.js:285–340` 生成 320×320 canvas，CSS 在 `survival-v7.html:9` 将其显示为 `min(100%,340px)` 正方形并设 `image-rendering:pixelated`。 | 地图没有独立贴图或 PNG fallback：代码逐帧重绘 3×3 biome 色格、当前区圆环、玩家/队友/Guide/营火/工作台/宝箱/怪物/碎片标记；面板仅展开时绘制，200 ms 定时刷新。HUD/安全边距由 CSS 处理，不属于艺术 manifest。 | **WAIT / REVISE screen hierarchy**，待真实 successor 信息层级和桌面/手机安全区验收后统一评审；程序地图需按最终地点符号与实际字号另做视觉复核。 |
| 光照 / combat FX | `modules/render/render-v9.js:20–82, 133–143, 169–181` 绘制阴影、粒子、营地暖光及威胁暗角；`base-renderer.js:11` 叠加夜色、手提灯、sanity 色罩。 | 多数为 canvas 原语、渐变或粒子，不是 PNG；过暗或全屏紫色会盖掉路径与人物。 | **REPAINT** presentation，但 FX 素材不改变伤害、状态或联网权威。 |
| MIRE MART anomaly / flicker FX | `modules/world/awakening-world-v1.js:38, 78, 100` 调用 FX adapter；候选路径在预览清单，默认缺资源时画细矩形。Adapter 支持帧裁切见 `modules/render/awakening-art-assets-v1.js:74`。 | 当前实现中多帧 `drawFx` 使用 `let` 暂存，不复现此前记录的 const 重赋值异常；本次仅源码检查，未运行 FX。 | **REPAINT** 候选并保持 preview 隔离；动画运行时覆盖仍 **UNKNOWN**。 |

### UI / FX 入口与资产边界补核 — 2026-10-04

- **VERIFIED V21 UI entry:** `survival-v21.html:28` 按序加载 `base-ui.js`、`ux-cn-v11.js`、`platform-inventory-v19.js` 与其余模块；`:33` 从 `survival-v7.html` 装载 body/style 并剥除其 scripts。HUD、按钮、进度条、对话/交互/地图/背包 panel 主要由 HTML/CSS 和文字构成，不存在可替换它们的单一 UI spritesheet。标题 hero sprite 和头像由 `.sprite-hero` / `.portrait` CSS 引用 `assets/player_sheet.png`（`survival-v7.html:9`）。
- **VERIFIED world-map canvas:** `modules/ui/ux-cn-v11.js:285–340` 运行时建 320×320 canvas；每 200 ms 检查/更新，面板展开时清画布并绘制九区 BIOMES 色块、边框和简体区名，叠加 SafeCamp 圈、玩家、队友、Guide、火堆、工作台、共享箱、活怪与 shard 标记。CSS 令 canvas 宽度最多 340 CSS px；地图绘制本身是 canvas 色块/圆点/文字，没有贴图资源或 asset fallback。非展开状态不绘制。地图设计需基于真实地点/POI 的现有语义，不应只美化抽象九宫格。
- **VERIFIED UI source-size risk, not yet confirmed visual bug:** `assets/resource_sheet.png` 实测 128×32、RGBA PNG；inventory sprite CSS (`modules/input/platform-inventory-v19.js:97`) 设 background-size 152×38，因而 4 个源 32×32 格各显示为 38×38（19/16 倍）。规则明确设置 `image-rendering:pixelated`，但这个非整数倍率仍可能造成不等宽像素簇；实际桌面/手机 CSS+device-pixel raster 未于本次实测，分类 **SUSPECTED UI sampling risk / UNKNOWN screen result**。遵守当前文件边界，本轮没有改 UI/CSS 或正式图标。
- **VERIFIED V21 procedural FX:** `modules/render/base-renderer.js:4,11` 在主体之后绘制 night overlay、OUTSIDE vignette/lantern radius 与 sanity tint；`modules/render/render-v9.js:20–82` 以 Canvas 绘制脚底影、营火 embers/环境 motes 等。它们主要是逐帧程序 presentation，不是 manifest PNG。颜色/透明度需保证路线、实体与战斗提示可辨识；不能把颜色罩当作异常/命中唯一信号。
- **VERIFIED MIRE MART FX boundary:** 只有 URL 查询 `?awArtPreview=1` 才由 `modules/render/awakening-art-assets-v1.js:5–6` 选择 `manifest.preview.json`；V21 默认请求正式 `manifest.json`。`manifest.preview.json:91–92` 目前绑定 flicker 与 early-residue 候选。`awakening-world-v1.js:98–100` 由地层 hook 绘制这些 FX；`drawFxLayer()` 在资源 adapter 未命中时保留原生细矩形 flicker/anomaly fallback（`awakening-world-v1.js:78`），asset API 无 manifest/file 时回报 `fallback`（`awakening-art-assets-v1.js:76–88`）。这些是 V21 preview 资产，不会因存在于清单而成为 successor 资源。
- **VERIFIED successor UI boundary:** `prototypes/successor-3-4/successor-renderer.js:61` 的 relay/memory 状态 badge 受 `AW_DEV_QA` 控制，是开发预览标识，不是 production HUD。项目状态记录的 successor 目标 viewport capture 也使用 legacy V21 sprite/renderer sheet；candidate 仍未载入。
- **Acceptance gap status update:** 之后的 guarded successor 实景复核与 UI/map 观察见本节末尾新增条目。该复核填补了两种 viewport 下的 legacy scene/UI 基线证据，但没有加载 SafeCamp candidate，也未检查 candidate 在 Canvas 中的像素密度、FX 动画、浏览器 DPR/compositing 或正式 HUD；这些仍是 **UNKNOWN**，successor contract 仍 **NOT FROZEN**。

### 本地 guarded successor UI 实景复核 — 2026-10-04

- **VERIFIED review surface:** Opened the current `prototypes/successor-3-4/index.html` through a repository-local static server in a fresh isolated browser tab. Its guarded iframe booted actual V21 state/render/data with the preview memory-save shim and WebSocket fail-closed hook. The visible banner read `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`; status reported Relay blocked and the memory save shim. The root element's `data-real-storage-unchanged` attribute was read as `true`. Reported legacy images: terrain 320×256, player 96×128, props 192×96, resources 128×32, monsters 128×96. No SafeCamp art-candidate files were loaded. The local server was stopped after review.
- **VERIFIED 1280×720 outer viewport:** The browser viewport override was explicitly set to 1280×720; the screenshot pixels were 1280×720 and successor status reported the internal game arena at 1100×618. The legacy terrain had dense/repeating grass detail and a strongly stepped shoreline; player and props read small compared with the world. Preview/header HUD items span the full top band while status, task, player-list, and action elements overlap scene area. This is guarded local successor evidence only, not candidate or production acceptance.
- **VERIFIED 390×844 outer viewport:** Exact viewport override and screenshot were 390×844; status reported arena 390×742. The world remains legible as HOME but dense ground/shore motifs and legacy-small actor/prop scale persist. Debug/header status wraps across several lines over the top HUD. Task/player-list overlays occupy opposite upper scene corners, while interaction prompt, joystick, helper legend, quickbar and chat/map/bag controls share the lower scene area. **REVISE mobile hierarchy/overlay density**; do not attribute development-banner overlap to production UI.
- **VERIFIED map panel at 390×844:** Opened the actual V21 map button within the game iframe (UI-only action). The 320×320 backing map displays within a 340 px CSS box at the measured 390 viewport. The nine biome cells and yellow/green/red/purple markers render; multiple SafeCamp labels compress tightly around the current-zone circle, while legend/note text is very small. The modal fits vertically, but the underlying interaction prompt, joystick and lower HUD stay visible around/beneath it. **REVISE** map semantics/label size and modal-vs-HUD separation after owner reviews the UI contract. These checks do not identify a confirmed gameplay bug.
- **VERIFIED preview console:** Browser console query returned no warning/error entries during this static review. This does not establish play-loop, touch input, physical phone, multiplayer or save behavior.
- **Cleanup:** Closed the map panel, reset the temporary viewport override, and stopped the local server. The tab was agent-created/temporary. No source runtime, preview manifest, gameplay, UI/CSS, test or production-art file was edited. Candidate scene assets remain disconnected, so both their pixel-density-in-game and visual fit at these viewport sizes remain **UNKNOWN**.

## 2. 统一视觉规范草案

| 轴 | 首轮评审基准（DRAFT，合同冻结前不作运行时承诺） |
|---|---|
| 3/4 投影与格 | 采用 V2 的 2:1 斜俯投影，不做立方等距。研究式公式为 `screenX=(worldX-worldY)/2`、`screenY=(worldX+worldY)/4`；64×64 world-unit 单格对应 64×32 screen diamond。地块格心为 `(32,16)`；地面边界须可连续读出草地、路、沙滩与水域。最终 source rect 和 renderer 映射等待工程冻结。 |
| 人物、物件和脚点比例 | 角色脚点与道具接地点都落在地面坐标，人物保持双脚总宽约为一个逻辑格宽的 0.35–0.55，不画成立方体。拟定首轮角色帧 32×48，placement anchor `(16,48)`，最下方鞋底像素在 row 47（约 1.5 个菱形格高）；小拾取物宽约 0.2–0.4 格，工作台/篝火约 0.5–1 格宽，帐篷/小屋主体约 1–2 个角色身高。每个可走/不可走边界仍由显式玩法数据定义。 |
| 轮廓与簇尺度 | 角色主要外轮廓通常 1 px 深色断续线；光源侧可省略，暗侧保持剪影。大型建筑外缘局部可用 2 px 阴影面，不套统一黑描边。主要材质用连续 3–8 px 色簇塑形；2–6 px 簇给次级材质，1–2 px 只做眼睛、刃口、金属边、火星等焦点提示。禁止全表面均匀噪点与半透明抗锯齿边。 |
| 明暗和材质 | 同一物件控制在 3 个主明度面（亮/中/暗）加少量反光点；主光从屏幕左上，投影落向右下，脚边接触阴影最深。用宽色面先分草、压实土、沙、湿木、石、布、铁，再画顺着结构的磨损；每块地面保留可辨大形，细节不抢路径边缘。 |
| HOME 色温 | 草/苔中色 `#6B8562`、暗绿 `#405B49`；压实土路 `#8D6847`；旧木 `#6F4C34`；褪色布/沙土 `#C6A878`；水 `#477783`。营火和窗灯用琥珀 `#F3C36F` 做局部光源，亮色不可铺成整片地表，且不能淹掉交互轮廓。 |
| OUTSIDE 色温与异常色 | 湿地/沥青灰绿 `#53665A`，阴影冷青灰 `#293E43`，近岸水 `#355E69`，远处雾层降饱和而不降路径对比。归家灯标可留少量 HOME 琥珀色。早期异常色限用病白 `#EAF4E7`、冷青 `#9DE0D1` 的点状/窄轮廓信号；异常只强调 POI，不铺全屏滤色，不遮挡道路与人物。 |
| 细节密度与可读性 | 视觉层级按“玩家/可交互物 > 路线/岸线 > 建筑大形 > 材质纹理 > 微粒”排序。地面微细节集中在少数簇中，不作均匀散斑；1× 下先检查剪影、材质和归返路线，nearest-neighbor 整数放大后检查簇的边缘与重复节奏。 |
| UI 和原创性 | UI 使用硬边像素图形和清楚文字，关键含义至少由形状/文字之一补足色彩。概念图只参考情绪、构图、色温与镜头；人物、建筑组合、道具、地图、UI 全部原创。 |

以上色值和比例是可评审的首轮方向值，不是冻结 palette 或资产规格；需要拿一格草地、一段岸线、一名人物和一个道具并置复核，再由艺术与工程共同冻结。

## 3. 五款游戏体验如何落到画面

这些是体验取向，不是照搬既有机制；艺术只负责让真实玩法容易读懂。

| 体验来源 | 在 ABYSSAL WAKE 里的画面表达 | SafeCamp 候选应呈现 |
|---|---|---|
| Crashlands：战斗反馈直接、敌人有活力 | 敌人轮廓容易分辨；命中、攻击预警和资源反馈留出清楚的视觉层次。 | 不增加营地战斗，只让玩家/NPC 的身高和世界单位更易比较。 |
| Terraria：探索、发现和逐步打开目标 | 路标、岔路、POI 外形和异常线索能支持方向判断与地点记忆。 | 让通往外部道路与海岸的地形边界可追踪；不在草坪图上伪造未实现的门锁/任务。 |
| Minecraft：家的经营与玩家表达 | 家园物件具用途感、可辨识；营地更新后应能被视觉感知。 | 工作台、火堆、储物和可搭建空间组成一个有人使用的营地区块；画面草案不宣称玩家现已能自由建造。 |
| Don't Starve：生存压力与安全区外风险 | 明暗、天气线索、资源和安全边界帮助判断准备/归返，不靠遮屏制造难度。 | 以暖火和回程路径建立安全感，环境细节不抢交互目标。 |
| Stardew Valley：日常生活、成长与社区 | NPC、休息点、工作区和小型生活痕迹让回营有情感价值。 | Guide 与玩家同场按一致脚点/身高呈现；避免将概念图里的 NPC 造型搬入游戏。 |

## 4. Successor 原生尺寸合同提案 — 前期草案（锚点细节已由 §14 修订）

camera-3-4-v2 页脚现有研究标注为 `64×64 → 64×32` 地面、`24×32` 角色格、`48×48` 道具格；README 同时将角色评为太小、细节不足。这些只证明研究页当前用了该尺寸，不能视为工程批准。建议工程负责人确认或修订以下新制式：

1. **逻辑世界格：** 保留地图的 64×64 world-unit 格心语义，与当前坐标/碰撞解耦；按 V2 投影，一个逻辑格成为 64×32 screen-pixel 菱形。地表 PNG 原生画布建议 64×32，菱形四角在画布边缘，地块中心锚点 `(32,16)` 对准逻辑格心。格外四角透明与当前 Awakening “base terrain 全不透明”规则不同，因此只适用于 successor；工程需确认投影地块能无缝覆盖平面，避免透明角露出底色。
2. **角色帧：** 建议玩家/Guide 原生帧从 24×32 调整为 32×48，脚点为底部中心 `(16,47)`；保留四个屏幕朝向、每向四帧作为第一版接口，攻击/命中状态继续由 presentation overlay 表达。该尺寸是相对旧小图的提案，需工程在 successor 实际 camera 尺度下确认，不直接覆盖旧图集。
3. **道具与建筑：** 不采用统一 48×48 上限。各资产按完整轮廓原生定界，早期建议锚点 `(width/2,height-1)` 已由 §14 修订为图片下沿接地点 `(width/2,height)`；大建筑拆成可组合前景/立面/顶面层或以明确视觉锚点的单体绘制。碰撞范围仍显式独立，绝不由 alpha 推算。
4. **像素密度与采样：** 原生像素画在预览 1×下逐像素映射；只用 nearest-neighbor，缩放采用整数倍率，不为迎合图集尺寸缩放/重采样。PNG alpha 外缘保持硬边，不留半透明 fringe。动画帧只在同尺寸网格内排列，静态图可作为动画缺失 fallback。
5. **冻结项：** 工程负责人先确认可用于评审样稿的 logical-cell/pixel 投影、人物显示身高、4×4 帧布局/朝向映射、prop placement anchor、透明像素规则及 base zoom。其后先绘制一张连续 SafeCamp 合同评审样稿，用少量代表性地面格、营地物件、玩家与 Guide 标注 native rect、anchor 和 1×预览；这张样稿用于检验比例与接口，不等于展开整套资源组。样稿通过目标画面复核且 owner/协调者记录冻结决定后，才扩展完整资源组。

## 5. 美术侧对工程合同的回应

| 接口点 | 美术侧建议 | 冻结前需要工程确认 |
|---|---|---|
| 投影与逻辑格 | 接受 64×64 world-unit cell 经 2:1 投影成为 64×32 screen diamond；图片中心锚点跟随格心。 | 明确 V21 / successor viewport 的基础 zoom 与 screen pixel 定义，使候选 1× 真正逐像素呈现。 |
| 角色尺寸 | 在工程列出的 32×48、64×64、96×128 source-frame 选项中，建议先选 32×48 作为最小角色原生帧；旧 24×32 在现有研究中已显得低细节。 | 32×48 是否对应实际显示尺寸，还是逻辑 source frame 尺寸；需与 actor/ground/prop 同场核准。若 64×64 或 96×128 按原尺寸显示，需先证明不会破坏人物/场景比例。 |
| 角色锚点与动画 | 前期建议底中 `(16,47)` 表述已由 §14 修订；placement anchor 为 `(16,48)`，鞋底像素在 row 47。建议 4 个投影朝向 × 每向 4 帧，帧格一致，状态效果由独立 presentation 表达。 | 朝向到运行时输入的映射、行列顺序、frame duration 和帧 0 fallback。 |
| 道具、建筑与层序 | 道具锚到显式地面接触点；大建筑分成地面 footprint、后层/顶层与可遮挡玩家的前景带。 | 采用 foot depth `worldX + worldY` 并追加稳定 ID/order；确认建筑需要的 occlusion bands 与 art source rect 绑定方式。 |
| 像素采样与 UI | 源像素不重采样；nearest-neighbor。非整数 viewport 无法整倍缩放时，由工程在清晰内部像素画布、letterbox 与安全边距中实现。UI 避开触控区和 viewport safe insets。 | 桌面与手机各自的内部像素 viewport、整数 zoom 策略、390×844 控件安全区。 |

除了表中需要落定的具体映射/像素 viewport，建议冻结为：64×64 world unit → 64×32 screen diamond；32×48 actor cell，脚点底中；prop 依物件原生边界但锚到地面接触点；4×4 actor sheet；稳定 foot-depth 排序；非整数缩放以清晰内部 viewport 处理。冻结记录请由主协调者合并两份提案后确认；这份美术反馈本身不构成工程签字。

## 6. 已检查风险与证据边界

- **VERIFIED（源图目视）：** `assets/player_sheet.png` 的 24×32 人物轮廓在整张图中很小、可用色簇有限；`assets/camp_props.png` 与 `assets/resource_sheet.png` 的主要物件能认出，但材质面较平。SafeCamp V2 离线合成图能看到草簇形成横向重复行。它们支持“需要重绘”的方向判断，不代表已验证游戏内最终比例。`assets/art-v21/terrain-v21.png` 当前图像查看器无法解码，不能据此对旧 atlas 的实际图面质量下结论。
- **VERIFIED 源码风险：** `modules/render/render-v9.js:198–219` 按整类依次画 camp/props、资源、怪物、远程玩家和本地玩家，没有对这些类别做统一的脚点深度排序。旧 V21 角色在营地物件前后穿行时可能遮挡不自然；视觉资产不能单独修复，successor 渲染接口需要工程决定如何提供深度顺序。
- **VERIFIED 架构分歧：** V21 现有坐标绘图是屏幕轴对齐，camera-3-4-v2 是隔离的 2:1 投影研究。相同 64 world-unit 方格在两者上的覆盖方式不同；未确认 successor 生产入口与 renderer 接线前，离线合成不能代表游戏画面。
- **UNKNOWN 验收：** 本次没有进入真实 successor 游戏，也没有实际检查 1280×720 / 390×844 successor 画面、移动触控、游戏内遮挡或 FX 多帧运行。既有 V1/V2 草地合成图有可见重复节奏，继续沿用会带入已知视觉问题。

## 7. 下一批与验收

合同评审的首张候选应放入全新隔离目录，形成一张连续、可读的 SafeCamp 样稿：草地/路径/沙地/岸线过渡、火堆/工作台/储物构成的相邻营地生活区，以及玩家和 Guide 比例参考。样稿只包含检验尺寸、anchor、像素密度、地面接缝与场景比例所需的代表性内容；它既是用户要求的首个完整场景候选，也是冻结评审材料，不扩成整套量产资源组。绘制前须由工程确认样稿所用的合同尺寸，绘制后经目标画面检查并由 owner/协调者记录冻结，才扩展更多地形变化、建筑、道具与动画帧。道路应能说明如何离开与返回，工作区、休息点和 NPC 应形成可读的营地生活核心。所有输出标为 **DRAFT / DEV ART PREVIEW / NOT PRODUCTION**。不用既有 V1/V2 地形候选作为新场景底稿，它们已被检查出明显重复节奏和细节不足。候选只表达当前已有的营地玩法，不表示自由建造、完整 NPC 日程等长期系统已经实现。

审查包含原生 1×、nearest-neighbor 整数放大、边缘/alpha 检查、3×3/6×6 接缝与重复观察，以及人物/建筑/路径在整场景里的比例。场景候选未在真实 successor 的 1280×720 与 390×844 画面核对前，不记为正式美术通过。碰撞/交互 overlay 只作诊断，不能把视觉素材当作 gameplay map。

**当前限制：** successor 实际游戏入口/渲染接线在本仓库未确认；camera-3-4-v2 为独立画面研究。来源不明的脏改动保持未动。本次没有启动浏览器游戏验收、没有运行测试，也没有绘制或覆盖新的候选素材。

## 8. 2026-10-04 当前预览核验补记

- **VERIFIED（现有本地预览页）：** 在 `http://127.0.0.1:8765/prototypes/successor-3-4/index.html` 刷新后，第一次观察到 `successor-renderer.js 404`；核验期间工程侧新增了该文件，再刷新后页面状态变为 “V21 state and systems loaded · Relay blocked · memory save shim active”。404 只记录为一次短暂的并发状态，不是当前状态。
- **VERIFIED（当前源码/状态）：** `prototypes/successor-3-4/preview.js:11,19` 将 WebSocket 替换为本地抛错桩、先后注入 `camera-adapter.js` 与 `successor-renderer.js`，并将存档读写切到内存 shim。页面显示注入成功；这只能证明 guarded V21 state 与 renderer 脚本加载，不证明它是已经接管完整游戏循环的正式 successor。
- **VERIFIED（入口阻断）：** 在隔离页输入临时名称 `Local Preview` 并点击“进入安全营地”后，页面仍停在 V21 游玩表单，没有切入场景；未观察到 Relay 错误状态。`prototypes/successor-3-4/successor-renderer.js:28–29` 会设置本地 started 状态并切换 gate/game 显示状态，但浏览器中的实际表单仍留在前景；根因待工程负责人检查，不能据此推断为正式游戏玩法故障。
- **VERIFIED（旧画面判别）：** 刷新前曾显示另一版 “Projected SafeCamp preview”，与当前磁盘源码不一致；该陈旧页面不作为当前源码验收证据。
- **UNKNOWN（目标尺寸验收）：** 本次没有可用的 viewport 覆写，当前浏览器也没有显示目标 viewport 的精确尺寸；1280×720 与 390×844 successor 场景均未验收。
- **尚待工程处理：** 工程负责人需确认 producer successor 的正式入口/运行循环、合同评审样稿尺寸，并为 1280×720 与 390×844 检查提供实时 arena/backing-size、DPR 和缩放数据。浏览器 viewport 截图方法已于 §15 实际用在 guarded preview，但这还不足以确认正式 successor 的内部画布比例；尺寸确认后先绘制单张连续 SafeCamp 评审样稿供冻结检查，完整资源组仍须等待合同冻结。

## 9. 2026-10-04 后续场景显示复核

- **VERIFIED（当前本地场景）：** 新开同一路径预览后，工程侧更新已让 guarded renderer 自动进入 3/4 SafeCamp。状态栏读数为 `V21 live state · 1100×709 · 480 cells · 20 props · 57 resources · 3 mobs · Relay blocked · real save unchanged=true`；页面本地标记为 `LOCAL PREVIEW · RELAY BLOCKED`。
- **VERIFIED（隔离）：** `successor-renderer.js` 当前会在本地注入时设置 started 状态、隐藏 gate、显示 game，并停用 Relay；浏览器显示了场景，且报告正式 localStorage 未变化。此页仍是 guarded V21 state 的 renderer 预览，不等于正式 successor 已接管完整游戏。
- **DRAFT 视觉评审：** 3/4 构图能读出草地、Y 形回营路、沙岸、海水，火点接近道路交汇；现有角色、资源与小道具比例偏小、材质层次较弱。岸线有明显阶梯重复，草地细节密度过匀，资源/石块/木料散布较杂。新候选应改为有节奏的自然岸线簇、清楚的近火活动区和资源聚落；这些是旧 V21 场景观察，不是候选资产的美术结论。
- **UNKNOWN（目标尺寸）：** 当前 renderer viewport 报告 1100×709。还没有精确设置或验收 1280×720 与 390×844，也未检查目标尺寸下的 UI 安全区、触控、场景遮挡和像素采样。

## 10. 当前 renderer 取图与美术提案的合同差异

- **VERIFIED（地表）：** `terrain-v21.js:12,16,238` 暴露 64 world-unit 的 tile 尺寸与地表 atlas 路径；当前 `prototypes/successor-3-4/successor-renderer.js:22` 从 atlas 按 `64×64` 方形取图，再绘至 `64×32` 菱形。美术提案中的原生 `64×32` 菱形 PNG 与这个现有取图矩形不兼容，工程需选择保留 `64×64→64×32` 的非等比变换，或改为原生菱形取图后再冻结。源 atlas 此前无法由图像查看器解码，不能推断其图面实际规格/质量。
- **VERIFIED（角色）：** 当前 renderer `successor-renderer.js:25` 固定按 `24×32` 切帧，再画为 `28×38`；艺术提案的 `32×48` 角色帧无法直接接入，而且当前目标尺寸是非整数缩放。请冻结帧尺寸、地面脚点、显示倍率与缩放采样规则；不应用拉伸凑尺寸。
- **VERIFIED（怪物/道具）：** 当前怪物帧为 `32×32→38×38`（见 `successor-renderer.js:26`）；道具固定 `48×48` cell 并乘动态 `scale`（见 `:24`）。两者显示倍率也尚无明确整数像素映射合同。
- **REVISE（绘制前置条件）：** 当前代码仅能证明临时预览实现，不代表工程确认的正式接口。建议合同冻结至少明确 source rect、dest/display 尺寸、logical/world anchor、缩放只由整数 nearest-neighbor 完成的规则、透明/地表底板规则及 fallback。差异解决前不输出完整生产兼容资源组；场景候选阶段仅使用合同冻结后确认的原生尺寸。

## 11. 现有 SafeCamp 离线候选复核

- **VERIFIED（文件/视觉）：** `assets/awakening-v1/intake/whole-game-art-candidate-v2/safe-camp-terrain-map-offline-dev-preview.png` 是轴对齐的大块地面拼图：长直中央土路、整齐重复的草簇行、直线沙滩与水面；图中没有建筑、营地道具、玩家或 Guide。分开的 `safe-camp-props-dev-preview.png` 只是一张小道具图集，不能和地面拼图合称完整场景。
- **REVISE / NOT PRODUCTION：** 文件夹 README 和 `docs/handoffs/2026-10-04-safecamp-grass-draft-v2.md` 已将该组标为离线草稿，报告草地 motif 横向重复、细节不足；本次复看维持这一判断。不把它当作新 3/4 SafeCamp 的底稿，保留作 A/B 历史对照，不覆盖或删除。
- **下一候选应补齐：** 冻结合同后在一个连贯 3/4 合成场景中同时表现草地、回营路径、沙地/岸水过渡、相邻营地工作/休息道具、玩家与 Guide；场景构图需支持出发—探索—回营的方向阅读，而非只呈现地面 atlas。

## 12. V21 运行资源的 alpha / anchor / animation 补充

本节区分“当前代码行为”与“生产资产合同”；代码采样点不自动成为新合同。alpha 计数用本地只读 PNG 解码复核，不写入素材；没有源码/资源定义的项目标为 UNKNOWN。

| 类别与路径 | 实际源格 / alpha | 当前锚点与动画 | 缺失 fallback / 处置 |
|---|---|---|---|
| SafeCamp tiles：`assets/art-v21/terrain-v21.png` → `terrain-v21.js:12–16, 180–221` | 320×256、RGB8、5×4 格、每格 64×64，无 alpha 通道；每格原尺寸画入轴对齐 64×64 world rect。地图/碰撞分别为 24×20 数据（见表 §1）。 | 无对象 anchor；以 source cell 左上角对齐 world cell 左上角。水面 tile ID 7/8 每 700 ms 切换一次，不是独立帧表。 | 图片未加载时 `renderTerrainGround()` 返回 false，底层 24×24 程序地面仍可见；**KEEP fallback / REPLACE successor 视觉**。 |
| OUTSIDE 一般地面：`modules/render/base-renderer.js:5` | 无地表 PNG；24×24 `fillRect` biome 格与少量 primitive 点缀。 | world-cell 左上角；无动画帧合同。 | 本身即程序 fallback；**REPAINT** 按 biome 逐区成组替换。 |
| 玩家：`assets/player_sheet.png` → `base-renderer.js:10` | 96×128 RGBA8；4列×4行、24×32；实测 alpha=0 有 7284 px、alpha=70 有 178 px、alpha=255 有 4826 px。半透明像素具体语义（阴影/边缘）未定义。 | 四向四帧；方向由世界速度向量映射。静止 frame 0；本地 `walkClock` 8 tick/s、约 0.5 s/轮；远程 150 ms/frame。通用 `drawSprite()` 用图像中心 X 与 0.76 高度 Y 定位，scale 1.18（名义显示 28.32×37.76 px），不是明示脚点合同。Guide 复用 frame 0。 | 图缺失时没有实体身体 fallback，姓名仍绘制；Guide 文本/框仍存在。**REPLACE**；新资源应独立声明脚点。 |
| SafeCamp props：`assets/camp_props.png` → `base-renderer.js:2,6–7` | 192×96 RGBA8；4×2 格、48×48；实测 alpha=0 有 13,482 px、alpha=66 有 1,271 px、alpha=127 有 2 px、alpha=255 有 3,677 px。需区分软影与边缘 fringe，不能默认全是错误或全部可接受。 | 共用 `drawSprite` 中心/0.76 高度位置；不同 placement 使用 0.90–1.60 等缩放。静态。 | 读取失败无通用 prop 绘制 fallback，可能消失。**REPAINT** 并改成逐项 ground-contact anchor 提案。 |
| 怪物：`assets/monster_sheet.png` → `base-renderer.js:9` | 128×96 RGBA8；4列×3行、32×32；实测仅 alpha 0/255，没有半透明像素。 | watcher/cultist/crawler 三行四帧；约 180 ms/frame，存活时循环；scale 1.2，沿用 0.76 高度位置。 | 无图时 20×20 深色方块。**REPAINT**；保留语义行和战斗 presentation 分离。 |
| 地面资源：`assets/resource_sheet.png` → `base-renderer.js:8` | 128×32 RGBA8；4格、32×32；实测仅 alpha 0/255。木/石/食物/碎片各一格。 | 静态；scale 0.85，共用 0.76 高度位置。 | 无图时 8×8 浅色方块；**REPAINT**，保持物品语义数据驱动。 |
| MIRE MART PNG：`manifest.preview.json` → `awakening-art-assets-v1.js:58–88` | preview entries 为类别/路径/width/height/sourceRect/anchor 明确绑定；地形要求不透明，非地形透明。历史映射审计记载非地形为硬 alpha 边；本轮未重跑审计。正式 `manifest.json` 缺失，不能称生产绑定。 | Terrain anchor `(0,0)`；prop `(0.5,1)`；decal/FX 常用 `(0.5,0.5)`。多帧 FX 按 `frameDurationMs` 取帧，缺省 120 ms。 | 无 PNG 时 terrain 回退 SafeCamp atlas /程序底色，prop/decal/FX 回退 world module 的 fillRect/简单几何。**KEEP preview only / REPAINT / WAIT production**。 |
| 地标、光照、FX：`modules/render/render-v9.js:20–181` 与 `modules/world/awakening-world-v1.js:72–100` | 多为 canvas primitive、gradient、粒子，无 PNG alpha/atlas。MIRE 局部 anomaly/flicker 可走 preview FX binding。 | 由 world placement/canvas 像素坐标绘制，无统一 asset anchor；异常闪烁用时间脉冲，具体 FPS 未定义。 | primitive 即 fallback；部分 MIRE art preview 缺失时回退为细矩形/基本块。**REPAINT presentation**，不得改变碰撞/伤害状态。 |
| 地图与 UI：`ux-cn-v11.js:289–316` 等 | 320×320 地图 canvas、3×3 biome 色块/地点标记；HUD、库存和控件主要是 DOM/CSS，资源图标从 sprite sheet 读图。 | canvas 自有 viewport 坐标；DOM 锚点由 CSS 控制；不是 world-art 动画 atlas。 | UI 由 HTML/CSS/文字维持；图标缺图时部分 glyph/text fallback。待 successor 信息布局确认后 **WAIT**。

**Alpha 空间核对补记：** player 的 alpha=70 像素多数贴着不透明像素边缘，但仍有部分未贴边；camp props 的 alpha=66 像素大多不邻接不透明像素，视觉上可能是柔影区。它们并非自动等同于错误 halo；由于 alpha 意图未在合同中声明，候选重绘前应由艺术负责人判断是保留软影语义还是改为整像素硬簇。其余三张旧 sheet 在实测中只有 0/255 alpha；SafeCamp terrain PNG 为无 alpha 的 RGB。

## 13. 与现存 Awakening V1 素材合同的边界

- **VERIFIED（现存正式项目合同，非本次修改）：** `AWAKENING_ASSET_CONTRACT.md:8–14, 58–64` 规定 V1 地面单元为 64×64 px、nearest-neighbor、基础地表不透明；`110–119` 规定 prop 使用 bottom-center `(0.5,1.0)` 锚点；`158–163` 规定道具/decals/FX 用透明 PNG，禁止由重采样产生的半透明 fringe。`ART_BIBLE.md` B2-A 的 V1 production batch 是草、沙、水、岸边、道路及 tile renderer，角色/大型建筑后置。
- **VERIFIED（场景摆放合同）：** `docs/contracts/SCENE_PLACEMENT_PREVIEW_V1.md:13–26` 以可视 footprint、门向和不拉伸图像作评审，明确画面 PNG 不覆盖或决定碰撞 footprints；这是 MIRE MART 现有 V1 placement 约定。
- **边界决定（草案）：** 上述 V1 合同继续管理当前 `assets/awakening-v1/` 候选和 MIRE MART/north-road 生产接口。新 successor 3/4 方案提出的 64×32 地面菱形、32×48 角色帧等是隔离的 successor art contract 草案；除非工程单独冻结并迁移合同，不得将其写入 V1 production manifest 或覆盖 V1 atlas。
- **范围提醒：** ART_BIBLE 的 B2-A 地面批次不等于用户要求的完整 SafeCamp 合成场景；MIRE MART blocker sheets 也不替代 SafeCamp。首张连续 SafeCamp 合同评审样稿依赖工程先确认样稿尺寸；其后的完整 successor 资源组仍须在独立候选目录扩展，且依赖新的 3/4 尺寸/renderer 合同冻结。

## 14. 工程侧只读审阅后的 successor 合同修订案

**审阅建议（2026-10-04，engineering_contract_review，只读）：** 审核方建议由负责工程 owner 确认 terrain `64×32` / center `(32,16)`、actor `32×48` / bottom-edge `(16,48)`、prop native bounds / `(width/2,height)` 是否适合作为**单张合同评审样稿的有限输入**。这仍是待 owner 接受/修订的建议；尚未核准评审源尺寸、图片坐标锚点或运行时 world/display 映射，不代表 renderer 已实现、owner 签字或完整合同冻结。若负责人接受，候选素材应严格限于一张连续评审场景，不扩展完整资源组。

完整合同结论仍为 **REVISE / NOT FROZEN**。待解事项至少包括 actor/prop world placement 语义、live viewport/internal pixel size/DPR/letterbox/UI safe areas、排序 tie-break 与建筑遮挡带、动画行序及本地/远端节奏、透明菱形角落底板合成、collision 独立映射，以及逐类别 fallback 可观测性。V1 terrain `64×64` 不透明底图合同保持独立，不得将 successor `64×32` 候选接入 V1 atlas/manifest。

**提案口径：** 本节建议角色 placement anchor 为帧图下沿 `(16,48)`、最下方实色鞋底像素在 row 47；道具 placement anchor 为 `(width/2,height)`、最下方接地像素通常在 row `height-1`。这些值待负责工程 owner 确认。早先“先完整冻结、再绘首张场景”的顺序由本节更具体的阶段建议取代：owner 确认有限评审输入后，可做一张评审场景；完成实际目标尺寸与接口核验、再由 owner/主协调者记录完整合同冻结后，才扩完整组。

| 项 | 建议冻结值 | 冻结前工程确认点 |
|---|---|---|
| 世界格与投影 | 保留 `64×64` world-unit cell；四角投影到 `64×32` screen diamond；仅 presentation 转换，地图/碰撞不变。 | 相机方程与逆输入映射保持一致；给投影层提供连续底色，避免菱形透明角露缝。 |
| 地表原生格 | successor-native source rect `64×32`，1× 显示 `64×32`，格心 anchor `(32,16)`；菱形内部为硬边像素，不拉伸 V1 的 64×64 纹理。 | 当前 renderer 从 V21 图集取 `64×64` 再压成 `64×32`，需由工程改为读取 successor-native source rect；V1 的 `64×64` 不透明地表合同维持原样。 |
| 角色帧 | 每帧 `32×48` source。接地点坐标定为下沿中点 `(16,48)`；鞋底/脚尖的最下方不透明像素位于 row 47。四个屏幕朝向行、每向四帧；静止用 frame 0。 | 当前旧提案 `(16,47)` 指鞋底像素行，而 renderer placement anchor 应指图片下沿 `(16,48)`；工程需使用显式 anchor 元数据，不能再用 `.76×height`。 |
| 角色方向/时长 | 行名用屏幕方向，暂定顺序 down / left / right / up；world direction 经相机投影后映射到行。玩家/队友走路每帧 `125 ms`（8 fps）；怪物仍为单独 `180 ms`/帧，后续视动画评审再统一。 | 当前本地玩家 8 fps、远程玩家 150 ms/frame、怪物 180 ms/frame；工程需统一玩家与队友时序、校正投影方向，并报告缺帧 fallback。 |
| 道具与建筑 | 单件使用原生宽高，画面接地点 anchor `(width/2,height)`；逻辑 world placement/sort anchor 另存，碰撞 rectangle 独立。建筑视需求显式提供 rear/front occlusion band。 | 当前 48×48 cell、动态小数 scale、`.76×height` 不满足此接口；工程需支持可变 source rect 和明确层序。 |
| Alpha/地表覆盖 | 地块菱形外缘使用透明像素；禁止平滑抗锯齿/重采样 fringe。菱形外透明区必须由连续 underlay/邻格覆盖；物件可以声明硬边 alpha 或具名软影用途。Alpha 不参与碰撞。 | 工程定义 compositing/underlay 次序并验证无缝；旧 V1 不透明 base terrain 规则不变。 |
| 像素 viewport 候选 | 桌面先评估 `640×360` internal pixels ×2 nearest-neighbor；手机先评估 `390×844` internal pixels ×1，使用更窄的可视 world 区域与独立 UI safe insets。均为 viewport 评审候选，不是已批准 zoom。 | 需要目标 screenshot 标注 CSS viewport、arena rect、DPR、internal resolution、实际 integer scale 与 letterbox/safe area；正式决定由 owner/协调者在画面复核后记录。 |
| 缺图/动画 fallback | 缺资源显示明确 placeholder；动画缺帧回退 frame 0；developer preview 按 terrain/player/prop/mob/resource 显示 load/fallback 状态。 | 当前 badge 有总体 ready 计数但未按图集显示 fallback；工程需补足可观察状态，生产 gate 不得静默接受必需图集缺失。 |

**验收冻结前所需证据：** 工程先确认一组供单张合同评审样稿使用的尺寸与 anchor。随后用一张完整连续 SafeCamp DRAFT 画面同时含草地、路、沙滩/水、相邻营地道具、玩家和 Guide；只绘制用于比例、脚点、接缝及遮挡评审的代表性资源，并标注 native source rect、anchor 和 1×/integer-preview。该样稿不授权扩展整套资源组。其后以真实 successor 的 1280×720 与 390×844 画面检查接缝、人物朝向、脚点、遮挡、UI/触控安全区、scale 与 fallback。只有工程确认、目标画面证据及 owner/协调者的冻结记录齐备后，才标为 **FROZEN** 并批量扩画；此前保持 **PROPOSAL / NOT FROZEN**。

## 15. 历史双 viewport guarded successor 画面复核（不是本候选验收）

本节记录此前对 guarded renderer 外层浏览器 viewport 的历史截图。其目标尺寸截图并未加载本 SafeCamp art candidate，也不替代 §16 的当前候选状态或证明 resize 后 arena/backing-size 的真实值。

- **VERIFIED（浏览器截图尺寸）：** 2026-10-04 在本地 Edge 新建隔离预览标签，对 `http://127.0.0.1:8765/prototypes/successor-3-4/index.html` 分别设置 1280×720、390×844 viewport 并读取截图。通过截图文件头确认图像恰为 1280×720 和 390×844；完成后已重置临时 viewport。屏幕上明确显示 `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`，预览使用 V21 live state、Relay blocked、memory save shim。这里验证的是 guarded renderer 预览的 viewport 呈现，不等于 successor 已接替正式游戏。
- **REVISE（1280×720 目视）：** 可辨认草坪、交叉营地路、沙岸/水线、营地物件与玩家；玩家相对地面格和营地道具仍偏小，草面 motif 与岸线阶梯的重复明显。顶部 developer badge 压住/挤窄 HUD 状态行。样貌沿用旧 V21 sheet，未包含本提案的新绘素材。
- **REVISE（390×844 目视）：** SafeCamp、路径、岸线和主要控件都在画面内，但顶部 developer badge 与状态信息在窄屏挤成一条密集区；任务卡、场景交互提示、摇杆、底部物品栏与操作说明争抢空间，摇杆盖住底部提示区域。尚未按正式 safe inset / 触控区合同验收。
- **VERIFIED（尺寸计算源码）：** `successor-renderer.js:17,19,40` 的 `resize()` 用 `.arena-wrap.getBoundingClientRect()` 读容器，DPR 上限为 2，按容器尺寸乘 DPR 设置 canvas backing size，CSS 像素坐标仍按 `clientWidth/clientHeight` 投影，关闭 image smoothing；`successor-ready` 只在安装时发一次 viewport 字符串。故 viewport 改变后 canvas 会走 ResizeObserver 重算，但外围 banner 仍可能保留启动时的 `1100×709`。这解释了状态读数过期的可能机制，不证明本轮变更后 arena 的实时矩形、实际 DPR 或 letterbox 值。
- **范围与未知：** 浏览器截图本身已证实为目标 viewport 尺寸，但没有读到目标尺寸下的 live arena rect/backing size、实际 DPR、内部像素缩放或 letterbox；外围 banner 的 `1100×709` 不是 resize 后的权威读数。因此不把本次截图当作 production successor 的最终双尺寸验收，也不据此冻结 viewport、UI 或 art contract。工程需提供可观测的实时 arena/backing-size 信息；艺术方向及合同继续 **REVISE / NOT FROZEN**。

## 16. 本轮只读 successor / SafeCamp 画面与资产比例复核

- **VERIFIED（隔离浏览器预览）：** 2026-10-04 在 Edge 新建独立标签打开 guarded `prototypes/successor-3-4/index.html`，没有使用 HOME / MIRE MART / LOOT / FIGHT QA 按钮、摇杆或互动输入。AX 状态显示 `LOCAL V21 HOME / SAFE CAMP`、玩家 `(2400,2470)`、arena `1100×709`，开发标记为 `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`，Relay blocked、memory save shim、`real save unchanged=true`。五组图像均显示已加载：terrain `320×256 HTTP 200`、player `96×128`、props `192×96`、resources `128×32`、monsters `128×96`。这是当前隔离预览的只读证据，不是 production successor 验收。
- **VERIFIED（运行时接图尺寸与呈现）：** `prototypes/successor-3-4/successor-renderer.js:26–27` 按 `.arena-wrap` client rect 和 DPR 上限 2 调整 canvas backing store，关闭 smoothing；:31 将 V21 atlas 的 `64×64` source cells 裁切绘入 `64×32` 菱形；:34 按 `48×48` prop cell 和 V21 传入 scale 绘制，并以 `.76×height` 定位；:35 把 `24×32` actor cell 绘为 `28×38`，无单独脚点元数据；:37 把 `32×32` resource cell 绘为 `28×28`；:38 依 world `x+y` 排序场景对象。该接口与本候选的 `32×48` actor frames、逐项 native-bounds prop sprites 不兼容，需要工程改接前不得将候选导入 renderer。
- **VERIFIED（当下屏幕观感 / REVISE）：** 1100×709 只读截图中 SafeCamp 菱形地表、营地交叉路、沙水边、帐篷、营火、玩家、掉落物和 HUD 均实际可见；地面纹理颗粒密、草面 motifs 重复，岸边按整齐菱形格形成阶梯，人物与大量场景/HUD 相比偏小。该实景观察加强“先统一 source/display 比例、再扩图”的优先级，不证明改绘候选会自动修复 renderer 层级或 HUD。
- **对 DRAFT 的评审后续：** 新稿 footer 把仍待工程 owner 确认的 64×32 菱形、32×48 actor/foot anchor 与 prop foot anchor 提案列出，但整个 960×600 场景仍是离线布局研究；它没有由当前 live renderer 截取，也未在 renderer 里读入，节点位置只是按提案投影人工复现，不代表 successor placement 已落实。
- **尚未验证：** 本轮只读预览为 1100×709，不是 1280×720 或 390×844。当前候选没有接入真实 successor 双 viewport；DPR、内部 pixel scale、letterbox 与 safe-area 在目标画幅中的实际值也未取得。本节不能作为正式 art acceptance 或全合同冻结依据。

## 17. 给主协调者 / 工程负责人的最小接口决议表

本表把离线评审素材与当前 successor renderer 的差异转换为可签决字段。只读审核方的建议尚未成为负责工程 owner 的 source rect/图片 anchor 确认，也不自动产生 runtime 映射；所有决定都应记录 owner、数值、证据和是否适用于评审、production 或两者。

| 决议字段 | 本候选 / 源侧事实 | 当前 successor 读取方式 | 工程需记录的决定与证据 |
|---|---|---|---|
| SafeCamp 地面 source rect 与绘制 | 审核方建议评审菱形 source `64×32`、center `(32,16)`；本张场景地表是连续手绘复合，不是地块图集。 | 从 V21 `64×64` 方格裁切，绘制到 `64×32` 菱形；V21 terrain map 与 collision map 独立。 | 负责工程 owner 确认/修订候选 source 与绘制尺寸；透明角如何由 underlay/邻块覆盖；不得由美术 alpha 定 collision。附场景接缝画面。 |
| Actor source rect / 地面 anchor / display rect | 审核方建议人物 frame `32×48`，图片下沿中心 `(16,48)`，鞋底实色最末行 47；owner 确认待定。 | 旧 V21 `24×32` frame 绘成 `28×38`，放置相对点为 `p.y-38`；无显式 anchor 元数据。 | owner 确认/修订新 frame dest rect、world position 对应 feet/collision center 哪个点、整数像素倍率和本地/远程一致节奏。附脚点压在地面格心的 live 双 viewport。 |
| Prop 原生边界 / 接地 anchor / 遮挡 | 审核方建议道具各自定界，图片下沿中点 `(w/2,h)`；碰撞明确独立；owner 确认待定。 | 统一 `48×48` cell，按 V21 prop placement scale 绘图，用 `.76×height` 定垂直位置；world `x+y` 排序。 | 是否支持 native source rect 和 bottom-center anchor；world sort anchor 与 source anchor 如何对应；建筑 rear/front occlusion band；附人物绕行建筑前后的 live 截图。 |
| Resource source 与节点位置 | 本场景 13 个采集点是脚本里的 inline composition markers，不是可接入 PNG，也不声明新 resource atlas。 | `32×32` cell 绘到 `28×28`；实际拾取范围/类型由 V21资源数据决定。 | 本张稿只核构图；正式资源源格/绘制 anchor/显示尺寸另行确认。不得从当前 inline markers 导出生产拾取图。 |
| Viewport / pixel scale / safe area | 本轮 live screenshot arena `1100×709`；候选原生 review board `960×632`，内含 960×600 场景和 32 px 注释栏。 | 当前 `resize()` 以 arena client rect × DPR（上限 2）设 backing size，CSS 绘制坐标仍使用 client 尺寸；关闭 smoothing。 | 在 1280×720 和 390×844 各记录 viewport、arena rect、DPR、backing size、实际整数倍率/留边和 UI safe area；拒绝把 1100×709 badge 当目标尺寸证据。 |
| 排序 / 合成 / fallback | 角色与道具 source anchor 是审核建议、待 owner 决定；候选是无透明缝的完整合成图，不验证 tile 邻接或层序。 | 场景实体先按 world `x+y` 排序；asset load 状态有类别维度，当前五张均实际加载。 | 确认 stable tie-break、建筑遮挡、透明菱形 underlay 和失败图可见占位；两种 viewport 下分别截图验证遮挡与 load/fallback。 |

**解除扩画 gate：** 负责工程 owner 先接受/修订 source-size 与 anchor 建议；上表的 display/world 映射、viewport、排序/遮挡、合成和 fallback 均有具名工程 owner 与可观察决定；这张 SafeCamp 连续稿在真实 successor 的 1280×720、390×844 画面逐项复核；主协调者记录完整 art contract 为 FROZEN。此前只继续改这张审阅板，不批量扩完整资源组或写入 manifest。

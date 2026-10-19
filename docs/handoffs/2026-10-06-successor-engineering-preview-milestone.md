# 3/4 successor 工程预览里程碑 — 2026-10-06

**主责：** Rendering & Camera / Integration & QA
**状态：** guarded preview 机械接入已复核；视觉 **REVISE**；持续移动、窄屏复测和实体手机均未验收。

## 工程快照与范围

- 仓库：`C:\Users\MECH\Documents\ChatGPT\游戏编程\abyssal-wake-integration`
- 分支 / HEAD：`fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- 工作树在复核前后均有 107 个 porcelain 项，包含大量已修改与未跟踪文件，来源未知；本次没有覆盖、清理或归属这些改动。
- 本次未修改 runtime、test、ART_BIBLE、候选素材、manifest、存档或 Relay 合同。只增加本 handoff。对美术负责人发送了候选接口审阅反馈。

## 浏览器与真实 V21 状态证据

- **CONFIRMED guarded route：** `http://127.0.0.1:8765/prototypes/successor-3-4/index.html?review=1`。外层标为 `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`，iframe 中显示真实 V21 SafeCamp HUD/状态，内层标为 `LOCAL PREVIEW · RELAY BLOCKED` 并显示 memory save shim。V21 loader 入口仍为 `survival-v21.html`；guard preview 在模块完成后注入 successor 相机适配与 renderer。
- **CONFIRMED 中间视口观察：** 首次复核时 Codex IAB 面板为 `484×439` arena，非目标尺寸；之后通过浏览器 viewport override 在同一 guarded route 完成以下两次目标尺寸截图。
- **CONFIRMED 1280×720 capture：** outer viewport `1280×720`，browser DPR 约 `1`；V21 arena/canvas 为 `1100×589 CSS px`，backing `1100×589`。地形、玩家、Guide、props、resources 和 mobs 均可见，地表/岸线重复明显、场景物件稀疏，**REVISE**。这次 backing 与 10 月 5 日旧记录的 `1881×1008` 不同，原因是 browser context/DPR 不同；不可把任一 backing 比例提升为 production DPR 合同。
- **CONFIRMED 390×844 capture：** outer viewport `390×844`，browser DPR 约 `1`；V21 arena/canvas `390×713 CSS px`，backing `390×713`，canvas 从 iframe 内 y≈102px 开始。`displayScale=2` 的当前实现把角色和营地物件放得过大，草地/岸线仍重复，HUD 与触控按钮叠在场景上；**REVISE**。这是桌面浏览器尺寸模拟，不是实体手机或真实触摸。
- **CONFIRMED 390 DOM rectangles（iframe CSS px）：** task card `{x:8,y:148,w:150,h:66}`；survivor card `{x:252,y:148,w:130,h:36}`；interaction prompt `{x:134,y:598,w:123,h:27}`；Interact `{x:253,y:670,w:58,h:58}`；Dash `{x:253,y:735,w:58,h:58}`；Attack `{x:318,y:670,w:58,h:123}`；Chat `{x:12,y:539,w:48,h:34}`；Inventory `{x:268,y:539,w:54,h:34}`；Map `{x:330,y:539,w:48,h:34}`。面板与控件都覆盖 world arena；实体设备 cutout/home-indicator safe-area 仍 UNKNOWN。
- 两张截图均显示资产诊断 `terrain 320×256 HTTP 200`、`player 96×128`、`props 192×96`、`resources 128×32`、`monsters 128×96`。active draw calls 的 per-family source→CSS 尺寸见下节。截图在 Codex browser 观察结果中可回看，浏览器 API 不提供本次将截图 bytes 写成 workspace 文件的接口，因此无 PNG 文件路径可链接。
- **CONFIRMED preview guards：** 同次只读浏览器诊断显示 `realStorageUnchanged=true`，`memoryWrites=1`；iframe 页面标记 `LOCAL PREVIEW · RELAY BLOCKED` 与 memory save shim。未观察到真实玩家存档变动；没有 packet capture，因此公网网络排除仅依据 guard/source/test，不作为抓包结论。
- **SUSPECTED / 未复现为移动：** 单次及十次快速 `ArrowUp` 脉冲后，交互提示和地标未出现可确认变化；模拟饱食值由 100 降至 97，证明模拟持续更新，但不能证明按键被消费或位置变化。**浏览器持续移动与碰撞边界手感仍 UNKNOWN**；八方向通过的是 VM/fixture。

## Source-to-display 与候选素材

- 当前 `camera-adapter.js` 提供数学投影、屏幕方向到世界输入逆映射、foot-depth 与 viewport scale/backing helper；它没有通用的资产 source-cell → display-size adapter。
- 当前 `successor-renderer.js` 的运行配置包括：64×64 world cell 显示为 64×32 CSS diamond；player 24×32 source crop → 28×38 CSS；mob 32×32 → 38×38 CSS；resource 32×32 → 28×28 CSS；prop 48×48 crop 按 placement scale 显示并使用启发式垂直偏移。小于 480 CSS px arena 时请求 2× displayScale，backing scaling 单独处理。这些是当前旧资源的实现参数，不是认可的 production mapping。
- **CONFIRMED candidate review（只读）：** `assets/art-candidates/safecamp-tier-a-review-board-v1/reviews/revise-pass-7/` 的 README 标记 DRAFT / NOT PRODUCTION；源研究包括 80×40 terrain cells 和 40×60 单帧角色参考。README 明确动画表只是后续假设，未集成 runtime。Rev7 画面加入低对比草地块和木堆，构图层次增加，但中心草地仍空、草地形状偏角、tile motifs 需变化、runtime camera crop 未验，仍 **REVISE**。
- 80×40 及中心 `(40,20)` 只可作为离线 composition/sample 输入。不要由此冻结 atlas 步距、世界格、CSS 显示尺寸、zoom、DPR、像素密度或 production sprite 家族。
- 已向美术负责人说明：Asset Pipeline 负责 asset ID/source path+hash/sourceRect/native dimensions/alpha/trim/padding/frame metadata；Rendering & Camera 负责 projection、anchor 到投影地面接触点的定位、source→CSS/display、zoom/backing pixel 规则与遮挡排序；Animation & Presentation 消费帧/clip 语义但不定义玩法权威；World & Terrain / HOME & Building 分别拥有地形与建筑逻辑 footprint/collision。锚点坐标参考系、trim/padding 恢复规则、方向/帧布局仍需 Asset Pipeline 与 Animation 确认；建筑 occlusion bounds 属视觉输入，collider 仍是独立世界数据。

## 定向回归

本轮按单进程串行运行，**6/6 PASS**：

- `successor-camera-adapter-v1.test.mjs` — 八方向逆投影、V21 向量归一、碰撞后屏幕方向回算、稳定 foot-depth tie。
- `successor-live-screen-movement-v1.test.mjs` — V21 simulation-update + terrain + world-spatial fixture 八方向。
- `successor-preview-live-gate-v1.test.mjs` — memory storage、Relay 与 QA shortcut guard 源契约。
- `successor-live-candidate-v1.test.mjs` — live candidate 维持 V21 save/Relay owner。
- `terrain-v21.test.mjs` — 64-unit terrain、独立 collision 与阻挡测试。
- `successor-camp-guide-render-v1.test.mjs` — Guide 使用 SafeCamp snapshot 并绘制为 depth-sorted actor。

`node --check` 对相机适配、successor renderer、preview entry 通过；对应文件的 `git diff --check` 无输出。上述自动检查不证明视觉、真实浏览器持续移动或设备输入通过。

## 未通过门槛与下一步

- 本轮已补齐同一 guarded build 的 1280×720 与 390×844 画面。可回看截图仍在任务浏览器观察记录中，没有 repo PNG 文件路径；若交接需要独立文件归档，需使用获准的 screenshot-export 路径而不改 production/art 目录。
- 物理手机 DPR/触摸、safe-area 精确重叠、真实像素原图与游戏输出并排对照、强制缺图 fallback、角色/建筑多位置遮挡、碰撞边缘手感、持续八方向移动、真实 Relay 与双客户端均 **UNKNOWN**。
- **建议下一步：**用能固定 viewport 且可保存截图的浏览器 QA 环境，在同一 guarded build 补齐 1280×720 和 390×844 可回看原图及 arena/backing/safe-area/world-coverage 诊断；同时用可控持续输入验证方向、碰撞边界与物件遮挡。然后让 Asset Pipeline、Rendering 与 World/HOME 对一个候选资源 family 的字段/显示映射做签核，再考虑任何 runtime 集成。

未提出任何 V21 文件退役或删除列表。V21 继续作为兼容与玩法基线；本里程碑不代表接管正式入口，也不代表完整游戏画质翻新完成。

# Movement & Locomotion — 独立模块任务卡 V2

**状态：DRAFT / PLANNED successor owner；V21 移动仍由主循环直接实现**  
**唯一主责：Movement & Locomotion**  
**目标体验：**3/4 斜俯视下，方向直觉明确、起停响应清楚、移动有重量感且角色与路径容易阅读。移动需要支持 HOME 生活、探索、战斗走位与回程，不造成坐标/碰撞/攻击规则漂移。

## 五款参考游戏的原创移动体验转译

| 参考游戏 | 借鉴的移动体验 | 在本作中的观察标准 | 不照搬 |
|---|---|---|---|
| Crashlands | 操作响应直接；动作与结果容易理解。 | 按下/松开方向、开始移动/停步的反馈清楚，不因表现延迟让玩家以为输入没生效。 | 不复制具体加速曲线、攻击位移或角色动作。 |
| Terraria | 移动与探索、装备/区域挑战配合。 | 地点入口和障碍边界可读；移动不能绕过 POI/区域合法空间。 | 不复制平台跳跃、冲刺或区域解锁规则。 |
| Minecraft | 玩家在家园中能准确靠近、绕行并表达建造布局。 | HOME 小路、工作台、门口和交互距离能靠方向与脚点判断。 | 不复制方块网格、碰撞尺寸或移动公式。 |
| Don't Starve Together | 野外站位与危险范围需要玩家有意识控制。 | 怪物接近、碰撞、攻击距离和安全区边界可预测；不隐藏减速或碰撞惩罚。 | 不复制风筝速度、角色移速差异或战斗规则。 |
| Stardew Valley | 日常移动平稳，回家做事不应令人疲劳。 | HOME 走动、转身、停步和反复交互舒适；长时间移动不残留输入。 | 不复制网格节拍、工具动作锁或时间规则。 |

只借鉴玩家感受。实测要覆盖“准备→出门→绕障碍/战斗→返家”，不能只用直线速度测试替代手感验收。

## 当前实现事实：谁在运行时移动玩家

以下是当前工作区源码观察；V21 仍是兼容基线，successor 预览通过 iframe 复用 V21 模拟，不代表新 Movement service 已上线。

- `survival-v21.html` 在 `modules/input/joystick.js` 后加载 `modules/main-loop/simulation-update.js`。主循环从 `joystickState` 读向量，按 Safe Camp/野外/冲刺状态计算速度，直接更新并夹紧 `me.x/y`，同时写入 `me.dir`、`isMoving`、`walkClock`、出入营状态并触发 Zone 切换。这是当前 V21 玩家位置写入/移动规则的实际来源，不要误把 `smooth-motion-v18.js` 叫成移动状态 owner。
- V21 输入：`joystick.js` 独立拥有触控摇杆指针；`platform-inventory-v19.js` 管桌面 WASD/方向键并写入同一 `joystickState`。平台模块还在面板打开、输入焦点转入文字框和 window blur 时清除按键/移动；具体边界应按实现任务再核对。
- 碰撞后处理：`terrain-v21.js` 与 `modules/world/awakening-world-v1.js` 在后续 loader 阶段包装移动/发送路径，处理地形和 POI 几何后才发送既有位置状态。World & Terrain 持有合法坐标/碰撞语义；POI 提供自己的 authored collision；两者不能让美术像素决定可走空间。
- `modules/main-loop/smooth-motion-v18.js` 管 RAF 时序、single-clock 与其他玩家 snapshot 插值，本地玩家仍使用 client prediction；它会包裹最终 update/draw，但基础本地移动计算来自 simulation。当前 Relay 没有 server movement ack/reconciliation；这不等于位置可防作弊或服务端权威。
- 3/4 `prototypes/successor-3-4/camera-adapter.js` 把屏幕方向映射回 V21 世界向量；`successor-renderer.js` 临时提供映射后的 intent，调用 V21 canonical frame，再恢复输入，并量测碰撞后的投影位移。它是 guarded preview adapter，不是正式 renderer/移动系统。
- 适配器将世界单位投影的水平/垂直缩放差异补偿为近似各向同性的屏幕速度，当前向量还除以 `√8`；这是现有数学测试认可的设计，结果比 V21 视角下的原始表观速度低约 `√8`。需要真实试玩决定是否舒服；这是 **FEEL QUESTION / NOT A CONFIRMED BUG**。

因此：**未来语义 owner 是 Movement & Locomotion；当前实际位置写入者是 Simulation Update；输入、World/POI 碰撞、Smooth Motion、Renderer/Camera 分散合作。** 此职责图不授权直接合并为新系统，也不证明真实设备操作已通过。

## 未来模块边界与建议数据流

```text
Keyboard / Touch / Controller
    → Input & Accessibility：归一化设备意图，每次只发一个方向/动作
    → Rendering & Camera adapter：按 3/4 镜头把屏幕方向映射到世界方向
    → Movement & Locomotion：速度/加减速/停步/移动模式/面向规则，输出位移请求
    → World & Terrain：检查规范世界坐标和地形碰撞
    → POI & Exploration：参与其自有 authored 几何/场景约束
    → Movement/Character 状态消费合法结果；Network 只用已批准快照传输
    → Animation / Audio / UI 表现确认状态
```

图示是 **PROPOSED boundary**，不是当前函数/API 或授权改动。未来要定义 collision resolvers 谁能拒绝/修正位移、移动状态 owner 与采样时点，再处理 V21 物理拆分。

| 相邻 owner | 拥有的事实 | 移动模块不能越界 |
|---|---|---|
| Input & Accessibility | 键盘/触控/手柄映射、归一化 intent、指针生命周期 | 不放设备监听或重复绑定到 Movement。 |
| Rendering & Camera | 投影、视口和 screen↔world input adaptation | 不让 renderer 直接当位置/碰撞 authority。 |
| World & Terrain | canonical coordinates、边界、地形碰撞与空间查询 | Movement 不绕开 resolver 改坐标或用贴图颜色推碰撞。 |
| POI & Exploration | POI 身份、位置与局部 authored 几何 | 不把 POI interaction prompt 当作碰撞事实。 |
| Character & Progression | 经过批准的速度属性/能力 modifier | 不私自读 inventory 来造职业属性。 |
| Combat & Weapons / Creatures & AI | 攻击范围、击退/移动 intent 请求、怪物位移规则与结果 | 冲刺表现不暗改攻击、伤害、命中、HP 或敌人 AI。 |
| Network & Co-op | 既有 movement snapshot transport/sync contract | 不新增字段、改变频率或假设 server reconciliation。 |
| Animation & Presentation / Audio & Feel | 移动状态的画面、音效、振动反馈 | 不让脚步/动画帧推动实体或决定速度。 |
| Core State & Save | 已批准的持久化状态和迁移 | 移动任务不私写 save key/schema 或保存渲染坐标。 |

## 当前回归证据与未覆盖处

本轮重跑的本地测试均通过：

- `successor-camera-adapter-v1.test.mjs`：八方向投影、速度归一化、碰撞位移的 screen/world round-trip 等数学/源码断言。
- `successor-live-screen-movement-v1.test.mjs`：八方向通过 V21 update/terrain/world wrappers；测试点是营地空地，非障碍穿越。
- `successor-natural-route-v1.test.mjs`：North route zone transition 和 POI collision 逻辑 fixture。
- `terrain-v21.test.mjs`：地形边界与冲刺穿水 tunneling fixture。
- `platform-inventory-v19.test.mjs`：桌面方向输入、菜单/打字隔离及平台控制源级回归。
- `playable-slice-smoothness-v1.test.mjs` 与 `motion-v18.test.mjs`：帧率/调度/移动预测和远端 snapshot 插值 fixture。
- `network-disconnect-simulation-pause.test.mjs`：断线暂停移动/存档，恢复连接后继续的 fixture。

这些不证明实体手机手感、真实障碍路线的 successor 输入、长时间摇杆拖动、不同 DPR 角色脚点清晰度、服务器权威或完整 HOME→POI→战斗→返家体验。没有当前复现证据时不标 Bug；发现新问题先加失败回归再最小修复。

## 高画质像素角色与动作验收

- 角色 movement sprite、朝向和动作要用原创 **Modern High-Detail Pixel Art**：脚点/轮廓清楚、像素簇有意组织，动作阶段读得懂；不能因 3/4 投影、容器缩放、插值或最近邻取样失败而糊成粗马赛克。
- 不假定旧 sprite sheet 的尺寸、动画行、foot anchor 或帧时长适用于 successor。先核 `ART_BIBLE.md`、正式 manifest、当前 Renderer/Asset metadata 和真实 actor display scale；Movement 只消费方向/状态，不维护帧资产。
- 在实际 `1280×720` 与 `390×844` successor gameplay 查看方向/动画与脚点；要求键盘/触控方向一致、停止及时、无留键、障碍前不穿透、移动中 interaction/combat range 正确，角色不被 UI 遮挡。记录 browser、canvas、DPR 与运行证据；手机模拟不能冒充实体手机。
- 当前 3/4 画面总体已记录 **REVISE**（粗糙/重复地面、小角色、移动视口 UI 拥挤）。该状态适用于 scene acceptance，不能据此把 Movement logic 判为错，也不能把静态清晰源图当作通过。

## 单任务路线与可复制目标

推荐实施前顺序：`MOVE-0`只读画出当前运行链与状态写入矩阵 → `MOVE-1`选一个可复现方向/停止/碰撞问题 → 形成目标和相邻输入/战斗回归 → 用户选择后才进一文件级修复。移动手感新规则（加速度、惯性、dash 改动、攻击中移动限制）必须先作为可审阅 DRAFT 给用户，不与 bug fix 偷偷混做。

```text
本次只负责 ABYSSAL WAKE 的 Movement & Locomotion。先读 AGENTS.md、Skill、PROJECT_CHARTER.md、PROJECT_STATE.md、SUCCESSOR_MODULE_MAP.md、本 V2 卡、MODULE_MAP.md、相机/地形/战斗合同和定向测试；核对 branch/HEAD/dirty files、V21 loader 与实际 successor 入口。保护并行修改。

唯一目标：【填写一个用户已选定的可复现移动 Bug，或一个已批准的小手感调整】。先在相同条件复现并证明玩家影响；画出 V21 当前 `joystickState → simulation-update → terrain/POI wrappers → sync → smooth-motion` 路径及 successor adapter，再选一位主责 owner、精确允许文件、目标回归和一个相邻回归。未来模块边界是规划，不代表已有 Movement API。

Input 归一化意图；Camera 做投影适配；Movement 决定响应/方向状态；World & Terrain / POI resolver 决定合法空间；Animation/Audio/UI 只表现确认状态；Network 保持既有 snapshot。不要改攻击/伤害/距离、Relay payload/频率、save、renderer asset contract 或角色 art，除非明确拆成独立任务。

先让新增回归在旧实现失败，再做最小可回退修复；串行跑目标、碰撞、输入、combat 邻接回归，检查完整 diff。意外回归先停止定位，不继续扩大重构。未经用户选择不改物理规则/手感。不要删除/覆盖未知文件，不提交、合并或部署。

可见角色/相机变化必须对照原生高细节像素素材，在真实 1280×720 与 390×844 successor 画面查看；报告投影速度、DPR、脚点、输入路径和浏览器。没有实际画面/实体设备验证就标 UNKNOWN；当前场景为 REVISE。最后用简单中文讲玩家影响、具体证据、修复后可能连带影响、测试结果与未验证项。
```

## 验收标准

1. 玩家按屏幕方向输入后，投影移动方向正确且八方向速度达到已批准的体感范围。
2. 松开输入、pointer cancel/lost capture、blur、打开菜单/打字焦点、断线/恢复都不会残留移动。
3. 地形边界/水体/POI 门口与道具交互的角色脚点位置稳定，不 tunneling、穿墙或坐标跳跃。
4. 移动表现不会改变 combat hit/range、攻击时序、敌方 authority、网络消息或持久化。
5. 高细节像素角色在两种目标 viewport 清晰且动画/脚点可读；没有证据标 UNKNOWN / REVISE。
6. 每项实际 bug 有复现测试；修复后目标与相邻回归通过，并保留未测的真实手机/多人条件。

本卡是模块合同草案，不新增移动 API、物理曲线、dash 规则、资产、动画帧、网络字段或角色属性。

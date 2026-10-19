# Movement & Locomotion — 独立模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED as a separated successor movement service**  
**唯一主责：Movement & Locomotion**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

## 玩家目标

角色移动要灵敏、顺滑、方向直觉清楚，斜俯视下不让玩家因镜头映射而走错方向。冲刺、停步、转向和受击位移要容易读懂，不能让手感调整暗改碰撞或战斗距离。

## 唯一职责与边界

拥有玩家移动意图到 locomotion state 的规则：速度/加减速/停止、方向状态、移动模式和移动状态输出。**Input & Accessibility** 只归一化设备输入；**World & Terrain** 拥有 canonical world coordinates、碰撞与空间查询；**Character & Progression** 提供属性/装备/解锁形成的 movement modifiers；**Network & Co-op** 只传输现有批准的 movement snapshots；**Animation & Presentation** 消费移动状态表现；**Audio & Feel** 提供脚步与震动反馈。

不拥有设备绑定、世界碰撞、相机投影、角色成长数据、攻击/闪避判定、HP、Relay、save schema、动画帧或 HUD。斜俯镜头的逆向键位映射是 Rendering/Input 协作合同，移动模块只接收规范化的世界方向意图。

## 接口草案

`MovementIntent(direction, mode, dt)` + 只读 Character profile → `MovementState(position request, velocity, facing, locomotionState)`；World 查询/结算合法位置并返回结果。position authority 和现有 V21 行为必须先查清。以上为未来 seam，不是当前已存在 API。

## 源码核对提示

实现前从当前 V17 实际首页路径和 V21 loader 分别跟踪玩家移动更新、joystick/键盘绑定、collision wrapper、smoothing wrapper、网络位置同步和动画消费者。建议搜索 `game-play.js`、`modules/input/joystick.js`、`modules/main-loop/simulation-update.js`、`modules/world/world-state.js` 与 `modules/main-loop/smooth-motion-v18.js`；这些是检查入口提示，不预先断定每个文件拥有最终移动规则。

## 验收

- 方向/镜头逆映射正确；键盘、手柄、触控走同一规则；输入停止、焦点丢失、菜单打开、掉线/重连不会残留按住状态。
- 斜坡/障碍/安全区/POI 边界中无穿墙或坐标跳变；移动中采集、攻击和敌人接触距离不被表现层改写。
- 确认 change 未改变既有 movement/network payload 和同步频率；若真要改变协议，拆出单独目标。
- 检查 1280×720 与 390×844 真实画面中的角色脚点、转向、移动动画、DPR、拖影/模糊及触控反馈。画面糊、缩放成粗马赛克或方向不易辨认就 REVISE；没实测写 UNKNOWN。
- 跑 movement、collision、combat-range、input single-trigger、disconnect/resume 与视觉 adapter 回归；Node fixture 不等于真机手感验收。

## 派工模板

一次只选一个问题（如停止残速、斜俯方向映射或冲刺启动）。写明当前 V17/V21 分别行为、唯一 owner、允许文件、接口不变量、至少一项核心+一项相邻回归、两个 viewport/设备证据、回滚办法与 UNKNOWN。

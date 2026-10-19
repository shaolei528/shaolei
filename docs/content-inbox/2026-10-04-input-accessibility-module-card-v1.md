# Input & Accessibility — 独立模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED as a unified successor intent layer**  
**唯一主责：Input & Accessibility**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

## 玩家目标

键盘、手柄和触屏都能稳定移动、战斗、交互；提示说明可操作内容，输入响应快且可配置，必要的信息不只依赖颜色、声音或精细触控。

## 唯一职责与边界

拥有设备采样、映射、重绑/无障碍输入设置和标准化 intent；同一真实动作应生成一个 intent。**UI & Map** 展示按钮和提示；Combat、Interaction、HOME 等领域 owner 验证并结算；**Rendering & Camera** 提供 inverse projection；Network 管获批传输。

本模块不做碰撞/移动权威、攻击判定、交互范围、背包变更、任务规则或 Relay 协议。

## 验收

- 键盘按住/松开、焦点丢失、手柄断开、触控拖动/多指、按钮重叠、重复绑定和移动+攻击同时输入均有测试。
- 镜头方向映射正反一致；resize/旋转屏幕后输入仍对准目标；Safe Camp guard 和 dialog/menu capture 不失效。
- 低动作精度、可重绑定/替代输入及状态提示纳入审查；实机手机单独做触控检查。
- 单动作不得由旧 handler 和新 handler 双执行；回归移动、战斗、采集和 UI 打开/关闭。

## 派工模板

一次只处理一个设备或一类映射。列出意图形状、领域消费者、允许文件、双触发回归、目标设备及未验证项；不改领域规则来绕过输入 bug。

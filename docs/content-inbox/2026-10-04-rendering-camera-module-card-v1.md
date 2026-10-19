# Rendering & Camera — 独立模块卡 V1

> **历史卡片：**本卡已由 [`Rendering & Camera V2`](2026-10-05-rendering-camera-module-card-v2.md) 取代，不再是 canonical 任务路由。保留原文供历史参考；后续派工请使用 V2 和 [`SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)。

**状态：DRAFT / NOT IMPLEMENTED as a separated successor renderer**  
**唯一主责：Rendering & Camera**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)  
**工程任务参考：**[`2026-10-04-successor-renderer-modularization-task-v1.md`](2026-10-04-successor-renderer-modularization-task-v1.md)

## 玩家目标

把现代海岸 HOME 和危险 POI 呈现成统一、清楚、有沉浸感的 3/4 世界；角色、道路、敌人、资源和交互物一眼可辨，显示清晰细致而非糊或粗马赛克。

## 唯一职责与边界

拥有世界→屏幕 projection、viewport/canvas 尺寸、深度键、场景图层和 draw lifecycle。**Asset Pipeline** 交付通过合同的素材；**Animation & Presentation** 提供已确认事件的视觉状态/FX；**World & Terrain** 提供坐标、地面和碰撞；**UI & Map** 管 HUD；**Input & Accessibility** 使用投影逆变换映射屏幕输入。Rendering 只读 gameplay snapshot，不写坐标、碰撞、HP、任务、背包或 save。

## 高画质硬门

- 明确 source rect/native pixel density、anchor、整数缩放/viewport 策略和 DPI 行为；`imageSmoothingEnabled=false` 单独不能证明高画质。
- 用真实 succession preview 的同一 HOME/POI 状态检查 **1280×720** 与 **390×844**，记录 viewport、canvas backing size、DPR、缩放倍率、留边、HUD/触控遮挡。
- 与原图并排看角色脚点/比例、建筑层级、道路/水岸接缝、动画、FX、色彩和细节可读性；清晰锐利、丰富、统一方可 PASS。任一 viewport 模糊、粗马赛克、明显丢细节或不可读均 REVISE/BLOCKED。
- 不将源分辨率、fixture、nearest-neighbor 开关或概念图当作运行画面验收。

## 接口与测试

输入 world snapshots 与 asset IDs；输出画面和可观测渲染诊断，不回写 domain state。覆盖 camera forward/inverse、resize/HiDPI、遮挡排序、asset fallback、连续帧稳定和不重复调用模拟。跑邻近移动/碰撞/Animation/UI 回归。browser screenshots 和实体触控设备证据分开报告。

## 派工模板

一次只拆 projection、canvas sizing、depth ordering 或一个 scene layer。列明基线、允许文件、owner 请求、确定性截图条件、桌面/手机验证、回滚点；除非独立授权，不改 V21 主入口或批量替换 art manifest。

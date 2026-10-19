# Asset Pipeline — 独立模块卡 V1

> **历史卡片：**本卡已由 [`Asset Pipeline V2`](2026-10-05-asset-pipeline-module-card-v2.md) 取代，不再是 canonical 任务路由。保留原文供历史参考；后续派工请使用 V2 和 [`SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)。

**状态：DRAFT / NOT IMPLEMENTED as the complete successor intake pipeline**  
**唯一主责：Asset Pipeline**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)  
**艺术方向：**Modern High-Detail Pixel Art；用户指定的 art contributor（非 canonical module owner）创作隔离候选，风格取舍和候选选择由用户决定。

## 玩家目标

所有正式角色、NPC、怪物、地形、建筑、道具、UI、特效和动画素材接入后都清楚锐利、尺寸正确、风格统一；高清源图进入游戏后不能变糊、变粗马赛克或丢细节。

## 唯一职责与边界

拥有 source intake、文件/原始尺寸/alpha/frame/anchor metadata、裁切和校验工具、preview manifest 与正式 manifest 验证。用户指定的 **art contributor** 负责按批准 brief 创作源图（非模块 owner）；**Rendering & Camera** 决定屏幕投影/采样/实际显示；**Animation & Presentation** 消费批准帧；**Content & Localization** 管稳定 content ID/文本；World & Terrain 决定地形/碰撞语义。用户负责美术方向与候选选择。

不重绘生成新角色/场景、不改 renderer/collision/UI/gameplay/save/Relay，不绕开正式 gate。预览 manifest ≠ 正式 manifest；有图 ≠ 已进入游戏。

## Intake 与清晰度 Gate

1. 保留原源字节与来源记录；记录 SHA-256、实际尺寸、颜色/alpha、帧布局、可见裁切、anchor 和许可/作者信息（若有）。
2. 按各自资产合同检查 native pixel density，不拿单一尺寸硬套所有类别；禁止为迎合槽位任意拉伸/压缩/重采样。
3. 先 DRAFT/preview：原图、native 1×、最近邻整数放大、完整场景并排；查边缘、接缝/重复、轮廓、低分辨率可读度和 source/runtime 细节损失。
4. 在 guarded successor 真实运行画面同状态检查 1280×720 与 390×844。来源原图清楚但运行模糊/粗马赛克/过小不可读，判 **REVISE/BLOCKED**；未看到真实画面判 **UNKNOWN**。
5. 只有合同 owner 通过、映射清楚、renderer owner 验收采样、集成门禁通过后，才可提正式 manifest；本卡本身不批准素材。

## 接口与验收

提供 stable asset key → validated file/source rect/frame/anchor/scale metadata；失败返回可见诊断与安全 fallback。不得让 art metadata 决定碰撞/掉落/交互。测试缺失文件、坏 PNG、alpha 边缘、frame crop、重复 ID、错误尺寸和 preview/production 选择；对照 asset contract 与运行截图。

## 派工模板

一次仅处理一个 asset family/intake stage。列出用户选择的源图、合同、原字节校验、禁止更改路径、允许编辑文件、preview gate、实际 renderer 两视口证据和回滚方式。不得把源图交付称为游戏内升级。

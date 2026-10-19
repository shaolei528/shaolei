# 接班卡：伙伴概念参考与非玩家实体移动前置任务

日期：2026-10-05（Asia/Rangoon）

## 稳定目标

《深渊苏醒 / ABYSSAL WAKE》为 3/4 斜俯视、Modern High-Detail Pixel Art 的合作生存沙盒 RPG。HOME 温暖安全；OUTSIDE 从现代沿海日常逐渐走向深渊恐怖。五款参考游戏只借玩家体验，不复制具体内容。高清必须在运行游戏的实际尺寸清楚，不能把高分辨率概念图缩小后当成通过。

## 本轮完成

- 查看仓库连续性 Skill、章程、状态、宠物 V2 模块卡和 successor module map。
- **VERIFIED workspace snapshot:** `C:\Users\MECH\Documents\ChatGPT\游戏编程\abyssal-wake-integration`，branch `fix/awakening-production-gate-qa-findings-v1`，HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。工作树已有大量混合来源的修改与未跟踪内容；本轮没有覆盖或清理这些内容。
- 生成并审阅一张 716×716 的“潮痕信使”概念参考图。它是聊天中的视觉草案，不在仓库/游戏，不是透明 sprite，不代表尺寸、帧数、像素密度或 production 合同。造型意见：暖灰褐、小型海岸生物、海玻璃青鳍耳/潮纹、琥珀眼；原图复杂背景与密集颗粒不适合直接缩放进游戏。
- 将概念边界记入 `docs/content-inbox/2026-10-05-pets-companions-module-card-v2.md` 与 `docs/PROJECT_STATE.md`。
- 建立唯一下一项推荐工作：`docs/content-inbox/2026-10-05-world-terrain-entity-movement-contract-task.md`。只读盘点非玩家实体合法移动接口与边界；当前不授权 runtime 代码实施。
- **只读二审：**另一位 AI 核对 canonical owner 与来源措辞，确认 World & Terrain 为唯一主责、Movement & Locomotion 为移动接口协作者；建议并已补充有限 `terrain-v21.js` resolver 与玩家 wrapper 的区别，明确穿越只是风险推断，并从 `SUCCESSOR_MODULE_MAP.md` 交叉链接任务。二审未改文件、未运行代码。

## 当前关键结论

- **VERIFIED（静态源码范围，继承 PET-0）：**现有 V21 水域移动 wrapper 只操作玩家全局位置；World Spatial 的矩形几何查询依赖 zone 注册，无几何时会放行目标。没有证据表明它们组成了覆盖任意实体、地形和障碍的统一移动/寻路服务。
- **PLANNED:** World & Terrain 确认合法可占据/移动合同后，才评估宠物单区临时跟随；路线规划、存档和合作同步另外立项。
- **UNKNOWN:** 宠物源图尺寸/帧格/anchor/目标显示比例、owner 持久身份、Save/Relay 方案、真 successor 两个 viewport 的实际画质。
- 宠物候选 `潮痕信使` 仍未选定、未实现。用户可保留、修改或删除候选；概念图不自动批准为正式方向。

## 下个会话建议

先只读审阅 World & Terrain movement-contract task card，并可直接将它交给另一位工程 AI；不要同时让两方改同一文件或 runtime。审查输出需要源码行/测试证据和 VERIFIED/PLANNED/UNKNOWN 标签。等接口审定且用户选择独立实现任务后，再做最小可回滚实现与回归验证。

## 验证边界

本轮是文档草案与概念图生成，没有跑游戏或测试；不宣称 bug 已修复、伙伴已接入、代码更清晰、像素画质已通过或 V21 已更新。由于 worktree 原本混合来源且 dirty，本轮只确认分支、HEAD 和状态；未对整仓 diff 做所有权归属。

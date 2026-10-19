# 接班卡：Farming & Food 内容候选「盐风叶菜」

日期：2026-10-05（Asia/Rangoon）

## 稳定项目目标

《深渊苏醒 / ABYSSAL WAKE》是 3/4 斜俯视、Modern High-Detail Pixel Art 的合作生存沙盒 RPG。玩家在温暖 HOME 准备，进入熟悉但逐渐异常的现代沿海城市探索/战斗/搜刮，再带着价值回家成长。Crashlands、Terraria、Minecraft、Don't Starve、Stardew Valley 提供玩家体验参考，不照搬名字、美术、地图、配方和整套规则。游戏内实际画面必须锐利、细节可读；概念源图和单测都不能替代真实视口验收。

## 本轮状态与证据

- **VERIFIED workspace snapshot:** 仓库目录 `C:\Users\MECH\Documents\ChatGPT\游戏编程\abyssal-wake-integration`；branch `fix/awakening-production-gate-qa-findings-v1`；HEAD `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。既有工作树大量 dirty/untracked、来源混杂；未清理、覆盖或归因。
- **VERIFIED（有限静态检索）：**`modules/` 有泛用 food inventory 与野外口粮/消费代码；检索到的 `survival-v21.html`、相关模块、测试、资产路径和设计草案没有证明已存在作物/种子 service 或种植地块系统。未全量核实任一生产注册表或当前画面，因此不得宣称整个运行时绝无农场功能。
- **DRAFT:** 新候选卡 [`docs/content-inbox/2026-10-05-farming-food-content-candidate-saltwind-greens.md`](../content-inbox/2026-10-05-farming-food-content-candidate-saltwind-greens.md) 提议从附近探索带回耐盐种子，回 HOME 培育并收获一次远征补给。内容 ID `crop.saltwind_greens` 只是提案，未登记。无数值、周期、季节、配方或掉落率。
- **五款体验转译:** Stardew = 看见家园日常成长；Don't Starve = 结果/风险可读且不惩罚离线；Minecraft = 家园布置表达；Terraria = 通过探索逐步发现种子（解锁权归其他模块）；Crashlands = 采收反馈即时清楚。单候选不需要一次实现五套系统。
- **独立二审:** 另一位 AI 只读核查内容原创性、owner 和艺术合同；有限搜索未发现近似已登记 crop/seed 或 Farming service。它要求区分 World/HOME 的地形及设施资格与 Farming 的播种/作物阶段状态，现已修订。未编辑或运行代码。
- **美术:** 两张概念图仅在聊天中生成：第一张较柔化，记 **REVISE**；第二张有更清楚的硬边像素簇，记 **DRAFT / VISUAL STUDY**，仍需检查土壤碎点密度并由 art lead 判断是否匹配项目。都未复制到仓库、未抠图/裁帧/验 alpha/hash、未接入游戏。像素源尺寸、frames、anchor、像素密度、实际作物地块、sprite 显示尺寸均 UNKNOWN。待 Rendering/Asset Pipeline 核对合同后，实际 successor 的 1280×720 和 390×844 检查才可评估；没有运行画面应标 UNKNOWN/NOT ACCEPTED。

## 责任边界

- 唯一内容 owner：Farming & Food，拥有播种/作物阶段/成熟采收资格。
- World & Terrain / HOME & Building 验证地形与已放置/解锁种植设施；Items & Inventory 负责库存变化；Time & Weather 提供时间/天气；Survival & Needs 决定营养；Crafting 负责口粮配方；POI/Quest 决定种子来源或解锁。
- Save/Network 未定前不声称持久保存、离线成长或多人共权威。
- 候选不包含新代码、设施、物品 registry、存档、联网、UI、艺术资产或测试要求实现。

## 验证与下一步

- `node tests/successor-module-routing-contract-v1.test.mjs`：PASS，27 个 canonical owner / 27 张 indexed cards，0 broken links、0 duplicate owners。该测试验证模块路由，不证明 Farming runtime。
- 文档空白检查及可追踪链接检查：PASS。
- **下一步：**等用户保留/修改/删除这张候选卡后，若选择保留，再给它单独建立“种子来源和采收物合同”任务；如果期间有 AI 实现，先重新核对分支/HEAD/dirty 工作区和 active entry，不基于这张概念卡直接写 Farming 代码。

本轮没有改 runtime、tests、art、manifest、Save、Relay，没有修 bug、提交、合并或部署；长期项目 goal 继续有效。

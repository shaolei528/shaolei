# 2026-10-09：灰盒功能验收续接

## 本轮修正

- `prototypes/successor-3-4/preview.js`：`view=home-pixel` 默认仍隐藏开发按钮，但显式的 `awQaControls=1` 可以保留按钮用于隔离 QA。
- `prototypes/successor-3-4/qa-harness.js`：第三个石料验收点移到 `1:1:34`。原坐标落进菜畦交互范围，按 E 会播种，不会挖石。
- 更新 `tests/successor-preview-live-gate-v1.test.mjs`、`tests/successor-qa-harness-v1.test.mjs` 对应回归。

## 已验证

- 两项定向 Node 回归通过；`npm run build:site` 成功打包 91 个公开文件（0.61 MiB）；`git diff --check` 通过，Git 只提示已有混合换行符。
- 灰盒隔离 QA 使用按钮定位资源点，并用普通 E 交互：四个木点完成 4 木材、两处营地石点加一处外围石点完成 3 石料；多段进度完整后才发放资源。
- 营地工作台制作骨刃后，4 木材和 3 石料扣至 0，背包显示骨刃已装备，主线推进到外出调查。

## 尚未验收

- QA 使用 Relay 阻断与内存存档，且用按钮瞬移定位；不能据此宣称自然移动、存档重载或多人同步通过。
- 战斗→击杀→掉落→返营没有闭环。此前普通自然路线在黑沼遭遇中死亡；本轮一次直接传送战斗点的试打跳过了正常离营护网，不足以评价真实难度。
- 后续优先：普通路线重测战斗和返营；实现并验证一种可放置且有碰撞的营地防御；随后实走钓鱼/料理/进食、怪物蛋/孵化/同行、牲畜繁殖/产出与保存重载。

## 工作区约束

- 仓库：`C:\Users\MECH\Documents\ChatGPT\游戏编程\abyssal-wake-integration`
- 分支/HEAD：`fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- 工作树原本有大量未提交和未跟踪内容；本轮仅增量修改 QA 入口、验收点、两项回归和项目状态记录。未清理、未提交、未推送、未部署。

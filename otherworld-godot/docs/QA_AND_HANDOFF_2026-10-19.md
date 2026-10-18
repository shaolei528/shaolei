# 《异界余烬》Godot 2.5D QA 摘要

最后更新：2026-10-19（Asia/Yangon）。当前版本 0.3.0；详细交接见 `docs/ITERATION_HANDOFF_2026-10-19_0240.md`。

## 当前结果：迭代 0.3.0

- Godot 4.7.2 stable 官方引擎导入、headless 场景运行、34 项 smoke assertions、Web 导出均通过，0 失败。
- 浏览器端验证余烬拾取、营火制作、营火唤醒 Ashling、F 键攻击、Shift 闪避、敌人击败及唯一 `ashen_shard` 入包；浏览器控制台无错误。
- 390×844 手机视口下所有方向/操作按钮均在画面内；触屏移动 1.80 m。
- GitHub push run 39161930943 和 PR run 39161934081 均成功。
- CI Web/QA artifact 12148769061，SHA-256 `1c7fc2679994b3b34bbdd0444e19797d7d75792e8b7a286ef78976328c315878`。

当前验证代码提交为 `b27a5ea84c66ca60b76f7bb4fdbe26905bbc7350`，仍在 `codex/otherworld-godot-validation-20261019` 的 `otherworld-godot/` 隔离目录与 PR #3。没有合并到 `main`，没有生产部署或覆盖线上站点。

## 测试边界

本地工作区没有 Godot 可执行文件；引擎测试由官方 Godot 4.7.2 GitHub Actions 实际运行。本 Godot 工程是独立 2.5D 迁移切片，不含旧版 JavaScript 游戏全部 238 个模块、存档或多人功能，不是完整迁移。Ashling、碎片与篝火仍是程序占位视觉。触控为 Chromium 模拟，不是真机/弱网 QA。

## A/B/C/D 状态

| 线 | 当前状态 | 下一步 |
|---|---|---|
| A 美术 | 敌人及掉落仍为占位几何 | 对齐概念图，制作敌人待机/攻击/受击/死亡动作和音效 |
| B 玩法 | 单敌人攻击、闪避、生命/重生和唯一掉落完成 | 用 `ashen_shard` 制作一个营地升级并覆盖范围、消耗、重复制作 |
| C 联网 | Godot 多人未实现；旧多人系统未动 | 等物品/战斗稳定后设计版本化协议和双客户端验收 |
| D 集成 QA | 两路 CI、Web 导出、浏览器流程通过 | 下个切片重跑同一整套门禁 |

完整证据：`qa/manifest.json`、`qa/results/ITERATION_TEST_LOG_0.3.0.json` 与 `qa/results/`。

# 《异界余烬》Godot 2.5D QA 摘要

最后更新：2026-10-19 03:45（Asia/Yangon）。当前版本 0.4.0；详细交接见 `docs/ITERATION_HANDOFF_2026-10-19_0345.md`。

## 当前结果：迭代 0.4.0

- 官方 Godot 4.7.2 CI：项目导入、45 项 smoke 断言、无头运行、Web 导出全部通过。
- 浏览器流程通过余烬拾取、篝火制作、Ashling 战斗/唯一碎片、超距升级拒绝、U 键一次性升级/消耗、8 m 光照、重复强化保护；0 个浏览器错误。
- 390×844 手机视口所有操作按钮在界内；屏幕升级按钮保持一次性状态，触控移动通过。
- PR CI：[run 39166804148](https://github.com/shaolei528/shaolei/actions/runs/39166804148)，artifact 12151410509，SHA-256 `5a8906f50f58ecfe21ccbc64131cff8b18b06bb36f385477a75dab84acc9c150`。
- 两次中间失败均已修复并保留在 `qa/results/ITERATION_TEST_LOG_0.4.0.json`；最终验收以最新通过 run 为准。

当前验证代码提交为 `3632b0871796ad1962e0203c323e70c1fda46685`，仍在 `codex/otherworld-godot-validation-20261019` 的隔离目录与 PR #3；未合并、未生产部署。

## 测试边界

本地工作区没有 Godot 可执行文件；引擎测试由官方 Godot 4.7.2 GitHub Actions 实际运行。该项目是独立玩法切片，不含旧版 JavaScript 游戏的全部模块、存档或多人功能，不是完整迁移。Ashling、碎片及篝火美术仍是程序占位；触控为 Chromium 模拟，不是真机或弱网 QA。

## A/B/C/D 状态

| 线 | 当前状态 | 下一步 |
|---|---|---|
| A 美术 | 敌人、碎片、篝火仍为占位几何 | 对照已存概念图替换 Ashling/碎片外观 |
| B 玩法 | Ashen Shard 篝火强化闭环已完成 | 后续扩展一个资源节点与工具/配方闭环 |
| C 联网 | Godot 多人未实现；旧系统未动 | 玩法接口稳定前暂不改联网 |
| D 集成 QA | Godot 导入、45 smoke、Web 导出、浏览器均通过 | 下个切片完整复测 |

详细证据见 `qa/manifest.json`、`qa/results/ITERATION_TEST_LOG_0.4.0.json` 和工作流 artifact。


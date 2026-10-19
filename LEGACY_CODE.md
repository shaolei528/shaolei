# 游戏入口与兼容文件

本清单只保留当前真正影响启动、运行、发布的边界。历史说明保存在 `docs/handoffs/`，不代表还有多个可玩版本。

## 唯一玩家入口

- `index.html`：唯一玩家入口，转到 3/4 统一灰盒。
- `prototypes/successor-3-4/live-candidate.html`：实际灰盒页面。

旧的独立游戏入口 `survival-v3.html`、`survival-v8.html`–`survival-v17.html`、`survival-v17c.html`、`world-v2.html`、`index-v7-direct-backup.html` 和旧启动脚本已从活动工作树移除。两个平行相机原型目录和两张可直接打开的美术场景页也已移除。

## 仍保留的运行底层

- `survival-v21.html`：当前模拟入口，承载现有玩法、存档与 Relay 初始化；3/4 页面借用它的状态和运行模块。它不是另一个供玩家选择的游戏。
- `ui-shell.html`：V21 加载的 DOM/CSS 模板。保留此文件是为了不破坏启动流程。
- `modules/`：V21 的领域与网络运行模块；按 `docs/SUCCESSOR_MODULE_MAP.md` 的唯一 owner 管理。
- 根目录部分旧聚合脚本：仍被模块排序/兼容检查读取；未迁移完之前不删除。

## 清理边界

旧历史记录和备份用于追溯，不会出现在玩家入口或发布清单中。只有确认没有运行时、发布、CI 或恢复依赖后，才继续删除它们。不要把候选图、QA 页或历史文档当成正式版本。

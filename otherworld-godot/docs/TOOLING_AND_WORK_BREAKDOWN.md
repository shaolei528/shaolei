# 《异界余烬》Godot 工具评审与模块分工

日期：2026-10-19（Asia/Rangoon）

## 1. 已定方向与验证边界

用户希望迁移至 Godot，并获得完整的 2.5D 空间表现。推荐工程路线是 **真实 3D 地形、碰撞与建筑 + 2D 角色/生物精灵 + 正交或固定角度 Camera3D**。这里的“2.5D”描述画面和交互形式；世界在底层仍有 x/y/z 三维坐标。它可以支持真实高度、坡道、桥、台阶、遮挡和投影。四分之三视角只是镜头角度，和是否使用 3D 世界不是同一选项。

迁移不会自动把旧 Canvas 游戏的 238 个 JavaScript 模块变成 GDScript，也不会自动提高素材、动作和构图质量。保留旧版可玩入口，先完成独立 Godot 纵向切片，再按玩法循环迁移。优先证明：营地出发 → 采集 → 战斗 → 带回材料 → 制作/建造 → 存档重载。

根代理本轮计划实测 Godot 4.7.2、早期 P02 工程及新 3D 验证夹具；本文件不预先宣称这些验证成功。实际运行版本、退出码、导入日志、导出文件和浏览器证据以本轮 QA 文档为准。

第三方引擎插件/测试框架均为已阅读资料、未安装运行。已将三个审阅过的文档型 skills（GDScript、headless-testing、export）及引用文档复制到项目 `.agents/skills`，固定上游 commit 并保留 Apache-2.0 许可证；未执行全局安装器。实际引擎和浏览器测试见QA报告。

## 2. 推荐工具及评审结论

| 工具 | 上游核实内容 | 本项目用途与边界 |
|---|---|---|
| [Godot 官方 demo projects](https://github.com/godotengine/godot-demo-projects) | MIT；稳定版本使用同名分支，master 跟随开发版；部分 demo 提供 Web 展示 | 按引擎版本参考 3D 角色、物理、GUI、网络；每个示例的具体资产仍核对各自版权说明。不是可直接合并的整套游戏 |
| [GUT](https://github.com/bitwes/Gut) | MIT；9.7.1 对应 Godot 4.7.x，9.6.1 对应 4.6.x；支持 CLI、JUnit XML；2026 年 7 月有修复版 | 纯 GDScript 项目首选候选，用于制作、掉落、存档、任务与坐标逻辑。启用插件/跑测试会执行其 GDScript |
| [GdUnit4](https://github.com/godot-gdunit-labs/gdUnit4) | MIT；当前 v7 分支支持 4.7/4.7.1；6.2 系列支持 4.5–4.7.1；Scene Runner 可模拟鼠标、键盘、触摸 | 场景交互测试较多时作为 GUT 的替代；文档表尚未明确列 4.7.2，需本地兼容性实测。不建议同时装两套测试框架 |
| [godot-ci](https://github.com/abarichello/godot-ci) | MIT；Docker 与 GitHub Actions/GitLab 模板用于导出和发布 | 固定经过实测的引擎版本和镜像 digest。CI 运行导入、逻辑测试、Web 导出及产物上传；浏览器渲染和操作仍需单独验收。CI 会执行第三方容器/Action |
| [Coding-Solo/godot-mcp](https://github.com/Coding-Solo/godot-mcp) | MIT；Node.js ≥18；可运行/停止 Godot、抓日志、创建/修改场景；UID 工具注明 Godot 4.4+ | 可选编辑器桥接。现有 shell + Godot CLI 已能执行核心验证，MCP 并非必需；npx 会执行第三方 npm 代码。此次未充分核实最近提交日期，不保证维护频率 |
| [awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) | Apache-2.0；当前 Godot 文档基线 4.7；目录提供 Godot 语法、3D、物理、动画、导出、无窗口测试等说明 | 只选择相关 skills 审阅，不全局加载全部 74 个。Markdown 本身是指导资料；npx skills add 是第三方 npm 安装程序，不等同于只读文档 |

建议优先审阅/采用的 skill：`godot-gdscript`、`godot-nodes-scenes`、`godot-3d-essentials`、`godot-physics`、`godot-animation`、`godot-export`、`godot-gdscript-headless-testing`。3D skill 中的 glow、SSAO 等示例必须按 Web Compatibility 渲染器实际能力调整，不能直接复制当成画质保证。

已额外查看 [shihabshahrier/Godot-Skill](https://github.com/shihabshahrier/Godot-Skill)：README 声明 MIT，但此次仓库文件树中未见独立 LICENSE；只有 3 个提交，安装脚本默认写多个全局 agent 路径，因此不作为首选。动作冒险 skill 示例偏 2D Zelda 范式，也常假设特定全局管理器和节点结构，不宜直接套用到 3D 世界。

## 3. 模块接口与责任分工

这些是同一工程内的工作流角色，不要求用户另开聊天。用户可在本聊天持续推进；能并行时由主代理分派独立任务，主代理仍负责整合与结果核实。

| 角色 | 负责模块 | 本阶段交付 | 不跨越的接口 |
|---|---|---|---|
| A：场景、美术与表现 | `visual/`、`assets/`、镜头、环境、精灵动画、UI 展示 | 统一一张概念图的色板/比例；营地、树林、河岸；真实遮挡与投影；角色朝向和动作 | 不改战斗数值、物品 ID 和存档结构；精灵脚点/尺寸及动画名由共同契约规定 |
| B：移动、战斗与玩法 | `actors/`、`combat/`、`items/`、`crafting/`、`quests/` | 3D 地面移动；采集与正确工具；一套敌人和攻击；材料制作；营地回报循环 | 不直接修改 A 的世界主场景；通过信号、Resource 数据及场景实例连接 |
| C：联机、服务与存档同步 | `network/`、`server/`、协议、房间、重连 | 双人先行；房间加入/退出；状态同步；断线恢复方案；协议测试 | 世界坐标统一三维；协议带版本；不依赖 Canvas 版旧坐标或浏览器局域网能力 |
| D：主代理集成与 QA | 共享契约、主场景入口、`tests/`、`export_presets.cfg`、CI、发布记录 | 每轮合并、冲突处理、Godot 导入、运行、Web 导出、浏览器检查、完整版本包 | 唯一生产发布责任；不得用某一分支单独产物覆盖其他已整合内容 |

共享约定先落地：世界以米或统一单位记录 x/y/z；物品/配方使用稳定 ID；攻击与采集从玩法层发出事件；视觉效果消费事件；角色脚点与碰撞体分离；存档及网络消息均带 schema/protocol 版本。Godot Web 联机需单独核对浏览器可用传输方式，不能直接假设原生 UDP/ENet 在网页中可用。

## 4. 每小时 checkpoint

“每小时更新”定义为开发会话进行中的检查点，不保证每小时都有足够成熟的公开生产版本，也不代表模型离线后继续工作。

| 会话内时间 | 所有工作流共同动作 |
|---|---|
| 00–10 分钟 | D 读取上一轮交接、确认唯一基线；分配 A/B/C 本轮文件范围和验收条件 |
| 10–40 分钟 | A/B/C 在各自模块实现可验收的小增量；有依赖时先交接口和夹具 |
| 40–50 分钟 | D 合并；导入、逻辑测试、运行与本轮关键交互检查；失败就修复或隔离 |
| 50–60 分钟 | 记录真实结果；产出预览/截图和模块包；上传源码、QA、交接、校验和；决定下一轮 |

每轮记录：父版本、改动文件、实际完成项、未完成项、运行命令/退出码、浏览器/设备证据、已知问题、下一轮任务。预览版本可频繁更新；生产版本通过相关验收后再发布，避免用不完整的小时包覆盖稳定站。

## 5. 每日四阶段任务安排

以下是开发工作顺序，可按实际可用会话拆分，并非要求用户每天在线四小时。

1. **基线和风险阶段**：D 检查源码/资料版本、上次 QA 和发布状态；选择一个玩家能感知的目标。当天先解决阻止启动/导出的风险。
2. **并行实现阶段**：A 做该目标的场景/反馈，B 做玩法闭环，C 做需要的同步或协议。每个工作流都交独立模块与证据。
3. **集成试玩阶段**：D 运行同一构建，从标题进入到目标完成，再测存档恢复和 Web 操作；A/B/C 修复可复现问题。
4. **封版交接阶段**：发布经过验证的预览或生产版本；保存全量源码和模块差异、QA、截图、manifest；明确下一天从哪里继续。

### 第一轮：引擎与导出

- 实测 Godot 4.7.2 运行、旧 P02 导入与日志。
- 新建最小 3D 地形、2D 角色与正交/固定镜头夹具，证明真实高度、碰撞、遮挡及投影。
- Web 导出必须记录实际产物；浏览器加载与操作如未执行，明确记为未验证。

### 第二轮：第一段可玩循环

- A：营地至树林一条完整路线、角色脚点/朝向、采集与命中特效。
- B：移动、工具采集、一种敌人、材料掉落、一个可制作设施、存档。
- C：冻结房间协议；先验证两端加入/断开和坐标同步，再增加复杂世界状态。
- D：对完整循环做端到端验证，输出可玩的 Godot Web 预览。

### 后续按验收推进

镜头和移动通过后扩展制作/建造；单人循环稳定后扩展多人；一片生态有重复游玩价值后再增加地区、敌人、宠物和剧情。不要通过堆新增模块数代替实际试玩完成度。

## 6. 持续开发和交接

用户可一直在本聊天发出“继续下一轮”，无需重新开 A/B 聊天。主代理在会话中持续执行、分配工作、整合并报告；不能承诺关闭聊天后仍自主每小时写代码和部署。提醒或定时任务也不能被描述为已经建立的持续开发进程。GitHub CI 在有明确触发器和可用 runner 时可以自动测试/构建，但不会凭空实现新玩法。

每轮按用户要求保存交接与产物。若工程已由 GitHub 托管，Git 保留唯一源码历史；Library 保存可供其他聊天检索的版本索引、交接、QA 及适合分发的发布包，不把“上传成功”当作“运行验证成功”。

## 7. 本文研究证据

上游页面访问日期：2026-10-19。版本兼容性按上游当前文档记录，不替代本地实际验证。

- https://github.com/godotengine/godot-demo-projects
- https://github.com/bitwes/Gut
- https://github.com/bitwes/Gut/releases
- https://github.com/godot-gdunit-labs/gdUnit4
- https://github.com/abarichello/godot-ci
- https://github.com/Coding-Solo/godot-mcp
- https://github.com/gamedev-skills/awesome-gamedev-agent-skills
- https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/godot/godot-3d-essentials/SKILL.md
- https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/godot/godot-export/SKILL.md
- https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/main/skills/godot/godot-gdscript-headless-testing/SKILL.md


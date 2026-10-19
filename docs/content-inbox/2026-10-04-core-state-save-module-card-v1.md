# Core State & Save 模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED / 供模块分工、用户审阅和后续 AI 接手**  
**主责：Core State & Save（核心运行状态与存档协调）**  
**配合：Character、Survival、Inventory、World、Home、Quest、Network & Co-op、UI、Integration & QA**  
**方向：为 successor 定义边界；当前 V21/V5 仅是兼容基线，不宣称已具备模块化存档服务。**

本卡只记录职责、现状和验收要求；不授权本轮改动 save schema、迁移、浏览器数据、Relay 或代码。

## 1. 玩家价值与参考游戏转化

玩家重进游戏时能找回约定需要保留的个人进度，不会因一次功能更新失去物品、状态或位置；临时远征不会被误当成永久世界进展；多人实时状态也不会冒充可靠存档。

- **Crashlands：**玩家与制作/战利品进度应有清楚的个人归属和恢复预期。
- **Terraria：**装备、发现和成长存档应服务长期探索与解锁。
- **Minecraft：**玩家、角色、世界实例是不同存档范围；未来建造共享前须明确世界归属。
- **Don't Starve Together：**合作世界需要明确区分玩家数据和世界数据，断线不等于进度成功保存。
- **Stardew Valley：**日常生活和社区进展应跨会话延续，但具体 NPC / 农场数据由其领域 owner 定义。

只借鉴体验，不照搬其它游戏的存档格式、云服务或世界规则。

## 2. 当前 V21 存档事实（可核实代码基线）

**VERIFIED source：**modules/core/runtime-state.js 当前集中定义 V21 浏览器全局对象，并使用本地存储键 abyssal_wake_save_v5。saveLocal() 序列化 v5 JSON，含 name、x/y、hp、hunger、sanity、inventory、hasLeftCamp；simulation-update.js 约每 6 秒调用一次，部分交互也会即时调用。

**VERIFIED load behavior：**有效 v5 优先恢复位置（裁剪到世界范围）、HP（最低为 1）、饥饿、理智、背包、离营状态和名称；无 v5 时才检查 v4。v4 迁移恢复旧名称、背包、最低饥饿，其它状态回到 Safe Camp 默认值。读取过程不删除 v4 key。JSON 或 localStorage 异常会被 catch；该路径当前没有向玩家显示具体错误。

**VERIFIED isolated tests：**本卡编写时依次运行并通过：
- tests/player-save-v5-migration.test.mjs：陈旧时间戳的 v5 仍恢复、v5 优先级、v4 迁移。
- tests/awakening-home-workbench-upgrade-v1.test.mjs：Field Rig 单独本地持久化、3 stone + 2 shard 升级成本、出营 ward 15s → 25s、Relay 未变。
- tests/awakening-expedition-loop-v1.test.mjs：远征 phase、提前返家/死亡重试不算完成、远征 scope 为 session-local、persistence 为 none-v1。

这些是对当前工作副本的局部 fixture 测试，不代表浏览器实档、安全/隐私、跨设备或多人世界存档验收。交接者须重跑并确认基线。

### 目前不同数据范围

| 数据 | 当前可见 owner / 存储 | 现状与限制 |
|---|---|---|
| 玩家姓名、位置、HP/饥饿/理智、背包、离营标记 | 当前 V21 runtime-state.js → abyssal_wake_save_v5 | 单浏览器本地 JSON；目前不是账户云存档或跨设备档 |
| 旧玩家数据 | abyssal_wake_save_v4 | 仅在没有有效 v5 时迁入；当前不删除旧键 |
| HOME Field Rig tier / return clearance / last return time | Home Workbench V1 → abyssal_home_workbench_v1，v1 | 与主 player save 分开的本地键；不能推断为多人共享建筑或世界档 |
| Guide 是否聊过 | Safe Camp 独立键 abyssal_guide_v7 | 一位用户侧的轻量本地标记，不是通用 Quest/NPC 存档服务 |
| MIRE MART Expedition phase / attempt / history | Expedition Loop V1 内存对象 | session-local、重载后不恢复；当前返回资格会另由 Home Workbench 记录 |
| Zone 内怪物、采集时间等 | 当前网络 state/world broadcast 与客户端内存 | 通过 Relay 同步不表示服务端持久化；没有证据证明断线/换房后为永久世界状态 |
| 菜单设置/减少动态选项 | 独立 UI settings key（如当前 game shell 定义） | 用户偏好不应误并进角色/世界玩法数据 |

当前 owner 名称是代码事实描述；未来模块拆分和集中迁移均为 **PLANNED**。

## 3. 状态 owner 与保存协调边界

未来 Core Save 是版本化数据的协调与适配层，不因此拥有所有玩法状态：

| 数据域 | 领域 owner 提供的内容 | Core Save 负责 | 不可越界 |
|---|---|---|---|
| Character | 稳定角色标识和已批准角色字段 | 校验/序列化对应片段并恢复 | 不决定角色能力和移动规则 |
| Survival | HP、饥饿、理智的领域快照与合法范围 | 只按版本合同保存/恢复 | 不决定恢复、死亡或生存数值 |
| Inventory / Equipment | 物品和装备的版本化快照 | 保留兼容的无损片段，拒绝非法格式 | 不制造/扣除物品或验证配方 |
| Home / Building | HOME 建筑或设施 owner 的明确本地/世界片段 | 保存获准范围 | 不把 Field Rig 本地键擅改成多人共享房屋 |
| World / Quest / Expedition | 各 owner 定义个人发现、临时任务、长期任务或世界状态 | 仅协调经批准的持久片段与 schema | 不把 session-local phase 自动变永久进度 |
| Network & Co-op | 由服务端/权威合同提供已裁决状态 | 未来可接独立的持久化 API | Relay 广播、presence 或客户端值不等于权威世界快照 |
| UI settings | UI 偏好 owner | 保持独立配置域 | 不把颜色/按键/减少动态写进玩家世界进度 |

### 推荐边界

- 领域模块只公开可校验的 serialize/restore 数据片段，不允许每个新系统私自写同一个 localStorage key。
- Core Save 定义 envelope/version、校验、迁移顺序、写入失败结果和兼容回退；每项领域数据仍由原模块定义语义。
- 先把存储 provider 明确为 browser-local。未来若增加账号/云端/共享世界，作为单独后端和安全设计，不得把 localStorage 包一层就称为云存档。
- 保存 API 对调用者返回成功/失败；配额、隐私模式、损坏 JSON、旧版本和越界字段都有明确处理，而不是静默声称已保存。
- 迁移应能重复运行且结果一致。数据损坏时保留原始旧键作为恢复证据，不自动清空或覆盖唯一副本。
- 玩家个人数据、客户端设置、session 临时状态、多人实时广播、未来权威世界持久化必须分 namespace / schema / 权限边界。

## 4. 不应由新手或下一 AI 被迫猜的关键决定

未来具体迁移前必须先从代码完整盘点所有 localStorage/sessionStorage key 和读写点，画出“当前 owner → 当前 key → 触发保存时机 → 当前测试”的矩阵；本卡列举的 key 不保证穷尽全仓。

之后由项目负责人提出可回退方案并核验：

1. 哪些数据属于玩家、角色、设备设置、session、共享 world，各自跨刷新、重连、换设备的预期是什么？
2. inventory、survival 和 position 的有效范围及恢复先后如何避免死亡态/无效坐标？
3. v4 → v5 以及未来下一版本失败时，保留哪些备份键、如何恢复旧档、如何证明迁移幂等？
4. 两个标签页或多个客户端同时写同一玩家数据时，是最后写入、版本比较还是明示冲突？当前没有服务端冲突解决证据。
5. 哪些状态是安全可重建的临时数据，不应持久化？何时可接受用户明确请求的“重置存档”，如何预览与撤回？

不得将这些未决问题误写成已存在服务能力，也不得只为方便而让用户逐项分析代码。

## 5. 未来实现切片（一次只领一个）

1. **SAVE-0 只读盘点：**搜索全部存储 key、序列化/恢复入口、定时写入、网络边界与测试，形成完整矩阵；不改代码。
2. **SAVE-1 失败行为：**在当前合同不变下，设计/测试 JSON 损坏、写入受限、非法字段、缺字段时的结果；变更前先确认用户数据保护策略。
3. **SAVE-2 V21 保存 adapter：**若用户选择，给 v5 增加无损、可回退的验证适配，不改变 key/schema，先补针对实证问题的回归。
4. **SAVE-3 successor schema：**待 successor 玩家/存档 owner 与最小可玩循环确定后，设计独立 schema envelope 和领域 slice；先双向 fixture 验证，再定迁移政策。
5. **SAVE-4 持久世界：**只有在有明确权威后端、玩家身份/权限和恢复合同之后，才设计共享世界写入与冲突解决。

没有迁移预算、备份策略、恢复测试和用户数据回滚验证，不开始 schema 升版。不得由每日内容候选顺便添加存档字段。

## 6. 验收与防回归

### 本地 player save

- 新建、保存、刷新恢复、退出重进，所有约定字段恢复一致。
- 保持 v5 优先级；v4 转换结果确定且重复运行幂等。
- 缺字段、坏 JSON、非法类型、极大/极小数、localStorage 只读/超额时不崩溃、不静默覆盖旧档；反馈 saved / not saved。
- 当前既有键、玩家字段语义和 save tick 频率未经批准不能改变。

### 多模块与 co-op

- Field Rig、Guide、UI settings 各保留其当前职责和 namespace，迁移前不可把一个域合并或清理另一个 key。
- Expedition V1 仍是临时 session 状态；只有 Home 模块接受成功返程凭据后记录其现有 clearance。
- Relay packet names、presence、broadcast、authority 和同步频率不受本地存档改动影响。
- 双开标签、断线、重连、换房/换设备如何恢复没有覆盖的部分标 UNKNOWN，不能宣称通过。

### 需要重跑的现有定向测试

- tests/player-save-v5-migration.test.mjs
- tests/awakening-home-workbench-upgrade-v1.test.mjs
- tests/awakening-expedition-loop-v1.test.mjs
- 若改 loader/owner 顺序：tests/module-sort.test.mjs 及实际入口启动检查
- 若改 Relay 或世界持久化：对应 Relay / session-zone / 两客户端测试

Node fixture 通过不代表真实浏览器 localStorage、真实刷新或跨设备云存档已经验收。

## 7. 下一 AI 可直接领取的任务提示词

你负责 ABYSSAL WAKE 的 Core State & Save。先阅读本模块卡、PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md、SYSTEM_BLUEPRINT.md 和所有存档合同；核对当前 branch、HEAD、dirty worktree 和并行 AI 正在使用的文件。

第一步只做只读盘点：全仓找出存储键、写入者、读取者、字段、范围、保存触发、权限和已有测试，更新数据范围矩阵。请勿先写新 schema、迁移、云档、多人世界存档或 reset 功能；不得删除任何旧键/旧文件或覆盖用户数据。分清 V21 当前事实与 successor 规划。

如果发现确认的存档 Bug，先保存原始数据证据并提出最小、可回退修复，添加失败/成功/旧数据回归，检查相邻模块；遇到迁移或唯一副本风险时停止可能破坏数据的操作并说明风险。交付时报告证据、通过的精确测试、未验证的浏览器/多设备行为和恢复步骤；不要声称 Relay 是持久世界数据库。


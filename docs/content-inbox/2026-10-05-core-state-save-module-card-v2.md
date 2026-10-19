# Core State & Save — 独立模块卡 V2

**状态：DRAFT / PLANNED successor owner；V21 仍是分散的兼容实现**  
**唯一主责：Core State & Save**  
**本轮范围：**修复并回归验证一个 V5 损坏时阻断 V4 恢复的问题；补充后续 AI 的存档模块边界。未升级 schema、未移除/覆盖任何存储键、未删除文件。

## 玩家价值与五款参考游戏转译

玩家离开再回来时，约定要保留的角色、背包和成长能可靠恢复；临时远征、客户端偏好与实时合作状态不会混成一份“看起来保存了”的进度。失败时如实说明，尽可能保留旧档供恢复。

| 参考游戏 | 采用的体验原则 | 不照搬 |
|---|---|---|
| Crashlands | 战斗、制作与奖励的长期进度归属清楚，重进后可继续。 | 不复制原作的存档格式、物品链或角色内容。 |
| Terraria | 装备、发现和成长支持多次探索；版本更新不应悄悄清空进展。 | 不复制角色/世界存档结构或进度树。 |
| Minecraft | 玩家、角色、设备和共享世界是不同的数据边界。 | 不复制世界文件格式、方块世界规则或云同步方案。 |
| Don't Starve Together | 合作连接与个人/世界持久状态必须分清，掉线本身不代表已保存。 | 不复制世界主机、死亡或回档机制。 |
| Stardew Valley | 日常生活和社区进步能够延续；由各领域 owner 决定哪些变化值得保存。 | 不复制农场日历、NPC 数据格式或日常系统。 |

这些只描述玩家体验方向。Core Save 协调可靠保存与恢复，不拥有战斗、NPC、农场或物品规则。

## 当前 V21 源码事实

以下是本工作区源码观察，不代表远端分支、浏览器实档或多人生产验收；实现前必须重新检查启动路径和全部写入者。

- `survival-v21.html` 先加载 `modules/core/runtime-state.js`，之后才加载玩法模块。它定义 V5 key `abyssal_wake_save_v5`、旧 V4 key `abyssal_wake_save_v4`，保存姓名、坐标、HP、饥饿、理智、inventory 和 `hasLeftCamp`。当前 working copy 的 `saveLocal()` 在写入成功时返回 `true`，失败返回 `false`；定时/即时调用者是否把失败展示给玩家要逐个核对。
- V5 是浏览器本地单玩家记录，不是账户云存档或共享世界数据库。V21 Relay presence/broadcast 不构成持久化证明。
- `loadLocal()` 先尝试 V5；有效 `v===5` 时恢复并优先返回，否则再尝试 V4。当前代码不再使用 V1 文档曾提到的 48 小时过期判断。
- **本轮确认并修复：**V5 JSON 解析与 V4 读取原先共用一个 `try`。V5 内容损坏时会跳到外层 `catch`，即使有效 V4 还在，也不再尝试它。现在两个版本各自隔离读取失败；V5 解析/恢复失败后仍尝试 V4。损坏 V5 key 保持原样，不删除、不覆写、不自动迁移。
- 其他可见本地键包括 HOME 的 `abyssal_home_workbench_v1`、Guide 的 `abyssal_guide_v7`、V9 gameplay 的 `abyssal_v9_gameplay`、设置的 `abyssal_wake_settings_v1`。这些由自己的领域/UI 模块写入，尚未形成统一 Save service。此清单是已发现示例，不是全仓完整盘点。
- `modules/world/awakening-expedition-loop-v1.js` 的远征 attempt/phase 是 session-local；HOME Field Rig 的返程资格由 HOME 模块独立保存。二者不是同一种数据范围。
- 测试 `tests/player-save-v5-migration.test.mjs` 现在覆盖陈旧 V5 仍恢复、有效 V5 优先、V4 fallback 以及损坏 V5 后有效 V4 可恢复。`tests/awakening-home-workbench-upgrade-v1.test.mjs` 覆盖 HOME 持久化边界与成本/协议回归。它们是 Node fixture，不等于真实浏览器刷新、隐私模式或跨设备验收。

## 唯一状态 owner 与模块边界

**Core State & Save 拥有：**获批持久化范围的 envelope/version、编码/解析边界、校验与迁移顺序、存储 provider 接口、写入成功/失败结果和恢复协调。它不拥有领域状态的含义。

| 领域/调用者 | 领域 owner 保证什么 | Core Save 负责什么 | 不可越界 |
|---|---|---|---|
| Character & Progression | 身份、属性、技能、解锁的语义与合法状态 | 按获批片段恢复/保存 | 不创造角色成长规则。 |
| Survival & Needs | HP、饥饿、理智及死亡/恢复语义 | 按既定 schema 保存/恢复 | 不重算伤害或生存数值。 |
| Items & Inventory | 物品数量、装备与原子交易状态 | 按获批结构持久化与兼容 | 不授予物品或结算制作。 |
| HOME & Building / NPC / Quest / Farming / World | 各自定义哪些状态有长期意义及可恢复范围 | 协调获准的版本化片段 | 不把临时 phase 自动升级成永久进度。 |
| Network & Co-op | 会话/协议与服务端能力边界 | 未来只经独立批准的持久后端接口协作 | Relay 广播、presence 或客户端值不是 save authority。 |
| UI settings | 设备偏好及自己的设置 key | 保持配置域独立 | 不把按键/对比度/减少动态写进角色世界档。 |
| Rendering / Animation / Audio / Input | 只读状态并呈现/发送 intent | 无领域写权限 | 不从画面表现反推或篡改存档。 |

未来各领域可以输出可校验的 serialize/restore slice；是否引入集中 envelope、备份、云同步或冲突解决均为 **PLANNED / UNKNOWN**，需各自合同与可回退方案，不因本次 V4 fallback 修复而自动获批。

## 后续单模块任务与数据保护

每一任务必须只指定一个主责模块和精确文件范围。开始任何格式迁移前，先全仓枚举 `localStorage` / `sessionStorage` 的 key、读写者、字段、触发时机、清理行为及测试；将 V21 事实与 successor 目标分栏。

- 不删除、清空或覆盖旧 key；不添加“重置存档”按钮或自动清理。
- 不更改 V4/V5 key、字段语义、保存频率、Relay payload 或 provider，除非另有明确迁移任务、备份/恢复步骤、旧档夹具和失败回滚验证。
- 坏 JSON、缺字段、类型不符、极值、只读/配额失败、V5/V4 同时存在、迁移重复执行，都要有确定结果。更新/迁移失败时保留原始字节或独立旧键作为恢复证据；绝不对用户谎报成功。
- 任何确认 bug 都先用回归复现，再做最窄可逆修复；目标测试后跑相邻领域测试和最终 diff 检查。旧来源/未跟踪数据全部保留。
- 双标签竞争、刷新、浏览器限制、跨设备/云端、服务端世界持久化未实测时一律 **UNKNOWN**。不得把“Node 测试通过”扩写成“不会再有 Bug”。

## 视觉与体验验收

存档 JSON/字段不需要美术验收；本模块涉及玩家可见的“已保存/保存失败/恢复了旧档”等状态提示或恢复 UI 时，必须遵循根目录 `ART_BIBLE.md` 与整体 UI 可读性：简洁、现代、与游戏视觉统一，不能靠高分辨率概念图代替实际呈现。若该任务有可见 UI，在真实 `1280×720` 桌面和 `390×844` 手机视口核对文案层级、对比度、裁切和操作反馈；没有真实画面证据标 **UNKNOWN / NOT ACCEPTED**。数据完整性仍以原始值、恢复行为和回归测试验收，不能以图标锐利替代。

## 本轮 Bug 修复与验证状态

- **CONFIRMED before fix：**V5 原始值为坏 JSON 且 V4 有合法记录时，隔离 fixture 重现库存未从 V4 恢复；原测试只覆盖 V4 单独存在和 V5 优先，没有覆盖此组合。
- **FIXED in current working copy：**V5 读取/应用与 V4 fallback 分开捕获异常；没有改 key、schema、V4/V5 优先级、字段或写入数据。V5 坏档保留不动。
- **PASS：**`node tests/player-save-v5-migration.test.mjs`；`node tests/awakening-home-workbench-upgrade-v1.test.mjs`。真实浏览器、多标签页、跨设备和完整全仓存储写入者矩阵仍 **UNKNOWN / NOT ACCEPTED**。
- 工作区原本含未知来源更改。本轮只定点更改 `modules/core/runtime-state.js` 中 `loadLocal()` 与该迁移测试；不得把该文件其余已有 diff 归到本次，也不得清理其他并行工作。

## 可复制给后续 AI 的目标

```text
本次只负责 ABYSSAL WAKE 的 Core State & Save。先读 PROJECT_CHARTER.md、PROJECT_STATE.md、SUCCESSOR_MODULE_MAP.md、本卡、V1 历史卡、MODULE_MAP.md、相关 save/HOME/Expedition 合同和测试；重新核对 branch、HEAD、dirty worktree、V21 loader、各 key 全部读写者。聊天与旧 handoff 只是线索。

唯一目标：【填写一个可复现的存档错误，或一项经批准的本地保存行为】。先复现并保存测试证据，说明会影响哪项玩家进度；列出精确允许文件、主责 owner、相邻模块与回归测试。默认不迁移 schema、不清 key、不加 reset/云档/世界持久化。每项数据语义由原领域 owner 决定；Core Save 只协调已批准的格式、校验、写入结果和恢复。

不能删除、重置、覆盖未知来源文件或唯一用户数据；迁移任务先给可回滚备份和失败恢复夹具。改动后跑目标回归、相邻 HOME/Inventory/Expedition 回归，检查存档 key、字段、Relay payload 与完整 diff。不要把 Node fixture 描述为真实浏览器、多标签或跨设备通过。

如果玩家可见保存/恢复 UI 有变化，按 ART_BIBLE.md 在 1280×720 与 390×844 真实视口核对文字与操作清晰；不涉及可视 UI 时写明不适用。最后用简单中文报告玩家能感受到的改善、确认的 bug、测试结果、可能连带影响和未验证部分。不提交、不合并、不部署。
```

## 当前结论

Core State & Save 是规划中的 canonical owner；V21 仍有多个本地存储键和分散写入者。当前 working copy 已修复“损坏 V5 阻断 V4 fallback”并通过两项定向 fixture。完整存储清单、用户可见保存失败反馈、浏览器实档、并发写入、跨设备及持久世界均 **PLANNED / UNKNOWN / NOT ACCEPTED**。

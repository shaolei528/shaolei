# HOME & Building — Field Rig 可见升级模块卡 V1

**状态：Field Rig 基础升级玩法已存在；本卡提出的可见场景升级为 DRAFT / NOT IMPLEMENTED / 等用户决定是否保留**  
**本轮主责：HOME & Building（提出可见设施切片）**  
**当前既有 owner：Field Rig Upgrade V1（同时承载升级入口、材料 gate/扣费和 tier 状态）**  
**未来建议配合：Rendering & Camera、Interaction & Gathering、Items & Inventory、Core State & Save、Integration & QA；这些边界并非当前都已有独立 service。**  
**目标：**让玩家完成现有 Field Rig 升级后，在 SafeCamp 实际看见营地设施成长，同时保持当前玩法数值、物品、存档和联网规则不变。

## 1. 为什么先做这一小块

玩家刚完成 MIRE MART 远征并回到 HOME 后，现有升级已给出玩法奖励；这一卡只提议补上与之对应的**可见成长**。这样将 Minecraft 的家园表达、Stardew Valley 的温暖社区成长、Don't Starve 的出发准备、Terraria 的探索回报与 Crashlands 清楚的反馈，接到同一条 HOME → 远征 → 回家成长循环里。

不在此卡新增自由建造、基地防御、仓库、发电、农业或新升级数值。目标是一个旧升级的一种清楚场景表达，避免把多个系统又绑在一起。

## 2. V21 当前事实

- **VERIFIED（入口）：**`survival-v21.html` 在 V21 加载 `modules/safe-camp/home-workbench-upgrade-v1.js`；顺序上它在 Awakening 世界和远征模块之后。
- **VERIFIED（已有规则）：**首次完成 MIRE MART 返程后，玩家可在 SafeCamp 工作台花费 3 stone + 2 shard 升级 Field Rig。升级把下次离营护佑时间从 15 秒改为 25 秒。状态包含 tier 1/2、返程资格和时间，保存在独立 localStorage key `abyssal_home_workbench_v1`。
- **VERIFIED（回归）：**本轮直接运行 `node tests/awakening-home-workbench-upgrade-v1.test.mjs`，通过；输出确认 MIRE MART return → HOME Field Rig、成本 3 stone + 2 shard、15s→25s、local-player persistence、Relay protocol unchanged。
- **VERIFIED（渲染连接检查）：**本轮搜索 V21 renderer 和 runtime 引用后，`ABYSSAL_HOME_WORKBENCH_V1` 只被远征模块读取返程资格、被 simulation 读取离营 ward；renderer 没有读取其 tier 或 `field-rig` 外观选择。当前 SafeCamp 的相关 prop 使用硬编码 2D world 坐标。源码尚无证据说明 tier 2 会在游戏场景出现实体视觉升级，也没有独立的 HOME 设施位置/投影 owner。
- **UNKNOWN：**真实浏览器里升级前后的场景画面、手机比例下可读性、该结论是否被未加载的其他运行入口改变。实现前需重新检查完整活动 renderer 和真实场景。

## 3. 一件原创内容候选：海岸整备棚

**概念名：海岸整备棚 / Breakwater Field Rig**  
**内容状态：DRAFT；不是游戏内新建筑，亦不是 production 美术。**

将已有 Field Rig 描绘成 HOME 里一处由现代沿海城市旧物修复而来的整备设施：保留现有工作台可辨认轮廓；Tier 1 是帆布遮雨布、木箱和少量工具的临时修理位，Tier 2 是加固的旧公交候车亭/海事维修柜组合，增加护板、暖色电池灯、挂起的工具和收整好的出发装备。升级变化要让玩家一眼认出“我把营地整备设施修好了”，并和 HOME 的温暖灯火形成对比；不添加标牌文字、假数值或新的交互承诺。

概念美术要求（交给未来负责画这项内容的 AI）：

- 采用项目视觉目标 **Modern High-Detail Pixel Art**；用户选定 **3/4 斜俯视**作为目标方向，但目前 SafeCamp 仍使用直接 2D 坐标。概念图可以探索斜俯视构图；不得假设当前 renderer 已支持该投影，也不得在小原型和运行画面验证前锁定最终 sprite 朝向/比例。
- 以游戏实际设施尺寸为准确定像素密度；先查 `ART_BIBLE.md` 和现有素材合同，不能拿一张高清概念图直接缩放进游戏，也不能擅自套地形瓦片尺寸。
- 设施底边/锚点清楚，透明边缘干净；灯具发光范围克制，不糊角色、提示、UI 与通路。保留损耗和修补痕迹，但整体仍干净、可靠、让玩家安心。
- 先把 Tier 1 / Tier 2 并排概念稿放进 `docs/content-inbox/`，同时说明材质、锚点、屏幕占比和投影假设；用户决定概念方向且美术负责人确认活动合同后，才产出合同尺寸源图。概念阶段不得写共享 art intake、preview manifest 或 production manifest，不覆盖来源未知的并行素材；概念图不自动成为正式素材。

## 4. 状态 owner 与边界

| 模块 | 唯一责任 | 本卡允许读取/请求 | 不得代替 |
|---|---|---|---|
| 当前 Field Rig Upgrade V1 (`home-workbench-upgrade-v1.js`) | 目前实际负责 tier、返程资格、材料 gate 与扣费、创建/绑定工作台按钮、独立 localStorage 写入和 ward 时长 | 提供 `getState()` / `departureWardMs()`；simulation/expedition 已读取相应 API | 这不是独立 Items/Interaction service；本卡不搬移当前行为 |
| 当前 Inventory / Save / Relay | Field Rig 代码直接读写既有全局 `inventory`；tier 存在 `abyssal_home_workbench_v1`；Relay 不承载本 tier | 维持现有材料对象、key 与网络行为 | 不得描述成已存在通用 Inventory API、Core Save schema 或多人建筑权限 |
| 未来 HOME & Building（建议边界） | 设施身份/布局定义；待世界坐标与投影合同明确后决定设施位置；将规范 tier 映射为外观 variant | 从现有 Field Rig API 读取 tier；向 Renderer 提供只读设施描述 | 不另存 tier，不扣费或修改 ward，不假设现在已有设施位置 API |
| 未来 Interaction / Items（建议边界） | 将来若重构，再由 Interaction 发请求、Items 执行材料变更，并由 Field Rig owner 裁决升级 | 当前卡只复用现有工作台入口 | 不声称这些边界已由当前代码实现，不在本视觉任务搬职责 |
| 未来 Asset Pipeline / Rendering & Camera | Asset Pipeline 校验原创外观及 anchors；Rendering 将确认 tier 绘成清晰的 visual variant 并处理排序/缩放 | 读取 canonical tier 和经验证的场景坐标 | 不写 tier、不发物品、不改 ward、碰撞或任务完成 |
| Save / Network | 保留既有本地 key 与 Relay 边界 | 若将来建筑要共享/移动持久化，另立迁移与权限设计 | 本卡不新增 save 字段、Relay 事件或跨玩家建筑权限 |

**重要实现检查：**现有 Field Rig tier 位于 `ABYSSAL_HOME_WORKBENCH_V1` / `abyssal_home_workbench_v1`；它是本功能当前唯一 tier 状态来源。Renderer 应派生外观，不能复制 tier。现在 SafeCamp 坐标写在 renderer 的 2D 调用中，尚无独立设施 placement API；先确认真实 draw hook、坐标、投影和遮挡顺序。未来再拆 Inventory/Interaction owner 属于独立架构任务，不得夹带进本视觉切片。不要直接把玩家 localStorage tier 当成多人世界权威。

## 5. 独立任务范围与验收

若用户之后选择实施，第一步由 AI 重新核对 branch/HEAD/脏工作区、加载顺序、`ART_BIBLE.md`、素材合同和活动 renderer。此卡当前**没有指定运行时代码触碰清单**；第一步先静态追踪可以安全接入的现有 draw hook，并把准确文件名单、修改范围和回归清单报告出来，再开隔离的小实现任务。不能顺手重构整个渲染器或更换 SafeCamp 地形，也不能编辑活跃美术负责人正在处理的同一批图、atlas、intake 或 manifest。

实施只允许做到：现有 Field Rig tier 1 与 tier 2 分别显示不同的、稳定且清楚的场景外观；等级由现有模块提供；装饰不改变碰撞、交互距离、movement、伤害、ward 时长、材料、存档格式、Relay 或其他模块状态。固定建筑坐标/遮挡规则须复用经过验证的场景合同；若没有则先列为 blocker，不凭图猜位置。

验收要求：

1. tier 1 与 tier 2 在游戏实际 SafeCamp 画面中差异明显，且正确朝向/底边锚点，不被角色或建筑遮挡顺序盖错。
2. 原始像素清楚；在桌面与手机实际显示尺寸不模糊、不粗马赛克、不失细节；没有浏览器截图就标 UNKNOWN。
3. tier 状态读取失败、存档缺失或加载预览素材失败时回到安全的既有外观，不误显示已升级或阻断启动。
4. 运行原有 `awakening-home-workbench-upgrade-v1.test.mjs`，保留 MIRE MART 资格、3 stone + 2 shard 恰好扣一次、15s→25s、Save key、返回失败路径与 Relay 未变；新增 selector 回归，证明 tier 1/2 选择各自视觉且 selector 不写状态、不再次扣费。原测试没有覆盖场景视觉选择、素材回退或浏览器清晰度。
5. 审阅完整 diff 和工作区来源；不删除现有图片或文件，不改正式 manifest，不合并、不部署。浏览器、手机、双客户端未实际验证时写 UNKNOWN。

## 6. 给后续单模块 AI 的复制提示

```text
你本次只负责 HOME & Building 中的“Field Rig 可见升级”设计/接入，不创建第二套建筑升级或自由建造系统。先读本卡、PROJECT_CHARTER.md、PROJECT_STATE.md、ART_BIBLE.md、MODULE_MAP.md、现有 home-workbench-upgrade-v1.js 和 V21 renderer。核对 branch、HEAD 和 dirty worktree。

已存在的状态 owner 是 ABYSSAL_HOME_WORKBENCH_V1：读取 `getState().tier`。不得修改其返程资格、3 stone + 2 shard 扣费、tier、存档 key 或 15s→25s 的玩法数值。Rendering 只能根据既有 tier 显示不同视觉；不生成碰撞、奖励、交互权威、Relay 消息或另一份保存状态。

先指出 renderer 中真实的 SafeCamp draw hook、两个 tier 如何选择画面、最小文件清单及相关回归，再等用户选择具体实现切片。若用户选择视觉实现，仅做单个设施预览切片，遵守项目实际素材合同与 Modern High-Detail Pixel Art / 3/4 斜俯视目标。保护所有脏文件，不删除/覆盖现有素材；运行对应测试、审阅完整 diff。没有实际浏览器/手机画面就不宣称高清视觉验收通过。
```

## 7. 下一步

一个可选的、可见的 Home 成长切片是：先只设计 Field Rig Tier 1/Tier 2 的同屏对照概念，等用户认可后再由美术负责人依现有合同生产候选，最后由独立渲染任务接入并在运行画面验收。此路线不扩建整个 HOME，也不更改已有升级玩法。

**本轮交付为 DRAFT 设计卡。除了上述既有回归测试，本轮没有编辑游戏代码、美术素材、manifest、存档或 Relay。**

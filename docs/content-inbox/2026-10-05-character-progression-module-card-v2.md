# Character & Progression — 独立模块任务卡 V2

**状态：DRAFT / PLANNED；V21 仅有基础角色/生存字段，没有已核实的通用成长系统**  
**唯一主责：Character & Progression**  
**目标体验：**让玩家知道“我是谁、这次出行如何成长、下一趟能怎样准备”，并把成长放进 HOME → OUTSIDE → HOME 循环。卡片定义未来单一 owner，不声称 successor 角色/API 已实现。

## 五款参考游戏的原创转译

| 参考游戏 | 转成《深渊苏醒》的体验原则 | 验收时玩家应能看到什么 | 不照搬 |
|---|---|---|---|
| Crashlands | 获得成长时立刻反馈，能力解决真实遇到的问题。 | 明确说明“何时获得、改变了什么、现在可做什么”。 | 不复制原作技能、角色或物品链。 |
| Terraria | 逐步开启地点或应对方法，门槛有原因。 | 每个角色能力/成长解锁显示其前置事实与适用范围；地点是否开放仍由 POI owner 判定。 | 不复制职业、Boss 阶段、装备阶梯或技能树。 |
| Minecraft | 角色外观表达玩家个性。 | 外观改动不会静默改伤害、生命、移动或掉落。 | 不复制皮肤、方块人造型或数值规则。 |
| Don't Starve Together | 成长选择帮助准备远征，代价清楚。 | 若未来有路线取舍，出发前能读懂作用与限制；不靠隐藏惩罚逼出固定流派。 | 不复制角色专属被动、理智或死亡惩罚。 |
| Stardew Valley | 角色成长让回家和社区参与有意义。 | 成长可消费已确认的社区/任务里程碑；NPC 好感、请求和社区事实由 NPC / Quest owner 提供。 | 不复制技能职业、关系表或日历/任务内容。 |

只借鉴玩家体验，不复制受保护的角色、技能、外观、数值、文字、地图或完整系统。当前不决定采用 XP、等级、职业或技能树。

## 当前源码状态（2026-10-05 工作区快照）

- **VERIFIED：**V21 `modules/core/runtime-state.js` 中有临时 session id、姓名、颜色、位置；HP、饥饿、理智由 Survival 当前行为处理；inventory 独立保存物品与 knife/lantern 标记。它们说明旧实现的数据位置，不等于 Character 已有独立 owner/API。
- **VERIFIED（有限搜索）：**检查了 V21 loader 下 `modules/`、`survival-v21.html`、successor preview JS 和 tests；未找到明确 XP、角色等级、技能点或玩家技能成长 API。shell/远征展示 `Lv.1` 等概念不可当成功能。搜索只覆盖当前工作区可见源码；动态外部依赖和未提交未知代码不在结论内。
- **VERIFIED：**当前 `modules/items/inventory-transactions-v1.js` 只负责木/石/碎片等两种既有制作交易和 `knife`/`lantern` 物品状态提交；Crafting 调用它。它不是 Character progression/unlock API，也没有证据说明技能解锁或成长点已实现。
- **VERIFIED：**Core State & Save V2 对工作区做过窄存档修复：坏 V5 不再阻断有效 V4 fallback，fixture 覆盖拆分 V21 runtime 与旧聚合入口。该修复没有添加任何角色成长字段；`save_v5` schema/key 未因此扩展。远端 push/浏览器实档状态需另行核实。
- **VERIFIED（视觉状态）：**现有 3/4 successor 预览复用 V21 玩家状态/旧角色贴图。2026-10-05 浏览器回顾在 `1280×720` 与 `390×844` 都判为 **REVISE**：地面粗糙/重复，角色偏小且细节不足；手机 HUD 和控件空间拥挤。此证据是浏览器预览，不是实体手机或正式发布验收。
- **UNKNOWN：**当前 sprite sheet 的正式角色帧、anchor/基线、succesor 角色尺寸合同、角色面板真实运行效果、物理设备清晰度。开工必须检查 `ART_BIBLE.md`、正式 manifest 与 active renderer；不能从图里的 Lv.1、通用旧帧或静态拼图推断合同。

当前等级、XP、技能点、角色属性构筑、角色外观选择、成长存档和多人共享成长均为 **PLANNED / NOT IMPLEMENTED / NOT ACCEPTED**。没有发现 bug 不代表全游戏无相关错误。

## 唯一 owner 与边界

**Character & Progression 拥有：**玩家语义身份/自选外观偏好，角色属性与技能规则、角色成长资源和由角色规则批准的能力/技能解锁。未来新增规则需单独由用户选定；本卡不发明经验曲线或奖励数值。

| 邻接模块 | 它拥有 | Character & Progression 可以怎样协作 | 不能做什么 |
|---|---|---|---|
| Core State & Save | 保存 envelope、版本、校验与迁移；V21 当前暂存姓名/状态 | 提供获批的角色 state slice；由 Save adapter 持久化 | 每个角色功能私写 localStorage、新开 save key 或扩 V5 schema。 |
| Survival & Needs | HP、饥饿、理智、死亡/恢复 | 只在定义过接口后提供属性修正请求；面板读取 Survival snapshot | 复制 HP/needs，绕过 Survival 直接调数值。 |
| Items & Inventory | item ID、数量、装备拥有/装备状态、原子物品写入 | 依据 Inventory 提供的只读状态呈现装备要求 | 把背包装备当成角色技能或改 inventory。 |
| Crafting & Processing | 配方规则、站点与制作交易 | 向 Crafting 提供已确认的角色解锁/资格查询（仅未来） | 自己扣材料或让制作动画发放成长。 |
| Combat & Weapons / Creatures & AI | 攻击合法性与已接受伤害；Creature 的 mob HP/life 和一次性 defeat | 仅消费确认的击杀/战斗结果作为候选成长事实 | 从动画、客户端命中或单个 mob snapshot 推断击杀并发 XP。 |
| Loot & Rewards | 奖励资格、选择、唯一 claim | 让其处理受批准的物品奖励；独立角色成长资格要先定义 owner/事件合同 | 重复奖励逻辑或重放时多发成长点。 |
| POI & Exploration | POI 身份、发现、实际远征阶段 | 消费明确的已确认发现/完成 milestone | 自行开地图、改碰撞或复制远征状态机。 |
| Quest & Narrative / NPC & Social | Quest 接受/完成/剧情标记；NPC 身份、关系、对话、offer | 消费已确认的角色成长来源 | UI 点击/对话本身直接解锁成长或关系。 |
| UI & Map / Input & Accessibility | 面板展示和标准化输入意图 | 提供只读 Character snapshot 与选择请求 | UI 维护第二份等级/属性，按键直接改成长状态。 |
| Rendering & Camera / Animation / Audio | 摄影机/绘制与确认事件的表现 | 读取 Character snapshot，表现移动、受伤或成长已确认的反馈 | 用视觉/音效反馈制造能力、伤害或奖励。 |
| Network & Co-op | 既有 relay 合同与传输 | 个人成长暂按本地个人方向规划；多人共享另开合同 | 把客户端广播当权威解锁/持久化。 |

canonical owner 的意义是“由谁决定语义”。V21 的全局 `me`/`inventory` 是迁移中的代码实现，不能反推这些未来接口已存在。

## 单模块拆分路线

1. **CHAR-0：只读来源地图。**标出真实字段、语义 owner、运行时读写、UI 使用、保存范围和回归；不改代码。
2. **CHAR-1：角色身份/状态面板草案。**只显示真实存在的数据，缺少字段时清楚显示未知/未开放；不伪造等级、经验或装备能力。若实施，再由 UI 主责承载。
3. **CHAR-2：成长规则 DRAFT。**提出一个与 HOME → POI → 返回相关的原创选择；列清触发事实 owner、去重/失败、效果边界和玩家可理解的权衡。先由用户决定是否保留。
4. **CHAR-3：单一已选成长原型。**一次只引入一项里程碑与一个选择；说明来源事件如何一次性确认、如何撤销/失败、如何与相邻 owner 协作。
5. **CHAR-4：持久化/多人。**另立任务定义个人/角色/世界归属、离线/重登冲突、迁移备份和两客户端权威。未获批时不碰 save/Relay。

每个实现任务都写清一个主责模块、允许改动文件、来源事件、相邻回归与回滚边界；一次只处理一个具体 Bug 或一个小可见行为。测试发现意外失败时先停下定位，不能为了通过继续扩大重构。

## 高画质角色美术与运行验收

- 原创方向：现代沿海城市幸存者；实用雨衣/救援装备/潮湿海岸生活细节形成清晰轮廓，HOME 光色较暖，OUTSIDE 冷色逐步渗入。衣着、脸部、装备材质要靠组织清楚的像素簇表达，避免 painterly 模糊、噪点、过度装饰或高分辨率源图缩入后变粗马赛克。
- 角色身份表达先当作**外观**；除非 Character 玩法合同明确批准，外观不能暗改 combat、survival、collision 或移动值。不同朝向/状态动画只表现领域已确认状态。
- 不预设像素宽高、帧数、foot anchor、播放速度或色板；先核正式 asset/renderer 合同和当前 successor 投影，再由绘图 AI 生成原生尺寸候选。源图必须保留到运行 1× 像素密度检查，不得随意拉伸/重采样凑合同。
- 当前场景视觉是 **REVISE**，不是角色艺术已通过。本轮没有创建/接入/替换任何图像，也没有要求美术 AI 修改 SafeCamp 地形文件。
- 角色有可见改变时，并排核源图和真实 successor `1280×720`、`390×844` 游戏视口：轮廓/脸/手持物可读、脚底定位正确、遮挡顺序正确、动画各帧不闪烁，手机 HUD 不挤压角色空间。截图需记录浏览器与实际 canvas 尺寸；桌面模拟手机不是实体设备证据。
- 缺任一真实视口证据时标 **UNKNOWN / NOT ACCEPTED**；出现模糊、粗马赛克、颜色混乱、碰撞错位或角色难辨则标 **REVISE**。画质不过关不得把素材接为正式资产。

## 后续 AI 可复制任务

```text
本次只负责《深渊苏醒》的 Character & Progression 模块。开工先读 AGENTS.md、连续性 Skill、PROJECT_CHARTER.md、PROJECT_STATE.md、SUCCESSOR_MODULE_MAP.md、本 V2 卡、Core State & Save V2、ART_BIBLE.md、MODULE_MAP.md 和相关测试；核对当前 branch/HEAD/dirty files、实际 successor 入口与 V21 loader。保护所有未知来源的修改，不要恢复、删除或覆盖文件。

唯一目标：【填写一个用户已选定的可复现角色问题/小可见行为】。先证明当前实现和玩家影响；列精确文件范围、一个主责 owner、输入/输出事实来源、一个目标回归和一个相邻 owner 回归。未选实现目标时只做只读审查或 DRAFT。

Character owns semantic identity/preferences and future character attributes/skills/progression choices. V21 runtime name/survival fields and Inventory equipment bits are transitional code facts. Survival owns HP/needs; Inventory owns item/equipment state; Combat/Creatures/POI/Quest/NPC provide only confirmed source facts; Save owns persistence; UI/Input/Renderer/Animation/Audio cannot mutate progression authority. No XP, level, skill tree, Relay or save schema has been approved. The crafting inventory transaction bridge is not a character progression API.

Do one reversible slice. Add a reproducing regression for a confirmed bug before repair; run target and adjacent tests, check the final diff and stop if an unexpected regression appears. Do not delete data, reset saves, change V5 keys/schema or Relay, merge, deploy, or use another AI's art files. Keep all new mechanics/art marked DRAFT until the user chooses them.

If changing visible character art/UI, inspect the real renderer/asset contract first and compare source against actual 1280×720 and 390×844 successor gameplay. Current preview is REVISE for repetitive/coarse ground and small/low-detail actors. Do not invent sprite dimensions. Without both viewport evidence, report UNKNOWN. End in simple Chinese with player impact, evidence, tests, cross-system risks, and unverified device/online behavior.
```

## 验收条件

1. Character 的 semantic owner 与 Core Save、Survival、Inventory、Combat/Creatures、POI、Quest/NPC 的所有权不冲突。
2. 五款参考经验各自对应到一个可观察的玩家结果，且没有复制内容或系统。
3. 未批准的 XP/等级/技能/存档字段不会被描述为已实现或自动加入。
4. 角色图像只在实际尺寸、投影、锚点和帧合同通过后接受；两种目标视口都需清晰、可读且风格统一。
5. 任何 bug 都有复现/测试证据，修复后做目标与相邻回归，并留下未验证项。

本卡是模块规划和 handoff，不新增角色能力、等级、图像、API、save 字段、Relay 消息或生产素材。

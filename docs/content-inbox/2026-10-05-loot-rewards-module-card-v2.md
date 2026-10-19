# Loot & Rewards — 单一模块任务卡 V2

**状态：DRAFT / PLANNED / NOT IMPLEMENTED as an independent service**
**唯一主责：Loot & Rewards**
**目的：**拆清“来源是否有奖励资格、奖励内容是什么、谁写库存、如何防重复”，并让后续 AI 能只交付一个来源路径。本文不批准掉落表、协议字段、存档迁移、生产素材或 runtime API。

## 玩家体验和五款参考游戏转译

玩家拿到的奖励要让冒险后的选择更丰富、更容易理解；奖励价值支持 HOME、装备准备、探索或社区，不靠大量随机垃圾和重复刷取制造时长。危险和奖励有因果，非必要失败不会暗扣或重复扣库存。

| 参考游戏 | 本模块采用的体验原则 | 不照搬 |
|---|---|---|
| Crashlands | 战斗或探索奖励用途明确，能推动下一次制作/准备。 | 不复制具体物品、掉率、敌人、UI 或奖励表。 |
| Terraria | 少量奖励可以提示路线成长与区域解锁，但层级逐步出现。 | 不复制矿物/装备序列、Boss 奖励或 progression gates。 |
| Minecraft | 资源能服务玩家自选的 HOME/装备表达；Inventory 才负责存放。 | 不复制方块、配方或建造规则。 |
| Don't Starve | 奖励值得承担风险，但不清空下一趟远征的生存压力。 | 不复制季节、饥饿数值、掉率或生存经济。 |
| Stardew Valley | 社区/任务成果能支持家园成长，奖励不替代 NPC 关系或日常本身。 | 不复制居民、任务、日历或礼物系统。 |

只借鉴玩家体验，不引入原作内容。每次切片只验证一个奖励来源与一个玩家收益。

## 当前 V21 代码快照与证据范围

**VERIFIED workspace-source observation (not proof of remote provenance or live game acceptance):**

- `modules/combat/player-combat.js` 的 `rewardKill()` 同时基于 mob kind/随机数选择 shard/food 数量，并决定本地调用 `onLoot()` 或广播 `loot`。因此它混合了来源结算、奖励选择和派发。
- `modules/network/inbound-events.js` 的 `onLoot()` 检查 `target === SESSION_ID` 并夹住 shard/food 数量，然后直接增加 `inventory`、toast、save、updateUI。模块地图的目标边界则要求 Loot 提出/确认奖励，Items & Inventory 独占库存写入；两者目前没有完全分开。
- `tests/awakening-world-logic-hardening-v1.test.mjs` 覆盖单次本地击杀造成一次奖励；仓库里本轮搜索没有发现针对重复/伪造 `loot` 消息的接收端专项测试。精确覆盖需后续重查，不得把单次 lethal path 断言说成重复包安全。
- 从接收函数可确认：payload 没有可见的稳定 claim key/source proof，也没有接收端去重检查。这证明当前 handler **缺少这些验证**；它不能单独证明 Relay 发生了重复投递，也不能证明攻击者在实际部署配置下能成功伪造广播。传输权限/双客户端利用效果需另行核验。
- 没有独立 `loot/reward` runtime service；V21/preview 中其他采集节点也混合目标交互、资源冷却、库存更新与共享消息。不要据此声称模块化拆分已完成。

上述源文件可能在共享工作树内有并行改动。接手时重新核对实际 branch/HEAD、diff、镜像文件、活动 V21 loader 和传输策略；不能归因未知改动或仅凭本卡断言当前远端状态。

## 单一 owner 与奖励交易合同

| 阶段 | 唯一责任者 | 边界 |
|---|---|---|
| 来源资格 | Creatures & AI 发布已确认的一次 defeat；Quest & Narrative 确认任务完成；POI/Interaction 的既有 owner 确认搜索/采集资格 | Loot 不重新判断怪物 HP、任务阶段、POI 存在或资源位置。 |
| 奖励选择与 claim | Loot & Rewards | 校验来源 ID 与批准的 reward definition，生成一次奖励决定；需要稳定的 claim key 和重复/冲突拒绝合同。不能接受 UI/客户端自行报数量。 |
| 库存写入 | Items & Inventory | 唯一持有 item counts/stack/equipment 并原子提交、拒绝或回滚。Loot 不直接修改 inventory、不写玩家 save key。 |
| 传输与持久化 | Network & Co-op / Core State & Save | 仅按各自合同传递/保存经确认的 claim；不能以客户端 Relay 广播本身充当反作弊权威。迁移/新协议须独立审查。 |
| 成功呈现 | UI / Animation / Audio / Rendering | 只呈现确认结果，图像、音效、HUD 数字不改变库存或 claim。 |

**规划中的交易语义（未批准 API）：**已确认来源事件 → Loot 验证 source/reward/claim → Inventory 原子提交 item delta → 成功后确认该 claim → UI/音频/视觉显示。库存失败时不显示成功，重试返回同一结果而不重复写入。若 Inventory/网络/存档 owner 无法提供原子与幂等能力，先记录架构缺口；不得在多个模块各造一套 claim 状态。

在明确 claim authority、session 生命周期、重连、服务器/leader 信任模型和持久化之前，只能限定为当前可验证范围；不能声称抗作弊、永久唯一或跨设备共享安全。

## 范围规则与高画质门槛

- 一次只改/审一个来源（怪物、任务、POI 搜刮或采集），并写主责模块、实际文件 allowlist、一个目标回归和一个相邻模块回归。
- 不在 Loot 任务里改怪物死亡/任务完成条件、物品 schema、库存 UI、采集冷却 owner、Relay 协议、save schema 或 art pipeline。发现相邻问题，记录接口 gap 后拆成独立目标。
- 奖励 icon、世界拾取物和稀有物表现遵守根目录 [`ART_BIBLE.md`](../../ART_BIBLE.md)：原创 Modern High-Detail Pixel Art，轮廓锐利，像素簇有层次；源图高分辨率不能掩盖进游戏后的糊、粗马赛克、压缩噪点或像素密度不一致。
- Asset Pipeline 核对稳定 ID、源尺寸、frame/anchor、alpha 与源密度；Rendering & Camera 核对采样、投影、UI/世界缩放。无来源合同的尺寸标 `UNKNOWN`，不猜尺寸或重采样凑尺寸。
- 必须在真实奖励 HUD/拾取场景检查桌面 `1280×720` 和手机 `390×844`：图标材质可辨、数量/稀有度清晰、拾取反馈不盖住危险信息，缩放后保持 crisp。原图、静态合成或图片加载通过都不等于验收。
- 任一真实视口/设备证据缺失即标 **UNKNOWN / NOT ACCEPTED**；看到模糊、粗马赛克、细节损失、伪造掉落反馈标 **REVISE**，并描述具体原因。

## 最小回归清单

- 合法来源、无资格来源、未知 reward ID、非法/超限 item delta 的结果符合合同；拒绝请求不部分写库存。
- 对同一 claim 重复提交、快速重试、两个客户端同时领取和断线重连：最多一次库存提交，失败/中间状态能被明确报告。
- Combat 击杀事件必须来自 HP 正常跨越至 defeat 的一次确认；挥空、不致死命中、已死亡 mob 不产生额外 reward。
- 任务奖励由 Quest 的已确认完成事实触发；NPC 台词、UI 点击或旧阶段快照不能绕过 Quest。
- 搜刮/采集奖励不得因重复交互绕过节点/POI owner；库存数量、HUD、保存和资源冷却保持一致。
- 不触及的 combat 数值、item ID、保存格式、Relay payload 保持现状并做必要回归；只读测试不证明 live Relay policy、多客户端安全、手机体验或 production art。

## 可复制的后续 AI 目标

```text
本次只负责 Loot & Rewards 的一个已存在奖励来源。先读取 PROJECT_CHARTER.md、PROJECT_STATE.md、SUCCESSOR_MODULE_MAP.md、本卡、ART_BIBLE.md、MODULE_MAP.md，并核对当前真实 V21 启动顺序、奖励发送/接收函数、传输策略、存档/库存 owner、branch/HEAD/diff。

唯一目标：【填一个具体可复现奖励 Bug 或一个小奖励来源审计/实现】。主责只能是 Loot & Rewards；先区分来源资格、奖励选择、Inventory 提交和 UI/Network 呈现。说明目前证据能证明什么，不能证明什么；若重复包/伪造消息未在真实 Relay 复现，标 SUSPECTED / UNKNOWN，不把源码缺少去重直接叫作已证实利用。

明确允许文件和排除文件，保护共享工作区未知修改。实现前增加能复现所选问题的测试，做最小修复，然后跑该来源测试、Inventory/Quest/Combat 相邻回归并检查最终 diff。不要改 item schema、save、Relay 协议或 client/server authority，除非该目标独立授权并完成兼容审查。

奖励素材和 HUD 必须通过 ART_BIBLE.md 的原生高细节像素合同，在真实 1280×720 与 390×844 运行画面检查清晰度；没有画面就标 UNKNOWN。最后用简单中文报告：玩家影响、证据等级、谁负责每一步、变更、测试覆盖、可能连带问题和未验证项。不提交、不合并、不部署。
```

## 当前状态

V1/V2 是设计合同，不是独立服务实现。现有 V21 击杀奖励选择、网络发送、库存接收和存档仍然分散；claim 去重、传输信任、双客户端唯一性、production icon 和实机视口均 **UNKNOWN / NOT ACCEPTED**，直到各自有对应代码与证据。

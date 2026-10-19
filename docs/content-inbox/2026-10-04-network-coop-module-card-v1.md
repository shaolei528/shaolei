# Network & Co-op 模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED（模块蓝图）；NET-1 超时修复已写入当前本地工作区，尚未提交，真实 Relay 未验证。**  
**主责模块：**Network & Co-op  
**协作模块：**Core State & Save、World & Terrain、Combat & Creatures、UI & Input、Integration & QA  
**目的：**界定多人连接、消息传输、客户端模拟、玩家存档和未来共享世界持久化的边界，并列出可由后续 AI 分别处理的验收切片。

> **Canonical routing:** use [`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md). Older collaborator labels “Combat & Creatures” and “UI & Input” are grouped references only; route to **Combat & Weapons** / **Creatures & AI** and **UI & Map** / **Input & Accessibility** separately. This card's sole lead remains Network & Co-op.

## 玩家价值与参考游戏启发

合作应该让玩家能一起出发、彼此看见和交流、分工探索与战斗，并在掉线后清楚知道当前状态。借鉴 Minecraft 的共同空间与玩家协作、Don't Starve Together 的准备和分工、Crashlands 的即时战斗反馈；不把简单 Relay 误说成安全服务器、永久世界或完整多人权威。

## 当前可核实的 V21 结构

以下是源码事实，不等于线上双客户端验收：

- survival-v21.html 加载网络会话入口、入站/出站同步、聊天和 Relay V16；Relay V16 使用 abyssal-relay-v1。
- 当前 Worker 位于 cloudflare/src/index.js。它提供 WebSocket Relay、presence 与频道广播；源码常量限制单包 48 KiB、单 socket 每秒 120 条消息、最多 8 个频道。
- Worker 会为特定玩家身份事件规范化发送者 id/name，并从频道规范化部分 zone 字段；它没有在服务端运行战斗、碰撞、掉落或世界玩法规则。因此身份规范化不等于游戏规则权威或作弊防护。
- Global 频道承载聊天、地图位置与 presence；Zone 频道承载移动、攻击、怪物/世界快照、命中、掉落、采集和 state_req 等消息。
- 当前 Zone leader 由连接客户端根据 presence 选出，并在本地模拟/广播部分怪物世界状态。这是客户端协调方案，不是服务器权威。
- worker 的连接状态附着在 WebSocket 上；源码没有证明玩家世界状态以 Durable Object 持久数据存储。实时 Relay、玩家本地存档和未来共享世界持久化是三个独立问题。
- 现有本地模拟测试不等于真实 Worker、公共 Relay、双客户端、移动设备或长时间连接测试。

## 模块职责与边界

| 子职责 | 唯一 owner | 职责 | 明确不拥有 |
|---|---|---|---|
| 连接与频道生命周期 | Relay Client | WebSocket、握手、订阅/取消订阅、重连、超时、连接状态 | 战斗伤害、世界奖励、存档 |
| 消息转发和限流 | Relay Worker | 校验连接/频道/包大小/频率，广播消息，规范化选定身份字段 | 权威游戏规则、反作弊裁决、永久世界数据 |
| 玩家本地进度 | Core State & Save | 玩家状态、现有本地存档及兼容 | 共享房间的权威世界写入 |
| 世界模拟/权威 | 现有 V21 玩法模块；未来须单独设计服务端策略 | 当前由客户端玩法逻辑决定并发布部分结果 | Relay 不应暗中变成该 owner |
| 玩家体验 | UI & Map / Input & Accessibility | 显示连接/重连/失败状态，发起加入和重试意图 | 直接修改网络状态、角色权威状态 |
| 协作 QA | Integration & QA | 检验断线、恢复、重复包、区域切换及关键玩法回归 | 代替各系统的领域规则 |

未来若要真正的共享持久世界或服务端权威，必须另立阶段设计世界写入 owner、验证规则、冲突处理、重连恢复、存档兼容和托管成本；不能把 Relay 现状包装成已经具备这些能力。

## 协议与兼容约束

- 未经单独明确选择和全链路验证，不改 abyssal-relay-v1、消息名称、载荷语义、频道命名、更新频率或现有存档格式。
- 不在 renderer、动画、音频、UI 中复制权威游戏状态。
- 不用“在线人数增加”“WebSocket 连通”推断双客户端玩法正确。
- 任何网络修复都要覆盖成功、失败、延迟、重复/迟到确认、断线和恢复；功能失败时 UI 不得显示假成功。
- 不连接公共房间做破坏性或负载试验；真实 Relay/双客户端 QA 采用安全独立房间并明确标记。

## 已发现问题与证据

### NET-1：Zone 订阅确认缺少超时处理

**原始缺陷：CONFIRMED CODE DEFECT；当前工作区：VERIFIED local fix + regression; 真实 Relay 触发频率/行为 UNKNOWN；建议优先级 P1。**

原始实现中 RelayChannel.ready 只在收到 subscribed 时 resolve。switchZoneRelay 等待 ready；没有订阅确认超时或取消路径。如果连接维持 open 但某个 subscribed 确认始终未到，切区会一直 pending，zoneConnected 保持 false，主循环继续关闭。迟到确认会释放 Promise。

**当前工作区修复：**RelayChannel 对 global/Zone 订阅设置 8 秒上限；超时会关闭并移除对应频道，将等待结果安全结束为 null、保持连接门关闭并进入重连提示/重试路径。明确切区关闭未确认频道也会结束等待。迟到 ack 因频道已从映射移除而忽略。未改变 abyssal-relay-v1 或 payload。

新增 tests/network-relay-v16-subscribe-ack-timeout.test.mjs 覆盖 global/Zone 漏 ack、迟到 ack、超时后新 socket 重新加入、快速连续切区、同名频道旧一代 ACK 不得确认新一代，以及协议不变。旧 tests/network-relay-v16-subscribe-ack-hang.test.mjs 只在 ack 尚未到达的即时窗口检查 pending，并覆盖迟到 ack；它不能再被用来声称当前代码会永久挂起。

**最小修复要求：**添加有上限的订阅确认等待，超时后清理对应 pending 状态并走现有可见重连/失败路径；确保迟到的旧频道确认不能把已经切区或关闭的频道误标为当前已连接。保持线上协议和包格式不变。测试无确认超时、确认前关闭、迟到确认、重复确认、快速连续切区和恢复成功；验证主循环只在当前 Zone 确认后开放。

**变更边界：**Relay 源文件及离线恢复测试在开始时已存在未知来源的未提交/未跟踪改动。本轮仅在 RelayChannel 订阅/ready 生命周期和对应调用点增加超时处理，并新增独立测试与 CI step；保留所有其它差异。完整 diff 已在当前工作区核查，但仍需工程负责人审阅合并整份 Relay dirty diff。

### NET-2：浏览器 offline/online 状态恢复

**历史缺陷：CONFIRMED by deterministic fixture。当前工作区修复：本地 fixture PASS。真实浏览器仍 UNKNOWN。**测试覆盖旧 WebSocket 仍报告 OPEN 时 offline、清除 Relay/频道状态并关闭旧 socket、online 后重新握手并恢复 global/zone 订阅，也覆盖启动时离线后恢复。该测试在本轮针对当前工作区串行通过。真实操作系统网络切换、线上 Relay 和双客户端表现仍未验证。Relay 文件与测试在本轮开始前已有来源不明的修改，不能把修复归功于本卡或本轮。

NET-2 暂不重复实现。保留当前实现，后续补安全浏览器/可控网络验收；如果并行工程负责人已有对应任务，先协调文件范围，避免冲突。

## 分阶段工作切片

1. **NET-0：基线和合同。**锁定当前入口、频道、事件、节流、状态 owner 和现有测试；只记录，不改协议。
2. **NET-1：订阅确认超时。**当前本地实现与 fake WebSocket 回归已完成；下步审阅完整 diff、确认接入 CI 后的真实运行记录，再做安全浏览器测试。
3. **NET-2：网络恢复一致性。**本地恢复 fixture 已通过；后续重点是真实浏览器/可控网络验收和检查重连提示、恢复后模拟行为，不重复实现当前工作区已有修复。
4. **NET-3：真实合作流程。**两个独立客户端验证同区移动、presence、聊天、切区、攻击表现与掉线恢复；分别报告 PC/手机。
5. **NET-4：共享世界持久化设计。**只有用户选择持久共享世界后，单独写方案和成本/安全评估；不把设计稿当实现。
6. **NET-5：服务器玩法权威评估。**单独判断是否需要服务端验证战斗/采集/奖励；不得作为 Relay 小修的顺手扩展。

## 本轮定向回归记录

2026-10-04，按串行方式运行以下本地测试，全部通过：

- tests/network-relay-v16-reconnect.test.mjs：模拟握手前断线与已连接后的恢复、恢复 global/zone 订阅。
- tests/network-relay-v16-subscribe-ack-hang.test.mjs：确认漏 ack 会一直 pending，迟到 ack 可以释放等待；这是暴露 NET-1 的测试，不代表该缺陷已修复。
- tests/session-zone-network-entry.test.mjs：加入失败显示重连提示，成功时保留正常欢迎状态。
- tests/network-quality-v20.test.mjs：网络质量分级、模拟更新率和协议兼容夹具。
- tests/network-disconnect-simulation-pause.test.mjs：断线时本地模拟/存档更新暂停，恢复后继续；该夹具不证明真实 Relay 和浏览器生命周期。
- tests/network-relay-v16-offline-online-reconnect.test.mjs：当前工作区离线、在线及启动离线恢复夹具；当前版本通过，验证范围是模拟 WebSocket，不代表真实浏览器验收，也不能据此认领既有代码改动。
- tests/network-relay-v16-subscribe-ack-timeout.test.mjs：本轮新增的超时、迟到确认、重试和快速切区回归；当前通过 fake WebSocket。

**验收边界：**没有运行公共/正式 Relay，没有做双客户端、实际手机或真实浏览器网络切换测试。因此相应体验仍是 UNKNOWN。当前实现和新回归仍在共享的未提交工作区，尚未由独立工程审阅或提交。

## 交给未来网络 AI 的独立任务

先核对 AGENTS.md、Skill、PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md 和当前工作区。审阅 NET-1 当前本地实现及完整 dirty Relay diff，确认频道 ready 超时、断开、迟到 ack、快速切区和重连路径无冲突；检查 CI step 是否正确覆盖新回归。保持 abyssal-relay-v1 和所有 payload 不变，不改战斗、存档、Worker 玩法权威、美术和相机。保留所有无法归属的差异。串行运行相关测试；如有可用本地浏览器安全路线，再验证 UI 的重连提示；不能用 fake 测试代替真实 Relay/双客户端。不得合并或部署。

---
这是系统模块卡与 QA 发现；NET-1 修复仅在当前未提交工作区实现并完成本地 fixture 验证，未提交/部署，真实 Relay 与双客户端验收仍 UNKNOWN。


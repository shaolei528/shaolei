# Audio & Feel 模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED / 供模块分工、用户审阅和后续 AI 接手**  
**主责：Audio & Feel（音频系统与玩家手感验收）**  
**配合：Combat & Creatures、Animation & Presentation、Input & UI、World & Home、Network & Co-op、Performance、Integration & QA**  
**方向：为 successor 定义模块边界；现有 V21 程序音频是可核查基线，不代表最终音效品质已经验收。**

本卡只定义职责、当前实现快照与验收规则，不授权本轮更换音效、修改输入/战斗、运行代码、设备或网络行为。

> **Canonical routing:** use [`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md). Legacy grouped collaborators such as “Combat & Creatures”, “Input & UI” and “World & Home” must be split into named canonical owners for each task. Audio & Feel is the sole lead for sound mix/haptics/feel review; it does not own hit, input, world or HOME state.

## 1. 玩家价值与五款参考经验

声音应帮助玩家知道自己在哪、发生了什么、危险从哪里来，并配合干净的攻击反馈，让 HOME 有安全生活感、OUTSIDE 有压力、MIRE MART 有异常。输入和战斗操作还需及时、可控；“手感”是跨模块体验目标，Audio & Feel 可测量/报告，但不因此拥有其它模块状态。

- **Crashlands：**挥空、命中、受伤、怪物接近各自容易辨认，声音短而有力。
- **Terraria：**探索、挖掘/拾取、危险和成长提示层级清楚，避免所有奖励都用同一声响。
- **Minecraft：**采集、工具、建造声音反映材质和操作结果；不在此重复实现交互规则。
- **Don't Starve Together：**昼夜与危险线索让玩家提前准备；环境声提示威胁，不隐藏必要的视觉提示。
- **Stardew Valley：**HOME 和居民生活有温暖克制的声音细节，休息和日常交互听起来放松。

只借鉴体验，不复制原作音乐、音效、角色声音或声纹素材。

## 2. 当前 V21 音频实现事实

**VERIFIED source：**survival-v21.html 在战斗视觉包装器后加载 modules/audio/playable-feel-audio-v1.js。它建立一个懒创建的 Web Audio Context，只有可信用户手势解锁后才播放；按 master / SFX / ambience 组织 UI、swing、impact、hurt、crawler、campfire、wind bus，并暴露 setMasterGain / setSfxGain / setAmbienceGain 及状态查询。

- 当前主要短音、威胁 cue 和环境声由 oscillator / filtered noise 程序合成；本模块文件不加载 wav/ogg 资源，不证明已有完整的授权素材库或最终音乐。
- 程序会消费 abyssal:player-swing、abyssal:combat-hit、abyssal:player-hurt；事件由玩法反馈层发出，音频仅作表现。命中距离、左右 pan、冷却和音量变化只影响音频选择，不产生伤害。
- 氛围状态由现有 Safe Camp 判定和 World 的 inStore 查询区分 HOME、OUTSIDE、MIRE_MART；约 480 ms 转场，复用 campfire/wind 两个循环，环境细节与 crawler 声音按时间/距离调度。Audio 读取位置和状态，不拥有地区/怪物/昼夜规则。
- 页面 hidden 时 master 静音、AudioContext suspend；页面恢复后仅按用户手势/浏览器状态恢复，不自动假装声音已可播放。AudioContext 不可用时安全静默。
- gain 默认值与状态保存在运行时对象中；本次源码检索未发现这些 master/SFX/ambience 控件已接入玩家设置界面或持久化偏好。后续若要设置 UI，应由 UI 保存偏好、Audio 提供稳定 setter；不能因有 setter 就说玩家已有音量滑块。
- 程序音效模型存在 ≠ 已通过削波、真实响度平衡、扬声器/耳机、手机权限、蓝牙延迟或主观舒适度验收。上述真实听感状态当前为 **UNKNOWN**。

接手者须重查 branch、HEAD、脏工作区、loader 和现有音频/设置 API；本工作区存在并行修改，不能重置或覆盖未知来源文件。

## 3. 职责 owner 与边界

| 责任 | Canonical owner / source | Audio & Feel 可做什么 | 不可越界 |
|---|---|---|---|
| 玩家攻击与命中事实 | Combat & Weapons；敌方生命/defeat 来自 Creatures & AI | 订阅确认的 swing/hit/hurt/death 语义，选择声音 | 不从“收到声音事件”反推命中，不改伤害、冷却、距离、AI 或奖励 |
| 动画、震动与画面反馈 | Animation & Presentation 管画面；Audio & Feel 管 haptic；Input & Accessibility 提供输入意图 | 约定确认事件的时间语义并评估整体同步感 | 不重复触发 hit FX、haptic 或改动画状态 |
| 音频 Context、总线、路由、增益、混音、循环与 transient 生命周期 | Audio & Feel | 单一 AudioContext owner、bus 控制、安全启停、音效/氛围选择 | 不创建重复 mixer、偷绑多个 listener、泄漏无限音源 |
| 地点与环境危险规则 | World & Terrain / POI & Exploration 提供区域事实；Time & Weather 提供时段/天气；Survival & Needs 结算角色效果 | 读取只读环境 cue | 不决定 POI、怪物生成、昼夜、天气或伤害 |
| 按键、触屏和菜单操作 | Input & Accessibility / UI & Map | 仅在合法动作/真实手势之后播放对应提示；区分 UI click 与 attack/use | 不改输入路由、合成重复操作或阻断触控 |
| 玩家音量/辅助偏好 | UI & Map displays settings; Core State & Save persists approved preferences; Audio & Feel applies runtime mix | 提供有边界的 master/SFX/ambience 控制 | 不私写 player save、菜单或新增第二份设置存储 |
| 实际手感与性能归因 | Integration & QA 与对应主责系统 | 建立录音/计时和设备测试记录，指明触发点 | 不把“听着慢”直接归因音频，也不越权改 Input/Combat |

Feel 属于跨模块结果：若 swing-to-feedback 延迟来自输入、动画调度、帧率、Relay 或音频启动，记录证据并把修复交给真正 owner；本模块不成为全游戏逻辑 owner。

## 4. 声音事件与混音设计合同

事件分三类，消费端不可越过来源：

1. **玩家动作语义：**合法攻击开始 → swing；Combat 确认 HP 改变 → impact/hurt；仅死亡状态转换 → lethal/death cue。挥空只有 swing，不能播 impact。
2. **环境状态语义：**HOME / OUTSIDE / POI、昼夜与未来 weather 由 World/Survival 提供只读摘要；离开 Camp 的距离衰减或 POI atmosphere 只影响声场参数。
3. **UI 语义：**一般按钮只播轻量 UI click；Attack/Dash/Use 等动作按钮不再触发泛 UI click，避免同按双声。

建议 future API 语义：setBusGain(bus, normalizedValue)、playSemantic(soundId, context)、setAtmosphere(snapshot)。这是设计形状，不是获批 API 名，也不能暗示已有 authored sound assets。

混音要求：master 有安全 headroom；多个瞬态叠加时 limiter/soft ceiling 策略需测量确认；禁止靠把所有类别压得很响掩盖素材差异；同时区分 SFX 与 ambience 调节并支持无声/无 AudioContext 降级。不要写未经测量的 dB 数字作为验收结果。

## 5. 高品质体验硬标准

- **挥空 vs 命中：**挥空 = swing；命中 = swing + 只由 confirmed hit 驱动的 impact；受伤 = player-hurt；击杀具有明确但不过量的区别。不得因 retry/snapshot 双触发重复播声。
- **空间与预警：**附近怪物 cue 在可辨识距离与频率内，不制造错误方向；没有视觉/玩法事件支持时，不凭 Audio 自己生成危险状态。
- **HOME / OUTSIDE 对比：**HOME 温暖但不单调；OUTSIDE 更开放、偏冷且保留安静空间；MIRE MART 异常渐进、不过早使用持续刺耳高频或压过脚步/战斗。
- **响度与频率：**主观体验不得刺耳、爆音、突然过响、长时间轰鸣或掩盖关键 cues；测试同时看 peak/headroom 与实际听感，不能仅凭 gain 小于 1.0 推断无 clipping。
- **重复与生命周期：**有节流/优先级，有限 transient 个数，结束及时 stop/disconnect；同一玩家事件只响应一次；背景切换不叠加永久 loop。
- **输入响应：**trusted gesture unlock 不延迟玩法请求本身；静音/不支持音频时游戏控制仍正常。输入到画面、触觉、声音的同步要记录实际平台和帧率。
- **玩家偏好：**未来可单独调 master / SFX / ambience，偏好持久范围和默认值待设置/存档 owner 合同确认。音乐、语音、字幕或无障碍选项不可宣称已有，除非已实现并验证。

## 6. 未来实现切片（一次只领一个）

1. **AUDIO-0 听感基线：**在当前稳定可运行 build 录制 HOME / OUTSIDE / MIRE MART、UI、挥空、命中、受伤与 crawler cue；桌面扬声器和手机分别记录刺耳、过响、听不清、重复与延迟。没有真实音频设备就保持 UNKNOWN。
2. **AUDIO-1 一种素材替换：**仅选一个 procedural cue 建原创 source、播放规格和音量范围；保留 bus/协议，检查 PC/手机短时及叠加效果。
3. **AUDIO-2 玩家设置：**若用户选择，为现有 master / SFX / ambience setter 接 UI；明确默认、键名、保存/恢复和输入手势回归，不把设置混入游戏进度档。
4. **FEEL-0 同步测量：**针对一个攻击路径测 pointer/key → gameplay accepted → animation frame → audio onset；定量定位延迟 owner，再分派给相应模块，不先做全局大改。
5. **ATMOSPHERE-0 地点扩展：**待 World/Weather 定义稳定只读快照后，再增加一种逐步升级的声音层；不让音效裁决威胁或任务。

## 7. 自动与真实设备验收

### 自动回归

- tests/playable-slice-audio-mixer-v1.test.mjs：总线图、可信手势、懒加载、静音/隐藏、瞬态回收、ambience 生命周期与长时间 swing soak。
- tests/playable-slice-atmosphere-audio-v1.test.mjs：HOME/OUTSIDE/MIRE_MART 场景切换、480ms crossfade contract、500 次切换不堆循环、后台往返。
- tests/playable-audio-retry-idempotency-v1.test.mjs：重复加载 50 次仍只有一个 Context、单 listener/interval、单次事件处理。
- tests/playable-slice-feel-audio-v1.test.mjs：合成 cue、静默 fallback、手势解锁、后台暂停与战斗事件桥。
- tests/playable-slice-smoothness-v1.test.mjs：长时间 transient 停止回收、scheduler 与 mobile attack wrapper 观察。
- 以上测试在本卡整理时依次通过。它们用 Fake AudioContext / VM 证明结构和调用合同，不证明真实音质。

### 真实听感/运行时验收

- 至少一台桌面与一台手机，真实运行 V21 或 successor 指定 build；记下浏览器、设备、输出设备与 master/SFX/ambience 设置。
- 分别试听 HOME、OUTSIDE、MIRE MART；连续播放 10 分钟、切 foreground/background、蓝牙耳机断连、音频不可用和多声音叠加场景。
- 对比挥空、确认命中、受伤、近处怪物；确认事件恰一次、能听懂方向/危险、没有刺耳/削波/轰鸣/掩盖对话或战况。
- 录制或仪器观察峰值/headroom，不能只凭音源代码判断不会 clipping。主观舒适度和实际同步要由人/真实设备确认。
- 缺少设备/听音/浏览器证据时写 **UNKNOWN / 未验证**；FakeAudio test 不能替代真实感受。

## 8. 下一 AI 可直接领取的任务提示词

你负责 ABYSSAL WAKE 的 Audio & Feel 模块。本卡是当前模块边界与验收草案。开始前读 PROJECT_CHARTER.md、PROJECT_STATE.md、MODULE_MAP.md、SYSTEM_BLUEPRINT.md、本卡和相关 combat/animation/setting 合同；核对当前 branch、HEAD、dirty worktree、正在并行改动的文件及真实启动入口。

先说明当前 audio source、事件来源、用户设置入口和设备/浏览器测试证据。你的单次目标只做以下之一：AUDIO-0 实际听感基线，AUDIO-1 单一声音素材替换，AUDIO-2 独立音量控件，或 FEEL-0 单路径延迟测量。未经用户选择不要混做多个切片。Animation 只负责画面/触觉呈现，Combat 负责已确认结果，World/Survival 提供只读氛围状态；不得改伤害/范围/冷却/输入/Relay/save authority。保护所有文件与并行工作。

每项修改报告文件、音频事件路径、重复/生命周期防护、过载测试、设备与实际听感证据、未验证范围和最小回滚方案。若没能在实际设备试听，就明确写 UNKNOWN；不许用自动测试宣称声音听起来高品质。


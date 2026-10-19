# Asset Pipeline：角色与动画素材合同审查任务 V1

**状态：DRAFT / NOT IMPLEMENTED / 不改运行时代码**  
**唯一主责：Asset Pipeline**  
**协作审阅：Animation & Presentation、Rendering & Camera；Integration & QA 复核旧合同兼容性**  
**交付：**一份可评审的角色/伙伴动画源素材合同提案。此卡本身不授权扩展 validator、改 manifest 或导入素材。

## 为什么单独开这个任务

`tools/awakening-assets/lib.mjs` 当前只接受 `terrain/decal/prop/fx`，asset ID 正则也只接受这四类。Manifest allowlist 没有 `actor/character` 类别、alpha-trim/trim-offset、透明留白或方向行语义；runtime manifest 只传现有的 `sourceRect/anchor/frames/frameDurationMs`。当前 validator 是 V1 世界环境素材管线，不是玩家、NPC、怪物、宠物的动画表合同。

V21 仍加载一张玩家图集，Successor 也能用既有固定裁片绘制若干 actor；这些调用不能证明存在可追溯的 successor 角色 intake、帧布局合同或高细节像素显示合同。当前正式 `assets/awakening-v1/manifest.json` 仍缺失。上述结论是**工具源码事实**，不是说游戏完全没有角色图片。

## 当前已验证能力与未来提案必须分开

| 范围 | 当前代码实际支持 | 状态 |
|---|---|---|
| Category / ID | `terrain/decal/prop/fx`；ID 正则只允许这四种类别 | **VERIFIED**；`actor/character` 会被当前校验器拒绝 |
| 字段 | sourceRect、尺寸、normalized anchor、frames、frameDurationMs；sheet entry 可声明矩形/行列切片 | **VERIFIED**；没有 trim offset、显式透明 padding 或方向行语义字段 |
| 校验能力 | PNG 路径/尺寸/透明像素、裁片边界、prop anchor、帧数与帧时长数值范围 | **VERIFIED**；不验证角色动作意义、帧顺序是否正确、脚点是否视觉合理或目标屏幕清晰度 |
| 未来 actor schema | 类别名、帧格/方向、trim 与 anchor 关系均待本任务提出方案 | **PROPOSED / UNKNOWN**；草案字段不代表已被 validator 或 runtime 接受 |

当前 V1 allowlist、ID/category 规则与 `runtimeManifest` 是兼容基线。任何新增字段都必须标作未来提案，等另行明确的 Asset Pipeline 实现任务和回归通过后才能称为“当前支持”。

## 五款参考游戏提供的原创可读性目标

- **Crashlands：**战斗对象的剪影、方向和动作意图清楚。
- **Terraria：**角色/怪物阶段或装备差异易辨，不需要照搬像素尺寸或动画行数。
- **Minecraft：**玩家身份可自定义，身份表现不能拥有游戏规则。
- **Don't Starve：**光照、危险和动作仍留出可读轮廓。
- **Stardew Valley：**居民外形能支持日常识别与生活感。

只借鉴可观察的玩家体验，不复制角色、动画、调色板、造型或内容。

## 本卡只研究的内容

1. **源图描述：**稳定 presentation asset ID、原始文件路径/hash、PNG 原始尺寸、裁片/frame rect，以及是否需要区分未裁切画格与透明内容边界。
2. **接触锚点：**human/player/NPC 可提议脚底中心默认值；宠物、四足生物、飞行物必须逐类声明自己的接触点。说明坐标以单帧裁片为基准，不能决定 collider、交互距离或占地。
3. **动画元数据边界：**区分 Pipeline 可机械校验的帧格/行列/序号/透明留白与 Animation owner 决定的动作 clip、状态和节奏。帧时长字段不等于权威动作或 gameplay 状态。
4. **Alpha/trim 语义：**说明原图、sourceRect、trimmed content bounds、trim offset、anchor 之间的参考坐标系；判断显式记录透明 padding 是否有必要，避免保存可互相矛盾的冗余字段。
5. **向后兼容：**给出如何保留当前四种 V1 环境类别与 strict-required gate 的方案；角色合同不得静默改变 `terrain/decal/prop/fx` 或现有 production IDs。
6. **显示边界：**只消费 Rendering & Camera 给出的 source→CSS/display contract。不得在 manifest 中规定碰撞、攻击范围、NPC identity、角色属性或全局 DPR。

## 需要的输出

- 一张字段表：字段名或待选命名、单位/坐标系、必填条件、由哪个模块写入/校验/消费、缺失或非法时如何报错。
- 至多一份小的 **未来 schema DRAFT JSON 示例**，包含一个静态 actor 帧和一个短动画 clip；样例仅做文档，不加入 preview/production manifest，并明确标注**当前 validator 会拒绝/不认识该示例**。
- schema 方案选择：扩展现有 manifest 还是新建 actor-only manifest。比较包兼容、稳定 ID、loader 复杂度和正式项目工作量；不得因“统一”而造第二份重复资产真相来源。
- 把以下三种 gate 分开写，不能互相代替：
  - **现有 V1 兼容 gate：**运行当前 validator tests 与 strict-required fixtures；只验证当前四类素材，不能证明 actor schema。
  - **未来 schema gate：**仅在以后单独授权实现后，测试 actor 类别、裁片/帧布局/anchor/trim 输入拒绝和接受路径，并保持现有 V1 与 strict-required 不回归；本次文档任务不要求该 gate 通过。
  - **游戏内视觉 gate：**未来在同一 successor build 的 1280×720 与 390×844 画面检查角色轮廓、脚点、帧稳定、遮挡和像素清晰度；schema/test 通过不等于视觉 PASS。
- 最后一段写出仍需 Rendering、Animation、World/HOME 和用户决定的项。没有 owner 复核时标 **PROPOSED / UNKNOWN**，不写“已冻结”。

## 排除项和验收边界

- 不改 validator、production/preview manifest、loader、renderer、collision、存档、Relay 或 artwork。
- 不生成或重绘角色/怪物/宠物 PNG，不用 1536×1024 概念图裁角色 sprite。
- 不为全部游戏角色定一个统一源尺寸；不把 source pixels 等同于 CSS 像素，也不推断物理设备 DPR。
- 最终方案必须支持先选一个原创角色家族、保留原始来源/hash、独立审核；源分辨率高不代表已达到 Modern High-Detail Pixel Art。
- 后续真正接入时才运行 validator/schema 回归，并在同一 successor build 做 1280×720 与 390×844 实际画面审查；任一边模糊、粗马赛克、帧抖动、脚点漂移或剪影难辨均为 **REVISE**。当前双尺寸 successor 画面仍为 REVISE。

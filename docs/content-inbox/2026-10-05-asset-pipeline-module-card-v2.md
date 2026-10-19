# Asset Pipeline — 独立模块卡 V2

**状态：DRAFT / NOT IMPLEMENTED as a complete successor art-intake pipeline**  
**唯一主责：Asset Pipeline**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)  
**艺术方向：**Modern High-Detail Pixel Art；art contributor 是创作角色，不是额外模块 owner；候选方向与选择由用户决定。

V2 是唯一有效的派工卡；V1 保留为历史。它不授权批量绘图、改 renderer、晋升正式素材或覆盖现有 intake。完整高画质合同见 [Rendering & Camera V2](2026-10-05-rendering-camera-module-card-v2.md)、[高清密度合同 V2](2026-10-04-successor-high-detail-pixel-density-contract-v2.md) 和当前批次的 [`AWAKENING_ASSET_CONTRACT.md`](../../AWAKENING_ASSET_CONTRACT.md)。

## 玩家结果与五款参考体验

玩家看到的角色、NPC、怪物、地形、建筑、道具、UI、特效和动画应清晰、细节丰富、风格一致；进入游戏后仍可读，不能模糊、粗马赛克、过小或丢关键细节。美术应支持熟悉的现代沿海生活逐渐转为深渊侵蚀，不可开场铺满紫色触手。

- **Crashlands:** 轮廓和战斗对象清楚；小屏也能区分敌人、掉落与交互物。
- **Terraria:** 地层、地标和稀有发现有层次；地面不能变成重复贴纸墙。
- **Minecraft:** 方位、材质和空间边界易读；素材不定义碰撞或建造规则。
- **Don't Starve Together:** 危险提示与准备物品可辨；暗色氛围不可吞掉重要轮廓。
- **Stardew Valley:** HOME、作物与生活物件温暖易读；保留呼吸空间与日常感。

仅借鉴玩家体验，不复制原作素材、角色、布局或系统。

## Owner 和边界

**Asset Pipeline owns:** 原始源文件 intake 和完整性记录；文件命名/路径/ID、维度、色彩/alpha、裁切、帧、anchor 等 presentation metadata；切片/校验/预览产物；预览 manifest 与 production manifest 的结构和 gate 验证；回报可追溯诊断。

- **Art contributor** 按用户选定的原创 brief 创作 candidate 源图；不改 runtime、collision、manifest、save 或 Relay。
- **Rendering & Camera** 拥有采样、projection、viewport 和游戏内清晰度验收；Asset Pipeline 不凭原图像素数宣称运行画质通过。
- **Animation & Presentation** 消费帧语义和已确认的动画事件；Asset Pipeline 只验证帧布局/元数据，不决定 timing/authority。
- **Content & Localization** 拥有稳定 content ID 以外的文本、名称与本地化；Asset Pipeline 的 asset ID 是 presentation lookup，不等于 gameplay identity。
- **World & Terrain** 拥有区域/碰撞；图像 alpha、轮廓和 manifest 字段不能定义可走性、奖励或交互。
- **Integration & QA** 验证真实入口、加载路径与相邻回归；其通过不能替代用户视觉验收。

一次派工只能有一个 asset family 和一个 lead owner。共享数据只能经明确接口传递，不产生第二套 art lookup 或重复正式 manifest。

## 已核实的校验器能力与限制

当前 `tools/awakening-assets/lib.mjs` / `validate-pack.mjs` 的 validator 可验证：JSON allowlist/version、asset ID/category、PNG 路径和文件存在、PNG 头与尺寸上限、sourceRect 范围、manifest 声明尺寸、帧数/帧时长的数值范围、prop bottom-center anchor、terrain 64 px grid/base opacity、decal/prop/FX alpha 有透明像素、binding 引用和必需的指定尺寸。它**不验证帧裁切和帧时长是否与预期动画实际匹配**，也不视觉检验锚点是否落在脚点/接触点。只有传入 `--strict-required` 才验证完整必需 ID 集和精确 semantic binding 清单；GitHub Actions 的 workflow 显式启用该开关。当前 `package.json` 的 `npm run validate:awakening-assets` **没有**传该开关。本地 manifest 缺失时命令仍失败，但将来若有不完整 manifest，不能把这个默认非严格命令成功误认为 production 内容完整；release gate 必须实际使用 strict-required。

它**不会**验证 SHA-256 来源链、版权/授权、像素风审美、锯齿/halo 的主观质量、native density 是否适合 successor projection、画面构图/重复、PNG 在浏览器合成后的锐度、手机 HUD 遮挡或双视口真实可读性。当前 validator 允许的 manifest 字段是 presentation-only；不要向 manifest 偷塞碰撞/掉落/任务语义。

**角色/伙伴素材入口缺口：**当前 `tools/awakening-assets/lib.mjs` 的 `CATEGORIES` 和 ID 规则只接受 `terrain/decal/prop/fx`；字段 allowlist 没有 `actor/character` category、alpha-trim/trim-offset、透明留白或动画方向行语义。它不是玩家/NPC/宠物动画表的合同。旧 V21 player sheet 被旧 renderer 加载，不代表已有 successor 角色素材 intake。不要把角色或伙伴强塞成 prop；要正式接入角色家族，应先单开 Asset Pipeline schema/validator 任务，由 Animation & Presentation 定义帧语义、Rendering & Camera 定显示合同，并增加针对性测试。当前只记录为 **VERIFIED tooling gap / PLANNED follow-up**，不在本卡里改 validator、ID 规则、manifest 或素材。

单独的 DRAFT 派工入口见 [`角色与动画素材合同审查任务 V1`](2026-10-05-actor-sprite-pipeline-contract-task-v1.md)；它只设计 metadata contract，不授权实现或生成素材。

**当前生产 gate 实况：**本地 `npm run validate:awakening-assets` 返回 FAIL：缺少 `assets/awakening-v1/manifest.json`，统计 `assets=0 files=0`。因此当前没有素材包通过 production manifest 校验。预览清单/已有 PNG/candidate/in-take 文件均不能据此称作 production-integrated art。测试里的 CLI 子进程检查在本 Windows 主机因 `EPERM` 跳过；CI 仍是该 CLI 路径的验证源。

## 单资产家族 Intake 流程

1. **保护原件：**不移动/覆盖来源文件；登记贡献来源、授权状态（未知就写 UNKNOWN）、接收日期、原始相对路径、字节数和 SHA-256。校验副本与源文件 hash 一致后再处理。不要编造作者或授权。
2. **建立家族合同：**列 stable ID、类别、源尺寸/sourceRect、帧数/帧时长、anchor、预期显示尺寸/native density、alpha 规则、目标区域/阶段和对应 gameplay semantic owner。单一尺寸不套给所有品类；项目明确的生产尺寸只能照合同核验。
3. **候选图检查：**保留原始字节；检查解码、色彩/alpha 边缘、裁切、透明 fringe、脚点/接触锚点、帧间一致、tile 边缘/组合重复。并排提供原生 1×、最近邻整数放大、实际使用裁片及整场景；禁止为“凑槽位”任意拉伸、缩小或重采样。
4. **预览集成：**若合适，将候选放在隔离候选/preview manifest，标记 `DRAFT / NOT PRODUCTION`；只绑定已经定义的 art semantic IDs。先由合同 owner 复核输入，再由 Rendering & Camera 在 1280×720、390×844 同状态真画面检查。图像失真、过小、遮挡关键路径/角色或细节损失标 **REVISE/BLOCKED**；无截图标 **UNKNOWN**。
5. **正式 gate：**所有必需 IDs、binding、路径、尺寸、alpha 和解码检查通过；Asset Pipeline 与 art owner 核源/hash/许可/元数据；Rendering owner 对游戏实际显示给出 PASS；Integration & QA 检查正式入口、回退行为和邻接功能。任一环缺证据，保持 preview/candidate，不改 production manifest。
6. **可追溯回滚：**记录由 candidate 到 atlas/sheet、manifest entry、renderer binding 的完整映射和文件 hashes；验证失败时只撤回本次家族的 preview 引用，保留来源文件与原 manifest，不清理未知文件。

## 回归与视觉验收

素材-only intake 必须根据变更范围重跑：

- `node tests/awakening-assets-validator.test.mjs`（注意本地 Windows 已知跳过 CLI 子进程断言；需 CI 验证 CLI）；
- `node tests/awakening-art-mapping-v1.test.mjs`、`node tests/terrain-v21.test.mjs`、`node tests/module-sort.test.mjs`、`node tests/successor-module-routing-contract-v1.test.mjs` 中与当前 family/entry 实际相关的检查；
- `npm run validate:awakening-assets`，production manifest 缺失时应如实报 BLOCKED/FAIL，不可借 preview manifest 冒充通过。

视觉验收严格按 [Rendering & Camera V2](2026-10-05-rendering-camera-module-card-v2.md)：同一个当前 build、同一场景，真实入口分别截取 1280×720 和 390×844；列出 viewport/backing/DPR/scale、安全区、source crop/destination、像素边缘/alpha、锚点、拼接、遮挡、实际视线和 fallback。美术可读性不过关就是 REVISE，即使所有机械测试通过；旧构建截图、单元测试、manifest PASS、原始高清 PNG 均不替代游戏内验收。

## 派工模板与禁止事项

```text
唯一主责：Asset Pipeline。一次只做一个原创 asset family 的 intake/机械验证。
先读当前 Skill、章程/状态、Owner Map、本卡、该家族合同和相关 tests；重新核对分支、HEAD、脏工作区、原始文件及 active renderer/entry。
本次源文件及授权状态：【精确路径；不可确认就写 UNKNOWN】
目标 IDs / sourceRect / anchor / native density / frames：【逐项列出并链接合同】
允许写入：【精确 candidate 或 preview manifest 路径】；禁止改动：【production manifest/runtime/collision/save/Relay 等】
先保留原字节、记 hash，再做结构/像素校验；不得覆盖或删除未知来源文件。
报告哪些能被 validator 证明、哪些必须审原图、哪些需要 1280×720 和 390×844 实机画面；明确 PASS/REVISE/BLOCKED/UNKNOWN。
必须运行适用回归；不能把素材候选或 validator PASS 称为已经进游戏。
```

此卡和 validator PASS 均不批准用户尚未选择的美术，也不自动晋升正式 manifest、提交、合并或发布。

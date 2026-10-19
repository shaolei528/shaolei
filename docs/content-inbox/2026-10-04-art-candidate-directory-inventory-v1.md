# DRAFT — 全工作区美术候选目录盘点与整理建议

**状态：VERIFIED INVENTORY / CLEANUP DECISION / NOT PRODUCTION。** 本表检查当前仓库中 `assets/art-candidates/` 与 `assets/awakening-v1/intake/` 下的五个美术候选目录及其 README、构建脚本、manifest/文档引用和 PNG 哈希。工作区有来源未核实的并行改动；除本盘点外，没有移动、覆盖或删除任何候选文件。

## 目录总览

| 目录 | 当前内容与用途 | 引用 / 运行时边界 | 整理结论 |
|---|---|---|---|
| `assets/art-candidates/safecamp-continuous-scene-draft-v2/` | 18 个文件：README、构建脚本、14 张原生人物/道具 PNG、1×与2×审阅板。当前连续海岸 SafeCamp 构图。 | 只由自身 `build-scene.ps1` 生成和引用；不在任何 manifest/renderer 中。 | **KEEP / 当前主评审稿。** 目录已经按 `native/actors`、`native/props`、构建器和审阅图分层；18 个文件无精确重复，暂无可安全清除的孤儿。尺寸/anchor 仍待工程 owner 确认。 |
| `assets/art-candidates/safecamp-successor-proof-v1/` | 34 个文件：README、proof builder、32 张 PNG，含 64×32 terrain、actor/prop、主审阅板与 `reviews/revise-pass-1/` 历史稿。 | `docs/PROJECT_STATE.md` 与 dated handoff 记录此候选；无 runtime/manifest 绑定。README 明示保留 obsolete 水平 pier 供比较。 | **KEEP / 历史对照，owner provenance UNKNOWN。** 复核发现 road、sand、water 各三张变体的 SHA-256 完全相同，构建器虽以不同 seed 命名却未生成视觉差异；标为 **REVISE**，不要仅删副本来掩盖 builder/variant 缺陷。 |
| `assets/awakening-v1/intake/blockers-candidate-v1/` | 10 个文件：7 张北路/MIRE MART terrain、decal、prop、FX 原生素材；两张 3×3 草地审阅图；STATUS。 | 当前检出的 `assets/awakening-v1/manifest.preview.json` 显式引用全部 7 张素材；默认正式 `manifest.json` 不存在。Manifest 与 intake 均为工作区未提交文件，来源未核实。 | **KEEP / PREVIEW BOUND。** 原生图目前仍被显式 preview manifest 引用，不能当作未用素材；审阅图与合同说明配套。只允许通过 preview 评审，不提升为正式资产。 |
| `assets/awakening-v1/intake/whole-game-art-candidate-v1/` | 15 个文件：README、14 张玩家/道具/地形及离线 A/B、map、tile-review PNG。 | 被 README、`docs/PROJECT_STATE.md`、dated handoff、content-inbox 与静态 V21 preview 页引用；地形可由显式 `?awTerrainArtPreview=1` 预览，不是默认游戏路径。 | **KEEP / V1 基线与对照。** 每张图服务于素材或场景评审；画质仍 REVISE，非正式资源。不要因 V2 存在就删掉 V1 对照。 |
| `assets/awakening-v1/intake/whole-game-art-candidate-v2/` | 12 个文件：README 与 11 张地形/离线组合审阅 PNG。 | README 说明 `safe-camp-props-dev-preview.png` 是从 V1 原样复制，只为 A/B compositor 生成对照；其它图由 V2 builder/README 使用。该目录不是运行时 manifest。 | **KEEP / 地形 V2 实验。** 与 V1 的道具 PNG 是明确共享的逐字节副本；不应重复绘制。V2 仍因明显行列重复与细节不足而 REVISE。 |

## 已确认的重复与清理判定

1. **Successor proof 地形名义变体（实际重复）：** `native/terrain/road_{110,129,148}_64x32.png`、`sand_{117,136,155}_64x32.png`、`water_{124,143,162}_64x32.png` 三组各自像素逐字节相同。源目录标注为 owner provenance UNKNOWN；builder 会重新生成它们，proof 文件也可能被外部路径引用。因此当前不删、不改名、不搬移。由 Rendering & Art owner 决定：修正 builder 产出真正不同且经 3×3/map-scale review 的变体，或在保留历史版本/引用的前提下正式收缩变体契约。
2. **V1/V2 prop PNG（有意共享）：** 两个 intake 目录中的 `safe-camp-props-dev-preview.png` 哈希相同；V2 README 明说从 V1 复制，只供 A/B 组合。它不是误生成的两套美术；目前也不应删一份，因为两个离线审阅目录各自可独立重建/浏览，且来源未核实。
3. **当前连续 SafeCamp 草稿：** 14 个 native sprite 各有不同文件哈希；两张 review board 和 builder/README 都各有明确用途。没有发现可以安全删除的文件。
4. **全局结论：** 这五个目录中未发现来源、owner 与引用均已确认且可安全删除的候选文件。候选数量多不等于冗余：其中 V1/V2 对照、离线构图和最近邻审阅图是不同证据。未对 `prototypes/`、共享 `tools/awakening-art-lab/`、production assets、manifest 或其他 agent 目录做重整；它们不属于本轮美术候选清理边界。

## 建议的稳定文件结构

```text
assets/
  art-candidates/
    safecamp-continuous-scene-draft-v2/  # successor 连续场景，当前主评审稿
    safecamp-successor-proof-v1/         # successor 菱形地面历史对照，保留
  awakening-v1/intake/
    blockers-candidate-v1/               # V21 洲外 POI 的显式 preview 候选
    whole-game-art-candidate-v1/         # V21 格子合同候选与基线对照
    whole-game-art-candidate-v2/         # V21 SafeCamp 地面 V2 离线实验
```

当前结构已按“successor 连续场景 / successor 菱形 proof / V21 intake”分开。把这些内容合并到一个大图集或删除旧版，会混淆不同 renderer 合同并损失视觉回归对照；因此本轮采用目录索引式整理，保留各自 owner、入口、用途和 DRAFT 边界。

## 后续处置 Gate

- 工程 owner / 美术 owner 确认 proof-v1 九张重复 road/sand/water 图是否仍要求独立变体；若要变体，先修 builder 并目视检查 tile 3×3 与真实 map 组合，再更新 manifest/README 消费方。不得只凭 hash 自动删文件。
- 明确候选 owner 与 consumer 后，才考虑共享 V1/V2 props 改为单源路径；先全仓改引用并验证两组离线 compositor 可重建，再清理副本。
- 任何 successor 资产扩组继续等待完整合同冻结与真实 successor 1280×720、390×844 画面验收；任何 V21 候选仍只限显式开发预览，不覆盖正式素材。

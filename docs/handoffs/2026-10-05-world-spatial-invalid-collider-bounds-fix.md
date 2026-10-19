# World & Terrain 拒绝无效 Collider 边界 — 2026-10-05

## 结果

- **VERIFIED 接口缺陷：** `registerGeometry()` 原先将非法 x/y/w/h 通过默认值归零或把负尺寸夹成 0。尤其 `w: Infinity` 会被过滤成零宽碰撞体，随后注册的 geometry 仍被认为存在，但其障碍可直接穿过。
- **最小修复：** World Spatial 在注册前检查坐标、宽高均为有限数值；拒绝负宽高及 `x+w` / `y+h` 溢出，并给出明确错误。无效输入不会留下部分注册记录。有效尺寸为零的 collider 仍按原逻辑过滤。
- **唯一主责：** World & Terrain。没有改变有效碰撞体、地图数据、移动解析、LOS、战斗、联网或存档。
- **影响限制：** 当前 MIRE MART authored colliders 为有限正尺寸；没有证据表明普通玩家流程曾产生这些非法几何值。本修复保护的是空间注册接口，不代表发现了玩家已遭遇的穿墙事件。

## 验证

- 新增回归覆盖 NaN 坐标、Infinity 尺寸、负尺寸与有限输入相加后边界溢出；确认失败注册不会污染 registry。
- 以下定向检查通过：
  - `node tests/world-spatial-invalid-coordinates.test.mjs`
  - `node tests/awakening-world-v1.test.mjs`
  - `node tests/awakening-world-logic-hardening-v1.test.mjs`
  - `node tests/successor-natural-route-v1.test.mjs`
  - `node tests/successor-live-screen-movement-v1.test.mjs`
  - `git diff --check`
- 之后串行运行当前 `tests/*.test.mjs`：**62/62 PASS**，包含 combat、inventory、save、network、renderer/route 与模块路由回归。`awakening-assets-validator.test.mjs` 的 CLI 子进程断言因本机 Windows `EPERM` 被跳过；该路径由 GitHub Actions 覆盖。此项不是本机 validator CLI 的运行证明。
- 这是本地自动/VM 测试，不是浏览器实机或手机验收。

## 工作区边界

- 检查时分支 / HEAD：`fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。
- 工作区原本包含大量混合来源的 tracked 与 untracked 改动；全部保留。无清理、提交、push、merge、部署或正式美术更改。
- 本次在既有 World Spatial 脏文件上做最小增量，未覆盖此前无效坐标修复。

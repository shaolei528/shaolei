# World & Terrain 空间查询拒绝无效坐标 — 2026-10-05

## 本轮结果

- **已复现的问题：** `modules/world/world-spatial-v1.js` 的 `isBlockedPoint` 与 `isBlockedCircle` 会把非有限坐标当作未阻挡；`resolveMovement` 对无效目标返回原位置但同时报告 `blocked:false`。调用方因此无法区分“已安全通过”和“输入不是有效位置”。
- **最小修复：** 非有限点/圆参数现在按阻挡处理；非法移动保留可用的有限起点坐标，并报告 `blocked:true`。正常坐标的碰撞步进与未注册 zone 的现有自由移动语义保持不变。
- **唯一主责：** World & Terrain。没有扩展到寻路、AI、跨区移动、动态实体避障、存档或 Relay。

## 验证

- 新增 `tests/world-spatial-invalid-coordinates.test.mjs`，覆盖 NaN/Infinity 查询、非法目标/起点、已注册墙体碰撞和未注册区兼容。
- 新回归、World Spatial/POI hardening、World V1、successor natural route 与 successor live-screen movement 共 5 项定向测试全部通过。
- 修改后顺序运行全部 `tests/*.test.mjs`：**62/62 PASS**。
- 证据限制：这是本地自动化与 VM/source fixture 验证，不是实际玩家输入、实体追随、移动端或生产服务验收。尚无证据表明该输入此前由普通玩家流程触发；问题定位在空间接口的无效输入边界。

## 工作区边界

- 检查时 branch / HEAD：`fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`。
- 本轮触及：`modules/world/world-spatial-v1.js`、新增回归测试、本 handoff 与 `docs/PROJECT_STATE.md` 记录。
- 保留所有其它混合来源的脏文件与未跟踪素材。无清理、提交、push、merge、部署或生产素材更改。

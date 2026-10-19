# 接班卡：顺序回归测试基线

日期：2026-10-05

## 工程快照

- 仓库：`C:\Users\MECH\Documents\ChatGPT\游戏编程\abyssal-wake-integration`
- 分支：`fix/awakening-production-gate-qa-findings-v1`
- HEAD：`54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- 工作树有大量来源混合的已修改/未跟踪文件；没有清理、覆盖或改动 runtime/test。

## 本轮验证

从仓库根目录对每个 `tests/*.test.mjs` 独立启动一个 `node` 进程，按文件名顺序串行执行。结果 **61/61 PASS**。另一位 AI 独立重复了同样的逐文件运行，也确认 61/61 通过，包含以下两个旧失败线索：`successor-camera-adapter-v1.test.mjs` 与 `successor-preview-live-gate-v1.test.mjs`。复核方没有改动任何文件；旧失败不应继续当作当前失败。

## 解释边界

- **VERIFIED:** 当前 61 个源级 fixture/断言通过，未发现测试确认的 bug。
- **VERIFIED local preview smoke:** the guarded `?awDevQa=1` page loaded its V21 iframe in the in-app browser at reported viewport 1100×589. The HUD/rest interaction and asset diagnostics were present; art files reported `terrain:320x256 HTTP 200`, `player:96x128`, `props:192x96`, `resources:128x32`, `monsters:128x96`. Preview explicitly reported `DEV SUCCESSOR PREVIEW · NOT PRODUCTION`, `LOCAL PREVIEW · RELAY BLOCKED`, and a memory save shim. No controls were clicked. This confirms local boot only; it is not a screenshot-based visual acceptance, target-size check, production session, real Relay/co-op test or phone test.
- **UNKNOWN:** 正式生产入口运行、1280×720 与 390×844 目标视口、真实画质/手机触控、多人 Relay 和双客户端同步。本轮读取到的是隔离本地预览无障碍状态，没有保存可供画质判定的截图，也没有连接公网或设备试玩。
- 因未发现可复现代码故障，没有修改代码或测试，不声称修复任何 bug。测试 PASS 不等于“没有 Bug”。

## 下一步

按用户目标继续做一项模块化、玩家可见的垂直内容，再单独安排需要真实浏览器/设备证据的体验检查。发现失败时先复现，区分运行时 bug、过期测试、环境阻塞与 UNKNOWN，再做最小修复及相邻回归。保持高细节像素素材的清晰度验收和既有脏文件保护。

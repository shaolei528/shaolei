# 深海搭档 / Deep Sea Duo

移动端双人海底合作生存游戏。当前版本包含主机权威双人联机、双角色独立成长、无限敌人、环境危险、稀有道具、鲨鱼 Boss、程序化像素深海美术、自适应 WebAudio、中英双语、手机横屏 Safe Area、低端设备画质降级与 PWA 离线缓存。

当前审计版 build 标识：`AUDIT-A1`。

> 部署事实：Netlify 是计划中的正式同源部署目标，但当前尚未验证为已发布生产站点。GitHub Pages workflow 仅保留为 manual-only 备用。当前真机审计应使用固定 commit 的 HTTPS 静态试玩地址，并以 build 标识确认版本。

## 联机架构

- 房主手机运行唯一的权威游戏模拟。
- 加入者只发送输入，并接收房主广播的真实世界快照。
- 加入者输入约 30 Hz；房主世界快照约 15 Hz。
- 玩家正常只需要 **6 位数字房间码**。
- 真正游戏数据使用 **WebRTC DataChannel**；移动、射击、怪物、Boss 和世界快照不通过信令服务转发。
- WebRTC 使用公共 STUN 帮助发现可直连候选；STUN 不是 TURN，不转发游戏流量。
- 一个配对 attempt 在 WebRTC 迟迟没有连上时会超时并彻底关闭旧 transport，避免失败后旧连接突然“复活”。

### 信令后端

当前保留两个彼此独立的信令入口：

1. **正式 Netlify 后端**：Deep Sea Duo 自己的 Netlify 项目使用同源 `/room`，由 `netlify/functions/room.mts` + Netlify Blobs 暂存约 10 分钟的 Offer / Answer。
2. **静态试玩 fallback**：当页面不是运行在 `*.netlify.app` 时，`src/network/signaling.js` 使用 `ntfy.sh` 公共 topic，仅交换 Offer / Answer；长 SDP 会分片后重组。

`ntfy` fallback 是公开、best-effort 的临时信令方案，不承载游戏状态，也不应视作私密通信通道。正式部署完成后优先使用同源 Netlify `/room`。

正常配对链路不依赖 Supabase，也**不修改、不复用《ABYSSAL WAKE》的 `cloudflare/` Worker / Durable Object**。

## 两台手机联机

1. 两台手机连接同一个 Wi‑Fi，或一台开热点让另一台连接。
2. 两台手机打开同一个 HTTPS 固定版本并横屏。
3. 大厅底部必须显示 `AUDIT-A1`。如果仍显示 `BOOT`，说明 JavaScript runtime 没有正常启动，不要继续做网络测试。
4. 手机 A 点 **创建房间**，把出现的 6 位数字告诉 B。
5. 手机 B 点 **加入房间**，输入这 6 位数字。
6. 双方显示 **局域网直连成功** 后进入游戏。
7. 连接成功后房主权威世界开始推进；正常情况下第一批敌人约在 0.8 秒后开始出现。

页面仍保留折叠的手动 Offer / Answer 模式，作为高级故障兜底。

## 当前模块边界

- `src/game/`：无 DOM 的游戏规则、实体、敌人、Boss、环境、道具与数学逻辑。
- `src/game/renderer.js`：Canvas 像素渲染、粒子、光效和自适应画质。
- `src/game/input.js`：PC 键盘与手机相对滑动输入；负责 pointer/blur/visibility reset。
- `src/app/game-session.js`：一局游戏的 runtime；负责 fresh session、host step、guest input cadence、snapshot sequence、restart/disconnect reset。
- `src/network/manual-webrtc.js`：WebRTC DataChannel、STUN/ICE 与移动浏览器兼容处理。
- `src/network/signaling.js`：Netlify `/room` + 静态试玩 ntfy fallback。
- `src/network/room.js`：房间、配对 attempt、WebRTC 生命周期和 timeout；不负责游戏模拟。
- `src/ui/lobby.js`：大厅状态、错误文字、build badge 和 lobby/game 显隐。
- `src/ui/hud.js`：HUD 与升级选择界面。
- `src/main.js`：应用 orchestration，只把 input/session/network/UI/audio/render 连接起来，不直接运行游戏规则。
- `netlify/functions/room.mts`：Deep Sea Duo 独立 Netlify 房间 API。
- `src/audio/`：程序化 WebAudio 音乐与音效。
- `src/i18n.js`：中文默认、英文切换与本地化文本。

## 手机操作

- 手机横屏。
- 左半边按下后滑动：相对手指起点自由移动。
- 右半边按住拖动：相对手指起点瞄准并持续发射水弹。
- 右下角：冲刺。
- 右上角：中英切换和声音开关。

## PWA / 缓存

- raw.githack / jsDelivr 这种固定 commit 试玩地址会主动注销 Deep Sea Duo 的 Service Worker，避免拿到旧代码。
- 正式托管环境保留 PWA；JavaScript / CSS / manifest 使用 network-first，网络不可用时才回退缓存，避免修复已经上线但手机继续执行旧 runtime。

## 两台手机真机验收

完整流程见 [`MOBILE-LAN-TEST.md`](./MOBILE-LAN-TEST.md)。

## 自动验证

```bash
npm install --package-lock=false
npm test
npm run check
```

GitHub Actions 当前覆盖：

- core simulation / movement / enemy / Boss / powerup regression；
- `game-session` integration：连接后世界推进、移动、敌人生成、restart/reconnect snapshot ordering；
- mobile swipe input；
- room/WebRTC lifecycle 与 direct-connect timeout；
- main/runtime/lobby wiring；
- 全部 `src/**/*.js` 语法检查；
- 正常路径不指向 Supabase；
- 真实公网 ntfy smoke，包括 raw.githack `Origin` CORS 和长 Offer / Answer 分片往返；
- Netlify 发布包生成。

自动测试不能代替两台真实手机持续联机验收；真机 10 分钟测试完成前不能声称 physical PASS。

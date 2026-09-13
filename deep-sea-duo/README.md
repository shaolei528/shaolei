# 深海搭档 / Deep Sea Duo

移动端双人海底合作生存游戏。当前版本具备主机权威双人联机、双角色独立成长、无限敌人、环境危险、稀有道具、鲨鱼 Boss、程序化像素深海美术、自适应 WebAudio、中英双语、手机横屏 Safe Area、低端设备画质降级与 PWA 离线缓存。

## 联机架构

- 房主手机始终运行唯一的权威游戏模拟。
- 加入者只发送输入，并接收房主广播的真实世界快照。
- 加入者输入约 30 Hz；房主世界快照约 15 Hz。
- 玩家正常只需要 **6 位数字房间码**。
- 真正游戏数据使用 **WebRTC DataChannel**；移动、射击、怪物、Boss 和世界快照不通过信令服务转发。
- WebRTC 使用公共 STUN 发现可直连候选；STUN 不是 TURN，不转发游戏流量。

### 信令后端

当前保留两个彼此独立的信令入口：

1. **正式 Netlify 后端**：Deep Sea Duo 自己的 Netlify 项目提供同源 `/room`，由 `netlify/functions/room.mts` + Netlify Blobs 暂存约 10 分钟的 Offer / Answer。
2. **静态试玩 fallback**：当页面不是运行在 `*.netlify.app` 时，`src/network/signaling.js` 自动使用 `ntfy.sh` 的公共 topic，仅交换 Offer / Answer。长 SDP 会分片后重组。

`ntfy` fallback 是公开、best-effort 的临时信令方案，不承载游戏状态，也不应视作私密通信通道。正式部署完成后优先使用同源 Netlify `/room`。

本项目的正常配对链路不依赖 Supabase，也**不修改、不复用《ABYSSAL WAKE》的 `cloudflare/` Worker / Durable Object**。

## 两台手机联机

1. 两台手机连接同一个 Wi‑Fi，或一台开热点让另一台连接。
2. 两台手机打开同一个 HTTPS 游戏版本并横屏。
3. 手机 A 点 **创建房间**，把出现的 6 位数字告诉 B。
4. 手机 B 点 **加入房间**，输入这 6 位数字。
5. 页面自动交换 Offer / Answer 并建立 WebRTC DataChannel。
6. 双方显示 **局域网直连成功** 后进入游戏。

页面仍保留折叠的手动 Offer / Answer 模式，作为高级故障兜底。

## 模块边界

- `src/game/`: 无 DOM 的游戏规则、实体和数学逻辑。
- `src/game/renderer.js`: 像素化 Canvas 渲染、粒子、光效与自适应画质。
- `src/network/manual-webrtc.js`: WebRTC DataChannel、STUN/ICE 与移动浏览器兼容处理。
- `src/network/signaling.js`: Netlify `/room` + 静态试玩 ntfy fallback。
- `src/network/room.js`: 主机 / 加入者房间控制器与 WebRTC 生命周期。
- `netlify/functions/room.mts`: Deep Sea Duo 独立 Netlify 房间 API。
- `src/audio/`: 程序化 WebAudio 音乐与音效。
- `src/i18n.js`: 中文默认、英文切换与本地化文本。
- `src/ui/`: HUD 和升级选择界面。

## 手机操作

- 手机横屏。
- 左半边滑动：自由移动。
- 右半边按住拖动：瞄准并持续发射水弹。
- 右下角：冲刺。
- 右上角：中英切换和声音开关。

## 两台手机真机验收

完整流程见 [`MOBILE-LAN-TEST.md`](./MOBILE-LAN-TEST.md)。

## 验证

```bash
npm install --package-lock=false
npm test
npm run check
```

GitHub Actions 额外执行真实公网 ntfy smoke test，包括 raw.githack `Origin` 的 CORS 检查以及长 Offer / Answer 分片往返测试。

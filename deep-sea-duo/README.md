# 深海搭档 / Deep Sea Duo

移动端双人海底合作生存游戏。当前版本具备主机权威双人联机、双角色独立成长、无限敌人、环境危险、稀有道具、鲨鱼 Boss、程序化像素深海美术、自适应 WebAudio、中英双语、手机横屏 Safe Area、低端设备画质降级与 PWA 离线缓存。

## 联机架构

- 房主手机始终运行唯一的权威游戏模拟。
- 加入者只发送输入，并接收房主广播的真实世界快照。
- 加入者输入约 30 Hz；房主世界快照约 15 Hz。
- 玩家只需要 **6 位数字房间码**，不需要正常情况下手动复制 WebRTC Offer / Answer。
- 首选传输是 **WebRTC DataChannel**：同一 Wi‑Fi / 热点环境下尽量直接点对点连接。
- WebRTC 使用 Cloudflare 公共 STUN 发现可直连候选；STUN 不转发游戏数据。
- 如果移动 Safari / WebView / 热点网络导致 WebRTC 无法建立，客户端会自动切换到 **Supabase Realtime Broadcast 兼容模式**。
- 无论走 WebRTC 还是 Realtime，**房主权威规则不变**；不会在两个客户端各自独立模拟世界。
- Supabase Edge Function 负责 6 位房间码和 WebRTC 信令交换；记录约 10 分钟自动过期。
- Realtime 兼容通道使用随机 relay token 隔离房间，不仅依赖可猜测的 6 位数字。
- 页面内仍保留折叠的手动 Offer / Answer 模式，作为高级故障兜底。

## 最简单的两台手机联机

1. 两台手机连接同一个 Wi‑Fi，或一台开热点让另一台连接；两台手机也需要能短暂访问互联网以完成自动配对/兼容通道。
2. 两台手机打开同一个 HTTPS 游戏地址并横屏。
3. 手机 A 点 **创建房间**；页面会立即显示一个 6 位数字，例如 `482731`。
4. 手机 B 点 **加入房间**，输入这 6 位数字，再点 **连接房间**。
5. 页面自动选择可用链路：优先 WebRTC 直连；必要时自动使用 Realtime 兼容模式。
6. 双方连接成功后大厅自动关闭，进入游戏。

不再需要正常玩家手动复制两大段 SDP 文本。

## 网络状态含义

- **局域网直连成功**：当前主要游戏数据走 WebRTC DataChannel。
- **联机成功（兼容模式）**：WebRTC 未能稳定建立，当前主要游戏数据走 Supabase Realtime Broadcast。
- 两种模式都继续使用同一个 host-authoritative simulation 与相同 packet schema。

## 模块边界

- `src/game/`: 无 DOM 的游戏规则、实体和数学逻辑。
- `src/game/renderer.js`: 像素化 Canvas 渲染、粒子、光效与自适应画质。
- `src/network/manual-webrtc.js`: WebRTC DataChannel、STUN/ICE 与移动浏览器兼容处理。
- `src/network/signaling.js`: 6 位房间码信令客户端。
- `src/network/realtime-relay.js`: Supabase Realtime Broadcast 自动兼容通道。
- `src/network/room.js`: WebRTC 优先、Realtime 自动兜底的双传输房间控制器。
- `src/audio/`: 程序化 WebAudio 音乐与音效。
- `src/i18n.js`: 中文默认、英文切换与本地化文本。
- `src/ui/`: HUD 和升级选择界面。

## 手机操作

- 手机必须横屏；竖屏会显示旋转提示。
- 左半边滑动：自由移动。
- 右半边按住拖动：瞄准并持续发射水弹。
- 右下角按钮：冲刺。
- 右上角：中英语言切换和声音开关。

## 两台手机真机验收

完整流程见 [`MOBILE-LAN-TEST.md`](./MOBILE-LAN-TEST.md)。

## 验证

```bash
npm test
npm run check
node scripts/smoke-signal.mjs
node scripts/smoke-realtime.mjs
```

GitHub Actions 的 `Deep Sea Duo Tests` 会执行：

- 单元 / 回归测试
- JavaScript syntax check
- 对真实 Supabase 信令服务的完整 browser-path 信令烟测
- 两个真实 Supabase Realtime 客户端的双向 Broadcast 往返烟测
- 静态发布包打包

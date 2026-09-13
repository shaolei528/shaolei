# 深海搭档 / Deep Sea Duo

移动端双人海底合作生存游戏。当前版本具备主机权威 WebRTC 联机、双角色独立成长、无限敌人、环境危险、稀有道具、鲨鱼 Boss、程序化像素深海美术、自适应 WebAudio、中英双语、手机横屏 Safe Area、低端设备画质降级与 PWA 离线缓存。

## 联机架构

- 房主手机运行唯一的权威游戏模拟。
- 加入者只发送输入，并接收房主广播的真实世界快照。
- 加入者输入约 30 Hz；房主世界快照约 15 Hz。
- 真正的游戏状态仍然通过 WebRTC 点对点传输，不经过公共游戏服务器。
- Supabase Edge Function 只负责一次性的 WebRTC **信令交换**：房主得到 6 位房间码，加入者输入房间码后自动交换 Offer / Answer。
- 信令记录约 10 分钟自动过期，连接完成后也会主动删除。
- WebRTC 当前使用 `iceServers: []`，目标网络仍是同一 Wi‑Fi 或手机热点，不保证跨公网 NAT 穿透。
- 若信令服务不可用，页面内保留折叠的“高级备用：无网时手动连接”。

## 最简单的两台手机联机

1. 两台手机连接同一个 Wi‑Fi，或一台开热点让另一台连接。
2. 两台手机打开同一个 HTTPS 游戏地址并横屏。
3. 手机 A 点 **创建房间**，得到一个 6 位数字，例如 `482731`。
4. 手机 B 点 **加入房间**，输入这 6 位数字，点 **连接房间**。
5. 页面会自动交换 WebRTC Offer / Answer；连接成功后双方直接进入游戏。

不再需要正常玩家手动复制两大段 SDP 文本。

## 模块边界

- `src/game/`: 无 DOM 的游戏规则、实体和数学逻辑。
- `src/game/renderer.js`: 像素化 Canvas 渲染、粒子、光效与自适应画质。
- `src/network/manual-webrtc.js`: WebRTC DataChannel 与本地 ICE。
- `src/network/signaling.js`: 6 位房间码信令客户端。
- `src/network/room.js`: 自动信令 + 手动备用模式的房间控制器。
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
```

GitHub Actions 的 `Deep Sea Duo Tests` 会执行：

- 单元 / 回归测试
- JavaScript syntax check
- 对真实 Supabase 信令服务的完整 create → offer → answer → poll → close 烟测
- 静态发布包打包

# 深海搭档 / Deep Sea Duo

移动端双人海底合作生存游戏。当前版本具备主机权威双人联机、双角色独立成长、无限敌人、环境危险、稀有道具、鲨鱼 Boss、程序化像素深海美术、自适应 WebAudio、中英双语、手机横屏 Safe Area、低端设备画质降级与 PWA 离线缓存。

## 联机架构

- 房主手机始终运行唯一的权威游戏模拟。
- 加入者只发送输入，并接收房主广播的真实世界快照。
- 加入者输入约 30 Hz；房主世界快照约 15 Hz。
- 玩家只需要 **6 位数字房间码**，正常情况下不需要复制 WebRTC Offer / Answer。
- 游戏页面和 6 位房间码 API 都部署在独立的 **Deep Sea Duo Netlify 项目**上；前端请求同源 `/room`，不依赖另一个游戏的 Cloudflare 服务，也不再依赖 Supabase 作为正常配对链路。
- `/room` 由 Netlify Function + Netlify Blobs 保存短期 Offer / Answer；房间约 10 分钟过期。
- 真正游戏数据使用 **WebRTC DataChannel**。同一 Wi‑Fi / 热点环境下，两台手机直接通信。
- WebRTC 使用公共 STUN 发现可直连候选；STUN 只帮助发现地址，不转发移动、攻击、怪物或 Boss 数据。
- 页面内仍保留折叠的手动 Offer / Answer 模式，作为高级故障兜底。

## 最简单的两台手机联机

1. 两台手机连接同一个 Wi‑Fi，或一台开热点让另一台连接。
2. 两台手机打开同一个 `deep-sea-duo.netlify.app` HTTPS 地址并横屏。
3. 手机 A 点 **创建房间**；页面立即显示 6 位数字，例如 `482731`。
4. 手机 B 点 **加入房间**，输入这 6 位数字，再点 **连接房间**。
5. 页面自动交换 Offer / Answer，并建立 WebRTC DataChannel。
6. 双方显示 **局域网直连成功** 后大厅关闭，进入游戏。

正常玩家不再需要手动复制两大段 SDP 文本。

## 模块边界

- `src/game/`: 无 DOM 的游戏规则、实体和数学逻辑。
- `src/game/renderer.js`: 像素化 Canvas 渲染、粒子、光效与自适应画质。
- `src/network/manual-webrtc.js`: WebRTC DataChannel、STUN/ICE 与移动浏览器兼容处理。
- `src/network/signaling.js`: 同源 `/room` 的 6 位房间码信令客户端。
- `src/network/room.js`: 主机 / 加入者房间控制器与 WebRTC 生命周期。
- `netlify/functions/room.mts`: Deep Sea Duo 独立 Netlify 房间 API。
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
npm install --package-lock=false
npm test
npm run check
```

GitHub Actions 的 `Deep Sea Duo Tests` 会执行：

- 安装 Netlify room-service 依赖
- 单元 / 回归测试
- JavaScript / Netlify Function syntax check
- 确认正常配对路径不再指向 `supabase.co`
- 打包独立 Netlify 站点

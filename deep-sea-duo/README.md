# 深海搭档 / Deep Sea Duo

移动端双人海底合作生存游戏。当前版本已经具备完整的局域网 / 热点 WebRTC 手动配对、主机权威同步、双角色独立成长、无限敌人、环境危险、稀有道具和鲨鱼 Boss，并完成第一轮正式表现层升级：程序化可爱像素深海美术、动画/粒子/光效、自适应空灵/战斗/Boss WebAudio、中英双语、手机横屏 Safe Area 与低端设备画质降级。

## 联机架构

- 房主手机运行唯一的权威游戏模拟。
- 加入者只发送输入，并接收房主广播的真实世界快照。
- 加入者输入约 30 Hz；房主世界快照约 15 Hz。
- 不使用公共游戏服务器、Supabase、STUN 或 TURN。
- 首次连接采用手动交换 `Offer → Answer → Host confirm`。
- 当前目标网络是同一 Wi‑Fi 或手机热点，不保证跨公网 NAT 穿透。

## 模块边界

- `src/game/`: 无 DOM 的游戏规则、实体和数学逻辑。
- `src/game/enemies.js`: 敌人类型与行为。
- `src/game/environment.js`: 珊瑚、海流、水母与碰撞规则。
- `src/game/boss.js`: 鲨鱼首领状态机、冲刺预警与奖励掉落。
- `src/game/powerups.js`: 稀有道具生成、效果和持续时间。
- `src/game/renderer.js`: 像素化 Canvas 渲染、粒子、光效与自适应画质，不改变游戏规则。
- `src/network/`: 手动 WebRTC 房间、输入消息和主机权威快照。
- `src/audio/`: 程序化 WebAudio 音乐与音效。
- `src/i18n.js`: 中文默认、英文切换与本地化文本。
- `src/ui/`: HUD 和升级选择界面。

## 手机操作

- 手机必须横屏；竖屏会显示旋转提示。
- 左半边滑动：自由移动。
- 右半边按住拖动：瞄准并持续发射水弹。
- 右下角按钮：冲刺。
- 右上角：中英语言切换和声音开关。

## 两台手机联机

完整的新手真机验收步骤见 [`MOBILE-LAN-TEST.md`](./MOBILE-LAN-TEST.md)。

## 本地运行

这是纯静态前端项目。使用任意静态服务器在 `deep-sea-duo/` 目录运行，例如：

```bash
npx serve .
```

WebRTC 真机测试应使用 HTTPS 页面（GitHub Pages 即可），避免移动浏览器对非安全上下文的限制。

## 验证

```bash
npm test
npm run check
```

GitHub Actions 的 `Deep Sea Duo Tests` 工作流会在 `feat/deep-sea-duo-v1` 的游戏代码变更后自动执行回归测试和 JavaScript syntax check。

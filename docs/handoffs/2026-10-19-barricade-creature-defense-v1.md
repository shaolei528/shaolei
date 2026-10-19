# Handoff — 路障耐久与怪物攻防

Date: 2026-10-19 (Asia/Rangoon)
Status: 功能分支 `feat/barricade-defense-v1`，尚未合入 `main`。

## 本次实现

- 怪物移动被世界碰撞拦住时，只发布 `abyssal:mob-movement-blocked` 意图；战斗模块不直接改建筑状态。
- HOME & Building 校验区域首领、本地玩家、怪物身份和实际碰撞位置后，按配置间隔扣除对应路障耐久。存档失败会回滚耐久；耐久归零会移除结构与碰撞体。
- `abyssal:building-damaged` 沿用现有 `camp-world-sync-v1` 完整结构快照，Relay 消息协议未改。伤害数值与间隔在 `data/building/structures-v1.json`。

## 已验证

- `building-creature-defense-v1.test.mjs`：首领权限、碰撞造成伤害、受击冷却、存档回滚、摧毁后移除碰撞、Relay 快照通过。
- `home-building-v1.test.mjs`、`camp-world-sync-v1.test.mjs`、`mob-attack-windup-v1.test.mjs`、`successor-module-routing-contract-v1.test.mjs` 均通过。
- `npm run build:site` 生成 100 个公开文件；Wrangler 4.102.0 dry-run 读取 140 个静态文件并识别 `WORLD` Durable Object。以上只证明本地打包形状。

## 未验证与下一步

- 普通浏览器操作、双客户端实时路障耐久、正式 Cloudflare 部署仍未验证。
- 用户报告 Cloudflare 登录页显示 “You are unable to sign in”；永久部署在账号登录恢复前无法完成。不要在聊天里索要或记录密码、验证码或 API Token。
- PR 合入前等待 GitHub Actions。PR #10 当前四项检查仍为 queued；该分支独立基于 `main`，不包含 PR #10 的提交。

# 深渊苏醒：试玩与发布手册

这份手册是游戏发布状态的唯一操作说明。报告时分开写本机预览、GitHub 静态源、Cloudflare 部署、真实游戏验收。

## 页面打不开先看这里

- 本机试玩入口：`http://127.0.0.1:8884/index.html`。它需要本机 Node 预览进程运行；浏览器报 `ERR_CONNECTION_REFUSED` 通常表示端口没有服务在监听，不代表 Cloudflare 游戏坏了。
- 从仓库根目录启动本机预览：

  ```powershell
  node -e "process.env.AW_PREVIEW_PORT='8884'; import('./tools/serve-aw-local-preview.mjs')"
  ```

- 分享用开发入口：`https://raw.githack.com/shaolei528/shaolei/main/index.html`。它跟随公开 `main` 源码，不代表 Cloudflare Worker 刚部署。
- Cloudflare 游戏入口：`https://abyssal-wake-relay.zuoranzhang.workers.dev/`；服务探针：`https://abyssal-wake-relay.zuoranzhang.workers.dev/health`。
- 唯一玩家页面从根目录 `index.html` 进入。`prototypes/successor-3-4/qa-runner.html` 是隔离测试页，会阻断 Relay 并替换存档，不能用于验证公开联机。

## 自动发布流程

1. 合并到 `main` 后，GitHub Actions 的 `Deploy production` 自动安装锁定依赖、检查唯一玩家入口、打包并执行 Wrangler dry-run。
2. 检查通过后，它把 Worker 与静态游戏文件一起部署到 Cloudflare。
3. 部署后自动检查 `/health`、根入口、3/4 启动脚本，再运行双客户端 Relay/重连烟测。
4. GitHub 仓库的 `production` 环境会显示这次部署的状态和入口。也可在 Actions 里手动重跑 `Deploy production`；仅从 `main` 执行会部署。

在 GitHub 仓库 **Settings → Environments → production → Environment secrets** 设置以下两项一次即可。只保存机密名称在代码中，绝不把值写进仓库或聊天：

- `CLOUDFLARE_API_TOKEN`：范围限制到目标 Cloudflare 账户的 Workers 编辑权限。
- `CLOUDFLARE_ACCOUNT_ID`：目标 Cloudflare 账户 ID。

缺少其中任一项，部署工作流会明确失败并指出缺少哪个配置名；构建成功不算已经部署。

## 验收词汇

- **本机可开：**8884 有预览进程，根入口能读。进程停止后，localhost 链接会再次拒绝连接。
- **静态源已更新：**`main` 上的新提交可经 `raw.githack.com` 读取。
- **Cloudflare 已部署：**`Deploy production` 的 deploy 步骤成功，部署后 `/health` 返回成功。
- **Relay 已验证：**部署后双客户端连接、移动/攻击/世界消息、断线重连测试通过。
- **游戏实玩通过：**还须用普通玩家输入从唯一入口完成当前验收路线。部署和 Relay 烟测不等于战斗好玩、存档重载正确、全部五类玩法完成。

## 常见失败

| 现象 | 先查 | 结论边界 |
|---|---|---|
| 本机 `127.0.0.1:8884` 拒绝连接 | 本机预览服务器是否运行；端口有没有被其他服务占用 | 只说明本机服务不可达 |
| GitHub Actions 的 `check:worker` 失败 | 构建清单、JSON 配置、Wrangler dry-run 日志 | Worker 尚未部署 |
| `Require production credentials` 失败 | GitHub `production` 环境是否设置两个 Cloudflare secret | 不要把 token 粘贴到聊天或提交到代码库 |
| 部署成功但 `/health` 失败 | GitHub deploy 日志、Worker URL、Cloudflare 部署列表 | 不能报告发布成功 |
| `/health` 成功但 Relay 测试失败 | `/ws`、Durable Object 绑定和 Relay 日志 | 页面能打开不代表异地联机正常 |
| 页面或测试已通过但普通游玩卡住 | 记录根入口、玩家输入、目标、反馈、奖励、存档 | 自动化检查不能替代实玩闭环 |

## 复现与回滚

- 本机验证：`npm ci`、`node tests/successor-live-candidate-v1.test.mjs`、`npm run check:worker`。
- 线上 Relay 验证：`npm run test:live-relay`，使用默认 Cloudflare Relay 地址。
- 回滚 Cloudflare Worker 时，从 Cloudflare Dashboard 的 Deployments 选择之前的成功版本；不要靠删除 Git 历史回滚。
- 固定分享链接应使用已经验证的 commit SHA；`main` 开发链接随主线前进。

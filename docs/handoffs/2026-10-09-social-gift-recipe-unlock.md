# 2026-10-09：营地送礼与料理解锁

## 目标

按统一灰盒五类玩法计划，补一条可见的生活闭环：向导送礼 → 关系变化 → 配方解锁。保留当前 3/4 玩家入口、V21 存档 V5 与既有 Relay 消息协议。

## 已实现

- `modules/social/npc-social-v1.js` 独占 Guide 好感、送礼规则和配方解锁；内容来自 `data/social/npc-relationships-v1.json`。
- 送礼调用 Items 原子库存事务；失败保存会恢复物品、好感和解锁状态；V5 owner extension 保存关系。
- Guide 对话中新增送礼入口；`modules/ui/npc-social-panel-v1.js` 只读关系与背包并提交赠礼命令。
- 好感 2 解锁“巡路暖汤”；Cooking 检查 Social 的只读解锁接口，已解锁菜谱使用同一篝火制作/Survival 进食闭环。
- Companion `WAIT` 锚点改为玩家身后偏移，避免宠物画在玩家脚下。

## 验证

- 本机隔离 QA 页面：Relay blocked、内存保存替身。使用 E 与 Guide 交谈，赠两份口粮后看到背包 2→1→0、好感 0→1→2、熟络级别与配方解锁提示；篝火列表已显示暖汤。未有相应食材，未实际制作/食用。
- 12 项定向 Node 回归通过：社交、Cooking、Companions、Interaction、Inventory、V21 模块顺序、Farming、Livestock、Fishing、Boss、Save Extensions。
- `npm run build:site` 生成 91 个公开静态文件；输出 `.cloudflare-site-d97d6d4bdd80`。
- `git diff --check` 通过；可见到 git 的 LF/CRLF 提示只属于已有混合换行文件。

## 尚未验收

- 正式入口的整条采集→制作→战斗→返营，以及钓鱼→料理→进食、怪物掉蛋→孵化→同行还未同一局实走。
- QA 内存存档不能证明磁盘重载；关系与宠物目前均为本地状态，不同步给队友。
- 手机布局、真实双客户端、Cloudflare/Relay 部署、公网分享链接均未验证。

## 工作区

- Repo：`C:\Users\MECH\Documents\ChatGPT\游戏编程\abyssal-wake-integration`
- Branch/HEAD：`fix/awakening-production-gate-qa-findings-v1` / `54d294abc13dd19ee53b56563fe43aaecc81b9ba`
- 工作区已有大量其他改动与未跟踪文件；本次只做增量，没有清理、提交、推送或部署。

# 交接：统一灰盒玩法优先

## 当前指令

只做一个 3/4 斜俯视游戏入口和一套统一灰盒场景。玩家不该在城镇贴图、背景画、旧版本和 QA 变体之间跳转。先删运行路径上的混搭内容，再做玩法闭环；全仓物理删除必须先看依赖图。

## 本次核实

- Repo：`C:\Users\MECH\Documents\ChatGPT\游戏编程\abyssal-wake-integration`
- Branch/HEAD：`fix/awakening-production-gate-qa-findings-v1` / `54d294a`
- 工作区原本就有大量修改/未跟踪内容。创建本地 Git stash 快照 `workspace-snapshot-before-unified-graybox-2026-10-09` 后已恢复原工作区；不得把其他人的改动算成本轮成果，也不要重置、清理、提交或推送。
- 根 `index.html` 是唯一玩家入口，直接转到 `prototypes/successor-3-4/live-candidate.html`；菜单不再写入 Stardew 场景概念图。
- 旧本地 `?view=graybox` 变体入口现已重定向至根入口；隔离的 `preview.js` 仅供开发测试，不是玩家游戏链接。
- `survival-v21.html` 通过 `fetch('./ui-shell.html?ui=...')` 读取界面模板，并从 `modules/` 加载模拟、存档、Relay 和玩法。V21 与 UI 壳是运行底层，不是供玩家挑选的版本。
- 旧 V3–V17 独立入口、V8/V9 启动脚本、两个平行相机原型目录、两张独立美术页和备份入口已从活动工作树删除。历史文档与备份保留作追溯；不要当作可玩版本或当前启动说明。
- 新增的 `fishing-preview-v1.js` / `data/fishing/graybox-pool-v1.json` 只有临时自定义事件流程，没有接入游戏输入与背包；必须移除或完成真正模块闭环，不能留作“已实现”宣传。
- 用户附图是离线绘制诊断，不是浏览器游戏截图。没有新的普通输入验收、全地图边缘验收或双端联机验收。

## 目标循环

```text
HOME 准备
  → 出门探索与碰撞
  → 资源多段采集 / 挖掘
  → 背包结算 / 工作台制作工具
  → 战斗与奖励
  → 夜晚生存压力
  → Boss 阶段战
  → 蓝图/宠物蛋/区域奖励
  → 回 HOME 建造、耕种、钓鱼、烹饪、社交与成长
```

五个参考体验必须都能在这条共享循环里各有最小闭环：Minecraft 的挖掘建造制作；Terraria 的装备门槛/Boss/事件；Stardew Valley 的农作、钓鱼、烹饪、居民关系；Don't Starve 的 HP/饥饿/Sanity/黑暗与昼夜；Crashlands 的图纸、任务解锁、宠物孵化成长与协同。

## 模块边界

遵循 `docs/SUCCESSOR_MODULE_MAP.md` 的 canonical owner 表，不增加第二套 owner：World & Terrain 管网格/碰撞；Interaction & Gathering 管采集请求/阶段；Items & Inventory 独占库存；Crafting & Processing 校验图纸/工作台；Combat & Weapons 确认伤害；Creatures & AI 管怪物和 Boss 生命阶段；Loot & Rewards 发起一次性掉落；Survival & Needs 管 HP/饥饿/Sanity/食物效果；Farming & Food 管作物状态；Pets & Companions 管孵化/跟随；Quest & Narrative 管解锁；Network & Co-op 只传既有 Relay 消息；渲染、UI、音效只表现已确认事件。

## 下一步（一个有主责的任务）

**Lead: Integration & QA** 做单一入口与旧版本依赖图；**implementation owner: Interaction & Gathering** 完成真实采集反馈闭环。

1. 已把 V7 界面模板改名为 `ui-shell.html`，并改 V21、发布脚本和测试的加载路径。
2. 已把根入口简化为单一跳转；公网构建仍须单独构建和检查，不能把未部署的本地候选称为正式发布。
3. 已把当前候选的旧概念图加载和固定发布清单中的候选美术剔除；需在实际画面复核无城市串场。
4. 已将多段采集逻辑接到 Interaction 模块；本轮跑测试确认木材/石材阶段与最终单次结算。玩家普通输入和背包画面仍待验。
5. 之后用普通输入检查地图边缘、碰撞、移动抖动，再接工具、普通怪和 Boss。

## 工时估计

- 2–4h：单入口、模块/依赖地图、去除当前运行路径的概念图和旧路由分叉。
- 4–6h：采集 → 背包 → 工作台 → 工具的第一个真实闭环。
- 再 6–10h：探索、普通怪、Boss、夜晚和防御建筑，做成可重复的短循环。
- 再 12–20h：各接一条农业/钓鱼/烹饪/居民、技能、任务、宠物孵化成长最小链。
- 再 8–12h：存档和双端 Relay 回归、奖励去重、断线检查。
- 总计粗略 32–52 个集中开发小时，取决于 V21 可复用程度；不是全天无人值守承诺。优先交付 6–10 小时内可演示的采集/制作/战斗短循环，未完成支柱保持明示。

## 验收用语

只把普通输入跑过的链路标成 VERIFIED；源码/单测/HTTP 返回单独标记为源代码检查。没有屏幕图、保存后重载或两个独立客户端证据时，视觉/存档/联机对应项写 UNKNOWN。当前正式发布、全功能和五支柱闭环都未接受。

## 2026-10-09 收拢结果

- Cloudflare 静态包已本地构建：65 个文件，不含旧可玩页面或候选美术。
- 21 个聚焦回归检查通过；本机 8765/8876 的必要入口和模块返回 HTTP 200，旧 V7/V17 页面返回 404。
- 这些是源码、打包和路由证据；没有普通输入全程、视觉接受、保存重载、双端联网或公网部署证据。

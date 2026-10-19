# POI & Exploration — 独立模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED as a separated successor service**  
**唯一主责：POI & Exploration**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

## 玩家目标

离开 HOME 后，玩家知道附近有什么值得去；到达一个用途明确的城市地点，发现线索/资源/风险，再带着收获安全回家。

## 唯一职责与边界

拥有 POI 身份/定义、发现记录，以及一次探索旅程中的**操作阶段**（例如离营、抵达、搜寻、取得所需物资、返家）。MIRE MART 现有路线阶段属于这种 operational expedition 状态；V21 当前把它放在 `ABYSSAL_EXPEDITION_LOOP_V1`，successor 应由本模块承接该状态边界。

**Quest & Narrative** 单独拥有任务是否可接/已接受/已完成、剧情选择和叙事完成资格；它可把 POI 的确认里程碑作为任务条件，但不得再保存一套“抵达/搜寻/返家”的副本。任务 UI 可组合显示两类只读状态。**World & Terrain** 提供位置与碰撞；**Interaction & Gathering** 负责目标/采集意图；**Combat & Weapons / Creatures & AI** 处理遭遇；**Loot & Rewards** 结算奖励；**UI & Map** 显示地点和组合目标。

不得因发现地点直接写背包、判定击杀、定义碰撞或实现地图渲染。POI 图片不是权威 POI 数据。

## 接口草案

POI registry 提供 stable ID、world anchor、类别和可用条件；探索记录消费经验证的进入/调查事件；离开/返回的状态变化通过有身份的领域事件结算。具体事件名仍待接口设计，不暗示已有 API。Quest 可消费这些里程碑，不复制这条操作阶段状态机。不能只靠 renderer 切换场景来推进远征。

## 验收

- 重复进入、断线重连、死亡/提前返回、POI 不可用、目标消失和存档恢复均保持一致。
- HOME→POI→搜寻/遭遇→返回的一次自然路线逐步使用普通控制验证，不使用 QA teleport 当通过证据。
- 地点标识/路线在桌面与手机清晰，人物/道路/交互物不被 HUD 遮挡；两种 viewport 不通过即 REVISE。
- Relay/save 合同先保持；跨端持久探索状态须单独定义和回归。

## 派工模板

每次限定一个 POI 或探索状态变化，指定 ID 与 owner、接口/文件、主回归+相邻战斗/碰撞/奖励检查、真实画面范围与未验证项。

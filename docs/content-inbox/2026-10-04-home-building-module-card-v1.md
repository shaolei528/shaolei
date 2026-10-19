# HOME & Building — 独立模块卡 V1

**状态：DRAFT / 部分营地/工作台能力存在；successor 建造服务 NOT VERIFIED**  
**唯一主责：HOME & Building**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

## 玩家目标

HOME 是温暖、有用、可成长的生活据点。玩家布置/升级照明、储物、工作台和防护后，下一次 OUTSIDE 出行准备或风险应对发生清楚变化。

## 唯一职责与边界

拥有营地布局、建筑设施位置/身份、放置/升级状态及 station identity。**World & Terrain** 验证空间/碰撞；**Crafting & Processing** 查询设施资格并执行配方；**Items & Inventory** 应用材料增减；**Quest & Narrative / NPC & Social** 可以提出目标；**Rendering & Camera / Asset Pipeline** 显示升级效果。

HOME 不写背包、配方、任务、NPC 关系、地形 authority、渲染深度、存档迁移或 Relay 协议。

## 验收

- 放置/升级在无效地面、重叠、材料不足、重复请求和重新进入 HOME 时一致；消耗与建造原子完成。
- HOME 安全边界和现有 Safe Camp 规则保持；工作台、休息、建造使用各自明确的接口。
- 可见升级前后同场景对比；建筑/角色脚点、遮挡、可交互轮廓、像素密度在 1280×720 与 390×844 清楚锐利。
- 跑碰撞、Crafting、Inventory、Safe Camp、Save 和 interaction 回归；源图或静态 mock 不替代运行验收。

## 派工模板

一次只做一个设施或升级。写清占地、station ID、资源请求接口、允许文件、旧 HOME 回归、画面证据、save/network 边界和 rollback。现有专门的 Field Rig visual-payoff 卡不等于一般建造系统已完成。

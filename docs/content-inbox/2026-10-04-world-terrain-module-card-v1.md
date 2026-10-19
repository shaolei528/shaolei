# World & Terrain — 独立模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED as a separated successor service**  
**唯一主责：World & Terrain**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

## 玩家目标

玩家能在现代沿海城市中辨认道路、建筑、海岸和安全路线；角色移动与可见地形一致，带回家的路线可信。

## 唯一职责与边界

拥有 canonical 世界坐标、区块/区域地形查询、地面语义和碰撞。图像只显示地面/物件外观，不能决定走不走得通。**Rendering & Camera** 将世界投影到屏幕；**POI & Exploration** 管地点发现和远征；**HOME & Building** 管设施占地/升级；**Interaction & Gathering** 查询目标范围。

不拥有镜头投影、sprite 像素、任务、资源奖励、玩家属性、存档格式或网络同步协议。

## 接口草案

提供稳定 world query：坐标→区域/地面/阻挡结果；移动系统提交位置变更并得到碰撞解决。渲染只读地形快照。不得在屏幕坐标中存储 gameplay position。草案接口需以现有 `world-state.js`、`world-spatial-v1.js` 和 V21 合同复核。

## 验收

- 碰撞与可视地形一致；斜俯投影变更不影响世界距离、战斗范围、采集距离或存档坐标。
- 测边界、连续移动、障碍、POI 连接处和旧地形 ID；跑移动/碰撞/地图/保存相邻测试。
- 地面候选在真实运行场景检查接缝、重复和角色比例；像素必须锐利、不糊、不粗马赛克。1280×720 与 390×844 缺一即 UNKNOWN。
- 不批量替换正式 atlas/manifest，不更改世界坐标 schema，除非选择独立迁移任务。

## 派工模板

一次一个区域或一种碰撞/地形行为。列出 source-of-truth、允许文件、fallback、影响的 POI/移动回归、浏览器双尺寸证据和 rollback。

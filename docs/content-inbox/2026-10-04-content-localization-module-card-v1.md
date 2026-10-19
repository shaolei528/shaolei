# Content & Localization — 独立模块卡 V1

**状态：DRAFT / NOT IMPLEMENTED as a unified successor content registry**  
**唯一主责：Content & Localization**  
**Owner 目录：**[`../SUCCESSOR_MODULE_MAP.md`](../SUCCESSOR_MODULE_MAP.md)

## 玩家目标

地点、角色、物品、任务和 UI 文字有稳定 ID、统一语气和正确翻译；新内容可被核对而不把规则塞入文本文件。

## 唯一职责与边界

拥有内容 ID/定义注册、显示名称/描述/文本 key、locale fallback 和内容完整性校验。**Asset Pipeline** 负责图像元数据、裁切和 manifest；**domain owner** 拥有配方/敌人/任务/POI gameplay schema 与运行时规则；**UI & Map** 呈现文字。

不得在翻译层实现伤害、掉落、解锁、碰撞或存档行为；不得以展示名作为网络/存档主键。

## 验收

- 缺失/重复 ID、缺翻译、变量占位不一致、fallback、旧 key 和长文本都有可重复检查。
- 中文与英语至少检查游戏常见面板的截断、换行、字体 fallback 和术语一致性；新增 UI 图形仍需两种 viewport 锐度检查。
- 内容草案须标 DRAFT / NOT IMPLEMENTED；用户保留前不升级正式内容。
- 内容索引变动跑 registry/manifest 相关测试并检查相邻 UI/任务读取，不改 schema/Relay 无关部分。

## 派工模板

指定一个内容族或 locale 缺陷、稳定 ID 和实际消费者、允许文件、fallback/完整性回归和截图要求。确认“文字内容”不会被误当规则 owner。

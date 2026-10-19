# 2026-10-09 HOME 路障灰盒交接

## 本轮结果

HOME & Building 新增可配置的木路障。入口在 3/4 候选页的建造按钮；放置费用为 2 木材、1 石料；World Spatial 处理位置校验和碰撞；Items 处理原子库存交易；V5 owner extension 保存建筑；渲染模块仅读取 HOME 快照。拆除返还 1 木材。Relay 协议未改。

## 变更范围

- `modules/home/home-building-v1.js`
- `modules/render/defense-structure-render-v1.js`
- `data/building/structures-v1.json`
- `survival-v21.html`
- `prototypes/successor-3-4/live-candidate.js`
- `prototypes/successor-3-4/preview.js`
- `prototypes/successor-3-4/successor-renderer.js`
- `cloudflare/build-site.mjs`
- 相关回归文件与 HOME 模块映射文档

继续时先查看实时 diff 与工作树状态；不要重置或清理旁边原有改动。改进只围绕 HOME & Building，保持 World 验证空间、Items 扣料、Save 持久化、Renderer 只读与 Relay 不变。

## 验证证据

- `node tests/home-building-v1.test.mjs`：放置、费用、碰撞、重叠拒绝、存档回滚、拆除返还、V5 恢复均通过。
- 采集制作、库存、农场、牲畜、钓鱼、料理、伙伴、社交、Boss、存档扩展 10 个定向回归文件通过。
- `npm run build:site` 成功生成 `.cloudflare-site-193844d32248`，94 个公开文件。
- 本地隔离 QA 页面可启动并显示建造按钮；缺料反馈可见。未在浏览器真实放置路障；QA 阻断 Relay、使用内存存档，且路障尚未同步给其他玩家。

## 下一步

用常规采集把材料放入背包，完成一次建造、碰撞和拆除的普通输入验收。之后按玩家可操作闭环推进农场、牲畜、钓鱼、料理和伙伴的入口验收；只有获得真实双客户端证据后才报告联机同步完成。

## 水面碰撞跟进（2026-10-09）

池塘已经由 `data/world/water-bodies-v1.json` 定义，`modules/world/water-bodies-v1.js` 注册为 World Spatial 几何；码头的互动点在干燥岸边。修复圆形玩家碰撞在矩形水面斜角漏检的问题后，隔离浏览器从码头朝池塘移动会停在水边，目标仍可钓鱼。`tests/awakening-world-logic-hardening-v1.test.mjs`、`tests/terrain-v21.test.mjs`、`tests/world-spatial-invalid-coordinates.test.mjs` 通过；静态包构建为 96 个文件。Relay 仍阻断、存档仍用内存 shim，未部署/推送。

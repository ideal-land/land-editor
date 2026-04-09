# 09 实现备忘

## 推荐工作流

1. 用户上传素材
2. `asset-analyzer` 生成 `asset-manifest.json`
3. `agent-orchestrator` 让 Intent Agent 产出 `scene-spec.json`
4. Layout Agent 产出 `layout-plan.json`
5. `map-builder` 生成 `main.tmx` / `main.export.json`
6. `runtime-phaser` 启动本地预览
7. `validator` 输出 `generation-report.json`

## 推荐 patch 策略

- 所有 scene spec 的迭代都保留 diff
- map builder 输出 `patches/*.json`
- generation report 记录 patch 与 rebuild scope

## 推荐的 Builder API

```ts
buildMap({
  assetManifest,
  sceneSpec,
  previousMap,
  rebuildScope: 'full' | 'roads' | 'objects' | 'weather'
})
```

## 最重要的 3 个工程纪律

1. 所有输入输出都有 schema
2. Runtime 只消费稳定字段
3. 用户变更优先走 patch，不走 full rebuild

## 未来扩展

- 模板库（公园/小镇/码头/校园）
- NPC 自动放置
- 多天气混合和天气区域
- 多张地图与传送
- 规则引擎可视化

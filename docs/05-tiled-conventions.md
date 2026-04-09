# 05 Tiled 工程规范

## 为什么要给 Tiled 立规矩

如果没有固定层名、对象 class 和 property 约束，几轮 agent 修改后地图会迅速失控：
- layer 命名混乱
- custom properties 漫天飞
- runtime 绑定脆弱
- 人工接手成本高

## 固定层体系

建议固定以下层：

1. `ground`
2. `road`
3. `water`
4. `foliage_back`
5. `building_base`
6. `building_roof`
7. `decor`
8. `collision`
9. `spawn_points`
10. `interactables`
11. `triggers`
12. `navigation_debug`

### 层职责说明

#### ground
地表基础铺设，例如草地、泥地、石板。

#### road
主路径和次路径；建议独立于 ground，便于重算与替换。

#### decor
长椅、路灯、路牌、垃圾桶等静态装饰。

#### collision
用于运行时阻挡。可用 tile layer，也可用 object layer；第一版建议 object layer + rectangle。

#### spawn_points
玩家/NPC 出生点，建议全用 object layer。

#### interactables
可交互对象；推荐 object layer + class。

## Custom Classes 建议

- `SpawnPoint`
- `NPCSpawn`
- `Portal`
- `BuildingEntrance`
- `Bench`
- `Lamp`
- `WeatherZone`
- `TriggerArea`

### Bench class 建议属性

- `id: string`
- `facing: enum(left,right,up,down)`
- `variant: string`
- `seats: number`
- `interactable: boolean`

### SpawnPoint class 建议属性
- `id`
- `actorType`
- `facing`
- `isDefault`

## Property 约束

- 所有 ID 都用 kebab-case
- 布尔值和数字不要以字符串存
- 面向 runtime 的字段要避免动态命名
- 不允许“同语义多个字段名”的情况，例如 `spawn`, `spawnId`, `player_spawn`

## Template 建议

对高频对象使用 Tiled Template：
- bench
- lamp
- portal
- building entrance

这样人工和 agent 都能共享结构。

## Agent 可修改边界

### 允许 agent 直接生成/改写
- `road`
- `decor`
- `collision`
- `spawn_points`
- `interactables`
- 部分 `ground`

### 建议保留人工精修
- 建筑立面修饰
- terrain brush 过渡
- 边缘缝合
- 像素级装饰摆放

## 与 CLI 协作

建议统一导出命令入口：
- 所有导出都通过 `scripts/export-tiled.sh`
- 显式传入 project file
- 在 CI 或 Linux 无头环境里可包一层 `xvfb-run`

## 文件命名建议

- `tiled/project.tiled-project`
- `tiled/maps/main.tmx`
- `tiled/maps/main.export.json`
- `tiled/tilesets/world.tsx`
- `tiled/templates/*.tx`

## 版本控制建议

- TMX/TSX 与导出 JSON 一起提交
- generation report 与 patch 单独提交
- 大图资源走 LFS（如果仓库变大）

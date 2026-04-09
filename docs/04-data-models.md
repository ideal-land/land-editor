# 04 数据模型

## 1. Asset Manifest

用于描述用户素材是什么、怎么用、有什么约束。

关键字段：
- `tilesets`：图块图集
- `placeables`：可摆放对象
- `characters`：角色与动画
- `weatherAssets`：天气相关素材
- `rules`：自动铺设或可放置规则

### 设计原则
- 不依赖文件名猜测业务语义
- 对每个 placeable 给出 placementModes
- 对每个 tileset 给出 categories 和 tile tags
- 对可能影响运行时的属性（如 collision）要显式化

## 2. Scene Spec

这是整条链路最重要的协议。

它描述：
- 地图尺寸
- tile size
- 主题与风格
- 摄像机与玩家
- 天气
- 主路径
- 区域分区
- 目标对象数量与分布规则
- 验收约束

它不描述：
- 某个 tile index 放在地图的哪一格
- 某个对象的最终像素坐标
- 具体碰撞 layer data

这些由 Layout Plan 与 Builder 补足。

## 3. Layout Plan

Layout Plan 是 Scene Spec 的求解结果。

它包含：
- 归一化路径骨架
- zone polygons / rectangles
- anchor points
- object placements
- navigation grid
- blocked cells
- tile fill directives

## 4. Generation Report

每次生成都应该有 report。

建议包含：
- summary
- inputs
- outputs
- validations
- warnings
- blockers
- score
- repair actions
- screenshots / artifact refs

## 5. Weather Preset

天气独立成 schema，避免写死在单个场景里。

字段示例：
- `type`
- `intensity`
- `wind`
- `overlayAlpha`
- `ambientTint`
- `sfx`
- `useSplash`
- `fogDensity`

## 6. Scene Change Request

支持增量改动：
- 移动区域
- 增减对象
- 改天气
- 改道路宽度
- 改出生点
- 改可走区域策略

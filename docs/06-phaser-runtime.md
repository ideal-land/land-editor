# 06 Phaser 运行时设计

## 运行时职责

- 加载 Tiled 导出 JSON
- 创建 tile layers
- 绑定 collision / spawn / interactables
- 生成玩家与相机跟随
- 挂载天气系统
- 为调试层提供开关

## 模块建议

### MapLoader
职责：
- load tiled JSON
- add tilesets
- create tile layers
- 建立 layer -> display object 的映射

### CollisionSystem
职责：
- 从 `collision` 层或对象层建立碰撞
- 与玩家/NPC 绑定物理阻挡

### SpawnSystem
职责：
- 读取 `spawn_points`
- 决定默认出生点
- 支持从 change request 重定向出生点

### InteractionSystem
职责：
- 读取 `interactables`
- 把 Tiled 对象转换为 runtime entity
- 注册 overlap / key press 触发

### WeatherSystem
职责：
- 消费 weather preset
- 生成粒子、屏幕 tint、overlay、音效

### CameraSystem
职责：
- follow player
- 限定世界边界
- 支持 debug fly mode（可选）

## 推荐的运行时绑定顺序

1. 预加载 tileset / sprite / particle texture
2. 加载 Tiled JSON
3. 构建地表层与建筑层
4. 建立 collision
5. 读取 spawn 并创建 player
6. 相机跟随
7. 创建 interactables
8. 应用 weather preset
9. 启用 debug toggle

## Weather 设计建议

天气不直接和单场景耦合，而是读取 preset：

```json
{
  "type": "rain",
  "intensity": 0.35,
  "wind": 0.12,
  "overlayAlpha": 0.08,
  "ambientTint": "#90a0b8",
  "useSplash": true
}
```

### 雨
- 粒子：细长下落
- 可选 splash
- 轻度冷色环境 tint

### 雪
- 粒子：低速漂浮
- 风向更明显
- 允许更大的粒子尺寸范围

### 雾
- 可选 overlay + slowly moving particles
- 更依赖 screen-space 表现

## 相机与像素风

- 开启 pixelArt 模式
- 缩放时注意 tile 对齐
- camera bounds 必须匹配世界尺寸
- 避免把 TilemapLayer 放进 Container

## 推荐调试开关

- `showCollision`
- `showObjectBounds`
- `showSpawnPoints`
- `showNavGrid`
- `disableWeather`
- `freeCamera`

## 运行时和地图的边界

运行时只读取稳定字段，不推断。
例如：
- `SpawnPoint.isDefault`
- `Interactable.kind`
- `WeatherZone.presetId`

不要在 runtime 中靠对象名字或 layer 顺序猜语义。

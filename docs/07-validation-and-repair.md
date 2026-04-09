# 07 验证与修复

## 为什么生成系统必须自带 Validator

没有 validator，系统只会“看起来生成了东西”，但你无法知道：
- 玩家是否能走
- 出生点是否合理
- 长椅是否真的沿路摆放
- 建筑入口是否可达
- 天气是否遮挡过度
- 对象是否密度失衡

## 建议的验证器

### 1. Schema Validator
- 验证 asset manifest / scene spec / layout plan / generation report

### 2. Topology Validator
- 检查道路主骨架是否连通
- 检查区域是否重叠过度
- 检查出生点是否落在 walkable 区域

### 3. Placement Validator
- bench 是否在道路边缘合理距离内
- 树木是否压住道路
- 建筑是否侵占主路
- 装饰物间距是否在阈值范围

### 4. Navigation Validator
- 玩家是否可以从默认出生点到主要功能区
- 是否出现不可达但被标成目标区域的情况

### 5. Visual Density Validator
- 地图是否过空 / 过密
- 单一区域是否对象扎堆
- 大面积空白是否超过阈值

### 6. Runtime Validator
- 相机边界是否正确
- 天气 emitter 是否创建成功
- 碰撞层是否生效

## 验证输出格式

```json
{
  "status": "warning",
  "checks": [
    {
      "id": "bench-near-road",
      "result": "warning",
      "count": 2,
      "message": "2 张 bench 未贴近主路边缘"
    }
  ],
  "score": {
    "playability": 0.92,
    "layout": 0.86,
    "visualBalance": 0.74
  }
}
```

## 自动修复策略

### 出生点不可达
- 移动到最近 walkable anchor

### 道路断裂
- 触发最短路径修复

### 对象重叠
- 先局部退让，再尝试替换候选点

### 天气过强
- 下调 intensity 和 overlayAlpha

## 人工回退条件

下面情况建议直接退回人工或半自动阶段：
- 素材不足以支撑用户需求
- 建筑拼接规则不明
- 自动铺设导致明显视觉破坏
- 需要美术层面的精细修边

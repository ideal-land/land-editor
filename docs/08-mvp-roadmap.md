# 08 MVP 路线与交付范围

## MVP 边界

### 输入
- 1 套 tileset
- 1 套角色 spritesheet
- 少量 placeable 对象
- 1 段用户描述

### 能力
- 生成 1 张正交地图
- 支持道路 + 2~4 个区域
- 支持 10~50 个装饰对象
- 支持玩家移动与相机跟随
- 支持 1 种天气（雨或雪）
- 输出 Tiled 工程与 Phaser 预览

### 不做
- 多地图切换
- NPC 行为树
- 复杂任务系统
- 大规模程序化地形

## 里程碑

### M1 资产与协议打底
- asset manifest
- scene spec
- layout plan
- generation report
- 基础 schema 校验

### M2 地图构建闭环
- Layout Engine
- Tiled Builder
- 导出 JSON
- Phaser 加载并运行

### M3 验证与修复
- spawn / path / density validator
- generation report 评分
- 失败自动修复

### M4 变更请求
- 支持 change request
- 输出 patch
- 不重建全部地图

## 工程组织建议

- Monorepo
- `packages/scene-schema`
- `packages/map-builder`
- `packages/asset-analyzer`
- `packages/validator`
- `packages/runtime-core`
- `apps/runtime-phaser`
- `apps/agent-orchestrator`

## 建议技术栈

- TypeScript
- Node.js
- Vite
- Phaser
- Tiled
- zod
- Playwright
- sharp
- jsondiffpatch

## 首批验收标准

- 给定样例素材包与描述，10 分钟内能自动产出运行场景
- 玩家能从默认出生点走到主要区域
- 生成报告能指出 blockers / warnings
- 修改“天气、小路宽度、长椅数量”时能增量重建

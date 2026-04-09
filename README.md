# Land Editor

这是一个围绕 **Phaser + Tiled + Agent** 的像素场景生成系统设计包。
目标是让系统从“用户上传像素素材 + 自然语言描述”出发，生成：

- 可运行的 Phaser 场景
- 可继续编辑的 Tiled 工程
- 可验证、可回滚、可迭代的生成记录
- 用于 agent 编排的结构化协议与 JSON Schema

## 你会在这个压缩包里看到什么

- `docs/`：系统设计、模块说明、Tiled 规范、Phaser 运行时设计、校验与修复流程、MVP 路线
- `schemas/`：核心 JSON Schema
- `examples/`：样例输入输出
- `packages/`：代码骨架（Schema、Builder、Analyzer、Validator、Runtime）
- `apps/`：Phaser 运行时与 Agent 编排器骨架
- `scripts/`：Tiled CLI 导出脚本与本地校验示例

## 核心设计原则

1. **LLM 不直接铺图**  
   LLM 负责把自然语言变成 `Scene Spec` 与布局计划；最终落图交给规则引擎与 map builder。

2. **Tiled 是地图中间标准**  
   所有地图资产都能落成 Tiled 工程，支持人工微调、CLI 导出、JSON 交换和后续版本化管理。

3. **Phaser 是运行时，不是生成器**  
   运行时只消费稳定 schema 和 Tiled 导出物，负责渲染、角色移动、天气、碰撞、交互。

4. **生成必须可验证、可修复、可迭代**  
   每次生成都输出报告、截图、统计、违规项与可回滚补丁。

## 推荐落地顺序

### 第 1 阶段：最小闭环
- 接入 1 套 tileset + 1 套角色素材
- 支持 1 张正交地图
- 支持道路、区域、装饰物、出生点、碰撞、1 种天气
- 输出 Phaser 预览 + Tiled 工程 + generation report

### 第 2 阶段：可迭代编辑
- 支持“变更请求”而不是整图重建
- 输出 patch / diff
- 允许用户持续指令式修改

### 第 3 阶段：复杂世界装配
- 多地图
- 传送点
- 区域化天气
- NPC 与脚本事件
- 昼夜系统

## 推荐目录消费方式

- 先读 `docs/01-system-overview.md`
- 再读 `docs/02-architecture.md`
- 然后读 `docs/04-data-models.md` 与 `docs/05-tiled-conventions.md`
- 如果你准备开始写代码，直接看 `packages/` 和 `apps/`

## 一句话总结

这套方案的目标不是“帮你自动摆一张图”，而是提供一条**可反复生产像素场景**的标准流水线。

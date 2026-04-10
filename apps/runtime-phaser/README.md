# runtime-phaser

这里放最终运行的 Phaser 应用：
- 读取 `tiled/maps/main.export.json`
- 读取 `generated/weather-preset.json`
- 右下角有对话输入框，调用 `http://localhost:8787/generate`
- 创建 player / collision / camera / interactables

当前仍是轻量实现，但已经支持对接 orchestrator 生成产物做直接预览。

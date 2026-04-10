# agent-orchestrator

负责串起：
- 素材分析
- Scene Spec 生成
- Layout 规划
- Map Builder
- Validator
- Repair Loop

## OpenAI 兼容模型接入（AI SDK）

本项目提供了 `createOpenAICompatibleIntentAgent` 和 `runOpenAICompatiblePipeline`，用于把 OpenAI 兼容模型接入全链路。

### 1) 安装依赖

```bash
npm i ai @ai-sdk/openai-compatible
```

### 2) 调用入口

```ts
import { runOpenAICompatiblePipeline } from './src/run-openai-compatible';

const result = await runOpenAICompatiblePipeline({
  userPrompt: '做一个雨天像素公园，有主路、长椅和路灯',
  projectId: 'demo-project',
  tileSize: 16,
  assetRoot: '/path/to/uploaded-assets',
  agent: {
    modelId: 'gpt-4o-mini',
    baseURL: process.env.OPENAI_COMPAT_BASE_URL!,
    apiKey: process.env.OPENAI_COMPAT_API_KEY!
  }
});

console.log(result.sceneSpec, result.layoutPlan, result.report);
```

### 3) 链路说明

`assetRoot -> analyzeAssets -> intentAgent(generateSceneSpec) -> buildMap -> validateScene`

如果素材缺少 tileset 或角色，会在 `analyzeAssets` 阶段直接失败（unresolved）。


### 4) 一次性落盘输出产物

```ts
import { runOpenAICompatiblePipelineAndSave } from './src/run-openai-compatible';

const result = await runOpenAICompatiblePipelineAndSave({
  userPrompt: '做一个雨天像素公园，有主路、长椅和路灯',
  projectId: 'demo-project',
  tileSize: 16,
  assetRoot: '/path/to/uploaded-assets',
  outputDir: '/path/to/output',
  agent: {
    modelId: 'gpt-4o-mini',
    baseURL: process.env.OPENAI_COMPAT_BASE_URL!,
    apiKey: process.env.OPENAI_COMPAT_API_KEY!
  }
});

console.log(result.outputPaths);
// { assetManifest, sceneSpec, layoutPlan, tiledMap, generationReport }
```


### 5) CLI 快速跑全链路

```bash
USER_PROMPT='做一个雨天像素公园' \
PROJECT_ID='demo-project' \
TILE_SIZE='16' \
ASSET_ROOT='/path/to/uploaded-assets' \
OUTPUT_DIR='/path/to/output' \
MODEL_ID='gpt-4o-mini' \
OPENAI_COMPAT_BASE_URL='https://your-openai-compatible-endpoint/v1' \
OPENAI_COMPAT_API_KEY='your-key' \
RUNTIME_PREVIEW_DIR='/absolute/path/to/apps/runtime-phaser/public' \
node ./apps/agent-orchestrator/src/cli.ts
```


### 6) 自动创建试用目录（推荐先执行）

```bash
npm run trial:init
```

执行后会自动创建：
- `trial-data/assets-upload`（你只需要把素材放这里）
- `trial-data/output`（生成结果输出）
- `apps/runtime-phaser/public/tiled/maps`
- `apps/runtime-phaser/public/generated`
- `.env.trial`（已自动填好本地目录路径）

### 6) 验收试用（推荐）

```bash
cp apps/agent-orchestrator/trial.env.example .env.trial
# 修改 .env.trial 里的路径和 key
set -a && source ./.env.trial && set +a
npm run trial:openai
```

成功后会在 `OUTPUT_DIR` 下看到：
- `asset-manifest.json`
- `scene-spec.json`
- `layout-plan.json`
- `tiled-map.json`
- `generation-report.json`


### 7) 用 Asset Label Agent 做语义标注（推荐生产环境）

`analyzeAssets` 支持传入 `labelAgent`。

这样即使素材文件名是 `a.png`，也可以由 agent 返回语义标签（例如 `tree`、`hero`），再进入后续 SceneSpec 生成。


### 8) 对话式试用（你说一句，agent 生成一版）

把素材放到 `trial-data/assets-upload` 后，执行：

```bash
set -a && source ./.env.trial && set +a
npm run trial:chat
```

- 每输入一条需求，会生成一轮结果到 `trial-data/output/turn-001`、`turn-002`...
- 同时会同步最新结果到 `apps/runtime-phaser/public` 供前端预览。


### 9) 网页实时对话链路（你要的完整链路）

1. `npm run trial:init`
2. 把素材放进 `trial-data/assets-upload`
3. `set -a && source ./.env.trial && set +a`
4. 启动生成 API：

```bash
npm run trial:webapi
```

5. 启动 `runtime-phaser` 前端后，在页面右下角输入需求并点击“生成并刷新预览”，即可看到最新生成结果。

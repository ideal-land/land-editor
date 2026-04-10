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

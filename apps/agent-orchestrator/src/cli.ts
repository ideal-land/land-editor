import { runOpenAICompatiblePipelineAndSave } from './run-openai-compatible';

async function main(): Promise<void> {
  const userPrompt = process.env.USER_PROMPT;
  const projectId = process.env.PROJECT_ID;
  const tileSizeRaw = process.env.TILE_SIZE;
  const assetRoot = process.env.ASSET_ROOT;
  const outputDir = process.env.OUTPUT_DIR;
  const modelId = process.env.MODEL_ID;
  const runtimePreviewDir = process.env.RUNTIME_PREVIEW_DIR;
  const baseURL = process.env.OPENAI_COMPAT_BASE_URL;
  const apiKey = process.env.OPENAI_COMPAT_API_KEY;

  if (!userPrompt || !projectId || !tileSizeRaw || !assetRoot || !outputDir || !modelId || !baseURL || !apiKey || !runtimePreviewDir) {
    throw new Error('缺少必填环境变量: USER_PROMPT, PROJECT_ID, TILE_SIZE, ASSET_ROOT, OUTPUT_DIR, MODEL_ID, OPENAI_COMPAT_BASE_URL, OPENAI_COMPAT_API_KEY, RUNTIME_PREVIEW_DIR');
  }

  const tileSize = Number(tileSizeRaw);
  if (!Number.isInteger(tileSize) || tileSize < 8) {
    throw new Error('TILE_SIZE 必须是 >= 8 的整数');
  }

  const result = await runOpenAICompatiblePipelineAndSave({
    userPrompt,
    projectId,
    tileSize,
    assetRoot,
    outputDir,
    runtimePreviewDir,
    agent: {
      modelId,
      baseURL,
      apiKey
    }
  });

  console.log(JSON.stringify(result.outputPaths, null, 2));
}

void main();
